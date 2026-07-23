import Database from 'better-sqlite3'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ProblemsLedger, problemFingerprint } from '../src/autopilot/ledger.js'
import { collectGoalAttemptStats, readRecentGoalRoiSummary, settleGoalRoi, settleProblemRoi, summarizeRecentGoalRoi } from '../src/autopilot/roi.js'
import { criticPrompt, discoverProblems } from '../src/autopilot/discover.js'
import type { ProblemRow } from '../src/autopilot/ledger.js'
import { AUTO_GOAL_MARKER } from '../src/autopilot/author.js'
import { runPerpetualCycle, type PerpetualConfig, type PerpetualHooks } from '../src/autopilot/perpetual.js'
import type { GoalOutcome } from '../src/autopilot/orchestrator.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { taskId } from '../src/backlog.js'
import { ConfigSchema } from '../src/types.js'

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

const START = '2026-07-02T00:00:00.000Z'
const END = new Date('2026-07-02T01:00:00.000Z')

function cycleCfg(dir: string): PerpetualConfig {
  return {
    ...ConfigSchema.parse({
      projectPath: dir, backlogFile: join(dir, 'BACKLOG.md'), dataDir: dir,
      goalFile: join(dir, 'GOAL.md'), stopFile: join(dir, '.adng.stop'),
      engine: 'mock', verifyCommand: 'npm test', dailyHardUsd: 100
    }),
    perpetual: true, perpetualCooldownMs: 1, perpetualValueThreshold: 6
  }
}

function autoGoal(fp: string): string {
  return `${AUTO_GOAL_MARKER} problem:${fp} -->\n# GOAL\n\n修復 ROI 問題\n\n## 驗收\n\n\`\`\`sh\nnpm test\n\`\`\`\n`
}

function cycleHooks(outcome: GoalOutcome): PerpetualHooks {
  return {
    now: () => END,
    discover: vi.fn(async () => ({ survey: '', ranked: [] })),
    author: vi.fn(async () => null),
    runSession: vi.fn(async () => ({ goalId: 'g1', outcome })),
    billedToday: () => 0
  }
}

function llm(response: string, prompts?: string[]) {
  return {
    url: 'http://x/v1', model: 'm', apiKey: 'k',
    fetchFn: (async (_url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      const body = JSON.parse(String(init?.body)) as { messages: Array<{ content: string }> }
      prompts?.push(body.messages[0]!.content)
      return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: response } }] }) }
    }) as unknown as typeof fetch
  }
}

function roiRow(partial: Partial<ProblemRow> & Pick<ProblemRow, 'title' | 'lens' | 'value'>): ProblemRow {
  return {
    fingerprint: partial.fingerprint ?? problemFingerprint(partial.title),
    title: partial.title,
    lens: partial.lens,
    value: partial.value,
    status: partial.status ?? 'fixed',
    goalId: partial.goalId ?? 'g1',
    firstSeen: partial.firstSeen ?? '2026-07-01T00:00:00Z',
    lastSeen: partial.lastSeen ?? '2026-07-01T00:00:00Z',
    note: partial.note ?? '',
    goalResults: partial.goalResults,
    attemptsTotal: partial.attemptsTotal,
    successCount: partial.successCount,
    startedAt: partial.startedAt,
    endedAt: partial.endedAt
  }
}

