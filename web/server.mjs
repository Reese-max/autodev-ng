#!/usr/bin/env node
// web/server.mjs — M5 Task 9 + M9：極簡本機網頁控制台（零框架、只用 Node 內建模組 + 既有專案依賴）。
// 監看（GET /api/status、GET /api/logs SSE、GET /api/panel/:name）
// + 控制（POST /api/run-once、/api/daemon/start、/api/daemon/stop、/api/goal/set|run|stop、/api/silence）。
// 不入 kernel 帳（≤900 行，M9：server.mjs+index.html 合計）；不 import 跑 scheduler，控制端點一律 spawn
// 既有 dist/cli.js（單一事實來源，web 只是遙控器）。bind 127.0.0.1 only。
// M9：panel/goal/silence 端點零重複業務邏輯——直接呼叫既有 dist/bot/handlers.js 的 handleCommand
// （鏡像 src/bot/index.ts 組 BotDeps 的方式），web 只是 bot handler 的另一張皮。
import { createServer as httpCreateServer } from 'node:http'
import { spawn as nodeSpawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync, rmSync, openSync, mkdirSync, renameSync, rmdirSync, statSync } from 'node:fs'
import { fileURLToPath, pathToFileURL, URL as NodeURL } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import Database from 'better-sqlite3'
import { fleetStatusFromLockPid } from '../src/engines/fleet-status.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
export const DIST_CLI = resolve(HERE, '../dist/cli.js')
export const INDEX_HTML = resolve(HERE, 'index.html')
export { fleetStatusFromLockPid }

// ---------- argv ----------
// M10.5 Task 7：--configs-dir 與 --config 互斥（main() 優先 configsDir 分流，鏡像 src/bot/index.ts 慣例）。
export function parseArgs(argv) {
  let configPath, configsDir
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--config') configPath = argv[i + 1]
    if (argv[i] === '--configs-dir') configsDir = argv[i + 1]
  }
  return { configPath, configsDir }
}

// ---------- CSRF token ----------
export function makeToken() {
  return randomBytes(24).toString('hex')
}

