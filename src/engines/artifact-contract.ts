const SEGMENT = '[\\p{L}\\p{N}._@-]+'
const BARE_PATH_RE = new RegExp(`(?<![\\p{L}\\p{N}._@-])(?:\\.[\\\\/])?(?:${SEGMENT}[\\\\/])+${SEGMENT}\\.[\\p{L}\\p{N}_-]+(?![\\p{L}\\p{N}._-])`, 'gu')
const QUOTED_PATH_RE = new RegExp(`^(?:\\.[/])?(?:${SEGMENT}[/\\\\])*${SEGMENT}\\.[\\p{L}\\p{N}_-]+$`, 'u')

function normalizePath(raw: string): string {
  return raw.trim().replace(/\\/g, '/').replace(/^(?:\.\/)+/, '')
}

function isUrlPrefix(text: string, index: number): boolean {
  return /(?:https?|ftp):\/\/[^\s]*$/i.test(text.slice(0, index))
}

export function extractClaimedPaths(text: string): string[] {
  const paths: string[] = []
  const seen = new Set<string>()
  const add = (raw: string): void => {
    const path = normalizePath(raw)
    if (QUOTED_PATH_RE.test(path) && !seen.has(path)) {
      seen.add(path)
      paths.push(path)
    }
  }
  for (const match of text.matchAll(/`([^`\r\n]+)`/g)) add(match[1]!)
  for (const match of text.matchAll(BARE_PATH_RE)) {
    if (!isUrlPrefix(text, match.index ?? 0)) add(match[0]!)
  }
  return paths
}

export function missingArtifacts(
  claimed: readonly string[], existedAtBase: readonly string[], changedFiles: readonly string[]
): string[] {
  const existed = new Set(existedAtBase.map(normalizePath))
  const changed = new Set(changedFiles.map(normalizePath))
  return [...new Set(claimed.map(normalizePath))].filter(path => path !== '' && !existed.has(path) && !changed.has(path))
}
