import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { IssueSchema, type GithubConfig, type Issue } from './config.js'

const ControlReasonSchema = z.enum(['stopped', 'cost-hard-stop', 'idle', 'deferred', 'preflight-failed', 'daily-attempt-cap', 'not-started'])
export type ControlReason = z.infer<typeof ControlReasonSchema>
export const MAX_CONTROL_RUNS = 5
const StateSchema = z.object({
  repo: z.string(), base: z.string(), issue: IssueSchema, fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  status: z.enum(['queued', 'running', 'ready', 'published', 'blocked', 'cancelled']),
  runs: z.number().int().nonnegative(), nextRunAt: z.number(),
  controlRuns: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
  controlReason: ControlReasonSchema.optional(),
  candidateCheck: z.object({
    schema: z.literal('github-candidate-checkpoint/v1'), at: z.string().datetime(),
    policyHash: z.string().regex(/^[a-f0-9]{64}$/),
    attempts: z.number().int().min(0).max(5), phase: z.enum(['issue-read', 'publication-read']),
    receiptRefs: z.array(z.string().regex(/^(?:evidence|(?:regression|acceptance|quality|repair-probe)-[a-f0-9]{40,64}\.json)$/)).min(1).max(5),
  }).strict().optional(),
  alternativeRetryPending: z.boolean().optional(),
  revision: z.object({ round: z.number().int().positive().max(5), baseCommit: z.string().regex(/^[a-f0-9]{40,64}$/), feedback: z.string().min(1).max(20000), key: z.string() }).optional(),
  remote: z.object({ at: z.string(), head: z.string(), state: z.enum(['open', 'closed', 'merged']), checks: z.enum(['pass', 'fail', 'pending', 'unknown']), feedback: z.string(), key: z.string() }).optional(),
  acceptance: z.object({ commit: z.string(), at: z.string(), actor: z.string(), evidence: z.string().min(8).max(2000) }).optional(),
  history: z.array(z.object({ at: z.string().datetime(), status: z.string(), runs: z.number().int().nonnegative(), detail: z.string().optional(), controlRuns: z.number().int().nonnegative().optional(), controlReason: ControlReasonSchema.optional(), source: z.literal('legacy-snapshot').optional(), phase: z.literal('candidate-check').optional() })).optional(),
  reconciliation: z.object({ at: z.string().datetime(), key: z.string().regex(/^[a-f0-9]{64}$/), kind: z.string(), receipt: z.string().regex(/^reconciliation-[a-f0-9-]+\.json$/) }).optional(),
  baseSha: z.string().regex(/^[a-f0-9]{40,64}$/).optional(), commit: z.string().regex(/^[a-f0-9]{40,64}$/).optional(), pr: z.string().url().optional(), detail: z.string().optional(),
  lastObservedAt: z.number().optional(),
  lastObservedSeq: z.number().int().nonnegative().optional(),
})
export type IssueState = z.infer<typeof StateSchema>
export function candidatePolicyHash(cfg: GithubConfig): string {
  return createHash('sha256').update(JSON.stringify([cfg, readFileSync(cfg.sourceConfig, 'utf8'),
    cfg.repair ? readFileSync(cfg.repair.reportConfig, 'utf8') : null])).digest('hex')
}
export function alternativeRunPending(cfg: GithubConfig, state: IssueState): boolean {
  if (!state.alternativeRetryPending || state.runs !== cfg.maxRuns) return false
  const source = JSON.parse(readFileSync(cfg.sourceConfig, 'utf8')) as { alternativeRetry?: boolean; tierMode?: string }
  return source.alternativeRetry === true && source.tierMode !== 'free-only'
}
export const issueDir = (cfg: GithubConfig, number: number): string => join(cfg.dataDir, `issue-${number}`)
export const runDir = (cfg: GithubConfig, state: IssueState): string => state.revision ? join(issueDir(cfg, state.issue.number), 'revisions', String(state.revision.round)) : issueDir(cfg, state.issue.number)
export const branchFor = (number: number): string => `autodev/issue-${number}`
export function fingerprint(issue: Issue): string {
  return createHash('sha256').update(JSON.stringify([issue.number, issue.title, issue.body, issue.user.login.toLowerCase()])).digest('hex')
}
export function readState(cfg: GithubConfig, number: number): IssueState | undefined {
  const file = join(issueDir(cfg, number), 'state.json')
  if (!existsSync(file)) return undefined
  const state = StateSchema.parse(JSON.parse(readFileSync(file, 'utf8')))
  if (state.repo !== cfg.repo || state.base !== cfg.base || state.issue.number !== number) throw new Error('Issue state repository/base mismatch')
  return state
}
export function saveState(cfg: GithubConfig, state: IssueState): void {
  const dir = issueDir(cfg, state.issue.number)
  mkdirSync(dir, { recursive: true })
  const previous = readState(cfg, state.issue.number)
  if (!previous || previous.status !== state.status || previous.runs !== state.runs || previous.detail !== state.detail
    || previous.controlRuns !== state.controlRuns || previous.controlReason !== state.controlReason) {
    const at = new Date().toISOString()
    const history = previous?.history ?? (previous ? [{ at, status: previous.status, runs: previous.runs, detail: previous.detail, source: 'legacy-snapshot' as const }] : [])
    state.history = [...history, { at, status: state.status, runs: state.runs, detail: state.detail,
      ...(state.controlRuns !== undefined ? { controlRuns: state.controlRuns } : {}), ...(state.controlReason ? { controlReason: state.controlReason } : {}),
      ...(state.candidateCheck ? { phase: 'candidate-check' as const } : {}) }]
  }
  const tmp = join(dir, `state-${randomUUID()}.tmp`)
  writeFileSync(tmp, JSON.stringify(state, null, 2) + '\n')
  renameSync(tmp, join(dir, 'state.json'))
}
export function states(cfg: GithubConfig): IssueState[] {
  if (!existsSync(cfg.dataDir)) return []
  return readdirSync(cfg.dataDir).filter(name => /^issue-[1-9]\d*$/.test(name))
    .map(name => readState(cfg, Number(name.slice(6)))).filter((s): s is IssueState => Boolean(s))
}
