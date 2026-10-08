# Product Board Audit — 2026-10-05T11:03:27Z

Status: **PARTIAL / ACTIONABLE REGRESSION FOUND**  
Mode: audit and triage only; no product code, workflow, settings, secret, deployment, merge, worker, or GOAL changes.

## Run contract and immutable evidence

- Issue-quality rules: `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Owned inventory: 46 repositories; 45 active and 1 archived (`obsidian-vault`). Pagination completed. Archive was retained as an inventory exclusion, not treated as a defect.
- Fair cursor entered at `Reese-max/note-filler`; next active cursor is `Reese-max/octobroker`.
- Previous round reference: `.github/quality-audits/2026-10-05T081500Z-product-board-audit.md`.
- This run rechecked all default-branch movements since 08:15Z, then completed the fair-cursor evidence pass for `note-filler`.
- No portfolio CLEAN claim: the fixed A01–J05 protocol has not completed two qualifying clean rounds and required runtime evidence remains outstanding.

## Incremental discovery

| Repository | Inspected default HEAD | Evidence checked | Result |
|---|---|---|---|
| autodev-ng | `8136a8b0529bea75e34d57410501f587e19f3508` | default commit and exact-HEAD Actions run 37283774567 | CI success; no new qualifying product finding |
| tick-stock-panel | `39c8e20c82163ae8716432d1d6f757b116940345` | merged PR #20, all-state PR/issue scan, exact HEAD Actions | no Actions receipt on HEAD; no new confirmed P0/P1/P2 finding |
| taichung-police-intel | `ff093eaf572b9eb16838fcb524509655004375e8` | merged PR #140, full workflow jobs/logs/artifacts, open PRs, #20/#49/#62 | **confirmed P1 publication regression**, tracked as #141 |
| note-filler | `7e29811376ec47b5fcf42ba0e9f8fdd5e9aee42e` | README, recursive tree, manifests/config, source/tests, recent commits, all-state Issues/PRs, branches, Actions, audits | exact-HEAD CI success; no new issue passing all four gates |

`note-filler` is a live product repository, not a content-only exclusion. Its root contract describes a local/single-worker legal and administrative note research tool that preserves original input, marks unsupported supplements `pending_evidence`, and requires human source/date/jurisdiction review. Open PRs #2/#5/#6/#7/#10/#13/#15/#16/#17/#19/#20 were treated as unmerged candidates, not current product evidence. Recently merged #1/#3/#4/#9/#12 remediations were present on default; the old README sentence saying the durable claim-review workflow is absent is now stale after PR #14, but the audit found no P2 completion/recovery impact and did not manufacture a documentation issue.

## Confirmed regression: taichung-police-intel #141

Fingerprint: `taichung-police-intel + release-verification test fixture + merged PR #140/default push + nested_diagnostic duplicate-key mutation is a no-op + verification gate fails and deployment is skipped`.

- Failed run: https://github.com/Reese-max/taichung-police-intel/actions/runs/37295596396
- Failed build job: https://github.com/Reese-max/taichung-police-intel/actions/runs/37295596396/job/111715927337
- Introducing merge: https://github.com/Reese-max/taichung-police-intel/pull/140
- Tracking issue: https://github.com/Reese-max/taichung-police-intel/issues/141
- Evidence class: **CONFIRMED / EXECUTED_REPRODUCTION**
- Kind / severity / triage: `BUG / P1 / NEEDS_REVIEW`; `auto_implementation=false`
- Impact: the full verification gate stops, so upload, deploy, and public verification are skipped. Last-known-good may remain available, but the new default-branch product cannot be published.
- Exact failure: `test_mcp_duplicate_keys_cannot_hide_extra_evidence_or_diagnostics[nested_diagnostic]` ends with `AssertionError: RuntimeError not raised`, followed by `VERIFY_FAIL release-verification-tests:exit=1`.
- Bound root cause: the test replaces `"missing_required_sources": []`, but the blocked fixture does not contain that empty value. The mutation is a no-op; it does not prove the production duplicate-key parser accepts a malicious nested key.
- Red-team counterevidence: the sibling evidence-duplicate case is rejected; the verifier uses `object_pairs_hook` to reject duplicate keys; publication outcome correctly remains `PUBLICATION_NOT_CONFIRMED / VERIFICATION_FAILED`. Therefore the minimum fix is the fixture plus a “mutation occurred” assertion, not weakening the gate or redesigning the verifier.
- Regression state: **STILL_REPRODUCIBLE** on exact default HEAD. A future unit green is only PARTIALLY_FIXED; VERIFIED_FIXED requires the same default-branch refresh/deploy path and adjacent rights-blocked assertions to pass.

