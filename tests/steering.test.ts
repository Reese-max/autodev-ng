import { expect, test, vi } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

vi.mock('../src/autopilot/perpetual.js', () => ({ maybeRunPerpetual: vi.fn(async () => false), perpetualDigestLine: vi.fn(() => null) }))

import { runOnce, type Deps } from '../src/scheduler.js'
import { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { MockEngine } from '../src/engines/mock.js'
import { ConfigSchema } from '../src/types.js'
import { ControlStore, parseControlArg, validateControlText, CONTROL_TTL_MS } from '../src/engines/steering.js'
import { writeActiveExecution, readActiveExecution, updateActiveExecutionPhase, markOrphanedExecutions } from '../src/engines/active-execution.js'
import { ENGINE_CAPABILITIES } from '../src/engines/capabilities.js'

function initGitRepo(dir: string): void {
  execFileSync('git', ['init', '-b', 'main'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'adng-test@example.com'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'adng-test'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: dir, stdio: 'ignore' })
  writeFileSync(join(dir, 'README.md'), '# adng test repo\n')
  execFileSync('git', ['add', '.'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'chore: init'], { cwd: dir, stdio: 'ignore' })
}

function setup(backlogMd = '- [ ] 任務一\n') {
  const dir = mkdtempSync(join(tmpdir(), 'adng-steer-'))
  initGitRepo(dir)
  const backlogFile = join(dir, 'BACKLOG.md')
  writeFileSync(backlogFile, backlogMd)
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile, dataDir: join(dir, 'data'),
    engine: 'mock', stopFile: join(dir, '.adng.stop'),
    worktreesDir: join(dir, 'worktrees'), timezoneOffsetHours: 0,
  })
  const db = new RunDb(join(dir, 'run.db'))
  const controls = new ControlStore(join(cfg.dataDir, 'run.db'))
  return { dir, cfg, db, controls, store: new BacklogStore(backlogFile), events: new EventLog(cfg.dataDir) }
}

function deps(s: ReturnType<typeof setup>, engine: MockEngine): Deps {
  return { cfg: s.cfg, store: s.store, db: s.db, engines: { resolve: () => engine }, events: s.events }
}

const baseReq = {
  project: '', dataDir: '', executionId: 'exec-1', mode: 'queue' as const,
  text: '只修 parser，不要動 migration', issuer: 'discord:u1', channel: 'discord',
}

function req(s: ReturnType<typeof setup>, overrides: Record<string, unknown> = {}) {
  return { ...baseReq, project: s.cfg.projectPath, dataDir: s.cfg.dataDir, ...overrides }
}

function liveExecution(dataDir: string, overrides: Partial<Parameters<typeof writeActiveExecution>[1]> = {}) {
  writeActiveExecution(dataDir, {
    executionId: 'exec-1', taskId: 'task-1', engineTag: 'mock', adapter: 'mock',
    phase: 'engine-run', hostPid: process.pid, hostStartedAt: Date.now() - 1000,
    startedAt: Date.now() - 1000, ...overrides,
  })
}

// ── 指令文字驗收（untrusted input）──

test('validateControlText rejects injection shapes', () => {
  expect(validateControlText('  ')).toBeTruthy()
  expect(validateControlText('a\nb')).toBeTruthy()
  expect(validateControlText('has <!-- comment -->')).toBeTruthy()
  expect(validateControlText('偽造 adng:done 註記')).toBeTruthy()
  expect(validateControlText('x'.repeat(401))).toBeTruthy()
  expect(validateControlText('只修 parser')).toBeNull()
})

// ── requestControl intake：fail-closed 全路徑 ──

test('steer to unknown/terminal execution is REJECTED_STALE_TARGET', () => {
  const s = setup()
  const r1 = s.controls.request(req(s, { mode: 'steer', executionId: 'nonexistent' }))
  expect(r1.envelope.disposition).toBe('REJECTED_STALE_TARGET')
  expect(r1.envelope.state).toBe('closed')
  const r2 = s.controls.request(req(s))
  expect(r2.envelope.disposition).toBe('REJECTED_STALE_TARGET')
  s.controls.close(); s.db.close()
})

test('steer on adapter without in-flight capability is UNSUPPORTED, never faked', () => {
  const s = setup()
  liveExecution(s.cfg.dataDir, { adapter: 'claude-cli', engineTag: 'claude' })
  const r = s.controls.request(req(s, { mode: 'steer' }))
  expect(r.envelope.disposition).toBe('UNSUPPORTED')
  expect(r.envelope.state).toBe('closed')
  expect(ENGINE_CAPABILITIES['claude-cli'].controls.inFlightSteer).toBe(false)
  expect(ENGINE_CAPABILITIES['codex'].controls.inFlightSteer).toBe(false)
  expect(ENGINE_CAPABILITIES['mock'].controls.inFlightSteer).toBe(true)
  s.controls.close(); s.db.close()
})

