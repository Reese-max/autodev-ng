import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { ConfigSchema } from '../src/types.js'
import type { Deps } from '../src/scheduler.js'
import { BacklogStore } from '../src/backlog.js'
import { runGoalSession } from '../src/autopilot/orchestrator.js'
import { verifyAndSupplement } from '../src/autopilot/supplement.js'
import { runGoalWithDeps } from '../src/autopilot/session.js'

vi.mock('../src/autopilot/git-workspace.js', () => ({ inspectGitWorkspace: () => ({ ok: true }) }))
vi.mock('../src/autopilot/orchestrator.js', () => ({ runGoalSession: vi.fn() }))
vi.mock('../src/autopilot/supplement.js', () => ({ verifyAndSupplement: vi.fn() }))
vi.mock('../src/scheduler.js', () => ({ runOnce: vi.fn(async () => 'failed'), finalizeRunOnceHeartbeat: vi.fn() }))
const dirs: string[] = []
afterEach(() => { vi.resetAllMocks(); for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })

function setup(verify = true) {
  const dir = mkdtempSync(join(tmpdir(), 'adng-completion-')); dirs.push(dir)
  const dataDir = join(dir, 'data'); mkdirSync(dataDir)
  const goalFile = join(dir, 'GOAL.md'); writeFileSync(goalFile, '# GOAL\nbounded goal\n' + (verify ? '\n## 驗收\n```sh\nnode -e "process.exit(0)"\n```\n' : ''))
  const cfg = ConfigSchema.parse({ projectPath: dir, dataDir, backlogFile: join(dataDir, 'BACKLOG.md'), goalFile, stopFile: join(dir, 'stop'),
    defaultEngine: 'astra', engines: { astra: { adapter: 'codex', model: 'gpt-6-astra', costPerRunUsd: 0 } },
    llmTransport: 'cli', judgeModel: 'gpt-6-astra', auditModel: 'gpt-5.6-sol' })
  writeFileSync(cfg.backlogFile, '')
  const reflect = vi.fn(async () => {}), deps = { cfg, store: new BacklogStore(cfg.backlogFile), lessons: { inject: () => '', reflect }, events: { append: vi.fn() } } as unknown as Deps
  return { cfg, deps, reflect, notifier: { send: vi.fn(async () => true) } }
}

test('無機械驗收與同模型自審均在派工前拒絕', async () => {
  const a = setup(false)
  expect(await runGoalWithDeps(a.deps, a.notifier, a.cfg)).toMatchObject({ outcome: { kind: 'stuck', rounds: 0 } })
  const b = setup(); b.cfg.auditModel = b.cfg.judgeModel
  expect(await runGoalWithDeps(b.deps, b.notifier, b.cfg)).toMatchObject({ outcome: { kind: 'stuck', rounds: 0 } })
  expect(runGoalSession).not.toHaveBeenCalled()
})

test.each(['reject', 'exception'])('補充審查 %s 不得保留 achieved，最終稽核與回傳一致', async mode => {
  const a = setup()
  vi.mocked(runGoalSession).mockResolvedValue({ kind: 'achieved', rounds: 1 })
  if (mode === 'exception') vi.mocked(verifyAndSupplement).mockRejectedValue(new Error('audit unavailable'))
  else vi.mocked(verifyAndSupplement).mockResolvedValue({ clean: false, rounds: 1, supplemented: 0, residualGaps: ['missing check'] })
  expect(await runGoalWithDeps(a.deps, a.notifier, a.cfg)).toMatchObject({ outcome: { kind: 'stuck' } })
  const log = readdirSync(a.cfg.dataDir).find(name => /^goal-.*jsonl$/.test(name))!
  const outcomes = readFileSync(join(a.cfg.dataDir, log), 'utf8').trim().split('\n').map(line => JSON.parse(line)).filter(row => row.outcome)
  expect(outcomes.map(row => row.outcome.kind)).toEqual(['stuck'])
})

test('自主派工與補足派工都觸發既有反思，反思故障不改寫結果', async () => {
  const a = setup(); a.reflect.mockRejectedValue(new Error('learning unavailable'))
  vi.mocked(runGoalSession).mockImplementation(async input => { await input.runOnceFn(a.deps); return { kind: 'achieved', rounds: 1 } })
  vi.mocked(verifyAndSupplement).mockImplementation(async input => { await input.runOnceFn(); return { clean: true, rounds: 1, supplemented: 1, residualGaps: [] } })
  expect(await runGoalWithDeps(a.deps, a.notifier, a.cfg)).toMatchObject({ outcome: { kind: 'achieved' } })
  expect(a.reflect).toHaveBeenCalledTimes(2)
})
