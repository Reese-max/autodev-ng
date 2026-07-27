import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ProblemsLedger, problemFingerprint } from '../src/autopilot/ledger.js'

describe('ProblemsLedger', () => {
  let dir: string; let ledger: ProblemsLedger
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'adng-ledger-')); ledger = new ProblemsLedger(join(dir, 'run.db')) })
  afterEach(() => { ledger.close(); rmSync(dir, { recursive: true, force: true }) })

  test('fingerprint 正規化：NFKC＋小寫＋去空白標點——等價標題同指紋', () => {
    expect(problemFingerprint('API 缺 錯誤處理！')).toBe(problemFingerprint('api缺錯誤處理'))
    expect(problemFingerprint('ＡＰＩ缺錯誤處理')).toBe(problemFingerprint('api缺錯誤處理')) // 全形 NFKC
    expect(problemFingerprint('a')).not.toBe(problemFingerprint('b'))
  })

  test('upsertSeen：新問題 INSERT status=open；重複發現只更新 lastSeen/value', () => {
    const a = ledger.upsertSeen({ title: 'X 未測', lens: 'tests', value: 7 }, '2026-07-13T00:00:00Z')
    expect(a.isNew).toBe(true); expect(a.row.status).toBe('open'); expect(a.row.firstSeen).toBe('2026-07-13T00:00:00Z')
    const b = ledger.upsertSeen({ title: 'x未測！', lens: 'perf', value: 9 }, '2026-07-14T00:00:00Z') // 等價標題
    expect(b.isNew).toBe(false); expect(b.row.value).toBe(9)
    expect(b.row.firstSeen).toBe('2026-07-13T00:00:00Z'); expect(b.row.lastSeen).toBe('2026-07-14T00:00:00Z')
    expect(b.row.lens).toBe('tests') // lens 保留首見值（不入指紋、不覆寫）
  })

  test('setStatus/listByStatus/counts：狀態機與查詢', () => {
    ledger.upsertSeen({ title: 'p1', lens: 'tests', value: 5 }, '2026-07-13T00:00:00Z')
    ledger.upsertSeen({ title: 'p2', lens: 'correctness', value: 8 }, '2026-07-13T00:00:00Z')
    ledger.setStatus(problemFingerprint('p2'), 'fixed', 'goal 達成', 'ab12')
    const open = ledger.listByStatus('open')
    expect(open.map(r => r.title)).toEqual(['p1'])
    const fixed = ledger.listByStatus('fixed')
    expect(fixed[0]!.goalId).toBe('ab12'); expect(fixed[0]!.note).toBe('goal 達成')
    expect(ledger.counts()).toEqual({ open: 1, fixed: 1 })
  })

  test('冪等重開：同檔開兩次不炸，資料仍在', () => {
    ledger.upsertSeen({ title: 'p1', lens: 'tests', value: 5 }, '2026-07-13T00:00:00Z')
    ledger.close()
    ledger = new ProblemsLedger(join(dir, 'run.db'))
    expect(ledger.listByStatus('open')).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// readHandledProblemTitles（2026-07-27）：critic 語意去重的記憶來源
// ---------------------------------------------------------------------------

test('readHandledProblemTitles：只回已處理狀態、last_seen DESC、limit 生效；缺檔回 []', async () => {
  const { mkdtempSync, rmSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const { ProblemsLedger, readHandledProblemTitles, problemFingerprint } = await import('../src/autopilot/ledger.js')
  const dir = mkdtempSync(join(tmpdir(), 'adng-handled-'))
  try {
    const dbFile = join(dir, 'run.db')
    const led = new ProblemsLedger(dbFile)
    led.upsertSeen({ title: '還開著的問題', lens: 'tests', value: 5 }, '2026-07-20T00:00:00Z')
    led.upsertSeen({ title: '修好的問題', lens: 'tests', value: 5 }, '2026-07-21T00:00:00Z')
    led.setStatus(problemFingerprint('修好的問題'), 'fixed', '')
    led.upsertSeen({ title: '卡住的問題', lens: 'tests', value: 5 }, '2026-07-22T00:00:00Z')
    led.setStatus(problemFingerprint('卡住的問題'), 'deferred', 'stuck')
    led.close()
    const titles = readHandledProblemTitles(dbFile)
    expect(titles).toContain('修好的問題')
    expect(titles).toContain('卡住的問題')
    expect(titles).not.toContain('還開著的問題')
    expect(readHandledProblemTitles(dbFile, 1)).toHaveLength(1)
    expect(readHandledProblemTitles(join(dir, 'no.db'))).toEqual([])
  } finally {
    // Windows 上 WAL 殘留 handle 偶發 EPERM：cleanup 失敗不掛測試，temp 目錄交給 OS 清
    try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ }
  }
})
