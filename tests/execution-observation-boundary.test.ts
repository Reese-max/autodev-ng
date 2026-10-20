import { afterEach, expect, test, vi } from 'vitest'
import type { Dirent } from 'node:fs'
import { join } from 'node:path'

const fakeFs = vi.hoisted(() => {
  const files = new Map<string, string>()
  const normalize = (path: string) => path.replace(/\\/g, '/').replace(/\/$/, '')
  const dirent = (name: string, kind: 'file' | 'directory') => ({
    name,
    isFile: () => kind === 'file',
    isDirectory: () => kind === 'directory',
    isSymbolicLink: () => false,
  } as Dirent)
  const opendirSync = vi.fn((path: string) => {
    const folder = normalize(path)
    let entries: Dirent[] = []
    if (folder.endsWith('/executions')) {
      entries = ['active', 'history', 'quarantine'].map(name => dirent(name, 'directory'))
    } else if (folder.endsWith('/executions/active')) {
      const prefix = folder + '/'
      entries = [...files.keys()]
        .filter(file => file.startsWith(prefix) && file.endsWith('.json'))
        .map(file => dirent(file.slice(prefix.length), 'file'))
    } else if (!folder.endsWith('/executions/history') && !folder.endsWith('/executions/quarantine')) {
      throw Object.assign(new Error('directory not found'), { code: 'ENOENT' })
    }
    let index = 0
    return { readSync: () => entries[index++] ?? null, closeSync: vi.fn() }
  })
  const existsSync = vi.fn((path: string) => files.has(normalize(path)))
  const readFileSync = vi.fn((path: string) => {
    const content = files.get(normalize(path))
    if (content === undefined) throw Object.assign(new Error('file not found'), { code: 'ENOENT' })
    return content
  })
  const lstatSync = vi.fn((path: string) => {
    const content = files.get(normalize(path))
    if (content === undefined) throw Object.assign(new Error('file not found'), { code: 'ENOENT' })
    return { isFile: () => true, size: Buffer.byteLength(content) }
  })
  const writeJsonAtomic = vi.fn((path: string, value: unknown) => {
    files.set(normalize(path), JSON.stringify(value))
  })
  return {
    files,
    existsSync,
    lstatSync,
    mkdirSync: vi.fn(),
    opendirSync,
    readFileSync,
    renameSync: vi.fn(),
    statSync: vi.fn(),
    writeJsonAtomic,
    withInventoryLock: vi.fn((_dataDir: string, callback: () => unknown) => callback()),
  }
})

vi.mock('node:fs', () => ({
  existsSync: fakeFs.existsSync,
  lstatSync: fakeFs.lstatSync,
  mkdirSync: fakeFs.mkdirSync,
  opendirSync: fakeFs.opendirSync,
  readFileSync: fakeFs.readFileSync,
  renameSync: fakeFs.renameSync,
  statSync: fakeFs.statSync,
}))
vi.mock('../src/guardian/incident.js', () => ({ writeJsonAtomic: fakeFs.writeJsonAtomic }))
vi.mock('../src/engines/inventory-lock.js', () => ({ withInventoryLock: fakeFs.withInventoryLock }))

import { MAX_ACTIVE_EXECUTIONS, MAX_TRACKED_EXECUTION_FILES, readExecutions, type ExecutionSnapshot } from '../src/engines/execution-observation.js'

afterEach(() => {
  fakeFs.files.clear()
  vi.clearAllMocks()
  fakeFs.opendirSync.mockReset()
})

function activeReceipt(executionId: string): ExecutionSnapshot {
  return {
    version: 1,
    executionId,
    taskId: 'task-' + executionId,
    adapter: 'codex',
    projectPath: 'synthetic-project',
    hostPid: 1,
    hostStartedAt: 1,
    startedAt: 1,
    observedAt: 1,
    sequence: 0,
    phase: 'running',
    outputBytes: 0,
    unknownSamples: 0,
    degraded: false,
    cancelRequested: false,
  }
}

test.each([9_999, 10_000, 10_001])('readExecutions classifies %i active receipts through synthetic filesystem entries without scanning history', count => {
  fakeFs.files.clear()
  vi.clearAllMocks()
  const dataDir = 'synthetic-data-' + count
  const activeDir = `${dataDir}/executions/active`
  for (let index = 0; index < count; index++) {
    const id = 'active-' + String(index).padStart(5, '0')
    fakeFs.files.set(`${activeDir}/${id}.json`, JSON.stringify(activeReceipt(id)))
  }

  const inventory = readExecutions(dataDir, 100)
  expect(inventory.records).toHaveLength(Math.min(count, MAX_ACTIVE_EXECUTIONS))
  expect(inventory.capacityExceeded).toBe(count >= MAX_ACTIVE_EXECUTIONS)
  if (count >= MAX_ACTIVE_EXECUTIONS)
    expect(inventory.errors).toContain('active execution capacity reached (' + count + ' >= 10000)')
  else expect(inventory.errors).toEqual([])
  expect(fakeFs.readFileSync).toHaveBeenCalledTimes(count)
  expect(fakeFs.opendirSync.mock.calls.map(([path]) => String(path).replace(/\\/g, '/')))
    .not.toContain(join(dataDir, 'executions', 'history').replace(/\\/g, '/'))
})

test('oversized legacy inventory stops after a bounded traversal and reads no receipts or history', () => {
  let visits = 0
  fakeFs.opendirSync.mockImplementation(path => {
    const isRoot = String(path).replace(/\\/g, '/').endsWith('/executions')
    return { readSync: () => {
      if (!isRoot) return null
      const name = 'receipt-' + visits++ + '.json'
      return { name, isFile: () => true, isDirectory: () => false, isSymbolicLink: () => false } as Dirent
    }, closeSync: vi.fn() }
  })
  const inventory = readExecutions('oversized-synthetic-data')
  expect(inventory).toMatchObject({ protected: true, capacityExceeded: true, records: [] })
  expect(inventory.errors).toContain('legacy execution directory exceeds the bounded migration scan')
  expect(visits).toBeLessThanOrEqual(MAX_TRACKED_EXECUTION_FILES * 2 + 34)
  expect(fakeFs.readFileSync).not.toHaveBeenCalled()
  expect(fakeFs.opendirSync.mock.calls.map(([path]) => String(path).replace(/\\/g, '/')))
    .not.toContain('oversized-synthetic-data/executions/history')
})
