# 外部競品／新品／工作流靈感雷達 — 2026-09-08 r5

> Scope：Reese-max 擁有、未封存且可視為產品的 repositories。**公開網路是本輪主要情報來源**；GitHub repository / Issues / PR / recent commits 僅用來判斷產品 fit、是否重複、目前 implementation boundary 與安全優先序。官方產品宣稱與研究論文結果都不直接當成本專案成效證據；Reddit 等社群來源一律標記 `COMMUNITY_SIGNAL`。

## Executive Summary

本輪找到 **1 個達到正式研究立案門檻的新機會**：

1. **video-timeline-pipeline — 保留固定基線抽樣，再對特定 query／claim 做 bounded local visual evidence escalation**（92/100，RESEARCH_REQUIRED）。Google 在 2026-09-01 正式推出 Gemini agentic video understanding；CVPR 2026 LensWalk、2026-08 MEC frame selection、TwelveLabs 的近期 video-analysis 更新都顯示長影片理解正在由「固定 frame budget」轉向「依任務動態找證據」。但一個 2026-09-02 的小型商業產品測試反而觀察到 static mode 在 latency、token、cost 與 broad retrieval 上勝出，說明 agentic 並非普遍更好。因此本輪**沒有建議把整條 pipeline 換成 Gemini**，而是建立 #10：先以本機 FFmpeg＋現有 retrieval 做二階段局部加密重看，shadow evaluate 後再決定是否值得接 provider-native agentic mode。

本輪另有三個重要、但**不新增重複 Issue**的訊號：

- **taichung-police-intel**：r4 後已出現 #13「直播會議 Provisional Intelligence Session＋會後官方證據對帳」，已完整吸收 Reuters／Granicus／streaming ASR 方向；本輪不搶另一排程的同 fingerprint。
- **UkePack**：Flat for Education 最近把老師原本要開多個分頁的 tuner、metronome、sight-reading、sound analysis 集中進同一教學面；Soundslice 持續補 latency 與 stems。這支持「減少工具切換」這個 JTBD，但 UkePack #3 已要求先做真老師 workshop workflow research，而且 #2 CI reliability 尚未恢復，故不新增練習工具 feature。
- **skill-foundry / herdr-skills**：Grok Bot Marketplace 現在把 Bot 產品化為 `memories + skills + routines + integrations + explicit anti-jobs/approval boundaries`；Grok Build Plugin Marketplace 亦把 skills、commands、agents、hooks、MCP、LSP 打包且 pin commit SHA。這是很強的 distribution / package-contract 訊號，但 Skill Foundry #1 已在處理 target-runtime compatibility／negative transfer，本輪只把「side-effect / anti-job policy」列入後續 certification dimension，不另開票。

跨 Portfolio 新原則：**「固定基線＋按需升級」通常比「所有工作一律進最強 agentic mode」更可靠。** 對影片、搜尋、模型 routing、Skill、情報來源與學習推薦，都應先有低成本、可重播 baseline，再在 evidence gap 明確時啟動 bounded escalation，且保存 escalation receipt。

---

## Product → Market Category Map / Opportunity Map

