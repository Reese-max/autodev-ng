# External Competitive / New-Product / Workflow Radar — 2026-09-21T07:59:45Z

## Status / scope / evidence boundary

- Run status: **COMPLETE_FOCAL_ANALYSIS / FRESH_OWNER_INVENTORY / ZERO_FORCED_ISSUES**.
- Owner scope: `Reese-max` only. No third-party repository was modified.
- Governing quality gate re-read: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Quality-rule blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh connected owner enumeration was paginated to exhaustion: **41 Reese-max-owned repositories visible / 41 unarchived**; page 2 was empty for both owner and `archived:false` searches. This differs from older inventory snapshots; no cause is inferred from the count change alone.
- Fair cursor entering this round: `Reese-max/soundbox-offline`, carried forward by `2026-09-21T060241Z-external-radar.md`.
- Focal default branch: `main@68d8137b77be063cc5ae5468e9e31b81455060a9` (`docs: record soundbox 50-persona round 4`). The latest default-branch commit is audit-only; product behavior was checked against current source, not inferred from open PRs.
- Owner-approved direction rechecked from the current product-board audit and the 2026-09-18 delta: **INVEST / SIMPLIFY**. Prioritize restore integrity, executable regression coverage, bounded LAN-import research, and trustworthy local ownership. Do not turn the product into a cloud music service, social network, subscription product, generic transfer utility, DRM/catalog service, or native-app rewrite merely for parity.
- Existing Issues and all-state PRs were re-read. In particular, PR #8 (`feat: add browser network music import (#3)`) remains active and lacks real browser/WebRTC live-transfer execution; PR #9 and older dependency/security work are also open. This radar does not alter or compete with those scopes.
- No browser/device runtime, CI, deployment, provider call, production data mutation, source/config/CI/settings/secrets change, implementation branch, merge, worker, or GOAL was started.

## Executive decision

**0 new Issues. 0 existing Issue/PR comments. 0 implementation authorizations.**

Two fresh external signals are useful, but neither clears the evidence threshold for a new implementation ticket:

1. **Vibe 0.6.2 (2026-09-03)** is a recent direct-category offline local music player that explicitly advertises virtualized rendering for libraries with thousands of songs. Soundbox's current source loads all IndexedDB track records via `getAll()` and renders every filtered row with a plain `.map(...)`. That is enough to justify a bounded large-library **validation question**, not enough to claim a user-facing performance defect or to authorize virtualization.
2. **Safari 27.0 (2026-09-17)** fixed a WebKit issue where media playback could not advance to the next playlist item when the tab was backgrounded, alongside several IndexedDB reliability fixes. Because Soundbox advertises queue/background Media Session behavior and is phone-first, this lowers one browser-platform uncertainty and creates a useful revalidation target. It does not prove current Soundbox is broken or fixed on iPhone/PWA without execution.

The correct action is therefore **measure before building**. No prior rejection reason was overturned and no active PR scope should be expanded.

## Product → market category

| Product | Market / direct alternatives | Current core job |
|---|---|---|
| `soundbox-offline` | Vibe, Kasette, Trove, Aulosyne, PeerPlay, LocalSend, Plexamp, OS Files/USB | Own local audio → import → organize → play offline/background → recover the library without an account/server |

## Current product reality

Current source and owner documents establish:

- audio blobs live in browser IndexedDB; playlists/player state are local;
- no account or server-side user music library is required;
- import/playback/search/sort/playlists/favorites/queue/metadata editing/Media Session/PWA/backup-restore are supported product surfaces;
- `getStoredTracks()` currently reads the whole object store with `getAll()`;
- the library UI filters/sorts the in-memory `tracks` array and renders all `filteredTracks` rows directly;
- large-library behavior has not been runtime-benchmarked in this radar;
- current #10 already tracks embedded tag preservation; current #3/PR #8 already owns bounded browser-to-browser import research.

The 2026-09-18 product-board delta already recorded a synthetic 2,000-track journey as unknown and keeps higher-priority integrity/validation work ahead of feature expansion. Synthetic personas are not user evidence and are not used here to assert prevalence.

# External Signals

## A. Direct competitor — Vibe makes large-library fluidity an explicit product contract

**Status:** CONFIRMED current distribution claim; no independent performance benchmark.  
**Version/date:** Vibe 0.6.2 added to F-Droid **2026-09-03**; public launch 0.6.0 added **2026-08-29**.  
**Accessed:** 2026-09-21.  
**Source:** https://f-droid.org/en/packages/dev.fiedri.vibe/

