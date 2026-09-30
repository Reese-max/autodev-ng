# Product Board Delta — soundbox-offline

- Checked: 2026-09-16 UTC
- Status: **PARTIAL / NO NEW ACTIONABLE FINDING / SKIPPED_LOCKED / NOT CLEAN**
- Quality v2 blob: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Repository: private, default `main`
- Inspected HEAD: `68d8137b77be063cc5ae5468e9e31b81455060a9` (audit-only)
- Last substantive product SHA: `44c22cc8d41f5944e0df811c96aa162d49db44e2`
- Cursor: `soundbox-offline` → next `skill-foundry`

## Incremental result

No product or workflow change has landed on the default branch since the prior product-board and fixed-50 audits. The current evidence therefore does not justify reposting the full board, 50-persona matrix, or Issue comments.

Existing findings remain mapped:

- [#1](https://github.com/Reese-max/soundbox-offline/issues/1): corrupt but JSON-valid full-backup audio can still overwrite a good same-ID local track. Status: **P0 / STILL_REPRODUCIBLE from unchanged source / NEEDS_BROWSER_INDEXEDDB_RUNTIME**. No new fix branch was found.
- [#4](https://github.com/Reese-max/soundbox-offline/issues/4): checked-in CI/deploy gates still stop after `npm run check` and omit `npm test`. Portfolio severity remains **P2 validation gap**; the Issue may retain its P1 decision priority.
- [#5](https://github.com/Reese-max/soundbox-offline/issues/5): default branch still pins affected RSC versions. Status: **P2 security/upstream / runtime exposure unknown**.
- [#3](https://github.com/Reese-max/soundbox-offline/issues/3): LAN/browser import remains a bounded research direction, not an implementation authorization.

## Active PR / ownership check

- [PR #6](https://github.com/Reese-max/soundbox-offline/pull/6), head `dae7baf71d125a75f7ca963aa557e985bce53f1d`, adds `npm test` to both gates.
  - [CI 35086312366](https://github.com/Reese-max/soundbox-offline/actions/runs/35086312366): failure, check job `steps=null`.
  - [Deploy 35086312543](https://github.com/Reese-max/soundbox-offline/actions/runs/35086312543): failure, check job `steps=null`; deploy jobs skipped.
- [PR #7](https://github.com/Reese-max/soundbox-offline/pull/7), head `383572ba8924235f1a2a8b7400749dd745123730`, patches the RSC dependency line.
  - [CI 35086569230](https://github.com/Reese-max/soundbox-offline/actions/runs/35086569230): failure, check job `steps=null`.
  - [Deploy 35086569221](https://github.com/Reese-max/soundbox-offline/actions/runs/35086569221): failure, check job `steps=null`; deploy jobs skipped.

These are Actions admission/result receipts only. They do not prove that `npm ci`, `npm run check`, `npm test`, build, Worker/RSC smoke, browser restore, or deployment executed. The exact common admission cause remains **UNKNOWN**; no billing, quota, YAML, or code root cause is inferred.

Both scopes have active owner branches and reviews, so #4/#5 and PR #6/#7 are **SKIPPED_LOCKED**. No Issue lock, comment, scope change, branch, implementation, merge, or deployment was performed.

## Competitor delta

Official/current sources checked 2026-09-16 UTC:

- [LocalSend](https://localsend.org/) continues to establish the no-account, no-cloud, encrypted local-network transfer model; [LocalSend Web](https://web.localsend.org/) adds a browser endpoint but still requires a LocalSend peer.
- [Plexamp 4.50.3 announcement, 2026-09-01](https://forums.plex.tv/t/plexamp-v4-50-3-ready-or-not/942338) adds a downloads-only Offline switch, local Artists/Albums/Tracks/Playlists, offline search, local queues, migration progress, and removal of the prior three-day download cap.
- [Plexamp official product page](https://www.plex.tv/plexamp/) continues to position strong offline support as a core capability.

Classification: **CONFIRMED PRODUCT CLAIMS**, not independent effect evidence. The Plexamp update validates reliable offline library/search/migration as MUST MATCH, but Soundbox already supports a browser-local library and search. It does not establish a new defect or justify copying server accounts, streaming, automotive integrations, or a native app.

## Board / 50-persona / Red Team delta

Prior 30 baseline + 20 exploration personas remain retained. The strongest unchanged cases are I02/I03/I05/J01/D05/J04 for restore integrity and C05/D03/H03/H05 for CI evidence. No new persona fingerprint passed the gate.

Board consensus remains **INVEST / SIMPLIFY**:

1. fix #1's destructive corrupt-restore path;
2. land and actually execute #4's CI regression gate;
3. patch #5 and record deployed-SHA/runtime exposure;
4. only then run #3's bounded LAN transport experiment.

Red Team rejected new work for Plexamp-style streaming/server accounts, automotive features, a native rewrite, recommendation AI, cloud library storage, and broad dependency upgrades. The smaller alternative remains existing file import plus LocalSend/OS transfer until #3's runtime spike proves a materially better path.

## Mandatory accounting

- Total new findings: 0
- New / updated / reopened Issues: 0
- Duplicate avoided: 4 (#1, #3, #4, #5)
- SKIPPED_LOCKED: 2 active implementation scopes (#4/PR #6, #5/PR #7)
- Verified fixed: 0
- Rejected/deferred opportunity groups: 6
- Issue write blocked: 0
- Report write blocked: 0
- CLEAN: no; streak remains 0/2
- Next fair cursor: `skill-foundry`

## Limitations

No browser, IndexedDB, physical device, screen reader, Cloudflare deployment, exploit reproduction, or production mutation was performed. PR-local claims are not treated as default-branch fixes. Zero-step Actions failures are not treated as repository test failures.
