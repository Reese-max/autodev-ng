# 外部競品／新品／工作流靈感雷達 — 2026-09-18T20:00:22Z

Status: **COMPLETE / MATERIAL_STRATEGIC_SIGNAL / NO_NEW_ISSUE**

> 查閱日：2026-09-18 UTC（臺灣時間 2026-09-19）。
> Issue Quality：`issue_quality_version: 2`；規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
> 本輪只做公開網路研究、GitHub read 與新增中央報告；**沒有修改產品原始碼、CI/config、secrets、權限/settings，沒有建立實作 branch、merge/deploy、啟動 worker/run/GOAL、付費 provider request 或正式資料寫入。**

## Executive Summary

Fresh connected GitHub inventory 完整分頁結果仍為 **41 個 Reese-max-owned repositories / 40 個 unarchived**；`obsidian-vault` 為 archived。上一輪 cursor 指向 **`Reese-max/herdr-skills`**，因此本輪以它為 primary repo。

`herdr-skills` current default branch 為 `main@9f134e1b0a53ffe72a64a5793ddc7dabe03ed571`；該 commit 只是 50-persona audit 文件，產品 baseline 仍是 `ec91e1c61a288eca74c658d6e534604b6e45a5ee`。目前 default-branch scope 很清楚：

- `herdr-reflect`：privacy-preserving、evidence-backed recall / learning；candidate、active、stale、conflict 與 permission 分離。
- `herdr-supervisor`：Herdr 多 agent run 的 policy + machine-checkable run-state gate；不是 Herdr CLI 或通用 agent runtime 的替代品。

本輪出現兩個高價值外部策略訊號：

1. **OpenAI 2026-09-10 Agents API** 已把 context management、tool use、subagent coordination、long-running infrastructure 與 execution environment 產品化成 managed Codex harness。
2. **Notion 2026-09-15 3.7** 同時把 team Skills Library、從既有工作建議 skill、`SKILL.md` 跨 Claude Code/Codex/Cursor/Gemini/Grok 分發，以及 sub-agent delegation 做成產品級能力。

這兩個訊號共同指向一個重要產品校準：**generic orchestration 與 skill library / distribution 正快速上移成平台 commodity。`herdr-skills` 不應因此擴成另一個 agent runtime、team skills marketplace 或 generic orchestration platform；真正值得保留的差異化，是 evidence-backed learning governance、candidate ≠ active、state-bound receipts、fail-closed completion/effect gates。**

對既有 #6 Correction→Candidate Improvement research 而言，Notion 的「根據你已經做的工作建議 skills」是新的市場佐證，但不是新的根因，也不是實作授權。#6 已有 open PR #8，且 PR #8 review 已指出 STRUCTURED_ONLY exact diff 可能重新保存敏感 source/secret、schema example 不可 parse、FeedbackSignal 缺 version discriminator。此範圍仍有 active work，因此本輪標記 **DEDUP / SKIPPED_LOCKED_ACTIVE_PR#8**，不搶改 Issue/PR。

四道 Gate 後結果：**0 新 Issue、0 Issue 修改／留言、0 PR 留言、0 implementation authorization**。

下一個公平輪巡 cursor：**`Reese-max/lobsterpulse`**。

---

## Direction / Current GitHub Coordination

### Current owner/product scope

本輪重新核對 `README.md`、兩份 `SKILL.md`、default-branch audit、open/closed Issues 與 all-state PR。未發現比 current default branch 更高優先、且已明確核定的 scope expansion；draft Product Board PR #7 不被當成 owner-approved default-branch product contract。

現行方向：

- Reflect 只保存短結論與 evidence references，不保存 raw prompt、完整 terminal output、source snippets 或 secret。
- `agent_claim` 不能 promote；trusted deterministic/human evidence 才能進入既有 promotion gate。
- learned rule 不能授權 spending、deploy、delete、external write 或控制另一個 Herdr session。
- Supervisor 只在真的存在 task graph / writer-reviewer coordination / long-run resume / integration queue 時啟用；單一 agent 或 deterministic tool 足夠時應停在更小 topology。
- Externalized state 高於 conversation / agent self-report；`PASS`、`done`、`idle` 都不是 completion evidence。

