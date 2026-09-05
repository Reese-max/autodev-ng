# Portfolio 50-Persona Audit — Round 1 Progress

Date: 2026-09-06
Protocol: `docs/portfolio-audit/2026-09-06-50-persona-audit.md`

This progress note records the fixed 50-persona model simulation plus repository evidence. It is not a 50-human study. Runtime paths are never marked passed without actual execution, CI, deployment, browser or provider evidence.

## Portfolio accounting

- Owned repositories discovered: **39**.
- Non-empty repositories processed in Round 1: **38/38**.
- Empty repository: **`gooaye`** — no default-branch artifact to audit/write into; track centrally as `EMPTY / NO AUDIT TARGET`, not CLEAN.
- Repositories marked CLEAN: **0**.
- Every non-empty repository now has a Round 1 repository-local audit report, except `herdr-skills` where protected `main` correctly rejected a direct write; its report is on audit branch `audit/50-persona-round-1-2026-09-06` in PR #1.

## Round 1 status by repository

| Repository | Status | Highest current finding / evidence | Tracking |
|---|---|---|---|
| `92-duty-scheduler` | NOT CLEAN | **P0** unauthenticated cross-student timetable write | #13 umbrella, #14 P0; repo report |
| `adng-memory` | NOT CLEAN | **P2** missing root lifecycle/retention/recovery contract | #1 existing, #2 umbrella; repo report |
| `ai-novel-workstation` | RUNTIME-PENDING | no new reproducible P0/P1/P2 static finding | #1 tracking; repo report |
| `autodev-ng` | NOT CLEAN | **P0** committed non-placeholder credential-like judge secret material | #2 umbrella, #3 P0; repo report |
| `avatar-vfo` | NOT CLEAN | **P0** public Worker API lacks authentication and per-user D1 ownership isolation | #1 P0; repo report |
| `book5-windows-server-2022` | NOT CLEAN | **P2** no root README / learner-maintainer entry contract | #3 P2; repo report |
| `cf-ai-router` | RUNTIME-PENDING | no new P0/P1/P2; current-main CI passed; auth/rate-limit production paths fail closed statically | repo report |
| `cf-mcp-server` | NOT CLEAN | **P0** OAuth flow can disclose the root MCP bearer credential; existing P2 packaging/docs issue | #2 P0, #1 P2; repo report |
| `chatgpt-dual-pipeline` | NOT CLEAN | **P2** historical repo slug does not identify canonical internship-notes product | #1 P2; repo report |
| `claude-mem` | CI/RUNTIME-PENDING | no new P0/P1/P2; workflow files exist but owned repo has no workflow-run evidence | repo report |
| `clinical-scribe-worker` | NOT CLEAN | **P1** documented public server-funded Gemini endpoint has no abuse/access control | #1 P1; repo report |
| `cyber-prep-coach` | RUNTIME-PENDING | no new P0/P1/P2; current-main CI passed | repo report |
| `exam-archive` | NOT CLEAN | **P2** no root README + ~1.35 MB monolithic `index.html` | #1 P2; repo report |
| `flux-image-gen` | NOT CLEAN | **P1** production generation abuse controls can fail open when limiter is missing/failing | #11 P1; repo report |
| `gemini-deidentifier` | NOT CLEAN | **P2** repository name implies de-identification but product is an AI RPG | #28 P2; repo report |
| `gooaye` | EMPTY | empty repository; no audit target/default-branch artifact | central tracking only |
| `herdr-skills` | RUNTIME-PENDING | no new P0/P1/P2; current-main `validate` CI passed and main is protected | PR #1 audit report |
| `internship-notes-sites-mirror` | NOT CLEAN | **P1** documented publish command depends on undocumented parent-directory/canonical checkout layout | #1 P1; repo report |
| `lobsterpulse` | NOT CLEAN | **P0** enabling Codex monitoring overwrites existing unrelated Codex hooks | #1 P0; repo report |
| `lplrs-judicial-sync` | NOT CLEAN | **P1** takedown deletion cannot erase raw judgment bodies already committed in Git history/clones/backups | #1 P1; repo report |
| `MaterialYouNewTab` | RUNTIME-PENDING | no new P0/P1/P2; current-main QA/web-preview CI passed | repo report |
| `minideck` | RUNTIME-PENDING | no new P0/P1/P2; current-main CI passed; Worker auth/quota runtime paths still pending | repo report |
| `neciken-summer-poem` | NOT CLEAN | **P2 runtime/CI regression** current master Ruff gate reports 233 errors and stops before pytest | #1 P2; repo report |
| `note-filler` | NOT CLEAN | **P2** root legal/admin note-filling safety/provenance contract still absent | #1 P2; repo report |
| `obsidian-vault` | RECOVERY-PENDING | no new P0/P1/P2 under vault-specific scope; secret/PII plugin paths are Git-ignored | repo report |
| `openab` | NOT CLEAN | **P1** broad Discord channel access combined with coding-agent `--trust-all-tools`; Issues disabled | repo report + central tracking |
| `police-exam-archive` | NOT CLEAN | **P2** four image-choice questions remain `[圖片選項]` without faithful in-product assets | #58 P2; repo report |
| `police-exam-practice` | RUNTIME-PENDING | compatibility-only redirect repository; no new P0/P1/P2 | repo report |
| `ppt-studio` | RUNTIME-PENDING | no new P0/P1/P2 under documented local scope; provider/import/fetch/browser failure paths pending | repo report |
| `project-doctor-web` | NOT CLEAN | **P1** malformed required clinical structure can fail open; red-flag/rate-limit P1s remain | #3 umbrella, #4 new P1, #1/#2 existing; repo report |
| `prompt-autoresearch` | NOT CLEAN | **P2** no root contract; source/config/generated-artifact/budget/recovery boundaries unclear | #1 P2; repo report |
| `skill-foundry` | EXTERNAL-RUNTIME-PENDING | no new P0/P1/P2; strong evidence gates documented, but no GitHub Actions run evidence on main | repo report |
| `soundbox-offline` | BROWSER-RUNTIME-PENDING | no new P0/P1/P2; current-main CI passed; IndexedDB/PWA recovery tests pending | repo report |
| `taichung-police-intel` | NOT CLEAN | **P1 runtime regression** scheduled source refresh reaches full gate then publication/build fails; deploy is skipped | #9 P1; repo report |
| `taiwan-intel-dashboard` | INTENTIONALLY PAUSED | no new P0/P1/P2; 503/update pause is explicit safety state pending controlled restore | repo report |
| `tick-stock-panel` | NOT CLEAN | **P2** root finance data-freshness/simulation/non-trading contract still absent | #1 P2; repo report |
| `UkePack` | NOT CLEAN | **P0** documented public deployment exposes enumerable integer-ID project read/write APIs without owner authorization | #1 P0; repo report |
| `video-timeline-pipeline` | RUNTIME-PENDING | no new P0/P1/P2; strong cost/cache/provenance boundaries; fresh provider/resume evidence pending | repo report |
| `voice-actress` | NOT CLEAN | **P1 ×2** silent mock grading provenance + grade-session persistence/schema/dashboard failures | #1/#2 P1; repo report |

