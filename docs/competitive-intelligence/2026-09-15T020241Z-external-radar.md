# 外部競品／新品／工作流靈感雷達 — 2026-09-15T02:02:41Z

> 查閱日：2026-09-15（Asia/Taipei）；檔名時間使用 UTC。
>
> Issue Quality：`issue_quality_version: 2`；本輪重新讀取 `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`，blob SHA `8167e10798071d2276addaff6b201c6b0e904a2a`。
>
> Evidence labels：`CONFIRMED`＝第一方產品／官方文件、學術原始來源或可直接檢查的 repository truth；`LIKELY`＝有支持但仍需產品／runtime／真人研究；`COMMUNITY_SIGNAL`＝個別社群經驗；`UNKNOWN`＝資料不足。
>
> 本輪沒有修改任何產品原始碼、CI/config、secret、權限或 repository settings；沒有建立實作 branch、merge/deploy、啟動 worker/run 或新 GOAL；沒有付費試用或變更正式資料。

## Executive Summary

依上一輪 `2026-09-14T235901Z-external-radar.md` 的 cold-rotation cursor，本輪深讀 `Reese-max/prompt-autoresearch`。重新完整列舉 connected GitHub owner listing：**42 個 Reese-max owned repositories，3 archived、39 owned + unarchived**；沿用目前已校準範圍為 **36 個 product-like + 3 個 support/compatibility-only**（`adng-memory`, `internship-notes-sites-mirror`, `police-exam-practice`）。沒有操作他人 repository。

本輪有一個新的、可獨立驗證且與 owner 已核定方向一致的研究問題：`prompt-autoresearch` 的 autonomous optimization 將固定 LLM-as-Judge / rubrics 視為 promotion ground truth；現有 #3 處理 sampling variance，但尚未回答「judge 穩定給高分，是否真的代表法律申論品質對 independent legal anchor／SME 也更好」。這不是已證實的 P1/P2 缺陷；外部研究只證明**風險機制存在**，本 repo 尚無 runtime/SME evidence 證明錯誤 champion 已實際發生。

因此本輪建立 **`prompt-autoresearch #6`**：`[Research][Competitive Inspiration][RESEARCH_REQUIRED] Blind legal-anchor audit for LLM-judge validity`。分類保持：

```yaml
issue_quality_version: 2
kind: RESEARCH
severity: NOT_ESTABLISHED
evidence: SOURCE_CONFIRMED + NEEDS_EVIDENCE
decision_priority: HIGH_AFTER_#4
triage: NEEDS_EVIDENCE
auto_implementation: false
```

最小下一步不是「建多 judge framework」，而是重用現有題庫/rubric/run artifacts，做一個不暴露給 mutation loop 的 bounded blind-anchor probe；先用 deterministic known-wrong / known-equivalent counterfactuals，若要宣稱真人法律品質，再加入合格 legal SME blind labels。#4 的 required CI/evidence contract 仍是 production-like paid canary / promotion semantics 變更的硬 blocker；#3 繼續負責 stochastic variance，不重做第二套 noise framework。

**本輪：1 新 Research Issue、0 既有 Issue 更新、0 SKIPPED_LOCKED、0 runtime/SME claim。** 下一個 cold-rotation cursor：`skill-foundry`。

---

## Scope / Repository Truth

### Portfolio enumeration

Owned + unarchived（39）：

`92-duty-scheduler`, `academic-mcp`, `adng-memory`, `ai-flight-radar`, `ai-novel-workstation`, `autodev-ng`, `avatar-vfo`, `cf-ai-router`, `cf-mcp-server`, `chatgpt-dual-pipeline`, `claude-mem`, `clinical-scribe-worker`, `cyber-prep-coach`, `exam-archive`, `flux-image-gen`, `google-maps-personal-mcp`, `herdr-skills`, `internship-notes-sites-mirror`, `lobsterpulse`, `lplrs-judicial-sync`, `MaterialYouNewTab`, `minideck`, `neciken-summer-poem`, `ninax-line-hermes`, `note-filler`, `police-exam-archive`, `police-exam-practice`, `ppt-studio`, `project-doctor-web`, `prompt-autoresearch`, `skill-foundry`, `soundbox-offline`, `spotify-playlist-organizer-mcp`, `taichung-police-intel`, `taiwan-intel-dashboard`, `tick-stock-panel`, `UkePack`, `video-timeline-pipeline`, `voice-actress`.

