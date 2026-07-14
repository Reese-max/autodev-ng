import { describe, test, expect, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadBotConfig, loadBotToken, listProjectConfigs } from '../src/bot/config.js'

const savedEnv = process.env.ADNG_BOT_TOKEN
afterEach(() => {
  if (savedEnv === undefined) delete process.env.ADNG_BOT_TOKEN
  else process.env.ADNG_BOT_TOKEN = savedEnv
})

function dir(): string { return mkdtempSync(join(tmpdir(), 'adng-botcfg-')) }

describe('loadBotConfig', () => {
  test('讀 botAllowedUserIds/botGuildId/botTokenFile(相對路徑以 config 目錄 resolve)', () => {
    const d = dir()
    const p = join(d, 'config.json')
    writeFileSync(p, JSON.stringify({
      projectPath: './p', backlogFile: './p/B.md', dataDir: './data', engine: 'mock',
      botAllowedUserIds: ['111', '222'], botGuildId: 'g1', botTokenFile: './bot.env'
    }))
    const c = loadBotConfig(p)
    expect(c.allowedUserIds).toEqual(['111', '222'])
    expect(c.guildId).toBe('g1')
    expect(c.botTokenFile).toBe(join(d, 'bot.env'))
  })
  test('缺欄位 → allowedUserIds 空陣列(fail-closed);JSON 損壞不炸', () => {
    const d = dir()
    const p = join(d, 'config.json')
    writeFileSync(p, '{"dataDir":"./data"}')
    expect(loadBotConfig(p).allowedUserIds).toEqual([])
    writeFileSync(p, '{broken')
    expect(loadBotConfig(p).allowedUserIds).toEqual([])
  })

  test('Fix 3：botAllowedUserIds 陣列含數字元素 → 全部轉字串（避免與 include 比對永遠失敗、全員鎖死）', () => {
    const d = dir()
    const p = join(d, 'config.json')
    writeFileSync(p, JSON.stringify({ botAllowedUserIds: [111, '222'] }))
    expect(loadBotConfig(p).allowedUserIds).toEqual(['111', '222'])
  })

  test('Fix 3：botAllowedUserIds 存在但非陣列 → fail-closed 空陣列，不炸', () => {
    const d = dir()
    const p = join(d, 'config.json')
    writeFileSync(p, JSON.stringify({ botAllowedUserIds: 'x' }))
    expect(loadBotConfig(p).allowedUserIds).toEqual([])
  })

  test('botGuildId 為數字型別 → 轉為字串（避免 discord.js API 型別不符）', () => {
    const d = dir()
    const p = join(d, 'config.json')
    writeFileSync(p, JSON.stringify({ botGuildId: 123456 }))
    const c = loadBotConfig(p)
    expect(c.guildId).toBe('123456')
    expect(typeof c.guildId).toBe('string')
  })

  test('botGuildId 缺欄位 → undefined（不轉成字串 "undefined"）', () => {
    const d = dir()
    const p = join(d, 'config.json')
    writeFileSync(p, JSON.stringify({}))
    expect(loadBotConfig(p).guildId).toBeUndefined()
  })
})

describe('loadBotToken', () => {
  test('env ADNG_BOT_TOKEN 優先', () => {
    process.env.ADNG_BOT_TOKEN = 'env-tok'
    expect(loadBotToken(undefined)).toBe('env-tok')
  })
  test('無 env 時讀檔(支援 set/export 前綴與引號)', () => {
    delete process.env.ADNG_BOT_TOKEN
    const f = join(dir(), 'bot.env')
    writeFileSync(f, '# comment\nset ADNG_BOT_TOKEN="file-tok"\n')
    expect(loadBotToken(f)).toBe('file-tok')
  })
  test('env ADNG_BOT_TOKEN 存在但空字串 → fallback 讀檔', () => {
    process.env.ADNG_BOT_TOKEN = ''
    const f = join(dir(), 'bot.env')
    writeFileSync(f, 'export ADNG_BOT_TOKEN=file-tok-2\n')
    expect(loadBotToken(f)).toBe('file-tok-2')
  })
  test('env ADNG_BOT_TOKEN 存在但全空白 → fallback 讀檔', () => {
    process.env.ADNG_BOT_TOKEN = '   '
    const f = join(dir(), 'bot.env')
    writeFileSync(f, 'export ADNG_BOT_TOKEN=file-tok-3\n')
    expect(loadBotToken(f)).toBe('file-tok-3')
  })
  test('皆無 → null;檔案缺失不炸', () => {
    delete process.env.ADNG_BOT_TOKEN
    expect(loadBotToken(join(dir(), 'missing.env'))).toBeNull()
    expect(loadBotToken(undefined)).toBeNull()
  })
})

describe('listProjectConfigs', () => {
  test('掃 *.json(檔名排序,忽略非 json),name=去 .json 檔名', () => {
    const d = dir()
    writeFileSync(join(d, 'b.json'), '{}')
    writeFileSync(join(d, 'a.json'), '{}')
    writeFileSync(join(d, 'readme.txt'), 'x')
    expect(listProjectConfigs(d)).toEqual([
      { name: 'a', cfgPath: join(d, 'a.json') },
      { name: 'b', cfgPath: join(d, 'b.json') }
    ])
  })
  test('目錄不存在 → []', () => {
    expect(listProjectConfigs(join(dir(), 'nope'))).toEqual([])
  })
  test('目錄存在但空 → []', () => {
    expect(listProjectConfigs(dir())).toEqual([])
  })
})
