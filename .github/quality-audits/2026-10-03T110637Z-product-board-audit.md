# Product Board Audit — 2026-10-03T11:06:37Z

## Status and evidence

**PARTIAL / NOT CLEAN.** Incremental portfolio round after cursor `2026-10-03T08:09:00Z`. Inventory enumeration completed (45 owned repositories; 44 active, one archived); deep source review was limited to default-branch changes and repositories with Issues/PR/CI activity.

- Rules: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Primary inspected product SHA: `Reese-max/autodev-ng@d55cdcba14a9ca8decb6d9a7ac9ebd66342af6ad`
- Secondary landed SHA: `Reese-max/project-doctor-web@f34dd1d7b0112705fa2a1ada5349028b41e6c8b7`
- Read window: `2026-10-03T08:09:00Z–2026-10-03T11:06:37Z`
- Evidence: SOURCE_CONFIRMED, static inference, and exact-head/default-push GitHub Actions. No production secret, Telegram API call, paid provider call, merge, deployment, worker start, GOAL, or product implementation was performed.

## Discovery / inventory / CI delta

Active owned repositories (44): `exam-archive`, `police-exam-practice`, `police-exam-archive`, `92-duty-scheduler`, `UkePack`, `ppt-studio`, `voice-actress`, `taiwan-intel-dashboard`, `autodev-ng`, `flux-image-gen`, `claude-mem`, `lobsterpulse`, `prompt-autoresearch`, `neciken-summer-poem`, `note-filler`, `adng-memory`, `cyber-prep-coach`, `cf-ai-router`, `avatar-vfo`, `project-doctor-web`, `minideck`, `chatgpt-dual-pipeline`, `taichung-police-intel`, `soundbox-offline`, `skill-foundry`, `video-timeline-pipeline`, `ai-novel-workstation`, `clinical-scribe-worker`, `MaterialYouNewTab`, `cf-mcp-server`, `tick-stock-panel`, `herdr-skills`, `ninax-line-hermes`, `ai-flight-radar`, `academic-mcp`, `spotify-playlist-organizer-mcp`, `google-maps-personal-mcp`, `travel-planning-mcp`, `octobroker`, `openab`, `police-essay-mcp`, `openab-pty`, `travel-planning-app`, `studio`. Archived `obsidian-vault` was excluded from product defect creation.

Default-branch changes in-window:

1. `autodev-ng@d55cdcba…` (PR #117): config/onboarding/accessibility/regression changes; push CI run 37112891827 passed.
2. `project-doctor-web@f34dd1d7…` (PR #33): synthetic fixed-50 Objective-provenance tests/docs; push CI run 37117061295 passed. This is test evidence, not browser/provider/runtime acceptance.

Twenty-eight PRs and one Issue had activity. Exact-head checks were read for active heads. Important non-findings:

- `tick-stock-panel` PR #11 head `361d959a…`: unit workflow passed; Docker smoke 37117349930 failed because nested Docker could not create an unprivileged user namespace for bubblewrap. The draft PR's own required check is red: environment/runtime admission mismatch already tracked by the PR, not a default-branch regression.
- `clinical-scribe-worker` #6 / PR #21: default remains vulnerable; candidate CI/prerequisite passed but preview/production were skipped and PR is draft.
- `ai-flight-radar` PR #18 head `df50b578…` checks passed, but no default landing; no VERIFIED_FIXED claim.
- `cyber-prep-coach` deploy failures remain Cloudflare credential/environment failures while CI passed.
- `flux-image-gen` PR #30 CI passed and deploy failed; no default-branch product change.

## Confirmed finding and tracking

### F-2026-10-03-01 — Telegram secret guard checks the wrong wire shape

- kind: VALIDATION_GAP
- severity: P2
- decision_priority: NOW
- triage: NEEDS_REVIEW
- auto_implementation: false
- confidence: HIGH
- tracking: https://github.com/Reese-max/autodev-ng/issues/134
- fingerprint: `Reese-max/autodev-ng+ConfigSchema.telegramBotToken+plain token without bot prefix+accepted despite secret-reference-only guard+validator/consumer prefix mismatch`

At `d55cdcba…`, `src/types.ts` rejects only `^bot\d+:[A-Za-z0-9_-]{35}$`, while `src/engines/notify.ts` constructs `https://api.telegram.org/bot${token}/sendMessage`. The config token therefore must not carry that prefix. The new test rejects only a synthetic `bot123…`; a notifier-shaped synthetic `123…:…` plain token passes the schema.

Impact: operators who place configs in Git, backups, or worktrees can still persist the actual Telegram credential shape despite the new reference-only guard. No real token was found. Minimum correction is a local schema/predicate and regression test; no vault, registry, service, or state machine is justified.

Immediate all-state Issues/PR/branches dedupe found #2/#3/#6 for the broad secret-safe direction, historical committed material, and unresolved references, but no validator/consumer prefix-mismatch tracker. #3 stays closed because its original root cause differs.

## External alternatives / competitive matrix

Sources checked 2026-10-03; capability claims are not outcome evidence for this product.

| Alternative | Confirmed capability | Product implication |
|---|---|---|
| 1Password CLI | `op read`, `op run`, injection, and reference-based provisioning: https://developer.1password.com/docs/cli/reference and https://developer.1password.com/docs/cli/upgrade | SHOULD BE BETTER: retain zero-provider local use while failing closed on plaintext |
| Doppler CLI | `doppler run` injects selected secrets into child-process environment: https://docs.doppler.com/docs/cli | DO NOT COPY: no paid dependency for one predicate |
| GitHub Actions Secrets | separately stored secrets are exposed through inputs/env: https://docs.github.com/en/actions/concepts/security/secrets | MUST MATCH: no raw secret required in tracked text |
| SOPS | encrypted YAML/JSON/ENV/INI/BINARY with KMS/age/PGP: https://github.com/getsops/sops/blob/main/README.rst | DO NOT COPY now: lifecycle exceeds this root cause |
| Vault Agent | renders secrets to files/env and can supervise a child: https://developer.hashicorp.com/vault/docs/agent-and-proxy/agent/template | DIFFERENTIATOR: AutoDev stays lightweight using its existing refs |

Market conclusion: reference/runtime-injection patterns are mature, but AutoDev already has `{env:…}` and `{file:…}`. The opportunity is to remove ambiguity and drift, not add a secrets platform.

## Product board (model simulation, not independent votes)

- CEO: only three things—close #134 narrowly; land/runtime-verify existing P0/P1 candidates; restore trustworthy regression evidence. Do not build vault/provider matrices.
- CPO: use “field omitted = disabled; field present = reference”; opposes heuristic token regexes.
- CTO: tie schema invariants to consumer contracts; vendor formats drift.
- Staff/Principal Engineer: share one predicate or allow-list reference syntax; reject a cross-repo framework.
- UX Lead/Researcher: error names field + allowed references, never value.
- Growth: no growth case for new secret features; reliable first setup matters.
- CFO: zero-new-service patch.
- Security/Privacy: P2 validation gap, not observed leakage; no live token test.
- QA: realistic non-`bot` fixture, omission, refs, and URL-prefix regression.
- SRE: fail before daemon/task start.
- Accessibility: labels improved statically; runtime AT evidence still absent.
- Support: one actionable config error beats late missing notifications.

Disagreement: CPO/Security favor rejecting every non-reference non-empty value; Engineering flags backward compatibility for legacy plaintext configs. Owner review is required, without expanding scope.

## 50 synthetic personas (30 regression + 20 exploration)

Separate from fixed A01–J05. Model simulation only; no frequency, revenue, preference-share, or human-study claim.

| ID | Background / goal / journey | Result | Classification / evidence |
|---|---|---|---|
| R01 | new local user; mock config → status | pass, no secret | NONE / README+schema |
| R02 | provider user; populated env ref | resolves | NONE / resolver |
| R03 | provider user; missing env | fails early | NONE / source |
| R04 | file-ref user; readable file | resolves | NONE / source |
| R05 | file-ref user; missing file | fails early | NONE / source |
| R06 | no Telegram; omit token | disabled | NONE; preserve |
| R07 | Telegram + tracked config; paste real-shape synthetic token | plaintext accepted | P2 / #134 |
| R08 | test author; paste `bot123…` | rejected though consumer double-prefixes | P2 support / source |
| R09 | Telegram env-ref user | pass | NONE |
| R10 | Telegram file-ref user | pass | NONE |
| R11 | Git-heavy operator; pre-commit config | actual shape not blocked | P2 / #134 |
| R12 | backup operator | plaintext may enter backup | P2 consequence / inference |
| R13 | multi-worktree operator | token may replicate | P2 consequence / inference |
| R14 | Windows operator; onboarding | mock path improved | NONE; runtime pending |
| R15 | Linux CI operator | green suite | missed R07 | P2 test gap / run 37112891827 |
| R16 | security reviewer | compare guard to consumer | mismatch | P2 / #134 |
| R17 | rotation operator | can paste new plain token | P2 / source |
| R18 | support engineer | diagnose notification | risk stays silent until persistence | P2 |
| R19 | incident responder | look for current leak | none evidenced | NOT_ESTABLISHED incident |
| R20 | CI maintainer | trust config tests | wrong fixture | P2 / tests |
| R21 | offline mock user | run without network | unaffected | NONE |
| R22 | CLI transport user | avoid HTTP key | unaffected | NONE |
| R23 | HTTP judge user | use ref | supported | NONE |
| R24 | Web cockpit user | use labeled inputs | static improvement | runtime pending |
| R25 | screen-reader user | navigate inputs | likely improved | NEEDS_RUNTIME_VERIFICATION |
| R26 | daemon operator | unattended start | wrong plain token remains | P2 maintenance risk |
| R27 | cost-sensitive user | avoid managed vault | refs suffice | NONE |
| R28 | enterprise Vault user | request adapter | demand absent | DEFERRED opportunity |
| R29 | SOPS user | external decrypt workflow | possible | not defect |
| R30 | audit maintainer | claim CLEAN | new P2 blocks | NOT CLEAN |
| E01 | future token format | length changes | heuristic can miss | prefer ref allow-list |
| E02 | whitespace paste | schema before notifier trim | UNKNOWN; test if needed |
| E03 | value starts `bot` | consumer double-prefixes | contract mismatch |
| E04 | malformed `{env:}` | may pass format heuristic | P2 adjacent; decide strict rule |
| E05 | arbitrary plaintext `hello` | accepted, late HTTP fail | P3 adjacent; keep in #134 decision |
| E06 | trigger schema error | value not echoed | NONE; preserve |
| E07 | explicit empty token | disabled | NEEDS_REVIEW compatibility |
| E08 | empty env value | fails early | NONE |
| E09 | relative file ref | config-dir resolution | NONE |
| E10 | unreadable file | generic fail | NONE security-wise |
| E11 | `${VAR}` templater | supported | NONE |
| E12 | routePolicy candidate ref | separate dispatch behavior | separate fingerprint |
| E13 | scanner author | numeric-colon fixture absent | P2 / #134 |
| E14 | notifier mock | assert URL | require one `bot` prefix |
| E15 | legacy plaintext upgrader | strict rule may break | NEEDS_REVIEW migration |
| E16 | secret-manager user | env injection | already supported |
| E17 | Actions user | secret → env ref | supported |
| E18 | no-network test host | schema test only | sufficient |
| E19 | red-team reviewer | realistic synthetic token | bypass reproduced statically | P2 |
| E20 | owner choosing framework vs patch | patch wins | NOW / minimal scope |

## Red Team

1. Existing secret refs solve only runtime resolution; notifier-shaped plaintext still passes.
2. Product code proves `bot` is URL syntax, not configured value; including it produces `/botbot…`.
3. No current leak was found; do not escalate to P0/P1.
4. Green CI is non-discriminating because the fixture uses the wrong shape.
5. Managed secret products are unnecessary; existing refs suffice.
6. Token-format heuristics may age; bounded stronger alternative is reference-only for any non-empty secret field.
7. No Telegram runtime is required to prove the schema root cause; use synthetic tests only.

## Decision memo / prioritization

- Serve: local/unattended maintainers storing configs in Git-backed workspaces.
- Choice: lightweight local refs over a new secret service; matches core competitor safety outcome while preserving mock onboarding.
- Differentiation: provider-free first success plus explicit secret refs.
- Top priorities: #134; existing high-severity landing/runtime verification; reliable regression/CLEAN evidence.
- Do not: Vault/SOPS adapters, registry, token introspection, live-token tests. Delete the misleading prefixed-fixture assumption.
- Risk/experiment: legacy compatibility. Test omission, four ref forms, realistic synthetic plain token, and exactly-one-prefix URL.
- Portfolio action: **MAINTAIN + SIMPLIFY** AutoDev-NG. Broader portfolio ranking deferred because this is an incremental change-focused round, not a deep reread of all repositories.

## NOW / NEXT / LATER / DON'T

- NOW: owner-review #134 and choose strict reference-only vs consumer-aligned predicate; `auto_implementation=false`.
- NEXT: after a landing, rerun schema/notify cases on the new default SHA and record VERIFIED_FIXED/PARTIALLY_FIXED.
- LATER: enterprise adapters only with demonstrated demand.
- DON'T: use real Telegram tokens, create a secrets platform, treat a green unit suite as runtime proof, or close CLEAN gates.

## Regression/runtime state

| Item | State |
|---|---|
| PR #117 secret remediation | PARTIALLY_FIXED; unresolved refs fail early, Telegram guard mismatched (#134) |
| PR #117 Web labels | LIKELY improved; NEEDS_RUNTIME_VERIFICATION for AT |
| project-doctor-web #9 matrix | synthetic tests landed/green; provider/browser runtime pending |
| clinical-scribe-worker #6 | STILL PRESENT ON DEFAULT; candidate only |
| ai-flight-radar datetime P1 | default unchanged; candidate checks do not verify fixed |
| Portfolio CLEAN | BLOCKED; new P2 + existing severity/runtime conditions; no streak advancement |

## Writes / accounting / cursor

- New Issues: 1 — `autodev-ng#134`
- Updated/reopened Issues: 0
- New audit reports: this file, via audit-only draft PR because main requires PR
- Product/CI/config changes: 0
- Merges/deployments/workers/GOALs: 0
- Dedupe/rejected candidates: existing CI/environment failures not duplicated
- Remaining: deep content/runtime reread for unchanged active repos
- Next cursor: continue fair rotation after `autodev-ng`; do not repeatedly favor it
