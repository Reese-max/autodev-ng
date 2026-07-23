import { afterEach, describe, expect, test } from 'vitest'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import {
  applySurveyPriorityBudget, assembleSurvey, collectSurvey, packHighWeightSources,
  MAX_SURVEY_LENGTH, USER_SIGNALS_HEADING, NORTHSTAR_HEADING,
} from '../src/autopilot/survey-sources.js'
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
      JSON.stringify({ ts: '2026-07-22T01:10:00Z', type: 'preflight-failed', engine: 'qwen' }),
      JSON.stringify({ ts: '2026-07-22T01:20:00Z', type: 'killed', task: 'goal-1' }),
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
    expect(output).toContain('preflight-failed: 1 次｜最近樣本 {"ts":"2026-07-22T01:10:00Z","type":"preflight-failed","engine":"qwen"}')
    expect(output).toContain('killed: 1 次｜最近樣本 {"ts":"2026-07-22T01:20:00Z","type":"killed","task":"goal-1"}')
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

  test('大型多源摘要不會擠掉既有 surveyCommand 輸出', () => {
    const dir = freshDir()
    writeFileSync(join(dir, 'events.jsonl'), JSON.stringify({
      type: 'large-event', ts: NOW, detail: 'x'.repeat(10_000),
    }))

    const output = assembleSurvey('survey-command-marker', dir, { nowIso: NOW })

    expect(output.startsWith('survey-command-marker\n\n# events.jsonl')).toBe(true)
    expect(output).toHaveLength(8000)
  })

  test('低權重長輸出不會擠掉置頂的使用者訊號與北極星', () => {
    const dir = freshDir()
    writeFileSync(join(dir, 'USER-SIGNALS.md'), '使用者最在意可預期的回應時間。')
    writeFileSync(join(dir, 'NORTHSTAR.md'), '以可靠度與可預期性決定優先順序。')

    const output = assembleSurvey(`discard-${'x'.repeat(8000)}-tail`, dir, { nowIso: NOW })

    expect(output.startsWith(`# ${USER_SIGNALS_HEADING}`)).toBe(true)
    expect(output.indexOf(`# ${NORTHSTAR_HEADING}`)).toBeGreaterThan(0)
    expect(output.indexOf('# 其他勘查訊號')).toBeGreaterThan(output.indexOf(`# ${NORTHSTAR_HEADING}`))
    expect(output).toContain('使用者最在意可預期的回應時間。')
    expect(output).toContain('以可靠度與可預期性決定優先順序。')
    expect(output).toHaveLength(8000)
    expect(output.endsWith('-tail')).toBe(true)
  })

  test('USER-SIGNALS 與 NORTHSTAR 全文在可塞入時完整保留（不因長 base 被砍）', () => {
    const dir = freshDir()
    const user = `user-head-${'U'.repeat(1800)}-user-tail-FULL`
    const north = `north-head-${'N'.repeat(1800)}-north-tail-FULL`
    writeFileSync(join(dir, 'USER-SIGNALS.md'), user)
    writeFileSync(join(dir, 'NORTHSTAR.md'), north)

    const output = assembleSurvey(`base-${'B'.repeat(6000)}-base-end`, dir, { nowIso: NOW })

    expect(output.startsWith(`# ${USER_SIGNALS_HEADING}\n${user}`)).toBe(true)
    expect(output).toContain(`# ${NORTHSTAR_HEADING}\n${north}`)
    expect(output).toContain('-user-tail-FULL')
    expect(output).toContain('-north-tail-FULL')
    expect(output.indexOf(USER_SIGNALS_HEADING)).toBeLessThan(output.indexOf(NORTHSTAR_HEADING))
    expect(output.indexOf(NORTHSTAR_HEADING)).toBeLessThan(output.indexOf('# 其他勘查訊號'))
    expect(output.length).toBeLessThanOrEqual(MAX_SURVEY_LENGTH)
  })

  test('高權重佔滿預算時仍保留 surveyCommand，且最終結果不超過 8000 字元', () => {
    const dir = freshDir()
    writeFileSync(join(dir, 'USER-SIGNALS.md'), `user-head-${'U'.repeat(4500)}-user-tail`)
    writeFileSync(join(dir, 'NORTHSTAR.md'), `north-head-${'N'.repeat(4500)}-north-tail`)
    writeFileSync(join(dir, 'events.jsonl'), JSON.stringify({
      type: 'noise-event', ts: NOW, detail: 'z'.repeat(5000),
    }))

    const output = assembleSurvey('SURVEY-CMD-BASE-MARKER', dir, { nowIso: NOW })

    expect(output).toContain('SURVEY-CMD-BASE-MARKER')
    expect(output).toContain('user-head-')
    expect(output.indexOf('# 最高權重證據：USER-SIGNALS.md')).toBeLessThan(output.indexOf('# 北極星價值判準：NORTHSTAR.md'))
    expect(output.indexOf('# 北極星價值判準：NORTHSTAR.md')).toBeLessThan(output.indexOf('# 其他勘查訊號'))
    expect(output.indexOf('# 其他勘查訊號')).toBeLessThan(output.indexOf('SURVEY-CMD-BASE-MARKER'))
    expect(output.length).toBeLessThanOrEqual(MAX_SURVEY_LENGTH)
    // 預算被高權重吃光時，低權重 summaries 可捨棄，但 base 不得消失。
    expect(output).not.toContain('noise-event')
  })

  test('collectSurvey 保留 surveyCommand 輸出並組裝可用來源', () => {
    const dir = freshDir()
    writeFileSync(join(dir, 'USER-SIGNALS.md'), 'user-marker')
    const command = `\"${process.execPath}\" -e \"process.stdout.write('survey-command-marker')\"`

    const output = collectSurvey({ surveyCommand: command, surveyTimeoutMs: 1_000, dataDir: dir }, process.cwd())

    expect(output).toContain('survey-command-marker')
    expect(output).toContain('user-marker')
    expect(output.length).toBeLessThanOrEqual(MAX_SURVEY_LENGTH)
  })
})

