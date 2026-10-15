# 外部競品／新品／工作流靈感雷達 — 2026-09-16T10:03:56Z

## Scope / rules / evidence boundary

- 只處理 `Reese-max` 自有且未封存 repository；未操作第三方 repository。
- Issue Quality 規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`。
- 規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh owner pagination：**42 owned repositories；39 unarchived**。archived：`gemini-deidentifier`、`obsidian-vault`、`openab`。
- Working classification 沿用最近校準：**36 product-like + 3 support/compatibility-only**；本輪沒有足夠證據改分類。
- 上一輪 cursor：`note-filler`；本輪完成該 cold-rotation target。下一個 cursor：**`lplrs-judicial-sync`**。
- `note-filler` current default branch：`main@9b579adb0391f9a96f620f2d58d4a7f0e420c4df`。最新 commit 是 audit docs；最近產品程式 baseline 仍為 `935b00113662942f9d700444de42d445ee6c8cea`。
- Owner/product-board 現有方向：`note-filler` 屬 **MAINTAIN / VALIDATE**，避免擴張成大型法律平台；核心契約仍是法律／行政／考試筆記補齊、原稿不可變、無來源不進正文。
- 活躍工作：#3 + PR #7 正在處理 claim-level human review / stale-review design；#1/#4 + PR #8 正在處理 README 與 web export isolation。本輪沒有修改這些 Issue/PR，也沒有搶它們的 scope。
- 本輪沒有執行真實 Grok、正式 web deployment、production data、付費 provider、merge/deploy/worker/GOAL；不宣告 portfolio CLEAN。

## Executive decision

**1 個新的窄 RESEARCH Issue；0 個 existing Issue 修改；0 implementation authorization。**

建立：
- `Reese-max/note-filler #9` — `[Research][RESEARCH_REQUIRED] Validate local law snapshot freshness before Level-A verification`
- URL: https://github.com/Reese-max/note-filler/issues/9
- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=HIGH`
- `evidence=SOURCE_CONFIRMED`（只指 provenance/date 語意與靜態 source path）
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`
- `NEEDS_RUNTIME_VERIFICATION`

核心不是「再做一套法律資料平台」，而是驗證目前 Level-A 法規來源是否把 **查詢日** 誤當成 **法規快照真正更新日**，進而讓 stale/currentness gate 失去意義。

## Current repository evidence

### Product contract

`pyproject.toml` 明確描述產品是法律／行政／考試筆記自動補齊，且「原稿不可變、無來源不進正文」。

### Source model

`Source` 目前只有：`id / title / url / level / content / fetched_date / doc_date / distance`。

### Current freshness semantics

`retrieve/grading.py::is_stale()` 明確只看 `fetched_date`，且註解寫明 MVP 不追 `doc_date`。

### Level-A law path

`LawLookup.search_articles()` 從本機 `data/law_index.db` 讀出 `law_name / article_no / article_text / pcode`；SQLite schema 沒有 snapshot date、revision date、promulgation/effective status。

`retrieve/law_search.py` 對這些 **本機 SQLite row** 建立 `Source` 時，卻固定：

- `level="A"`
- `fetched_date=today`
- `doc_date=None`

也就是「今天查本地舊快照」會顯示成「今天取得的 Level-A 法規來源」。同時 `_grounded()` 對單一 Level-A source 即可形成 verified grounding。

### Snapshot age

Git history 顯示目前 `data/law_index.db` blob 是 **2026-07-15** 引入的 24MB SQLite law index；此檔到 current main 沒有較新的 commit。

所以目前至少有一個 source-confirmed 語意錯誤：**query time 被當成 corpus freshness evidence**。但本輪沒有直接讀取 SQLite 二進位 row，因此不把「某一條法規文字已錯」冒充已執行重現。

## External Signals

### A. Direct competitor / professional legal workflow — authority verification is now part of the work product

**CONFIRMED — Thomson Reuters, published 2026-09-08 / product releases for August 2026; checked 2026-09-16.**

