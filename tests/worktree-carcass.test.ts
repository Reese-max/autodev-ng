import { execFileSync } from 'node:child_process'
import { afterEach, expect, test } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { assertWorktreeCheckout, prepareWorktree } from '../src/worktree.js'

const roots: string[] = []
const TASK_ID = 'carcass-guard'

afterEach(() => {
  while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true })
})

function initGitRepo(dir: string): void {
  mkdirSync(dir, { recursive: true })
  execFileSync('git', ['init', '-b', 'main'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'adng-test@example.com'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'adng-test'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: dir, stdio: 'ignore' })
  writeFileSync(join(dir, 'README.md'), '# adng test repo\n')
  execFileSync('git', ['add', '.'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'chore: init'], { cwd: dir, stdio: 'ignore' })
}

function newRepo(): { repo: string; worktreesDir: string } {
  const root = mkdtempSync(join(tmpdir(), 'adng-worktree-carcass-'))
  roots.push(root)
  const repo = join(root, 'project')
  initGitRepo(repo)
  return { repo, worktreesDir: join(root, 'worktrees') }
}

test('prepareWorktree：無 .git 的中斷殘骸會先清除再重建', () => {
  const { repo, worktreesDir } = newRepo()
  const carcass = join(worktreesDir, TASK_ID)
  mkdirSync(carcass, { recursive: true })
  writeFileSync(join(carcass, 'interrupted.txt'), 'partial checkout\n')

  const wt = prepareWorktree(repo, worktreesDir, TASK_ID)

  expect(existsSync(join(wt.cwd, '.git'))).toBe(true)
  expect(existsSync(join(wt.cwd, 'interrupted.txt'))).toBe(false)
  expect(() => assertWorktreeCheckout(wt.cwd, wt.branch)).not.toThrow()
})

test('assertWorktreeCheckout：外層 repo 恰好同分支仍拒絕向上穿透', () => {
  const { repo } = newRepo()
  const branch = `adng/${TASK_ID}`
  execFileSync('git', ['checkout', '-b', branch], { cwd: repo, stdio: 'ignore' })
  const fakeWorktree = join(repo, 'worktrees', TASK_ID)
  mkdirSync(fakeWorktree, { recursive: true })

  expect(() => assertWorktreeCheckout(fakeWorktree, branch)).toThrow(/Git 根目錄.*不等於目標/)
})

test('assertWorktreeCheckout：遷出 repo 樹的有效 worktree 不受影響', () => {
  const { repo, worktreesDir } = newRepo()
  const wt = prepareWorktree(repo, worktreesDir, TASK_ID)

  expect(wt.cwd.startsWith(repo)).toBe(false)
  expect(() => assertWorktreeCheckout(wt.cwd, wt.branch)).not.toThrow()
})
