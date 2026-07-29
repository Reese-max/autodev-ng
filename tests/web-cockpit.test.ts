import { expect, test } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { RunDb, localDay } from '../src/db.js'
import { BacklogStore } from '../src/backlog.js'

// 鏡像 tests/web-server.test.ts：非字面量路徑動態 import，tsc 不解析 .mjs
const webServerPath = '../web/server.mjs'
const mod: any = await import(webServerPath)
const { createServer, createChildState, buildProjectSummary } = mod

const TOKEN = 'c'.repeat(48)
const FAST: any = { waitMs: 0, sleep: async () => {} }

function tmp(): string {
  return mkdtempSync(join(tmpdir(), 'adng-cockpit-'))
}

interface Ctx { dir: string; store: BacklogStore; db: RunDb; cfg: any }

function makeCtx(backlogMd = '- [ ] 任務一\n'): Ctx {
  const dir = tmp()
  writeFileSync(join(dir, 'backlog.md'), backlogMd)
  const store = new BacklogStore(join(dir, 'backlog.md'))
  const db = new RunDb(join(dir, 'run.db'))
  const cfg: any = {
    dataDir: dir, timezoneOffsetHours: 0, dailySoftUsd: 40, dailyHardUsd: 100,
    stopFile: join(dir, '.adng.stop'), backlogFile: join(dir, 'backlog.md'),
    engines: {
      devin: { adapter: 'devin', dailyAttemptCap: 20, subscription: true },
      idle: { adapter: 'mock', dailyAttemptCap: 5, subscription: true },
      codex: { adapter: 'codex' },
    },
  }
  return { dir, store, db, cfg }
}

