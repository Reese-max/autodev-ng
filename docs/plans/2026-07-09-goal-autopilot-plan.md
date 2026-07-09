# GOAL 有界自主迴圈（autopilot）實作 Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 給系統一份 `GOAL.md`，它自主「規劃 → 執行 → 評估進展 → 重規劃」直到達成或撞「連續無進展」煞車，執行完全複用現有 `runOnce`。

**Architecture:** 外掛式 orchestrator（`src/autopilot/`，子目錄不入 kernel 帳）。kernel 僅三處小改：`types.ts` 加 `goalFile?`、`cli.ts` 展開該路徑、`backlog.ts` 加 `append()`（鐵律 #1 受控例外的唯一接觸點）。orchestrator 讀 GOAL.md → planner agent 產子任務 → 寫進 backlog（autopilot 標記）→ 反覆呼叫 `runOnce` 跑完該批 → progress evaluator 算進展 → 續跑或停。

**Tech Stack:** TypeScript / Node / vitest。LLM 呼叫走現有 ProxyPilot（`judgeUrl` OpenAI 相容端點），複製 `src/judge.ts` 的 fetch pattern。

## Global Constraints

- **kernel 行數帳**：`wc -l src/*.ts`（非遞迴）**≤ 2500**（凍結 2400 + 緩衝 100）。現況 2396，僅 ~104 行 headroom。本 plan 只准動 `types.ts` / `cli.ts` / `backlog.ts` 三個 kernel 檔，合計預期 +~25 行 → 目標收在 ~2421，**每個動 kernel 的 task 收尾必跑 `wc -l src/*.ts` 確認 ≤2500**。
- **`src/autopilot/` 各檔 ≤200 行**（自算，不入 kernel 帳；仿 `src/engines/` adapter ≤150 的自我約束精神）。
- **鐵律 #1（修訂版）**：自生任務僅在 autopilot session 下、經 `GOAL.md` 授權、強制標記 `(autopilot)`、非 session 期間退回原行為、刪 GOAL.md/stopFile 即停。`BacklogStore.append()` 是唯一能新增任務行的路徑；`report()` 對未知 id 的拒絕**不得放寬**。
- **鐵律 #4 fail-open**：planner/evaluator/LLM 自身故障不反殺主迴圈——LLM 呼叫任何錯誤回安全預設，orchestrator 據此安全停並告警，不 throw。
- **鐵律 #7 引擎鐵三角**：執行全部走現有 `runOnce`，本 plan 不新寫任何引擎呼叫。
- **LF 換行、每 Task commit、conventional commit、SDD 雙判定審查。**
- **絕不碰 voice-actress**：所有測試與沙盒閉環用 `mkdtempSync` temp repo，首版不上真專案。
- **首版引擎鎖免費**：沙盒 config engines 白名單只放 `devin`（`swe-1.6`）或 `agy`；GOAL session 覆寫 defaultEngine 為該免費引擎。

## File Structure

**Kernel（動最少）**
- `src/types.ts` — 加 `goalFile?: string` 到 `ConfigSchema`；`Task` 加 `source?: 'user' | 'autopilot'`。
- `src/cli.ts` — `expandConfigPaths` 加 `goalFile` 條件展開。
- `src/backlog.ts` — 加 `append(text, opts)` 方法；`parseBacklog` 偵測 `adng:autopilot` annotation → `Task.source`。

**新增 `src/autopilot/`（不入 kernel 帳）**
- `src/autopilot/goal.ts` — `parseGoal(md): Goal`。
- `src/autopilot/llm.ts` — `callAgent(opts, prompt): Promise<string>`（複製 judge fetch pattern，fail-open 回空字串）。
- `src/autopilot/planner.ts` — `plan(deps, goal, history): Promise<PlanResult>`。
- `src/autopilot/evaluator.ts` — `evaluate(deps, goal): Promise<ProgressSnapshot>`。
- `src/autopilot/orchestrator.ts` — `runGoalSession(deps): Promise<GoalOutcome>` 主迴圈。
- `src/autopilot/run.ts` — CLI 入口（複用 `cli.assemble` + 建 autopilot deps + 跑 orchestrator + 寫稽核）。

**測試（flat `tests/`）**
- `tests/backlog-append.test.ts`、`tests/autopilot-goal.test.ts`、`tests/autopilot-llm.test.ts`、`tests/autopilot-planner.test.ts`、`tests/autopilot-evaluator.test.ts`、`tests/autopilot-orchestrator.test.ts`。

---

### Task 1: config `goalFile` 欄位 + 路徑展開（kernel）

**Files:**
- Modify: `src/types.ts:75`（ConfigSchema 加 `goalFile`）
- Modify: `src/cli.ts:67-77`（expandConfigPaths 加 goalFile）
- Test: `tests/autopilot-goal.test.ts`（config 段）

**Interfaces:**
- Produces: `Config.goalFile?: string`（絕對路徑，經 expand）。

- [ ] **Step 1: 寫失敗測試** — `tests/autopilot-goal.test.ts`

```ts
import { describe, test, expect } from 'vitest'
import { ConfigSchema } from '../src/types.js'

describe('config goalFile', () => {
  test('goalFile 是可選字串，能被 parse', () => {
    const cfg = ConfigSchema.parse({
      projectPath: '/p', backlogFile: '/p/BACKLOG.md', dataDir: '/p/data',
      engine: 'mock', goalFile: '/p/GOAL.md'
    })
    expect(cfg.goalFile).toBe('/p/GOAL.md')
  })
  test('goalFile 省略時為 undefined', () => {
    const cfg = ConfigSchema.parse({
      projectPath: '/p', backlogFile: '/p/BACKLOG.md', dataDir: '/p/data', engine: 'mock'
    })
    expect(cfg.goalFile).toBeUndefined()
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run tests/autopilot-goal.test.ts ; echo EXIT=$?`
Expected: FAIL（`goalFile` 未在 schema，parse 後為 undefined 或 strip 掉）。