test('steer arriving after turn end becomes TOO_LATE_QUEUED on the same execution', () => {
  const s = setup()
  liveExecution(s.cfg.dataDir, { phase: 'host-verify' })
  const r = s.controls.request(req(s, { mode: 'steer' }))
  expect(r.envelope.disposition).toBe('TOO_LATE_QUEUED')
  expect(r.envelope.state).toBe('pending')
  s.controls.close(); s.db.close()
})

test('queue to live execution is QUEUED pending; issuer/taskId bound from record', () => {
  const s = setup()
  liveExecution(s.cfg.dataDir)
  const r = s.controls.request(req(s))
  expect(r.envelope.disposition).toBe('QUEUED')
  expect(r.envelope.state).toBe('pending')
  expect(r.envelope.taskId).toBe('task-1')
  expect(r.envelope.issuer).toBe('discord:u1')
  expect(r.envelope.contentHash).toMatch(/^[a-f0-9]{64}$/)
  s.controls.close(); s.db.close()
})

test('replay of identical envelope fails closed as REJECTED_REPLAY', () => {
  const s = setup()
  liveExecution(s.cfg.dataDir)
  const r1 = s.controls.request(req(s))
  expect(r1.envelope.disposition).toBe('QUEUED')
  const r2 = s.controls.request(req(s))
  expect(r2.envelope.disposition).toBe('REJECTED_REPLAY')
  expect(r2.envelope.state).toBe('closed')
  s.controls.close(); s.db.close()
})

test('forged/mismatched taskId and engineTag are rejected as stale target', () => {
  const s = setup()
  liveExecution(s.cfg.dataDir)
  const bad1 = s.controls.request(req(s, { taskId: 'other-task' }))
  expect(bad1.envelope.disposition).toBe('REJECTED_STALE_TARGET')
  const bad2 = s.controls.request(req(s, { expectedEngineTag: 'claude', text: '另一條指示' }))
  expect(bad2.envelope.disposition).toBe('REJECTED_STALE_TARGET')
  s.controls.close(); s.db.close()
})

test('invalid instruction text is recorded closed REJECTED_INVALID', () => {
  const s = setup()
  liveExecution(s.cfg.dataDir)
  const r = s.controls.request(req(s, { text: 'break\nlines' }))
  expect(r.envelope.disposition).toBe('REJECTED_INVALID')
  expect(r.envelope.state).toBe('closed')
  s.controls.close(); s.db.close()
})

// ── daemon restart：pending envelope 絕不投給新 execution ──

test('pending envelopes for dead executions go STALE on cycle sweep, never delivered elsewhere', async () => {
  const s = setup()
  liveExecution(s.cfg.dataDir, { hostPid: 999_999_999, hostStartedAt: 1 }) // 死掉的 daemon
  // 直接落一筆 pending（繞過 intake 的 stale 檢查，模擬 restart 前已存在）
  s.controls.insertForTest({ project: s.cfg.projectPath, executionId: 'exec-1', text: baseReq.text })
  const engine = new MockEngine([{ ok: true }])
  await runOnce(deps(s, engine))
  const env = s.controls.list(s.cfg.projectPath)[0]!
  expect(env.state).toBe('closed')
  expect(env.disposition).toBe('STALE')
  expect(engine.calls).toHaveLength(1)
  expect(engine.calls[0]!.directive ?? '').not.toContain('只修 parser')
  s.controls.close(); s.db.close()
})

test('expired pending envelopes sweep to STALE', () => {
  const s = setup()
  liveExecution(s.cfg.dataDir)
  const r = s.controls.request(req(s, { now: Date.now() - CONTROL_TTL_MS - 1000 }))
  expect(r.envelope.disposition).toBe('QUEUED')
  s.controls.sweepExpired(Date.now())
  const env = s.controls.list(s.cfg.projectPath)[0]!
  expect(env.disposition).toBe('STALE')
  s.controls.close(); s.db.close()
})

// ── scheduler drain：QUEUE 在 safe boundary 送達同一 execution ──

