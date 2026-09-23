# 外部競品／新品／工作流靈感雷達 — 2026-09-23T02:10:00Z

## Status / scope / evidence boundary

- 狀態：**COMPLETE / MATERIAL_NEW_RESEARCH / ONE_NEW_RESEARCH_ISSUE**。
- 主要情報來源為 Reese-max GitHub 之外的公開網路；GitHub 僅用於 owner inventory、current product truth、方向、去重、協調與持久化。
- Issue Quality v2：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`，blob SHA `8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh connected-owner inventory 已完整分頁至空頁：**42 Reese-max-owned repositories / 41 unarchived**；`obsidian-vault` archived，不納入產品輪巡。
- Fair-rotation focus 由上一輪 Soundbox 報告接續至 `Reese-max/skill-foundry`。
- Focal current default HEAD：`main@d283b5b8af94d125da1afb57eebbdcb66c0b1a89`。這個 commit 不只是 audit-only；它加入 external-evaluation provenance / blind-review reliability 等研究可靠性變更，因此本輪直接以 current HEAD 為產品證據。
- Owner direction 重新核對：**INVEST / SIMPLIFY**。Skill Foundry 是 evidence-gated certification / promotion plane；競爭點是可重建的來源、hash、evaluation、runtime、security 與 approval receipts，不擴成 marketplace、hosted multi-tenant agent SaaS、generic orchestration、observability 或 memory product。
- Existing roadmap priority 保持：#6 exact-SHA deterministic CI receipt → #1 real runtime compatibility → #3 narrow package-security calibration；#4 distribution、#5 demonstration intake 與較新的 research 不搶 active implementation scope。
- All-state PR rechecked：#2（runtime compatibility）、#8/#9（CI admission）仍有 active scope；本輪沒有留言、改 scope、merge、branch、deploy、GOAL 或 worker。
- 本輪未執行真實 host multi-skill runtime、provider、hidden-set、CI trigger、production mutation 或付費呼叫。未實跑部分維持 `NEEDS_RUNTIME_VERIFICATION`。
- 本雷達不宣告 portfolio CLEAN。

## Executive decision

本輪建立 **1 個窄 RESEARCH Issue：`Reese-max/skill-foundry#11`**，沒有授權實作。

外部市場已從「一個 agent 裝一個 Skill」往**同一 host 自動選擇多個 Skills**移動：OpenAI 現行 Skills 說明會在需要時自動使用 one or more skills；Microsoft Copilot Studio 以 skill description 協助 orchestrator 判斷啟用時機，Agents Toolkit 現行文件允許同一 declarative agent 最多 8 個 custom skills；Anthropic 2026-09-15 的 Salesforce in Claude beta 直接帶入 37 個 pre-built sales skills。

同時，2026-09-02 新研究指出 selection layer 有一個和 package safety 不同的 attack surface：prompt 與 skill description 各自看似正常時，仍可能透過語意匹配關係使 selector 更偏向指定 Skill。這不能證明任何主流 host 已被攻擊，也不能推估本 repo 的風險率，但足以形成一個可結束的研究問題：**目前「單一 Skill trigger PASS」是否仍能在小型 co-installed competing set 下維持可信 selection？**

因此新 Issue 僅要求 `one active Skill × one supported runtime × small synthetic competing set` 的 bounded experiment；不建立 router、registry、SkillDAG、vector DB 或 marketplace。

# Product → market category mapping

`Reese-max/skill-foundry` 本輪對照：

- **Direct product surfaces:** OpenAI Skills、Microsoft Copilot Studio custom skills、Anthropic Claude Skills/plugins；
- **Evaluation / trust layer:** NVIDIA SkillEvaluator / SkillSpector、Skill Coverage research；
- **Selection / ecosystem research:** Implicit Skill-Selection Manipulation、SkillRouter；
- **Workflow discovery adjacent:** Claude Enterprise Smart reports；
- **Distribution / governance:** OpenAI workspace skill ownership/access/invocations、Microsoft portable `SKILL.md` packages。

# External Signals

## A. Multi-skill selection is now a first-party product surface

**Status:** `CONFIRMED PRODUCT`。  
**Checked:** 2026-09-23 Asia/Taipei。

