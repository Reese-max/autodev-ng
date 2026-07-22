import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { RunDb } from '../src/db.js'
import { clearRunStatsCache, recentRunStats } from '../src/engines/run-stats.js'
import {
  DEFAULT_FIXED_CLOCK_ISO,
  FIXTURE_IO_TIMEOUT_MS,
  applyEnv,
  beginRoutingFixtureIsolation,
  createIsolatedRecentRunStats,
  createIsolatedWorkspace,
  snapshotEnv,
} from '../src/engines/test-isolation.js'

afterEach(() => {
  clearRunStatsCache()
})

describe('createIsolatedWorkspace', () => {
  test('每呼叫產生獨立 root/tmp，dispose 後目錄消失', () => {
    const a = createIsolatedWorkspace('adng-iso-a-')
    const b = createIsolatedWorkspace('adng-iso-b-')
    try {
      expect(a.root).not.toBe(b.root)
      expect(existsSync(a.root)).toBe(true)
      expect(existsSync(a.tmp)).toBe(true)
      expect(existsSync(b.tmp)).toBe(true)
      writeFileSync(join(a.root, 'marker.txt'), 'x')
      expect(existsSync(join(a.root, 'marker.txt'))).toBe(true)
    } finally {
      a.dispose()
      b.dispose()
    }
    expect(existsSync(a.root)).toBe(false)
    expect(existsSync(b.root)).toBe(false)
  })
})

describe('snapshotEnv / applyEnv', () => {
  test('還原已變更與已刪除的鍵，不殘留測試 env', () => {
    const key = 'ADNG_TEST_ISO_ENV_ONLY'
    delete process.env[key]
    const snap = snapshotEnv([key])
    applyEnv({ [key]: 'set-by-test' })
    expect(process.env[key]).toBe('set-by-test')
    snap.restore()
    expect(process.env[key]).toBeUndefined()

    process.env[key] = 'prior'
    const snap2 = snapshotEnv([key])
    applyEnv({ [key]: undefined })
    expect(process.env[key]).toBeUndefined()
    snap2.restore()
    expect(process.env[key]).toBe('prior')
    delete process.env[key]
  })
})

