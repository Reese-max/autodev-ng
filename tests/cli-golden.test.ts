/**
 * CLI golden 純函式單元測試 + 公開子指令搬移前後快照矩陣。
 *
 * 涵蓋：正常流程、錯誤參數、--help、--version、子指令失敗；
 * 逐位元比對 stdout / stderr / exitCode。
 * daemon 正常長駐路徑不測（禁動 daemon 進程）；只鎖用法／設定失敗出口。
 */
import { afterEach, describe, expect, test, vi } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { CLI_HELP, runCli } from '../src/cli/entry.js'
import { GITHUB_HELP, GITHUB_MODES } from '../src/github/cli.js'
import {
  PUBLIC_CLI_COMMANDS,
  assertCliCapturesEqual,
  bytesEqual,
  diffCliCaptures,
  isPublicCliCommand,
  joinCapturedLines,
  parseCliCapture,
  serializeCliCapture,
  stabilizeCliCapture,
  toCliCapture,
  type CliGoldenCapture,
  type PublicCliCommand,
} from '../src/cli/golden.js'

const FIXED_NOTIFY_ISO = '2026-07-24T00:00:00.000Z'

/** 由搬移前 80825e5^ 的 src/cli.ts 以相同輸入擷取。 */
function beforeRelocationGoldens(missingConfig: string): Record<PublicCliCommand, CliGoldenCapture> {
  return {
    status: { stdout: 'daemon 未跑過\n', stderr: '', exitCode: 0 },
    'run-once': { stdout: 'CycleResult: idle\n', stderr: '', exitCode: 0 },
    daemon: { stdout: '', stderr: `設定檔不存在: ${missingConfig}\n`, exitCode: 1 },
    'notify-test': {
      stdout: `送達失敗（已寫入 DLQ，detail 見 dataDir/notify-dlq.jsonl）：adng 通道測試 ${FIXED_NOTIFY_ISO}\n`,
      stderr: '',
      exitCode: 1,
    },
    supervise: { stdout: 'supervise：找不到 config，未執行任何動作\n', stderr: '', exitCode: 0 },
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  process.exitCode = undefined
})

async function captureCli(argv: string[]): Promise<CliGoldenCapture> {
  const stdout: string[] = []
  const stderr: string[] = []
  const log = vi.spyOn(console, 'log').mockImplementation((...args) => {
    stdout.push(args.map(String).join(' '))
  })
  const error = vi.spyOn(console, 'error').mockImplementation((...args) => {
    stderr.push(args.map(String).join(' '))
  })
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
  return toCliCapture(stdout, stderr, process.exitCode ?? 0)
}

function writeMockConfig(dir: string): string {
  const project = join(dir, 'project')
  mkdirSync(project, { recursive: true })
  writeFileSync(join(project, 'BACKLOG.md'), '')
  const cfgPath = join(dir, 'config.json')
  writeFileSync(cfgPath, JSON.stringify({
    projectPath: './project',
    backlogFile: './project/BACKLOG.md',
    dataDir: './data',
    engine: 'mock',
  }))
  return cfgPath
}

