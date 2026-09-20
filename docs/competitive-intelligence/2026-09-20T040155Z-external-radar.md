# External Competitive Radar — 2026-09-20T04:01:55Z

Status: **COMPLETE**

查閱日：2026-09-20。主要市場證據來自 GitHub 之外的公開產品／開發者文件；GitHub 僅用於確認 Reese-max 自有 repo、產品方向、default-branch 現況、Issue/PR 去重與報告寫入。

## Scope / Direction Check

- Governing rule：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`
- Fresh connected owner inventory：本輪實際分頁列舉 **42 個 Reese-max-owned repositories / 41 個未封存**；page 2 為空，唯一 archived repo 為 `obsidian-vault`。不沿用舊 inventory 當全集。
- Fair-rotation focal repository：`Reese-max/UkePack`，承接上一輪 `2026-09-20T020239Z-external-radar.md` 的游標。
- Default branch：`master@56bcdb78da1e27529d70a9de71aa3414ddfcfb36`；報告寫入前重新核對仍未漂移。最新 default-branch commit 是 2026-09-09 的 audit 文件更新。
- Owner/Product Board 方向：**INVEST，但收斂在 teacher-reviewed practice-pack production**；先恢復 release/security truth 與真人 teacher time-to-value，再談 account/roster/billing/marketplace/new instruments。不要自研完整 AI transcription engine，不做 consumer song catalog/full LMS。
- North star：一首歌從匯入到小朋友能彈出第一段 < 30 分鐘。Teacher Trial 目前真實老師 feedback count 仍是 0，真人邀請/試用/結論屬 owner-only blocker。
- Open PR coordination：#10/#8/#4 仍處理 #2 governance parser；#6 處理 #5 legacy custody；#7 是 #3 workshop pack-set research plan。這些 scope 均不搶改。
- 本輪未改產品原始碼、CI/config、secret、permissions/settings；未建立 implementation branch、merge/deploy、啟動 GOAL/worker、付費 OMR job、外部正式資料寫入。

## Product → Market Category

`UkePack` 目前最適合視為：

1. MusicXML/MIDI/manual-chord 之後的 **teacher-reviewed ukulele teaching-material production layer**；
2. 以 chord simplification、level differentiation、practice audio、PDF、review/share 為核心的 last-mile 教學工具；
3. upstream transcription/OMR provider 的 consumer，而不是 transcription model 本身；
4. privacy-minimal family / workshop distribution candidate，而不是 child-account LMS。

## External Signals

### A. CONFIRMED — Flat 把 PDF／照片樂譜 OMR 在 2026-07-10 正式開放成 Developer API

**事件日期：2026-07-10；查閱：2026-09-20。**

來源：
- https://flat.io/en-GB/edu/changelog/2026-07-10-omr-is-now-available-as-a-developer-api
- https://flat.io/developers/docs/api/omr/

Flat 現在可讓第三方應用把 PDF／照片送入 OMR，追蹤 recognition progress、讓人檢查／修正偵測到的樂器與標題，然後直接取得 MusicXML/MIDI；Interactive Jobs API 可輸出 MusicXML 而不必先存入 Flat library。

這對 UkePack 的價值不是「多一個競品功能」，而是把一個原本需要離開產品手工完成的轉換鏈變得可被 API 化：

`老師手上只有合法可用的 PDF/照片譜 → 外部掃譜/校正 → 匯出 MusicXML → 回到 UkePack`

UkePack 目前實作的正式 intake 是 MusicXML/MIDI/manual chords。PRD 雖寫「匯入現有譜或 MusicXML」，但 default branch 沒有 PDF/photo OMR intake。因此真正候選 workflow gap 是 **跨工具的掃譜→匯出→再匯入 handoff**，不是「缺少 OMR framework」。

反證同樣重要：目前沒有真人 UkePack teacher evidence 證明 PDF/photo 是高頻來源，Teacher Trial feedback 仍為 0；所以這不是已證實缺陷，也不能直接批准整合。

### B. CONFIRMED — Flat 的 OMR contract 本身證明「先 review、再 downstream」比 blind auto-import 更合理

**API 文件現況查閱：2026-09-20；相關 retention API changelog：2026-08-04。**

來源：
- https://flat.io/developers/docs/api/omr/
- https://flat.io/developers/docs/api/changelog

Flat 明確把 Interactive Jobs API 列為較完整路徑：可 review title/instruments、看 progress，再 export MusicXML。Capabilities API 會回傳 runtime limits、`costPerPage`、`remainingCredits` 與 `retentionDays`；2026-08-04 又新增 OMR job data retention/deletion controls。官方同時說 handwritten music / tablature 並不在目前支援範圍，clean printed sheet music 最可靠。

可移植模式：如果未來 UkePack 真要接 OMR，應保存「external conversion + human review + output MusicXML」的邊界，不把 provider 產生的 transcription 當成已經 teacher-approved 的 canonical teaching truth。Provider 的 cost/retention/capability 也應在使用當下查，不 hardcode 成永久產品承諾。

不應照抄：不需要新 job DB、provider registry、背景 polling framework 或自己承擔 OMR billing，除非真人研究先證明這條 intake 是核心 bottleneck。

### C. CONFIRMED — Soundslice 在 2026-08-13 仍把 scan 的「人類 review 問題」放在建譜流程內

**事件日期：2026-08-13；查閱：2026-09-20。**

來源：https://www.soundslice.com/blog/311/sheet-music-scan-improvements/

Soundslice 的近期 scan 改進包含在 scan 結尾詢問／確認樂器名稱，並改善中途新增／移除聲部的 instrument linking。這是直接的產品設計訊號：成熟掃譜產品仍不假設辨識結果可以無檢查直接進 downstream practice workflow。

對 UkePack 的可移植部分只有：若未來 ingest 任何 OMR 結果，teacher review 應保持在 canonical pack 之前。這與既有 teacher-review thesis 一致，不需要新增另一套審核系統。

### D. CONFIRMED — Klangio 在 2026-08-27 把 Transcription Studio 帶到 iOS/iPadOS/Android

**事件日期：2026-08-27；查閱：2026-09-20。**

來源：
- https://klang.io/blog/transcription-studio-mobile-app/
- https://studio.klang.io/

Klangio 現在可在手機上 upload audio、貼來源連結或直接錄音，再輸出 editable notation/MusicXML/MIDI。這進一步支持 UkePack 既有 Product Board 邊界：**upstream capture/transcription 正在被專門供應商商品化**。UkePack 沒有證據應該投入 native mobile transcription、錄音模型、YouTube ingestion 或多樂器辨識；標準 interchange + teaching post-processing 更符合目前 wedge。

## New Releases / Market Moves

| Date | Product | Signal | Confidence | Radar consequence |
|---|---|---|---|---|
| 2026-08-27 | Klangio Transcription Studio | 原本 browser transcription 擴到 iOS/iPad/Android | CONFIRMED | 不追 mobile transcription breadth；維持標準 MusicXML intake |
| 2026-08-13 | Soundslice | 掃譜後加入更明確 instrument review/linking | CONFIRMED | 若 ingest OMR，保留人類 review 邊界 |
| 2026-08-04 | Flat OMR API | 新增 retention/deletion capability | CONFIRMED | 外部素材／結果不可假設永久；若未來整合要顯示 provider data lifecycle |
| 2026-07-10 | Flat OMR API | PDF/photo → review → MusicXML/MIDI 可程式化 | CONFIRMED | 形成可驗證的「減少跨工具轉換」候選，但尚無真人需求證據 |

## Community Pain

本輪沒有把 Reddit/HN 單一案例拿來當需求頻率。烏克麗麗社群確實可找到「把 piano/keyboard sheet 轉成 ukulele tab」與 PDF-based practice 的個別需求，但這類 anecdote 不能替代 UkePack 的真人 teacher trial，因此只作背景，不用來升級 severity 或建單。

## Adjacent Ideas

### 1. 先問「老師拿什麼來源來」，再決定是否接 OMR

最小下一步不是 API integration，而是在既有真人 teacher trial / #3 research session 中多記一項 source-intake observation：實際來源是 MusicXML、MIDI、手動和弦、PDF、照片、音訊還是其他？從原始素材到 UkePack-ready input 需要幾個跨工具步驟、是否出錯、是否因轉換而放棄？

這不需要新 schema、DB、provider 或 background worker。

### 2. 若需求成立，第一個 prototype 也應是「external conversion bridge」，不是自研辨識

只用 1–2 頁 public-domain / 自有權利 clean printed score 做 isolated experiment：比較目前手工外部轉換與 provider OMR → reviewed MusicXML → existing UkePack pipeline。記錄 provider version/time、review corrections、conversion failure、rights assertion 與 retention/cost evidence。

研究可以得到 BUILD/NARROW/REJECT，但 BUILD 只代表下一個最小 delivery 值得討論，不代表自動開始實作或付費。

### 3. Upstream capture commodity；downstream teaching truth 才是 UkePack 的核心

Klangio/Flat/Soundslice 的共同方向是更方便取得 machine-readable score。UkePack 應繼續把差異化放在：「這份轉譜如何簡化成孩子能彈、老師如何校正、如何分 Level、如何安全分享／列印」。

## Opportunity Map — `UkePack`

| Bucket | Decision | Evidence / reason |
|---|---|---|
| MUST MATCH | Release/security/auth truth，且不因新功能弱化 source/license boundary | #2/#5 active remediation；Product Board 明確先修可靠性 |
| SHOULD BE BETTER | 若真人證據證明 source conversion 是高摩擦，減少 PDF/photo → MusicXML → UkePack 的跨工具 handoff | Flat OMR API 讓最小 bridge 可行；目前需求頻率 UNKNOWN |
| DIFFERENTIATOR | 一份合法來源 → teacher-reviewed、child-friendly、Level 1/2/3 practice packs | Owner-approved wedge；Klangio/Flat 主要解 upstream transcription |
| ADJACENT IDEA | 可選 OMR conversion bridge，輸入後仍進既有 teacher review；保留 provider source/retention/cost truth | Flat + Soundslice patterns |
| DO NOT COPY | 自研 OMR/transcription model、native mobile recorder/transcriber、consumer song catalog、full LMS/child accounts | 與 MISSION/Product Board 非目標衝突，且 incumbent/provider 已在商品化 |

## Four-Gate Review

### Candidate — PDF/photo score → reviewed MusicXML intake bridge

**Gate 1 — 問題／價值：PARTIAL。** Repo truth 顯示正式 intake 仍是 MusicXML/MIDI/manual chords；老師若只有 PDF/photo 必須先在別處轉換。Flat 現在提供直接 MusicXML API，證明這個 handoff 技術上可以縮短。反方證據：UkePack 真人 teacher feedback 仍為 0，沒有觀察到這個 handoff 實際造成任務失敗或高頻返工。

**Gate 2 — 優先級：**
- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=MEDIUM`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`
- runtime：`NEEDS_RUNTIME_VERIFICATION`

不升 P2/P1：競品功能與 API 可用性不是產品缺陷證據；也沒有真人完成率／恢復性損失。

**Gate 3 — 最小方案：** 第一階段只把 source-format / conversion handoff 納入既有真人 teacher trial 的觀察項；若沒有實質摩擦就 REJECT。只有觀察到明確問題，再做單一 public-domain fixture 的 external OMR prototype。比「新增 PDF 上傳入口 + job database + billing + provider abstraction」更小。

**Gate 4 — 研究／實作分離：** #3 已有 active PR #7 且本身就在研究 teacher workflow；本輪不搶改 #3、不另開重疊 research ticket。新證據只保留在中央 radar。任何未來 provider call、付費、正式檔案上傳或產品 integration 仍需獨立授權。

Result：**CENTRAL CANDIDATE ONLY / SKIPPED_ACTIVE_RESEARCH_SCOPE / NO NEW ISSUE.**

## Issue / PR Mapping

- #2 — release/governance parser reliability；open PR #10/#8/#4，**SKIPPED_ACTIVE_PRS**。
- #5 — legacy project custody；open PR #6，**SKIPPED_ACTIVE_PR**。
- #3 — privacy-minimal workshop/teacher workflow research；open PR #7，**SKIPPED_ACTIVE_RESEARCH_SCOPE**。OMR intake question可在未來真人 study 裡觀察，但本輪不留言、不改 scope。
- #9 — section-linked in-page practice research；既有 radar 已涵蓋 Soundslice practice/sync pattern。本輪 scan/OMR signal 是不同 lifecycle stage，不重開 player 類 Issue。
- New Issues：**0**。
- Existing Issue edits/comments：**0**。
- PR edits/comments：**0**。
- Implementation authorization：**0**。

## Cross-portfolio Ideas

保留一個可重用原則，不建立跨 repo framework：

> 外部 AI／轉換 provider 的輸出若會進入 canonical workflow，先記「來源、取得時間、provider capability/retention/cost truth、是否經人類 review」，再決定它能支撐什麼 claim；provider output 不自動等於使用者批准的事實。

只有真正有外部轉換來源的 repo 才適用，不從這個原則批量開單。

## Rejected / Deduplicated Ideas

1. **直接建立 Flat OMR integration Issue — HOLD。** 技術供應已成熟，但 UkePack 真人 source-format friction 尚未建立，且 #3 正在 active research scope。
2. **自研 PDF/photo OMR — REJECT。** 明確違反既有非目標，也沒有相對 provider 的必要性證據。
3. **照 Klangio 做 native mobile transcription app — REJECT。** Upstream capture 已被專門產品商品化，會把 UkePack 拉離 teaching-pack thesis。
4. **把所有 OMR result 自動當可發布教材 — REJECT。** Flat/Soundslice 自己都保留 review；UkePack 更需要 teacher approval。
5. **重開 Soundslice section-loop / interactive player — DEDUPE #9。** 2026-09-14 radar 已立案；本輪沒有新的 UkePack runtime evidence。
6. **為 OMR 建 provider registry/job DB/billing dashboard — REJECT NOW。** 未通過真人價值 Gate 前屬過度工程。
7. **Teacher accounts / roster / full LMS — REJECT NOW。** Product Board 與 #3 已明確要求先驗證 privacy-minimal pack set。

## Sources

### External / public web

- Flat for Education, 2026-07-10, OMR developer API: https://flat.io/en-GB/edu/changelog/2026-07-10-omr-is-now-available-as-a-developer-api
- Flat Developer, current OMR contract checked 2026-09-20: https://flat.io/developers/docs/api/omr/
- Flat Developer API changelog, v2.25.0 2026-08-04 retention/deletion: https://flat.io/developers/docs/api/changelog
- Soundslice, 2026-08-13 scan improvements: https://www.soundslice.com/blog/311/sheet-music-scan-improvements/
- Klangio, 2026-08-27 Transcription Studio mobile: https://klang.io/blog/transcription-studio-mobile-app/
- Klangio Transcription Studio current product page checked 2026-09-20: https://studio.klang.io/

### Repository evidence

- `UkePack/README.md`, `MISSION.md`, `PRD.md`, `BACKLOG.md`
- `UkePack/.github/quality-audits/2026-09-08-0410-product-board-audit.md`
- UkePack Issues #2/#3/#5/#9 and open PRs #4/#6/#7/#8/#10
- Historical radar: `docs/competitive-intelligence/2026-09-14T095918Z-external-radar.md`
- Governing rule: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`

