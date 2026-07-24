import { basename, resolve } from 'node:path'
import { superviseConfig, superviseDirectory, type SuperviseDirectoryResult } from '../supervisor/supervise.js'

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

export function cmdSupervise(cliPath: string, configPath?: string, configsDir?: string): void {
  const options = { cliPath }
  if (configsDir) {
    return printSuperviseResults(superviseDirectory(configsDir, options))
  }
  try {
    printSuperviseResults([superviseConfig(configPath!, options)])
  } catch (err) {
    printSuperviseResults([{ configPath: resolve(configPath!), error: err instanceof Error ? err.message : String(err) }])
  }
}
