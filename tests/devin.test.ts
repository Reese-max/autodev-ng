import { expect, test } from 'vitest'
import { existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DevinEngine, hasExecCommit } from '../src/engines/devin.js'
import { PreflightCache } from '../src/preflight.js'
import type { Task } from '../src/types.js'

const FAKE = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'fake-devin.mjs')
const T: Task = { id: 'ab12cd34', text: '修好登入頁', line: 0, status: 'open' }

function engine(mode: string, hashes: (string | undefined)[], timeoutMs = 10_000): DevinEngine {
  process.env.FAKE_DEVIN_MODE = mode
  const cache = new PreflightCache(join(mkdtempSync(join(tmpdir(), 'adng-dv-')), 'pf.json'))
  let i = 0
  return new DevinEngine({
    // baseArgs 覆寫成 fixture：測 export 解析與判定邏輯，不打真 devin.exe
    command: process.execPath, baseArgs: [FAKE], timeoutMs, pingTimeoutMs: 10_000,
    cache, getCommitHash: () => hashes[Math.min(i++, hashes.length - 1)]
  })
}

test('export 解析正常流＋有新 commit → ok、commitHash、usage 記錄於 output、costUsd 0＋costUnknown', async () => {
  const e = engine('ok', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(true)
  expect(r.commitHash).toBe('bbb')
  expect(r.baseCommitHash).toBe('aaa')
  expect(r.costUsd).toBe(0)
  expect(r.costUnknown).toBe(true) // scheduler 依 config costPerRunUsd 入帳，此 0 是官方 0 credit multiplier 保證非估計
  expect(r.output).toContain('in=1234') // export final_metrics 有記錄
  expect(r.output).toContain('steps=3')
})

test('prompt-file/export 寫入與清理：內容 UTF-8 無 BOM、LF、含硬話（commit＋反 handoff）；用後兩檔皆刪', async () => {
  const e = engine('ok', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd(), directive: '修好登入頁\r\nDIRECTIVE-MARKER：port 3210 不要殺' })
  expect(r.ok).toBe(true)
  expect(r.output).toContain('bom=0') // 無 BOM
  expect(r.output).toContain('cr=0') // CRLF 已正規化為 LF
  expect(r.output).toContain('你是自動開發工人') // head：prompt 開頭活著
  expect(r.output).toContain('嚴禁呼叫 handoff/cloud/remote') // head：反 handoff 硬話真的送達
  expect(r.output).toContain('DIRECTIVE-MARKER') // tail：directive 優先於 task.text 且送達
  const pm = /promptFile=(\S+)/.exec(r.output)
  const em = /exportFile=(\S+)/.exec(r.output)
  expect(pm).not.toBeNull(); expect(em).not.toBeNull()
  expect(existsSync(pm![1]!)).toBe(false) // prompt tmp 檔用後即刪
  expect(existsSync(em![1]!)).toBe(false) // export tmp 檔用後即刪
})

test('export 有效但無 exec git commit 步驟＋無新 commit → no-commit 且附加「export 亦無 exec git commit 步驟」提示', async () => {
  const e = engine('no-exec-commit', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('no-commit')
  expect(r.failureReason).toContain('export 亦無 exec git commit 步驟')
})

test('export 有 exec git commit 步驟、但無新 commit → no-commit 失敗且不附加 export 提示（真相仍是 commit hash）', async () => {
  const e = engine('ok', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('no-commit')
  expect(r.failureReason).not.toContain('export 亦無')
})

test('silent-fail 防呆：exit 0 但沒寫 export 檔 → ok:false（純 stdout 不可信）', async () => {
  const e = engine('no-export', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('silent-fail')
  expect(r.failureReason).toContain('無 export JSON')
  expect(r.costUnknown).toBe(true)
})

test('silent-fail 防呆：exit 0 但 export 檔內容非 JSON（損毀）→ ok:false', async () => {
  const e = engine('malformed-export', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('silent-fail')
})

test('exit 非零 → ok:false、stderr 走 [stderr] fallback 附進 output（鐵律 #7 不吞 stderr）', async () => {
  const e = engine('fail', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('credit exhausted')
  expect(r.output).toContain('[stderr]')
  expect(r.output).toContain('credit exhausted')
  expect(r.costUnknown).toBe(true)
})

test('hang → timeout、costUnknown=true（timeout 輪照樣可能已燒配額）', async () => {
  const e = engine('hang', ['aaa', 'aaa'], 1500)
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toBe('timeout')
  expect(r.costUnknown).toBe(true)
}, 15_000)

test('preflight：真探針 PONG 判 ok，第二次走 cache（fake 換 no-export 仍 ok）', async () => {
  const e = engine('ok', ['a'])
  const r1 = await e.preflight()
  expect(r1.ok).toBe(true)
  process.env.FAKE_DEVIN_MODE = 'no-export'
  expect((await e.preflight()).ok).toBe(true) // cache 命中，沒真打第二發
})

test('preflight：no PONG（export silent-fail 形貌）→ 判失敗且 cache 壞結果', async () => {
  const e = engine('no-export', ['a'])
  expect((await e.preflight()).ok).toBe(false)
  process.env.FAKE_DEVIN_MODE = 'ok'
  expect((await e.preflight()).ok).toBe(false) // 仍是 cache 的壞結果
})

// ---------------------------------------------------------------------------
// hasExecCommit 單元測試：export.json steps[].tool_calls[] 解析（輔助訊號，非真相來源）

test('hasExecCommit：exec 步驟含 git commit → true', () => {
  expect(hasExecCommit({ steps: [{ tool_calls: [{ function_name: 'exec', arguments: { command: 'git add -A && git commit -m x' } }] }] })).toBe(true)
})

test('hasExecCommit：只有 read/edit 步驟、無 exec → false', () => {
  expect(hasExecCommit({ steps: [{ tool_calls: [{ function_name: 'edit' }] }] })).toBe(false)
})

test('hasExecCommit：exec 步驟但 command 不含 git commit（如純 ls）→ false', () => {
  expect(hasExecCommit({ steps: [{ tool_calls: [{ function_name: 'exec', arguments: { command: 'ls -la' } }] }] })).toBe(false)
})

test('hasExecCommit：steps 缺失/空陣列 → false（不炸）', () => {
  expect(hasExecCommit({})).toBe(false)
  expect(hasExecCommit({ steps: [] })).toBe(false)
})
