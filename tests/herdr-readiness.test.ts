import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { HerdrEngine } from '../src/engines/herdr.js'
import { applyBackendStatus, launcherDigest, parseHerdrStatus, quotaHoldUntil } from '../src/engines/herdr-readiness.js'
import { unknownAdmission } from '../src/engines/cli-admission.js'
import { makeEngineRegistry } from '../src/engines/registry.js'
import { runProcess } from '../src/engines/proc.js'
import { PreflightCache } from '../src/preflight.js'
import { ConfigSchema } from '../src/types.js'

const roots: string[] = []
afterEach(() => { vi.useRealTimers(); for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

const fixtures = resolve('tests/fixtures/herdr')
const fx = (name: string) => readFileSync(join(fixtures, name), 'utf8')
const proc = (stdout = '', exitCode = 0, timedOut = false): Awaited<ReturnType<typeof runProcess>> =>
  ({ exitCode, stdout, stderr: '', timedOut, durationMs: 1 })

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'adng-herdr-readiness-')); roots.push(dir)
  const launcher = join(dir, 'Start-Herdr-Autopilot.ps1')
  writeFileSync(launcher, '# fake launcher v1')
  writeFileSync(join(dir, '.adng-worktree'), '{}')
  return { dir, launcher, cacheFile: join(dir, 'preflight.json') }
}

// 表格化 fixture：server ok 不再冒充整條執行路徑已驗證（issue #34 驗收 1）。
test.each([
  { file: 'status-ok.json', model: 'gpt-5.6-luna', ok: true, auth: 'available', modelState: 'listed', quota: 'available', marker: 'Herdr compatible' },
  { file: 'status-ok.json', model: 'not-in-catalog', ok: false, auth: 'available', modelState: 'unavailable', quota: 'available', marker: 'model unavailable' },
  { file: 'status-server-only.json', model: undefined, ok: true, auth: 'unknown', modelState: 'unknown', quota: 'unknown', marker: 'Herdr compatible' },
  { file: 'status-server-only.json', model: 'pinned-model', ok: false, auth: 'unknown', modelState: 'unknown', quota: 'unknown', marker: 'model unverified' },
  { file: 'status-auth-missing.json', model: undefined, ok: false, auth: 'missing', modelState: 'listed', quota: 'unknown', marker: 'auth missing' },
  { file: 'status-model-unavailable.json', model: 'wanted-model', ok: false, auth: 'available', modelState: 'unavailable', quota: 'available', marker: 'model unavailable' },
  { file: 'status-quota-exhausted.json', model: 'gpt-5.6-luna', ok: false, auth: 'available', modelState: 'listed', quota: 'exhausted', marker: 'quota exhausted' },
  { file: 'status-server-down.json', model: undefined, ok: false, auth: 'unknown', modelState: 'unknown', quota: 'unknown', marker: 'Herdr 未就緒' },
])('$file（model=$model）分開呈現 server／auth／model／quota 狀態', async row => {
  const { launcher, cacheFile } = fixture()
  const engine = new HerdrEngine({
    command: launcher, cache: new PreflightCache(cacheFile), model: row.model,
    runProcess: async () => proc(fx(row.file)),
  })
  const r = await engine.preflight()
  expect(r.ok).toBe(row.ok)
  expect(r.detail).toContain(row.marker)
  expect(r.admission).toMatchObject({
    quota: { state: row.quota },
    model: { state: row.modelState, ...(row.model ? { requested: row.model } : {}) },
    auth: { state: row.auth },
  })
})

test('就緒觀測分別記錄版本／launcher 雜湊／provider／requested·reported model／來源與時間', async () => {
  const { launcher, cacheFile } = fixture()
  const engine = new HerdrEngine({
    command: launcher, cache: new PreflightCache(cacheFile), model: 'gpt-5.6-luna',
    runProcess: async () => proc(fx('status-ok.json')),
  })
  const r = await engine.preflight()
  expect(r.admission?.backend).toMatchObject({
    provider: 'Codex', herdrVersion: '0.9.1-preview', cliVersion: '0.153.4',
  })
  expect(r.admission?.backend?.launcherSha256).toMatch(/^sha256:[0-9a-f]{64}$/)
  expect(r.admission?.backend?.launcherSha256).toBe(launcherDigest(launcher))
  expect(r.admission?.backend?.source).toContain('status server')
  expect(r.admission?.model).toMatchObject({ requested: 'gpt-5.6-luna', reported: 'gpt-5.6-luna' })
  expect(Date.parse(r.admission?.checkedAt ?? '')).toBeGreaterThan(0)
})

