// 併發基建 GOAL（GOAL A 2026-07-28）驗收測試：kernel 搬移＋merge queue＋concurrency 骨架。
// 第五項（concurrency=1 之 runOnce 行為等價）以「既有 scheduler 測試零改動且全套綠」為證，
// 本檔僅驗 schema 預設值——行為等價的完整證據在 tests/scheduler.test.ts 未動分毫。
import { expect, test } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { enqueueMerge } from '../src/engines/merge-queue.js'
import { mergeBack, prepareWorktree } from '../src/worktree.js'
import { ConfigSchema } from '../src/types.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// ── (a) kernel 頂層行數 ≤2250 ─────────────────────────────────────────────
test('kernel 頂層行數 <=2250（notify/proc 搬移後的併發池預算）', () => {
  const lines = readdirSync(join(ROOT, 'src'))
    .filter(f => f.endsWith('.ts') && statSync(join(ROOT, 'src', f)).isFile())
    .reduce((t, f) => t + (readFileSync(join(ROOT, 'src', f), 'utf8').split('\n').length - 1), 0)
  expect(lines).toBeLessThanOrEqual(2250)
})

// ── fixture：真 git repo＋雙 worktree ────────────────────────────────────
function initRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'adng-pf-'))
  const g = (args: string[]) => execFileSync('git', args, { cwd: dir, stdio: 'ignore' })
  g(['init', '-b', 'main'])
  g(['config', 'user.email', 'adng-test@example.com'])
  g(['config', 'user.name', 'adng-test'])
  g(['config', 'core.autocrlf', 'false'])
  writeFileSync(join(dir, 'README.md'), '# pf test\n')
  g(['add', '.'])
  g(['commit', '-m', 'chore: init'])
  return dir
}

function commitIn(cwd: string, name: string, content: string, message: string): void {
  writeFileSync(join(cwd, name), content)
  execFileSync('git', ['add', '.'], { cwd, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', message], { cwd, stdio: 'ignore' })
}

// ── (b) merge queue 序列化：兩個併發 mergeBack 依序完成、主線含兩個 commit ──
test('merge queue：兩個併發 mergeBack 序列化，後者經 rebase-before-merge 成功合併', async () => {
  const repo = initRepo()
  const wtDir = join(repo, '.worktrees')
  const wtA = prepareWorktree(repo, wtDir, 'aaaa0001')
  const wtB = prepareWorktree(repo, wtDir, 'bbbb0002')
  commitIn(wtA.cwd, 'a.txt', 'A\n', 'feat: task A')
  commitIn(wtB.cwd, 'b.txt', 'B\n', 'feat: task B')

  const [ra, rb] = await Promise.all([
    enqueueMerge(repo, () => mergeBack(repo, wtA.branch, wtA.baseBranch, wtA.baseHead, wtA.cwd)),
    enqueueMerge(repo, () => mergeBack(repo, wtB.branch, wtB.baseBranch, wtB.baseHead, wtB.cwd)),
  ])
  expect(ra.merged).toBe(true)
  expect(rb.merged).toBe(true)
  expect(rb.rebased).toBe(true)
  expect(execFileSync('git', ['rev-list', '--count', 'main'], { cwd: repo, encoding: 'utf8' }).trim()).toBe('3')
  expect(execFileSync('git', ['log', '--format=%s', 'main'], { cwd: repo, encoding: 'utf8' }).trim().split(/\r?\n/)).toEqual([
    'feat: task B',
    'feat: task A',
    'chore: init',
  ])
  expect(execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: repo, encoding: 'utf8' }).trim()).toBe('')
})

// ── (c) 同檔衝突：後者 merge-conflict、主線不被污染 ───────────────────────
test('merge queue：同檔衝突時後者 merge-conflict，主線只含前者變更', async () => {
  const repo = initRepo()
  const wtDir = join(repo, '.worktrees')
  const wtA = prepareWorktree(repo, wtDir, 'cccc0003')
  const wtB = prepareWorktree(repo, wtDir, 'dddd0004')
  commitIn(wtA.cwd, 'README.md', '# from A\n', 'feat: A rewrites readme')
  commitIn(wtB.cwd, 'README.md', '# from B\n', 'feat: B rewrites readme')

  const [ra, rb] = await Promise.all([
    enqueueMerge(repo, () => mergeBack(repo, wtA.branch, wtA.baseBranch, wtA.baseHead, wtA.cwd)),
    enqueueMerge(repo, () => mergeBack(repo, wtB.branch, wtB.baseBranch, wtB.baseHead, wtB.cwd)),
  ])
  expect(ra.merged).toBe(true)
  expect(rb.merged).toBe(false)
  if (!rb.merged) expect(rb.reason).toBe('merge-conflict')
  expect(execFileSync('git', ['rev-list', '--count', 'main'], { cwd: repo, encoding: 'utf8' }).trim()).toBe('2')
  expect(execFileSync('git', ['log', '--format=%s', 'main'], { cwd: repo, encoding: 'utf8' }).trim().split(/\r?\n/)).toEqual([
    'feat: A rewrites readme',
    'chore: init',
  ])
  expect(readFileSync(join(repo, 'README.md'), 'utf8')).toBe('# from A\n')
  expect(execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: repo, encoding: 'utf8' }).trim()).toBe('')
})

// ── 前者失敗不堵後者（queue 韌性）──────────────────────────────────────────
test('merge queue：前者拋例外不堵塞後者', async () => {
  const boom = enqueueMerge('failure-repo', () => { throw new Error('boom') })
  const ok = enqueueMerge('failure-repo', () => 42)
  await expect(boom).rejects.toThrow('boom')
  await expect(ok).resolves.toBe(42)
})

// ── (d) ConfigSchema concurrency 骨架 ─────────────────────────────────────
test('ConfigSchema：concurrency 預設 1，非法值被拒', () => {
  const base = { projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'mock' }
  expect(ConfigSchema.parse(base).concurrency).toBe(1) // (e) 預設 1＝現行為（行為等價由既有 scheduler 測試零改動全綠作證）
  expect(ConfigSchema.parse({ ...base, concurrency: 2 }).concurrency).toBe(2)
  for (const bad of [0, -1, 1.5, NaN, Infinity]) {
    expect(() => ConfigSchema.parse({ ...base, concurrency: bad })).toThrow()
  }
})
