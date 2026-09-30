# 外部競品／新品／工作流靈感雷達 — 2026-09-14T12:03:20Z

> 查閱日：2026-09-14。主要市場證據來自 GitHub 之外公開網路；Reese-max GitHub 僅用於實際 repo 列舉、產品範圍、default-branch 現況、Issue/PR/lock 去重與本報告落地。
>
> Issue Quality：`issue_quality_version: 2`；來源 `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`；本輪讀取 blob `8167e10798071d2276addaff6b201c6b0e904a2a`。
>
> Evidence labels：`CONFIRMED` = 第一方官方資料或可直接檢查 repo truth；`LIKELY` = 有支持但仍需 runtime／真人證據；`COMMUNITY_SIGNAL` = 個別社群經驗；`UNKNOWN` = 資料不足。
>
> Safety：本輪沒有修改產品原始碼、CI/config、secret、權限或 repository settings；沒有建立實作 branch、merge、deploy、啟動 worker/run 或新 GOAL；沒有付費試用或變更正式資料。唯一產品 Issue 寫入是對既有 `skill-foundry #4` 補充新外部證據並縮小下一個研究問題，且完整取得／釋放 `github-issue-lock:v1`。

---

## Executive Summary

本輪**沒有建立新 Issue**。最有價值的新訊號不是「再做一個 Skill registry／installer」，而是 Microsoft Agent Framework 已在 2026-07-28 提供 **從 MCP server 按需 discovery/load Agent Skills** 的實際產品路徑。這個訊號直接對應 `skill-foundry #4` 原本追蹤的「跨 Agent 分發仍靠複製／安裝」摩擦，但同時讓原 Issue 的大型 `TargetSkillAdapter + install/update/drift/rollback` 解法變得不再是第一個合理步驟。

本輪因此依 Issue Quality v2 **縮小 #4 的下一個研究問題**：先用一個既有 certified synthetic Skill，透過本機／隔離 MCP `skill://index.json + skill-md` 提供 read-only discovery/fetch，驗證一個相容 client 是否真的消除人工 copy/redeploy，且是否能在使用前驗證 exact certified tree hash。只有這個最小實驗證明價值，才考慮後續 distribution adapter。狀態重新校準為：

- `kind: RESEARCH`
- `severity: NOT_ESTABLISHED`
- `triage: NEEDS_EVIDENCE`
- `auto_implementation: false`

這是**縮 scope**，不是把新 MCP 功能包裝成高優先 feature。

另外兩個值得保留但不立案的訊號：

1. **Pitch 2026-08-12 MCP/API**：讓 Claude 從 call notes／CRM context 直接建立 Pitch deck，再回到 Pitch canonical editor 繼續修改。這支持 `ppt-studio` 未來把「外部 Agent = authoring/distribution surface；PPT Studio = canonical deck/editor/export truth」當相鄰方向，但目前 repo 已有 OpenAPI、URL/PDF/Markdown/JSON import，沒有 repo/user evidence 證明必須再加 MCP/Slack/CRM connector，因此只留 `ADJACENT IDEA / NEEDS_EVIDENCE`。
2. **Geeky Medics 2026-09-08 virtual-patient / AI OSCE authoring** 與 **Simnest 2026-09-01 evidence-linked debrief**：都支持 `project-doctor-web #11` 的 CaseSpec + transcript/evidence debrief 方向；但 #11 已有 active research PR #13，因此 `SKIPPED_LOCKED`，本輪不補 Issue、不擴 voice/video/avatar scope，只記中央 radar。

本輪真正新增的 portfolio 原則：

> **Remote discovery can remove copy/deploy friction, but `DISCOVERED ≠ CERTIFIED ≠ ACTIVE ≠ AUTHORIZED ≠ INVOKED`.**
>
> 如果 provider／MCP server 可以隨時更新 Skill，對 Evidence-Gated Foundry 反而必須比普通「自動更新」更保守：先驗 exact revision/hash，再決定是否允許使用；不能讓「中央更新比較方便」破壞 certification identity。

---

# 1. Repo enumeration / scope / fair rotation

## 1.1 實際 owner repo 列舉

本輪重新呼叫 owner affiliation repository listing，沒有直接沿用上一份 35/36 products 清單。

- Reese-max owned repos：**42**
- archived：**3**（`gemini-deidentifier`, `obsidian-vault`, `openab`）
- owned + unarchived：**39**

實際未封存名稱如下：