Source:
- https://www.thomsonreuters.com/en-us/posts/innovation/cocounsel-legal-august-2026-releases/

CoCounsel Legal current release makes Deep Research Verify an assertion-level workflow: legal assertions are checked against supporting Westlaw / Practical Law passages, while KeyCite-backed authority verification is surfaced inside the legal workflow.

Transferable signal for `note-filler`: **有 citation 不等於 authority 仍然有效／目前仍適用**。值得移植的是 verification boundary，不是 Westlaw 的資料庫、agent breadth 或 matter platform。

**CONFIRMED — Lexis+ with Protégé current product; checked 2026-09-16.**

Source:
- https://www.lexisnexis.com/en-us/products/lexis-plus-protege.page

Lexis exposes Shepard's verification around citation validation, status and treatment. Again, this is not independent effectiveness evidence and is not a reason to build a Taiwanese Shepard's clone; it is a product-design signal that authority status/currentness is a separate evidence dimension.

### B. Adjacent authoritative workflow — Taiwan official law source changes after the local snapshot

**CONFIRMED — Taiwan Ministry of Justice / Laws & Regulations Database; checked 2026-09-16.**

Sources:
- https://mojlaw.moj.gov.tw/
- https://law.moj.gov.tw/News/NewsDetail.aspx?msgid=198983
- https://law.moj.gov.tw/News/NewsDetail.aspx?msgid=199343

The official MOJ surface states current legal compilation data is regularly updated, with the page inspected showing a compilation cutoff of **2026-09-04**.

A concrete post-snapshot legal change exists: **Criminal Code Article 80 was amended/promulgated on 2026-07-22**, after `note-filler`'s current `law_index.db` was committed on 2026-07-15. Another example, **Civil Code Article 1223**, was amended/promulgated on 2026-08-17 with delayed effectiveness.

The latter is especially useful as a model warning: `text in local snapshot`, `promulgated revision`, `effective/current law` and `query date` are four different facts. A single `fetched_date=today` cannot truthfully represent all of them.

This does **not** prove a wrong production answer. It proves that the current freshness representation cannot reliably communicate authority state once the official source moves beyond the local snapshot.

### C. New technical possibility — official Open API exists, but do not design around it yet

**CONFIRMED existence / UNKNOWN fit — checked 2026-09-16.**

Source:
- https://law.moj.gov.tw/api/swagger/index.html

The official Laws & Regulations Database exposes an Open API documentation surface. This is only a technical option for the research comparator. This round did **not** establish which endpoint/revision metadata are available, request limits, or whether production use should be online.

Therefore no API adapter, sync daemon or background refresh service is authorized. The first experiment can use a deterministic fixture + official public text comparison.

## Community Pain

No fresh community report was needed to pass this finding. The issue is already supported by deterministic repository semantics plus first-party legal-source changes. Reddit/forum anecdotes would not improve the severity decision and were intentionally not used as prevalence evidence.

## New Releases / current changes

| Date | Source | Change | Product implication |
|---|---|---|---|
| 2026-09-08 | Thomson Reuters | CoCounsel August release summary: assertion-level verification / authority-backed workflows | Verification should include source support/current authority semantics, not citation existence only |
| 2026-07-22 | Taiwan MOJ | Criminal Code Art. 80 amended/promulgated | Current local law DB predates a real official change |
| 2026-08-17 | Taiwan MOJ | Civil Code Art. 1223 amended/promulgated; delayed effectiveness | Promulgation date and effective/current status must not be collapsed into query date |
| checked 2026-09-16 | Lexis+ with Protégé | Shepard's status/treatment verification remains a core trust surface | Status/currentness is a distinct evidence dimension |
| checked 2026-09-16 | Taiwan Laws API | Official Open API documentation surface exists | Possible comparator/source-refresh path, not yet a production architecture decision |

## Opportunity Map — note-filler

### MUST MATCH

