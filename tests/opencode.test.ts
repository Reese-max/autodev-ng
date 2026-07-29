import { expect, test } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { OpencodeEngine } from '../src/engines/opencode.js'
import { PreflightCache } from '../src/preflight.js'
import type { Task } from '../src/types.js'

const FAKE = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'fake-opencode.mjs')
const T: Task = { id: 'ab12cd34', text: '修好登入頁', line: 0, status: 'open' }

function engine(mode: string, hashes: (string | undefined)[], opts: { timeoutMs?: number; model?: string; env?: Record<string, string>; profileDir?: string } = {}): { e: OpencodeEngine; profileDir: string } {
  process.env.FAKE_OPENCODE_MODE = mode
  const dir = mkdtempSync(join(tmpdir(), 'adng-oc-'))
  const profileDir = opts.profileDir ?? join(dir, 'opencode-profile')
  let i = 0
  const e = new OpencodeEngine({
    // command/baseArgs 覆寫成 node+fixture：測 NDJSON 解析與判定邏輯，不打真 opencode/真 API
    command: process.execPath, baseArgs: [FAKE], timeoutMs: opts.timeoutMs ?? 10_000, pingTimeoutMs: 10_000,
    cache: new PreflightCache(join(dir, 'pf.json')), profileDir, model: opts.model, env: opts.env,
    getCommitHash: () => hashes[Math.min(i++, hashes.length - 1)]
  })
  return { e, profileDir }
}

