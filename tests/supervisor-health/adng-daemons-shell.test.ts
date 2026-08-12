/**
 * Acceptance: scripts/adng-daemons.cmd is a pure-ASCII thin shell that only
 * delegates to the TS supervisor. Inline batch liveness (tasklist / pid.json /
 * ALIVE / start /b loop) must be gone; daemon-console.log share-lock lives in
 * src/supervisor/supervise.ts (launchDaemon + openDaemonConsoleLog).
 */
import { expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  isDaemonConsoleLogBusyError,
  launchDaemon,
  openDaemonConsoleLog,
} from '../../src/supervisor/supervise.js'

const CMD_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'scripts', 'adng-daemons.cmd')
const GUARDIAN_CMD_PATH = join(dirname(CMD_PATH), 'adng-guardian.cmd')
const PATROL_GUARD_PATH = join(dirname(CMD_PATH), 'adng-patrol-guard.cmd')
const BACKUP_PUSH_PATH = join(dirname(CMD_PATH), 'backup-push.mjs')
const MEMORY_SNAPSHOT_PATH = join(dirname(CMD_PATH), 'memory-snapshot.mjs')
const MEMORY_SWEEP_PATH = join(dirname(CMD_PATH), 'patrol', 'memory-sweep.ps1')

/** Strip REM comments and blank lines; keep only executable body. */
function executableBody(content: string): string {
  return content
    .split(/\r?\n/)
    .filter(line => {
      const t = line.trim()
      return t.length > 0 && !t.toUpperCase().startsWith('REM')
    })
    .join('\n')
}

test('adng-daemons.cmd：位元組層純 ASCII（不匹配 [^\\x00-\\x7F]）', () => {
  const buf = readFileSync(CMD_PATH)
  const offenders: number[] = []
  for (let i = 0; i < buf.length; i++) {
    if (buf[i]! > 0x7f) offenders.push(i)
  }
  expect(offenders, `non-ASCII offsets: ${offenders.slice(0, 8).join(',')}`).toEqual([])
  // string-level guard (same regex as hard rule 7 acceptance)
  expect(buf.toString('latin1')).not.toMatch(/[^\x00-\x7F]/)
})

test('adng-daemons.cmd：supervisor 只委派一次 node dist\\cli.js supervise --configs-dir', () => {
  const content = readFileSync(CMD_PATH, 'utf8')
  const code = executableBody(content)

  expect(code).toMatch(/node\s+"%ADNG_ROOT%\\dist\\cli\.js"\s+supervise\s+--configs-dir/)
  expect(code).toMatch(/%ADNG_ROOT%\\configs/)
  expect(code).toMatch(/--guardian\s+off/)
  // supervisor single invocation — independent patrol/backup jobs are not per-config daemon spawns
  expect((code.match(/\bnode\s+"%ADNG_ROOT%\\dist\\cli\.js"\s+supervise\b/gi) ?? []).length).toBe(1)
  // preprocess: refuse to run without a built CLI
  expect(code).toMatch(/if not exist "%ADNG_ROOT%\\dist\\cli\.js"/)
})

test('fleet 停止哨兵在 daemon、Guardian 與 patrol guard 啟動工作前 fail-closed', () => {
  for (const path of [CMD_PATH, GUARDIAN_CMD_PATH, PATROL_GUARD_PATH]) {
    const code = executableBody(readFileSync(path, 'utf8'))
    const guard = code.indexOf('if exist ')
    const launch = path === GUARDIAN_CMD_PATH
      ? code.indexOf('node "%ADNG_ROOT%\\dist\\cli.js" supervise')
      : path === CMD_PATH
        ? code.indexOf('node "%ADNG_ROOT%\\dist\\cli.js" supervise')
        : code.indexOf('node "%ADNG_ROOT%\\scripts\\pause-gated-spawn.mjs"')

    expect(guard).toBeGreaterThanOrEqual(0)
    expect(launch).toBeGreaterThan(guard)
  }
})

