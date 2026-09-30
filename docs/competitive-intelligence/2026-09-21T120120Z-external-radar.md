# External Competitive / New-Product / Workflow Radar — 2026-09-21T12:01:20Z

## Status / scope / evidence boundary

- Run status: **COMPLETE_FOCAL_ANALYSIS / NO_MATERIAL_NOTIFICATION / ZERO_NEW_ISSUES**.
- 本輪主要情報來源為 Reese-max GitHub 之外的公開網路；GitHub 僅用於 owner scope、目前產品事實、去重、協調與持久化報告。
- Governing rule re-read: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`; blob SHA **`8167e10798071d2276addaff6b201c6b0e904a2a`**。
- Fresh connected inventory 已完整分頁至結束：**42 個 Reese-max-owned repositories / 41 個未封存**；`obsidian-vault` 為 archived，不納入產品輪巡與 mutation。
- Fair cursor entering this round: **`Reese-max/skill-foundry`**，承接 `2026-09-21T100013Z-external-radar.md`。
- Focal default branch 在寫入前重新讀取仍為 **`main@d283b5b8af94d125da1afb57eebbdcb66c0b1a89`**。雖 commit message 是 `chore: record research reliability and evaluation evidence`，此 commit 實際包含研究／評測程式變更（例如 unseen external-evaluation provenance gate），因此本輪把它視為 current product truth，而不是把舊 `e865c005...` 當作唯一產品 baseline。
- Owner-approved direction 延續 **INVEST / SIMPLIFY**：`skill-foundry` 是 narrow Agent Skill certification / promotion plane，核心是 exact revision、evidence、runtime/security/behavior claim boundary 與 promotion；不是 marketplace、generic agent runtime、team workspace SaaS、observability platform 或 native app。
- Active scopes 未被搶改：#1 / PR #2 target-runtime compatibility；#6 / PR #8 / PR #9 exact-SHA deterministic CI。#3 package security、#4 distribution/install receipt、#5 demonstration intake、#10 behavior coverage 皆保留既有研究邊界。
- 本輪沒有執行 live provider、worker、GOAL、CI rerun、deployment、promotion、paid call、production write，也沒有修改 product source、Skill contents、CI/config、secrets、permissions/settings 或 branch。

## Executive decision

**0 new Issues；0 Issue/PR comments；0 scope rewrites；0 implementation authorizations。**

本輪最重要的新外部訊號來自 OpenAI 2026-09-11 的 GPT-6 Astra Skill / prompt guidance：隨模型能力提升，過去需要的詳細 recipe、過長 Skill description、固定 pre-read 與過度保守 boundary 可能從「幫助模型」變成「多餘 context 或限制模型」。OpenAI 明確建議重新檢查既有 Skills / `AGENTS.md`、縮短描述、採 progressive disclosure，並指出對 Sol / Luna 有幫助的 instructions 可能過度約束 Astra。

這是對 `skill-foundry #1` 的強 external confirmation，**不是一個新的 root cause**。#1 本來就把 `model identity / harness / tool capabilities / policy` 納入 runtime fingerprint，模型變更使舊 compatibility claim STALE，並要求 paired with/without evidence；PR #2 正在 active scope 實作該方向。因此本輪以 `DEDUP_TO_#1 / SKIPPED_LOCKED` 處理，不留言、不擴 PR #2。

值得保留的較小產品校準是：**Foundry 的有效結果不應預設只能是「產生更強／更長的 Skill」；當新模型的 no-Skill baseline 已持平或優於 Skill，合法的決策應包含「縮短、移除或 retire 既有 instruction，然後重新測」。** 這目前只是一個 evaluation-decision principle，不值得另建 Minimality Engine 或新的 optimizer Issue；現有 #1 paired baseline 已經是回答這個問題的最小機制。

Microsoft 最新 custom-skill surface 與新的 synthetic-data skill-router research 同樣沒有通過新立案門檻：前者再次證明 authoring/upload/package UI 正在商品化，映射既有 #4；後者研究的是大規模 skill retrieval router，不能外推成 Foundry 的 synthetic train cases 已發生 catastrophic forgetting，而且 current main 已明確加強 unseen provenance / split isolation，因此只保留為「不要讓 synthetic train improvement 冒充 generalization」的外部校準。

---

# External Signals

## A. Direct ecosystem change — OpenAI 要求重新審核舊 Skills，詳細 scaffold 可能反而傷害新模型

**CONFIRMED — OpenAI Developers，發布 2026-09-11；查閱 2026-09-21。**

