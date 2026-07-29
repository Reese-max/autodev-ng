import { afterEach, expect, test } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { enqueueMerge } from '../src/engines/merge-queue.js'
import { mergeBack, prepareWorktree } from '../src/worktree.js'

const fixtures: string[] = []

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function createGitFixture(): { repo: string; worktrees: string } {
  const repo = mkdtempSync(join(tmpdir(), 'adng-merge-'))
  const worktrees = mkdtempSync(join(tmpdir(), 'adng-merge-worktrees-'))
  fixtures.push(repo)
  fixtures.push(worktrees)
  git(repo, ['init', '-b', 'main'])
  git(repo, ['config', 'user.email', 'adng-test@example.com'])
  git(repo, ['config', 'user.name', 'adng-test'])
  git(repo, ['config', 'core.autocrlf', 'false'])
  writeFileSync(join(repo, 'README.md'), '# merge queue fixture\n')
  git(repo, ['add', '.'])
  git(repo, ['commit', '-m', 'chore: init'])
  return { repo, worktrees }
}

function commitFile(cwd: string, name: string, content: string, message: string): void {
  writeFileSync(join(cwd, name), content)
  git(cwd, ['add', '.'])
  git(cwd, ['commit', '-m', message])
}

afterEach(() => {
  while (fixtures.length > 0) rmSync(fixtures.pop()!, { recursive: true, force: true })
})

test('同一主 repo 嚴格 FIFO，前者完成前不啟動後者', async () => {
  const order: string[] = []
  let release = () => {}
  const gate = new Promise<void>(resolve => { release = resolve })
  const first = enqueueMerge('repo-fifo', async () => {
    order.push('first:start')
    await gate
    order.push('first:end')
  })
  const second = enqueueMerge('repo-fifo', () => { order.push('second') })

  await Promise.resolve()
  expect(order).toEqual(['first:start'])
  release()
  await Promise.all([first, second])
  expect(order).toEqual(['first:start', 'first:end', 'second'])
})

test('不同主 repo 不共用 queue', async () => {
  const order: string[] = []
  let release = () => {}
  const gate = new Promise<void>(resolve => { release = resolve })
  const blocked = enqueueMerge('repo-a', async () => {
    order.push('a:start')
    await gate
    order.push('a:end')
  })

  await enqueueMerge('repo-b', () => { order.push('b') })
  expect(order).toEqual(['a:start', 'b'])
  release()
  await blocked
})

test('隔離 Git fixture：兩個並發 mergeBack 依序完成，主線保有兩個任務 commit', async () => {
  const { repo, worktrees } = createGitFixture()
  const first = prepareWorktree(repo, worktrees, 'merge-first')
  const second = prepareWorktree(repo, worktrees, 'merge-second')
  commitFile(first.cwd, 'first.txt', 'first\n', 'feat: first task')
  commitFile(second.cwd, 'second.txt', 'second\n', 'feat: second task')

  const [firstResult, secondResult] = await Promise.all([
    enqueueMerge(repo, () => mergeBack(repo, first.branch, first.baseBranch, first.baseHead, first.cwd)),
    enqueueMerge(repo, () => mergeBack(repo, second.branch, second.baseBranch, second.baseHead, second.cwd)),
  ])

  expect(firstResult.merged).toBe(true)
  expect(secondResult.merged).toBe(true)
  expect(git(repo, ['rev-list', '--count', 'main'])).toBe('3')
  expect(git(repo, ['log', '--format=%s', 'main']).split(/\r?\n/)).toEqual([
    'feat: second task',
    'feat: first task',
    'chore: init',
  ])
})

test('隔離 Git fixture：兩任務改同一檔時後者 merge-conflict，主線未遭污染', async () => {
  const { repo, worktrees } = createGitFixture()
  const first = prepareWorktree(repo, worktrees, 'conflict-first')
  const second = prepareWorktree(repo, worktrees, 'conflict-second')
  commitFile(first.cwd, 'README.md', '# first\n', 'feat: first readme')
  commitFile(second.cwd, 'README.md', '# second\n', 'feat: second readme')

  const [firstResult, secondResult] = await Promise.all([
    enqueueMerge(repo, () => mergeBack(repo, first.branch, first.baseBranch, first.baseHead, first.cwd)),
    enqueueMerge(repo, () => mergeBack(repo, second.branch, second.baseBranch, second.baseHead, second.cwd)),
  ])

  expect(firstResult.merged).toBe(true)
  expect(secondResult).toEqual({ merged: false, reason: 'merge-conflict' })
  expect(git(repo, ['rev-list', '--count', 'main'])).toBe('2')
  expect(git(repo, ['log', '--format=%s', 'main']).split(/\r?\n/)).toEqual([
    'feat: first readme',
    'chore: init',
  ])
  expect(readFileSync(join(repo, 'README.md'), 'utf8')).toBe('# first\n')
  expect(git(repo, ['status', '--porcelain'])).toBe('')
})
