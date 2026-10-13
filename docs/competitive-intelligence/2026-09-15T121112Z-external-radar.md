# External Competitive / New Product / Workflow Radar — 2026-09-15T12:11:12Z

## Run Scope & Quality Contract

- Owner scope: `Reese-max` only; no non-owned repository was modified.
- Issue Quality v2 source: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Quality-rule blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Previous radar used for continuation: `docs/competitive-intelligence/2026-09-15T095812Z-external-radar.md`.
- Current deep-rotation target: `Reese-max/cyber-prep-coach`.
- Current default-branch SHA observed for that repository: `ab298d6070beff56e73061dd00756406fbbbef24`.
- This run is research/triage only. It did not modify product source, CI/config, secrets, permissions, repository settings, branches, deployments, paid services, or production data. No implementation worker or GOAL was started.
- Runtime status: no browser/runtime/provider experiment was executed in this run. Static source findings that require user-visible confirmation are marked `NEEDS_RUNTIME_VERIFICATION`.

## Portfolio Inventory & Fair Rotation

A fresh paginated owner listing returned **42 Reese-max-owned repositories**; the second page was empty. **39 are unarchived**. The existing scope split remains usable after live recheck: 36 product-like repositories and 3 support/compatibility-only repositories (`adng-memory`, `internship-notes-sites-mirror`, `police-exam-practice`). Empty/support repositories were not forced into product defect discovery.

This run followed the previous fair-rotation cursor to `cyber-prep-coach`. Next cold-rotation cursor: **`exam-archive`**.

## Product → Market Mapping

### cyber-prep-coach

- Market: Taiwan iPAS intermediate cybersecurity certification preparation.
- Owner-approved positioning: narrow, local-first, unofficial historical-question practice and mock-exam product; not a generic AI tutor, LMS, marketplace, or forced-cloud learning platform.
- Current core: 880 questions across 11 sessions / 22 subject papers, source/provenance data, local progress, wrong/uncertain/saved review, search, timed practice/mock workflows, backup/import/recovery, target exam date.
- Existing active strategic work already covers:
  - official-exam pacing fidelity: Issue #3 / PR #9;
  - mastery / adaptive next task: Issue #4 / PR #8;
  - explanation calibration: Issue #6 / PR #7;
  - broad UI-preview/local-state integration: PR #2.

## External Signals

### A. Direct competitor — Pocket Prep: exam-version transition is a user workflow, not only a content hash

**Status: CONFIRMED (official product/help documentation).**

Pocket Prep’s current help center makes exam-version transition explicit: when an exam provider changes its content outline, users can be informed of a new exam version, switch between old/new versions during a transition window, and retain study progress until the older exam version is retired. Its current Settings and Quiz Modes documentation also exposes exam date/countdown, subject controls, missed-question practice, weakest-subject practice, build-your-own quizzes, and mock exams that mirror target exam timing/question count.

Relevant current/near-current publications:

- 2026-08-11 — Settings Update: https://help.pocketprep.com/en/articles/7470862-settings-update
- 2026-08-11 — Quiz Modes Explained: https://help.pocketprep.com/en/articles/14548723-quiz-modes-explained-how-to-study-with-pocket-prep
- 2026-06-08 — Switching exam versions: https://help.pocketprep.com/en/articles/10536957-how-do-i-switch-exam-versions
- 2026-04-13 — AI-Powered Tutor: https://help.pocketprep.com/en/articles/14604210-ai-powered-tutor
- Pricing/product surface checked 2026-09-15: https://www.pocketprep.com/

**Job-to-be-Done:** keep studying when a certification blueprint/question set changes without silently mixing the meaning of old progress with the new exam version.

**Concrete manual step removed:** the learner does not need to guess whether old progress still refers to the same exam version or manually reconstruct a study history after a content revision.

**Onboarding/distribution signal:** exam version is surfaced as a user-facing setting/state transition rather than hidden implementation metadata.

**Pricing signal:** Pocket Prep monetizes broad certification-prep convenience and premium modes; this does not imply `cyber-prep-coach` should copy its subscription/account model.

**Limitations / do not copy:** cloud account/sync, generic certification breadth, and a generic AI tutor conflict with the current local-first/narrow iPAS product direction. Product claims are not independent learning-effect evidence.

**Transferable principle:** `content version transition must be explicit; old learner state must never be silently re-attributed to a different content version`.

### B. Adjacent workflow — Anki: preserve learning state only when content identity/update semantics are explicit

