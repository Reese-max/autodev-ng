import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'

const PATROL_ALERTS_FILE = 'PATROL-ALERTS.md'

export function patrolAlertFile(configsDir: string): string {
  return resolve(configsDir, '..', 'data', PATROL_ALERTS_FILE)
}

function legacyPatrolAlertFile(alertFile: string): string {
  return resolve(dirname(alertFile), '..', basename(alertFile))
}

/** 將舊根目錄告警一次性附加到正典 data 檔；附加失敗時保留舊檔。 */
export function migrateLegacyPatrolAlerts(alertFile: string): boolean {
  if (basename(alertFile) !== PATROL_ALERTS_FILE || basename(dirname(alertFile)) !== 'data') return false
  const legacyFile = legacyPatrolAlertFile(alertFile)
  if (!existsSync(legacyFile)) return false
  try {
    const legacy = readFileSync(legacyFile, 'utf8')
    const existing = existsSync(alertFile) ? readFileSync(alertFile, 'utf8') : ''
    mkdirSync(dirname(alertFile), { recursive: true })
    if (legacy !== '') {
      appendFileSync(alertFile, `${existing !== '' && !existing.endsWith('\n') ? '\n' : ''}${legacy}`, 'utf8')
    }
    rmSync(legacyFile)
    return true
  } catch {
    return false
  }
}
