import { beforeEach, expect, test, vi } from 'vitest'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const readFileSync = vi.hoisted(() => vi.fn())

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  readFileSync.mockImplementation(actual.readFileSync)
  return { ...actual, readFileSync }
})

const fs = await vi.importActual<typeof import('node:fs')>('node:fs')
const { acquireLock } = await import('../src/lock.js')

function withCode(code: string): NodeJS.ErrnoException {
  const error = new Error(code) as NodeJS.ErrnoException
  error.code = code
  return error
}

beforeEach(() => {
  readFileSync.mockReset()
  readFileSync.mockImplementation(fs.readFileSync)
})

test('a missing parent keeps the existing ENOENT failure contract', () => {
  const parent = fs.mkdtempSync(join(tmpdir(), 'adng-lock-error-'))
  const dir = join(parent, 'missing-parent', 'lock')
  let caught: unknown
  try { acquireLock(dir) } catch (error) { caught = error }
  expect((caught as NodeJS.ErrnoException)?.code).toBe('ENOENT')
  fs.rmSync(parent, { recursive: true, force: true })
})

test('EIO reading pid.json is propagated and never reclassified as stale unknown state', () => {
  const parent = fs.mkdtempSync(join(tmpdir(), 'adng-lock-error-'))
  const dir = join(parent, 'lock')
  fs.mkdirSync(dir)
  fs.writeFileSync(join(dir, 'pid.json'), JSON.stringify({ pid: 999_999_999, startedAt: '2000-01-01T00:00:00.000Z' }))
  readFileSync.mockImplementationOnce(() => { throw withCode('EIO') })

  let caught: unknown
  try { acquireLock(dir, 0) } catch (error) { caught = error }
  expect((caught as NodeJS.ErrnoException)?.code).toBe('EIO')
  expect(JSON.parse(fs.readFileSync(join(dir, 'pid.json'), 'utf8')).pid).toBe(999_999_999)
  fs.rmSync(parent, { recursive: true, force: true })
})