async function startServer(c: Ctx): Promise<{ port: number; close: () => void }> {
  const server = createServer({
    cfg: c.cfg, cfgPath: 'cfg.json', store: c.store, db: c.db, dbPath: join(c.dir, 'run.db'),
    token: TOKEN, spawnFn: () => ({ pid: 1, exitCode: null, killed: false, unref() {} }),
    childState: createChildState(), indexHtml: '<html>ok</html>', localDayFn: localDay,
    spawnOpts: { ...FAST, lockOwnerFn: () => 'unknown' },
  })
  await new Promise<void>(r => server.listen(0, '127.0.0.1', () => r()))
  const port = (server.address() as any).port
  return { port, close: () => server.close() }
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

// ---------- (1) 艦隊卡片欄位 ----------
test('buildProjectSummary：含 currentTask、今日成敗、blocked 數（駕駛艙卡片欄位）', () => {
  const c = makeCtx('- [ ] 任務一\n- [ ] 卡住 <!-- adng:blocked reason="merge-conflict" -->\n')
  writeFileSync(join(c.dir, 'heartbeat.json'), JSON.stringify({ ts: new Date().toISOString(), state: 'running', currentTask: '正在補延伸閱讀', todayCostUsd: 0 }))
  c.db.record({ taskId: 'a', ok: true, costUsd: 0, detail: '' })
  c.db.record({ taskId: 'b', ok: false, costUsd: 0, detail: 'x' })
  const s = buildProjectSummary('p1', {
    cfg: c.cfg, store: c.store, db: c.db, dbPath: join(c.dir, 'run.db'), localDayFn: localDay,
  })
  expect(s.currentTask).toBe('正在補延伸閱讀')
  expect(s.todayOk).toBe(1)
  expect(s.todayFail).toBe(1)
  expect(s.backlogBlocked).toBe(1)
})

test('buildProjectSummary：heartbeat、成本、戰績與 backlog 各自 fail-open', () => {
  const c = makeCtx('- [ ] 任務一\n- [ ] 卡住 <!-- adng:blocked reason="merge-conflict" -->\n')
  writeFileSync(join(c.dir, 'heartbeat.json'), JSON.stringify({ state: 'running', currentTask: '任務一' }))
  const base: any = { cfg: c.cfg, store: c.store, db: c.db, dbPath: join(c.dir, 'run.db'), localDayFn: localDay }

  const noCost = buildProjectSummary('p1', {
    ...base, db: { costForLocalDay: () => { throw new Error('cost') }, dayStats: () => ({ ok: 2, fail: 1 }) },
  })
  expect(noCost).toMatchObject({ state: 'running', currentTask: '任務一', todayCostUsd: 0, todayOk: 2, todayFail: 1, backlogBlocked: 1 })

  const noStats = buildProjectSummary('p1', {
    ...base, db: { costForLocalDay: () => 1.25, dayStats: () => { throw new Error('stats') } },
  })
  expect(noStats).toMatchObject({ todayCostUsd: 1.25, todayOk: 0, todayFail: 0, backlogBlocked: 1 })

  writeFileSync(join(c.dir, 'heartbeat.json'), '{broken json')
  expect(buildProjectSummary('p1', base)).toMatchObject({ state: 'unknown', currentTask: null, backlogBlocked: 1 })

  writeFileSync(join(c.dir, 'heartbeat.json'), JSON.stringify({ state: 'idle' }))
  const noBacklog = buildProjectSummary('p1', { ...base, store: { read: () => { throw new Error('missing') } } })
  expect(noBacklog).toMatchObject({ state: 'idle', backlogOpen: 0, backlogBlocked: 0, todayCostUsd: 0 })
})

test('六面板回歸：來源全缺時艦隊摘要與四個駕駛艙端點均 fail-open', async () => {
  const c = makeCtx('')
  c.cfg.engines = {}
  c.db.close()
  rmSync(join(c.dir, 'run.db'))
  rmSync(join(c.dir, 'backlog.md'))

  expect(buildProjectSummary('p1', {
    cfg: c.cfg, store: c.store, db: c.db, dbPath: join(c.dir, 'run.db'), localDayFn: localDay,
  })).toMatchObject({
    state: 'unknown', currentTask: null, todayCostUsd: 0, todayOk: 0, todayFail: 0,
    backlogOpen: 0, backlogBlocked: 0,
  })

  const s = await startServer(c)
  try {
    const [engines, blocked, guardian, mechanisms] = await Promise.all([
      fetch(`http://127.0.0.1:${s.port}/api/cockpit/engines`).then(r => r.json()),
      fetch(`http://127.0.0.1:${s.port}/api/cockpit/blocked`).then(r => r.json()),
      fetch(`http://127.0.0.1:${s.port}/api/cockpit/guardian`).then(r => r.json()),
      fetch(`http://127.0.0.1:${s.port}/api/cockpit/mechanisms`).then(r => r.json()),
    ])
    expect(engines).toEqual({ engines: [], isolated: [] })
    expect(blocked).toEqual({ blocked: [] })
    expect(guardian).toEqual({ runs: [] })
    expect(mechanisms).toEqual({ mergeRebased: 0, northstarReject: 0, engineIsolated: 0 })
  } finally { s.close() }
})

test('六面板回歸：來源存在但零資料時回明確空狀態', async () => {
  const c = makeCtx('')
  c.cfg.engines = {}
  writeFileSync(join(c.dir, 'engine-routing-state.json'), JSON.stringify({ isolated: {} }))
  writeFileSync(join(c.dir, 'guardian-runs.jsonl'), '')
  writeFileSync(join(c.dir, 'events.jsonl'), '')

  expect(buildProjectSummary('p1', {
    cfg: c.cfg, store: c.store, db: c.db, dbPath: join(c.dir, 'run.db'), localDayFn: localDay,
  })).toMatchObject({
    state: 'unknown', currentTask: null, todayCostUsd: 0, todayOk: 0, todayFail: 0,
    backlogOpen: 0, backlogBlocked: 0,
  })

  const s = await startServer(c)
  try {
    const [engines, blocked, guardian, mechanisms] = await Promise.all([
      fetch(`http://127.0.0.1:${s.port}/api/cockpit/engines`).then(r => r.json()),
      fetch(`http://127.0.0.1:${s.port}/api/cockpit/blocked`).then(r => r.json()),
      fetch(`http://127.0.0.1:${s.port}/api/cockpit/guardian`).then(r => r.json()),
      fetch(`http://127.0.0.1:${s.port}/api/cockpit/mechanisms`).then(r => r.json()),
    ])
    expect(engines).toEqual({ engines: [], isolated: [] })
    expect(blocked).toEqual({ blocked: [] })
    expect(guardian).toEqual({ runs: [] })
    expect(mechanisms).toEqual({ mergeRebased: 0, northstarReject: 0, engineIsolated: 0 })
  } finally {
    s.close()
    c.db.close()
  }
})

// ---------- (2) 引擎戰績 ----------
test('GET /api/cockpit/engines：近 7 日統計＋隔離狀態＋cap；只出 allowlist 欄位', async () => {
  const c = makeCtx()
  for (let i = 0; i < 3; i++) c.db.record({
    taskId: `t${i}`, ok: i < 2, costUsd: 0, detail: '', engine: 'devin',
    ts: i < 2 ? new Date().toISOString() : daysAgo(1),
  })
  c.db.record({ taskId: 'old', ok: false, costUsd: 0, detail: '', engine: 'devin', ts: daysAgo(10) }) // 窗外不計
  writeFileSync(join(c.dir, 'engine-routing-state.json'), JSON.stringify({
    version: 1, isolated: {
      devin: { untilTs: new Date(Date.now() + 3600_000).toISOString(), reason: '簽名熔斷：連續5次相同失敗' },
      standby: { untilTs: new Date(Date.now() + 3600_000).toISOString(), reason: '人工隔離' },
    }, probes: {},
  }))
  const s = await startServer(c)
  try {
    const r = await (await fetch(`http://127.0.0.1:${s.port}/api/cockpit/engines`)).json()
    const devin = r.engines.find((e: any) => e.engine === 'devin')
    expect(devin.n).toBe(3)
    expect(devin.attempts).toBe(3)
    expect(devin.ok).toBe(2)
    expect(devin.successRate).toBeCloseTo(2 / 3)
    expect(devin.todayAttempts).toBe(2)
    expect(devin.dailyAttemptCap).toBe(20)
    expect(devin.quotaRemaining).toBe(18)
    expect(r.engines.find((e: any) => e.engine === 'idle')).toMatchObject({ attempts: 0, todayAttempts: 0, dailyAttemptCap: 5, quotaRemaining: 5 })
    expect(r.engines.some((e: any) => e.engine === 'standby')).toBe(true)
    const iso = r.isolated.find((e: any) => e.engine === 'devin')
    expect(iso.reason).toContain('簽名熔斷')
    expect(JSON.stringify(r)).not.toContain('apiKey')
  } finally { s.close() }
})

test('GET /api/cockpit/engines：缺 run.db 與 routing-state → 保留 cap 零消耗列', async () => {
  const c = makeCtx()
  c.db.close()
  rmSync(join(c.dir, 'run.db'))
  const s = await startServer(c)
  try {
    const r = await (await fetch(`http://127.0.0.1:${s.port}/api/cockpit/engines`)).json()
    expect(r.engines).toEqual([
      expect.objectContaining({ engine: 'devin', attempts: 0, dailyAttemptCap: 20, quotaRemaining: 20 }),
      expect.objectContaining({ engine: 'idle', attempts: 0, dailyAttemptCap: 5, quotaRemaining: 5 }),
    ])
    expect(r.isolated).toEqual([])
  } finally { s.close() }
})

test('GET /api/cockpit/engines：routing-state 壞檔不拖垮 DB 戰績與 cap', async () => {
  const c = makeCtx()
  c.db.record({ taskId: 'ok', ok: true, costUsd: 0, detail: '', engine: 'codex', ts: new Date().toISOString() })
  writeFileSync(join(c.dir, 'engine-routing-state.json'), '{broken')
  const s = await startServer(c)
  try {
    const r = await (await fetch(`http://127.0.0.1:${s.port}/api/cockpit/engines`)).json()
    expect(r.engines.find((e: any) => e.engine === 'codex')).toMatchObject({ attempts: 1, successRate: 1 })
    expect(r.engines.find((e: any) => e.engine === 'devin').dailyAttemptCap).toBe(20)
    expect(r.isolated).toEqual([])
  } finally { s.close() }
})

test('GET /api/cockpit/engines：run.db 壞檔不拖垮隔離事由與 cap', async () => {
  const c = makeCtx()
  c.db.close()
  writeFileSync(join(c.dir, 'run.db'), 'not sqlite')
  writeFileSync(join(c.dir, 'engine-routing-state.json'), JSON.stringify({
    isolated: { devin: { untilTs: new Date(Date.now() + 3600_000).toISOString(), reason: '簽名熔斷：quota' } },
  }))
  const s = await startServer(c)
  try {
    const r = await (await fetch(`http://127.0.0.1:${s.port}/api/cockpit/engines`)).json()
    expect(r.engines.find((e: any) => e.engine === 'devin')).toMatchObject({ attempts: 0, dailyAttemptCap: 20 })
    expect(r.isolated).toEqual([expect.objectContaining({ engine: 'devin', reason: '簽名熔斷：quota' })])
  } finally { s.close() }
})

// ---------- (3) blocked 治理 ----------
const BLOCKED_MD = '- [ ] 好任務\r\n\r\n- [ ] 卡住的任務 <!-- adng:autopilot goal:x round:1 --> <!-- adng:blocked reason="merge-conflict：主分支已前進" -->\r\n'

test('GET /api/cockpit/blocked：只回 blocked 行，含任務文字與 reason', async () => {
  const c = makeCtx(BLOCKED_MD)
  const s = await startServer(c)
  try {
    const r = await (await fetch(`http://127.0.0.1:${s.port}/api/cockpit/blocked`)).json()
    expect(r.blocked).toHaveLength(1)
    expect(r.blocked[0].text).toContain('卡住的任務')
    expect(r.blocked[0].reason).toContain('merge-conflict')
    expect(r.blocked[0].line).toBe(3)
  } finally { s.close() }
})

test('POST /api/backlog/reopen：無 token 403；有 token 移除 blocked 註記；重打同參數冪等 changed:false', async () => {
  const c = makeCtx(BLOCKED_MD)
  const s = await startServer(c)
  try {
    const list = await (await fetch(`http://127.0.0.1:${s.port}/api/cockpit/blocked`)).json()
    const target = list.blocked[0]
    const noTok = await fetch(`http://127.0.0.1:${s.port}/api/backlog/reopen`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ line: target.line, match: '卡住的任務' }),
    })
    expect(noTok.status).toBe(403)

    const ok = await fetch(`http://127.0.0.1:${s.port}/api/backlog/reopen`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': TOKEN },
      body: JSON.stringify({ line: target.line, match: '卡住的任務' }),
    })
    const body = await ok.json()
    expect(body.ok).toBe(true)
    expect(body.changed).toBe(true)
    const reopenedMd = readFileSync(join(c.dir, 'backlog.md'), 'utf8')
    expect(reopenedMd).not.toContain('adng:blocked')
    expect(reopenedMd).toContain('adng:autopilot') // 其他註記原樣保留
    expect(reopenedMd).toContain('卡住的任務')
    expect(reopenedMd).toContain('\r\n\r\n') // 重開不改寫原本換行格式

    const again = await fetch(`http://127.0.0.1:${s.port}/api/backlog/reopen`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': TOKEN },
      body: JSON.stringify({ line: target.line, match: '卡住的任務' }),
    })
    expect(again.status).toBe(200)
    expect(await again.json()).toEqual({ ok: true, changed: false })
    expect(readFileSync(join(c.dir, 'backlog.md'), 'utf8')).toBe(reopenedMd)

    const after = await (await fetch(`http://127.0.0.1:${s.port}/api/cockpit/blocked`)).json()
    expect(after.blocked).toEqual([])
  } finally { s.close() }
})