### Existing findings / active scopes

- #3：project-scoped learning 以 canonical path-derived identity 為基礎，checkout move / restore 後既有 project learning 可能失聯。既有 P2 finding；open PR #5 與 #9 都在處理 rebind/alias。**本輪不碰。**
- #6：Correction→Candidate Improvement research。open PR #8（head `370766a5c316571bf831372369b1c2c41f1f1090`）為 research docs，open draft PR #7 也引用 #6。PR #8 review 已有 privacy/schema 具體 findings，head 尚未有後續 commit。**本輪不碰。**
- Round 1 audit 仍是 NOT CLEAN；本雷達不更改 CLEAN 狀態。

### Issue Quality v2 calibration

#6 舊正文中的 `P1 Research` 與 `94/100` 是 Issue Quality v2 生效前的歷史寫法。依目前規則，更精確的當前分類應是：

```yaml
issue_quality_version: 2
kind: RESEARCH
severity: NOT_ESTABLISHED
evidence: NEEDS_EVIDENCE
triage: NEEDS_EVIDENCE
decision_priority: MEDIUM_HIGH
auto_implementation: false
```

原因：外部市場已證實 JTBD 存在，但仍不知道真實 Herdr workflows 是否有足夠、可 privacy-safe 正規化的 correction evidence，也尚未證明 recurrence clustering 對 owner workflow 的 false-positive / privacy / rule-bloat tradeoff。由於 #8 active，不在本輪重寫 Issue body 或 scope；只在中央報告記錄校準。

---

## Product → Market Category

1. **Direct coding-agent control / improvement sidecar**：Blume。
2. **Provider-owned managed agent harness**：OpenAI Agents API / Codex harness。
3. **Portable team skill / agent knowledge layer**：Notion Skills、Agent Skills ecosystem。
4. **Cross-agent memory / recall layer**：Supermemory、GitHub Copilot Memory。
5. **Herdr-specific differentiation**：evidence-bound learning + run-state verification + external-action authority separation。

---

# External Signals

## A. Direct competitor — Blume 仍驗證 correction → proposed durable guidance，但沒有新 root cause

**CONFIRMED PRODUCT CLAIM｜release 2026-07-27；current site checked 2026-09-18**

Sources:
- https://blume.codes/
- https://blume.codes/blog/you-already-told-your-agent-that

Blume 仍主打跨 Claude Code / Codex / Cursor 等 coding agents 的 sidecar：從 repeated corrections / steering 中找 pattern，提出 skill / rule / hook / doc change，顯示來源 evidence 與 exact diff，再由使用者 Apply / Snooze / Dismiss。

### User job

減少：
`再次糾正 agent → 想起自己以前也講過 → 離開任務 → 手動整理 CLAUDE.md/AGENTS.md/Skill → 再回任務`

### Transferable

- correction 應先形成 **proposal**，不是直接 action；
- candidate 需要 source evidence；
- exact change preview 很有價值，但必須受 privacy/redaction boundary 控制。

### Do not copy

- 不因 recurrence 次數就自動 promote；
- 不默認永久保存 raw transcripts；
- 不把 desktop control center、usage dashboard 或 team domain model當作 #6 的必要依賴。

**Decision：DEDUP → #6；NO NEW ISSUE。**

---

## B. Major adjacent strategy — OpenAI Agents API 把 generic long-running harness 變成 provider infrastructure

**CONFIRMED｜2026-09-10｜checked 2026-09-18**

Source:
- https://openai.com/index/introducing-the-agents-api/

OpenAI 第一方把 Agents API 定義為 fully managed Codex harness。核心能力包括：

