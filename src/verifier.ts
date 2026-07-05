import { execFileSync } from 'node:child_process'
import type { Config, Job, RunResult } from './types.js'
import { runVerify } from './verify.js'
import { judgeCommit } from './judge.js'

export interface VerifierCheck { pass: boolean; reason?: string; alerts: string[] }

export interface KernelVerifierOpts {
  cfg: Config
  rollback?: (cwd: string, toHash: string) => boolean
  getDiff?: (cwd: string, baseCommitHash?: string) => string
}

/**
 * engine ok 之後、report done 之前的驗證閘：verify（機械層）→ judge（語義層）→ 兩者皆可觸發 rollback。
 * 鐵律 #4：本類別內部盡量自己吞掉非預期例外，不讓雜訊冒出；scheduler 端仍會再包一層 try/catch 當 pass-with-alert 兜底。
 */
export class KernelVerifier {
  private readonly cfg: Config
  private readonly rollback: (cwd: string, toHash: string) => boolean
  private readonly getDiff: (cwd: string, baseCommitHash?: string) => string

  constructor(opts: KernelVerifierOpts) {
    this.cfg = opts.cfg
    this.rollback = opts.rollback ?? defaultRollback
    this.getDiff = opts.getDiff ?? defaultGetDiff
  }

  async check(job: Job, res: RunResult): Promise<VerifierCheck> {
    const alerts: string[] = []

    const vOut = await runVerify({
      command: this.cfg.verifyCommand,
      cwd: job.projectPath,
      timeoutMs: this.cfg.verifyTimeoutMs
    })
    if (vOut.status === 'fail') {
      this.tryRollback(job.projectPath, res.baseCommitHash)
      return { pass: false, reason: `verify-fail: ${vOut.detail}`, alerts: [] }
    }
    if (vOut.status === 'skip') alerts.push(`verify-skip: ${vOut.detail}`)

    const diff = this.getDiff(job.projectPath, res.baseCommitHash)
    const claim = tail(res.output, 2000)
    const jOut = await judgeCommit(
      { url: this.cfg.judgeUrl, model: this.cfg.judgeModel, apiKey: this.cfg.judgeApiKey },
      claim,
      diff
    )
    if (jOut.verdict === 'MISMATCH') {
      this.tryRollback(job.projectPath, res.baseCommitHash)
      return { pass: false, reason: `judge-mismatch: ${jOut.detail}`, alerts }
    }
    if (jOut.verdict === 'SKIP') alerts.push(`judge-skip: ${jOut.detail}`)

    return { pass: true, alerts }
  }

  private tryRollback(cwd: string, baseCommitHash?: string): void {
    if (!baseCommitHash) return
    try {
      this.rollback(cwd, baseCommitHash)
    } catch {
      // rollback 失敗不可 throw（鐵律 #4）——拒絕原因已經在 reason 裡，這裡只吞錯
    }
  }
}

function defaultRollback(cwd: string, toHash: string): boolean {
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
