import { createHash } from 'node:crypto'
import { z } from 'zod'

/** Issue #52 Task Envelope：Conductor 派給 Worker 的唯一契約。
 * 欄位對齊 issue 規格卡；持久化為 `.autodev/runs/<task_id>/task.yaml`。
 * 刻意不引進 yaml 依賴——serialize 產出固定子集（block seq／雙引號純量），
 * parse 只接受同子集或純 JSON；人類手寫 YAML 亦可，但限同子集語法。 */
/** scope 路徑必須是 repo 內相對路徑：禁絕對路徑、禁 `..` 段、禁反斜線。 */
const relPath = z.string().min(1).refine(
  p => !p.startsWith('/') && !/^[A-Za-z]:[\\/]/.test(p) && !p.split(/[\\/]/).includes('..') && !p.includes('\\'),
  'scope 路徑必須是 repo 相對路徑（不可絕對路徑/../反斜線）',
)

/** tests[] 指令白名單（head token）：擋掉 LLM 分解產生的 curl|sh / rm -rf 一類直達危害。
 * 注意殘餘風險：npm run <script> 等仍可控 package scripts——高風險環境應人工審 envelope。 */
const SAFE_TEST_HEADS = new Set([
  'git', 'node', 'npm', 'npx', 'pnpm', 'yarn', 'vitest', 'tsc', 'eslint', 'prettier',
  'jest', 'mocha', 'cargo', 'go', 'python', 'python3', 'pytest', 'make', 'deno', 'bun',
])
const testCommand = z.string().min(1).refine(
  c => SAFE_TEST_HEADS.has(c.trim().split(/\s+/)[0] ?? ''),
  'tests 指令僅允許開發工具白名單（git/node/npm/npx/vitest/tsc/…），管道與 shell 不接受',
)

export const TaskEnvelopeSchema = z.object({
  /** 檔案/目錄安全字元（task_id 會進 runs/ 目錄名與 worker marker）。 */
  task_id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/),
  phase: z.string().min(1),
  goal: z.string().min(1),
  scope: z.string().min(1),
  /** 絕對禁止修改的路徑（精確或目錄前綴）；命中即驗證失敗，優先於 allowed。 */
  do_not_touch: z.array(relPath).default([]),
  files_to_read: z.array(relPath).default([]),
  /** Worker 可寫範圍白名單（精確檔案或目錄前綴）；空陣列＝唯讀任務，任何改動皆違規。 */
  files_allowed_to_change: z.array(relPath).default([]),
  acceptance_criteria: z.array(z.string().min(1)).min(1),
  /** 機械驗收指令清單（逐一執行，任一 fail 即 attempt 失敗）；空＝無 runtime 證據，結局 UNVERIFIED。 */
  tests: z.array(testCommand).default([]),
  /** Engine tag（registry 白名單鍵；agy/codex/claude/herdr/… 皆走同一 Engine 介面）。 */
  worker: z.string().min(1),
  budget: z.object({
    /** 單次 attempt 牆時限；逾時即中止並計失敗（不信遲到的 ok）。 */
    timeout_ms: z.number().int().positive().optional(),
    /** 單次 Worker 回報金額上限；未知/無效/超額即停止，非 provider 端事前花費限制。 */
    max_cost_usd: z.number().nonnegative().optional(),
  }).default({}),
  /** 同一 worker 重試上限，預設 2（Attempt 1 + 2 retries = 3 次，對齊 issue 圖）。 */
  max_retries: z.number().int().min(0).max(2).default(2),
  /** 立案時的 HEAD；派工前 HEAD 不符＝stale，拒絕上工。 */
  parent_commit: z.string().regex(/^[0-9a-f]{7,64}$/i).optional(),
  stop_conditions: z.array(z.string().min(1)).default([]),
  /** Worker 完工須回報實改檔案與疑點；MVP 一律要求（報告寫 worker-report.md）。 */
  final_report_required: z.boolean().default(true),
})
export type TaskEnvelope = z.infer<typeof TaskEnvelopeSchema>

/** Engine Job.task.id 的 hex 形（agy adapter 對 pkill marker 有 ^[0-9a-f]+$ 白名單）。
 * 16 hex（64bit）降低跨 task 碰撞誤殺 worker 的機率。 */
export function workerTaskId(taskId: string): string {
  return createHash('sha1').update(taskId).digest('hex').slice(0, 16)
}

