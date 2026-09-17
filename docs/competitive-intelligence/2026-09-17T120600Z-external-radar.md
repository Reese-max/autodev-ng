# 外部競品／新品／工作流靈感雷達 — 2026-09-17T12:06:00Z

> 查閱日：2026-09-17（Asia/Taipei）。
>
> Issue Quality：`issue_quality_version: 2`；本輪已讀取 `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`，blob `8167e10798071d2276addaff6b201c6b0e904a2a`。
>
> Evidence labels：`CONFIRMED`＝第一方產品／官方條款／可直接檢查的 repository truth；`LIKELY`＝有支持但仍缺 account/runtime/真人 evidence；`COMMUNITY_SIGNAL`＝個別社群經驗；`UNKNOWN`＝資料不足。
>
> 本輪未修改產品原始碼、CI/config、secrets、權限、repository settings；未建立實作 branch、merge/deploy、啟動 worker/run 或新 GOAL；未呼叫付費 provider、未使用真實病患資料。

## Executive Summary

依公平輪巡游標，本輪深讀 `Reese-max/project-doctor-web`。Fresh owner listing 完整回傳 **39 個 Reese-max-owned repositories，其中 1 archived、38 owned + unarchived**。這與較早 radar 的 42/39 不一致；本輪只記為 connector/access inventory drift，不推論 repository 已刪除或不存在，也不以舊 inventory 當全集。

本輪保留一個新的、與既有 #11 不同 fingerprint 的高價值研究問題：**現行 Project Doctor 會把 teaching-case 的病史、主訴、對話與客觀資料送往 MiniMax，但目前 visible UI 只有「研究／教學用途」與「不要輸入可直接識別個人的資料」提醒；MiniMax 現行第一方 Terms 則要求 developer 依適用法律提供有效 end-user privacy notice，並取得／保留所需 consent。** 由於實際 account agreement、billing/user region、DPA/enterprise override 未知，本輪沒有宣稱違法／違約，而是建立窄研究單 `project-doctor-web #18`，要求先做 contract + field-flow review，再決定 `BUILD / NARROW / REJECT`。

本輪其他市場訊號沒有形成新 Issue：Geeky Medics SimChat、ThinkClinical、MedSimAI、SimX 仍一致走「educator-authored scenario/rubric + repeatable learner practice + feedback」；2026-09-08/10 的近期醫學教育研究也支持 privacy/human supervision/process-evidence，但這些大多已被 #11 / PR #13 的 CaseSpec/debrief 研究覆蓋。MiniMax status 在 9/7–9/14 出現多次短暫 LLM elevated-errors；目前 Project Doctor 遇到 provider error 會保留上一輪 client state，缺乏 evidence 證明還需要 queue/retry framework，因此只留 reliability signal、不開單。

**本輪結果：1 新 RESEARCH Issue（#18）、0 既有 Issue 改寫、0 PR 留言、0 實作授權。** 下一個公平輪巡 cursor：`prompt-autoresearch`。

---

## Scope / Repository Truth

### Fresh portfolio enumeration

- Fresh Reese-max-owned：39
- Archived：1（`obsidian-vault`）
- Owned + unarchived：38
- 本輪未重新宣稱舊的「36 product-like + 3 support」仍是精確全集，因 connected inventory 已漂移；只針對 fresh listing 中可存取項目輪巡。
- 不操作非 Reese-max repository。

### Rules / owner scope

- Issue Quality v2 blob：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- 沒找到一份獨立、明名為 Project Doctor Product Board 的 current file；因此不假稱完成不存在的 owner-board 核對。
- 可確認的 working scope 仍來自 current README + 歷史 owner/radar decision：Project Doctor 是**臨床研究／教學 UI**，不是診療替代；先守住 emergency/output/cost/provenance/runtime safety，不因市場有 virtual patient 功能就擴張成 autonomous clinical system。

### `project-doctor-web` current truth

Default branch：`main@33bfdcf6a70d7a142369ca060faf9af27334d6e0`（2026-09-16 audit/docs commit）。目前 product source 仍可直接確認：

- UI 收集 age、gender、既往病史／自訂病史、生活習慣／接觸史、主訴、後續病患回答，以及 `BP / PE / Lab / 影像` 等客觀資料。
- `/api/minimax` generate body 包含 patient metadata、`previousSoap`、最近 messages、`userInput`、`physicalTags`。
- Server 組成 prompt 後呼叫 `https://api.minimax.io/v1/chat/completions`。
- UI 已明示「研究與教學用途」，且 Live SOAP 下方已提醒「不要輸入可直接識別個人的資料」。這是相反證據，不能把產品描述成完全沒有 privacy boundary。
- Current main 的 #9 正常 PE skeleton 與 #16 split-turn emergency-history 根因仍存在；已有 active PR，不在本輪搶 scope。

