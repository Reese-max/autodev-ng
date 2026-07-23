import Database from 'better-sqlite3'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ProblemsLedger, problemFingerprint } from '../src/autopilot/ledger.js'
import { collectGoalAttemptStats, settleProblemRoi } from '../src/autopilot/roi.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { taskId } from '../src/backlog.js'

const dirs: string[] = []
afterEach(() => { while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true }) })

function oldLedgerFile(): string {
  const dir = mkdtempSync(join(tmpdir(), 'adng-ledger-roi-'))
  dirs.push(dir)
  const file = join(dir, 'run.db')
  const db = new Database(file)
  db.exec(`CREATE TABLE problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT, fingerprint TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
    lens TEXT NOT NULL DEFAULT '', value INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'open',
    goal_id TEXT NOT NULL DEFAULT '', first_seen TEXT NOT NULL, last_seen TEXT NOT NULL, note TEXT NOT NULL DEFAULT ''
  )`)
  db.prepare(`INSERT INTO problems (fingerprint,title,lens,value,first_seen,last_seen) VALUES (?,?,?,?,?,?)`)
    .run(problemFingerprint('舊問題'), '舊問題', 'tests', 7, '2026-07-01T00:00:00Z', '2026-07-01T00:00:00Z')
  db.close()
  return file
}

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'adng-ledger-roi-'))
  dirs.push(dir)
  return dir
}

