import { execFile, spawn, type ChildProcess } from 'node:child_process'
import { lstatSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { observeRun, type RunControl } from './run-control.js'

export interface ProcResult {
  exitCode: number | null
  stdout: string
  stderr: string
  timedOut: boolean
  timeoutReason?: 'wall' | 'idle'
  aborted?: boolean
  durationMs: number
  cleanup?: ProcessCleanup & { rootClosed: boolean }
}

export interface ProcessCleanup {
  status: 'confirmed' | 'unknown'
  reasonCodes: string[]
  remainingPids: number[]
  /** Owned control helpers whose kernel completion was not established; not a liveness claim. */
  unconfirmedControlPids?: number[]
}

export const WINDOWS_CONTROL_TIMEOUT_MS = 5_000
export const PROCESS_CLEANUP_TIMEOUT_MS = 30_000

export interface FlatPidProcess {
  pid: number
  parentPid?: number
  command: string
}

export interface ProcEventSink {
  append(type: 'proc-zombie', data: { pid: number; command: string }): void
}

export interface KillTreeDeps {
  platform?: NodeJS.Platform
  taskkill?: (pid: number) => Promise<void>
  wait?: (ms: number) => Promise<void>
  isAlive?: (pid: number) => boolean
  listProcesses?: () => Promise<FlatPidProcess[]>
  kill?: (pid: number) => void
  /** Trusted test seams may shorten, never enlarge, the production bounds. */
  controlTimeoutMs?: number
  cleanupTimeoutMs?: number
}

export const DEFAULT_ENGINE_IDLE_TIMEOUT_MS = 300_000

/** 只對本次子程序信任 cwd；不寫 global gitconfig，也不覆蓋呼叫端既有的 `-c` 設定。 */
export function withGitSafeDirectory(env: NodeJS.ProcessEnv, cwd: string): NodeJS.ProcessEnv {
  const result = { ...env }
  const rawCount = result.GIT_CONFIG_COUNT ?? '0'
  const count = Number(rawCount)
  if (!Number.isSafeInteger(count) || count < 0) throw new Error(`GIT_CONFIG_COUNT 無效：${rawCount}`)

  const safeDirectory = resolve(cwd).replace(/\\/g, '/')
  for (let i = 0; i < count; i++) {
    if (result[`GIT_CONFIG_KEY_${i}`]?.toLowerCase() === 'safe.directory' && result[`GIT_CONFIG_VALUE_${i}`] === safeDirectory) {
      return result
    }
  }
  result.GIT_CONFIG_COUNT = String(count + 1)
  result[`GIT_CONFIG_KEY_${count}`] = 'safe.directory'
  result[`GIT_CONFIG_VALUE_${count}`] = safeDirectory
  return result
}

/** 引擎呼叫鐵三角唯一執法點：stdin 餵 prompt 後立即 end、wall timeout、逾時雙層樹斬、stderr 全收。 */
export function runProcess(opts: {
  command: string
  args: string[]
  cwd: string
  stdinText: string
  timeoutMs: number
  /** 只在 stdout/stderr 完全無進度時觸發；與 timeoutMs=0（無總時限）可並用。 */
  idleTimeoutMs?: number
  /** 子進程有輸出時通知呼叫端續租；觀測 callback 失敗不可反殺子進程。 */
  onActivity?: () => void
  control?: RunControl
  maxOutputChars?: number
  /** M5 Task 1：附加環境變數（疊在 process.env 上），供相容端點設定。 */
  env?: Record<string, string>
  /** 安全邊界用：env 是完整白名單，不可再混入父行程 secrets。 */
  replaceEnv?: boolean
  /** 無法回收的 Windows 子進程事件；未提供時只做終止，不讓觀測故障影響主流程。 */
  events?: ProcEventSink
}): Promise<ProcResult> {
  if (opts.control?.signal?.aborted) {
    return Promise.resolve({ exitCode: null, stdout: '', stderr: '', timedOut: false, aborted: true, durationMs: 0 })
  }
  return new Promise(resolve => {
    const t0 = Date.now()
    const baseEnv = opts.replaceEnv ? (opts.env ?? {}) : { ...process.env, ...opts.env }
    const { cmd, args } = resolveSpawnTarget(opts.command, opts.args, opts.cwd, baseEnv)
    const childEnv = withGitSafeDirectory(baseEnv, opts.cwd)
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      shell: false,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: childEnv
    })
    // Node 內建 StringDecoder 跨 chunk 緩衝多位元組字元，防 zh-TW 輸出腰斬亂碼
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')

    let stdout = ''
    let stderr = ''
    let timedOut = false
    let aborted = false
    let timeoutReason: ProcResult['timeoutReason']
    let settled = false
    let wallTimer: ReturnType<typeof setTimeout> | undefined
    let idleTimer: ReturnType<typeof setTimeout> | undefined
    let reaping: Promise<ProcessCleanup> | undefined
    let cleanup: ProcessCleanup | undefined
    let closeCode: number | null | undefined
    let rootClosed = false
    let rootExited = false

    const cap = opts.maxOutputChars ?? 2_000_000
    let stdoutTruncated = false
    let stderrTruncated = false

    const finish = (exitCode: number | null): void => {
      if (settled) return
      settled = true
      if (wallTimer) clearTimeout(wallTimer)
      if (idleTimer) clearTimeout(idleTimer)
      opts.control?.signal?.removeEventListener('abort', cancel)
      // A timeout/cancellation is never success, even if close races with a zero exit.
      if (timedOut || aborted) exitCode = null
      if (cleanup && !rootClosed) cleanup = { ...cleanup, status: 'unknown',
        reasonCodes: [...cleanup.reasonCodes, 'ROOT_CLOSE_UNOBSERVED'] }
      if (cleanup?.status === 'unknown') detachOwnedProcess(child)
      if (cleanup?.status === 'unknown') stderr += `\n[adng: cleanup UNKNOWN; ${cleanup.reasonCodes.join(',')}; remaining child absence not certified]\n`
      observeRun(opts.control, { type: 'exit', code: exitCode, reason: aborted ? 'cancelled' : timeoutReason ?? 'exit' })
      resolve({
        exitCode, stdout, stderr, timedOut,
        ...(aborted ? { aborted: true } : {}),
        ...(timeoutReason ? { timeoutReason } : {}),
        durationMs: Date.now() - t0,
        ...(cleanup ? { cleanup: { ...cleanup, rootClosed } } : {}),
      })
    }

    const stop = (reason: 'wall' | 'idle' | 'cancelled'): void => {
      if (settled || reaping) return
      aborted = reason === 'cancelled'
      timedOut = !aborted
      if (reason !== 'cancelled') timeoutReason = reason
      else observeRun(opts.control, { type: 'cancel-requested' })
      // 等有限清理回報再歸還；root close 不代表後代已回收。
      // UNKNOWN 保留不確定性，不能授權後續 suite child 或宣稱 worktree 已無持鎖者。
      reaping = killTree(child.pid, { command: opts.command, events: opts.events, isRootExited: () => rootExited })
        .catch((): ProcessCleanup => ({ status: 'unknown', reasonCodes: ['CLEANUP_ERROR'], remainingPids: [] }))
      void reaping.then(report => {
        cleanup = report
        reaping = undefined
        finish(closeCode ?? null)
      })
    }
    const cancel = (): void => stop('cancelled')
    const renewIdleTimer = (): void => {
      if (!opts.idleTimeoutMs || opts.idleTimeoutMs <= 0 || settled) return
      if (idleTimer) clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        if (opts.control?.idleAction === 'report') observeRun(opts.control, { type: 'idle' })
        else stop('idle')
      }, opts.idleTimeoutMs)
      idleTimer.unref()
    }
    const activity = (): void => {
      try { opts.onActivity?.() } catch { /* 觀測 callback 不影響子進程。 */ }
      renewIdleTimer()
    }

    wallTimer = opts.timeoutMs > 0 ? setTimeout(() => stop('wall'), opts.timeoutMs) : undefined
    wallTimer?.unref()
    renewIdleTimer()

    child.stdout.on('data', d => {
      if (settled) return
      activity()
      observeRun(opts.control, { type: 'output', stream: 'stdout', text: d })
      if (stdout.length >= cap) {
        if (!stdoutTruncated) { stdout += '\n[adng: output truncated]'; stdoutTruncated = true }
        return
      }
      const remaining = cap - stdout.length
      if (d.length > remaining) {
        stdout += d.slice(0, remaining)
        stdout += '\n[adng: output truncated]'
        stdoutTruncated = true
      } else {
        stdout += d
      }
    })
    child.stderr.on('data', d => {
      if (settled) return
      activity()
      observeRun(opts.control, { type: 'output', stream: 'stderr', text: d })
      if (stderr.length >= cap) {
        if (!stderrTruncated) { stderr += '\n[adng: output truncated]'; stderrTruncated = true }
        return
      }
      const remaining = cap - stderr.length
      if (d.length > remaining) {
        stderr += d.slice(0, remaining)
        stderr += '\n[adng: output truncated]'
        stderrTruncated = true
      } else {
        stderr += d
      }
    })
    const settleFromChild = (code: number | null): void => {
      closeCode = code
      if (!reaping) finish(code)
    }
    child.on('error', err => {
      // spawn/exec 錯誤（如 win32 bare-name ENOENT）不可靜默吞掉，塞進 stderr 讓呼叫端看見
      stderr += String(err)
      settleFromChild(null)
    })
    child.once('exit', () => { rootExited = true })
    child.on('close', code => { rootClosed = true; settleFromChild(code) })
    child.on('spawn', () => {
      if (child.pid !== undefined) observeRun(opts.control, { type: 'spawn', pid: child.pid, startedAt: Date.now() })
    })
    opts.control?.signal?.addEventListener('abort', cancel, { once: true })
    if (opts.control?.signal?.aborted) cancel()

    child.stdin.on('error', () => { /* 子進程提早退出時 EPIPE，可忽略 */ })
    child.stdin.write(opts.stdinText)
    child.stdin.end() // 等效 < /dev/null：餵完即關，防巢狀 stdin 啞死
  })
}

