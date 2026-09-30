# External Competitive / New Product / Workflow Inspiration Radar — 2026-09-11 r6

## Executive Summary

本輪重新掃描 Reese-max 目前 **37 個未封存、可視為產品的 repositories**，先核對 repository inventory、近期 commits、既有 Competitive Inspiration / Feature / Research Issues 與 `autodev-ng` PR，再以 GitHub 之外的公開網路作為主要競品來源。

本輪達到正式立案與通知門檻的新機會只有一項：

- **`autodev-ng #21` — Execution Environment Contract + Cloud↔Local Handoff Receipt**
- Opportunity Score: **94/100**
- 核心問題：`autodev-ng` 已有 multi-engine、worktree、Git common-dir SQLite、cost/review/evidence，但 execution state 仍以 local host / `projectPath` / `dataDir` / CLI login 為中心；市場在 2026-09-10 同時出現 Cursor Projects、OpenAI Agents API 等「agent harness 與 execution environment 解耦」的新產品形狀。
- 核心原則：**`shared context != shared runtime`；`same repo != same executable environment`；`handoff succeeded != resume verified`。**
- 正確方向不是立刻搬到某個 cloud provider，而是先建立 provider-neutral `EnvironmentRequirement → EnvironmentObservation → HandoffBundle → Target Read-back → Resume/HandoffReceipt`。

本輪另外確認兩個重要但不另立 Issue 的訊號：

1. `ai-flight-radar` 已加入 guarded Cloudflare Workers/D1 port，但 live collector / production notification 仍未自動啟用。這讓「portfolio 同時存在 local-first 與 managed/cloud execution」從外部趨勢變成內部現況；應優先共用 execution-environment truth contract，而不是每個產品各自發明 cloud/local 狀態。
2. Cloudflare 現在同時成為 Cursor self-hosted machine 與 OpenAI Agents API 的 execution layer，說明未來 agent loop、identity、state、compute、browser/filesystem 可能由不同供應者承擔。這強化 `autodev-ng #12` / `#17` / 本輪 `#21` 需要互相引用但不能合併權責。

---

## Portfolio Snapshot / Product → Market Category

目前 inventory 維持 37 個產品型 repositories：

`cf-ai-router`, `soundbox-offline`, `police-exam-archive`, `skill-foundry`, `prompt-autoresearch`, `lobsterpulse`, `tick-stock-panel`, `clinical-scribe-worker`, `adng-memory`, `avatar-vfo`, `ai-flight-radar`, `note-filler`, `taiwan-intel-dashboard`, `cyber-prep-coach`, `UkePack`, `autodev-ng`, `ai-novel-workstation`, `herdr-skills`, `video-timeline-pipeline`, `chatgpt-dual-pipeline`, `claude-mem`, `lplrs-judicial-sync`, `internship-notes-sites-mirror`, `MaterialYouNewTab`, `taichung-police-intel`, `ninax-line-hermes`, `project-doctor-web`, `92-duty-scheduler`, `voice-actress`, `flux-image-gen`, `neciken-summer-poem`, `minideck`, `ppt-studio`, `police-exam-practice`, `exam-archive`, `academic-mcp`, `cf-mcp-server`。

市場類別大致分為：

- **Agent / developer infrastructure:** `autodev-ng`, `cf-ai-router`, `cf-mcp-server`, `skill-foundry`, `herdr-skills`, `prompt-autoresearch`, `claude-mem`, `adng-memory`, `lobsterpulse`, `project-doctor-web`, `chatgpt-dual-pipeline`。
- **Evidence / intelligence / research:** `academic-mcp`, `taichung-police-intel`, `taiwan-intel-dashboard`, `lplrs-judicial-sync`, `video-timeline-pipeline`。
- **Exam / learning:** `police-exam-archive`, `police-exam-practice`, `exam-archive`, `cyber-prep-coach`, `voice-actress`。
- **Scheduling / operational workflow:** `92-duty-scheduler`, `ninax-line-hermes`, `note-filler`。
- **Creative / media:** `flux-image-gen`, `UkePack`, `ai-novel-workstation`, `ppt-studio`, `minideck`, `neciken-summer-poem`, `avatar-vfo`, `soundbox-offline`。
- **Consumer / productivity web:** `MaterialYouNewTab`, `internship-notes-sites-mirror`。
- **Market / travel:** `tick-stock-panel`, `ai-flight-radar`。
- **Clinical:** `clinical-scribe-worker`。

