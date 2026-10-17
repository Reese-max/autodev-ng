import { describe, expect, test } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'

// Issue #38 的驗收紀錄格式是實機試行前必須先定死的合約：五組驗收鍵、狀態詞彙、
// 硬性停止條件與 verdict 規則若在各文件／工具間漂移，事後證據就無法機械比對。
// 這些測試把 docs/host-trial-acceptance.md 釘成唯一事實來源，並確認 runbook
// 指到的既有工具仍在原位（改路徑時測試先紅，而不是試行當天才發現）。
const DOC = resolve('docs/host-trial-acceptance.md')
const DEPLOY_DOC = resolve('docs/host-deployment.md')

const CRITERIA = [
  'boot-reconnect',
  'fault-injection',
  'backup-restore-rollback',
  'external-offline-alert',
  'trial-72h',
] as const
const STATUSES = ['NOT_RUN', 'PASS', 'FAIL', 'UNSUPPORTED'] as const
const VERDICTS = ['INCOMPLETE', 'HALTED'] as const
const HALT_KINDS = [
  'duplicate-writer',
  'unconfirmed-backend',
  'evidence-mismatch',
  'cost-breach',
  'scope-breach',
] as const
const TOOLS = [
  'scripts/host.mjs',
  'scripts/host-state.mjs',
  'scripts/check-host-heartbeat.mjs',
  'scripts/verify-host-release.mjs',
  'scripts/install-host-task.ps1',
] as const

function docText(): string {
  expect(existsSync(DOC), 'docs/host-trial-acceptance.md must exist').toBe(true)
  return readFileSync(DOC, 'utf8')
}

function recordTemplate(): Record<string, unknown> {
  const match = docText().match(/```json\s*\n([\s\S]*?)```/)
  if (!match?.[1]) throw new Error('doc must embed a ```json trial-record template')
  return JSON.parse(match[1])
}