// ---------------------------------------------------------------------------
// task.yaml 子集序列化
// 支援：scalar（string/number/boolean）、一層 string 陣列（block seq）、
// 一層扁平 object（budget）。空容器以 flow `[]`/`{}` 表達。

function scalar(v: string | number | boolean): string {
  return typeof v === 'string' ? JSON.stringify(v) : String(v)
}

function parseScalar(raw: string): string | number | boolean {
  const t = raw.trim()
  if (t.startsWith('"')) {
    try { const v = JSON.parse(t) as unknown; if (typeof v === 'string') return v } catch { /* fallthrough */ }
    throw new Error(`task.yaml 子集：非法字串純量 ${t.slice(0, 40)}`)
  }
  if (t === 'true' || t === 'false') return t === 'true'
  if (/^-?\d+(?:\.\d+)?$/.test(t)) return Number(t)
  if (t === '' || t === 'null' || t === '~') return ''
  if (/^[^\s"'[\]{},#&*!|>@`][^#]*$/.test(t)) return t.trim() // 裸字串（手寫容忍；# 起註解）
  throw new Error(`task.yaml 子集：不支援的純量 ${t.slice(0, 40)}`)
}

export function serializeTaskEnvelope(env: TaskEnvelope): string {
  const lines: string[] = ['# adng task envelope v1（schema: TaskEnvelopeSchema；回讀僅支援本子集或 JSON）']
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      if (value.length === 0) { lines.push(`${key}: []`); continue }
      lines.push(`${key}:`)
      for (const item of value) lines.push(`  - ${scalar(item)}`)
    } else if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value).filter(([, v]) => v !== undefined)
      if (entries.length === 0) { lines.push(`${key}: {}`); continue }
      lines.push(`${key}:`)
      for (const [k, v] of entries) lines.push(`  ${k}: ${scalar(v as string | number | boolean)}`)
    } else {
      lines.push(`${key}: ${scalar(value as string | number | boolean)}`)
    }
  }
  return lines.join('\n') + '\n'
}

interface PendingBlock { key: string; kind?: 'seq' | 'map'; seq: string[]; map: Record<string, string | number | boolean> }

/** task.yaml 子集解析；輸入以 `{`/`[` 起頭視為 JSON 直通。 */
export function parseTaskEnvelope(text: string): TaskEnvelope {
  const trimmed = text.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return TaskEnvelopeSchema.parse(JSON.parse(trimmed))
  }
  const out: Record<string, unknown> = {}
  let block: PendingBlock | null = null
  const flush = (): void => {
    if (!block) return
    if (block.kind === 'seq') out[block.key] = block.seq
    else if (block.kind === 'map') out[block.key] = block.map
    else throw new Error(`task.yaml 子集：${block.key} 無值也無子項目`)
    block = null
  }
  for (const line of text.split(/\r?\n/)) {
    const body = line.trim()
    if (!body || body.startsWith('#')) continue
    const seqItem = /^\s+-\s+(.*)$/.exec(line)
    if (seqItem) {
      if (!block) throw new Error(`task.yaml 子集：seq 項目沒有對應的 key：${body.slice(0, 40)}`)
      if (block.kind === 'map') throw new Error(`task.yaml 子集：${block.key} 混用 seq/map`)
      block.kind = 'seq'
      block.seq.push(String(parseScalar(seqItem[1]!)))
      continue
    }
    const subEntry = /^\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/.exec(line)
    if (subEntry) {
      if (!block) throw new Error(`task.yaml 子集：內縮行沒有對應的 key：${body.slice(0, 40)}`)
      if (block.kind === 'seq') throw new Error(`task.yaml 子集：${block.key} 混用 seq/map`)
      block.kind = 'map'
      block.map[subEntry[1]!] = parseScalar(subEntry[2]!)
      continue
    }
    const kv = /^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/.exec(line)
    if (!kv) throw new Error(`task.yaml 子集：無法解析行 ${body.slice(0, 40)}`)
    flush()
    const key = kv[1]!
    const raw = kv[2] ?? ''
    if (raw === '') block = { key, seq: [], map: {} } // 由下一行決定 seq/map
    else if (raw === '[]') out[key] = []
    else if (raw === '{}') out[key] = {}
    else if (raw.startsWith('[') || raw.startsWith('{')) throw new Error(`task.yaml 子集：不支援非空 flow 容器 ${raw.slice(0, 40)}`)
    else out[key] = parseScalar(raw)
  }
  flush()
  return TaskEnvelopeSchema.parse(out)
}
