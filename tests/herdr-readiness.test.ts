import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, vi } from 'vitest'
import { HerdrEngine } from '../src/engines/herdr.js'
import { makeEngineRegistry } from '../src/engines/registry.js'
import { runProcess } from '../src/engines/proc.js'
import { PreflightCache } from '../src/preflight.js'
import { ConfigSchema } from '../src/types.js'

const task = { id: 'a/b:c', text: '修好功能', line: 1, status: 'open' as const }
const proc = (stdout = '', exitCode = 0) => ({ exitCode, stdout, stderr: '', timedOut: false, durationMs: 1 })

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'adng-herdr-'))
  const launcher = join(dir, 'Start-Herdr-Autopilot.ps1')
  writeFileSync(launcher, '# fake launcher')
  writeFileSync(join(dir, '.adng-worktree'), '{}')
  return { dir, launcher, cache: new PreflightCache(join(dir, 'preflight.json')) }
}

const argAfter = (args: string[], flag: string): string => {
  const i = args.indexOf(flag)
  if (i < 0) throw new Error(`launcher args 缺少 ${flag}`)
  return args[i + 1]!
}

/** Fake launcher：依 -ResultFile 寫回 v1 結果契約；patch=null 時只印 stdout、不寫檔（舊 launcher）。 */
function contractRunner(patch: Record<string, unknown> | null = {}, stdout = '') {
  const calls: Parameters<typeof runProcess>[0][] = []
  const runner: typeof runProcess = async opts => {
    calls.push(opts)
    if (patch !== null) {
      const file = argAfter(opts.args, '-ResultFile')
      writeFileSync(file, JSON.stringify({
        schemaVersion: 1,
        requestId: argAfter(opts.args, '-RequestId'),
        executionId: argAfter(opts.args, '-ExecutionId'),
        repo: opts.cwd, taskId: task.id, baseCommit: 'aaa',
        server: 'srv-1', session: 'herdr-autopilot', pane: 'p1', status: 'done',
        ...patch,
      }))
    }
    return proc(stdout)
  }
  return { calls, runner }
}

// Issue #34：server、登入、模型、額度分開驗證；故障重試與付費切換受限。
// 動態 import（lazy）：fixed base 尚無 herdr-readiness 模組時測項失敗（exit 1），
// 而非頂層 import 造成 collection exit 2，確保 verifier red replay 可重現。
test('issue #34：server ok 不得冒充全路徑已驗證；四類 backend 狀態分開呈現', async () => {
  const m = await import('../src/engines/herdr-readiness.js') as unknown as Record<string, (...args: never[]) => never>
  const observe = m.observeHerdrBackend as unknown as (input: Record<string, string>) => Record<string, string>
  const summarize = m.summarizeHerdrReadiness as unknown as (obs: unknown) => string
  const tableOf = m.herdrReadinessTable as unknown as (rows: unknown[]) => string
  const rows = [
    observe({ server: 'ok', login: 'missing', model: 'unknown', quota: 'unknown', provider: 'Codex', source: 'server-status' }),
    observe({ server: 'ok', login: 'available', model: 'unavailable', quota: 'unknown', provider: 'Codex', requestedModel: 'no-such-model', source: 'server-status' }),
    observe({ server: 'ok', login: 'available', model: 'listed', quota: 'exhausted', provider: 'Codex', source: 'server-status' }),
    observe({ server: 'ok', login: 'available', model: 'verified', quota: 'available', provider: 'Codex', source: 'server-status' }),
  ]
  const table = tableOf(rows)
  expect(table).toContain('auth-missing')
  expect(table).toContain('model-unavailable')
  expect(table).toContain('quota-exhausted')
  expect(table).toContain('ready')
  for (const row of rows.slice(0, 3)) {
    expect(summarize(row)).toMatch(/backend=unverified/)
    expect(summarize(row)).not.toMatch(/全路徑已驗證|full-path verified/)
  }
  expect(summarize(rows[3])).toMatch(/backend=ready/)
})