| Repository | 市場／產品角色 | 本輪 Opportunity Map |
|---|---|---|
| gemini-deidentifier | AI RPG / interactive fiction | DIFFERENTIATOR：world-state ledger 已立案；DO NOT COPY 通用 storyteller-agent 堆疊 |
| exam-archive | exam archive / public reference | SHOULD SIMPLIFY：保持 archive/provenance，避免與 practice 產品重疊 |
| police-exam-practice | 舊警察考試練習路徑 | DO NOT DUPLICATE：能力持續往 police-exam-archive 收斂 |
| police-exam-archive | 官方題庫＋練習 | DIFFERENTIATOR：Attempt Ledger / deadline-aware review 已立案 |
| 92-duty-scheduler | constraint scheduling | DIFFERENTIATOR：minimal-impact repair plans 已立案 |
| openab | Discord ↔ ACP coding-agent broker | MUST MATCH：human approval broker；Issues disabled/write-blocked |
| UkePack | MusicXML → 教師／兒童練習包 | RESEARCH：#3 workshop pack-set 先做人類研究；SHOULD NOT BLOAT 成完整 music LMS/toolbox |
| ppt-studio | AI presentation workstation | DIFFERENTIATOR：claim/source provenance #3 已存在 |
| book5-windows-server-2022 | Windows Server 2022 教學內容 | ADJACENT IDEA：version/source freshness；未證明需跨版本平台 |
| obsidian-vault | personal knowledge/content | DO NOT TURN INTO SaaS；content-first / local ownership |
| voice-actress | 申論評分／法律學習 | DIFFERENTIATOR：evidence-linked feedback #6 已存在 |
| taiwan-intel-dashboard | 暫停中的公共情報 dashboard | DO NOT EXPAND；先恢復 availability/canonical publish |
| autodev-ng | multi-agent software-delivery orchestrator | SHOULD BE BETTER：proposal→independent verification→receipt；避免 agent-count 競賽 |
| flux-image-gen | AI image generation workspace | DIFFERENTIATOR：provenance / C2PA #18 已存在 |
| claude-mem | upstream agent-memory fork | N/A standalone roadmap；優先 upstream identity/sync |
| lobsterpulse | agent observability / hooks | MUST MATCH：OTel / provider metrics roadmap 已存在，不重複 |
| prompt-autoresearch | prompt optimizer / experiment runner | DIFFERENTIATOR：variance-aware promotion #3 已存在 |
| neciken-summer-poem | AI 長篇創作＋投稿 workflow | DIFFERENTIATOR：Rule-Drift Receipt #3 已存在 |
| note-filler | evidence-grounded note completion | DIFFERENTIATOR：claim review queue 已存在；可借鏡 exact-evidence modality |
| gooaye | placeholder | N/A：先定義 purpose 或 archive |
| lplrs-judicial-sync | judicial source synchronization | MUST MATCH：deletion/tombstone/source lifecycle 已有 Issue |
| adng-memory | operational agent memory | RESEARCH：activation/supersession/bitemporal lifecycle 已立案 |
| cyber-prep-coach | iPAS exam preparation | DIFFERENTIATOR：mastery/next-best-study #4；避免再造第二個推薦器 |
| cf-ai-router | AI provider router | RESEARCH：provider reliability / capability evidence；可借鏡 baseline→escalation policy |
| avatar-vfo | AI avatar/chat | SHOULD VERIFY：auth/isolation/runtime before long-term memory expansion |
| project-doctor-web | clinical teaching/research UI | DO NOT EXPAND agentic actions before safety/runtime gates |
| minideck | lightweight AI deck publishing | MUST MATCH：draft head vs published head #4 已存在 |
| chatgpt-dual-pipeline | internship-notes publishing pipeline | SHOULD SIMPLIFY：canonical source/publish path |
| internship-notes-sites-mirror | deployment/content mirror | N/A standalone product features |
| taichung-police-intel | police/public-sector intelligence monitor | DIFFERENTIATOR：role profile #12 + live provisional/reconciliation #13；不重複開票 |
| soundbox-offline | local-first offline music | DIFFERENTIATOR：LAN import #3；維持 local-first，不擴成雲端帳號音樂服務 |
| skill-foundry | agent Skill creation/certification | MUST MATCH：runtime compatibility #1；ADJACENT：anti-job/side-effect policy 作 certification metadata |
| video-timeline-pipeline | video intelligence / knowledge workflow | **RESEARCH_REQUIRED：bounded agentic visual evidence escalation → NEW #10** |
| ai-novel-workstation | long-running AI writing workstation | DIFFERENTIATOR：Context Manifest #2；同樣採 baseline truth→selective context，而非全量塞 prompt |
| clinical-scribe-worker | clinical scribe evaluation worker | MUST MATCH：versioned clinical validation pack #4 |
| MaterialYouNewTab | local-first browser new-tab productivity | ADJACENT IDEA：permission-minimal active-page capture；保持低權限 |
| cf-mcp-server | MCP server | MUST MATCH：2026-07-28 protocol / SDK v2 migration #6 |
| tick-stock-panel | Taiwan market screen/backtest | RESEARCH：NL→deterministic StrategyDef #5；coverage truth 優先 |
| herdr-skills | multi-agent workflow Skills | SHOULD BE BETTER：package contract / approval boundary / compatibility；不要重造 orchestrator |
| ninax-line-hermes | LINE ↔ long-running AI/video workflow | MUST MATCH：message revision / stale-result gate #1 |

