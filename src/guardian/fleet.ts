import { execFileSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import {
  appendFileSync, closeSync, existsSync, futimesSync, mkdirSync, openSync,
  readFileSync, renameSync, statSync, unlinkSync, writeFileSync, writeSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { EventLog, quiet } from '../events.js'
import { buildFleetCodexEnv, ensureFleetCodexHome } from '../engines/codex-runtime.js'
import { runProcess, type ProcResult } from '../engines/proc.js'
import {
  reapDaemonTree, superviseConfig, type SuperviseDirectoryResult, type SuperviseResult,
} from '../supervisor/supervise.js'
import { withPauseGate } from '../supervisor/pause-gate.js'
import { ConfigSchema } from '../types.js'
import { runVerify, type VerifyOutcome } from '../verify.js'
import {
  DECISION_JSON_SCHEMA, GUARDIAN_EFFORT, GUARDIAN_MODEL,
  guardianCodexArgs, parseGuardianDecision, parseGuardianTelemetry, type GuardianDecision,
} from './codex.js'
import {
  guardianPrompt, incidentParts, isErrorResult, latestTs, readEvents, readState,
  resolveProjectPath, stateFile, writeJsonAtomic, type GuardianState,
} from './incident.js'

export const GUARDIAN_IDLE_TIMEOUT_MS = 30 * 60_000
export const GUARDIAN_INCIDENT_COOLDOWN_MS = 60 * 60_000
const GUARDIAN_LOCK_STALE_MS = GUARDIAN_IDLE_TIMEOUT_MS + 5 * 60_000
const AUDIT_MAX_LINES = 2_000
const AUDIT_KEEP_LINES = 1_000
const PROBE_RETRIES = 5
const PROBE_RETRY_MS = 1_000
const HEARTBEAT_RETRIES = 60
const HEARTBEAT_RETRY_MS = 2_000

type ProcessRunner = (opts: Parameters<typeof runProcess>[0]) => Promise<ProcResult>
type VerifyRunner = (opts: Parameters<typeof runVerify>[0]) => Promise<VerifyOutcome>
type SupervisorRunner = typeof superviseConfig
type NotifyFn = (configPath: string, text: string) => Promise<boolean>

export type GuardianReport =
  | { configPath: string; kind: 'completed'; decision: GuardianDecision }
  | { configPath: string; kind: 'failed'; error: string }
  | { configPath: string; kind: 'skipped'; reason: 'healthy' | 'already-handled' | 'cooldown' | 'locked' | 'paused' }

interface LockOwner {
  pid: number
  token?: string
  startedAt?: string
  processStartedAt?: string
}

export interface FleetGuardianOptions {
  nowMs?: number
  fleetDataDir?: string
  cliPath?: string
  runProcessFn?: ProcessRunner
  verifyFn?: VerifyRunner
  superviseFn?: SupervisorRunner
  notifyFn?: NotifyFn
  sleepFn?: (ms: number) => Promise<void>
  pidAliveFn?: (pid: number) => boolean
  reapStaleOwnerFn?: (owner: LockOwner) => boolean
  reapDaemonFn?: (pid: number) => void
}

function rotateAuditIfNeeded(file: string): void {
  try {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean)
    if (lines.length <= AUDIT_MAX_LINES) return
    const tmp = `${file}.tmp`
    writeFileSync(tmp, lines.slice(-AUDIT_KEEP_LINES).join('\n') + '\n')
    renameSync(tmp, file)
  } catch { /* 稽核輪替故障不可反殺 Guardian。 */ }
}

function appendAudit(dataDir: string, record: Record<string, unknown>): void {
  mkdirSync(dataDir, { recursive: true })
  const file = join(dataDir, 'guardian-runs.jsonl')
  appendFileSync(file, JSON.stringify(record) + '\n')
  rotateAuditIfNeeded(file)
}

function pidAlive(pid: number): boolean {
  try { process.kill(pid, 0); return true } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM'
  }
}

function readLockOwner(file: string): LockOwner | null {
  try {
    const raw = readFileSync(file, 'utf8').trim()
    if (/^\d+$/.test(raw)) return { pid: Number(raw) } // 舊版 PID-only 鎖，只辨識、不自動誤殺。
    const value = JSON.parse(raw) as Partial<LockOwner>
    return Number.isInteger(value.pid) && value.pid! > 0 ? value as LockOwner : null
  } catch { return null }
}

