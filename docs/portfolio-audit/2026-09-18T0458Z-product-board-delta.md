# Product Board delta — 2026-09-18 04:58Z

## Scope and governing evidence

- Target: `Reese-max/chatgpt-dual-pipeline`.
- Default branch: `master@1ade604e9ed0fe2b6ffa516b27cbf075f5e21eb8`.
- Candidate reviewed: open PR #7, `fix/issues-3-4-release-gate@9f228f3768f3e50a9b708b53c897d41ecdfceb75`.
- Adjacent portability candidate: PR #8 at `91cb972d8fc0af7fdf2d3b044a3fc9b3e8c454dd`.
- Issue-quality rules: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md@8167e10798071d2276addaff6b201c6b0e904a2a`.
- Owner inventory was fully paginated: 41 visible owner repositories, 40 unarchived; only `Reese-max/obsidian-vault` is archived.
- Evidence class for the finding below: **SOURCE_CONFIRMED**. No deployment, production mutation, human editorial review, browser session, secret-backed provider call, or destructive test was performed.

The existing full product-board report at `.github/quality-audits/2026-09-08-2215-product-board-audit.md` and the fixed 50-persona Round 3 at `docs/audits/50-persona-round-3-2026-09-10.md` remain the product baseline. They are model simulations, not human research. Default-branch product code has not changed since those reports; the current HEAD is audit-only. This delta therefore does not repost the full baseline or count a new CLEAN round. Status remains **NOT CLEAN / 0 of 2**.

## New finding — PR #7 manufactures public-review approval from prior publication

```yaml
issue_quality_version: 2
kind: BUG
severity: P1
decision_priority: HIGH_PRE_MERGE
evidence: SOURCE_CONFIRMED
triage: NEEDS_REVIEW
auto_implementation: false
runtime: NEEDS_RUNTIME_VERIFICATION
```

Stable fingerprint:

`chatgpt-dual-pipeline + PR #7 legacy observation pages + blanket public_review backfill + previously public treated as human approval + release gate accepts unverified attestation`

### Problem and reachable chain

Issue #3 requires observation-derived daily/report pages to have an explicit, machine-readable **human public-review approval** before they enter production.

PR #7 adds that gate in `scripts/release-policy.ps1`: `status: published` plus `public_review: approved` and `public_review_at: YYYY-MM-DD` makes observation content eligible. The patch then adds those exact fields to **34 canonical source pages** and the same 34 generated copies, all dated `2026-09-16`.

The PR body explains the backfill as recording the fact that these pages were already online and asks the maintainer to remove markers only if a page was not actually reviewed. Prior publication is not evidence that the human de-identification/publication review required by #3 happened. This reverses the safe default:

1. legacy content was already public under the fail-open pipeline;
2. PR #7 interprets that exposure as approval;
3. the new gate accepts the inserted value without reviewer identity or a review receipt;
4. after merge, those pages remain eligible and the repository presents them as explicitly approved even when the PR itself cannot show that review occurred.

Representative source files include:

- `notes/01-daily/2026-07-02.md`
- `notes/01-daily/2026-07-30.md`
- `notes/04-reports/2026-W29.md`
- `notes/04-reports/實習成果總結.md`

Each receives the same `public_review: approved` and `public_review_at: 2026-09-16` pair. The 68 added marker pairs across source and generated copies correspond to 34 canonical pages, not independent reviews.

### Impact and severity calibration

- Privacy reviewer / internship author: cannot distinguish a real page-level review from an automated blanket backfill.
- Maintainer / auditor: a green release gate would falsely imply the acceptance criterion “human approval artifact exists” is satisfied.
- Public reader / supervisor: potentially sensitive observation-derived material remains in the publishable set without a defensible review record.
- This is **P1** because it defeats the only proposed human-review boundary for a public corpus derived from police internship observations.
- It is not P0: PR #7 is unmerged; this run found no personal data, secret, case disclosure, or production incident; the 34 pages may be safe after real review.
- This is not a second root separate from Issue #3. It is a new blocker on the candidate remediation and maps to #3 rather than opening a duplicate.

### Minimal effective correction

Do not infer approval from prior publication.

1. Remove the blanket `public_review: approved` backfill from canonical source pages.
2. For each legacy observation page, either obtain and record a real owner/reviewer decision or keep it in a non-eligible state such as `legacy_public_unverified` until review.
3. Record the reviewer identity or review reference plus the actual review date in the source-of-truth page or its reviewed PR/commit; generated `site/notes` copies must remain derived output.
4. Keep the existing small release-policy function. Do not add an approval database, CMS, identity service, or generalized workflow platform.

### Direct acceptance and regression

- No page becomes `public_review: approved` solely because it was already public.
- Every approval-changing source diff has a named accountable reviewer or immutable review/commit reference and the actual review date.
- Legacy pages without that evidence remain excluded from the next artifact; they are not silently grandfathered.
- The gate still excludes draft, scheduled, missing, malformed, unknown, and unreviewed observation content.
- Preview and authorized production verification prove excluded legacy slugs are absent/404 before Issue #3 can be considered fixed.

## Existing PR findings and execution evidence

