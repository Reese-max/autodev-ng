# Product Board Audit — 2026-10-03T14:05:00Z

## Status and evidence boundary

**PARTIAL / NOT CLEAN.** Incremental portfolio round after `2026-10-03T11:06:37Z`. The owned inventory was fully re-enumerated (45 repositories: 44 active, one archived); deep source review was limited to default-branch changes and Issues/PRs/CI updated in the window.

- Rules: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Primary inspected default SHA: `Reese-max/autodev-ng@c521ee021db659e94cc7cf1ed70cb3ac8de40a4b`
- Secondary landed SHA: `Reese-max/academic-mcp@301c438cf7c6b4d9e246b153ba2f072d0cd381ac`
- Active candidate SHA: `Reese-max/ninax-line-hermes@71d63af630c8ab81ab08fb788e1641798c32c983`
- Read window: `2026-10-03T11:06:37Z–2026-10-03T14:05:00Z`
- Evidence classes: SOURCE_CONFIRMED, static inference, default-branch push CI and exact-head PR CI. No production secret, real Telegram call, real LINE send, paid provider call, deployment, merge, worker, GOAL, product-code or CI/config change was initiated by this audit.

Archived `Reese-max/obsidian-vault` remains excluded from product defect creation. Empty/content-only repositories were not converted into artificial product findings.

## Discovery / default-branch / CI delta

### 1. autodev-ng #134 — VERIFIED_FIXED

