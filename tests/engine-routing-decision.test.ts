import { describe, expect, expectTypeOf, test } from 'vitest'
import {
  ISOLATE,
  PROBE,
  PROMOTE,
  REUSE_CURRENT,
  type RoutingDecision,
} from '../src/engines/routing-decision.js'
import { selectEnginesToIsolate } from '../src/engines/isolation-policy.js'
import { pickCandidateTags } from '../src/engines/pick-candidates.js'
import { candidateEngines } from '../src/engines/rotation.js'
import { shouldPromote } from '../src/engines/routing-transition.js'
import type { EngineRunStats } from '../src/engines/run-stats.js'

const ROTATION = ['qwen', 'codex']
const TASK = { id: '00000000' }

function routeByStats(stats: readonly EngineRunStats[] | undefined, rotation = ROTATION): string[] {
  const isolatedTags = stats
    ? selectEnginesToIsolate(stats, rotation).map(target => target.engine)
    : []
  return pickCandidateTags({
    rotation,
    defaultEngine: 'claude',
    task: TASK,
    failCount: 0,
    isolatedTags,
  })
}

// 僅餵入已取得的輪替與戰績；不建 DB、不讀檔、不碰 scheduler。
describe('引擎路由決策契約', () => {
  test('四種決策共用單一字面型別', () => {
    const decisions = [ISOLATE, PROBE, PROMOTE, REUSE_CURRENT] as const satisfies readonly RoutingDecision[]
    expect(decisions).toEqual(['隔離', '試探', '晉升', '沿用現狀'])
    expectTypeOf<RoutingDecision>().toEqualTypeOf<(typeof decisions)[number]>()
  })

  test('無 engineRotation 時維持既有 defaultEngine 路徑', () => {
    expect(pickCandidateTags({
      rotation: undefined,
      defaultEngine: 'claude',
      task: TASK,
      failCount: 9,
    })).toEqual(['claude'])
  })

  test('無 run.db 戰績時沿用既有候選順序', () => {
    expect(routeByStats(undefined)).toEqual(candidateEngines(ROTATION, 'claude', TASK, 0))
  })

  test('樣本數未達門檻時沿用既有候選順序', () => {
    const insufficient = [
      { engine: 'qwen', sampleCount: 5, ok: 0, fail: 5, successRate: 0 },
    ]
    expect(routeByStats(insufficient)).toEqual(candidateEngines(ROTATION, 'claude', TASK, 0))
  })

  test('成功率恰在門檻時可晉升，低於門檻時不可晉升', () => {
    expect(shouldPromote(4, 0.5)).toBe(true)
    expect(shouldPromote(4, 0.499)).toBe(false)
  })

  test('有健康候選時，仍在隔離期的候選不應被派工', () => {
    const stats: EngineRunStats[] = [
      { engine: 'qwen', sampleCount: 6, ok: 1, fail: 5, successRate: 1 / 6 },
      { engine: 'codex', sampleCount: 6, ok: 5, fail: 1, successRate: 5 / 6 },
    ]
    expect(routeByStats(stats)).toEqual(['codex'])
  })
})
