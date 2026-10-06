# Product Board Audit — 2026-10-06T02:00:44Z

## 結論與範圍

- 狀態：**PARTIAL / NOT CLEAN**。本輪完整分頁核對 Reese-max 自有 inventory（45；44 active、1 archived），增量比對各 active repository 的 default HEAD，並依公平游標深讀 `Reese-max/police-exam-archive`。沒有宣稱重做 44 個 active repo 的完整產品稽核。
- 新 actionable finding：**0**。`police-exam-archive` 的 default HEAD 自 2026-09-05 後未有產品變更；八張 open Issue 均已有追蹤，且相關修正散布於 23 張 open PR。沒有足以推翻既有 owner 決策或另開同根因 Issue 的新證據。
- 新增候選證據：PR #77 的 exact head `017593db5427e7163bb17ec0111d48381e9b927c` 已通過 CI、Data Quality 與 Ingest；但尚未合併，也沒有 default Pages/offline runtime，因此 #74/#75 仍是 `STILL_REPRODUCIBLE`（default）與 `NEEDS_RUNTIME_VERIFICATION`（候選修正）。
- 寫入：新 Issue 0；Issue 更新／重開 0；Issue lease 0；產品／CI／config 寫入 0；audit report 1。沒有啟動 worker、GOAL、merge、deploy 或 branch 實作。
- 公平游標：已消化 `Reese-max/police-exam-archive`；下一個 active repo 為 `Reese-max/police-exam-practice`。

## 依據、版本與證據限制

- Issue quality v2：`Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`，blob `8167e10798071d2276addaff6b201c6b0e904a2a`。
- inspected repo/default SHA：`Reese-max/police-exam-archive@a0b5dbb9352b5558dbe62445c6452947dbd2501b`（`master`，2026-09-05T20:13:09Z；最後提交為 audit-only 文件）。
- 主要證據 blobs：README `25e25554c88af75da10cad31eaed6168d4aa9164`；PLAN `7a5a0378abd5272999975660107d5858a27bdbb6`；既有 audit round 1 `8cd77055035aec9df1bea94aa417f53ca14184ac`；`quiz.html` `204c83f81a674812bba5f9bf7ac13654f7cc7f62`；service worker `e17a4e318ac3df719c78b0466f84dfbdeda02cf9`；quiz engine `ef9c5f9f7e78e3eebae36f8eef641b2069a48671`；search engine `8d8964efdf5ea5d92a6d188b136b41ea3d2eede6`；CI `9319dfb11ad90b85aa5ad8c72541bfdcb92ec814`；data-quality workflow `499939e71dec9864b0f79894f9361880b875cd5b`；Pages workflow `75d737152a8df67c5c87408631aa6a09116f3bbd`。
- Evidence types：`SOURCE_CONFIRMED` + historical/exact-head GitHub Actions receipts。沒有在本輪對正式站、provider、真實手機、screen reader、離線首次載入或斷線恢復做 destructive/runtime injection。
- 綠色 unit/CI 不等於部署、瀏覽器離線、手機或 assistive-technology 全路徑。所有需要這些證據的狀態維持 `NEEDS_RUNTIME_VERIFICATION`。

## Portfolio inventory 與增量 Discovery

完整分頁列舉 45 個自有 repositories：44 active、1 archived。archived `obsidian-vault` 保留 inventory 記錄，但作內容庫／封存項排除產品缺陷開單；沒有因 repo 空、內容型或缺少產品表面而硬開單。

本輪固定的 44 個 active default HEAD：

