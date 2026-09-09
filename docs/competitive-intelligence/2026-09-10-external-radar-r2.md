# External Competitive Intelligence Radar — 2026-09-10 r2

## Executive Summary

本輪重新盤點 Reese-max 目前可存取、owned、未封存且可視為產品的 35 個 repositories。相較同日上一輪，近期 repository 變更仍以 audit / docs 與 publication refresh 為主，沒有新的產品程式碼改動需要推翻既有 Portfolio 方向。

本輪主要情報來源刻意放在 GitHub 之外的公開網路，重點掃描最近 30–90 天的影片剪輯、transcript-first editing、agent-native video workflow、AI gateway、簡報工作流與相關社群摩擦。最強的新訊號來自 **Adobe Premiere 26.5 在 2026-09-09 正式發布 Paper Edit**：使用者可以直接從 transcript 選多段文字、Preview，再建立新的 sequence。這和 `video-timeline-pipeline` 已有 transcript / timeline / exact timestamp / evidence / source fingerprint 形成非常直接的新 handoff 機會。

本輪保留 1 個高價值新機會並完成正式立案：

**`video-timeline-pipeline #11` — Evidence-backed Paper Cut / NLE Handoff**

Opportunity Score: **94/100**

核心方向：

`Canonical Evidence → CandidateCutList → Preview / exact source ranges → deterministic validation → Versioned CutSpec → NLE export → CutReceipt`

這不是把 `video-timeline-pipeline` 變成另一個 Premiere / Descript，而是消除「已經在 intelligence system 找到片段，卻仍要手工抄 timecode、回原片 scrub、在 NLE 重新建立 in/out」的重複工作。

Issue: https://github.com/Reese-max/video-timeline-pipeline/issues/11

---

# Portfolio Discovery / What Changed Since Last Radar

- Scope 仍為 **35 個 Reese-max owned + unarchived product-like repositories**。
- 同日上一輪高價值機會為 `MaterialYouNewTab — Workspace Tab Session Snapshot / Preview / Restore`；Issues disabled，因此只保留中央 radar。本輪沒有重複立案。
- 最新 repository commits 主要是 product-board / 50 Persona audit、`UkePack` legacy-access finding、`taichung-police-intel` publication refresh、以及 competitive-intelligence 文件；沒有新的產品功能 commit 勝過本輪外部市場訊號。
- `video-timeline-pipeline` 目前 README 定義的 canonical outputs 仍以 `transcript.srt`、`notes.md`、`knowledge.md` 與 searchable/indexed knowledge 為主；已經具備 source fingerprint、FFmpeg、Groq Whisper、OCR/vision、timeline、summary、Ask/Search 與多層 cache。
- 已搜尋 `video-timeline-pipeline` open/closed Issues 與 all-state PR：`Paper Edit`、`CutSpec`、`rough cut`、`cut list`、`OpenTimelineIO`、`FCPXML`、`NLE`，未找到相同 fingerprint；現有 #10 是 query-conditioned visual evidence escalation，不是 NLE handoff。
- 未找到此 fingerprint 的既有 `github-issue-lock:v1` 認領，因此本輪只建立新的 research Issue；不修改 source code、branch、deployment、secrets 或 repository settings。

---

# External Signals

## A. Direct Competitor Recent Capability

### CONFIRMED — Adobe Premiere 26.5 / Paper Edit — 2026-09-09

Adobe Premiere 26.5 正式加入 Paper Edit。官方文件明確描述：使用者可以只靠 transcript 建立 dialogue-heavy footage 的 rough cut，選擇多個句子或部分句子，畫面會顯示 selection count 與 selected duration，使用者先 `Preview`，再 `Create new sequence`。

Sources:
- https://helpx.adobe.com/premiere/desktop/whats-new/release-notes.html
- https://helpx.adobe.com/premiere/desktop/edit-projects/edit-video-using-text-based-editing/create-a-sequence-with-paper-edit.html

