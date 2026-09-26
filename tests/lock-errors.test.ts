import { beforeEach, describe, expect, test, vi } from 'vitest'

// vi.mock('node:fs') 影響整個模組，故此檔獨立於 tests/lock.test.ts，避免污染其他測試的真實 fs 行為。
const { mkdirSync, statSync, renameSync, rmSync, existsSync, readFileSync, writeFileSync, readdirSync } = vi.hoisted(() => ({
  mkdirSync: vi.fn(),
  statSync: vi.fn(),
  renameSync: vi.fn(),
  rmSync: vi.fn(),
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  readdirSync: vi.fn(),
}))

vi.mock('node:fs', () => ({
  mkdirSync,
  statSync,
  renameSync,
  rmSync,
  existsSync,
  readFileSync,
  writeFileSync,
  readdirSync,
}))

const { acquireLock } = await import('../src/lock.js')

function errWithCode(code: string): NodeJS.ErrnoException {
  const e = new Error(code) as NodeJS.ErrnoException
  e.code = code
  return e
}

/** fn() 必須 throw，且 throw 出來的錯誤必須帶著指定 code（而非只是「有 throw」這種弱斷言）。 */
function expectThrowsWithCode(fn: () => unknown, code: string): void {
  let caught: unknown
  try {
    fn()
  } catch (e) {
    caught = e
  }
  expect(caught).toBeInstanceOf(Error)
  expect((caught as NodeJS.ErrnoException).code).toBe(code)
}

const DIR = 'C:\\fake\\lock'
const STALE_MS = 30 * 60 * 1000
const OLD_MTIME = Date.now() - 60 * 60 * 1000

// 回收路徑的 fs 呼叫序：mkdir(dir)→EEXIST → existsSync(recovery) → readFileSync(pid.json)
// → statSync(dir 年齡) → mkdir(dir+.reclaim sibling 互斥) → writeFileSync+renameSync(互斥 claim)
// → readFileSync(pid.json 世代複核) → statSync(再驗年齡) → renameSync(dir→stolen)
// → existsSync+readFileSync(stolen 捕獲物驗明正身) → rmSync(stolen)
// → mkdir(dir) → writeFileSync+renameSync(新 pid.json) → readFileSync+rmSync(互斥 echo 收尾)。
function queueStaleReclaim(): void {
  mkdirSync.mockImplementationOnce(() => { throw errWithCode('EEXIST') }) // 鎖目錄已存在
  statSync.mockReturnValueOnce({ mtimeMs: OLD_MTIME } as ReturnType<typeof statSync>) // 初驗：已過期
  mkdirSync.mockImplementationOnce(() => undefined) // .reclaim 互斥建立成功
  renameSync.mockImplementationOnce(() => undefined) // 互斥 pid.json tmp→final
  statSync.mockReturnValueOnce({ mtimeMs: OLD_MTIME } as ReturnType<typeof statSync>) // 世代複核：仍過期
}

beforeEach(() => {
  mkdirSync.mockReset()
  statSync.mockReset()
  renameSync.mockReset()
  rmSync.mockReset()
  existsSync.mockReset().mockReturnValue(false)
  // 預設 pid.json 讀取失敗 → 'unknown'，走 mtime 年齡路徑。
  readFileSync.mockReset().mockImplementation(() => { throw errWithCode('ENOENT') })
  writeFileSync.mockReset()
  readdirSync.mockReset().mockReturnValue([])
})

describe('acquireLock 錯誤分類：ENOENT/EEXIST 讓步，其他 infra 故障 rethrow', () => {
  test('recovery marker prevents stale takeover before checking owner or age', () => {
    mkdirSync.mockImplementationOnce(() => { throw errWithCode('EEXIST') })
    existsSync.mockReturnValue(true)
    expect(acquireLock(DIR, STALE_MS)).toBeNull()
    expect(statSync).not.toHaveBeenCalled()
    expect(renameSync).not.toHaveBeenCalled()
    expect(rmSync).not.toHaveBeenCalled()
  })

  test('steal renameSync ENOENT（dir 已被先清走）→ 讓步，絕不刪觀察到的鎖目錄', () => {
    queueStaleReclaim()
    renameSync.mockImplementationOnce(() => { throw errWithCode('ENOENT') }) // dir→stolen rename

    expect(acquireLock(DIR, STALE_MS)).toBeNull()
    // 觀察到的鎖目錄本身永遠不進 rmSync；收尾只可能動自己的 .reclaim／.stale- 殘骸
    // （echo-check 在 mock 下讀不到自己 claim 的 pid.json → 保守跳過，rmSync 可為 0 次）
    expect(rmSync).not.toHaveBeenCalledWith(DIR, expect.anything())
    for (const [p] of rmSync.mock.calls) {
      expect(String(p)).toMatch(/\.(reclaim|stale-)/)
    }
  })

  test('steal renameSync EPERM（infra 故障）→ rethrow', () => {
    queueStaleReclaim()
    renameSync.mockImplementationOnce(() => { throw errWithCode('EPERM') })

    expectThrowsWithCode(() => acquireLock(DIR, STALE_MS), 'EPERM')
  })

  test('steal 後 mkdirSync EEXIST（路徑空窗被第三方新鎖佔走）→ 讓步', () => {
    queueStaleReclaim()
    renameSync.mockImplementationOnce(() => undefined) // dir→stolen rename 成功
    rmSync.mockImplementationOnce(() => undefined) // stolen 清理
    mkdirSync.mockImplementationOnce(() => { throw errWithCode('EEXIST') }) // 重建鎖目錄撞第三方

    expect(acquireLock(DIR, STALE_MS)).toBeNull()
  })

  test('steal 後 mkdirSync EBUSY（infra 故障）→ rethrow', () => {
    queueStaleReclaim()
    renameSync.mockImplementationOnce(() => undefined)
    rmSync.mockImplementationOnce(() => undefined)
    mkdirSync.mockImplementationOnce(() => { throw errWithCode('EBUSY') })

    expectThrowsWithCode(() => acquireLock(DIR, STALE_MS), 'EBUSY')
  })

  test('statSync ENOENT（鎖目錄在檢查 age 前已被清走）→ return null', () => {
    mkdirSync.mockImplementationOnce(() => { throw errWithCode('EEXIST') })
    statSync.mockImplementationOnce(() => { throw errWithCode('ENOENT') })

    expect(acquireLock(DIR, STALE_MS)).toBeNull()
    expect(renameSync).not.toHaveBeenCalled()
  })

  test('statSync EBUSY（infra 故障）→ rethrow', () => {
    mkdirSync.mockImplementationOnce(() => { throw errWithCode('EEXIST') })
    statSync.mockImplementationOnce(() => { throw errWithCode('EBUSY') })

    expectThrowsWithCode(() => acquireLock(DIR, STALE_MS), 'EBUSY')
  })

  test('回收互斥 mkdir EPERM（infra 故障）→ rethrow', () => {
    mkdirSync.mockImplementationOnce(() => { throw errWithCode('EEXIST') })
    statSync.mockReturnValueOnce({ mtimeMs: OLD_MTIME } as ReturnType<typeof statSync>)
    mkdirSync.mockImplementationOnce(() => { throw errWithCode('EPERM') }) // .reclaim 互斥建立失敗

    expectThrowsWithCode(() => acquireLock(DIR, STALE_MS), 'EPERM')
  })
})
