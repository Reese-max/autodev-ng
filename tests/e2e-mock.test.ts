import { expect, test } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runOnce, type Deps } from '../src/scheduler.js'
import { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { MockEngine } from '../src/engines/mock.js'
import { ConfigSchema } from '../src/types.js'

test('M1 閉環：3 任務→2 完成 1 blocked→idle', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-e2e-'))
  const backlogFile = join(dir, 'BACKLOG.md')
  writeFileSync(backlogFile, '- [ ] 任務A\n- [ ] 任務B\n- [ ] 任務C\n')
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile, dataDir: join(dir, 'data'),
    engine: 'mock', stopFile: join(dir, '.adng.stop')
  })
  // 劇本：A 成功；B 連敗兩次；C 成功
  const engine = new MockEngine([
    { ok: true }, { ok: false, reason: 'b1' }, { ok: false, reason: 'b2' }, { ok: true }
  ])
  const d: Deps = { cfg, store: new BacklogStore(backlogFile), db: new RunDb(join(dir, 'run.db')), engine, events: new EventLog(cfg.dataDir) }

  const seq: string[] = []
  for (let i = 0; i < 6; i++) seq.push(await runOnce(d))
  expect(seq).toEqual(['done', 'failed', 'blocked', 'done', 'idle', 'idle'])

  const md = readFileSync(backlogFile, 'utf8')
  expect(md).toContain('- [x] 任務A')
  expect(md).toContain('adng:blocked')
  expect(md).toContain('- [x] 任務C')
  const hb = JSON.parse(readFileSync(join(cfg.dataDir, 'heartbeat.json'), 'utf8'))
  expect(hb.state).toBe('idle')
})