**JTBD**：剪輯者已有一大段可搜尋 transcript，希望先決定「內容順序與保留句子」，不要一開始就用 timeline 做細剪。

**為何省步驟**：文字 selection 直接建立 sequence，消除「讀 transcript → 抄 timecode → timeline scrub → 建 in/out」的人工轉譯。

**Onboarding / distribution**：能力直接進既有 Premiere Text panel，不要求使用者學第二套專門 rough-cut 工具；這代表 transcript→sequence 已開始進入主流 NLE 的核心工作流，而不是旁支 AI gimmick。

**Automation / integration / provenance pattern**：不是讓 AI 自動輸出一個不可逆成品，而是 `selection → preview → editable sequence`。這個「candidate 先可視化，再 promotion 成正式 timeline」的模式和 Reese-max Portfolio 既有 preview/receipt 原則高度一致。

**Business-model signal**：Paper Edit 隨 Premiere 現有訂閱產品交付，並非獨立 AI add-on；對專業 NLE 而言，transcript-first rough cut 正成為 editing surface 的一部分。Adobe pricing 頁目前仍把所有最新版功能與更新包在 Premiere / Creative Cloud 訂閱中。

Pricing source:
- https://www.adobe.com/uk/products/premiere/plans.html

**限制 / failure point**：Paper Edit 仍依賴 transcript 與 source alignment；官方能力頁本身不證明 transcript 永遠 frame-accurate，也不證明使用者一定更快。

**適合吸收**：選擇 evidence spans、Preview、建立 versioned cut manifest、交給下游 NLE。

**不應照抄**：完整 timeline editor、effects engine、專業 NLE UI。

---

## B. Adjacent Transferable Workflow

### CONFIRMED — Descript Quick Editor / transcript cuts — 2026-07-29、2026-08-05

Descript 在 7/29 的 Quick Editor 更新中，讓 screen recording 完成後直接顯示 preview + full transcript，簡單 trim 不必先開 full project；8/5 更新則把「刪 transcript words → 建立 jump cut」與 regenerate video/audio/both 放在直接操作流程中。

Sources:
- https://www.descript.com/blog/article/quick-editor-for-screen-recordings
- https://feedback.descript.com/changelog/release-round-upaugust-5th-2026
- https://www.descript.com/pricing

**JTBD**：多數簡單影音修改其實不需要完整 NLE；使用者只想刪掉某句、開頭、結尾或不需要的段落。

**省時間 / 省步驟模式**：讓 transcript 成為 editing command surface，使用者不需把「我要刪哪段話」再翻譯成 timeline 操作。

**Onboarding**：錄完就 preview，先解決最小工作，而不是要求使用者先進 project / timeline / track mental model。

**AI / automation pattern**：AI 可以做 seam repair，但 cut 本身仍由使用者明確刪字／選擇觸發。

**Pricing signal**：Descript 現行方案把 text-based editing 放在免費到付費方案的共同產品基礎，付費主要沿 media minutes、AI credits、export / professional capability 往上分層。這表示 transcript editing 本身正趨近 table stakes，而不是高階獨佔功能。

**限制 / failure points**：transcript 不準時會直接污染 edit boundaries；生成式 seam repair 又會增加成本、模型與內容真實性問題。

**適合吸收**：先做 deterministic, no-cloud paper cut export；不要把生成式修補當 MVP 必需。

---

## C. Emerging Tool / New Product Possibility

### CONFIRMED — VEED OpenEdit — 2026-08-19，2026-09-10 再核對

VEED OpenEdit 是 agent-driven video editing pipeline：透過 coding agent 描述需求，可 cut/reframe footage、加 captions / motion，composition 與 renderer 分離，並可接既有 API / MCP / generation service。官方也明確承認目前 editing / motion 路徑比 captions 粗糙，且系統平台支援仍有限。

