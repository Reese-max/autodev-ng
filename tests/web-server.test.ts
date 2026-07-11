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
  stopDaemon, createServer, readDaemonLockOwner, readBotAlive, readSilencedUntil, INDEX_HTML,
} = mod

// 測試一律關掉 spawn 後的活性等待（waitMs=0 + 立即 resolve 的 sleep），避免真的等 800ms。
const FAST: any = { waitMs: 0, sleep: async () => {} }

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

test('spawnRunOnce：同一 child 存活期間第二次呼叫回 already running；child 結束後可再次 spawn', async () => {
  const dir = tmp('adng-web-run-')
  const state = createChildState()
  const { spawnFn, created } = fakeSpawn()
  const r1 = await spawnRunOnce(state, spawnFn, 'cfg.json', dir, FAST)
  expect(r1.alreadyRunning).toBe(false)
  const r2 = await spawnRunOnce(state, spawnFn, 'cfg.json', dir, FAST)
  expect(r2.alreadyRunning).toBe(true)
  expect(r2.pid).toBe(r1.pid)
  created[0].exitCode = 0 // 模擬 child 結束
  const r3 = await spawnRunOnce(state, spawnFn, 'cfg.json', dir, FAST)
  expect(r3.alreadyRunning).toBe(false)
  expect(created.length).toBe(2)
})

test('spawnRunOnce：spawn 後 child 立即退出且 exitCode≠0 → 回 failed 含 exitCode 與 log 路徑，非 started', async () => {
  const dir = tmp('adng-web-run-fail-')
  const state = createChildState()
  const spawnFn = () => ({ pid: 123, exitCode: 1, killed: false, args: ['run-once'] }) // 瞬退非 0
  const r = await spawnRunOnce(state, spawnFn, 'cfg.json', dir, FAST)
  expect(r.failed).toBe(true)
  expect(r.exitCode).toBe(1)
  expect(String(r.logPath)).toContain('run-once-console.log')
  expect(r.alreadyRunning).toBeUndefined()
})

// B1 回歸修正：run-once 快退 exit 0（空 backlog→idle／快 blocked／快 done）＝成功，不得誤報 failed。
test('spawnRunOnce：spawn 後 child 快退 exit 0（<waitMs）→ 回 completed（成功），非 failed', async () => {
  const dir = tmp('adng-web-run-clean-')
  const state = createChildState()
  const spawnFn = () => ({ pid: 321, exitCode: 0, killed: false, args: ['run-once'] }) // 乾淨快退
  const r = await spawnRunOnce(state, spawnFn, 'cfg.json', dir, FAST)
  expect(r.failed).toBeUndefined()
  expect(r.completed).toBe(true)
  expect(r.pid).toBe(321)
})

test('spawnDaemonStart：無活 daemon 時先清掉既有 stopFile 再 spawn；同存活期間防重入', async () => {
  const dir = tmp('adng-web-daemon-')
  const stopFile = join(dir, '.adng.stop')
  writeFileSync(stopFile, '')
  const state = createChildState()
  const { spawnFn } = fakeSpawn()
  const r1 = await spawnDaemonStart(state, spawnFn, 'cfg.json', dir, stopFile, FAST)
  expect(r1.alreadyRunning).toBe(false)
  expect(existsSync(stopFile)).toBe(false)
  const r2 = await spawnDaemonStart(state, spawnFn, 'cfg.json', dir, stopFile, FAST)
  expect(r2.alreadyRunning).toBe(true)
})

test('spawnDaemonStart：spawn 後 daemon 立即退出（如 lock-busy）→ 回 failed 非 started', async () => {
  const dir = tmp('adng-web-daemon-fail-')
  const stopFile = join(dir, '.adng.stop')
  const state = createChildState()
  const spawnFn = () => ({ pid: 456, exitCode: 3, killed: false, unref() {}, args: ['daemon'] })
  const r = await spawnDaemonStart(state, spawnFn, 'cfg.json', dir, stopFile, FAST)
  expect(r.failed).toBe(true)
  expect(r.exitCode).toBe(3)
  expect(String(r.logPath)).toContain('daemon-console.log')
})