test('launcher 內容變動使快取失效；快取命中沿用同一份觀測（含原觀測時間）', async () => {
  const { launcher, cacheFile } = fixture()
  const cache = new PreflightCache(cacheFile)
  let calls = 0
  const runner: typeof runProcess = async () => { calls++; return proc(fx('status-ok.json')) }
  const engine = new HerdrEngine({ command: launcher, cache, model: 'gpt-5.6-luna', runProcess: runner })
  const r1 = await engine.preflight()
  const r2 = await engine.preflight()
  expect(calls).toBe(1) // 命中快取
  expect(r2.admission?.checkedAt).toBe(r1.admission?.checkedAt) // 同一份觀測，不刷新時間
  writeFileSync(launcher, '# fake launcher v2 — 版本變動')
  await engine.preflight()
  expect(calls).toBe(2) // launcher 雜湊改變 → 重探
})

test('設定變動（model）綁定 cache key；quota 無接口時保持 unknown 不猜測', async () => {
  const { launcher, cacheFile } = fixture()
  const cache = new PreflightCache(cacheFile)
  let calls = 0
  const runner: typeof runProcess = async () => { calls++; return proc(fx('status-server-only.json')) }
  const a = new HerdrEngine({ command: launcher, cache, model: 'm-a', runProcess: runner })
  const b = new HerdrEngine({ command: launcher, cache, model: 'm-b', runProcess: runner })
  const ra = await a.preflight()
  await b.preflight()
  expect(calls).toBe(2) // model 不同 → 不同 key
  expect(ra.admission?.quota?.state).toBe('unknown')
  expect(ra.admission?.quota?.windows).toBeUndefined() // 不編造剩餘窗口
  expect(ra.admission?.quota?.resetsAt).toBeUndefined() // 不編造重設時間
})

test('quota exhausted 依 resetsAt 持有觀測（可靠 reset 資訊），到期後重探', async () => {
  vi.useFakeTimers()
  const { launcher, cacheFile } = fixture()
  const cache = new PreflightCache(cacheFile, 60_000, 40) // bad TTL 40ms
  let calls = 0
  const resetsAt = new Date(Date.now() + 400).toISOString()
  const payload = () => JSON.stringify({ running: true, compatible: true, protocol: 20,
    backend: { auth: { state: 'authenticated' }, quota: { state: 'exhausted', remainingPercent: 0, resetsAt } } })
  const engine = new HerdrEngine({ command: launcher, cache, runProcess: async () => { calls++; return proc(payload()) } })
  const r = await engine.preflight()
  expect(r.ok).toBe(false)
  expect(r.admission?.quota).toMatchObject({ state: 'exhausted', resetsAt })
  expect(r.detail).toContain('後再查')
  await vi.advanceTimersByTimeAsync(80) // 已過 bad TTL 但未過 resetsAt
  await engine.preflight()
  expect(calls).toBe(1) // 仍持有觀測，未重探
  await vi.advanceTimersByTimeAsync(400) // 過 resetsAt
  await engine.preflight()
  expect(calls).toBe(2) // 到期重探
})

test('quota exhausted 無 reset 資訊時用有界冷卻（bad TTL）再檢查', async () => {
  vi.useFakeTimers()
  const { launcher, cacheFile } = fixture()
  const cache = new PreflightCache(cacheFile, 60_000, 50)
  let calls = 0
  const payload = JSON.stringify({ running: true, compatible: true, protocol: 20,
    backend: { quota: { state: 'exhausted' } } })
  const engine = new HerdrEngine({ command: launcher, cache, runProcess: async () => { calls++; return proc(payload) } })
  const r = await engine.preflight()
  expect(r.ok).toBe(false)
  expect(r.detail).toContain('bounded cooldown')
  await vi.advanceTimersByTimeAsync(80)
  await engine.preflight()
  expect(calls).toBe(2)
})

