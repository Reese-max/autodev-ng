import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'

/** Issue #52 checkpoint：`.autodev/CURRENT_STATE.md`。
 * 人類可讀段落 + 機器可讀正本（HTML comment 內 canonical JSON，沿用 adng `<!-- adng:* -->` 慣例）。
 * 新 Conductor session 只靠：規格文件 + 本檔 + 當前 task.yaml + 相關實作檔接手，不靠對話歷史。 */

export const CheckpointStateSchema = z.object({
  schema_version: z.literal(1),
  updated_at: z.string(),
  current_phase: z.string(),
  completed_tasks: z.array(z.object({ task_id: z.string(), commit: z.string() })),
  current_task: z.object({ task_id: z.string(), attempt: z.number().int().nonnegative(), status: z.string() }).nullable(),
  last_known_good_commit: z.string().nullable(),
  verification: z.object({ tests: z.string(), build: z.string(), ci: z.string(), runtime: z.string() }),
  known_issues: z.array(z.string()),
  blocked_items: z.array(z.object({ task_id: z.string(), reason: z.string() })),
  next_action: z.string(),
})
export type CheckpointState = z.infer<typeof CheckpointStateSchema>

const STATE_RE = /<!--\s*adng-state\s*([\s\S]*?)\s*-->/m

export function renderCheckpoint(state: CheckpointState): string {
  const bullets = (items: string[]): string => items.length ? items.map(i => `- ${i}`).join('\n') : '（無）'
  const completed = state.completed_tasks.length
    ? state.completed_tasks.map(t => `- ${t.task_id} @ ${t.commit}`).join('\n') : '（無）'
  const blocked = state.blocked_items.length
    ? state.blocked_items.map(b => `- ${b.task_id}: ${b.reason}`).join('\n') : '（無）'
  return `# CURRENT_STATE

## Current phase
${state.current_phase}

## Completed tasks
${completed}

## Current task
${state.current_task ? `${state.current_task.task_id} attempt ${state.current_task.attempt} (${state.current_task.status})` : '（無）'}

## Last known-good commit
${state.last_known_good_commit ?? '（無）'}

## Verification state
- tests: ${state.verification.tests}
- build: ${state.verification.build}
- CI: ${state.verification.ci}
- runtime: ${state.verification.runtime}

## Known issues
${bullets(state.known_issues)}

## Blocked items
${blocked}

## Next action
${state.next_action}

<!-- adng-state
${JSON.stringify(state, null, 2)}
-->
`
}

export function writeCheckpoint(stateDir: string, state: CheckpointState): string {
  mkdirSync(stateDir, { recursive: true })
  const file = join(stateDir, 'CURRENT_STATE.md')
  writeFileSync(file, renderCheckpoint(CheckpointStateSchema.parse(state)), 'utf8')
  return file
}

/** 讀回 canonical JSON；缺檔/缺 block/壞 schema → undefined（新 session 乾淨起步，不臆造）。 */
export function readCheckpoint(stateDir: string): CheckpointState | undefined {
  const file = join(stateDir, 'CURRENT_STATE.md')
  if (!existsSync(file)) return undefined
  const m = STATE_RE.exec(readFileSync(file, 'utf8'))
  if (!m) return undefined
  try {
    return CheckpointStateSchema.parse(JSON.parse(m[1]!))
  } catch {
    return undefined
  }
}
