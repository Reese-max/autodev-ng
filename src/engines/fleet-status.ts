export type FleetStatus = 'ALIVE' | 'DEAD' | 'UNKNOWN'
export type PidAliveQuery = (pid: number) => boolean

/** 將 daemon.lock 的 PID 與可注入存活查詢轉成艦隊卡片狀態。 */
export function fleetStatusFromLockPid(lockPid: unknown, isPidAlive: PidAliveQuery): FleetStatus {
  if (typeof lockPid !== 'number' || !Number.isInteger(lockPid) || lockPid <= 0) return 'UNKNOWN'
  return isPidAlive(lockPid) ? 'ALIVE' : 'DEAD'
}