- context management；
- efficient tool use；
- coordinated subagents；
- 可運行數日的 long-running infrastructure；
- 可操作 files、run code、保存 intermediate results 的 environment；
- managed / external sandbox options。

這直接碰到 `herdr-supervisor` 所處的市場層，但**不是目前的競品缺口**：Supervisor 本來就明確自我限制為 Herdr policy/run-state gate，而不是 generic runtime replacement。

### What this changes

過去可以假設「多 agent 編排 / context management / long-run resume」本身足以成為產品差異；現在 provider 正把這些做成 base harness。對 `herdr-skills`，更合理的產品邊界是：

`provider/runtime orchestration` **≠** `trusted evidence / run-state / permission / completion authority`

也就是讓平台負責越來越多通用 orchestration，Herdr layer 只在真的有價值的地方做：task contract、lease、source-state identity、evidence freshness、integration gate、effect authorization 與 verified completion。

### Smaller next step

目前 **不需要** Agents API adapter、multi-provider supervisor framework 或 backend registry。只有日後出現真實 owner workflow：同一個 Supervisor policy 必須跨 Herdr 與 managed Agents API 重用，而且現有 policy docs 無法人工搬運時，才值得先做一個薄的 receipt/state contract compatibility experiment。

**Decision：DIFFERENTIATOR REINFORCEMENT / NO ISSUE。**

---

## C. Major adjacent strategy — Notion 把「從既有工作形成 skill」與 skill distribution 平台化

**CONFIRMED｜2026-09-15｜checked 2026-09-18**

Source:
- https://www.notion.com/en-gb/releases/2026-09-15

Notion 3.7 現在提供：

- team-wide reusable skills library；
- 可根據使用者「已經在做的工作」建議 skills；
- skill 可下載成 `SKILL.md`，帶到 Claude Code、Codex、Cursor、Gemini、Grok；
- skill 更新有版本提醒；
- Custom Agent 可呼叫不同 instructions/context/access/model 的 sub-agents；
- connected-tool mutation 仍有 confirmation。

對 #6 最重要的是「**從已發生工作推導 reusable skill candidate**」已由另一個大型產品採用；這增加 JTBD 的市場可信度。但它仍沒有提供 Reese-max 需要的獨立 runtime evidence：

- 不證明 Herdr correction clustering precision；
- 不證明 candidate 應自動 activate；
- 不證明需要 team library；
- 不證明 Notion 的 update/version model 適合 Reflect 的 stale/conflict semantics。

### Product implication

Notion 反而讓 **Skill Library / distribution 本身更不值得在 herdr-skills 重造**。若 #6 最終 BUILD，最小有價值輸出仍應只是 evidence-backed `CandidateImprovement` / `SKILL_DRAFT` handoff，讓 `skill-foundry` 或標準 Skill runtime 承接後段，而不是蓋新的 catalog、team hub、sync service。

**Decision：#6 NEW CORROBORATING EVIDENCE，但 `SKIPPED_LOCKED_ACTIVE_PR#8`；不留言、不改 scope。**

---

## D. Memory market — frictionless recall 正普及，但 governance / authority 邊界同樣變重要

### Supermemory

**CONFIRMED PRODUCT CLAIM｜2026-08-21 / security update 2026-08-12｜checked 2026-09-18**

Source:
- https://supermemory.ai/changelog/automatic-memory-recall-and-a-live-statusline-in-claude-code/
- https://supermemory.ai/changelog/plugins/claude/

Supermemory 將 relevant memories 自動注入 substantive prompts，statusline 顯示 loaded/captured/recalled 狀態與 token cost。這降低 manual bookkeeping；同一 changelog 亦有 8/12 memory-plugin security update，提醒 memory injection 路徑本身可能碰到 permission boundary。

對 Herdr 的可移植原則不是「更自動地注入更多 memory」，而是保留：

`memory/lesson → candidate/active state → applicability → permission/effect gate`

目前 Reflect 已有這個安全方向，不形成新 Issue。

### GitHub Copilot Memory