test('daemon launcher 後段 patrol、backup 與 snapshot 都經 pause gate', () => {
  const daemon = executableBody(readFileSync(CMD_PATH, 'utf8'))
  const guard = executableBody(readFileSync(PATROL_GUARD_PATH, 'utf8'))

  expect(daemon).toContain('set "ADNG_GATE=%ADNG_ROOT%\\scripts\\pause-gated-spawn.mjs"')
  expect(daemon).toMatch(/node "%ADNG_GATE%" "%ADNG_STOP%" node\.exe "%ADNG_ROOT%\\scripts\\backup-push\.mjs"/)
  expect(daemon).toMatch(/node "%ADNG_GATE%" "%ADNG_STOP%" node\.exe "%ADNG_ROOT%\\scripts\\memory-snapshot\.mjs"/)
  expect(guard).toMatch(/pause-gated-spawn\.mjs" "%ADNG_STOP%" wscript\.exe/)
})

test('延遲 worker 的實際副作用逐次過 gate，不能信任可偽造環境旗標', () => {
  const backup = readFileSync(BACKUP_PUSH_PATH, 'utf8')
  const snapshot = readFileSync(MEMORY_SNAPSHOT_PATH, 'utf8')
  const sweep = readFileSync(MEMORY_SWEEP_PATH, 'utf8')

  expect(backup).toContain('spawnPauseGated(STOP')
  expect(snapshot).toContain('spawnPauseGated(STOP')
  expect(snapshot).toContain('withPauseGate(STOP')
  expect(sweep).toContain('Invoke-PauseGated')
  for (const code of [backup, snapshot, sweep]) expect(code).not.toContain('ADNG_PAUSE_GATE_ACTIVE')
})

test('adng-daemons.cmd：執行體無 inline 判活／legacy 批次啟動邏輯', () => {
  const code = executableBody(readFileSync(CMD_PATH, 'utf8'))

  const forbidden: Array<{ name: string; re: RegExp }> = [
    { name: 'tasklist', re: /tasklist/i },
    { name: 'pid.json', re: /pid\.json/i },
    { name: 'ALIVE flag', re: /\bALIVE\b/i },
    { name: 'start /b', re: /start\s+""\s+\/b/i },
    { name: 'for %%F configs loop', re: /for\s+%%F\b/i },
    { name: 'daemon.lock', re: /daemon\.lock/i },
    { name: 'IMAGENAME filter', re: /IMAGENAME/i },
    { name: 'find lockpid', re: /\bfind\b/i },
    { name: 'LOCKPID variable', re: /\bLOCKPID\b/i },
    { name: 'PIDFILE variable', re: /\bPIDFILE\b/i },
    { name: 'set /p PID parser', re: /\bset\s+\/p\b/i },
    { name: 'for /f PID parser', re: /\bfor\s+\/f\b/i },
    { name: 'errorlevel liveness check', re: /\bif\s+not\s+errorlevel\b/i },
    { name: 'legacy daemon --config launch', re: /\bdaemon\s+--config\b/i },
    // log redirect / share-lock must not live in the shell body
    { name: 'daemon-console.log', re: /daemon-console\.log/i },
    { name: '>> redirect spawn', re: />>/ },
  ]

  for (const { name, re } of forbidden) {
    expect(code, `executable body must not contain ${name}`).not.toMatch(re)
  }
})

test('daemon-console.log 共享鎖處理在 TS launchDaemon（非 cmd）', () => {
  // contract: exports used by supervise path still present
  expect(typeof openDaemonConsoleLog).toBe('function')
  expect(typeof launchDaemon).toBe('function')
  expect(typeof isDaemonConsoleLogBusyError).toBe('function')

  for (const code of ['EBUSY', 'EPERM', 'EACCES', 'EEXIST'] as const) {
    expect(isDaemonConsoleLogBusyError(Object.assign(new Error(code), { code }))).toBe(true)
  }
  expect(isDaemonConsoleLogBusyError(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))).toBe(false)
})
