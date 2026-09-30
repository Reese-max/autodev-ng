# External Competitive / New-Product / Workflow Radar — 2026-09-21T15:56:56Z

## Status / scope / evidence boundary

- Run status: **COMPLETE_FOCAL_ANALYSIS / FRESH_OWNER_INVENTORY / NO_MATERIAL_NOTIFICATION / 0_NEW_ISSUES**.
- Owner scope: `Reese-max` only; no third-party repository was modified.
- Governing gate re-read: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`; rules blob SHA **`8167e10798071d2276addaff6b201c6b0e904a2a`**.
- Fresh connected-owner enumeration was paged to completion: **42 Reese-max-owned repositories / 41 unarchived**; `obsidian-vault` is archived and excluded from active product rotation. No historical inventory was used as the denominator.
- Fair cursor entering this round: **`Reese-max/ai-novel-workstation`**, carried from `2026-09-21T140116Z-external-radar.md`.
- Focal repository is owner-controlled, private, unarchived; default branch `main`.
- Focal HEAD re-read in this run: **`267a0b6a9856f1de5f20afe44c7e0fd23d0390aa`** (`docs: add 2026-09-13 product board audit`). No newer default-branch product change was observed.
- Owner-approved direction remains **INVEST / SIMPLIFY**: local-first Traditional Chinese long-form creation; moat = inspectable manuscript truth, deterministic context/evidence, resumable bounded production and portable exports. Reliability/evidence work remains ahead of breadth.
- Existing active implementation scopes were rechecked: #2 via PR #3/#9, #4 via PR #7, #5 via PR #8. Research-only #6 (external-agent Story Workspace) and #10 (publishing provenance/KDP disclosure) remain separate and were not rewritten.
- No provider call, paid request, production manuscript mutation, browser/client runtime, CI rerun, branch, merge, deployment, worker/GOAL, product source/config/secret/permission/settings change was performed.

## Executive decision

**0 new Issues. 0 Issue/PR comments. 0 scope changes. 0 implementation authorizations.**

Fresh public-web evidence mostly **confirms existing research boundaries rather than creating a new root cause**:

1. **Quarkle, 2026-09-19:** added a per-chat **Chapter read-only** control: the chat may read a chapter while staging no edit cards. This is a direct market confirmation that resource-level read authority and edit authority are becoming distinct product concepts.
2. **NovelShaft, 2026-09-16:** made edits more precisely target passages/reference rows/image slots, exposes before/after content from saved history, and states that if a document changed after the assistant read it, the assistant must read the latest state before applying the edit. This directly confirms the stale-base / bounded-target principle already written into `ai-novel-workstation #6`.
3. **Quarkle, 2026-09-16:** added configurable **Auto-review** after a stretch of edits, but `ai-novel-workstation` already has critic/quality/reader-panel gates and no user evidence shows “continuous automatic review after every edit burst” is a current missing job.
4. **Amazon KDP current policy, rechecked 2026-09-21:** still distinguishes AI-generated from AI-assisted content and still treats AI-generated content as generated even after substantial human edits. This confirms #10’s research premise; no policy reversal or new disclosure requirement was found.

The strongest calibration is therefore not “add another feature.” It is:

> **Keep read authority, proposal authority and canonical-write authority separate; bind mutations to the current revision; do not infer authorship/origin beyond observed process evidence.**

Those principles are already represented by #6 and #10. Reopening them with new architecture, a generic permission framework, or another provenance subsystem would be duplicate expansion.

---

## Product → market category

| Product | Direct / adjacent category | Current core job |
|---|---|---|
| `ai-novel-workstation` | NovelShaft, Quarkle, Sudowrite, Novelcrafter; local/inspectable writing and publishing workflows | premise/existing manuscript → canonical local story truth → bounded AI writing/revision/quality → reviewable export with resumable state and evidence |

## External Signals

### A. Direct competitor — Quarkle separates chapter read access from edit staging

**CONFIRMED — product changelog dated 2026-09-19; checked 2026-09-21.**

Source:
- https://www.quarkle.ai/changelog

Quarkle’s new **Chapter read-only** control lets a chat read a chapter while staging no edit cards. This follows its earlier Atlas read-only control and sits beside reviewable edit-card workflows.

**User job solved:** ask questions about current manuscript context without giving that chat session mutation authority over the referenced chapter.

**Manual/risk reduction:** the writer no longer has to choose between “do not show the chapter” and “let the AI edit it”; read access is a first-class state.

