import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { reapWorktrees, recordWorktreeGc } from '../src/engines/worktree-gc.js'

const OLD_MS = 1_000_000
const NOW_MS = OLD_MS + 24 * 60 * 60 * 1000

function git(cwd: string, args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'ignore' })
}

function repo(): { dir: string; worktreesDir: string } {
  const dir = mkdtempSync(join(tmpdir(), 'adng-worktree-gc-'))
  git(dir, ['init', '-b', 'main'])
  git(dir, ['config', 'user.email', 'adng-test@example.com'])
  git(dir, ['config', 'user.name', 'adng-test'])
  git(dir, ['config', 'core.autocrlf', 'false'])
  writeFileSync(join(dir, 'README.md'), '# test\n')
  git(dir, ['add', '.'])
  git(dir, ['commit', '-m', 'init'])
  const worktreesDir = join(dir, 'worktrees')
  mkdirSync(worktreesDir)
  return { dir, worktreesDir }
}

function addWorktree(projectPath: string, worktreesDir: string, name: string, merged: boolean): string {
  const worktreePath = join(worktreesDir, name)
  const branch = `adng/${name}`
  git(projectPath, ['worktree', 'add', '-b', branch, worktreePath])
  writeFileSync(join(worktreePath, `${name}.txt`), `${name}\n`)
  git(worktreePath, ['add', '.'])
  git(worktreePath, ['commit', '-m', name])
  if (merged) git(projectPath, ['merge', '--ff-only', branch])
  utimesSync(worktreePath, OLD_MS / 1000, OLD_MS / 1000)
  return worktreePath
}

function reap(projectPath: string, worktreesDir: string, removeWorktree?: (path: string) => void) {
  return reapWorktrees({ projectPath, worktreesDir, worktreeRetentionMs: 1, nowMs: NOW_MS, removeWorktree })
}

test('已合併且逾期→刪除', () => {
  const { dir, worktreesDir } = repo()
  const worktreePath = addWorktree(dir, worktreesDir, 'merged-old', true)

  expect(reap(dir, worktreesDir)).toMatchObject({ deleted: 1, kept: 0, keptReasons: {} })
  expect(existsSync(worktreePath)).toBe(false)
})

test('已合併但未逾期→保留', () => {
  const { dir, worktreesDir } = repo()
  const worktreePath = addWorktree(dir, worktreesDir, 'merged-recent', true)
  utimesSync(worktreePath, NOW_MS / 1000, NOW_MS / 1000)

  expect(reap(dir, worktreesDir)).toMatchObject({ deleted: 0, kept: 1, keptReasons: { recent: 1 } })
  expect(existsSync(worktreePath)).toBe(true)
})

test('未合併→保留', () => {
  const { dir, worktreesDir } = repo()
  const worktreePath = addWorktree(dir, worktreesDir, 'unmerged-old', false)

  expect(reap(dir, worktreesDir)).toMatchObject({ deleted: 0, kept: 1, keptReasons: { unmerged: 1 } })
  expect(existsSync(worktreePath)).toBe(true)
})

test('含未提交變更→保留', () => {
  const { dir, worktreesDir } = repo()
  const worktreePath = addWorktree(dir, worktreesDir, 'dirty-old', true)
  writeFileSync(join(worktreePath, 'dirty.txt'), 'dirty\n')
  utimesSync(worktreePath, OLD_MS / 1000, OLD_MS / 1000)

  expect(reap(dir, worktreesDir)).toMatchObject({ deleted: 0, kept: 1, keptReasons: { dirty: 1 } })
  expect(existsSync(worktreePath)).toBe(true)
})

test('刪除失敗不中斷', () => {
  const { dir, worktreesDir } = repo()
  const worktreePath = addWorktree(dir, worktreesDir, 'remove-fails', true)

  expect(reap(dir, worktreesDir, () => { throw new Error('locked') })).toMatchObject({
    deleted: 0, kept: 1, keptReasons: { 'delete-failed': 1 }, errors: ['locked'],
  })
  expect(existsSync(worktreePath)).toBe(true)
})

test('每次回收都記錄刪除、保留與原因統計', () => {
  const { dir, worktreesDir } = repo()
  const events: Array<{ type: string; data: Record<string, unknown> }> = []

  recordWorktreeGc({ projectPath: dir, worktreesDir, worktreeRetentionMs: 1, gitTimeoutMs: 10_000 }, {
    append: (type, data) => { events.push({ type, data }) },
  })

  expect(events).toEqual([{ type: 'worktree-gc', data: { deleted: 0, kept: 0, keptReasons: {}, errors: [] } }])
})
