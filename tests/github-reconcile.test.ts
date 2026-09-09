import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, vi } from 'vitest'
import { GithubConfigSchema } from '../src/github/config.js'
import type { GithubClient } from '../src/github/client.js'
import { fingerprint, readState, type IssueState } from '../src/github/state.js'
import { reconcileIssue } from '../src/github/reconcile.js'
import { repairMetrics } from '../src/github/operations.js'

test('merged PR reconciliation is read-only by default, preserves legacy failure/pause and never claims worker success', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-reconcile-'))
  try {
    const source = join(dir, 'source.json'), file = join(dir, 'github.json')
    writeFileSync(source, '{}')
    const cfg = GithubConfigSchema.parse({ repo: 'owner/project', authors: ['owner'], sourceConfig: source, dataDir: dir, engine: 'writer', enabled: true })
    writeFileSync(file, JSON.stringify(cfg)); mkdirSync(join(dir, 'issue-4'))
    const issue = { number: 4, title: 'Fix it', body: 'Old requirement', state: 'open' as const, labels: [{ name: 'autodev' }], user: { login: 'owner' } }
    const state: IssueState = { repo: cfg.repo, base: cfg.base, issue, fingerprint: fingerprint(issue), status: 'queued', runs: 1, nextRunAt: 123, detail: 'failed' }
    const stateFile = join(dir, 'issue-4/state.json'), pause = join(dir, '.adng.stop')
    writeFileSync(stateFile, JSON.stringify(state)); writeFileSync(pause, 'Original pause')
    const merged = { number: 5, html_url: 'https://github.com/owner/project/pull/5', state: 'closed' as const,
      merged: true, merge_commit_sha: 'a'.repeat(40), base: { ref: 'main' }, head: { ref: 'fix', sha: 'b'.repeat(40) } }
    const client: GithubClient = { list: async () => [], issue: async () => ({ ...issue, body: 'New requirement' }),
      findPr: async () => undefined, findLinkedPr: async () => merged.html_url, inspectPr: async () => merged, createPr: vi.fn() }
    const preview = await reconcileIssue(file, 4, { client })
    expect(preview).toMatchObject({ kind: 'merged-pr-found', applied: false, runs: 1, workerDeliveryVerified: false })
    expect(readFileSync(stateFile, 'utf8')).toBe(JSON.stringify(state))
    expect(readdirSync(join(dir, 'issue-4'))).toEqual(['state.json'])

    const applied = await reconcileIssue(file, 4, { client, apply: true, reason: 'Retire superseded attempt; verify merged result separately' })
    expect(applied).toMatchObject({ applied: true, status: 'cancelled', runs: 1, workerDeliveryVerified: false })
    const after = readState(cfg, 4)!
    expect(after.issue).toEqual(issue); expect(after.fingerprint).toBe(state.fingerprint)
    expect(after.commit).toBeUndefined(); expect(after.nextRunAt).toBe(123)
    expect(after.history?.[0]).toMatchObject({ status: 'queued', runs: 1, detail: 'failed', source: 'legacy-snapshot' })
    expect(readFileSync(pause, 'utf8')).toBe('Original pause')
    expect(repairMetrics(cfg)).toMatchObject({ recordedFailedAttempts: 1, failedAttempts: null, verifiedCompletions: 0 })
    const receipt = JSON.parse(readFileSync(join(dir, 'issue-4', after.reconciliation!.receipt), 'utf8'))
    expect(receipt).toMatchObject({ phase: 'completed', before: state, after: { status: 'cancelled', runs: 1 } })
    const stable = readFileSync(stateFile, 'utf8')
    expect(await reconcileIssue(file, 4, { client, apply: true, reason: 'Retire superseded attempt again' })).toMatchObject({ applied: false, alreadyReconciled: true })
    expect(readFileSync(stateFile, 'utf8')).toBe(stable); expect(client.createPr).not.toHaveBeenCalled()

    writeFileSync(stateFile, JSON.stringify(state))
    client.findLinkedPr = async () => 'https://github.com/other/project/pull/5'
    await expect(reconcileIssue(file, 4, { client, apply: true, reason: 'Reject wrong repository evidence' })).rejects.toThrow('outside')
    client.findLinkedPr = async () => merged.html_url
    let reads = 0
    client.issue = async () => ({ ...issue, body: `Changed requirement ${reads++}` })
    await expect(reconcileIssue(file, 4, { client, apply: true, reason: 'Reject remote changes while applying' })).rejects.toThrow('Remote evidence changed')
    expect(readFileSync(stateFile, 'utf8')).toBe(JSON.stringify(state))
    client.issue = async () => issue; client.findLinkedPr = async () => undefined
    expect(await reconcileIssue(file, 4, { client })).toMatchObject({ kind: 'current', applied: false })
    await expect(reconcileIssue(file, 4, { client, apply: true, reason: 'Do not retire a still-current Issue' })).rejects.toThrow('No safe retirement')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
