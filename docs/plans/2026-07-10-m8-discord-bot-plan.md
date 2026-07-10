# M8 雙向 Discord bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 獨立進程的 Discord slash-command bot:查詢(/status /cost /backlog /log)+ 軟控制(/pause /resume /silence /task)+ /ask 對話 LLM,與 daemon 零共享記憶體、只走檔案/DB 溝通。

**Architecture:** 全部在 `src/bot/`(不計 kernel 帳,各檔 ≤200 行)。bot 用**自己的 zod schema 讀同一份 config JSON**(kernel ConfigSchema 對未知 key 是 strip,互不干擾)→ 核心 deps 經既有 `assemble()` 取得。**唯一 kernel 改動:daemon.ts 的 silence 閘 ~4 行**(kernel 帳 2494/2500,硬上限)。設計正本:`docs/plans/2026-07-10-legacy-port-design.md` M8 章節。

**Tech Stack:** TypeScript / Node / vitest / discord.js v14(僅 `src/bot/index.ts` import,handlers 全部純函式不碰 discord.js)。

## Global Constraints

- **kernel 帳**:`wc -l src/*.ts`(非遞迴)≤2500(目前 2494,**M8 全程只允許 daemon.ts 的 silence 閘,淨增 ≤6 行**;不夠就地精簡 daemon.ts 既有註解,不砍功能)。`src/bot/*.ts` 各檔 ≤200 行。
- **安全(不可違反)**:bot token 只從環境變數 `ADNG_BOT_TOKEN` 或 botTokenFile 讀,**永不落 log/DLQ/錯誤訊息/測試檔/commit**;測試**絕不打真 Discord API**(discord.js 不在任何測試 import 鏈);allowlist 空 = 拒絕所有人。
- **鐵律 #4 fail-open**:bot 面任何故障不得影響 daemon;silence 檔損壞視同未靜音(告警照發);**digest 每日必達不受 silence 影響**。
- **鐵律 #1**:/task 寫入的是**使用者任務**(純 `- [ ] text` 行,無 autopilot 註記)。
- 每 task 收尾:`npm run build`(tsc 零錯誤)+ `npx vitest run` 全綠(461+新增;tests/daemon.test.ts ③ 為已知 pre-existing 負載 flaky,隔離綠即可)。LF;conventional commit;禁止 git reset/checkout/clean/gc/switch。
- 實作前先讀要改的檔與相鄰測試,沿用既有模式(tmp 目錄+真實類別;fetchFn 注入)。

---

### Task 1: bot 設定與 token(`src/bot/config.ts`)

**Files:**
- Create: `src/bot/config.ts`
- Test: `tests/bot-config.test.ts`

**Interfaces:**
- Produces(後續 task 依賴,一字不差):
  - `export interface BotConfig { allowedUserIds: string[]; guildId?: string; botTokenFile?: string }`
  - `export function loadBotConfig(cfgPath: string): BotConfig` — 讀同一份 config JSON 的 `botAllowedUserIds`(string[],缺省 `[]`)、`botGuildId?`、`botTokenFile?`(相對路徑以 config 檔所在目錄 resolve,鏡像 cli.ts expandPath);JSON 損壞/缺檔回 `{ allowedUserIds: [] }`(fail-closed:空名單=拒絕所有人)
  - `export function loadBotToken(botTokenFile?: string): string | null` — 優先 `process.env.ADNG_BOT_TOKEN`(非空);否則讀 botTokenFile 逐行 regex `/^(?:set\s+|export\s+)?ADNG_BOT_TOKEN=(.*)$/i`(鏡像 src/notify.ts loadDiscordToken 的解析與去引號,先讀該檔 27-43 行);皆無回 null。**回傳值與錯誤路徑都不得把 token 內容寫進任何 log/throw message**

- [ ] **Step 1: 寫失敗測試** — `tests/bot-config.test.ts`