## External competitor and alternative workflow scan

Sources were read on 2026-10-05. “Confirmed” means the linked official vendor/project page states the capability; it does not prove user outcomes, legal correctness, or ROI.

| Product / alternative | Confirmed evidence and date | Relevant comparison | Product-board treatment |
|---|---|---|---|
| NotebookLM | Google’s 2026-06-08 update, updated 2026-07-16, describes upgraded research/chat and downloadable reports; official 2026-05-27 page says answers are grounded in provided sources with citations while still warning of inaccuracies: https://blog.google/innovation-and-ai/products/notebooklm/better-research-notebooklm/ and https://blog.google/innovation-and-ai/products/notebooklm/notebooklm-google-io-2026/ | fast first success, source-grounded chat, mobile and multimodal summaries | **MUST MATCH:** visible source binding and uncertainty. **DO NOT COPY:** treating polished generation as adoption-ready legal text |
| Zotero | Official “Why Zotero” and storage pages, accessed 2026-10-05, confirm browser capture, PDF annotation, cited notes, word-processor integrations, local unlimited files, API/portable data, and 300 MB free / paid storage tiers: https://www.zotero.org/why and https://www.zotero.org/storage/ | mature citation capture, provenance, portability, sync | **SHOULD BE BETTER:** turn a source-bound gap into a reviewable correction without replacing citation management. Reuse/export, not a new library platform |
| Obsidian | Official pricing, accessed 2026-10-05, states free local app, optional Sync from USD 4/user/month annual and Publish from USD 8/site/month annual: https://obsidian.md/pricing | local-first notes, extensibility, optional sync/publish | **DIFFERENTIATOR:** evidence-state and correction contract. **DO NOT COPY:** plugin breadth or paid sync surface without proven demand |
| Lexis+ / Protégé | Official product pages, accessed 2026-10-05, describe authoritative legal research, Shepard’s citation signals, natural-language research/drafting and answer validation; detailed pricing is contact-led: https://www.lexisnexis.com/en-us/products/lexis-plus.page and https://www.lexisnexis.com/en-us/products/lexis-plus-protege.page | authoritative corpus and citation treatment, professional workflow | **MUST MATCH for supported law claims:** authority/currentness boundaries. **DO NOT COPY:** enterprise corpus scope or pricing model |
| Perplexity | Official Help Center updated 2026-07-21/09-02 says Pro increases citations and file analysis; plans span free, Pro, education, Max and enterprise: https://www.perplexity.ai/help-center/en/articles/10352901-what-is-perplexity-pro and https://www.perplexity.ai/help-center/en/articles/11187416-which-perplexity-subscription-plan-is-right-for-you | fast web research and citation density | **SHOULD BE BETTER:** stable per-claim acceptance history and original-note immutability. Citation count alone is not evidence quality |

Opportunity matrix:

- **MUST MATCH:** source/date/jurisdiction visibility; explicit uncertainty; originals remain recoverable; currentness cannot be inferred from a stale snapshot.
- **SHOULD BE BETTER:** one supported gap → one bounded supplement → one human decision → one exportable receipt; avoid generic research-chat sprawl.
- **DIFFERENTIATOR:** immutable original beside correction, `verified` vs `pending_evidence`, per-result capability isolation, deterministic claim decision history.
- **DO NOT COPY:** audio/video generation, general web answer breadth, plugin marketplace, enterprise collaboration, or new paid infrastructure without demonstrated use.

