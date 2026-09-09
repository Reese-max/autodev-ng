import Database from 'better-sqlite3'
import { execFileSync, spawn } from 'node:child_process'
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pidTreeDeepestFirst, type FlatPidProcess } from '../engines/proc.js'
import { EventLog } from '../events.js'
import { releaseLock } from '../lock.js'
import { ConfigSchema, DEFAULT_REAP_GRACE_MS, DEFAULT_STALE_THRESHOLD_MS, DEFAULT_WEDGE_HARD_CAP_MS } from '../types.js'
import { classifyDaemon, hasEngineProcess, type DaemonAction } from './health.js'
import { withPauseGate } from './pause-gate.js'
import { readExecutions, type ExecutionInventory } from '../engines/execution-observation.js'

export { DEFAULT_STALE_THRESHOLD_MS, DEFAULT_WEDGE_HARD_CAP_MS } from '../types.js'
export const HEARTBEAT_WATCHDOG_MS = 30 * 60_000
const COMMAND_TIMEOUT_MS = 10_000

export type CommandRunner = (command: string, args: string[]) => string
export type LaunchDaemon = (configPath: string, dataDir: string) => number | undefined
export type ReapDaemon = (pid: number) => void

export interface SuperviseOptions {
  observeOnly?: boolean
  nowMs?: number
  staleThresholdMs?: number
  wedgeHardCapMs?: number
  runCommand?: CommandRunner
  launch?: LaunchDaemon
  reap?: ReapDaemon
  cliPath?: string
}

export interface SuperviseResult {
  observationOnly?: boolean
  executions?: ExecutionInventory
  configPath: string
  dataDir: string
  lockPresent: boolean
  pid: number | null
  pidAlive: boolean
  heartbeatAgeMs: number | null
  childCount: number
  staleThresholdMs: number
  wedgeHardCapMs: number
  action: DaemonAction
  paused?: boolean
  launchedPid?: number
  probeErrors: string[]
}

export type SuperviseDirectoryResult = SuperviseResult | { configPath: string; error: string }

function defaultRunCommand(command: string, args: string[]): string {
  return execFileSync(command, args, {
    encoding: 'utf8',
    timeout: COMMAND_TIMEOUT_MS,
    windowsHide: true,
  })
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isEnoent(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as NodeJS.ErrnoException).code === 'ENOENT'
}

function configDataDir(configPath: string): { dataDir: string; stopFiles: string[]; staleThresholdMs: number; wedgeHardCapMs: number; reapGraceMs?: number; observedExecutions: boolean } {
  const absolutePath = resolve(configPath)
  const cfg = ConfigSchema.parse(JSON.parse(readFileSync(absolutePath, 'utf8')))
  const baseDir = dirname(absolutePath)
  return {
    dataDir: resolve(baseDir, cfg.dataDir),
    stopFiles: [...new Set([resolve(baseDir, '.adng.stop'), resolve(baseDir, cfg.stopFile)])],
    staleThresholdMs: cfg.staleThresholdMs,
    wedgeHardCapMs: cfg.wedgeHardCapMs,
    reapGraceMs: cfg.reapGraceMs,
    observedExecutions: Object.values(cfg.engines).some(ec => ec.executionMode === 'observed' || ec.executionMode === 'supervised'),
  }
}

/** run.db 最新 attempt 完成時刻（epoch ms）；庫缺/鎖住/空庫回 null（呼叫端自行決定語義）。 */
function latestAttemptEndMs(dataDir: string): number | null {
  try {
    const db = new Database(join(dataDir, 'run.db'), { readonly: true, fileMustExist: true })
    try {
      const row = db.prepare('SELECT ts FROM attempts ORDER BY seq DESC LIMIT 1').get() as { ts?: string } | undefined
      const parsed = row?.ts ? Date.parse(row.ts) : NaN
      return Number.isFinite(parsed) ? parsed : null
    } finally {
      db.close()
    }
  } catch {
    return null
  }
}

interface LockProbe {
  lockPresent: boolean
  pid: number | null
  error?: string
}

