import { mkdirSync, rmSync, statSync, renameSync } from 'node:fs'

/** Windows 無 flock：mkdir 是唯一可靠的原子互斥（舊系統實證）。 */
export function acquireLock(dir: string, staleMs = 30 * 60 * 1000): boolean {
  try {
    mkdirSync(dir, { recursive: false })
    return true
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err
    try {
      const age = Date.now() - statSync(dir).mtimeMs
      if (age > staleMs) {
        // rename 為原子操作：同一路徑只有一個 process 能搶到，輸家直接讓步。
        const stolen = `${dir}.stale-${process.pid}-${Date.now()}`
        try {
          renameSync(dir, stolen)
        } catch {
          return false
        }
        rmSync(stolen, { recursive: true, force: true })
        try {
          mkdirSync(dir, { recursive: false })
        } catch {
          // rename 贏家仍可能撞上第三方剛建立的新鎖，讓步而非 throw。
          return false
        }
        return true
      }
    } catch { /* 競態下讓步 */ }
    return false
  }
}

export function releaseLock(dir: string): void {
  rmSync(dir, { recursive: true, force: true })
}
