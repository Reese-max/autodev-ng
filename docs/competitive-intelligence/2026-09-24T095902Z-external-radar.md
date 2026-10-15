# External Competitive Radar — 2026-09-24T09:59:02Z

Status: **COMPLETE**

查閱日：2026-09-24。主要市場情報來自 GitHub 之外的公開產品、更新與官方文件；GitHub 僅用於 Reese-max 自有 repository inventory、產品方向、default-branch 現況、Issue/PR 去重與 report-only 寫入。

## Scope / Direction Check

- Governing rule：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`
- Fresh owner pagination：實際列舉 **42 個 Reese-max-owned repositories / 41 個未封存 / 1 個 archived (`obsidian-vault`)**；page 2 為空，不沿用舊 inventory 當全集。
- Fair-rotation cursor：最新外部雷達 PR #91 明確把下一個 eligible product 指到 `Reese-max/UkePack`，因此本輪不沿用較舊聊天紀錄中的 cursor。
- Focal default branch：`master@56bcdb78da1e27529d70a9de71aa3414ddfcfb36`。最新 default-branch commit 是 2026-09-09 的 audit 文件更新；本輪未觀察到產品程式的新 default-branch 變更。
- Owner/Product Board：**INVEST，但收斂在 teacher-reviewed practice-pack production**。優先確保 release/security truth、老師真人 time-to-value、可安全分享／列印；不要在證據不足時擴張到完整 transcription engine、song catalog、LMS、child accounts、roster、billing、marketplace 或新樂器。
- North star：一首歌從匯入到小朋友能彈出第一段 < 30 分鐘；現有 README 的機器端 gate 是 `import → PDF < 5s`。
- Current product truth：MusicXML/manual chords intake、key recommendation、Level 1/2/3、chord simplification、section detection、PDF、slow-practice audio、teacher review、expiring share、Discord/API 等已存在。
- Active scopes：#2 有 open PR #10/#11；#5 有 open PR #6；#3 有 open research PR #7；#9 已經追蹤 section-linked in-page practice research。本輪不搶改、不重複立案。
- 本輪沒有修改 UkePack 原始碼、CI/config、secrets、settings/permissions，也沒有啟動 worker/GOAL、merge、deploy、付費 provider、正式資料或外部產品 effect。

## Product → Market Category

`UkePack` 應繼續定位為：

1. **teacher-reviewed ukulele teaching-material production layer**，不是 transcription model；
2. machine-readable score 之後的 chord simplification、difficulty adaptation、practice audio、PDF、review/share last mile；
3. privacy-minimal teacher/family/workshop handoff，而不是 child-account LMS；
4. upstream transcription / OMR / DAW tools 的 consumer，核心 moat 是「可教、可改、可印、可安全分享」。

## External Signals

### A. CONFIRMED — Moises 在 2026-09-22 把 lyric transcription / chord extraction 直接嵌入 Universal Audio LUNA

來源：https://moises.ai/newsroom/partnerships/moises-universal-audio-luna-integration/

事件日期：**2026-09-22**；查閱：2026-09-24。

Moises 與 Universal Audio 把 lyric transcription 與 chord extraction 直接放進 LUNA session，產品敘事明確是減少「離開目前創作環境 → 到另一個工具分析 → 再帶回來」的切換。

對 UkePack 的可移植訊號不是建立 DAW、LUNA plugin 或自研 chord model，而是：**upstream machine-readable music extraction 正越來越商品化與 in-context**。UkePack 應守住標準化 MusicXML/MIDI/manual-chord intake，以及 downstream teacher-reviewed teaching truth。

這也補強 2026-09-20 radar 的 OMR 結論：如果未來真的有真人 evidence 證明 source conversion handoff 是高摩擦，應先做一條最小 external-conversion bridge；不要先建 provider registry、job DB 或 transcription subsystem。

### B. CONFIRMED — Flat for Education 2026-09-04 把老師的「教學意圖」提前成 exercise-generation constraints

來源：https://blog.flat.io/back-to-school-flat-for-education-updates-2/

事件／更新日期：**2026-09-04**；查閱：2026-09-24。

Flat 的 sight-reading generator 現在可在生成前指定 key、time signature，並可一次建立 multi-band parts。這個值得移植的不是「再加一個 generator」，而是 workflow pattern：

`老師先給少量可理解的教學限制 → 產生適合當下課程的材料 → 再 review`。

UkePack 現在已有 Level 1/2/3、key recommendation、teacher review 與模板，因此「沒有 constraint framework」不是根因。真正仍未知的是：老師是否反覆在 review 階段做相同修改，例如限定目標 key、允許和弦集合、練習段落或節奏難度。沒有真人操作證據前，不建立新的 schema/constraint engine Issue。

### C. CONFIRMED — Flat 仍在收斂跨工具 practice setup，而不是把老師送去更多獨立工具

來源：https://blog.flat.io/the-practice-tools-built-into-flat-for-education-metronome-tuner-tone-generator-sound-analysis/

更新日期：**2026-07-17**；查閱：2026-09-24。

Flat 把 metronome、tuner、tone generator、sound analysis 放回與 notation/assignment 相同環境，其明示 JTBD 是減少老師／學生在多個 tab、app、帳號間切換。

UkePack 已有 tuner、slow-practice audio、PDF/share，因此最接近的未決問題仍是既有 #9：分享頁的 score 與 practice audio 是否需要最小 section-linked start/repeat，才能真正減少 `找段落 → 去音檔 scrub → 回譜面` 的 handoff。這不是新的 root cause，不另開 Issue。

### D. CONFIRMED — Soundslice 目前仍把 synced score + recording + loop/slowdown 當 practice 核心；Teacher pricing 是付費 distribution signal，不是 UkePack 的 WTP 證據

來源：
- https://www.soundslice.com/
- https://www.soundslice.com/teachers/

查閱：**2026-09-24**。

Soundslice 現行產品可讓使用者從譜面定位到錄音時間、圈選 loop、降速、transpose，並以 browser 跨 phone/tablet/desktop 使用。Teacher plan 現行頁面列 annual **US$200/year**，超過 100 students 的額外學生另按月計費。

這證明互動 practice + teacher distribution 已可商品化，但不能外推成 UkePack 使用者願意付費、需要 roster，或 #9 必須 BUILD。對 UkePack 的合理判斷仍是：先用真人 task evidence 驗證 section-linked control 是否明顯降低 friction；subscription/roster 仍屬 #3 research 之後的 decision，而不是市場價格本身自動授權。

### E. CONFIRMED — Moises Studio 2026-09-02 強調 collaborative AI workspace，但核心敘事仍保留人類作者決策

來源：https://moises.ai/newsroom/product-announcements/moises-launches-studio-collaborative-workspace/

事件日期：**2026-09-02**；查閱：2026-09-24。

Moises Studio 把錄音、MIDI、AI tools 與 real-time collaboration 放進 browser workspace，同時明確以 human authorship / musician decision 作產品原則。這與 UkePack 既有 teacher-review wedge 一致；沒有理由因此做 realtime collaboration、shared editor 或 account system。

### F. COMMUNITY_SIGNAL — 初學者仍把 chord switching / 跟不上完整速度列為具體 practice friction

來源：https://www.reddit.com/r/ukulele/comments/1vsyrwj/hi_new_to_ukulele_and_seeking_resources_to_learn/

發文日期：**2026-08-19**；查閱：2026-09-24。

個別初學者描述「跟 YouTube 系列時跟不上，和弦切換速度成為主要障礙」。這只能當 qualitative signal，不能代表發生率。它與 UkePack 已有 chord simplification、difficulty levels、slow practice audio 方向一致，不構成新功能需求。

## New Releases / Market Moves

| Date | Product | Signal | Confidence | Radar consequence |
|---|---|---|---|---|
| 2026-09-22 | Moises × LUNA | Chord/lyric intelligence 進入既有 DAW session | CONFIRMED | upstream extraction commodity；不做 transcription engine |
| 2026-09-04 | Flat for Education | key/time-signature constrained exercise generation | CONFIRMED | teacher intent 可在生成前表達；先於 #3 真人研究中觀察重複修改 |
| 2026-09-02 | Moises Studio | browser collaborative AI workspace，強調 human authorship | CONFIRMED | teacher review thesis 被支持；不追 realtime collaboration |
| 2026-08-27 | Klangio Transcription Studio | mobile transcription app | CONFIRMED / ALREADY KNOWN | 2026-09-20 radar 已記錄；不重複立案 |
| 2026-07-17 | Flat for Education | practice tools 收進同一教學環境 | CONFIRMED | 映射既有 #9；不新增 player/framework Issue |

## Community Pain

- 本輪只保留一個 2026-08-19 的 ukulele learner anecdote：chord switching 與速度跟不上。它與既有產品 thesis 一致，但不是市場發生率。
- 沒有找到能證明 UkePack 老師「必須要 roster／billing／realtime collaboration／完整 player」的 decision-grade community evidence。
- 真人 UkePack teacher trial 仍是最重要的缺口；不能用競品、Reddit 或 synthetic personas 替代。

## Adjacent Ideas

### 1. 把「老師反覆改什麼」納入 #3 research，不先建 constraint engine

在既有 5+ target-teacher protocol 中額外記錄：初稿後是否常重複修改 target key、allowed chords、section focus、tempo／strum difficulty。若同一類修改跨多位老師穩定出現，再比較：

- 不改；
- 文件／模板提示；
- 重用現有 Level / template；
- 一個很小的 pre-generation constraint；
- 最後才考慮新 schema。

### 2. Provider intelligence 應停在 interchange boundary

Moises/Klangio/Flat 都讓 upstream extraction 更容易。UkePack 最小兼容面仍應優先是 MusicXML/MIDI/manual-chord contract + source/license truth。沒有真人 source-format blockage 前，不加 LUNA/Klangio/Moises-specific connector。

### 3. Section practice 仍只需回答 #9 的窄問題

不要先做 synchronized notation engine。先比較目前 PDF+audio 與 existing-section-metadata 驅動的 `Chorus → 70% → repeat` 小 prototype；BUILD/NARROW/REJECT 仍由真人完成任務證據決定。

## Opportunity Map — `UkePack`

| Bucket | Decision | Evidence / reason |
|---|---|---|
| MUST MATCH | auth / release / migration truth | #1/#2/#5；open remediation PRs；這些仍高於 feature breadth |
| MUST MATCH | source/license boundary 與 teacher approval 不被 upstream AI 結果繞過 | Owner direction + Flat/Moises human-review patterns |
| SHOULD BE BETTER | 若真人老師確實反覆做相同修正，讓少量教學意圖在生成前可表達 | Flat 2026-09-04；目前 UkePack pain 未建立 |
| SHOULD BE BETTER | 若 #9 真人證據成立，減少 score ↔ audio 的 section practice handoff | Soundslice/Flat；既有 #9 已追蹤 |
| DIFFERENTIATOR | legal source → child-friendly simplification → Level variants → teacher review → print/share | Product Board 核定 wedge；upstream transcription 越來越商品化 |
| ADJACENT IDEA | external conversion / OMR / chord-analysis bridge | 已在 2026-09-20 radar 保留；仍需 source-format evidence |
| DO NOT COPY | full transcription model、DAW、realtime collaboration、song marketplace、full LMS、child accounts、roster、billing、通用 synchronized-score engine | 維護/隱私/授權負擔大，且未通過需求 gate |

## Four-Gate Review

### Candidate 1 — pre-generation teacher-intent constraints

**Gate 1 — Problem / value：PARTIAL。** Flat 證明這種 workflow pattern 有市場實作；UkePack repo 也已有 recommendation + teacher-review。不過目前沒有 UkePack 真人 evidence 顯示 post-generation repeated edits 是高頻人工斷點，現有 Level/template 是否已足夠也未知。

**Gate 2 — Priority：**

- `kind=OPPORTUNITY`
- `severity=NOT_ESTABLISHED`
- `decision_priority=MEDIUM`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`
- runtime：`NEEDS_RUNTIME_VERIFICATION`

