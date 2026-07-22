/**
 * classifyDaemon 分支 + 邊界：
 * - !pidAlive => launch
 * - pidAlive && heartbeat 過期 && childCount===0 => reap（第一段）
 * - pidAlive && heartbeat > hardCapMs && !hasEngineChild => reap（第二段）
 * - 其餘 keep（含剛好等於門檻、有 engine child、缺值 fail-open）
 */
import { expect, test } from 'vitest'
import { classifyDaemon } from '../../src/supervisor/health.js'

const STALE = 60_000
const HARD_CAP = 120 * 60_000 // 120 分

test('!pidAlive => launch', () => {
  expect(
    classifyDaemon({
      pidAlive: false,
      heartbeatAgeMs: 0,
      childCount: 0,
      staleThresholdMs: STALE,
    }),
  ).toBe('launch')
  // 即使 heartbeat 新鮮或有 child，pid 死仍 launch
  expect(
    classifyDaemon({
      pidAlive: false,
      heartbeatAgeMs: 1,
      childCount: 3,
      staleThresholdMs: STALE,
      hardCapMs: HARD_CAP,
      hasEngineChild: false,
    }),
  ).toBe('launch')
})

test('pidAlive + heartbeat 過期 + childCount===0 => reap', () => {
  expect(
    classifyDaemon({
      pidAlive: true,
      heartbeatAgeMs: STALE + 1,
      childCount: 0,
      staleThresholdMs: STALE,
    }),
  ).toBe('reap')
})

test('pidAlive + heartbeat 新鮮 + childCount===0 => keep', () => {
  expect(
    classifyDaemon({
      pidAlive: true,
      heartbeatAgeMs: STALE - 1,
      childCount: 0,
      staleThresholdMs: STALE,
    }),
  ).toBe('keep')
})

test('heartbeatAgeMs 剛好等於門檻 => keep（嚴格大於才 reap）', () => {
  expect(
    classifyDaemon({
      pidAlive: true,
      heartbeatAgeMs: STALE,
      childCount: 0,
      staleThresholdMs: STALE,
    }),
  ).toBe('keep')
})

test('childCount>0 且 heartbeat 過期但未給 hardCap/hasEngineChild => keep（向後相容）', () => {
  expect(
    classifyDaemon({
      pidAlive: true,
      heartbeatAgeMs: STALE + 10_000,
      childCount: 1,
      staleThresholdMs: STALE,
    }),
  ).toBe('keep')
  expect(
    classifyDaemon({
      pidAlive: true,
      heartbeatAgeMs: STALE * 2,
      childCount: 5,
      staleThresholdMs: STALE,
    }),
  ).toBe('keep')
})

test('pidAlive 但無 heartbeat 資訊 => fail-open keep', () => {
  expect(
    classifyDaemon({
      pidAlive: true,
      heartbeatAgeMs: null,
      childCount: 0,
      staleThresholdMs: STALE,
    }),
  ).toBe('keep')
  expect(
    classifyDaemon({
      pidAlive: true,
      childCount: 0,
      staleThresholdMs: STALE,
    }),
  ).toBe('keep')
})

// --- 第二段：hardCapMs + hasEngineChild ---

test('第二段：heartbeat > hardCap 且無 engine 子進程 => reap（即使 childCount>0）', () => {
  // 9660 情境：wsl 殼殘留，heartbeat 凍超過 hardCap
  expect(
    classifyDaemon({
      pidAlive: true,
      heartbeatAgeMs: HARD_CAP + 1,
      childCount: 1,
      staleThresholdMs: STALE,
      hardCapMs: HARD_CAP,
      hasEngineChild: false,
    }),
  ).toBe('reap')
})

test('第二段：heartbeat > hardCap 但有 engine 子進程 => keep（不誤殺等 LLM）', () => {
  expect(
    classifyDaemon({
      pidAlive: true,
      heartbeatAgeMs: HARD_CAP + 1,
      childCount: 2,
      staleThresholdMs: STALE,
      hardCapMs: HARD_CAP,
      hasEngineChild: true,
    }),
  ).toBe('keep')
})

test('第二段：heartbeat 剛好等於 hardCap => keep（嚴格大於）', () => {
  expect(
    classifyDaemon({
      pidAlive: true,
      heartbeatAgeMs: HARD_CAP,
      childCount: 1,
      staleThresholdMs: STALE,
      hardCapMs: HARD_CAP,
      hasEngineChild: false,
    }),
  ).toBe('keep')
})

test('第二段：heartbeat 介於 stale 與 hardCap 之間且有 child => keep', () => {
  expect(
    classifyDaemon({
      pidAlive: true,
      heartbeatAgeMs: STALE + 1,
      childCount: 1,
      staleThresholdMs: STALE,
      hardCapMs: HARD_CAP,
      hasEngineChild: false,
    }),
  ).toBe('keep')
})

test('第二段：缺 hardCapMs => fail-open keep', () => {
  expect(
    classifyDaemon({
      pidAlive: true,
      heartbeatAgeMs: HARD_CAP + 1,
      childCount: 1,
      staleThresholdMs: STALE,
      hardCapMs: null,
      hasEngineChild: false,
    }),
  ).toBe('keep')
  expect(
    classifyDaemon({
      pidAlive: true,
      heartbeatAgeMs: HARD_CAP + 1,
      childCount: 1,
      staleThresholdMs: STALE,
      hasEngineChild: false,
    }),
  ).toBe('keep')
})

test('第二段：缺 hasEngineChild => fail-open keep（未知不殺）', () => {
  expect(
    classifyDaemon({
      pidAlive: true,
      heartbeatAgeMs: HARD_CAP + 1,
      childCount: 1,
      staleThresholdMs: STALE,
      hardCapMs: HARD_CAP,
      hasEngineChild: null,
    }),
  ).toBe('keep')
  expect(
    classifyDaemon({
      pidAlive: true,
      heartbeatAgeMs: HARD_CAP + 1,
      childCount: 1,
      staleThresholdMs: STALE,
      hardCapMs: HARD_CAP,
    }),
  ).toBe('keep')
})

test('第二段：缺 heartbeat 即使 hardCap/hasEngineChild 齊全 => fail-open keep', () => {
  expect(
    classifyDaemon({
      pidAlive: true,
      heartbeatAgeMs: null,
      childCount: 1,
      staleThresholdMs: STALE,
      hardCapMs: HARD_CAP,
      hasEngineChild: false,
    }),
  ).toBe('keep')
})

test('第一段優先：childCount===0 且過 stale 即使有 hardCap 也 reap', () => {
  expect(
    classifyDaemon({
      pidAlive: true,
      heartbeatAgeMs: STALE + 1,
      childCount: 0,
      staleThresholdMs: STALE,
      hardCapMs: HARD_CAP,
      hasEngineChild: true, // 無 child 時 hasEngine 不影響第一段
    }),
  ).toBe('reap')
})
