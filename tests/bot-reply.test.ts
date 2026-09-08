import { MessageFlags } from 'discord.js'
import { describe, expect, test } from 'vitest'
import { buildReplyPayload } from '../src/bot/reply.js'

describe('buildReplyPayload', () => {
  test('ephemeral 回覆使用 flags，不再傳已棄用的 ephemeral 欄位', () => {
    const payload = buildReplyPayload('未授權', true)
    expect(payload).toEqual({ content: '未授權', flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } })
    expect(payload).not.toHaveProperty('ephemeral')
  })

  test('一般回覆不附加 ephemeral flag', () => {
    expect(buildReplyPayload('正常', false)).toEqual({ content: '正常', allowedMentions: { parse: [] } })
    expect(buildReplyPayload('正常')).toEqual({ content: '正常', allowedMentions: { parse: [] } })
  })

  test('多專案超長回覆提供完整附件並禁止文字觸發 mention', () => {
    const text = '@everyone ' + '🦞'.repeat(2000) + '\n【最後專案】還在'
    const payload = buildReplyPayload(text)
    expect(payload.content!.length).toBeLessThanOrEqual(1900)
    expect(payload.allowedMentions).toEqual({ parse: [] })
    const file = payload.files![0] as { attachment: Buffer }
    expect(file.attachment.toString('utf8')).toBe(text)
  })
})
