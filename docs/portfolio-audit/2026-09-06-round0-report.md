# Reese-max 全專案 50-Persona 稽核 — Round 0 報告

日期：2026-09-06  
範圍：GitHub authenticated owner `Reese-max` 的 39 個 repositories  
測試方法：依 `2026-09-06-50-persona-audit.md` 固定的 50 個模擬 persona × 專案核心任務做 evidence-first 第一輪 discovery。

> 本輪是 **模型 persona 模擬 + GitHub repository 靜態/文件/程式證據稽核**，不是 50 位真人受試。沒有 CI、實際執行或部署證據的項目，不標記為 runtime pass。

## 結論摘要

- Repo discovery：**39 / 39 完成**。
- 已建立 actionable GitHub Issues：**18**。
- 其中 P1：**7**（跨 4 個 repo：`project-doctor-web` 2、`lplrs-judicial-sync` 1、`clinical-scribe-worker` 1、`voice-actress` 2；另 `openab` 有 1 個 P1 finding 但 Issues 被停用，尚未能建立）。
- P2：**10**。
- P3：**1**。
- `openab`：Issue 建立被 GitHub 以 `410 Issues has been disabled in this repository` 阻擋。
- 其餘沒有建立 Issue 的 repo 並不等於 CLEAN；多數狀態是 **STATIC-PASS / RUNTIME-PENDING**。
- CLEAN 條件仍採主協定：最新版本完成必要 runtime 驗證，且 **連續兩輪**沒有新增 P0/P1/P2。

## 本輪 P1

| Repo | Finding | Issue / 狀態 |
|---|---|---|
| `project-doctor-web` | 醫療問診流程缺 deterministic emergency red-flag gate，不能只依賴 LLM 一般追問 | #1 |
| `project-doctor-web` | public MiniMax endpoint 使用 isolate-local memory rate limit，無 durable/shared abuse protection | #2 |
| `lplrs-judicial-sync` | 被下架裁判書雖會從目前資料刪除，但曾 commit 進 Git 的正文仍可能留在 history | #1 |
| `clinical-scribe-worker` | README 明示公開 Worker 完全開放、不限額，任何拿到 URL 的人可消耗 server-funded Gemini quota | #1 |
| `voice-actress` | MiniMax 不可用時會靜默退 mock/fixture，使用者無法分辨是否真 AI 批改 | #1 |
| `voice-actress` | grade-v2 → sessions schema drift 造成批改後保存 400；空 dashboard 亦有 500 已知問題 | #2 |
| `openab` | Quick Start 同時採 `--trust-all-tools`，而 `allowed_users` 可空且代表所有人；遠端 Discord 使用者邊界過寬 | **BLOCKED：Issues disabled** |

## 本輪 P2 / P3

| Repo | Severity | Finding | Issue |
|---|---:|---|---|
| `adng-memory` | P2 | 無 root README；patrol/log/snapshot 的 source-of-truth、保留、敏感資料與 recovery contract 不清楚 | #1 |
| `police-exam-archive` | P2 | 4 題仍只有 `[圖片選項]`，結構化題庫無法獨立完成該題 | #58 |
| `92-duty-scheduler` | P2 | current README 已是 Cloudflare/D1 + 200+ tests，但 root `DEFECTS.md` 仍描述舊 single-HTML/localStorage/no-tests 架構 | #12 |
| `cf-mcp-server` | P2 | 無 README，且 `node_modules/` 被追蹤進 Git | #1 |
| `book5-windows-server-2022` | P2 | 公開學習/簡報 repo 無 README，缺 learner/maintainer entry path | #3 |
| `exam-archive` | P2 | 幾乎只有 1.35 MB `index.html`，無 README、資料與 shell 未分離 | #1 |
| `gemini-deidentifier` | P2 | repo 名稱表示 de-identification，但 README/程式實際是 AI text RPG | #28 |
| `chatgpt-dual-pipeline` | P2 | repo slug 與目前「實習筆記」產品/source-of-truth 身分不一致 | #1 |
| `note-filler` | P2 | 法律/行政/考試筆記工具無 root README，安全 contract 只藏在 pyproject/程式 | #1 |
| `prompt-autoresearch` | P2 | 無 README；source/config 與 `evolution_log.jsonl`、`htmlcov/` 等 run/generated artifact 邊界不清楚 | #1 |
| `tick-stock-panel` | P2 | 無 root README；台股來源、freshness、股/張、回測與真實下單 non-scope 只存在子文件 | #1 |
| `gooaye` | P3 | repo 完全為空，無可測產品表面；需定義用途或 archive | #1 |

## 已建立 Issue 清單

