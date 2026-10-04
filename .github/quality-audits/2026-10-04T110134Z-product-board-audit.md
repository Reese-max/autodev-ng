# Product Board Audit — prompt-autoresearch

- Audit time: 2026-10-04T11:01:34Z
- Scope: incremental portfolio round; fair-rotation deep review of `Reese-max/prompt-autoresearch`
- Product default: `master@01dc864c04a052356e365ea877cae092067b44fa`
- Rules: `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md` blob `8167e10798071d2276addaff6b201c6b0e904a2a`
- Evidence labels: `SOURCE_CONFIRMED`, `STATIC_INFERENCE`, `EXECUTED_REPRODUCTION`, `UNKNOWN`
- Write boundary: audit documentation only; `auto_implementation=false`. This report does not authorize implementation, merge, deployment, provider calls, paid actions, settings changes, worker/GOAL execution, or production-data access.

## Executive result

`prompt-autoresearch` should be **MAINTAIN + SIMPLIFY**, not expanded into a general evaluation platform. Two earlier P1 fixes are present on the default branch, but neither satisfies the remaining exact-default/runtime evidence needed for a fully verified closure. The only currently reproducible user-facing defect in the reviewed scope is already tracked as Issue #7: the browser still offers retired Gemini 1.5 model IDs. All other actionable gaps and bounded research questions are already owned by Issues #1, #3, #5, #6 and active PRs; no new Issue is warranted.

Portfolio state is **NOT CLEAN**. This was not a complete A01–J05 fixed-persona audit, it is not a second consecutive qualifying clean round, and provider/network runtime evidence remains incomplete.

## Discovery and inventory

The authenticated owner inventory remains 45 repositories: 44 active and one archived (`obsidian-vault`). Every active default HEAD matched the previous round; no product default changed during this audit. The deep-review cursor advanced from `skill-foundry` to `prompt-autoresearch`.

| Product | Default HEAD | Disposition in this round |
| --- | --- | --- |
| prompt-autoresearch | `01dc864c04a052356e365ea877cae092067b44fa` | Full incremental product review |
| cf-ai-router | `74c52130046…` | HEAD unchanged; delta check only |
| soundbox-offline | `d58d73…` | HEAD unchanged; delta check only |
| police-exam-archive | `a0b5db…` | HEAD unchanged; delta check only |
| skill-foundry | `d283b5…` | HEAD unchanged; prior cursor complete |
| lobsterpulse | `41e09…` | HEAD unchanged; delta check only |
| google-maps-personal-mcp | `e97ada…` | HEAD unchanged; delta check only |
| tick-stock-panel | `54c303…` | HEAD unchanged; delta check only |
| clinical-scribe-worker | `5fb1bc…` | HEAD unchanged; active PR #25 owns test follow-up |
| ai-flight-radar | `622813…` | HEAD unchanged; active PR #17 owns research scope |
| openab | `50424e…` | HEAD unchanged; delta check only |
| adng-memory | `dc1c4e…` | HEAD unchanged; delta check only |
| avatar-vfo | `8c578f…` | HEAD unchanged; active PR #12 owns candidate work |
| taiwan-intel-dashboard | `df7cee…` | HEAD unchanged; delta check only |
| note-filler | `1df674…` | HEAD unchanged; delta check only |
| cyber-prep-coach | `ffc7bb…` | HEAD unchanged; delta check only |
| UkePack | `718d02…` | HEAD unchanged; delta check only |
| autodev-ng | `c521ee021db659e94cc7cf1ed70cb3ac8de40a4b` | Audit host; active PR #138 owns lock fix |
| ai-novel-workstation | `267a0b…` | HEAD unchanged; delta check only |
| police-essay-mcp | `97e994…` | HEAD unchanged; delta check only |
| herdr-skills | `9f134e…` | HEAD unchanged; delta check only |
| chatgpt-dual-pipeline | `1ade60…` | HEAD unchanged; delta check only |
| video-timeline-pipeline | `7d8929…` | HEAD unchanged; delta check only |
| claude-mem | `3ed543…` | HEAD unchanged; delta check only |
| travel-planning-app | `dd5081…` | HEAD unchanged; delta check only |
| MaterialYouNewTab | `7d32f2…` | HEAD unchanged; delta check only |
| taichung-police-intel | `562141…` | HEAD unchanged; active PR #103 owns release binding |
| travel-planning-mcp | `dbb66a…` | HEAD unchanged; delta check only |
| octobroker | `b66910…` | HEAD unchanged; delta check only |
| ninax-line-hermes | `b71a82…` | HEAD unchanged; delta check only |
| 92-duty-scheduler | `4d7d7d…` | HEAD unchanged; active PR owns prior candidate |
| voice-actress | `75cdce…` | HEAD unchanged; delta check only |
| project-doctor-web | `f34dd1…` | HEAD unchanged; active PR owns prior candidate |
| openab-pty | `9e1464…` | HEAD unchanged; delta check only |
| flux-image-gen | `dfadcf…` | HEAD unchanged; active PR #29 owns candidate work |
| neciken-summer-poem | `a6e268…` | HEAD unchanged; delta check only |
| minideck | `31f713…` | HEAD unchanged; delta check only |
| studio | `0f1b62…` | HEAD unchanged; delta check only |
| police-exam-practice | `b97b96…` | HEAD unchanged; active PR #7 owns runtime evidence |
| ppt-studio | `8ca3b8…` | HEAD unchanged; delta check only |
| exam-archive | `5d7472…` | HEAD unchanged; delta check only |
| spotify-playlist-organizer-mcp | `13aae7…` | HEAD unchanged; delta check only |
| academic-mcp | `81452f…` | HEAD unchanged; delta check only |
| cf-mcp-server | `a3192b…` | HEAD unchanged; active PR #29 owns candidate work |
| obsidian-vault | archived | Excluded: archived content repository; no product defect inferred |