Archived（排除）：`gemini-deidentifier`, `obsidian-vault`, `openab`。

Support/compatibility-only：`adng-memory`, `internship-notes-sites-mirror`, `police-exam-practice`。

### prompt-autoresearch current product truth

Current default branch：`master`。本輪寫入前重新核對 HEAD：`7677bf5aeef443df0cf3edcf96dfa30d82fc1127`（`docs(audit): add 2026-09-12 product board review`，commit time 2026-09-11T20:09:41Z）。

Owner-approved Product Board direction：**INVEST / SIMPLIFY**。

- 產品應成為可信、local-first 的「臺灣國考申論 prompt research + promotion harness」。
- 核心 moat：vertical legal question/rubric corpus、hard risk gates、prompt lineage、evidence-first promotion。
- 不應擴成 hosted multi-tenant eval SaaS、generic agent observability platform、generic optimizer framework 或 mobile app。
- Board 現行排序：先 #4 恢復可信 CI/evidence contract，再 #3 做 variance-aware / paired repeated evaluation，之後才做 bounded independent legal-SME calibration。

`program.md`（blob `635670b0d28db782b04c3193d2ec9adc2c43d15c`）把 `questions/`、`rubrics/`、`scripts/evaluate.py`、`compare_runs`、`gatekeeper` 定義成固定 ground-truth metric；每代候選走 Gatekeeper → Smoke → Dev → Holdout → promote/revert。`scripts/evaluate.py`（blob `0c4f661ed8cb185576792f11573984d5f1dbd3af`）先用 candidate prompt 生成申論答案，再把題目、key points、rubrics 與 candidate answer 交給固定 MiniMax LLM judge，judge JSON score 直接進 evaluation / promotion evidence。

這證明的是**closed-loop evaluator behavior**，不是「現行 champion 一定錯」。真實 judge-to-SME disagreement / false promotion rate 仍為 UNKNOWN。

### Existing work / dedupe

本輪在建立 #6 前重新搜尋 open/closed Issues、all-state PR、branches、roadmap/audit：

- **#4 P1 RELIABILITY**：required 9-cell CI / best-version evidence contract 紅燈；仍是 release/evidence trust 的第一優先。
- **#3 RESEARCH**：single-run stochastic variance、paired replicates、`INCONCLUSIVE`、holdout isolation；與 #6 的 validity fingerprint 不同。
- **#5 RESEARCH**：prompt bloat / complexity / compaction / Pareto trade-off；與 #6 不重複。
- **#1 / PR #2**：repository contract / offline preflight；open PR #2 為另一 scope。
- `judge / calibration / validity / reward / SME` 關鍵字的 closed Issue 無結果；相關 all-state PR 無結果；`judge` branch search 無結果。
- Product Board roadmap 本身明記 `#4 → #3 → SME canary`，所以 #6 是把已核定第三步縮成可結束研究，不是另造平台。

---

# External Signals

## A. Direct competitor pattern — LangSmith 將 LLM judge 對齊 human labels 做成正式 evaluator workflow

**CONFIRMED；官方 current docs，頁面未暴露精確發布日；查閱 2026-09-15**

Sources:
- https://docs.langchain.com/langsmith/improve-judge-evaluator-feedback
- https://docs.langchain.com/langsmith/annotation-queues
- https://docs.langchain.com/langsmith/evaluation
- https://www.langchain.com/pricing

LangSmith 現行 `Align Evaluator` 流程不是假設 LLM-as-Judge 自己就是 truth，而是：選 runs/experiments → 送 annotation queue → human expert label → 在 evaluator playground 比較 judge 與 human labels → refine evaluator → repeat。Pairwise Annotation Queue 也讓 reviewer 直接對 baseline/candidate 選 A / B / Equal。

### JTBD

當 prompt/model/architecture 變更需要自動化評估時，產品團隊需要知道「judge 是否真的在量想量的 construct」，而不只是 judge 本身輸出的數字是否穩定。

### Manual step removed / workflow improvement

傳統做法要手工匯出 outputs、另開 spreadsheet、找 reviewer、再把 labels 對回 experiment；LangSmith 把 runs → annotation → reference dataset → evaluator alignment 串在同一 workflow。對 Reese-max 可移植的不是 hosted UI，而是**把 independent review 與 evaluator calibration 視為 promotion evidence 的不同層次**。

