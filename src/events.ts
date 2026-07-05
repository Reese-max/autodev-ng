import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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
    appendFileSync(this.eventsFile, JSON.stringify({ ts: new Date().toISOString(), type, ...data }) + '\n')
  }

  /** 同 type 24h 內只寫一次；回傳是否真的寫了。 */
  appendOnce(type: string, data: Record<string, unknown> = {}): boolean {
    const seen: Record<string, string> = existsSync(this.onceFile)
      ? JSON.parse(readFileSync(this.onceFile, 'utf8'))
      : {}
    const last = seen[type] ? Date.parse(seen[type]!) : 0
    if (Date.now() - last < 24 * 60 * 60 * 1000) return false
    seen[type] = new Date().toISOString()
    writeFileSync(this.onceFile, JSON.stringify(seen))
    this.append(type, data)
    return true
  }

  heartbeat(state: HeartbeatState): void {
    writeFileSync(this.heartbeatFile, JSON.stringify({ ts: new Date().toISOString(), ...state }, null, 2))
  }
}
