import { afterEach, expect, test, vi } from 'vitest'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { GithubConfigSchema, type Issue } from '../src/github/config.js'
import { fingerprint, readState, saveState, type IssueState } from '../src/github/state.js'
import { recoverIssue } from '../src/github/operations.js'
import { observePr } from '../src/github/followup.js'
import { githubConsole } from '../src/github/console.js'
import { type GithubClient } from '../src/github/client.js'
import { git } from '../src/github/job.js'
import { assertRegression, verifyRegression } from '../src/github/regression.js'
import { assertAcceptance, verifyAcceptance } from '../src/github/acceptance.js'
import { runGithub } from '../src/github/runner.js'
import { repairMetrics } from '../src/github/operations.js'

const dirs: string[] = []
afterEach(() => { vi.restoreAllMocks(); for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })
function setup() {
  const root = mkdtempSync(join(tmpdir(), 'adng-delivery-')); dirs.push(root)
  mkdirSync(join(root, 'integrations'))
  const source = join(root, 'source.json'), file = join(root, 'integrations/github.json')
  writeFileSync(source, '{}')
  const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: source, dataDir: join(root, 'data'), engine: 'codex', enabled: true, publish: true, followup: true })
  writeFileSync(file, JSON.stringify(cfg))
  const issue: Issue = { number: 7, title: 'Fix addition', body: 'Add numbers', state: 'open', user: { login: 'owner' }, labels: [{ name: 'autodev' }] }
  const state: IssueState = { repo: cfg.repo, base: cfg.base, issue, fingerprint: fingerprint(issue), status: 'blocked', runs: 1, nextRunAt: 0 }
  saveState(cfg, state)
  const client: GithubClient = { issue: async () => issue, list: async () => [issue], findPr: async () => undefined, findLinkedPr: async () => undefined, createPr: vi.fn() }
  return { root, source, file, cfg, issue, state, client }
}

