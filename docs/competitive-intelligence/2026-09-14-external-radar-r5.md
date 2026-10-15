# External Competitive / Product / Workflow Inspiration Radar — 2026-09-14 r5

> Scope: Reese-max owned, unarchived repositories that are product-like. Public web is the primary market-evidence source; connected GitHub is used for repository purpose/recent-change checks, duplicate/lock coordination, Issue/PR mapping, and this central report.
>
> Portfolio count checked this round: **38 owned + unarchived repositories; 36 treated as product-like.** `adng-memory` and `internship-notes-sites-mirror` remain coordination/support references. `spotify-playlist-organizer-mcp`, which was empty in the previous radar, now has an inspectable implementation and is included as a product for the first time.
>
> Evidence labels: **CONFIRMED** = first-party product/docs/release information or directly inspectable current repository state; **LIKELY** = reasonable inference that still needs runtime/policy validation; **COMMUNITY_SIGNAL** = anecdotal user report only; **UNKNOWN** = insufficient evidence or outcome must be measured.
>
> Safety boundary: no product source code, implementation branch, merge, deploy, secrets, permissions, repository settings, or production runtime configuration were changed in this round.

---

## Executive Summary

This round found a **portfolio-direction-changing constraint** in the newly active `spotify-playlist-organizer-mcp`.

The repository was created on 2026-09-14 and currently exposes Spotify search, identification, playlist read/classification, duplicate detection, and explicit preview/apply organization through MCP. The current server serializes Spotify-derived track/playlist data into MCP tool responses.

Spotify's current first-party Developer Policy and Developer Terms contain a broader restriction than merely “do not train on Spotify data”: they prohibit using Spotify Platform / Spotify Content to train an AI model **or otherwise ingest Spotify Content into a machine-learning or AI model**. Current Web API reference pages repeat the same AI-content warning. Spotify also tightened Development Mode in 2026, explicitly citing automation/AI risk and limiting new Development Mode apps to Premium owners, one Client ID, five authorized users, and a smaller endpoint surface.

The policy text is **CONFIRMED**. Whether every MCP client implementation necessarily causes each tool result to be “ingested” into its model is **UNKNOWN / client-dependent**, but ordinary AI-client MCP usage makes model visibility sufficiently **LIKELY** that this cannot be treated as an approved boundary.

### New high-value Issue

Created:

- `Reese-max/spotify-playlist-organizer-mcp #1`
- **[Research][RESEARCH_REQUIRED] Spotify AI-content boundary + policy-compatible orchestration**
- Opportunity Score: **98/100**
- https://github.com/Reese-max/spotify-playlist-organizer-mcp/issues/1

The Issue defines a Phase-0 provider-data classification and runtime data-flow gate before adding more AI-facing Spotify capability.

### Strongest principle this round

`User Intent ≠ Provider Content ≠ Model-visible Context ≠ Effect Authority ≠ Verified Provider State`

The product should preserve the useful user job — “understand what I want to organize and safely apply it” — without assuming that provider-returned data may enter model context.

### Secondary opportunity, blocked behind #1

If the provider/AI boundary is confirmed compatible, the highest-value product enhancement is a **snapshot-safe durable PlaylistPolicy / PlanReceipt**:

`PlaylistPolicy → Source/Target Snapshot Set → Exact Proposed Delta → PreviewReceipt/PlanHash → Explicit Apply → Snapshot Recheck → Write → Read-back ApplyReceipt`

Spotify's Web API already exposes `snapshot_id` for playlist version/concurrency handling, while the current repository recomputes the live plan at `apply` time and performs whole-list replacement for matching derived playlists without binding the write to the previously reviewed preview. Soundiiz's current sync product demonstrates the market value of explicit Add vs Replace semantics, scheduled policies, and execution history — and its recovery docs also demonstrate why “history” must not be confused with “backup”.

Because #1 is a provider-policy blocker, this follow-up remains inside #1 instead of creating a second feature Issue.

---

# Portfolio → Market Category / Recent Change Check

