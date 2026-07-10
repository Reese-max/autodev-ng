import { MessageFlags } from 'discord.js'
import { describe, expect, test } from 'vitest'
import { buildReplyPayload } from '../src/bot/reply.js'

describe('buildReplyPayload', () => {
  test('ephemeral 回覆使用 flags，不再傳已棄用的 ephemeral 欄位', () => {
    const payload = buildReplyPayload('未授權', true)
    expect(payload).toEqual({ content: '未授權', flags: MessageFlags.Ephemeral })
    expect(payload).not.toHaveProperty('ephemeral')
  })

  test('一般回覆不附加 ephemeral flag', () => {
    expect(buildReplyPayload('正常', false)).toEqual({ content: '正常' })
    expect(buildReplyPayload('正常')).toEqual({ content: '正常' })
  })
})