### Onboarding / distribution

Human review 直接從 dataset/experiment/runs 進 queue；review 結果可再加入 reference dataset。這降低「人工判斷存在，但和實驗版本脫節」的追溯成本。

### AI / provenance pattern

`Application output ≠ Judge score ≠ Human expert label`。同一 run 的 evaluator prompt/version、human label 與 dataset lineage 要能被分開追溯。

### Pricing / business-model signal

LangSmith 2026-09-15 官方 pricing：Developer `$0/seat/month`（1 seat、含最多 5k base traces/月後 pay-as-you-go）、Plus `$39/seat/month`（另有 usage），Enterprise custom。這反映 hosted tracing/annotation/collaboration 本身是持續成本。`prompt-autoresearch` 的 owner direction 是 local-first，因此**不應為了 evaluator alignment 複製一個 hosted annotation product**；最小 blind probe 更符合產品規模。

### Limit / do not copy

LangSmith 建議從 human-labeled examples 建 evaluator，但其文件流程本身不是「人類標籤一定正確」的成效研究，也不證明某個 20-example 起始建議適合臺灣法律申論。不要把 vendor 建議樣本數直接當本 repo gate。

---

## B. Adjacent empirical evidence — closed-loop reference-free judge 可以學到「更有說服力」而不是更正確

**CONFIRMED RESEARCH；發布 2026-07-07；查閱 2026-09-15**

Source: https://arxiv.org/abs/2607.05904

`More Convincing, Not More Correct: Self-Play Reward Hacking of Reference-Free LLM Judges` 研究 reference-free judge 作為 self-play / best-of-N reward 時的 failure mode。作者以 hidden anchor（不給 judge 看）比較「judge 接受」與「真正 correctness」，觀察 optimizer 可以進入 judge 認為 plausible 的 false-positive basin。

### JTBD / manual step

真正的產品問題不是「judge 會不會偶爾隨機」；而是 optimizer 若長期以 judge 當 reward，研究者需要一個**不被 optimizer 看見的 independent anchor**去確認 score gain 是否轉移到真正目標。

### New pattern

可移植模式：

`candidate uplift on visible evaluator → hidden independent anchor → promotion confidence`

而不是：

`visible judge score ↑ → assumed truth ↑`

### Limit / do not copy

論文任務主要是 math/code correctness，不能把其 false-positive 比率或任何數字拿來當臺灣法律申論 KPI；「judge 先自己解題再看 candidate」也是研究中的 mitigation，不代表本 repo 現在應改 judge architecture。先驗證本領域是否重現同類 mismatch。

---

## B2. Domain-adjacent legal evidence — prompt optimization 會受到 judge disposition 影響

**CONFIRMED RESEARCH；發布 2026-04-22（超過 90 天，但法律自由文本市場變動較慢，且與本產品高度代表性）；查閱 2026-09-15**

Source: https://arxiv.org/abs/2604.20726

`Exploiting LLM-as-a-Judge Disposition on Free Text Legal QA via Prompt Optimization` 直接研究 legal free-text QA：不同 judge feedback style 會改變 prompt optimization 的結果與跨 judge transfer，strict judge 的 feedback 可能形成較 judge-specific 的 overfitting。

### Transferable principle

`judge disposition` 是 optimization environment 的一部分，而不是中立量尺。對 `prompt-autoresearch`，固定 rubric + fixed judge 的穩定性即使被 #3 做好，也不代表它對獨立法律品質有 external validity。

### Do not copy

LEXam benchmark、模型、ProTeGi 與其跨 judge 結果不等於臺灣國考申論；不因這篇論文就換 judge、加 ensemble 或改 promotion threshold。

---

## C. Emerging technique — judge calibration assumptions 本身會隨模型世代改變

**CONFIRMED RESEARCH；發布 2026-09-10；查閱 2026-09-15**

Sources:
- https://arxiv.org/abs/2609.10996
- https://arxiv.org/abs/2609.12002

兩個近期訊號值得保留，但都只作研究方向：

1. `Rethinking Verbalized Confidence for LLM-as-a-Judge` 指出 post-2025 proprietary models 上 soft-scoring 的最佳做法可能和較舊模型不同，顯示 judge calibration advice 有「generation effect」。
2. `Can We Trust LLM Judges` 在 absolute scoring 上再次觀察 capability-dependent / leniency bias，並提出 multi-judge calibration 方法。