### Repository evidence

- Root `README.md`: absent (`404`); Issue [#1](https://github.com/Reese-max/prompt-autoresearch/issues/1) already owns the repository-contract/artifact-boundary gap.
- `requirements.txt`: blob `47cd6b…`, including `PyYAML>=6.0`.
- `.github/workflows/ci.yml`: blob `b84630f…`; nine OS/Python cells, aggregate required gate, Linux acceptance command and coverage threshold.
- Current default `app.js`: blob `1b89ec0db356629f6fe28376664832d375e87f4b`; Issue [#7](https://github.com/Reese-max/prompt-autoresearch/issues/7) records the still-selectable `gemini-1.5-flash` and `gemini-1.5-pro` path.
- All-state issue/PR review: Issues #1, #3, #5, #6 and #7 remain open; Issues #4 and #12 are closed after product changes. Open PRs #2, #8, #11, #14 and #15 cover the current tracked scopes; no untracked duplicate fingerprint was found.
- Default-commit combined status was empty and this connector did not return an exact-`01dc864…` default-branch workflow run. Candidate evidence exists, but absence of a retrieved run is not proof that CI did not run.

## Regression accounting

| Tracking | Default-branch state | Verdict | Evidence limit |
| --- | --- | --- | --- |
| [#4 evidence contract](https://github.com/Reese-max/prompt-autoresearch/issues/4) | Fix merged; `01dc864…` is the merge result | `PARTIALLY_FIXED` | Candidate exact-head 9-cell CI and a push run were green before/around merge, but this round did not retrieve an exact-default-commit receipt. Do not claim `VERIFIED_FIXED`. |
| [#12 local UI boundary](https://github.com/Reese-max/prompt-autoresearch/issues/12) | Loopback/default authorization fix merged via PR #13 | `PARTIALLY_FIXED / NEEDS_RUNTIME_VERIFICATION` | Source and bounded ephemeral-loopback tests support the fix; no real browser/LAN/external-bind/provider-path acceptance was executed. |
| [#7 retired Gemini IDs](https://github.com/Reese-max/prompt-autoresearch/issues/7) | Retired IDs remain on default; PR #15 is draft | `STILL_REPRODUCIBLE` (`SOURCE_CONFIRMED`) | Exact-head PR CI is green, but candidate model lifecycle and live provider behavior still require authorized bounded verification. |
| [#1 repository contract](https://github.com/Reese-max/prompt-autoresearch/issues/1) | Root README still absent | `STILL_REPRODUCIBLE` (`SOURCE_CONFIRMED`) | Onboarding/operability gap; no evidence of a current data-loss or security incident. |
| [#3](https://github.com/Reese-max/prompt-autoresearch/issues/3), [#5](https://github.com/Reese-max/prompt-autoresearch/issues/5), [#6](https://github.com/Reese-max/prompt-autoresearch/issues/6) | Bounded research remains open | `NEEDS_EVIDENCE` | Research urgency is not a proven production severity; no implementation authorization. |

## External alternatives and competitive signals

Checked 2026-10-04. Product pages are vendor claims unless separately demonstrated; they are not evidence of benefit in this repository.

| Alternative | Confirmed capability / event date | Product implication | Price / privacy / maintenance signal |
| --- | --- | --- | --- |
| [Promptfoo](https://www.promptfoo.dev/docs/intro/) | `CONFIRMED`: local/open-source CLI, assertions, multi-provider matrices, caching/concurrency and CI/CD. Red-team quickstart was updated 2026-10-02 and describes HTTP/browser/direct-model targets and 50+ vulnerability types. | **MUST MATCH**: reproducible config, bounded provider calls, inspectable results. **DO NOT COPY**: broad security platform scope. | [Pricing](https://www.promptfoo.dev/pricing/): Community is free/self-hostable; enterprise/on-prem custom; provider inference still has cost. |
| [DSPy / MIPROv2](https://dspy.ai/3.4.0/api/optimizers/MIPROv2/) | `CONFIRMED`: optimizer jointly searches instructions and few-shot examples; current docs describe explicit metrics and compile-time optimization. Page update date `UNKNOWN`; docs checked 2026-10-04. | **DIFFERENTIATOR**: keep this product's evidence manifests, holdout gates and resumable artifacts clearer than a general program compiler. | [DSPy overview](https://dspy.ai/) states MIT/open source and Python ≥3.10; model calls remain user-billed. |
| [LangSmith](https://docs.langchain.com/langsmith/evaluation-types) | `CONFIRMED`: offline benchmarking/unit/regression and online monitoring; evaluator types include code, LLM-as-judge, pairwise and aggregate. Page update date `UNKNOWN`; checked 2026-10-04. | **SHOULD BE BETTER**: local-first, explicit evidence hashes and no mandatory hosted trace ingestion for the core workflow. | [Pricing](https://www.langchain.com/pricing): Developer $0/seat with 5k base traces; Plus $39/seat/mo with 10k; enterprise/custom and pay-as-you-go. Hosted data/usage boundaries matter. |
| [Braintrust](https://www.braintrust.dev/articles) | `CONFIRMED`: a 2026-09-08 official article describes GitHub Actions eval pipelines, baselines, thresholds and repeated trials; product combines datasets, scorers, experiments and production traces. | **MUST MATCH**: compare candidate to a stored baseline and surface cost/latency. **DO NOT COPY**: hosted observability breadth before this repository's core flow is reliable. | [Pricing](https://www.braintrust.dev/pricing): Starter $0 with included quotas; Pro $249/mo; enterprise custom. Retention and scored-output usage affect cost/privacy. |
| [TextGrad](https://github.com/zou-group/textgrad) | `CONFIRMED`: open-source textual-gradient optimization of prompts and other text variables; README/paper dates trace to 2024, repository checked 2026-10-04. | **DIFFERENTIATOR**: this product should prioritize promotion safety, artifact provenance and recovery over novel optimizer mechanics. | Open-source software; tutorial use still requires model credentials/cost. Operational maturity and current provider compatibility need independent verification. |
| Manual spreadsheet/notebook + version control | `LIKELY`: no vendor dependency and lowest initial complexity for small experiment counts. | **SHOULD BE BETTER**: automatic evidence capture, resume safety and repeatable gates must save enough manual work to justify the product. | Low platform cost; high operator effort and weak automation unless disciplined. |

Competitive posture:

- **MUST MATCH:** explicit datasets/metrics, baseline comparison, reproducible configuration, cost visibility, failure receipts, CI-friendly noninteractive execution.
- **SHOULD BE BETTER:** local-first evidence, fail-closed promotion, resumable runs, transparent holdout boundaries, simple zero-cost validation.
- **DIFFERENTIATOR:** evidence-first autonomous prompt iteration that can answer why a champion changed and safely stop/resume without adopting a hosted platform.
- **DO NOT COPY:** broad agent observability, generic red-team marketplace, automatic paid-provider expansion, or a new registry/router before current paths are reliable.

## Model-simulated product board

This is a multi-perspective model exercise, not independent expert consensus or user research.

| Lens | Position |
| --- | --- |
| CEO | If only three things ship: remove dead provider choices, finish the repository/budget contract, and close evidence/runtime verification gaps. Do not build a platform or add providers. |
| CPO | Keep the product for evidence-conscious prompt researchers; prioritize first successful zero-cost run and a trustworthy promotion receipt. |
| CTO | Preserve the existing gate/evidence architecture. Do not add a database, model registry, distributed worker or generic plugin framework. |
| Staff / Principal Engineer | Prefer small patches in `app.js`, documentation and existing receipts. Treat #3/#5/#6 as bounded research, not architecture commitments. |
| UX Lead / Researcher | A missing root README and dead selectable models damage first success more than additional optimization algorithms would help. |
| Growth | A clear local demo and credible evidence output are more distributable than feature breadth; avoid claiming simulated preference as adoption evidence. |
| CFO | Provider smoke and repeated trials need hard budgets; hosted competitors are references, not automatic subscriptions. |
| Security / Privacy | Keep default loopback, minimize key exposure, and require explicit authorization for any real provider/network test. |
| QA | Exact candidate CI is not exact-default acceptance. Keep `PARTIALLY_FIXED` until matching receipts exist. |
| SRE | A green matrix proves the tested commit, not browser/LAN/provider runtime. Preserve explicit runtime-pending states. |
| Accessibility | Keyboard/screen-reader usability of the browser UI has not been runtime-audited here; do not claim coverage from static HTML alone. |
| Support | The fastest support reduction is a root contract explaining canonical config, outputs, cost, stop/resume and stale-provider recovery. |

Material disagreement: Growth could favor a polished hosted comparison UI, while CTO/CFO/Security reject it now because no evidence shows that UI breadth beats the smaller reliability and onboarding work. The smaller path wins pending user evidence.

## 50 synthetic personas

These are synthetic journeys, not human respondents, incidence estimates, votes, or revenue evidence. R01–R30 preserve regression coverage; E01–E20 explore adjacent constraints. They are separate from the fixed A01–J05 audit and cannot establish CLEAN.

| ID | Background / constraint | Goal and journey | Friction / result | Severity / recommendation / evidence |
| --- | --- | --- | --- | --- |
| R01 | Solo prompt researcher; no paid budget | Clone, validate, run a dry check | Root start/stop contract is missing | P2; finish #1; `SOURCE_CONFIRMED` |
| R02 | New maintainer | Identify canonical YAML/JSON config | Authority remains ambiguous without root README | P2; #1; `SOURCE_CONFIRMED` |
| R03 | Budget owner | Bound tokens before an experiment | Controls exist but are not explained at entry | P2; #1; `SOURCE_CONFIRMED` |
| R04 | Interrupted laptop user | Resume best candidate after shutdown | Recovery path is not discoverable from root | P2; #1; `SOURCE_CONFIRMED` |
| R05 | Auditor | Trace champion to dataset/model/judge | Evidence contract is present after #4 | Partial success; verify exact default CI |
| R06 | Linux/Python 3.10 contributor | Run required suite | Declared matrix exists | Success at candidate evidence; default receipt missing |
| R07 | macOS/Python 3.11 contributor | Run required suite | Declared matrix exists | Success at candidate evidence; default receipt missing |
| R08 | Windows/Python 3.12 contributor | Run required suite | Declared matrix exists | Success at candidate evidence; default receipt missing |
| R09 | QA engineer | Remove a required evidence field | Should fail closed with diagnosis | Source/tests landed; exact-default verification pending |
| R10 | Researcher with noisy model | Avoid lucky single-run promotion | Current question remains open | Research #3; `NEEDS_EVIDENCE` |
| R11 | Cost-constrained evaluator | Add trials only near boundary | No approved default policy yet | Research #3; bounded simulator first |
| R12 | Holdout custodian | Prevent repeated feedback leakage | Risk is documented, not closed | Research #3; no build authorization |
| R13 | Browser UI user selecting Gemini | Generate with visible option | Default offers retired Gemini 1.5 IDs | P2; #7; `SOURCE_CONFIRMED` |
| R14 | Default MiniMax user | Continue existing default path | Gemini retirement does not block this route | No new defect; Red Team counterevidence |
| R15 | User with stale Gemini setting | Open settings after model retirement | Needs explicit reselection behavior | P2; candidate #15; live smoke pending |
| R16 | Offline evaluator | Validate without provider key | Needs documented zero-cost path | P2; #1; `SOURCE_CONFIRMED` |
| R17 | Privacy-conscious researcher | Keep prompts local | Local-first approach is promising | Maintain; deployment/data flow not fully audited |
| R18 | LAN user on owner network | Try mutating local UI remotely | Default loopback source fix landed | Partial success; real network acceptance pending |
| R19 | Malicious browser origin | Trigger evolution/proxy | Source tests say mutation is blocked/default loopback | Partial success; browser runtime pending |
| R20 | Authorized external-bind operator | Intentionally expose UI | Must configure smallest auth boundary | #12 closed in source; runtime contract needs proof |
| R21 | Support engineer | Explain failed promotion | Evidence diagnostics improved | Partial success; default receipt missing |
| R22 | Reviewer | Distinguish source from generated logs | Root boundary remains unclear | P2; #1 |
| R23 | CI administrator | Require all matrix cells | Aggregate gate exists and is fail-closed | Maintain; do not reduce without support-policy decision |
| R24 | Provider maintainer | Update a model lifecycle | Manual selector update is sufficient now | Fix #7 narrowly; no registry |
| R25 | Security reviewer | Prevent arbitrary provider proxy | Existing allowlist plus loopback fix | Partial; real runtime pending |
| R26 | Accessibility keyboard user | Configure and start a run | Not executed in this round | `UNKNOWN`; evidence backlog, no issue yet |
| R27 | Screen-reader user | Understand status/error messages | Not executed in this round | `UNKNOWN`; evidence backlog, no issue yet |
| R28 | Low-bandwidth user | Inspect artifacts without hosted UI | Files are available but entry contract weak | P2; #1 |
| R29 | Incident responder | Roll back bad champion | Architecture claims rollback/evidence | Runtime recovery not exercised; `UNKNOWN` |
| R30 | Owner reviewing cost | Compare candidate cost/latency | Evidence model supports fields, real baseline not re-run | Maintain; no invented ROI |
| E01 | Small team replacing spreadsheets | Automate prompt comparisons | Product can help only after onboarding is clear | Finish #1 before feature expansion |
| E02 | Regulated team | Keep evaluation data on premises | Local-first is attractive; governance not audited | Research only; no enterprise claims |
| E03 | Multilingual prompt owner | Compare non-English prompts | Dataset/language coverage not inspected | `UNKNOWN`; do not create issue without supported scope |
| E04 | API-only user | Run without browser | Python research path exists | Maintain; document canonical command in #1 |
| E05 | Browser-only analyst | Avoid Python setup | Static UI exists but provider lifecycle is stale | P2; #7 first |
| E06 | Team using LangSmith | Consider switching for local control | Would require clearer evidence portability | Qualitative simulated switching test only |
| E07 | Team using Promptfoo | Consider autonomous iteration | This product lacks equivalent mature entry docs | Differentiate on promotion/recovery, not breadth |
| E08 | DSPy researcher | Compare optimizers | Repository should not become a compiler framework | `DON'T`; bounded #3 evidence only |
| E09 | Braintrust customer | Export local evidence | No proven migration demand | Defer; do not build integration |
| E10 | TextGrad experimenter | Apply textual gradients | Novel optimizer is not current bottleneck | Defer; reliability first |
| E11 | Model-lifecycle operator | Remove a retired model quickly | Narrow selector/test patch is enough | #7; no registry/platform |
| E12 | Air-gapped reviewer | Inspect all receipts offline | Plausible if artifacts are documented | #1; verify before claiming |
| E13 | CI-limited fork maintainer | Run one supported lane | Current 9-cell policy may be expensive | Minority view; separate support-policy evidence needed |
| E14 | Open-source contributor | Find a first issue | Missing README slows entry | P2; #1 |
| E15 | Product manager | Compare prompt variants visually | UI exists, but dead provider choice harms trust | #7 before UI additions |
| E16 | Reliability researcher | Estimate stochastic variance | #3 defines a bounded simulation | `NEEDS_EVIDENCE`; no fixed N/p-value invented |
| E17 | Data curator | Rotate hidden holdout | Governance question is open | #3/#6; no implementation approval |
| E18 | Legal/policy reviewer | Audit hidden legal anchors | #6 already owns the question | Research only; do not expose hidden set |
| E19 | Mobile reviewer | Inspect experiment status | Mobile flow not tested | `UNKNOWN`; no issue absent supported scope |
| E20 | Maintainer under time pressure | Choose only three changes | Dead-model fix, root contract, verification receipts | CEO priority; no platform expansion |

### Synthetic switching test

Pure model simulation: a technically advanced solo researcher could prefer Promptfoo for mature configuration/CI, DSPy for optimizer research, or LangSmith/Braintrust for hosted collaboration. `prompt-autoresearch` is only the plausible choice when local evidence, autonomous iteration and explicit promotion/rollback are more important than ecosystem breadth. No percentages are reported because these are not users and not a market sample.

## Red Team / falsification

1. **“The evidence system is still broken.”** Counterevidence: #4's code and required matrix repair landed, and candidate exact-head CI was green. Remaining exact-default evidence prevents full verification but does not establish a current broken product.
2. **“The local UI remains remotely exploitable.”** Counterevidence: #12's loopback/default authorization change is on default and focused tests passed. Real network/browser acceptance is absent, so the honest state is `PARTIALLY_FIXED`, not a new P1.
3. **“Missing README proves the product cannot run.”** Rejected: it proves onboarding/operability friction, not that core execution fails. Keep #1 P2.
4. **“Gemini retirement breaks every user.”** Rejected: the supported MiniMax/default and other provider selectors are separate; impact is the reachable Gemini path. Keep #7 P2, not P1.
5. **“A model registry is required.”** Rejected: the smallest safe fix is to update the existing selector, reject stale IDs and pin request construction tests. A registry/router is over-engineering at current scale.
6. **“Competitors have hosted dashboards, so one is required.”** Rejected: no user evidence shows dashboard breadth is the bottleneck; hosted storage adds cost/privacy work.
7. **“Repeated evaluation must be built now.”** Rejected: #3 correctly requires deterministic known-noise simulation, bounded canaries and a BUILD/NARROW/REJECT exit. Research does not authorize the architecture.
8. **“Green PR CI means runtime is fixed.”** Rejected: matrix tests do not exercise real Gemini credentials, browser-origin/network exposure or owner-machine deployment.

## Findings and issue mapping

| Finding fingerprint | Kind / severity / priority | Triage | Tracking / action |
| --- | --- | --- | --- |
| `prompt-autoresearch + Gemini selector + retired 1.5 IDs + generateContent` | BUG / P2 / NOW | NEEDS_REVIEW | Existing [#7](https://github.com/Reese-max/prompt-autoresearch/issues/7), draft [PR #15](https://github.com/Reese-max/prompt-autoresearch/pull/15); no duplicate Issue |
| `prompt-autoresearch + root contract + canonical config/artifact/recovery ambiguity` | MAINTENANCE / P2 / NOW | NEEDS_REVIEW | Existing [#1](https://github.com/Reese-max/prompt-autoresearch/issues/1), [PR #2](https://github.com/Reese-max/prompt-autoresearch/pull/2) |
| `prompt-autoresearch + best-version evidence + exact default receipt unavailable` | VALIDATION_GAP / NOT_ESTABLISHED / NEXT | NEEDS_EVIDENCE | #4 closed; record `PARTIALLY_FIXED`, do not reopen without reproduced failure |
| `prompt-autoresearch + local UI trust boundary + no real network acceptance` | VALIDATION_GAP / NOT_ESTABLISHED / NEXT | NEEDS_RUNTIME_VERIFICATION | #12 closed; record `PARTIALLY_FIXED`, do not reopen without reproduced failure |
| `prompt-autoresearch + stochastic promotion + single-run uncertainty/holdout reuse` | RESEARCH / NOT_ESTABLISHED / NEXT | NEEDS_EVIDENCE | Existing #3 / PR #14; bounded research only |
| `prompt-autoresearch + prompt complexity/compaction` | RESEARCH / NOT_ESTABLISHED / LATER | NEEDS_EVIDENCE | Existing #5; no product build |
| `prompt-autoresearch + hidden legal-anchor audit` | RESEARCH / NOT_ESTABLISHED / LATER | NEEDS_EVIDENCE | Existing #6; preserve holdout secrecy |

Write accounting: Issues created 0; Issues updated/reopened 0; issue comments 0; findings deduplicated 7; rejected/downsized proposals 5; verified fixes 0; partially fixed 2; runtime-pending 3; report-only write 1. No issue lease was acquired because no Issue was modified.

## NOW / NEXT / LATER / DON'T

### NOW

1. Review #7/PR #15 as a narrow provider-selector correction. Re-check official lifecycle at merge time and require an explicitly authorized bounded provider smoke before declaring runtime restored.
2. Review #1/PR #2 so a new operator can identify canonical configuration, outputs, dry-run, budgets and stop/resume behavior without guessing.

### NEXT

1. Obtain an exact-default-commit CI receipt for `01dc864…` or a later product HEAD before promoting #4 from `PARTIALLY_FIXED` to `VERIFIED_FIXED`.
2. Execute a bounded authorized browser/network acceptance for #12, including negative mutation attempts with zero subprocess/provider side effects.
3. Continue #3 only through its known-noise simulator and explicit cost/holdout boundaries.

### LATER

- Decide #5/#6 after their bounded evidence returns BUILD, NARROW or REJECT.
- Evaluate accessibility/mobile only after confirming those are supported product surfaces; absence of evidence is not yet a defect.

### DON'T

- Do not build a cross-provider registry, fallback router, hosted observability platform, generic dataset service or distributed worker.
- Do not use live paid providers to satisfy a static audit without explicit authorization and hard limits.
- Do not treat synthetic persona preference, competitor claims, CI green, issue closure or merged diffs as user benefit/runtime verification.

## Decision memo

- **Who is served:** a technical, evidence-conscious prompt researcher or maintainer who values local control, bounded spend and traceable promotion decisions.
- **Why choose it:** autonomous iteration with evidence/holdout/rollback concepts in one small repository. Choose mature alternatives when team collaboration, production observability or broad red teaming is the actual job.
- **Differentiation:** make every champion change explainable and recoverable without requiring a hosted platform.
- **Top three priorities:** (1) remove dead provider choices, (2) finish the root operator contract, (3) close exact-default and real-runtime evidence gaps.
- **Do not build / delete:** do not add platform infrastructure. Remove retired model choices and de-emphasize any generated artifacts that look canonical but are not.
- **Main risks:** false promotion under stochastic noise, holdout leakage, paid-provider cost, stale model lifecycle, and overclaiming CI as runtime proof.
- **Minimum experiments:** deterministic variance simulator; one authorized bounded Gemini smoke after lifecycle review; one isolated browser/network boundary acceptance. Stop with REJECT/NARROW if costs or evidence do not support expansion.
- **Portfolio recommendation:** `MAINTAIN + SIMPLIFY`. `INVEST` only after current reliability/onboarding work shows repeated use; no evidence supports `MERGE`, `REPOSITION`, `PAUSE` or `ARCHIVE` now.

## Completion and limitations

- No new actionable root cause passed all four issue gates; existing tracking is sufficient.
- No product files, CI/config, secrets, permissions, repository settings, implementation branches, workers, GOALs, merges or deployments were changed.
- No real provider credential, paid call, production data or failure injection was used.
- `CLEAN=false`: open P2 work remains, runtime verification is incomplete, and this incremental 50-persona exercise is not the fixed A01–J05 audit nor two consecutive complete clean rounds.
- Next fair deep-review cursor: `lobsterpulse` unless a real P0/P1/default-branch regression preempts it.
