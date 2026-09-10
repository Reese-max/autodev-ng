import { createHash, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, realpathSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { z } from 'zod'
import type { Config, RunResult, Task } from '../types.js'
import { assertWorktreeCheckout, type WorktreeHandle } from '../worktree.js'
import type { VerificationEvidence } from './evidence-chain.js'

const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const sha = z.string().regex(/^[a-f0-9]{40,64}$/)
const PendingSchema = z.object({ version: z.literal(1), phase: z.enum(['review', 'closed']), taskHash: z.string(), configHash: z.string(),
  engineTag: z.string(), writerModel: z.string().optional(), candidateHead: sha, retryAt: z.number().finite().nonnegative(), updatedAt: z.string(),
  wt: z.object({ cwd: z.string(), branch: z.string(), baseBranch: z.string(), baseHead: sha }),
  result: z.object({ ok: z.literal(true), output: z.string(), costUsd: z.number().nonnegative(), commitHash: sha, baseCommitHash: sha,
    actualModel: z.string().optional(), tokensIn: z.number().optional(), tokensOut: z.number().optional(), tokensCached: z.number().optional() }),
  verification: z.unknown().optional(), reason: z.string(),
})
export type PendingReview = z.infer<typeof PendingSchema>
export function hasPendingReview(cfg: Pick<Config, 'dataDir'>, task: Task): boolean {
  const file = pendingReviewFile(cfg, task)
  if (!existsSync(file)) return false
  try { return JSON.parse(readFileSync(file, 'utf8')).phase !== 'closed' } catch { return true }
}
export function reviewRetryDelay(cfg: Pick<Config, 'dataDir' | 'supplyRetryCooldownMs' | 'tierMode'>, fallback = cfg.supplyRetryCooldownMs, completedReview = false): number {
  const dir = join(cfg.dataDir, 'pending-review')
  try {
    const times = existsSync(dir) ? readdirSync(dir).filter(file => file.endsWith('.json')).map(file => PendingSchema.parse(JSON.parse(readFileSync(join(dir, file), 'utf8'))))
      .filter(state => state.phase === 'review').map(state => state.retryAt) : []
    if (cfg.tierMode === 'free-only' && existsSync(cfg.dataDir)) {
      for (const file of readdirSync(cfg.dataDir).filter(file => /^free-model-wait-[a-f0-9]+\.json$/.test(file))) {
        const state = JSON.parse(readFileSync(join(cfg.dataDir, file), 'utf8')) as { retryAt: number; reviewOnly?: boolean }
        if (!Number.isFinite(state.retryAt)) return fallback
        if (completedReview && state.reviewOnly) continue
        if (state.retryAt > Date.now()) times.push(state.retryAt)
      }
    }
    return times.length ? Math.max(1000, Math.min(...times) - Date.now()) : fallback
  } catch { return fallback }
}
export function pendingReviewFile(cfg: Pick<Config, 'dataDir'>, task: Task): string {
  if (!/^[a-z0-9_-]+$/i.test(task.id)) throw new Error('Invalid pending review task id')
  return join(cfg.dataDir, 'pending-review', `${task.id}.json`)
}
export function pendingReviewNotice(cfg: Pick<Config, 'dataDir'>): string {
  const dir = join(cfg.dataDir, 'pending-review')
  try {
    const states = existsSync(dir) ? readdirSync(dir).filter(file => file.endsWith('.json')).map(file => PendingSchema.parse(JSON.parse(readFileSync(join(dir, file), 'utf8')))).filter(state => state.phase === 'review') : []
    if (!states.length) return '任務保持 open，等待 worker 供應恢復；尚無已保存的待審候選。'
    const pending = states.sort((a, b) => a.retryAt - b.retryAt)[0]!
    return `任務保持 open，候選提交 ${pending.candidateHead.slice(0, 12)} 已保存，等待審查；最早重試 ${new Date(pending.retryAt).toISOString()}，不重派 worker。`
  } catch { return '任務保持 open，等待供應恢復；候選狀態無法讀取，需檢查保存紀錄。' }
}
// Reviewer routes may change while waiting; task, write scope, verification and free-only policy must still match.
const contextHash = (cfg: Config) => hash([resolve(cfg.projectPath), resolve(cfg.worktreesDir), cfg.tierMode, cfg.extraDirective,
  cfg.verifyCommand, cfg.artifactContract, cfg.defaultRisk, cfg.releaseApprovalFile])
function write(cfg: Config, task: Task, pending: PendingReview): void {
  const file = pendingReviewFile(cfg, task)
  mkdirSync(join(cfg.dataDir, 'pending-review'), { recursive: true })
  const tmp = `${file}.${randomUUID()}.tmp`
  writeFileSync(tmp, JSON.stringify(PendingSchema.parse(pending), null, 2)); renameSync(tmp, file)
}
export function readPendingReview(cfg: Config, task: Task): PendingReview | undefined {
  const file = pendingReviewFile(cfg, task)
  if (!existsSync(file)) return undefined
  const pending = PendingSchema.parse(JSON.parse(readFileSync(file, 'utf8')))
  if (pending.phase === 'closed') return undefined
  if (pending.taskHash !== hash(task) || pending.configHash !== contextHash(cfg)) throw new Error('Pending review context changed; candidate preserved')
  if (pending.writerModel !== cfg.engines[pending.engineTag]?.model) throw new Error('Pending writer model changed; original candidate preserved')
  assertPendingCandidate(cfg, task, pending)
  return pending
}
export function assertPendingCandidate(cfg: Config, task: Task, pending: PendingReview): void {
  if (resolve(pending.wt.cwd) !== resolve(cfg.worktreesDir, task.id) || pending.wt.branch !== `adng/${task.id}`) throw new Error('Pending candidate path/branch mismatch')
  assertWorktreeCheckout(pending.wt.cwd, pending.wt.branch, cfg)
  const git = (cwd: string, ...args: string[]) => execFileSync('git', ['-c', `safe.directory=${cwd.replace(/\\/g, '/')}`, ...args], { cwd, timeout: cfg.gitTimeoutMs, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  const common = (cwd: string) => realpathSync.native(resolve(cwd, git(cwd, 'rev-parse', '--git-common-dir')))
  if (common(pending.wt.cwd) !== common(cfg.projectPath) || git(pending.wt.cwd, 'rev-parse', 'HEAD') !== pending.candidateHead
    || pending.result.commitHash !== pending.candidateHead || git(pending.wt.cwd, 'status', '--porcelain', '--untracked-files=normal'))
    throw new Error('Pending candidate changed or is dirty; no worker or merge allowed')
  const marker = JSON.parse(readFileSync(join(pending.wt.cwd, '.adng-worktree'), 'utf8'))
  if (marker.taskId !== task.id) throw new Error('Pending candidate ownership marker mismatch')
  git(pending.wt.cwd, 'merge-base', '--is-ancestor', pending.result.baseCommitHash, pending.candidateHead)
}
export function savePendingReview(cfg: Config, task: Task, wt: WorktreeHandle, result: RunResult, engineTag: string,
  reason: string, retryAt = Date.now(), verification?: VerificationEvidence): PendingReview {
  const pending = PendingSchema.parse({ version: 1, phase: 'review', taskHash: hash(task), configHash: contextHash(cfg), engineTag,
    writerModel: cfg.engines[engineTag]?.model,
    candidateHead: result.commitHash, retryAt, updatedAt: new Date().toISOString(), wt, result, reason,
    verification: verification?.candidateCommit === result.commitHash ? verification : undefined })
  assertPendingCandidate(cfg, task, pending)
  write(cfg, task, pending)
  return pending
}
export function closePendingReview(cfg: Config, task: Task): void {
  const file = pendingReviewFile(cfg, task)
  if (!existsSync(file)) return
  const pending = PendingSchema.parse(JSON.parse(readFileSync(file, 'utf8')))
  write(cfg, task, { ...pending, phase: 'closed', updatedAt: new Date().toISOString() })
}