---

## External Signals

### A. 直接競品／替代平台近期能力：Video AI 由 static sampling 轉向 task-directed observation

#### CONFIRMED — Google DeepMind, 2026-09-01
Google 正式推出 Gemini **agentic video understanding**。官方描述與 static processing 的差異是：static 預設固定 FPS 讀取；agentic mode 則會動態搜尋／掃描目標片段，跨 frames、audio、transcript 決定需要觀察的時間區間與密度。Google 宣稱在其 benchmark 可達最高 88% token reduction、66% cost reduction、7% quality improvement；這些數字只視為 vendor benchmark claim。

- JTBD：多小時影片中找短暫 moment／anomaly／counting evidence，不先把全片高密度送進 model。
- 省步驟：模型自己提出「應重看哪段」，減少人工 seek 或全片高 FPS。
- Distribution：直接成為 Gemini API processing mode，不需要另一套獨立產品。
- Pricing signal：官方表示使用標準 Gemini token pricing，agentic feature 本身沒有額外 feature fee；因此它是 execution strategy，不是 SaaS add-on。
- 限制：內部 selection 未必能提供 Reese-max 所需的 deterministic frame receipt；vendor benchmark 不能外推。
- 吸收：採「按 evidence gap 局部重看」概念。
- 不照抄：不替換本地 FFmpeg/cache/Whisper/MiniMax baseline。

Source: https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-agentic-video-in-gemini/

#### CONFIRMED — TwelveLabs, 2026-08-18 / 08-19 / 08-31
近期 release notes：
- 8/18 Pegasus 1.2 被移除，API 拒絕舊 model，要求遷移 Pegasus 1.5；
- 8/19 可不先建立 index 就取得 video/audio transcription，並選 word / sentence / speaker-turn segmentation；
- 8/31 Marengo 3.5 新增跨 text+image/video/audio composed query、長時影音 embedding 與 uncertainty vector。

- JTBD：把「先建完整索引才能使用」拆成可按工作流選擇的 transcription / analysis / embeddings。
- 可靠性訊號：video provider contract 會快速 deprecate，因此 model/version 必須進 receipt/freshness。
- 產品設計：uncertainty 不應被壓成單一「成功／失敗」，可保留作 selector/escalation input，但不可當 truth probability。
- Pricing/business signal：TwelveLabs 也持續調整 video segmentation / free-plan limits，說明長影音分析要把 work unit 與 provider contract 顯式化。

Source: https://docs.twelvelabs.io/docs/get-started/release-notes

#### CONFIRMED — Lirovo, 2026-09-08 查核
Lirovo 是新興 open-source / BYO-inference video intelligence harness，主打 transcript 與 screen evidence 同時間軸、scene detection/frame dedup 在 model call 前完成、typed JSON、每個值連回 exact second 並記錄 audio/vision modality。

- JTBD：不要只得到 transcript，而要直接取得可供 agent/database 使用、可追查的 typed evidence。
- 省步驟：scene/dedup 做在模型前，避免把重複畫面都送 inference；每個 field 不需人工回頭找證據。
- Distribution：terminal + agent/plugin；不是要求使用者進另一個大型 Web UI。
- Business model：目前公開定位為 free/open-source、BYO inference；使用者自行付模型供應商，強化 local-first / provider portability。
- 限制：產品頁仍屬自家宣稱，未取得獨立大規模品質評估。
- 吸收：evidence locator / modality / pre-model dedup。
- 不照抄：不需要為了 graph UI 重建 pipeline；Reese 既有 timeline/search 已足夠做 MVP。