**Status: CONFIRMED (official documentation).**

Anki’s current import/update model separates content update from scheduling state. Updated packaged/text decks can identify existing notes and update their content while existing scheduling information can remain intact; newer Anki versions provide explicit update/merge controls rather than treating any syntactically valid import as semantically interchangeable.

- Packaged deck import/update: https://docs.ankiweb.net/importing/packaged-decks.html
- Text file updates: https://docs.ankiweb.net/importing/text-files.html
- Export / scheduling information: https://docs.ankiweb.net/exporting.html

**Job-to-be-Done:** refresh content without losing valid learner history.

**Transferable principle:** preserve progress only when stable item identity/compatibility is demonstrable. This is useful as a future narrowing path, not evidence that `cyber-prep-coach` should build a migration registry now.

### B2. Adjacent workflow — RemNote: deadline-driven study plans are visible, adaptive, and recoverable

**Status: CONFIRMED for documented behavior; UNKNOWN for effectiveness in this product.**

Current RemNote Exam Scheduler / Study Plan documentation connects an exam date to visible daily study load and catch-up behavior, while newly created/imported material is deliberately kept out of normal review until learned.

- Exam Scheduler: https://help.remnote.com/en/articles/9102040-understanding-the-exam-scheduler
- Preparing for an Exam: https://help.remnote.com/en/articles/9101991-preparing-for-an-exam
- Exam Study Plan: https://help.remnote.com/en/articles/16081995-exam-study-plan
- Managing New Cards: https://help.remnote.com/en/articles/16213222-managing-new-cards

For `cyber-prep-coach`, this does **not** justify a new issue: the product already stores a target exam date and Issue #4 / PR #8 owns adaptive next-task research. The signal is retained only as supporting evidence for that existing fingerprint.

### C. Emerging web capability — installable PWA controls are improving, but remain a non-priority opportunity

**Status: CONFIRMED for Chrome platform capabilities; UNKNOWN for product value.**

Chrome published a declarative `<install>` element origin trial on 2026-05-12 and seamless same-site PWA origin migration on 2026-06-03. These reduce installation/distribution friction for installable web apps, but installability/offline reliability still requires the usual manifest/service-worker/cache/data-management work.

- 2026-05-12 — HTML `<install>` element origin trial: https://developer.chrome.com/blog/install-element-ot
- 2026-06-03 — Seamless PWA origin migration: https://developer.chrome.com/blog/seamless-pwa-origin-migration
- PWA documentation: https://developer.chrome.com/docs/capabilities/pwa

Repository search did not find a current PWA/service-worker implementation in `cyber-prep-coach`. However, no current repo/user evidence shows install/offline setup is a higher-value friction than content trust, official-mode correctness, real-device accessibility, or safe local-state recovery. The `<install>` element is also experimental/origin-trial territory. **No issue.**

## New Releases / Market Changes

1. Pocket Prep’s August 2026 updates continue to make exam date, quiz mode, and subject configuration first-class learner workflow controls rather than hidden settings.
2. Chrome’s 2026 PWA distribution work lowers install friction, but does not remove the need for a real offline/data contract.
3. No official iPAS change observed this run overturns the current `cyber-prep-coach` scope; the 115-year official material remains the applicable authority for existing official-mode work.

Official current iPAS source checked 2026-09-15:
https://www.ipas.org.tw/api/proxy/uploads/certification/ISE/115%E5%B9%B4%E5%BA%A6%E8%B3%87%E8%A8%8A%E5%AE%89%E5%85%A8%E5%B7%A5%E7%A8%8B%E5%B8%AB%E8%83%BD%E5%8A%9B%E9%91%91%E5%AE%9A%E7%B0%A1%E7%AB%A0%28%E5%88%9D%E3%80%81%E4%B8%AD%E7%B4%9A%29_1150129_20260129102918.pdf

## Community Pain Signals

These are anecdotal `COMMUNITY_SIGNAL`, not prevalence estimates.

- 2026-07-11 Anki discussion: user confusion after importing a large shared deck and seeing unexpected deck/new-card behavior. https://www.reddit.com/r/Anki/comments/1utsb49/why_did_my_imported_anki_deck_show_up_as_default/
- 2026-05-09 AnkiHub → AnkiCollab migration discussion: concern about losing learning history; replies emphasize separating local review history from deck content updates. https://www.reddit.com/r/Anki/comments/1t7s3jg/ankihub_to_ankicollab/
- 2026-08-10 Anki discussion: desire to import updated deck organization without losing existing cards/history. https://www.reddit.com/r/Anki/comments/1vkdztv/relocate_existing_cards_on_import/

