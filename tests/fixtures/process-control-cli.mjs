import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const [moduleUrl, mode, token] = process.argv.slice(2)
if (!['kill-allowed', 'kill-refused'].includes(mode) || !/^[a-f0-9]{32}$/.test(token ?? '')) {
  throw new Error('Invalid controlled fixture arguments')
}
const { runProcessControl } = await import(moduleUrl)
const command = process.execPath
const args = [fileURLToPath(new URL('./process-control-helper.mjs', import.meta.url)), 'hang', token]
const helper = spawn(command, args, { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] })
let stdout = '', stderr = ''
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(new Error('Controlled helper readiness deadline')), 4_000)
    const finish = error => {
      clearTimeout(timer)
      helper.stdout.off('data', output)
      helper.stderr.off('data', errors)
      helper.off('error', failed)
      helper.off('exit', exited)
      error ? reject(error) : resolve()
    }
    const check = () => {
      if (stdout.split(/\r?\n/).some(line => line === `PROCESS_CONTROL_READY ${JSON.stringify({ pid: helper.pid, token })}`)
        && stderr === `raw controlled stderr ${token}: 中文\n`) finish()
    }
    const output = chunk => { stdout += String(chunk); check() }
    const errors = chunk => { stderr += String(chunk); check() }
    const failed = error => finish(error)
    const exited = () => finish(new Error('Controlled helper exited before readiness'))
    helper.stdout.on('data', output)
    helper.stderr.on('data', errors)
    helper.once('error', failed)
    helper.once('exit', exited)
  })
  process.stdout.write(`CONTROL_CLI_READY ${JSON.stringify({ pid: helper.pid, token })}\n`)
  let killAttempted = false
  const originalKill = helper.kill.bind(helper)
  helper.kill = signal => {
    if (signal !== 'SIGKILL') throw new Error('Unexpected controlled kill signal')
    killAttempted = true
    // Explicit simulation of kill refusal, never evidence of kernel reaping.
    return mode === 'kill-refused' ? false : originalKill(signal)
  }
  const result = await runProcessControl({ command, args, timeoutMs: 300,
    execute: (actualCommand, actualArgs, _callback) => {
      if (actualCommand !== command || JSON.stringify(actualArgs) !== JSON.stringify(args)) {
        throw new Error('Unexpected controlled command')
      }
      // Hold the callback forever while returning a real, still-live owned handle.
      helper.stdin.write('REPLAY_READY\n')
      return helper
    },
  })
  process.stdout.write(`CONTROL_CLI_RESULT ${JSON.stringify({ result, mode, token, killAttempted,
    observedReady: stdout, observedStderr: stderr,
    ownedStdioDestroyed: [helper.stdin, helper.stdout, helper.stderr].every(stream => stream.destroyed),
  })}\n`)
  // No process.exit(), extra unref(), or parent-side timer hides event-loop liveness.
  process.exitCode = result.status === 'unknown' ? 1 : 0
} catch (error) {
  helper.kill('SIGKILL')
  throw error
}