| Repository | Market / product category | Current lens used this round |
|---|---|---|
| `exam-archive` | exam source archive / study data | provenance, revisions, archive→practice handoff |
| `police-exam-practice` | police exam practice / learning | official corpus, mastery loop, evidence-linked explanation |
| `police-exam-archive` | police exam archive / provenance | source authority, correction trail, denominator/data truth |
| `92-duty-scheduler` | duty roster / scheduling / LINE self-service | request lifecycle, human approval, published-roster truth, CI reliability |
| `UkePack` | MusicXML→ukulele practice pack | structured source→candidate pack, teacher review, export truth |
| `ppt-studio` | AI presentation editor/export | structured slide state, local patch, render/export verification |
| `voice-actress` | grounded legal/evidence QA | criterion evidence, rubric/source versioning, correction lineage |
| `taiwan-intel-dashboard` | multi-source intelligence dashboard | freshness, provenance, dedupe, changed-since-last |
| `autodev-ng` | AI SDLC / multi-engine agent orchestration | bounded autonomy, WIP/review pressure, receipts, reliability first |
| `flux-image-gen` | AI image generation/editing | candidate output, provenance/C2PA, cost/output receipt |
| `claude-mem` | persistent coding-agent memory | temporal truth/freshness, recall provenance, safe injection |
| `lobsterpulse` | monitoring / decision attention queue | signal freshness, dedupe, priority/attention budget |
| `prompt-autoresearch` | prompt optimization / autonomous research | repeated eval, judge cost, holdout/stability, compaction |
| `neciken-summer-poem` | creative writing / contest workflow | policy provenance, frozen revisions, candidate isolation |
| `note-filler` | structured notes/forms | claim/field candidate, review, staleness, canonical fields |
| `lplrs-judicial-sync` | judicial/public-data sync | authority revision/removal, exact source spans, sync health |
| `cyber-prep-coach` | iPAS cybersecurity exam coach | trusted corpus, adaptive review, explanation calibration |
| `cf-ai-router` | model routing / AI cost control | provider truth, failover evidence, fail-closed cost semantics |
| `avatar-vfo` | role/personality simulation | structured state, continuity regression, user isolation |
| `project-doctor-web` | project diagnostics / project health | findings→candidate remediation→review rather than blind mutation |
| `minideck` | compact slide/deck creation | editable artifact, version/share/rollback |
| `chatgpt-dual-pipeline` | multi-model / dual-pipeline workflow | explicit stage handoff, provenance, no duplicate truth |
| `taichung-police-intel` | public-sector intelligence monitor | official-first evidence, freshness, read-only distribution |
| `soundbox-offline` | offline/local media player | offline data plane, local library truth, sync boundaries |
| `skill-foundry` | skill creation/evaluation/distribution | candidate→evaluation→promotion, package/runtime receipts |
| `video-timeline-pipeline` | evidence→video/NLE automation | CutSpec, NLE handoff, capability/read-back, creative approval |
| `ai-novel-workstation` | long-form writing workstation | canonical story state, context routing, resumability, cost |
| `clinical-scribe-worker` | clinical documentation | section-scoped regeneration, revision/undo, clinical truth boundary |
| `MaterialYouNewTab` | browser new-tab/productivity dashboard | local/browser state, command surface, compatibility, privacy |
| `cf-mcp-server` | MCP / SaaS tool server | tool-contract drift, exact effect authority, runtime receipt |
| `tick-stock-panel` | stock/strategy analysis | point-in-time data, deterministic strategy, no live-trade leap |
| `herdr-skills` | agent skills / policy improvement | correction→candidate preference/skill, scoped promotion |
| `ninax-line-hermes` | LINE AI gateway / ordered messaging | revision/redelivery ordering, stale-answer invalidation |
| `ai-flight-radar` | flight intelligence / fare tracking | reviewed WatchSpec, scheduled collector, alert decision receipts |
| `academic-mcp` | scholarly retrieval / research-agent gateway | progressive tool exposure, source identity, research ledger |
| `spotify-playlist-organizer-mcp` | music playlist organizer / Spotify MCP | provider-policy boundary, deterministic intent/effect separation, snapshot-safe plan/apply |

## Recent connected-GitHub changes checked

- `spotify-playlist-organizer-mcp` moved from empty/UNKNOWN to an actual product implementation at commit `87c42846c275abae8baf0779a2b8e6b394ac8939` (`feat: add Spotify playlist organizer MCP server`).
- Its current implementation has six tools: catalog search, track identification, link resolution, duplicate checking, deterministic playlist classification, and preview/apply organization. `preview` is the default; `apply` explicitly writes only same-name derived playlists and does not mutate the source playlist.
- Current `apply` recomputes the classification from live provider state and replaces matching derived-playlist contents in chunks. No durable `plan_hash`, preview receipt, source/target `snapshot_id` binding, exact add/remove/retain diff, or write read-back receipt was found.
- `ai-flight-radar` has materially changed since the earlier WatchSpec radar: commit `ad95e723...` enabled the hourly Cloudflare collector after provider validation. This makes its existing `#4 Intent-to-WatchSpec` more operationally important: an active collector is still not equivalent to user-approved monitoring intent.
- `ppt-studio` and `92-duty-scheduler` received fresh product-board audits. Their existing P0/P1 reliability/security work remains more important than breadth expansion.
- No open/closed Issue or PR existed in `spotify-playlist-organizer-mcp` before creating #1; repository search also found no `github-issue-lock:v1` claim for this fingerprint.

---

# External Signals

## A0. Platform constraint — Spotify's AI-content policy may invalidate a normal model-visible Spotify MCP read surface

**CONFIRMED policy text / LIKELY product-boundary conflict — current policy checked 2026-09-14**

First-party sources:
- Spotify Developer Policy, effective 2025-05-15: https://developer.spotify.com/policy
- Spotify Developer Terms v10, effective 2025-05-15: https://developer.spotify.com/terms
- Current Web API reference policy note: https://developer.spotify.com/documentation/web-api/reference/get-several-tracks
- 2026-02-06 Developer Access / Platform Security update: https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security
- Current quota modes: https://developer.spotify.com/documentation/web-api/concepts/quota-modes
- 2026 migration guide: https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide

### What the source says

Spotify's Developer Policy and Developer Terms prohibit using Spotify Platform / Spotify Content to train AI **or otherwise ingest Spotify Content into a machine-learning or AI model**. Current endpoint docs repeat the warning. Separately, Spotify's February 2026 platform update says automation and AI altered developer-access risk, and Development Mode is deliberately limited rather than a base for scaling a business.

### 1) Job-to-be-Done

The user wants to tell an assistant “this is the song / playlist / organization rule I mean” and have the product safely organize Spotify without copying links, IDs, and category decisions between multiple tools.

### 2) Why the current approach feels fast — and why that is not enough

MCP makes discovery and action frictionless because provider results become available inside the AI conversation. That same mechanism is exactly the compliance question: if provider-returned Spotify Content becomes model context, convenience may cross a provider restriction.

### 3) Onboarding / distribution signal

Spotify is pushing personal experimentation into a tightly bounded Development Mode: Premium owner, one Client ID, up to five authorized users, limited endpoints. This strongly favors an explicitly personal/local integration over a public multi-tenant SaaS assumption.

