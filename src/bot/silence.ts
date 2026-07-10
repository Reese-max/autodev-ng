import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

interface SilenceState {
  untilIso: string
}

function silenceFilePath(dataDir: string): string {
  return join(dataDir, 'silence.json')
}

/** 設定靜音窗：untilIso = now + minutes 分鐘，寫入 `${dataDir}/silence.json`。
 * tmp+rename 原子寫入（鏡像 src/learn/store.ts）。回傳 untilIso。 */
export function setSilence(dataDir: string, minutes: number, now?: Date): string {
  const until = new Date((now ?? new Date()).getTime() + minutes * 60_000)
  const untilIso = until.toISOString()
  const file = silenceFilePath(dataDir)

  mkdirSync(dirname(file), { recursive: true })
  const tmp = `${file}.tmp`
  writeFileSync(tmp, JSON.stringify({ untilIso } satisfies SilenceState), 'utf8')
  renameSync(tmp, file)

  return untilIso
}

/** 解除靜音窗：刪 silence.json。缺檔不炸。 */
export function clearSilence(dataDir: string): void {
  const file = silenceFilePath(dataDir)
  try {
    if (existsSync(file)) unlinkSync(file)
  } catch {
    // 刪除故障：視同已解除，不炸（fail-open）
  }
}

/** 是否仍在靜音窗內。檔缺/損壞/內容非法/已過期一律 false
 * （fail-open：故障方向永遠是「照發告警」而非「誤壓不發」，同冷卻表 §鐵律 4）。 */
export function isSilenced(dataDir: string, now?: Date): boolean {
  try {
    const raw: unknown = JSON.parse(readFileSync(silenceFilePath(dataDir), 'utf8'))
    if (typeof raw !== 'object' || raw === null) return false

    const untilIso = (raw as SilenceState).untilIso
    if (typeof untilIso !== 'string') return false

    const untilMs = new Date(untilIso).getTime()
    if (Number.isNaN(untilMs)) return false

    return untilMs > (now ?? new Date()).getTime()
  } catch {
    return false
  }
}