/** Windows 僅在 Node 建立時間吻合、無工作子行程且 750ms CPU 無增量時精準樹斬。 */
function reapStaleGuardianOwner(owner: LockOwner): boolean {
  if (process.platform !== 'win32' || !owner.processStartedAt) return false
  try {
    const ps = [
      `$p = Get-Process -Id ${owner.pid} -ErrorAction Stop`,
      '$cpu = [double]$p.CPU',
      'Start-Sleep -Milliseconds 750',
      `$p2 = Get-Process -Id ${owner.pid} -ErrorAction Stop`,
      `$children = @(Get-CimInstance Win32_Process -Filter "ParentProcessId=${owner.pid}")`,
      `$workloadCount = @($children | Where-Object { $_.Name -ne 'conhost.exe' }).Count`,
      `[pscustomobject]@{name=$p2.ProcessName;startedAt=$p2.StartTime.ToUniversalTime().ToString('o');cpuDelta=([double]$p2.CPU-$cpu);workloadCount=$workloadCount} | ConvertTo-Json -Compress`,
    ].join('; ')
    const raw = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], {
      encoding: 'utf8', timeout: 10_000, windowsHide: true,
    })
    const probe = JSON.parse(raw) as { name?: unknown; startedAt?: unknown; cpuDelta?: unknown; workloadCount?: unknown }
    const startedAt = typeof probe.startedAt === 'string' ? Date.parse(probe.startedAt) : NaN
    const expected = Date.parse(owner.processStartedAt)
    const sameProcess = String(probe.name).toLowerCase() === 'node'
      && Number.isFinite(startedAt) && Number.isFinite(expected) && Math.abs(startedAt - expected) <= 5_000
    if (!sameProcess || probe.workloadCount !== 0 || typeof probe.cpuDelta !== 'number' || probe.cpuDelta > 0.05) return false
    execFileSync('taskkill', ['/PID', String(owner.pid), '/T', '/F'], { timeout: 10_000, windowsHide: true })
    return !pidAlive(owner.pid)
  } catch { return false }
}

interface FleetLock {
  touch(): void
  release(): void
  recoveredPid?: number
}

function acquireFleetLock(fleetDataDir: string, options: FleetGuardianOptions): { lock?: FleetLock; blocked?: { pid: number; stale: boolean } } {
  mkdirSync(fleetDataDir, { recursive: true })
  const file = join(fleetDataDir, 'guardian.lock')
  const alive = options.pidAliveFn ?? pidAlive
  const reap = options.reapStaleOwnerFn ?? reapStaleGuardianOwner

  const open = (recoveredPid?: number): FleetLock => {
    const fd = openSync(file, 'wx')
    const token = randomUUID()
    const now = new Date()
    const owner: Required<LockOwner> = {
      pid: process.pid,
      token,
      startedAt: now.toISOString(),
      processStartedAt: new Date(Date.now() - process.uptime() * 1_000).toISOString(),
    }
    writeSync(fd, JSON.stringify(owner))
    return {
      ...(recoveredPid === undefined ? {} : { recoveredPid }),
      touch: () => {
        try { const t = new Date(); futimesSync(fd, t, t) } catch { /* 租約觀測 fail-open。 */ }
      },
      release: () => {
        try { closeSync(fd) } catch { /* 已關閉。 */ }
        try {
          if (readLockOwner(file)?.token === token) unlinkSync(file)
        } catch { /* 鎖已被替換時不碰別人的檔案。 */ }
      },
    }
  }

  try { return { lock: open() } } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
  }

  const owner = readLockOwner(file)
  if (!owner) {
    try { unlinkSync(file); return { lock: open() } } catch { return { blocked: { pid: 0, stale: true } } }
  }
  if (!alive(owner.pid)) {
    try { unlinkSync(file); return { lock: open(owner.pid) } } catch { return { blocked: { pid: owner.pid, stale: true } } }
  }

  let stale = false
  try { stale = Date.now() - statSync(file).mtimeMs > GUARDIAN_LOCK_STALE_MS } catch { /* 保守視為未過期。 */ }
  if (!stale || !reap(owner)) return { blocked: { pid: owner.pid, stale } }
  try {
    if (readLockOwner(file)?.pid !== owner.pid) return { blocked: { pid: owner.pid, stale: true } }
    unlinkSync(file)
    return { lock: open(owner.pid) }
  } catch { return { blocked: { pid: owner.pid, stale: true } } }
}

