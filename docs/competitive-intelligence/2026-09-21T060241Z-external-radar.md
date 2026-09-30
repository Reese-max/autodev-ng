# External Competitive / New-Product / Workflow Radar — 2026-09-21T06:02:41Z

## Status / scope / evidence boundary

- Run status: **COMPLETE_FOCAL_ANALYSIS / FRESH_OWNER_INVENTORY / MATERIAL_STRATEGY_SIGNAL**.
- Owner scope: `Reese-max` only. No third-party repository was modified.
- Governing quality gate re-read: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Quality-rule blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh connected owner enumeration: **42 Reese-max-owned repositories / 41 unarchived**; pagination page 2 returned empty. Archive state is taken from the current connected inventory, not an old snapshot.
- Fair cursor entering this round: `Reese-max/spotify-playlist-organizer-mcp`, carried forward by the previous academic-mcp radar.
- Focal repository: public, owner-controlled, unarchived; default branch `main`.
- Focal HEAD re-read immediately before report write: `01f84bd496225c3b96d4a022fa8612320fba45df` (`docs(audit): add fixed 50-persona round 2`). Current product-changing baseline remains the earlier implementation line; the latest default-branch commit is audit/docs only.
- Owner-approved direction rechecked from the latest product-board delta: **INVEST / SIMPLIFY** — YouTube-first, local intent-to-playlist effect broker with exact identity, safe credential lifecycle, truthful receipts, and a small personal music library; do not expand into generic transfer SaaS, recommendation feed, hosted accounts, billing, broad UI, or provider-count competition before the current controls are verified.
- Existing Issues and all-state PR surface were re-read. Active implementation scopes include PR #20 plus #36–#41. This radar did not alter those scopes.
- No live YouTube/Spotify provider call, OAuth login, quota exhaustion, production playlist mutation, deployment, paid request, source/config/CI/secret/settings change, implementation branch, merge, worker, or GOAL was started.

## Executive decision

**0 new Issues. 0 Issue/PR comments. 0 implementation authorizations.**

There is, however, one material external strategy signal worth retaining:

> **Free Your Music is now a direct MCP-category competitor, not merely a playlist-transfer app.** Its current first-party product exposes one local stdio MCP server over a desktop loopback bridge, advertises 17 music services, supports Claude Desktop / Claude Code / Cursor / Cline, exposes read/search/write/follow tools, has explicit per-service capability differences, and handles multiple accounts with a typed `ACCOUNT_REQUIRED` state. The npm profile also shows the `@freeyourmusic/mcp` package receiving releases within the current week.

This changes positioning more than backlog. “Music in an MCP” and even “local MCP” should no longer be treated as differentiators by themselves. The higher-value differentiation for this repository remains **exact reviewed identity, explicit effect authority, truthful partial/unknown write receipts, local canonical ownership, and bounded recovery without hiding provider truth**.

The external evidence does **not** establish a current user problem requiring 17-provider breadth, multi-account support, a desktop bridge, a CLI, subscription gating, or a new orchestration layer. Those remain unapproved expansion paths.

## Product → market category

| Product | Market / direct alternatives | Current product job |
|---|---|---|
| `spotify-playlist-organizer-mcp` (currently YouTube-first despite historical repo name) | Free Your Music MCP/CLI, Soundiiz, TuneMyMusic, SongShift, YouTube / YouTube Music native workflows | `intent/search or exact link → reviewed exact videoId → explicit preview/apply → truthful YouTube receipt`, with an emerging user-owned local library |

## External Signals

### A. Direct competitor — Free Your Music has entered the local music-MCP surface

**CONFIRMED CURRENT CAPABILITY — first-party pages checked 2026-09-21. Initial launch date: UNKNOWN from the available first-party pages. Current npm releases: actively shipping this week.**

Sources:
- https://freeyourmusic.com/ai/mcp
- https://freeyourmusic.com/ai
- https://freeyourmusic.com/ai/youtube-music-mcp
- https://freeyourmusic.com/ai/youtube-mcp
- https://freeyourmusic.com/ai/cli
- npm publisher profile for `@freeyourmusic/mcp` / `@freeyourmusic/cli`

