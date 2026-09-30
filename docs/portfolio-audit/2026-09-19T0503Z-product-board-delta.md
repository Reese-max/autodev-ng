# Video Timeline Pipeline Product Board Delta — 2026-09-19 05:03 UTC

Repository: `Reese-max/video-timeline-pipeline`  
Default branch: `main`  
Inspected default HEAD: `048794bd62fbc1a956b60fa48ffc4a603c886125` (audit-only)  
Product baseline on default: `dc421fef263ccc5b7321910304a9fa910c1a5c5d`  
Inspected PR: [#21](https://github.com/Reese-max/video-timeline-pipeline/pull/21)  
Inspected PR head: `e50dcf349c68eb49576f08053d032f142d7a4b3c`  
Issue-quality rules blob: `8167e10798071d2276addaff6b201c6b0e904a2a`  
Previous formal board audit: [2026-09-17T0208Z](https://github.com/Reese-max/video-timeline-pipeline/blob/048794bd62fbc1a956b60fa48ffc4a603c886125/.github/quality-audits/2026-09-17T0208Z-product-board-audit.md)

## Scope and evidence boundary

This is an incremental audit of the new Ask My Videos implementation in PR #21 plus all-state Issue/PR tracking, review threads, current source/tests, and available GitHub receipts. The repository remains an active local-first video evidence pipeline, not an empty or content-only repository.

The owner inventory was fully enumerated: 41 Reese-max repositories, 40 unarchived and one archived. This repository was selected by the persistent fair-rotation cursor after UkePack. No third-party repository was modified.

The source was inspected at the fixed PR head above. Five open review threads were read in full and independently checked against the exact source ranges. GitHub returned no pull-request workflow run for the PR head and no commit status receipt was available. The PR body reports 60 local tests plus 26 eval subtests, but this round did not receive machine-verifiable logs, execute the suite, call MiniMax/OpenRouter, use production data, run a browser, or verify deployment. Findings are therefore `SOURCE_CONFIRMED`, not `EXECUTED_REPRODUCTION`.

## Executive decision

Recommendation: **INVEST / SIMPLIFY / BLOCK PR #21 UNTIL GROUNDEDNESS IS TRUE**.

The product should compete as a compact, local-first evidence pipeline: ingest authorized media, create stable occurrences, search across transcript/visual evidence, and hand reviewable citations to people or downstream editors. It should not compete as another hosted asset platform, full NLE, collaboration suite, or autonomous publishing system.

CEO, if only three things are done:

1. Make every answer fail closed when retrieval or context packing supplies no usable evidence.
2. Preserve citation identity end to end, including sparse/noncontiguous references and vector provenance.
3. Obtain exact-head offline CI plus bounded provider/runtime receipts before merge.

Do not add providers, a vector service, hosted collaboration, a mobile app, or a general RAG framework to solve these defects.

## Actionable findings

All five findings map to existing [Issue #5](https://github.com/Reese-max/video-timeline-pipeline/issues/5) and active PR #21. Issue #5, branch `devin/issue-5`, the assignee, and the unresolved review threads show active ownership. All are `SKIPPED_LOCKED`; this audit did not comment, retitle, label, merge, or implement.

### F-01 — Hybrid degradation bypasses question keyword extraction

- Fingerprint: `video-timeline-pipeline + hybrid query + vectors/key/embed unavailable + relevant FTS evidence omitted + degraded path searches exact natural-language phrase`
- Kind: `BUG`
- Severity: `P2`
- Decision priority: `HIGH_PRE_MERGE`
- Triage: `NEEDS_REVIEW`
- auto_implementation: `false`
- Evidence: `SOURCE_CONFIRMED`
- Review: [thread](https://github.com/Reese-max/video-timeline-pipeline/pull/21#discussion_r4035493125)

Who is affected: an Ask My Videos user when vectors are absent, the embedding key is missing, or query embedding fails. The supported non-strict path promises FTS degradation. `hybrid_search()` instead sends the entire question to the trigram FTS path; unlike normal FTS answering, it never calls `question_keywords()`. A natural-language question can return no evidence even when the indexed transcript contains the core phrase.

Expected: degradation preserves the keyword-based question journey and explains the lost semantic capability. Actual: the mode says FTS but may silently lose the relevant hit. The workaround is to rerun in ordinary FTS mode or manually supply a transcript phrase.

Minimum effective change: reuse the existing keyword extraction/interleaving path for hybrid FTS candidates and for every degradation reason. No tokenizer service or retrieval framework is needed.

Acceptance:
1. No-vectors, no-key, and embed-failure cases find a seeded natural-language question whose transcript contains only its extracted keyword phrase.
2. `retrieval_mode=fts` and the exact `degraded_reason` remain visible.
3. Strict mode still fails rather than degrades.
4. Filter behavior remains identical on both paths.
5. A new exact-head receipt covers Traditional Chinese and English questions.

### F-02 — Empty packed context still calls the answer model

- Fingerprint: `video-timeline-pipeline + Ask My Videos + retrieval hits exist but every block exceeds context budget + paid answer call with empty evidence + insufficient_evidence remains false`
- Kind: `BUG`
- Severity: `P1`
- Decision priority: `HIGH_PRE_MERGE`
- Triage: `NEEDS_REVIEW`
- auto_implementation: `false`
- Evidence: `SOURCE_CONFIRMED`
- Review: [thread](https://github.com/Reese-max/video-timeline-pipeline/pull/21#discussion_r4035493133)

Who is affected: users whose only matching summary or merged fragment exceeds the configured context budget. `pack_context()` can legitimately return zero blocks, but `answer_question()` only short-circuits before packing. It then sends MiniMax an empty evidence section, returns `insufficient_evidence=false`, and can charge for an answer that has no grounding.

This is P1 because it defeats the feature's central trust boundary on a reachable input and can present an ungrounded answer as grounded. No live hallucination or charge is claimed, and the code has not merged; therefore it is not P0 or a production incident.

Minimum effective change: treat zero packed blocks exactly like zero retrieval hits; return insufficient evidence plus packing diagnostics before any model call.

Acceptance:
1. A single over-budget hit produces no provider call.
2. The result sets `insufficient_evidence=true`, has no citations, and explains token-budget omission.
3. Mixed inputs still pack smaller valid blocks deterministically.
4. JSON and human CLI output agree.
5. A provider spy proves zero calls on the fail-closed path.

### F-03 — Sparse citations are renumbered in human output

- Fingerprint: `video-timeline-pipeline + grounded answer cites noncontiguous evidence indices + CLI enumerates filtered citations + displayed labels no longer match answer claims`
- Kind: `BUG`
- Severity: `P1`
- Decision priority: `HIGH_PRE_MERGE`
- Triage: `NEEDS_REVIEW`
- auto_implementation: `false`
- Evidence: `SOURCE_CONFIRMED`
- Review: [thread](https://github.com/Reese-max/video-timeline-pipeline/pull/21#discussion_r4035493140)

When an answer cites blocks `[1]` and `[3]`, validation correctly retains those two evidence records with `block_index` 1 and 3. The default CLI then uses `enumerate(..., 1)`, displaying them as `[1]` and `[2]`. The answer's `[3]` claim has no matching displayed source, while the second source is mislabeled.

This is a core evidence-integrity failure, not visual polish. JSON retains `block_index`, so the smallest repair is to render that value rather than generate a new sequence. No citation database or UI framework is needed.

Acceptance:
1. Answers citing `[1]` and `[3]` display sources `[1]` and `[3]`.
2. Answer text, JSON citations, human citations, occurrence IDs, and links preserve one identity.
3. Invalid model indices remain stripped and counted.
4. Contiguous citation output remains unchanged.
5. A CLI snapshot regression covers sparse and reordered model citations.

### F-04 — Ambiguous legacy vectors can cross backend namespaces

- Fingerprint: `video-timeline-pipeline + legacy bare model key + backend changes with same model name + old vector reused across incompatible embedding spaces`
- Kind: `BUG`
- Severity: `P2`
- Decision priority: `HIGH_PRE_MERGE`
- Triage: `NEEDS_REVIEW`
- auto_implementation: `false`
- Evidence: `SOURCE_CONFIRMED`
- Review: [thread](https://github.com/Reese-max/video-timeline-pipeline/pull/21#discussion_r4035493153)

`resolve_vector_key()` accepts a bare legacy model name for any requested backend. If an old OpenRouter vector set and a later local backend share the same model string and dimension, retrieval silently compares incompatible vector spaces; the dimension guard cannot detect it.

Minimum effective change: reuse a bare key only when backend ownership is provable from the known default mapping or an explicit migration receipt; otherwise require rebuild/rename and report why. No hosted vector store is needed.

Acceptance:
1. Proven single-backend legacy defaults migrate once.
2. Ambiguous custom bare keys are never reused across backends.
3. Same-dimension incompatible fixtures fail closed or rebuild explicitly.
4. Paid recomputation remains opt-in and visible.
5. Namespaced vectors remain reusable and deterministic.

### F-05 — Unknown-date notice contradicts include mode

- Fingerprint: `video-timeline-pipeline + date bound + include_unknown_dates=true + rows included but exclusion count/message still says excluded`
- Kind: `BUG`
- Severity: `P3`
- Decision priority: `P3`
- Triage: `NEEDS_REVIEW`
- auto_implementation: `false`
- Evidence: `SOURCE_CONFIRMED`
- Review: [thread](https://github.com/Reese-max/video-timeline-pipeline/pull/21#discussion_r4035493163)

The filters correctly include null-date rows when `include_unknown_dates` is true. `unknown_date_count()` still counts those rows as excluded, so human output can recommend a flag that is already active. Search results remain usable, hence P3 rather than the review badge's P2.

Minimum effective change: return zero excluded rows in include mode, or separately label included unknown-date rows.

Acceptance:
1. Default date filtering reports actual excluded unknowns.
2. Include mode reports zero excluded, or an explicitly named included count.
3. JSON and human output use the same semantics.
4. Job/category/platform/author filters constrain the count identically.

## Competitive delta — official sources checked 2026-09-19

| Product / alternative | Confirmed capability | Product implication |
|---|---|---|
| [VideoDB documentation](https://docs.videodb.io/) and [MCP server](https://docs.videodb.io/pages/mcp/index) | Hosted video/audio/image indexing, semantic/structured search, timestamped playable evidence, collection Q&A, editing/streaming, and 89 MCP tools | Confirms a broad hosted platform already exists. DO NOT COPY its infrastructure breadth; be better for local custody, explicit provider authority, and inspectable occurrences. |
| [Descript](https://www.descript.com/) | Hosted record/upload, transcription, text-based editing, and publishing with a free tier | Strong first-success and editing workflow. Treat it as an alternative/downstream editor; do not infer demand for hosted collaboration or pricing. |
| [Adobe Premiere Text-Based Editing](https://helpx.adobe.com/premiere/desktop/edit-projects/edit-video-using-text-based-editing/transcribe-video.html) | Transcript-driven editing inside a full NLE | MUST MATCH transcript/timeline identity and honest source linkage; DO NOT COPY the NLE surface. |
| [PySceneDetect 0.7.1 changelog](https://www.scenedetect.com/changelog/) | Open scene-detection primitives; 0.7.1 released 2026-07-21 | Reuse mature local primitives. The differentiator is evidence orchestration, not rebuilding scene detection. |
| FFmpeg + local transcription + manual notes | Low-cash-cost substitute with high operator effort | SHOULD BE BETTER on resumability, provenance, search, and bounded cloud effects. |

- MUST MATCH: stable occurrence identity, source/time ranges, fail-closed grounded answers, reproducible local search, truthful provider receipts.
- SHOULD BE BETTER: local custody, recovery, evidence-linked handoff, and explicit paid effects.
- DIFFERENTIATOR: compact local evidence pipeline with reviewable citations and downstream-editor handoff.
- DO NOT COPY: hosted asset platform, full NLE, team workspace, social publishing, live surveillance, or provider marketplace.

External product claims are `SOURCE_CONFIRMED` descriptions, not independent outcome, market-share, pricing, or product-benefit evidence.

## Synthetic product board

This is modelled multi-perspective reasoning, not independent expert consensus.

- CEO: fail closed, preserve citation identity, obtain exact-head receipts; defer breadth.
- CPO: Ask My Videos is valuable only if “grounded” is a verifiable contract, not a prompt aspiration.
- CTO: reuse keyword extraction, block indices, and current namespace migration; no new service.
- Staff/Principal Engineer: separate candidate generation, context packing, and rendering invariants; each needs a total contract.
- UX Lead: degradation and insufficient evidence must be understandable without knowing embeddings.
- UX Researcher: test whether users can trace a claim back to the exact playable moment; synthetic personas cannot prove trust.
- Growth: do not market cross-video Q&A while sparse citations can point at the wrong source.
- CFO: a zero-evidence model call is both trust and avoidable-cost failure; do not add providers.
- Security/Privacy: local-only remains first class; provider calls need explicit keys and visible boundaries.
- QA: current offline claims omit the five adversarial cases; add deterministic fixtures before runtime canaries.
- SRE: degradation must be observable and provider failure must not mutate meaning.
- Accessibility: human citation output must remain machine-readable; keyboard/screen-reader validation remains pending.
- Support: expose exact degradation reason, omitted evidence, and rebuild instructions.

Material dissent: Growth might accept imperfect citations as beta UX, and CTO might preserve every legacy vector to avoid paid recomputation. Security/QA/CPO reject both: wrong provenance and ungrounded answers invalidate the feature's core promise. The smaller safe choice is fail closed and require explicit ambiguous-vector recovery.

## 50 synthetic personas

This is a model simulation, not human research, incidence, votes, revenue, or priority evidence. R01–R30 preserve the 30-person regression baseline (60%); X01–X20 are the 20-person exploration set (40%). This set is separate from the fixed A01–J05 audit and cannot advance CLEAN.

| ID | Background / constraint | Goal and journey | Result / recommendation / evidence |
|---|---|---|---|
| R01 | Solo researcher, laptop | ingest interview → ask quote source | FAIL/P1 F-03; sparse citation can lose its displayed source |
| R02 | Documentary editor | search many clips → handoff | PARTIAL; stable occurrences useful, exact-head runtime pending |
| R03 | Podcast producer | ask a long question during provider outage | FAIL/P2 F-01; FTS degradation can miss known phrase |
| R04 | Student, fixed allowance | ask lecture summary | FAIL/P1 F-02; oversized-only evidence can still trigger call |
| R05 | NGO archivist, local-only | search oral history without cloud | PARTIAL; local FTS preserved, no runtime receipt |
| R06 | News researcher | cite nonadjacent clips | FAIL/P1 F-03 |
| R07 | Taiwan operator | filter by publication date | FAIL/P3 F-05 when unknown dates are included |
| R08 | Traveling editor | switch embedding backend | FAIL/P2 F-04 on ambiguous legacy namespace |
| R09 | Cost-conscious creator | trust “no evidence, no call” | FAIL/P1 F-02 |
| R10 | Automation operator | unattended hybrid search | FAIL/P2 F-01; degradation silently changes recall |
| R11 | Existing Instagram subscriber | refresh saved author | STILL BLOCKED/P2 #8/PR #14; unchanged by PR #21 |
| R12 | Curator with queued items | add cap without losing queue | STILL BLOCKED/P2 #8 |
| R13 | New Instagram subscriber | bounded discovery | PARTIAL; active PR scope, no merged runtime |
| R14 | CLI novice | read human citation list | FAIL/P1 F-03 |
| R15 | Windows operator | run full pipeline | UNKNOWN; PR claims local tests, no receipt supplied |
| R16 | macOS editor | build/search evidence pack | UNKNOWN; OS/runtime not executed |
| R17 | Linux CI maintainer | verify PR SHA | FAIL/VALIDATION; no Actions/status receipt |
| R18 | Low-bandwidth user | degrade without vector service | FAIL/P2 F-01 |
| R19 | Screen-reader user | navigate answer/citations | UNKNOWN; AT not executed; preserve explicit indices |
| R20 | Color-blind reviewer | inspect textual evidence | NO NEW DEFECT; do not manufacture issue |
| R21 | Multilingual interviewer | ask Traditional Chinese question | FAIL/P2 F-01 seeded path |
| R22 | Privacy-first user | keep provider disabled | PARTIAL; FTS works, hybrid label must be truthful |
| R23 | Corrupt-artifact recovery user | rebuild index safely | PARTIAL; ambiguous vectors need explicit recovery F-04 |
| R24 | Batch operator | stop before paid answer | FAIL/P1 F-02 |
| R25 | Auditor | reconcile answer to occurrence | FAIL/P1 F-03 |
| R26 | Support responder | explain zero-hit degradation | FAIL/P2 F-01; reason visible but result can be wrong |
| R27 | SRE | survive embed timeout | PARTIAL; degradation exists but has recall regression |
| R28 | Owner with daily budget | avoid useless model spend | FAIL/P1 F-02; existing #4 also remains |
| R29 | QA engineer | spy on provider under empty packing | FAIL/VALIDATION; missing adversarial fixture |
| R30 | Security reviewer | inspect prompt-injection boundary | PARTIAL; prompt says ignore evidence instructions, no runtime attack test |
| X01 | Premiere editor | import evidence-backed cut | PARTIAL; #11 remains research |
| X02 | Resolve editor | consume markers/EDL | LATER; do not build editor |
| X03 | Descript user | switch for local provenance | LIKELY value, not user proof |
| X04 | Investigative journalist | verify every claim | FAIL/P1 F-03 is adoption blocker |
| X05 | Academic lab | reproducible retrieval | FAIL/P2 F-04 threatens vector comparability |
| X06 | Legal reviewer | preserve source/timecode | FAIL/P1 F-03; no legal-grade claim authorized |
| X07 | Agency editor | multi-user collaboration | OUT OF SCOPE |
| X08 | Mobile creator | native phone editing | OUT OF SCOPE |
| X09 | Social publisher | one-click publishing | OUT OF SCOPE |
| X10 | Air-gapped archivist | use all-local search | MAINTAIN; normal FTS is smaller alternative |
| X11 | Subscription-credit user | distinguish included vs paid | FAIL/P1 F-02; provider receipt absent |
| X12 | Multi-provider operator | change embedding backend | FAIL/P2 F-04 |
| X13 | Accessibility researcher | keyboard/AT evidence trace | UNKNOWN; runtime evidence backlog |
| X14 | Performance engineer | benchmark hybrid latency | UNKNOWN; no reproducible receipt |
| X15 | Maintainer | upgrade scene detection | LATER; reuse PySceneDetect rather than expand |
| X16 | Producer | approve generated answer | FAIL/P1 F-02/F-03 until evidence contract holds |
| X17 | Compliance lead | audit content credentials | #20 remains bounded research |
| X18 | Support lead | migrate old vectors | FAIL/P2 F-04; explicit rebuild path needed |
| X19 | QA lead | verify date-filter messages | FAIL/P3 F-05 |
| X20 | Owner with three priorities | groundedness → identity → receipts | NOW; defer breadth |

No Synthetic Preference Share is generated in this delta.

## Red Team

1. “The PR already has 60+26 local tests.” Counter: no GitHub receipt/log was available, and the exact five adversarial inputs remain open review findings.
2. “Prompt instructions force grounded answers.” Counter: F-02 supplies no evidence at all yet still calls the model.
3. “Invalid citation numbers are stripped.” Counter: F-03 corrupts valid sparse numbers during rendering after validation.
4. “Hybrid degrades to FTS.” Counter: it does not reuse the question-keyword path, so degradation can change a supported natural-language query into an exact phrase miss.
5. “Equal dimensions prove vectors are compatible.” Counter: backend/model identity defines the space; equal length is not provenance.
6. “Preserve bare vectors to avoid cost.” Counter: explicit rebuild/consent is safer than silent cross-space reuse. No recomputation is authorized by this audit.
7. “Unknown-date results are still included, so the notice is harmless.” Counter: it is lower severity, but contradictory guidance erodes recovery and support; P3 is proportionate.
8. “Build a dedicated vector database/RAG framework.” Rejected: existing SQLite, namespaces, keyword extraction, and block indices are sufficient for the proven root causes.
9. “Use VideoDB instead.” It is a valid broad hosted alternative, not evidence that this local product should copy its scope or abandon local custody.
10. “These are default-branch regressions.” No. PR #21 is unmerged; findings are pre-merge blockers. Default remains NOT CLEAN for earlier unresolved Issues and missing runtime evidence.

## NOW / NEXT / LATER / DON'T

NOW:
1. Repair F-02 and F-03 first; they are the grounded-answer trust boundary.
2. Repair F-01 and F-04 without new infrastructure.
3. Add F-05 to the same bounded PR scope, then obtain a fresh exact-head offline CI receipt.
4. Re-run Issue #5's eval with explicit natural-language degradation, empty-packing, sparse citation, cross-backend legacy, and include-unknown-date cases.

NEXT:
1. Run an authorized isolated provider spy/canary with explicit zero-call and bounded-call assertions.
2. Recheck existing P2 #4 cost integration, #18 timezone accounting, and #8 safe subscription migration.
3. Validate CLI, JSON, keyboard, screen-reader, slow-network, and cross-platform behavior.

LATER:
- Narrow NLE handoff (#11), C2PA research (#20), and measured performance.
- Provider/reranker expansion only after cost and evidence contracts are verified.

DON'T:
- No hosted vector service, universal provider framework, full NLE, collaboration SaaS, mobile app, social publishing, automatic top-up/failover, or new provider.
- Do not use PR claims, green unit tests, review badges, synthetic personas, or this report as merge/deploy/implementation authority.
- Do not infer product failure from missing CI or infer CI root cause without jobs/logs.

## Regression and write ledger

- New findings: 5.
- Severity: P1 2 / P2 2 / P3 1.
- Review-badge corrections: F-01 P1→P2; F-05 P2→P3; F-02/F-03 remain P1; F-04 remains P2.
- New Issues: 0.
- Updated Issues/comments: 0.
- Reopened Issues: 0.
- New research Issues: 0.
- Duplicate avoided: 5; all map to Issue #5 / PR #21.
- Mapping completeness: 5/5.
- SKIPPED_LOCKED: 5 due to active Issue, assignee, branch, PR, and unresolved review ownership.
- Verified Fixed: 0.
- Issue write blocked: 0.
- Report write blocked: 0 at preparation time.
- PR #21: `CANNOT_VERIFY / STILL_BLOCKED_PRE_MERGE`.
- Default branch: no new product change; previous #4/#18/#8 results remain valid.
- Fixed A01–J05: `NOT CLEAN, 0/2`.
- Runtime pending: exact-head CI, MiniMax/OpenRouter call boundaries, real library/provider, OS/browser/AT, CLI/JSON snapshots, deployment, cost accounting, and adjacent regression paths.
- Fairness cursor after this repository: `voice-actress`.

This audit-only report is not a product fix and does not invalidate or satisfy product runtime evidence.
