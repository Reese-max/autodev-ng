/**
 * heartbeat 寫入 helper：一律附 todayAttempts 摘要。
 * 觀測面 I/O 失敗 fail-open，不擋主流程。
 */
import { quiet, type EventLog, type HeartbeatState } from '../events.js'
import type { Config } from '../types.js'
import { loadTodayAttemptsMap } from './today-attempts-view.js'

/** 寫 heartbeat.json，附加 todayAttempts（缺資料＝{}）。 */
export function writeHeartbeat(
  events: EventLog,
  cfg: Pick<Config, 'dataDir' | 'engines'>,
  state: Omit<HeartbeatState, 'todayAttempts'>,
): void {
  quiet(() => {
    let todayAttempts: HeartbeatState['todayAttempts'] = {}
    try {
      todayAttempts = loadTodayAttemptsMap(cfg.dataDir, cfg.engines)
    } catch { /* fail-open */ }
    events.heartbeat({ ...state, todayAttempts })
  })
}
