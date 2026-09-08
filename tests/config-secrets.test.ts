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
