# MiniDeck 產品董事會增量稽核 — 2026-09-20T1101Z

> 本報告的董事會與 50 Persona 均為模型多視角／合成情境推演，不是真人研究、投票、市占、發生率或營收證據。競品資料是官方來源的產品宣稱／文件，不等於獨立效果證據。

## 結論

**INVEST / SIMPLIFY / MAINTAIN；PR #1 在 OAuth refresh custody 修正前不應合併。**

本輪固定稽核 `Reese-max/minideck`：

- default branch：`main@31f7131ae24af9d89287000e8048750e598686a1`；2026-09-12 後只有 audit 文件，沒有產品修正落地。
- 發布邊界候選：PR #7 `5d3636d9ce00a646d63ad0f6d7975bcec4ccf4e4`，仍未合併，exact-head Actions 為零步驟 failure。
- v2 MCP 候選：PR #1 `0cb4ebc32fd4b75f2470f92854c6ceed79f0103e`，仍未合併；舊 exact-head CI 有完整綠燈，但不涵蓋本輪反例。
- Issue Quality v2：blob `8167e10798071d2276addaff6b201c6b0e904a2a`。

新發現：PR #1 的 OAuth refresh flow 未把 refresh token 綁定至 client/grant family，也不是原子 consume。`handleRefreshToken()` 先讀 `revoked_at`，接著 `issueTokens()` 插入一組新 access/refresh token，最後才撤銷舊 token。兩個並行請求可同時通過第一次讀取，各自取得有效的 30 日 refresh token；舊 token 後續重放只回 `invalid_grant`，不會沿 family 撤銷已簽發的後代。RFC 9700 §2.2.2、§4.14 要求 public client 的 refresh token 必須 sender-constrained 或使用能偵測 replay 的 rotation；目前實作兩者皆未完成。

分流：`BUG / P1 / decision_priority=HIGH_PRE_MERGE / SOURCE_CONFIRMED / triage=NEEDS_REVIEW / auto_implementation=false`。P1 因成功重放可產生仍有效的 owner bearer credential，進而讀寫該 owner 的簡報專案；未升 P0，因功能尚未合併／部署，且沒有 token 外洩或實際越權事故證據。需要隔離 runtime reproduction 才能把 source-level race 提升為 `EXECUTED_REPRODUCTION`。

## Discovery 與證據

### 已讀範圍

- inventory：Reese-max 41 個自有、未封存 repositories；本輪依公平游標選擇 2026-09-12 後未再正式巡檢、但 9 月 16–17 日有新 PR/Issue 活動的 `minideck`。
- README、schema/migration、default branch 核心 Worker/store/UI/tests、近期 commits、全部 open/closed Issues、全部狀態 PR、branches。
- PR #1 MCP/Runner source、workflow、tests、既有 Issue #9–#14；PR #7 publish boundary source/test；PR #8 CI 路徑。
- exact-head workflow runs/jobs；沒有啟動 workflow、部署、worker 或正式資料寫入。

### 證據分層

| 項目 | 狀態 | 證據 |
|---|---|---|
| refresh token 讀取、簽發、撤銷的順序 | CONFIRMED / SOURCE_CONFIRMED | PR #1 `auth.ts` at `0cb4ebc…` |
| 同一舊 refresh token 缺少條件式 consume | CONFIRMED / SOURCE_CONFIRMED | revoke UPDATE 沒有 `AND revoked_at IS NULL`，且在新 token INSERT 後執行 |
| token family / client binding / replay revocation | CONFIRMED absent in inspected source | token row／refresh request未保存或檢查 client/grant family |
| 兩個並行 request 可同時完成 | LIKELY / static concurrency inference | 需要隔離 D1 runtime 雙請求驗證 |
| token 已外洩、正式越權、資料被讀寫 | UNKNOWN | 無事故、部署或 token 外洩證據 |
| PR #1 CI | EXECUTED historical | runs 33166382567、33166382598、33166382571 均真實執行並成功；未涵蓋並行 refresh/replay |
| PR #7/8 CI | UNKNOWN product result | runs 35085407874/35085408227/35183093326/35183093401 為 `steps=null`；只能證明 gate 未執行 |

### 可達流程

