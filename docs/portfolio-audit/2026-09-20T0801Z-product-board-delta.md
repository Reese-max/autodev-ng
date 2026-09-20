# PPT Studio 產品董事會增量稽核 — 2026-09-20T0801Z

## 稽核結論

- **狀態：PARTIAL / NOT CLEAN（0/2）**。本輪完成 `ppt-studio` 的 default HEAD、核心產品路徑、依賴、全部 open Issues/PR、PR review、branch、commit-bound Actions 與既有產品方向增量核對；沒有把中央稽核提交當成產品修正，也沒有執行正式 provider、Windows、瀏覽器、PowerPoint／LibreOffice 或部署驗證。
- **董事會建議：INVEST / SIMPLIFY / MAINTAIN。** 先守住遠端授權、正確的版本／目標身分與單一寫入序列，再談更廣的 AI 設計能力。不要建立通用 object graph、協作平台、版本資料庫或新的 validation framework。
- **本輪有效 finding：4。** `BUG/P1` 2、`BUG/P2` 1、`VALIDATION_GAP/NOT_ESTABLISHED` 1。新增／更新／重開 Issue 0；避免重複 4；Verified Fixed 0；Issue write blocked 0；report write pending（本文件）。

## Discovery 與證據邊界

| 項目 | 結果 |
|---|---|
| Portfolio inventory | GitHub 完整分頁搜尋得到 Reese-max 自有、未封存 repositories 41 個；本輪依公平游標選擇久未正式重檢的 `ppt-studio`。|
| 品質規則 | `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`，blob `8167e10798071d2276addaff6b201c6b0e904a2a`。|
| Default branch / HEAD | `master@dc2aab78dbf5acc41d97fbf17645b8331cd21bfd`；該 HEAD 為 audit-only commit，產品基線仍為 `da303f7cdc93883b6aed1b414286ef640a6c99ee`。|
| 候選修正 | PR #8 head `0370309275491f879c29c4a5da9f532011253bfa`；修正 #7 的翻譯 lost update，但仍有 unresolved review。|
| Actions | PR #8 run `35068025415` 的 `lint` 與 `kpi-baseline` 均 `failure`，兩 job 都是 `steps=null`、`logs_url=null`。只能確認 job 未產生可讀步驟；直接原因為 `UNKNOWN`。|
| Issue / PR / branch | 核對 open Issues #1/#3/#5/#6/#7/#9、open PR #2/#4/#8、#5/#9 全部 comments、PR #8 review threads；未找到 #5/design implementation branch 或 current owner heartbeat。|
| 執行證據 | 本輪為 `SOURCE_CONFIRMED` 靜態核對；沒有 `EXECUTED_REPRODUCTION`。需要的 runtime 均標記 `NEEDS_RUNTIME_VERIFICATION`。|

## Findings 與追蹤

### F1 — FastAPI 0.122.0 把安全修補擋在 Starlette 0.x

