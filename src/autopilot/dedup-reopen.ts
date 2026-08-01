import { readFileSync, writeFileSync } from 'node:fs'
import type { Task } from '../types.js'
import { parseBacklog, taskId, withBacklogLock } from '../backlog.js'
import {
  classifyDedupReopen,
  type DedupReopenDecision,
  type ReopenHistory,
} from './dedup-reopen-classifier.js'

export interface AppliedDedupReopen {
  decision: DedupReopenDecision
  reopened?: { id: string; text: string; line: number }
}

const BLOCKED_REASON_RE = /<!--\s*adng:blocked\b\s+reason=(.*?)\s*-->/
const REOPENED_RE = /<!--\s*adng:superseded\b|<!--\s*adng:autopilot\b[^>]*\breopen-from:/

function blockedContext(line: string): { history?: ReopenHistory; reasonLiteral?: string } {
  const match = BLOCKED_REASON_RE.exec(line)
  if (!match) return {}
  try {
    if (typeof JSON.parse(match[1]!) !== 'string') return {}
  } catch { return {} }
  return {
    history: REOPENED_RE.test(line) ? 'reopened' : 'never-reopened',
    reasonLiteral: match[1]!,
  }
}

/** 在同一把 backlog 鎖內重驗 dedup 命中、標記舊行並追加唯一的新任務。 */
export function applyDedupReopen(
  backlogFile: string,
  existing: Task,
  opts: { goalId: string; round: number },
): AppliedDedupReopen {
  return withBacklogLock(backlogFile, () => {
    const content = readFileSync(backlogFile, 'utf8')
    const eol = content.includes('\r\n') ? '\r\n' : '\n'
    const lines = content.split(/\r?\n/)
    const current = parseBacklog(content).find(task =>
      task.line === existing.line && task.id === existing.id && task.text === existing.text)
    if (!current) {
      return { decision: { kind: 'reject', reason: 'reopen-history-missing' } }
    }

    const context = current.status === 'blocked' ? blockedContext(lines[current.line] ?? '') : {}
    const decision = classifyDedupReopen({
      existingStatus: current.status,
      reopenHistory: context.history,
    })
    if (decision.kind === 'reject' || !context.reasonLiteral) return { decision }

    const text = `${current.text}（既有實況：原任務 ${current.id} blocked；修復靶心：adng:blocked reason=${context.reasonLiteral}）`
    const id = taskId(text)
    const lineText = current.engineTag
      ? current.rawText?.startsWith(`[engine:${current.engineTag}]`)
        ? `[engine:${current.engineTag}] ${text}`
        : `${text} [engine:${current.engineTag}]`
      : text
    lines[current.line] = `${lines[current.line]} <!-- adng:superseded by:${id} -->`
    const rewritten = lines.join(eol)
    const separator = rewritten.length === 0 || rewritten.endsWith(eol) ? '' : eol
    const reopenedLine = `- [ ] ${lineText} <!-- adng:autopilot goal:${opts.goalId} round:${opts.round} id:${id} reopen-from:${current.id} -->`
    const next = `${rewritten}${separator}${reopenedLine}${eol}`
    writeFileSync(backlogFile, next)
    return { decision, reopened: { id, text, line: parseBacklog(next).at(-1)!.line } }
  })
}