These signals reinforce that version/update semantics are user-visible trust concerns, but they are not evidence that the same frequency or severity occurs in `cyber-prep-coach`.

## Repository Evidence: Version-Compatible Restore / Activation Gap

### Observed current behavior

At current default-branch SHA `ab298d6070beff56e73061dd00756406fbbbef24`:

1. `app/lib/local-state.ts` validates schema/internal consistency and requires an in-progress practice draft’s `bankVersion` to equal the snapshot’s `bankVersion`, but the parser has no caller-supplied **current expected datasetVersion** contract.
2. `app/CyberPrepApp.tsx::importProgress()` parses an imported v5 snapshot, confirms replacement, creates a recovery copy, and commits the imported snapshot without first comparing its top-level `bankVersion` with the currently loaded `index.datasetVersion`.
3. Resume paths are safer: `resumePractice()` / `resumeMock()` refuse a draft/attempt when its version differs from the current question bank. That protects the active attempt, not aggregate progress.
4. A later new practice/mock can write the current `bankVersion` while spreading/preserving prior aggregate progress (`seenIds`, `wrongIds`, confidence/topic statistics, answered/correct counts). This can make stale progress look as though it belongs to the current bank.
5. `tests/local-state.test.mjs` covers schema, corrupt JSON, extra fields, internal consistency, size limits, and normal round-trip imports, but no current-bank-vs-imported-bank compatibility fixture was found.
6. The PRD already says imported content incompatible with the question-bank version should not be accepted, so this is not a newly invented product requirement.

### Active PR interaction

Draft PR #2 (`feat/apple-study-core-ui`, head `f1dd836ff31f1a4b9aa59efb42781c1e4d7eb293`) touches this exact boundary. Its preview load path currently detects a bank-version mismatch but then rewrites `bankVersion` to the current dataset and clears `currentPractice` while preserving aggregate learner progress. That is an active implementation scope and must not be silently re-scoped by this radar.

### Stable fingerprint

`cyber-prep-coach + local learning snapshot restore/activation + current index version differs + old aggregate progress survives + bankVersion is accepted/relabelled + stale learner progress can become attributed to current bank`

## Four-Gate Triage

### 1. Problem / value

- Target user: existing iPAS learner who upgrades the question bank, imports a backup, or returns after the content version changed.
- Observable friction/risk: a syntactically valid backup can have a different semantic question-bank version. Current code can preserve aggregate progress while eventually relabelling it to the new bank.
- Existing alternative: same-version backup/restore is already supported. For incompatible versions, the PRD says fail closed rather than silently mix versions.
- If not fixed: user-visible wrong/seen/topic statistics or downstream recommendation inputs may refer to an older bank while being presented under the current version. The actual magnitude is UNKNOWN until a version-change fixture is run.
- Contrary evidence: stable question IDs/content may make some progress legitimately reusable. No evidence in this run proves all cross-version progress is invalid.

### 2. Priority classification

- `kind=BUG` (source-confirmed contract mismatch at a supported import/activation boundary).
- `severity=NOT_ESTABLISHED` — do not infer P1/P2 without a concrete version-change fixture and measured user-flow impact.
- `decision_priority=MEDIUM`.
- `triage=NEEDS_REVIEW`.
- `auto_implementation=false`.
- Evidence: `SOURCE_CONFIRMED` for code/PRD mismatch; `NEEDS_RUNTIME_VERIFICATION` for observable learner-state corruption and impact.

### 3. Smallest safe fix

Compare alternatives in order:

1. **No change:** rejected because the PRD already disallows incompatible imports and current code does not enforce that boundary.
2. **Documentation only:** insufficient; the code path still accepts/activates incompatible snapshots.
3. **Local boundary check — preferred minimum after active PR ownership clears:** compare snapshot/import `bankVersion` with current `index.datasetVersion` before activation. On mismatch, do not silently relabel or activate progress. Keep the old JSON/recovery artifact available and show a clear compatibility message. Preserve current/new state.
4. **Selective reconciliation:** only research later if real users need cross-version continuity and stable item/content identity can prove which progress remains valid.
5. **Migration registry/database/service:** rejected now as unjustified scope expansion.

