import { expect, test } from 'vitest'
import { spawn, type ChildProcess } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runProcessControl } from '../src/engines/proc.js'

const helper = fileURLToPath(new URL('./fixtures/process-control-helper.mjs', import.meta.url))
const cli = fileURLToPath(new URL('./fixtures/process-control-cli.mjs', import.meta.url))
const builtModule = new URL('../dist/engines/proc.js', import.meta.url)
const token = (): string => randomBytes(16).toString('hex')
const readyLine = (pid: number, value: string): string => `PROCESS_CONTROL_READY ${JSON.stringify({ pid, token: value })}`

function pidState(pid: number): 'running' | 'terminated-zombie' | 'absent' {
  try { process.kill(pid, 0) } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ESRCH') return 'absent'
    throw error
  }
  // A CLI's orphan may await PID1 reaping in a Linux container. Never call it ESRCH.
  if (process.platform === 'linux') {
    try {
      const stat = readFileSync(`/proc/${pid}/stat`, 'utf8')
      if (stat.slice(stat.lastIndexOf(')') + 2).startsWith('Z ')) return 'terminated-zombie'
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 'absent'
      throw error
    }
  }
  return 'running'
}

async function waitForPid(pid: number, condition: (state: ReturnType<typeof pidState>) => boolean): Promise<ReturnType<typeof pidState>> {
  const deadline = Date.now() + 2_000
  let state = pidState(pid)
  while (!condition(state) && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 20))
    state = pidState(pid)
  }
  return state
}

async function cleanExactHelper(pid: number | undefined): Promise<void> {
  if (pid === undefined || pidState(pid) !== 'running') return
  process.kill(pid, 'SIGKILL')
  expect(await waitForPid(pid, state => state !== 'running')).not.toBe('running')
}

test('real successful local helper preserves readiness and raw stderr without a timeout', async () => {
  const value = token()
  const result = await runProcessControl({ command: process.execPath, args: [helper, 'complete', value], timeoutMs: 4_000 })
  expect(result).toMatchObject({ status: 'complete', reasonCodes: [] })
  expect(result.pid).toBeGreaterThan(0)
  expect(result.stdout.split(/\r?\n/)).toContain(readyLine(result.pid!, value))
  expect(result.stderr).toBe(`raw controlled stderr ${value}: 中文\n`)
  const after = await waitForPid(result.pid!, state => state === 'absent')
  expect(after).toBe('absent')
  console.info('[process-control-runtime]', JSON.stringify({ case: 'native-complete', platform: process.platform, result, observedPidState: after }))
})

test('real hanging local helper returns UNKNOWN with captured output and dies after successful kill', async () => {
  const value = token()
  let pid: number | undefined
  const started = Date.now()
  try {
    const result = await runProcessControl({ command: process.execPath, args: [helper, 'hang', value], timeoutMs: 3_000 })
    pid = result.pid
    expect(result).toMatchObject({ status: 'unknown', reasonCodes: ['CONTROL_TIMEOUT'] })
    expect(pid).toBeGreaterThan(0)
    expect(result.stdout.split(/\r?\n/)).toContain(readyLine(pid!, value))
    expect(result.stderr).toBe(`raw controlled stderr ${value}: 中文\n`)
    expect(Date.now() - started).toBeLessThan(6_000)
    const after = await waitForPid(pid!, state => state === 'absent')
    expect(after).toBe('absent')
    console.info('[process-control-runtime]', JSON.stringify({ case: 'native-timeout', platform: process.platform, result,
      elapsedMs: Date.now() - started, observedPidState: after, treeAbsenceCertified: false }))
  } finally { await cleanExactHelper(pid) }
})

