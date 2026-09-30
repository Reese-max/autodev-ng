# 外部競品／新品／工作流靈感雷達 — 2026-09-14T09:59:18Z

> 查閱日：2026-09-14。主要市場證據來自 GitHub 之外的公開網路；Reese-max GitHub 僅用於產品範圍、default-branch 現況、Issue/PR 去重與本報告落地。
>
> Issue 開單規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`，`issue_quality_version: 2`，blob `8167e10798071d2276addaff6b201c6b0e904a2a`。
>
> Evidence labels：`CONFIRMED` = 第一方官方資料或直接可檢查 repo truth；`LIKELY` = 合理推論但仍需執行／使用者證據；`COMMUNITY_SIGNAL` = 個別社群經驗；`UNKNOWN` = 資料不足。
>
> Safety：本輪沒有修改產品原始碼、CI、config、secret、權限、repo settings；沒有建立實作 branch、merge、deploy、啟動 agent run 或新 GOAL。唯一產品 repo 寫入是建立一張 `RESEARCH / NEEDS_EVIDENCE / auto_implementation=false` Issue；另新增本中央報告。

---

## Executive Summary

本輪通過 Issue Quality v2 門檻的新增項目只有一個，而且刻意是**窄研究問題，而不是預先批准一個大型互動播放器**：

- `Reese-max/UkePack #9`
- `[Competitive Inspiration][Research][RESEARCH_REQUIRED] Validate section-linked in-page practice before building an interactive player`
- https://github.com/Reese-max/UkePack/issues/9
- `kind: RESEARCH`
- `severity: NOT_ESTABLISHED`
- `triage: NEEDS_EVIDENCE`
- `auto_implementation: false`

### 具體 workflow gap

UkePack 的北極星是「一首歌從匯入到小朋友能彈出第一段，所需時間少於 30 分鐘」。目前產品已經有：

- MusicXML / 手動和弦 → PDF 練習包；
- `ScoreSection(section, start_measure, end_measure)`；
- chord / melody 的 measure + beat；
- 50 BPM / 70% / 100% practice audio；
- 私人分享頁與老師審稿。

但目前私人分享頁仍是：**PDF iframe + 分離的 MP3/MIDI 下載／開啟連結**。因此學員若想只練 Chorus／Verse，實際動作仍可能是「在譜上定位 → 切到音檔 → 手動找位置 → 重播 → 回到譜」。這才是本輪的問題根因；不是「缺少 player framework」。

外部產品顯示「notation/audio/loop 在同一練習上下文」已是成熟模式：Soundslice 可從譜面跳到錄音位置並拖選 loop；2026-08-28 又新增 syncpoint editor 的 detected beats 顯示。Flat for Education 2026-05-21 / 07-17 的更新則直接以「老師不必在 metronome、tuner、PDF 等多個 tab 間切換」作產品設計主張。OpenSheetMusicDisplay 2.0（2026-06-17）顯示 browser-native MusicXML rendering 仍在積極演進。這些只證明模式與可行性，不證明 UkePack 使用者一定需要完整播放器。

因此最小研究不是重做 Soundslice，而是先比較：

`目前 PDF + audio 手工切換`

vs.

`沿用既有 ScoreSection + practice audio 的 section start / optional loop 按鈕`

若簡單 timestamp/deep-link 已足夠，就 `NARROW`；若現況已足夠則 `REJECT`；只有真實 beta 觀察支持才 `BUILD`。

### Scope recalibration

本輪重新列舉 Reese-max 實際 repositories，不沿用 r6 既有清單：

- owned repositories：42
- archived：3
- owned + unarchived：39
- 目前可獨立視為 product-like：35
- support / compatibility-only：3
- 新且內容不足、暫列 `UNKNOWN`：1

關鍵校準：`police-exam-practice` README 已明確說明**已融合進 `police-exam-archive`，本 repo 只保留舊網址相容入口**。所以不再把它當成另一個可獨立吸收競品功能的產品，避免重新製造雙真相。上一輪 36 個 product-like 因此校準為 35；不是產品被刪除，而是範圍分類變準。

---

# 1. Repo enumeration / scope / fair rotation

## 1.1 本輪實際列舉到的 owned repositories

### Product-like（35）

