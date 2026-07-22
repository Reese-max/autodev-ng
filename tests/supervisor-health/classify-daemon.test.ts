/**
 * classifyDaemon 三分支 + 邊界：
 * - !pidAlive => launch
 * - pidAlive && heartbeat 過期 && childCount===0 => reap
 * - 其餘 keep（含剛好等於門檻、有 child、無 heartbeat 資訊）
 */
import { expect, test } from 'vitest'
import { classifyDaemon } from '../../src/supervisor/health.js'

const STALE = 60_000

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

test('childCount>0 且 heartbeat 過期 => keep（有 child 不 reap）', () => {
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