Sources:
- https://lirovo.ai/en
- https://lirovo.ai/en/capture
- https://lirovo.ai/en/evidence （若 locale redirect，等價 evidence page）

### B. 相鄰領域可移植工作流：先有穩定基線，再在需要時增加工具

#### CONFIRMED — Flat for Education, 2026-05-21 / 07-17 / 07-20
Flat 把老師原本會另外開分頁的 sight-reading generator、tuner、metronome、tone generator、sound analysis 等工具放進 notation/assignment 環境；7 月也把 sight-reading 直接接到 assignment workflow。

- JTBD：老師不想在五個網站／App 間切換、學生也不應浪費練習時間找工具。
- Onboarding：瀏覽器直接使用，無額外 app；practice tools 進既有 menu。
- Pricing signal：practice tools 打包到 Teacher / School-District plan，說明「減少工具切換」本身能支撐 bundle value。
- UkePack 可吸收：只在老師真實 Beta 顯示「產 pack 後還必須跳出去做 X」時，把 X 變成 pack workflow 的一小段。
- 不應照抄：不要為競品 feature parity 直接做 tuner/metronome/gradebook/LMS；#3 尚未證明 workshop pack-set 需求，#2 CI 可靠性也優先。

Sources:
- https://blog.flat.io/the-tools-music-teachers-keep-open-in-other-tabs-are-now-built-into-flat-for-education/
- https://blog.flat.io/the-practice-tools-built-into-flat-for-education-metronome-tuner-tone-generator-sound-analysis/
- https://help.flat.io/en/education/sight-reading-generator/

#### CONFIRMED — Soundslice, 2026-05-22
Soundslice 最近加入自動裝置 audio latency compensation、notationless multitrack stem playback、每樂器設定自動保存等練習 UX。

- JTBD：播放與譜面不同步會直接破壞練習，使用者不應每次手動校正。
- 核心原理：把環境摩擦（latency、個人 mix）變成 persistent player setting，而不是增加教材內容。
- UkePack relevance：若 Beta 老師/學生真正卡在 practice audio 對齊或多聲部，應先解環境摩擦；目前證據不足，不立案。

Source: https://www.soundslice.com/blog/310/new-features-and-fixes-may-2026/

### C. 新興技術／研究：query-conditioned frame selection 正在成熟，但有 blind-spot trade-off

#### CONFIRMED RESEARCH — LensWalk, CVPR 2026
LensWalk 以 `reason → plan → observe` 控制 temporal scope 與 sampling density；先 broad scan，再局部 zoom。論文報告在多個長影片 benchmark 有 >5% accuracy gain。這是研究結果，不代表對 Reese 影片 corpus 同樣成立。

Source: https://openaccess.thecvf.com/content/CVPR2026/html/Li_LensWalk_Agentic_Video_Understanding_by_Planning_How_You_See_in_CVPR_2026_paper.html

#### CONFIRMED RESEARCH — MEC Frame Selection, 2026-08-06
`One Ranking, Any Budget` 把 frame selection 做成可重用 priority sequence：小 budget 先收 query evidence，大 budget 再補 temporal coverage與 diversity；以 sparse probing / local zoom 避免 dense pre-scan。論文報告平均 +3.77 percentage points 與 selection latency reduction。

Source: https://arxiv.org/abs/2608.05707

#### CONFIRMED RESEARCH — AdaQ, 2026-06-23
AdaQ 依 query temporal granularity 調整 sampling 範圍：local query 用更集中區間，global query 則放寬。可移植訊號是**selector policy 必須知道問題是 local 還是 global**；不能所有 query 一律 zoom。

Source: https://arxiv.org/abs/2606.24187

### D. Agent／Skill distribution：工作流包正在超越單一 Prompt / Skill

#### CONFIRMED — Grok Bot Marketplace / Haggle Bot, checked 2026-09-08; xAI case 2026-09-04
Marketplace Bot 已把 `memories + skills + routines + integrations` 當成安裝單位。Haggle Bot 還明確定義 anti-jobs：可以分析支出、合約、用量與起草談判，但「不花錢、不簽、不下 PO、不送 email/Slack，除非該次 send 有明確人工同意」。