- [ ] **Step 3: 加 schema 欄位** — `src/types.ts`，在 `backlogFile` 那行之後加：

```ts
  goalFile: z.string().optional(),
```

- [ ] **Step 4: 加路徑展開** — `src/cli.ts` 的 `expandConfigPaths`，在展開 `backlogFile` 之後加（保持與其他路徑同樣「相對 config 目錄」慣例）：

```ts
    goalFile: cfg.goalFile ? expandPath(baseDir, cfg.goalFile) : undefined,
```

- [ ] **Step 5: 跑測試確認通過**

Run: `npx vitest run tests/autopilot-goal.test.ts ; echo EXIT=$?`
Expected: PASS。

- [ ] **Step 6: kernel 帳檢查 + commit**

Run: `wc -l src/*.ts | tail -1`（確認 ≤2500）

```bash
git add src/types.ts src/cli.ts tests/autopilot-goal.test.ts
git commit -m "feat(autopilot): config 加 goalFile 欄位與路徑展開"
```

---

### Task 2: `BacklogStore.append()` + `Task.source` + 鐵律 #1 回歸（kernel，最敏感）

**Files:**
- Modify: `src/types.ts:3-14`（`Task` 加 `source?`）
- Modify: `src/backlog.ts`（加 `append()`；`parseBacklog` 標 source）
- Test: `tests/backlog-append.test.ts`

**Interfaces:**
- Consumes: 既有 `TASK_RE`、`taskId()`、`Disposition`。
- Produces:
  - `Task.source?: 'user' | 'autopilot'`
  - `BacklogStore.append(text: string, opts: { goalId: string; round: number }): void` — 附加一行 `- [ ] ${text} <!-- adng:autopilot goal:${goalId} round:${round} -->` 到 backlog 檔尾。
  - `parseBacklog` 對含 `adng:autopilot` annotation 的行標 `source: 'autopilot'`，否則 `'user'`。

- [ ] **Step 1: 寫失敗測試** — `tests/backlog-append.test.ts`

```ts
import { describe, test, expect, beforeEach } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { BacklogStore } from '../src/backlog.js'

let file: string
beforeEach(() => {
  const dir = mkdtempSync(join(tmpdir(), 'adng-append-'))
  file = join(dir, 'BACKLOG.md')
  writeFileSync(file, '- [ ] 使用者手排任務\n')
})

describe('BacklogStore.append (鐵律 #1 受控例外)', () => {
  test('append 後 read() 看到新任務且標 source:autopilot', () => {
    const store = new BacklogStore(file)
    store.append('自主子任務甲', { goalId: 'a1b2', round: 3 })
    const tasks = store.read()
    expect(tasks).toHaveLength(2)
    const auto = tasks.find(t => t.text === '自主子任務甲')!
    expect(auto.source).toBe('autopilot')
    expect(auto.status).toBe('open')
  })

  test('手排任務標 source:user，與自主可區分', () => {
    const store = new BacklogStore(file)
    store.append('自主子任務甲', { goalId: 'a1b2', round: 3 })
    const tasks = store.read()
    expect(tasks.find(t => t.text === '使用者手排任務')!.source).toBe('user')
  })

  test('append 寫入的行帶 autopilot annotation（goal + round 可稽核）', () => {
    const store = new BacklogStore(file)
    store.append('自主子任務甲', { goalId: 'a1b2', round: 3 })
    const md = readFileSync(file, 'utf8')
    expect(md).toContain('- [ ] 自主子任務甲 <!-- adng:autopilot goal:a1b2 round:3 -->')
  })

  test('鐵律 #1 回歸：report() 對未知 id 仍拒絕（append 不是唯一破口）', () => {
    const store = new BacklogStore(file)
    expect(() => store.report('deadbeef', { kind: 'done', commitHash: 'x' })).toThrow(/鐵律 #1/)
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run tests/backlog-append.test.ts ; echo EXIT=$?`
Expected: FAIL（`append` is not a function / `source` undefined）。

- [ ] **Step 3: `Task` 加 source** — `src/types.ts` 的 `Task` interface 內加：

```ts
  source?: 'user' | 'autopilot'
```

- [ ] **Step 4: `parseBacklog` 標 source** — `src/backlog.ts`，在建 `Task` 物件處，先偵測原始行是否含 autopilot annotation。於 `parseBacklog` 迴圈內、取得該行原文 `rawLine` 後計算：

```ts
    const source: 'user' | 'autopilot' =
      /<!--\s*adng:autopilot\b/.test(rawLine) ? 'autopilot' : 'user'
```
並把 `source` 併入 push 的 Task 物件（與現有 `id/text/line/status/engineTag/rawText` 同物件）。

- [ ] **Step 5: 加 `append()` 方法** — `src/backlog.ts` 的 `BacklogStore` class 內加（用 `appendFileSync`，確保檔尾換行）：

```ts
  append(text: string, opts: { goalId: string; round: number }): void {
    const line = `- [ ] ${text} <!-- adng:autopilot goal:${opts.goalId} round:${opts.round} -->`
    const cur = readFileSync(this.file, 'utf8')
    const sep = cur.length === 0 || cur.endsWith('\n') ? '' : '\n'
    appendFileSync(this.file, `${sep}${line}\n`)
  }
```
（`appendFileSync`、`readFileSync` 從 `node:fs` import，backlog.ts 已 import `writeFileSync`，補齊即可。）

- [ ] **Step 6: 跑測試確認通過**

Run: `npx vitest run tests/backlog-append.test.ts ; echo EXIT=$?`
Expected: PASS（4 tests）。

- [ ] **Step 7: 全測試回歸（確認沒破既有 backlog 解析）**