1. `exam-archive`
2. `police-exam-archive`
3. `92-duty-scheduler`
4. `UkePack`
5. `ppt-studio`
6. `voice-actress`
7. `taiwan-intel-dashboard`
8. `autodev-ng`
9. `flux-router`
10. `claude-mem`
11. `lobster-cooker`
12. `prompt-autoresearch`
13. `neciken`
14. `note-filler`
15. `lplrs-judicial-sync`
16. `cyber-prep-coach`
17. `cf-ai-router`
18. `Ai-avatar-memory_backend`
19. `project-doctor-web`
20. `minideck`
21. `chatgpt-dual-pipeline`
22. `taichung-police-intel`
23. `soundbox-offline`
24. `skill-versioner`
25. `video-timeline-pipeline`
26. `ai-novel-workstation`
27. `clinical-scribe-worker`
28. `MaterialYouNewTab`
29. `cf-mcp-server`
30. `tick-stock-panel`
31. `herdr-skills`
32. `ninax-stock-panel`
33. `ai-flight-radar`
34. `academic-mcp`
35. `spotify-playlist-organizer-mcp`

### Support / compatibility-only（3）

- `police-exam-practice` — README 明確指定只做舊網址相容入口；正式題庫／功能在 `police-exam-archive`。
- `adng-memory` — coordination/support state，不當作終端產品灌功能。
- `internship-notes-sites-mirror` — mirror/support artifact，不當作產品功能雷達。

### UNKNOWN（1）

- `google-maps-personal-mcp` — 新出現但目前不足以確認穩定產品用途／北極星；不因 repo 名稱就推測需求或建立 Issue。

### Archived（3，不操作）

- `gemini-deidentifier`
- `openab-cli`
- `obsidian-vault`

## 1.2 Fair rotation

上一輪主要處理 `spotify-playlist-organizer-mcp`。本輪從清單開頭輪巡，深讀：

- `exam-archive`
- `police-exam-practice`（只做範圍重新分類）
- `police-exam-archive`
- `92-duty-scheduler`
- `UkePack`

下一輪游標：`ppt-studio`。

沒有用「本輪看過一部分」冒充完整 35 個產品都做同深度外部研究；未處理產品保留輪巡。

---

# 2. Quality rules / north star / current repo truth

## 2.1 Issue Quality v2

本輪依 `issue_quality_version: 2` 執行：

- 先證明使用者工作斷點，再討論解法；
- `RESEARCH` 不等於缺陷、也不等於實作授權；
- 不把「缺 ledger / registry / framework」本身寫成根因；
- 先比較不改程式、文件、重用、局部修改，最後才談新模組；
- Opportunity Score 不用精確高分取代證據；本輪只做定性排序；
- 允許零 Issue；只有本輪 UkePack 窄研究通過。

## 2.2 Cohort current truth / recent default-branch changes

### `exam-archive`

- current head：`5d74726eed8f507bb9527aff2047945c6de10d79`（2026-09-10，docs audit）。
- repo 根目錄仍幾乎只有 `.github/`、`docs/` 與約 1.35 MB `index.html`，沒有 root README。
- open #1 已經把「先說明 canonical status；若 obsolete，redirect/archive 而不是維護第二來源」列為正式解法。
- 因此本輪不向它追加 AI/adaptive-study 競品功能；先處理產品身份／canonical source 才合理。

### `police-exam-practice`

- current head：`b97b96dbda2dfb0acd571ab98e9995fce0975c6e`（2026-09-11，docs audit）。
- README 明確：已融合至 `police-exam-archive`；本 repo 只保留 redirect/compatibility，query string / hash 應保留。
- Scope decision：從 product-like 降為 compatibility-only；不在此開新學習功能 Issue。

### `police-exam-archive`

- current head：`a0b5dbb9352b5558dbe62445c6452947dbd2501b`。
- 官方考選部題庫：106–115 年，36,760 選擇、5,758 申論、42,518 題；來源、解析、OCR、搜尋、quiz、統計都是正式範圍。
- #60 已經處理 `aggregate-only quiz history → per-question attempt state → deadline-aware review queue`。
- #58 已處理圖片題 fidelity；#61 已處理 dataset denominator truth。
- 本輪 Google / Quizlet 類 adaptive-learning 新訊號與 #60 同 fingerprint，不再重開。

### `92-duty-scheduler`

