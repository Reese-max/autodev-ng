# 外部競品／新品／工作流靈感雷達 — 2026-09-23T23:59:34Z

## Status / scope / evidence boundary

- 狀態：**COMPLETE / NO_MATERIAL_NEW_SIGNAL / ZERO_NEW_ISSUE**。
- 主要市場情報來源為 Reese-max GitHub 之外的公開網路；GitHub 僅用於 owner inventory、目前產品真值、owner 核定方向、去重、active ownership 與本報告持久化。
- Issue Quality v2：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`，blob SHA **`8167e10798071d2276addaff6b201c6b0e904a2a`**。
- Fresh connected-owner inventory 已完整分頁至空頁：**42 Reese-max-owned repositories / 41 unarchived / 1 archived**；`obsidian-vault` archived，排除。
- 上一輪公平輪巡 cursor 指向 `Reese-max/exam-archive`。本輪先做 applicability check；它不是單純內容倉庫，而是有搜尋、年份／科目切換、書籤、列印與練習模式的可用產品 surface，因此保留為本輪 focal product。
- Focal default branch：**`main@5d74726eed8f507bb9527aff2047945c6de10d79`**。該 commit 只新增 50-persona audit；目前產品 `index.html` 沒有新的 default-branch product drift。
- Owner-approved direction 仍是 **SIMPLIFY / MAINTAIN**：先解決 #3 練習模式 accessibility、#1 truthful repository/source contract 與 sibling canonical ownership，再決定 specialist archive 是否持續獨立維護。明確不擴成 AI tutor、帳號／同步、分析平台、社群、native app、教師 LMS 或另一個大題庫平台。
- Active ownership：#1 相關 PR #2 / #5 仍 open；#3 相關 PR #6 仍 open，舊 PR #4 亦尚未關閉。相關 scope 全部 `SKIPPED_LOCKED`，本輪不留言、不重寫 scope、不取得 Issue lease。
- 本輪沒有執行真人 screen-reader、production interaction、行動裝置、真實網路效能或正式資料寫入；未實跑路徑不冒充已驗證。
- 本雷達不宣告 portfolio CLEAN。

## Executive decision

本輪沒有發現足以改變 `exam-archive` 方向、優先級或立案結論的新競品策略變化。

最有價值的新外部細節來自臺灣警察考試題庫／補教 archive 的 **source-currentness / correction-state 可見性**：高見公職目前的警察考古題頁面會在條目旁直接標示「官方原頁彙整」、「申論題未提供官方解答」、「已採更正答案」及「來源核對」日期；考選部官方 115 年警察考試查詢頁也明確區分答案與更正答案。這個產品模式能減少考生在「這份答案是不是官方、是否已更正、何時核過」之間來回跨站比對。

但這**不是新 root cause**。現有 Product Board 已在 E39 記錄「核對更正答案時來源鏈未知」的 friction，#1 也已涵蓋 truthful repository/product contract、data provenance 與 sibling canonical source decision；同時 PR #2 / #5 正在 active scope。因此本輪只把外部訊號記成 #1 的 supporting evidence，不新增 `[FEATURE]`、`[Research]` 或 `[Competitive Inspiration]` Issue，也不把競品功能存在誤當成本產品 P2/P1 缺陷。

若 #1 最後決定繼續保留這個 specialist surface，最小可取方向不是建立 provenance registry、資料庫或 ingestion service，而是從 canonical corpus 或小型靜態／生成 metadata 顯示：`covered_through`、`source_authority`、`source_checked_at`、`answer_status=original|corrected|none`。只有 canonical source 選定後，才有必要決定這些欄位如何產製。

四道 Gate 後：**0 新 Issue、0 existing Issue/PR comment 或 scope 修改、0 implementation authorization**。

# Product → market category mapping

`Reese-max/exam-archive` 本輪對照：

- **Official authority / direct substitute:** 考選部考畢試題查詢平台；
- **Direct Taiwan secondary archive:** 高見公職警察考古題、TKB 百官網歷屆試題；
- **Broader secondary archive:** 阿摩；
- **Adjacent archive workflow:** PapersDaddy 等 no-login / current-coverage past-paper archive；
- **Portfolio substitute:** `Reese-max/police-exam-practice` 與 `Reese-max/police-exam-archive`，只用 GitHub 核對 canonical ownership，不當作本輪主要市場情報來源。

# External Signals

## A. 高見公職：把「來源核對／更正答案」直接暴露在 archive UI

**Status:** `CONFIRMED_CURRENT_VENDOR_SIGNAL`  
**Checked:** 2026-09-24 Asia/Taipei  
**Source:** https://www.kaozen.taipei/police-exam-past-papers/

目前警察考古題頁面涵蓋 115 年，且在部分考試／科目條目旁明確呈現：

- 官方原頁彙整；
- 申論題未提供官方解答；
- 已採更正答案；
- 來源核對日期（頁面目前可見 `2026/9/8`）。

### 使用者工作 / 減少的人工步驟

這不是單純「有更多題」。它降低的是考生從 secondary archive 看到答案後，再回考選部逐題確認「是否官方、是否有更正、這份資料最後何時核過」的手工比對成本。

### 可移植部分

對 `exam-archive` 可移植的是 **visible provenance receipt**：讓使用者知道資料涵蓋到哪一年、來源是什麼、何時核過、選擇題答案是否已採官方更正。

### 不應照抄部分

- 補教導流、會員／課程 entitlement；
- 為了 parity 建 CMS／後端；
- 把 secondary-vendor copy 當新的 authority；
- 再手工複製一份 115 題庫到本 repo，延續多份 truth 漂移。

### Gate

這個 friction 已被 Product Board E39 與 #1 的 provenance/canonical contract 涵蓋。`#1 + PR #2/#5` active，因此 **DEDUPE + SKIPPED_LOCKED**。

