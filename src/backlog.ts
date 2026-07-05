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

/**
 * 縫 A 防呆：taskId() 純由 text.trim() 雜湊，兩行相同文字會撞出同一個 id。
 * 若不處理，report() 用 id 尋找永遠只命中「第一筆」，導致同 id 的第二筆（以後）
 * 在下一輪 nextTask() 又被當成「還沒做」重新派工 → 真引擎對同一件事無限重跑燒錢。
 * 這裡只在讀取結果（記憶體）中，把重複 id 的第二筆起強制視為 'blocked'，
 * 讓 nextTask() 不會選到它們；不寫回檔案、不新增 Task 欄位，也不去改使用者的任務文字
 * （鐵律 #1 禁止創造/竄改任務行，這裡只是解讀層面的去重，檔案本身保持原樣）。
 * done 行排除：同文字 done 舊行 + open 新行時，open 新行不被視為重複、可派工。
 */
function dedupeDuplicateIds(tasks: Task[]): Task[] {
  // 統計所有行的計數（用於檢測是否曾經有重複）
  const allCounts = new Map<string, number>()
  for (const t of tasks) {
    allCounts.set(t.id, (allCounts.get(t.id) ?? 0) + 1)
  }

  // 統計 non-done 行的計數（用於決定當前是否降級）
  const nonDoneCounts = new Map<string, number>()
  for (const t of tasks) {
    if (t.status !== 'done') {
      nonDoneCounts.set(t.id, (nonDoneCounts.get(t.id) ?? 0) + 1)
    }
  }

  const seenOpen = new Set<string>()
  return tasks.map(t => {
    if (t.status === 'done') return t

    // open/blocked：檢查 non-done 計數，若僅此一筆（done 被排除）則不降級
    if (nonDoneCounts.get(t.id)! > 1) {
      // 有多筆 non-done 行，第二筆起降為 blocked
      if (seenOpen.has(t.id)) return { ...t, status: 'blocked' }
      seenOpen.add(t.id)
    }
    return t
  })
}

export class BacklogStore {
  constructor(private readonly file: string) {}

  read(): Task[] {
    return dedupeDuplicateIds(parseBacklog(readFileSync(this.file, 'utf8')))
  }

  /** 出現 >1 次的 task id（重複任務會被 read() 降為 blocked 不派工，這裡供 scheduler 告警可見化）。
   * done 行被排除——同文字 done 舊行 + open 新行時，新行不被計入重複。 */
  duplicateIds(): string[] {
    const seen = new Map<string, number>()
    for (const t of parseBacklog(readFileSync(this.file, 'utf8'))) {
      // done 行不參與重複計數
      if (t.status === 'done') continue
      seen.set(t.id, (seen.get(t.id) ?? 0) + 1)
    }
    return [...seen.entries()].filter(([, n]) => n > 1).map(([id]) => id)
  }

  nextTask(): Task | null {
    return this.read().find(t => t.status === 'open') ?? null
  }

  /**
   * 只允許改既有任務行的狀態；未知 id = 有人想創造任務 = 鐵律 #1 違規。
   *
   * 2026-07-05 語意變更（M3a 主控裁決）：尋找目標行時跳過 status==='done' 的行，
   * 取第一個 id 相符且非 done 的行來標記。這是為了解「done 排除」與縫 A「重複第二筆
   * 永凍」之間的語意矛盾——duplicateIds()/read() 已將「同文字 done 舊行 + open 新行」
   * 視為不重複、新行可派工（見上方 dedupeDuplicateIds 註解），若 report() 仍然無視
   * done 狀態、永遠命中檔案中第一個文字相符的行，就會把新行的派工結果誤標到已經
   * done 的舊行上，新行的 done 狀態永遠不會被寫入 → 舊行、新行 id 相同，下一輪
   * nextTask() 又選到「未被標記的新行」重新派工，造成無限重跑。
   *
   * 收斂性論證：兩行同文字 open → 第一次派工把第一個非 done match（即第一行）標
   * done → dedupe 排除 done 後，剩下的第二行不再被判定為重複、可以正常派工 → 引擎
   * 再次領到這行去做：
   *   - 若確實有事可做（使用者刻意重加同名任務），會正常完成並標 done，之後兩行
   *     皆 done，不再有任何非 done match，report() 對舊 id 一律 throw（鐵律 #1）。
   *   - 若引擎其實無事可做（單純文字撞衫、非真的想重派），連續 no-commit 會依
   *     既有 blocked 機制判 blocked，成本有界（至多多跑一輪就 blocked，不會無限重跑）。
   * 兩種情境都在有限步內收斂，任何情境下都不會無限重跑。
   */
  report(id: string, d: Disposition): void {
    const content = readFileSync(this.file, 'utf8')
    const eol = content.includes('\r\n') ? '\r\n' : '\n'
    const lines = content.split(/\r?\n/)
    const t = parseBacklog(content).find(t => t.id === id && t.status !== 'done')
    if (!t) throw new Error(`unknown task id ${id}：系統禁止創造任務（鐵律 #1）`)
    lines[t.line] = d.kind === 'done'
      ? `- [x] ${t.text} <!-- adng:done ${d.commitHash} -->`
      : `- [ ] ${t.text} <!-- adng:blocked reason=${JSON.stringify(d.reason)} -->`
    writeFileSync(this.file, lines.join(eol))
  }
}
