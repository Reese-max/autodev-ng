import { appendFileSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, posix, win32 } from 'node:path'

export type GitWorkspaceBlockReason =
  | 'windows-path-unresolvable'
  | 'not-git-repo'
  | 'gitdir-unreadable'
  | 'head-unreadable'

export interface GitWorkspaceOk {
  ok: true
  projectPath: string
  gitDir: string
  dotGit: 'directory' | 'file'
  head: string
}

export interface GitWorkspaceBlocked {
  ok: false
  projectPath: string
  reason: GitWorkspaceBlockReason
  detail: string
  repairCommands: string[]
}

export type GitWorkspacePreflight = GitWorkspaceOk | GitWorkspaceBlocked

export interface GitWorkspaceBlockRecord {
  type: 'research-blocked'
  ts: string
  projectPath: string
  reason: GitWorkspaceBlockReason
  detail: string
  repairCommands: string[]
  deliverable: false
}

function windowsPath(path: string): boolean {
  return /^[A-Za-z]:/.test(path) || /^\\\\/.test(path) || /^\/\/\?[/\\]/.test(path)
}

function commandPath(path: string): string {
  return `"${path.replace(/"/g, '\\"')}"`
}

function blocked(
  projectPath: string,
  reason: GitWorkspaceBlockReason,
  detail: string,
  repairCommands: string[]
): GitWorkspaceBlocked {
  return { ok: false, projectPath, reason, detail, repairCommands }
}

function validHead(value: string): boolean {
  return /^ref:\s+\S+$/.test(value) || /^[0-9a-f]{4,64}$/i.test(value)
}

/** 只讀解析工作區，不呼叫 git CLI，避免把另一平台的路徑交給本機解析器。 */
export function inspectGitWorkspace(projectPath: string, platform: NodeJS.Platform = process.platform): GitWorkspacePreflight {
  const requested = projectPath.trim()
  if (!requested) return blocked(requested, 'not-git-repo', 'projectPath 為空', ['git init'])
  if (platform !== 'win32' && windowsPath(requested)) {
    return blocked(requested, 'windows-path-unresolvable', `Linux 無法解析 Windows 路徑：${requested}`, [
      `git -C ${commandPath(requested)} rev-parse --show-toplevel`
    ])
  }

  const pathApi = platform === 'win32' ? win32 : posix
  const project = pathApi.resolve(requested)
  const dotGit = pathApi.join(project, '.git')
  let dotGitStat: ReturnType<typeof statSync>
  try { dotGitStat = statSync(dotGit) } catch {
    return blocked(project, 'not-git-repo', `${dotGit} 不存在或不可讀`, [
      `git -C ${commandPath(project)} init`
    ])
  }

  let gitDir: string
  let dotGitKind: GitWorkspaceOk['dotGit']
  if (dotGitStat.isDirectory()) {
    gitDir = dotGit
    dotGitKind = 'directory'
  } else if (dotGitStat.isFile()) {
    let pointer: string
    try { pointer = readFileSync(dotGit, 'utf8').trim() } catch (error) {
      return blocked(project, 'gitdir-unreadable', `.git 檔案不可讀：${String(error)}`, [
        `git -C ${commandPath(project)} worktree repair`
      ])
    }
    const match = pointer.match(/^gitdir:\s*(\S.*)$/i)
    if (!match) return blocked(project, 'gitdir-unreadable', '.git 檔案缺少有效的 gitdir 指向', [
      `git -C ${commandPath(project)} worktree repair`
    ])
    const target = match[1]!.trim()
    if (platform !== 'win32' && windowsPath(target)) {
      return blocked(project, 'windows-path-unresolvable', `Linux 無法解析 worktree gitdir 路徑：${target}`, [
        `git -C ${commandPath(project)} worktree repair`
      ])
    }
    gitDir = pathApi.resolve(project, target)
    dotGitKind = 'file'
  } else {
    return blocked(project, 'not-git-repo', '.git 不是目錄或 worktree 指向檔', [
      `git -C ${commandPath(project)} init`
    ])
  }

  try {
    if (!statSync(gitDir).isDirectory()) throw new Error('gitdir 不是目錄')
    const head = readFileSync(join(gitDir, 'HEAD'), 'utf8').trim()
    if (!validHead(head)) throw new Error('HEAD 格式為空或無法解析')
    return { ok: true, projectPath: project, gitDir, dotGit: dotGitKind, head }
  } catch (error) {
    return blocked(project, 'head-unreadable', `HEAD 不可讀或無效：${String(error)}`, [
      `git -C ${commandPath(project)} rev-parse --verify HEAD`,
      `git -C ${commandPath(project)} worktree repair`
    ])
  }
}

export function persistGitWorkspaceBlock(
  file: string,
  result: GitWorkspaceBlocked,
  now = new Date().toISOString()
): GitWorkspaceBlockRecord {
  const record: GitWorkspaceBlockRecord = {
    type: 'research-blocked', ts: now, projectPath: result.projectPath,
    reason: result.reason, detail: result.detail,
    repairCommands: result.repairCommands, deliverable: false
  }
  mkdirSync(dirname(file), { recursive: true })
  appendFileSync(file, JSON.stringify(record) + '\n')
  return record
}