---

## Recent Internal Change Since r5

### `ai-flight-radar` — Cloudflare port becomes a concrete execution-locality signal

**CONFIRMED — GitHub, 2026-09-11**

Commit `f2dac801066edc8b6ed0107bf475cb562bdaceb7` adds a Cloudflare Workers/D1 port with read APIs, role-scoped writes, bounded collector, additive D1 schema, Wrangler dry-run/local D1 checks and guarded/manual deployment workflow. Repository evidence explicitly does **not** claim a live account/database, paid plan, live search source or notification provisioning; collector remains disabled by default.

Product implication: this is a good example of why “code can deploy to Cloudflare” and “a task can be safely resumed there with equivalent runtime authority” are different claims.

### `autodev-ng` — still local-host centric; execution environment not first-class

**CONFIRMED — GitHub, checked 2026-09-11**

README currently describes:
- local engineering-team mode;
- Git common-dir SQLite for claims/cost/merge;
- host `dataDir` for `run.db`, heartbeat, events, learnings/evidence;
- config rooted in `projectPath`, `backlogFile`, `dataDir`, `worktreesDir`;
- Windows + Node 22 as current primary deployment/CI path;
- multiple CLI engine adapters whose presence does not prove the host is logged in/usable.

No current default-branch contract was found that independently describes/attests target execution environment, required local-only capabilities, target read-back facts, or cloud↔local continuation receipt.

### Coordination state

- `autodev-ng #12`: egress / external-effect firewall.
- `autodev-ng #17`: Agent Principal / Credential Lease.
- `autodev-ng #11`: steer/queue exact execution semantics.
- `autodev-ng #13`: Windows full-regression gate remains OPEN.
- `autodev-ng PR #20`: delivery-health + research-to-experiment handoff; not execution-environment handoff.
- New `autodev-ng #21`: environment / handoff contract only; research-first.

---

# External Signals

## Signal A — Direct competitor strategy: Cursor Projects makes cloud↔local a single project workflow

**Classification:** CONFIRMED  
**Date:** 2026-09-10  
**Source:** https://cursor.com/changelog/projects

Cursor Projects targets feature/migration/app-scale work. A project gets its own cloud computer so work can continue after the laptop closes. The coordinator itself plans/delegates rather than writing code; when testing requires the user’s own machine it can start a local agent. Project context files are shared across cloud/local agents, including research/artifacts and codebase instructions learned over time.

### 1) Job-to-be-Done
Keep a large body of engineering work moving for hours/days without tying it to one laptop, while still using local resources when they are the only place a test can run.

### 2) Why users may perceive fewer steps / more reliability
- less repeated agent onboarding;
- no manual “pause cloud → paste status into local chat” step for ordinary handoff;
- project artifacts and learned context live beyond one agent invocation;
- laptop availability is no longer equal to task availability.

### 3) Onboarding / distribution
Cursor keeps cloud/local under the same Project surface instead of asking users to operate a separate cloud IDE.

### 4) New capability pattern
`Coordinator + durable project state + cloud worker + local capability fallback`.

### 5) Pricing / business model signal
No pricing claim is used here as product-effect evidence. The strategic signal is that persistent cloud execution becomes part of the coding-agent product surface rather than a separate DevOps setup.

### 6) Limits / failure points
Cursor’s claims about very large subagent counts are vendor claims. Shared context still does not prove identical runtime tools, credentials, networks or filesystem state.