Run: `npx vitest run tests/backlog.test.ts ; echo EXIT=$?`
Expected: PASS。

- [ ] **Step 8: kernel 帳檢查 + commit**

Run: `wc -l src/*.ts | tail -1`（確認 ≤2500）

```bash
git add src/types.ts src/backlog.ts tests/backlog-append.test.ts
git commit -m "feat(autopilot): BacklogStore.append + Task.source（鐵律 #1 受控例外）"
```

---

### Task 3: GOAL.md 解析（`src/autopilot/goal.ts`，不入帳）

**Files:**
- Create: `src/autopilot/goal.ts`
- Test: `tests/autopilot-goal.test.ts`（沿用 Task 1 檔，加 describe）

**Interfaces:**
- Produces:
```ts
export interface Goal {
  objective: string          // 自然語言目標（# GOAL 段落）
  verifyCommand?: string     // 驗收條件 code block 內的 shell 指令；exit 0 = 達成
  engine?: string            // 邊界段指定的免費引擎 tag
  noProgressLimit: number    // 連續無進展上限，預設 3
}
export function parseGoal(md: string): Goal
```

- [ ] **Step 1: 寫失敗測試** — `tests/autopilot-goal.test.ts` 加：

```ts
import { parseGoal } from '../src/autopilot/goal.js'

describe('parseGoal', () => {
  const md = [
    '# GOAL', '把覆蓋率拉到 80%。', '',
    '## 驗收條件（可量測；exit 0 = 達成）', '```sh', 'npm run verify', '```', '',
    '## 邊界', '- 引擎：devin', '- 連續無進展上限：2'
  ].join('\n')

  test('抽出 objective / verifyCommand / engine / noProgressLimit', () => {
    const g = parseGoal(md)
    expect(g.objective).toContain('覆蓋率')
    expect(g.verifyCommand).toBe('npm run verify')
    expect(g.engine).toBe('devin')
    expect(g.noProgressLimit).toBe(2)
  })
  test('noProgressLimit 未寫時預設 3', () => {
    expect(parseGoal('# GOAL\n只有目標。').noProgressLimit).toBe(3)
  })
  test('無驗收 code block 時 verifyCommand 為 undefined', () => {
    expect(parseGoal('# GOAL\n只有目標。').verifyCommand).toBeUndefined()
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run tests/autopilot-goal.test.ts ; echo EXIT=$?`
Expected: FAIL（模組不存在）。

- [ ] **Step 3: 實作** — `src/autopilot/goal.ts`

```ts
export interface Goal {
  objective: string
  verifyCommand?: string
  engine?: string
  noProgressLimit: number
}

export function parseGoal(md: string): Goal {
  const lines = md.split(/\r?\n/)
  // objective：# GOAL 標題後到下一個 ## 之間的非空文字
  const objLines: string[] = []
  let inObjective = false
  for (const l of lines) {
    if (/^#\s+GOAL\b/i.test(l)) { inObjective = true; continue }
    if (/^##\s/.test(l)) inObjective = false
    if (inObjective && l.trim()) objLines.push(l.trim())
  }
  // verifyCommand：第一個 fenced code block 的內容（去空行後 join 成單指令串）
  let verifyCommand: string | undefined
  const fence = md.match(/```[a-z]*\n([\s\S]*?)```/i)
  if (fence) {
    const body = fence[1].split(/\r?\n/).map(s => s.trim()).filter(Boolean).join(' && ')
    if (body) verifyCommand = body
  }
  // engine：「引擎：xxx」
  const engineM = md.match(/引擎[：:]\s*([\w-]+)/)
  // noProgressLimit：「連續無進展上限：N」，預設 3
  const limM = md.match(/連續無進展上限[：:]\s*(\d+)/)
  return {
    objective: objLines.join(' '),
    verifyCommand,
    engine: engineM?.[1],
    noProgressLimit: limM ? Number(limM[1]) : 3
  }
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run tests/autopilot-goal.test.ts ; echo EXIT=$?`
Expected: PASS。

- [ ] **Step 5: commit**

```bash
git add src/autopilot/goal.ts tests/autopilot-goal.test.ts
git commit -m "feat(autopilot): GOAL.md 解析（objective/verifyCommand/engine/limit）"
```

---

### Task 4: LLM agent 呼叫（`src/autopilot/llm.ts`，不入帳）

**Files:**
- Create: `src/autopilot/llm.ts`
- Test: `tests/autopilot-llm.test.ts`

**Interfaces:**
- Produces:
```ts
export interface LlmOpts { url?: string; model: string; apiKey: string; fetchFn?: typeof fetch }
export async function callAgent(opts: LlmOpts, prompt: string): Promise<string>
```
- 契約：複製 `src/judge.ts` fetch pattern（`POST {url}/chat/completions`、Bearer、`reasoning_effort:'low'`、AbortController 30s）。**fail-open**：無 url / http 非 2xx / 例外 → 回**空字串**（呼叫方據空字串走安全預設，鐵律 #4）。

- [ ] **Step 1: 寫失敗測試** — `tests/autopilot-llm.test.ts`