- current head：`4d7d7d4911ffd580630661a2f71079a2c38c6ae1`（2026-09-14，docs audit；其 parent `f9356a...` 為先前 product head）。
- 正式定位仍是半自動、deterministic constraints、人工覆核、Excel/LINE handoff。
- #19 = empty/conflict → bounded repair plan；#20 = rule authoring/validation；#22 = post-publish Duty Inbox / LINE self-service request lifecycle。
- P0 #14/#15 仍是 authorization boundary；本輪不因 Deputy/其他 SaaS 更新而再開 self-service / AI scheduling Issue，也不擴權。

### `UkePack`

- current head：`56bcdb78da1e27529d70a9de71aa3414ddfcfb36`（2026-09-09，docs audit）。
- North star：一首歌從匯入到小朋友能彈出第一段 < 30 分鐘。
- 已有 MusicXML、段落、慢速 audio、PDF、老師審稿、share link。
- `share_preview.html`：PDF iframe + 每種 variant 的 MP3/MIDI link；尚未找到 section-linked seek/loop interaction。
- `ScoreSection` 已有 `section/start_measure/end_measure`；Chord/Melody 也保留 measure/beat。
- open #3 已刻意要求在建立 teacher accounts/roster 前先驗證 privacy-minimal workshop pack-set；本輪完全不推翻該 owner/產品邊界。
- active PR #6 是 legacy token custody，與本輪 practice workflow 不同 fingerprint。

---

# 3. External Signals

## A. Direct competitor / same-job signals

### A1. Soundslice：practice 產品把「譜 ↔ 錄音 ↔ passage loop」放在同一上下文

**CONFIRMED — current product, accessed 2026-09-14**

Sources:
- https://www.soundslice.com/
- https://www.soundslice.com/help/en/player/basic/4/looping/
- https://www.soundslice.com/blog/notation-editor/
- https://www.soundslice.com/plans/

Recent change:
- Soundslice product-updates index列出 **2026-08-28**「See detected beats when editing syncpoints」。
- 2026-05-22 release notes 也持續改善 synced playback，包括 device audio-latency 自動偵測。

#### Job-to-be-Done

練習者要反覆處理一小段難句時，希望「看到哪裡、聽到哪裡、重複哪裡」保持同一位置，不必拿 PDF 的小節位置去另一個播放器重新找時間。

#### 省掉的人工步驟

Soundslice current workflow 支援：

- notation 與 recording 同步；
- 點譜可跳到 recording 對應位置；
- 拖選 notation 可 loop；
- loop 可 count-in 或單次播放。

可移植的不是整個產品，而是：**練習目標的 musical section identity 應跨視覺與音訊保持一致**。

#### Onboarding / distribution

web browser on phone/tablet/desktop；無需另裝 player。這與 UkePack private share link 的既有 distribution 模式相容。

#### Automation / data model pattern

`score location → audio location → practice action` 是可檢查的 deterministic mapping，不需要 LLM 當 runtime judge。

#### Pricing signal（不是效果證據）

Current pricing, checked 2026-09-14:
- Free：$0；MusicXML import、web notation、YouTube sync。
- Plus：$5/month 或 $50/year；uploaded MP3/video sync、secret link、print/export 等。
- Teacher：$20/month 或 $200/year for 100 students。

設計訊號：interactive practice + private sharing + teacher workflow 可以被放在付費價值層，但**不能因此推論 UkePack 應採同價格、帳號或課程模型**。

#### Limit / what not to copy

- Soundslice 是完整 interactive notation ecosystem；UkePack north star 是 beginner-ready pack，不需要先變成 notation editor。
- 同步 audio 對真實錄音會有 timing/alignment 工作；本輪不把 auto-sync 引入研究最低門檻。
- 競品 feature existence 不能證明 UkePack 使用者會因此更快學會。

### A2. Police exam learning：adaptive / source-grounded learning 持續成市場基線，但已有 #60

**CONFIRMED — current / 2026 signals; no new Issue**

`police-exam-archive #60` 已明確處理：每題 attempt、wrong/unanswered/marked、due queue、deadline/backlog、官方題來源 identity。

因此本輪即使看到 Quizlet Learn 類「依歷史行為聚焦弱項」與 Google education 類 source-grounded personalized study，不另開「AI tutor」或第二套 learner-state Issue。更小、已存在的 #60 足夠回答目前工作。

**DO NOT COPY**：用 AI 重新生成大量警察特考題來取代官方 corpus；這反而稀釋產品最強的來源優勢。

