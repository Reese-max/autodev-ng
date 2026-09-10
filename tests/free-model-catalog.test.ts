import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { refreshFreeModelCatalog } from '../src/engines/free-model-catalog.js'
import { callFreeModel, FREE_MODEL_CATALOG, FREE_MODEL_URL } from '../src/engines/free-model-policy.js'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

test('daily refresh preserves last good catalog on empty/error, stays quiet when unchanged, and announces recovery once', async () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'adng-free-catalog-')), file = join(dataDir, 'free-model-catalog.json')
  const cfg = { tierMode: 'free-only' as const, dataDir, timezoneOffsetHours: 8, stopFile: join(dataDir, 'STOP') }
  let now = Date.parse('2026-09-10T00:00:00Z'), mode = 'good', deliver = true
  vi.spyOn(Date, 'now').mockImplementation(() => now)
  const fetchFn = vi.fn(async url => {
    expect(url).toBe(FREE_MODEL_CATALOG)
    if (mode === 'error') throw new Error('private upstream body')
    return new Response(JSON.stringify({ data: mode === 'empty' ? [] : [
      { id: 'test/free:free', pricing: { prompt: '0', completion: '0' } },
      { id: 'test/paid:free', pricing: { prompt: '0', completion: '1' } },
    ] }))
  }) as typeof fetch
  const send = vi.fn(async (_text: string) => deliver), run = () => refreshFreeModelCatalog(cfg, { send }, fetchFn)
  await run(); expect(JSON.parse(readFileSync(file, 'utf8')).models).toEqual(['test/free:free']); expect(send).toHaveBeenCalledTimes(1)
  await run(); expect(fetchFn).toHaveBeenCalledTimes(1); expect(send).toHaveBeenCalledTimes(1)
  now += 86400_000; await run(); expect(send).toHaveBeenCalledTimes(1)
  const good = readFileSync(file, 'utf8')
  mode = 'empty'; now += 86400_000; await run(); expect(readFileSync(file, 'utf8')).toBe(good); expect(send).toHaveBeenCalledTimes(2)
  mode = 'error'; now += 86400_000; await run(); expect(readFileSync(file, 'utf8')).toBe(good); expect(send).toHaveBeenCalledTimes(2)
  expect(readFileSync(join(dataDir, 'free-model-catalog-refresh.json'), 'utf8')).not.toContain('private upstream body')
  mode = 'good'; deliver = false; now += 86400_000; await run(); expect(send).toHaveBeenCalledTimes(3)
  const calls = vi.mocked(fetchFn).mock.calls.length
  deliver = true; await run(); await run(); expect(send).toHaveBeenCalledTimes(4); expect(fetchFn).toHaveBeenCalledTimes(calls)
  expect(vi.mocked(send).mock.calls[3]?.[0]).toContain('恢復')
  writeFileSync(cfg.stopFile, 'paused'); now += 86400_000; await run(); expect(fetchFn).toHaveBeenCalledTimes(calls)
})

test('a saved free catalog never bypasses current pricing admission; non-free mode performs no scan', async () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'adng-free-stale-'))
  writeFileSync(join(dataDir, 'free-model-catalog.json'), JSON.stringify({ checkedAt: new Date().toISOString(), models: ['test/free:free'] }))
  const fetchFn = vi.fn(async () => new Response(JSON.stringify({ data: [{ id: 'test/free:free', pricing: { prompt: '1', completion: '0' } }] }))) as typeof fetch
  await expect(callFreeModel({ dataDir, url: FREE_MODEL_URL, model: 'test/free:free', apiKey: 'test', fetchFn }, 'Review')).rejects.toThrow('nonzero')
  expect(fetchFn).toHaveBeenCalledTimes(1)
  await refreshFreeModelCatalog({ dataDir, stopFile: join(dataDir, 'STOP'), timezoneOffsetHours: 0 }, { send: async () => true }, fetchFn)
  expect(fetchFn).toHaveBeenCalledTimes(1)
})
