# 外部競品／新品／工作流靈感雷達 — 2026-09-16T06:01:29Z

## Scope / rules / evidence boundary

- Owner scope：只處理 `Reese-max` 自有且未封存 repository；未操作第三方 repository。
- Issue Quality：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`。
- Quality-rule blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh owner pagination：**42 owned repositories；39 unarchived**。archived：`gemini-deidentifier`、`openab`、`obsidian-vault`。
- Working classification 沿用最近已校準範圍：**36 product-like + 3 support/compatibility-only**；本輪沒有足夠證據改分類。
- 上一輪公平輪巡游標：`herdr-skills`；本輪完成此 cold-rotation target。下一個 cursor：**`ninax-line-hermes`**。
- `herdr-skills` default branch：`main@9f134e1b0a53ffe72a64a5793ddc7dabe03ed571`。最近 default-branch commit 是 audit docs；目前主要產品邏輯基線仍可追到 `ec91e1c61a288eca74c658d6e534604b6e45a5ee`。
- Open implementation/research ownership：#3 有 open PR #5 `fix/issue-3-rebind-project-alias`；#6 有 open PR #8 `devin/issue-6-correction-candidates`。因此相關新證據只進中央報告，**SKIPPED_LOCKED**，不重寫其 scope。
- PR #8 目前仍有 review finding：`STRUCTURED_ONLY` 與 exact diff/source retention 的 privacy contract 可能衝突，另有 schema example / schema-version 問題；本輪不把 PR 存在當成研究已驗證。
- 本輪沒有執行 live Herdr multi-agent run、真實 provider permission drift、外部 mutation canary、跨機 restore 或真人 correction pilot；未執行路徑仍是 `NEEDS_RUNTIME_VERIFICATION`。
- 本輪只新增中央 radar 報告；**0 新 Issue、0 既有 Issue 更新、0 實作授權**。
- 沒有修改產品 source、CI/config、secret、權限/settings；沒有建立 implementation branch、merge、deploy、worker、GOAL、付費試用或正式資料寫入。
- 本輪不宣告 portfolio CLEAN。

## Product direction re-read — herdr-skills

`herdr-skills` 目前是兩個個人 Herdr/Codex skills：

1. `herdr-reflect`：privacy-preserving、evidence-backed 的 recall / learning overlay；
2. `herdr-supervisor`：Herdr 多 Agent 工作的 policy + machine-checkable run-state / evidence / external-action gate。

現有產品方向已非常清楚地分開：

`memory / candidate rule -> validation -> active rule`

與

`external effect -> PREPARE -> AUTHORIZE -> EXECUTE -> VERIFY`

而且 learned rules 明確不能自行取得 spending、deploy、delete、external write 或其他 Herdr session control authority。Supervisor 另要求 policy/provider/permission/sandbox/plugin/MCP 等 drift 時重新評估 capability / permission / resource state。

因此本輪外部探索的首要問題不是「市場是否開始做 agent governance」；答案已經是肯定。真正要問的是：**現有 Herdr evidence/policy boundary 哪裡仍有可觀察人工斷點或 runtime blind spot，且是否值得用更小的方式補足？**

目前 repo 中已有兩條更具體、且正被處理的工作：

- #3 / PR #5：checkout move/restore 後 project-scoped learning identity continuity；
- #6 / PR #8：repeated correction/steering → privacy-safe candidate improvement research。

這兩項都有 active branch / PR，本 radar 不搶 scope。

## Executive decision

**0 new Issues；0 existing Issues modified。**

本輪最重要的新外部訊號是：**agent runtime 正把「policy hierarchy / managed permissions」做成 provider-native control plane，而不是把 memory / instructions 當 permission。**

GitHub 在 2026-09-09 GA 的 Copilot enterprise managed permissions 可把 shell、file read/edit、network-domain operation 分為 blocked / human approval / proceed-without-prompt，而且 centrally managed restriction 不能被 workspace/user settings、auto-approval 或先前保存的 approval 放寬。這個模式與 Herdr Supervisor 現有「learned rule ≠ permission、external action 要獨立授權」高度一致。

但它**不構成新的 Herdr feature demand**：

- current repo 已有 permission/sandbox drift gate；
- `run.json` 已綁 Herdr version/protocol/capabilities hash；
- external action 已有 PREPARE/AUTHORIZED/EXECUTED/VERIFIED lifecycle；
- 沒有實際 Herdr + Copilot/Claude runtime 證據顯示「provider-native permission profile 改變後，Herdr 仍錯誤沿用舊 external authorization」。

因此最小的未來驗證候選只應是：**若 runtime 能提供可讀的 permission/sandbox policy snapshot，測試把其 opaque ID/hash 綁到現有 run/effect evidence 是否能抓到真正的 drift；不能提供時保持 UNKNOWN。** 不先做 cross-provider permission registry、enterprise admin console、policy DSL 或另一套 IAM。

這一候選目前僅列 `ADJACENT IDEA / NEEDS_RUNTIME_EVIDENCE`，未達 Issue gate。

## External Signals

### A. Direct platform shift — GitHub Copilot managed permissions 把「不可由下層設定放寬」做成 runtime/admin policy

**CONFIRMED — published 2026-09-09；checked 2026-09-16 UTC。**

Source:
- https://github.blog/changelog/2026-09-09-enterprise-managed-permissions-for-github-copilot-agent-operations/

GitHub Copilot Business / Enterprise 管理者現在可集中設定 agent operation：

- `blocked`；
- `require human approval`；
- `proceed without prompt`。

覆蓋 shell command、file read/edit、network domain。最重要的產品語意是：**managed restrictions cannot be weakened by user/workspace settings, auto-approval, or previously saved approvals**。

**JTBD：** agent 可以在不同 surface 工作，但高層政策仍保持不可被下層 convenience setting 靜默削弱。

**減少人工步驟：** 不必在每個 agent/session 重新手動記住同一組 guardrails；runtime 自己執行 policy hierarchy。

**Onboarding / distribution：** policy 由平台管理並跨 Copilot app、CLI、VS Code Agent Host 生效，而不是要求每個 prompt 重複安全規則。

**Transferable：** Herdr Supervisor 應把 provider-native permission truth 視為外部 authority/evidence，而不是把 Reflect memory、Skill 或 task text 視為同一層。

**Do not copy：** Reese-max 是個人 local Herdr workflow；沒有 evidence 支持建立 enterprise team-policy editor、central directory、role matrix 或第二套 Copilot managed-settings clone。

### A2. Direct workflow — GitHub Copilot code review 讓已處理 feedback 自動離開 active queue

**CONFIRMED — published 2026-09-11；checked 2026-09-16 UTC。**

Source:
- https://github.blog/changelog/2026-09-11-auto-resolution-and-analysis-updates-in-copilot-code-review/

Copilot rereview 會在後續 commit 已處理原 finding 時自動 resolve 自己的 comment，未處理 feedback 保持 open；同時 reviewer 會用更多 shell tools 做 build/test/targeted validation。

**可移植模式：** feedback lifecycle 不只是「生成 suggestion」，而是 `finding -> changed state -> reread evidence -> resolved/still-open`。

但 #6 已經把 correction candidate 的 invalidation、conflict、support evidence、dismiss/merge/narrow 等生命周期放進研究，而且 PR #8 正在 active。此訊號為 **DUPLICATE / SKIPPED_LOCKED**，不另開「feedback lifecycle」Issue。

GitHub 在同一篇中的效果數字屬 GitHub 自己的 experiments，不外推成 Herdr 預期改善率。

### B. Adjacent workflow — Claude Code 明確分離 memory context 與 deterministic enforcement

**CONFIRMED current official docs；checked 2026-09-16 UTC；頁面未提供可靠 feature publish date。**

Sources:
- https://code.claude.com/docs/en/memory
- https://code.claude.com/docs/en/hooks-guide
- https://code.claude.com/docs/en/subagents

Claude Code current memory docs 明確表示 CLAUDE.md / auto memory 是 context，不保證 strict compliance；若某規則必須在固定 lifecycle point 執行，應使用 hooks。Hook 可在 tool call 前 block action；deny 可在 bypass permissions mode 下仍阻擋，而 hook 的 allow 不能越過 settings 的 deny rule。

這與 Herdr 現有邊界一致：

`remembered/learned instruction ≠ deterministic enforcement ≠ runtime authority`。

另一個值得記錄、但不能搶 active work 的細節是 Claude auto memory 的 project directory 由 **Git repository** 衍生，同一 repo 的 worktrees/subdirectories 共用 auto-memory directory；memory 仍是 machine-local、不自動跨機。這提供 #3 的相鄰設計證據：絕對路徑不是唯一 project identity 方案，但它也沒有解決跨機 restore identity。#3 已有 open PR #5，因此本輪 **SKIPPED_LOCKED**，不把競品做法直接改寫成新 scope。

Subagent persistent memory 還有一個重要 caution：啟用 memory 時 Read/Write/Edit tools 會自動可用來管理 memory directory。這再次說明「給 persistent memory」本身可能改變 runtime capability surface；Herdr 不應因為 memory/candidate 存在就推導外部 effect authority。

### C. Adjacent governance — Atlassian 把 agent loops、shared context 與 context controls 分層

**CONFIRMED — published 2026-09-10；checked 2026-09-16 UTC。**

Source:
- https://www.atlassian.com/blog/jira/governed-agent-loops

Atlassian 的最新方向把 Code Context、Agent Context Controls、Agent loops、Standards、AI Review、usage dashboard 拆開：shared context 解「agent 知不知道世界」，controls 解「agent 能看／能碰什麼」，review 解 outcome evaluation。

Availability 當輪為：Code Context paid-customer open beta；Agent loops / Standards / AI Review private early access；Context Controls / Agent Usage Dashboard 預計後續向 paid Jira customers GA。

**Transferable：** context、governance、execution、review/measurement 不要混成一個 state。

**Do not copy：** Atlassian 是 enterprise SDLC suite；Herdr 不需要 Teamwork Graph、org dashboard、usage analytics 或 another always-on workflow platform。文章內的 productivity/usage percentages 是 vendor study/analysis，不作 Reese-max ROI 或 adoption evidence。

### C2. Adjacent permission hierarchy — GitHub MCP allowlists

**CONFIRMED — released 2026-08-06；checked 2026-09-16 UTC。**

Source:
- https://github.blog/changelog/2026-08-06-mcp-allowlists-in-enterprise-managed-settings/

GitHub enterprise managed settings 可按 MCP remote URL、local stdio command 或 name 建 allow/deny；官方說 malformed/unverifiable policy fail closed，多層 policy 必須每層都通過。

**對 Herdr 的意義：** runtime/tool inventory 與 permission truth 可以由 provider 原生管理；Herdr 最小責任是知道「目前 run 綁到什麼 capability/policy evidence，以及變更後哪些 receipt 要 stale」，不是再建立一套 MCP marketplace / organization allowlist。

## New Releases / pricing / availability signals

| 日期 | 產品 / 能力 | 當輪確認 | 對 herdr-skills 的意義 |
|---|---|---|---|
| 2026-09-09 | GitHub Copilot managed agent permissions | GA；Business/Enterprise admin controls | 強化 authority hierarchy；不等於 Reese-max 需要 enterprise policy UI |
| 2026-09-11 | Copilot review auto-resolution | 已處理 comments 可在 rereview 自動 resolve | feedback lifecycle signal；#6/PR #8 已涵蓋且 active |
| current docs；checked 2026-09-16 | Claude Code memory / hooks / subagent memory | memory=context；hooks=deterministic lifecycle control | 支持 Herdr memory/permission 分離；#3 有 repo-identity相鄰證據 |
| 2026-09-10 | Atlassian governed agent loops | context / controls / loops / standards / review 分層；部分 beta/EA | enterprise-scale architecture signal，不照搬 suite |
| 2026-08-06 | GitHub MCP allowlists | GA enterprise managed setting | native runtime policy 可當 evidence source，而非再造 registry |

本輪沒有把付費 enterprise 功能的價格推成 Reese-max 定價訊號；上述主要是 governance/product-shape signal。

## Community Pain / evidence gap

本輪沒有保留足以改變優先級的高品質新 community 統計。零散論壇意見不被當作 failure prevalence。

真正缺的是 **Reese-max 自己的 runtime evidence**：

1. Herdr 實際協調的 Claude/Codex/Copilot runtimes 是否能暴露 stable permission/sandbox policy fingerprint？
2. permission/profile 在 run 中途改變時，現有 `policy_version/resource_registry_version/herdr_capabilities_sha256` 是否已足夠讓 Supervisor fail closed？
3. external action 若已 `AUTHORIZED`，再發生 provider/sandbox policy drift，現行 operator workflow 是否會重新授權，還是可能只靠舊 boolean/state 繼續？
4. provider-native policy 根本不可讀時，增加本地 schema 是否只會製造假的「已治理」感？

沒有執行上述 fixture/runtime path 前，不能把「schema 沒有 provider_policy_hash」本身當產品缺陷，也不能從 GitHub enterprise feature 推導 P1/P2。

## Opportunity Map — herdr-skills

### MUST MATCH

**Memory / Skill / learned rule 不能提升 permission authority。**

現有 Herdr 已基本 match：Reflect 明確禁止 learned rules 授權 spending/deploy/delete/external writes/session control；Supervisor external mutations另外走 PREPARE→AUTHORIZE→EXECUTE→VERIFY。

### SHOULD BE BETTER

**當 provider/runtime 有可驗證的 permission/sandbox truth 時，run evidence 應能判斷該 truth 是否 drift。**

目前 docs 已要求 permission/sandbox/plugin/MCP drift 時重新評估，但 run envelope 直接綁的是 Herdr capability hash；是否需要額外 native-policy evidence 尚未被 runtime 證明。

狀態：`NEEDS_RUNTIME_EVIDENCE`，不是 feature backlog。

### DIFFERENTIATOR

**Verified completion 高於 provider「agent finished」狀態。**

Herdr 的 task/lease/agent/evidence/source-state/external-action cleanup + Full Gate 讓 `DONE` 具有更窄且可機器驗證的語意。市場越把 hosted agent loops 做大，這個 evidence boundary 越值得維持，而不是被簡化成單一 provider session status。

### ADJACENT IDEA

**NativePermissionSnapshot adapter（若 runtime 支援）**：只讀 provider/runtime 提供的 policy/profile/version/decision evidence，轉成 opaque hash/ref，綁到既有 run/effect validation。

最小研究不是做 registry：

`read native policy state -> hash/ref -> authorize benign synthetic action -> change policy -> rerun validator/resume -> stale/re-authorize or UNKNOWN`

BUILD 只代表「薄 evidence binding 值得研究/實作」；若 current resource/policy drift gate已足夠則 REJECT；只能讀到不穩定/不可驗證的 UI/config 時 NARROW/REJECT。

### DO NOT COPY

- enterprise admin/role/team policy portal；
- 第二套 IAM / MCP marketplace / managed-settings clone；
- provider-specific auto-approval semantics當跨 runtime共同真理；
- raw transcript / full prompts 作 permission evidence；
- 「memory 自動學到規則」直接變成 enforcement；
- Atlassian/GitHub vendor metrics 當 Reese-max ROI。

## Four-gate candidate review

### Candidate 1 — bind native runtime permission policy to Herdr run evidence

**kind:** RESEARCH candidate only  
**severity:** NOT_ESTABLISHED  
**decision_priority:** LOW-to-MEDIUM until runtime evidence  
**triage:** NEEDS_EVIDENCE  
**auto_implementation:** false

1. **Problem/value**：目標使用者是用 Herdr 協調多 runtime 的單一 owner。外部市場顯示 provider policy hierarchy 正變得更明確；repo docs 也已把 permission/sandbox drift視為需重驗的事件。但目前沒有 actual Herdr run 證明 permission profile 改變會讓現行 evidence chain誤判。
2. **Counterevidence/current alternative**：current top-level policy/resource versions、Herdr capability hash、resume revalidation與 explicit external-action authorization 可能已足夠；provider policy也可能根本不可穩定讀取。
3. **No-change consequence**：目前 UNKNOWN。不能虛構成資料外洩或 unauthorized write 已發生。
4. **Smallest experiment**：一個 synthetic/no-production-effect fixture；先只觀察 provider permission state 是否可機器讀取，再模擬 mid-run drift，看現有 gate 是否已拒絕 stale action。若 current gate 已抓到，REJECT 新欄位；若抓不到且 native state穩定可讀，才 NARROW 到一個 opaque snapshot/ref。
5. **Why not smaller**：文件 reminder 已存在；只有 runtime fixture 才能回答是否真的有 blind spot。反過來，先建 cross-provider schema/registry反而更大且沒有價值證據。
6. **Cost/security**：額外 snapshot 可能誤導使用者認為 policy 已 enforced；必須只聲稱觀測到的 provider truth，讀不到就 UNKNOWN。

**Decision：NO ISSUE THIS ROUND。**

### Candidate 2 — repo-derived project identity for Reflect relocation

Claude Code current memory 以 git repository 導出 project memory directory、同 repo worktrees共享 memory，提供相鄰設計證據；但 #3 已有 active PR #5，且其目標是 safe rebind/alias recovery而不是照抄 Claude。**SKIPPED_LOCKED**，不留言、不改 scope。

### Candidate 3 — addressed correction auto-resolution

GitHub 2026-09-11 的 rereview lifecycle 是新鮮產品訊號，但 #6 已有 candidate/conflict/invalidation/disposition研究，PR #8 active且存在 privacy/schema review findings。**DUPLICATE + SKIPPED_LOCKED**，不新增 lifecycle Issue。

## Cross-portfolio ideas

本輪只保留一個可重用原則，不建立共用 framework：

**`native runtime policy truth -> evidence reference -> product authorization/effect gate`**。

`autodev-ng` 已有自己的 external-effect / principal 等研究邊界；Herdr 不應另造 portfolio-wide authority service。未來若兩邊都證明相同 runtime fingerprint/receipt 需求，再考慮共用最小 envelope；現在先保持 owning product 的窄 contract。

## Rejected Ideas

### REJECT — Enterprise policy dashboard / team admin center

GitHub、Atlassian 都在做，但 Reese-max 目前是個人 Herdr workflow；沒有多租戶/企業 admin JTBD 證據。

### REJECT — 讓 Reflect learned rule 直接變 runtime enforcement

Claude docs自己也把 memory context與 deterministic hooks分開；Herdr現有 boundary更嚴格。自動 enforcement會破壞 candidate/active/permission separation。

### REJECT — 立即把 Copilot/Claude permission schema標準化成跨 provider DSL

各 provider permission model差異很大；先證明實際 runtime blind spot與可穩定觀測 surface，否則只會製造 schema維護負擔。

### REJECT — 因 Claude auto memory 使用 git-repo identity 就重寫 #3

Claude memory仍 machine-local，且 #3已有 active rebind PR。競品 implementation detail只能當設計比較，不足以搶改 active scope。

### REJECT — 另開 feedback auto-resolution Issue

與 #6/PR #8 same user job / same lifecycle root，只有新 external evidence，沒有新的 validated gap。

## Issue Mapping / coordination

| Repo | Issue/PR | Current role | This round |
|---|---|---|---|
| `herdr-skills` | #3 / PR #5 | project relocation / rebind recovery | **SKIPPED_LOCKED**；Claude repo-derived memory identity只作相鄰 evidence |
| `herdr-skills` | #6 / PR #8 | correction → candidate improvement research | **SKIPPED_LOCKED**；Copilot rereview lifecycle為 duplicate evidence |
| `herdr-skills` | #2 | fixed-50 audit umbrella | no change；radar不宣告 CLEAN |
| `autodev-ng` | existing external-effect/principal research | portfolio coordination reference only | no scope change；不建立新的共用 authority framework |

### Historical severity / scope calibration

- #3：維持 `BUG / P2` 的 source-confirmed recovery/portability problem；PR #5 未 merge，且本輪沒有 runtime move/restore execution，所以不能宣告 fixed。
- #6：舊 Issue 使用「P1 Research」與 94/100 score 的歷史寫法；依 Issue Quality v2，當前應讀作 **`kind=RESEARCH / severity=NOT_ESTABLISHED / decision_priority=HIGH-ish / triage=NEEDS_EVIDENCE / auto_implementation=false`**。本輪不因 active PR而改正文，也不讓舊分數變成實作授權。
- provider-native permission snapshot：只在中央 radar，`RESEARCH candidate / NOT_ESTABLISHED / NEEDS_EVIDENCE`。

## Sources

Checked 2026-09-16 UTC unless noted.

1. **CONFIRMED / 2026-09-09** — GitHub Copilot enterprise managed permissions  
   https://github.blog/changelog/2026-09-09-enterprise-managed-permissions-for-github-copilot-agent-operations/
2. **CONFIRMED / 2026-09-11** — Copilot code review auto-resolution and deeper analysis  
   https://github.blog/changelog/2026-09-11-auto-resolution-and-analysis-updates-in-copilot-code-review/
3. **CONFIRMED / current official docs** — Claude Code memory  
   https://code.claude.com/docs/en/memory
4. **CONFIRMED / current official docs** — Claude Code hooks  
   https://code.claude.com/docs/en/hooks-guide
5. **CONFIRMED / current official docs** — Claude Code subagents / persistent memory  
   https://code.claude.com/docs/en/subagents
6. **CONFIRMED / 2026-09-10** — Atlassian governed agent loops  
   https://www.atlassian.com/blog/jira/governed-agent-loops
7. **CONFIRMED / 2026-08-06** — GitHub MCP allowlists in enterprise managed settings  
   https://github.blog/changelog/2026-08-06-mcp-allowlists-in-enterprise-managed-settings/

No community source is used as prevalence evidence this round.

## What Changed from prior radar

Relative to `docs/competitive-intelligence/2026-09-16T040537Z-external-radar.md`：

1. 公平輪巡從 `google-maps-personal-mcp` 推進到 `herdr-skills`。
2. 新增 GitHub 2026-09-09 managed agent permissions 與 2026-09-11 review auto-resolution 的當輪 evidence。
3. 用 Claude Code current memory/hooks/subagent docs 交叉檢查 Herdr 的 memory/enforcement/permission 分離；結果主要是**確認現有方向，不是新增功能需求**。
4. 找到一個值得未來 bounded runtime fixture 驗證的問題：provider-native permission/sandbox policy drift 是否需要獨立 evidence binding；但目前 repo 已有 conceptual drift gate，沒有 actual failure evidence，因此不開 Issue。
5. #3、#6 都有 active PR；相關新 evidence 全部 `SKIPPED_LOCKED`，沒有搶 scope。
6. 依 Issue Quality v2 重新解讀 #6 的歷史「P1 Research / 94」：研究優先級不等於 P1 product defect，也不構成 worker authorization。

## Completion / gaps / next cursor

### Completed

- fresh owner pagination：42 owned / 39 unarchived；
- reread Issue Quality v2 + recorded blob SHA；
- reread current `herdr-skills` README、Supervisor state schema / validator / external-action docs、open issues、all-state PRs、#6 comments及 active PR review；
- 外部 A/B/C 探索以 GitHub、Anthropic、Atlassian first-party sources為主；
- candidate gate / dedupe / active ownership check；
- 0 new Issue / 0 Issue update decision；
- central report written as unique round artifact。

### Gaps retained

- 未執行 Herdr runtime permission-drift fixture；
- 未執行 #3 relocation runtime recovery；
- 未執行 #6 privacy-safe correction clustering pilot；
- 未證明任一 provider permission profile可穩定讀取並映射到 Herdr run state；
- host-local owner/heartbeat若不在 GitHub surface，仍屬 UNKNOWN；本輪因不修改 active Issues，未將不可見狀態冒稱為不存在。

### Fair rotation

下一個 cold-rotation cursor：**`ninax-line-hermes`**。它在更早輪次曾出現 identity/redelivery/edit-order相關訊號，但相較本輪 target 已較久未做新鮮深讀；後輪仍須重新以 current repo + 30–90 day external sources判斷，不沿用舊結論當現況。

---

本輪核心校準：

> **`Memory / instruction ≠ enforcement；runtime policy ≠ product authorization；provider permission state ≠ verified external effect。`**

外部平台越來越會提供自己的 managed policy，Herdr 最小且值得保留的角色是把真實 runtime state、task contract、authorization、effect與驗證證據綁在一起；不是再做一套更大的企業治理平台。