## B. 考選部：115 年警察資訊管理試題仍是 authoritative current source，答案更正是正式狀態

**Status:** `CONFIRMED_OFFICIAL_AUTHORITY`  
**Checked:** 2026-09-24 Asia/Taipei  
**Source:** https://wwwq.moex.gov.tw/exam/wFrmExamQandASearch.aspx?e=115060&y=2026

官方查詢目前列出三等「警察資訊管理人員」及 `電腦犯罪偵查`、`數位鑑識執法`、`警政資訊管理與應用` 等科目。頁面也把「答案」與「更正答案」視為可區分的正式資料狀態。

這再次確認 `exam-archive` 的 105–114 coverage 已不是最新考畢年度，但「缺 115」在前輪已被判定為 **canonical ownership / maintenance decision**，不是一張新的 feature gap。若 specialist surface 保留，應從 authoritative/canonical corpus 產生 freshness/correction metadata，而不是人工 patch 第二份巨大 HTML。

## C. TKB / PapersDaddy：current coverage + visible freshness 可以存在於低摩擦 archive，不必先變 SaaS

**Status:** `CONFIRMED_CURRENT_PRODUCT_CLAIM / ADJACENT WORKFLOW`  
**Checked:** 2026-09-24 Asia/Taipei

Sources:

- TKB 百官網歷屆試題：https://byone.tkb.com.tw/downloads/index
- PapersDaddy Cambridge：https://www.papersdaddy.com/cambridge
- PapersDaddy AQA Computer Science：https://www.papersdaddy.com/aqa/a-level/computer-science-7516

TKB 目前的考試 archive 已列 115 年警察／一般警察等考試；PapersDaddy 仍維持 free / no-sign-up 型 past-paper access，並在特定 archive 顯示 reviewed date、coming-soon coverage、mark scheme / examiner report 等 freshness/context 資訊。

