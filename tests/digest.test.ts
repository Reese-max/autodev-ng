import { expect, test } from 'vitest'
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { RunDb } from '../src/db.js'
import { buildDigest, markDigestSent, shouldSendDigest } from '../src/digest.js'

function freshDb(): RunDb {
  return new RunDb(join(mkdtempSync(join(tmpdir(), 'adng-digdb-')), 'run.db'))
}
function freshDataDir(): string {
  return mkdtempSync(join(tmpdir(), 'adng-dig-'))
}

test('dayStats：跨日與毫秒時戳只算當日 ok/fail/cost', () => {
  const db = freshDb()
  // 當日：兩筆 ok、一筆 fail
  db.record({ taskId: 'a', ok: true, costUsd: 1.0, detail: '', ts: '2026-07-05T00:00:00.000Z' })
  db.record({ taskId: 'b', ok: true, costUsd: 2.5, detail: '', ts: '2026-07-05T12:30:00Z' })
  db.record({ taskId: 'c', ok: false, costUsd: 0.5, detail: 'boom', ts: '2026-07-05T23:59:59.999Z' })
  // 跨日：前一天最後一毫秒、後一天第一毫秒，都不該被算進 07-05
  db.record({ taskId: 'd', ok: true, costUsd: 9.9, detail: '', ts: '2026-07-04T23:59:59.999Z' })
  db.record({ taskId: 'e', ok: false, costUsd: 8.8, detail: '', ts: '2026-07-06T00:00:00.000Z' })

  const stats = db.dayStats('2026-07-05')
  expect(stats.ok).toBe(2)
  expect(stats.fail).toBe(1)
  expect(stats.costUsd).toBeCloseTo(4.0)
  db.close()
})

test('dayStats：offset=8 時本地日界線位移（UTC 16:00 起算次一本地日）', () => {
  const db = freshDb()
  db.record({ taskId: 'a', ok: true, costUsd: 1.0, detail: '', ts: '2026-07-04T16:00:00.000Z' }) // 本地 07-05 00:00
  db.record({ taskId: 'b', ok: false, costUsd: 0.5, detail: '', ts: '2026-07-05T15:59:59.999Z' }) // 本地 07-05 23:59
  db.record({ taskId: 'c', ok: true, costUsd: 9.9, detail: '', ts: '2026-07-04T15:59:59.999Z' }) // 本地 07-04（排除）
  const stats = db.dayStats('2026-07-05', 8)
  expect(stats.ok).toBe(1)
  expect(stats.fail).toBe(1)
  expect(stats.costUsd).toBeCloseTo(1.5)
  db.close()
})

test('dayStats：當日無資料回全 0', () => {
  const db = freshDb()
  db.record({ taskId: 'x', ok: true, costUsd: 1, detail: '', ts: '2026-01-01T00:00:00Z' })
  const stats = db.dayStats('2026-07-05')
  expect(stats).toEqual({ ok: 0, fail: 0, costUsd: 0 })
  db.close()
})

test('buildDigest：含日期、計數、成本、DLQ 行數、通道自檢字樣', () => {
  const db = freshDb()
  db.record({ taskId: 'a', ok: true, costUsd: 1.25, detail: '', ts: '2026-07-05T01:00:00Z' })
  db.record({ taskId: 'b', ok: false, costUsd: 0.75, detail: 'x', ts: '2026-07-05T02:00:00Z' })
  const dataDir = freshDataDir()
  writeFileSync(join(dataDir, 'notify-dlq.jsonl'), '{"a":1}\n{"a":2}\n')

  const text = buildDigest({ db, dataDir, isoDayUtc: '2026-07-05' })
  expect(text).toContain('2026-07-05')
  expect(text).toContain('完成 1 筆')
  expect(text).toContain('失敗 1 筆')
  expect(text).toContain('2.0000')
  expect(text).toContain('DLQ 積壓：2 筆')
  expect(text.trim().endsWith('adng 通道自檢 OK')).toBe(true)
  db.close()
})

test('buildDigest：零任務零成本仍完整產出（鐵律 #6：無事也要發）', () => {
  const db = freshDb()
  const dataDir = freshDataDir()
  const text = buildDigest({ db, dataDir, isoDayUtc: '2026-07-05' })
  expect(text).toContain('完成 0 筆')
  expect(text).toContain('失敗 0 筆')
  expect(text).toContain('DLQ 積壓：0 筆')
  expect(text).toContain('adng 通道自檢 OK')
  db.close()
})

test('DLQ 缺檔＝0、有 3 行＝3', () => {
  const dbA = freshDb()
  const dirNoFile = freshDataDir()
  expect(buildDigest({ db: dbA, dataDir: dirNoFile, isoDayUtc: '2026-07-05' })).toContain('DLQ 積壓：0 筆')

  const dbB = freshDb()
  const dirWithFile = freshDataDir()
  writeFileSync(join(dirWithFile, 'notify-dlq.jsonl'), '{"1":1}\n{"2":2}\n{"3":3}\n')
  expect(buildDigest({ db: dbB, dataDir: dirWithFile, isoDayUtc: '2026-07-05' })).toContain('DLQ 積壓：3 筆')
  dbA.close()
  dbB.close()
})

test('stamp 生命週期：未發→true；標記後同日→false；隔日→true', () => {
  const dataDir = freshDataDir()
  expect(shouldSendDigest(dataDir, '2026-07-05')).toBe(true)
  markDigestSent(dataDir, '2026-07-05')
  expect(shouldSendDigest(dataDir, '2026-07-05')).toBe(false)
  expect(shouldSendDigest(dataDir, '2026-07-06')).toBe(true)
})

