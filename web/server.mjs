#!/usr/bin/env node
// web/server.mjs — M5 Task 9：極簡本機網頁控制台（零框架、只用 Node 內建模組 + 既有專案依賴）。
// 監看（GET /api/status、GET /api/logs SSE）+ 控制（POST /api/run-once、/api/daemon/start、/api/daemon/stop）。
// 不入 kernel 帳（≤800 行，server.mjs+index.html 合計）；不 import 跑 scheduler，控制端點一律 spawn
// 既有 dist/cli.js（單一事實來源，web 只是遙控器）。bind 127.0.0.1 only。
import { createServer as httpCreateServer } from 'node:http'
import { spawn as nodeSpawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync, rmSync, openSync } from 'node:fs'
import { fileURLToPath, pathToFileURL, URL as NodeURL } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import Database from 'better-sqlite3'

const HERE = dirname(fileURLToPath(import.meta.url))
export const DIST_CLI = resolve(HERE, '../dist/cli.js')
export const INDEX_HTML = resolve(HERE, 'index.html')

// ---------- argv ----------
export function parseArgs(argv) {
  let configPath
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--config') configPath = argv[i + 1]
  }
  return { configPath }
}

// ---------- CSRF token ----------
export function makeToken() {
  return randomBytes(24).toString('hex')
}

export function hasValidToken(req, url, token) {
  const header = req.headers['x-csrf-token']
  const q = url.searchParams.get('token')
  return header === token || q === token
}

// ---------- 純讀取層：直接讀既有資料來源（heartbeat.json / events.jsonl / notify-dlq.jsonl /
// run.db attempts 表），不重造 scheduler 決策邏輯；今日成本沿用 deps.db.costForLocalDay 真值。 ----------
export function readHeartbeat(dataDir) {
  const file = join(dataDir, 'heartbeat.json')
  if (!existsSync(file)) return null
  try {
    const r = JSON.parse(readFileSync(file, 'utf8'))
    if (typeof r !== 'object' || r === null) return null
    return {
      ts: r.ts, state: r.state,
      currentTask: typeof r.currentTask === 'string' ? r.currentTask : undefined,
      todayCostUsd: typeof r.todayCostUsd === 'number' ? r.todayCostUsd : undefined,
    }
  } catch { return null }
}

function readLines(file) {
  if (!existsSync(file)) return []
  try {
    return readFileSync(file, 'utf8').split(/\r?\n/).filter(l => l.length > 0)
  } catch { return [] }
}

export function readEventsTail(dataDir, n) {
  const lines = readLines(join(dataDir, 'events.jsonl')).slice(-n)
  const out = []
  for (const line of lines) {
    try { out.push(JSON.parse(line)) } catch { /* 壞行跳過 */ }
  }
  return out
}

export function readDlqCount(dataDir) {
  return readLines(join(dataDir, 'notify-dlq.jsonl')).length
}

/** attempts 近 N 筆：唯讀開一條獨立 sqlite 連線（WAL 模式支援多讀者），用完即關，不與 kernel 的
 * RunDb 常駐連線互搶、不需在 kernel 新增查詢方法。缺檔（daemon 從未跑過）回空陣列。 */
export function readRecentAttempts(dbPath, n) {
  if (!existsSync(dbPath)) return []
  let db
  try {
    db = new Database(dbPath, { readonly: true, fileMustExist: true })
    const rows = db.prepare(
      'SELECT task_id AS taskId, ts, ok, cost_usd AS costUsd, detail FROM attempts ORDER BY seq DESC LIMIT ?'
    ).all(n)
    return rows.map(r => ({ ...r, ok: !!r.ok }))
  } catch {
    return []
  } finally {
    try { db?.close() } catch { /* ignore */ }
  }
}

/** /api/status 組裝：純允許清單（allowlist）輸出，絕不 spread cfg 或任何 engines/token 欄位——
 * config 內的 secret（judgeApiKey、discordTokenFile 指向的 token 等）永不進回應。 */