PR #7 already has three unresolved review threads:

- relative-path normalization fails on Linux/macOS;
- malformed quoted YAML scalars can be accepted;
- `verify-all.ps1` is described as read-only although it rewrites generated trees.

Those are not duplicated here. PR #8 separately has unresolved findings for untracked generated files and an unchecked Node major in the auto-enrich deploy path. Both PRs and their branches remain active.

PR #7 head has no GitHub workflow run and no combined commit status. PR #8 has workflow run 35178761131 with conclusion `failure`; the repository comment says its matrix jobs were stopped before execution by account budget. That is a CI admission limitation, not proof that product tests failed or passed. Local claims in PR bodies were not independently reproduced in this run.

## Competitor and substitute-workflow refresh

Official sources checked 2026-09-18:

- Docusaurus 3.10.2 documents YAML-parsed front matter and custom parsing logic; page last updated 2026-07-10: https://docusaurus.io/docs/markdown-features
- MkDocs documents `draft_docs` as visible during development but excluded from production build: https://www.mkdocs.org/user-guide/configuration/#draft_docs
- GitBook describes change requests as branch-based edits reviewed before merging with published content (official product material dated 2025-12-17): https://gitbook.com/

The full baseline also covers VitePress and Notion Sites. Classification is unchanged:

- **MUST MATCH:** unpublished/unreviewed content cannot enter production.
- **SHOULD BE BETTER:** because the subject matter is sensitive, approval provenance must be truthful and auditable, not merely a boolean.
- **DIFFERENTIATOR:** de-identified Traditional Chinese police-technology learning with source links.
- **DO NOT COPY:** hosted collaboration suites, AI auto-writing, analytics surveillance, or a custom CMS.

Competitor features are not severity evidence; they only confirm that the smallest useful invariant is review-before-publish.

## 50 synthetic-persona continuity

The 30 regression + 20 exploration cohort from the 2026-09-08 full report is preserved; no role was rotated out. The new blocker most directly affects regression personas 5 (internship supervisor), 15 (privacy reviewer), 16 (content author), 18 (two-person editorial team), and 23 (compliance auditor), plus exploration personas 33 (government IT reviewer) and 34 (legal editor).

Red Team rejects converting that synthetic coverage into frequency, revenue, or priority claims. The existing synthetic switching table is not rerun because the product surface and default runtime evidence did not change; this candidate defect does not create a new market preference claim.

## Virtual board and disagreement

- **Security/Privacy:** approval must represent an actual review, not the historical fact of exposure; block merge until the attestations are truthful.
- **QA:** a test can prove missing markers fail closed, but cannot prove a human reviewed 34 pages. Require inspectable review provenance.
- **CTO / Staff Engineer:** keep one small policy function; fix the data entering it rather than building another service.
- **CPO / UX Research:** preserve the simple author contract—“review, then approve”—and avoid internal labels readers do not need.
- **SRE:** require preview/production absence receipts for unreviewed slugs; no production change is authorized here.
- **Support:** make legacy-state remediation explicit so another maintainer does not copy the blanket-backfill pattern.
- **Growth minority:** keeping already-public pages online avoids broken links, but link continuity does not outweigh a false privacy attestation; redirects or temporary removal are smaller than inventing approval.
- **CFO:** a bounded one-time page review is cheaper and safer than an approval platform.

CEO’s three choices: (1) truthful review provenance for #3, (2) portable and non-destructive verification for #4, (3) exact preview/production receipts. Do not add AI authoring, accounts, collaboration SaaS, analytics, or a new CMS.

## Red Team

- The pages were already public, and this audit did not find confirmed sensitive material. That prevents P0 escalation.
- Existing `source_checked` dates show source/fact checking, but the repository report explicitly says scanners and source checks do not replace public de-identification review.
- A boolean marker is sufficient only when its creation is controlled by a real reviewer decision; the defect is the unsupported backfill, not the absence of a ledger.
- The smallest alternative is to exclude unverified legacy pages and review them incrementally. A database, approval service, or migration framework is unnecessary.
- Existing unresolved review threads already cover parser and portability defects; this report does not rename or merge those roots.

## Coordination and tracking

Issue #3, PRs #5/#7, their branches, prior owner comments, and unresolved review threads establish active ownership. Under the lock/ownership rules this finding is **SKIPPED_LOCKED** for target-repository mutation. This run did not add a target Issue, PR comment, branch, implementation change, or lock marker and did not compete with the active owner.

This central report is the explicit tracking/blocker for the new evidence until the PR owner incorporates it or ownership is released. A later run must deduplicate against this fingerprint before creating an Issue.

## Accounting

- New actionable findings: 1.
- P1: 1; P0/P2/P3: 0.
- New/updated/reopened target Issues: 0.
- Duplicate issues avoided: 1; mapped to existing #3 and active PR #7.
- SKIPPED_LOCKED: 1.
- Verified fixes: 0.
- Default-branch regressions: 0.
- Issue write blocked: 0.
- Report write blocked: 0.
- Portfolio CLEAN: no.
- Next product-board cursor: `Reese-max/taichung-police-intel`.
