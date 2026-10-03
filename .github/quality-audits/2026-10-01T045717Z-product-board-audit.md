# Product Board Audit — 2026-10-01T04:57:17Z

## Status

**PARTIAL / NOT CLEAN.** This round found one new actionable P2 bug in an active implementation PR. The finding is recorded here only; no product code, implementation branch, Issue scope, deployment, or worker run was changed.

- Rules blob: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Inventory: 45 owned repositories; 44 unarchived; `Reese-max/obsidian-vault` archived and excluded from product action.
- Comparison cursor: `2026-10-01T02:00:08Z`
- Default-branch changes since cursor: none across the 44 unarchived repositories.
- Exact inspected product PR head: `Reese-max/ai-novel-workstation@412d0457a18712484bbd7b7f246e64162c84725c`
- Exact CI receipt: [run 36809590536](https://github.com/Reese-max/ai-novel-workstation/actions/runs/36809590536), completed **failure**; job `test`, step `Run project verification` failed. The connector exposed no step log, so the failure cause is UNKNOWN and is not inferred here.
- Existing high-priority regression: `autodev-ng` PR [#118](https://github.com/Reese-max/autodev-ng/pull/118) is still open/draft. At head `31ede895694617ef92be748e5f5ac79728d473ec`, exact-head CI [run 36806823952](https://github.com/Reese-max/autodev-ng/actions/runs/36806823952) is green and static/test evidence addresses the command-injection path, but default-branch/runtime verification is still absent. Status remains **PARTIALLY_FIXED / PRE-MERGE**, already recorded on central PR #119; no duplicate comment was added.

## Discovery and lock/duplication check

New and materially updated pull requests were screened first; no default-branch product merge invalidated the prior evidence. For the new finding, all-state Issue/PR search located the umbrella [ai-novel-workstation issue #1](https://github.com/Reese-max/ai-novel-workstation/issues/1) and the active implementation [PR #21](https://github.com/Reese-max/ai-novel-workstation/pull/21), branch `devin/issue-1-round6`; no separate issue with the same root-cause fingerprint was found.

Because PR #21 actively owns the affected code and scope, disposition is **SKIPPED_LOCKED_ACTIVE_PR**. No issue lock was claimed, no Issue/PR comment was written, and no scope was changed. This independent report is the tracking evidence.

## New actionable finding

### PB-20261001-01 — malformed image state can trigger unforced paid regeneration and overwrite

- **kind:** BUG
- **severity:** P2
- **decision_priority:** NOW (pre-merge)
- **triage:** NEEDS_REVIEW
- **auto_implementation:** false
- **confidence:** HIGH for the static causal chain; runtime reproduction still required
- **evidence:** SOURCE_CONFIRMED + static code-path inference; **NEEDS_RUNTIME_VERIFICATION**
- **fingerprint:** `ai-novel-workstation+image-state+malformed-nondict-json+fallback-empty-state+unforced-provider-regeneration-overwrite`

#### Who and what fails

An author with previously generated images and a damaged or manually edited `books/<id>/images/image_state.json` can enter the newly supported recovery path in PR #21. The loader now accepts a valid JSON scalar/list by warning and replacing it with an empty state. That sounds recoverable, but the reachable `image-loop` path then replans assets as fresh records.

At the inspected head:

1. `lib/image_state.py::ImageState.load` turns non-object JSON into `{}`.
2. `lib/image_loop.py::_load_state` accepts that empty state and proceeds.
3. `_register_asset` has no prior `done` record, so the planned asset remains effectively new.
4. `_generate_one` skips generation only when state says `status == "done"` **and** the output file exists.
5. If a generated image already exists on disk but the state was discarded, the loop copies it to `.bak`, calls the image provider, and may replace it even though the operator did not pass `--force`.

This is a concrete recovery-path violation: corrupted metadata can turn a non-force retry into a paid external call and content rewrite. The `.bak` lowers irreversibility but does not prevent spend, nondeterministic asset drift, or an unexpected rewrite. The new tests exercise loader tolerance and author-state fail-closed behavior, but do not pin the corresponding image-loop no-regeneration invariant.

#### Expected / actual

- **Expected:** malformed image state plus existing managed image files must fail closed or require explicit recovery/force confirmation; provider call count stays zero and existing bytes remain unchanged.
- **Actual (static path):** malformed state becomes empty; replanning registers assets; existing files with no `done` record are backed up and sent through provider generation.
- **Current workaround:** restore `image_state.json` from a trusted backup before invoking image generation, or avoid running image-loop until state is reconciled. This is not a safe default.

#### Minimum effective scope

Prefer a local guard, not a new service/registry/framework:

1. Preserve a loader signal that the state was malformed (or raise a typed recovery error).
2. Before planning/generation, if that signal is present and managed outputs already exist, stop with recovery guidance and make zero provider calls.
3. Permit regeneration only through an explicit, already supported operator action such as a scoped `--force`, or a reviewed state-rebuild path.
4. Add a regression: pre-existing image bytes + non-object `image_state.json` + ordinary run ⇒ stopped/recovery result, provider spy count 0, bytes unchanged.
5. Keep the author-state fail-closed behavior and unrelated loader hardening intact.

**Non-goals:** broad schema migration, cross-repository recovery platform, database, registry, or automatic reconstruction of uncertain ownership.

## Red Team

| Challenge | Result |
|---|---|
| Existing `.bak` makes the path safe | Rejected. It aids recovery but does not stop an external paid call or an unrequested output change. |
| File existence alone could make generation skip | Rejected by inspected code: skip requires both `status == "done"` and an existing file. Empty fallback state loses that status. |
| This is only a malformed-file edge case | Narrowed, not dismissed. PR #21 explicitly promotes malformed state to a supported self-healing path, so the downstream behavior is part of that proposal's contract. |
| Fail-fast everywhere is necessary | Rejected. A local malformed-state sentinel plus existing-output guard is sufficient. |
| Open CI failure proves this bug | Rejected. CI only proves the PR is not green; no logs connect that failure to this finding. |
| P1 is warranted | Rejected. No demonstrated unrecoverable data loss or portfolio-wide core outage; P2 fits unwanted paid work/content rewrite on a supported recovery path. |

## External alternatives and competitor check

Checked 2026-10-01. Product claims are treated as SOURCE_CONFIRMED descriptions, not independent outcome evidence.

| Product / alternative | Confirmed recovery model | Product-board implication |
|---|---|---|
| [Scrivener](https://www.literatureandlatte.com/scrivener/overview) | Explicit Snapshots with compare/restore, autosave, and project backups | **MUST MATCH:** recovery operations are explicit and reversible; state damage should not silently authorize regeneration. |
| [Novelcrafter Revision History](https://docs.novelcrafter.com/en/articles/8677729-revision-history/) | Revision History can restore a selected version | **SHOULD BE BETTER:** local-first workflows can expose a deterministic recovery checkpoint before provider spend. |
| [Microsoft 365 version history](https://support.microsoft.com/en-us/office/collab-files/view-previous-versions-of-office-files) | Users inspect and explicitly restore prior file versions | **DIFFERENTIATOR:** preserve generated artifacts and make state reconciliation auditable, rather than hiding recovery behind automation. |
| [Dropbox version history](https://help.dropbox.com/delete-restore/version-history-overview) | View/compare/restore previous file or folder versions within plan-specific windows | **DO NOT COPY:** plan-dependent retention does not justify an internal automatic overwrite; avoid turning backup availability into permission to regenerate. |

Sudowrite's public pages confirm broad AI editing/generation capabilities but did not yield an authoritative recovery/version-history contract in this search; it is **UNKNOWN** for this decision and is not used as evidence.

## Product board simulation

This is a model-based multi-perspective exercise, not independent expert consensus.

| View | Position |
|---|---|
| CEO | If only three actions: block silent regeneration, make PR CI green, then obtain a small isolated runtime receipt. Do not fund a recovery platform. |
| CPO | The promise of “self-healing” is misleading if recovery causes surprise spend or creative drift; narrow the promise to safe recovery. |
| CTO | Carry malformed-state provenance to the orchestration boundary; do not infer authority from file presence or backup creation. |
| Staff/Principal Engineer | Add one sentinel/typed error and one provider-spy regression; avoid general schema machinery. |
| UX Lead/Researcher | Explain what was found, what will not be touched, and the exact confirmation needed to regenerate. |
| Growth | Reliability in preserving authors' work is a stronger trust lever than adding another generation control. |
| CFO | Default-zero external calls on uncertain state is the correct cost guard. |
| Security/Privacy | Malformed local metadata must not expand external side effects. |
| QA | The missing test is an end-to-end invariant: existing bytes survive and provider calls remain zero. |
| SRE | CI failure is independently blocking but cannot be attributed without logs; retain UNKNOWN. |
| Accessibility | Recovery guidance must be available as text/status output, not only color or visual UI. |
| Support | A deterministic stop plus a named backup/recovery path is easier to troubleshoot than “self-healed but regenerated.” |

Material disagreement: Product/UX may prefer automatic recovery to reduce friction; Engineering/Security/CFO reject automation when ownership and spend authorization are uncertain. Decision: preserve automatic tolerance only where it cannot cause external calls or overwrites.

## 50 synthetic personas

Synthetic only; not user research, incidence, revenue, or priority evidence. Baseline B01–B30 preserves regression coverage; exploratory E01–E20 broadens constraints.

| ID | Background / constraint | Goal and journey | Observed friction / outcome | Grade / recommendation / evidence |
|---|---|---|---|---|
| B01 | Solo novelist, existing covers | Resume image loop after editor crash | Malformed state can regenerate cover | P2; fail closed; static |
| B02 | Budget-limited author | Avoid surprise model spend | Empty fallback loses completed status | P2; zero-call guard; static |
| B03 | Serial-fiction writer | Continue chapter illustrations | Existing bytes are not sufficient to skip | P2; reconcile first; static |
| B04 | Author on slow link | Resume without network work | Recovery may call provider | P2; offline-safe stop; static |
| B05 | Privacy-sensitive writer | Keep draft local unless requested | Damaged metadata expands outbound effect | P2; explicit confirmation; static |
| B06 | Nontechnical author | Understand recovery warning | Warning says fallback but not rewrite risk | P2; actionable message; static |
| B07 | CLI expert | Use ordinary run idempotently | No-force run is not idempotent after state loss | P2; regression; static |
| B08 | Windows user | Recover after sync conflict | JSON list is accepted then replanned | P2; typed recovery; static |
| B09 | macOS user | Restore prior creative asset | `.bak` exists only after path begins | P2; stop before mutation; static |
| B10 | Linux self-hoster | Run locally with paid API | Provider may be invoked unexpectedly | P2; spy test; static |
| B11 | Long-form author | Preserve character consistency | Regenerated art may visually drift | P2; keep bytes; static |
| B12 | Editor collaborator | Review without changing images | State repair can change outputs | P2; read-only recovery; static |
| B13 | Author with git | Use version control as backup | Git may recover, but does not authorize call | P2; no silent side effect; static |
| B14 | Author without git | Trust app recovery | Only `.bak` mitigates after mutation | P2; fail closed; static |
| B15 | High-volume publisher | Batch many books | One corrupt state can multiply spend | P2; stop per book; static |
| B16 | Cover-only workflow | Preserve final approved cover | Replan can target `images/cover.png` | P2; explicit force; static |
| B17 | Chapter-art workflow | Skip completed scenes | Lost `done` markers defeat skip | P2; disk/state reconcile; static |
| B18 | Resume-after-power-loss user | Restart safely | Loader tolerance is not orchestration safety | P2; sentinel; static |
| B19 | Support engineer | Diagnose damaged state | Warning lacks downstream stop contract | P2; reason code; static |
| B20 | QA maintainer | Prevent recurrence | Loader unit test misses provider boundary | P2; integration regression; static |
| B21 | Metered Codex image user | Control charge timing | Ordinary run may spend | P2; zero-call default; static |
| B22 | Metered MiniMax user | Control charge timing | Same orchestration contract | P2; zero-call default; static |
| B23 | Grok checkpoint user | Resume later | Uncertain state should remain checkpointed | P2; preserve checkpoint; static |
| B24 | Multi-provider operator | Switch providers deliberately | Fallback can hide previous provider/model | P2; require review; static |
| B25 | Offline archive maintainer | Inspect old project | Inspection should not regenerate | P2; status-only recovery; static |
| B26 | Localization user | Read Chinese CLI warnings | Warning omits external-call risk | P2; clarify; static |
| B27 | Screen-reader user | Hear precise next action | Needs textual recovery command/reason | P2; accessible status; inferred |
| B28 | Automation runner | Expect repeat-safe commands | Corruption breaks idempotency invariant | P2; machine-readable stop; static |
| B29 | Release reviewer | Decide merge readiness | CI red and safety gap remain | P2; block merge; source |
| B30 | Maintainer | Minimize patch size | Local guard and test are enough | P2; narrow patch; static |
| E01 | Cloud-sync conflict victim | Recover concurrent edits | Non-object JSON is plausible conflict residue | P2; preserve file; likely |
| E02 | Interrupted write victim | Recover partial control file | Parser fallback may also empty state | P2; same stop contract; static/likely |
| E03 | Manual JSON editor | Fix one field | Accidental list triggers broad reset | P2; validate before effects; static |
| E04 | Storage corruption case | Salvage existing images | Existing artifacts are strongest evidence | P2; prefer preservation; static |
| E05 | CI maintainer | Reproduce exact failure | Logs unavailable | UNKNOWN; obtain logs; source |
| E06 | PR author | Keep broad hardening | Finding need not revert loader guards | P2; add orchestration guard; static |
| E07 | Cost-center owner | Attribute API usage | Silent recovery obscures intent | P2; explicit action/audit; inferred |
| E08 | Team lead | Approve asset changes | Recovery bypasses review moment | P2; confirmation; static |
| E09 | Artist | Preserve hand-edited image | Provider rewrite can replace edits | P2; bytes invariant; likely |
| E10 | Designer | Compare alternatives | `.bak` is not a version UX | P2; surface recovery path; static |
| E11 | New user | First image generation | No existing output, fallback may be acceptable | P3/no block if empty; Red Team |
| E12 | Empty test project | Exercise malformed loader | No asset at risk | P3; keep tolerance; Red Team |
| E13 | Read-only filesystem | Attempt recovery | Backup/generation may fail noisily | P3; fail earlier; inferred |
| E14 | Provider outage user | Resume after failure | Retries plus lost attempts can amplify calls | P2; preserve attempt state; static |
| E15 | Retry-limit operator | Enforce cap | Empty fallback resets attempts | P2; no calls under uncertainty; static |
| E16 | Compliance reviewer | Trace external processing | Corrupt state destroys prior audit context | P2; stop and retain evidence; static |
| E17 | Backup-restored user | Restore only image bytes | Missing state still looks fresh | P2; reconciliation workflow; static |
| E18 | Large asset library owner | Avoid scanning platform build | Local existence check is enough for guard | P2; small solution; static |
| E19 | Accessibility tester | Navigate recovery output | Runtime evidence absent | NEEDS_RUNTIME_VERIFICATION |
| E20 | Incident responder | Prove no destructive action | Need provider-spy and byte-hash test | P2; executable receipt; pending |

Synthetic preference simulation was not used; no persona counts are treated as votes or market evidence.

## Decision memo

- **Serve:** independent and small-team authors using a local-first AI production workflow who need repeatable generation without losing control of cost or creative assets.
- **Choice / competitive reason:** compete on auditable local control and safe resumability, not on more automatic generation. Mature alternatives make restore/version actions explicit.
- **Differentiation:** deterministic, machine-readable checkpoints that preserve existing artifacts and make all paid external work intentional.
- **Top three:** (1) close PB-20261001-01 with a local zero-call guard; (2) diagnose and clear exact-head CI failure; (3) run the original malformed-state scenario in isolation at the PR head and again after the fix.
- **Do not / delete:** do not add a recovery database, cross-repo registry, general migration service, or silent artifact reconstruction. Do not interpret the report or Issue as implementation authorization.
- **Risk / experiment:** minimal experiment uses a temporary book, a pre-existing image with recorded hash, malformed state, and a provider spy. BUILD only if ordinary run stops, provider count is zero, hash is unchanged, and an explicit recovery action is documented.
- **Portfolio action:** `ai-novel-workstation` = **MAINTAIN / SIMPLIFY** recovery semantics; `autodev-ng` = **MAINTAIN** pending PR #118 landing/runtime proof. No complete-inventory ranking or merge recommendation this partial round.

## NOW / NEXT / LATER / DON'T

- **NOW:** treat PB-20261001-01 and the red exact-head CI as pre-merge blockers on PR #21; owner review required.
- **NEXT:** isolated runtime regression at exact PR head and, after any fix lands, default-branch replay of the same bytes/provider-call invariant.
- **LATER:** field-level schema hardening only when a separate reachable failure is evidenced.
- **DON'T:** no broad recovery architecture, no automatic issue reopening, no implementation run, no merge/deploy, no duplicate comment.

## Writes and disposition

- New Issues: 0
- Issue/PR comments: 0
- Reopened/closed: 0
- Product code/config changes: 0
- Audit reports: 1 (this file)
- Central audit PRs: 1
- Finding: 1 new P2; tracked as **SKIPPED_LOCKED_ACTIVE_PR** with active PR #21 as owner and this report as independent evidence
- Runtime pending: malformed image state + existing output + ordinary image-loop, provider spy, byte hash; exact-head CI logs; post-merge/default-branch replay
- CLEAN: not claimed; fixed A01–J05 stop conditions and two qualifying full rounds are not satisfied.
