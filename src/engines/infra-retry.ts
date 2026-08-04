import { execFileSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'

/** 基建失敗與引擎能力失敗必須分流：前者只享有一次獨立重試，不得消耗 maxAttempts。 */
export type InfrastructureRetryReason =
  | 'infra:worktree-timeout'
  | 'worktree-locked'
  | 'infra:engine-external-termination'

export type WorktreeFailureReason = InfrastructureRetryReason | 'not-a-git-repo' | 'worktree-invalid'

export interface InfraRetryState {
  taskId?: string
  retried: boolean
  source?: InfrastructureRetryReason
}

export function worktreeFailureReason(error: unknown): WorktreeFailureReason {
  const code = (error as { code?: unknown } | undefined)?.code
  if (code === 'worktree-timeout' || code === 'ETIMEDOUT' || code === 'ETIME') return 'infra:worktree-timeout'
  if (code === 'worktree-locked' || code === 'worktree-invalid') return code
  return 'not-a-git-repo'
}

export function isInfrastructureRetryReason(reason: WorktreeFailureReason | InfrastructureRetryReason): reason is InfrastructureRetryReason {
  return reason !== 'not-a-git-repo' && reason !== 'worktree-invalid'
}

/** Windows 外部終止在不同宿主層可能以 unsigned、signed、hex 或既有實測 decimal 傳回。 */
export function isExternalEngineTermination(error: unknown): boolean {
  const code = (error as { code?: unknown } | undefined)?.code
  const text = `${String(error)} ${String(code ?? '')}`
  return /\b(?:1073807364|3221225786|-1073741510)\b|\b0x(?:40010004|c000013a)\b|STATUS_CONTROL_C_EXIT/i.test(text)
}

export function retriedBlockedReason(detail: string): string {
  return `${detail}；retried=1`
}

/** 重試前只處理該任務自己的 worktree／分支；prepareWorktree 仍會再次驗證清理是否完整。 */
export function cleanupRetryWorktree(projectPath: string, worktreesDir: string, taskId: string, options?: { gitTimeoutMs?: number; worktreeAddTimeoutMs?: number }): void {
  const worktreePath = join(worktreesDir, taskId), branch = `adng/${taskId}`
  const git = (args: string[], timeout: number): void => { try { execFileSync('git', args, { cwd: projectPath, timeout, stdio: 'ignore', windowsHide: true }) } catch { /* 盡力清理 */ } }
  git(['worktree', 'remove', '--force', worktreePath], options?.worktreeAddTimeoutMs ?? 30_000)
  git(['worktree', 'prune'], options?.gitTimeoutMs ?? 10_000)
  try { rmSync(worktreePath, { recursive: true, force: true }) } catch { /* 下面由 existsSync 判定 */ }
  if (existsSync(worktreePath)) throw Object.assign(new Error(`infra retry 無法清理 worktree：${worktreePath}`), { code: 'worktree-locked' })
  git(['branch', '-D', branch], options?.gitTimeoutMs ?? 10_000)
}
