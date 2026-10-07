# Product Board Audit — portfolio delta / neciken-summer-poem

- 稽核時間：2026-10-05T05:14:38Z
- 結論：**PARTIAL / NOT CLEAN**
- 規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- 規則 blob：`8167e10798071d2276addaff6b201c6b0e904a2a`
- 中央 inspected HEAD：`Reese-max/autodev-ng@a2378aa6fea3605f596e3ee264adbb2eb04c9010`
- 本輪公平游標：`neciken-summer-poem@d54daa39867374534fa340df5fa6fb7e8062e18c`（default `master`）
- 上輪報告：[2026-10-05T020515Z](https://github.com/Reese-max/autodev-ng/pull/150)；該 audit-only PR 仍開啟且目前不可直接合併，未把它視為產品修正或當前 default 證據。
- 性質：稽核／分流；`auto_implementation=false`。沒有修改產品程式、CI、設定、secret、權限或部署，沒有啟動 worker/GOAL。

## 摘要與本輪差異

自上輪報告後，多個產品 default HEAD 已前進，不能把本輪當成完全重複。報告寫入競態期間 central default 又從 `92faa916...` 前進至 `a2378aa6...`；規則 blob 未變，新增的是 long-horizon backend/lock proof。此 central 產品 delta 未用舊 CI 結論覆蓋，等待 exact-head run 完成。精確 HEAD GitHub Actions 顯示：`ai-flight-radar`（三個 workflow）、`ppt-studio`、`academic-mcp`、`note-filler`、`ai-novel-workstation`、`ninax-line-hermes`、`prompt-autoresearch`、`video-timeline-pipeline` 均為 success；`autodev-ng@a2378aa6fea3605f596e3ee264adbb2eb04c9010` 的 CI run 37267106395 在結論落筆時仍為 in_progress（前一精讀 HEAD `92faa916...` 為 success），故不把新 central HEAD 計為已驗證；`taichung-police-intel` 的新 HEAD 未找到 exact-head Actions，不把「沒有 run」推論為產品失敗。

本輪新的有效回歸證據是 `neciken-summer-poem` Issue [#1](https://github.com/Reese-max/neciken-summer-poem/issues/1) 的 CI 修正已進 default：push run [37253264588](https://github.com/Reese-max/neciken-summer-poem/actions/runs/37253264588) 在精確 HEAD `d54daa39867374534fa340df5fa6fb7e8062e18c` 實際執行 checkout、Python 3.11、安裝、`ruff check .` 與 `pytest`；log 為 Ruff “All checks passed” 與 `633 passed, 4 skipped, 43 subtests passed`。分類：**VERIFIED_FIXED / EXECUTED_REPRODUCTION**，但只驗證 lint/test gate，不代表官方 provider、瀏覽器／手機、真實投稿或完整 A01–J05 已 CLEAN。

本輪沒有新增 Issue、沒有重開、沒有改 scope。既有產品風險沒有因單一綠燈自動消失：
- `video-timeline-pipeline` Issue #42 仍為 **PARTIALLY_FIXED / P2 / NEEDS_RUNTIME_VERIFICATION**；default 後續 23 commits 未改 `web/widget.html`，上輪指出的 media-expiry 後 host-facing `modelContent` 可能殘留之根因沒有新反證。
- `video-timeline-pipeline` Issue #43 維持 **CANNOT_VERIFY**。
- `neciken-summer-poem` 既有 #3/#4/#8 已在先前 default source/隔離回歸中修復；本輪沒有把完整投稿與 UI runtime 宣稱為已驗證。
- 未針對過期的 #2/#7 開放 PR 改 scope或留言；#10 是 audit-only 草稿，未視為實作者鎖。

## Discovery / inventory

GitHub owner inventory 完整列舉為 46 repos：45 個未封存、1 個封存。封存的 `obsidian-vault` 依用途排除產品缺陷面，不因內容庫沒有產品表面硬開單。未封存清單：

`92-duty-scheduler`, `academic-mcp`, `adng-memory`, `ai-flight-radar`, `ai-novel-workstation`, `autodev-ng`, `avatar-vfo`, `cf-ai-router`, `cf-mcp-server`, `chatgpt-dual-pipeline`, `claude-mem`, `clinical-scribe-worker`, `cyber-prep-coach`, `exam-archive`, `flux-image-gen`, `google-maps-personal-mcp`, `herdr-skills`, `lobsterpulse`, `MaterialYouNewTab`, `minideck`, `neciken-summer-poem`, `ninax-line-hermes`, `note-filler`, `octobroker`, `openab`, `openab-pty`, `police-essay-mcp`, `police-exam-archive`, `police-exam-practice`, `polygraph-research-2026`, `ppt-studio`, `project-doctor-web`, `prompt-autoresearch`, `skill-foundry`, `soundbox-offline`, `spotify-playlist-organizer-mcp`, `studio`, `taichung-police-intel`, `taiwan-intel-dashboard`, `tick-stock-panel`, `travel-planning-app`, `travel-planning-mcp`, `UkePack`, `video-timeline-pipeline`, `voice-actress`.

本輪在全部 45 個未封存 repo 比對 default branch/HEAD 與近期 commits；優先精讀有產品 delta 的 10 個 repo。主要新 HEAD：
- `autodev-ng@a2378aa6fea3605f596e3ee264adbb2eb04c9010`
- `ai-flight-radar@772deb8a25d6147c816d3b6fdbfef9752c52f974`
- `ppt-studio@d5e478933c4f228d7e7432c886fc615fa850ce14`
- `academic-mcp@67304e6715f9f6cb468f99753075bfe9ff046b6b`
- `note-filler@7e29811376ec47b5fcf42ba0e9f8fdd5e9aee42e`
- `ai-novel-workstation@dd53542317db14708dbb0b823b95b4e2877af25b`
- `taichung-police-intel@f3a50291bf0271f47555bee0298a59cab75c9e4bc`
- `ninax-line-hermes@f820dfad1d318222a03fe3ec5d198baad4a93d8c`
- `prompt-autoresearch@6527919ed72526fcc70c661834aaad035171889c`
- `video-timeline-pipeline@88646f4b515cab6f0f9459039d6952478dbaa4b8`

Issue/PR 全域搜尋命中至少 100 筆的回傳上限，本輪沒有可靠地證明跨 repo 的所有歷史狀態均完整超過該界線；因此整輪標 **PARTIAL**，不宣稱完成全集或 portfolio ranking。下一公平游標：`ninax-line-hermes`（需延續持久游標，不只掃熱門 repo）。

## neciken-summer-poem 深度證據

### 支援流程與方向

README 定義的是「中文文學徵件工作站」：先查核官方截止日、格式、AI 條款與評審脈絡，再建立隔離草稿；明確 promote 才寫正式設定。正式投稿前重驗官方規則並產生 Rule-Drift Receipt；生成、修訂、盲選、凍結與 export 分離。owner 先前已明確把校準威脅模型縮為防意外誤用：採用 judge 前在本機重算金標，不建簽章／金鑰平台；本輪保留此裁定，不復活大型 trust framework。

default tree、README、workflow、核心 Python、tests、四輪固定 persona audit、既有 product-board audits、BACKLOG、所有 11 個 issue/PR 編號、branches、Actions 與 deployments 均讀取。deployments 為空不是產品故障；本產品是本機工作流。現在唯一 exact-default workflow 成功；未做付費模型呼叫、真實徵件提交或正式資料失敗注入。

### 回歸分類

| 路徑 | 結論 | 依據 | 限制 |
|---|---|---|---|
| #1 default lint/test gate | VERIFIED_FIXED | run 37253264588；Ruff + pytest 全步驟 success | 不等於 provider/UI/投稿 |
| #8 AI policy promotion preservation | SOURCE_CONFIRMED fixed（承接既有證據） | #9 已 merge；current source 未見回退 | 本輪未重做官方網站 runtime |
| #4 formal export policy gate | SOURCE_CONFIRMED fixed（承接既有證據） | #5 已 merge；既有隔離測試 | 未做真實投稿 |
| #3 freshness / receipt | SOURCE_CONFIRMED fixed（承接既有證據） | #6 已 merge；current source 未見回退 | 官方站規則變更仍需 runtime |
| 固定 A01–J05 | NOT CLEAN | 只有一個 default CI receipt；手機、瀏覽器、外部來源與真人路徑未完整 | CLEAN streak 仍 0/2 |

## 外部競品／替代工作流（查閱 2026-10-05）

| 產品/替代 | 最新官方證據 | 對照結論 | 證據級別 |
|---|---|---|---|
| [Sudowrite Story Bible](https://docs.sudowrite.com/using-sudowrite/1ow1qkGqof9rtcyGnrWUBS/what-is-story-bible/jmWepHcQdJetNrE991fjJC) | 2026-01-13 更新；集中故事元素供 AI 參照 | SHOULD BE BETTER：本產品應守住中文徵件規則 provenance，而非複製長篇導引 | CONFIRMED（vendor docs） |
| [Sudowrite plans](https://docs.sudowrite.com/plans--account/wBnmhtSyMcWtk2BLzifGkz/what-plans-are-available/mwfVvj2rGcKYs1BQy4Pdcb) | 2026-01-07 更新；方案差異與 credits | DO NOT COPY：不把付費 credits 或生成量當本產品成功指標 | CONFIRMED |
| [Novelcrafter Codex](https://www.novelcrafter.com/features/codex) | 2026-10-05 查閱；可組織並分享 Codex entries | DIFFERENTIATOR：本產品的競爭點是 contest-specific fail-closed receipt，不是泛用世界觀 wiki | CONFIRMED（vendor page） |
| [Novelcrafter changelog](https://novelcrafter.canny.io/changelog) | 2026-03-21：Codex tracking/category 改善 | MUST MATCH 的不是功能數，而是可追溯狀態與錯誤復原 | CONFIRMED（official changelog） |
| [Chill Subs tracker](https://support.chillsubs.com/faq/using-chill-subs) | 2026-10-05 查閱；追蹤投到哪裡、何時與結果 | SHOULD BE BETTER：正式交付應有清楚 receipt；不建社群統計/市場 | CONFIRMED（official help） |
| [Submittable forms](https://submittable.help/en/articles/3620637-getting-started-step-1-building-forms) | 2026-05-04；表單與 50+ 檔案類型 | MUST MATCH：投稿前格式／必填驗證；但不複製申請管理平台 | CONFIRMED（official help） |
| 手工瀏覽器＋本機文件 | 零 SaaS 綁定、可逐頁確認官方規則 | 有效替代；本產品只有在 receipt、隔離與可恢復性更可靠時才值得使用 | LIKELY（workflow inference） |

競品頁面是功能／價格宣稱，不是本產品收益、完成率或營收證據。沒有合成 switching share，也沒有真人票數。

## 模型產品董事會（多視角推演，非獨立專家共識）

- CEO：只做三件事——守住規則來源到正式 export 的一致性、保留可恢復本機流程、補足真正 runtime receipts。不做 marketplace、社群、代投稿。
- CPO：把首次成功定義為「從官方規則到可解釋的隔離草稿」，不是產生最多詩。
- CTO / Principal：現有局部 receipt 與 validators 足夠；反對 ledger/registry/platform 重寫。
- UX / Research：目前 CLI/README 有文字狀態；但瀏覽器、手機、讀屏器仍缺執行證據，不能由合成人格宣稱可用。
- Growth：可用差異化是中文徵件規則 provenance；反對用競品功能清單製造 roadmap。
- CFO：維持 local-first 與使用者自有模型額度；任何付費 provider 實驗都需另行核准。
- Security / Privacy：保留 fail-closed 與 secret/manuscript 本機邊界；DNS/redirect 假設沒有隔離重現前保持 NEEDS_EVIDENCE。
- QA / SRE：#1 已驗證修復，但單次綠燈不是兩輪固定 persona CLEAN；持續記錄 exact SHA/job。
- Accessibility / Support：CLI 是鍵盤可達，不等於 Studio 或 mobile 已合格；文件要說清楚「已驗證」與「待 runtime」。
- 實質分歧：Growth 想把 contest discovery 擴為分發入口；Security、CFO、CEO 否決，因需求與權限未證明，且最小產品價值是安全準備，不是平台化。

## 50 個合成人格（30 回歸 + 20 探索）

純模型推演；不代表真人比例、發生率、收入或優先級。每列依序記背景/限制、目標、旅程、摩擦、結果、分級/建議/證據。

| ID | 類型 | 背景/限制；目標；任務/旅程；摩擦 | 結果；分級／建議／證據 |
|---|---|---|---|
| R01 | 回歸 | 初次詩人/低技術；安全建立比賽；README→discover→draft | 可達但未真人執行；P3/保留 quick start/SOURCE |
| R02 | 回歸 | 回鍋投稿者/舊 profile；刷新規則；discover→receipt→promote | #3 路徑已修但外站未跑；P2/NEEDS_RUNTIME |
| R03 | 回歸 | 學生/規則焦慮；辨識 AI 條款；official→draft | #8 來源一致性已修；P1 回歸保留/SOURCE |
| R04 | 回歸 | 短時段家長；斷點續作；resume run | 持久檔存在；P2/中斷 runtime 待驗證 |
| R05 | 回歸 | 文學編輯；批閱候選；blind A/B/C→freeze | 流程有界；P3/不把模型評分當決策/SOURCE |
| R06 | 回歸 | 繁中作者；精確術語；policy review | 文字契約清楚；P2/保留原文 provenance/SOURCE |
| R07 | 回歸 | 雙語作者；比對翻譯；source→profile | 翻譯不可覆蓋 official；P2/待外站 runtime |
| R08 | 回歸 | 手機查閱者；看 readiness；開 status | mobile 未驗；NOT_ESTABLISHED/不開單 |
| R09 | 回歸 | 讀屏使用者；聽見阻擋理由；Studio review | 未執行；P2 validation backlog |
| R10 | 回歸 | 純鍵盤使用者；完成 approve；tab/command | CLI 可達，Studio 未驗；P2 runtime |
| R11 | 回歸 | 慢網路；避免半套資料；refresh failure | 應 fail closed；P1 regression scenario |
| R12 | 回歸 | 離線作者；分辨舊 receipt；offline draft | 本機可用；P2/顯示 freshness/SOURCE |
| R13 | 回歸 | 多比賽作者；避免串 profile；switch contest | 隔離目錄存在；P1 identity regression |
| R14 | 回歸 | 截止日當天；最後 preflight；export | #4 gate 已修；P1/真實 portal 未驗 |
| R15 | 回歸 | 協助者；核來源；review evidence | receipt 可追；P2/保留最小摘要 |
| R16 | 回歸 | 主辦人格；禁止 AI；publish→ingest | 禁止值應保持；P1/#8 regression |
| R17 | 回歸 | 舊版規則作者；比較修訂；refresh | revision chain 已實作；P2/runtime needed |
| R18 | 回歸 | 模板使用者；複製 contest；promote | evidence 應壓過模板；P1/regression |
| R19 | 回歸 | 非技術者；一次指令；quick start | setup 有界；P3/不增加 wizard |
| R20 | 回歸 | power user；檢查 JSON；schema→meaning | 語義一致性是核心；P1/source tests |
| R21 | 回歸 | 低視力；讀 status；terminal/Studio | CLI 文本存在，視覺未驗；P2 runtime |
| R22 | 回歸 | 時壓 reviewer；快速解 mismatch；promote | 必須阻擋且解釋；P1/regression |
| R23 | 回歸 | 規則沉默；避免樂觀推論；discover | unknown 應留 unknown；P1/regression |
| R24 | 回歸 | 拒用生成 AI；只用整理；configure | 不應暗示允許；P1/source boundary |
| R25 | 回歸 | 只用拼字；辨識 assistance；policy | 類型需求不明；RESEARCH/不要擴 schema |
| R26 | 回歸 | Email 投稿；產生包；export | gate 有效但真實寄送不在範圍；P1 runtime |
| R27 | 回歸 | Portal 投稿；手動複製；preflight | receipt 仍有價值；P1/不自動提交 |
| R28 | 回歸 | 支援志工；診斷申訴；查 SHA/receipt | 可追溯；P2/保留 evidence |
| R29 | 回歸 | Windows 維護者；跑 tests；CI/local | exact hosted Linux 綠；Windows 未驗；P2 |
| R30 | 回歸 | SRE；驗證 gate；Actions run | #1 VERIFIED_FIXED；P2 fixed/EXECUTED |
| E01 | 探索 | 散文投稿者；正式閉環；brief→judge→export | BACKLOG 仍未授權；RESEARCH/不開新單 |
| E02 | 探索 | 小說作者；章節 provenance；plan→write | 有入口但正式 submission runtime 未證；P2 evidence |
| E03 | 探索 | 多文類作者；防跨文類混用；switch genre | 現有 backlog root；DEDUP/不另開 |
| E04 | 探索 | 新比賽偵測；自動找候選；discovery | 只產隔離草稿；P2/保持人工 promote |
| E05 | 探索 | 來源互相矛盾；保守決策；two sources | fail closed 是最小解；P1 scenario |
| E06 | 探索 | 來源 redirect；安全抓取；URL fetch | DNS 假設未重現；NOT_ESTABLISHED |
| E07 | 探索 | 官方站暫停；保留舊證據；retry | 應標 freshness；P2/runtime |
| E08 | 探索 | contest 改名；避免錯綁；identity | URL/edition 綁定較小；P2/source |
| E09 | 探索 | 重複點擊；防雙提交；UI action | 本輪未跑 UI；NOT_ESTABLISHED |
| E10 | 探索 | 損壞 JSON；清楚失敗；parse→promote | fail closed 測試應保留；P1 regression |
| E11 | 探索 | symlink workspace；防越界；export | 未隔離重現；SECURITY NEEDS_EVIDENCE |
| E12 | 探索 | 低儲存裝置；控制 artifacts；generate | 沒有目前失敗證據；P3 observe |
| E13 | 探索 | 自帶模型；成本可控；generate | 不新增付費承諾；P2/另行核准 |
| E14 | 探索 | 完全無模型；只做查核；discover/manual | local-first 可成立；P3/文件明示 |
| E15 | 探索 | 團隊協作；共享 contest；copy files | 真實需求未證；OPPORTUNITY DEFERRED |
| E16 | 探索 | 公開作品集；發布成品；export→share | 不屬核心；DON'T/不建 gallery |
| E17 | 探索 | 比賽提醒；截止管理；track deadline | 現有 receipt 可用；RESEARCH/不建 SaaS |
| E18 | 探索 | 申訴取證；還原決策；receipt audit | 高契合；P2/維持 SHA 與 source |
| E19 | 探索 | 多人評審；共識校準；judge | owner 已選本機重算；不建簽章平台 |
| E20 | 探索 | 長期維護者；控制複雜度；upgrade | 633 tests 綠；P2/先刪重複入口再加功能 |

## Red Team

1. 「一個綠色 CI 就可宣告 CLEAN」：否決。它只證明目前 workflow 覆蓋的 lint/test；固定 A01–J05、外部來源、Studio/mobile 與真實交付仍缺 runtime。
2. 「既有 #2/#7 還 open，所以 #1 沒修」：否決。default 精確 HEAD 已有完整成功 run；舊 PR 狀態不應凌駕 default 證據。
3. 「應建立跨專案 receipt ledger」：否決。現有 contest-scoped receipt 足以解根因；大型共用框架缺必要性。
4. 「競品有 tracker/Codex，所以要立刻複製」：否決。競品功能不證明本產品需求；先守住規則一致性。
5. 「DNS/redirect 靜態可能性應升 P1」：否決。尚無隔離 reproduction 與可達影響鏈，保持 NEEDS_EVIDENCE。
6. 「audit-only PR 不可合併代表產品回歸」：否決。報告分支衝突不是產品路徑失敗。

## Decision Memo

- 服務誰：需要在中文文學徵件中保存官方規則、草稿隔離與可解釋交付證據的本機作者。
- 為何選擇／如何競爭：不以泛用生成量競爭；以 contest-specific provenance、fail-closed promotion/export、本機可恢復性差異化。
- 前三優先：① 保持 #3/#4/#8 的回歸矩陣；② 對真正支援的 browser/mobile/external-source 路徑補 runtime receipt；③ 清理過期實作 PR/重複入口，但不把清理當修復。
- 不做／刪除：不建 marketplace、社群、代投稿、跨產品 ledger、簽章 PKI、付費 provider 自動啟用；避免把舊 #2/#7 恢復成平行大方案。
- 風險／實驗：最小下一實驗是隔離環境跑官方來源 refresh + mismatch + export 三情境，明確 BUILD/NARROW/REJECT；不得觸碰正式資料。
- 投資建議：`MAINTAIN` 核心 trust path；`SIMPLIFY` 過期分支/重複入口；`PAUSE` 泛用平台化與分發；不建議 ARCHIVE。

## NOW / NEXT / LATER / DON'T

- NOW：保留 #1 VERIFIED_FIXED receipt；監看 #3/#4/#8 同根因回歸；不新增 issue。
- NEXT：輪巡 `ninax-line-hermes`；對有新 default delta 的產品只在原情境與鄰近路徑上回歸。
- LATER：browser/mobile/讀屏與官方網站隔離 runtime；資料充分後再判斷是否有窄研究單。
- DON'T：自動實作、合併、部署、啟動 worker、付費呼叫、對正式資料注入失敗、從合成人格推算需求。

## Accounting / limitations

- 新 Issue：0；更新/重開 Issue：0；新 audit report：1。
- 已驗證修復：1（neciken #1）。
- confirmed regression：0。
- 去重/拒絕升級：6 類（平台化、tracker/Codex 複製、DNS P1、舊 PR 反推未修、audit conflict 反推產品回歸、單綠燈 CLEAN）。
- runtime pending：官方來源、Studio/mobile/accessibility、真實投稿、video #42 host state。
- CLEAN：否；固定 A01–J05 合格完整輪次仍 0/2。
- 未完成：跨 repo issues/PR 搜尋回傳達 100 筆上限，沒有以工具限制冒充完整；不做 portfolio ranking。