```ts
import { describe, test, expect } from 'vitest'
import { callAgent } from '../src/autopilot/llm.js'

function fakeFetch(content: string, ok = true, status = 200): typeof fetch {
  return (async () => ({
    ok, status,
    json: async () => ({ choices: [{ message: { content } }] })
  })) as unknown as typeof fetch
}

describe('callAgent', () => {
  test('回傳 model 的 message content', async () => {
    const out = await callAgent(
      { url: 'http://x/v1', model: 'm', apiKey: 'k', fetchFn: fakeFetch('hello') }, 'p')
    expect(out).toBe('hello')
  })
  test('無 url → 空字串（fail-open）', async () => {
    expect(await callAgent({ model: 'm', apiKey: 'k' }, 'p')).toBe('')
  })
  test('http 非 2xx → 空字串（fail-open）', async () => {
    const out = await callAgent(
      { url: 'http://x/v1', model: 'm', apiKey: 'k', fetchFn: fakeFetch('', false, 500) }, 'p')
    expect(out).toBe('')
  })
  test('fetch 例外 → 空字串（fail-open）', async () => {
    const throwing = (async () => { throw new Error('net') }) as unknown as typeof fetch
    const out = await callAgent(
      { url: 'http://x/v1', model: 'm', apiKey: 'k', fetchFn: throwing }, 'p')
    expect(out).toBe('')
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run tests/autopilot-llm.test.ts ; echo EXIT=$?`
Expected: FAIL（模組不存在）。

- [ ] **Step 3: 實作** — `src/autopilot/llm.ts`

```ts
export interface LlmOpts { url?: string; model: string; apiKey: string; fetchFn?: typeof fetch }

export async function callAgent(opts: LlmOpts, prompt: string): Promise<string> {
  if (!opts.url) return ''
  const f = opts.fetchFn ?? fetch
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)
  try {
    const res = await f(`${opts.url.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${opts.apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: opts.model,
        reasoning_effort: 'low',
        messages: [{ role: 'user', content: prompt }]
      })
    })
    if (!res.ok) return ''
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
    return data.choices?.[0]?.message?.content ?? ''
  } catch {
    return ''
  } finally {
    clearTimeout(timer)
  }
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run tests/autopilot-llm.test.ts ; echo EXIT=$?`
Expected: PASS（4 tests）。

- [ ] **Step 5: commit**

```bash
git add src/autopilot/llm.ts tests/autopilot-llm.test.ts
git commit -m "feat(autopilot): callAgent LLM 呼叫（複製 judge pattern，fail-open）"
```

---

### Task 5: planner agent（`src/autopilot/planner.ts`，不入帳）

**Files:**
- Create: `src/autopilot/planner.ts`
- Test: `tests/autopilot-planner.test.ts`

**Interfaces:**
- Consumes: `Goal`（Task 3）、`callAgent`/`LlmOpts`（Task 4）。
- Produces:
```ts
export type PlanResult =
  | { kind: 'tasks'; tasks: string[] }
  | { kind: 'achieved' }
  | { kind: 'stuck'; reason: string }
export interface PlanInput { goal: Goal; repoSummary: string; history: string[] }
export async function plan(llm: LlmOpts, input: PlanInput): Promise<PlanResult>
```
- 契約：組 prompt 要求 model 回**嚴格格式**——首行 `ACHIEVED` / `STUCK: <理由>` / `TASKS`（後續每行一條任務）。`callAgent` 回空字串（fail-open）→ 視為 `{ kind:'stuck', reason:'planner 無回應' }`。**相關性檢查**：丟棄空行與明顯與 objective 無關的行（此處以「非空、去重」為最小實作，語意相關性交由 prompt 約束 + evaluator 兜底）。

- [ ] **Step 1: 寫失敗測試** — `tests/autopilot-planner.test.ts`

```ts
import { describe, test, expect } from 'vitest'
import { plan } from '../src/autopilot/planner.js'
import type { Goal } from '../src/autopilot/goal.js'
import type { LlmOpts } from '../src/autopilot/llm.js'

const goal: Goal = { objective: '拉高覆蓋率', noProgressLimit: 3 }
function llmReturning(content: string): LlmOpts {
  const fetchFn = (async () => ({ ok: true, status: 200,
    json: async () => ({ choices: [{ message: { content } }] }) })) as unknown as typeof fetch
  return { url: 'http://x/v1', model: 'm', apiKey: 'k', fetchFn }
}

