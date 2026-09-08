# External Competitive / New Product / Workflow Inspiration Radar — 2026-09-08 r8

> Scope: Reese-max owned, unarchived, product-like repositories. Primary research source for this round is the public web outside GitHub. GitHub was used to refresh product purpose/recent change/Issue-PR duplication state and to write this central report / one validated opportunity Issue. Community posts are treated only as anecdotal signals.

## Executive Summary

This round found **one new high-value, time-sensitive portfolio opportunity** that was not present in r7: the static course product `book5-windows-server-2022` is approaching a major platform lifecycle transition. Microsoft added an explicit Windows Server 2022 end-of-mainstream-support notice on **2026-08-13**, with mainstream support ending **2026-10-13** and extended support continuing through **2031-10-14**. At the same time, Microsoft and commercial learning products are actively shipping Windows Server 2025-specific learning paths/labs, Microsoft’s 2025 OSConfig security baseline is versioned and drift-controlled, and the **2026-08-11** Windows Server 2025 update includes post-quantum certificate capability changes.

The opportunity is **not** “rename every slide to Windows Server 2025.” The stronger product move is a **version-aware curriculum layer**: retain the valuable 2022 course, explicitly expose lifecycle status, mark applicability of security claims, add a 2022→2025 delta path, and treat external platform facts as versioned claims with source/freshness/drift state. This avoids both stale teaching and premature migration advice.

A new Issue was created after open/closed Issue + PR duplicate checks:

- `Reese-max/book5-windows-server-2022#5` — `[Competitive Inspiration][P1] 建立 Windows Server 2022→2025 版本化安全課程與生命週期漂移閘門`
- Fingerprint: `book5:version-aware-curriculum:ws2022-to-ws2025:lifecycle-drift-gate:v1`
- Opportunity Score: **93/100**

No source branches, product code, deployment, secrets, permissions, or repository settings were modified.

---

## Product → Market Category Refresh

