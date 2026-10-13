# 外部競品／新品／工作流靈感雷達 — 2026-09-15T06:05:22Z

> 查閱日：2026-09-15（UTC；臺灣時間同日）。
>
> Issue Quality：`issue_quality_version: 2`；規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`（`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`）。
>
> 本輪只做公開網路研究、repository/Issue/PR/audit 唯讀核對、建立一張 research tracker 與本報告；沒有修改產品原始碼、CI/config、secret、權限、repository settings，沒有建立實作 branch、merge/deploy、啟動 worker/run/GOAL，也沒有付費或變更正式資料。

## Executive Summary

延續上一輪 `2026-09-15T040555Z-external-radar.md` 的 cold-rotation cursor，本輪深讀 `Reese-max/video-timeline-pipeline`。重新完整列舉 connected owner inventory：**42 個 Reese-max owned repositories，3 archived、39 owned + unarchived**；沿用前輪校準的 **36 product-like + 3 support/compatibility-only** 範圍，沒有操作他人 repository。

本輪真正的新產品訊號不是「再加一個 AI video editor」。Adobe Premiere 26.5 已在 2026-09-09 把 Paper Edit 與 Generative Media 拉進 timeline；這與既有 #11 / PR #15 的 evidence→NLE handoff fingerprint 高度重疊，因此 `SKIPPED_LOCKED`，不重貼、不搶活躍 scope。TwelveLabs 的 2026-08-31 Marengo 3.5 與現行 Jockey / pricing 也繼續證明 hosted video intelligence 正在成熟，但其 per-hour / per-query 計價反而支持本產品維持 local-first，不是遷移理由。

**新且不同的 gap 是 source provenance intake。** Premiere 在 2026-08-14 的 Content Credentials 流程已能對匯入媒體掃描 C2PA，YouTube 在 2026-05-27 公布的 AI disclosure 流程把「C2PA metadata 表明 fully generative AI」列為不可由創作者移除 disclosure 的情形；C2PA 在 2026-07-31 / 08-11 又發布更明確的 synthetic/non-synthetic implementation guide。`video-timeline-pipeline` 已有 source fingerprint、`source.probe.json`、時間戳與 evidence provenance，但目前 repo/Issues 沒有 C2PA / Content Credentials validator。若原始檔真的帶 credential，使用者仍需跳到外部 verifier 查，再人工轉抄；如果是社群轉碼副本，credential 可能消失，absence 又不能推導為「非 AI」。

因此建立 **#20 `[Research][RESEARCH_REQUIRED][Competitive Inspiration] 驗證 C2PA 來源憑證是否值得納入影片證據入口`**。它不是 feature approval：

```yaml
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: MEDIUM
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime: NEEDS_RUNTIME_VERIFICATION
```

最小研究先不改產品程式，只以 4 類固定 MP4/MOV fixture + 官方/開源 local validator 回答：實際支援的 input path 能否保留/驗證 C2PA？能否安全區分 `PRESENT / VALID / TRUSTED / CLAIMS / ABSENT / UNKNOWN`？若不能，就 NARROW 或 REJECT，不建立 signer、AI detector、trust registry 或跨 portfolio framework。

**本輪：1 新 Research Issue、0 既有 Issue scope 修改、0 新實作授權。**

---

# Scope / Repository Truth

## Portfolio enumeration

Owned + unarchived（39）：

`92-duty-scheduler`, `academic-mcp`, `adng-memory`, `ai-flight-radar`, `ai-novel-workstation`, `autodev-ng`, `avatar-vfo`, `cf-ai-router`, `cf-mcp-server`, `chatgpt-dual-pipeline`, `claude-mem`, `clinical-scribe-worker`, `cyber-prep-coach`, `exam-archive`, `flux-image-gen`, `google-maps-personal-mcp`, `herdr-skills`, `internship-notes-sites-mirror`, `lobsterpulse`, `lplrs-judicial-sync`, `MaterialYouNewTab`, `minideck`, `neciken-summer-poem`, `ninax-line-hermes`, `note-filler`, `police-exam-archive`, `police-exam-practice`, `ppt-studio`, `project-doctor-web`, `prompt-autoresearch`, `skill-foundry`, `soundbox-offline`, `spotify-playlist-organizer-mcp`, `taichung-police-intel`, `taiwan-intel-dashboard`, `tick-stock-panel`, `UkePack`, `video-timeline-pipeline`, `voice-actress`.

Archived / excluded：`gemini-deidentifier`, `obsidian-vault`, `openab`。

Support / compatibility-only：`adng-memory`, `internship-notes-sites-mirror`, `police-exam-practice`。

本輪 inventory 不是沿用舊報告猜測，而是重新透過 connected GitHub owner listing 取得；page size 100 已覆蓋目前 42 筆結果。

## Current product truth — `video-timeline-pipeline`

- Default branch：`main`。
- Rechecked HEAD before Issue write：`df0bbba4fea0d8e8197fe2f5e48625d4b005aaa1`（2026-09-13，50-persona audit round 3 documentation）。
- 最近實質 default-branch product commits：`dc421fef...` cost tracking / budget guard、`4afaf6bf...` scoring、`0a2016be...` notification/digest。
- 核心工作：把 local / URL video 轉成 reusable evidence/knowledge：FFmpeg probe/extraction、Groq Whisper、OCR/MiniMax vision、timeline、summary、SRT、Search/Ask、cache、RSS/social intake、notifications/scoring/cost guard。
- Repo 現有來源控制：source fingerprint、`source.probe.json`、job workspace、artifact caches、timestamps；它能證明「pipeline 分析的是哪個本機來源 revision」，但不是外部 creator/tool provenance validator。
- `source.probe.json` 目前主要是 ffprobe + source fingerprint cache；repo search 找不到 `C2PA` / `Content Credentials` integration。
- Roadmap #7 的 owner-facing方向仍是「主動摘要、可追問、可監控」的 local-first video intelligence；不是 full NLE、hosted video platform 或通用 media forensics suite。

## Current known higher-priority work

2026-09-13 audit round 3 仍標示：
- #18：`COST_TIMEZONE` daily/monthly accounting boundary defect，P2；PR #19 active。
- #8：Bright Data Instagram paid discovery 必須有 finite provider-work bound，P2；PR #14 active。

本輪新 #20 明確低於這兩張已證實 P2 的修復優先級；外部競品趨勢不把 research 自動升級成 P1/P2。

## Active PR / coordination truth

本輪 read-only 核對 all-state recent PR：
- #19 → #18 cost timezone
- #17 → #7 roadmap snapshot
- #16 → #10 visual evidence escalation
- #15 → #11 paper cut / NLE handoff
- #14 → #8 Bright Data budget
- #13 → #6 read-only dashboard
- #12 → #5 search/category
- #9 IRISX/LINE Bright Data cascade
- #1 older pipeline optimization

因此本輪對 #10 / #11 的相關外部訊號只寫中央報告，標 `SKIPPED_LOCKED`；不留言、不改 acceptance scope。

---

# Product → Market Category

`video-timeline-pipeline` 目前同時落在五個相鄰市場，但產品中心只取其交集：

1. **Video intelligence / searchable video knowledge**：TwelveLabs、Gemini video understanding 等。
2. **Transcript-first editing / NLE handoff**：Adobe Premiere Paper Edit、Descript 等。
3. **Agentic visual evidence retrieval**：Gemini agentic video、long-video research；既有 #10。
4. **Local-first evidence / provenance pipeline**：來源 hash、timestamp、citation、read-back。
5. **Media content provenance / Content Credentials**：C2PA、Adobe Content Credentials、platform AI disclosure；本輪新研究面。

產品不應因第 1–3 類競品功能很多就變成 full hosted editor / model platform。真正能強化北極星的是：**輸入證據更可信、來源/時間更可追、人工跨工具 handoff 更少，而且保持 local-first / explicit cloud authority。**

---

# External Signals

## A. Direct competitor update — Adobe Premiere 26.5 把「文字→時間軸→生成素材」留在 NLE 內

**CONFIRMED｜事件/更新：2026-09-09｜查閱：2026-09-15**

Sources:
- https://helpx.adobe.com/cn/premiere/desktop/whats-new/release-notes.html
- https://helpx.adobe.com/de/premiere/desktop/whats-new/whats-new.html

Premiere 26.5 新增/強化：
- Paper Edit：從 transcript 選多行直接建 sequence；
- Generative Media：在 timeline 以文字提示產生 video / sound effects，再當 editable clips 繼續編輯；
- 新 Voice Activity Detection model 與更多 camera/media support。

### JTBD / manual steps
對 dialogue-heavy editing，使用者不必 `看 transcript → 抄 timecode → timeline 手動重建`；對素材缺口，也不必離開 NLE 到另一個生成工具再下載/匯入。

### Distribution / workflow signal
Adobe 把 AI 與 text-based edit 做成 **NLE-native context**，不是另一個聊天產品。能力擁有者（Premiere timeline）執行修改，這與 Reese-max 既有 #11 的 handoff boundary 相容。

### Transfer / do not copy
- 可移植：上游 intelligence 產生 typed candidate / CutSpec，交由 NLE capability owner 執行。
- 不照抄：不把 `video-timeline-pipeline` 變成 Premiere、生成媒體 marketplace 或完整 renderer。
- **Issue mapping：#11 / PR #15 已 active，`SKIPPED_LOCKED`。** 本輪不重貼相同 Paper Edit / generation signal。

---

## A2. Direct video-intelligence substitute — TwelveLabs 的能力成熟，但計價支持「不要把 local core 搬走」

**CONFIRMED｜Release signal：2026-08-19 / 08-31；pricing checked 2026-09-15**

Sources:
- https://docs.twelvelabs.io/docs/get-started/release-notes
- https://www.twelvelabs.io/pricing

近期能力包括：
- Marengo 3.5：video/audio/image/document 等跨模態 embeddings / composed queries；
- direct transcription without indexing、word/sentence/speaker-turn segmentation；
- Jockey / Search 逐步整合 video intelligence workflows。

現行官方 pricing 顯示 Developer 方案的 video indexing 為 **US$2.50/hour**、embedding infrastructure **US$0.09/hour/month**、Search **US$4 / 1,000 queries**，Analyze input video **US$1.75/hour**，另計 output tokens；Free 方案提供有限 indexing hours/access window。這些只是 2026-09-15 當輪價格，不用來捏造 Reese-max ROI。

### Product signal
Hosted indexing + query 能力正在 commodity 化，但持續 index/access 具有外部資料託管與 recurring cost。Reese-max 已有本機 cache/index/evidence，故目前較合理策略仍是：
- MUST MATCH：清楚的 evidence / search quality；
- DIFFERENTIATOR：local-first、可重播 artifact、explicit provider cost authority；
- DO NOT COPY：沒有 runtime / workload evidence 就把整庫搬到 SaaS index。

沒有建立新 Issue；#5/#10 已涵蓋 retrieval/visual quality 的已知工作。

---

## B. Adjacent workflow — Premiere 已把 Content Credentials 變成「匯入時可掃描的來源上下文」

**CONFIRMED｜Adobe Help updated 2026-08-14｜checked 2026-09-15**

Source:
- https://helpx.adobe.com/jp/premiere/desktop/render-and-export/export-files/export-videos-with-content-credentials.html

Premiere 現行 Content Credentials workflow 不只「輸出時加標籤」：官方文件也明確提供在 Project panel 對 imported asset 執行 **Scan for Content Credentials**。支援輸出格式包括 MP4、QuickTime MOV、AVI、WAV、MP3 等，文件把 credentials 描述為可包含 camera-captured、AI-generated、Premiere-edited 等 creation/process context。

### JTBD
編輯者在信任或再利用素材前，希望知道「這個檔案帶了什麼可驗證的來源/生成/修改聲明」，不用先離開 NLE 上傳到另一個 verifier，再人工記住結果。

### Why this matters to Reese-max
`video-timeline-pipeline` 本身就是 evidence ingestion product；它已保存本機來源 hash 與時間證據。如果來源有 signed provenance，而 pipeline 完全不保留 validation status，後續 Search/Ask/CutSpec 雖然能回答「這句話來自哪個本機檔」，卻無法回答「那個檔自己的 signed provenance 說了什麼」。這是不同於 #5 citation correctness、#10 visual coverage、#11 NLE export 的 input-provenance fingerprint。

---

## B2. Platform distribution — YouTube 將 C2PA 變成觀看端 disclosure signal

**CONFIRMED｜published 2026-05-27｜checked 2026-09-15**

Source:
- https://blog.youtube/news-and-events/improving-ai-labels-viewers-creators/

YouTube 目前把 photorealistic / meaningfully AI-altered content disclosure 移到更醒目位置，並自 2026 年 5 月起加入自動 AI signals。更關鍵的是：官方列出「Content containing C2PA metadata indicating they were fully generative AI」作為部分不可由 creator 自行移除 disclosure 的情況。

### Transferable principle
`provider/platform label`、`signed credential`、`pipeline inference` 必須分開來源。Reese-max 不應將 YouTube label 或 C2PA absence 當成二元 AI detector；但若 signed credential 可得，應考慮是否把它視為一種**來源證據 modality**。

---

## C. Emerging technical possibility — C2PA validator / trust-list 工具已足以做 local-only 最小實驗

**CONFIRMED｜C2PA guide published 2026-07-31, updated 2026-08-11；OSS checked 2026-09-15**

Sources:
- https://c2pa.org/a-new-implementation-guide-for-content-credentials/
- https://github.com/contentauth/c2pa-conformance-tool
- https://opensource.contentauthenticity.org/docs/conformance/trust-lists/
- https://github.com/contentauth/c2pa-rs

C2PA 新 implementation guide 明確描述：
- machine-readable `digitalSourceType`；
- AI disclosure assertion；
- video/audio region/segment 級 AI modification localization；
- actions / ingredients 形成可驗證 provenance chain。

官方/Content Authenticity OSS validator 現已能處理 MP4/MOV 等影音格式、做 cryptographic validation 並參照 C2PA trust lists；因此第一個研究**不需要新 SaaS、LLM、資料庫或自建 crypto**。

### Minimal transferable pattern

`source bytes/hash → credential presence → cryptographic validation → trust-list/conformance status → signed claims → separate semantic interpretation`

其中每一層都不能折成一個「真實度」分數。

### Adoption signal
C2PA 於 2026-07-27 公布 TikTok 升為 Steering Committee member。這只證明 ecosystem / platform adoption direction，**不代表 Reese-max corpus 使用率**。

Source: https://c2pa.org/c2pa-welcomes-tiktok-to-steering-committee/

---

# Community Pain / Failure Signals

以下僅為 **COMMUNITY_SIGNAL**，不作發生率：

1. 2026-08-03 一位 OSINT tool 作者描述社群/CDN 重新編碼後常看不到原 Content Credentials，並強調 `ABSENT ≠ evidence of non-AI`。來源：
   https://www.reddit.com/r/osinttools/comments/1vegal0/the_eus_ailabeling_rules_ai_act_article_50/
2. 2026-05-02 一個 YouTube AI filter extension 作者指出 browser content script 取得的是 YouTube transcoded surface，不能對原始 uploaded bytes 做完整 cryptographic verification；其 C2PA UI 只能當 best-available signal。來源：
   https://www.reddit.com/r/youtube/comments/1t20k5a/ai_filter_for_youtube/

這兩個案例只用來設計失敗 fixture：**social/URL input 可能必須標 `UNKNOWN/UNAVAILABLE`，不能用 absence 補猜。** 不採作者的產品準確率或平台普遍性宣稱。

---

# Four-Gate Decision — C2PA Source Provenance Research

## Gate 1 — Problem / value

### Current user
需要把影片轉成可追問、可引用、可追溯 evidence/knowledge 的 local-first 使用者。

### Observable/manual gap
現有 pipeline 能 hash / probe / timestamp 本機來源，但對 C2PA signed provenance 無 validator。若檔案帶 credentials，使用者需跳 Adobe Inspect / validator 再人工轉抄；不查則 signed provenance context 被遺失。

### Repo evidence
- HEAD `df0bbba4...`。
- README / code 有 FFmpeg probe、`source.probe.json`、source fingerprint。
- repo/Issue search 無 `C2PA` / `Content Credentials` tracker。

### Existing alternatives
- 不改：需要時用 Adobe Inspect。
- 文件：可教使用者外部 verify，但仍是跨工具 handoff。
- 重用：官方 `c2pa-rs` / conformance validator 已可本機讀 MP4/MOV。
- 局部修改：只有在 fixture 研究通過後，才考慮 read-only provenance summary。
- 新 service/DB：目前**沒有理由**。

### If we do nothing
低頻情況可以接受；真正損失只出現在「原檔其實有 signed provenance 且使用者需要它」時。因此 severity 不能升級，使用頻率為 UNKNOWN。

## Gate 2 — Priority

```yaml
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: MEDIUM
triage: NEEDS_EVIDENCE
auto_implementation: false
```

Qualitative score rationale：
- User Pain：**UNKNOWN / conditional**。人工 verifier 是真斷點，但頻率未知。
- Strategic Fit：**High**。直接強化 evidence provenance，符合 local-first。
- Novelty：**Medium-High**。不是新標準，但 2026 adoption / video integration 明顯上升。
- Evidence Strength：**High for capability, Low/Unknown for Reese-max demand frequency**。
- Reuse：**Medium**。`flux-image-gen` 已有 C2PA context，但不先造跨 repo framework。
- Effort：**Low for research, UNKNOWN for product integration**。
- Security/Privacy/Cost risk：**Low if local read-only**；trust-list/network fetch、malformed manifests、identity claims 仍需限制。

這不比 #8/#18 更優先，也不是 P1/P2 defect。

## Gate 3 — Minimum solution

最小不是新增 parser module，而是 **0 product-code fixture experiment**：

1. valid/trusted C2PA MP4；
2. manifest present but invalid/tampered；
3. no-credential MP4/MOV；
4. 若合法取得，同 source 經一條公開 transcode/distribution path 後的副本。

以 official/open local validator 讀取，記 asset hash、tool version、trust list、result。回答：
- pipeline 支援的來源容器能否驗？
- social/download path 是否保留？
- 狀態能否被安全表達為多維 evidence，而不是 false binary？

## Gate 4 — Research / implementation separation

Research exit：
- **BUILD**：至少一條實際支援 input path 可穩定驗證，且能消除 external verifier + manual copy；下一步只允許 read-only provenance summary proposal。
- **NARROW**：只對 local/original file 有效；限制 scope，不碰 social-transcoded inputs。
- **REJECT**：代表性 source path 幾乎不可取得 credentials，或外部 verifier 已足夠，沒有重複摩擦。

BUILD **不等於 READY_FOR_IMPLEMENTATION**；仍需 owner/product evidence + minimum acceptance / dependency review。

---

# Opportunity Map — `video-timeline-pipeline`

| 類別 | 本輪判斷 | 理由 |
|---|---|---|
| MUST MATCH | 來源 hash / timestamp / evidence citation 不可因新 metadata 路徑回退；任何 provider/cost path 持續 explicit opt-in | 這些是目前產品真值與安全基礎 |
| MUST MATCH | `ABSENT != NON_AI`、`VALID CREDENTIAL != FACTUAL TRUTH` | C2PA/YouTube/Adobe workflow 都要求 provenance 與內容判斷分離 |
| SHOULD BE BETTER | 若 input 有可驗 signed provenance，避免要求使用者跳外部 verifier 再轉抄 | 與 local evidence intake 直接相鄰；先研究頻率/保留率 |
| SHOULD BE BETTER | NLE handoff 繼續由 #11 / PR #15 完成，不再建立另一套 editor | Adobe 26.5 再次驗證方向，但 active scope 已有人處理 |
| DIFFERENTIATOR | `local source hash + exact timestamp evidence + optional signed provenance context` | 比單純 hosted video search 更可重播/可稽核；仍需 runtime 證據 |
| ADJACENT IDEA | 未來 CutSpec 可攜帶已驗 source-provenance reference | 只有 #20 BUILD 且 #11 landed 後才考慮，不是本輪 scope |
| DO NOT COPY | Premiere full editor / timeline generation / media generation marketplace | 偏離 video intelligence core，維護與成本大 |
| DO NOT COPY | TwelveLabs hosted index 作預設 canonical store | local-first 已有價值，且 current pricing / retention / recurring infra 是產品設計差異 |
| DO NOT COPY | C2PA signer、identity/KYC、AI detector、truth score | provenance ≠ truth；沒有 user/job evidence 支持擴張 |

---

# Adjacent / Cross-Portfolio Ideas

本輪只有兩項足夠保留，不湊 Top 10：

1. **`ABSENT != NEGATIVE` provenance semantics**：適用 `video-timeline-pipeline` 與已有 C2PA work 的 `flux-image-gen`。無 credential / watermark / provenance signal 只能是 `ABSENT/UNKNOWN`，不可推導「真人」「未 AI」「可信」。保留為共用產品原則，不另建框架 Issue。
2. **Cryptographic provenance is a separate evidence modality**：`source_hash`, `signed provenance`, `semantic content`, `model inference`, `human approval` 應保持不同欄位/receipt；不要用一個 confidence score 混合。這可供其他 evidence-heavy product 參考，但沒有跨專案工程立案。

---

# Rejected / Deferred Ideas

1. **把 Premiere 26.5 Generative Media 直接搬進 pipeline** — REJECT NOW。Capability owner 是 NLE；#11 已有 handoff 研究，且 PR #15 active。
2. **為 #20 先建 provenance DB / registry / trust service** — REJECT。沒有 fixture/runtime evidence，也沒有 demand frequency；官方 local tools 已足以研究。
3. **把 C2PA absence 當 AI detector feature** — REJECT。平台轉碼/metadata loss 會產生 false negatives；與標準語意相反。
4. **自建 signer / creator identity / credential issuance** — REJECT。輸入 evidence product 沒有此 JTBD；新增身份、金鑰、安全/法遵維護負擔。
5. **將整個 video library 搬到 TwelveLabs** — DEFER/DO NOT COPY。現有 local-first index/cache 已存在；沒有品質/運維實測證明搬遷值得 recurring hosted cost / data boundary。
6. **為 Adobe Paper Edit 再開一張 competitive Issue** — DUPLICATE / SKIPPED_LOCKED。#11 + PR #15 已涵蓋同一核心 workflow。

---

# Issue / PR Mapping

## New

- **`Reese-max/video-timeline-pipeline #20`** — `[Research][RESEARCH_REQUIRED][Competitive Inspiration] 驗證 C2PA 來源憑證是否值得納入影片證據入口`
  - URL: https://github.com/Reese-max/video-timeline-pipeline/issues/20
  - fingerprint：source ingest/evidence + signed C2PA provenance present + pipeline can hash local bytes but cannot validate/surface signed provenance + manual external verify/copy.
  - classification：`RESEARCH / NOT_ESTABLISHED / MEDIUM / NEEDS_EVIDENCE / auto_implementation=false`。
  - runtime：`NEEDS_RUNTIME_VERIFICATION`。
  - New-Issue duplicate check：open/closed Issues + all-state PR + roadmap/audit；未找到相同 C2PA / Content Credentials fingerprint。
  - 建立後有效 `github-issue-lock:v1` marker 已以 Issue #20 正確編號留言並讀回確認；完成本輪寫入後需 release。

