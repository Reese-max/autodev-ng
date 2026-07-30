import { execFileSync } from 'node:child_process'
import { extractClaimedPaths, missingArtifacts } from './artifact-contract.js'

const MAX_BUFFER = 64 * 1024 * 1024

function gitList(cwd: string, args: string[]): string[] {
  const raw = execFileSync('git', args, {
    cwd, encoding: 'utf8', timeout: 30_000, maxBuffer: MAX_BUFFER,
    stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true,
  })
  return raw.split('\0').filter(Boolean)
}

/** Git 查詢失敗時回 undefined，讓未能取得完整證據的契約維持 fail-open。 */
export function firstMissingArtifact(
  cwd: string, text: string, baseCommitHash?: string, commitHash?: string
): string | undefined {
  const claimed = extractClaimedPaths(text)
  if (!claimed.length || !baseCommitHash || !commitHash) return undefined
  try {
    const existed = gitList(cwd, ['ls-tree', '-r', '-z', '--name-only', baseCommitHash, '--'])
    const changed = gitList(cwd, ['diff', '--name-only', '-z', `${baseCommitHash}..${commitHash}`, '--'])
    return missingArtifacts(claimed, existed, changed)[0]
  } catch {
    return undefined
  }
}