| Repository | Product / market category | r8 opportunity posture |
|---|---|---|
| gemini-deidentifier | AI RPG / interactive fiction | DIFFERENTIATOR: preserve deterministic world-state ledger; no new duplicate |
| exam-archive | exam archive / public reference | SHOULD BE BETTER: source freshness / correction provenance; no new evidence threshold |
| police-exam-practice | legacy exam practice | DO NOT COPY / consolidate toward canonical police-exam-archive |
| police-exam-archive | official exam question bank + practice | DIFFERENTIATOR: attempt ledger + deadline-aware review already covered by #60 |
| 92-duty-scheduler | constraint scheduling | DIFFERENTIATOR: minimal-impact repair plans already covered by #19 |
| openab | Discord ↔ ACP coding-agent broker | MUST MATCH: human permission broker remains high-value but repository Issues are disabled |
| UkePack | MusicXML → teacher/child practice packs | ADJACENT IDEA: integrated practice tools; teacher workflow research #3 remains gate |
| ppt-studio | AI presentation workstation | DIFFERENTIATOR: claim/slide provenance #3 before connector expansion |
| book5-windows-server-2022 | Windows Server security teaching deck | **MUST MATCH + DIFFERENTIATOR: lifecycle status + version-aware 2022→2025 curriculum layer (#5)** |
| obsidian-vault | local PKM/content vault | MUST MATCH: restore/conflict correctness #2 before expansion |
| voice-actress | legal essay grading / learning | DIFFERENTIATOR: evidence-linked grading #6 |
| taiwan-intel-dashboard | public-intelligence dashboard | SHOULD BE BETTER: delta-first evidence and source freshness; no new issue this round |
| autodev-ng | multi-agent delivery orchestrator | DIFFERENTIATOR: in-flight STEER vs next-turn QUEUE #11 |
| flux-image-gen | AI image workspace | DIFFERENTIATOR: artifact provenance / Content Credentials #18 |
| claude-mem | upstream agent-memory fork | DO NOT COPY: do not create product roadmap for upstream mirror behavior |
| lobsterpulse | agent observability / hooks | SHOULD BE BETTER: existing OTel/provider telemetry work already covers obvious market signal |
| prompt-autoresearch | prompt optimizer | MUST MATCH: stability-aware promotion #3 |
| neciken-summer-poem | AI writing + contest submission | DIFFERENTIATOR: rule-drift pre-submit verification #3 |
| note-filler | evidence-grounded notes | DIFFERENTIATOR: claim review queue #3 |
| gooaye | undefined / placeholder | DO NOT COPY: insufficient product identity; do not manufacture roadmap |
| lplrs-judicial-sync | judicial-source synchronization | MUST MATCH: tombstone / source deletion semantics already covered |
| adng-memory | operational agent memory | DIFFERENTIATOR: activation/supersession/bitemporal lifecycle #4 |
| cyber-prep-coach | iPAS exam prep | DIFFERENTIATOR: mastery profile / adaptive next-best action #4 |
| cf-ai-router | AI provider router | SHOULD BE BETTER: provider reliability + Responses API research #1/#2 |
| avatar-vfo | AI avatar / character chat | ADJACENT IDEA: user-visible scoped memory; hold until auth/regression confidence is stable |
| project-doctor-web | clinical teaching / research UI | SHOULD BE BETTER: evidence/safety first; no new external threshold reached |
| minideck | lightweight deck publishing | MUST MATCH: draft head vs published head #4; recent persona rerun does not justify feature expansion |
| chatgpt-dual-pipeline | internship-note publishing pipeline | SHOULD BE BETTER: source/version provenance; no new unique gap |
| internship-notes-sites-mirror | deployment/content mirror | DO NOT COPY: mirror identity, not independent product roadmap |
| taichung-police-intel | public-sector intelligence monitor | DIFFERENTIATOR: role intelligence / live provisional reconciliation already covered |
| soundbox-offline | local-first music library | MUST MATCH: restore correctness remains higher priority after post-fix regression notes; do not add feature load |
| skill-foundry | Skill creation / certification | DIFFERENTIATOR: target runtime compatibility + negative-transfer gate #1 |
| video-timeline-pipeline | video intelligence | DIFFERENTIATOR: bounded agentic evidence escalation #10 |
| ai-novel-workstation | long-running AI writing workstation | DIFFERENTIATOR: approved cost envelope #4 |
| clinical-scribe-worker | ambient/clinical scribe evaluation | MUST MATCH: specialty/failure-class validation pack #4 |
| MaterialYouNewTab | local-first new-tab productivity | ADJACENT IDEA: permission-minimal current-page capture; still research-only |
| cf-mcp-server | Cloudflare MCP control server | DIFFERENTIATOR: bounded gradual deployment #8 |
| tick-stock-panel | Taiwan market screen / backtest | MUST MATCH: truthful market coverage / point-in-time semantics already covered |
| herdr-skills | multi-agent workflow skills | SHOULD BE BETTER: portable role/skill packaging, but do not duplicate skill-foundry marketplace work |
| ninax-line-hermes | LINE ↔ long-running AI/video workflow | MUST MATCH: message revision/redelivery correctness #1 |

### Recent GitHub-side refresh since r7

- `minideck` received post-fix persona-rerun documentation; no new external evidence warrants bypassing #4’s publish-head correctness work.
- `soundbox-offline` / central audit history recorded post-fix restore regression findings; this reinforces **reliability before expansion**, so r8 does not add new music-library features.
- `autodev-ng` received central audit/report updates; no new duplicate of #11 was found.
- For the new `book5-windows-server-2022` fingerprint, repo search found no matching Windows Server 2025/lifecycle/OSConfig curriculum Issue or PR. Existing #3 is closed and only addressed README / learner-entry usability.

---

# External Signals

## Signal A — Direct competitor / upstream learning products are already 2025-first

### A1. Microsoft Learn — Windows Server 2025 Accreditation 2026
**Status:** CONFIRMED  
**Verified:** 2026-09-08  
**URL:** https://learn.microsoft.com/en-us/training/paths/windows-server-2025-accreditation-2026/

The current official learning path is explicitly branded **Windows Server 2025 Accreditation 2026**. It includes modernization decision-making, an introduction to Windows Server 2025, knowledge checks, and hybrid/Azure Local context.

**JTBD:** help learners decide when/how to modernize, not merely memorize product features.  
**Why fewer steps:** lifecycle / modernization framing is brought into the learning path instead of forcing learners to separately interpret product-support pages.  
**Onboarding/distribution:** short self-paced modules, beginner entry, collection/plan/challenge hooks.  
**Business-model signal:** Microsoft uses free product education to pull adoption toward the current platform generation.  
**What to absorb:** make version/lifecycle decisions visible inside the course journey.  
**Do not copy:** do not turn the deck into Microsoft product marketing or assume every learner should migrate immediately.

### A2. CBT Nuggets — Networking with Windows Server 2025
**Status:** CONFIRMED  
**Updated:** 2026-08-20  
**URL:** https://www.cbtnuggets.com/it-training/microsoft-windows-server/networking-server-2025

The course is explicitly 2025-targeted and bundles **virtual labs** with the learning product.

**JTBD:** learn current Server networking by doing it in a realistic domain environment.  
**Why fewer steps:** learners do not need to separately assemble a lab topology before practicing.  
**Distribution/business signal:** subscription learning products can justify higher prices by packaging current-version content + labs + practice exams.  
**What to absorb:** version-specific applicability and an explicit lab/delta path.  
**Do not copy:** do not add cloud accounts or a paid lab platform merely to imitate a competitor.

---

## Signal B — Adjacent workflow: OSConfig treats security knowledge as a versioned baseline with drift

### B1. Windows Server 2025 OSConfig Security Baselines
**Status:** CONFIRMED  
**Official page updated:** 2026-07-02  
**URL:** https://learn.microsoft.com/en-us/windows-server/security/osconfig/osconfig-how-to-configure-security-baselines

Microsoft’s Windows Server 2025 baseline is role-aware and explicitly **2025-only**. The baseline ships in a versioned OSConfig module; newer versions supersede prior baselines, can be reapplied, verified, customized, and protected against configuration drift.

**Transferable product principle:** a security curriculum can use the same conceptual structure without copying the configuration product:

`Claim → AppliesTo(version/edition/role) → Source → Baseline/Doc Version → Last Verified → Drift Status → Review`

**Why this is better than “just update slides”:** the product gains an explicit reason why a fact is considered current and a deterministic way to mark a claim stale when upstream support/version facts change.

**What to absorb:** versioned applicability + verification + drift state.  
**Do not copy:** do not let a content checker silently change security instructions or run privileged OSConfig commands.

---

## Signal C — Emerging technical change makes version ambiguity materially risky

### C1. Windows Server 2025 August 2026 update: PQC certificate capability
**Status:** CONFIRMED  
**Release:** 2026-08-11  
**URL:** https://support.microsoft.com/en-us/servicing/os/windows-server/2026/08/kb5120233-windows-server-2025-security-update

The update includes changes around **post-quantum cryptography (PQC) certificates**, including CA configuration options / enrollment behavior. This is a concrete example of security-management content that can differ by platform generation and patch state.

**JTBD:** teach security operations that match the learner’s actual server generation.  
**New product possibility:** instead of one static “current truth,” expose a small delta layer tagged by platform/version and official source date.  
**Do not copy:** do not turn every monthly KB into a slide; only promote durable curriculum deltas or lifecycle-critical changes.

---

# New Releases / Time-sensitive Platform Changes

1. **2026-08-13 — Windows Server 2022 end-of-mainstream announcement added.** Microsoft states mainstream support ends 2026-10-13; extended support continues through 2031-10-14.  
   https://support.microsoft.com/en-us/servicing/os/windows-server/2026/08/kb5120242-windows-server-2022-security-update
2. **2026-08-20 — CBT Nuggets updated “Networking with Windows Server 2025.”** Current-version training + virtual-lab packaging is now an explicit competitive education workflow.  
   https://www.cbtnuggets.com/it-training/microsoft-windows-server/networking-server-2025
3. **2026-08-11 — Windows Server 2025 security update includes PQC certificate changes.**  
   https://support.microsoft.com/en-us/servicing/os/windows-server/2026/08/kb5120233-windows-server-2025-security-update
4. **Current 2026 official learning path — Windows Server 2025 Accreditation 2026.**  
   https://learn.microsoft.com/en-us/training/paths/windows-server-2025-accreditation-2026/

---

# Community Pain Points

## Windows Server 2025 adoption is not uniformly “latest = best”

**Status:** COMMUNITY_SIGNAL only  
**Date:** 2026-05-28  
**URL:** https://www.reddit.com/r/sysadmin/comments/1tq5zma/after_a_year_of_using_windows_server_2025_im/

A highly discussed r/sysadmin post describes severe reliability problems in one production environment and a decision to move workloads back from Server 2025. This is **not statistical evidence** and cannot establish general 2025 reliability. It is useful only as a product-design warning: a 2022 course should not be deleted or relabeled as obsolete merely because 2025 is the latest LTSC generation.

**Design implication:** teach lifecycle + applicability + migration decision signals, while retaining a credible 2022 track for installed-base and extended-support environments.

---

# Adjacent Ideas

1. **Curriculum Baseline Manifest** — JSON/YAML inventory for high-risk claims with `claim_id`, `applies_to`, `source_url`, `source_updated_at`, `last_verified_at`, `status`.
2. **Version & Lifecycle Card** — show product generation, support phase, next transition date, last source verification, and a direct official link at entry.
3. **Security Delta View** — “same principle / changed implementation / new in 2025 / 2022-only / verify before production.”
4. **Drift Review Queue** — external change detection creates a review item, never silently edits the published teaching claim.
5. **Lab Applicability Tag** — labs explicitly state tested server version/edition/role and expected deviations.
6. **Source Age Budget** — lifecycle-critical facts fail closed / REVIEW_REQUIRED beyond a freshness window; evergreen conceptual slides can use a longer window.

---

# Opportunity Map

## `book5-windows-server-2022`

### MUST MATCH
- Show that the artifact is intentionally a Windows Server 2022 course and expose current lifecycle status.
- State **mainstream end 2026-10-13** and **extended end 2031-10-14** with official source + last verification.
- Mark high-risk security claims with version applicability rather than implying platform-independence.

### SHOULD BE BETTER
- Make it faster than Microsoft-doc hopping to answer “does this 2022 security instruction still apply on 2025?”
- Separate stable security principles from version-specific commands/defaults/features.
- Preserve a learner-friendly static-deck path; do not require account signup or a heavyweight LMS.

### DIFFERENTIATOR
- A compact **2022→2025 Security Delta** layer with source-backed applicability and freshness.
- A machine-verifiable curriculum manifest that can flag stale lifecycle/security claims before publishing.

### ADJACENT IDEA
- Reuse the same `source + version + last_verified + drift state` contract in other fast-changing technical learning repos.

### DO NOT COPY
- Do not rename all content to 2025.
- Do not delete 2022 labs while the platform remains in extended support.
- Do not auto-apply Microsoft OSConfig baselines from a documentation checker.
- Do not convert anecdotal Reddit complaints into a recommendation against Windows Server 2025.
- Do not add a cloud LMS / paid-lab dependency unless learner evidence later justifies it.

---

# Opportunity Score

Candidate: **Version-aware Windows Server 2022→2025 curriculum + lifecycle drift gate**

| Dimension | Score | Rationale |
|---|---:|---|
| User Pain | 9.5/10 | learners currently must manually reconcile course version, lifecycle, current docs and 2025 deltas |
| Strategic Fit | 10/10 | directly improves the repository’s educational purpose without changing its product identity |
| Novelty | 8.5/10 | version-delta content exists elsewhere, but a source-backed drift-aware static deck is differentiated |
| Evidence Strength | 10/10 | Microsoft lifecycle/support/training/baseline sources plus current competitor training |
| Reuse Potential | 9/10 | applicable to future technical curricula and other external-rule-dependent repos |
| Implementation Effort | 8.5/10 favorable | initial lifecycle card + manifest + delta doc can ship without platform rewrite |
| Security / Privacy / Cost Risk | 9.5/10 favorable | primarily read-only metadata/content work; risk is factual drift, not privileged execution |

**Opportunity Score: 93/100.**

---

# Minimum Viable Product Shape

1. Entry-level **Version & Lifecycle Card** in README + deck.
2. `docs/windows-server-version-delta.md` covering at least lifecycle, OSConfig/baseline, Hotpatch applicability, credential/SMB/TLS/secured-core deltas, and a representative PQC signal.
3. Machine-readable claim/applicability manifest.
4. Read-only verifier that reports `CURRENT / STALE / UNKNOWN / REVIEW_REQUIRED`.
5. Human review/publish boundary; external drift never silently rewrites the deck.

---

# Top 10 Cross-Portfolio Ideas

1. **Version-Aware Knowledge Contract** — every volatile technical claim gets applicability + source + last-verified + drift state.
2. **Authoritative Head vs Working Head** — draft/current state does not automatically become published truth (`minideck`, content curricula, memory, prompt champions).
3. **Staged Evidence Escalation** — start cheap/replayable, escalate only when evidence gaps justify it (`video-timeline-pipeline`, research products).
4. **Evidence-Linked Feedback** — recommendation/grade/claim points back to exact source span and source revision (`voice-actress`, notes, clinical).
5. **Stale Invalidation** — edits, source changes, model/runtime changes invalidate old approvals or receipts rather than silently reusing them.
6. **Human Approval as Separate Authority** — agent proposal is not execution authority (`openab`, autodev, deployments).
7. **Versioned Capability / Runtime Contract** — provider/tool/skill behavior must be reverified against the target runtime (`skill-foundry`, cf-ai-router).
8. **Bounded Cost / Resource Envelope** — long-running automation should know approved budget/limits before execution (`ai-novel-workstation`).
9. **Attempt / Event Ledger before Derived Recommendations** — preserve raw state transitions so rankings/review queues can be regenerated (`police-exam-archive`, RPG state).
10. **Rule / Policy Drift Receipt** — external policy/lifecycle/pricing/contest/API facts need `last_verified + source_hash + normalized fields + review state` (`neciken-summer-poem`, book5, legal/intel products).

---

# Ideas Rejected / Deferred

1. **“Upgrade the whole book to Windows Server 2025 immediately.”** Rejected: 2022 still receives extended security support through 2031 and remains a legitimate installed-base learning target.
2. **“Delete all 2022 labs/screenshots.”** Rejected: destroys product identity and installed-base utility.
3. **“Auto-scrape Microsoft docs and directly rewrite production slides.”** Rejected: source parsing failure or semantic changes could silently corrupt course claims; drift must produce review items.
4. **“Add an AI tutor before content versioning.”** Rejected: a tutor amplifies stale source ambiguity if the canonical curriculum is not version-aware.
5. **“Build a paid virtual-lab SaaS because CBT Nuggets has labs.”** Rejected: large cost/ops jump without evidence that local/simple labs are the current bottleneck.
6. **“Treat Windows Server 2025 community complaints as proof the release is unsafe.”** Rejected: anecdotal, not statistical.
7. **`soundbox-offline` feature expansion this round.** Deferred: recent restore regression evidence means reliability remains the gating concern.
8. **`MaterialYouNewTab` broad browsing permissions for capture.** Deferred: preserve permission-minimal/local-first advantage.
9. **Duplicate OTel work in `lobsterpulse`.** Rejected: existing telemetry contracts already cover the obvious gap.
10. **New marketplace work for `herdr-skills` / `skill-foundry`.** Deferred: compatibility/negative-transfer certification remains higher-value than distribution surface.

---

# Issue Mapping

| Opportunity | Repo / Issue | Mapping | Action |
|---|---|---|---|
| Windows Server lifecycle + 2022→2025 version-aware curriculum | `book5-windows-server-2022#5` | NEW / Competitive Inspiration / P1 | **CREATED** |
| README / learner entry | `book5-windows-server-2022#3` | closed; different fingerprint | no update |
| Draft vs published deck head | `minideck#4` | existing | no duplicate |
| Cost envelope | `ai-novel-workstation#4` | existing | no duplicate |
| Agentic video evidence escalation | `video-timeline-pipeline#10` | existing | no duplicate |
| Steer vs queue control plane | `autodev-ng#11` | existing | no duplicate |
| Gradual Worker deployment | `cf-mcp-server#8` | existing | no duplicate |

### LOCK / COORDINATION

Repository search for `github-issue-lock:v1` showed only central radar coordination records; no competing implementation lock was found for the new book5 fingerprint. Open/closed Issue search and all-state PR search found no matching Windows Server 2025/lifecycle/OSConfig curriculum work. This radar created the research/product Issue only and did **not** create an implementation branch, merge, deploy, modify secrets/permissions/settings, or claim the implementation lock.

---

# Sources

## CONFIRMED

1. Microsoft Support — Windows Server 2022 August 2026 update; end-of-mainstream announcement added **2026-08-13**.  
   https://support.microsoft.com/en-us/servicing/os/windows-server/2026/08/kb5120242-windows-server-2022-security-update
2. Microsoft Lifecycle — Windows Server 2022 lifecycle (mainstream end 2026-10-13; extended end 2031-10-14/15 depending displayed timezone). Verified **2026-09-08**.  
   https://learn.microsoft.com/en-us/lifecycle/products/windows-server-2022
3. Microsoft Learn — Windows Server 2025 Accreditation 2026. Verified **2026-09-08**.  
   https://learn.microsoft.com/en-us/training/paths/windows-server-2025-accreditation-2026/
4. Microsoft Learn — Windows Server 2025 OSConfig Security Baseline; page updated **2026-07-02**.  
   https://learn.microsoft.com/en-us/windows-server/security/osconfig/osconfig-how-to-configure-security-baselines
5. Microsoft Learn — What’s new in Windows Server 2025; page date **2026-01-15**, verified **2026-09-08**.  
   https://learn.microsoft.com/en-us/windows-server/get-started/whats-new-windows-server-2025
6. Microsoft Support — Windows Server 2025 August security update, release **2026-08-11**, including PQC certificate-related changes.  
   https://support.microsoft.com/en-us/servicing/os/windows-server/2026/08/kb5120233-windows-server-2025-security-update
7. CBT Nuggets — Networking with Windows Server 2025, updated **2026-08-20**.  
   https://www.cbtnuggets.com/it-training/microsoft-windows-server/networking-server-2025
8. CBT Nuggets — Active Directory Administration for Windows Server 2025, updated **2026-07-16**.  
   https://www.cbtnuggets.com/it-training/microsoft-windows-server/active-directory-administration

## COMMUNITY_SIGNAL

9. Reddit / r/sysadmin — “After a year of using Windows Server 2025, I’m finally throwing in the towel”, **2026-05-28**. Anecdotal environment-specific reliability report only.  
   https://www.reddit.com/r/sysadmin/comments/1tq5zma/after_a_year_of_using_windows_server_2025_im/

## Repository evidence used only for product-state / duplication checks

- `Reese-max/book5-windows-server-2022/README.md`: product is a 46-section static Windows Server 2022 security deck; `index.html` is hand-maintained source of truth; existing checker is offline/read-only.
- Default-branch code search found no `Windows Server 2025` content and no lifecycle / `last_verified` contract.
- `book5-windows-server-2022#3` is closed/completed and has a different learner-entry fingerprint.
- All-state PR search returned no matching curriculum-version/lifecycle work before #5 creation.

---

# What Changed Since Last Radar (r7)

1. **New portfolio area reached alert threshold:** technical curriculum freshness / platform lifecycle, not agent orchestration or deployment control.
2. **New time-critical external fact:** Microsoft’s August notice puts Windows Server 2022 mainstream support transition roughly one month away, turning version ambiguity into an immediate teaching-product risk.
3. **New high-value Issue:** `book5-windows-server-2022#5` created after duplicate checks.
4. **New cross-portfolio principle:** `Claim → AppliesTo → Source → LastVerified → Lifecycle/Version State → Drift → Human Review → Published Claim`.
5. **No new feature tickets for recently touched `minideck` or `soundbox-offline`:** post-fix/reliability evidence means existing correctness work remains the gate.
6. **No portfolio direction was overturned:** the r7 “authoritative head / exact target / bounded stage / receipt” principle remains valid; r8 extends it from execution state to **technical knowledge state**.
