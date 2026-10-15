# 外部競品／新品／工作流靈感雷達 — 2026-09-16T16:09:03Z

## Scope / rules / evidence boundary

- 只處理 `Reese-max` 自有 repository；未操作第三方 repository。
- Issue Quality 規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`。
- 規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh owner pagination 已完整跑完：**42 accessible Reese-max-owned repositories；39 unarchived**；第二頁為空。Archived 仍為 `gemini-deidentifier`、`obsidian-vault`、`openab`。
- Working classification 沿用最近已校準的 **36 product-like + 3 support/compatibility-only**；本輪不以舊 inventory 取代 fresh pagination。
- 上一輪 cursor：`cyber-prep-coach`；本輪完成該 target。下一個公平輪巡 cursor：**`exam-archive`**（沿用上一個 cyber-prep 深度輪巡的既定 successor，而非重新猜測熱門 repo）。
- Target repo current default branch：`Reese-max/cyber-prep-coach main@ab298d6070beff56e73061dd00756406fbbbef24`。
- 本輪只做 GitHub read、公開網路研究、建立一張研究追蹤 Issue 與中央 radar report；沒有修改產品 code、CI/config、secrets、permissions/settings、implementation branch，沒有 merge/deploy、沒有啟動 worker/GOAL、沒有付費或 production write。
- 沒有實際下載／解析 115-2 PDF，也沒有執行 app/runtime；所有 ingestion 能力維持 `NEEDS_RUNTIME_VERIFICATION`。
- 不宣告 portfolio CLEAN。

## Owner/product direction checked

目前 owner-approved product-board decision 仍是：

- `cyber-prep-coach` 是 narrow、local-first、非官方的 iPAS 中級歷屆題庫／模擬練習產品；核心資產是可追溯題庫、來源 provenance、local learner state，而不是 generic AI tutor。
- 公開發布仍 HOLD 在內容校準、真機/鍵盤/讀屏/慢網路、營運名稱與個資聯絡窗口等門檻。
- NOW roadmap：#6 解析獨立校準、#3 官方規格 fidelity、既有 release blockers；保留 local-first 與 source provenance。
- DO NOT COPY：generic social feed、LMS、leaderboard、forced cloud account、AI tutor chat、marketplace。

本輪的新機會符合「trusted/current iPAS corpus」方向，但不推翻既有 release priorities。

## Current coordination / ownership state

Open/active PRs read before write：

- #11 / `fix/issue-10-rsc-cve` — upstream RSC CVE patch。
- #9 / `devin/issue-3-mock-mode` — official-spec mock mode。
- #8 / `devin/issue-4-mastery` — local mastery profile。
- #7 / `devin/issue-6-calibration` — version-bound explanation calibration machinery；仍有 substantive Codex review findings and human SME work outstanding。
- #5 / `feature/figma-study-ui-v1` — draft UI/release work。
- #2 / `feat/apple-study-core-ui` — draft UI/local-state work，會碰 `bankVersion` compatibility。

Issue #6 的舊 `github-issue-lock` 已有 release marker；但 #7/branch 仍是明確 active scope，所以本輪沒有修改 #6，也沒有把新 source refresh 塞入 #7。

No existing open/closed Issue, PR body, roadmap entry or default-branch code search matched the stable `115-2 source-corpus freshness` fingerprint. Pre-write exact search for `115-2` returned no matching Issue and no default-branch code hit.

## Executive decision

**建立 1 張窄研究 Issue；0 existing Issue 修改；0 implementation authorization。**

新 Issue：
- `Reese-max/cyber-prep-coach #12`
- `[Research][RESEARCH_REQUIRED] Validate 115-2 official paper ingestion through existing content gates`
- https://github.com/Reese-max/cyber-prep-coach/issues/12

分類：

