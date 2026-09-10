import { createHash } from 'node:crypto'
import { statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const SECRET_NAME = /(?:key|token|secret|password|passwd|authorization|cookie|credential)/i

/** Parse native JSON, JSON arrays or NDJSON; ignore oversized or incomplete events. */
export function cliEvents(stdout: string): Record<string, unknown>[] {
  const objects = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? v : [v])
    .filter((o): o is Record<string, unknown> => !!o && typeof o === 'object' && !Array.isArray(o))
  try { return objects(JSON.parse(stdout)) } catch { /* NDJSON or log prefix */ }
  const events: Record<string, unknown>[] = []
  for (const line of stdout.split(/\r?\n/)) {
    if (line.length > 200_000) continue
    try { events.push(...objects(JSON.parse(line))) } catch { /* partial/log line */ }
  }
  return events
}

export function cliError(event: Record<string, unknown>): boolean {
  return event.is_error === true || !!event.error || /(?:^|[._])(?:error|failed)$/.test(String(event.type))
    || (event.type === 'result' && typeof event.exitCode === 'number' && event.exitCode !== 0)
}

export function redactCli(text: string, env: NodeJS.ProcessEnv = process.env, args: string[] = []): string {
  const secrets = Object.entries(env).filter(([key, value]) => SECRET_NAME.test(key) && value).map(([, value]) => value!)
  for (let i = 0; i < args.length - 1; i++) if (/^--.*(?:api-key|token|password|secret)$/.test(args[i]!)) secrets.push(args[i + 1]!)
  for (const secret of secrets.sort((a, b) => b.length - a.length)) if (secret.length >= 4) text = text.split(secret).join('[REDACTED]')
  return text.replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+\/=-]+/gi, '$1 [REDACTED]')
    .replace(/((?:api[_-]?key|access[_-]?token|auth[_-]?token|password|secret|authorization|cookie)["']?\s*[:=]\s*["']?)[^"'\s,}]+/gi, '$1[REDACTED]')
    .replace(/(https?:\/\/)[^/\s:@]+:[^/\s@]+@/g, '$1[REDACTED]@')
}

/** Preserve the primary structured error and both streams within the existing 2KB output budget. */
export function cliDiagnostic(r: { stdout: string; stderr: string }, env?: NodeJS.ProcessEnv, args: string[] = []): string {
  const errors = [...cliEvents(r.stdout), ...cliEvents(r.stderr)].filter(cliError)
  const fields = ['type', 'code', 'name', 'message', 'error', 'errors', 'result', 'subtype', 'status', 'statusCode', 'exitCode', 'model', 'resetsAt', 'resetAt', 'retry_after', 'data']
  const primary = errors.map(e => JSON.stringify(Object.fromEntries(fields.filter(k => e[k] !== undefined).map(k => [k, e[k]])))).join('\n')
  const safe = (s: string) => redactCli(s, { ...process.env, ...env }, args)
  return [primary ? '[error] ' + safe(primary).slice(0, 950) : '',
    r.stdout.trim() ? '[stdout] ' + safe(r.stdout).slice(-490) : '',
    r.stderr.trim() ? '[stderr] ' + safe(r.stderr).slice(-490) : ''].filter(Boolean).join('\n')
}

/** Bind model/profile arguments and endpoint/auth environment; never store plaintext credentials in keys. */
export function cliPreflightKey(command: string, args: string[], env?: NodeJS.ProcessEnv, provider = ''): string {
  const effective = { ...process.env, ...env }, home = (process.platform === 'win32' ? effective.USERPROFILE : effective.HOME) || homedir()
  const files = ({
    codex: ['auth.json', ...(args.includes('--ignore-user-config') ? [] : ['config.toml'])].map(f => join(effective.CODEX_HOME || join(home, '.codex'), f)),
    'claude-cli': ['.credentials.json', 'settings.json', 'settings.local.json'].map(f => join(effective.CLAUDE_CONFIG_DIR || join(home, '.claude'), f)),
    copilot: ['config.json', 'settings.json'].map(f => join(effective.COPILOT_HOME || join(home, '.copilot'), f)),
    grok: ['auth.json', 'config.toml'].map(f => join(effective.GROK_HOME || join(home, '.grok'), f)),
    qwen: ['oauth_creds.json', 'settings.json'].map(f => join(home, '.qwen', f)),
    devin: [join(home, '.config', 'devin', 'config.json')],
    opencode: [join(effective.XDG_CONFIG_HOME || join(home, '.config'), 'opencode', 'opencode.json'), join(effective.XDG_DATA_HOME || join(home, '.local', 'share'), 'opencode', 'auth.json')],
  } as Record<string, string[]>)[provider] ?? []
  // Only file identity/mtime/size is read, never stored credential contents.
  const stamps = files.map(file => {
    try { const s = statSync(file, { throwIfNoEntry: false }); return [file, s?.ino, s?.mtimeMs, s?.size] }
    catch { return [file, 'unreadable', Date.now()] } // Do not reuse proof when context cannot be inspected.
  })
  const context = Object.entries(effective)
    .filter(([key]) => /^(?:CODEX_|OPENAI_|ANTHROPIC_|CLAUDE_|COPILOT_|GITHUB_|GH_|QWEN_|GROK_|XAI_|DEVIN_|OPENCODE_|XDG_|HOME$|USERPROFILE$|PATH$)/i.test(key) || SECRET_NAME.test(key))
    .sort(([a], [b]) => a.localeCompare(b))
  return 'cli-v2:' + createHash('sha256').update(JSON.stringify([command, args, process.cwd(), context, stamps])).digest('hex')
}

export function cliModel(args: string[]): string | undefined {
  let model: string | undefined
  for (let i = 0; i < args.length; i++) {
    if (['--model', '-m'].includes(args[i]!)) model = args[++i]
    else if (args[i]!.startsWith('--model=')) model = args[i]!.slice(8)
  }
  return model
}

export function codexConfigArgs(args: string[]): string[] {
  const config: string[] = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--strict-config' && !args.includes('--ignore-user-config')) config.push(args[i]!)
    else if (['-c', '--config', '--enable', '--disable'].includes(args[i]!) && args[i + 1]) config.push(args[i]!, args[++i]!)
  }
  return config
}
