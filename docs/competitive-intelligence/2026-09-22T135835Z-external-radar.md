# 外部競品／新品／工作流靈感雷達 — 2026-09-22T13:58:35Z

## Status / scope / evidence boundary

- 狀態：**COMPLETE / FRESH EXTERNAL SIGNALS / NO NEW ACTIONABLE ISSUE / NO USER NOTIFICATION**。
- 主要情報來源為 Reese-max GitHub 之外的公開網路；GitHub 只用於 current product truth、owner scope/direction、Issue/PR 去重、active ownership 與持久化本報告。
- Issue Quality 規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`；本輪重新讀取 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh connected-owner pagination：**42 Reese-max-owned repositories / 41 unarchived**；page 2 為空；`obsidian-vault` 是目前唯一 archived repo。未以歷史 inventory 當全集。
- Fair-rotation focus：`Reese-max/herdr-skills`，沿用既有 `google-maps-personal-mcp -> herdr-skills -> lobsterpulse` 輪巡順序。
- Current default branch：`main@9f134e1b0a53ffe72a64a5793ddc7dabe03ed571`；最新 default-branch commit 仍為 audit/docs，產品邏輯 baseline 仍是 `ec91e1c61a288eca74c658d6e534604b6e45a5ee`（2026-08-31 hardening）。
- Owner-approved direction 重新核對：維持 **INVEST / SIMPLIFY**。`herdr-reflect` 是 privacy-preserving、evidence-backed learning overlay；`herdr-supervisor` 是 machine-checkable policy/effect/run-state gate。不得因外部生態擴張就把 repo 變成 hosted orchestrator、agent dashboard、marketplace、transcript-mining SaaS、automatic policy writer、package manager 或 provider-specific mandatory runtime。
- Current README 仍稱本 repo 為「Two personal Codex skills」，Codex 安裝在 `$CODEX_HOME/skills` / `~/.codex/skills`，同時宣稱 compatible hosts 可從 `~/.agents/skills` 發現；default branch 的 Reflect/Supervisor runnable examples 仍含 `~/.codex/skills/...` hard-coded helper path。因此既有 #10 fingerprint 仍存在於 current source，沒有 default-branch 修復可宣稱。
- Active scopes 重新核對：#3 relocation/rebind 仍由 open PR #9 處理；PR #9 尚有 binding integrity、rebound invalidation、transitive rebind、文件等 review findings。#6 correction→candidate 仍由 open PR #8 處理；PR #8 尚有 STRUCTURED_ONLY privacy 與 schema review findings。這些 scope 均不被本輪搶改。
- #10 已精準追蹤 `~/.agents/skills` advertised path 與 hard-coded `~/.codex/skills` helper invocation 的相容性矛盾，現有搜尋未找到新的相同 PR。故本輪外部證據只做去重與方向校準，不留言、不重開、不擴 scope。
- `autodev-ng/main` 寫入前 HEAD：`c397f128495bb4591cafc0e7c8396267fcb1ae13`。
- 本輪沒有執行真實非 Codex Herdr session、Copilot Enterprise metrics query、Agent Plugin install、Supermemory plugin、CI trigger、production/deploy、付費 provider、worker/GOAL，也未改產品 source/config、secret、permission 或 settings。
- 本雷達不宣告 portfolio CLEAN。

## Executive decision

**0 new Issue、0 existing Issue/PR comment、0 implementation authorization。**

本輪新鮮訊號顯示 Agent Skills 生態已從「可攜式檔案格式」繼續往兩個平台層演化：

1. **可攜式套件與治理**：Agent Plugins 1.0 把 skills + MCP server 變成跨相容 client 的安裝單位；
2. **使用量可觀察性**：GitHub 在 2026-09-17 把 skills / custom agents / MCP / slash commands / plugins 納入 Copilot CLI usage metrics。

這些變化沒有推翻 `herdr-skills` 現行方向，反而更強化兩個決策：

- package/install/update/enterprise adoption telemetry 越來越屬於 host ecosystem 的 commodity capability，**Herdr 不應自行再造 marketplace、installer、registry 或 analytics pipeline**；
- Herdr 真正需要守住的是 host 無關的 domain semantics：`evidence != claim`、`candidate != active rule != permission`、effect/completion truth、privacy、staleness/conflict 與 runtime compatibility evidence。

Supermemory 在 2026-09-17 又把跨 agent persistent memory 帶進 Meta Muse Code，進一步說明「跨 session / 跨 coding agent 記憶」正在商品化；但 memory portability 仍不等於 correction correctness、policy promotion 或 action authority，因此只強化既有 #6 邊界，沒有形成新 root cause。

---

## Product → market category mapping

`herdr-skills` 本輪對照：

1. **Direct platform / distribution substitute**：GitHub Agent Plugins 1.0 / Copilot plugin governance；
2. **Adjacent admin/measurement workflow**：GitHub Copilot agentic customization usage metrics；
3. **Adjacent cross-agent memory product**：Supermemory plugins；
4. **Current product job**：兩個窄的 personal Herdr skills，提供 evidence-backed local learning 與 machine-checkable supervision，不是 generic agent host 或 enterprise control plane。

# External Signals

## A. GitHub 2026-09-17：Agentic CLI customizations 進入 usage metrics

**Status:** `CONFIRMED` first-party changelog。  
**Published:** 2026-09-17。  
**Checked:** 2026-09-22。  
**Source:** https://github.blog/changelog/2026-09-17-agentic-cli-customizations-now-in-the-usage-metrics-api/

GitHub 現在會在 Copilot CLI enterprise/org usage reports 中呈現 skills、custom agents、MCP servers、slash commands、plugins 的 top usage 與 distinct-use counts。官方同時保留重要限制：customer-defined item names 為隱私會被歸成 `other`；MCP 的 `interaction_count` 計的是 connect/reconnect attempts，成功與失敗都計入；plugin totals 只是 plugin-associated skill invocations 的 subset。

### User job / transferable signal

企業管理者想知道：哪些 customization 真的被使用、哪些需要 enablement，而不必每個團隊自己建 telemetry dashboard。

對 Herdr 最重要的不是加 dashboard，而是避免把 **invocation/adoption** 冒充 **correctness/outcome/authority**：

`skill invoked` ≠ `task succeeded` ≠ `rule validated` ≠ `permission granted`。

### Gate result

目前 `herdr-skills` 是 personal/private repo，沒有 owner evidence 顯示以 Copilot Business/Enterprise metrics 管理這兩個 skills 是核心工作，也沒有證據顯示缺 telemetry 造成 rework 或 failure。

**Classification:** `OPPORTUNITY / severity=NOT_ESTABLISHED / decision_priority=LOW / triage=NEEDS_EVIDENCE / auto_implementation=false`。

**Decision:** `REPORT_ONLY / HOLD`。

若未來真有 Copilot org adoption job，最小研究是直接讀 host-native metrics，驗證它能否回答「是否被使用」；Herdr 自己只保留 domain-specific outcome/evidence receipts。不建 telemetry DB、analytics service 或 usage collector。

## B. GitHub Agent Plugins 1.0：portable package 已把 skills + MCP server 合成跨 client 安裝單位

**Status:** `CONFIRMED` first-party changelog。  
**Published:** 2026-08-12（spec 1.0 於 2026-08-06 發布）。  
**Checked:** 2026-09-22。  
**Source:** https://github.blog/changelog/2026-08-12-agent-plugins-1-0-in-vs-code-copilot-cli-and-the-copilot-app/

GitHub 說明 Agent Plugins 1.0 是由 AWS、Anysphere、Microsoft、OpenAI、Vercel 共同發布，Google 加入 core maintainer；一個 package 可把 Agent Skills 與 MCP server configuration 一起帶到相容 clients。VS Code、Copilot CLI、Copilot SDK、Copilot app 已 GA 支援，企業端可用既有 managed settings 與 MCP allowlists 控制 plugins/marketplaces。

OpenAI current developer docs也採同一 portable package 概念：root `plugin.json`，portable `skills/` 與 `mcp.json`，host-specific extension 另 namespaced。Source: https://developers.openai.com/plugins/build/plugins

### Repo implication

這比 2026-09-20 radar 的「`SKILL.md` 是跨 host 格式」再往前一步：現在連 **bundle identity / install / distribution / governance** 也開始標準化。這再次否決為 #10 建 host registry、installer service、package manager 或 compatibility database。

但這也**不會自動修掉 #10**：portable package spec 只證明 host 可找到 package，仍不證明 skill 內部 Python helper path、state root、permission model、Herdr runtime semantics 能在另一 host 正確工作。

**Decision:** `REINFORCE #10 MINIMUM SCOPE / NO ISSUE UPDATE`。

