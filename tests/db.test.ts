import { expect, test } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { RunDb } from '../src/db.js'

function freshDb(): RunDb {
  return new RunDb(join(mkdtempSync(join(tmpdir(), 'adng-db-')), 'run.db'))
}

test('record + failCount 只數失敗', () => {
  const db = freshDb()
  db.record({ taskId: 'aaaa', ok: false, costUsd: 0.1, detail: 'boom' })
  db.record({ taskId: 'aaaa', ok: true, costUsd: 0.2, detail: 'fixed' })
  db.record({ taskId: 'bbbb', ok: false, costUsd: 0.1, detail: 'x' })
  expect(db.failCount('aaaa')).toBe(1)
  expect(db.failCount('bbbb')).toBe(1)
  db.close()
})

test('costSince 以 UTC 日界線累計', () => {
  const db = freshDb()
  db.record({ taskId: 'a', ok: true, costUsd: 1.5, detail: '', ts: '2026-07-05T01:00:00Z' })
  db.record({ taskId: 'a', ok: true, costUsd: 2.0, detail: '', ts: '2026-07-05T23:00:00Z' })
  db.record({ taskId: 'a', ok: true, costUsd: 9.9, detail: '', ts: '2026-07-04T23:59:00Z' })
  expect(db.costSince('2026-07-05')).toBeCloseTo(3.5)
  db.close()
})

test('costSince 毫秒時戳邊界修正：00:00:00.000Z 納入、前一日 23:59:59.999Z 排除', () => {
  const db = freshDb()
  // 應納入：當日 00:00:00.000Z（毫秒記錄）
  db.record({ taskId: 'boundary-test', ok: true, costUsd: 1.0, detail: '', ts: '2026-07-05T00:00:00.000Z' })
  // 應排除：前一日 23:59:59.999Z
  db.record({ taskId: 'boundary-test', ok: true, costUsd: 9.9, detail: '', ts: '2026-07-04T23:59:59.999Z' })
  // 應納入：當日正常時戳
  db.record({ taskId: 'boundary-test', ok: true, costUsd: 2.5, detail: '', ts: '2026-07-05T12:00:00Z' })
  expect(db.costSince('2026-07-05')).toBeCloseTo(3.5)
  db.close()
})
