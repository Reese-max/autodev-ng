import { afterEach, expect, test, vi } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runCli } from '../src/cli/entry.js'

afterEach(() => {
  vi.restoreAllMocks()
  process.exitCode = undefined
})

async function captureCli(argv: string[]): Promise<{ stdout: string[]; stderr: string[]; exitCode: number }> {
  const stdout: string[] = []
  const stderr: string[] = []
  const log = vi.spyOn(console, 'log').mockImplementation((...args) => stdout.push(args.map(String).join(' ')))
  const error = vi.spyOn(console, 'error').mockImplementation((...args) => stderr.push(args.map(String).join(' ')))
  process.exitCode = undefined
  try {
    await runCli(argv, 'cli.js')
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err))
    process.exitCode = 1
  } finally {
    log.mockRestore()
    error.mockRestore()
  }
  return { stdout, stderr, exitCode: process.exitCode ?? 0 }
}

function fixture(verifyExit: number) {
  const root = mkdtempSync(join(tmpdir(), 'adng-run-'))
  const project = join(root, 'project')
  const dataDir = join(root, 'data')
  mkdirSync(project, { recursive: true })
  mkdirSync(dataDir, { recursive: true })
  writeFileSync(join(project, 'BACKLOG.md'), '')
  writeFileSync(join(project, 'check.mjs'), `process.exit(${verifyExit})\n`)
  const config = join(root, 'config.json')
  writeFileSync(config, JSON.stringify({
    projectPath: './project',
    backlogFile: './project/BACKLOG.md',
    dataDir: './data',
    engine: 'mock',
    verifyCommand: 'node check.mjs',
    executionBackend: { adapter: 'long-horizon', maxSameFingerprint: 2, maxRounds: 6 },
  }))
  return { root, project, dataDir, config, cleanup: () => rmSync(root, { recursive: true, force: true }) }
}

const lastJson = (stdout: string[]) => JSON.parse(stdout[stdout.length - 1]!)

test('adng run start drives a goal to verified completion; status/evidence/metrics expose the run', async () => {
  const { root, config, dataDir, cleanup } = fixture(0)
  try {
    const started = await captureCli(['run', 'start', '--config', config, '--goal', 'add the feature'])
    expect(started.stderr).toEqual([])
    expect(started.exitCode).toBe(0)
    const snap = lastJson(started.stdout)
    expect(snap.phase).toBe('complete')
    expect(snap.backend).toBe('long-horizon')
    const runId = snap.runId as string

    const status = await captureCli(['run', 'status', '--config', config, '--id', runId])
    expect(status.exitCode).toBe(0)
    expect(lastJson(status.stdout).phase).toBe('complete')

    const evidence = await captureCli(['run', 'evidence', '--config', config, '--id', runId])
    const bundle = lastJson(evidence.stdout)
    expect(bundle.state.runId).toBe(runId)
    expect(bundle.attempts.length).toBeGreaterThanOrEqual(1)
    expect(bundle.checkpoints.length).toBe(1)

    const listed = await captureCli(['run', 'status', '--config', config])
    expect(lastJson(listed.stdout).map((r: { runId: string }) => r.runId)).toContain(runId)

    const metrics = await captureCli(['run', 'metrics', '--config', config])
    const summary = lastJson(metrics.stdout)
    expect(summary.runs).toBe(1)
    expect(summary.completed).toBe(1)
    expect(summary.completionRate).toBe(1)
    // run state persisted under <dataDir>/runs/<id>/
    expect(readFileSync(join(dataDir, 'runs', runId, 'state.json'), 'utf8')).toContain('"phase": "complete"')
  } finally {
    cleanup()
  }
})

