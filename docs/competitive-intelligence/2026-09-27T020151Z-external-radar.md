# External Competitive / New-Product / Workflow Radar — 2026-09-27T02:01:51Z

## Status / scope / evidence boundary

- Run status: **COMPLETE_FOCAL_ANALYSIS / FRESH_OWNER_INVENTORY / NO_NEW_ACTIONABLE_ISSUE / NO_NOTIFICATION**.
- Owner scope: `Reese-max` only. No third-party repository was modified.
- Governing rule re-read: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`.
- Rule blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Fresh connected owner inventory was paginated to exhaustion: **42 Reese-max-owned repositories visible / 41 unarchived / 1 archived (`obsidian-vault`)**; page 2 was empty.
- Focal product: `Reese-max/soundbox-offline`, owner-controlled, unarchived, default branch `main`.
- Current default-branch HEAD: `68d8137b77be063cc5ae5468e9e31b81455060a9` (`docs: record soundbox 50-persona round 4`). Latest default-branch change is audit/docs only; the most recent product baseline on default remains the previously shipped restore fix `44c22cc8d41f5944e0df811c96aa162d49db44e2`.
- Latest owner-approved direction re-read from `.github/quality-audits/2026-09-11-2215-product-board-audit.md` (blob `f067ffa8e7a2d71783cdd892a310a8d21be08e96`): **INVEST / SIMPLIFY**; recovery/integrity and executable CI evidence before import breadth; do not build a cloud catalog/service, social layer, subscription, recommendations, DRM, or native rewrite merely for parity.
- Active implementation/research scopes were re-read before considering any write:
  - #1 whole-library backup/restore is open; draft PR #12 `00d2c50...` is active (updated 2026-09-26).
  - #4 default-branch regression CI is open; PR #6 `ded8c632...` is active (updated 2026-09-26).
  - #3 same-LAN import research is open; draft PR #8 `721f1ec9...` is active (updated 2026-09-26) and still has unresolved P1/P2 review findings.
  - #10 embedded metadata preservation is open; draft PR #11 `664332eb...` is active (updated 2026-09-26).
- No product source, CI/config, secret, setting, deployment, runtime, GOAL, implementation branch, merge, paid request, or external write was started.

## Executive decision

**0 new Issues. 0 Issue/PR comments. 0 scope changes. 0 implementation authorizations.**

Fresh public-web research since the last Soundbox focal pass produced useful platform and market updates, but **no new signal crossed the four-gate threshold** without duplicating active work or relying on unvalidated user pain.

The strongest genuinely new technical signal is Chrome 154 (stable 2026-09-22): it adds a WebSocket `targetAddressSpace` option for public-origin clients reaching local/loopback servers with explicit Local Network Access permission, and it applies LNA restrictions to Background Fetch. This sharpens the transport/security truth for #3, but it **does not solve browser-to-browser receiving**: a PWA still does not become a listening WebSocket/HTTP server merely because outbound public→local connections are now better specified. Therefore it does not justify widening PR #8 or replacing its WebRTC/baseline experiment.

Recent local-first players also continue to converge on the same jobs Soundbox already tracks: local metadata first, recoverable libraries, offline playback, optional network enhancement, and explicit provenance around migrations. The incremental competitive evidence reinforces existing #1/#10/#3 sequencing rather than creating another feature lane.

## Product → market category

| Product | Market / alternatives | Current differentiated job |
|---|---|---|
| `soundbox-offline` | Kasette, Vibe, Sona, Trove, RE-KORD, PPPlayer, OS Files/USB, LocalSend | User-owned local audio → explicit import → organize/play offline/background → recover the library without requiring an account/server music catalog |

## External Signals

### A. Direct-category current signal — Sona 0.5.0 public preview narrows metadata/recovery design

**CONFIRMED current capability; exact public-preview release date not established on the first-party page; checked 2026-09-27.**

First-party source: https://sona.yanbaoli.me/

Sona positions itself as a Windows/Android local-first player whose core library, queue, favorites, playlists and history remain usable offline. Its metadata pipeline is explicitly layered:

1. read embedded media tags locally;
2. clean filenames;
3. optionally query MusicBrainz;
4. optionally use Chromaprint/AcoustID;
5. present candidate metadata for confirmation before overwrite.

It also states that 0.5.0 supports complete library backup/restore and warns users to back up before migrations that may clear app-private state.

**User job:** preserve useful existing metadata and recover local state without turning the player into a cloud dependency.

**Transferable design:** local evidence first, fallback second, and do not silently overwrite user-owned metadata.

**Decision:** **DUPLICATE / ACTIVE_SCOPE**. Soundbox #10 + draft PR #11 already own the narrow local-tag-first behavior. Sona’s online enrichment, fingerprint lookup, cloud recycle bin and broader edit-history system are not justified by current Soundbox evidence. No comment and no scope expansion.

### A2. Direct/adjacent market signal — RE-KORD 4.3 demonstrates that QR/LAN convenience usually comes with an explicit host/server boundary

**CONFIRMED current 4.3 product capability; checked 2026-09-27.**

First-party source: https://re-kord.com/
Download/architecture source: https://re-kord.com/download

RE-KORD 4.3 exposes a Server where the library lives, plus clients that connect over LAN or Cloudflare. Its Android client pairs by QR and keeps library/media on the server. This reduces mobile import friction, but it does so by adopting a persistent host/API model.

**User job:** access owned music from another device without manually copying every file first.

**Transferable design:** QR onboarding and explicit network topology make the transport model understandable.

**Do not copy:** the persistent server/NAS/tunnel architecture. Soundbox’s approved moat remains browser-local ownership with no required server. This is supporting evidence for keeping #3 as a bounded experiment rather than silently evolving Soundbox into a home music server.

### B. Adjacent workflow / platform — Chrome 154 clarifies Local Network Access, but does not create a browser-only receiver

**CONFIRMED — Chrome 154 stable 2026-09-22; checked 2026-09-27.**

Primary source: https://developer.chrome.com/release-notes/154

Chrome 154 adds:
- `WebSocket(url, { targetAddressSpace: "local" | "loopback" })`, allowing a public-origin client to connect to a local/loopback server subject to Local Network Access permission;
- LNA enforcement for Background Fetch, preventing it from bypassing the same local-network permission boundary.

**Impact on #3:** this is useful feasibility/security evidence, but only for topologies where a reachable local server already exists. It does not let the mobile Soundbox PWA or desktop sender browser open an inbound listening socket. Therefore it does not remove the need to test WebRTC/signaling or retain Files/LocalSend as the zero-build baseline.

**Decision:** `SKIPPED_ACTIVE_SCOPE` for #3/PR #8. The external platform signal is new, but PR #8 is active and still has unresolved P1 findings around “not connected to the actual app,” pairing-expiry enforcement, and full-file memory buffering. No lock or comment was taken.

### C. Market scan — September continues to produce local-player entrants, but breadth is not value evidence

**CONFIRMED secondary market roundup dated 2026-09-25, then first-party checked where possible.**

Discovery source: https://www.blisshq.com/music-library-management-blog/2026/09/25/this-month-digital-music-libraries-september-2026/
PPPlayer first-party: https://ppplayer.com/

The September roundup highlights new cross-platform/local-player entrants and renewed interest in owned-file playback. PPPlayer currently emphasizes no account/subscription and cross-platform distribution, but its first-party page also says Internet is required for streaming, so it is not treated here as evidence that Soundbox should add cloud streaming or multi-platform native clients.

**Decision:** market-category confirmation only. No feature parity inference.

## New Releases / product changes

| Date | Product/platform | Signal | Classification / decision |
|---|---|---|---|
| 2026-09-22 | Chrome 154 | WebSocket `targetAddressSpace`; Background Fetch LNA enforcement | **CONFIRMED** technical evidence for #3; no new Issue |
| 2026-09-25 | bliss monthly market roundup | multiple new local-player entrants in September | **LIKELY category-growth signal**; not user-value proof |
| current 0.5.0 preview | Sona | local-first layered metadata + full backup/restore | **CONFIRMED current capability**; dedupes into #10/#1 |
| current 4.3 | RE-KORD | QR-paired Android client to explicit server/LAN/tunnel | **CONFIRMED current capability**; useful topology counterexample for #3 |

No pricing change was promoted into a product decision. No competitor claim was treated as an independent benchmark.

## Community Pain

No new Reddit/Hacker News anecdote crossed the evidence bar this round. Existing community pain around phone/local-file transfer remains directional only and is already represented by #3. No prevalence or ROI claim was inferred.

## Adjacent Ideas

### 1. Explicit “metadata confidence/source” only if #10 later proves ambiguity

Sona’s layered pipeline makes provenance visible by asking for confirmation before overwriting metadata. Soundbox’s current #10/PR #11 is intentionally narrower: embedded local MP3 tags first, then catalog/filename/default fallback.

**Hold:** if runtime evidence later shows users cannot tell whether title/artist/album came from embedded tag, catalog match or filename inference, a tiny source indicator may be worth testing. Do not add a metadata registry, edit-history subsystem, MusicBrainz, fingerprinting, or cloud enrichment now.

### 2. LAN topology receipt, not a new transport stack

If #3 reaches BUILD after its spike, the UI should continue to state the observed path (`LAN direct / P2P with signaling / relayed / external baseline`) rather than market every route as “local.” Chrome 154 strengthens this truth requirement; it does not create a new implementation lane.

## Opportunity Map

| Category | Decision | Rationale |
|---|---|---|
| **MUST MATCH** | truthful local import/playback and fail-closed recoverability | core owner direction; #1 remains active |
| **MUST MATCH** | network/import copy must reflect actual transport and permissions | #3 already owns this; Chrome 154 reinforces LNA truth |
| **SHOULD BE BETTER** | preserve embedded metadata locally before guessing | #10/PR #11 already active |
| **SHOULD BE BETTER** | keep large/local libraries usable only when measurement shows a problem | no fresh runtime pain; do not add speculative scaling work |
| **DIFFERENTIATOR** | installable local-first PWA with no required account/server library | retain; do not trade for server/NAS breadth |
| **ADJACENT IDEA** | explicit metadata-source indicator if ambiguity appears in runtime/user tests | no Issue now |
| **DO NOT COPY** | MusicBrainz/AcoustID/cloud recycle bin/edit-history breadth now | unproven need; expands privacy/state surface |
| **DO NOT COPY** | persistent music server/NAS/tunnel as the default architecture | conflicts with approved zero-required-server product boundary |
| **DO NOT COPY** | native multi-platform rewrite just because competitors are native | owner direction remains PWA-first/local-first |

## Four-gate assessment

### Candidate: metadata source / confidence indicator

1. **Problem/value:** plausible trust improvement, but there is no current user/runtime evidence that users are harmed by not knowing whether metadata came from ID3, catalog match or filename fallback.
2. **Priority:** `kind=OPPORTUNITY`, `severity=NOT_ESTABLISHED`, `decision_priority=LOW`, `triage=NEEDS_EVIDENCE`, `auto_implementation=false`.
3. **Minimum solution:** no code now. If #10 later ships and ambiguity is observed, first test a tiny read-only source label on imported metadata; do not create edit history, a metadata ledger or online enrichment.
4. **Research/implementation separation:** current result **REJECT_FOR_NOW as an Issue**; retain as a future trigger.

### Candidate: replace #3’s WebRTC research with Chrome 154 local WebSocket

1. **Problem/value:** browser-to-phone transfer friction is already validated only at product-fit level and tracked by #3.
2. **Priority:** no new kind/severity; this is technical evidence inside existing research.
3. **Minimum solution:** do not replace the experiment. A local WebSocket still requires a listening local server, which the browser-only Soundbox topology does not have.
4. **Research/implementation separation:** **NARROW / no change**. Keep Chrome 154 as a constraint/source for the existing BUILD/NARROW/REJECT experiment; do not expand active PR #8.

## Rejected Ideas / reasons

1. **Open a “metadata provenance” feature now — REJECT FOR NOW.** No current pain; #10 is already active.
2. **Add MusicBrainz/Chromaprint because Sona does — REJECT.** Introduces network/privacy/cost/dependency surface without validated Soundbox need.
3. **Add automatic cloud recycle-bin/sync — REJECT.** Conflicts with approved local-first/no-required-cloud direction and active recovery work.
4. **Replace #3 with a local WebSocket design because Chrome 154 added `targetAddressSpace` — REJECT.** It is an outbound-client capability and still assumes a local server.
5. **Adopt RE-KORD-style server/NAS/tunnel breadth — REJECT.** Different architecture and maintenance model.
6. **Open another LAN-import Issue — DUPLICATE.** #3/PR #8 own the fingerprint.
7. **Open another embedded-tag Issue — DUPLICATE.** #10/PR #11 own the fingerprint.
8. **Add large-library optimization now — REJECT FOR NOW.** No measured current Soundbox bottleneck.

## Issue Mapping

| External signal | Existing scope | Action |
|---|---|---|
| Sona local-tag-first pipeline | #10 + draft PR #11 | `DUPLICATE / SKIPPED_ACTIVE_SCOPE`; no comment |
| Sona backup/recovery | #1 + draft PR #12 | supporting evidence only; no scope expansion |
| Chrome 154 LNA/WebSocket | #3 + draft PR #8 | `SKIPPED_ACTIVE_SCOPE`; no comment |
| RE-KORD QR/server model | #3 | counterexample/topology evidence only |
| new September local-player entrants | none | central-market note only; not an Issue |

No Issue lock marker was needed because no Issue/comment/shared mutable tracking state was changed. The report uses a unique create-only path.

## Sources

Checked 2026-09-27 UTC unless otherwise stated.

1. Chrome 154 release notes — stable 2026-09-22: https://developer.chrome.com/release-notes/154
2. Sona current product / 0.5.0 public preview: https://sona.yanbaoli.me/
3. RE-KORD 4.3 current product: https://re-kord.com/
4. RE-KORD 4.3 download / server-client topology: https://re-kord.com/download
5. bliss — “This month in digital music libraries — September 2026”, published 2026-09-25: https://www.blisshq.com/music-library-management-blog/2026/09/25/this-month-digital-music-libraries-september-2026/
6. PPPlayer current product: https://ppplayer.com/

GitHub was used for owner scope, current repository truth, active Issue/PR coordination, historical radar/dedupe, and this report write—not as the primary external intelligence source.

## What Changed

Relative to the last focal Soundbox radar (2026-09-21):

1. Chrome 154 became stable on 2026-09-22 and adds concrete first-party Local Network Access/WebSocket behavior relevant to #3, but does not make browser-only inbound receiving possible.
2. New/current local-player products continue to validate local-first metadata/recovery, but the meaningful jobs remain mapped to active #1/#10/#3.
3. Active implementation/research branches changed materially on 2026-09-26 (PRs #6/#8/#11/#12), so this round explicitly avoided comments/scope edits.
4. No external evidence overturned owner direction, established a new P0/P1/P2 defect, or justified a new bounded research Issue.
5. No prior rejected direction was reopened.

## Classification / scope calibration

- #1: no external reclassification; data-integrity/recovery work remains active.
- #4: no external reclassification; CI execution remains higher priority than feature breadth.
- #3: remains an active bounded research/differentiator lane; Chrome 154 is supporting technical evidence, not BUILD authorization.
- #10: remains the narrow embedded-metadata lane; Sona supports staged local-first handling but does not justify online enrichment or broader metadata architecture.
- New “metadata source indicator” candidate remains `OPPORTUNITY / NOT_ESTABLISHED / LOW / NEEDS_EVIDENCE / auto_implementation=false` and is **not opened**.

## Completion / gaps / cursor

Completed:
- governing Issue Quality v2 reread and blob capture;
- fresh paginated owner inventory;
- current Soundbox repo, README, default HEAD and owner direction refresh;
- relevant open Issue / all-state PR / active-scope coordination read;
- historical Soundbox radar and rejection review;
- fresh public-web scan covering direct/local-player entrants, adjacent server/local workflows and current browser-platform changes;
- four-gate assessment and Opportunity Map;
- unique central report write attempt.

Not completed / deliberately not claimed:
- no Soundbox mobile/PWA runtime on Safari 27 or Chrome 154;
- no live LAN/WebRTC/WebSocket transfer test;
- no tagged-file runtime test from PR #11;
- no destructive restore test from PR #12;
- no user study showing metadata-source ambiguity or transfer-prevalence;
- no competitor benchmark proving performance or task-completion gains.

**Next fair cursor: `Reese-max/skill-foundry`.**