`92-duty-scheduler`, `academic-mcp`, `adng-memory`, `ai-flight-radar`, `ai-novel-workstation`, `autodev-ng`, `avatar-vfo`, `cf-ai-router`, `cf-mcp-server`, `chatgpt-dual-pipeline`, `claude-mem`, `clinical-scribe-worker`, `cyber-prep-coach`, `exam-archive`, `flux-image-gen`, `google-maps-personal-mcp`, `herdr-skills`, `internship-notes-sites-mirror`, `lobsterpulse`, `lplrs-judicial-sync`, `MaterialYouNewTab`, `minideck`, `neciken-summer-poem`, `ninax-line-hermes`, `note-filler`, `police-exam-archive`, `police-exam-practice`, `ppt-studio`, `project-doctor-web`, `prompt-autoresearch`, `skill-foundry`, `soundbox-offline`, `spotify-playlist-organizer-mcp`, `taichung-police-intel`, `taiwan-intel-dashboard`, `tick-stock-panel`, `UkePack`, `video-timeline-pipeline`, `voice-actress`。

### Scope calibration

上一輪報告的 product-like 清單含 `flux-router`, `lobster-cooker`, `skill-versioner`, `ninax-stock-panel`, `Ai-avatar-memory_backend` 等目前 owner listing 中不存在的名稱；本輪**不推定**它們與 `flux-image-gen`, `lobsterpulse`, `skill-foundry`, `ninax-line-hermes`, `avatar-vfo` 是一對一 rename，也不以舊名稱繼續開功能單。這些實際 repo 會在公平輪巡到達時重新讀產品北極星再分類。

已知可排除：
- `adng-memory`：coordination/support state；不當終端產品灌功能。
- `internship-notes-sites-mirror`：mirror/support artifact。
- `police-exam-practice`：上一輪已由 README 證實只是 `police-exam-archive` 舊網址 compatibility redirect。
- `google-maps-personal-mcp`：仍保留 `UNKNOWN`，在未讀到足夠產品 truth 前不因 repo 名稱推需求。

因此本輪不宣稱「39 個未封存 = 39 個產品」，也不重複上一輪的 stale product count。

## 1.2 Fair rotation

上一輪游標：`ppt-studio`。

本輪深讀 cohort：
1. `ppt-studio`
2. `project-doctor-web`
3. `prompt-autoresearch`
4. `skill-foundry`
5. `soundbox-offline`

下一輪游標：`spotify-playlist-organizer-mcp`（其後依實際 owner listing 向後輪巡；若同 repo 近期已高頻處理，先做 lightweight dedupe，再移到下一個尚未深讀產品）。

這輪沒有假裝已對所有 39 個未封存 repo 做相同深度的外部市場研究。

---

# 2. Quality rules / current product truth

## 2.1 Issue Quality v2 applied

本輪立案／更新前都使用以下 Gate：
- 先證明使用者工作斷點，不把「缺 framework/ledger/registry」當根因；
- 先比較不改程式、文件、重用、局部改動，再考慮新模組／服務；
- RESEARCH 預設 `NEEDS_EVIDENCE/NEEDS_REVIEW`，不是 worker implementation authorization；
- severity 與 research interest 分開；競品做了某功能不等於本產品 P1；
- synthetic personas/董事會不是獨立市場驗證；
- runtime 未跑就保留 `NEEDS_RUNTIME_VERIFICATION`；
- 允許 0 新 Issue；本輪實際為 0。

## 2.2 `ppt-studio`

Current default head：`6a0dbddf1f81843dea303db49ba7e528d4ef189c`（2026-09-14 audit commit）。

已核定方向（product-board audit）：
> 「可在本機生成、審核、局部修改並匯出為可繼續編輯 PPTX 的個人 AI 簡報工作台」，不是另一個多人協作 SaaS。

目前 repo 已有：
- topic / JSON / Markdown / URL / PDF → deck；
- structured brief builder + 本機 draft restore；
- slide editor、search/reorder、single-slide AI preview/diff；
- presenter/speaker view、share link/QR；
- brand profile、image generation；
- PPTX / JSON / Markdown export；
- OpenAPI docs。

Open #5 已追蹤四種既有 layout 的 stable object / bounded patch / render-export verification；2026-09-14 product-board 剛更新同 fingerprint 且已釋放 lock。外部新訊號若只是再次證明 native editability，不重貼 #5。

## 2.3 `project-doctor-web`

Current default head：`bb2cc69dc202af5575d11eb958bda56a01f7de11`（2026-09-11 audit commit）。

產品明確是研究／教學用途的動態問診 + Rolling SOAP；不取代臨床診療。現有 #11 已把產品方向研究收斂到 CaseSpec 驅動的 virtual patient + evidence-linked rubric/debrief。

**Coordination:** #11 有 active PR #13 `devin/issue-11-research`；Issue comment 明示 `devin-loop: research PR opened.`。因此本輪任何同 fingerprint 外部訊號都 `SKIPPED_LOCKED`，只放中央報告。

