import { beforeEach, describe, expect, test, vi } from 'vitest'

// vi.mock('node:fs') 影響整個模組，故此檔獨立於 tests/lock.test.ts，避免污染其他測試的真實 fs 行為。
const { mkdirSync, statSync, renameSync, rmSync } = vi.hoisted(() => ({
  mkdirSync: vi.fn(),
  statSync: vi.fn(),
  renameSync: vi.fn(),
  rmSync: vi.fn(),
}))

vi.mock('node:fs', () => ({
  mkdirSync,
  statSync,
  renameSync,
  rmSync,
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

beforeEach(() => {
  mkdirSync.mockReset()
  statSync.mockReset()
  renameSync.mockReset()
  rmSync.mockReset()
})

describe('acquireLock 錯誤分類：ENOENT/EEXIST 讓步，其他 infra 故障 rethrow', () => {
  test('renameSync ENOENT（競爭者已搶先接管）→ return false，不繼續清理', () => {
    mkdirSync.mockImplementationOnce(() => {
      throw errWithCode('EEXIST')
    })
    statSync.mockReturnValueOnce({ mtimeMs: OLD_MTIME })
    renameSync.mockImplementationOnce(() => {
      throw errWithCode('ENOENT')
    })

    expect(acquireLock(DIR, STALE_MS)).toBe(false)
    expect(rmSync).not.toHaveBeenCalled()
  })

  test('renameSync EPERM（infra 故障）→ rethrow', () => {
    mkdirSync.mockImplementationOnce(() => {
      throw errWithCode('EEXIST')
    })
    statSync.mockReturnValueOnce({ mtimeMs: OLD_MTIME })
    renameSync.mockImplementationOnce(() => {
      throw errWithCode('EPERM')
    })

    expectThrowsWithCode(() => acquireLock(DIR, STALE_MS), 'EPERM')
  })

  test('第二次 mkdirSync EEXIST（rename 贏家仍撞上第三方新鎖）→ return false', () => {
    mkdirSync.mockImplementationOnce(() => {
      throw errWithCode('EEXIST')
    }) // 第一次 mkdir：判定鎖已存在
    statSync.mockReturnValueOnce({ mtimeMs: OLD_MTIME })
    renameSync.mockImplementationOnce(() => undefined) // rename 接管成功
    rmSync.mockImplementationOnce(() => undefined)
    mkdirSync.mockImplementationOnce(() => {
      throw errWithCode('EEXIST')
    }) // 第二次 mkdir：撞上第三方剛建立的新鎖

    expect(acquireLock(DIR, STALE_MS)).toBe(false)
  })

  test('第二次 mkdirSync EBUSY（infra 故障）→ rethrow', () => {
    mkdirSync.mockImplementationOnce(() => {
      throw errWithCode('EEXIST')
    })
    statSync.mockReturnValueOnce({ mtimeMs: OLD_MTIME })
    renameSync.mockImplementationOnce(() => undefined)
    rmSync.mockImplementationOnce(() => undefined)
    mkdirSync.mockImplementationOnce(() => {
      throw errWithCode('EBUSY')
    })

    expectThrowsWithCode(() => acquireLock(DIR, STALE_MS), 'EBUSY')
  })

  test('statSync ENOENT（鎖目錄在檢查 age 前已被清走）→ return false', () => {
    mkdirSync.mockImplementationOnce(() => {
      throw errWithCode('EEXIST')
    })
    statSync.mockImplementationOnce(() => {
      throw errWithCode('ENOENT')
    })

    expect(acquireLock(DIR, STALE_MS)).toBe(false)
    expect(renameSync).not.toHaveBeenCalled()
  })

  test('statSync EBUSY（infra 故障）→ rethrow', () => {
    mkdirSync.mockImplementationOnce(() => {
      throw errWithCode('EEXIST')
    })
    statSync.mockImplementationOnce(() => {
      throw errWithCode('EBUSY')
    })

    expectThrowsWithCode(() => acquireLock(DIR, STALE_MS), 'EBUSY')
  })
})