- JTBD：使用者想安裝一個已調好的工作角色，不想手工組 Prompt＋Skills＋Apps＋Scheduler。
- Onboarding：Marketplace `Import Bot`，first-run setup 連資料、確認 approval owner。
- Business model：Grok Bot 已納入多個付費方案且有獨立 usage；distribution 本身成為產品層。
- Reese 可吸收：Skill Foundry certification 除 runtime compatibility 外，未來可加入 `allowed_actions / anti_jobs / approval_required` manifest；herdr-skills 可把 workflow 的 tool boundary 做成 package contract。
- 不應照抄：不要立刻做自己的 Marketplace；目前更有價值的是 certify package behavior。

Sources:
- https://x.ai/bot/marketplace/bots/haggle-bot
- https://x.ai/news/grok-bot-procurement
- https://x.ai/news/grok-bot-more-plans

#### CONFIRMED — Grok Build Plugin Marketplace, 2026-06-11
Grok Build plugin 可把 skills、slash commands、agents、hooks、MCP servers、LSP 打成一個 installable package，且 catalog remote plugin pin 到 specific commit SHA 並在 install 驗證。

- 可移植原則：能力包必須有 immutable provenance / version pin，而不是只寫「支援某 Skill」。
- Skill Foundry #1 已有 skill/hash/harness/runtime evidence，這是補強其 distribution claim，而不是另開 Marketplace feature。

Source: https://x.ai/news/grok-plugin-marketplace

---

## New Releases / Recent Changes

| 日期 | 外部產品／來源 | 變化 | Reese-max relevance |
|---|---|---|---|
| 2026-09-04 | xAI Haggle Bot case | Operational Bot＋live data＋approval boundary | skill-foundry/herdr：package contract / anti-jobs |
| 2026-09-01 | Google Gemini | Agentic video understanding GA-like API capability | video pipeline：局部按需觀察值得研究 |
| 2026-08-31 | TwelveLabs | Marengo 3.5 multimodal composed embeddings + uncertainty | video/search：query-conditioned multimodal evidence |
| 2026-08-19 | TwelveLabs | transcription standalone API + segmentation choices | video：ingest 與 query-time operations 可分層 |
| 2026-08-18 | TwelveLabs | Pegasus 1.2 removed | provider/version receipt、stale invalidation |
| 2026-08-06 | MEC paper | one ranking / any frame budget, sparse probe + local zoom | video：可重用 evidence priority sequence |
| 2026-07-20 | Flat for Education | sight-reading generator integrated into assignment flow | UkePack：只整合真正造成工具切換的 helper |
| 2026-06 | CVPR LensWalk | agent controls temporal scope / sampling density | video：agentic observation research basis |
| 2026-05-22 | Soundslice | auto latency + stems/persistent practice settings | UkePack：environment friction > generic AI tutor |

---

## Community Pain Points

### COMMUNITY_SIGNAL — Agentic video 並非在所有任務更省／更快，2026-09-02
PaperEdits 的產品開發者在 r/buildinpublic 公開一個很小的 frozen synthetic test：6 支 10 分鐘影片，5 組有效 matched pairs，同 Gemini 3.7 Flash，比 agentic vs static。其結果中 agentic 找到 18/20 brief events、static 15/20，edit-decision macro F1 也較高；但 static 約快 45%、token/cost 較低，broad moment retrieval 略優；另有一個 agentic JSON contract failure。作者自己明確說這不是 universal model ranking。

Source: https://www.reddit.com/r/buildinpublic/comments/1w5plxn/we_froze_a_benchmark_before_testing_geminis/

**Implication**：這是本輪最重要的反向訊號。Google headline 不能變成「所有影片都改 agentic」。Reese 應先按 query class（brief-event / local fact / broad summary / no-visual answer）做 shadow matrix，再決定哪些情境升級。

