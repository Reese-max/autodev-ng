# Product Board Delta — travel-planning-mcp — 2026-09-18T2300Z

## 結論

本輪確認一項在前次正式產品董事會報告之後新增的 owner 方向：[travel-planning-mcp Issue #7](https://github.com/Reese-max/travel-planning-mcp/issues/7)，建立於 2026-09-17T18:22:21Z。它不是新的產品缺陷，也不使其內列出的所有階段自動取得實作授權；產品董事會結論為 **NARROW / INVEST IN TRUST / DEFER BREADTH**。

- 先完成既有 [Issue #5](https://github.com/Reese-max/travel-planning-mcp/issues/5) 的 proposal terminal-state P2 修復。
- 接著只取得一條可重現的 current read-only TRIP/App runtime 收據，證明第一個實際使用旅程。
- canonical import、AI planning UI、proposal writeback 分開保留為 opportunity；在需求、成本、隱私與最小成功旅程證據不足時維持 NEEDS_REVIEW。
- [Issue #6](https://github.com/Reese-max/travel-planning-mcp/issues/6) 的 Google Places 欄位保存研究保持前置 gate，不因 App roadmap 而跳過。
- 不建立通用 workflow engine、ledger、身份平台或旅遊超級 App。

## Evidence receipt

- Repository: `Reese-max/travel-planning-mcp`, public, owner `Reese-max`, unarchived.
- Issue Quality v2 blob: `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Default HEAD: `ea9c51ffb5c12a82f6bac609420731136e058c7c`.
- Product baseline: `5a84a746266a2bd8cabf07db24a0fd2e9558b400`.
- Latest two commits are audit-only documents; no product commit landed after the [2026-09-17 formal report](https://github.com/Reese-max/travel-planning-mcp/blob/ea9c51ffb5c12a82f6bac609420731136e058c7c/.github/quality-audits/2026-09-17T0811Z-product-board-audit.md).
- PR inventory: #1–#3 merged; open PR count 0.
- Issue inventory: open #4, #5, #6, #7; closed Issue count 0.
- Exact-head workflow lookup returned no additional run on product or audit head in this connector view. Previously recorded successful runs remain historical receipts, not new evidence.
- Owner inventory: 41 repositories, 40 unarchived, one archived (`obsidian-vault`).
- Fixed A01–J05 result remains `NOT CLEAN, 0/2`. No code change means the existing 30-regression/20-exploration product-persona set was not re-posted; this delta does not claim a new persona round.

## Issue #7 decomposition

| Scope in #7 | Quality classification | Current evidence | Decision |
|---|---|---|---|
| Repair #5 terminal revalidation | BUG / P2 / SOURCE_CONFIRMED / NEEDS_REVIEW | `validate()` can rewrite approved/rejected/applied states; exact fingerprint already tracked | **NOW**; smallest lifecycle guard or observational validation, direct regression tests |
| Create separate `travel-planning-app` repo | OPPORTUNITY / severity NOT_ESTABLISHED / decision_priority P3 / NEEDS_REVIEW | Owner direction exists, but no evidence that a second repo is required to validate the MCP core | **NARROW**; first prove the desired user journey and ownership boundary |
| Real App/runtime evidence | VALIDATION_GAP / severity NOT_ESTABLISHED / decision_priority P2 / NEEDS_REVIEW | Prior build/fixture receipts do not prove compose + HTTP + isolated create/read/delete journey | **NEXT** after #5; bounded, isolated, non-production |
| Import Preview | OPPORTUNITY / severity NOT_ESTABLISHED / NEEDS_REVIEW | Product design is bounded and safer than silent import, but no real external-account demand/runtime evidence | **LATER experiment**; retain unresolved fields and no persistence |
| Canonical Import | OPPORTUNITY / severity NOT_ESTABLISHED / NEEDS_REVIEW | Depends on stable preview, source identity, retention and approval decisions | **DEFER**; BUILD only after preview evidence |
| AI Planning Diff UI | OPPORTUNITY / severity NOT_ESTABLISHED / NEEDS_REVIEW | Competitors prove market availability, not this repo's user demand; consumer UI is outside current core | **DEFER**; a CLI/API diff may be the smaller substitute |
| Proposal-based writeback | OPPORTUNITY / severity NOT_ESTABLISHED / NEEDS_REVIEW | Safe architecture direction, but remote identity/runtime/privacy boundaries are not verified | **DEFER**; no production write |

`auto_implementation=false` applies to all opportunity/research rows. Issue number, roadmap ordering, checklist, owner assignment, model score, or this report are not merge/deploy/paid-provider authorization.

## Competitive re-check

Official sources accessed 2026-09-19 Asia/Taipei:

- [Wanderlog](https://wanderlog.com/trip-planner-ai) already combines AI itinerary generation, email reservation import, collaboration, offline/mobile use, route optimization, budgeting and live flight status.
- [Mindtrip](https://mindtrip.ai/) already combines conversational planning, recommendations, group chat, receipt upload, Google Pins import, collections and iOS distribution.
- [Google Maps route help](https://support.google.com/maps/answer/144339) remains the navigation/routing substitute.

These are product claims, not independent outcome evidence. They strengthen **DO NOT COPY** for booking breadth, social, native mobile and navigation. The smaller differentiation remains: canonical provider-independent trip data, explicit change proposals, external human approval, versioning and reversible writes.

## Board disagreement and Red Team

- CEO/CPO: allow one thin App journey only if it improves first success; refuse a multi-phase super-app commitment.
- CTO/Staff: a second repository may improve ownership separation, but is not technically necessary to fix #5 or validate the read-only bridge.
- UX/Growth: an approval diff could make the safety model legible, but a CLI/API response is a smaller first experiment than a full panel.
- CFO/SRE: app/runtime evidence has value; durable store and live providers add operational and quota cost before demand is known.
- Security/Privacy: import/writeback expands location, reservation and identity exposure; #6 and explicit approval remain gates.
- QA/Accessibility/Support: require one deterministic end-to-end receipt and clear unresolved-field behavior before expanding interfaces; browser/AT remains UNKNOWN.

Counterevidence that could overturn #7's larger sequence:

1. #5 is solvable locally without any App work.
2. The existing read-only bridge may validate the core job without a new repo.
3. Manual export/import may be sufficient before canonical writeback.
4. Provider retention and user identity boundaries are unresolved.
5. Competitor breadth increases the cost of copying rather than proving demand.
6. No product code, new runtime receipt or real-user result landed after the prior board report.

Decision: **BUILD #5; NARROW runtime proof; keep App/import/UI/writeback in NEEDS_REVIEW; REJECT scope coupling.**

## Tracking, mutual exclusion, and write accounting

- New actionable product bugs: 0.
- New product direction reviewed: 1 (#7).
- Existing fingerprints reused: #5 bug, #6 research, #4 fixed-persona tracker.
- New/update/reopen Issues: 0/0/0.
- Duplicate Issues avoided: 3.
- Verified fixed: 0.
- Product/CI/config changes: 0.
- Issue #7 is owner-authored, assigned to Reese-max, and has no open PR yet. It is treated as active owner scope; Issue edits are `SKIPPED_LOCKED`.
- Report write: central audit-only delta; no implementation branch, GOAL, worker, merge, deploy, paid API or external data mutation.
- Next fair cursor: `Reese-max/UkePack`.
- Portfolio CLEAN: not claimed.
