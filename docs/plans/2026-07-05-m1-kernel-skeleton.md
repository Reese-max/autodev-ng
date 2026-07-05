# M1 Kernel Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 autodev-ng kernel 骨架：task-store（backlog 唯一真相）＋ scheduler（single-flight、成本閘、敗 2 次即 blocked）＋ mock engine 跑通閉環，全程單元測試覆蓋。

**Architecture:** 純 TypeScript ESM 模組，五個焦點檔案（backlog/db/lock/events/scheduler），scheduler 以依賴注入組裝，engine 為介面（M1 只有 mock 實作）。無框架、無網路呼叫。

**Tech Stack:** Node ≥22 LTS、TypeScript 5.x、better-sqlite3、zod、vitest。

## Global Constraints

- kernel 全部 `src/` TS 碼總量 **< 3000 行**（spec 鐵律）
- 鐵律 #1：**系統永不新增任務條目**——`BacklogStore.report()` 遇未知 task id 必 throw，絕不 append
- 鐵律 #4：gate 故障 fail-open-with-alert；硬擋只有 stop 檔與成本硬停
- 依賴僅限：`better-sqlite3`、`zod`（runtime）；`typescript`、`vitest`、`@types/*`（dev）。不得新增其他依賴
- 換行 LF（.gitattributes 已設）；路徑一律 `node:path` 組裝，不硬編分隔符
- 每個 Task 完成即 commit（conventional commit，zh-TW 描述）

## File Structure

```
autodev-ng/
  package.json / tsconfig.json / vitest.config.ts
  src/
    types.ts       — Task/Outcome/Job/RunResult/Engine 介面 + zod Config schema（唯一型別來源）
    backlog.ts     — BACKLOG.md parser + BacklogStore（nextTask/report）
    db.ts          — RunDb：attempts 表（record/failCount/costSince）
    lock.ts        — mkdir atomic single-flight lock（Windows 無 flock）
    events.ts      — EventLog：events.jsonl append + heartbeat.json
    engines/mock.ts— MockEngine（可注入劇本：成功/失敗/丟例外）
    scheduler.ts   — runOnce()：stop→成本閘→取任務→preflight→run→記帳→回報
  tests/           — 每模組一測試檔（*.test.ts）
```

---

### Task 1: 專案骨架與測試框架

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `tests/smoke.test.ts`

**Interfaces:**
- Produces: `npm test`（= `vitest run`）、`npm run typecheck`（= `tsc --noEmit`）給所有後續 Task 使用

- [ ] **Step 1: 建 package.json**

```json
{
  "name": "autodev-ng",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 2: 安裝依賴**

Run: `npm i better-sqlite3 zod && npm i -D typescript vitest @types/node @types/better-sqlite3`
Expected: 安裝成功，`package-lock.json` 生成

- [ ] **Step 3: 建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 4: 建 vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { include: ['tests/**/*.test.ts'] } })
```

- [ ] **Step 5: 冒煙測試確認框架會動**

`tests/smoke.test.ts`:
```ts
import { expect, test } from 'vitest'
test('vitest runs', () => { expect(1 + 1).toBe(2) })
```

Run: `npm test`
Expected: `1 passed`

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore(m1): 專案骨架——TS+vitest+依賴鎖定"
```

---

### Task 2: types.ts——型別與設定 schema

**Files:**
- Create: `src/types.ts`, `tests/types.test.ts`

**Interfaces:**
- Produces（後續所有 Task 依賴，簽名以此為準）:
  - `interface Task { id: string; text: string; line: number; status: 'open'|'done'|'blocked' }`
  - `type Disposition = { kind: 'done'; commitHash: string } | { kind: 'blocked'; reason: string }`
  - `interface Job { task: Task; projectPath: string }`
  - `interface RunResult { ok: boolean; output: string; costUsd: number; commitHash?: string; failureReason?: string }`
  - `interface PreflightResult { ok: boolean; detail: string }`
  - `interface Engine { id: string; preflight(): Promise<PreflightResult>; run(job: Job): Promise<RunResult> }`
  - `const ConfigSchema` (zod) 與 `type Config`

- [ ] **Step 1: 寫失敗測試**

`tests/types.test.ts`:
```ts
import { expect, test } from 'vitest'
import { ConfigSchema } from '../src/types.js'