Sources:
- https://www.veed.io/newsroom/openedit-by-veed
- https://www.veed.io/tools/openedit
- https://support.veed.io/en/articles/16342833-how-to-use-openedit-veed-s-agent-driven-video-editor

**JTBD**：已有 agent workflow 的內容創作者，希望影片工作可以被 pipeline 編排，而不是每支片都重新進 GUI 做重複操作。

**省步驟 / integration pattern**：把 video edit 變成可被 agent / skill / MCP 組合的 pipeline，而不是孤立 desktop task。

**Distribution**：OpenEdit 採單一 skill/install flow，直接進 Claude Code / Codex / Gemini 類 agent environment；這是「功能到使用者現有工作流」而不是「使用者再登入另一個 SaaS」的分發方式。

**Business-model signal**：OpenEdit pipeline 開源；renderer 有自己的授權模型，生成能力可消耗 VEED account credits。可移植訊號不是免費，而是**interoperable workflow 可以成為上游產品的價值，而不必自己擁有所有 render/edit capability**。

**限制 / failure points**：官方自己說 caption path 最成熟，其他 edit/motion 還較粗糙；部分平台仍未全面支援。因此不能把 agent-driven prompt→render 當成熟可靠基線。

**適合吸收**：讓 `video-timeline-pipeline` 的 evidence / transcript / CutSpec 成為可供外部 editor/agent 接手的結構化 handoff。

**不應照抄**：prompt 直接取得修改原始媒體或 render 的 authority；也不需要成為完整 agent video editor。

---

# New Releases / Secondary Market Scans

## CONFIRMED — Envoy AI Gateway v1.1.0 — 2026-08-21

Envoy AI Gateway v1.1.0 新增跨 provider token counting、per-request upstream credentials、stream idle timeout + failover、MCP hostname routing / CEL backend selection、OpenTelemetry GenAI tracing。

Source:
- https://aigateway.envoyproxy.io/release-notes/v1.1/

這對 `cf-ai-router` / `cf-mcp-server` 是重要市場基線，但本輪不另開 Issue：`cf-ai-router` 已有 #1 task-specific deterministic reliability routing 與 #2 Responses API / agent-client compatibility；目前更值得先完成既有 evidence-based routing / protocol research，而不是追逐 Envoy 全套 enterprise gateway scope。

## CONFIRMED — Gamma — 2026-08-28

Gamma 新增 iOS/Android、Slack 中直接 create/search/read/export/comment、API analytics/comments/multi-page/export、Google Sheets chart sync。

Source:
- https://ideas.gamma.app/changelog/whats-new-in-gamma-august-28

這再次證明 presentation 競爭正從「生成 deck」往「在使用者既有 workflow 裡建立／回看／同步」移動。但 `ppt-studio #3` 已經引用同一市場變化，並選擇更符合本產品的 claim/source provenance 路線，因此本輪不重複建立 mobile/Slack/connectors Issue。

---

# Community Pain Points

以下均為 **COMMUNITY_SIGNAL**，只當案例，不冒充統計調查：

1. 2026-08-25 一位 Premiere plugin 開發者發布 VoidCutter，動機是 speech-heavy editing 中反覆 pause cutting / retake review 太繁瑣；工具讀 Premiere 現有 transcript，先找候選，再由人選擇後建立 sequences。這支持「候選 → review → sequence」而不是無人值守自動切片。
   Source: https://www.reddit.com/r/premiere/comments/1vy2hd8/i_made_a_free_and_opensource_premiere_plugin_for/

2. 2026-04-14 一位 Premiere 使用者回報 transcription 結果突然不可用，改用 MacWhisper / CapCut 後仍需要回 Premiere 人工調 caption segmentation。這只證明跨工具重新輸入與 transcript reliability 可能造成摩擦，不代表 Premiere 的平均失敗率。
   Source: https://www.reddit.com/r/premiere/comments/1sln5ox/premiere_suddenly_cant_create_usable_transcripts/

