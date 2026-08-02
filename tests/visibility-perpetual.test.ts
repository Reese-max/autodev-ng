import { afterEach, expect, test, vi } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ConfigSchema } from '../src/types.js'
import { EventLog } from '../src/events.js'
import { DiscordNotifier } from '../src/engines/notify.js'
import { AUTO_GOAL_MARKER } from '../src/autopilot/author.js'
import { ProblemsLedger, problemFingerprint } from '../src/autopilot/ledger.js'
import { runPerpetualCycle, type PerpetualConfig, type PerpetualHooks } from '../src/autopilot/perpetual.js'

const NOW = new Date('2026-08-02T12:00:00.000Z')
const problem = {
  title: '新 GOAL 缺少即時可見性',
  lens: 'correctness',
  value: 9,
  rationale: '新 GOAL 必須在執行前可被營運者看見。'
}
const fp = problemFingerprint(problem.title)
const verifyCommand = `npx vitest run tests/${fp}-visibility-perpetual.test.ts`
const goalMd = `${AUTO_GOAL_MARKER} problem:${fp} -->\n# GOAL\n\n修復新 GOAL 可見性\n\n## 驗收\n\n\`\`\`sh\n${verifyCommand}\n\`\`\`\n\n連續無進展上限：2\n`
const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) {
    try { rmSync(root, { recursive: true, force: true }) } catch { /* Windows SQLite handle lag */ }
  }
})

function fixture(): { root: string; cfg: PerpetualConfig; events: EventLog } {
  const root = mkdtempSync(join(tmpdir(), 'adng-visibility-perpetual-'))
  roots.push(root)
  const cfg = ConfigSchema.parse({
    projectPath: root,
    backlogFile: join(root, 'BACKLOG.md'),
    dataDir: root,
    goalFile: join(root, 'GOAL.md'),
    stopFile: join(root, '.adng.stop'),
    engine: 'mock',
    verifyCommand: 'npm test',
    dailyHardUsd: 100
  })
  return { root, cfg: { ...cfg, perpetual: true, perpetualCooldownMs: 0, perpetualValueThreshold: 6 }, events: new EventLog(root) }
}

function hooks(runSession = vi.fn(async () => 'lock-busy' as const)): PerpetualHooks {
  return {
    now: () => NOW,
    discover: vi.fn(async () => ({ survey: '', ranked: [problem] })),
    author: vi.fn(async () => goalMd),
    gateAuthoredGoal: vi.fn(async () => ({ ok: true as const, verifyCommand })),
    runSession,
    billedToday: () => 0
  }
}

function eventTypes(root: string): string[] {
  return readFileSync(join(root, 'events.jsonl'), 'utf8').trim().split('\n').map(line => (JSON.parse(line) as { type: string }).type)
}

test('perpetual-goal-authored 立即走同一 notify 通道，帶完整成案與專屬驗收資訊', async () => {
  const f = fixture()
  const notify = vi.fn(async (_text: string) => true)
  const runSession = vi.fn(async () => 'lock-busy' as const)
  const append = vi.spyOn(f.events, 'append')

  expect(await runPerpetualCycle(f.cfg, f.root, f.events, notify, hooks(runSession))).toBe(false)

  expect(eventTypes(f.root)).toContain('perpetual-goal-authored')
  const authoredCall = append.mock.calls.findIndex(([type]) => type === 'perpetual-goal-authored')
  expect(authoredCall).toBeGreaterThanOrEqual(0)
  expect(notify).toHaveBeenCalledOnce()
  expect(append.mock.invocationCallOrder[authoredCall]).toBeLessThan(notify.mock.invocationCallOrder[0]!)
  expect(notify.mock.invocationCallOrder[0]).toBeLessThan(runSession.mock.invocationCallOrder[0]!)
  const message = notify.mock.calls[0]![0]
  expect(message).toContain(problem.title)
  expect(message).toContain(`lens：${problem.lens}`)
  expect(message).toContain(`critic VALUE：${problem.value}`)
  expect(message).toContain(`rationale：${problem.rationale}`)
  expect(message).toContain(`驗收：${verifyCommand}`)
  expect(message).toContain('介入：沿用既有 stopFile 暫停，或置換 GOAL.md 接手。')
})

test('Discord 成案通知失敗進既有 DLQ，立案、GOAL 寫入與 session 交接仍成功', async () => {
  const f = fixture()
  const tokenFile = join(f.root, 'tokens.env')
  writeFileSync(tokenFile, 'LPBOT_TOKEN=test-token\n')
  const bodies: string[] = []
  const fetchFn = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    bodies.push((JSON.parse(String(init?.body)) as { content: string }).content)
    return new Response('{}', { status: 503 })
  }) as unknown as typeof fetch
  const discord = new DiscordNotifier({ channelId: 'perpetual-channel', tokenFile, dataDir: f.root, fetchFn })
  const runSession = vi.fn(async () => 'lock-busy' as const)

  expect(await runPerpetualCycle(f.cfg, f.root, f.events, text => discord.send(text), hooks(runSession))).toBe(false)

  expect(bodies).toHaveLength(1)
  const dlq = JSON.parse(readFileSync(join(f.root, 'notify-dlq.jsonl'), 'utf8')) as { reason: string; textHead: string }
  expect(dlq).toMatchObject({ reason: 'http-503', textHead: [...bodies[0]!].slice(0, 120).join('') })
  expect(eventTypes(f.root)).toContain('perpetual-goal-authored')
  expect(existsSync(f.cfg.goalFile!)).toBe(true)
  expect(readFileSync(f.cfg.goalFile!, 'utf8')).toContain(verifyCommand)
  const ledger = new ProblemsLedger(join(f.root, 'run.db'))
  expect(ledger.get(fp)).toMatchObject({ status: 'in-progress', title: problem.title, lens: problem.lens, value: problem.value })
  ledger.close()
  expect(runSession).toHaveBeenCalledOnce()
})