test('queued instruction is delivered as a follow-up turn on the same executionId', async () => {
  const s = setup()
  const engine = new MockEngine([{
    ok: true,
    beforeResult: (job) => {
      const r = s.controls.request({
        dataDir: s.cfg.dataDir, project: s.cfg.projectPath, executionId: job.executionId!, mode: 'queue',
        text: '只修 parser，不要動 migration', issuer: 'cli', channel: 'cli',
      })
      expect(r.envelope.disposition).toBe('QUEUED')
    },
  }])
  const result = await runOnce(deps(s, engine))
  expect(result).toBe('done')
  expect(engine.calls.length).toBe(2)
  expect(engine.calls[1]!.executionId).toBe(engine.calls[0]!.executionId)
  expect(engine.calls[1]!.directive).toContain('只修 parser')
  const env = s.controls.list(s.cfg.projectPath)[0]!
  expect(env.state).toBe('delivered')
  expect(env.disposition).toBe('QUEUED')
  s.controls.close(); s.db.close()
})

test('two queued envelopes deliver FIFO in one follow-up turn', async () => {
  const s = setup()
  const engine = new MockEngine([{
    ok: true,
    beforeResult: (job) => {
      s.controls.request({ dataDir: s.cfg.dataDir, project: s.cfg.projectPath, executionId: job.executionId!, mode: 'queue', text: '第一條', issuer: 'cli', channel: 'cli' })
      s.controls.request({ dataDir: s.cfg.dataDir, project: s.cfg.projectPath, executionId: job.executionId!, mode: 'queue', text: '第二條', issuer: 'cli', channel: 'cli' })
    },
  }])
  await runOnce(deps(s, engine))
  expect(engine.calls.length).toBe(2)
  const d = engine.calls[1]!.directive!
  expect(d.indexOf('第一條')).toBeGreaterThanOrEqual(0)
  expect(d.indexOf('第一條')).toBeLessThan(d.indexOf('第二條'))
  s.controls.close(); s.db.close()
})

// ── in-flight STEER：mock adapter 在 safe boundary 接收 ──

test('steer is taken by a steer-capable engine mid-turn and marked STEERED', async () => {
  const s = setup()
  let envelopeId = ''
  const engine = new MockEngine([{
    ok: true,
    beforeResult: (job) => {
      const r = s.controls.request({
        dataDir: s.cfg.dataDir, project: s.cfg.projectPath, executionId: job.executionId!, mode: 'steer',
        text: '改方向：先補測試', issuer: 'discord:u1', channel: 'discord',
      })
      expect(r.envelope.disposition).toBe('STEER_REQUESTED')
      envelopeId = r.envelope.id
    },
  }])
  await runOnce(deps(s, engine))
  expect(engine.calls).toHaveLength(1) // in-flight，沒有 continuation turn
  const env = s.controls.list(s.cfg.projectPath)[0]!
  expect(env.id).toBe(envelopeId)
  expect(env.state).toBe('delivered')
  expect(env.disposition).toBe('STEERED')
  s.controls.close(); s.db.close()
})

test('stopFile pause prevents follow-up delivery; pending stays for sweep', async () => {
  const s = setup()
  const engine = new MockEngine([{ ok: true, beforeResult: (job) => {
    s.controls.request({ dataDir: s.cfg.dataDir, project: s.cfg.projectPath, executionId: job.executionId!, mode: 'queue', text: '排一條', issuer: 'cli', channel: 'cli' })
    writeFileSync(s.cfg.stopFile, 'paused') // turn 結束前按下暫停
  } }])
  await runOnce(deps(s, engine))
  expect(engine.calls).toHaveLength(1) // pause 閘擋住 follow-up turn
  const env = s.controls.list(s.cfg.projectPath)[0]!
  expect(env.state).toBe('closed')
  expect(env.disposition).toBe('STALE') // 終結 sweep：execution 結束仍未送達 → STALE
  s.controls.close(); s.db.close()
})

test('engine throw during follow-up marks batch NOT_DELIVERED, main result intact', async () => {
  const s = setup()
  const engine = new MockEngine([{ ok: true, beforeResult: (job) => {
    s.controls.request({ dataDir: s.cfg.dataDir, project: s.cfg.projectPath, executionId: job.executionId!, mode: 'queue', text: '追加指示', issuer: 'cli', channel: 'cli' })
  } }, { throw: 'engine died mid-followup' }])
  const result = await runOnce(deps(s, engine))
  expect(result).toBe('done') // 主嘗試結果不變
  const env = s.controls.list(s.cfg.projectPath)[0]!
  expect(env.disposition).toBe('NOT_DELIVERED')
  s.controls.close(); s.db.close()
})

test('STEER_REQUESTED still pending at drain converts to TOO_LATE_QUEUED then delivers', async () => {
  const s = setup()
  const engine = new MockEngine([{ ok: true, beforeResult: (job) => {
    const r = s.controls.request({ dataDir: s.cfg.dataDir, project: s.cfg.projectPath, executionId: job.executionId!, mode: 'steer', text: '中途修正', issuer: 'cli', channel: 'cli' })
    expect(r.envelope.disposition).toBe('STEER_REQUESTED')
    job.control = undefined // 本 boundary 未取件 → 留到 drain
  } }])
  await runOnce(deps(s, engine))
  expect(engine.calls).toHaveLength(2)
  expect(engine.calls[1]!.directive).toContain('中途修正')
  const env = s.controls.list(s.cfg.projectPath)[0]!
  expect(env.state).toBe('delivered')
  expect(env.disposition).toBe('TOO_LATE_QUEUED')
  s.controls.close(); s.db.close()
})

