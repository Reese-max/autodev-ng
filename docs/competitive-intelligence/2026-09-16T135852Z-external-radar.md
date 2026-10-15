# 外部競品／新品／工作流靈感雷達 — 2026-09-16T13:58:52Z

## Scope / rules / evidence boundary

- 只處理 `Reese-max` 自有 repository；未操作第三方 repository。
- Issue Quality 規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`。
- 規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh owner pagination：**42 accessible Reese-max-owned repositories；39 unarchived**；archived 仍為 `gemini-deidentifier`、`obsidian-vault`、`openab`。
- Working classification 沿用最近校準：**36 product-like + 3 support/compatibility-only**。`adng-memory` 的 README 明確自述為 cross-repository patrol fleet 的 local operational memory store、且「不是 product-code repository」；本輪仍依公平輪巡檢查，因它承載跨產品 operational state / evidence，但不把它擴張成終端產品。
- 上一輪 cursor：`adng-memory`；本輪完成該 target。下一個 cursor：**`cyber-prep-coach`**。
- `adng-memory` current default branch：`main@7411255debca5ebc9702e9a560f66a51dd3a8f58`。
- Owner/product boundary：各 project repository/runtime 才是 source of truth；`adng-memory` 只保存 README 指定角色的 operational evidence。本 repo 沒有 writer implementation，不應假裝自己能 enforce 外部 writer、session runtime、provider cache 或 production deletion。
- 活躍工作：#4 + PR #5（memory lifecycle receipt contract）、#6 + PR #7（paused fleet / heartbeat mirror contract）。本輪不修改這些 Issue/PR，不搶 scope。
- PR #7 在本輪開始前約一小時仍有新的 Codex P2 review findings（heartbeat 被誤稱 success marker、process inspection self-match），因此明確視為 active scope。
- 本輪只做 GitHub read、公開網路研究與中央 radar report；沒有改產品程式、CI/config、secrets、settings、branch，沒有 merge/deploy、沒有啟動 worker/GOAL。
- 不宣告 portfolio CLEAN。

## Executive decision

**0 新 Issue；0 existing Issue 修改；沒有新的 READY_FOR_IMPLEMENTATION。**

本輪找到的外部訊號有價值，但都落在既有 #4 的生命週期 fingerprint 或其明確的 runtime 邊界內；而 #4 已有 open PR #5。最重要的新校準不是「再做更多記憶功能」，而是把 deletion / forgetting 拆成不同層：

`stored memory lifecycle != session/context compaction != pending execution state != runtime/cache unlearning`。

Microsoft Foundry Memory 的最新 preview 已把 item CRUD、store-level TTL 與 direct remember-or-forget 做成 managed memory primitive；OpenAI Agents SDK 的 current session/compaction contract 也加入 stale-snapshot ownership check、mutation serialization 與 fail-closed resume semantics。另一方面，2026-09-04 的 execution-state unlearning 研究指出，刪掉 plaintext memory 並不等於刪掉由它衍生的 compressed summary、pending plan 或 KV/runtime state。

對 Reese-max 的最小結論是：**#4 可以繼續治理 durable operational memory 的 active head / predecessor / lineage / tombstone receipt，但不能因此宣稱完成整個 agent runtime 的「忘記」。** 若未來需要強 deletion assurance，應由 owning writer/runtime 回傳一個可驗證的 runtime purge/replay receipt；不要把 KV cache、provider session、pending tool plan 的實作搬進 `adng-memory`。

因 #4 / PR #5 仍 open，且 #6 / PR #7 正在活躍修正，本輪對兩個 fingerprint 都標記 `SKIPPED_LOCKED / DEDUPE`，只保存中央證據。

## Current repository evidence

### Repository contract

Current `README.md` 明確定義：

- `adng-memory` 是 cross-repository patrol fleet 的 local operational memory store；
- 不是 product-code repo、public dataset、credential store、CDN，也不是 member projects 的 replacement；
- 本 repo **沒有 writer implementation**；patrol / snapshot process 在 clone 外部；
- project source of truth 仍是 project repository + runtime；
- root heartbeat / snapshot / alert / log 與 per-project state 各有不同 writer、reader、retention 與 recovery contract；
- `run.db` 是 opaque evidence，不得用 ad-hoc SQL 改寫；
- sensitive source data / secrets / production identifiers 不應進入此 repo。

這些邊界直接否決「把它做成新的 hosted memory platform」的方向。

### Existing #4 / PR #5

#4 的 stable problem 是 durable decision-affecting state 缺少 machine-verifiable activation / supersession / deletion lifecycle；歷史 radar 又把 origin-aware admission / memory poisoning 納入同一 lifecycle fingerprint。

PR #5 已做出 narrow contract / fixture 版本：source hash、valid/transaction time、predecessor、lineage、disposition、tombstone targets、stale-write rejection、conflict quarantine，並明確標 `runtime_enforcement=false`。PR body 也要求 owning writer pilot 才能形成 runtime evidence。

這代表本輪外部訊號不能合理地再開一張「memory TTL / memory deletion / compaction ownership」平行 Issue。

### Existing #6 / PR #7

#6 是目前 default-branch heartbeat >24h 的 P2 liveness evidence finding。PR #7 已查到 upstream fleet 是被 user pause sentinel 故意停住，而且 provider credit 也是 resumption dependency，因此採 contract/retirement route，而不是手改 heartbeat。

最新 review 仍指出兩個直接 P2：

1. `lastPatrolTs` 實際是在 admitted patrol 的 **start** 寫入，不保證該 patrol 成功；文件若稱為 successful patrol marker 會高估健康狀態。
2. 以 command-line substring 搜尋 `patrol-loop` 可能命中 inspection PowerShell 自己，產生 false positive。

這是活躍 scope；本雷達不介入。

## External Signals

### A. Provider-native memory lifecycle controls are becoming explicit

**CONFIRMED — Microsoft Foundry Agent Service Memory preview; page last updated 2026-08-05; checked 2026-09-16.**

Source:
- https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/memory-usage

Current first-party documentation exposes:

- create/read/update/list/delete for individual memory items;
- store-level default retention / TTL;
- direct synchronized remember-or-forget commands;
- explicit `scope` isolation;
- TTL applied to memories from direct commands, extraction/consolidation and item CRUD;
- a documented caveat that TTL only applies to stores created after TTL support and that updating/consolidating memory resets its last-updated time.

**Transferable signal:** retention / forget semantics must be explicit, scoped and observable; a timestamp or generic “memory exists” flag is not enough.

**Do not overread:** managed item deletion or TTL is not proof that external derived summaries, provider runtime state, clones or downstream action context have also forgotten the information.

### B. Session compaction is adopting exact-ownership / stale-write protection

**CONFIRMED — OpenAI Agents SDK Sessions documentation, current and checked 2026-09-16.**

Source:
- https://openai.github.io/openai-agents-js/guides/sessions/

The current SDK contract includes several patterns directly relevant to #4:

- sessions persist conversation items and support resumable runs;
- older/ambiguous snapshots that cannot prove current-response ownership fail closed rather than replaying raw items;
- compaction clears and rewrites the underlying session, so the SDK serializes mutations within the wrapper;
- automatic compaction checks that the run still owns the history snapshot it read; if history changed, it preserves newer history and skips stale compaction;
- separate wrapper/direct mutation paths still require application-level coordination.

**Transferable signal:** this is a concrete provider implementation of the same principle as `exact predecessor/head -> mutate -> verify ownership`; it strengthens #4 but does not create a new root cause.

### C. Managed agent runtimes increasingly own compaction / recovery themselves

**CONFIRMED — OpenAI Agents API public beta, published 2026-09-10; checked 2026-09-16.**

Sources:
- https://openai.com/index/introducing-the-agents-api/
- https://openai.com/products/release-notes/

The Agents API now provides durable sessions and handles session orchestration, context compaction and recovery inside the managed Codex harness. OpenAI states there is no separate Agents API fee beyond model/tool usage during beta.

**Product implication:** `adng-memory` should not become another generic session manager or context compactor merely because those features are now prominent. For providers that already own durable session state, the useful integration surface would be a thin evidence pointer / receipt, not a second copy of provider state.

### D. Stateful agent identity is moving independently of model / execution machine

**CONFIRMED — Letta Agents SDK, published 2026-08-17; checked 2026-09-16.**

Source:
- https://www.letta.com/blog/introducing-the-letta-agent-sdk/

Letta positions long-running agent identity/memory as portable across cloud, self-hosted and local backends, and across machines.

**Product implication:** this reinforces the existing Reese-max direction that durable identity/state should not be tied to a single model or machine. It does not imply adopting Letta, adding a vector database, or importing an entire agent runtime into `adng-memory`.

### E. New research sharply separates memory deletion from runtime forgetting

**CONFIRMED RESEARCH — `Forgetting Without Restarting: Execution-State Unlearning for Stateful LLM Agents`, submitted 2026-09-04; checked 2026-09-16.**

Source:
- https://arxiv.org/abs/2609.04875

The paper models long-running agents as stateful systems where target information can survive not only in plaintext memory but also compressed summaries, pending plans and KV/runtime state. Its main design signal is that deleting one memory record is not equivalent to counterfactual forgetting of all dependent execution state; stronger guarantees require provenance-guided replay/recomputation.

**Important boundary for Reese-max:** this is not evidence that `adng-memory` should implement KV-cache control or runtime replay. It is evidence that #4 must state what its tombstone receipt proves and what remains the responsibility of the owning writer/runtime.

Research benchmark numbers are not used as Reese-max effectiveness estimates.

## New Releases / current changes

| Date | Source | Change / current evidence | Product implication |
|---|---|---|---|
| 2026-09-10 | OpenAI | Agents API public beta: durable sessions, managed compaction/recovery | Avoid rebuilding generic session/runtime infrastructure in `adng-memory` |
| 2026-09-04 | arXiv research | Execution-state unlearning separates record deletion from derived runtime forgetting | Keep #4 deletion claim layer-specific; require owning-runtime evidence for stronger guarantees |
| 2026-08-17 | Letta | Stateful agent SDK across cloud/self-hosted/local backends | Identity/state portability remains a useful principle, not a storage-vendor mandate |
| 2026-08-05 | Microsoft Foundry | Managed memory CRUD, TTL and remember-or-forget controls | Scope/retention/delete semantics are becoming explicit platform primitives |

## Community Pain

No Reddit/community prevalence claim was needed in this round. The decision is already supported by current first-party provider docs plus a recent research paper, and community anecdotes would not establish whether Reese-max requires a new feature.

## Opportunity Map — adng-memory

### MUST MATCH

- Durable decision-affecting state must preserve source/evidence pointer, exact predecessor/head, disposition and lineage where #4 applies.
- Stale or competing mutation must not silently overwrite a newer accepted head.
- Tombstone/deletion receipts must state **which layer** they cover; do not imply provider session/cache/runtime erasure without evidence.
- Provider-managed state remains provider/runtime truth; `adng-memory` stores only the evidence role defined by its contract.
- A current read that cannot verify the active head should fail closed / `CANNOT_VERIFY` rather than guessing from newest timestamp.

### SHOULD BE BETTER

- After PR #5 ownership clears, review whether its tombstone contract explicitly distinguishes:
  - durable stored memory invalidation;
  - derived durable artifact invalidation;
  - external writer/runtime cleanup still required.
- If a future provider exposes durable session/compaction receipts, store only stable identifiers/hash/status needed for audit instead of copying full provider session state.
- Keep memory admission/activation narrowly applied to durable state that can affect downstream decisions; do not version every log line.

### DIFFERENTIATOR

- Reese-max can be stricter about **authority truth** than generic “memory search”: which exact state revision was accepted, based on which source, and whether a later deletion/supersession makes it non-current.
- Cross-repo evidence can remain model/provider agnostic while still refusing to pretend that the evidence mirror itself owns external execution state.

### ADJACENT IDEA

- A future owning-writer pilot could return a small `runtime_cleanup_receipt` / `runtime_state_ref` when a durable memory tombstone requires external cleanup. This remains an architecture note only; no Issue until a real writer shows the current contract cannot express the required decision.

### DO NOT COPY

- Do not build a hosted memory SaaS, vector DB, graph DB, generic session manager or provider-independent KV-cache controller in this repo.
- Do not adopt OpenAI/Letta/Microsoft storage just because they expose memory products.
- Do not treat TTL as proof of legal/privacy deletion completeness.
- Do not turn “forget” into an unbounded cross-portfolio purge framework before one owning runtime demonstrates the actual gap.
- Do not duplicate provider conversation history merely to make the evidence store look self-contained.

## Cross-portfolio idea

### Layer-scoped forgetting receipt — central note only

Potential shared principle:

`revoked source -> durable memory tombstone -> derived durable invalidation -> owning runtime cleanup/replay (when required) -> evidence receipt`

This can eventually help `autodev-ng`, `herdr-skills`, `claude-mem` and any long-running agent that persists decision-affecting state. However, the current portfolio already has `adng-memory #4` as the natural contract home and PR #5 is active. Creating a new cross-project framework Issue now would violate the dedupe/minimal-change gate.