3. 2026-06-16 Paper Edit Beta 討論本身顯示「在長 sequence 直接從 transcript 挑保留段落」是長期被要求的 workflow；Reddit 貼文轉述 Adobe community 的 preview → create sequence 流程。仍屬社群訊號，不拿投票數當需求比例。
   Source: https://www.reddit.com/r/premiere/comments/1u7ga43/now_in_beta_paper_edit_to_text_based_editing/

4. 2025-12-03 有使用者描述 client 修正 transcript CSV 後，無法直接替換，只能面臨逐項 copy/paste 的 workflow 問題。雖超過本輪 90 天窗口，但作為「跨工具 handoff 若缺正式 contract，最後會退化成人工貼回」的代表性失敗模式保留。
   Source: https://www.reddit.com/r/premiere/comments/1pdkm7o/transcript_problems/

---

# Adjacent Ideas

## 1. Evidence-backed Paper Cut / NLE Handoff — PROMOTE

不是輸出 flattened MP4，而是輸出**仍可繼續編輯、且保留 source revision / exact ranges 的 cut intent**。

Candidate contract:

`SourceFingerprint + AnalysisRevision + EvidenceOccurrence + CutOccurrence + CutSpec + ExportAdapterVersion + CutReceipt`

第一版建議只做 local/no-cloud `CSV + OTIO`（或另一個可實際驗證的最小格式組合），再視 runtime import canary 決定 EDL/FCPXML adapter。

## 2. Transcript correction / alignment health — RESEARCH LIST

Adobe/Descript 的共同 failure surface 是 transcript 直接成為 editing surface 後，timestamp drift 的影響會更大。`video-timeline-pipeline` 若未來輸出 CutSpec，應把 alignment confidence / stale source / timebase status 一併帶入，而不是默認 ASR timestamp = frame truth。

本輪不另開 Issue：先讓 #11 的 runtime verification 對 CFR/VFR、fps/timebase、source drift 做清楚 contract，再決定是否值得獨立 alignment subsystem。

## 3. Interoperability as distribution — CROSS-PORTFOLIO

VEED OpenEdit、Gamma Slack/API、Envoy gateway 都顯示同一產品訊號：**把能力帶進使用者既有工具，通常比再做一個孤立 UI 更能消除工作流切換。** 對 Reese-max portfolio，優先順序應是 canonical data / typed handoff / exact receipts，再決定是否增加新 UI。

---

# High-Value Opportunity — video-timeline-pipeline

## Problem

目前 pipeline 已能回答「影片哪一段有什麼」，但當答案下一步是「把這幾段做成剪輯／證據 reel／課程精華」時，系統停在文字、時間戳與 Markdown。使用者仍要人工把已知 selection 重新翻譯成 NLE 操作。

## Proposed workflow

1. 從 transcript / timeline / Search / Ask / evidence result 選出 candidate spans。
2. 建立 `CandidateCutList`，不改 source。
3. Preview：顯示 clip order、source ranges、總時長、overlap/gap、source revision、stale/unsupported。
4. 使用者確認後建立 versioned `CutSpec`。
5. deterministic adapter 匯出 interchange format。
6. parser / NLE canary 核對 intended vs imported ranges。
7. 保存 `CutReceipt`；source drift 後舊 CutSpec 轉 `STALE_SOURCE`，不能 silent relink。

## Why it fits

- 現有 transcript/timeline/source fingerprint 幾乎就是 CutSpec 的必要輸入。
- 不需要新一套全文理解模型，第一版甚至可以 0 cloud calls。
- 能把 intelligence output 直接接 production workflow，提升現有 evidence investment 的 reuse potential。
- 與 #10 Visual Evidence Escalation互補，不互相取代。

## Why not copy competitors directly

- 不建 Premiere/Resolve 等級 timeline editor。
- 不把 VEED prompt→render 當預設 authority。
- 不依賴生成式 seam repair。
- 不把 vendor benchmark/marketing 當 acceptance threshold。

