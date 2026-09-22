# police-exam-archive 產品董事會增量巡檢：Analytics 離線契約

- 查閱日：2026-09-22
- 稽核類型：模型多視角推演、50 synthetic personas 與 GitHub 原始證據檢查；不是 50 位真人研究或獨立專家共識
- 品質規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md` blob `8167e10798071d2276addaff6b201c6b0e904a2a`
- Repository：`Reese-max/police-exam-archive`，default `master@a0b5dbb9352b5558dbe62445c6452947dbd2501b`
- 產品基線：`fe497aa9fac7a4e4a411e663edeef6c1c5356577`；default 最新 commit 僅為 audit/docs
- 決策：**INVEST / SIMPLIFY / MAINTAIN；先使既有 PWA 離線承諾成立，不增加學習平台或同步架構**

## 結果

本輪確認兩項在上一份產品董事會報告之後出現、已由 fixed-persona audit 正確追蹤的獨立 P2：

1. [#74](https://github.com/Reese-max/police-exam-archive/issues/74) `BUG / P2 / SOURCE_CONFIRMED / NEEDS_REVIEW / auto_implementation=false`：`analytics-chart.js` 與 `analytics-chart-data.js` 各自獨立 network-first；單一請求成功、另一請求失敗時可組成跨版本 pair。
2. [#75](https://github.com/Reese-max/police-exam-archive/issues/75) `BUG / P2 / SOURCE_CONFIRMED / NEEDS_REVIEW / auto_implementation=false`：Analytics HTML 與本地腳本屬 core precache，但 Chart.js 4.4.1 只從 jsDelivr 按需快取；fresh profile 從未線上進 Analytics 時，第一次離線開啟會缺核心依賴。

兩者不是同一 fingerprint：#74 是 same-origin code/data cohort 在部分網路成功下混版；#75 是 first-offline visit 缺外部 runtime dependency。PR #48 的兩個 unresolved、not-outdated review threads 分別精確支持兩項根因。沒有新建重複 Issue。

## 四道開單判準

- 問題成立：受影響者是使用 PWA/慢網/離線 Analytics 的考生；兩條失敗路徑都可由目前 source 與 service-worker routing 決定。
- 分級合理：皆為 P2；可破壞圖表可用性與統計一致性，但沒有資料遺失、權限風險、全站停擺或已知 production incident，因此不升 P1。
- 最小範圍：#74 只需 shared pair identity 加一致 promotion/fail-together；#75 只需 vendor/precache 固定依賴，或明確取消 Analytics offline-core 承諾並降級。不要新增後端、資料庫、帳號、同步服務或通用 cache 平台。
- 研究與實作分離：Issue 維持 NEEDS_REVIEW；沒有 owner 授權、實作 branch、merge 或 deploy。

## 執行證據與限制

- CI run `33989440607` 的 Python 3.10/3.11/3.12 jobs 均成功，包含 tests、generated assets、analytics sync 與 JS syntax。
- Pages run `33989440679` 的 deploy job 成功，確實執行 build、upload 與 deploy-pages。
- 上述 receipts 沒有 fresh-profile offline navigation、單一資源網路失敗注入或 cache cohort 測試，故不證明 #74/#75 通過。
- 本輪沒有對正式站斷網、清 cache 或注入失敗；證據層級仍是 `SOURCE_CONFIRMED`，修復狀態為 `STILL_OPEN / NEEDS_RUNTIME_VERIFICATION`，不是 VERIFIED_FIXED。

## 外部競品與替代工作流

查閱日均為 2026-09-22；產品宣稱不視為獨立效果證據。

| 來源 | 狀態 | 可移植訊號 | 決策 |
|---|---|---|---|
| [Quizlet Learn](https://quizlet.com/features/learn) | CONFIRMED | 自適應題型與弱點練習，核心價值是快速開始練習 | SHOULD BE BETTER：本產品以官方題源與可追溯性勝出；不複製 AI 題目生成 |
| [Quizlet Study Guides](https://quizlet.com/features/study-guides) | CONFIRMED | 把材料轉為摘要、卡片與測驗 | DO NOT COPY：沒有證據支持在 cache 修復中擴大為生成式學習套件 |
| [Anki sync manual](https://docs.ankiweb.net/syncing.html) | CONFIRMED | 本機資料與明確同步邊界是成熟替代工作流 | DIFFERENTIATOR：維持免帳號、本機優先；不要為離線修復新增雲端同步 |
| [MDN PWA caching](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching) | CONFIRMED，頁面更新 2025-06-12 | precache 應包含該版本確定需要的資源；cache 策略需平衡離線與 freshness | MUST MATCH：必要依賴完整、版本邊界可驗證 |
| [web.dev PWA caching](https://web.dev/learn/pwa/caching) | CONFIRMED | 離線 UI 應包含渲染基本體驗所需的 JS/data/font；不提供完整離線也應明確降級 | MUST MATCH：不要顯示半可用 Analytics |
| [Chrome Workbox strategies](https://developer.chrome.com/docs/workbox/caching-strategies-overview) | CONFIRMED | 不同資產可使用不同策略，但策略本身不提供跨資產原子一致性 | SHOULD BE BETTER：針對 code/data pair 加最小 cohort contract |

## 產品董事會分歧

- CEO：若只做三件事，做 #74 pair consistency、#75 first-offline dependency、#58/#61/#69 已開修復的 default-branch驗證；不做帳號、雲端同步與 AI 解題。
- CPO：支持 offline-first 作為差異化，但主張若 runtime 測試成本過高，可先取消 Analytics offline-core 宣稱而非硬擴張。
- CTO：兩個 P2 是正交根因；偏好固定版本 dependency 與小型 pair manifest，不接受全面重寫 service worker。
- Staff/Principal Engineer：要求 pair 在部分成功時 fail together 或回退同一已知版本，不能只把兩支檔案都改成 network-first。
- UX Lead：半載入圖表比明確離線訊息更令人不信任；錯誤狀態須能恢復。
- Researcher：50 personas 只證明情境覆蓋，不證明實際離線使用率；先收集 bounded browser receipt。
- Growth：可用性可靠後再談分享與留存，不把競品功能當新增 scope。
- CFO：最小修正可沿用靜態架構；否決新後端、付費監控與同步服務。
- Security/Privacy：vendored dependency 可減少 runtime 第三方依賴，但本輪未建立供應鏈弱點或安全 P1。
- QA：要求兩條 deterministic browser test：partial-success mixed pair，以及 fresh homepage-only install 後 first-offline Analytics。
- SRE：CI/Pages 綠燈不覆蓋 service-worker runtime；需要 exact SHA、fresh profile 與 cache inspection receipt。
- Accessibility：離線錯誤提示需可由螢幕閱讀器理解；目前無 AT runtime 證據。
- Support：使用者應得到「需連線」或可用舊一致版本，不應只看到空白圖表。

## 50 synthetic personas 覆蓋

沿用固定 A01–J05 基線並與探索角色分開；完整逐人矩陣見 [Round 4 durable report](https://github.com/Reese-max/autodev-ng/blob/bad147694c72fc98baf233634f13600607e6dcd4/docs/portfolio-audit/round-5-progress-2026-09-21-0848Z-fixed50-police-exam-archive-r4.md)。本輪產品董事會重新映射如下：

- A01–A05：A04→#69；A05→#58；其餘首次成功仍需 runtime。
- B01–B05：B04→#61；B05→#69/#75；其餘無新 P2。
- C01–C05：C01/C03→#58/#61；C04→#69；C05→#74/#75。
- D01–D05：D01/D05→#58/#61；CI/Pages 證據不替代 browser runtime。
- E01–E05：E03/E05→#69；其餘實體易用性未驗。
- F01–F05：F04/F05→#69；low-vision/touch 證據仍 pending。
- G01–G05：G02→#58；G05→#74/#75；keyboard/zoom/runtime pending。
- H01–H05：H04→#74/#75；H05→#61；三版本 CI 已執行。
- I01–I05：I02→#69；I04/I05→#74/#75；無新獨立 fingerprint。
- J01–J05：J03→#69；J05→#58/#61/#74/#75；large-corpus runtime pending。

Coverage：50/50 synthetic personas 已映射。這不是實際使用率、真人偏好、營收或優先級證據。

## Red Team

- 反證一：或許 Analytics 不承諾離線。否決：目前 `analytics.html` 與其本地 code/data 明確列入 `CORE_ASSETS`，形成可合理到達的 offline-core 契約。
- 反證二：CI 與 Pages 都是綠燈。否決：現有 jobs 沒有執行 service-worker browser scenario 或 failure injection。
- 反證三：#74/#75 應合併。否決：觸發條件、缺失資產與最小修法不同，硬合併會模糊驗收。
- 反證四：應導入 Workbox/完整離線平台。否決：目前局部 pair/dependency 修補足以處理根因；大型重寫沒有必要性證據。
- 反證五：競品功能更多，所以應加 AI tutor。否決：競品能力不證明本產品缺陷或收益，且會偏離官方題源與 local-first 定位。

## Decision Memo

- 服務誰：需要可靠官方警察特考題源、免帳號練習、慢網或短暫離線仍能恢復的考生。
- 選擇理由：可追溯官方 corpus 與低摩擦靜態使用是核心，不與大型學習平台比功能數。
- 差異化：官方來源、本機優先、可驗證資料品質；可靠性比新增生成式功能優先。
- 前三優先：#74、#75、完成 #58/#61/#69 的 default-branch same-scenario 驗證。
- 不做／刪除：不加帳號、同步、LMS、商城、AI 解題、通用 cache framework；若無法安全支援 Analytics 離線，刪除該 offline-core 承諾。
- 建議：`INVEST / SIMPLIFY / MAINTAIN`；不 `REPOSITION`、不 `MERGE`、不 `ARCHIVE`。

## NOW / NEXT / LATER / DON'T

- NOW：保留 #74/#75 為獨立 P2，等待 owner review；任何候選修正都需 exact-head browser receipts。
- NEXT：公平游標推進至 `Reese-max/police-exam-practice`，但若相關修正先進 default，優先做同情境回歸。
- LATER：完成 fresh-profile offline、partial-success、mobile、AT/zoom runtime 證據。
- DON'T：不重複開單、不把綠燈當 offline 驗證、不啟動實作、不改產品/CI/settings。

## 寫入與 CLEAN

- 新建 Issue：0；更新/重開 Issue：0；去重並確認既有新 finding：2（#74/#75）。
- 產品程式、CI/config、branch、PR、merge、deploy、worker/GOAL、付費或正式資料操作：0。
- Verified Fixed：0；confirmed regression：0。
- `police-exam-archive`：**NOT CLEAN, 0/2**；整體 Portfolio：**NOT CLEAN**。