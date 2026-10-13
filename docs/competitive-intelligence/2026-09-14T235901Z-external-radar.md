# 外部競品／新品／工作流靈感雷達 — 2026-09-14T23:59:01Z

> 查閱日：2026-09-15（Asia/Taipei）；檔名時間使用 UTC。
>
> Issue Quality：`issue_quality_version: 2`；本輪讀取 `docs/portfolio-audit/2026-09-14-issue-quality-v2.md` blob `8167e10798071d2276addaff6b201c6b0e904a2a`。
>
> Evidence labels：`CONFIRMED`＝第一方產品／官方文件、學術原始來源或可直接檢查的 repository truth；`LIKELY`＝有支持但仍需產品／runtime／真人研究；`COMMUNITY_SIGNAL`＝個別社群經驗；`UNKNOWN`＝資料不足。
>
> 本輪沒有修改任何產品原始碼、CI/config、secret、權限或 repository settings；沒有建立實作 branch、merge/deploy、啟動 worker/run 或新 GOAL；沒有付費試用或變更正式資料。

## Executive Summary

依上一輪 `2026-09-14T220122Z-external-radar.md` 的公平輪巡游標，本輪深讀 `Reese-max/project-doctor-web`。重新列舉 connected GitHub owner listing：**42 個 Reese-max owned repositories，3 archived、39 owned + unarchived**；沿用最新範圍校準為 **36 個 product-like + 3 個 support/compatibility-only**。本輪沒有操作他人 repository。

本輪外部新證據沒有形成新的獨立產品缺口，反而支持「不要繼續把 #11 膨脹」：

1. **SimX Scenario Editor（2026-06-24）**把教育者最常見的人工斷點定義得很清楚：過去要改病人對話、EHR 畫面、learning objectives、assessed competencies，必須丟給 vendor development queue；新產品改成 browser no-code、non-destructive versioning，且可直接與 AI Assistant 共用。這支持 `Case truth / rubric` 應可由教育者審核與版本化，但不代表 Project Doctor 現在就需要完整 authoring suite。
2. **J Gen Intern Med pilot randomized trial（2026-09-03）**對 AI code-status discussion simulation 的結果沒有達統計顯著差異；受試者較重視 deliberate practice／confidence，同時指出 emotional realism 與 feedback 仍需改善。這是很重要的反方：不能把「AI simulation」直接當成已證實學習成效。
3. **2026-09-10 arXiv RCT（N=100）**的 multi-agent clinical interview training 顯示，patient agent + Socratic tutor + turn-level evaluator 的 scaffolding 可改善 final OSCE overall score，最大且較一致的改善落在 communication、empathy、特定 history-taking behaviors；**final diagnostic accuracy 並無顯著差異**。這使 Project Doctor 若日後進入 BUILD，更應把 outcome 放在可觀察的過程技能與 evidence-linked behavior，而不是「診斷更準」。

但 `project-doctor-web #11` 已有 open research PR #13 `devin/issue-11-research`，且仍有兩個 unresolved review threads（compound turns 的 action representation、raw learner text/PHI retention）。依 `github-issue-lock:v1` / active-work coordination，本輪對 #11 記為 **SKIPPED_LOCKED**：不搶 scope、不新增 comment、不重寫 issue。新的研究證據只進本中央 radar。

**本輪：0 新 Issue、0 Issue 更新、1 個 SKIPPED_LOCKED existing research、0 runtime claim。** 下一個 cold-rotation cursor：`prompt-autoresearch`。

---

## Scope / Repository Truth

### Portfolio enumeration

Owned + unarchived（39）：

`92-duty-scheduler`, `academic-mcp`, `adng-memory`, `ai-flight-radar`, `ai-novel-workstation`, `autodev-ng`, `avatar-vfo`, `cf-ai-router`, `cf-mcp-server`, `chatgpt-dual-pipeline`, `claude-mem`, `clinical-scribe-worker`, `cyber-prep-coach`, `exam-archive`, `flux-image-gen`, `google-maps-personal-mcp`, `herdr-skills`, `internship-notes-sites-mirror`, `lobsterpulse`, `lplrs-judicial-sync`, `MaterialYouNewTab`, `minideck`, `neciken-summer-poem`, `ninax-line-hermes`, `note-filler`, `police-exam-archive`, `police-exam-practice`, `ppt-studio`, `project-doctor-web`, `prompt-autoresearch`, `skill-foundry`, `soundbox-offline`, `spotify-playlist-organizer-mcp`, `taichung-police-intel`, `taiwan-intel-dashboard`, `tick-stock-panel`, `UkePack`, `video-timeline-pipeline`, `voice-actress`.

