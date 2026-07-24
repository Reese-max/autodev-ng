import { cmdDaemon } from './daemon.js'
import { cmdNotifyTest } from './notify-test.js'
import { cmdRunOnce } from './run-once.js'
import { cmdStatus } from './status.js'
import { cmdSupervise } from './supervise.js'

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

export async function runCli(argv: string[], cliPath: string): Promise<void> {
  const { command, configPath, configsDir } = parseArgv(argv)

  if (command === 'supervise') {
    if ((!configPath && !configsDir) || (configPath && configsDir)) {
      console.error('用法：adng supervise (--config <path> | --configs-dir <dir>)')
      process.exitCode = 1
      return
    }
    cmdSupervise(cliPath, configPath, configsDir)
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
