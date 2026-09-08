import { cmdDaemon } from './daemon.js'
import { cmdNotifyTest } from './notify-test.js'
import { cmdRunOnce } from './run-once.js'
import { cmdStatus } from './status.js'
import { cmdSupervise, type GuardianMode } from './supervise.js'

export interface ParsedArgv { command: string; configPath?: string; configsDir?: string; guardianMode?: string }

export const CLI_HELP = [
  'adng：本機優先的代理協調 CLI',
  '',
  '用法：',
  '  adng --help',
  '  Create: adng task add --config <path> --text "task and acceptance"',
  '  adng task list --config <path>',
  '  adng github resume --config <path> --issue N --reason TEXT',
  '  adng status --config <path>       唯讀狀態、成本、backlog 與 DLQ',
  '  adng run-once --config <path>     執行一輪後退出',
  '  adng daemon --config <path>       前景常駐主迴圈',
  '  adng notify-test --config <path>  測試 Discord 告警通道',
  '  adng supervise --configs-dir <dir>  管理多專案 daemon',
  '  adng github --help                GitHub Issue intake/status/owner 操作',
  '',
  '安全起步（使用 synthetic/mock 專案，不會呼叫 provider）：',
  '  config.json：',
  '  { "projectPath": "./project", "backlogFile": "./project/BACKLOG.md",',
  '    "dataDir": "./data", "engine": "mock" }',
  '  node -e "const fs=require(\'node:fs\'); fs.mkdirSync(\'project\',{recursive:true}); fs.writeFileSync(\'project/BACKLOG.md\',\'\')"',
  '  git -C project init -q',
  '  git -C project add BACKLOG.md',
  '  git -C project -c user.name=synthetic -c user.email=synthetic@example.invalid commit -qm "synthetic empty backlog"',
  '  node dist/cli.js status --config config.json       # 預期 exit 0',
  '  node dist/cli.js run-once --config config.json     # 預期 CycleResult: idle、exit 0',
  '  # status/run-once 只建立本機 data；mock 不呼叫 provider 或通知',
  '',
  '憑證：judgeApiKey、telegramBotToken 請使用 {env:VAR} 或 {file:PATH}，不要把值寫入 JSON。',
  '限額／復原：dailyHardUsd 預設 100；建立 stopFile（預設 .adng.stop）可暫停，移除後恢復。',
  'daemon、supervise 與 notify-test 會讀取 config；--help 不讀取 config、不啟動 daemon、不發送通知。',
].join('\n')

export function printCliHelp(): void {
  console.log(CLI_HELP)
}

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
  if (argv[0] !== 'github' && (argv.includes('--help') || (argv.length === 1 && ['-h', 'help'].includes(argv[0]!)))) { process.exitCode = 0; printCliHelp(); return }
  if (argv[0] === 'task') { await (await import('./tasks.js')).taskCli(argv.slice(1)); return }
  if (argv[0] === 'github') {
    const { githubCli } = await import('../github/cli.js')
    await githubCli(argv.slice(1))
    return
  }
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
