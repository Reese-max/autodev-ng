import { beforeEach, expect, test, vi } from 'vitest'

const { openSync, mkdirSync, closeSync } = vi.hoisted(() => ({
  openSync: vi.fn(),
  mkdirSync: vi.fn(),
  closeSync: vi.fn(),
}))

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return {
    ...actual,
    openSync,
    mkdirSync,
    closeSync,
  }
})

const spawn = vi.fn()
vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>()
  return {
    ...actual,
    spawn,
  }
})

const { launchDaemon, isDaemonConsoleLogBusyError } = await import('../../src/supervisor/supervise.js')

function errorWithCode(code: string): NodeJS.ErrnoException {
  const error = new Error(code) as NodeJS.ErrnoException
  error.code = code
  return error
}

beforeEach(() => {
  vi.clearAllMocks()
})

test('launchDaemon：openSync 共享鎖占用時回傳 undefined 且不 spawn', () => {
  openSync.mockImplementation(() => {
    throw errorWithCode('EBUSY')
  })

  const pid = launchDaemon('config.json', 'data-dir', 'cli.js')

  expect(pid).toBeUndefined()
  expect(spawn).not.toHaveBeenCalled()
  expect(isDaemonConsoleLogBusyError(errorWithCode('EBUSY'))).toBe(true)
})

test('launchDaemon：副作用前發現暫停時不開 log、不 spawn', () => {
  expect(launchDaemon('config.json', 'data-dir', 'cli.js', () => true)).toBeUndefined()
  expect(openSync).not.toHaveBeenCalled()
  expect(spawn).not.toHaveBeenCalled()
})

test('launchDaemon：成功開啟 log 後 spawn detached daemon 並關閉父 fd', () => {
  openSync.mockReturnValue(42)
  spawn.mockReturnValue({ pid: 9001, unref: vi.fn() })

  const pid = launchDaemon('config.json', 'data-dir', 'cli.js')

  expect(pid).toBe(9001)
  expect(mkdirSync).toHaveBeenCalled()
  expect(openSync).toHaveBeenCalled()
  expect(spawn).toHaveBeenCalledWith(
    process.execPath,
    ['cli.js', 'daemon', '--config', 'config.json'],
    expect.objectContaining({
      detached: true,
      stdio: ['ignore', 42, 42],
      windowsHide: true,
    }),
  )
  expect(closeSync).toHaveBeenCalledWith(42)
})

test('launchDaemon：非共享鎖錯誤向上拋出', () => {
  openSync.mockImplementation(() => {
    throw errorWithCode('EIO')
  })
  expect(() => launchDaemon('config.json', 'data-dir', 'cli.js')).toThrow('EIO')
  expect(spawn).not.toHaveBeenCalled()
})