**CONFIRMED｜2026-05-26 / 2026-06-02；slower-moving governance baseline checked 2026-09-18**

Sources:
- https://github.blog/changelog/2026-05-26-copilot-memory-has-more-controls-for-deletion-scope-and-the-copilot-cli/
- https://github.blog/changelog/2026-06-02-copilot-memory-supports-user-preferences-for-business-enterprise/

GitHub 已把 user/repo scope、admin policy、export for audit、bulk delete、user opt-out 與 billing-entity isolation 拉進 Memory 治理面。這支持 Herdr Reflect 目前「scope、可撤銷、可 audit、不可用 memory 擴權」的定位；不支持另造 enterprise memory admin console。

**Decision：MUST MATCH governance principle already present / NO ISSUE。**

---

# New Releases / Current Changes

| Date | Signal | Evidence | Decision |
|---|---|---|---|
| 2026-09-15 | Notion 3.7：team skills、work→skill suggestions、SKILL.md export、subagents | Notion first-party | #6 新市場佐證；active PR #8，no write |
| 2026-09-10 | OpenAI Agents API：managed Codex harness / subagents / long-running infra | OpenAI first-party | Generic orchestration commoditizing；reinforce narrow Supervisor scope |
| 2026-08-21 | Supermemory automatic recall + statusline | Supermemory first-party | Frictionless memory signal；no authority change |
| 2026-08-12 | Supermemory memory-plugin security update | Supermemory first-party | Reinforces memory ≠ permission |
| 2026-07-27 | Blume repeated correction → proposed skill | Blume first-party | Already mapped to #6；duplicate |

---

# Community Pain

本輪沒有可靠的新 community incidence 足以改 priority。近期 coding-agent 社群仍可看到兩種相反訴求：

- 希望 agent 記住重複 correction，減少反覆說明；
- 認為單靠 instruction/memory 不可靠，真正高價值規則應轉成 mechanical gate / deterministic check。

這些都只能標 **COMMUNITY_SIGNAL**，不能推算發生率、ROI 或「幾次 correction 就該成規則」。它們與現有 #6 的 minority path 一致：先 deterministic same-key / explicit correction，再量 semantic clustering 的 false-positive cost。

因此本輪沒有因社群訊號調高 severity，也沒有建立 auto-rule Issue。

---

# Adjacent Ideas

## 1. Host-neutral evidence receipts — 保留為未立案研究候選

若未來 Herdr Supervisor 真正需要跨 provider-managed harness 使用，最小可移植單位不應是「整個 Supervisor runtime」，而是小型、host-neutral receipt envelope：

- task / attempt identity；
- source-state identity；
- evidence locator/hash；
- completion state；
- permission/effect decision；
- runtime/capability fingerprint。

目前沒有 owner workflow evidence 顯示需要這個抽象層，因此只列 **ADJACENT IDEA / NOT_ESTABLISHED**，不開 Issue。

## 2. Work-to-skill suggestion — #6 若繼續，只做 candidate intake，不做 library

Notion 已把 skill library / sync / distribution 商品化；#6 的最小差異化應繼續放在：

`repeated trusted corrections → privacy-safe candidate → counterexamples/conflict → exact bounded proposal → existing promotion / foundry evaluation`

而不是 team skills hub。

---

# Opportunity Map

| Class | Opportunity / boundary | Decision |
|---|---|---|
| **MUST MATCH** | candidate ≠ active；memory ≠ permission；source evidence；scope；invalidate/delete；state-bound completion | 已存在核心能力，持續守住 |
| **SHOULD BE BETTER** | 同時顯示 why-now、support/counterexample IDs、redaction state、runtime applicability，而非 opaque memory/rule | #6 research；未授權實作 |
| **DIFFERENTIATOR** | 在 commodity harness / skill distribution 之上提供 evidence + run-state + effect authority separation | 強化目前產品定位 |
| **ADJACENT IDEA** | 若跨 runtime 需求出現，再測 host-neutral receipt envelope | NEEDS_USER_WORKFLOW_EVIDENCE |
| **DO NOT COPY** | generic managed agent runtime、team skill marketplace、raw transcript cloud mining、auto-promote repeated corrections、第二套 registry/memory store | 明確排除 |