No competitor feature was used as defect evidence or as authorization to build.

## Product board simulation

This is a single-model multi-viewpoint exercise, not independent expert consensus.

| View | Position |
|---|---|
| CEO | If only three actions: restore the proven GovIntel publish path; finish note-filler’s exact-currentness/runtime proof; reduce stale/superseded PR ambiguity. Do not start a new platform or AI surface. |
| CPO | Keep note-filler narrowly for reviewable legal/admin note corrections. A stale README sentence is a maintenance blemish, not a P2 product incident. |
| CTO | #141 is a fixture-contract regression. Repair the mutation target and assert the mutation; keep fail-closed verifier semantics. |
| Staff / Principal Engineer | Do not fold #141 into #20: the symptom is publication failure but the actual root cause and acceptance path differ. |
| UX Lead / Researcher | Competitors shorten first success, but note-filler’s value is trust and review. Runtime usability evidence is still missing; synthetic personas cannot claim completion-rate gains. |
| Growth | Distribution and mobile polish could matter later, but zero external usage evidence means no growth-led priority escalation. |
| CFO | Prefer local/reused components. Avoid corpus licensing, hosted sync, and paid provider commitments. |
| Security / Privacy | Preserve local single-worker boundary, opaque result capability, no source/body logging, and strict duplicate-key rejection. |
| QA | Require the malicious mutation to be proven before expecting an exception. Re-run the same default-branch workflow after merge. |
| SRE | A correct fail-closed outcome is not a healthy release. Keep last-known-good and explicit age while #141 is open. |
| Accessibility | Keyboard, screen reader, zoom and mobile remain NEEDS_RUNTIME_VERIFICATION; absence of evidence blocks CLEAN, not proof of failure. |
| Support | Explain `pending_evidence` and “download does not mean accepted”; do not expose provider or legal jargon first. |

Board disagreement retained: Growth prefers visible mobile/research convenience, while Security/QA/SRE reject expanding surface area before runtime proof and release recovery. The decision is to defer expansion.

## 50 synthetic market personas

These are model-generated scenarios, not people, survey respondents, incident rates, or revenue evidence. M01–M30 preserve regression baseline; M31–M50 explore adjacent segments. They are separate from the fixed A01–J05 CLEAN protocol.

