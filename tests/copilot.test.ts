import { expect, test } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildPrompt, CopilotEngine } from '../src/engines/copilot.js'
import { PreflightCache } from '../src/preflight.js'
import type { Task } from '../src/types.js'

const FAKE = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'fake-copilot.mjs')
const T: Task = { id: 'ab12cd34', text: '修好登入頁', line: 0, status: 'open' }

function engine(mode: string, hashes: (string | undefined)[], timeoutMs = 10_000): CopilotEngine {
  process.env.FAKE_COPILOT_MODE = mode
  const cache = new PreflightCache(join(mkdtempSync(join(tmpdir(), 'adng-cp-')), 'pf.json'))
  let i = 0
  return new CopilotEngine({
    // baseArgs 覆寫成 node+fixture：測 JSONL 解析與判定邏輯，不打真 copilot/真 API
    command: process.execPath, baseArgs: [FAKE], timeoutMs, pingTimeoutMs: 10_000,
    cache, getCommitHash: () => hashes[Math.min(i++, hashes.length - 1)]
  })
}

test('JSONL 正常流＋有新 commit → ok、premiumRequests/codeChanges 記錄於 output、costUsd 0＋costUnknown', async () => {
  const e = engine('ok', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(true)
  expect(r.commitHash).toBe('bbb')
  expect(r.baseCommitHash).toBe('aaa')
  expect(r.output).toContain('premiumRequests=2') // usage 尾事件有解析記錄（僅記錄不當金額）
  expect(r.output).toContain('codeChanges=+3/-1 files=1')
  expect(r.costUsd).toBe(0)
  expect(r.costUnknown).toBe(true) // scheduler 依 config costPerRunUsd 入帳，此 0 只是佔位
})

test('current SDK data.content is retained with the flat result event', async () => {
  const r = await engine('sdk', ['aaa', 'bbb']).run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(true)
  expect(r.output).toContain('SDK task completed')
  expect(r.output).toContain('premiumRequests=1')
})

test('JSONL 毒行容錯（專屬，Task 3 LOW-1 教訓）：非 JSON/截斷殘行/空白行混雜 → 照樣解析 result、ok', async () => {
  const e = engine('poison', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(true)
  expect(r.output).toContain('premiumRequests=2') // 毒行被跳過，result 尾事件仍被撈到
})

test('encrypted blob 巨大行（>200k，含合法 JSON 與非 JSON 雙病態）→ 跳過不 parse、不炸、ok', async () => {
  const e = engine('blob', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(true)
  expect(r.output).not.toContain('xxxxx') // blob 內容沒滲進 output
  expect(r.output).toContain('premiumRequests=2')
})

test('argv 截長：directive 超長 → prompt ≤6000、任務開頭保留、commit 硬話結尾保留、中段截', async () => {
  const longDirective = `任務開頭MARKER：修好登入頁。${'填'.repeat(10_000)}`
  const p = buildPrompt({ task: T, projectPath: process.cwd(), directive: longDirective })
  expect(p.length).toBeLessThanOrEqual(6000)
  expect(p.startsWith('你是自動開發工人')).toBe(true)
  expect(p).toContain('任務開頭MARKER') // 任務文字開頭活著
  expect(p).toContain('[adng: prompt 截長]') // 中段截有標記
  expect(p.endsWith('嚴禁超出任務範圍、嚴禁動 BACKLOG.md、嚴禁自行新增任務。')).toBe(true) // 硬話結尾活著
  expect(p).toContain('git add -A 與 git commit')
  // 經 fixture 實跑驗證 argv 真的收到截長後 prompt
  const e = engine('ok', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd(), directive: longDirective })
  const m = /len=(\d+)/.exec(r.output)
  expect(m).not.toBeNull()
  expect(Number(m![1])).toBeLessThanOrEqual(6000)
  expect(r.output).toContain('嚴禁自行新增任務') // argv 尾端硬話真的送達 CLI
})

test('surrogate pair 切點防呆（M5 小修 1）：截 6000 落在 emoji pair 中間 → 退一位，不產生落單 surrogate', () => {
  for (const pad of ['', 'x']) { // 兩種奇偶對齊輪流測：切點必有一種落在 pair 正中間
    const p = buildPrompt({ task: T, projectPath: process.cwd(), directive: `${pad}${'😀'.repeat(8000)}` })
    expect(p.length).toBeLessThanOrEqual(6000)
    // u 旗標下 lone surrogate 類別只匹配未成對的 surrogate（成對者是單一 code point 不進此類別）
    expect(/[\uD800-\uDFFF]/u.test(p)).toBe(false) // 無落單 surrogate（落單→argv 轉碼 U+FFFD 亂碼，審查實測）
  }
})

test('argv 無截斷（短 prompt）：全文原樣送達、directive 優先於 task.text', async () => {
  const e = engine('ok', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd(), directive: '修好登入頁\nDIRECTIVE-MARKER：port 3210 不要殺' })
  expect(r.output).toContain('DIRECTIVE-MARKER')
  expect(r.output).not.toContain('prompt 截長')
})

test('exit 非零 → ok:false 且 stderr 進 failureReason、costUnknown=true', async () => {
  const e = engine('fail', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('quota exhausted')
  expect(r.costUsd).toBe(0)
  expect(r.costUnknown).toBe(true)
})

test('hang → timeout、costUnknown=true（timeout 輪照樣可能已燒額度）', async () => {
  const e = engine('hang', ['aaa', 'aaa'], 1500)
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toBe('timeout')
  expect(r.costUnknown).toBe(true)
}, 15_000)

test('silent-fail 防呆：exit 0 零輸出 → ok:false（踩雷 §13）', async () => {
  const e = engine('empty', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('silent-fail')
})

test('silent-fail 防呆：exit 0、有事件但無 result 尾事件 → ok:false', async () => {
  const e = engine('no-result', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('result 尾事件')
})

test('result 事件 exitCode 非 0（雙重確認）→ ok:false', async () => {
  const e = engine('result-exit-fail', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('result.exitCode 3')
})

test('result 有、但無新 commit → no-commit phantom completion 失敗', async () => {
  const e = engine('ok', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('no-commit')
})

test('preflight：PONG＋result 事件判 ok，第二次走 cache（fake 換 fail 仍 ok）', async () => {
  const e = engine('ok', ['a'])
  const r1 = await e.preflight()
  expect(r1.ok).toBe(true)
  process.env.FAKE_COPILOT_MODE = 'fail'
  expect((await e.preflight()).ok).toBe(true) // cache 命中，沒真打第二發
})

test('preflight：exit 0 但無 result 尾事件 → 判失敗且 cache 壞結果', async () => {
  const e = engine('no-result', ['a'])
  expect((await e.preflight()).ok).toBe(false)
  process.env.FAKE_COPILOT_MODE = 'ok'
  expect((await e.preflight()).ok).toBe(false) // 仍是 cache 的壞結果
})
