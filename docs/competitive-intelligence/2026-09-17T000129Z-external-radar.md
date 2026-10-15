# 外部競品／新品／工作流靈感雷達 — 2026-09-17T00:01:29Z

## Scope / rules / evidence boundary

- Owner scope：只處理 `Reese-max` 自有 repository；未操作第三方 repository。
- Issue Quality：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`。
- Quality-rule blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- 本輪重新完整分頁列舉 connected owner inventory：**42 owned repositories；39 unarchived**；第二頁為空。archived：`gemini-deidentifier`、`openab`、`obsidian-vault`。working classification 沿用最近已核對的 **36 product-like + 3 support/compatibility-only**；本輪沒有足夠證據改分類。
- 上一份中央 radar `2026-09-16T220137Z-external-radar.md` 指定下一個 fair-rotation target 為 **`herdr-skills`**；本輪完成該 target。下一個 cursor：**`ninax-line-hermes`**。
- `herdr-skills` default branch：`main@9f134e1b0a53ffe72a64a5793ddc7dabe03ed571`；最近 default-branch commit 為 audit docs，current product-code baseline 仍為 `ec91e1c61a288eca74c658d6e534604b6e45a5ee`。
- Owner-approved direction re-read：維持 **INVEST / SIMPLIFY**；完成 #3 的 relocation recovery evidence、由 #6 / PR #8 處理 correction→candidate research；Supervisor 維持 provider-neutral evidence/authorization layer，不建立 hosted orchestrator、session DB、agent dashboard、transcript-mining SaaS、automatic policy writer 或 provider-specific mandatory runtime。
- Current active ownership：#3 / PR #5 `fix/issue-3-rebind-project-alias`；#6 / PR #8 `devin/issue-6-correction-candidates`。PR #8 仍有 privacy/schema review findings，因此相關新 evidence 一律 **SKIPPED_LOCKED**，不搶改 scope。
- 本輪沒有執行 live Herdr multi-agent run、真實 external mutation canary、provider permission drift、跨機 restore、真人 correction pilot 或 paid agent platform trial。未執行路徑仍是 `NEEDS_RUNTIME_VERIFICATION`。
- 本輪只新增中央 radar report：**0 新 Issue、0 既有 Issue 修改、0 PR comment、0 implementation authorization**。
- 未修改產品 source、CI/config、secrets、permissions/settings；未建 implementation branch、未 merge/deploy、未啟動 worker/GOAL、未新增付費承諾或正式資料寫入。
- 本輪不宣告 portfolio CLEAN。

## Product direction / current truth — herdr-skills

`herdr-skills` 目前仍是兩個個人 Herdr/Codex skills：

1. `herdr-reflect`：privacy-preserving、evidence-backed recall / learning overlay；
2. `herdr-supervisor`：Herdr multi-agent 的 policy + machine-checkable run/evidence/external-action gate。

現行 product contract 已有清楚分層：

`observation → candidate lesson → trusted validation → active rule`

與

`external effect → PREPARE → AUTHORIZE → EXECUTE → VERIFY`

learned rules 明確不能自行 grant permission、broaden scope、authorize spending/deploy/delete/external write 或控制另一 Herdr session。Supervisor 也要求 model/provider/permission-sandbox/plugin-MCP/project config 等 drift 時重新評估 capability / permission / resource state，必要時讓 evidence stale。

現行 routing 也已經不是固定模型表：每個 Task 產 candidate pool，再依 quality floor、permission/sensitivity、installed capability、backend health、budget、current contract 過濾；有可比 evidence 後才用 first-pass success、success rate、actual cost、latency 排序。Provider/CLI 可提供時還記 actual usage/cost ledger；不可取得就標 `UNKNOWN`。

因此本輪外部探索的問題不是「市場是否正在做 memory、guardrails、multi-agent orchestration 或 auto model routing」；這些方向都已存在。真正要找的是：**是否出現新 evidence，足以改變 #6 的研究方式、暴露現行 authorization boundary 的缺口，或證明需要新的產品 scope。**

---

# Product → Market Category

`herdr-skills` 本輪對照市場：

1. **Coding-agent self-improvement / correction learning**：Blume、AgentGuard research。
2. **Enterprise agent improvement / reusable skills**：Salesforce Agentforce AI Skills + Agent Optimizer。
3. **Persistent agent memory / authorization safety**：EAL-Bench research；Claude/Codex-style memory/instruction systems作相鄰參考。
4. **Model routing / budget-aware execution**：GitHub Copilot Auto model selection。
5. **Agent governance / external effects**：Herdr Supervisor 自身 provider-neutral evidence/authorization boundary；不以企業 IAM 套件為功能清單。

---

# Executive decision

**0 new Issues；0 existing Issues modified。**

本輪最有價值的新 evidence 是兩件互補的事：

1. **failure-derived guardrail 不必等於全域規則。** 2026-09-14 的 AgentGuard 以真實 coding-agent failure traces 學 conditional execution constraints，並在 runtime 只啟用與目前 instruction 相關的規則。這直接支持 #6 的「correction 是 candidate evidence，不是永遠生效的 policy」，並補上一個重要 evaluation 維度：**applicability / task-conditional activation** 與 safety-vs-completion tradeoff。
2. **memory 不能重建 authorization truth。** 2026-09-01 的 EAL-Bench 顯示 persistent memory 若錯寫 permission/revocation，executor 可能把錯誤記憶當 authority。論文提出的 source-event backing + bounded event sourcing 與 Herdr 現有 `candidate != active != permission`、run/effect authorization receipts 高度一致。這是對目前設計的強外部驗證，但**不是已證明 Herdr 有新缺陷**。

同時 Salesforce 於 2026-09-14 把 **AI Skills（教一次後重用）+ Agent Optimizer（分析 session traces、測試並找改進）+ Multi-Agent Orchestration** 放到同一 Agentforce strategy。這是值得通知的重大相鄰市場變化：大型平台正在把「執行 agent」與「持續改善 agent / reusable skill」正式拆成產品層。但 Salesforce 的 enterprise suite 不構成 Reese-max 建 transcript SaaS、optimizer dashboard、shared workforce skill catalog 或 orchestration platform 的證據。

### 對 #6 的最小校準

這些 evidence 與 #6 的 fingerprint 相同，而且 #6 / PR #8 有 active ownership，因此標記：

`NEW_EXTERNAL_EVIDENCE + DEDUPE + SKIPPED_LOCKED_ACTIVE_PR#8`