test('POST /api/backlog/reopen：match 對不上該行（檔案已漂移）→ changed:false 不誤改', async () => {
  const c = makeCtx(BLOCKED_MD)
  const s = await startServer(c)
  try {
    const r = await fetch(`http://127.0.0.1:${s.port}/api/backlog/reopen`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': TOKEN },
      body: JSON.stringify({ line: 3, match: '完全不相干的文字' }),
    })
    expect((await r.json()).changed).toBe(false)
    expect(readFileSync(join(c.dir, 'backlog.md'), 'utf8')).toContain('adng:blocked')
  } finally { s.close() }
})

// ---------- (4) Guardian ----------
test('GET /api/cockpit/guardian：尾 10 筆 allowlist 欄位；缺檔回空', async () => {
  const c = makeCtx()
  const runs = Array.from({ length: 12 }, (_v, i) => JSON.stringify({
    ts: daysAgo(0), status: i % 2 ? 'stable' : 'needs_attention', summary: `第${i}筆`,
    durationMs: 1000 + i, inputTokens: 10, outputTokens: 5, model: 'gpt-5.6-luna',
    fingerprint: 'secret-like-field',
  })).join('\n') + '\n'
  writeFileSync(join(c.dir, 'guardian-runs.jsonl'), runs)
  const s = await startServer(c)
  try {
    const r = await (await fetch(`http://127.0.0.1:${s.port}/api/cockpit/guardian`)).json()
    expect(r.runs).toHaveLength(10)
    expect(r.runs.map((run: any) => run.summary)).toEqual(
      Array.from({ length: 10 }, (_v, i) => `第${11 - i}筆`),
    ) // 最近 10 筆，最新在前
    expect(r.runs[0].model).toBe('gpt-5.6-luna')
    expect(JSON.stringify(r)).not.toContain('fingerprint')

    const c2 = makeCtx()
    const s2 = await startServer(c2)
    try {
      const empty = await (await fetch(`http://127.0.0.1:${s2.port}/api/cockpit/guardian`)).json()
      expect(empty.runs).toEqual([])
    } finally { s2.close() }
  } finally { s.close() }
})

