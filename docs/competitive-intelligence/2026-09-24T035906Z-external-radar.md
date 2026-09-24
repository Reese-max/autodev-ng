# 外部競品／新品／工作流靈感雷達 — 2026-09-24T03:59:06Z

## Status / scope / evidence boundary

- 狀態：**COMPLETE / MATERIAL MARKET CONVERGENCE / ZERO_NEW_ISSUE / NO_NEW_NOTIFICATION**。
- 主要情報來源是 Reese-max GitHub 之外的公開網路；GitHub 僅用於 current product truth、owner direction、去重、active ownership、inventory 與本報告持久化。
- Governing rule：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`，blob SHA `8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh connected-owner inventory 已完整分頁到空頁：**42 Reese-max-owned repositories / 41 unarchived / 1 archived**；`obsidian-vault` archived。沒有用舊 inventory 當本輪全集。
- Fair-rotation focal repo：`Reese-max/exam-archive`。Current default HEAD：`main@5d74726eed8f507bb9527aff2047945c6de10d79`；HEAD 與上一輪深讀相同，仍是 audit/docs commit，產品 baseline 仍是 `09fd79761285c1d8fd66571125a34416165156da`；`index.html` blob 仍為 `b1404b99c1e19c43bf5cb168f6d0574e4903f212`（1,348,222 bytes）。
- Owner-approved direction 重新核對：**SIMPLIFY / MAINTAIN**。先完成現有 practice accessibility 與 canonical product/data ownership，再考慮任何新的學習模式。明確不往 AI tutor、帳號／同步、教師 LMS、analytics、native app 或通用 SRS 擴張。
- Existing tracked scope：#1（repository contract / monolith / canonical relationship）、#3（keyboard / assistive-tech practice operability）。Open PR #2、#5 對應 #1；open PR #6 對應 #3，均為 active ownership。本輪不搶 scope、不寫 Issue comment、不取 lease。
- 沒有執行真實瀏覽器、screen reader、手機、正式使用者 study 或 production mutation；任何 runtime effectiveness 仍是 `NEEDS_RUNTIME_VERIFICATION`。
- 本雷達不宣告 portfolio CLEAN。

## Executive decision

**不建立新 Issue。** 本輪外部市場再次收斂到一個設計模式：考試產品正在從「看題／做題」往 `attempt evidence → 錯題／弱點 → bounded retry / next focus` 閉環發展。WAYDA 的現行警察考試產品已把錯題本、AI 診斷、題庫與申論批改放在同一學習流程；Google 於 2026-09-15 公布的 Gemini Notebook 更新，也讓使用者在做完 quiz / flashcards 後直接用 performance 決定下一步要專注的內容。

這個 convergence 對 `exam-archive` **不是功能缺口證據**。本 repo 已有 local practice history / progress summary / bookmarks，但沒有真人或 runtime 資料證明「完成題目後找不到下一個複習行動」是目前高頻斷點；而 #1、#3 仍是可到達、已證實且 active 的 P2 scope。故本輪只保留一個低成本、可結束的 `ADJACENT IDEA / HOLD`：若 #1 決定保留此 specialist surface，且之後取得真實使用證據，再研究能否**直接重用既有 local wrong/bookmark/history state**提供一個「只重做錯題／收藏題」入口；不新增 learner database、adaptive engine、AI tutor、帳號或雲端同步。

115 年 authority / freshness 也再次用考選部第一方資料核對。官方 115 年警察等特考標準答案／更正清冊目前可直接取得。這只重申 9/16 雷達已做出的結論：不要把 115 corpus 再手工複製進第二份 canonical archive；#1 應先決定 redirect / converge / thin specialist view。沒有新 root cause，因此不重開「補 115 年」工單。

本輪：**0 new Issue / 0 existing Issue or PR scope changes / 0 implementation authorization**。

## Product → market category

`Reese-max/exam-archive`：

- **Direct Taiwan exam-prep substitute:** WAYDA 警察／公職線上題庫與智能學習系統。
- **Official authority:** 考選部 115 年警察等特考試題／答案。
- **Adjacent learning workflow:** Google Gemini Notebook interactive study / performance follow-up。
- **Portfolio substitute / canonical sibling:** `Reese-max/police-exam-archive`；`police-exam-practice` current README 已再次確認只是舊網址相容入口，不應當成獨立產品吸收新功能。