test('issue #34：登入／額度／網路／模型錯誤處置不同且重試有界', async () => {
  const m = await import('../src/engines/herdr-readiness.js') as unknown as Record<string, (...args: never[]) => never>
  const classify = m.classifyHerdrFailure as unknown as (input: Record<string, unknown>) => {
    failureClass: string
    advice: { retryable: boolean; maxRetries: number; cooldownMs: number; fallbackAllowed: boolean; waitForHuman: boolean }
  }
  const auth = classify({ stderr: 'herdr login required: please run herdr login', exitCode: 1 })
  expect(auth.failureClass).toBe('auth-missing')
  expect(auth.advice.retryable).toBe(false)
  expect(auth.advice.waitForHuman).toBe(true)
  expect(auth.advice.fallbackAllowed).toBe(false)
  const net = classify({ timedOut: true, stderr: 'ETIMEDOUT', exitCode: 0 })
  expect(net.failureClass).toBe('transient-network')
  expect(net.advice.retryable).toBe(true)
  expect(net.advice.maxRetries).toBeLessThanOrEqual(2)
  const quota = classify({ stderr: 'quota exhausted for this billing cycle', exitCode: 1 })
  expect(quota.failureClass).toBe('quota-exhausted')
  expect(quota.advice.retryable).toBe(false)
  expect(quota.advice.cooldownMs).toBeGreaterThan(0)
  expect(quota.advice.cooldownMs).toBeLessThanOrEqual(30 * 60_000)
  expect(quota.advice.fallbackAllowed).toBe(false)
  const model = classify({ stderr: 'model "no-such-model" is not supported by provider Pi', exitCode: 1 })
  expect(model.failureClass).toBe('model-unavailable')
  expect(model.advice.retryable).toBe(false)
  expect(model.advice.waitForHuman).toBe(false)
  const config = classify({ stderr: 'launcher not found: Start-Herdr-Autopilot.ps1', exitCode: 1 })
  expect(config.failureClass).toBe('config')
  expect(config.advice.retryable).toBe(false)
  expect(config.advice.fallbackAllowed).toBe(false)
})

test('issue #34：快取綁定 launcher／provider／模型；無額度接口保持 unknown 不猜測', async () => {
  const m = await import('../src/engines/herdr-readiness.js') as unknown as Record<string, (...args: never[]) => never>
  const keyOf = m.herdrReadinessKey as unknown as (input: Record<string, string>) => string
  const observe = m.observeHerdrBackend as unknown as (input: Record<string, string>) => Record<string, unknown>
  const base = { command: '/x/launcher.ps1', launcherHash: 'aaa', provider: 'Codex', sessionName: 'herdr-autopilot' }
  expect(keyOf({ ...base, launcherHash: 'bbb' })).not.toBe(keyOf(base))
  expect(keyOf({ ...base, provider: 'Pi' })).not.toBe(keyOf(base))
  expect(keyOf({ ...base, requestedModel: 'm1' })).not.toBe(keyOf({ ...base, requestedModel: 'm2' }))
  expect(keyOf({ ...base, sessionName: 'other-session' })).not.toBe(keyOf(base))
  expect(keyOf({ ...base, command: '/y/launcher.ps1' })).not.toBe(keyOf(base))
  const obs = observe({ server: 'ok', login: 'unknown', model: 'unknown', quota: 'unknown', provider: 'Codex', source: 'launcher-health-only' })
  expect(obs.quota).toBe('unknown')
  expect(obs).not.toHaveProperty('resetAt')
  expect(JSON.stringify(obs)).not.toMatch(/resetAt|remaining/i)
  // 呼叫方另行提供可靠 reset 資訊才保留；仍不猜剩餘次數。
  const withReset = observe({ server: 'ok', login: 'available', model: 'listed', quota: 'exhausted', provider: 'Codex', source: 'server-status', resetAt: '2026-10-04T00:00:00.000Z' })
  expect(withReset).toHaveProperty('resetAt', '2026-10-04T00:00:00.000Z')
  // launcher 遺失是設定問題，不是 backend 未驗證。
  const missing = observe({ server: 'unavailable', login: 'unknown', model: 'unknown', quota: 'unknown', provider: 'Codex', launcherHash: 'missing', source: 'launcher-health-only' })
  expect(missing.failureClass).toBe('config')
})

