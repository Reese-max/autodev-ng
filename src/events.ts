import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export interface HeartbeatState {
  state: 'running' | 'idle' | 'stopped' | 'cost-stopped'
  currentTask?: string
  todayCostUsd: number
  /** 今日 attempts：engine → { n, ok, cap? } */
  todayAttempts?: Record<string, { n: number; ok: number; cap?: number }>
}

// MEDIUM-4：events.jsonl 無界成長治理。append 是主迴圈熱路徑（每輪多次呼叫），若每次都
// readFileSync 整檔數行會隨檔案增長線性拖慢主迴圈。改用記憶體行數計數器：建構時只讀一次
// 檔案取得初始行數（O(n) 僅發生一次，daemon 進程存活期間只此一次），之後每次 append 只是
// O(1) 遞增比較；真正超過上限時才整檔重讀重寫（O(n)，但僅在真正需要輪替時發生）。
// 保尾量與 DLQ 對稱（行數制、2:1 保尾半量比例）。20000 行遠大於單日事件量（daemon 一輪
// 產生數個 events，72h 浸泡場景下單日大約數十到數百則事件），保尾 10000 行足以覆蓋數週
// 份 events 供 digest 的 countVerifyAlertsToday 掃描當日資料，不會被輪替提前吃掉。
const EVENTS_MAX_LINES = 20000
const EVENTS_KEEP_LINES = 10000

function countNonEmptyLines(content: string): number {
  return content.split(/\r?\n/).filter((line) => line.length > 0).length
}

export class EventLog {
  private readonly eventsFile: string
  private readonly heartbeatFile: string
  private readonly onceFile: string
  private lineCount: number

  constructor(dataDir: string) {
    mkdirSync(dataDir, { recursive: true })
    this.eventsFile = join(dataDir, 'events.jsonl')
    this.heartbeatFile = join(dataDir, 'heartbeat.json')
    this.onceFile = join(dataDir, 'events-once.json')
    this.lineCount = this.countExistingLines()
  }

  private countExistingLines(): number {
    if (!existsSync(this.eventsFile)) return 0
    try {
      return countNonEmptyLines(readFileSync(this.eventsFile, 'utf8'))
    } catch {
      return 0
    }
  }

  append(type: string, data: Record<string, unknown> = {}): void {
    appendFileSync(this.eventsFile, JSON.stringify({ ...data, ts: new Date().toISOString(), type }) + '\n')
    this.lineCount++
    if (this.lineCount > EVENTS_MAX_LINES) {
      this.rotateEvents()
    }
  }

  /** 保尾輪替：lineCount 只是便宜的觸發判斷，實際輪替仍讀取當下真實檔案內容做保尾重寫，
   * 正確性不依賴記憶體計數器準不準（即使計數器因故漂移，重讀真檔內容仍保證輸出是合法
   * JSONL 且保尾正確）。tmp+rename 原子寫；任何故障（讀/寫/rename）一律靜默放棄——觀測
   * 系統自身治理失敗不可反殺主迴圈（append 呼叫端預期本函式不拋，鐵律 #4：fail-open）。
   * 放棄時刻意不重置 lineCount：讓下一次 append 再次觸發嘗試（暫時性故障可望自癒；若是
   * 持續性故障，接受重試的些微效能代價——優先於靜默放棄導致檔案無界成長）。 */
  private rotateEvents(): void {
    try {
      const content = readFileSync(this.eventsFile, 'utf8')
      const lines = content.split(/\r?\n/).filter((line) => line.length > 0)
      if (lines.length <= EVENTS_MAX_LINES) {
        this.lineCount = lines.length
        return
      }
      const kept = lines.slice(-EVENTS_KEEP_LINES)
      const tmp = `${this.eventsFile}.tmp`
      writeFileSync(tmp, kept.join('\n') + '\n')
      renameSync(tmp, this.eventsFile)
      this.lineCount = kept.length
    } catch {
      // 靜默放棄：見上方註解
    }
  }

  private writeFileAtomic(file: string, content: string): void {
    const tmp = `${file}.tmp`
    writeFileSync(tmp, content)
    renameSync(tmp, file)
  }

  /** 同 type 24h 內只寫一次；回傳是否真的寫了。 */
  appendOnce(type: string, data: Record<string, unknown> = {}): boolean {
    let seen: Record<string, string> = {}
    let corrupted = false
    if (existsSync(this.onceFile)) {
      try {
        seen = JSON.parse(readFileSync(this.onceFile, 'utf8'))
      } catch {
        seen = {}
        corrupted = true
      }
    }
    if (corrupted) {
      try {
        this.append('once-file-corrupted', {})
      } catch {
        // 觀測系統自身故障絕不能反殺主迴圈，吞掉即可
      }
    }
    const last = seen[type] ? Date.parse(seen[type]!) : 0
    if (Date.now() - last < 24 * 60 * 60 * 1000) return false
    seen[type] = new Date().toISOString()
    this.writeFileAtomic(this.onceFile, JSON.stringify(seen))
    this.append(type, data)
    return true
  }

  heartbeat(state: HeartbeatState): void {
    this.writeFileAtomic(this.heartbeatFile, JSON.stringify({ ts: new Date().toISOString(), ...state }, null, 2))
  }
}

/** 觀測/通知面自身故障絕不可反殺主迴圈——統一吞錯（鐵律 #4 精神）。 */
export function quiet(fn: () => void): void {
  try {
    fn()
  } catch {
    // events 模組自身壞掉不該中斷閉環
  }
}