1. public OAuth client 完成 GitHub authorization code + PKCE，取得 30 日 refresh token。
2. 該 refresh token 因 client 裝置、儲存或傳輸面外洩，或合法 client 本身並行 refresh。
3. 兩個 request 在任一 request 撤銷舊 token 前均讀到 `revoked_at IS NULL`。
4. 兩者各自呼叫 `issueTokens()`，產生獨立且未被 family 關聯的 access/refresh credential。
5. 最後兩個 request 都將舊 token 設為 revoked；已簽發的兩個後代仍有效，後續舊 token replay 也不能識別並撤銷哪個 family。

受影響者：使用 v2 MCP 的 owner、管理其簡報資料與 export/approve/revision 的客戶端。現有替代是重新完成 authorization code，但並不能撤銷未被追蹤的 replay 後代。若不修，短 access token 的安全收益會被可持續換發的 30 日 refresh credential 抵銷。

### 最小有效修正

1. 把 refresh token 明確綁定至 `client_id` 與一個 grant/token-family ID。
2. 在簽發新 token 前，用單一條件式狀態轉移 consume 舊 token；只有 `changes === 1` 的 request 可繼續。
3. 保存 predecessor/family 關係；任何已使用 token 再出現時，撤銷該 family 的 active refresh tokens。
4. 新增兩個 direct tests：同一 refresh token 並行兩次只能一個成功；已用 token 重放會撤銷 active descendant。
5. 取得 exact-head CI receipt；不需建立 IAM、session service、secret broker 或新平台。

非目標：不重做 GitHub OAuth、不新增帳號／租戶、不把 access token 改為 JWT、不擴張通用身分平台。

## 競品與替代工作流（查閱日 2026-09-20）

| 產品／替代 | 來源與日期 | CONFIRMED 能力 | 對 MiniDeck 的判斷 |
|---|---|---|---|
| Gamma | https://help.gamma.app/en/articles/11047576-can-i-publish-or-disable-my-gamma-site；頁面查閱時標示近期更新 | 草稿變更不會立即上線；可 preview、publish、disable 而不刪內容 | MUST MATCH：明確發布／撤回；PR #7 方向正確，但仍需合併與 runtime receipt |
| Pitch | https://help.pitch.com/en/articles/3748926-share-an-external-link-to-your-presentation；2026-05-05 | named external link、停用、到期、passcode、PDF、analytics；內容更新會即時反映 | DIFFERENTIATOR：MiniDeck 用單一 published head 提供更簡單的穩定交付；DO NOT COPY analytics/link suite |
| Pitch release | https://pitch.com/whats-new/share-expiring-links-and-sync-slide-edits；2026-03-18 | expiring links 與跨 slide 編輯 | LATER；不是當前發布／OAuth blocker 的證據 |
| Canva | https://www.canva.com/newsroom/news/whats-new-may-2026/；2026-05 | live mobile preview、AI presenter notes、custom short link、多渠道 publish apps | SHOULD BE BETTER：保留低概念 prompt→HTML；DO NOT COPY distribution breadth |
| PowerPoint | https://www.microsoft.com/en-us/microsoft-365/powerpoint；查閱 2026-09-20 | Copilot 可新增／改寫／重組 slides，且保留使用者 review | MUST MATCH：可審核變更與可攜輸出；不競爭 Office suite breadth |
| MCP Authorization | https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization；2026-07-28 | HTTP MCP 授權依 OAuth protected-resource/authorization-server metadata | MUST MATCH：v2 遠端 surface 的授權契約；不是自行放寬 refresh custody 的理由 |
| OAuth Security BCP | https://www.rfc-editor.org/rfc/rfc9700.html；RFC 9700 | public client refresh token 需 sender constraint 或 replay-detecting rotation | MUST MATCH：本輪 P1 的直接外部安全基準 |

定位：MiniDeck 應提供「快速產生、可檢查、明確發布的自架 HTML deck」。不要用競品廣度證明需要 workspace、analytics、商城、原生 App 或多分享物件。

## 虛擬董事會（模型推演）

