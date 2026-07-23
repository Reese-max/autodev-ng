/** events.jsonl 尾段唯讀統計；觀測失敗不能反殺主流程。 */
import { closeSync, fstatSync, openSync, readSync } from 'node:fs'
import { join } from 'node:path'

const DEFAULT_TAIL_LINES = 200
const DEFAULT_TAIL_BYTES = 128 * 1024
const DEFAULT_MAX_TYPES = 8

export interface EventTailStat {
  type: string
  count: number
  latest: Record<string, unknown>
}

export interface EventTailSummaryOptions {
  tailLines?: number
  tailBytes?: number
  maxTypes?: number
}

/**
 * 僅讀取檔案尾端固定大小的區段；前段截斷、壞 JSON、缺檔都跳過，回傳可用的部分統計。
 * `tailBytes` 不足裝下 `tailLines` 時，結果仍是該尾段內可解析事件的摘要。
 */
export function summarizeEventsTail(dataDir: string, options: EventTailSummaryOptions = {}): EventTailStat[] {
  const tailLines = options.tailLines ?? DEFAULT_TAIL_LINES
  const tailBytes = options.tailBytes ?? DEFAULT_TAIL_BYTES
  const maxTypes = options.maxTypes ?? DEFAULT_MAX_TYPES
  if (tailLines <= 0 || tailBytes <= 0 || maxTypes <= 0) return []

  const file = join(dataDir, 'events.jsonl')
  let fd: number | undefined
  try {
    fd = openSync(file, 'r')
    const size = fstatSync(fd).size
    const length = Math.min(size, tailBytes)
    const start = size - length
    const buffer = Buffer.alloc(length)
    let read = 0
    while (read < length) {
      const bytes = readSync(fd, buffer, read, length - read, start + read)
      if (bytes === 0) break
      read += bytes
    }
    const lines = buffer.toString('utf8', 0, read).split(/\r?\n/)
    if (start > 0) lines.shift() // 可能從半行 JSON 開始，不能誤算
    const events = lines.slice(-tailLines).flatMap(line => {
      try {
        const event = JSON.parse(line) as Record<string, unknown>
        return typeof event.type === 'string' ? [event] : []
      } catch {
        return []
      }
    })
    const counts = new Map<string, number>()
    const latest = new Map<string, Record<string, unknown>>()
    for (const event of events) {
      const type = event.type as string
      counts.set(type, (counts.get(type) ?? 0) + 1)
      latest.set(type, event)
    }
    return [...counts]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, maxTypes)
      .map(([type, count]) => ({ type, count, latest: latest.get(type)! }))
  } catch {
    return []
  } finally {
    if (fd !== undefined) {
      try { closeSync(fd) } catch { /* fail-open */ }
    }
  }
}
