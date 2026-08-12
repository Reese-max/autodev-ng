import Database from 'better-sqlite3'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
// @ts-expect-error runtime 維運腳本刻意維持無型別的 .mjs 介面。
import { installSqliteBackup } from '../scripts/memory-snapshot.mjs'

test('memory snapshot：只以通過 quick_check 的非空暫存檔原子替換正式 DB', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-snapshot-'))
  const stop = join(dir, '.adng.stop')
  const dst = join(dir, 'run.db')
  const valid = join(dir, 'valid.tmp')
  const previous = new Database(dst)
  previous.exec('CREATE TABLE old_snapshot (value TEXT)')
  previous.close()
  const db = new Database(valid)
  db.exec('CREATE TABLE proof (value TEXT); INSERT INTO proof VALUES (\'ok\')')
  db.close()

  expect(installSqliteBackup(valid, dst, stop)).toBe(true)
  expect(existsSync(valid)).toBe(false)
  const installed = new Database(dst, { readonly: true })
  expect(installed.prepare('SELECT value FROM proof').pluck().get()).toBe('ok')
  installed.close()

  const empty = join(dir, 'empty.tmp')
  writeFileSync(empty, '')
  expect(installSqliteBackup(empty, dst, stop)).toBe(false)
  expect(readFileSync(dst).length).toBeGreaterThan(0)
})

test('memory snapshot：暫停時保留候選檔且不替換正式 DB', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-snapshot-paused-'))
  const stop = join(dir, '.adng.stop')
  const dst = join(dir, 'run.db')
  const candidate = join(dir, 'candidate.tmp')
  const db = new Database(candidate)
  db.exec('CREATE TABLE proof (value TEXT)')
  db.close()
  writeFileSync(stop, 'pause\n')

  expect(installSqliteBackup(candidate, dst, stop)).toBe(false)
  expect(existsSync(candidate)).toBe(true)
  expect(existsSync(dst)).toBe(false)
})
