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
    if (line.startsWith('LPBOT_TOKEN=')) {
      const raw = line.slice('LPBOT_TOKEN='.length).trim()
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
