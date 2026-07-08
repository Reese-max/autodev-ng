import { expect, test } from 'vitest'
import { mkdtempSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { RunDb, localDay } from '../src/db.js'
import { BacklogStore } from '../src/backlog.js'

// web/server.mjs 是純 .mjs（不入 tsc 帳，M5 Task 9 spec：不經 tsc）。用非字面量路徑動態 import，
// 讓 tsc 不對它做型別解析（模組本身無 .d.ts），同時 vitest 執行期走真實 Node ESM loader。
const webServerPath = '../web/server.mjs'
const mod: any = await import(webServerPath)
const {
  parseArgs, makeToken, hasValidToken, readHeartbeat, readEventsTail, readDlqCount,
  readRecentAttempts, buildStatusPayload, createChildState, spawnRunOnce, spawnDaemonStart,
  stopDaemon, createServer, INDEX_HTML,
} = mod

function tmp(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix))
}

// ---------- argv / token ----------
test('parseArgs：解析 --config', () => {
  expect(parseArgs(['--config', 'configs/x.json']).configPath).toBe('configs/x.json')
  expect(parseArgs([]).configPath).toBeUndefined()
})

test('makeToken：48 hex 字元、每次不同', () => {
  const a = makeToken()
  const b = makeToken()
  expect(a).toMatch(/^[0-9a-f]{48}$/)
  expect(a).not.toBe(b)
})

test('hasValidToken：header 或 query 對上任一即通過，都不對則拒絕', () => {
  const url1 = new URL('http://x/api/run-once?token=tok')
  expect(hasValidToken({ headers: {} }, url1, 'tok')).toBe(true)
  const url2 = new URL('http://x/api/run-once')
  expect(hasValidToken({ headers: { 'x-csrf-token': 'tok' } }, url2, 'tok')).toBe(true)
  const url3 = new URL('http://x/api/run-once?token=wrong')
  expect(hasValidToken({ headers: {} }, url3, 'tok')).toBe(false)
  expect(hasValidToken({ headers: {} }, url2, 'tok')).toBe(false)
})

// ---------- 純讀取層 ----------
test('readHeartbeat：缺檔回 null；壞 JSON 回 null；正常檔回結構化物件', () => {
  const dir = tmp('adng-web-hb-')
  expect(readHeartbeat(dir)).toBeNull()
  writeFileSync(join(dir, 'heartbeat.json'), 'not json')
  expect(readHeartbeat(dir)).toBeNull()
  writeFileSync(join(dir, 'heartbeat.json'), JSON.stringify({ ts: '2026-01-01T00:00:00Z', state: 'idle', todayCostUsd: 1.5 }))
  expect(readHeartbeat(dir)).toEqual({ ts: '2026-01-01T00:00:00Z', state: 'idle', currentTask: undefined, todayCostUsd: 1.5 })
})

test('readEventsTail：只取尾 N 筆、壞行跳過', () => {
  const dir = tmp('adng-web-ev-')
  const lines = ['not json', ...Array.from({ length: 5 }, (_, i) => JSON.stringify({ type: `e${i}`, ts: 't' }))]
  writeFileSync(join(dir, 'events.jsonl'), lines.join('\n') + '\n')
  const tail = readEventsTail(dir, 3)
  expect(tail.map((e: any) => e.type)).toEqual(['e2', 'e3', 'e4'])
})

test('readDlqCount：缺檔 0、逐行計數', () => {
  const dir = tmp('adng-web-dlq-')
  expect(readDlqCount(dir)).toBe(0)
  writeFileSync(join(dir, 'notify-dlq.jsonl'), 'a\nb\nc\n')
  expect(readDlqCount(dir)).toBe(3)
})

test('readRecentAttempts：缺檔回空陣列；有資料回近 N 筆（新到舊）、ok 轉 boolean', () => {
  const dir = tmp('adng-web-db-')
  const dbPath = join(dir, 'run.db')
  expect(readRecentAttempts(dbPath, 10)).toEqual([])
  const db = new RunDb(dbPath)
  db.record({ taskId: 't1', ok: true, costUsd: 1, detail: 'd1' })
  db.record({ taskId: 't2', ok: false, costUsd: 0, detail: 'd2' })
  db.close()
  const rows = readRecentAttempts(dbPath, 10)
  expect(rows.length).toBe(2)
  expect(rows[0].taskId).toBe('t2')
  expect(rows[0].ok).toBe(false)
  expect(rows[1].ok).toBe(true)
})

