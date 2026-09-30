# External Competitive Radar — 2026-09-18T08:08:18Z

Status: **COMPLETE**

## Scope / Direction Check

- Rules: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Fresh connected inventory: **41 Reese-max-owned repositories / 40 unarchived**. `obsidian-vault` is archived and excluded. The connected listing fit in one `page_size=100` page; this run did not reuse an older inventory as the universe.
- Fair-rotation primary repo: `Reese-max/ai-novel-workstation`
- Current default branch: `main`; HEAD rechecked immediately before filing: `267a0b6a9856f1de5f20afe44c7e0fd23d0390aa` (`docs: add 2026-09-13 product board audit`).
- Owner-approved product posture from `.github/quality-audits/2026-09-13-2215-product-board-audit.md`: **INVEST / SIMPLIFY**. The product should remain a local-first Traditional Chinese long-form creation workstation whose moat is inspectable manuscript state, deterministic context/evidence, resumable bounded production and portable exports. Priority remains #5 remote verification receipt, #2 context-manifest completion, then bounded provider/interruption/export runtime proof. Multi-tenant SaaS, marketplace/community, native mobile, LMS, automatic publishing and more model integrations remain explicitly out of scope until those contracts are trustworthy.
- Existing Issues / active work checked before filing: #1 audit loop, #2 context manifest, #4 cost envelope, #5 CI execution receipt, #6 external-agent Story Workspace; active branches/PRs include #2 via PR #3/#9, #4 via PR #7, and #5 via PR #8. No provenance/KDP/authorship-disclosure Issue, PR or branch was found immediately before write.
- Historical radar `2026-09-15T080004Z-external-radar.md` was reviewed. Its `candidate edits/revision diffs` candidate remains deduplicated. A fresh code read found that the Creative Console already has durable per-chapter snapshots, version comparison and restore, so recent competitor “infinite undo/version history” signals are **not** a reason to reopen that earlier candidate.
- `autodev-ng` code search did not surface a current ai-novel-specific owner heartbeat/GOAL for the provenance fingerprint. No run/status mutation was started.

## Product → Market Category

Primary comparison categories for this rotation step:

1. AI-native long-form writing/editing: Quarkle, Storybible, Pinery.
2. Author-control / process-evidence writing tools: Feldar.
3. General AI-native document revision/history: TextJam (adjacent, not novel-specific).
4. Publishing disclosure boundary: Amazon KDP content policy (policy/user-job evidence, not a competitor).

The radar does **not** interpret competitor presence as a requirement. The relevant question is whether an external signal exposes a current user workflow that can be improved with a bounded change consistent with local-first, inspectable evidence.

## External Signals

### 1. CONFIRMED — Amazon KDP currently distinguishes AI-generated from AI-assisted content

Checked **2026-09-18**.

Source: https://kdp.amazon.com/en_US/help/topic/G200672390

KDP currently requires publishers to inform it of **AI-generated** text, images or translations when publishing a new book or editing/republishing an existing book. It does **not** require disclosure of AI-assisted content. Critically, KDP says content actually created by an AI tool remains AI-generated even if the author later applies substantial edits.

This creates a concrete publishing job: an author who used an AI writing workstation must be able to reconstruct how the current publishable content originated without incorrectly treating later human editing as proof that the content became merely “AI-assisted.” This is a platform policy boundary, not evidence of a current user incident or enforcement action against this repository.

### 2. CONFIRMED — Feldar 1.0.2 added process provenance on 2026-08-24

Source: https://feldar.com/changelog

Feldar now records how a manuscript was made, distinguishing direct writing from contributions made with Feldar tools. Its stated design boundary is especially relevant: it records only activity that happened inside Feldar and explicitly does not claim to identify externally generated text later typed into the document.

Transferable principle: **observed process evidence is stronger than trying to infer authorship from final prose**. The useful part for this repository is not Feldar’s exact UI or percentages; it is the willingness to say `UNKNOWN` outside the tool’s observation boundary.

Current pricing checked **2026-09-18**: Starter free, Core US$20/month, Pro US$40/month, Ultra US$200/month. This is packaging context only; it is not evidence of willingness-to-pay for provenance or of Feldar efficacy.

Pricing source: https://feldar.com/pricing

### 3. CONFIRMED — Quarkle’s current revision history records “you or quarkle” for Story Atlas changes

Checked **2026-09-18**.

Sources:
- https://www.quarkle.ai/features
- https://www.quarkle.ai/changelog