F-Droid's current package page describes Vibe as a 100% offline local music player and explicitly states it uses **virtualized rendering to smoothly handle libraries with thousands of songs**. The same listing includes playlists, JSON playlist backup/restore, album/artist views, search, smart queue, sorting and favorites.

### User job / manual-step implication

For a user carrying a large owned library, the job is not merely “can the app store 2,000 tracks?” It is:

`open library → find/sort/scroll → start playback without the UI becoming the bottleneck`.

If large-list rendering becomes slow, users compensate by splitting libraries, searching less, or waiting for every navigation. None of those breakpoints has been observed in Soundbox yet; this is why the signal remains a validation hypothesis.

### Transferable design

- Treat large-library responsiveness as a measurable supported-path property rather than assuming IndexedDB capacity implies usable UI capacity.
- Benchmark the existing implementation first.
- If current behavior is already acceptable at the owner-relevant scale, **REJECT** extra list infrastructure.

### Do not copy

- Do not add virtualization only because a competitor names it.
- Do not adopt Vibe's native Android packaging or platform permissions.
- Do not turn “thousands” into a fake Soundbox SLA without device/browser measurements.

**Decision:** `VALIDATION_GAP / severity=NOT_ESTABLISHED / decision_priority=LOW_MEDIUM / triage=NEEDS_EVIDENCE / auto_implementation=false`. Central report only; no Issue.

---

## B. Browser-platform change — Safari 27 improves exactly the background media + IndexedDB substrate Soundbox depends on

**Status:** CONFIRMED first-party WebKit release behavior.  
**Release:** Safari 27.0, **2026-09-17**.  
**Accessed:** 2026-09-21.  
**Source:** https://webkit.org/blog/18325/webkit-features-for-safari-27-0/

WebKit's Safari 27.0 release notes include a fix for a case where **media playback could not move to the next item in a playlist while the tab was in the background**. The same release also fixes IndexedDB issues involving initial-version abort handling, worker connections recovering after a network-process crash, and transactions delayed by a background-suspended page.

This is directly relevant to Soundbox's supported primitives: IndexedDB music storage, playlist/queue state, background playback and Media Session integration.

### User job / manual-step implication

A phone user expects:

`start queue → lock/switch away → current track ends → next track continues`.

Before Safari 27, WebKit itself had a resolved defect on that path. After Safari 27, that particular platform defect is no longer a valid reason to assume the same failure continues, but Soundbox still needs an actual current Safari/PWA run before claiming reliable behavior.

### Minimum next experiment

No product code change is required to answer the question:

1. current Soundbox SHA on an authorized iPhone/iPad Safari 27 environment;
2. import two small owned/generated audio fixtures;
3. queue A → B, background/lock the PWA/browser during A;
4. record whether B begins automatically, Media Session metadata advances, and player state persists after foregrounding/reload;
5. record exact browser/OS/build and result.

Exit:

- **REJECT new work** if current path completes reliably;
- **NARROW** if only one lifecycle transition fails;
- **BUILD** only if a reproducible Soundbox-controlled failure remains after separating browser/platform behavior.

**Decision:** `VALIDATION_GAP / severity=NOT_ESTABLISHED / decision_priority=MEDIUM / triage=NEEDS_EVIDENCE / auto_implementation=false`. No Issue until an actual supported-path result establishes product-owned work.

---

## C. Adjacent product pattern — Aulosyne keeps optional network features outside the offline core

**Status:** CONFIRMED current first-party positioning.  
**Privacy policy effective:** **2026-08-15**.  
**Accessed:** 2026-09-21.  
**Source:** https://www.aretivo.com/

Aulosyne describes itself as **offline-first, not artificially offline-only**: local playback works without the internet, while optional features use internet/local-network access only when enabled or requested. It also states no account and no behavioral analytics.

