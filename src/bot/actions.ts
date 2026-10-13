import {
  appendFileSync, closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync,
  renameSync, statSync, unlinkSync, writeFileSync
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { setSilence, clearSilence } from './silence.js'
import { callAgent } from '../autopilot/llm.js'
import { withBacklogLock } from '../backlog.js'
import { withPauseGate } from '../supervisor/pause-gate.js'
import type { BotDeps, CmdResult } from './handlers.js'

const TASK_TEXT_NEWLINE_ERR = '任務內容不可含換行'
const TASK_TEXT_COMMENT_ERR = '任務內容含不允許字元(<!-- -->)'

/** 鐵律 #1：使用者輸入是不受信任的注入面。換行會讓一行使用者文字在 backlog 檔裡
 * 憑空多生出偽任務行（含偽 `<!-- adng:done ... -->` 狀態註記）；`<!--`/`-->` 會讓
 * parseBacklog 把整個 rawLine 誤判為 adng 註記（偽冒 source:'autopilot' 或偽造狀態）。
 * 拒收優先，不做逃逸/轉義魔法——回 null 表合法，否則回人話錯誤訊息。 */
function findTaskTextViolation(text: string): string | null {
  if (/[\r\n]/.test(text)) return TASK_TEXT_NEWLINE_ERR
  if (text.includes('<!--') || text.includes('-->')) return TASK_TEXT_COMMENT_ERR
  return null
}

/** /task 內部寫入：讀現檔（缺檔視為空，僅為算分隔符，不再整檔重寫）+ 確保結尾換行 +
 * appendFileSync 原子 append 純 `- [ ] text` 行（無 adng:autopilot 註記，parseBacklog
 * 讀回 source:'user'，鐵律 #1：不冒充系統自主任務）。
 * 防禦第二層：即使呼叫端（doTask）漏檢，此處仍 throw 擋下換行/HTML 註解，防未來別的
 * 呼叫端繞過 handler 直接注入 backlog 檔。
 * 鎖協議：「讀 cur 判斷分隔符 → appendFileSync 落地」三行整段包在 withBacklogLock 內。
 * 舊版（Fix 2）僅靠 appendFileSync 單一 syscall 級 append 縮小撕裂窗，仍留極窄
 * lost-update 殘窗——daemon report() 的整檔重寫若恰好夾在「讀 cur」與「落地」之間
 * 開始並完成，會用舊內容覆蓋掉這次新 append 的行。改用檔級鎖後，bot 與 daemon
 * 對同一 backlog 檔的讀寫互斥，此殘窗徹底消失（不是縮小，是消滅）。
 * 協議細節（等待上限/stale 判定/強拆語意）見 src/backlog.ts withBacklogLock 與
 * .superpowers/sdd/task-3-report.md。 */
export function appendUserTask(backlogFile: string, text: string): void {
  const violation = findTaskTextViolation(text)
  if (violation) throw new Error(violation)
  withBacklogLock(backlogFile, () => {
    const cur = existsSync(backlogFile) ? readFileSync(backlogFile, 'utf8') : ''
    const sep = cur.length === 0 || cur.endsWith('\n') ? '' : '\n'
    appendFileSync(backlogFile, `${sep}- [ ] ${text}\n`)
  })
}

export async function doPause(d: Pick<BotDeps, 'cfg'>): Promise<CmdResult> {
  try {
    mkdirSync(dirname(d.cfg.stopFile), { recursive: true })
    withPauseGate([d.cfg.stopFile], () => { if (!existsSync(d.cfg.stopFile)) writeFileSync(d.cfg.stopFile, 'operator pause\n', { flag: 'wx' }) })
    return { ok: true, text: '已寫入 stop 檔，daemon 將優雅停止' }
  } catch {
    return { ok: false, text: '暫停失敗，請檢查 stop 檔權限' }
  }
}

/** 缺 stopFile 也回成功文字——resume 的語意是「確保處於運作狀態」，不是「一定有檔可刪」。 */
export async function doResume(d: Pick<BotDeps, 'cfg'> & { cfgPath?: string }): Promise<CmdResult> {
  try {
    withPauseGate([d.cfg.stopFile], () => {
      if (existsSync(d.cfg.stopFile)) unlinkSync(d.cfg.stopFile)
    })
    const fleetPaused = d.cfgPath && existsSync(join(dirname(d.cfgPath), '.adng.stop'))
    return { ok: true, text: fleetPaused ? '已恢復專案旗標；車隊仍暫停，未移除車隊旗標' : '已恢復派工許可；既有 daemon 可繼續運作（本指令不啟動進程）' }
  } catch {
    return { ok: false, text: '恢復失敗，請檢查 stop 檔權限' }
  }
}

const SILENCE_USAGE = '用法：/silence <分鐘>（1-1440 設定靜音窗，0 解除靜音）'

/** setSilence 寫檔失敗會 throw，此處必須包 try/catch（鐵律：永不外拋）。 */
export async function doSilence(d: BotDeps, arg: string): Promise<CmdResult> {
  try {
    const minutes = parseInt(arg.trim(), 10)
    if (Number.isNaN(minutes)) return { ok: false, text: SILENCE_USAGE }
    if (minutes === 0) {
      clearSilence(d.cfg.dataDir)
      return { ok: true, text: '已解除靜音' }
    }
    if (minutes < 1 || minutes > 1440) return { ok: false, text: SILENCE_USAGE }
    const untilIso = setSilence(d.cfg.dataDir, minutes)
    return { ok: true, text: `已靜音至 ${untilIso}` }
  } catch {
    return { ok: false, text: '靜音設定失敗，請稍後再試' }
  }
}

export async function doTask(d: BotDeps, arg: string): Promise<CmdResult> {
  try {
    const text = arg.trim()
    if (!text) return { ok: false, text: '用法：/task <任務內容>' }
    const violation = findTaskTextViolation(text)
    if (violation) return { ok: false, text: violation }
    appendUserTask(d.cfg.backlogFile, text)
    return { ok: true, text: '已加入 backlog' }
  } catch {
    return { ok: false, text: '寫入 backlog 失敗，請稍後再試' }
  }
}

/** callAgent 本身 fail-open（無 url 或 fetch 失敗一律回空字串），這裡把空字串轉成人話。
 *
 * 入帳決策（M9.3 Task 5 Step 1 核對後裁定）：不寫 d.db.record()。db.ts 的 dayStats()/
 * digest.ts 的「完成 N 筆／失敗 M 筆」與 bot /cost 的「成功／失敗」，都是對 attempts 表
 * 不分 taskId 全表加總（SELECT SUM(ok)... WHERE ts >= ? AND ts < ?，無 task_id 篩選）。
 * 若在此以 taskId:'ask' 寫入 ok:true 的 attempts 列，會直接灌水這兩處面向使用者的「今日
 * 完成任務數」headline 指標——/ask 只是問答，不是 autopilot 任務，計入「完成」會誤導。
 * db.ts 是 kernel 頂層檔（本 task 不得動），無法用改 SQL 篩 taskId 的方式排污，因此改記
 * events.jsonl（審計可見、不進 dayStats 加總）留痕 token 用量，不記 db。 */
export async function doAsk(d: BotDeps, arg: string): Promise<CmdResult> {
  try {
    const question = arg.trim()
    if (!question) return { ok: false, text: '用法：/ask <問題>' }
    const r = await callAgent(d.llm, question)
    const text = r.text.trim() ? r.text : 'LLM 未回應'
    try {
      // M9.4 fast-follow #2：改用 BotDeps 注入的長壽 EventLog 實例，不再每呼叫
      // new EventLog(d.cfg.dataDir)（建構子 O(n) 全檔讀 events.jsonl 數行數）。
      d.events.append('ask', { tokens: r.totalTokens, q: question.slice(0, 80) })
    } catch { /* 記帳失敗不影響回覆 */ }
    return { ok: r.text.trim() ? true : false, text }
  } catch {
    return { ok: false, text: 'LLM 呼叫失敗，請稍後再試' }
  }
}

// ── /goal 指令組（set/run/status/stop）：手機下目標給 GOAL autopilot ──

const GOAL_USAGE = '用法：/goal set <目標文字> ｜ /goal run ｜ /goal status ｜ /goal stop'
const GOAL_NOT_SET = '尚未設定 GOAL（先 /goal set <目標文字>）'

function writeFileAtomic(file: string, content: string): void {
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`
  writeFileSync(tmp, content)
  renameSync(tmp, file)
}

/** dist/bot/actions.js 相對位置推回 dist/autopilot/run.js（無論安裝路徑/cwd 為何都能算對，比硬編路徑穩）。 */
function autopilotRunScript(): string {
  const here = dirname(fileURLToPath(import.meta.url))
  return join(here, '..', 'autopilot', 'run.js')
}

function splitGoalArg(arg: string): { sub: string; rest: string } {
  const trimmed = arg.trim()
  const sp = trimmed.indexOf(' ')
  return sp < 0 ? { sub: trimmed, rest: '' } : { sub: trimmed.slice(0, sp), rest: trimmed.slice(sp + 1).trim() }
}

async function goalSet(d: BotDeps, text: string): Promise<CmdResult> {
  if (!text) return { ok: false, text: '用法：/goal set <目標文字>' }
  const violation = findTaskTextViolation(text)
  if (violation) return { ok: false, text: violation }
  if (!d.cfg.goalFile) return { ok: false, text: 'config 未設 goalFile' }
  const content = `# GOAL\n${text}\n\n## 邊界\n- 連續無進展上限:3\n`
  writeFileAtomic(d.cfg.goalFile, content)
  return { ok: true, text: 'GOAL 已寫入,/goal run 啟動' }
}

/** spawnFn 可注入（測試絕不真 spawn）；雙跑防護不在此處——鎖在 autopilot/run.ts main()（Item 2），這裡只負責啟動。 */
async function goalRun(d: BotDeps, spawnFn: typeof spawn): Promise<CmdResult> {
  if (!d.cfg.goalFile || !existsSync(d.cfg.goalFile)) return { ok: false, text: GOAL_NOT_SET }
  return withPauseGate([d.cfg.stopFile], () => {
    if (existsSync(d.cfg.stopFile)) return { ok: false, text: '車隊暫停中；請先用 /resume 明確恢復，再執行 /goal run' }
    const logFile = join(d.cfg.dataDir, 'autopilot-console.log')
    const outFd = openSync(logFile, 'a')
    try {
      // 改用 process.execPath(與 bot 同一顆 node)，避免 PATH 漂移導致多版本切換的不穩定
      spawnFn(process.execPath, [autopilotRunScript(), '--config', d.cfgPath], {
        detached: true,
        stdio: ['ignore', outFd, outFd],
        windowsHide: true // 踩雷 §25：detached spawn 不補這個會冒黑窗
      }).unref()
    } finally {
      closeSync(outFd) // spawn 已把 fd dup 進子進程，父行程這份可放心關閉
    }
    return { ok: true, text: 'autopilot 已啟動(cost 閘與無進展煞車由 kernel 管),停止:/goal stop' }
  })
}

/** 掃 dataDir 找 goal-*.jsonl，取 mtime 最新一份的最後一行；缺檔/掃描失敗一律回「尚無 session 紀錄」。 */
function latestAuditTail(dataDir: string): string {
  try {
    const files = readdirSync(dataDir).filter(f => /^goal-.*\.jsonl$/.test(f))
    if (files.length === 0) return '尚無 session 紀錄'
    const newest = files
      .map(f => ({ f, mtime: statSync(join(dataDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)[0]!.f
    const lines = readFileSync(join(dataDir, newest), 'utf8').split(/\r?\n/).filter(l => l.length > 0)
    return lines.length > 0 ? lines[lines.length - 1]! : '尚無 session 紀錄'
  } catch {
    return '尚無 session 紀錄'
  }
}

async function goalStatus(d: BotDeps): Promise<CmdResult> {
  if (!d.cfg.goalFile || !existsSync(d.cfg.goalFile)) return { ok: false, text: GOAL_NOT_SET }
  const head = readFileSync(d.cfg.goalFile, 'utf8').slice(0, 200)
  return { ok: true, text: `${head}\n\n${latestAuditTail(d.cfg.dataDir)}` }
}

/** kill-switch：刪 goalFile，autopilot 每輪 isAlive 檢查會自停；檔本不存在也視為成功。 */
async function goalStop(d: BotDeps): Promise<CmdResult> {
  if (d.cfg.goalFile && existsSync(d.cfg.goalFile)) unlinkSync(d.cfg.goalFile)
  return { ok: true, text: '已刪除 GOAL，autopilot 將於下一輪偵測到並停止' }
}

export async function doGoal(d: BotDeps, arg: string, spawnFn: typeof spawn = spawn): Promise<CmdResult> {
  try {
    const { sub, rest } = splitGoalArg(arg)
    switch (sub) {
      case 'set': return await goalSet(d, rest)
      case 'run': return await goalRun(d, spawnFn)
      case 'status': return await goalStatus(d)
      case 'stop': return await goalStop(d)
      default: return { ok: false, text: GOAL_USAGE }
    }
  } catch {
    return { ok: false, text: 'goal 指令執行失敗，請稍後再試' }
  }
}