| Repository | Default SHA | Repository | Default SHA |
|---|---|---|---|
| 92-duty-scheduler | `127f5e784be0` | academic-mcp | `99f66db6851d` |
| adng-memory | `ae7246dfc480` | ai-flight-radar | `772deb8a25d6` |
| ai-novel-workstation | `4ea76d73b670` | autodev-ng | `69a206738e37` |
| avatar-vfo | `8c578febb49a` | cf-ai-router | `74c52130046a` |
| cf-mcp-server | `fb1a248fb2b2` | chatgpt-dual-pipeline | `747fd8a59f78` |
| claude-mem | `3ed5439ff683` | clinical-scribe-worker | `4b883036c8ec` |
| cyber-prep-coach | `ffc7bbbb2837` | exam-archive | `13519bbe4e75` |
| flux-image-gen | `dfadcf30ca1d` | google-maps-personal-mcp | `2f3c45209ef7` |
| herdr-skills | `e706aa28db43` | lobsterpulse | `41e09eb922a3` |
| MaterialYouNewTab | `7d32f2f460cc` | minideck | `31f7131ae24a` |
| neciken-summer-poem | `d54daa398673` | ninax-line-hermes | `f820dfad1d31` |
| note-filler | `7e29811376ec` | octobroker | `b669101c0ef4` |
| openab | `50424ed46177` | openab-pty | `9e1464058335` |
| police-essay-mcp | `2cf3da1cc1d5` | police-exam-archive | `a0b5dbb9352b` |
| police-exam-practice | `7a8eb98765d3` | ppt-studio | `d5e478933c4f` |
| project-doctor-web | `d70c383fbce4` | prompt-autoresearch | `6527919ed725` |
| skill-foundry | `17e90d852740` | soundbox-offline | `d58d73ad6a8e` |
| spotify-playlist-organizer-mcp | `47eed58f219f` | studio | `0f1b62d3c543` |
| taichung-police-intel | `63fce55d4177` | taiwan-intel-dashboard | `df7cee191aa5` |
| tick-stock-panel | `39c8e20c8216` | travel-planning-app | `dd5081dfee74` |
| travel-planning-mcp | `ec3054d693bd` | UkePack | `718d021f0147` |
| video-timeline-pipeline | `46a117d960c3` | voice-actress | `a10c97ffc4ca` |

自上一份報告（2026-10-05T22:56:23Z）後，只有 `taichung-police-intel` 的 default branch 有三個新 commits，最新為 `63fce55d417754b12995242ece9d3c80ba9b4492`（2026-10-06T01:57:01Z）。本輪沒有看到足以中斷公平游標的已證實 P0/P1 或 regression；它保留給該 repo 的後續公平／事件式深讀。audit-only commit 不自動使其他 repo 的 runtime evidence 失效。

## `police-exam-archive` Discovery

### 產品與可達流程

- 產品是臺灣警察考試官方題庫的結構化 archive／查詢／練習 PWA：106–115 年、49 類科、101 科目、2,049 個非重複 JSON、36,760 題選擇、5,758 題申論，共 42,518 題；主要來源是考選部 PDF。
- 使用者可透過 SQLite/CLI/API 查詢，並使用搜尋、模擬考、統計與 PWA；已知四題圖片選項仍以 `[圖片選項]` 佔位。
- recursive tree 共 9,585 entries，未截斷；題庫與備份佔大宗。README、manifest/config、網站程式、tests、workflows、近期 commits、全狀態 Issues/PR、Actions 與 branches 均已核對。

### Current-source findings 與既有追蹤

