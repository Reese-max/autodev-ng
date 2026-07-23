import { existsSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import type { EventLog } from '../events.js'

/** restart.request 哨兵消費（放子目錄不計 kernel 帳）。daemon 於 cycle 邊界呼叫：
 * 哨兵存在→刪檔、記 daemon-restart-requested 事件、回 true（呼叫端優雅退出，supervisor 重拉）。
 * 刪失敗→記 daemon-restart-unlink-failed、回 false（不退，防 supervisor 重拉後又見哨兵的無限翻抖）。
 * 無哨兵→回 false。unlinkFn 供測試注入。 */
export function consumeRestartSentinel(
  dataDir: string, events: EventLog, unlinkFn: (path: string) => void = unlinkSync,
): boolean {
  const sentinel = join(dataDir, 'restart.request')
  if (!existsSync(sentinel)) return false
  try {
    unlinkFn(sentinel)
  } catch (err) {
    try { events.append('daemon-restart-unlink-failed', { error: String(err) }) } catch { /* fail-open */ }
    return false // 刪不掉不退，防 supervisor 重拉後又見哨兵的無限翻抖
  }
  try { events.append('daemon-restart-requested', {}) } catch { /* fail-open */ }
  return true
}