Source:
- https://developers.openai.com/fr-FR/blog/rethinking-skills-and-prompts-for-gpt-6-astra
- https://developers.openai.com/api/docs/guides/latest-model

OpenAI 的最新 guidance 直接提出：

- Skill description 應盡可能短，但精確說明何時適用；過寬 description 會使 agent 在無關工作也載入 Skill。
- Skill 應使用 **progressive disclosure**：root instruction 只提供足夠 routing context，需要時再讀 supporting docs/scripts，避免無關內容佔用 context。
- 過去寫成詳細 step-by-step recipe 的 Skills，面對更強模型可能「以前有幫助、現在反而限制結果」。
- 同一 repository 的 contributors 可能使用不同模型；對 Sol / Luna 有利的 instruction 可能對 GPT-6 Astra 過度約束。
- `AGENTS.md` / Skill 等長期 instruction 應定期重新檢查是否仍必要，不應把「曾經需要」當成永久必要。
- Astra 對 instructions 更敏感；模糊或衝突的 Skill instructions 也可能讓 agent 過早停止。

### User job

Skill author / reviewer 在模型或 harness 升級後，需要知道：**這個 exact Skill revision 現在是否仍增加邊際價值，還是已變成 redundant / over-constraining context。**

### Manual break reduced

沒有這個 claim boundary 時，maintainer 容易沿用「舊模型上曾有效」的 Skill，再人工猜測新模型失敗究竟是模型、Skill、context bloat 或 boundary wording 所致。

### Transferable pattern

把 `model/harness update → prior claim STALE → paired baseline replay → keep / simplify / retire` 視為同一 certification lifecycle，而不是只允許「再新增 instruction」。

### Repository fit / counterevidence

- #1 已要求 per-runtime paired with/without evidence，且 model/harness/tool/policy drift 會 stale claim。
- PR #2 已在 active scope 實作 compatibility manifest / stale semantics；本 radar 不應搶改。
- `relative_quality_v1` 已比較 candidate vs current revision；Foundry 也已有 with/without Skill evidence plane。這表示「證明 Skill 的 marginal value」不是缺一整套新 evaluator。
- 目前 repo 沒有核定 GPT-6 Astra 作為 required target runtime，也沒有證據顯示 active Skill 在 current supported target 上因 instruction bloat 造成真實 regression。

**Decision:** `DEDUP_TO_#1 / SKIPPED_LOCKED`；新 Issue = 0；PR comment = 0。

---

## B. Adjacent product release — Microsoft 把 SKILL.md 生成／上傳／預覽做成 Agent Builder 基礎能力

**CONFIRMED — Microsoft Learn，文件 2026-09-04 更新；查閱 2026-09-21。**

Sources:
- https://learn.microsoft.com/microsoft-365/copilot/extensibility/agent-builder-add-skills
- https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/skills-overview

Microsoft Agent Builder 現在可以：

- 直接從自然語言 description 產 reusable skill；
- 上傳含必要 `SKILL.md`、optional resources/scripts 的 ZIP package；
- 在 Configure/Preview 中檢查 Skill；
- 明示 target-specific packaging / policy limits，例如每 agent 最多 8 Skills、ZIP 最多 50 MB、instruction 低於 20,000 characters（Agent Builder preview 文件）；
- Copilot Studio 同樣把 Skills 與 tools/knowledge 分開，Skills 是可重用 task-specific capability。

### User job

使用者想快速建立／帶入 Skill，不想先手工搭一套 package authoring UI。

### Product implication

這進一步把「Skill editor / generator / uploader」推向 commodity layer。對 Foundry 的價值不是複製 Microsoft UI，而是維持：

`package exists != certified revision != target-compatible != installed/read-back exact revision`。

不同 target 對 package、sandbox、limits、availability 的限制也再次支持 #4 的 target adapter / receipt 邊界，而不是 universal install assumption。

**Decision:** `DEDUP_TO_#4 / NO_STATE_CHANGE`。沒有新 evidence 推翻 #4 的研究邊界，也沒有建立 implementation authorization。

---

## C. New research — synthetic-data training 可改善 in-distribution skill routing，同時傷害 real/OOD retrieval

**CONFIRMED RESEARCH — arXiv 2609.10750，initial posting 2026-09-09；查閱 2026-09-21。**

Source:
- https://arxiv.org/abs/2609.10750

Paper: **When Synthetic Data Hurts: On Catastrophic Forgetting in Skill Retrieval for LLM Agents**。

