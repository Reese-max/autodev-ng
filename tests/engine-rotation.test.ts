import { expect, test } from 'vitest'
import { candidateEngines } from '../src/engines/rotation.js'
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
