# 外部競品／新品／工作流靈感雷達 — 2026-09-22T04:00:18Z

## Status / scope / evidence boundary

- 狀態：**COMPLETE / MATERIAL LEGAL-AI DISTRIBUTION SHIFT / 0 NEW ISSUES**。
- 主要情報來源是 Reese-max GitHub 之外的公開網路；GitHub 只用於 current product truth、owner scope、既有方向、Issue/PR 去重、協調與持久化報告。
- Issue Quality 規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`；rules blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh connected-owner pagination 已完整跑完：**42 Reese-max-owned repositories / 41 unarchived**；第二頁為空。目前可見清單中只有 `obsidian-vault` archived。舊 inventory 不當作全集。
- 本輪 fair-rotation focus：`Reese-max/note-filler`。目前 default branch：`main@e8057ad815fc18dfd20aeea5e2e3c76d56925b3b`；此 HEAD 是 fixed-50 audit docs，最近產品程式 baseline 仍為 `935b00113662942f9d700444de42d445ee6c8cea`。
- `note-filler` 的 owner/product-board 方向沿用最近校準：**MAINTAIN / VALIDATE**，不要擴張成大型法律平台。核心產品契約仍是法律／行政／考試筆記補齊，**原稿不可變、無來源不進正文**。
- Current active scopes：#3 + open PR #10 為 claim-level Verify/Accept/Reject 與 decision history；#1/#4 + open PR #8 為 README／web export isolation；#9 為 law-snapshot freshness research；#12 為 batch sidecar binding P2 bug。本輪不搶改任何 active scope。
- 寫入前 `autodev-ng/main` 已重新核對為 `e53c7cc0aa17f3696ea79ea170c121b94ab5847f`。本報告使用唯一新檔名，不覆寫共用歷史。
- 本輪沒有執行真實 Grok、正式法律意見、production web、付費 provider、CI 觸發、merge/deploy、worker/GOAL、secret/permission/settings 變更，也沒有修改產品 source/config。

## Executive decision

**0 new Issue、0 existing Issue/PR comment、0 implementation authorization。**

這輪真正值得保留的不是「另一個法律 AI 功能」，而是市場分發模型正在快速改變：**權威法律／證據層正在從單一法律 AI 介面中抽離，直接進入 Codex、ChatGPT Enterprise、Microsoft 365 Copilot、Harvey 等使用者已工作的 AI／drafting surface，同時保留 source provenance、matter context 與 governed evidence。**

對 `note-filler` 的校準是：

> 「AI 幫我補法律筆記」與「有 citation 的法律 AI」正在快速商品化；真正值得累積的不是 host 數量，而是 **原稿不可變 + assertion/claim 級 evidence + 人類採納／拒絕歷史 + source/currentness truth + artifact binding**，而且這些可信狀態換 host 後仍不能消失。

這個市場變化**不授權**現在做 Codex plugin、MCP server、DMS、matter workspace 或多模型 router。

---

## Product → market category mapping

`note-filler` 本輪主要對照四個市場／工作流類別：

1. source-grounded legal research / drafting copilots；
2. legal evidence layer / matter-context integrations；
3. human review / apply-reject drafting workflows；
4. authoritative-source currentness / provenance validation。

Current supported job 不是替律師做完整 matter management，而是：保留使用者原始法律／行政／考試筆記，產生可分離 supplement，讓有證據的內容可追溯，無證據的內容不得冒充正式正文。

# External Signals

## A. 重大直接策略變化 — Clio 把 authoritative legal intelligence 直接帶進 Codex

**Status:** `CONFIRMED` first-party release。  
**Published:** 2026-09-17。  
**Checked:** 2026-09-22。  
**Sources:**
- https://www.clio.com/about/press/clio-vincent-codex-plugin/
- https://www.clio.com/enterprise/blog/clio-vincent-codex-plugin-law/

Clio 在 2026-09-17 正式讓 Vincent 透過 MCP plugin 進入 Codex。官方明確把 primary law、court records、matter context、purpose-built legal workflows 與 source provenance 帶進 Codex，而不是只把資料庫暴露成搜尋端點。官方使用情境是從 docket／matter status → judge/legal research → strategy → finished work，並保留 underlying citations，不必在每一步重新組裝法律 context。

### User job / reduced manual work

原本使用者必須在法律研究工具與一般 AI／coding/knowledge surface 間反覆複製：案件背景、研究結果、引用、程序狀態。這個模式把 authoritative source context 留在專業 legal layer，由 general-purpose host 在需要時呼叫。

### note-filler implication

這是**定位校準，不是 Codex feature request**。

`note-filler` 目前沒有 owner/user evidence 證明「把筆記結果手動搬到 Codex」是高頻斷點；反而 repo 已有 `binding_report.json`，可逐 argument 記錄 `argument_id / source_ids / source_fragments / citation_spans / confidence / source_conflicts` 等 evidence binding，且 delivery manifest 已保存 input/output content hashes。缺的不是另一個 host，而是先把既有 evidence lifecycle 做可靠。

**Decision:** `MAJOR_STRATEGY_SIGNAL / NO_NEW_ISSUE`。

---

## A2. Everlaw 把 governed evidence 同時帶進 ChatGPT Enterprise 與多個 AI host

**Status:** `CONFIRMED` first-party releases。  
**Published:** 2026-09-17（ChatGPT Enterprise plugin）；2026-08-25（evidence-layer multi-partner strategy）。  
**Checked:** 2026-09-22。  
**Sources:**
- https://www.everlaw.com/press/release/everlaw-announces-plugin-with-chatgpt-enterprise/
- https://www.everlaw.com/press/release/ai-partnerships-integrations-evidence-layer-for-litigation/

Everlaw 2026-09-17 宣布 ChatGPT Enterprise plugin，讓 legal teams 直接在 ChatGPT 工作時存取案件 evidence，而不是把檔案複製到另一套系統。更早的 2026-08-25 strategy announcement 已把 Everlaw 定位成 litigation/investigation 的 **evidence layer**，同時連接 CoCounsel Legal、Harvey、Gemini Enterprise for Legal 與 Microsoft 365 Copilot。

這個訊號比單純「又多一個 AI 整合」重要：市場正在把**可信證據系統**與**可替換 AI host**分離。

### Transferable principle

- canonical evidence/provenance 應有自己的 authority；
- host 可以換，但 citation/source identity/currentness 不應被 host 重建或遺失；
- downstream AI 不應因為拿到 context 就自動取得修改 canonical evidence 的權限。

### What not to copy

- 不做 e-discovery repository；
- 不做大型 matter store、DMS 或多 tenant permissions；
- 不為了「host-neutral」先建 cross-project connector framework。

**Decision:** `CONFIRMS_EVIDENCE_FIRST_DIRECTION / NO_NEW_ISSUE`。

---

## B. Harvey 9 月版本把 multi-source、history-apply 與 iManage citation 串成連續工作流

**Status:** `CONFIRMED` first-party release summary。  
**Published:** 2026-09-16。  
**Checked:** 2026-09-22。  
**Source:** https://www.harvey.ai/blog/the-brief-september-2026

Harvey 9 月更新的決策級訊號包括：

- single query 可 attach 最多五個 knowledge sources；
- 新增 150+ authoritative legal research sources；
- Word 中可 side-by-side 比較 alternate suggestions；
- 可從 history 回到先前 thread，套用當時未採用的 suggestion；
- iManage search 可直接用自然語言找 precedent，並以 citations 回指 source documents；
- client matter 可要求 lawyer 先 acknowledgement 客戶 AI policy 再工作。

### note-filler implication

最值得移植的是**「研究證據 → 人類比較／採用 → 日後回看當時決策」**，不是「五來源」這個數字。

Existing #3 已經是同一核心 root cause：system `verified` 不等於 human `ACCEPTED`；decision 要綁 claim/evidence revision，source 或 claim 變動後舊採納不可靜默沿用。Open PR #10 正在做這個 active scope，所以本輪新證據只進 central report，**不留言、不擴 scope、不另開 Issue**。

**Decision:** `DEDUPE -> #3 / SKIPPED_ACTIVE_SCOPE`。

