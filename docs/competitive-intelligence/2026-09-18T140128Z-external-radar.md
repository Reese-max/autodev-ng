# 外部競品／新品／工作流靈感雷達 — 2026-09-18T14:01:28Z

Status: **COMPLETE / NO_MATERIAL_NEW_SIGNAL**

## Scope / Direction Check

- Issue Quality 規則：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`；本輪重新讀取確認 blob SHA 為 `8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh connected owner inventory：**41 Reese-max-owned repositories / 40 unarchived**；`obsidian-vault` 為 archived，排除。沒有以舊 inventory 當全集。
- Fair-rotation primary repo：`Reese-max/exam-archive`；下一個公平輪巡 cursor：**`Reese-max/flux-image-gen`**。
- Current default branch 在寫入前重新核對：`main@5d74726eed8f507bb9527aff2047945c6de10d79`（2026-09-10 audit-only commit），未見 default-branch product drift。
- Owner-approved direction 仍由 2026-09-09 Product Board 與目前 audit 界定為 **SIMPLIFY / MAINTAIN**：先完成 practice accessibility、truthful repository/product contract 與 sibling canonical ownership，再判斷是否值得維護 specialist surface；不要在這個 repo 增加 generic AI tutor、帳號、分析平台、社群、LMS 或另一個大型題庫系統。
- 既有 #1（monolith / repository contract / canonical relationship）與 #3（practice keyboard/AT）仍是目前根因追蹤。Open PR #2/#5 正在處理 #1 的文件／budget 子範圍；PR #4/#6 正在處理 #3，其中 PR #6 已有 deterministic browser/AX tests，但仍明示缺真人 screen-reader smoke。這些 scope 均未被本輪搶改。
- 本輪只寫中央 radar report：**0 new Issues、0 Issue edits/comments、0 PR comments、0 implementation authorization**。未改產品 code、CI/config、secrets、permissions/settings，未建立實作 branch、merge/deploy、啟動 worker/GOAL、付費或外部 production write。
- 不宣告 portfolio CLEAN；未執行真人 AT、真實裝置、production runtime 或學習成效驗證。

## Product → Market Category

1. Taiwan police / civil-service past-paper archive：考選部考畢試題平台、阿摩等 secondary archive。
2. No-login / offline past-paper library：JAMB Pro、PapersDaddy。
3. Structured archive / offline retrieval：PPAPS 等相鄰 past-paper systems。
4. Interactive exam-prep platforms：僅作相鄰 workflow 參考，不作本 repo 擴張理由。

外部產品存在本身不構成 feature requirement。

## External Signals

### A. CONFIRMED — 考選部 115 年警察資訊管理試題仍已正式可查，沒有新的 root cause

**事件年度：2026；查閱：2026-09-18。**

Source: https://wwwq.moex.gov.tw/exam/wFrmExamQandASearch.aspx?e=115060&y=2026

考選部第一方考畢試題平台目前仍列出三等「警察資訊管理人員」及其 `電腦犯罪偵查`、`數位鑑識執法`、`警政資訊管理與應用` 等科目。這再次確認 `exam-archive` 的 105–114 specialist corpus 不是最新已考年度，但這一事實已在 2026-09-16 radar 被分析並映射到既有 #1 的 canonical ownership / source contract；本輪沒有新事件推翻原決策。

**可移植原則：**如果 surface 保留，latest covered year 與 authority 應可見；但優先重用 sibling structured corpus 或 redirect，而不是把 115 再手工複製進第二份巨大 HTML。

### B. COMMUNITY_SIGNAL — 阿摩仍把 115 年放在警政資訊管理試卷列表最前方

**查閱：2026-09-18。**

Source: https://yamol.tw/cat-%E8%AD%A6%E6%94%BF%E8%B3%87%E8%A8%8A%E7%AE%A1%E7%90%86%E8%88%87%E6%87%89%E7%94%A8-1858.htm

阿摩目前顯示 115 年三等警察資訊管理人員「警政資訊管理與應用」試卷，且排在 114 年之前。這只證明 secondary distribution 已把最新年度放到使用者入口，不是答案 authority、使用率或品質證據。該 freshness signal 也已在前輪出現，因此不重複立案。

### C. CURRENT_VENDOR_SIGNAL — no-login past-paper archive 仍是可行產品模式，不需要因競品擴張帳號／雲端

**查閱：2026-09-18；頁面未提供可核對的產品發布日。**

Sources:
- https://jambproapp.com/
- https://www.papersdaddy.com/

JAMB Pro 目前主打 free / no-sign-up / offline practice；PapersDaddy 的免費 archive 也明示不需登入即可查看或下載 past papers。這些是 vendor claims，不是獨立成效研究；但它們提供一項有用的反向市場訊號：**exam archive 不必先變成 account-backed SaaS 才有產品價值**。

對 `exam-archive` 的可移植部分是保留低摩擦、免登入、可攜／可離線的 specialist access；不應照抄廣泛題庫、AI 解題、付費層、排行榜或跨裝置帳號同步。

