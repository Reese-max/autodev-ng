# 外部競品／新品／工作流靈感雷達 — 2026-09-23T18:07:22Z

## Status / scope / evidence boundary

- 狀態：**COMPLETE / NO_MATERIAL_NEW_ACTIONABLE_SIGNAL / NO_NOTIFICATION**。
- 查閱日：2026-09-24（Asia/Taipei）；報告時間採 UTC。
- 主要情報來源為 Reese-max GitHub 之外的公開網路；GitHub 僅用於 current product truth、owner direction、Issue/PR 去重、協調與持久化報告。
- Issue Quality 規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`；rules blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh connected-owner pagination：**42 Reese-max-owned repositories / 41 unarchived**；第二頁為空，`obsidian-vault` archived。舊 inventory 不當作全集。
- Incoming fair cursor：`Reese-max/octobroker`。重新核對 owner fork 與 `openabdev/octobroker` 的 `main` 均為 `b669101c0ef4a2c03c1ddcb2b99c014fd1947d29`；owner 既有 `EXCLUSION_REVALIDATED` 仍成立，故不把 mirror 硬當產品，也不操作 upstream。
- 本輪實際 product-applicable focus：`Reese-max/police-exam-archive`。
- Current default：`master@a0b5dbb9352b5558dbe62445c6452947dbd2501b`；寫報告前再次讀回未變，且 branch protection 的四項 required checks 仍存在。
- Owner-approved direction：**INVEST / SIMPLIFY / MAINTAIN；先使既有 PWA／offline、來源 fidelity 與 practice workflow 的可靠性成立，不增加帳號、雲端同步、LMS、商城或 generic AI tutor。**
- `Reese-max/police-exam-practice` 亦順手核對：README 仍明定已融合到 `police-exam-archive`，只保留舊網址相容入口，因此不當成第二個獨立產品重新吸收競品功能。
- 本輪未修改產品原始碼、CI/config、secret、permission/settings；未建 implementation branch、未 merge/deploy、未啟動 worker/GOAL、未新增付費承諾或正式資料寫入。

## Executive decision

**0 new Issue、0 existing Issue/PR comment or scope update、0 implementation authorization。**

本輪公開網路確實出現近期的新學習工作流訊號，但四道 Gate 後都只是在**強化既有方向**，沒有建立新的 root cause：

1. Google 在 **2026-08-19**把 Gemini 學習工具集中到 Student Hub，Study Notebooks 以 diagnostic quiz 找 knowledge gaps、維持即時 progress dashboard，並宣布可在使用者授權下從 syllabus 把 exam／assignment deadlines 排入 Google Calendar。這是近期的產品策略變化，但對本 repo 最直接的可移植原則——`attempt evidence + deadline + next action`——已由 `police-exam-archive #60` 擁有，且 PR #66 正在 active scope；不重複開單、不留言擴 scope。
2. JumpVault current surface 已把 115 年、42,000+ 國考題、官方 PDF、考點關聯與法規來源校對放在同一個 archive workflow。這再次說明「只是把歷屆題放上網」正在 commodity 化，但此訊號已在既有 radar 出現；沒有新證據推翻 owner 的 source-fidelity/local-first 定位，也沒有理由追 generic AI 詳解。
3. 考選部 data.gov.tw dataset **170565** 仍提供每日更新、machine-readable 的 exam/year/category/subject/question URL/answer URL 索引；`police-exam-archive` current ingestion 仍可觀察到 HTML search-page parsing與年度 hard-coded downloader。技術上存在可簡化 source enumeration 的可能性，但 **2026-09-22 歷史 radar 已明確記錄這個訊號並拒絕 source registry/service/framework 擴張**。本輪沒有新的 maintenance failure、漏卷、錯卷或人工耗時證據足以推翻原拒絕理由，因此只保留 read-only reconciliation idea，不立案。

因此本輪沒有達到通知門檻：沒有高價值新產品機會、重大未見競品策略轉向、已證實跨專案共用能力，也沒有外部新證據推翻既有方向。

---

## Product → market category mapping

`police-exam-archive`：官方警察特考 corpus + search / quiz / analytics / PWA。

主要替代與相鄰類別：

