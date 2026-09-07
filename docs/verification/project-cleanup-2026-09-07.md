# AutoDev NG 專案清理驗收

日期：2026-09-07。工作目錄：`C:\Users\Administrator\autodev-ng`；整理前分支 `main`、HEAD `5c00cd8`。本次處理專案導覽列出的五項清理：相依套件、路徑、GOAL 索引、探針封存與團隊協調複核。

## 變更

### 1. 恢復本機開發環境

依現有 `package-lock.json` 執行 `npm ci`，補齊 Windows npm launcher、Rolldown 與 SQLite 原生模組。鎖檔未變更。npm 12 的安裝腳本設定僅允許 `better-sqlite3@12.11.1`，再以 `npm rebuild better-sqlite3` 完成原生建置。

本機驗收環境為 Node.js `v26.7.0`、npm `12.0.2`；CI 使用 Windows + Node.js 22。本次沒有另跑 Node.js 22 矩陣。

### 2. 修正設定與啟動路徑

設定以各自所在的 `configs/` 解析相對路徑，六個目標均已核對存在：

| 設定 | 目標專案 | backlog |
|---|---|---|
| autodev-self | 本 repo | `data/autodev-self/BACKLOG.md` |
| gooaye | 相鄰 `gooaye` | `data/gooaye/BACKLOG.md` |
| neciken | 相鄰 `neciken-summer-poem` | 目標 repo 的 `BACKLOG-adng.md` |
| note-filler | 相鄰 `note-filler` | `data/note-filler/BACKLOG.md` |
| prompt-autoresearch | 相鄰 `prompt-autoresearch` | `data/prompt-autoresearch/BACKLOG.md` |
| taiwan-intel | 相鄰 `taiwan-intel-dashboard` | 目標 repo 的 `BACKLOG-adng.md` |

四份缺少的 backlog 初始化為空白，放在不納入版控的 `data/`；neciken 與 taiwan-intel 的既有任務原樣保留。Worktree 目錄統一為本 repo 的 `data/<project>/worktrees`。沒有搬移目標 repo 或既有 worktree。

Windows launcher、排程安裝器與巡檢腳本改從自身位置定位 repo；排程安裝器原本指向不存在的 `adng-daemon.cmd`，已修正為 `adng-daemons.cmd`。備份與 blocked 清理腳本也改依 repo／configs 解析路徑；`ADNG_MEMORY_DIR` 可指定記憶備份位置。

note-filler 移除失效的絕對 Python 路徑，改用啟動環境的 `python`；目標專案的 Python 相依套件與實際 survey 尚未驗收。Devin 模式範本的舊 24 小時 timeout 修正為 schema 允許的 2 小時；範本須先複製到 `configs/autodev-self.json`，再由目的位置解析路徑。自我開發指令同步改用現行 2250 行守門與即時計數，移除過時的 2700 行上限及已不存在的手動帳目常數。

### 3. 校正文件與歷史規格

[文件入口](../README.md)、[根目錄 README](../../README.md) 與 [bot 維運](../bot-ops.md) 已依目前程式修正架構、啟動方式與紀錄路徑。[GOAL 索引](../goal-queue/README.md) 將 18 份歷史規格分為 12 項已有實作／測試、6 份尚無完整驗收的草稿；全部均可解析出 objective 與驗收指令。

八份歷史巡檢合約保留原到期日，修正命令路徑並明示到期待複核；沒有自動續約，也沒有把本地測試當成服務已上線的證據。

### 4. 封存探針

根目錄的 `probe.txt`、`PI_PROVIDER_CANARY.md`、`PI_PROVIDER_CANARY_V2.md` 移到 [docs/legacy/probes](../legacy/probes/)，原文保留。`.gitignore` 只忽略根目錄同名探針，封存檔可納入版控。

### 5. 補上 ownership 連結路徑檢查