同時 #2/#9 仍是 durable cost protection / unobserved Objective provenance 的高優先 reliability boundary；不以競品 voice/video feature 蓋過。

## 2.4 `prompt-autoresearch`

Current default head：`7677bf5aeef443df0cf3edcf96dfa30d82fc1127`（2026-09-11 audit commit）。

Root 無 README，產品契約目前散在 `program.md`、`auto_evolve.py`、`route_evolve.py`、UI/config/docs；#1 已追蹤 repository contract。既有：
- #3 variance-aware repeated evaluation / stability gate；
- #4 required CI/best-version evidence red gate；
- #5 Pareto complexity / compaction research。

近期 prompt bloat / stability 外部研究已在前幾輪納入 #3/#5；本輪沒有新的 repo-specific workflow gap 足以再開單。`#4` baseline gate 在任何 promotion semantics 研究前仍優先。

## 2.5 `skill-foundry`

Current default head：`d74d0c2616d981a7762fc1a7c5662486d2bcaa2a`（2026-09-13 audit commit）；最近產品功能 head 包含 2026-09-11 goal autopilot。

核心產品不是「產生更多 Skills」，而是 Evidence-Gated Foundry：Candidate isolation、paired eval、Waza/SkillEvaluator/Promptfoo、exact tree hash、attestation、deterministic Promotion。

Open research：
- #1 target runtime compatibility（active PR #2 / branch `github-1-runtime-compatibility`）；
- #3 package supply-chain security；
- #4 certified distribution/install receipt；
- #5 demonstration-to-skill intake；
- #6 deterministic CI gate。

#4 在本輪前 comments 為空；branches 只有 `main` 與 #1 branch；recent PR 只有 #1 PR #2。沒有同 #4 fingerprint active PR/branch/lock，因此可以依 v2 做一次窄幅 scope calibration。

## 2.6 `soundbox-offline`

Current default head：`68d8137b77be063cc5ae5468e9e31b81455060a9`（2026-09-11 audit commit）；最新產品 fix `44c22cc...` 已落 whole-library backup / fail-closed restore / audio re-pairing。

定位：手機優先、local-first、音訊只進 IndexedDB、無帳號、無雲端音樂 backend。

既有：
- #3 same-LAN QR/browser direct import；
- #4 default-branch CI 應執行 product regression；
- #1 backup/restore 已有 default-branch實作 evidence。

Plexamp 4.50.3 Offline Mode（9/1）上一輪 radar 已記錄，因此本輪視為**deduped signal**，不再製造 Issue 或通知。

---

# 3. External Signals

## A. Direct competitor / same-job updates

### A1. Pitch：MCP + API 把 external assistant 變成 deck authoring surface

**CONFIRMED — 2026-08-12；查閱 2026-09-14**

Sources:
- https://pitch.com/whats-new/introducing-pitch-mcp-and-api
- https://help.pitch.com/en/articles/16220369-create-presentations-with-claude （2026-08-10）
- https://help.pitch.com/en/articles/14981091-pitch-agent （current docs checked 2026-09-14）

Pitch 已讓 Claude 使用 call notes、CRM records、template context 建立 deck；結果保存到 Pitch，使用者可從 Claude 取得 link 回到 Pitch editor，部分 edits 也可繼續由 Claude 觸發。Pitch Agent 本身仍以 action credits 計量，workspace 可設 monthly AI-credit budget。

**JTBD**：使用者的素材原本就在會議記錄／CRM／assistant context，不想先 copy 到 presentation app 再重建 prompt。

**減少人工步驟**：`external context → copy/paste → open deck app → restate intent → generate` 變成 `assistant context → domain action → canonical deck link → editor takeover`。

**Onboarding / distribution**：Agent/Claude 是入口；Pitch 仍擁有 canonical artifact/editor。這比「把完整 editor 搬進 assistant」更小。

**Automation/integration pattern**：外部 Agent 只提出 bounded domain action；deck 仍在 presentation product 中保存/編輯。

**Pricing signal**：AI action credits + workspace monthly budget 表示「Agent action 有成本且應可控」。這不是效果證據，也未用來推估 Reese-max 價格。

**限制**：Pitch 是 hosted workspace；其 CRM/Claude connector breadth 不符合 PPT Studio 的 local-first north star。

**For PPT Studio**：`ADJACENT IDEA / NEEDS_EVIDENCE`。PPT Studio 已有 OpenAPI 與多種 import path；目前沒有使用者證據顯示 MCP connector 比現有 URL/PDF/Markdown/JSON import 更值得優先。先不開 Issue。

