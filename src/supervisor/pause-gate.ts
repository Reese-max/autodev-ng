import { resolve } from 'node:path'
import { withBacklogLock } from '../backlog.js'

const PAUSE_GATE_STALE_MS = 60_000
const PAUSE_GATE_WAIT_MS = PAUSE_GATE_STALE_MS + 5_000

/** 讓 pause 寫入與新副作用起點具線性順序；mkdir 鎖協議沿用既有跨程序檔案鎖。 */
export function withPauseGate<T>(stopFiles: readonly string[], action: () => T): T {
  const files = [...new Set(stopFiles.map(file => resolve(file)))].sort()
  const enter = (index: number): T => index === files.length
    ? action()
    // ponytail: 60 秒涵蓋現行同步 reap 上界；若同步副作用再變長，改成啟動後立即釋放。
    : withBacklogLock(files[index]!, () => enter(index + 1), PAUSE_GATE_WAIT_MS, PAUSE_GATE_STALE_MS)
  return enter(0)
}