團隊 claim 與候選驗收共用既有 ownership 模組檢查路徑元件；明示的 scoped write 若通過 symlink／junction，即拒絕取得寫入權。候選實際變更的路徑也再次檢查；尚未建立的正常檔案仍可宣告。回歸使用真實暫存 Git repo 與 Windows junction，確認拒絕後未留下 claim。

這是拒絕連結路徑的保守策略，尚未提供 link alias 正規化後的並行寫入支援。既有 crash／pause 策略仍是保留候選、quarantine 或 `PAUSED_READY` 並阻擋重複派工；沒有新增自動 crash-resume、PAUSED_READY 自動恢復、一般 DAG、遠端 PR 治理或部署功能。歷史差距表保留並附上 [本次複核註記](../plans/2026-08-14-team-gap-acceptance-status.md)。

## 驗收證據

| 指令／檢查 | 結束碼 | 關鍵結果 |
|---|---|---|
| `npm ci --no-audit --no-fund` | 0 | 安裝 110 個套件 |
| `npm rebuild better-sqlite3 --no-audit --no-fund` | 0 | 原生相依套件建置成功 |
| `npm run typecheck` | 0 | Secret scan 與 TypeScript 檢查通過 |
| `npm run build` | 0 | `tsc -p tsconfig.build.json` 通過 |
| `npm.cmd test -- tests/project-layout.test.ts tests/team-state.test.ts tests/ownership.test.ts tests/supervisor-health/adng-daemons-shell.test.ts --reporter=dot` | 0 | 4 個檔案、15 個測試通過 |
| `npm.cmd run test:flaky-regression` | 0 | `round=1/2 ok`、`round=2/2 ok`；兩輪完整 Vitest 通過 |
| `node scripts/cleanup-blocked.mjs --self-test` | 0 | `SELF_TEST_OK` |
| `node scripts/cleanup-blocked.mjs --dry-run` | 0 | `DRY_RUN_OK safeReopen=0`；未套用修改 |
| `node scripts/backup-push.test.mjs` | 0 | 3 passed；fake Git，未實際推送 |
| `node --test tests/d13f95b2d9cc3d14-auto-goal-completion-gate.test.mjs` | 0 | 2 個測試通過 |
| 三份 `scripts/install-*-task.ps1 -WhatIf` | 0 | 僅預演，未註冊／啟動排程 |
| PowerShell `Language.Parser.ParseFile` | 0 | 本次修改的 PowerShell 腳本無語法錯誤 |
| 六份設定 schema／路徑、18 份 `parseGoal` | 0 | 目標與 backlog 存在；GOAL 解析成功 |
| 文件／封存／鎖檔完整性檢查 | 0 | 6 份文件共 70 個本地連結有效；3 份封存檔逐位元相同；鎖檔未變 |
| `git diff --check` | 0 | 無 whitespace 錯誤；Windows 腳本依 `.gitattributes` 使用 CRLF |

雙輪回歸採專案既有 CI 指令，先 build，再以單一 worker 跑完整 Vitest；本 checkout 共 177 份 `.test.ts` 規格。原始執行紀錄在本機 `data/maintenance/cleanup-regression.log`；連結數、SHA256 與換行檢查結果在 `data/maintenance/cleanup-integrity.json`。第一輪耗時 648815 ms，第二輪 537683 ms，整體結束碼 **0**。

Kernel 頂層 `src/*.ts` 維持 **2215／2250 行**，本次未增加 kernel 行數。相依套件與新 guard 的驗收均為本機測試；未呼叫真實模型派工、未完成 Discord／Web live readiness 或正式環境端到端驗收。

## 保全與交付狀態

共用設定變更保留 `.bak-20260907` 或同日帶時分秒的不覆寫備份；`package.json` 另保留整理前 HEAD 原文備份。這些備份與本地 runtime data 依既有規則忽略。

變更保留在目前工作目錄供檢視，尚未提交或推送；沒有註冊排程、啟動 daemon、切換 GOAL 或部署。新增產品功能與歷史草稿仍依各自規格另行驗收。