### COMMUNITY_SIGNAL — Video intelligence builders 仍在尋找 scene/entity/search 的產品形狀
r/MachineLearning self-promotion thread 中有 builder 正在做 scene decomposition、entity tracking、semantic search 的 video engine private alpha。這只證明 developer interest，不代表市場需求統計；但和 Lirovo/TwelveLabs 一起看，顯示「影片→可查詢結構」正在從單純 transcript product 轉成可供 agent/data team 使用的 infrastructure。

Source: https://www.reddit.com/r/MachineLearning/comments/1rihows/d_selfpromotion_thread/

---

## Adjacent Ideas

### 1. Evidence Escalation as a reusable product primitive
可抽象成：

`baseline evidence → gap reason → bounded escalation policy → extra source work → receipt → merged evidence state`

適用：
- video-timeline-pipeline：局部加密 frames；
- taichung-police-intel：provisional live ASR → official reconciliation；
- cf-ai-router：cheap/provider baseline → stronger provider only on bounded failure class；
- note-filler / voice-actress：低風險 deterministic checks → only ambiguous claims call expensive verifier；
- cyber-prep-coach：rule-based recommendation → low-confidence topic classification 才升級。

### 2. Evidence modality should remain visible
Lirovo 把 `heard` vs `seen` 當 evidence first-class field。Reese 的影片與 intel產品也應避免把「speaker 說的」與「slide 顯示的」壓成同一段摘要；兩者矛盾時應產生 contradiction candidate，而不是模型自行選一邊。

### 3. Runtime/package certification should include side-effect policy
Grok Marketplace 的 anti-jobs 是很好的 packaging signal。Skill Foundry #1 已回答「在哪個 runtime 驗證過」，後續可研究再回答「這個 package 被允許做什麼／必須詢問什麼／永遠不能做什麼」，但不另開重複 Issue。

### 4. Integrate only the external tool handoff users actually perform
Flat 的成功模式不是「有更多 feature」，而是把老師**真的每天另開的工具**拿回同一工作面。這應成為 Portfolio feature gate：若沒有觀察到人工跳轉／copy-paste，不因 competitor menu 有某功能就照做。

---

## Opportunity Map — scored candidates

| Candidate | Repo | Class | Score | Decision |
|---|---|---|---:|---|
| Stable baseline + bounded local visual evidence escalation | video-timeline-pipeline | RESEARCH_REQUIRED / DIFFERENTIATOR | **92** | **NEW #10** |
| Live provisional public-meeting transcript + post-event reconciliation | taichung-police-intel | DIFFERENTIATOR | 94 | Already #13 from another workstream; no duplicate/update |
| Bot/Skill package side-effect / anti-job manifest | skill-foundry / herdr-skills | ADJACENT IDEA | 86 | Map to #1 certification direction; research list only |
| Teacher practice-helper consolidation | UkePack | ADJACENT IDEA | 79 | Defer to #3 real-teacher study; CI #2 first |
| Multimodal evidence modality/contradiction receipt | video / intel / note-filler | SHOULD BE BETTER | 87 | Reuse existing provenance roadmaps; no separate generic platform |
| Provider model-deprecation freshness | cf-ai-router / video / cf-mcp-server | MUST MATCH pattern | 85 | Existing capability/version contracts cover core pattern |

Opportunity Score 是 prioritization heuristic，不是市場預測。

---

## Top 10 Cross-Portfolio Ideas

1. **Evidence Escalation Contract** — 先 baseline，只有明確 evidence gap 才加成本／加模型／加來源。
2. **Modality-aware Evidence** — `heard / seen / official-doc / derived / model-inference` 不壓成同一 confidence。
3. **Task-class Routing** — local fact、brief event、broad summary、no-answer 應有不同 sampling/retrieval policy。
4. **Selection Manifest** — 不只保存模型答案，還保存「為何選這段／這些 frames／這個 provider」。
5. **Provider Contract Freshness** — model removed / SDK changed / capability drift 應讓舊 evidence claim stale。
6. **Anti-job / Side-effect Manifest** — Skill/Bot package 明確列允許、需批准、永遠禁止的 actions。
7. **Pinned Distribution Receipts** — installable agent package 應 pin commit/hash/runtime contract，再進 certification。
8. **Tool-handoff Gate** — 只有觀察到真實跨 App／複製貼上摩擦才整合 helper，不做 feature parity。
9. **Query-conditioned Cache Reuse** — 升級 observation 也要 content-addressed/cacheable；同 interval/query budget 不重付費。
10. **Counter-benchmark before Promotion** — 每個 vendor「更快／更省／更準」宣稱都先用 Reese 自己 frozen job fixtures 做反例測試。

