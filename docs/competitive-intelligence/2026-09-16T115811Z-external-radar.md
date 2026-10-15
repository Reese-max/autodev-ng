# 外部競品／新品／工作流靈感雷達 — 2026-09-16T11:58:11Z

## Scope / rules / evidence boundary

- 只處理 `Reese-max` 自有且未封存 repository；未操作第三方 repository。
- Issue Quality 規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`。
- 規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh owner pagination：**42 accessible Reese-max-owned repositories；39 unarchived**；第二頁為空。archived 仍為 `gemini-deidentifier`、`obsidian-vault`、`openab`。
- Working classification 沿用最近校準：**36 product-like + 3 support/compatibility-only**；本輪沒有足夠證據改分類。
- 上一輪 cursor：`lplrs-judicial-sync`；本輪完成該 cold-rotation target。下一個 cursor：**`adng-memory`**。
- `lplrs-judicial-sync` current default branch：`main@dba353eea21e5df6a1994a92b472ca3a5bf9066a`；此 HEAD 是 audit-doc commit，最近產品 baseline 仍為 `840ab6fcfb8b64c97c39611fc93fc0d7de6f3025`。
- Owner/product direction 沿用現有 portfolio 決策：司法資料同步必須優先維持 retention/deletion/source lifecycle truth；不把 repository 擴張成法律聊天、KeyCite/Shepard’s clone 或通用 legal-data SaaS。
- 活躍工作：#1 + PR #7（takedown erasure）、#3 + PR #4（AuthorityReceipt / SourceSpan）、#5 + PR #6（scheduled-sync outage / coverage receipt）。本輪不修改這些 Issue/PR，不搶 scope。
- 本輪只做 GitHub read、公開網路研究與中央 radar report；沒有改產品程式、CI/config、secrets、settings、branch，沒有 merge/deploy、沒有啟動 worker/GOAL，也沒有下載/提交裁判書全文。
- 不宣告 portfolio CLEAN。

## Executive decision

**0 新 Issue；0 existing Issue 修改；1 個高價值外部新證據，因與 #5 / PR #6 的 recovery/backfill acceptance scope 重疊且該工作活躍，標記 `SKIPPED_LOCKED / DEDUPE`，只保留中央報告。**

核心變化：repository README 對 **JList daily path** 的描述「漏跑一天就永久漏一天」仍成立；但 2026 年目前的司法院資料開放平臺第一手頁面同時列出按月裁判書包與 `Delete-Infor裁判書`，而且較舊月份會以同一近期 Update 日期重新打包。這足以推翻「整個官方資料生態系完全沒有延後 reconciliation 路徑」的預設，但**尚未證明任一漏掉的 JList target date 一定可由月包完整恢復**。

因此目前最小下一步不是新建第二套 sync service，而是：等 #5 / PR #6 scope 可安全接續時，用一個 body-safe、read-only fixture 驗證「missed JList day → current official monthly package + Delete-Infor → 是否能辨識/恢復 exact target-date coverage」。

## Current repository evidence

### Product contract

`README.md` 明確定義：

- JList API 只回「固定 7 天前那一天」的異動清單，不是 rolling seven-day window；
- 因此目前產品設計寫成「漏跑一天就永久漏一天，沒有補救窗口」；
- 三個 daily triggers（台北 00:30 / 03:00 / 05:00）的目的，是在單日 API 服務窗口內提高至少一次成功機率；
- current persistence 仍以 `docs.jsonl.gz / removed.jsonl / meta.json` 為主，下游依 removed 訊號刪除 PostgreSQL 內容。

### Current active remediation

#5 已是 source/runtime-supported P1：多次 GitHub Actions admission failure 讓 daily sync 無成功 receipt；其 acceptance criteria 已要求「判定哪些 target dates 缺 verified success，並記錄 supported recovery/backfill path」。

PR #6 正在處理 coverage receipt / outage diagnosis，但 Codex review 已指出一個關鍵 P1：文件不能用 `cloud_fetch_judicial.py --date <old-date>` 假裝 backfill，因 JList request 本身沒有日期參數；該 option 只會改 output directory / metadata，實際仍抓 current T-7，可能把當前資料誤寫到舊日期。

因此任何新的「月包 recovery」研究若另開 Issue，會與 #5 的 recovery/backfill 工作直接重疊；同時 PR #6 尚未完成 review。依跨排程協調規則，本輪不改 #5、不留言、不開同根因平行單。

### Dedupe / branches

Open branches currently include：

- `devin/issue-1-takedown-erasure`
- `devin/issue-3-authority-receipt`
- `devin/issue-5-restore-sync`
- `github-1-erasure-boundary`
- `main`

Code search 找不到 `monthly` 或 `Delete-Infor` implementation；`backfill` 只命中 #5 audit docs。Open/closed issue search 也沒有獨立的 monthly-package recovery fingerprint。這表示訊號是新的，但它最合理的追蹤 owner 仍是既有 #5 recovery acceptance，而不是新 issue 數量。

## External Signals

### A. Direct / current official source — monthly judgment packages are still present in 2026

**CONFIRMED — Judicial Yuan Open Data Platform, checked 2026-09-16.**

Source:
- https://opendata.judicial.gov.tw/dataset?categoryTheme4Sys%5B0%5D=051&page=1&sort.publishedDate.order=desc

Current first-party dataset listing shows, among other items:

- `202606裁判書--(20260816Update)`
- `Delete-Infor裁判書`
- `202605裁判書--(20260816Update)`
- `202604裁判書--(20260816Update)`
- `202603裁判書--(20260816Update)`
- ...older monthly packages with the same 2026-08-16 update marker.

The page also exposes fields such as case ID, judgment date, title, full text and PDF locator, and shows metadata timestamps around 2026-08-15 for these datasets.

**What this proves:** the current official platform still exposes monthly judgment package surfaces and a deletion-information dataset, and earlier months can be represented with a later update marker.

**What this does not prove:** a package downloaded today necessarily reconstructs every item that a specific failed JList day would have returned, or that the package’s effective deletion/revision semantics are identical to JList. That requires a bounded real comparison.

### B. Adjacent official design — the bulk channel was explicitly designed to be re-packed

**CONFIRMED historical official design — Government Open Data Platform; checked 2026-09-16.**

Source:
- https://data.gov.tw/datasets/history/94184

The historical Judicial Yuan dataset documentation says complete judgment datasets were available for download and describes a monthly production model where new compressed files were created and prior compressed files re-packed; update dates in filenames told consumers to download the latest version. The dataset is now marked historical/down-listed due to consolidation, so this is **not** evidence that the old exact endpoint is still supported.

**Transferable signal:** a bulk snapshot can be an eventual reconciliation surface even when the low-latency incremental feed has a narrow time window.

### C. Current official policy context — monthly bundle + API were intentionally complementary

**CONFIRMED official policy statement, published 2021-01-08 / updated 2021-01-11; checked 2026-09-16.**

Source:
- https://www.judicial.gov.tw/tw/cp-2049-354488-cc074-1.html

Judicial Yuan stated that judgments were packaged monthly for download **and** made available by API, while warning that judgment contents can change and sometimes require urgent removal. This is old policy documentation, but it explains why current monthly packages and `Delete-Infor` must be evaluated together rather than treating bulk download as an immutable archive.

### D. Direct market signal — Taiwan legal retrieval products now expose very large, current corpora

**LIKELY product signal / vendor claim — Taiwan Legal RAG, release current in September 2026; checked 2026-09-16.**

Source:
- https://pypi.org/project/twlegalrag/

The current package advertises a free/no-signup MCP and CLI backed by roughly 22.5M Taiwan judgments, with a production count as of 2026-09-01. Its built-in citation check only verifies membership in the retrieved bundle and explicitly does not claim semantic/legal correctness.

This is useful as a competitive design signal: users increasingly expect a continuously refreshed judgment corpus that can be consumed by agents without manual exports. It is **not** independent evidence that `lplrs-judicial-sync` should mirror 22M records or adopt the vendor’s backend.

### E. Adjacent legal-data workflow — API/MCP distribution is becoming a projection over a governed corpus

**CONFIRMED — Free Law Project / CourtListener, published 2026-05-07 and 2026-05-12; checked 2026-09-16.**

Sources:
- https://free.law/2026/05/07/api-included-in-memberships/
- https://free.law/2026/05/12/courtlistener-is-now-available-inside-claude/

CourtListener opened broader API access to members and then shipped an MCP connector using the same legal-data substrate. The useful pattern for Reese-max is not “add MCP now”; it is to keep ingestion/reconciliation truth below any later API/MCP projection.

## New Releases / current changes

| Date | Source | Change / current evidence | Product implication |
|---|---|---|---|
| current listing checked 2026-09-16 | Judicial Yuan Open Data Platform | Monthly judgment datasets such as `202606...(20260816Update)` plus `Delete-Infor` are present | A delayed reconciliation path may exist outside JList |
| 2026-09-01 corpus date / current package checked 2026-09-16 | Taiwan Legal RAG | ~22.5M Taiwan judgments via MCP/CLI | Market expects broad current corpus access; vendor claim only |
| 2026-05-07 / 2026-05-12 | Free Law Project | Broad CourtListener API access + MCP projection | Distribution should reuse corpus truth, not duplicate it |

## Community Pain

No Reddit/community prevalence claim was needed for this decision. The core signal is already supported by a current first-party Judicial Yuan dataset listing plus deterministic repository/review evidence. Community anecdotes would not establish exact recoverability, so they were intentionally not used as frequency evidence.

## Opportunity Map — lplrs-judicial-sync

### MUST MATCH

- Preserve `removed` / takedown semantics regardless of whether data came from JList or a monthly package.
- A failed daily JList receipt must remain a real gap until an alternate official source is **actually reconciled**; finding a monthly file name is not proof of recovery.
- Do not use `--date` or metadata relabeling to fabricate historical coverage.
- Keep source channel, observation/update time, target-date coverage and lifecycle state distinct.

### SHOULD BE BETTER

- Reframe the system as **low-latency incremental sync + evidence-backed delayed reconciliation**, but only if one bounded experiment confirms the monthly package can recover/reconcile exact missing coverage.
- For a missed target date, report `UNRECOVERED / RECONCILED / PARTIALLY_RECONCILED / UNKNOWN` rather than absolute assumptions.
- Reuse #5 coverage receipts instead of building a new ledger/framework.

### DIFFERENTIATOR

- Reconciliation that is **erasure-aware**: any bulk recovery must also consume the current official deletion signal and must not rehydrate a judgment that has since been removed.
- Truthful separation between “daily feed missed”, “bulk snapshot later contains the record”, and “current authority may have changed/been removed”.

### ADJACENT IDEA

- A future bounded recovery command could compare only identifiers/metadata first, then fetch approved current bodies only where needed. This remains research-only until #1 storage/erasure boundaries and #5 coverage semantics are safe.

### DO NOT COPY

- Do not mirror an entire 22M-record competitor corpus merely because it exists.
- Do not create a second always-on scheduler, new database, sync framework, public MCP or legal-search UI for this finding.
- Do not keep old monthly packages as immutable Git history; repack/deletion semantics make that unsafe.
- Do not equate a package update marker with “all historical gaps recovered”.

## Four-gate decision

### 1. Problem / value

**Target user/operator:** the owner relying on this repository to maintain a complete, erasable Judicial Yuan judgment feed for downstream legal retrieval.

**Observable break:** #5 proves daily scheduled coverage can fail. README assumes a missed JList day is permanently unrecoverable. Current first-party external evidence now shows a parallel monthly package + deletion-information surface that may provide delayed reconciliation.

**Existing alternative:** manual relabel/backfill via `--date` is explicitly unsafe according to PR #6 review because it does not control JList date. Doing nothing leaves the owner with a potentially overbroad “permanent loss” assumption.

**Do-nothing consequence:** recovery may be unnecessarily abandoned, or gaps may remain marked permanently unrecoverable even when official bulk data can later reconcile them. Conversely, blindly trusting the bulk package could reintroduce removed or revised content. Exact impact is not yet executed.

### 2. Priority

If/when #5 is no longer actively owned, treat this sub-question as:

```yaml
issue_quality_version: 2
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: HIGH
evidence: NEEDS_EVIDENCE
triage: NEEDS_EVIDENCE
auto_implementation: false
```

`decision_priority=HIGH` only because the answer changes a core completeness/recovery assumption and can be tested cheaply. It is not a new P1/P2 finding.

### 3. Smallest solution comparison

1. **No change** — leaves the permanent-loss assumption untested.
2. **Docs-only change now** — premature; current monthly package presence does not yet prove exact recovery semantics.
3. **One bounded read-only reconciliation experiment** — chosen minimum once #5 ownership is free: take one known historical target date with existing receipt metadata, locate its official current monthly package + deletion info, compare identifiers and only bounded approved content as needed; no writes to production corpus.
4. **Thin recovery adapter** — consider only after BUILD evidence.
5. **Second sync service / mirror / database** — rejected as premature.

### 4. Research / implementation separation

- **BUILD:** current official monthly package + deletion feed can deterministically reconstruct or reconcile a missed daily target-date set without violating erasure/storage rules.
- **NARROW:** monthly package can only detect discrepancy/completeness at month or identifier level; use it only as reconciliation evidence, not body recovery.
- **REJECT:** current packages are inaccessible, insufficiently current, cannot map to the target date, or safe erasure-aware reconciliation is not possible.
- BUILD would authorize only a next design decision, not implementation/merge/deploy.

## Minimal research exits when scope is free

1. Confirm the current official monthly package and `Delete-Infor` are accessible under the same authorized membership/account path already permitted for Judicial open data.
2. For one known month/date, compare daily receipt identifiers with the current monthly package using a read-only/body-safe fixture; record package update time and source URL.
3. Verify how later removed/revised judgments are represented so recovery cannot resurrect content that should be deleted.
4. Classify the missed date as `RECOVERABLE_DELAYED`, `RECONCILE_ONLY`, `NOT_RECOVERABLE`, or `UNKNOWN` with evidence.
5. End with BUILD / NARROW / REJECT; do not require a new framework to answer the question.

## Issue / PR Mapping

- **#5 + PR #6 — primary owner of recovery/backfill semantics. `SKIPPED_LOCKED / DEDUPE`.** The new monthly-package evidence belongs here conceptually, but active implementation/review means this radar does not rewrite the Issue, comment on the PR, acquire its lease, or expand its scope mid-flight.
- **#1 + PR #7 — erasure boundary.** Any monthly recovery must obey this; not modified.
- **#3 + PR #4 — AuthorityReceipt / SourceSpan.** Related provenance substrate; not a recovery mechanism and not modified.
- No new issue created. No issue lock acquired because no Issue/shared state was mutated.

## Cross-portfolio idea

**Incremental feed failure does not imply source ecosystem irrecoverability.**

For products that consume a narrow-time-window incremental feed, first ask whether the authoritative provider also publishes a later bulk snapshot/repack/delete feed. The reusable principle is:

`incremental receipt → gap → authoritative bulk reconciliation → lifecycle/deletion check → coverage receipt`

This is a product/evidence principle only. It is **not** approval for a shared reconciliation framework across repositories.

## Rejected / deferred ideas

1. **Open a separate monthly-recovery Issue now — REJECT / DEDUPE.** #5 already owns recovery/backfill semantics and PR #6 is active.
2. **Change README now to say gaps are recoverable — REJECT.** Presence of monthly packages is not execution proof for exact JList recovery.
3. **Use `--date` as backfill — REJECT.** PR #6 review shows this relabels output but does not request an old JList date.
4. **Make monthly packages the primary ingest path — DEFER.** Daily JList is still the low-latency path and no comparative reliability/cost test has been run.
5. **Build a corpus mirror / new database / MCP — REJECT.** No evidence requires that scope.
6. **Ignore Delete-Infor during bulk recovery — REJECT.** This would conflict with #1 and the provider’s own lifecycle model.
7. **Treat competitor corpus counts as completeness proof — REJECT.** Those are vendor/product claims, not independent audits of Judicial source coverage.

## Sources

### Public web / primary

1. Judicial Yuan Open Data Platform — judgment datasets sorted newest-first; current monthly packages and `Delete-Infor`: https://opendata.judicial.gov.tw/dataset?categoryTheme4Sys%5B0%5D=051&page=1&sort.publishedDate.order=desc — checked 2026-09-16.
2. Judicial Yuan, `司法院資料開放平臺將於110年1月11日上線`: https://www.judicial.gov.tw/tw/cp-2049-354488-cc074-1.html — published 2021-01-08, updated 2021-01-11; checked 2026-09-16.
3. Government Open Data Platform historical `司法院各級法院-最新裁判書`: https://data.gov.tw/datasets/history/94184 — historical metadata; checked 2026-09-16.
4. Free Law Project, CourtListener API access: https://free.law/2026/05/07/api-included-in-memberships/ — published 2026-05-07; checked 2026-09-16.
5. Free Law Project, CourtListener MCP: https://free.law/2026/05/12/courtlistener-is-now-available-inside-claude/ — published 2026-05-12; checked 2026-09-16.

### Public web / product signal

6. Taiwan Legal RAG: https://pypi.org/project/twlegalrag/ — current package checked 2026-09-16; corpus/count claims are vendor-maintained and not independent completeness evidence.

### GitHub / Reese-max evidence

7. `lplrs-judicial-sync` README at current main.
8. Issues #1, #3, #5 and open PRs #4, #6, #7; PR #6 review is especially relevant to the invalid `--date` backfill path.
9. Branch list on current repository.
10. Prior radar / audit history in `Reese-max/autodev-ng`.

## What Changed

- **New external evidence:** current Judicial Yuan dataset listing directly exposes monthly packages with later update markers plus `Delete-Infor`; this materially weakens the assumption that a missed daily JList window automatically means the official source ecosystem can never reconcile that gap.
- **No severity inflation:** #5 remains the already-proven P1 scheduled-sync outage; the monthly-package question is a RESEARCH sub-question with `severity=NOT_ESTABLISHED` until executed.
- **No duplicate Issue:** active #5 / PR #6 owns recovery/backfill semantics, so this signal is preserved centrally rather than competing with an active implementer.
- **No implementation:** no package download, no Judicial provider request using credentials, no body comparison, no current-data mutation. Exact recoverability remains `NEEDS_RUNTIME_VERIFICATION`.

## Completion / gaps / continuation

Completed:
- issue-quality v2 read and blob SHA recorded;
- fresh full owner pagination completed;
- current default branch / README / Issues / all-state PRs / branches / relevant full Issue comments and PR #6 review inspected;
- prior radar/rejection history searched;
- current first-party public-web monthly package signal verified;
- opportunity map / four gates / dedupe / active-scope coordination completed;
- central report written without product mutation.

Still unknown:
- whether a current monthly package can reconstruct the **exact** missing JList target-date set;
- whether the package and `Delete-Infor` can be reconciled deterministically for later revisions/removals;
- download/account/rate/cost behavior in the current authorized environment;
- end-to-end recovery runtime and body-store erasure behavior.

Status: **COMPLETE for this radar pass; recovery hypothesis remains NEEDS_RUNTIME_VERIFICATION.**

Next fair cursor: **`adng-memory`**.