如果未來 owner 真的需要把 Reflect/Supervisor 與某個 MCP server 一起分發，最小研究才是把 current package 放入 Agent Plugins fixture，檢查 discovery + helper resolution + state/effect semantics；不是現在就轉整個 repo 成 plugin product。

## C. Supermemory 2026-09-17：persistent memory 跨 coding agent 延伸到 Meta Muse Code

**Status:** `CONFIRMED` first-party changelog。  
**Published:** 2026-09-17。  
**Checked:** 2026-09-22。  
**Source:** https://supermemory.ai/changelog/add-persistent-memory-to-meta-muse-code/

Supermemory 的 Muse Code plugin 會在 session 開始載入 project profile/recent memories，並在 prompts 中查詢/注入 memory；它重用 Claude Code plugin login，使一個 agent 記下的決定能在另一個 agent 被召回，也允許指向 self-hosted server。

### Product implication

這使「跨 session / 跨 coding agent persistent memory」更接近 commodity feature。`herdr-reflect` 不應靠「有 memory」本身差異化，而應靠：來源 evidence、trusted validation、stale/conflict handling、privacy boundary、candidate/active/permission separation。

這是 **DEDUPE -> #6 / SKIPPED_ACTIVE_SCOPE**，不是新需求。Supermemory 的 cross-agent recall 不證明 repeated correction 應自動變 policy，也不證明任何 learned rule 應取得 effect authority。

