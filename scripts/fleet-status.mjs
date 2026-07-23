// fleet-status.mjs — 一眼看清 autodev-ng 全 fleet 狀態（一次性，無 server）。
// 用法：node scripts/fleet-status.mjs
// 讀既有資料來源（configs/*.json、data/<d>/heartbeat.json、GOAL.md、daemon.lock、run.db），
// 不 import scheduler、不入 kernel 帳。所有讀取 fail-open：缺檔/損壞顯示「—」不炸。
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import Database from 'better-sqlite3'

// 與 supervisor 一致的 engine 進程名（src/supervisor/health.ts）——殼進程 wsl/cmd/conhost 不算。
const ENGINE_PROCESS_NAMES = new Set(['node.exe','codex.exe','opencode.exe','devin.exe','python.exe','bun.exe','grok.exe'])
// 一次抓全系統 pid→{ppid,name}，node 端建樹（fail-open：抓不到回 null → 視為有 engine，不誤報 wedge）
function buildProcMap() {
  try {
    const out = execSync('powershell.exe -NoProfile -Command "Get-CimInstance Win32_Process | ForEach-Object { \\"$($_.ProcessId),$($_.ParentProcessId),$($_.Name)\\" }"', { encoding: 'utf8', timeout: 15000 })
    const map = new Map()
    for (const line of out.split('\n')) {
      const [pid, ppid, name] = line.trim().split(',')
      if (pid) map.set(Number(pid), { ppid: Number(ppid), name: (name||'').toLowerCase() })
    }
    return map
  } catch { return null }
}
function hasEngineDescendant(rootPid, procMap) {
  if (!procMap) return true // fail-open：探測失敗當作有 engine，寧可不報 wedge
  const kids = new Map()
  for (const [pid, info] of procMap) { if (!kids.has(info.ppid)) kids.set(info.ppid, []); kids.get(info.ppid).push(pid) }
  const stack = [...(kids.get(rootPid) ?? [])]
  const seen = new Set()
  while (stack.length) {
    const pid = stack.pop(); if (seen.has(pid)) continue; seen.add(pid)
    if (ENGINE_PROCESS_NAMES.has(procMap.get(pid)?.name)) return true
    stack.push(...(kids.get(pid) ?? []))
  }
  return false
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const now = Date.now()
const nowIso = new Date(now).toISOString().slice(0, 19) + 'Z'
const STALE_MS = 30 * 60 * 1000 // 對齊 supervisor DEFAULT_STALE_THRESHOLD_MS

// 免費層（不消耗主訂閱額度）：devin(swe-1.6 0 ACU)、opencode(oc-*)、agy(自帳號)
const isFree = (e) => /^(devin|oc-|agy)/.test(e)
const tierOf = (e) =>
  /^devin/.test(e) ? '免費(0 ACU)'
  : /^oc-/.test(e) ? '免費(opencode)'
  : /^agy/.test(e) ? '免費(自帳號)'
  : /^codex|^qwen-gpt/.test(e) ? 'ChatGPT 額度'
  : /^grok|^qwen-grok/.test(e) ? 'xAI 額度'
  : /^claude/.test(e) ? '真金 $$'
  : '其他'

const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')) } catch { return null } }
const pidAlive = (pid) => { try { process.kill(pid, 0); return true } catch (e) { return e.code === 'EPERM' } }
const ageStr = (ms) => ms < 0 ? '—' : ms < 90_000 ? `${Math.round(ms/1000)}s前` : ms < 5_400_000 ? `${Math.round(ms/60000)}分前` : `${(ms/3600000).toFixed(1)}h前`
const pct = (ok, n) => n ? `${Math.round(100*ok/n)}%` : '—'

// 探索 daemon：configs/*.json，dataDir = config.dataDir 或 data/<basename>
const configs = readdirSync(join(ROOT, 'configs')).filter(f => f.endsWith('.json'))
const daemons = configs.map(f => {
  const name = f.replace(/\.json$/, '')
  const cfg = readJson(join(ROOT, 'configs', f)) ?? {}
  // config 的 dataDir 是相對 configs/ 目錄（daemon 也這樣解析）
  const dataDir = cfg.dataDir ? resolve(ROOT, 'configs', cfg.dataDir) : join(ROOT, 'data', name)
  return { name, cfg, dataDir }
})

console.log(`\n autodev-ng fleet 狀態   ${nowIso}`)
console.log('='.repeat(72))

const procMap = buildProcMap() // 一次抓全系統進程樹，供 wedge 判定
const fleetAttempts = {} // engine -> {n,ok}
for (const d of daemons) {
  const hb = readJson(join(d.dataDir, 'heartbeat.json'))
  const lock = readJson(join(d.dataDir, 'daemon.lock', 'pid.json'))
  const pid = lock?.pid
  const alive = pid ? pidAlive(pid) : false
  const hbAge = hb?.ts ? now - Date.parse(hb.ts) : -1
  const stale = alive && hbAge > STALE_MS
  const engineChild = stale && pid ? hasEngineDescendant(pid, procMap) : false
  const wedged = stale && !engineChild // 有 engine 子進程＝合法長任務，不算 wedge（對齊 supervisor）
  // 當前 GOAL 首行
  let goal = '—'
  try {
    const lines = readFileSync(join(d.dataDir, 'GOAL.md'), 'utf8').split('\n')
      .map(l => l.trim()).filter(l => l && l !== '# GOAL' && !l.startsWith('#'))
    if (lines[0]) goal = lines[0].slice(0, 46)
  } catch {}
  const dot = wedged ? '⚠' : alive ? '●' : '○'
  console.log(`\n ${dot} ${d.name.padEnd(20)} pid ${String(pid ?? '—').padEnd(7)} ${(alive ? (hb?.state ?? '?') : 'DEAD').padEnd(9)} hb ${ageStr(hbAge).padEnd(7)}`)
  console.log(`   GOAL: ${goal}`)
  if (wedged) console.log(`   ⚠ 疑似 wedge：存活但 heartbeat 已 ${ageStr(hbAge)}（>30分）且無 engine 子進程`)
  else if (stale) console.log(`   ⏳ 長任務執行中：heartbeat ${ageStr(hbAge)}，但有 engine 子進程在跑（正常）`)
  // 今日 attempts（heartbeat todayAttempts）
  const ta = hb?.todayAttempts ?? {}
  const engs = Object.keys(ta)
  if (engs.length) {
    const parts = engs.sort((a,b)=>ta[b].n-ta[a].n).map(e => `${e} ${ta[e].ok}/${ta[e].n}`)
    console.log(`   今日: ${parts.join('  ')}`)
    for (const e of engs) { fleetAttempts[e] ??= {n:0,ok:0}; fleetAttempts[e].n += ta[e].n; fleetAttempts[e].ok += ta[e].ok }
  }
}

// ── fleet 今日引擎彙總 + 免費層佔比（#4 devin 主力效果） ──
console.log('\n' + '─'.repeat(72))
console.log(' 今日全 fleet 各引擎（heartbeat todayAttempts 彙總）')
const rows = Object.entries(fleetAttempts).sort((a,b)=>b[1].n-a[1].n)
let freeN = 0, totN = 0
console.log('   ' + '引擎'.padEnd(16) + 'n'.padStart(4) + 'ok'.padStart(4) + '成功率'.padStart(8) + '  層級')
for (const [e, s] of rows) {
  const star = /^devin/.test(e) ? ' ★' : ''
  console.log('   ' + (e+star).padEnd(16) + String(s.n).padStart(4) + String(s.ok).padStart(4) + pct(s.ok,s.n).padStart(8) + '  ' + tierOf(e))
  totN += s.n; if (isFree(e)) freeN += s.n
}
if (totN) console.log(`\n   免費層佔比（devin + oc-* + agy）：${Math.round(100*freeN/totN)}%  （${freeN}/${totN} attempts，不燒主訂閱額度）`)

// ── run.db 各引擎累計成功率（devin 主力效果的長期基準） ──
console.log('\n' + '─'.repeat(72))
console.log(' run.db 累計成功率（近 7 天，devin ★；主力化前後可對照）')
const since = new Date(now - 7*86400000).toISOString()
for (const d of daemons) {
  const dbPath = join(d.dataDir, 'run.db')
  if (!existsSync(dbPath)) continue
  try {
    const db = new Database(dbPath, { readonly: true })
    const rs = db.prepare('SELECT engine, COUNT(*) n, SUM(ok) ok FROM attempts WHERE ts >= ? GROUP BY engine ORDER BY n DESC').all(since)
    db.close()
    if (!rs.length) continue
    const line = rs.map(r => `${r.engine}${/^devin/.test(r.engine)?'★':''} ${r.ok}/${r.n}(${pct(r.ok,r.n)})`).join('  ')
    console.log(`   ${d.name}: ${line}`)
  } catch { /* fail-open */ }
}
console.log('')