競品有此能力不能自動升 P2/P1。

**Gate 3 — Smallest option：** 先在 #3 真人研究記錄重複修改；若成立，先測單一 constraint／既有 template reuse，不建 policy engine、preset registry 或 account-backed workspace。

**Gate 4 — Research / implementation split：** #3 + PR #7 已有 active research ownership。本輪 `SKIPPED_LOCKED / CENTRAL_REPORT_ONLY`，不留言、不擴 scope、不新建 Issue。

Result：**HOLD / NEEDS_EVIDENCE / NO NEW ISSUE.**

### Candidate 2 — in-context upstream transcription / chord extraction

**Gate 1：** 市場趨勢明確，但 UkePack 產品方向早已把 transcription 視為 upstream commodity；2026-09-20 也已留下 OMR bridge candidate。沒有新的 validated workflow gap。

**Gate 2：** `kind=OPPORTUNITY`, `severity=NOT_ESTABLISHED`, `decision_priority=LOW_MEDIUM`, `triage=NEEDS_EVIDENCE`, `auto_implementation=false`。

**Gate 3：** 不改最小；必要時只保留 interchange/source receipt，不做 provider-specific connector。

**Gate 4：** 與既有 source-intake research context 重疊，沒有新 root cause。

Result：**DEDUPED / NO ISSUE.**