test('暫時故障有限次退避重試；成功後結果正常', async () => {
  const { launcher, cacheFile } = fixture()
  let calls = 0
  const engine = new HerdrEngine({ command: launcher, cache: new PreflightCache(cacheFile), statusRetryDelayMs: 1,
    runProcess: async () => { calls++; return calls < 3 ? proc('garbage', 1) : proc(fx('status-ok.json')) } })
  const r = await engine.preflight()
  expect(r.ok).toBe(true)
  expect(calls).toBe(3)
})

test('暫時故障耗盡重試後 fail-closed，呼叫次數有界', async () => {
  const { launcher, cacheFile } = fixture()
  let calls = 0
  const engine = new HerdrEngine({ command: launcher, cache: new PreflightCache(cacheFile), statusRetries: 2, statusRetryDelayMs: 1,
    runProcess: async () => { calls++; return proc('', 1, true) } })
  const r = await engine.preflight()
  expect(r.ok).toBe(false)
  expect(r.detail).toContain('transient')
  expect(calls).toBe(3) // 1 + 2 retries，不多不少
})

test('明確的 server 狀態回答不是 transient：不重試', async () => {
  const { launcher, cacheFile } = fixture()
  let calls = 0
  const engine = new HerdrEngine({ command: launcher, cache: new PreflightCache(cacheFile), statusRetryDelayMs: 1,
    runProcess: async () => { calls++; return proc(fx('status-server-down.json'), 1) } })
  const r = await engine.preflight()
  expect(r.ok).toBe(false)
  expect(r.detail).toContain('未就緒')
  expect(calls).toBe(1) // 解析得出的否定答案不需退避重試
})

test('各故障類有不同處置文字：auth 等待人工、quota 冷卻、model 設定問題', async () => {
  const { launcher, cacheFile } = fixture()
  const cases = [
    { file: 'status-auth-missing.json', model: undefined, marker: '等待人工登入' },
    { file: 'status-quota-exhausted.json', model: 'gpt-5.6-luna', marker: '後再查' },
    { file: 'status-model-unavailable.json', model: 'wanted-model', marker: '設定問題' },
  ]
  for (const [i, c] of cases.entries()) {
    const engine = new HerdrEngine({ command: launcher, cache: new PreflightCache(`${cacheFile}.${i}`), model: c.model,
      runProcess: async () => proc(fx(c.file)) })
    const r = await engine.preflight()
    expect(r.ok).toBe(false)
    expect(r.detail).toContain(c.marker)
  }
})

test('登入類失敗不自動送出同意或改寫憑證：只跑唯讀 status', async () => {
  const { launcher, cacheFile } = fixture()
  const calls: Parameters<typeof runProcess>[0][] = []
  const engine = new HerdrEngine({ command: launcher, cache: new PreflightCache(cacheFile), runProcess: async opts => {
    calls.push(opts); return proc(fx('status-auth-missing.json'))
  } })
  await engine.preflight()
  // 所有探針都必須是同一條唯讀 status 指令——不送 login/consent/logout。
  expect(calls.length).toBeGreaterThan(0)
  expect(calls.every(c => c.command === 'herdr.exe' && c.args.join(' ').includes('status server'))).toBe(true)
})

test('preflight 結果與快取條目不洩漏環境中的憑證值', async () => {
  const { launcher, cacheFile } = fixture()
  const secret = 'synthetic-herdr-secret-value'
  process.env.HERDR_TEST_TOKEN = secret
  try {
    const engine = new HerdrEngine({ command: launcher, cache: new PreflightCache(cacheFile), statusRetryDelayMs: 1,
      runProcess: async () => ({ exitCode: 1, stdout: `quota denied: ${secret}`, stderr: `Bearer ${secret}`, timedOut: true, durationMs: 1 }) })
    const r = await engine.preflight()
    expect(r.ok).toBe(false)
    expect(r.detail).toContain('transient')
    expect(JSON.stringify(r)).not.toContain(secret)
    expect(readFileSync(cacheFile, 'utf8')).not.toContain(secret)
  } finally { delete process.env.HERDR_TEST_TOKEN }
})