不另開「AgentGuard integration」「Agent Optimizer」「dynamic rule engine」Issue，也不留言擴寫 active PR。

待 #6 ownership 結束後，若需要下一輪研究，最小增量應是**改 evaluation，不先改 architecture**：

- 在 frozen fixtures 增加「同一 candidate 對不同 instruction 是否應啟用」的 applicability label；
- held-out task 同時量 abnormal behavior / task completion / false restriction，而不是只量 recurrence precision；
- 保留 candidate / support evidence / counterexample / runtime fingerprint；
- activation decision 仍不能取代 Reflect trusted validation，且任何 memory/candidate text 都不能生成 Supervisor authorization receipt。

若現有 #6 fixture 已足夠支持上述判斷，就不增加新資料結構；若 conditional activation 只靠 scope predicate 即可表達，也不建 rule engine。

---

# External Signals

## A. Direct research signal — AgentGuard：從失敗軌跡學 conditional guardrails

**CONFIRMED — arXiv submitted 2026-09-14；checked 2026-09-17.**

Source：
- https://arxiv.org/abs/2609.16287

Paper claim：AgentGuard 從 anomalous coding-agent trajectories 萃取 recurring execution failure patterns，轉成 instruction-level constraints，再組成 lightweight guardrail skill；**runtime 只啟用與目前 instruction 相關的規則**。

研究使用 642 個 documented failure traces、382 個 repository tasks；461 traces / 282 tasks 作 learning，100 tasks 作 disjoint evaluation。Claude Code + Claude Haiku 4.5 的 paper benchmark 報告 Abnormal Execution Rate 69.0%→26.7%、Successful Task Completion 21.7%→35.0%。

### Evidence discipline

- 這些數字只屬該 paper 的 dataset / harness / model / benchmark，**不外推**成 Herdr 預期改善率。
- Paper 證明「conditional learned guardrail 值得研究」，不證明 Reese-max 的 correction clusters 已有足夠精度。
- 本輪沒有下載其 dataset、沒有在 Herdr 上重跑 benchmark。