### 7) Reese-max: absorb vs do not copy
**Absorb:** one task identity can target different locality, but each handoff must preserve state/evidence.  
**Do not copy:** do not default every desktop task to cloud or infer runtime equivalence from synced context.

---

## Signal B — Adjacent transferable architecture: OpenAI Agents API separates harness from environment

**Classification:** CONFIRMED  
**Date:** 2026-09-10  
**Source:** https://openai.com/index/introducing-the-agents-api/

OpenAI Agents API public beta explicitly separates managed agent harness/session from execution environment. Developers can choose OpenAI-managed sandbox, their own infrastructure, or partner environments including Blaxel, Cloudflare, Daytona, DigitalOcean, E2B, Modal, Oracle, Runloop and Vercel. OpenAI’s own description treats file/secret storage, CPU/GPU/memory, cold-start, deployment model and cost profile as environment-specific choices.

### 1) Job-to-be-Done
Run long-lived agents with durable context/files/intermediate results without every developer rebuilding session management and sandbox infrastructure.

### 2) Why users save steps
One session API can keep the harness stable while execution backend changes.

### 3) Onboarding / distribution
Environment choice is a parameterized product concept rather than “rewrite the agent for each VM vendor.”

### 4) New capability pattern
`Agent harness contract != compute/storage environment contract`.

### 5) Business-model signal
Providers compete on storage, compute shape, cold-start and cost rather than only model quality. Execution backend therefore becomes a product-routing decision.

### 6) Limits
OpenAI product/customer quotes are not independent proof of performance. Vendor environments also do not automatically share identity, secrets, network policy or installed tools.

### 7) Reese-max: absorb vs do not copy
**Absorb:** provider-neutral environment descriptor + adapter boundary.  
**Do not copy:** do not turn `autodev-ng` into an Agents API-specific client or make cloud execution the correctness source of truth.

---

## Signal C — Emerging execution layer: Cloudflare supports both Cursor and OpenAI agent compute

**Classification:** CONFIRMED  
**Dates:** 2026-09-02 / 2026-09-10  
**Sources:**
- https://developers.cloudflare.com/changelog/product/sandbox/
- https://developers.cloudflare.com/sandbox/guides/openai-agents-api/
- https://www.cloudflare.com/en-in/press/press-releases/2026/cloudflare-expands-support-for-ai-coding-agents-with-cursor-cloud-agents-on-cloudflare-sandboxes/

Cloudflare now demonstrates two independent orchestration systems using customer-controlled Cloudflare Sandboxes:
- Cursor keeps inference/planning/agent loop while commands/files/browser run on a self-hosted worker target.
- OpenAI manages sessions/orchestration/context while Cloudflare container can provide executor runtime.

### JTBD
Organizations want familiar agent products while controlling where code, tools and secrets actually execute.

### New pattern
Execution target can become a named/routable infrastructure primitive below the agent product.

### Reese-max take
`autodev-ng` should not imitate Cloudflare infrastructure. It should be able to **describe** whether a target is suitable, what it can prove, and what changes if an execution moves there.

---

# Community Pain Points

These are **COMMUNITY_SIGNAL only** and are not market statistics.

## Cursor default-to-cloud frustration
**Date:** 2026-08-24  
https://www.reddit.com/r/cursor/comments/1vx195v/why_are_we_now_defaulting_to_cloud_env_on_new/

A user objects to new chats defaulting to cloud. Discussion highlights locality as affecting file state, credentials, latency, accessible resources and cost. Product implication: environment choice is consequential enough to need an explicit, inspectable state — a badge after execution starts is not sufficient evidence.

## Cursor cloud→local handoff problem after repo identity drift
**Date:** 2026-06-30  
https://www.reddit.com/r/cursor/comments/1uk2z2y/cloud_agent_move_to_local/

A user reports cloud→local transfer controls becoming unusable after renaming the repository without updating the local origin; they recover after correcting origin/restarting/creating another agent. This single anecdote supports a narrow engineering lesson: repository identity and exact source state belong in handoff verification.

