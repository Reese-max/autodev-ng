import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import {
  cleanupRoutingState,
  pruneRoutingState,
} from '../src/engines/routing-state-cleanup.js'
import {
  ROUTING_STATE_FILENAME,
  loadRoutingState,
  saveRoutingState,
  type RoutingState,
} from '../src/engines/routing-state.js'

const DAY = 24 * 60 * 60 * 1000
const NOW = '2026-07-20T12:00:00.000Z'
const NOW_MS = Date.parse(NOW)

function iso(offsetMs: number): string {
  return new Date(NOW_MS + offsetMs).toISOString()
}

function tmpDataDir(): string {
  return mkdtempSync(join(tmpdir(), 'adng-routing-cleanup-'))
}

describe('pruneRoutingState', () => {
  test('清除已解除隔離、已轉正候選、孤兒與超期歷史，保留仍有效狀態', () => {
    const state: RoutingState = {
      version: 1,
      updatedAt: iso(-DAY),
      isolated: {
        active: { untilTs: iso(DAY), reason: 'active' },
        oldProbe: { untilTs: iso(DAY), reason: 'active-with-old-probe' },
        lifted: { untilTs: NOW, reason: 'expired-at-boundary' },
        invalid: { untilTs: 'bad-time', reason: 'invalid' },
      },
      isolationCounts: { active: 1, lifted: 3 },
      promoted: {
        formal: { score: 5, promotedAt: iso(-DAY) },
        fresh: { score: 4, promotedAt: iso(-6 * DAY) },
        boundary: { score: 3, promotedAt: iso(-7 * DAY) },
        stale: { score: 2, promotedAt: iso(-7 * DAY - 1) },
      },
      probes: {
        active: { hits: 1, lastTs: iso(-DAY) },
        oldProbe: { hits: 2, lastTs: iso(-7 * DAY - 1) },
        lifted: { hits: 1, lastTs: iso(-DAY) },
      },
    }

    const next = pruneRoutingState(state, ['formal'], NOW, 7 * DAY)

    expect(next).not.toBe(state)
    expect(next.updatedAt).toBe(NOW)
    expect(Object.keys(next.isolated)).toEqual(['active', 'oldProbe'])
    expect(Object.keys(next.promoted)).toEqual(['fresh', 'boundary'])
    expect(next.probes).toEqual({ active: { hits: 1, lastTs: iso(-DAY) } })
    expect(next.isolationCounts).toEqual({ active: 1, lifted: 3 })
    expect(Object.keys(state.isolated)).toContain('lifted')
    expect(Object.keys(state.promoted)).toContain('formal')
  })

  test('無可清項目與非法時間參數皆維持原狀態參考', () => {
    const state: RoutingState = {
      version: 1,
      updatedAt: NOW,
      isolated: { active: { untilTs: iso(DAY), reason: 'ok' } },
      isolationCounts: {},
      promoted: { fresh: { score: 1, promotedAt: NOW } },
      probes: { active: { hits: 1, lastTs: NOW } },
    }
    expect(pruneRoutingState(state, [], NOW, 7 * DAY)).toBe(state)
    expect(pruneRoutingState(state, [], 'invalid', 7 * DAY)).toBe(state)
    expect(pruneRoutingState(state, [], NOW, -1)).toBe(state)
  })
})

describe('cleanupRoutingState', () => {
  test('只在有過期資料時原子覆寫既有狀態檔', () => {
    const dir = tmpDataDir()
    try {
      expect(saveRoutingState(dir, {
        version: 1,
        updatedAt: iso(-DAY),
        isolated: { lifted: { untilTs: iso(-1), reason: 'done' } },
        isolationCounts: { lifted: 1 },
        promoted: { formal: { score: 2, promotedAt: iso(-DAY) } },
        probes: { lifted: { hits: 1, lastTs: iso(-DAY) } },
      })).toBe(true)

      expect(cleanupRoutingState(dir, ['formal'], { nowIso: NOW, retentionMs: 7 * DAY })).toBe(true)
      const loaded = loadRoutingState(dir, { nowIso: NOW })
      expect(loaded.kind).toBe('state')
      expect(loaded.state).toMatchObject({
        updatedAt: NOW,
        isolated: {},
        promoted: {},
        probes: {},
      })
      expect(cleanupRoutingState(dir, ['formal'], { nowIso: NOW, retentionMs: 7 * DAY })).toBe(false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('缺檔或損壞狀態不建立、不覆寫', () => {
    const missing = tmpDataDir()
    const corrupt = tmpDataDir()
    try {
      expect(cleanupRoutingState(missing, [], { nowIso: NOW })).toBe(false)
      expect(existsSync(join(missing, ROUTING_STATE_FILENAME))).toBe(false)

      const file = join(corrupt, ROUTING_STATE_FILENAME)
      writeFileSync(file, '{broken')
      expect(cleanupRoutingState(corrupt, [], { nowIso: NOW })).toBe(false)
      expect(readFileSync(file, 'utf8')).toBe('{broken')
    } finally {
      rmSync(missing, { recursive: true, force: true })
      rmSync(corrupt, { recursive: true, force: true })
    }
  })
})
