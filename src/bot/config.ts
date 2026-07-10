import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

export interface BotConfig {
  allowedUserIds: string[]
  guildId?: string
  botTokenFile?: string
}

/** 讀同一份 config JSON 的 bot 相關欄位
 * - botAllowedUserIds(string[], 缺省 [])
 * - botGuildId?
 * - botTokenFile?(相對路徑以 config 檔所在目錄 resolve)
 *
 * JSON 損壞/缺檔 → fail-closed: { allowedUserIds: [] } */
export function loadBotConfig(cfgPath: string): BotConfig {
  try {
    if (!existsSync(cfgPath)) {
      return { allowedUserIds: [] }
    }
    const content = readFileSync(cfgPath, 'utf8')
    const cfg = JSON.parse(content)

    // Resolve relative paths based on config directory
    const configDir = dirname(cfgPath)

    return {
      allowedUserIds: Array.isArray(cfg.botAllowedUserIds) ? cfg.botAllowedUserIds : [],
      guildId: cfg.botGuildId,
      botTokenFile: cfg.botTokenFile ? resolve(configDir, cfg.botTokenFile) : undefined
    }
  } catch {
    // 靜默失敗：JSON 損壞或其他讀檔錯誤 → fail-closed
    return { allowedUserIds: [] }
  }
}

/** 讀 bot token
 * - 優先 process.env.ADNG_BOT_TOKEN(非空)
 * - 否則讀 botTokenFile，逐行 regex `/^(?:set\s+|export\s+)?ADNG_BOT_TOKEN=(.*)$/i`
 *   (鏡像 src/notify.ts loadDiscordToken 的解析與去引號)
 * - 皆無 → null
 *
 * 回傳值與錯誤路徑都不得把 token 內容寫進任何 log/throw message */
export function loadBotToken(botTokenFile?: string): string | null {
  // Env var takes precedence
  const envToken = process.env.ADNG_BOT_TOKEN
  if (envToken) {
    const trimmed = envToken.trim()
    if (trimmed) return trimmed
  }

  // No file specified
  if (!botTokenFile) return null

  try {
    if (!existsSync(botTokenFile)) {
      return null
    }
    const content = readFileSync(botTokenFile, 'utf8')
    const lines = content.split('\n')
    for (const line of lines) {
      // 真實 token 檔可能是 cmd batch（`set ADNG_BOT_TOKEN=…`）或 shell（`export ADNG_BOT_TOKEN=…`）格式
      const m = /^(?:set\s+|export\s+)?ADNG_BOT_TOKEN=(.*)$/i.exec(line.trim())
      if (m) {
        const raw = m[1]!.trim()
        const unquoted = raw.replace(/^['"]|['"]$/g, '')
        return unquoted === '' ? null : unquoted
      }
    }
    return null
  } catch {
    // 靜默失敗：讀檔錯誤不外洩
    return null
  }
}