---

### A2. Geeky Medics：virtual patient 從「能聊天」擴到 station authoring + voice/video practice

**CONFIRMED — 2026-09-08；查閱 2026-09-14**

Sources:
- https://geekymedics.com/practise-history-taking-with-ai-virtual-patients/
- https://geekymedics.com/generate-osce-stations-with-ai/
- https://support.geekymedics.com/en/article/how-do-i-create-and-share-osce-stations-12tydyj/ （updated 2026-09-04）

目前產品把兩端連起來：
- educator/learner 可以生成 history-taking / counselling / examination station；
- station 保存到 personal library，可編輯／分享；
- patient script 驅動 virtual-patient mode；
- history/counselling 可用即時 voice，另有 video avatar；
- support doc 顯示 Free 5 次生成、含 OSCE plan 25 次，超過後每次 3 AI credits，且 daily cap 10。

**JTBD**：沒有真人同伴時仍能反覆練 OSCE；作者不用從空白手寫完整 station skeleton。

**減少人工步驟**：case authoring → saved library → practice mode 在同一產品閉環；不必另把 script 搬到聊天機器人。

**Pricing/business signal**：對「AI case generation」設 allowance/credit/day cap，而不是無限生成。這是 cost/abuse design signal，不證明教學效果。

**限制**：官方產品頁證明功能存在，但不證明 AI feedback 一致或教育成效；voice/video 模態也會增加成本與錯誤面。

**For Project Doctor**：與 #11 `CaseSpec → controlled virtual patient → debrief` 同 fingerprint。因 #11 active PR #13，`SKIPPED_LOCKED`。新證據反而支持**不要在現在擴 voice/video/avatar**：先驗 case truth / debrief value，再決定 modality。

---

# 4. Adjacent Ideas

## B1. Simnest + AviatePro：AI 不取代 instructor，而是建立 source/timestamp-linked debrief evidence layer

**CONFIRMED — 2026-09-01；查閱 2026-09-14**

First-party source:
- https://simnest.com/articles/simnest_group_and_aviate_pro_expand_collaboration

Simvidence 把 simulator video、multichannel audio、speech、session events、observable human-performance signals 同步成 source- and timestamp-traceable evidence；AI 用於找 reviewable moments，但原始脈絡可回看，且官方明確把 instructor judgment 保留在中心。技術合作甚至偏好以 read-only 方式接 simulator telemetry / aircraft state。

**可移植核心**：
`Raw Event/Transcript → timestamp/source-linked observation → AI surfacing → human debrief judgment`

而不是：
`Raw session → LLM total score → authoritative learner verdict`

**對 portfolio**：
- `project-doctor-web #11`：debrief/rubric evidence 應回指 transcript/action/fact，而不是模型總分；已在 scope，故不重開。
- `UkePack #9`：未來若做 practice feedback，優先 section/time-linked evidence；目前 #9 仍只驗 section-linked practice，不擴成 AI tutor。
- `cyber-prep-coach` / `police-exam-archive`：若日後做 coaching，錯題／作答事件比「AI 覺得你弱」更適合當 canonical evidence。

**Do not copy**：航空 multimodal stack、simulator telemetry、commercial deployment scale 與 human-factors inference 不是 Reese-max 現階段必要範圍。

---

# 5. Emerging Tools / Technologies

## C1. Microsoft Agent Framework：Agent Skills 可從 MCP server 按需 discovery/fetch

**CONFIRMED — 2026-07-28；current docs checked 2026-09-14**

Sources:
- https://devblogs.microsoft.com/agent-framework/discover-agent-skills-from-mcp-servers-in-net/
- https://learn.microsoft.com/agent-framework/agents/skills
- https://devblogs.microsoft.com/agent-framework/agent-skills-for-python-is-now-released/ （2026-07-15）
- https://devblogs.microsoft.com/agent-framework/agent-skills-for-net-is-now-released/ （2026-07-07）

Microsoft .NET Agent Framework 已能讓 agent 從 MCP server 的 `skill://index.json` 找 Skill，再按需讀 `skill-md` 或 archive；核心 Agent Skills API 在 .NET/Python 已分別於 7 月穩定發布。但 current docs 對 **MCP-based skills** 本身仍標 experimental，而且 Python `MCPSkillsSource` 支援範圍小於 .NET；官方也明確警告 remote MCP server 控制送進 agent 的 Skill instructions/scripts，必須視為 untrusted input。

### Job-to-be-Done
中央團隊更新 domain playbook/Skill 後，不想每個 agent project 都複製 folder、重 build/redeploy。

### 省掉的人工步驟
`publish skill → per-agent copy/package → redeploy → drift` 可縮成 `publish source → client discover/fetch on demand`。

