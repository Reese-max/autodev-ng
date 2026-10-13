import { describe, expect, test } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DOC = resolve('docs/herdr-unattended-acceptance.md')
const README_DOC = resolve('docs/README.md')

const SUB_ISSUES = [32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49] as const
const STATUSES = ['NOT_RUN', 'PASS', 'FAIL', 'BLOCKED', 'WAITING_HUMAN'] as const
const VERDICTS = ['INCOMPLETE', 'HALTED'] as const
const HALT_KINDS = [
  'duplicate-writer',
  'unconfirmed-backend',
  'stale-lock-fence',
  'budget-leak',
  'revoked-publish',
  'veto-bypass',
  'uncheckpointed-candidate',
  'parser-fanout-abort',
  'capacity-masquerade',
] as const
const SOURCE_FILES = [
  'src/engines/herdr.ts',
  'src/github/job.ts',
  'src/github/owner.ts',
  'docs/host-deployment.md',
] as const

function docText(): string {
  expect(existsSync(DOC), 'docs/herdr-unattended-acceptance.md must exist').toBe(true)
  return readFileSync(DOC, 'utf8')
}

function recordTemplate(): Record<string, unknown> {
  const match = docText().match(/```json\s*\n([\s\S]*?)```/)
  if (!match?.[1]) throw new Error('doc must embed a ```json unattended-record template')
  return JSON.parse(match[1])
}

describe('herdr unattended acceptance contract (issue #31)', () => {
  test('doc enumerates every sub-issue, status vocabulary and halt kinds', () => {
    const doc = docText()
    for (const issue of SUB_ISSUES) {
      expect(doc, `missing sub-issue #${issue}`).toContain(`#${issue}`)
    }
    for (const token of [...STATUSES, ...VERDICTS, ...HALT_KINDS]) {
      expect(doc, `missing contract token ${token}`).toContain(token)
    }
  })

  test('embedded record template parses and ships every sub-issue NOT_RUN with verdict INCOMPLETE', () => {
    const record = recordTemplate()
    expect(record.version).toBe(1)
    expect(record.verdict).toBe('INCOMPLETE')
    expect(record.parent).toBe('#31')
    const environment = record.environment as Record<string, unknown>
    for (const field of ['node', 'workerCli', 'herdr', 'configSha256', 'singleHost']) {
      expect(environment, `environment.${field} missing`).toHaveProperty(field)
    }
    const subIssues = record.subIssues as Record<string, { status: string; evidence: unknown[] }>
    expect(Object.keys(subIssues).sort()).toEqual(SUB_ISSUES.map((n) => `#${n}`).sort())
    for (const issue of SUB_ISSUES) {
      expect(subIssues[`#${issue}`]?.status).toBe('NOT_RUN')
      expect(Array.isArray(subIssues[`#${issue}`]?.evidence)).toBe(true)
    }
    expect((record.hardFailures as unknown[]).length).toBe(0)
  })

  test('source-of-truth files referenced by the tracker still exist at their documented paths', () => {
    const doc = docText()
    for (const file of SOURCE_FILES) {
      expect(doc, `tracker must reference ${file}`).toContain(file)
      expect(existsSync(resolve(file)), `${file} moved or was removed`).toBe(true)
    }
    expect(readFileSync(README_DOC, 'utf8')).toContain('herdr-unattended-acceptance')
  })
})