這些是 vendor claims，不是採用率或學習成效證據。但它們支持一個反向決策：**低摩擦、免登入 archive 與明確 freshness/provenance 可以同時存在**，不需要先做帳號、同步、analytics 或 native app。

## D. 新工具／技術訊號

本輪沒有找到一個 30–90 天內的新工具／技術變化，能以足夠證據改變 `exam-archive` 的最小產品方案。沒有為了湊 A/B/C 固定數量而把 OCR、RAG、AI tutor、browser agent 或新向量資料庫硬塞成機會。

# New Releases / strategy changes

- **沒有新的重大 direct-competitor release 通過通知門檻。**
- 115 年試題、secondary archive 已收錄 115、以及 no-login/offline archive 模式都不是本輪才出現的新 root cause。
- 本輪真正新增的細節只是高見公職對 `source_checked_at / corrected answer` 的 visible receipt；它補強既有 #1，而不是改變方向。

# Community Pain

本輪沒有用 Reddit／論壇單則抱怨推估需求量、失敗率或 severity，也沒有真人資料證明 `exam-archive` 使用者因缺 AI tutor、帳號同步、native app 或 115 年內嵌資料而遭遇新的 P2 級核心任務失敗。

目前可確認的產品品質問題仍是既有 #1 / #3；active PR 的存在不等於已修好，亦不因本輪沒有新 finding 就宣告 CLEAN。

# Adjacent Ideas

## 1. Visible coverage / source / correction receipt

若 #1 最後選擇保留本 surface，可在 UI 或 generated metadata 顯示：

`covered_through + source_authority + source_checked_at + answer_status`

最小優先順序：

1. **不改程式**：先在 truthful README / static copy 說清楚 coverage、authority 與 canonical source；
2. **重用既有 corpus**：若 sibling canonical source 已能提供 version/source metadata，直接生成；
3. **局部 metadata**：真的缺資料時才新增小型靜態欄位；
4. **不要先做** registry、DB、sync service、admin upload pipeline。

## 2. Correction state 要跟 exact source snapshot，而不是只改一個顯示值

考選部存在「答案 → 更正答案」狀態，代表 provenance 不是裝飾。若未來保留 practice answer key，最小 truth contract 應能回答「這個答案對應哪個官方來源／更正狀態」。但目前 canonical source 還在 #1 決策中，先解 ownership，再決定資料形狀；不另建 framework。

# Opportunity Map — `exam-archive`

| Bucket | Current decision |
|---|---|
| **MUST MATCH** | #3 keyboard / assistive-tech practice operability；#1 truthful product/source contract；current deployment truth |
| **SHOULD BE BETTER** | 保留 no-login、local-first、窄警察資管 lookup；若 surface 保留，讓 coverage / source / correction freshness 比 generic archive 更清楚 |
| **DIFFERENTIATOR** | 105–114 警察三等資管 specialist search / anchors / print / lightweight practice，前提是 canonical ownership 明確且維護成本合理 |
| **ADJACENT IDEA** | 從 canonical corpus 生成 `source_checked_at`、`answer_status`、coverage receipt |
| **DO NOT COPY** | AI tutor、帳號／cloud sync、社群／排行榜、老師後台、native app 只為 parity、OCR/request backend、第二套手工 corpus |

# Four-Gate decision

## Candidate 1 — 新開「來源核對／更正答案 provenance」Issue

1. **問題／價值：** 外部 archive 顯示 visible provenance 能減少跨站核對；repo Product Board 也已記錄 E39 correction-source friction。
2. **優先級：** 不是新缺陷；目前 root cause 已在 #1 的 truthful source/canonical contract。競品做得更清楚不會自動把 severity 升成 P1/P2。
3. **最小方案：** 先完成 canonical-source decision，再以 README/static/generated metadata 說明；不先做 registry / DB。
4. **研究／實作分離：** #1 相關 PR #2 / #5 active，不能搶 scope；新 external evidence 只留 report。

