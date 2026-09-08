# External Competitive / Product Inspiration Radar — 2026-09-08 r3

> Scope: Reese-max owned, non-archived repositories visible to the connected GitHub installation. Public web outside Reese-max GitHub is the primary research source. Repository, Issue, PR and recent-commit evidence is used to resolve product identity, readiness, duplication and safety. `COMMUNITY_SIGNAL` is anecdotal evidence only and is not treated as market-share, efficacy or incident-rate data.

## Executive Summary

This round found **one new high-confidence product opportunity** strong enough to create a GitHub Issue, plus two adjacent directions that were deliberately kept in research/defer status to avoid feature bloat.

1. **`voice-actress #6` — criterion-linked answer evidence + verifiable legal-source evidence for Shenlun grading.** The product already returns rubric scores, deductions, missed issues and law-citation judgments, but the learner still has to manually reread the whole answer to discover which sentence supposedly earned or lost points. Current AI grading products increasingly link rubric criteria to highlighted/quoted student passages, while fresh 2026 assessment research continues to emphasize human oversight and explicit evaluation of AI feedback itself. The opportunity is not “more AI grading”; it is to make each scoring claim inspectable against the learner’s exact answer revision and distinguish model judgment from verified legal-source evidence. **Classification: DIFFERENTIATOR. Opportunity Score: 93/100. NEW Issue #6 created.**
2. **`MaterialYouNewTab` — permission-minimal quick capture remains a research candidate, not a feature commitment.** New local-first new-tab competitors are converging on no-account/offline storage, but Juttr/JotTab/Taskade show a useful adjacent workflow: save the current page/title/URL into a task/note without copy/paste. This maps cleanly to MYNT’s existing Scratchpad/Tasks, but it would expand extension permissions and background behavior. Keep it in research until a permission-minimal `activeTab/contextMenus` design proves the value without undermining the current privacy posture.
3. **`book5-windows-server-2022` — do not turn a static 2022 deck into a generic AI course platform.** Microsoft Learn now has a 2026 Windows Server 2025 accreditation path. That strengthens the need for a visible “curriculum scope / product generation / last reviewed” boundary, but not enough evidence exists to justify interactive labs or AI tutoring in this repository.

Strongest cross-portfolio conclusion:

> **For AI feedback, “criterion + score + explanation” is still not enough. High-trust products should bind the recommendation to exact user/source evidence, version the input it was derived from, and make unverified evidence visibly different from verified evidence.**

---

## Product → Market Category / Opportunity Map

