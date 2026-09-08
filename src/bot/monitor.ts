import { readFileSync, statSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { parseBacklog } from '../backlog.js'
import { githubConsole } from '../github/console.js'
import { ConfigSchema, type Config } from '../types.js'

export function loadMonitorConfig(file: string): Config {
  const cfg = ConfigSchema.parse(JSON.parse(readFileSync(file, 'utf8')))
  for (const key of ['dataDir', 'stopFile', 'backlogFile', 'projectPath'] as const) cfg[key] = resolve(dirname(file), cfg[key])
  return cfg
}

/** Read-only operator evidence; a live PID alone never proves a working daemon. */
export function readMonitor(cfg: Config, cfgPath: string, now = Date.now()) {
  const errors: string[] = []
  const read = (file: string, optional = false): string | null => {
    try {
      // ponytail: cap each monitoring input at 2 MiB; use streaming if operational files exceed this.
      if (statSync(file).size > 2 * 1024 * 1024) throw new Error('oversize')
      return readFileSync(file, 'utf8')
    } catch (e) {
      if (!optional || (e as NodeJS.ErrnoException).code !== 'ENOENT') errors.push(`${basename(file)}：無法讀取或過大`)
      return null
    }
  }
  const json = (file: string): Record<string, unknown> | null => {
    const raw = read(file, true)
    if (raw === null) return null
    try {
      const value: unknown = JSON.parse(raw)
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid')
      return value as Record<string, unknown>
    } catch { errors.push(`${basename(file)}：格式損毀`); return null }
  }
  const flag = (file: string): boolean | null => {
    try { statSync(file); return true }
    catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return false
      errors.push('暫停旗標：無法確認'); return null
    }
  }
  const hb = json(join(cfg.dataDir, 'heartbeat.json'))
  let heartbeat: { ts: string; state: string; currentTask: string | null; ageMs: number; stale: boolean; recordedCostUsd: number | null } | null = null
  if (hb) {
    const ts = typeof hb.ts === 'string' ? Date.parse(hb.ts) : NaN
    if (!Number.isFinite(ts) || ts > now + 60_000 || typeof hb.state !== 'string') errors.push('heartbeat.json：時間或狀態無效')
    else heartbeat = {
      ts: hb.ts as string, state: hb.state.slice(0, 80),
      currentTask: typeof hb.currentTask === 'string' ? hb.currentTask.slice(0, 200) : null,
      ageMs: Math.max(0, now - ts), stale: now - ts > cfg.staleThresholdMs,
      recordedCostUsd: typeof hb.todayCostUsd === 'number' && Number.isFinite(hb.todayCostUsd) && hb.todayCostUsd >= 0 ? hb.todayCostUsd : null,
    }
  }
  const lock = json(join(cfg.dataDir, 'daemon.lock', 'pid.json'))
  const pid = typeof lock?.pid === 'number' && Number.isSafeInteger(lock.pid) && lock.pid > 0 ? lock.pid : null
  let processState: 'present' | 'absent' | 'unknown' = lock || errors.some(e => e.startsWith('pid.json')) ? 'unknown' : 'absent'
  if (lock && pid === null) errors.push('pid.json：PID 無效')
  if (pid !== null) {
    try { process.kill(pid, 0); processState = 'present' }
    catch (e) { processState = (e as NodeJS.ErrnoException).code === 'ESRCH' ? 'absent' : 'unknown' }
  }
  let backlog: { open: number; blocked: number; done: number; superseded: number } | null = null
  const backlogText = read(cfg.backlogFile)
  if (backlogText !== null) {
    try {
      const tasks = parseBacklog(backlogText)
      backlog = { open: 0, blocked: 0, done: 0, superseded: 0 }
      for (const task of tasks) backlog[task.status]++
    } catch { errors.push('backlog：無法解析') }
  }
  const dlqText = read(join(cfg.dataDir, 'notify-dlq.jsonl'), true)
  const dlqCount = errors.some(e => e.startsWith('notify-dlq.jsonl')) ? null : (dlqText?.split(/\r?\n/).filter(Boolean).length ?? 0)
  const paused = flag(cfg.stopFile), fleetPaused = flag(resolve(dirname(cfgPath), '.adng.stop'))
  const health = paused || fleetPaused ? 'paused'
    : errors.length || processState === 'unknown' ? 'unknown'
    : processState === 'absent' ? 'not-running'
    : !heartbeat ? 'unknown' : heartbeat.stale ? 'stale'
    : ['cost-stopped', 'preflight-failed', 'stopped'].includes(heartbeat.state) ? 'blocked' : 'observed'
  return { project: basename(cfgPath, '.json'), checkedAt: new Date(now).toISOString(), health, paused, fleetPaused,
    process: { pid, state: processState, identityVerified: false }, heartbeat, backlog, dlqCount, errors }
}

