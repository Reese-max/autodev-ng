# Product Board Delta — soundbox-offline PR #8

- Checked: 2026-09-18 UTC
- Status: **PARTIAL / 5 NEW ACTIONABLE FINDINGS / SKIPPED_LOCKED / NOT CLEAN**
- Quality v2 blob: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Portfolio inventory: 41 Reese-max-owned repositories; 40 unarchived; `obsidian-vault` archived and excluded from product mutation
- Repository default HEAD: `68d8137b77be063cc5ae5468e9e31b81455060a9` (audit-only)
- Last substantive default-branch product SHA: `44c22cc8d41f5944e0df811c96aa162d49db44e2`
- Candidate: [PR #8](https://github.com/Reese-max/soundbox-offline/pull/8), head `c5c94cc183b40b859fe1a2c314a12ff2d6a8fd67`
- Existing tracking: [Issue #3](https://github.com/Reese-max/soundbox-offline/issues/3)
- Fair cursor: `soundbox-offline` → next `skill-foundry`
- Scope: audit and triage only; no product, workflow, secret, setting, branch, merge, deploy, or paid-provider mutation

## Executive result

PR #8 turns the bounded browser-to-browser import research direction in #3 into an implementation candidate, but the candidate is not ready to merge. Five distinct root causes pass the actionability threshold. They are all confined to the active, unmerged PR and therefore are calibrated as **P2 / HIGH_PRE_MERGE**, not as default-branch P1 incidents. All five are `SOURCE_CONFIRMED / NEEDS_REVIEW / NEEDS_RUNTIME_VERIFICATION / auto_implementation=false`.

The smallest safe decision is to keep the work as a bounded spike until the user-visible transport is real, the original offer controls the pairing lifetime, hostile manifests are rejected before planning, and large-file assembly has a measured mobile-safe memory contract. This does not authorize a general sharing platform, relay service, native rewrite, identity system, or background synchronization service.

## Discovery and delta

The prior [2026-09-16 Soundbox product-board delta](https://github.com/Reese-max/autodev-ng/blob/58a1eb7a03c6ac8be06f497e6cfefa55f51f0c67/docs/portfolio-audit/2026-09-16T1958Z-product-board-delta.md) found no new product change and kept #3 as research. Since then PR #8 introduced `app/network-import.ts` and tests, but not a default-branch product change.

Existing default-branch priorities remain unchanged:

1. [#1](https://github.com/Reese-max/soundbox-offline/issues/1) corrupt-but-JSON-valid restore can overwrite good same-ID audio: **P0 / STILL_REPRODUCIBLE from unchanged source / browser runtime pending**.
2. [#4](https://github.com/Reese-max/soundbox-offline/issues/4) checked-in gates omit the regression suite: **P2 validation gap**.
3. [#5](https://github.com/Reese-max/soundbox-offline/issues/5) affected RSC dependency line: **P2 security/upstream; deployed exposure unknown**.
4. [#3](https://github.com/Reese-max/soundbox-offline/issues/3) remains a bounded research direction and does not itself authorize implementation or merge.

No existing audit, Issue, or closed decision was found that separately carries the five fingerprints below. Each is already represented by an unresolved PR review thread, so no duplicate Issue was created.

## Findings and four-gate decisions

### F1 — Pairing session is not connected to a usable product path

- Tracking: [review thread](https://github.com/Reese-max/soundbox-offline/pull/8#discussion_r4034924485)
- Fingerprint: `soundbox-offline+network-import+start browser pairing+advertised import cannot be initiated+placeholder SDP/no RTCPeerConnection or UI wiring`
- Classification: `VALIDATION_GAP / severity=P2 / decision_priority=HIGH_PRE_MERGE / NEEDS_REVIEW`
- Evidence: `createReceiverPairingSession` returns placeholder SDP; `acceptAnswer` validates and discards the remote SDP. The module is only referenced by its tests, with no pairing UI, `RTCPeerConnection`, data-channel handler, or canonical `receiveFiles` integration.
- Affected personas: mobile users importing a first library, users without USB access, and non-technical users following the advertised QR/manual pairing journey.
- Expected: two browser peers negotiate a channel, show recoverable connection state, transfer bytes, and hand accepted files to the existing import contract.
- Actual: no supported user path can initiate or complete the feature.
- Consequence if merged: a claimed core task ships as unreachable scaffolding and tests may falsely suggest end-to-end coverage.
- Minimum effective change: either keep the code explicitly as a non-product spike, or connect one complete receive path through a real peer connection/data channel and existing importer. Do not add relay servers, accounts, or general device discovery.
- Direct acceptance:
  1. a supported UI can create and consume a real offer/answer;
  2. both peers observe a data channel open before transfer;
  3. one small audio file reaches the canonical importer;
  4. cancellation/error state is visible and recoverable;
  5. the test fails when the connection or importer wiring is removed.

### F2 — An answer can extend the offer's advertised expiry

- Tracking: [review thread](https://github.com/Reese-max/soundbox-offline/pull/8#discussion_r4034924496)
- Fingerprint: `soundbox-offline+pairing-auth+accept answer after offer expiry+stale token remains valid+answer-controlled expiresAt`
- Classification: `BUG / severity=P2 / decision_priority=HIGH_PRE_MERGE / NEEDS_REVIEW`
- Evidence: answer decoding validates the expiry supplied by the answer, but does not reject against the receiver's original `payload.expiresAt`. A peer that learned the session ID and token before expiry can submit a later timestamp and be accepted after the displayed five-minute window.
- Affected personas: shared-network users who rely on the short-lived pairing window, especially in classrooms, workplaces, or shared households.
- Expected: the receiver's original offer is authoritative and cannot be extended by a remote answer.
- Actual: remote input can lengthen the authorization window.
- Consequence if merged: the UI's safety promise and actual authorization lifetime diverge.
- Minimum effective change: reject when `now >= payload.expiresAt`, require answer session/token equality, and consume/close the session once; no identity provider is required.
- Direct acceptance:
  1. an answer before the original expiry succeeds;
  2. the same answer after original expiry fails even with a later answer timestamp;
  3. replay after successful consumption fails;
  4. boundary-time behavior is deterministic.

### F3 — The manifest limit does not bound work or produce an unambiguous plan

- Tracking: [review thread](https://github.com/Reese-max/soundbox-offline/pull/8#discussion_r4034924508)
- Fingerprint: `soundbox-offline+manifest-planning+more than 10000 entries+entry both needed and rejected+classify before enforcing count limit`
- Classification: `BUG / severity=P2 / decision_priority=HIGH_PRE_MERGE / NEEDS_REVIEW`
- Evidence: the receiver classifies every entry as needed/duplicate before adding excess entries to rejected. A valid 10,001-entry manifest can therefore place the last entry in both `needed` and `rejected`.
- Affected personas: users migrating very large collections and support/QA staff diagnosing partial transfer plans.
- Expected: the declared limit bounds CPU/memory work and yields exactly one disposition per descriptor.
- Actual: work remains unbounded by the advertised limit and the resulting plan is contradictory.
- Consequence if merged: senders and receivers can disagree about what should be transferred and recovery becomes ambiguous.
- Minimum effective change: reject an over-limit manifest before per-entry planning, or truncate with an explicit all-or-nothing protocol rule; do not silently classify excess entries.
- Direct acceptance:
  1. exactly 10,000 valid entries produce a complete single-disposition plan;
  2. 10,001 entries are rejected before classification;
  3. no key appears in more than one disposition;
  4. processing remains bounded.

### F4 — Remote descriptors bypass local filename, MIME, key, and file-size bounds

- Tracking: [review thread](https://github.com/Reese-max/soundbox-offline/pull/8#discussion_r4034924521)
- Fingerprint: `soundbox-offline+incoming-manifest+remote malformed descriptor+oversized/unbounded item accepted+receiver validation weaker than createFileDescriptor`
- Classification: `BUG / severity=P2 / decision_priority=HIGH_PRE_MERGE / NEEDS_REVIEW`
- Evidence: incoming manifest validation accepts any nonnegative safe-integer size and does not apply `NETWORK_IMPORT_MAX_FILE_BYTES` or the filename, MIME type, and key limits used by local descriptor creation.
- Affected personas: users pairing with a compromised/malformed peer and low-memory mobile browsers.
- Expected: remote data is validated at least as strictly as locally created descriptors before allocation or planning.
- Actual: a remote peer can submit states the supported sender API cannot create.
- Consequence if merged: resource limits are not a trust boundary, and malformed descriptors can drive excessive retention or inconsistent keys.
- Minimum effective change: share one descriptor validator between create and receive paths, enforce per-file and aggregate batch limits before accepting chunks, and reject invalid fields atomically.
- Direct acceptance:
  1. over-limit size, filename, MIME, and key inputs fail before planning;
  2. aggregate advertised bytes are bounded;
  3. local and remote validation use the same contract;
  4. rejection allocates no file assembler.

### F5 — Large-file assembly retains and duplicates the full file in JavaScript heap

- Tracking: [review thread](https://github.com/Reese-max/soundbox-offline/pull/8#discussion_r4034924529)
- Fingerprint: `soundbox-offline+FileAssembler+finish large transfer+mobile tab termination risk+retain chunks then full-copy before File`
- Classification: `BUG / severity=P2 / decision_priority=HIGH_PRE_MERGE / NEEDS_REVIEW`
- Evidence: `FileAssembler` retains every chunk and `finish()` allocates a second set of buffers before constructing a `File`. The protocol permits up to 4 GiB while #3 explicitly asks the research to test 500 MB+ without whole-file heap buffering.
- Affected personas: phone/tablet users, low-memory browsers, and users transferring long WAV/FLAC recordings.
- Expected: the supported maximum has measured, bounded peak memory and a recoverable interruption path.
- Actual: peak live memory is roughly multiple full-file copies plus browser overhead.
- Consequence if merged: the exact large-library/mobile journey used to justify the feature is likely to terminate or become unrecoverable.
- Minimum effective change: stage chunks to IndexedDB/OPFS or another measured browser-storage stream, or lower the supported maximum to an empirically safe limit. Do not claim 4 GiB without device evidence.
- Direct acceptance:
  1. a 500 MB fixture completes on the supported mobile/browser matrix without full-file heap duplication;
  2. peak memory is measured and bounded;
  3. interrupted staging can be cleaned up or resumed without corrupt import;
  4. checksum mismatch never commits the file;
  5. the advertised maximum matches evidence.

## External benchmark and platform evidence

Sources checked 2026-09-18 UTC. Product pages are **CONFIRMED PRODUCT CLAIMS**, not independent outcome evidence.

| Source | Dated signal | What it establishes | Product-board implication |
|---|---|---|---|
| [LocalSend](https://localsend.org/) | current page checked 2026-09-18 | No-account, no-cloud, encrypted cross-platform local transfer with a complete install/select/send journey | **MUST MATCH** a complete, understandable success path; existing LocalSend/OS transfer remains the smaller fallback |
| [PeerPlay Wi-Fi transfer](https://peerplay.store/wifi-music-transfer/) | current page checked 2026-09-18 | A focused music-transfer alternative competes on task completion, not protocol novelty | **SHOULD BE BETTER** only if Soundbox avoids app-switching and imports into its canonical library reliably |
| [Kasette 1.3.2 on F-Droid](https://f-droid.org/packages/com.kasette.app/) | added 2026-09-16 | Offline local music, local file import, backup/restore, PWA/native Android, and removal of Internet permission | **DIFFERENTIATOR** may be browser-local portability; do not copy native distribution merely because it exists |
| [MDN WebRTC data channels](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels) | modified 2026-06-22 | Real data channels require `RTCPeerConnection` negotiation; buffering and message-size limits must be handled | Confirms F1/F5 are protocol necessities, not optional polish |
| [Chrome Local Network Access](https://developer.chrome.com/blog/local-network-access) | published 2025-06-09; update noted 2025-09-29 | Local-network access is permissioned and secure-context constrained; WebRTC gating is evolving | Browser/permission matrix remains runtime evidence, not a reason to build a custom platform |

Comparison summary:

- Target users/core job: LocalSend and PeerPlay win by completing device-to-device transfer; Kasette wins by avoiding network transfer entirely.
- First success/UX: PR #8 currently has no first-success path.
- Automation/API: none of the evidence justifies public APIs, relays, or accounts.
- Mobile/performance/reliability: F3–F5 block a credible large-file/mobile claim.
- Security/privacy: DTLS is useful only after real negotiation; it does not repair expiry authority or hostile input validation.
- Pricing/distribution: all three product alternatives make the zero-account/offline value legible; paid infrastructure is not needed for the current decision.
- **DO NOT COPY:** native rewrite, cloud relay, account graph, broad discovery service, or social sharing.

## Synthetic 50-persona continuity

This delta preserves the repository's prior 50-persona cohort: **30 regression baseline + 20 exploration personas**. It does not replace the fixed A01–J05 quality audit and does not generate synthetic preference share.

Regression coverage retained:

- restore/data-integrity personas remain mapped to #1;
- CI/release-evidence personas remain mapped to #4/#5;
- offline library, keyboard, screen-reader, reduced-motion, low-storage, interrupted-import, duplicate, and checksum paths remain unchanged because default product SHA did not change.

PR #8 exploration overlays:

- first-time phone importer: F1 fail before first success;
- shared-Wi-Fi user: F2 authorization window mismatch;
- 10k+ archive migrator/support agent: F3 contradictory plan;
- paired malicious/malformed peer: F4 boundary failure;
- low-memory iOS/Android user with 500 MB+ WAV/FLAC: F5 likely resource failure;
- keyboard/screen-reader user: UNKNOWN because there is no UI to inspect;
- interrupted/restarted transfer user: UNKNOWN because no durable runtime path was exercised.

Outcome: 0 personas provide runtime support for BUILD. Five persona clusters supply design/test requirements only. Simulated board/persona judgments are not real votes, incidence, revenue, or priority evidence.

## Model product-board review

- **CEO:** if only three things are done: (1) fix #1 restore integrity, (2) obtain real #4/#5 gate/security receipts, (3) narrow PR #8 to a measured end-to-end spike. Do not ship a relay, account system, or native rewrite.
- **CPO:** F1 means the candidate has not crossed from research artifact to product; preserve the original BUILD/NARROW/REJECT exit.
- **CTO:** one real connection, one importer handoff, and storage-backed assembly are sufficient; a generalized transport framework is not.
- **Staff/Principal Engineer:** share descriptor validation and make offer state authoritative. Keep five roots separate even if repaired in one PR.
- **UX Lead/Researcher:** the success, permission, expiry, interruption, and recovery states need observable user journeys before preference claims.
- **Growth:** no acquisition claim is credible while first success is unreachable.
- **CFO:** continue using LocalSend/OS import as the no-infrastructure fallback; avoid relay costs.
- **Security/Privacy:** expiry and remote-input bounds are trust boundaries; DTLS does not substitute for them.
- **QA:** unit tests are insufficient; require real peer negotiation, malformed input, 500 MB+, interruption, and canonical import.
- **SRE:** avoid servers and background services; measure failure cleanup and storage pressure in-browser.
- **Accessibility:** UNKNOWN until an actual UI exists; do not claim keyboard/screen-reader coverage.
- **Support:** contradictory plans and tab termination would create unrecoverable cases; clear rejected/retry states are mandatory.

Substantive disagreement: Growth may want the feature as a differentiator now, but CPO/CTO/Security/QA reject shipping a label without a complete path. CFO supports only a bounded local-only experiment. The decision remains **INVEST / SIMPLIFY / NARROW**, not broad BUILD.

## Red Team

1. **Already solved externally:** LocalSend, OS file transfer, and existing Soundbox file import provide a smaller workaround. This lowers urgency; it does not prove PR #8 works.
2. **Wrong root rejected:** browser permission evolution is not the cause of F1. The candidate never creates a peer connection.
3. **Overengineering rejected:** no relay, service discovery platform, new database, identity provider, or native app is required to test the core hypothesis.
4. **Default regression rejected:** PR #8 is unmerged. No current Soundbox user flow regressed because of this code.
5. **Unit-test overclaim rejected:** module tests cannot prove UI reachability, actual SDP/ICE negotiation, mobile memory, browser storage, permissions, interruption, or canonical import.
6. **Severity inflation rejected:** all five findings are high-priority pre-merge blockers, but default-branch and production impact is not established. Therefore severity remains P2.
7. **Build decision withheld:** #3's research authorization and Issue number do not authorize merge, deployment, paid infrastructure, or external write.

## Actions and CI evidence

- [Deploy run 35201812161](https://github.com/Reese-max/soundbox-offline/actions/runs/35201812161): `check` failed with `steps=null`; preview and production deploy jobs were skipped.
- [CI run 35201812181](https://github.com/Reese-max/soundbox-offline/actions/runs/35201812181): `check` failed with `steps=null`.

These are admission/result receipts only. They do not prove that dependency install, checks, tests, build, WebRTC, browser import, or deploy executed, and they do not establish the root cause of the failed admission. Billing, quota, YAML, or product-code causes remain **UNKNOWN**.

## Mutual exclusion and tracking

Issue #3, PR #8, its branch, and all five unresolved review threads have active ownership. The five findings map 1:1 to those threads. This run is **SKIPPED_LOCKED**:

- no Issue lock marker was acquired;
- no Issue or PR comment was added;
- no scope, label, branch, code, workflow, secret, permission, setting, merge, or deployment was changed;
- no duplicate Issue was created.

## NOW / NEXT / LATER / DON'T

- **NOW:** #1 restore integrity; #4/#5 executable gates/security; block PR #8 merge on F1–F5.
- **NEXT:** after an authorized review, run one real two-browser, canonical-import, interruption, and malformed-manifest test; separately measure 500 MB+ peak memory on the supported mobile matrix.
- **LATER:** decide BUILD/NARROW/REJECT for #3 from measured completion, memory, permission, and recovery evidence.
- **DON'T:** relay service, accounts, native rewrite, social sharing, AI recommendations, generalized transport platform, or a claimed 4 GiB/mobile contract without evidence.

## Mandatory accounting

- New actionable findings: 5
- Severity: P2 × 5
- Kind: BUG × 4; VALIDATION_GAP × 1
- New / updated / reopened Issues: 0
- Duplicate Issues avoided: 5
- Finding-to-tracking mapping: 5/5
- SKIPPED_LOCKED: 1 active PR scope
- Verified fixed: 0
- Issue write blocked: 0
- Report write blocked: 0
- Fixed A01–J05 CLEAN: no; streak remains 0/2
- Next fair cursor: `skill-foundry`

## Limitations

No live WebRTC connection, QR/manual pairing, iOS/Android device, 500 MB+ transfer, interruption/resume, IndexedDB/OPFS staging, checksum fault, keyboard, screen reader, browser permission, Cloudflare deployment, or production mutation was executed. Findings are source-confirmed at PR head `c5c94cc183b40b859fe1a2c314a12ff2d6a8fd67`; runtime behavior remains pending. Audit-only commits do not change the inspected default product evidence.