## Minimum Deliverable

- `CutSpec` schema + stable fingerprint / revision identity。
- read-only preview / validation。
- 至少一個實際可 round-trip 驗證的 interchange export。
- exact source range / evidence provenance。
- stale-source / unsupported-timebase / missing-source 明確狀態。
- no-cloud manual workflow 完整可用。

## Runtime Verification Requirement

必須使用 frozen local/public fixtures 驗證 CFR/VFR、不同 fps/timebase、source drift、parser round-trip；有合法可用 NLE 時做至少一種真正 import canary。沒有實際 NLE import 證據時只能標 `NLE_IMPORT_UNVERIFIED`，不可宣稱 Premiere/Resolve 已支援。

---

# Opportunity Score

| Candidate | Pain | Strategic Fit | Novelty | Evidence | Reuse | Effort | Security/Privacy/Cost Risk | Decision |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| video-timeline-pipeline — Evidence-backed Paper Cut / NLE Handoff | 9 | 9 | 9 | 10 | 8 | 7 | 8 | **94/100 — PROMOTE #11** |
| video-timeline-pipeline — full AI autonomous editor | 7 | 4 | 5 | 8 | 4 | 2 | 4 | REJECT / scope explosion |
| cf-ai-router — copy Envoy enterprise AI gateway features | 6 | 6 | 4 | 10 | 7 | 3 | 5 | REJECT as new Issue; existing #1/#2 first |
| ppt-studio — copy Gamma mobile/Slack/connectors | 6 | 5 | 4 | 10 | 6 | 4 | 5 | RESEARCH LIST; existing #3 provenance direction stronger |

數值只用作 portfolio 優先排序，不宣稱統計精度。

---

# Opportunity Map — 35 Repositories