test('free-only tierMode 拒絕 herdr（verified-free 設定不放行 unknown 路徑）', () => {
  const { dir, launcher } = fixture()
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile: join(dir, 'BACKLOG.md'), dataDir: dir, tierMode: 'free-only',
    defaultEngine: 'herdr', engines: { herdr: { adapter: 'herdr', command: launcher, costPerRunUsd: 0 } },
  })
  expect(() => makeEngineRegistry(cfg).resolve('herdr')).toThrow(/free-policy/)
})

test('run 結果的 unknown 成本維持 costUnknown（不記成 confirmed-zero）', async () => {
  const { dir, launcher, cacheFile } = fixture()
  const engine = new HerdrEngine({
    command: launcher, cache: new PreflightCache(cacheFile), getCommitHash: () => 'aaa', commitChanges: () => 'bbb',
    runProcess: async () => proc('AUTOPILOT_WAIT_OK request=x session=herdr-autopilot pane=p1'),
  })
  const r = await engine.run({ task: { id: 't1', text: 'x', line: 1, status: 'open' }, projectPath: dir })
  expect(r.ok).toBe(true)
  expect(r.costUsd).toBe(0)
  expect(r.costUnknown).toBe(true) // 佔位 0，不是已證實零成本
})

test('run 失敗使快取失效，下輪重探', async () => {
  const { launcher, cacheFile } = fixture()
  let calls = 0
  const engine = new HerdrEngine({ command: launcher, cache: new PreflightCache(cacheFile),
    runProcess: async () => { calls++; return proc(fx('status-ok.json')) } })
  await engine.preflight()
  await engine.preflight()
  expect(calls).toBe(1)
  engine.invalidatePreflight()
  await engine.preflight()
  expect(calls).toBe(2)
})

// ---- herdr-readiness 單元層 ----

test('parseHerdrStatus 容忍非 JSON 與非物件', () => {
  expect(parseHerdrStatus('')).toBeUndefined()
  expect(parseHerdrStatus('not json')).toBeUndefined()
  expect(parseHerdrStatus('[1,2]')).toBeUndefined()
  expect(parseHerdrStatus('"x"')).toBeUndefined()
  expect(parseHerdrStatus('{"running":true}')).toMatchObject({ running: true })
})

test('applyBackendStatus：不認識的欄位形狀一律 unknown，不猜', () => {
  const a = unknownAdmission('herdr')
  applyBackendStatus(a, { running: true, compatible: true, backend: { auth: 'weird-shape', quota: { bogus: true }, model: 42 } }, { provider: 'Codex', source: 'fixture' })
  expect(a.auth?.state).toBe('unknown')
  expect(a.quota.state).toBe('unknown')
  expect(a.model.state).toBe('unknown')
})

test('applyBackendStatus：reported≠requested 為設定問題（unavailable）；相符為 listed', () => {
  const a = unknownAdmission('herdr')
  applyBackendStatus(a, { backend: { model: 'other-model' } }, { provider: 'Codex', model: 'want-a', source: 'fixture' })
  expect(a.model).toMatchObject({ state: 'unavailable', requested: 'want-a', reported: 'other-model' })
  const b = unknownAdmission('herdr')
  applyBackendStatus(b, { backend: { model: 'want-a' } }, { provider: 'Codex', model: 'want-a', source: 'fixture' })
  expect(b.model.state).toBe('listed')
})

test('quotaHoldUntil：非 exhausted 或 reset 已過→undefined；未來 reset→持有且封頂', () => {
  const a = unknownAdmission('herdr')
  expect(quotaHoldUntil(a)).toBeUndefined()
  a.quota = { state: 'exhausted', detail: 'x' }
  expect(quotaHoldUntil(a)).toBeUndefined() // 無可靠 reset → 有界冷卻（由呼叫端走一般 bad TTL）
  a.quota.resetsAt = new Date(Date.now() - 1000).toISOString()
  expect(quotaHoldUntil(a)).toBeUndefined() // 已過期的 reset 不持有
  a.quota.resetsAt = new Date(Date.now() + 60_000).toISOString()
  const hold = quotaHoldUntil(a)!
  expect(hold).toBeGreaterThan(Date.now())
  a.quota.resetsAt = new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString()
  expect(quotaHoldUntil(a)!).toBeLessThanOrEqual(Date.now() + 24 * 60 * 60_000 + 1000) // 可靠 reset 也有 24h 上限
})