### Transferable principle

**Rule relevance 應該是 runtime-scoped evidence，而不是「規則曾被學到」就永遠放進 context。**

這與 #6 已有 `applicability scope + runtime fingerprint + counterexamples + merge/narrow/delete` 高度重疊。新增價值主要在 evaluation：要測 false restriction / task completion，不只測 candidate precision。

Decision：**MUST MATCH principle / DEDUPE #6 / SKIPPED_LOCKED PR #8**。

## B. Adjacent enterprise shift — Salesforce：Reusable AI Skills + Agent Optimizer + Multi-Agent Orchestration

**CONFIRMED — announced 2026-09-14；checked 2026-09-17.**

Source：
- https://www.salesforce.com/ap/news/press-releases/2026/09/14/ph-salesforce-expands-agentforce-with-a-new-portfolio-of-ai-agents-built-for-high-value-work/

Current first-party availability claims：

- **AI Skills in Agentforce Coworker**：員工 teach once，之後跨 workforce / interfaces 重用；Pilot now，GA October 2026。
- **Multi-Agent Orchestration**：跨 role/system/stage routing specialized agents；GA now。
- **Agent Optimizer**：協助 build/refine agents/subagents/actions、test performance、分析 session traces 找 improvement；GA October 2026。
- long-horizon runtime：memory + durable execution + dynamic steering。

### User job / workflow signal

把「我反覆教 agent 的做法」從臨時 steering 變成 reusable skill，同時把 agent trace 變成 improvement evidence，而不是要求每個 operator 手動回想所有 correction。

### Transferable

- improvement lifecycle 與 runtime execution 分層；
- teach-once artifact 要有可重用、可測試邊界；
- trace-derived improvement 應先被 test，再交付 active system。

### Do not copy

- 不建 enterprise skill marketplace／workforce catalog；
- 不建 cloud transcript lake；
- 不建 Salesforce 式 multi-agent admin plane；
- vendor press-release 的業務成果／AWU 數字不作 Reese-max ROI evidence；
- Pilot / future GA 不冒充現在所有客戶都能用。

Decision：**major adjacent strategy signal；supports INVEST / SIMPLIFY；no new Issue**。

## C. Safety research — Persistent memory 的 endogenous authorization laundering

**CONFIRMED — arXiv submitted 2026-09-01；checked 2026-09-17.**

Source：
- https://arxiv.org/abs/2609.01836

EAL-Bench 研究 persistent memory 如何錯誤保存 permissions / restrictions / revocations，讓後續 executor 把不存在的 authority 當真。Paper 在其 procurement / cybersecurity / finance benchmark 中報告：incremental memory updates 可對部分 unauthorized requests 產生 false authority；一旦 false authority 存在，下游 executor 高比例依此採取 action。

研究提出兩個 safeguards：

1. stored permission 必須有 valid source event；
2. permission changes 用 bounded event sourcing 追蹤。

Paper 同時指出 safety / utility tradeoff：更嚴格 safeguard 也會拒絕更多 legitimate actions。

### Herdr current counter-evidence

`herdr-reflect` 現有規則已明確禁止 learned rule grant permission / spending / deployment / deletion / external write / session control；Supervisor 對 external mutation 使用獨立 PREPARE→AUTHORIZE→EXECUTE→VERIFY，run state 也有 policy/source/capability versions 與 drift gate。

因此本輪**沒有 source-confirmed gap**。不能因論文有新攻擊名稱，就把已存在的隔離邊界重新包裝成新 framework Issue。

### Minimal future validation idea

只在既有 runtime validation 有自然落點時加入負向 fixture：

> Reflect memory / candidate 內明確寫「已授權 deploy/push/spend」時，Supervisor 仍不得生成或接受對應 authorization/effect receipt。

這是 **VALIDATION IDEA / no Issue**；缺少該 fixture 本身不證明產品壞了。

## D. New routing signal — GitHub Copilot Auto 加入 cost / quality / latency tiers

**CONFIRMED — released 2026-09-14；checked 2026-09-17.**