/** 依子程序的 PATH/PATHEXT 找到原生執行檔，避免 cmd.exe 截斷多行 argv。 */
export function resolveSpawnTarget(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv): { cmd: string; args: string[] } {
  if (process.platform === 'win32' && !/\.exe$/i.test(command)) {
    const dirs = /[\\/]/.test(command) ? [cwd] : [cwd, ...(env.PATH ?? env.Path ?? '').split(';')]
    const extensions = extname(command) ? [''] : (env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD').split(';')
    const target = dirs.flatMap(dir => extensions.map(ext => resolve(dir.replace(/^"|"$/g, ''), command + ext)))
      .find(file => {
        const entry = lstatSync(file, { throwIfNoEntry: false })
        // Windows App Execution Aliases launch normally but reject target stat with EACCES.
        return entry?.isFile() || entry?.isSymbolicLink()
      })
    if (target && /\.(exe|com)$/i.test(target)) return { cmd: target, args }
    // ponytail: batch shims cannot carry multiline argv; use stdin or a native executable for those calls.
    if (args.some(arg => /[\r\n]/.test(arg))) throw new Error('Windows batch command cannot preserve multiline arguments; use stdin or a native executable')
    return { cmd: 'cmd.exe', args: ['/c', command, ...args] }
  }
  return { cmd: command, args }
}

/** 將可注入的扁平 PID 資料限縮為目標根及其後代，回傳葉到根的終止順序。 */
export function pidTreeDeepestFirst(rootPid: number, processes: readonly FlatPidProcess[], rootCommand: string): FlatPidProcess[] {
  const byPid = new Map<number, FlatPidProcess>()
  const children = new Map<number, FlatPidProcess[]>()
  for (const proc of processes) {
    if (!byPid.has(proc.pid)) byPid.set(proc.pid, proc)
    if (proc.parentPid !== undefined) {
      const rows = children.get(proc.parentPid) ?? []
      rows.push(proc)
      children.set(proc.parentPid, rows)
    }
  }

  const ordered: FlatPidProcess[] = []
  const seen = new Set<number>()
  const visit = (proc: FlatPidProcess): void => {
    if (seen.has(proc.pid)) return
    seen.add(proc.pid)
    for (const child of children.get(proc.pid) ?? []) visit(child)
    ordered.push(proc)
  }
  visit(byPid.get(rootPid) ?? { pid: rootPid, command: rootCommand })
  return ordered
}

/** Windows 收斂樹斬（2026-08-04 改版）：taskkill 後等 2 秒，之後「枚舉→葉到根殺→短待」
 * 收斂迴圈至多 3 輪，直到零存活；終輪殘存者記 proc-zombie。
 * 舊版兩個洩漏源一併封死：(1) 根已死即提前返回——孤兒後代（抱住 worktree 的直接來源）
 * 從此無人管；(2) 單次快照——快照與殺之間新生的孫代漏殺。 */
const KILL_TREE_MAX_ROUNDS = 3
export async function killTree(pid: number | undefined, opts: {
  command: string
  events?: ProcEventSink
  processTree?: readonly FlatPidProcess[]
  deps?: KillTreeDeps
  isRootExited?: () => boolean
  isRootClosed?: () => boolean
}): Promise<ProcessCleanup> {
  if (pid === undefined || !Number.isSafeInteger(pid) || pid <= 0) return { status: 'unknown', reasonCodes: ['PID_UNAVAILABLE'], remainingPids: [] }
  const deps = opts.deps ?? {}
  if ((deps.platform ?? process.platform) !== 'win32') {
    try {
      if (deps.kill) deps.kill(pid)
      else process.kill(pid, 'SIGKILL')
    } catch { /* 已死 */ }
    return { status: 'unknown', reasonCodes: ['POSIX_DESCENDANTS_NOT_INSPECTED'], remainingPids: [] }
  }
  const budget = shortenedBound(deps.cleanupTimeoutMs, PROCESS_CLEANUP_TIMEOUT_MS)
  const controlBudget = shortenedBound(deps.controlTimeoutMs, WINDOWS_CONTROL_TIMEOUT_MS)
  const deadline = Date.now() + budget
  let active = true
  const helpers = new AbortController()
  const rootExited = (): boolean => opts.isRootExited?.() ?? opts.isRootClosed?.() ?? false
  let lastAlive: FlatPidProcess[] = []
  const reasons = new Set<string>()
  const uncertainHelpers = new Set<number>()
  // A post-taskkill snapshot cannot recover ancestry removed with an intermediate parent.
  // These bounded best-effort kills never certify historical descendant absence or authorize reuse.
  const report = (): ProcessCleanup => ({ status: 'unknown',
    reasonCodes: reasons.size ? [...reasons] : ['WINDOWS_DESCENDANT_HISTORY_UNCERTAIN'],
    remainingPids: lastAlive.map(proc => proc.pid),
    ...(uncertainHelpers.size ? { unconfirmedControlPids: [...uncertainHelpers] } : {}) })

  const bounded = async <T>(operation: () => Promise<T>, label: string): Promise<{ ok: true; value: T } | { ok: false }> => {
    if (!active) return { ok: false }
    return new Promise(resolve => {
      let settled = false
      const finish = (result: { ok: true; value: T } | { ok: false }): void => {
        if (settled) return
        settled = true; clearTimeout(timer); resolve(result)
      }
      const timer = setTimeout(() => {
        reasons.add(label + '_TIMEOUT'); finish({ ok: false })
      }, Math.max(1, Math.min(controlBudget, deadline - Date.now())))
      Promise.resolve().then(operation).then(value => finish({ ok: true, value }), () => {
        reasons.add(label + '_ERROR'); finish({ ok: false })
      })
    })
  }

  const aliveTree = async (): Promise<FlatPidProcess[] | null> => {
    const snapshot = await bounded(async (): Promise<WindowsProcessSnapshot> => {
      if (opts.processTree) return { status: 'complete', processes: [...opts.processTree], reasonCodes: [] }
      if (deps.listProcesses) return { status: 'complete', processes: await deps.listProcesses(), reasonCodes: [] }
      return listWindowsProcesses(helpers.signal)
    }, 'CIM')
    if (!active || !snapshot.ok) return null
    if (snapshot.value.status !== 'complete') {
      if (snapshot.value.controlPid !== undefined) uncertainHelpers.add(snapshot.value.controlPid)
      for (const reason of snapshot.value.reasonCodes) reasons.add(reason)
      return null
    }
    // Exit can precede close while descendants retain stdio; neither permits PID reuse.
    if (rootExited() && snapshot.value.processes.some(proc => proc.pid === pid)) {
      reasons.add('ROOT_PID_REUSED_OR_STALE_SNAPSHOT'); return null
    }
    return pidTreeDeepestFirst(pid, snapshot.value.processes, opts.command).filter(proc => {
      if (!Number.isSafeInteger(proc.pid) || proc.pid <= 0) { reasons.add('DESCENDANT_PID_INVALID'); return false }
      if (proc.pid === pid && rootExited()) return false
      try {
        if (deps.isAlive) return deps.isAlive(proc.pid)
        process.kill(proc.pid, 0); return true
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ESRCH') return false
        reasons.add('PID_LIVENESS_UNKNOWN'); return true
      }
    })
  }

  return new Promise(resolve => {
    const outer = setTimeout(() => {
      if (!active) return
      active = false; reasons.add('CLEANUP_DEADLINE'); helpers.abort(); resolve(report())
    }, budget)
    const work = async (): Promise<ProcessCleanup> => {
      const killed = rootExited() ? { ok: true as const, value: undefined }
        : await bounded<void | ProcessControlResult>(() => rootExited() ? Promise.resolve() : deps.taskkill ? deps.taskkill(pid) : runProcessControl({
          command: 'taskkill', args: ['/PID', String(pid), '/T', '/F'], timeoutMs: controlBudget, signal: helpers.signal,
        }), 'TASKKILL')
      if (!active || !killed.ok) return report()
      if (killed.value && killed.value.status === 'unknown') {
        if (killed.value.pid !== undefined) uncertainHelpers.add(killed.value.pid)
        for (const reason of killed.value.reasonCodes) reasons.add('TASKKILL_' + reason)
        return report()
      }
      const firstWait = await bounded(() => deps.wait ? deps.wait(2_000) : wait(2_000, helpers.signal), 'REAP_WAIT')
      if (!active || !firstWait.ok) return report()
      for (let round = 1; round <= KILL_TREE_MAX_ROUNDS; round++) {
        const alive = await aliveTree()
        if (!active || alive === null) return report()
        lastAlive = alive
        if (!alive.length) return report()
        for (const proc of alive) {
          if (!active) return report()
          if (proc.pid === pid && rootExited()) { reasons.add('ROOT_EXITED_DURING_CLEANUP'); return report() }
          try { (deps.kill ?? process.kill)(proc.pid) } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ESRCH') reasons.add('PID_SIGNAL_FAILED')
          }
        }
        const waited = await bounded(() => deps.wait ? deps.wait(500) : wait(500, helpers.signal), 'REAP_WAIT')
        if (!active || !waited.ok) return report()
      }
      const survivors = await aliveTree()
      if (!active || survivors === null) return report()
      lastAlive = survivors
      if (survivors.length) reasons.add('SURVIVING_PROCESSES')
      for (const proc of survivors) {
        if (!active) return report()
        try { opts.events?.append('proc-zombie', { pid: proc.pid, command: proc.command }) } catch { /* observation only */ }
      }
      return report()
    }
    void work().then(result => {
      if (!active) return
      active = false; clearTimeout(outer); helpers.abort(); resolve(result)
    }, () => {
      if (!active) return
      active = false; clearTimeout(outer); reasons.add('CLEANUP_ERROR'); helpers.abort(); resolve(report())
    })
  })
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    const finish = (): void => { clearTimeout(timer); signal.removeEventListener('abort', finish); resolve() }
    const timer = setTimeout(finish, ms)
    signal.addEventListener('abort', finish, { once: true })
    if (signal.aborted) finish()
  })
}

