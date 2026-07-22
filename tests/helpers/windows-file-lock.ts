import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'

const READY = 'ADNG_LOCK_READY'
const RELEASED = 'ADNG_LOCK_RELEASED'
const DEFAULT_TIMEOUT_MS = 10_000

type TimerHandle = ReturnType<typeof setTimeout>

export interface SignalWaitOptions {
  timeoutMs?: number
  setTimer?: (callback: () => void, delayMs: number) => TimerHandle
  clearTimer?: (handle: TimerHandle) => void
}

/** 等子行程輸出明確完成訊號；timeout 僅是防掛死，不參與成功判定。 */
export function waitForChildLine(
  child: ChildProcessWithoutNullStreams,
  expected: string,
  options: SignalWaitOptions = {}
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const setTimer = options.setTimer ?? ((callback, delayMs) => setTimeout(callback, delayMs))
  const clearTimer = options.clearTimer ?? (handle => clearTimeout(handle))

  return new Promise((resolve, reject) => {
    let stdout = ''
    let stderr = ''
    let settled = false

    const finish = (error?: Error): void => {
      if (settled) return
      settled = true
      clearTimer(timer)
      child.stdout.off('data', onStdout)
      child.stderr.off('data', onStderr)
      child.off('error', onError)
      child.off('close', onClose)
      if (error) reject(error)
      else resolve()
    }
    const onStdout = (chunk: Buffer | string): void => {
      stdout += chunk.toString()
      if (stdout.split(/\r?\n/).includes(expected)) finish()
    }
    const onStderr = (chunk: Buffer | string): void => { stderr += chunk.toString() }
    const onError = (error: Error): void => finish(error)
    const onClose = (code: number | null): void => {
      finish(new Error(`鎖定子行程在 ${expected} 前結束（exit=${String(code)}）：${stderr.trim()}`))
    }
    const timer = setTimer(
      () => finish(new Error(`鎖定子行程在 ${timeoutMs}ms 內未回報 ${expected}`)),
      timeoutMs
    )

    child.stdout.on('data', onStdout)
    child.stderr.on('data', onStderr)
    child.once('error', onError)
    child.once('close', onClose)
  })
}

export interface WindowsFileLock {
  release(): Promise<void>
}

/**
 * 用 .NET FileStream 建立不含 FileShare.Delete 的真 Windows 檔案鎖。
 * 子行程以 stdin 握手維持鎖，不靠固定 Start-Sleep；READY／RELEASED 是唯一完成條件。
 */
export async function acquireWindowsFileLock(
  file: string,
  options: SignalWaitOptions = {}
): Promise<WindowsFileLock> {
  const script = [
    "$ErrorActionPreference = 'Stop'",
    "$fs = [System.IO.File]::Open($env:ADNG_TEST_LOCK_FILE, 'Open', 'ReadWrite', 'Read')",
    `[Console]::Out.WriteLine('${READY}')`,
    '[Console]::Out.Flush()',
    '[Console]::In.ReadLine() | Out-Null',
    '$fs.Dispose()',
    `[Console]::Out.WriteLine('${RELEASED}')`,
    '[Console]::Out.Flush()',
  ].join('; ')
  const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    env: { ...process.env, ADNG_TEST_LOCK_FILE: file },
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  })

  try {
    await waitForChildLine(child, READY, options)
  } catch (error) {
    child.stdin.end()
    child.kill()
    throw error
  }

  let released = false
  return {
    async release(): Promise<void> {
      if (released) return
      released = true
      const releaseSignal = waitForChildLine(child, RELEASED, options)
      child.stdin.end('\n')
      try {
        await releaseSignal
      } catch (error) {
        child.kill()
        throw error
      }
    },
  }
}
