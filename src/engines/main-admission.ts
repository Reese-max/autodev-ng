import { execFileSync } from 'node:child_process'

/** undefined 表示非 Git／探測失敗，交由既有 worktree gate 分類；陣列只含 tracked dirty。 */
export function trackedDirtyFiles(projectPath: string, timeoutMs: number): string[] | undefined {
  try {
    return execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], {
      cwd: projectPath, encoding: 'utf8', timeout: timeoutMs, windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).split(/\r?\n/).filter(Boolean).map(line => line.slice(3))
  } catch { return undefined }
}
