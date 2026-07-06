import { expect, test } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { cleanupWorktree, mergeBack, prepareWorktree } from '../src/worktree.js'

function initGitRepo(dir: string): void {
  execFileSync('git', ['init', '-b', 'main'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'adng-test@example.com'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'adng-test'], { cwd: dir, stdio: 'ignore' })
  // Windows 全域 core.autocrlf=true 會讓 checkout 內容 LF→CRLF 而被 git 視為 modified，
  // 干擾 `git worktree remove`（非 --force）；臨時 repo 內 local 覆寫避免依賴全域設定。
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: dir, stdio: 'ignore' })
  writeFileSync(join(dir, 'README.md'), '# adng test repo\n')
  execFileSync('git', ['add', '.'], { cwd: dir, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'chore: init'], { cwd: dir, stdio: 'ignore' })
}

function commitFile(cwd: string, name: string, content: string, message: string): void {
  writeFileSync(join(cwd, name), content)
  execFileSync('git', ['add', '.'], { cwd, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', message], { cwd, stdio: 'ignore' })
}

function headOf(cwd: string): string {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim()
}

function newRepo(): { repo: string; worktreesDir: string } {
  const repo = mkdtempSync(join(tmpdir(), 'adng-wt-'))
  initGitRepo(repo)
  return { repo, worktreesDir: join(repo, 'worktrees') }
}

const TASK_ID = 'abc12345'

test('prepareWorktree：建出 worktree 目錄 + 分支 + marker', () => {
  const { repo, worktreesDir } = newRepo()

  const wt = prepareWorktree(repo, worktreesDir, TASK_ID)

  expect(wt.branch).toBe(`adng/${TASK_ID}`)
  expect(wt.cwd).toBe(join(worktreesDir, TASK_ID))
  expect(existsSync(wt.cwd)).toBe(true)
  expect(existsSync(join(wt.cwd, '.adng-worktree'))).toBe(true)
  const marker = JSON.parse(readFileSync(join(wt.cwd, '.adng-worktree'), 'utf8')) as { taskId: string }
  expect(marker.taskId).toBe(TASK_ID)

  const branches = execFileSync('git', ['branch', '--list', wt.branch], { cwd: repo, encoding: 'utf8' })
  expect(branches).toContain(wt.branch)
})

test('prepareWorktree：殘留（前次崩潰留下未清的 worktree 目錄+分支）重建成功', () => {
  const { repo, worktreesDir } = newRepo()

  const first = prepareWorktree(repo, worktreesDir, TASK_ID)
  commitFile(first.cwd, 'stale.txt', 'stale work\n', 'feat: stale')
  // 模擬崩潰殘留：不呼叫 cleanupWorktree，直接再次呼叫 prepareWorktree（同 taskId）

  const second = prepareWorktree(repo, worktreesDir, TASK_ID)

  expect(second.cwd).toBe(first.cwd)
  expect(existsSync(join(second.cwd, '.adng-worktree'))).toBe(true)
  expect(existsSync(join(second.cwd, 'stale.txt'))).toBe(false) // 殘留內容已被清掉重建
  const list = execFileSync('git', ['worktree', 'list'], { cwd: repo, encoding: 'utf8' })
  expect(list.split('\n').filter(l => l.includes(TASK_ID))).toHaveLength(1) // 沒有重複登記
})

test('mergeBack：worktree 內 commit 後 ff-only 成功、主 repo HEAD 前進；cleanupWorktree 清掉現場', () => {
  const { repo, worktreesDir } = newRepo()
  const before = headOf(repo)

  const wt = prepareWorktree(repo, worktreesDir, TASK_ID)
  commitFile(wt.cwd, 'feature.txt', 'done\n', 'feat: 完成任務')

  const result = mergeBack(repo, wt.branch)
  expect(result.merged).toBe(true)
  const after = headOf(repo)
  expect(after).not.toBe(before)
  expect(result.commitHash).toBe(after)
  expect(readFileSync(join(repo, 'feature.txt'), 'utf8')).toBe('done\n')

  cleanupWorktree(repo, wt.cwd, wt.branch)
  expect(existsSync(wt.cwd)).toBe(false)
  const branches = execFileSync('git', ['branch', '--list', wt.branch], { cwd: repo, encoding: 'utf8' })
  expect(branches.trim()).toBe('')
})

test('mergeBack：主 repo 被第三方推進且與 worktree 分支分岔 → merged:false、分支保留給人工', () => {
  const { repo, worktreesDir } = newRepo()

  const wt = prepareWorktree(repo, worktreesDir, TASK_ID)
  commitFile(wt.cwd, 'feature.txt', 'from worktree\n', 'feat: worktree 端完成')
  // 第三方直接在主 repo commit，造成分岔（worktree 分支與 main 互不為對方祖先）
  commitFile(repo, 'thirdparty.txt', 'third party\n', 'chore: 第三方推進')

  const result = mergeBack(repo, wt.branch)
  expect(result.merged).toBe(false)
  expect(result.commitHash).toBeUndefined()

  const branches = execFileSync('git', ['branch', '--list', wt.branch], { cwd: repo, encoding: 'utf8' })
  expect(branches).toContain(wt.branch) // 分支保留，不硬 merge、不刪
  expect(existsSync(wt.cwd)).toBe(true) // worktree 也保留供人工介入
})

test('prepareWorktree：非 git 目錄上拋明確錯誤（呼叫端據此歸 blocked，不炸 daemon）', () => {
  const plain = mkdtempSync(join(tmpdir(), 'adng-nogit-'))
  expect(() => prepareWorktree(plain, join(plain, 'worktrees'), TASK_ID)).toThrow(/git/)
})