## What Changed

- 新平台訊號：Flat 在最近 30–90 天把 PDF/photo OMR 從 end-user feature 變成可程式化、可 review、可直接輸出 MusicXML 的 developer primitive，且補上 retention/deletion contract。
- 新競品訊號：Soundslice 持續把 scan review 放在 pipeline 內；Klangio 把 upstream transcription 擴到 mobile。
- 對 UkePack 的實際決策：**先驗證 source-format handoff 是否為真人 teacher bottleneck；不要因 API 存在就做 integration。**
- 本輪沒有證據推翻既有方向；反而更支持「不自研 transcription，專注 teacher-reviewed teaching pack」的產品邊界。
- 0 new Issues；0 Issue/PR comments or edits；0 implementation authorization。

## Classification / Scope Calibration

候選從「可能的輸入便利功能」校準為：`RESEARCH / NOT_ESTABLISHED / MEDIUM / NEEDS_EVIDENCE / auto_implementation=false`。它不阻擋 #2/#5 的可靠性工作，也不凌駕 #3 的真人 teacher research。沒有用競品 API availability、合成 persona 或 marketing claim 升級 severity。

## Completion / Gaps / Cursor

- Fresh owned-repo pagination：完成（42 owned / 41 unarchived；page 2 empty）。
- UkePack owner direction/default branch/issues/open PR/history de-dup：完成。
- 外部 A/B/C 探查：完成（direct/adjacent/provider-platform 均有第一手來源）。
- 真實 UkePack teacher source-format evidence：**缺；NEEDS_EVIDENCE**。
- Flat OMR live/paid call：**未執行；NEEDS_RUNTIME_VERIFICATION**。
- 未宣告 UkePack 或 portfolio CLEAN。
- Next fair-rotation target：`Reese-max/ppt-studio`（沿用 UkePack 上一次 radar 後的已記錄 successor，避免重新挑熱門 repo）。