export function monitorRuntimeLines(m: ReturnType<typeof readMonitor>): string[] {
  const hb = m.heartbeat
  return [
    `監控：${m.health}｜${m.checkedAt}`,
    hb ? `heartbeat：${hb.ts}｜state=${hb.state}｜${Math.floor(hb.ageMs / 1000)} 秒前${hb.stale ? '（心跳過期，請檢查）' : ''}${hb.currentTask ? `｜任務=${hb.currentTask}` : ''}` : '尚無 heartbeat 紀錄或資料無效',
    `daemon 進程：${m.process.state === 'present' ? 'PID 存在（未核對程序身分）' : m.process.state === 'absent' ? '未偵測到' : '未知'}`,
    `派工：${m.paused || m.fleetPaused ? `已暫停${m.fleetPaused ? '（車隊旗標）' : ''}` : m.paused === null || m.fleetPaused === null ? '未知' : '未暫停'}`,
  ]
}

export function formatMonitor(m: ReturnType<typeof readMonitor>): string {
  return [
    `adng 監控｜${m.project}`, ...monitorRuntimeLines(m),
    m.backlog ? `backlog：open ${m.backlog.open}｜blocked ${m.backlog.blocked}｜done ${m.backlog.done}｜superseded ${m.backlog.superseded}` : 'backlog：未知',
    `通知 DLQ：${m.dlqCount ?? '未知'} 筆`,
    `心跳成本快照：${m.heartbeat?.recordedCostUsd == null ? '未知' : '$' + m.heartbeat.recordedCostUsd.toFixed(4)}（依心跳時間；非帳單）`,
    ...m.errors.map(e => `⚠ ${e}`),
  ].join('\n')
}

/** Local delivery receipts only: viewing Discord never refreshes GitHub or queues work. */
export async function githubMonitor(cfgPath: string): Promise<string> {
  const snapshot = await githubConsole(cfgPath)
  if (!('integrations' in snapshot) || !snapshot.integrations.length) return '尚無符合此專案的 GitHub 整合'
  return ['adng GitHub 監控（本機收據；遠端狀態為上次觀測）', ...snapshot.integrations.flatMap(i => [
    `【${i.name}】${i.repo ?? ''}｜${i.paused ? '已暫停' : '已啟用'}｜followup=${i.followup ?? '未知'}`,
    ...(i.error ? [i.error] : [`Issue ${i.issues.length} 筆`, ...i.issues.slice(0, 10).map(s =>
      `#${s.number} ${s.status}｜次數 ${s.runs}/${s.maxRuns}｜驗證 ${s.verified ? '通過' : '未通過或尚無收據'}｜${s.remote?.state ?? '遠端未知'}｜接受 ${s.accepted ? '已記錄' : '未記錄'}${s.pr ? `\n${s.pr}` : ''}`),
    ...(i.issues.length > 10 ? ['僅列前 10 筆；完整清單請用 adng github status'] : [])]),
  ])].join('\n')
}
