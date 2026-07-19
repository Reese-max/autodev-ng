import { expect, test } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PreflightCache } from '../src/preflight.js'

function fresh(ttl?: number): PreflightCache {
  return new PreflightCache(join(mkdtempSync(join(tmpdir(), 'adng-pf-')), 'pf.json'), ttl)
}

test('set 後 get 命中；未 set 回 null', () => {
  const c = fresh()
  expect(c.get('claude:sonnet')).toBeNull()
  c.set('claude:sonnet', { ok: true, detail: 'PONG 1200ms' })
  expect(c.get('claude:sonnet')).toEqual({ ok: true, detail: 'PONG 1200ms' })
})

test('TTL 過期回 null', async () => {
  const c = fresh(50) // 50ms TTL
  c.set('k', { ok: true, detail: 'x' })
  await new Promise(r => setTimeout(r, 80))
  expect(c.get('k')).toBeNull()
})

test('cache 檔損壞視為空 cache 不 throw', () => {
  const file = join(mkdtempSync(join(tmpdir(), 'adng-pf-')), 'pf.json')
  writeFileSync(file, '{broken')
  const c = new PreflightCache(file)
  expect(c.get('k')).toBeNull()
  c.set('k', { ok: false, detail: 'dead' }) // 損壞後仍可重建
  expect(c.get('k')).toEqual({ ok: false, detail: 'dead' })
})

test('壞結果用 badTtlMs 提早過期，好結果用 ttlMs', async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'adng-pf-')), 'pf.json')
  const c = new PreflightCache(file, 60_000, 50)
  c.set('bad', { ok: false, detail: 'dead' })
  c.set('good', { ok: true, detail: 'alive' })
  await new Promise(r => setTimeout(r, 80))
  expect(c.get('bad')).toBeNull()          // 壞結果 50ms 即過期 → 會重試
  expect(c.get('good')).not.toBeNull()     // 好結果仍在 60s 窗內
})

test('entry 形狀損壞（ts 非數字）視為未命中且 set 不 throw', () => {
  const file = join(mkdtempSync(join(tmpdir(), 'adng-pf-')), 'pf.json')
  writeFileSync(file, JSON.stringify({ k: { r: { ok: true, detail: 'x' } } })) // 缺 ts
  const c = new PreflightCache(file)
  expect(c.get('k')).toBeNull()
  expect(() => c.set('k', { ok: true, detail: 'y' })).not.toThrow()
})

test('cacheFile 父目錄不存在時 set 不 throw（fail-open）', () => {
  const c = new PreflightCache(join(mkdtempSync(join(tmpdir(), 'adng-pf-')), 'no', 'such', 'dir', 'pf.json'))
  expect(() => c.set('k', { ok: true, detail: 'x' })).not.toThrow()
  expect(c.get('k')).toBeNull() // 寫不進去就當沒 cache
})

test('set ts=0 → 寫入即過期，get 立即 miss（invalidatePreflight 語意）', () => {
  const file = join(mkdtempSync(join(tmpdir(), 'adng-pf-')), 'pf.json')
  const c = new PreflightCache(file)
  c.set('k', { ok: true, detail: 'PONG' })
  expect(c.get('k')?.ok).toBe(true)
  c.set('k', { ok: false, detail: 'run-failed：下輪重探' }, 0)
  expect(c.get('k')).toBeNull() // 過期＝miss → 下輪真探針
})
