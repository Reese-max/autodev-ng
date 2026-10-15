# Portfolio 50-Persona Audit — project-doctor-web Round 4

Run ID: `2026-09-16T11:52:06Z-persona-audit-11-project-doctor-web`

Status: **NOT CLEAN — clean streak 0/2**

## Governing rules

- Fixed-50 protocol: `docs/portfolio-audit/2026-09-06-50-persona-audit.md`
  - blob SHA: `6e3499d6ef5be7e123050e1526946f6a40f99263`
- Issue-quality v2: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
  - blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- A01–J05 remain fixed synthetic personas, not real users or 50 independent votes.

## Inventory and fair continuation

Current owner inventory was fully re-enumerated: **42 accessible Reese-max-owned repositories** on page 1, page 2 empty. The prior fair cursor was `project-doctor-web`; this run audited it against current default-branch evidence.

Next fair cursor: **`prompt-autoresearch`**, unless a landed P0/P1 fix or confirmed regression takes precedence.

## Inspected repository

Repository: `Reese-max/project-doctor-web`

- Default branch: `main`
- Inspected HEAD before repo-report write: `bb2cc69dc202af5575d11eb958bda56a01f7de11`
- Candidate-facing product baseline remains `3a7e83ed012722f5d28b4bc7fb4bddbf98d07579`; later default commits before this run were audit-only.
- Repo Round-4 report commit: `33bfdcf6a70d7a142369ca060faf9af27334d6e0`
- Repo report: https://github.com/Reese-max/project-doctor-web/blob/33bfdcf6a70d7a142369ca060faf9af27334d6e0/docs/audits/50-persona-round-4-2026-09-16.md

## New actionable finding

### P1 #16 — multi-turn emergency facts are not correlated by the deterministic pre-LLM gate

Issue: https://github.com/Reese-max/project-doctor-web/issues/16

Classification:

- kind: `BUG`
- severity: `P1`
- evidence: `SOURCE_CONFIRMED`
- triage: `NEEDS_REVIEW`
- auto_implementation: `false`
- confidence: `CONFIRMED`
- runtime: `NEEDS_RUNTIME_VERIFICATION`

Fingerprint:

`project-doctor-web + /api/minimax deterministic emergency gate + combination red flag split across successive patient/objective turns + current gate ignores messages and scans source fragments independently + normal provider path remains reachable`

Current source sends the complete `messages` transcript to the API and uses it in the LLM prompt, but the deterministic pre-provider emergency check only evaluates the current user input, `patient.medicalHistory`, and current objective text. `checkClinicalEmergency()` evaluates each source independently. Combination rules such as chest-pain + dyspnea/cold-sweat therefore require those facts in the same checked fragment.

A supported sequence such as `我有胸痛` followed on the next patient turn by `現在喘不過氣又一直冒冷汗` can reach the ordinary model path even though the same combined facts in one string are covered by the emergency detector. Existing tests exercise complete warning-sign combinations in a single string, not split-turn history.

This is P1 because a reachable supported path can delay the system's deterministic urgent-action boundary in a high-risk medical teaching flow. No production incident, live provider execution, or real-patient test is claimed.

Minimum repair is local: reuse the already-sent bounded recent patient/operator evidence with the existing detector before provider fetch. No new database, ledger, state machine, generic clinical framework, deployment, paid service or external write is required.

Open historical PR #7 contains an old transcript-aggregation candidate but is unmerged and based on an older branch; it was inspected for dedupe/minimal-repair context and was not modified or treated as current product evidence.

## Existing blockers / evidence boundary

- #2 P1 durable/shared abuse and cost protection remains open.
- #9 P1 Objective provenance remains open; PR #12 is unmerged.
- #14 P2 affected RSC dependency range remains open; PR #15 is unmerged.
- Closed #1 was not reopened: its root cause was the total absence of a deterministic emergency gate. #16 is a distinct context-loss root cause in the current gate.
- Exact inspected HEAD `bb2cc69d...` has **0 GitHub Actions workflow runs**. No current-SHA CI, Cloudflare deployment, MiniMax provider, browser, mobile, keyboard/AT, or cross-isolate runtime result is claimed.

## Round qualification

The repo received a complete A01–J05 source/static matrix in the linked Round-4 report. It is **not** a CLEAN-qualifying round because a new P1 was found, other P1/P2 blockers remain open, and required runtime paths are still missing. Clean streak remains **0/2**.

## Write / coordination status

- New Issue #16 was created and read back successfully.
- `github-issue-lock:v1` was acquired and read back on #16 for audit evidence linking; release is appended after persistence.
- Umbrella #3 is a standing audit tracker; any summary write is performed only under a verified persona-audit lease and then released.
- No product source, CI/config, secrets, permissions/settings, implementation branch, merge/deploy, worker/GOAL or paid external action was performed.
