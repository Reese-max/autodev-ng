# autodev-ng 專案導覽

AutoDev NG 將使用者授權的 backlog／GOAL 交給引擎，在隔離工作區執行，經驗證與審查後合併，並保留成本、事件與交付證據。架構與啟動方式見 [根目錄 README](../README.md)。

## 文件入口

| 要處理的事情 | 先讀這裡 |
|---|---|
| 專案規則、GOAL 格式與部署要求 | [CLAUDE.md](../CLAUDE.md) |
| 本次清理內容與驗證 | [2026-09-07 清理驗收](verification/project-cleanup-2026-09-07.md) |
| Discord bot 設定與維運 | [bot-ops.md](bot-ops.md) |
| Fleet 健康、保活與事故處理 | [supervision-playbook.md](supervision-playbook.md) |
| GitHub Issue 自動接單 | [github-issues.md](github-issues.md) |
| 巡檢自動立案、外部靈感與使用者情境 | [github-reports.md](github-reports.md) |
| 有證據的缺陷交由 CLI 自動修復 | [github-repair.md](github-repair.md) |
| 多任務 ownership、合併佇列與證據 | [團隊設計](plans/2026-08-14-team-parallel-ownership-merge-queue-design.md)、[歷史差距與複核](plans/2026-08-14-team-gap-acceptance-status.md) |
| Kernel 行數規範與搬移沿革 | [kernel-line-relocation-report.md](kernel-line-relocation-report.md) |
| 引擎路由與不穩定測試調查 | [路由入口](engine-routing-insertion-points.md)、[隔離修正](flaky-isolation-fix.md) |
| 金鑰輪替處理 | [security/CREDENTIAL_ROTATION.md](security/CREDENTIAL_ROTATION.md) |
| 歷史 GOAL 規格與目前驗收狀態 | [goal-queue/README.md](goal-queue/README.md) |
| 歷史探針標記 | [Pi Canary](legacy/probes/PI_PROVIDER_CANARY.md)、[Pi Canary V2](legacy/probes/PI_PROVIDER_CANARY_V2.md)、[probe.txt](legacy/probes/probe.txt) |
| 跨專案產品稽核 | [Portfolio 稽核規則](portfolio-audit/2026-09-06-50-persona-audit.md)、[2026-09-07 進度](portfolio-audit/round-2-progress-2026-09-07.md) |

`plans/`、`specs/` 保存設計；`verification/` 與各日期報告保存當時的驗收證據；`legacy/` 保存舊紀錄。歷史文件的「執行中」「已上線」需重新驗證，不能直接視為目前服務狀態。Portfolio 報告涵蓋其他專案，不代表 AutoDev NG 本身新增了功能。

## 原始碼閱讀順序

1. [CLI 分派](../src/cli/entry.ts) 與 [設定組裝](../src/cli/assemble.ts)。
2. [Scheduler](../src/scheduler.ts)、[Backlog](../src/backlog.ts)、[Worktree](../src/worktree.ts)。
3. [引擎 registry](../src/engines/registry.ts)、[驗證器](../src/engines/kernel-verifier.ts)、[團隊狀態](../src/engines/team-state.ts)、[合併佇列](../src/engines/merge-queue.ts)、[證據鏈](../src/engines/evidence-chain.ts)。
4. [Autopilot](../src/autopilot/)：GOAL 解析、規劃、評估與持續工作流程。
5. [Bot handler](../src/bot/handlers.ts)、[Web server](../web/server.mjs)、[Supervisor](../src/supervisor/)、[Guardian](../src/guardian/)、[GitHub 整合](../src/github/)。

## 整理後現況（2026-09-07）

| 項目 | 結果 |
|---|---|
| 基準 | 本機 `main`，整理前 HEAD 為 `5c00cd8` |
| 技術組成 | TypeScript ESM、Node.js、better-sqlite3、discord.js、Zod；Web 使用 Node.js server 與 HTML |
| 原始碼 | 含自動通報後 `src/` 154 個檔案，其中 `src/engines/` 85 個，包含 adapter 與共用支援模組 |
| 測試規格 | 含自動通報後 178 個 `.test.ts` 規格檔，另有 Node.js 原生 `.mjs` 驗收 |
| Kernel | 頂層 `src/*.ts` 共 **2215／2250 行**，餘裕 35 行 |
| 本機環境 | Node.js `v26.7.0`、npm `12.0.2`；CI 為 Windows + Node.js 22 |
| 導覽快取 | 本 checkout 沒有 Graphify 圖檔，直接核對原始碼 |

## 五項清理結果

| 項目 | 處理內容 |
|---|---|
| Windows 相依套件 | 依 package-lock 重裝，補齊 `.cmd`、Rolldown 與 SQLite 原生模組；npm 12 僅允許 `better-sqlite3@12.11.1` 安裝腳本 |
| 設定與啟動路徑 | 六份專案設定改用相對路徑；四份缺少的 backlog 在本地 `data/` 初始化為空白，保留另兩份既有任務。啟動／排程／巡檢／清理腳本改依 repo 與 configs 解析路徑；修正排程安裝器的失效 launcher 檔名 |
| GOAL 索引 | 分成 12 項已有實作／測試與 6 份尚無完整驗收的歷史草稿；修正過時 kernel 與「執行中」敘述，索引不作為自動派工授權 |
| 根目錄探針 | 三份標記檔原文移到 `docs/legacy/probes/`；`.gitignore` 改成只忽略根目錄同名探針 |
| 團隊協調 | 補上 scoped ownership 的 symlink／junction 拒絕檢查與回歸測試；重新核對 crash／pause 的保留與阻擋策略，界線記在清理驗收文件 |

舊巡檢合約保留原到期日並標示需複核，未擅自將過期紀錄重新認證為有效監控。GOAL 草稿與自動 crash-resume、PAUSED_READY 自動恢復等功能仍有明確界線，不能把文件整理當作功能已交付。

## 開發與驗證

```powershell
npm ci
npm run typecheck
npm run build
npm test
```

[CI](../.github/workflows/ci.yml) 使用 `npm run test:flaky-regression`，先 build，再跑兩輪完整 Vitest；測試固定單一 worker。PowerShell 傳額外參數時使用 `npm.cmd test -- ...`。本次結果、完整指令與紀錄位置見 [清理驗收](verification/project-cleanup-2026-09-07.md)。
