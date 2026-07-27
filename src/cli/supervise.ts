import { basename, resolve } from 'node:path'
import { runFleetGuardian, type GuardianReport } from '../guardian/fleet.js'
import { superviseConfig, superviseDirectory, type SuperviseDirectoryResult } from '../supervisor/supervise.js'
import { assemble } from './assemble.js'

export type GuardianMode = 'inline' | 'off' | 'only'

export function printSuperviseResults(results: SuperviseDirectoryResult[]): void {
  if (results.length === 0) return console.log('supervise：找不到 config，未執行任何動作')
  for (const result of results) {
    const name = basename(result.configPath, '.json')
    if ('error' in result) {
      console.error(`supervise ${name}: error=${result.error}`)
      process.exitCode = 1
      continue
    }
    const launched = result.launchedPid === undefined ? '' : ` launchedPid=${result.launchedPid}`
    console.log(`supervise ${name}: ${result.action} pid=${result.pid ?? '-'} heartbeatAgeMs=${result.heartbeatAgeMs ?? '-'} childCount=${result.childCount}${launched}`)
    result.probeErrors.forEach(error => console.error(`supervise ${name}: 探測降級（${error}）`))
  }
}

function printGuardianReports(reports: GuardianReport[]): void {
  for (const report of reports) {
    const name = basename(report.configPath, '.json')
    if (report.kind === 'completed') {
      console.log(`guardian ${name}: ${report.decision.status} ${report.decision.summary}`)
    } else if (report.kind === 'failed') {
      console.error(`guardian ${name}: error=${report.error}`)
      process.exitCode = 1
    } else if (report.reason === 'locked') {
      console.log('guardian：已有巡檢執行中，本輪略過')
      break
    }
  }
}

async function sendGuardianNotification(configPath: string, text: string): Promise<boolean> {
  try {
    const assembled = assemble(configPath)
    try { return await assembled.notifier.send(text) } finally { assembled.deps.db.close() }
  } catch { return false }
}

export async function cmdSupervise(
  cliPath: string, configPath?: string, configsDir?: string, guardianMode: GuardianMode = 'inline',
): Promise<void> {
  const options = { cliPath }
  if (configsDir) {
    const results = superviseDirectory(configsDir, options)
    printSuperviseResults(results)
    if (guardianMode === 'off') return
    printGuardianReports(await runFleetGuardian(results, {
      cliPath,
      fleetDataDir: resolve(configsDir, '..', 'data', 'guardian'),
      notifyFn: sendGuardianNotification,
    }))
    return
  }
  try {
    printSuperviseResults([superviseConfig(configPath!, options)])
  } catch (err) {
    printSuperviseResults([{ configPath: resolve(configPath!), error: err instanceof Error ? err.message : String(err) }])
  }
}
