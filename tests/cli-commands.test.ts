import { afterEach, expect, test, vi } from 'vitest'
import * as cli from '../src/cli.js'
import { parseArgv, runCli } from '../src/cli/entry.js'
import { formatCycleResult } from '../src/cli/run-once.js'
import { printSuperviseResults } from '../src/cli/supervise.js'

afterEach(() => {
  vi.restoreAllMocks()
  process.exitCode = undefined
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