describe('beginRoutingFixtureIsolation', () => {
  test('清空快取、巢狀 TMP、固定時鐘 env；dispose 還原且刪工作區', () => {
    const priorTmp = process.env.TMPDIR
    const priorTemp = process.env.TEMP
    const priorTmpShort = process.env.TMP
    const priorClock = process.env.ADNG_FIXED_CLOCK_ISO
    // 在 begin 前刻意污染：dispose 應還原到 begin 當下的值（stale-clock），不是更早的 prior
    process.env.ADNG_FIXED_CLOCK_ISO = 'stale-clock'
    const poisonDir = createIsolatedWorkspace('adng-iso-poison-')
    try {
      const dbFile = join(poisonDir.root, 'run.db')
      const db = new RunDb(dbFile)
      db.record({
        taskId: 'p',
        ok: true,
        costUsd: 0,
        detail: '',
        engine: 'qwen',
        ts: '2026-07-20T01:00:00.000Z',
      })
      db.close()
      expect(recentRunStats(dbFile, { nowIso: DEFAULT_FIXED_CLOCK_ISO }).kind).toBe('stats')

      const fx = beginRoutingFixtureIsolation({
        prefix: 'adng-iso-fx-',
        nowIso: DEFAULT_FIXED_CLOCK_ISO,
        env: { ADNG_TEST_ISO_EXTRA: '1' },
      })
      try {
        expect(fx.root).not.toBe(poisonDir.root)
        expect(fx.nowMs).toBe(Date.parse(DEFAULT_FIXED_CLOCK_ISO))
        expect(fx.timeoutMs).toBe(FIXTURE_IO_TIMEOUT_MS)
        expect(process.env.ADNG_FIXED_CLOCK_ISO).toBe(DEFAULT_FIXED_CLOCK_ISO)
        expect(process.env.TMPDIR).toBe(fx.tmp)
        expect(process.env.TEMP).toBe(fx.tmp)
        expect(process.env.TMP).toBe(fx.tmp)
        expect(process.env.ADNG_TEST_ISO_EXTRA).toBe('1')
        expect(typeof fx.recentRunStats).toBe('function')
        mkdirSync(join(fx.root, 'data'), { recursive: true })
      } finally {
        const root = fx.root
        fx.dispose()
        fx.dispose() // 冪等
        expect(existsSync(root)).toBe(false)
      }
      // dispose 還原 begin 當下 snapshot（含 stale-clock），並還原巢狀前的 TMP*
      expect(process.env.ADNG_FIXED_CLOCK_ISO).toBe('stale-clock')
      if (priorTmp === undefined) expect(process.env.TMPDIR).toBeUndefined()
      else expect(process.env.TMPDIR).toBe(priorTmp)
      if (priorTemp === undefined) expect(process.env.TEMP).toBeUndefined()
      else expect(process.env.TEMP).toBe(priorTemp)
      if (priorTmpShort === undefined) expect(process.env.TMP).toBeUndefined()
      else expect(process.env.TMP).toBe(priorTmpShort)
      expect(process.env.ADNG_TEST_ISO_EXTRA).toBeUndefined()
    } finally {
      poisonDir.dispose()
      if (priorTmp === undefined) delete process.env.TMPDIR
      else process.env.TMPDIR = priorTmp
      if (priorTemp === undefined) delete process.env.TEMP
      else process.env.TEMP = priorTemp
      if (priorTmpShort === undefined) delete process.env.TMP
      else process.env.TMP = priorTmpShort
      if (priorClock === undefined) delete process.env.ADNG_FIXED_CLOCK_ISO
      else process.env.ADNG_FIXED_CLOCK_ISO = priorClock
      delete process.env.ADNG_TEST_ISO_EXTRA
      clearRunStatsCache()
    }
  })

  test('isolated recentRunStats：暖快取後刪檔仍命中，且不依賴生產 50ms', () => {
    const fx = beginRoutingFixtureIsolation({ nowIso: DEFAULT_FIXED_CLOCK_ISO })
    try {
      const dbFile = join(fx.root, 'run.db')
      const db = new RunDb(dbFile)
      for (let i = 0; i < 3; i++) {
        db.record({
          taskId: `t${i}`,
          ok: i === 0,
          costUsd: 0.1,
          detail: '',
          engine: 'qwen',
          ts: `2026-07-2${i}T01:00:00.000Z`,
        })
      }
      db.close()

      const first = fx.recentRunStats(dbFile)
      expect(first.kind).toBe('stats')
      rmSync(dbFile, { force: true })
      const second = fx.recentRunStats(dbFile)
      expect(second).toEqual(first)
    } finally {
      fx.dispose()
    }
  })
})

describe('createIsolatedRecentRunStats', () => {
  test('顯式 nowMs／timeoutMs 覆寫呼叫端未指定值', () => {
    const nowIso = DEFAULT_FIXED_CLOCK_ISO
    const nowMs = Date.parse(nowIso)
    const reader = createIsolatedRecentRunStats({ nowIso, nowMs, timeoutMs: 2_000 })
    const ws = createIsolatedWorkspace('adng-iso-stats-')
    try {
      const dbFile = join(ws.root, 'run.db')
      const db = new RunDb(dbFile)
      db.record({
        taskId: 'a',
        ok: true,
        costUsd: 0.1,
        detail: '',
        engine: 'codex',
        ts: '2026-07-20T02:00:00.000Z',
      })
      db.close()
      const result = reader(dbFile)
      expect(result.kind).toBe('stats')
    } finally {
      ws.dispose()
      clearRunStatsCache()
    }
  })
})