async function notifyOnce(
  notify: NotifyFn | undefined, configPath: string | undefined, stateFilePath: string,
  state: GuardianState, fingerprint: string, text: string,
): Promise<GuardianState> {
  if (!notify || !configPath || state.lastAlertFingerprint === fingerprint) return state
  let delivered = false
  try { delivered = await notify(configPath, text) } catch { /* 通知失敗由 notifier/DLQ 接手。 */ }
  return delivered ? { ...state, lastAlertFingerprint: fingerprint } : state
}

async function notifyFleetOnce(
  notify: NotifyFn | undefined, configPath: string | undefined, fleetDataDir: string,
  fingerprint: string, text: string,
): Promise<void> {
  const file = join(fleetDataDir, 'guardian-alert-state.json')
  const state = readState(file)
  const next = await notifyOnce(notify, configPath, file, state, fingerprint, text)
  if (next !== state) writeJsonAtomic(file, next)
}

function progressState(state: GuardianState, cursor: ReturnType<typeof readEvents>['cursor'], latestEventTs?: string): GuardianState {
  return {
    ...state,
    ...(cursor ? { eventCursor: cursor } : {}),
    ...(latestEventTs ? { lastEventTs: latestEventTs } : {}),
  }
}

function incidentCoolingDown(state: GuardianState, incidentKey: string, nowMs: number): boolean {
  if (state.lastIncidentKey !== incidentKey || !state.lastIncidentAt) return false
  const handledAt = Date.parse(state.lastIncidentAt)
  return Number.isFinite(handledAt) && nowMs >= handledAt
    && nowMs - handledAt < GUARDIAN_INCIDENT_COOLDOWN_MS
}

function loadVerifyConfig(configPath: string): { command?: string; timeoutMs: number } {
  const cfg = ConfigSchema.parse(JSON.parse(readFileSync(configPath, 'utf8')))
  return { command: cfg.verifyCommand, timeoutMs: cfg.verifyTimeoutMs }
}

function supervisorHealthy(result: SuperviseResult): boolean {
  return result.pidAlive && result.action === 'keep' && result.probeErrors.length === 0 && result.heartbeatAgeMs !== null
}

function guardianStopFiles(result: SuperviseDirectoryResult): string[] {
  const baseDir = dirname(resolve(result.configPath))
  try {
    const cfg = ConfigSchema.parse(JSON.parse(readFileSync(result.configPath, 'utf8')))
    return [...new Set([join(baseDir, '.adng.stop'), resolve(baseDir, cfg.stopFile)])]
  } catch { return [join(baseDir, '.adng.stop')] }
}

interface Acceptance {
  status: 'pass' | 'fail'
  verify: VerifyOutcome
  supervisor?: Pick<SuperviseResult, 'pid' | 'pidAlive' | 'heartbeatAgeMs' | 'childCount' | 'action' | 'probeErrors'>
  detail: string
  forceRestarted?: boolean
  heartbeatProgressed?: boolean
}

function heartbeatMtime(dataDir: string): number | null {
  try { return statSync(join(dataDir, 'heartbeat.json')).mtimeMs } catch { return null }
}

async function waitForHeartbeatProgress(
  dataDir: string, before: number | null, sleep: (ms: number) => Promise<void>,
): Promise<boolean> {
  for (let i = 0; i < HEARTBEAT_RETRIES; i++) {
    const current = heartbeatMtime(dataDir)
    if (current !== null && (before === null || current > before)) return true
    await sleep(HEARTBEAT_RETRY_MS)
  }
  return false
}