**Classification:** `RESEARCH SIGNAL / severity=NOT_ESTABLISHED / decision_priority=MEDIUM only as evidence for existing #6 / auto_implementation=false`。

# New Releases / strategy changes

| Date | Product / change | Confidence | Consequence |
|---|---|---|---|
| 2026-09-17 | GitHub Copilot usage metrics 新增 skills/custom agents/MCP/plugins | CONFIRMED | adoption measurement 成為 host capability；invocation 不可冒充 outcome/authorization |
| 2026-09-17 | Supermemory 把 cross-agent persistent memory 延伸到 Meta Muse Code | CONFIRMED | generic memory portability 更商品化；支持 #6 的 evidence/promotion boundary，不新增功能單 |
| 2026-08-12 | Agent Plugins 1.0 在 VS Code/Copilot CLI/SDK/app GA | CONFIRMED | packaging/install/governance 進一步標準化；不自建 package manager |
| current 2026-09-22 | OpenAI developer docs採 Agent Plugins portable package (`plugin.json` + `skills/` + `mcp.json`) | CONFIRMED current | portable syntax/package ≠ Herdr runtime compatibility；#10 仍應維持窄修 |

# Community Pain

本輪沒有找到比 first-party platform evidence 更強、且能改變 `herdr-skills` 優先級的新鮮社群證據。近期 Reddit 對 `AGENTS.md` portability、skills marketplace、cross-agent context 的討論可證明市場興趣，但樣本零散且無法建立 Reese-max 的實際發生率，因此不作為立案或 severity 證據。