Quarkle currently exposes revision history for Story Atlas changes with exact diffs and identifies whether a change came from the user or Quarkle. Its recent releases also keep AI edits reviewable/undoable. This is another market signal that actor/origin metadata can be part of author control, but it does **not** prove Quarkle can satisfy KDP disclosure or that this repository should copy its cloud architecture.

### 4. CONFIRMED but largely already matched — TextJam full document history and Quarkle/Pinery reviewable diffs

- TextJam added **Infinite Undo on 2026-09-07**, preserving full document history and a timeline: https://textjam.com/changelog
- Pinery 2.0 on **2026-07-25** made AI suggestions pending/reviewable and exposes labeled before/after diffs before changes land: https://pinery.app/changelog
- Quarkle already offers checkpoint comparison/restore and reviewable diffs.

Current repository evidence now shows `CreativeConsole` already implements `versions/chapters/<NNNN>/`, snapshot metadata, `chapter_versions`, unified-diff comparison and restore, with the current version snapshotted before restoration. Therefore these competitor releases are **not** a current “missing version history” gap. They remain adjacent workflow evidence only.

### 5. CONFIRMED current capability — Storybible separates draft-derived state from published truth

Checked **2026-09-18**.

Source: https://storybible.ai/

Storybible describes a workflow where draft analysis can evolve as the author works, while publishing promotes a chapter into accepted manuscript/published truth. The design is relevant to the repository’s existing checkpoint/release-candidate model, but no new root cause was established. No separate “draft vs published” Issue was filed.

## Current Repository Evidence — `ai-novel-workstation`

Current HEAD: `267a0b6a9856f1de5f20afe44c7e0fd23d0390aa`.

### Positive / contrary evidence checked first

The product is not missing general history/recovery:

- `tools/creative_console.py` stores chapter snapshots under `books/<book>/versions/chapters/<NNNN>/`.
- A snapshot contains `id`, `book`, `chapter`, `title`, `content`, `status`, `word_count`, `created_at`.
- `chapter_versions()` lists snapshots, `compare_chapter_versions()` generates a unified diff, and `restore_chapter_version()` restores a selected snapshot while preserving the current text as another snapshot through the normal save path.
- Whole-book archive export/import and pre-overwrite archives also exist.
- External manuscript import records book-level `sourceImport` with source format, filename, import timestamp, chapter count and `workflow=existing`.

This directly weakens any “build version history” proposal; no such Issue was created.

### The narrower provenance gap

The current artifacts do not expose a clear publishing-oriented mapping from **the current manuscript revision** to its observed origin semantics:

- `AuthorLoop._write_one()` can generate a chapter via the configured writer, persist it, then generate revised prose via the reviser and persist that as the current draft.
- `_persist_draft()` creates the normal backup and saves the chapter; it does not record an origin class beside that exact content revision.
- chapter-version snapshots preserve the text/status/time but no actor/origin field.
- `author_runlog.jsonl` records decisions/checkpoints/failures, but the inspected schema is not a content-revision provenance contract.
- imported manuscripts retain import metadata at the book level, but later generated/manual/reverted chapter revisions can change what is actually publishable.

This does not prove that a KDP disclosure will be wrong. It establishes a bounded manual-reconstruction problem worth research: existing receipts may contain enough facts, but they are not currently organized into a current-revision disclosure answer.

## New Releases

- **2026-09-07 — TextJam:** Infinite Undo/full document timeline. Already matched substantially by the current Creative Console chapter-version path; no Issue.
- **2026-09-08 — Quarkle:** Tally computes manuscript stats from manuscript text rather than model opinion. The repository already has deterministic prose/quality metrics and no new root cause was established.
- **2026-08-24 — Feldar 1.0.2:** process provenance distinguishes direct writing from Feldar-tool contributions. This is the principal new release retained for decision-making.
- **2026-07-25 — Pinery 2.0:** reviewable AI diffs. Deduplicated against existing local version/compare/review direction and historical radar.

## Community Pain

No recent community post was promoted to a decision-grade signal in this round. The KDP requirement and current product/vendor behavior are sufficient first-party evidence for the bounded research question. No Reddit anecdote, marketing claim or synthetic persona count was used to infer prevalence, ROI or severity.

## Adjacent Ideas

1. **Observed provenance, not detection.** Record only the actions/revisions the workstation actually witnessed. External paste/typing or missing history should remain `UNKNOWN`.
2. **Publishing preflight instead of a new subsystem.** If current artifacts are sufficient, the smallest useful surface is a local release/export summary tied to current chapter/asset revisions, not a new database or compliance service.
3. **Draft/history is already stronger than earlier radar assumed.** Current `CreativeConsole` version snapshots/compare/restore mean “add revision history” should be treated as already-existing capability, not a fresh opportunity.
4. **Published truth remains an explicit promotion boundary.** Storybible’s current draft/published separation reinforces the repository’s existing checkpoint/release-candidate direction without justifying a second publishing state machine.