describe('summarizeRecentGoalRoi 純函式', () => {
  test('無歷史資料 → 空字串', () => {
    expect(summarizeRecentGoalRoi([])).toBe('')
  })

  test('分組統計：同 lens 彙總預估 value avg、attempts/成功、耗時與結果數', () => {
    const summary = summarizeRecentGoalRoi([
      roiRow({
        title: '測試甲', lens: 'tests', value: 8, goalResults: 'achieved',
        attemptsTotal: 2, successCount: 2, startedAt: '2026-07-02T00:00:00Z', endedAt: '2026-07-02T01:00:00Z'
      }),
      roiRow({
        title: '測試乙', lens: 'tests', value: 6, goalResults: 'stuck',
        attemptsTotal: 4, successCount: 1, startedAt: '2026-07-03T00:00:00Z', endedAt: '2026-07-03T02:00:00Z'
      }),
      roiRow({
        title: '效能甲', lens: 'perf', value: 9, goalResults: 'no-progress',
        attemptsTotal: 3, successCount: 0, startedAt: '2026-07-04T00:00:00Z', endedAt: '2026-07-04T00:30:00Z'
      })
    ])
    expect(summary).toContain('tests：2 goals｜預估 value avg 7.0｜實際成本 6 attempts（3 成功）、3.0h｜結果 achieved 1/no-progress 0/stuck 1')
    expect(summary).toContain('perf：1 goals｜預估 value avg 9.0｜實際成本 3 attempts（0 成功）、0.5h｜結果 achieved 0/no-progress 1/stuck 0')
  })

  test('attempts 或耗時缺失時標註未知，不計入總數', () => {
    const summary = summarizeRecentGoalRoi([
      roiRow({
        title: '缺 attempts', lens: 'design', value: 5, goalResults: 'achieved',
        startedAt: '2026-07-02T00:00:00Z', endedAt: '2026-07-02T02:00:00Z'
      }),
      roiRow({
        title: '缺時間', lens: 'design', value: 7, goalResults: 'stuck',
        attemptsTotal: 2, successCount: 0
      })
    ])
    expect(summary).toContain('design：2 goals｜預估 value avg 6.0｜實際成本 2 attempts（0 成功；1 goal 未知）、2.0h（1 goal 未知）｜結果 achieved 1/no-progress 0/stuck 1')
  })
})

describe('listRecentCompleted 近期篩選', () => {
  test('只含有 goal_results+ended_at 的列，並依 ended_at 新→舊、limit 截斷', () => {
    const file = join(tempDir(), 'run.db')
    const ledger = new ProblemsLedger(file)
    const seeds = [
      { title: '舊完成', lens: 'tests', value: 5, end: '2026-07-01T00:00:00Z', result: 'achieved' as const },
      { title: '中完成', lens: 'perf', value: 6, end: '2026-07-02T00:00:00Z', result: 'stuck' as const },
      { title: '新完成', lens: 'design', value: 7, end: '2026-07-03T00:00:00Z', result: 'no-progress' as const }
    ]
    for (const s of seeds) {
      const fp = ledger.upsertSeen(s, s.end).row.fingerprint
      ledger.setRoi(fp, {
        goalResults: s.result, attemptsTotal: 1, successCount: 1,
        startedAt: s.end, endedAt: s.end
      })
    }
    // 未完成：有 seen 但無 ROI 終態
    ledger.upsertSeen({ title: '未完成', lens: 'security', value: 9 }, '2026-07-04T00:00:00Z')
    // 僅 started、尚無 ended/results → 不應入選
    const half = ledger.upsertSeen({ title: '進行中', lens: 'tests', value: 4 }, '2026-07-04T01:00:00Z').row.fingerprint
    ledger.setRoi(half, { startedAt: '2026-07-04T01:00:00Z' })

    const recent = ledger.listRecentCompleted(2)
    expect(recent.map(r => r.title)).toEqual(['新完成', '中完成'])
    expect(recent.every(r => r.goalResults && r.endedAt)).toBe(true)
    expect(ledger.listRecentCompleted().map(r => r.title)).toEqual(['新完成', '中完成', '舊完成'])
    ledger.close()
  })
})

