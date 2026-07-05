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
 * 這裡只在讀取結果（記憶體）中做去重，讓 nextTask() 不會選到多餘的重複行；
 * 不寫回檔案、不新增 Task 欄位，也不去改使用者的任務文字
 * （鐵律 #1 禁止創造/竄改任務行，這裡只是解讀層面的去重，檔案本身保持原樣）。
 * done 行一律略過：同文字 done 舊行 + open 新行時，open 新行不被視為重複、可派工。
 *
 * 2026-07-05 修正（N≥3 餓死，HIGH #1）：舊版用「非 done 計數」判斷是否要降級，
 * 導致代表名額被「檔案面已經 blocked 的行」佔住——只要重複行裡第一個非 done 行
 * 剛好是 file-blocked（而非 open），後面即使還有貨真價實 open 的第 3、4...行，
 * 也會被連坐強制降級 blocked，永遠選不到、永遠不被派工（餓死）。
 *
 * 新規則：只在 open 行之間競爭代表名額，file-blocked 的行完全不參與、不被
 * 改動、也不消耗名額。同 id 的所有 open 行裡，第一個（依檔案行序）保留 open，
 * 其餘的 open 行才在記憶體中降級為 blocked。
 */
function dedupeDuplicateIds(tasks: Task[]): Task[] {
  const openSlotTaken = new Set<string>()
  return tasks.map(t => {
    if (t.status !== 'open') return t
    if (openSlotTaken.has(t.id)) return { ...t, status: 'blocked' }
    openSlotTaken.add(t.id)
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
   * 2026-07-05 修正（N≥3 餓死，HIGH #1）：目標行選取改為「同 id 非 done 行中，
   * 優先取第一個 open match；若無 open match（例如所有非 done 行都已是 file-blocked），
   * 才 fallback 到第一個非 done match」。理由：nextTask() 給出的一定是 dedupe 後
   * 唯一持有代表名額的那個 open 行，report() 必須標記到「同一行」，而不是檔案裡
   * 隨便某個先出現、但其實早就 file-blocked 過的舊重複行——否則會把新一輪的派工
   * 結果誤蓋到不相干的舊行上，讓真正被派工的那行狀態永遠不落地。
   *
   * 收斂性論證（涵蓋 N≥3）：N 行同文字、皆 open 起始。每一輪 nextTask() 恰好選出
   * 唯一未被消耗的 open 行（dedupe 保證），report() 也恰好標記同一行：
   *   - 標 done：該行從此不再參與競爭（done 永久排除）。
   *   - 標 blocked：該行寫回 file-blocked，之後 dedupe 視為「不參與、不佔名額」，
   *     代表名額自動釋出給下一個尚未處理過的 open 行。
   * 也就是說每一輪都會讓「尚未處理的 open 行」集合嚴格減少 1（done 或 file-blocked
   * 二選一，皆從候選集合中移除，沒有第三種「保持 open 但不被選中」的行會被跳過）。
   * 因此最多 N 輪，所有行必然全數變成 done 或 blocked，nextTask() 回 null，
   * 不會有任何一行被無限重跑或永遠餓死。若每行還疊加 scheduler 的
   * maxAttempts 次重試才轉 blocked，總成本上界為 N × maxAttempts 輪，仍然有界收斂。
   */
  report(id: string, d: Disposition): void {
    const content = readFileSync(this.file, 'utf8')
    const eol = content.includes('\r\n') ? '\r\n' : '\n'
    const lines = content.split(/\r?\n/)
    const matches = parseBacklog(content).filter(t => t.id === id && t.status !== 'done')
    const t = matches.find(t => t.status === 'open') ?? matches[0]
    if (!t) throw new Error(`unknown task id ${id}：系統禁止創造任務（鐵律 #1）`)
    lines[t.line] = d.kind === 'done'
      ? `- [x] ${t.text} <!-- adng:done ${d.commitHash} -->`
      : `- [ ] ${t.text} <!-- adng:blocked reason=${JSON.stringify(d.reason)} -->`
    writeFileSync(this.file, lines.join(eol))
  }
}
