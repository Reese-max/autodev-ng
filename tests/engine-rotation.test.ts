import { expect, test } from 'vitest'
import { candidateEngines } from '../src/engines/rotation.js'
import { subscriptionTags } from '../src/scheduler.js'
import { ConfigSchema } from '../src/types.js'

const ROT = ['a', 'b', 'c']

test('顯式 tag：忽略 rotation，只回該 tag', () => {
  expect(candidateEngines(ROT, 'claude', { id: '00000000', engineTag: 'x' }, 0)).toEqual(['x'])
})

test('未設 rotation（undefined/空陣列）：回 defaultEngine（向後相容硬線）', () => {
  expect(candidateEngines(undefined, 'claude', { id: '00000000' }, 0)).toEqual(['claude'])
  expect(candidateEngines([], 'claude', { id: '00000000' }, 5)).toEqual(['claude'])
})

test('hash 分散：不同 task id 得不同起點，清單為旋轉序（全員都在）', () => {
  expect(candidateEngines(ROT, 'claude', { id: '00000000' }, 0)).toEqual(['a', 'b', 'c'])
  expect(candidateEngines(ROT, 'claude', { id: '00000001' }, 0)).toEqual(['b', 'c', 'a'])
  expect(candidateEngines(ROT, 'claude', { id: '00000002' }, 0)).toEqual(['c', 'a', 'b'])
})

test('failover：每失敗一次起點前進一格，繞圈回到頭', () => {
  expect(candidateEngines(ROT, 'claude', { id: '00000000' }, 1)).toEqual(['b', 'c', 'a'])
  expect(candidateEngines(ROT, 'claude', { id: '00000000' }, 3)).toEqual(['a', 'b', 'c'])
  expect(candidateEngines(ROT, 'claude', { id: '00000001' }, 2)).toEqual(['a', 'b', 'c'])
})

test('非 hex id（防呆）：視為 0，不 NaN 炸掉', () => {
  expect(candidateEngines(ROT, 'claude', { id: 'zzzz' }, 0)).toEqual(['a', 'b', 'c'])
})

test('config 驗證：engineRotation 的 tag 必須在 engines 白名單內', () => {
  const base = {
    projectPath: 'x', backlogFile: 'x', dataDir: 'x',
    engines: { claude: { adapter: 'mock' as const }, m2: { adapter: 'mock' as const } }
  }
  expect(ConfigSchema.parse({ ...base, engineRotation: ['claude', 'm2'] }).engineRotation).toEqual(['claude', 'm2'])
  expect(() => ConfigSchema.parse({ ...base, engineRotation: ['claude', '不存在'] })).toThrow()
})

test('config 解析：subscription 檔位可只存在於 engines 白名單，不必列入 engineRotation', () => {
  const cfg = ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir: 'x',
    defaultEngine: 'claude',
    engines: {
      claude: { adapter: 'mock' as const },
      m2: { adapter: 'mock' as const },
      'codex-spark': { adapter: 'mock' as const, costPerRunUsd: 1, subscription: true }
    },
    engineRotation: ['claude', 'm2']
  })

  expect(cfg.engineRotation).toEqual(['claude', 'm2'])
  expect(cfg.engines['codex-spark']?.subscription).toBe(true)
  expect(subscriptionTags(cfg)).toEqual(['codex-spark'])
  expect(candidateEngines(cfg.engineRotation, cfg.defaultEngine, { id: '00000000' }, 0)).not.toContain('codex-spark')
})

// ── 免費起跑（entrySlots，2026-07-28）────────────────────────────────────────

const ROT5 = ['free1', 'free2', 'paid1', 'free3', 'paid2']
const FREE_SLOTS = [0, 1, 3] // free1/free2/free3 檔位

test('entrySlots：新任務（failCount=0）起點只落零成本檔位', () => {
  for (let i = 0; i < 20; i++) {
    const id = i.toString(16).padStart(8, '0')
    const first = candidateEngines(ROT5, 'claude', { id }, 0, FREE_SLOTS)[0]
    expect(['free1', 'free2', 'free3']).toContain(first)
  }
})

test('entrySlots：失敗前進仍走全清單——連敗可走進付費檔位（緩升級不變）', () => {
  // id 00000000 → entry = FREE_SLOTS[0 % 3] = 0；failCount 2 → start 2 = paid1
  expect(candidateEngines(ROT5, 'claude', { id: '00000000' }, 2, FREE_SLOTS)[0]).toBe('paid1')
})

test('entrySlots 空/未設：行為與原公式完全一致（fail-open）', () => {
  const id = '00000003'
  expect(candidateEngines(ROT5, 'claude', { id }, 1, [])).toEqual(candidateEngines(ROT5, 'claude', { id }, 1))
  expect(candidateEngines(ROT5, 'claude', { id }, 1, undefined)).toEqual(candidateEngines(ROT5, 'claude', { id }, 1))
})

test('entrySlots：顯式 engineTag 仍短路不受影響', () => {
  expect(candidateEngines(ROT5, 'claude', { id: '00000000', engineTag: 'paid2' }, 0, FREE_SLOTS)).toEqual(['paid2'])
})
