# Product Board Audit — 2026-10-03T20:01:00Z

## Status and evidence boundary

**PARTIAL / NOT CLEAN.** 本輪自前次正式報告 `2026-10-03T14:05:00Z` 起，完整重列 Reese-max 自有 repositories（45：44 未封存、1 封存），固定每個未封存 repo 的 default branch / HEAD，並增量核對 default-branch commits、全部狀態且於時間窗內更新的 Issues/PR、相關 Actions/部署證據。深讀聚焦於兩個真正落地的修正與一個活躍高影響候選；沒有把無變更 repo 或內容庫硬轉成產品缺陷。

- 規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- 規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`
- 中央 repo inspected SHA：`Reese-max/autodev-ng@c521ee021db659e94cc7cf1ed70cb3ac8de40a4b`
- 時間窗：`2026-10-03T14:05:00Z–2026-10-03T20:01:00Z`
- 證據類型：SOURCE_CONFIRMED、靜態推論、default-branch push CI、exact-head PR CI；未執行真實 Cloudflare Access、真瀏覽器 OAuth、D1 migration、部署、秘密讀取、付費呼叫、merge、worker 或 GOAL。
- 封存 `Reese-max/obsidian-vault`：內容庫且 archived，排除產品缺陷建立，但保留於 inventory。
- 變更窗共 2 個 default-branch產品提交、14 個更新 Issue、31 個更新 PR；均低於單頁上限，查詢結果無續頁。無權限/無紀錄不被當成不存在。

## Discovery / landed change / runtime evidence

### clinical-scribe-worker #6 — PARTIALLY_FIXED / NEEDS_RUNTIME_VERIFICATION

[PR #21](https://github.com/Reese-max/clinical-scribe-worker/pull/21) 已落於 `5fb1bc6d5eeffeb96b63c4d025b023eecbeb43bd`。Source review 確認從僅信任 Cloudflare Access JWT header，改為以 team JWKS 驗 RS256 簽章、issuer、audience，失敗即拒絕；reviewer 權限改綁定已驗證 claims，偽造 header 測試使用真 keypair/JWKS。default-branch push [run 37135977146](https://github.com/Reese-max/clinical-scribe-worker/actions/runs/37135977146) 成功。

仍未有部署後、真 Cloudflare Access request 的 401/403/成功路徑 receipt，且 [Issue #6](https://github.com/Reese-max/clinical-scribe-worker/issues/6) 仍開啟、PR #23 仍引用該範圍。故不能宣稱 VERIFIED_FIXED 或關單。

### academic-mcp #14 — PARTIALLY_FIXED / NEEDS_RUNTIME_VERIFICATION

[PR #23](https://github.com/Reese-max/academic-mcp/pull/23) 已落於 `81452f4696952f7f6983a9341a388efc34024062`。Source review 確認 OpenAlex 非 200、transport error 與 malformed payload 不再偽裝成空結果；真 200 空結果仍保留，`max_results` 固定 1–100，optional API key 與 upstream override 有界。default-branch push [run 37135764635](https://github.com/Reese-max/academic-mcp/actions/runs/37135764635) 成功。

[Issue #14](https://github.com/Reese-max/academic-mcp/issues/14) 仍開啟；未有 landing SHA 經 owner FastMCP/已部署服務的正常與失敗路徑。先前舊連線曾接受 `max_results=101`，不可當成本次落地後證據。

### autodev-ng #39 — active candidate only

[PR #138](https://github.com/Reese-max/autodev-ng/pull/138) 目前 head `60f68cea5a3e93cb6ae4faf6b746760b9d00d636`，Windows/Node 22 [run 37144229688](https://github.com/Reese-max/autodev-ng/actions/runs/37144229688) 成功；本機 Node 24 仍有 owner/runner child timeout。先前 retained lease cleanup review finding 已被 token-aware recovery 修正且 thread resolved。PR 擁有 scope，本輪不改 Issue、分支或 PR。

## 新 actionable finding：cf-mcp-server 無 IP fallback 可被全域鎖死

- **Fingerprint:** `cf-mcp-server/oauth/owner-approve/no-cf-connecting-ip/global-admission-bucket-lockout/v1`
- **Kind:** BUG
- **Severity:** P2
- **Decision priority:** NOW（在 #9 候選合併前）
- **Triage:** NEEDS_REVIEW
- **auto_implementation:** false
- **Confidence:** SOURCE_CONFIRMED；部署發生率 UNKNOWN；NEEDS_RUNTIME_VERIFICATION
- **Inspected candidate:** `Reese-max/cf-mcp-server@6cb993f33334f229b44d142ab961a7e21eda4b68`
- **Tracking:** [Issue #9](https://github.com/Reese-max/cf-mcp-server/issues/9)、[PR #29](https://github.com/Reese-max/cf-mcp-server/pull/29)、未解 [review thread](https://github.com/Reese-max/cf-mcp-server/pull/29#discussion_r4174258457)

**問題與可達因果鏈。** `POST /oauth/owner/approve` 在解析/驗證 `request_id` 前取 `cf-connecting-ip || "unknown"`，並對 `owner-approve:<ip>` 先執行 30/min admission limiter。當 header 缺席時，所有合法 owner 與未驗證 caller 共用 `owner-approve:unknown`。任何人不需 secret、有效 request 或 nonce，只要送 30 個 malformed POST，就能使另一個合法 approval 在同分鐘被 429；持續重送可無限延長。後方 per-approval guess bucket 無法補救，因請求已在第一次共享 limiter 被拒絕。

**受影響使用者與後果。** 經 local proxy/workerd、移除 visitor-IP header 的 Cloudflare 設定或其他 no-header fallback 進入首個 browser OAuth grant 的 owner/admin；核心 onboarding/connector approval 可完全停擺。正常 Cloudflare Edge 通常提供 header，因此不升 P1；沒有資料/權限外洩證據。

**測試缺口。** PR 文件宣稱「無 `cf-connecting-ip` 時不會讓 caller 鎖住 owner」，但對應測試實際把 header 設為字串 `unknown`，且總 POST 數不足 30，未重現 header 真正缺席時跨 approval 共用 admission bucket。PR head 沒有 GitHub Actions run；作者本機 `npm run check` 54/54 是候選自述，亦未做真瀏覽器/workerd/D1 migration/deployment。

**最小有效修正。** 在嚴格限制 `request_id` 長度/形狀後，no-IP admission key 改綁定 parked approval（或等價且不可跨 approval 共享的 session key）；另保留廉價、無法被任意 caller 全域耗盡的端點成本 guard。新增判別性測試：無 header 下，對 approval A 至少 30 次 malformed/垃圾提交後，approval B 的合法 owner submission 仍成功；同時驗證 A 的猜測/成本限制仍存在。非目標：新 Redis/WAF/全域 rate-limit 平台、取消猜測限制、擴成 PAR/JAR 專案。

**互斥。** #9 有活躍 PR #29（另有既存 candidate 歷史），review thread 已追蹤同根因；依規則記為 `SKIPPED_LOCKED_ACTIVE_PR`。未留言、未加鎖、未建重複 Issue、未改 scope。

## 外部競品與替代工作流

公開官方資料查閱日：2026-10-03 UTC。能力宣稱不是獨立成效證據。

| 來源/替代 | 最新確認事實 | 對本產品的判斷 |
|---|---|---|
| Cloudflare HTTP request headers（頁面更新 2026-05-05） https://developers.cloudflare.com/fundamentals/reference/http-headers/ | 常態 edge-to-origin 提供 `CF-Connecting-IP`；Worker subrequest 有明確值；也可用 Managed Transform 移除 visitor-IP headers | MUST MATCH：常態 per-IP；SHOULD BE BETTER：既然明示 no-header fallback，就不可全域共享 |
| Cloudflare Workers Rate Limiting binding https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/ | 官方提供 binding 做限流，但語意/成本仍需產品自行選 key | DO NOT COPY 為本根因引入新平台；局部 key 修正較小 |
| Auth0 PAR / authorization transactions https://auth0.com/docs/secure/attack-protection/rate-limits | 公開文件以獨立 transaction/attempt 隔離授權流程與限制 | SHOULD BE BETTER：不同 parked approval 不互相耗盡；不等同要求導入 Auth0 |
| RFC 10017（Browser-Based Applications，2026） https://www.rfc-editor.org/rfc/rfc10017 | Browser public client 使用 Authorization Code + PKCE，要求 state/CSRF 邊界 | MUST MATCH：PR #29 的主方向；不是本次新功能授權 |
| RFC 9700（OAuth 2.0 Security BCP，2025） https://www.rfc-editor.org/rfc/rfc9700 | 最新安全 BCP 強調精確 redirect、PKCE 與防重放 | DIFFERENTIATOR：維持有界、可稽核實作；DO NOT COPY 全套企業平台 |

機會結論：本輪唯一高價值方向是**簡化並修正 fallback key**，不是新增 OAuth 產品線。競品存在某功能不構成本產品缺陷。

## Product board simulation

以下是模型多視角推演，不是獨立專家投票：

- **CEO：** 若只做三件事：(1) PR #29 合併前消除 no-IP 全域 lockout；(2) 補 exact-head CI 與真 browser/workerd/D1 非正式環境 receipt；(3) 完成 clinical/academic landing SHA 的 owner-runtime 驗證。不做 rate-limit 平台、PAR/JAR 或新服務。
- **CPO：** 首次授權若在支援的 fallback 流程被陌生人鎖死，直接破壞 first success；應在候選階段修，不等待事故。
- **CTO：** 以 per-approval admission key + 端點成本上限處理；反對跨 repo 框架。
- **Staff/Principal Engineer：** 先把 header 真缺席與字串 `unknown` 的測試語意分開，避免假綠。
- **UX/Research：** 429 頁需可恢復，但文案不能掩蓋跨 request 干擾；真瀏覽器鍵盤/錯誤路徑仍未觀察。
- **Growth：** connector 首次成功比更多 OAuth surface 更重要。
- **CFO：** 不需付費 WAF/Auth0/Redis 承諾。
- **Security/Privacy：** 保留 secret guess 限制；修正不能以取消 limiter 換可用性。
- **QA：** 新測試必須 ≥30 次且跨兩個 parked approvals，否則無法區分舊/新邏輯。
- **SRE：** source bug 成立，但常態 Edge 有 header；部署影響仍 UNKNOWN，故 P2 而非 P1。
- **Accessibility：** 沒有真 browser/accessibility receipt，不能宣稱核准頁通過。
- **Support：** 可暫用正常 Edge header 或程式化 header approval，但 workaround 不是根治。

分歧：CPO 想因 first-grant 失敗升 P1；SRE/Security 指出只有 no-header fallback 被證實、常態 Edge 通常有 header，且未證正式部署，因此維持 P2。全員反對把此修正擴成新基礎設施。

## 50 synthetic personas

30 regression baselines + 20 exploration。純模型模擬，不是真人票數、發生率、營收或優先級證據；與固定 A01–J05 分離，不增加 CLEAN 輪數。

| ID | 背景 / 任務 / 限制 | 結果 | 分級 / 建議 / 證據 |
|---|---|---|---|
| R01 | 首次設定 Web OAuth 的單人 owner；一般 Cloudflare Edge | 完成首授權 | 候選路徑；仍缺真瀏覽器 |
| R02 | owner；反向代理未保留 CF-Connecting-IP | 30 次垃圾 POST 後合法核准 | P2：共用 unknown 桶可鎖死 |
| R03 | owner；Managed Transform 移除訪客 IP | 跨請求核准 | P2：同上 |
| R04 | 本機 workerd 測試者；無該 header | 核准另一個 request_id | P2：跨 approval 干擾 |
| R05 | 第二位同出口管理者；header 正常 | 各自核准 | 同 IP 30/min；已知設計、非新根因 |
| R06 | 攻擊者；無有效 request_id | 連續送 malformed 表單 | 可先耗 owner-approve:unknown |
| R07 | 攻擊者；自建 parked approval | 猜自己的 secret | per-approval guess 桶，不推翻 admission 缺陷 |
| R08 | 合法 owner；第 31 次無 IP 請求 | 表單應仍可處理其他 approval | 實際 429 |
| R09 | owner；錯一次密碼後重試 | 有限重試 | guess 桶 5/min 候選覆蓋 |
| R10 | owner；並行兩個分頁 | 兩個 request 不互相阻斷 | admission 共用 unknown |
| R11 | 瀏覽器；CSRF nonce 正確 | 核准成功 | 候選測試覆蓋 |
| R12 | 瀏覽器；nonce 遺失 | 安全失敗 | 候選測試覆蓋 |
| R13 | 瀏覽器；request 過期 | 安全失敗 | 候選測試覆蓋 |
| R14 | public client；PKCE S256 | 交換 code | 候選測試覆蓋 |
| R15 | 惡意 client；redirect 近似值 | 不得 open redirect | 候選測試覆蓋 |
| R16 | 另一 client；偷用 owner session | 不得授權 | 候選測試覆蓋 |
| R17 | 程式化 owner；Authorization header | 保留 JSON/直接核准 | 候選路徑 |
| R18 | MCP token 持有者 | 不得取得 owner 權限 | 候選測試覆蓋 |
| R19 | 無 owner secret 的部署 | fail closed | 候選測試覆蓋 |
| R20 | 客服；看到 429 | 理解何時重試 | 單頁訊息；runtime 未驗證 |
| R21 | SRE；D1 暫時失敗 | 不應假成功 | runtime 未驗證 |
| R22 | 安全稽核者 | header fallback 不成全域 DoS | 失敗；SOURCE_CONFIRMED |
| R23 | 無障礙鍵盤使用者 | 完成核准表單 | 無 runtime/accessibility 證據 |
| R24 | 密碼管理器使用者 | 不誤存 root bearer | 靜態 hardening；不宣稱效果 |
| R25 | 隱私使用者 | 無秘密進 query/callback | 候選測試覆蓋 |
| R26 | 重放攻擊者 | approval/code 單次使用 | 候選測試覆蓋 |
| R27 | 資料庫維運者 | 過期 row 被界定清除 | 候選單元測試 |
| R28 | GitHub reviewer | 看 exact-head CI | 無 Actions run；只有作者本機聲明 |
| R29 | 產品 owner | 不把 PR 當已出貨 | SKIPPED_LOCKED_ACTIVE_PR |
| R30 | CLEAN 稽核者 | 兩輪+runtime 才 CLEAN | NOT CLEAN |
| E01 | 私有邊緣代理；重寫所有來源 header | 核准不互相干擾 | 需每 approval fallback key |
| E02 | Cloudflare 正常 Edge | CF-Connecting-IP 存在 | Red Team：常態不受此 fallback 缺陷 |
| E03 | 同來源 NAT 的合法團隊 | 大量核准 | 現行 per-IP admission 可能高摩擦；未另開單 |
| E04 | 惡意無 IP client；每分鐘 30 POST | 持續鎖死 owner | P2 可重複 DoS |
| E05 | 惡意 client；輪換 request_id | 不應繞過全域成本界線 | 最小修正仍需廉價端點 guard |
| E06 | 開發者；測試把 header 設為字串 unknown | 測出 header 缺席 | 測試不等價，造成假陰性 |
| E07 | 開發者；真正不設 header | 第 31 次跨 approval | 應新增判別性測試 |
| E08 | QA；恰好 29 次 malformed | 合法核准 | 目前未過門檻，不能證明安全 |
| E09 | QA；恰好 30 次 malformed | 合法另一 approval | 預期現況 429 |
| E10 | 部署者；移除 visitor IP headers | 仍支援首授權 | 官方可配置情境使 fallback 可到達 |
| E11 | 本機代理；所有人 unknown | 並行 onboarding | 高摩擦/可鎖死 |
| E12 | 惡意腳本；慢速每分鐘刷新 | 長時間 denial | 不需知道 owner secret |
| E13 | 平台架構師 | 提議 Redis/新服務 | REJECT：局部 key 與測試足夠 |
| E14 | 安全工程師 | 提議取消所有 limiter | REJECT：會增加猜測/成本風險 |
| E15 | 產品經理 | 把缺陷升 P1 | REJECT：僅 fallback、未證部署重大影響 |
| E16 | 財務 owner | 新增付費 WAF | REJECT：無需付費承諾 |
| E17 | 支援人員 | 給 owner 臨時文件 workaround | 可保留 header 或程式化路徑；非根治 |
| E18 | 外部 OAuth client | 要求 PAR/JAR 全套 | DEFER：非本根因 |
| E19 | 審查者 | 只依本機 54/54 合併 | 不足；需修正+exact-head CI/runtime |
| E20 | Portfolio owner | 要求零重複 Issue | 以 #9 + review thread 追蹤；不開新單 |

## Red Team

1. **常態 Edge 已有 header，是否根本沒有問題？** 這降低普遍性但不推翻：PR 明示支援 no-header fallback，官方也允許移除訪客 IP header，本機/代理路徑可達；文件更做了「不鎖 owner」承諾。
2. **per-approval guess bucket 是否已解？** 否。共享 admission limiter 更早執行；第 31 個請求在查 request 前就 429。
3. **把 admission limiter 也改 per-approval 會否讓攻擊者輪換 ID 放大 D1？** 可能；所以最小修正必須保留廉價的端點成本 guard，而不是單純刪限流。這是驗收的一部分，不要求新平台。
4. **現有測試是否等價於 header 缺席？** 否。明確 header 值 `unknown` 仍走有-header branch，且請求數未達 30，無法使舊邏輯失敗。
5. **是否應另開 Issue？** 否。#9/PR #29 與未解 review thread 已是可追溯追蹤；活躍實作者存在，另開單只會分裂根因與搶 scope。
6. **是否可因本機 54/54 合併？** 否。沒有 exact-head Actions，且沒有真 browser/workerd/D1。修正後仍需判別性 CI 與非正式 runtime。
7. **兩個落地修正能否標 VERIFIED_FIXED？** 否。clinical/academic 均缺各自支援 runtime 的 post-landing receipt。
8. **是否 CLEAN？** 否。固定 A01–J05 停止條件、連續兩輪與必要 runtime 證據均未滿足。

## Findings / Issue mapping

| Finding | 狀態 | 追蹤 | 本輪動作 |
|---|---|---|---|
| no-IP owner approval 共用 admission bucket 可全域鎖死 | BUG / P2 / NOW / NEEDS_REVIEW | [#9](https://github.com/Reese-max/cf-mcp-server/issues/9), [PR #29](https://github.com/Reese-max/cf-mcp-server/pull/29), [review](https://github.com/Reese-max/cf-mcp-server/pull/29#discussion_r4174258457) | 新 actionable finding；SKIPPED_LOCKED_ACTIVE_PR |
| Cloudflare Access JWT 僅信 header | PARTIALLY_FIXED / runtime pending | [clinical #6](https://github.com/Reese-max/clinical-scribe-worker/issues/6), [PR #21](https://github.com/Reese-max/clinical-scribe-worker/pull/21) | landing source + push CI 重檢；無留言 |
| OpenAlex failure 偽裝空結果 | PARTIALLY_FIXED / runtime pending | [academic #14](https://github.com/Reese-max/academic-mcp/issues/14), [PR #23](https://github.com/Reese-max/academic-mcp/pull/23) | landing source + push CI 重檢；無留言 |
| stale-lock reclaim | active candidate / local Node 24 pending | [autodev-ng #39](https://github.com/Reese-max/autodev-ng/issues/39), [PR #138](https://github.com/Reese-max/autodev-ng/pull/138) | dedupe；active owner |

## Decision memo / NOW-NEXT-LATER-DON'T

- **服務誰：** 需要以瀏覽器完成 OAuth 首授權、同時要求可檢查安全邊界的單人 owner 與小型管理者。
- **選擇/競爭理由：** 保留現有 browser approval + PKCE，不引入 hosted identity/rate-limit 平台；以不跨 approval 干擾、可判別測試與誠實 runtime 邊界競爭。
- **差異化：** inspectable、最小依賴、失敗不偽裝成功、候選不冒充出貨。
- **前三優先：** (1) 修正 PR #29 no-IP key；(2) exact-head CI + 真 browser/workerd/D1 隔離驗證；(3) 完成 clinical/academic post-landing owner-runtime。
- **不做/刪除：** 不建 Redis/WAF/Auth0 平台、不取消猜測限制、不擴 PAR/JAR、不為每個競品差異開單、不用模擬 persona 當需求量。
- **風險/實驗：** 隔離環境以兩個 parked approvals、header 缺席、≥30 malformed submissions 驗證互不干擾與成本上限；BUILD/NARROW/REJECT 依這個單一實驗決定。
- **Portfolio posture：** `cf-mcp-server = MAINTAIN + SIMPLIFY`；`clinical-scribe-worker = MAINTAIN`；`academic-mcp = MAINTAIN`；`autodev-ng candidate = PAUSE promotion until runtime/local timeout receipt`。本輪是完整 inventory + 增量深讀，不宣稱完整深度 ranking。

- **NOW：** 在 PR #29 合併前修 P2 並補判別性測試。
- **NEXT：** 非正式 browser/workerd/D1 與兩個 landed fixes 的支援 runtime。
- **LATER：** 有真需求後才評估更廣 OAuth/identity 整合。
- **DON'T：** merge/deploy/start worker/讀秘密/付費呼叫，或把 green unit test 當成 production verification。

## Writes / accounting / cursor

- 新 Issues：0
- 更新/重開/關閉 Issues：0
- 新 actionable findings：1（已有 review thread + #9/PR #29 追蹤）
- 已驗證修復：0
- 部分修復 / runtime pending：2
- Active-scope skips：cf-mcp-server #9/PR #29、autodev-ng #39/PR #138
- Product/CI/config/secrets/settings changes：0
- Merges/deployments/workers/GOALs：0
- Report：本唯一 audit-only 檔案
- Persistent next deep-read cursor：`avatar-vfo` 之後為 `cf-ai-router`；change-driven P0/P1 仍優先
- Portfolio CLEAN：**NO**

## Full owned inventory snapshot

未封存 44 個 repository 均固定到以下 default HEAD；封存 `obsidian-vault@master` 另列為 excluded。

| Repository | Default | HEAD | Visibility |
|---|---|---|---|
| Reese-max/cf-ai-router | `main` | `74c52130046a` | private |
| Reese-max/soundbox-offline | `main` | `2d6b46d32453` | private |
| Reese-max/police-exam-archive | `master` | `a0b5dbb9352b` | public |
| Reese-max/skill-foundry | `main` | `d283b5b8af94` | private |
| Reese-max/google-maps-personal-mcp | `main` | `800bc3b5adc3` | private |
| Reese-max/prompt-autoresearch | `master` | `01dc864c04a0` | public |
| Reese-max/lobsterpulse | `main` | `41e09eb922a3` | public |
| Reese-max/tick-stock-panel | `main` | `54c303476e5d` | private |
| Reese-max/clinical-scribe-worker | `main` | `5fb1bc6d5eef` | private |
| Reese-max/ai-flight-radar | `main` | `6228138337f9` | public |
| Reese-max/openab | `main` | `50424ed46177` | public |
| Reese-max/adng-memory | `main` | `dc1c4e7f0531` | private |
| Reese-max/avatar-vfo | `main` | `8c578febb49a` | private |
| Reese-max/taiwan-intel-dashboard | `main` | `df7cee191aa5` | public |
| Reese-max/note-filler | `main` | `1df674dd32d6` | public |
| Reese-max/cyber-prep-coach | `main` | `ffc7bbbb2837` | private |
| Reese-max/UkePack | `master` | `718d021f0147` | public |
| Reese-max/autodev-ng | `main` | `c521ee021db6` | public |
| Reese-max/ai-novel-workstation | `main` | `267a0b6a9856` | private |
| Reese-max/police-essay-mcp | `main` | `500f632995c5` | private |
| Reese-max/herdr-skills | `main` | `9f134e1b0a53` | private |
| Reese-max/chatgpt-dual-pipeline | `master` | `1ade604e9ed0` | private |
| Reese-max/video-timeline-pipeline | `main` | `7d8929728fc7` | private |
| Reese-max/claude-mem | `main` | `3ed5439ff683` | public |
| Reese-max/travel-planning-app | `main` | `dd5081dfee74` | public |
| Reese-max/MaterialYouNewTab | `main` | `7d32f2f460cc` | public |
| Reese-max/taichung-police-intel | `main` | `562141e396c6` | public |
| Reese-max/travel-planning-mcp | `main` | `a627d888b891` | public |
| Reese-max/octobroker | `main` | `b669101c0ef4` | public |
| Reese-max/ninax-line-hermes | `main` | `b71a827f577c` | public |
| Reese-max/92-duty-scheduler | `main` | `4d7d7d4911ff` | private |
| Reese-max/voice-actress | `master` | `75cdcea43ca4` | private |
| Reese-max/project-doctor-web | `main` | `f34dd1d7b011` | private |
| Reese-max/openab-pty | `main` | `9e1464058335` | public |
| Reese-max/flux-image-gen | `main` | `dfadcf30ca1d` | public |
| Reese-max/neciken-summer-poem | `master` | `a6e268b7cbff` | private |
| Reese-max/minideck | `main` | `31f7131ae24a` | public |
| Reese-max/studio | `main` | `0f1b62d3c543` | public |
| Reese-max/police-exam-practice | `master` | `b97b96dbda2d` | public |
| Reese-max/ppt-studio | `master` | `8ca3b8ca9b32` | private |
| Reese-max/exam-archive | `main` | `5d74726eed8f` | public |
| Reese-max/spotify-playlist-organizer-mcp | `main` | `13aae7852901` | public |
| Reese-max/academic-mcp | `main` | `81452f469695` | private |
| Reese-max/cf-mcp-server | `main` | `a3192b6d7be2` | private |
| Reese-max/obsidian-vault | `master` | archived / excluded | private |
