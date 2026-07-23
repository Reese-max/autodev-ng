import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

// KernelVerifier 的預設 I/O helper（放子目錄不計 kernel 帳；純副作用函式，行為與原內嵌版一致）。

/** worktree marker：只有經 adng worktree 管理器建立的目錄才會有這個檔，防止 reset --hard 誤毀
 *  使用者在一般專案目錄（非 adng 管理）裡未提交的工作（紅線 3）。 */
export const WORKTREE_MARKER = '.adng-worktree'

export function defaultRollback(cwd: string, toHash: string): boolean {
  if (!existsSync(join(cwd, WORKTREE_MARKER))) {
    // 拒絕執行：throw 讓 tryRollback 的 catch 記成 rollback-exception，
    // 與真正 reset 失敗的 rollback-failed 區分開來，兩者在 alerts 都可見但語意不同。
    throw new Error('rollback-refused: not an adng worktree')
  }
  try {
    execFileSync('git', ['-C', cwd, 'reset', '--hard', toHash], { stdio: 'ignore', timeout: 30_000, windowsHide: true })
    return true
  } catch {
    return false
  }
}

export function defaultGetDiff(cwd: string, baseCommitHash?: string): string {
  if (!baseCommitHash) return ''
  try {
    return execFileSync('git', ['-C', cwd, 'diff', `${baseCommitHash}..HEAD`], {
      encoding: 'utf8', timeout: 30_000, stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true,
    })
  } catch {
    return ''
  }
}

export function tail(s: string, n: number): string {
  return s.length > n ? s.slice(-n) : s
}
