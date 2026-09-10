import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { z } from 'zod'
import { resolveSecretString } from './assemble.js'

const Config = z.object({
  apiKey: z.string().regex(/^\{(?:env:[A-Za-z_][A-Za-z0-9_]*|file:.+)\}$/),
  orgId: z.string().min(1).optional(),
}).strict()
const Identity = z.object({
  principal_type: z.string().regex(/^[a-z_]{1,40}$/),
  org_id: z.string().regex(/^[A-Za-z0-9_-]{1,160}$/).nullable().optional(),
})

/** Only GET /v3/self: this integration cannot start a billable session. */
export async function devinApiStatus(configPath: string) {
  let raw: unknown
  try { raw = JSON.parse(readFileSync(configPath, 'utf8')) }
  catch { throw new Error('Devin API config is missing, unreadable or invalid JSON') }
  const parsed = Config.safeParse(raw)
  if (!parsed.success) throw new Error('Devin API config requires an apiKey secret reference and optional orgId')
  const apiKey = resolveSecretString(parsed.data.apiKey, dirname(resolve(configPath)))!
  if (!/^cog_[A-Za-z0-9_-]+$/.test(apiKey)) throw new Error('Devin API requires a cog_ credential')
  let response: Response
  try {
    response = await fetch('https://api.devin.ai/v3/self', {
      method: 'GET', headers: { Authorization: `Bearer ${apiKey}` },
      redirect: 'error', signal: AbortSignal.timeout(15_000),
    })
  } catch { throw new Error('Devin API connection failed or timed out') }
  if (!response.ok) throw new Error(`Devin API authentication failed (HTTP ${response.status})`)
  const identity = Identity.safeParse(await response.json().catch(() => undefined))
  if (!identity.success) throw new Error('Devin API returned an invalid identity response')
  if (parsed.data.orgId && identity.data.org_id !== parsed.data.orgId) throw new Error('Devin API organization does not match the configured orgId')
  return {
    connected: true, httpStatus: response.status, principalType: identity.data.principal_type,
    orgId: identity.data.org_id ?? null, cloudExecutionEnabled: false,
  }
}

export async function devinApiCli(argv: string[]): Promise<void> {
  const { values, positionals } = parseArgs({ args: argv, options: { config: { type: 'string' } }, allowPositionals: true, strict: true })
  if (positionals.length !== 1 || positionals[0] !== 'status') throw new Error('Usage: adng devin-api status [--config <path>]')
  const configPath = values.config ?? join(homedir(), '.adng', 'devin-api.json')
  console.log(JSON.stringify(await devinApiStatus(configPath), null, 2))
}
