import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest'
import Database from 'better-sqlite3'
import { execFileSync } from 'node:child_process'
import { lstatSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, isAbsolute, join, resolve } from 'node:path'
import { RunDb } from '../src/db.js'
import { TeamState } from '../src/engines/team-state.js'
import { assembleConfig, withAssembled } from '../src/cli/assemble.js'
import { withOwnedResources } from '../src/cli/owned-resources.js'
import { ConfigSchema } from '../src/types.js'

// Only later factory faults are doubles. Their original constructors run first;
// Database, RunDb, TeamState and assembleConfig are the actual implementations.
const factory = vi.hoisted(() => ({
  at: undefined as 'verifier' | 'evidence' | undefined,
  primary: undefined as unknown,
}))
vi.mock('../src/verifier.js', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/verifier.js')>()
  return { ...actual, KernelVerifier: class extends actual.KernelVerifier {
    constructor(...args: ConstructorParameters<typeof actual.KernelVerifier>) {
      super(...args)
      if (factory.at === 'verifier') throw factory.primary
    }
  } }
})
vi.mock('../src/engines/evidence-chain.js', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/engines/evidence-chain.js')>()
  return { ...actual, EvidenceStore: class extends actual.EvidenceStore {
    constructor(...args: ConstructorParameters<typeof actual.EvidenceStore>) {
      super(...args)
      if (factory.at === 'evidence') throw factory.primary
    }
  } }
})

const originalPragma = Database.prototype.pragma
const originalExec = Database.prototype.exec
const originalClose = Database.prototype.close
const roots: string[] = []
const trackedFiles = new Set<string>()
const handles = new Map<string, Set<Database.Database>>()
const closes: Database.Database[] = []
const nativeFailures: Array<{ db: Database.Database; primary: unknown }> = []
const pragmaFaults = new Map<string, unknown>()
const closeFaults = new Map<string, unknown>()
let nativeReady = false
let fetchCalls = 0

// If this real native query cannot load/run, all following cases are setup-held,
// not meaningful constructor RED. No native constructor is replaced with a fake.
beforeAll(() => {
  const native = new Database(':memory:')
  try { expect(native.prepare('SELECT 1 AS ready').get()).toEqual({ ready: 1 }) }
  finally { originalClose.call(native) }
  nativeReady = true
  console.info('ADNG_R4_NATIVE_READY: actual SQLite query passed')
})

function key(db: Database.Database): string { return resolve(db.name) }
function observe(db: Database.Database): boolean {
  const file = key(db)
  if (!trackedFiles.has(file)) return false
  const found = handles.get(file) ?? new Set<Database.Database>()
  found.add(db); handles.set(file, found)
  return true
}
beforeEach(() => {
  expect(nativeReady).toBe(true)
  factory.at = undefined; factory.primary = undefined
  trackedFiles.clear(); handles.clear(); closes.length = 0; nativeFailures.length = 0
  pragmaFaults.clear(); closeFaults.clear(); fetchCalls = 0
  vi.stubGlobal('fetch', vi.fn(() => { fetchCalls++; throw new Error('No provider request allowed in construction fixture') }))
  vi.spyOn(Database.prototype, 'pragma').mockImplementation(function (this: Database.Database, sql: string, options?: Database.PragmaOptions) {
    observe(this)
    if (sql === 'journal_mode = WAL' && pragmaFaults.has(key(this))) throw pragmaFaults.get(key(this))
    return originalPragma.call(this, sql, options)
  })
  vi.spyOn(Database.prototype, 'exec').mockImplementation(function (this: Database.Database, sql: string) {
    const tracked = observe(this)
    try { return originalExec.call(this, sql) }
    catch (primary) { if (tracked) nativeFailures.push({ db: this, primary }); throw primary }
  })
  vi.spyOn(Database.prototype, 'close').mockImplementation(function (this: Database.Database) {
    if (observe(this)) {
      closes.push(this)
      if (closeFaults.has(key(this))) throw closeFaults.get(key(this))
    }
    return originalClose.call(this)
  })
})
afterEach(() => {
  // Product assertions run before this separate recorder-owned fixture cleanup.
  // Restore all injection first; direct native closes here are NOT product closes.
  vi.restoreAllMocks(); vi.unstubAllGlobals()
  try {
    for (const found of handles.values()) for (const native of found) {
      if (native.open) originalClose.call(native)
    }
    expect(fetchCalls).toBe(0)
  } finally {
    for (const root of roots.splice(0)) {
      expect(isAbsolute(root)).toBe(true)
      expect(dirname(resolve(root))).toBe(resolve(tmpdir()))
      expect(basename(root).startsWith('adng-r4-native-')).toBe(true)
      expect(lstatSync(root).isSymbolicLink()).toBe(false)
      rmSync(root, { recursive: true, force: true })
    }
  }
})

