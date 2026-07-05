import { existsSync, readFileSync, appendFileSync } from 'node:fs'

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
  }
}
