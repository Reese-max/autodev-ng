# 外部競品／新品／工作流靈感雷達 — 2026-09-23T22:02:54Z

## Status / scope / evidence boundary

- 狀態：**COMPLETE / MATERIAL VALIDATION OF EXISTING SCOPE / NO NEW ACTIONABLE ISSUE / NO USER NOTIFICATION**。
- Issue Quality v2：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`；rules blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh connected-owner pagination：**42 Reese-max-owned repositories / 41 unarchived / 1 archived**；offset 100 第二頁為空。舊 inventory 不作全集。
- 公平輪巡：先重新核對 `exam-archive`；它自 2026-09-22 雷達後沒有產品程式變更，且 #1/#3 與 PR #6 仍是 active scope，因此不重複開單。`police-exam-practice` 已明確融合為 `police-exam-archive` 的舊網址相容入口，不作獨立產品 finding。本輪實際 eligible focus 為 **`Reese-max/police-exam-archive`**。
- `police-exam-archive` current default branch：`master@a0b5dbb9352b5558dbe62445c6452947dbd2501b`；HEAD 為 audit-only 文件，最近產品基線仍在其前方既有實作。Owner direction 維持 **INVEST / SIMPLIFY**：官方來源、版本新鮮度、台灣警察考試可追溯性是核心；不把未有證據的 AI 詳解、通用 LMS 或帳號型學習平台當 archive truth。
- 本輪沒有執行 production、CI 觸發、登入／付費 provider、真人使用研究、merge/deploy、worker/GOAL 或產品 source/config 修改。外部產品宣稱只作產品能力訊號，不作學習成效證明。

## Executive decision

**0 new Issue、0 existing Issue/PR comment、0 implementation authorization。**

2026-09-23 WAYDA 的新學習系統與 Google 2026-09-15/18 的 Gemini Notebook 學習工具，均強化同一個市場方向：完成一次練習後，產品會把錯題／收藏／近期表現轉成「下一步該複習什麼」，而不是只留下總分。然而這不是 `police-exam-archive` 的新 root cause：既有 #60 已精確追蹤 aggregate-only history → per-question attempt/review state → deterministic next-review queue，且 open PR #66 正在處理設計，研究 comments 已兩次 NARROW schema/identity 邊界。

因此新訊號只作 **external validation**，不把 #60 的大型設計重新擴回完整 adaptive-learning platform，也不因競品存在就升級 severity 或取得實作權。外部訊號本身分類：`kind=OPPORTUNITY / severity=NOT_ESTABLISHED / decision_priority=MEDIUM / triage=NEEDS_EVIDENCE / auto_implementation=false`。

## Product → market category mapping

| Product | Market / workflow | Radar role |
|---|---|---|
| `police-exam-archive` | official police-exam corpus + search + mock exam + analytics | focal product；守 provenance / freshness / local-first practice truth |
| WAYDA | Taiwan police/civil-service commercial prep suite | direct workflow competitor：course → practice → mock → wrong/favorite review |
| Gemini Notebook | source-grounded study workspace | adjacent pattern：quiz result → conversational performance review → next focus |
| Quizlet Learn | adaptive practice | established adjacent baseline；本輪無新 root cause |
| Anki community | spaced review / backlog management | anecdotal pain signal only；不推估 prevalence |

# External Signals

## A. WAYDA 2026-09-23 learning-system upgrade — CONFIRMED vendor capability

Source: https://www.wayda.com.tw/wayda-learning-system-upgrade/  
Published: **2026-09-23**；checked: **2026-09-24**。

WAYDA 把課程、章節練習、模擬測驗、歷屆題、錯題本、收藏與成績紀錄整合在同一個學習路徑；練習後可回到錯題／收藏，並以既有錯題或收藏重組測驗。其申論流程另包含線上作答、手寫照片、AI 評分與老師批閱。

### User job / manual work reduced

使用者不必把「剛剛答錯的題目」手抄到另一個筆記或再手動搜尋原題，系統直接把上一輪行為變成下一輪可執行題組。

### Transfer / do not copy

- **Transfer:** completed-attempt identity、wrong/review intent、可解釋的 next-step queue。
- **Do not copy:** 影片課程/LMS、AI 申論評分、老師 marketplace、帳號雲端 profile；這些不是此 repo 已證實的瓶頸。
- **Pricing signal:** 商業競品把整合式 workflow 作為付費價值；`police-exam-archive` 更合理的差異化仍是免費／local-first／官方來源可追溯，而非追功能廣度。

## B. Gemini Notebook new study tools — CONFIRMED first-party capability

Sources:
- https://blog.google/innovation-and-ai/products/gemini-notebook/new-study-tools-september-2026/ — **2026-09-15**
- https://workspaceupdates.googleblog.com/2026/09/new-back-to-school-features-and-learning-tools-available-in-Gemini-Notebook.html — **2026-09-18**

Google 新增更多 quiz 格式，並讓使用者在完成最近一次 quiz / flashcards 後直接詢問自己的表現，以判斷接下來該把注意力放在哪裡。這證明「結果 → 下一步 focus」已進入大型學習產品，但官方功能公告不是獨立成效 benchmark。

對本產品可移植的最小模式仍是 deterministic：**attempt facts → reason codes → next official questions**，不必導入 conversational tutor 或生成新題。

## C. Quizlet Learn — CONFIRMED current baseline, not new

Source: https://quizlet.com/features/learn  
Checked: **2026-09-24**。

Quizlet 依過往作答把練習聚焦到較困難內容，並以可執行的短 session 呈現。此訊號早已包含在 #60 的外部證據；本輪只確認市場方向仍成立，不重複立案。

# New Releases / strategy changes

| Date | Product / change | Confidence | Product implication |
|---|---|---|---|
| 2026-09-23 | WAYDA 學習系統把錯題／收藏／模擬考與課程整成閉環 | CONFIRMED vendor capability | 強化 #60 的 workflow relevance；不批准 full LMS / AI tutor |
| 2026-09-15 / 09-18 | Gemini Notebook 可在 quiz 後詢問 performance 並決定 next focus | CONFIRMED first-party capability | 支持 result→next-focus；可用 deterministic queue 回應，不必生成式 tutor |
| current | Quizlet Learn 仍以歷史表現聚焦較難內容 | CONFIRMED baseline | 已知證據，無實質新 root cause |

# Community Pain

2026-09-22 的 Anki 社群討論出現短週期課程／考試與 review backlog 衝突、每日複習負擔過高的敘述。這只列 `COMMUNITY_SIGNAL`，不代表警察特考考生普遍發生率，也不足以獨立支持新功能。它最多強化 #60 已有的 deadline/backlog 研究問題，不支持複製 FSRS 或推估學習 ROI。

Source: https://www.reddit.com/r/Anki/comments/1wn1caf/scheduling/

# Adjacent Ideas

## Available-time review capsule — HOLD

WAYDA 2026-09-22 對輪班／零碎時間考生的內容把工作拆成「依可用時間挑任務、加班時保留可完成的複習／訂正」。這是可移植的 session-sizing 想法，但目前不需要獨立 Issue：若 #60 最終通過需求 gate，只需把現有 daily question/time budget 作為 queue 的輸入即可；若 #60 REJECT，這個相鄰點子一起保留而不建 planner。

# Opportunity Map

| Bucket | Decision |
|---|---|
| **MUST MATCH** | 官方來源／答案 provenance、最新年度 coverage truth、題目 identity 不漂移 |
| **SHOULD BE BETTER** | 完成 quiz 後能回到具體弱題，而非只留 aggregate score；**existing #60 / PR #66** |
| **DIFFERENTIATOR** | no-login / local-first + official MOEX corpus + deterministic reason code + source/version receipt |
| **ADJACENT IDEA** | 依今日可用題量／分鐘數縮成可完成 review capsule；只有 #60 需求成立後才重用 |
| **DO NOT COPY** | AI 預測錄取率、unsourced AI explanations、teacher/LMS marketplace、mandatory cloud account、全套 FSRS 移植 |

# Cross-portfolio ideas

只有一個值得保留但不立案的共用契約：**answer outcome 與 review intent 分離，source locator 與 per-item content fingerprint 分離**。這已由 #60 的既有 NARROW research receipts證明，不需要再做 portfolio-wide ledger/framework。未來只有其他 repo 出現相同 validated workflow gap 時才重用 schema 思路。

# Four-gate decision

1. **Problem / value:** current repo `saveHistory()` 只留 aggregate score/time 的缺口已有 #60；新外部訊號沒有找到第二個獨立根因。現有正式題庫、search/quiz/analytics 已提供替代基礎，且 owner 要求 provenance-first。
2. **Priority:** 外部機會本身 `NOT_ESTABLISHED`。競品存在與近期發布不能把它升成 P1/P2；沒有真人發生率、completion delta 或 incident evidence。
3. **Minimum:** 若後續 BUILD，只先保存已完成題目的最小 per-question facts + review intent，重用既有 QuizEngine/local storage，建立 deterministic reason queue。不要先做新 DB、雲端 account、generic learner model 或 AI tutor。
4. **Research / implementation separation:** #60 已有 NARROW receipts；PR #66 為 active design scope，因此本輪 `SKIPPED_LOCKED`，不留言、不重寫 scope。任何 BUILD 結論也不自動授權產品實作。

# Rejected Ideas

- **新 AI tutor / 自動詳解**：沒有 repo/user evidence，且會弱化 official-source truth。
- **把 WAYDA 整套 LMS 搬進 repo**：課程影片、老師批閱、帳號/付款不是目前產品核心。
- **新建跨 repo Attempt Ledger framework**：現階段只有已有 scope，先重用局部 schema；framework 名稱不是價值證據。
- **直接導入 FSRS**：deadline exam workflow 與長期 spaced repetition 不是同一問題；先證明 deterministic queue 不足。
- **另開「available-time planner」Issue**：可被 #60 的 daily budget 最小延伸吸收，現在拆單只會擴 scope。

# Issue Mapping / coordination

- `police-exam-archive #60`：新 WAYDA / Gemini Notebook signal 映射到同 fingerprint；open PR #66，已有 NARROW research receipts。**SKIPPED_LOCKED / NO COMMENT**。
- `#58` image-choice fidelity、`#61` corpus denominator truth、`#69` active-session recovery、`#74/#75` Analytics cache correctness：與本輪外部 signal 根因不同，不合併、不升級。
- `exam-archive #1/#3` + PR #6：active scope；本輪只核對，未搶改。
- `police-exam-practice`：README 已明確是 canonical `police-exam-archive` 的相容 redirect，不建立獨立 finding。