describe('cli golden 純函式', () => {
  test('PUBLIC_CLI_COMMANDS 涵蓋五個公開子指令且 isPublicCliCommand 邊界正確', () => {
    expect([...PUBLIC_CLI_COMMANDS]).toEqual([
      'status', 'run-once', 'daemon', 'notify-test', 'supervise',
    ])
    expect(isPublicCliCommand('status')).toBe(true)
    expect(isPublicCliCommand('unknown')).toBe(false)
    expect(isPublicCliCommand('--help')).toBe(false)
  })

  test('bytesEqual / joinCapturedLines / toCliCapture 合成與逐位元相等', () => {
    expect(bytesEqual('中文✓', '中文✓')).toBe(true)
    expect(bytesEqual('a', 'b')).toBe(false)
    expect(joinCapturedLines(['a', 'b'])).toBe('a\nb\n')
    expect(toCliCapture(['out'], ['err'], 1)).toEqual({
      stdout: 'out\n', stderr: 'err\n', exitCode: 1,
    })
  })

  test('diffCliCaptures：三欄全同 → equal；stdout/stderr/exitCode 各自能指出欄位', () => {
    const base: CliGoldenCapture = { stdout: 'ok', stderr: '', exitCode: 0 }
    expect(diffCliCaptures(base, base).equal).toBe(true)
    expect(diffCliCaptures({ ...base, stdout: 'x' }, base).field).toBe('stdout')
    expect(diffCliCaptures({ ...base, stderr: 'e' }, base).field).toBe('stderr')
    expect(diffCliCaptures({ ...base, exitCode: 2 }, base).field).toBe('exitCode')
  })

  test('assertCliCapturesEqual：相符不丟；不符訊息含 field', () => {
    const a: CliGoldenCapture = { stdout: 'a', stderr: '', exitCode: 0 }
    expect(() => assertCliCapturesEqual(a, a)).not.toThrow()
    expect(() => assertCliCapturesEqual({ ...a, stdout: 'b' }, a)).toThrow(/field=stdout/)
  })

  test('stabilizeCliCapture：ISO 與路徑根替換後可重跑比對', () => {
    const root = 'D:\\tmp\\proj'
    const raw: CliGoldenCapture = {
      stdout: `adng 通道測試 2026-07-24T01:02:03.456Z path=${root}\\data`,
      stderr: `設定檔不存在: ${root.replace(/\\/g, '/')}/missing.json`,
      exitCode: 1,
    }
    const stable = stabilizeCliCapture(raw, [root, root.replace(/\\/g, '/')])
    expect(stable.stdout).toBe('adng 通道測試 <ISO> path=<ROOT>\\data')
    expect(stable.stderr).toContain('<ROOT>')
    expect(stable.stderr).not.toContain('2026-07-24')
    assertCliCapturesEqual(stable, {
      stdout: 'adng 通道測試 <ISO> path=<ROOT>\\data',
      stderr: stable.stderr,
      exitCode: 1,
    })
  })

  test('serializeCliCapture / parseCliCapture 往返且鍵序固定', () => {
    const c: CliGoldenCapture = { stdout: 'x\ny', stderr: 'e', exitCode: 1 }
    const raw = serializeCliCapture(c)
    expect(raw.startsWith('{\n  "exitCode"')).toBe(true)
    expect(parseCliCapture(raw)).toEqual(c)
    expect(() => parseCliCapture('{"stdout":1,"stderr":"","exitCode":0}')).toThrow()
  })
})