describe('ProblemsLedger ROI 相容落盤', () => {
  test('近期完成 goals 依 lens 彙總預估 value、實際成本與結果', () => {
    const file = join(tempDir(), 'run.db')
    const ledger = new ProblemsLedger(file)
    const rows = [
      { title: '測試甲', lens: 'tests', value: 8, result: 'achieved', attempts: 2, successes: 2, start: '2026-07-02T00:00:00Z', end: '2026-07-02T01:00:00Z' },
      { title: '測試乙', lens: 'tests', value: 6, result: 'stuck', attempts: 4, successes: 1, start: '2026-07-03T00:00:00Z', end: '2026-07-03T02:00:00Z' },
      { title: '效能甲', lens: 'perf', value: 9, result: 'no-progress', attempts: 3, successes: 0, start: '2026-07-04T00:00:00Z', end: '2026-07-04T00:30:00Z' }
    ] as const
    for (const row of rows) {
      const fp = ledger.upsertSeen(row, row.start).row.fingerprint
      ledger.setRoi(fp, { goalResults: row.result, attemptsTotal: row.attempts, successCount: row.successes, startedAt: row.start, endedAt: row.end })
    }
    ledger.upsertSeen({ title: '尚未完成', lens: 'design', value: 10 }, '2026-07-05T00:00:00Z')
    ledger.close()

    const summary = readRecentGoalRoiSummary(file)
    expect(summary).toContain('tests：2 goals｜預估 value avg 7.0｜實際成本 6 attempts（3 成功）、3.0h｜結果 achieved 1/no-progress 0/stuck 1')
    expect(summary).toContain('perf：1 goals｜預估 value avg 9.0｜實際成本 3 attempts（0 成功）、0.5h｜結果 achieved 0/no-progress 1/stuck 0')
    expect(summary).not.toContain('design')
    expect(summary.length).toBeLessThanOrEqual(1500)
  })

  test('無 ROI 歷史或資料庫讀取失敗時摘要為空', () => {
    const file = join(tempDir(), 'run.db')
    const ledger = new ProblemsLedger(file)
    ledger.close()
    const corrupt = join(tempDir(), 'corrupt.db')
    writeFileSync(corrupt, 'not a sqlite database')
    expect(readRecentGoalRoiSummary(file)).toBe('')
    expect(readRecentGoalRoiSummary(join(tempDir(), 'missing.db'))).toBe('')
    expect(readRecentGoalRoiSummary(corrupt)).toBe('')
  })

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

  test('部分升級的 schema 只補缺欄，重開後不覆寫既有 ROI', () => {
    const file = oldLedgerFile()
    const db = new Database(file)
    db.exec('ALTER TABLE problems ADD COLUMN goal_results TEXT')
    db.prepare('UPDATE problems SET goal_results=?').run('stuck')
    db.close()

    const fp = problemFingerprint('舊問題')
    const ledger = new ProblemsLedger(file)
    expect(ledger.get(fp)).toMatchObject({ goalResults: 'stuck' })
    expect(ledger.setRoi(fp, { attemptsTotal: 3, successCount: 1 })).toBe(true)
    ledger.close()

    const reopened = new ProblemsLedger(file)
    expect(reopened.get(fp)).toMatchObject({ goalResults: 'stuck', attemptsTotal: 3, successCount: 1 })
    reopened.close()
  })

  test('遷移中途失敗時不留半套 schema，並保留舊台帳讀寫', () => {
    const file = oldLedgerFile()
    const exec = Database.prototype.exec
    let alters = 0
    const spy = vi.spyOn(Database.prototype, 'exec').mockImplementation(function (this: Database.Database, sql: string) {
      if (sql.startsWith('ALTER TABLE problems') && ++alters === 2) throw new Error('migration blocked')
      return exec.call(this, sql)
    })
    try {
      const ledger = new ProblemsLedger(file)
      expect(() => ledger.upsertSeen({ title: '新問題', lens: 'tests', value: 9 }, '2026-07-03T00:00:00Z')).not.toThrow()
      expect(ledger.listByStatus('open').map(row => row.title)).toEqual(['新問題', '舊問題'])
      expect(() => ledger.setRoi(problemFingerprint('舊問題'), { attemptsTotal: 1 })).not.toThrow()
      ledger.close()
    } finally { spy.mockRestore() }
    const db = new Database(file, { readonly: true })
    const columns = (db.prepare('PRAGMA table_info(problems)').all() as { name: string }[]).map(column => column.name)
    db.close()
    expect(columns).not.toEqual(expect.arrayContaining(['goal_results', 'attempts_total']))

    const recovered = new ProblemsLedger(file)
    expect(recovered.listByStatus('open').map(row => row.title)).toEqual(['新問題', '舊問題'])
    expect(recovered.setRoi(problemFingerprint('舊問題'), { attemptsTotal: 1 })).toBe(true)
    recovered.close()
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

  test.each(['achieved', 'no-progress', 'stuck'] as const)('%s session 結束依 goal_id 定位原 problem 並回寫完整 ROI', result => {
    const dir = tempDir(), file = join(dir, 'run.db'), backlog = join(dir, 'BACKLOG.md')
    writeFileSync(backlog, '- [x] 任務甲 <!-- adng:autopilot goal:g1 round:1 --> <!-- adng:done abc -->\n')
    const runDb = new RunDb(file)
    runDb.record({ taskId: taskId('任務甲'), ts: '2026-07-02T00:10:00Z', ok: true, costUsd: 0, detail: '' })
    runDb.close()
    const ledger = new ProblemsLedger(file)
    // 干擾列：其他 goal / 尚未綁定——回寫必須只命中 goal_id=g1 那一列
    const otherFp = ledger.upsertSeen({ title: '其他問題', lens: 'perf', value: 9 }, '2026-07-01T00:00:00Z').row.fingerprint
    ledger.setStatus(otherFp, 'in-progress', '', 'g2')
    const openFp = ledger.upsertSeen({ title: '未立案問題', lens: 'design', value: 5 }, '2026-07-01T00:00:00Z').row.fingerprint
    const fp = ledger.upsertSeen({ title: '問題', lens: 'tests', value: 8 }, '2026-07-01T00:00:00Z').row.fingerprint
    ledger.setStatus(fp, 'in-progress', '', 'g1')
    ledger.setRoi(fp, { startedAt: '2026-07-02T00:00:00Z' })
    ledger.close()

    expect(() => settleGoalRoi({
      events: new EventLog(dir), dbFile: file, backlogFile: backlog, goalId: 'g1', result,
      startedAt: '2026-07-01T00:00:00Z', endedAt: '2026-07-02T01:00:00Z'
    })).not.toThrow()

    const settled = new ProblemsLedger(file)
    expect(settled.findByGoalId('g1')?.fingerprint).toBe(fp)
    expect(settled.get(fp)).toMatchObject({
      goalResults: result, attemptsTotal: 1, successCount: 1,
      startedAt: '2026-07-02T00:00:00Z', endedAt: '2026-07-02T01:00:00Z'
    })
    expect(settled.get(otherFp)?.goalResults).toBeUndefined()
    expect(settled.get(openFp)?.goalResults).toBeUndefined()
    settled.close()
  })

  test('重複收案：同 problem 再次 settle 覆寫成本與結果且不拋錯', () => {
    const dir = tempDir(), file = join(dir, 'run.db'), backlog = join(dir, 'BACKLOG.md')
    writeFileSync(backlog, [
      '- [x] 首輪 <!-- adng:autopilot goal:g1 round:1 --> <!-- adng:done a1 -->',
      '- [x] 次輪甲 <!-- adng:autopilot goal:g1 round:2 --> <!-- adng:done a2 -->',
      '- [x] 次輪乙 <!-- adng:autopilot goal:g1 round:2 --> <!-- adng:done a3 -->'
    ].join('\n'))
    const runDb = new RunDb(file)
    runDb.record({ taskId: taskId('首輪'), ts: '2026-07-02T00:10:00Z', ok: true, costUsd: 0, detail: '' })
    runDb.record({ taskId: taskId('次輪甲'), ts: '2026-07-03T00:10:00Z', ok: true, costUsd: 0, detail: '' })
    runDb.record({ taskId: taskId('次輪乙'), ts: '2026-07-03T00:20:00Z', ok: false, costUsd: 0, detail: '' })
    runDb.close()

    const ledger = new ProblemsLedger(file)
    const fp = ledger.upsertSeen({ title: '問題', lens: 'tests', value: 8 }, '2026-07-01T00:00:00Z').row.fingerprint
    ledger.setStatus(fp, 'in-progress', '', 'g1')
    ledger.setRoi(fp, { startedAt: '2026-07-02T00:00:00Z' })

    // 首輪收案：achieved + 1 attempt
    settleProblemRoi({
      ledger, events: new EventLog(dir), dbFile: file, backlogFile: backlog,
      fingerprint: fp, goalId: 'g1', result: 'achieved',
      startedAt: '2026-07-02T00:00:00Z', endedAt: '2026-07-02T01:00:00Z'
    })
    expect(ledger.get(fp)).toMatchObject({
      goalResults: 'achieved', attemptsTotal: 1, successCount: 1,
      startedAt: '2026-07-02T00:00:00Z', endedAt: '2026-07-02T01:00:00Z'
    })

    // 重複收案（session settleGoalRoi + 再一次 fingerprint 路徑）：改寫為 stuck 與新時間窗成本
    expect(() => settleGoalRoi({
      events: new EventLog(dir), dbFile: file, backlogFile: backlog, goalId: 'g1', result: 'stuck',
      startedAt: '2026-07-03T00:00:00Z', endedAt: '2026-07-03T02:00:00Z'
    })).not.toThrow()
    settleProblemRoi({
      ledger, events: new EventLog(dir), dbFile: file, backlogFile: backlog,
      fingerprint: fp, goalId: 'g1', result: 'no-progress',
      startedAt: '2026-07-03T00:00:00Z', endedAt: '2026-07-03T02:00:00Z'
    })

    expect(ledger.findByGoalId('g1')?.fingerprint).toBe(fp)
    expect(ledger.get(fp)).toMatchObject({
      goalResults: 'no-progress', attemptsTotal: 2, successCount: 1,
      startedAt: '2026-07-03T00:00:00Z', endedAt: '2026-07-03T02:00:00Z'
    })
    ledger.close()
  })

  test('找不到對應 goal_id 時靜默略過', () => {
    const dir = tempDir(), file = join(dir, 'run.db')
    expect(() => settleGoalRoi({
      events: new EventLog(dir), dbFile: file, backlogFile: join(dir, 'missing.md'), goalId: 'missing', result: 'achieved',
      startedAt: START, endedAt: END.toISOString()
    })).not.toThrow()
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

describe('goal ROI 主流程', () => {
  test.each([
    ['achieved', 'fixed', { kind: 'achieved', rounds: 1 }],
    ['no-progress', 'deferred', { kind: 'no-progress', rounds: 1 }],
    ['stuck', 'deferred', { kind: 'stuck', rounds: 1, reason: '無法繼續' }]
  ] as const)('%s 結束後由 perpetual closeout 回寫 ROI 並轉為 %s', async (_kind, status, outcome) => {
    const dir = tempDir(), cfg = cycleCfg(dir), fp = problemFingerprint('ROI 問題')
    writeFileSync(cfg.backlogFile, '')
    writeFileSync(cfg.goalFile!, autoGoal(fp))
    const ledger = new ProblemsLedger(join(dir, 'run.db'))
    ledger.upsertSeen({ title: 'ROI 問題', lens: 'tests', value: 8 }, START)
    ledger.setStatus(fp, 'in-progress', '', 'g1')
    ledger.setRoi(fp, { startedAt: START })
    ledger.close()

    expect(await runPerpetualCycle(cfg, dir, new EventLog(dir), async () => true, cycleHooks(outcome))).toBe(true)

    const settled = new ProblemsLedger(join(dir, 'run.db'))
    expect(settled.get(fp)).toMatchObject({
      status, goalResults: outcome.kind, attemptsTotal: 0, successCount: 0,
      startedAt: START, endedAt: END.toISOString()
    })
    settled.close()
  })

  test('ledger 連線 I/O 失敗仍完成 discover→author→session', async () => {
    const dir = tempDir(), cfg = cycleCfg(dir), fp = problemFingerprint('無台帳問題')
    writeFileSync(cfg.backlogFile, '')
    const hooks = cycleHooks({ kind: 'achieved', rounds: 1 })
    hooks.discover = vi.fn(async () => ({
      survey: '', ranked: [{ title: '無台帳問題', lens: 'tests', value: 8, rationale: '值得修' }]
    }))
    hooks.author = vi.fn(async () => autoGoal(fp))
    const notify = vi.fn(async () => true)
    const ioFailure = vi.spyOn(Database.prototype, 'pragma').mockImplementation(() => { throw new Error('ledger I/O failed') })
    try {
      expect(await runPerpetualCycle(cfg, dir, new EventLog(dir), notify, hooks)).toBe(true)
      expect(hooks.author).toHaveBeenCalledTimes(1)
      expect(hooks.runSession).toHaveBeenCalledTimes(1)
      expect(notify).toHaveBeenCalledTimes(1)
    } finally { ioFailure.mockRestore() }
  })

  test('台帳 ROI 遷移失敗仍完成 discover→author→session', async () => {
    const dir = tempDir(), file = join(dir, 'run.db'), cfg = cycleCfg(dir), fp = problemFingerprint('遷移失敗問題')
    writeFileSync(cfg.backlogFile, '')
    const db = new Database(file)
    db.exec(`CREATE TABLE problems (
      id INTEGER PRIMARY KEY AUTOINCREMENT, fingerprint TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
      lens TEXT NOT NULL DEFAULT '', value INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'open',
      goal_id TEXT NOT NULL DEFAULT '', first_seen TEXT NOT NULL, last_seen TEXT NOT NULL, note TEXT NOT NULL DEFAULT ''
    )`)
    db.close()
    const hooks = cycleHooks({ kind: 'achieved', rounds: 1 })
    hooks.discover = vi.fn(async () => ({
      survey: '', ranked: [{ title: '遷移失敗問題', lens: 'tests', value: 8, rationale: '值得修' }]
    }))
    hooks.author = vi.fn(async () => autoGoal(fp))
    const exec = Database.prototype.exec
    const migrate = vi.spyOn(Database.prototype, 'exec').mockImplementation(function (this: Database.Database, sql: string) {
      if (sql.startsWith('ALTER TABLE problems')) throw new Error('migration blocked')
      return exec.call(this, sql)
    })

    try {
      expect(await runPerpetualCycle(cfg, dir, new EventLog(dir), async () => true, hooks)).toBe(true)
      expect(hooks.author).toHaveBeenCalledTimes(1)
      expect(hooks.runSession).toHaveBeenCalledTimes(1)
    } finally { migrate.mockRestore() }
  })

  test('ROI 寫入失敗仍完成 session、收案與通知', async () => {
    const dir = tempDir(), cfg = cycleCfg(dir), fp = problemFingerprint('ROI 問題')
    writeFileSync(cfg.backlogFile, '')
    writeFileSync(cfg.goalFile!, autoGoal(fp))
    const ledger = new ProblemsLedger(join(dir, 'run.db'))
    ledger.upsertSeen({ title: 'ROI 問題', lens: 'tests', value: 8 }, START)
    ledger.setStatus(fp, 'in-progress', '', 'g1')
    ledger.setRoi(fp, { startedAt: START })
    ledger.close()
    const hooks = cycleHooks({ kind: 'achieved', rounds: 1 })
    const notify = vi.fn(async () => true)
    const roiWrite = vi.spyOn(ProblemsLedger.prototype, 'setRoi').mockReturnValue(false)

    try {
      expect(await runPerpetualCycle(cfg, dir, new EventLog(dir), notify, hooks)).toBe(true)
      expect(hooks.runSession).toHaveBeenCalledTimes(1)
      expect(notify).toHaveBeenCalledTimes(1)
      expect(existsSync(cfg.goalFile!)).toBe(false)
    } finally { roiWrite.mockRestore() }

    const settled = new ProblemsLedger(join(dir, 'run.db'))
    expect(settled.get(fp)).toMatchObject({ status: 'fixed' })
    expect(settled.get(fp)?.goalResults).toBeUndefined()
    settled.close()
    const eventTypes = readFileSync(join(dir, 'events.jsonl'), 'utf8').split('\n').filter(Boolean)
      .map(line => (JSON.parse(line) as { type: string }).type)
    expect(eventTypes).toContain('perpetual-roi-write-failed')
    expect(eventTypes).toContain('perpetual-session-done')
  })

  test('重複收案：已寫 ROI 的 auto-goal 再跑 closeout 可覆寫終態', async () => {
    const dir = tempDir(), cfg = cycleCfg(dir), fp = problemFingerprint('ROI 問題')
    // goalId = sha1('修復 ROI 問題').slice(0,4) —— 與 residual closeout 的 goalIdOf(objective) 對齊
    const goalId = 'fdea'
    writeFileSync(cfg.backlogFile, `- [x] 重跑任務 <!-- adng:autopilot goal:${goalId} round:1 --> <!-- adng:done z9 -->\n`)
    writeFileSync(cfg.goalFile!, autoGoal(fp))
    const runDb = new RunDb(join(dir, 'run.db'))
    runDb.record({ taskId: taskId('重跑任務'), ts: '2026-07-02T00:30:00Z', ok: true, costUsd: 0, detail: '' })
    runDb.close()

    const ledger = new ProblemsLedger(join(dir, 'run.db'))
    ledger.upsertSeen({ title: 'ROI 問題', lens: 'tests', value: 8 }, START)
    ledger.setStatus(fp, 'deferred', 'no-progress 首輪', goalId)
    // 首輪已收案 ROI
    ledger.setRoi(fp, {
      goalResults: 'no-progress', attemptsTotal: 0, successCount: 0,
      startedAt: START, endedAt: '2026-07-02T00:15:00.000Z'
    })
    ledger.close()

    // 殘留 auto-goal 再跑，終態改 stuck 並重算成本
    expect(await runPerpetualCycle(
      cfg, dir, new EventLog(dir), async () => true,
      cycleHooks({ kind: 'stuck', rounds: 2, reason: '缺依賴' })
    )).toBe(true)

    const settled = new ProblemsLedger(join(dir, 'run.db'))
    expect(settled.get(fp)).toMatchObject({
      status: 'deferred',
      goalResults: 'stuck',
      attemptsTotal: 1,
      successCount: 1,
      startedAt: START,
      endedAt: END.toISOString()
    })
    settled.close()
    expect(existsSync(cfg.goalFile!)).toBe(false)
  })
})

describe('critic ROI 回饋主流程', () => {
  test('prompt 內容：含 ROI 硬約束、lens 彙總欄位，且空白歷史不附加段落', () => {
    const withRoi = criticPrompt(
      [{ lens: 'tests', title: '候選', detail: '理由' }],
      '可靠度優先',
      '- tests：1 goals｜預估 value avg 8.0｜實際成本 2 attempts（1 成功）、1.0h｜結果 achieved 1/no-progress 0/stuck 0'
    )
    expect(withRoi).toContain('【硬約束】依近期 ROI 史實調整候選排序')
    expect(withRoi).toContain('# 近期已完成 goal ROI')
    expect(withRoi).toContain('預估 value avg 8.0')
    expect(withRoi).toContain('實際成本 2 attempts（1 成功）')
    expect(withRoi).toContain('結果 achieved 1/no-progress 0/stuck 0')

    const empty = criticPrompt([{ lens: 'tests', title: '候選', detail: '理由' }], '可靠度優先', '')
    expect(empty).not.toContain('近期已完成 goal ROI')
    expect(empty).not.toContain('依近期 ROI 史實調整候選排序')
  })

  test('critic prompt 帶入近期 ROI 摘要', async () => {
    const dir = tempDir(), file = join(dir, 'run.db')
    const ledger = new ProblemsLedger(file)
    const fp = ledger.upsertSeen({ title: '歷史問題', lens: 'tests', value: 8 }, START).row.fingerprint
    ledger.setRoi(fp, {
      goalResults: 'achieved', attemptsTotal: 2, successCount: 1,
      startedAt: START, endedAt: END.toISOString()
    })
    ledger.close()
    const prompts: string[] = []

    const result = await discoverProblems({
      finderLlm: llm('新問題｜回歸缺口'),
      criticLlm: llm('VALUE:8 | 新問題 | tests | ROI 穩定', prompts),
      readRoiSummary: () => readRecentGoalRoiSummary(file), lenses: ['tests']
    }, { objective: '持續改善', noProgressLimit: 2, evidenceFiles: [] }, dir)

    expect(result.ranked[0]?.title).toBe('新問題')
    expect(prompts[0]).toContain('# 近期已完成 goal ROI')
    expect(prompts[0]).toContain('tests：1 goals｜預估 value avg 8.0｜實際成本 2 attempts（1 成功）、1.0h')
  })

  test('無歷史資料時不注入 ROI 段落且 discovery 正常完成', async () => {
    const prompts: string[] = []
    const dir = tempDir(), file = join(dir, 'empty-run.db')
    new ProblemsLedger(file).close()
    const result = await discoverProblems({
      finderLlm: llm('新問題｜回歸缺口'),
      criticLlm: llm('VALUE:7 | 新問題 | tests | 可處理', prompts),
      readRoiSummary: () => readRecentGoalRoiSummary(file), lenses: ['tests']
    }, { objective: '持續改善', noProgressLimit: 2, evidenceFiles: [] }, dir)

    expect(result.ranked[0]?.title).toBe('新問題')
    expect(prompts[0]).not.toContain('近期已完成 goal ROI')
  })

  test('ROI 摘要 I/O 失敗時略過摘要且 discovery 正常完成', async () => {
    const prompts: string[] = []
    const result = await discoverProblems({
      finderLlm: llm('新問題｜回歸缺口'),
      criticLlm: llm('VALUE:7 | 新問題 | tests | 可處理', prompts),
      readRoiSummary: () => { throw new Error('summary I/O failed') }, lenses: ['tests']
    }, { objective: '持續改善', noProgressLimit: 2, evidenceFiles: [] }, tempDir())

    expect(result.ranked[0]?.title).toBe('新問題')
    expect(prompts[0]).not.toContain('近期已完成 goal ROI')
  })

  test('台帳 ROI 摘要讀取失敗時 discovery 仍正常完成', async () => {
    const prompts: string[] = []
    const file = join(tempDir(), 'run.db')
    new ProblemsLedger(file).close()
    const readFailure = vi.spyOn(ProblemsLedger.prototype, 'listRecentCompleted').mockImplementation(() => {
      throw new Error('ROI summary read failed')
    })

    try {
      const result = await discoverProblems({
        finderLlm: llm('新問題｜回歸缺口'),
        criticLlm: llm('VALUE:7 | 新問題 | tests | 可處理', prompts),
        readRoiSummary: () => readRecentGoalRoiSummary(file), lenses: ['tests']
      }, { objective: '持續改善', noProgressLimit: 2, evidenceFiles: [] }, tempDir())

      expect(result.ranked[0]?.title).toBe('新問題')
      expect(prompts[0]).not.toContain('近期已完成 goal ROI')
    } finally { readFailure.mockRestore() }
  })
})