### D. ADJACENT IDEA — structured/indexed corpus 與 presentation surface 分離是常見 archive 模式，但不構成新 framework 需求

**代表版本：PPAPS v1.2.0，2026-05-22；查閱：2026-09-18。**

Source: https://ppaps.vercel.app/

PPAPS 把 past papers 依系所／課程／學期／年度索引，支援 offline cache、OCR 與缺卷 request pipeline。這是變動較慢領域的代表模式。對本 repo 真正可移植的只有「內容 corpus 與瀏覽 surface 分離、按需要取得」；這已被 #1 的 split/build/canonical-source 根因涵蓋。

**Do not copy:** student account、管理者上傳、OCR backend、missing-paper request service 都沒有目前 Reese-max 使用者／維護證據，也會增加權限與運維負擔。

## New Releases / Changes

- 本輪沒有找到會改變 `exam-archive` 方向的 30–90 天 direct-competitor release。
- 115 年官方 police-IT papers 與 secondary distribution 仍是前輪已知狀態，沒有新 source event。
- PPAPS 2026-05-22 release 僅作較慢市場的代表 workflow，不作「新功能必做」依據。
- Current no-login/offline exam archives 持續證明簡單 specialist surface 仍有合理產品形態；這支持現有 SIMPLIFY / MAINTAIN，而不是擴張。

## Community Pain

本輪沒有把 Reddit／論壇單則抱怨提升成 prevalence 或 severity 證據，也沒有真人資料證明 `exam-archive` 使用者因缺 115、缺帳號、缺 AI 解題或缺 native app 而出現顯著任務失敗。

可驗證的 current-main 問題仍是既有 #1/#3，而不是新的市場假設。

## Adjacent Ideas

1. **Visible coverage receipt**：若 specialist surface 保留，直接顯示 covered years / source authority / last corpus refresh；先以靜態 copy 或生成 metadata 解決，不建 registry。
2. **Thin view over canonical corpus**：若 #1 決定保留此 UX，優先由 sibling structured source 產製／讀取，不維護第二份題目真值。
3. **Offline subset/download**：只有在 real-device / slow-network evidence 顯示 1.35 MB monolith 的實際成本後再評估；競品有 offline download 不等於本產品現在需要 app/cache framework。

## Opportunity Map — `exam-archive`

| Bucket | Decision | Evidence / reason |
|---|---|---|
| MUST MATCH | Practice keyboard / AT operability | Existing #3 + active PR #6；不重複開單，不以 headless AX tree 冒充真人 screen-reader smoke。 |
| MUST MATCH | Truthful coverage / source-of-truth relationship | Existing #1 + 115 first-party availability；先 canonical decision，不複製第三份 corpus。 |
| SHOULD BE BETTER | 保留 no-login、窄領域、低摩擦 archive 體驗 | Current external archive products仍採 no-sign-up/offline；符合 owner direction。 |
| DIFFERENTIATOR | 警察三等資管 specialist lookup / anchors / print / lightweight practice（若證明仍有獨立價值） | 不需要 broad LMS 或 AI layer。 |
| ADJACENT IDEA | 從 canonical corpus 生成／按需載入 specialist view | 已屬 #1 可選最小路徑，非新 architecture mandate。 |
| DO NOT COPY | AI tutoring、帳號同步、管理者上傳/request service、社群／排行榜、native app 只為 parity | 無 current user-value evidence，增加成本、權限與維護。 |

## Four-Gate Decision

### Candidate 1 — 再開一張「新增 115 年題目」Feature

- **Gate 1:** 使用者 freshness friction 真實存在，但 first-party 115 availability 已是已知訊號；owner portfolio 又已有更完整 sibling corpus。
- **Gate 2:** 新 severity 不成立；屬既有 canonical ownership / maintenance decision。
- **Gate 3:** redirect / visible coverage / reuse sibling corpus 都比再建 ingestion pipeline 小。
- **Gate 4:** 已被 #1 + previous radar 去重。

**Result: REJECT_AS_DUPLICATE.**

### Candidate 2 — 為 archive 加 account/cloud sync / AI solutions / request workflow

- 競品有這些能力，但 current target product 的 core job 可以在 no-login static model 完成。
- 沒有真人證據顯示缺這些能力造成 P2 級完成率／恢復性影響。
- 更小方案是不改；先完成 #1/#3。

**Classification:** `OPPORTUNITY / NOT_ESTABLISHED / decision_priority=LOW / DEFERRED / auto_implementation=false`。

**Result: NO ISSUE.**

### Candidate 3 — 把 monolith 拆成 structured/indexed corpus

這不是新的 competitive finding：#1 已直接追蹤 split/build/source contract，且 PR #2/#5 正在 active scope。新外部案例只補強既有方向，不建立獨立根因。

**Result: DEDUPE + SKIPPED_LOCKED_ACTIVE_PR.**

## Cross-portfolio Ideas

沒有新的 cross-portfolio capability 通過立案門檻。既有原則仍是：**一份 authoritative corpus 可以支援多個薄 presentation surfaces，但不要為了共享而先建立中央平台；先證明重複維護成本與實際 consumer。**

