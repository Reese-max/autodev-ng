const SEGMENT = '[\\p{L}\\p{N}._@-]+'
const GIT_RANGE_TOKEN_RE = /^[A-Za-z][A-Za-z0-9_-]*\.\.[A-Za-z][A-Za-z0-9_-]*$/
const CREATION_VERB_RE = /(?:建立|新增|寫入|新建|\b(?:create|add)\b)/iu
// ponytail: 同句 80 字元為保守的「鄰近」定義；若任務模板常列超長建立清單，再改為句法解析。
const CREATION_CONTEXT_CHARS = 80
// lookbehind 含 /、\、:（2026-07-30）：防止從絕對路徑中段重新匹配出假的 repo 相對路徑
// （C:/Users/x/config.json 的 Users/x/config.json）——絕對路徑的跳過防呆會被這種殘段繞過。
const BARE_PATH_RE = new RegExp(`(?<![\\p{L}\\p{N}._@\\\\/:-])(?:\\.[\\\\/])?(?:${SEGMENT}[\\\\/])+${SEGMENT}\\.[\\p{L}\\p{N}_-]+(?![\\p{L}\\p{N}._@-])`, 'gu')
// 反引號路徑必須含目錄分隔符（* 改 +，2026-07-31 neciken 實證）：裸識別字 \`args.run\`
// 會匹配零目錄形式被當交付物——點分識別字是程式引用不是路徑，寧可漏掉罕見的根目錄檔宣稱。
const QUOTED_PATH_RE = new RegExp(`^(?:\\.[/])?(?:${SEGMENT}[/\\\\])+${SEGMENT}\\.[\\p{L}\\p{N}_-]+$`, 'u')

function normalizePath(raw: string): string {
  return raw.trim().replace(/\\/g, '/').replace(/^(?:\.\/)+/, '')
}

/** 機器絕對路徑無法與 repo 相對 diff 清單比對（2026-07-30 pa 實證：任務文字含 worktree 絕對路徑
 * → 每輪必誤判缺件）。先試剝 worktrees/<id>/ 前綴還原 repo 相對路徑；剝不出且帶絕對標記
 * （碟符／leading slash／~、mnt、home）＝不可執法，回 null 跳過（fail-open）。 */
function toRepoRelative(path: string): string | null {
  const wt = /(?:^|\/)worktrees\/[^/]+\/(.+)$/.exec(path)
  if (wt) return wt[1]!
  return /^(?:[A-Za-z]:|\/|~\/|mnt\/|home\/)/.test(path) ? null : path
}

function isUrlPrefix(text: string, index: number): boolean {
  return /(?:https?|ftp):\/\/[^\s]*$/i.test(text.slice(0, index))
}

function hasCreationVerbNearPath(text: string, start: number, end: number): boolean {
  const before = text.slice(Math.max(
    start - CREATION_CONTEXT_CHARS,
    text.lastIndexOf('\n', start) + 1,
    text.lastIndexOf('。', start) + 1,
    text.lastIndexOf('！', start) + 1,
    text.lastIndexOf('？', start) + 1,
    text.lastIndexOf('；', start) + 1,
    text.lastIndexOf(';', start) + 1,
  ), start)
  const nextBoundary = text.slice(end).search(/[\r\n。！？；;]/u)
  const after = text.slice(end, Math.min(
    end + CREATION_CONTEXT_CHARS,
    nextBoundary < 0 ? text.length : end + nextBoundary,
  ))
  return CREATION_VERB_RE.test(before) || CREATION_VERB_RE.test(after)
}

export function extractClaimedPaths(text: string): string[] {
  const paths: string[] = []
  const seen = new Set<string>()
  const add = (raw: string, start: number): void => {
    if (!hasCreationVerbNearPath(text, start, start + raw.length)) return
    const path = toRepoRelative(normalizePath(raw))
    // Git diff 範圍（例如 baseCommitHash..commitHash）不是交付物路徑，必須 fail-open。
    if (path !== null && !GIT_RANGE_TOKEN_RE.test(path) && QUOTED_PATH_RE.test(path) && !seen.has(path)) {
      seen.add(path)
      paths.push(path)
    }
  }
  for (const match of text.matchAll(/`([^`\r\n]+)`/g)) add(match[1]!, (match.index ?? 0) + 1)
  for (const match of text.matchAll(BARE_PATH_RE)) {
    if (!isUrlPrefix(text, match.index ?? 0)) add(match[0]!, match.index ?? 0)
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
