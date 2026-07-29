import { expect, test } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runOnce, type Deps } from '../src/scheduler.js'
import { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { noteSerialConcurrency } from '../src/engines/concurrency-notice.js'
import { MockEngine, type MockStep } from '../src/engines/mock.js'
import { ConfigSchema } from '../src/types.js'

interface Fixture {
  deps: Deps
  engine: MockEngine
}

function makeFixture(script: MockStep[], explicitConcurrency: boolean, backlog = '- [ ] 任務一\n'): Fixture {
  const dir = mkdtempSync(join(tmpdir(), 'adng-compat-'))
  const git = (args: string[]) => execFileSync('git', args, { cwd: dir, stdio: 'ignore' })
  git(['init', '-b', 'main'])
  git(['config', 'user.email', 'adng-test@example.com'])
  git(['config', 'user.name', 'adng-test'])
  git(['config', 'core.autocrlf', 'false'])
  writeFileSync(join(dir, 'README.md'), '# compat test\n')
  git(['add', '.'])
  git(['commit', '-m', 'chore: init'])

  const backlogFile = join(dir, 'BACKLOG.md')
  writeFileSync(backlogFile, backlog)
  const input: Record<string, unknown> = {
    projectPath: dir,
    backlogFile,
    dataDir: join(dir, 'data'),
    engine: 'mock',
    stopFile: join(dir, '.adng.stop'),
    worktreesDir: join(dir, 'worktrees'),
  }
  if (explicitConcurrency) input.concurrency = 1
  const cfg = ConfigSchema.parse(input)
  const engine = new MockEngine(script)
  return {
    engine,
    deps: {
      cfg,
      store: new BacklogStore(backlogFile),
      db: new RunDb(join(dir, 'run.db')),
      engines: { resolve: () => engine },
      events: new EventLog(cfg.dataDir),
    },
  }
}

function eventTypes(fixture: Fixture): string[] {
  const file = join(fixture.deps.cfg.dataDir, 'events.jsonl')
  if (!existsSync(file)) return []
  return readFileSync(file, 'utf8').trim().split(/\r?\n/).filter(Boolean)
    .map(line => (JSON.parse(line) as { type: string }).type)
}

function normalizedBacklog(fixture: Fixture): string {
  return readFileSync(fixture.deps.cfg.backlogFile, 'utf8')
    .replace(/<!-- adng:done [0-9a-f]+ -->/g, '<!-- adng:done HASH -->')
}

function heartbeat(fixture: Fixture): Record<string, unknown> | undefined {
  const file = join(fixture.deps.cfg.dataDir, 'heartbeat.json')
  if (!existsSync(file)) return undefined
  const value = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
  delete value.ts
  return value
}

async function expectSameRun(script: MockStep[], backlog = '- [ ] 任務一\n', prepare?: (fixture: Fixture) => void): Promise<void> {
  const parsedDefault = makeFixture(script, false, backlog)
  const explicitOne = makeFixture(script, true, backlog)
  prepare?.(parsedDefault)
  prepare?.(explicitOne)

  const defaultResult = await runOnce(parsedDefault.deps)
  const explicitResult = await runOnce(explicitOne.deps)

  expect(explicitResult).toEqual(defaultResult)
  expect(explicitOne.engine.calls).toHaveLength(parsedDefault.engine.calls.length)
  expect(normalizedBacklog(explicitOne)).toBe(normalizedBacklog(parsedDefault))
  expect(eventTypes(explicitOne)).toEqual(eventTypes(parsedDefault))
  expect(eventTypes(explicitOne)).not.toContain('concurrency-serial-fallback')
  expect(heartbeat(explicitOne)).toEqual(heartbeat(parsedDefault))
}

test('runOnce：concurrency 預設值與明確 1 在成功路徑完全相同', async () => {
  await expectSameRun([{ ok: true, costUsd: 0.3 }])
})

test('runOnce：concurrency 預設值與明確 1 在失敗路徑完全相同', async () => {
  await expectSameRun([{ ok: false, reason: 'compat failure' }])
})

test('runOnce：concurrency 預設值與明確 1 在 stop／idle 閘完全相同', async () => {
  await expectSameRun([], '- [ ] 任務一\n', fixture => writeFileSync(fixture.deps.cfg.stopFile, ''))
  await expectSameRun([], '# 空\n')
})

test('noteSerialConcurrency：concurrency=1 不產生降級事件，>1 每 lifecycle 僅一次', () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'adng-concurrency-notice-'))
  const events = new EventLog(dataDir)
  const lifecycle = { cfg: { concurrency: 1 }, events }
  noteSerialConcurrency(lifecycle)

  lifecycle.cfg.concurrency = 2
  noteSerialConcurrency(lifecycle)
  noteSerialConcurrency(lifecycle)

  const lines = readFileSync(join(dataDir, 'events.jsonl'), 'utf8')
  expect(lines.match(/"type":"concurrency-serial-fallback"/g)).toHaveLength(1)
})