function root(): string {
  const dir = mkdtempSync(join(tmpdir(), 'adng-r4-native-')); roots.push(dir)
  return dir
}
function track(file: string): string { const absolute = resolve(file); trackedFiles.add(absolute); return absolute }
function single(file: string): Database.Database {
  const found = handles.get(resolve(file))
  expect(found?.size).toBe(1)
  return [...found!][0]!
}
function closeCount(native: Database.Database): number { return closes.filter(value => value === native).length }
function expectClosed(file: string): Database.Database {
  const native = single(file)
  expect(closeCount(native)).toBe(1)
  expect(native.open).toBe(false)
  return native
}
function outcome(fn: () => unknown): { threw: boolean; value: unknown } {
  try { return { threw: false, value: fn() } }
  catch (value) { return { threw: true, value } }
}
function seed(file: string, sql: string): void {
  mkdirSync(dirname(file), { recursive: true })
  const native = new Database(file)
  try { native.exec(sql) } finally { native.close() }
}
function repo(): { dir: string; teamFile: string } {
  const dir = root()
  execFileSync('git', ['init', '-b', 'main'], { cwd: dir, stdio: 'pipe', timeout: 10_000, windowsHide: true })
  const raw = execFileSync('git', ['rev-parse', '--git-common-dir'], { cwd: dir, encoding: 'utf8', timeout: 10_000, windowsHide: true }).trim()
  const common = isAbsolute(raw) ? raw : resolve(dir, raw)
  return { dir, teamFile: join(common, 'autodev-ng', 'team.db') }
}
function configFixture() {
  const f = repo(), data = join(f.dir, 'data')
  const cfg = ConfigSchema.parse({ projectPath: f.dir, dataDir: data, backlogFile: join(f.dir, 'BACKLOG.md'),
    engines: { writer: { adapter: 'mock', costPerRunUsd: 0 } }, defaultEngine: 'writer',
    discordTokenFile: join(f.dir, 'owned-absent-token.txt'), worktreesDir: join(f.dir, 'worktrees'),
    stopFile: join(f.dir, 'owned.stop'), judgeApiKey: '', llmTransport: 'http' })
  return { ...f, cfg, runFile: join(data, 'run.db') }
}
function nativePrimary(native: Database.Database): unknown {
  const failures = nativeFailures.filter(value => value.db === native)
  expect(failures).toHaveLength(1)
  expect(failures[0]!.primary).toMatchObject({ code: 'SQLITE_ERROR' })
  return failures[0]!.primary
}
function aggregate(value: unknown, primary: unknown, cleanup: unknown[]): void {
  expect(value).toBeInstanceOf(AggregateError)
  const error = value as AggregateError
  expect(error.errors).toHaveLength(1 + cleanup.length)
  expect(error.errors[0]).toBe(primary)
  cleanup.forEach((failure, i) => expect(error.errors[i + 1]).toBe(failure))
  expect(Object.hasOwn(error, 'cause')).toBe(true)
  expect(error.cause).toBe(primary)
}