### Onboarding/distribution
Skill source 變成連接點，而不是每個 target installation 的 local folder。Progressive disclosure 同時降低一次載入全部內容的 surface。

### Security / provenance pattern
這裡存在一個對 Evidence-Gated Foundry 特別重要的張力：**Microsoft 強調 update without redeploy，但 certified artifact 不能因同一 URL 的內容變了就沿用舊證書。**

對 `skill-foundry` 的 transferable model：

`CertifiedSkillRevision(hash) → MCP Advertisement(revision/hash) → Fetch → Client-observed bytes/hash → Match/Mismatch → Eligible for use`

而不是：

`skill://name → always latest → assume still certified`。

### Issue Quality v2 disposition

同 fingerprint 已存在 `skill-foundry #4`，因此**不建新 Issue**。本輪取得 lock 後只補新證據並縮小下一個研究實驗：
- 先 serve 1 個 certified synthetic Skill；
- 只測 discovery/fetch + exact hash verification；
- 比較是否真的消除 manual copy/redeploy；
- 保留 manual/export fallback；
- 未證明價值前不建 multi-target adapter/registry/installer。

更新後 metadata：`RESEARCH / severity NOT_ESTABLISHED / NEEDS_EVIDENCE / auto_implementation=false`。

Issue: https://github.com/Reese-max/skill-foundry/issues/4

---

# 6. Community Pain Points

以下只作 anecdotal failure-mode input，不當發生率／市場統計。

### COMMUNITY_SIGNAL — virtual-patient inconsistency
2026-08-01 一則 medicalschooluk 討論中，有使用者抱怨 AI history patient 對相同問題給出不同 complaint、無法辨識 echocardiogram/基本資訊，卻反過來在 feedback 扣分；另有回覆表示 reliability 不足以付費。

Source:
- https://www.reddit.com/r/medicalschooluk/comments/1vcq8pt/have_you_tried_passmedicine_ai_history_feature/

**Regression hypothesis for Project Doctor #11**：CaseSpec truth 必須可重播；相同 fact query 不應因模型自由生成改變 ground truth；不能辨識的 learner action 應 `UNKNOWN/CANNOT_SCORE`，不要自信扣分。

### COMMUNITY_SIGNAL — editable presentation handoff remains a real complaint class
2026-07-24 PowerPoint 社群有人描述：不少 PPT skills 雖可輸出好看的 PPTX，但修改時常需要重新產一整份檔案，因此改用 editable JSON intermediate model + web preview 再 export；這與 PPT Studio #5 的 bounded patch/native handoff方向一致。

Source:
- https://www.reddit.com/r/powerpoint/comments/1v52ezi/i_built_an_opensource_ppt_skill_that_uses_an/

這只是個別 builder 經驗，不證明市場比例，也不足以追加 #5 comment；#5 當天已被 product-board 更新同 fingerprint。

---

# 7. New Releases / signal dedupe

| Signal | Date | Status this round | Reason |
|---|---:|---|---|
| Microsoft Agent Framework MCP-based Agent Skills | 2026-07-28 + current docs | **NEW / MATERIAL** | 首次在 radar 找到 `skill://index.json` remote skill distribution；會縮小 #4 的首個研究解法 |
| Pitch MCP + API | 2026-08-12 | **NEW / KEEP IN RADAR** | external assistant → canonical deck workflow；repo-specific friction 尚未證實 |
| Geeky Medics AI station + virtual patient voice | 2026-09-08 | **NEW EVIDENCE / SAME FINGERPRINT** | 支持 #11；active PR #13，SKIPPED_LOCKED |
| Simnest Simvidence evidence-linked debrief | 2026-09-01 | **NEW ADJACENT** | 強化 evidence-linked debrief pattern；不需要新 framework |
| Plexamp 4.50.3 Offline Mode | 2026-09-01 | **DEDUPED** | 已在先前 radar 記錄；本輪不重貼、不通知 |
| ESPO prompt bloat / RLMOpt Pareto | 2026-09-03 / 2026-08-11 | **DEDUPED** | 已進 prompt-autoresearch #5 / 先前 radar |

---

# 8. Opportunity Maps — only products actually handled

## 8.1 `ppt-studio`