test('issue #34：unknown 費用不可計成 confirmed-zero；verified-free 擋 unknown；備援需白名單', async () => {
  const m = await import('../src/engines/herdr-readiness.js') as unknown as Record<string, (...args: never[]) => never>
  const assertCost = m.assertHerdrCostPolicy as unknown as (input: Record<string, unknown>) => void
  const allowed = m.isHerdrFallbackAllowed as unknown as (candidate: string, allowlist: readonly string[]) => boolean
  expect(() => assertCost({ costUnknown: true, requireVerifiedFree: true })).toThrow()
  expect(() => assertCost({ costUnknown: true, requireVerifiedFree: false })).not.toThrow()
  expect(() => assertCost({ costUnknown: false, requireVerifiedFree: true })).not.toThrow()
  expect(allowed('Pi', [])).toBe(false)
  expect(allowed('Pi', ['Pi'])).toBe(true)
  expect(allowed('NewPaidModel', ['Pi'])).toBe(false)
})

test('issue #34：HerdrEngine preflight 明示 backend 未驗證，不以 server ok 冒充', async () => {
  const { launcher, cache } = fixture()
  const runner: typeof runProcess = async () => proc('{"running":true,"compatible":true,"protocol":20}')
  const engine = new HerdrEngine({ command: launcher, cache, runProcess: runner })

  const result = await engine.preflight()

  expect(result.ok).toBe(true)
  expect(result.detail).toMatch(/backend=unverified/)
})

test('issue #34：run 失敗帶分類與處置（advice 不被丟棄），相關失敗失效 preflight 快取', async () => {
  const { dir, launcher, cache } = fixture()
  let probes = 0
  const engine = new HerdrEngine({
    command: launcher, cache,
    runProcess: async opts => {
      if (String(opts.command).includes('herdr.exe')) { probes++; return proc('{"running":true,"compatible":true,"protocol":20}') }
      return proc('quota exhausted for this billing cycle', 1)
    },
    getCommitHash: () => 'aaa', commitChanges: () => 'bbb',
  })

  await engine.preflight()
  expect(probes).toBe(1)
  await engine.preflight()
  expect(probes).toBe(1) // 無失敗時命中快取，不重探
  const result = await engine.run({ task, projectPath: dir })
  expect(result.ok).toBe(false)
  expect(result.failureReason).toContain('herdr-quota-exhausted')
  expect(result.failureReason).toContain('herdr-blocked')
  expect(result.failureReason).toMatch(/bounded cooldown|no paid fallback/)
  expect(result.costUnknown).toBe(true)
  await engine.preflight()
  expect(probes).toBe(2) // 相關執行失敗後快取失效，下輪必重探
})

test('issue #34：引擎快取鍵隨模型改變而換鍵（launcher 指紋＋provider＋模型＋session 綁定）', async () => {
  const { launcher, cache } = fixture()
  let probes = 0
  const counting: typeof runProcess = async () => { probes++; return proc('{"running":true,"compatible":true,"protocol":20}') }
  const a = new HerdrEngine({ command: launcher, cache, model: 'm1', runProcess: counting })
  const b = new HerdrEngine({ command: launcher, cache, model: 'm2', runProcess: counting })

  await a.preflight()
  await a.preflight()
  expect(probes).toBe(1)
  await b.preflight()
  expect(probes).toBe(2) // requested 模型不同即換鍵重探
})

test('issue #34：白名單列出後主力也須在內，否則 fail-closed；未列出維持單一路徑', async () => {
  const { dir, launcher, cache } = fixture()
  const closed = new HerdrEngine({
    command: launcher, cache, provider: 'Pi', allowedFallbacks: ['Codex'],
    runProcess: async () => proc('AUTOPILOT_WAIT_OK request=x'),
    getCommitHash: () => 'aaa', commitChanges: () => 'bbb',
  })
  const closedResult = await closed.run({ task, projectPath: dir })
  expect(closedResult.ok).toBe(false)
  expect(closedResult.failureReason).toMatch(/not allowlisted/)
  const open = new HerdrEngine({
    command: launcher, cache: new PreflightCache(join(dir, 'preflight-open.json')),
    provider: 'Pi', allowedFallbacks: ['Pi'],
    runProcess: contractRunner().runner,
    getCommitHash: () => 'aaa', commitChanges: () => 'bbb',
  })
  expect((await open.run({ task, projectPath: dir })).ok).toBe(true)
})

