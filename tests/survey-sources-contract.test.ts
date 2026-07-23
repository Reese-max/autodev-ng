import { afterEach, describe, expect, test } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { assembleSurvey } from '../src/autopilot/survey-sources.js'
import { discoverProblems } from '../src/autopilot/discover.js'
import type { Goal } from '../src/autopilot/goal.js'

const dirs: string[] = []
const NOW = '2026-07-23T12:00:00.000Z'
const goal: Goal = { objective: '驗證 survey', noProgressLimit: 3, evidenceFiles: [] }

function freshDir(): string {
  const dir = mkdtempSync(join(process.cwd(), '.tmp-survey-contract-'))
  dirs.push(dir)
  return dir
}

function writeRunDb(dir: string): void {
  const db = new Database(join(dir, 'run.db'))
  db.exec('CREATE TABLE attempts(ts TEXT, ok INTEGER, detail TEXT, engine TEXT)')
  db.prepare('INSERT INTO attempts VALUES (?,?,?,?)').run('2026-07-22T00:00:00.000Z', 1, 'done', 'db-marker')
  db.close()
}

function writeAllSources(dir: string): void {
  writeRunDb(dir)
  writeFileSync(join(dir, 'events.jsonl'), JSON.stringify({ ts: NOW, type: 'event-marker' }))
  writeFileSync(join(dir, 'USER-SIGNALS.md'), 'user-marker')
  writeFileSync(join(dir, 'NORTHSTAR.md'), 'northstar-marker')
}