---

# Cross-Portfolio Ideas

1. **`skill-foundry`**：Notion 的 `SKILL.md` portability 進一步證明 Skill package/distribution 是標準化方向；Foundry 應繼續專注 exact revision / materialized bytes / compatibility evidence，不做 library SaaS。
2. **`autodev-ng`**：OpenAI managed harness 再次支持「orchestrator 不必擁有每個 backend 的所有 runtime internals」；portfolio differentiation 應放在 admission、evidence、ownership、verification，不以 agent 數量為產品價值。
3. **`adng-memory` / `claude-mem`**：Memory provider 越來越自動，越需要把 observed context、candidate policy、active behavior、permission 分開；不要把 recall success 當 compliance success。

這些只是共享設計原則，沒有形成新的 cross-repo root cause，因此不建 Issue。

---

# Rejected Ideas

1. **建立通用 Agents API / Claude / Codex / Herdr backend abstraction** — REJECT NOW。沒有真實 workflow 要求 Supervisor 跨這些 runtime；會先增加 adapter、quota、auth、state semantics 維護。
2. **建立 Herdr Team Skills Library / Marketplace** — REJECT。Notion 與標準 Skill ecosystem 正在商品化這層，且不符合目前 personal Herdr skills 範圍。
3. **因 Notion 可從既有工作建議 skills，就把 #6 直接轉 FEATURE / READY** — REJECT。外部 adoption ≠ Herdr runtime evidence；#6 尚有 active research PR 與 privacy/schema review findings。
4. **自動把 repeated correction 寫入 AGENTS.md / Skill** — REJECT。recurrence 只夠產 candidate，不足以授權 policy change。
5. **默認保存完整 agent transcripts 以提升 clustering** — REJECT。與 Reflect 的 privacy boundary 衝突；第一版若研究，應優先 structured/minimal evidence。
6. **把 vendor 的固定 retention / threshold 直接照搬** — REJECT。GitHub/Supermemory 的產品政策不是 Herdr 的真實需求證據。

---

# Issue Mapping / Dedup / Coordination

| Signal | Fingerprint result | Action |
|---|---|---|
| Blume repeated corrections → skills | same as #6 | DEDUP；no write |
| Notion work→skill suggestion | supports #6 JTBD, not new root cause | `SKIPPED_LOCKED_ACTIVE_PR#8` |
| OpenAI managed multi-agent harness | current Supervisor already intentionally policy-only | NO ISSUE |
| Memory governance / automatic recall | current Reflect already separates candidate/active/permission | NO ISSUE |
| Checkout relocation | existing #3 with PR #5/#9 | OUT OF SCOPE / active implementation |

No new Issue fingerprint passed all four gates.

### Active-scope coordination

- #6 previous issue lock has been released, but active PR #8 remains open at `370766a...`; PR #7 draft also references #6. No Issue lock was acquired because this run intentionally made no shared-Issue mutation.
- #3 has open PR #5 and #9. No scope rewrite.
- Unique radar report filename avoids shared-file overwrite and does not require editing historical reports.

---

# Four-Gate Decision

## Gate 1 — Problem / value

The market clearly validates two jobs: reduce repeated steering and make multi-agent work easier. But current repo already covers the critical trust boundary. No new supported-flow failure was found on current main.

## Gate 2 — Priority

- New platform shifts: strategic/high-value signal.
- Product defect severity: **NOT_ESTABLISHED** for any new candidate.
- #6 remains research, not P1/P2 defect.
- #3 remains the existing P2 recovery defect, already owned by active PRs.

## Gate 3 — Minimum solution

Current minimum is **no product code change**. Preserve scope; finish/review existing #3/#6 work. If cross-runtime demand appears later, test a small receipt-contract adapter before any orchestration framework.

