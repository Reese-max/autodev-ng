import { afterEach, expect, test, vi } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ConfigSchema } from '../src/types.js'
import { formatMonitor, readMonitor } from '../src/bot/monitor.js'
import { runCli } from '../src/cli/entry.js'

const roots: string[] = []
afterEach(() => { vi.restoreAllMocks(); process.exitCode = undefined; for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'adng-operator-')); roots.push(root)
  const cfgPath = join(root, 'config.json')
  const cfg = ConfigSchema.parse({ projectPath: root, backlogFile: join(root, 'BACKLOG.md'), dataDir: join(root, 'data'), stopFile: join(root, 'control', '.stop'), engine: 'mock', judgeApiKey: '{env:ADNG_NONEXISTENT_OPERATOR_KEY}' })
  writeFileSync(cfgPath, JSON.stringify(cfg)); writeFileSync(cfg.backlogFile, '- [ ] 待處理\n')
  return { root, cfgPath, cfg }
}
async function cli(args: string[]) {
  const lines: string[] = []
  vi.spyOn(console, 'log').mockImplementation(v => { lines.push(String(v)) })
  vi.spyOn(console, 'error').mockImplementation(v => { lines.push(String(v)) })
  process.exitCode = undefined
  await runCli(args, 'cli.js')
  return { lines, code: process.exitCode ?? 0 }
}

test('monitor 無 heartbeat 仍顯示 backlog、未知成本；不建立 data 或解析 provider secret', async () => {
  const f = fixture()
  const r = await cli(['monitor', '--config', f.cfgPath, '--json', '--check'])
  expect(r.code).toBe(2)
  expect(JSON.parse(r.lines[0]!)).toMatchObject({ health: 'not-running', heartbeat: null, backlog: { open: 1 }, dlqCount: 0 })
  expect(existsSync(f.cfg.dataDir)).toBe(false)
  expect(formatMonitor(readMonitor(f.cfg, f.cfgPath))).toContain('心跳成本快照：未知')
})

test('PID 存活但 heartbeat 過期不可誤報正常；future/corrupt heartbeat 為未知', () => {
  const f = fixture(), now = Date.now()
  mkdirSync(join(f.cfg.dataDir, 'daemon.lock'), { recursive: true })
  writeFileSync(join(f.cfg.dataDir, 'daemon.lock/pid.json'), JSON.stringify({ pid: process.pid }))
  const heartbeat = join(f.cfg.dataDir, 'heartbeat.json')
  writeFileSync(heartbeat, JSON.stringify({ ts: new Date(now - f.cfg.staleThresholdMs - 1).toISOString(), state: 'running' }))
  expect(readMonitor(f.cfg, f.cfgPath, now)).toMatchObject({ health: 'stale', heartbeat: { stale: true }, process: { state: 'present', identityVerified: false } })
  for (const content of ['{broken', JSON.stringify({ ts: new Date(now + 120_000).toISOString(), state: 'running' })]) {
    writeFileSync(heartbeat, content)
    expect(readMonitor(f.cfg, f.cfgPath, now)).toMatchObject({ health: 'unknown', heartbeat: null })
  }
})

test('heartbeat 與 PID 都在時可觀測；probe 權限錯誤仍為未知', () => {
  const f = fixture()
  mkdirSync(join(f.cfg.dataDir, 'daemon.lock'), { recursive: true })
  writeFileSync(join(f.cfg.dataDir, 'daemon.lock/pid.json'), JSON.stringify({ pid: process.pid }))
  writeFileSync(join(f.cfg.dataDir, 'heartbeat.json'), JSON.stringify({ ts: new Date().toISOString(), state: 'idle', todayCostUsd: 0 }))
  expect(readMonitor(f.cfg, f.cfgPath)).toMatchObject({ health: 'observed', heartbeat: { recordedCostUsd: 0 } })
  vi.spyOn(process, 'kill').mockImplementation(() => { throw Object.assign(new Error('denied'), { code: 'EPERM' }) })
  expect(readMonitor(f.cfg, f.cfgPath)).toMatchObject({ health: 'unknown', process: { state: 'unknown' } })
})

test('pause/resume 無 provider secret 可操作；保留原暫停理由與獨立車隊旗標', async () => {
  const f = fixture(), original = readFileSync(f.cfg.backlogFile, 'utf8')
  expect((await cli(['pause', '--config', f.cfgPath, '--json'])).code).toBe(0)
  writeFileSync(f.cfg.stopFile, 'existing user reason')
  await cli(['pause', '--config', f.cfgPath])
  expect(readFileSync(f.cfg.stopFile, 'utf8')).toBe('existing user reason')
  const fleetStop = join(f.root, '.adng.stop'); writeFileSync(fleetStop, 'fleet reason')
  const resumed = await cli(['resume', '--config', f.cfgPath, '--json'])
  expect(resumed.code).toBe(0)
  expect(JSON.parse(resumed.lines[0]!).text).toContain('車隊仍暫停')
  expect(existsSync(f.cfg.stopFile)).toBe(false)
  expect(readFileSync(fleetStop, 'utf8')).toBe('fleet reason')
  expect(readFileSync(f.cfg.backlogFile, 'utf8')).toBe(original)
  expect(existsSync(f.cfg.dataDir)).toBe(false)
})

test('多專案遇壞設定仍列其餘專案；JSON 不外洩原文且錯誤退出碼優先', async () => {
  const f = fixture()
  writeFileSync(join(f.root, 'a-bad.json'), '{"secret":"DO_NOT_PRINT" broken')
  writeFileSync(join(f.root, 'ignored.example.json'), '{}')
  const r = await cli(['monitor', '--configs-dir', f.root, '--json', '--check'])
  expect(r.code).toBe(1)
  expect(JSON.parse(r.lines[0]!)).toHaveLength(2)
  expect(r.lines[0]).not.toContain('DO_NOT_PRINT')
  expect(r.lines[0]).toContain('not-running')
})

test('控制指令拒絕未知參數、批次目標和衝突目標，不變更旗標', async () => {
  const f = fixture()
  for (const args of [ ['--config', f.cfgPath, '--force'], ['--configs-dir', f.root], ['--config', f.cfgPath, '--configs-dir', f.root] ]) {
    await expect(cli(['pause', ...args])).rejects.toThrow()
    expect(existsSync(f.cfg.stopFile)).toBe(false)
  }
})

test('status --json 使用相同監控契約', async () => {
  const f = fixture()
  const r = await cli(['status', '--config', f.cfgPath, '--json'])
  expect(JSON.parse(r.lines[0]!)).toMatchObject({ project: 'config', health: 'not-running', backlog: { open: 1 } })
})