# Adjacent Ideas

## 1. Host-native adoption metrics as optional evidence — HOLD

只有未來 owner 真正以 Copilot org/enterprise 管理這些 skills，才研究 host-native usage metrics。

最小實驗：
1. 不新增 telemetry；
2. 讀一份 host-native aggregate report；
3. 確認能回答「是否有人使用／使用種類是否增加」；
4. 明確把它與 task outcome、rule correctness、promotion、permission 分離。

Exit：
- `BUILD`：只有當 owner 確實需要 adoption reporting 且 host-native report 缺一個極小的 domain receipt bridge；
- `NARROW`：直接文件化如何看 host metric 即足夠；
- `REJECT`：personal workflow 無此需要。

No Issue now.

## 2. Agent Plugin packaging — HOLD, not migration

只有實際 distribution friction 顯示「同一 Herdr bundle 要在多 client 重複維護 manifest / skill + MCP dependency」時，才用一個 isolated package fixture 比較現況。第一步不能改 runtime/state semantics，也不能宣稱所有 host compatible。

# Opportunity Map — `herdr-skills`

### MUST MATCH

- #10：如果宣稱 `~/.agents/skills` compatible-host install，helper invocation 必須與實際 loaded skill path 相符；否則收窄支援宣稱。
- `candidate != active rule != permission`；memory recall / usage count / package install 都不能提升 authority。
- #3 relocation/rebind 的 integrity、invalidation、chain/recovery semantics 必須由既有 scope 關閉，不被 packaging 研究取代。
- Cross-host compatibility 只能按實際執行路徑宣稱；同格式／同 package 不等於行為相容。

### SHOULD BE BETTER

- 讓 host commodity 層負責 install/update/provenance/marketplace/admin metrics；Herdr 只保存 domain-specific evidence/effect truth。
- 對任何 adoption metric 清楚標示 measure definition；connection attempt、invocation 與 successful effect 不混用。
- 若未來 packaging 跨 host，先用 deterministic fixtures 檢查 helper path、state root、permission/effect behavior，而不是做廣泛 certification framework。

### DIFFERENTIATOR

- privacy-preserving evidence-backed learning，而非只做 persistent memory；
- trusted validation、stale/conflict semantics；
- machine-checkable run/effect/completion gate；
- memory/policy/permission 清楚分離；
- provider/host 可替換時仍保留 truth semantics。

### ADJACENT IDEA

- host-native usage metric 作「adoption evidence」；
- Agent Plugins package fixture 作「distribution compatibility evidence」。

### DO NOT COPY

- 自建 plugin marketplace / skill registry / package manager；
- 自建 enterprise usage dashboard / telemetry warehouse；
- hosted transcript/memory SaaS；
- 因 cross-agent memory 流行就把所有 session 原文永久保存；
- 因 plugin 可安裝就宣稱 Herdr runtime 已相容；
- automatic policy writer / invocation-count-based promotion；
- 在 #3/#6 active PR 尚未收斂前擴其 scope。

# Cross-portfolio ideas

只保留兩個 invariant，不提 shared service：

1. **Adoption ≠ Effectiveness ≠ Authority**  
   `installed / invoked / connected` 只能證明某種使用；不能證明 task 成功、rule 正確、外部 effect 成功或取得新權限。
2. **Portable Package ≠ Portable Runtime Semantics**  
   `package discovered -> helper/runtime path exercised -> state/effect semantics verified -> scoped compatibility claim`，而不是 `same plugin/skill spec -> compatible`。

這兩條可供 `skill-foundry`、`autodev-ng`、`lobsterpulse` 等產品在各自範圍參考，但本輪不建立 portfolio-wide framework。

# Four-gate decisions

## Candidate A — build Herdr usage analytics because GitHub now measures skills/plugins

