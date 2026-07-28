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

test('adng-daemons.cmd：薄殼只委派 node dist\\cli.js supervise --configs-dir', () => {
  const content = readFileSync(CMD_PATH, 'utf8')
  const code = executableBody(content)

  expect(code).toMatch(/node\s+"%ADNG_ROOT%\\dist\\cli\.js"\s+supervise\s+--configs-dir/)
  expect(code).toMatch(/%ADNG_ROOT%\\configs/)
  expect(code).toMatch(/--guardian\s+off/)
  // single node invocation — no per-config spawn loop in the shell
  expect((code.match(/\bnode\b/gi) ?? []).length).toBe(1)
  // preprocess: refuse to run without a built CLI
  expect(code).toMatch(/if not exist "%ADNG_ROOT%\\dist\\cli\.js"/)
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
