import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { writeFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { expandConfigPaths, resolveSecretString } from '../src/cli/assemble.js'
import { ConfigSchema } from '../src/types.js'

describe('resolveSecretString', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.TEST_SECRET_KEY = 'super-secret-key-123'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('支援 {env:VAR} 格式', () => {
    expect(resolveSecretString('{env:TEST_SECRET_KEY}')).toBe('super-secret-key-123')
  })

  it('支援 ${env:VAR} 與 ${VAR} 格式', () => {
    expect(resolveSecretString('${env:TEST_SECRET_KEY}')).toBe('super-secret-key-123')
    expect(resolveSecretString('${TEST_SECRET_KEY}')).toBe('super-secret-key-123')
  })

  it('明確指定但缺少或空白的憑證在啟動前失敗', () => {
    delete process.env.NON_EXISTENT_VAR
    expect(() => resolveSecretString('{env:NON_EXISTENT_VAR}')).toThrow('missing or empty')
    process.env.NON_EXISTENT_VAR = '  '
    expect(() => resolveSecretString('${NON_EXISTENT_VAR}')).toThrow('missing or empty')
    expect(() => resolveSecretString('{file:missing-secret-fixture}')).toThrow('missing or unreadable')
    expect(() => resolveSecretString(`{file:${tmpdir()}}`)).toThrow('missing or unreadable')
    const file = join(tmpdir(), `empty-secret-${Date.now()}.txt`)
    writeFileSync(file, ' \n')
    try { expect(() => resolveSecretString(`{file:${file}}`)).toThrow('empty') } finally { unlinkSync(file) }
    expect(resolveSecretString('')).toBe('') // Optional integration explicitly disabled.
  })

  it('支援 {file:PATH} 格式', () => {
    const tmpFile = join(tmpdir(), `test-secret-${Date.now()}.txt`)
    writeFileSync(tmpFile, 'secret-token-from-file\n', 'utf8')
    try {
      expect(resolveSecretString(`{file:${tmpFile}}`)).toBe('secret-token-from-file')
    } finally {
      try { unlinkSync(tmpFile) } catch {}
    }
  })

  it('一般字串原樣保留', () => {
    expect(resolveSecretString('sk-ordinary-key')).toBe('sk-ordinary-key')
    expect(resolveSecretString(undefined)).toBeUndefined()
  })
  it('CLI 登入模式不要求停用的 HTTP API key，HTTP 模式仍嚴格檢查', () => {
    delete process.env.UNUSED_HTTP_KEY
    const cfg = ConfigSchema.parse({ projectPath: '.', backlogFile: 'BACKLOG.md', dataDir: 'data', engines: { fixture: { adapter: 'mock' } }, defaultEngine: 'fixture', llmTransport: 'cli', judgeApiKey: '{env:UNUSED_HTTP_KEY}' })
    expect(expandConfigPaths(tmpdir(), cfg).judgeApiKey).toBe('')
    expect(() => expandConfigPaths(tmpdir(), { ...cfg, llmTransport: 'http' })).toThrow('missing or empty')
  })
})

describe('ConfigSchema secret validation', () => {
  const baseConfig = {
    projectPath: '.',
    backlogFile: 'BACKLOG.md',
    dataDir: 'data',
    engines: { fixture: { adapter: 'mock' as const } },
    defaultEngine: 'fixture',
  }

  it('judgeApiKey 拒絕類 credential 純字串（sk- 開頭）', () => {
    expect(() => ConfigSchema.parse({ ...baseConfig, judgeApiKey: 'sk-proxypilot-qdfdxqreb8syzrp3ykvyx83h' })).toThrow()
    expect(() => ConfigSchema.parse({ ...baseConfig, judgeApiKey: 'sk-abcdefghijklmnopqrst' })).toThrow()
  })

  it('judgeApiKey 接受 {env:VAR} 參考格式', () => {
    const cfg = ConfigSchema.parse({ ...baseConfig, judgeApiKey: '{env:JUDGE_API_KEY}' })
    expect(cfg.judgeApiKey).toBe('{env:JUDGE_API_KEY}')
  })

  it('judgeApiKey 接受 ${env:VAR} 與 ${VAR} 參考格式', () => {
    const cfg1 = ConfigSchema.parse({ ...baseConfig, judgeApiKey: '${env:JUDGE_API_KEY}' })
    expect(cfg1.judgeApiKey).toBe('${env:JUDGE_API_KEY}')
    const cfg2 = ConfigSchema.parse({ ...baseConfig, judgeApiKey: '${JUDGE_API_KEY}' })
    expect(cfg2.judgeApiKey).toBe('${JUDGE_API_KEY}')
  })

  it('judgeApiKey 接受 {file:PATH} 參考格式', () => {
    const cfg = ConfigSchema.parse({ ...baseConfig, judgeApiKey: '{file:/path/to/secret}' })
    expect(cfg.judgeApiKey).toBe('{file:/path/to/secret}')
  })

  it('telegramBotToken 拒絕通知端實際使用的純 token，且錯誤不回顯 token', () => {
    const token = '123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi'
    const result = ConfigSchema.safeParse({ ...baseConfig, telegramBotToken: token })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errorText = result.error.issues.map(issue => issue.message).join('\n')
      expect(errorText).toContain('telegramBotToken')
      expect(errorText).not.toContain(token)
    }
  })

  it('telegramBotToken 不接受短的明文 placeholder，必須使用秘密參考格式', () => {
    expect(() => ConfigSchema.parse({ ...baseConfig, telegramBotToken: '123:ABC' })).toThrow('telegramBotToken')
  })

  it.each([
    '{env:TELEGRAM_BOT_TOKEN}',
    '${env:TELEGRAM_BOT_TOKEN}',
    '${TELEGRAM_BOT_TOKEN}',
    '{file:/path/to/telegram-token}',
  ])('telegramBotToken 接受秘密參考格式 %s', reference => {
    const cfg = ConfigSchema.parse({ ...baseConfig, telegramBotToken: reference })
    expect(cfg.telegramBotToken).toBe(reference)
  })

  it('telegramBotToken 省略時仍代表停用', () => {
    const cfg = ConfigSchema.parse(baseConfig)
    expect(cfg.telegramBotToken).toBeUndefined()
  })

  it('judgeApiKey 預設值不應為類 credential 字串', () => {
    const cfg = ConfigSchema.parse(baseConfig)
    expect(cfg.judgeApiKey).not.toMatch(/^sk-[a-zA-Z0-9]{20,}$/)
  })
})