| 角色 | 評議／分歧 |
|---|---|
| CEO | 只做三件事：合併並驗證 draft/published boundary；修 refresh custody；決定 MiniDeck 與 ppt-studio/v2 的單一產品邊界。不做 analytics、marketplace、billing。 |
| CPO | PR #7 的 Preview→Publish→Unpublish 心智模型值得保留；v2 MCP 不能以整合便利交換 owner trust。 |
| CTO | 支持條件式 consume + family revocation；反對為兩個 SQL 狀態轉移建立新 auth service。 |
| Staff/Principal Engineer | PR #1 已有太多獨立 blocker；先使 contract true，再談更多 renderer/provider。 |
| UX Lead | UI 應同時顯示 draft vN、published vM 與 OAuth reconnect 狀態；不要向使用者暴露 token-family 術語。 |
| UX Researcher | Persona 只能提出任務假設；需真人驗證 publish 信心與授權恢復，不把模擬偏好當需求量。 |
| Growth | 少數意見：Pitch 式 named/expiring link 可能提升分享；被 CEO/CFO/Red Team 延後。 |
| CFO | 最小安全修正比完整 IAM 或分享 SaaS 成本低；不批准新平台或付費產品。 |
| Security/Privacy | 30 日 refresh token 是 owner 權限延伸；race/replay 必須 pre-merge fail closed。 |
| QA | exact-head 要新增並行 refresh、replay family、client mismatch、PR #7 publish matrix。 |
| SRE | 零步驟 Actions 不能歸因額度；production 尚未部署，禁止把 source green 當 runtime。 |
| Accessibility | publish controls 與 OAuth failure recovery 仍需鍵盤、讀屏、焦點與錯誤宣告 runtime。 |
| Support | 需要可說明「哪一版公開」與「哪個 client session 被撤銷」的最小 receipt；不需完整後台。 |

實質分歧：Growth 希望擴張外部連結；CPO 支持明確 publish；Security 要先擋 refresh replay；Staff/CFO 拒絕新平台。共識是修復兩個 custody boundary 後再決定 v2 是否進 default branch。

## 50 合成 Persona（30 回歸 + 20 探索）

Evidence：`D`=default source、`P7`=PR #7 source、`P1`=PR #1 source、`CI`=Actions metadata、`U`=需 runtime。結果不是發生率。

