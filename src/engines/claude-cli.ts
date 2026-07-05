import { execFileSync } from 'node:child_process'
import type { Engine, Job, PreflightResult, RunResult } from '../types.js'
import { runProcess } from '../proc.js'
import type { PreflightCache } from '../preflight.js'

export interface ClaudeCliOpts {
  command?: string
  baseArgs?: string[]
  timeoutMs?: number
  pingTimeoutMs?: number
  cache: PreflightCache
  getCommitHash?: (cwd: string) => string | undefined
}

/** 第一顆真引擎。所有子進程細節交給 runProcess（鐵三角），本檔只管組 prompt 與解讀結果。 */
export class ClaudeCliEngine implements Engine {
  readonly id = 'claude-cli'
  private readonly command: string
  private readonly baseArgs: string[]
  private readonly timeoutMs: number
  private readonly pingTimeoutMs: number
  private readonly cache: PreflightCache
  private readonly getCommitHash: (cwd: string) => string | undefined

  constructor(opts: ClaudeCliOpts) {
    this.command = opts.command ?? 'claude'
    this.baseArgs = opts.baseArgs ?? ['-p', '--output-format', 'json', '--dangerously-skip-permissions']
    this.timeoutMs = opts.timeoutMs ?? 15 * 60 * 1000
    this.pingTimeoutMs = opts.pingTimeoutMs ?? 90 * 1000 // 舊教訓：cold start 可達 40s+
    this.cache = opts.cache
    this.getCommitHash = opts.getCommitHash ?? defaultCommitHash
  }

  async preflight(): Promise<PreflightResult> {
    const cached = this.cache.get(this.command)
    if (cached) return cached
    let result: PreflightResult
    try {
      const r = await runProcess({
        command: this.command, args: this.baseArgs, cwd: process.cwd(),
        stdinText: 'Reply with exactly: PONG', timeoutMs: this.pingTimeoutMs
      })
      result = r.stdout.includes('PONG')
        ? { ok: true, detail: `PONG ${r.durationMs}ms` }
        : { ok: false, detail: r.timedOut ? 'ping timeout' : `no PONG (exit ${r.exitCode}) ${r.stderr.slice(0, 120)}` }
    } catch (err) {
      result = { ok: false, detail: String(err).slice(0, 200) }
    }
    this.cache.set(this.command, result) // 壞結果也 cache：避免對死引擎連環重打
    return result
  }

  async run(job: Job): Promise<RunResult> {
    const prompt = [
      `你是自動開發工人。完成以下這一項任務，並在完成後 git commit（conventional commit，zh-TW）。`,
      `嚴禁超出任務範圍、嚴禁動 BACKLOG.md、嚴禁自行新增任務。`,
      `任務：${job.task.text}`
    ].join('\n')

    const before = this.getCommitHash(job.projectPath)
    const r = await runProcess({
      command: this.command, args: this.baseArgs, cwd: job.projectPath,
      stdinText: prompt, timeoutMs: this.timeoutMs
    })

    if (r.timedOut) return { ok: false, output: tail(r.stderr), costUsd: 0, failureReason: 'timeout' }
    if (r.exitCode !== 0) {
      return { ok: false, output: tail(r.stderr), costUsd: 0, failureReason: `exit ${r.exitCode}: ${r.stderr.slice(0, 200)}` }
    }

    const parsed = parseResultJson(r.stdout)
    if (!parsed) {
      return { ok: false, output: tail(r.stdout), costUsd: 0, failureReason: 'empty-or-unparseable output（exit 0 零輸出 ≠ 成功）' }
    }
    const costUsd = typeof parsed.total_cost_usd === 'number' ? parsed.total_cost_usd : 0
    if (parsed.is_error === true) {
      return { ok: false, output: tail(r.stdout), costUsd, failureReason: String(parsed.subtype ?? 'is_error') }
    }

    const after = this.getCommitHash(job.projectPath)
    if (after === undefined || after === before) {
      return { ok: false, output: tail(r.stdout), costUsd, failureReason: 'no-commit(phantom completion?)' }
    }
    return { ok: true, output: tail(r.stdout), costUsd, commitHash: after }
  }
}

function parseResultJson(stdout: string): Record<string, unknown> | null {
  const text = stdout.trim()
  if (text === '') return null
  // claude -p --output-format json 輸出單一 JSON 物件；防禦性取最後一個非空行
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '')
  for (let i = lines.length - 1; i >= 0; i--) {
    try { return JSON.parse(lines[i]!) as Record<string, unknown> } catch { /* 繼續往上找 */ }
  }
  return null
}

function tail(s: string, n = 2000): string {
  return s.length > n ? s.slice(-n) : s
}

function defaultCommitHash(cwd: string): string | undefined {
  try {
    return execFileSync('git', ['-C', cwd, 'rev-parse', 'HEAD'], { encoding: 'utf8', timeout: 10_000 }).trim()
  } catch { return undefined }
}
