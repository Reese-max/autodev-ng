import { describe, expect, test, vi } from 'vitest'
import { mkdtempSync, mkdirSync as realMkdirSync, existsSync, utimesSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// 只局部 mock writeFileSync（可控制在特定呼叫拋錯），其餘 fs 函式維持真實行為（操作真實暫存目錄）。
// 這樣「鎖目錄補償清理後不存在、下次 acquire 立即成功」可用真實檔案系統直接驗證，
// 不必重建一整套 in-memory fs 模型。與 tests/lock-errors.test.ts 的完整 vi.mock('node:fs')
// 風格互不干擾（各測試檔的 vi.mock 只作用於該檔）。
const writeFileSync = vi.hoisted(() => vi.fn())

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  writeFileSync.mockImplementation(actual.writeFileSync)
  return {
    ...actual,
    writeFileSync,
  }
})

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

describe('writeOwnPidFile 失敗時補償清理鎖目錄（MEDIUM-1：不留幽靈鎖）', () => {
  test('初次 acquire：writeFileSync ENOSPC → acquireLock rethrow 且鎖目錄不存在，下次 acquire 立即成功', () => {
    const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-cleanup-')), 'lock')

    writeFileSync.mockImplementationOnce(() => {
      throw errWithCode('ENOSPC')
    })

    expectThrowsWithCode(() => acquireLock(dir), 'ENOSPC')
    expect(existsSync(dir)).toBe(false) // 補償清理：剛建立的幽靈鎖目錄已刪除

    expect(acquireLock(dir)).toBe(true) // 下次 acquire（真實 writeFileSync）立即成功，未被幽靈鎖擋住
  })

  test('steal 重建：pid-dead steal 過程 writeFileSync ENOSPC → acquireLock rethrow 且新鎖目錄不存在，下次 acquire 立即成功', () => {
    const parent = mkdtempSync(join(tmpdir(), 'adng-lk-cleanup-'))
    const dir = join(parent, 'lock')
    realMkdirSync(dir) // 手動建立既有鎖目錄，不寫 pid.json（模擬缺失 → checkLockOwner 回 'unknown'）
    const old = new Date(Date.now() - 60 * 60 * 1000)
    utimesSync(dir, old, old) // mtime 超過 staleMs，觸發 mtime-fallback steal 流程

    writeFileSync.mockImplementationOnce(() => {
      throw errWithCode('ENOSPC')
    })

    expectThrowsWithCode(() => acquireLock(dir, 30 * 60 * 1000), 'ENOSPC')
    expect(existsSync(dir)).toBe(false) // 補償清理：steal 重建的幽靈鎖目錄已刪除

    expect(acquireLock(dir, 30 * 60 * 1000)).toBe(true) // 下次 acquire 立即成功
  })
})