Sources:
- OpenAI Skills in ChatGPT: https://help.openai.com/en/articles/20001066
- Microsoft Copilot Studio Skills overview, last updated **2026-09-09**: https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/skills-overview
- Microsoft 365 Agents Toolkit custom skills, last updated **2026-09-04**: https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/build-declarative-agents-add-custom-skills
- Anthropic Salesforce in Claude, **2026-09-15**: https://claude.com/blog/salesforce-in-claude

What changed for the user job:

- Skill authors can no longer assume a certified Skill will be the only candidate visible to the host.
- The manual failure mode is not merely “wrong content inside the Skill”; it can become `request → host chooses neighboring Skill → user manually notices / retries / disables another Skill`.
- OpenAI/Microsoft/Anthropic product evidence shows the co-installation premise is real, but **does not establish a current Skill Foundry failure**.

Transferable design rule: certification claims that depend on invocation should state enough environment identity to distinguish `this Skill alone` from `this Skill among a known competing set` when that difference matters.

What not to copy: do not build a large skill router or hosted orchestration layer merely because hosts now support many skills.

## B. Recent research: semantic matching can be manipulated at the selection layer

**Status:** `CONFIRMED RESEARCH / NOT PRODUCT INCIDENCE`。  
**Published:** **2026-09-02**。  
Source: https://arxiv.org/abs/2609.02035

`Implicit Manipulation for Skill Selection in LLM Agents with Semantic Matching` reports that an attacker can shape skill metadata and reusable prompts so semantic selection favors a target Skill without explicit steering strings. Its reported target-selection/reviewer numbers belong only to the paper's own domains, selectors and experimental setup; this radar does **not** transfer those rates to Skill Foundry or commercial hosts.

The useful boundary is narrower:

`package-safe != single-skill-trigger-safe != co-installed-selection-safe`.

Current `release-iter26-approved.json` already has trigger precision `1.0`, recall `0.9`, unrelated FPR `0.0`, Candidate/dataset hashes and final canary evidence, but it does not identify a co-installed Skill set or prove selection behavior under semantically overlapping neighbors. That is a researchable evidence gap, not a P0/P1/P2 defect.

**Issue decision:** passes the RESEARCH gate as #11: `severity=NOT_ESTABLISHED`, `decision_priority=MEDIUM`, `triage=NEEDS_EVIDENCE`, `auto_implementation=false`, `NEEDS_RUNTIME_VERIFICATION`.

## C. SkillRouter / ecosystem-scale routing confirms overlap is structurally distinct

**Status:** `CONFIRMED RESEARCH / BACKGROUND`。  
**Published:** **2026-03-23**。  
Source: https://arxiv.org/abs/2603.22455

SkillRouter studies routing across a large corpus with overlapping Skill purposes and reports that full implementation text materially changes retrieval quality compared with name/description-only selection in its benchmark. Those benchmark numbers are not applied to this product.

Transferable signal: as registries grow, selection evidence is not the same as Skill body quality evidence. For Skill Foundry, the smallest consequence is still a small competing-set experiment—not a 10K-skill retrieval engine.

## D. Claude Smart reports turns “what should become a Skill?” into a product workflow

**Status:** `CONFIRMED PRODUCT / ADJACENT IDEA`。  
**Released:** **2026-09-10 beta**。  
Source: https://support.claude.com/en/articles/12138966-release-notes

Anthropic says Smart reports analyzes team usage, cost, session friction and repeated patterns worth packaging as shared skills. This moves Skill authoring discovery upstream from “user already knows the goal” toward “usage evidence suggests which workflow is worth standardizing.”

Skill Foundry currently starts new goals explicitly (`goal start ... --objective ...`) and #5 studies explicit human demonstration intake. There is no owner/user evidence that passive usage mining is the next bottleneck, and importing enterprise telemetry would add privacy/governance scope.

**Decision:** `ADJACENT IDEA / HOLD / NO ISSUE`。If ever researched, the minimum is an opt-in import of already-redacted aggregate pattern candidates; not session capture, analytics warehouse, admin dashboard or automatic Skill creation.

## E. Microsoft and NVIDIA reinforce existing #3/#4 rather than creating duplicates

**Status:** `CONFIRMED CURRENT CAPABILITY`。

- Microsoft portable `SKILL.md` upload/generation strengthens #4's distribution/interoperability context.
- NVIDIA SkillSpector/SkillEvaluator current docs explicitly treat agent skills as packages that can contain risky instructions, metadata and executable code, strengthening #3's package-security rationale.