/** Release only handles/pipes owned by this call; this does not certify kernel death. */
function detachOwnedProcess(child: ChildProcess): void {
  for (const stream of [child.stdin, child.stdout, child.stderr]) {
    try { stream?.destroy() } catch { /* report remains UNKNOWN */ }
  }
  try { child.unref() } catch { /* report remains UNKNOWN */ }
}

function shortenedBound(value: number | undefined, limit: number): number {
  return Number.isFinite(value) && value! > 0 ? Math.min(value!, limit) : limit
}

export interface ProcessControlResult {
  status: 'complete' | 'unknown'
  reasonCodes: string[]
  stdout: string
  stderr: string
  pid?: number
}

/** A callback that never arrives cannot hold reaping; helper completion is not tree-death evidence. */
export function runProcessControl(opts: {
  command: string
  args: string[]
  timeoutMs?: number
  signal?: AbortSignal
  execute?: (command: string, args: string[], callback: (error: Error | null, stdout: string, stderr: string) => void) => ChildProcess
}): Promise<ProcessControlResult> {
  const timeoutMs = shortenedBound(opts.timeoutMs, WINDOWS_CONTROL_TIMEOUT_MS)
  return new Promise(resolve => {
    let child: ChildProcess | undefined, settled = false, stdout = '', stderr = ''
    const finish = (status: ProcessControlResult['status'], reasonCodes: string[]): void => {
      if (settled) return
      settled = true; clearTimeout(timer); opts.signal?.removeEventListener('abort', cancel)
      if (status === 'unknown' && child) detachOwnedProcess(child)
      resolve({ status, reasonCodes, stdout, stderr, ...(child?.pid === undefined ? {} : { pid: child.pid }) })
    }
    const terminate = (): void => {
      try { child?.kill('SIGKILL') } catch { /* outcome remains UNKNOWN */ }
    }
    const cancel = (): void => { if (settled) return; terminate(); finish('unknown', ['CONTROL_CANCELLED']) }
    const timer = setTimeout(() => {
      terminate(); finish('unknown', ['CONTROL_TIMEOUT'])
    }, timeoutMs)
    const callback = (error: Error | null, output: string, errors: string): void => {
      if (settled) return
      stdout = output.slice(0, 8_000_000); stderr = errors.slice(0, 8_000_000)
      finish(error ? 'unknown' : 'complete', error ? ['CONTROL_ERROR'] : [])
    }
    try {
      if (opts.signal?.aborted) { finish('unknown', ['CONTROL_CANCELLED']); return }
      child = opts.execute ? opts.execute(opts.command, opts.args, callback) : execFile(opts.command, opts.args,
        { windowsHide: true, maxBuffer: 8_000_000 }, callback)
      child.stdout?.setEncoding('utf8'); child.stderr?.setEncoding('utf8')
      child.stdout?.on('data', chunk => { if (!settled) stdout = (stdout + String(chunk)).slice(0, 8_000_000) })
      child.stderr?.on('data', chunk => { if (!settled) stderr = (stderr + String(chunk)).slice(0, 8_000_000) })
      child.once('error', () => finish('unknown', ['CONTROL_ERROR']))
      opts.signal?.addEventListener('abort', cancel, { once: true })
      if (opts.signal?.aborted) cancel()
      // Test execute seams may call back synchronously before returning the owned handle.
      if (settled) detachOwnedProcess(child)
    } catch { finish('unknown', ['CONTROL_ERROR']) }
  })
}