### Product possibility

把 `judge model/version + judge prompt/rubric hash` 視為 evaluator regime；一旦 evaluator regime 改變，舊 calibration evidence 應視為需要重新確認，而非直接跨版本沿用。

### Why not now

#3 已經會追 model/judge/dataset cohort drift；#6 只需要消費該 provenance，不另造 `JudgeRegistry`。最新研究提出 ensemble 不等於 Reese-max 已有需求，且會放大 token/cost/維護面。

---

## A2. Direct ecosystem change — Promptfoo 強化可客製 grader 與 domain-specific robustness tests

**CONFIRMED current capability；官方 release notes page last updated 2026-09-12；精確個別 feature launch date 未在頁面清楚標示，因此不宣稱其在 9 月 12 日當天發布；查閱 2026-09-15**

Sources:
- https://www.promptfoo.dev/docs/releases/
- https://www.promptfoo.dev/pricing/

Promptfoo current release notes 顯示 plugin-level grader customization、bias suite、domain-specific safety testing、system prompt override testing、token estimates 等能力。這個市場訊號支持「evaluator 必須能對 domain-specific failure 做針對性檢驗」，但不代表 `prompt-autoresearch` 應複製 red-team platform breadth。

Current pricing signal：Community `Free Forever`、本地/自架、core eval features；Enterprise / On-Prem custom。這再次支持 Reese-max 的 local-first vertical differentiation，不需要靠 broad hosted platform feature parity 競爭。

---

# Community Pain / Anecdotal Evidence

全部只標 `COMMUNITY_SIGNAL`，不作發生率或 ROI 推估。

1. **2026-07-12 / r/LLM**：一位使用者描述 LLM judge 對 prompt change 給高分，但 production 有少數 flow regress；其事後歸因包括 judge/version/dataset coverage 不一致。這是單一案例，不能證明 Reese-max 已有同樣事故。  
   Source: https://www.reddit.com/r/LLM/comments/1uu21qu/our_llm_judge_gave_a_prompt_change_a_910_score/
2. **2026-09-07 / r/AIEval**：有人詢問是否能信任 LLM eval score，回覆者描述會定期用 human ratings 做 judge alignment，並在 judge/model 行為漂移後重校。這只作 practitioner hypothesis；對模型廠商行為的推測不採為 confirmed fact。  
   Source: https://www.reddit.com/r/AIEval/comments/1wa0lnx/do_you_trust_your_eval_scores/

可移植 regression hypothesis：
- judge score green 不代表 hidden cohort / independent quality green；
- evaluator model/prompt/rubric 變更後需要 revalidation；
- human/anchor evidence 必須和 exact evaluator regime 綁定。

---

# New Releases / Current Changes

- **2026-09-12 — Promptfoo release notes page updated**：current docs 可見 grader customization、bias/domain safety/system prompt override 等能力；由於頁面沒有對每項能力列精確發布日，本輪只標 current capability，不捏造 launch date。
- **2026-09-10 — two new judge-calibration papers**：一篇聚焦 post-2025 judge soft-scoring compatibility shift；一篇聚焦 absolute-score capability-dependent bias。
- **2026-07-07 — hidden-anchor reward-hacking study**：提供 closed-loop reference-free judge 的直接機制證據。
- **Current — LangSmith evaluator alignment workflow**：官方 docs 明確把 human expert labels → evaluator prompt alignment 當正式流程；頁面未提供發布日，故只記查閱日。

---

# Opportunity Map — prompt-autoresearch

## MUST MATCH

1. **#4 first：可信 evidence/CI baseline**。在 required matrix/evidence contract 還紅時，不把任何新 research result 接進 champion promotion。
2. **#3：stochastic stability / paired repeat / INCONCLUSIVE**。先分清 random noise，避免把一次 judge 波動誤認 validity failure。
3. **Evaluator provenance**：至少能追 exact judge model/provider、judge prompt/rubric hash、dataset/question hash、candidate/baseline prompt hash；現有 evidence primitives 能重用就不建新 registry。

## SHOULD BE BETTER

**將「judge 穩定」與「judge 有效」分開。** 在 autonomous optimization 中，promotion evidence 應能回答：candidate 是否只更符合 visible judge disposition，還是對 hidden legal anchor / SME 也改善。

## DIFFERENTIATOR