### 4) Capability pattern

Recommended conservative architecture:

`User-supplied Intent → AI interpretation → Provider-independent PlaylistIntent → deterministic Spotify broker → provider mutation → opaque/approved receipt`

Provider-returned Spotify Content should not be exposed to model-visible MCP output unless the policy status is explicitly resolved.

### 5) Business-model signal

Spotify's access model itself is a product constraint: the free/personal developer surface is intentionally not the scalable SaaS foundation. A business plan for this product cannot assume that “more users” is merely an infrastructure problem.

### 6) Limitations / failure points

- The policy text is explicit; the exact application to every MCP client implementation is not.
- Some MCP clients may treat tool results differently; that must be measured, not guessed.
- Standard MCP UX may become much less useful if Spotify-returned metadata cannot be model-visible.
- Competitors advertising Spotify+AI actions do not establish that Reese-max has the same licenses, data source, contractual basis, or approved use case.

### 7) Absorb vs do not copy

**Absorb**
- provider-data classification;
- terms/policy version manifest;
- user-supplied vs provider-returned provenance;
- fail-closed model-visibility status;
- deterministic effect broker;
- runtime capture proving the actual LLM-visible boundary.

**Do not copy**
- do not infer policy compliance from Zapier/PlaylistMap/other products existing;
- do not scrape Spotify web pages to evade Web API restrictions;
- do not hide or relabel Spotify provenance;
- do not expand search/recommendation features until Phase 0 is green.

**Opportunity Score: 98/100 — Issue #1 created.**

---

## A. Direct competitor — Soundiiz turns playlist maintenance into an explicit durable synchronization policy

**CONFIRMED — support docs updated 2026-08-22 / 2026-08-23**

Sources:
- https://support.soundiiz.com/hc/en-us/articles/360010006193-How-Soundiiz-Playlist-Sync-Works-Direction-Add-vs-Replace-and-Frequency
- https://soundiiz.com/auto-sync-playlist
- https://support.soundiiz.com/hc/en-us/articles/360013220240-How-to-Get-More-Sync-Slots-in-Soundiiz
- https://support.soundiiz.com/hc/en-us/articles/360009511174-Can-Soundiiz-Recover-Deleted-or-Overwritten-Playlists-and-Favorites

### What changed / current product behavior

Soundiiz describes a Sync as a saved one-direction policy from one source playlist to one destination. The user explicitly chooses:

- source and destination;
- `Add` vs `Replace`;
- daily / weekly / monthly execution;
- which playlists are managed.

Each run is recorded track-by-track in Synchronization History. Sync capacity is a monetized resource: Free includes 1 slot, Premium 20, Creator 50–2,000.

Soundiiz separately warns that a replace/sync history is **not a restorable backup**. If a destination is overwritten, recovery depends on another copy or the destination service's recovery features.

### 1) Job-to-be-Done

“Once I decide how this playlist should stay organized, stop making me repeat the same manual transfer every time the source changes.”

### 2) Why it saves steps / improves reliability

The persistent object is the rule, not the last one-off action. Add vs Replace makes mutation semantics visible before scheduling. Execution history lets the user determine what a background run attempted.

### 3) Onboarding / distribution

The user creates the Sync directly from the source playlist contextual menu, reviews destination/method/frequency, then saves. This reduces a multi-screen automation setup to a playlist-native workflow.

### 4) New capability pattern

`PlaylistPair + Direction + UpdateMode + Frequency → Durable Sync Policy → Execution History`

The Reese-max version should add stronger state binding:

`PlaylistPolicy + source/target snapshots → exact delta → review → apply → read-back receipt`

### 5) Pricing/business model

Sync slots themselves are the unit of value. This signals that **persistent automation objects** can be more valuable than one-shot playlist manipulation features.

### 6) Complaints / limitations

First-party limitation: history is not backup and Soundiiz does not create a restorable copy before replace/sync update.

**COMMUNITY_SIGNAL only:** recent Soundiiz users report playlists whose provider-reported count differs from retrievable item lists and a 743-track YouTube Music playlist yielding only two accessible tracks due provider/API limitations. Another June report described a 4,000+ track sync that reported runs but left the destination unchanged. These are anecdotal regression hypotheses, not measured defect rates.

Community sources:
- https://www.reddit.com/r/Soundiiz/comments/1wb4tkg/soundiiz_only_shows_a_couple_songs_in_big_ytm/
- https://www.reddit.com/r/Soundiiz/comments/1u6q4dn/am_i_using_the_synchronize_feature_right/

### 7) Absorb vs do not copy

**Absorb after #1 is green**
- explicit durable `PlaylistPolicy`;
- Add vs Replace as a visible semantic choice;
- execution receipts/history;
- selective management;
- optional schedule as separately authorized capability.

**Do not copy**
- do not equate history with backup;
- do not default to Replace;
- do not silently treat provider-inaccessible tracks as successful matches;
- do not make scheduled writes active before policy/provider/runtime verification.

**Opportunity Score: 96/100, but blocked behind #1 Phase 0. No second Issue created.**

---

## B. Adjacent design — Spotify Playlist Notes adds human rationale to playlist items

**CONFIRMED — announced 2026-08-17**

Source:
- https://newsroom.spotify.com/2026-08-17/playlist-notes-editors-listeners/

Spotify now lets eligible users attach notes to items in owned/collaborative playlists, and exposes editor notes/profiles in selected editorial playlists.

### 1) Job-to-be-Done

A playlist is not only a set of tracks; the curator may need to preserve **why a track belongs** — a memory, recommendation, grouping reason, or context.