export interface WindowsProcessSnapshot {
  controlPid?: number
  status: 'complete' | 'unknown'
  processes: FlatPidProcess[]
  reasonCodes: string[]
}

export function parseWindowsProcessSnapshot(stdout: string): WindowsProcessSnapshot {
  const unknown = (): WindowsProcessSnapshot => ({ status: 'unknown', processes: [], reasonCodes: ['CIM_INCOMPLETE_OR_MALFORMED'] })
  if (!stdout.trim()) return unknown()
  try {
    const value: unknown = JSON.parse(stdout), rows = Array.isArray(value) ? value : [value]
    if (!rows.length) return unknown()
    const seen = new Set<number>(), processes: FlatPidProcess[] = []
    for (const entry of rows) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return unknown()
      const row = entry as Record<string, unknown>
      if (!Number.isSafeInteger(row.ProcessId) || (row.ProcessId as number) < 0
        || !Number.isSafeInteger(row.ParentProcessId) || (row.ParentProcessId as number) < 0
        || seen.has(row.ProcessId as number)
        || (row.CommandLine != null && typeof row.CommandLine !== 'string')
        || (row.Name != null && typeof row.Name !== 'string')) return unknown()
      const command = row.CommandLine || row.Name
      if (typeof command !== 'string' || !command) return unknown()
      seen.add(row.ProcessId as number)
      processes.push({ pid: row.ProcessId as number, parentPid: row.ParentProcessId as number, command })
    }
    return { status: 'complete', processes, reasonCodes: [] }
  } catch { return unknown() }
}

async function listWindowsProcesses(signal: AbortSignal): Promise<WindowsProcessSnapshot> {
  const command = "$ErrorActionPreference = 'Stop'; Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,CommandLine,Name | ConvertTo-Json -Compress"
  const result = await runProcessControl({ command: 'powershell.exe', args: ['-NoProfile', '-NonInteractive', '-Command', command], signal })
  if (result.status !== 'complete') return { status: 'unknown', processes: [], ...(result.pid === undefined ? {} : { controlPid: result.pid }), reasonCodes: result.reasonCodes.map(reason => 'CIM_' + reason) }
  if (result.stderr.trim()) return { status: 'unknown', processes: [], reasonCodes: ['CIM_STDERR_UNCERTAIN'] }
  return parseWindowsProcessSnapshot(result.stdout)
}
