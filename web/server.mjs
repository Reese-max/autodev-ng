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

/** process.kill(pid, 0)：不拋=活、EPERM=活（存在但無權限）、ESRCH=死。未知例外 fail-safe 視為活。
 * 鏡像 src/lock.ts 的 isPidAlive（web 層唯讀複製，不 import kernel、不改 kernel）。 */
function defaultIsPidAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    return err && err.code !== 'ESRCH'
  }
}

/** 唯讀讀取真 daemon.lock 的持有者存活狀態（審查修正 HIGH）。daemon.lock 目錄與 pid.json 格式
 * 沿用 src/lock.ts／cli.ts cmdDaemon（lockDir = join(dataDir, 'daemon.lock')，pid.json = { pid, startedAt }）。
 * 這是「讀狀態」非「搶鎖」——不 mkdir/rename/寫入，只讀 pid.json + process.kill(pid,0) 驗活，符合鐵律 #1
 * （web 是遙控器）。缺檔/壞檔/pid 非法一律回 'unknown'（fallback：無法判定，交由呼叫端保守處理）。 */
export function readDaemonLockOwner(dataDir, isPidAliveFn = defaultIsPidAlive) {
  const pidFile = join(dataDir, 'daemon.lock', 'pid.json')
  if (!existsSync(pidFile)) return 'unknown'
  try {
    const parsed = JSON.parse(readFileSync(pidFile, 'utf8'))
    const pid = parsed && parsed.pid
    if (typeof pid !== 'number' || !Number.isInteger(pid) || pid <= 0) return 'unknown'
    return isPidAliveFn(pid) ? 'alive' : 'dead'
  } catch {
    return 'unknown'
  }
}

const DEFAULT_LIVENESS_WAIT_MS = 800
function defaultSleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** spawn 後短驗 child 的存活/退出（審查修正 HIGH：消除誤導性 202）。等 waitMs 後看 exitCode，
 * 依進程類型分三態（B1 覆核回歸修正）：
 * - exitCode === null（仍在跑，長任務）→ null（呼叫端回 started）
 * - exitCode === 0 且 treatCleanExitAsSuccess（run-once 語意：單輪進程乾淨退出＝正常完成，如
 *   idle／快 blocked／快 done）→ { cleanExit: true }（呼叫端回 completed，非失敗）
 * - 其餘退出（run-once 非 0；daemon 任何值含 0，daemon 本該長命，800ms 內退出＝lock-busy／
 *   dist 缺失／config 錯）→ { failed, exitCode, logPath } */
async function verifyChildExit(child, waitMs, sleep, logPath, treatCleanExitAsSuccess) {
  await sleep(waitMs)
  const ec = child.exitCode
  if (ec === null || ec === undefined) return null
  if (treatCleanExitAsSuccess && ec === 0) return { cleanExit: true }
  return { failed: true, exitCode: ec, logPath }
}

export async function spawnRunOnce(state, spawnFn, cfgPath, dataDir, opts = {}) {
  const sleep = opts.sleep ?? defaultSleep
  const waitMs = opts.waitMs ?? DEFAULT_LIVENESS_WAIT_MS
  if (isAlive(state.runOnce)) return { alreadyRunning: true, pid: state.runOnce.pid }
  const logPath = join(dataDir, 'run-once-console.log')
  const logFd = openSync(logPath, 'a')
  const child = spawnFn(process.execPath, [DIST_CLI, 'run-once', '--config', cfgPath], { stdio: ['ignore', logFd, logFd] })
  state.runOnce = child
  // run-once 三態：treatCleanExitAsSuccess=true——exit 0 快退＝完成，只有 exit≠0 才算失敗。
  const outcome = await verifyChildExit(child, waitMs, sleep, logPath, true)
  if (outcome?.failed) return outcome
  if (outcome?.cleanExit) return { alreadyRunning: false, pid: child.pid, completed: true }
  return { alreadyRunning: false, pid: child.pid }
}

export async function spawnDaemonStart(state, spawnFn, cfgPath, dataDir, stopFile, opts = {}) {
  const sleep = opts.sleep ?? defaultSleep
  const waitMs = opts.waitMs ?? DEFAULT_LIVENESS_WAIT_MS
  const lockOwnerFn = opts.lockOwnerFn ?? (dd => readDaemonLockOwner(dd))
  // 活性判定改查真 lock（審查修正 HIGH）：不只信本 web 進程的 in-memory child——daemon 可能被 CLI
  // 直接啟動、或 web server 重啟過（state.daemon 歸零）。真 daemon.lock 被活著的進程持有 → 直接回
  // 「已在執行中」，不清 stopFile、不 spawn（否則會誤清使用者的停止令＋新 daemon 撞 lock 瞬退但回假 202）。
  if (isAlive(state.daemon) || lockOwnerFn(dataDir) === 'alive') {
    return { alreadyRunning: true, pid: state.daemon?.pid }
  }
  // 確認無活 daemon 後才開關語意：start＝「恢復運作」，清掉既有 stopFile，否則新 daemon 第一輪就會
  // 看到 stopFile 立刻回 stopped（既有機制：scheduler.runOnce 開頭 existsSync(cfg.stopFile)）。
  try { if (existsSync(stopFile)) rmSync(stopFile, { force: true }) } catch { /* 觀測/控制面不可反殺 */ }
  const logPath = join(dataDir, 'daemon-console.log')
  const logFd = openSync(logPath, 'a')
  const child = spawnFn(process.execPath, [DIST_CLI, 'daemon', '--config', cfgPath], {
    stdio: ['ignore', logFd, logFd], detached: true,
  })
  if (typeof child.unref === 'function') child.unref() // 測試注入的假 child 可能無此方法
  state.daemon = child
  // daemon 語意：treatCleanExitAsSuccess=false——800ms 內任何退出（含 exit 0）皆算失敗（daemon 本該長命）。
  const outcome = await verifyChildExit(child, waitMs, sleep, logPath, false)
  if (outcome?.failed) return outcome
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
  const { cfg, cfgPath, store, db, dbPath, token, spawnFn, childState, indexHtml, localDayFn, spawnOpts } = ctx
  return async function handle(req, res) {
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
        const r = await spawnRunOnce(childState, spawnFn, cfgPath, cfg.dataDir, spawnOpts)
        if (r.failed) { send(502, { status: '啟動後隨即退出', exitCode: r.exitCode, log: r.logPath }); return }
        if (r.alreadyRunning) { send(409, { status: '已在執行中', pid: r.pid }); return }
        // run-once 三態：completed＝800ms 內 exit 0 乾淨完成（idle／快 blocked／快 done），仍回 202（成功）。
        send(202, { status: r.completed ? 'completed' : 'started', taskId: r.pid })
        return
      }
      if (req.method === 'POST' && url.pathname === '/api/daemon/start') {
        const r = await spawnDaemonStart(childState, spawnFn, cfgPath, cfg.dataDir, cfg.stopFile, spawnOpts)
        if (r.failed) { send(502, { status: '啟動後隨即退出（可能 lock-busy／dist 缺失／config 錯）', exitCode: r.exitCode, log: r.logPath }); return }
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
