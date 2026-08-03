import { afterEach, describe, expect, test, vi } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  inspectGitWorkspace, persistGitWorkspaceBlock,
  type GitWorkspaceBlocked
} from '../src/autopilot/git-workspace.js'
import { EventLog } from '../src/events.js'
import { runPerpetualCycle } from '../src/autopilot/perpetual.js'

const dirs: string[] = []
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })

function temp(): string {
  const dir = mkdtempSync(join(tmpdir(), 'adng-git-workspace-'))
  dirs.push(dir)
  return dir
}

describe('inspectGitWorkspace', () => {
  test('.git 目錄與 HEAD 可讀', () => {
    const project = temp()
    mkdirSync(join(project, '.git'), { recursive: true })
    writeFileSync(join(project, '.git', 'HEAD'), 'ref: refs/heads/main\n')
    expect(inspectGitWorkspace(project)).toMatchObject({ ok: true, dotGit: 'directory', head: 'ref: refs/heads/main' })
  })

  test('worktree .git 檔會解析 gitdir 與 HEAD', () => {
    const root = temp()
    const project = join(root, 'worktree')
    const gitDir = join(root, 'main.git', 'worktrees', 'worktree')
    mkdirSync(project, { recursive: true })
    mkdirSync(gitDir, { recursive: true })
    writeFileSync(join(project, '.git'), `gitdir: ${gitDir}\n`)
    writeFileSync(join(gitDir, 'HEAD'), '0123456789abcdef\n')
    expect(inspectGitWorkspace(project)).toMatchObject({ ok: true, dotGit: 'file', gitDir, head: '0123456789abcdef' })
  })

  test('Linux 拒絕 Windows 路徑，不把它當成不存在的 repo', () => {
    const result = inspectGitWorkspace('C:\\work\\project', 'linux')
    expect(result).toMatchObject({ ok: false, reason: 'windows-path-unresolvable' })
    expect(result.ok ? '' : result.repairCommands[0]).toContain('git -C')
  })

  test('非 Git repo 與不可讀 HEAD 都是結構化阻塞', () => {
    const project = temp()
    expect(inspectGitWorkspace(project)).toMatchObject({ ok: false, reason: 'not-git-repo' })
    mkdirSync(join(project, '.git'), { recursive: true })
    expect(inspectGitWorkspace(project)).toMatchObject({ ok: false, reason: 'head-unreadable' })
  })
})

test('persistGitWorkspaceBlock 寫入不可交付的結構化紀錄', () => {
  const dir = temp()
  const file = join(dir, 'data', 'research-blocked.jsonl')
  const result: GitWorkspaceBlocked = {
    ok: false, projectPath: 'C:\\repo', reason: 'windows-path-unresolvable',
    detail: 'bad path', repairCommands: ['git -C "C:\\repo" status']
  }
  persistGitWorkspaceBlock(file, result, '2026-08-03T00:00:00.000Z')
  expect(existsSync(file)).toBe(true)
  expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({
    type: 'research-blocked', ts: '2026-08-03T00:00:00.000Z',
    projectPath: 'C:\\repo', reason: 'windows-path-unresolvable', detail: 'bad path',
    repairCommands: ['git -C "C:\\repo" status'], deliverable: false
  })
})

test('研究入口預檢失敗會持久化並停止 discovery', async () => {
  const dir = temp()
  const discover = vi.fn(async () => ({ survey: '', ranked: [] }))
  const result = await runPerpetualCycle({
    perpetual: true, projectPath: dir, dataDir: dir, goalFile: join(dir, 'GOAL.md'),
    stopFile: join(dir, '.stop'), dailyHardUsd: 0, perpetualCooldownMs: 0
  } as never, dir, new EventLog(dir), async () => true, {
    now: () => new Date('2026-08-03T00:00:00.000Z'),
    preflight: () => inspectGitWorkspace(dir), discover,
    author: async () => null, gateAuthoredGoal: async () => ({ ok: true }),
    runSession: async () => 'no-goal', billedToday: () => 0
  } as never)
  expect(result).toBe(false)
  expect(discover).not.toHaveBeenCalled()
  expect(JSON.parse(readFileSync(join(dir, 'research-blocked.jsonl'), 'utf8'))).toMatchObject({
    type: 'research-blocked', reason: 'not-git-repo', deliverable: false,
    repairCommands: expect.arrayContaining([expect.stringContaining('git -C')])
  })
})