### A3. Workforce scheduling：post-publish exception workflow 仍重要，但已被 #19/#20/#22 完整承接

**CONFIRMED — no new Issue**

Deputy / When I Work 類產品持續把 conflict, availability, approval, swap/open-shift 做成核心 scheduling lifecycle。對 Reese-max 的新價值不再是「再建一張 Issue」，而是避免老 radar 因換競品名稱又重開：

- #19 已是 diagnostics → bounded repairs；
- #20 已是 rule authoring → validation/shadow preview；
- #22 已是 published schedule → member request → manager approval → canonical mutation。

而 #14/#15 authorization 仍更高優先。本輪沒有新外部證據推翻這個排序。

---

## B. Adjacent transferable workflow

### B1. Flat for Education：把原本分散的練習工具搬到同一 work surface

**CONFIRMED — official, 2026-05-21 / 2026-07-17**

Sources:
- 2026-05-21: https://blog.flat.io/the-tools-music-teachers-keep-open-in-other-tabs-are-now-built-into-flat-for-education/
- 2026-07-17: https://blog.flat.io/the-practice-tools-built-into-flat-for-education-metronome-tuner-tone-generator-sound-analysis/

Flat 官方把痛點寫得很具體：教師／學生原本會在 assignment platform、metronome、tuner、PDF 等不同 tab 間切換；現在 tuner、metronome、tone generator、sound analysis 等直接與 notation/assignment 放在一起。

這是 **workflow-design signal**，不是 Flat 已證明學習效果提升。

可移植到 UkePack 的核心原理：

> 不一定要增加更多工具；先把「完成同一練習工作必須跨 surface 對照」的那一步拿掉。

因此本輪研究只考慮 section → existing audio 的局部 handoff，不直接加入 tuner/metronome/AI assistant 套裝。

Current Flat pricing signal（checked 2026-09-14）：
- Teacher Plan：$99/teacher/year + $6/student/year；practice tools + notation + LMS integrations 同方案。

同樣只作 bundle/business-model signal，不推算 Reese-max 付費意願。

### B2. Flat × Microsoft Teams：canonical artifact 直接進下游，不要重新輸入

**CONFIRMED — official help updated 2026-09-02**

Source:
- https://help.flat.io/en/education/microsoft-teams/create-music-notation-assignment/

Flat 可直接從既有 notation/performance assignment 發到 Teams channel，學生一鍵進入，grade 回寫 Teams gradebook。

可移植原理：

`canonical artifact → downstream adapter → result returns to canonical workflow`

而不是 export → copy → recreate。

對 UkePack，目前 teacher pack/share 仍在 beta；在沒有 #3 的真人需求證據前，不應因此建立 Teams/Classroom/LMS integration Issue。先記 `ADJACENT IDEA`。

### B3. Offline desktop：可靠性是另一種 workflow reduction，但目前不是 UkePack 已證明需求

**CONFIRMED — Flat for Education desktop, 2026-08-25**

Source:
- https://blog.flat.io/flat-for-education-desktop-app-mac-windows/

Flat 把相同 editor 帶到 desktop/offline，再回線同步。這支持「教室網路可靠性」是音樂教育產品實際 design dimension。

對 UkePack 本輪分類：`ADJACENT IDEA / NEEDS_EVIDENCE`。目前 share/PDF/MP3 本身已有可下載性，沒有 repo/使用者證據顯示必須建立 desktop app；所以不開單。

---

## C. Emerging tool / technology possibility

### C1. OpenSheetMusicDisplay 2.0：browser-native MusicXML rendering 仍在進步

**CONFIRMED — official announcement 2026-06-17**

Sources:
- https://opensheetmusicdisplay.org/
- https://opensheetmusicdisplay.org/typescript-library/

OSMD 2.0 官方頁面強調 lazy rendering 等更新；current TypeScript library 可在 browser 顯示 MusicXML，並有 audio playback / repetitions / cursor 類擴充能力。

對 UkePack 的意義只有一個：**如果 section-linked prototype 後來證明需要真正可點擊的 score view，沒必要先自製 engraving engine。**

不該照抄：
- 不把官方宣稱的 rendering speed 當 UkePack performance KPI；
- 不為了「可以做」就先替換 PDF pipeline；
- 不把 sponsor-only / early features 當免費穩定依賴。

