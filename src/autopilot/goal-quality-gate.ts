import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { runVerify } from '../verify.js'
import { parseGoal } from './goal.js'

export type GoalQualityGateResult =
  | { ok: true; verifyCommand?: string; warning?: string }
  | { ok: false; reason: string }

function shFenceContains(md: string, command: string): boolean {
  return [...md.matchAll(/```sh[^\S\r\n]*\r?\n([\s\S]*?)```/gi)]
    .some(m => (m[1] ?? '').split(/\r?\n/).map(s => s.trim()).filter(Boolean).join(' && ') === command)
}

function detailOf(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).replace(/\s+/g, ' ').slice(0, 240)
}

export function goalVerifyEnv(projectPath: string): Record<string, string> | undefined {
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
  let root: string | undefined
  let cwd: string | undefined
  let added = false
  let result: GoalQualityGateResult = { ok: true, warning: 'gate-not-run' }
  try {
    const goal = parseGoal(md)
    const command = goal.verifyCommand?.trim()
    if (!command) {
      result = { ok: false, reason: 'verify-command-missing' }
    } else if (command.includes('`')) {
      result = { ok: false, reason: 'verify-command-contains-backtick' }
    } else if (!shFenceContains(md, command)) {
      result = { ok: false, reason: 'verify-sh-fence-missing' }
    } else {
      root = mkdtempSync(join(tmpdir(), 'adng-goal-gate-'))
      cwd = join(root, 'worktree')
      execFileSync('git', ['worktree', 'add', '--detach', cwd, 'HEAD'], {
        cwd: opts.projectPath, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30_000, windowsHide: true
      })
      added = true
      const verification = await runVerify({ command, cwd, timeoutMs: opts.verifyTimeoutMs, env: goalVerifyEnv(opts.projectPath) })
      if (verification.status === 'fail') result = { ok: true, verifyCommand: command }
      else if (verification.status === 'pass') result = { ok: false, reason: `verify-green: ${verification.detail}` }
      else result = { ok: true, verifyCommand: command, warning: `verify-unverifiable: ${verification.detail}` }
    }
  } catch (error) {
    result = { ok: true, warning: `gate-exception: ${detailOf(error)}` }
  } finally {
    const cleanupErrors: string[] = []
    if (added) {
      try { execFileSync('git', ['worktree', 'remove', '--force', cwd!], { cwd: opts.projectPath, stdio: 'ignore', timeout: 30_000, windowsHide: true }) } catch (error) { cleanupErrors.push(detailOf(error)) }
    }
    if (root) {
      try { rmSync(root, { recursive: true, force: true, maxRetries: 3 }) } catch (error) { cleanupErrors.push(detailOf(error)) }
    }
    if (cleanupErrors.length) result = { ok: true, warning: `gate-cleanup: ${cleanupErrors.join('｜').slice(0, 240)}` }
  }
  return result
}
