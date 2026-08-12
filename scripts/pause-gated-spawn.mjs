import { spawn } from 'node:child_process'
import { closeSync, existsSync, mkdirSync, openSync, renameSync, rmSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const STALE_MS = 60_000

function lockFor(stopFile) {
  const gate = `${resolve(stopFile)}.lockdir`
  const acquire = () => {
    try { mkdirSync(gate); return true } catch (error) {
      if (error?.code !== 'EEXIST') throw error
    }
    try {
      if (Date.now() - statSync(gate).mtimeMs <= STALE_MS) return false
      const reap = `${gate}.reap-${process.pid}-${Date.now()}`
      renameSync(gate, reap)
      rmSync(reap, { recursive: true, force: true })
      mkdirSync(gate)
      return true
    } catch { return false }
  }
  let held = false
  return {
    acquire() { held = acquire(); return held },
    release() {
      if (!held) return
      held = false
      try { rmSync(gate, { recursive: true, force: true }) } catch { /* 下一輪會回收殘留 gate。 */ }
    },
  }
}

/** 在同步副作用開始前，與 pause 寫入共用同一把 gate。 */
export function withPauseGate(stopFile, action) {
  const lock = lockFor(stopFile)
  if (!lock.acquire()) return { started: false }
  try {
    if (existsSync(resolve(stopFile))) return { started: false }
    return { started: true, value: action() }
  } finally {
    lock.release()
  }
}

/** 只把「建立真正工作子行程」放在 gate 內；已啟動工作不由 pause 強殺。 */
export async function spawnPauseGated(stopFile, command, args = [], options = {}) {
  const lock = lockFor(stopFile)
  if (!lock.acquire()) return { started: false, status: 0 }
  if (existsSync(resolve(stopFile))) {
    lock.release()
    return { started: false, status: 0 }
  }

  const { outputFile, timeoutMs, ...spawnOptions } = options
  let child
  let outputFd
  try {
    if (outputFile) {
      const file = resolve(outputFile)
      mkdirSync(dirname(file), { recursive: true })
      outputFd = openSync(file, 'w')
    }
    child = spawn(command, args, {
      windowsHide: true,
      ...spawnOptions,
      ...(outputFd === undefined ? {} : { stdio: ['inherit', outputFd, outputFd] }),
    })
  } catch (error) {
    if (outputFd !== undefined) closeSync(outputFd)
    lock.release()
    throw error
  }

  return new Promise((resolveResult, reject) => {
    let timer
    const release = () => {
      if (outputFd !== undefined) {
        closeSync(outputFd)
        outputFd = undefined
      }
      lock.release()
    }
    child.once('spawn', () => {
      release()
      if (timeoutMs) timer = setTimeout(() => child.kill(), timeoutMs)
    })
    child.once('error', error => {
      release()
      if (timer) clearTimeout(timer)
      reject(error)
    })
    child.once('exit', code => {
      release()
      if (timer) clearTimeout(timer)
      resolveResult({ started: true, status: code ?? 1 })
    })
  })
}

async function main() {
  const argv = process.argv.slice(2)
  const stopFile = argv.shift()
  let outputFile
  if (argv[0] === '--output') {
    argv.shift()
    outputFile = argv.shift()
  }
  const command = argv.shift()
  const args = argv
  if (!stopFile || !command) {
    console.error('usage: node pause-gated-spawn.mjs <stop-file> [--output <file>] <command> [args...]')
    process.exitCode = 2
    return
  }
  try {
    const result = await spawnPauseGated(stopFile, command, args, { outputFile, stdio: 'inherit' })
    process.exitCode = result.status
  } catch (error) {
    console.error(String(error))
    process.exitCode = 1
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) await main()