Current first-party positioning:

- one local MCP server covers **17 services**;
- transport is stdio to the AI host, while the MCP process talks to the Free Your Music desktop app through **127.0.0.1**;
- no separate provider OAuth is performed by the MCP package; it inherits the desktop app's authenticated sessions;
- documented hosts include Claude Desktop, Claude Code, Cursor and Cline;
- the MCP exposes status/auth, playlists, library, history, search, playlist writes, and library actions;
- Free allows reads plus a bounded search allowance; Pro gates write operations and unlimited search;
- multi-account services expose an optional `account` argument; when ambiguity exists, omission returns **`ACCOUNT_REQUIRED` plus candidate accounts** rather than silently choosing one;
- provider capability is explicitly per service: e.g. a service may be read-only even though another service supports writes.

The npm publisher page currently shows `@freeyourmusic/mcp` releases from the current week (`9.31.2` / `9.33.0` were surfaced in the current index). Because npm search exposes relative publication time in this environment, this report records active current shipping but does **not** fabricate an exact initial launch date.

**User job solved:** operate music libraries through an AI assistant without re-authenticating every host, while making the selected account/provider explicit when needed.

**Concrete manual steps reduced:** switching between AI client and music-transfer UI; re-entering service login inside every AI integration; manually resolving which of several connected accounts should receive a write.

**Transferable design:** identity ambiguity should fail closed into a small, typed selection step. A tool should not guess the account/channel that owns the side effect.

**Do not copy:** provider-count competition, desktop-daemon dependency, broad cross-service migration, monetization gating, hosted account infrastructure, or generic AI music assistant breadth are not justified by owner evidence.

### A2. Direct competitor — Soundiiz continues to expose operation- and account-specific recovery

**CONFIRMED — support pages updated 2026-09-04 / 2026-08-23; rechecked 2026-09-21.**

Sources:
- https://support.soundiiz.com/hc/en-us/articles/8493033465746-Soundiiz-Error-104-Can-t-Delete-Rename-or-Remove-Duplicates-on-Some-Platforms
- https://support.soundiiz.com/hc/en-us/articles/36413540316946-Can-t-Create-or-Transfer-a-Playlist-to-YouTube-or-YouTube-Music

Soundiiz explicitly distinguishes:

- one unsupported **action** from an unsupported provider;
- temporary request limits from permanent/current capability restrictions;
- playlist-library limits from authentication errors;
- the Google account from the **specific connected YouTube channel**.

This is not a new fingerprint versus the 2026-09-19 radar. It remains evidence that provider/account/action context belongs in recovery, but it does not justify another capability framework.

### B. Adjacent workflow — SongShift moved beyond transfer into cross-service social sharing

**CONFIRMED — SongShift announcement dated 2026-07-18; checked 2026-09-21.**

Source: https://www.songshift.com/blog/introducing-songmix

SongShift introduced **SongMix**, a separate product for sharing and discovering playlists across service boundaries through a single cross-platform social surface.

**User job solved:** share a playlist with friends who use different services, without forcing everyone onto the same streaming provider.

**Why it is relevant:** playlist-transfer companies are expanding horizontally into network/discovery experiences, not only better matching.

**Decision here:** **DO NOT COPY.** `spotify-playlist-organizer-mcp` has no owner evidence for a social graph, public sharing network, feed, creator profile, or discovery marketplace. Copying this would change the product category and add moderation/privacy/distribution burden before the current local effect broker is proven.

### B2. Adjacent workflow — Soundiiz keeps broad source ingestion simple

**CONFIRMED — support article updated 2026-09-15; checked 2026-09-21.**

Source: https://support.soundiiz.com/hc/en-us/articles/37958924057234-How-to-Import-a-Playlist-from-a-URL-CSV-File-or-Plain-Text