| ID | Background / constraint | Goal and journey | Friction / simulated result | Grade / action |
|---|---|---|---|---|
| M01 | Law student, first CLI use | upload one note → inspect gaps → export | contract discoverable; provider setup still technical | P3 / observe |
| M02 | Law student, exam rush | correct one doctrine quickly | `pending_evidence` prevents false certainty but adds review | maintain |
| M03 | Public-exam candidate | batch five TXT notes | per-note sidecars now present on default | regression pass static |
| M04 | Graduate researcher | trace each claim to source | source IDs and footnotes fit job | maintain |
| M05 | Administrative clerk, no Python | use local web UI | setup remains engineer-assisted | NEEDS_RUNTIME_VERIFICATION |
| M06 | Legal assistant | compare original vs correction | immutable side-by-side is strong | differentiator |
| M07 | Attorney, current-law sensitive | verify article currentness | #9 merged; provider/current official replay still bounded | NEEDS_RUNTIME_VERIFICATION |
| M08 | Teacher | review student note without overwrite | original remains authoritative | pass static |
| M09 | Student with private notes | avoid cloud upload | loopback/local boundary helps | maintain |
| M10 | Shared-lab user | receive only own export | capability isolation merged; shared deployment not supported | pass within stated boundary |
| M11 | CLI power user | process a directory | deterministic names/receipts expected | runtime replay pending |
| M12 | Windows user | install/run from PowerShell | no fresh Windows receipt | NEEDS_RUNTIME_VERIFICATION |
| M13 | macOS user | run local web and export | no fresh macOS receipt | NEEDS_RUNTIME_VERIFICATION |
| M14 | Linux maintainer | use CI as regression gate | exact HEAD CI passes | confirmed CI only |
| M15 | Screen-reader user | navigate upload/results/export | not executed | NEEDS_RUNTIME_VERIFICATION |
| M16 | Keyboard-only user | complete web flow | not executed | NEEDS_RUNTIME_VERIFICATION |
| M17 | Low-vision user | 200% zoom / large text | not executed | NEEDS_RUNTIME_VERIFICATION |
| M18 | Mobile user | inspect corrections on narrow screen | no mobile session | NEEDS_RUNTIME_VERIFICATION |
| M19 | Slow-network user | long provider call with recovery | real provider timeout not executed | NEEDS_RUNTIME_VERIFICATION |
| M20 | Cost-sensitive learner | use local law snapshot first | avoids paid platform, but currentness still must be explicit | maintain boundary |
| M21 | Reviewer | accept/reject one claim | durable review workflow now on default | static pass; runtime pending |
| M22 | Reviewer returning tomorrow | recover decision history | persistence code present | runtime pending |
| M23 | User with unsupported claim | keep claim out of adopted text | `pending_evidence` is explicit | maintain |
| M24 | User with conflicting sources | see conflict rather than smooth prose | tests/docs indicate conflict handling | runtime pending |
| M25 | Batch user with same filenames | avoid output collision | stable suffix behavior documented | runtime pending |
| M26 | User whose provider fails | no stale prior success returned | failure path is fail-closed | runtime injection pending |
| M27 | Privacy officer | ensure note content absent from logs | web log redaction contract present | source confirmed |
| M28 | Support engineer | diagnose without content leakage | fixed diagnostic markers | maintain |
| M29 | Auditor | bind exact output to manifest | per-output receipt contract present | static pass |
| M30 | New maintainer | understand trust boundaries | root README now exists; one sentence stale | P3 maintenance backlog only |
| M31 | Civil-service trainer | distribute reviewable study corrections | export helps, no collaboration layer | explore manually |
| M32 | Paralegal team lead | assign claim decisions | no team/auth model | DEFER; out of boundary |
| M33 | Librarian | import Zotero citations | no established workflow failure | evidence backlog |
| M34 | Obsidian user | round-trip Markdown notes | Markdown export available; no plugin required | maintain file interoperability |
| M35 | NotebookLM user | convert grounded Q&A into correction | different job; avoid chat clone | DO NOT build now |
| M36 | Researcher with DOCX | preserve formatting | DOCX intake/output evidence incomplete here | NEEDS_RUNTIME_VERIFICATION |
| M37 | Bilingual law student | Chinese note, English source | language fidelity not freshly tested | evidence backlog |
| M38 | Taiwan statute specialist | exact promulgation/applicability distinction | latest research records distinction | narrow advantage |
| M39 | Jurisdiction-mixed user | avoid applying foreign law | jurisdiction UX proof missing | evidence backlog |
| M40 | Course instructor | compare 30 outputs | batch auditability matters; runtime scale unknown | NEEDS_RUNTIME_VERIFICATION |
| M41 | Air-gapped user | run law lookup offline | snapshot lookup works by design; full LLM flow does not | clarify, no issue |
| M42 | Compliance team | keep human acceptance proof | decision history relevant | maintain |
| M43 | Institutional IT | deploy multi-user service | explicitly unsupported | DO NOT infer defect |
| M44 | API integrator | automate result retrieval | no public API contract established | DEFER |
| M45 | Accessibility tester | inspect status without color | unexecuted | evidence backlog |
| M46 | Legal editor | see exact changed passage | original/correction view fits | runtime usability pending |
| M47 | Examiner | reject unsupported supplement | explicit pending state helps | maintain |
| M48 | Data-retention owner | bound TTL and entry count | capability store is bounded | source confirmed |
| M49 | Procurement reviewer | compare free local vs paid suites | no paid dependency required | maintain |
| M50 | Product owner | decide build/narrow/reject | evidence favors NARROW around trust workflow | decision memo |

Synthetic preference share was not calculated; it would be false precision and cannot set priority.

## Red Team