| ID | 背景／限制 | 目標／期待 | 任務／旅程 | 摩擦與結果 | 分級／建議／證據 |
|---|---|---|---|---|---|
| B01 | 大學生；Android/4G；首次 | 分享後可私下修稿 | 產生 v1→分享→修 v2 | default 連結跟草稿；失敗 | P2：合併 P7；D/P7 |
| B02 | 新創 PM；Mac；熟練 | 投資人收到固定版 | 分享 v3→更新數字 | default 無 published head；失敗 | P2：published receipt；D |
| B03 | 業務主管；Windows；高風險報價 | 未核准價格不公開 | 寄 proposal→準備新版 | default 可能靜默換內容；失敗 | P2：publish/unpublish；D |
| B04 | 教師；Chromebook | 答案草稿不被學生看見 | 發講義→加入答案 | default 草稿即公開；失敗 | P2：P7 sentinel runtime；D/P7/U |
| B05 | 學生；iPhone；首次 | 一鍵分享且知道版本 | 分享→修錯字 | 狀態不清；部分失敗 | P2：顯示 vN/vM；D/P7 |
| B06 | 公務員；Windows/受限網路 | 操作詞義清楚 | Save→Share→續修 | Save/Publish 混淆；失敗 | P2：明確動詞；D |
| B07 | 設計師；Mac；power user | 試稿不污染正式稿 | 分享 A→試 B/C | default public head 漂移；失敗 | P2：單一 published head；D |
| B08 | 行銷；Windows | 活動結束暫停連結 | 發布→活動結束→撤回 | default 只有刪除；失敗 | P2：unpublish；D/P7 |
| B09 | 求職者；Android | 不同公司版本隔離 | 投遞 A→改 B | default A 連結變 B；失敗 | P2：再發布才切換；D |
| B10 | 顧問；iPad/飯店 Wi-Fi | Web/PDF 同版 | 分享→匯出→修稿 | 版本 receipt 不足；部分 | P2：export metadata；D/U |
| B11 | 研究員；Linux | 引用版可追溯 | 送審→改結論 | default 審稿內容漂移；失敗 | P2：published_at/version；D |
| B12 | 法務；Windows/VPN | 敏感草稿不匿名 | 發布刪節版→加內部註記 | default 邊界失敗；失敗 | P1/P2：PRIVATE_DRAFT 負測；D/U |
| B13 | 自由工作者；Mac | 客戶只看批准版 | 客戶看 v1→準備 v2 | default 無 preview/publish；失敗 | P2：P7；D/P7 |
| B14 | 非營利主管；iPad；低熟練 | 不誤發 | 分享後修字 | 介面無公開狀態；失敗 | P2：非色彩狀態；D/P7/U |
| B15 | 社群編輯；Android | 暫時下線不刪內容 | 活動後撤回 | default 無 unpublish；失敗 | P2：P7；D/P7 |
| B16 | 工程師；Linux | save/publish race 可觀察 | 並行 save v4/publish v3 | P7 用 immutable version + conditional update；靜態支持，runtime 未知 | NEEDS_RUNTIME；P7/U |
| B17 | 產品主管；Windows | rollback 不自動公開 | 分享 v4→rollback v2 | default 會改 current/public；失敗 | P2：P7 已分離；D/P7 |
| B18 | 學生；舊 Android/3G | 重載仍同版 | 播放→作者修稿→重載 | default 可換內容；失敗 | P2：published head/cache receipt；D/U |
| B19 | 採購收件者；Windows/代理 | 審核標的一致 | 註記→隔日重開 | default 無版本標示；失敗 | P2：公開版號；D |
| B20 | 記者；iPhone | 引用有發布時間 | 收藏→引用→重訪 | default 無 published_at；失敗 | P2：P7 receipt；D/P7 |
| B21 | 活動企劃；Mac | 現場畫面不受後台草稿影響 | 播放→同事修下場版 | default 可能切換；失敗 | P2：P7 deployed test；D/P7/U |
| B22 | 代理商 AE；Windows/4G | 客戶 A 不看到 B 草稿 | 分享 A→改 B | default 跨客戶內容風險；失敗 | P1/P2：一個 public head；D |
| B23 | 校長；iPad；低熟練 | 提交版固定 | 會前/會中重開 | default 漂移；失敗 | P2：published snapshot；D |
| B24 | 資料分析師；Linux | 數字修正待核准 | 分享→保存修正 | default 保存即對外；失敗 | P2：publish gate；D |
| B25 | 客服主管；Windows | 未完成流程頁不外流 | 分享→新增頁→保存 | default 草稿公開；失敗 | P2：draft isolation；D |
| B26 | 高中生；Chromebook | 試樣式不改交件 | 分享→換版型 | default 老師連結變化；失敗 | P2：preview then publish；D |
| B27 | 創業者；Mac | 募資版可稽核 | 分享→多次修訂 | default 無 public pointer；失敗 | P2：P7 receipt；D/P7 |
| B28 | 醫療行政；Windows/封閉網路 | 去識別版保持公開、內註私有 | 發布→加入內註 | default 靜態失敗；失敗 | P1/P2：sentinel runtime；D/U |
| B29 | UX 研究員；Mac | 參與者只看當時版 | 分享→補分析 | default 新分析可外顯；失敗 | P2：published snapshot；D |
| B30 | 董事；iPad/行動網路 | 每次打開一致且有版號 | 會前/會中讀 | default 內容可變；失敗 | P2：公開版號/時間；D |
| E01 | GitHub OAuth owner；桌面 client | session 安全續期 | 正常 refresh | 單次成功但 client/family 未綁；風險 | P1：bind client/family；P1 |
| E02 | 同 owner；手機+桌面 | 兩裝置不互相製造幽靈 session | 同 refresh token 並行 | 兩者可能各得有效後代；失敗 | P1：conditional consume；P1/U |
| E03 | refresh token 遭竊 owner | replay 可偵測並全族撤銷 | attacker/owner 同時 refresh | 後代無 lineage，無法全撤；失敗 | P1：family replay response；P1 |
| E04 | OAuth client developer | token 綁原 client | client B 提交 client A token | refresh endpoint不檢 client_id；失敗 | P1：client binding；P1 |
| E05 | Support；無 token 可見性 | 解釋登出／重連 | owner 回報陌生 session | 無 family/session receipt；無法判定 | P2：最小 session ID；P1/U |
| E06 | 資安測試員 | 已用 token 重放會撤銷 active child | refresh→重放 predecessor | 只回 invalid_grant，不撤 child；失敗 | P1：replay test；P1 |
| E07 | 高延遲 client | retry 不產生雙 session | timeout 後重試 | 競態可能雙簽發；失敗 | P1：one winner semantics；P1/U |
| E08 | D1 暫時錯誤 | 部分失敗不留未交付 credential | INSERT成功、revoke失敗 | 新 token可能入庫但回應失敗，舊 token仍可用；風險 | P2：transaction/compensation；P1/U |
| E09 | Screen reader owner | OAuth 錯誤可理解 | refresh失敗→重新連線 | runtime UI/announcement 未驗 | NEEDS_RUNTIME：AT test；U |
| E10 | 100-slide deck author | 全 deck quality gate 真實 | render→visual judge | 只看前20頁；既有 #11 | P2：分頁/全量策略；Issue #11 |
| E11 | 機密來源作者 | sensitive claim 不出 egress | plan→render→judge | gate在render後；既有 #12 | P1：render前 gate；Issue #12 |
| E12 | Runner operator | 失敗後工作可恢復 | claim→workflow create失敗→lease到期 | running 不重排；既有 #9 | P2：requeue/renew；Issue #9 |
| E13 | 兩個 OAuth owners | idempotency不跨租戶 | 同 key/input | global cache可短路 owner check；既有 #10 | P2：owner-scoped key；Issue #10 |
| E14 | 定向 revision 使用者 | 只改指定 slide | slideIds=s1、patch=s2 | supplied patch跳過 normalize；既有 #13 | P2：同一路徑驗證；Issue #13 |
| E15 | Preview deploy maintainer | named env 有完整 binding | deploy --env preview | top-level binding不繼承；既有 #14 | P2：明列 env；Issue #14 |
| E16 | QA maintainer | exact-head gate 真執行 | PR7/8 Actions | steps=null；不能判定產品 | VALIDATION_GAP：保留 UNKNOWN；CI |
| E17 | PowerPoint 使用者 | PPTX 可攜且高忠實 | v2 export | 舊 smoke成功但真 Office未驗 | NEEDS_RUNTIME：PowerPoint/LibreOffice；CI/U |
| E18 | 手機收件者 | published deck 可讀 | P7匿名player | source contract合理、手機未驗 | NEEDS_RUNTIME：iOS/Android；P7/U |
| E19 | CFO | 不做通用 IAM | 比較 SQL family vs新服務 | 小方案足夠；通過 Red Team | P1：局部修正；P1 |
| E20 | CEO | 三產品邊界清楚 | MiniDeck vs ppt-studio vs v2 | 重疊仍高，未決 | STRATEGIC：v2暫停擴張；repo/portfolio evidence |