1. `Reese-max/adng-memory#1` — Add repository contract, retention, and recovery README
2. `Reese-max/police-exam-archive#58` — Preserve and render the 4 image-based answer choices
3. `Reese-max/lplrs-judicial-sync#1` — Make judicial takedown deletion effective beyond the working tree
4. `Reese-max/project-doctor-web#1` — Add deterministic emergency red-flag safety gate before LLM questioning
5. `Reese-max/project-doctor-web#2` — Replace in-memory public API rate limit with durable abuse protection
6. `Reese-max/92-duty-scheduler#12` — Retire or clearly scope stale DEFECTS.md against current Cloudflare/D1 implementation
7. `Reese-max/clinical-scribe-worker#1` — Do not deploy with an unrestricted server-funded Gemini endpoint
8. `Reese-max/cf-mcp-server#1` — Remove committed node_modules and add a repository README/operating contract
9. `Reese-max/book5-windows-server-2022#3` — Add a public README and learner entry path
10. `Reese-max/exam-archive#1` — Split the 1.35 MB single-page archive and add a repository contract
11. `Reese-max/gemini-deidentifier#28` — Resolve repository identity mismatch: name says de-identifier, product is an AI RPG
12. `Reese-max/chatgpt-dual-pipeline#1` — Align repository identity with the internship-notes product
13. `Reese-max/voice-actress#1` — Never present mock/fallback grading as live AI grading
14. `Reese-max/voice-actress#2` — Repair grade-session schema drift and empty-dashboard crash
15. `Reese-max/note-filler#1` — Add a root README for the legal/admin note-filling safety contract
16. `Reese-max/prompt-autoresearch#1` — Add repository contract and separate generated research artifacts from source
17. `Reese-max/tick-stock-panel#1` — Add root README with data freshness, simulation, and non-trading boundaries
18. `Reese-max/gooaye#1` — Define purpose or archive the empty repository

## 39 Repo Round 0 狀態

狀態說明：
- `ISSUE-OPEN`：本輪已建立至少一個 actionable issue。
- `ISSUE-BLOCKED`：有 actionable finding，但 GitHub repo settings 阻止 Issue 建立。
- `STATIC-PASS / RUNTIME-PENDING`：本輪未從已讀證據確認新的 P0/P1/P2；仍需執行/CI/部署/瀏覽器驗證，不代表 CLEAN。
- `COMPAT/PAUSED`：repo 自己明示為 redirect/paused；仍只驗證其契約是否清楚。

| # | Repo | Round 0 status | 主要 persona/runtime 下一步 |
|---:|---|---|---|
| 1 | `92-duty-scheduler` | ISSUE-OPEN | 並行排班、重送、D1/network failure、鎖格/性別/假日、Excel round-trip |
| 2 | `adng-memory` | ISSUE-OPEN | retention、corrupt snapshot、stale heartbeat、recovery |
| 3 | `ai-novel-workstation` | STATIC-PASS / RUNTIME-PENDING | novice first-success、checkpoint resume、budget stop、long-run recovery |
| 4 | `autodev-ng` | STATIC-PASS / RUNTIME-PENDING | long-run autopilot、approval boundaries、worktree conflict、provider outage |
| 5 | `avatar-vfo` | STATIC-PASS / RUNTIME-PENDING | conversation persistence、auto-sim cancel、provider failure、mobile/accessibility |
| 6 | `book5-windows-server-2022` | ISSUE-OPEN | learner navigation、assets、keyboard/zoom、published build |
| 7 | `cf-ai-router` | STATIC-PASS / RUNTIME-PENDING | real quota exhaustion、cross-provider fallback、cost fail-closed、concurrency |
| 8 | `cf-mcp-server` | ISSUE-OPEN | MCP handshake、write-tool auth、migration rollback |
| 9 | `chatgpt-dual-pipeline` | ISSUE-OPEN | edit-source→sync→build→publish、public-content leak gate |
| 10 | `claude-mem` | STATIC-PASS / RUNTIME-PENDING | install/update/migration/private tags/recovery |
| 11 | `clinical-scribe-worker` | ISSUE-OPEN | auth/rate/cost gate、provider outage、clinical safety paths |
| 12 | `cyber-prep-coach` | STATIC-PASS / RUNTIME-PENDING | 320px real device、local backup restore、50-question resume、source-right gates |
| 13 | `exam-archive` | ISSUE-OPEN | payload/mobile/search performance、source split |
| 14 | `flux-image-gen` | STATIC-PASS / RUNTIME-PENDING | Turnstile/rate-limit/moderation/share-delete/R2 failure、PWA mobile |
| 15 | `gemini-deidentifier` | ISSUE-OPEN | identity cleanup then RPG start/save/load/provider fallback |
| 16 | `gooaye` | ISSUE-OPEN (P3) | no runnable surface yet |
| 17 | `herdr-skills` | STATIC-PASS / RUNTIME-PENDING | migration、integrity-key loss、multi-checkout、permission hardening |
| 18 | `internship-notes-sites-mirror` | STATIC-PASS / RUNTIME-PENDING | mobile edit→publish、credential isolation、mirror consistency |
| 19 | `lobsterpulse` | STATIC-PASS / RUNTIME-PENDING | 13-provider hook consistency、enable/disable rollback、Windows tray/runtime metrics |
| 20 | `lplrs-judicial-sync` | ISSUE-OPEN | synthetic takedown, API service-window miss, retry/idempotency |
| 21 | `MaterialYouNewTab` | STATIC-PASS / RUNTIME-PENDING | Chromium/Firefox backup restore、permissions、200% zoom、keyboard-only |
| 22 | `minideck` | STATIC-PASS / RUNTIME-PENDING | token access、public share privacy、SSE interruption/refund、delete partial failure |
| 23 | `neciken-summer-poem` | STATIC-PASS / RUNTIME-PENDING | contest evidence freshness、AI-policy boundary、24/7 stop/recovery、human freeze |
| 24 | `note-filler` | ISSUE-OPEN | provenance acceptance、immutable original、integration provider outage |
| 25 | `obsidian-vault` | STATIC-PASS / RUNTIME-PENDING | `START HERE` onboarding、sync/conflict、private note leakage、plugin portability |
| 26 | `openab` | ISSUE-BLOCKED (P1) | user allowlist vs trust-all-tools、Discord auth boundary、dangerous tool permission |
| 27 | `police-exam-archive` | ISSUE-OPEN | 4 image questions + full quiz/search accessibility |
| 28 | `police-exam-practice` | COMPAT / STATIC-PASS | redirect preserves path/query/hash and never diverges from canonical repo |
| 29 | `ppt-studio` | STATIC-PASS / RUNTIME-PENDING | URL/PDF import safety、draft recovery、share links、PPT export fidelity、keyboard |
| 30 | `project-doctor-web` | ISSUE-OPEN | emergency red flags、durable abuse limit、privacy logging、provider failure |
| 31 | `prompt-autoresearch` | ISSUE-OPEN | budget stop、holdout isolation、resume/idempotency、artifact retention |
| 32 | `skill-foundry` | STATIC-PASS / RUNTIME-PENDING | attestation tamper、promotion fail-closed、key loss、hidden-eval isolation |
| 33 | `soundbox-offline` | STATIC-PASS / RUNTIME-PENDING | IndexedDB quota/eviction、backup expectations、PWA offline/background audio |
| 34 | `taichung-police-intel` | STATIC-PASS / RUNTIME-PENDING | source outage, freshness gaps, last-known-good, citation/timestamp correctness |
| 35 | `taiwan-intel-dashboard` | PAUSED / STATIC-PASS | 503 contract、restore checklist、paused workflows truly disabled |
| 36 | `tick-stock-panel` | ISSUE-OPEN | stale/partial market data、units、backtest leakage、provider outage |
| 37 | `UkePack` | STATIC-PASS / RUNTIME-PENDING | MusicXML edge cases、teacher review、share expiry、copyright/license confirmation、PDF accessibility |
| 38 | `video-timeline-pipeline` | STATIC-PASS / RUNTIME-PENDING | timestamp fidelity、cache invalidation、batch cloud cost gate、partial transcription/vision failure |
| 39 | `voice-actress` | ISSUE-OPEN | live-vs-mock provenance、grade persistence、empty state、flat-file concurrency、billing paths |