---

## B2. Harvey × Everlaw：證據留在原系統，AI 在上層分析／起草

**Status:** `CONFIRMED` first-party partnership。  
**Published:** 2026-09-03。  
**Checked:** 2026-09-22。  
**Source:** https://www.harvey.ai/blog/harvey-everlaw-evidence-ediscovery

Harvey 明確描述 litigation evidence 具備 metadata 與 verifiable chain of custody；整合的目的是讓 team 不必離開 Harvey 搬運資料，但 evidence 仍留在 Everlaw 的 system of record。

對 `note-filler` 的可移植原則是：**生成表面不應成為 source of truth；輸出必須能回到 exact evidence artifact。** 這也間接強化 #12 的 per-output sidecar binding 重要性，但外部產品做法不能把 #12 從 P2 升級成 P1：#12 的現有 P2 已有 current-source 因果證據，而本輪沒有新的實際 note-filler runtime failure。

**Decision:** `REINFORCES #12 / NO SEVERITY CHANGE / NO COMMENT`。

---

## C. Lexis+ with Protégé 持續把「authoritative + user file + web + guided Skill」當成產品基線

**Status:** `CONFIRMED` first-party release。  
**Published:** 2026-09-04。  
**Checked:** 2026-09-22。  
**Sources:**
- https://www.lexisnexis.com/blogs/my/b/press-room/posts/lexisnexis-launches-skills-in-lexis-with-protege-in-malaysia
- https://www.lexisnexis.com/community/pressroom/b/news/posts/lexisnexis-and-evenup-announce-strategic-alliance-bringing-trusted-legal-ai-to-personal-injury-professionals