- **直接／間接競品**：JumpVault、阿摩等國考題庫／練習入口。
- **通用學習工作流**：Gemini Study Notebooks、Quizlet Learn/Test 等 adaptive study surface。
- **官方 source/discovery layer**：考選部考畢試題頁與 data.gov.tw dataset 170565。
- **相鄰技術**：machine-readable source enumeration、answer/source revision identity、local-first attempt history。

本產品合理差異化仍是：官方來源、可追溯 corpus、免帳號／本機優先、可驗證品質、低摩擦 practice；不是以 AI 功能數量與大型 learning SaaS 競爭。

# External Signals

## A. Direct competitor — JumpVault 把「官方來源 + 最新年度 + 考點／法規關聯」綁成單一 workflow

**Status:** `CONFIRMED current vendor capability / effectiveness UNKNOWN`  
**Checked:** 2026-09-24  
**Source:** https://www.jumpvault.tw/

Current page 展示 42,000+ 國考題、115 年題、官方 PDF、最近年度免費詳解、考點關聯與法規引用；這只能證明目前 product shape，不能把 vendor 的品質數字或 AI 宣稱當獨立 learning-effect benchmark。

### User job / friction reduced

使用者不需在「官方 PDF → 題目文字 → 法規依據 → 相同考點歷屆題」之間反覆手工切換。

### Transfer / do not copy

- **MUST MATCH**：latest-year/source truth 必須清楚且可核對。
- **SHOULD BE BETTER**：官方 corpus identity、來源 version、圖片／表格 fidelity 與 deterministic quality checks。
- **DO NOT COPY**：沒有 repo/user evidence 支持現在新增 AI 詳解、law RAG、付費歷史解析或大範圍 concept graph。

**Dedup:** 已有歷史 radar 記錄，且目前更高優先是 #58/#61/#69/#74/#75 的可靠性與既有 #60 learner-state workflow；不新增 Issue。

## B. Adjacent workflow — Gemini Student Hub 把診斷、進度與 deadline 接成一條線

**Status:** `CONFIRMED first-party product direction`  
**Published:** 2026-08-19  
**Checked:** 2026-09-24  
**Source:** https://blog.google/innovation-and-ai/products/gemini-app/student-offer-google-ai/

Google current flow：上傳課程材料 → optional diagnostic quiz → custom lessons/quizzes + real-time progress dashboard；並宣布 Study Notebooks 可在使用者授權下，從 syllabus 將 exams / assignment due dates 排入 Google Calendar。

### Transferable signal

真正可移植的不是 Calendar integration，而是：

`source-grounded material → attempt/diagnostic evidence → explicit deadline → explainable next study action`

這正是既有 `#60` 的 Attempt Ledger + deadline-aware review queue 所要解的 job。PR #66 目前 open，因此依 active-owner scope 規則記 `SKIPPED_LOCKED / DUPLICATE_VALIDATION`，不留言擴張，也不新增 Calendar／syllabus connector。

## C. New technical/distribution possibility — official dataset 170565 可作 source enumeration，但不是新的產品立案

**Status:** `CONFIRMED first-party open data / PRIOR_SIGNAL_REVALIDATED`  
**Checked:** 2026-09-24  
**Source:** https://data.gov.tw/dataset/170565

考選部資料集涵蓋 101 年起國家考試，欄位包含考試年度／代碼／名稱、等級、類科、節次、科目、試題型態、**試題網址**與**測驗式試題答案網址**；資料頁標示提供機關為考選部、更新頻率每 1 日、OGDL v1、免費。

Repository current source evidence則顯示，例如 `scripts/download/download_115_police.py` 仍以固定 YEAR / EXAM_CODE / CATEGORY_MAP 解析官方 HTML search page，再抓 PDF／答案與更正答案。

### Gate result

它確實可能降低「每年度人工找到 exam code／category／paper URL」的 maintenance work，但目前沒有：

- current ingestion 因 HTML selector 變動而失敗的執行證據；
- 115 或其他年度漏卷／錯卷的 current evidence；
- 維護者實際時間成本資料；
- 新證據推翻 2026-09-22 radar 的「只做 read-only reconciliation sample，不建 source service/registry/framework」拒絕理由。

因此維持：

`kind=OPPORTUNITY` / `severity=NOT_ESTABLISHED` / `decision_priority=LOW_MEDIUM` / `triage=NEEDS_EVIDENCE` / `auto_implementation=false`。