### 2) Why it saves steps / improves reliability

Rationale travels with the item instead of living in a separate notes app or disappearing after organization.

### 3) Onboarding / distribution

Notes are added from the track's existing contextual menu, not from a separate metadata management product.

### 4) Transferable pattern

`Item Membership + Human Rationale + Author Identity`

For Reese-max, a future local organizer could preserve **classification rationale** or user-defined tags without asking the model to rediscover them every run.

### 5) Pricing/business-model signal

Spotify is improving expressive curation inside the core product rather than charging separately for metadata. Third-party organizers therefore need value beyond “put tracks into groups.”

### 6) Limitations

Current Web API documentation inspected this round does not establish a supported API field/end-point for Playlist Notes. Treat programmatic access as **UNKNOWN**.

### 7) Absorb vs do not copy

**Absorb** the idea that human rationale is durable state. **Do not** claim API support, scrape the UI, or build a dependency on Notes until an official developer surface exists.

**Opportunity Score: 78/100 — research list only.**

---

## C. Emerging MCP/workflow pattern — music-agent actions are becoming commodity, while high-value authority stays outside the agent

### C1. PlaylistMap MCP

**CONFIRMED — launched July 2026; page current as of 2026-09-14**

Source:
- https://playlistmap.com/mcp

PlaylistMap exposes two MCP tools for playlist matching and integrity research. The MCP is free/keyless/rate-limited, but curator contact data is deliberately never returned to the agent; contact unlocking and actual pitching remain in the product/account surface.

Transferable principle:

`Agent Discovery/Research ≠ Sensitive Data Access ≠ External Action Authority`

That is a useful design for Reese-max even if PlaylistMap's own Spotify data basis/license is different and cannot be assumed transferable.

### C2. Zapier Spotify MCP

**CONFIRMED — current product surface checked 2026-09-14**

Sources:
- https://zapier.com/mcp/spotify
- https://zapier.com/apps/spotify/integrations/chatgpt

Zapier advertises Spotify `Add Items to Playlist`, `Create Playlist`, and selected read actions as callable tools from MCP/AI clients. This means simple “create/add” effects are becoming commodity integration actions.

Strategic implication for Reese-max: **do not compete merely by adding more raw Spotify API wrappers.** Differentiate through provider-policy correctness, deterministic intent/effect separation, exact mutation review, stale-plan detection, and receipts.

Again, Zapier's product availability is not evidence that Reese-max has identical contractual permission.

**Opportunity Score: 90/100 as a differentiation signal; mapped into #1, no separate Issue.**

---

## D. Provider primitive — Spotify already exposes playlist snapshots, so stale-plan safety is technically grounded

**CONFIRMED — current Web API docs checked 2026-09-14**

Sources:
- https://developer.spotify.com/documentation/web-api/concepts/playlists
- https://developer.spotify.com/documentation/web-api/reference/get-playlist
- https://developer.spotify.com/documentation/web-api/reference/reorder-or-replace-playlists-items
- https://developer.spotify.com/documentation/web-api/reference/remove-items-playlist

Spotify documents `snapshot_id` as a version identifier for playlist state and describes snapshots as the mechanism for concurrent modifications. Replace explicitly overwrites existing playlist items. Remove/reorder operations can target a snapshot.

Current `spotify-playlist-organizer-mcp` does not preserve the source/target snapshot set in its preview and does not require the reviewed preview when applying. `apply` reloads live state, recomputes classification and then replaces the matching derived list. This creates a classic **TOCTOU / stale-plan** problem: the user can review one plan, while a later apply writes a different live plan or overwrites manual edits made after preview.

Recommended post-#1 contract:

```text
PlaylistPolicyV1 {
  source_playlist_ref,
  deterministic_rules,
  managed_targets,
  update_mode: add_only | replace_managed,
  public_visibility,
  naming_policy
}

PlaylistPlanReceipt {
  policy_hash,
  source_snapshot_id,
  target_snapshot_ids,
  exact_delta: { add[], remove[], retain[] },
  unknown_or_unavailable_items[],
  generated_at,
  plan_hash
}

ApplyReceipt {
  plan_hash,
  preflight_snapshot_result,
  per_target_before_snapshot,
  per_target_after_snapshot,
  attempted_delta,
  readback_result,
  partial_failure_state
}
```

No “scheduled sync” should be implemented before this exact Plan→Apply contract and #1 provider-policy gate are green.

---

# New Releases / Recent Market Changes

1. **2026-08-23 — Soundiiz sync semantics documentation:** one-direction source→destination, Add vs Replace, daily/weekly/monthly, per-run history.
2. **2026-08-23 — Soundiiz sync-slot model:** Free 1, Premium 20, Creator 50–2,000; persistent automation is explicitly monetized.
3. **2026-08-22 — Soundiiz recovery documentation:** sync/replace history is not a restorable backup.
4. **2026-08-17 — Spotify Playlist Notes:** item-level human rationale becomes part of curation UX.
5. **July 2026 — PlaylistMap MCP:** playlist research/vetting inside AI clients while curator contacts and pitching stay outside the agent.
6. **2026-02-06 / 2026-03-09 — Spotify Development Mode tightening:** Premium owner, one Client ID, five users, constrained endpoint model; Spotify explicitly cites automation/AI risk.
7. **Current — Zapier Spotify MCP:** raw create/add actions are increasingly commodity agent tools.
8. **Representative older pattern — Spotify Prompted Playlist (2026-01-22, updated 2026-02-23):** natural-language playlist intent can be made durable with daily/weekly refresh. Useful product pattern, but not a new last-90-day release.