```ts
import { describe, test, expect, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadBotConfig, loadBotToken } from '../src/bot/config.js'

const savedEnv = process.env.ADNG_BOT_TOKEN
afterEach(() => {
  if (savedEnv === undefined) delete process.env.ADNG_BOT_TOKEN
  else process.env.ADNG_BOT_TOKEN = savedEnv
})

function dir(): string { return mkdtempSync(join(tmpdir(), 'adng-botcfg-')) }

describe('loadBotConfig', () => {
  test('讀 botAllowedUserIds/botGuildId/botTokenFile(相對路徑以 config 目錄 resolve)', () => {
    const d = dir()
    const p = join(d, 'config.json')
    writeFileSync(p, JSON.stringify({
      projectPath: './p', backlogFile: './p/B.md', dataDir: './data', engine: 'mock',
      botAllowedUserIds: ['111', '222'], botGuildId: 'g1', botTokenFile: './bot.env'
    }))
    const c = loadBotConfig(p)
    expect(c.allowedUserIds).toEqual(['111', '222'])
    expect(c.guildId).toBe('g1')
    expect(c.botTokenFile).toBe(join(d, 'bot.env'))
  })
  test('缺欄位 → allowedUserIds 空陣列(fail-closed);JSON 損壞不炸', () => {
    const d = dir()
    const p = join(d, 'config.json')
    writeFileSync(p, '{"dataDir":"./data"}')
    expect(loadBotConfig(p).allowedUserIds).toEqual([])
    writeFileSync(p, '{broken')
    expect(loadBotConfig(p).allowedUserIds).toEqual([])
  })
})

describe('loadBotToken', () => {
  test('env ADNG_BOT_TOKEN 優先', () => {
    process.env.ADNG_BOT_TOKEN = 'env-tok'
    expect(loadBotToken(undefined)).toBe('env-tok')
  })
  test('無 env 時讀檔(支援 set/export 前綴與引號)', () => {
    delete process.env.ADNG_BOT_TOKEN
    const f = join(dir(), 'bot.env')
    writeFileSync(f, '# comment\nset ADNG_BOT_TOKEN="file-tok"\n')
    expect(loadBotToken(f)).toBe('file-tok')
  })
  test('皆無 → null;檔案缺失不炸', () => {
    delete process.env.ADNG_BOT_TOKEN
    expect(loadBotToken(join(dir(), 'missing.env'))).toBeNull()
    expect(loadBotToken(undefined)).toBeNull()
  })
})
```

- [ ] **Step 2: 跑測試確認失敗** — `npx vitest run tests/bot-config.test.ts` → FAIL(模組不存在)
- [ ] **Step 3: 實作 `src/bot/config.ts`**(≤200 行;讀檔全 try/catch;不 import kernel 的 ConfigSchema——bot 只挑自己的欄位)
- [ ] **Step 4: 跑測試確認通過**
- [ ] **Step 5: build + 全測試 + LF + commit**

```bash
git add src/bot/config.ts tests/bot-config.test.ts
git commit -m "feat(bot): bot 設定載入(allowlist fail-closed)+ token 載入(env 優先,永不外洩)"
```

---

### Task 2: silence 機制(`src/bot/silence.ts` + daemon 閘)

**Files:**
- Create: `src/bot/silence.ts`
- Modify: `src/daemon.ts`(**唯一 kernel 改動,淨增 ≤6 行**)
- Test: `tests/bot-silence.test.ts`

**Interfaces:**
- Produces:
  - `export function setSilence(dataDir: string, minutes: number, now?: Date): string` — 寫 `${dataDir}/silence.json` = `{"untilIso": "..."}`(tmp+rename),回 untilIso
  - `export function clearSilence(dataDir: string): void` — 刪檔(缺檔不炸)
  - `export function isSilenced(dataDir: string, now?: Date): boolean` — untilIso > now;檔缺/損壞/過期 → false(fail-open 方向=照發告警)
- daemon 掛鉤:`sendCooldownAlert` 開頭加(import 一行 + 守衛;**checkAndSendDigest 不經 sendCooldownAlert,天然不受影響——digest 必達不變**):

```ts
  if (isSilenced(dataDir)) return // bot /silence 靜音窗:告警靜默(digest 不走此路,鐵律 #6 不受影響)
```

- [ ] **Step 1: 寫失敗測試** — `tests/bot-silence.test.ts`:
  1. `setSilence` 後 `isSilenced` true;過期(now 注入超過 untilIso)→ false;`clearSilence` 後 false;silence.json 寫壞字串 → false 不炸
  2. daemon 整合(沿用 tests/daemon-m75.test.ts 模式,先讀):backlog 空 + 已 `setSilence(dataDir, 60)` → runDaemon maxCycles=2,notifier **收不到** idle 告警;`clearSilence` 後重跑 → 收得到。再驗 digest:silence 中 digest 照送(用 daemon.test.ts 既有 digest 測法為參考,斷言 sent 內含 digest 文字)
- [ ] **Step 2: 確認失敗** → **Step 3: 實作**(silence.ts ≤200 行;daemon.ts 淨增 ≤6 行,`wc -l src/*.ts | tail -1` ≤2500 貼實測) → **Step 4: 確認通過**
- [ ] **Step 5: build + 全測試 + LF + commit**