- **MUST MATCH:** AI 生成/修改後的 supported PPTX elements 保持 native editable；bounded edit 不 silent mutate unrelated content。已有 #5。
- **SHOULD BE BETTER:** local/offline fallback、明確 preview/diff、`VERIFIED/PARTIAL/UNKNOWN` export receipt，而非只追 hosted connector breadth。
- **DIFFERENTIATOR:** local canonical slide state + source provenance (#3) + render/export verification (#5)。
- **ADJACENT IDEA:** 允許外部 Agent 透過既有 stable API 產生/修改 candidate，再把 user 帶回 canonical editor。Pitch MCP/API 是 signal；目前 `NEEDS_EVIDENCE`，不新建 MCP Issue。
- **DO NOT COPY:** CRM/Slack connector catalog、多人 SaaS collaboration、deal-room/engagement platform、general Canva clone。

**Smaller alternative before feature:** 先檢查 OpenAPI 是否已足以被現有 automation/client 使用；若只需要一個 documented action profile，不要先建 MCP server。

## 8.2 `project-doctor-web`

- **MUST MATCH:** case truth / Objective provenance 不可由模型補造；open #9/#11。
- **SHOULD BE BETTER:** debrief 每個 feedback/rubric verdict 能回指 transcript/action/fact evidence，不能只有 AI 總分。
- **DIFFERENTIATOR:** synthetic CaseSpec + deterministic fact reveal + replay receipt；教育模擬而非泛用 AI 醫師。
- **ADJACENT IDEA:** Simvidence 的 timestamp/source-linked reviewable moment，作為 debrief UX 參考。
- **DO NOT COPY:** 現在加入 900 cases、voice/video avatar、VR/physiology engine、clinical competence certification。

**Counterargument:** Geeky Medics voice/video 很吸睛，但 #11 尚在 research PR，#2/#9 reliability 尚未完成；加 modality 會增加 cost/error surface，不能證明更接近 north star。

## 8.3 `prompt-autoresearch`

- **MUST MATCH:** 先恢復 #4 required evidence/CI baseline；沒有可信 baseline，不應再改 promotion semantics。
- **SHOULD BE BETTER:** #3/#5 已覆蓋 stochastic stability、complexity/cost/compaction。
- **DIFFERENTIATOR:** deterministic gate + fail-closed evidence，比「自動改 prompt」本身更重要。
- **ADJACENT IDEA:** 本輪沒有足夠新的獨立 external signal，保留研究游標，不湊功能。
- **DO NOT COPY:** 再開一套 optimizer、無上限 trials、把論文 benchmark 當本產品 KPI。

## 8.4 `skill-foundry`

- **MUST MATCH:** exact Skill identity、Candidate/Promotion evidence、runtime/security claims 各自獨立。
- **SHOULD BE BETTER:** 分發時不要人工複製後失去 exact revision；但解法先從最小 remote discovery experiment 開始。
- **DIFFERENTIATOR:** `certified exact hash` 應能一路延伸到 fetched/consumed artifact；普通 remote Skill source 通常只解「取得內容」，Foundry 可以解「取得的是不是那個證書對應版本」。
- **ADJACENT IDEA:** MCP `skill://` remote discovery 作 distribution surface。
- **DO NOT COPY:** silent latest auto-update、中央 registry marketplace、把 remote script 當可信、把 discovery 當 runtime authority。

**Smaller alternative chosen:** 1 Skill + 1 local MCP source + 1 compatible client + hash read-back；BUILD/NARROW/REJECT 後再決定是否保留原 #4 的 adapter matrix。

## 8.5 `soundbox-offline`

- **MUST MATCH:** 真 offline library/playback/search/queue；目前已具備，Plexamp signal 不構成新缺陷。
- **SHOULD BE BETTER:** local-first recovery/CI trust；#1 landed evidence、#4 仍追 CI gate。
- **DIFFERENTIATOR:** no account / no server media backend + explicit backup/relink。
- **ADJACENT IDEA:** #3 same-LAN direct import 已處理「桌機音檔 → 外部傳檔工具 → 手機 Files → Soundbox」手工斷點。
- **DO NOT COPY:** Plex cloud catalog/account/server依賴、streaming service breadth，只因競品有 Offline Mode 就重做 UI。

---

# 9. Cross-portfolio ideas

本輪只有 3 個可保留，不湊 Top 10。

### 1. Exact-identity remote distribution
適用：`skill-foundry`, `herdr-skills`, 未來可攜 agent components。

`Remote source convenience` 與 `certified artifact identity` 必須分離。中央來源更新可以省 copy，但 exact hash mismatch 要先阻止舊 certification 被沿用。

### 2. Domain product remains canonical; external AI is a surface
Pitch/Claude 再次驗證：外部 Agent 可負責 intent/context intake，但 canonical deck/editor/history 留在 domain product。可供 `ppt-studio`、`UkePack`、教育產品作 distribution pattern；**這個原則前幾輪已出現過，因此不新開 umbrella Issue。**

### 3. Evidence-linked debrief over AI total score
Simnest 與 virtual-patient社群 failure signal共同支持：feedback 應能回到 source/timestamp/action/fact；模型可以找 reviewable moment，但不能把不可追溯的總分變成 canonical truth。適用於 `project-doctor-web`、`UkePack`、考試教練，但各 repo 已有自己的 domain primitives，不建共用 framework。

---

# 10. Ideas Rejected / Deferred

### REJECT NOW — `ppt-studio` 直接做 Pitch-style MCP/CRM/Slack connector suite
反方：目前已有 OpenAPI + URL/PDF/Markdown/JSON import；repo 沒有真實使用者證據指出 connector 是主要瓶頸；而 product-board 明確拒絕 broad SaaS connector breadth。先留研究清單。

### REJECT NOW — `project-doctor-web` 追 Geeky Medics voice/video avatar
反方：active #11 research PR 尚未證明 CaseSpec/debrief value，且 #2/#9 safety/reliability 更優先；多模態會放大 speech recognition、cost、privacy 與 scoring inconsistency。

### NARROW — `skill-foundry #4` multi-target installer/registry first
新證據顯示 remote MCP discovery 可能直接移除一部分 copy/deploy 摩擦。先做 1×1×1 experiment；若 exact revision 無法驗，就維持 export/unknown，而不是擴 adapter matrix。

### DEFER — `soundbox-offline` 再做一套 full Offline Mode
產品本身已是 offline-first local library；Plexamp 的新 Offline switch 解的是 online-first app 斷線後的 mode switch，不是 Soundbox 相同問題。

### DEFER — `prompt-autoresearch` 新 prompt-optimization architecture
#3/#5 已涵蓋目前新研究訊號；#4 evidence baseline 還是更小、更先決的工作。

---

# 11. Issue Mapping / coordination

| Repo | Issue | Disposition | Coordination |
|---|---|---|---|
| `skill-foundry` | #4 Certified Skill Distribution | **UPDATED EXISTING RESEARCH** | comments/branches/PRs checked；無 #4 active PR/branch/lock；取得 `github-issue-lock:v1` → 寫入 v2 scope calibration → release；無實作授權 |
| `project-doctor-web` | #11 CaseSpec virtual patient | **SKIPPED_LOCKED** | active PR #13 `devin/issue-11-research` + issue comment `research PR opened`；外部新證據只進本 report |
| `ppt-studio` | #5 Structured Slide State | **NO UPDATE / DEDUP** | 同 fingerprint 當天已由 product-board 更新並釋放；Pitch MCP 是 adjacent distribution，不足以改 #5 scope |
| `prompt-autoresearch` | #3/#5 | **NO UPDATE / DEDUP** | 本輪無獨立新 evidence；不重貼 ESPO/RLMOpt |
| `soundbox-offline` | #3/#4 | **NO UPDATE / DEDUP** | Plex offline signal 已在先前 radar；repo existing issues已覆 importer/CI |

**New Issues:** 0。

### `skill-foundry #4` lock receipt

- lock run: `2026-09-14T12:03:20Z`
- lease until: `2026-09-14T13:33:20Z`
- lock comment id: `5663637759`
- evidence/scope calibration comment id: `5663650394`
- release comment id: `5663651909`
- result: `completed`

No source/branch/CI/deploy/settings mutation occurred.

---

# 12. Severity / triage / scope calibration

### `skill-foundry #4`
Original historical issue text used `P1 — High research priority` and a broad installer/distribution bundle acceptance surface. Under Quality v2, **research importance is not product severity**.

Current tracking for this radar:
- `kind = RESEARCH`
- `severity = NOT_ESTABLISHED`
- `decision_priority = MEDIUM_HIGH`
- `triage = NEEDS_EVIDENCE`
- `auto_implementation = false`

Why not P1: no evidence that current users are blocked or losing data/revenue/security due to manual Skill copy; external market evidence proves a distribution pattern exists, not a severe Reese-max defect.

Why research is still worthwhile: Foundry's current exact-hash certification makes distribution identity strategically relevant, and Microsoft's MCP skill source offers a bounded experiment that can terminate with BUILD/NARROW/REJECT.

### `project-doctor-web #11`
No severity change this round. External evidence supports direction but cannot override active PR or convert virtual-patient research into P1 product defect. Voice/video remains deferred.

### `ppt-studio`
No new severity. Pitch MCP/API is an onboarding/distribution signal, not proof that PPT Studio users currently suffer a connector defect.

---

# 13. Sources

## Official / first-party

1. Microsoft Agent Framework — Discover Agent Skills from MCP servers in .NET — 2026-07-28  
   https://devblogs.microsoft.com/agent-framework/discover-agent-skills-from-mcp-servers-in-net/
2. Microsoft Learn — Agent Skills / MCP-based skills — current docs checked 2026-09-14  
   https://learn.microsoft.com/agent-framework/agents/skills
3. Microsoft Agent Framework — Agent Skills for Python released — 2026-07-15  
   https://devblogs.microsoft.com/agent-framework/agent-skills-for-python-is-now-released/
4. Microsoft Agent Framework — Agent Skills for .NET released — 2026-07-07  
   https://devblogs.microsoft.com/agent-framework/agent-skills-for-net-is-now-released/
5. Pitch — Introducing Pitch MCP and API — 2026-08-12  
   https://pitch.com/whats-new/introducing-pitch-mcp-and-api
6. Pitch Help — Create presentations with Claude — 2026-08-10  
   https://help.pitch.com/en/articles/16220369-create-presentations-with-claude
7. Pitch Help — Pitch Agent — current checked 2026-09-14  
   https://help.pitch.com/en/articles/14981091-pitch-agent
8. Geeky Medics — Practise History Taking with AI Virtual Patients — 2026-09-08  
   https://geekymedics.com/practise-history-taking-with-ai-virtual-patients/
9. Geeky Medics — Generate OSCE Stations with AI — 2026-09-08  
   https://geekymedics.com/generate-osce-stations-with-ai/
10. Geeky Medics Support — Create/share OSCE stations — updated 2026-09-04  
    https://support.geekymedics.com/en/article/how-do-i-create-and-share-osce-stations-12tydyj/
11. Simnest — Simnest Group and AviatePro expand collaboration on AI-assisted simulator debriefing — 2026-09-01  
    https://simnest.com/articles/simnest_group_and_aviate_pro_expand_collaboration

## Community / anecdotal only

12. r/medicalschooluk — PassMedicine AI history feature inconsistency — 2026-08-01  
    https://www.reddit.com/r/medicalschooluk/comments/1vcq8pt/have_you_tried_passmedicine_ai_history_feature/
13. r/powerpoint — editable JSON intermediate model for PPT skill — 2026-07-24  
    https://www.reddit.com/r/powerpoint/comments/1v52ezi/i_built_an_opensource_ppt_skill_that_uses_an/

---

# 14. What Changed Since Last Radar

1. **Repo scope became more accurate:** 重新列舉實際 owner repos，發現舊 product list 有多個目前不存在的 repo 名稱；本輪不再將舊名稱當實際 portfolio truth，也不猜 rename mapping。
2. **`skill-foundry #4` 被縮小，而不是加大：** 新 Microsoft MCP-Skills evidence 讓「先建 multi-target installer」不再是最小解；改成 1 certified Skill × 1 local MCP source × 1 client 的 exact-hash research。
3. **`project-doctor-web` 有更新的直接競品證據，但因 active PR 不搶 scope：** Geeky Medics 9/8 voice/history/AI station signals只進中央報告。
4. **Pitch MCP/API 是新 distribution signal，但沒有 repo friction 證據：** 不為 `ppt-studio` 製造 connector Issue。
5. **去除重複訊號：** Plexamp Offline、ESPO/RLMOpt 等先前 radar 已處理，本輪不重貼。
6. **New Issues = 0。** 唯一 Issue mutation 是同 fingerprint 的 v2 scope calibration；沒有把外部新品直接等同功能缺陷。

---

# 15. Incomplete / runtime gaps / next cursor

- `skill-foundry #4` 的 MCP experiment **尚未執行**；目前只有官方 protocol/product evidence + repo gap evidence，因此狀態是 `NEEDS_RUNTIME_VERIFICATION`，不能宣稱 remote certified distribution 可用。
- `project-doctor-web #11` 的新 external signals沒有寫入 Issue，因 active research PR #13；待該工作結束後，後續輪次若仍有 material evidence，先讀完整 comments/PR 再決定是否校準。
- `ppt-studio` 沒有 runtime 驗證 Pitch-like assistant handoff是否值得；OpenAPI 是否已足夠仍是較小替代問題。
- `soundbox-offline` 本輪沒有找到比既有 Plex offline／LAN transfer 更有區分度的新 30–90d signal；明記缺口，不湊假新品。
- `prompt-autoresearch` 本輪沒有新增獨立 external opportunity；#4 reliability baseline仍是阻塞 promotion research 的更重要工作。
- 下一輪公平輪巡游標：`spotify-playlist-organizer-mcp`；之後對實際 owner listing 中尚未重新核定產品範圍的 repo 逐步校準。

本雷達不宣告 portfolio CLEAN，也不把靜態 README／第三方行銷／論文 benchmark 冒充 production/runtime 驗證。