# Sources

1. WAYDA, 學習系統升級，2026-09-23 — https://www.wayda.com.tw/wayda-learning-system-upgrade/
2. WAYDA, 題庫系統更新指南，2026-09-15 — https://www.wayda.com.tw/wayda-question-bank-system-update-guide/
3. Google, New study tools in Gemini Notebook, 2026-09-15 — https://blog.google/innovation-and-ai/products/gemini-notebook/new-study-tools-september-2026/
4. Google Workspace Updates, Gemini Notebook learning tools, 2026-09-18 — https://workspaceupdates.googleblog.com/2026/09/new-back-to-school-features-and-learning-tools-available-in-Gemini-Notebook.html
5. Quizlet Learn, current product page, checked 2026-09-24 — https://quizlet.com/features/learn
6. Reddit r/Anki scheduling discussion, 2026-09-22 — https://www.reddit.com/r/Anki/comments/1wn1caf/scheduling/ (`COMMUNITY_SIGNAL` only)

# What Changed

- Fresh signal: WAYDA 2026-09-23 makes wrong/favorite→next quiz a more explicit Taiwan exam-prep market pattern.
- Fresh first-party adjacent signal: Google 2026-09-15/18 exposes quiz-performance→next-focus directly in Gemini Notebook.
- No product default-branch change affecting the conclusion; `police-exam-archive` remains `master@a0b5dbb9352b5558dbe62445c6452947dbd2501b` at inspection.
- No new root cause, no severity escalation, no new implementation right.

# Completion / gaps / cursor

- Owner inventory: complete pagination, **42 / 41 unarchived**.
- External exploration: direct competitor + adjacent first-party learning tool + established baseline + explicitly anecdotal community signal completed.
- Issue/PR dedup: #60/PR #66 active; other current P2s remain independent.
- Runtime evidence: **NEEDS_RUNTIME_VERIFICATION** for any future review-loop implementation; no runtime execution was performed this round.
- New Issue: **0**. Existing Issue/PR write: **0**. Product source/config write: **0**.
- Next fair-rotation target: **`Reese-max/92-duty-scheduler`**.
