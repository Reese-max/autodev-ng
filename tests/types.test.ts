import { expect, test } from 'vitest'
import { ConfigSchema } from '../src/types.js'

test('合法設定通過驗證且套用預設值', () => {
  const cfg = ConfigSchema.parse({
    projectPath: 'D:/x/proj',
    backlogFile: 'D:/x/proj/BACKLOG.md',
    dataDir: 'D:/x/data',
    engine: 'mock'
  })
  expect(cfg.maxAttempts).toBe(2)
  expect(cfg.dailySoftUsd).toBe(40)
  expect(cfg.dailyHardUsd).toBe(100)
  expect(cfg.stopFile).toBe('.adng.stop')
})

test('非法 engine 被拒', () => {
  expect(() => ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'gpt99'
  })).toThrow()
})
