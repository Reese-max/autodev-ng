import { readFileSync, writeFileSync } from 'node:fs'
import { parseBacklog, withBacklogLock } from '../backlog.js'
import type { Task } from '../types.js'

export interface SplitChild { text: string; split: NonNullable<Task['split']> }

/** 同一把 backlog 鎖內將母片封存並追加子片，避免半套拆解或重複拆解。 */
export function writeSplitBacklog(file: string, parentId: string, children: SplitChild[]): void {
  withBacklogLock(file, () => {
    const content = readFileSync(file, 'utf8')
    const parent = parseBacklog(content).find(task => task.id === parentId && task.status === 'open')
    if (!parent) throw new Error(`split parent not open: ${parentId}`)
    const eol = content.includes('\r\n') ? '\r\n' : '\n'
    const lines = content.split(/\r?\n/), trailing = lines.at(-1) === ''
    if (trailing) lines.pop()
    const source = lines[parent.line]
    if (source === undefined) throw new Error(`split parent line missing: ${parentId}`)
    lines[parent.line] = `${source} <!-- adng:superseded-by-split -->`
    lines.push(...children.map(child => `- [ ] ${child.text} <!-- adng:split ${JSON.stringify(child.split)} -->`))
    if (trailing) lines.push('')
    writeFileSync(file, lines.join(eol))
  })
}
