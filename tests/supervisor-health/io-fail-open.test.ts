import { beforeEach, expect, test, vi } from 'vitest'

const { readFileSync, statSync } = vi.hoisted(() => ({
  readFileSync: vi.fn(),
  statSync: vi.fn(),
}))

vi.mock('node:fs', () => ({
  closeSync: vi.fn(),
  mkdirSync: vi.fn(),
  openSync: vi.fn(),
  readFileSync,
  readdirSync: vi.fn(),
  statSync,
}))

const { superviseConfig } = await import('../../src/supervisor/supervise.js')

function errorWithCode(code: string): NodeJS.ErrnoException {
  const error = new Error(code) as NodeJS.ErrnoException
  error.code = code
  return error
}

type IoFailure = 'lock-stat' | 'lock-read' | 'heartbeat-stat' | 'tasklist' | 'child-process'

const IO_FAILURES: Array<{ name: string; failure: IoFailure }> = [
  { name: 'lock stat', failure: 'lock-stat' },
  { name: 'lock pid read', failure: 'lock-read' },
  { name: 'heartbeat stat', failure: 'heartbeat-stat' },
  { name: 'tasklist', failure: 'tasklist' },
  { name: 'child process query', failure: 'child-process' },
]

beforeEach(() => {
  readFileSync.mockReset()
  statSync.mockReset()
})

function ioFailureFixture(failure: IoFailure) {
  readFileSync.mockImplementation((path: string) => {
    if (path.endsWith('config.json')) {
      return JSON.stringify({
        projectPath: './project',
        backlogFile: './BACKLOG.md',
        dataDir: './data',
        engine: 'mock',
      })
    }
    if (failure === 'lock-read') throw errorWithCode('EIO')
    return JSON.stringify({ pid: 42 })
  })
  statSync.mockImplementation((path: string) => {
    if (path.endsWith('daemon.lock')) {
      if (failure === 'lock-stat') throw errorWithCode('EIO')
      return {}
    }
    if (failure === 'heartbeat-stat') throw errorWithCode('EIO')
    return { mtimeMs: 0 }
  })

  const effects: string[] = []
  const result = superviseConfig('config.json', {
    nowMs: 120_000,
    staleThresholdMs: 60_000,
    runCommand: command => {
      if (command === 'tasklist') {
        if (failure === 'tasklist') throw errorWithCode('EIO')
        return '"node.exe","42","Console","1","1,000 K"\r\n'
      }
      if (failure === 'child-process') throw errorWithCode('EIO')
      return '0\r\n'
    },
    launch: () => { effects.push('launch'); return 1 },
    reap: () => { effects.push('reap') },
  })

  return { result, effects }
}

test.each(IO_FAILURES)('$name I/O 失敗時 fail-open keep，不啟動或回收 daemon', ({ failure }) => {
  const { result, effects } = ioFailureFixture(failure)

  expect(result.action).toBe('keep')
  expect(result.probeErrors).toHaveLength(1)
  expect(result.probeErrors[0]).toContain('EIO')
  expect(effects).toEqual([])
})
