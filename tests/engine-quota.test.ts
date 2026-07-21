import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { RunDb } from '../src/db.js'
import { buildDigest } from '../src/digest.js'
import { loadDailyAttemptCapContext } from '../src/engines/daily-attempt-cap-gate.js'
import { writeHeartbeat } from '../src/engines/heartbeat-write.js'
import { pickCandidateTags } from '../src/engines/pick-candidates.js'
import { todayAttemptsSummary } from '../src/engines/today-attempts.js'
import { EventLog } from '../src/events.js'
import { EngineConfigSchema } from '../src/types.js'

const NOW = '2026-07-21T12:00:00.000Z'

function freshDataDir(): string {
  return mkdtempSync(join(tmpdir(), 'adng-engine-quota-'))
}

afterEach(() => {
  vi.useRealTimers()
})

describe('engine quota', () => {
  test('今日聚合依 UTC 半開日界統計各引擎 attempts 與成功數', () => {
    const dbFile = join(freshDataDir(), 'run.db')
    const db = new RunDb(dbFile)
    for (const [taskId, engine, ok, ts] of [
      ['yesterday', 'free', true, '2026-07-20T23:59:59.999Z'],
      ['free-ok', 'free', true, '2026-07-21T00:00:00.000Z'],
      ['free-fail', 'free', false, '2026-07-21T11:00:00.000Z'],
      ['paid-ok', 'paid', true, '2026-07-21T23:59:59.999Z'],
      ['tomorrow', 'paid', true, '2026-07-22T00:00:00.000Z'],
    ] as const) {
      db.record({ taskId, engine, ok, ts, costUsd: 0, detail: '' })
    }
    db.close()

    expect(todayAttemptsSummary(dbFile, { nowIso: NOW })).toEqual({
      day: '2026-07-21',
      engines: [
        { engine: 'free', attempts: 2, ok: 1 },
        { engine: 'paid', attempts: 1, ok: 1 },
      ],
      totalAttempts: 3,
      totalOk: 2,
    })
  })

  test('dailyAttemptCap 僅接受未設定或正整數', () => {
    expect(EngineConfigSchema.safeParse({ adapter: 'mock' }).success).toBe(true)
    expect(EngineConfigSchema.safeParse({ adapter: 'mock', dailyAttemptCap: 3 }).success).toBe(true)
    for (const dailyAttemptCap of [0, -1, 1.5]) {
      expect(EngineConfigSchema.safeParse({ adapter: 'mock', dailyAttemptCap }).success).toBe(false)
    }
  })

  test('候選今日已達 cap 時跳過並使用下一檔', () => {
    const dataDir = freshDataDir()
    const dbFile = join(dataDir, 'run.db')
    const db = new RunDb(dbFile)
    db.record({ taskId: 'a', engine: 'free', ok: true, ts: NOW, costUsd: 0, detail: '' })
    db.record({ taskId: 'b', engine: 'free', ok: false, ts: NOW, costUsd: 0, detail: '' })
    db.close()

    const quota = loadDailyAttemptCapContext(
      { free: { dailyAttemptCap: 2 }, paid: { dailyAttemptCap: 10 } },
      dataDir,
      { dbFile, nowIso: NOW },
    )
    expect(pickCandidateTags({
      rotation: ['free', 'paid'],
      defaultEngine: 'free',
      task: { id: '0' },
      failCount: 0,
      ...quota,
    })).toEqual(['paid'])
  })

  test('run.db 讀取失敗時 fail-open 保留原候選', () => {
    const dataDir = freshDataDir()
    const dbFile = join(dataDir, 'run.db')
    writeFileSync(dbFile, 'not sqlite')

    const quota = loadDailyAttemptCapContext(
      { free: { dailyAttemptCap: 1 }, paid: { dailyAttemptCap: 1 } },
      dataDir,
      { dbFile, nowIso: NOW },
    )
    expect(quota.todayAttemptCounts.size).toBe(0)
    expect(pickCandidateTags({
      rotation: ['free', 'paid'],
      defaultEngine: 'free',
      task: { id: '0' },
      failCount: 0,
      ...quota,
    })).toEqual(['free', 'paid'])
  })

  test('heartbeat 與 digest 輸出固定 quota 欄位與表格格式', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(NOW))
    const dataDir = freshDataDir()
    const db = new RunDb(join(dataDir, 'run.db'))
    db.record({ taskId: 'a', engine: 'free', ok: true, ts: NOW, costUsd: 0, detail: '' })
    db.record({ taskId: 'b', engine: 'free', ok: false, ts: NOW, costUsd: 0, detail: '' })
    db.record({ taskId: 'c', engine: 'paid', ok: true, ts: NOW, costUsd: 0, detail: '' })
    const engines = {
      free: { adapter: 'mock' as const, dailyAttemptCap: 3 },
      paid: { adapter: 'mock' as const, dailyAttemptCap: undefined },
      idle: { adapter: 'mock' as const, dailyAttemptCap: 4 },
    }

    writeHeartbeat(new EventLog(dataDir), { dataDir, engines }, {
      state: 'idle',
      todayCostUsd: 1.25,
    })
    const heartbeat = JSON.parse(readFileSync(join(dataDir, 'heartbeat.json'), 'utf8'))
    expect(heartbeat).toEqual({
      ts: NOW,
      state: 'idle',
      todayCostUsd: 1.25,
      todayAttempts: {
        free: { n: 2, ok: 1, cap: 3 },
        paid: { n: 1, ok: 1 },
        idle: { n: 0, ok: 0, cap: 4 },
      },
    })

    const digest = buildDigest({
      db,
      dataDir,
      isoDayUtc: '2026-07-21',
      offsetHours: 0,
      engines,
    }).split('\n')
    const quotaStart = digest.indexOf('今日額度消耗')
    expect(digest.slice(quotaStart, quotaStart + 5)).toEqual([
      '今日額度消耗',
      '引擎｜次數｜成功｜cap｜餘量',
      'free｜2｜1｜3｜1',
      'paid｜1｜1｜—｜—',
      'idle｜0｜0｜4｜4',
    ])
    db.close()
  })
})
