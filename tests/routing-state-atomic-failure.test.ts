import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, vi } from 'vitest'

const renameSync_ = vi.hoisted(() => vi.fn())

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  renameSync_.mockImplementation((...args: Parameters<typeof actual.renameSync>) => {
    if (String(args[1]).endsWith('engine-routing-state.json')) {
      throw new Error('EIO（模擬 rename 失敗）')
    }
    return actual.renameSync(...args)
  })
  return { ...actual, renameSync: renameSync_ }
})

const {
  ROUTING_STATE_FILENAME,
  defaultRoutingState,
  saveRoutingState,
} = await import('../src/engines/routing-state.js')

test('rename 失敗時保留舊狀態且清除本次暫存檔', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-routing-rename-fail-'))
  try {
    const file = join(dir, ROUTING_STATE_FILENAME)
    const old = JSON.stringify(defaultRoutingState('2026-07-19T00:00:00.000Z'))
    writeFileSync(file, old)

    const next = defaultRoutingState('2026-07-20T00:00:00.000Z')
    next.isolated.qwen = { untilTs: '2026-07-21T00:00:00.000Z', reason: 'bad-stats' }
    expect(saveRoutingState(dir, next)).toBe(false)

    expect(readFileSync(file, 'utf8')).toBe(old)
    expect(
      readdirSync(dir).filter(name => name.startsWith(`${ROUTING_STATE_FILENAME}.`) && name.endsWith('.tmp'))
    ).toEqual([])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
