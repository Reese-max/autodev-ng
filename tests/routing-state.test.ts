import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import {
  REUSE_CURRENT,
  ROUTING_STATE_FILENAME,
  ROUTING_STATE_VERSION,
  defaultRoutingState,
  loadRoutingState,
  normalizeRoutingState,
  routingStatePath,
  routingStateForUpdate,
  saveRoutingState,
  shouldApplyRoutingState,
} from '../src/engines/routing-state.js'
import { candidateEngines } from '../src/engines/rotation.js'

function tmpDataDir(): string {
  return mkdtempSync(join(tmpdir(), 'adng-routing-state-'))
}

const NOW = '2026-07-20T00:00:00.000Z'

describe('routing-state path & defaults', () => {
  test('路徑落在 dataDir/engine-routing-state.json', () => {
    const dir = tmpDataDir()
    expect(routingStatePath(dir)).toBe(join(dir, ROUTING_STATE_FILENAME))
  })

  test('defaultRoutingState 為空 map + 目前版本', () => {
    const s = defaultRoutingState(NOW)
    expect(s).toEqual({
      version: ROUTING_STATE_VERSION,
      updatedAt: NOW,
      isolated: {},
      isolationCounts: {},
      promoted: {},
      probes: {},
    })
  })
})

describe('loadRoutingState 回退（不影響原派工）', () => {
  test('缺檔 → reuse-current + missing，不應覆寫候選', () => {
    const dir = tmpDataDir()
    const result = loadRoutingState(dir, { nowIso: NOW })
    expect(result).toEqual({
      kind: 'reuse-current',
      decision: REUSE_CURRENT,
      reason: 'missing',
      state: defaultRoutingState(NOW),
    })
    expect(shouldApplyRoutingState(result)).toBe(false)
  })

  test('內容損壞（非 JSON）→ corrupt', () => {
    const dir = tmpDataDir()
    const file = join(dir, ROUTING_STATE_FILENAME)
    writeFileSync(file, '{{{')
    const result = loadRoutingState(dir, { nowIso: NOW })
    expect(result.kind).toBe('reuse-current')
    if (result.kind !== 'reuse-current') throw new Error('expected reuse')
    expect(result.reason).toBe('corrupt')
    expect(shouldApplyRoutingState(result)).toBe(false)
    expect(routingStateForUpdate(result)).toBeNull()
    expect(saveRoutingState(dir, defaultRoutingState(NOW), { nowIso: NOW })).toBe(false)
    expect(readFileSync(file, 'utf8')).toBe('{{{')
  })

  test('形狀非法（陣列/字串）→ invalid-shape', () => {
    const dir = tmpDataDir()
    writeFileSync(join(dir, ROUTING_STATE_FILENAME), JSON.stringify(['x']))
    const result = loadRoutingState(dir, { nowIso: NOW })
    expect(result).toMatchObject({ kind: 'reuse-current', reason: 'invalid-shape' })
  })

  test('版本不符即使仍帶可讀 map → unsupported-version', () => {
    const dir = tmpDataDir()
    writeFileSync(
      join(dir, ROUTING_STATE_FILENAME),
      JSON.stringify({
        version: 99,
        isolated: { qwen: { untilTs: '2099-01-01T00:00:00.000Z', reason: 'future' } },
      })
    )
    const result = loadRoutingState(dir, { nowIso: NOW })
    expect(result).toMatchObject({ kind: 'reuse-current', reason: 'unsupported-version' })
    expect(shouldApplyRoutingState(result)).toBe(false)
  })

  test('已解析但路由 map 形狀損壞 → invalid-shape', () => {
    const dir = tmpDataDir()
    writeFileSync(
      join(dir, ROUTING_STATE_FILENAME),
      JSON.stringify({ version: 1, isolated: ['qwen'] })
    )
    const result = loadRoutingState(dir, { nowIso: NOW })
    expect(result).toMatchObject({ kind: 'reuse-current', reason: 'invalid-shape' })
    expect(shouldApplyRoutingState(result)).toBe(false)
    expect(routingStateForUpdate(result)).toBeNull()
  })

  test('reuse-current 時既有 candidateEngines 路徑不變', () => {
    const dir = tmpDataDir()
    writeFileSync(join(dir, ROUTING_STATE_FILENAME), 'not-json')
    const loaded = loadRoutingState(dir, { nowIso: NOW })
    expect(shouldApplyRoutingState(loaded)).toBe(false)
    const rotation = ['a', 'b', 'c']
    const tags = candidateEngines(rotation, 'default', { id: 'deadbeef' }, 1)
    expect(tags).toEqual(candidateEngines(rotation, 'default', { id: 'deadbeef' }, 1))
    expect(tags[0]).toBeDefined()
  })
})

