import { z } from 'zod'
import { FLEET_CODEX_PERMISSION_ARGS } from '../engines/codex-runtime.js'

export const GUARDIAN_MODEL = 'gpt-5.6-luna'
export const GUARDIAN_EFFORT = 'max'

const DecisionSchema = z.object({
  status: z.enum(['resolved', 'stable', 'needs_attention']),
  summary: z.string().min(1).max(2_000),
  actions: z.array(z.string().max(1_000)).max(20),
  evidence: z.array(z.string().max(1_000)).max(20),
  followUp: z.string().max(2_000),
  restartRequired: z.boolean(),
  forceRestart: z.boolean(),
})
export type GuardianDecision = z.infer<typeof DecisionSchema>
export interface GuardianTelemetry {
  inputTokens: number | null
  cachedInputTokens: number | null
  outputTokens: number | null
}

export const DECISION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['resolved', 'stable', 'needs_attention'] },
    summary: { type: 'string' },
    actions: { type: 'array', items: { type: 'string' } },
    evidence: { type: 'array', items: { type: 'string' } },
    followUp: { type: 'string' },
    restartRequired: { type: 'boolean' },
    forceRestart: { type: 'boolean' },
  },
  required: ['status', 'summary', 'actions', 'evidence', 'followUp', 'restartRequired', 'forceRestart'],
  additionalProperties: false,
} as const

export function guardianCodexArgs(schemaPath: string, diagnosisOnly = false): string[] {
  return [
    'exec', '--json', '--model', GUARDIAN_MODEL,
    '-c', `model_reasoning_effort=${GUARDIAN_EFFORT}`,
    '-c', 'approval_policy=never',
    ...(diagnosisOnly ? [
      '-c', 'default_permissions=":read-only"', '-c', 'web_search="disabled"',
      '--disable', 'shell_tool', '--disable', 'unified_exec', '--disable', 'code_mode', '--disable', 'code_mode_host',
      '--disable', 'apps', '--disable', 'plugins', '--disable', 'hooks', '--disable', 'browser_use', '--disable', 'computer_use',
    ] : FLEET_CODEX_PERMISSION_ARGS), '-c', 'windows.sandbox="elevated"',
    '--disable', 'multi_agent', '--disable', 'multi_agent_v2',
    '--ephemeral', '--ignore-user-config', '--skip-git-repo-check', '--output-schema', schemaPath,
  ]
}

export function parseGuardianTelemetry(stdout: string): GuardianTelemetry {
  const telemetry: GuardianTelemetry = { inputTokens: null, cachedInputTokens: null, outputTokens: null }
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim()) continue
    try {
      const event = JSON.parse(line) as { type?: unknown; usage?: Record<string, unknown> }
      if (event.type !== 'turn.completed' || !event.usage) continue
      const number = (key: string): number | null => typeof event.usage?.[key] === 'number' ? event.usage[key] : null
      telemetry.inputTokens = number('input_tokens')
      telemetry.cachedInputTokens = number('cached_input_tokens')
      telemetry.outputTokens = number('output_tokens')
    } catch { /* 非 JSON 診斷行不影響最終用量。 */ }
  }
  return telemetry
}

export function parseGuardianDecision(stdout: string): GuardianDecision {
  let completed = false
  let message = ''
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim()) continue
    let event: Record<string, unknown>
    try { event = JSON.parse(line) as Record<string, unknown> } catch { continue }
    if (event.type === 'turn.completed') completed = true
    if (event.type === 'item.completed') {
      const item = event.item as Record<string, unknown> | undefined
      if (item?.type === 'agent_message' && typeof item.text === 'string') message = item.text
    }
  }
  if (!completed || !message) throw new Error('Codex exit 0 但缺少 turn.completed 或最終訊息')
  return DecisionSchema.parse(JSON.parse(message))
}