## Rejected Ideas

- 直接把 115 年資料再次手工嵌入 `exam-archive`：會延續第二份 truth 漂移，且前輪已證明 sibling corpus 更完整。
- 因 JAMB Pro / PapersDaddy 有 offline 產品就做 native app：現行 static/local-first 已具有部分離線／可攜優勢，沒有 app necessity evidence。
- 因 PPAPS 有 OCR/request pipeline 就建後端：無 upload/admin/request job 證據。
- 加 AI 解題／自動詳解：會把 archive 擴成另一個 learning platform；owner direction 明確反對。
- 因 PR #6 有 headless AX evidence 就關 #3：仍缺要求中的真人 desktop screen-reader smoke，不能把自動化替代未執行路徑。

## Issue Mapping / Coordination

- #1 — canonical contract / monolith / source boundary：外部 freshness + structured-archive pattern 均屬同 root cause。PR #2/#5 active；**no comment / no scope rewrite**。
- #3 — pointer-only practice：PR #6 active，已有較完整 semantic radio + browser/AX automation，但 manual screen-reader runtime still pending；**no comment / no scope rewrite**。
- No other fingerprint crossed Issue gate.

Writes: **0 new Issues / 0 Issue updates / 0 PR comments / 0 implementation authorization**。

## Sources

External public web sources（本輪市場／產品判斷的主要情報來源）：

1. 考選部考畢試題查詢平台，115 年警察人員等特考 — checked 2026-09-18 — https://wwwq.moex.gov.tw/exam/wFrmExamQandASearch.aspx?e=115060&y=2026 — `CONFIRMED` first-party authority.
2. 阿摩「警政資訊管理與應用」試卷列表 — checked 2026-09-18 — https://yamol.tw/cat-%E8%AD%A6%E6%94%BF%E8%B3%87%E8%A8%8A%E7%AE%A1%E7%90%86%E8%88%87%E6%87%89%E7%94%A8-1858.htm — `COMMUNITY_SIGNAL`, not answer authority.
3. JAMB Pro current product page — checked 2026-09-18 — https://jambproapp.com/ — `CURRENT_VENDOR_SIGNAL` for no-sign-up/offline past-paper workflow; not efficacy evidence.
4. PapersDaddy current product page — checked 2026-09-18 — https://www.papersdaddy.com/ — `CURRENT_VENDOR_SIGNAL` for no-sign-up archive / optional paid layer; not independent quality evidence.
5. PPAPS v1.2.0 — release 2026-05-22; checked 2026-09-18 — https://ppaps.vercel.app/ — `CONFIRMED_VENDOR_RELEASE`, used only as slower-moving structured-archive workflow reference.

Internal GitHub evidence used only for owner direction, current product truth, dedupe and coordination:

- `autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md` @ blob `8167e10798071d2276addaff6b201c6b0e904a2a`.
- `autodev-ng/docs/competitive-intelligence/2026-09-16T180108Z-external-radar.md` — previous deep `exam-archive` radar.
- `autodev-ng/docs/competitive-intelligence/2026-09-18T120320Z-external-radar.md` — cursor handoff from `cyber-prep-coach`.
- `exam-archive main@5d74726eed8f507bb9527aff2047945c6de10d79`.
- `exam-archive/.github/quality-audits/2026-09-09-2244-product-board-audit.md`, `docs/audits/50-persona-round-2-2026-09-10.md`.
- Existing Issues #1/#3 and open PRs #2/#4/#5/#6.

## What Changed

1. Fresh public-web recheck found **no new direct-competitor or official event** that changes the 2026-09-16 `exam-archive` decision.
2. Current external archive products continue to validate a low-friction no-login/offline pattern; this is a **direction reinforcement**, not a feature mandate.
3. The current 115-year freshness gap is still real but remains deduped into #1 / canonical corpus ownership; no reason emerged to build a second ingestion pipeline.
4. Active PR #6 has stronger bounded accessibility verification than older PR #4, but default branch is unchanged and required manual screen-reader evidence is still absent. This is progress in an existing scope, not a new radar Issue.
5. No external evidence overturned **SIMPLIFY / MAINTAIN**.

## Classification / Scope Calibration

- New actionable Bugs: **0**.
- New P0/P1/P2 findings: **0**.
- New Issues: **0**.
- Existing fingerprints reinforced without scope rewrite: **2** (#1, #3).
- Rejected / deduped feature candidates: latest-year duplicate ingestion; account/cloud sync; AI tutor/solutions; backend request pipeline; native app parity.
- Runtime gap preserved: screen-reader / real-device evidence remains required where applicable; no false runtime claim.

## Completion / Gaps / Cursor

- Public-web exploration completed with first-party authority plus current direct/adjacent product signals.
- Fresh owner repository inventory checked; current target HEAD rechecked immediately before report write and unchanged.
- No Issue write was necessary, so no Issue lease was acquired or contested.
- No current product/runtime execution was performed; no performance, adoption, learning-outcome or accessibility prevalence claims are made.
- **Next fair-rotation cursor: `Reese-max/flux-image-gen`.**
