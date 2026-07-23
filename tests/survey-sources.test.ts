import { afterEach, describe, expect, test } from 'vitest'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { assembleSurvey } from '../src/autopilot/survey-sources.js'

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
  test('全源可用：依序保留基底、7 日戰績、事件、使用者訊號與北極星，且不改來源', () => {
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
    expect(output).toContain('2 次｜verify timeout 30s')
    expect(output).toContain('verify-fail: 2 次')
    expect(output).toContain('"detail":"latest"')
    const sections = ['既有 surveyCommand 輸出', '# run.db', '# events.jsonl', '# USER-SIGNALS.md', '# NORTHSTAR.md']
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
})
