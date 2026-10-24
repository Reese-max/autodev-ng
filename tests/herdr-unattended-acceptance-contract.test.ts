import { describe, expect, test } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DOC = resolve('docs/herdr-unattended-acceptance.md')
const README_DOC = resolve('docs/README.md')

const SUB_ISSUES = [32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49] as const
const ACCEPTANCE = ['A1', 'A2', 'A3', 'A4', 'A5'] as const
const STATUSES = ['NOT_RUN', 'PASS', 'FAIL', 'BLOCKED', 'WAITING_HUMAN'] as const
const VERDICTS = ['PASS', 'INCOMPLETE', 'HALTED'] as const
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

function verdictRule(): string {
  const line = docText()
    .split('\n')
    .find((l) => l.includes('總體判定'))
  if (!line) throw new Error('doc must define a 總體判定 (overall verdict) rule')
  return line
}

describe('herdr unattended acceptance contract (issue #31)', () => {
  test('doc enumerates every sub-issue, acceptance criterion, status vocabulary and halt kinds', () => {
    const doc = docText()
    for (const issue of SUB_ISSUES) {
      expect(doc, `missing sub-issue #${issue}`).toContain(`#${issue}`)
    }
    for (const criterion of ACCEPTANCE) {
      expect(doc, `missing acceptance criterion ${criterion}`).toContain(criterion)
    }
    for (const token of [...STATUSES, ...VERDICTS, ...HALT_KINDS]) {
      expect(doc, `missing contract token ${token}`).toContain(token)
    }
  })

  test('overall verdict rule pins PASS to all five acceptance criteria and empty hardFailures', () => {
    const clause = verdictRule().match(/`PASS`（([^）]*)）/)
    expect(clause, 'verdict rule must define a `PASS`（…）clause').not.toBeNull()
    const passClause = clause![1]
    for (const criterion of ACCEPTANCE) {
      expect(passClause, `PASS clause must require ${criterion}`).toContain(criterion)
    }
    expect(passClause, 'PASS clause must require all criteria, not any').toContain('全數')
    expect(passClause, 'PASS clause must require `PASS` on the criteria').toContain('`PASS`')
    expect(passClause, 'PASS clause must require empty hardFailures').toContain('`hardFailures`')
    expect(passClause, 'PASS clause must require hardFailures to be empty').toContain('為空')
  })

  test.each([
    ['A1', ['release SHA', '阻擋式 CI', '精確版本', '模型', '任務證據', 'mock']],
    ['A2', ['同一任務', '兩個', '寫入', '斷線', '逾時', '重啟', '不盲目重送', '隔離', '預算']],
    ['A3', ['每個符合條件的 repo', '服務界限', '派工', 'blocked', 'waiting-human', '理由', '恢復條件']],
    ['A4', ['另外授權', '單機', '3–5 個測試 repo', '1 個 Worker', '真實流程', '72 小時', '人工介入', '恢復', '重複執行', '假成功', '最長等待', '成本已知／未知']],
    ['A5', ['開機', '外部離線告警', '備份還原', '回滾', '實證', '候選通過', '草稿 PR', '人工合併', '部署', '不新增排程', '不自動合併／部署', '不搬移秘密', '跨機接手']],
  ])('%s preserves the corresponding acceptance gate from issue #31', (criterion, requirements) => {
    const row = docText().split('\n').find(line => line.startsWith(`| ${criterion} |`))
    for (const requirement of requirements) {
      expect(row, `${criterion} must require ${requirement} before overall PASS`).toContain(requirement)
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
    const acceptance = record.acceptance as Record<string, { status: string; evidence: unknown[] }>
    expect(Object.keys(acceptance).sort()).toEqual([...ACCEPTANCE].sort())
    for (const criterion of ACCEPTANCE) {
      expect(acceptance[criterion]?.status).toBe('NOT_RUN')
      expect(Array.isArray(acceptance[criterion]?.evidence)).toBe(true)
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