## Existing / no write

- #10 / PR #16 — agentic visual evidence escalation：Adobe/TwelveLabs 的 task-aware evidence signal 仍支持方向，但 active，`SKIPPED_LOCKED`。
- #11 / PR #15 — evidence-backed NLE handoff：Premiere 26.5 Paper Edit/Generative Media 是新直接證據，但同 fingerprint 且 active，`SKIPPED_LOCKED`。
- #8 / PR #14 — Bright Data finite bound P2：未被外部 radar 重新分流；仍高於 #20。
- #18 / PR #19 — COST_TIMEZONE P2：未被外部 radar 重新分流；仍高於 #20。
- #5 / #7：本輪沒有實質新證據需要改 scope。

---

# Sources

## First-party / official

1. Adobe Premiere 26.5 release notes — updated 2026-09-09, checked 2026-09-15  
   https://helpx.adobe.com/cn/premiere/desktop/whats-new/release-notes.html
2. Adobe Premiere Content Credentials — updated 2026-08-14, checked 2026-09-15  
   https://helpx.adobe.com/jp/premiere/desktop/render-and-export/export-files/export-videos-with-content-credentials.html
3. YouTube, Improving AI labels for viewers and creators — published 2026-05-27, checked 2026-09-15  
   https://blog.youtube/news-and-events/improving-ai-labels-viewers-creators/
