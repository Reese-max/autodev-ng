# avatar-vfo 產品董事會增量稽核（2026-09-20T05:02Z）

> 本文件是模型多視角推演與程式／設定稽核，不是獨立專家、真人訪談或市場投票。本輪只做稽核與分流，不授權實作、合併、部署、付費或正式資料寫入。

## 0. 結論摘要

- **董事會建議：MAINTAIN / SIMPLIFY / BLOCK PR #4 與 #9，直到授權輪替與 preview 隔離契約為真。**
- default branch 的既有 P0 仍由 [avatar-vfo#2](https://github.com/Reese-max/avatar-vfo/issues/2) 追蹤：Cloudflare Access JWT 在正式程式中只解碼、未驗簽；這不是本輪新發現，也沒有重複開單。
- 本輪新增三個通過四道門檻的 **P2 pre-merge blocker**：PR #4 的未知 `kid` 不會刷新 JWKS；PR #9 把正式管理密鑰交給 PR 可改的腳本；PR #9 的 preview URL 仍綁正式 D1。另有一個 exact-head `VALIDATION_GAP`。
- 三項產品 finding 均有活躍 owner／branch／PR／review 承接，故為 `SKIPPED_LOCKED`；新增 Issue 0、更新 Issue 0、Verified Fixed 0。證據留在本獨立中央報告，不搶 scope。
- 固定 A01–J05 稽核沒有完成兩個全量合格輪次，且缺少真實 Cloudflare Access、preview D1、部署與瀏覽器收據；Portfolio 為 **NOT CLEAN, 0/2**。

## 1. Discovery、範圍與證據版本

| 項目 | 結果 |
|---|---|
| inventory | Reese-max 共 42 repositories；41 個未封存、1 個封存（`obsidian-vault`） |
| 本輪公平游標 | `avatar-vfo`；近期通知序列未涵蓋此 repo，且有活躍高風險 auth／deploy 候選變更 |
| repo 狀態 | private、unarchived、default branch `main` |
| default HEAD | `1226629dba0e82921504beb9169e4cdf43ad3797`（audit-only） |
| default 產品基線 | `b94ae9b82df76055301a25f4d9aa6e7a375d11b1` |
| PR #4 head | `10a0a834290e5411cc53590cd1bf4683cd67c70a` |
| PR #9 head | `9e353ad67f87d5fbec6835f9a9fb80e48ae0a117` |
| 品質規則 | `autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md` blob `8167e10798071d2276addaff6b201c6b0e904a2a` |
| 查閱日 | 2026-09-20 |

實際讀取：README、`AGENTS.md`、manifest/config、Worker auth 程式與測試、PR #4/#9 diff、workflow、Wrangler D1 binding、smoke 腳本、近期 commits、所有狀態 Issues/PR、完整相關 comments/review threads 與 Actions runs。未啟動 autodev run、worker、GOAL、部署或正式資料測試。

### 證據分層

- **SOURCE_CONFIRMED：** default `verifyCfAccessHeaders()` 接受未驗簽 JWT；PR #4 cache 命中後未知 `kid` 直接拒絕而不刷新；PR #9 workflow 把 `secrets.AUTH_SECRET` 傳給 checkout 後的 PR 腳本；PR #9 的 Wrangler 設定只有正式 `vfo-adam` D1 binding；smoke 會建立 avatar 且 cleanup 不在 `finally`。
- **外部 SOURCE_CONFIRMED：** Cloudflare 文件說明 Access 公鑰由 `/cdn-cgi/access/certs` 提供、驗證時須依 `kid` 找 key，簽署 key 約每六週輪替且舊 key保留七天；文件最後更新 2026-05-06。
- **EXECUTED_REPRODUCTION：**本輪 0。沒有使用正式 Access、D1、preview URL、瀏覽器或部署環境。
- **UNKNOWN／限制：** exact-head Actions 沒有步驟或 logs；repo comments 引述帳號 Actions budget annotation，但本輪 API 沒有可獨立讀回的 job annotation。故不把零步驟失敗冒充程式測試結果。

## 2. 產品契約與已核定方向

README 定義的核心不是通用聊天前端，而是可持續的 AI 角色／人格模擬：VFO 七步工作流、開發者可見 `<inner>` 與使用者 `<reply>` 分離、D1 持久化及受保護的管理操作。這使「角色狀態可信、管理面不被未授權改寫、preview 不碰正式資料」成為 MUST MATCH；語音、3D avatar、社群市場與大型 orchestration 並非當前成立的缺口。

## 3. Findings 與四道開單判準

### AVFO-4-ROTATION — cache 期間遇到新 `kid` 不刷新 JWKS

- **fingerprint：** `Reese-max/avatar-vfo + worker/auth JWKS cache + Cloudflare key rotation/new kid + valid Access token rejected + cache-hit path never refetches`
- **kind / severity / priority / triage：** `BUG / P2 / HIGH_PRE_MERGE / NEEDS_REVIEW`
- **confidence：** HIGH；`SOURCE_CONFIRMED`；`NEEDS_RUNTIME_VERIFICATION`；`auto_implementation=false`
- **誰受影響／可達流程：**候選 PR #4 合併後，先前已填入 5 分鐘 JWKS cache 的 Worker 在 Cloudflare 輪替到新 key 時，持有合法新 token 的管理者進入受保護流程。
- **預期／實際：**預期依 token `kid` 取得對應公鑰並驗證；實際 cache 命中後 `keys.get(kid)` 不存在便直接 `return null`，不做一次受控刷新。合法使用者最多可能被拒絕到 TTL 到期。
- **不做後果：**輪替窗口出現短暫、難診斷的管理面拒絕服務；不是授權繞過。
- **分級理由：**顯著影響受支援管理流程與恢復性，符合 P2；fail closed、上限約五分鐘，且沒有資料／權限破壞或已發生事故，不是 P1/P0。
- **更小替代比較：**不改會留下輪替故障；只寫文件不能修正合法 token；建立 IAM／key registry 過度。最小修正是未知 `kid` 時對 issuer 做一次 singleflight 強制刷新並只重試一次，另加 cooldown／negative cache，避免任意未知 `kid` 放大外部請求。
- **直接驗收：**(1) cache 只有舊 key 時，新合法 `kid` 觸發一次刷新後成功；(2) 刷新後仍未知即 fail closed；(3) 重複攻擊者 `kid` 不反覆 fetch；(4) 舊 key 在 Cloudflare 保留期仍可驗證；(5) exact-head 隔離 HTTP 收據。
- **追蹤：**既有 [Issue #2](https://github.com/Reese-max/avatar-vfo/issues/2)／[PR #4](https://github.com/Reese-max/avatar-vfo/pull/4)。活躍 draft PR，`SKIPPED_LOCKED`，未留言或改 scope。

### AVFO-9-SECRET — PR-controlled smoke 取得正式 `AUTH_SECRET`

- **fingerprint：** `Reese-max/avatar-vfo + deploy preview smoke + pull_request checkout + production admin secret passed to mutable script + absent secret blocks gate / present secret is exfiltration-capable`
- **kind / severity / priority / triage：** `BUG / P2 / HIGH_PRE_MERGE / NEEDS_REVIEW`
- **confidence：** HIGH；`SOURCE_CONFIRMED`；`NEEDS_RUNTIME_VERIFICATION`；`auto_implementation=false`
- **誰受影響／可達流程：**維護者執行 PR #9 的 preview deploy gate。專案 `AGENTS.md` 要求 secrets 只能由 Wrangler／Cloudflare Dashboard 管理；依規不把正式 `AUTH_SECRET` 放入 GitHub 時，smoke 以 usage 2 失敗。若為通過 gate 而把正式 secret 複製到 Actions，PR head 可改 `worker/scripts/smoke.mjs` 並讀取它。
- **預期／實際：**預期 PR preview 使用隔離、最小權限 credential；實際 workflow 將 `${{ secrets.AUTH_SECRET }}` 交給 checkout 後的 PR 腳本。
- **不做後果：**release gate 在合規設定下不可用，或維護者以高風險秘密配置換取可用性。
- **分級理由：**是高頻發布路徑的安全／可用性兩難，符合 P2。現階段 GitHub secret 是否存在為 UNKNOWN，未證明已外洩，因此不升 P1。
- **最小修正：**preview 使用獨立、最小權限 credential，放在隔離 preview Cloudflare environment；PR runtime 永不接觸 production auth secret。若無安全 preview credential，gate 應 fail closed 並清楚標示缺前置條件。
- **直接驗收：**(1) PR job 無 production secret；(2) preview credential 不能操作正式環境；(3) 缺 credential 明確失敗；(4) fork／同 repo PR 的秘密暴露策略有測試；(5) log／錯誤完整遮罩。
- **追蹤：**既有 [Issue #3](https://github.com/Reese-max/avatar-vfo/issues/3)／[PR #9](https://github.com/Reese-max/avatar-vfo/pull/9)／[review thread](https://github.com/Reese-max/avatar-vfo/pull/9#discussion_r4032573981)。活躍 owner，`SKIPPED_LOCKED`。

### AVFO-9-D1 — preview hostname 仍寫正式 D1

- **fingerprint：** `Reese-max/avatar-vfo + versions upload preview smoke + sole production D1 binding + synthetic avatar create + preview request mutates production database`
- **kind / severity / priority / triage：** `BUG / P2 / HIGH_PRE_MERGE / NEEDS_REVIEW`
- **confidence：** HIGH；`SOURCE_CONFIRMED`；`NEEDS_RUNTIME_VERIFICATION`；`auto_implementation=false`
- **誰受影響／可達流程：**每次 PR preview gate 都會 POST 建立隨機命名 avatar。`versions upload` 只產生候選版本 URL；當前 `wrangler.toml` 仍只有正式 `vfo-adam` D1 database ID。
- **預期／實際：**預期 preview smoke 的寫入與正式資料面隔離；實際候選 Worker 仍可對正式 D1 建立／刪除列。cleanup 位於 happy path；例外、timeout 或刪除錯誤會留下資料。
- **不做後果：**發布驗證污染正式資料，且測試可靠性依賴事後刪除。
- **分級理由：**正式資料邊界被候選程式跨越，屬 P2 pre-merge blocker。現有資料是合成隨機名稱、未證明覆寫使用者資料，且 PR 未合併，故不升 P1。
- **最小修正：**為 preview environment 綁定獨立 D1 database 與 preview-only credential；cleanup 放入 `finally` 只作 defense-in-depth，不能代替隔離。無需新資料庫平台或環境矩陣。
- **直接驗收：**(1) receipt 顯示 preview D1 database ID 與 production 不同；(2) smoke 前後正式 D1 row/count 不變；(3) 強制 request exception 後 preview 資料可回收；(4) hostname guard 不是唯一隔離；(5) exact-head preview HTTP 成功。
- **追蹤：**既有 [Issue #3](https://github.com/Reese-max/avatar-vfo/issues/3)／[PR #9](https://github.com/Reese-max/avatar-vfo/pull/9)／[review thread](https://github.com/Reese-max/avatar-vfo/pull/9#discussion_r4032573984)。活躍 owner，`SKIPPED_LOCKED`。

### AVFO-VAL-EXACTHEAD — 候選 head 沒有可用遠端執行收據

- **fingerprint：** `Reese-max/avatar-vfo + PR4/PR9 exact head + GitHub Actions admission + runs terminate before steps + no durable test/deploy/runtime receipt`
- **kind / severity / priority / triage：** `VALIDATION_GAP / NOT_ESTABLISHED / P2 / NEEDS_EVIDENCE`
- **confidence：** HIGH（run 結果）；遠端直接原因 `UNKNOWN`；`auto_implementation=false`
- **證據：**PR #4 的 CI/Deploy runs `34319798153`／`34319798130` 失敗且零步驟；PR #9 的 CI/Deploy runs `35174753495`／`35174753426` 同樣沒有可讀執行步驟。owner comments 引述 Actions budget annotation，但本輪 connector 無法獨立取回 job annotation。
- **界線：**這阻止 CLEAN 與 merge confidence，但不證明 auth、deploy 或測試本身已壞，也不自動構成 P1。
- **最小實驗：**在 budget／policy 前置條件恢復後，於相同 head 執行既有 CI 與隔離 preview；保存 job、測試名、環境、結果與 preview binding receipt。`BUILD` 只代表證據足夠進下一個決策，不自動核准合併。
- **追蹤：**既有 [Issue #3](https://github.com/Reese-max/avatar-vfo/issues/3)；活躍 PR，`SKIPPED_LOCKED`。

## 4. 外部競品與替代工作流

所有來源於 2026-09-20 查閱；來源沒提供清楚更新日者明列 `UNKNOWN`。產品宣稱只證明其公開能力，不證明成效、完成率或本產品收益。

| 對象／來源 | 日期與狀態 | 目標／首次成功／能力 | 對 avatar-vfo 的含義 |
|---|---|---|---|
| [Character.AI](https://character.ai/) | 查閱 2026-09-20；頁面更新日 `UNKNOWN`；`CONFIRMED` | 面向一般使用者的角色聊天，首次成功是選擇／建立角色後對話；分發與消費體驗優先 | `SHOULD BE BETTER`：avatar-vfo 不應比消費型產品更難理解角色目前狀態；`DO NOT COPY`：不要為追求社群角色庫而犧牲私有管理面與可稽核狀態 |
| [Convai 官方文件](https://docs.convai.com/api-docs/) | 查閱 2026-09-20；更新日 `UNKNOWN`；`CONFIRMED` | 建立、客製、測試、部署互動 AI 角色；涵蓋 Playground、no-code、Unity/Unreal/Web 與 API | `DIFFERENTIATOR`：avatar-vfo 應聚焦文字角色狀態、可檢查 inner/reply 與治理，不與 3D/XR/遊戲整合廣度競爭 |
| [SillyTavern 官方文件](https://docs.sillytavern.app/) | 查閱 2026-09-20；頁面 ©2026、精確更新日 `UNKNOWN`；`CONFIRMED` | 本機 power-user LLM 前端；character cards、personas、world info、群聊、RAG、多 backend；開源免費 | `MUST MATCH`：角色定義與上下文應可看懂／可攜；`SHOULD BE BETTER`：托管管理流程與權限邊界；`DO NOT COPY`：不承擔其外掛與 provider 廣度 |
| [ChatGPT Memory](https://openai.com/index/memory-and-new-controls-for-chatgpt/) | 初版 2024-02-13，頁面含 2025-06-03 更新；查閱 2026-09-20；`CONFIRMED` | 一般助理以 saved memory／chat history 形成跨對話個人化，並提供關閉、查看與刪除控制 | `MUST MATCH`：持久狀態需可見、可控制、可刪除；`DIFFERENTIATOR`：VFO 明確分離開發者 inner state 與對外 reply，可形成可稽核角色狀態 |
| [Cloudflare Access JWT 驗證](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/) | 更新 2026-05-06；查閱 2026-09-20；`CONFIRMED` | 官方 auth 基準：從 `/cdn-cgi/access/certs` 取得 keys、依 `kid` 驗證 JWT；key 定期輪替 | `MUST MATCH`：管理面不能停留在 header presence 或解碼；輪替期間必須安全刷新、失敗關閉 |

### 市場／能力分類

- **MUST MATCH：**真正驗簽；輪替可恢復；角色狀態可見、可控、可刪除；preview 與 production 的 credential／D1 隔離；可讀的發布收據。
- **SHOULD BE BETTER：**把 `<inner>`／`<reply>` 與 VFO 進度做成易理解、可追溯的信任介面；小型產品也能清楚知道「誰能改、改了什麼」。
- **DIFFERENTIATOR：**私有、狀態化、可稽核的角色演進，而非角色數量、3D avatar 或 provider 數量。
- **DO NOT COPY：**大型社群 marketplace、遊戲引擎／XR、任意外掛／腳本生態、多租戶 IAM、通用 agent platform。

## 5. 50 個合成 Persona（獨立於固定 A01–J05）

下表是純模擬；不是 50 位真人、票數、發生率、營收或優先級證據。`R01–R30` 延續回歸基線，`X01–X20` 為探索。Evidence：`E1`=default 未驗簽 P0、`E2`=PR4 輪替缺口、`E3`=PR9 secret boundary、`E4`=PR9 D1 boundary、`E5`=零步驟收據、`E6`=repo 產品契約／外部基準。

| ID | 背景／限制 | 目標與期待 | 任務／旅程 | 摩擦與結果 | 分級／建議／證據 |
|---|---|---|---|---|---|
| R01 | 單人 owner；時間少 | 安全查看 avatar | Access 登入→管理 | default 可偽造 header；失敗 | P0 既有；先完成 #2；E1 |
| R02 | 小型維護者；無安全團隊 | 合併 auth 修正 | review PR4→部署 | 無 exact-head 收據 | VALIDATION_GAP；先收據；E5 |
| R03 | 正式管理員 | key 輪替後不中斷 | 新 token→管理 API | cache 新 `kid` 被拒 | P2；受控刷新；E2 |
| R04 | 已登入長時 session 使用者 | 持續編輯角色 | cache 舊 key→新 token | 最長等待 TTL | P2；輪替測試；E2 |
| R05 | 被撤權使用者 | 應被可靠拒絕 | 舊／假 token→管理 | default 未驗簽可繞過 | P0 既有；fail closed；E1 |
| R06 | PR 貢獻者 | 安全跑 preview | push PR→smoke | 腳本可能取得正式 secret | P2；preview credential；E3 |
| R07 | repo 管理員；遵守 AGENTS | 不把 secret 放 GitHub | 啟用 gate | 缺 secret 直接 usage 2 | P2；安全前置條件；E3 |
| R08 | D1 資料 owner | preview 不碰正式資料 | PR smoke→create/delete | 同一正式 binding | P2；隔離 D1；E4 |
| R09 | on-call 維護者 | timeout 後可復原 | smoke create→request timeout | cleanup 未執行 | P2；隔離＋finally；E4 |
| R10 | 稽核者 | 判斷 head 是否可合併 | 查看 Actions | run 零步驟無 logs | NOT_ESTABLISHED；重跑；E5 |
| R11 | 非技術內容 owner | 只改 persona 文案 | 進管理 UI→更新 | auth 邊界不可信 | P0 既有；暫不遠端使用；E1 |
| R12 | 行動網路使用者 | 短時間管理 | Access 驗證→更新 | 輪替拒絕難診斷 | P2；可理解錯誤；E2 |
| R13 | 輔助科技使用者 | 知道登入失敗原因 | screen reader→auth error | 無 runtime accessibility receipt | NEEDS_EVIDENCE；瀏覽器驗證；E5 |
| R14 | 低頻 owner | 六週後回來仍可用 | Access key 剛輪替→登入 | cache/rotation 情境未覆蓋 | P2；rotation test；E2 |
| R15 | 安全審查員 | 查證 issuer/aud/signature | 讀 PR4 | 核心驗簽方向正確，rotation 未閉合 | NARROW；補一條刷新；E2 |
| R16 | QA | 重現未知 kid | 先填 cache→換 key | 缺對應測試 | P2；加單一回歸；E2 |
| R17 | SRE | 避免外部 fetch 放大 | 送大量未知 kid | naïve refresh 可能放大 | 安全例外；singleflight/cooldown；E2 |
| R18 | release manager | PR 合併前有可靠 gate | CI→preview→smoke | gate 未開始 | VALIDATION_GAP；不宣稱 pass；E5 |
| R19 | privacy owner | 合成測試不留正式資料 | smoke 失敗→查 D1 | 可能殘留 avatar | P2；preview D1；E4 |
| R20 | support | 回答「為何登不進去」 | 收 ticket→查 logs | rotation 與 invalid token 不可區分 | P2；安全可觀測 reason；E2 |
| R21 | 本機開發者 | 不連正式資源測試 | local tests→preview | local unit 不等於正式 binding | NEEDS_EVIDENCE；隔離 receipt；E4/E5 |
| R22 | 多裝置使用者 | 電腦與手機一致 | 兩裝置跨輪替 | 一端可能 cache 舊 key | P2；issuer-scoped refresh；E2 |
| R23 | 審慎 CFO | 不建大平台 | 評估修正成本 | IAM 平台過度 | SIMPLIFY；局部 refresh/preview env；E2-E4 |
| R24 | 開源式外部 reviewer | 不接觸 secrets | 提 PR→驗證 | 同 repo PR code 可讀 env | P2；禁止 prod secret；E3 |
| R25 | incident responder | 能撤銷／旋轉 | rotate key/secret→驗證 | JWT rotation path不完整 | P2；演練 receipt；E2/E3 |
| R26 | 資料庫管理者 | production 只收正式請求 | preview smoke→D1 | 候選碼寫 production | P2；獨立 binding；E4 |
| R27 | product owner | 角色狀態比功能廣度重要 | 看 roadmap→選前三件 | auth/deploy 信任未完成 | NOW 信任；不加 marketplace；E1-E6 |
| R28 | 內容創作者 | 保存人格演進 | 編輯→查看 inner/reply | 核心價值成立但遠端安全不成立 | BLOCK_REMOTE；E1/E6 |
| R29 | 回歸測試員 | 舊 key 保留期仍可用 | rotation 後舊 token | PR4 未具輪替測試 | P2；新舊 key雙路徑；E2 |
| R30 | 維護交接者 | 從 README 安全上線 | 安裝→設定→deploy | 收據與 preview 隔離不足 | P2；最小 runbook/receipt；E3-E5 |
| X01 | 兩人創作團隊 | 共同維護一個 avatar | 共享管理 URL | 多人授權需求未核定 | OPPORTUNITY/UNKNOWN；不建帳號系統；E6 |
| X02 | 角色研究者 | 比較人格版本 | 匯出版本→diff | 未證明需新 ledger | RESEARCH/DEFER；先用既有資料；E6 |
| X03 | 離線優先使用者 | 本機角色卡 | 匯入 SillyTavern card | 支援範圍未定 | OPPORTUNITY/UNKNOWN；窄格式實驗；E6 |
| X04 | 遊戲開發者 | 接 Unity NPC | API→即時角色 | 與現定位差距大 | DEFER；不追 Convai 廣度；E6 |
| X05 | 語音使用者 | 語音角色互動 | mic→voice reply | repo 無核定語音路徑 | NOT_ESTABLISHED；不開單；E6 |
| X06 | 低視力創作者 | 鍵盤管理 inner/reply | 瀏覽器→編輯 | 無 AT runtime receipt | RESEARCH；窄 accessibility 測試；E5 |
| X07 | 手機創作者 | 手機快速改設定 | mobile→Access→edit | 無 mobile receipt | NEEDS_EVIDENCE；不當 bug；E5 |
| X08 | 教學者 | 建情境角色 | 建立→分享給班級 | 兒少／共享治理未核定 | DEFER；不擴教育平台；E6 |
| X09 | 心理健康使用者 | 情緒陪伴 | 長期對話 | 高風險用途無產品聲明 | DO NOT CLAIM；加界線先於功能；E6 |
| X10 | 企業採購 | SSO、稽核、SLA | 評估→採購 | 專案規模不符 | REJECT enterprise suite；E6 |
| X11 | 角色市場賣家 | 發布 avatar | 上架→付費 | 無市場授權／需求 | REJECT marketplace；E6 |
| X12 | 隱私敏感使用者 | 查看／刪除所有狀態 | inspect→delete | 需真實資料刪除 receipt | RESEARCH/NEXT；重用現有 delete；E6 |
| X13 | 模型切換者 | 換 provider 保留角色 | export→switch | provider portability 未證實 | OPPORTUNITY/DEFER；不建 adapter matrix；E6 |
| X14 | API 整合者 | 以最小權限讀角色 | token→read | 現 auth 是全管理邊界 | RESEARCH；read-only scope 假設；E1 |
| X15 | 安全攻擊者模型 | 放大 cert fetch | 大量隨機 kid | 若直接每次刷新會被放大 | P2 設計 guardrail；E2 |
| X16 | 供應商中斷情境 | JWKS endpoint 暫停 | cache miss→auth | 應 fail closed、保留舊有效 cache | RESEARCH；bounded stale 策略需 owner 決定；E2 |
| X17 | 災難復原 owner | preview 誤寫後回復 | 比對 D1→清理 | 無隔離與 receipt | P2；先隔離，非新備份平台；E4 |
| X18 | 法遵審閱者 | 證明誰能改角色 | auth→audit trail | 先決 auth 未完成 | LATER；不以 ledger 取代驗簽；E1 |
| X19 | 成本敏感 hobbyist | 零額外服務 | 選修正方案 | 獨立 preview D1 仍是最小安全邊界 | P2；單一 preview env；E4 |
| X20 | 新 owner 接手 | 三十分鐘判斷能否 deploy | README→Actions→bindings | 零步驟與 prod binding 阻塞決策 | P2；一份 exact-head receipt；E3-E5 |

### 純模擬偏好切換測試

不產生比例或「票數」。模擬結果僅顯示：消費型使用者若追求立即聊天，Character.AI 類流程較直接；power user 若追求 provider／card 控制，SillyTavern 較成熟；遊戲／3D 開發者偏 Convai。avatar-vfo 只有在「私有、持久、可稽核的角色演進」成立且 auth／preview 信任邊界通過時才具差異化。這是定位檢查，不是需求證據。

## 6. 模型產品董事會（保留分歧）

| 觀點 | 判斷 |
|---|---|
| CEO | 如果只做三件事：(1) 完成真正驗簽與 rotation；(2) preview credential/D1 隔離；(3) exact-head 收據。明確不做 marketplace、3D/XR、企業 IAM。 |
| CPO | 核心價值是可信的角色狀態演進，不是角色功能總量；遠端管理仍有 P0 時，新表面功能沒有產品價值。 |
| CTO | PR #4 架構方向可維持，只需 bounded refresh；PR #9 必須用 environment binding 解耦，不建立通用平台。 |
| Staff/Principal Engineer | 未知 `kid` refresh 必須 singleflight＋cooldown；不能用「清空整個 cache 並每次重抓」製造 DoS 面。 |
| UX Lead | 合法 token 在 rotation 時得到一般 401/403 會讓 owner誤判設定錯；安全地區分可恢復 auth 錯誤有價值。 |
| UX Researcher | 50 Persona 只能暴露路徑假設，不能證明頻率；需要一條 owner 首次成功與 rotation 任務的真實觀察。 |
| Growth | 主張先改善分享／角色探索可能增加採用，但在 remote 管理可被偽造時應延後；不同意把 marketplace 當 acquisition shortcut。 |
| CFO | 接受一個獨立 preview D1／credential 的小成本；反對新 IAM、資料平台或跨 provider matrix。 |
| Security/Privacy | default P0 未解除前不得把遠端管理視為安全；PR code 不應接觸 production secret，preview 不應碰 production D1。 |
| QA | 單元綠燈不足；要 exact-head cache rotation、unknown-kid flood、preview binding 與 forced-failure cleanup 收據。 |
| SRE | rotation refresh 要有 timeout、singleflight、cooldown 與指標；但不要求新監控平台，結構化現有 log 即可。 |
| Accessibility | 不把缺瀏覽器／AT 收據升格為產品缺陷；在安全 blockers 後以一條鍵盤＋screen reader owner journey 驗證。 |
| Support | 錯誤需能區分 invalid token、JWKS refresh failure、missing preview credential 與 D1 binding mismatch，避免靠猜測處理 ticket。 |

**實質分歧：**Growth 想先降低分享與 discovery 摩擦；Security、CPO 與 QA 主張 remote trust boundary 是硬 gate。裁決採後者，但只要求三個局部修正與收據，不擴成安全平台。

## 7. Red Team：嘗試推翻提案

| 反證假說 | 查核 | 結果 |
|---|---|---|
| PR #4 已完全解決 default P0，所以不用再阻擋 | PR #4 確實加入 RS256、issuer/aud/exp 等驗證；但未知新 `kid` 在 cache hit 時不刷新 | **推翻「完全解決」；保留候選方向，縮成一個 P2 輪替補丁** |
| 五分鐘拒絕應算 P1 | fail closed、TTL 有界，沒有資料或權限破壞 | **推翻升級；P2 足夠** |
| 每個未知 `kid` 都立即 refetch 即可 | 攻擊者可用任意 `kid` 觸發外部請求 | **推翻 naïve 解法；需 singleflight/cooldown** |
| preview URL 天然隔離正式 D1 | Wrangler binding 明確仍指向唯一正式 database ID | **推翻；hostname 不等於資料面隔離** |
| happy-path delete 足以避免污染 | exception/timeout 會跳過 cleanup，且即使成功也曾寫入正式庫 | **推翻；`finally` 不能替代隔離** |
| GitHub secret 是正常 CI 作法 | 專案規則禁止如此管理正式秘密，且 PR-controlled script 可讀 env | **推翻；只接受 preview-only credential** |
| 零步驟失敗證明測試壞了 | 沒有 steps/logs，直接原因本輪不能獨立驗證 | **推翻；只記 validation gap** |
| 應趁機導入通用 IAM、secret broker、environment matrix | 一個 issuer-scoped refresh＋一個 preview environment 足以解根因 | **推翻大型工程** |
| 競品有 3D、語音、社群，avatar-vfo 也缺 | 沒有核定使用者需求或可達失敗，且產品差異在私有狀態治理 | **推翻開單** |
| audit-only HEAD 代表產品已修 | default 最新 commit 只增稽核文件，產品 baseline 未改 | **推翻 Verified Fixed** |

## 8. Decision Memo

- **服務誰：**目前服務需要私有、持續角色狀態與明確 inner/reply 分離的單一 owner／小型創作維護者，而非大型遊戲工作室、企業多租戶或公開角色市場。
- **選擇與競爭理由：**Character.AI 類產品勝在立即消費，Convai 勝在 3D／整合，SillyTavern 勝在 power-user 廣度。avatar-vfo 應以「受保護、可持續、可稽核的角色演進」競爭。
- **差異化：**VFO 七步流程、持久狀態、開發者 inner 與使用者 reply 的可檢查分離；前提是管理身份與環境隔離可信。
- **前三優先：**(1) #2 的 cryptographic verification＋bounded rotation refresh；(2) preview-only credential 與 D1；(3) exact-head CI／preview HTTP 收據。
- **不做／刪除：**不把 production `AUTH_SECRET` 送入 PR；不讓 preview 寫 production D1；不新增 marketplace、3D/XR、語音、社群、企業 IAM、通用 secret/data platform；刪除「preview hostname 即安全隔離」的假設。
- **風險／最小實驗：**在隔離 preview 模擬 cached-old-key→new-kid；模擬大量 unknown kid；故意令 smoke request 失敗並確認 production D1 零變化。退出條件：`BUILD` 僅在 exact-head receipts 完整時支持 owner 做 merge review；否則 `NARROW` 或 `REJECT` 候選解法。
- **投資建議：**`MAINTAIN` 核心角色模型；`INVEST` 於 trust boundary；`SIMPLIFY` auth refresh 與單一 preview environment；其餘 `PAUSE`。

## 9. NOW / NEXT / LATER / DON'T

- **NOW：**完成 PR #4 未知 `kid` 的受控刷新；使 PR #9 永不取得 production secret、永不綁 production D1；保留 active owner scope。
- **NEXT：**同 head 重跑 CI 與隔離 preview，保存真實 job/step/test/binding/HTTP receipt；之後再做 owner 首次成功與鍵盤／screen reader 窄驗證。
- **LATER：**角色狀態匯出／刪除可見性、read-only integration、單一 card portability 實驗；全部維持 `NEEDS_REVIEW`，不因 Persona 模擬直接建工程。
- **DON'T：**不啟動實作代理、不 merge/deploy、不新增付費承諾、不寫正式資料、不以 review badge 或模型董事會投票當授權、不為競品功能差異開單。

## 10. 回歸、互斥與追蹤結果

| 類別 | 數量／狀態 |
|---|---|
| 新 actionable finding | 3（P2 3） |
| validation gap | 1（severity `NOT_ESTABLISHED`，decision priority P2） |
| 新建 Issue | 0 |
| 更新／重開 Issue | 0 |
| 去重／映射 | 4/4，映射 #2、#3、PR #4/#9 與既有 review threads |
| SKIPPED_LOCKED | 4（活躍 owner／branch／PR／review） |
| Verified Fixed | 0 |
| 寫入阻塞 | 0（中央報告已 commit 並讀回驗證） |
| runtime pending | Cloudflare Access 真實驗簽與輪替、preview D1、部署 HTTP、瀏覽器、手機、輔助科技 |
| CLEAN | **NOT CLEAN, 0/2** |

本輪沒有在 Issue 或 PR 留重複留言，沒有取得或搶占 issue lease。所有產品建議均為 `auto_implementation=false`；活躍實作者保有 scope。
