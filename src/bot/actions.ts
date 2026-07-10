import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { setSilence, clearSilence } from './silence.js'
import { callAgent } from '../autopilot/llm.js'
import type { BotDeps } from './handlers.js'

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

/** /task 內部寫入：讀現檔（缺檔視為空）+ 確保結尾換行 + append 純 `- [ ] text` 行
 * （無 adng:autopilot 註記，parseBacklog 讀回 source:'user'，鐵律 #1：不冒充系統自主任務）。
 * 防禦第二層：即使呼叫端（doTask）漏檢，此處仍 throw 擋下換行/HTML 註解，防未來別的
 * 呼叫端繞過 handler 直接注入 backlog 檔。 */
export function appendUserTask(backlogFile: string, text: string): void {
  const violation = findTaskTextViolation(text)
  if (violation) throw new Error(violation)
  const cur = existsSync(backlogFile) ? readFileSync(backlogFile, 'utf8') : ''
  const sep = cur.length === 0 || cur.endsWith('\n') ? '' : '\n'
  writeFileSync(backlogFile, `${cur}${sep}- [ ] ${text}\n`)
}

export async function doPause(d: BotDeps): Promise<string> {
  try {
    writeFileSync(d.cfg.stopFile, 'bot /pause\n')
    return '已寫入 stop 檔，daemon 將優雅停止'
  } catch {
    return '暫停失敗，請檢查 stop 檔權限'
  }
}

/** 缺 stopFile 也回成功文字——resume 的語意是「確保處於運作狀態」，不是「一定有檔可刪」。 */
export async function doResume(d: BotDeps): Promise<string> {
  try {
    if (existsSync(d.cfg.stopFile)) unlinkSync(d.cfg.stopFile)
    return '已恢復，daemon 將繼續運作'
  } catch {
    return '恢復失敗，請檢查 stop 檔權限'
  }
}

const SILENCE_USAGE = '用法：/silence <分鐘>（1-1440 設定靜音窗，0 解除靜音）'

/** setSilence 寫檔失敗會 throw，此處必須包 try/catch（鐵律：永不外拋）。 */
export async function doSilence(d: BotDeps, arg: string): Promise<string> {
  try {
    const minutes = parseInt(arg.trim(), 10)
    if (Number.isNaN(minutes)) return SILENCE_USAGE
    if (minutes === 0) {
      clearSilence(d.cfg.dataDir)
      return '已解除靜音'
    }
    if (minutes < 1 || minutes > 1440) return SILENCE_USAGE
    const untilIso = setSilence(d.cfg.dataDir, minutes)
    return `已靜音至 ${untilIso}`
  } catch {
    return '靜音設定失敗，請稍後再試'
  }
}

export async function doTask(d: BotDeps, arg: string): Promise<string> {
  try {
    const text = arg.trim()
    if (!text) return '用法：/task <任務內容>'
    const violation = findTaskTextViolation(text)
    if (violation) return violation
    appendUserTask(d.cfg.backlogFile, text)
    return '已加入 backlog'
  } catch {
    return '寫入 backlog 失敗，請稍後再試'
  }
}

/** callAgent 本身 fail-open（無 url 或 fetch 失敗一律回空字串），這裡把空字串轉成人話。 */
export async function doAsk(d: BotDeps, arg: string): Promise<string> {
  try {
    const question = arg.trim()
    if (!question) return '用法：/ask <問題>'
    const reply = await callAgent(d.llm, question)
    return reply.trim() ? reply : 'LLM 未回應'
  } catch {
    return 'LLM 呼叫失敗，請稍後再試'
  }
}
