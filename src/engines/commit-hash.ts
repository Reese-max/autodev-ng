import { execFileSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { resolve } from 'node:path'

/** Windows 下 8.3 短檔名（ADMINI~1）／大小寫／斜線方向都會讓同一目錄長出不同字串——
 * 統一 realpath + 正斜線 + 小寫後再比對。realpath 失敗（目錄不存在等）退回 resolve。 */
function canon(p: string): string {
  let r: string
  try { r = realpathSync.native(p) } catch { r = resolve(p) }
  return r.replace(/\\/g, '/').toLowerCase()
}

/** 各引擎共用的 commit hash 量測（no-commit phantom 判定的真相來源）。
 * 2026-07-16 note-filler 產線事故：worktree 目錄是空的時，`git -C <cwd>` 會往上解析到
 * 外層 repo（實錄量到 autodev-ng 自己的 HEAD）——引擎在別的 repo 亂 commit 全被記成
 * no-commit，真改動繞過 verify 閘落地。量錯 repo 的 hash 比量不到更危險：cwd 必須
 * 自己就是 repo 根（worktree 根），toplevel 不符一律回 undefined（呼叫端判失敗）。 */
export function defaultCommitHash(cwd: string): string | undefined {
  try {
    const top = execFileSync('git', ['-C', cwd, 'rev-parse', '--show-toplevel'], { encoding: 'utf8', timeout: 10_000, windowsHide: true }).trim()
    if (canon(top) !== canon(cwd)) return undefined
    return execFileSync('git', ['-C', cwd, 'rev-parse', 'HEAD'], { encoding: 'utf8', timeout: 10_000, windowsHide: true }).trim()
  } catch {
    return undefined
  }
}