describe('packHighWeightSources', () => {
  test('USER-SIGNALS 全文置頂標最高權重，NORTHSTAR 全文緊接其後', () => {
    const packed = packHighWeightSources('user-full-body', 'north-full-body')
    expect(packed.startsWith(`# ${USER_SIGNALS_HEADING}\nuser-full-body`)).toBe(true)
    expect(packed).toContain(`# ${NORTHSTAR_HEADING}\nnorth-full-body`)
    expect(packed.indexOf(USER_SIGNALS_HEADING)).toBeLessThan(packed.indexOf(NORTHSTAR_HEADING))
    expect(packed).toBe([
      `# ${USER_SIGNALS_HEADING}\nuser-full-body`,
      `# ${NORTHSTAR_HEADING}\nnorth-full-body`,
    ].join('\n\n'))
  })

  test('單源缺席時不留空標頭', () => {
    expect(packHighWeightSources('', 'only-north')).toBe(`# ${NORTHSTAR_HEADING}\nonly-north`)
    expect(packHighWeightSources('only-user', '')).toBe(`# ${USER_SIGNALS_HEADING}\nonly-user`)
    expect(packHighWeightSources('', '')).toBe('')
  })
})

describe('applySurveyPriorityBudget 優先序截斷', () => {
  const high = packHighWeightSources('user-body', 'north-body')

  test('無高權重：總長 ≤ 8000，base 優先於 summaries', () => {
    const out = applySurveyPriorityBudget('', 'BASE-MARKER', `${'s'.repeat(10_000)}-sum-tail`)
    expect(out).toHaveLength(MAX_SURVEY_LENGTH)
    expect(out.startsWith('BASE-MARKER')).toBe(true)
    expect(out).toContain('BASE-MARKER')
  })

  test('有高權重且總長可塞入：結果 ≤ 8000，順序高權重→base→summaries', () => {
    const out = applySurveyPriorityBudget(high, 'BASE-MARKER', '# run.db\nrow')
    expect(out.length).toBeLessThanOrEqual(MAX_SURVEY_LENGTH)
    expect(out.indexOf(`# ${USER_SIGNALS_HEADING}`)).toBeLessThan(out.indexOf(`# ${NORTHSTAR_HEADING}`))
    expect(out.indexOf(`# ${NORTHSTAR_HEADING}`)).toBeLessThan(out.indexOf('# 其他勘查訊號'))
    expect(out.indexOf('# 其他勘查訊號')).toBeLessThan(out.indexOf('BASE-MARKER'))
    expect(out.indexOf('BASE-MARKER')).toBeLessThan(out.indexOf('# run.db'))
  })

  test('高權重全文可塞入時不被 surveyCommand 四分之一預留截斷', () => {
    const user = `USER-FULL-${'U'.repeat(2000)}-USER-END`
    const north = `NORTH-FULL-${'N'.repeat(2000)}-NORTH-END`
    const fullHigh = packHighWeightSources(user, north)
    expect(fullHigh.length).toBeLessThan(MAX_SURVEY_LENGTH)

    const out = applySurveyPriorityBudget(fullHigh, 'B'.repeat(5000), `# events\n${'e'.repeat(3000)}`)

    expect(out.startsWith(fullHigh)).toBe(true)
    expect(out).toContain('-USER-END')
    expect(out).toContain('-NORTH-END')
    expect(out).toContain('# 其他勘查訊號')
    expect(out).not.toContain('# events') // summaries 先砍
    expect(out.length).toBeLessThanOrEqual(MAX_SURVEY_LENGTH)
  })

  test('剩餘預算不足時先砍 summaries，高權重全文保留並保 base 尾端', () => {
    // 高權重幾乎填滿但仍 ≤ 8000：全文保留，剩餘給 base 尾；summaries 整段捨棄。
    const fatHigh = `${high}\n${'H'.repeat(MAX_SURVEY_LENGTH - high.length - 20)}`
    expect(fatHigh.length).toBeLessThanOrEqual(MAX_SURVEY_LENGTH)
    const out = applySurveyPriorityBudget(fatHigh, `discard-${'b'.repeat(500)}-BT`, `# events\n${'e'.repeat(2000)}`)
    expect(out.startsWith(fatHigh)).toBe(true)
    expect(out).toContain('-BT')
    expect(out).not.toContain('# events')
    expect(out.length).toBeLessThanOrEqual(MAX_SURVEY_LENGTH)
    expect(out.indexOf(`# ${USER_SIGNALS_HEADING}`)).toBeLessThan(out.indexOf(`# ${NORTHSTAR_HEADING}`))
    expect(out.indexOf('# 其他勘查訊號')).toBeLessThan(out.indexOf('-BT'))
  })

  test('高權重單獨超過 8000 時仍受上限約束並保留 base', () => {
    const huge = `${'X'.repeat(9000)}-HIGH-TAIL`
    const out = applySurveyPriorityBudget(huge, 'BASE-KEEP', '# events\nnoise')
    expect(out).toContain('BASE-KEEP')
    expect(out).toHaveLength(MAX_SURVEY_LENGTH)
    expect(out.indexOf('X')).toBeLessThan(out.indexOf('# 其他勘查訊號'))
    expect(out.indexOf('# 其他勘查訊號')).toBeLessThan(out.indexOf('BASE-KEEP'))
    expect(out).not.toContain('# events')
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

  test('缺 run.db 時回空摘要', () => {
    const dir = freshDir()
    expect(runDbSevenDaySummary(join(dir, 'missing.db'), NOW)).toEqual([])
  })

  test('attempts schema 缺必要欄位時回空摘要', () => {
    const dir = freshDir()
    const db = new Database(join(dir, 'wrong-schema.db'))
    db.exec('CREATE TABLE attempts(ts TEXT, ok INTEGER, detail TEXT)')
    db.close()
    expect(runDbSevenDaySummary(join(dir, 'wrong-schema.db'), NOW)).toEqual([])
  })

  test('查詢損壞的 SQLite 時回空摘要', () => {
    const dir = freshDir()
    writeFileSync(join(dir, 'broken.db'), 'not sqlite')
    expect(runDbSevenDaySummary(join(dir, 'broken.db'), NOW)).toEqual([])
  })

  test('欄位格式異常與無效時間皆回空摘要', () => {
    const dir = freshDir()
    const db = new Database(join(dir, 'malformed.db'))
    db.exec('CREATE TABLE attempts(ts TEXT, ok TEXT, detail TEXT, engine TEXT)')
    db.prepare('INSERT INTO attempts VALUES (?,?,?,?)').run('2026-07-22T00:00:00.000Z', 'yes', 'bad', 'codex')
    db.close()
    expect(runDbSevenDaySummary(join(dir, 'malformed.db'), NOW)).toEqual([])
    expect(runDbSevenDaySummary(join(dir, 'malformed.db'), 'not-a-date')).toEqual([])
  })
})