## Gate 4 — Research / implementation separation

No external signal grants BUILD authority. #6 requires synthetic/frozen fixtures plus privacy-safe candidate quality evidence and a supervised runtime pilot before any READY_FOR_IMPLEMENTATION transition. Active PR #8 also has concrete review findings to resolve first.

---

# Runtime / Evidence Status

- No OpenAI Agents API runtime was invoked.
- No Notion Custom Agent / sub-agent workflow was executed.
- No Supermemory runtime was installed or tested.
- No live Herdr multi-agent run was executed this round.
- No external paid provider call was made.
- Current GitHub evidence is repository / issue / PR / CI history only.

Therefore no new runtime claim is made. Existing #6 remains **NEEDS_RUNTIME_VERIFICATION** and repository remains **NOT CLEAN** under its audit record; this radar does not declare portfolio CLEAN.

---

# Sources

Primary / first-party:

1. OpenAI — Introducing the Agents API — 2026-09-10  
   https://openai.com/index/introducing-the-agents-api/
2. Notion — Notion 3.7: Agent skills for your whole team — 2026-09-15  
   https://www.notion.com/en-gb/releases/2026-09-15
3. Blume — You already told your agent that — 2026-07-27  
   https://blume.codes/blog/you-already-told-your-agent-that
4. Blume current product — checked 2026-09-18  
   https://blume.codes/
5. Supermemory — Automatic memory recall and a live statusline in Claude Code — 2026-08-21  
   https://supermemory.ai/changelog/automatic-memory-recall-and-a-live-statusline-in-claude-code/
6. Supermemory plugin changelog / security update — 2026-08-12  
   https://supermemory.ai/changelog/plugins/claude/
7. GitHub — Copilot Memory deletion/scope/CLI controls — 2026-05-26  
   https://github.blog/changelog/2026-05-26-copilot-memory-has-more-controls-for-deletion-scope-and-the-copilot-cli/
8. GitHub — Copilot Memory user preferences / audit / policy — 2026-06-02  
   https://github.blog/changelog/2026-06-02-copilot-memory-supports-user-preferences-for-business-enterprise/

GitHub internal evidence:

- `Reese-max/herdr-skills@9f134e1b0a53ffe72a64a5793ddc7dabe03ed571`
- product baseline `ec91e1c61a288eca74c658d6e534604b6e45a5ee`
- Issues #2 / #3 / #6
- open PR #5 / #7 / #8 / #9
- `docs/audits/50-persona-round-1-2026-09-06.md`
- `herdr-reflect/SKILL.md`
- `herdr-supervisor/SKILL.md`

---

# What Changed This Round

1. **New strategic evidence:** OpenAI has now exposed the Codex long-running/subagent harness as managed Agents API infrastructure.
2. **New strategic evidence:** Notion now combines work-derived skill suggestions, portable `SKILL.md` distribution, shared skill library and subagents.
3. These developments **narrow**, rather than expand, Herdr Skills' sensible scope: generic harness + library/distribution are moving toward commodity/platform layers.
4. #6 gains corroborating market evidence but **does not gain implementation authority**; active PR #8 makes this run `SKIPPED_LOCKED` for Issue mutation.
5. The old #6 `P1 Research / 94` framing is recorded as historical and recalibrated conceptually to `RESEARCH / NOT_ESTABLISHED / NEEDS_EVIDENCE`; no active-scope rewrite performed.
6. **0 new Issue / 0 Issue edit-comment / 0 PR comment / 0 code or deployment action.**
7. Fresh inventory remains **41 owned / 40 unarchived**.
8. Next fair cursor: **`Reese-max/lobsterpulse`**.

## Bottom line

**Herdr Skills should not race platform vendors on generic subagents, managed execution, or skill catalogs. Its strongest defensible layer is narrower: make learning and multi-agent execution auditable, scoped, stale-aware and incapable of silently turning memory or agent output into authority.**