## External Signals

### A. WAYDA current police-exam product：錯題／診斷被包進同一備考 loop

**Status:** `CONFIRMED CURRENT PRODUCT`  
**Checked:** 2026-09-24  
**Source:** https://lino.wayda.com.tw/product/three-admin-inclass/  
**Supporting current product:** https://lino.wayda.com.tw/product/police-ins/

官方現行三等警察產品頁把雲端課程、AI 診斷、錯題本、AI 申論批改、考前重點整合在同一「智能學習系統」；四等警察題庫頁則直接定位為跨章節練習、模擬題與申論／選擇題解析。

**User job / reduced manual steps:** `作答 → 自己記錯題 → 回頭找題 → 再組一輪複習` 被收斂為同一系統的 review loop。

**可移植部分:** 若此 repo 被 #1 判定仍有獨立產品價值，可以先重用已存在的 local wrong/history/bookmark data 做 bounded retry，而不是新增新資料面。

**不應照抄:** AI 診斷、申論批改、會員／課程 entitlement、全科 LMS、teacher workflow、cloud learner profile。Vendor product copy 也不是獨立成效測量，不能拿來宣稱學習改善率。

### B. Gemini Notebook 2026-09-15：從 quiz artifact 直接 follow-up performance

**Status:** `CONFIRMED / ADJACENT WORKFLOW`  
**Published:** 2026-09-15（Google global post；部分國際版 2026-09-16）  
**Checked:** 2026-09-24  
**Source:** https://blog.google/innovation-and-ai/products/gemini-notebook/new-study-tools-september-2026/

Google 公布 interactive learning overviews，可把 summaries、infographics、quizzes、flashcards 放在同一 notebook 中；完成 quiz / flashcards 後，使用者可直接詢問 notebook chat 關於自己的 performance，決定下一步要專注哪裡，且可自行編輯題目。

**可移植 design signal:** `attempt/result → next bounded study action` 應共享同一份 source / attempt evidence，而不是要求使用者在另一套工具重新輸入錯題。

**反證 / 邊界:** Gemini 的 AI personalized study 是大型 platform capability；`exam-archive` 沒有 owner direction 或使用者證據支持複製此面。競品存在 ≠ 本產品需要 AI recommendation。

### C. 考選部 115 年答案：freshness authority 仍應由第一方決定

**Status:** `CONFIRMED FIRST-PARTY AUTHORITY`  
**Current artifact checked:** 2026-09-24  
**Source:** https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?code=115060&t=A

目前官方 PDF 為「115年公務人員特種考試警察人員、一般警察人員、國家安全局國家安全情報人員及移民行政人員考試測驗式試題標準答案更正清冊」，包含三等考試各類科答案與更正紀錄。

這不是新 finding；它再次支持既有 #1 / 9 月 16 日 radar 的 canonical decision：最新年度與答案要由 official source identity 支撐，但不應因 freshness 就在兩個 Reese-max archive 重複維護同一 corpus。

## New Releases / changes

| Date | Source | Change | Implication |
|---|---|---|---|
| 2026-09-15 | Google Gemini Notebook | quiz / flashcard performance 可直接驅動 follow-up focus | adjacent loop pattern；不是 AI tutor mandate |
| Current 2026-09-24 check | WAYDA | 警察題庫／課程產品目前把 AI 診斷、錯題、申論批改納入同一學習流程 | market convergence；本 repo 僅保留 bounded local retry 假設 |
| Current 2026-09-24 check | 考選部 | 115 年警察等特考標準答案／更正清冊可直接取得 | revalidates official freshness authority；不重複開 ingestion issue |

## Community Pain

本輪沒有找到足以改變 priority 的近期真人社群證據。公開論壇的警察備考討論多為個人讀書策略或補習經驗，無法建立 `exam-archive` 使用者在「錯題回顧／下一步」上的發生率、完成率或 abandonment。

因此不以 Reddit/Dcard anecdote、WAYDA 行銷宣稱或合成 persona 升級 severity，也不捏造 ROI / 節省時間。