1. **問題/價值**：市場已提供 adoption metrics，但 repo/user evidence 沒有顯示缺 usage dashboard 造成核心工作失敗。
2. **優先級**：`OPPORTUNITY / NOT_ESTABLISHED / LOW / NEEDS_EVIDENCE`。
3. **最小方案**：真的需要時先直接使用 host-native metrics；不用改 Herdr。
4. **研究/實作分離**：沒有 Issue、沒有 telemetry write、沒有 implementation authority。

Decision: **HOLD / NO ISSUE**。

## Candidate B — migrate herdr-skills to Agent Plugins 1.0 now

1. **問題/價值**：portable bundling 已成平台能力，但目前 repo 是兩個 personal skills，未證明 manifest duplication 或 skill+MCP bundle 是真實 friction。
2. **優先級**：`OPPORTUNITY / NOT_ESTABLISHED / LOW / NEEDS_EVIDENCE`。
3. **最小方案**：若將來出現 distribution friction，只做一個 isolated packaging fixture；不先重構 repo/runtime。
4. **研究/實作分離**：外部標準存在不授權 migration。

Decision: **DEFER / NO ISSUE**。

## Candidate C — cross-agent memory means #6 should become implementation-ready

1. **問題/價值**：Supermemory 證明跨 agent recall 有產品需求，但它沒有證明 Reese-max 的 correction recurrence、privacy、false-generalization 或 policy-promotion問題已被驗證。
2. **優先級**：#6 在 Issue Quality v2 下仍應理解為 `RESEARCH / severity=NOT_ESTABLISHED`；歷史 `P1 Research / 94/100` 不等於已證實 P1 defect。
3. **最小方案**：保持既有 bounded research；先解 PR #8 privacy/schema review，再用 human-labelled fixtures 回答 BUILD/NARROW/REJECT。
4. **研究/實作分離**：PR #8 active；本輪 `SKIPPED_ACTIVE_SCOPE`，不留言、不重寫、不提升 READY。

Decision: **DEDUPE -> #6 / SKIPPED_ACTIVE_SCOPE**。

## Candidate D — Agent Plugins solves #10 automatically

1. **問題/價值**：#10 是 current source path contradiction，portable package spec 不會自動重寫 skill 內 hard-coded helper path。
2. **優先級**：保持 `BUG / P3 / MEDIUM / NEEDS_REVIEW / NEEDS_RUNTIME_VERIFICATION`；沒有新 runtime/frequency evidence 升級。
3. **最小方案**：仍是「收窄 Codex-only 宣稱」或「從 loaded skill root 解析 helper + deterministic alternate-path fixture」。
4. **研究/實作分離**：#10 存在不等於 worker/merge/deploy 授權；本輪沒有新 PR、沒有 implementation action。

Decision: **DEDUPE -> #10 / NO COMMENT**。

# Rejected Ideas / why

1. **Herdr plugin marketplace / package manager — REJECT.** Agent Plugins / host ecosystems 已開始承擔 commodity packaging/distribution；沒有獨立 user gap。
2. **Herdr analytics dashboard — REJECT now.** GitHub 已有 adoption metrics；repo 沒有 telemetry JTBD，且 invocation 不等於效果。
3. **將 Supermemory 式跨 agent memory 當 #6 成功證據 — REJECT.** Recall 與 correction correctness/promotion/permission 不同。
4. **立即宣稱 Copilot/VS Code/OpenAI plugin compatibility — REJECT.** Package discovery 不是 Herdr runtime/helper/state/effect execution evidence。
5. **把 #10 擴成所有 host/path/state migration — REJECT.** 現有 root cause 足以用窄文件或 helper-resolution 修正。
6. **因 PR #9/#8 存在就把 #3/#6 當已修復 — REJECT.** 兩者均未 merge，且仍有具體 review findings。

# Issue / PR mapping and coordination

