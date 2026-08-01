import { existsSync, readFileSync, appendFileSync, renameSync, writeFileSync } from 'node:fs'

// MEDIUM-4：notify-dlq.jsonl 無界成長治理。DLQ 只在 send() 失敗時寫入（遠低於 events.ts
// 主迴圈 append 頻率），效能不是問題——每次 writeDLQ 後直接讀檔數行即可，不需要像
// events.ts 那樣做記憶體計數器優化。
const DLQ_MAX_LINES = 2000
const DLQ_KEEP_LINES = 1000

/** 保尾輪替：行數 > DLQ_MAX_LINES 時只留最後 DLQ_KEEP_LINES 行，tmp+rename 原子寫。
 * 讀/截任何故障（含 rename 目標被佔用、磁碟滿）一律靜默放棄——DLQ 治理失敗不可影響
 * 主流程，send() 永不 throw 的既有契約不可破（鐵律 #4：fail-open）。 */
function rotateDlqIfNeeded(dlqPath: string): void {
  try {
    if (!existsSync(dlqPath)) return
    const content = readFileSync(dlqPath, 'utf8')
    const lines = content.split(/\r?\n/).filter((line) => line.length > 0)
    if (lines.length <= DLQ_MAX_LINES) return
    const kept = lines.slice(-DLQ_KEEP_LINES)
    const tmp = `${dlqPath}.tmp`
    writeFileSync(tmp, kept.join('\n') + '\n')
    renameSync(tmp, dlqPath)
  } catch {
    // 靜默放棄：見上方註解
  }
}

export function loadDiscordToken(tokenFile: string): string | null {
  if (!existsSync(tokenFile)) {
    return null
  }
  const content = readFileSync(tokenFile, 'utf8')
  const lines = content.split('\n')
  for (const line of lines) {
    // 真實 token 檔可能是 cmd batch（`set LPBOT_TOKEN=…`）或 shell（`export LPBOT_TOKEN=…`）格式
    const m = /^(?:set\s+|export\s+)?LPBOT_TOKEN=(.*)$/i.exec(line.trim())
    if (m) {
      const raw = m[1]!.trim()
      const unquoted = raw.replace(/^['"]|['"]$/g, '')
      return unquoted === '' ? null : unquoted
    }
  }
  return null
}

export interface DiscordNotifierOpts {
  channelId: string | undefined
  tokenFile: string
  dataDir: string
  fetchFn?: typeof fetch
}

export class DiscordNotifier {
  private channelId: string | undefined
  private tokenFile: string
  private dataDir: string
  private fetchFn: typeof fetch

  constructor(opts: DiscordNotifierOpts) {
    this.channelId = opts.channelId
    this.tokenFile = opts.tokenFile
    this.dataDir = opts.dataDir
    this.fetchFn = opts.fetchFn ?? globalThis.fetch
  }

  async send(text: string): Promise<boolean> {
    try {
      // Check if channelId is configured
      if (!this.channelId) {
        this.writeDLQ('not-configured', text)
        return false
      }

      // Load token
      const token = loadDiscordToken(this.tokenFile)
      if (!token) {
        this.writeDLQ('not-configured', text)
        return false
      }

      // Truncate content if needed
      let content = text
      if (content.length > 1900) {
        content = [...content].slice(0, 1900).join('') + '…[truncated]'
      }

      // Set up abort controller with 15s timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15_000)

      try {
        const response = await this.fetchFn(
          `https://discord.com/api/v10/channels/${this.channelId}/messages`,
          {
            method: 'POST',
            headers: {
              'authorization': `Bot ${token}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify({ content }),
            signal: controller.signal,
          }
        )

        // Check if response is 2xx
        if (response.status >= 200 && response.status < 300) {
          return true
        }

        // Non-2xx response
        this.writeDLQ(`http-${response.status}`, text)
        return false
      } finally {
        clearTimeout(timeoutId)
      }
    } catch (err) {
      // Fetch threw or abort signal triggered
      const reason = err instanceof Error && err.name === 'AbortError' ? 'timeout' : 'fetch-error'
      this.writeDLQ(reason, text)
      return false
    }
  }

  private writeDLQ(reason: string, text: string): void {
    const entry = {
      ts: new Date().toISOString(),
      reason,
      textHead: [...text].slice(0, 120).join(''),
    }
    const dlqPath = `${this.dataDir}/notify-dlq.jsonl`
    try {
      appendFileSync(dlqPath, JSON.stringify(entry) + '\n')
    } catch {
      // Silent fail on DLQ write error
    }
    rotateDlqIfNeeded(dlqPath)
  }
}

export interface TaskTerminalNotice {
  outcome: 'done' | 'failed'
  taskId: string
  taskText: string
  resultSummary: string
  costUsd: number
  tokensIn?: number
  tokensOut?: number
  tokensCached?: number
  attempts?: number
}

function oneLine(text: string, limit: number): string {
  return [...text.replace(/\s+/g, ' ').trim()].slice(0, limit).join('') || '未提供'
}

export function formatTelegramTaskMessage(n: TaskTerminalNotice): string {
  const done = n.outcome === 'done'
  const tokens = n.tokensIn === undefined && n.tokensOut === undefined && n.tokensCached === undefined
    ? 'tokens 未回報'
    : `tokens in=${n.tokensIn ?? '?'} / out=${n.tokensOut ?? '?'} / cached=${n.tokensCached ?? '?'}`
  const acceptance = done ? '通過' : `未通過${n.attempts ? `（已達 ${n.attempts} 次上限）` : '（最終失敗）'}`
  return [
    `${done ? '✅' : '❌'} AutoDev 任務${done ? '完成' : '最終失敗'}`,
    `任務識別：${n.taskId}｜${oneLine(n.taskText, 240)}`,
    `成果摘要：${oneLine(n.resultSummary, 1_200)}`,
    `驗收狀態：${acceptance}`,
    `本次額度用量：US$${n.costUsd.toFixed(4)}；${tokens}`,
  ].join('\n')
}

export interface TelegramNotifierOpts {
  botToken: string | undefined
  chatId: string | number | undefined
  fetchFn?: typeof fetch
}

/** Telegram 是加值通知面：缺設定、逾時、非 2xx 或 fetch 例外一律回 false，不向排程拋錯。 */
export class TelegramNotifier {
  constructor(private readonly opts: TelegramNotifierOpts) {}

  async send(text: string): Promise<boolean> {
    const token = this.opts.botToken?.trim()
    const chatId = typeof this.opts.chatId === 'string' ? this.opts.chatId.trim() : this.opts.chatId
    if (!token || chatId === undefined || chatId === '') return false

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15_000)
    try {
      const response = await (this.opts.fetchFn ?? globalThis.fetch)(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: [...text].slice(0, 4_000).join('') }),
          signal: controller.signal,
        }
      )
      return response.status >= 200 && response.status < 300
    } catch {
      return false
    } finally {
      clearTimeout(timeoutId)
    }
  }
}
