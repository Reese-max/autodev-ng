import { expect, test } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { RunDb } from '../src/db.js'
import { buildDigest } from '../src/digest.js'

const DIGEST_DAY = '2026-07-27'

function freshDir(): string {
  return mkdtempSync(join(tmpdir(), 'adng-no-commit-cap-'))
}

test('近 7 日樣本至少 5 且 no-commit 比率大於 30% 時提示調降 cap', () => {
  const dataDir = freshDir()
  const db = new RunDb(join(dataDir, 'run.db'))
  db.record({ taskId: 'a', ok: false, costUsd: 0, detail: 'no-commit(phantom completion?)', engine: 'codex', ts: '2026-07-21T01:00:00.000Z' })
  db.record({ taskId: 'b', ok: false, costUsd: 0, detail: 'retry: no-commit', engine: 'codex', ts: '2026-07-22T01:00:00.000Z' })
  db.record({ taskId: 'c', ok: false, costUsd: 0, detail: 'verify-failed', engine: 'codex', ts: '2026-07-23T01:00:00.000Z' })
  db.record({ taskId: 'd', ok: true, costUsd: 0, detail: '', engine: 'codex', ts: '2026-07-24T01:00:00.000Z' })
  db.record({ taskId: 'e', ok: true, costUsd: 0, detail: 'no-commit text on success', engine: 'codex', ts: '2026-07-27T23:59:59.999Z' })

  const text = buildDigest({ db, dataDir, isoDayUtc: DIGEST_DAY })
  expect(text).toContain('⚠ 引擎 codex 近 7 日 no-commit：2/5（40%），建議調降 dailyAttemptCap')
  db.close()
})

test('比率恰為 30% 或樣本少於 5 時皆不提示', () => {
  const dataDir = freshDir()
  const db = new RunDb(join(dataDir, 'run.db'))
  for (let i = 0; i < 10; i++) {
    db.record({
      taskId: `boundary-${i}`,
      ok: i >= 3,
      costUsd: 0,
      detail: i < 3 ? 'no-commit' : '',
      engine: 'boundary',
      ts: '2026-07-25T01:00:00.000Z',
    })
  }
  for (let i = 0; i < 4; i++) {
    db.record({ taskId: `small-${i}`, ok: false, costUsd: 0, detail: 'no-commit', engine: 'small', ts: '2026-07-26T01:00:00.000Z' })
  }

  const text = buildDigest({ db, dataDir, isoDayUtc: DIGEST_DAY })
  expect(text).not.toContain('建議調降 dailyAttemptCap')
  db.close()
})

test('dataDir 缺 run.db 時 fail-open 省略提示', () => {
  const dataDir = freshDir()
  const statsDb = new RunDb(join(freshDir(), 'run.db'))

  let text = ''
  expect(() => { text = buildDigest({ db: statsDb, dataDir, isoDayUtc: DIGEST_DAY }) }).not.toThrow()
  expect(text).not.toContain('建議調降 dailyAttemptCap')
  statsDb.close()
})