| Repository | Product / market category | Classification this round | Current decision |
|---|---|---|---|
| gemini-deidentifier | AI RPG / interactive fiction | DIFFERENTIATOR | Existing world-state consequence ledger remains the right reliability moat |
| exam-archive | Exam archive / public reference | MUST MATCH | Keep source fidelity, navigation, accessibility and performance ahead of personalization |
| police-exam-practice | Legacy police-exam practice entry | MERGE / DO NOT DUPLICATE | Product logic belongs in `police-exam-archive` |
| police-exam-archive | Official police-exam corpus + quiz/analytics | DIFFERENTIATOR | Existing #60 Attempt Ledger + deadline-aware review queue owns current learning-state work |
| 92-duty-scheduler | Constraint-based scheduling | DIFFERENTIATOR | Existing #19 explainable repair plans remains high-value |
| openab | Discord ↔ ACP coding-agent broker | MUST MATCH / SECURITY | Human approval broker remains important; Issues are disabled |
| UkePack | MusicXML → teacher/practice pack workflow | SHOULD VALIDATE | Teacher Beta evidence before interactive-player breadth |
| ppt-studio | AI presentation workstation | DIFFERENTIATOR | Claim/source provenance is more valuable than connector count |
| **book5-windows-server-2022** | Static Windows Server 2022 learning deck | **SHOULD BE BETTER** | Add/maintain curriculum/version-review boundaries before interactive breadth |
| obsidian-vault | Personal knowledge repository | ADJACENT IDEA | Interop only where it removes concrete copy/paste |
| **voice-actress** | Police-exam essay grading/coaching | **DIFFERENTIATOR** | **NEW #6 evidence-linked rubric grading / legal-source verification** |
| taiwan-intel-dashboard | Paused intelligence dashboard | DO NOT ADD NOW | Reliability/recovery remains dominant |
| autodev-ng | Multi-agent software delivery orchestrator | SHOULD BE BETTER | Evidence/promotion/review gates over more-agent count |
| flux-image-gen | AI image generation/edit workspace | DIFFERENTIATOR | Provenance receipt/C2PA work already active |
| claude-mem | Upstream agent-memory fork | UPSTREAM FORK | Track upstream unless deliberate product divergence is declared |
| lobsterpulse | AI coding CLI monitor | SHOULD BE BETTER | Existing runtime/observability work already covers current direction |
| prompt-autoresearch | Prompt optimization/evaluation | RESEARCH_REQUIRED | Variance-aware promotion gate remains current |
| neciken-summer-poem | AI literary workflow | MUST FIX | Reliability/CI before expansion |
| note-filler | Evidence-grounded legal/admin augmentation | DIFFERENTIATOR | Existing claim Verify/Accept/Reject workflow remains correct |
| gooaye | Empty placeholder | N/A | Define product purpose or archive |
| lplrs-judicial-sync | Judicial data synchronization | MUST MATCH / PRIVACY | Existing erasure/tombstone work; no duplicate |
| adng-memory | Operational memory/state store | RESEARCH_REQUIRED | Lifecycle/activation/staleness contract remains current |
| cyber-prep-coach | iPAS exam preparation | DIFFERENTIATOR | Existing mastery-profile / next-best study action owns learner model |
| cf-ai-router | AI provider router | RESEARCH_REQUIRED | Capability/reliability evidence before adaptive routing |
| avatar-vfo | AI persona simulation | MUST VERIFY THEN EXPAND | Runtime/security evidence before memory/voice expansion |
| project-doctor-web | Clinical teaching/research UI | DO NOT ADD NOW | Safety/runtime defects dominate |
| minideck | AI deck generation/share workflow | MUST MATCH | Draft head ≠ published head remains current priority |
| chatgpt-dual-pipeline | Internship-note publishing product | SHOULD SIMPLIFY | Source-of-truth / identity handoff first |
| internship-notes-sites-mirror | Publication mirror | N/A | Keep mirror role narrow |
| taichung-police-intel | Public-sector intelligence monitor | DIFFERENTIATOR | Role/unit profile remains high-value |
| soundbox-offline | Local-first music library/PWA | DIFFERENTIATOR | Same-LAN import work remains active |
| skill-foundry | Agent Skill creation/certification | DIFFERENTIATOR | Runtime compatibility / negative-transfer evidence remains active |
| video-timeline-pipeline | Video intelligence pipeline | DIFFERENTIATOR | Research Packs should reuse existing roadmap/state owners |
| ai-novel-workstation | Long-running AI writing workstation | DIFFERENTIATOR | Context Manifest work remains active |
| clinical-scribe-worker | Clinical scribe/evaluation | RESEARCH_REQUIRED / SAFETY | Specialty validation packs remain the next evidence gate |
| **MaterialYouNewTab** | Local-first new-tab productivity | **ADJACENT IDEA / DO NOT BLOAT** | Research permission-minimal quick capture; no Issue this round |
| cf-mcp-server | Cloudflare MCP server | MUST MATCH | Protocol/conformance migration remains current priority |
| tick-stock-panel | Taiwan stock monitoring/simulation | MUST MATCH + RESEARCH | Coverage truth before NL strategy compiler |
| herdr-skills | Multi-agent workflow Skills | SHOULD BE BETTER | Reuse Skill Foundry evidence semantics |
| ninax-line-hermes | LINE + long-running video-summary workflow | MUST MATCH / RELIABILITY | Revision-aware input lifecycle remains current |

---

## External Signals

### A. Direct competitor signal — rubric grading is moving toward exact student-evidence linkage

**CONFIRMED PRODUCT SIGNAL — Eduface, current product retrieved 2026-09-08**