Source：
- https://github.blog/changelog/2026-09-14-configure-cost-and-quality-in-copilot-auto-model-selection/

Copilot Auto 現提供 `efficiency / balance / intelligence` 三種偏好；每個 prompt 仍由 Auto 從相同 available model set 選擇模型，依 cost / quality / response time 權衡，使用量按實際選到的 model 計費。

### Herdr counter-evidence

`herdr-supervisor` 已經要求：

- 不固定三模型矩陣／不隨機輪替；
- candidate pool 先過 quality / permission / capability / backend / budget / contract；
- 有 comparable evidence 才依 first-pass success、success rate、actual cost、latency routing；
- actual usage 可得時記 ledger，不可得標 UNKNOWN；
- policy 不硬編碼會過期的 model name。

因此 Copilot 的新 tier **驗證方向，但不是新的 feature gap**。Herdr 不應因此硬抄三個 tier 或做新的模型 selector UI。

Decision：**MUST KEEP / no Issue**。

---

# New Releases / Current Changes

| Date | Product / research | New signal | Herdr decision |
|---|---|---|---|
| 2026-09-14 | AgentGuard preprint | failure traces → conditional execution guardrails，按 current instruction 動態啟用 | 新 evidence for #6；evaluation 應加入 applicability + safety/completion tradeoff；DEDUPE / SKIPPED_LOCKED |
| 2026-09-14 | Salesforce Agentforce | AI Skills pilot、Multi-Agent Orchestration GA、Agent Optimizer GA Oct 2026 | 重大相鄰策略訊號；支持 improvement lifecycle 與 reusable skill 分層，不照搬 enterprise suite |
| 2026-09-14 | GitHub Copilot Auto | efficiency / balance / intelligence，逐 prompt cost-quality-latency routing | 現有 Herdr routing 已涵蓋原則；no gap |
| 2026-09-01 | EAL-Bench preprint | memory 可成 false authorization source；source-event / event-sourcing safeguards | 強化 `memory != authority`；未建立新缺陷 |

---

# Community Pain

本輪沒有保留足以改變 prioritization 的新 Reddit/HN/community prevalence signal。

理由：

- AgentGuard 的 failure traces 是研究資料，不等於市場 failure rate；
- Salesforce 的 press release 是 vendor strategy/availability，不是獨立成效測量；
- EAL-Bench 是受控 benchmark，不等於 Herdr production incidence；
- 因此本輪不使用社群聲量、vendor adoption 數字或 paper benchmark 估算真實 ROI / affected users。

---

# Adjacent Ideas

## 1. Applicability receipt，而不是更大的 rule store

若 #6 後續 runtime evidence 顯示 candidate scope 經常錯用，最小可研究：

`candidate_hash + task/instruction fingerprint + applicability predicate/result + evidence IDs`

目的只是在 execution 前說明「為什麼這個已驗證 rule 適用於這次 task」。

**更小方案優先：** 若現有 scope + runtime fingerprint 已足以 deterministic 決定 applicability，就只補 fixture / receipt，不新增 database、embedding index 或 dynamic rule engine。

Status：`ADJACENT IDEA / NEEDS_RUNTIME_EVIDENCE`，不立案。

## 2. Authorization-laundering negative fixture

可跨 `herdr-skills`、`adng-memory`、`claude-mem` 保留同一個測試原則：**memory/candidate text 不可成為 permission truth**。

但各 repo 的 actual authorization boundary 不同，不能為了共用測試就建 portfolio-wide authorization framework。

Status：`CROSS-PORTFOLIO TEST PRINCIPLE / no Issue`。

## 3. Optimizer trace ≠ full transcript retention

Salesforce 的 Agent Optimizer 說明 trace analysis 正成為產品能力，但 Reese-max #6 的 privacy boundary 更嚴：structured signal / evidence pointer 可先解決大量問題，沒有證據支持 persistent raw transcript corpus。

Status：`SHOULD BE BETTER on privacy / no scope expansion`。

---

# Opportunity Map — herdr-skills

