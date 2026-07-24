import { expect, test } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CodexEngine } from '../src/engines/codex.js'
import { PreflightCache } from '../src/preflight.js'
import type { Task } from '../src/types.js'

const FAKE = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'fake-codex.mjs')
const T: Task = { id: 'ab12cd34', text: '修好登入頁', line: 0, status: 'open' }

function engine(mode: string, hashes: (string | undefined)[], timeoutMs = 10_000): CodexEngine {
  process.env.FAKE_CODEX_MODE = mode
  const cache = new PreflightCache(join(mkdtempSync(join(tmpdir(), 'adng-cx-')), 'pf.json'))
  let i = 0
  return new CodexEngine({
    // baseArgs/pingArgs 覆寫成 node+fixture：測 JSONL 解析與判定邏輯，不打真 codex/真 API
    command: process.execPath, baseArgs: [FAKE], pingArgs: [FAKE], timeoutMs, pingTimeoutMs: 10_000,
    cache, getCommitHash: () => hashes[Math.min(i++, hashes.length - 1)]
  })
}

test('JSONL 正常流＋有新 commit → ok、commitHash、tokens 記錄於 output、costUsd 0＋costUnknown（無 USD 真值）', async () => {
  const e = engine('ok', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(true)
  expect(r.commitHash).toBe('bbb')
  expect(r.baseCommitHash).toBe('aaa')
  expect(r.output).toContain('in=20804') // turn.completed 的 usage tokens 有記錄
  expect(r.costUsd).toBe(0)
  expect(r.costUnknown).toBe(true) // scheduler 依 config costPerRunUsd 入帳，此 0 只是佔位
})

test('JSONL 毒行專測（M5 小修 7）：合法事件＋垃圾行＋半截 JSON 行混流 → 不炸、turn.completed/usage 正常取值、ok', async () => {
  const e = engine('poison', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(true)
  expect(r.output).toContain('done: poison-mode') // 毒行被跳過，agent_message 仍被撈到
  expect(r.output).toContain('in=7') // turn.completed 的 usage 也正常取值
})

test('silent-fail 防呆：exit 0 零輸出 → ok:false（踩雷 §13＋codex silent-fail 前科）', async () => {
  const e = engine('empty', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('silent-fail')
  expect(r.costUnknown).toBe(true)
})

test('silent-fail 防呆：exit 0、有事件但無 turn.completed → ok:false', async () => {
  const e = engine('no-turn', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('turn.completed')
})

test('exit 非零 → ok:false 且 stderr 進 failureReason、costUnknown=true', async () => {
  const e = engine('fail', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('simulated 429')
  expect(r.costUsd).toBe(0)
  expect(r.costUnknown).toBe(true)
})

test('hang → timeout、costUnknown=true（timeout 輪照樣燒訂閱額度）', async () => {
  const e = engine('hang', ['aaa', 'aaa'], 1500)
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toBe('timeout')
  expect(r.costUnknown).toBe(true)
}, 15_000)

test('turn.completed 有、但無新 commit → no-commit phantom completion 失敗', async () => {
  const e = engine('ok', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('no-commit')
})

test('prompt 組裝沿模板：directive 優先＋git add/commit 硬話真的進 prompt', async () => {
  const e = engine('ok', ['aaa', 'bbb'])
  const r = await e.run({
    task: T, projectPath: process.cwd(),
    directive: '修好登入頁\n\nDIRECTIVE-MARKER：port 3210 是使用者的進程，不要殺'
  })
  expect(r.output).toContain('DIRECTIVE-MARKER')
  expect(r.output).toContain('git add -A')
  expect(r.output).toContain('整輪作廢')
})

test('preflight：PONG＋turn.completed 判 ok，第二次走 cache（fake 換 fail 仍 ok）', async () => {
  const e = engine('ok', ['a'])
  const r1 = await e.preflight()
  expect(r1.ok).toBe(true)
  process.env.FAKE_CODEX_MODE = 'fail'
  expect((await e.preflight()).ok).toBe(true) // cache 命中，沒真打第二發
})

test('preflight：exit 0 但無 turn.completed（如 silent-fail）判失敗且 cache 壞結果', async () => {
  const e = engine('no-turn', ['a'])
  expect((await e.preflight()).ok).toBe(false)
  process.env.FAKE_CODEX_MODE = 'ok'
  expect((await e.preflight()).ok).toBe(false) // 仍是 cache 的壞結果
})

test('effort 設定 → baseArgs 注入 -c model_reasoning_effort，pingArgs 不注入（ping 不燒推理）', () => {
  const cache = new PreflightCache(join(mkdtempSync(join(tmpdir(), 'adng-cx-')), 'pf.json'))
  const e = new CodexEngine({ cache, model: 'gpt-5.6-terra', effort: 'xhigh' }) as never as { baseArgs: string[]; pingArgs: string[] }
  expect(e.baseArgs).toContain('model_reasoning_effort=xhigh')
  expect(e.baseArgs.join(' ')).toContain('-c model_reasoning_effort=xhigh')
  expect(e.pingArgs).not.toContain('model_reasoning_effort=xhigh')
})

test('effort 未設 → args 與舊版一致（向後相容）', () => {
  const cache = new PreflightCache(join(mkdtempSync(join(tmpdir(), 'adng-cx-')), 'pf.json'))
  const e = new CodexEngine({ cache, model: 'gpt-5.6-terra' }) as never as { baseArgs: string[] }
  expect(e.baseArgs.join(' ')).not.toContain('model_reasoning_effort')
})