研究對象是一個 **34,396 Skills 的 production skill router**，研究 limited real supervision + synthetic-data fine-tuning。其核心結果是在該 retrieval corpus 中，synthetic FT 可提高 in-distribution retrieval，但可能損害 real / OOD retrieval；作者再測 continual-learning mitigation。

### Boundary

這篇研究**不能**直接證明 `skill-foundry` 正在 catastrophic forgetting：

- Foundry 的 synthetic cases 主要用於 bounded Skill/workflow research，不是同一個 34k-skill neural router。
- 現行 Foundry 已區分 train / validation / test，並在 current HEAD 加強 external unseen provenance；同一示範／train evidence 也不應自我洗成 independent holdout。
- 論文 numeric results 只屬該 production router / dataset，不外推成 Foundry 成效或風險比例。

### Transferable principle

**Synthetic train improvement 不得升格成 generalization claim；independent real/unseen evidence 必須保持分離。** Current repo direction 已符合這個原則，因此這是外部確認，而不是新 root cause。

**Decision:** `MUST_MATCH / CURRENT_DIRECTION_CONFIRMED / NO_ISSUE`。

---

# New Releases / recent changes

| Date | Signal | Relevance to `skill-foundry` | Decision |
|---|---|---|---|
| 2026-09-11 | OpenAI: rethink Skills/prompts for GPT-6 Astra | old detailed instructions may become over-constraint after model upgrade | map to #1 / active PR #2; no duplicate |
| 2026-09-09 | Synthetic-data skill-router paper | train improvement can mask OOD degradation | current split/unseen provenance direction confirmed; no router project |
| 2026-09-04 | Microsoft Agent Builder custom Skills preview docs | SKILL.md generation/upload/preview becomes commodity authoring surface | map to #4; do not build editor/marketplace |

No price-sensitive conclusion was made. Microsoft Copilot usage can involve Copilot Credits, but this run did not use vendor pricing as product-value evidence and did not infer ROI/willingness-to-pay.

# Community Pain

## Mixed community signal — users are explicitly questioning whether old Skills can handicap newer models

**COMMUNITY_SIGNAL only — Reddit thread posted 2026-09-17; relevant follow-up 2026-09-20; checked 2026-09-21.**

Source:
- https://www.reddit.com/r/claude/comments/1whvzqi/do_you_still_use_skills_in_september_2026/

The thread is mixed rather than consensus: some users still use Skills every day for repeatable workflows and lazy-loaded context; others say they use very few instructions, and one follow-up explicitly asks how to know whether rapidly improving models are being handicapped by old Skills.

This is anecdotal, not prevalence evidence. Its value is that it independently matches OpenAI's first-party guidance: **the relevant question is no longer only “does this Skill work?” but also “does this Skill still add value over the current model without it?”**

No user incidence, retention, revenue, or adoption conclusion is drawn.

# Adjacent Ideas

## 1. Model-upgrade Skill retirement / simplification is a valid evaluation outcome — central report only

Smallest bounded future experiment, only when #1 runtime revalidation is authorized:

1. Pin one exact Skill revision + one exact target model/harness/tool profile.
2. Replay existing **with-Skill vs without-Skill** evidence on the same frozen cases.
3. If no-Skill is neutral/better, test at most one manually simplified candidate (shorter description / fewer obsolete recipe steps / progressive-disclosure routing).
4. Compare the same quality + critical-error + runtime evidence; do not optimize on token savings alone.
5. Exit:
   - **KEEP** — Skill still adds material value;
   - **NARROW** — smaller Skill preserves value with less unnecessary context;
   - **RETIRE_FOR_TARGET** — no-Skill is non-inferior/better for this target;
   - **UNKNOWN** — evidence insufficient.

This does **not** require a new minimality optimizer, prompt compressor, model router or universal Astra migration.

## 2. Target package constraints belong to adapters, not the certified core

Microsoft's current limits and preview governance reinforce #4's distinction between certified artifact identity and target install/package mechanics. A target adapter may need to reject/export differently, but it should not rewrite the certified core silently merely to satisfy a host-specific package limit.

## 3. Independent/unseen provenance remains more important than synthetic volume

The recent retrieval paper is a useful reminder that adding more synthetic examples is not automatically stronger evidence. Foundry should continue to preserve independent provenance and allow negative/unknown results rather than filling gaps with generated cases.

# Opportunity Map — `skill-foundry`

