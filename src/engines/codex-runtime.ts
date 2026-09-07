import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const FLEET_CODEX_PERMISSION_ARGS = [
  '-c', 'default_permissions="workspace-only"',
  '-c', 'permissions.workspace-only.extends=":workspace"',
  // CLI override paths are split on dots, not parsed as TOML keys: quotes become literal path characters.
  '-c', 'permissions.workspace-only.filesystem.:root="deny"',
  '-c', 'permissions.workspace-only.filesystem.:minimal="read"',
  '-c', 'permissions.workspace-only.filesystem.:tmpdir="deny"',
  '-c', 'permissions.workspace-only.filesystem.:slash_tmp="deny"',
  '--enable', 'code_mode', '--enable', 'code_mode_host',
] as const

/** 艦隊 Codex 唯一設定：不載使用者 ~/.codex/config.toml，也不開互動／硬體工具。 */
export const FLEET_CODEX_CONFIG = `approval_policy = "never"
default_permissions = "workspace-only"
allow_login_shell = false
check_for_update_on_startup = false
cli_auth_credentials_store = "file"

[permissions.workspace-only]
extends = ":workspace"

[permissions.workspace-only.filesystem]
":root" = "deny"
":minimal" = "read"
":tmpdir" = "deny"
":slash_tmp" = "deny"

[windows]
sandbox = "elevated"

[shell_environment_policy]
inherit = "core"

[features]
apps = false
browser_use = false
browser_use_external = false
browser_use_full_cdp_access = false
code_mode = true
code_mode_buffered_exec = false
code_mode_host = true
computer_use = false
hooks = false
in_app_browser = false
multi_agent = false
multi_agent_v2 = false
plugins = false
remote_plugin = false
shell_tool = true
unified_exec = false
`

const SECRET_ENV_NAME = /(^|_)(api_?key|private_?key|access_?key|token|secret|password|passwd|credentials?|cookie|session|auth|connection_?string)(_|$)/i
const CODEX_AUTH_ENV = new Set(['CODEX_ACCESS_TOKEN', 'OPENAI_API_KEY'])
const ISOLATED_ENV = new Set(['CODEX_HOME', 'CODEX_THREAD_ID'])

/** 每輪重申最小 config；若被加入 notify/MCP 等內容，下輪會覆回安全基線。 */
export function ensureFleetCodexHome(homeDir: string): string {
  const file = join(homeDir, 'config.toml')
  let current: string | undefined
  try {
    current = readFileSync(file, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  }
  if (current !== FLEET_CODEX_CONFIG) {
    mkdirSync(homeDir, { recursive: true })
    writeFileSync(file, FLEET_CODEX_CONFIG, { encoding: 'utf8', mode: 0o600 })
  }
  return file
}

/** 保留一般作業環境；secret 類變數只允許 Codex auth 與 engine config 明列項目。 */
export function buildFleetCodexEnv(
  homeDir: string,
  overrides: Record<string, string> = {},
  parentEnv: NodeJS.ProcessEnv = process.env,
): Record<string, string> {
  const allowedSecrets = new Set([...CODEX_AUTH_ENV, ...Object.keys(overrides).map(key => key.toUpperCase())])
  const env: Record<string, string> = {}
  for (const [key, value] of Object.entries(parentEnv)) {
    const upper = key.toUpperCase()
    if (value === undefined || ISOLATED_ENV.has(upper)) continue
    if (SECRET_ENV_NAME.test(key) && !allowedSecrets.has(upper)) continue
    env[key] = value
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (!ISOLATED_ENV.has(key.toUpperCase())) env[key] = value
  }
  env.CODEX_HOME = homeDir
  return env
}
