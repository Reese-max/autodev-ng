# auto-dev 重練（Rebirth）設計文件

日期：2026-07-05
狀態：使用者已核准方案 A，進入 Phase 0 執行
執行模式：/loop 自定節奏自主推進，關鍵決策點暫停問使用者

## 背景與驗屍結論

舊系統（本 repo）：純 bash 的 24/7 全自動開發母艦。掃描驗屍結論：

1. **複雜度超過自我維護能力**：engineer-loop.sh 1986 行、lib/common.sh 118 KB、62 個 lib 模組。
2. **主 loop 疑似停擺 3 週**（狀態檔停在 2026-06-13～14），而使用者不知道——可觀測性失守。
3. **最近 10 個 commit 全在止血**（成本封頂、stall、dispatch bug），沒在推進產品 KPI。
4. 根目錄雜亂：~98 項目、狀態 dotfile 散落、備份目錄囤積、測試殘渣。

使用者痛點：產出品質差、不會記取教訓、任務挑選笨（整體都有）。

## 已核准的六大決策

| 決策點 | 選擇 |
|---|---|
| 終局 | **重練**，舊 repo 封存當參考 |
| 自動化層級 | **維持 24/7 全自動**，可觀測性一等公民 |
| 服務專案 | Phase 0 重新盤點再定 |
| 技術底座 | **TypeScript/Node** |
| 舊資產 | **只搬知識不搬碼** |
| 引擎策略 | **單引擎起步**，留引擎抽象層 |

## 方案 A：微核心 + 插件式智慧

第一設計原則：**核心小到永遠維護得動**（目標 <3000 行、五個模組、每個可測）。

核心 kernel 五模組：
1. 任務庫（SQLite）
2. 排程器
3. 引擎轉接器（抽象層，起步只接一個引擎）
4. 驗證閘（品質差的對症藥：無證據不 commit）
5. 心跳/儀表板（可觀測性：系統必須能自己發現自己笨/停/燒錢）

「智慧」全部做成插件，核心跑穩一週才掛第一個：
- 教訓記憶（餵 prompt）→ 治「不會記取教訓」
- 任務價值評分 → 治「任務挑選笨」
- 失敗覆盤

否決方案備忘：B（全功能對等重建）＝用新語言重建同一隻複雜度怪獸；C（站 n8n/Agent SDK 上）＝daemon 生命週期/成本閘/可觀測性等真正死因框架不管。

## Phase 拆解

- **Phase 0（進行中）**：盤點現況（什麼還在跑）→ 安全停舊系統 → 從舊 repo/踩雷紀錄提煉「知識遺產文件」→ 盤點哪些專案值得推
- **Phase 1**：新 kernel（單專案、單引擎、全自動小閉環）
- **Phase 2**：智慧插件（記憶 → 評分 → 覆盤，一次一個）
- **Phase 3**：多專案、多引擎擴展

每個 Phase 各自走 spec → plan → 實作。

## Phase 0 進度（2026-07-05 更新）

- [x] 盤點現況：本尊在 `公司\auto-dev`（Desktop\auto-dev 是副本）；WSL daemon + UkePack grok 回合 + 監控 minimax loop（respawn 925 次）當時全在跑
- [x] 安全停機（使用者授權「全部停」）：WSL unit stop+disable、stop 檔收 keeper、.bashrc autostart 註解（備份 .bashrc.bak-20260705）、mimo vbs 移出啟動資料夾、UkePack chain 樹斬 20 進程。驗證：log 零增長、無殘存進程。**殘留：排程 \ACL-Auto-Cleaner-Loop 需使用者提權 disable**
- [x] 知識遺產：`docs/legacy/knowledge-legacy.md`（死因：無真活→自我參照 Goodhart；81 天 $3,102 實耗；引擎坑總表）＋ 舊教訓庫整包 `docs/legacy/old-learnings-L001-L106.md`
- [x] 專案盤點：voice-actress（28 開放待辦，ROI 最高）＞ UkePack（今日仍活、backlog 剩 2）＞ gov-ai（需先修 ChromaDB）＞ ppt-studio（repo 遺失）＞ 監控（內部工具改當基建）。首發專案待使用者選定
- [x] 新 repo：`D:\Users\Administrator\Desktop\autodev-ng`（本檔所在 repo 即正本）

## 追加決策（2026-07-05 第二輪）

| 決策點 | 選擇 |
|---|---|
| 任務來源 | **使用者手排 backlog 檔**（每專案一份，只有使用者可寫；空了就 idle+告警，嚴禁系統自生任務） |
| 成本閘 | 日軟警告 $40-50、**硬停 $100**；80%/90%/100% 三段告警；單輪 budget $10 |
| 首發引擎 | **claude CLI**（引擎=插件、宣告式 metadata、preflight 由核心統一跑） |
| 教訓庫 | 舊 L001–L106 整包搬入 `docs/legacy/` 唯讀參考 |
| semantic-verify 判官 | 預設本機 proxy gpt-5.4-mini（low）、haiku 備援（Phase 2 實測定案） |

## 新系統鐵律（源自驗屍，寫進 kernel 不可繞過）

1. 任務只能來自使用者寫的 backlog——**系統永不自生任務**（舊死因 #1）
2. 所有 KPI 綁外部交付物（prod repo 的 feat/fix 落地數），**零個自我參照指標**（Goodhart 防治）
3. liveness 以「commit 產出率 + 有流量時 log 增長」為準，不信 PID/healthz/排程器狀態
4. gate 一律 fail-open-with-alert（fail-closed 曾 self-DoS）；硬擋只留 preflight 與成本閘
5. 所有 sensor 天生排除系統自產 commit（防 auto-salvage 自污染）
6. 告警通道週期性 end-to-end 自檢（送達確認；舊系統告警斷 13 天沒人知）
7. 引擎呼叫鐵三角：stdin+timeout+樹斬 kill、`< /dev/null`、不吞 stderr
8. 插件數量與設定維度設硬上限，每插件附退役條款（防元工程漩渦）
