import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Config, Job, RunResult } from './types.js'
import { runVerify } from './verify.js'
import { judgeCommit } from './judge.js'

export interface VerifierCheck { pass: boolean; reason?: string; alerts: string[] }

export interface KernelVerifierOpts {
  cfg: Config
  rollback?: (cwd: string, toHash: string) => boolean
  getDiff?: (cwd: string, baseCommitHash?: string) => string
  /** 測試注入用：轉給 judgeCommit 的 fetchFn（additive，正常執行走 judgeCommit 內建的 global fetch）。 */
  judgeFetchFn?: typeof fetch
}

/**
 * engine ok 之後、report done 之前的驗證閘：verify（機械層）→ judge（語義層）→ 兩者皆可觸發 rollback。
 * 鐵律 #4：本類別內部盡量自己吞掉非預期例外，不讓雜訊冒出；scheduler 端仍會再包一層 try/catch 當 pass-with-alert 兜底。
 */
export class KernelVerifier {
  private readonly cfg: Config
  private readonly rollback: (cwd: string, toHash: string) => boolean
  private readonly getDiff: (cwd: string, baseCommitHash?: string) => string
  private readonly judgeFetchFn?: typeof fetch

  constructor(opts: KernelVerifierOpts) {
    this.cfg = opts.cfg
    this.rollback = opts.rollback ?? defaultRollback
    this.getDiff = opts.getDiff ?? defaultGetDiff
    this.judgeFetchFn = opts.judgeFetchFn
  }

  async check(job: Job, res: RunResult): Promise<VerifierCheck> {
    const alerts: string[] = []

    const vOut = await runVerify({
      command: this.cfg.verifyCommand,
      cwd: job.projectPath,
      timeoutMs: this.cfg.verifyTimeoutMs
    })
    if (vOut.status === 'fail') {
      this.tryRollback(job.projectPath, res.baseCommitHash, alerts)
      return { pass: false, reason: `verify-fail: ${vOut.detail}`, alerts }
    }
    if (vOut.status === 'skip') alerts.push(`verify-skip: ${vOut.detail}`)

    const diff = this.getDiff(job.projectPath, res.baseCommitHash)
    if (!res.baseCommitHash || !diff) {
      // baseCommitHash 缺失或 diff 拿不到 → judge 只會收到「有宣稱+空 diff」，容易誤判 MISMATCH
      // 導致白白 rollback/扣血。這種情況下跳過 judge，pass 完全交由 verify 結果決定。
      alerts.push('judge-skipped: no baseCommitHash/empty diff')
      return { pass: true, alerts }
    }

    const claim = tail(res.output, 2000)
    const jOut = await judgeCommit(
      { url: this.cfg.judgeUrl, model: this.cfg.judgeModel, apiKey: this.cfg.judgeApiKey, fetchFn: this.judgeFetchFn },
      claim,
      diff
    )
    if (jOut.verdict === 'MISMATCH') {
      this.tryRollback(job.projectPath, res.baseCommitHash, alerts)
      return { pass: false, reason: `judge-mismatch: ${jOut.detail}`, alerts }
    }
    if (jOut.verdict === 'SKIP') alerts.push(`judge-skip: ${jOut.detail}`)

    return { pass: true, alerts }
  }

  private tryRollback(cwd: string, baseCommitHash: string | undefined, alerts: string[]): void {
    if (!baseCommitHash) return
    try {
      const ok = this.rollback(cwd, baseCommitHash)
      if (!ok) alerts.push(`rollback-failed: ${cwd}=>${baseCommitHash}`)
    } catch (err) {
      alerts.push(`rollback-exception: ${String(err).slice(0, 200)}`)
    }
  }
}

/** worktree marker：只有經 adng worktree 管理器建立的目錄才會有這個檔，防止 reset --hard 誤毀
 *  使用者在一般專案目錄（非 adng 管理）裡未提交的工作（紅線 3）。 */
const WORKTREE_MARKER = '.adng-worktree'

function defaultRollback(cwd: string, toHash: string): boolean {
  if (!existsSync(join(cwd, WORKTREE_MARKER))) {
    // 拒絕執行：throw 讓 tryRollback 的 catch 記成 rollback-exception，
    // 與真正 reset 失敗的 rollback-failed 區分開來，兩者在 alerts 都可見但語意不同。
    throw new Error('rollback-refused: not an adng worktree')
  }
  try {
    execFileSync('git', ['-C', cwd, 'reset', '--hard', toHash], { stdio: 'ignore', timeout: 30_000 })
    return true
  } catch {
    return false
  }
}

function defaultGetDiff(cwd: string, baseCommitHash?: string): string {
  if (!baseCommitHash) return ''
  try {
    return execFileSync('git', ['-C', cwd, 'diff', `${baseCommitHash}..HEAD`], {
      encoding: 'utf8', timeout: 30_000, stdio: ['ignore', 'pipe', 'ignore']
    })
  } catch {
    return ''
  }
}

function tail(s: string, n: number): string {
  return s.length > n ? s.slice(-n) : s
}
