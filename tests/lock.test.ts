import { expect, test } from 'vitest'
import { mkdtempSync, mkdirSync, utimesSync, existsSync, readdirSync, writeFileSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { acquireLock, releaseLock } from '../src/lock.js'

test('第二次 acquire 失敗；release 後可再取', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  const token = acquireLock(dir)
  expect(token).toBeTruthy()
  expect(acquireLock(dir)).toBeNull()
  releaseLock(dir, token)
  expect(acquireLock(dir)).toBeTruthy()
})

test('過期鎖可被接管', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  mkdirSync(dir) // 模擬前代留下的 unknown owner
  const old = new Date(Date.now() - 60 * 60 * 1000)
  utimesSync(dir, old, old)
  expect(acquireLock(dir, 30 * 60 * 1000)).toBeTruthy()
})

test('父目錄不存在時 acquireLock 必 throw（ENOENT rethrow，不是回 false）', () => {
  const parent = mkdtempSync(join(tmpdir(), 'adng-lk-'))
  const dir = join(parent, 'no-such-parent', 'lock')
  expect(() => acquireLock(dir)).toThrow()
})

test('stale 接管成功後，第二個呼叫者立即再 acquire 必回 false（新鎖 age 已重置）', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  mkdirSync(dir)
  const old = new Date(Date.now() - 60 * 60 * 1000)
  utimesSync(dir, old, old)

  const token = acquireLock(dir, 30 * 60 * 1000)
  expect(token).toBeTruthy()
  expect(acquireLock(dir, 30 * 60 * 1000)).toBeNull()
  releaseLock(dir, token)
})

test('SQLite coordinator remains outside the removable lock directory', () => {
  const parent = mkdtempSync(join(tmpdir(), 'adng-lk-'))
  const dir = join(parent, 'lock')
  const first = acquireLock(dir)!
  releaseLock(dir, first)
  expect(existsSync(dir)).toBe(false)
  expect(readdirSync(parent)).toContain('.autodev-lock-coordination.sqlite')
  const second = acquireLock(dir)
  expect(second).toBeTruthy()
  releaseLock(dir, second)
})

// --- HIGH-1: PID-in-lock 驗活取代純 mtime 判 stale ---

test('acquireLock 成功後寫入 pid.json，內容為自己的 pid', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  expect(acquireLock(dir)).toBeTruthy()
  const pidFile = JSON.parse(readFileSync(join(dir, 'pid.json'), 'utf8'))
  expect(pidFile.pid).toBe(process.pid)
  expect(typeof pidFile.startedAt).toBe('string')
})

test('pid.json 指向存活進程時，即使 mtime 極舊也不被 steal（PID 驗活優先於 mtime）', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  expect(acquireLock(dir)).toBeTruthy() // 寫入 pid.json { pid: process.pid }（自己，存活）
  const old = new Date(Date.now() - 60 * 60 * 1000)
  utimesSync(dir, old, old) // mtime 極舊，若走舊邏輯早該視為 stale
  expect(acquireLock(dir, 30 * 60 * 1000)).toBeNull() // PID 活著，不看 mtime，不 steal
})

test.runIf(process.platform === 'win32')('pid.json 的 PID 已被較晚啟動程序重用時立即 steal', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  mkdirSync(dir)
  writeFileSync(join(dir, 'pid.json'), JSON.stringify({
    pid: process.pid,
    startedAt: '2000-01-01T00:00:00.000Z',
  }))

  expect(acquireLock(dir, 30 * 60 * 1000)).toBeTruthy()
})

function assertPidIsDead(pid: number): void {
  try {
    process.kill(pid, 0)
    throw new Error(`測試前置假設破裂：pid ${pid} 竟然還活著`)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ESRCH') throw err
  }
}

