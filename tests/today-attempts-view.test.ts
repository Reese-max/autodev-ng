import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { RunDb } from '../src/db.js'
import {
  digestQuotaLines,
  formatTodayQuotaTable,
  loadTodayAttemptsMap,
  remainingQuota,
  toTodayAttemptsMap,
  todayAttemptsMapFromSummary,
} from '../src/engines/today-attempts-view.js'
import type { TodayAttemptsSummary } from '../src/engines/today-attempts.js'

describe('toTodayAttemptsMap', () => {
  test('attempts 列轉 { engine: { n, ok, cap? } }；有 cap 才附 cap', () => {
    const map = toTodayAttemptsMap(
      [
        { engine: 'qwen', n: 3, ok: 1 },
        { engine: 'codex', n: 1, ok: 0 },
      ],
      new Map([['qwen', 12]]),
    )
    expect(map).toEqual({
      qwen: { n: 3, ok: 1, cap: 12 },
      codex: { n: 1, ok: 0 },
    })
  })

  test('僅有 cap、無 attempts 的引擎也入表（n=0/ok=0）', () => {
    const map = toTodayAttemptsMap([], new Map([['free', 5]]))
    expect(map).toEqual({ free: { n: 0, ok: 0, cap: 5 } })
  })

  test('空列＋無 cap → 空物件', () => {
    expect(toTodayAttemptsMap([])).toEqual({})
    expect(toTodayAttemptsMap([], new Map())).toEqual({})
  })

  test('略過空 engine 名', () => {
    expect(toTodayAttemptsMap([{ engine: '', n: 1, ok: 1 }])).toEqual({})
  })
})

describe('todayAttemptsMapFromSummary', () => {
  test('summary.engines.attempts → map.n', () => {
    const summary: TodayAttemptsSummary = {
      day: '2026-07-21',
      engines: [{ engine: 'qwen', attempts: 2, ok: 1 }],
      totalAttempts: 2,
      totalOk: 1,
    }
    expect(todayAttemptsMapFromSummary(summary, new Map([['qwen', 10]]))).toEqual({
      qwen: { n: 2, ok: 1, cap: 10 },
    })
  })

  test('null／undefined summary → 僅 cap 列或空', () => {
    expect(todayAttemptsMapFromSummary(null)).toEqual({})
    expect(todayAttemptsMapFromSummary(undefined, new Map([['a', 1]]))).toEqual({
      a: { n: 0, ok: 0, cap: 1 },
    })
  })
})

describe('remainingQuota', () => {
  test('有 cap → max(0, cap-n)；無 cap → null', () => {
    expect(remainingQuota(3, 12)).toBe(9)
    expect(remainingQuota(12, 12)).toBe(0)
    expect(remainingQuota(15, 12)).toBe(0)
    expect(remainingQuota(3, undefined)).toBeNull()
    expect(remainingQuota(3, 0)).toBeNull()
  })
})

describe('formatTodayQuotaTable', () => {
  test('產出標題與表頭、含 cap／餘量', () => {
    const lines = formatTodayQuotaTable({
      qwen: { n: 3, ok: 1, cap: 12 },
      codex: { n: 1, ok: 0 },
    })
    expect(lines[0]).toBe('今日額度消耗')
    expect(lines[1]).toBe('引擎｜次數｜成功｜cap｜餘量')
    expect(lines).toContain('qwen｜3｜1｜12｜9')
    expect(lines).toContain('codex｜1｜0｜—｜—')
  })

  test('次數 DESC 排序', () => {
    const lines = formatTodayQuotaTable({
      a: { n: 1, ok: 0 },
      b: { n: 5, ok: 2, cap: 10 },
    })
    expect(lines[2]).toBe('b｜5｜2｜10｜5')
    expect(lines[3]).toBe('a｜1｜0｜—｜—')
  })

  test('空 map → 空陣列（不印雜訊）', () => {
    expect(formatTodayQuotaTable({})).toEqual([])
  })
})

describe('loadTodayAttemptsMap', () => {
  test('缺 run.db → 僅回 cap 列或空（fail-open）', () => {
    const dir = mkdtempSync(join(tmpdir(), 'adng-tav-miss-'))
    expect(loadTodayAttemptsMap(dir, undefined, { nowIso: '2026-07-21T12:00:00.000Z' })).toEqual({})
    expect(
      loadTodayAttemptsMap(dir, { free: { dailyAttemptCap: 4 } }, { nowIso: '2026-07-21T12:00:00.000Z' }),
    ).toEqual({ free: { n: 0, ok: 0, cap: 4 } })
  })

  test('有 attempts 與 cap → 合併為 heartbeat 形狀', () => {
    const dir = mkdtempSync(join(tmpdir(), 'adng-tav-ok-'))
    const f = join(dir, 'run.db')
    const db = new RunDb(f)
    db.record({
      taskId: 't1',
      ok: true,
      costUsd: 0,
      detail: '',
      engine: 'qwen',
      ts: '2026-07-21T01:00:00.000Z',
    })
    db.record({
      taskId: 't2',
      ok: false,
      costUsd: 0,
      detail: '',
      engine: 'qwen',
      ts: '2026-07-21T02:00:00.000Z',
    })
    db.close()

    const map = loadTodayAttemptsMap(
      dir,
      { qwen: { dailyAttemptCap: 10 }, idle: { dailyAttemptCap: 3 } },
      { nowIso: '2026-07-21T12:00:00.000Z', dbFile: f },
    )
    expect(map).toEqual({
      qwen: { n: 2, ok: 1, cap: 10 },
      idle: { n: 0, ok: 0, cap: 3 },
    })
  })

  test('summaryFn 注入失敗／壞檔 → 空或僅 cap', () => {
    const dir = mkdtempSync(join(tmpdir(), 'adng-tav-bad-'))
    writeFileSync(join(dir, 'run.db'), 'not-db')
    expect(
      loadTodayAttemptsMap(dir, undefined, { nowIso: '2026-07-21T12:00:00.000Z' }),
    ).toEqual({})
  })
})

describe('digestQuotaLines', () => {
  test('合併 engineDayStats 與 cap → 表行', () => {
    const lines = digestQuotaLines(
      [
        { engine: 'qwen', n: 2, ok: 1 },
        { engine: 'codex', n: 1, ok: 1 },
      ],
      { qwen: { dailyAttemptCap: 10 }, idle: { dailyAttemptCap: 3 } },
    )
    expect(lines[0]).toBe('今日額度消耗')
    expect(lines).toContain('qwen｜2｜1｜10｜8')
    expect(lines).toContain('codex｜1｜1｜—｜—')
    expect(lines).toContain('idle｜0｜0｜3｜3')
  })

  test('無列且無 cap → []', () => {
    expect(digestQuotaLines([])).toEqual([])
  })
})