test('issue #34：preflight server ok 時 verified-free 設定翻轉為失敗', async () => {
  const { launcher, cache } = fixture()
  const runner: typeof runProcess = async () => proc('{"running":true,"compatible":true,"protocol":20}')
  const strict = new HerdrEngine({ command: launcher, cache, requireVerifiedFree: true, runProcess: runner })

  const result = await strict.preflight()

  expect(result.ok).toBe(false)
  expect(result.detail).toMatch(/verified-free/)
  expect(result.detail).toMatch(/backend=unverified/)
})

test('issue #34：requireVerifiedFree 經 config 直達引擎，unknown 路徑被擋下', async () => {
  const { dir, launcher } = fixture()
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile: join(dir, 'BACKLOG.md'), dataDir: dir,
    defaultEngine: 'herdr', engines: { herdr: { adapter: 'herdr', command: launcher, provider: 'Codex', costPerRunUsd: 0, requireVerifiedFree: true, model: 'm主力' } },
  })
  const nativeRunner = vi.spyOn(await import('../src/engines/proc.js'), 'runProcess')
    .mockResolvedValue(proc('{"running":true,"compatible":true,"protocol":20}'))
  const engine = makeEngineRegistry(cfg).resolve('herdr')
  expect(engine).toBeInstanceOf(HerdrEngine)

  // model 直達：admission 記下 requested（spawn 成敗不影響，admission 必附）。
  const preflight = await engine.preflight()
  nativeRunner.mockRestore()
  expect(preflight.admission?.model?.requested).toBe('m主力')
  expect(preflight.admission?.quota?.state).toBe('unknown')

  // requireVerifiedFree 直達：在真 git worktree 跑 registry 引擎，spawn 前即被擋下。
  const wdir = mkdtempSync(join(tmpdir(), 'adng-herdr-git-'))
  execFileSync('git', ['init'], { cwd: wdir, stdio: 'ignore' })
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '--allow-empty', '-m', 'x'], { cwd: wdir, stdio: 'ignore' })
  writeFileSync(join(wdir, '.adng-worktree'), '{}')
  const run = await engine.run({ task, projectPath: wdir })
  expect(run.ok).toBe(false)
  expect(run.failureReason).toMatch(/cost-unknown/)
})

test('issue #34：registry 直達的白名單同樣約束主力（spawn 前 fail-closed）', async () => {
  const { dir, launcher } = fixture()
  const wdir = mkdtempSync(join(tmpdir(), 'adng-herdr-git-'))
  execFileSync('git', ['init'], { cwd: wdir, stdio: 'ignore' })
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '--allow-empty', '-m', 'x'], { cwd: wdir, stdio: 'ignore' })
  writeFileSync(join(wdir, '.adng-worktree'), '{}')
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile: join(dir, 'BACKLOG.md'), dataDir: dir,
    defaultEngine: 'herdr', engines: { herdr: { adapter: 'herdr', command: launcher, provider: 'Pi', costPerRunUsd: 0, allowedFallbacks: ['Codex'] } },
  })
  const run = await makeEngineRegistry(cfg).resolve('herdr').run({ task, projectPath: wdir })
  expect(run.ok).toBe(false)
  expect(run.failureReason).toMatch(/not allowlisted/)
})

test('issue #34：requireVerifiedFree／allowedFallbacks 只支援 herdr adapter', () => {
  const base = (engines: Record<string, unknown>) => ({ projectPath: '/p', backlogFile: '/p/BACKLOG.md', dataDir: '/p', defaultEngine: 'herdr', engines })
  const herdr = { adapter: 'herdr', command: '/x.ps1', costPerRunUsd: 0, requireVerifiedFree: true, allowedFallbacks: ['Pi'] }
  expect(ConfigSchema.safeParse(base({ herdr })).success).toBe(true)
  expect(ConfigSchema.safeParse(base({ herdr: { ...herdr, allowedFallbacks: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] } })).success).toBe(false)
  expect(ConfigSchema.safeParse({ projectPath: '/p', backlogFile: '/p/BACKLOG.md', dataDir: '/p', defaultEngine: 'codex',
    engines: { codex: { adapter: 'codex', costPerRunUsd: 0, requireVerifiedFree: true } } }).success).toBe(false)
})