`local-first Taiwan legal corpus + hard risk gates + hidden legal anchor / bounded SME calibration + auditable prompt lineage`。這比複製 hosted tracing/annotation 平台更貼合 owner 核定方向。

## ADJACENT IDEA

Evaluator regime change invalidation：judge model/prompt/rubric 改變時，把既有 calibration evidence 標為 needing revalidation。先重用 #3 cohort/hash evidence；只有實際 drift management 不足才另開獨立工作。

## DO NOT COPY

- Generic multi-judge ensemble platform。
- Hosted human annotation/RBAC/billing product。
- Promptfoo 全套 red-team/security plugin breadth。
- 直接把 vendor 建議的樣本數、論文 false-positive rate 或 benchmark improvement 當本 repo gate。
- 因為「另一個 judge 不同意」就把第二個 LLM 當成 human truth。

---

# Four-Gate Issue Quality Review — #6

## 1. Problem / value

**Target user**：prompt researcher、legal-exam content specialist、maintainer/QA。

**Observable repo behavior**：candidate output 是由同一套固定 evaluator/rubric 判定 promotion；judge score 本身是 visible optimization target。

**Manual/decision gap**：研究者能看到 dev/holdout 分數，但不能從 current receipt 判斷「分數上升是 evaluator alignment 還是 independent legal quality」。

**Existing alternative**：#3 能處理 sampling variance；hard risk rules 能擋部分形式化風險；但二者都不提供 independent legal validity anchor。

**Opposing evidence**：目前沒有實際 champion 被 SME 判錯的證據；現有 vertical rubrics / key points 可能已足以讓 judge 在大多數案例表現合理。因此 severity 必須保持 `NOT_ESTABLISHED`。

## 2. Priority

- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=HIGH_AFTER_#4`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`

理由：Product Board 自己把 bounded SME calibration 排在 #4→#3 後的第三步，strategic fit 高；但沒有 runtime/SME mismatch evidence，所以不能升 P1/P2 product defect。

**Opportunity comparison（定性，不用假精準分數）：**
- User Pain：**UNKNOWN-to-Medium**；decision uncertainty 確實存在，但真人/實際 false promotion frequency 未知。
- Strategic Fit：**High**；直接符合 owner-approved roadmap。
- Novelty：**Medium**；市場已有 human-aligned evaluator pattern，但 repo 尚未具備 independent legal anchor evidence。
- Evidence Strength：**High for mechanism / Medium for repo-specific impact**。
- Reuse：**Medium-High**；可重用 questions/rubrics/runs/#3 hashes，不需要新平台。
- Effort：**Low-Medium for deterministic probe; UNKNOWN for qualified SME time**。
- Security/Privacy/Cost：**Low for synthetic/frozen existing corpus; higher/UNKNOWN once human SME or paid provider calls are introduced**。

## 3. Minimum solution

比較順序：

1. **No change / docs warning**：成本最低，但無法判斷 autonomous promotion 是否真的對 judge 過擬合。
2. **重用 existing deterministic checks only**：可先覆蓋已知錯法條/known-equivalent counterfactual，適合作第一階段；若 mismatch 只集中在這些項目，應 NARROW 成局部 gate。
3. **Bounded blind-anchor probe**：本輪通過門檻的最小 research；不用資料庫、registry、服務或新 UI。
4. **Judge ensemble / human annotation system**：沒有必要性證據，拒絕現在建。

## 4. Research / implementation separation

研究必須輸出 `BUILD / NARROW / REJECT`，且 BUILD 只代表「值得下一步產品決策」，**不是**自動取得修改 promotion logic 的授權。沒有 #4可信 baseline、#3 variance separation、exact hashes/runtime receipt 及必要 SME evidence，就保持 `NEEDS_EVIDENCE`。

---

# Minimal Research Design for #6

1. **Freeze evaluator regime**：current judge model/provider + judge prompt/rubrics + question set + candidate/baseline prompt hashes。
2. **Construct blind counterfactuals from existing corpus**：至少涵蓋可判定的高風險類型，而不是追求任意數量配額：
   - semantic/legal substance equivalent、rhetoric/verbosity different；
   - fluent answer with intentionally known-wrong legal fact/citation；
   - legally stronger content with less judge-friendly presentation。