## Opportunity Map — `ai-novel-workstation`

| Bucket | Decision | Evidence / reason |
|---|---|---|
| MUST MATCH | Trustworthy save/resume/export and independently readable verification receipt | Already owner-approved priority; #5/PR #8 and runtime evidence remain ahead of new feature work. |
| SHOULD BE BETTER | When a publishing platform asks for AI-origin disclosure, explain only what the local process can actually prove about the current publishable revision | KDP current policy + existing generation/import/version artifacts; new #10 is research-only. |
| DIFFERENTIATOR | Private/local process provenance tied to inspectable manuscript state rather than AI detectors | Feldar’s 2026-08-24 pattern aligns with the repo’s local-first evidence posture. Value still needs bounded validation. |
| ADJACENT IDEA | Draft/published truth separation; pending/reviewable edits; full history | Storybible/Pinery/TextJam/Quarkle. Most are already represented by current checkpoints/versioning/history; no new Issue. |
| DO NOT COPY | AI-content detector, authorship classifier, cryptographic provenance platform, hosted compliance DB, automatic KDP submission | These add false inference, new authority or disproportionate architecture and are unnecessary to answer the first research question. |

## Four-Gate Decision

### Filed: `ai-novel-workstation#10`

Issue: https://github.com/Reese-max/ai-novel-workstation/issues/10

Fingerprint:

`ai-novel-workstation + publish/export current manuscript + KDP generated-vs-assisted disclosure + existing generation/import/version receipts do not map current revision to observed origin + user must reconstruct origin manually`

Classification:

- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=MEDIUM_HIGH`
- `evidence=SOURCE_CONFIRMED`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`
- `runtime=NEEDS_RUNTIME_VERIFICATION`

### Gate 1 — problem / value

Target user: an author/self-publisher using the workstation to produce or refine manuscript content and later export/publish it.

Observable manual breakpoint: KDP requires a generated-vs-assisted answer; current final manuscript/version records do not themselves carry that semantic, so the operator may need to reconstruct origin across model calls, author runlogs, imports and version history. The consequence is manual uncertainty at publication time, **not** a claim of present noncompliance or user harm.

Contrary evidence checked: the repo already has version snapshots, diff/restore, archives, runlogs and source-import metadata. Those capabilities substantially reduce the scope of the problem and make a new “history system” unjustified.

### Gate 2 — priority

This is research, not a product defect. No P0/P1/P2 severity is established. KDP is a real external policy boundary and Feldar supplies recent product evidence, so the decision priority is medium-high, but #5/#2/#4 active reliability work remains ahead in implementation order.

No Opportunity Score was used.

### Gate 3 — minimum approach

First compare **no code change / existing artifacts** against one synthetic book with four paths:

1. AI-generated chapter through the production loop;
2. imported external/human manuscript chapter;
3. human manual edit after AI-generated content;
4. restore of an older chapter version.

Ask whether current receipts can reliably classify the current revision. If not, the first BUILD candidate is only a local release/export preflight summary plus the minimum origin metadata needed on revision events. No new DB, no second usage ledger, no generic provenance framework.

Documentation alone is smaller but insufficient if a long production run cannot reconstruct which current revision came from which observed process event.

### Gate 4 — research / implementation separation

Exit conditions are explicit:

- **BUILD:** current events can map reliably to current revisions with a small receipt/preflight addition.
- **NARROW:** only chapter/asset-level provenance is reliable; stay at that granularity.
- **REJECT:** existing artifacts already answer the job, or reliable mapping requires architecture disproportionate to this product.

Unknown/external activity must remain `UNKNOWN`. A human edit after AI generation must not automatically downgrade the KDP semantic from generated to assisted. This Issue authorizes research only.

## Issue Mapping / Dedupe

- **#10 created and read back open** — provenance/disclosure fingerprint above.
- #5 / PR #8 — remote CI execution receipt; higher owner priority and untouched.
- #2 / PR #3/#9 — deterministic Context Manifest; active work, untouched.
- #4 / PR #7 — cost quote/envelope; active work, untouched.
- #6 — external AI client candidate patches/authority. Distinct root/user job; future mutation receipts may become evidence for #10 but do not make #10 a duplicate.
- Historical `candidate edits/revision diffs` radar candidate — **not reopened**. Current Creative Console already has chapter version snapshots, diff and restore.