describe('CLI 公開子指令 golden 快照矩陣（搬移後行為鎖定）', () => {
  const USAGE =
    '用法：adng <status|run-once|daemon|notify-test> --config <path>，或 adng supervise --configs-dir <dir>'
  const SUPERVISE_USAGE = '用法：adng supervise (--config <path> | --configs-dir <dir>)'

  test('全域 help 顯示任務建立、執行及恢復指引並成功退出（逐位元）', async () => {
    const expected: CliGoldenCapture = {
      stdout: CLI_HELP + '\n', stderr: '', exitCode: 0,
    }
    for (const command of ['--help', '-h', 'help']) {
      assertCliCapturesEqual(await captureCli([command]), expected)
    }
  })

  test('全域：空 argv、--version 與各子指令缺 --config 的用法錯誤（逐位元）', async () => {
    const cases: Array<{ name: string; argv: string[] }> = [
      { name: 'empty', argv: [] },
      { name: '--version', argv: ['--version'] },
      { name: 'version', argv: ['version'] },
      { name: 'status', argv: ['status'] },
      { name: 'run-once', argv: ['run-once'] },
      { name: 'daemon', argv: ['daemon'] },
      { name: 'notify-test', argv: ['notify-test'] },
      { name: 'status --version', argv: ['status', '--version'] },
      { name: 'daemon --version', argv: ['daemon', '--version'] },
    ]

    const expected: CliGoldenCapture = { stdout: '', stderr: `${USAGE}\n`, exitCode: 1 }

    for (const c of cases) {
      const actual = await captureCli(c.argv)
      try {
        assertCliCapturesEqual(actual, expected)
      } catch (err) {
        throw new Error(`[${c.name}] ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  })

  test('--help：全域與子指令 help 都不讀 config，成功輸出起步契約', async () => {
    const expected: CliGoldenCapture = { stdout: `${CLI_HELP}\n`, stderr: '', exitCode: 0 }
    for (const argv of [
      ['--help'],
      ['status', '--help'],
      ['run-once', '--help'],
      ['supervise', '--help'],
      ['unknown', '--help', '--config', 'missing.json'],
    ]) {
      assertCliCapturesEqual(await captureCli(argv), expected)
    }
    const githubExpected: CliGoldenCapture = { stdout: `${GITHUB_HELP}\n`, stderr: '', exitCode: 0 }
    for (const mode of [undefined, ...GITHUB_MODES]) {
      const argv = mode === undefined ? ['github', '--help'] : ['github', mode, '--config', '--help']
      assertCliCapturesEqual(await captureCli(argv), githubExpected)
    }
    for (const mode of GITHUB_MODES) expect(GITHUB_HELP).toContain(mode)
    const reports = JSON.parse(readFileSync(join(process.cwd(), 'configs/integrations/github-reports.json'), 'utf8'))
    for (const probe of reports.projects.find((p: { repo: string }) => p.repo === 'Reese-max/autodev-ng').probes.filter((p: { id: string }) => p.id === 'cli-guide')) expect(CLI_HELP).toContain(probe.expectedText)
  })

  test('supervise：缺參數與雙參數互斥用法錯誤（逐位元）', async () => {
    const expected: CliGoldenCapture = { stdout: '', stderr: `${SUPERVISE_USAGE}\n`, exitCode: 1 }
    for (const argv of [
      ['supervise'],
      ['supervise', '--version'],
      ['supervise', '--config', 'a.json', '--configs-dir', 'configs'],
    ]) {
      assertCliCapturesEqual(await captureCli(argv), expected)
    }
  })

  test('未知子命令（含 --help/--version 當 command 已有 --config）失敗情境', async () => {
    const root = mkdtempSync(join(process.cwd(), '.tmp-adng-cli-gold-unk-'))
    try {
      const config = writeMockConfig(root)
      const expected = (cmd: string): CliGoldenCapture => ({
        stdout: '',
        stderr: `未知子命令：${cmd}（可用：status | run-once | daemon | notify-test | supervise）\n`,
        exitCode: 1,
      })
      for (const cmd of ['unknown', '--version', 'help', 'version', 'foo']) {
        assertCliCapturesEqual(
          await captureCli([cmd, '--config', config]),
          expected(cmd),
        )
      }
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('五個公開子指令：搬移前 golden 與搬移後 stdout/stderr/exit code 逐位元一致', async () => {
    const root = mkdtempSync(join(process.cwd(), '.tmp-adng-cli-gold-ok-'))
    const configsDir = join(root, 'configs')
    mkdirSync(configsDir)
    try {
      const config = writeMockConfig(root)
      const missing = join(root, 'missing.json')
      vi.useFakeTimers()
      let notify: CliGoldenCapture
      try {
        vi.setSystemTime(new Date(FIXED_NOTIFY_ISO))
        notify = await captureCli(['notify-test', '--config', config])
      } finally {
        vi.useRealTimers()
      }
      const matrix: Record<PublicCliCommand, CliGoldenCapture> = {
        status: await captureCli(['status', '--config', config]),
        'run-once': await captureCli(['run-once', '--config', config]),
        daemon: await captureCli(['daemon', '--config', missing]),
        'notify-test': notify,
        supervise: await captureCli(['supervise', '--configs-dir', configsDir]),
      }
      const before = beforeRelocationGoldens(resolve(missing))
      for (const command of PUBLIC_CLI_COMMANDS) {
        assertCliCapturesEqual(matrix[command], before[command])
      }
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('子指令失敗：設定檔不存在 / JSON 壞掉 / 缺欄位（路徑穩定化後逐位元）', async () => {
    const root = mkdtempSync(join(process.cwd(), '.tmp-adng-cli-gold-fail-'))
    try {
      const missing = join(root, 'no-such.json')
      const badJson = join(root, 'bad.json')
      writeFileSync(badJson, '{not-json')
      const badSchema = join(root, 'schema.json')
      writeFileSync(badSchema, JSON.stringify({ projectPath: './p' }))

      const absMissing = resolve(missing)
      const absBadJson = resolve(badJson)
      const absSchema = resolve(badSchema)

      // 每個公開需 --config 的子指令，缺檔行為一致
      for (const cmd of ['status', 'run-once', 'daemon', 'notify-test'] as const) {
        const actual = stabilizeCliCapture(
          await captureCli([cmd, '--config', missing]),
          [absMissing, root],
        )
        assertCliCapturesEqual(actual, {
          stdout: '',
          stderr: '設定檔不存在: <ROOT>\n',
          exitCode: 1,
        })
      }

      const jsonFail = stabilizeCliCapture(
        await captureCli(['status', '--config', badJson]),
        [absBadJson, root],
      )
      expect(jsonFail.exitCode).toBe(1)
      expect(jsonFail.stdout).toBe('')
      expect(jsonFail.stderr.startsWith('設定檔 JSON 格式錯誤: <ROOT>')).toBe(true)
      // 與自身 round-trip 仍逐位元一致
      assertCliCapturesEqual(jsonFail, { ...jsonFail })

      const schemaFail = stabilizeCliCapture(
        await captureCli(['run-once', '--config', badSchema]),
        [absSchema, root],
      )
      expect(schemaFail.exitCode).toBe(1)
      expect(schemaFail.stdout).toBe('')
      expect(schemaFail.stderr.startsWith('設定檔欄位錯誤: <ROOT>')).toBe(true)
      expect(schemaFail.stderr).toMatch(/backlogFile|dataDir|engine/)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('supervise 單檔失敗：不存在的 config → stderr + exit 1（路徑穩定化）', async () => {
    const root = mkdtempSync(join(tmpdir(), 'adng-cli-gold-sup-'))
    const configsDir = join(root, 'configs')
    mkdirSync(configsDir)
    try {
      const missing = join(configsDir, 'ghost.json')
      const abs = resolve(missing)
      const actual = stabilizeCliCapture(
        await captureCli(['supervise', '--config', missing]),
        [abs, root],
      )
      expect(actual.exitCode).toBe(1)
      expect(actual.stdout).toBe('')
      // printSuperviseResults 格式：supervise <basename>: error=...
      expect(actual.stderr.startsWith('supervise ghost: error=')).toBe(true)
      assertCliCapturesEqual(actual, {
        stdout: '',
        stderr: actual.stderr,
        exitCode: 1,
      })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('status 有 heartbeat：完整 formatStatus 輸出逐位元（固定 fixture）', async () => {
    const root = mkdtempSync(join(process.cwd(), '.tmp-adng-cli-gold-hb-'))
    try {
      const config = writeMockConfig(root)
      const dataDir = join(root, 'data')
      mkdirSync(dataDir, { recursive: true })
      writeFileSync(join(dataDir, 'heartbeat.json'), JSON.stringify({
        ts: '2026-07-24T00:00:00.000Z',
        state: 'idle',
        todayCostUsd: 1.5,
      }))
      writeFileSync(join(dataDir, 'digest-stamp.json'), JSON.stringify({ lastSentDay: '2026-07-23' }))

      const actual = await captureCli(['status', '--config', config])
      const expectedStdout = [
        'adng status',
        'heartbeat：2026-07-24T00:00:00.000Z｜state=idle',
        '今日成本：$1.5000（軟頂 $40.00 / 硬頂 $100.00）',
        'backlog：open=0｜blocked=0｜superseded=0｜done=0',
        'DLQ 積壓：0 筆',
        '最後 digest 日期：2026-07-23',
      ].join('\n')
      assertCliCapturesEqual(actual, {
        stdout: `${expectedStdout}\n`,
        stderr: '',
        exitCode: 0,
      })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('錯誤參數：--config 缺值時 command 仍走缺 config 用法（不崩）', async () => {
    // parseArgv 把 --config 後一格當 path；若無下一格則 configPath=undefined
    assertCliCapturesEqual(await captureCli(['status', '--config']), {
      stdout: '',
      stderr: `${USAGE}\n`,
      exitCode: 1,
    })
  })
})