// token 持久化（M9.3 Task 6）：常駐排程每 15 分鐘可能 respawn，若每次都重生 token 使用者分頁
// 會被 403 卡住。啟動時先讀 <dataDir>/web-console.token（單行 hex），存在且非空即沿用；
// 不存在（或讀檔失敗）才 makeToken() 新生並落地，供下次 respawn 沿用。
export function loadOrCreateToken(dataDir) {
  const file = join(dataDir, 'web-console.token')
  try {
    const t = readFileSync(file, 'utf8').trim()
    if (t) return t
  } catch { /* 不存在則新生 */ }
  const t = makeToken()
  try { writeFileSync(file, t + '\n') } catch (e) { console.error('[web] token 檔寫入失敗,本次用暫時 token:', String(e)) }
  return t
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

  let backlog = { open: 0, blocked: 0, superseded: 0, done: 0 }
  let backlogError
  try {
    const tasks = store.read()
    backlog = {
      open: tasks.filter(t => t.status === 'open').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      superseded: tasks.filter(t => t.status === 'superseded').length,
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
    accounting: db.accountingForDay?.(day, cfg.timezoneOffsetHours) ?? null,
    attempts: readRecentAttempts(dbPath, 10),
    events: readEventsTail(cfg.dataDir, 50),
    dlqCount: readDlqCount(cfg.dataDir),
    // M9.1：總覽徽章三欄（結構化，不走 panel 文字）。
    botAlive: readBotAlive(cfg.dataDir),
    silencedUntil: readSilencedUntil(cfg.dataDir),
    stopFilePresent: cfg.stopFile ? existsSync(cfg.stopFile) : false,
  }
}

/** 多專案彙總端點：只讀卡片需要的來源；heartbeat、backlog、成本與戰績各自 fail-open。 */
export function buildProjectSummary(name, ctx) {
  const ts = new Date().toISOString()
  const heartbeat = readHeartbeat(ctx.cfg.dataDir)
  let day
  try { day = ctx.localDayFn(ts, ctx.cfg.timezoneOffsetHours) } catch { /* fail-open */ }

  let todayCostUsd = 0
  try {
    const value = ctx.db.costForLocalDay(day, ctx.cfg.timezoneOffsetHours)
    if (Number.isFinite(value)) todayCostUsd = value
  } catch { /* fail-open */ }

  let todayOk = 0, todayFail = 0
  try {
    const stats = ctx.db.dayStats(day, ctx.cfg.timezoneOffsetHours)
    if (Number.isFinite(stats.ok)) todayOk = stats.ok
    if (Number.isFinite(stats.fail)) todayFail = stats.fail
  } catch { /* fail-open */ }

  let backlogOpen = 0, backlogBlocked = 0, backlogSuperseded = 0
  try {
    const tasks = ctx.store.read()
    backlogOpen = tasks.filter(t => t.status === 'open').length
    backlogBlocked = tasks.filter(t => t.status === 'blocked').length
    backlogSuperseded = tasks.filter(t => t.status === 'superseded').length
  } catch { /* fail-open */ }

  const daemonStatus = readDaemonLockOwner(ctx.cfg.dataDir)
  return {
    name,
    state: typeof heartbeat?.state === 'string' ? heartbeat.state : 'unknown',
    ts,
    currentTask: heartbeat?.currentTask ?? null,
    todayCostUsd, todayOk, todayFail, backlogOpen, backlogBlocked, backlogSuperseded,
    daemonStatus,
    daemonAlive: daemonStatus === 'ALIVE',
  }
}

// ---------- 控制端點：spawn 既有 CLI，web 層只做「同一時間只允許一個進行中的 child」防重入
// （不是重造 scheduler 的 lock——daemon 本身的 daemon.lock／run-once 本身無鎖皆維持既有行為，
// 這裡只防「使用者連點兩次按鈕」）。 ----------
function isAlive(child) {
  return !!child && child.exitCode === null && !child.killed
}

function withWebPauseGate(stopFile, action) {
  const gate = `${resolve(stopFile)}.lockdir`
  // ponytail: web 控制面遇競爭直接失敗供重試；不在事件迴圈內同步等待。
  try { mkdirSync(gate) } catch (error) {
    if (error?.code !== 'EEXIST' || Date.now() - statSync(gate).mtimeMs <= 60_000) throw error
    const reap = `${gate}.reap-${process.pid}-${Date.now()}`
    renameSync(gate, reap)
    rmdirSync(reap)
    mkdirSync(gate)
  }
  try { return action() } finally { try { rmdirSync(gate) } catch { /* stop writer 已回收 stale gate */ } }
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
 * （web 是遙控器）。缺檔/壞檔/pid 非法一律回 'UNKNOWN'（fallback：無法判定，交由呼叫端保守處理）。 */
export function readDaemonLockOwner(dataDir, isPidAliveFn = defaultIsPidAlive) {
  const pidFile = join(dataDir, 'daemon.lock', 'pid.json')
  if (!existsSync(pidFile)) return 'UNKNOWN'
  try {
    const parsed = JSON.parse(readFileSync(pidFile, 'utf8'))
    return fleetStatusFromLockPid(parsed && parsed.pid, isPidAliveFn)
  } catch {
    return 'UNKNOWN'
  }
}

/** 讀 dataDir/bot.lock/pid.json 判斷 bot 進程是否存活（M9.1 總覽徽章）。缺檔/壞檔/pid 非法一律回
 * false——鏡像 src/lock.ts checkLockOwner／src/bot/handlers.ts isDaemonAlive 的 process.kill(pid,0)
 * 慣例，但刻意 fail-close（非 fail-open）：徽章寧可低估存活也不誤報綠燈。唯讀，不搶鎖。 */
export function readBotAlive(dataDir, isPidAliveFn = defaultIsPidAlive) {
  const pidFile = join(dataDir, 'bot.lock', 'pid.json')
  if (!existsSync(pidFile)) return false
  try {
    const parsed = JSON.parse(readFileSync(pidFile, 'utf8'))
    const pid = parsed && parsed.pid
    if (typeof pid !== 'number' || !Number.isInteger(pid) || pid <= 0) return false
    return isPidAliveFn(pid)
  } catch {
    return false
  }
}

/** 讀 dataDir/silence.json 的 untilIso；缺檔/壞檔/已過期一律回 null（鏡像 src/bot/silence.ts isSilenced，
 * 唯讀複製其判定邏輯，不 import kernel）。 */
export function readSilencedUntil(dataDir, now = new Date()) {
  const file = join(dataDir, 'silence.json')
  if (!existsSync(file)) return null
  try {
    const raw = JSON.parse(readFileSync(file, 'utf8'))
    if (typeof raw !== 'object' || raw === null) return null
    const untilIso = raw.untilIso
    if (typeof untilIso !== 'string') return null
    const untilMs = new Date(untilIso).getTime()
    if (Number.isNaN(untilMs)) return null
    return untilMs > now.getTime() ? untilIso : null
  } catch {
    return null
  }
}

// ---------- 駕駛艙讀取層（GOAL cockpit 2026-07-28）：全部唯讀 fail-open，單一來源壞回空值。 ----------
const COCKPIT_WINDOW_DAYS = 7

/** 近 7 日各引擎成敗統計（獨立唯讀連線，鏡像 readRecentAttempts 慣例）。 */
export function readEngineStats7d(dbPath, now = new Date()) {
  if (!existsSync(dbPath)) return []
  let db
  try {
    const nowMs = now.getTime()
    if (!Number.isFinite(nowMs)) return []
    db = new Database(dbPath, { readonly: true, fileMustExist: true })
    const nowIso = now.toISOString()
    const since = new Date(nowMs - COCKPIT_WINDOW_DAYS * 86400000).toISOString()
    const todayStart = `${nowIso.slice(0, 10)}T00:00:00.000Z`
    const todayEnd = new Date(Date.parse(todayStart) + 86400000).toISOString()
    return db.prepare(
      `SELECT COALESCE(NULLIF(engine,''),'(未標)') AS engine,
              COUNT(*) AS n,
              COALESCE(SUM(CASE WHEN ok = 1 THEN 1 ELSE 0 END),0) AS ok,
              COALESCE(SUM(CASE WHEN ts >= ? AND ts < ? THEN 1 ELSE 0 END),0) AS todayAttempts
       FROM attempts WHERE ts >= ? AND ts <= ?
       GROUP BY 1 ORDER BY n DESC, engine ASC`
    ).all(todayStart, todayEnd, since, nowIso).map(r => ({
      engine: r.engine, n: r.n, ok: r.ok, todayAttempts: r.todayAttempts,
    }))
  } catch { return [] } finally { try { db?.close() } catch { /* ignore */ } }
}

/** 隔離中引擎（engine-routing-state.json isolated，untilTs 未過期者）。 */
export function readIsolatedEngines(dataDir, now = new Date()) {
  try {
    const raw = JSON.parse(readFileSync(join(dataDir, 'engine-routing-state.json'), 'utf8'))
    const iso = raw && typeof raw === 'object' ? raw.isolated : null
    if (!iso || typeof iso !== 'object') return []
    const out = []
    for (const [engine, entry] of Object.entries(iso)) {
      if (!entry || typeof entry !== 'object') continue
      const untilMs = new Date(entry.untilTs ?? '').getTime()
      if (Number.isNaN(untilMs) || untilMs <= now.getTime()) continue
      out.push({ engine, untilTs: entry.untilTs, reason: typeof entry.reason === 'string' ? entry.reason : '' })
    }
    return out
  } catch { return [] }
}

/** 組裝戰績面板；DB、routing-state、config cap 三來源各自 fail-open。 */
export function buildEnginePanel({ dbPath, dataDir, engines }, now = new Date()) {
  const stats = readEngineStats7d(dbPath, now)
  const isolated = readIsolatedEngines(dataDir, now)
  const caps = {}
  try {
    for (const [tag, cfg] of Object.entries(engines ?? {})) {
      if (!cfg || typeof cfg !== 'object') continue
      const cap = Number.isInteger(cfg.dailyAttemptCap) && cfg.dailyAttemptCap > 0 ? cfg.dailyAttemptCap : null
      caps[tag] = { dailyAttemptCap: cap, subscription: !!cfg.subscription }
    }
  } catch { /* config cap 來源失敗時仍保留 DB 與隔離資料 */ }

  const byEngine = new Map(stats.map(row => [row.engine, row]))
  const names = new Set([
    ...stats.map(row => row.engine),
    ...isolated.map(row => row.engine),
    ...Object.entries(caps).filter(([, cap]) => cap.dailyAttemptCap !== null).map(([tag]) => tag),
  ])
  const rows = [...names].map(engine => {
    const stat = byEngine.get(engine)
    const cap = caps[engine] ?? { dailyAttemptCap: null, subscription: false }
    const attempts = stat?.n ?? 0
    const todayAttempts = stat?.todayAttempts ?? 0
    return {
      engine, n: attempts, attempts, ok: stat?.ok ?? 0,
      successRate: attempts > 0 ? (stat?.ok ?? 0) / attempts : null,
      todayAttempts,
      dailyAttemptCap: cap.dailyAttemptCap,
      quotaRemaining: cap.dailyAttemptCap === null ? null : Math.max(0, cap.dailyAttemptCap - todayAttempts),
      subscription: cap.subscription,
    }
  })
  rows.sort((a, b) => b.attempts - a.attempts || a.engine.localeCompare(b.engine))
  return { engines: rows, isolated }
}

/** guardian-runs.jsonl 尾 n 筆（最新在前）；純允許清單欄位輸出。 */
export function readGuardianTail(dataDir, n = 10) {
  const lines = readLines(join(dataDir, 'guardian-runs.jsonl')).slice(-n)
  const out = []
  for (const line of lines) {
    try {
      const r = JSON.parse(line)
      out.push({
        ts: r.ts, status: r.status, summary: typeof r.summary === 'string' ? r.summary : '',
        durationMs: typeof r.durationMs === 'number' ? r.durationMs : null,
        inputTokens: typeof r.inputTokens === 'number' ? r.inputTokens : null,
        outputTokens: typeof r.outputTokens === 'number' ? r.outputTokens : null,
        model: typeof r.model === 'string' ? r.model : '',
      })
    } catch { /* 壞行跳過 */ }
  }
  return out.reverse()
}

/** 近 7 日機制成效計數（merge-rebased / author-northstar-reject / engine-route-isolated）。 */
export function readMechanismCounts(dataDir, now = new Date()) {
  const sinceMs = now.getTime() - COCKPIT_WINDOW_DAYS * 86400000
  const counts = { mergeRebased: 0, northstarReject: 0, engineIsolated: 0 }
  for (const line of readLines(join(dataDir, 'events.jsonl'))) {
    try {
      const e = JSON.parse(line)
      const tsMs = new Date(e.ts ?? '').getTime()
      if (Number.isNaN(tsMs) || tsMs < sinceMs) continue
      if (e.type === 'merge-rebased') counts.mergeRebased++
      else if (e.type === 'author-northstar-reject') counts.northstarReject++
      else if (e.type === 'engine-route-isolated') counts.engineIsolated++
    } catch { /* 壞行跳過 */ }
  }
  return counts
}

const BLOCKED_NOTE_RE = /\s*<!--\s*adng:blocked\b[\s\S]*?-->/

/** blocked 任務明細：直接掃 backlog 原始行（reason 只存在行內註記，Task 型別不帶）。 */
export function readBlockedTasks(backlogFile) {
  const out = []
  let lines
  try { lines = readFileSync(backlogFile, 'utf8').split(/\r?\n/) } catch { return out }
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    if (!/^- \[ \]/.test(raw) || !/<!--\s*adng:blocked\b/.test(raw)) continue
    const reason = raw.match(/adng:blocked\s+reason="([^"]*)"/)?.[1] ?? ''
    const text = raw.replace(/<!--[\s\S]*?-->/g, '').replace(/^- \[ \]\s*/, '').trim()
    out.push({ line: i + 1, text, reason })
  }
  return out
}