Eduface describes rubric-grounded grading where each paper receives criterion scores and **highlighted passages linked to each criterion**; the grade is held until explicit approval. This is a product-capability signal, not independent evidence of grading accuracy.

Source: https://eduface.me/

**CONFIRMED PRODUCT SIGNAL — Examino, current product retrieved 2026-09-08**

Examino says it grades each rubric criterion separately and explains why by quoting the sentence in the essay that justifies the score. The transferable primitive is `criterion → exact learner evidence`, not its handwriting/OCR breadth.

Source: https://examino.ai/en/features/ai-essay-grader

**CONFIRMED PRODUCT SIGNAL — CoGrader, current product retrieved 2026-09-08**

CoGrader positions AI as a first-pass criterion-by-criterion grader. Teachers can change scores/comments and nothing reaches the student without sign-off. For Reese-max, the useful principle is **AI evaluation should remain inspectable and revisable**, not the LMS/classroom product surface.

Sources:
- https://cograder.com/ai-grading/
- https://cograder.com/ai-essay-grader/

**CONFIRMED RECENT PRODUCT SIGNAL — WriteAlign v2, available August 2026**

WriteAlign v2 markets TEA-aligned rubric scores, per-domain feedback and instructional strategies. This reinforces criterion-level feedback as the expected baseline; it does not establish independent accuracy/efficacy.

Source: https://writealign.net/

**Repository implication:** `voice-actress` already has rubric-specific `issueScores`, but its current structured output lacks answer-span evidence. The next competitive step is not more scoring dimensions; it is evidence-linked review.

---

### B. Adjacent workflow signal — local-first new-tab products are adding capture without requiring a full cloud workspace

**CONFIRMED PRODUCT SIGNAL — Juttr, current 2026**

Juttr is explicitly local-first/offline/no-account and adds a side-panel “one-click capture, any page” workflow that saves title/URL/favicon without breaking flow.

Source: https://www.juttr.cc/

**CONFIRMED PRODUCT CHANGE — JotTab v1.0.1, 2026-03-05**

JotTab added a quick-save extension popup and context-menu entry for bookmarking from any tab while remaining local-first/no-account.

Source: https://www.jottab.com/

**CONFIRMED CURRENT ECOSYSTEM — Taskade browser extension docs updated 2026-08-26**

Taskade’s extension combines new-tab access with a Web Clipper and right-click text capture. This is a broader cloud product, so only the friction-removal pattern is relevant.

Source: https://www.taskade.com/learn/connect/brave-extension

**CONFIRMED CURRENT MARKET SIGNAL — Speedtab, Chrome Web Store, published 2026-09**

Speedtab emphasizes local-first storage, no account/backend/tracking, portable export/import, tasks and notes. This reinforces the strategic value of MYNT’s current local-first posture rather than arguing for a cloud account layer.

Source: https://chromewebstore.google.com/detail/speedtab-local-speed-dial/adkjbdepojalajhfkoobiedddlnoamff

**Repository implication:** MYNT currently has Scratchpad, convert-to-task, workspaces, tasks and local storage, but no current-page capture path. A future feature should be opt-in and permission-minimal; otherwise it would trade away a stronger differentiator (low permissions/privacy) to save a few clicks.

---

### C. Emerging research signal — AI grading is increasingly treated as a recommendation that itself needs validation

**CONFIRMED RESEARCH — 2026-09-04, Human-in-the-Loop Framework for AI-Assisted Scoring**

A 2026-09-04 paper studies AI-assisted scoring in a national-assessment setting with roughly 5,000 responses in each of two recent test editions. The design focuses on model/human agreement and on routing the cases where human review is most valuable. The important product principle is that AI scoring should be deployed with explicit oversight rather than treated as an unquestioned authority.

Source: https://arxiv.org/abs/2609.05143

**CONFIRMED RESEARCH — 2026-08-03, Journal of Microbiology & Biology Education**

Rankins et al. published a rubric specifically for evaluating GenAI-generated feedback on student writing. The paper treats GenAI feedback as supplemental critique/revision support and argues for a systematic way to evaluate these tools as the ecosystem changes.