---

## Ideas Rejected / Deferred

1. **把 video-timeline-pipeline 整條改用 Gemini agentic video** — REJECT。會破壞 local-first/cache/provider-neutral 基線，且社群小樣本已看到 latency/cost 反例。
2. **基礎 ingest 完全改成 query-conditioned sampling** — REJECT。建立可重用知識庫時尚未知道未來 query，會形成永久 blind spot。
3. **為 UkePack 一次加入 tuner/metronome/sight-reading/gradebook** — REJECT NOW。Flat 的產品合理性不能替代 UkePack #3 真人研究；且 #2 CI reliability 先處理。
4. **替 Skill Foundry 建自己的 Bot Marketplace** — REJECT NOW。市場 distribution pattern 值得學，但目前 Foundry 的 moat 是 evidence/certification，不是 catalog size。
5. **再開一張 taichung live-meeting Issue** — DUPLICATE。#13 已精準涵蓋 provisional transcript、gap、cost、post-event reconciliation。
6. **將 Lirovo knowledge graph 全搬進 video pipeline** — REJECT。timeline/FTS/semantic/evidence work 已存在；只吸收 modality/evidence contract。
7. **直接採論文 benchmark 作 feature success target** — REJECT。CVPR/arXiv task distribution 與 Reese corpus 不同。
8. **因 agentic mode 看起來更省，就無界自動 rewatch** — REJECT。所有 escalation 必須有 interval/frame/cost/attempt ceiling。

---

## Issue Mapping

### NEW
- `Reese-max/video-timeline-pipeline #10`
  - **[Research][RESEARCH_REQUIRED][Competitive Inspiration] 評估「基線抽樣＋按需局部加密重看」的 Agentic Visual Evidence Escalation**
  - Stable fingerprint 已先搜尋 open/closed Issues 與 PR，未找到相同主題。
  - 明確保留 fixed baseline；local two-pass first；Gemini agentic 只能後續 opt-in canary。
  - Runtime verification 要求 frozen public/synthetic videos、human evidence windows、baseline vs escalation 的 recall/citation/latency/cost/regression。

### EXISTING / NO DUPLICATE
- `taichung-police-intel #13` — r4 後新增，已完整涵蓋 live provisional transcript + official reconciliation。本輪只記入中央 Radar，不搶同一工作流。
- `skill-foundry #1` — runtime compatibility / negative-transfer gate 已存在；Grok Bot packaging 只列為未來 certification metadata，不更新 fingerprint。
- `UkePack #3` — privacy-minimal workshop pack-set research 已要求真人老師觀察；Flat/Soundslice 只作研究素材。`#2` CI reliability 仍是更高優先。
- `video-timeline-pipeline #4` — default branch 最新 commit `dc421f...` 已有 cost tracking/budget guard implementation；#10 paid canary 應重用，不能再建第二套成本層。
- `video-timeline-pipeline #5/#7` — #10 與 Ask evidence occurrence / Phase-2 quality-aware routing 互補；不是重造 Search/RAG 或整個 Roadmap。

### LOCK / COORDINATION
Repository code search 未找到 `github-issue-lock:v1` marker；candidate fingerprint 的 Issue/PR search 亦無衝突。對 r4 後由其他工作流建立的 #13，本輪刻意只讀不改，避免競爭寫入。

---

## What Changed Since Last Radar

相較 `2026-09-08-external-radar-r4.md`：

