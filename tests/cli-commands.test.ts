import { afterEach, expect, test, vi } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as cli from '../src/cli.js'
import { parseArgv, runCli } from '../src/cli/entry.js'
import { formatCycleResult } from '../src/cli/run-once.js'
import { printSuperviseResults } from '../src/cli/supervise.js'

afterEach(() => {
  vi.restoreAllMocks()
  process.exitCode = undefined
})

async function captureCli(argv: string[]): Promise<{ stdout: string[]; stderr: string[]; exitCode: number }> {
  const stdout: string[] = []
  const stderr: string[] = []
  const log = vi.spyOn(console, 'log').mockImplementation((...args) => stdout.push(args.map(String).join(' ')))
  const error = vi.spyOn(console, 'error').mockImplementation((...args) => stderr.push(args.map(String).join(' ')))
  process.exitCode = undefined
  try {
    await runCli(argv, 'cli.js')
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err))
    process.exitCode = 1
  } finally {
    log.mockRestore()
    error.mockRestore()
  }
  return { stdout, stderr, exitCode: process.exitCode ?? 0 }
}

test('CLI 搬移回歸：代表性子指令維持搬移前的輸出快照與 exit code', async () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-cli-snapshot-'))
  const project = join(root, 'project')
  const config = join(root, 'config.json')
  const configsDir = join(root, 'configs')
  mkdirSync(project)
  mkdirSync(configsDir)
  writeFileSync(join(project, 'BACKLOG.md'), '')
  writeFileSync(config, JSON.stringify({
    projectPath: './project', backlogFile: './project/BACKLOG.md', dataDir: './data', engine: 'mock',
  }))

  try {
    const actual = {
      status: await captureCli(['status', '--config', config]),
      'run-once': await captureCli(['run-once', '--config', config]),
      supervise: await captureCli(['supervise', '--configs-dir', configsDir]),
      unknown: await captureCli(['unknown', '--config', config]),
    }

    expect(actual).toEqual({
      status: { stdout: ['daemon 未跑過'], stderr: [], exitCode: 0 },
      'run-once': { stdout: ['CycleResult: idle'], stderr: [], exitCode: 0 },
      supervise: { stdout: ['supervise：找不到 config，未執行任何動作'], stderr: [], exitCode: 0 },
      unknown: {
        stdout: [],
        stderr: ['未知子命令：unknown（可用：status | run-once | daemon | notify-test | supervise）'],
        exitCode: 1,
      },
    })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('cli 公開匯出維持既有介面', () => {
  expect(Object.keys(cli).sort()).toEqual([
    'assemble', 'expandEnvValue', 'finalizeRunOnceHeartbeat', 'formatStatus',
    'makeEngineRegistry', 'parseArgv', 'runNotifyTest',
  ])
})

test('CLI entry 可獨立載入並保留 argv 解析契約', () => {
  expect(parseArgv(['supervise', '--configs-dir', 'configs'])).toEqual({
    command: 'supervise', configPath: undefined, configsDir: 'configs',
  })
})

test('CLI entry：缺少 config 時只負責回報用法，不載入子指令執行', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  await runCli(['status'], 'cli.js')
  expect(error).toHaveBeenCalledExactlyOnceWith('用法：adng <status|run-once|daemon|notify-test> --config <path>，或 adng supervise --configs-dir <dir>')
  expect(process.exitCode).toBe(1)
})

test('formatCycleResult：字串結果原樣輸出，blocked 保留既有任務格式', () => {
  expect(formatCycleResult('done')).toBe('done')
  expect(formatCycleResult({ kind: 'blocked', taskId: 't1', taskText: '修 bug', reason: 'merge-conflict' }))
    .toBe('blocked（任務：修 bug）')
})

test('printSuperviseResults：空結果維持既有 stdout', () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
  printSuperviseResults([])
  expect(log).toHaveBeenCalledExactlyOnceWith('supervise：找不到 config，未執行任何動作')
  expect(process.exitCode).toBeUndefined()
})

test('printSuperviseResults：錯誤維持 stderr 並設定 exit code 1', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  printSuperviseResults([{ configPath: 'C:/configs/demo.json', error: 'boom' }])
  expect(error).toHaveBeenCalledExactlyOnceWith('supervise demo: error=boom')
  expect(process.exitCode).toBe(1)
})
