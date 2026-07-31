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

test('timeout 與專案成本軟硬頂可用 0 明確停用', () => {
  const cfg = ConfigSchema.parse({
    projectPath: 'D:/x/proj', backlogFile: 'D:/x/proj/BACKLOG.md', dataDir: 'D:/x/data',
    dailySoftUsd: 0, dailyHardUsd: 0,
    engines: { oc: { adapter: 'opencode', timeoutMs: 0 } }, defaultEngine: 'oc'
  })
  expect(cfg.dailySoftUsd).toBe(0)
  expect(cfg.dailyHardUsd).toBe(0)
  expect(cfg.engines.oc?.timeoutMs).toBe(0)
})

test('pingTimeoutMs 可設正整數，非正整數被拒', () => {
  const base = { projectPath: 'x', backlogFile: 'x', dataDir: 'x', defaultEngine: 'codex' }
  const cfg = ConfigSchema.parse({
    ...base, engines: { codex: { adapter: 'codex', costPerRunUsd: 0, pingTimeoutMs: 180_000 } }
  })
  expect(cfg.engines.codex?.pingTimeoutMs).toBe(180_000)
  for (const pingTimeoutMs of [0, -1, 1.5]) {
    expect(() => ConfigSchema.parse({
      ...base, engines: { codex: { adapter: 'codex', costPerRunUsd: 0, pingTimeoutMs } }
    })).toThrow()
  }
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

// ---------------------------------------------------------------------------
// M5 Task 1：engines map + defaultEngine

test('engines 未設 → 依 legacy engine 補預設 { claude: { adapter: <engine> } }、defaultEngine=claude（向後相容硬線）', () => {
  const mock = ConfigSchema.parse({ projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'mock' })
  expect(mock.defaultEngine).toBe('claude')
  expect(mock.engines).toEqual({ claude: { adapter: 'mock' } })
  const cc = ConfigSchema.parse({ projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'claude-cli' })
  expect(cc.engines).toEqual({ claude: { adapter: 'claude-cli' } })
})

test('defaultEngine 不在 engines 白名單 → schema refine 拒', () => {
  expect(() => ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'claude-cli',
    engines: { m3: { adapter: 'claude-cli' } } // 沒有 claude（預設 defaultEngine）
  })).toThrow()
  expect(() => ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'claude-cli', defaultEngine: 'ghost'
  })).toThrow()
})

// ---------------------------------------------------------------------------
// M10.0 Task 5：perpetual 三欄預設值

test('M10.0：perpetual/perpetualCooldownMs/perpetualValueThreshold 套用預設值（未設＝外環完全停用）', () => {
  const cfg = ConfigSchema.parse({
    projectPath: 'D:/x/proj', backlogFile: 'D:/x/proj/BACKLOG.md', dataDir: 'D:/x/data', engine: 'mock'
  })
  expect(cfg.perpetual).toBe(false)
  expect(cfg.perpetualCooldownMs).toBe(6 * 60 * 60 * 1000)
  expect(cfg.perpetualValueThreshold).toBe(6)
})

test('M10.0：perpetualValueThreshold 超出 0..10 範圍被拒，範圍內可覆蓋；perpetualCooldownMs 非正被拒', () => {
  expect(() => ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'mock', perpetualValueThreshold: 11
  })).toThrow()
  expect(() => ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'mock', perpetualValueThreshold: -1
  })).toThrow()
  expect(() => ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'mock', perpetualCooldownMs: 0
  })).toThrow()
  const cfg = ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'mock', perpetual: true, perpetualValueThreshold: 8
  })
  expect(cfg.perpetual).toBe(true)
  expect(cfg.perpetualValueThreshold).toBe(8)
})

test('engines 欄位驗證：全矩陣 adapter 可寫、未知 adapter 拒、costPerRunUsd 負值拒、env/model/timeoutMs 可選', () => {
  const cfg = ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'claude-cli',
    engines: {
      claude: { adapter: 'claude-cli' },
      m3: { adapter: 'claude-cli', costPerRunUsd: 0.5, env: { ANTHROPIC_BASE_URL: 'http://x' }, model: 'MiniMax-M3', timeoutMs: 60000 },
      agy: { adapter: 'agy', costPerRunUsd: 0 } // 未實作 adapter 允許先寫進 config（resolve 時才報錯）
    }
  })
  expect(cfg.engines['m3']!.costPerRunUsd).toBe(0.5)
  expect(cfg.engines['agy']!.costPerRunUsd).toBe(0)
  expect(() => ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'claude-cli',
    engines: { claude: { adapter: 'gpt99' } }
  })).toThrow()
  expect(() => ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'claude-cli',
    engines: { claude: { adapter: 'claude-cli', costPerRunUsd: -1 } }
  })).toThrow()
})

// ---------------------------------------------------------------------------
// engines.<tag>.dailyAttemptCap（可選正整數；未設＝不限）

test('dailyAttemptCap：未設 → undefined（向後相容）；正整數通過解析', () => {
  const bare = ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'mock',
  })
  expect(bare.engines['claude']!.dailyAttemptCap).toBeUndefined()

  const cfg = ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'claude-cli',
    engines: {
      claude: { adapter: 'claude-cli', dailyAttemptCap: 12 },
      free: { adapter: 'mock', dailyAttemptCap: 1 },
    },
  })
  expect(cfg.engines['claude']!.dailyAttemptCap).toBe(12)
  expect(cfg.engines['free']!.dailyAttemptCap).toBe(1)
})

test('dailyAttemptCap：0／負數／非整數被拒', () => {
  const base = {
    projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'claude-cli' as const,
  }
  expect(() => ConfigSchema.parse({
    ...base,
    engines: { claude: { adapter: 'claude-cli', dailyAttemptCap: 0 } },
  })).toThrow()
  expect(() => ConfigSchema.parse({
    ...base,
    engines: { claude: { adapter: 'claude-cli', dailyAttemptCap: -3 } },
  })).toThrow()
  expect(() => ConfigSchema.parse({
    ...base,
    engines: { claude: { adapter: 'claude-cli', dailyAttemptCap: 1.5 } },
  })).toThrow()
})

// ---------------------------------------------------------------------------
// M10.5 Task 4：globalDailyHardUsd（全域日頂）

test('M10.5：globalDailyHardUsd 未設 → undefined（無全域防線，現狀不變）', () => {
  const cfg = ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'mock'
  })
  expect(cfg.globalDailyHardUsd).toBeUndefined()
})

test('M10.5：globalDailyHardUsd 可設正數；非正被拒', () => {
  const cfg = ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'mock', globalDailyHardUsd: 50
  })
  expect(cfg.globalDailyHardUsd).toBe(50)
  expect(() => ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'mock', globalDailyHardUsd: 0
  })).toThrow()
})