## Cursor cloud cost / hidden-runtime attribution complaints
**Dates:** 2026-06-19 and 2026-08  
Representative sources:
- https://www.reddit.com/r/cursor/comments/1ua9nfx/cursors_hidden_billing_on_cloud_agent/
- https://www.reddit.com/r/cursor/comments/1vlynfq/cursor_cloud_is_insanely_not_cheaper/

Users report cloud execution consuming more/other model usage than expected or being uneconomic for their workload. These reports are anecdotal and account-specific. Transferable lesson: environment candidate should expose **cost class / model-runtime dependency / budget reference** rather than treating locality as only a technical choice.

---

# New Releases / Strategic Movement

## Cursor Projects — 2026-09-10
Major strategy shift: project-scale persistent orchestration, cloud computer, local agent fallback, shared context and subscription-style triggers now live in the coding-agent product itself.

## OpenAI Agents API — 2026-09-10
Major platform shift: long-running agent harness is now exposed with selectable runtime backends. The partner list makes environment portability a first-class ecosystem surface.

## Cloudflare OpenAI Agents API integration — updated 2026-09-10
New infrastructure possibility: hosted agent session and executor can be from separate vendors.

## Cloudflare Cursor self-hosted sandbox support — 2026-09-02
Recent proof that the same Cursor workflow can route tool execution into customer-controlled isolated infrastructure.

---

# Adjacent Ideas

1. **Execution Environment Receipt** — high value; created `autodev-ng #21`.
2. **Local-only capability declaration** — browser login, LAN service, hardware/device, Windows-only app should be typed requirements instead of tribal knowledge; belongs to #21.
3. **Cost-aware environment candidate** — environment preview includes cost class/budget ref; should consume existing cost ledger rather than add a new billing system.
4. **Installed-skill digest as environment fact** — future `skill-foundry #4` InstallReceipt can become one field in `EnvironmentObservation`; no duplicate installer.
5. **Principal continuity** — #17 principal/credential lease should survive/resume as exact lineage, not be reminted because locality changed.
6. **Effect policy continuity** — #12 DENY must remain DENY after cloud/local migration; environment cannot be an authorization shortcut.
7. **Artifact-only return path** — some remote work can return immutable artifacts/diffs without resuming full session; simpler and safer than stateful handoff for many tasks.
8. **Preflight before expensive provisioning** — static requirements can reject impossible target before spinning a paid sandbox.
9. **Environment drift diff** — show Node/CLI/Skill/policy/repo/network differences before resume; prefer diff over a generic “ready” badge.
10. **Unknown-first adapter registry** — unsupported providers should return UNKNOWN/UNVERIFIED instead of silently inheriting generic cloud assumptions.

---

# Opportunity Score

## 1. `autodev-ng` — Execution Environment Contract + Handoff Receipt
**94/100 — CREATE #21**

- User Pain: 9/10
- Strategic Fit: 10/10
- Novelty: 9/10
- Evidence Strength: 10/10
- Reuse Potential: 10/10
- Implementation Effort controllability: 8/10
- Security/Privacy/Cost Risk controllability: 8/10

Why high value: it sits below multiple engines/providers, directly targets repeated setup/copy/reconciliation work, and can start as a no-cloud schema/read-back project. It also prevents false portability claims.

## 2. `ai-flight-radar` — generalize Workers/D1 port into portfolio cloud-runtime framework
**78/100 — REJECT / DO NOT GENERALIZE YET**

Reason: current port is product-specific and guarded; turning it immediately into a generic framework would create architecture before repeated evidence. Consume #21 contract later instead.

## 3. `autodev-ng` — automatically choose cheapest cloud/local environment
**71/100 — RESEARCH LIST ONLY**

Reason: optimization without trustworthy environment equivalence creates late failures and cost surprises. First prove requirements/observations/receipts.

