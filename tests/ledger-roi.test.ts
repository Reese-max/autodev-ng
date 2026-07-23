import Database from 'better-sqlite3'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ProblemsLedger, problemFingerprint } from '../src/autopilot/ledger.js'

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
    const spy = vi.spyOn(Database.prototype, 'exec').mockImplementation(function (sql: string) {
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
})