4. C2PA, A New Implementation Guide for Content Credentials — published 2026-07-31, updated 2026-08-11, checked 2026-09-15  
   https://c2pa.org/a-new-implementation-guide-for-content-credentials/
5. C2PA, TikTok joins Steering Committee — event 2026-07-27, checked 2026-09-15  
   https://c2pa.org/c2pa-welcomes-tiktok-to-steering-committee/
6. Content Authenticity / C2PA conformance tool — current docs checked 2026-09-15  
   https://github.com/contentauth/c2pa-conformance-tool
7. C2PA trust lists — current docs checked 2026-09-15  
   https://opensource.contentauthenticity.org/docs/conformance/trust-lists/
8. TwelveLabs release notes — current page checked 2026-09-15  
   https://docs.twelvelabs.io/docs/get-started/release-notes
9. TwelveLabs pricing — current price checked 2026-09-15  
   https://www.twelvelabs.io/pricing

## Community / anecdotal only

10. OSINT Content Credentials / metadata-stripping discussion — 2026-08-03  
    https://www.reddit.com/r/osinttools/comments/1vegal0/the_eus_ailabeling_rules_ai_act_article_50/
11. YouTube browser-extension developer discussing transcoded media / C2PA limitations — 2026-05-02  
    https://www.reddit.com/r/youtube/comments/1t20k5a/ai_filter_for_youtube/