### Active coordination / do-not-steal scope

Open PRs 包括：
- #17 — audit round 5 / audit-trail contract（#3）
- #15 — CVE-2026-44907 patch（#14）
- #13 — CaseSpec/action ledger/rubric research（#11）
- #12 — unobserved normal PE prompt fix（#9）
- #10 — shared abuse limits + provenance（#2/#9）

另有較早 safety candidate PR #5–#8。Privacy/PHI/MiniMax-notice 的 all-state PR search沒有同 fingerprint；`privacy` branch search無結果。因此 #18 不接管上述 active PR，也不修改它們。

---

## External Signals

### A. Provider-policy signal — MiniMax developer terms make end-user disclosure an explicit developer responsibility

**CONFIRMED；current Terms checked 2026-09-17；API Privacy Policy effective 2026-03-30；Paid Services Agreement effective 2026-08-19**

First-party sources:
- https://hub.minimax.io/protocol/terms-of-service
- https://platform.minimax.io/protocol/privacy-policy
- https://platform.minimax.io/protocol/paid-agreement

MiniMax current Open Platform Terms state that developers/customers must comply with applicable data-protection obligations for end-user personal data, including issuing legally effective privacy notices, and confirm they have obtained/retained any consent required for MiniMax to process Client Data. If Client Data contains personal information, the developer also warrants it has the right/consent to transmit the information for MiniMax processing.

MiniMax API Privacy Policy states it processes information submitted through its services and does not promise universal zero retention; retention depends on purpose, legal/business/safety requirements and applicable jurisdiction. The policy is jurisdiction-specific and contains cross-border/data-location provisions for some regions. The 2026-08-19 Paid Services Agreement explicitly supplements the General Terms + API Privacy Policy for paid API use.

**User job / manual boundary:** Project Doctor users need to understand, at the moment they submit a teaching case, whether the data remains within the site or is sent to a third-party model provider. The current copy communicates “不要輸入直接識別資料” but not the provider-processing boundary.

**Do not overclaim:** This does **not** prove Project Doctor violates law or contract. We do not know the exact MiniMax account agreement, billing/user region, or an enterprise/DPA override. It is a decision gap, not a P1/P2 incident.

### B. Direct competitor direction — structured educator truth remains the market pattern

**CONFIRMED product direction; checked 2026-09-17**

Sources:
- Geeky Medics SimChat, published 2026-05-28: https://geekymedics.com/virtual-patient-simulator/
- ThinkClinical current: https://thinkclinical.ai/
- MedSimAI current: https://medsimai.com/
- SimX Autonomous Simulation current: https://www.simxvr.com/platform/autonomous-simulation/

Current products continue converging on the same workflow:
- turn existing educator cases/scripts/checklists into interactive scenarios;
- keep curriculum/scenario truth controlled by educator-authored inputs;
- let learners repeat patient interactions;
- assess reasoning/communication with structured feedback or rubrics;
- keep AI behavior tied to pre-authored or validated scenario logic instead of making model improvisation the clinical ground truth.

**Transferable:** reinforces Project Doctor #11’s CaseSpec/fact-grounding/replay research.

**Do not copy:** VR, avatars, institutional analytics, 80+ case libraries, cohort admin, or broad authoring suites have no independent owner/user evidence here and would expand scope before existing safety/runtime gates are settled.

### C. Recent research — safety/privacy/human supervision should be first-class, but educational efficacy must still be measured

**CONFIRMED research; published 2026-09-08 to 2026-09-10**

Sources:
- Frontiers in Medicine, 2026-09-08 randomized pilot: https://www.frontiersin.org/journals/medicine/articles/10.3389/fmed.2026.1927674/full
- JMIR Medical Education, 2026-09-10 “Promise, Mimicry, and Surveillance”: https://mededu.jmir.org/2026/1/e102958
- JMIR Medical Education, 2026 framework on digital standardized patients: https://mededu.jmir.org/2026/1/e91050

Recent papers add current evidence that AI virtual-patient workflows may be useful in bounded educational settings, but privacy, bias, human supervision, feedback validity and study design remain important limitations. This supports keeping #11 as controlled research and strengthens the rule that future replay/debrief should stay synthetic-first. It does not create a separate “AI tutor” Issue.

### D. Provider reliability — repeated short LLM elevated-error incidents are real, but current evidence does not justify a retry system

**CONFIRMED operational signal; checked 2026-09-17**

Source: https://status.minimax.io/

MiniMax’s status page records repeated short LLM elevated-error incidents across 2026-09-07 through 2026-09-14, while 2026-09-17 shows operational/no incident. Project Doctor’s client already restores prior messages/reply state on generation failure, and the API uses a bounded 30-second provider timeout. No production completion-rate or user-loss evidence was found this round.

