import { afterEach, expect, test, vi } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as cli from '../src/cli.js'
import { parseArgv, runCli } from '../src/cli/entry.js'
import { formatCycleResult } from '../src/cli/run-once.js'
import { printSuperviseResults } from '../src/cli/supervise.js'

afterEach(() => {
  vi.restoreAllMocks()
  process.exitCode = undefined
})

async function captureCli(argv: string[]): Promise<{ stdout: string[]; stderr: string[]; exitCode: number }> {
  const stdout: string[] = []
  const stderr: string[] = []
  const log = vi.spyOn(console, 'log').mockImplementation((...args) => stdout.push(args.map(String).join(' ')))
  const error = vi.spyOn(console, 'error').mockImplementation((...args) => stderr.push(args.map(String).join(' ')))
  process.exitCode = undefined
  try {
    await runCli(argv, 'cli.js')
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err))
    process.exitCode = 1
  } finally {
    log.mockRestore()
    error.mockRestore()
  }
  return { stdout, stderr, exitCode: process.exitCode ?? 0 }
}

test('CLI 搬移回歸：代表性子指令維持搬移前的輸出快照與 exit code', async () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-cli-snapshot-'))
  const project = join(root, 'project')
  const config = join(root, 'config.json')
  const configsDir = join(root, 'configs')
  mkdirSync(project)
  mkdirSync(configsDir)
  writeFileSync(join(project, 'BACKLOG.md'), '')
  writeFileSync(config, JSON.stringify({
    projectPath: './project', backlogFile: './project/BACKLOG.md', dataDir: './data', engine: 'mock',
  }))

  try {
    const actual = {
      status: await captureCli(['status', '--config', config]),
      'run-once': await captureCli(['run-once', '--config', config]),
      supervise: await captureCli(['supervise', '--configs-dir', configsDir]),
      unknown: await captureCli(['unknown', '--config', config]),
    }

    expect(actual).toEqual({
      status: { stdout: ['daemon 未跑過'], stderr: [], exitCode: 0 },
      'run-once': { stdout: ['CycleResult: idle'], stderr: [], exitCode: 0 },
      supervise: { stdout: ['supervise：找不到 config，未執行任何動作'], stderr: [], exitCode: 0 },
      unknown: {
        stdout: [],
        stderr: ['未知子命令：unknown（可用：status | run-once | daemon | notify-test | supervise）'],
        exitCode: 1,
      },
    })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('cli 公開匯出維持既有介面', () => {
  expect(Object.keys(cli).sort()).toEqual([
    'assemble', 'expandEnvValue', 'finalizeRunOnceHeartbeat', 'formatStatus',
    'makeEngineRegistry', 'parseArgv', 'runNotifyTest',
  ])
})

test('CLI entry 可獨立載入並保留 argv 解析契約', () => {
  expect(parseArgv(['supervise', '--configs-dir', 'configs'])).toEqual({
    command: 'supervise', configPath: undefined, configsDir: 'configs',
  })
})

test('CLI entry：缺少 config 時只負責回報用法，不載入子指令執行', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  await runCli(['status'], 'cli.js')
  expect(error).toHaveBeenCalledExactlyOnceWith('用法：adng <status|run-once|daemon|notify-test> --config <path>，或 adng supervise --configs-dir <dir>')
  expect(process.exitCode).toBe(1)
})

test('formatCycleResult：字串結果原樣輸出，blocked 保留既有任務格式', () => {
  expect(formatCycleResult('done')).toBe('done')
  expect(formatCycleResult({ kind: 'blocked', taskId: 't1', taskText: '修 bug', reason: 'merge-conflict' }))
    .toBe('blocked（任務：修 bug）')
})

test('printSuperviseResults：空結果維持既有 stdout', () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
  printSuperviseResults([])
  expect(log).toHaveBeenCalledExactlyOnceWith('supervise：找不到 config，未執行任何動作')
  expect(process.exitCode).toBeUndefined()
})

test('printSuperviseResults：錯誤維持 stderr 並設定 exit code 1', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  printSuperviseResults([{ configPath: 'C:/configs/demo.json', error: 'boom' }])
  expect(error).toHaveBeenCalledExactlyOnceWith('supervise demo: error=boom')
  expect(process.exitCode).toBe(1)
})

test('supervise：fleet 暫停哨兵阻止直接 CLI 呼叫繞過 launcher guard', async () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-cli-paused-'))
  const configsDir = join(root, 'configs')
  mkdirSync(configsDir)
  writeFileSync(join(configsDir, '.adng.stop'), 'user pause\n')
  writeFileSync(join(configsDir, 'invalid.json'), '{}')

  try {
    for (const argv of [
      ['supervise', '--configs-dir', configsDir],
      ['supervise', '--config', join(configsDir, 'invalid.json')],
    ]) {
      expect(await captureCli(argv)).toEqual({
        stdout: ['supervise：fleet 已暫停（configs/.adng.stop），本輪未執行任何動作'],
        stderr: [],
        exitCode: 0,
      })
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('patrol loop：暫停期間略過 supervise 與 headless patrol', () => {
  const code = readFileSync(join(process.cwd(), 'scripts', 'patrol', 'patrol-loop.ps1'), 'utf8')
  const checks = [...code.matchAll(/Test-Path -LiteralPath \$stop/g)].map(match => match.index!)

  expect(checks).toHaveLength(2)
  expect(checks[0]).toBeLessThan(code.indexOf('supervise --configs-dir'))
  expect(checks[1]).toBeLessThan(code.indexOf("'run-patrol.ps1'"))
  expect(code).toMatch(/pause-gated-spawn\.mjs[^\n]+memory-sweep\.ps1/)
})

test('fleet 暫停仍保留 Discord bot 控制面，排程入口不得被全域哨兵擋掉', () => {
  const code = readFileSync(join(process.cwd(), 'scripts', 'adng-bot.cmd'), 'utf8')

  expect(code).not.toContain('configs\\.adng.stop')
  expect(code).toContain('dist\\bot\\index.js')
})

test('legacy patrol runner：使用既有 GPT Guardian 路由，不再呼叫 Claude CLI', () => {
  const code = readFileSync(join(process.cwd(), 'scripts', 'patrol', 'run-patrol.ps1'), 'utf8')

  expect(code).toMatch(/\$prompt \| & node \$gateRunner \$stop[^\n]+\$codexJs exec --model gpt-5\.6-luna/)
  expect(code).toContain("model_reasoning_effort=max")
  expect(code).toContain('default_permissions="workspace-only"')
  expect(code).toContain('permissions.workspace-only.filesystem.:tmpdir="deny"')
  expect(code).toContain('--enable code_mode --enable code_mode_host')
  expect(code).toContain('--strict-config')
  expect(code).toContain("$env:CODEX_HOME = Join-Path $root 'data\\autodev-self\\codex-home'")
  expect(code).toContain("Remove-Item -LiteralPath 'Env:CODEX_THREAD_ID'")
  expect(code).toContain('Get-ChildItem Env:')
  expect(code).toContain("$gateRunner = Join-Path $root 'scripts\\pause-gated-spawn.mjs'")
  expect(code).toContain("$codexJs = Join-Path $env:APPDATA 'npm\\node_modules\\@openai\\codex\\bin\\codex.js'")
  expect(code).toMatch(/\$gateRunner \$stop '--output' \$log/)
  expect(code).not.toMatch(/New-Item[^\n]+\$logDir|\*> \$log|Out-File[^\n]+\$log/)
  expect(code).not.toMatch(/\bclaude\b|dangerously-skip-permissions|dangerously-bypass-approvals-and-sandbox/i)
})