async function independentlyVerify(
  result: SuperviseDirectoryResult, decision: GuardianDecision, cwd: string, dataDir: string,
  cliPath: string, options: FleetGuardianOptions, stopFiles: readonly string[],
): Promise<Acceptance> {
  if (isErrorResult(result)) {
    return { status: 'fail', verify: { status: 'skip', detail: 'config/supervisor error' }, detail: result.error }
  }
  if (decision.restartRequired) {
    writeJsonAtomic(join(dataDir, 'restart.request'), { ts: new Date().toISOString(), source: 'fleet-guardian' })
  }
  const cfg = loadVerifyConfig(result.configPath)
  const verify = await (options.verifyFn ?? runVerify)({ command: cfg.command, cwd, timeoutMs: cfg.timeoutMs })
  const verifyAccepted = verify.status === 'pass' || (verify.status === 'skip' && verify.detail === 'no verifyCommand configured')
  const supervise = options.superviseFn ?? superviseConfig
  const sleep = options.sleepFn ?? (ms => new Promise(resolveSleep => setTimeout(resolveSleep, ms)))
  let fresh = supervise(result.configPath, { cliPath })
  let forceRestarted = false
  let heartbeatProgressed = false
  let forceError = ''
  const forceAllowed = decision.forceRestart
    && verifyAccepted
    && result.pid !== null
    && fresh.pid === result.pid
    && fresh.pidAlive
    && fresh.action === 'keep'
    && fresh.probeErrors.length === 0
    && fresh.heartbeatAgeMs !== null
    && fresh.heartbeatAgeMs > fresh.wedgeHardCapMs
    && fresh.childCount > 0
  if (forceAllowed) {
    try {
      const heartbeatBefore = heartbeatMtime(dataDir)
      const reapDaemon = options.reapDaemonFn ?? reapDaemonTree
      const reaped = withPauseGate(stopFiles, () => {
        if (stopFiles.some(file => existsSync(file))) return false
        reapDaemon(fresh.pid!)
        return true
      })
      if (!reaped) throw new Error('fleet 已暫停，取消 force restart')
      try { unlinkSync(join(dataDir, 'restart.request')) } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      }
      forceRestarted = true
      fresh = supervise(result.configPath, { cliPath })
      heartbeatProgressed = await waitForHeartbeatProgress(dataDir, heartbeatBefore, sleep)
      fresh = supervise(result.configPath, { cliPath })
    } catch (error) {
      forceError = error instanceof Error ? error.message : String(error)
    }
  }
  for (let i = 0; i < PROBE_RETRIES && !supervisorHealthy(fresh); i++) {
    await sleep(PROBE_RETRY_MS)
    fresh = supervise(result.configPath, { cliPath })
  }
  const healthy = supervisorHealthy(fresh)
  const restartAccepted = !forceRestarted
    || (heartbeatProgressed && fresh.pid !== null && fresh.pid !== result.pid)
  const detail = [
    `verify=${verify.status}（${verify.detail}）`,
    `supervisor=${fresh.action},pid=${fresh.pid ?? '-'},alive=${fresh.pidAlive},heartbeatAgeMs=${fresh.heartbeatAgeMs ?? '-'},children=${fresh.childCount}`,
    ...(forceRestarted ? ['forceRestart=completed'] : []),
    ...(forceRestarted ? [`heartbeatProgressed=${heartbeatProgressed}`] : []),
    ...(forceError ? [`forceRestart=failed（${forceError}）`] : []),
  ].join('；')
  return {
    status: verifyAccepted && healthy && restartAccepted && !forceError ? 'pass' : 'fail',
    verify,
    supervisor: {
      pid: fresh.pid, pidAlive: fresh.pidAlive, heartbeatAgeMs: fresh.heartbeatAgeMs,
      childCount: fresh.childCount, action: fresh.action, probeErrors: fresh.probeErrors,
    },
    detail,
    ...(forceRestarted ? { forceRestarted: true } : {}),
    ...(forceRestarted ? { heartbeatProgressed } : {}),
  }
}

function applyAcceptance(decision: GuardianDecision, acceptance: Acceptance): GuardianDecision {
  const evidence = [...decision.evidence, `宿主獨立驗收：${acceptance.detail}`].slice(-20)
  if (acceptance.status === 'pass' && acceptance.forceRestarted) {
    return {
      ...decision,
      status: 'resolved',
      summary: `宿主已完成白名單精準重啟並通過獨立驗收：${decision.summary}`.slice(0, 2_000),
      evidence,
    }
  }
  if (acceptance.status === 'pass' || decision.status === 'needs_attention') return { ...decision, evidence }
  return {
    ...decision,
    status: 'needs_attention',
    summary: `獨立驗收未通過：${acceptance.detail}`.slice(0, 2_000),
    evidence,
    followUp: decision.followUp || '檢查測試失敗或 daemon 探測異常後再重跑 Guardian。',
  }
}

