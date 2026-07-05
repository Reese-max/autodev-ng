import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export interface HeartbeatState {
  state: 'running' | 'idle' | 'stopped' | 'cost-stopped'
  currentTask?: string
  todayCostUsd: number
}

export class EventLog {
  private readonly eventsFile: string
  private readonly heartbeatFile: string
  private readonly onceFile: string

  constructor(dataDir: string) {
    mkdirSync(dataDir, { recursive: true })
    this.eventsFile = join(dataDir, 'events.jsonl')
    this.heartbeatFile = join(dataDir, 'heartbeat.json')
    this.onceFile = join(dataDir, 'events-once.json')
  }

  append(type: string, data: Record<string, unknown> = {}): void {
    appendFileSync(this.eventsFile, JSON.stringify({ ...data, ts: new Date().toISOString(), type }) + '\n')
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