覆蓋：18–65 歲、作者/收件者/maintainer/support/security、首次/熟練/power user、Windows/macOS/Linux/ChromeOS/iOS/Android、慢網路/高延遲/受限網路、鍵盤/讀屏/低視力/認知負荷。B01–B30 保留原回歸案例；E01–E20 是本輪探索，不替代固定 A01–J05 CLEAN 稽核。

## Red Team

1. **已有功能解決？** PR #7 靜態解決 draft/public head，但未合併且 CI 未執行，不能標 `VERIFIED_FIXED`。
2. **refresh 已 rotate？** 表面上每次回傳新 token，但沒有原子 consume、client/family binding 或 replay family revocation，不符合 replay-detecting rotation。
3. **更小替代？** 可用既有 D1 加欄位／條件 UPDATE；不需要新 auth service。
4. **錯誤根因？** 不是「缺 ledger/framework」，而是 `SELECT valid → INSERT descendants → UPDATE revoke` 的順序與缺少 lineage。
5. **環境問題？** 並行 race 尚未 runtime 重現，故明確標靜態推論；但源碼順序與缺少條件 consume 是 confirmed。
6. **規模不符？** 對單 owner、小產品仍成立，因 token 直接代表 read/write scope；不需等待多租戶規模。
7. **過度工程？** DPoP/mTLS 不是唯一解；RFC 允許 rotation，最小安全實作即可。
8. **不支持的提案？** 不支持 named links、analytics、marketplace、billing、native app、多 provider、通用 IAM。
9. **模擬偏誤？** 50 Persona 不提供 P1 證據；P1 只依 source chain + OAuth BCP。
10. **部署界線？** PR #1 未部署；不宣稱 production exposure、事故或實際 token theft。

## Findings／追蹤／鎖