**Decision:** keep as `ADJACENT / VALIDATION_SIGNAL`, not a new queue/retry Issue. A generic retry/queue would add state, duplicate-send ambiguity and provider cost without demonstrated user pain.

---

## New Releases / Current Changes

- **2026-09-10** — JMIR publication adds a recent governance/privacy/surveillance perspective for AI in medical education.
- **2026-09-08** — Frontiers randomized pilot adds new educational evidence, but it does not validate Project Doctor’s own outcomes.
- **2026-08-19** — MiniMax Paid Services Agreement is now the current paid-service supplement to General Terms/API Privacy Policy; variable account/service terms need to be considered before asserting data-handling guarantees.
- **2026-09-07–14** — MiniMax status recorded multiple brief LLM elevated-error incidents; current service is operational on 2026-09-17.

---

## Community Pain

No new community anecdote this round passed the retention bar strongly enough to influence priority. Earlier reports already captured speech/action-recognition and “AI patient over-helping” anecdotes; repeating them would not change a decision. No attempt was made to infer incidence from Reddit/social posts.

---

## Adjacent Ideas

1. **Point-of-use provider boundary** — if #18 returns BUILD, the smallest product change is a clear disclosure immediately before/near the first remote model submission, not a separate privacy center.
2. **Synthetic/de-identified teaching default** — strengthen the existing “no directly identifiable data” copy toward synthetic/de-identified cases if the active agreement review supports it. This aligns with #11 without depending on #11.
3. **Provider failure receipt** — only if later runtime evidence shows repeated user work loss should the product consider a tiny retry affordance / provider-status hint. No queue or durable job system now.
4. **Cross-portfolio candidate pattern:** repos that forward user-authored sensitive/private content to third-party AI providers may benefit from the same “local state vs remote provider processing” distinction. This is only a portfolio research pattern; this round did not inspect enough repo-specific data flows to create cross-project Issues.

---

## Opportunity Map — project-doctor-web

### MUST MATCH

- Research/education positioning; no autonomous diagnosis/treatment claims.
- Emergency detection, fail-closed output parsing, provenance, and cost boundaries remain independent of new education features.
- Scenario/educator truth must stay separate from model improvisation.
- If user content leaves the site for a remote provider, the product must not visually imply that server-side API-key secrecy means the teaching-case content remains local.
- Do not turn “不要輸入直接識別資料” into a claim that all remaining health-like data is non-personal or risk-free.

### SHOULD BE BETTER

- Distinguish `local UI state / own API handling` from `MiniMax remote processing` in visible copy.
- Prefer synthetic/de-identified case practice by default when it preserves the educational job.
- Keep `CANNOT_SCORE / INSUFFICIENT_EVIDENCE` and fact-grounded feedback principles from #11 rather than optimizing for complete-looking outputs.

### DIFFERENTIATOR

- A narrow, inspectable teaching workflow where case truth/provenance and deterministic safety gates are more trustworthy than an open-ended “AI doctor”.
- Privacy/safety boundaries expressed at the point of action, without building an enterprise compliance product.

### ADJACENT IDEA

- Optional provider-status/retry UX only if runtime loss evidence appears.
- Provider-agnostic field-redaction preview only if #18 proves a real input-boundary need; currently too large for the evidence.

### DO NOT COPY

- Full VR/avatar/voice/video platform.
- Enterprise learner analytics, cohort/LMS suite, or large case marketplace.
- PHI vault, consent ledger/database, HIPAA certification project, generic compliance framework.
- Provider migration/multi-provider router solely because current terms require disclosure.
- Durable retry queue solely because status history contains outages.

---

## Four-Gate Decision — new privacy/data-flow candidate

### 1. Problem / value

**Pass as RESEARCH, not defect severity.** Current source proves teaching-case fields are sent to MiniMax; current UI proves a generic privacy warning exists; MiniMax current first-party terms prove developer notice/consent responsibilities exist in the applicable framework. What is missing is account-specific applicability/sufficiency, so no legal or P1/P2 claim.

Target user: learner/educator using the supported teaching/research flow. Observable gap: before the first remote request, user can see “server-side key secure” and “no directly identifiable data”, but cannot tell from the visible UI what clinical-case content goes to MiniMax or which provider privacy terms govern it.

### 2. Priority

- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=HIGH`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`

High decision priority is justified because resolving the boundary is cheap before future CaseSpec/replay work grows; it is **not** severity inflation.

### 3. Minimum solution comparison

- **No change:** acceptable only if active agreement/DPA + current notice are confirmed sufficient.
- **README/docs only:** may clarify maintainer intent but is weak at the actual submission moment.
- **Thin point-of-use copy/link:** current smallest likely BUILD candidate; no new persistence.
- **Consent DB/framework:** rejected unless a later active agreement explicitly creates a requirement that cannot be met by the current session/UI boundary.
- **Provider migration:** rejected; terms evidence does not prove MiniMax is unsuitable.