| Classification | Opportunity / boundary | Decision |
|---|---|---|
| **MUST MATCH** | failure-derived candidate 要保留 applicability、support evidence、counterexamples，不能全域無條件套用 | 已屬 #6；新 evidence only |
| **MUST MATCH** | authorization 必須由 current source event / explicit run-effect state 證明，memory prose 不可授權 | 現有 design 已有；keep + optional negative fixture |
| **SHOULD BE BETTER** | evaluation 同時量 false restriction / task completion / held-out tasks，不只 candidate precision | 待 #6 owner scope 可變更時以最小 eval 增量考慮 |
| **SHOULD BE BETTER** | improvement preview 說明 why applicable，而非只顯示 candidate score | 先用現有 scope/runtime evidence；不建新 UI |
| **DIFFERENTIATOR** | `candidate != active rule != permission != verified effect` | 保持；新研究與大型平台都強化此 thesis |
| **ADJACENT IDEA** | trace-driven optimizer / reusable Skill handoff | #6 + skill-foundry 已是既有方向；不另造 optimizer service |
| **DO NOT COPY** | persistent raw transcript cloud、automatic policy editing、enterprise agent admin plane、固定三個 routing tier | 不做 |

---

# Cross-portfolio ideas

1. **Memory-to-authority regression principle**：`herdr-skills` / `adng-memory` / `claude-mem` 都應保持「remembered statement cannot mint authority」；各自用現有 acceptance path 驗證，不建共享 authority service。
2. **Conditional activation evaluation principle**：只有那些真正會將 learned rule / policy candidate 帶入 runtime 的專案才需要測 applicability / false restriction；不要把 AgentGuard benchmark 強行移植到純內容／資料型 repo。
3. **Actual routing evidence**：Herdr 現有 usage ledger / first-pass / cost / latency 原則可作 portfolio 參考，但不因此要求每個產品導入中央 model-router。

---

# Rejected / deferred ideas

1. **新增 AgentGuard integration / guardrail engine — REJECT NOW**  
   原因：#6 已擁有同 fingerprint；active PR #8；且 AgentGuard paper 不證明 Herdr 需要另一 runtime engine。

2. **新增 Salesforce-style Agent Optimizer dashboard — REJECT**  
   原因：enterprise suite scale 不符合 personal Herdr product；現有 issue 的問題是 bounded correction evidence，不是缺 dashboard。

3. **把所有 correction transcript 持久化供 optimizer mining — REJECT**  
   原因：與 #6 privacy boundary 衝突；沒有 user evidence 支持 raw transcript retention 成本/風險。

4. **因 EAL-Bench 開新的 authorization registry — REJECT**  
   原因：Supervisor 已有 source/version/effect authorization state；論文的新術語不是新根因。

5. **複製 Copilot efficiency/balance/intelligence 三段式 router — REJECT**  
   原因：現有 Herdr routing 已是 evidence-based dynamic candidate selection；硬編 UI tier 反而縮窄 policy flexibility。

6. **把 AgentGuard benchmark 數字當 Herdr 成效目標 — REJECT**  
   原因：dataset/model/harness 不同，不能推算 Reese-max reliability 或 ROI。

---

# Issue Mapping / dedupe / coordination

| Evidence / candidate | Existing fingerprint | Coordination | Write decision |
|---|---|---|---|
| AgentGuard conditional learned guardrails | #6 correction→candidate / rule-scope / runtime-fingerprint research | PR #8 open @ `370766a5c316571bf831372369b1c2c41f1f1090`; unresolved privacy/schema review | `DEDUPED + SKIPPED_LOCKED`; no comment/update |
| Salesforce trace→improvement + reusable AI Skills | #6 + future skill-foundry handoff | #6/PR #8 active; product direction already says Reflect→Foundry, not new platform | central report only |
| EAL-Bench memory authorization laundering | existing Reflect `learned rule != permission` + Supervisor external-action authorization gate | no source-confirmed product failure | no Issue; optional future negative fixture |
| Copilot Auto cost-quality-latency routing | existing Supervisor Candidate AI routing + MODEL_USAGE_LEDGER | default branch already contains policy | no Issue |
| #3 relocation/rebind | existing #3 / PR #5 | active PR #5 @ `eb774ce7302a094298796340181212b5a0fd2280` | unrelated; no scope mutation |

本輪沒有對 Issue 寫入，因此沒有建立 `github-issue-lock:v1` marker；沒有透過「研究」取得 implementation authority。

