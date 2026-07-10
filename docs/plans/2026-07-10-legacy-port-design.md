# 舊 auto-dev 優點移植 Design(M7 / M7.5 / M8)

日期:2026-07-10。狀態:已核可(方案 A 外掛+微掛鉤;使用者授權 loop 模式代決剩餘細節)。

## 背景

對舊系統 `D:\Users\Administrator\Desktop\auto-dev`(bash 13k+ 行、154 輪成功率 28%、watchdog 重啟 ~1 萬次)做了雙 subagent 掃描(功能架構 + 營運教訓)。缺口分析結論:六項優點中四項 autodev-ng 已覆蓋(single-instance lock、daily-digest 含 DLQ 計數、watchdog 自癒大半、idle 不燒錢語義、worktree 隔離、反 Goodhart evaluator),真正缺口三塊:

1. **M7 經驗回饋閉環**(舊系統最有價值資產:learnings/global.md L 編號教訓庫 + reflect 讀寫)
2. **M7.5 小補丁包**(OOM 閘 + idle 要任務通知)
3. **M8 雙向 Discord bot**(現只有單向 webhook)

## 使用者決策(brainstorming 已確認)

| 決策點 | 選擇 |
|---|---|
| 範圍順序 | 全做:M7 閉環 → M7.5 補丁 → M8 bot |
| 教訓庫範圍 | 兩層:專案層 + 全局層,注入時合併 |
| reflect 時機 | 只在失敗時寫(成功輪零額外成本;反 Goodhart 不為寫而寫) |
| 注入方式 | 全文注入 + 硬上限(各層 30 條/單條 ≤200 字,滿了 FIFO) |
| bot 指令範圍 | 全套:唯讀 + 軟控制 + /ask + /task |
| bot 身分 | 新建專用 bot(與 openab LPBOT 完全隔離) |
| 整體架構 | 方案 A:外掛子目錄 + 微掛鉤(kernel 帳 2427/2500,餘裕 73 行) |

## 全域約束(所有里程碑)

- **kernel 帳**:`wc -l src/*.ts`(非遞迴)≤2500;新功能一律進 `src/learn/`、`src/bot/` 子目錄(不計帳),各檔 ≤200 行。kernel 只留微掛鉤。
- **鐵律 #4 fail-open**:learn/bot/通知面任何故障絕不反殺 24/7 主迴圈。
- **反 Goodhart**(舊系統最大教訓):教訓寧缺勿濫(LLM 可輸出 NONE);self-report 不覆蓋 sensor;自我維護動作不進任何 KPI 分子。
- **每 task 收尾必跑 `npm run build`(tsc 零錯誤)+ `npx vitest run` 全綠**;LF 換行;conventional commit;SDD 雙判定審查;每里程碑 opus 全分支審查後 merge --no-ff 回 main(本地,不 push)。
- **安全**:任何 token/key 永不落 src/測試/log/commit;測試絕不打真 Discord API;絕不碰 voice-actress(除 BACKLOG-adng.md);殺進程雙鍵匹配、不盲殺。

---

## M7 經驗回饋閉環

### 檔案

```
src/learn/store.ts     LessonStore:兩層教訓檔讀寫、L 編號、硬上限、去重
src/learn/reflect.ts   失敗證據 → LLM 提煉一條教訓 → 寫入專案層(fail-open)
tests/learn-store.test.ts / tests/learn-reflect.test.ts / tests/learn-integration.test.ts
```

### 教訓檔格式(markdown,人可直接編輯)

```markdown
# Learnings
- L001 [2026-07-10] smoke test 必須在 port 3210 跑,3000 被佔用
```

- 專案層:`cfg.learningsFile`(預設 `<dataDir>/learnings.md`),**自動寫**(reflect 產出)。
- 全局層:`cfg.globalLearningsFile?`(選配),**只讀不自動寫**——晉升教訓到全局由人做(舊系統掃描結論:人工策展的才有用;自動寫全局必膨脹污染)。
- L 編號:取現有最大編號 +1;檔案缺失/損壞視同空庫(fail-open)。
- 硬上限:每層 30 條、單條 ≤200 字(超長截斷)。專案層滿 30 條時 FIFO 淘汰最舊一條再寫。
- 去重:新教訓與既有任一條的正規化文字(去空白)互為包含 → 跳過不寫。

### reflect(只在失敗時)

- 觸發:cycle 結果 `'failed'` 或 `{kind:'blocked'}`(`'engine-error'`/`'preflight-failed'` 是 infra 噪音,不觸發)。
- 證據:從 RunDb 取該任務最近一次 attempt(敗因、verify 輸出尾段、attempt 數)+ 任務文字。
- LLM:複用 `src/autopilot/llm.ts` 的 `callAgent`(ProxyPilot,與 autopilot 同款 fail-open:任何故障回空字串)。模型/端點沿用 judge 同組設定,不新增設定維度。
- prompt 契約:「提煉一條可泛化、對未來任務有指導性的教訓,≤200 字;證據不足以形成教訓輸出 NONE」。回 NONE、空、或超時 → 不寫,寧缺勿濫。
- reflect 全程包 try/catch,任何失敗靜默(events 記一筆 `reflect-skip` 供觀測,quiet 包裹)。

### 注入

- **派工 prompt**:scheduler 組 `job.directive` 時(`extraDirective` 既有機制後)附:
  `\n\n## 過往教訓(遵守,避免重蹈)\n<兩層合併全文>`。兩層皆空 → 不附任何字(prompt 零污染)。