## 4. Portfolio-wide remote desktop/session replication
**63/100 — REJECT**

Reason: secrets, browser/session state, platform-specific apps and privacy make generic replication too risky. Prefer explicit local-only capability and artifact handoff.

---

# Opportunity Map — 37 Products

> The map is incremental: r5 conclusions remain unless explicitly changed here. Each row still contains all five required lenses.

| Product | Market | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|---|
| `autodev-ng` | multi-agent engineering control plane | durable task/evidence, safe concurrency | **typed environment + verified handoff** | provider-neutral multi-engine + receipts | cloud/local adapters after #21 research | cloud-first silent migration / vendor scale claims |
| `cf-ai-router` | AI gateway/router | model lifecycle/fallback truth | lifecycle canary before retirement | legal/free/subscription pool + fail-closed cost | environment-aware route only if runtime matters | opaque paid fallback |
| `cf-mcp-server` | managed MCP/control plane | typed tools/auth/audit | principal/effect/environment facts stay separate | Cloudflare-oriented controlled MCP | consume #12/#17/#21 primitives | generic “trusted cloud = trusted action” |
| `skill-foundry` | Skill R&D/certification | eval/security/runtime compatibility | certified revision → verified install | evidence-first Skill lifecycle | InstallReceipt can feed #21 environment facts | marketplace breadth before trust |
| `herdr-skills` | agent coordination/learning skills | candidate ≠ active | correction→candidate evidence | privacy-preserving reflect/promotion | environment-scoped skill applicability | raw-session auto-learning |
| `prompt-autoresearch` | prompt/research optimization | reproducible experiment | environment/toolchain captured with result | evidence-backed iterative search | remote experiment workers later | self-feedback-only improvement |
| `claude-mem` | coding-agent memory | recall/provenance | memory portability without authority inflation | local/persistent memory | memory digest in environment observation | memory = permission/compliance |
| `adng-memory` | operational memory/evidence | lifecycle/retention/recovery | portable snapshot identity | audit-oriented memory store | handoff receipt archive | unlimited opaque log accumulation |
| `lobsterpulse` | portfolio/ops pulse | actionable status | distinguish environment-blocked vs code-blocked | cross-project attention surface | environment drift alert | rebuild orchestration engine |
| `project-doctor-web` | project diagnostics | reproducible checks | detect host/environment assumptions | simple diagnostic surface | generate EnvironmentRequirement candidate | auto-fix with unproven runtime |
| `chatgpt-dual-pipeline` | docs/site pipeline | portable verification | host-independent runtime contract | de-identification + publish verification | artifact handoff receipts | one-machine absolute path assumptions |
| `academic-mcp` | academic research MCP | source provenance / identity | bundle replay/diff | 81-tool private gateway + canonical research bundle | research bundle execution env fingerprint | add source count without reconciliation |
| `taichung-police-intel` | public-sector intelligence | evidence/source freshness | agent-ready transport without dual truth | government/public-source provenance | WebMCP/MCP same contract | unverified social signal as fact |
| `taiwan-intel-dashboard` | intelligence dashboard | current-source traceability | typed agent/web access | Taiwan-focused fused brief | same EvidenceEnvelope across surfaces | generic news-feed breadth |
| `lplrs-judicial-sync` | legal/judicial sync | source/version identity | cross-source refresh receipts | legal provenance + local sync | canonical observation bundle | silent law/version merge |
| `video-timeline-pipeline` | media intelligence | timestamp/source provenance | evidence→editable handoff | evidence-backed CutSpec | remote media analysis only with environment truth | full NLE clone |
| `police-exam-archive` | exam archive | source/page/image traceability | mobile-first embedded evidence | police-exam provenance | research bundle pattern for question source | feature-mode sprawl |
| `police-exam-practice` | exam practice | uninterrupted practice | strong explanations + review | police-specific practice workflow | cross-device state receipt | LMS/paywall breadth |
| `exam-archive` | generic exam archive | canonical source/index | simple find/practice handoff | reusable archive primitives | bundle revision/diff | duplicate per-exam tooling |
| `cyber-prep-coach` | cybersecurity exam coaching | trustworthy explanation | calibration/evidence before tutor breadth | targeted iPAS coaching | verified capability record later | generic AI tutor surface explosion |
| `voice-actress` | police/legal essay grading/TTS | rubric + quote evidence | rubric revision bound to scoring receipt | Taiwan police/legal essay focus | section-scoped revision | generic LMS / billing breadth |
| `92-duty-scheduler` | duty scheduling | deterministic rules/identity | post-publish request lifecycle | privacy-aware school/police scheduling | LINE thin adapter | HR/payroll/chat suite |
| `ninax-line-hermes` | LINE agent/integration | verified identity/session | effect/request state receipts | Taiwan messaging workflow | consume #12/#17 contracts | client-sent profile as auth |
| `note-filler` | structured note automation | template correctness | explicit source/field provenance | constrained filling workflow | environment-readiness preflight for desktop automation | free-form overwrite |
| `clinical-scribe-worker` | clinical scribe | auth + clinical traceability | section-scoped repair/version receipt | minimal repair blast radius | execution environment only after auth gate | autonomous clinical action |
| `flux-image-gen` | image generation | provider/model/provenance | source/reference evidence | provenance-aware image workflow | provider lifecycle + environment facts | authenticity overclaim |
| `avatar-vfo` | avatar/media workflow | reproducible asset pipeline | model/runtime migration evidence | bounded creative pipeline | environment-aware GPU candidate | auto-upgrade model behavior silently |
| `UkePack` | music/creative project | project continuity/export | reviewable AI assistance | canonical editable session | reversible agent edits | full DAW replacement |
| `ai-novel-workstation` | long-form writing | versioned canonical manuscript | candidate edits/revision diffs | long-form evidence/state workflow | record/replay bounded workflow | opaque auto-rewrite |
| `ppt-studio` | presentation production | editable export | candidate patch + exact diff | structured production handoff | verified export/import receipt | image-only slide output |
| `minideck` | lightweight slides | fast structured creation | portable editable result | minimal deck surface | common slide artifact contract | enterprise presentation suite |
| `neciken-summer-poem` | creative writing | preserve authored text/revisions | lightweight style candidates | bounded single-purpose creative experience | versioned candidate patch | agentic complexity |
| `soundbox-offline` | offline audio library | offline/local-first reliability | easier OS-level import | privacy/offline ownership | PWA share-target research | cloud account dependency |
| `MaterialYouNewTab` | browser new-tab/productivity | fast local navigation | unify search/actions/bookmarks | Material You local-first browser surface | command palette as Find Anything | broad invasive metadata permissions |
| `internship-notes-sites-mirror` | notes publishing | portable publish verification | explicit canonical repo handoff | internship knowledge mirror | artifact/source receipt | implicit local directory dependency |
| `tick-stock-panel` | market dashboard | coverage/freshness truth | entitlement/source receipt | concise market panel | governed data-source contract | enterprise finance breadth before trust |
| `ai-flight-radar` | airfare watch/alert | quote freshness/source health | complete trip/baggage truth | intent→watch with honest partial state | Cloudflare port can later consume #21 | auto-booking / premature generic cloud framework |

