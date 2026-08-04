import { expect, test } from 'vitest'
import type { BacklogStore } from '../../src/backlog.js'
import type { RunDb } from '../../src/db.js'
import type { EventLog } from '../../src/events.js'
import { pickCandidateTags } from '../../src/engines/pick-candidates.js'
import { pickReadyTask, type Deps } from '../../src/scheduler.js'
import { ConfigSchema, type Disposition, type Engine, type Task } from '../../src/types.js'

const TASK: Task = { id: '00000000', text: 'free-tier-v1', line: 0, status: 'open' }
const ENGINE_TAGS = ['codex-sol', 'grok', 'devin', 'agy', 'oc-mimo'] as const

function fixture(options: {
  tierMode?: 'free-only'
  rotation?: string[]
  engineTag?: string
  failCount?: number
} = {}) {
  const reports: Array<{ taskId: string; disposition: Disposition }> = []
  const events: Array<{ type: string; data: Record<string, unknown> }> = []
  const resolved: string[] = []
  const cfg = ConfigSchema.parse({
    projectPath: '.', backlogFile: 'BACKLOG.md', dataDir: '.free-tier-v1',
    defaultEngine: 'codex-sol', engineIsolation: false,
    engines: Object.fromEntries(ENGINE_TAGS.map(tag => [tag, { adapter: 'mock' as const }])),
    ...(options.rotation ? { engineRotation: options.rotation } : {}),
    ...(options.tierMode ? { tierMode: options.tierMode } : {}),
  })
  const task = options.engineTag ? { ...TASK, engineTag: options.engineTag } : TASK
  const deps = {
    cfg,
    store: { report: (taskId: string, disposition: Disposition) => reports.push({ taskId, disposition }) } as unknown as BacklogStore,
    db: {
      failCount: () => options.failCount ?? 0,
      engineStatsSince: () => [],
    } as unknown as RunDb,
    events: {
      append: (type: string, data: Record<string, unknown> = {}) => { events.push({ type, data }) },
      appendOnce: (type: string, data: Record<string, unknown> = {}) => { events.push({ type, data }); return true },
    } as unknown as EventLog,
    engines: {
      resolve(tag: string): Engine {
        resolved.push(tag)
        return {
          id: tag,
          async preflight() { return { ok: true, detail: 'ready' } },
          async run() { return { ok: true, output: '', costUsd: 0 } },
        }
      },
    },
  } satisfies Pick<Deps, 'cfg' | 'store' | 'db' | 'events' | 'engines'>
  return { cfg, deps, task, reports, events, resolved }
}

test('預設：tierMode 未設時 schema 不補欄位，既有 rotation 候選位元組不變', async () => {
  const input = { rotation: ['codex-sol', 'devin'], defaultEngine: 'codex-sol', task: TASK, failCount: 0 }
  const legacyBytes = Buffer.from(JSON.stringify(pickCandidateTags(input)))
  const optionalBytes = Buffer.from(JSON.stringify(pickCandidateTags({ ...input, tierMode: undefined })))
  expect(optionalBytes).toEqual(legacyBytes)
  expect(optionalBytes.toString()).toBe('["codex-sol","devin"]')

  const f = fixture({ rotation: input.rotation })
  expect(Object.hasOwn(f.cfg, 'tierMode')).toBe(false)
  expect(await pickReadyTask(f.deps, [f.task])).toMatchObject({ engineTag: 'codex-sol' })
  expect(f.resolved).toEqual(['codex-sol'])
})

test('免費 rotation：free-only 先移除 quota 檔位，再只在免費檔位間輪替', async () => {
  const f = fixture({
    tierMode: 'free-only',
    rotation: ['codex-sol', 'devin', 'grok', 'oc-mimo'],
    failCount: 1,
  })
  expect(await pickReadyTask(f.deps, [f.task])).toMatchObject({ engineTag: 'oc-mimo' })
  expect(f.resolved).toEqual(['oc-mimo'])
})

test('quota 釘選：free-only 直接 blocked(engine-not-allowed)，不降級或改派', async () => {
  const f = fixture({ tierMode: 'free-only', rotation: ['devin'], engineTag: 'codex-sol' })
  expect(await pickReadyTask(f.deps, [f.task])).toMatchObject({ kind: 'blocked', reason: 'engine-not-allowed' })
  expect(f.resolved).toEqual([])
  expect(f.reports).toEqual([{
    taskId: TASK.id,
    disposition: { kind: 'blocked', reason: expect.stringContaining('free-only') },
  }])
  expect(f.events).toContainEqual({
    type: 'task-blocked',
    data: expect.objectContaining({ reason: 'engine-not-allowed', detail: expect.stringContaining('free-only') }),
  })
})

test('免費釘選：free-only 尊重行內 free-tier 引擎，不受 quota 預設與 rotation 影響', async () => {
  const f = fixture({ tierMode: 'free-only', rotation: ['codex-sol', 'grok'], engineTag: 'agy' })
  expect(await pickReadyTask(f.deps, [f.task])).toMatchObject({ engineTag: 'agy' })
  expect(f.resolved).toEqual(['agy'])
  expect(f.reports).toEqual([])
})