// ---------- /api/status 組裝：無 secret 洩漏 ----------
test('buildStatusPayload：組裝正確結構，且絕不含 judgeApiKey/discordTokenFile/engines 等 secret 相關欄位', () => {
  const dir = tmp('adng-web-status-')
  writeFileSync(join(dir, 'backlog.md'), '- [ ] task A\n- [x] task B\n- [ ] task C <!-- adng:blocked reason="x" -->\n')
  const store = new BacklogStore(join(dir, 'backlog.md'))
  const db = new RunDb(join(dir, 'run.db'))
  db.record({ taskId: 'a', ok: true, costUsd: 2.5, detail: 'ok' })

  const cfg: any = {
    dataDir: dir, timezoneOffsetHours: 8, dailySoftUsd: 40, dailyHardUsd: 100,
    judgeApiKey: 'sk-super-secret-value', discordTokenFile: 'C:/secret/.env.tokens',
    engines: { claude: { adapter: 'claude-cli', env: { X: 'leak-me' } } },
  }
  const payload = buildStatusPayload({ cfg, store, db, dbPath: join(dir, 'run.db'), localDayFn: localDay })
  db.close()

  expect(payload.backlog).toEqual({ open: 1, blocked: 1, done: 1 })
  expect(payload.cost).toEqual({ today: 2.5, soft: 40, hard: 100 })
  expect(payload.dlqCount).toBe(0)
  expect(Array.isArray(payload.attempts)).toBe(true)
  expect(Array.isArray(payload.events)).toBe(true)

  const serialized = JSON.stringify(payload)
  expect(serialized).not.toContain('sk-super-secret-value')
  expect(serialized).not.toContain('secret/.env.tokens')
  expect(serialized).not.toContain('leak-me')
  expect(payload).not.toHaveProperty('cfg')
  expect(payload).not.toHaveProperty('engines')
  expect(payload).not.toHaveProperty('judgeApiKey')
})

test('buildStatusPayload：backlog 檔不存在時 backlogError 有值、其餘欄位仍正常組出', () => {
  const dir = tmp('adng-web-status-err-')
  const store = new BacklogStore(join(dir, 'missing.md'))
  const db = new RunDb(join(dir, 'run.db'))
  const payload = buildStatusPayload({ cfg: { dataDir: dir, timezoneOffsetHours: 0, dailySoftUsd: 1, dailyHardUsd: 2 }, store, db, dbPath: join(dir, 'run.db'), localDayFn: localDay })
  db.close()
  expect(typeof payload.backlogError).toBe('string')
  expect(payload.backlog).toEqual({ open: 0, blocked: 0, done: 0 })
})

// ---------- 控制端點防重入（mock spawn，絕不真跑 run-once/daemon） ----------
function fakeSpawn() {
  const created: any[] = []
  const spawnFn = (cmd: string, args: string[]) => {
    const child: any = { pid: 9000 + created.length, exitCode: null, killed: false, cmd, args }
    created.push(child)
    return child
  }
  return { spawnFn, created }
}

test('spawnRunOnce：同一 child 存活期間第二次呼叫回 already running；child 結束後可再次 spawn', () => {
  const dir = tmp('adng-web-run-')
  const state = createChildState()
  const { spawnFn, created } = fakeSpawn()
  const r1 = spawnRunOnce(state, spawnFn, 'cfg.json', dir)
  expect(r1.alreadyRunning).toBe(false)
  const r2 = spawnRunOnce(state, spawnFn, 'cfg.json', dir)
  expect(r2.alreadyRunning).toBe(true)
  expect(r2.pid).toBe(r1.pid)
  created[0].exitCode = 0 // 模擬 child 結束
  const r3 = spawnRunOnce(state, spawnFn, 'cfg.json', dir)
  expect(r3.alreadyRunning).toBe(false)
  expect(created.length).toBe(2)
})

