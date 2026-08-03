import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { appendPatrolAlert, outputZeroAlert, outputZeroAlertDays } from '../src/engines/output-zero-alert.js'
import { patrolAlertFile } from '../src/engines/patrol-alerts.js'

function patrolFixture(): { root: string; configsDir: string; alertFile: string; configPath: string } {
  const root = mkdtempSync(join(process.cwd(), '.tmp-adng-patrol-alerts-'))
  const configsDir = join(root, 'configs')
  return { root, configsDir, alertFile: patrolAlertFile(configsDir), configPath: join(configsDir, 'fleet.json') }
}

function zeroAlert(day: string) {
  return outputZeroAlert({
    fleet: 'fleet', mainRef: 'main', unmergedAdngBranches: 0,
    days: [{ day, commits: 0, attempts: 1 }],
  })!
}

function withPatrolFixture(run: (fixture: ReturnType<typeof patrolFixture>) => void): void {
  const fixture = patrolFixture()
  try { run(fixture) } finally { rmSync(fixture.root, { recursive: true, force: true }) }
}

describe('艦隊產出歸零告警', () => {
  test('連續 N 日零 commit 且有 attempts → 觸發，並列出未合併 adng 分支數', () => {
    const alert = outputZeroAlert({
      fleet: 'neciken', mainRef: 'main', unmergedAdngBranches: 4,
      days: [
        { day: '2026-07-30', commits: 0, attempts: 3 },
        { day: '2026-07-31', commits: 0, attempts: 2 },
      ],
    })
    expect(alert?.attempts).toBe(5)
    expect(alert?.message).toContain('未合併 adng/* 分支=4')
  })

  test('零 commit 但同期也零 attempts（艦停用）→ 不觸發', () => {
    expect(outputZeroAlert({
      fleet: 'idle', mainRef: 'main', unmergedAdngBranches: 0,
      days: [{ day: '2026-07-30', commits: 0, attempts: 0 }, { day: '2026-07-31', commits: 0, attempts: 0 }],
    })).toBeNull()
  })

  test('同期有主分支 commit → 不觸發', () => {
    expect(outputZeroAlert({
      fleet: 'productive', mainRef: 'main', unmergedAdngBranches: 2,
      days: [{ day: '2026-07-30', commits: 0, attempts: 4 }, { day: '2026-07-31', commits: 1, attempts: 1 }],
    })).toBeNull()
  })

  test('預設連續 2 日，可由 config 覆寫', () => {
    expect(outputZeroAlertDays({})).toBe(2)
    expect(outputZeroAlertDays({ outputZeroAlertDays: 3 })).toBe(3)
    expect(outputZeroAlertDays({ outputZeroAlertDays: 0 })).toBeNull()
  })

  test('新告警寫入 data/PATROL-ALERTS.md，而非專案根目錄', () => withPatrolFixture(({ root, alertFile, configPath }) => {
    expect(appendPatrolAlert(alertFile, configPath, zeroAlert('2026-08-01'))).toBe(true)
    expect(existsSync(alertFile)).toBe(true)
    expect(existsSync(join(root, 'PATROL-ALERTS.md'))).toBe(false)
  }))

  test('合併根目錄舊檔後移除舊檔，且既有去重標記仍生效', () => withPatrolFixture(({ root, alertFile, configPath }) => {
    const legacyFile = join(root, 'PATROL-ALERTS.md')
    const alert = zeroAlert('2026-08-01')
    const marker = `<!-- adng-output-zero:${encodeURIComponent(configPath)}:2026-08-01 -->`
    mkdirSync(join(root, 'data'))
    writeFileSync(alertFile, '# PATROL-ALERTS\n\n- data 既有升級\n')
    writeFileSync(legacyFile, `${marker}\n- output-zero 舊告警\n`)

    expect(appendPatrolAlert(alertFile, configPath, alert)).toBe(false)
    expect(existsSync(legacyFile)).toBe(false)
    const merged = readFileSync(alertFile, 'utf8')
    expect(merged).toContain('- data 既有升級')
    expect(merged).toContain('- output-zero 舊告警')
    expect(merged.split(marker)).toHaveLength(2)
  }))

  test('兩檔皆不存在時首寫自動建立 data 版並加入標題', () => withPatrolFixture(({ alertFile, configPath }) => {
    expect(appendPatrolAlert(alertFile, configPath, zeroAlert('2026-08-01'))).toBe(true)
    expect(readFileSync(alertFile, 'utf8')).toMatch(/^# PATROL-ALERTS\n\n/)
  }))
})