Status:

```yaml
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: MEDIUM
evidence: NEEDS_EVIDENCE
triage: NEEDS_EVIDENCE
auto_implementation: false
```

This note is not authorization to modify any writer/runtime.

## Rejected Ideas

1. **Build provider-neutral session storage in adng-memory — REJECT.** OpenAI/Letta already show provider/runtime layers can own session durability; the repo contract says this clone is an evidence store, not the runtime.
2. **Add vector/graph retrieval because memory competitors use it — REJECT.** No current user workflow gap requires semantic retrieval here; #4 concerns authority/lifecycle truth.
3. **Expand #4 into full execution-state unlearning — REJECT / OUT OF SCOPE.** The new research proves the problem spans runtime/cache layers that this repo does not own.
4. **Open a second TTL/delete Issue — REJECT / DEDUPE.** Foundry’s TTL/delete primitives strengthen #4 but do not establish a separate Reese-max root cause.
5. **Modify #6 based on memory-platform research — REJECT.** #6/PR #7 is a separate liveness-marker/root-writer problem with active review findings.

## Four-gate decision

### Candidate: explicit runtime-forgetting boundary for #4

1. **Problem / value**
   - Target operator: maintainer/reviewer deciding whether a durable memory deletion or supersession is complete.
   - Observable risk: external research shows record deletion can leave dependent runtime state; repository itself states it does not own that runtime.
   - Existing solution: #4 / PR #5 already records lineage/tombstone and requires an owning-writer pilot.
   - Do-nothing consequence: documentation could eventually overclaim what a tombstone proves, but no current default-branch runtime guarantee is shown to make that false claim today.