test('adng run start can build the goal from a synced GitHub issue', async () => {
  const { config, cleanup } = fixture(0)
  const root = join(config, '..')
  try {
    const ghData = join(root, 'ghdata')
    mkdirSync(join(ghData, 'issue-7'), { recursive: true })
    const ghConfig = join(root, 'github.json')
    writeFileSync(ghConfig, JSON.stringify({
      repo: 'octo/demo', base: 'main', label: null, authors: ['dev'],
      sourceConfig: './config.json', dataDir: './ghdata', engine: 'mock',
    }))
    writeFileSync(join(ghData, 'issue-7', 'state.json'), JSON.stringify({
      repo: 'octo/demo', base: 'main', fingerprint: 'a'.repeat(64),
      status: 'queued', runs: 0, nextRunAt: 0,
      issue: { number: 7, title: 'Fix the crash', body: 'repro steps', state: 'open', user: { login: 'dev' }, labels: [] },
    }))
    const started = await captureCli(['run', 'start', '--config', config, '--github-config', ghConfig, '--issue', '7'])
    expect(started.exitCode).toBe(0)
    const snap = lastJson(started.stdout)
    expect(snap.phase).toBe('complete')
    const state = JSON.parse(readFileSync(join(root, 'data', 'runs', snap.runId, 'state.json'), 'utf8'))
    expect(state.goal.issue).toEqual({ repo: 'octo/demo', number: 7 })
    expect(state.goal.objective).toContain('octo/demo#7')
  } finally {
    cleanup()
  }
})

test('repeated failure fingerprint blocks the run; fixing the verifier then resume completes it', async () => {
  const { root, project, config, cleanup } = fixture(1)
  try {
    const started = await captureCli(['run', 'start', '--config', config, '--goal', 'fix the bug'])
    expect(started.exitCode).toBe(1)
    const snap = lastJson(started.stdout)
    expect(snap.phase).toBe('blocked')

    writeFileSync(join(project, 'check.mjs'), 'process.exit(0)\n')
    const resumed = await captureCli(['run', 'resume', '--config', config, '--id', snap.runId])
    expect(resumed.exitCode).toBe(0)
    expect(lastJson(resumed.stdout).phase).toBe('complete')
  } finally {
    cleanup()
  }
})

test('high-risk goals park at needs-approval until an explicit approve and resume', async () => {
  const { config, cleanup } = fixture(0)
  try {
    const started = await captureCli(['run', 'start', '--config', config, '--goal', 'deploy to production'])
    expect(started.exitCode).toBe(2)
    const snap = lastJson(started.stdout)
    expect(snap.phase).toBe('needs-approval')

    const approved = await captureCli(['run', 'approve', '--config', config, '--id', snap.runId, '--by', 'ops'])
    expect(approved.exitCode).toBe(0)
    expect(lastJson(approved.stdout).pendingApproval.approved).toBe(true)

    const resumed = await captureCli(['run', 'resume', '--config', config, '--id', snap.runId])
    expect(resumed.exitCode).toBe(0)
    expect(lastJson(resumed.stdout).phase).toBe('complete')
  } finally {
    cleanup()
  }
})

test('interrupt abort cancels a parked run and later resume is rejected', async () => {
  const { config, cleanup } = fixture(0)
  try {
    const started = await captureCli(['run', 'start', '--config', config, '--goal', 'deploy to production'])
    const runId = lastJson(started.stdout).runId as string
    const aborted = await captureCli(['run', 'interrupt', '--config', config, '--id', runId, '--kind', 'abort', '--by', 'ops'])
    expect(aborted.exitCode).toBe(0)
    expect(lastJson(aborted.stdout).phase).toBe('cancelled')
    const resumed = await captureCli(['run', 'resume', '--config', config, '--id', runId])
    expect(resumed.exitCode).toBe(1)
    expect(resumed.stderr.join('\n')).toMatch(/terminal|cancelled|不可/i)
  } finally {
    cleanup()
  }
})

test('usage errors stay fail-closed', async () => {
  const { config, cleanup } = fixture(0)
  try {
    for (const argv of [
      ['run'],
      ['run', 'bogus', '--config', config],
      ['run', 'start', '--config', config],
      ['run', 'status', '--config', config, '--id', 'missing-run'],
    ]) {
      const r = await captureCli(argv)
      expect(r.exitCode, argv.join(' ')).toBe(1)
    }
  } finally {
    cleanup()
  }
})