Archived（排除）：`gemini-deidentifier`, `obsidian-vault`, `openab`。

Support/compatibility-only：`adng-memory`, `internship-notes-sites-mirror`, `police-exam-practice`。

### project-doctor-web current truth

Current default-branch HEAD seen this round：`bb2cc69dc202af5575d11eb958bda56a01f7de11`（2026-09-11，audit/docs commit）。Recent product commits include `3a7e83ed012722f5d28b4bc7fb4bddbf98d07579`（durable abuse/cost work）與 `d036be7da410e79127cd8e2e3e54968354acd69c`（malformed output + emergency interception）。

README current scope：
- 研究／教學用 Project Doctor web；不是臨床診療替代品。
- patient background、dynamic interview、PE/Lab/imaging injection、Rolling SOAP。
- strict `<clinical_engine>` / SOAP fail-closed contract。
- deterministic pre/post emergency red-flag interception。
- cost/abuse protection intent + zero-PII aggregate telemetry。
- desktop + responsive mobile UI。

Open product/safety tracking relevant to this round：
- **#11** `CaseSpec + virtual patient + competency feedback/debrief` research opportunity；historical body仍屬 pre-v2 大型 research proposal。
- **#2** durable/shared cost protection 尚未完成 production/runtime evidence。
- **#9** Objective provenance / unobserved normal PE finding。
- **PR #13** open、non-draft，base `main@bb2cc69...`，head `devin/issue-11-research@f54622a...`，research-only CaseSpec/action/rubric design。
- PR #13 目前有 2 個 unresolved review threads：compound learner turn 只能保存一個 `requestedAction`；直接保存 `learnerUtterance` 可能與「no PHI」承諾衝突。

Owner/coordination evidence：#11 comment 已記錄 `devin-loop: research PR opened.`。因此本輪不取得 issue lock、不重寫 scope。

---

## External Signals

### A. Direct competitor update — SimX Scenario Editor 把「等 vendor 改 scenario」變成 browser authoring

**CONFIRMED；發布 2026-06-24；查閱 2026-09-15**

Source: https://www.simxvr.com/blog/vr-scenario-editor/

SimX 說明其 Scenario Editor 針對一個具體 workflow friction：教育者若要改 patient dialogue、institution-specific EHR screenshots、protocols、medications、learning objectives 或 assessed competencies，過去要向 vendor development team 提 request 等待。Scenario Editor 改為 browser-based no-code customization；每次 edit 以 non-destructive version 保存，original scenario 保持 baseline，且修改後 scenario 可直接與 SimX AI Assistant 共用。

**JTBD / manual step removed**：scenario owner 不必把每次課程調整交給工程／vendor 再等待回傳。

**Onboarding/distribution**：browser authoring，不要求教師理解 VR implementation。

**Automation / provenance pattern**：AI interaction surface 與 authored scenario truth 分離；版本歷史保留原 baseline。

**Pricing/business-model signal**：本輪未找到 SimX 對 Scenario Editor 的公開單一使用者價格；不推測成本或採用率。

**Known limits / do not copy**：Project Doctor 沒有已驗證 educator authoring pain，也沒有理由複製 VR、EHR simulator、Pyxis 或完整 institutional customization platform。可移植的是「教育者擁有 scenario truth + versioning」，不是 product breadth。

### B. Adjacent empirical evidence — AI simulation 的價值可能在 deliberate practice，效果仍需真人驗證

**CONFIRMED；J Gen Intern Med ahead-of-print 2026-09-03；查閱 2026-09-15**

Source: https://pubmed.ncbi.nlm.nih.gov/42690594/
DOI: 10.1007/s11606-026-10761-4

Pilot randomized trial 研究 code-status discussion training：31/41 residents enrolled、25 completed。Intervention 是 lecture 後 1 小時 supervised ChatMD practice + faculty debriefing，再 1 小時 independent practice；約八週後做 blinded standardized-patient encounter。

