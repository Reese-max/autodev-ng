import { mkdirSync, rmSync, statSync } from 'node:fs'

/** Windows 無 flock：mkdir 是唯一可靠的原子互斥（舊系統實證）。 */
export function acquireLock(dir: string, staleMs = 30 * 60 * 1000): boolean {
  try {
    mkdirSync(dir, { recursive: false })
    return true
  } catch {
    try {
      const age = Date.now() - statSync(dir).mtimeMs
      if (age > staleMs) {
        rmSync(dir, { recursive: true, force: true })
        mkdirSync(dir, { recursive: false })
        return true
      }
    } catch { /* 競態下讓步 */ }
    return false
  }
}

export function releaseLock(dir: string): void {
  rmSync(dir, { recursive: true, force: true })
}
