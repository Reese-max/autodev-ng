import { expect, test, vi } from 'vitest'

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

test('heartbeat I/O 失敗時 fail-open keep，不啟動 daemon', () => {
  readFileSync.mockReturnValue(JSON.stringify({
    projectPath: './project',
    backlogFile: './BACKLOG.md',
    dataDir: './data',
    engine: 'mock',
  }))
  statSync.mockImplementation((path: string) => {
    if (path.endsWith('daemon.lock')) throw errorWithCode('ENOENT')
    throw errorWithCode('EIO')
  })

  const effects: string[] = []
  const result = superviseConfig('config.json', {
    launch: () => { effects.push('launch'); return 1 },
  })

  expect(result.action).toBe('keep')
  expect(result.probeErrors).toEqual(['heartbeat: EIO'])
  expect(effects).toEqual([])
})
