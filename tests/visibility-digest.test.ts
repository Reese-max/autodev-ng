import { afterEach, expect, test, vi } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BacklogStore } from '../src/backlog.js'
import { runDaemon } from '../src/daemon.js'
import { RunDb } from '../src/db.js'
import { buildDigest, shouldSendDigest } from '../src/digest.js'
import { DiscordNotifier } from '../src/engines/notify.js'
import { MockEngine } from '../src/engines/mock.js'
import { EventLog } from '../src/events.js'
import { subscriptionTags, type Deps } from '../src/scheduler.js'
import { ConfigSchema } from '../src/types.js'

interface Fixture {
  root: string
  dataDir: string
  deps: Deps
  db: RunDb
  today: string
  digest: string
}

const fixtures: Fixture[] = []
const NOW = new Date('2026-08-02T12:00:00.000Z')

afterEach(() => {
  for (const fixture of fixtures.splice(0)) {
    fixture.db.close()
    rmSync(fixture.root, { recursive: true, force: true })
  }
  vi.useRealTimers()
})

function fixture(): Fixture {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  const root = mkdtempSync(join(tmpdir(), 'adng-visibility-digest-'))
  const dataDir = join(root, 'digest-output')
  const backlogFile = join(root, 'BACKLOG.md')
  const stopFile = join(root, '.adng.stop')
  mkdirSync(dataDir)
  writeFileSync(backlogFile, '# 空 backlog\n')
  writeFileSync(stopFile, '')
  const cfg = ConfigSchema.parse({
    projectPath: root,
    backlogFile,
    dataDir,
    engine: 'mock',
    stopFile,
    worktreesDir: join(root, 'worktrees'),
    timezoneOffsetHours: 0,
  })
  const db = new RunDb(join(dataDir, 'run.db'))
  const today = '2026-08-02'
  const digestDay = '2026-08-01'
  db.record({ taskId: 'ok', ok: true, costUsd: 1.25, detail: '', ts: `${digestDay}T08:00:00.000Z`, engine: 'mock' })
  db.record({ taskId: 'fail', ok: false, costUsd: 0.5, detail: '失敗', ts: `${digestDay}T09:00:00.000Z`, engine: 'mock' })
  const deps: Deps = {
    cfg,
    store: new BacklogStore(backlogFile),
    db,
    engines: { resolve: () => new MockEngine() },
    events: new EventLog(dataDir),
  }
  const digest = buildDigest({
    db,
    dataDir,
    isoDayUtc: digestDay,
    offsetHours: 0,
    subscriptionEngines: subscriptionTags(cfg),
    engines: cfg.engines,
    blockedTasks: [],
  })
  const result = { root, dataDir, deps, db, today, digest }
  fixtures.push(result)
  return result
}

function notifier(f: Fixture, status: number, bodies: string[]): DiscordNotifier {
  const tokenFile = join(f.root, 'tokens.env')
  writeFileSync(tokenFile, 'LPBOT_TOKEN=test-token\n')
  const fetchFn = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    bodies.push((JSON.parse(String(init?.body)) as { content: string }).content)
    return new Response('{}', { status })
  }) as unknown as typeof fetch
  return new DiscordNotifier({ channelId: 'digest-channel', tokenFile, dataDir: f.dataDir, fetchFn })
}

async function run(f: Fixture, discord: DiscordNotifier) {
  return runDaemon({
    deps: f.deps,
    notifier: discord,
    lockDir: join(f.root, 'daemon.lock'),
    cooldownMs: 0,
    idleSleepMs: 0,
    maxCycles: 1,
    sleepFn: async () => {},
    memFreeRatioFn: () => 1,
  })
}

test('每日 digest 組裝完成後主動送出完整內容並標記送達', async () => {
  const f = fixture()
  const bodies: string[] = []

  expect(await run(f, notifier(f, 200, bodies))).toBe('stopped')

  expect(bodies).toEqual([f.digest])
  expect(bodies[0]).toContain('完成 1 筆／失敗 1 筆')
  expect(JSON.parse(readFileSync(join(f.dataDir, 'digest-stamp.json'), 'utf8'))).toEqual({ lastSentDay: f.today })
})

test('Discord 通知失敗寫入既有 DLQ，digest 保持可重送且排程仍成功', async () => {
  const f = fixture()
  const bodies: string[] = []

  expect(await run(f, notifier(f, 503, bodies))).toBe('stopped')

  expect(bodies).toEqual([f.digest])
  const dlq = JSON.parse(readFileSync(join(f.dataDir, 'notify-dlq.jsonl'), 'utf8')) as { reason: string; textHead: string }
  expect(dlq).toMatchObject({ reason: 'http-503', textHead: [...f.digest].slice(0, 120).join('') })
  expect(existsSync(join(f.dataDir, 'digest-stamp.json'))).toBe(false)
  expect(shouldSendDigest(f.dataDir, f.today)).toBe(true)
  expect(JSON.parse(readFileSync(join(f.dataDir, 'heartbeat.json'), 'utf8'))).toMatchObject({ state: 'stopped' })
})

test('Discord 未設定時沿用既有 DLQ，digest 不阻斷排程且保留重送資格', async () => {
  const f = fixture()
  const tokenFile = join(f.root, 'tokens.env')
  writeFileSync(tokenFile, 'LPBOT_TOKEN=test-token\n')
  const fetchFn = vi.fn() as unknown as typeof fetch
  const discord = new DiscordNotifier({ channelId: undefined, tokenFile, dataDir: f.dataDir, fetchFn })

  expect(await run(f, discord)).toBe('stopped')

  expect(fetchFn).not.toHaveBeenCalled()
  const dlq = JSON.parse(readFileSync(join(f.dataDir, 'notify-dlq.jsonl'), 'utf8')) as { reason: string; textHead: string }
  expect(dlq).toMatchObject({ reason: 'not-configured', textHead: [...f.digest].slice(0, 120).join('') })
  expect(existsSync(join(f.dataDir, 'digest-stamp.json'))).toBe(false)
  expect(shouldSendDigest(f.dataDir, f.today)).toBe(true)
  expect(JSON.parse(readFileSync(join(f.dataDir, 'heartbeat.json'), 'utf8'))).toMatchObject({ state: 'stopped' })
})