Minimum regression fixture should use a `bank-v1` snapshot with non-empty seen/wrong/confidence/topic statistics against a `bank-v2` index and prove those values are not silently adopted/relabelled as `bank-v2`.

### 4. Research / implementation separation

This finding does not authorize implementation. The active PR #2 owns the relevant path. The radar therefore performs no issue/PR write and no runtime modification. When that ownership clears, a follow-up triage should first see whether PR #2 already resolves the fingerprint; only then decide whether a small BUG issue is still needed.

## Opportunity Map — cyber-prep-coach

### MUST MATCH

- Restore/import/activation must not silently treat incompatible dataset-version progress as current.
- Official exam fidelity remains tracked in #3 / PR #9; no duplicate.
- Independent explanation-quality calibration remains tracked in #6 / PR #7 before public trust claims.

### SHOULD BE BETTER

- Local-first recovery should expose explicit bank-version compatibility, preserve the old backup, and fail visibly rather than discard or reinterpret learner state.
- Keep source/correction provenance more explicit than generic exam-prep SaaS.

### DIFFERENTIATOR

- Narrow iPAS specialization + versioned source/provenance + local learner data + no forced account/cloud dependency.
- A transparent compatibility boundary can be stronger than copying a cloud sync product.

### ADJACENT IDEA

- Deadline/catch-up scheduling from RemNote: useful supporting signal, but `targetExamDate` already exists and adaptive planning is active #4 / PR #8 scope.
- Installable/offline PWA: potentially useful for commuting study, but no current evidence clears the priority gate; keep on research list only.

### DO NOT COPY

- Forced cloud account/sync.
- Generic AI tutor/chat surface before explanation calibration.
- Social feeds, leaderboards, broad LMS, marketplace.
- A full migration registry/service before actual cross-version demand is demonstrated.
- Experimental `<install>` as a required product dependency.

## Cross-Portfolio Ideas

### 1. Backup parses ≠ backup is compatible

Schema-valid JSON is not sufficient evidence that the state belongs to the currently active content version. This is a reusable design rule for local-first, versioned-content products, but **no umbrella issue is justified** until another repository shows the same concrete workflow gap.

### 2. Content revision identity ≠ learner state identity

Preserve learner state across content changes only when stable item identity/semantic compatibility can be demonstrated. Otherwise quarantine/invalidate explicitly. This is a decision principle, not authorization to build a shared registry/framework.

## Rejected / Deferred Ideas

| Idea | Decision | Reason |
|---|---|---|
| New generic AI tutor | REJECT | owner direction says trust/calibration first; no evidence chat is the main friction |
| New mastery/deadline issue | DUPLICATE / ACTIVE | #4 + PR #8 already own adaptive next-task scope; target exam date already exists |
| New official-spec mock issue | DUPLICATE / ACTIVE | #3 + PR #9 already own it |
| Cloud sync/account system | REJECT | conflicts with local-first differentiator and adds privacy/ops cost without evidence |
| Full version-migration registry/mapping service | REJECT FOR NOW | too large; PRD already supports the smaller fail-closed answer |
| PWA/offline implementation issue | DEFER | platform opportunity exists, but no current user/repo evidence shows it outranks trust/recovery/release gates |
| Referral/social/gamification | REJECT | outside approved narrow product direction |

## Issue Mapping & Cross-Schedule Coordination

- **No new Issue created.**
- **No existing Issue updated.**
- Candidate fingerprint above is `SKIPPED_LOCKED_ACTIVE_PR#2`: PR #2 is open/draft and modifies the exact local-state/version activation path. New evidence is recorded here only; no lock was taken and no comment was added.
- #3 / PR #9: active official-mode work; direct-competitor mock-exam signals are supporting evidence only.
- #4 / PR #8: active mastery work; RemNote/adaptive signals are supporting evidence only.
- #6 / PR #7: explanation calibration remains higher-priority trust work; no duplicate AI-tutor issue.
- No active implementation scope was changed.

## Sources

All external sources were actually checked in this research cycle or carried only when still current/relevant; changing product/pricing claims were rechecked 2026-09-15.

### First-party / official

