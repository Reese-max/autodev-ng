import { afterEach, describe, expect, test } from 'vitest'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { assembleSurvey } from '../src/autopilot/survey-sources.js'
import { runDbSevenDaySummary } from '../src/engines/run-db-summary.js'

const dirs: string[] = []
const NOW = '2026-07-23T12:00:00.000Z'

function freshDir(): string {
  const dir = mkdtempSync(join(process.cwd(), '.tmp-survey-'))
  dirs.push(dir)
  return dir
}

function seedDb(dir: string): void {
  const db = new Database(join(dir, 'run.db'))
  db.exec('CREATE TABLE attempts(seq INTEGER PRIMARY KEY, task_id TEXT, ts TEXT, ok INTEGER, cost_usd REAL, detail TEXT, engine TEXT)')
  const add = db.prepare('INSERT INTO attempts(task_id,ts,ok,cost_usd,detail,engine) VALUES (?,?,?,?,?,?)')
  add.run('a', '2026-07-22T00:00:00.000Z', 1, 0, 'done', 'codex')
  add.run('b', '2026-07-22T01:00:00.000Z', 0, 0, 'verify timeout 30s', 'codex')
  add.run('c', '2026-07-22T02:00:00.000Z', 0, 0, 'verify timeout 30s', 'qwen')
  add.run('old', '2026-07-01T00:00:00.000Z', 0, 0, 'old failure', 'qwen')
  db.close()
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('多源 survey 組裝器', () => {
  test('全源可用：使用者訊號與北極星置頂為高權重區段，其餘來源隨後，且不改來源', () => {
    const dir = freshDir()
    seedDb(dir)
    writeFileSync(join(dir, 'events.jsonl'), [
      JSON.stringify({ ts: '2026-07-22T00:00:00Z', type: 'verify-fail', detail: 'first' }),
      '{broken',
      JSON.stringify({ ts: '2026-07-22T01:00:00Z', type: 'task-done' }),
      JSON.stringify({ ts: '2026-07-22T02:00:00Z', type: 'verify-fail', detail: 'latest' }),
    ].join('\n'))
    writeFileSync(join(dir, 'USER-SIGNALS.md'), '使用者要更快的回饋。')
    writeFileSync(join(dir, 'NORTHSTAR.md'), '北極星：優先改善可靠度。')
    const before = new Map(readdirSync(dir).map(name => [name, readFileSync(join(dir, name))]))

    const output = assembleSurvey('既有 surveyCommand 輸出', dir, { nowIso: NOW })

    expect(output).toContain('codex: attempts 2｜成功率 50%')
    expect(output).toContain('qwen: attempts 1｜成功率 0%')
    expect(output).toContain('codex: attempts 2｜成功率 50%｜最常見失敗 1 次：verify timeout 30s')
    expect(output).toContain('qwen: attempts 1｜成功率 0%｜最常見失敗 1 次：verify timeout 30s')
    expect(output).toContain('verify-fail: 2 次')
    expect(output).toContain('"detail":"latest"')
    const sections = ['# 最高權重證據：USER-SIGNALS.md', '# 北極星價值判準：NORTHSTAR.md', '# 其他勘查訊號', '既有 surveyCommand 輸出', '# run.db', '# events.jsonl']
    expect(sections.map(section => output.indexOf(section))).toEqual([...sections].map(section => output.indexOf(section)).sort((a, b) => a - b))
    expect(output).toContain('使用者要更快的回饋。')
    expect(output).toContain('北極星：優先改善可靠度。')
    expect(readdirSync(dir).sort()).toEqual([...before.keys()].sort())
    for (const [name, content] of before) expect(readFileSync(join(dir, name))).toEqual(content)
  })

  test('單源損壞時獨立 fail-open，其他來源仍保留', () => {
    const dir = freshDir()
    writeFileSync(join(dir, 'run.db'), 'not sqlite')
    writeFileSync(join(dir, 'events.jsonl'), JSON.stringify({ type: 'preflight-failed', ts: NOW }))
    writeFileSync(join(dir, 'USER-SIGNALS.md'), '訊號仍在')
    writeFileSync(join(dir, 'NORTHSTAR.md'), '方向仍在')
    const output = assembleSurvey('base', dir, { nowIso: NOW })
    expect(output).not.toContain('# run.db')
    expect(output).toContain('preflight-failed: 1 次')
    expect(output).toContain('訊號仍在')
    expect(output).toContain('方向仍在')
  })

  test('全源缺失時只回既有輸出，空基底也不拋錯', () => {
    const dir = freshDir()
    expect(assembleSurvey('base only', dir, { nowIso: NOW })).toBe('base only')
    expect(assembleSurvey('', dir, { nowIso: NOW })).toBe('')
    expect(readdirSync(dir)).toEqual([])
  })

  test('總長度維持 8000 字元上限並沿用保尾截斷', () => {
    const dir = freshDir()
    const output = assembleSurvey(`discard-${'x'.repeat(8000)}-tail`, dir, { nowIso: NOW })
    expect(output).toHaveLength(8000)
    expect(output).not.toContain('discard-')
    expect(output.endsWith('-tail')).toBe(true)
  })

  test('低權重長輸出不會擠掉置頂的使用者訊號與北極星', () => {
    const dir = freshDir()
    writeFileSync(join(dir, 'USER-SIGNALS.md'), '使用者最在意可預期的回應時間。')
    writeFileSync(join(dir, 'NORTHSTAR.md'), '以可靠度與可預期性決定優先順序。')

    const output = assembleSurvey(`discard-${'x'.repeat(8000)}-tail`, dir, { nowIso: NOW })

    expect(output.startsWith('# 最高權重證據：USER-SIGNALS.md')).toBe(true)
    expect(output.indexOf('# 北極星價值判準：NORTHSTAR.md')).toBeGreaterThan(0)
    expect(output.indexOf('# 其他勘查訊號')).toBeGreaterThan(output.indexOf('# 北極星價值判準：NORTHSTAR.md'))
    expect(output).toContain('使用者最在意可預期的回應時間。')
    expect(output).toContain('以可靠度與可預期性決定優先順序。')
    expect(output).toHaveLength(8000)
    expect(output.endsWith('-tail')).toBe(true)
  })
})

describe('run.db 近七個 UTC 日彙總', () => {
  test('依 UTC 日界彙總各引擎，並選出各自最常見失敗 detail', () => {
    const dir = freshDir()
    const db = new Database(join(dir, 'run.db'))
    db.exec('CREATE TABLE attempts(seq INTEGER PRIMARY KEY, task_id TEXT, ts TEXT, ok INTEGER, cost_usd REAL, detail TEXT, engine TEXT)')
    const add = db.prepare('INSERT INTO attempts(task_id,ts,ok,cost_usd,detail,engine) VALUES (?,?,?,?,?,?)')
    add.run('before', '2026-07-16T23:59:59.999Z', 0, 0, 'outside', 'codex')
    add.run('start', '2026-07-17T00:00:00.000Z', 1, 0, 'done', 'codex')
    add.run('c1', '2026-07-20T00:00:00.000Z', 0, 0, 'timeout', 'codex')
    add.run('c2', '2026-07-21T00:00:00.000Z', 0, 0, 'timeout', 'codex')
    add.run('q1', '2026-07-22T00:00:00.000Z', 0, 0, 'quota', 'qwen')
    add.run('end', '2026-07-24T00:00:00.000Z', 1, 0, 'outside', 'qwen')
    db.close()

    expect(runDbSevenDaySummary(join(dir, 'run.db'), NOW)).toEqual([
      { engine: 'codex', attempts: 3, successRate: 1 / 3, topFailure: { detail: 'timeout', count: 2 } },
      { engine: 'qwen', attempts: 1, successRate: 0, topFailure: { detail: 'quota', count: 1 } },
    ])
  })

  test('缺檔、查詢失敗、欄位格式異常與無效時間皆回空摘要', () => {
    const dir = freshDir()
    expect(runDbSevenDaySummary(join(dir, 'missing.db'), NOW)).toEqual([])
    writeFileSync(join(dir, 'broken.db'), 'not sqlite')
    expect(runDbSevenDaySummary(join(dir, 'broken.db'), NOW)).toEqual([])

    const db = new Database(join(dir, 'malformed.db'))
    db.exec('CREATE TABLE attempts(ts TEXT, ok TEXT, detail TEXT, engine TEXT)')
    db.prepare('INSERT INTO attempts VALUES (?,?,?,?)').run('2026-07-22T00:00:00.000Z', 'yes', 'bad', 'codex')
    db.close()
    expect(runDbSevenDaySummary(join(dir, 'malformed.db'), NOW)).toEqual([])
    expect(runDbSevenDaySummary(join(dir, 'malformed.db'), 'not-a-date')).toEqual([])
  })
})
