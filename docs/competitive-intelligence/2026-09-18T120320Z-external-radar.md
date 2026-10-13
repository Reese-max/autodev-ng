# 外部競品／新品／工作流靈感雷達 — 2026-09-18T12:03:20Z

Status: **COMPLETE**

## Scope / Direction Check

- Issue Quality 規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`。
- Rules blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- 本輪重新完整分頁列舉目前連線可存取的 `Reese-max` repositories：**41 owned / 40 unarchived**；第二頁為空。`obsidian-vault` 為 archived 並排除。沒有用舊 inventory 代替本輪全集。
- Fair-rotation primary repo：`Reese-max/cyber-prep-coach`；下一個公平輪巡 cursor：**`Reese-max/exam-archive`**。
- Current default branch：`main@ab298d6070beff56e73061dd00756406fbbbef24`（`docs: record cyber-prep 50-persona round 3`）。寫報告前再次核對，HEAD 未漂移。
- Owner-approved direction 仍由現行 PRD 與 2026-09-10 product-board audit 界定：narrow、local-first、非官方 iPAS 中級題庫／模擬／複習產品；差異化在可追溯歷屆題、source/version receipts、local learner state、校準過的解析品質，而不是 generic AI tutor、LMS、social feed、leaderboard、forced cloud account 或 marketplace。
- 公開發布優先序仍是內容校準、官方考制 fidelity、真機／鍵盤／讀屏／慢網路與營運／隱私 release gates；本輪不以競品訊號改寫這些排序。
- 本輪沒有修改產品 code、CI/config、secrets、permissions/settings，沒有建立 implementation branch、merge/deploy、啟動 worker/GOAL、付費或 production write。
- 沒有執行真人學習效果、production runtime、外部 provider 或裝置驗證；涉及實際學習效果的主張保持 `NEEDS_EVIDENCE`。
- 不宣告 portfolio CLEAN。

## Product → Market Category

1. **iPAS / certification practice**：官方 iPAS 資源、專項 certification practice planners。
2. **Adaptive review / spaced repetition**：Quizlet 等以「今天該複習什麼」降低手動規劃成本。
3. **Goal / gap-based learning**：Gemini Learning Notebooks 等把 strengths / gaps 轉成 next-best lesson。
4. **Source-grounded study workflows**：Gemini Notebook 以來源為基礎產生 quiz / flashcard 並在完成後回看表現。
5. **Exam-date planning**：相鄰 certification planners 把 exam date / weeks remaining / domain weights 轉成週期或每日計畫。

競品存在本身不構成功能要求；本輪只保留能對目前支援工作產生可檢驗決策的訊號。

## External Signals

### A. CONFIRMED — Quizlet 把 review scheduling 從「使用者自己安排」變成產品內建工作

**發布：2026-08-04；查閱：2026-09-18。**

Source: https://quizlet.com/blog/built-for-better-learning-whats-new-on-quizlet-this-fall

Quizlet 第一方秋季更新宣布新的 Spaced Repetition：系統會自動安排每天要複習的項目，依學習進展持續調整 review schedule，核心工作是降低「今天該讀什麼／什麼時候回來複習」的管理成本。這是 vendor capability claim，不是獨立學習成效證明。

**可移植模式：**把既有 learner-state 轉成可解釋的 next action，而不是要求使用者自己把錯題、間隔與時間壓力翻成行程。

**不應照抄：**Podcast、錄音、社群／帳號生態系不符合目前 local-first iPAS 範圍，也沒有證據比核心信任／考制工作優先。

### B. CONFIRMED — Google Learning Notebooks 把 strengths / gaps / progress 直接連到下一個 lesson

**發布：2026-09-01；查閱：2026-09-18。**

Source: https://blog.google/intl/de-de/produkte/suchen-entdecken/lern-notebooks-gemini/

Google 第一方說明 Learning Notebooks 會先用 quiz 建立 strength / knowledge-gap 狀態，以 skill dashboard 持續更新，並優先推薦後續 lessons。其重要訊號不是「有 AI tutor」，而是 **測量狀態 → 可見 gap → 下一步** 形成單一路徑。

對 `cyber-prep-coach` 而言，這主要驗證既有 #4 / PR #13 的產品方向；不支持再建立另一個 AI tutoring surface。

### C. CONFIRMED — Gemini Notebook 新增 source-grounded quiz follow-up，而不是只生成更多內容

**發布：2026-09-15；查閱：2026-09-18。**

Source: https://blog.google/innovation-and-ai/products/gemini-notebook/new-study-tools-september-2026/

Gemini Notebook 新功能包含 source-grounded real-time notebook conversations、interactive quizzes / flashcards，以及完成 quiz / flashcards 後依 performance 詢問「接下來應專注哪裡」。Google 也預告 multiple-select 等更多 quiz 格式。

**可移植模式：**完成練習後應能用已觀察的表現決定 next-best study action，且重要解釋保持 source-grounded。

**不應照抄：**voice conversation、audio recorder、short video、cloud notebook 與 AI chat 都不是目前 iPAS 核心根因；現行產品已有固定題庫、核准解析與來源 receipts，不需要用生成式介面取代它們。

### D. CURRENT_VENDOR_SIGNAL — certification prep 常把「距考試多久」直接變成 plan input

Sources checked 2026-09-18:

- ProfTIA CompTIA Study Plan Generator: https://proftia.com/study-planner.html
- Big Walnut Works ISC2 CC study setup: https://study.bigwalnutworks.com/cc/

ProfTIA 目前要求 exam / weeks remaining / weekly hours，依官方 domain weighting 分配週期；Big Walnut Works 的 CC setup 直接要求 exam date 與 study intensity，生成 countdown / daily goals。這些頁面可證明產品模式存在，但沒有本輪可核對的公開發布日期或獨立成效研究，因此只列 `CURRENT_VENDOR_SIGNAL`，不拿來宣稱改善通過率。

**最小可移植點：**deadline 可以是現有 next-action planner 的一個輸入，而不是另做 calendar、AI coach 或通知系統。

### E. CONFIRMED — iPAS 官方最新中級題本狀態沒有改變，仍由 #12 正確承接

**查閱：2026-09-18。**

Sources:
- https://ipd.nat.gov.tw/ipas/certification/ISE/learning-resources
- https://ipd.nat.gov.tw/ipas/certification/ISE/exam-info

官方學習資源頁仍列出 `115-2公告試題_資訊安全規劃實務(115.09.04)` 與 `115-2公告試題_資訊安全防護實務(115.09.04)`；官方考試資訊仍列中級第二次考試為 115/08/22、兩科各需 70 分以上。這是上一輪 #12 的同一來源狀態，沒有新 root cause，不重複開單。

頁面仍顯示第二份 PDF 大小為 `2501 MB`；本輪仍不猜測是否為網站標示錯誤。#12 已要求以實際 byte length + SHA-256 的 bounded dry-run 取代頁面文字判斷。

## New Releases / Changes

| 日期 | 來源 | 變化 | 對本產品的含義 |
|---|---|---|---|
| 2026-09-15 | Google Gemini Notebook | quiz / flashcard 後可依 performance 決定接下來聚焦處 | 強化「練習結果 → 下一步」模式；不需要 AI chat 才能採用 |
| 2026-09-01 | Google Gemini Learning Notebooks | strength / gap dashboard + prioritized lessons | 驗證既有 #4 的 next-best-action 方向 |
| 2026-08-04 | Quizlet | automatic spaced review scheduling | 支持減少人工安排 review 的工作，但非獨立成效證據 |
| current | certification prep planners | exam date / weeks remaining 直接進 planner | 提供 target-date-aware planning 的相鄰設計訊號 |
| current check | iPAS first party | 115-2 兩科題本仍在線 | #12 狀態延續，無新 Issue |

## Community Pain

本輪沒有把 Reddit／論壇單則抱怨升成 prevalence 或優先級證據。現有 repo 已經能完成 20 題練習、錯題／不確定／收藏複習與 50 題訓練模擬；沒有真人證據顯示「target exam date 沒有參與推薦」已造成完成率下降或備考失敗。

可觀察的產品斷點比較窄：**目前 main 已保存 `targetExamDate` 並顯示剩餘天數，但今天該做什麼的邏輯沒有證據顯示會因距離考試 60 天、14 天或 3 天而改變。** 這是 opportunity candidate，不是已證實 BUG。

## Current Repository Evidence

Current `main@ab298d6070beff56e73061dd00756406fbbbef24`：

- PRD 明確把「開始頁知道今天最值得做的下一件事」列為核心 user goal。
- `app/lib/local-state.ts` 已有 `targetExamDate: string | null`。
- `CyberPrepApp.tsx` 目前會計算 `daysLeft` 並顯示考期倒數；沒有找到它進入 today-task 選題的 current-main 證據。
- Existing #4 已追蹤 local mastery / adaptive today task；因此「建立 learner model / next-best action」不是新問題。
- Open PR #13 (`devin/issue-4`, head `56a5dfc8f05eca90a129310784b2ae511e6019e4`) 正在實作 deterministic local mastery planner，順序為 weakness → uncertain → review_due → coverage_gap → unseen → revisit；其中 `review_due` 使用固定 14 天門檻，planner 本身沒有 target-exam-date input。
- PR #13 仍有一個實質 Codex review finding：單一錯題即可讓整個 topic bucket 被標成 weak，甚至把 unseen questions 當成弱項證據，和「sample insufficient 不假造 precision」的產品契約衝突。這是 **active implementation-branch finding**，不是 current-main P1 incident；在它收斂前不應再擴大 PR #13 的推薦權重邏輯。
- Open #3 / PR #9 仍處理 official-spec mock；#6 / PR #7 處理 explanation calibration；#10 / PR #11 處理 RSC upstream patch；#12 處理 115-2 ingestion decision。這些既有方向不被本輪改寫。

### Contrary evidence checked first

- 現有 rule-based today task 已能續作、優先錯題／不確定、新題；產品沒有因缺 deadline-aware planner 而不可用。
- #4 / PR #13 已大幅降低「今天做什麼」的手動判斷，不能因競品有 timeline 就另開一張同根因 Issue。
- 使用 `targetExamDate` 調整推薦可能帶來新的假精準：距考試近不代表應該任意放大某 topic、犧牲 coverage 或把 readiness 解讀成通過機率。
- 沒有真人 iPAS 使用資料證明日期感知會改善完成率或考試結果。

## Opportunity Map — `cyber-prep-coach`

| Bucket | Decision | 理由 |
|---|---|---|
| MUST MATCH | 官方題本／考制／來源 version truth | #3/#6/#12 已承接；新 recommendation 不得蓋過 source truth |
| MUST MATCH | 推薦 reason 不假造 mastery precision | PR #13 目前 review finding 應先收斂；一個錯題不能自動證明整 topic weak |
| SHOULD BE BETTER | **若 #13 收斂後仍保留 adaptive mode，評估把既有 `targetExamDate` 轉成 bounded planning input** | 可減少「我知道剩幾天，但仍要自己決定複習／新題比例」的人工步驟；不需要新帳號／雲端／AI |
| DIFFERENTIATOR | local-only、deterministic、source-aware、reason-coded exam planning | 比 generic AI tutor 更符合目前定位；所有推薦可從 learner state + official metadata 重播 |
| ADJACENT IDEA | 練習完成後直接顯示下一個建議 focus，仍使用已核准解析／來源 | Google/Quizlet 訊號；可由現有 UI 與 #4 planner 承接 |
| DO NOT COPY | AI tutor chat、podcast/video generator、social study groups、black-box readiness/pass probability、雲端帳號、通用 calendar system | 超出產品方向或缺乏決策級證據 |

## Four-Gate Decision

### Candidate：讓既有 target exam date 影響 adaptive study mix，而不是只顯示倒數

Stable fingerprint:

`cyber-prep-coach + stored targetExamDate / daysLeft + adaptive today-task planning + planner does not consume time-to-exam + candidate manually translates remaining days into review-vs-coverage intensity`

Classification:

```yaml
kind: OPPORTUNITY
severity: NOT_ESTABLISHED
decision_priority: LOW-MEDIUM
evidence: SOURCE_CONFIRMED_FOR_CURRENT_STATE + EXTERNAL_PATTERN_ONLY_FOR_VALUE
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
coordination: SKIPPED_LOCKED_ACTIVE_PR_13
```

### Gate 1 — problem / value

**Target user:** 已設定考期、使用本機進度／今日任務準備 iPAS 的考生。

**Observed manual break:** product 已知道 `daysLeft`，但現行 main 的 today-task 沒有把這個資訊轉成行動；PR #13 也以固定 14-day review horizon 運作。若使用者在 60 天、14 天、3 天前擁有相同 mastery state，產品沒有目前證據顯示會調整「新題 coverage、錯題 review、到期 review」比例，使用者仍需自行完成這個翻譯。

**Do-nothing consequence:** 目前只是可能的規劃摩擦，沒有真人完成率／成績影響證據，因此不成立 P2 以上 severity。

### Gate 2 — priority

- `severity=NOT_ESTABLISHED`；不是 current supported-flow BUG。
- `decision_priority=LOW-MEDIUM`：值得保留，因為所需資料已存在且外部 pattern 一致；但 #13 本身還有「單一錯題→topic weak」的 precision finding，#6/#12 等 trust/currentness 工作更重要。
- 不使用 vendor 宣稱的省時、成績提升或 readiness 分數作 Gate。

### Gate 3 — minimum approach

**現在不改程式。** 等 #13 ownership / review 收斂後，若仍要評估，只做一個 bounded synthetic decision experiment：

1. 固定完全相同 learner state / question bank。
2. 只改 `daysLeft` 為例如 60 / 14 / 3 天。
3. 比較「維持現況」與一個極小 deterministic deadline rule（例如只微調 review/new-coverage mix 或 review horizon）的輸出。
4. 每個差異必須仍有 reason code，可說明是因「距考試 X 天」而非黑箱 score。
5. 若行為沒有清楚價值、犧牲 coverage、或需要大量新狀態／排程器，**REJECT**。

不需要 calendar service、通知 daemon、新 DB、AI planning agent、target-score estimator 或 pass-probability model。

### Gate 4 — research / implementation separation

- **BUILD（僅支持下一步決策，不是自動授權）：** bounded fixtures 顯示 deadline input 能在不製造假 mastery、不犧牲 coverage 的前提下，穩定產生更合理且可解釋的 study mix，而且 owner 確認這符合產品方向。
- **NARROW：** 如果真正價值只在 UI 上提醒「進入最後複習期」，先做文案／一個 mode suggestion，不改 planner。
- **REJECT：** 若現有 #4 planner 已足以回答 today-task、日期只增加焦慮／複雜度，或沒有可驗證的不同決策。

**Result this round：NO NEW ISSUE。** #4 / PR #13 已是相同 next-best-study-action root scope，而且 PR #13 有 active implementation ownership 與尚未收斂的 review finding；本輪不留言、不搶鎖、不擴 scope。新證據只留中央 report。

## Adjacent Ideas

1. **Source-grounded performance follow-up without chat UI**：Gemini Notebook 的可移植部分不是對話，而是「完成 quiz 後直接指出下一個 focus」。Cyber Prep 可以由現有 approved explanation/source + deterministic planner 完成，不必增加 LLM runtime。
2. **Deadline awareness as an input, not a new subsystem**：如果未來 BUILD，只把已存在的 `targetExamDate` 當 planner input；不新增第二份 schedule state。
3. **Separate mastery confidence from urgency**：topic mastery evidence 與 time-to-exam urgency 應保持兩個維度；考期近不能把樣本不足升格成 weakness certainty。這一點尤其重要，因 PR #13 現有 review finding 已顯示 precision 邊界容易被誤用。

## Issue Mapping / Dedupe / Coordination

| Fingerprint / signal | Decision | Mapping |
|---|---|---|
| `115-2 official corpus freshness` | DEDUPE / unchanged | #12 |
| official 40q/90m exam pacing | DEDUPE | #3 / PR #9 |
| explanation/source trust calibration | DEDUPE | #6 / PR #7 |
| local mastery + next-best today task | DEDUPE / ACTIVE | #4 / PR #13 (+ older PR #8) |
| target exam date as bounded planner input | CENTRAL RADAR ONLY / SKIPPED_LOCKED | overlaps #4 / active PR #13; no issue/comment |
| generic source-grounded AI tutor / notebook | REJECT as separate feature | existing sources + planner already cover the transferable job |

Writes this round before report: **0 new Issue, 0 Issue edit/comment, 0 PR comment, 0 implementation authorization**。

No issue lock was acquired because no Issue/shared tracking object was modified. The active PR was explicitly treated as owned scope, not an invitation to expand it.

## Rejected Ideas

- **直接把 `targetExamDate` 塞進 PR #13** — rejected now: active scope and unresolved precision finding; would increase behavior surface before basic calibration is sound.
- **建立完整 exam calendar / notification scheduler** — rejected: no evidence the job needs a subsystem; existing local date is enough for any first experiment.
- **加入 AI tutor / voice conversation / podcasts / short videos because Google/Quizlet have them** — rejected: no root-cause evidence and conflicts with narrow trust-first positioning.
- **加入 readiness/pass probability** — rejected: no validated mapping from local practice to official pass probability; would create false precision.
- **用競品 vendor success claims 當成學習成效** — rejected: product capability / strategy signal is not independent outcome evidence.
- **另開 spaced-repetition Issue** — rejected: #4 / PR #13 already contains due review + adaptive next action; new name is not a new root cause.
- **重開 115-2 freshness work** — rejected: #12 already owns bounded ingestion decision.

## Cross-portfolio Ideas

本輪只保留一個可重用原則，不建立 cross-repo framework：**「deadline urgency」與「evidence confidence」必須分開。** 接近期限可以調整工作排序，但不能把薄弱證據升格成更高確定性。只有其他 repo 真正有 deadline-driven next-action workflow 時才局部採用，不建立中央 urgency engine。

## Sources

### Public web — primary intelligence sources

1. Quizlet, *Built for better learning: what's new on Quizlet this fall* — **2026-08-04** — https://quizlet.com/blog/built-for-better-learning-whats-new-on-quizlet-this-fall — `CONFIRMED_VENDOR_CAPABILITY`, not learning-effect proof.
2. Google, *So könnt ihr mit Lern-Notebooks in Gemini lernen* — **2026-09-01** — https://blog.google/intl/de-de/produkte/suchen-entdecken/lern-notebooks-gemini/ — `CONFIRMED_VENDOR_CAPABILITY`.
3. Google, *Sharpen your study routine with new Gemini Notebook tools* — **2026-09-15** — https://blog.google/innovation-and-ai/products/gemini-notebook/new-study-tools-september-2026/ — `CONFIRMED_VENDOR_CAPABILITY`; rollout notes retained.
4. ProfTIA CompTIA Study Plan Generator — checked **2026-09-18**, page publication date unavailable — https://proftia.com/study-planner.html — `CURRENT_VENDOR_SIGNAL` only.
5. Big Walnut Works ISC2 CC study setup — checked **2026-09-18**, page publication date unavailable — https://study.bigwalnutworks.com/cc/ — `CURRENT_VENDOR_SIGNAL` only.
6. iPAS first-party ISE learning resources — checked **2026-09-18** — https://ipd.nat.gov.tw/ipas/certification/ISE/learning-resources — `CONFIRMED_FIRST_PARTY`.
7. iPAS first-party ISE exam information — checked **2026-09-18** — https://ipd.nat.gov.tw/ipas/certification/ISE/exam-info — `CONFIRMED_FIRST_PARTY`.

### Internal GitHub evidence — product truth / direction / dedupe only

- `autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md` @ blob `8167e10798071d2276addaff6b201c6b0e904a2a`.
- `autodev-ng/docs/competitive-intelligence/2026-09-16T160903Z-external-radar.md` (previous deep cyber-prep radar / #12 creation).
- `autodev-ng/docs/competitive-intelligence/2026-09-18T100114Z-external-radar.md` (latest fair-rotation cursor into cyber-prep).
- `cyber-prep-coach main@ab298d6070beff56e73061dd00756406fbbbef24`.
- Current PRD, product-board audit, `OFFICIAL-EXAM-SPEC.md`, `app/lib/local-state.ts`, `app/CyberPrepApp.tsx`.
- Existing Issues #3/#4/#6/#10/#12; all-state/open PRs including #13/#11/#9/#8/#7/#5/#2.
- PR #13 comments/review at head `56a5dfc8f05eca90a129310784b2ae511e6019e4`.

## What Changed

1. Fresh external study-product research strengthens a small pattern: modern study products increasingly convert **observed learner state into an automatically scheduled next action**, and certification planners often also use **time-to-exam** as an input.
2. `cyber-prep-coach` already stores/display `targetExamDate` / `daysLeft`; this means a future deadline-aware experiment could be small and local, not a new architecture.
3. This does **not** establish a current defect or high severity. Current main is functional, no real-user harm is measured, and #4 / PR #13 already owns adaptive next-action work.
4. PR #13 currently has a more immediate precision problem: one wrong item can label an entire topic weak despite insufficient sample. Deadline weighting must not be added before this evidence calibration is sound.
5. Therefore this round creates **no new Issue and no comment**; the target-date idea remains a bounded `OPPORTUNITY / NEEDS_EVIDENCE` in central radar only.
6. iPAS 115-2 official source state remains unchanged and correctly deduplicated to #12.

## Classification / Scope Calibration

- New deadline-aware candidate: `OPPORTUNITY`, not BUG.
- Severity: `NOT_ESTABLISHED`.
- Decision priority: `LOW-MEDIUM` until #13 resolves and a bounded user/job decision exists.
- Triage: `NEEDS_EVIDENCE`.
- `auto_implementation=false`.
- No synthetic persona count, vendor KPI, guessed ROI or fabricated learning gain is used to pass the Gate.
- Existing active PR finding is not promoted to a current-main production incident.

## Completion / Gaps / Cursor

- Public-web exploration completed with recent first-party product sources plus current certification-planner signals.
- Fresh connected GitHub owner inventory pagination completed: **41 owned / 40 unarchived**, page 2 empty.
- Product direction, current HEAD, prior cyber radar, current Issues, all-state/open PRs, active PR #13 review, and relevant source paths checked.
- No product HEAD drift detected before report write.
- No live user study, learning-effect experiment, external provider call or deployed runtime was executed; claims remain bounded accordingly.
- Writes: **this unique radar report only**; no Issue / PR / product-state mutation.
- Next fair-rotation cursor: **`Reese-max/exam-archive`**.