- **autopilot planner**:`src/autopilot/planner.ts` 的 plan prompt 同樣附上(零 kernel)。

### kernel 掛鉤(預算 ~15 行)

1. `types.ts`:ConfigSchema 加 `learningsFile?`、`globalLearningsFile?`(cli.ts `expandConfigPaths` 同步展開)。
2. `scheduler.ts`:`Deps` 加 optional `lessons?: LessonsPort`;組 directive 處一行注入(quiet 包裹)。
   `interface LessonsPort { inject(): string; reflect(result: CycleResult): Promise<void> }`(型別定義放 learn 子目錄,Deps 引用)。
3. `daemon.ts`:cycle 結束後 `failed/blocked` 時 `await` reflect(自身 fail-open,daemon 再包一層防呆)。
4. `cli.ts` assemble:接線 LessonStore(learningsFile 有預設值 → 功能預設開啟,零設定)。

### 驗收

- 單元:store(L 編號/cap FIFO/去重/損壞容錯)、reflect(fake llm:正常/NONE/throw 三路)。
- 整合:fake engine 失敗 → reflect 被呼叫 → 教訓落檔;下一輪 directive 含該教訓。
- 沙盒閉環(temp repo,真 ProxyPilot LLM):跑一次失敗任務,實際看到 learnings.md 長出一條非水教訓。

---

## M7.5 小補丁包(全在 daemon.ts,預算 ~13 行)

1. **OOM 閘**:每輪 runOnce 前 `os.freemem()/os.totalmem() < 0.15` → 跳過本輪、睡 idleSleepMs、冷卻閘告警(key `oom-gate`)。閾值硬編(鐵律 #8 精神:不膨脹設定維度)。
2. **idle 要任務通知**:結果 `idle` → 冷卻閘告警(key `idle`,文案「backlog 已耗盡,請補任務」)。現有 6h 冷卻 = 持續 idle 每 6h 提醒一次,不洗版。
- 驗收:單元測 OOM 閘(注入假 memFn)+ idle 告警走冷卻閘;既有 daemon 測試全綠。

---

## M8 雙向 Discord bot

### 架構

- `src/bot/` 子目錄,**獨立進程**(entry:`node dist/bot/main.js <config>`),與 daemon 零共享記憶體,溝通只走檔案/DB:

| 指令 | 實現 | 面向 |
|---|---|---|
| /status | 讀 heartbeat(events)+ daemon lock 存在性 | 唯讀 |
| /cost | RunDb 今日/昨日成本 | 唯讀 |
| /backlog | BacklogStore 統計 + 前 N 條未完成 | 唯讀 |
| /log | events log 尾 N 行 | 唯讀 |
| /pause | 寫 cfg.stopFile(優雅停;daemon 既有語義) | 軟控制 |
| /resume | 刪 cfg.stopFile | 軟控制 |
| /silence <分> | 寫 silence 旗標檔(含到期時間) | 軟控制 |
| /task <文字> | BacklogStore.append(使用者經 bot 出的任務=user 任務,鐵律 #1 合規) | 軟控制 |
| /ask <問題> | callAgent(ProxyPilot)回答,截 2000 字(Discord 上限) | LLM |

- **不做 /restart 殺進程**(安全約束:不盲殺;/pause+respawn 排程即可達成同效)。
- bot 自己一把 lock(`acquireLock(botLockDir)`),schtasks respawn 與 daemon 同模式。

### silence 的 daemon 側掛鉤(kernel ~5 行)

- daemon 發告警前查 silence 旗標檔(未到期 → 抑制,計入冷卻表 suppressedCount 語意之外單獨吞掉)。
- **digest 每日必達(鐵律 #6)不受 silence 影響**。

### token 與安全

- token 來源:環境變數 `ADNG_DISCORD_BOT_TOKEN`,或 config `botTokenFile?` 指向 env 檔(擇一,讀取優先 env var)。**永不落 log/DLQ/錯誤訊息/commit**。
- 權限:config `botAllowedUserIds: string[]`,白名單外的互動一律 ephemeral 拒絕。
- 依賴:discord.js v14(bot 專用;kernel 不 import 它——bot 子目錄隔離)。
- 測試:client/interaction 全 mock,指令 handler 寫成純函式(注入 deps),**絕不打真 Discord API**。
- 真 token 接線:使用者到 Discord Developer Portal 新建專用 bot 後提供;工程先以 mock 完成。

### 驗收

- 每個指令 handler 單元測試(fake deps);白名單拒絕測試;silence 到期語義測試。
- daemon silence 掛鉤:單元測(旗標檔存在 → 告警吞掉;digest 照發)。
- 煙測:mock client 走一輪 interaction dispatch。真 Discord 上線驗證留待 token 到位(標註「未驗證:真線上」)。

---

## 交付順序與節奏

M7 → M7.5 → M8,每個走完整 SDD:writing-plans 拆 task → subagent 逐 task 實作(TDD)→ 雙判定審查 → 修 → opus 全分支審查 → merge --no-ff main(本地不 push)→ ledger 記錄。M7.5 極小,可與 M7 同分支不同 task 群交付(合併為一個 plan、兩個 task 群),M8 獨立分支。

## 明確不做(YAGNI)

- 不自動寫全局教訓層;不做教訓相關性檢索(全文注入夠用);不做跨 session 告警去重升級;不做 /restart 殺進程;不移植舊系統 persona/144 角色、mempalace、65 API 儀表板;不做 bot 多 guild 支援。
