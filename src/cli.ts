import { fileURLToPath, pathToFileURL } from 'node:url'
import { cmdDaemon } from './cli/daemon.js'
import { cmdNotifyTest } from './cli/notify-test.js'
import { cmdRunOnce } from './cli/run-once.js'
import { cmdStatus } from './cli/status.js'
import { cmdSupervise } from './cli/supervise.js'

export { assemble } from './cli/assemble.js'
export { formatStatus, type BacklogCounts, type HeartbeatSnapshot, type StatusInput } from './cli/status.js'
export { runNotifyTest } from './cli/notify-test.js'
export { expandEnvValue, makeEngineRegistry } from './engines/registry.js'
export { finalizeRunOnceHeartbeat } from './scheduler.js'

export interface ParsedArgv { command: string; configPath?: string; configsDir?: string }

export function parseArgv(argv: string[]): ParsedArgv {
  const command = argv[0] ?? ''
  let configPath: string | undefined
  let configsDir: string | undefined
  for (let i = 1; i < argv.length; i++) {
    if (argv[i] === '--config') {
      configPath = argv[i + 1]
      i++
    } else if (argv[i] === '--configs-dir') {
      configsDir = argv[i + 1]
      i++
    }
  }
  return { command, configPath, configsDir }
}

async function main(): Promise<void> {
  const { command, configPath, configsDir } = parseArgv(process.argv.slice(2))

  if (command === 'supervise') {
    if ((!configPath && !configsDir) || (configPath && configsDir)) {
      console.error('用法：adng supervise (--config <path> | --configs-dir <dir>)')
      process.exitCode = 1
      return
    }
    cmdSupervise(fileURLToPath(import.meta.url), configPath, configsDir)
    return
  }

  if (!configPath) {
    console.error('用法：adng <status|run-once|daemon|notify-test> --config <path>，或 adng supervise --configs-dir <dir>')
    process.exitCode = 1
    return
  }

  switch (command) {
    case 'status':
      await cmdStatus(configPath)
      break
    case 'run-once':
      await cmdRunOnce(configPath)
      break
    case 'daemon':
      await cmdDaemon(configPath)
      break
    case 'notify-test':
      await cmdNotifyTest(configPath)
      break
    default:
      console.error(`未知子命令：${command}（可用：status | run-once | daemon | notify-test | supervise）`)
      process.exitCode = 1
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err))
    process.exitCode = 1
  })
}
