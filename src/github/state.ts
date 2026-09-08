import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { IssueSchema, type GithubConfig, type Issue } from './config.js'

const StateSchema = z.object({
  repo: z.string(), base: z.string(), issue: IssueSchema, fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  status: z.enum(['queued', 'running', 'ready', 'published', 'blocked', 'cancelled']),
  runs: z.number().int().nonnegative(), nextRunAt: z.number(),
  alternativeRetryPending: z.boolean().optional(),
  revision: z.object({ round: z.number().int().positive().max(5), baseCommit: z.string().regex(/^[a-f0-9]{40,64}$/), feedback: z.string().min(1).max(20000), key: z.string() }).optional(),
  remote: z.object({ at: z.string(), head: z.string(), state: z.enum(['open', 'closed', 'merged']), checks: z.enum(['pass', 'fail', 'pending', 'unknown']), feedback: z.string(), key: z.string() }).optional(),
  acceptance: z.object({ commit: z.string(), at: z.string(), actor: z.string(), evidence: z.string().min(8).max(2000) }).optional(),
  history: z.array(z.object({ at: z.string().datetime(), status: z.string(), runs: z.number().int().nonnegative(), detail: z.string().optional() })).optional(),
  baseSha: z.string().regex(/^[a-f0-9]{40,64}$/).optional(), commit: z.string().regex(/^[a-f0-9]{40,64}$/).optional(), pr: z.string().url().optional(), detail: z.string().optional(),
})
export type IssueState = z.infer<typeof StateSchema>
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
  if (!previous || previous.status !== state.status || previous.runs !== state.runs || previous.detail !== state.detail)
    state.history = [...(previous?.history ?? []), { at: new Date().toISOString(), status: state.status, runs: state.runs, detail: state.detail }]
  const tmp = join(dir, `state-${randomUUID()}.tmp`)
  writeFileSync(tmp, JSON.stringify(state, null, 2) + '\n')
  renameSync(tmp, join(dir, 'state.json'))
}
export function states(cfg: GithubConfig): IssueState[] {
  if (!existsSync(cfg.dataDir)) return []
  return readdirSync(cfg.dataDir).filter(name => /^issue-[1-9]\d*$/.test(name))
    .map(name => readState(cfg, Number(name.slice(6)))).filter((s): s is IssueState => Boolean(s))
}