| Scope | Current state | Radar action |
|---|---|---|
| #3 relocation/rebind | open; PR #9 open, unmerged, review findings present | `SKIPPED_ACTIVE_SCOPE`; no mutation |
| #6 correction→candidate research | open; PR #8 open, unmerged, privacy/schema review findings present | `SKIPPED_ACTIVE_SCOPE`; external memory signal report-only |
| #10 `.agents/skills` vs `.codex/skills` helper path | existing P3 bug; current source contradiction still present; no matching PR found | `DEDUPE`; keep severity/scope; no comment |
| New analytics opportunity | no established repo/user problem | no Issue |
| Agent Plugin packaging opportunity | no established distribution friction | no Issue |

No Issue lock was acquired because this run performed **no Issue/comment mutation** and did not seize any active scope. Unique report-file write does not rewrite shared index/history.

# Sources

Checked 2026-09-22:

1. GitHub, 2026-09-17 — Agentic CLI customizations now in usage metrics API  
   https://github.blog/changelog/2026-09-17-agentic-cli-customizations-now-in-the-usage-metrics-api/
2. GitHub, 2026-08-12 — Agent Plugins 1.0 in VS Code, Copilot CLI, and Copilot app  
   https://github.blog/changelog/2026-08-12-agent-plugins-1-0-in-vs-code-copilot-cli-and-the-copilot-app/
3. OpenAI Developers, current 2026-09-22 — Build/package Agent Plugins  
   https://developers.openai.com/plugins/build/plugins
4. Supermemory, 2026-09-17 — Add persistent memory to Meta Muse Code  
   https://supermemory.ai/changelog/add-persistent-memory-to-meta-muse-code/
5. Prior Herdr radar, 2026-09-20 — `docs/competitive-intelligence/2026-09-20T220621Z-external-radar.md`
6. Governing Issue Quality v2 — `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
7. Owner Product Board delta — `docs/portfolio-audit/2026-09-15T200427Z-product-board-delta.md`

# What Changed

相對 2026-09-20 的 `herdr-skills` radar：

- **新增市場層證據**：Skills 不只變成跨 host 可發現的格式，現在進一步成為可 portable bundling/governance 的 Agent Plugins package，且 GitHub 已把 skill/plugin/MCP adoption 納入 enterprise usage metrics。
- **新增相鄰競品證據**：Supermemory 把同一 cross-agent memory surface 延伸至 Meta Muse Code，generic memory portability 更商品化。
- **沒有 repo product-code delta**：default branch 仍 `9f134e1...`；#10 source contradiction仍在。
- **沒有優先級升級**：新證據沒有建立 #10 的真實 non-Codex occurrence/frequency，也沒有證明 #6 research 的 value/correctness；故不升 P2/P1、不轉 READY。
- **沒有方向反轉**：反而強化 INVEST/SIMPLIFY——commodity package/install/usage tracking 交給 host，Herdr 專注 evidence/policy/effect truth。

# Completion / gaps / cursor

- Fresh owner inventory：42 owned / 41 unarchived；pagination complete；page 2 empty。
- External categories：direct platform/distribution、adjacent measurement、adjacent cross-agent memory 均有 first-party source；沒有為了湊數引入弱社群證據。
- New Issues: **0**。
- Existing Issue/PR comments: **0**。
- Issue updates/reopens: **0**。
- `SKIPPED_ACTIVE_SCOPE`: **2**（#3/PR #9、#6/PR #8）。
- DEDUPE: **1**（#10）。
- Implementation authorization: **0**。
- Runtime executions claimed: **0**；cross-host execution仍 `NEEDS_RUNTIME_VERIFICATION`。
- Notification threshold: **not met**。外部信號是既有 portability/evidence 邊界的強化，沒有高價值新產品機會、未推翻 owner 方向、未形成新的 cross-project implementation capability。
- Next fair-rotation target：**`Reese-max/lobsterpulse`**。