test('NDJSON 正常流（含毒行）＋新 commit → ok、commitHash、cost 真值且 costUnknown 不設', async () => {
  const { e } = engine('ok', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(true)
  expect(r.commitHash).toBe('bbb')
  expect(r.baseCommitHash).toBe('aaa')
  expect(r.output).toContain('done:') // 毒行沒有炸掉 text 聚合
  expect(r.costUsd).toBeCloseTo(0.001, 6)
  expect(r.costUnknown).toBeUndefined() // 與估計值引擎不同：step_finish.cost 是可信真值
})

test('prompt 含 WORKER_GUARDS（2026-07-16 引擎遊走事故＋24bd552e 分析任務白燒回歸）', async () => {
  const { e } = engine('ok', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  // fixture ok 模式把 stdin（=prompt）前 800 字 echo 回 text → 斷言 guard 確實送進引擎
  expect(r.output).toContain('嚴禁 cd 到其他目錄') // cwd guard
  expect(r.output).toContain('調查/分析/盤點') // 分析結論須落檔 commit
})

test('多 step run → costUsd＝Σ step_finish.part.cost（tool 步＋文字步）', async () => {
  const { e } = engine('two-steps', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(true)
  expect(r.costUsd).toBeCloseTo(0.003, 6)
  expect(r.costUnknown).toBeUndefined()
})

test('免費模型 cost=0 → costUsd 0 仍是真值（costUnknown 不設）', async () => {
  const { e } = engine('free', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(true)
  expect(r.costUsd).toBe(0)
  expect(r.costUnknown).toBeUndefined()
})

test('exit 0 零輸出 → empty-output 失敗（規格卡 E11；exit 0 ≠ 成功）', async () => {
  const { e } = engine('empty', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('empty-output')
})

test('有 text 但無 step_finish → 不完整流，判失敗', async () => {
  const { e } = engine('no-step', ['aaa', 'bbb'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('empty-output')
})

test('壞 model：exit 1、錯誤在 stdout（毒行＋error 事件） → failureReason 取 error 事件、costUnknown=true', async () => {
  const { e } = engine('badmodel', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('Model not found')
  expect(r.output).toContain('ProviderModelNotFoundError') // stdout tail（stderr 全空）
  expect(r.costUsd).toBe(0)
  expect(r.costUnknown).toBe(true)
})

test('stderr fallback：stdout 全空、只有 stderr 的原生崩潰 → stderr 進 output 與 failureReason（鐵律 #7 不吞）', async () => {
  const { e } = engine('crash-stderr', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.output).toContain('[stderr]')
  expect(r.output).toContain('simulated bun segfault')
  expect(r.failureReason).toContain('simulated bun segfault')
  expect(r.costUnknown).toBe(true)
})

test('preflight：command 不在 PATH（ENOENT） → detail 指引 config engines.<tag>.command 指定完整路徑', async () => {
  process.env.FAKE_OPENCODE_MODE = 'ok'
  const dir = mkdtempSync(join(tmpdir(), 'adng-oc-'))
  const e = new OpencodeEngine({
    command: join(dir, 'no-such-opencode.exe'), timeoutMs: 10_000, pingTimeoutMs: 10_000,
    cache: new PreflightCache(join(dir, 'pf.json')), profileDir: join(dir, 'opencode-profile')
  })
  const r = await e.preflight()
  expect(r.ok).toBe(false)
  expect(r.detail).toContain('ENOENT')
  expect(r.detail).toContain('engines.<tag>.command')
})

test('hang → timeout、costUnknown=true', async () => {
  const { e } = engine('hang', ['aaa', 'aaa'], { timeoutMs: 1500 })
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toBe('timeout')
  expect(r.costUnknown).toBe(true)
}, 15_000)

test('正常流但無新 commit → no-commit phantom completion 失敗（cost 照記真值）', async () => {
  const { e } = engine('ok', ['aaa', 'aaa'])
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.ok).toBe(false)
  expect(r.failureReason).toContain('no-commit')
  expect(r.costUsd).toBeCloseTo(0.001, 6)
})

test('prompt 組裝沿模板：directive 優先＋git commit 硬話真的進 prompt', async () => {
  const { e } = engine('ok', ['aaa', 'bbb'])
  const r = await e.run({
    task: T, projectPath: process.cwd(),
    directive: '修好登入頁\n\nDIRECTIVE-MARKER：port 3210 是使用者的進程，不要殺'
  })
  expect(r.output).toContain('DIRECTIVE-MARKER')
  expect(r.output).toContain('git add -A')
  expect(r.output).toContain('整輪作廢')
})

test('XDG 隔離：spawn 環境注入 profile 下的 XDG_CONFIG_HOME/XDG_DATA_HOME＋ec.env 透傳', async () => {
  const { e, profileDir } = engine('env-echo', ['aaa', 'bbb'], { env: { OPENCODE_ZEN_KEY: 'test-key-123' } })
  const r = await e.run({ task: T, projectPath: process.cwd() })
  expect(r.output).toContain(`CFG=${join(profileDir, 'config')}`)
  expect(r.output).toContain(`DATA=${join(profileDir, 'data')}`)
  expect(r.output).toContain('KEY=test-key-123')
})

test('profile 生成：opencode.json 自動落地，zen provider 帶 {env:OPENCODE_ZEN_KEY} 引用、key 不落明文', async () => {
  const { e, profileDir } = engine('ok', ['aaa', 'bbb'], { env: { OPENCODE_ZEN_KEY: 'sk-should-not-land' } })
  await e.run({ task: T, projectPath: process.cwd() })
  const file = join(profileDir, 'config', 'opencode', 'opencode.json')
  expect(existsSync(file)).toBe(true)
  const cfg = JSON.parse(readFileSync(file, 'utf8')) as Record<string, any>
  expect(cfg.model).toBe('zen/big-pickle')
  expect(cfg.permission).toBe('allow')
  expect(cfg.provider.zen.options.apiKey).toBe('{env:OPENCODE_ZEN_KEY}')
  expect(cfg.provider.zen.models['big-pickle']).toBeDefined()
  expect(readFileSync(file, 'utf8')).not.toContain('sk-should-not-land')
})

test('profile 過期重寫：同 profileDir 換 model → opencode.json 更新為新 model', async () => {
  const a = engine('ok', ['aaa', 'bbb'])
  await a.e.run({ task: T, projectPath: process.cwd() })
  const b = engine('ok', ['aaa', 'bbb'], { model: 'zen/deepseek-v4-flash-free', profileDir: a.profileDir })
  await b.e.run({ task: T, projectPath: process.cwd() })
  const cfg = JSON.parse(readFileSync(join(a.profileDir, 'config', 'opencode', 'opencode.json'), 'utf8')) as Record<string, any>
  expect(cfg.model).toBe('zen/deepseek-v4-flash-free')
  expect(cfg.provider.zen.models['deepseek-v4-flash-free']).toBeDefined()
})

test('snapshot 保守清理：run 後 profile data 下的 opencode/snapshot 目錄被刪、session db 類檔案保留', async () => {
  const { e, profileDir } = engine('ok', ['aaa', 'bbb'])
  const snap = join(profileDir, 'data', 'opencode', 'snapshot')
  mkdirSync(snap, { recursive: true })
  writeFileSync(join(snap, 'stale.bin'), 'x')
  const db = join(profileDir, 'data', 'opencode', 'opencode.db')
  writeFileSync(db, 'db')
  await e.run({ task: T, projectPath: process.cwd() })
  expect(existsSync(snap)).toBe(false)
  expect(existsSync(db)).toBe(true)
})

test('preflight：PONG＋step_finish 判 ok，第二次走 cache（fake 換 badmodel 仍 ok）', async () => {
  const { e } = engine('ok', ['a'])
  const r1 = await e.preflight()
  expect(r1.ok).toBe(true)
  expect(r1.detail).toContain('model=zen/big-pickle') // 三元組驗證的 model 記在 detail
  process.env.FAKE_OPENCODE_MODE = 'badmodel'
  expect((await e.preflight()).ok).toBe(true) // cache 命中，沒真打第二發
})

test('preflight：模型下架 → 失敗且 detail 明確（含下架提示與 error 事件訊息）、cache 壞結果', async () => {
  const { e } = engine('badmodel', ['a'])
  const r = await e.preflight()
  expect(r.ok).toBe(false)
  expect(r.detail).toContain('已下架')
  expect(r.detail).toContain('Model not found')
  process.env.FAKE_OPENCODE_MODE = 'ok'
  expect((await e.preflight()).ok).toBe(false) // 仍是 cache 的壞結果
})

test('preflight：exit 0 但零輸出（silent-fail 形貌）判失敗', async () => {
  const { e } = engine('empty', ['a'])
  const r = await e.preflight()
  expect(r.ok).toBe(false)
  expect(r.detail).toContain('零輸出')
})

test('parseTokensLine：抓 CLI usage 行、多段取終值、無 usage 回空（2026-07-29 轉義吃字回歸鎖）', async () => {
  const { parseTokensLine } = await import('../src/engines/opencode.js')
  expect(parseTokensLine('...\ntokens in=409412 out=1778 total=412398 | model\n')).toEqual({ tokensIn: 409412, tokensOut: 1778 })
  expect(parseTokensLine('tokens in=1 out=2\n中段\ntokens in=286901 out=1197 total=x')).toEqual({ tokensIn: 286901, tokensOut: 1197 })
  expect(parseTokensLine('無 usage 行的輸出')).toEqual({})
})