若未來真的研究，最小實驗只是取一個年度，用 official CSV enumerated URLs 與 current scraper output 做 deterministic diff；BUILD / NARROW / REJECT 只回答「source enumeration 是否可少掉脆弱的人工／HTML discovery」，不先改正式 ingestion。

# New Releases / strategy changes

| Date | Product / source | Change | Confidence | Decision |
|---|---|---|---|---|
| 2026-08-19 | Google Gemini | Student Hub + Study Notebooks；diagnostic/progress；可經授權把 syllabus deadlines 排入 Calendar | CONFIRMED | 強化 #60；active PR #66，不重複開單 |
| current, checked 2026-09-24 | JumpVault | 42k+ / 115 年 / 官方 PDF / 考點與法規關聯 | CONFIRMED vendor capability | 已知市場校準；不追 AI breadth |
| daily dataset, checked 2026-09-24 | 考選部 dataset 170565 | official machine-readable paper/answer URL enumeration | CONFIRMED first-party | 既有 radar 已知；只保留 bounded reconciliation idea |

# Community Pain

本輪沒有取得足以改變決策的近期 Reddit/HN/論壇 evidence；不為了湊類別把單一抱怨當 prevalence。

現有可觀察 product friction 仍由 repository evidence 主導：PWA/Analytics offline truth、圖片題 fidelity、quality denominator truth、checkpoint recovery，以及 aggregate-only learner history。它們皆已有 owner tracker／active PR 或既有 Issue，不需要靠社群訊號灌高 severity。

# Adjacent Ideas

## 1. Official-answer correction → learner-state invalidation / re-score receipt — HOLD

`download_115_police.py` 已有 corrected-answer discovery／count contract，而 #60 也要求 dataset/source identity 改變時舊 learner state 不可 silent reuse。未來若 Attempt Ledger 真正落地，可以研究「官方答案更正後，哪些歷史 attempt 受影響、是否需重新評分／標 stale」；但目前 #60 尚在 active implementation scope，沒有理由先另開 correction subsystem Issue。

最小研究若將來需要：單一 fixture question 的 answer revision → old attempt 標示 affected → deterministic before/after score receipt。**不先做 generic event sourcing、version DB 或通知服務。**

## 2. Deadline handoff — REUSE existing #60, no Calendar integration

Google 的新訊號證明 deadline 是越來越常見的 study-state input，但本產品只需讓考生設定 target exam date / capacity；沒有 evidence 支持要求 Google Calendar OAuth、syllabus parser 或 background schedule sync。

## 3. Official source reconciliation — READ-ONLY first

若 maintenance evidence 出現，先做：

`official CSV rows ↔ current scraper manifest` 的 one-year diff report。

只有 deterministic 差異證明 current source discovery 有實際漏失／脆弱成本，才討論替換 source enumeration；不先改 authority、PDF validation 或 corpus canonical ownership。

# Opportunity Map

| Opportunity | Classification | Gate result |
|---|---|---|
| Official-source / current-year truth | **MUST MATCH** | 現有 corpus/source contract 持續優先；無新 Issue |
| Per-question attempt → deadline-aware next action | **DIFFERENTIATOR** | Existing #60 + open PR #66；`SKIPPED_LOCKED / DUPLICATE_VALIDATION` |
| Image/table/source fidelity | **SHOULD BE BETTER** | Existing #58 + PR #71；不新增 scope |
| Generated corpus-quality truth | **SHOULD BE BETTER** | Existing #61 + PR #72；不新增 scope |
| Crash/reload recovery | **MUST MATCH** | Existing #69 + PR #73；不新增 scope |
| Analytics offline consistency | **MUST MATCH** | Existing #74/#75；P2 remains; external AI signals do not reprioritize |
| Official CSV reconciliation sample | **ADJACENT IDEA** | LOW_MEDIUM / NEEDS_EVIDENCE / no implementation authorization |
| Gemini-style Calendar/syllabus integration | **DO NOT COPY NOW** | Deadline value can be met in-product without OAuth/integration burden |
| Generic AI tutor / generated questions / law RAG | **DO NOT COPY** | No user-value evidence; conflicts with current simplify/reliability priority |

# Four-gate calibration

### 1. Problem / value