test('spawnDaemonStart：先清掉既有 stopFile 再 spawn；同存活期間防重入', () => {
  const dir = tmp('adng-web-daemon-')
  const stopFile = join(dir, '.adng.stop')
  writeFileSync(stopFile, '')
  const state = createChildState()
  const { spawnFn } = fakeSpawn()
  const r1 = spawnDaemonStart(state, spawnFn, 'cfg.json', dir, stopFile)
  expect(r1.alreadyRunning).toBe(false)
  expect(existsSync(stopFile)).toBe(false)
  const r2 = spawnDaemonStart(state, spawnFn, 'cfg.json', dir, stopFile)
  expect(r2.alreadyRunning).toBe(true)
})

test('stopDaemon：寫入既有 stopFile 機制（scheduler.runOnce 讀取的同一路徑）', () => {
  const dir = tmp('adng-web-stop-')
  const stopFile = join(dir, '.adng.stop')
  expect(existsSync(stopFile)).toBe(false)
  const r = stopDaemon(stopFile)
  expect(r.ok).toBe(true)
  expect(existsSync(stopFile)).toBe(true)
})

// ---------- HTTP 路由 + CSRF（port 0，測完立即關閉；spawn 全 mock） ----------
async function withServer(fn: (base: string, created: any[]) => Promise<void>) {
  const dir = tmp('adng-web-http-')
  writeFileSync(join(dir, 'backlog.md'), '- [ ] t1\n')
  const store = new BacklogStore(join(dir, 'backlog.md'))
  const db = new RunDb(join(dir, 'run.db'))
  const cfg: any = { dataDir: dir, timezoneOffsetHours: 8, dailySoftUsd: 40, dailyHardUsd: 100, stopFile: join(dir, '.adng.stop') }
  const { spawnFn, created } = fakeSpawn()
  const server = createServer({
    cfg, cfgPath: 'cfg.json', store, db, dbPath: join(dir, 'run.db'), token: 'secret-tok',
    spawnFn, childState: createChildState(), indexHtml: '<html>ok</html>', localDayFn: localDay,
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()))
  const port = (server.address() as any).port
  try {
    await fn(`http://127.0.0.1:${port}`, created)
  } finally {
    db.close()
    await new Promise<void>(resolve => server.close(() => resolve()))
  }
}

test('GET / 回首頁 HTML；未知路徑 404', async () => {
  await withServer(async base => {
    const home = await fetch(base + '/')
    expect(home.status).toBe(200)
    expect(await home.text()).toContain('<html>')
    const nf = await fetch(base + '/nope')
    expect(nf.status).toBe(404)
  })
})

test('GET /api/status 回 200 JSON', async () => {
  await withServer(async base => {
    const res = await fetch(base + '/api/status')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.backlog.open).toBe(1)
  })
})

test('POST /api/run-once 無 token → 403；錯 token → 403；對 token → 202 + taskId，未真 spawn 真專案', async () => {
  await withServer(async (base, created) => {
    const noTok = await fetch(base + '/api/run-once', { method: 'POST' })
    expect(noTok.status).toBe(403)
    const wrongTok = await fetch(base + '/api/run-once', { method: 'POST', headers: { 'x-csrf-token': 'nope' } })
    expect(wrongTok.status).toBe(403)
    const ok = await fetch(base + '/api/run-once', { method: 'POST', headers: { 'x-csrf-token': 'secret-tok' } })
    expect(ok.status).toBe(202)
    const body = await ok.json()
    expect(typeof body.taskId).toBe('number')
    expect(created.length).toBe(1)
    expect(created[0].args).toContain('run-once')
  })
})

test('POST /api/daemon/start、/api/daemon/stop 對 token 放行（mock spawn）', async () => {
  await withServer(async (base, created) => {
    const start = await fetch(base + '/api/daemon/start?token=secret-tok', { method: 'POST' })
    expect(start.status).toBe(202)
    expect(created.some((c: any) => c.args.includes('daemon'))).toBe(true)
    const stop = await fetch(base + '/api/daemon/stop', { method: 'POST', headers: { 'x-csrf-token': 'secret-tok' } })
    expect(stop.status).toBe(200)
  })
})

test('INDEX_HTML 路徑存在（真實前端檔）', () => {
  expect(existsSync(INDEX_HTML)).toBe(true)
  expect(readFileSync(INDEX_HTML, 'utf8').length).toBeGreaterThan(0)
})