## Adjacent Ideas

1. **Bounded local retry, not adaptive platform**：若 #1 最後保留 `exam-archive`，先驗證是否可由既有 wrong/history/bookmark state 直接篩出「重做錯題／收藏題」。
2. **Attempt evidence stays local**：延續 current no-account/local-first 優勢，不為 review loop 新增 identity、sync 或 analytics。
3. **Source-currentness stays separate from learner state**：題目是否為最新／官方，與使用者是否答錯是兩個不同 contract；不要用 learner engine 解 freshness，也不要用 ingestion pipeline 解 review UX。

## Opportunity Map — exam-archive

### MUST MATCH
- #3：advertised practice journey 必須能被 keyboard / assistive-tech 完成；active PR #6 未 merge，不能當 default 已修好。
- #1：先把 canonical product/data relationship 說清楚；115 authority 不能靠第二份手工 corpus 漂移。
- 若保留 archive，latest covered year / source authority / currentness 應 truthful。

### SHOULD BE BETTER
- 若 specialist surface 被保留，優先從既有 canonical corpus 產製／讀取，而不是繼續手改 1.35 MB single-file data copy。
- learner review 若有真實需求，先用既有 local state 減少「手抄錯題 → 再搜尋」步驟。

### DIFFERENTIATOR
- 無登入、local-first、警察三等資管窄領域快速查找／閱讀／輕練習；保持低權限與低運維。

### ADJACENT IDEA
- `錯題／收藏 → bounded retry`，僅在 #1 ownership 決策後且有 user/runtime evidence 時研究。

### DO NOT COPY
- AI tutor / AI diagnosis；
- cloud learner profile / account / sync；
- teacher LMS / marketplace；
- generic adaptive engine / SRS；
- 為追競品而新增另一套 115 ingestion / question corpus。

## Four-gate evaluation — local wrong/bookmark retry

### 1. Problem / value

- Target user：使用 archive 練習後，需要再次碰到自己錯過／收藏題的警察資管考生。
- Repo evidence：current product 已有 bookmarks、practice history、progress summary/localStorage；證明有局部 learner state，但不證明下一步 review 是當前高頻痛點。
- External evidence：WAYDA 與 Gemini Notebook 都把 attempt/performance 後續動作放回同一 workflow。
- Contrary evidence：owner 明確要求 SIMPLIFY / MAINTAIN；#1/#3 仍 open；portfolio 已有更完整 `police-exam-archive` 模擬考 surface。
- Gate result：**value hypothesis only**。

### 2. Priority

```yaml
kind: OPPORTUNITY
severity: NOT_ESTABLISHED
evidence: NEEDS_EVIDENCE
decision_priority: LOW
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime: NEEDS_RUNTIME_VERIFICATION
```

不因兩個競品都有 review loop 就升 P2/P1。

### 3. Minimum solution order

1. **Do nothing now**；先完成 #1/#3。
2. 若 owner 決定保留 specialist UI，先用現有 local state 做一個 read-only/filter prototype；不新增 schema/server/database。
3. 只有真實使用者／runtime evidence 證明 `找回錯題` 是可觀察人工斷點，才考慮極薄的 retry CTA。
4. 不考慮 adaptive engine、AI ranking、sync service 或 cross-product learner registry，除非之後有獨立證據。

### 4. Research / implementation separation

若未來真的進 research，最小問題應是：

> 「在既有 local history/bookmark state 上，單一『重做錯題／收藏題』filter 是否能減少已證實的手動搜尋步驟，而不建立新的持久化模型？」

BUILD：有可取得的真人／runtime task evidence，且現有資料已足夠。  
NARROW：只做一種 filter，若不同 state 不可靠就只用可靠者。  
REJECT：沒有可觀察手工斷點、#1 最終 redirect/converge、或 canonical sibling 已提供同一 job 且轉跳更小。

本輪沒有啟動此研究，也沒有授權實作。

## Cross-portfolio ideas

- `attempt evidence → bounded next action` 是可跨題庫思考的模式，但**目前沒有足夠證據建立 portfolio learner-state framework**。
- `police-exam-practice` current README 已確認是 compatibility-only，正式題庫／搜尋／模擬考／統計都在 `police-exam-archive`；後續任何 adaptive/retry finding 應先檢查 canonical product，而不是重新讓 compatibility repo 長回第二個產品。