test.each([
  ['authentication failed; network error', false, 'auth-missing'],
  ['quota exhausted; request timed out', false, 'quota-exhausted'],
  ['model is not supported; transient network error', false, 'model-unavailable'],
  ['unknown provider; network error', false, 'config'],
  ['login required', true, 'auth-missing'],
  ['quota exhausted', true, 'quota-exhausted'],
] as const)('self-review: explicit backend failure wins over transport text (%s)', async (stderr, timedOut, failureClass) => {
  const { classifyHerdrFailure } = await import('../src/engines/herdr-readiness.js')
  const result = classifyHerdrFailure({ stderr, timedOut, exitCode: 1 })
  expect(result.failureClass).toBe(failureClass)
  expect(result.advice.retryable).toBe(false)
})

test('self-review: an execution deadline alone does not prove a transient network failure', async () => {
  const { classifyHerdrFailure } = await import('../src/engines/herdr-readiness.js')
  expect(classifyHerdrFailure({ timedOut: true }).advice.retryable).toBe(false)
})

test.each([false, true])('self-review: spendControlReached honors its boolean value (%s)', async spendControlReached => {
  const { classifyHerdrFailure } = await import('../src/engines/herdr-readiness.js')
  const result = classifyHerdrFailure({ stderr: JSON.stringify({ spendControlReached, error: 'model is not supported' }), exitCode: 1 })
  expect(result.failureClass).toBe(spendControlReached ? 'quota-exhausted' : 'model-unavailable')
})

test('self-review: quota wording retains the existing exhausted disposition', async () => {
  const { classifyHerdrFailure } = await import('../src/engines/herdr-readiness.js')
  expect(classifyHerdrFailure({ stderr: 'quota has been exceeded' }).failureClass).toBe('quota-exhausted')
})

test('self-review: a listed model is not an execution-verified backend', async () => {
  const { observeHerdrBackend, summarizeHerdrReadiness } = await import('../src/engines/herdr-readiness.js')
  const observation = observeHerdrBackend({ server: 'ok', login: 'available', model: 'listed', quota: 'available', provider: 'Codex', source: 'server-status' })
  expect(observation.failureClass).toBe('unknown')
  expect(summarizeHerdrReadiness(observation)).toContain('backend=unverified')
})

test.each(['auth.json', 'config.toml'])('self-review: Codex %s changes invalidate the actual engine cache', async file => {
  const { dir, launcher, cache } = fixture()
  vi.stubEnv('CODEX_HOME', dir)
  try {
    const path = join(dir, file)
    writeFileSync(path, '{}')
    utimesSync(path, new Date(1_000), new Date(1_000))
    let probes = 0
    const engine = new HerdrEngine({ command: launcher, cache, provider: 'Codex', runProcess: async () => {
      probes++
      return proc(JSON.stringify({ running: true, compatible: probes === 1, protocol: 20 }))
    } })
    expect((await engine.preflight()).ok).toBe(true)
    expect((await engine.preflight()).ok).toBe(true)
    writeFileSync(path, '{"changed":true}')
    expect((await engine.preflight()).ok).toBe(false)
    expect(probes).toBe(2)
  } finally { vi.unstubAllEnvs() }
})