No existing Issue was rewritten, closed, reprioritized or commented on. No active PR scope was changed.

## Rejected Ideas

- **Build “Infinite Undo” because TextJam has it** — rejected: current chapter version history/compare/restore already exists; need evidence of a remaining user gap before widening it.
- **Build a detector to classify final prose as AI-generated** — rejected: it would infer beyond observed process evidence and can create false certainty. Feldar’s own explicit boundary is the safer transferable design.
- **Track every token/character in a provenance database** — rejected: first establish whether chapter/asset-level provenance from existing receipts solves the publishing job.
- **Cryptographically sign every manuscript edit / add C2PA text provenance** — rejected as disproportionate and unrelated to KDP’s required generated-vs-assisted disclosure question.
- **Auto-fill or submit KDP disclosure** — rejected: external publication/write authority is out of scope; #10 is local research/preflight only.
- **Turn Storybible’s published view into another manuscript state machine** — rejected: current checkpoint/release/publication contracts should be reused rather than duplicated.

## Cross-portfolio Ideas

One reusable principle is retained without creating cross-repo work: **when origin matters, prefer receipts from actions the product actually observed; never upgrade missing/external history into a confident inferred classification.** Apply this elsewhere only when a concrete repo/user job requires it; this single writing case does not justify a central provenance framework.

## Sources

External first-party / product sources:

- Amazon KDP Content Guidelines — checked 2026-09-18: https://kdp.amazon.com/en_US/help/topic/G200672390
- Feldar changelog — Version 1.0.2, 2026-08-24: https://feldar.com/changelog
- Feldar “Provenance, Not Detection” — 2026-08-24: https://feldar.com/blog/provenance
- Feldar pricing — checked 2026-09-18: https://feldar.com/pricing
- Quarkle features — checked 2026-09-18: https://www.quarkle.ai/features
- Quarkle changelog — releases through 2026-09-08: https://www.quarkle.ai/changelog
- TextJam changelog — Infinite Undo 2026-09-07: https://textjam.com/changelog
- Pinery changelog — Prose/reviewable diffs 2026-07-25: https://pinery.app/changelog
- Storybible current product workflow — checked 2026-09-18: https://storybible.ai/

Repository evidence at current HEAD:

- Product board direction: https://github.com/Reese-max/ai-novel-workstation/blob/267a0b6a9856f1de5f20afe44c7e0fd23d0390aa/.github/quality-audits/2026-09-13-2215-product-board-audit.md
- Author generation/revision path: https://github.com/Reese-max/ai-novel-workstation/blob/267a0b6a9856f1de5f20afe44c7e0fd23d0390aa/lib/author.py
- Chapter persistence/backups: https://github.com/Reese-max/ai-novel-workstation/blob/267a0b6a9856f1de5f20afe44c7e0fd23d0390aa/lib/book_manager.py
- Creative Console versions/import/archive path: https://github.com/Reese-max/ai-novel-workstation/blob/267a0b6a9856f1de5f20afe44c7e0fd23d0390aa/tools/creative_console.py
- Historical radar used for dedupe: https://github.com/Reese-max/autodev-ng/blob/main/docs/competitive-intelligence/2026-09-15T080004Z-external-radar.md

## What Changed

1. Fresh external evidence established a new, bounded publishing-workflow question: KDP’s generated-vs-assisted distinction can require process knowledge that the current manuscript alone does not carry.
2. Feldar’s 2026-08-24 provenance release provides a recent directly transferable design principle: report observed process, not detector inference.
3. Created and read back `ai-novel-workstation#10`; it is open and research-only with explicit BUILD/NARROW/REJECT exits.
4. Corrected a historical radar assumption: current Creative Console already has durable chapter snapshots, compare and restore. Therefore TextJam/Quarkle/Pinery version-history signals were deduplicated rather than used to create another Issue.
5. No product source, CI/config, secret, setting, branch, merge, deployment, worker, GOAL, paid provider call, publisher submission or production data was modified.

## Completion / Gaps / Cursor

- Radar status: **COMPLETE** for this fair-rotation step.
- Runtime gap: #10 has not executed the four-path synthetic provenance experiment; it remains `NEEDS_RUNTIME_VERIFICATION` and does not authorize implementation.
- CI truth remains separate: #5/PR #8 has repository-level trigger evidence but remote runner admission remains an owner/account budget boundary according to its current PR evidence; this radar did not modify it.
- No portfolio CLEAN claim was made.
- Next fair-rotation cursor: `Reese-max/clinical-scribe-worker`.
