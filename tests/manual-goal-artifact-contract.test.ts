import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { expect, test } from 'vitest'
import { BacklogStore, taskId } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
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

test('extractClaimedPaths：僅接受反引號路徑或帶斜線副檔名的裸 token，並正規化', () => {
  expect(extractClaimedPaths('已完成 `./src\\engines\\artifact-contract.ts`。建立 tests/manual-goal-quality-metrics.py；略過 README.md、tests/no-extension、src/output.ts@latest 與 https://example.com/docs/readme.md')).toEqual([
    'src/engines/artifact-contract.ts', 'tests/manual-goal-quality-metrics.py'
  ])
  expect(extractClaimedPaths('完成必要修正，請重新驗證。')).toEqual([])
})

test('missingArtifacts：只執法 baseHead 不存在且未出現在 changed files 的路徑', () => {
  const claimed = ['./tests\\manual-goal-quality-metrics.py', 'src/existing.ts']
  expect(missingArtifacts(claimed, ['./src\\existing.ts'], ['other.ts'])).toEqual(['tests/manual-goal-quality-metrics.py'])
  expect(missingArtifacts(claimed, ['src/existing.ts'], ['./tests\\manual-goal-quality-metrics.py'])).toEqual([])
})

test('scheduler：缺件記 FAIL、跳過驗收、未 done 並保留 backlog', async () => {
  const engine = new MockArtifactEngine('tests/manual-goal-quality-metrics.py', false)
  const d = deps(engine)
  let verified = false
  const result = await runOnce({ ...d, verifier: { check: async () => { verified = true; return { pass: true, alerts: [] } } } })
  expect(result).toBe('failed')
  expect(verified).toBe(false)
  expect(d.db.lastAttempt()).toMatchObject({ ok: false, detail: 'artifact-missing:tests/manual-goal-quality-metrics.py' })
  expect(readFileSync(d.cfg.backlogFile, 'utf8')).toContain('- [ ]')
  expect(readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')).not.toContain('task-done')
  expect(existsSync(join(d.cfg.worktreesDir, taskId('建立 tests/manual-goal-quality-metrics.py')))).toBe(true)
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