function readLockProbe(dataDir: string): LockProbe {
  const lockDir = join(dataDir, 'daemon.lock')
  try {
    statSync(lockDir)
  } catch (error) {
    if (isEnoent(error)) return { lockPresent: false, pid: null }
    return { lockPresent: false, pid: null, error: `lock: ${errorText(error)}` }
  }

  try {
    const raw: unknown = JSON.parse(readFileSync(join(lockDir, 'pid.json'), 'utf8'))
    const pid = (raw as { pid?: unknown } | null)?.pid
    if (typeof pid !== 'number' || !Number.isInteger(pid) || pid <= 0) {
      return { lockPresent: true, pid: null, error: 'lock: pid.json 內容無效' }
    }
    return { lockPresent: true, pid }
  } catch (error) {
    return { lockPresent: true, pid: null, error: `lock: ${errorText(error)}` }
  }
}

interface Probe<T> {
  value: T
  error?: string
}

function readHeartbeatAge(dataDir: string, nowMs: number): Probe<number | null> {
  try {
    const mtimeMs = statSync(join(dataDir, 'heartbeat.json')).mtimeMs
    const rawAge = nowMs - mtimeMs
    if (!Number.isFinite(mtimeMs) || !Number.isFinite(rawAge)) {
      return { value: null, error: 'heartbeat: mtime 無效' }
    }
    return { value: Math.max(0, rawAge) }
  } catch (error) {
    if (isEnoent(error)) return { value: null }
    return { value: null, error: `heartbeat: ${errorText(error)}` }
  }
}

export function isNodePidAlive(pid: number, runCommand: CommandRunner = defaultRunCommand): boolean {
  const output = runCommand('tasklist', [
    '/FI', `PID eq ${pid}`,
    '/FI', 'IMAGENAME eq node.exe',
    '/FO', 'CSV',
    '/NH',
  ])
  return output.split(/\r?\n/).some(line => {
    const fields = line.trim().match(/^"([^"]+)","(\d+)"/)
    return fields?.[1]?.toLowerCase() === 'node.exe' && Number(fields[2]) === pid
  })
}

function parseCount(output: string): number | null {
  const value = output.trim()
  return /^\d+$/.test(value) ? Number(value) : null
}

/** PowerShell CIM 是主路徑；舊 Windows 缺 CIM 或查詢失敗時才回退 wmic。 */
export function countChildProcesses(pid: number, runCommand: CommandRunner = defaultRunCommand): number {
  try {
    const output = runCommand('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `(Get-CimInstance Win32_Process -Filter 'ParentProcessId=${pid}' | Measure-Object).Count`,
    ])
    const count = parseCount(output)
    if (count !== null) return count
  } catch {
    // Windows 版本或 CIM 故障時走既有 wmic 相容路徑。
  }

  const output = runCommand('wmic', [
    'process',
    'where',
    `ParentProcessId=${pid}`,
    'get',
    'ProcessId',
    '/value',
  ])
  return output
    .replace(/\0/g, '')
    .split(/\r?\n/)
    .filter(line => /^ProcessId\s*=\s*\d+$/.test(line.trim()))
    .length
}

/** 只在 hard-cap 已過時查完整子樹，避免一般 supervise cycle 多一次 CIM I/O。 */
export function listDescendantProcessNames(pid: number, runCommand: CommandRunner = defaultRunCommand): string[] {
  const output = runCommand('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    `$all = @(Get-CimInstance Win32_Process); $pending = @(${pid}); $names = @(); while ($pending.Count) { $parent = $pending[0]; $pending = @($pending | Select-Object -Skip 1); $children = @($all | Where-Object { $_.ParentProcessId -eq $parent }); $pending += @($children | ForEach-Object { [int]$_.ProcessId }); $names += @($children | ForEach-Object { $_.Name }) }; ConvertTo-Json -Compress -InputObject @($names)`,
  ])
  const parsed: unknown = JSON.parse(output)
  const names = Array.isArray(parsed) ? parsed : [parsed]
  if (!names.every(name => typeof name === 'string')) throw new Error('子進程樹輸出無效')
  return names
}

