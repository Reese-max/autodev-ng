import { mkdtempSync, writeFileSync } from 'node:fs'
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

test('registry 接受 herdr 並要求 launcher 路徑', () => {
  const { dir, launcher } = fixture()
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile: join(dir, 'BACKLOG.md'), dataDir: dir,
    defaultEngine: 'herdr', engines: { herdr: { adapter: 'herdr', command: launcher, provider: 'Pi', costPerRunUsd: 0 } },
  })
  expect(makeEngineRegistry(cfg).resolve('herdr')).toBeInstanceOf(HerdrEngine)
})

test('preflight 只查固定 session 且要求 compatible=true', async () => {
  const { launcher, cache } = fixture()
  const calls: Parameters<typeof runProcess>[0][] = []
  const runner: typeof runProcess = async opts => {
    calls.push(opts)
    return proc('{"running":true,"compatible":true,"protocol":20}')
  }
  const engine = new HerdrEngine({ command: launcher, cache, runProcess: runner })

  expect(await engine.preflight()).toMatchObject({ ok: true, admission: { quota: { state: 'unknown' }, model: { state: 'unknown' } } })
  expect(calls).toHaveLength(1)
  expect(calls[0]?.args).toEqual(['--session', 'herdr-autopilot', 'status', 'server', '--json'])
  await engine.preflight()
  expect(calls).toHaveLength(1)
})

test('run 固定單輪、禁止 Herdr commit，成功後才由 AutoDev 宿主提交', async () => {
  const { dir, launcher, cache } = fixture()
  const commit = vi.fn(() => 'bbb')
  const calls: Parameters<typeof runProcess>[0][] = []
  const runner: typeof runProcess = async opts => {
    calls.push(opts)
    return proc('AUTOPILOT_WAIT_OK request=x session=herdr-autopilot pane=p1')
  }
  const engine = new HerdrEngine({
    command: launcher, cache, verifyCommand: 'npm test', runProcess: runner,
    getCommitHash: () => 'aaa', commitChanges: commit,
  })

  const result = await engine.run({ task, projectPath: dir })

  expect(result).toMatchObject({ ok: true, baseCommitHash: 'aaa', commitHash: 'bbb' })
  expect(commit).toHaveBeenCalledTimes(1)
  expect(calls[0]?.args).toEqual(expect.arrayContaining([
    '-BudgetPolicy', 'GPTOnly', '-Provider', 'Codex', '-SessionName', 'herdr-autopilot', '-MaxRounds', '1', '-AllowLocalCommit:$false', '-FullGate', 'npm test', '-Wait',
  ]))
  expect(calls[0]?.args.join(' ')).not.toContain('-ParallelTask')
  expect(calls[0]?.args.join(' ')).toContain('adng-a-b-c-aaa')
})

test('Pi provider 以 CostAware 明確路由，不落入 GPTOnly 阻擋', async () => {
  const { dir, launcher, cache } = fixture()
  const calls: Parameters<typeof runProcess>[0][] = []
  const engine = new HerdrEngine({
    command: launcher, cache, provider: 'Pi', runProcess: async opts => {
      calls.push(opts)
      return proc('AUTOPILOT_WAIT_OK request=x session=herdr-autopilot pane=p1')
    },
    getCommitHash: () => 'aaa', commitChanges: () => 'bbb',
  })

  expect((await engine.run({ task, projectPath: dir })).ok).toBe(true)
  expect(calls[0]?.args).toEqual(expect.arrayContaining(['-BudgetPolicy', 'CostAware', '-Provider', 'Pi']))
})

test('Herdr 自行 commit 時 fail-closed，不做第二次宿主提交', async () => {
  const { dir, launcher, cache } = fixture()
  const hashes = ['aaa', 'bbb']
  const commit = vi.fn(() => 'ccc')
  const engine = new HerdrEngine({
    command: launcher, cache,
    runProcess: async () => proc('AUTOPILOT_WAIT_OK request=x session=herdr-autopilot pane=p1'),
    getCommitHash: () => hashes.shift(), commitChanges: commit,
  })

  const result = await engine.run({ task, projectPath: dir })

  expect(result.ok).toBe(false)
  expect(result.failureReason).toContain('unexpected-commit')
  expect(commit).not.toHaveBeenCalled()
})
