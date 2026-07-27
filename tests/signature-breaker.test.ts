import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test } from 'vitest'
import { RunDb } from '../src/db.js'
import {
  BREAKER_MIN_CONSECUTIVE,
  detailSignature,
  loadRecentBreakerRows,
  selectBreakerTargets,
  type BreakerAttemptRow,
} from '../src/engines/signature-breaker.js'

const SIG = "exit 1: 'codex' 不是內部或外部命令、可執行的程式或批次檔。"
const dirs: string[] = []

afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

function tmpDir(): string {
  const d = mkdtempSync(join(tmpdir(), 'adng-breaker-'))
  dirs.push(d)
  return d
}

/** rows 契約：seq DESC（最新在前）。 */
function fails(engine: string, n: number, detail = SIG): BreakerAttemptRow[] {
  return Array.from({ length: n }, () => ({ engine, ok: 0, detail }))
}

test('detailSignature：取首行、trim、80 字上限', () => {
  expect(detailSignature('  timeout  \n第二行不算')).toBe('timeout')
  expect(detailSignature('x'.repeat(200))).toHaveLength(80)
  expect(detailSignature('')).toBe('')
})

test(`連續 ${BREAKER_MIN_CONSECUTIVE} 次相同簽名失敗 → 熔斷 target（reason 帶簽名）`, () => {
  const targets = selectBreakerTargets(fails('codex', BREAKER_MIN_CONSECUTIVE), ['codex'])
  expect(targets).toHaveLength(1)
  expect(targets[0]!.engine).toBe('codex')
  expect(targets[0]!.sampleCount).toBe(BREAKER_MIN_CONSECUTIVE)
  expect(targets[0]!.successRate).toBe(0)
  expect(targets[0]!.reason).toContain('簽名熔斷')
  expect(targets[0]!.reason).toContain(detailSignature(SIG))
})

test('只有 4 次連續同簽名 → 不熔斷', () => {
  expect(selectBreakerTargets(fails('codex', BREAKER_MIN_CONSECUTIVE - 1), ['codex'])).toHaveLength(0)
})

test('最新一筆成功 → leading run 斷、不熔斷（歷史連敗不翻舊帳）', () => {
  const rows: BreakerAttemptRow[] = [{ engine: 'codex', ok: 1, detail: '' }, ...fails('codex', 9)]
  expect(selectBreakerTargets(rows, ['codex'])).toHaveLength(0)
})

test('連續失敗但簽名不同（模型自身弱）→ 不熔斷', () => {
  const rows: BreakerAttemptRow[] = [
    { engine: 'oc', ok: 0, detail: 'no-commit(phantom completion?)' },
    { engine: 'oc', ok: 0, detail: 'timeout' },
    { engine: 'oc', ok: 0, detail: 'judge-mismatch: MISMATCH' },
    { engine: 'oc', ok: 0, detail: 'no-commit(phantom completion?)' },
    { engine: 'oc', ok: 0, detail: 'timeout' },
  ]
  expect(selectBreakerTargets(rows, ['oc'])).toHaveLength(0)
})

test('rotation 外引擎不評估', () => {
  expect(selectBreakerTargets(fails('codex', 8), ['grok'])).toHaveLength(0)
})

test('多引擎交錯 rows 正確分組（各自算 leading run）', () => {
  const rows: BreakerAttemptRow[] = []
  for (let i = 0; i < 5; i++) {
    rows.push({ engine: 'codex', ok: 0, detail: SIG })
    rows.push({ engine: 'grok', ok: i === 0 ? 1 : 0, detail: 'timeout' })
  }
  const targets = selectBreakerTargets(rows, ['codex', 'grok'])
  expect(targets.map(t => t.engine)).toEqual(['codex'])
})

test('空簽名（detail 空白）不熔斷', () => {
  expect(selectBreakerTargets(fails('codex', 6, '   \n'), ['codex'])).toHaveLength(0)
})

test('loadRecentBreakerRows：缺檔回 []（fail-open）', () => {
  expect(loadRecentBreakerRows(join(tmpDir(), 'no-such.db'))).toEqual([])
})

test('loadRecentBreakerRows：讀 run.db、seq DESC、limit 生效', () => {
  const dir = tmpDir()
  const dbFile = join(dir, 'run.db')
  const db = new RunDb(dbFile)
  for (let i = 0; i < 7; i++) {
    db.record({ taskId: `t${i}`, ok: false, costUsd: 0, detail: `err-${i}`, engine: 'codex' })
  }
  db.close()
  const rows = loadRecentBreakerRows(dbFile, 5)
  expect(rows).toHaveLength(5)
  expect(rows[0]!.detail).toBe('err-6') // 最新在前
  expect(rows[0]!.engine).toBe('codex')
  expect(rows[0]!.ok).toBe(0)
})