---

# Top 10 Cross-Portfolio Ideas

1. **Execution Environment Contract / Handoff Receipt** — #21; reusable by developer/automation products.
2. **UNKNOWN as first-class environment state** — no tool/login/network evidence means UNKNOWN, not READY.
3. **Local-only capability declaration** — explicit instead of forcing every workflow cloudward.
4. **Principal continuity across environment changes** — #17 lineage remains stable; locality does not mint identity.
5. **Effect policy continuity** — #12 decision independent of cloud/local.
6. **Installed artifact digest in runtime evidence** — bridge `skill-foundry #4` to actual execution facts.
7. **Cost-class visibility before handoff** — environment preview includes bounded cost implications.
8. **Artifact-first remote work mode** — return patch/report/media rather than full stateful session when possible.
9. **Environment drift diff** — show exact differences before resume, not a binary generic readiness badge.
10. **Provider adapters only after contract** — Cloudflare/E2B/OpenAI/etc. remain replaceable execution adapters.

---

# Ideas Rejected / Deferred

## REJECT — “Move autodev-ng to Cloudflare because Cloudflare is trending”
Why rejected: Cloudflare is strong evidence that execution layers are becoming modular, but `autodev-ng` has Windows/local-specific tooling and existing reliability gates. Provider selection before requirements would invert the architecture.