3. **Independent anchor first**：已知錯誤用 deterministic/legal source anchor；只有取得 qualified legal SME blind labels 時，才能談 human alignment。
4. **Separate noise**：若同一 item judge verdict 不穩，交由 #3 的 replicate/cohort logic處理；#6 問的是「即使穩定，是否與 anchor 衝突」。
5. **Exit**：
   - `BUILD`：可重現 judge-aligned but anchor-rejected promotion risk，且有一個局部 mitigation 值得下一階段驗證；
   - `NARROW`：問題只集中在某些 F-code / legal factuality，改成 targeted deterministic/rubric check；
   - `REJECT`：代表性 probe 沒有 meaningful mismatch，或缺可靠 anchor 使結論無法成立。

**NEEDS_RUNTIME_VERIFICATION**：本輪沒有呼叫 MiniMax、沒有執行任何 judge canary、沒有法律 SME blind review，所以不能宣稱 reward hacking 已在 Reese-max repo 發生，也不能宣稱某 mitigation 有效。

---

# Cross-Portfolio Ideas

只有一項值得保留，不湊數：

### Evaluator truth boundary

對任何未來以 LLM score 決定「晉升／發布／評分／回饋」的 Reese-max 產品，統一先問：

`System output ≠ LLM evaluator score ≠ independent domain truth ≠ human approval`

可共用的是**決策原則與 evidence vocabulary**，不是立即建立跨 repo framework。只有實際出現相同根因與重複維護成本後，才評估共用模組。

---

# Rejected Ideas

1. **現在把所有 judge 換成多模型 ensemble** — REJECT NOW。外部研究顯示 ensemble 是研究方向，不是 ground truth；成本與 maintenance 增加，且沒有本 repo mismatch evidence。
2. **建立 JudgeRegistry / Calibration DB** — REJECT NOW。`沒有 registry` 不是根因；現有 hashes/receipts 先夠用。
3. **直接採 LangSmith / hosted annotation** — REJECT NOW。違反 local-first / narrow vertical direction，且 Plus/usage cost 沒有被證明值得。
4. **複製 Promptfoo 全套 red-team features** — REJECT。產品定位不同，會把 vertical legal prompt harness 膨脹成 generic security/eval platform。
5. **把論文 hidden-anchor 成效數字變成 acceptance threshold** — REJECT。跨 task/model/domain 不可直接外推。
6. **只用另一個 LLM judge 交叉驗證並稱 SME validation** — REJECT。它仍是模型判斷，不能冒充 human/legal truth。

---

# Issue Mapping

| Tracking | Status this round | Reason |
|---|---|---|
| `prompt-autoresearch #4` | unchanged / higher priority | existing P1 CI/evidence contract blocker；本輪不改 scope |
| `prompt-autoresearch #3` | unchanged | variance / replicate / holdout isolation；與 validity fingerprint 不同 |
| `prompt-autoresearch #5` | unchanged | complexity/compaction；不與 #6 合併 |
| `prompt-autoresearch #6` | **CREATED + read-back verified** | new bounded judge-validity research；`NOT_ESTABLISHED`, `NEEDS_EVIDENCE`, `auto_implementation=false` |
| PR #2 | unchanged | repository contract/offline preflight；與 #6 無關 |

#6 URL: https://github.com/Reese-max/prompt-autoresearch/issues/6

建立前重新搜尋 open/closed Issue、all-state PR、relevant branch；未找到同 fingerprint。因為是新 Issue 且沒有既有 competing issue/branch/PR 可被搶 scope，本輪沒有修改既有 Issue，也沒有取得既有 Issue lock。

---

# What Changed Since Last Radar

相較 `2026-09-14T235901Z-external-radar.md`：

1. cold rotation 從 `project-doctor-web` 推進到 `prompt-autoresearch`。
2. 新增一個 external mechanism signal：近期 reward-hacking / judge-bias 研究，加上 legal QA judge-disposition evidence，直接映射到 current reference-free closed-loop evaluator。
3. 這不是把 #3 擴大；反而明確切開：`#3 = stochastic reliability`，`#6 = evaluator validity / independent anchor`。
4. 依 Issue Quality v2 將 #6 保持 `severity=NOT_ESTABLISHED`，避免把「外部研究存在」誤升成已證實 product P1/P2。
5. Product Board 原本的 `#4 → #3 → SME canary` 被縮成可結束的 blind-anchor research，不再用「做完整 calibration framework」當預設方案。

---

# Severity / Scope Calibration

