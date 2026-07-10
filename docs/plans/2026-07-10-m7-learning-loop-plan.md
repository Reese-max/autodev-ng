# M7 經驗回饋閉環 + M7.5 補丁包 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 讓 autodev-ng 從失敗中自動提煉教訓(L 編號庫)並注入後續派工/planner prompt,越跑越聰明;外加 daemon OOM 閘與 idle 要任務通知。

**Architecture:** 新子目錄 `src/learn/`(store + reflect,各檔 ≤200 行,不計 kernel 帳),kernel 只加微掛鉤(scheduler 注入、daemon 失敗觸發、cli 接線、db lastAttempt、config 兩欄位)。設計正本:`docs/plans/2026-07-10-legacy-port-design.md`。

**Tech Stack:** TypeScript / Node / vitest / better-sqlite3。LLM 走 `src/autopilot/llm.ts` 的 `callAgent`(fail-open,已存在)。

## Global Constraints

- **kernel 帳**:`wc -l src/*.ts`(非遞迴)≤2500(目前 2427,本 plan kernel 增量預算 ~45 行)。`src/learn/*.ts` 各檔 ≤200 行。
- **鐵律 #4 fail-open**:learn 面任何故障(檔壞、LLM 掛、寫入失敗)絕不反殺主迴圈——inject/reflect 呼叫端全包 try/catch,learn 內部也自吞。
- **反 Goodhart**:LLM 可回 NONE 則不寫;去重跳過;寧缺勿濫。
- **每 task 收尾必跑 `npm run build`(tsc 零錯誤)+ `npx vitest run` 全綠**(vitest 的 esbuild 跳 strict-null,只有 tsc 抓得到)。
- LF 換行(commit 前驗 `\r` 計數=0);conventional commit;每 task 一 commit。
- **禁止 git reset/checkout/clean/gc**;只在當前分支工作。
- 測試絕不打真網路/真 Discord;LLM 一律經 `fetchFn` 注入 fake。
- 實作前先讀你要改的檔案與同名測試檔,沿用既有模式(測試自建 tmp 目錄 + 真實類別,無共用 fake helper)。

---

### Task 1: LessonStore(`src/learn/store.ts`)

**Files:**
- Create: `src/learn/store.ts`
- Test: `tests/learn-store.test.ts`

**Interfaces:**
- Consumes: 無(純檔案 I/O)。
- Produces(後續 task 依賴,簽名必須一字不差):
  - `export interface Lesson { num: number; date: string; text: string }`
  - `export function parseLessons(md: string): Lesson[]`
  - `export class LessonStore { constructor(projectFile: string, globalFile?: string); inject(): string; add(text: string, now?: Date): boolean }`
  - 常數:`export const MAX_LESSONS = 30`、`export const MAX_LESSON_LEN = 200`