1. **Could the release failure be an intentional rights block?** No. Rights-blocked behavior is an accepted operational state, but the run fails earlier because a test expected a mutation that never happened. The outcome correctly refuses to publish.
2. **Could the verifier be unsafe?** The executed evidence does not establish that. The duplicate-key parser exists and the sibling malicious evidence case is rejected. #141 is scoped to the fixture/gate.
3. **Could #20 already cover it?** #20 records protected-main direct push and missed finalizer. Same downstream symptom, different trigger/root cause and regression acceptance; merging would erase diagnostic precision.
4. **Should a new validation framework be built?** No. One fixture correction plus a mutation assertion is sufficient.
5. **Should note-filler copy NotebookLM/Lexis/Perplexity?** No. They are useful comparison points but do not prove note-filler demand, legal accuracy, or willingness to pay.
6. **Is the stale README sentence an actionable P2?** No supported completion/recovery failure was shown. Keep as maintenance evidence; do not create work to satisfy quota.
7. **Does exact-HEAD CI success prove note-filler product readiness?** No. Provider, browser, mobile, accessibility, timeout, and cross-platform paths remain unexecuted.
8. **Can this round declare portfolio CLEAN?** No. #141 is open and the fixed protocol/runtimes do not satisfy CLEAN stop conditions.

## NOW / NEXT / LATER / DON'T

- **NOW:** #141 — restore the exact publication path with the minimum fixture correction; retain fail-closed security checks.
- **NEXT:** re-run note-filler’s bounded currentness/provider scenario and fixed persona runtime cases without expanding product scope; reconcile genuinely superseded open PRs only through owner review.
- **LATER:** validate Markdown/DOCX interoperability, accessibility, mobile/narrow-screen and slow-provider recovery if supported-user demand is confirmed.
- **DON'T:** new RAG/chat platform, shared multi-user hosting, corpus licensing, plugin marketplace, enterprise collaboration, or paid vendor commitment from synthetic/competitor evidence.

## Decision memo

- **Serve:** Taiwan legal/administrative learners and reviewers who need a correction draft that never overwrites the original and makes unsupported claims visible.
- **Choice / competition:** compete on reviewability and source-state truth, not corpus breadth, media generation, or generic conversational search.
- **Differentiation:** immutable original/correction pairing; evidence-state separation; per-output traceability; durable claim decisions.
- **Top three priorities:** (1) restore GovIntel publication #141; (2) prove note-filler currentness and runtime trust paths; (3) reduce stale/superseded maintenance ambiguity after owner review.
- **Do not build / delete:** do not build collaboration/API/hosted sync now; do not delete safety checks. Candidate stale README text and superseded PRs may be simplified only with owner confirmation.
- **Risks / experiment:** highest risk is green static/unit evidence being mistaken for user/runtime correctness. Use isolated provider and browser fixtures, then BUILD/NARROW/REJECT by observed failures—not persona votes.
- **Portfolio recommendations:** `taichung-police-intel=INVEST` in reliability until #141 is verified; `note-filler=MAINTAIN + SIMPLIFY`; other repos unchanged because a full portfolio ranking requires completing the inventory rotation.

## Issue and write ledger

| Action | Count | Detail |
|---|---:|---|
| New issue | 1 | taichung-police-intel #141 |
| Existing issue updated/reopened | 0 | no duplicate comment or scope takeover |
| Research issue | 0 | no new bounded research met threshold |
| Deduplicated/rejected | 3 | #20 same symptom/different root; #62 umbrella only; stale note-filler README below P2 |
| Scope/severity correction | 0 | none |
| Verified fixed | 0 | #141 remains STILL_REPRODUCIBLE |
| Product code/config/workflow changes | 0 | prohibited by audit scope |
| Report write | 1 | this file on the existing audit-only Draft PR branch |

## Runtime pending and next cursor

- #141: rerun exact default-branch refresh/deploy workflow after a real fix; verify upload/deploy/public receipt and rights-blocked neighbor.
- note-filler: real provider success/failure, browser accessibility, mobile/zoom, cross-platform and multi-file runtime cases remain pending.
- Next fair active repository: `Reese-max/octobroker`.
- Portfolio status: **NOT CLEAN; PARTIAL rotation**.