export function buildStatusPayload({ cfg, store, db, dbPath, localDayFn }) {
  const day = localDayFn(new Date().toISOString(), cfg.timezoneOffsetHours)
  const todayCostUsd = db.costForLocalDay(day, cfg.timezoneOffsetHours)

  let backlog = { open: 0, blocked: 0, done: 0 }
  let backlogError
  try {
    const tasks = store.read()
    backlog = {
      open: tasks.filter(t => t.status === 'open').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      done: tasks.filter(t => t.status === 'done').length,
    }
  } catch (err) {
    backlogError = String(err && err.message ? err.message : err)
  }

  return {
    ts: new Date().toISOString(),
    heartbeat: readHeartbeat(cfg.dataDir),
    backlog, backlogError,
    cost: { today: todayCostUsd, soft: cfg.dailySoftUsd, hard: cfg.dailyHardUsd },
    attempts: readRecentAttempts(dbPath, 10),
    events: readEventsTail(cfg.dataDir, 50),
    dlqCount: readDlqCount(cfg.dataDir),
  }
}

// ---------- 控制端點：spawn 既有 CLI，web 層只做「同一時間只允許一個進行中的 child」防重入
// （不是重造 scheduler 的 lock——daemon 本身的 daemon.lock／run-once 本身無鎖皆維持既有行為，
// 這裡只防「使用者連點兩次按鈕」）。 ----------
function isAlive(child) {
  return !!child && child.exitCode === null && !child.killed
}

export function createChildState() {
  return { runOnce: null, daemon: null }
}

export function spawnRunOnce(state, spawnFn, cfgPath, dataDir) {
  if (isAlive(state.runOnce)) return { alreadyRunning: true, pid: state.runOnce.pid }
  const logFd = openSync(join(dataDir, 'run-once-console.log'), 'a')
  const child = spawnFn(process.execPath, [DIST_CLI, 'run-once', '--config', cfgPath], { stdio: ['ignore', logFd, logFd] })
  state.runOnce = child
  return { alreadyRunning: false, pid: child.pid }
}

export function spawnDaemonStart(state, spawnFn, cfgPath, dataDir, stopFile) {
  if (isAlive(state.daemon)) return { alreadyRunning: true, pid: state.daemon.pid }
  // 開關語意：start＝按下「恢復運作」，先清掉既有 stopFile，否則新起的 daemon 第一輪就會
  // 看到 stopFile 立刻回 stopped（既有機制：scheduler.runOnce 開頭 existsSync(cfg.stopFile)）。
  try { if (existsSync(stopFile)) rmSync(stopFile, { force: true }) } catch { /* 觀測/控制面不可反殺 */ }
  const logFd = openSync(join(dataDir, 'daemon-console.log'), 'a')
  const child = spawnFn(process.execPath, [DIST_CLI, 'daemon', '--config', cfgPath], {
    stdio: ['ignore', logFd, logFd], detached: true,
  })
  if (typeof child.unref === 'function') child.unref() // 測試注入的假 child 可能無此方法
  state.daemon = child
  return { alreadyRunning: false, pid: child.pid }
}

/** daemon stop：寫既有 stopFile 機制（scheduler.runOnce 每輪開頭 existsSync 檢查），不碰 lock/kill。 */
export function stopDaemon(stopFile) {
  try {
    writeFileSync(stopFile, '')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

// ---------- SSE tail ----------
function attachLogsSse(req, res, dataDir) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })
  res.write(': connected\n\n')
  const file = join(dataDir, 'events.jsonl')
  let pos = existsSync(file) ? readFileSync(file, 'utf8').length : 0
  const timer = setInterval(() => {
    if (!existsSync(file)) return
    let content
    try { content = readFileSync(file, 'utf8') } catch { return }
    if (content.length <= pos) { if (content.length < pos) pos = 0; return }
    const chunk = content.slice(pos)
    pos = content.length
    for (const line of chunk.split(/\r?\n/)) {
      if (line.length === 0) continue
      res.write(`data: ${line}\n\n`)
    }
  }, 1500)
  req.on('close', () => clearInterval(timer))
}