test('actual RunDb closes its private native handle after a genuine schema initialization error', () => {
  const file = join(root(), 'run.db')
  seed(file, 'CREATE VIEW attempts AS SELECT 1 AS unrelated')
  track(file)
  const result = outcome(() => new RunDb(file)), native = single(file)
  expect(result.threw).toBe(true)
  expect(result.value).toBe(nativePrimary(native))
  expectClosed(file)
})
test('actual TeamState closes its private native handle after a genuine schema initialization error', () => {
  const f = repo()
  seed(f.teamFile, 'CREATE TABLE team_claims(execution_id TEXT PRIMARY KEY)')
  track(f.teamFile)
  const result = outcome(() => new TeamState(f.dir)), native = single(f.teamFile)
  expect(result.threw).toBe(true)
  expect(result.value).toBe(nativePrimary(native))
  expectClosed(f.teamFile)
})
test('actual RunDb preserves thrown undefined and closes the real allocation once', () => {
  const file = track(join(root(), 'run.db')); pragmaFaults.set(file, undefined)
  expect(outcome(() => new RunDb(file))).toEqual({ threw: true, value: undefined })
  expectClosed(file)
})
test('actual TeamState preserves thrown undefined and closes the real allocation once', () => {
  const f = repo(), file = track(f.teamFile); pragmaFaults.set(file, undefined)
  expect(outcome(() => new TeamState(f.dir))).toEqual({ threw: true, value: undefined })
  expectClosed(file)
})
test('RunDb initialization plus injected close fault on a real native handle retains both references without retrying cleanup', () => {
  const file = track(join(root(), 'run.db')), primary = new Error('owned initialization'), cleanup = new Error('owned close')
  pragmaFaults.set(file, primary); closeFaults.set(file, cleanup)
  const result = outcome(() => new RunDb(file)), native = single(file)
  expect(result.threw).toBe(true); aggregate(result.value, primary, [cleanup])
  expect(closeCount(native)).toBe(1); expect(native.open).toBe(true)
})
test('TeamState initialization plus injected close fault on a real native handle retains both references without retrying cleanup', () => {
  const f = repo(), file = track(f.teamFile), primary = new Error('owned team initialization'), cleanup = new Error('owned team close')
  pragmaFaults.set(file, primary); closeFaults.set(file, cleanup)
  const result = outcome(() => new TeamState(f.dir)), native = single(file)
  expect(result.threw).toBe(true); aggregate(result.value, primary, [cleanup])
  expect(closeCount(native)).toBe(1); expect(native.open).toBe(true)
})
test('undefined initialization and undefined close failures remain explicit aggregate entries and cause', () => {
  const file = track(join(root(), 'run.db')); pragmaFaults.set(file, undefined); closeFaults.set(file, undefined)
  const result = outcome(() => new RunDb(file)), native = single(file)
  expect(result.threw).toBe(true); aggregate(result.value, undefined, [undefined])
  expect(closeCount(native)).toBe(1); expect(native.open).toBe(true)
})
test('actual assembly closes returned RunDb when the real verifier factory reaches an injected failure', () => {
  const f = configFixture(), primary = new Error('owned verifier factory')
  track(f.runFile); track(f.teamFile); factory.at = 'verifier'; factory.primary = primary
  expect(outcome(() => assembleConfig(f.cfg))).toEqual({ threw: true, value: primary })
  expectClosed(f.runFile); expect(handles.has(resolve(f.teamFile))).toBe(false)
})
test('actual assembly preserves a verifier factory throwing undefined and closes returned RunDb', () => {
  const f = configFixture(); track(f.runFile); factory.at = 'verifier'; factory.primary = undefined
  expect(outcome(() => assembleConfig(f.cfg))).toEqual({ threw: true, value: undefined })
  expectClosed(f.runFile)
})
test('actual assembly closes both returned resources when the final real evidence factory reaches an injected failure', () => {
  const f = configFixture(), primary = new Error('owned evidence factory')
  track(f.runFile); track(f.teamFile); factory.at = 'evidence'; factory.primary = primary
  expect(outcome(() => assembleConfig(f.cfg))).toEqual({ threw: true, value: primary })
  expectClosed(f.runFile); expectClosed(f.teamFile)
})
test('assembly attempts the team close even when returned RunDb close fails', () => {
  const f = configFixture(), primary = new Error('owned final factory'), cleanup = new Error('owned RunDb close')
  track(f.runFile); track(f.teamFile); closeFaults.set(resolve(f.runFile), cleanup)
  factory.at = 'evidence'; factory.primary = primary
  const result = outcome(() => assembleConfig(f.cfg)), db = single(f.runFile)
  expect(result.threw).toBe(true); aggregate(result.value, primary, [cleanup])
  expect(closeCount(db)).toBe(1); expect(db.open).toBe(true); expectClosed(f.teamFile)
})
test('assembly preserves both failed close values after a final factory failure', () => {
  const f = configFixture(), primary = new Error('owned final factory'), dbError = new Error('owned RunDb close'), teamError = new Error('owned Team close')
  track(f.runFile); track(f.teamFile); closeFaults.set(resolve(f.runFile), dbError); closeFaults.set(resolve(f.teamFile), teamError)
  factory.at = 'evidence'; factory.primary = primary
  const result = outcome(() => assembleConfig(f.cfg)), db = single(f.runFile), team = single(f.teamFile)
  expect(result.threw).toBe(true); aggregate(result.value, primary, [dbError, teamError])
  expect(closeCount(db)).toBe(1); expect(closeCount(team)).toBe(1); expect(db.open).toBe(true); expect(team.open).toBe(true)
})
test('optional TeamState genuine initialization failure closes before original fallback returns an app', () => {
  const f = configFixture()
  seed(f.teamFile, 'CREATE TABLE team_claims(execution_id TEXT PRIMARY KEY)')
  track(f.runFile); track(f.teamFile)
  const app = assembleConfig(f.cfg)
  expect(app.deps.team).toBeUndefined(); expectClosed(f.teamFile)
  const db = single(f.runFile); expect(db.open).toBe(true); expect(closeCount(db)).toBe(0)
  app.deps.db.record({ taskId: 'owned-only', ok: true, costUsd: 0, detail: 'native fallback' })
  expect(app.deps.db.lastAttempt()?.taskId).toBe('owned-only')
  app.deps.db.close(); expectClosed(f.runFile)
})
test('optional TeamState close failure escapes fallback and rolls back only the returned RunDb', () => {
  const f = configFixture(), cleanup = new Error('owned failed team close')
  seed(f.teamFile, 'CREATE TABLE team_claims(execution_id TEXT PRIMARY KEY)')
  track(f.runFile); track(f.teamFile); closeFaults.set(resolve(f.teamFile), cleanup)
  const result = outcome(() => assembleConfig(f.cfg)), team = single(f.teamFile)
  expect(result.threw).toBe(true); aggregate(result.value, nativePrimary(team), [cleanup])
  expect(closeCount(team)).toBe(1); expect(team.open).toBe(true); expectClosed(f.runFile)
})
test('an unreturned native open failure does not fabricate a closeable caller handle', () => {
  const directory = track(root())
  const result = outcome(() => new RunDb(directory))
  expect(result.threw).toBe(true); expect(result.value).toBeInstanceOf(Error)
  expect(handles.has(directory)).toBe(false); expect(closes).toEqual([])
  // No claim about internal native allocations before the Database call returns.
})
test('optional arbitrary thrown Proxy keeps fallback after its actual TeamState handle is closed', () => {
  const f = configFixture(), proxy = new Proxy({}, { getPrototypeOf() { throw new Error('owned throwing prototype') } })
  track(f.runFile); track(f.teamFile); pragmaFaults.set(resolve(f.teamFile), proxy)
  const app = assembleConfig(f.cfg)
  expect(app.deps.team).toBeUndefined(); expectClosed(f.teamFile)
  expect(single(f.runFile).open).toBe(true); app.deps.db.close(); expectClosed(f.runFile)
})
test('successful actual assembly transfers open resources to the unchanged returned-app owner', async () => {
  const f = configFixture(); track(f.runFile); track(f.teamFile)
  const app = assembleConfig(f.cfg), db = single(f.runFile), team = single(f.teamFile), value = { owned: true }
  expect(app.deps.team).toBeDefined(); expect(db.open).toBe(true); expect(team.open).toBe(true)
  expect(closeCount(db)).toBe(0); expect(closeCount(team)).toBe(0)
  expect(await withOwnedResources(app, async () => value)).toBe(value)
  expectClosed(f.runFile); expectClosed(f.teamFile)
})
test('actual withAssembled does not reach its callback when RunDb initialization fails before app return', async () => {
  const f = configFixture(), file = join(f.dir, 'owned-config.json')
  seed(f.runFile, 'CREATE VIEW attempts AS SELECT 1 AS unrelated')
  track(f.runFile); writeFileSync(file, JSON.stringify(f.cfg))
  const callback = vi.fn(async () => 'not reached')
  let threw = false, primary: unknown
  try { await withAssembled(file, callback) } catch (value) { threw = true; primary = value }
  const native = single(f.runFile)
  expect(threw).toBe(true); expect(primary).toBe(nativePrimary(native)); expect(callback).not.toHaveBeenCalled()
  expectClosed(f.runFile)
})