test('stamp 檔損壞（壞 JSON）容錯視為未發 → true', () => {
  const dataDir = freshDataDir()
  writeFileSync(join(dataDir, 'digest-stamp.json'), '{not valid json')
  expect(shouldSendDigest(dataDir, '2026-07-05')).toBe(true)
})

test('stamp 檔內容型別不符（非物件／欄位非字串）也容錯視為未發 → true', () => {
  const dataDir1 = freshDataDir()
  writeFileSync(join(dataDir1, 'digest-stamp.json'), '[1,2,3]')
  expect(shouldSendDigest(dataDir1, '2026-07-05')).toBe(true)

  const dataDir2 = freshDataDir()
  writeFileSync(join(dataDir2, 'digest-stamp.json'), JSON.stringify({ lastSentDay: 123 }))
  expect(shouldSendDigest(dataDir2, '2026-07-05')).toBe(true)
})

test('markDigestSent 原子寫入：寫入後不留 .tmp 殘檔', () => {
  const dataDir = freshDataDir()
  markDigestSent(dataDir, '2026-07-05')
  expect(shouldSendDigest(dataDir, '2026-07-05')).toBe(false)
  expect(existsSync(join(dataDir, 'digest-stamp.json.tmp'))).toBe(false)
})

test('buildDigest：verify-alert 事件依 detail 前綴分計——verify-skip 歸 verifySkip、其餘歸 other（M4 Task 4 分計）', () => {
  const db = freshDb()
  const dataDir = freshDataDir()
  writeFileSync(join(dataDir, 'events.jsonl'), [
    JSON.stringify({ type: 'verify-alert', detail: 'verify-skip: command not found', ts: '2026-07-05T01:00:00Z' }),
    JSON.stringify({ type: 'verify-alert', detail: 'verify-skip: command not found', ts: '2026-07-05T02:00:00Z' }),
    JSON.stringify({ type: 'verify-alert', detail: 'judge-skip: x', ts: '2026-07-05T03:00:00.000Z' }),
  ].join('\n') + '\n')

  const text = buildDigest({ db, dataDir, isoDayUtc: '2026-07-05' })
  expect(text).toContain('verify 略過 2 次')
  expect(text).toContain('驗證鏈其他告警 1 次')
  db.close()
})

test('buildDigest：other 分類涵蓋 judge-skipped/rollback-failed/rollback-exception/verifier-exception（依 detail 前綴，非 verify-skip 一律歸 other）', () => {
  const db = freshDb()
  const dataDir = freshDataDir()
  writeFileSync(join(dataDir, 'events.jsonl'), [
    JSON.stringify({ type: 'verify-alert', detail: 'judge-skipped: no baseCommitHash/empty diff', ts: '2026-07-05T01:00:00Z' }),
    JSON.stringify({ type: 'verify-alert', detail: 'rollback-failed: /repo=>abc123', ts: '2026-07-05T02:00:00Z' }),
    JSON.stringify({ type: 'verify-alert', detail: 'rollback-exception: boom', ts: '2026-07-05T03:00:00Z' }),
    JSON.stringify({ type: 'verify-alert', detail: 'verifier-exception: boom', ts: '2026-07-05T04:00:00Z' }),
  ].join('\n') + '\n')

  const text = buildDigest({ db, dataDir, isoDayUtc: '2026-07-05' })
  expect(text).not.toContain('verify 略過')
  expect(text).toContain('驗證鏈其他告警 4 次')
  db.close()
})

test('buildDigest：N=0（無 verify-alert 事件）verify 略過與其他告警兩行皆不印（不加雜訊）', () => {
  const db = freshDb()
  const dataDir = freshDataDir()
  const text = buildDigest({ db, dataDir, isoDayUtc: '2026-07-05' })
  expect(text).not.toContain('verify 略過')
  expect(text).not.toContain('驗證鏈其他告警')
  db.close()
})

test('buildDigest：events.jsonl 內非當日（昨日）的 verify-alert 不計入 N（日界線）', () => {
  const db = freshDb()
  const dataDir = freshDataDir()
  writeFileSync(join(dataDir, 'events.jsonl'), [
    JSON.stringify({ type: 'verify-alert', detail: 'verify-skip: x', ts: '2026-07-04T23:59:59.999Z' }),
  ].join('\n') + '\n')

  const text = buildDigest({ db, dataDir, isoDayUtc: '2026-07-05' })
  expect(text).not.toContain('verify 略過')
  db.close()
})

test('buildDigest：offsetHours=8 時 verify-alert 分計改用本地日（UTC 前一日 16:05 落本地當日）', () => {
  const db = freshDb()
  const dataDir = freshDataDir()
  writeFileSync(join(dataDir, 'events.jsonl'), [
    JSON.stringify({ type: 'verify-alert', detail: 'verify-skip: x', ts: '2026-07-04T16:05:00Z' }),
  ].join('\n') + '\n')

  const text = buildDigest({ db, dataDir, isoDayUtc: '2026-07-05', offsetHours: 8 })
  expect(text).toContain('verify 略過 1 次')
  db.close()
})

test('buildDigest：offsetHours 未傳時預設 0（UTC），與舊行為相容——同一筆事件在 offset=0 下落昨日不計入', () => {
  const db = freshDb()
  const dataDir = freshDataDir()
  writeFileSync(join(dataDir, 'events.jsonl'), [
    JSON.stringify({ type: 'verify-alert', detail: 'verify-skip: x', ts: '2026-07-04T16:05:00Z' }),
  ].join('\n') + '\n')

  const text = buildDigest({ db, dataDir, isoDayUtc: '2026-07-05' })
  expect(text).not.toContain('verify 略過')
  db.close()
})
