import { expect, test, vi } from 'vitest'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { RunDb } from '../src/db.js'
import { withOwnedResources } from '../src/cli/owned-resources.js'
import { FixtureExecutionScope } from './helpers/fixture-execution-scope.js'

function gate() {
  let release!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  return { pending, release }
}

test('teardown waits for actual owned SQLite execution before restoring globals or deleting the root', async () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-gh-lifecycle-')), db = new RunDb(join(root, 'run.db'))
  const scope = new FixtureExecutionScope(), held = gate(), originalFetch = globalThis.fetch
  const fixtureFetch = vi.fn(async () => { throw new Error('Provider forbidden') })
  vi.stubGlobal('fetch', fixtureFetch)
  const operation = scope.track(withOwnedResources({ deps: { db } }, async () => { await held.pending; return 'completed' }))
  let cleaned = false
  const teardown = (async () => {
    await scope.drain(1_000)
    vi.unstubAllGlobals(); rmSync(root, { recursive: true, force: true }); cleaned = true
  })()
  try {
    await Promise.resolve()
    expect(cleaned).toBe(false)
    expect(existsSync(root)).toBe(true)
    expect(globalThis.fetch).toBe(fixtureFetch)
    expect(db.costForLocalDay('2026-07-20', 0)).toBe(0) // The actual owner is still open.
    held.release()
    expect(await operation).toBe('completed')
    await teardown
    expect(cleaned).toBe(true)
    expect(existsSync(root)).toBe(false)
    expect(globalThis.fetch).toBe(originalFetch)
    expect(() => db.costForLocalDay('2026-07-20', 0)).toThrow() // Owner closed before deletion.
  } finally {
    held.release(); await operation; await teardown
    vi.unstubAllGlobals(); rmSync(root, { recursive: true, force: true })
  }
})

test('an expired drain retains the live root and mock and refuses a subsequent fixture', async () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-gh-lifecycle-')), scope = new FixtureExecutionScope(), held = gate()
  const fixtureFetch = vi.fn(async () => { throw new Error('Provider forbidden') })
  vi.stubGlobal('fetch', fixtureFetch)
  const operation = scope.track(held.pending)
  try {
    await expect((async () => {
      await scope.drain(10)
      vi.unstubAllGlobals(); rmSync(root, { recursive: true, force: true })
    })()).rejects.toThrow('preserve their roots and mocks')
    expect(existsSync(root)).toBe(true)
    expect(globalThis.fetch).toBe(fixtureFetch)
    expect(() => scope.ensureIdle()).toThrow('still active')
    held.release(); await operation
    expect(() => scope.ensureIdle()).toThrow('cleanup is unconfirmed')
  } finally {
    held.release(); await operation; await scope.drain(1_000)
    vi.unstubAllGlobals(); rmSync(root, { recursive: true, force: true })
  }
})

test('tracking preserves the original operation rejection while allowing safe cleanup', async () => {
  const scope = new FixtureExecutionScope(), original = new Error('Original execution failure')
  await expect(scope.track(Promise.reject(original))).rejects.toBe(original)
  await scope.drain(1_000)
  expect(() => scope.ensureIdle()).not.toThrow()
})

test('drain also waits for operations introduced by an already tracked execution', async () => {
  const scope = new FixtureExecutionScope(), first = gate(), second = gate()
  const operation = scope.track((async () => { await first.pending; scope.track(second.pending) })())
  let drained = false
  const drain = scope.drain(1_000).then(() => { drained = true })
  first.release(); await operation
  expect(drained).toBe(false)
  second.release(); await drain
  expect(drained).toBe(true)
})
