import type { LessonStore } from './store.js'
import type { RunDb } from '../db.js'
import type { BacklogStore } from '../backlog.js'
import type { EventLog } from '../events.js'
import { callAgent, type LlmOpts } from '../autopilot/llm.js'
// import type：避免 runtime 循環（scheduler 之後會反向引用 learn 的結構型別）。
import type { CycleResult } from '../scheduler.js'

export interface LessonsDeps {
  lessons: LessonStore
  db: RunDb
  backlog: BacklogStore
  llm: LlmOpts
  events?: EventLog
}

function buildPrompt(taskText: string, context: string): string {
  return `你是資深工程教練。以下是自動開發系統的一次任務失敗證據。
請提煉「一條」可泛化、對未來任務有指導性的教訓:繁體中文、單行、不超過 200 字。
不要輸出編號、日期、引號或任何多餘說明。
若證據不足以形成有價值的教訓,只輸出 NONE。

任務:${taskText}
失敗情境:${context}`
}

/**
 * 失敗驅動的教訓提煉：從一次 runOnce() 的 CycleResult 找出失敗證據，餵給 LLM 提煉
 * 一條可泛化教訓，寫入 LessonStore。鐵律 #4：整個函式最外層 try/catch 吞掉一切
 * ——reflect 本身故障（LLM 掛掉、db 壞掉…）絕不可反殺主迴圈。
 */
export async function reflectOnFailure(d: LessonsDeps, result: CycleResult): Promise<void> {
  try {
    let taskText: string
    let context: string

    if (typeof result === 'object' && result.kind === 'blocked') {
      taskText = result.taskText
      context = `blocked(${result.reason})`
      const tail = d.db.lastAttempt()?.detail
      if (tail) context += ` 最近嘗試 detail 尾段:${tail.slice(-500)}`
    } else if (result === 'failed') {
      const last = d.db.lastAttempt()
      if (!last || last.ok === true) return
      const task = d.backlog.read().find(t => t.id === last.taskId)
      taskText = task?.text ?? last.taskId
      context = `failed——最近嘗試 detail 尾段:${last.detail.slice(-500)}`
    } else {
      return
    }

    const reply = (await callAgent(d.llm, buildPrompt(taskText, context))).text.trim()

    if (!reply || /^NONE\b/i.test(reply)) {
      d.events?.append('reflect-skip', { reason: 'none-or-empty' })
      return
    }

    const line = reply.split('\n')[0]!
    if (d.lessons.add(line)) {
      d.events?.append('lesson-added', { text: line })
    } else {
      d.events?.append('reflect-skip', { reason: 'dup-or-empty' })
    }
  } catch {
    // 鐵律 #4：reflect 自身故障絕不可反殺主迴圈，fail-open 靜默吞掉
  }
}

export function makeLessonsPort(
  d: LessonsDeps
): { inject(): string; reflect(result: CycleResult): Promise<void> } {
  return {
    inject: () => d.lessons.inject(),
    reflect: (result: CycleResult) => reflectOnFailure(d, result)
  }
}
