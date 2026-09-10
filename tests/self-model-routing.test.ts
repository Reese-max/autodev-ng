import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { expect, test } from 'vitest'
import { ConfigSchema } from '../src/types.js'
import { pickCandidateTags } from '../src/engines/pick-candidates.js'
import { dailyAttemptCapsFromEngines } from '../src/engines/daily-attempt-cap-gate.js'
import { researchModels } from '../src/autopilot/report-research.js'
import { loadReportConfig } from '../src/github/report-config.js'
import { loadGithubConfig } from '../src/github/config.js'
import { runtimeConfig } from '../src/github/job.js'
import type { IssueState } from '../src/github/state.js'

test('自我專案所有執行候選與研究走 Devin CLI，獨立審查保持不同模型', () => {
  const root = resolve(import.meta.dirname, '..'), cfg = ConfigSchema.parse(JSON.parse(readFileSync(join(root, 'configs/autodev-self.json'), 'utf8')))
  const reports = loadReportConfig(join(root, 'configs/integrations/github-reports.json'))
  const repair = JSON.parse(readFileSync(join(root, 'configs/integrations/github-repair.json'), 'utf8'))
  expect(repair.engine).toBe(cfg.defaultEngine)
  const integration = loadGithubConfig(join(root, 'configs/integrations/github-repair.json'))
  const state: IssueState = { repo: integration.repo, base: integration.base, status: 'queued', runs: 0, nextRunAt: 0, fingerprint: 'a'.repeat(64),
    issue: { number: 999, title: 'fixture', body: '', state: 'open', user: { login: 'fixture' }, labels: [] } }
  expect(runtimeConfig(integration, state).learningsFile).toBe(join(root, 'data/autodev-self/learnings.md'))
  expect(cfg).toMatchObject({ llmTransport: 'devin-cli', tierMode: 'free-only', judgeModel: 'swe-1-7', auditModel: 'glm-5-2', reviewEngine: 'glm-5-2' })
  expect(cfg.alternativeRetry).toBe(true)
  expect(runtimeConfig(integration, state).alternativeRetry).toBe(true)
  expect(cfg.engines[cfg.defaultEngine]).toMatchObject({ adapter: 'devin', model: 'swe-1-7', subscription: true, costPerRunUsd: 0 })
  expect(cfg.engines[cfg.defaultEngine]!.dailyAttemptCap).toBeUndefined()
  expect(runtimeConfig(integration, state).engines[repair.engine]!.dailyAttemptCap).toBeUndefined()
  expect(researchModels(reports, reports.projects.find(p => p.repo === repair.repo)!)).toEqual({ model: 'swe-1-7', reviewer: 'glm-5-2',
    reviewPolicy: { excludedModels: ['swe-1-7'] }, policy: { tierMode: 'free-only', transport: 'devin-cli', command: 'devin.exe' } })
  const subscriptionTags = Object.keys(cfg.engines).filter(tag => cfg.engines[tag]?.subscription)
  for (const id of ['0', '1', '2', 'ffffffff']) for (let failCount = 0; failCount < 3; failCount++) {
    expect(pickCandidateTags({ tierMode: cfg.tierMode, rotation: cfg.engineRotation, defaultEngine: cfg.defaultEngine, task: { id }, failCount, subscriptionTags })).toEqual(['devin'])
  }
  expect(pickCandidateTags({ rotation: cfg.engineRotation, defaultEngine: cfg.defaultEngine, task: { id: '0' }, failCount: 0, subscriptionTags,
    dailyAttemptCaps: dailyAttemptCapsFromEngines(cfg.engines), todayAttemptCounts: new Map([['devin', 1_000_000]]) })).toEqual(['devin'])
})

test('CLI 研究拒絕同模型自審；非 CLI 專案保留既有研究模型', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-model-route-')), sourceConfig = join(dir, 'source.json')
  try {
    const cfg = { research: { model: 'legacy' } } as never, project = { sourceConfig } as never
    writeFileSync(sourceConfig, JSON.stringify({ llmTransport: 'cli', judgeModel: 'same', auditModel: 'same' }))
    expect(() => researchModels(cfg, project)).toThrow(/different audit model/)
    writeFileSync(sourceConfig, JSON.stringify({ llmTransport: 'http', judgeModel: 'other' }))
    expect(researchModels(cfg, project).model).toBe('legacy')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