| Repository | Market category | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|---|
| exam-archive | 考試資料庫 / 歷屆題庫 | 題目可查、來源清楚 | 去重、年份/科目定位 | canonical source provenance | 與練習/教練共享 evidence IDs | 不做無來源 AI 答案 |
| police-exam-practice | 警察考試練習 | 作答/答案/進度可靠 | 錯題與續作 | evidence-backed mastery | 可攜 attempt/mastery state | 不用聊天模式取代練習核心 |
| police-exam-archive | 警察歷屆題庫 | 題目/答案/來源版本 | 圖題與手機體驗 | archive truth layer | 對外 AI read-only source | 不把 OCR 猜測當正式題目 |
| 92-duty-scheduler | 排班 /勤務 | deterministic eligibility | Rule Studio / preview | typed PolicySpec + receipts | SOP→candidate policy | 不讓 LLM 直接改班表 |
| UkePack | 音樂/烏克麗麗工具 | 核心教材/練習可用 | legacy-access / onboarding | local lightweight practice | mic-based feedback 研究 | 不因競品即擴成完整 DAW |
| ppt-studio | AI 簡報工作台 | import/edit/export | source-aware rewrite | slide/claim provenance (#3) | workflow connectors 研究 | 不追 Gamma 全套 SaaS breadth |
| voice-actress | AI 語音 / 配音 | 可控生成與音檔輸出 | voice/project lifecycle | local/traceable voice workflow | reusable take/variant manifest | 不宣稱 clone 真實性/授權不存在 |
| taiwan-intel-dashboard | 公開情報 dashboard | operating-state truth | summary/evidence 一致 | source health + canonical publication | read-only distribution after truth fix | 不先擴 MCP 再修 truth bugs |
| autodev-ng | autonomous dev workflow | audit/issue閉環 | attention / receipts | cross-project governance primitives | behavior regression harness | 不用 agent 自評取代驗證 |
| flux-image-gen | 圖片生成 workflow | prompt→artifact 可重現 | metadata / model lifecycle | generation receipt | style/project presets | 不默認模型/價格永久不變 |
| claude-mem | developer memory | capture/retrieve 正確 | origin / staleness | memory admission / quarantine | repair/replay | 不把 retrieved memory 當 authority |
| lobsterpulse | coding-agent observability | 真實 agent state | 安裝/attention reliability | needs-attention inbox | session replay | 不用漂亮 dashboard 掩蓋 signal activation bug |
| prompt-autoresearch | prompt/eval research | frozen protocol | provider/model drift | paired non-inferiority gates | shared BehaviorContract | 不用單次模型自評選 prompt |
| neciken-summer-poem | 創意文字產品 | 內容/輸出穩定 | 編輯/版本 | creator-controlled style | reusable scene/style packs | 不堆 agent automation 破壞簡潔性 |
| note-filler | 筆記/文件填寫 | template/data mapping | provenance / missing fields | deterministic candidate→review | external-source intake | 不自動補未知事實 |
| lplrs-judicial-sync | 司法資料同步 | exact source/revision/delete | downstream stale handling | AuthorityReceipt / SourceSpan (#3) | governed read-only consumer API | 不把 source identity 當 good-law 判斷 |
| adng-memory | durable agent memory | lifecycle / delete / stale | origin-aware security | quarantine + retrieval-time defense (#4) | shared MemorySecurityReceipt | 不讓 memory 取得 authorization |
| cyber-prep-coach | 資安學習教練 | 題目/解析/進度 | grounded feedback | evidence-backed coaching | external learning-tool connector | 不用模型自信當正確率 |
| cf-ai-router | AI gateway/router | cost hard gate / provider fallback | Responses / reliability evidence | deterministic audited routing | Envoy-style telemetry subset | 不複製 enterprise gateway 全套 scope |
| avatar-vfo | persistent persona | persona/state continuity | trajectory recall | replay/ablation harness (#5) | structured canonical lore | 不把心理狀態變數當已證明效果 |
| project-doctor-web | 臨床教育 simulation | case truth / no fabricated findings | rubric/debrief | CaseSpec state machine (#11) | educator scenario import | 不做 autonomous clinical advice |
| minideck | 輕量簡報 | fast author/edit/export | interoperable output | minimal presentation surface | provenance subset | 不追完整協作 SaaS |
| chatgpt-dual-pipeline | multi-model pipeline | routing/output identity | failure/fallback clarity | paired cross-model verification | BehaviorContract receipts | 不假設第二模型=真相 |
| internship-notes-sites-mirror | 筆記網站 / mirror | content parity | source/version sync | traceable mirror receipts | structured export | 不把 mirror 變第二權威來源 |
| taichung-police-intel | 公開警政情報 | canonical public evidence | source health/freshness | EvidenceEnvelope + read-only MCP (#15) | external AI distribution | 不納入內部勤務/個資/操作 command |
| soundbox-offline | offline soundboard/audio | local playback/import | file lifecycle / missing asset repair | local-first no-account | reference-linked library | 不追 cloud social/audio SaaS |
| skill-foundry | agent skill evaluation | candidate identity/promotion | package security | security attestation (#3) | ecosystem manifest compatibility | 不把 hash 當安全證明 |
| video-timeline-pipeline | video intelligence | transcript/timeline/evidence | retrieval/visual/cost reliability | **Evidence-backed CutSpec/NLE handoff (#11)** | paper-cut / evidence reel | 不變成完整 NLE/agent renderer |
| ai-novel-workstation | 長篇小說工作台 | continuity/versioning | scene/character provenance | long-horizon story state | export to external writing tools | 不用單一巨大 prompt 維持全書真相 |
| clinical-scribe-worker | clinical documentation | observed vs inferred separation | specialty/runtime validation | provenance-first scribe | clinician review workflow | 不自動簽署/送出臨床結論 |
| MaterialYouNewTab | new-tab/workspace | fast/local/privacy | session capture/recovery | workspace snapshot preview/restore | browser-native group handoff | 不做 silent continuous monitoring/cloud-first |
| cf-mcp-server | MCP/action server | exact-target auth | confirmation/receipt | capability-scoped action safety | gateway identity propagation | 不做 token passthrough/模糊確認 |
| tick-stock-panel | 市場資訊 panel | timestamp/data source | stale/market-state handling | compact evidence-aware panel | alerts/watch workflows | 不把延遲資料包裝成即時交易建議 |
| herdr-skills | multi-agent skills/orchestration | deterministic skill loading | eval/security | shared promotion/behavior contracts | skill-foundry attestation reuse | 不讓 agent 自我批准高風險工具 |
| ninax-line-hermes | LINE-connected agent | sender/session identity | permission / provenance | message→candidate→approval | evidence receipts across chat | 不讓外部訊息內容變成系統指令 |

---

# Top 10 Cross-Portfolio Ideas

1. **Evidence-to-Action Handoff Contract**：把 evidence 變成 typed candidate，而不是讓人手動重新輸入；本輪實例為 `CutSpec`。
2. **Preview before Promotion**：Paper Edit、workspace snapshot、PolicySpec、clinical CaseSpec 都再次支持 candidate → preview → promote。
3. **Exact Source Identity Survives Transformation**：摘要、slide、cut、法律引用、情報發布都應保留 exact source/revision locator。
4. **Interoperability before Full Editor**：優先輸出 OTIO/API/MCP/structured handoff，而不是每個產品各建一套完整 GUI。
5. **Runtime Verification over Schema Success**：NLE import、MCP action、provider response、browser restore 都需要真 runtime canary。
6. **Attention / User-Needed State**：agent / dashboard 類產品應優先回答「現在什麼需要我處理」，而非單純加更多狀態卡。
7. **Origin-aware Memory and Context**：外部 observation 即使被摘要，也不能洗白成 trusted instruction。
8. **Capability + Scope + Exact Approval**：agent/tools/actions 不採全信任；approval 綁 exact target/effect。
9. **Version / Lifecycle Metadata**：模型、教材、policy、source、memory、CutSpec 都需要版本與 stale semantics。
10. **Capture Existing User State**：瀏覽器 session、既有 transcript selections、SOP、教師 case truth 都比要求使用者重新描述一次更有價值。

---

# Ideas Rejected / Deferred

## REJECT — 把 video-timeline-pipeline 直接做成完整 AI video editor

理由：會重做 Premiere/Resolve/Descript/OpenEdit 的最大面積，同時把本專案目前最強的 evidence/intelligence/caching 優勢稀釋。先做 typed handoff 能取得大部分 workflow value，風險與 maintenance surface 小很多。

## REJECT — 直接用 Adobe「快速建立 sequence」宣稱本產品一定節省 X%

理由：Adobe 產品頁只證明功能存在，不證明 Reese-max corpus、ASR、使用者工作流的實際成效。

## DEFER — AI 自動決定哪些片段必須剪進 final video

理由：可以作 CandidateCutList suggestion，但在 evidence selection / time alignment / cut export 仍未 runtime 驗證前，不應把 LLM suggestion 提升成 production authority。

## DEFER — cf-ai-router 複製 Envoy AI Gateway v1.1 全套

理由：Envoy 的 token counting、stream failover、MCP routing、OTel 都是有價值的市場基線，但 Reese-max 目前已有更具體的 #1 reliability profile 與 #2 Responses API research；先驗證 owner-valued use case，不做 enterprise feature parity。

## DEFER — ppt-studio 立即補 Gamma mobile + Slack + analytics

理由：Gamma 的市場方向成立，但 `ppt-studio #3` 已選擇與本產品更貼合的 source/claim provenance；若將來出現真實 mobile/Slack workflow evidence，再獨立評估。

---

# Issue Mapping

| Repository | Issue | Action this round | Reason |
|---|---|---|---|
| video-timeline-pipeline | #11 | **CREATED** | Adobe 26.5 Paper Edit + Descript + OpenEdit 形成強而近期的 workflow signal；無 duplicate/PR/lock fingerprint |
| video-timeline-pipeline | #10 | NO CHANGE | visual evidence escalation 與 CutSpec handoff 不重複 |
| cf-ai-router | #1 / #2 | NO NEW ISSUE | Envoy v1.1 signal 已落在既有 reliability / Responses research 的相鄰範圍，先完成既有研究 |
| ppt-studio | #3 | NO NEW ISSUE | Gamma 8/28 signal 已存在於 provenance Issue，不重複開 mobile/connectors feature |
| MaterialYouNewTab | Issues disabled | NO CHANGE | 上一輪 session snapshot 高價值機會仍保留中央 radar，不修改 repo settings |

---

# Sources

## Official / primary
- Adobe Premiere 26.5 release notes — last updated 2026-09-09: https://helpx.adobe.com/premiere/desktop/whats-new/release-notes.html
- Adobe Paper Edit — last updated 2026-09-09: https://helpx.adobe.com/premiere/desktop/edit-projects/edit-video-using-text-based-editing/create-a-sequence-with-paper-edit.html
- Adobe Premiere plans — checked 2026-09-10: https://www.adobe.com/uk/products/premiere/plans.html
- Descript Quick Editor — updated 2026-07-29: https://www.descript.com/blog/article/quick-editor-for-screen-recordings
- Descript changelog — 2026-08-05: https://feedback.descript.com/changelog/release-round-upaugust-5th-2026
- Descript pricing — checked 2026-09-10: https://www.descript.com/pricing
- VEED OpenEdit announcement — updated 2026-08-19: https://www.veed.io/newsroom/openedit-by-veed
- VEED OpenEdit product page — checked 2026-09-10: https://www.veed.io/tools/openedit
- VEED OpenEdit help — checked 2026-09-10: https://support.veed.io/en/articles/16342833-how-to-use-openedit-veed-s-agent-driven-video-editor
- Envoy AI Gateway v1.1 — 2026-08-21: https://aigateway.envoyproxy.io/release-notes/v1.1/
- Gamma changelog — 2026-08-28: https://ideas.gamma.app/changelog/whats-new-in-gamma-august-28

## Community signals — anecdotal only
- VoidCutter Premiere plugin — 2026-08-25: https://www.reddit.com/r/premiere/comments/1vy2hd8/i_made_a_free_and_opensource_premiere_plugin_for/
- Premiere transcript unusable case — 2026-04-14: https://www.reddit.com/r/premiere/comments/1sln5ox/premiere_suddenly_cant_create_usable_transcripts/
- Paper Edit Beta discussion — 2026-06-16: https://www.reddit.com/r/premiere/comments/1u7ga43/now_in_beta_paper_edit_to_text_based_editing/
- Transcript CSV re-import/copy-paste friction — 2025-12-03: https://www.reddit.com/r/premiere/comments/1pdkm7o/transcript_problems/

---

# What Changed Since Last Radar

上一輪主要變化是瀏覽器 new-tab / workspace 市場把「當前 browser state → versioned local snapshot → preview/diff → bounded restore」做成產品核心；本輪則看到另一個相同的更廣泛模式進入專業影音市場：**「已存在的 transcript/evidence state 不應要求使用者再人工翻譯成另一套工具操作。」**

Adobe 在 2026-09-09 正式把 transcript selections 直接升格成 editable sequence，讓這個模式不再只是新創 / plugin / AI demo，而是 professional NLE 的 current capability。對 `video-timeline-pipeline` 而言，最適合吸收的不是 full editor，而是把現有 evidence 轉成 versioned, reviewable, interoperable `CutSpec`。

本輪新增的 Portfolio 原則：

**`Canonical Evidence → Typed Intent → Preview / Validation → Interoperable Handoff → Runtime Verification → Receipt`**

也就是：如果系統已經知道「使用者要哪一段」，下一步不應再叫使用者自己抄一次 timecode。