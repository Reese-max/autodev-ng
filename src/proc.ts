import { spawn } from 'node:child_process'
import { execFile } from 'node:child_process'

export interface ProcResult {
  exitCode: number | null
  stdout: string
  stderr: string
  timedOut: boolean
  timeoutReason?: 'wall' | 'idle'
  durationMs: number
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
  maxOutputChars?: number
  /** M5 Task 1：附加環境變數（疊在 process.env 上），供 m3 檔位注入 ANTHROPIC_BASE_URL
   * 等相容端點設定。未設時不帶 env 參數，行為與舊版完全一致（繼承父進程環境）。 */
  env?: Record<string, string>
}): Promise<ProcResult> {
  return new Promise(resolve => {
    const t0 = Date.now()
    const { cmd, args } = resolveSpawnTarget(opts.command, opts.args)
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      shell: false,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      ...(opts.env ? { env: { ...process.env, ...opts.env } } : {})
    })
    // Node 內建 StringDecoder 跨 chunk 緩衝多位元組字元，防 zh-TW 輸出腰斬亂碼
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')

    let stdout = ''
    let stderr = ''
    let timedOut = false
    let timeoutReason: ProcResult['timeoutReason']
    let settled = false
    let settleTimer: ReturnType<typeof setTimeout> | undefined
    let wallTimer: ReturnType<typeof setTimeout> | undefined
    let idleTimer: ReturnType<typeof setTimeout> | undefined

    const cap = opts.maxOutputChars ?? 2_000_000
    let stdoutTruncated = false
    let stderrTruncated = false

    const finish = (exitCode: number | null): void => {
      if (settled) return
      settled = true
      if (wallTimer) clearTimeout(wallTimer)
      if (idleTimer) clearTimeout(idleTimer)
      if (settleTimer) clearTimeout(settleTimer)
      resolve({
        exitCode, stdout, stderr, timedOut,
        ...(timeoutReason ? { timeoutReason } : {}),
        durationMs: Date.now() - t0,
      })
    }

    const triggerTimeout = (reason: 'wall' | 'idle'): void => {
      if (settled) return
      timedOut = true
      timeoutReason = reason
      killTree(child.pid)
      // 樹斬後給 3s 收屍；若 close 仍不來，強制 settle（防 close 永不觸發）
      settleTimer = setTimeout(() => finish(null), 3000)
      settleTimer.unref()
    }
    const renewIdleTimer = (): void => {
      if (!opts.idleTimeoutMs || opts.idleTimeoutMs <= 0 || settled) return
      if (idleTimer) clearTimeout(idleTimer)
      idleTimer = setTimeout(() => triggerTimeout('idle'), opts.idleTimeoutMs)
      idleTimer.unref()
    }
    const activity = (): void => {
      try { opts.onActivity?.() } catch { /* 觀測 callback 不影響子進程。 */ }
      renewIdleTimer()
    }

    wallTimer = opts.timeoutMs > 0 ? setTimeout(() => triggerTimeout('wall'), opts.timeoutMs) : undefined
    wallTimer?.unref()
    renewIdleTimer()

    child.stdout.on('data', d => {
      activity()
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
      activity()
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
    child.on('error', err => {
      // spawn/exec 錯誤（如 win32 bare-name ENOENT）不可靜默吞掉，塞進 stderr 讓呼叫端看見
      stderr += String(err)
      finish(null)
    })
    child.on('close', code => finish(code))

    child.stdin.on('error', () => { /* 子進程提早退出時 EPIPE，可忽略 */ })
    child.stdin.write(opts.stdinText)
    child.stdin.end() // 等效 < /dev/null：餵完即關，防巢狀 stdin 啞死
  })
}

/** win32 對 bare-name（非 .exe 結尾，如 npm .cmd shim）spawn(shell:false) 必 ENOENT；
 *  改經 cmd.exe /c 執行以命中 PATHEXT 解析。.exe 結尾（如 process.execPath）維持直接 spawn。 */
function resolveSpawnTarget(command: string, args: string[]): { cmd: string; args: string[] } {
  if (process.platform === 'win32' && !/\.exe$/i.test(command)) {
    return { cmd: 'cmd.exe', args: ['/c', command, ...args] }
  }
  return { cmd: command, args }
}

/** 雙層樹斬：win32 用 taskkill /T /F（連子樹）；其他平台 SIGKILL。 */
function killTree(pid: number | undefined): void {
  if (pid === undefined) return
  if (process.platform === 'win32') {
    execFile('taskkill', ['/PID', String(pid), '/T', '/F'], () => { /* 盡力而為 */ })
  } else {
    try { process.kill(pid, 'SIGKILL') } catch { /* 已死 */ }
  }
}
