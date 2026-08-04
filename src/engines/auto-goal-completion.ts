import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import { isAutoGoal } from '../autopilot/author.js'
import { parseGoal, type Goal } from '../autopilot/goal.js'
import { goalVerifyEnv } from '../autopilot/goal-quality-gate.js'
import type { Config, RunResult, Task } from '../types.js'
import { runVerify } from '../verify.js'
import {
  evaluateAutoGoalCompletionGate,
  type AutoGoalCompletionEvidence,
} from './auto-goal-completion-gate.js'

const MAX_BUFFER = 64 * 1024 * 1024

export type AutoGoalCompletionCheck =
  | { applies: false }
  | { applies: true; ok: true; evidence: AutoGoalCompletionEvidence }
  | { applies: true; ok: false; reason: string; evidence?: AutoGoalCompletionEvidence }

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd, encoding: 'utf8', timeout: 30_000, maxBuffer: MAX_BUFFER,
    stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  })
}

function validCommit(cwd: string, hash: string): boolean {
  try {
    git(cwd, ['cat-file', '-e', `${hash}^{commit}`])
    return true
  } catch {
    return false
  }
}

function changedFiles(cwd: string, base: string, head: string): string[] {
  return git(cwd, ['diff', '--name-only', '-z', `${base}..${head}`, '--']).split('\0').filter(Boolean)
}

function autoGoal(cfg: Config, task: Task): Goal | null | undefined {
  if (task.source !== 'autopilot' || !cfg.goalFile) return undefined
  try {
    const md = readFileSync(cfg.goalFile, 'utf8')
    return isAutoGoal(md) ? parseGoal(md) : undefined
  } catch {
    return null
  }
}

/** 讀 worktree 內 GOAL；不存在時回主工作區版本，讓未追蹤的 auto-goal 仍能用專屬驗收。 */
export function goalVerifyCommand(cfg: Config, worktreePath: string): string | undefined {
  if (!cfg.goalFile) return cfg.verifyCommand
  const rel = relative(resolve(cfg.projectPath), resolve(cfg.goalFile))
  const candidates = isAbsolute(rel) || rel === '..' || rel.startsWith(`..${sep}`)
    ? [cfg.goalFile]
    : [join(worktreePath, rel), cfg.goalFile]
  for (const file of new Set(candidates)) {
    try {
      const command = parseGoal(readFileSync(file, 'utf8').replace(/\r\n/g, '\n')).verifyCommand?.trim()
      if (command) return command
    } catch { /* 試下一個來源。 */ }
  }
  return cfg.verifyCommand
}

/** auto-goal 才執行；順序固定為專屬驗收 → 實際 Git 查詢 → evidence gate。 */
export async function checkAutoGoalCompletion(
  cfg: Config, task: Task, result: RunResult, worktreePath: string, baseBranch: string,
  rebased = false,
  now: () => Date = () => new Date(),
): Promise<AutoGoalCompletionCheck> {
  const goal = autoGoal(cfg, task)
  if (goal === undefined) return { applies: false }
  if (goal === null) return { applies: true, ok: false, reason: 'auto-goal-context-unreadable' }
  const command = goal.verifyCommand?.trim()
  if (!command) return { applies: true, ok: false, reason: 'verify-command-missing' }

  let verification
  try {
    verification = await runVerify({
      command, cwd: worktreePath, timeoutMs: cfg.verifyTimeoutMs, env: goalVerifyEnv(cfg.projectPath),
    })
    const headCommitHash = git(worktreePath, ['rev-parse', 'HEAD']).trim()
    const baseCommitHash = git(worktreePath, ['merge-base', 'HEAD', baseBranch]).trim()
    const commitHash = rebased ? headCommitHash : (result.commitHash ?? '')
    const actualChanges = changedFiles(worktreePath, baseCommitHash, headCommitHash)
    const committedChanges = result.baseCommitHash && result.commitHash
      && validCommit(worktreePath, result.baseCommitHash) && validCommit(worktreePath, result.commitHash)
      ? changedFiles(worktreePath, result.baseCommitHash, result.commitHash) : []
    const expectedChanges = goal.evidenceFiles?.length ? goal.evidenceFiles : committedChanges
    const acceptance = {
      command,
      executed: verification.executed === true,
      exitCode: verification.exitCode ?? null,
      output: verification.detail,
    }
    const timestamp = now().toISOString()
    const resultSummary = `${verification.status}: ${verification.detail}`
    const diff = git(worktreePath, ['diff', `${baseCommitHash}..${headCommitHash}`, '--'])
    const evidence: AutoGoalCompletionEvidence = {
      expectedChanges,
      baseCommitHash,
      commitHash,
      baseCommitValid: validCommit(worktreePath, baseCommitHash),
      commitValid: validCommit(worktreePath, commitHash),
      acceptance,
      headCommitHash,
      changedFiles: actualChanges,
      diff,
      resultSummary,
      timestamp,
      evidence: {
        expectedChanges, baseCommitHash, commitHash, headCommitHash,
        acceptance, changedFiles: actualChanges, diff, resultSummary, timestamp,
      },
    }
    const verdict = evaluateAutoGoalCompletionGate(evidence)
    return verdict.ok ? { applies: true, ok: true, evidence } : { applies: true, ok: false, reason: verdict.reason, evidence }
  } catch (error) {
    return { applies: true, ok: false, reason: `completion-evidence-error:${String(error).replace(/\s+/g, ' ').slice(0, 240)}` }
  }
}