## REJECT — “Clone Cursor Projects and sync all context automatically”
Why rejected: syncing context does not solve credential/network/tool/local-device equivalence and may copy more sensitive state than needed.

## DEFER — Automatic cheapest-environment scheduler
Needs actual runtime/cost evidence first. A wrong cheap environment creates retries and can cost more.

## REJECT — Universal browser/login session migration
Raw cookies/browser state are high-risk and often provider/OS-specific. Prefer explicit local-only requirements or narrowly scoped credential leases.

## REJECT — Generic portfolio cloud abstraction from `ai-flight-radar` Workers/D1 port
One product port is not enough repeated evidence for a portfolio framework. Let #21 define the neutral contract first.

## REJECT — Use vendor performance claims as target KPIs
Cursor/OpenAI/Cloudflare claims about scale, latency or performance are not adopted as Reese-max expected improvements without independent/internal measurement.

---

# Issue Mapping

## CREATED

### `Reese-max/autodev-ng #21`
**Title:** `[Competitive Inspiration][RESEARCH_REQUIRED][RELIABILITY] 建立 Execution Environment Contract + Cloud↔Local Handoff Receipt，讓 long-running Agent 可驗證跨環境續跑`

**Fingerprint:** local Windows multi-engine orchestration + host-bound project/data/worktree/runtime assumptions + no versioned target-environment/read-back/handoff proof + market shift toward cloud/local selectable agent execution.

**Minimum deliverable:**
- versioned `EnvironmentRequirement`;
- target-produced `EnvironmentObservation`;
- secret-free `HandoffBundle`;
- explicit resume states including `ENVIRONMENT_MISMATCH / UNKNOWN / RESUMED_VERIFIED`;
- local→synthetic-cloud→local fixtures;
- exact repo/artifact/policy/toolchain read-back evidence.

**Dependencies:** #12, #17, #11; #13 remains reliability gate. No cloud account/prod secret needed for research phase.

**Runtime Verification:** synthetic mismatch/drift/secret/local-only/cost/effect fixtures before any real provider adapter is called production-ready.

## DUPLICATE / LOCK CHECK

Before creation:
- searched `autodev-ng` open/closed Issues for `cloud`, `local`, `environment`, `handoff`;
- searched all-state `autodev-ng` PRs for environment/handoff fingerprint;
- checked cross-Reese-max `handoff` Issue results;
- `#17` owns principal/credential lifecycle, not execution environment;
- PR #20 uses “handoff” for research/ops documentation, not runtime continuation;
- no matching fingerprint / competing implementation issue was found.

No `github-issue-lock:v1` was claimed by this radar; this remains research-first.

## NOT CREATED

- `ai-flight-radar`: Cloudflare runtime generalization — insufficient repeated internal evidence, existing roadmap should remain primary.
- portfolio-wide cloud scheduler — premature until environment truth contract exists.
- Cursor-style Project clone — overlaps existing orchestration but would add UI/product breadth rather than solve the runtime-verification gap.

---

# Sources

## First-party / primary product sources
1. Cursor — **Cursor Projects**, 2026-09-10  
   https://cursor.com/changelog/projects