**Result:** `DEDUPE / SKIPPED_LOCKED / NO_NEW_ISSUE`。

## Candidate 2 — 直接把 115 年試題加入 `index.html`

1. **問題／價值：** 115 已正式可查，但 freshness gap 是前輪已知。
2. **優先級：** `MAINTENANCE / NOT_ESTABLISHED as new severity`；不因官方已出 115 就另升級。
3. **最小方案：** visible coverage + redirect/reuse canonical sibling 比第二次人工嵌入更小、更不易漂移。
4. **去重：** #1 已涵蓋 source-of-truth decision。

**Result:** `REJECT_AS_DUPLICATE`。

## Candidate 3 — 因 archive 競品更廣而新增 AI / 帳號 / app

1. **問題／價值：** 沒有 repo/user evidence 顯示缺這些是目前核心人工斷點。
2. **優先級：** `kind=OPPORTUNITY`, `severity=NOT_ESTABLISHED`, `decision_priority=LOW`, `triage=DEFERRED`, `auto_implementation=false`。
3. **最小方案：** 不改；先完成 #1/#3。
4. **方向：** owner 已明確拒絕 generic learning-platform expansion。

**Result:** `REJECT_FOR_CURRENT_SCOPE`。

# Cross-portfolio ideas

沒有新的跨 portfolio 共用能力通過 Gate。

可保留的一般原則仍是：**使用者看到的「來源／版本／更正狀態」應能追到 authoritative snapshot，但不要先因為多 repo 都可能需要 provenance 就建立中央 ledger/framework。** 只有在多個已核定 consumer、重複維護成本與 schema 共通性都被實證後，才值得跨 repo 抽象。

# Rejected Ideas

- 再手工把 115 題目／答案複製進 `exam-archive`：會延續第二份 truth 漂移。
- 因競品顯示「來源核對」就建 provenance database／registry：現階段 static/generated metadata 已足以回答使用者工作。
- 因 PapersDaddy 有 coming-soon / examiner reports 就擴成廣泛內容平台：超出 specialist scope。
- 因 TKB / 阿摩涵蓋更多考試就加帳號、課程、社群、分析：沒有價值證據，與 SIMPLIFY / MAINTAIN 相反。
- 因 PR #6 有自動化 AX/e2e 證據就把 #3 視為已解：PR 仍 open，且 PR 自己明示缺真人 desktop screen-reader smoke。
- 因 #1 已有 README / budget PR 就宣稱 product contract 完成：PR #2 最新 self-review 仍指出 README 與真實互動產品不一致，#1 保持 open。

# Issue Mapping / coordination

| Signal / fingerprint | Existing mapping | Decision |
|---|---|---|
| source / canonical ownership / coverage truth / correction provenance | #1 + PR #2 / #5 | supporting evidence only；`SKIPPED_LOCKED` |
| practice keyboard / AT operability | #3 + PR #6（舊 PR #4 仍 open） | active remediation；`SKIPPED_LOCKED`，不以 report 改 scope |
| latest 115 papers | #1 / prior radar | duplicate maintenance signal；no new Issue |
| account / AI tutor / native app / broad LMS | no Issue | owner-rejected current direction；no Issue |

本輪沒有修改 existing Issue / PR comment / shared tracking state，因此沒有建立新的 `github-issue-lock:v1` marker。所有既有 comments 均已完整核對至目前可取得頁面；沒有未釋放的有效 lease，但 open PR 已構成 active ownership，仍不搶 scope。

# Sources

公開網路（主要市場情報來源；查閱日均為 2026-09-24 Asia/Taipei）：

1. 考選部，115 年公務人員特種考試警察人員／一般警察人員考畢試題查詢  
   https://wwwq.moex.gov.tw/exam/wFrmExamQandASearch.aspx?e=115060&y=2026  
   Classification: `CONFIRMED OFFICIAL AUTHORITY`。