## New high-priority findings added during the portfolio continuation

### P0 — `avatar-vfo`: public shared-D1 API has no ownership boundary

The documented Worker deployment exposes avatar/message list/read/update/delete/reset plus server-funded chat/auto-simulate without authentication or per-user ownership enforcement. Add authentication, user/tenant ownership, durable abuse controls and cross-user negative tests before public use.

### P0 — `cf-mcp-server`: OAuth collapses into the root MCP credential

The default-branch OAuth implementation auto-approves arbitrary clients/redirect URIs, derives authorization codes from the root token, returns that root token as the OAuth access token, and accepts refresh-token grants without validating an actual refresh token. The same bearer credential gates L3 production deploy/rollback/KV-delete tools. Rotate the deployed root token after fixing the protocol.

### P0 — `lobsterpulse`: Codex hook installation destroys unrelated user configuration

`install_codex_hooks()` writes a new `~/.codex/hooks.json` containing only LobsterPulse hooks instead of merging existing entries. Fix with parse/merge, atomic replace, backup, malformed-config fail-closed behavior and round-trip fixtures.

### P0 — `UkePack`: predictable project IDs are used without authorization

The public-deployment path stores projects under auto-increment integer IDs. Project read, chord-write, analysis and arrangement routes use those IDs without authentication/ownership checks even when a project is labelled `private`. Add an owner/tenant or strong project-capability boundary across every route; public share links must remain separate from owner/edit authority.

### P1 — `flux-image-gen`: billable protection dependency fails open

The public Worker defaults Turnstile off, while the rate-limit helper allows requests if its durable limiter binding is missing or throws. Production must reject provider-consuming work before any upstream call when abuse-control dependencies are unavailable.

### P1 — `internship-notes-sites-mirror`: clean-clone publish path is not reproducible

The documented `npm run publish:pages` derives the canonical repo path from the mirror's parent directory and expects scripts not present in the mirror repository. Make the canonical checkout/configuration explicit while preserving the downstream fail-closed `verify-all` deployment gate.

### P1 runtime regression — `taichung-police-intel`

Actual GitHub Actions evidence shows scheduled collection and V1/V2 verification succeeding, followed by failure in the full verification/build step; publication/deployment is then skipped. This is correct fail-closed behavior but leaves public intelligence stale. Restore the gate/build path without weakening provenance/data-quality checks.

### P2 runtime/CI regression — `neciken-summer-poem`

Current default-branch CI stops at Ruff with 233 findings and never reaches pytest. Restore a green lint gate so behavior regression tests actually execute.

## CLEAN accounting

**No repository is marked CLEAN in Round 1.**

A repository with no new static P0/P1/P2 is only `RUNTIME-PENDING`, not CLEAN. CLEAN still requires:

1. all P0/P1/P2 resolved or explicitly justified `not_planned`;
2. current/recent execution evidence for every required runtime/provider/browser/deployment path;
3. the same fixed 50-persona scenarios re-run after relevant fixes;
4. **two consecutive rounds** on current/recent code with no new P0/P1/P2 findings.

The next audit pass should prioritize the six P0 repositories (`92-duty-scheduler`, `autodev-ng`, `avatar-vfo`, `cf-mcp-server`, `lobsterpulse`, `UkePack`), then P1 repositories/runtime regressions, and only re-run CLEAN qualification after fixes land.