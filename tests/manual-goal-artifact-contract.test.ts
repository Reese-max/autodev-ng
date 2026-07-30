import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { expect, test } from 'vitest'
import { BacklogStore, taskId } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { firstMissingArtifact } from '../src/engines/artifact-contract-git.js'
import { extractClaimedPaths, missingArtifacts } from '../src/engines/artifact-contract.js'
import { runOnce, type Deps } from '../src/scheduler.js'
import type { Engine, Job, PreflightResult, RunResult } from '../src/types.js'
import { ConfigSchema } from '../src/types.js'

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }).trim()
}

function initRepo(cwd: string): void {
  git(cwd, ['init', '-b', 'main'])
  git(cwd, ['config', 'user.email', 'adng-test@example.com'])
  git(cwd, ['config', 'user.name', 'adng-test'])
  git(cwd, ['config', 'core.autocrlf', 'false'])
  writeFileSync(join(cwd, 'README.md'), '# test\n')
  git(cwd, ['add', '.'])
  git(cwd, ['commit', '-m', 'chore: init'])
}

class MockArtifactEngine implements Engine {
  readonly id = 'mock'
  called = 0
  constructor(private readonly claimed: string, private readonly deliver: boolean) {}
  async preflight(): Promise<PreflightResult> { return { ok: true, detail: 'ready' } }
  async run(job: Job): Promise<RunResult> {
    this.called++
    const baseCommitHash = git(job.projectPath, ['rev-parse', 'HEAD'])
    if (this.deliver) {
      const file = join(job.projectPath, this.claimed)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, 'delivered\n')
    } else writeFileSync(join(job.projectPath, 'other.txt'), 'other\n')
    git(job.projectPath, ['add', '.'])
    git(job.projectPath, ['commit', '-m', 'feat: deliver'])
    return { ok: true, output: `建立 ${this.claimed}`, costUsd: 0, baseCommitHash, commitHash: git(job.projectPath, ['rev-parse', 'HEAD']) }
  }
}

function deps(engine: Engine): Deps {
  const dir = mkdtempSync(join(tmpdir(), 'adng-artifact-contract-'))
  initRepo(dir)
  const backlogFile = join(dir, 'BACKLOG.md')
  writeFileSync(backlogFile, '- [ ] 建立 tests/manual-goal-quality-metrics.py\n')
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile, dataDir: join(dir, 'data'), engine: 'mock',
    stopFile: join(dir, '.adng.stop'), worktreesDir: join(dir, 'worktrees'), maxAttempts: 2,
  })
  return {
    cfg, store: new BacklogStore(backlogFile), db: new RunDb(join(dir, 'run.db')),
    engines: { resolve: () => engine }, events: new EventLog(cfg.dataDir),
  }
}

test('extractClaimedPaths：反引號路徑', () => {
  expect(extractClaimedPaths('已完成 `src/engines/artifact-contract.ts`。')).toEqual([
    'src/engines/artifact-contract.ts'
  ])
})

test('extractClaimedPaths：裸路徑', () => {
  expect(extractClaimedPaths('已變更 src/engines/artifact-contract.ts。')).toEqual([
    'src/engines/artifact-contract.ts'
  ])
})

test('extractClaimedPaths：note-filler 的 zh-TW 原句', () => {
  expect(extractClaimedPaths('建立 tests/manual-goal-quality-metrics.py')).toEqual([
    'tests/manual-goal-quality-metrics.py'
  ])
})

test('extractClaimedPaths：無路徑回傳空陣列', () => {
  expect(extractClaimedPaths('完成必要修正，請重新驗證。')).toEqual([])
})

test('extractClaimedPaths：反斜線與 ./ 正規化', () => {
  expect(extractClaimedPaths('已完成 `./src\\engines\\artifact-contract.ts`。')).toEqual([
    'src/engines/artifact-contract.ts'
  ])
})

test('missingArtifacts：base 已存在的路徑跳過', () => {
  expect(missingArtifacts(['./src\\existing.ts'], ['src/existing.ts'], [])).toEqual([])
})

test('missingArtifacts：changed files 已包含的路徑跳過', () => {
  expect(missingArtifacts(['tests/manual-goal-quality-metrics.py'], [], ['./tests\\manual-goal-quality-metrics.py'])).toEqual([])
})

test('missingArtifacts：只保留 base 不存在且未變更的路徑', () => {
  expect(missingArtifacts(['./tests\\manual-goal-quality-metrics.py', 'src/existing.ts'], ['./src\\existing.ts'], ['other.ts']))
    .toEqual(['tests/manual-goal-quality-metrics.py'])
})

test('firstMissingArtifact：變更檔只取 baseCommitHash..commitHash，不誤收後續 HEAD', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-artifact-range-'))
  initRepo(dir)
  const baseCommitHash = git(dir, ['rev-parse', 'HEAD'])
  writeFileSync(join(dir, 'other.txt'), 'other\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-m', 'feat: other'])
  const commitHash = git(dir, ['rev-parse', 'HEAD'])
  mkdirSync(join(dir, 'tests'))
  writeFileSync(join(dir, 'tests/manual-goal-quality-metrics.py'), 'late\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-m', 'feat: late artifact'])

  expect(firstMissingArtifact(dir, '建立 tests/manual-goal-quality-metrics.py', baseCommitHash, commitHash))
    .toBe('tests/manual-goal-quality-metrics.py')
})

test('scheduler：缺件記 FAIL、跳過驗收、未 done 並保留 backlog', async () => {
  const engine = new MockArtifactEngine('tests/manual-goal-quality-metrics.py', false)
  const d = deps(engine)
  const mainHead = git(d.cfg.projectPath, ['rev-parse', 'HEAD'])
  let verified = false
  const result = await runOnce({ ...d, verifier: { check: async () => { verified = true; return { pass: true, alerts: [] } } } })
  expect(result).toBe('failed')
  expect(engine.called).toBe(1)
  expect(verified).toBe(false)
  expect(d.db.lastAttempt()).toMatchObject({ ok: false, detail: 'artifact-missing:tests/manual-goal-quality-metrics.py' })
  expect(git(d.cfg.projectPath, ['rev-parse', 'HEAD'])).toBe(mainHead)
  expect(existsSync(join(d.cfg.projectPath, 'other.txt'))).toBe(false)
  expect(readFileSync(d.cfg.backlogFile, 'utf8')).toContain('- [ ]')
  expect(readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')).not.toContain('task-done')
  expect(existsSync(join(d.cfg.worktreesDir, taskId('建立 tests/manual-goal-quality-metrics.py')))).toBe(true)
})

test('scheduler：多個缺件時 failureReason 固定採宣稱順序的第一件', async () => {
  const engine = new MockArtifactEngine('tests/first-missing.py tests/second-missing.py', false)
  const d = deps(engine)
  const result = await runOnce({ ...d, verifier: { check: async () => ({ pass: true, alerts: [] }) } })

  expect(result).toBe('failed')
  expect(d.db.lastAttempt()).toMatchObject({
    ok: false,
    detail: 'artifact-missing:tests/first-missing.py'
  })
})

test('scheduler：交付齊全時維持 OK、驗收與 done 路徑', async () => {
  const engine = new MockArtifactEngine('tests/manual-goal-quality-metrics.py', true)
  const d = deps(engine)
  let verified = false
  const result = await runOnce({ ...d, verifier: { check: async () => { verified = true; return { pass: true, alerts: [] } } } })
  expect(result).toBe('done')
  expect(verified).toBe(true)
  expect(readFileSync(d.cfg.backlogFile, 'utf8')).toContain('- [x]')
  expect(readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')).toContain('task-done')
})