/** 一鍵重開：移除指定行的 adng:blocked 註記（其餘註記原樣保留）。line 為 1-based；
 * 行號＋match 文字雙鍵核對（防 daemon 同時改檔造成行漂移誤改），對不上或已重開 → changed:false 冪等。
 * ponytail: read-modify-write 無鎖——與人工手改同級的競態風險，daemon 每輪重讀 backlog 自癒。 */
export function reopenBlockedLine(backlogFile, line, match) {
  try {
    if (!existsSync(backlogFile) || !Number.isInteger(line) || line < 1 || typeof match !== 'string' || !match) {
      return { ok: true, changed: false }
    }
    const content = readFileSync(backlogFile, 'utf8')
    const eol = content.includes('\r\n') ? '\r\n' : '\n'
    const lines = content.split(/\r?\n/)
    const idx = line - 1
    const raw = lines[idx]
    if (typeof raw !== 'string' || !raw.includes(match) || !/<!--\s*adng:blocked\b/.test(raw)) {
      return { ok: true, changed: false }
    }
    lines[idx] = raw.replace(BLOCKED_NOTE_RE, '')
    writeFileSync(backlogFile, lines.join(eol))
    return { ok: true, changed: true }
  } catch (err) {
    return { ok: false, changed: false, error: String(err) }
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
  const start = () => {
    if (opts.stopFile && existsSync(opts.stopFile)) return { paused: true }
    const logPath = join(dataDir, 'run-once-console.log')
    const logFd = openSync(logPath, 'a')
    const child = spawnFn(process.execPath, [DIST_CLI, 'run-once', '--config', cfgPath], { stdio: ['ignore', logFd, logFd] })
    state.runOnce = child
    return { paused: false, child, logPath }
  }
  const started = opts.stopFile ? withWebPauseGate(opts.stopFile, start) : start()
  if (started.paused) return { paused: true }
  const { child, logPath } = started
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
  const started = withWebPauseGate(stopFile, () => {
    if (isAlive(state.daemon) || lockOwnerFn(dataDir) === 'ALIVE') {
      return { alreadyRunning: true, pid: state.daemon?.pid }
    }
    // start＝同一原子閘內恢復並啟動；並行 pause 只能排在 spawn 前或後，不會插入兩者之間。
    try { if (existsSync(stopFile)) rmSync(stopFile, { force: true }) } catch { /* 觀測/控制面不可反殺 */ }
    const logPath = join(dataDir, 'daemon-console.log')
    const logFd = openSync(logPath, 'a')
    const child = spawnFn(process.execPath, [DIST_CLI, 'daemon', '--config', cfgPath], {
      stdio: ['ignore', logFd, logFd], detached: true,
    })
    if (typeof child.unref === 'function') child.unref()
    state.daemon = child
    return { alreadyRunning: false, child, logPath }
  })
  if (started.alreadyRunning) return started
  const { child, logPath } = started
  // daemon 語意：treatCleanExitAsSuccess=false——800ms 內任何退出（含 exit 0）皆算失敗（daemon 本該長命）。
  const outcome = await verifyChildExit(child, waitMs, sleep, logPath, false)
  if (outcome?.failed) return outcome
  return { alreadyRunning: false, pid: child.pid }
}

/** daemon stop：寫既有 stopFile 機制（scheduler.runOnce 每輪開頭 existsSync 檢查），不碰 lock/kill。 */
export function stopDaemon(stopFile) {
  try {
    withWebPauseGate(stopFile, () => writeFileSync(stopFile, ''))
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

// ---------- M9：bot handler 複用（panel 查詢 + goal/silence 控制） ----------
// 延遲載入：模組載入當下不強制 dist/bot/handlers.js 存在，只在真的打到 panel/goal/silence
// 端點時才 import（鏡像既有 main() 對 dist/cli.js 的延遲載入慣例）。快取 promise 避免重複 import。
let handleCommandPromise
function getHandleCommand() {
  if (!handleCommandPromise) {
    handleCommandPromise = import(new NodeURL('../dist/bot/handlers.js', import.meta.url).href)
      .then(m => m.handleCommand)
  }
  return handleCommandPromise
}

/** server 啟動時用既有 config 組一份 BotDeps，鏡像 src/bot/index.ts 的組法：llm 用 cfg.judge*、
 * cfgPath 就是 --config 參數。每請求共用同一份（不重複 assemble，sqlite 連線沿用既有 deps.db）。
 * events 為長壽 EventLog 實例（M9.4 fast-follow #2：doAsk 不再每呼叫自建一份 O(n) 全檔讀）
 * ——呼叫端須提供，此函式本身不建構（main() 已有 assemble() 組好的 deps.events 可直接沿用）。 */
export function buildBotDeps({ cfg, store, db, cfgPath, events }) {
  return { cfg, store, db, llm: { url: cfg.judgeUrl, model: cfg.judgeModel, apiKey: cfg.judgeApiKey }, cfgPath, events }
}

// 動態 import dist/events.js（鏡像 getHandleCommand 的 promise 快取式動態載入慣例，避免
// module 頂層靜態 import 依賴 dist 建置順序）——只有 createRequestHandler 收不到 ctx.botDeps
// 的 fallback 路徑（目前僅測試會走到）才需要在這裡自建一份長壽 EventLog；main() 正式啟動
// 路徑一律沿用 assemble() 已組好的 deps.events，不會走到這個 fallback。
let eventLogClassPromise
function getEventLogClass() {
  if (!eventLogClassPromise) {
    eventLogClassPromise = import(new NodeURL('../dist/events.js', import.meta.url).href).then(m => m.EventLog)
  }
  return eventLogClassPromise
}

const PANEL_NAMES = new Set(['status', 'cost', 'backlog', 'log', 'lessons', 'goal'])

/** 讀 POST body 並解析 JSON；缺 body／壞 JSON 一律回 {}（沿用專案 fail-open 慣例，不 throw）。
 * 1MB 上限防禦性截斷（本機控制台不預期大 body）。
 * destroy() 後加 close 兜底以防 promise 永不 resolve。 */
function readJsonBody(req) {
  return new Promise(resolveBody => {
    let data = ''
    req.on('data', chunk => {
      data += chunk
      if (data.length > 1_000_000) req.destroy()
    })
    req.on('end', () => {
      try { resolveBody(JSON.parse(data || '{}')) } catch { resolveBody({}) }
    })
    req.on('error', () => resolveBody({}))
    req.on('close', () => resolveBody({}))
  })
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

// botDeps 延遲、快取一次組成：ctx.botDeps 已提供（main() 正式路徑）直接沿用；否則（目前僅測試）
// 動態 import dist/events.js 現組一份長壽 EventLog。WeakMap keyed by ctx 物件本身——單專案模式
// ctx 恆為同一物件（等效原本的閉包變數快取）；多專案模式每個 project 的 ctx 各自快取一份。
const botDepsCache = new WeakMap()
function getBotDepsFor(ctx) {
  if (ctx.botDeps) return Promise.resolve(ctx.botDeps)
  if (!botDepsCache.has(ctx)) {
    botDepsCache.set(ctx, getEventLogClass().then(EventLog =>
      buildBotDeps({ cfg: ctx.cfg, store: ctx.store, db: ctx.db, cfgPath: ctx.cfgPath, events: new EventLog(ctx.cfg.dataDir) })))
  }
  return botDepsCache.get(ctx)
}

// ---------- HTTP routing ----------
// ctxOrMap：單專案模式（--config）傳入單一 ctx 物件——沿用既有行為，project 參數在此模式下被
// 忽略（回歸硬線，byte-identical）。多專案模式（--configs-dir）傳入 Map<name, ctx>（main() 組出）：
// 除首頁與「/api/status 無 project」彙總端點外，其餘全部端點要求 ?project=<name>：缺→400，
// 未知→404。
export function createRequestHandler(ctxOrMap) {
  const isMulti = ctxOrMap instanceof Map
  const anyCtx = isMulti ? ctxOrMap.values().next().value : ctxOrMap

  return async function handle(req, res) {
    const url = new NodeURL(req.url, 'http://127.0.0.1')
    const send = (code, body, headers = {}) => {
      res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', ...headers })
      res.end(JSON.stringify(body))
    }

    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(anyCtx.indexHtml)
      return
    }
    if (req.method === 'GET' && url.pathname === '/github.mjs') {
      res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' })
      res.end(readFileSync(join(HERE, 'github.mjs'), 'utf8')); return
    }

    // 多專案彙總端點：/api/status 無 project 參數 → 回全部專案摘要（供首頁卡片，Task 8）。
    if (isMulti && req.method === 'GET' && url.pathname === '/api/status' && !url.searchParams.get('project')) {
      const projects = []
      for (const [name, pctx] of ctxOrMap) projects.push(buildProjectSummary(name, pctx))
      send(200, { projects })
      return
    }

    // 多專案模式下解析 project 參數：缺→400；未知→404。單專案模式恆用唯一 ctx（忽略 project）。
    let ctx
    if (isMulti) {
      const name = url.searchParams.get('project')
      if (!name) { send(400, { error: 'project required' }); return }
      ctx = ctxOrMap.get(name)
      if (!ctx) { send(404, { error: 'unknown project' }); return }
    } else {
      ctx = ctxOrMap
    }
    const { cfg, cfgPath, store, db, dbPath, token, spawnFn, childState, localDayFn, spawnOpts } = ctx
    const getBotDeps = () => getBotDepsFor(ctx)
    const getCommandHandler = () => ctx.handleCommand ? Promise.resolve(ctx.handleCommand) : getHandleCommand()
    if (url.pathname === '/api/github' && ['GET', 'POST'].includes(req.method)) {
      if (!hasValidToken(req, url, token)) { send(403, { error: 'GitHub 案件需要控制台 token' }); return }
      const input = req.method === 'POST' ? await readJsonBody(req) : {}
      const { githubConsole } = await import('../dist/github/console.js')
      try { send(200, await githubConsole(cfgPath, input)) }
      catch (error) { send(409, { error: String(error) }) }
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
    // 駕駛艙讀取端點（GOAL cockpit）：GET 無副作用，鏡像 /api/status 不設 CSRF；各來源 fail-open。
    if (req.method === 'GET' && url.pathname === '/api/cockpit/engines') {
      send(200, buildEnginePanel({ dbPath, dataDir: cfg.dataDir, engines: cfg.engines }))
      return
    }
    if (req.method === 'GET' && url.pathname === '/api/cockpit/blocked') {
      send(200, { blocked: readBlockedTasks(cfg.backlogFile) })
      return
    }
    if (req.method === 'GET' && url.pathname === '/api/cockpit/guardian') {
      send(200, { runs: readGuardianTail(cfg.dataDir) })
      return
    }
    if (req.method === 'GET' && url.pathname === '/api/cockpit/mechanisms') {
      send(200, readMechanismCounts(cfg.dataDir))
      return
    }
    // 讀取層，鏡像 /api/status 不設 CSRF（GET 無副作用）。name 白名單外一律 404。
    if (req.method === 'GET' && url.pathname.startsWith('/api/panel/')) {
      const name = url.pathname.slice('/api/panel/'.length)
      if (!PANEL_NAMES.has(name)) { send(404, { error: 'not found' }); return }
      try {
        const handleCommand = await getCommandHandler()
        const r = await handleCommand(name, name === 'goal' ? 'status' : '', await getBotDeps())
        send(200, { ok: r.ok, text: r.text })
      } catch (err) {
        send(500, { error: String(err) })
      }
      return
    }

    if (url.pathname.startsWith('/api/')) {
      if (!hasValidToken(req, url, token)) { send(403, { error: 'forbidden：CSRF token 缺失或錯誤' }); return }

      if (req.method === 'POST' && url.pathname === '/api/run-once') {
        const r = await spawnRunOnce(childState, spawnFn, cfgPath, cfg.dataDir, { ...spawnOpts, stopFile: cfg.stopFile })
        if (r.paused) { send(409, { status: 'paused' }); return }
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
      // M9.1 控制端點：pause/resume/task 比照 goal/silence 慣例，零重複業務邏輯全部轉呼叫既有
      // handleCommand（注入防護／換行拒收皆在 handler 內建，此處原樣透傳拒收文案）。
      if (req.method === 'POST' && url.pathname === '/api/pause') {
        const handleCommand = await getCommandHandler()
        const r = await handleCommand('pause', '', await getBotDeps())
        send(200, { ok: r.ok, text: r.text })
        return
      }
      if (req.method === 'POST' && url.pathname === '/api/resume') {
        const handleCommand = await getCommandHandler()
        const r = await handleCommand('resume', '', await getBotDeps())
        send(200, { ok: r.ok, text: r.text })
        return
      }
      // 駕駛艙控制：一鍵重開 blocked（行號＋文字雙鍵核對，冪等）。
      if (req.method === 'POST' && url.pathname === '/api/backlog/reopen') {
        const body = await readJsonBody(req)
        const r = reopenBlockedLine(cfg.backlogFile, Number(body.line), String(body.match ?? ''))
        send(r.ok ? 200 : 500, r)
        return
      }
      if (req.method === 'POST' && url.pathname === '/api/task') {
        const body = await readJsonBody(req)
        const handleCommand = await getCommandHandler()
        const r = await handleCommand('task', String(body.text ?? ''), await getBotDeps())
        send(200, { ok: r.ok, text: r.text })
        return
      }
      // M9 控制端點：零重複業務邏輯，全部轉呼叫既有 handleCommand（注入防護／lock 防雙跑皆在 handler 內建）。
      if (req.method === 'POST' && url.pathname === '/api/goal/set') {
        const body = await readJsonBody(req)
        const handleCommand = await getCommandHandler()
        const r = await handleCommand('goal', 'set ' + String(body.text ?? ''), await getBotDeps())
        send(200, { ok: r.ok, text: r.text })
        return
      }
      if (req.method === 'POST' && url.pathname === '/api/goal/run') {
        const handleCommand = await getCommandHandler()
        const r = await handleCommand('goal', 'run', await getBotDeps())
        send(200, { ok: r.ok, text: r.text })
        return
      }
      if (req.method === 'POST' && url.pathname === '/api/goal/stop') {
        const handleCommand = await getCommandHandler()
        const r = await handleCommand('goal', 'stop', await getBotDeps())
        send(200, { ok: r.ok, text: r.text })
        return
      }
      if (req.method === 'POST' && url.pathname === '/api/silence') {
        const body = await readJsonBody(req)
        const handleCommand = await getCommandHandler()
        const r = await handleCommand('silence', String(body.minutes ?? ''), await getBotDeps())
        send(200, { ok: r.ok, text: r.text })
        return
      }
    }

    send(404, { error: 'not found' })
  }
}

export function createServer(ctx) {
  const handle = createRequestHandler(ctx)
  return httpCreateServer((req, res) => {
    void handle(req, res).catch(err => {
      if (res.headersSent) { res.end(); return }
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ error: String(err) }))
    })
  })
}

// ---------- bootstrap（真跑：組 deps、印 token+URL、bind 127.0.0.1:3900） ----------
const PORT = 3900

// M9.4 fast-follow #4：port 被佔用時（常駐排程 respawn 撞上舊實例仍在跑，等效單例守衛）乾淨退出，
// 而非放給 Node 當 uncaught exception 印一堆 stack trace 雜訊。單專案／多專案共用同一組 listen 邏輯。
function startHttpServer(server, token) {
  server.on('error', e => {
    if (e.code === 'EADDRINUSE') {
      console.log(`[web] port ${PORT} 已被佔用，本實例退出（單例守衛）`)
      process.exit(0)
    }
    throw e
  })
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[web] autodev-ng 控制台已啟動：http://127.0.0.1:${PORT}/?token=${token}`)
    console.log(`[web] CSRF token: ${token}`)
    console.log('[web] 僅 bind 127.0.0.1，非本機請求一律無法連入。')
  })
}