2. **Priority**

```yaml
issue_quality_version: 2
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: MEDIUM
evidence: NEEDS_EVIDENCE
triage: NEEDS_EVIDENCE
auto_implementation: false
```

No P0/P1/P2 escalation: there is no executed Reese-max reproduction showing revoked content survives through a current supported runtime path.

3. **Minimum solution comparison**
   - **Do nothing now:** acceptable while PR #5 is active and already declares no runtime enforcement.
   - **Documentation-only scope sentence later:** likely sufficient if the only gap is overclaiming deletion coverage.
   - **Small owning-writer receipt:** only if a real runtime pilot shows external cleanup/replay must be tracked.
   - **Cross-runtime unlearning framework:** rejected unless multiple independently validated products require it.

4. **Research / implementation separation**
   - No new Issue while #4/PR #5 owns lifecycle scope.
   - Any future runtime experiment must be isolated and owned by the relevant writer/runtime.
   - A successful pilot would only support the next decision; it would not authorize deployment or broad framework rollout.

Decision: **DEDUPE into #4 conceptually; `SKIPPED_LOCKED` for issue mutation because PR #5 remains open.**

## Issue Mapping

| Repo / Issue | Signal | Decision | Reason |
|---|---|---|---|
| `adng-memory #4` + PR #5 | Foundry TTL/delete, OpenAI session ownership, execution-state unlearning boundary | `SKIPPED_LOCKED / DEDUPE` | Same lifecycle fingerprint; active PR; no new root cause |
| `adng-memory #6` + PR #7 | heartbeat semantics / paused writer | untouched | Separate liveness scope; PR has current review findings |
| new Issue | none | **not created** | No candidate passes dedupe + evidence + minimal-solution gate |

