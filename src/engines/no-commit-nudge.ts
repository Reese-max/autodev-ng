import type { Engine, Job, RunResult } from '../types.js'
import { defaultCommitHash } from './commit-hash.js'

const NO_COMMIT_NUDGE = '你宣稱完成但 worktree 無新 commit；已完成請執行 git add 與 git commit，未完成請如實回報。'

/** 同一 attempt 最多補發一次；呼叫端不重入本函式，因此不會形成 nudge 迴圈。 */
export async function nudgeNoCommit(
  engine: Engine,
  job: Job,
  initial: RunResult,
  fallbackBaseCommit: string,
  getCommitHash: (cwd: string) => string | undefined = defaultCommitHash,
): Promise<RunResult> {
  const baseCommitHash = initial.baseCommitHash ?? fallbackBaseCommit
  if (!initial.failureReason?.startsWith('no-commit') || getCommitHash(job.projectPath) !== baseCommitHash) return initial

  let nudged: RunResult
  try {
    nudged = await engine.run({ ...job, directive: NO_COMMIT_NUDGE })
  } catch (err) {
    return {
      ...initial,
      output: joinOutput(initial.output, `[nudge engine error] ${String(err)}`),
      costUnknown: true,
      actualModel: 'multiple/unknown',
      tokensIn: undefined,
      tokensOut: undefined,
      tokensCached: undefined,
      baseCommitHash,
      failureReason: `${initial.failureReason} [nudged]`,
    }
  }

  const combined = combineRuns(initial, nudged)
  const commitHash = getCommitHash(job.projectPath)
  if (!nudged.ok || !commitHash || commitHash === baseCommitHash) {
    return { ...combined, ok: false, commitHash: undefined, baseCommitHash, failureReason: `${initial.failureReason} [nudged]` }
  }
  return { ...combined, ok: true, commitHash, baseCommitHash, failureReason: undefined }
}

function combineRuns(first: RunResult, second: RunResult): RunResult {
  return {
    ...second,
    actualModel: first.actualModel === second.actualModel ? first.actualModel : 'multiple/unknown',
    output: joinOutput(first.output, second.output),
    costUsd: first.costUsd + second.costUsd,
    costUnknown: first.costUnknown || second.costUnknown || undefined,
    tokensIn: add(first.tokensIn, second.tokensIn),
    tokensOut: add(first.tokensOut, second.tokensOut),
    tokensCached: add(first.tokensCached, second.tokensCached),
  }
}

function joinOutput(first: string, second: string): string { return [first, second].filter(Boolean).join('\n') }
function add(a?: number, b?: number): number | undefined { return a === undefined || b === undefined ? undefined : a + b }