## Issue / PR Mapping

| Tracking | Current judgment | Action this run |
|---|---|---|
| #1 project authorization | 原 P0；default branch 有 remediation，但 verification context 仍不可被競品新功能取代 | no change |
| #2 green-CI governance parser | P1 reliability；PR #10/#11 active | `SKIPPED_LOCKED` |
| #3 workshop pack-set research | teacher workflow / privacy-minimal batching；PR #7 active | `SKIPPED_LOCKED`; teacher-intent candidate 留中央報告 |
| #5 legacy project custody | P1；PR #6 active | `SKIPPED_LOCKED` |
| #9 section-linked in-page practice | 已涵蓋 score/audio handoff，外部 practice signal 無新 root cause | no duplicate / no comment |

New Issues：**0**。
Existing Issue/PR comments or scope changes：**0**。
Implementation authorization：**0**。

## Rejected / Held Ideas

1. **LUNA/Moises/Klangio-specific connector — HOLD/REJECT for current scope.** 沒有 UkePack 真人 evidence 證明 provider switching 是核心 bottleneck；MusicXML/MIDI interchange 已存在。
2. **Realtime collaborative score editor — REJECT.** Moises Studio 有此能力不代表 UkePack workshop/teacher workflow需要；會導入 account、concurrency、privacy/support 負擔。
3. **Full synchronized score/audio player — HOLD.** #9 已定義更小 section-linked experiment；先回答窄問題。
4. **Teacher roster / billing / subscription — HOLD.** Soundslice 的價格只證明別人的商業模式，不能替代 UkePack WTP / repeated-use evidence；#3 仍需真人研究。
5. **General constraint framework — REJECT before evidence.** 若 repeated edit 只是一兩個欄位，文件、template 或局部 field 足夠。