```bash
git add src/bot/silence.ts src/daemon.ts tests/bot-silence.test.ts
git commit -m "feat(bot): silence 靜音窗(告警靜默/digest 必達不受影響)+ daemon 閘接線"
```

---

### Task 3: 指令 handlers(純函式,不碰 discord.js)

**Files:**
- Create: `src/bot/handlers.ts`(查詢:status/cost/backlog/log)
- Create: `src/bot/actions.ts`(控制:pause/resume/silence/task/ask + appendUserTask)
- Test: `tests/bot-handlers.test.ts`、`tests/bot-actions.test.ts`

**Interfaces:**
- Consumes: `assemble()` 的 `{ deps, cfg }`(store/db/events/cfg)、Task 2 的 setSilence/clearSilence/isSilenced、`callAgent`/`LlmOpts`(src/autopilot/llm.js)。
- Produces(Task 4 依賴,一字不差):
  - `export interface BotDeps { cfg: Config; store: BacklogStore; db: RunDb; llm: LlmOpts }`(Config/BacklogStore/RunDb 型別 import 自 kernel;llm 由呼叫端用 cfg.judge* 組)
  - `export async function handleCommand(name: string, arg: string, d: BotDeps): Promise<string>` — 統一路由(唯一入口);未知指令回「未知指令」文字;**每個 handler 全 try/catch,錯誤回人話文字,永不 throw、永不外洩 token**
- 各指令行為:
  - `status`:讀 `${dataDir}/heartbeat.json`(state/currentTask/todayCostUsd)+ `${dataDir}/daemon.lock/pid.json` 是否 alive(`process.kill(pid,0)` try/catch,鏡像 src/lock.ts checkLockOwner 慣例,先讀)+ stopFile 存在(「已暫停」)+ isSilenced(「靜音中」)
  - `cost`:`db.costForLocalDay(今日)` + `dayStats(今日)` + 昨日一行(localDay/yesterdayLocal 既有 helper,import 自 kernel)
  - `backlog`:`store.read()` 統計 open/done/blocked 數 + 前 5 條 open 任務文字
  - `log`:讀 `${dataDir}/events.jsonl` 尾 10 行(自讀檔,無現成方法),每行取 `type`+`ts` 摘要
  - `pause`:`writeFileSync(cfg.stopFile, 'bot /pause\n')` → 回「已寫入 stop 檔,daemon 將優雅停」;`resume`:刪 stopFile(缺檔也回成功文字)
  - `silence <分鐘>`:parseInt 驗證(1..1440,非法回用法說明)→ setSilence → 回至何時;`silence 0` → clearSilence
  - `task <文字>`:非空驗證 → `appendUserTask(cfg.backlogFile, text)`(actions.ts 內部函式:read 現檔、確保結尾換行、append `- [ ] ${text}\n`——**無 autopilot 註記**,parseBacklog 讀回即 source:'user')→ 回「已加入 backlog」
  - `ask <問題>`:`callAgent(d.llm, 問題)`(fail-open 回空 → 回「LLM 未回應」);回覆截 1900 字(Discord 上限鏡像 notify.ts:82)
- 回覆一律繁中、單訊息、≤1900 字。

- [ ] **Step 1: 寫失敗測試**(兩檔;沿用 tests/learn-integration.test.ts 的 tmp git repo + ConfigSchema.parse 建 cfg 模式與 tests/learn-reflect.test.ts 的 fakeLlm,先讀兩檔):每指令至少 1 正向 + 1 錯誤路徑;重點斷言——`task` 寫入後 `store.read()` 回 source:'user' 且文字正確;`pause` 後 stopFile 存在;`silence 30` 後 isSilenced true;`ask` 用 fakeLlm 回固定字;`status` 在無 heartbeat 檔時回人話不炸;未知指令回「未知指令」;handler 內部 throw(如 db 檔鎖)不外拋
- [ ] **Step 2: 確認失敗** → **Step 3: 實作**(兩檔各 ≤200 行) → **Step 4: 確認通過**
- [ ] **Step 5: build + 全測試 + LF + kernel 帳不變(2494+Task2 增量,貼實測)+ commit**

```bash
git add src/bot/handlers.ts src/bot/actions.ts tests/bot-handlers.test.ts tests/bot-actions.test.ts
git commit -m "feat(bot): 九個指令 handlers 純函式(查詢/軟控制//ask,fail-open,/task 寫 user 行)"
```