- #60 already captures the observable learner-state break: current aggregate history discards per-question outcomes.
- official CSV is a potential maintenance simplification, but there is no current supported-flow failure or measured maintenance burden; "沒有 registry/API" 不是價值證據。
- competitor feature presence alone is not a defect.

### 2. Priority

No new P0/P1/P2/P3 was established. New external signals remain OPPORTUNITY context with `severity=NOT_ESTABLISHED`; existing #58/#61/#69/#74/#75 retain their independent severity and evidence.

### 3. Minimal solution

- For learning: reuse #60, do not add Calendar/OAuth/syllabus ingestion.
- For source discovery: if future evidence warrants, one-year read-only CSV↔scraper diff comes before source service, DB, watcher, registry or multi-provider framework.

### 4. Research / implementation separation

No research result in this report authorizes product source changes. No READY_FOR_IMPLEMENTATION transition was made. `auto_implementation=false` for retained opportunities.

# Issue Mapping / coordination

- `#60` Attempt Ledger / deadline-aware review — **existing; PR #66 open; SKIPPED_LOCKED for scope changes**.
- `#58` image-based answer fidelity — **existing; PR #71 open**.
- `#61` dataset quality denominator contract — **existing; PR #72 open**.
- `#69` checkpoint recovery — **existing; PR #73 open**.
- `#74` Analytics code/data cohort consistency — existing P2.
- `#75` first-offline Analytics Chart.js dependency — existing P2.
- No new fingerprint passed all four gates. No Issue lock was acquired because no Issue/comment mutation was attempted.

# Rejected / held ideas

1. **Create a new `OfficialSourceRegistry` service** — REJECT/HOLD. Existing 170565 radar already rejected architecture-first expansion; no new evidence overturns that decision.
2. **Add Gemini-style Calendar integration** — REJECT NOW. Target date can remain a local explicit user setting; OAuth, permissions, sync and lifecycle cost are unjustified.
3. **Add generic AI tutor / generated police questions** — REJECT NOW. Official corpus/provenance is the moat; no current evidence proves AI breadth is the bottleneck.
4. **Auto-regrade all historical attempts on answer correction now** — HOLD. Durable per-question attempt state is not yet current default; study this only after #60 lands and real revision cases exist.
5. **Treat `police-exam-practice` as another product** — REJECT. It is a compatibility redirect by owner contract; duplicating logic would reintroduce dual truth.

# Sources

Public web (primary intelligence):

1. Google, **Start the semester with one year of Gemini, on us**, 2026-08-19: https://blog.google/innovation-and-ai/products/gemini-app/student-offer-google-ai/
2. Google for Education, **Supporting students with connected AI tools for more personalized learning**, 2026-06-25: https://blog.google/products-and-platforms/products/education/iste-students-2026/
3. JumpVault current product: https://www.jumpvault.tw/
4. 考選部 / data.gov.tw dataset 170565: https://data.gov.tw/dataset/170565
5. Quizlet Learn current product reference: https://quizlet.com/features/learn

GitHub evidence was used only for owner direction, current product truth, dedupe, active ownership and report persistence.

# What Changed / completion / cursor

- Fresh owner inventory: **42 owned / 41 unarchived**; pagination complete.
- Incoming `octobroker` exclusion revalidated against upstream exact current SHA; no owner-specific product delta.
- `police-exam-archive` current default re-read before report: unchanged `master@a0b5dbb9352b5558dbe62445c6452947dbd2501b`.
- External A/B/C scan completed: direct competitor, adjacent learning workflow, official new-technical/source path all checked.
- Prior radar/rejection reasons for dataset 170565 and adaptive learner workflow explicitly checked; no false novelty claim.
- `police-exam-practice` compatibility-only status revalidated; no duplicate product scan.
- New Issues: **0**. Issue/PR comments or scope edits: **0**. Implementation authorization: **0**.
- Runtime/provider/browser execution: **not performed**. No runtime claim is made; retained research ideas remain `NEEDS_RUNTIME_VERIFICATION` if promoted later.
- Portfolio CLEAN: **not declared**.
- **Next fair product-applicable cursor: `Reese-max/92-duty-scheduler`**. It was scanned recently, so the next run should first check for substantive default-branch/external-signal change and may fast-skip if no material delta rather than generating a duplicate report.