報告中的 intervention/control differences **未達統計顯著**（例如 overall 72.5% vs 66.0%, p=0.35；CSD-specific 71.4% vs 57.6%, p=0.15）。質性回饋指出 deliberate practice / confidence 有價值，但 emotional realism 與 feedback 仍需改善。

**Transferable principle**：對 Project Doctor，不能拿 vendor demo、模型評分或小型合成 fixture 宣稱學習成效。若日後做真人研究，需把 `practice exposure`、`faculty/debrief contribution`、`delayed transfer task` 分開。

**Do not copy**：不把「AI roleplay + feedback」自動當有效 intervention；尤其這項研究包含 supervised practice 與 faculty debrief，不能把結果全部歸因給 chatbot。

### C. Emerging technique — Socratic tutor / turn-level evaluator 的 multi-agent scaffolding，改善的是過程技能而非診斷準確率

**CONFIRMED RESEARCH；arXiv 2026-09-10；查閱 2026-09-15**

Source: https://arxiv.org/abs/2609.10939

`Evaluating Scaffolding-Oriented Multi-Agent Large Language Model System for Clinical Interview Training` 報告 randomized study（N=100 medical students）。System 包含：
- patient agent：模擬病人對話；
- tutor agent：提供 Socratic prompts，但不揭露 diagnosis；
- turn-level evaluator：監測 clinical progress，不直接給 summative score。

研究摘要報告 final exam overall performance 較 control 好；最一致改善集中在 communication、empathy、特定 history-taking behaviors；**final diagnostic accuracy 沒有顯著差異**。

**New product possibility**：如果 #11 的 CaseSpec/replay research 之後成立，可再研究 `optional, bounded, non-answer-revealing scaffolding`，例如 learner 卡住時只提醒「還有哪個 history domain 沒探索」而不是告知 diagnosis/next answer。

**Why not now**：目前 Project Doctor 尚未有 accepted CaseSpec runtime；PR #13 自己仍有 action-model 與 PHI review blockers。先加 tutor/evaluator 只會增加 calls、成本、privacy surface 與 rubric ambiguity。這是 `ADJACENT IDEA / NEEDS_EVIDENCE`，不是新 feature issue。

**Evidence caveat**：arXiv preprint + single study 不等同已證實跨族群教育成效；不能把 N=100 或該 study score 直接轉成 Reese-max KPI。

---

## New Releases / Current Changes

- **2026-09-10 — clinical interview multi-agent scaffolding RCT preprint**：新增較直接的人體研究訊號；process skills 改善比 diagnostic accuracy 更明顯。
- **2026-09-03 — AI code-status discussion pilot RCT**：結果方向正向但未達統計顯著，並明確暴露 emotional realism / feedback 弱點。
- **2026-08-27 — SimX autonomous nursing curricula**：SimX 把 autonomous simulation package 擴至 nursing education；支持 self-directed repeatable simulation 是競品主軸，但不是 Reese-max 應複製的 VR breadth。Source: https://www.simxvr.com/press-releases/simx-launches-autonomous-nursing-curricula/
- **2026-06-24 — SimX Scenario Editor**：browser no-code scenario customization + versioning。

---

## Current Pricing / Business-model Signals

**CONFIRMED；查閱 2026-09-15**

Geeky Medics 目前把 AI features 做成可計量 credits：
- 100 credits £6.99；250 credits £15.99；1000 credits £59.99。
- AI credits 可用 virtual patient consultation、AI examiner feedback、custom OSCE generation 等。
- OSCE station generation：free account 5 次、相關 subscription 25 次 free generations；之後 3 credits / generation，且 daily cap 10。
- Virtual examiner 文件指出 personal station 上的 AI marking / examiner feedback 各消耗 credit。

Sources:
- https://app.geekymedics.com/purchase/ai-credits/
- https://support.geekymedics.com/en/article/how-do-i-create-and-share-osce-stations-12tydyj/
- https://support.geekymedics.com/en/article/how-do-i-use-the-virtual-examiner-1glbo3s/

**Signal, not recommendation**：multi-agent / evaluator calls 是產品成本，不是免費 abstraction。Project Doctor 已有 #2 cost-protection work；不應為「tutor + evaluator」再開一張成本 framework issue。任何未來 scaffolding experiment 都應先量 primary patient call、tutor call、evaluator call 分別成本，且 cost gate 失效時 fail safe。