Soundiiz accepts a public playlist URL, CSV/file, or plain text and asks the user to review extracted tracks before choosing a destination.

This validates a useful workflow pattern — **accept existing user material, normalize it, review before effect** — but it maps to already-active repository work (#16 / PR #20 batch import and exact-selection flows). It is **DUPLICATE / ACTIVE_SCOPE**, not a reason to open another Issue.

### C. Provider change — recent YouTube API media-surface changes do not create a current core gap

**CONFIRMED — YouTube Data API revision history checked 2026-09-21.**

Source: https://developers.google.com/youtube/v3/revision_history

Recent provider changes include:

- **2026-09-14:** playlist image upload maximum increased from 2 MB to 50 MB;
- **2026-09-11:** APIs may return additional higher-resolution thumbnail sizes;
- **2026-09-01:** `videos.getRating` authorization scope support changed;
- **2026-06-01:** granular quota buckets for `search.list` / `videos.insert` (already tracked by #42).

The current repository does not manage custom playlist artwork, and no target-user workflow evidence says playlist-image editing is blocking the core save/organize job. Therefore custom artwork remains **NO ACTION / DO NOT ADD**.

## New Releases / pricing / distribution signals

| Date / observation | Product | Signal | Decision |
|---|---|---|---|
| current as of 2026-09-21; package releases observed this week | Free Your Music | Local stdio MCP + CLI + desktop bridge; 17 services; multi-account and service capability semantics | Major positioning signal; no automatic backlog expansion |
| 2026-09-15 | Soundiiz | URL/file/plain-text import with review | Already covered by batch-import/selection active scope |
| 2026-09-04 | Soundiiz | Error 104 models action-specific unsupported state | Existing provider-truth principle; no duplicate Issue |
| 2026-07-18 | SongShift | SongMix cross-service social sharing/discovery | Adjacent category expansion; reject for this product |
| 2026-09-14 | YouTube Data API | playlist image max upload 50 MB | No current user job / no Issue |
| 2026-09-11 | YouTube Data API | higher-resolution thumbnail variants | Passive metadata improvement; no product requirement |

**Pricing signal only:** Free Your Music currently gates writes behind Pro while allowing reads and a bounded search tier for free. This is evidence that the market can price **effect authority** separately from browsing, not evidence that Reese-max should add subscriptions, billing, or artificial limits.

## Community Pain

No Reddit/HN anecdote was promoted into frequency or severity evidence this round. The main finding relies on first-party competitor/product documentation, npm package presence, current repository source, and existing owner decisions.

Unknowns that remain material:

- no owner/user telemetry shows demand for more than one YouTube account/channel inside this MCP;
- no observed incident shows a write went to the wrong YouTube channel;
- no evidence says users need 17 providers or cross-provider library comparison;
- no live FYM runtime was installed or exercised, so its documented capabilities are product claims, not independently benchmarked outcomes;
- no evidence compares Free Your Music's failure receipts against this repository's `PARTIAL_PLAYLIST_CREATED` / `UNKNOWN_AFTER_WRITE` semantics;
- initial public launch date of FYM's MCP surface could not be established from the first-party pages available in this run.

## Adjacent Ideas

### 1. Account/channel ambiguity should be a typed decision, not a guessed side effect

Reusable small principle:

`provider + authenticated identity + operation + exact target → effect authority`

Free Your Music's `ACCOUNT_REQUIRED` pattern and Soundiiz's connected-YouTube-channel troubleshooting both reinforce this. In this repository, PR #41 already adds a non-secret YouTube channel fingerprint to credential status. That active scope should land and be reviewed before inventing a multi-account subsystem.

If real user evidence later shows frequent multi-channel use, the smallest research experiment would be a **two-identity fixture that proves a write cannot proceed while target account/channel is ambiguous**. No account registry, cloud profile service, switcher UI, or multi-provider identity graph is justified now.

### 2. “Local MCP” is now table stakes; safety/truth should carry the differentiation

Free Your Music is also local-first at the MCP boundary. Therefore these attributes alone are weak differentiators:

- stdio MCP;
- local loopback transport;
- natural-language playlist control;
- basic read/search/write tools;
- multi-host installer support.

The repository should keep its narrower, harder-to-fake product contract:

- exact selected YouTube identity before an effect;
- explicit preview/apply;
- no automatic mutation retries after ambiguous writes;
- `UNKNOWN_AFTER_WRITE` / partial-state receipts;
- local canonical ownership and dedupe evidence;
- provider-specific truth instead of hiding failures behind generic success.

This is a positioning decision, not authorization for new code.

## Opportunity Map

| Category | Decision | Evidence / reasoning |
|---|---|---|
| **MUST MATCH** | Explicit target identity before provider writes | FYM multi-account `ACCOUNT_REQUIRED`; Soundiiz connected-channel troubleshooting; PR #41 already moves toward fingerprinting |
| **MUST MATCH** | Capability/action-specific truthful failures | Soundiiz + FYM capability matrices; #42 already owns the current search-quota parser gap |
| **SHOULD BE BETTER** | Exact reviewed source identity + bounded preview/apply + partial/unknown write receipt | Existing repo direction is narrower and safer than a generic music MCP; keep this visible and tested |
| **SHOULD BE BETTER** | Local canonical library that preserves user-owned classification/dedupe evidence | Active #9/#10/#12/#20 work; do not dilute with provider breadth |
| **DIFFERENTIATOR** | Truthful effect broker semantics over “assistant can edit playlists” | Competitors now offer MCP writes; correctness and recovery become more defensible than MCP presence itself |
| **ADJACENT IDEA** | Multi-account/channel selection only if owner evidence shows ambiguity | Research candidate only; no current incident/frequency evidence |
| **ADJACENT IDEA** | CLI for deterministic scripting | FYM proves the surface can coexist with MCP, but no owner workflow requires it today |
| **DO NOT COPY** | 17-provider breadth / transfer-SaaS competition | High auth/policy/maintenance cost; contrary to owner-approved simplify direction |
| **DO NOT COPY** | Desktop daemon merely to mirror FYM architecture | Current Node MCP already works without that dependency; no problem evidence |
| **DO NOT COPY** | SongMix-style social network/discovery feed | New category, moderation/privacy/distribution burden, no evidence |
| **DO NOT COPY** | Playlist artwork editing because YouTube increased image limits | Provider capability without demonstrated user job |

## Four-gate review

### Candidate: multi-account / multi-channel write targeting

#### 1. Problem / value

External evidence shows this is a real class of problem in the category:

- Free Your Music returns a typed selection state when more than one account is connected;
- Soundiiz warns that one Google account may contain multiple YouTube channels and that testing another channel does not validate the connected target.

Current repository evidence is weaker for this owner's product: the current workflow uses one credential store, and active PR #41 already adds a channel fingerprint. There is **no owner incident, no frequency data, and no supported multi-account promise**.

**Gate result: insufficient product-specific pain to create an Issue.**

#### 2. Priority

```yaml
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: LOW_MEDIUM
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

No P2/P1 claim is supported. External competitor support proves the workflow exists, not that this owner's users require it.

#### 3. Minimum solution if evidence appears later

Before adding schema/services:

1. prove a user actually has two candidate YouTube identities/channels in the supported workflow;
2. use the existing credential-status/fingerprint boundary to present the exact target identity;
3. fail closed if a write target is ambiguous;
4. add one deterministic two-identity fixture plus one provider-stub write assertion.

A database/account registry, hosted profile service, account-switching framework, cross-provider identity graph, or desktop bridge is not the minimum solution.

#### 4. Research / implementation separation

No Issue is created. No BUILD decision exists. The idea stays in the central radar as a bounded evidence question only.

## Existing Issue / PR calibration

### #42 — search quota / typed recovery

**No change.** The FYM free-tier search limit is a commercial-product limit and is **not evidence** about this owner's YouTube API quota, frequency, or severity. YouTube's own first-party `search.list` quota contract remains the authority for #42.

Classification remains:

```yaml
kind: MAINTENANCE
severity: P3
decision_priority: MEDIUM
triage: NEEDS_REVIEW
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

### #3 / PR #41 — credential lifecycle and channel fingerprint

The new competitor evidence increases **Strategic Fit** for showing a non-secret authenticated identity, but PR #41 is already active and the product-board review has its own blocker. This radar did not acquire a lease, comment on it, expand it into multi-account support, or alter implementation scope.

### #16 / PR #20 — batch import

Soundiiz's 2026-09-15 import flow is competitive validation of URL/file/plain-text ingestion plus review, but this is already inside active batch-import work. **DUPLICATE / ACTIVE_SCOPE; no new tracking.**

### #18 — recommendations / discovery research

SongMix and Free Your Music's broader discovery surfaces do not establish a current need for recommendation AI. #18 remains research-only; no severity or authorization uplift.

## Rejected Ideas

1. **“Competitor has 17 services, so add Spotify/Apple/Tidal now” — REJECT.** Provider count is not user-value evidence, and it multiplies auth/policy/runtime maintenance.
2. **“Competitor has local MCP, so add another MCP layer/desktop bridge” — REJECT.** This repository already is an MCP; copying transport architecture solves no observed problem.
3. **“Add multi-account support immediately” — REJECT / HOLD FOR EVIDENCE.** The external workflow is real, but owner-specific reachability/frequency is not established; PR #41's fingerprint is the smaller current step.
4. **“Make writes paid because FYM does” — REJECT.** Pricing is a design signal, not authority for billing/product changes.
5. **“Build cross-service social sharing/discovery” — REJECT.** SongMix represents category expansion, not this product's validated core job.
6. **“Add playlist artwork tooling after YouTube's 50 MB change” — REJECT.** New provider capability alone is not a root cause or user job.
7. **“General capability registry/framework” — REJECT.** Current supported provider set does not justify a framework; preserve small typed states where observed.

## Cross-portfolio ideas

One principle is worth carrying without creating a shared framework:

> **When an AI tool can cause an external side effect, ambiguity in account / identity / target should become an explicit typed decision state, not a silent default.**

This can be reused conceptually across travel, maps, calendar, music, and deployment tools, but this radar creates no cross-project Issue. Evidence and authorization must be re-established in each product.

## Issue Mapping

| Signal / fingerprint | Existing owner | Decision this round |
|---|---|---|
| YouTube search granular quota → generic 403 | #42 | unchanged; no comment |
| Credential/channel identity | #3 / PR #41 | external validation only; active scope, no comment |
| URL/file/text batch input | #16 / PR #20 | duplicate / active scope |
| recommendation/discovery breadth | #18 | remains research-only |
| multi-account/channel explicit selection | none | central RESEARCH candidate only; Gate 1 insufficient for Issue |
| broad multi-provider MCP parity | none | rejected as direction mismatch / no pain evidence |
| social playlist sharing | none | rejected category expansion |

Writes this round:

- **0 new Issues**
- **0 existing Issue comments/edits**
- **0 PR comments/edits**
- **0 issue locks acquired** (no Issue/shared-state mutation was needed)
- **1 create-only central radar report**

## Sources

### Primary / first-party

- Free Your Music MCP catalog — current, checked 2026-09-21: https://freeyourmusic.com/ai/mcp
- Free Your Music AI/local architecture — current, checked 2026-09-21: https://freeyourmusic.com/ai
- Free Your Music YouTube Music MCP — current, checked 2026-09-21: https://freeyourmusic.com/ai/youtube-music-mcp
- Free Your Music YouTube MCP — current, checked 2026-09-21: https://freeyourmusic.com/ai/youtube-mcp
- Free Your Music CLI — current, checked 2026-09-21: https://freeyourmusic.com/ai/cli
- Free Your Music npm publisher profile — current package-release evidence; exact initial MCP launch date not established: https://www.npmjs.com/~bimusiek
- Soundiiz Error 104 — updated 2026-09-04: https://support.soundiiz.com/hc/en-us/articles/8493033465746-Soundiiz-Error-104-Can-t-Delete-Rename-or-Remove-Duplicates-on-Some-Platforms
- Soundiiz YouTube playlist errors — updated 2026-08-23: https://support.soundiiz.com/hc/en-us/articles/36413540316946-Can-t-Create-or-Transfer-a-Playlist-to-YouTube-or-YouTube-Music
- Soundiiz import URL/file/plain text — updated 2026-09-15: https://support.soundiiz.com/hc/en-us/articles/37958924057234-How-to-Import-a-Playlist-from-a-URL-CSV-File-or-Plain-Text
- SongShift SongMix announcement — 2026-07-18: https://www.songshift.com/blog/introducing-songmix
- YouTube Data API revision history — checked 2026-09-21: https://developers.google.com/youtube/v3/revision_history
- YouTube Data API errors / playlist operation semantics — checked 2026-09-21: https://developers.google.com/youtube/v3/docs/errors

### Repository evidence

- `Reese-max/spotify-playlist-organizer-mcp@01f84bd496225c3b96d4a022fa8612320fba45df`
- `README.md`
- `src/youtube.js`
- existing Issues including #1, #2, #3, #9–#19, #21–#35, #42
- all-state PR surface #20, #36–#41
- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-19T1400Z-product-board-delta.md`
- prior focal radar `docs/competitive-intelligence/2026-09-19T040146Z-external-radar.md`
- preceding portfolio cursor report `docs/competitive-intelligence/2026-09-21T035919Z-external-radar.md`

## What Changed

Relative to the 2026-09-19 focal radar, the material new intelligence is not another YouTube endpoint change:

1. **A direct playlist-transfer competitor is currently operating a first-class local music MCP product** with broad service coverage, multiple AI hosts, capability-specific actions, multi-account selection, and active package releases.
2. This means `MCP + local transport + natural-language playlist writes` should be treated as increasingly commoditized product surface.
3. The repo's approved differentiation should narrow toward **identity correctness, authority separation, truthful receipts/reconciliation, and user-owned canonical state** rather than broadening into provider parity.
4. No new owner-specific user pain was established strongly enough to justify a new Issue.

No previous rejection reason was overturned. No active scope was expanded.

## Classification / scope calibration

- Competitor MCP presence: **CONFIRMED CURRENT**, exact initial launch date **UNKNOWN**.
- Package actively shipping this week: **CONFIRMED via current npm publisher index**, exact first release timestamp not claimed.
- Multi-account need in this repo: **UNKNOWN / NEEDS_EVIDENCE**.
- Cross-provider demand: **UNKNOWN / no owner evidence**.
- Existing exact-ID / truthful-receipt strategy: **supported by competitive differentiation logic**, not independently benchmarked as superior.
- No runtime benchmark was performed, so this report does not claim FYM failure semantics, latency, reliability, privacy, or write correctness are better/worse than this repository.

## Completion / gaps / cursor

Completed:

- fresh owner repository enumeration and pagination;
- governing rule read + blob SHA capture;
- current focal HEAD and owner direction recheck;
- open/closed Issue search and all-state PR recheck;
- historical focal radar/de-dup review;
- direct competitor, adjacent workflow, provider-change, distribution/pricing scan on the public web;
- four-gate evaluation with zero forced Issues;
- create-only central report write.

Not completed / deliberately not claimed:

- no FYM MCP live install or runtime comparison;
- no live YouTube provider write/auth/quota test;
- no user analytics or multi-account incidence measurement;
- no independent verification of competitor marketing claims;
- exact initial public launch date of Free Your Music MCP remains unavailable from sources inspected.

Fairness: this repo has now received a fresh follow-up after the academic-mcp cursor. Resume the colder unarchived surface already selected by the prior focal round. **Next cursor: `Reese-max/soundbox-offline`.**
