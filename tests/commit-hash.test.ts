import { expect, test } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { defaultCommitHash } from '../src/engines/commit-hash.js'

// 2026-07-16 note-filler 產線事故回歸：空 worktree 目錄下 `git -C` 往上解析到外層 repo，
// before/after 量到別的 repo 的 HEAD → 引擎遊走亂 commit 全被記成 no-commit。
// 量錯 repo 比量不到更危險：cwd 不是 repo 根一律回 undefined。

function initGitRepo(dir: string): void {
  execFileSync('git', ['init', '-b', 'main'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'adng-test@example.com'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'adng-test'], { cwd: dir, stdio: 'ignore' })
  writeFileSync(join(dir, 'README.md'), '# test\n')
  execFileSync('git', ['add', '.'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'chore: init'], { cwd: dir, stdio: 'ignore' })
}

test('cwd＝repo 根 → 回傳 HEAD hash（正常量測不受影響）', () => {
  const repo = mkdtempSync(join(tmpdir(), 'adng-ch-'))
  initGitRepo(repo)
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim()
  expect(defaultCommitHash(repo)).toBe(head)
})

test('cwd＝repo 內子目錄（toplevel 不符）→ undefined，不回外層 repo 的 HEAD', () => {
  const repo = mkdtempSync(join(tmpdir(), 'adng-ch-'))
  initGitRepo(repo)
  const sub = join(repo, 'some', 'empty', 'worktree-dir') // 事故形貌：空目錄往上解析到外層
  mkdirSync(sub, { recursive: true })
  expect(defaultCommitHash(sub)).toBeUndefined()
})

test('git 指令失敗（目錄不存在等）→ undefined（既有容錯語意不變）', () => {
  expect(defaultCommitHash(join(tmpdir(), 'adng-ch-not-exist-xyz'))).toBeUndefined()
})