/** 一次性 fleet 巡檢：健康專案零 LLM；同一事故指紋只在成功處理後去重。 */
export async function runFleetGuardian(results: SuperviseDirectoryResult[], options: FleetGuardianOptions = {}): Promise<GuardianReport[]> {
  const isPaused = (result: SuperviseDirectoryResult) =>
    (!isErrorResult(result) && result.paused === true) || guardianStopFiles(result).some(file => existsSync(file))
  if (results.length > 0 && results.every(isPaused)) return results.map(result => ({ configPath: result.configPath, kind: 'skipped', reason: 'paused' }))
  const nowMs = options.nowMs ?? Date.now()
  const fleetDataDir = resolve(options.fleetDataDir ?? 'data/guardian')
  const acquired = acquireFleetLock(fleetDataDir, options)
  const firstConfig = results[0]?.configPath
  if (!acquired.lock) {
    if (acquired.blocked?.stale) {
      await notifyFleetOnce(
        options.notifyFn, firstConfig, fleetDataDir, `stale-lock:${acquired.blocked.pid}`,
        `⚠ AutoDev Guardian 卡死：PID ${acquired.blocked.pid} 租約已過期，但未通過安全回收條件。`,
      )
    }
    if (acquired.blocked?.stale) {
      return results.map(result => ({
        configPath: result.configPath,
        kind: 'failed',
        error: `Guardian lock stale（PID ${acquired.blocked!.pid} 未通過安全回收）`,
      }))
    }
    return results.map(result => ({ configPath: result.configPath, kind: 'skipped', reason: 'locked' }))
  }
  const lock = acquired.lock
  if (lock.recoveredPid !== undefined) {
    await notifyFleetOnce(
      options.notifyFn, firstConfig, fleetDataDir, `recovered-lock:${lock.recoveredPid}`,
      `⚠ AutoDev Guardian 已安全回收卡死 Guardian PID ${lock.recoveredPid}，本輪繼續巡檢。`,
    )
  }

  const schemaPath = join(fleetDataDir, 'guardian-output.schema.json')
  writeJsonAtomic(schemaPath, DECISION_JSON_SCHEMA)
  const runner = options.runProcessFn ?? runProcess
  const cliPath = resolve(options.cliPath ?? process.argv[1] ?? 'dist/cli.js')
  const reports: GuardianReport[] = []

  try {
    for (const result of results) {
      lock.touch()
      if (isPaused(result)) {
        reports.push({ configPath: result.configPath, kind: 'skipped', reason: 'paused' })
        continue
      }
      const dataDir = isErrorResult(result) ? fleetDataDir : result.dataDir
      const statePath = stateFile(result, dataDir)
      const state = readState(statePath)
      const batch = readEvents(dataDir, state)
      const latestEventTs = latestTs(batch.events)
      const incident = incidentParts(result, batch.events, state, nowMs)
      const progressed = progressState(state, batch.cursor, latestEventTs)
      if (incident.triggers.length === 0) {
        writeJsonAtomic(statePath, progressed)
        reports.push({ configPath: result.configPath, kind: 'skipped', reason: 'healthy' })
        continue
      }
      if (incident.failures.length === 0 && state.lastSupervisorFingerprint === incident.supervisorFingerprint) {
        writeJsonAtomic(statePath, progressed)
        reports.push({ configPath: result.configPath, kind: 'skipped', reason: 'already-handled' })
        continue
      }
      if (incident.failures.length > 0 && incidentCoolingDown(state, incident.incidentKey, nowMs)) {
        writeJsonAtomic(statePath, progressed)
        reports.push({ configPath: result.configPath, kind: 'skipped', reason: 'cooldown' })
        continue
      }

      const cwd = resolveProjectPath(result.configPath)
      const startedAt = new Date().toISOString()
      try {
        const codexHome = join(dataDir, 'codex-home')
        ensureFleetCodexHome(codexHome)
        if (isPaused(result)) {
          reports.push({ configPath: result.configPath, kind: 'skipped', reason: 'paused' })
          continue
        }
        const stopFiles = guardianStopFiles(result)
        const pending = withPauseGate(stopFiles, () => isPaused(result) ? undefined : runner({
          command: 'codex', args: guardianCodexArgs(schemaPath),
          cwd: existsSync(cwd) ? cwd : dirname(result.configPath),
          env: buildFleetCodexEnv(codexHome), replaceEnv: true,
          stdinText: guardianPrompt({ result, projectPath: cwd, dataDir, triggers: incident.triggers, failures: incident.failures, cliPath }),
          timeoutMs: 0,
          idleTimeoutMs: GUARDIAN_IDLE_TIMEOUT_MS,
          onActivity: lock.touch,
        }))
        if (!pending) {
          reports.push({ configPath: result.configPath, kind: 'skipped', reason: 'paused' })
          continue
        }
        const proc = await pending
        if (isPaused(result)) {
          reports.push({ configPath: result.configPath, kind: 'skipped', reason: 'paused' })
          continue
        }
        if (proc.timedOut) throw new Error(`Codex ${proc.timeoutReason ?? 'unknown'} timeout：${proc.durationMs}ms 無法完成`)
        if (proc.exitCode !== 0) throw new Error(`Codex exit ${proc.exitCode}: ${proc.stderr.slice(-1_000)}`)
        const reported = parseGuardianDecision(proc.stdout)
        const telemetry = parseGuardianTelemetry(proc.stdout)
        const verification = withPauseGate(stopFiles, () => isPaused(result)
          ? undefined
          : independentlyVerify(result, reported, cwd, dataDir, cliPath, options, stopFiles))
        if (!verification) {
          reports.push({ configPath: result.configPath, kind: 'skipped', reason: 'paused' })
          continue
        }
        const acceptance = await verification
        if (isPaused(result)) {
          reports.push({ configPath: result.configPath, kind: 'skipped', reason: 'paused' })
          continue
        }
        const decision = applyAcceptance(reported, acceptance)
        appendAudit(dataDir, {
          ts: new Date().toISOString(), startedAt, model: GUARDIAN_MODEL, effort: GUARDIAN_EFFORT,
          durationMs: proc.durationMs, ...telemetry, costUsd: null, costSource: 'codex-cli-not-reported',
          fingerprint: incident.fingerprint, reportedStatus: reported.status, verification: acceptance, ...decision,
        })
        quiet(() => new EventLog(dataDir).append(`guardian-${decision.status.replace('_', '-')}`, {
          model: GUARDIAN_MODEL, effort: GUARDIAN_EFFORT, summary: decision.summary,
        }))
        let nextState: GuardianState = {
          ...progressed,
          lastFingerprint: incident.fingerprint,
          lastIncidentKey: incident.incidentKey,
          lastIncidentAt: new Date(nowMs).toISOString(),
          lastSupervisorFingerprint: incident.supervisorFingerprint,
        }
        if (decision.status === 'needs_attention') {
          nextState = await notifyOnce(
            options.notifyFn, result.configPath, statePath, nextState, incident.fingerprint,
            `⚠ Guardian ${result.configPath}：${decision.summary}`,
          )
        }
        writeJsonAtomic(statePath, nextState)
        reports.push({ configPath: result.configPath, kind: 'completed', decision })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        appendAudit(dataDir, {
          ts: new Date().toISOString(), startedAt, model: GUARDIAN_MODEL,
          effort: GUARDIAN_EFFORT, fingerprint: incident.fingerprint, status: 'failed', error: message,
        })
        quiet(() => new EventLog(dataDir).append('guardian-failed', { model: GUARDIAN_MODEL, effort: GUARDIAN_EFFORT, error: message.slice(0, 1_000) }))
        const alerted = await notifyOnce(
          options.notifyFn, result.configPath, statePath, state, incident.fingerprint,
          `⚠ Guardian ${result.configPath} 執行失敗：${message.slice(0, 1_200)}`,
        )
        if (alerted !== state) writeJsonAtomic(statePath, alerted)
        reports.push({ configPath: result.configPath, kind: 'failed', error: message })
      }
    }
    return reports
  } finally { lock.release() }
}

export { guardianCodexArgs } from './codex.js'
