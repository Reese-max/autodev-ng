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
