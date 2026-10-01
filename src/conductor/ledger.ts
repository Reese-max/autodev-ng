import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { VerifyStatus } from '../engines/run-verify.js'

/** Issue #52 task ledger：`.autodev/task-ledger.jsonl` append-only 事件流。
 * 任務可追溯性（worker/model/commit/attempt/tests/結果）的唯一事實源——
 * CURRENT_STATE.md 是投影，ledger 是 log；斷線重續靠它數 epoch 內已耗 attempt。 */

export interface TestResultEntry {
  command: string
  status: VerifyStatus
  exitCode: number | null
  detail: string
}

export type ConductorTaskStatus = 'done' | 'escalated' | 'blocked' | 'stopped' | 'unverified'

export type LedgerRecord =
  | { type: 'envelope'; task_id: string; worker: string; parent_commit: string | null; ts: string }
  | { type: 'attempt'; task_id: string; attempt: number; worker: string; preexisting_dirty: number; ts: string }
  | {
      type: 'attempt-result'
      task_id: string; attempt: number; worker: string; ok: boolean
      model?: string; cost_usd?: number; failure_reason?: string; failure_class?: string
      fingerprint?: string; base_commit?: string; commit?: string; ts: string
    }
  | {
      type: 'verification'
      task_id: string; attempt: number
      verdict: 'pass' | 'fail' | 'unverified'
      detail: string; violations: string[]; tests: TestResultEntry[]; ts: string
    }
  | {
      type: 'task-finished'
      task_id: string; status: Exclude<ConductorTaskStatus, 'stopped'>
      commit?: string; reason?: string; attempts: number; ts: string
    }

export class TaskLedger {
  readonly file: string
  constructor(stateDir: string) {
    mkdirSync(stateDir, { recursive: true })
    this.file = join(stateDir, 'task-ledger.jsonl')
  }

  append(record: LedgerRecord): void {
    appendFileSync(this.file, JSON.stringify(record) + '\n', 'utf8')
  }

  /** 讀全部事件；壞行/截斷行跳過不炸（JSONL 尾截斷是 crash 常態）。 */
  readAll(): LedgerRecord[] {
    if (!existsSync(this.file)) return []
    const out: LedgerRecord[] = []
    for (const line of readFileSync(this.file, 'utf8').split('\n')) {
      if (!line.trim()) continue
      try {
        const rec = JSON.parse(line) as LedgerRecord
        if (rec && typeof rec === 'object' && typeof rec.type === 'string') out.push(rec)
      } catch { /* tolerate truncated tail / hand edits */ }
    }
    return out
  }

  forTask(taskId: string): LedgerRecord[] {
    return this.readAll().filter(r => 'task_id' in r && r.task_id === taskId)
  }

  /** 最後一次 task-finished（若有）。'stopped' 不記 finish——中斷不是終局。 */
  lastFinish(taskId: string): Extract<LedgerRecord, { type: 'task-finished' }> | undefined {
    const finishes = this.forTask(taskId).filter((r): r is Extract<LedgerRecord, { type: 'task-finished' }> => r.type === 'task-finished')
    return finishes.at(-1)
  }

  /** 當前 epoch（最後一次 task-finished 之後）已派工的 attempt 數。
   * 重續時 budget 消耗以 epoch 計——新 epoch（前次終局後重派）重新起算。 */
  attemptsSinceFinish(taskId: string): number {
    const recs = this.forTask(taskId)
    let count = 0
    for (const r of recs) {
      if (r.type === 'task-finished') count = 0
      else if (r.type === 'attempt') count += 1
    }
    return count
  }

  /** 全域 attempt 編號（跨 epoch 遞增，追溯用）。 */
  totalAttempts(taskId: string): number {
    return this.forTask(taskId).filter(r => r.type === 'attempt').length
  }

  /** 最近一次 attempt-result（resume 時拿 expectedHead）。 */
  lastAttemptResult(taskId: string): Extract<LedgerRecord, { type: 'attempt-result' }> | undefined {
    return this.forTask(taskId).filter((r): r is Extract<LedgerRecord, { type: 'attempt-result' }> => r.type === 'attempt-result').at(-1)
  }

  /** 有 attempt 記錄卻無對應 attempt-result＝上次在派工中崩潰。 */
  openAttempt(taskId: string): Extract<LedgerRecord, { type: 'attempt' }> | undefined {
    const recs = this.forTask(taskId)
    const attempts = recs.filter(r => r.type === 'attempt').length
    const results = recs.filter(r => r.type === 'attempt-result').length
    if (attempts <= results) return undefined
    return recs.filter((r): r is Extract<LedgerRecord, { type: 'attempt' }> => r.type === 'attempt').at(-1)
  }
}