test('合法設定通過驗證且套用預設值', () => {
  const cfg = ConfigSchema.parse({
    projectPath: 'D:/x/proj',
    backlogFile: 'D:/x/proj/BACKLOG.md',
    dataDir: 'D:/x/data',
    engine: 'mock'
  })
  expect(cfg.maxAttempts).toBe(2)
  expect(cfg.dailySoftUsd).toBe(40)
  expect(cfg.dailyHardUsd).toBe(100)
  expect(cfg.stopFile).toBe('.adng.stop')
})

test('非法 engine 被拒', () => {
  expect(() => ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir: 'x', engine: 'gpt99'
  })).toThrow()
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run tests/types.test.ts`
Expected: FAIL（找不到 `../src/types.js`）

- [ ] **Step 3: 實作 src/types.ts**

```ts
import { z } from 'zod'

export interface Task {
  id: string
  text: string
  line: number
  status: 'open' | 'done' | 'blocked'
}

export type Disposition =
  | { kind: 'done'; commitHash: string }
  | { kind: 'blocked'; reason: string }

export interface Job { task: Task; projectPath: string }

export interface RunResult {
  ok: boolean
  output: string
  costUsd: number
  commitHash?: string
  failureReason?: string
}

export interface PreflightResult { ok: boolean; detail: string }

export interface Engine {
  id: string
  preflight(): Promise<PreflightResult>
  run(job: Job): Promise<RunResult>
}

export const ConfigSchema = z.object({
  projectPath: z.string().min(1),
  backlogFile: z.string().min(1),
  dataDir: z.string().min(1),
  engine: z.enum(['mock', 'claude-cli']),
  maxAttempts: z.number().int().positive().default(2),
  dailySoftUsd: z.number().positive().default(40),
  dailyHardUsd: z.number().positive().default(100),
  cooldownMs: z.number().int().nonnegative().default(60_000),
  stopFile: z.string().default('.adng.stop')
})
export type Config = z.infer<typeof ConfigSchema>
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run tests/types.test.ts`
Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add src/types.ts tests/types.test.ts && git commit -m "feat(m1): 核心型別與 Config schema（zod 預設值）"
```

---

### Task 3: backlog.ts——任務庫（鐵律 #1 的執法點）

**Files:**
- Create: `src/backlog.ts`, `tests/backlog.test.ts`

**Interfaces:**
- Consumes: `Task`, `Disposition`（Task 2）
- Produces:
  - `taskId(text: string): string`（sha1 前 8 碼）
  - `parseBacklog(md: string): Task[]`
  - `class BacklogStore { constructor(file: string); read(): Task[]; nextTask(): Task | null; report(id: string, d: Disposition): void }`

- [ ] **Step 1: 寫失敗測試**

`tests/backlog.test.ts`:
```ts
import { expect, test, beforeEach } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BacklogStore, parseBacklog, taskId } from '../src/backlog.js'

const MD = `# Backlog
- [ ] 修好登入頁 RWD
- [x] 舊的已完成項
- [ ] 加申論題匯出 PDF <!-- adng:blocked reason="tests fail" -->
一般文字行不受影響
- [ ] 第三個開放任務
`
let file: string
beforeEach(() => {
  file = join(mkdtempSync(join(tmpdir(), 'adng-')), 'BACKLOG.md')
  writeFileSync(file, MD)
})

test('parse：狀態判定正確', () => {
  const t = parseBacklog(MD)
  expect(t).toHaveLength(4)
  expect(t[0]!.status).toBe('open')
  expect(t[1]!.status).toBe('done')
  expect(t[2]!.status).toBe('blocked')
  expect(t[2]!.text).toBe('加申論題匯出 PDF') // 註解已剝除
})

test('nextTask 跳過 done/blocked，取第一個 open', () => {
  const s = new BacklogStore(file)
  expect(s.nextTask()!.text).toBe('修好登入頁 RWD')
})

test('report done：勾選並附 commit hash，總行數不變', () => {
  const s = new BacklogStore(file)
  const t = s.nextTask()!
  s.report(t.id, { kind: 'done', commitHash: 'abc1234' })
  const out = readFileSync(file, 'utf8')
  expect(out).toContain('- [x] 修好登入頁 RWD <!-- adng:done abc1234 -->')
  expect(out.split('\n').length).toBe(MD.split('\n').length)
})

test('report blocked：標註原因，不勾選', () => {
  const s = new BacklogStore(file)
  const t = s.nextTask()!
  s.report(t.id, { kind: 'blocked', reason: 'verify 連敗' })
  const again = new BacklogStore(file).read()
  expect(again.find(x => x.id === t.id)!.status).toBe('blocked')
})

test('鐵律#1：未知 id 必 throw，檔案不被改動', () => {
  const s = new BacklogStore(file)
  const before = readFileSync(file, 'utf8')
  expect(() => s.report(taskId('系統幻想出來的任務'), { kind: 'done', commitHash: 'x' })).toThrow(/禁止/)
  expect(readFileSync(file, 'utf8')).toBe(before)
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run tests/backlog.test.ts`
Expected: FAIL（模組不存在）

