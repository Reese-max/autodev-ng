import { execFileSync } from 'node:child_process'
import { realpathSync, statSync } from 'node:fs'
import { isAbsolute, relative, resolve } from 'node:path'
import type { Config } from '../types.js'

export interface WorktreeGcOptions {
  projectPath: string
  worktreesDir: string
  worktreeRetentionMs: number
  gitTimeoutMs?: number
  nowMs?: number
  removeWorktree?: (worktreePath: string) => void
}

export interface WorktreeGcResult {
  deleted: number
  kept: number
  keptReasons: Record<string, number>
  errors: string[]
}

interface ListedWorktree { path: string; branch: string }

const GIT_SAFE_DIRECTORY_ENV = {
  GIT_CONFIG_COUNT: '1',
  GIT_CONFIG_KEY_0: 'safe.directory',
  GIT_CONFIG_VALUE_0: '*',
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function git(projectPath: string, args: string[], timeoutMs: number): string {
  return execFileSync('git', args, {
    cwd: projectPath, timeout: timeoutMs, encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
    // GC 只透過子進程環境放寬唯讀 Git 檢查，不寫入使用者的 global gitconfig。
    env: { ...process.env, ...GIT_SAFE_DIRECTORY_ENV },
  })
}

function listedWorktrees(output: string): ListedWorktree[] {
  const worktrees: ListedWorktree[] = []
  let path: string | undefined
  let branch: string | undefined
  const add = () => {
    if (path && branch?.startsWith('refs/heads/')) worktrees.push({ path, branch: branch.slice('refs/heads/'.length) })
  }
  for (const line of output.split(/\r?\n/)) {
    if (line === '') { add(); path = undefined; branch = undefined; continue }
    if (line.startsWith('worktree ')) path = line.slice('worktree '.length)
    if (line.startsWith('branch ')) branch = line.slice('branch '.length)
  }
  add()
  return worktrees
}

function isInside(directory: string, candidate: string): boolean {
  const canonical = (path: string): string => {
    try { return realpathSync.native(path) } catch { return resolve(path) }
  }
  const pathFromDirectory = relative(canonical(directory), canonical(candidate))
  return pathFromDirectory !== '' && !pathFromDirectory.startsWith('..') && !isAbsolute(pathFromDirectory)
}

function addKept(result: WorktreeGcResult, reason: string): void {
  result.kept++
  result.keptReasons[reason] = (result.keptReasons[reason] ?? 0) + 1
}

/**
 * 僅清理設定 worktreesDir 內、已併入目前主線且超過保留期的 worktree。
 * Git 的安全 remove 仍是最後一道防線：檢查與刪除之間若出現未提交變更，remove 會拒絕。
 */
export function reapWorktrees(options: WorktreeGcOptions): WorktreeGcResult {
  const result: WorktreeGcResult = { deleted: 0, kept: 0, keptReasons: {}, errors: [] }
  const timeoutMs = options.gitTimeoutMs ?? 10_000
  const removeWorktree = options.removeWorktree ?? ((worktreePath: string) => {
    git(options.projectPath, ['worktree', 'remove', worktreePath], timeoutMs)
  })

  try {
    const cutoffMs = (options.nowMs ?? Date.now()) - options.worktreeRetentionMs
    const worktrees = listedWorktrees(git(options.projectPath, ['worktree', 'list', '--porcelain'], timeoutMs))
      .filter(worktree => isInside(options.worktreesDir, worktree.path))

    for (const worktree of worktrees) {
      try {
        git(options.projectPath, ['merge-base', '--is-ancestor', worktree.branch, 'HEAD'], timeoutMs)
      } catch {
        addKept(result, 'unmerged')
        continue
      }

      let status: string
      try {
        status = git(worktree.path, ['status', '--porcelain'], timeoutMs)
      } catch (error) {
        addKept(result, 'inspection-failed')
        result.errors.push(errorMessage(error))
        continue
      }
      if (status.trim() !== '') {
        addKept(result, 'dirty')
        continue
      }

      let mtimeMs: number
      try {
        mtimeMs = statSync(worktree.path).mtimeMs
      } catch (error) {
        addKept(result, 'inspection-failed')
        result.errors.push(errorMessage(error))
        continue
      }
      if (mtimeMs >= cutoffMs) {
        addKept(result, 'recent')
        continue
      }

      try {
        removeWorktree(worktree.path)
        result.deleted++
      } catch (error) {
        addKept(result, 'delete-failed')
        result.errors.push(errorMessage(error))
      }
    }
  } catch (error) {
    result.errors.push(errorMessage(error))
  }

  try {
    git(options.projectPath, ['worktree', 'prune'], timeoutMs)
  } catch (error) {
    result.errors.push(errorMessage(error))
  }
  return result
}

export function recordWorktreeGc(cfg: Pick<Config, 'projectPath' | 'worktreesDir' | 'worktreeRetentionMs' | 'gitTimeoutMs'>, events: { append(type: string, data: Record<string, unknown>): void }): WorktreeGcResult {
  const result = reapWorktrees(cfg)
  events.append('worktree-gc', { ...result })
  return result
}
