import { mkdirSync, rmSync, statSync, renameSync } from 'node:fs'

/** Windows 無 flock：mkdir 是唯一可靠的原子互斥（舊系統實證）。 */
export function acquireLock(dir: string, staleMs = 30 * 60 * 1000): boolean {
  try {
    mkdirSync(dir, { recursive: false })
    return true
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err

    let age: number
    try {
      age = Date.now() - statSync(dir).mtimeMs
    } catch (statErr) {
      // ENOENT：鎖目錄在檢查 age 前已被清走（正常讓步）。其他 code 為 infra 故障，須浮出。
      if ((statErr as NodeJS.ErrnoException).code !== 'ENOENT') throw statErr
      return false
    }
    if (age <= staleMs) return false

    // rename 為原子操作：同一路徑只有一個 process 能搶到，輸家直接讓步。
    const stolen = `${dir}.stale-${process.pid}-${Date.now()}`
    try {
      renameSync(dir, stolen)
    } catch (renameErr) {
      // ENOENT：競爭者已搶先 rename 走，正常讓步。其他 code（EPERM/EBUSY 等）為 infra 故障，須浮出。
      if ((renameErr as NodeJS.ErrnoException).code !== 'ENOENT') throw renameErr
      return false
    }
    rmSync(stolen, { recursive: true, force: true })
    try {
      mkdirSync(dir, { recursive: false })
    } catch (mkdirErr) {
      // EEXIST：rename 贏家仍可能撞上第三方剛建立的新鎖，讓步。其他 code 為 infra 故障，須浮出。
      if ((mkdirErr as NodeJS.ErrnoException).code !== 'EEXIST') throw mkdirErr
      return false
    }
    return true
  }
}

export function releaseLock(dir: string): void {
  rmSync(dir, { recursive: true, force: true })
}