This is useful primarily as a boundary signal. Soundbox already follows the stronger side of this pattern for its core library. Future network-adjacent work (#3 LAN import or any later enrichment) should remain optional and should not become a prerequisite for local playback/recovery.

**Decision:** confirms existing direction; no new fingerprint and no Issue.

---

## D. Direct-category expansion — Trove is moving local-first music across Apple devices and NAS sources

**Status:** CONFIRMED current first-party product claim; exact Mac shipping day not stated.  
**Event:** Mac build shipped in **September 2026**.  
**Accessed:** 2026-09-21.  
**Sources:** https://troveplayer.com/ and https://troveplayer.com/about

Trove now positions one native product across Mac, iPhone, iPad and Apple Watch, with local files, folder/Wi-Fi import and optional WebDAV/SMB network sources. Its current pricing is free core plus a one-time Pro unlock rather than a subscription.

The market signal is that local-library products can expand by following users across devices without becoming streaming catalogs. However, Soundbox has an explicit PWA/local-browser direction and no evidence that native multi-device or NAS access is the next owner problem.

**Decision:** `DO NOT COPY` for native rewrite/NAS integration now. Preserve as market context only.

# New Releases

| Date | Product / platform | Signal | Radar decision |
|---|---|---|---|
| 2026-09-17 | Safari 27.0 | Background playlist-advance fix + IndexedDB reliability fixes | Bounded current-device validation; no Issue |
| 2026-09-03 | Vibe 0.6.2 | Current direct offline player explicitly targets thousands-song fluidity with virtualized rendering | Large-library validation candidate; no implementation ticket |
| 2026-08-29 | Vibe 0.6.0 | Public launch with local library, playlists, backup, queue/search/favorites | Direct-category reference; no parity checklist |
| Sep 2026 | Trove Mac | Local-first Apple-device/NAS product expands to desktop | Market strategy context; DO NOT COPY native/NAS scope |

# Community Pain

No new community anecdote was promoted into a retained finding this round. The useful current signals above already come from distribution/product/platform sources, and there is no need to manufacture a prevalence claim from isolated posts.

# Adjacent Ideas

## 1. Large-library performance as a bounded validation fixture

Before adding virtualization, pagination or a new data layer, test the existing path at a small ladder such as 100 / 1,000 / 2,000 representative metadata records on a supported phone/browser. Record cold-load time, interaction readiness, search/sort latency and scroll responsiveness. Use generated/owned fixtures and tie every result to SHA/environment.

The experiment is deliberately able to return **REJECT**. If existing behavior is sufficient for the intended scale, no code should be added.

## 2. Re-run iOS background queue behavior after Safari 27

The new WebKit fix makes a previous platform limitation less useful as a standing assumption. A single current-device replay can convert uncertainty into either “supported on this tested path” or a reproducible product gap.

## 3. Keep optional network features subordinate to local ownership

Aulosyne and Trove both illustrate that local-first products can add network-adjacent capabilities without making cloud accounts or hosted catalogs foundational. For Soundbox, that remains a design guardrail, not a new architecture project.

# Opportunity Map — `soundbox-offline`

| Category | Decision this round |
|---|---|
| MUST MATCH | Reliable local import/playback, background queue behavior on claimed supported paths, recoverable local storage, backup/restore and honest failures. |
| SHOULD BE BETTER | Demonstrate that the library remains usable at an owner-relevant collection size; keep platform support claims tied to actual runtime evidence. |
| DIFFERENTIATOR | No-account/no-server local ownership plus recoverability; browser-to-browser import only if #3 proves the end-to-end path safely. |
| ADJACENT IDEA | Bounded large-library benchmark; Safari 27 queue/background replay; optional network features that never become core-library dependencies. |
| DO NOT COPY | Native rewrite, NAS/WebDAV/SMB subsystem, streaming catalog, subscription gate, social/discovery feed, universal transfer utility, AI recommendations or advanced DSP solely for parity. |

# Four-gate decisions

## Candidate 1 — thousands-track responsiveness

- **Problem/value:** current source reads all tracks and renders all filtered rows; direct competitor Vibe explicitly optimizes this job. Actual Soundbox user incidence and failure threshold remain unknown.
- **Priority:** `VALIDATION_GAP / NOT_ESTABLISHED / LOW_MEDIUM / NEEDS_EVIDENCE`.
- **Minimum:** no code first; run a bounded scale fixture on actual supported runtime. Documentation is enough if the owner chooses a deliberately small supported-library boundary; virtualization becomes relevant only after reproducible evidence.
- **Research/implementation separation:** BUILD only after the experiment proves the current all-row path materially fails at an owner-relevant scale. No Issue now.

## Candidate 2 — Safari 27 background queue replay

- **Problem/value:** Safari 27 fixed a browser bug on a Soundbox-relevant background playlist path. Whether current Soundbox now completes the journey is unknown.
- **Priority:** `VALIDATION_GAP / NOT_ESTABLISHED / MEDIUM / NEEDS_EVIDENCE`.
- **Minimum:** two-track device replay; no code or framework.
- **Research/implementation separation:** a successful replay closes the question for that path; a failure must first be localized to product vs platform. No Issue now.

## Existing candidate — embedded metadata preservation

- Existing #10 already owns `local file contains tags → canonical importer ignores them → manual recreation`.
- Kasette/Trove-like metadata patterns are duplicate supporting context, not a reason to open another ticket.
- No new evidence this round changes #10's `OPPORTUNITY / NOT_ESTABLISHED / MEDIUM / NEEDS_REVIEW / auto_implementation=false` classification.

## Existing active scope — browser LAN import

- #3 / PR #8 remains active and has unresolved product-board/review findings.
- No current external signal justifies expanding its transport surface or taking ownership from its active implementer.
- Result: **SKIPPED_LOCKED_ACTIVE_PR**; no Issue/PR comment.

# Issue Mapping / dedupe

| Signal | Existing/new owner | Result |
|---|---|---|
| Large-library rendering at thousands scale | none | Central validation candidate only; evidence insufficient for Issue |
| Safari 27 background playlist / IndexedDB improvements | none | Runtime revalidation candidate only; no defect claimed |
| Embedded file tags | existing #10 | DUPLICATE context; no update |
| LAN/browser transfer | #3 / PR #8 | SKIPPED_LOCKED_ACTIVE_PR; no write |
| Native multi-device / NAS expansion | none | DO NOT COPY |

**Writes this round:** central report only. No Issue lock was needed because no existing Issue/shared tracking state was modified.

# Rejected Ideas

- **Implement virtualization immediately** — rejected; competitor implementation choice is not Soundbox failure evidence.
- **Add a performance framework/database/index layer** — rejected; first answer whether the current path fails at a relevant scale.
- **Create a Safari workaround before testing Safari 27** — rejected; first-party platform evidence says a relevant browser defect was fixed.
- **Native iOS/macOS rewrite** — rejected; owner direction remains PWA/local-browser and no current user evidence overturns it.
- **NAS/WebDAV/SMB support** — rejected; it expands trust, networking, credential and support boundaries without evidence that this is the current core bottleneck.
- **Copy competitor subscriptions, DSP, social/discovery or cloud enrichment** — rejected as unrelated to the currently evidenced local ownership/recovery job.

# Sources

Public web, primary intelligence:

1. F-Droid — Vibe Music Player 0.6.2 / 0.6.0 release and current capability: https://f-droid.org/en/packages/dev.fiedri.vibe/
2. WebKit — Safari 27.0 release notes, 2026-09-17: https://webkit.org/blog/18325/webkit-features-for-safari-27-0/
3. Aretivo — Aulosyne offline-first/privacy positioning; privacy policy effective 2026-08-15: https://www.aretivo.com/
4. Trove Player — current local-first Apple-device/NAS capabilities and pricing: https://troveplayer.com/
5. Trove About — Mac build shipped in September 2026: https://troveplayer.com/about

GitHub evidence was used only for owner scope, direction, source truth, dedupe, active-work coordination and this report write.

# What Changed

Relative to the last focal Soundbox radar (`2026-09-18T021244Z`):

1. A recent direct-category player, Vibe 0.6.2, gives a concrete current market signal that large local libraries are being treated as a responsiveness contract, not merely a storage-capacity problem.
2. Safari 27.0 shipped 2026-09-17 with a first-party fix directly touching background playlist advancement plus IndexedDB reliability fixes, making current iOS/PWA revalidation more valuable and reducing justification for pre-emptive workaround code.
3. None of these signals establishes current Soundbox user pain, severity or implementation authorization.
4. Owner direction remains unchanged: integrity/recovery and truthful supported-path evidence outrank feature parity.
5. No prior rejection was overturned and no active scope was expanded.

# Completion / gaps / cursor

Completed:

- governing Issue Quality v2 reread and blob SHA capture;
- fresh paginated owner/unarchived inventory;
- current Soundbox HEAD, README/source, latest owner direction and recent product-board delta recheck;
- all-state Issue/PR coordination read sufficient to avoid active-scope collision;
- prior Soundbox radar and rejection/dedupe review;
- fresh public-web scan across direct local-player competitors, adjacent local-first products and browser-platform changes;
- four-gate evaluation;
- create-only central report write.

Not completed / deliberately not claimed:

- no real iPhone/iPad Safari 27 Soundbox run;
- no 100/1,000/2,000-track runtime benchmark;
- no independent benchmark proving Vibe's thousands-song claim;
- no user analytics or interviews establishing large-library prevalence;
- no CI/deployment/provider execution.

Fairness: `soundbox-offline` has now received the queued focal pass. The current portfolio sequence already identified the next colder surface after this repo. **Next cursor: `Reese-max/skill-foundry`.**
