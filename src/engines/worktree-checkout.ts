import { execFileSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { isAbsolute } from 'node:path'
import type { WorktreeTimeoutOptions } from '../worktree.js'

function git(args: string[], cwd: string, timeoutMs: number): string {
  try {
    return execFileSync('git', args, { cwd, timeout: timeoutMs, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
  } catch (err) {
    if ((err as NodeJS.ErrnoException | undefined)?.code !== 'ETIMEDOUT') throw err
    throw Object.assign(new Error(`git ${args.join(' ')} 逾時（${timeoutMs}ms）：${String(err)}`), { code: 'worktree-timeout' })
  }
}

function isWorktreeTimeout(err: unknown): boolean {
  return (err as NodeJS.ErrnoException | undefined)?.code === 'worktree-timeout'
}

/** 在派工前確認 Git 不會從目標目錄向上穿透到外層 repo。 */
export function assertWorktreeCheckout(worktreePath: string, branch: string, options?: WorktreeTimeoutOptions): void {
  const gitTimeoutMs = options?.gitTimeoutMs ?? 10_000
  const worktreeAddTimeoutMs = options?.worktreeAddTimeoutMs ?? 30_000
  let topLevel: string
  try {
    topLevel = git(['rev-parse', '--show-toplevel'], worktreePath, gitTimeoutMs).trim()
  } catch (err) {
    if (isWorktreeTimeout(err)) throw err
    throw Object.assign(new Error(`prepareWorktree: worktree 無效（${worktreePath} 無法解析 Git 根目錄，checkout 未落地？）：${String(err)}`), { code: 'worktree-invalid' })
  }
  if (isAbsolute(topLevel) && realpathSync.native(topLevel) !== realpathSync.native(worktreePath)) {
    throw Object.assign(new Error(`prepareWorktree: worktree 無效（Git 根目錄 ${topLevel} 不等於目標 ${worktreePath}，拒絕向上穿透派工）`), { code: 'worktree-invalid' })
  }
  let head: string
  try {
    head = git(['symbolic-ref', '--short', 'HEAD'], worktreePath, gitTimeoutMs).trim()
  } catch (err) {
    if (isWorktreeTimeout(err)) throw err
    throw Object.assign(new Error(`prepareWorktree: worktree 無效（${worktreePath} 解析不到 HEAD 分支，checkout 未落地？）：${String(err)}`), { code: 'worktree-invalid' })
  }
  if (head !== branch) throw Object.assign(new Error(`prepareWorktree: worktree 無效（${worktreePath} 的 HEAD 在 ${head} 而非 ${branch}——目錄空掉時 git 會往上解析到外層 repo）`), { code: 'worktree-invalid' })
  const missing = git(['status', '--porcelain'], worktreePath, worktreeAddTimeoutMs)
    .split('\n').filter(l => l.startsWith(' D') || l.startsWith('D '))
  if (missing.length > 0) throw Object.assign(new Error(`prepareWorktree: worktree 無效（checkout 不完整，${missing.length} 個 tracked 檔缺失）：${worktreePath}`), { code: 'worktree-invalid' })
}
