import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { assembleConfig } from '../src/cli/assemble.js'
import { withAssembled } from '../src/cli/assemble.js'
import { executeIssue, issueTask } from '../src/github/job.js'
import { GithubConfigSchema } from '../src/github/config.js'
import { branchFor, fingerprint, runDir, type IssueState } from '../src/github/state.js'

// These fakes exercise the original public callers without Git/SQLite/provider/PID work.
const h = vi.hoisted(() => ({
  dbCalls: 0, dbThrows: false, dbError: undefined as unknown,
  teams: [] as Array<{ close(): void }>, teamCalls: [] as number[],
  teamThrows: new Set<number>(), teamErrors: [] as unknown[],
  verifierThrows: false, verifierError: undefined as unknown,
  timeline: [] as string[], schedulerCalls: 0, commandCalls: 0,
}))
vi.mock('../src/db.js', () => ({ RunDb: class {
  close() { h.dbCalls++; h.timeline.push('db'); if (h.dbThrows) throw h.dbError }
} }))
vi.mock('../src/engines/team-state.js', () => ({ TeamState: class {
  id = h.teams.length
  constructor() { h.teams.push(this) }
  attemptsToday() { return 0 }
  close() {
    h.teamCalls[this.id] = (h.teamCalls[this.id] ?? 0) + 1
    h.timeline.push(`team-${this.id}`)
    if (h.teamThrows.has(this.id)) throw h.teamErrors[this.id]
  }
} }))
vi.mock('../src/verifier.js', () => ({ KernelVerifier: class {
  constructor() { if (h.verifierThrows) throw h.verifierError }
  async check() { return { pass: false, reason: 'owned verifier fixture' } }
} }))
vi.mock('../src/engines/registry.js', () => ({ makeEngineRegistry: () => ({ resolve: () => ({
  async preflight() { return { ok: true } },
  async run() { throw new Error('No provider/runner dispatch allowed in ownership fixture') },
}) }) }))
vi.mock('../src/engines/notify.js', () => ({
  DiscordNotifier: class { async send() { throw new Error('No notification allowed') } },
  TelegramNotifier: class { async send() { throw new Error('No notification allowed') } },
  formatTelegramTaskMessage: () => 'unused',
}))
vi.mock('../src/scheduler.js', () => ({
  async runOnce() { h.schedulerCalls++; throw new Error('No scheduler dispatch allowed in ownership fixture') },
  finalizeRunOnceHeartbeat() { throw new Error('No heartbeat work allowed in ownership fixture') },
}))
vi.mock('../src/github/repair.js', () => ({
  async prepareRepair() {}, async reviewRepair() { throw new Error('No review provider allowed') },
  async verifyRepairProbe() { throw new Error('No repair probe allowed') }, assertRepairEvidence() {},
}))
vi.mock('../src/github/client.js', () => ({ command: (name: string, args: string[]) => {
  h.commandCalls++
  if (name !== 'git') throw new Error('Only inert Git protocol fixture is allowed')
  if (args.includes('symbolic-ref')) return 'autodev/issue-7'
  if (args.includes('status')) return ''
  if (args.includes('get-url')) return 'https://github.com/owner/project.git'
  if (args.includes('rev-parse')) return '1'.repeat(40)
  throw new Error('Unexpected Git operation in ownership fixture')
} }))

const roots: string[] = []
beforeEach(() => {
  h.dbCalls = 0; h.dbThrows = false; h.dbError = undefined
  h.teams.length = 0; h.teamCalls.length = 0; h.teamThrows.clear(); h.teamErrors.length = 0
  h.verifierThrows = false; h.verifierError = undefined; h.timeline.length = 0
  h.schedulerCalls = 0; h.commandCalls = 0
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('No outbound provider request allowed') }))
})
afterEach(() => {
  vi.unstubAllGlobals()
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})
function sourceConfig() {
  const root = mkdtempSync(join(tmpdir(), 'adng-owned-resources-')); roots.push(root)
  const file = join(root, 'source.json')
  writeFileSync(file, JSON.stringify({ projectPath: root, backlogFile: 'BACKLOG.md', dataDir: 'data',
    engines: { writer: { adapter: 'codex', model: 'owned-fixture', costPerRunUsd: 0 } }, defaultEngine: 'writer', reviewEngine: 'owned-reviewer' }))
  return { root, file }
}
async function outcome(action: () => Promise<unknown>) {
  try { return { threw: false, value: await action() } }
  catch (error) { return { threw: true, value: error } }
}
function assertOneCloseEach() {
  expect(h.dbCalls).toBe(1)
  expect(h.teamCalls).toEqual([1])
  expect(h.timeline).toEqual(['db', 'team-0'])
  expect(h.schedulerCalls).toBe(0)
}