---

## Community Pain / Anecdotal Evidence

全部僅標 `COMMUNITY_SIGNAL`，不作發生率：

1. **2026-09-08**：一位 AI patient builder 認為模型會「過度幫忙」，自動洩露完整 history / risk factors，反而讓 learner 不需要真正問診。這支持 patient agent 必須遵守 reveal boundary，但來源為產品作者自述，不是獨立驗證。
   - https://www.reddit.com/r/u_Beginning_Room_1648/comments/1walwjp/something_interesting_we_learned_while_building/
2. **2026-09-02**：一位 PGY-1 communication practice builder 把核心工作定義為低風險反覆 roleplay、犯錯、feedback、retry，而不是診斷 automation。這與近期 RCT 對 communication/process skills 的訊號方向一致，但仍是 builder 自述。
   - https://www.reddit.com/r/InternalMedicine/comments/1w5ly5f/looking_for_feedback_on_a_free_pgy1_communication/
3. **2026-02-11（較舊但高相關）**：一位 medical student 抱怨 AI simulated patient 對 dictation 誤辨、無法 edit、需要 exact wording 才認得檢查項目，feedback 因輸入理解錯而失真。這不是發生率，但應作 future regression fixture：`input recognition failure ≠ learner clinical failure`。
   - https://www.reddit.com/r/medicalschool/comments/1r1kjxm/ai_simulated_patient_cases_are_stupid/

---

## Opportunity Map — project-doctor-web

### MUST MATCH

- `Scenario/educator truth ≠ model improvisation`：未定義 clinical fact 必須維持 unknown/not assessed。
- 嚴格 emergency boundary、malformed-output fail closed、cost boundary 不因教育 feature 被繞過。
- 任何 accepted feedback/rubric 必須能回指 observable learner action 或 case fact；不把模型印象分當 ground truth。
- synthetic-first；真實 PHI 不因 replay/debrief 被默認永久保存。

### SHOULD BE BETTER

- 若 CaseSpec 研究通過，先把 learner process 拆成可觀察行為：history domains、requested tests/exams、critical communication behaviors，再談總分。
- 讓「未辨識 learner action / speech error」與「learner 沒做到」成為不同 disposition，避免輸入錯誤被誤評成臨床能力不足。
- 對 evaluator/judge 明示 `CANNOT_SCORE / INSUFFICIENT_EVIDENCE`，不要為了完整報表硬下結論。

### DIFFERENTIATOR

- `Case truth → learner action → exact evidence → feedback` 的 traceability，重點放在**為何扣分／哪個行為缺失**，而不是更像真人的 avatar。
- 如果未來測 scaffolding，限定為 Socratic / process hint，且明示「提示是否被使用」，避免把 tutor 暗示造成的答案提升誤算為 learner competence。

### ADJACENT IDEA

- **Bounded Socratic tutor**：只在 accepted CaseSpec + action extraction 成立後做小型 synthetic experiment；問題是「不洩露答案的 turn-level hint 是否能降低無效卡住，而不提高 unsupported-fact / cost / privacy risk」。
- **Educator local edit/versioning**：先用 versioned JSON/form 或 source file 即可；只有真實 educator evidence 顯示修改 friction 才考慮 richer no-code editor。

### DO NOT COPY

- SimX 的 VR、3D physiology、institutional EHR/Pyxis breadth。
- 900+ AI patients / 大量 AI-generated case library 作為成功指標。
- 診斷自動化、真病患資料、EHR write-back、clinical decision authority。
- voice/video/avatar 先於 case truth、action parsing、feedback evidence 的驗證。
- 以 AI tutor 自己的 score 當 learner competence certification。

---

## Candidate Evaluation under Issue Quality v2

### Candidate 1 — Bounded in-simulation Socratic scaffolding