test('self-review: actual cached preflight retains observation provenance and still enforces policy', async () => {
  const { dir, launcher, cache } = fixture()
  let probes = 0
  const runner: typeof runProcess = async () => {
    probes++
    return proc(JSON.stringify({ running: true, compatible: probes === 1, protocol: 20 }))
  }
  const opts = { command: launcher, cache, provider: 'Pi' as const, model: 'm-primary', runProcess: runner }
  const engine = new HerdrEngine(opts)
  const first = await engine.preflight()
  expect(first.detail).toMatch(/launcherHash=sha256:[0-9a-f]+/)
  expect(first.detail).toContain('provider=Pi requested=m-primary reported=unknown')
  expect(first.detail).toMatch(/observedAt=\d{4}-\d{2}-\d{2}T/)
  expect(first.detail).toContain('source=launcher-health-only')
  expect(first.detail).toContain('herdrVersion=unknown backendCliVersion=unknown')
  expect(readFileSync(join(dir, 'preflight.json'), 'utf8')).toContain(first.detail)
  expect((await engine.preflight()).detail).toBe(first.detail)
  expect(await new HerdrEngine({ ...opts, requireVerifiedFree: true }).preflight()).toMatchObject({ ok: false, detail: expect.stringContaining('verified-free') })
  expect(probes).toBe(1)
  writeFileSync(launcher, '# changed launcher')
  expect((await engine.preflight()).ok).toBe(false)
  expect(probes).toBe(2)
})

test('self-review: timed-out launcher preserves an explicit quota failure and its safety fence', async () => {
  const { dir, launcher, cache } = fixture()
  const commitChanges = vi.fn(() => 'bbb')
  const engine = new HerdrEngine({ command: launcher, cache, runProcess: async () => ({ ...proc('quota exhausted', 1), timedOut: true }), getCommitHash: () => 'aaa', commitChanges })
  const result = await engine.run({ task, projectPath: dir })
  expect(result).toMatchObject({ ok: false, recoveryRequired: true, costUnknown: true, failureReason: expect.stringContaining('herdr-quota-exhausted') })
  expect(commitChanges).not.toHaveBeenCalled()
})

test.each([0, 1])('self-review: launcher output is redacted before recording on exit %s', async exitCode => {
  const { dir, launcher, cache } = fixture()
  const secret = 'herdr-review-fixture-secret'
  vi.stubEnv('HERDR_REVIEW_TOKEN', secret)
  try {
    const engine = new HerdrEngine({ command: launcher, cache, runProcess: async () => ({ ...proc(`AUTOPILOT_WAIT_OK ${secret}`, exitCode), stderr: 'cookie=fixture-cookie' }), getCommitHash: () => 'aaa', commitChanges: () => 'bbb' })
    const result = await engine.run({ task, projectPath: dir })
    expect(result.ok).toBe(false) // stdout-only completion never replaces a bound result receipt
    expect(result.output).not.toContain(secret)
    expect(result.output).not.toContain('fixture-cookie')
    expect(result.output).toContain('[REDACTED]')
  } finally { vi.unstubAllEnvs() }
})

test('self-review: server protocol is validated before inclusion in a receipt', async () => {
  const { launcher, cache } = fixture()
  const engine = new HerdrEngine({ command: launcher, cache, runProcess: async () => proc(JSON.stringify({ running: true, compatible: true, protocol: 'Bearer fixture-protocol-token' })) })
  expect((await engine.preflight()).detail).not.toContain('fixture-protocol-token')
})

test.each([
  ['login required', 'auth-missing'],
  ['quota exhausted', 'quota-exhausted'],
  ['model is not supported', 'model-unavailable'],
] as const)('bound failed receipts retain backend disposition and invalidate readiness (%s)', async (detail, failureClass) => {
  const { dir, launcher, cache } = fixture()
  const receipt = contractRunner({ status: 'failed', detail })
  let probes = 0
  const runner: typeof runProcess = async opts => opts.command === 'herdr.exe'
    ? (probes++, proc(JSON.stringify({ running: true, compatible: probes === 1, protocol: 20 })))
    : receipt.runner(opts)
  const commitChanges = vi.fn(() => 'bbb')
  const engine = new HerdrEngine({ command: launcher, cache, runProcess: runner, getCommitHash: () => 'aaa', commitChanges })
  expect((await engine.preflight()).ok).toBe(true)
  const result = await engine.run({ task, projectPath: dir })
  expect(result).toMatchObject({ ok: false, failureReason: expect.stringContaining(`herdr-${failureClass}`) })
  expect(commitChanges).not.toHaveBeenCalled()
  expect((await engine.preflight()).ok).toBe(false)
  expect(probes).toBe(2)
})