### C2. Emerging product possibility：practice-aware artifact，而非 another AI generator

外部市場的共同方向不是「每個音樂產品都放一個 AI chatbot」，而是讓現有 artifact 帶著更可執行的 context：score location、loop、tempo、assignment link、offline state。

對 Reese-max 更符合目前架構的產品可能性是：

`teacher-reviewed pack → section-aware practice affordance`

而不是：

`teacher-reviewed pack → generic AI coach / song marketplace / full LMS`

---

# 4. Community Pain Points

以下全部標記 `COMMUNITY_SIGNAL`，不作發生率／市場規模／效果統計。

### 4.1 多工具切換

2026-01-03 r/musicians 個別討論描述練習時在 metronome、PDF、手機 notes、其他 instrument tools 間來回；留言也有人描述 tablet 放 PDF、手機放 tuner/metronome／backing track。

Source:
- https://www.reddit.com/r/musicians/comments/1q2otvm/do_you_use_multiple_appstools_when_practicing_or/

可轉成 fixture：要求受試者「在 PDF 找 Chorus → 70% audio 重複三次」，觀察真正切換／seek 行為。

### 4.2 「all-in-one practice app」需求本身不能當驗證

2026-06-02 另有開發者在 r/musicians 描述自己因 metronome/notes/calendar/sheets/recordings/timers 分散而做 all-in-one app。

Source:
- https://www.reddit.com/r/musicians/comments/1tuct6m/a_lot_of_people_are_tired_of_jiggling_around/

這只能證明有人感到 fragmentation；不能證明 UkePack 應複製 all-in-one scope。相反地，本輪 Issue 刻意只測一個最貼近 UkePack north star 的 handoff。

---

# 5. Opportunity Map — 本輪實際處理產品

## 5.1 `exam-archive`

**MUST MATCH**
- 先讓核心 practice 具備基本可操作／可存取性；existing #3 已處理 keyboard/AT。
- 讓維護者／使用者知道 canonical product/source。

**SHOULD BE BETTER**
- 不再維護另一份難以 diff/rebuild 的資料真相；若確定已被新 archive 取代，優先 redirect/archive。

**DIFFERENTIATOR**
- `NOT_ESTABLISHED`：在 canonical status 未定前，不創造新 differentiator narrative。

**ADJACENT IDEA**
- 若仍需保留 public archive，做 lightweight handoff 至 canonical search/practice，而不是新學習引擎。

**DO NOT COPY**
- AI quiz generation、adaptive learner model、account system；先解 #1 的 product status / source-of-truth 決策。

Decision：`DEFERRED`，零新 Issue。

## 5.2 `police-exam-practice` — compatibility-only

**MUST MATCH**
- redirect 保留 query string / hash 與既有舊網址相容。

**SHOULD BE BETTER**
- 刪除／避免任何會讓它重新成為第二份題庫或第二份學習邏輯的內容。

**DIFFERENTIATOR**
- N/A；正式產品已是 `police-exam-archive`。

**ADJACENT IDEA**
- 只有 compatibility/handoff improvements；不是產品 feature surface。

**DO NOT COPY**
- 不因看到 Quizlet/Google/Kahoot 新功能就往這個 repo 加功能。

Decision：從 product-like 重分類為 support/compatibility-only，這本身就是本輪「簡化而非加功能」的成果。

## 5.3 `police-exam-archive`

**MUST MATCH**
- per-question practice history / review continuity：已有 #60。
- official-source provenance、dataset identity、修正答案與 image-fidelity：已有對應 work。

**SHOULD BE BETTER**
- 每個 adaptive/review 決策可說明「為什麼今天出這題」，且永遠追到官方題，而非生成內容。

**DIFFERENTIATOR**
- 106–115 年官方 corpus、來源可追溯、deadline-aware review（#60 direction）。

**ADJACENT IDEA**
- teacher/class assignment handoff only after real use case evidence；目前沒有必要為 Classroom/Teams 開新面。

**DO NOT COPY**
- generic AI question generation、opaque predicted pass probability、account-heavy study social network。

Decision：外部 adaptive-learning signals 與 #60 同 fingerprint；不重開、不更新 scope。

## 5.4 `92-duty-scheduler`

**MUST MATCH**
- conflict-aware repair / approval / post-publish change lifecycle；#19/#22 already cover。
- policy authoring 不能繞過 deterministic evaluator；#20 already cover。