- `kind`: OPPORTUNITY / possible future RESEARCH
- `severity`: NOT_ESTABLISHED
- `decision_priority`: LOW–MEDIUM
- `triage`: NEEDS_EVIDENCE
- `auto_implementation`: false
- User Pain：**UNKNOWN**。repo 沒有 accepted CaseSpec runtime，也沒有真人 learner evidence 顯示「卡住時缺即時提示」是 top friction。
- Strategic Fit：中高，但只在 #11 基礎 research 成立後。
- Novelty：中；市場/研究已有 tutoring agent。
- Evidence Strength：中高；N=100 randomized preprint，但單一研究且未證明 diagnosis improvement。
- Reuse：中；可重用 future action/rubric evidence。
- Effort：中；額外 agent + prompt + turn policy + UI state。
- Security/Privacy/Cost：中高；多一個 agent 讀 transcript、增加 calls、可能洩露答案或 PHI。

**反方**：目前最小方案不是增加 tutor，而是讓 case truth/action/debrief 先可用；如果 learner 可從 end-of-case debrief + retry 得到同樣價值，即時 tutor 是不必要複雜度。

**Gate**：不開 Issue。待 #11 active PR 結束後，若 owner 仍選擇 BUILD CaseSpec simulator，再以 1–2 個 synthetic cases 比較 `no hint` vs `Socratic process hint`，退出條件必須是 BUILD / NARROW / REJECT。

### Candidate 2 — Full no-code scenario editor

- `kind`: OPPORTUNITY
- `severity`: NOT_ESTABLISHED
- `triage`: DEFERRED
- User Pain：UNKNOWN；目前沒有 educator authoring workflow/user evidence。
- Smaller alternative：versioned JSON/form + fixture review 已足以做 research。

**Gate**：REJECT NOW / 不開 Issue。只有 educator 真實修改頻率與 vendor/dev handoff friction 被觀察到，才重新評估。

### Candidate 3 — Separate tutor/evaluator cost accounting

有合理產品原理，但目前根因已被 #2 的 cost/shared limiter 工作覆蓋，且未來 multi-agent 還沒有被批准。**Duplicate/early abstraction**；不開 Issue。

---

## Scope / Severity Calibration

### #11 historical research body

`#11` 的舊 metadata/內容以 pre-Issue-Quality-v2 方式寫成「P1 Research」且一次包 CaseSpec、ledger、rubric、debrief、replay、authoring。依 v2，競品與學術證據只能證明 opportunity/research value，**不能證明產品已有 P1 defect**。合理的未來 calibration 應是：

- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`

並把研究問題縮成可結束的 decision，而不是把整套 architecture 當 Acceptance Criteria。

**本輪沒有實際改 #11**，因為 PR #13 正在 active research scope，而且 unresolved review threads 表示實作者仍在處理同一工作。依協調規則：`SKIPPED_LOCKED`。等 active work 結束後再做漸進校準，避免把 scope 從外部雷達強行改掉。

### Safety findings remain separate

#2/#9 的安全與 provenance 因果鏈仍是獨立 findings；本輪沒有用「教育產品機會」降級、關閉或宣稱修復。PR/README/測試描述也不等於 production/provider runtime 驗證。

---

## Cross-Portfolio Ideas

### 1. Process-skill feedback > answer-only scoring（research pattern）

可供 `cyber-prep-coach`, `police-exam-archive`, `voice-actress`, `UkePack` 後續研究參考：若學習任務本身包含**過程技能**，feedback 應區分「最後答案」與「過程行為」。但各 repo 必須各自證明 workflow pain；不建立 umbrella framework Issue。

### 2. AI judge/tutor calls are billable work

任何 future multi-agent education workflow 都應把 primary execution、tutor、evaluator 成本分開量測。已有各 repo cost controls 時優先重用，不先建 portfolio-wide registry。

---

## Ideas Rejected / Deferred

- **Full VR / avatar / physiology engine** — 與現有 web teaching scope不符、維護成本高，沒有 repo-specific user evidence。
- **大量 AI auto-generated cases** — authoring volume 不是當前已證實 bottleneck；case quality/provenance 先於數量。
- **Voice/video first** — recent community evidence反而顯示 speech recognition failure可污染評分；先不把 voice realism 當 differentiation。
- **Autonomous diagnosis / clinical assistant expansion** — README 明確定位 research/teaching，且 current safety work尚未完成 runtime evidence。
- **New scaffolding Issue now** — #11 active research PR 已占用同一產品面；先完成/評估 existing research，避免 scope creep。

---

## Issue Mapping

| Repo | Fingerprint | Action | Reason |
|---|---|---|---|
| `project-doctor-web` | open-ended teaching flow → bounded case truth / rubric / debrief | `#11 SKIPPED_LOCKED` | open PR #13 `devin/issue-11-research`; 2 unresolved review threads; no scope takeover |
| `project-doctor-web` | shared cost/abuse protection | no change | #2 already owns root cause; multi-agent cost is future dependent signal |
| `project-doctor-web` | unobserved objective provenance | no change | #9 already owns root cause; no new regression claimed |
| `project-doctor-web` | in-run Socratic tutor | radar only | NEEDS_EVIDENCE; no accepted CaseSpec runtime or user pain yet |

