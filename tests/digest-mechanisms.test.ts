import { expect, test } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { RunDb } from '../src/db.js'
import { buildDigest } from '../src/digest.js'

const DIGEST_DAY = '2026-07-27'

function freshDir(): string {
  return mkdtempSync(join(tmpdir(), 'adng-digest-mechanisms-'))
}

test('有事件時 digest 顯示近 7 日三種機制的正確計數', () => {
  const dataDir = freshDir()
  const db = new RunDb(join(dataDir, 'run.db'))
  writeFileSync(join(dataDir, 'events.jsonl'), [
    JSON.stringify({ ts: '2026-07-21T00:00:00.000Z', type: 'merge-rebased' }),
    JSON.stringify({ ts: '2026-07-27T12:00:00.000Z', type: 'merge-rebased' }),
    JSON.stringify({ ts: '2026-07-25T12:00:00.000Z', type: 'author-northstar-reject' }),
    JSON.stringify({ ts: '2026-07-26T12:00:00.000Z', type: 'engine-route-isolated', reason: '簽名熔斷' }),
    JSON.stringify({ ts: '2026-07-27T13:00:00.000Z', type: 'engine-route-isolated', reason: '低成功率' }),
    JSON.stringify({ ts: '2026-07-20T23:59:59.999Z', type: 'merge-rebased' }),
    JSON.stringify({ ts: '2026-07-28T00:00:00.000Z', type: 'author-northstar-reject' }),
    '{壞行',
  ].join('\n') + '\n')

  const text = buildDigest({ db, dataDir, isoDayUtc: DIGEST_DAY })
  expect(text).toContain('機制成效（近 7 日）')
  expect(text).toContain('merge-rebased：2 次')
  expect(text).toContain('author-northstar-reject：1 次')
  expect(text).toContain('engine-route-isolated（含簽名熔斷）：2 次')
  db.close()
})

test('事件與 timeout 全為零時省略整段機制成效', () => {
  const dataDir = freshDir()
  const db = new RunDb(join(dataDir, 'run.db'))
  writeFileSync(join(dataDir, 'events.jsonl'), '')

  expect(buildDigest({ db, dataDir, isoDayUtc: DIGEST_DAY })).not.toContain('機制成效')
  db.close()
})

test('events.jsonl 缺檔不炸，run.db timeout 趨勢仍獨立產出', () => {
  const dataDir = freshDir()
  const db = new RunDb(join(dataDir, 'run.db'))
  db.record({ taskId: 'a', ok: false, costUsd: 0, detail: 'timeout wall', ts: '2026-07-21T01:00:00.000Z' })
  db.record({ taskId: 'b', ok: false, costUsd: 0, detail: 'timeout idle', ts: '2026-07-21T02:00:00.000Z' })
  db.record({ taskId: 'c', ok: false, costUsd: 0, detail: 'timeout', ts: '2026-07-24T01:00:00.000Z' })
  db.record({ taskId: 'd', ok: true, costUsd: 0, detail: 'timeout but ok', ts: '2026-07-24T02:00:00.000Z' })
  db.record({ taskId: 'e', ok: false, costUsd: 0, detail: 'verify timeout', ts: '2026-07-24T03:00:00.000Z' })
  db.record({ taskId: 'f', ok: false, costUsd: 0, detail: 'timeout old', ts: '2026-07-20T23:59:59.999Z' })

  let text = ''
  expect(() => { text = buildDigest({ db, dataDir, isoDayUtc: DIGEST_DAY }) }).not.toThrow()
  expect(text).toContain('run.db timeout 類失敗趨勢：07-21 2｜07-22 0｜07-23 0｜07-24 1｜07-25 0｜07-26 0｜07-27 0')
  expect(text).not.toContain('merge-rebased：')
  db.close()
})

test('run.db 指標失敗不會吃掉 events.jsonl 的事件計數', () => {
  const dataDir = freshDir()
  const statsDb = new RunDb(join(freshDir(), 'run.db'))
  writeFileSync(join(dataDir, 'run.db'), 'not sqlite')
  writeFileSync(join(dataDir, 'events.jsonl'),
    JSON.stringify({ ts: '2026-07-27T01:00:00.000Z', type: 'merge-rebased' }) + '\n')

  const text = buildDigest({ db: statsDb, dataDir, isoDayUtc: DIGEST_DAY })
  expect(text).toContain('merge-rebased：1 次')
  expect(text).not.toContain('timeout 類失敗趨勢')
  statsDb.close()
})
