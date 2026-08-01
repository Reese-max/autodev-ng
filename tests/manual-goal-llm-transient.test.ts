import { afterEach, describe, expect, test, vi } from 'vitest'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BacklogStore } from '../src/backlog.js'
import { EventLog } from '../src/events.js'
import { ConfigSchema } from '../src/types.js'
import { savePerpetualState } from '../src/autopilot/author.js'
import { callAgent, type LlmOpts } from '../src/autopilot/llm.js'
import { runGoalSession, type OrchestratorDeps } from '../src/autopilot/orchestrator.js'
import { runPerpetualCycle, type PerpetualConfig, type PerpetualHooks } from '../src/autopilot/perpetual.js'
import { plan } from '../src/autopilot/planner.js'

const goal = { objective: '保留手動目標', noProgressLimit: 2 }

function response(content: string): typeof fetch {
  return (async () => ({
    ok: true, status: 200,
    json: async () => ({ choices: [{ message: { content } }] })
  })) as unknown as typeof fetch
}

afterEach(() => vi.useRealTimers())

describe('callAgent 暫時性失敗', () => {
  test('非 2xx 與 fetch throw 都回可辨識錯誤', async () => {
    const http = await callAgent({
      url: 'http://x/v1', model: 'm', apiKey: 'k',
      fetchFn: (async () => ({ ok: false, status: 503 })) as unknown as typeof fetch
    }, 'p')
    expect(http).toMatchObject({ text: '', totalTokens: 0, error: 'HTTP 503' })

    const thrown = await callAgent({
      url: 'http://x/v1', model: 'm', apiKey: 'k',
      fetchFn: (async () => { throw new Error('proxy offline') }) as unknown as typeof fetch
    }, 'p')
    expect(thrown).toMatchObject({ text: '', totalTokens: 0 })
    expect(thrown.error).toContain('proxy offline')
  })

  test('judgeTimeoutMs 指定的時間到達才 abort，並回 timeout 錯誤', async () => {
    vi.useFakeTimers()
    const judgeTimeoutMs = 37
    let signal: AbortSignal | undefined
    const fetchFn = ((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      signal = init?.signal as AbortSignal
      signal.addEventListener('abort', () => reject(new Error('aborted')))
    })) as typeof fetch

    const pending = callAgent({ url: 'http://x/v1', model: 'm', apiKey: 'k', timeoutMs: judgeTimeoutMs, fetchFn }, 'p')
    await vi.advanceTimersByTimeAsync(judgeTimeoutMs - 1)
    expect(signal?.aborted).toBe(false)
    await vi.advanceTimersByTimeAsync(1)

    expect(signal?.aborted).toBe(true)
    expect(await pending).toMatchObject({ text: '', totalTokens: 0, error: `timeout after ${judgeTimeoutMs}ms` })
  })

  test('模型有效回空字串仍維持既有 planner stuck 語意', async () => {
    const llm: LlmOpts = { url: 'http://x/v1', model: 'm', apiKey: 'k', fetchFn: response('') }
    expect((await callAgent(llm, 'p')).error).toBeUndefined()
    expect(await plan(llm, { goal, repoSummary: '', history: [] }))
      .toEqual({ kind: 'stuck', reason: 'planner 無回應' })
  })
})

test('planner 呼叫失敗不消耗手動 GOAL，下一 cycle 可重跑並留下事件', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-manual-llm-'))
  try {
    const cfg: PerpetualConfig = {
      ...ConfigSchema.parse({
        projectPath: dir, backlogFile: join(dir, 'BACKLOG.md'), dataDir: dir,
        goalFile: join(dir, 'GOAL.md'), stopFile: join(dir, '.adng.stop'),
        engine: 'mock', dailyHardUsd: 100, judgeTimeoutMs: 37
      }),
      perpetual: true, perpetualCooldownMs: 6000
    }
    writeFileSync(cfg.backlogFile, '')
    writeFileSync(cfg.goalFile!, '# GOAL\n\n保留手動目標\n\n## 驗收\n\n```sh\nnpm test\n```\n')
    savePerpetualState(dir, { lastSessionTs: '', consecutiveEmpty: 0, currentCooldownMs: 6000, manualGoalDone: '' })

    let calls = 0
    const llm: LlmOpts = {
      url: 'http://x/v1', model: 'm', apiKey: 'k', timeoutMs: cfg.judgeTimeoutMs,
      fetchFn: (async () => {
        calls++
        if (calls === 1) throw new Error('proxy starting')
        return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: 'ACHIEVED' } }] }) }
      }) as unknown as typeof fetch
    }
    const events = new EventLog(dir)
    const runOnceFn = vi.fn(async () => 'idle' as const)
    const runSession = vi.fn(async () => ({
      goalId: 'test',
      outcome: await runGoalSession({
        goalId: 'test', goal, cwd: dir,
        kernelDeps: { store: new BacklogStore(cfg.backlogFile), cfg, events } as unknown as OrchestratorDeps['kernelDeps'],
        planFn: input => plan(llm, input),
        evalFn: async () => ({ achieved: true, score: 1, detail: 'ok' }),
        runOnceFn,
        isAlive: () => true
      })
    }))
    const hooks: PerpetualHooks = {
      now: () => new Date('2026-08-01T00:00:00Z'),
      discover: async () => ({ survey: '', ranked: [] }),
      author: async () => null,
      gateAuthoredGoal: async () => ({ ok: true, verifyCommand: 'npm test' }),
      runSession,
      billedToday: () => 0
    }

    expect(await runPerpetualCycle(cfg, dir, events, async () => true, hooks)).toBe(true)
    const firstState = JSON.parse(readFileSync(join(dir, 'perpetual-state.json'), 'utf8')) as Record<string, unknown>
    expect(firstState.manualGoalDone).toBe('')
    expect(firstState.lastSessionTs).toBe('')
    const audit = readFileSync(join(dir, 'events.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line))
    expect(audit).toContainEqual(expect.objectContaining({
      type: 'manual-goal-retryable',
      reason: expect.stringContaining('planner 呼叫失敗')
    }))

    expect(await runPerpetualCycle(cfg, dir, events, async () => true, hooks)).toBe(true)
    expect(runSession).toHaveBeenCalledTimes(2)
    expect(runOnceFn).not.toHaveBeenCalled()
    const finalState = JSON.parse(readFileSync(join(dir, 'perpetual-state.json'), 'utf8')) as Record<string, unknown>
    expect(finalState.manualGoalDone).toBe(createHash('sha1').update(goal.objective).digest('hex').slice(0, 4))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