**Issue writes this round：0。** No lock comment written because no issue mutation was attempted.

---

## Sources

First-party / academic:
- SimX Scenario Editor — 2026-06-24 — https://www.simxvr.com/blog/vr-scenario-editor/
- SimX Autonomous Nursing Curricula — 2026-08-27 — https://www.simxvr.com/press-releases/simx-launches-autonomous-nursing-curricula/
- SimX Autonomous Simulation — current — https://www.simxvr.com/platform/autonomous-simulation/
- PubMed / J Gen Intern Med pilot RCT — 2026-09-03 — https://pubmed.ncbi.nlm.nih.gov/42690594/
- arXiv 2609.10939 — 2026-09-10 — https://arxiv.org/abs/2609.10939
- Geeky Medics AI Credits — current — https://app.geekymedics.com/purchase/ai-credits/
- Geeky Medics OSCE station authoring — current, checked 2026-09-15 — https://support.geekymedics.com/en/article/how-do-i-create-and-share-osce-stations-12tydyj/
- Geeky Medics Virtual Examiner — current, checked 2026-09-15 — https://support.geekymedics.com/en/article/how-do-i-use-the-virtual-examiner-1glbo3s/

Community / anecdotal only:
- https://www.reddit.com/r/u_Beginning_Room_1648/comments/1walwjp/something_interesting_we_learned_while_building/
- https://www.reddit.com/r/InternalMedicine/comments/1w5ly5f/looking_for_feedback_on_a_free_pgy1_communication/
- https://www.reddit.com/r/medicalschool/comments/1r1kjxm/ai_simulated_patient_cases_are_stupid/

Repository truth:
- https://github.com/Reese-max/project-doctor-web
- https://github.com/Reese-max/project-doctor-web/issues/11
- https://github.com/Reese-max/project-doctor-web/pull/13
- https://github.com/Reese-max/autodev-ng/blob/main/docs/portfolio-audit/2026-09-14-issue-quality-v2.md

---

## What Changed Since Last Radar

Compared with `2026-09-14T220122Z-external-radar.md`:

1. cold-rotation moved `ppt-studio → project-doctor-web`；next cursor=`prompt-autoresearch`。
2. 新增兩個較直接的人體研究訊號：2026-09-03 pilot RCT + 2026-09-10 N=100 multi-agent clinical interview RCT preprint。
3. Product hypothesis 被**縮窄**：如果未來 #11 進 BUILD，優先測 communication/history-taking/process quality，不把 diagnostic accuracy 當唯一或主要成功指標。
4. 沒有新建 scaffolding/editor Issue；Scenario Editor 只證明 versioned educator control 是成熟 pattern，未證明本 repo 的 educator-authoring pain。
5. #11 因 active PR #13 + unresolved review threads 標 `SKIPPED_LOCKED`，沒有 scope rewrite。
6. 歷史 `P1 Research` 應在 active work 結束後依 Issue Quality v2 校準為 `RESEARCH / NOT_ESTABLISHED / NEEDS_EVIDENCE`；本輪只記中央 report，不干預實作者。

---

## Unfinished / Runtime Verification

- 沒有執行 Project Doctor runtime、provider、deployed Cloudflare、真人 learner 或 faculty study；不得宣稱 simulation efficacy、provider safety 或 deployment readiness。
- 未驗證 voice/video/speech recognition；社群案例只能形成 regression hypothesis。
- 未驗證 SimX/Geeky Medics marketing claims 的效果數字；只採功能／流程／價格本身為市場訊號。
- PR #13 unresolved review threads 仍需其既有實作者處理；本輪未介入。
- 下一輪公平輪巡游標：`prompt-autoresearch`。