---

# Community Pain Points

These are **COMMUNITY_SIGNAL** only. They are used as failure-mode hypotheses, never as market-share or defect-rate claims.

1. **Manual organization debt:** a June 2026 r/spotify user described a 58-hour “all” playlist and wished someone could organize playlists for them; replies mention users with roughly 250–700 playlists. This validates the organization JTBD, not a prevalence percentage.
   - https://www.reddit.com/r/spotify/comments/1u536kh/how_do_you_organise_your_playlists/
2. **Provider mismatch / unavailable items:** a September 2026 Soundiiz thread described a 743-track YouTube Music playlist with only two accessible items in Soundiiz; the resolution pointed to uploaded/non-native content and API limitations.
   - https://www.reddit.com/r/Soundiiz/comments/1wb4tkg/soundiiz_only_shows_a_couple_songs_in_big_ytm/
3. **Sync says success but user's mental model disagrees:** a June 2026 thread described a 4,000+ track sync that appeared to run while the destination still seemed unchanged. Soundiiz pointed the user to execution history and change detection.
   - https://www.reddit.com/r/Soundiiz/comments/1u6q4dn/am_i_using_the_synchronize_feature_right/
4. **Users explicitly fear changing the original by mistake:** a June 2026 Playlist Tidy creator described “copy into new playlists without changing the original” and backup-before-change as core value. This is a self-reported project post, not independent effectiveness evidence.
   - https://www.reddit.com/r/truespotify/comments/1txq9fr/i_made_a_free_tool_to_clean_and_organize_large/
5. **API restrictions themselves are product friction:** community discussion around 2026 Spotify API changes repeatedly asks whether playlist tools will continue to work. Treat this as motivation for capability/policy manifests, not proof of a specific endpoint outage.
   - https://www.reddit.com/r/truespotify/comments/1rh4pes/organizeyourmusic_is_back/

Regression hypotheses for Reese-max:
- source count != retrievable item count;
- local/uploaded/non-native items;
- unavailable market items;
- destination changed manually after preview;
- source changed after preview;
- >100-item chunked mutation with partial failure;
- provider 401/403/429 mid-plan;
- policy/client behavior changes making provider data model-visible unexpectedly.

---

# Adjacent Ideas

## 1. Human rationale as durable state

Spotify Playlist Notes reinforces a broader portfolio pattern:

`Generated Classification ≠ Human Meaning`

When a user corrects “why this belongs here,” the correction should be preservable as scoped state instead of rediscovered from scratch. This maps to `herdr-skills`, `ppt-studio`, `clinical-scribe-worker`, `note-filler`, and media curation products.

## 2. Execution history is not recovery

Soundiiz explicitly separates “we recorded what happened” from “we can restore the previous state.” This should be a portfolio-level distinction:

`Receipt/History ≠ Backup/Restore Artifact`

Relevant to playlist writes, document mutations, roster publishing, NLE project mutation, prompt/skill promotion, and external-effect automation.

## 3. Provider capability is a versioned truth source

Spotify UI now has capabilities (e.g., folders, Playlist Notes) that are not necessarily available in Web API. The Web API docs explicitly say folders are not returned or creatable through the API.

Portfolio principle:

`Product UI Capability ≠ Public API Capability ≠ Authorized Client Capability`

Do not create roadmap promises from consumer-app screenshots without API/runtime verification.

## 4. Read/research authority can be broader than sensitive/effect authority — but only when provider terms permit it

PlaylistMap demonstrates a good product boundary: discovery and vetting can live in the agent, while contact reveal and pitching remain outside. This is transferable to research, commerce, external messaging, and high-impact actions — but the provider's own data license remains the first gate.

---

# Opportunity Scores

| Candidate | User Pain | Strategic Fit | Novelty | Evidence Strength | Reuse Potential | Effort | Security/Privacy/Cost Risk | Score / Decision |
|---|---:|---:|---:|---:|---:|---|---|---|
| Spotify provider-data / AI-ingestion boundary + conservative broker | 9 | 10 | 9 | 10 | 10 | Medium | Very high risk reduction | **98 — Issue #1 created** |
| Snapshot-safe PlaylistPolicy + exact PlanReceipt / ApplyReceipt | 9 | 10 | 9 | 10 | 9 | Medium | High risk reduction | **96 — defer behind #1** |
| Durable scheduled playlist sync | 9 | 8 | 7 | 9 | 7 | Medium/High | New background-write risk | **88 — research only** |
| Provider capability/policy manifest with effective dates | 8 | 10 | 8 | 10 | 10 | Low/Medium | High risk reduction | **94 — included in #1** |
| Local/non-AI provider UI + AI intent-only handoff | 7 | 9 | 9 | 9 | 9 | Medium | Strong compliance benefit | **92 — included in #1** |
| Playlist item classification rationale / local notes | 7 | 7 | 7 | 8 | 8 | Medium | Low | **78 — research only** |
| Cross-service transfer hub like Soundiiz | 6 | 4 | 3 | 10 | 5 | Very High | High provider/policy complexity | **54 — reject now** |
| Spotify-folder automation | 5 | 4 | 4 | 10 | 4 | Impossible via current API | High correctness risk | **Reject — API unsupported** |

---