async function runControlledCli(mode: 'kill-allowed' | 'kill-refused', value: string, cwd: string): Promise<{
  code: number | null; stdout: string; stderr: string; helperPid: number | undefined; elapsedMs: number;
}> {
  const env: NodeJS.ProcessEnv = {}
  for (const key of ['SystemRoot', 'WINDIR', 'TMP', 'TEMP']) if (process.env[key]) env[key] = process.env[key]
  let child: ChildProcess | undefined, helperPid: number | undefined
  const started = Date.now()
  try {
    return await new Promise((resolve, reject) => {
      child = spawn(process.execPath, [cli, builtModule.href, mode, value], { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
      let stdout = '', stderr = ''
      const timer = setTimeout(() => {
        child?.kill('SIGKILL')
        reject(new Error(`Controlled CLI did not exit within 8s; helper=${helperPid}; stdout=${stdout}; stderr=${stderr}`))
      }, 8_000)
      child.stdout!.on('data', chunk => {
        stdout += String(chunk)
        const line = stdout.split(/\r?\n/).find(row => row.startsWith('CONTROL_CLI_READY '))
        if (line) helperPid = (JSON.parse(line.slice('CONTROL_CLI_READY '.length)) as { pid: number }).pid
      })
      child.stderr!.on('data', chunk => { stderr += String(chunk) })
      child.once('error', error => { clearTimeout(timer); reject(error) })
      child.once('close', code => { clearTimeout(timer); resolve({ code, stdout, stderr, helperPid, elapsedMs: Date.now() - started }) })
    })
  } catch (error) {
    await cleanExactHelper(helperPid)
    throw error
  }
}

test.each(['kill-allowed', 'kill-refused'] as const)('actual CLI exits nonzero with held callback and %s; UNKNOWN is not reaping evidence', async mode => {
  expect(existsSync(fileURLToPath(builtModule)), 'npm run build is required before isolated CLI controls').toBe(true)
  const value = token(), cwd = mkdtempSync(join(tmpdir(), 'adng-proc-control-'))
  const sentinel = '{"synthetic_user_and_provider_state":"unchanged"}\n'
  writeFileSync(join(cwd, 'state-sentinel.json'), sentinel)
  let helperPid: number | undefined
  try {
    const actual = await runControlledCli(mode, value, cwd)
    helperPid = actual.helperPid
    expect(actual.code).toBe(1)
    expect(actual.elapsedMs).toBeLessThan(8_000)
    expect(actual.stderr).toBe('')
    expect(helperPid).toBeGreaterThan(0)
    const line = actual.stdout.split(/\r?\n/).find(row => row.startsWith('CONTROL_CLI_RESULT '))
    expect(line).toBeDefined()
    const receipt = JSON.parse(line!.slice('CONTROL_CLI_RESULT '.length))
    expect(receipt).toMatchObject({ mode, token: value, killAttempted: true, ownedStdioDestroyed: true,
      helperDetached: true, observedBeforeControl: 'running',
      result: { status: 'unknown', reasonCodes: ['CONTROL_TIMEOUT'], pid: helperPid },
    })
    expect(receipt.observedReady.split(/\r?\n/)).toContain(readyLine(helperPid!, value))
    expect(receipt.result.stdout.split(/\r?\n/)).toContain(readyLine(helperPid!, value))
    expect(receipt.result.stderr).toBe(`raw controlled stderr ${value}: 中文\n`)
    const beforeExternalCleanup = await waitForPid(helperPid!, state => mode === 'kill-refused' || state !== 'running')
    if (mode === 'kill-refused') {
      expect(receipt.observedAfterControl).toBe('running')
      expect(beforeExternalCleanup).toBe('running')
      // External cleanup targets only the exact PID reported by our controlled helper.
      await cleanExactHelper(helperPid)
      expect(pidState(helperPid!)).not.toBe('running')
    } else {
      expect(await waitForPid(helperPid!, state => state !== 'running')).not.toBe('running')
    }
    expect(readdirSync(cwd)).toEqual(['state-sentinel.json'])
    expect(readFileSync(join(cwd, 'state-sentinel.json'), 'utf8')).toBe(sentinel)
    console.info('[process-control-runtime]', JSON.stringify({ case: 'isolated-cli', platform: process.platform, mode,
      code: actual.code, elapsedMs: actual.elapsedMs, receipt, beforeExternalCleanup,
      afterExternalCleanup: pidState(helperPid!), syntheticStateUnchanged: true, treeAbsenceCertified: false }))
  } finally {
    await cleanExactHelper(helperPid)
    rmSync(cwd, { recursive: true, force: true })
  }
})