[PR #136](https://github.com/Reese-max/autodev-ng/pull/136) landed at `c521ee021db659e94cc7cf1ed70cb3ac8de40a4b`. The schema now requires every non-empty Telegram token to be one of the existing secret-reference forms. It adds discriminating coverage for the notifier-shaped token that originally bypassed the guard, all four reference forms, omitted-token disablement, non-echoing errors and the single `/bot` URL prefix.

The default-branch push [CI run 37124081084](https://github.com/Reese-max/autodev-ng/actions/runs/37124081084) completed successfully on the landing SHA: install, typecheck, full flaky-regression gate and retained GitHub regression tests all passed. This is a post-landing rerun of the original failure condition and adjacent paths, not merely a merge/diff inference.

Result: [Issue #134](https://github.com/Reese-max/autodev-ng/issues/134) remains closed and now has a read-back verified `VERIFIED_FIXED` comment plus a released product-board lease. No real token or Telegram API was needed for this schema/consumer mismatch. This does not verify Telegram delivery runtime or other secret fields.

### 2. academic-mcp #15 — PARTIALLY_FIXED / NEEDS_RUNTIME_VERIFICATION

[PR #26](https://github.com/Reese-max/academic-mcp/pull/26) landed at `301c438cf7c6b4d9e246b153ba2f072d0cd381ac`. Static review confirms Crossref confirmed-empty/404 states are now separated from 429-after-bounded-retry, 403/5xx, timeout/transport and malformed-response failures; unified search preserves other sources while recording Crossref errors.

Default-branch push [run 37119526151](https://github.com/Reese-max/academic-mcp/actions/runs/37119526151) passed the offline verifier. The issue intentionally remains open: the landing has not yet been re-exercised through the owner FastMCP/deployed service path. Prior candidate adapter/provider smoke is not silently promoted to post-landing deployed acceptance.

### 3. ninax-line-hermes #13 — candidate only

Open [PR #13](https://github.com/Reese-max/ninax-line-hermes/pull/13) advanced to `71d63af630c8ab81ab08fb788e1641798c32c983`. Exact-head [run 37127813894](https://github.com/Reese-max/ninax-line-hermes/actions/runs/37127813894) passed. Source and tests add revision-bound LINE input receipts, stale-delivery blocking and stable retry keys. The PR itself retains test-channel edit/redelivery and physical mobile receipt as pending. It owns this scope; no Issue/PR comment or duplicate tracker was created.

### Updated-scope dedupe

Fourteen additional Issues/PRs had activity. Their exact fingerprints remain owned by existing Issues/active PRs, including timetable authorization, portable gates, production publication, abuse controls and credential lifecycle. No new independent P0/P1/P2 root cause passed all four creation gates.

## External alternatives / competitors

Official sources rechecked 2026-10-03. Capability claims are not independent outcome evidence for this portfolio.

| Alternative | Current confirmed capability | Product implication |
|---|---|---|
| 1Password CLI | Secret-reference URIs can be resolved by `op run`: https://developer.1password.com/docs/cli/secrets-scripts | MUST MATCH the safety outcome; do not require this paid dependency |
| Doppler CLI | `doppler run` injects selected secrets into a child process: https://docs.doppler.com/docs/cli | SHOULD BE BETTER for zero-provider local setup |
| GitHub Actions Secrets | Secrets are stored separately and referenced by workflows: https://docs.github.com/en/actions/reference/security/secrets | MUST MATCH: tracked config need not contain raw credentials |
| SOPS | Encrypts YAML/JSON/ENV/INI/binary content with KMS/age/PGP: https://github.com/getsops/sops/blob/main/README.rst | DO NOT COPY for #134; lifecycle and key management exceed the root cause |
| Crossref REST + public/polite pools | Public API plus optional contact identity under the service contract: https://www.crossref.org/documentation/retrieve-metadata/rest-api/rest-api-metadata-retrieval/ | academic-mcp should preserve provider failure truth, not promise availability |
| Generic manual workflow | Shell env/file references and direct provider inspection | DIFFERENTIATOR remains inspectable local state with bounded, explicit runtime claims |

No new market signal justifies a vault service, provider registry, hosted control plane, mobile client or broad retry framework.

## Product board simulation

Model-simulated perspectives, not independent expert votes:

- **CEO:** only three priorities: preserve trustworthy default-branch regression evidence; complete the narrow owner-runtime acceptance for open high-impact Issues; prevent active candidates from being mistaken for shipped fixes. Do not start platform programs.
- **CPO:** #134 is complete for its narrow contract. For academic-mcp, keep “provider failed” distinct from “no result” through the user-visible gateway before closure.
- **CTO:** schema/consumer invariants and provider-error semantics should stay local and testable. Reject a cross-repository framework.
- **Staff/Principal Engineer:** current patches are appropriately bounded; require exact landing SHA receipts and avoid private-client abstractions without a pinned contract.
- **UX Lead/Researcher:** errors should name the field/source and recovery action without echoing credentials or presenting failure as empty success.
- **Growth:** reliability and first-success trust dominate new surface area; no evidence supports feature expansion.
- **CFO:** zero new service or paid-provider commitment.
- **Security/Privacy:** #134 was a P2 guard gap, not an observed leak. Keep real tokens out of validation.
- **QA:** distinguish candidate-head green, landing-head green and deployed-path acceptance.
- **SRE:** a green focused/offline gate is not a deployed runtime receipt.
- **Accessibility:** no new accessibility runtime evidence in this interval.
- **Support:** “provider unavailable” must not become “nothing exists”; recovery text should remain actionable.

Disagreement retained: Engineering accepts #134 as fully fixed at the schema boundary; SRE refuses to generalize that result to Telegram delivery. For academic-mcp, Product sees the semantics as implemented while SRE keeps the Issue open until the supported gateway/deployed path is exercised.

## 50 synthetic personas

30 regression baselines + 20 exploration cases. This is model simulation, not human research, incidence, revenue or preference-share evidence; it is separate from fixed A01–J05 and does not advance CLEAN rounds.

| ID | Background / task / constraint | Result | Classification / evidence |
|---|---|---|---|
| R01 | new AutoDev local user; no Telegram | omitted field still disables | NONE / source+CI |
| R02 | Git-backed config user; paste notifier-shaped token | rejected on main | VERIFIED_FIXED #134 |
| R03 | support user; short placeholder token | rejected early | VERIFIED_FIXED #134 |
| R04 | env-reference user | resolves through assembly | VERIFIED_FIXED adjacent |
| R05 | explicit env-reference syntax user | accepted | VERIFIED_FIXED adjacent |
| R06 | shell-variable reference user | accepted | VERIFIED_FIXED adjacent |
| R07 | file-reference user | accepted | VERIFIED_FIXED adjacent |
| R08 | operator with missing referenced env | existing fail-fast retained | no new finding |
| R09 | security reviewer | error must not echo token | passed synthetic regression |
| R10 | notifier maintainer | URL gets exactly one bot prefix | passed synthetic regression |
| R11 | CI maintainer | landing SHA, not PR SHA | push CI 37124081084 green |
| R12 | Telegram production operator | real send receipt | UNKNOWN / not required for #134 |
| R13 | academic searcher; Crossref 503 | provider error preserved statically | PARTIALLY_FIXED #15 |
| R14 | academic searcher; confirmed empty | remains empty, not error | PARTIALLY_FIXED #15 |
| R15 | DOI user; genuine 404 | remains not-found | PARTIALLY_FIXED #15 |
| R16 | DOI user; timeout | surfaces failure | PARTIALLY_FIXED #15 |
| R17 | multi-source researcher | arXiv success + Crossref failure | success retained, error recorded |
| R18 | owner gateway user | 81-tool offline contract | push verifier green |
| R19 | deployed academic user | live gateway failure path | NEEDS_RUNTIME_VERIFICATION |
| R20 | no-contact Crossref user | public pool path | source-confirmed; deployed pending |
| R21 | private-contact Crossref user | polite-pool config | source-confirmed; secret not read |
| R22 | LINE user; webhook redelivery | candidate dedupes | PR #13 only |
| R23 | LINE user; edit before work | candidate supersedes | PR #13 only |
| R24 | LINE user; edit during work | stale answer blocked | PR #13 only |
| R25 | LINE user; restart | receipts recover | synthetic exact-head CI |
| R26 | LINE user; ambiguous Push | stable retry key candidate | synthetic exact-head CI |
| R27 | mobile LINE recipient | actual receipt | NEEDS_RUNTIME_VERIFICATION |
| R28 | accessibility user | no changed path | no new evidence |
| R29 | portfolio owner | wants zero noise | no duplicate Issues |
| R30 | audit reviewer | asks if CLEAN | blocked |
| E01 | whitespace token paste | any non-reference non-empty rejected | fixed by strict rule |
| E02 | future Telegram token shape | reference-only avoids regex drift | fixed design |
| E03 | malformed reference-looking token | bounded adjacent risk | no new independent evidence |
| E04 | legacy plaintext config | intentional compatibility break | owner accepted via merge |
| E05 | secret-manager advocate | requests vault adapter | REJECT / no demand |
| E06 | Actions-only operator | uses repository secret → env ref | supported alternative |
| E07 | SOPS operator | decrypts before launch | compatible external workflow |
| E08 | Crossref rate-limited user | bounded retry then visible error | source/CI |
| E09 | Crossref malformed payload | visible provider error | source/CI |
| E10 | Crossref full outage | other sources retained | source/CI |
| E11 | FastMCP remote client | runtime parity | pending |
| E12 | restarted academic service | loaded patch on deployed instance | pending |
| E13 | LINE same-ms edit/original | candidate deterministic ranking | PR #13 |
| E14 | LINE wrong-chat postback | candidate rejects foreign tap | PR #13 |
| E15 | LINE multi-process shared profile | contract says single owner process | do not expand absent supported path |
| E16 | LINE CI reviewer | current head differs from older body receipt | current head run 37127813894 green |
| E17 | incident responder | asks for known leaked Telegram token | none found; do not escalate |
| E18 | finance owner | asks for new paid service | reject |
| E19 | platform architect | proposes common lifecycle framework | reject as over-engineering |
| E20 | CLEAN auditor | asks for streak credit | no; runtime and existing severity blockers remain |

## Red Team

1. Could #134 still fail because no real Telegram call ran? No: the root cause was schema admission versus notifier input shape. Post-landing source plus discriminating CI covers that fingerprint; delivery reliability is separate.
2. Could a green push CI be non-discriminating? The added test contains the exact formerly accepted non-`bot` synthetic shape and would fail on the previous predicate.
3. Could academic-mcp be called VERIFIED_FIXED? Not yet for the supported deployed gateway. Static/offline evidence is strong, but post-landing owner-runtime failure and success paths remain absent.
4. Could prior candidate live smoke substitute? No; it predates the landing SHA and exercised the adapter directly.
5. Could PR #13 be treated as shipped? No; it is open, and physical LINE/mobile acceptance remains pending.
6. Do competitor products require a new secret platform? No; AutoDev already has references. The smallest correction has landed.
7. Is a new Issue needed for any reviewed activity? No. Existing trackers/PRs own the exact roots; broad differences and missing runtime proof do not establish a new product defect.

## Findings / Issue mapping

| Finding | Status | Tracking | Action this round |
|---|---|---|---|
| Telegram guard/consumer prefix mismatch | VERIFIED_FIXED at `c521ee0` | [autodev-ng #134](https://github.com/Reese-max/autodev-ng/issues/134) | added verified evidence + released lease |
| Crossref failure reported as empty | PARTIALLY_FIXED; deployed runtime pending | [academic-mcp #15](https://github.com/Reese-max/academic-mcp/issues/15) | no comment; owner thread already updated |
| LINE revision/idempotent delivery | candidate; runtime pending | [ninax-line-hermes #13](https://github.com/Reese-max/ninax-line-hermes/pull/13) | SKIPPED_LOCKED_ACTIVE_PR |
| New independent actionable finding | none | — | no Issue manufactured |

## Decision memo / NOW-NEXT-LATER-DON'T

- **Serve:** local and unattended operators who need inspectable state, truthful failure semantics and safe configuration without mandatory hosted services.
- **Choice / competition:** keep the existing lightweight reference model and explicit provider errors; compete on inspectability and bounded claims rather than secret-platform breadth.
- **Differentiation:** provider-optional first success, deterministic evidence, and refusal to label candidate/offline evidence as deployment truth.
- **Top three:** (1) retain #134 regression on default; (2) complete #15 post-landing FastMCP/deployed acceptance; (3) complete PR #13 test-channel/mobile acceptance before merge.
- **Do not / delete:** no vault/provider matrix, generic lifecycle framework, live-token tests, duplicate runtime-gap Issues or synthetic ROI.
- **Risk / experiment:** run only non-destructive supported-path checks with synthetic inputs; success requires correct visible error/success semantics and exact SHA receipts.
- **Portfolio posture:** `autodev-ng = MAINTAIN + SIMPLIFY`; `academic-mcp = MAINTAIN`; `ninax-line-hermes candidate = PAUSE promotion until runtime receipt`. Full cross-portfolio ranking remains deferred because this is an incremental round, not a complete deep reread of every repository.

- **NOW:** keep #134 closed with VERIFIED_FIXED evidence; keep #15 open for owner runtime; keep PR #13 candidate-only.
- **NEXT:** verify other landed P0/P1 candidates on their new default SHA and supported runtime.
- **LATER:** broader integrations only after demonstrated demand.
- **DON'T:** merge/deploy/start workers, read real secrets, perform paid calls or infer CLEAN from green unit/offline gates.

## Writes / accounting / cursor

- New Issues: 0
- Updated Issues: 1 — #134 evidence comment only, under a verified/released lease
- Reopened/closed by audit: 0
- New actionable findings: 0
- Verified fixes: 1
- Partial fixes / runtime pending: 1
- Dedupe / active-scope skips: reviewed 15 updated PRs and 6 updated Issues; no duplicate tracker
- Product/CI/config/secrets/settings changes: 0
- Merges/deployments/workers/GOALs: 0
- Report: this unique audit-only file
- Next deep-read cursor: `avatar-vfo` after the prior `autodev-ng` cursor; change-driven P0/P1 review remains first
- Portfolio CLEAN: **NO**; existing severity/runtime blockers remain and no CLEAN streak advances
