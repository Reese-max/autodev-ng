# External Competitive / New-Product / Workflow Radar — 2026-09-23T06:11:14Z

## Status / Scope / Evidence Boundary

- Run status: **COMPLETE_FOCAL_ANALYSIS / FRESH_OWNER_INVENTORY / 1_NEW_P2_BUG / NO_IMPLEMENTATION_AUTHORIZATION**.
- Owner scope: `Reese-max` only. No third-party repository was modified.
- Issue-quality rules re-read: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Rules blob SHA: **`8167e10798071d2276addaff6b201c6b0e904a2a`**.
- Fresh connected-owner pagination was completed: **42 Reese-max-owned repositories / 41 unarchived**; `obsidian-vault` is archived and excluded. Historical inventory was not used as the denominator.
- Fair-rotation focal repo: **`Reese-max/ai-novel-workstation`**, carried from the previous `video-timeline-pipeline` radar.
- Focal default branch rechecked immediately before issue filing: **`main@267a0b6a9856f1de5f20afe44c7e0fd23d0390aa`** (`docs: add 2026-09-13 product board audit`). No newer default-branch product commit was observed.
- Owner-approved posture remains **INVEST / SIMPLIFY**: local-first Traditional Chinese long-form creation; moat = inspectable manuscript state, deterministic context/evidence, resumable bounded production, portable exports. Reliability/evidence work remains ahead of product breadth.
- Existing active scopes rechecked: #2 via PR #3/#9 (Context Manifest), #4 via PR #7 (Cost Envelope), #5 via PR #8 (CI receipt), #6 external-agent Story Workspace research, #10 publishing provenance research. Current branches were also read; no branch/PR matched the new internal quality-approval fingerprint.
- Historical radars `2026-09-15T080004Z`, `2026-09-18T080818Z`, and `2026-09-21T155656Z` were reviewed. The prior candidate-edit/version-history gap remains rejected because Creative Console already has chapter snapshots/diff/restore. NovelShaft stale-base evidence had previously been deduplicated to #6; this run found a **different current default-branch root cause inside the existing production-loop itself**.
- `autodev-ng` search did not surface a current ai-novel-specific owner heartbeat/GOAL for this new fingerprint. No run/status action was started.
- No product source, CI/config, secrets, permissions/settings, implementation branch, merge, deployment, paid provider request, production manuscript mutation, worker or GOAL was started by this radar.

## Executive Decision

This round created **`ai-novel-workstation #11`**:

https://github.com/Reese-max/ai-novel-workstation/issues/11

Classification:

```yaml
kind: BUG
severity: P2
decision_priority: HIGH
evidence: SOURCE_CONFIRMED
triage: NEEDS_REVIEW
auto_implementation: false
runtime: NEEDS_RUNTIME_VERIFICATION
```

Stable fingerprint:

`ai-novel-workstation + quality completed -> approve:manuscript checkpoint + supported chapter edit changes canonical manuscript + approval keeps quality completed + verify/export do not rerun semantic quality/continuity + released revision can be newer than quality evidence`

The key finding is not “add version history” or “copy a competitor.” The current product already has version snapshots, quality artifacts, continuity checks, release fingerprints and deploy drift protection. The narrower defect is that **the quality/continuity pass is not bound to the manuscript revision eventually approved and exported**.

A supported workflow can therefore be:

`quality passes on manuscript A → approve:manuscript checkpoint → author edits chapter through Creative Console → approve → export/verify manuscript B`

while production state still treats `quality` as completed for A. `verify` binds B into the release candidate and deploy refuses changes *after* verify, but `check_project.py` does not rerun `batch_improve.py` or the semantic continuity gate. The result is a release receipt whose source freshness is correct but whose semantic quality evidence can be stale.

The smallest effective correction is revision-bound approval: persist the quality-time manuscript hash/revision, compare it immediately before `approve:manuscript`, and fail closed if the canonical manuscript changed. Re-run/reopen only quality and downstream phases; do not invent a new version database, event-sourcing layer or generic approval framework.

---

## Product → Market Category

| Product | Direct / adjacent alternatives | Current differentiated job |
|---|---|---|
| `ai-novel-workstation` | NovelShaft, Quarkle, Sudowrite, Novelcrafter; Scrivener/Markdown as non-AI substitutes | local canonical story truth → bounded AI writing/quality → explicit human review → portable, inspectable release artifacts |

## External Signals

### A. Direct competitor — NovelShaft binds edits to current state

**CONFIRMED — update published 2026-09-16; checked 2026-09-23.**

Source:
- https://en.novelshaft.com/updates/20260916-153500
- https://en.novelshaft.com/updates