function llm(reply: string, prompts: string[] = []) {
  return { url: 'http://x/v1', model: 'm', apiKey: 'k',
    fetchFn: (async (_url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      const body = JSON.parse(String(init?.body)) as { messages: Array<{ content: string }> }
      prompts.push(body.messages[0]!.content)
      return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: reply } }] }) }
    }) as unknown as typeof fetch }
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('survey 來源契約', () => {
  test.each([
    ['run.db', (dir: string) => writeRunDb(dir), 'db-marker'],
    ['events.jsonl', (dir: string) => writeFileSync(join(dir, 'events.jsonl'), JSON.stringify({ ts: NOW, type: 'event-marker' })), 'event-marker'],
    ['USER-SIGNALS.md', (dir: string) => writeFileSync(join(dir, 'USER-SIGNALS.md'), 'user-marker'), 'user-marker'],
    ['NORTHSTAR.md', (dir: string) => writeFileSync(join(dir, 'NORTHSTAR.md'), 'northstar-marker'), 'northstar-marker'],
  ])('單一來源 %s 仍會被保留', (_name, setup, marker) => {
    const dir = freshDir()
    setup(dir)
    expect(assembleSurvey('base-marker', dir, { nowIso: NOW })).toContain(marker)
  })

  test.each([
    ['run.db', 'db-marker'],
    ['events.jsonl', 'event-marker'],
    ['USER-SIGNALS.md', 'user-marker'],
    ['NORTHSTAR.md', 'northstar-marker'],
  ])('缺少 %s 時其餘四個訊號仍 fail-open 保留', (missing, absentMarker) => {
    const dir = freshDir()
    writeAllSources(dir)
    rmSync(join(dir, missing))

    const output = assembleSurvey('base-marker', dir, { nowIso: NOW })

    expect(output).toContain('base-marker')
    for (const marker of ['db-marker', 'event-marker', 'user-marker', 'northstar-marker']) {
      if (marker !== absentMarker) expect(output).toContain(marker)
    }
    expect(output).not.toContain(absentMarker)
  })

  test.each([
    ['run.db 損壞', (dir: string) => writeFileSync(join(dir, 'run.db'), 'not sqlite'), 'db-marker'],
    ['events.jsonl 無法讀取', (dir: string) => { rmSync(join(dir, 'events.jsonl')); mkdirSync(join(dir, 'events.jsonl')) }, 'event-marker'],
    ['USER-SIGNALS.md 無法讀取', (dir: string) => { rmSync(join(dir, 'USER-SIGNALS.md')); mkdirSync(join(dir, 'USER-SIGNALS.md')) }, 'user-marker'],
    ['NORTHSTAR.md 無法讀取', (dir: string) => { rmSync(join(dir, 'NORTHSTAR.md')); mkdirSync(join(dir, 'NORTHSTAR.md')) }, 'northstar-marker'],
  ])('來源 %s 時，其他來源與 surveyCommand 仍獨立 fail-open 保留', (_failure, breakSource, absentMarker) => {
    const dir = freshDir()
    writeAllSources(dir)
    breakSource(dir)

    const output = assembleSurvey('base-marker', dir, { nowIso: NOW })

    expect(output).toContain('base-marker')
    for (const marker of ['db-marker', 'event-marker', 'user-marker', 'northstar-marker']) {
      if (marker !== absentMarker) expect(output).toContain(marker)
    }
    expect(output).not.toContain(absentMarker)
  })

  test('USER-SIGNALS、NORTHSTAR 置頂且 8000 字元截斷保留尾端低權重訊號', () => {
    const dir = freshDir()
    writeFileSync(join(dir, 'USER-SIGNALS.md'), 'user-marker')
    writeFileSync(join(dir, 'NORTHSTAR.md'), 'northstar-marker')

    const output = assembleSurvey(`discard-${'x'.repeat(8000)}-tail-marker`, dir, { nowIso: NOW })

    expect(output).toHaveLength(8000)
    expect(output).not.toContain('discard-')
    expect(output.endsWith('-tail-marker')).toBe(true)
    expect(output.indexOf('# 最高權重證據：USER-SIGNALS.md')).toBeLessThan(output.indexOf('# 北極星價值判準：NORTHSTAR.md'))
    expect(output.indexOf('# 北極星價值判準：NORTHSTAR.md')).toBeLessThan(output.indexOf('# 其他勘查訊號'))
  })

  test('高權重過大時仍保留 surveyCommand、受 8000 字元上限並注入 finder', async () => {
    const dir = freshDir()
    const user = `${'u'.repeat(8000)}-user-tail`
    const northstar = `${'n'.repeat(8000)}-northstar-tail`
    const finderPrompts: string[] = []
    writeFileSync(join(dir, 'USER-SIGNALS.md'), user)
    writeFileSync(join(dir, 'NORTHSTAR.md'), northstar)

    const survey = assembleSurvey('base-marker', dir, { nowIso: NOW })
    expect(survey).toHaveLength(8000)
    expect(survey).toContain('base-marker')
    expect(survey).toContain('# 最高權重證據：USER-SIGNALS.md')

    await discoverProblems({
      finderLlm: llm('NONE', finderPrompts), criticLlm: llm('NONE'),
      runSurvey: () => ({ output: survey }), readEvidence: () => '', lenses: ['correctness']
    }, goal, process.cwd())

    expect(finderPrompts[0]).toContain('base-marker')
    expect(finderPrompts[0]).toContain('# 最高權重證據：USER-SIGNALS.md')
  })

  test('critic prompt 注入北極星排序與降權指示', async () => {
    const dir = freshDir()
    writeFileSync(join(dir, 'USER-SIGNALS.md'), 'user-marker')
    writeFileSync(join(dir, 'NORTHSTAR.md'), 'northstar-marker')
    const criticPrompts: string[] = []

    await discoverProblems({
      finderLlm: llm('問題A｜理由'), criticLlm: llm('VALUE:8 | 問題A | correctness | 高價值', criticPrompts),
      runSurvey: () => ({ output: assembleSurvey('base-marker', dir, { nowIso: NOW }) }),
      readEvidence: () => '', lenses: ['correctness']
    }, goal, process.cwd())

    const prompt = criticPrompts[0] ?? ''
    expect(prompt).toContain('依北極星價值判準排序')
    expect(prompt).toContain('與北極星無關的候選降權')
    expect(prompt).toContain('northstar-marker')
  })
})