// B1 語意分界：daemon 與 run-once 相反——daemon 本該長命，800ms 內退出（即使 exit 0，如 lock-busy
// 後乾淨退）一律 failed，不得比照 run-once 當成功。
test('spawnDaemonStart：spawn 後 daemon 快退 exit 0（800ms 內）→ 仍回 failed（daemon 語意不變）', async () => {
  const dir = tmp('adng-web-daemon-clean-')
  const stopFile = join(dir, '.adng.stop')
  const state = createChildState()
  const spawnFn = () => ({ pid: 789, exitCode: 0, killed: false, unref() {}, args: ['daemon'] })
  const r = await spawnDaemonStart(state, spawnFn, 'cfg.json', dir, stopFile, FAST)
  expect(r.failed).toBe(true)
  expect(r.exitCode).toBe(0)
})

// ---------- daemon 活性改查真 lock（審查修正 HIGH） ----------
test('readDaemonLockOwner：讀 dataDir/daemon.lock/pid.json（既有格式）+ 可注入 kill 探測', () => {
  const dir = tmp('adng-web-lock-')
  // 缺 pid.json → unknown
  expect(readDaemonLockOwner(dir, () => true)).toBe('unknown')
  // 建 daemon.lock 目錄 + pid.json（沿用 src/lock.ts writeOwnPidFile 格式）
  const { mkdirSync } = require('node:fs')
  mkdirSync(join(dir, 'daemon.lock'))
  writeFileSync(join(dir, 'daemon.lock', 'pid.json'), JSON.stringify({ pid: 4321, startedAt: '2026-01-01T00:00:00Z' }))
  expect(readDaemonLockOwner(dir, () => true)).toBe('alive')   // 探測回活
  expect(readDaemonLockOwner(dir, () => false)).toBe('dead')   // 探測回死
  // 壞 pid（非正整數）→ unknown
  writeFileSync(join(dir, 'daemon.lock', 'pid.json'), JSON.stringify({ pid: 'x' }))
  expect(readDaemonLockOwner(dir, () => true)).toBe('unknown')
})

test('spawnDaemonStart：真 lock 判定為 alive（即使 state.daemon=null，如 CLI 直啟／web 重啟）→ 回 already running，不清 stopFile、不 spawn', async () => {
  const dir = tmp('adng-web-lock-alive-')
  const stopFile = join(dir, '.adng.stop')
  writeFileSync(stopFile, 'user-stop') // 使用者稍早寫入的停止令，不可被誤清
  const state = createChildState() // state.daemon = null（模擬 web 重啟或 daemon 由 CLI 啟動）
  const { spawnFn, created } = fakeSpawn()
  const r = await spawnDaemonStart(state, spawnFn, 'cfg.json', dir, stopFile, { ...FAST, lockOwnerFn: () => 'alive' })
  expect(r.alreadyRunning).toBe(true)
  expect(existsSync(stopFile)).toBe(true)   // stopFile 未被清
  expect(created.length).toBe(0)            // 未 spawn
})

// ---------- M9.1：總覽徽章三欄的純讀取層 ----------
test('readBotAlive：缺檔回 false；探測活/死；壞 pid 回 false', () => {
  const dir = tmp('adng-web-botalive-')
  expect(readBotAlive(dir, () => true)).toBe(false) // 缺 bot.lock/pid.json
  const { mkdirSync } = require('node:fs')
  mkdirSync(join(dir, 'bot.lock'))
  writeFileSync(join(dir, 'bot.lock', 'pid.json'), JSON.stringify({ pid: 4321, startedAt: '2026-01-01T00:00:00Z' }))
  expect(readBotAlive(dir, () => true)).toBe(true)
  expect(readBotAlive(dir, () => false)).toBe(false)
  writeFileSync(join(dir, 'bot.lock', 'pid.json'), JSON.stringify({ pid: 'x' }))
  expect(readBotAlive(dir, () => true)).toBe(false) // 壞 pid → fail-close
})