test('withAssembled preserves a successful value and closes both resources once', async () => {
  const f = sourceConfig(), value = { delivered: 'owned callback only' }
  expect(await withAssembled(f.file, async () => value)).toBe(value)
  assertOneCloseEach()
})
test('withAssembled preserves the exact primary failure after both successful closes', async () => {
  const f = sourceConfig(), primary = new Error('callback primary')
  expect((await outcome(() => withAssembled(f.file, async () => { throw primary }))).value).toBe(primary)
  assertOneCloseEach()
})
test('a callback throwing undefined is a failure rather than a successful undefined result', async () => {
  const f = sourceConfig()
  expect(await outcome(() => withAssembled(f.file, async () => { throw undefined }))).toEqual({ threw: true, value: undefined })
  assertOneCloseEach()
})
test('a successful undefined callback remains successful', async () => {
  const f = sourceConfig()
  expect(await outcome(() => withAssembled(f.file, async () => undefined))).toEqual({ threw: false, value: undefined })
  assertOneCloseEach()
})
test('a database close failure rejects success but does not skip the team close', async () => {
  const f = sourceConfig(), cleanup = new Error('database close')
  h.dbThrows = true; h.dbError = cleanup
  expect(await outcome(() => withAssembled(f.file, async () => 'result'))).toEqual({ threw: true, value: cleanup })
  assertOneCloseEach()
})
test('a lone team close failure is returned exactly', async () => {
  const f = sourceConfig(), cleanup = new Error('team close')
  h.teamThrows.add(0); h.teamErrors[0] = cleanup
  expect((await outcome(() => withAssembled(f.file, async () => 'result'))).value).toBe(cleanup)
  assertOneCloseEach()
})
test('two close failures reject success with both original errors', async () => {
  const f = sourceConfig(), db = new Error('db close'), team = new Error('team close')
  h.dbThrows = true; h.dbError = db; h.teamThrows.add(0); h.teamErrors[0] = team
  const result = await outcome(() => withAssembled(f.file, async () => 'result'))
  expect(result.threw).toBe(true); expect(result.value).toBeInstanceOf(AggregateError)
  expect((result.value as AggregateError).errors).toEqual([db, team])
  assertOneCloseEach()
})
test.each(['db', 'team', 'both'] as const)('primary plus %s close failure retains every error and primary cause', async kind => {
  const f = sourceConfig(), primary = new Error('original primary'), db = new Error('database cleanup'), team = new Error('team cleanup')
  if (kind !== 'team') { h.dbThrows = true; h.dbError = db }
  if (kind !== 'db') { h.teamThrows.add(0); h.teamErrors[0] = team }
  const result = await outcome(() => withAssembled(f.file, async () => { throw primary }))
  const error = result.value as AggregateError
  expect(result.threw).toBe(true); expect(error).toBeInstanceOf(AggregateError)
  expect(error.errors).toEqual([primary, ...(kind !== 'team' ? [db] : []), ...(kind !== 'db' ? [team] : [])])
  expect(error.cause).toBe(primary); expect(error.message).toContain(primary.message)
  if (kind !== 'team') expect(error.message).toContain(db.message)
  if (kind !== 'db') expect(error.message).toContain(team.message)
  assertOneCloseEach()
})
test('undefined primary is retained in an aggregate with a cleanup failure', async () => {
  const f = sourceConfig(), cleanup = new Error('database cleanup')
  h.dbThrows = true; h.dbError = cleanup
  const result = await outcome(() => withAssembled(f.file, async () => { throw undefined }))
  expect(result.threw).toBe(true); expect(result.value).toBeInstanceOf(AggregateError)
  expect((result.value as AggregateError).errors).toEqual([undefined, cleanup])
  expect(Object.hasOwn(result.value as object, 'cause')).toBe(true)
  expect((result.value as AggregateError).cause).toBeUndefined()
  assertOneCloseEach()
})