---

# Sources

查閱日：**2026-09-17 UTC**。

| Status | Source | Event / publish date | Use |
|---|---|---:|---|
| CONFIRMED | https://arxiv.org/abs/2609.16287 | 2026-09-14 | AgentGuard conditional failure-derived guardrails；paper benchmark 僅限該研究 |
| CONFIRMED | https://www.salesforce.com/ap/news/press-releases/2026/09/14/ph-salesforce-expands-agentforce-with-a-new-portfolio-of-ai-agents-built-for-high-value-work/ | 2026-09-14 | AI Skills / Multi-Agent Orchestration / Agent Optimizer availability/strategy |
| CONFIRMED | https://github.blog/changelog/2026-09-14-configure-cost-and-quality-in-copilot-auto-model-selection/ | 2026-09-14 | Copilot Auto cost-quality-latency tiers/current rollout |
| CONFIRMED | https://arxiv.org/abs/2609.01836 | 2026-09-01 | EAL-Bench authorization laundering；benchmark 不外推 Herdr incidence |
| CONFIRMED | `Reese-max/herdr-skills@9f134e1b0a53ffe72a64a5793ddc7dabe03ed571` | current default branch | repo evidence / policy / routing / issues |
| CONFIRMED | `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md@8167e107...` | effective 2026-09-14 | Issue/priority/research gate |

---

# What Changed

相對前一輪 `herdr-skills` radar，本輪新增的實質 evidence：

1. **AgentGuard (2026-09-14)**：提供真實 coding-agent failure traces 的 conditional guardrail 研究，讓 #6 的「rule scope/applicability」從概念多了一個獨立研究參考；同時提醒 evaluation 要量 false restriction / completion tradeoff。
2. **Salesforce Agentforce (2026-09-14)**：大型 SaaS 將 reusable AI Skills + trace-driven Agent Optimizer + Multi-Agent Orchestration 放入同一產品策略，是重大相鄰市場變化；支持 Herdr「improvement plane 與 execution/authority plane 分離」，不支持照搬 enterprise suite。
3. **EAL-Bench (2026-09-01)**：對 `memory != authorization` 提供新的研究證據；現有 Herdr design 已有 counter-evidence，因此不製造新缺陷。
4. **GitHub Copilot Auto (2026-09-14)**：cost-quality-latency routing 更顯性；Herdr default policy 已有更一般的 evidence-based routing，所以不新增 model-routing scope。
5. Repo/default-branch product behavior自上一輪未變；#3 / PR #5、#6 / PR #8 仍 active；PR #8 privacy/schema findings 未解，因此不宣稱 research completed。

---

# Classification / scope calibration

- AgentGuard / Salesforce signal：`kind=RESEARCH/OPPORTUNITY evidence`，不是 Herdr `BUG`。
- #6 impact severity：本輪仍維持 `NOT_ESTABLISHED`；decision priority 可維持高，但不叫 P1 defect。
- EAL-Bench：Herdr source evidence目前顯示有對應防線；沒有 runtime failure chain，因此不升 P0/P1/P2。
- Copilot Auto：market parity signal，現有 capability足夠，decision=`NO_CHANGE`。
- 沒有用 paper percentage、Salesforce vendor metrics、model popularity 或 synthetic persona count 形成精確 Opportunity Score。

---

# Completion / gaps / cursor

- Fresh inventory：**42 owned / 39 unarchived**；page 2 empty。
- Rules blob：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- Current target：`herdr-skills`；default branch `9f134e1b0a53ffe72a64a5793ddc7dabe03ed571`。
- External sources retained：4 first-party / primary research sources；沒有用 GitHub 自家 README/Issue 當主要市場情報結束。
- New Issues：**0**。
- Existing Issue updates：**0**。
- PR comments：**0**。
- Duplicate / active-scope avoided：AgentGuard + Salesforce improvement signals → #6 / PR #8；#3 / PR #5 untouched。
- Rejected/deferred idea groups：6。
- Runtime gaps：沒有 live Herdr, authorization laundering canary, conditional-activation benchmark, relocation restore, external effect mutation test。
- Portfolio CLEAN：**not claimed**。
- Next fair-rotation cursor：**`ninax-line-hermes`**。