- A local static law snapshot must not be represented as freshly fetched merely because it was queried today.
- `query date`, `snapshot/import date`, `promulgation/revision date`, `effective/current status` must remain distinguishable; unknown stays UNKNOWN.
- A Level-A label must not silently imply currentness beyond what the evidence proves.
- Original-note immutability and existing source/citation gates remain unchanged.

### SHOULD BE BETTER

- Give the user enough provenance to know whether primary-law evidence is current, stale, future-effective or unknown without opening internal JSON.
- Reuse existing `Source`, traceability and stale/verified paths before adding any new storage/service.

### DIFFERENTIATOR

- Preserve `original immutable + evidence-linked overlay + truthful authority freshness` rather than producing a polished but unverifiable legal note.
- Keep explicit uncertainty instead of manufacturing a green `verified` state from Level-A category alone.

### ADJACENT IDEA

- If the bounded experiment proves value, an official-source comparator could run only on cited legal authorities rather than resyncing the whole corpus on every run.
- This is not approved until the research demonstrates the smallest needed currentness field and cost/availability boundary.

### DO NOT COPY

- Westlaw / Shepard's breadth, legal-treatment graphs or case citators.
- A temporal knowledge graph, registry, new database, always-on sync daemon or cross-jurisdiction authority service.
- Always-online dependency before local-first users actually need it.
- Automatic legal-validity judgment or legal advice.

## Four-gate decision — #9

### 1. Problem / value

**Target user:** a legal / administrative / exam-note user relying on Level-A primary law to understand why a supplement is trustworthy.

**Observable gap:** local `law_index.db` is static from 2026-07-15, but every query from it is stamped `fetched_date=today`; staleness logic then sees query time rather than corpus age. Official MOJ law has changed after that snapshot.

**Existing alternatives:** do nothing; document the limitation; manually open the MOJ URL; rebuild the whole DB; or make one bounded comparator. The last option is the smallest experiment that can distinguish a labeling-only problem from materially stale legal content.

**Do-nothing consequence:** source freshness can be overstated. The concrete frequency and user impact remain unmeasured, so severity is not promoted.

### 2. Priority

```yaml
issue_quality_version: 2
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: HIGH
evidence: SOURCE_CONFIRMED
triage: NEEDS_EVIDENCE
auto_implementation: false
```

Reason for HIGH decision priority: the question touches the product's legal-evidence trust contract and has a very cheap deterministic experiment. It is **not** P1/P2 because no affected real output has been executed in this radar.

### 3. Smallest solution comparison

1. **No change** — cheapest, but leaves false provenance semantics.
2. **Docs only** — can warn, but stale/grounded logic still treats query date as freshness.
3. **Bounded comparator** — one post-snapshot amended article (Criminal Code Art. 80) + one unchanged control; inspect local row, official text, source fields and resulting stale/grounded decision. **Chosen minimum.**
4. **Thin provenance correction** — only after BUILD/NARROW evidence; likely snapshot/import date + smallest current/effective field actually required.
5. **Sync framework / new service** — rejected as premature.

### 4. Research / implementation separation

- BUILD only if the comparator proves materially stale/unknown authority can currently appear fresh enough for Level-A grounding.
- NARROW if text still matches but `fetched_date` semantics are false; fix only provenance/currentness representation.
- REJECT larger work if a hidden supported workflow already regenerates/validates the snapshot before every real use, or existing bounded evidence proves currentness.
- BUILD is not implementation approval. #9 remains `auto_implementation=false`.

## Issue / PR mapping and de-duplication

- **Created:** `note-filler #9` for the exact `local law snapshot -> query-time fetched_date -> stale/currentness blind spot` fingerprint.
- **#3 / PR #7:** claim-level Verify/Accept/Reject and stale-review decision history. Related but not duplicate: review invalidation can only react to evidence revisions that the source layer actually knows about. Active scope not modified.
- **#1/#4 / PR #8:** README + web export isolation. Higher-priority active remediation; untouched.
- Search of open/closed Issues, all-state PRs and branches immediately before filing found no existing law-snapshot freshness fingerprint.

## Cross-portfolio idea

**Source acquisition time != source authority time.**

