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
      // execFileSync 預設 maxBuffer 1MB：大 diff 直接 throw→''→judge 被跳過（大改動反而免審的盲區）。
      maxBuffer: 64 * 1024 * 1024,
    })
  } catch {
    return ''
  }
}

/** judge 餵料用：base..HEAD 變更檔案清單（--name-status）。失敗回 ''（fail-open，同 defaultGetDiff）。 */
export function defaultGetNameStatus(cwd: string, baseCommitHash?: string): string {
  if (!baseCommitHash) return ''
  try {
    return execFileSync('git', ['-C', cwd, 'diff', '--name-status', `${baseCommitHash}..HEAD`], {
      encoding: 'utf8', timeout: 30_000, stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true,
    }).trim()
  } catch {
    return ''
  }
}

/** judge 餵料組裝：檔案清單（永遠完整、必塞得進 context）＋ diff 正文（超長截尾並明示截斷）。
 * judge 最大宗攔截是「宣稱的檔案不在 diff」——清單就足以判定檔案級宣稱，即使正文被截。
 * maxChars 60k（≈20k tokens）留給便宜 judge 模型的安全餘裕。 */
export function composeJudgeDiff(nameStatus: string, diff: string, maxChars = 60_000): string {
  const head = nameStatus ? `變更檔案清單（git diff --name-status，完整）：\n${nameStatus}\n\n` : ''
  const body = diff.length > maxChars
    ? `${diff.slice(0, maxChars)}\n\n[diff 正文過長已截斷（原 ${diff.length} 字，僅示前 ${maxChars} 字）；檔案級判定以上方完整清單為準]`
    : diff
  return head + body
}

export function tail(s: string, n: number): string {
  return s.length > n ? s.slice(-n) : s
}