test('unconfirmed worker blocks the Issue without a retry, publication or false failed-attempt metric', async () => {
  const f = setup()
  f.state.status = 'queued'; f.state.runs = 0; saveState(f.cfg, f.state)
  const execute = vi.fn(async () => ({ done: false, detail: 'team-state-quarantined', recoveryRequired: true }))
  const publish = vi.fn()
  expect(await runGithub(f.cfg, { client: f.client, execute, publish })).toBe('blocked')
  const saved = readState(f.cfg, 7)!
  expect(saved).toMatchObject({ status: 'blocked', runs: 1 })
  expect(saved.detail).toContain('Execution recovery required:')
  await runGithub(f.cfg, { client: f.client, execute, publish })
  expect(execute).toHaveBeenCalledTimes(1); expect(publish).not.toHaveBeenCalled()
  expect(repairMetrics(f.cfg).recordedFailedAttempts).toBe(0)
})
test('normal Issue recovery survives reload, keeps budget, and cannot resume a changed contract', async () => {
  const f = setup(), doctor = vi.fn().mockResolvedValue({ ready: true })
  const resumed = await recoverIssue(f.file, 7, 'CLI environment fixed and verified', false, { client: f.client, doctor })
  expect(resumed.status).toBe('queued'); expect(readState(f.cfg, 7)!.runs).toBe(1)
  f.issue.body = 'different task'
  await expect(recoverIssue(f.file, 7, 'Must preserve current issue snapshot', false, { client: f.client, doctor })).rejects.toThrow('Issue changed')
  expect(doctor).toHaveBeenCalledTimes(1)
})
test.each(['pending', 'changed-head', 'withdrawn', 'exhausted', 'disabled', 'merged'])('PR follow-up does not dispatch unsafe or unnecessary revision: %s', async mode => {
  const f = setup(); Object.assign(f.state, { status: 'published', commit: 'a'.repeat(40), pr: 'https://github.com/owner/project/pull/8' })
  if (mode === 'withdrawn') f.issue.labels = []
  if (mode === 'exhausted') f.state.runs = f.cfg.maxRuns
  if (mode === 'disabled') f.cfg.followup = false
  f.client.feedback = async () => ({ number: 8, url: f.state.pr!, head: (mode === 'changed-head' ? 'b' : 'a').repeat(40), base: 'main', state: mode === 'merged' ? 'merged' : 'open', checks: mode === 'pending' ? 'pending' : 'fail', feedback: 'Fix failing test assertion' })
  const check = vi.fn()
  if (['changed-head', 'withdrawn'].includes(mode)) await expect(observePr(f.cfg, f.state, f.client, () => true, check)).rejects.toThrow()
  else await observePr(f.cfg, f.state, f.client, () => true, check)
  expect(f.state.revision).toBeUndefined(); expect(check).not.toHaveBeenCalled()
})
test('console restricts configuration selection and reports unverified evidence honestly', async () => {
  const f = setup()
  writeFileSync(join(f.root, 'integrations/other.json'), JSON.stringify({ ...f.cfg, sourceConfig: 'other-project.json' }))
  writeFileSync(join(f.root, 'integrations/github.example.json'), JSON.stringify(f.cfg))
  const result = await githubConsole(f.source) as { integrations: { issues: { verified: boolean }[] }[] }
  expect(result.integrations).toHaveLength(1); expect(result.integrations[0]!.issues[0]!.verified).toBe(false)
  await expect(githubConsole(f.source, { action: 'retry', integration: '../source.json', issue: 7 })).rejects.toThrow()
})
test('HTTP console requires token for reads and writes, limits config selection, and serves its browser module', async () => {
  const f = setup(), path = '../web/server.mjs', { createServer } = await import(path)
  const server = createServer({ cfgPath: f.source, token: 'fixture-token', indexHtml: '<html>fixture</html>' })
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done))
  const base = `http://127.0.0.1:${server.address().port}`
  try {
    expect((await fetch(base + '/api/github')).status).toBe(403)
    expect((await fetch(base + '/api/github', { method: 'POST' })).status).toBe(403)
    const headers = { 'x-csrf-token': 'fixture-token', 'content-type': 'application/json' }
    const response = await fetch(base + '/api/github', { headers })
    expect(response.status).toBe(200); expect((await response.json()).integrations[0].issues[0].number).toBe(7)
    expect((await fetch(base + '/api/github', { method: 'POST', headers, body: JSON.stringify({ action: 'retry', integration: '../source.json', issue: 7 }) })).status).toBe(409)
    expect((await fetch(base + '/github.mjs')).headers.get('content-type')).toContain('javascript')
  } finally { await new Promise<void>(done => server.close(done)) }
})
test('custom Python regression proves red/green and acceptance binds the exact configured command', async () => {
  const f = setup(), cwd = join(f.cfg.dataDir, 'issue-7/repo'); mkdirSync(cwd)
  git(cwd, ['init', '-b', 'main']); git(cwd, ['config', 'user.name', 'Test']); git(cwd, ['config', 'user.email', 'test@example.invalid'])
  writeFileSync(join(cwd, 'addition.py'), 'def add(a,b): return a-b\n')
  git(cwd, ['add', '.']); git(cwd, ['commit', '-qm', 'base']); f.state.baseSha = git(cwd, ['rev-parse', 'HEAD'])
  const cfg = GithubConfigSchema.parse({ ...f.cfg, regression: { file: 'tests/regressions/github-{issue}-{revision}.py', command: 'python', args: ['{file}'], passPattern: 'ADNG_TEST_OK', failPattern: 'AssertionError' }, acceptance: { command: 'python', args: ['-c', 'from addition import add; assert add(2,3)==5'] } })
  mkdirSync(join(cwd, 'tests/regressions'), { recursive: true })
  writeFileSync(join(cwd, 'tests/regressions/github-7-0.py'), "import sys\nsys.dont_write_bytecode = True\nsys.path.insert(0, '.')\nfrom addition import add\nassert add(2,3) == 5\nprint('ADNG_TEST_OK')\n")
  writeFileSync(join(cwd, 'addition.py'), 'def add(a,b): return a+b\n')
  git(cwd, ['add', '.']); git(cwd, ['commit', '-qm', 'fix']); f.state.commit = git(cwd, ['rev-parse', 'HEAD'])
  await verifyRegression(cfg, f.state, cwd, f.state.commit, 10000); assertRegression(cfg, f.state, cwd)
  await verifyAcceptance(cfg, f.state, cwd, f.state.commit, 10000); assertAcceptance(cfg, f.state)
  cfg.acceptance!.args = ['-c', 'raise RuntimeError()']
  expect(() => assertAcceptance(cfg, f.state)).toThrow('exact project acceptance')
  await expect(verifyAcceptance(cfg, f.state, cwd, f.state.commit, 10000)).rejects.toThrow('acceptance failed')
  const r = JSON.parse(readFileSync(join(f.cfg.dataDir, 'issue-7', `acceptance-${f.state.commit}.json`), 'utf8'))
  expect(r.result.exitCode).toBe(1)
})