LexisNexis 的 current messaging 很清楚：生成文字不是足夠價值，法律工作需要 current authoritative content、verification、user files、confidentiality/privilege governance 與符合實務的 repeatable workflows。9 月 1 日與 EvenUp 的 alliance 也直接針對 claims analysis、legal research、strategy、document preparation 在多工具之間切換的摩擦。

這再次支持 `note-filler` 現有方向：**source truth/currentness (#9) 與 review/adoption (#3) 應優先於 generic generation breadth。**

**Decision:** `EXISTING_DIRECTION_CONFIRMED / NO_NEW_ISSUE`。

# New Releases / strategy changes

| Date | Product / change | Confidence | `note-filler` consequence |
|---|---|---|---|
| 2026-09-17 | Clio Vincent becomes a Codex MCP plugin | CONFIRMED | authoritative source/matter context is becoming host-portable; do not treat standalone legal AI UI as moat |
| 2026-09-17 | Everlaw ChatGPT Enterprise plugin | CONFIRMED | evidence layer can remain canonical while general AI host changes |
| 2026-09-16 | Harvey September release | CONFIRMED | multi-source + apply-from-history + cited DMS search reinforce claim review/history, not fixed feature parity |
| 2026-09-04 | Lexis+ Protégé Skills expansion | CONFIRMED | authoritative/current source + verification + guided workflow are table stakes in professional legal AI |
| 2026-09-03 | Harvey × Everlaw | CONFIRMED | chain-of-custody evidence should remain separate from generation surface |
| 2026-08-25 | Everlaw evidence-layer multi-platform strategy | CONFIRMED | host-neutral evidence is an explicit vendor strategy, not a hypothetical pattern |

# Community Pain

本輪沒有找到比上述 first-party 產品變化更強、且足以改變 `note-filler` 決策的新鮮 Reddit/HN 訊號，因此**不為了湊類別硬留社群案例**。

較舊的 legal-tech community 討論仍反覆提到：特定文件／bounded use case 比泛用 AI 更容易產生價值，而 AI output 的人工修正與 review 可能抵銷節省時間。這些只能視為 `COMMUNITY_SIGNAL`，不能拿來推算錯誤率、採用率或 ROI，也不是本輪開單依據。

# Adjacent Ideas

## 1. Evidence package should survive a change of host — but first reuse existing artifacts

如果未來 owner evidence 證明使用者真的反覆把 `note-filler` 結果、citations 與採納理由搬到 Codex／Word／其他工具，第一個實驗不應是 MCP server。

最小測試順序：

1. 先確認現有 corrected output + `binding_report.json` + `delivery_manifest.json` 是否已能回答「哪個 claim、哪個 source、哪段 citation、哪個 input/output hash」。
2. 等 #3 的 human decision state 真正落到 default branch 後，再驗證是否能在**一個**下游 host 以 deterministic read-only bundle 帶出 `accepted claim + source locator + evidence/currentness state + review revision`。
3. 只有真的量到重輸／丟 provenance 的斷點，才考慮 host adapter。

**Do not build now.** #12 目前甚至仍追蹤 batch sidecar 被覆寫的 P2；先確保既有證據 artifact 本身穩定，比增加新分發面更重要。

## 2. Do not copy fixed source-count parity

Harvey 的「最多五個 knowledge sources」是產品能力，不是 `note-filler` 的品質門檻。某個主張可能一個 authoritative source 就足夠，也可能多個 source 仍互相衝突。

真正應保留的是 current source model 已有的 `source_count / source_ids / source_fragments / citation_spans / source_conflicts` 與 evidence-specific confidence，而不是「少於五來源就不完整」。

## 3. Current authority remains separate from citation existence

這輪 host-portability 訊號不取代 #9。即使 Codex/ChatGPT 能攜帶 citation，若 local law snapshot 的 query date 被當成 freshness，引用仍可能給使用者過度信心。

所以 `source exists`、`source supports claim`、`source is current/effective`、`human accepted` 必須保持四個不同 assertions；不要合併成單一 verified boolean。

# Opportunity Map — `note-filler`

| Bucket | Decision |
|---|---|
| **MUST MATCH** | 原稿不可變；無來源不進正式 supplement；exact claim↔evidence binding；batch artifact 不可錯綁／覆寫（#12）；source/currentness truth 不得用 query time 冒充（#9）。 |
| **SHOULD BE BETTER** | 人類能清楚接受／拒絕／退回補證，並知道當時基於哪一版 claim/evidence；來源變動後舊採納失效（#3）。 |
| **DIFFERENTIATOR** | host-independent trust：即使 output 日後被帶到 Codex/Word/其他 surface，original/evidence/currentness/review history 仍能被驗證，而不是只保留生成文字。 |
| **ADJACENT IDEA** | 只有在真實跨工具重輸摩擦成立後，測一個 read-only portable evidence bundle；先重用 binding/delivery artifacts，不建 MCP server。 |
| **DO NOT COPY** | full legal matter platform、DMS/e-discovery、host marketplace、多模型 router、固定五來源門檻、Westlaw/Shepard's clone、背景 law-sync framework、通用 legal agent。 |

# Four-Gate Decisions

## Candidate 1 — Codex / ChatGPT / generic AI host integration

Stable fingerprint:

`note-filler + source-grounded legal note output + market moves authoritative legal context into general AI hosts + no observed owner/user evidence of repeated manual host transfer + existing evidence artifacts already contain substantial binding metadata`

Classification:

```yaml
issue_quality_version: 2
kind: OPPORTUNITY
severity: NOT_ESTABLISHED
decision_priority: MEDIUM
evidence: NEEDS_EVIDENCE
triage: NEEDS_EVIDENCE
auto_implementation: false
```

### Gate 1 — Problem / value

External market evidence is strong that legal professionals dislike rebuilding context across tools. `note-filler`-specific pain is **not proven**. Current user/job can already finish inside local CLI/web + export; there is no current owner evidence that Codex integration is required.

### Gate 2 — Priority

- User Pain: `UNKNOWN` for `note-filler`.
- Strategic Fit: `MEDIUM` if downstream reuse becomes common.
- Novelty: `LOW-MEDIUM`; competitors already ship it.
- Evidence: `HIGH` for market direction, `LOW` for local need.
- Reuse: high potential because binding/delivery artifacts already exist.
- Security/Privacy/Cost: rises sharply if remote host auth/write scope is added.

No P-severity is established.

### Gate 3 — Minimum approach

**No code change now.** If real transfer friction appears, first export/reuse existing artifacts in one read-only manual experiment. A new MCP server/plugin/OAuth/connector registry is not the minimum solution.

### Gate 4 — Exit

- **BUILD:** repeated real workflow shows provenance/context is lost during downstream reuse, and current artifacts can solve most of it with a thin read-only adapter.
- **NARROW:** existing binding/delivery files are sufficient; only document a stable export recipe.
- **REJECT:** downstream host transfer is rare or legal/privacy cost exceeds the demonstrated value.

**Decision:** `REPORT ONLY / NO ISSUE`。

---

## Candidate 2 — Persisted claim decision/history as competitive differentiator

This is the **same root cause as existing #3**. Harvey’s apply-from-history and source-connected drafting strengthen the external evidence, but do not create a second feature.

Classification remains conceptually:

```yaml
kind: OPPORTUNITY / existing competitive feature scope
severity: NOT_ESTABLISHED for the opportunity itself
decision_priority: MEDIUM
triage: existing scope under review/implementation PR
auto_implementation: false from this radar
```

Open PR #10 is active and unmerged. Therefore external radar does not acquire its scope, modify acceptance criteria, or treat it as default-branch product truth.

**Decision:** `DEDUPE #3 / SKIPPED_ACTIVE_SCOPE`。

---

## Candidate 3 — authority currentness

This remains exact existing #9 fingerprint. New legal-AI integrations make provenance portability more valuable, but they do not answer whether `note-filler` local law rows are materially stale in a real supported query.

Current classification stays:

```yaml
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: HIGH
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

**Decision:** `DEDUPE #9 / NO STATUS CHANGE`。

---

## Candidate 4 — chain-of-custody / evidence artifact binding

Harvey/Everlaw reinforce that generated work must remain tied to exact evidence. `note-filler #12` already has a stronger repo-local cause: multi-file CLI can overwrite fixed directory-level `binding_report.json` and `delivery_manifest.json` sidecars.

External evidence does not change the severity or prove runtime incidence.

**Decision:** `REINFORCES #12 / P2 UNCHANGED / NO COMMENT`。

# Cross-portfolio idea

**Evidence should be portable; authority should not be.**

Potentially relevant to `academic-mcp`, `ppt-studio`, `ninax-line-hermes`, `taichung-police-intel` and `note-filler`: AI host/surface can change, while source identity, provenance, freshness, human review and artifact hash should remain owned by the domain product.

This is a design principle, **not** approval for one cross-portfolio provenance framework. Each repository already has distinct source/evidence contracts, and no shared implementation Issue is justified this round.

# Rejected / deferred ideas

1. **Build a Codex plugin / MCP server now — DEFER.** Strong market signal, missing `note-filler`-specific pain evidence.
2. **Create a host adapter registry — REJECT.** Framework before a validated second host.
3. **Add full DMS / matter management — REJECT.** Wrong product scale and owner direction.
4. **Require five sources because Harvey supports five — REJECT.** Count is not evidence quality.
5. **Build a legal citator / treatment graph — REJECT.** #9 only needs bounded currentness semantics/experiment.
6. **Build a background official-law sync service now — REJECT/DEFER.** #9 must first choose BUILD/NARROW/REJECT from one amended-law comparator.
7. **Merge #3, #9 and #12 into one “evidence framework” — REJECT.** They have different root causes: human decision lifecycle, source currentness, and artifact binding.
8. **Treat vendor marketing claims as measured note-filler efficacy — REJECT.** External capabilities are strategy/workflow evidence only.

# Issue / PR mapping

| Tracker | Current meaning | This round |
|---|---|---|
| #3 + open PR #10 | claim-level human review / decision history | new Harvey/Clio signals reinforce; **no scope mutation** |
| #9 | local law snapshot currentness research | classification unchanged; **no comment** |
| #12 | batch output sidecars can overwrite earlier evidence binding | external chain-of-custody pattern reinforces importance; **P2 unchanged** |
| #4 + open PR #8 | process-global export isolation/privacy | unrelated higher-priority confirmed safety scope; **untouched** |
| #1 + open PR #8 | root safety contract README | active bundled remediation; **untouched** |

No new Issue fingerprint passed all four gates. Since no Issue/shared tracker state changed, no lease marker was needed or written.

# Sources

## Public web / primary

1. Clio, **Vincent is Available as a Codex Plugin**, published 2026-09-17, checked 2026-09-22: https://www.clio.com/about/press/clio-vincent-codex-plugin/
2. Clio, **Introducing Clio for Codex**, published 2026-09-17, checked 2026-09-22: https://www.clio.com/enterprise/blog/clio-vincent-codex-plugin-law/
3. Everlaw, **Everlaw Announces Plugin with ChatGPT Enterprise**, published 2026-09-17, checked 2026-09-22: https://www.everlaw.com/press/release/everlaw-announces-plugin-with-chatgpt-enterprise/
4. Everlaw, **AI partnerships / Evidence Layer for Litigation**, published 2026-08-25, checked 2026-09-22: https://www.everlaw.com/press/release/ai-partnerships-integrations-evidence-layer-for-litigation/
5. Harvey, **The Brief: September 2026**, published 2026-09-16, checked 2026-09-22: https://www.harvey.ai/blog/the-brief-september-2026
6. Harvey, **Harvey Partners With Everlaw to Power Evidence-Backed Legal Work**, published 2026-09-03, checked 2026-09-22: https://www.harvey.ai/blog/harvey-everlaw-evidence-ediscovery
7. LexisNexis Malaysia, **Lexis+ with Protégé Skills**, published 2026-09-04, checked 2026-09-22: https://www.lexisnexis.com/blogs/my/b/press-room/posts/lexisnexis-launches-skills-in-lexis-with-protege-in-malaysia
8. LexisNexis + EvenUp alliance, published 2026-09-01, checked 2026-09-22: https://www.lexisnexis.com/community/pressroom/b/news/posts/lexisnexis-and-evenup-announce-strategic-alliance-bringing-trusted-legal-ai-to-personal-injury-professionals

## Repository / owner evidence

- Issue-quality rules: `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`, blob `8167e10798071d2276addaff6b201c6b0e904a2a`.
- `note-filler` current HEAD: `e8057ad815fc18dfd20aeea5e2e3c76d56925b3b`; last product baseline `935b00113662942f9d700444de42d445ee6c8cea`.
- Product description: `pyproject.toml` — legal/admin/exam note auto-completion; original immutable; unsourced material excluded from body.
- Existing trackers: #1, #3, #4, #9, #11, #12; active PRs include #8 and #10.
- Current `binding_report.v2` already records per-argument evidence metadata; delivery manifest persists input/output artifact hashes.

# What Changed since prior note-filler radar

The previous focused `note-filler` external radar on 2026-09-16 centered on **law-source currentness** and created narrow Research #9. Since then, the more material market delta is distribution/architecture:

- 2026-09-17 Clio moved Vincent’s authoritative legal intelligence into **Codex** via MCP.
- 2026-09-17 Everlaw moved governed litigation evidence into **ChatGPT Enterprise**.
- 2026-09-16 Harvey’s current release made source-connected drafting/review history and DMS citations more explicit.

This does **not** reverse `MAINTAIN / VALIDATE`. It sharpens it: professional legal AI is increasingly treating the AI host as replaceable while source/evidence/governance remains the durable layer. `note-filler` should therefore finish correctness and trust contracts before expanding distribution surfaces.

# Completion / gaps / next cursor

- Completed fresh GitHub owner pagination: **42 owned / 41 unarchived**, second page empty.
- Completed current rules, default-branch, historical radar, Issue/PR and active-scope recheck for focal repo.
- Completed external direct/adjacent scan using first-party Clio, Everlaw, Harvey and LexisNexis sources.
- New Issues: **0**.
- Existing Issue/PR comments or mutations: **0**.
- Product/CI/config/secrets/permissions/settings changes: **0**.
- Implementation/worker/GOAL/merge/deploy/provider spend: **0**.
- Runtime/user gaps: no actual downstream Codex/ChatGPT transfer test, no real Grok run, no live shared deployment, no user-frequency evidence. Candidate host portability therefore remains `NEEDS_EVIDENCE`.
- This radar does **not** declare `note-filler` or portfolio CLEAN.
- Next fair product cursor from the fresh owner order: **`Reese-max/cyber-prep-coach`**. `adng-memory` remains in inventory but is historically support/compatibility-only, so it is not consumed as a product-feature radar target.
