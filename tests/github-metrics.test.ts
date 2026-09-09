import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { GithubConfigSchema } from '../src/github/config.js'
import { repairMetrics } from '../src/github/operations.js'
import { fingerprint, type IssueState } from '../src/github/state.js'

test('legacy failures remain visible without inventing history, counting retries twice or rewriting state', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-metrics-'))
  try {
    const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: 'unused', dataDir: dir, engine: 'writer', enabled: true })
    const issue = { number: 4, title: 'Fix it', body: '', user: { login: 'owner' }, labels: [], state: 'open' as const }
    const state: IssueState = { repo: cfg.repo, base: cfg.base, issue, fingerprint: fingerprint(issue), status: 'queued', runs: 3, nextRunAt: 0, detail: 'failed' }
    mkdirSync(join(dir, 'issue-4'))
    const file = join(dir, 'issue-4/state.json'), pause = join(dir, '.adng.stop')
    writeFileSync(file, JSON.stringify(state)); writeFileSync(pause, 'Preserve pause')
    expect(repairMetrics(cfg)).toMatchObject({ recordedFailedAttempts: 1, failedAttempts: null, failureHistoryIncompleteIssues: 1, needsAttention: 1, attempts: 3 })
    expect(readFileSync(file, 'utf8')).toBe(JSON.stringify(state))
    expect(readFileSync(pause, 'utf8')).toBe('Preserve pause')

    state.runs = 1
    state.history = [
      { at: new Date().toISOString(), status: 'queued', runs: 0 },
      { at: new Date().toISOString(), status: 'running', runs: 1 },
      { at: new Date().toISOString(), status: 'queued', runs: 1, detail: 'failed' },
      { at: new Date().toISOString(), status: 'queued', runs: 1, detail: 'Recovery: environment fixed' },
    ]
    writeFileSync(file, JSON.stringify(state))
    expect(repairMetrics(cfg)).toMatchObject({ recordedFailedAttempts: 1, failedAttempts: 1, failureHistoryIncompleteIssues: 0, repeatedFailureIssues: 0 })
    rmSync(pause)
    expect(repairMetrics(cfg).needsAttention).toBe(0)
    state.runs = 0; state.history = []; delete state.detail
    writeFileSync(file, JSON.stringify(state))
    expect(repairMetrics(cfg)).toMatchObject({ recordedFailedAttempts: 0, failedAttempts: 0, failureHistoryIncompleteIssues: 0, needsAttention: 0, issueCompletionRate: null })
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
