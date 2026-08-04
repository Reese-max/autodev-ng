// §9 圍籬（fencing，2026-08-04）：daemon 的 pid.json 所有權自驗。
// 動機：任何原因造成的雙 daemon 並存（lock 空窗、哨兵競態、未知新路徑），被取代者都必須
// 一輪內自我了斷——不開輪、不送摘要、不碰共享檔；且退出時不得刪繼任者的 lock
// （舊版 daemon finally 無條件 rmSync 是 2026-08-03 哨兵洩漏鏈的幫兇）。
// pid.json 缺失/損壞一律 fail-open（鐵律 #4：探測故障不可反殺健康 daemon）。
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { EventLog } from '../events.js'
import { quiet } from '../events.js'

/** 讀 lock pid.json 的持有者 pid；缺失/損壞回 null。 */
export function readLockOwnerPid(lockDir: string): number | null {
  try {
    const raw = JSON.parse(readFileSync(join(lockDir, 'pid.json'), 'utf8')) as { pid?: unknown }
    return typeof raw.pid === 'number' && Number.isInteger(raw.pid) && raw.pid > 0 ? raw.pid : null
  } catch {
    return null
  }
}

/** 被取代偵測：pid.json 屬他人＝true（並記 daemon-usurped 事件）；屬自己或不可讀＝false。 */
export function fenceUsurped(lockDir: string, selfPid: number, events: Pick<EventLog, 'append'>): boolean {
  const owner = readLockOwnerPid(lockDir)
  if (owner === null || owner === selfPid) return false
  quiet(() => events.append('daemon-usurped', { self: selfPid, owner }))
  return true
}

/** 所有權釋放：pid.json 屬別人＝繼任者已接手，絕不 rm；null（自己的殘骸/損壞殼）照舊清除。 */
export function releaseLockIfOwned(lockDir: string, selfPid: number, release: (dir: string) => void): void {
  const owner = readLockOwnerPid(lockDir)
  if (owner === null || owner === selfPid) release(lockDir)
}
