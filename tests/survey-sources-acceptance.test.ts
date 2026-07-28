import { afterEach, describe, expect, test } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import {
  assembleSurvey, MAX_SURVEY_LENGTH, NORTHSTAR_HEADING, USER_SIGNALS_HEADING,
} from '../src/autopilot/survey-sources.js'
import { criticPrompt, northstarFromSurvey } from '../src/autopilot/discover.js'
import { runDbSevenDaySummary } from '../src/engines/run-db-summary.js'
import { summarizeEventsTail } from '../src/engines/events-tail-summary.js'

const NOW = '2026-07-23T12:00:00.000Z'
const dirs: string[] = []

function freshDir(): string {
  const dir = mkdtempSync(join(process.cwd(), '.tmp-survey-acceptance-'))
  dirs.push(dir)
  return dir
}

function writeRunDb(dir: string, rows: Array<[string, number, string, string]> = [
  ['2026-07-22T00:00:00.000Z', 1, 'done', 'db-marker'],
]): void {
  const db = new Database(join(dir, 'run.db'))
  db.exec('CREATE TABLE attempts(ts TEXT, ok INTEGER, detail TEXT, engine TEXT)')
  const insert = db.prepare('INSERT INTO attempts VALUES (?,?,?,?)')
  for (const row of rows) insert.run(...row)
  db.close()
}

function writeAllSources(dir: string): void {
  writeRunDb(dir)
  writeFileSync(join(dir, 'events.jsonl'), JSON.stringify({ ts: NOW, type: 'event-marker' }))
  writeFileSync(join(dir, 'USER-SIGNALS.md'), 'user-marker')
  writeFileSync(join(dir, 'NORTHSTAR.md'), 'northstar-marker')
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('GOAL-survey 可核查驗收矩陣', () => {
  test('來源排序、run.db 七日聚合、events 統計與最近樣本', () => {
    const dir = freshDir()
    writeRunDb(dir, [
      ['2026-07-16T23:59:59.999Z', 0, 'outside-before', 'codex'],
      ['2026-07-17T00:00:00.000Z', 1, 'done', 'codex'],
      ['2026-07-20T00:00:00.000Z', 0, 'timeout', 'codex'],
      ['2026-07-21T00:00:00.000Z', 0, 'timeout', 'codex'],
      ['2026-07-22T00:00:00.000Z', 0, 'quota', 'qwen'],
      ['2026-07-24T00:00:00.000Z', 1, 'outside-after', 'qwen'],
    ])
    const first = { ts: '2026-07-22T00:00:00.000Z', type: 'verify-fail', sample: 'first' }
    const latest = { ts: '2026-07-22T02:00:00.000Z', type: 'verify-fail', sample: 'latest' }
    const killed = { ts: '2026-07-22T01:00:00.000Z', type: 'killed', task: 'goal-1' }
    writeFileSync(join(dir, 'events.jsonl'), [JSON.stringify(first), '{broken', JSON.stringify(killed), JSON.stringify(latest)].join('\n'))
    writeFileSync(join(dir, 'USER-SIGNALS.md'), 'user-marker')
    writeFileSync(join(dir, 'NORTHSTAR.md'), 'northstar-marker')

    expect(runDbSevenDaySummary(join(dir, 'run.db'), NOW)).toEqual([
      { engine: 'codex', attempts: 3, successRate: 1 / 3, topFailure: { detail: 'timeout', count: 2 } },
      { engine: 'qwen', attempts: 1, successRate: 0, topFailure: { detail: 'quota', count: 1 } },
    ])
    expect(summarizeEventsTail(dir)).toEqual([
      { type: 'verify-fail', count: 2, latest },
      { type: 'killed', count: 1, latest: killed },
    ])

    const output = assembleSurvey('base-marker', dir, { nowIso: NOW })
    const ordered = [
      `# ${USER_SIGNALS_HEADING}`,
      `# ${NORTHSTAR_HEADING}`,
      '# 其他勘查訊號',
      'base-marker',
      '# run.db 近 7 日',
      '# events.jsonl 尾部高頻事件',
    ].map(marker => output.indexOf(marker))
    expect(ordered.every(index => index >= 0)).toBe(true)
    expect(ordered).toEqual([...ordered].sort((a, b) => a - b))
    expect(output).toContain('codex: attempts 3｜成功率 33%｜最常見失敗 2 次：timeout')
    expect(output).toContain(`verify-fail: 2 次｜最近樣本 ${JSON.stringify(latest)}`)
    expect(output).not.toContain(JSON.stringify(first))
  })

  test.each([
    ['run.db', (dir: string) => writeFileSync(join(dir, 'run.db'), 'not sqlite'), 'db-marker'],
    ['events.jsonl', (dir: string) => { rmSync(join(dir, 'events.jsonl')); mkdirSync(join(dir, 'events.jsonl')) }, 'event-marker'],
    ['USER-SIGNALS.md', (dir: string) => { rmSync(join(dir, 'USER-SIGNALS.md')); mkdirSync(join(dir, 'USER-SIGNALS.md')) }, 'user-marker'],
    ['NORTHSTAR.md', (dir: string) => { rmSync(join(dir, 'NORTHSTAR.md')); mkdirSync(join(dir, 'NORTHSTAR.md')) }, 'northstar-marker'],
  ])('%s 讀取失敗時僅略過自身，其餘來源與 surveyCommand fail-open', (_source, breakSource, absent) => {
    const dir = freshDir()
    writeAllSources(dir)
    breakSource(dir)

    const output = assembleSurvey('base-marker', dir, { nowIso: NOW })

    expect(output).toContain('base-marker')
    for (const marker of ['db-marker', 'event-marker', 'user-marker', 'northstar-marker']) {
      expect(output.includes(marker)).toBe(marker !== absent)
    }
  })

  test('critic 收到 NORTHSTAR 全文與排序／無關候選降權硬指令', () => {
    const dir = freshDir()
    writeFileSync(join(dir, 'NORTHSTAR.md'), 'northstar-marker：可靠度優先')
    const northstar = northstarFromSurvey(assembleSurvey('base-marker', dir, { nowIso: NOW }))
    const prompt = criticPrompt([
      { lens: 'correctness', title: '修復可靠度問題', detail: '有失敗證據' },
      { lens: 'novelty', title: '加入無關動畫', detail: '只有技術新奇性' },
    ], northstar)

    expect(northstar).toBe('northstar-marker：可靠度優先')
    expect(prompt).toContain('排序主軸是北極星（NORTHSTAR）價值判準')
    expect(prompt).toContain('依北極星價值判準排序（高對齊在前）')
    expect(prompt).toContain('與北極星無關的候選降權')
    expect(prompt).toContain('不得排在高對齊候選之前')
    expect(prompt).toContain('northstar-marker：可靠度優先')
  })

  test('組合結果以 8000 字元截斷，保留置頂來源與 surveyCommand 尾端', () => {
    const dir = freshDir()
    writeFileSync(join(dir, 'USER-SIGNALS.md'), 'user-marker')
    writeFileSync(join(dir, 'NORTHSTAR.md'), 'northstar-marker')

    const output = assembleSurvey(`discard-${'x'.repeat(MAX_SURVEY_LENGTH)}-tail-marker`, dir, { nowIso: NOW })

    expect(output).toHaveLength(MAX_SURVEY_LENGTH)
    expect(output.startsWith(`# ${USER_SIGNALS_HEADING}\nuser-marker\n\n# ${NORTHSTAR_HEADING}\nnorthstar-marker`)).toBe(true)
    expect(output).not.toContain('discard-')
    expect(output.endsWith('-tail-marker')).toBe(true)
  })
})