Sources:
- https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/skills-create
- https://docs.nvidia.com/skills/scanning-agent-skills

Neither source changes existing fingerprints or severity. No comments or scope expansion were made.

# New Releases / strategy changes

| Date | Product/research | Change | Radar decision |
|---|---|---|---|
| 2026-09-02 | Skill-selection manipulation research | semantic relationship itself can be manipulated to bias Skill selection | New bounded #11 research; no defect severity |
| 2026-09-04 | Microsoft 365 Agents Toolkit | custom `SKILL.md` support; multiple Skills per declarative agent | strengthens multi-skill premise and #4 portability |
| 2026-09-09 | Copilot Studio | skill descriptions guide orchestrator invocation | selection evidence matters; no router build |
| 2026-09-10 | Claude Enterprise Smart reports beta | usage/friction/repeated patterns can surface shared-Skill candidates | adjacent discovery idea only |
| 2026-09-15 | Salesforce in Claude beta | 37 pre-built sales skills in one product workflow | multi-skill environment is no longer theoretical |

# Community Pain

No new community anecdote was used to establish prevalence or severity this round. The selection finding is supported by first-party product surfaces plus a recent research result; absence of user telemetry means the repo-specific user pain remains **UNKNOWN**, which is why #11 stays RESEARCH / NOT_ESTABLISHED rather than BUG or security incident.

# Adjacent Ideas

## 1. Bind invocation-sensitive claims to a small environment fingerprint, not a universal claim

If #11 finds real interference, the smallest useful evidence may be:

`skill hash + target runtime profile + small co-installed set hashes + selector-observable identity + case receipt`.

Do not require every possible Skill combination.

## 2. Mine repeated-work candidates only from explicit, bounded evidence

Claude Smart reports is a useful discovery pattern, but Foundry should not create an always-on employee/session surveillance plane. If owner evidence later shows “I do not know which workflow deserves a Skill” is a real problem, reuse imported aggregate evidence and existing Candidate/quarantine flow.

# Opportunity Map — `skill-foundry`

| Category | Current decision |
|---|---|
| **MUST MATCH** | exact artifact identity; honest runtime/eval scope; trigger and failure states that do not turn UNKNOWN into PASS |
| **SHOULD BE BETTER** | reconstructable evidence showing what exact Skill/runtime/environment a support claim actually covers |
| **DIFFERENTIATOR** | evidence-gated Promotion that keeps quality, runtime compatibility, package security, behavior coverage and now possible selection robustness as separable claims |
| **ADJACENT IDEA** | opt-in usage-pattern → Candidate suggestion; small co-installation receipts after #11 evidence |
| **DO NOT COPY** | skill marketplace, 10K-scale router, vector DB/SkillDAG, enterprise usage surveillance, opaque trust score, all-combination certification |

# Cross-portfolio ideas

**Relational safety is distinct from artifact safety.** A component can be individually safe yet behave incorrectly because of another installed component, route, provider or competing description. This principle may later help `herdr-skills` or agent-tool products, but this round has not revalidated those repositories against the same root cause, so no cross-portfolio framework Issue is created.

# Four Gate decision — #11

1. **Problem / value:** current approved evidence proves aggregate isolated trigger behavior but does not encode neighboring Skill-set identity; first-party hosts now make multi-skill selection a normal product surface. Repo-specific failure frequency remains UNKNOWN.
2. **Priority:** `kind=RESEARCH`, `severity=NOT_ESTABLISHED`, `decision_priority=MEDIUM`; no P1/P2 claim. The external paper is attack-surface evidence, not proof of current exploitability or incidence.
3. **Minimum:** compare one exact active Skill alone vs. the same Skill with 3 tiny synthetic neighbor classes on one already-supported runtime. No router/registry/DB/service.
4. **Research/implementation separation:** #11 has BUILD/NARROW/REJECT exits, synthetic non-destructive fixtures only, `auto_implementation=false`, and explicitly waits behind current #6/#1/#3 priorities. BUILD would only justify the next scoped decision, not automatic policy/code changes.

# Rejected Ideas