**SHOULD BE BETTER**
- school/police privacy model、bounded deterministic repair、exact schedule revision、LINE thin adapter。

**DIFFERENTIATOR**
- self-host Cloudflare/D1 + local organizational rules + explainable constraints + no broad HR suite。

**ADJACENT IDEA**
- 更窄的 mobile confirmation surface，在 #14 授權修好後再驗證；不要先造 native app。

**DO NOT COPY**
- payroll/timeclock/HR/chat suite；LLM runtime scheduling authority；在 #14/#15 未解前增加 remote write surface。

Decision：沒有新外部證據突破 #19/#20/#22 fingerprint；零新 Issue。

## 5.5 `UkePack`

**MUST MATCH**
- learner 能在 score 與 practice audio 之間保持同一 musical context，不必每次人工重新找段落。

**SHOULD BE BETTER**
- 利用已經存在的 `ScoreSection + measure/beat + slow audio`，把「練第一段」變成比一般 full notation tool 更窄、更適合初學者的 workflow。

**DIFFERENTIATOR**
- teacher-reviewed、child-friendly、source-aware pack + section-linked practice；不是 song catalog 或 AI transcription marketplace。

**ADJACENT IDEA**
- OSMD 類 browser rendering only if real beta evidence shows section button/timestamp 不夠。
- Flat/Teams 型 LMS handoff only after #3 teacher/workshop demand is validated。
- offline desktop only if actual classroom connectivity becomes observed blocker。

**DO NOT COPY**
- full notation editor、DAW、LMS/roster/account、AI song generator、generic practice super-app。

Decision：建立 #9，只有 research authorization，沒有 implementation authorization。

---

# 6. Candidate evaluation under Issue Quality v2

## 6.1 UkePack section-linked practice

### User Pain
**MEDIUM, evidence partial.** Repo 確認目前 PDF 與 audio 是分開 surface；社群與競品顯示這類切換存在。但 UkePack 真實 learner 頻率／嚴重度仍 `UNKNOWN`。

### Strategic Fit
**HIGH.** 直接對應「第一段 <30 分鐘」北極星，也重用現有 section/audio，而不是改產品類別。

### Novelty
**MEDIUM.** 同市場已有成熟 pattern；價值不在新奇，而在能否用 UkePack 既有資料做更小、更適合兒童的版本。

### Evidence Strength
**MEDIUM-HIGH for workflow existence; NEEDS_EVIDENCE for user value.** 第一方 competitor feature + repo truth 充分；真實 beta outcome 尚未有。

### Reuse Potential
**HIGH within repo.** `ScoreSection`、practice audio、share page 已存在；最小 prototype 可重用。

### Implementation / experiment effort
**LOW–MEDIUM for research prototype; UNKNOWN for full sync.** 這正是為何不預先批准完整播放器。

### Security / privacy / cost risk
**LOW for local/read-only experiment.** Full accounts/LMS/analytics 被明確排除。Public deployment security issues仍維持獨立優先。

### Counter-case

不做 #9 的合理理由：
- beginner songs 很短，PDF + audio 可能已足夠；
- section timing 可能不可靠；
- 互動控制可能比現況更複雜；
- 現在更該先把 security/reliability 關掉。

所以不是 `FEATURE / READY_FOR_IMPLEMENTATION`；只值得做可終止的窄研究。

---

# 7. New Releases / market movements

1. **Soundslice — 2026-08-28**：syncpoint editor 可顯示 detected beats。設計訊號：alignment/debug state 越來越可見；不等於 UkePack 需要自動對齊錄音。
   - https://www.soundslice.com/blog/notation-editor/
2. **Flat for Education Desktop — 2026-08-25**：同 editor desktop/offline + reconnect sync。設計訊號：classroom reliability/offline 是實際 distribution surface；UkePack 尚無足夠 evidence 立案。
   - https://blog.flat.io/flat-for-education-desktop-app-mac-windows/
3. **Flat × Teams assignment — updated 2026-09-02**：assignment 直接發布至 Teams，grade sync back。設計訊號：避免 downstream re-entry。
   - https://help.flat.io/en/education/microsoft-teams/create-music-notation-assignment/
4. **OSMD 2.0 — 2026-06-17**：browser MusicXML rendering/lazy rendering 大版本。技術訊號：未來若需要 interactive score，優先評估既有 renderer 而不是自製。
   - https://opensheetmusicdisplay.org/

