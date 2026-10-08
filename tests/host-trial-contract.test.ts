import { describe, expect, test } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DOC = resolve('docs/host-trial-acceptance.md')
const DEPLOY_DOC = resolve('docs/host-deployment.md')

const CRITERIA = [
  'boot-reconnect',
  'fault-injection',
  'backup-restore-rollback',
  'external-offline-alert',
  'trial-72h',
] as const
const STATUSES = ['NOT_RUN', 'PASS', 'FAIL', 'UNSUPPORTED'] as const
const VERDICTS = ['INCOMPLETE', 'HALTED'] as const
const HALT_KINDS = [
  'duplicate-writer',
  'unconfirmed-backend',
  'evidence-mismatch',
  'cost-breach',
  'scope-breach',
] as const
const TOOLS = [
  'scripts/host.mjs',
  'scripts/host-state.mjs',
  'scripts/check-host-heartbeat.mjs',
  'scripts/verify-host-release.mjs',
  'scripts/install-host-task.ps1',
] as const

function docText(): string {
  expect(existsSync(DOC), 'docs/host-trial-acceptance.md must exist').toBe(true)
  return readFileSync(DOC, 'utf8')
}

function recordTemplate(): Record<string, unknown> {
  const match = docText().match(/```json\s*\n([\s\S]*?)```/)
  if (!match?.[1]) throw new Error('doc must embed a ```json trial-record template')
  return JSON.parse(match[1])
}

describe('host trial acceptance contract (issue #38)', () => {
  test('doc enumerates the five canonical criteria, status vocabulary and halt kinds', () => {
    const doc = docText()
    for (const key of [...CRITERIA, ...STATUSES, ...VERDICTS, ...HALT_KINDS]) {
      expect(doc, `missing contract token ${key}`).toContain(key)
    }
  })

  test('embedded record template parses and ships all criteria NOT_RUN with verdict INCOMPLETE', () => {
    const record = recordTemplate()
    expect(record.version).toBe(1)
    expect(record.verdict).toBe('INCOMPLETE')
    expect(record.windowHours).toBe(72)
    expect(Array.isArray(record.authorizedRepos)).toBe(true)
    expect(Array.isArray(record.hardFailures)).toBe(true)
    expect((record.hardFailures as unknown[]).length).toBe(0)
    const environment = record.environment as Record<string, unknown>
    for (const field of ['node', 'workerCli', 'herdr', 'launcher', 'configSha256']) {
      expect(environment, `environment.${field} missing`).toHaveProperty(field)
    }
    const criteria = record.criteria as Record<string, { status: string; evidence: unknown[] }>
    expect(Object.keys(criteria).sort()).toEqual([...CRITERIA].sort())
    for (const key of CRITERIA) {
      expect(criteria[key]?.status).toBe('NOT_RUN')
      expect(Array.isArray(criteria[key]?.evidence)).toBe(true)
    }
  })

  test('trial-72h metrics contract pins the issue hard conditions', () => {
    const criteria = recordTemplate().criteria as Record<string, { metrics?: { required: string[]; zero?: string[] } }>
    const metrics = criteria['trial-72h']?.metrics
    expect(metrics, 'trial-72h must declare a metrics contract').toBeTruthy()
    for (const field of ['observedStart', 'observedEnd', 'counts', 'unscheduledRescues', 'reposWithDeliverables', 'cost']) {
      expect(metrics!.required).toContain(field)
    }
    expect(metrics!.zero?.sort()).toEqual(['costSwitches', 'duplicateWriters', 'unauthorizedWrites'].sort())
  })

  test('runbook only references tools that still exist at their documented paths', () => {
    const doc = docText()
    for (const tool of TOOLS) {
      expect(doc, `runbook must reference ${tool}`).toContain(tool)
      expect(existsSync(resolve(tool)), `${tool} moved or was removed`).toBe(true)
    }
    expect(readFileSync(DEPLOY_DOC, 'utf8')).toContain('host-trial-acceptance')
  })
})
