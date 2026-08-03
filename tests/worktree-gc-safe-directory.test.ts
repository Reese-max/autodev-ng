import { mkdirSync, mkdtempSync, utimesSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, vi } from 'vitest'

const execFileSyncMock = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', () => ({ execFileSync: execFileSyncMock }))

import { reapWorktrees } from '../src/engines/worktree-gc.js'

interface ExecOptions {
  cwd?: string
  env?: NodeJS.ProcessEnv
}

test('GC 的所有 Git 檢查與清理呼叫都帶 safe.directory 環境變數', () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'adng-worktree-gc-safe-directory-'))
  const worktreesDir = join(fixtureRoot, 'worktrees')
  const worktreePath = join(worktreesDir, 'merged-old')
  mkdirSync(worktreePath, { recursive: true })
  utimesSync(worktreePath, 1, 1)

  execFileSyncMock.mockImplementation((_command: string, args: string[]) => {
    if (args[0] === 'worktree' && args[1] === 'list') {
      return `worktree ${worktreePath}\nHEAD abc123\nbranch refs/heads/adng/merged-old\n\n`
    }
    return ''
  })

  const result = reapWorktrees({
    projectPath: fixtureRoot,
    worktreesDir,
    worktreeRetentionMs: 1,
    nowMs: 2_000,
  })

  expect(result).toMatchObject({ deleted: 1, kept: 0, keptReasons: {}, errors: [] })

  const calls = execFileSyncMock.mock.calls as Array<[string, string[], ExecOptions]>
  expect(calls.map(([, args]) => args)).toEqual([
    ['worktree', 'list', '--porcelain'],
    ['merge-base', '--is-ancestor', 'adng/merged-old', 'HEAD'],
    ['status', '--porcelain'],
    ['worktree', 'remove', worktreePath],
    ['worktree', 'prune'],
  ])
  for (const [, , options] of calls) {
    expect(options.env).toMatchObject({
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'safe.directory',
      GIT_CONFIG_VALUE_0: '*',
    })
  }
})
