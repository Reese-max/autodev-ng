import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { runVerify } from '../verify.js'
import { parseGoal } from './goal.js'

export type GoalQualityGateResult =
  | { ok: true; verifyCommand: string }
  | { ok: false; reason: string }

function shFenceContains(md: string, command: string): boolean {
  return [...md.matchAll(/```sh[^\S\r\n]*\r?\n([\s\S]*?)```/gi)]
    .some(m => (m[1] ?? '').split(/\r?\n/).map(s => s.trim()).filter(Boolean).join(' && ') === command)
}

function detailOf(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).replace(/\s+/g, ' ').slice(0, 240)
}

function verifyEnv(projectPath: string): Record<string, string> | undefined {
  const modules = join(projectPath, 'node_modules')
  if (!existsSync(modules)) return undefined
  const bin = join(modules, '.bin')
  return {
    PATH: [bin, process.env.PATH].filter(Boolean).join(delimiter),
    NODE_PATH: [modules, process.env.NODE_PATH].filter(Boolean).join(delimiter)
  }
}

/** 在新建 detached worktree 跑驗收，絕不讓候選指令讀寫主工作區。 */
export async function gateAuthoredGoal(
  md: string, opts: { projectPath: string; verifyTimeoutMs: number }
): Promise<GoalQualityGateResult> {
  const goal = parseGoal(md)
  const command = goal.verifyCommand?.trim()
  if (!command) return { ok: false, reason: 'verify-command-missing' }
  if (!shFenceContains(md, command)) return { ok: false, reason: 'verify-sh-fence-missing' }

  const root = mkdtempSync(join(tmpdir(), 'adng-goal-gate-'))
  const cwd = join(root, 'worktree')
  let added = false
  try {
    execFileSync('git', ['worktree', 'add', '--detach', cwd, 'HEAD'], {
      cwd: opts.projectPath, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30_000, windowsHide: true
    })
    added = true
    const result = await runVerify({ command, cwd, timeoutMs: opts.verifyTimeoutMs, env: verifyEnv(opts.projectPath) })
    if (result.status === 'fail') return { ok: true, verifyCommand: command }
    return { ok: false, reason: result.status === 'pass' ? `verify-green: ${result.detail}` : `verify-unverifiable: ${result.detail}` }
  } catch (error) {
    return { ok: false, reason: `verify-unverifiable: isolated-worktree ${detailOf(error)}` }
  } finally {
    if (added) {
      try { execFileSync('git', ['worktree', 'remove', '--force', cwd], { cwd: opts.projectPath, stdio: 'ignore', timeout: 30_000, windowsHide: true }) } catch { /* 隔離清理失敗不改寫驗收結論。 */ }
    }
    try { rmSync(root, { recursive: true, force: true, maxRetries: 3 }) } catch { /* 同上。 */ }
  }
}