- #4：**維持 P1**。已有 current required CI/evidence causality；本輪沒有新證據推翻。
- #3：歷史 issue body 標示 P2 Research，但依 Issue Quality v2 應在下一次有相關狀態更新且沒有 active ownership 時逐步校準為「research urgency 與 defect severity 分離」；本輪沒有更新，避免無新狀態只為格式留言。
- #5：同樣是 Research，不因 92/100 historical heuristic 取得實作權；本輪不更新。
- #6：**NOT_ESTABLISHED**。外部證據夠支持研究，不夠證明實際使用者損害。

---

# Completed / Gaps / Cursor

## Completed

- 重新讀 Issue Quality v2，記 blob SHA。
- 完整列舉 Reese-max owned repositories；排除 archived，不操作他人 repo。
- 讀最新 historical radar，依 cursor 深讀 `prompt-autoresearch`。
- 讀 Product Board / roadmap、current program、LLM-as-Judge implementation、open Issues、all-state PR、relevant branch/dedupe。
- 外部網路覆蓋 A direct competitor、B adjacent empirical/legal evidence、C emerging judge-calibration research；關鍵主張優先第一手官方／論文原始來源。
- 當輪查證 LangSmith / Promptfoo current pricing/capability。
- 建立並讀回驗證 `prompt-autoresearch #6`。
- 沒有修改任何 product code / CI / config / secrets / permissions / settings。

## Gaps / unknowns

- 沒有 runtime MiniMax judge probe；`NEEDS_RUNTIME_VERIFICATION`。
- 沒有法律 SME blind labels；不能宣稱 current judge 與真人一致或不一致。
- 沒有 production deployment / real learner data；不估 false-promotion rate、ROI、學習成效或節省時間。
- LangSmith evaluator alignment docs 未在頁面暴露精確 feature launch date，因此只記 current capability + 查閱日。
- Promptfoo release notes 頁有 2026-09-12 update timestamp，但個別 capability 沒有可靠逐項 launch date；不做假日期映射。

## Next fair-rotation cursor

`skill-foundry`

---

# Sources

## Reese-max repository truth

- Issue Quality v2: https://github.com/Reese-max/autodev-ng/blob/main/docs/portfolio-audit/2026-09-14-issue-quality-v2.md
- Prior radar: https://github.com/Reese-max/autodev-ng/blob/main/docs/competitive-intelligence/2026-09-14T235901Z-external-radar.md
- Product Board audit: https://github.com/Reese-max/prompt-autoresearch/blob/master/.github/quality-audits/2026-09-12-0410-product-board-audit.md
- Program rules: https://github.com/Reese-max/prompt-autoresearch/blob/master/program.md
- Evaluator: https://github.com/Reese-max/prompt-autoresearch/blob/master/scripts/evaluate.py
- #3: https://github.com/Reese-max/prompt-autoresearch/issues/3
- #4: https://github.com/Reese-max/prompt-autoresearch/issues/4
- #5: https://github.com/Reese-max/prompt-autoresearch/issues/5
- #6: https://github.com/Reese-max/prompt-autoresearch/issues/6

## External first-party / primary research

- LangSmith Align Evaluator: https://docs.langchain.com/langsmith/improve-judge-evaluator-feedback
- LangSmith Annotation Queues: https://docs.langchain.com/langsmith/annotation-queues
- LangSmith Evaluation: https://docs.langchain.com/langsmith/evaluation
- LangSmith Pricing: https://www.langchain.com/pricing
- Promptfoo Release Notes: https://www.promptfoo.dev/docs/releases/
- Promptfoo Pricing: https://www.promptfoo.dev/pricing/
- More Convincing, Not More Correct (2026-07-07): https://arxiv.org/abs/2607.05904
- Exploiting LLM-as-a-Judge Disposition on Free Text Legal QA via Prompt Optimization (2026-04-22): https://arxiv.org/abs/2604.20726
- Rethinking Verbalized Confidence for LLM-as-a-Judge (2026-09-10): https://arxiv.org/abs/2609.10996
- Can We Trust LLM Judges (2026-09-10): https://arxiv.org/abs/2609.12002

## Community signals — anecdotal only

- https://www.reddit.com/r/LLM/comments/1uu21qu/our_llm_judge_gave_a_prompt_change_a_910_score/
- https://www.reddit.com/r/AIEval/comments/1wa0lnx/do_you_trust_your_eval_scores/