---

# 8. Cross-portfolio ideas（不湊 Top 10）

## 8.1 Same-artifact continuity before new AI

Pattern:

`canonical artifact → task-local control → result/receipt`

優先把使用者「已經在看的東西」直接變成下一動作，不要求另開工具／重輸入。

適用：UkePack（score→audio）、ppt-studio（slide→specific patch）、video-timeline-pipeline（evidence→NLE handoff）、exam（attempt→next review）。各 repo 已有不同 primitives，不建立 umbrella framework。

## 8.2 Consolidate duplicate products rather than feature-parity both

`police-exam-practice → police-exam-archive` 是正面案例：兼容入口保留，但資料／feature 只維護一份。

可作 portfolio guardrail：遇到兩個 repo 做相同 canonical truth，先問 redirect/merge/reuse，不能因外部競品出新功能就兩邊都加。

## 8.3 Distribution adapter should not become second truth

Flat/Teams 的價值在 assignment/grade handoff；對 Reese-max 類 LINE、Discord、Teams、MCP surface，持續採「adapter → canonical product」，不要複製狀態。

這是既有 cross-portfolio 原則的增量證據，不另開共同 framework Issue。

---

# 9. Ideas Rejected / kept in radar only

### REJECT — UkePack full Soundslice clone
原因：scope creep；沒有證據需要完整 notation editor、recording sync engine、course platform。

### REJECT — UkePack teacher LMS/accounts now
原因：owner/現有 #3 已明確要求先驗證 privacy-minimal workshop pack-set；Flat/Soundslice 存在帳號與 classroom 不推翻這個理由。

### NARROW / radar only — UkePack offline desktop
原因：Flat 2026-08-25 是好訊號，但 UkePack PDF/MP3 已可下載，沒有 UkePack 真實 classroom connectivity blocker 證據。

### DUPLICATE — police-exam adaptive study feature
原因：#60 已處理 per-question attempt + deadline review；新競品例子不形成不同 root workflow gap。

### DEFERRED — exam-archive new study features
原因：#1 仍先要求 canonical status；repo 可能應 redirect/archive 而非成為第二產品。

### DUPLICATE — 92-duty post-publish self-service / rule AI / repair assistant
原因：#19/#20/#22 已分別擁有相關 workflow；P0 #14/#15 更優先。

### REJECT — generic all-in-one musician super-app
原因：community 有 fragmentation signal，但 UkePack 的最小可驗證工作只是 section practice handoff；calendar/recording/AI assistant 等都無產品證據。

---

# 10. Issue Mapping / coordination

| Repo | Finding | Existing/new mapping | Result |
|---|---|---|---|
| `exam-archive` | canonical status / monolith first | existing #1 | no new issue |
| `police-exam-practice` | merged/compat-only | README scope | reclass only |
| `police-exam-archive` | adaptive review continuity | existing #60 | duplicate, no write |
| `92-duty-scheduler` | repair/policy/post-publish lifecycle | existing #19/#20/#22 | duplicate, no write |
| `UkePack` | PDF + separate audio requires manual section-to-audio handoff | **new #9** | created + read-back verified |

UkePack new-Issue duplicate check before create:
- open/closed Issue search for practice / interactive audio / section loop：無同 fingerprint；
- all-state PR：only unrelated active PR #6 (legacy project-token custody)；
- code search `github-issue-lock:v1`：無有效 marker；
- existing #3 is workshop/account discovery, not student section-practice workflow。

Issue #9 read-back verified:
- https://github.com/Reese-max/UkePack/issues/9
- state: open
- `triage: NEEDS_EVIDENCE`
- `auto_implementation: false`

沒有取得／搶占任何既有 active issue lease；沒有更新正在被 worker 處理的 issue scope。

---

# 11. What changed since previous radar (r6)

1. **Issue-quality gate changed materially**：本輪以 Issue Quality v2 做 research/feature 分離；不再用 92/94/98 類精確總分當通過證據。
2. **Portfolio classification corrected**：`police-exam-practice` 已被自己的 README 明確定位為 merged compatibility entry，不再列獨立 product-like；product-like 由上一輪 36 校準為 35。
3. **New repo observed**：`google-maps-personal-mcp` 出現在 owned/unarchived enumeration，但目前 `UNKNOWN`，不因名字推測產品方向。
4. **New actionable opportunity**：UkePack 的 concrete manual handoff 通過窄 RESEARCH gate，建立 #9。
5. **No duplicated scheduling/exam Issues**：新的外部訊號被現有 #19/#20/#22/#60 吸收，不重開。
6. **No source/deploy mutation**：所有產品原始碼、CI、settings 不動。