| 現況 | Source evidence | 現有追蹤 | 本輪判定 |
|---|---|---|---|
| active mock exam 只存在記憶體；reload/中斷遺失 | `quiz.html` 只把 theme 寫 localStorage；`quiz-engine.js` 只保存 completed history | #69；PR #89 等 | BUG/P2；default `STILL_REPRODUCIBLE`；候選未合併 |
| Analytics code/data 可獨立 network-first，可能混版 | `sw.js` `CACHE_VERSION=v1.6.0`；code/data 各自請求 | #74；PR #77/#92/#91/#85/#78 | BUG/P2；default `STILL_REPRODUCIBLE` |
| offline-first Analytics 仍依外部 Chart.js CDN | current `master` source | #75；PR #77/#93/#90/#84/#79/#76 | BUG/P2；default `STILL_REPRODUCIBLE` |
| 圖片答案選項不可操作 | search/quiz model只有 text/options，README明示四題 placeholder | #58；PR #71/#59/#65 | BUG/P2；default `STILL_REPRODUCIBLE` |
| README quality denominator 36,210 與 inventory/test 36,760 不一致 | README 與網站註解 | #61；PR #94/#86/#72/#64 | MAINTENANCE/P2；default `STILL_REPRODUCIBLE` |
| 115 年匯入／TLS／PDF與 owner acceptance 尚未完成 | 既有 issue/PR evidence | #70；PR #88/#50 | VALIDATION_GAP/P2；部分 source/CI 通過，runtime pending |
| attempt ledger/deadline queue 是方向假設，不是已重現缺陷 | owner issue + multiple candidate PRs | #60；PR #81/#80/#66 | OPPORTUNITY/NOT_ESTABLISHED；NEEDS_REVIEW |
| fixed A01–J05 tracker仍有上述 blockers | round-1 audit + #68 | #68；PR #95/#87/#67/#63 | VALIDATION_GAP；NOT CLEAN |

README 的 36,210 註解與 `quiz.html` 的相同舊值均屬 #61；沒有因第二個表面位置另開單。active exam state、offline Analytics、image-choice、115 import與 audit tracker也都精確命中既有 fingerprint。

### Issues、branches、PR 與 CI