- [ ] **Step 3: 實作 src/backlog.ts**

```ts
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import type { Disposition, Task } from './types.js'

export function taskId(text: string): string {
  return createHash('sha1').update(text.trim()).digest('hex').slice(0, 8)
}

const TASK_RE = /^- \[( |x)\] (.*)$/
const ANNOT_RE = /\s*<!-- adng:[^>]*-->\s*$/

export function parseBacklog(md: string): Task[] {
  const tasks: Task[] = []
  md.split(/\r?\n/).forEach((line, i) => {
    const m = TASK_RE.exec(line)
    if (!m) return
    const raw = m[2]!
    const blocked = /<!-- adng:blocked\b/.test(raw)
    const text = raw.replace(ANNOT_RE, '')
    tasks.push({
      id: taskId(text),
      text,
      line: i,
      status: m[1] === 'x' ? 'done' : blocked ? 'blocked' : 'open'
    })
  })
  return tasks
}

export class BacklogStore {
  constructor(private readonly file: string) {}

  read(): Task[] {
    return parseBacklog(readFileSync(this.file, 'utf8'))
  }

  nextTask(): Task | null {
    return this.read().find(t => t.status === 'open') ?? null
  }

  /** 只允許改既有任務行的狀態；未知 id = 有人想創造任務 = 鐵律 #1 違規 */
  report(id: string, d: Disposition): void {
    const content = readFileSync(this.file, 'utf8')
    const lines = content.split(/\r?\n/)
    const t = this.read().find(t => t.id === id)
    if (!t) throw new Error(`unknown task id ${id}：系統禁止創造任務（鐵律 #1）`)
    lines[t.line] = d.kind === 'done'
      ? `- [x] ${t.text} <!-- adng:done ${d.commitHash} -->`
      : `- [ ] ${t.text} <!-- adng:blocked reason=${JSON.stringify(d.reason)} -->`
    writeFileSync(this.file, lines.join('\n'))
  }
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run tests/backlog.test.ts`
Expected: `5 passed`

- [ ] **Step 5: Commit**

```bash
git add src/backlog.ts tests/backlog.test.ts && git commit -m "feat(m1): BacklogStore——backlog 唯一真相，未知 id 必拒（鐵律#1）"
```

---

### Task 4: db.ts——執行紀錄（attempts / 成本）

**Files:**
- Create: `src/db.ts`, `tests/db.test.ts`

**Interfaces:**
- Produces:
  - `class RunDb { constructor(file: string); record(r: AttemptRecord): void; failCount(taskId: string): number; costSince(isoDayUtc: string): number; close(): void }`
  - `interface AttemptRecord { taskId: string; ok: boolean; costUsd: number; detail: string; ts?: string }`（ts 預設 now，可注入供測試）

- [ ] **Step 1: 寫失敗測試**

`tests/db.test.ts`:
```ts
import { expect, test } from 'vitest'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { RunDb } from '../src/db.js'

function freshDb(): RunDb {
  return new RunDb(join(mkdtempSync(join(tmpdir(), 'adng-db-')), 'run.db'))
}

test('record + failCount 只數失敗', () => {
  const db = freshDb()
  db.record({ taskId: 'aaaa', ok: false, costUsd: 0.1, detail: 'boom' })
  db.record({ taskId: 'aaaa', ok: true, costUsd: 0.2, detail: 'fixed' })
  db.record({ taskId: 'bbbb', ok: false, costUsd: 0.1, detail: 'x' })
  expect(db.failCount('aaaa')).toBe(1)
  expect(db.failCount('bbbb')).toBe(1)
  db.close()
})