# Opportunity Map — All 36 Product Repositories

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| `exam-archive` | official source identity + revision lineage | changed/withdrawn-source diff | archive→practice canonical handoff | machine-readable correction feed | AI-generated answer corpus as source truth |
| `police-exam-practice` | official corpus + answer provenance | mastery-based next-task selection | evidence-linked explanations + source mode | scoped learner correction memory | generic quiz generation before corpus correctness |
| `police-exam-archive` | source/version/correction truth | denominator and missing-document audit | immutable source archive + correction trail | revision event feed to practice apps | silent overwrite of historical exam truth |
| `92-duty-scheduler` | authenticated/authorized roster writes | request lifecycle + conflict explanation | LINE self-service with canonical published roster | transition-triggered candidate work | autonomous final roster mutation; feature breadth before CI/P0 auth |
| `UkePack` | structured MusicXML source fidelity | deterministic layout/export checks | teacher-reviewed practice-pack candidate | rationale/version notes on teaching edits | opaque AI rewriting of musical structure |
| `ppt-studio` | native editable objects | render + export read-back | stable object graph + exact touched-object diff | item-level edit rationale/history | flattened AI slides or brand-wide silent mutation |
| `voice-actress` | evidence/source-span grounding | contradiction/counterevidence lane | criterion→evidence→rubric lineage | claim review receipts | uncited fluent answers as truth |
| `taiwan-intel-dashboard` | source freshness/provenance | changed-since-last + conflict surfacing | official-first multi-source evidence ledger | decision attention queue | “more sources” without authority/freshness semantics |
| `autodev-ng` | bounded leases + verification receipts | WIP/review-pressure telemetry | domain truth + multi-engine orchestration | provider-policy manifests | rebuilding a generic agent runtime; autonomy before reliability |
| `flux-image-gen` | output provenance | edit/reference exactness + cost receipt | C2PA/content credentials + candidate history | policy/effect receipt | output-success = provenance-success |
| `claude-mem` | memory provenance | temporal truth / invalidation | recall receipt + stale-truth gate | scoped preference candidates | “remember more” without current-truth semantics |
| `lobsterpulse` | dedupe/freshness | attention-budget ranking | decision-only queue | provider health / changed-since-last | noisy feed expansion |
| `prompt-autoresearch` | holdout/stability gates | judge/eval cost accounting | Pareto quality + complexity compaction | receipt-history ≠ rollback artifact | score-only prompt bloat |
| `neciken-summer-poem` | frozen revisions/policy provenance | candidate comparison | creative exploration without canonical overwrite | submission-policy manifest | silent AI mutation of final submission |
| `note-filler` | field-level source truth | stale/contradiction handling | candidate field mutation + review | scoped learned preferences | whole-document regeneration on tiny edits |
| `lplrs-judicial-sync` | authority revision/removal | scheduled-sync health + tombstones | exact source-span and change lineage | recovery vs history distinction | append-only ingestion that ignores withdrawal/change |
| `cyber-prep-coach` | trusted 880-question corpus | adaptive mastery + SME-calibrated explanations | exam provenance + personalized review | AI authoring only as candidate layer | offensive-lab scope creep / uncalibrated generated questions |
| `cf-ai-router` | provider/model/cost truth | cache-read/write + routing economics | fail-closed cost/routing receipt | provider capability manifest | “successful response” = known cost/provider |
| `avatar-vfo` | user/session isolation | continuity regression | explicit structured persona state | correction→candidate preference | hidden long-term drift |
| `project-doctor-web` | reproducible findings | exact remediation candidate diff | diagnose→candidate fix→verify | provider/runtime compatibility receipt | blind auto-fix of canonical project state |
| `minideck` | editable native artifact | export/read-back | compact structured deck + versioning | object-level mutation receipts | raster-first deck generation |
| `chatgpt-dual-pipeline` | stage identity/provenance | resumable handoff | independent reviewer separation | cost/budget receipts by stage | duplicated canonical truth across agents |
| `taichung-police-intel` | official-first source evidence | freshness/dedupe/contradiction | operational briefing with traceable source | attention queue + provider health | speculative summaries without source status |
| `soundbox-offline` | local library truth | full offline data plane | offline-first queue/library/search | local rationale/tags | “downloaded items page” as fake offline mode |
| `skill-foundry` | candidate→evaluation→promotion | package/runtime compatibility | demonstration/correction→evidence-backed skill | provider-policy manifest for skills using external APIs | recorded demo = certified skill |
| `video-timeline-pipeline` | evidence-backed CutSpec | NLE import/read-back | typed handoff rather than NLE replacement | history vs restore artifact for project mutation | own model marketplace / paid generation authority |
| `ai-novel-workstation` | canonical story state | context manifest + resumability | agent-facing story workspace with explicit state | human rationale/version notes | uncontrolled memory as story truth |
| `clinical-scribe-worker` | clinical truth boundary + auth | section-scoped regeneration + undo | source-aware candidate note sections | learned preference candidates with rollback | hidden auto-learning / whole-note overwrite |
| `MaterialYouNewTab` | local state/privacy | browser-version compatibility | local-first command/productivity surface | structured agent tools only after extension/runtime verification | broad agent read/write access to notes/tasks |
| `cf-mcp-server` | exact tool contract/effect semantics | manifest drift gate | current-contract authorization + runtime receipt | provider terms/capability manifests | server identity = unchanged authority |
| `tick-stock-panel` | point-in-time market data | deterministic `StrategyDef` | NL intent→inspectable rules | external-effect plan receipts | live trading or generated Python before isolation |
| `herdr-skills` | correction evidence | scoped/versioned promotion | repeated correction→candidate improvement | rationale history | one correction = permanent policy |
| `ninax-line-hermes` | ordered/revision-aware messaging | stale-answer invalidation | canonical conversation state + receipt | room-based context after ordering truth | multi-channel expansion before correctness |
| `ai-flight-radar` | quote/provider freshness | WatchSpec + scheduled evaluation receipt | reviewed travel intent→durable monitored object | provider capability/policy manifest | active collector = approved alert/watch authority |
| `academic-mcp` | source identity | progressive tool exposure | 81-tool canonical catalog + selection eval | provider-policy manifest per scholarly source | semantic similarity = permission to substitute source |
| `spotify-playlist-organizer-mcp` | **provider-policy/model-visibility gate** | snapshot-safe preview→apply exact delta | `PlaylistIntent/Policy` + deterministic broker + receipts | scheduled sync after policy/runtime gates | raw Spotify content into AI by assumption; folder automation; default Replace; competitor existence as compliance proof |