test('readSilencedUntil：缺檔回 null；未過期回 untilIso；已過期回 null', () => {
  const dir = tmp('adng-web-silenced-')
  expect(readSilencedUntil(dir)).toBeNull()
  const future = new Date(Date.now() + 60_000).toISOString()
  writeFileSync(join(dir, 'silence.json'), JSON.stringify({ untilIso: future }))
  expect(readSilencedUntil(dir)).toBe(future)
  const past = new Date(Date.now() - 60_000).toISOString()
  writeFileSync(join(dir, 'silence.json'), JSON.stringify({ untilIso: past }))
  expect(readSilencedUntil(dir)).toBeNull()
})

test('buildStatusPayload：新增 botAlive/silencedUntil/stopFilePresent 三欄，缺 stopFile 也不炸', () => {
  const dir = tmp('adng-web-status-badges-')
  const store = new BacklogStore(join(dir, 'missing.md'))
  const db = new RunDb(join(dir, 'run.db'))
  const cfg: any = { dataDir: dir, timezoneOffsetHours: 0, dailySoftUsd: 1, dailyHardUsd: 2 } // 無 stopFile 欄位
  const payload = buildStatusPayload({ cfg, store, db, dbPath: join(dir, 'run.db'), localDayFn: localDay })
  db.close()
  expect(payload.botAlive).toBe(false)
  expect(payload.silencedUntil).toBeNull()
  expect(payload.stopFilePresent).toBe(false)
})

