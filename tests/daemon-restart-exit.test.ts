import { afterEach, expect, test, vi } from 'vitest'

const runDaemonMock = vi.hoisted(() => vi.fn())
const withAssembledMock = vi.hoisted(() => vi.fn())

vi.mock('../src/daemon.js', () => ({ runDaemon: runDaemonMock }))
vi.mock('../src/cli/assemble.js', () => ({ withAssembled: withAssembledMock }))

import { cmdDaemon } from '../src/cli/daemon.js'

afterEach(() => vi.restoreAllMocks())

test('哨兵消費後：當前輪清理完 2 秒內強制退出，且不再開新輪', async () => {
  const calls: string[] = []
  const deadline = Date.now() + 2_000
  runDaemonMock.mockImplementation(async () => {
    calls.push('run')
    return 'restart-requested'
  })
  withAssembledMock.mockImplementation(async (_cfgPath: string, fn: (a: unknown) => Promise<unknown>) => {
    const result = await fn({ deps: { cfg: { dataDir: 'data', cooldownMs: 0 } }, notifier: {} })
    calls.push('closed')
    return result
  })
  vi.spyOn(console, 'log').mockImplementation(() => {})
  const exit = vi.spyOn(process, 'exit').mockImplementation((() => { calls.push('exit') }) as never)

  await cmdDaemon('config.json')

  expect(Date.now()).toBeLessThanOrEqual(deadline)
  expect(runDaemonMock).toHaveBeenCalledOnce()
  expect(calls).toEqual(['run', 'closed', 'exit'])
  expect(exit).toHaveBeenCalledOnce()
  expect(exit).toHaveBeenCalledWith(0)
})