NovelShaft added precise edits to passages, reference rows and image slots, preserves before/after snapshots separately from current content, and states that if a document changed after the assistant read it, the assistant must read the latest state before applying another edit.

**User job:** make a narrow AI-assisted edit without silently operating on stale manuscript/reference state.

**Manual/risk reduction:** fewer manual copy/paste/diff steps and an explicit state boundary between “what the assistant observed” and “what is current now.”

**Transferable design:** a semantic decision made against revision A must not be silently reused as if it applies to revision B.

**Do not copy:** NovelShaft’s account/credit/mobile packaging, broad cloud state or generic collaboration model. The relevant part is only revision freshness.

Historical note: the 2026-09-21 radar already mapped this external signal to #6 for **external-agent candidate patches**. This run does not reopen that scope. The new root cause is the default production-loop’s own `quality → manual edit → approval` sequence.

### B. Direct competitor — Quarkle makes review/checkpoint automation optional and state-aware

**CONFIRMED — changelog changes dated 2026-09-16, 2026-09-19 and 2026-09-21; checked 2026-09-23.**

Source:
- https://www.quarkle.ai/changelog

Recent changes include:

- **2026-09-16:** Auto-review after a configurable amount of new writing and a pause, off by default; configurable auto-checkpoint threshold.
- **2026-09-19:** Chapter read-only, where chat may read a chapter without staging edit cards.
- **2026-09-21:** per-book Atlas auto-refresh can be disabled, explicitly stopping automated updates until the user refreshes.

These are product/workflow signals that review state, mutation state and automatic-refresh state are separate concepts. They do not establish superior quality, prevalence or ROI.

**Transferable part:** after new manuscript edits, old review state should not be treated as automatically current.

**Do not copy:** an always-on reviewer daemon, milestones/gamification, background service or new preference framework. `ai-novel-workstation` already has explicit quality/approval phases; it only needs their evidence to be revision-bound.

### C. Adjacent competitor — Sudowrite continues to prioritize edit reliability and undo correctness

**CONFIRMED current changelog checked 2026-09-23; latest relevant releases are July–August 2026.**

Source:
- https://feedback.sudowrite.com/en/changelog

Sudowrite’s recent work includes more precise Chat insertion, safer chronological Undo, long-project context/cost reduction and clearer Draft limits. These support the general market direction toward trustworthy author-control workflows, but they do **not** provide a new root cause beyond #11 and existing #2/#4.

**Decision:** supporting context only; no additional Issue.

---

## New Releases / Recent Changes

| Date | Signal | Product implication | Decision |
|---|---|---|---|
| 2026-09-21 | Quarkle per-book Atlas auto-refresh control | automated semantic state can be intentionally stale/off | context for revision-aware evidence; no extra feature |
| 2026-09-19 | Quarkle Chapter read-only | read authority and edit authority are distinct | already #6; no duplicate |
| 2026-09-16 | Quarkle Auto-review + checkpoint threshold | review can be tied to a new-edit threshold | do not add daemon; bind existing quality evidence instead |
| 2026-09-16 | NovelShaft precise edit + latest-state re-read | stale state must be refreshed before mutation | confirms revision-freshness principle; current internal bug now found |
| 2026-09-13 → current | `ai-novel-workstation` default HEAD unchanged | no newer main fix invalidates the finding | #11 filed against current main |

## Community Pain

No Reddit/HN/community anecdote was promoted to severity, prevalence, ROI or priority. First-party competitor documentation and current repository source were sufficient. No synthetic persona count was used as independent evidence.

## Current Repository Evidence

Current default HEAD: `267a0b6a9856f1de5f20afe44c7e0fd23d0390aa`.

### Counterevidence checked first

The repository already has several strong protections, which narrow the bug substantially:

1. Creative Console chapter saves create version snapshots and `.bak` recovery before updating canonical chapter content.
2. `_handle_quality()` verifies per-chapter content hashes against formal quality artifacts and requires truth reconciliation.
3. `_handle_quality()` runs deterministic continuity checking with `--fail-on-critical`.
4. `_handle_verify()` fingerprints the current publishable source and writes `source_content_sha256` into `release_candidate.json`.
5. `_handle_deploy()` recomputes the source fingerprint and stops with `deploy_source_changed` if the source changed after verify.
6. When an already-DONE production is resumed, `run()` also checks the final content fingerprint and refuses silent reuse after source changes.

Therefore this is **not** a missing backup, missing deploy hash or generic stale-state problem.

### Root cause retained

The uncovered gap exists *between* quality and manuscript approval:

- phase order includes `quality` followed by `approve:manuscript`;
- `quality` completion is stored as phase completion, but its successful evidence is not persisted as a manuscript-revision approval dependency;
- the production lock is released when the run stops at a checkpoint, and the supported Creative Console editor can modify canonical chapters during the review interval;
- approval eligibility checks whether the checkpoint can be approved, not whether the canonical manuscript still matches the revision that quality/continuity examined;
- subsequent `check_project.py --sync-json --book ...` performs sync/tests/lint/build but does not rerun semantic quality or continuity;
- thus release candidate source truth can be current while quality evidence is stale.

This is distinct from #6: #6 protects a future **external-agent proposal/promotion** path with parent hashes. #11 protects the product’s **existing internal human-review production path**.

## Opportunity Map — `ai-novel-workstation`

| Bucket | Decision | Reason |
|---|---|---|
| **MUST MATCH** | Any quality/continuity approval must identify the manuscript revision it actually evaluated | current source path can otherwise approve B with A’s evidence |
| **MUST MATCH** | Edit-after-quality must fail closed before export/verify or trigger a bounded quality rerun | core release assurance must match the actual manuscript |
| **SHOULD BE BETTER** | Reopen only the minimal affected phase(s), preserving resumability | aligns with owner moat; avoids full reset |
| **DIFFERENTIATOR** | Local revision-bound evidence + explicit human approval + portable release receipts | stronger fit than copying hosted version-history UX |
| **ADJACENT IDEA** | Optional threshold-triggered auto-review after edit bursts | Quarkle signal; no user pain to justify now |
| **DO NOT COPY** | always-on background reviewer, generic RBAC, new revision DB/event sourcing, collaborative SaaS | disproportionate; existing state/hash/version mechanisms are enough |

## Four-Gate Decision — #11

### Gate 1 — problem / value

**Target user:** an author who reviews a quality-checked manuscript and makes normal manual corrections before final approval/export.

**Observable breakpoint:** the supported editor can change canonical chapter bytes after semantic quality/continuity passes; the approval flow does not confirm that the evidence still belongs to those bytes.

**Existing alternatives:** author can manually remember to rerun quality, or avoid editing after quality. Neither is a reliable release contract because editing is a supported review action.

**Consequence if unfixed:** the product can truthfully say “this source hash was verified for release” while the semantic quality/continuity receipt belongs to an older manuscript revision. No data loss or security incident is claimed.

**Contrary evidence:** deploy-time and DONE-time content fingerprints are already strong; they simply occur too late / protect a different boundary.

**Gate result:** passes as a real current product bug.

### Gate 2 — priority

Classification:

- `kind=BUG`
- `severity=P2`
- `decision_priority=HIGH`
- `triage=NEEDS_REVIEW`
- `auto_implementation=false`
- `runtime=NEEDS_RUNTIME_VERIFICATION`

P2, not P0/P1: there is no evidence of data loss, unauthorized action, production incident or broad user failure. P2 is justified because the mismatch directly weakens a core completion/export assurance path. No prevalence estimate is claimed.

### Gate 3 — minimum solution

Compared options:

1. **No change:** fails to preserve evidence/revision truth.
2. **Documentation only:** insufficient because the product provides the editor during a human-review checkpoint.
3. **Minimal local fix:** persist a quality-time manuscript revision/hash and compare immediately before `approve:manuscript`; on mismatch, fail closed and reopen/rerun the existing quality path only.
4. **New version database / event sourcing / generic approval framework:** rejected as unnecessary.

The issue explicitly asks to reuse `ProductionState`, existing hashes/runlog or a tiny manuscript fingerprint helper. It does not authorize new infrastructure.

### Gate 4 — research / implementation separation

This is a BUG with source-level causal evidence, not exploratory RESEARCH. The issue is still `triage=NEEDS_REVIEW` and `auto_implementation=false` because this radar does not grant implementation authority.

Closure requires a local runtime regression fixture showing:

1. quality passes and the loop reaches manuscript approval;
2. chapter is modified through the supported Creative Console save path;
3. approval fails closed before export/verify;
4. quality can be rerun without resetting unrelated prior work;
5. unchanged control case still proceeds normally.

No paid provider or production manuscript is needed.

## Issue Mapping / Dedupe

- **#11 created and read back open:** https://github.com/Reese-max/ai-novel-workstation/issues/11
- #2 / PR #3/#9: Context Manifest; active and untouched.
- #4 / PR #7: Cost Envelope; active and untouched.
- #5 / PR #8: remote/default-branch CI receipt; active and still owner-approved reliability priority.
- #6: external-agent Story Workspace stale-base/candidate-promotion research. Related principle, different root and current user path; not modified.
- #10: publishing provenance/KDP disclosure research. Different root/user decision; not modified.
- Historical candidate-edit/version-history idea: remains rejected; Creative Console already has snapshots/compare/restore.