**Transferable design:** resource read scope and mutation scope are different capabilities. A connected AI client should not gain write authority merely because it can inspect canonical story material.

**Repository mapping:** this is already the center of #6, whose proposed minimum distinguishes `READ_ONLY`, `PROPOSE_PATCH`, promotion and destructive/publish authority. No new fingerprint is established.

**Decision:** `DEDUP_TO_#6 / NO_ISSUE / NO_SCOPE_CHANGE`.

### A2. Direct competitor — NovelShaft tightens exact-target editing and stale-state handling

**CONFIRMED — product update dated 2026-09-16; checked 2026-09-21.**

Source:
- https://en.novelshaft.com/updates/20260916-153500
- https://en.novelshaft.com/updates

NovelShaft now allows the assistant to target one passage, one structured-reference row or one image slot, while preserving saved before/after history. More importantly, its current behavior states that **when a document has changed since the assistant read it, the assistant must read the latest state before applying the edit**.

**User job solved:** make a narrow AI edit without accidentally applying a stale instruction to a changed manuscript/reference object.

**Manual/risk reduction:** less manual copy/paste/diffing and less chance that a prior read silently overwrites later human edits.

**Transferable design:** mutation must be bound to an observed current revision; stale context should force a fresh read/rebase instead of silent application.

**Repository mapping:** #6 already requires exact parent/content hash and `STALE_BASE / REBASE_REQUIRED`; existing owner direction also keeps candidate patches separate from canonical promotion. This external evidence raises confidence in that boundary but does **not** change the research scope or grant implementation rights.

**Decision:** `DEDUP_TO_#6 / NO_ISSUE / NO_COMMENT`.

### B. Adjacent workflow — Quarkle Auto-review makes continuous critique optional, not mandatory

**CONFIRMED — changelog dated 2026-09-16; checked 2026-09-21.**

Source:
- https://www.quarkle.ai/changelog

Quarkle now offers an optional Auto-review that waits for a configurable amount of new writing and then runs enabled reviewers after a pause. It is off by default.

**Transferable pattern:** automated critique can be event-triggered and user-configurable rather than running after every edit.

**Counterevidence in this repo:** `ai-novel-workstation` already has critic/reviser, quality gates, whole-book reader-panel work and bounded production checkpoints. No human-session/telemetry evidence shows that a new always-listening review daemon is needed.

**Decision:** `ADJACENT IDEA / HOLD`; do not add watcher/service/background review state.

### C. Publishing policy — KDP disclosure boundary is unchanged in the current public rule

**CONFIRMED CURRENT POLICY — checked 2026-09-21.**

Source:
- https://kdp.amazon.com/en_US/help/topic/G200672390

KDP still requires disclosure of AI-generated text/images/translations, does not require disclosure of AI-assisted content, and states that AI-generated content remains AI-generated even after substantial edits.

This **confirms #10**, which already asks whether existing local run/version/import receipts can truthfully summarize current publishable origin while preserving `UNKNOWN` when the workstation did not observe the process.

No new policy language found this round supports automatic KDP submission, AI detectors, token-level authorship attribution or a hosted compliance database.

**Decision:** `#10 CURRENT PREMISE CONFIRMED / NO_STATE_CHANGE`.

---

## New Releases / recent strategy changes

| Date | Product | Signal | Decision |
|---|---|---|---|
| 2026-09-19 | Quarkle | Chapter read-only for chat | Confirms #6 resource authority separation; no new Issue |
| 2026-09-16 | NovelShaft | Exact passage/reference/image edits + latest-state requirement before stale edits | Confirms #6 stale-base contract; no new Issue |
| 2026-09-16 | Quarkle | Optional Auto-review after edit bursts | Adjacent only; current quality loop already strong |
| 2026-09-16 | NovelShaft | More precise reference edits / save-from-chat workflow; AI credit/package changes | Workflow/packaging signal only; no owner need for SaaS billing breadth |
| current, checked 2026-09-21 | Amazon KDP | generated vs assisted disclosure remains in force | Confirms #10 research premise |

## Community Pain

No recent community anecdote was promoted into prevalence, severity, ROI or prioritization evidence in this round. First-party product/policy evidence was sufficient to evaluate the relevant authority and provenance contracts.

No synthetic persona count was used as independent validation.

---

## Repository / current-work calibration

### Existing direction remains stronger than the new market signals

Current README continues to establish:

- `books/` as canonical work/story truth;
- `production-loop` as the sole cross-stage main flow;
- resumable author/production state;
- fail-closed checkpoints and token/step/duration bounds;
- explicit image/comic generation authority rather than hidden automatic external effects.

The latest Product Board audit remains **INVEST / SIMPLIFY** and explicitly prioritizes remote verification truth, Context Manifest reliability and bounded runtime proof before multi-tenant SaaS, native mobile, marketplaces, automatic publishing or provider breadth.

### Active reliability scope is not displaced

PR #9 remains open at head `8686e875b75a0963b61fa7badc2a8256f3aceac1`, implementing #2 Context Manifest. The 2026-09-17 Product Board delta already identified pre-merge truth/evidence risks (reduced projection deleting hidden character truth, overwritten manifest evidence, replay representation mismatch). New competitor features do not reduce those blockers and do not authorize merge.

#5/PR #8 still owns remote CI receipt/admission work. #4/PR #7 owns bounded cost quote behavior. This radar does not re-sequence them.

---

## Opportunity Map — `ai-novel-workstation`

| Category | Decision | Evidence / reasoning |
|---|---|---|
| **MUST MATCH** | Read authority must not imply mutation authority | Quarkle 2026-09-19; already #6 |
| **MUST MATCH** | Stale manuscript/reference edits must re-read/rebase or fail closed | NovelShaft 2026-09-16; already #6 |
| **MUST MATCH** | Publishing-origin statements must be based on observed process evidence and preserve unknowns | KDP + #10; current owner direction |
| **SHOULD BE BETTER** | Candidate mutation → validation → explicit promotion receipt, rather than opaque auto-apply | #6 and existing fail-closed product contract |
| **SHOULD BE BETTER** | Deterministic local truth/replay evidence must remain intact even when context is reduced | active #2/PR #9 pre-merge findings |
| **DIFFERENTIATOR** | Local-first Traditional Chinese long-form production with inspectable truth, bounded effects and resumable evidence | owner-approved product direction |
| **ADJACENT IDEA** | Optional edit-burst auto-review | Quarkle signal; no current user pain, keep HOLD |
| **DO NOT COPY** | generic permission framework, multi-tenant collaboration SaaS, hosted provenance/compliance DB | disproportionate; existing typed local contracts are enough for current research |
| **DO NOT COPY** | automatic KDP submission or AI-content detector | exceeds authority and creates false certainty |
| **DO NOT COPY** | model/provider breadth merely because competitors add models | explicitly behind reliability/runtime proof |

---

## Four-Gate Review

### Candidate A — per-resource read-only / candidate-write modes

#### 1. Problem / value

