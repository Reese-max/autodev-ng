# External Competitive / New-Product / Workflow Radar — 2026-09-19T10:00:19Z

## Status / scope / evidence boundary

- Run status: **COMPLETE_FOCAL_ANALYSIS / FRESH_OWNER_INVENTORY / 0_NEW_ISSUES**.
- Owner scope: `Reese-max` only. No third-party repository was modified.
- Issue-quality rules re-read from `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh connected-owner enumeration returned **41 Reese-max-owned repositories / 40 unarchived**; `obsidian-vault` is the only archived repository returned. Older inventories were not used as the denominator.
- Fair cursor entering this round: `Reese-max/video-timeline-pipeline`, carried from `2026-09-19T081501Z-external-radar.md`.
- Focal default branch rechecked immediately before report write: `main@048794bd62fbc1a956b60fa48ffc4a603c886125`. Recent default-branch commits are audit/docs only; the current board still identifies `dc421fef263ccc5b7321910304a9fa910c1a5c5d` as the substantive product baseline.
- Latest owner-direction delta re-read: `docs/portfolio-audit/2026-09-19T0503Z-product-board-delta.md`. Current posture remains **INVEST / SIMPLIFY / groundedness first**. PR #21 must preserve fail-closed evidence, citation identity and exact-head verification; do not add providers, a vector service, hosted collaboration, mobile app or general RAG framework to solve current defects.
- Existing competitive/research scopes rechecked before deciding: #10/PR #16 bounded visual-evidence escalation, #11/PR #15 evidence→NLE handoff, #20 provenance, #22 MiniMax completion/cache-admission bug, plus #4/#8/#18 safety/accounting and #5/PR #21 retrieval/grounded citations. No active scope was taken over.
- No provider call, paid request, browser/NLE runtime, production-data test, branch, merge, deployment, worker/GOAL, product source/config/CI/secrets/settings change was performed.

## Executive decision

This round found a **real market convergence around speaker-aware transcription and context-aware ASR**, but it does **not** yet pass the repository evidence gate for a new Issue.

The useful product calibration is narrower:

> `video-timeline-pipeline` already preserves timestamped speech evidence and explicitly refuses to invent speaker identity. For interviews/podcasts, the next plausible evidence improvement is optional speaker-turn identity or user-authorized ASR context — but only after a frozen multi-speaker / jargon evaluation shows that the current timestamp-only workflow causes a material review burden or wrong decision.

No new provider, diarization framework, speaker database, transcript editor or general “speech intelligence” subsystem is justified by this round.

---

# Product → market category

| Product | Market / substitutes | Current differentiated job |
|---|---|---|
| `video-timeline-pipeline` | Premiere/Descript/Riverside text-first editing, TwelveLabs video intelligence, managed STT APIs, FFmpeg + Whisper/local scripts | Local-first, resumable, evidence-linked media → transcript/visual timeline → searchable evidence → downstream handoff, with explicit cloud authority |

The market increasingly bundles transcription, speaker turns, editing and publishing. The owner-approved differentiation remains evidence truth/recoverability and bounded external effects, not feature parity with a full editor or managed video platform.

# External Signals

## A. Direct video-intelligence signal — speaker-turn transcript is becoming a first-class retrieval unit

**CONFIRMED — TwelveLabs release notes, event 2026-08-19; checked 2026-09-19.**

Source: https://docs.twelvelabs.io/docs/get-started/release-notes

TwelveLabs added direct transcription for video/audio assets without requiring indexing first. When ready, callers can request segmentation by **word, sentence, or speaker turn**.

### User job

For interviews, podcasts, meetings and multi-person footage, a reviewer wants to move from “what was said at 12:34?” to “which participant said this, and where can I replay it?” without manually replaying every turn boundary.

### Transferable principle

Speaker-turn identity can be an evidence locator, not merely presentation metadata. If this repo ever adds it, an anonymous/stable turn identity should be kept separate from a human name or role so that `UNKNOWN` remains possible.

### Do not copy

Do not replace the local pipeline with TwelveLabs, do not require cloud indexing, and do not import a broad hosted asset/search platform merely because speaker-turn segmentation exists there.

---

## B. Direct editing workflow — speaker detection is surfaced at transcript creation time

**CONFIRMED — Descript product update, updated 2026-07-29; checked 2026-09-19.**

Source: https://www.descript.com/blog/article/new-automatically-start-transcribing-when-you-import-audio

Descript now starts transcription automatically on import and surfaces adding speaker labels / Speaker Detection during transcript creation rather than requiring a later manual cleanup pass.

### Transferable principle

For multi-person content, speaker structure is most useful when it arrives with the transcript and remains editable. This is a workflow signal, not evidence that `video-timeline-pipeline` needs Descript’s editor, collaboration or publishing surface.

---

## C. Speech-provider signal — diarization and contextual prompting are moving into the ASR layer

**CONFIRMED vendor capability — AssemblyAI Universal-3.5 Pro released 2026-07-07; contextual-prompting walkthrough published 2026-08-19; checked 2026-09-19.**

Sources:
- https://www.assemblyai.com/collection/releases
- https://www.assemblyai.com/blog/universal-3-5-pro-code-switching-contextual-prompting
- https://www.assemblyai.com/blog/ai-transcription-with-speaker-identification

AssemblyAI positions its current pre-recorded model around native code switching, contextual prompting and speaker diarization. Its accuracy/benchmark numbers are vendor claims and are **not** imported as this product’s expected quality or ROI.

The useful signal is architectural: domain vocabulary and speaker identity can be established closer to transcription instead of being guessed downstream by a summarizer.

### Do not copy

No AssemblyAI migration Issue is justified. The current owner direction explicitly says not to add providers while groundedness/safety work remains unresolved, and this round has no head-to-head runtime evidence on the owner’s media.

---

## D. Current provider capability — Groq already exposes a smaller, cheaper experiment surface

**CONFIRMED — Groq Speech-to-Text docs checked 2026-09-19.**

Source: https://console.groq.com/docs/speech-to-text

Groq’s current transcription endpoint documents:

- `whisper-large-v3` and Turbo;
- `verbose_json` with segment/word timestamps;
- optional `prompt` (up to 224 tokens) to guide style / spelling of unfamiliar words;
- segment metadata including `avg_logprob`, `compression_ratio` and `no_speech_prob`;
- no speaker-diarization request field in the currently documented transcription parameters.

Current repo evidence at `048794bd...` shows `groq_transcribe()` already requests `verbose_json`; `transcribe_all()` preserves `avg_logprob`, `compression_ratio` and `no_speech_prob`, and the repo already uses a calibrated `no_speech_prob` threshold to suppress a known silence-hallucination pattern. The request currently sends model/temperature/timestamps/language but not Groq’s optional transcription `prompt`.

### Transferable principle

Before adding a provider or a diarization subsystem, the smallest research surface is already present: evaluate whether **explicit user-supplied glossary/context** improves domain terms on frozen media while preserving source truth. Do not auto-generate this prompt from untrusted video text/title and then treat the steered transcript as independent evidence.

---

# New Releases / strategy changes

| Date | Signal | Relevance | Decision |
|---|---|---|---|
| 2026-08-19 | TwelveLabs direct asset transcription with speaker-turn segmentation | speaker-turn is becoming an addressable evidence unit | `ADJACENT_IDEA / HOLD` |
| 2026-08-19 | AssemblyAI contextual prompting demo for Universal-3.5 Pro | domain vocabulary can be handled at ASR time | `ADJACENT_IDEA / HOLD`; existing Groq prompt is smaller first experiment |
| 2026-07-29 | Descript automatic transcription + speaker detection prompt | reduces the later manual speaker-label pass | workflow evidence only; do not copy editor breadth |
| 2026-07-07 | AssemblyAI Universal-3.5 Pro speaker diarization/code-switching release | managed STT market is making multi-speaker structure first-class | no provider migration without owner-media evaluation |

Previously covered September signals — Gemini Agentic Video, Adobe Paper Edit/NLE handoff, MiniMax completion state and C2PA provenance — were deduplicated into #10/#11/#22/#20 and were not re-filed.

# Community Pain

**COMMUNITY_SIGNAL — Reddit r/Journalism, 2026-07-03; checked 2026-09-19.**

Source: https://www.reddit.com/r/Journalism/comments/1umo7ow/how_are_people_handling_interview_transcription/

A journalist describes transcript cleanup as time-consuming particularly with accents, background noise and overlapping speech, says quotes are still manually checked, and distinguishes lower-risk cloud workflows from sensitive material where local handling matters.

Boundary: this is one community thread, not prevalence, demand, market share or incident-rate evidence. It supports the owner’s local-first / evidence-review posture but does not establish a P2 defect or justify diarization implementation.

# Repository counterevidence / current capabilities

The radar actively looked for evidence that the apparent market gap was already solved or intentionally bounded.

1. `pipeline.py` already requests Groq `verbose_json` and retains segment timestamps plus `avg_logprob`, `compression_ratio`, `no_speech_prob`; it is not a text-only ASR pipeline.
2. Silence hallucination has an existing source-backed/local calibration: `NO_SPEECH_PROB_LIMIT = 0.6` and a recorded prior 85-minute test. Therefore “add ASR confidence framework” would overstate the missing capability.
3. Timeline speech events preserve the segment’s source metadata.
4. The summary system explicitly says **do not invent speaker identity**, and `speaker_claims` currently contains `claim + source_ids` rather than asserting a named speaker. The product is therefore conservative today rather than silently misattributing people.
5. Search for `diar` returned no default-branch implementation, and no open/closed Issue matching diarization was found. Absence alone is not treated as a defect.
6. Current owner priority is the groundedness/safety work in #5/PR #21 plus #4/#8/#18, not transcription-provider expansion.

# Adjacent Ideas

## 1. Speaker-turn evidence experiment — HOLD, no Issue

If a future run obtains stronger repo/user evidence, the smallest experiment is:

- 2–3 authorized frozen multi-speaker fixtures, including a short overlap/interjection case;
- current output as baseline;
- measure only the concrete reviewer task “locate who said a selected claim and replay the exact range”;
- preserve `speaker_id=UNKNOWN` when attribution cannot be defended;
- compare a local/offline or user-assisted labeling path before considering a new paid provider;
- BUILD/NARROW/REJECT based on review errors/manual attribution steps, not vendor cpWER claims.

Do **not** start with a speaker registry, identity database, embeddings, hosted diarization service or named-speaker inference.

## 2. User-authorized glossary/context for existing Groq ASR — HOLD, no Issue

Groq already exposes `prompt`. A future bounded test could compare the same technical/multilingual clip with and without a short **user-provided** glossary. The prompt must be treated as steering context, not independent evidence; source-derived untrusted metadata must not silently become transcription truth.

Exit:
- BUILD only if frozen references show a repeatable material reduction in important-term errors without increasing unsupported words;
- NARROW if useful only for explicit glossary workflows;
- REJECT if benefit is inconsistent or steering creates unacceptable bias.

No second provider, prompt service or glossary database is needed to answer this question.

## 3. Keep ASR uncertainty metadata available, but do not invent thresholds

The repo already preserves Groq quality metadata and uses `no_speech_prob` for one locally calibrated purpose. `avg_logprob` / `compression_ratio` should not be converted into a generic PASS/FAIL confidence gate without a representative frozen evaluation.

# Opportunity Map — `video-timeline-pipeline`

| Category | Decision | Rationale |
|---|---|---|
| **MUST MATCH** | Never turn unknown speaker identity into a named/role attribution without evidence | current summary policy already does this |
| **MUST MATCH** | Keep transcript occurrence/time identity stable through search/citations/handoff | current owner board and #5/#11 already own this |
| **SHOULD BE BETTER** | If multi-speaker attribution is validated later, make speaker-turn identity traceable/editable and separable from names | external market convergence; no current defect proof |
| **SHOULD BE BETTER** | Reuse existing ASR quality metadata and explicit user context before paying for more provider breadth | smaller, local-first path |
| **DIFFERENTIATOR** | Local custody + resumability + evidence-linked transcript/visual/search/NLE handoff | not full-editor feature count |
| **ADJACENT IDEA** | frozen speaker-turn evaluation for interviews/podcasts | `RESEARCH / NOT_ESTABLISHED / HOLD` |
| **ADJACENT IDEA** | explicit user glossary into existing Groq `prompt` | `RESEARCH / NOT_ESTABLISHED / HOLD` |
| **DO NOT COPY** | migrate to AssemblyAI/TwelveLabs merely for diarization | adds provider/cost/privacy surface before value proof |
| **DO NOT COPY** | Descript/Riverside full editor, collaboration, publishing and generative-media breadth | owner scope explicitly rejects this breadth |
| **DO NOT COPY** | automatic real-name speaker inference | identity evidence is stronger than model guess; preserve UNKNOWN |
| **DO NOT COPY** | arbitrary confidence thresholds from vendor metadata | no repo-specific calibration |

# Four-gate decision

## Candidate A — speaker-turn evidence

### Gate 1 — problem / value

Potential user: podcast/interview/research-media reviewer. Current transcript supplies time ranges but no speaker-turn identity. That can create a manual replay step if the user needs “who said this?” However, no current owner incident, completion-rate data or explicit user requirement was found; current summary deliberately refuses to invent identities, and replay-at-timestamp remains a valid workaround.

**Result: value plausible, problem severity NOT_ESTABLISHED.**

### Gate 2 — priority

- kind: `RESEARCH` candidate
- severity: `NOT_ESTABLISHED`
- decision priority: `LOW/MEDIUM — after current groundedness/safety priorities`
- triage: `NEEDS_EVIDENCE`
- auto_implementation: `false`

External product convergence is not a P2/P1 causal defect.

### Gate 3 — minimum solution

No product change now. First evaluate 2–3 frozen multi-speaker fixtures and the concrete reviewer task. If the workflow gap is material, test the smallest local/user-assisted label path before any new provider. A provider migration, speaker DB, identity service or transcript editor is not required for the research question.

### Gate 4 — research / implementation separation

This does not pass the Issue threshold yet. It stays in the central report with BUILD/NARROW/REJECT exit criteria. No implementation authorization.

**Decision: HOLD / NO ISSUE.**

## Candidate B — explicit glossary/context to existing Groq ASR

### Gate 1 — problem / value

Groq documents prompt-based spelling/context guidance and the current adapter does not send it. Technical jargon and code-switching are plausible weak points, but this round did not reproduce an important-term transcription error on current authorized media.

### Gate 2 — priority

`RESEARCH / NOT_ESTABLISHED / NEEDS_EVIDENCE`; lower than current #5/#4/#8/#18 work.

### Gate 3 — minimum solution

One frozen clip pair, explicit user-supplied glossary, same provider/model/settings, compare important terms and unsupported insertions. No provider switch or prompt infrastructure.

### Gate 4 — separation

Do not turn external vendor examples into an implementation decision. Keep central-report only until repo/user evidence changes the decision.

**Decision: HOLD / NO ISSUE.**

# Issue Mapping / Dedupe

- **0 new Issues.**
- **0 Issue comments/updates.**
- **0 PR comments/updates.**
- #5 / PR #21 — current grounded retrieval/citation work; newest product-board delta says block until groundedness is true. No scope grab.
- #10 / PR #16 — bounded visual-evidence escalation. Recent Gemini/TwelveLabs visual-intelligence ideas remain deduped here.
- #11 / PR #15 — evidence-backed paper cut / NLE handoff. Descript/Adobe transcript editing does not justify another editor Issue.
- #20 — C2PA/provenance research. Unchanged.
- #22 — MiniMax incomplete completion/cache admission. TwelveLabs completion semantics already mapped there; no duplicate.
- #4/#8/#18 — safety/accounting priorities remain ahead of optional ASR expansion.

No lock marker was written because no existing Issue/PR/shared mutable tracking state was modified. The new radar report uses a unique filename and does not overwrite shared history.

# Rejected Ideas

1. **“Competitors have diarization, therefore add diarization.”** Rejected: feature parity is not root-cause evidence; current product remains truthful by keeping speaker identity unknown.
2. **Switch Groq → AssemblyAI/TwelveLabs.** Rejected: no representative owner-media comparison, and current owner direction says do not add providers while higher-priority groundedness/safety work remains unresolved.
3. **Infer speaker names/roles with MiniMax from transcript content.** Rejected: the current system instruction correctly forbids inventing speaker identity; a model guess is not identity evidence.
4. **Create a generic transcript-confidence engine from `avg_logprob`.** Rejected: metadata is already preserved; only `no_speech_prob` has repo-specific calibration. More thresholds require frozen evaluation.
5. **Copy Descript/Riverside editing/publishing breadth.** Rejected by current product positioning; #11 already owns the narrow downstream handoff.
6. **Feed video title/description/category automatically into Groq prompt.** Rejected as the default because source metadata is untrusted and can bias the evidence transcript. Any prompt experiment should be explicit user authority with its own provenance.

# Cross-portfolio ideas

One narrow principle is retained without cross-repo Issues: **identity layers should remain separate** — media occurrence identity, speaker-turn identity and real-person identity are different claims with different evidence. A system may know exactly *where* a statement occurred while still correctly saying *who* is UNKNOWN.

No central speaker/identity framework is proposed from one repo.

# Sources

Primary / official:

- TwelveLabs release notes — 2026-08-19 transcription / speaker-turn segmentation; checked 2026-09-19: https://docs.twelvelabs.io/docs/get-started/release-notes
- Groq Speech-to-Text docs — checked 2026-09-19: https://console.groq.com/docs/speech-to-text
- AssemblyAI release index — Universal-3.5 Pro dated 2026-07-07; checked 2026-09-19: https://www.assemblyai.com/collection/releases
- AssemblyAI contextual prompting walkthrough — 2026-08-19: https://www.assemblyai.com/blog/universal-3-5-pro-code-switching-contextual-prompting
- AssemblyAI speaker identification article — published 2026-07; checked 2026-09-19: https://www.assemblyai.com/blog/ai-transcription-with-speaker-identification
- Descript automatic transcription / speaker detection — updated 2026-07-29; checked 2026-09-19: https://www.descript.com/blog/article/new-automatically-start-transcribing-when-you-import-audio

Community signal:

- Reddit r/Journalism interview-transcription discussion — 2026-07-03; checked 2026-09-19: https://www.reddit.com/r/Journalism/comments/1umo7ow/how_are_people_handling_interview_transcription/

Internal evidence:

- `Reese-max/video-timeline-pipeline@048794bd62fbc1a956b60fa48ffc4a603c886125`
- `.github/quality-audits/2026-09-17T0208Z-product-board-audit.md`
- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-19T0503Z-product-board-delta.md`
- prior radar `docs/competitive-intelligence/2026-09-18T060823Z-external-radar.md`

# What Changed

1. Fresh market evidence strengthens the hypothesis that speaker-turn structure is becoming a first-class transcript primitive across video intelligence / transcription products.
2. Repo counterevidence prevents overreaction: current pipeline preserves timestamp/quality metadata and intentionally refuses unsupported speaker identity.
3. A smaller potential research path emerged through the **existing Groq `prompt` parameter**; it could test explicit glossary/context value without a new provider, but no current repo/user evidence justifies an Issue yet.
4. Current `#5 / PR #21` groundedness issues remain materially higher priority; no research hypothesis was allowed to pre-empt them.
5. No product code, Issue, PR, branch, runtime, paid provider or deployment state was changed.

# Calibration / completion / gaps / cursor

- Radar status: **COMPLETE** for this fair-rotation step.
- Runtime status for new ideas: **NEEDS_EVIDENCE / no experiment executed**.
- No claim that speaker diarization improves this product, no provider benchmark extrapolation, and no ROI/time-saved claim.
- No portfolio CLEAN claim.
- Current focal HEAD remained `048794bd62fbc1a956b60fa48ffc4a603c886125` immediately before report write.
- Next fair-rotation cursor: `Reese-max/ai-novel-workstation`.
