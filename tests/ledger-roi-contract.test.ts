import Database from 'better-sqlite3'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test } from 'vitest'
import { taskId } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { ProblemsLedger, problemFingerprint } from '../src/autopilot/ledger.js'
import { readRecentGoalRoiSummary, settleGoalRoi } from '../src/autopilot/roi.js'

const dirs: string[] = []
afterEach(() => { while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true }) })

test('舊台帳經 goal 收案後回寫實際成本，並供 critic 摘要讀取', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-ledger-roi-contract-'))
  dirs.push(dir)
  const dbFile = join(dir, 'run.db')
  const backlogFile = join(dir, 'BACKLOG.md')
  const fingerprint = problemFingerprint('ROI 契約問題')

  const oldDb = new Database(dbFile)
  oldDb.exec(`CREATE TABLE problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT, fingerprint TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
    lens TEXT NOT NULL DEFAULT '', value INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'open',
    goal_id TEXT NOT NULL DEFAULT '', first_seen TEXT NOT NULL, last_seen TEXT NOT NULL, note TEXT NOT NULL DEFAULT ''
  )`)
  oldDb.prepare(`INSERT INTO problems
    (fingerprint,title,lens,value,status,goal_id,first_seen,last_seen,note) VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(fingerprint, 'ROI 契約問題', 'tests', 8, 'in-progress', 'g1',
      '2026-07-01T00:00:00Z', '2026-07-01T00:00:00Z', '既有資料')
  oldDb.close()

  writeFileSync(backlogFile, [
    '- [x] 契約任務 <!-- adng:autopilot goal:g1 round:1 --> <!-- adng:done ok -->',
    '- [x] 干擾任務 <!-- adng:autopilot goal:g2 round:1 --> <!-- adng:done skip -->'
  ].join('\n'))
  const runDb = new RunDb(dbFile)
  runDb.record({ taskId: taskId('契約任務'), ts: '2026-07-02T00:10:00Z', ok: true, costUsd: 0, detail: '' })
  runDb.record({ taskId: taskId('契約任務'), ts: '2026-07-02T00:20:00Z', ok: false, costUsd: 0, detail: '' })
  runDb.record({ taskId: taskId('契約任務'), ts: '2026-07-02T01:01:00Z', ok: true, costUsd: 0, detail: '' })
  runDb.record({ taskId: taskId('干擾任務'), ts: '2026-07-02T00:30:00Z', ok: true, costUsd: 0, detail: '' })
  runDb.close()

  settleGoalRoi({
    events: new EventLog(dir), dbFile, backlogFile, goalId: 'g1', result: 'achieved',
    startedAt: '2026-07-02T00:00:00Z', endedAt: '2026-07-02T01:00:00Z'
  })

  const ledger = new ProblemsLedger(dbFile)
  const settled = ledger.get(fingerprint)
  ledger.close()
  expect(settled).toMatchObject({
    title: 'ROI 契約問題', note: '既有資料', goalResults: 'achieved',
    attemptsTotal: 2, successCount: 1,
    startedAt: '2026-07-02T00:00:00Z', endedAt: '2026-07-02T01:00:00Z'
  })
  expect(readRecentGoalRoiSummary(dbFile)).toContain(
    'tests：1 goals｜預估 value avg 8.0｜實際成本 2 attempts（1 成功）、1.0h｜結果 achieved 1/no-progress 0/stuck 0'
  )
})