Source: https://journals.asm.org/doi/10.1128/jmbe.00350-25

**CONFIRMED RESEARCH — CyberScholar, published May 2026**

A multi-case study across 143 students and five teachers used teacher-provided rubrics/materials/exemplars to produce criterion-specific feedback. Reported limitations included rating inconsistency and assignment-expectation misalignment, reinforcing calibration and human oversight needs.

Source: https://arxiv.org/abs/2605.17055

**Transferable principle:** an AI-generated scoring statement should carry enough local evidence for a learner or reviewer to challenge it, and downstream learning state should distinguish evidence-linked feedback from unlocated/model-only feedback.

---

## New Releases / Changes Worth Tracking

| Date | Product / ecosystem | Change / signal | Reese-max relevance |
|---|---|---|---|
| 2026-09-04 | AI-assisted national assessment research | Human-in-the-loop routing of AI scoring | `voice-actress`: keep evaluative authority inspectable; create review/evidence surface |
| 2026-09-02 | Slaet Chrome extension | Local-first new-tab tasks/notes/reminders; optional sync | `MaterialYouNewTab`: local-first remains competitive, cloud account not required |
| 2026-09 (current) | Speedtab | New local-first dashboard with tasks/notes/export and no backend | MYNT: privacy/data ownership remain meaningful product signals |
| 2026-08 | WriteAlign v2 | Rubric/domain feedback workflow | essay products: criterion-level feedback is baseline, not differentiator by itself |
| 2026-08-03 | JMBE GenAI feedback rubric | Framework for evaluating AI-generated feedback | build feedback QA/evidence contracts rather than trust model prose |
| 2026-08-26 | Taskade extension docs | New-tab + web clipper / right-click capture workflow | adjacent capture pattern; do not copy cloud breadth |
| current 2026 | Eduface / Examino | Criterion score linked to highlighted/quoted student passages | `voice-actress`: evidence-linked feedback opportunity |
| current 2026 | Microsoft Learn Windows Server 2025 Accreditation 2026 | Newer generation training path | `book5-windows-server-2022`: make scope/freshness boundary explicit; do not pretend to be current Windows Server authority |

---

## Community Pain Points

These are `COMMUNITY_SIGNAL` only and are not treated as statistics.

### 1. Generic AI feedback can create more review work instead of less

A 2026-03-28 r/Professors thread described a TA’s AI-generated grading feedback as generic and requiring the professor to regrade the work. This does not prove a general failure rate, but it highlights a useful failure mode: feedback that sounds specific can still be hard to defend when it is not visibly tied to the student’s actual text.

Source: https://www.reddit.com/r/Professors/comments/1s6471j/ta_used_ai_to_grade_papers/

### 2. Students may distrust AI evaluative authority even when feedback is usable

Recent student/community discussions show discomfort when AI appears to be the final grader, especially when the reason for deductions is difficult to inspect. This is anecdotal, but it aligns with the emerging research distinction between feedback utility and evaluative authority.

Representative source: https://www.reddit.com/r/artificial/comments/1skhddq/did_my_professor_use_ai_to_grade_my_paper/

### 3. Rubric-complete feedback can be overwhelming

A 2026-05 community post about grading workflows observed that generic AI prompts often return a wall of rubric feedback and over-comment every trait; the claimed practical alternative is to focus on the few most useful growth edges. This is an individual workflow anecdote, but it supports a design warning: evidence-linked grading should make feedback easier to inspect, not merely create more annotations.

Source: https://www.reddit.com/r/ChatGPTPromptGenius/comments/1t79not/after_watching_a_teacher_grade_30_essays_in_one/

---

## Adjacent Ideas

### 1. Shared `EvidenceLinkedFeedback` primitive

Potential reusable envelope:

```text
input_revision / source_hash
+ criterion / recommendation
+ exact evidence locators
+ evidence status: supported / partial / contradicts / unlocated
+ evaluator/model provenance
+ authoritative-source verification (separate from model judgment)
+ stale-on-input-change semantics
```