## Persona 模擬的共同觀察

### 1. 新手與低數位熟悉度最常撞到的是「source of truth 不明」
H05、E03、A01 類 persona 對缺 README、repo 名稱與產品不一致、legacy 文件未標記特別敏感。這些問題不一定讓程式立刻壞掉，但會讓人改錯專案、部署錯入口、誤解安全邊界。

### 2. 高風險產品的優先序不是 UI 美化
醫療、裁判書、金融/市場資訊、排班與考試評分，先看：錯誤是否會被當真、資料能不能真的刪除、是否有 emergency/cost/auth gate、失敗是否可回復、來源/時間是否可追溯。

### 3. 「fallback 很貼心」若沒有 provenance，反而是 correctness defect
任何 mock、fixture、舊快照、fallback provider、last-known-good 都必須明示來源與時間；不能讓 persona 把替代結果誤認為 live/authoritative。

### 4. 連續兩輪無新問題才停止
單次 persona 模擬可能漏掉問題，因此 P0/P1/P2 歸零後仍需再跑同一組 persona；只有第二輪仍沒有新增 P0/P1/P2，且 runtime-required path 有證據，才標記 CLEAN。

## 下一輪執行規則

1. 先看上述 18 個 Issues 是否有修正 commit/PR。
2. 對有變更的 repo 以相同 persona + 相同 failure fixture 做 regression。
3. 驗收通過才關閉 Issue；未通過就在原 Issue 補具體 evidence，不另開重複 issue。
4. 對 `openab`：若 Issues 仍停用，將 P1 追蹤保留在中央報告；若開啟，補建正式 Issue。
5. 對 `STATIC-PASS / RUNTIME-PENDING` repo：依表內下一步補真實 CI/runtime/browser/deployment 證據。
6. 每個 repo 需連續兩輪沒有新增 P0/P1/P2 才進 CLEAN。

## 本輪限制

- 沒有把「讀 README 看起來完整」當成真正使用者測試。
- 沒有在缺乏執行證據時宣稱 UI、部署或 provider 真實可用。
- 50 persona 為模擬研究，不代表真人可用性研究、法律審查、醫療安全認證或金融驗證。
