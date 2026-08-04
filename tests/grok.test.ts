import { expect, test } from 'vitest'
import { existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { GrokEngine, parseResultJson } from '../src/engines/grok.js'
import { PreflightCache } from '../src/preflight.js'
import type { Task } from '../src/types.js'

const FAKE = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'fake-grok.mjs')
const T: Task = { id: 'ab12cd34', text: '修好登入頁', line: 0, status: 'open' }

function engine(mode: string, hashes: (string | undefined)[], timeoutMs = 10_000): GrokEngine {
  process.env.FAKE_GROK_MODE = mode
  const cache = new PreflightCache(join(mkdtempSync(join(tmpdir(), 'adng-gk-')), 'pf.json'))
  let i = 0
  return new GrokEngine({
    // baseArgs 覆寫成 fixture：測 JSON 解析與判定邏輯，不打真 grok/真 xAI
    command: process.execPath, baseArgs: [FAKE], timeoutMs, pingTimeoutMs: 10_000,
    cache, getCommitHash: () => hashes[Math.min(i++, hashes.length - 1)]
  })
}

test('單一 JSON 正常流＋有新 commit → ok、costUsd 0＋costUnknown（無 usage 欄位）、telemetry 不滲進 output', async () => {
  const e = engine('ok', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(true)
  expect(r.commitHash).toBe('bbb')
  expect(r.baseCommitHash).toBe('aaa')
  expect(r.costUsd).toBe(0)
  expect(r.costUnknown).toBe(true) // scheduler 依 config costPerRunUsd 入帳，此 0 只是佔位
  expect(r.output).not.toContain('cli-chat-proxy') // 成功路徑不附 stderr（規格卡：例行雜訊）
})

test('prompt-file 寫入與清理：內容 UTF-8 無 BOM、LF、含任務與 commit 硬話；用後 tmp 檔已刪', async () => {
  const e = engine('ok', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd(), directive: '修好登入頁\r\nDIRECTIVE-MARKER：port 3210 不要殺' })
  expect(r.ok).toBe(true)
  expect(r.output).toContain('bom=0') // 無 BOM
  expect(r.output).toContain('cr=0') // CRLF 已正規化為 LF
  expect(r.output).toContain('你是自動開發工人') // head：prompt 開頭活著
  expect(r.output).toContain('DIRECTIVE-MARKER') // tail：directive 優先於 task.text 且送達
  const m = /file=(\S+)/.exec(r.output)
  expect(m).not.toBeNull()
  expect(existsSync(m![1]!)).toBe(false) // 用後即刪，不殘留 prompt 內容
})

test('JSON 毒行容錯（照 copilot 標準）：非 JSON/截斷殘行混雜在 pretty JSON 前 → 取可解析尾段、ok', async () => {
  const e = engine('poison', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(true)
  expect(r.output).toContain('done') // 毒行被跳過，尾段 JSON 仍被撈到
})

test('單行 JSON 兼容（非 pretty 也要解得動）→ ok', async () => {
  const e = engine('oneline', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(true)
  expect(r.output).toContain('done')
})

test('exit 非零 → ok:false、stderr 進 failureReason 且 telemetry 雜訊已濾、prompt-file 已清', async () => {
  const e = engine('fail', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('credit exhausted') // 真錯誤留下
  expect(r.failureReason).not.toContain('cli-chat-proxy') // telemetry 行濾掉
  expect(r.costUnknown).toBe(true)
  const m = /file=(\S+)/.exec(r.output)
  expect(m).not.toBeNull()
  expect(existsSync(m![1]!)).toBe(false) // 失敗路徑 tmp 檔同樣清掉（finally）
})

test('silent-fail 防呆：exit 0 但輸出不可解析（非 JSON 文字）→ ok:false', async () => {
  const e = engine('unparseable', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('empty-or-unparseable') // exit 0 但非 JSON → silent-fail
})

test('silent-fail 防呆：exit 0 零輸出 → ok:false（規格卡探針 1 實錄）', async () => {
  const e = engine('empty', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('empty-or-unparseable')
  expect(r.costUnknown).toBe(true)
})

test('hang → timeout、costUnknown=true（timeout 輪照樣可能已燒額度）', async () => {
  const e = engine('hang', ['aaa', 'aaa'], 1500)
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toBe('timeout')
  expect(r.costUnknown).toBe(true)
}, 30_000)

test('JSON 有、但無新 commit → no-commit phantom completion 失敗', async () => {
  const e = engine('ok', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('no-commit')
})

test('preflight：真探針 PONG 判 ok，第二次走 cache（fake 換 fail 仍 ok）', async () => {
  const e = engine('ok', ['a'])
  const r1 = await e.preflight()
  expect(r1.ok).toBe(true)
  process.env.FAKE_GROK_MODE = 'fail'
  expect((await e.preflight()).ok).toBe(true) // cache 命中，沒真打第二發
})

test('preflight：exit 0 但無可解析 JSON（grok models 謊報類故障形貌）→ 判失敗且 cache 壞結果', async () => {
  const e = engine('unparseable', ['a'])
  expect((await e.preflight()).ok).toBe(false)
  process.env.FAKE_GROK_MODE = 'ok'
  expect((await e.preflight()).ok).toBe(false) // 仍是 cache 的壞結果
})

// ---------------------------------------------------------------------------
// 統一小修輪#8：parseResultJson 前置 startsWith 便宜檢查（防大量尾隨雜訊 O(n²) 退化）

test('小修輪#8：parseResultJson 容前綴毒行、由下往上找到延伸至文末的 pretty JSON', () => {
  const pretty = '{\n  "ok": true,\n  "n": 42\n}'
  const out = `telemetry noise 1\nnot json line\n${pretty}` // JSON 延伸到文末
  const v = parseResultJson(out)
  expect(v).not.toBeNull()
  expect(v!.n).toBe(42)
})

test('小修輪#8：純雜訊（無 { 開頭行）→ null（便宜跳過每行，不進 join+parse）', () => {
  expect(parseResultJson('noise a\nnoise b\nnoise c')).toBeNull()
})