Best fits: `voice-actress`, `note-filler`, `clinical-scribe-worker`, `ppt-studio`, later `project-doctor-web` once safety gates are healthy.

Do not centralize storage yet. Share semantics and validators first.

### 2. Permission Budget for browser-product features

Before a local-first extension adds a convenience feature, explicitly score:

```text
manual steps removed
vs
new browser permission
+ new background behavior
+ new data access scope
+ privacy explanation burden
```

Best fits: `MaterialYouNewTab`, browser/MCP surfaces, future clipper features.

### 3. “Model says correct” ≠ “source verified”

Legal, medical, finance and intelligence products should preserve a three-way boundary:

- model judgment;
- local-cache/source resolver result;
- authoritative externally verified evidence.

This prevents prompts that merely mention an official domain from being mistaken for runtime source verification.

### 4. Training-content freshness boundary

Static course products should expose:

- target product/version;
- source/curriculum generation;
- last reviewed date;
- newer-generation material link when applicable;
- what claims are intentionally historical vs current.

This is currently more valuable for `book5-windows-server-2022` than adding an AI tutor or lab engine.

---

## Opportunity Map

| Opportunity | Classification | Main repo(s) | Opportunity Score | Action |
|---|---|---|---:|---|
| Criterion-linked exact answer evidence + verified legal-source status | **DIFFERENTIATOR** | **voice-actress** | **93/100** | **NEW Issue #6 created** |
| Permission-minimal current-page → local Scratchpad/Task capture | ADJACENT IDEA / RESEARCH | MaterialYouNewTab | 82/100 | Research list only; no Issue this round |
| Explicit course-version / freshness boundary against newer Windows Server generation | SHOULD BE BETTER | book5-windows-server-2022 | 76/100 | Documentation/product-scope direction; no feature Issue |
| Shared EvidenceLinkedFeedback schema/validator | ADJACENT IDEA | voice-actress, note-filler, clinical-scribe-worker, ppt-studio | 87/100 | Extract only after ≥2 implementations prove compatible semantics |
| AI-feedback quality evaluation pack | SHOULD BE BETTER | voice-actress, educational products | 84/100 | Reuse deterministic fixtures first; avoid new meta-eval platform |

### Opportunity Score rationale — `voice-actress #6`

- User Pain: **9/10** — learner currently has to manually rediscover which exact sentence a rubric judgment refers to.
- Strategic Fit: **10/10** — deepens the primary Shenlun workflow instead of adding a side product.
- Novelty: **8/10** — highlighted criterion evidence exists in the market, but pairing it with police/legal source-verification status is more specialized.
- Evidence Strength: **9/10** — multiple current products + fresh 2026 research + concrete repository schema/UI gap.
- Reuse Potential: **9/10** — evidence-linked feedback semantics can later serve legal/admin/clinical products.
- Implementation Effort: **6/10** — schema + deterministic span validation + UI + migration; non-trivial but bounded.
- Security/Privacy/Cost Risk: **low-medium penalty** — no new external data source required for answer spans; legal verification must fail visibly when unresolved.

---

## Top 10 Cross-Portfolio Ideas

1. **Evidence-linked recommendation objects** — a score/finding should point to the exact input/source evidence that generated it.
2. **Input revision identity** — every evidence locator is bound to a content hash/revision; edits make prior locators stale.
3. **Deterministic locator validation** — model-proposed excerpts/offsets are suggestions until code proves they map to real source text.
4. **Model judgment vs verified source** — separate the model’s opinion from a resolver/cache/official-source verification state.
5. **Evidence-first review UX** — clicking a finding should navigate directly to the relevant source span instead of forcing manual search.
6. **Human/learner authority remains explicit** — AI recommendation should be reviewable, not silently promoted to authoritative state.
7. **Permission budget for browser conveniences** — every extra browser capability must justify the access scope it requests.
8. **Feedback evaluation fixtures** — evaluate not just score accuracy but support-location accuracy, unsupported claims, useful priority and stale invalidation.
9. **Product-version freshness boundary** — static learning/docs products should state target generation and last-reviewed scope.
10. **Do not duplicate platform breadth** — reuse existing domain-specific truth stores, sessions, provenance and review surfaces instead of building generic LMS/RAG/AI-chat layers.