/**
 * Windows file-sharing codes seen when a live daemon still holds
 * daemon-console.log open for write (shell >> or inherited stdio).
 * Matches the empirical adng-daemons.cmd redirect failure path.
 */
export function isDaemonConsoleLogBusyError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const code = (error as NodeJS.ErrnoException).code
  return code === 'EBUSY' || code === 'EPERM' || code === 'EACCES' || code === 'EEXIST'
}

/**
 * Open dataDir/daemon-console.log for append. Holding this fd (and
 * inheriting it as child stdout/stderr) is the shared-lock that
 * blocks a second concurrent launcher from writing the same log.
 */
export function openDaemonConsoleLog(dataDir: string): number {
  mkdirSync(dataDir, { recursive: true })
  return openSync(join(dataDir, 'daemon-console.log'), 'a')
}

/** Spawn detached daemon with stdout/stderr tied to daemon-console.log. */
export function launchDaemon(configPath: string, dataDir: string, cliPath: string, paused: () => boolean = () => false): number | undefined {
  if (paused()) return undefined
  let logFd: number
  try {
    logFd = openDaemonConsoleLog(dataDir)
  } catch (error) {
    // Same as cmd ">>log" failing when another process holds the file:
    // skip spawn; next supervise cycle retries.
    if (isDaemonConsoleLogBusyError(error)) return undefined
    throw error
  }
  try {
    if (paused()) return undefined
    const child = spawn(process.execPath, [cliPath, 'daemon', '--config', configPath], {
      detached: true,
      stdio: ['ignore', logFd, logFd],
      windowsHide: true,
    })
    child.unref()
    return child.pid
  } finally {
    closeSync(logFd)
  }
}

export function reapDaemonTree(pid: number, runCommand: CommandRunner = defaultRunCommand, paused: () => boolean = () => false): boolean {
  if (!Number.isInteger(pid) || pid <= 0) throw new Error(`無效 daemon PID: ${pid}`)
  if (paused()) return false
  if (process.platform !== 'win32') {
    try { process.kill(pid, 'SIGKILL') } catch { /* 已死 */ }
    return true
  }
  // 快路徑：taskkill /T /F 對健康樹最快；卡死樹會「存取被拒」拋錯（playbook §2.3），
  // 舊版在此直接讓錯誤外拋 → decision=error → 不 relaunch → 孤兒抱住 worktree。改吞錯走後備。
  try { runCommand('taskkill', ['/PID', String(pid), '/T', '/F']) } catch { /* 走後備樹斬 */ }
  if (!pidAliveSync(pid)) return true
  sleepSync(2_000)
  if (!pidAliveSync(pid)) return true
  // 後備：CIM 枚舉全樹、葉到根逐一 TerminateProcess（等效 Stop-Process -Force，§2.3 唯一可靠殺法）
  for (const proc of pidTreeDeepestFirst(pid, listProcessesSync(runCommand), '')) {
    try { process.kill(proc.pid) } catch { /* 已死 */ }
  }
  sleepSync(500) // TerminateProcess 非同步沉降，防偽「仍存活」
  if (pidAliveSync(pid)) throw new Error(`reapDaemonTree: PID ${pid} 樹斬後仍存活`)
  return true
}