test('buildStatusPayload：stopFile 存在時 stopFilePresent=true', () => {
  const dir = tmp('adng-web-status-stop-')
  const stopFile = join(dir, '.adng.stop')
  writeFileSync(stopFile, '')
  const store = new BacklogStore(join(dir, 'missing.md'))
  const db = new RunDb(join(dir, 'run.db'))
  const cfg: any = { dataDir: dir, timezoneOffsetHours: 0, dailySoftUsd: 1, dailyHardUsd: 2, stopFile }
  const payload = buildStatusPayload({ cfg, store, db, dbPath: join(dir, 'run.db'), localDayFn: localDay })
  db.close()
  expect(payload.stopFilePresent).toBe(true)
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
async function withServer(fn: (base: string, created: any[], dir: string) => Promise<void>, spawnOverride?: () => any) {
  const dir = tmp('adng-web-http-')
  writeFileSync(join(dir, 'backlog.md'), '- [ ] t1\n')
  const store = new BacklogStore(join(dir, 'backlog.md'))
  const db = new RunDb(join(dir, 'run.db'))
  const cfg: any = {
    dataDir: dir, timezoneOffsetHours: 8, dailySoftUsd: 40, dailyHardUsd: 100,
    stopFile: join(dir, '.adng.stop'), backlogFile: join(dir, 'backlog.md'),
  }
  const created: any[] = []
  const spawnFn = spawnOverride
    ? () => { const c = spawnOverride(); created.push(c); return c }
    : (cmd: string, args: string[]) => { const c: any = { pid: 9000 + created.length, exitCode: null, killed: false, cmd, args, unref() {} }; created.push(c); return c }
  const server = createServer({
    cfg, cfgPath: 'cfg.json', store, db, dbPath: join(dir, 'run.db'), token: 'secret-tok',
    spawnFn, childState: createChildState(), indexHtml: '<html>ok</html>', localDayFn: localDay,
    spawnOpts: { ...FAST, lockOwnerFn: () => 'unknown' },
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()))
  const port = (server.address() as any).port
  try {
    await fn(`http://127.0.0.1:${port}`, created, dir)
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

// M9.1：/api/status 總覽徽章三欄結構化形狀（不走 panel 文字）。
test('GET /api/status 回傳含 botAlive/silencedUntil/stopFilePresent 三欄', async () => {
  await withServer(async base => {
    const res = await fetch(base + '/api/status')
    const body = await res.json()
    expect(typeof body.botAlive).toBe('boolean')
    expect(body.silencedUntil === null || typeof body.silencedUntil === 'string').toBe(true)
    expect(typeof body.stopFilePresent).toBe('boolean')
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

test('POST /api/run-once：child 快退 exit 0 → 202（status=completed），非 502（B1 回歸修正）', async () => {
  await withServer(async (base, created) => {
    const ok = await fetch(base + '/api/run-once', { method: 'POST', headers: { 'x-csrf-token': 'secret-tok' } })
    expect(ok.status).toBe(202)
    const body = await ok.json()
    expect(body.status).toBe('completed')
    expect(created.length).toBe(1)
  }, () => ({ pid: 555, exitCode: 0, killed: false, unref() {}, args: ['run-once'] }))
})

test('POST /api/run-once：child 快退 exit≠0 → 502 failed', async () => {
  await withServer(async base => {
    const res = await fetch(base + '/api/run-once', { method: 'POST', headers: { 'x-csrf-token': 'secret-tok' } })
    expect(res.status).toBe(502)
    const body = await res.json()
    expect(body.exitCode).toBe(2)
  }, () => ({ pid: 556, exitCode: 2, killed: false, unref() {}, args: ['run-once'] }))
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

// ---------- M9：GET /api/panel/:name（複用 dist/bot/handlers.js handleCommand，零重複業務邏輯） ----------
test('GET /api/panel/backlog 回 200 + text（複用 bot cmdBacklog 輸出，不需 CSRF）', async () => {
  await withServer(async base => {
    const res = await fetch(base + '/api/panel/backlog')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body.text).toBe('string')
    expect(body.text).toContain('open 1')
  })
})

test('GET /api/panel/nope（白名單外 name）→ 404', async () => {
  await withServer(async base => {
    const res = await fetch(base + '/api/panel/nope')
    expect(res.status).toBe(404)
  })
})

test('GET /api/panel/goal：goalFile 未設 → 人話（未真 spawn autopilot）', async () => {
  await withServer(async base => {
    const res = await fetch(base + '/api/panel/goal')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.text).toBe('尚未設定 GOAL（先 /goal set <目標文字>）')
  })
})

// ---------- M9：POST /api/goal/set|run|stop、/api/silence（走既有 CSRF 機制） ----------
test('POST /api/goal/set 無 token → 403', async () => {
  await withServer(async base => {
    const res = await fetch(base + '/api/goal/set', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'x' }),
    })
    expect(res.status).toBe(403)
  })
})

// 誠實記錄：doGoal 未被注入 spawnFn（handleCommand 呼叫 doGoal 時用預設值），
// 這裡驗證的是「注入防護」與「傳輸層」——不驗 goalFile 存在後的真 spawn 路徑。
test('POST /api/goal/set 對 token；含換行的注入文字被 handler 拒 → 拒絕文案原樣透傳', async () => {
  await withServer(async base => {
    const res = await fetch(base + '/api/goal/set', {
      method: 'POST',
      headers: { 'x-csrf-token': 'secret-tok', 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'line1\nline2' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.text).toBe('任務內容不可含換行')
  })
})

test('POST /api/goal/set 對 token；合法文字但 config 未設 goalFile → 人話', async () => {
  await withServer(async base => {
    const res = await fetch(base + '/api/goal/set', {
      method: 'POST',
      headers: { 'x-csrf-token': 'secret-tok', 'content-type': 'application/json' },
      body: JSON.stringify({ text: '完成 M9' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.text).toBe('config 未設 goalFile')
  })
})

test('POST /api/goal/run 無 token → 403；對 token 時 goalFile 不存在 → 人話（未真 spawn autopilot）', async () => {
  await withServer(async (base, created) => {
    const noTok = await fetch(base + '/api/goal/run', { method: 'POST' })
    expect(noTok.status).toBe(403)
    const res = await fetch(base + '/api/goal/run', { method: 'POST', headers: { 'x-csrf-token': 'secret-tok' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.text).toBe('尚未設定 GOAL（先 /goal set <目標文字>）')
    expect(created.length).toBe(0) // 未真 spawn autopilot（goalFile 不存在時 goalRun 提早回傳）
  })
})

test('POST /api/goal/stop 無 token → 403；對 token → 200 + text（goalFile 不存在也視為成功）', async () => {
  await withServer(async base => {
    const noTok = await fetch(base + '/api/goal/stop', { method: 'POST' })
    expect(noTok.status).toBe(403)
    const res = await fetch(base + '/api/goal/stop', { method: 'POST', headers: { 'x-csrf-token': 'secret-tok' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.text).toBe('已刪除 GOAL，autopilot 將於下一輪偵測到並停止')
  })
})

test('POST /api/silence 無 token → 403；對 token 帶 minutes=0 → 解除靜音', async () => {
  await withServer(async base => {
    const noTok = await fetch(base + '/api/silence', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ minutes: 5 }),
    })
    expect(noTok.status).toBe(403)
    const res = await fetch(base + '/api/silence', {
      method: 'POST',
      headers: { 'x-csrf-token': 'secret-tok', 'content-type': 'application/json' },
      body: JSON.stringify({ minutes: 0 }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.text).toBe('已解除靜音')
  })
})

// ---------- M9.1：POST /api/pause、/api/resume、/api/task（handleCommand 透傳，CSRF 沿用） ----------
test('POST /api/pause 無 token → 403；對 token → 寫入 stopFile（daemon 語意暫停），200 + text', async () => {
  await withServer(async (base, _created, dir) => {
    const noTok = await fetch(base + '/api/pause', { method: 'POST' })
    expect(noTok.status).toBe(403)
    const res = await fetch(base + '/api/pause', { method: 'POST', headers: { 'x-csrf-token': 'secret-tok' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body.text).toBe('string')
    expect(existsSync(join(dir, '.adng.stop'))).toBe(true)
  })
})

test('POST /api/resume 無 token → 403；對 token → 清除既有 stopFile', async () => {
  await withServer(async (base, _created, dir) => {
    writeFileSync(join(dir, '.adng.stop'), 'bot /pause\n')
    const noTok = await fetch(base + '/api/resume', { method: 'POST' })
    expect(noTok.status).toBe(403)
    const res = await fetch(base + '/api/resume', { method: 'POST', headers: { 'x-csrf-token': 'secret-tok' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body.text).toBe('string')
    expect(existsSync(join(dir, '.adng.stop'))).toBe(false)
  })
})

test('POST /api/task 無 token → 403；含換行的注入文字 → 拒收文案原樣透傳', async () => {
  await withServer(async base => {
    const noTok = await fetch(base + '/api/task', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'x' }),
    })
    expect(noTok.status).toBe(403)
    const res = await fetch(base + '/api/task', {
      method: 'POST',
      headers: { 'x-csrf-token': 'secret-tok', 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'line1\nline2' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.text).toBe('任務內容不可含換行')
  })
})

test('POST /api/task 對 token；合法文字 → 已加入 backlog，backlog.md 實際多一行', async () => {
  await withServer(async (base, _created, dir) => {
    const res = await fetch(base + '/api/task', {
      method: 'POST',
      headers: { 'x-csrf-token': 'secret-tok', 'content-type': 'application/json' },
      body: JSON.stringify({ text: '新任務 A' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.text).toBe('已加入 backlog')
    expect(readFileSync(join(dir, 'backlog.md'), 'utf8')).toContain('新任務 A')
  })
})