/** 多專案入口（M10.5 Task 7）：逐 config assemble，壞檔跳過+warn（fail-open，鏡像 bot mainMulti）。
 * CSRF token 改共用 <repo root>/data/web-console.token（loadOrCreateToken 換入參）。 */
async function mainMulti(configsDir) {
  const { listProjectConfigs } = await import(new NodeURL('../dist/bot/config.js', import.meta.url).href)
  const { assemble } = await import(new NodeURL('../dist/cli.js', import.meta.url).href)
  const { localDay } = await import(new NodeURL('../dist/db.js', import.meta.url).href)

  const indexHtml = readFileSync(INDEX_HTML, 'utf8')
  // repo root：configsDir 的上一層（鏡像 src/bot/index.ts mainMulti 的 bot.lock 路徑推導）。
  const repoDataDir = join(dirname(resolve(configsDir)), 'data')
  mkdirSync(repoDataDir, { recursive: true })
  const token = loadOrCreateToken(repoDataDir)

  const projects = new Map()
  for (const { name, cfgPath } of listProjectConfigs(configsDir)) {
    try {
      const { deps, cfg } = assemble(cfgPath)
      const resolvedCfgPath = resolve(cfgPath)
      projects.set(name, {
        cfg, cfgPath: resolvedCfgPath, store: deps.store, db: deps.db,
        dbPath: join(cfg.dataDir, 'run.db'), token, spawnFn: nodeSpawn,
        childState: createChildState(), indexHtml, localDayFn: localDay,
        botDeps: buildBotDeps({ cfg, store: deps.store, db: deps.db, cfgPath: resolvedCfgPath, events: deps.events }),
      })
    } catch (err) {
      console.warn(`[web] 專案 ${name} 載入失敗，已跳過：`, err instanceof Error ? err.message : String(err))
    }
  }
  if (projects.size === 0) {
    console.error('configs-dir 下沒有任何專案成功載入，無法啟動 web')
    process.exitCode = 1
    return
  }

  const server = createServer(projects)
  startHttpServer(server, token)
  process.on('SIGINT', () => {
    for (const ctx of projects.values()) ctx.db.close()
    server.close(() => process.exit(0))
  })
}

