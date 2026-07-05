import { spawn } from 'node:child_process'
import { execFile } from 'node:child_process'

export interface ProcResult {
  exitCode: number | null
  stdout: string
  stderr: string
  timedOut: boolean
  durationMs: number
}

/** 引擎呼叫鐵三角唯一執法點：stdin 餵 prompt 後立即 end、wall timeout、逾時雙層樹斬、stderr 全收。 */
export function runProcess(opts: {
  command: string
  args: string[]
  cwd: string
  stdinText: string
  timeoutMs: number
}): Promise<ProcResult> {
  return new Promise(resolve => {
    const t0 = Date.now()
    const child = spawn(opts.command, opts.args, {
      cwd: opts.cwd,
      shell: false,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    })
    let stdout = ''
    let stderr = ''
    let timedOut = false
    let settled = false

    const finish = (exitCode: number | null): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ exitCode, stdout, stderr, timedOut, durationMs: Date.now() - t0 })
    }

    const timer = setTimeout(() => {
      timedOut = true
      killTree(child.pid)
      // 樹斬後給 3s 收屍；若 close 仍不來，強制 settle（防 close 永不觸發）
      setTimeout(() => finish(null), 3000)
    }, opts.timeoutMs)

    child.stdout.on('data', d => { stdout += d })
    child.stderr.on('data', d => { stderr += d })
    child.on('error', () => finish(null))
    child.on('close', code => finish(code))

    child.stdin.on('error', () => { /* 子進程提早退出時 EPIPE，可忽略 */ })
    child.stdin.write(opts.stdinText)
    child.stdin.end() // 等效 < /dev/null：餵完即關，防巢狀 stdin 啞死
  })
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