describe('planner.plan', () => {
  test('TASKS → 逐行任務清單', async () => {
    const r = await plan(llmReturning('TASKS\n補 foo 的測試\n補 bar 的測試'), { goal, repoSummary: '', history: [] })
    expect(r).toEqual({ kind: 'tasks', tasks: ['補 foo 的測試', '補 bar 的測試'] })
  })
  test('ACHIEVED → achieved', async () => {
    expect(await plan(llmReturning('ACHIEVED'), { goal, repoSummary: '', history: [] }))
      .toEqual({ kind: 'achieved' })
  })
  test('STUCK → stuck + 理由', async () => {
    expect(await plan(llmReturning('STUCK: 缺乏測試框架'), { goal, repoSummary: '', history: [] }))
      .toEqual({ kind: 'stuck', reason: '缺乏測試框架' })
  })
  test('LLM 空回應（fail-open）→ stuck', async () => {
    const r = await plan({ model: 'm', apiKey: 'k' }, { goal, repoSummary: '', history: [] })
    expect(r).toEqual({ kind: 'stuck', reason: 'planner 無回應' })
  })
  test('TASKS 去空行去重', async () => {
    const r = await plan(llmReturning('TASKS\n甲\n\n甲\n乙'), { goal, repoSummary: '', history: [] })
    expect(r).toEqual({ kind: 'tasks', tasks: ['甲', '乙'] })
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run tests/autopilot-planner.test.ts ; echo EXIT=$?`
Expected: FAIL（模組不存在）。

- [ ] **Step 3: 實作** — `src/autopilot/planner.ts`

```ts
import type { Goal } from './goal.js'
import { callAgent, type LlmOpts } from './llm.js'

export type PlanResult =
  | { kind: 'tasks'; tasks: string[] }
  | { kind: 'achieved' }
  | { kind: 'stuck'; reason: string }

export interface PlanInput { goal: Goal; repoSummary: string; history: string[] }

function buildPrompt(input: PlanInput): string {
  const { goal, repoSummary, history } = input
  return [
    '你是自主開發規劃器。目標如下，判斷為達成目標「下一批」該做哪些具體任務。',
    `# 目標\n${goal.objective}`,
    goal.verifyCommand ? `# 驗收條件\n${goal.verifyCommand}` : '',
    `# repo 現況\n${repoSummary || '（無摘要）'}`,
    history.length ? `# 已跑過的任務與結果\n${history.join('\n')}` : '',
    '',
    '嚴格照以下格式回答，第一行必須是 ACHIEVED / STUCK / TASKS 其一：',
    '- 若目標已達成：只回一行 `ACHIEVED`',
    '- 若卡住無法推進：回 `STUCK: <一句理由>`',
    '- 否則回 `TASKS`，其後每行一條「與目標直接相關」的具體任務（1~5 條），任務文字須可被工程引擎獨立執行。'
  ].filter(Boolean).join('\n')
}

export async function plan(llm: LlmOpts, input: PlanInput): Promise<PlanResult> {
  const out = (await callAgent(llm, buildPrompt(input))).trim()
  if (!out) return { kind: 'stuck', reason: 'planner 無回應' }
  const lines = out.split(/\r?\n/)
  const head = lines[0].trim()
  if (/^ACHIEVED\b/i.test(head)) return { kind: 'achieved' }
  if (/^STUCK\b/i.test(head)) {
    return { kind: 'stuck', reason: head.replace(/^STUCK\s*:?\s*/i, '').trim() || '未說明' }
  }
  if (/^TASKS\b/i.test(head)) {
    const seen = new Set<string>()
    const tasks: string[] = []
    for (const l of lines.slice(1)) {
      const t = l.replace(/^[-*\d.\s]+/, '').trim()
      if (t && !seen.has(t)) { seen.add(t); tasks.push(t) }
    }
    return tasks.length ? { kind: 'tasks', tasks } : { kind: 'stuck', reason: 'planner 未產出任務' }
  }
  return { kind: 'stuck', reason: `planner 格式異常：${head.slice(0, 40)}` }
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run tests/autopilot-planner.test.ts ; echo EXIT=$?`
Expected: PASS（5 tests）。

- [ ] **Step 5: commit**

```bash
git add src/autopilot/planner.ts tests/autopilot-planner.test.ts
git commit -m "feat(autopilot): planner agent（tasks/achieved/stuck 三態）"
```

---

### Task 6: progress evaluator（`src/autopilot/evaluator.ts`，不入帳）

**Files:**
- Create: `src/autopilot/evaluator.ts`
- Test: `tests/autopilot-evaluator.test.ts`

**Interfaces:**
- Consumes: `Goal`（Task 3）、`callAgent`/`LlmOpts`（Task 4）。
- Produces:
```ts
export interface ProgressSnapshot { achieved: boolean; score: number; detail: string }
export interface EvalDeps {
  llm: LlmOpts
  runVerify?: (cmd: string, cwd: string) => { exitCode: number; passed: number }
}
export async function evaluate(deps: EvalDeps, goal: Goal, cwd: string): Promise<ProgressSnapshot>
```
- 契約：**可量測優先**——有 `goal.verifyCommand` 就跑 `runVerify`（預設實作用 `execSync`，非零 exit 不 throw），`score = passed`（可量測通過項數），`achieved = exitCode === 0`。**agent 補**：無 verifyCommand 時才問 `callAgent`（回含 `ACHIEVED` 關鍵字則 achieved，score 記 0/1）。fail-open：verify 例外 → `score:0, achieved:false, detail`。

- [ ] **Step 1: 寫失敗測試** — `tests/autopilot-evaluator.test.ts`

```ts
import { describe, test, expect } from 'vitest'
import { evaluate } from '../src/autopilot/evaluator.js'
import type { Goal } from '../src/autopilot/goal.js'

const withVerify: Goal = { objective: 'o', verifyCommand: 'npm run verify', noProgressLimit: 3 }
const noVerify: Goal = { objective: 'o', noProgressLimit: 3 }
const llm = { model: 'm', apiKey: 'k' } // url 省略：callAgent fail-open 回 ''

describe('evaluate', () => {
  test('可量測優先：verify exit 0 → achieved，score=通過項數', async () => {
    const s = await evaluate({ llm, runVerify: () => ({ exitCode: 0, passed: 42 }) }, withVerify, '/tmp')
    expect(s.achieved).toBe(true)
    expect(s.score).toBe(42)
  })
  test('verify 非零 exit → 未達成，score 仍記通過項數（供進展比較）', async () => {
    const s = await evaluate({ llm, runVerify: () => ({ exitCode: 1, passed: 30 }) }, withVerify, '/tmp')
    expect(s.achieved).toBe(false)
    expect(s.score).toBe(30)
  })
  test('無 verifyCommand + agent 空回應（fail-open）→ 未達成 score 0', async () => {
    const s = await evaluate({ llm }, noVerify, '/tmp')
    expect(s.achieved).toBe(false)
    expect(s.score).toBe(0)
  })
  test('無 verifyCommand + agent 回 ACHIEVED → achieved', async () => {
    const fetchFn = (async () => ({ ok: true, status: 200,
      json: async () => ({ choices: [{ message: { content: 'ACHIEVED 已完成' } }] }) })) as unknown as typeof fetch
    const s = await evaluate({ llm: { url: 'http://x/v1', model: 'm', apiKey: 'k', fetchFn } }, noVerify, '/tmp')
    expect(s.achieved).toBe(true)
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run tests/autopilot-evaluator.test.ts ; echo EXIT=$?`
Expected: FAIL（模組不存在）。

- [ ] **Step 3: 實作** — `src/autopilot/evaluator.ts`

```ts
import { execSync } from 'node:child_process'
import type { Goal } from './goal.js'
import { callAgent, type LlmOpts } from './llm.js'

export interface ProgressSnapshot { achieved: boolean; score: number; detail: string }
export interface EvalDeps {
  llm: LlmOpts
  runVerify?: (cmd: string, cwd: string) => { exitCode: number; passed: number }
}

// 預設 verify 執行：非零 exit 不 throw；passed = 從輸出數 "pass"/"passing" 的粗略計數（沙盒足夠）
function defaultRunVerify(cmd: string, cwd: string): { exitCode: number; passed: number } {
  try {
    const out = execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    const m = out.match(/(\d+)\s+pass/i)
    return { exitCode: 0, passed: m ? Number(m[1]) : 1 }
  } catch (err) {
    const e = err as { status?: number; stdout?: string }
    const m = (e.stdout ?? '').match(/(\d+)\s+pass/i)
    return { exitCode: e.status ?? 1, passed: m ? Number(m[1]) : 0 }
  }
}

export async function evaluate(deps: EvalDeps, goal: Goal, cwd: string): Promise<ProgressSnapshot> {
  if (goal.verifyCommand) {
    const run = deps.runVerify ?? defaultRunVerify
    try {
      const { exitCode, passed } = run(goal.verifyCommand, cwd)
      return { achieved: exitCode === 0, score: passed, detail: `verify exit=${exitCode} passed=${passed}` }
    } catch (err) {
      return { achieved: false, score: 0, detail: `verify error: ${String(err).slice(0, 120)}` }
    }
  }
  // 無可量測條件：agent 補判（fail-open：空回應 = 未達成）
  const out = (await callAgent(deps.llm,
    `目標：${goal.objective}\n判斷是否已達成，達成回 ACHIEVED，否則回 NOT-YET 並簡述缺口。`)).trim()
  const achieved = /ACHIEVED/i.test(out.slice(0, 20))
  return { achieved, score: achieved ? 1 : 0, detail: out.slice(0, 200) || 'agent 無回應' }
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run tests/autopilot-evaluator.test.ts ; echo EXIT=$?`
Expected: PASS（4 tests）。

- [ ] **Step 5: commit**

```bash
git add src/autopilot/evaluator.ts tests/autopilot-evaluator.test.ts
git commit -m "feat(autopilot): progress evaluator（可量測優先，agent 補）"
```

---

### Task 7: orchestrator 主迴圈（`src/autopilot/orchestrator.ts`，不入帳）

**Files:**
- Create: `src/autopilot/orchestrator.ts`
- Test: `tests/autopilot-orchestrator.test.ts`

**Interfaces:**
- Consumes: `Goal`、`PlanResult`/`plan`、`ProgressSnapshot`/`evaluate`、kernel 的 `Deps`/`runOnce`/`CycleResult`、`BacklogStore.append`。
- Produces:
```ts
export type GoalOutcome =
  | { kind: 'achieved'; rounds: number }
  | { kind: 'no-progress'; rounds: number }   // 撞連續無進展煞車
  | { kind: 'stuck'; rounds: number; reason: string }
  | { kind: 'killed'; rounds: number }         // GOAL.md 消失 / stopFile
export interface OrchestratorDeps {
  goalId: string
  goal: Goal
  cwd: string                                  // 目標專案路徑（跑 verify 用）
  kernelDeps: Deps                             // 給 runOnce
  planFn: (input: PlanInput) => Promise<PlanResult>
  evalFn: (cwd: string) => Promise<ProgressSnapshot>
  runOnceFn: (d: Deps) => Promise<CycleResult>
  isAlive: () => boolean                       // GOAL.md 仍在 && 無 stopFile
  onRound?: (r: RoundLog) => void              // 稽核回呼
}
export interface RoundLog { round: number; plan: PlanResult; snapshot: ProgressSnapshot }
export async function runGoalSession(deps: OrchestratorDeps): Promise<GoalOutcome>
```
- 契約（主迴圈，每輪）：
  1. `isAlive()` false → `killed`。
  2. `planFn` → `achieved`/`stuck` 直接結束；`tasks` 則逐條 `kernelDeps.store.append(t, {goalId, round})`。
  3. 反覆 `runOnceFn(kernelDeps)` 直到回 `'idle'`（該批跑完；`'stopped'`/`'cost-hard-stop'` 也中止）。
  4. `evalFn(cwd)` → snapshot；`achieved` → `achieved`。
  5. **連續無進展**：`snapshot.score <= lastScore` 累計；連續達 `goal.noProgressLimit` → `no-progress`。有提升則歸零並更新 lastScore。
  6. `onRound` 記錄稽核，round++。

- [ ] **Step 1: 寫失敗測試** — `tests/autopilot-orchestrator.test.ts`

```ts
import { describe, test, expect } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { runGoalSession, type OrchestratorDeps } from '../src/autopilot/orchestrator.js'
import { BacklogStore } from '../src/backlog.js'
import type { Goal } from '../src/autopilot/goal.js'

function base(goal: Goal, overrides: Partial<OrchestratorDeps>): OrchestratorDeps {
  const dir = mkdtempSync(join(tmpdir(), 'adng-orch-'))
  const backlogFile = join(dir, 'BACKLOG.md')
  writeFileSync(backlogFile, '')
  const store = new BacklogStore(backlogFile)
  return {
    goalId: 'g1', goal, cwd: dir,
    kernelDeps: { store } as unknown as OrchestratorDeps['kernelDeps'],
    planFn: async () => ({ kind: 'achieved' }),
    evalFn: async () => ({ achieved: true, score: 1, detail: '' }),
    runOnceFn: async () => 'idle',
    isAlive: () => true,
    ...overrides
  }
}

describe('runGoalSession', () => {
  test('planner 首輪 achieved → outcome achieved', async () => {
    const out = await runGoalSession(base({ objective: 'o', noProgressLimit: 3 }, {}))
    expect(out.kind).toBe('achieved')
  })

  test('evaluator 判 achieved → achieved（planner 出任務後）', async () => {
    let planned = false
    const out = await runGoalSession(base({ objective: 'o', noProgressLimit: 3 }, {
      planFn: async () => (planned ? { kind: 'achieved' } : (planned = true, { kind: 'tasks', tasks: ['甲'] })),
      evalFn: async () => ({ achieved: true, score: 5, detail: '' })
    }))
    expect(out.kind).toBe('achieved')
  })

  test('連續無進展達上限 → no-progress', async () => {
    const out = await runGoalSession(base({ objective: 'o', noProgressLimit: 2 }, {
      planFn: async () => ({ kind: 'tasks', tasks: ['甲'] }),
      evalFn: async () => ({ achieved: false, score: 1, detail: '' }) // score 恆不升
    }))
    expect(out.kind).toBe('no-progress')
  })

  test('kill switch：isAlive false → killed', async () => {
    const out = await runGoalSession(base({ objective: 'o', noProgressLimit: 3 }, {
      isAlive: () => false
    }))
    expect(out.kind).toBe('killed')
  })

  test('planner stuck → stuck', async () => {
    const out = await runGoalSession(base({ objective: 'o', noProgressLimit: 3 }, {
      planFn: async () => ({ kind: 'stuck', reason: '沒框架' })
    }))
    expect(out).toMatchObject({ kind: 'stuck', reason: '沒框架' })
  })

  test('tasks 有被 append 進 backlog（帶 autopilot 標記）', async () => {
    const captured: string[] = []
    let done = false
    const deps = base({ objective: 'o', noProgressLimit: 3 }, {
      planFn: async () => (done ? { kind: 'achieved' } : (done = true, { kind: 'tasks', tasks: ['寫測試'] })),
      evalFn: async () => ({ achieved: true, score: 9, detail: '' })
    })
    const realAppend = deps.kernelDeps.store.append.bind(deps.kernelDeps.store)
    deps.kernelDeps.store.append = (t: string, o: { goalId: string; round: number }) => { captured.push(t); realAppend(t, o) }
    await runGoalSession(deps)
    expect(captured).toContain('寫測試')
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run tests/autopilot-orchestrator.test.ts ; echo EXIT=$?`
Expected: FAIL（模組不存在）。

- [ ] **Step 3: 實作** — `src/autopilot/orchestrator.ts`

```ts
import type { Deps, CycleResult } from '../scheduler.js'
import type { Goal } from './goal.js'
import type { PlanResult, PlanInput } from './planner.js'
import type { ProgressSnapshot } from './evaluator.js'

export type GoalOutcome =
  | { kind: 'achieved'; rounds: number }
  | { kind: 'no-progress'; rounds: number }
  | { kind: 'stuck'; rounds: number; reason: string }
  | { kind: 'killed'; rounds: number }

export interface RoundLog { round: number; plan: PlanResult; snapshot: ProgressSnapshot }

export interface OrchestratorDeps {
  goalId: string
  goal: Goal
  cwd: string
  kernelDeps: Deps
  planFn: (input: PlanInput) => Promise<PlanResult>
  evalFn: (cwd: string) => Promise<ProgressSnapshot>
  runOnceFn: (d: Deps) => Promise<CycleResult>
  isAlive: () => boolean
  onRound?: (r: RoundLog) => void
}

export async function runGoalSession(deps: OrchestratorDeps): Promise<GoalOutcome> {
  const history: string[] = []
  let round = 0
  let lastScore = -Infinity
  let noProgress = 0

  for (;;) {
    if (!deps.isAlive()) return { kind: 'killed', rounds: round }
    round++

    const repoSummary = `round ${round}`
    const planResult = await deps.planFn({ goal: deps.goal, repoSummary, history })
    if (planResult.kind === 'achieved') return { kind: 'achieved', rounds: round }
    if (planResult.kind === 'stuck') return { kind: 'stuck', rounds: round, reason: planResult.reason }

    // tasks：append 進 backlog（autopilot 標記），逐條跑完該批
    for (const t of planResult.tasks) {
      deps.kernelDeps.store.append(t, { goalId: deps.goalId, round })
      history.push(`round ${round}: ${t}`)
    }
    for (;;) {
      if (!deps.isAlive()) return { kind: 'killed', rounds: round }
      const r = await deps.runOnceFn(deps.kernelDeps)
      if (r === 'idle' || r === 'stopped' || r === 'cost-hard-stop') break
    }

    const snapshot = await deps.evalFn(deps.cwd)
    deps.onRound?.({ round, plan: planResult, snapshot })
    if (snapshot.achieved) return { kind: 'achieved', rounds: round }

    if (snapshot.score > lastScore) { lastScore = snapshot.score; noProgress = 0 }
    else { noProgress++; if (noProgress >= deps.goal.noProgressLimit) return { kind: 'no-progress', rounds: round } }
  }
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run tests/autopilot-orchestrator.test.ts ; echo EXIT=$?`
Expected: PASS（6 tests）。

- [ ] **Step 5: commit**

```bash
git add src/autopilot/orchestrator.ts tests/autopilot-orchestrator.test.ts
git commit -m "feat(autopilot): orchestrator 主迴圈（規劃/執行/評估/連續無進展煞車/kill switch）"
```

---

### Task 8: CLI 入口 + 沙盒閉環驗證（`src/autopilot/run.ts`，operations，主控執行）

**Files:**
- Create: `src/autopilot/run.ts`
- 無新單元測試（此 Task 交付物是「真跑閉環」，由主控在沙盒 temp repo 執行，絕不碰 voice-actress）

**Interfaces:**
- Consumes: `cli.assemble`（`{ deps, notifier, cfg }`）、`parseGoal`、`plan`、`evaluate`、`runGoalSession`、`runOnce`。
- Produces: 可執行入口 `node dist/autopilot/run.js --config <path>`：讀 `cfg.goalFile` → `parseGoal` → 組 `OrchestratorDeps`（`isAlive` = goalFile 存在 && 無 stopFile；`onRound` 寫稽核 JSONL 到 `cfg.dataDir/goal-<goalId>.jsonl`）→ `runGoalSession` → 印 outcome + 發 Discord 通知。

- [ ] **Step 1: 實作** — `src/autopilot/run.ts`

```ts
import { existsSync, appendFileSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { assemble } from '../cli.js'
import { runOnce } from '../scheduler.js'
import { parseGoal } from './goal.js'
import { plan } from './planner.js'
import { evaluate } from './evaluator.js'
import { runGoalSession, type OrchestratorDeps } from './orchestrator.js'

export async function main(cfgPath: string): Promise<void> {
  const { deps, cfg } = assemble(cfgPath)
  if (!cfg.goalFile || !existsSync(cfg.goalFile)) {
    console.log('no GOAL.md（autopilot 未啟動）'); return
  }
  const goalMd = readFileSync(cfg.goalFile, 'utf8')
  const goal = parseGoal(goalMd)
  const goalId = createHash('sha1').update(goal.objective).digest('hex').slice(0, 4)
  // GOAL 指定的免費引擎覆寫 defaultEngine（沙盒 config 白名單須含此引擎）
  const kernelDeps = goal.engine
    ? { ...deps, cfg: { ...cfg, defaultEngine: goal.engine } }
    : deps
  const llm = { url: cfg.judgeUrl, model: cfg.judgeModel, apiKey: cfg.judgeApiKey }
  const auditFile = join(cfg.dataDir, `goal-${goalId}.jsonl`)

  const orchDeps: OrchestratorDeps = {
    goalId, goal, cwd: cfg.projectPath, kernelDeps,
    planFn: (input) => plan(llm, input),
    evalFn: (cwd) => evaluate({ llm }, goal, cwd),
    runOnceFn: (d) => runOnce(d),
    isAlive: () => existsSync(cfg.goalFile!) && !existsSync(cfg.stopFile),
    onRound: (r) => appendFileSync(auditFile, JSON.stringify(r) + '\n')
  }
  const outcome = await runGoalSession(orchDeps)
  appendFileSync(auditFile, JSON.stringify({ outcome }) + '\n') // 停止原因入稽核（spec 段⑤）
  console.log(`GOAL outcome: ${JSON.stringify(outcome)}`)
}

const cfgArg = process.argv.indexOf('--config')
if (cfgArg >= 0 && process.argv[cfgArg + 1]) {
  main(process.argv[cfgArg + 1]).catch((e) => { console.error(e); process.exit(1) })
}
```

- [ ] **Step 2: build**

Run: `npm run build ; echo EXIT=$?`
Expected: EXIT=0（TypeScript 編譯過）。

- [ ] **Step 3: 沙盒閉環——達成路徑（主控在 temp repo 手動驗）**

建一個 temp git repo（`initGitRepo` 同法），寫 `GOAL.md`（objective + `verifyCommand: exit 0`）、`configs/sandbox.json`（engines 白名單含 `mock` 或 `agy`、`goalFile` 指向、`defaultEngine` 設該引擎）、空 `BACKLOG.md`。跑 `node dist/autopilot/run.js --config <sandbox.json>`。
驗證：
- `GOAL outcome: {"kind":"achieved",...}`
- backlog 出現 `(autopilot)` 標記行（`git log` / 檔內容）
- 稽核檔 `data/goal-<id>.jsonl` 每輪一筆

- [ ] **Step 4: 沙盒閉環——卡住路徑**

改 `GOAL.md` 的 `verifyCommand` 為恆失敗（`exit 1`）、`連續無進展上限：2`。跑同指令。
驗證：`GOAL outcome: {"kind":"no-progress",...}`，且**未無限跑**（round 有界）。

- [ ] **Step 5: 沙盒閉環——kill switch**

跑一個會多輪的 GOAL，中途刪掉 `GOAL.md`（或 `touch .adng.stop`）。
驗證：下一輪頂端偵測到 → `GOAL outcome: {"kind":"killed",...}`。

- [ ] **Step 6: 全測試綠 + kernel 帳終檢**

Run: `npx vitest run ; echo EXIT=$?`（Expected: 全 PASS）
Run: `wc -l src/*.ts | tail -1`（Expected: ≤2500）
Run: `for f in src/autopilot/*.ts; do echo "$(wc -l < $f) $f"; done`（Expected: 每檔 ≤200）

- [ ] **Step 7: commit**

```bash
git add src/autopilot/run.ts
git commit -m "feat(autopilot): CLI 入口 + 沙盒閉環驗證（達成/卡住/kill switch 三路徑）"
```

---

## 依賴順序
Task 1、2、3、4 可平行（1、2 動 kernel；3、4 純新增）。Task 5 依賴 4；Task 6 依賴 4；Task 7 依賴 1/2/3/5/6；Task 8 依賴 7。

## Acceptance
- 全測試綠；`wc -l src/*.ts` ≤2500；`src/autopilot/*.ts` 每檔 ≤200。
- 鐵律 #1 回歸測試通過（`report()` 仍拒未知 id；非 append 路徑不新增任務）。
- 沙盒閉環三路徑（達成 / 連續無進展 / kill switch）實跑驗過，全程未碰 voice-actress。
- 自主任務在 backlog 帶 `(autopilot)` 標記、`Task.source` 可區分。
- SDD 雙判定審查各 Task Approved；milestone 末 opus 全分支審查 READY 再併 main。

## 明確不做（YAGNI）
輪數/時間/成本硬上限、多 GOAL 併發、每子任務人工放行閘、首版上 voice-actress。