2. 高見公職，警察考試歷屆試題  
   https://www.kaozen.taipei/police-exam-past-papers/  
   Classification: `CONFIRMED CURRENT VENDOR SIGNAL`; product claim，不是獨立成效／採用率測量。
3. 高見公職，115 年警察考試考古題／答案相關頁  
   https://www.kaozen.taipei/41055/police-exam-2026-past-papers/  
   Classification: `CONFIRMED VENDOR CONTENT SIGNAL`。
4. TKB 百官網，歷屆試題下載  
   https://byone.tkb.com.tw/downloads/index  
   Classification: `CONFIRMED CURRENT VENDOR SIGNAL`。
5. PapersDaddy, Cambridge past papers  
   https://www.papersdaddy.com/cambridge  
   Classification: `CONFIRMED CURRENT PRODUCT CLAIM`。
6. PapersDaddy, AQA Computer Science archive  
   https://www.papersdaddy.com/aqa/a-level/computer-science-7516  
   Classification: `CONFIRMED CURRENT PRODUCT CLAIM`; page currently exposes reviewed/current-coverage context。

Internal GitHub evidence used only for direction / current truth / dedupe / coordination:

- `autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md` @ blob `8167e10798071d2276addaff6b201c6b0e904a2a`。
- `exam-archive/.github/quality-audits/2026-09-09-2244-product-board-audit.md`。
- `exam-archive/docs/audits/50-persona-round-2-2026-09-10.md`。
- `autodev-ng/docs/competitive-intelligence/2026-09-18T140128Z-external-radar.md`。
- Issues #1 / #3 full accessible comment histories；open PRs #2 / #4 / #5 / #6。

# What Changed

相對 2026-09-18 的 `exam-archive` radar：

- **Product main:** no product drift；仍 `main@5d74726eed8f507bb9527aff2047945c6de10d79`。
- **External evidence:** 新增高見公職「官方原頁彙整／來源核對日期／已採更正答案」這個 visible-provenance product pattern，並重新核對 MOEX 115 official correction-state。
- **Decision:** 不改方向；新訊號只補強 #1 的 source/canonical truth contract。
- **New Issues:** 0。
- **Existing Issue / PR comments or scope changes:** 0。
- **Implementation authorization:** 0。
- **Product code / CI / config / secrets / permissions / settings / implementation branch / merge / deploy / worker / GOAL / paid call / production data changes:** 0。
- **Runtime evidence added:** 0。

# Classification / scope calibration

- `source/currentness visible receipt`：`OPPORTUNITY_CONTEXT`, `severity=NOT_ESTABLISHED`, `decision_priority=LOW_TO_MEDIUM`, `triage=DEFERRED_TO_EXISTING_#1`, `auto_implementation=false`。
- `115 coverage freshness`：既有 maintenance/canonical-decision context；不建立新的 severity。
- #1 / #3 的 P2 級別不因本輪競品訊號上調或下調；active PR 也不等於已完成。

# Completion / gaps / cursor

- Fresh owner inventory pagination：**COMPLETE — 42 owned / 41 unarchived / 1 archived; page 2 empty**。
- Rule blob verification：**COMPLETE — `8167e10798071d2276addaff6b201c6b0e904a2a`**。
- Focal applicability / owner direction / default HEAD / open Issues / all open PRs / accessible full Issue comments：**COMPLETE enough for decision**。
- Public-web exploration：**COMPLETE enough for decision** — official authority + direct Taiwan secondary archives + adjacent no-login archive pattern；未為類別配額硬湊弱訊號。
- Issue writes：**0**。
- Product runtime verification：**NOT RUN / NEEDS_RUNTIME_VERIFICATION where applicable**。
- Notification gate：**NO** — 沒有高價值 net-new opportunity、重大競品策略變化、已證明跨專案共用能力或推翻既有方向的新證據。
- Fair rotation：`exam-archive` processed。**Next cursor: `Reese-max/flux-image-gen`**。
