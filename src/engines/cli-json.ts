import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { z } from 'zod'
import { runProcess } from './proc.js'
import { buildFleetCodexEnv } from './codex-runtime.js'

export async function codexJson<T>(cfg: { dataDir: string; model: string; effort: string; timeoutMs: number; onUsage?: (totalTokens: number) => void }, schema: z.ZodType<T>, prompt: string): Promise<T> {
  // Resolve the run directory against the caller's cwd before the child process switches cwd to it;
  // otherwise a relative dataDir makes codex exec re-resolve schema/answer beneath the child directory (autodev-ng#7).
  const dir = resolve(join(cfg.dataDir, 'research', randomUUID())); mkdirSync(dir, { recursive: true })
  const schemaFile = join(dir, 'schema.json'), answerFile = join(dir, 'answer.json')
  // Codex Structured Outputs rejects format=uri; Zod still validates the returned URLs locally.
  writeFileSync(schemaFile, JSON.stringify(z.toJSONSchema(schema), (key, value) => key === 'format' ? undefined : value))
  const env = buildFleetCodexEnv(join(homedir(), '.codex'))
  for (const key of Object.keys(env)) if (/^(OPENAI|CODEX)_API_KEY$/i.test(key)) delete env[key]
  const result = await runProcess({ command: 'codex', cwd: dir, stdinText: prompt, timeoutMs: cfg.timeoutMs, maxOutputChars: 16_000,
    env, replaceEnv: true,
    args: ['exec', '--json', '--model', cfg.model, '-c', `model_reasoning_effort=${cfg.effort}`,
      '-c', 'approval_policy="never"', '--sandbox', 'read-only', '--ignore-user-config', '--ignore-rules', '--ephemeral', '--skip-git-repo-check',
      ...['multi_agent', 'multi_agent_v2', 'shell_tool', 'unified_exec', 'code_mode', 'code_mode_host', 'apps', 'plugins', 'browser_use', 'computer_use', 'hooks'].flatMap(f => ['--disable', f]),
      '--output-schema', schemaFile, '--output-last-message', answerFile, '-'] })
  const events = result.stdout.split(/\r?\n/).flatMap(line => { try { return [JSON.parse(line)] } catch { return [] } }) as { type?: string; usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number }; message?: string }[]
  const usage = events.find(e => e.type === 'turn.completed')?.usage
  const count = (n: unknown) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 ? n : 0
  cfg.onUsage?.(usage?.total_tokens === undefined ? count(usage?.input_tokens) + count(usage?.output_tokens) : count(usage.total_tokens))
  writeFileSync(join(dir, 'telemetry.json'), JSON.stringify({ at: new Date().toISOString(), command: 'codex exec', model: cfg.model, effort: cfg.effort, exitCode: result.exitCode, timedOut: result.timedOut, durationMs: result.durationMs,
    usage: events.find(e => e.type === 'turn.completed')?.usage, diagnostics: result.stderr.slice(-4000), errors: events.filter(e => e.type === 'error').map(e => e.message?.slice(0, 2000)) }))
  if (result.exitCode !== 0 || result.timedOut || !events.some(e => e.type === 'turn.completed')) throw new Error('CLI model failed; no fallback approval (see local research telemetry)')
  return schema.parse(JSON.parse(readFileSync(answerFile, 'utf8')))
}