社群來源只用來設計 failure modes；沒有當 prevalence、accuracy 或 ROI evidence。

---

# What Changed Since Last Radar

Compared with `2026-09-15T040555Z-external-radar.md`：

1. Cold rotation 從 `skill-foundry` 推進到 `video-timeline-pipeline`。
2. 發現 **input-source signed provenance** 與既有 timestamp/source-hash provenance 不同；建立窄研究 #20。
3. Adobe Premiere 26.5 的 Paper Edit / Generative Media 屬 #11 same fingerprint；因 PR #15 active，不重貼/不搶 scope。
4. C2PA / YouTube / Adobe 的 2026 adoption signal 被收斂成「是否值得 local read-only validation」而不是大型 provenance subsystem。
5. TwelveLabs current pricing 被當成 business-model/product boundary signal：不以競品 hosted capability 推導本產品應遷移。
6. #8 / #18 既有 P2 reliability/cost work 保持更高優先級；#20 沒有 severity inflation。

---

# Runtime / Evidence Boundary

本輪**沒有**：
- 執行 `c2pa-rs` / `c2pa-conformance-tool`；
- 對真實 MP4/MOV 驗 C2PA；
- 上傳任何私人影片；
- 呼叫 Groq/MiniMax/TwelveLabs/Adobe paid API；
- 測 YouTube 下載檔是否保留 C2PA；
- 執行 NLE import canary；
- 執行 autodev worker/run。

因此 #20 明確為 `NEEDS_RUNTIME_VERIFICATION`；公開文件只能支持 capability/standard/adoption，不能證明 Reese-max input corpus 的 C2PA availability 或 user value。

---

# Completion / Gaps / Cursor

完成：
- 重新分頁核對 owned inventory：42 owned / 39 unarchived；
- 讀 Issue Quality v2 並記 blob SHA；
- 深讀 `video-timeline-pipeline` current HEAD、README、audit、roadmap、Issues、all-state recent PR；
- 外部 A/B/C 探索與當輪 pricing/capability check；
- duplicate / active-work coordination；
- 建立 #20，無實作授權；
- 建立本唯一 radar report。

未完成 / deliberately deferred：
- #20 local fixture experiment；
- social-transcode credential survival rate；
- real-user demand frequency；
- #10/#11 active PR scope changes（因 active ownership，未碰）。

公平輪巡：`voice-actress` 已在 2026-09-14 同日較近期深讀並建立 #12，為避免熱點重複，**下一個 cold-rotation cursor：`92-duty-scheduler`**。

本輪不宣告 portfolio CLEAN。