test('costSince 以 UTC 日界線累計', () => {
  const db = freshDb()
  db.record({ taskId: 'a', ok: true, costUsd: 1.5, detail: '', ts: '2026-07-05T01:00:00Z' })
  db.record({ taskId: 'a', ok: true, costUsd: 2.0, detail: '', ts: '2026-07-05T23:00:00Z' })
  db.record({ taskId: 'a', ok: true, costUsd: 9.9, detail: '', ts: '2026-07-04T23:59:00Z' })
  expect(db.costSince('2026-07-05')).toBeCloseTo(3.5)
  db.close()
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run tests/db.test.ts`
Expected: FAIL（模組不存在）

- [ ] **Step 3: 實作 src/db.ts**

```ts
import Database from 'better-sqlite3'

export interface AttemptRecord {
  taskId: string
  ok: boolean
  costUsd: number
  detail: string
  ts?: string
}

export class RunDb {
  private readonly db: Database.Database

  constructor(file: string) {
    this.db = new Database(file)
    this.db.pragma('journal_mode = WAL')
    this.db.exec(`CREATE TABLE IF NOT EXISTS attempts(
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL,
      ts TEXT NOT NULL,
      ok INTEGER NOT NULL,
      cost_usd REAL NOT NULL,
      detail TEXT NOT NULL
    )`)
  }

  record(r: AttemptRecord): void {
    this.db.prepare(
      'INSERT INTO attempts(task_id, ts, ok, cost_usd, detail) VALUES (?,?,?,?,?)'
    ).run(r.taskId, r.ts ?? new Date().toISOString(), r.ok ? 1 : 0, r.costUsd, r.detail)
  }

  failCount(taskId: string): number {
    const row = this.db.prepare(
      'SELECT COUNT(*) AS n FROM attempts WHERE task_id=? AND ok=0'
    ).get(taskId) as { n: number }
    return row.n
  }

  costSince(isoDayUtc: string): number {
    const row = this.db.prepare(
      "SELECT COALESCE(SUM(cost_usd),0) AS c FROM attempts WHERE ts >= ? || 'T00:00:00Z'"
    ).get(isoDayUtc) as { c: number }
    return row.c
  }

  close(): void { this.db.close() }
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run tests/db.test.ts`
Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add src/db.ts tests/db.test.ts && git commit -m "feat(m1): RunDb——attempts 記帳與 UTC 日成本累計"
```

---

### Task 5: lock.ts——single-flight（mkdir atomic）

**Files:**
- Create: `src/lock.ts`, `tests/lock.test.ts`

**Interfaces:**
- Produces:
  - `acquireLock(dir: string, staleMs?: number): boolean`（預設 staleMs 30 分鐘；成功=true）
  - `releaseLock(dir: string): void`

- [ ] **Step 1: 寫失敗測試**

`tests/lock.test.ts`:
```ts
import { expect, test } from 'vitest'
import { mkdtempSync, utimesSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { acquireLock, releaseLock } from '../src/lock.js'

test('第二次 acquire 失敗；release 後可再取', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  expect(acquireLock(dir)).toBe(true)
  expect(acquireLock(dir)).toBe(false)
  releaseLock(dir)
  expect(acquireLock(dir)).toBe(true)
})

test('過期鎖可被接管', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'adng-lk-')), 'lock')
  expect(acquireLock(dir)).toBe(true)
  const old = new Date(Date.now() - 60 * 60 * 1000)
  utimesSync(dir, old, old) // 假裝鎖已一小時
  expect(acquireLock(dir, 30 * 60 * 1000)).toBe(true)
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run tests/lock.test.ts`
Expected: FAIL（模組不存在）

- [ ] **Step 3: 實作 src/lock.ts**

```ts
import { mkdirSync, rmSync, statSync } from 'node:fs'

/** Windows 無 flock：mkdir 是唯一可靠的原子互斥（舊系統實證）。 */
export function acquireLock(dir: string, staleMs = 30 * 60 * 1000): boolean {
  try {
    mkdirSync(dir, { recursive: false })
    return true
  } catch {
    try {
      const age = Date.now() - statSync(dir).mtimeMs
      if (age > staleMs) {
        rmSync(dir, { recursive: true, force: true })
        mkdirSync(dir, { recursive: false })
        return true
      }
    } catch { /* 競態下讓步 */ }
    return false
  }
}

export function releaseLock(dir: string): void {
  rmSync(dir, { recursive: true, force: true })
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run tests/lock.test.ts`
Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add src/lock.ts tests/lock.test.ts && git commit -m "feat(m1): single-flight mkdir lock（Windows 無 flock 對策）"
```

---

### Task 6: events.ts——事件流與心跳

**Files:**
- Create: `src/events.ts`, `tests/events.test.ts`

**Interfaces:**
- Produces:
  - `class EventLog { constructor(dataDir: string); append(type: string, data?: Record<string, unknown>): void; appendOnce(type: string, data?: Record<string, unknown>): boolean; heartbeat(state: HeartbeatState): void }`
  - `interface HeartbeatState { state: 'running'|'idle'|'stopped'|'cost-stopped'; currentTask?: string; todayCostUsd: number }`
  - 檔案：`<dataDir>/events.jsonl`、`<dataDir>/heartbeat.json`
  - `appendOnce`：同 type 距上次 < 24h 不重複寫（回傳 false），供 idle 告警去重

- [ ] **Step 1: 寫失敗測試**

`tests/events.test.ts`:
```ts
import { expect, test } from 'vitest'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { EventLog } from '../src/events.js'

test('append 寫 JSONL、每行可 parse、含 ts/type', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-ev-'))
  const ev = new EventLog(dir)
  ev.append('round-start', { n: 1 })
  ev.append('round-end')
  const lines = readFileSync(join(dir, 'events.jsonl'), 'utf8').trim().split('\n')
  expect(lines).toHaveLength(2)
  const first = JSON.parse(lines[0]!)
  expect(first.type).toBe('round-start')
  expect(first.ts).toMatch(/^\d{4}-/)
  expect(first.n).toBe(1)
})

test('appendOnce 24h 內同 type 去重', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-ev-'))
  const ev = new EventLog(dir)
  expect(ev.appendOnce('idle')).toBe(true)
  expect(ev.appendOnce('idle')).toBe(false)
})

test('heartbeat 覆寫 heartbeat.json', () => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-ev-'))
  const ev = new EventLog(dir)
  ev.heartbeat({ state: 'idle', todayCostUsd: 1.2 })
  const hb = JSON.parse(readFileSync(join(dir, 'heartbeat.json'), 'utf8'))
  expect(hb.state).toBe('idle')
  expect(hb.ts).toBeDefined()
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run tests/events.test.ts`
Expected: FAIL（模組不存在）

- [ ] **Step 3: 實作 src/events.ts**

```ts
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export interface HeartbeatState {
  state: 'running' | 'idle' | 'stopped' | 'cost-stopped'
  currentTask?: string
  todayCostUsd: number
}

export class EventLog {
  private readonly eventsFile: string
  private readonly heartbeatFile: string
  private readonly onceFile: string

  constructor(dataDir: string) {
    mkdirSync(dataDir, { recursive: true })
    this.eventsFile = join(dataDir, 'events.jsonl')
    this.heartbeatFile = join(dataDir, 'heartbeat.json')
    this.onceFile = join(dataDir, 'events-once.json')
  }

  append(type: string, data: Record<string, unknown> = {}): void {
    appendFileSync(this.eventsFile, JSON.stringify({ ts: new Date().toISOString(), type, ...data }) + '\n')
  }

  /** 同 type 24h 內只寫一次；回傳是否真的寫了。 */
  appendOnce(type: string, data: Record<string, unknown> = {}): boolean {
    const seen: Record<string, string> = existsSync(this.onceFile)
      ? JSON.parse(readFileSync(this.onceFile, 'utf8'))
      : {}
    const last = seen[type] ? Date.parse(seen[type]!) : 0
    if (Date.now() - last < 24 * 60 * 60 * 1000) return false
    seen[type] = new Date().toISOString()
    writeFileSync(this.onceFile, JSON.stringify(seen))
    this.append(type, data)
    return true
  }

  heartbeat(state: HeartbeatState): void {
    writeFileSync(this.heartbeatFile, JSON.stringify({ ts: new Date().toISOString(), ...state }, null, 2))
  }
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run tests/events.test.ts`
Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add src/events.ts tests/events.test.ts && git commit -m "feat(m1): EventLog——events.jsonl + heartbeat + 24h 去重告警"
```

---

### Task 7: engines/mock.ts——可注入劇本的假引擎

**Files:**
- Create: `src/engines/mock.ts`, `tests/mock-engine.test.ts`

**Interfaces:**
- Consumes: `Engine`, `Job`, `RunResult`, `PreflightResult`（Task 2）
- Produces:
  - `class MockEngine implements Engine { constructor(script?: MockStep[]); id: 'mock'; calls: Job[] }`
  - `type MockStep = { ok: true; costUsd?: number } | { ok: false; reason: string; costUsd?: number } | { throw: string }`
  - 劇本逐呼叫消耗；耗盡後預設回成功（costUsd 0.01）；`calls` 記錄收到的 Job 供斷言

- [ ] **Step 1: 寫失敗測試**

`tests/mock-engine.test.ts`:
```ts
import { expect, test } from 'vitest'
import { MockEngine } from '../src/engines/mock.js'
import type { Task } from '../src/types.js'

const T: Task = { id: 'ab12cd34', text: 'x', line: 0, status: 'open' }

test('依劇本輪流回應，耗盡後預設成功', async () => {
  const e = new MockEngine([
    { ok: false, reason: 'tests fail', costUsd: 0.5 },
    { throw: 'ECONNRESET' }
  ])
  const r1 = await e.run({ task: T, projectPath: 'p' })
  expect(r1.ok).toBe(false)
  expect(r1.failureReason).toBe('tests fail')
  await expect(e.run({ task: T, projectPath: 'p' })).rejects.toThrow('ECONNRESET')
  const r3 = await e.run({ task: T, projectPath: 'p' })
  expect(r3.ok).toBe(true)
  expect(e.calls).toHaveLength(3)
})

test('preflight 恆 ok', async () => {
  expect((await new MockEngine().preflight()).ok).toBe(true)
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run tests/mock-engine.test.ts`
Expected: FAIL（模組不存在）

- [ ] **Step 3: 實作 src/engines/mock.ts**

```ts
import type { Engine, Job, PreflightResult, RunResult } from '../types.js'

export type MockStep =
  | { ok: true; costUsd?: number }
  | { ok: false; reason: string; costUsd?: number }
  | { throw: string }

export class MockEngine implements Engine {
  readonly id = 'mock'
  readonly calls: Job[] = []
  private readonly script: MockStep[]

  constructor(script: MockStep[] = []) {
    this.script = [...script]
  }

  async preflight(): Promise<PreflightResult> {
    return { ok: true, detail: 'mock always ready' }
  }

  async run(job: Job): Promise<RunResult> {
    this.calls.push(job)
    const step = this.script.shift() ?? { ok: true as const }
    if ('throw' in step) throw new Error(step.throw)
    if (step.ok) {
      return { ok: true, output: 'mock done', costUsd: step.costUsd ?? 0.01, commitHash: 'mock0000' }
    }
    return { ok: false, output: 'mock fail', costUsd: step.costUsd ?? 0.01, failureReason: step.reason }
  }
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run tests/mock-engine.test.ts`
Expected: `2 passed`

- [ ] **Step 5: Commit**

```bash
git add src/engines/mock.ts tests/mock-engine.test.ts && git commit -m "feat(m1): MockEngine——劇本注入（成功/失敗/例外）供 scheduler 測試"
```

---

### Task 8: scheduler.ts——runOnce 閉環核心

**Files:**
- Create: `src/scheduler.ts`, `tests/scheduler.test.ts`

**Interfaces:**
- Consumes: 全部前置模組（簽名見各 Task Produces）
- Produces:
  - `interface Deps { cfg: Config; store: BacklogStore; db: RunDb; engine: Engine; events: EventLog }`
  - `runOnce(deps: Deps): Promise<CycleResult>`
  - `type CycleResult = 'stopped'|'cost-hard-stop'|'idle'|'done'|'failed'|'blocked'|'preflight-failed'|'engine-error'`

判斷順序（spec §scheduler，寫死不許重排）：stop 檔 → 成本硬停 → 成本軟警（appendOnce）→ 取任務（無→idle appendOnce）→ preflight → run → 記帳 → done：report done／fail：failCount ≥ maxAttempts 才 report blocked，否則留 open 等下輪 → engine throw：記帳 cost 0、視同 fail 計數。

- [ ] **Step 1: 寫失敗測試**

`tests/scheduler.test.ts`:
```ts
import { expect, test, beforeEach } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runOnce, type Deps } from '../src/scheduler.js'
import { BacklogStore } from '../src/backlog.js'
import { RunDb } from '../src/db.js'
import { EventLog } from '../src/events.js'
import { MockEngine } from '../src/engines/mock.js'
import { ConfigSchema } from '../src/types.js'

let dir: string
function deps(engine: MockEngine, backlogMd = '- [ ] 任務一\n'): Deps {
  dir = mkdtempSync(join(tmpdir(), 'adng-sch-'))
  const backlogFile = join(dir, 'BACKLOG.md')
  writeFileSync(backlogFile, backlogMd)
  const cfg = ConfigSchema.parse({
    projectPath: dir, backlogFile, dataDir: join(dir, 'data'),
    engine: 'mock', stopFile: join(dir, '.adng.stop')
  })
  return { cfg, store: new BacklogStore(backlogFile), db: new RunDb(join(dir, 'run.db')), engine, events: new EventLog(cfg.dataDir) }
}

test('happy path：done + backlog 打勾 + 記帳', async () => {
  const d = deps(new MockEngine([{ ok: true, costUsd: 0.3 }]))
  expect(await runOnce(d)).toBe('done')
  expect(readFileSync(d.cfg.backlogFile, 'utf8')).toContain('- [x] 任務一')
  expect(d.db.costSince('2000-01-01')).toBeCloseTo(0.3)
})

test('敗第 1 次留 open；敗第 2 次 blocked（鐵律：不無限重試）', async () => {
  const e = new MockEngine([{ ok: false, reason: 'x' }, { ok: false, reason: 'x' }])
  const d = deps(e)
  expect(await runOnce(d)).toBe('failed')
  expect(d.store.nextTask()).not.toBeNull() // 還是 open
  expect(await runOnce(d)).toBe('blocked')
  expect(d.store.nextTask()).toBeNull() // blocked 不再撿
})

test('backlog 空 → idle，且 idle 事件 24h 去重', async () => {
  const d = deps(new MockEngine(), '# 空\n')
  expect(await runOnce(d)).toBe('idle')
  expect(await runOnce(d)).toBe('idle')
  const events = readFileSync(join(d.cfg.dataDir, 'events.jsonl'), 'utf8')
  expect(events.match(/"type":"idle"/g)).toHaveLength(1)
})

test('stop 檔優先於一切', async () => {
  const e = new MockEngine()
  const d = deps(e)
  writeFileSync(d.cfg.stopFile, '')
  expect(await runOnce(d)).toBe('stopped')
  expect(e.calls).toHaveLength(0)
})

test('成本硬停：超過 dailyHardUsd 不再派工', async () => {
  const e = new MockEngine()
  const d = deps(e)
  d.db.record({ taskId: 'z', ok: true, costUsd: 999, detail: 'burn' })
  expect(await runOnce(d)).toBe('cost-hard-stop')
  expect(e.calls).toHaveLength(0)
})

test('engine 丟例外：計一次失敗、不打勾、回 engine-error', async () => {
  const d = deps(new MockEngine([{ throw: 'ECONNRESET' }]))
  expect(await runOnce(d)).toBe('engine-error')
  expect(d.db.failCount(d.store.nextTask()!.id)).toBe(1)
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run tests/scheduler.test.ts`
Expected: FAIL（模組不存在）

- [ ] **Step 3: 實作 src/scheduler.ts**

```ts
import { existsSync } from 'node:fs'
import type { BacklogStore } from './backlog.js'
import type { RunDb } from './db.js'
import type { EventLog } from './events.js'
import type { Config, Engine } from './types.js'

export interface Deps {
  cfg: Config
  store: BacklogStore
  db: RunDb
  engine: Engine
  events: EventLog
}

export type CycleResult =
  | 'stopped' | 'cost-hard-stop' | 'idle' | 'done'
  | 'failed' | 'blocked' | 'preflight-failed' | 'engine-error'

export async function runOnce({ cfg, store, db, engine, events }: Deps): Promise<CycleResult> {
  if (existsSync(cfg.stopFile)) {
    events.heartbeat({ state: 'stopped', todayCostUsd: todayCost(db) })
    return 'stopped'
  }

  const spent = todayCost(db)
  if (spent >= cfg.dailyHardUsd) {
    events.appendOnce('cost-hard-stop', { spent })
    events.heartbeat({ state: 'cost-stopped', todayCostUsd: spent })
    return 'cost-hard-stop'
  }
  if (spent >= cfg.dailySoftUsd) events.appendOnce('cost-soft-warn', { spent })

  const task = store.nextTask()
  if (!task) {
    events.appendOnce('idle', { note: 'backlog 空，等使用者補任務' })
    events.heartbeat({ state: 'idle', todayCostUsd: spent })
    return 'idle'
  }

  events.heartbeat({ state: 'running', currentTask: task.text, todayCostUsd: spent })

  const pf = await engine.preflight()
  if (!pf.ok) {
    events.append('preflight-failed', { engine: engine.id, detail: pf.detail })
    return 'preflight-failed'
  }

  let result: CycleResult
  try {
    const res = await engine.run({ task, projectPath: cfg.projectPath })
    db.record({ taskId: task.id, ok: res.ok, costUsd: res.costUsd, detail: res.failureReason ?? res.commitHash ?? '' })
    if (res.ok) {
      store.report(task.id, { kind: 'done', commitHash: res.commitHash ?? 'unknown' })
      events.append('task-done', { task: task.text, cost: res.costUsd, commit: res.commitHash })
      return 'done'
    }
    events.append('task-failed', { task: task.text, reason: res.failureReason })
    result = 'failed'
  } catch (err) {
    db.record({ taskId: task.id, ok: false, costUsd: 0, detail: String(err) })
    events.append('engine-error', { task: task.text, error: String(err) })
    result = 'engine-error'
  }

  if (db.failCount(task.id) >= cfg.maxAttempts) {
    store.report(task.id, { kind: 'blocked', reason: `連敗 ${cfg.maxAttempts} 次，人工介入` })
    events.append('task-blocked', { task: task.text })
    return 'blocked'
  }
  return result
}

function todayCost(db: RunDb): number {
  return db.costSince(new Date().toISOString().slice(0, 10))
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run tests/scheduler.test.ts`
Expected: `6 passed`

- [ ] **Step 5: 全套測試 + 型別檢查**

Run: `npm test && npm run typecheck`
Expected: 全綠、tsc 無錯

- [ ] **Step 6: Commit**

```bash
git add src/scheduler.ts tests/scheduler.test.ts && git commit -m "feat(m1): scheduler runOnce——stop/成本閘/敗2即block 閉環核心"
```

---

### Task 9: M1 驗收——mock 閉環端到端

**Files:**
- Create: `tests/e2e-mock.test.ts`

**Interfaces:**
- Consumes: 全部模組

- [ ] **Step 1: 寫端到端測試（三任務 backlog 跑到全消化）**

`tests/e2e-mock.test.ts`:
```ts
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
```

- [ ] **Step 2: 跑測試確認通過**

Run: `npx vitest run tests/e2e-mock.test.ts`
Expected: `1 passed`

- [ ] **Step 3: 行數守門（Global Constraint <3000 行）**

Run（Git Bash）: `wc -l src/*.ts src/engines/*.ts | tail -1`
Expected: total 遠低於 3000（M1 預估 <600）

- [ ] **Step 4: 全套綠 + Commit**

```bash
npm test && npm run typecheck
git add tests/e2e-mock.test.ts && git commit -m "test(m1): mock 閉環 e2e——M1 驗收（3任務→2done 1blocked→idle）"
```

---

## Self-Review 紀錄

- Spec 覆蓋：M1 範圍（task-store、scheduler、mock engine、事件/心跳、成本閘、single-flight、敗2即block）各有對應 Task ✅；CLI 與 daemon 常駐迴圈、Telegram、claude-cli 引擎、semantic-verify 屬 M2/M3，不在本計畫 ✅
- Placeholder 掃描：無 TBD/TODO，所有步驟含完整程式碼 ✅
- 型別一致性：`Disposition`/`Deps`/`CycleResult`/`AttemptRecord` 各 Task 引用簽名一致 ✅