2. OpenAI — **Introducing the Agents API**, 2026-09-10  
   https://openai.com/index/introducing-the-agents-api/
3. Cloudflare — **Run Codex with Cloudflare Containers using the OpenAI Agents API**, updated 2026-09-10  
   https://developers.cloudflare.com/sandbox/guides/openai-agents-api/
4. Cloudflare Sandbox SDK Changelog — Cursor self-hosted machines, 2026-09-02  
   https://developers.cloudflare.com/changelog/product/sandbox/
5. Cloudflare press release — Cursor Cloud Agents on Cloudflare Sandboxes, 2026-09-02  
   https://www.cloudflare.com/en-in/press/press-releases/2026/cloudflare-expands-support-for-ai-coding-agents-with-cursor-cloud-agents-on-cloudflare-sandboxes/
6. Cloudflare — Dynamic Worker Loader / sandboxing agents, 2026  
   https://blog.cloudflare.com/dynamic-workers/

## Community / anecdotal
7. r/cursor — defaulting new chats to cloud, 2026-08-24  
   https://www.reddit.com/r/cursor/comments/1vx195v/why_are_we_now_defaulting_to_cloud_env_on_new/
8. r/cursor — cloud agent move to local, 2026-06-30  
   https://www.reddit.com/r/cursor/comments/1uk2z2y/cloud_agent_move_to_local/
9. r/cursor — cloud usage/billing complaint, 2026-06-19  
   https://www.reddit.com/r/cursor/comments/1ua9nfx/cursors_hidden_billing_on_cloud_agent/
10. r/cursor — local vs cloud economics anecdote, 2026-08  
    https://www.reddit.com/r/cursor/comments/1vlynfq/cursor_cloud_is_insanely_not_cheaper/

Community sources are retained only as `COMMUNITY_SIGNAL`; none is used as failure-rate, adoption-rate or ROI evidence.

---

# What Changed Since Last Radar (r5 → r6)

1. **New high-value opportunity:** `autodev-ng #21` created, score 94/100.
2. **Major external strategy shift:** Cursor Projects (2026-09-10) makes persistent cloud project + local-agent fallback a first-class product workflow.
3. **Major platform shift:** OpenAI Agents API (2026-09-10) makes execution environment an explicit selectable layer beneath the agent harness.
4. **Emerging infrastructure cross-check:** Cloudflare now services both Cursor self-hosted agents and OpenAI Agents API execution, strengthening the evidence that agent product and compute locality are decoupling.
5. **Internal confirmation:** `ai-flight-radar` added a guarded Cloudflare Workers/D1 port on 2026-09-11, so Reese-max now has a fresh internal example where deployability and runtime-equivalence must not be conflated.
6. **No duplicate feature inflation:** no separate cloud scheduler, generic Cloudflare framework or auto-offload Issue created.
7. **Portfolio map remains 37 products**; Opportunity Map updated so every product continues to carry MUST MATCH / SHOULD BE BETTER / DIFFERENTIATOR / ADJACENT IDEA / DO NOT COPY.
8. **Cross-portfolio principle added:** `Task/Principal/Environment/Credential/Permission/Effect` are separate contracts; environment switching may change capability facts but must not widen authority.

---

## Final Portfolio Principle

**「工作可以移動」和「工作可以被可信地續跑」是兩件不同的事。**

下一層共用 primitive 應是：

`Task Intent → Environment Requirement → Candidate Environment → Handoff Bundle → Target Read-back → Compatibility Decision → Execute/Resume → Artifact/Evidence → Handoff Receipt`

而且：

`Owner ≠ Agent Principal ≠ Engine ≠ Execution ≠ Environment ≠ Credential ≠ Permission ≠ External Effect`

如果 target environment 無法證明必要工具、repo revision、policy、network、credential binding 或 local-only resources，正確結果是 `UNKNOWN / ENVIRONMENT_MISMATCH / LOCAL_ONLY`，不是為了讓 Agent 繼續跑而猜測相容。