// ---------- HTTP routing ----------
export function createRequestHandler(ctx) {
  const { cfg, cfgPath, store, db, dbPath, token, spawnFn, childState, indexHtml, localDayFn } = ctx
  return function handle(req, res) {
    const url = new NodeURL(req.url, 'http://127.0.0.1')
    const send = (code, body, headers = {}) => {
      res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', ...headers })
      res.end(JSON.stringify(body))
    }

    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(indexHtml)
      return
    }
    if (req.method === 'GET' && url.pathname === '/api/status') {
      try {
        send(200, buildStatusPayload({ cfg, store, db, dbPath, localDayFn }))
      } catch (err) {
        send(500, { error: String(err) })
      }
      return
    }
    if (req.method === 'GET' && url.pathname === '/api/logs') {
      attachLogsSse(req, res, cfg.dataDir)
      return
    }

    if (url.pathname.startsWith('/api/')) {
      if (!hasValidToken(req, url, token)) { send(403, { error: 'forbidden：CSRF token 缺失或錯誤' }); return }

      if (req.method === 'POST' && url.pathname === '/api/run-once') {
        const r = spawnRunOnce(childState, spawnFn, cfgPath, cfg.dataDir)
        send(r.alreadyRunning ? 409 : 202, r.alreadyRunning ? { status: '已在執行中', pid: r.pid } : { status: 'started', taskId: r.pid })
        return
      }
      if (req.method === 'POST' && url.pathname === '/api/daemon/start') {
        const r = spawnDaemonStart(childState, spawnFn, cfgPath, cfg.dataDir, cfg.stopFile)
        send(r.alreadyRunning ? 409 : 202, r.alreadyRunning ? { status: '已在執行中', pid: r.pid } : { status: 'started', pid: r.pid })
        return
      }
      if (req.method === 'POST' && url.pathname === '/api/daemon/stop') {
        const r = stopDaemon(cfg.stopFile)
        send(r.ok ? 200 : 500, r)
        return
      }
    }

    send(404, { error: 'not found' })
  }
}

export function createServer(ctx) {
  return httpCreateServer(createRequestHandler(ctx))
}

// ---------- bootstrap（真跑：組 deps、印 token+URL、bind 127.0.0.1:3900） ----------
async function main() {
  const { configPath } = parseArgs(process.argv.slice(2))
  if (!configPath) {
    console.error('用法：node web/server.mjs --config <path>')
    process.exitCode = 1
    return
  }
  const { assemble } = await import(new NodeURL('../dist/cli.js', import.meta.url).href)
  const { localDay } = await import(new NodeURL('../dist/db.js', import.meta.url).href)
  const { deps, cfg } = assemble(configPath)
  const cfgPath = resolve(configPath) // 供 spawn 端點沿用同一份 config（僅路徑，非 secret）

  const indexHtml = readFileSync(INDEX_HTML, 'utf8')
  const token = makeToken()
  const childState = createChildState()
  const server = createServer({
    cfg, cfgPath, store: deps.store, db: deps.db, dbPath: join(cfg.dataDir, 'run.db'),
    token, spawnFn: nodeSpawn, childState, indexHtml, localDayFn: localDay,
  })

  const PORT = 3900
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[web] autodev-ng 控制台已啟動：http://127.0.0.1:${PORT}/?token=${token}`)
    console.log(`[web] CSRF token: ${token}`)
    console.log('[web] 僅 bind 127.0.0.1，非本機請求一律無法連入。')
  })

  process.on('SIGINT', () => { deps.db.close(); server.close(() => process.exit(0)) })
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch(err => { console.error(err instanceof Error ? err.message : String(err)); process.exitCode = 1 })
}