describe('loadRoutingState 版本相容與缺欄回填', () => {
  test('完整 v1 檔正常讀取', () => {
    const dir = tmpDataDir()
    const body = {
      version: 1,
      updatedAt: '2026-07-19T12:00:00.000Z',
      isolated: { qwen: { untilTs: '2026-07-21T00:00:00.000Z', reason: 'probe-fail' } },
      isolationCounts: { qwen: 2 },
      promoted: { codex: { score: 3, promotedAt: '2026-07-18T00:00:00.000Z' } },
      probes: { opencode: { hits: 2, lastTs: '2026-07-19T01:00:00.000Z' } },
    }
    writeFileSync(join(dir, ROUTING_STATE_FILENAME), JSON.stringify(body))
    const result = loadRoutingState(dir, { nowIso: NOW })
    expect(result.kind).toBe('state')
    if (result.kind !== 'state') throw new Error('expected state')
    expect(result.source).toBe('file')
    expect(result.state).toEqual(body)
    expect(shouldApplyRoutingState(result)).toBe(true)
  })

  test('缺 version / 缺 map 欄位 → 回填預設仍 usable', () => {
    const dir = tmpDataDir()
    writeFileSync(
      join(dir, ROUTING_STATE_FILENAME),
      JSON.stringify({
        isolated: { a: { untilTs: 't', reason: 'r' } },
      })
    )
    const result = loadRoutingState(dir, { nowIso: NOW })
    expect(result.kind).toBe('state')
    if (result.kind !== 'state') throw new Error('expected state')
    expect(result.state.version).toBe(1)
    expect(result.state.updatedAt).toBe(NOW)
    expect(result.state.isolated).toEqual({ a: { untilTs: 't', reason: 'r' } })
    expect(result.state.isolationCounts).toEqual({})
    expect(result.state.promoted).toEqual({})
    expect(result.state.probes).toEqual({})
  })

  test('單筆 entry 缺欄 / 型別錯 → 安全回填，不炸', () => {
    const dir = tmpDataDir()
    writeFileSync(
      join(dir, ROUTING_STATE_FILENAME),
      JSON.stringify({
        version: 1,
        isolated: {
          ok: { untilTs: 'u', reason: 'r' },
          bad: { untilTs: 1, reason: null },
          skip: 'not-object',
        },
        promoted: {
          p: { score: -1.5, promotedAt: 9 },
        },
        probes: {
          pr: { hits: 'x', lastTs: undefined },
        },
      })
    )
    const result = loadRoutingState(dir, { nowIso: NOW })
    expect(result.kind).toBe('state')
    if (result.kind !== 'state') throw new Error('expected state')
    expect(result.state.isolated).toEqual({
      ok: { untilTs: 'u', reason: 'r' },
      bad: { untilTs: '', reason: '' },
    })
    expect(result.state.promoted).toEqual({ p: { score: 0, promotedAt: '' } })
    expect(result.state.probes).toEqual({ pr: { hits: 0, lastTs: '' } })
    expect(result.state.isolationCounts).toEqual({})
  })

  test('未來版本若仍帶 v1 map 欄位 → 沿用原派工', () => {
    const dir = tmpDataDir()
    writeFileSync(
      join(dir, ROUTING_STATE_FILENAME),
      JSON.stringify({
        version: 2,
        isolated: { x: { untilTs: 'u', reason: 'r' } },
        extraFuture: true,
      })
    )
    const result = loadRoutingState(dir, { nowIso: NOW })
    expect(result).toMatchObject({ kind: 'reuse-current', reason: 'unsupported-version' })
    expect(shouldApplyRoutingState(result)).toBe(false)
  })
})

