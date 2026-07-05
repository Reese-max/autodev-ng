import { expect, test } from 'vitest'
import { mkdtempSync, utimesSync, existsSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { acquireLock, releaseLock } from '../src/lock.js'

test('第二次 acquire 失敗；release 後可再取', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  expect(acquireLock(dir)).toBe(true)
  expect(acquireLock(dir)).toBe(false)
  releaseLock(dir)
  expect(acquireLock(dir)).toBe(true)
})

test('過期鎖可被接管', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  expect(acquireLock(dir)).toBe(true)
  const old = new Date(Date.now() - 60 * 60 * 1000)
  utimesSync(dir, old, old) // 假裝鎖已一小時
  expect(acquireLock(dir, 30 * 60 * 1000)).toBe(true)
})

test('父目錄不存在時 acquireLock 必 throw（ENOENT rethrow，不是回 false）', () => {
  const parent = mkdtempSync(join(tmpdir(), 'adng-lk-'))
  const dir = join(parent, 'no-such-parent', 'lock')
  expect(() => acquireLock(dir)).toThrow()
})

test('stale 接管成功後，第二個呼叫者立即再 acquire 必回 false（新鎖 age 已重置）', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  expect(acquireLock(dir)).toBe(true)
  const old = new Date(Date.now() - 60 * 60 * 1000)
  utimesSync(dir, old, old) // 假裝鎖已一小時

  expect(acquireLock(dir, 30 * 60 * 1000)).toBe(true) // 接管成功，建立全新鎖
  expect(acquireLock(dir, 30 * 60 * 1000)).toBe(false) // 新鎖剛建立，age 未過期，必須讓步
})

test('對已被 rename 走的殘留 .stale-* 目錄不影響後續 acquire/release', () => {
  const parent = mkdtempSync(join(tmpdir(), 'adng-lk-'))
  const dir = join(parent, 'lock')
  expect(acquireLock(dir)).toBe(true)
  const old = new Date(Date.now() - 60 * 60 * 1000)
  utimesSync(dir, old, old)
  expect(acquireLock(dir, 30 * 60 * 1000)).toBe(true) // 觸發 rename → rmSync 殘留清理

  // 確認沒有殘留的 .stale-* 目錄留在 parent 底下
  const leftovers = readdirSync(parent).filter((name) => name.includes('.stale-'))
  expect(leftovers).toEqual([])
  expect(existsSync(dir)).toBe(true)

  // 殘留（若有）不應影響正常 acquire/release 流程
  expect(acquireLock(dir, 30 * 60 * 1000)).toBe(false)
  releaseLock(dir)
  expect(acquireLock(dir)).toBe(true)
})