**規格:**
- 檔案格式:每條 `- L003 [2026-07-10] 教訓文字`(正則 `/^- L(\d+) \[(\d{4}-\d{2}-\d{2})\] (.+)$/`),其餘行(含 `# Learnings` 標題)忽略。
- `parseLessons`:回檔內順序;檔案缺失/損壞由呼叫端(store 內部 read)容錯為 `[]`。
- `add(text)`(只寫專案層):text 先取第一行、trim、以 code point 截斷至 200 字;空字串回 `false`;**去重**:正規化(去所有空白)後與既有任一條互為包含 → 回 `false` 不寫;編號=既有最大 L 編號+1;滿 30 條先淘汰最舊(檔內第一條)再寫;寫檔用 tmp+rename 原子寫(鏡像 `src/events.ts` 風格),含 `# Learnings` 標題;任何內部錯誤吞掉回 `false`(鐵律 #4)。
- `inject()`:合併全局層(只讀,前綴 `- [全局] `,不含 L 編號日期也照原文列出其 text)與專案層(原格式 `- L001 [date] text`);兩層皆空回 `''`;否則回:
  ```
  ## 過往教訓(遵守,避免重蹈)
  - [全局] <global text>
  - L001 [2026-07-10] <project text>
  ```
  (無前導換行;任何讀檔錯誤該層視為空。)

- [ ] **Step 1: 寫失敗測試** — `tests/learn-store.test.ts`

```ts
import { describe, test, expect } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { LessonStore, parseLessons, MAX_LESSONS } from '../src/learn/store.js'

function dir(): string { return mkdtempSync(join(tmpdir(), 'adng-learn-')) }

describe('parseLessons', () => {
  test('解析 L 編號/日期/文字,忽略標題與雜行', () => {
    const md = '# Learnings\n- L001 [2026-07-10] 教訓甲\n雜行\n- L003 [2026-07-11] 教訓乙\n'
    expect(parseLessons(md)).toEqual([
      { num: 1, date: '2026-07-10', text: '教訓甲' },
      { num: 3, date: '2026-07-11', text: '教訓乙' }
    ])
  })
})

describe('LessonStore.add', () => {
  test('新檔寫入 L001,含標題', () => {
    const f = join(dir(), 'learnings.md')
    const s = new LessonStore(f)
    expect(s.add('port 3210 才是對的', new Date('2026-07-10T12:00:00Z'))).toBe(true)
    const raw = readFileSync(f, 'utf8')
    expect(raw).toContain('# Learnings')
    expect(raw).toContain('- L001 [2026-07-10] port 3210 才是對的')
  })
  test('編號遞增取 max+1', () => {
    const f = join(dir(), 'learnings.md')
    writeFileSync(f, '# Learnings\n- L007 [2026-07-01] 舊教訓\n')
    const s = new LessonStore(f)
    s.add('新教訓', new Date('2026-07-10T12:00:00Z'))
    expect(readFileSync(f, 'utf8')).toContain('- L008 [2026-07-10] 新教訓')
  })
  test('去重:正規化互為包含則跳過', () => {
    const f = join(dir(), 'learnings.md')
    const s = new LessonStore(f)
    s.add('smoke 必須在 port 3210 跑')
    expect(s.add('smoke 必須在 port 3210 跑 ')).toBe(false)
    expect(s.add('port 3210')).toBe(false) // 被既有條目包含
  })
  test('滿 30 條 FIFO 淘汰最舊', () => {
    const f = join(dir(), 'learnings.md')
    const s = new LessonStore(f)
    for (let i = 1; i <= MAX_LESSONS; i++) s.add(`教訓${i}號內容`)
    expect(s.add('第31條')).toBe(true)
    const raw = readFileSync(f, 'utf8')
    expect(raw).not.toContain('教訓1號內容')
    expect(raw).toContain('第31條')
    expect(parseLessons(raw)).toHaveLength(MAX_LESSONS)
  })
  test('超長截斷至 200 code point、空字串回 false', () => {
    const f = join(dir(), 'learnings.md')
    const s = new LessonStore(f)
    expect(s.add('')).toBe(false)
    s.add('長'.repeat(300))
    const parsed = parseLessons(readFileSync(f, 'utf8'))
    expect([...parsed[0]!.text]).toHaveLength(200)
  })
})

describe('LessonStore.inject', () => {
  test('兩層皆空回空字串', () => {
    expect(new LessonStore(join(dir(), 'none.md')).inject()).toBe('')
  })
  test('合併全局(前綴[全局])與專案層', () => {
    const d = dir()
    const g = join(d, 'global.md'); const p = join(d, 'learnings.md')
    writeFileSync(g, '- L001 [2026-01-01] 全局教訓\n')
    const s = new LessonStore(p, g)
    s.add('專案教訓', new Date('2026-07-10T12:00:00Z'))
    const out = s.inject()
    expect(out).toContain('## 過往教訓')
    expect(out).toContain('- [全局] 全局教訓')
    expect(out).toContain('- L001 [2026-07-10] 專案教訓')
    expect(out.startsWith('## ')).toBe(true)
  })
  test('全局檔缺失不炸,只出專案層', () => {
    const d = dir()
    const s = new LessonStore(join(d, 'p.md'), join(d, 'missing-global.md'))
    s.add('專案教訓')
    expect(s.inject()).toContain('專案教訓')
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `npx vitest run tests/learn-store.test.ts ; echo EXIT=$?`
Expected: FAIL(模組不存在)。

- [ ] **Step 3: 實作 `src/learn/store.ts`**(依上方規格;date 用 `now.toISOString().slice(0,10)`;讀檔 try/catch 回 `[]`;寫檔 tmp+rename;全檔 ≤200 行)

- [ ] **Step 4: 跑測試確認通過**

Run: `npx vitest run tests/learn-store.test.ts ; echo EXIT=$?` → PASS

- [ ] **Step 5: build 硬閘 + 全測試 + LF + commit**

Run: `npm run build 2>&1 | tail -5`(tsc 零錯誤)、`npx vitest run 2>&1 | tail -4`(全綠)
Run: `python -c "print(open('src/learn/store.ts','rb').read().count(b'\r'), open('tests/learn-store.test.ts','rb').read().count(b'\r'))"` → `0 0`

```bash
git add src/learn/store.ts tests/learn-store.test.ts
git commit -m "feat(learn): LessonStore 兩層教訓庫(L 編號/硬上限 30/FIFO/去重/fail-open)"
```

---

### Task 2: reflect + LessonsPort 工廠(`src/learn/reflect.ts`)+ `RunDb.lastAttempt`

**Files:**
- Create: `src/learn/reflect.ts`
- Modify: `src/db.ts`(加一個查詢方法,~8 行)
- Test: `tests/learn-reflect.test.ts`

**Interfaces:**
- Consumes: `LessonStore`(Task 1)、`callAgent`/`LlmOpts`(`src/autopilot/llm.js`,既有)、`RunDb`/`AttemptRecord`(`src/db.js`)、`BacklogStore`(`src/backlog.js`)、`EventLog`(`src/events.js`)、`CycleResult`(`src/scheduler.js`,**用 `import type`**)。
- Produces:
  - `export interface LessonsDeps { lessons: LessonStore; db: RunDb; backlog: BacklogStore; llm: LlmOpts; events?: EventLog }`
  - `export async function reflectOnFailure(d: LessonsDeps, result: CycleResult): Promise<void>`
  - `export function makeLessonsPort(d: LessonsDeps): { inject(): string; reflect(result: CycleResult): Promise<void> }`
  - `src/db.ts` 新增:`lastAttempt(): AttemptRecord | null`(取 rowid 最大一筆;**先讀 `src/db.ts` 既有 `record()`/建表語句,欄位名照既有 schema,不要瞎猜**)

**reflect 規格:**
- `result` 為 `{kind:'blocked'}` → `taskText=result.taskText`、`context=\`blocked(${result.reason})\``,另附 `db.lastAttempt()?.detail` 尾 500 字(若有)。
- `result === 'failed'` → `db.lastAttempt()`;無紀錄或 `ok===true` 直接 return;`taskText = backlog.read().find(t => t.id === last.taskId)?.text ?? last.taskId`;`context = \`failed——最近嘗試 detail 尾段:${last.detail.slice(-500)}\``。
- 其餘 result 直接 return(不觸發)。
- prompt(單一 user message):

```
你是資深工程教練。以下是自動開發系統的一次任務失敗證據。
請提煉「一條」可泛化、對未來任務有指導性的教訓:繁體中文、單行、不超過 200 字。
不要輸出編號、日期、引號或任何多餘說明。
若證據不足以形成有價值的教訓,只輸出 NONE。

任務:<taskText>
失敗情境:<context>
```

- 呼叫 `callAgent(d.llm, prompt)`;結果 trim 後:空或 `/^NONE\b/i` → `events.append('reflect-skip', {reason:'none-or-empty'})`(quiet 包)後 return;否則取第一行 `d.lessons.add(...)`,依回傳 `events.append('lesson-added'|{...}) / ('reflect-skip', {reason:'dup-or-empty'})`。
- **整個 `reflectOnFailure` 最外層 try/catch 吞掉一切**(鐵律 #4)。

- [ ] **Step 1: 寫失敗測試** — `tests/learn-reflect.test.ts`

```ts
import { describe, test, expect } from 'vitest'
import { mkdtempSync, readFileSync, existsSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { LessonStore } from '../src/learn/store.js'
import { reflectOnFailure, makeLessonsPort, type LessonsDeps } from '../src/learn/reflect.js'
import { RunDb } from '../src/db.js'
import { BacklogStore, taskId } from '../src/backlog.js'
import type { LlmOpts } from '../src/autopilot/llm.js'

function fakeLlm(reply: string): LlmOpts {
  const fetchFn = (async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: reply } }] })
  })) as unknown as typeof fetch
  return { url: 'http://fake', model: 'm', apiKey: 'k', fetchFn }
}

function setup(reply: string) {
  const d = mkdtempSync(join(tmpdir(), 'adng-reflect-'))
  const backlogFile = join(d, 'BACKLOG.md')
  writeFileSync(backlogFile, '- [ ] 修 smoke 失敗\n')
  const db = new RunDb(join(d, 'run.db'))
  const deps: LessonsDeps = {
    lessons: new LessonStore(join(d, 'learnings.md')),
    db, backlog: new BacklogStore(backlogFile), llm: fakeLlm(reply)
  }
  return { d, db, deps, tid: taskId('修 smoke 失敗') }
}

describe('reflectOnFailure', () => {
  test("failed:從 lastAttempt 取證據,寫入一條教訓", async () => {
    const { d, db, deps, tid } = setup('smoke 要用 port 3210,3000 被佔用')
    db.record({ taskId: tid, ok: false, costUsd: 0, detail: 'verify 輸出:EADDRINUSE 3000' })
    await reflectOnFailure(deps, 'failed')
    const raw = readFileSync(join(d, 'learnings.md'), 'utf8')
    expect(raw).toContain('port 3210')
  })
  test('LLM 回 NONE 不寫檔', async () => {
    const { d, db, deps, tid } = setup('NONE')
    db.record({ taskId: tid, ok: false, costUsd: 0, detail: 'x' })
    await reflectOnFailure(deps, 'failed')
    expect(existsSync(join(d, 'learnings.md'))).toBe(false)
  })
  test('blocked:直接用 result 內的 taskText', async () => {
    const { d, deps } = setup('連敗任務先縮小重現範圍')
    await reflectOnFailure(deps, { kind: 'blocked', taskId: 'x1', taskText: '大任務', reason: 'max-attempts' })
    expect(readFileSync(join(d, 'learnings.md'), 'utf8')).toContain('縮小重現範圍')
  })
  test("idle/done 不觸發;LLM throw 不炸(fail-open)", async () => {
    const { d, db, deps, tid } = setup('無所謂')
    await reflectOnFailure(deps, 'idle')
    await reflectOnFailure(deps, 'done')
    expect(existsSync(join(d, 'learnings.md'))).toBe(false)
    db.record({ taskId: tid, ok: false, costUsd: 0, detail: 'x' })
    const boom: LlmOpts = { url: 'http://fake', model: 'm', apiKey: 'k',
      fetchFn: (async () => { throw new Error('net down') }) as unknown as typeof fetch }
    await expect(reflectOnFailure({ ...deps, llm: boom }, 'failed')).resolves.toBeUndefined()
  })
})

describe('RunDb.lastAttempt', () => {
  test('回最後一筆;空庫回 null', () => {
    const d = mkdtempSync(join(tmpdir(), 'adng-db-'))
    const db = new RunDb(join(d, 'run.db'))
    expect(db.lastAttempt()).toBeNull()
    db.record({ taskId: 'a', ok: true, costUsd: 1, detail: '第一' })
    db.record({ taskId: 'b', ok: false, costUsd: 2, detail: '第二' })
    expect(db.lastAttempt()).toMatchObject({ taskId: 'b', ok: false, detail: '第二' })
  })
})

describe('makeLessonsPort', () => {
  test('inject 轉呼 store;reflect 轉呼 reflectOnFailure', async () => {
    const { deps, db, tid } = setup('教訓文字')
    const port = makeLessonsPort(deps)
    expect(port.inject()).toBe('')
    db.record({ taskId: tid, ok: false, costUsd: 0, detail: 'x' })
    await port.reflect('failed')
    expect(port.inject()).toContain('教訓文字')
  })
})
```

- [ ] **Step 2: 跑測試確認失敗** → FAIL(reflect 模組不存在 / lastAttempt 不存在)
- [ ] **Step 3: 實作** — 先讀 `src/db.ts` 全文照既有欄位命名加 `lastAttempt()`;再寫 `src/learn/reflect.ts`(依規格;`ok` 欄位若 SQLite 存整數,`lastAttempt` 回傳前轉 boolean,鏡像既有讀取慣例)。
- [ ] **Step 4: 跑測試確認通過**
- [ ] **Step 5: build 硬閘 + 全測試 + LF(`src/learn/reflect.ts`、`src/db.ts`、測試檔 `\r`=0)+ commit**

```bash
git add src/learn/reflect.ts src/db.ts tests/learn-reflect.test.ts
git commit -m "feat(learn): 失敗驅動 reflect(LLM 提煉教訓,NONE 寧缺勿濫)+ RunDb.lastAttempt"
```

---

### Task 3: kernel 接線——config 欄位 + scheduler 注入 + cli assemble

**Files:**
- Modify: `src/types.ts`(ConfigSchema 加 2 欄)
- Modify: `src/scheduler.ts`(LessonsPort 型別 + Deps 欄位 + directive 注入)
- Modify: `src/cli.ts`(expandConfigPaths + assemble 接線)
- Test: `tests/learn-wiring.test.ts`(新)

**Interfaces:**
- Consumes: Task 2 的 `makeLessonsPort`、Task 1 的 `LessonStore`。
- Produces(Task 4/5 依賴):
  - `src/scheduler.ts`:`export interface LessonsPort { inject(): string; reflect(result: CycleResult): Promise<void> }`;`Deps` 加 `lessons?: LessonsPort`
  - `src/types.ts`:ConfigSchema 加 `learningsFile: z.string().optional()`、`globalLearningsFile: z.string().optional()`
  - `src/cli.ts` assemble:`learningsFile` 未設時預設 `join(cfg.dataDir, 'learnings.md')`;deps 帶上 `lessons: makeLessonsPort({...})`,llm 沿用 `{ url: cfg.judgeUrl, model: cfg.judgeModel, apiKey: cfg.judgeApiKey }`(鏡像 `src/autopilot/run.ts:29` 既有寫法)

**scheduler 注入(在 `src/scheduler.ts:119` directive 行之後,插 ~5 行):**

```ts
  let directive = cfg.extraDirective ? `${task.text}\n\n${cfg.extraDirective}` : undefined
  // M7:教訓注入(fail-open:inject 故障視同無教訓,絕不擋派工)
  let lessonsText = ''
  try { lessonsText = deps.lessons?.inject() ?? '' } catch { /* 教訓面故障不擋派工 */ }
  if (lessonsText) directive = `${directive ?? task.text}\n\n${lessonsText}`
```

注意:`runOnce` 目前以解構簽名 `runOnce({ cfg, store, db, engines, events, verifier }: Deps)` 取參——**改為 `runOnce(deps: Deps)` 並在函式頂部解構**(`const { cfg, store, db, engines, events, verifier } = deps`),lessons 經 `deps.lessons` 取用;全檔其餘引用不變。

**cli.ts expandConfigPaths**:`learningsFile`、`globalLearningsFile` 有值時展開(鏡像 `goalFile` 寫法)。

**cli.ts assemble(deps 建構段,`src/cli.ts:107` 前插):**

```ts
  // M7:教訓庫接線(learningsFile 有預設 → 功能零設定開啟;reflect LLM 沿用 judge 同組設定)
  const lessonStore = new LessonStore(cfg.learningsFile ?? join(cfg.dataDir, 'learnings.md'), cfg.globalLearningsFile)
  const lessons = makeLessonsPort({ lessons: lessonStore, db, backlog: store,
    llm: { url: cfg.judgeUrl, model: cfg.judgeModel, apiKey: cfg.judgeApiKey }, events })
  const deps: Deps = { cfg, store, db, engines, events, verifier, lessons }
```

- [ ] **Step 1: 寫失敗測試** — `tests/learn-wiring.test.ts`(**先讀 `tests/scheduler.test.ts` 沿用其 deps 建構模式**;下方骨架依實際 helper 調整):

```ts
import { describe, test, expect } from 'vitest'
import { ConfigSchema } from '../src/types.js'
// 沿用 tests/scheduler.test.ts 的 deps/engine stub 建構方式(先讀該檔)

describe('config learnings 欄位', () => {
  test('learningsFile/globalLearningsFile 可選、能 parse', () => {
    const cfg = ConfigSchema.parse({ projectPath: '/p', backlogFile: '/p/B.md', dataDir: '/p/d',
      engine: 'mock', learningsFile: '/p/d/learnings.md', globalLearningsFile: '/g.md' })
    expect(cfg.learningsFile).toBe('/p/d/learnings.md')
    expect(cfg.globalLearningsFile).toBe('/g.md')
  })
})

describe('scheduler 教訓注入', () => {
  test('lessons.inject 有內容時附進 job.directive', async () => {
    // 建 deps(真 BacklogStore/RunDb/EventLog + tmp 目錄 + stub engine 捕捉 job)
    // deps.lessons = { inject: () => '## 過往教訓(遵守,避免重蹈)\n- L001 [2026-07-10] 教訓甲', reflect: async () => {} }
    // await runOnce(deps)
    // expect(捕捉到的 job.directive).toContain('教訓甲')
    // expect(捕捉到的 job.directive).toContain(task 原文)
  })
  test('inject throw 時派工照常、directive 不含教訓(fail-open)', async () => {
    // deps.lessons = { inject: () => { throw new Error('boom') }, reflect: async () => {} }
    // await runOnce(deps) 正常回 'done'/'failed',不 throw
  })
  test('未接 lessons 時行為與現狀完全一致(directive 僅 extraDirective 語意)', async () => {
    // 不設 deps.lessons,驗證 directive === undefined(無 extraDirective 時)
  })
})
```

(Step 1 註解骨架**必須落成真代碼**——實作者讀完 `tests/scheduler.test.ts` 後補實,三個測試都要真跑。)

- [ ] **Step 2: 跑測試確認失敗**(config 欄位不存在 → parse 掉欄位/型別錯)
- [ ] **Step 3: 實作**(types.ts 2 行、scheduler.ts ~9 行、cli.ts ~7 行,依上方片段)
- [ ] **Step 4: 跑測試確認通過**
- [ ] **Step 5: kernel 帳硬閘**

Run: `wc -l src/*.ts | tail -1` → total ≤2500(預期 ~2470)。超了就地精簡註解,不許砍功能。

- [ ] **Step 6: build 硬閘 + 全測試 + LF + commit**

```bash
git add src/types.ts src/scheduler.ts src/cli.ts tests/learn-wiring.test.ts
git commit -m "feat(learn): kernel 接線——config 欄位/scheduler 教訓注入/assemble 建 LessonsPort"
```

---

### Task 4: daemon 失敗觸發 reflect + 端到端整合測試

**Files:**
- Modify: `src/daemon.ts`(~5 行)
- Test: `tests/learn-integration.test.ts`(新)

**Interfaces:**
- Consumes: Task 3 的 `Deps.lessons`(`LessonsPort`)。
- Produces: daemon 行為——cycle 結果為 `'failed'` 或 `{kind:'blocked'}` 時呼 `deps.lessons.reflect(result)`(fail-open)。

**daemon 掛鉤(`src/daemon.ts` 主迴圈,`consecutiveCrashes = 0` 之後、alert 區塊之後插):**

```ts
      // M7:失敗驅動 reflect——教訓面故障吞掉,絕不反殺主迴圈(鐵律 #4)
      if (deps.lessons && (result === 'failed' || typeof result === 'object')) {
        try { await deps.lessons.reflect(result) } catch { /* fail-open */ }
      }
```

- [ ] **Step 1: 寫失敗測試** — `tests/learn-integration.test.ts`(**先讀 `tests/daemon.test.ts` 沿用 `baseOpts()`/FakeNotifier/fakeSleep 模式**):

```ts
// 測試 1(daemon 觸發):stub lessons 記錄 reflect 呼叫;engine 恆敗 → runDaemon maxCycles=1
//   → expect(reflectCalls).toEqual(['failed']) (或 blocked 物件,依 stub engine 行為)
// 測試 2(reflect throw 不反殺):lessons.reflect = async () => { throw new Error('boom') }
//   → runDaemon maxCycles=2 正常回 'max-cycles',不 throw
// 測試 3(端到端閉環,本 plan 核心驗收):
//   真 LessonStore + makeLessonsPort(fake llm 回「教訓X:先跑 baseline」) + 恆敗 stub engine
//   cycle 1:失敗 → learnings.md 長出 L001 教訓X
//   cycle 2:stub engine 捕捉 job.directive → expect(directive).toContain('教訓X')
//   (runDaemon maxCycles=2;backlog 兩條任務確保第二輪有任務可派)
```

(同 Task 3:骨架必須落成真代碼,三個測試真跑。)

- [ ] **Step 2: 跑測試確認失敗**(daemon 尚無掛鉤,reflectCalls 空)
- [ ] **Step 3: 實作**(daemon.ts 插上方 4 行)
- [ ] **Step 4: 跑測試確認通過**
- [ ] **Step 5: kernel 帳(≤2500)+ build 硬閘 + 全測試 + LF + commit**

```bash
git add src/daemon.ts tests/learn-integration.test.ts
git commit -m "feat(learn): daemon 失敗驅動 reflect 掛鉤 + 教訓閉環端到端整合測試"
```

---

### Task 5: autopilot planner 注入教訓

**Files:**
- Modify: `src/autopilot/planner.ts`(PlanInput 加欄位 + prompt 附教訓)
- Modify: `src/autopilot/run.ts`(session 開始時讀一次 `deps.lessons?.inject()` 傳入)
- Modify: `src/autopilot/orchestrator.ts`(僅在需要傳遞欄位時最小改動)
- Test: `tests/autopilot-planner.test.ts`(加 test)

**Interfaces:**
- Consumes: Task 3 的 `Deps.lessons`。
- Produces: `PlanInput` 加 `lessonsText?: string`;planner prompt 在目標段落後附 `\n\n<lessonsText>`(空/未設時 prompt 與現狀完全一致——**位元級不變**,既有測試不得改)。

- [ ] **Step 1: 先讀** `src/autopilot/planner.ts`、`run.ts`、`orchestrator.ts` 與 `tests/autopilot-planner.test.ts` 全文。
- [ ] **Step 2: 寫失敗測試**(加進 `tests/autopilot-planner.test.ts`):`lessonsText` 有值時,傳給 llm 的 prompt 包含教訓文字;未設時 prompt 與既有 snapshot/斷言一致。
- [ ] **Step 3: 跑測試確認失敗** → **Step 4: 實作**(planner ~3 行、run/orchestrator 傳遞 ~4 行;`src/autopilot/*.ts` 各檔仍 ≤200 行) → **Step 5: 跑測試確認通過**
- [ ] **Step 6: build 硬閘 + 全測試 + LF + commit**

```bash
git add src/autopilot/planner.ts src/autopilot/run.ts src/autopilot/orchestrator.ts tests/autopilot-planner.test.ts
git commit -m "feat(autopilot): planner prompt 注入教訓庫(GOAL 模式也吃過往教訓)"
```

---

### Task 6(M7.5): daemon OOM 閘 + idle 要任務通知

**Files:**
- Modify: `src/daemon.ts`(~13 行)
- Test: `tests/daemon-m75.test.ts`(新)

**Interfaces:**
- Consumes: daemon 既有 `sendCooldownAlert`/冷卻閘 infra。
- Produces: `DaemonOpts` 加 `memFreeRatioFn?: () => number`(測試注入;生產預設 `os.freemem()/os.totalmem()`)。

**實作(daemon.ts):**

```ts
import { freemem, totalmem } from 'node:os'   // 檔頂 import
const OOM_FREE_RATIO = 0.15                    // 常數區

// 主迴圈內、checkAndSendDigest 之後、runOnce 之前:
      // M7.5:OOM 閘——可用記憶體 <15% 跳過本輪派工(舊系統教訓:高壓下 spawn 只會雪崩)
      const memFree = opts.memFreeRatioFn ?? (() => freemem() / totalmem())
      if (memFree() < OOM_FREE_RATIO) {
        await sendCooldownAlert(notifier, deps.cfg.dataDir, cooldownTable,
          'oom-gate', 'daemon 告警:記憶體可用 <15%,本輪跳過派工')
        await sleep(idleSleepMs)
        continue
      }

// result 處理區、既有 idle sleep 判斷之前:
      // M7.5:idle 要任務通知(6h 冷卻=持續 idle 每 6h 至多提醒一次,不洗版)
      if (result === 'idle') {
        await sendCooldownAlert(notifier, deps.cfg.dataDir, cooldownTable,
          'idle', 'daemon 提醒:backlog 已耗盡,請補任務')
      }
```

- [ ] **Step 1: 寫失敗測試** — `tests/daemon-m75.test.ts`(沿用 `tests/daemon.test.ts` 模式):
  1. `memFreeRatioFn: () => 0.10` + maxCycles=2 → engine 從未被呼叫、notifier 收到 oom-gate 告警(6h 冷卻:兩輪只發一次)、sleep 收到 idleSleepMs
  2. `memFreeRatioFn: () => 0.50` → 正常派工(engine 有被呼叫)
  3. backlog 空 → result idle → notifier 收到「backlog 已耗盡」;連兩輪 idle 只發一次(冷卻)
- [ ] **Step 2: 確認失敗** → **Step 3: 實作** → **Step 4: 確認通過**
- [ ] **Step 5: kernel 帳(≤2500)+ build 硬閘 + 全測試 + LF + commit**

```bash
git add src/daemon.ts tests/daemon-m75.test.ts
git commit -m "feat(daemon): M7.5 OOM 閘(可用記憶體<15% 跳輪)+ idle 要任務通知(6h 冷卻)"
```

---

## Acceptance(控制者收尾,不派 subagent)

- `npm run build` tsc 零錯誤;`npx vitest run` 全綠(431 + 新增)。
- `wc -l src/*.ts` total ≤2500(控制者親跑,不信 subagent 自報);`src/learn/*.ts`、`src/autopilot/*.ts` 各檔 ≤200。
- 沙盒閉環(temp repo + 真 ProxyPilot LLM):一條必敗任務跑 2 cycle → `learnings.md` 長出一條非水教訓、第 2 輪 directive 含該教訓(證據貼輸出)。
- SDD 雙判定審查每 task Approved;opus 全分支審查;merge --no-ff 回 main(本地不 push)。

## 明確不做(YAGNI)

- 不自動寫全局層;不做相關性檢索;不做教訓權重/衰減;不動 M8(另 plan)。
