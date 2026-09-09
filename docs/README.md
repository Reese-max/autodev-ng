# autodev-ng 專案導覽

AutoDev NG 將使用者授權的 backlog／GOAL 交給引擎，在隔離工作區執行，經驗證與審查後合併，並保留成本、事件與交付證據。架構與啟動方式見 [根目錄 README](../README.md)。

## 文件入口

| 要處理的事情 | 先讀這裡 |
|---|---|
| 專案規則、GOAL 格式與部署要求 | [CLAUDE.md](../CLAUDE.md) |
| 相依套件、路徑與歷史檔案整理紀錄 | [2026-09-07 清理驗收](verification/project-cleanup-2026-09-07.md) |
| Discord bot 設定與維運 | [bot-ops.md](bot-ops.md) |
| Fleet 健康、保活與事故處理 | [supervision-playbook.md](supervision-playbook.md) |
| 所有 AI CLI 的長任務與按需 Guardian 監督 | [全接頭監督計畫](plans/2026-09-09-unbounded-task-supervision-plan.md) |
| GitHub Issue 自動接單 | [github-issues.md](github-issues.md) |
| 巡檢自動立案、外部靈感與使用者情境 | [github-reports.md](github-reports.md) |
| 有證據的缺陷交由 CLI 自動修復 | [github-repair.md](github-repair.md) |
| 六項 GOAL：CLI 規劃、提案決策、恢復與成效 | [cli-autonomy.md](cli-autonomy.md)、[驗收](verification/cli-autonomy-2026-09-08.md) |
| 多任務 ownership、合併佇列與證據 | [團隊設計](plans/2026-08-14-team-parallel-ownership-merge-queue-design.md)、[歷史差距與複核](plans/2026-08-14-team-gap-acceptance-status.md) |
| Kernel 行數規範與搬移沿革 | [kernel-line-relocation-report.md](kernel-line-relocation-report.md) |
| 引擎路由與不穩定測試調查 | [路由入口](engine-routing-insertion-points.md)、[隔離修正](flaky-isolation-fix.md) |
| 金鑰輪替處理 | [security/CREDENTIAL_ROTATION.md](security/CREDENTIAL_ROTATION.md) |
| GOAL 規格、待驗收項目與歷史草稿 | [goal-queue/README.md](goal-queue/README.md) |
| 歷史探針標記 | [Pi Canary](legacy/probes/PI_PROVIDER_CANARY.md)、[Pi Canary V2](legacy/probes/PI_PROVIDER_CANARY_V2.md)、[probe.txt](legacy/probes/probe.txt) |
| 跨專案產品稽核 | [Portfolio 稽核規則](portfolio-audit/2026-09-06-50-persona-audit.md)、[2026-09-07 進度](portfolio-audit/round-2-progress-2026-09-07.md) |

`plans/`、`specs/` 保存設計；`verification/` 與各日期報告保存當時的驗收證據；`legacy/` 保存舊紀錄。歷史文件的「執行中」「已上線」需重新驗證，不能直接視為目前服務狀態。Portfolio 報告涵蓋其他專案，不代表 AutoDev NG 本身新增了功能。

## 目錄與檔案放置

| 位置 | 放置內容與使用方式 |
|---|---|
| [src/](../src/)、[tests/](../tests/)、[web/](../web/) | 產品程式、回歸測試與本機 Web 控制台；模組責任見根目錄 README |
| [configs/](../configs/) | 六份 fleet 專案設定；相對路徑以設定檔所在目錄解析 |
| [configs/modes/](../configs/modes/)、[configs/integrations/](../configs/integrations/) | 模式範本與 GitHub 整合設定，放在子目錄以免被當成 fleet 專案；模式範本先複製到正式設定位置再使用 |
| [scripts/](../scripts/) | `adng-*.cmd` 啟動服務、`install-*-task.ps1` 安裝排程；操作方式見 bot、Supervisor 與 GitHub 維運文件 |
| [plans/](plans/)、[specs/](specs/)、[goal-queue/](goal-queue/) | 設計、實作計畫與 GOAL 契約；規格索引不構成派工授權 |
| [verification/](verification/)、[legacy/](legacy/) | 按日期保存驗收證據、舊紀錄與探針；保留歷史檔名供既有引用使用 |
| `data/`、`dist/`、`node_modules/` | 本機執行資料、編譯輸出與相依套件，依 `.gitignore` 排除；`data/` 含任務與證據，不當成可重建快取 |
| 原檔旁的 `*.bak-*` | 設定修改前的保全備份，依 `.gitignore` 排除，保留來源名稱與日期 |

## 原始碼閱讀順序

