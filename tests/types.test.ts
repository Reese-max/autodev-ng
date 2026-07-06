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

test('timezoneOffsetHours/failureCostEstimateUsd 套用預設值（M4 Task 3）', () => {
  const cfg = ConfigSchema.parse({
    projectPath: 'D:/x/proj',
    backlogFile: 'D:/x/proj/BACKLOG.md',
    dataDir: 'D:/x/data',
    engine: 'mock'
  })
  expect(cfg.timezoneOffsetHours).toBe(8)
  expect(cfg.failureCostEstimateUsd).toBe(1)
})

test('timezoneOffsetHours 超出 -12..14 範圍被拒，範圍內可覆蓋', () => {
  expect(() => ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'mock', timezoneOffsetHours: 15
  })).toThrow()
  expect(() => ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'mock', timezoneOffsetHours: -13
  })).toThrow()
  const cfg = ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'mock', timezoneOffsetHours: 0
  })
  expect(cfg.timezoneOffsetHours).toBe(0)
})

test('failureCostEstimateUsd 負值被拒、0 允許（nonnegative）', () => {
  expect(() => ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'mock', failureCostEstimateUsd: -0.1
  })).toThrow()
  const cfg = ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'mock', failureCostEstimateUsd: 0
  })
  expect(cfg.failureCostEstimateUsd).toBe(0)
})
