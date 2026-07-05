import { expect, test } from 'vitest'
import { mkdtempSync, utimesSync } from 'node:fs'
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