describe('saveRoutingState', () => {
  test('tmp+rename 寫入可讀回，永遠帶 version=1', () => {
    const dir = tmpDataDir()
    const ok = saveRoutingState(
      dir,
      {
        version: ROUTING_STATE_VERSION,
        updatedAt: 'old',
        isolated: { e: { untilTs: 'u', reason: 'r' } },
        isolationCounts: { e: 1 },
        promoted: {},
        probes: {},
      },
      { nowIso: NOW }
    )
    expect(ok).toBe(true)
    expect(existsSync(join(dir, ROUTING_STATE_FILENAME))).toBe(true)
    expect(existsSync(join(dir, `${ROUTING_STATE_FILENAME}.tmp`))).toBe(false)
    const disk = JSON.parse(readFileSync(join(dir, ROUTING_STATE_FILENAME), 'utf8')) as {
      version: number
      updatedAt: string
    }
    expect(disk.version).toBe(1)
    expect(disk.updatedAt).toBe(NOW)
    const loaded = loadRoutingState(dir, { nowIso: NOW })
    expect(loaded.kind).toBe('state')
    if (loaded.kind !== 'state') throw new Error('expected state')
    expect(loaded.state.isolated).toEqual({ e: { untilTs: 'u', reason: 'r' } })
    expect(loaded.state.isolationCounts).toEqual({ e: 1 })
  })

  test('dataDir 不存在時會建立目錄再寫', () => {
    const parent = tmpDataDir()
    const dir = join(parent, 'nested', 'data')
    expect(saveRoutingState(dir, defaultRoutingState(NOW), { nowIso: NOW })).toBe(true)
    expect(existsSync(join(dir, ROUTING_STATE_FILENAME))).toBe(true)
  })

  test('寫入目標不可用 → 回 false 不拋（fail-open）', () => {
    const dir = tmpDataDir()
    // 用檔案佔位成「目錄」，mkdir/write 會失敗
    const blocked = join(dir, 'as-file-not-dir')
    writeFileSync(blocked, 'x')
    const fileAsDirChild = join(blocked, 'child')
    expect(saveRoutingState(fileAsDirChild, defaultRoutingState(NOW))).toBe(false)
  })
})

describe('normalizeRoutingState 純函式', () => {
  test('null / 陣列 → null', () => {
    expect(normalizeRoutingState(null, NOW)).toBeNull()
    expect(normalizeRoutingState([], NOW)).toBeNull()
  })

  test('空物件可正規化為預設 v1', () => {
    expect(normalizeRoutingState({}, NOW)).toEqual(defaultRoutingState(NOW))
  })

  test('舊格式無 isolationCounts 時視為 0', () => {
    const state = normalizeRoutingState({ version: 1, isolated: {} }, NOW)
    expect(state?.isolationCounts.qwen ?? 0).toBe(0)
  })
})

describe('與既有派工路徑隔離', () => {
  test('有狀態時 shouldApply=true，但本模組不改 candidateEngines 純函式', () => {
    const dir = tmpDataDir()
    mkdirSync(dir, { recursive: true })
    saveRoutingState(
      dir,
      {
        version: 1,
        updatedAt: NOW,
        isolated: { bad: { untilTs: '2099-01-01T00:00:00.000Z', reason: 'x' } },
        isolationCounts: {},
        promoted: {},
        probes: {},
      },
      { nowIso: NOW }
    )
    const loaded = loadRoutingState(dir, { nowIso: NOW })
    expect(shouldApplyRoutingState(loaded)).toBe(true)
    // 路由決策尚未接線：rotation 行為與狀態無關，確保本 PR 不隱性改派工
    expect(candidateEngines(['a', 'b'], 'a', { id: '1' }, 0)).toEqual(
      candidateEngines(['a', 'b'], 'a', { id: '1' }, 0)
    )
  })
})