No existing Issue was relabeled, closed, reopened or commented on. No active PR scope was modified.

## Rejected Ideas

- **Build “Infinite Undo” / new history system:** rejected; current chapter snapshots/diff/restore already cover that product job.
- **Add Auto-review daemon because Quarkle has it:** rejected; the current problem is stale evidence binding, not missing automation.
- **Run full quality automatically after every keystroke/save:** rejected as wasteful and intrusive; only the approval boundary needs fail-closed freshness.
- **Use deploy `source_content_sha256` as sufficient proof:** rejected; it proves release bytes are stable after verify, not that semantic quality evaluated those bytes.
- **Generalize immediately into a portfolio approval framework:** rejected; one repo-level bug does not justify a shared platform.
- **Merge #11 into #6:** rejected; external candidate-patch authority and internal quality approval are different supported workflows and root causes.

## Adjacent Ideas

1. **Approval receipts as revision-bound claims:** when an approval means “I reviewed/validated X,” store enough identity to prove which X. Reuse elsewhere only when a concrete approval/effect workflow exists.
2. **Minimal invalidation instead of full reset:** source drift should reopen only evidence that depends on the changed source. This product already has phase reopening primitives; no new state machine is needed.
3. **User-controlled review automation:** Quarkle demonstrates optional review thresholds, but no current human evidence supports adding it here.

## Cross-Portfolio Ideas

One evidence-backed reusable principle is retained, **not implemented as shared infrastructure**:

> A semantic approval/validation receipt is valid only for the exact resource revision it observed; later mutation must make the receipt stale before a dependent effect proceeds.

Potential relevance exists for other Reese-max products with explicit review→effect boundaries, but no cross-repo Issue is created until a concrete current root cause is found in those repos.

## Sources

### Public web — primary intelligence

- NovelShaft, **More precise edits to passages, reference rows, and images**, 2026-09-16: https://en.novelshaft.com/updates/20260916-153500
- NovelShaft Updates, checked 2026-09-23: https://en.novelshaft.com/updates
- Quarkle changelog, entries 2026-09-16 / 2026-09-19 / 2026-09-21, checked 2026-09-23: https://www.quarkle.ai/changelog
- Sudowrite changelog, current page checked 2026-09-23: https://feedback.sudowrite.com/en/changelog

### Connected GitHub — product/current-state evidence

- `Reese-max/ai-novel-workstation@267a0b6a9856f1de5f20afe44c7e0fd23d0390aa`
- `.github/quality-audits/2026-09-13-2215-product-board-audit.md`
- `lib/production_loop.py`
- `tools/creative_console.py`
- `tools/check_project.py`
- `docs/architecture-and-flows.md`
- `tests/test_production_loop.py`
- Issues #2, #4, #5, #6, #10 and all-state PR/branch review
- prior radars `2026-09-15T080004Z`, `2026-09-18T080818Z`, `2026-09-21T155656Z`

## What Changed This Round

1. The external NovelShaft/Quarkle signals themselves were mostly known; **they did not justify a duplicate feature Issue**.
2. A deeper current-default source read found a distinct causal gap not recorded in the 2026-09-21 radar: `quality` evidence can become stale during the intended manual manuscript-approval interval.
3. Current `check_project.py` was checked as contrary evidence and does not rerun semantic quality/continuity during verify.
4. Existing release/deploy hashes were checked and narrow the fix: deployment freshness is already protected; only the quality→approval boundary needs revision binding.
5. Created and read back `ai-novel-workstation #11`, with `auto_implementation=false` and a bounded local runtime regression.

## Completion / Gaps / Cursor

- Focal radar status: **COMPLETE** for this rotation step.
- New Issues: **1** (`ai-novel-workstation #11`).
- Existing Issue/PR comments or scope edits: **0**.
- Implementation/worker/branch in product repo: **0**.
- Runtime evidence for #11: **not executed**; source path is confirmed, closure remains `NEEDS_RUNTIME_VERIFICATION` with a no-paid-provider local fixture.
- No portfolio CLEAN claim was made.
- `autodev-ng/main` is protected against direct Contents writes; this report is therefore written on a **report-only branch** and proposed through a docs-only PR. It must not be interpreted as merge or implementation authorization.
- Next fair-rotation target: **`Reese-max/clinical-scribe-worker`**.
