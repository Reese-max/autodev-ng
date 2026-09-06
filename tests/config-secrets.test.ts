import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { writeFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { resolveSecretString } from '../src/cli/assemble.js'

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

  it('環境變數不存在時回傳空字串，不丟出未捕捉例外', () => {
    expect(resolveSecretString('{env:NON_EXISTENT_VAR}')).toBe('')
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
})
