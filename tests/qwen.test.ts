import { expect, test } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { QwenEngine } from '../src/engines/qwen.js'
import { PreflightCache } from '../src/preflight.js'
import type { Task } from '../src/types.js'

const FAKE = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'fake-qwen.mjs')
const T: Task = { id: 'ab12cd34', text: '修好登入頁', line: 0, status: 'open' }

function engine(mode: string, hashes: (string | undefined)[], timeoutMs = 10_000, extra: { baseUrl?: string; apiKey?: string; model?: string } = {}): QwenEngine {
  process.env.FAKE_QWEN_MODE = mode
  const cache = new PreflightCache(join(mkdtempSync(join(tmpdir(), 'adng-qw-')), 'pf.json'))
  let i = 0
  return new QwenEngine({
    // baseArgs 覆寫成 node+fixture：測 JSON 陣列解析與判定邏輯，不打真 qwen/真 API
    command: process.execPath, baseArgs: [FAKE], timeoutMs, pingTimeoutMs: 10_000,
    cache, getCommitHash: () => hashes[Math.min(i++, hashes.length - 1)], ...extra
  })
}

test('JSON 陣列正常流＋有新 commit → ok、tokens/per-model stats 記錄於 output 尾、costUsd 0＋costUnknown', async () => {
  const e = engine('ok', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(true)
  expect(r.commitHash).toBe('bbb')
  expect(r.baseCommitHash).toBe('aaa')
  expect(r.output).toContain('[tokens in=20804 out=39 total=31000') // usage 僅記錄不當金額
  expect(r.output).toContain('gpt-5.4-mini:req=3') // per-model stats（規格卡：含 memory-extractor 的 3 requests）
  expect(r.costUsd).toBe(0)
  expect(r.costUnknown).toBe(true) // scheduler 依 config costPerRunUsd 入帳，此 0 只是佔位
})

test('毒行容錯（照 copilot 標準）：非 JSON/截斷殘行/空白行/超長行混雜 → 逐行 fallback 撈到 result、ok', async () => {
  const e = engine('poison', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(true)
  expect(r.output).toContain('[tokens in=20804')
  expect(r.output).not.toContain('yyyyy') // 超長行沒滲進 output
})

test('stdin prompt 送達：directive 優先、commit 硬話在 prompt 內（fixture 回聲驗證）', async () => {
  const e = engine('ok', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd(), directive: '修好登入頁\nDIRECTIVE-MARKER：port 3210 不要殺' })
  expect(r.output).toContain('DIRECTIVE-MARKER')
  expect(r.output).toContain('嚴禁自行新增任務') // prompt 尾端硬話真的經 stdin 送達
})

test('baseUrl/apiKey/model → 組裝成 --openai-base-url/--openai-api-key/-m 旗標（規格卡實測形式）', async () => {
  const e = engine('ok', ['aaa', 'bbb'], 10_000, { baseUrl: 'http://127.0.0.1:8317/v1', apiKey: 'sk-fake-not-a-real-key', model: 'gpt-5.4-mini' })
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(true)
  expect(r.output).toContain('--openai-base-url http://127.0.0.1:8317/v1')
  expect(r.output).toContain('--openai-api-key sk-fake-not-a-real-key')
  expect(r.output).toContain('-m gpt-5.4-mini')
})

test('exit 非零＋is_error JSON 走 stdout（規格卡探針 1 形貌）→ ok:false、failureReason 取 error.message 人話', async () => {
  const e = engine('fail', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('exit 1')
  expect(r.failureReason).toContain('免費額度已於 2026-04-15 停用')
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

test('silent-fail 防呆：exit 0、有事件但無 result 事件 → ok:false', async () => {
  const e = engine('no-result', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('result 事件')
})

test('exit 0 但 result 自報 is_error（雙重確認）→ ok:false、subtype 進 failureReason', async () => {
  const e = engine('is-error-exit0', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('is_error')
  expect(r.failureReason).toContain('error_max_turns')
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
  process.env.FAKE_QWEN_MODE = 'fail'
  expect((await e.preflight()).ok).toBe(true) // cache 命中，沒真打第二發
})

test('preflight：is_error JSON（免費層死亡形貌）→ 判失敗、error.message 進 detail、cache 壞結果', async () => {
  const e = engine('fail', ['a'])
  const r = await e.preflight()
  expect(r.ok).toBe(false)
  expect(r.detail).toContain('免費額度')
  process.env.FAKE_QWEN_MODE = 'ok'
  expect((await e.preflight()).ok).toBe(false) // 仍是 cache 的壞結果
})
