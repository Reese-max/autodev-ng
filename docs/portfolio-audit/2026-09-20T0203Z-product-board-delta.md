# Portfolio Product Board Delta — voice-actress

- Run: `2026-09-20T02:03:21Z`
- Scope: `Reese-max/voice-actress`（private、未封存、default branch `master`）
- Portfolio inventory: 42 repositories；41 未封存、1 已封存（`obsidian-vault`）
- Quality rules: `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Default HEAD inspected: `b20a3f3e58b055ff27acf7cdd302d822841a119c`（audit-only）
- Product baseline: `de674011cac49d74693685381b4fae4fd9fe9826`
- Candidate heads: PR #16 `fec41fd5fa1e8d3f5331d117480c6e1dfc8602b6`；PR #17 `cbdc11d758a2d68d4affe84186a7d451c6b22507`；PR #18 `f6aec3a99bb34230c880bf9be84c5233a8dcff70`
- Result: **PARTIAL / NOT CLEAN / fixed audit 0 of 2**
- Authorization: audit/triage only；未修改產品程式、CI、設定、secret、權限，未 merge/deploy，未啟動實作 worker。

## Executive decision

**INVEST / SIMPLIFY / BLOCK PR #16 UNTIL OWNER PROOF IS TRUE.**

服務對象是以私人申論草稿、批改紀錄與弱點分析準備警察／公職考試的個人使用者。產品的合理差異化不是題庫廣度，而是本地優先、可追溯的採分依據與法源、以及不把私人作答暴露給同網路的其他人。

若只能做三件事：

1. 關閉 Issue #14 的真正根因：憑證必須證明 owner，不能接受任意 caller-supplied UUID 後替它簽章。
2. 讓 PR #18 的「答案片段 ↔ 採分點 ↔ 法源」只在可核對時成立，空白片段與未知條次都要 fail closed。
3. 在 exact candidate heads 取得可讀、可重跑的 HTTP／持久層／瀏覽器收據，再談合併或 CLEAN。

不做：不新增 OAuth、帳號平台、通用 IAM、跨產品 evidence graph、付費／商城、社交排行或多租戶 SaaS；競品的功能廣度不構成本產品擴張授權。

## Discovery and change surface

### Repository evidence

- Default HEAD `b20a3f...` 只加入既有產品董事會稽核，沒有產品修正，因此不使 `de6740...` 的產品證據失效。
- README 仍描述 Stripe／付費層與 flat-file 行為，和候選程式演進不同；此主題已有 Issue #7 與 PR #8/#10，未另開單。
- `package.json` 目前 default 使用 `next@16.2.3`；Issue #15 與 PR #17 已追蹤 upstream security upgrade，沒有新 fingerprint。
- Open issues/PR、review threads、branches 與 owner 狀態已核對。#14、#6、#15 均有活躍 owner/branch/PR；因此相關 findings 全部 `SKIPPED_LOCKED`。
- PR #16/#17/#18 的 exact head 均沒有 GitHub Actions workflow run 或 commit-status receipt。PR 文字中的本機測試／build 宣稱不是可讀的 durable receipt。

### Inspected artifacts

- PR #16: 58 changed files；device credential、session/dashboard/wrongs/grade/generate/chat quota 與前端 bootstrap。
- PR #17: Next.js dependency upgrade and advisory response。
- PR #18: answer evidence span、rubric mapping、law provenance、storage/export/UI。
- Existing tracking: [Issue #14](https://github.com/Reese-max/voice-actress/issues/14)、[Issue #6](https://github.com/Reese-max/voice-actress/issues/6)、[Issue #15](https://github.com/Reese-max/voice-actress/issues/15)。

## Findings and tracking

| ID | Finding / reachable impact | Classification | Evidence | Minimum effective change | Tracking / state |
|---|---|---|---|---|---|
| VA-16-1 | PR #16 的 `POST /api/shenlun/device` 接受任意格式正確的 caller-supplied `userId`，然後回傳該 UUID 的有效 HMAC token。知道先前 leaderboard/group/battle 暴露 UUID 的同網路使用者，可自鑄受害者 credential，故 #14 的跨使用者讀寫根因未關閉。 | Existing `BUG / P0 / CRITICAL`; candidate remediation blocker; `NEEDS_REVIEW`; `auto_implementation=false` | `SOURCE_CONFIRMED` at `fec41f...`; [review](https://github.com/Reese-max/voice-actress/pull/16#discussion_r4023197846) | 不接受 caller 指定既有 owner ID；首次裝置註冊只建立新的 opaque subject，claim/migration 必須以既有 owner secret 或一次性 capability 證明。 | Same fingerprint as #14; [PR #16](https://github.com/Reese-max/voice-actress/pull/16); `SKIPPED_LOCKED` |
| VA-16-2 | 缺少、錯誤或輪替後失效的 credential 都被壓成匿名 free tier 並回 200；client 只在 401 重發，使用者可長期被錯誤限流／顯示免費層。 | `BUG / P2 / HIGH_PRE_MERGE / NEEDS_REVIEW` | `SOURCE_CONFIRMED` at `fec41f...`; [review](https://github.com/Reese-max/voice-actress/pull/16#discussion_r4023197854) | 分開 absent 與 invalid credential；invalid/stale 應回明確 401/typed error，讓現有 client recovery 啟動。 | #14/PR #16; `SKIPPED_LOCKED` |
| VA-16-3 | 升級後已有 local profile 但尚無新 cookie 的首次頁面，server render 直接回空歷史；workbench 後續建 cookie 也未刷新 server view，進度可能直到手動 reload 才正確。 | `BUG / P2 / HIGH_PRE_MERGE / NEEDS_REVIEW` | `SOURCE_CONFIRMED` at `fec41f...`; [review](https://github.com/Reese-max/voice-actress/pull/16#discussion_r4023197860) | 使用單一明確 bootstrap/reload handoff；credential 建立後刷新 scoped server data，不另建全域狀態服務。 | #14/PR #16; `SKIPPED_LOCKED` |
| VA-18-1 | 非空 raw quote 正規化後可變成空字串；`indexOf("")` 產生 `[0,0]`，rubric 被標 supported，但 UI 無任何 highlight，storage sanitizer 又拒絕，造成畫面／保存狀態矛盾。 | `BUG / P2 / HIGH_PRE_MERGE / NEEDS_REVIEW` | `SOURCE_CONFIRMED` at `f6aec3...`; [review](https://github.com/Reese-max/voice-actress/pull/18#discussion_r4034562808) | normalize 後要求非空且 span `end > start`；無有效 span 時維持 unsupported，加入 whitespace-only regression。 | #6/[PR #18](https://github.com/Reese-max/voice-actress/pull/18); `SKIPPED_LOCKED` |
| VA-18-2 | 已快取法規中的未知條次（如第 999 條）仍回 `status=local_cache`，lawId 退化成 statute-only；UI/CSV/PDF 可能把未核對條次表示成 cache-backed。 | `BUG / P2 / HIGH_PRE_MERGE / NEEDS_REVIEW` | `SOURCE_CONFIRMED` at `f6aec3...`; [review](https://github.com/Reese-max/voice-actress/pull/18#discussion_r4034562814) | statute 與 article 分別驗證；未知條次回 unresolved/unknown，不生成可誤解的 article provenance。 | #6/PR #18; `SKIPPED_LOCKED` |

### Severity calibration

- VA-16-1 沒有另造一張 P0；它證明既有 #14 的 P0 修復仍不足。default branch 的已證實因果鏈是同網路 peer 能取得未分區的原始私人作答；prior receipt 是 extracted-handler mock，不是正式事故。
- VA-16-2/3 與 VA-18-1/2 影響首次成功、恢復性或高頻核心資料可信度，符合 P2；沒有資料外洩／權限重大影響的獨立因果鏈，不升 P1。
- PR #17 尚未合併，且缺 production OS/path exposure 與 exact-head receipt；Issue #15 維持 P2，不能標 VERIFIED_FIXED。

### Deduplication and mutex

- Fingerprints 已對照所有狀態 Issues、open PR、branches、review threads 與 prior audits。
- 5/5 findings 已由 #14/#6 與 PR review threads 追蹤；新 Issue 0、更新 Issue 0、重開 0。
- 三個 PR 皆有活躍 owner/branch；未取得 Issue lease、未留言、未改 scope，狀態 `SKIPPED_LOCKED`。

## Competitor and substitute check

查閱日均為 **2026-09-20**；頁面未顯示明確發布／更新日期者記 `UNKNOWN`，不把行銷宣稱當獨立成效證據。

| Source | Current confirmed signal | Date/status | Product implication |
|---|---|---|---|
| [公職王 AI 申論批改](https://www.public.com.tw/event/aifeedback/index.html) | 會員登入、每日 2 題免費、手動或 Word 上傳、分數／建議／模擬詳解／核心考點／延伸試題與 PDF 匯出；明示演算法結果僅供輔助。 | Page date `UNKNOWN`; `CONFIRMED` | `MUST MATCH`: 結果限制與可核對性；`DO NOT COPY`: 不因其廣度加入課程／會員／PDF 平台。 |
| [阿摩線上測驗](https://yamol.tw/) | 題庫、多種測驗、錯題、個人分析、人工寫作批改、社群與付費層；頁面顯示 2026 copyright。 | Observed 2026-09-20; `CONFIRMED` | `SHOULD BE BETTER`: 私人作答邊界與採分 provenance；`DO NOT COPY`: 社群、商城、排行。 |
| [考選部考畢試題平台](https://wwwq.moex.gov.tw/exam/wFrmExamQandASearch.aspx) | 官方 PDF 題目；最新試題於全部筆試次日上午 10 時公布，引用須保持完整。 | Page date `UNKNOWN`; `CONFIRMED` | `MUST MATCH`: 題源、年度、科目與完整引用；官方來源優先於生成式詳解。 |
| [Gemini Notebook plans/data handling](https://support.google.com/gemininotebook/answer/16213268?hl=zh-Hant) | 標準版可免費註冊；方案提供來源、測驗、學習卡與進階共用；consumer 資料原則上不訓練，feedback 例外；enterprise 另有 IAM/VPC-SC。 | Live help page; update date `UNKNOWN`; `CONFIRMED` | `DIFFERENTIATOR`: 小型、本地、題目專用的可核對 evidence；`DO NOT COPY`: enterprise IAM/協作矩陣。 |

### Positioning

- **MUST MATCH:** 私人作答預設隔離；題目／法源／採分點可追溯；錯誤與限制明示；行動端可完成核心流程。
- **SHOULD BE BETTER:** 答案片段到 rubric 與法條條次的可核對鏈；離線／本地資料控制；不以模糊 AI 分數冒充正式評分。
- **DIFFERENTIATOR:** 個人申論練習的 narrow evidence workspace，不是通用題庫或學習社群。
- **DO NOT COPY:** 會員商城、社交排行、通用 notebook、跨科目內容平台、enterprise IAM、AI 代寫／答案生成。

## Synthetic 50-persona exercise

純模型多視角推演，**30 回歸基線 + 20 探索**；不是 50 位真人、票數、發生率、營收或優先級證據。固定 A01–J05 稽核另計，不能由本表替代。

| ID | Background / constraint | Goal & journey | Friction / outcome | Triage recommendation / evidence |
|---|---|---|---|---|
| R01 | 在職警員、共用家用 Wi-Fi | 回看私人申論與弱點 | peer 可自鑄已知 UUID credential；FAIL | #14 P0 remains; source + prior mock |
| R02 | 補習班學員、同宿舍網路 | 手機續寫草稿 | owner proof 不成立；FAIL | Block #16; source |
| R03 | 改機／清 cookie 使用者 | 找回既有歷史 | bootstrap 首頁空白；FAIL | P2; source |
| R04 | secret 輪替後舊 client | 查 quota 再練習 | invalid token 被當免費層；FAIL | P2; source |
| R05 | 免費層考生 | 確認剩餘額度 | 真缺 credential 可用匿名；PASS with boundary | Keep absent/invalid distinction |
| R06 | 每日重度練習者 | 連續 grade | 錯誤 credential 造成錯誤限流；FAIL | P2; source |
| R07 | 隱私敏感考生 | 只讓自己的裝置讀紀錄 | caller UUID mint 破壞隔離；FAIL | #14 P0 |
| R08 | 家人共用電腦、不同瀏覽器 profile | 各自追蹤弱點 | 首次 claim/migration 未被 owner proof 覆蓋；FAIL | Block #16 |
| R09 | 長期使用者、數百 sessions | 首頁快速看進度 | first render empty 造成錯誤心智模型；FAIL | P2 |
| R10 | 行動 Safari 使用者 | 登入後立即續寫 | credential 建立後無 server refresh；FAIL | P2 + runtime pending |
| R11 | 桌機 Chromium | 新建匿名 profile | 新 subject 路徑理論可達；CANNOT VERIFY | Browser receipt needed |
| R12 | 跨裝置使用者 | 從舊機移轉歷史 | 沒有已核定的安全 owner claim；NEEDS_EVIDENCE | Narrow migration experiment |
| R13 | 考前一週使用者 | 快速看錯題 | wrongs 必須同 owner scoped；PENDING | HTTP/DB receipt |
| R14 | 低數位熟練者 | 不理解 cookie／credential | 200 free fallback 隱藏修復動作；FAIL | Typed recovery UI |
| R15 | 無障礙鍵盤使用者 | 從首頁進工作區 | bootstrap/refresh 未實測 focus；CANNOT VERIFY | Browser + AT receipt |
| R16 | 螢幕閱讀器使用者 | 理解 evidence highlight | zero-length span 無可讀證據；FAIL | P2 |
| R17 | 只輸入空白引文的模型輸出 | 保存批改 | UI supported、storage rejected；FAIL | P2 regression |
| R18 | 複製含全形空白答案 | 建立 evidence | normalize 後可能空；FAIL | P2 |
| R19 | 答案重複同一句 | 定位正確片段 | first-match ambiguity 未新證實 | Evidence backlog |
| R20 | 長篇申論 | 檢視 rubric evidence | span 上限與效能未 runtime；CANNOT VERIFY | Browser/runtime |
| R21 | 引用已知法規已知條次 | 核對採分 | intended local cache path；CANNOT VERIFY | Exact-head tests |
| R22 | 引用已知法規未知條次 | 核對第 999 條 | 被標 local_cache；FAIL | P2 |
| R23 | 法規別名使用者 | 核對法源 | normalization coverage 未 runtime；PENDING | Narrow fixtures |
| R24 | 法規修法後考生 | 確認版本日期 | freshness/version 未由本 PR 完整證明 | #6 NEEDS_REVIEW |
| R25 | 匯出 CSV 使用者 | 離線複習證據 | unknown article 可能帶錯 provenance；FAIL | P2 |
| R26 | 列印 PDF 使用者 | 紙本核對 | PDF/print exact-head 未實測；CANNOT VERIFY | Print receipt |
| R27 | 無網路考生 | 使用 cached law | 可接受但需條次存在；PARTIAL | Fail closed unknown article |
| R28 | 模型回傳 malformed evidence | 顯示安全降級 | sanitizer 分層結果不一致；FAIL | One validation contract |
| R29 | 只使用題庫不批改 | 查官方題目 | default flow 未受新 findings 直接影響；PASS static | Regression receipt still needed |
| R30 | 維護者 | 依 CI 判斷可合併 | exact-head runs/status 為空；CANNOT VERIFY | Validation gap, no new issue |
| E01 | 補習班老師、單機示範 | 投影範例批改 | 不應載入私人學生歷史；PENDING | Public projection only |
| E02 | 圖書館公用電腦 | 臨時練習後離開 | credential custody/logout 未實測；NEEDS_EVIDENCE | Narrow threat test |
| E03 | iPad 使用者 | 手寫轉文字後批改 | IME/large paste 未實測；CANNOT VERIFY | Mobile receipt |
| E04 | 網路不穩使用者 | grade retry | idempotency/duplicate session 未重現 | Evidence backlog |
| E05 | 多語輸入使用者 | 中文法條＋英文註記 | normalization boundary 未實測 | P3 evidence backlog |
| E06 | 學習障礙考生 | 逐採分點查看理由 | zero-length evidence 造成誤導；FAIL | P2 |
| E07 | 色弱使用者 | 分辨 supported/unsupported | 只靠顏色與否未檢查 | Accessibility runtime |
| E08 | 低階 Android | 開啟長答案 evidence | DOM/highlight 效能未知 | Runtime, no issue yet |
| E09 | 企業／學校受管裝置 | cookie 被定期清除 | profile history 暫時消失；FAIL | P2 bootstrap |
| E10 | 代理／反向代理部署 | 遠端使用 | owner proof 更重要，部署邊界未核定 | Do not broaden deployment |
| E11 | 惡意同網路 peer | 嘗試 victim UUID | PR #16 會簽發 token；FAIL | #14 P0 |
| E12 | 知道舊 leaderboard UUID 的 peer | 讀 victim dashboard | 可達因果鏈延續；FAIL | #14 P0 |
| E13 | 隨機 UUID 攻擊者 | 枚舉資料 | 未證明 UUID 可枚舉；UNKNOWN | Do not overstate P0 impact |
| E14 | 法規研究者 | 驗證條次存在 | statute-only fallback 假背書；FAIL | P2 |
| E15 | 內容審核者 | 比對 quote 與原文 | 空 span 卻 supported；FAIL | P2 |
| E16 | 支援人員 | 診斷「突然變免費」 | 200 response 隱藏 invalid token；FAIL | Typed error |
| E17 | SRE | 判斷 candidate health | 無 exact-head receipt；CANNOT VERIFY | NEEDS_RUNTIME_VERIFICATION |
| E18 | Security reviewer | 檢查 secret rotation | stale token recovery 不明確；FAIL | P2 |
| E19 | CFO／維護者 | 避免過度工程 | OAuth/IAM 平台成本不符規模 | Prefer signed device + narrow claim |
| E20 | 新產品訪客 | 首次完成一題 | 競品廣度無助 owner proof／evidence truth | Maintain narrow scope |

## Product board review (model-simulated perspectives)

- **CEO:** 只做 owner proof、evidence truth、runtime receipt；停止會員／商城／社交廣度。
- **CPO:** 私人作答與可信批改是核心價值；若無法證明 owner，任何 dashboard 豐富度都不應優先。
- **CTO:** deterministic HMAC 本身不是問題；把未驗證 UUID 當 subject 才是根因。以最小 claim boundary 修正。
- **Staff/Principal Engineer:** absent/invalid credential、server/client bootstrap、evidence validation 應各維持單一 contract，避免多處 fallback 分歧。
- **UX Lead:** 200/free fallback 與空首頁會讓使用者把授權錯誤誤認為資料消失或降級。
- **UX Researcher:** 先觀察 cookie 清除、secret rotation、換機三條真實 journey；不要用 50 persona 當發生率。
- **Growth:** 暫不做分享／排行；私人資料事件會破壞比 acquisition feature 更基本的信任。
- **CFO:** 不建 OAuth/IAM 平台；採最小 signed-device + narrow recovery，控制維護面。
- **Security/Privacy:** PR #16 必須 fail closed；CORS、UUID 格式檢查與 HMAC 都不能替代 owner proof。
- **QA:** whitespace-only、unknown article、invalid token、first bootstrap 都需 exact-head regression receipts。
- **SRE:** 無 Actions/status，不能用 PR 文字中的本機綠燈宣稱可發布；但缺 CI 不自動升 P1。
- **Accessibility:** evidence 必須有文字狀態與可到達關聯，不可只靠 zero-length highlight 或顏色。
- **Support:** typed invalid-credential response 能把「資料消失／突然免費」轉成可恢復步驟。

### Material disagreement

- Growth 想以分享／群組增長，但 Security、Support 與 CEO 反對在 owner proof 未成立前增加資料表面。
- CPO 傾向做跨裝置恢復；CTO/Staff 要求先以一次性 narrow claim 實驗證明，不核准完整帳號系統。
- QA 希望全面矩陣；CFO 主張先覆蓋四個可直接推翻候選的反例。結論採最小有效四例，必要 browser/HTTP/DB 再擴。

## Red Team

1. **反證：HMAC 很強。** 否決提案的嘗試失敗；問題不是 token 可偽造，而是 server 願意替任意 caller 指定的 UUID 簽發真 token。
2. **更小替代：不接受既有 userId。** 對新裝置只產生新 subject；既有資料的 recovery 另用窄 capability，無需 OAuth。
3. **環境問題可能性：** PR 沒有 exact-head CI，不等於產品壞掉；因此缺 receipt 只阻止合併/CLEAN，不升級 severity。
4. **已有功能可能解決：** caller UUID 格式驗證、cookie、HMAC 都已存在，但沒有任何一項證明 caller 是該 UUID owner，故不能推翻 VA-16-1。
5. **需求不明：** 安全跨裝置 recovery 的 owner-approved journey 尚未核定；不能把完整 account system 包裝成 #14 的必要修復。
6. **錯誤根因檢查：** empty evidence 與 unknown article 都是 validation contract 分歧；不用新資料庫或 evidence graph。
7. **產品規模：** 私人單人練習工具不需要 enterprise IAM、社群或多租戶；Notebook/阿摩廣度是 DO NOT COPY。
8. **P0 校準反證：** 沒有正式 breach 或 production runtime；但 default 支援同網路 HTTP 且 prior mock reproduction 已證明原始資料跨 client，故既有 P0 仍合理，不另升／降。

## NOW / NEXT / LATER / DON'T

- **NOW:** 阻止 PR #16 以 caller UUID mint owner credential；修正 invalid-token typed recovery；加入四個直接反例（victim UUID、rotated secret、first bootstrap、peer read/write denial）。
- **NEXT:** 修 PR #18 的 normalized-empty span 與 unknown article provenance；取得 exact-head unit + HTTP/SQLite + browser receipts。
- **LATER:** 只在 owner 核定跨裝置需求後，做一次性 recovery capability 的窄實驗，定義 BUILD/NARROW/REJECT。
- **DON'T:** 不新增 OAuth/IAM、帳號平台、通用 evidence framework、社群／排行／商城、AI 代寫或跨產品基礎設施。

## Verification and CLEAN state

- `EXECUTED_REPRODUCTION`: prior #14 extracted-handler mock at product baseline only；不是 real HTTP/SQLite/production。
- `SOURCE_CONFIRMED`: 本輪 5 項 candidate findings at exact PR heads。
- `NEEDS_RUNTIME_VERIFICATION`: real HTTP cookie/header path、SQLite persistence/migration、secret rotation、mobile/browser/AT、CSV/PDF/print、deployment。
- PR 合併、diff 合理、本機測試文字或單一綠燈都不構成 `VERIFIED_FIXED`。
- Fixed A01–J05 audit 尚未完成全部停止條件的兩個合格輪次，且必要 runtime 未補；因此 **Portfolio NOT CLEAN, 0/2**。

## Round accounting

- New actionable evidence findings: 5
- Existing P0 kept open / remediation blocked: 1
- P2 candidate blockers: 4
- New issues: 0
- Updated issues/comments: 0
- Reopened issues: 0
- Deduplicated/mapped: 5/5
- `SKIPPED_LOCKED`: PR #16, #17, #18 and related #14/#15/#6
- Verified fixed: 0
- Product implementation changes: 0
- Report write: pending at authoring time
- Remaining cursor: continue fair rotation after `voice-actress`; do not treat this audit-only report as product change.
