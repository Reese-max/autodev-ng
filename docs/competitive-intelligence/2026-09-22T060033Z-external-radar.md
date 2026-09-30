# 外部競品／新品／工作流靈感雷達 — 2026-09-22T06:00:33Z

## Status / scope / evidence boundary

- 狀態：**COMPLETE / NO NEW ACTIONABLE ISSUE / NO USER NOTIFICATION**。
- 主要情報來源為 Reese-max GitHub 之外的公開網路；GitHub 僅用於 current product truth、owner scope、方向、Issue/PR 去重、協調與持久化報告。
- Issue Quality 規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`；rules blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh connected-owner pagination：**42 Reese-max-owned repositories / 41 unarchived**；第二頁為空。目前清單中只有 `obsidian-vault` archived。舊 inventory 不當作全集。
- 本輪 fair-rotation focus：`Reese-max/cyber-prep-coach`。
- Current default branch：`main@402e472261f8f02c2089e81d1cc3c40ba6977bda`。與最近 candidate-facing product baseline `0f5dcca3902735d3b68b96611b97f70128544f51` 比較，後續差異是 audit/product-board 文件，未觀察到新的 default-branch 產品程式變更。
- Current README 仍是 **880 題 / 11 考次 / 22 科目題本**，主要模考仍為 50 題 / 60 分鐘；default-branch code search 未找到 `115-2`。
- Owner-approved positioning 沿用目前 Product Board：**INVEST，但公開發布先受內容校準與真機／無障礙／營運證據 gate 約束**；核心是 narrow、local-first、iPAS 中級題庫與可追溯來源，不擴張成 generic AI tutor、LMS、marketplace、forced-cloud 或 cyber range。
- Active scopes：#3 / open PR #14（官方規格模考）、#4 / open PR #13（local mastery / adaptive today task）、#6 / open PR #7（explanation calibration machinery，真人 SME 尚未完成）、#10 / open PR #11（RSC upstream patch）、以及 PR #2/#5 UI / local-state 範圍。本輪不搶改。
- #12 已追蹤「115-2 官方題本能否用既有 content gates 安全匯入」：`RESEARCH / severity=NOT_ESTABLISHED / decision_priority=HIGH / NEEDS_EVIDENCE / auto_implementation=false`。本輪沒有重複立案。
- `autodev-ng/main` 寫入前 HEAD：`3df638045c1051601f42a3bac1ffeab5dc6bfeb5`。
- 本輪沒有執行 production、付費 provider、CI 觸發、merge/deploy、worker/GOAL、secret/permission/settings 變更，也沒有修改產品 source/config。

## Executive decision

**0 new Issue、0 existing Issue/PR comment、0 implementation authorization。**

本輪新鮮外部訊號主要是「資安學習愈來愈重視情境決策／互動練習」，以及 certification blueprint 的快速更新仍要求 prep product 把版本轉換當成使用者可見的狀態。兩者都沒有通過建立新 Issue 的四道 Gate：

1. 情境／tabletop 類學習與 `cyber-prep-coach` 的 narrow iPAS question-practice job 有相鄰價值，但目前沒有 repo/user evidence 顯示缺少 hands-on/scenario experience 會阻斷核心備考；現在擴成 cyber range 或 generic scenario engine 屬過度工程。
2. exam-version / blueprint freshness 已被先前 radar 與 current #12 覆蓋；Pocket Prep 的做法是支持既有判斷的新外部證據，不是新 root cause。
3. Quizlet 的 spaced-repetition / adaptive review 現況與 #4 / PR #13 同 fingerprint；active scope 不重開、不留言擴張。

---

## Product → market category mapping

`cyber-prep-coach` 本輪對照：

1. **direct certification prep SaaS**：Pocket Prep；
2. **certification authority / training provider**：ISC2；
3. **adjacent adaptive study workflow**：Quizlet spaced repetition；
4. **official niche content authority**：iPAS 第一方簡章／題本。

Current supported job：讓台灣 iPAS 中級考生以 local-first 流程練歷屆題、看可追溯解析、複習弱項、保存進度並模擬考試；不是提供完整資安實驗室、企業 incident-response 訓練或廣義職涯課程。

# External Signals

## A. Direct competitor — Pocket Prep 把「考試版本」當成顯式 learner state

**Status:** `CONFIRMED` first-party documentation / current product page。  
**Published / effective evidence:** 2026-06-08（exam-version workflow）；目前 ISC2 CC 頁面明確標示 `Certification Exam Outline (September 1, 2026)`。  
**Checked:** 2026-09-22。  
**Sources:**
- https://help.pocketprep.com/en/articles/10536957-how-do-i-switch-exam-versions
- https://www.pocketprep.com/exams/isc2-cc/
- https://help.pocketprep.com/en/articles/7470862-settings-update

Pocket Prep 的 current workflow 允許新舊 exam version 在過渡期並存，使用者可切換且舊進度保留到舊版退場；新的 ISC2 CC product page 已對齊 2026-09-01 生效的 outline。這解決的不是單純「有最新題庫」，而是避免使用者把不同 blueprint 的進度、弱項與模考狀態無聲混成同一語義。

### `cyber-prep-coach` implication

這個 pattern 已在 2026-09-15 radar 被辨識，且 current #12 已將最新 115-2 題本 freshness、datasetVersion、local-progress compatibility 與 calibration invalidation 放在同一 bounded research decision 中。因此本輪只做 **REINFORCE / DEDUPE -> #12**，不新增 Issue、不留言。

值得保留的原則：**題庫可更新，但「進度是否仍可解讀」必須有顯式版本邊界。** 不需要因此建立 migration registry、source watcher、第二套 DB 或雲端帳號。

## B. Adjacent market change — ISC2 2026-09-18 把資安學習往 scenario-driven decision practice 推進

**Status:** `CONFIRMED` first-party release。  
**Published:** 2026-09-18。  
**Checked:** 2026-09-22。  
**Source:** https://www.isc2.org/insights/2026/09/security-congress-2026-expanded-learning-experiences

ISC2 新增 ACTion Rooms、AI Incident Rooms、tabletop exercises、Lessons from the Field。AI Incident Room 以 briefing → escalation → decision points → debrief 的結構，重點是治理、溝通、風險取捨與決策，而非技術 cyber range 執行。

### User job / reduced manual work

這種工作流把「知道正確概念」往「資訊逐步揭露時能否做出可解釋決策」延伸，減少學員自己把靜態教材轉成情境練習的負擔。

### `cyber-prep-coach` implication

這是 **ADJACENT IDEA / HOLD**，不是 feature gap。iPAS 現有產品 job 仍是考試練習、來源可信與 exam fidelity；沒有 evidence 顯示考生目前因缺 incident simulation 而無法完成核心任務。若未來有真實使用者證據，最小研究最多是從既有已核准題目／來源組合一個 bounded decision vignette，測「情境呈現是否改善概念辨識／決策說明」；不先建 cyber range、多人協作、scenario engine、LLM role-play service 或企業訓練平台。

**Classification:** `OPPORTUNITY / severity=NOT_ESTABLISHED / decision_priority=LOW / NEEDS_EVIDENCE / auto_implementation=false`。

## C. Adjacent study workflow — Quizlet current spaced repetition reinforces existing mastery scope

**Status:** `CONFIRMED current capability; publication date UNKNOWN`。  
**Checked:** 2026-09-22。  
**Source:** https://quizlet.com/cn/features/spaced-repetition

Quizlet current page describes automatic spaced repetition for 100+ term sets; learner marks Repeat / Hard / Okay / Easy and the product schedules review timing from those signals。這代表「記憶狀態 → next review」已是一般 study-product pattern，但不是 `cyber-prep-coach` 的新需求證據。

Current #4 / PR #13 已經做 deterministic local mastery、弱項、uncertain、review-due、coverage-gap、unseen 與 per-item reason code，而且 active PR 明確避免 cloud/LLM/account。故本輪為 **DEDUPE -> #4 / SKIPPED_ACTIVE_SCOPE**，不擴 scope。

# New Releases / strategy changes

| Date | Product / change | Confidence | Consequence |
|---|---|---|---|
| 2026-09-18 | ISC2 Security Congress 新增 AI Incident Rooms / tabletop / scenario-driven learning | CONFIRMED | 相鄰學習模式值得觀察，但現在不擴成 cyber range |
| 2026-09-01 effective | ISC2 CC 新 exam outline 生效；治理、IAM、cloud、IR/AI 等內容重組 | CONFIRMED | certification prep 需要顯式 blueprint/version truth |
| 2026-08-06 | ISC2 說明 CC 首次 major content update | CONFIRMED | 版本轉換是實際產品生命週期，不是純資料 hash 問題 |
| current 2026-09-22 | Pocket Prep CC 已對齊 2026-09-01 outline | CONFIRMED | direct competitor 具備快速版本跟隨；支持 #12，不另開單 |
| current 2026-09-22 | Quizlet spaced repetition current capability | CONFIRMED current / date UNKNOWN | 支持 #4/PR #13；沒有新 fingerprint |

ISC2 first-party background:
- https://www.isc2.org/Insights/2026/08/inside-the-updated-isc2-cc-exam
- https://www.isc2.org/certifications/cc/cc-certification-exam-outline

# Community Pain

本輪未找到比上述 first-party evidence 更強、且能改變 `cyber-prep-coach` 決策的新鮮 Reddit/HN 訊號，因此不為湊類別引用 anecdote。沒有把社群個案當成普遍發生率或 learning-effect evidence。

# Adjacent Ideas

## 1. Scenario-based decision checks after concept review — HOLD

若未來觀察到「題目會答，但無法在情境中辨認風險／決策」的真實斷點，可研究一個 **read-only、bounded vignette**：固定來源、固定答案 rubric、沒有生成式 role-play、沒有多人協作。退出條件：若只增加閱讀時間而沒有清楚決策差異，REJECT；若只有特定 topic 有價值，NARROW；只有實測支持才進下一步 BUILD 決策。

目前沒有 Issue。

## 2. Blueprint transition must remain visible — existing #12 / version boundary

Pocket Prep + ISC2 的組合證據強化：「題庫更新」與「舊進度仍代表什麼」應分開處理。`cyber-prep-coach` 已有 `datasetVersion` 與 bounded 115-2 ingestion research；先用現有機制回答 compatibility，不新增 registry/framework。

# Opportunity Map — cyber-prep-coach

### MUST MATCH

- 官方 iPAS 規格與最新正式題本的來源／版本可追溯。
- 跨 datasetVersion 的進度、mastery、calibration evidence 不得靜默重新歸屬。
- 官方規格模考不得把站內自訂計分冒充正式成績；#3 / PR #14 active。
- AI 解析的「approved」不能冒充獨立 SME 正確性；#6 / PR #7 active，SME runtime 尚未完成。

### SHOULD BE BETTER

- local-first backup/restore 與版本不相容時要 fail visibly，保留舊資料，不無聲 relabel。
- iPAS-specific source provenance、correction trail 與不確定性呈現應比泛用題庫更清楚。
- mastery 推薦必須 deterministic、可解釋、資料不足時不假裝精準；#4 / PR #13 已在 active scope。

### DIFFERENTIATOR

- narrow iPAS specialization + local learner ownership + source/version receipts +（待真實 SME 完成後）calibrated explanation trust。
- 不需要帳號／雲端就能形成可重播的學習與推薦狀態。

### ADJACENT IDEA

- 窄版情境決策 vignette；只有出現真實 workflow evidence 才研究。

### DO NOT COPY

- generic AI tutor/chat surface；
- cyber range / full incident simulation platform；
- broad LMS / course marketplace / social leaderboard；
- forced cloud account/sync；
- 為了內容 freshness 建 source watcher、migration registry 或第二套 DB；
- 把競品的 subscription pricing 或行銷指標當成本產品價值證據。

# Four-Gate Triage

## Candidate 1 — interactive scenario practice

1. **Problem/value:** 外部市場顯示情境決策學習增強，但 current repo/user evidence 沒有顯示 iPAS 考生因缺情境演練而無法完成核心 job。
2. **Priority:** `kind=OPPORTUNITY`, `severity=NOT_ESTABLISHED`, `decision_priority=LOW`, `triage=NEEDS_EVIDENCE`, `auto_implementation=false`。
3. **Minimum:** 不改產品；若未來有 evidence，先用 1 個來源綁定 vignette 測可用性。新 scenario engine/cyber range 不通過最小方案 gate。
4. **Research/implementation:** HOLD；沒有 BUILD，也沒有 worker/branch/Issue 授權。

**Decision: NO ISSUE.**

## Candidate 2 — exam version / blueprint transition

1. **Problem/value:** 真實 certification 會改 outline；Pocket Prep 顯式支援版本切換。`cyber-prep-coach` 最新 115-2 尚不在 current 880 題 corpus，但 current #12 已精確描述這個人工斷點與 datasetVersion/calibration 風險。
2. **Priority:** current #12 已為 `RESEARCH / NOT_ESTABLISHED / HIGH / NEEDS_EVIDENCE`；本輪沒有新 repo failure 支持升級。
3. **Minimum:** #12 已限定兩份官方 PDF 的 bounded dry-run ingestion decision；比 watcher/registry 更小。
4. **Research/implementation:** 仍未取得實作權。

**Decision: DEDUPE -> #12 / NO COMMENT.**

## Candidate 3 — adaptive spaced review

1. **Problem/value:** external pattern confirmed，但 current #4 已是同 fingerprint。
2. **Priority:** 不以 Quizlet 存在而提高 severity；active PR #13 已有 deterministic local implementation candidate。
3. **Minimum:** 先完成／驗證 existing active scope，不新增第二套 scheduler。
4. **Research/implementation:** radar 不搶 active PR。

**Decision: DEDUPE -> #4 / SKIPPED_ACTIVE_SCOPE.**

# Issue Mapping / grading calibration

| External signal | Existing tracker | Action |
|---|---|---|
| Pocket Prep explicit exam-version transition + current ISC2 CC outline | #12 + existing datasetVersion boundary | DEDUPE; central report only |
| Quizlet spaced repetition | #4 / PR #13 | DEDUPE; active scope, no comment |
| ISC2 scenario-driven interactive learning | none | HOLD / NEEDS_EVIDENCE; no Issue |
| official exam fidelity | #3 / PR #14 | existing active scope; no change |
| independent explanation calibration | #6 / PR #7 | existing active scope; no change |

Issue Quality v2 semantic calibration: historical #6 title/body uses `[Research][P1]` language，but v2 requires research urgency to be separated from defect severity。Until SME/runtime evidence establishes a concrete supported-path impact, this report interprets #6 as **`kind=RESEARCH / severity=NOT_ESTABLISHED / decision_priority=HIGH`** for release-decision purposes；it does not rewrite the issue while PR #7 is active, and it does not claim a P1 product defect.

# Cross-portfolio ideas

只有一個可保留的通用原則，尚不足以建 umbrella Issue：

**Content version ≠ learner/evidence version.** 當外部 authoritative blueprint 改版時，舊 progress、mastery、evaluation/calibration receipt 不能只因資料格式仍能讀就視為語義相容。只有另一個 repo 出現相同 validated workflow gap 時才考慮跨專案抽象；現在不建 shared registry/framework。

# Rejected / deferred ideas

| Idea | Decision | Why |
|---|---|---|
| generic AI tutor | REJECT | owner direction + #6 calibration gate；更多 AI surface 不解決 trust |
| cyber range / incident simulator | REJECT NOW | 外部趨勢有，但與 current narrow exam-prep job 差距大、維護成本高、無 user evidence |
| 新 spaced-repetition engine | DUPLICATE | #4 / PR #13 已 active |
| 新 exam-version migration service | REJECT NOW | #12 的 bounded compatibility/ingestion research 更小 |
| cloud account / sync | REJECT NOW | local-first 是產品邊界，無 evidence 要求 forced cloud |
| 以 Pocket Prep 定價決定本產品商業化 | REJECT | pricing 是 design signal，不是 owner demand/ROI evidence |

# Sources

First-party / direct product sources checked 2026-09-22:

1. ISC2 — 2026-09-18 interactive learning release: https://www.isc2.org/insights/2026/09/security-congress-2026-expanded-learning-experiences
2. ISC2 — 2026-08-06 updated CC exam: https://www.isc2.org/Insights/2026/08/inside-the-updated-isc2-cc-exam
3. ISC2 — current CC outline effective 2026-09-01: https://www.isc2.org/certifications/cc/cc-certification-exam-outline
4. Pocket Prep — exam-version workflow, 2026-06-08: https://help.pocketprep.com/en/articles/10536957-how-do-i-switch-exam-versions
5. Pocket Prep — Settings / prep-content versions, 2026-08-11: https://help.pocketprep.com/en/articles/7470862-settings-update
6. Pocket Prep — current ISC2 CC page: https://www.pocketprep.com/exams/isc2-cc/
7. Quizlet — current spaced repetition: https://quizlet.com/cn/features/spaced-repetition
8. iPAS — 115 年度資訊安全工程師能力鑑定簡章: https://ipd.nat.gov.tw/ipas/DownloadFile.ashx?filename=f58bf8f9-ab2c-4423-91c5-ed5291db0298_115%E5%B9%B4%E5%BA%A6%E8%B3%87%E8%A8%8A%E5%AE%89%E5%85%A8%E5%B7%A5%E7%A8%8B%E5%B8%AB%E8%83%BD%E5%8A%9B%E9%91%91%E5%AE%9A%E7%B0%A1%E7%AB%A0%28%E5%88%9D%E3%80%81%E4%B8%AD%E7%B4%9A%29_1141226.pdf&type=10

# What Changed

- 新外部訊號：ISC2 2026-09-18 明確把專業資安學習往 scenario-driven / decision practice 延伸。
- 直接競品／版本訊號沒有推翻先前結論：Pocket Prep current ISC2 CC 已對齊 2026-09-01 outline，且 exam-version transition 仍是顯式 workflow；這只強化 current #12 / datasetVersion boundary。
- current repo HEAD 自 product baseline 後仍只有 audit/product-board docs；README/current corpus 仍是 880 題 / 11 sessions，未找到 `115-2` default-branch content。
- active #3/#4/#6/#10 與 PR scopes 均未被搶改。
- 新 Issue：0；Issue/PR comment/update：0；implementation authorization：0。

# Completion / gaps / cursor

- Fresh owner pagination：完成，42 owned / 41 unarchived，page 2 empty。
- Rules / owner direction / current default changes / Competitive-Feature-Research Issues / roadmap / historical radar / rejected reasons：已核對。
- Public-web A/B/C exploration：完成；未為 Community Pain 類別硬湊弱訊號。
- Runtime：本輪沒有執行實際 browser/device/provider/CI/production test；任何此類路徑仍維持 `NEEDS_RUNTIME_VERIFICATION`。
- Portfolio CLEAN：**本雷達不宣告**。
- Next fair external-radar cursor：**`Reese-max/exam-archive`**。
