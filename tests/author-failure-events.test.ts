import { describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { authorGoal } from '../src/autopilot/author.js'
import { EventLog } from '../src/events.js'
import { runPerpetualCycle, type PerpetualHooks } from '../src/autopilot/perpetual.js'

const fingerprint = 'author-failure-fp'
const problem = { title: '新艦立案失敗', lens: 'correctness', value: 8, rationale: '需可診斷' }
const cfg = { projectPath: process.cwd(), verifyCommand: 'npm test' } as never

function capture() {
  const events: Array<{ type: string; data: Record<string, unknown> }> = []
  return { events, onEvent: (type: string, data: Record<string, unknown>) => events.push({ type, data }) }
}

describe('authorGoal 立案失敗事件', () => {
  it('無 verifyCommand → author-config-reject', async () => {
    const c = capture()
    expect(await authorGoal(async () => 'OBJECTIVE: 不應呼叫', problem, { projectPath: process.cwd() } as never, fingerprint, c)).toBeNull()
    expect(c.events).toContainEqual(expect.objectContaining({ type: 'author-config-reject', data: expect.objectContaining({ fingerprint, title: problem.title, failure: 'verify-command-missing' }) }))
  })

  it('北極星 REJECT → author-northstar-reject', async () => {
    const c = capture(), raw = 'REJECT: 基建未阻擋使用者價值'
    expect(await authorGoal(async () => raw, problem, cfg, fingerprint, { ...c, northstar: '判準' })).toBeNull()
    expect(c.events).toContainEqual(expect.objectContaining({ type: 'author-northstar-reject', data: expect.objectContaining({ fingerprint, title: problem.title, failure: 'northstar-reject', response: raw }) }))
  })

  it('缺 OBJECTIVE 段 → author-objective-missing', async () => {
    const c = capture(), raw = 'VERIFY: npm test\nEVIDENCE:'
    expect(await authorGoal(async () => raw, problem, cfg, fingerprint, c)).toBeNull()
    expect(c.events).toContainEqual(expect.objectContaining({ type: 'author-objective-missing', data: expect.objectContaining({ fingerprint, title: problem.title, failure: 'objective-missing', response: raw }) }))
  })

  it('chat 拋錯 → author-chat-error', async () => {
    const c = capture()
    expect(await authorGoal(async () => { throw new Error('endpoint unavailable') }, problem, cfg, fingerprint, c)).toBeNull()
    expect(c.events).toContainEqual(expect.objectContaining({ type: 'author-chat-error', data: expect.objectContaining({ fingerprint, title: problem.title, failure: 'chat-error', error: 'Error: endpoint unavailable' }) }))
  })

  it('perpetual-no-case 帶首個候選失敗類別', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'adng-author-failure-'))
    try {
      const hooks: PerpetualHooks = {
        now: () => new Date('2026-07-31T00:00:00Z'),
        discover: async () => ({ survey: '', ranked: [problem] }),
        author: async (_problem, _fingerprint, _feedback, onFailure) => { onFailure?.('objective-missing'); return null },
        gateAuthoredGoal: async () => ({ ok: true, verifyCommand: 'npm test' }),
        runSession: async () => 'no-goal',
        billedToday: () => 0
      }
      const events = new EventLog(dir)
      await runPerpetualCycle({ perpetual: true, stopFile: join(dir, '.stop'), dailyHardUsd: 1, goalFile: join(dir, 'GOAL.md'), perpetualCooldownMs: 6000, perpetualValueThreshold: 6 } as never, dir, events, async () => true, hooks)
      const eventFile = join(dir, 'events.jsonl')
      const noCase = existsSync(eventFile) ? readFileSync(eventFile, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line)).find(e => e.type === 'perpetual-no-case') : undefined
      expect(noCase?.firstFailure).toBe('objective-missing')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