The external category now has first-party examples of separating read-only manuscript access from edit staging. The user job is credible, but this repository already has an open research Issue (#6) whose exact fingerprint is external-client typed access plus candidate-only mutation plus canonical promotion gates.

**Gate result:** real market signal, no new root cause.

#### 2. Priority

Existing classification remains research/opportunity territory, not a proven product defect:

```yaml
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: existing_#6
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

No P2/P1 claim is supported by competitor behavior alone.

#### 3. Minimum solution

The minimum remains the existing #6 contract:

1. scoped typed reads;
2. candidate patch only;
3. exact parent/content revision;
4. validation + preview;
5. explicit promotion receipt;
6. deny destructive/publish/arbitrary-file authority in MVP.

Quarkle/NovelShaft do not justify a generic RBAC service, capability database or collaboration backend.

#### 4. Research / implementation separation

No new Issue, no Issue comment, no BUILD authorization. New evidence belongs in central radar until #6 research is actively resumed or a distinct product-specific failure appears.

**Decision: DEDUP / HOLD.**

### Candidate B — always-on / edit-burst auto-review

#### 1. Problem / value

Quarkle proves a configurable auto-review workflow exists. This repository already runs multiple quality/reader gates. No author runtime session shows manual review triggering is a repeated breakpoint.

#### 2. Priority

```yaml
kind: OPPORTUNITY
severity: NOT_ESTABLISHED
decision_priority: LOW
triage: NEEDS_EVIDENCE
auto_implementation: false
```

#### 3. Minimum solution

Do nothing now. If a real author repeatedly forgets/avoids review after manual edits, first test one existing quality command after a bounded edit batch; do not add a background daemon or watcher.

#### 4. Research / implementation separation

No Issue threshold met.

**Decision: REJECT_FOR_NOW / CENTRAL NOTE ONLY.**

### Candidate C — KDP provenance expansion

The current KDP rule did not change. Existing #10 already asks the correct narrow question and explicitly rejects detectors/new ledgers/automatic submission.

**Decision: NO CHANGE / DEDUP_TO_#10.**

---

## Rejected Ideas

- **Build a universal permission/RBAC framework because Quarkle has read-only:** rejected; #6’s bounded authority classes are enough for the research question.
- **Add continuous background reviewers:** rejected for now; current product already has multiple quality gates and no user-frequency evidence supports the complexity.
- **Create another version/history system:** rejected; current Creative Console already has chapter snapshots/compare/restore, and historical radar already closed this false gap.
- **Add AI-content detection:** rejected; KDP needs process disclosure, and observed provenance is safer than inference.
- **Auto-submit KDP disclosure:** rejected; external publication authority is out of scope.
- **Copy NovelShaft’s account/mobile/credit packaging:** rejected; packaging signal is not evidence this local-first product needs SaaS account infrastructure.

## Cross-portfolio ideas

No new cross-portfolio shared component passes the creation gate this round. Two principles remain reusable only when a concrete repository/user job requires them:

1. `read != propose != mutate != publish` authority separation;
2. stale state and unknown provenance must fail closed rather than be guessed.

These are design principles, not authorization for a central RBAC/provenance framework.

## Issue Mapping / coordination

- #2 / PR #3/#9 — active Context Manifest implementation; no comments or scope changes.
- #4 / PR #7 — active bounded cost-quote work; no changes.
- #5 / PR #8 — active CI execution/admission work; no changes.
- #6 — external-agent Story Workspace; **fresh Quarkle/NovelShaft evidence maps here but does not alter scope/status**; no comment.
- #10 — KDP/provenance research; current KDP policy recheck confirms premise; no comment/status change.
- New Issue: **0**.
- Updated/reopened Issue: **0**.
- PR comments: **0**.
- Lock acquisition: **not needed** because no Issue/shared state was modified.

## Sources

First-party public sources, checked 2026-09-21:

1. Quarkle changelog — 2026-09-19 Chapter read-only; 2026-09-16 Auto-review: https://www.quarkle.ai/changelog
2. NovelShaft precise edits — 2026-09-16: https://en.novelshaft.com/updates/20260916-153500
3. NovelShaft updates index — current September 2026 release sequence: https://en.novelshaft.com/updates
4. NovelShaft current product positioning: https://en.novelshaft.com/
5. Amazon KDP Content Guidelines — current AI-generated/AI-assisted boundary: https://kdp.amazon.com/en_US/help/topic/G200672390
6. Feldar provenance changelog — 2026-08-24, prior corroborating evidence for #10: https://feldar.com/changelog

Repository evidence:

- `Reese-max/ai-novel-workstation@267a0b6a9856f1de5f20afe44c7e0fd23d0390aa`
- `Reese-max/ai-novel-workstation#2/#4/#5/#6/#10`
- active PRs #3/#7/#8/#9
- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-17T0505Z-product-board-delta.md`
- previous focal radar: `docs/competitive-intelligence/2026-09-18T080818Z-external-radar.md`

## What Changed / completion / gaps / cursor

### What changed

- Quarkle 2026-09-19 adds a fresh direct-competitor confirmation of **per-resource read-only authority**.
- NovelShaft 2026-09-16 adds a fresh direct-competitor confirmation of **exact-target edits + stale-state reread**.
- Neither establishes a new `ai-novel-workstation` root cause; both map cleanly to existing #6.
- KDP disclosure language remains consistent with #10; no policy-driven scope expansion.

### Gaps retained honestly

- No external-client runtime for #6 was executed.
- No #10 four-path synthetic provenance experiment was executed.
- No long-book/provider/interruption/browser/accessibility/export runtime was run.
- No claim is made that competitor workflows improve writing quality or conversion/retention.
- No portfolio CLEAN declaration.

### Accounting

- New Issues: **0**
- Issue updates/comments: **0**
- PR updates/comments: **0**
- Implementation authorizations: **0**
- Runtime validations: **0**
- Notification threshold: **not met** — fresh signals confirm existing research and do not establish a new high-value opportunity, major strategic reversal requiring action, validated cross-project capability, or evidence overturning owner direction.

### Next fair-rotation cursor

**`Reese-max/clinical-scribe-worker`**.