test('pid.json 指向死掉的 PID 時立即 steal（不等 staleMs），新 pid.json 為自己', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  mkdirSync(dir) // 手動建鎖目錄（不經過 acquireLock，避免此處寫入自己的 pid.json）

  // spawnSync 同步等子進程結束才回傳，故取得的 pid 保證已死
  const dead = spawnSync(process.execPath, ['-e', '0'])
  const deadPid = dead.pid
  expect(typeof deadPid).toBe('number')
  assertPidIsDead(deadPid as number)

  writeFileSync(join(dir, 'pid.json'), JSON.stringify({ pid: deadPid, startedAt: new Date().toISOString() }))
  // mtime 刻意保持「新鮮」（剛 mkdir），驗證死 PID 會跳過 staleMs 直接 steal
  expect(acquireLock(dir, 30 * 60 * 1000)).toBeTruthy()
  const pidFile = JSON.parse(readFileSync(join(dir, 'pid.json'), 'utf8'))
  expect(pidFile.pid).toBe(process.pid)
})

test('死 PID steal 成功後，第二個 acquireLock 立即回 false（新主人的 pid.json 是自己且活著）', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  mkdirSync(dir) // 手動建鎖目錄（不經過 acquireLock，避免此處寫入自己的 pid.json）

  const dead = spawnSync(process.execPath, ['-e', '0'])
  const deadPid = dead.pid
  expect(typeof deadPid).toBe('number')
  assertPidIsDead(deadPid as number)

  writeFileSync(join(dir, 'pid.json'), JSON.stringify({ pid: deadPid, startedAt: new Date().toISOString() }))

  expect(acquireLock(dir, 30 * 60 * 1000)).toBeTruthy() // steal 成功，建立新鎖（含自己的新 pid.json）
  expect(acquireLock(dir, 30 * 60 * 1000)).toBeNull() // 新鎖 PID 是自己且活著，必須讓步
})

test('dead PID reclaim updates the existing lock directory in place', () => {
  const parent = mkdtempSync(join(tmpdir(), 'adng-lk-'))
  const dir = join(parent, 'lock')
  mkdirSync(dir)

  const dead = spawnSync(process.execPath, ['-e', '0'])
  const deadPid = dead.pid
  expect(typeof deadPid).toBe('number')
  assertPidIsDead(deadPid as number)
  writeFileSync(join(dir, 'pid.json'), JSON.stringify({ pid: deadPid, startedAt: new Date().toISOString() }))

  const token = acquireLock(dir, 30 * 60 * 1000)
  expect(token).toBeTruthy()
  expect(JSON.parse(readFileSync(join(dir, 'pid.json'), 'utf8')).token).toBe(token)
  expect(readdirSync(parent).some((name) => name.includes('.stale-') || name.endsWith('.reclaim'))).toBe(false)
  releaseLock(dir, token)
})

test('pid.json 損壞（非 JSON）時 fallback 舊 mtime 邏輯：新鮮不 steal', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  mkdirSync(dir)
  writeFileSync(join(dir, 'pid.json'), 'not json{{{')
  expect(acquireLock(dir, 30 * 60 * 1000)).toBeNull() // mtime 新鮮，fallback 判斷不 steal
})

test('pid.json 損壞（非 JSON）時 fallback 舊 mtime 邏輯：超過 staleMs 可 steal', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  mkdirSync(dir)
  writeFileSync(join(dir, 'pid.json'), 'not json{{{')
  const old = new Date(Date.now() - 60 * 60 * 1000)
  utimesSync(dir, old, old)
  expect(acquireLock(dir, 30 * 60 * 1000)).toBeTruthy()
  const pidFile = JSON.parse(readFileSync(join(dir, 'pid.json'), 'utf8'))
  expect(pidFile.pid).toBe(process.pid)
})

test('pid.json 內 pid 非正整數時視同損壞走 fallback（超過 staleMs 可 steal）', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  mkdirSync(dir)
  writeFileSync(join(dir, 'pid.json'), JSON.stringify({ pid: -1, startedAt: new Date().toISOString() }))
  const old = new Date(Date.now() - 60 * 60 * 1000)
  utimesSync(dir, old, old)
  expect(acquireLock(dir, 30 * 60 * 1000)).toBeTruthy()
})
