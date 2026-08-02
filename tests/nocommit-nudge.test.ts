import { execFileSync } from 'node:child_process'
import { writeFileSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test } from 'vitest'
import { BacklogStore } from '../src/backlog.js'
import { RunDb, type AttemptRecord } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { MockEngine } from '../src/engines/mock.js'
import { nudgeNoCommit } from '../src/engines/no-commit-nudge.js'
import { runOnce, type Deps } from '../src/scheduler.js'
import { ConfigSchema, type Engine, type Job, type RunResult } from '../src/types.js'

const openDbs: RunDb[] = []

afterEach(() => {
  for (const db of openDbs.splice(0)) db.close()
})

function initGitRepo(dir: string): void {
  execFileSync('git', ['init', '-b', 'main'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'adng-test@example.com'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'adng-test'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: dir, stdio: 'ignore' })
  writeFileSync(join(dir, 'README.md'), '# no-commit nudge test\n')
  execFileSync('git', ['add', '.'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'chore: init'], { cwd: dir, stdio: 'ignore' })
}

class RecordSpyDb extends RunDb {
  readonly records: AttemptRecord[] = []

  override record(record: AttemptRecord): void {
    this.records.push(record)
    super.record(record)
  }
}

function makeDeps(engine: MockEngine): { deps: Deps; dir: string } {
  const dir = mkdtempSync(join(tmpdir(), 'adng-nocommit-nudge-'))
  initGitRepo(dir)
  const backlogFile = join(dir, 'BACKLOG.md')
  writeFileSync(backlogFile, '- [ ] nocommit nudge 任務\n')
  const cfg = ConfigSchema.parse({
    projectPath: dir,
    backlogFile,
    dataDir: join(dir, 'data'),
    engine: 'mock',
    stopFile: join(dir, '.adng.stop'),
    worktreesDir: join(dir, 'worktrees'),
  })
  const db = new RunDb(join(dir, 'run.db'))
  openDbs.push(db)
  return {
    dir,
    deps: {
      cfg,
      store: new BacklogStore(backlogFile),
      db,
      engines: { resolve: () => engine },
      events: new EventLog(cfg.dataDir),
    },
  }
}

test('首次 no-commit 後同一 attempt 只 nudge 一次', async () => {
  const engine = new MockEngine([
    { ok: false, reason: 'no-commit(phantom completion?)' },
    { ok: false, reason: 'no-commit(phantom completion?)' },
  ])
  const { deps } = makeDeps(engine)
  const result = await runOnce(deps)

  expect(result).toBe('failed')
  expect(engine.calls).toHaveLength(2)
  expect(engine.calls[1]!.directive).toBe('你宣稱完成但 worktree 無新 commit；已完成請執行 git add 與 git commit，未完成請如實回報。')
})

test('nudge 產生新 commit 後結果沿正常 verify 成功路徑', async () => {
  const base = 'base-commit'
  let currentHead = base
  const calls: Job[] = []
  const engine: Engine = {
    id: 'nudge-test',
    preflight: async () => ({ ok: true, detail: 'ready' }),
    run: async job => {
      calls.push(job)
      currentHead = 'nudged-commit'
      return { ok: true, output: 'nudge done', costUsd: 0.2, commitHash: 'engine-report', baseCommitHash: base }
    },
  }
  const job: Job = {
    task: { id: 'task-1', text: '測試 nudge', line: 1, status: 'open' },
    projectPath: 'nudge-test-project',
    directive: '原始任務 prompt',
  }
  const initial: RunResult = {
    ok: false,
    output: 'first run',
    costUsd: 0.1,
    baseCommitHash: base,
    failureReason: 'no-commit(phantom completion?)',
  }

  const result = await nudgeNoCommit(engine, job, initial, base, () => currentHead)
  let verifyCalls = 0
  const verification = await (async (run: RunResult) => {
    verifyCalls++
    return { pass: run.ok && run.commitHash === currentHead, alerts: [] }
  })(result)

  expect(calls).toHaveLength(1)
  expect(calls[0]!.directive).toBe('你宣稱完成但 worktree 無新 commit；已完成請執行 git add 與 git commit，未完成請如實回報。')
  expect(result).toMatchObject({ ok: true, baseCommitHash: base, commitHash: currentHead })
  expect(verification).toEqual({ pass: true, alerts: [] })
  expect(verifyCalls).toBe(1)
})

test('nudge 後仍無 commit 時只記帶 nudged 的 no-commit', async () => {
  const engine = new MockEngine([
    { ok: false, reason: 'no-commit(phantom completion?)' },
    { ok: true },
  ])
  const { deps, dir } = makeDeps(engine)
  const db = new RecordSpyDb(join(dir, 'nudge-record.db'))
  openDbs.push(db)

  await expect(runOnce({ ...deps, db })).resolves.toBe('failed')
  expect(engine.calls).toHaveLength(2)
  expect(db.records).toHaveLength(1)
  expect(db.records[0]!.detail).toContain('no-commit')
  expect(db.records[0]!.detail).toContain('nudged')
})

test.each([
  ['引擎錯誤', () => new MockEngine([
    { ok: false, reason: 'no-commit(phantom completion?)' },
    { throw: 'nudge exploded' },
  ])],
  ['timeout', () => new MockEngine([
    { ok: false, reason: 'no-commit(phantom completion?)' },
    { ok: false, reason: 'timeout', costUnknown: true },
  ])],
] as const)('nudge %s 時不拋出且仍記 no-commit', async (_case, makeEngine) => {
  const engine = makeEngine()
  const { deps, dir } = makeDeps(engine)
  const db = new RecordSpyDb(join(dir, `nudge-${_case}.db`))
  openDbs.push(db)

  await expect(runOnce({ ...deps, db })).resolves.toBe('failed')
  expect(engine.calls).toHaveLength(2)
  expect(db.records).toHaveLength(1)
  expect(db.records[0]!.detail).toContain('no-commit')
  expect(db.records[0]!.detail).toContain('nudged')
  expect(db.records[0]!.detail).not.toContain('timeout')
  expect(readFileSync(join(deps.cfg.dataDir, 'events.jsonl'), 'utf8')).not.toContain('"type":"engine-error"')
})

test('組裝的首輪 prompt 含完成定義', async () => {
  const engine = new MockEngine([
    { ok: false, reason: 'no-commit(phantom completion?)' },
    { ok: false, reason: 'no-commit(phantom completion?)' },
  ])
  const { deps } = makeDeps(engine)

  await expect(runOnce(deps)).resolves.toBe('failed')
  expect(engine.calls[0]!.directive).toContain('完成的定義＝已產生新 git commit')
  expect(engine.calls[0]!.directive).toContain('完成定義＝存在新 commit，無 commit 視為未完成。')
})