- Open Issues：8（#58、#60、#61、#68、#69、#70、#74、#75）。所有本文與完整 comments 已讀取；歷史 GitHub issue lock markers都已 release/expired，沒有未釋放的有效 lease。
- Trackers：[F58](https://github.com/Reese-max/police-exam-archive/issues/58)、[F60](https://github.com/Reese-max/police-exam-archive/issues/60)、[F61](https://github.com/Reese-max/police-exam-archive/issues/61)、[F68](https://github.com/Reese-max/police-exam-archive/issues/68)、[F69](https://github.com/Reese-max/police-exam-archive/issues/69)、[F70](https://github.com/Reese-max/police-exam-archive/issues/70)、[F74](https://github.com/Reese-max/police-exam-archive/issues/74)、[F75](https://github.com/Reese-max/police-exam-archive/issues/75)。
- Branches：47，完整分頁，下一頁為空。相關 Issue 均已有 active branches/PR，因此本輪不取得 lease、不搶 scope、不新增重複 Issue。
- Open PRs：23，且多個 PR 對同一根因重複實作。重疊本身是整合／review成本訊號，但沒有足夠 owner決策證據可由 audit 大量關單、改 scope 或合併。
- current `master` historical exact-head CI run `33989440607` 與 Pages run `33989440679` success；default HEAD未變，這些證據仍適用於當時實際執行的路徑，但不能覆蓋未合併修正或離線／手機／assistive runtime。
- PR #77 exact head `017593db5427e7163bb17ec0111d48381e9b927c`：CI run `37400143473` success（含 `analytics-offline-browser` 與 Python 3.10/3.11/3.12）、Data Quality `37400143528` success、Ingest `37400143531` success。這是 `SOURCE_CONFIRMED + EXECUTED CI` 的候選修正證據；尚未進 default、沒有 Pages deploy，不能標 `VERIFIED_FIXED`。
- #69 strongest candidate PR #89、#58 PR #71、#61 PR #94、#70 PR #88與 #60 PR #81均有 exact-head成功 Actions，但都未合併；候選綠燈不轉成 default regression closure。

## 回歸狀態

| Tracker | Default status | Candidate status | Runtime gap |
|---|---|---|---|
| #58 image answer choices | STILL_REPRODUCIBLE | source/CI candidate passed | source PDF、deployed browser、mobile、screen reader |
| #61 stale denominator | STILL_REPRODUCIBLE | source/CI candidate passed | deployed content/readback |
| #69 active exam checkpoint | STILL_REPRODUCIBLE | source/CI candidate passed | real reload/crash/mobile/storage migration |
| #70 115 import validation | PARTIALLY_FIXED / NEEDS_RUNTIME_VERIFICATION | PR #88 CI passed | owner acceptance、TLS/PDF/provider receipt |
| #74 atomic Analytics pair | STILL_REPRODUCIBLE | PR #77 exact-head CI passed | merged default + deployed/offline sequence |
| #75 first-offline Chart.js | STILL_REPRODUCIBLE | PR #77 exact-head CI passed | merged default + first-load offline browser |

沒有產品修正進 default，因此本輪沒有 `VERIFIED_FIXED`、`REGRESSION` 或關單建議。若 PR #77 或其他候選進入 `master`，必須在新 HEAD 重跑原情境及鄰近路徑後再分類。

## 外部競品與替代工作流

查閱日：2026-10-06。官方頁若沒有顯示發布／更新日，明列 `UNKNOWN`；vendor claims不作獨立效果證據。

| 對象 | 類型 | 官方／公開現況與日期 | 對本產品的訊號 | 信心 |
|---|---|---|---|---|
| 考選部 115年警察考試題庫 | authoritative source | 2026 年考試頁提供試題／答案 PDF，另有文字轉換與朗讀說明 | MUST MATCH：官方 provenance、答案狀態、accessible fallback；不是練習UX競品 | CONFIRMED — https://wwwq.moex.gov.tw/exam/wFrmExamQandASearch.aspx?e=115060&y=2026 |
| 阿摩線上測驗 | 直接競品／社群題庫 | 公開頁列 115 年題目與「無官方答案」等標示；頁面日期 UNKNOWN | MUST MATCH truthful answer status；但頁面是 vendor/community signal，不證明完成率 | LIKELY/COMMUNITY_SIGNAL — https://yamol.tw/latest-1782306059.htm |
| Anki / AnkiWeb | 間接替代 | 免費 AnkiWeb 跨裝置同步；官方手冊有 deck/subdeck統計與開啟／關閉同步 | SHOULD BE BETTER：本地優先、窄領域 provenance；研究 spaced repetition前先證明需求 | CONFIRMED — https://apps.ankiweb.net/ ; https://docs.ankiweb.net/stats.html ; https://docs.ankiweb.net/syncing.html |
| Quizlet Test／Practice Tests | 通用學習替代 | Test mode支援 iOS/Android；AI practice tests有訂閱／語言與內容條件 | MUST MATCH mobile practice；DO NOT COPY generic AI題目或訂閱層，未證實適合官方警察題庫 | CONFIRMED — https://quizlet.com/features/test ; https://help.quizlet.com/hc/en-us/articles/25946589648013-Studying-with-Practice-Tests |
| Kahoot self-study | 通用學習／離線替代 | Flashcards/Learn/Test/solo；官方中文說明 2026-09-30更新，offline mobile文章 2026-03-30更新 | MUST MATCH離線恢復與self-paced；DO NOT COPY leaderboard/gamification直到有需求證據 | CONFIRMED — https://support.kahoot.com/hc/en-us/articles/360021489353-How-to-use-self-study-modes-in-the-Kahoot-app |

競爭選擇：

- **MUST MATCH**：官方來源可追溯、答案狀態誠實、mobile practice、active session recoverability、資料範圍即時、可及性 fallback。
- **SHOULD BE BETTER**：無帳號／local-first、官方 source hash與可重跑資料品質、臺灣警察考試專用、可信 offline。
- **DIFFERENTIATOR**：官方來源的結構化 corpus + reproducible provenance/data-quality + focused no-login PWA。
- **DO NOT COPY**：generic AI-generated questions、排行榜、訂閱／帳號／cloud sync、通用 LMS、跨產品平台；除非真人 evidence建立問題與收益。

## Product Board 多視角推演

- CEO：若只做三件事，先把已開 P2 的 default 修正真正合併與回歸；再完成 115 年資料與答案狀態驗證；最後確認 active-session recovery。**不做** attempt platform、generic spaced-repetition engine、社群排行榜。
- CPO：核心價值是「官方、可追溯、可離線練習」，不是功能總數。#60仍是方向假設；候選 PR多不代表應直接投資。
- CTO：23 張 open PR重疊增加 review與回歸成本；應由 owner選一個整合面，不由 audit跨 PR重寫 scope。#77提供可整合的 offline browser evidence，但 default與deploy gate仍不可省。
- Staff/Principal Engineer：最小有效修正是局部 atomic cache pair、precached dependency、active checkpoint與資料顯示修正；不需要新 DB、sync service或跨 repo framework。
- UX Lead／Researcher：reload丟卷、圖片選項與答案可信度直接破壞完成旅程；相較之下 ledger/queue缺真人 journey evidence。
- Growth：現有證據不能量化留存／轉換；不把競品功能或50 persona模擬轉成 acquisition claim。
- CFO：重用既有 static/PWA與GitHub Pages；沒有 ROI支持帳號、cloud sync、hosted AI或付費資料來源。
- Security/Privacy：local-first與無帳號是優勢；若未來加入sync，必須先有scope/retention/consent，不在本輪擴建。
- QA：candidate CI只支援所跑路徑；合併後要在 exact default重跑首次離線、更新中斷、reload checkpoint、image choice與denominator。
- SRE：default沒有新產品 commit；不可把 PR綠燈當 deployment。需真實 Pages run與離線 sequence receipt。
- Accessibility：MOEX有文字／朗讀 fallback；本 repo image placeholder與真實 mobile/screen-reader未驗，阻止 CLEAN但不憑缺證據升 P1。
- Support：對外只能說修正候選存在；不得說 current site已修好。答案無官方來源時須明示，不能以社群 consensus冒充官方。
- 實質分歧：CPO/UX偏向先解 reload與圖片題；CTO/SRE偏向先收斂 #77的offline整合；CEO決策是「先合併可驗證的既有P2，不啟動新方向」，由 owner決定合併順序。

## 50 合成 Persona（30 回歸／20 探索）

模型多視角推演，不是 50 名真人、票數、發生率、營收或優先級證據；與固定 A01–J05 audit分開。R=回歸基線，E=探索。

| ID | 背景／限制 | 目標與旅程 | 摩擦／結果 | 分級／建議／證據 |
|---|---|---|---|---|
| P01 R | 三等考生；通勤手機 | 開卷→作答→暫停→續做 | reload遺失active exam | P2；#69；SOURCE |
| P02 R | 夜班員警；網路不穩 | 首次載入後離線統計 | Chart.js CDN可阻斷 | P2；#75；SOURCE |
| P03 R | 低速網路考生 | 更新中斷後開Analytics | code/data可能混版 | P2；#74；SOURCE |
| P04 R | 圖片題考生 | 看圖選答案 | 四題只有placeholder | P2；#58；SOURCE |
| P05 R | 信任官方答案者 | 查題→核對來源 | 非官方答案需清楚標示 | MAINTAIN；README/MOEX |
| P06 R | 首次訪客 | 由首頁找到練習入口 | 功能可達但scope數字不一致 | P2 docs；#61 |
| P07 R | 題庫維護者 | 匯入115年→驗證 | owner/TLS/PDF evidence未完 | P2 validation；#70 |
| P08 R | 離線桌機使用者 | 已安裝PWA後斷網 | core與analytics依賴不同 | P2；#74/#75 |
| P09 R | iPhone Safari使用者 | 切app後返回考試 | real mobile lifecycle未驗 | NRV；#69 |
| P10 R | Android低階機 | 長卷作答 | performance/restore未實測 | NEEDS_EVIDENCE |
| P11 R | 低視力使用者 | 放大搜尋與答題 | image fallback/screen reader未驗 | NRV；#58 |
| P12 R | Screen reader使用者 | 聽題與選項 | MOEX有fallback，本repo未驗 | NRV；a11y |
| P13 R | 鍵盤-only使用者 | 不用pointer完成mock | browser path未實測 | NRV；a11y |
| P14 R | PDF來源核對者 | 題目→官方PDF | provenance是差異化 | MAINTAIN；SOURCE |
| P15 R | 學習進度使用者 | 看歷史成績 | completed history會保存 | MAINTAIN；SOURCE |
| P16 R | 意外關頁使用者 | 重開未完成考試 | active state未保存 | P2；#69 |
| P17 R | 多分頁使用者 | 同時開兩份mock | consistency未驗 | NEEDS_EVIDENCE |
| P18 R | 無帳號使用者 | 立即練習、不註冊 | current local-first符合 | DIFFERENTIATOR |
| P19 R | 隱私敏感使用者 | 不上傳學習資料 | current local-first符合 | MAINTAIN |
| P20 R | 題庫統計使用者 | 確認總題數 | 36,210/36,760矛盾 | P2；#61 |
| P21 R | 維護工程師 | 依CI判斷可佈署 | green PR未進default | PROCESS；不要誤判 |
| P22 R | QA | 重跑offline序列 | candidate有browser job | PARTIAL；PR #77 |
| P23 R | SRE | 看Pages實際版本 | default沒有候選修正 | STILL_REPRODUCIBLE |
| P24 R | Support | 回答「是否修好」 | 只能說候選未部署 | MAINTAIN truthful status |
| P25 R | Owner | 管理重疊PR | 同根因PR過多 | NEEDS_REVIEW；不由audit關單 |
| P26 R | 新貢獻者 | 搜Issue避免重複 | 8張open已完整覆蓋 | DEDUP；不開單 |
| P27 R | 教師 | 指定年份/科目練習 | structured corpus可用 | MAINTAIN |
| P28 R | 舊裝置使用者 | cached app更新 | atomic update需真實驗證 | NRV；#74 |
| P29 R | 無障礙稽核者 | 判斷是否CLEAN | device/runtime缺證據 | NOT CLEAN |
| P30 R | Portfolio owner | 避免熱門repo偏置 | 完成公平游標 | NEXT police-exam-practice |
| P31 E | Anki重度使用者 | 錯題轉spaced repetition | 無真人需求與export evidence | RESEARCH/DEFER |
| P32 E | Quizlet使用者 | 手機Test mode | mobile baseline有競爭壓力 | SHOULD MATCH principle |
| P33 E | Kahoot使用者 | offline self-study | 不代表要gamification | DO NOT COPY |
| P34 E | 補習班班級 | 分享排名與作業 | multi-user未核定 | DEFER |
| P35 E | 跨裝置使用者 | 手機/桌機續卷 | cloud sync成本與隱私未證實 | RESEARCH only |
| P36 E | 付費意願低 | 免費使用官方題庫 | subscription非當前方向 | DON'T |
| P37 E | AI題目使用者 | 要求自動生成相似題 | provenance/幻覺風險高 | DON'T COPY |
| P38 E | 錯題本倡議者 | 聚合錯題重練 | #60需先證明高頻人工步驟 | NEEDS_EVIDENCE |
| P39 E | 考期規劃者 | deadline-aware queue | 需求與效果未建立 | #60 NEEDS_REVIEW |
| P40 E | 社群答案編輯者 | 無官方答案時協作 | authority/moderation未核定 | DEFER |
| P41 E | PWA安裝新手 | 第一次就離線 | first-load資產要完整 | P2；#75 |
| P42 E | 資料稽核者 | 比較JSON與PDF hash | reproducible provenance強 | DIFFERENTIATOR |
| P43 E | 低儲存手機 | 安裝完整題庫 | storage/performance未知 | NEEDS_EVIDENCE |
| P44 E | 海外考生 | 高延遲存取Pages | offline可減少網路依賴 | SHOULD BE BETTER |
| P45 E | 色覺差異使用者 | 看答題狀態 | 不應只靠顏色 | A11Y backlog |
| P46 E | 法規更新追蹤者 | 分辨年度與版本 | current corpus/provenance有利 | MAINTAIN |
| P47 E | 斷電情境 | 作答途中裝置重啟 | active checkpoint仍缺 | P2；#69 |
| P48 E | 惡意cache情境 | 版本中途切換 | atomic pair candidate存在 | P2；#74 |
| P49 E | 內容維護者 | 修一個數字後同步所有表面 | current stale值多處 | #61同根因 |
| P50 E | Red Team challenger | 推翻新增feature提案 | 既有P2與runtime gate已足夠 | REJECT new scope |

未產生 Synthetic Preference Share；沒有以persona「票數」決定優先級。

## 固定 A01–J05 checkpoint

- repo-local Round 1（blob `8cd77055035aec9df1bea94aa417f53ca14184ac`）已明示因 #58 等阻擋而 `NOT CLEAN`。
- current default仍包含 #58/#61/#69/#74/#75/#70 的 source或runtime blocker，且沒有新的完整 fixed-50合格輪次。
- current SHA連續合格 CLEAN rounds：`0/2`。本輪50 persona產品推演不替代固定 A01–J05，也不算另一輪。
- 結論：**NOT CLEAN**。缺證據可阻止CLEAN，但不自動把每個缺口升為P0/P1。

## Red Team

1. 23 張 open PR是否表示應該新開「PR治理平台」？否；重疊成本成立，但最小行動是 owner在既有 PR選整合面，不建新framework。
2. PR #77三個workflows全綠是否等於 #74/#75已修？否；default與Pages未變，離線first-load/upgrade sequence未在 deployed default驗證。
3. default沒有近期產品commit是否表示本輪可標CLEAN？否；已知 blockers仍可在current source重現，固定兩輪與runtime未滿足。
4. reload狀態遺失能否以「考生可重做」降為P3？不宜；中斷會破壞核心mock完成率與恢復性，現有P2合理，但沒有資料/權限重大損失所以不是P1。
5. 競品有spaced repetition是否應直接實作 #60？否；競品存在與 synthetic personas都不是需求／收益證據，保留 NEEDS_REVIEW。
6. 圖片題只四題是否應忽略？否；supported/可達題目無法作答是真實缺陷，但影響範圍有限，維持P2而非P1。
7. stale denominator是否只是美化？否；它讓維護者與使用者得到互相矛盾的資料範圍，且多表面重複；仍沿用 #61，不開新單。
8. 能否把所有 offline、checkpoint、image與docs綁成單一大改？否；根因不同，保留各自最小scope，不以控單量硬合併。
9. 能否因 owner已有多個PR就由audit改scope/關PR？否；存在active ownership，audit只記證據與建議。
10. 能否宣稱portfolio CLEAN？否；portfolio輪巡尚未完成，且本repo本身 `0/2`。

## NOW / NEXT / LATER / DON'T

- **NOW**：由 owner選定並合併 #74/#75 的最小整合候選；在新 default HEAD重跑 offline browser與Pages deploy。
- **NOW**：維持 #58/#61/#69/#70的既有最小scope與驗收；不要再開同根因 PR/Issue。
- **NOW**：若只處理三件事，順序為 offline correctness、active-session recovery、official data/answer truth（包含image與115 validation的owner取捨）。
- **NEXT**：在合併後做真實首次離線、更新中斷、reload/mobile、screen-reader與source-PDF驗證；按結果分類 VERIFIED_FIXED/PARTIALLY_FIXED/STILL_REPRODUCIBLE。
- **NEXT**：owner對 #60作 BUILD/NARROW/REJECT；BUILD只批准窄實驗，不授權原大方案。
- **LATER**：spaced repetition、錯題export、cross-device sync，只在真人journey與成本／隱私邊界成立後研究。
- **DON'T**：不做 generic LMS、leaderboard、AI-generated question platform、帳號／subscription、cloud sync、跨repo框架；不因競品或persona模擬擴權。

## Decision Memo

- **服務誰**：準備臺灣警察考試、需要可信官方來源、快速搜尋與無帳號離線練習的個人考生，以及維護資料真值的 owner。
- **選擇與競爭理由**：不和 Quizlet/Kahoot比通用 breadth或gamification；用臺灣警察考試專用 corpus、官方provenance、可重跑資料品質與focused PWA競爭。
- **差異化**：題目／答案來源與版本可追溯、資料處理可重現、local-first/no-login。只有在 runtime證據補足後才能主張offline可靠性。
- **前三優先**：(1) offline code/data/dependency一致；(2) active exam recoverability；(3) 115資料、答案狀態與圖片題的官方truth。
- **不做／刪除**：不新增通用AI出題、班級社群、排行榜、subscription、cloud sync、LMS或平台矩陣；對重複PR由 owner收斂，不由audit大量關閉。
- **風險／實驗**：最大風險是把candidate CI當成deployed/default修復。最小實驗是合併單一候選後，以新profile跑首次offline與upgrade中斷，再以mobile/reload驗證checkpoint；不用正式資料做故障注入。
- **Portfolio recommendation**：`police-exam-archive = INVEST in existing P2 closure / MAINTAIN narrow product / SIMPLIFY PR surface`；不是 REPOSITION/MERGE/ARCHIVE。完整Portfolio Ranking等待公平輪巡完成。
- 建議不是實作、merge、deploy、付費或外部寫入授權。

## Findings、去重與 write ledger

| 類型 | 數量 | 結果 |
|---|---:|---|
| New actionable finding | 0 | 無 |
| New Issue | 0 | 無 |
| Existing Issue update/reopen | 0 | 無新default狀態，不重複留言 |
| Candidate evidence update | 1 | PR #77 exact-head CI/Data Quality/Ingest成功；只記audit |
| Deduplicated existing roots | 8 | #58/#60/#61/#68/#69/#70/#74/#75 |
| Rejected/kept as evidence backlog | 7 | new PR-governance framework、generic LMS、AI題目、leaderboard、subscription、cloud sync、spaced repetition implementation |
| Severity correction | 0 | 既有P2/NOT_ESTABLISHED分類仍合理 |
| Scope reduction | 1 | #60維持窄研究／owner review，不把candidate PR當授權 |
| Verified fixed | 0 | 無產品修正進default |
| Issue lease | 0 | active branches/PR存在；未取得鎖 |
| Product/CI/config/settings writes | 0 | 無 |
| Audit report | 1 | 本檔，existing audit-only Draft PR #154 branch |
| Write blocked | 0 | 無 |

## 未完成、游標與 CLEAN

- Runtime pending：#58 source-PDF/deployed/mobile/screen-reader；#61 deployed readback；#69 reload/crash/mobile/storage migration；#70 owner/TLS/PDF/provider；#74/#75 merged default + Pages/offline sequence。
- Open PR重疊需 owner決策；本稽核沒有修改scope或關PR。
- `taichung-police-intel`的新default commits待其公平／事件式深讀；本輪沒有證據升為P0/P1插隊。
- Next fair cursor：`Reese-max/police-exam-practice`。
- Portfolio Ranking：未做；完整輪巡尚未完成。
- CLEAN：**NOT CLEAN / PARTIAL**；固定 A01–J05 current qualifying rounds `0/2`，不停止 recurring audit。
