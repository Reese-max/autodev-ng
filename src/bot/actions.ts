import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { setSilence, clearSilence } from './silence.js'
import { callAgent } from '../autopilot/llm.js'
import type { BotDeps } from './handlers.js'

/** /task 內部寫入：讀現檔（缺檔視為空）+ 確保結尾換行 + append 純 `- [ ] text` 行
 * （無 adng:autopilot 註記，parseBacklog 讀回 source:'user'，鐵律 #1：不冒充系統自主任務）。 */
export function appendUserTask(backlogFile: string, text: string): void {
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