---

# 12. Source register

所有來源於 **2026-09-14** 查閱；日期若網站有明確 published/updated 則以下列示。

| Evidence | Date | Source | Classification |
|---|---:|---|---|
| Soundslice synced notation/practice/loop current capability | current | https://www.soundslice.com/ ; https://www.soundslice.com/help/en/player/basic/4/looping/ | CONFIRMED feature |
| Soundslice syncpoint detected beats update | 2026-08-28 | https://www.soundslice.com/blog/notation-editor/ | CONFIRMED release |
| Soundslice pricing | current | https://www.soundslice.com/plans/ | CONFIRMED pricing |
| Flat: tools previously kept in other tabs now integrated | 2026-05-21 | https://blog.flat.io/the-tools-music-teachers-keep-open-in-other-tabs-are-now-built-into-flat-for-education/ | CONFIRMED product signal |
| Flat practice tools | 2026-07-17 | https://blog.flat.io/the-practice-tools-built-into-flat-for-education-metronome-tuner-tone-generator-sound-analysis/ | CONFIRMED product signal |
| Flat desktop/offline | 2026-08-25 | https://blog.flat.io/flat-for-education-desktop-app-mac-windows/ | CONFIRMED release |
| Flat Teams assignment handoff | updated 2026-09-02 | https://help.flat.io/en/education/microsoft-teams/create-music-notation-assignment/ | CONFIRMED workflow |
| Flat Teacher pricing | current | https://flat.io/edu/teacher-plan | CONFIRMED pricing |
| OSMD 2.0 | 2026-06-17 | https://opensheetmusicdisplay.org/ | CONFIRMED release |
| OSMD browser MusicXML capability | current | https://opensheetmusicdisplay.org/typescript-library/ | CONFIRMED technical capability |
| musicians multiple-tool practice discussion | 2026-01-03 | https://www.reddit.com/r/musicians/comments/1q2otvm/do_you_use_multiple_appstools_when_practicing_or/ | COMMUNITY_SIGNAL |
| musician all-in-one practice prototype discussion | 2026-06-02 | https://www.reddit.com/r/musicians/comments/1tuct6m/a_lot_of_people_are_tired_of_jiggling_around/ | COMMUNITY_SIGNAL |

### Source-use guardrails

- Soundslice / Flat 的官方功能與價格：只當「產品做法／business-model signal」，沒有當作省時或學習成效的獨立證據。
- Reddit：只用來設計研究情境，沒有推算 prevalence。
- OSMD：只當可行性／reuse signal；不把其效能宣稱移植成 UkePack KPI。

---

# 13. Incomplete / runtime / next cursor

## NEEDS_EVIDENCE

- UkePack #9 真正 user-value：需要 real beta teacher/learner observation；repo inspection + competitor feature 不足以轉 READY。
- section→audio time mapping 精度：未做 runtime experiment，不宣稱可用。
- UkePack eventual mobile/keyboard/screen-reader/slow-network behavior：未執行，若 BUILD 才需驗證。

## NEEDS_RUNTIME_VERIFICATION

本輪沒有執行 production canary、real share-link practice session、Cloudflare deploy 或 external provider write。任何相關能力都不標 VERIFIED。

## Write verification

- Issue write：成功，`UkePack #9`，已 read back。
- Report write：待本 commit 成功後以 connector return SHA 為準；不得以本文自稱 commit 成功取代 API 結果。

## Fair-rotation cursor

下一輪從：`ppt-studio` 開始，之後依 owned/unarchived 實際清單前進；若 repo roster 改變，先重新列舉再套游標。

---

## Portfolio principle from this round

**`Practice artifact available ≠ practice step friction removed。`**

已經有 PDF、MP3、MIDI、段落資料，不代表學員完成「找到難段 → 慢速重複 → 看同一段譜」的工作不需要人工對照。下一步也不一定是新增大型播放器；Issue Quality v2 下更合理的順序是：

`observe handoff → reuse existing section/audio truth → test the smallest linked control → BUILD / NARROW / REJECT`。
