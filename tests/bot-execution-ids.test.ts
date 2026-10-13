import { afterEach, expect, test } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ConfigSchema } from '../src/types.js'
import { createExecutionObservation } from '../src/engines/execution-observation.js'
import { ControlStore } from '../src/engines/steering.js'
import { handleProject, type ProjectRuntime } from '../src/bot/route.js'
import { monitorRuntimeLines, readMonitor } from '../src/bot/monitor.js'

const roots: string[] = []
const observations: ReturnType<typeof createExecutionObservation>[] = []
afterEach(() => {
  for (const observation of observations.splice(0)) observation.finish('completed')
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

function fixture(ids: string[], longTask = false) {
  const root = mkdtempSync(join(tmpdir(), 'adng-bot-execution-')); roots.push(root)
  const cfgPath = join(root, 'config.json')
  const cfg = ConfigSchema.parse({ engine:'mock', projectPath: root, dataDir: join(root, 'data'), backlogFile: join(root, 'BACKLOG.md') })
  writeFileSync(cfgPath, JSON.stringify(cfg)); writeFileSync(cfg.backlogFile, '- [ ] fixture\n')
  mkdirSync(cfg.dataDir, { recursive: true })
  ids.forEach((executionId, i) => observations.push(createExecutionObservation({
    dataDir: cfg.dataDir, adapter: 'mock',
    job: { executionId, projectPath: root,
      task: { id: `task-${i}${longTask ? '-label'.repeat(2000) : ''}`, text: 'fixture', line: i, status: 'open' } },
  })))
  const runtime: ProjectRuntime = { allowed: ['operator'], monitorOnly: { cfg, cfgPath } }
  return { cfg, cfgPath, runtime }
}

test.each([
  ['status', 'steer'], ['status', 'enqueue'], ['monitor', 'steer'], ['monitor', 'enqueue'],
] as const)('%s exposes complete colliding-prefix UUIDs usable by %s exact lookup', async (read, action) => {
  const ids = ['12345678-1111-4111-8111-111111111111', '12345678-2222-4222-8222-222222222222']
  const f = fixture(ids)
  const shown = await handleProject(read, '', f.runtime)
  const copied = [...shown.text.matchAll(/task-\d\/([A-Za-z0-9_-]+)/g)].map(match => match[1]!)
  expect(copied.sort()).toEqual(ids)
  for (const id of copied) {
    const result = await handleProject(action, `${id} apply fixture instruction`, f.runtime, undefined, { issuer: 'operator' })
    expect(result.ok).toBe(true)
    expect(result.text).not.toContain('REJECTED_STALE_TARGET')
  }
  expect(new ControlStore(f.cfg.dataDir).list().pending.map(envelope => envelope.executionId).sort()).toEqual(ids)
})

test('execution summary bounds task labels and item count while preserving full maximum-length IDs', () => {
  const ids = Array.from({ length: 6 }, (_, i) => `execution-${i}-`.padEnd(100, 'x'))
  const f = fixture(ids, true)
  const lines = monitorRuntimeLines(readMonitor(f.cfg, f.cfgPath))
  const summary = lines.find(line => line.startsWith('執行觀測：'))!
  expect(summary.length).toBeLessThanOrEqual(1024)
  expect(summary).toContain('等 6 項')
  expect(ids.filter(id => summary.includes(id))).toHaveLength(5)
  expect(lines).toContain('派工：未暫停')
})