---

## Ideas Rejected / Deferred

### Generic AI Tutor for `voice-actress` — REJECT THIS ROUND

The repository already has tutor/chat surfaces. The concrete friction is not lack of conversation; it is that the scoring output cannot prove which learner text supports each judgment. Improve inspectability before adding more dialogue modes.

### LMS / teacher roster / batch-classroom suite — DO NOT COPY

Eduface/CoGrader/Examino are teacher grading products. `voice-actress` is primarily a self-study police-exam product. Copying classroom administration would change the customer/problem rather than solve the current user journey.

### AI detection as a grading feature — REJECT

Several competitors bundle AI detection, but that does not improve a learner’s ability to understand a rubric deduction. It also introduces separate false-positive/governance risks.

### Cloud account / cross-device sync for `MaterialYouNewTab` — REJECT THIS ROUND

Recent competitors continue to market no-account/local-first as an advantage. Do not weaken this differentiator merely because some products offer optional sync.

### Add page-capture immediately to `MaterialYouNewTab` — DEFER TO RESEARCH

The workflow is attractive, but it may require `activeTab`, `contextMenus`, side-panel or related extension capability. First prove a permission-minimal design and a concrete copy/paste reduction target.

### Convert `book5-windows-server-2022` into interactive labs / AI tutor — REJECT THIS ROUND

The repository’s role is a static 2022 deck. Microsoft Learn already owns broad current-generation training. The safer differentiation is clear scope, accessible slides and trustworthy references.

### More generated exam questions across learning products — REJECT

Official/provenanced corpus, learner attempts and evidence-linked correction remain stronger portfolio assets than generic generated questions.

---

## Issue Mapping

### NEW

- **`Reese-max/voice-actress #6`** — `[Competitive Inspiration][DIFFERENTIATOR] 讓申論採分點逐項連結考生原文證據與可核對法源`
  - Stable fingerprint: `voice-actress + ShenlunGradingV2 rubric score + criterion-level score/deduction without validated answer-span evidence + learner must manually search own answer and independently re-check legal source`
  - Duplicate check: no matching open/closed Issue or PR found for evidence-span / criterion-linked grading.
  - Scope: versioned answer evidence, validated spans, missed-issue evidence status, legal-source verification state, evidence-linked AnswerSheet UI, persistence/export and stale invalidation.
  - Runtime verification required.

### NO DUPLICATE / KEEP EXISTING

- `voice-actress #1`: live/mock/fallback grading provenance; conceptually related but different fingerprint.
- `voice-actress #2`: grade→session schema/persistence/dashboard correctness; different fingerprint.
- `police-exam-archive #60`: learner Attempt Ledger / deadline-aware review remains active; no new learning-state Issue.
- `cyber-prep-coach #4`: mastery profile / next-best study action remains owner of broader learner-state logic.
- `note-filler #3`: claim-level Verify/Accept/Reject evidence workflow already covers that repository.
- `clinical-scribe-worker #4`: specialty validation pack remains the safety owner; no clinical feature expansion.

### RESEARCH LIST ONLY

- `MaterialYouNewTab`: permission-minimal quick capture from current page → Scratchpad/Task.
- `book5-windows-server-2022`: explicit curriculum/product-generation/freshness boundary and links to current-generation Microsoft training where appropriate.

---

## Sources

