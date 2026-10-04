import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { writeJsonAtomic } from '../guardian/incident.js'

/** Issue #11：control plane 的 target registry——每個 execution 一份檔案，
 * 讓 /steer、/enqueue 能把 operator 指令綁定到「當下真的在跑的 exact execution」。
 * bounded 模式的 execution 沒有 executions/*.json 觀測檔，因此這裡是全模式共用的
 * 最小活性紀錄；檔案只放識別中繼資料，不放 prompt/output。 */
const RecordSchema = z.object({
  version: z.literal(1),
  executionId: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/),
  taskId: z.string().max(200),
  engineTag: z.string().max(100),
  adapter: z.string().max(100),
  /** engine-run＝turn 進行中（可 in-flight steer）；host-verify＝turn 已結束、host 在
   * 驗收/合併（steer 只能轉 TOO_LATE_QUEUED）；terminal＝execution 已結束。 */
  phase: z.enum(['engine-run', 'host-verify', 'terminal']),
  hostPid: z.number().int().positive(),
  hostStartedAt: z.number().finite(),
  startedAt: z.number().finite(),
  updatedAt: z.number().finite(),
  orphaned: z.boolean().optional(),
})
export type ActiveExecution = z.infer<typeof RecordSchema>

function dir(dataDir: string): string { return join(dataDir, 'active') }

export function activeExecutionFile(dataDir: string, executionId: string): string {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(executionId)) throw new Error('Invalid execution ID')
  return join(dir(dataDir), `${executionId}.json`)
}

export function writeActiveExecution(dataDir: string, rec: Omit<ActiveExecution, 'version' | 'updatedAt'>): void {
  mkdirSync(dir(dataDir), { recursive: true })
  writeJsonAtomic(activeExecutionFile(dataDir, rec.executionId), { ...rec, version: 1, updatedAt: Date.now() })
}

export function updateActiveExecutionPhase(dataDir: string, executionId: string, phase: ActiveExecution['phase']): void {
  const rec = readActiveExecution(dataDir, executionId)
  if (!rec || rec.phase === 'terminal') return
  writeJsonAtomic(activeExecutionFile(dataDir, executionId), { ...rec, phase, updatedAt: Date.now() })
}

export function readActiveExecution(dataDir: string, executionId: string): ActiveExecution | undefined {
  let file: string
  try { file = activeExecutionFile(dataDir, executionId) } catch { return undefined }
  try {
    if (statSync(file).size > 16_384) return undefined
    return RecordSchema.parse(JSON.parse(readFileSync(file, 'utf8')))
  } catch { return undefined }
}

/** 無界成長治理：讀取側順便清掉 >24h 的 terminal 紀錄（每執行一小檔，正常量極少）。 */
export function listActiveExecutions(dataDir: string, now = Date.now()): ActiveExecution[] {
  const folder = dir(dataDir)
  const out: ActiveExecution[] = []
  let files: string[] = []
  try { files = readdirSync(folder).filter(f => f.endsWith('.json')) } catch { return out }
  if (files.length > 10_000) return out
  for (const f of files) {
    try {
      const rec = RecordSchema.parse(JSON.parse(readFileSync(join(folder, f), 'utf8')))
      if (rec.phase === 'terminal' && now - rec.updatedAt > 24 * 60 * 60 * 1000) continue
      out.push(rec)
    } catch { /* 壞檔不算 active */ }
  }
  return out
}

/** 活性判定（intake／target 檢查用）：record 非 terminal + hostPid 仍活著即算 live。
 * 同進程呼叫（測試／in-process embedded）看到 own-pid 的 non-terminal 紀錄也算 live——
 * 那正是進行中的 execution 自己。 */
export function isExecutionLive(rec: ActiveExecution | undefined): boolean {
  return !!rec && rec.phase !== 'terminal' && pidAlive(rec.hostPid)
}

/** daemon 啟動/cycle 起點呼叫：此頂點本進程不可能有 live execution（runOnce 起點、
 * 子 execution 尚未啟動），凡 phase!=='terminal' 且（hostPid 已死 或 hostPid 是本進程
 * ——前輪 finally 未跑到的殘留）一律標 terminal。別的活 pid 記錄（run-once 不拿 daemon
 * lock、可與活著 daemon 並存）絕不標孤兒。回傳被孤兒化的 executionId 清單。 */
export function markOrphanedExecutions(dataDir: string): string[] {
  const orphaned: string[] = []
  for (const rec of listActiveExecutions(dataDir)) {
    if (rec.phase === 'terminal') continue
    if (rec.hostPid !== process.pid && pidAlive(rec.hostPid)) continue
    orphaned.push(rec.executionId)
    try { writeJsonAtomic(activeExecutionFile(dataDir, rec.executionId), { ...rec, phase: 'terminal', orphaned: true, updatedAt: Date.now() }) } catch { /* fail-open */ }
  }
  return orphaned
}

/** request 側（bot/CLI 是另一個進程）判斷紀錄上的 hostPid 是否還活著：
 * pid 死了＝execution 是孤兒，record 說 engine-run 也不算數（SIGKILL 類無 finally 善後）。 */
export function pidAlive(pid: number): boolean {
  try { process.kill(pid, 0); return true } catch (err) { return (err as NodeJS.ErrnoException).code === 'EPERM' }
}

export function activeExecutionDirExists(dataDir: string): boolean { return existsSync(dir(dataDir)) }
