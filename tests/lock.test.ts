import { expect, test } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, utimesSync, existsSync, readdirSync, writeFileSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { acquireLock, releaseLock } from '../src/lock.js'

test('第二次 acquire 失敗；release 後可再取', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  expect(acquireLock(dir)).toBe(true)
  expect(acquireLock(dir)).toBe(false)
  releaseLock(dir)
  expect(acquireLock(dir)).toBe(true)
})

test('過期鎖可被接管', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  expect(acquireLock(dir)).toBe(true)
  rmSync(join(dir, 'pid.json'), { force: true }) // 模擬 pid.json 缺失，測試 mtime fallback 路徑（PID 存活優先判定見專門測試）
  const old = new Date(Date.now() - 60 * 60 * 1000)
  utimesSync(dir, old, old) // 假裝鎖已一小時
  expect(acquireLock(dir, 30 * 60 * 1000)).toBe(true)
})

test('父目錄不存在時 acquireLock 必 throw（ENOENT rethrow，不是回 false）', () => {
  const parent = mkdtempSync(join(tmpdir(), 'adng-lk-'))
  const dir = join(parent, 'no-such-parent', 'lock')
  expect(() => acquireLock(dir)).toThrow()
})

test('stale 接管成功後，第二個呼叫者立即再 acquire 必回 false（新鎖 age 已重置）', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  expect(acquireLock(dir)).toBe(true)
  rmSync(join(dir, 'pid.json'), { force: true }) // 同上：測試 mtime fallback 路徑
  const old = new Date(Date.now() - 60 * 60 * 1000)
  utimesSync(dir, old, old) // 假裝鎖已一小時

  expect(acquireLock(dir, 30 * 60 * 1000)).toBe(true) // 接管成功，建立全新鎖（含自己的新 pid.json）
  expect(acquireLock(dir, 30 * 60 * 1000)).toBe(false) // 新鎖 PID 是自己且活著，必須讓步
})

test('對已被 rename 走的殘留 .stale-* 目錄不影響後續 acquire/release', () => {
  const parent = mkdtempSync(join(tmpdir(), 'adng-lk-'))
  const dir = join(parent, 'lock')
  expect(acquireLock(dir)).toBe(true)
  rmSync(join(dir, 'pid.json'), { force: true }) // 同上：測試 mtime fallback 路徑
  const old = new Date(Date.now() - 60 * 60 * 1000)
  utimesSync(dir, old, old)
  expect(acquireLock(dir, 30 * 60 * 1000)).toBe(true) // 觸發 rename → rmSync 殘留清理

  // 確認沒有殘留的 .stale-* 目錄留在 parent 底下
  const leftovers = readdirSync(parent).filter((name) => name.includes('.stale-'))
  expect(leftovers).toEqual([])
  expect(existsSync(dir)).toBe(true)

  // 殘留（若有）不應影響正常 acquire/release 流程
  expect(acquireLock(dir, 30 * 60 * 1000)).toBe(false)
  releaseLock(dir)
  expect(acquireLock(dir)).toBe(true)
})

// --- HIGH-1: PID-in-lock 驗活取代純 mtime 判 stale ---

test('acquireLock 成功後寫入 pid.json，內容為自己的 pid', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  expect(acquireLock(dir)).toBe(true)
  const pidFile = JSON.parse(readFileSync(join(dir, 'pid.json'), 'utf8'))
  expect(pidFile.pid).toBe(process.pid)
  expect(typeof pidFile.startedAt).toBe('string')
})

test('pid.json 指向存活進程時，即使 mtime 極舊也不被 steal（PID 驗活優先於 mtime）', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  expect(acquireLock(dir)).toBe(true) // 寫入 pid.json { pid: process.pid }（自己，存活）
  const old = new Date(Date.now() - 60 * 60 * 1000)
  utimesSync(dir, old, old) // mtime 極舊，若走舊邏輯早該視為 stale
  expect(acquireLock(dir, 30 * 60 * 1000)).toBe(false) // PID 活著，不看 mtime，不 steal
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
  expect(acquireLock(dir, 30 * 60 * 1000)).toBe(true)
  const pidFile = JSON.parse(readFileSync(join(dir, 'pid.json'), 'utf8'))
  expect(pidFile.pid).toBe(process.pid)
})

test('pid.json 損壞（非 JSON）時 fallback 舊 mtime 邏輯：新鮮不 steal', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  mkdirSync(dir)
  writeFileSync(join(dir, 'pid.json'), 'not json{{{')
  expect(acquireLock(dir, 30 * 60 * 1000)).toBe(false) // mtime 新鮮，fallback 判斷不 steal
})

test('pid.json 損壞（非 JSON）時 fallback 舊 mtime 邏輯：超過 staleMs 可 steal', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  mkdirSync(dir)
  writeFileSync(join(dir, 'pid.json'), 'not json{{{')
  const old = new Date(Date.now() - 60 * 60 * 1000)
  utimesSync(dir, old, old)
  expect(acquireLock(dir, 30 * 60 * 1000)).toBe(true)
  const pidFile = JSON.parse(readFileSync(join(dir, 'pid.json'), 'utf8'))
  expect(pidFile.pid).toBe(process.pid)
})

test('pid.json 內 pid 非正整數時視同損壞走 fallback（超過 staleMs 可 steal）', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  mkdirSync(dir)
  writeFileSync(join(dir, 'pid.json'), JSON.stringify({ pid: -1, startedAt: new Date().toISOString() }))
  const old = new Date(Date.now() - 60 * 60 * 1000)
  utimesSync(dir, old, old)
  expect(acquireLock(dir, 30 * 60 * 1000)).toBe(true)
})
