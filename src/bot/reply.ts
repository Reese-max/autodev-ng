import { MessageFlags, type InteractionReplyOptions } from 'discord.js'

/** discord.js v14.24+：ephemeral 布林欄位已棄用，改用 MessageFlags.Ephemeral。 */
export function buildReplyPayload(content: string, ephemeral?: boolean): InteractionReplyOptions {
  const message = content.length <= 1900 ? { content } : {
    content: content.slice(0, 1600).replace(/[\uD800-\uDBFF]$/, '') + '\n…完整多專案內容請查看附件。',
    files: [{ attachment: Buffer.from(content, 'utf8'), name: 'adng-monitor.txt' }],
  }
  return { ...message, allowedMentions: { parse: [] }, ...(ephemeral ? { flags: MessageFlags.Ephemeral } : {}) }
}