- **分類：** `BUG / P1 / decision_priority=HIGH_BEFORE_REMOTE_USE / SOURCE_CONFIRMED / NEEDS_REVIEW / NEEDS_RUNTIME_VERIFICATION / auto_implementation=false`。
- **目前受影響者與可到達流程：** README 支援 Windows 與遠端／Docker 使用。`requirements.txt` 固定 `fastapi==0.122.0`；該版 metadata 限制 Starlette `<0.51.0`。default code 的 `NetworkAuthMiddleware` 以 `request.url.path` 決定 `/api/health` 與 `/` 免驗證，正落在 GHSA-86qp 的受影響安全決策模式；同一 app 以 default `StaticFiles(..., follow_symlink=False)` 掛載 `/static`，落在 Windows UNC/NTLM 公告的受影響模式。
- **上游已確認：** GHSA-86qp-5c8j-p5mr（2026-05-21）影響 Starlette `<=1.0.0`、修於 `1.0.1`；GHSA-wqp7-x3pw-xc5r（2026-05-23）影響 `<1.1.0`、修於 `1.1.0`；GHSA-82w8-qh3p-5jfq（2026-06-12）影響 `<1.3.1`、修於 `1.3.1`。FastAPI 0.133.0 已能搭配 Starlette 1.x。
- **不做的後果：** remote deployment 的 path-based auth 可能被 malformed Host 影響；Windows StaticFiles 可在回 404 前觸發 SMB 並外洩服務帳號 NTLMv2；大量 urlencoded fields 仍有 DoS 面。
- **最小有效範圍：** 只升級 FastAPI 至支援 Starlette 1.x 的相容版本並釘住 `starlette>=1.3.1`，跑既有 auth/static/upload/form regression，加一條 raw Host-path auth 測試與 Windows 隔離驗證；不做全面 dependency refresh。
- **追蹤：** 已由 [Issue #9](https://github.com/Reese-max/ppt-studio/issues/9) 完整追蹤；本輪未重複或改寫。

### F2 — PR #8 只鎖翻譯，設計建議套用仍可被翻譯靜默覆寫

- **分類：** `BUG / P1 / decision_priority=HIGH_PRE_MERGE / SOURCE_CONFIRMED / NEEDS_REVIEW / NEEDS_RUNTIME_VERIFICATION / auto_implementation=false`。
- **因果鏈：** PR #8 在整段 provider await 與 deck replacement 持有 `_get_lock(pid)`；`POST /api/apply-design-suggestion/{pid}` 仍不查、不取同一把鎖，直接 in-place 修改、version+1、rebuild。接受設計修正若和翻譯重疊，翻譯可用舊 snapshot 覆寫或在 rollback 恢復舊狀態；兩請求都可能回成功，形成支援中 deck-edit flow 的靜默內容遺失。
- **最小有效範圍：** 讓 apply endpoint 加入既有 per-presentation lock/409 contract，新增兩方向 deterministic overlap 測試與 rebuild-failure rollback 測試；不引入 queue/state machine。
- **追蹤／互斥：** 已有 unresolved [PR #8 review thread](https://github.com/Reese-max/ppt-studio/pull/8#discussion_r4023485783)，且 #7/branch/PR owner 活躍，故 `SKIPPED_LOCKED`；未修改 PR 或另開 Issue。

### F3 — 舊設計建議按 `slide_index` 套到新內容，可刪錯頁文字

- **分類：** `BUG / P2 / decision_priority=HIGH / SOURCE_CONFIRMED / NEEDS_REVIEW / NEEDS_RUNTIME_VERIFICATION / auto_implementation=false`。
- **誰受影響／可到達流程：** 使用者取得 `/api/suggest-design/{pid}` 建議後，可以先編輯或重新排序投影片，再按「採納並套用」。suggestion key 只含 message/severity/slide_index/type，沒有 deck version、target identity 或 content hash；apply 只以當下 `slide_count` 驗證舊 index。
- **實際後果：** `font_size` 會把當下該 index 的長標題截到 30 字；`spacing` 會把超過 6 條的當下 bullets 砍到 5 條。因此舊建議可合法通過並破壞另一張或已改過的 slide，而不是回 stale/conflict。
- **最小有效範圍：** suggestion response 帶 `base_version` 與 target content identity；apply 在同一 deck lock 內核對，變動即回 409 `STALE_SUGGESTION`。驗收只需：unchanged 成功、edit 後拒絕、reorder 後拒絕、translation overlap 拒絕、rebuild rollback 保持原內容。
- **替代與非目標：** 使用者可重新產生建議，但目前 UI 未強制；不需要先完成 #5 的通用 object graph、stable object registry 或跨 repo framework。
- **追蹤／互斥：** #5 已記錄 stale-base research，而 PR #8 正在改同一 mutation surface；本輪以中央報告保留獨立 fingerprint，標記 `SKIPPED_LOCKED`，待 owner 完成活躍 PR 後再判斷是否從 #5 窄化為單根因 bug，避免搶 scope／重複開單。

### F4 — PR #8 沒有 commit-bound 可讀測試收據

- **分類：** `VALIDATION_GAP / severity=NOT_ESTABLISHED / decision_priority=P2 / NEEDS_EVIDENCE / auto_implementation=false`。
- **證據：** run `35068025415` 的兩 job 為失敗，但 `steps=null`、無 logs；不可推論 pytest/ruff 失敗、通過、額度不足或 policy block。
- **最小有效範圍：** 取得 exact-head 的真實 workflow 收據，至少涵蓋 PR 新增 concurrency tests 與 K5 design mutation overlap；若仍零步驟，先處理共同 Actions admission 根因。
- **追蹤：** #7/PR #8 已承接；`SKIPPED_LOCKED`，不另開 validation issue。

## 外部競品與替代工作流（查閱 2026-09-20）

公開資料是產品能力宣稱，不是獨立效果證據；沒有把競品功能直接轉成本產品缺陷或收益。

| 產品／替代 | 最新官方證據 | 與 PPT Studio 的含義 | 分類 |
|---|---|---|---|
| Google Slides + Gemini | 官方 Slides 頁面目前主打 prompt 產生 slide/圖像、PowerPoint/Canva import、即時共編、版本歷史、行動與離線。 | **MUST MATCH：**單人流程至少不能錯套／覆寫內容。**DO NOT COPY：**共編、會議、外掛廣度。 | CONFIRMED |
| Microsoft PowerPoint for web + Copilot | 官方 PowerPoint web 提供原生建立／編輯／分享；Copilot 路徑的價值依附於原生 deck 與既有版型。 | **SHOULD BE BETTER：**本地、可攜、PPTX round-trip 收據。不要競爭完整 Office 平台。 | CONFIRMED |
| Pitch | 官方 Help Center 目前涵蓋可編輯 blocks、品牌 template、手機 notes、AI image editing、分享 analytics。 | **MUST MATCH：**bounded mutation 必須綁定正確 block/版本。**DO NOT COPY：**workspace/analytics/deal-room。 | CONFIRMED |
| Canva | 官方產品／newsroom 延續 AI design 與可編輯資產、品牌、素材工作流。 | **DIFFERENTIATOR：**PPT Studio 可聚焦本地、開放 PPTX、最小可驗證改動。不要複製素材市場與 campaign suite。 | CONFIRMED（效果 UNKNOWN） |
| Gamma | 官方產品更新延續 AI-native doc/deck/site 與快速生成。 | **DIFFERENTIATOR：**真正可編輯 PPTX 與明確 conflict receipt；不要追 web-publishing 廣度。 | CONFIRMED（效果 UNKNOWN） |
| 手工 PowerPoint／LibreOffice | 無 AI 的可控 fallback；使用者手動另存、比較與復原。 | **現有替代：**慢但目標明確。PPT Studio 首先要勝在安全的小幅自動化，而非功能數。 | CONFIRMED |

產品框架：`MUST MATCH`＝mutation target/version integrity、PPTX 可交付、錯誤可恢復；`SHOULD BE BETTER`＝local-first、可檢查收據、無默默覆寫；`DIFFERENTIATOR`＝四種簡單 layout 上的可逆、受限 AI 變更；`DO NOT COPY`＝多人協作、素材市場、網站發布、行銷／deal-room analytics、通用設計平台。

## 50 個合成 Persona（模型推演，不是真人研究）

30 個回歸基線與 20 個探索案例分開維持；結果只用來擴展風險面，不能作發生率、營收、優先級或市場份額證據。

| ID | 背景／限制 | 任務／期待 | 摩擦與結果 | 分級／建議／證據 |
|---|---|---|---|---|
| R01 | 台灣 PM、中文 deck | 翻譯後保留剛改標題 | 翻譯與 edit 重疊；PR #8 目標路徑 | P1；序列化；source |
| R02 | 行銷、長標題 | 接受縮短建議 | reorder 後砍錯頁標題 | P2；stale 409；source |
| R03 | 顧問、7+ bullets | 一鍵精簡 | edit 後舊建議刪新 bullets | P2；content identity；source |
| R04 | Windows 個人機 | 看 static preview | UNC 可觸發 SMB/NTLM | P1；升級 Starlette；upstream |
| R05 | Docker 遠端 | APP_TOKEN 保護 API | malformed Host 影響 path auth | P1；升級＋raw-path test；upstream |
| R06 | 本機 loopback | 無 token 快速使用 | 預設本機仍可用 | 保留；不升 P0；source |
| R07 | 日文簡報 | 翻譯四語 | exact-head CI 無步驟 | NOT_ESTABLISHED；receipt |
| R08 | 韓文簡報 | notes 不丟失 | unit tests 不等於 provider | runtime pending |
| R09 | 設計師 | 先建議再調順序 | stale index 不可見 | P2；顯示 stale outcome |
| R10 | 教師 | 長條列自動精簡 | 目前直接丟棄後段 | P2；target proof |
| R11 | 學生 | 免費 local fallback | 無 provider 也要正確 | 回歸；isolated test |
| R12 | CJK 使用者 | 長字串截斷 | 字數規則非視覺 overflow | research；render check |
| R13 | RTL 使用者 | 可讀輸出 | 尚無 RTL runtime | NEEDS_EVIDENCE |
| R14 | 色弱使用者 | contrast suggestion | non-auto-fixable 目前 422 | 正確 fail closed |
| R15 | 鍵盤使用者 | 採納／拒絕建議 | 未做 browser/a11y 驗證 | NEEDS_RUNTIME |
| R16 | 螢幕閱讀器 | 讀建議與 conflict | 無 AT 收據 | NEEDS_RUNTIME |
| R17 | 低速網路 | provider await | concurrent edit 需明確 409 | P1；existing PR |
| R18 | Provider timeout | 不回滾別人編輯 | unlocked mutation 有風險 | P1；shared lock |
| R19 | Rebuild 失敗 | 原子恢復 | apply 只回復單 slide | 鄰近 regression |
| R20 | 兩分頁使用者 | 一頁 edit 一頁 apply | 舊 suggestion 仍成功 | P2；base_version |
| R21 | 品牌經理 | 套 theme 不破壞內容 | current four layouts only | 不擴 scope |
| R22 | PPTX handoff | PowerPoint 再編輯 | 無 current structural receipt | NEEDS_RUNTIME |
| R23 | LibreOffice | 開啟且可改 | 無 current receipt | NEEDS_RUNTIME |
| R24 | URL importer | 匯入後建議 | source fidelity 未本輪驗 | LATER |
| R25 | PDF importer | 匯入後翻譯 | OCR/structure 非本 finding | 不綁 blocker |
| R26 | Markdown 使用者 | 快速生成 | 內容短可工作 | 保持簡化 |
| R27 | JSON power user | 可追 version | suggestion payload 無 base | P2；include version |
| R28 | 隱私敏感者 | 全程 local | remote auth 仍須 fail safe | P1；#9 |
| R29 | 維運者 | 綠燈可判讀 | zero-step failure 無原因 | validation gap |
| R30 | 支援人員 | 重現／恢復 | 目前缺 durable runtime receipt | NEEDS_RUNTIME |
| E01 | Windows 企業帳號 | 避免 NTLM 外洩 | StaticFiles 上游高風險 | P1；#9 |
| E02 | 反向代理部署 | path auth 正確 | proxy mitigation 不可假定 | P1；raw Host test |
| E03 | 惡意匿名者 | malformed Host | 可影響 request.url.path | P1；upstream |
| E04 | 惡意匿名者 | 大量 form fields | limits 可能被忽略 | P2/DoS；upgrade |
| E05 | 快速 reorder 使用者 | 建議仍對原頁 | index 漂移 | P2；stable identity |
| E06 | 編輯後不重跑分析 | 快速接受 | stale content 未提示 | P2；409＋重生 |
| E07 | 多操作連點 | 翻譯＋採納 | apply 未共用鎖 | P1；PR blocker |
| E08 | 失敗注入 QA | rebuild exception | rollback 鄰近操作 | P1；deterministic test |
| E09 | 手機瀏覽器 | 接受建議 | 尚無 mobile receipt | NEEDS_RUNTIME |
| E10 | 大型 50-slide deck | 建議／翻譯 | context trim 可能改證據 | evidence backlog |
| E11 | 空 deck edge | 套建議 | index validation fail closed | 維持 regression |
| E12 | 刪頁後接受 | 原 index 指另一頁 | destructive wrong-target | P2；stale check |
| E13 | 複製頁後接受 | 同內容不同身分 | content hash 單獨不足 | identity＋version |
| E14 | 相同長標題兩頁 | 套原 suggestion | 單 hash 可能碰同內容 | deck version＋index/identity |
| E15 | 離線後重連 | 接受舊 modal | long-lived stale payload | P2；409 |
| E16 | 代理正規化 Host | 安全 remote | 某些部署可能緩解 | Red Team；仍不可依賴 |
| E17 | Linux only | static serving | UNC finding不適用 | scope；仍有 auth/DoS |
| E18 | 不啟用 APP_TOKEN | loopback | path bypass無 auth boundary | 不假裝遠端事故 |
| E19 | 不用設計建議 | 手工修改 | F3 不影響 | 維持可選功能 |
| E20 | 只匯出一次 | 快速交付 | 競品廣度無價值 | SIMPLIFY |

固定 A01–J05 稽核族群未被上述 50 人取代；本輪沒有完整執行其全部 runtime 停止條件，故不能累積 CLEAN 輪次。

## 模型多視角董事會（非獨立專家共識）

| 角色 | 判斷 |
|---|---|
| CEO | 只做三件事：升級安全相依、讓所有 deck mutation 共用單一序列化契約、讓建議帶 base/target identity。不做協作平台、素材市場、網站發布。|
| CPO | first success 應是「匯入／生成→小幅修改→可編輯 PPTX」，不是更多 AI 動作。|
| CTO | 重用 `_get_lock(pid)` 與既有 version；不要另造 state machine。|
| Staff/Principal Engineer | F2 與 F3 是兩個邊界：前者是同步，後者是 stale target；只有 lock 仍不足。|
| UX Lead | 409 必須可理解並提供重新產生建議，不可默默 no-op 或套錯頁。|
| Researcher | 50 persona 只指出需測路徑；不得把模擬偏好當需求量。|
| Growth | 先降低內容損失與 Windows first-run 風險，否則擴流量只放大支援成本。|
| CFO | dependency upgrade 與局部 contract 修正成本低；不批准多租戶／協作基礎設施。|
| Security/Privacy | #9 是 remote use gate；proxy 與 loopback 是限制條件，不是修補。|
| QA | CI zero-step 不能算測試失敗或通過；需要 exact-head 可讀收據。|
| SRE | 先診斷 Actions admission 共因，避免把 unknown 歸因額度／YAML。|
| Accessibility | conflict modal、鍵盤 focus 與 screen reader 尚未驗證；不能宣稱完成。|
| Support | 錯頁截斷比明確 409 難恢復；應優先 fail closed 並保留 version receipt。|

## Red Team：試圖推翻提案

1. **「PR #8 的鎖已解決所有 lost update」—反證成立。** apply-design endpoint 不取鎖；即使補鎖，也不能辨識在建議產生後、套用前已完成的合法 edit/reorder，所以 F2 與 F3 都仍成立。
2. **「#5 已要求完整 object graph，因此先做大架構」—推翻。** F3 可用既有 deck version＋局部 target identity fail closed，通用 object graph 不是必要條件。
3. **「競品都有 AI agent，所以要擴功能」—推翻。** 競品廣度只證明替代選擇多；本產品更需要可驗證的 bounded mutation。
4. **「兩個 Actions failure 證明測試壞」—推翻。** `steps=null`、無 logs，只能記 UNKNOWN。
5. **「上游 CVE 等於已被攻擊」—推翻。** 尚無公開部署、攻擊或 credential leak 證據；因此 F1 是 P1 before remote use，不是 P0 incident。
6. **「Windows finding 可忽略，因主要跑 Linux」—僅部分成立。** UNC/NTLM 限 Windows，但 README 支援 Windows；path-auth 與 form DoS 仍跨平台。
7. **「只把 suggestion key 加內容 hash 即可」—不充分。** reorder、duplicate slide 與相同內容需要 deck base version／target identity共同約束。

## Decision Memo

- **服務誰：** 需要在本機快速生成／匯入、有限度 AI 編修並交付可繼續編輯 PPTX 的個人使用者與小型團隊。
- **選擇／競爭理由：** 不與 Office、Google、Canva、Pitch、Gamma 比整套協作與素材；以 local-first、明確 mutation receipt、PPTX round-trip、可恢復失敗做差異化。
- **前三優先：** (1) #9 安全相依升級與 remote/Windows 驗證；(2) PR #8 納入所有 deck mutation、取得 exact-head receipt；(3) design suggestion 的 base_version/target identity/stale 409。
- **NOW：** #9、PR #8 review、Actions admission 收據。
- **NEXT：** F3 的最小 stale contract；PowerPoint／LibreOffice structural read-back、瀏覽器與輔助科技回歸。
- **LATER：** #5 的 bounded structured slide state 研究，僅在小方案不足時 BUILD。
- **DON'T：** 多人即時協作、帳號／租戶、素材 marketplace、網站／campaign 發布、通用 object registry、遠端執行擴張。
- **風險／實驗：** 隔離環境重放 malformed Host、Windows UNC outbound block、兩方向 concurrency、edit/reorder stale apply；退出準則為 BUILD（局部 contract 可行）、NARROW（只做 version conflict）、REJECT（產品不再支援該遠端／Windows路徑）。

## 寫入、互斥與回歸狀態

- F1 已有 #9，comments 空、無 implementation branch；本輪不因報告重貼相同內容。
- F2/F4 有活躍 #7、PR #8、branch 與 unresolved review，均 `SKIPPED_LOCKED`。
- F3 與 #5 的 stale-base research、PR #8 mutation surface 重疊；本輪不搶 scope，中央報告是明確阻塞追蹤，不代表授權實作。
- 未修改產品程式、CI/config、secrets、權限/settings；未建實作分支、未 merge/deploy、未啟動 worker/GOAL。
- 產品 default branch 沒有新修正，故回歸狀態為 `CANNOT_VERIFY / NEEDS_RUNTIME_VERIFICATION`；Verified Fixed 0。
- Portfolio 維持 `NOT CLEAN, 0/2`。

## 來源

- [PPT Studio Issue #9](https://github.com/Reese-max/ppt-studio/issues/9)
- [PPT Studio PR #8](https://github.com/Reese-max/ppt-studio/pull/8)；[unresolved review](https://github.com/Reese-max/ppt-studio/pull/8#discussion_r4023485783)
- [PPT Studio Issue #5](https://github.com/Reese-max/ppt-studio/issues/5)
- [Starlette GHSA-86qp-5c8j-p5mr，發布 2026-05-21](https://github.com/Kludex/starlette/security/advisories/GHSA-86qp-5c8j-p5mr)
- [Starlette GHSA-wqp7-x3pw-xc5r，發布 2026-05-23](https://github.com/Kludex/starlette/security/advisories/GHSA-wqp7-x3pw-xc5r)
- [Starlette GHSA-82w8-qh3p-5jfq，發布 2026-06-12](https://github.com/Kludex/starlette/security/advisories/GHSA-82w8-qh3p-5jfq)
- [FastAPI 0.122.0 metadata](https://pypi.org/pypi/fastapi/0.122.0/json)；[FastAPI 0.133.0 metadata](https://pypi.org/pypi/fastapi/0.133.0/json)；[FastAPI release notes](https://fastapi.tiangolo.com/release-notes/#01330)
- [Google Slides 官方產品頁](https://workspace.google.com/products/slides/)
- [PowerPoint for the web 官方頁](https://powerpoint.cloud.microsoft/en-us/)
- [Pitch Help Center](https://help.pitch.com/en/)
- [Canva Create 2026 官方 newsroom](https://www.canva.com/newsroom/news/canva-create-2026/)
- [Gamma product updates](https://help.gamma.app/en/articles/7838091-product-updates)