- **Build a SkillRouter / vector DB now:** rejected; external research studies ecosystem scale, while Foundry only needs to know whether its claim changes under a small realistic competing set.
- **Turn #11 into P1 security defect:** rejected; no current exploit, user incident, supported-path outage or causal production evidence.
- **Fold #11 into #3 package security:** rejected; #3 asks whether one package is risky, whereas #11 is relational selection behavior between a prompt, host selector and multiple Skills.
- **Fold #11 into #10 behavior coverage:** rejected; #10 asks which internal Skill behaviors were exercised after invocation; #11 asks whether the intended Skill was selected in the first place.
- **Expand #1 active PR:** rejected; #1 is target-runtime compatibility for a Skill revision. #11 is a new environment dimension and stays research-only until measured.
- **Implement Claude-like Smart reports:** rejected; no current user pain or consent/telemetry boundary justifies an analytics product.
- **Marketplace / registry / hosted orchestration:** rejected; contradicts owner-approved narrow certification-plane positioning.

# Issue Mapping / coordination

| Signal / fingerprint | Mapping | Decision |
|---|---|---|
| single-Skill trigger PASS may not survive semantically competing co-installed Skills | **NEW #11** | `RESEARCH / NOT_ESTABLISHED / MEDIUM / NEEDS_EVIDENCE / auto_implementation=false` |
| target runtime compatibility / negative transfer | #1 / active PR #2 | separate; no comment or scope change |
| package supply-chain risk | #3 | Microsoft/NVIDIA context only; no update |
| install/read-back/drift | #4 | Microsoft portability context only; no update |
| demonstration-to-Skill authoring | #5 | Smart reports is adjacent, not duplicate; no update |
| exact-SHA CI admission | #6 / active PR #8/#9 | current roadmap remains higher priority; no update |
| behavior coverage | #10 | separate post-invocation evidence question; no update |

No `github-issue-lock:v1` was acquired because no existing Issue/PR/shared tracking state was modified. #11 was created only after open/closed Issue, all-state PR and code/history dedupe; it was fetched immediately after creation to verify real number/state/body/URL.

# Sources

Public web, checked 2026-09-23 Asia/Taipei:

- OpenAI Skills in ChatGPT: https://help.openai.com/en/articles/20001066
- Microsoft Copilot Studio Skills overview: https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/skills-overview
- Microsoft Agents Toolkit custom skills: https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/build-declarative-agents-add-custom-skills
- Microsoft create a skill: https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/skills-create
- Anthropic Salesforce in Claude, 2026-09-15: https://claude.com/blog/salesforce-in-claude
- Anthropic release notes / Smart reports, 2026-09-10: https://support.claude.com/en/articles/12138966-release-notes
- Implicit Manipulation for Skill Selection, 2026-09-02: https://arxiv.org/abs/2609.02035
- SkillRouter, 2026-03-23: https://arxiv.org/abs/2603.22455
- NVIDIA SkillSpector docs: https://docs.nvidia.com/skills/scanning-agent-skills

GitHub was used only for owner/product/coordination truth:

- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-16T2303Z-product-board-delta.md`
- prior radar `docs/competitive-intelligence/2026-09-22T235848Z-external-radar.md`
- `Reese-max/skill-foundry` current README, current commits, Issues, all-state PRs, release evidence bundle and trigger policy
- new tracking Issue `Reese-max/skill-foundry#11`

# What Changed / classification calibration / completion

- Fresh inventory: **42 owned / 41 unarchived**, pagination exhausted。
- Rules blob: `8167e10798071d2276addaff6b201c6b0e904a2a`。
- Skill Foundry current HEAD at decision time: `d283b5b8af94d125da1afb57eebbdcb66c0b1a89`。
- Owner direction: **INVEST / SIMPLIFY**, unchanged。
- Material new signal: multi-skill automatic selection has become a first-party product surface, while recent research identifies semantic-selection manipulation as a distinct attack/evidence layer。
- New Issue: **#11**, RESEARCH only。
- Existing Issue updates/comments: **0**。
- PR comments/scope changes: **0**。
- Implementation authorizations: **0**。
- Runtime validations: **0**；#11 remains `NEEDS_RUNTIME_VERIFICATION`。
- Portfolio CLEAN: **not declared**。
- Notification threshold: **met** because a new, evidence-backed product/research gap was found and a bounded new research Issue was created; this does not imply urgency or implementation authority。
- Next fair cursor: **`Reese-max/video-timeline-pipeline`**。
