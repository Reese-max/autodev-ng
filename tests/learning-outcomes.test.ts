import { expect, test } from 'vitest'
import { lessonFingerprints, observeLearning, summarizeLearning } from '../src/learn/outcomes.js'
import type { EventLog } from '../src/events.js'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { GithubConfigSchema } from '../src/github/config.js'
import { saveState } from '../src/github/state.js'

test('同任務/模型/版本才能比較；中斷、未驗收與少量樣本不得宣稱改善', () => {
  const events: object[] = [], log: Pick<EventLog, 'append'> = { append: (type, data) => { events.push({ type, ...data }) } }
  const baseCommit = 'a'.repeat(40), commit = 'b'.repeat(40), lessonsText = '- L001 [2026-09-08] Handle empty input'
  for (let i = 0; i < 3; i++) {
    observeLearning(log, { executionId: `before-${i}`, taskId: 'same', model: 'astra', baseCommit, lessonsText: '' })({ accepted: false, failure: 'empty input' })
    observeLearning(log, { executionId: `after-${i}`, taskId: 'same', model: 'astra', baseCommit, lessonsText })({ accepted: true, commit })
  }
  observeLearning(log, { executionId: 'interrupted', taskId: 'same', model: 'astra', baseCommit, lessonsText })
  observeLearning(log, { executionId: 'other-source', taskId: 'same', model: 'astra', baseCommit: 'c'.repeat(40), lessonsText })({ accepted: true, commit })
  observeLearning(log, { executionId: 'missing-commit', taskId: 'different', model: 'astra', baseCommit, lessonsText })({ accepted: true })
  const result = summarizeLearning(events.map(e => JSON.stringify(e)).join('\n'))
  expect(result).toMatchObject({ observed: 8, pendingOrInterrupted: 1, malformed: 0, conflicts: 0, causalImprovement: null })
  expect(result.comparisons.find(r => r.baseCommit === baseCommit && r.taskId === 'same')).toMatchObject({ status: 'observed-comparison', acceptanceRateDelta: 1 })
  expect(result.comparisons.find(r => r.baseCommit !== baseCommit)).toMatchObject({ status: 'insufficient-matched-observations', acceptanceRateDelta: null })
  expect(result.rows.find(r => r.taskId === 'different')?.accepted).toBe(0)
  expect(result.rows.find(r => !r.lessons.length)?.repeatedFailures).toBe(2)
})

test('教訓內容指紋不依賴編號/日期；損壞紀錄明確呈現', () => {
  expect(lessonFingerprints('- L001 [2026-01-01] same lesson')).toEqual(lessonFingerprints('- L008 [2026-09-08] same   lesson'))
  expect(summarizeLearning('{broken').malformed).toBe(1)
  expect(summarizeLearning('').comparisons).toEqual([])
  expect(summarizeLearning('').measurementStatus).toBe('no-observations')
  expect(summarizeLearning('{broken').measurementStatus).toBe('invalid-evidence')
})

test('報表納入同專案 Issue 紀錄，拒絕混入其他專案', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-learning-report-'))
  try {
    const file = join(dir, 'source.json'), repairFile = join(dir, 'repair.json')
    writeFileSync(file, JSON.stringify({ dataDir: 'self' }))
    const cfg = GithubConfigSchema.parse({ repo: 'fixture/project', authors: ['fixture'], sourceConfig: file, dataDir: join(dir, 'issues'), engine: 'writer',
      repair: { reportConfig: 'unused.json', probeIds: ['fixture'], prepareCommand: 'unused' } })
    writeFileSync(repairFile, JSON.stringify(cfg))
    saveState(cfg, { repo: cfg.repo, base: cfg.base, status: 'queued', runs: 1, nextRunAt: 0, fingerprint: 'a'.repeat(64),
      issue: { number: 1, title: 'fixture', body: '', state: 'open', user: { login: 'fixture' }, labels: [] } })
    const log = join(cfg.dataDir, 'issue-1', 'events.jsonl')
    const run = () => spawnSync(process.execPath, [resolve('scripts/learning-report.mjs'), '--config', file, '--repair-config', repairFile], { encoding: 'utf8', windowsHide: true })
    const empty = run()
    expect(empty.status).toBe(2)
    expect(JSON.parse(empty.stdout)).toMatchObject({ measurementStatus: 'no-observations', userOutcomes: { humanAccepted: 0 } })
    expect(JSON.parse(empty.stdout).sources.every((s: { present: boolean }) => !s.present)).toBe(true)
    writeFileSync(log, JSON.stringify({ type: 'learning-outcome', executionId: 'fixture-only', taskId: 'fixture', model: 'fixture', baseCommit: 'a'.repeat(40), lessons: [], accepted: true, commit: 'b'.repeat(40), durationMs: 1 }) + '\n')
    const result = run()
    expect(result.status).toBe(0); expect(JSON.parse(result.stdout)).toMatchObject({ observed: 1, causalImprovement: null })
    writeFileSync(repairFile, JSON.stringify({ ...cfg, sourceConfig: join(dir, 'another.json') }))
    expect(run().status).toBe(1)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