| Category | Decision | Rationale |
|---|---|---|
| **MUST MATCH** | model/harness/tool drift invalidates or stales old compatibility claims | OpenAI explicitly says old Skills may behave differently / over-constrain newer models; already #1 |
| **MUST MATCH** | synthetic train improvement cannot become generalization evidence | recent retrieval research independently confirms the risk shape; current unseen provenance direction already aligned |
| **SHOULD BE BETTER** | certification should allow `NARROW/RETIRE_FOR_TARGET`, not assume every improvement means adding instructions | smallest response to stronger models; can reuse paired baseline |
| **SHOULD BE BETTER** | target-specific packaging/read-back stays separate from certified revision | Microsoft surfaces have host-specific limits; already #4 |
| **DIFFERENTIATOR** | exact revision + provenance + runtime compatibility + package security + behavior coverage + explicit promotion boundary | stronger than generic generate/upload/store Skill surfaces |
| **ADJACENT IDEA** | progressive-disclosure refactor for a Skill only after measured no-Skill/current-Skill evidence shows context burden | evidence-triggered, not default rewrite |
| **ADJACENT IDEA** | per-target Skill retirement state | belongs under #1 if real multi-target evidence later needs it |
| **DO NOT COPY** | generic Skill generator/editor/library/marketplace | increasingly commodity and outside owner direction |
| **DO NOT COPY** | train a new large Skill router because the paper studied one | different product/job; no repo evidence |
| **DO NOT COPY** | automatic prompt/Skill shrinking without paired re-evaluation | shorter is not automatically better |
| **DO NOT COPY** | migrate every Skill to GPT-6 Astra / add a provider just because it launched | no owner-approved target or authorized runtime evidence |

# Four-gate review — “simplify/retire a Skill after model upgrade”

## 1. Problem / value

Target user: Skill author/reviewer who must decide whether an exact certified revision still adds marginal value after a model/harness update.

External evidence is now strong that this failure mode can exist in the category: OpenAI specifically warns that detailed prior-model Skills can over-constrain Astra, and current community discussion independently raises the same concern.

Repository evidence, however, provides strong counterevidence against opening a new root issue: #1 already defines per-runtime with/without Skill evidence and staleness on model/harness/tool drift; PR #2 is active. No current supported target has been shown to regress because of instruction bloat.

**Gate:** real category value; duplicate existing #1 fingerprint, no new Issue.

## 2. Priority

No new product severity is established. A vendor/model change is not a P0/P1/P2 incident by itself.

For the fresh signal only:

```yaml
kind: RESEARCH
severity: NOT_ESTABLISHED
triage: NEEDS_EVIDENCE
coordination: DEDUP_TO_#1 / SKIPPED_LOCKED
runtime: NEEDS_RUNTIME_VERIFICATION
auto_implementation: false
```

It is strategically useful because it can invalidate a compatibility claim after a model change, but it does not override the existing owner sequence or active PR.

## 3. Minimum solution

Smaller options first:

1. **No change:** #1 already has the correct stale-on-model-change contract.
2. **Evaluation-only:** when an authorized target actually changes model/harness, rerun the existing no-Skill/current-Skill paired baseline.
3. **Local simplification candidate:** only if the baseline shows neutral/negative marginal value, compare one bounded shorter candidate.
4. New optimizer / registry / service: **not justified**.

The minimum safe answer is therefore to reuse #1 evidence rather than create architecture.

## 4. Research / implementation separation

No BUILD authorization exists. Even a future `RETIRE_FOR_TARGET` result must be bound to an exact runtime profile and exact Skill revision; it cannot silently delete or rewrite support for other runtimes. An evaluation result supports a review decision, not automatic publication/promotion.

# Cross-portfolio idea

**Reusable instruction artifacts should have a deletion/simplification path, not only an accumulation path.** When a model/harness improves, the smallest evidence-driven response is to re-measure marginal value and permit `KEEP / NARROW / RETIRE / UNKNOWN` per target.

This is a decision principle only. No cross-portfolio framework Issue was created because this run did not validate equivalent supported workflows in other Reese-max repos, and generic “instruction lifecycle registry” would be architecture before need.

# Rejected / deferred ideas

- **New Skill Minimality Engine:** rejected; #1 paired evidence can answer the first question without another subsystem.
- **Automatic Astra migration / provider integration:** rejected; GPT-6 Astra is not currently an owner-approved required runtime for this repo.
- **Rewrite the active Skill to progressive disclosure immediately:** rejected; no repo-specific outcome evidence shows the current Skill is harmed.
- **Train a skill router from synthetic data:** rejected; the arXiv paper studies a different product architecture and also demonstrates why synthetic train gains need independent validation.
- **Microsoft-style Skill generator/editor UI:** rejected; authoring/upload is increasingly commodity; Foundry differentiates on evidence and promotion.
- **Universal host/package abstraction expansion:** deferred to existing #4; host limits alone do not prove current install friction.
- **Comment or rescope #1 / PR #2:** rejected by coordination rule; active scope already owns model/runtime negative-transfer semantics.
- **Treat Reddit anecdotes as prevalence:** rejected; community signal is qualitative only.