---

# Top 10 Cross-Portfolio Ideas

1. **Provider Data Boundary Manifest** — classify `USER_SUPPLIED / PROVIDER_RETURNED / LOCAL_DERIVED`, model visibility, retention, policy source/effective date. Reusable for Spotify, scholarly APIs, financial/market APIs, travel sources, messaging, and cloud tools.
2. **Snapshot-Safe Candidate Mutation** — `ObservedVersion → CandidatePlan → PlanHash → preflight version recheck → effect → read-back receipt`. Useful for playlists, documents, rosters, issues, NLE projects, external SaaS state.
3. **Durable Policy Object instead of repeated one-shot actions** — `PlaylistPolicy`, `WatchSpec`, scheduling policy, prompt/skill policy. Persistent intent should be versioned and explicitly promoted.
4. **Exact Delta before Effect** — show `ADD / REMOVE / RETAIN / UNKNOWN` rather than “AI will reorganize this”. Portable to note regeneration, slides, playlist updates, source sync, roster edits.
5. **Receipt/History ≠ Backup/Restore Artifact** — an audit log proves what happened; it does not reconstruct prior canonical state. Promote restore artifacts only where needed.
6. **Product UI Capability ≠ API Capability** — consumer products may expose Notes/folders/features unavailable through developer APIs. Runtime/API verification must precede roadmap promises.
7. **Human rationale as durable state** — preserve why a user grouped/corrected/approved something, not only the resulting artifact. Useful across learning, documents, skills, media, scheduling.
8. **Read/Research Authority ≠ Sensitive/Effect Authority** — PlaylistMap-style boundaries remain useful, but only after provider terms allow the read surface itself.
9. **Background Automation Requires Separate Promotion** — a one-time approved action must not silently become a recurring daemon. `ActionApproval ≠ ScheduleAuthority`.
10. **Competitor Availability ≠ Contractual Permission** — another product doing the same thing is market evidence, not legal/provider authorization. This should become a reusable evidence rule in product audits.

---

# Ideas Rejected / Deferred

## Reject now — Spotify folder automation

Spotify Web API concepts explicitly state that folders are not returned by the Web API and cannot be created through it. Do not promise or scrape around this limitation.

Source:
- https://developer.spotify.com/documentation/web-api/concepts/playlists

## Reject now — use Spotify Playlist Notes programmatically

The consumer product exists, but no official developer surface was verified this round. Keep it as a design inspiration only.

## Reject now — copy Zapier/PlaylistMap AI behavior as proof of permission

Those products may have different data sources, contracts, licenses, or approved use cases. Their availability cannot close #1.

## Reject now — cross-service Soundiiz clone

A multi-service transfer hub adds authentication, matching, provider-policy, quota and catalog-normalization complexity before the single-provider boundary is even resolved.

## Defer — scheduled automatic Spotify writes

Soundiiz and Spotify Prompted Playlist show durable recurring automation has user value, but Reese-max should first resolve provider-policy, snapshot-safe Plan→Apply, partial failure, and read-back receipts.

## Reject — default `Replace all`

Current repository already protects the source playlist, but replacing derived targets can still destroy manual target edits. Default mutation semantics should remain conservative and explicit.

## Reject — assume Spotify Developer Mode scales to a public product

Spotify's 2026 docs explicitly frame Development Mode as bounded experimentation/personal use and restrict authorized users. Product positioning must reflect the actual quota/access mode.

---

# Issue Mapping / Coordination

| Signal / fingerprint | Repository / Issue | Action this round | Coordination rationale |
|---|---|---|---|
| Spotify provider data → AI model boundary | `spotify-playlist-organizer-mcp #1` | **CREATED** | No prior Issues/PRs/lock; new product blocker with distinct fingerprint |
| Snapshot-safe PlaylistPolicy / PlanReceipt | `spotify-playlist-organizer-mcp #1` Phase follow-up | Included in #1, no new Issue | Depends on policy gate; avoid two Issues for one blocked product direction |
| Scheduled sync / recurring playlist policy | research list under #1 | No Issue | Do not grant recurring write authority before Phase 0 + stale-plan safety |
| Playlist Notes / curator rationale | research list | No Issue | API support UNKNOWN |
| PlaylistMap research/effect boundary | cross-portfolio evidence | No Issue | Reinforces existing candidate/effect boundaries; not a new implementation fingerprint |
| `ai-flight-radar` hourly collector now active | existing `ai-flight-radar #4` WatchSpec | No update this round | Internal truth changed, but no new external evidence is needed to reopen/duplicate #4 |
| `cf-mcp-server` tool-contract / data authority | existing #15 | No update | Spotify policy is provider-specific; do not dilute #15 with unrelated legal scope |

No product source code, implementation branch, merge, deployment, secret, permission, or repository-setting change was made.

---

# Sources

## First-party / official

1. Spotify Developer Policy — effective 2025-05-15  
   https://developer.spotify.com/policy