function pidAliveSync(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function listProcessesSync(runCommand: CommandRunner): FlatPidProcess[] {
  const script = 'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name | ConvertTo-Json -Compress'
  let raw = ''
  try {
    raw = runCommand('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script])
  } catch { return [] }
  try {
    const rows = JSON.parse(raw) as Array<{ ProcessId?: number; ParentProcessId?: number; Name?: string }>
    return (Array.isArray(rows) ? rows : [rows]).flatMap(row => typeof row.ProcessId === 'number'
      ? [{ pid: row.ProcessId, parentPid: row.ParentProcessId, command: row.Name ?? '' }]
      : [])
  } catch { return [] }
}

export function superviseConfig(configPath: string, options: SuperviseOptions = {}): SuperviseResult {
  const absolutePath = resolve(configPath)
  const config = configDataDir(absolutePath)
  const { dataDir } = config
  const staleThresholdMs = options.staleThresholdMs ?? config.staleThresholdMs ?? DEFAULT_STALE_THRESHOLD_MS
  const wedgeHardCapMs = options.wedgeHardCapMs ?? config.wedgeHardCapMs ?? DEFAULT_WEDGE_HARD_CAP_MS
  const isPaused = () => config.stopFiles.some(file => existsSync(file))
  if (isPaused()) return {
    configPath: absolutePath, dataDir, lockPresent: false, pid: null, pidAlive: false,
    heartbeatAgeMs: null, childCount: 0, staleThresholdMs, wedgeHardCapMs,
    action: 'keep', paused: true, probeErrors: [],
  }
  const lock = readLockProbe(dataDir)
  const heartbeat = readHeartbeatAge(dataDir, options.nowMs ?? Date.now())
  const lockPresent = lock.lockPresent
  const pid = lock.pid
  const heartbeatAgeMs = heartbeat.value
  const runCommand = options.runCommand ?? defaultRunCommand
  const probeErrors = [lock.error, heartbeat.error].filter((error): error is string => error !== undefined)
  let probeFailed = probeErrors.length > 0

  let pidAlive = false
  let pidProbeSucceeded = false
  let childCount = 0
  let hasEngineChild: boolean | null = null
  if (pid !== null) {
    let tasklistSucceeded = true
    try {
      pidAlive = isNodePidAlive(pid, runCommand)
      pidProbeSucceeded = true
    } catch (error) {
      // 探測失敗時保守視為存活且有 child，避免誤殺；下次 supervise 會重試。
      tasklistSucceeded = false
      pidAlive = true
      childCount = 1
      probeFailed = true
      probeErrors.push(`tasklist: ${errorText(error)}`)
    }
    if (tasklistSucceeded && pidAlive) {
      try {
        childCount = countChildProcesses(pid, runCommand)
      } catch (error) {
        childCount = 1
        probeFailed = true
        probeErrors.push(`child-process: ${errorText(error)}`)
      }
      if (childCount > 0 && heartbeatAgeMs != null && heartbeatAgeMs > wedgeHardCapMs) {
        try {
          hasEngineChild = hasEngineProcess(listDescendantProcessNames(pid, runCommand))
        } catch (error) {
          probeFailed = true
          probeErrors.push(`child-process-tree: ${errorText(error)}`)
        }
      }
    }
  }

  const watchdogExpired = pidProbeSucceeded && pidAlive && heartbeatAgeMs != null && heartbeatAgeMs > HEARTBEAT_WATCHDOG_MS
  const executions = readExecutions(dataDir)
  let action: DaemonAction = watchdogExpired
    ? 'reap'
    : probeFailed
    ? 'keep'
    : classifyDaemon({
      pidAlive,
      heartbeatAgeMs,
      childCount,
      staleThresholdMs,
      hardCapMs: wedgeHardCapMs,
      hasEngineChild,
    })

  // §1.1 長輪陷阱雙證閘（2026-08-03）：daemon 單一 agentic 長輪（實測可達 50 分鐘）期間不更新
  // 心跳，僅憑心跳凍結 reap 會誤殺健康 daemon（2026-08-02 note-filler、2026-08-03 prompt-autoresearch
  // 兩度實證）。reap 前讀 run.db：最新 attempt 完成於心跳凍結之後＝活著；或引擎子進程存在且凍結
  // 時長未超過單輪寬限（reapGraceMs，預設 90 分鐘）＝長輪進行中。雙證（心跳凍結 ≥ 寬限＋run.db
  // 靜默）齊全才 reap。run.db 不可讀（null）時不擋——維持原 watchdog 行為，避免殭屍永生。
  if (action === 'reap' && heartbeatAgeMs != null) {
    const nowMs = options.nowMs ?? Date.now()
    const graceMs = config.reapGraceMs ?? DEFAULT_REAP_GRACE_MS
    const lastEndMs = latestAttemptEndMs(dataDir)
    const attemptAfterFreeze = lastEndMs !== null && lastEndMs > nowMs - heartbeatAgeMs
    const longRoundLikely = childCount > 0 && heartbeatAgeMs < graceMs
    if (attemptAfterFreeze || (lastEndMs !== null && longRoundLikely)) {
      action = 'keep'
      probeErrors.push(
        `reap-downgraded: run.db ${attemptAfterFreeze ? '最新 attempt 完成於心跳凍結後' : `子進程存在且凍結 ${Math.round(heartbeatAgeMs / 60000)} 分未逾寬限 ${Math.round(graceMs / 60000)} 分`}，判定長輪進行中不殺`,
      )
    }
  }

  // Observe before destructive decisions. Stale or corrupt evidence cannot grant a new writer.
  if (executions.protected || (config.observedExecutions && (action === 'reap' || (lockPresent && executions.records.length === 0)))) action = 'keep'
  const executionProtected = () => readExecutions(dataDir).protected
  const interventionsBlocked = () => isPaused() || executionProtected()
  let paused = isPaused()
  if (paused) action = 'keep'

  let launchedPid: number | undefined
  let daemonReaped = false
  if (action !== 'keep' && !options.observeOnly) {
    const launch = options.launch ?? ((cfgPath, dir) => {
      const cliPath = options.cliPath ?? process.argv[1]
      if (!cliPath) throw new Error('無法判定 CLI 路徑')
      return launchDaemon(cfgPath, dir, cliPath, interventionsBlocked)
    })
    if (action === 'reap') {
      if (pid === null) throw new Error('reap 決策缺少 PID')
      const reaped = withPauseGate(config.stopFiles, () => {
        if (interventionsBlocked()) return false
        if (options.reap) { options.reap(pid); return true }
        return reapDaemonTree(pid, runCommand, interventionsBlocked)
      })
      daemonReaped = reaped
      if (!reaped || isPaused()) { paused = true; action = 'keep' }
    }
    if (pid !== null && (daemonReaped || !paused) && !executionProtected()) {
      releaseLock(join(dataDir, 'daemon.lock'))
    }
    if (daemonReaped && watchdogExpired && heartbeatAgeMs != null) {
      try {
        new EventLog(dataDir).append('daemon-wedge-recovered', {
          frozenMinutes: Math.floor(heartbeatAgeMs / 60_000),
        })
      } catch (error) {
        probeErrors.push(`event: ${errorText(error)}`)
      }
    }
    if (!paused && isPaused()) { paused = true; action = 'keep' }
    if (!paused) launchedPid = withPauseGate(config.stopFiles, () => interventionsBlocked() ? undefined : launch(absolutePath, dataDir))
    if (launchedPid === undefined && isPaused()) { paused = true; action = 'keep' }
    // openSync share-busy → launchDaemon returns undefined (batch-parity silent skip)
    if (launchedPid === undefined && !paused) {
      probeErrors.push('daemon-console.log: 檔案共享鎖占用，略過啟動')
    }
  }

  return {
    configPath: absolutePath,
    dataDir,
    lockPresent,
    pid,
    pidAlive,
    heartbeatAgeMs,
    childCount,
    staleThresholdMs,
    wedgeHardCapMs,
    action,
    ...(paused ? { paused: true } : {}),
    ...(launchedPid === undefined ? {} : { launchedPid }),
    probeErrors,
    ...(executions.records.length || executions.errors.length ? { executions } : {}),
    ...(options.observeOnly ? { observationOnly: true } : {}),
  }
}

export function superviseDirectory(configsDir: string, options: SuperviseOptions = {}): SuperviseDirectoryResult[] {
  const dir = resolve(configsDir)
  const configPaths = readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
    .map(entry => resolve(dir, entry.name))
    .sort((a, b) => a.localeCompare(b))

  return configPaths.map(configPath => {
    try {
      return superviseConfig(configPath, options)
    } catch (error) {
      return { configPath, error: errorText(error) }
    }
  })
}