1. [CLI 分派](../src/cli/entry.ts) 與 [設定組裝](../src/cli/assemble.ts)。
2. [Scheduler](../src/scheduler.ts)、[Backlog](../src/backlog.ts)、[Worktree](../src/worktree.ts)。
3. [引擎 registry](../src/engines/registry.ts)、[驗證器](../src/engines/kernel-verifier.ts)、[團隊狀態](../src/engines/team-state.ts)、[合併佇列](../src/engines/merge-queue.ts)、[證據鏈](../src/engines/evidence-chain.ts)。
4. [Autopilot](../src/autopilot/)：GOAL 解析、規劃、評估與持續工作流程。
5. [Bot handler](../src/bot/handlers.ts)、[Web server](../web/server.mjs)、[Supervisor](../src/supervisor/)、[Guardian](../src/guardian/)、[GitHub 整合](../src/github/)。

## 本機盤點（2026-09-08）

| 項目 | 結果 |
|---|---|
| 基準 | `C:\Users\Administrator\autodev-ng`；整理前 `main`、HEAD `ef0bae1`，工作樹乾淨 |
| 技術組成 | TypeScript ESM、Node.js、better-sqlite3、discord.js、Zod；Web 使用 Node.js server 與 HTML |
| 原始碼 | Git 追蹤的 `src/` 共 159 個檔案，其中 `src/engines/` 86 個，包含 adapter 與共用支援模組 |
| 測試規格 | Git 追蹤的 180 個 `.test.ts` 規格檔，另有 Node.js 原生 `.mjs` 驗收；規格檔數不等於測試案例數 |
| GOAL | 19 份規格：12 項已有實作／測試、6 份歷史草稿、1 份 CLI 自主開發待完整驗收；詳見 GOAL 索引 |
| Kernel | 頂層 `src/*.ts` 共 **2217／2250 行**，餘裕 33 行；依既有守門測試計算換行字元數 |
| 本機環境 | Node.js `v26.7.0`、npm `12.0.2`；CI 為 Windows + Node.js 22 |
| 導覽快取 | 本 checkout 沒有 Graphify 圖檔，直接核對原始碼 |

以上為指定日期與提交的盤點。2026-09-07 的相依套件修復、設定路徑、GOAL 索引、探針封存與 ownership 檢查保存在 [原清理驗收](verification/project-cleanup-2026-09-07.md)。

## 驗收紀錄與待驗收項目

| 範圍 | 證據入口與界線 |
|---|---|
| GitHub 自動報告 | [2026-09-07 驗收](verification/github-reports-2026-09-07.md) |
| GitHub CLI 修復 | [2026-09-07 驗收](verification/github-repair-2026-09-07.md) |
| CLI 自主開發與安全恢復 | [2026-09-08 驗收](verification/cli-autonomy-2026-09-08.md)；該紀錄仍缺真實 Codex 修復成功證據，最終以 `verify-autonomy.mjs` 對指定提交及 Issue 的檢查為準 |
| 六份歷史 GOAL 草稿 | [規格索引](goal-queue/README.md)；保留各自缺少的驗收，不因文件整理改列完成 |

舊巡檢合約保留原到期日；任何服務狀態、恢復操作與真實交付須依當次證據核對。

## 開發與驗證

首次安裝或鎖檔變更時執行 `npm ci`。日常檢查從專案根目錄執行：

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd test -- tests/project-layout.test.ts tests/kernel-slim.test.ts --reporter=dot
node scripts/check-cli-journey.mjs
```

這組指令驗證型別、編譯、目錄契約、kernel 上限與離線 CLI 操作。`check-cli-journey.mjs` 使用暫存 repo 與 mock 引擎，檢查建立、去重、查看、阻擋髒工作目錄、保留資料及暫停；真實模型修復另依 GOAL 驗收。

| 要驗證的範圍 | 指令 |
|---|---|
| 一輪完整 Vitest | `npm.cmd test` |
| 與 CI 相同的兩輪完整回歸 | `npm.cmd run test:flaky-regression`（包含 build） |
| 輪級增量檢查的選測計畫 | `node scripts/verify-incremental.mjs --plan`；只顯示計畫，未執行測試 |
| Node.js 原生完成閘 | `node --test tests/d13f95b2d9cc3d14-auto-goal-completion-gate.test.mjs` |
| 備份推送邏輯 | `node scripts/backup-push.test.mjs`；使用 fake Git |
| CLI 自主開發最終驗收 | 見 [GOAL-cli-autonomy.md](goal-queue/GOAL-cli-autonomy.md)；需要真實 worker、精確提交與完整證據 |

[CI](../.github/workflows/ci.yml) 使用 Windows + Node.js 22，先 typecheck，再跑兩輪完整 Vitest；測試固定單一 worker。`.mjs` 驗收不在 Vitest 的 `include` 範圍，需用表中的獨立指令。PowerShell 傳額外參數時使用 `npm.cmd test -- ...`。