This principle may later matter to `lplrs-judicial-sync`, `academic-mcp`, `taichung-police-intel` and other evidence products: a record fetched today may describe an older decision, superseded paper, prior law revision or stale upstream snapshot. The portable idea is only to preserve distinct timestamps/status assertions. This is **not** authorization for a shared provenance framework.

No cross-portfolio Issue was created.

## Rejected / deferred ideas

1. **Build a Taiwanese Shepard's/KeyCite equivalent — REJECT.** No evidence justifies that product scope.
2. **Always query MOJ live before every note — DEFER.** Current local-first direction should not be weakened before one bounded experiment measures need.
3. **Create a new law-state registry / temporal DB — REJECT.** Existing Source/evidence structures should be extended only if required.
4. **Fold into #3 — REJECT as root-cause conflation.** #3 tracks human decision persistence after evidence exists; #9 tracks truthfulness/currentness of the evidence source itself.
5. **Raise #9 to P1/P2 from vendor/official docs alone — REJECT.** Current wrong-output frequency and concrete affected user path are not yet executed.
6. **Treat Civil Code 1223's promulgated future revision as already-effective law — REJECT.** The official page explicitly says delayed effectiveness; the experiment must preserve this distinction.

## Sources

### Public web / primary

1. Taiwan Ministry of Justice law updates — https://mojlaw.moj.gov.tw/ — checked 2026-09-16.
2. Taiwan Laws & Regulations Database, Criminal Code Art. 80 amendment — https://law.moj.gov.tw/News/NewsDetail.aspx?msgid=198983 — published 2026-07-22; checked 2026-09-16.
3. Taiwan Laws & Regulations Database, Civil Code Art. 1223 amendment — https://law.moj.gov.tw/News/NewsDetail.aspx?msgid=199343 — published 2026-08-17; checked 2026-09-16.
4. Taiwan Laws & Regulations Database Open API docs — https://law.moj.gov.tw/api/swagger/index.html — checked 2026-09-16.
5. Thomson Reuters, CoCounsel Legal August 2026 releases — https://www.thomsonreuters.com/en-us/posts/innovation/cocounsel-legal-august-2026-releases/ — published 2026-09-08; checked 2026-09-16.
6. Lexis+ with Protégé — https://www.lexisnexis.com/en-us/products/lexis-plus-protege.page — current product page; checked 2026-09-16.

### Repository evidence

- `note-filler@9b579adb0391f9a96f620f2d58d4a7f0e420c4df`
- `src/note_filler/retrieve/models.py`
- `src/note_filler/retrieve/grading.py`
- `src/note_filler/retrieve/law_search.py`
- `src/note_filler/knowledge/law_lookup.py`
- `data/law_index.db`
- DB import commit `2e3e4f5c2c6377f3b380adfda8bcfab77264c774` (2026-07-15)
- current Issues #1/#3/#4; open PRs #7/#8

## What Changed / calibration

- New external evidence converted a previously generic `stale-source` concern into a specific testable root cause: **the local primary-law snapshot predates real official changes while the product stamps local query time as fetched time.**
- Did **not** promote to P2/P1; the concrete output mismatch still needs one bounded execution/DB-row comparison.
- Did **not** expand #3's active review-ledger work.
- Created exactly one narrow research issue because it has first-party external evidence, direct current-code evidence, a low-cost experiment and a BUILD/NARROW/REJECT exit.

## Completion / gaps / cursor

- Fresh inventory: complete for current accessible Reese-max owner listing.
- External web: direct legal AI competitor + official Taiwan authority changes + official API surface checked.
- New Issues: **1** (#9).
- Existing Issue updates: **0**.
- Runtime/provider calls: **0**.
- Product source/CI/config/secrets/settings/branches/deployments modified: **0**.
- Remaining gap: current binary DB row for Criminal Code Art. 80 has not been read/executed against official current text in this radar; #9 exists specifically to answer that bounded question.
- Next fair-rotation cursor: **`lplrs-judicial-sync`**.
- Portfolio CLEAN: **not declared**.