## Sources

First-party / primary:

1. Microsoft Foundry — Memory usage, last updated 2026-08-05: https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/memory-usage
2. OpenAI Agents SDK — Sessions / resumable runs / compaction: https://openai.github.io/openai-agents-js/guides/sessions/
3. OpenAI — Introducing the Agents API, 2026-09-10: https://openai.com/index/introducing-the-agents-api/
4. OpenAI release notes — Agents API public beta, 2026-09-10: https://openai.com/products/release-notes/
5. Letta — Agents SDK, 2026-08-17: https://www.letta.com/blog/introducing-the-letta-agent-sdk/

Research:

6. `Forgetting Without Restarting: Execution-State Unlearning for Stateful LLM Agents`, submitted 2026-09-04: https://arxiv.org/abs/2609.04875

## What Changed

- Fresh owner inventory rechecked: **42 owned / 39 unarchived**.
- Re-read Issue Quality v2 at blob `8167e10798071d2276addaff6b201c6b0e904a2a`.
- Re-read `adng-memory` default-branch README, issues, open PRs, issue/PR comments and branches.
- Confirmed #4 + PR #5 and #6 + PR #7 remain active/overlapping scopes; PR #7 has very recent P2 review findings.
- Added current external evidence that managed memory products now expose explicit TTL/delete/forget primitives and that current session SDKs use stale-snapshot ownership checks.
- Added a new research boundary: durable memory deletion is not equivalent to execution-state unlearning.
- **0 new Issue; 0 Issue update; 0 implementation authorization.**
- No external runtime was executed; no production/provider memory store was created or mutated. Therefore no runtime guarantee is claimed.
- Next fair-rotation cursor: **`cyber-prep-coach`**.