function documentedHostCommand(action: string) {
  const command = [...docText().matchAll(/`(scripts\/host\.mjs\s+[^`]+)`/g)]
    .find(match => match[1]!.split(/\s+/)[1] === action && (action !== 'health' || match[1]!.includes('--out')))?.[1]
  if (!command) throw new Error(`missing documented host ${action} command`)
  const root = mkdtempSync(join(tmpdir(), 'adng-trial-command-')), home = join(root, 'host'), runtime = join(root, 'runtime'), out = join(root, 'health.json')
  mkdirSync(join(home, 'configs'), { recursive: true }); mkdirSync(join(runtime, 'dist/bot'), { recursive: true })
  writeFileSync(join(runtime, 'package.json'), '{"type":"module"}')
  writeFileSync(join(runtime, 'dist/cli.js'), 'console.log("adng fixture")')
  mkdirSync(join(runtime, 'dist/cli'))
  writeFileSync(join(runtime, 'dist/cli/assemble.js'), 'export const expandConfigPaths = () => ({})')
  writeFileSync(join(runtime, 'dist/bot/monitor.js'), `import { readFileSync } from 'node:fs'; export const loadMonitorConfig = file => JSON.parse(readFileSync(file, 'utf8')); export const readMonitor = () => ({ health: 'observed', errors: [], checkedAt: new Date().toISOString() })`)
  writeFileSync(join(home, 'host.json'), JSON.stringify({ version: 1, hostId: 'trial-fixture', runtime, commit: '0'.repeat(40) }))
  writeFileSync(join(home, 'configs/project.json'), JSON.stringify({ projectPath: home, dataDir: home, backlogFile: join(home, 'BACKLOG.md'), stopFile: join(home, '.stop'), defaultEngine: 'herdr', engines: { herdr: { adapter: 'herdr' } } }))
  writeFileSync(join(home, 'BACKLOG.md'), '')
  // Keep the documented --live path offline too; its Codex-only check is what this fixture observes.
  const script = `import cp from 'node:child_process'; import { syncBuiltinESMExports } from 'node:module'; const exec = cp.execFileSync; cp.execFileSync = (exe, ...args) => { if (exe === 'gh') throw new Error('offline fixture'); return exec(exe, ...args) }; syncBuiltinESMExports()`
  try {
    const args = command.split(/\s+/).slice(1).map(arg => arg === 'DIR' ? home : arg === 'FILE' ? out : arg)
    const result = spawnSync(process.execPath, ['--import', `data:text/javascript,${encodeURIComponent(script)}`, resolve('scripts/host.mjs'), ...args], { encoding: 'utf8', windowsHide: true, timeout: 10_000 })
    return { ...result, receipt: existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : undefined }
  } finally {
    if (!root.startsWith(join(tmpdir(), 'adng-trial-command-'))) throw new Error('unexpected fixture path')
    rmSync(root, { recursive: true, force: true })
  }
}

describe('host trial acceptance contract (issue #38)', () => {
  test('doc enumerates the five canonical criteria, status vocabulary and halt kinds', () => {
    const doc = docText()
    for (const key of [...CRITERIA, ...STATUSES, ...VERDICTS, ...HALT_KINDS]) {
      expect(doc, `missing contract token ${key}`).toContain(key)
    }
  })

  test('embedded record template parses and ships all criteria NOT_RUN with verdict INCOMPLETE', () => {
    const record = recordTemplate()
    expect(record.version).toBe(1)
    expect(record.verdict).toBe('INCOMPLETE')
    expect(record.windowHours).toBe(72)
    expect(Array.isArray(record.authorizedRepos)).toBe(true)
    expect(Array.isArray(record.hardFailures)).toBe(true)
    expect((record.hardFailures as unknown[]).length).toBe(0)
    const environment = record.environment as Record<string, unknown>
    for (const field of ['node', 'workerCli', 'herdr', 'launcher', 'configSha256']) {
      expect(environment, `environment.${field} missing`).toHaveProperty(field)
    }
    const criteria = record.criteria as Record<string, { status: string; evidence: unknown[] }>
    expect(Object.keys(criteria).sort()).toEqual([...CRITERIA].sort())
    for (const key of CRITERIA) {
      expect(criteria[key]?.status).toBe('NOT_RUN')
      expect(Array.isArray(criteria[key]?.evidence)).toBe(true)
    }
  })

  test('trial-72h metrics contract pins the issue hard conditions', () => {
    const criteria = recordTemplate().criteria as Record<string, { metrics?: { required: string[]; zero?: string[] } }>
    const metrics = criteria['trial-72h']?.metrics
    expect(metrics, 'trial-72h must declare a metrics contract').toBeTruthy()
    for (const field of ['observedStart', 'observedEnd', 'counts', 'unscheduledRescues', 'reposWithDeliverables', 'cost']) {
      expect(metrics!.required).toContain(field)
    }
    // 硬條件：零未授權寫入／費用切換、零重複 writer —— 任一不為 0 即不得 PASS
    expect(metrics!.zero?.sort()).toEqual(['costSwitches', 'duplicateWriters', 'unauthorizedWrites'].sort())
  })

  test('trial-72h requires the operating, fault, recovery and per-repo waiting measurements', () => {
    const criteria = recordTemplate().criteria as Record<string, { metrics: { required: string[] } }>
    expect(criteria['trial-72h']!.metrics.required).toEqual(expect.arrayContaining([
      'effectiveOperatingMs', 'scheduledFaults', 'recoveryDurationsMs', 'maxEligibleWaitMsByRepo',
    ]))
  })

  test('trial-72h declares a minimum elapsed observation window of 72 hours', () => {
    const record = recordTemplate(), criteria = record.criteria as Record<string, { metrics: { minimumElapsedHours?: number } }>
    expect(criteria['trial-72h']!.metrics.minimumElapsedHours).toBe(72)
    expect(criteria['trial-72h']!.metrics.minimumElapsedHours).toBe(record.windowHours)
  })

  test('documented external heartbeat command actually writes its receipt', () => {
    const result = documentedHostCommand('health')
    expect(result.status, result.stderr).toBe(0)
    expect(result.receipt).toMatchObject({ hostId: 'trial-fixture', ok: true })
  })

  test('documented Herdr doctor command does not require the Codex-only live probe', () => {
    const result = documentedHostCommand('doctor')
    expect(result.stdout, result.stderr).not.toBe('')
    const report = JSON.parse(result.stdout)
    expect(report.liveWorkerVerified).toBe(false)
    expect(report.checks).toContainEqual({ name: 'engine-configured', ok: true })
    expect(report.checks.map((check: { name: string }) => check.name)).not.toContain('worker-cli')
  })

  test('runbook only references tools that still exist at their documented paths', () => {
    const doc = docText()
    for (const tool of TOOLS) {
      expect(doc, `runbook must reference ${tool}`).toContain(tool)
      expect(existsSync(resolve(tool)), `${tool} moved or was removed`).toBe(true)
    }
    expect(readFileSync(DEPLOY_DOC, 'utf8')).toContain('host-trial-acceptance')
  })
})
