import { cmdDaemon } from './daemon.js'
import { cmdNotifyTest } from './notify-test.js'
import { cmdRunOnce } from './run-once.js'
import { cmdStatus } from './status.js'
import { cmdSupervise, type GuardianMode } from './supervise.js'

export interface ParsedArgv { command: string; configPath?: string; configsDir?: string; guardianMode?: string }

export function parseArgv(argv: string[]): ParsedArgv {
  const command = argv[0] ?? ''
  let configPath: string | undefined
  let configsDir: string | undefined
  let guardianMode: string | undefined
  for (let i = 1; i < argv.length; i++) {
    if (argv[i] === '--config') {
      configPath = argv[i + 1]
      i++
    } else if (argv[i] === '--configs-dir') {
      configsDir = argv[i + 1]
      i++
    } else if (argv[i] === '--guardian') {
      guardianMode = argv[i + 1] ?? ''
      i++
    }
  }
  return { command, configPath, configsDir, ...(guardianMode === undefined ? {} : { guardianMode }) }
}

export async function runCli(argv: string[], cliPath: string): Promise<void> {
  const { command, configPath, configsDir, guardianMode } = parseArgv(argv)

  if (command === 'supervise') {
    const validGuardianMode = guardianMode === undefined || ['inline', 'off', 'only'].includes(guardianMode)
    if ((!configPath && !configsDir) || (configPath && configsDir) || !validGuardianMode || (guardianMode === 'only' && !configsDir)) {
      console.error('用法：adng supervise (--config <path> | --configs-dir <dir>)')
      process.exitCode = 1
      return
    }
    await cmdSupervise(cliPath, configPath, configsDir, (guardianMode ?? 'inline') as GuardianMode)
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
