# Portfolio audit continuation — claude-mem fixed 50 Round 2

- UTC checkpoint: 2026-09-18T20:32Z
- Target repo: `Reese-max/claude-mem`
- Fixed-50 standard blob: `6e3499d6ef5be7e123050e1526946f6a40f99263`
- Issue-quality v2 blob: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Target default HEAD before repo audit write: `ce2efab48096eaaba36b44946ac92ffd9b281151`
- Inspected product baseline: `f5633c1f84181673896c038cbe285131c6d669a3`
- Repo audit commit: `3ed5439ff683ac300a742f2a16db02aef183d8e8`
- Repo audit report: `docs/audits/50-persona-round-2-full-2026-09-18-2020Z.md`
- Current owner inventory pagination: 41 visible Reese-max-owned repos; page 2 empty. Historical checkpoint was 42, so visibility gap remains unresolved and no deletion is inferred.

## Delta

A fresh full A01–J05 50-persona recheck found one independent actionable P2 bug not present in the prior Reese-max claude-mem audit findings.

### CM-R2-01 — stale first prompt after worker/session rehydration

- kind: `BUG`
- severity: `P2`
- confidence: `CONFIRMED`
- evidence: `SOURCE_CONFIRMED`
- triage: `NEEDS_REVIEW`
- auto_implementation: `false`
- runtime: `NEEDS_RUNTIME_VERIFICATION`
- target Issue write: `ISSUE_WRITE_BLOCKED`

Fingerprint:

`Reese-max/claude-mem|SessionManager.initializeSession/worker rehydration|worker restarts after prompt N>1 and currentUserPrompt is unavailable|later tool activity is attributed to stale first-prompt text while prompt number is latest|rehydration loads sdk_sessions.user_prompt but derives lastPromptNumber from user_prompts`

At product SHA `f5633c1f84181673896c038cbe285131c6d669a3`, `SessionManager.initializeSession()` uses `dbSession.user_prompt` when no fresh `currentUserPrompt` is available, while the same active session derives `lastPromptNumber` from per-prompt `user_prompts`. A multi-prompt session rehydrated after worker restart can therefore carry prompt number N with prompt text from prompt 1, allowing later tool observations/summaries to be framed against a stale request.

The minimum fix is narrow: read latest prompt text and number from the existing `user_prompts` storage during rehydration, with first-prompt fallback only when no per-prompt record exists, plus one local/in-memory restart regression. No new database, service, queue, generalized state machine, worker framework, deployment, or paid provider is required.

This is P2 rather than P1 because no data loss, privilege bypass, privacy breach, or universal core-task failure was established and no occurrence rate is inferred.

## Dedupe / write status

Reese-max repo audit/history and available tracker surfaces were checked. No prior Reese-max finding for this root cause was found. The target repository has GitHub Issues disabled (`has_issues=false`), so no normal target Issue can be created or audit-locked. Per policy, this remains `ISSUE_WRITE_BLOCKED`; upstream/the-dotmack trackers were not modified and repository settings were not changed.

The existing mutable remote installer/supply-chain P2 remains separate and was not re-notified as new.

## Evidence boundary

- New finding is source-confirmed only; no executed worker-restart reproduction is claimed.
- Exact inspected product SHA lacks qualifying current GitHub Actions evidence for this scenario.
- Safe next verification: prompt 1 → persist prompt 2 → recreate worker/session-manager → tool use → assert prompt text and prompt number both resolve to prompt 2.
- No product source, CI/config, secret, permission, repository setting, implementation branch, merge, deploy, worker/GOAL, or paid provider call was changed or invoked by this audit.

## CLEAN / continuation

- `claude-mem`: **NOT CLEAN**.
- Qualified consecutive CLEAN rounds: **0/2**.
- Reasons: new actionable P2; target Issue write blocked; restart regression lacks executed runtime evidence; prior existing P2 remains relevant.
- Audit-only commits are not product fixes and do not invalidate the inspected product baseline by themselves.
- Next fair fixed-50 cursor: **`clinical-scribe-worker`**.