function issueFixture(repair = false) {
  const f = sourceConfig()
  const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: f.file,
    dataDir: join(f.root, 'github'), engine: 'writer', template: true, verifyCommand: 'owned-fixture-check',
    ...(repair ? { repair: { reportConfig: join(f.root, 'report.json'), probeIds: ['owned-probe'], prepareCommand: 'owned-prepare' } } : {}) })
  const issue = { number: 7, title: 'Owned lifecycle', body: 'No provider execution', state: 'open' as const,
    user: { login: 'owner' }, labels: [] }
  const state: IssueState = { repo: cfg.repo, base: cfg.base, issue, fingerprint: fingerprint(issue), status: 'queued',
    runs: 0, nextRunAt: 0, baseSha: '1'.repeat(40) }
  const dir = runDir(cfg, state); mkdirSync(join(dir, 'repo'), { recursive: true }); writeFileSync(join(dir, 'BACKLOG.md'), '')
  const closes = { db: 0, previous: 0 }
  const previous = { close() { closes.previous++; h.timeline.push('previous') } }
  const app = { deps: { db: { close() { closes.db++; h.timeline.push('job-db') } }, team: previous,
    store: { read: () => [{ id: 'owned-task', text: issueTask(state), status: 'blocked' }] },
    verifier: { async check() { return { pass: false, reason: 'unused' } } } } } as unknown as ReturnType<typeof assembleConfig>
  return { ...f, cfg, state, closes, previous, app }
}
test('executeIssue owns resources before the billing-source mutation can fail', async () => {
  const f = issueFixture(), primary = new Error('billing setter')
  Object.defineProperty(f.app.deps, 'billingSourceHash', { set() { throw primary } })
  expect((await outcome(() => executeIssue(f.cfg, f.state, () => f.app))).value).toBe(primary)
  expect(f.closes).toEqual({ db: 1, previous: 1 }); expect(h.schedulerCalls).toBe(0)
})
test('executeIssue missing-verifier rejection still closes already assembled resources', async () => {
  const f = issueFixture(); f.app.deps.verifier = undefined
  const result = await outcome(() => executeIssue(f.cfg, f.state, () => f.app))
  expect(result.threw).toBe(true); expect((result.value as Error).message).toBe('GitHub runner requires a verifier')
  expect(f.closes).toEqual({ db: 1, previous: 1 }); expect(h.schedulerCalls).toBe(0)
})
test('executeIssue repair verifier construction failure closes the owned app', async () => {
  const f = issueFixture(true), primary = new Error('repair verifier construction')
  h.verifierThrows = true; h.verifierError = primary
  expect((await outcome(() => executeIssue(f.cfg, f.state, () => f.app))).value).toBe(primary)
  expect(f.closes).toEqual({ db: 1, previous: 1 }); expect(h.teams).toHaveLength(0)
})
test('successful shared-team replacement closes old and new once on an ordinary blocked return', async () => {
  const f = issueFixture(true)
  expect(await executeIssue(f.cfg, f.state, () => f.app)).toMatchObject({ done: false, startState: 'not-started', terminalBlocked: true })
  expect(f.closes).toEqual({ db: 1, previous: 1 }); expect(h.teamCalls).toEqual([1])
  expect(f.app.deps.team).toBe(h.teams[0]); expect(h.schedulerCalls).toBe(0)
})
test('old-team close failure leaves the new team owned and does not retry the old close', async () => {
  const f = issueFixture(true), primary = new Error('old team close')
  f.previous.close = () => { f.closes.previous++; h.timeline.push('previous'); throw primary }
  expect((await outcome(() => executeIssue(f.cfg, f.state, () => f.app))).value).toBe(primary)
  expect(f.closes).toEqual({ db: 1, previous: 1 }); expect(h.teamCalls).toEqual([1])
  expect(f.app.deps.team).toBe(h.teams[0]); expect(h.schedulerCalls).toBe(0)
})
test('old and new team close failures preserve both failures without retrying either', async () => {
  const f = issueFixture(true), primary = new Error('old team close'), cleanup = new Error('new team close')
  f.previous.close = () => { f.closes.previous++; throw primary }
  h.teamThrows.add(0); h.teamErrors[0] = cleanup
  const result = await outcome(() => executeIssue(f.cfg, f.state, () => f.app))
  expect(result.threw).toBe(true); expect(result.value).toBeInstanceOf(AggregateError)
  expect((result.value as AggregateError).errors).toEqual([primary, cleanup])
  expect((result.value as AggregateError).cause).toBe(primary)
  expect(f.closes).toEqual({ db: 1, previous: 1 }); expect(h.teamCalls).toEqual([1]); expect(h.schedulerCalls).toBe(0)
})

test('a primary Error with a throwing message getter retains exact primary and cleanup references', async () => {
  const f = sourceConfig(), primary = new Error(), cleanup = new Error('database cleanup')
  Object.defineProperty(primary, 'message', { get() { throw new Error('unprintable message') } })
  h.dbThrows = true; h.dbError = cleanup
  const result = await outcome(() => withAssembled(f.file, async () => { throw primary }))
  expect(result.threw).toBe(true); expect(result.value).toBeInstanceOf(AggregateError)
  const error = result.value as AggregateError
  expect(error.errors).toHaveLength(2); expect(error.errors[0]).toBe(primary); expect(error.errors[1]).toBe(cleanup)
  expect(error.cause).toBe(primary); expect(error.message).toContain('unprintable thrown value')
  assertOneCloseEach()
})
test('a primary Proxy with throwing getPrototypeOf retains exact primary and cleanup references', async () => {
  const f = sourceConfig(), cleanup = new Error('database cleanup')
  const primary = new Proxy({}, { getPrototypeOf() { throw new Error('unprintable prototype') } })
  h.dbThrows = true; h.dbError = cleanup
  const result = await outcome(() => withAssembled(f.file, async () => { throw primary }))
  expect(result.threw).toBe(true); expect(result.value).toBeInstanceOf(AggregateError)
  const error = result.value as AggregateError
  expect(error.errors).toHaveLength(2); expect(error.errors[0]).toBe(primary); expect(error.errors[1]).toBe(cleanup)
  expect(error.cause).toBe(primary); expect(error.message).toContain('unprintable thrown value')
  assertOneCloseEach()
})