| Finding | 分流 | 追蹤 |
|---|---|---|
| PR #1 refresh token rotation 非原子、無 client/family replay detection | BUG / P1 / HIGH_PRE_MERGE / NEEDS_REVIEW | 新 finding；因 PR #1、branch `feature/presentation-studio-mcp-v2`、owner Issues #9–#14 活躍，`SKIPPED_LOCKED`；中央報告承接，未搶開 Issue |
| default draft/public coupling | BUG/OPPORTUNITY；#4 標 P1、固定 persona audit 標 P2，現有分級紀錄不一致 | #4 + PR #7；活躍範圍不在本輪搶改或重分級；未合併，STILL_REPRODUCIBLE on default |
| PR #1 sensitive claim egress | BUG / P1 | 既有 #12；去重 |
| PR #1 queue/idempotency/visual coverage/revision/config | BUG / P2 | 既有 #9/#10/#11/#13/#14；去重 |
| CI zero-step failures | VALIDATION_GAP / NOT_ESTABLISHED, decision_priority=P2 | 既有 #6；原因 UNKNOWN |

沒有修改 Issue/PR、沒有取得 lease、沒有產品實作。原因：同一 active PR/branch/owner 已明確承接該 surface；marker 不是搶占活躍實作者的授權。

## NOW / NEXT / LATER / DON'T

### NOW

1. PR #1：在 merge 前完成原子 consume、client/family binding、replay family revocation與 exact-head tests。
2. PR #7：保留小範圍 published head，取得真正執行的 CI，加一條隔離 Worker/D1/R2/browser receipt。
3. 處理既有 #12、#9–#14；不新增 renderer/provider/分享平台。

### NEXT

- 真實 GitHub OAuth + MCP client 首次授權、refresh、reconnect、revocation；以測試帳號／隔離環境執行。
- 真 PowerPoint/LibreOffice、手機、鍵盤、screen reader 與高延遲情境。
- 決定 MiniDeck（輕量公開 HTML）與 ppt-studio（高保真/證據型製作）邊界；v2 僅作已核定產品的 integration surface。

### LATER

- 只有真人/使用數據支持時才研究 named/expiring links、協作或額外整合。

### DON'T

- 不建通用 IAM、session service、資料平台、完整 workspace、analytics、marketplace、billing、原生 App。
- 不把 PR、Issue、高分、persona 票數、舊 CI 綠燈視為 merge/deploy/付費授權。

## Regression 與 CLEAN

| 項目 | 判定 |
|---|---|
| #4 default publication boundary | `STILL_REPRODUCIBLE` on `main@31f7131…`; PR #7 `CANNOT_VERIFY` until merged + runtime |
| #2 historical version auth | source fix存在；部署 runtime仍待驗，`PARTIALLY_FIXED` |
| PR #1 OAuth refresh | new `P1 PRE_MERGE`; `NEEDS_RUNTIME_VERIFICATION` for race execution |
| Verified Fixed | 0 |
| 固定 audit CLEAN | `NOT CLEAN, 0/2` |

必要 runtime：隔離 D1 並行 refresh/replay、GitHub OAuth/MCP client、Worker/D1/R2 publish lifecycle、mobile/browser、PowerPoint/LibreOffice、assistive technology。舊 CI 只證明其 exact head 的既有 tests，不覆蓋 provider、正式部署或本輪反例。

## Decision Memo

- **服務誰：**需要快速、自架、可攜 HTML 簡報的個人與小團隊；收件者需要穩定、可說明的公開版本。
- **為何選它：**prompt→HTML 快、Cloudflare-native、版本與匯出可檢查；不是因功能最多。
- **競爭方式：**SHOULD BE BETTER at simplicity/trust，DIFFERENTIATE on inspectable self-hosted pipeline，DO NOT COPY suite breadth。
- **前三優先：**發布 custody；OAuth refresh custody；v2/default/ppt-studio 產品邊界與 runtime receipts。
- **刪除／不做：**暫停 v2 breadth；不做 analytics、named links、marketplace、billing、native app、多 provider、通用 IAM。
- **風險／實驗：**原子 refresh/replay測試、published sentinel test、真 client/Office/mobile/AT；BUILD/NARROW/REJECT 由實測決定，BUILD 不自動授權 merge。
- **建議：**`INVEST` in trust、`SIMPLIFY` scope、`MAINTAIN` lightweight core、`PAUSE` v2 expansion until blockers close。

## 寫入統計

- 新 actionable finding：1（P1 pre-merge）
- 新 Issue：0（`SKIPPED_LOCKED`）
- 更新／重開 Issue：0
- 去重：7 個既有 root/scope（#4、#6、#9–#14）
- Verified Fixed：0
- 產品程式／CI/config 修改：0
- 報告寫入：本檔；讀回驗證待 commit 完成
- Portfolio：NOT CLEAN，0/2