1. **市場訊號從「來源規則會 drift」轉到「觀察策略本身也能動態化」**：Google 9/1 的 agentic video 是一個真正近期、直接影響 `video-timeline-pipeline` 架構選擇的新產品能力。
2. **video-timeline-pipeline 的實作基準前進**：近期 main commits 已加入 notification (#2)、importance/novelty/relevance scoring (#3) 與 cost tracking/budget guard (#4)，因此現在更適合做有 cost/evidence receipt 的 shadow video experiment，而不是先補基礎帳務。
3. **新增 #10 Research Issue**：把 #7 roadmap 的「quality-aware routing」收斂為明確、可 benchmark 的 visual-evidence escalation，不宣稱已實作。
4. **taichung-police-intel #13 已在 r4 後出現**：證明同一個 `baseline/derived → provisional → official reconciliation` 模式已在另一產品落地成 roadmap；本輪不重複立案。
5. **agentic 不是單方向勝利**：新增 PaperEdits 9/2 的反例訊號，因此 Portfolio 原則改成「job-specific escalation」而非「預設 agentic」。
6. **Agent distribution 產品化再前進**：Grok Bot Marketplace / plugin package 將 memories/skills/routines/integrations/anti-jobs 與 pinned plugin distribution 擺到一級概念，但目前對 Reese 最合理的是提升 certification contract，不是打造 marketplace。

---

## Sources

### Video / multimodal
- Google DeepMind — Introducing agentic video understanding with Gemini, 2026-09-01: https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-agentic-video-in-gemini/
- TwelveLabs — Release notes, checked 2026-09-08: https://docs.twelvelabs.io/docs/get-started/release-notes
- CVPR 2026 — LensWalk: https://openaccess.thecvf.com/content/CVPR2026/html/Li_LensWalk_Agentic_Video_Understanding_by_Planning_How_You_See_in_CVPR_2026_paper.html
- arXiv — MEC Frame Selection, 2026-08-06: https://arxiv.org/abs/2608.05707
- arXiv — AdaQ, 2026-06-23: https://arxiv.org/abs/2606.24187
- Lirovo: https://lirovo.ai/en ; https://lirovo.ai/en/capture
- COMMUNITY_SIGNAL — PaperEdits benchmark discussion, 2026-09-02: https://www.reddit.com/r/buildinpublic/comments/1w5plxn/we_froze_a_benchmark_before_testing_geminis/
- COMMUNITY_SIGNAL — ViEngine alpha post: https://www.reddit.com/r/MachineLearning/comments/1rihows/d_selfpromotion_thread/

### Music / teacher workflow
- Flat for Education, 2026-05-21: https://blog.flat.io/the-tools-music-teachers-keep-open-in-other-tabs-are-now-built-into-flat-for-education/
- Flat practice tools, updated 2026-07-17: https://blog.flat.io/the-practice-tools-built-into-flat-for-education-metronome-tuner-tone-generator-sound-analysis/
- Flat sight-reading generator, updated 2026-07-20: https://help.flat.io/en/education/sight-reading-generator/
- Soundslice, 2026-05-22: https://www.soundslice.com/blog/310/new-features-and-fixes-may-2026/

### Agent / Skill packaging
- xAI Haggle Bot Marketplace, checked 2026-09-08: https://x.ai/bot/marketplace/bots/haggle-bot
- xAI procurement case, 2026-09-04: https://x.ai/news/grok-bot-procurement
- xAI Grok Bot plan expansion, 2026-08-26: https://x.ai/news/grok-bot-more-plans
- xAI Grok Build Plugin Marketplace, 2026-06-11: https://x.ai/news/grok-plugin-marketplace

---

## Final Decision

**Notify / material update = YES.** 本輪不是重複訊號：Google 在 2026-09-01 的 agentic video release，加上同期研究與反向社群 benchmark，形成一個足夠新的架構機會；且 `video-timeline-pipeline` 現有固定 30 秒級視覺抽樣有明確可對應的 manual-work gap。已建立研究 Issue #10，但以 `RESEARCH_REQUIRED` 而非 FEATURE 立案，並明確要求保留 baseline、先做本機 bounded escalation、以 Reese 自己的 frozen fixtures 決定 BUILD/NARROW/REJECT。