## Rejected Ideas

| Candidate | Decision | Why |
|---|---|---|
| 為 exam-archive 加 AI tutor / AI 診斷 | REJECT | owner direction 明確反對；沒有 target-user pain 證據 |
| 新建 learner profile / mastery DB | REJECT | solution-first；現有 local state 尚未證明不足 |
| 把 115 年再複製進 exam-archive | REJECT / DEDUPE | 既有 #1 + 9/16 radar 已把問題校準為 canonical ownership |
| 另開 wrong-answer Issue | HOLD / NO ISSUE | opportunity 未通 problem/value gate，且 #1/#3 active |
| 擴 #1/#3 active PR scope | SKIPPED_LOCKED | open PR #2/#5/#6 已有 ownership；外部訊號不改其 root cause |

## Issue Mapping / coordination

- `exam-archive #1`：仍是 canonical relationship / repository contract / monolith 主追蹤。外部 freshness 沒有新 root cause，不留言、不改 scope。
- `exam-archive #3`：仍是 pointer-only practice accessibility root cause；PR #6 open，未 merge，不假稱 fixed。
- New issue：**0**。
- Existing issue / PR comment：**0**。
- Locks acquired：**0**；因沒有寫 Issue/shared state，不需要 lease。
- Product source / CI / config / secrets / permissions / settings writes：**0**。
- Implementation branch / merge / deploy / worker / GOAL / paid call / production data write：**0**。

## Sources

Public web, checked 2026-09-24 unless noted:

1. Google, *Sharpen your study routine with new Gemini Notebook tools*, 2026-09-15: https://blog.google/innovation-and-ai/products/gemini-notebook/new-study-tools-september-2026/
2. WAYDA, 三等警察 current intelligent-learning product: https://lino.wayda.com.tw/product/three-admin-inclass/
3. WAYDA, 四等警察線上題庫 current product: https://lino.wayda.com.tw/product/police-ins/
4. 考選部，115 年警察等特考測驗式試題標準答案更正清冊: https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?code=115060&t=A

GitHub internal truth / prior decisions:

- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md` @ blob `8167e10798071d2276addaff6b201c6b0e904a2a`。
- `Reese-max/autodev-ng/docs/competitive-intelligence/2026-09-16T180108Z-external-radar.md`（既有 exam-archive freshness / canonical decision）。
- `Reese-max/exam-archive/.github/quality-audits/2026-09-09-2244-product-board-audit.md`（SIMPLIFY / MAINTAIN）。
- `Reese-max/exam-archive/docs/audits/50-persona-round-2-2026-09-10.md`。
- `Reese-max/police-exam-practice/README.md`（compatibility-only; canonical product = police-exam-archive）。

## What Changed

- External market evidence for **closed-loop review** strengthened: current WAYDA packaging + Google 2026-09-15 performance follow-up converge on the same workflow shape.
- This does **not** overturn the current `exam-archive` direction; it strengthens the case for staying small and only reusing existing local state if a real review friction is later observed.
- No new source-confirmed product defect or regression was found on current default.
- Existing 115 freshness/canonical finding remains deduped into #1; no second corpus or ingestion Issue.

## Completion / gaps / cursor

Completed:
- Issue Quality v2 re-read; rule blob SHA recorded.
- Fresh owner pagination to exhaustion: 42 owned / 41 unarchived.
- Current default changes, owner direction, Issues, all-status PRs, historical exam-archive radar/rejections checked.
- Public-web direct / adjacent / authority exploration completed.
- Four gates + duplicate/active-scope check completed.
- Report-only write performed; no product mutation.

Gaps:
- No real user evidence for wrong-answer/retry frequency.
- No runtime browser/AT validation on current `exam-archive` default.
- No claim that PR #6 fixes are deployed/current.

Cursor:
- `Reese-max/police-exam-practice` was freshly rechecked and remains **compatibility-only**, so it is skipped as an independent product target.
- Next fair eligible product target: **`Reese-max/police-exam-archive`**.