## Sources

查閱日均為 2026-09-24，除非另列：

1. Moises × Universal Audio LUNA, 2026-09-22 — https://moises.ai/newsroom/partnerships/moises-universal-audio-luna-integration/
2. Moises Studio, 2026-09-02 — https://moises.ai/newsroom/product-announcements/moises-launches-studio-collaborative-workspace/
3. Flat for Education Fall 2026, updated 2026-09-04 — https://blog.flat.io/back-to-school-flat-for-education-updates-2/
4. Flat practice tools, updated 2026-07-17 — https://blog.flat.io/the-practice-tools-built-into-flat-for-education-metronome-tuner-tone-generator-sound-analysis/
5. Soundslice current product — https://www.soundslice.com/
6. Soundslice Teacher plan current pricing — https://www.soundslice.com/teachers/
7. Klangio mobile release, 2026-08-27 — https://klang.io/blog/transcription-studio-mobile-app/
8. Reddit ukulele learner signal, 2026-08-19 — https://www.reddit.com/r/ukulele/comments/1vsyrwj/hi_new_to_ukulele_and_seeking_resources_to_learn/
9. Prior Reese-max radar, 2026-09-20 — `docs/competitive-intelligence/2026-09-20T040155Z-external-radar.md`

## What Changed

- **沒有新的 decision-grade UkePack product gap。** Default branch 自上次 UkePack radar 後仍沒有產品程式變更。
- 新的外部確認是 2026-09-22 Moises × LUNA：upstream chord/transcription intelligence 越來越被直接嵌入既有 authoring environment。它支持「不要自研 transcription breadth」而不是推翻 UkePack 方向。
- Flat 2026-09-04 的 teacher-controlled generator 提供一個值得在 #3 真人研究裡觀察的新 workflow hypothesis：老師是否需要在生成前給少量 constraints；目前不足以立案。
- Soundslice / Flat 的 practice pattern 持續支持 #9，但沒有新 root cause。
- 沒有 severity promotion、沒有歷史 Issue 重開、沒有新 implementation right。

## Completion / Gaps / Cursor

- Radar status：**COMPLETE**。
- Fresh inventory：**42 owned / 41 unarchived / 1 archived**；second page empty。
- Focal repo：`Reese-max/UkePack`。
- Focal default HEAD used for decisions：`56bcdb78da1e27529d70a9de71aa3414ddfcfb36`。
- Runtime：本輪沒有實際 browser/mobile/print/provider execution；任何 future candidate 仍是 `NEEDS_RUNTIME_VERIFICATION`，且真人研究 gate 未被外部來源替代。
- Writes：僅此 report-only branch/file/PR；未修改 target repository Issue/PR/thread 或產品來源。
- New Issues：0。
- Issue/PR comments or scope updates：0。
- Implementation authorizations：0。
- Next fair eligible product：**`Reese-max/ppt-studio`**。
- Radar 不宣告 portfolio CLEAN。