2. Spotify Developer Terms v10 — effective 2025-05-15  
   https://developer.spotify.com/terms
3. Spotify Web API current policy note (example track endpoint)  
   https://developer.spotify.com/documentation/web-api/reference/get-several-tracks
4. Spotify — Update on Developer Access and Platform Security — 2026-02-06  
   https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security
5. Spotify — Quota Modes  
   https://developer.spotify.com/documentation/web-api/concepts/quota-modes
6. Spotify — February 2026 Dev Mode Migration Guide  
   https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide
7. Spotify — Playlists concepts / snapshots / folders  
   https://developer.spotify.com/documentation/web-api/concepts/playlists
8. Spotify — Get Playlist / `snapshot_id`  
   https://developer.spotify.com/documentation/web-api/reference/get-playlist
9. Spotify — Update/Replace Playlist Items  
   https://developer.spotify.com/documentation/web-api/reference/reorder-or-replace-playlists-items
10. Spotify — Remove Playlist Items / snapshot targeting  
    https://developer.spotify.com/documentation/web-api/reference/remove-items-playlist
11. Spotify — Playlist Notes — 2026-08-17  
    https://newsroom.spotify.com/2026-08-17/playlist-notes-editors-listeners/
12. Spotify — Prompted Playlist expansion — 2026-01-22, updated 2026-02-23  
    https://newsroom.spotify.com/2026-01-22/prompted-playlists-expansion/
13. Soundiiz — Sync direction / Add vs Replace / frequency — updated 2026-08-23  
    https://support.soundiiz.com/hc/en-us/articles/360010006193-How-Soundiiz-Playlist-Sync-Works-Direction-Add-vs-Replace-and-Frequency
14. Soundiiz — Auto Sync  
    https://soundiiz.com/auto-sync-playlist
15. Soundiiz — Sync slots — updated 2026-08-23  
    https://support.soundiiz.com/hc/en-us/articles/360013220240-How-to-Get-More-Sync-Slots-in-Soundiiz
16. Soundiiz — Recovery limits — updated 2026-08-22  
    https://support.soundiiz.com/hc/en-us/articles/360009511174-Can-Soundiiz-Recover-Deleted-or-Overwritten-Playlists-and-Favorites
17. PlaylistMap MCP — launched July 2026  
    https://playlistmap.com/mcp
18. Zapier Spotify MCP  
    https://zapier.com/mcp/spotify
19. Zapier Spotify + ChatGPT surface  
    https://zapier.com/apps/spotify/integrations/chatgpt

## Community signals — anecdotal only

20. r/spotify — playlist organization debt — 2026-06-13  
    https://www.reddit.com/r/spotify/comments/1u536kh/how_do_you_organise_your_playlists/
21. r/Soundiiz — large YTM playlist / API-limited items — 2026-09-08  
    https://www.reddit.com/r/Soundiiz/comments/1wb4tkg/soundiiz_only_shows_a_couple_songs_in_big_ytm/
22. r/Soundiiz — sync mental-model / destination unchanged — 2026-06-15  
    https://www.reddit.com/r/Soundiiz/comments/1u6q4dn/am_i_using_the_synchronize_feature_right/
23. r/truespotify — Playlist Tidy self-report — 2026-06-05  
    https://www.reddit.com/r/truespotify/comments/1txq9fr/i_made_a_free_tool_to_clean_and_organize_large/
24. r/truespotify — OrganizeYourMusic / API-change discussion — 2026-02-28  
    https://www.reddit.com/r/truespotify/comments/1rh4pes/organizeyourmusic_is_back/

---

# What Changed Since Last Radar (r4 → r5)

1. **Portfolio count changed from 35 to 36 product-like repositories.** `spotify-playlist-organizer-mcp` is no longer empty; it now has a real Node.js MCP implementation.
2. **New highest-priority opportunity/blocker:** Spotify's current provider terms may conflict with a normal model-visible Spotify MCP read surface. This materially changes the product direction before feature growth.
3. **Created `spotify-playlist-organizer-mcp #1`** with Phase-0 data classification, conservative mode, exact client/model data-flow verification, policy manifest, success metrics and runtime verification requirements.
4. **New direct-competitor evidence:** Soundiiz's current durable Sync object makes Add vs Replace, direction, frequency and history explicit; its recovery docs show why audit history must not be treated as backup.
5. **New post-gate feature direction:** snapshot-safe `PlaylistPolicy → PlanReceipt → ApplyReceipt`, grounded in Spotify's own `snapshot_id` mechanism and the current repo's preview/apply TOCTOU gap.
6. **New adjacent design:** Spotify Playlist Notes makes curator rationale persistent; useful as a design pattern, but API support is unverified and therefore not product scope.
7. **New emerging MCP comparison:** PlaylistMap deliberately keeps curator contacts/pitching outside the agent, while Zapier shows raw create/add Spotify actions are commoditizing. Reese-max differentiation should be policy correctness + safe orchestration, not raw wrapper count.
8. **Internal operational truth changed:** `ai-flight-radar` has now enabled its hourly collector after live provider validation. This increases the importance of keeping `collector execution ≠ approved durable WatchSpec` explicit.
9. No previous high-value Issue was duplicated or stolen from another workflow, and no implementation branch/source/deploy work was performed.

---

## Final Portfolio Principle

**`A provider API being technically callable does not mean its returned data is authorized to enter an AI model.`**

For provider-backed Reese-max products, the reusable contract should become:

`User Intent → Provider Policy/Data Classification → Candidate Action → Explicit Authority → Provider Effect → Read-back Receipt`

Only after the data boundary is green should the product optimize convenience, recurring automation, or broader tool exposure.