# Issue Mapping / coordination

| Signal / fingerprint | Existing mapping | Decision |
|---|---|---|
| model upgrade makes old Skill neutral/negative/over-constraining | #1 / active PR #2 | `DEDUP_TO_#1 / SKIPPED_LOCKED`; no comment |
| target-specific packaging/install limits and exact installed identity | #4 | existing RESEARCH; no new state-changing evidence |
| synthetic train evidence vs unseen/generalization truth | current train/validation/test + unseen provenance on `main@d283b5b8...` | direction confirmed; no Issue |
| behavior-level test adequacy | #10 | unchanged; this run does not duplicate coverage work |
| package security | #3 | unchanged; no new package-security root evidence this round |
| exact-SHA GitHub deterministic gate | #6 / active PR #8/#9 | unrelated; no change |

No Issue lock was acquired because no Issue/comment/shared state was modified. Active PR ownership was respected. No `github-issue-lock` marker is needed for a unique new central-report file.

# Sources

Public web, checked 2026-09-21:

1. OpenAI Developers — **Rethinking skills and prompts for GPT-6 Astra**, published 2026-09-11  
   https://developers.openai.com/fr-FR/blog/rethinking-skills-and-prompts-for-gpt-6-astra
2. OpenAI API — current GPT-6 Astra model guidance  
   https://developers.openai.com/api/docs/guides/latest-model
3. Microsoft Learn — **Add custom skills to your declarative agent in Agent Builder (preview)**, updated 2026-09-04  
   https://learn.microsoft.com/microsoft-365/copilot/extensibility/agent-builder-add-skills
4. Microsoft Learn — **Skills overview for agents**  
   https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/skills-overview
5. arXiv — **When Synthetic Data Hurts: On Catastrophic Forgetting in Skill Retrieval for LLM Agents**, 2609.10750, initial posting 2026-09-09  
   https://arxiv.org/abs/2609.10750
6. Reddit / r/claude — **Do you still use skills in September 2026?**, thread 2026-09-17; relevant follow-up 2026-09-20  
   https://www.reddit.com/r/claude/comments/1whvzqi/do_you_still_use_skills_in_september_2026/

GitHub evidence used only for current product truth / coordination:

- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- `Reese-max/autodev-ng/docs/competitive-intelligence/2026-09-19T081501Z-external-radar.md`
- `Reese-max/autodev-ng/docs/competitive-intelligence/2026-09-21T100013Z-external-radar.md`
- `Reese-max/skill-foundry` current `README.md`, `docs/goals.md`, `docs/status-2026-09-19.md`, active `SKILL.md`, Issues and all-state PR surface

# What Changed / accounting

- Fresh owner inventory: **42 owned / 41 unarchived**, fully paginated; older 41/40 snapshot not treated as current truth.
- Current focal HEAD confirmed immediately before report write: **`skill-foundry main@d283b5b8af94d125da1afb57eebbdcb66c0b1a89`**.
- Fresh retained external signal: OpenAI 2026-09-11 explicitly warns that model progress can make old detailed Skills over-constraining and recommends shorter descriptions/progressive disclosure/re-audit.
- This does **not** overturn Foundry direction; it materially reinforces #1's exact target-runtime / negative-transfer / stale-claim design.
- Microsoft 2026-09-04 custom Skill generation/upload further commoditizes authoring and reinforces #4's target adapter boundary; no state change.
- New synthetic-data retrieval paper reinforces independent unseen/generalization evidence but studies a different router architecture; no defect inference.
- New Issues: **0**.
- Existing Issue updates/comments: **0**.
- PR comments/scope changes: **0**.
- Implementation authorizations: **0**.
- Runtime validations: **0**; unexecuted target paths remain `NEEDS_RUNTIME_VERIFICATION` where applicable.
- Portfolio CLEAN: **not declared**.
- Notification threshold: **not met** — the new signal strengthens an already-tracked active compatibility direction but does not establish a new high-value product opportunity, major competitor strategy reversal requiring action, validated cross-project capability, or external evidence overturning owner direction.
- Next fair cursor: **`Reese-max/video-timeline-pipeline`**.
