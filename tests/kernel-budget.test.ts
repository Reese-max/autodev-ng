import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// spec docs/specs/2026-07-05-phase1-kernel-spec.md 的 kernel 行數守門（原訂 CI 守門補建）。
// 界限：工作上限 ≤2700（緩衝 200，2026-07-12 拍板）；硬牆 <3000（驗屍第一原則，不可逾越）。
const KERNEL_WORKING_CAP = 2700
const KERNEL_HARD_WALL = 3000

// 對齊 `wc -l src/*.ts`：只算 src/ 頂層 .ts 檔（不進 src/bot、src/engines 等子目錄——
// 那些是插件、有自己的子預算、不計 kernel 帳），行數＝換行字元數（split('\n').length-1）。
function kernelLineCount(): { total: number; perFile: Record<string, number> } {
  const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')
  const perFile: Record<string, number> = {}
  let total = 0
  for (const name of readdirSync(srcDir)) {
    if (!name.endsWith('.ts')) continue
    const full = join(srcDir, name)
    if (!statSync(full).isFile()) continue
    const lines = readFileSync(full, 'utf8').split('\n').length - 1
    perFile[name] = lines
    total += lines
  }
  return { total, perFile }
}

describe('kernel 行數預算守門', () => {
  it('kernel 頂層行數 ≤ 工作上限 2700', () => {
    const { total, perFile } = kernelLineCount()
    if (total > KERNEL_WORKING_CAP) {
      const breakdown = Object.entries(perFile)
        .sort((a, b) => b[1] - a[1])
        .map(([f, n]) => `  ${String(n).padStart(4)}  ${f}`)
        .join('\n')
      const wall = total >= KERNEL_HARD_WALL ? `（且已達硬牆 ${KERNEL_HARD_WALL}——絕不可合併）` : ''
      throw new Error(
        `kernel ${total} 行 > 工作上限 ${KERNEL_WORKING_CAP}${wall}。\n` +
        `依 spec 護欄：先精簡本次改動，或把邏輯外移到子目錄（src/bot/、src/engines/、src/autopilot/ 等，不計 kernel 帳）；` +
        `2700→${KERNEL_HARD_WALL} 之間只准外移/重構，不准再加緩衝。\n各檔行數：\n${breakdown}`
      )
    }
    expect(total).toBeLessThanOrEqual(KERNEL_WORKING_CAP)
  })

  it('計數與 wc -l 一致且非平凡（防守門空轉）', () => {
    const { total } = kernelLineCount()
    // 現況約 2500；若計數邏輯壞掉回 0 或極小值，守門會變成永遠通過的假測試，故下限自檢。
    expect(total).toBeGreaterThan(2000)
    expect(total).toBeLessThan(KERNEL_HARD_WALL)
  })
})
