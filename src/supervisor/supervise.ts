import { execFileSync, spawn } from 'node:child_process'
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { ConfigSchema } from '../types.js'
import { classifyDaemon, type DaemonAction } from './health.js'

export const DEFAULT_STALE_THRESHOLD_MS = 30 * 60_000
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

function configDataDir(configPath: string): string {
  const absolutePath = resolve(configPath)
  const cfg = ConfigSchema.parse(JSON.parse(readFileSync(absolutePath, 'utf8')))
  return resolve(dirname(absolutePath), cfg.dataDir)
}

function readLockPid(dataDir: string): number | null {
  try {
    const raw: unknown = JSON.parse(readFileSync(join(dataDir, 'daemon.lock', 'pid.json'), 'utf8'))
    const pid = (raw as { pid?: unknown } | null)?.pid
    return typeof pid === 'number' && Number.isInteger(pid) && pid > 0 ? pid : null
  } catch {
    return null
  }
}

function readHeartbeatAge(dataDir: string, nowMs: number): number | null {
  try {
    return Math.max(0, nowMs - statSync(join(dataDir, 'heartbeat.json')).mtimeMs)
  } catch {
    return null
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
    const fields = line.match(/^"([^"]+)","([^"]+)"/)
    return fields?.[1]?.toLowerCase() === 'node.exe' && Number(fields[2]?.replace(/\D/g, '')) === pid
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
  return output.replace(/\0/g, '').match(/^ProcessId=\d+\s*$/gm)?.length ?? 0
}

function launchDaemon(configPath: string, dataDir: string, cliPath: string): number | undefined {
  mkdirSync(dataDir, { recursive: true })
  const logFd = openSync(join(dataDir, 'daemon-console.log'), 'a')
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
  const dataDir = configDataDir(absolutePath)
  const lockPresent = existsSync(join(dataDir, 'daemon.lock'))
  const pid = readLockPid(dataDir)
  const heartbeatAgeMs = readHeartbeatAge(dataDir, options.nowMs ?? Date.now())
  const runCommand = options.runCommand ?? defaultRunCommand
  const probeErrors: string[] = []

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
      probeErrors.push(`tasklist: ${errorText(error)}`)
    }
    if (tasklistSucceeded && pidAlive) {
      try {
        childCount = countChildProcesses(pid, runCommand)
      } catch (error) {
        childCount = 1
        probeErrors.push(`child-process: ${errorText(error)}`)
      }
    }
  }

  const action = classifyDaemon({
    pidAlive,
    heartbeatAgeMs,
    childCount,
    staleThresholdMs: options.staleThresholdMs ?? DEFAULT_STALE_THRESHOLD_MS,
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
