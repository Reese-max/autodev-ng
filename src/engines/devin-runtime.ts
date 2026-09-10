import { randomUUID } from 'node:crypto'
import { constants, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { nativeAdmission } from './cli-admission.js'
import { checkCooldown, FreeModelUnavailable, modelIdentity, quarantineFreeModel } from './free-model-policy.js'
import { runProcess, type ProcResult } from './proc.js'

export const DEVIN_COMMAND = 'devin.exe'
export const parseDevinJson = (text: string): unknown => JSON.parse(text.trim().replace(/^```(?:json)?\s*\r?\n([\s\S]*?)\r?\n```$/i, '$1'))
const importsOff = Object.fromEntries(['claude', 'cursor', 'windsurf', 'copilot', 'opencode', 'zed'].map(key => [key, false]))
const disabledTools = ['run_subagent', 'read_subagent', 'handoff', 'create_devin_session', 'skill', 'webfetch', 'web_search',
  'ask_user_question', 'request_scope', 'exit_plan_mode', 'browser_preview', 'close_browser_preview',
  'mcp_list_servers', 'mcp_list_tools', 'mcp_read_resource', 'mcp_call_tool']
const localTools = ['read', 'grep', 'find_file_by_name', 'notebook_read', 'edit', 'write', 'apply_patch', 'notebook_edit',
  'exec', 'shell_command', 'kill_shell', 'get_output', 'write_to_process', 'todo_write', 'update_plan']
const denied = ['mcp__*', 'run_subagent', 'read_subagent', 'handoff', 'create_devin_session', 'skill', 'webfetch', 'web_search', 'fetch']
export const devinEnv = (): Record<string, string> => Object.fromEntries(Object.entries(process.env).filter(([key, value]) => value !== undefined
  && /^(path|systemroot|windir|comspec|temp|tmp|pathext|userprofile|appdata|localappdata|homedrive|homepath|home|xdg_data_home|http_proxy|https_proxy|all_proxy|no_proxy)$/i.test(key))) as Record<string, string>

function configure(cwd: string, dir: string, model: string, textOnly: boolean): string {
  const deny = [...denied, ...(textOnly ? ['read', 'edit', 'write', 'grep', 'glob', 'exec'] : ['Exec(codex)', 'Exec(claude)', 'Exec(opencode)', 'Exec(grok)', 'Exec(qwen)', 'Exec(devin)', 'Write(.devin/**)'])]
  const permissions = { allow: textOnly ? [] : ['read', 'grep', 'glob', 'edit', 'write', 'exec'], deny }
  const file = join(dir, 'user-config.json')
  writeFileSync(file, JSON.stringify({ agent: { model }, subagents_enabled: false, auto_update: false, notify: 'never', attribution: false,
    disabled_tools: [...disabledTools, ...(textOnly ? localTools : [])], read_config_from: importsOff, permissions }))
  const localDir = join(cwd, '.devin'), local = join(localDir, 'config.local.json')
  mkdirSync(localDir, { recursive: true })
  const before = existsSync(local) ? readFileSync(local, 'utf8') : undefined
  const previous = before === undefined ? {} : JSON.parse(before) as Record<string, unknown>
  const next = JSON.stringify({ ...previous, read_config_from: importsOff, permissions: { ...permissions,
    deny: [...new Set([...deny, ...((previous.permissions as { deny?: string[] } | undefined)?.deny ?? [])])] } })
  if (before !== next) {
    if (before !== undefined) {
      const stamp = new Date().toISOString().replace(/[-:]/g, ''), backup = `${local}.bak-${stamp.slice(0, 8)}`
      copyFileSync(local, existsSync(backup) ? `${backup}-${stamp.slice(9, 15)}-${randomUUID().slice(0, 8)}` : backup, constants.COPYFILE_EXCL)
    }
    writeFileSync(local, next)
  }
  return file
}

type Export = { steps?: Array<{ source?: string; message?: string; tool_calls?: unknown[]; extra?: { generation_model?: string };
  observation?: { results?: Array<{ source_call_id?: string; content?: string }> } }>;
  final_metrics?: { total_prompt_tokens?: number; total_completion_tokens?: number; total_cached_tokens?: number } }
export type DevinCallOptions = { dataDir: string; model: string; prompt: string; command?: string; cwd?: string; textOnly?: boolean;
  fallbackModels?: string[]; excludedModels?: string[];
  timeoutMs: number; idleTimeoutMs?: number; control?: Parameters<typeof runProcess>[0]['control']; onActivity?: () => void }

export class DevinRunError extends Error {
  constructor(readonly reason: string, readonly result: ProcResult) { super(`Devin ${reason}`) }
}

/** Fixed native login and explicit Free catalog variant; no HTTP provider, auto model or paid fallback. */
export async function runDevinModel(opts: DevinCallOptions) {
  if (opts.fallbackModels?.length || opts.excludedModels?.some(model => modelIdentity(model) === modelIdentity(opts.model)))
    throw new FreeModelUnavailable('Devin requires an independent fixed reviewer without fallback models')
  checkCooldown(opts)
  opts.control?.signal?.throwIfAborted()
  const dir = resolve(join(opts.dataDir, 'devin-calls', randomUUID()))
  mkdirSync(dir, { recursive: true })
  const cwd = opts.cwd ?? dir, command = opts.command ?? DEVIN_COMMAND, env = devinEnv()
  const versionRun = await runProcess({ command, args: ['--version'], cwd, env, replaceEnv: true, stdinText: '', timeoutMs: 10_000, control: opts.control })
  const version = /^devin (\d+\.\d+\.\d+)\b/m.exec(versionRun.stdout)?.[1]
  if (versionRun.exitCode !== 0 || versionRun.timedOut || !version || version.localeCompare('3000.10.21', 'en', { numeric: true }) < 0)
    throw new Error(`Devin headless requires >=3000.10.21 for disabled_tools; found ${version ?? 'unknown'}; no inference sent`)
  const config = configure(cwd, dir, opts.model, opts.textOnly !== false)
  const admission = await nativeAdmission('devin', { command, model: opts.model, args: ['--config', config], env, replaceEnv: true, timeoutMs: Math.min(opts.timeoutMs || 30_000, 30_000) })
  const receipt = { at: new Date().toISOString(), provider: 'devin-cli', version, requestedModel: opts.model, admission, modelCalls: 0, costUsd: null }
  const save = (extra: object) => writeFileSync(join(dir, 'telemetry.json'), JSON.stringify({ ...receipt, ...extra }, null, 2))
  save({ phase: 'admission' })
  if (admission.model.state !== 'listed' || admission.model.listedId !== opts.model || admission.model.costTier !== 'Free')
    throw new FreeModelUnavailable('Devin requires an exact model UID currently marked Free; no inference sent')
  opts.control?.signal?.throwIfAborted()
  const promptFile = join(dir, 'prompt.txt'), exportFile = join(dir, 'export.json')
  writeFileSync(promptFile, ['Use only the explicitly selected model. Do not use subagents, other AI CLIs, model APIs, cloud handoff, paid tools, or external messages.',
    opts.textOnly !== false ? 'All tools are disabled. Answer only from the supplied data; do not invoke any tool.'
      : 'This is non-interactive. Questions and web tools are disabled. Use the supplied local evidence. If essential input is missing or an action is denied, return BLOCKED with the reason; never work around a denial. Always finish with a non-empty final reply naming the actual changes, checks and commit.', opts.prompt].join('\n'))
  const r = await runProcess({ command, cwd, env, replaceEnv: true, stdinText: '', timeoutMs: opts.timeoutMs, idleTimeoutMs: opts.idleTimeoutMs,
    // ponytail: print mode can be silent while working; use its finite wall limit until native progress events are needed.
    control: opts.textOnly === false && opts.timeoutMs > 0 ? { ...opts.control, idleAction: 'report' } : opts.control, onActivity: opts.onActivity, maxOutputChars: 32_000,
    args: ['--config', config, '-p', '--permission-mode', 'auto', '--respect-workspace-trust', 'false', '--model', opts.model, '--prompt-file', promptFile, '--export', exportFile] })
  receipt.modelCalls = 1
  let actualModel: string | undefined
  const processResult = { exitCode: r.exitCode, timedOut: r.timedOut, timeoutReason: r.timeoutReason, durationMs: r.durationMs }
  function fail(reason: string): never {
    save({ phase: 'failed', ...processResult, reason, actualModel })
    throw new DevinRunError(reason, r)
  }
  save({ phase: 'process-finished', ...processResult })
  if (r.aborted) fail('cancelled')
  if (r.timedOut) fail(`timeout:${r.timeoutReason ?? 'wall'}`)
  if (r.exitCode !== 0) fail(`exit:${r.exitCode}`)
  let exp: Export
  try { exp = JSON.parse(readFileSync(exportFile, 'utf8')) as Export } catch { fail('export-missing-or-invalid') }
  const steps = exp.steps?.filter(step => step.source === 'agent') ?? []
  if (!steps.length || steps.some(step => step.extra?.generation_model !== opts.model)) {
    quarantineFreeModel(opts); save({ phase: 'quarantined', reason: 'model-identity' })
    throw new FreeModelUnavailable('Devin reported a missing or different generation model; route quarantined')
  }
  actualModel = opts.model
  if (opts.textOnly !== false && steps.some(step => step.tool_calls?.length)) throw new FreeModelUnavailable('Devin text role attempted a tool call')
  const answer = steps.at(-1)?.message
  if (typeof answer !== 'string' || !answer.trim()) {
    const rejected = steps.flatMap(step => step.observation?.results ?? []).filter(result => /^Tool execution was rejected\b/.test(result.content ?? ''))
      .map(result => result.source_call_id?.replace(/^functions\./, '').replace(/:\d+$/, '') ?? 'unknown')
    fail(rejected.length ? `tool-rejected:${[...new Set(rejected)].join(',')}` : 'missing-final-answer')
  }
  const count = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0
  const tokensIn = count(exp.final_metrics?.total_prompt_tokens), tokensOut = count(exp.final_metrics?.total_completion_tokens)
  save({ phase: 'completed', actualModel: opts.model, tokensIn, tokensOut, durationMs: r.durationMs })
  return { r, answer, actualModel: opts.model, tokensIn, tokensOut, tokensCached: count(exp.final_metrics?.total_cached_tokens), admission, dir }
}