- Pocket Prep — Settings Update (2026-08-11): https://help.pocketprep.com/en/articles/7470862-settings-update
- Pocket Prep — Quiz Modes Explained (2026-08-11): https://help.pocketprep.com/en/articles/14548723-quiz-modes-explained-how-to-study-with-pocket-prep
- Pocket Prep — Switch Exam Versions (2026-06-08): https://help.pocketprep.com/en/articles/10536957-how-do-i-switch-exam-versions
- Pocket Prep — AI-Powered Tutor (2026-04-13): https://help.pocketprep.com/en/articles/14604210-ai-powered-tutor
- Pocket Prep product/pricing surface, checked 2026-09-15: https://www.pocketprep.com/
- Anki Manual — Packaged Decks: https://docs.ankiweb.net/importing/packaged-decks.html
- Anki Manual — Text Files: https://docs.ankiweb.net/importing/text-files.html
- Anki Manual — Exporting: https://docs.ankiweb.net/exporting.html
- RemNote — Exam Scheduler: https://help.remnote.com/en/articles/9102040-understanding-the-exam-scheduler
- RemNote — Preparing for an Exam: https://help.remnote.com/en/articles/9101991-preparing-for-an-exam
- RemNote — Exam Study Plan: https://help.remnote.com/en/articles/16081995-exam-study-plan
- RemNote — Managing New Cards: https://help.remnote.com/en/articles/16213222-managing-new-cards
- Chrome Developers — HTML `<install>` origin trial (2026-05-12): https://developer.chrome.com/blog/install-element-ot
- Chrome Developers — Seamless PWA origin migration (2026-06-03): https://developer.chrome.com/blog/seamless-pwa-origin-migration
- Chrome Developers — PWA docs: https://developer.chrome.com/docs/capabilities/pwa
- iPAS official 115-year ISE exam brochure: https://www.ipas.org.tw/api/proxy/uploads/certification/ISE/115%E5%B9%B4%E5%BA%A6%E8%B3%87%E8%A8%8A%E5%AE%89%E5%85%A8%E5%B7%A5%E7%A8%8B%E5%B8%AB%E8%83%BD%E5%8A%9B%E9%91%91%E5%AE%9A%E7%B0%A1%E7%AB%A0%28%E5%88%9D%E3%80%81%E4%B8%AD%E7%B4%9A%29_1150129_20260129102918.pdf

### Community signals — anecdotal only

- Reddit / Anki, imported-deck behavior (2026-07-11): https://www.reddit.com/r/Anki/comments/1utsb49/why_did_my_imported_anki_deck_show_up_as_default/
- Reddit / Anki, service migration and learning history (2026-05-09): https://www.reddit.com/r/Anki/comments/1t7s3jg/ankihub_to_ankicollab/
- Reddit / Anki, updated deck organization without losing cards (2026-08-10): https://www.reddit.com/r/Anki/comments/1vkdztv/relocate_existing_cards_on_import/

## What Changed Since Last Radar

Compared with `2026-09-15T095812Z-external-radar.md`:

1. Fair rotation advanced from `clinical-scribe-worker` to `cyber-prep-coach`.
2. A new source-confirmed **semantic version-compatibility gap** was isolated in a supported local backup/import/activation workflow; it is not a missing-framework complaint.
3. Fresh external evidence from Pocket Prep and Anki independently supports explicit exam/content-version transitions and separation of content updates from learner state.
4. The minimum response was narrowed to a local fail-closed version check, not cloud sync, a migration service, or a new data registry.
5. No issue was opened because active draft PR #2 modifies the same root path; this run records `SKIPPED_LOCKED_ACTIVE_PR#2` rather than competing with active work.
6. PWA installability and RemNote deadline planning were evaluated but rejected/deferred as lower priority or duplicate evidence.

## Completion, Gaps, and Cursor

### Completed

- Fresh paginated Reese-max owner inventory.
- Quality-v2 blob and current product/owner direction re-read.
- Current default-branch evidence for `cyber-prep-coach` inspected.
- Existing issues and all-state PRs checked for duplicate/active ownership.
- Direct competitor, adjacent workflow, emerging technology, pricing/capability surface, official iPAS source, and anecdotal community evidence checked.
- Opportunity Map and four-gate triage completed.
- No source/config/deploy/worker changes performed.

### Gaps / runtime

- No `bank-v1` → `bank-v2` browser fixture was executed in this run. Observable user impact remains `NEEDS_RUNTIME_VERIFICATION`.
- No evidence yet quantifies how often future dataset changes preserve or invalidate stable question identity.
- No evidence currently justifies a full cross-version migration subsystem.
- Active PR #2 must be re-read before any later issue/write because its version-handling behavior may change.

### Next fair-rotation cursor

**`exam-archive`**

This radar does not declare any repository or the portfolio CLEAN.