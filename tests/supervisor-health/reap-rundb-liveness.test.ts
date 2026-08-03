import Database from 'better-sqlite3'
import { expect, test } from 'vitest'
import { mkdirSync, mkdtempSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { superviseConfig, type CommandRunner } from '../../src/supervisor/supervise.js'
import { ConfigSchema } from '../../src/types.js'

// §1.1 長輪陷阱雙證閘（2026-08-03）：僅憑心跳凍結 reap 會誤殺健康長輪 daemon
//（2026-08-02 note-filler、2026-08-03 prompt-autoresearch 兩度實證）。
// reap 前必讀 run.db：attempt 完成於凍結後＝活著；子進程在且凍結未逾寬限＝長輪進行中。

function setup(root: string, over: Record<string, unknown> = {}): { configPath: string; dataDir: string } {
  const configPath = join(root, 'p.json')
  const dataDir = join(root, 'p.data')
  writeFileSync(configPath, JSON.stringify({
    projectPath: './project', backlogFile: './BACKLOG.md', dataDir: './p.data', engine: 'mock', ...over,
  }))
  mkdirSync(join(dataDir, 'daemon.lock'), { recursive: true })
  writeFileSync(join(dataDir, 'daemon.lock', 'pid.json'), JSON.stringify({ pid: 4321 }))
  return { configPath, dataDir }
}

function freezeHeartbeat(dataDir: string, nowMs: number, ageMs: number): void {
  const hb = join(dataDir, 'heartbeat.json')
  writeFileSync(hb, '{}')
  const t = new Date(nowMs - ageMs)
  utimesSync(hb, t, t)
}

function seedRunDb(dataDir: string, attemptTsMs: number | null): void {
  const db = new Database(join(dataDir, 'run.db'))
  db.exec('CREATE TABLE attempts(seq INTEGER PRIMARY KEY AUTOINCREMENT, task_id TEXT NOT NULL, ts TEXT NOT NULL, ok INTEGER NOT NULL, cost_usd REAL NOT NULL, detail TEXT NOT NULL, engine TEXT NOT NULL DEFAULT \'\', duration_ms INTEGER, tokens_in INTEGER, tokens_out INTEGER, tokens_cached INTEGER)')
  if (attemptTsMs !== null) {
    db.prepare('INSERT INTO attempts(task_id, ts, ok, cost_usd, detail) VALUES (?,?,?,?,?)')
      .run('t1', new Date(attemptTsMs).toISOString(), 1, 0, 'ok')
  }
  db.close()
}

const aliveRunner = (pid: number, childCount: number): CommandRunner => (command) => {
  if (command === 'tasklist') return `"node.exe","${pid}","Console","1","1,000 K"\r\n`
  if (command === 'powershell.exe') return `${childCount}\r\n`
  throw new Error(`unexpected: ${command}`)
}

test('(a) 心跳凍 40 分但 run.db 有較新 attempt：keep 不殺', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-reap-a-'))
  const { configPath, dataDir } = setup(root)
  const nowMs = Date.now()
  freezeHeartbeat(dataDir, nowMs, 40 * 60_000)
  seedRunDb(dataDir, nowMs - 5 * 60_000) // attempt 完成於凍結後
  const result = superviseConfig(configPath, {
    nowMs, runCommand: aliveRunner(4321, 1),
    reap: () => { throw new Error('不應 reap') },
    launch: () => { throw new Error('不應 launch') },
  })
  expect(result.action).toBe('keep')
  expect(result.probeErrors.join()).toContain('reap-downgraded')
})

test('(a2) 心跳凍 40 分、attempt 較舊但子進程在且未逾寬限：keep（長輪進行中）', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-reap-a2-'))
  const { configPath, dataDir } = setup(root)
  const nowMs = Date.now()
  freezeHeartbeat(dataDir, nowMs, 40 * 60_000)
  seedRunDb(dataDir, nowMs - 60 * 60_000) // attempt 完成於凍結前（凍結＝長輪起點）
  const result = superviseConfig(configPath, {
    nowMs, runCommand: aliveRunner(4321, 1),
    reap: () => { throw new Error('不應 reap') },
    launch: () => { throw new Error('不應 launch') },
  })
  expect(result.action).toBe('keep')
})

test('(b) 心跳凍 100 分且 run.db 靜默逾寬限：雙證齊全，reap', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-reap-b-'))
  const { configPath, dataDir } = setup(root)
  const nowMs = Date.now()
  freezeHeartbeat(dataDir, nowMs, 100 * 60_000)
  seedRunDb(dataDir, nowMs - 100 * 60_000)
  const effects: string[] = []
  const result = superviseConfig(configPath, {
    nowMs, runCommand: aliveRunner(4321, 1),
    reap: () => { effects.push('reap') },
    launch: () => { effects.push('launch'); return 1 },
  })
  expect(result.action).toBe('reap')
  expect(effects).toContain('reap')
})

test('(c) reapGraceMs 可由 config 覆寫：45 分寬限下凍 50 分即殺、凍 40 分仍保', () => {
  const nowMs = Date.now()
  for (const [ageMin, expected] of [[50, 'reap'], [40, 'keep']] as const) {
    const root = mkdtempSync(join(tmpdir(), `adng-reap-c${ageMin}-`))
    const { configPath, dataDir } = setup(root, { reapGraceMs: 45 * 60_000 })
    freezeHeartbeat(dataDir, nowMs, ageMin * 60_000)
    seedRunDb(dataDir, nowMs - 3 * 60 * 60_000)
    const result = superviseConfig(configPath, {
      nowMs, runCommand: aliveRunner(4321, 1),
      reap: () => undefined, launch: () => 1,
    })
    expect(result.action, `凍 ${ageMin} 分`).toBe(expected)
  }
})

test('(c2) reapGraceMs 下限保護：低於 30 分鐘被 schema 拒絕', () => {
  expect(() => ConfigSchema.parse({
    projectPath: './p', backlogFile: './b.md', dataDir: './d', engine: 'mock', reapGraceMs: 10 * 60_000,
  })).toThrow()
})

test('run.db 不存在時維持原 watchdog 行為（不擋 reap，避免殭屍永生）', () => {
  const root = mkdtempSync(join(tmpdir(), 'adng-reap-nodb-'))
  const { configPath, dataDir } = setup(root)
  const nowMs = Date.now()
  freezeHeartbeat(dataDir, nowMs, 100 * 60_000)
  const result = superviseConfig(configPath, {
    nowMs, runCommand: aliveRunner(4321, 1),
    reap: () => undefined, launch: () => 1,
  })
  expect(result.action).toBe('reap')
})
