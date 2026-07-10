import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { randomBytes } from 'node:crypto'

export const MAX_LESSONS = 30
export const MAX_LESSON_LEN = 200

export interface Lesson {
  num: number
  date: string
  text: string
}

const LESSON_RE = /^- L(\d+) \[(\d{4}-\d{2}-\d{2})\] (.+)$/

export function parseLessons(md: string): Lesson[] {
  const result: Lesson[] = []
  for (const line of md.split('\n')) {
    const m = line.match(LESSON_RE)
    if (m) result.push({ num: +m[1]!, date: m[2]!, text: m[3]! })
  }
  return result
}

function readWithFallback(f: string): string {
  try {
    return readFileSync(f, 'utf8')
  } catch {
    return ''
  }
}

function normalize(s: string): string {
  return s.replace(/\s/g, '')
}

function isContained(a: string, b: string): boolean {
  const na = normalize(a)
  const nb = normalize(b)
  return na.includes(nb) || nb.includes(na)
}

export class LessonStore {
  constructor(
    private projectFile: string,
    private globalFile?: string
  ) {}

  add(text: string, now?: Date): boolean {
    try {
      const first = text.split('\n')[0]!.trim()
      if (!first) return false

      const truncated = [...first].slice(0, MAX_LESSON_LEN).join('')
      const existing = parseLessons(readWithFallback(this.projectFile))

      for (const lesson of existing) {
        if (isContained(truncated, lesson.text)) return false
      }

      const maxNum = existing.length > 0 ? Math.max(...existing.map(l => l.num)) : 0
      const nextNum = maxNum + 1
      const date = (now || new Date()).toISOString().slice(0, 10)

      let lessons = existing
      if (lessons.length >= MAX_LESSONS) {
        lessons = lessons.slice(1)
      }

      lessons.push({ num: nextNum, date, text: truncated })

      const lines = ['# Learnings', ...lessons.map(l => `- L${String(l.num).padStart(3, '0')} [${l.date}] ${l.text}`), '']
      const content = lines.join('\n')

      const dir = dirname(this.projectFile)
      try {
        mkdirSync(dir, { recursive: true })
      } catch {}

      const tmp = join(tmpdir(), `.adng-${randomBytes(6).toString('hex')}`)
      writeFileSync(tmp, content, 'utf8')
      renameSync(tmp, this.projectFile)

      return true
    } catch {
      return false
    }
  }

  inject(): string {
    const globalContent = this.globalFile ? readWithFallback(this.globalFile) : ''
    const projectContent = readWithFallback(this.projectFile)

    const globalLessons = parseLessons(globalContent)
    const projectLessons = parseLessons(projectContent)

    if (globalLessons.length === 0 && projectLessons.length === 0) return ''

    const lines: string[] = ['## 過往教訓(遵守,避免重蹈)']

    for (const l of globalLessons) {
      lines.push(`- [全局] ${l.text}`)
    }

    for (const l of projectLessons) {
      lines.push(`- L${String(l.num).padStart(3, '0')} [${l.date}] ${l.text}`)
    }

    return lines.join('\n')
  }
}