async function main() {
  const { configPath, configsDir } = parseArgs(process.argv.slice(2))
  if (configsDir) {
    await mainMulti(configsDir)
    return
  }
  if (!configPath) {
    console.error('用法：node web/server.mjs --config <path> 或 --configs-dir <dir>')
    process.exitCode = 1
    return
  }
  const { assemble } = await import(new NodeURL('../dist/cli.js', import.meta.url).href)
  const { localDay } = await import(new NodeURL('../dist/db.js', import.meta.url).href)
  const { deps, cfg } = assemble(configPath)
  const cfgPath = resolve(configPath) // 供 spawn 端點沿用同一份 config（僅路徑，非 secret）

  const indexHtml = readFileSync(INDEX_HTML, 'utf8')
  const token = loadOrCreateToken(cfg.dataDir)
  const childState = createChildState()
  const botDeps = buildBotDeps({ cfg, store: deps.store, db: deps.db, cfgPath, events: deps.events })
  const server = createServer({
    cfg, cfgPath, store: deps.store, db: deps.db, dbPath: join(cfg.dataDir, 'run.db'),
    token, spawnFn: nodeSpawn, childState, indexHtml, localDayFn: localDay, botDeps,
  })

  startHttpServer(server, token)
  process.on('SIGINT', () => { deps.db.close(); server.close(() => process.exit(0)) })
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch(err => { console.error(err instanceof Error ? err.message : String(err)); process.exitCode = 1 })
}
