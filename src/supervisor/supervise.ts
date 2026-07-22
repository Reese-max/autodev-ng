import { execFileSync, spawn } from 'node:child_process'
import { closeSync, mkdirSync, openSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { ConfigSchema, DEFAULT_STALE_THRESHOLD_MS } from '../types.js'
import { classifyDaemon, type DaemonAction } from './health.js'

export { DEFAULT_STALE_THRESHOLD_MS } from '../types.js'
const COMMAND_TIMEOUT_MS = 10_000

export type CommandRunner = (command: string, args: string[]) => string
export type LaunchDaemon = (configPath: string, dataDir: string) => number | undefined
export type ReapDaemon = (pid: number) => void

export interface SuperviseOptions {
  nowMs?: number
  staleThresholdMs?: number
  runCommand?: CommandRunner
  launch?: LaunchDaemon
  reap?: ReapDaemon
  cliPath?: string
}

export interface SuperviseResult {
  configPath: string
  dataDir: string
  lockPresent: boolean
  pid: number | null
  pidAlive: boolean
  heartbeatAgeMs: number | null
  childCount: number
  action: DaemonAction
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

function configDataDir(configPath: string): { dataDir: string; staleThresholdMs: number } {
  const absolutePath = resolve(configPath)
  const cfg = ConfigSchema.parse(JSON.parse(readFileSync(absolutePath, 'utf8')))
  return {
    dataDir: resolve(dirname(absolutePath), cfg.dataDir),
    staleThresholdMs: cfg.staleThresholdMs,
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
export function launchDaemon(configPath: string, dataDir: string, cliPath: string): number | undefined {
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

function reapDaemon(pid: number, runCommand: CommandRunner): void {
  runCommand('taskkill', ['/PID', String(pid), '/T', '/F'])
}

export function superviseConfig(configPath: string, options: SuperviseOptions = {}): SuperviseResult {
  const absolutePath = resolve(configPath)
  const config = configDataDir(absolutePath)
  const { dataDir } = config
  const lock = readLockProbe(dataDir)
  const heartbeat = readHeartbeatAge(dataDir, options.nowMs ?? Date.now())
  const lockPresent = lock.lockPresent
  const pid = lock.pid
  const heartbeatAgeMs = heartbeat.value
  const runCommand = options.runCommand ?? defaultRunCommand
  const probeErrors = [lock.error, heartbeat.error].filter((error): error is string => error !== undefined)
  let probeFailed = probeErrors.length > 0

  let pidAlive = false
  let childCount = 0
  if (pid !== null) {
    let tasklistSucceeded = true
    try {
      pidAlive = isNodePidAlive(pid, runCommand)
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
    }
  }

  const action = probeFailed
    ? 'keep'
    : classifyDaemon({
      pidAlive,
      heartbeatAgeMs,
      childCount,
      staleThresholdMs: options.staleThresholdMs ?? config.staleThresholdMs ?? DEFAULT_STALE_THRESHOLD_MS,
    })

  let launchedPid: number | undefined
  if (action !== 'keep') {
    const launch = options.launch ?? ((cfgPath, dir) => {
      const cliPath = options.cliPath ?? process.argv[1]
      if (!cliPath) throw new Error('無法判定 CLI 路徑')
      return launchDaemon(cfgPath, dir, cliPath)
    })
    if (action === 'reap') {
      if (pid === null) throw new Error('reap 決策缺少 PID')
      const reap = options.reap ?? (targetPid => reapDaemon(targetPid, runCommand))
      reap(pid)
    }
    launchedPid = launch(absolutePath, dataDir)
    // openSync share-busy → launchDaemon returns undefined (batch-parity silent skip)
    if (launchedPid === undefined) {
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
    action,
    ...(launchedPid === undefined ? {} : { launchedPid }),
    probeErrors,
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
