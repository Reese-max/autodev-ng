import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import type { Disposition, Task } from './types.js'

export function taskId(text: string): string {
  return createHash('sha1').update(text.trim()).digest('hex').slice(0, 8)
}

const TASK_RE = /^- \[( |x)\] (.*)$/
const ANNOT_RE = /\s*<!-- adng:[\s\S]*?-->\s*$/

export function parseBacklog(md: string): Task[] {
  const tasks: Task[] = []
  md.split(/\r?\n/).forEach((line, i) => {
    const m = TASK_RE.exec(line)
    if (!m) return
    const raw = m[2]!
    const blocked = /<!-- adng:blocked\b/.test(raw)
    const text = raw.replace(ANNOT_RE, '')
    tasks.push({
      id: taskId(text),
      text,
      line: i,
      status: m[1] === 'x' ? 'done' : blocked ? 'blocked' : 'open'
    })
  })
  return tasks
}

export class BacklogStore {
  constructor(private readonly file: string) {}

  read(): Task[] {
    return parseBacklog(readFileSync(this.file, 'utf8'))
  }

  nextTask(): Task | null {
    return this.read().find(t => t.status === 'open') ?? null
  }

  /** 只允許改既有任務行的狀態；未知 id = 有人想創造任務 = 鐵律 #1 違規 */
  report(id: string, d: Disposition): void {
    const content = readFileSync(this.file, 'utf8')
    const eol = content.includes('\r\n') ? '\r\n' : '\n'
    const lines = content.split(/\r?\n/)
    const t = parseBacklog(content).find(t => t.id === id)
    if (!t) throw new Error(`unknown task id ${id}：系統禁止創造任務（鐵律 #1）`)
    lines[t.line] = d.kind === 'done'
      ? `- [x] ${t.text} <!-- adng:done ${d.commitHash} -->`
      : `- [ ] ${t.text} <!-- adng:blocked reason=${JSON.stringify(d.reason)} -->`
    writeFileSync(this.file, lines.join(eol))
  }
}