---

### Task 4: gateway 接線(`src/bot/index.ts`)+ discord.js 依賴

**Files:**
- Create: `src/bot/index.ts`
- Modify: `package.json`(dependencies 加 discord.js ^14;`npm install discord.js` 實跑)
- Test: `tests/bot-route.test.ts`

**Interfaces:**
- Consumes: Task 1-3 全部 + `assemble`(src/cli.js)+ `acquireLock/releaseLock`(src/lock.js)。
- Produces:
  - `export interface InteractionLike { commandName: string; userId: string; arg: string; reply(text: string, ephemeral?: boolean): Promise<void> }`
  - `export async function routeInteraction(i: InteractionLike, allowed: string[], d: BotDeps): Promise<void>` — **純路由,不 import discord.js**:userId 不在 allowed(或 allowed 空)→ `i.reply('未授權', true)`;否則 `handleCommand` 結果 reply;handleCommand 已不 throw,route 再包一層 try/catch 回「內部錯誤」
  - `main(cfgPath)`:loadBotConfig+loadBotToken(null → console.error 一句人話後 process.exit(1),**不印 token 相關細節**)→ `assemble` 取 deps → `acquireLock(join(dataDir,'bot.lock'))`(false → exit(1),避免雙 bot)→ 建 discord.js Client(GatewayIntentBits.Guilds)→ ready 時對 guildId(有值)或全域註冊 9 個 slash commands → interactionCreate 轉成 InteractionLike 丟 routeInteraction → SIGINT/SIGTERM releaseLock。
  - 進程守衛鏡像 src/autopilot/run.ts:50-53(`--config` 旗標,先讀該檔)。
- **discord.js 只出現在 index.ts**;tests/bot-route.test.ts 只測 routeInteraction(fake InteractionLike 物件),**絕不 import index.ts**(避免載入 discord.js/連線)。真 Discord 上線驗證不在本 plan(等使用者提供 token,屆時人工煙測)。

- [ ] **Step 1: 寫失敗測試** — `tests/bot-route.test.ts`(routeInteraction 從 `../src/bot/route.js` import——見下)  
  設計修正:為了讓測試不碰 discord.js,`routeInteraction`+`InteractionLike` 放 **`src/bot/route.ts`**(純),`index.ts` 只做 discord.js 接線並 import route。測試:(1) 白名單外 → reply('未授權', ephemeral=true) 且 handleCommand 未被呼叫(注入 spy BotDeps 驗 db 未動即可,或 stub handleCommand——route 以參數注入 `handle: typeof handleCommand` 預設真品,測試注入 spy);(2) 白名單內 → reply 收到 handleCommand 回傳文字;(3) handle throw → reply('內部錯誤')不外拋;(4) allowed 空陣列 → 一律未授權
- [ ] **Step 2: 確認失敗** → **Step 3: 實作**(route.ts + index.ts 各 ≤200 行;`npm install discord.js` 後 package.json/package-lock.json 一併 commit) → **Step 4: 確認通過**
- [ ] **Step 5: build + 全測試 + LF + kernel 帳(≤2500)+ commit**

```bash
git add src/bot/route.ts src/bot/index.ts tests/bot-route.test.ts package.json package-lock.json
git commit -m "feat(bot): discord.js gateway 接線(獨立進程/own lock/allowlist)+ 純路由層"
```

---

## Acceptance(控制者收尾)

- build 零錯誤;全套測試綠(461+新增;已知 flaky 隔離綠即可);kernel 帳 ≤2500 親跑;src/bot/*.ts 各 ≤200。
- mock 煙測(控制者親跑,node 腳本):routeInteraction 全鏈——fake interaction `/status`(tmp 專案有 heartbeat)回狀態文字;`/task` 後 BACKLOG.md 出現 user 行;`/silence 30` 後 daemon(maxCycles 短跑)idle 告警被吞、digest 照送。
- **真 Discord 上線:未驗證**(等使用者建 bot 提供 ADNG_BOT_TOKEN;上線步驟寫入 report:建 Application→Bot→token→invite URL scope=applications.commands+bot→config 填 botAllowedUserIds/botGuildId)。
- SDD 雙判定審查每 task;opus 全分支審;merge --no-ff main(不 push);ledger。

## 明確不做(YAGNI)

- 不做 /restart 殺進程;不做多 guild;不做訊息歷史/對話記憶;不做 bot 端 DLQ(回覆失敗即失敗,discord.js 自身重連);不動 notify.ts;不做 schtasks 排程註冊(上線時再說)。