describe('ProblemsLedger ROI 相容落盤', () => {
  test('舊 schema 自動補欄，既有資料與 ROI 都可讀寫', () => {
    const file = oldLedgerFile()
    const ledger = new ProblemsLedger(file)
    const fp = problemFingerprint('舊問題')
    expect(ledger.listByStatus('open')[0]).toMatchObject({ fingerprint: fp, title: '舊問題' })
    ledger.setRoi(fp, {
      goalResults: 'achieved', attemptsTotal: 3, successCount: 2,
      startedAt: '2026-07-02T00:00:00Z', endedAt: '2026-07-02T01:00:00Z'
    })
    expect(ledger.listByStatus('open')[0]).toMatchObject({
      goalResults: 'achieved', attemptsTotal: 3, successCount: 2,
      startedAt: '2026-07-02T00:00:00Z', endedAt: '2026-07-02T01:00:00Z'
    })
    ledger.close()
    const db = new Database(file, { readonly: true })
    const columns = (db.prepare('PRAGMA table_info(problems)').all() as { name: string }[]).map(column => column.name)
    db.close()
    expect(columns).toEqual(expect.arrayContaining(['goal_results', 'attempts_total', 'success_count', 'started_at', 'ended_at']))
  })

  test('遷移失敗時保留舊台帳讀寫，不阻斷 discovery', () => {
    const file = oldLedgerFile()
    const exec = Database.prototype.exec
    const spy = vi.spyOn(Database.prototype, 'exec').mockImplementation(function (this: Database.Database, sql: string) {
      if (sql.startsWith('ALTER TABLE problems')) throw new Error('migration blocked')
      return exec.call(this, sql)
    })
    try {
      const ledger = new ProblemsLedger(file)
      expect(() => ledger.upsertSeen({ title: '新問題', lens: 'tests', value: 9 }, '2026-07-03T00:00:00Z')).not.toThrow()
      expect(ledger.listByStatus('open').map(row => row.title)).toEqual(['新問題', '舊問題'])
      expect(() => ledger.setRoi(problemFingerprint('舊問題'), { attemptsTotal: 1 })).not.toThrow()
      ledger.close()
    } finally { spy.mockRestore() }
  })

  test('讀寫失敗時回傳安全預設，不拋出例外', () => {
    const ledger = new ProblemsLedger(oldLedgerFile())
    ledger.close()
    expect(() => ledger.setStatus(problemFingerprint('舊問題'), 'fixed', 'done')).not.toThrow()
    expect(() => ledger.setRoi(problemFingerprint('舊問題'), { attemptsTotal: 1 })).not.toThrow()
    expect(ledger.listByStatus('open')).toEqual([])
    expect(ledger.counts()).toEqual({})
    expect(ledger.upsertSeen({ title: '失憶問題', lens: 'tests', value: 1 }, '2026-07-03T00:00:00Z').isNew).toBe(false)
  })

  test('只彙整該 goal 標記且位於起訖窗內的實際 attempts', () => {
    const dir = tempDir(), file = join(dir, 'run.db'), backlog = join(dir, 'BACKLOG.md')
    writeFileSync(backlog, [
      '- [x] 任務甲 <!-- adng:autopilot goal:g1 round:1 --> <!-- adng:done abc -->',
      '- [ ] 任務乙 <!-- adng:autopilot goal:g1 round:2 -->',
      '- [x] 其他任務 <!-- adng:autopilot goal:g2 round:1 --> <!-- adng:done def -->'
    ].join('\n'))
    const db = new RunDb(file)
    db.record({ taskId: taskId('任務甲'), ts: '2026-07-01T23:59:00Z', ok: true, costUsd: 0, detail: '' })
    db.record({ taskId: taskId('任務甲'), ts: '2026-07-02T00:10:00Z', ok: true, costUsd: 0, detail: '' })
    db.record({ taskId: taskId('任務乙'), ts: '2026-07-02T00:20:00Z', ok: false, costUsd: 0, detail: '' })
    db.record({ taskId: taskId('其他任務'), ts: '2026-07-02T00:30:00Z', ok: true, costUsd: 0, detail: '' })
    db.record({ taskId: taskId('任務甲'), ts: '2026-07-02T01:01:00Z', ok: true, costUsd: 0, detail: '' })
    db.close()

    expect(collectGoalAttemptStats(file, backlog, 'g1', '2026-07-02T00:00:00Z', '2026-07-02T01:00:00Z'))
      .toEqual({ attemptsTotal: 2, successCount: 1 })
  })

  test.each(['achieved', 'no-progress', 'stuck'] as const)('%s 收案會寫入結果、attempts 與起訖時間', result => {
    const dir = tempDir(), file = join(dir, 'run.db'), backlog = join(dir, 'BACKLOG.md')
    writeFileSync(backlog, '- [x] 任務甲 <!-- adng:autopilot goal:g1 round:1 --> <!-- adng:done abc -->\n')
    const runDb = new RunDb(file)
    runDb.record({ taskId: taskId('任務甲'), ts: '2026-07-02T00:10:00Z', ok: true, costUsd: 0, detail: '' })
    runDb.close()
    const ledger = new ProblemsLedger(file)
    const fp = problemFingerprint('問題')
    ledger.upsertSeen({ title: '問題', lens: 'tests', value: 8 }, '2026-07-01T00:00:00Z')

    settleProblemRoi({
      ledger, events: new EventLog(dir), dbFile: file, backlogFile: backlog,
      fingerprint: fp, goalId: 'g1', result,
      startedAt: '2026-07-02T00:00:00Z', endedAt: '2026-07-02T01:00:00Z'
    })

    expect(ledger.get(fp)).toMatchObject({
      goalResults: result, attemptsTotal: 1, successCount: 1,
      startedAt: '2026-07-02T00:00:00Z', endedAt: '2026-07-02T01:00:00Z'
    })
    ledger.close()
  })

  test('run.db attempts 不可讀時 counts 留 NULL；ROI 回寫失敗只記事件', () => {
    const dir = tempDir(), file = join(dir, 'run.db'), missingBacklog = join(dir, 'missing.md')
    const events = new EventLog(dir), ledger = new ProblemsLedger(file)
    const fp = problemFingerprint('問題')
    ledger.upsertSeen({ title: '問題', lens: 'tests', value: 8 }, '2026-07-01T00:00:00Z')
    settleProblemRoi({
      ledger, events, dbFile: file, backlogFile: missingBacklog, fingerprint: fp, goalId: 'g1',
      result: 'achieved', startedAt: '2026-07-02T00:00:00Z', endedAt: '2026-07-02T01:00:00Z'
    })
    expect(ledger.get(fp)).toMatchObject({ goalResults: 'achieved' })
    expect(ledger.get(fp)?.attemptsTotal).toBeUndefined()

    vi.spyOn(ledger, 'setRoi').mockReturnValue(false)
    expect(() => settleProblemRoi({
      ledger, events, dbFile: file, backlogFile: missingBacklog, fingerprint: fp, goalId: 'g1',
      result: 'stuck', startedAt: '2026-07-02T00:00:00Z', endedAt: '2026-07-02T01:00:00Z'
    })).not.toThrow()
    const logged = existsSync(join(dir, 'events.jsonl'))
      ? readFileSync(join(dir, 'events.jsonl'), 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line).type)
      : []
    expect(logged).toContain('perpetual-roi-write-failed')
    ledger.close()
  })
})