```yaml
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: HIGH
evidence: SOURCE_CONFIRMED
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

理由不是「競品有所以我們也要有」，而是 **第一方 iPAS 已在 2026-09-04 公開 115-2 中級兩科公告試題，而 current main 仍只有 880 題／11 考次／22 科目題本且找不到 `115-2`**。這是核心 corpus freshness 的新決策點。

## External Signals

### A. First-party authority change — iPAS 已正式公開 115-2 中級兩科公告試題

**CONFIRMED — 經濟部產業發展署 iPAS；checked 2026-09-17。**

Sources:
- https://ipd.nat.gov.tw/ipas/certification/ISE/learning-resources
- https://ipd.nat.gov.tw/ipas/certification/ISE/exam-info

官方學習資源頁目前直接列出：

- `115-2公告試題_資訊安全規劃實務(115.09.04)`
- `115-2公告試題_資訊安全防護實務(115.09.04)`

官方考試資訊頁則確認 115 年中級第二次考試日期為 **2026-08-22**，兩科分別為資訊安全規劃實務、資訊安全防護實務；現行規格每科 40 題／90 分鐘的來源契約與 repo 既有 `OFFICIAL-EXAM-SPEC.md` 一致。

**Source-quality note:** 官方 learning-resources HTML 對 I22 顯示的檔案大小文字為 `2501 MB`，而 I21 顯示 `545 KB`。本輪沒有下載檔案，因此不推測這是網站顯示錯誤或真實大小；#12 明確要求以實際下載 byte length + SHA-256 取代頁面文字猜測。

**User job:** 準備下一場 iPAS 中級時，在同一個 local practice workflow 練到最新官方題目，而不是離開本站另找 PDF／二手題庫、再人工分開管理最新錯題與既有進度。

**Concrete step reduction:**
`官方頁找新題 → 另開 PDF/二手題庫 → 手動比對最新題型/錯題` potentially becomes `existing source pipeline → local practice/review`，但只有 dry-run 證明 pipeline 能安全 ingest 才能 BUILD。

### A2. Current alternatives move quickly on newly released papers

**COMMUNITY_SIGNAL — not authority / not quality proof.**

Sources checked 2026-09-17:
- 阿摩最新資料：https://yamol.tw/latest-1789455799.htm
- CCChen 115-2 分析（published/updated 2026-09-04）：https://vocus.cc/article/6a9a7809fd897800016a9188

阿摩目前已列出：

- `115-2 資訊安全工程師能力鑑定中級：資訊安全規劃實務` — 40 題
- `115-2 資訊安全工程師能力鑑定中級試題：資訊安全防護實務` — 40 題

CCChen 於 **2026-09-04** 記錄當日查閱 iPAS 官網最新公布 115-2 I21/I22，並清楚把後續命題趨勢判斷標示為個人分析而非官方預告。

**Interpretation:** 市場／社群替代工作流已能讓考生看到最新場次；這支持「freshness 有使用者工作價值」，但不證明阿摩或部落格答案可靠，也不構成採用其內容的授權。真值仍只取 iPAS first-party。

### B. Adjacent certification-prep pattern — freshness is increasingly productized, but vendor promises are not evidence

**LIKELY / vendor claims only.**

Examples checked this round:
- ExamCert: https://www.examcert.app/exam-prep/ — markets that vendor exam changes are reflected “within days”.
- Certcy: https://certcy.app/ — markets current exam/domain coverage, personalized plan, timed challenges.
- CyberCertPrep: https://cybercertprep.com/ — markets 2026 launch, large multi-cert corpus, adaptive path and simulation.
- CertStack: https://certstack.app/ — markets current CompTIA objectives, spaced repetition and adaptive recommendations.

**Transferable signal:** currentness / explicit exam-version coverage is part of certification-prep value.

**Do not overread:** these are vendor claims, not independent learning-effect or update-SLA validation. They do not justify subscriptions, accounts, AI chat, huge multi-cert scope or a source-update daemon for `cyber-prep-coach`.

### C. New tool/technology scan — no separate implementation candidate passed the gate

This round also rechecked generic 2026 exam-prep patterns such as AI tutors, readiness scores, gamification/leaderboards, mobile/offline apps and broad certification catalogs. None established a new Reese-max root cause that outranks the current trust/freshness/release work.

Decision: **do not force a C-category Issue** merely to satisfy a taxonomy. The useful new signal is authoritative content freshness, not a new technology stack.

## New Releases / Current Changes

| Date | Source | Change | Product implication |
|---|---|---|---|
| 2026-09-04 | iPAS first party | Published 115-2 intermediate I21 + I22 announcement papers | Current 11-session local corpus should make an explicit ingest/defer decision |
| 2026-09-04 | CCChen | Same-day analysis of newly published 115-2 official papers | Shows external study workflow moved immediately; analysis itself is not authority |
| current check | 阿摩 | Lists both 115-2 subjects, 40 questions each | Community alternative already reduces “wait for latest paper” friction; not answer truth |
| current check | generic cert-prep vendors | Freshness / exam-objective coverage marketed as core value | Reinforces freshness value only; no architecture mandate |

## Community Pain / Market Signal

No prevalence claim is made. This round did not find evidence that Reese-max users are abandoning the product because 115-2 is absent.

What is observable instead:

- authoritative 115-2 papers exist now;
- the current repo does not contain `115-2` on `main`;
- at least one community quiz surface already exposes both papers;
- a same-day iPAS learner/author wrote an analysis from the newly published papers.

Therefore the gap is **decision-worthy but not severity-proven**.

## Current Repository Evidence

At `main@ab298d6070beff56e73061dd00756406fbbbef24`:

- README: **880 questions, 11 exam sessions, 22 subject papers**; 667 single-select, 213 multiple-select; all 880 in safe scoring pool.
- `public/data/question-bank/index.json`: `datasetVersion=1635bc64296d7ac1`, `totalQuestions=880`, `sourceDocuments` begins with the official 115-1 I22/I21 papers.
- Default-branch code search for exact `115-2`: **no result**.
- Existing official spec says 115 year has two intermediate exam dates: 2026-04-11 and 2026-08-22; the corpus currently contains 115-1 but not the newly published 115-2 source pair.
- `OFFICIAL-EXAM-SPEC.md` is version/date explicit and already warns not to carry conclusions into a later annual guide without recheck.
- `RELEASE-BLOCKERS.md` still correctly says internal validation only and requires real-device/accessibility/privacy operational work before public checkpoint.

Contrary evidence / caution:

- 880 existing questions still provide a functional study corpus; missing 115-2 is not proof of broken core practice.
- No human usage data establishes a completion-rate impact.
- New dataset ingestion would change `datasetVersion` and interact with local progress compatibility plus version-bound explanation calibration; those boundaries are active work and cannot be ignored.

## Opportunity Map — cyber-prep-coach

### MUST MATCH

- First-party iPAS sources remain the authority for question identity / announcement answers; secondary/community copies are never promoted to truth because they are easier to scrape.
- If 115-2 is eventually activated, source URL/date/hash/byte length and rights/content review state must be as traceable as existing papers.
- A new datasetVersion must not silently relabel incompatible old learner progress as current.
- Explanation/calibration status must be version-bound; a prior dataset’s calibration artifact cannot silently cover newly added questions.

### SHOULD BE BETTER

- Make the “latest official session covered” state explicit enough that a future maintainer can tell whether corpus freshness is intentional, pending, or stale without scanning 22 source entries manually.
- Prefer existing `data:verify-sources`, `review:prepare`, rights/content gate and datasetVersion mechanisms before adding any ingestion architecture.
- If official material is newly published but not yet safe to activate, expose that as an internal release decision rather than pretending the corpus is fully current.

### DIFFERENTIATOR

- Reese-max can be more trustworthy than generic quiz sites by combining **current official paper + immutable source receipt + local-first learner data + explicit unverified/calibrated content state**.
- “Newest” should never mean “copied fastest”; it should mean “newest source that passed the existing bounded evidence gates”.

### ADJACENT IDEA

- Later, if repeated official-session misses become a real maintenance cost, a tiny source-freshness assertion may be worth researching. **Not now**: one current source gap does not justify a scheduler/watcher service.
- 115-2 could become a useful real fixture for the already-known cross-dataset compatibility boundary after active ownership clears; do not expand PR #2 to do this automatically.

### DO NOT COPY

- Do not build a crawler/scheduler/registry/database simply because external quiz sites update quickly.
- Do not ingest community answers or explanations as authoritative content.
- Do not copy generic AI tutor, readiness probability, leaderboard/social feed, cloud account or multi-cert marketplace scope.
- Do not bypass current rights/content/calibration gates to claim 115-2 coverage faster.
- Do not treat “latest paper imported” as proof of explanation correctness or official endorsement.

## Four-gate decision — 115-2 ingestion research

### 1. Problem / value

- **Target user:** iPAS intermediate candidate preparing after the 2026-08-22 exam who wants the newest official practice material in the same workflow.
- **Observable gap:** first-party 115-2 source pair exists; current main has 11 sessions / 22 source papers and no `115-2` hit.
- **Existing alternative:** user can leave the product and use official PDFs / community quiz sites separately.
- **If not addressed:** the product’s corpus remains less current than the available first-party source; latest-session trend/practice is external. No quantified learning harm is claimed.
- **Contrary evidence:** the existing 880-question corpus is still usable and the product never promised real-time sync.

Gate: **PASS for bounded research; not enough for defect severity.**

### 2. Priority

```yaml
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: HIGH
triage: NEEDS_EVIDENCE
auto_implementation: false
```

Why not P1/P2:
- no production incident;
- no measured learner failure;
- freshness is important to core positioning, but current product remains usable;
- external availability alone is not a causal severity proof.

### 3. Minimum solution

Compare in order:

1. **No change / explicit defer** — valid if owner decides the product need not cover every new session.
2. **Docs-only** — insufficient if the goal is to let users actually practice 115-2; useful only as a temporary internal freshness note.
3. **Preferred research:** download exactly the two official PDFs and run existing ingestion/review tooling in isolation/dry-run; record deterministic parse/review gaps.
4. **Small data update** — only after BUILD decision and separate implementation authorization.
5. **Crawler/watcher/service/new DB** — rejected now as unnecessary maintenance scope.

### 4. Research / implementation separation

#12 only asks whether the two official PDFs fit the existing pipeline and what current evidence becomes stale. It has explicit BUILD / NARROW / REJECT/DEFER exits.

- `BUILD` does not authorize implementation.
- #6/PR #7 remains active and version-bound; no changes made.
- PR #2 owns part of local-state/bankVersion boundary; no changes made.
- #3/#4 remain distinct root causes.

## Issue Mapping

| Fingerprint | Mapping | Result |
|---|---|---|
| `cyber-prep-coach + official corpus + iPAS 115-2 published 2026-09-04 + main no 115-2 + latest session absent` | NEW narrow research | [#12](https://github.com/Reese-max/cyber-prep-coach/issues/12) |
| official exam pacing / 40q 90m | DEDUPE | #3 / PR #9 active |
| mastery / adaptive next task | DEDUPE | #4 / PR #8 active |
| explanation independent calibration | SKIPPED_LOCKED / DEDUPE | #6 / PR #7 active |
| cross-dataset local progress compatibility | ACTIVE-SCOPE boundary | PR #2 touches path; no new Issue this round |
| RSC CVE patch | ACTIVE | #10 / PR #11; unrelated |

Issue #12 write was read back successfully: real issue number and URL confirmed. No blind retry was required.

## Rejected / Deferred Ideas

1. **Auto-ingest every new iPAS PDF — REJECT NOW.** One missed/current session does not establish the need for a daemon/scheduler.
2. **Use 阿摩 as the source because it already has 115-2 — REJECT.** Community availability is not authority or rights/provenance proof.
3. **Copy CCChen’s topic-trend analysis into mastery weights — REJECT.** Secondary interpretation is not an official blueprint and would turn analysis into hidden training policy.
4. **Open a new exam-version migration framework Issue — DEFER / DEDUPE.** Cross-version learner-state risk is already known and PR #2 is active; 115-2 is a useful future fixture, not permission to expand scope now.
5. **Automatically regenerate/approve AI explanations for 115-2 — REJECT.** #6/PR #7 calibration semantics are active and unresolved; new dataset content cannot inherit old approval/calibration state.
6. **Add generic AI tutor / readiness score / leaderboard — REJECT.** Owner direction and current bottlenecks say trust/currentness first.

## Cross-portfolio idea

### Authority freshness is separate from source provenance

Potential reusable principle:

`source is authoritative + hash is valid != corpus is current`

A versioned product can have perfect hashes for every stored source and still omit a newly published authoritative revision/session. This is relevant to legal/research/public-data products too, but **no umbrella framework Issue is justified**. Only reuse the principle when another repo shows an actual user workflow gap.

## Sources

### First-party / authoritative

1. iPAS 資訊安全工程師－學習資源（checked 2026-09-17）  
   https://ipd.nat.gov.tw/ipas/certification/ISE/learning-resources  
   Current page lists both 115-2 intermediate announcement papers dated 115.09.04.
2. iPAS 資訊安全工程師－考試資訊（checked 2026-09-17）  
   https://ipd.nat.gov.tw/ipas/certification/ISE/exam-info  
   Confirms 115 intermediate second exam date 2026-08-22 and both subject names.

### Secondary / community / competitor signals

3. CCChen, `115-2 iPAS資安中級公告題目` — published/updated 2026-09-04  
   https://vocus.cc/article/6a9a7809fd897800016a9188  
   Same-day secondary analysis; explicitly distinguishes official questions from author interpretation.
4. 阿摩最新資料 — checked 2026-09-17  
   https://yamol.tw/latest-1789455799.htm  
   Lists both 115-2 intermediate papers at 40 questions each; community alternative only.
5. 沈老師 iPAS 試題解答網 — checked via current search snapshot  
   https://ipas.tw/  
   Markets “115 年最新試題” / mobile-friendly categorized question practice; snapshot does not prove 115-2 inclusion, so no such claim is made.
6. ExamCert — checked 2026-09-17  
   https://www.examcert.app/exam-prep/  
   Vendor marketing claim that exam updates are reflected within days; not independent evidence.
7. Certcy — checked 2026-09-17  
   https://certcy.app/  
8. CyberCertPrep — checked 2026-09-17  
   https://cybercertprep.com/  
9. CertStack — checked 2026-09-17  
   https://certstack.app/  

## What Changed

Compared with the prior cyber-prep radar (`2026-09-15T121112Z-external-radar.md`):

- **Material correction:** that round stated no official iPAS change was observed and checked the annual guide; this round checked the first-party **learning-resources** surface and found that 115-2 intermediate I21/I22 had already been published on **2026-09-04**.
- This does **not** overturn the owner product direction; it changes the current corpus-freshness evidence.
- A new narrow research fingerprint now passes the Issue gate because first-party source existence + repo absence + core corpus fit are all evidenced.
- No broad ingestion architecture is approved.

## Completion / gaps / cursor

Completed:
- Issue Quality v2 read; rules blob recorded.
- Fresh owned-repo pagination completed: 42 owned / 39 unarchived.
- Current owner/product direction, default branch, issues, open PRs/branches, #6 comments and PR #7 comments inspected.
- External search went beyond GitHub and used first-party iPAS pages plus community/market alternatives.
- Exact `115-2` dedupe search completed before write.
- #12 created and read back successfully.
- Central report added as a unique historical file.

Still missing / deliberately not claimed:
- actual 115-2 PDF download URLs from the rendered download buttons;
- actual byte lengths / SHA-256;
- parser dry-run results;
- image/third-party-content count;
- announcement-answer ambiguity/correction status;
- runtime/UI behavior after a new datasetVersion;
- SME calibration for any newly added explanations.

Status for #12: **NEEDS_EVIDENCE / NEEDS_RUNTIME_VERIFICATION**.

Next fair-rotation cursor: **`exam-archive`**.