// ---------- (5) 機制成效 ----------
test('GET /api/cockpit/mechanisms：近 7 日三型計數；窗外不計；缺檔零值', async () => {
  const c = makeCtx()
  const ev = [
    { ts: daysAgo(1), type: 'merge-rebased' },
    { ts: daysAgo(2), type: 'merge-rebased' },
    { ts: daysAgo(3), type: 'author-northstar-reject' },
    { ts: daysAgo(1), type: 'engine-route-isolated' },
    { ts: daysAgo(30), type: 'merge-rebased' }, // 窗外
    { ts: daysAgo(1), type: 'task-done' }, // 非目標型別
  ].map(e => JSON.stringify(e)).join('\n') + '\n'
  writeFileSync(join(c.dir, 'events.jsonl'), ev)
  const s = await startServer(c)
  try {
    const r = await (await fetch(`http://127.0.0.1:${s.port}/api/cockpit/mechanisms`)).json()
    expect(r.mergeRebased).toBe(2)
    expect(r.northstarReject).toBe(1)
    expect(r.engineIsolated).toBe(1)

    const c2 = makeCtx()
    const s2 = await startServer(c2)
    try {
      const zero = await (await fetch(`http://127.0.0.1:${s2.port}/api/cockpit/mechanisms`)).json()
      expect(zero).toEqual({ mergeRebased: 0, northstarReject: 0, engineIsolated: 0 })
    } finally { s2.close() }
  } finally { s.close() }
})

// ---------- (6) 前端整合斷言（面板存在＋自動輪詢） ----------
test('index.html 保留六個既有控制面板，並含四個駕駛艙面板與艦隊卡片欄位', () => {
  const html = readFileSync(join(__dirname, '..', 'web', 'index.html'), 'utf8')
  for (const name of ['status', 'cost', 'backlog', 'log', 'lessons', 'goal']) {
    expect(html).toContain(`data-panel="${name}"`)
  }
  for (const marker of ['cockpit/engines', 'cockpit/blocked', 'cockpit/guardian', 'cockpit/mechanisms', 'backlog/reopen']) {
    expect(html).toContain(marker)
  }
  expect(html).toContain('todayOk') // 艦隊卡片今日成敗
  expect(html).toContain('今日額度')
  expect(html).toContain('quotaRemaining')
})