// ── arg 解析 ──

test('parseControlArg parses execution:/task:/engine:/text: tokens', () => {
  const r = parseControlArg('execution:abc123 task:t1 engine:mock text:改方向 只修 parser')
  expect(r).toEqual({ executionId: 'abc123', taskId: 't1', engineTag: 'mock', text: '改方向 只修 parser' })
  expect(parseControlArg('text:hello')).toEqual({ text: 'hello' })
  expect(parseControlArg('')).toEqual({})
})

// ── bot/CLI 操作面 ──

test('Discord handleCommand: /steer unsupported adapter replies UNSUPPORTED; /controls lists receipt', async () => {
  const s = setup()
  const { handleCommand } = await import('../src/bot/handlers.js')
  const d = { cfg: s.cfg, store: s.store, db: s.db, events: s.events, cfgPath: join(s.dir, 'cfg.json') } as Parameters<typeof handleCommand>[2]
  liveExecution(s.cfg.dataDir, { adapter: 'claude-cli' })
  const r = await handleCommand('steer', 'execution:exec-1 text:改方向', d, { issuer: 'discord:u9' })
  expect(r.text).toContain('UNSUPPORTED')
  const list = await handleCommand('controls', '', d)
  expect(list.text).toContain('UNSUPPORTED')
  expect(list.text).toContain('exec-1'.slice(0, 8))
  s.controls.close(); s.db.close()
})

test('Discord handleCommand: /enqueue queues against live execution', async () => {
  const s = setup()
  const { handleCommand } = await import('../src/bot/handlers.js')
  const d = { cfg: s.cfg, store: s.store, db: s.db, events: s.events, cfgPath: join(s.dir, 'cfg.json') } as Parameters<typeof handleCommand>[2]
  liveExecution(s.cfg.dataDir)
  const r = await handleCommand('enqueue', 'execution:exec-1 text:先跑測試', d, { issuer: 'discord:u9' })
  expect(r.ok).toBe(true)
  expect(r.text).toContain('QUEUED')
  const env = s.controls.list(s.cfg.projectPath)[0]!
  expect(env.issuer).toBe('discord:u9')
  s.controls.close(); s.db.close()
})

test('CLI steer/enqueue/controls via steeringCli', async () => {
  const s = setup()
  const cfgPath = join(s.dir, 'cfg.json')
  writeFileSync(cfgPath, JSON.stringify({
    projectPath: s.dir, backlogFile: join(s.dir, 'BACKLOG.md'), dataDir: s.cfg.dataDir,
    engine: 'mock', stopFile: s.cfg.stopFile, worktreesDir: s.cfg.worktreesDir, timezoneOffsetHours: 0,
  }))
  liveExecution(s.cfg.dataDir)
  const { steeringCli } = await import('../src/cli/steering.js')
  const logs: string[] = []
  const origLog = console.log
  console.log = (m: unknown) => logs.push(String(m))
  try {
    await steeringCli('enqueue', ['--config', cfgPath, '--execution', 'exec-1', '--text', '先跑測試'])
    expect(logs.at(-1)).toContain('QUEUED')
    await steeringCli('steer', ['--config', cfgPath, '--execution', 'exec-1', '--text', '改方向'])
    expect(logs.at(-1)).toContain('STEER')  // mock adapter 支援 in-flight
    await steeringCli('controls', ['--config', cfgPath])
    expect(logs.at(-1)).toContain('exec-1')
  } finally { console.log = origLog }
  s.controls.close(); s.db.close()
})

// ── active-execution registry ──

test('active execution record lifecycle and orphan marking', () => {
  const s = setup()
  liveExecution(s.cfg.dataDir)
  expect(readActiveExecution(s.cfg.dataDir, 'exec-1')?.phase).toBe('engine-run')
  updateActiveExecutionPhase(s.cfg.dataDir, 'exec-1', 'host-verify')
  expect(readActiveExecution(s.cfg.dataDir, 'exec-1')?.phase).toBe('host-verify')
  const orphaned = markOrphanedExecutions(s.cfg.dataDir)
  expect(orphaned).toContain('exec-1')
  expect(readActiveExecution(s.cfg.dataDir, 'exec-1')?.phase).toBe('terminal')
  s.controls.close(); s.db.close()
})