### 4. Research / implementation separation

Issue #18 requires a read-only account/contract + field-flow review, synthetic fixture only, and a `BUILD / NARROW / REJECT` result. BUILD would support a subsequent minimal UI decision only; it does not authorize source changes, deployment, paid calls, or legal/compliance claims.

---

## Rejected Ideas / Why

- **New AI tutor / evaluator agent:** dedupe to #11 / PR #13; no new root cause.
- **Large CaseSpec authoring suite:** active research already exists; no educator runtime evidence justifies expansion.
- **Retry queue / background job system:** provider incidents are real but no current completion-loss evidence; existing error path preserves client state.
- **Provider swap or multi-model router:** disclosure requirement is not provider-quality failure evidence.
- **HIPAA/legal compliance program:** account/region/use details are incomplete and this radar is not legal counsel.
- **Store consent receipts in a database:** no evidence yet that persistent consent records are necessary for this educational prototype; research first.

---

## Issue Mapping

### Created

- `Reese-max/project-doctor-web #18` — `[Research][RESEARCH_REQUIRED][Privacy] Validate MiniMax end-user data notice for teaching-case inputs`
  - https://github.com/Reese-max/project-doctor-web/issues/18
  - `RESEARCH / NOT_ESTABLISHED / HIGH / NEEDS_EVIDENCE / auto_implementation=false`
  - Read-back verified after creation.

### Existing / deduped / locked scope

- #11 / PR #13 — educator CaseSpec/rubric/debrief research; fresh market/research evidence is additive but not enough to steal/rewrite active scope.
- #2 / PR #10 — durable/shared cost boundary; unrelated to provider privacy notice.
- #9 / PR #12 — objective provenance; unrelated root cause.
- #16 — multi-turn emergency red flag history; unrelated root cause.
- #14 / PR #15 — RSC security patch; unrelated root cause.
- #3 / PR #17 — fixed-50 audit loop; no radar rewrite.

---

## Sources

### First-party / authoritative

1. MiniMax Open Platform Terms of Service — current checked 2026-09-17  
   https://hub.minimax.io/protocol/terms-of-service
2. MiniMax API Privacy Policy — effective 2026-03-30  
   https://platform.minimax.io/protocol/privacy-policy
3. MiniMax Open Platform Paid Services Agreement — effective 2026-08-19  
   https://platform.minimax.io/protocol/paid-agreement
4. MiniMax Status — current + incident history checked 2026-09-17  
   https://status.minimax.io/
5. Geeky Medics SimChat — published 2026-05-28  
   https://geekymedics.com/virtual-patient-simulator/
6. ThinkClinical — current checked 2026-09-17  
   https://thinkclinical.ai/
7. MedSimAI — current checked 2026-09-17  
   https://medsimai.com/
8. SimX Autonomous Simulation — current checked 2026-09-17  
   https://www.simxvr.com/platform/autonomous-simulation/

### Research

9. Frontiers in Medicine — AI-driven VSP + scenario-based simulation randomized pilot, published 2026-09-08  
   https://www.frontiersin.org/journals/medicine/articles/10.3389/fmed.2026.1927674/full
10. JMIR Medical Education — Promise, Mimicry, and Surveillance, published 2026-09-10  
    https://mededu.jmir.org/2026/1/e102958
11. JMIR Medical Education — Digital Standardized Patients framework, 2026  
    https://mededu.jmir.org/2026/1/e91050

---

## What Changed vs Previous Project Doctor Radar

- **New external provider-policy evidence was elevated into a distinct current-flow question.** Earlier project-doctor radar focused on CaseSpec/scenario truth/educational feedback. This round checked the active MiniMax Terms/API Privacy Policy/Paid Agreement against the *existing* open-ended `/api/minimax` flow.
- **Did not expand #11.** Fresh competitor/research signals still support structured educator truth and human supervision but do not create another agent/tutor feature request.
- **Did not convert MiniMax incident history into a reliability defect.** No current user-impact/runtime completion evidence.
- **Inventory changed:** fresh connector listing is 39 owned / 38 unarchived; prior 42/39 remains historical only.

---

## Calibration / Limits / Handoff

- `SOURCE_CONFIRMED` for current field flow, existing UI warning, and MiniMax published Terms/Privacy Agreement language.
- `UNKNOWN` for exact account-specific agreement, billing/user region, DPA/enterprise override, production user behavior, and whether any real patient data has ever been entered.
- No MiniMax request was executed this round; no real PHI used; no runtime privacy behavior claimed.
- No legal conclusion is made.
- Product HEAD was rechecked immediately before #18 creation and remained `33bfdcf6a70d7a142369ca060faf9af27334d6e0`.
- No existing active Issue/PR scope was modified; #18 was read back after write.
- Next fair-rotation cursor: **`prompt-autoresearch`**.
