import { MessageFlags, type InteractionReplyOptions } from 'discord.js'

/** discord.js v14.24+：ephemeral 布林欄位已棄用，改用 MessageFlags.Ephemeral。 */
export function buildReplyPayload(content: string, ephemeral?: boolean): InteractionReplyOptions {
  return ephemeral
    ? { content, flags: MessageFlags.Ephemeral }
    : { content }
}