### Direct / product
- Eduface — rubric-grounded grading + highlighted passages linked to criteria: https://eduface.me/ — retrieved 2026-09-08 — `CONFIRMED_PRODUCT_SIGNAL`.
- Examino — criterion-by-criterion score with quoted supporting sentence: https://examino.ai/en/features/ai-essay-grader — retrieved 2026-09-08 — `CONFIRMED_PRODUCT_SIGNAL`.
- CoGrader — first-pass rubric grading + teacher sign-off: https://cograder.com/ai-grading/ and https://cograder.com/ai-essay-grader/ — retrieved 2026-09-08 — `CONFIRMED_PRODUCT_SIGNAL`.
- WriteAlign v2 — August 2026 release availability: https://writealign.net/ — retrieved 2026-09-08 — `CONFIRMED_PRODUCT_SIGNAL`.
- Juttr — local-first one-click side-panel page capture: https://www.juttr.cc/ — retrieved 2026-09-08 — `CONFIRMED_PRODUCT_SIGNAL`.
- JotTab changelog — quick-save popup/context menu added 2026-03-05: https://www.jottab.com/ — retrieved 2026-09-08 — `CONFIRMED_PRODUCT_CHANGE`.
- Taskade Brave extension docs, updated 2026-08-26: https://www.taskade.com/learn/connect/brave-extension — `CONFIRMED_PRODUCT_CHANGE`.
- Speedtab Chrome Web Store — local-first/no backend/export workspace, published 2026-09: https://chromewebstore.google.com/detail/speedtab-local-speed-dial/adkjbdepojalajhfkoobiedddlnoamff — `CONFIRMED_PRODUCT_SIGNAL`.
- Microsoft Learn — Windows Server 2025 Accreditation 2026: https://learn.microsoft.com/training/paths/windows-server-2025-accreditation-2026/ — retrieved 2026-09-08 — `CONFIRMED_PRODUCT_SIGNAL`.

### Research
- Curi et al., *A Human-in-the-Loop Framework for AI-Assisted Scoring in Large-Scale Writing Assessment*, 2026-09-04: https://arxiv.org/abs/2609.05143 — `CONFIRMED_RESEARCH_SIGNAL`.
- Rankins et al., *A rubric to assess generative AI-based feedback on student writing assignments*, published online 2026-08-03: https://journals.asm.org/doi/10.1128/jmbe.00350-25 — `CONFIRMED_RESEARCH_SIGNAL`.
- Zheldibayeva et al., *Generative AI Feedback, English Writing and Teacher Rubrics: A Multiple-Case Study of CyberScholar*, 2026-05: https://arxiv.org/abs/2605.17055 — `CONFIRMED_RESEARCH_SIGNAL`.

### Community / anecdotal only
- r/Professors, 2026-03-28, AI grading feedback described as generic/regrading required: https://www.reddit.com/r/Professors/comments/1s6471j/ta_used_ai_to_grade_papers/ — `COMMUNITY_SIGNAL`.
- r/artificial, 2026-04-13, student concern over opaque AI-like grading feedback: https://www.reddit.com/r/artificial/comments/1skhddq/did_my_professor_use_ai_to_grade_my_paper/ — `COMMUNITY_SIGNAL`.
- r/ChatGPTPromptGenius, 2026-05-08, anecdote that generic rubric prompts over-comment every trait: https://www.reddit.com/r/ChatGPTPromptGenius/comments/1t79not/after_watching_a_teacher_grade_30_essays_in_one/ — `COMMUNITY_SIGNAL`.

---

## What Changed Since Last Radar

Compared with `2026-09-08-external-radar-r2.md`:

1. **Focus moved from learner scheduling to feedback inspectability.** r2 established that a score is not durable learning state; r3 finds that a rubric score is also not trustworthy feedback unless the user can inspect the evidence behind it.
2. **New high-confidence Issue created:** `voice-actress #6` for criterion-linked exact answer evidence + legal-source verification state.
3. **`voice-actress` readiness improved:** the 2026-09-07 commit repaired grade-session drift/empty dashboard and enforced live/mock/fallback provenance, making a deeper grading UX improvement appropriate without masking those earlier P1 defects.
4. **Browser-market signal strengthened the prior “do not bloat MYNT” decision**, while identifying one narrow exception worth research: quick capture that removes current-page copy/paste without introducing cloud dependence.
5. **Static training content is now explicitly treated as version-bounded.** The appearance of a Windows Server 2025 Accreditation 2026 path is a reminder that a Windows Server 2022 deck should state its intended generation/scope rather than continuously absorb current-product features.
6. **No generic platform expansion was approved.** No LMS, AI detector, cloud account, generic tutor, broad web clipper or interactive lab Issue was created.
