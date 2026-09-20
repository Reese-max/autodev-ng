# External Competitive Radar — 2026-09-20T10:08:00Z

Status: **COMPLETE**

查閱日：2026-09-20。主要市場情報來自 GitHub 之外的 Workforce.com、Deputy 等第一方公開產品／支援文件；GitHub 僅用於 Reese-max 自有 repository inventory、owner 方向、default-branch 現況、Issue/PR 去重與報告／Issue 寫入。

## Scope / Direction Check

- Governing rule：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`
- Fresh connected owner inventory：完整分頁列舉 **42 個 Reese-max-owned repositories / 41 個未封存**；offset 100 再查為空。唯一 archived repo 為 `obsidian-vault`。
- Fair-rotation focal repository：`Reese-max/92-duty-scheduler`，承接上一輪 `2026-09-20T075859Z-external-radar.md` 的 cursor。
- Current default HEAD：`main@4d7d7d4911ffd580630661a2f71079a2c38c6ae1`；寫入 Issue 前後重新核對未變。
- Owner direction：**INVEST，但先修 calendar truth / authorization / CI execution，再擴功能**。核心 moat 為學校／軍警勤務規則、空堂匯入、可解釋修復、Excel/LINE handoff、self-hosted Cloudflare/D1，而不是 payroll/chat/time clock/generic HR。
- Current audit：Round 4 仍 `NOT CLEAN`；#14 P0 authorization、#21 P2 week-start truth、#29 P2 CI execution 等既有 blocker 不因本 radar 改變。
- Active scopes：#19/PR #28 RepairPlan、#20/PR #27 PolicySpec research、#22/PR #26 + PR #34 Duty Inbox、#14/PR #17、#15/PR #16、#29/PR #30、#31/PR #32 等皆有 active work。本輪不搶改它們。
- 本輪未修改產品原始碼、CI/config、secret、permissions/settings，未建立 implementation branch、merge/deploy、啟動 worker/GOAL、付費服務或正式資料寫入。

## Product → Market Category

`92-duty-scheduler` 現行產品屬於：

1. 校園／軍警／小型單位的 deterministic duty scheduling；
2. roster/free-period/exclusion → one-click schedule → manual review/repair → Excel/LINE/viewer/history；
3. 管理者主導、需要明確 hard constraints、fairness 與可回復修改；
4. 合理差異化是 local/self-hosted、規則可解釋、例外可核對，而不是建立完整 workforce-management SaaS。

## External Signals

### A. CONFIRMED — Workforce.com Rota Agent 把「先處理 pending availability/leave」放到 Build Step 1

**發布：2026-08-17；查閱：2026-09-20。**

Source: https://help.workforce.com/en/articles/15301502-rota-agent

Workforce.com 的 Rota Agent 在建立週班表前，第一步就顯示該週 outstanding leave / availability requests，建議先 review，再讓 agent 建 proposed rota。建表時會再考慮 approved availability、leave、events、budgets、validations；生成結果先 review，沒有 approval 不建立 shifts，publish 仍是手動。

**JTBD / workflow:** 讓「這週誰不能排」先變成明確、可核對的 schedule input，而不是等排完再發現缺漏。

**對本產品的可移植原則:** `pre-build exception truth → deterministic schedule → explicit review`。不需要複製 AI chat；真正關鍵是 exception state 與 scheduler 看見的是同一份 truth。

### A2. CONFIRMED — Workforce.com Availability Report 把 ongoing / temporary / once-off 分開

**發布：2026-07-23；查閱：2026-09-20。**

Source: https://help.workforce.com/en/articles/16053492-availability-report

Availability Report 將 availability 明確區分：
- ongoing availability；
- temporary availability；
- once-off unavailability；
並帶 approved / pending / rejected status 與 date range。

這個訊號特別值得和 `92-duty-scheduler` 現況比較：本產品 UI/SOP 用「**本週排除學員（請假/公差等）**」，但 current D1 `exclusions` persistence 只有 `(semester_id, student_id)`，未表達 week/date scope。這不是立刻證明 schema 錯誤，因為本產品也存在可能需要 semester-long 的長期排除；它建立的是一個後續應以實際使用資料回答的產品問題：**長期 baseline exclusion 與單週／日期型 exception 是否需要明確拆 scope/expiry。**

### A3. CONFIRMED — Deputy 把 availability 與 approved leave 分成不同語義

**官方文件更新：2026-07-16；查閱：2026-09-20。**

Sources:
- https://help.deputy.com/hc/en-au/articles/4614772805135-How-to-let-your-manager-know-you-re-available-or-unavailable-to-work-on-a-specific-date
- https://help.deputy.com/hc/en-au/articles/4688865765775-Viewing-time-off-in-the-schedule

Deputy 支援一次性或 recurring availability/unavailability；同時明確說明 availability 不等於需要 manager approval 的 leave。Scheduler 可顯示 leave 與 unavailability，pending leave 也有不同狀態。

**可移植原則:** 不把「不能排」全部塞成一個沒有 scope/status 的永續布林值；但 Reese-max 應先驗證自己的兩類實際資料（例如長期傷病 vs 本週請假）再決定資料模型，不因競品 taxonomy 直接重構。

## New Releases / Market Moves

| Date | Product | Signal | Confidence | Radar consequence |
|---|---|---|---|---|
| 2026-08-17 | Workforce.com Rota Agent | build 前先 review pending leave / availability；proposal approval 前不建 shift | CONFIRMED | 強化 pre-build exception truth 與 explicit review；不複製 AI rota agent |
| 2026-07-23 | Workforce.com Availability Report | ongoing / temporary / once-off + status/date range | CONFIRMED | 暫存 scope/expiry research candidate；不直接建新 schema Issue |
| 2026-07-16 | Deputy | availability/unavailability 與 leave 分流；schedule 內可見 | CONFIRMED | 支持不同 exception semantics；不證明本產品需 HR workflow |

## Community Pain

本輪**沒有把新的 Reddit / forum 訊號升級為立案證據**。近期 workforce 社群對臨時不可排、swap、group-chat 協調的抱怨已在 #22 歷史證據中出現，本輪沒有足以推翻或新增 root cause 的新社群材料；避免重複灌水。

## Repository Finding — source-confirmed P2 bug

### `Clear all exclusions` false-success state

Current default branch 有一條可直接從 source 建立因果鏈的不同 fingerprint：

1. `cf-deploy/public/app.js` 單筆刪除 exclusion 會呼叫 `API.updateExclusions(S.excluded)`。
2. 同一個 UI 的「清除全部」只做 `S.excluded.clear()`、re-render 與成功 toast，**沒有 backend sync**。
3. `cf-deploy/functions/api/exclusions.js` 的 `PUT` 才會 delete/reinsert 目前 `semester_id` 的 exclusion rows。
4. `cf-deploy/functions/api/state.js` 在 authenticated admin load 時又會從該表回傳 `excluded`。
5. 因此 backend mode 下可出現：畫面說已清除 → persisted rows 尚在 → reload 後舊 IDs 復活。

這不是外部 vendor claim，而是 current source 的 reachable state divergence。沒有 production incident / frequency 資料，所以不升 P1；但 exclusion 直接影響 candidate eligibility，而且 SOP 把請假/公差排除列為每週正式流程，false-success recovery 對高頻維護具有顯著影響，因此依 Issue Quality v2 分為：

```yaml
kind: BUG
severity: P2
decision_priority: HIGH
evidence: SOURCE_CONFIRMED
triage: NEEDS_REVIEW
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

已新建並讀回確認：`Reese-max/92-duty-scheduler#35`。

Issue: https://github.com/Reese-max/92-duty-scheduler/issues/35

### Minimum fix

只修 canonical `cf-deploy/` clear-all handler：保留 previous set → 呼叫既有 empty exclusions PUT → server acknowledgement 後再顯示 success；sync failure rollback 或清楚顯示未同步。不要把此 Bug 擴成 availability service / request DB / PolicySpec / new state machine。

Runtime 驗證僅需 isolated synthetic D1：`non-empty → clear-all → reload/state fetch → empty`，並回歸單筆 add/delete 與 local/offline mode。

## Adjacent Ideas

### 1. Scope-aware exception model — HOLD / NEEDS_EVIDENCE

產品自己的 UI / SOP 說「本週排除」，但 current D1 persistence 是 semester-scoped；同時歷史 production notes 也曾使用 exclusion 表示較長期 injury exclusion。這代表一個很可能存在的**語義混合**，但現在還不足以直接指定正確模型。

更小的研究順序：
1. 先修 #35 false-success；
2. 從 2–4 個既有 synthetic / historical workflow fixture 分辨「長期 baseline exclusion」與「單週／日期 exception」；
3. 量實際需要人工加入／移除的頻率與錯誤模式；
4. 只有確認兩種 lifecycle 真實共存且造成摩擦，才考慮 reuse 現有 week/history/request primitives 表達 scope/expiry。

不先開 `AvailabilityService`、不建 HR leave module、不做 background expiry scheduler。

### 2. #20 PolicySpec：新競品訊號支持更小的 validation-first thin slice

Workforce.com 目前把 Agent Instructions（偏好／guidance）與 Natural Language Validations（enforced rules）分開，validations 又分 blocking vs warning。這支持 #20 的核心原理「AI authoring != deterministic authority」，但也提醒研究可先窄成：**在既有 schedule/evaluator 上驗證少量 blocking/warning checks**，不必一開始就建完整 policy DB / activation framework。

因 #20 已有 active PR #27，本輪只放中央報告，不取得鎖、不改 Issue/PR scope。

### 3. #22 Duty Inbox：fresh evidence strengthens sequencing, not breadth

Rota Agent 的 Step 1 直接證明「pending availability/leave 應在 build 前被 review」是一個成熟 workflow pattern；#22 本身已記錄目前 SOP 的 `LINE 問請假 → 記姓名/學號` manual handoff，且 PR #34 已進行 Phase 0 schema/state-machine work。

本輪不另開重疊的「availability portal」Issue。若未來 #22 往 production 前進，應先確認 pre-build exception 是否能以最小方式重用現有 request/identity primitives，而不是再造第二套 request system。

## Opportunity Map — `92-duty-scheduler`

| Bucket | Decision | Evidence / reason |
|---|---|---|
| MUST MATCH | UI 成功狀態必須與 persisted exclusion truth 一致 | #35 source-confirmed clear-all divergence；直接影響 scheduling eligibility |
| MUST MATCH | schedule-defining absence/exclusion 應在 build 前可見且可核對 | Workforce Rota Agent Step 1；本 repo SOP 每週先收請假 |
| SHOULD BE BETTER | 用更小、local/self-hosted 的 exception workflow，而非完整 HR leave suite | owner direction + existing exclusion/LINE workflow |
| DIFFERENTIATOR | deterministic eligibility + exact local data + human review / undo | repo moat；比 generic AI scheduling 更適合警校勤務 |
| ADJACENT IDEA | baseline vs week/date-bounded exclusion scope/expiry | external taxonomy + current semantic mismatch；needs real usage evidence |
| ADJACENT IDEA | existing #20 validation-first blocking/warning checks | Workforce current product pattern；active PR prevents scope grab |
| DO NOT COPY | AI autonomous rota, payroll/time clock/HR suite, native mobile app, generic labor forecasting | 不符合產品規模／owner direction，增加隱私與維護面 |

## Four-Gate Calibration

### #35 — clear-all exclusion sync

**Gate 1 — Problem/value**  
Target 是每週排表管理者。SOP 明確要求每週收集請假／公差再加入排除；source 可證明 clear-all 顯示成功卻沒寫 backend，而 state reload 會從 D1 再載入 exclusion。現有單筆 delete 已有正確同步替代，因此根因清楚。

**Gate 2 — Priority**  
`BUG / P2 / decision_priority=HIGH`。P2 來自 eligibility 直接受影響與高頻維護/recovery path；沒有 production incident、資料外洩或核心服務完全不可用證據，所以不升 P1。

**Gate 3 — Minimum**  
重用既有 `API.updateExclusions()`，不改 DB schema，不依賴 #20/#22，不建新模組。更小的「只改 toast」不足，因 persisted truth 仍會錯。

**Gate 4 — Research/implementation separation**  
Bug 已有 source-confirmed因果鏈，可以形成 fix-ready candidate，但本 radar 只建立追蹤；`auto_implementation=false`，沒有啟動 worker/branch/merge/deploy。修復完成仍需 isolated D1 reload test。

### Scope/expiry candidate

```yaml
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: MEDIUM
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

此候選不立案：長期 injury exclusion 與 weekly leave 可能共存，但缺少真實使用分布、錯誤頻率與 owner 對 lifecycle 的明確決策。先修 #35，再收證據。

## Existing Issue / Priority Calibration

- #20 的歷史文字使用 `P2 Research` 與 94/100 Opportunity Score；依 Issue Quality v2，這只能代表研究／決策重要性，**不是已證實 P2 產品缺陷**。在沒有新 user/runtime evidence 前，合理解讀仍是 `RESEARCH + severity=NOT_ESTABLISHED`。PR #27 active，本輪不搶改。
- #22 同理：高 strategic fit 與 92/100 不能自動成為 severity P2，也不能授權 self-service write。#14 authorization boundary 與 active PR #34 仍是硬限制。
- #35 是不同 root cause：UI/local state vs persisted exclusion sync divergence；沒有與 #20/#22 合併。

## Cross-Portfolio Ideas

本輪沒有新的跨 portfolio framework 值得立案。可重用的一般原則只有：**任何會改變後續決策的「暫時例外」都應帶 scope/expiry/status，且 UI acknowledgement 必須對應 canonical persisted state。** 但尚沒有證據支持做成跨 repo shared service；保留為設計原則即可。

## Rejected Ideas

1. **建立完整 Availability / Leave SaaS** — REJECT：範圍遠超目前產品，且 #22 已有 request lifecycle 研究。
2. **複製 Workforce AI Rota Agent** — REJECT：本產品已有 deterministic scheduler；AI chat 不解 #35，也增加不可解釋與維護成本。
3. **立即把 exclusions schema 全部改成 date-range records** — HOLD/REJECT NOW：長期與短期 exclusion 的真實比例／流程尚未建立，先不研究假設變大型 migration。
4. **另開 pre-build leave request Issue** — REJECT AS DUPLICATIVE FOR NOW：#22 已擁有 LINE/manual exception → canonical request 的相鄰 root cause且有 active PR；新的 first-party evidence先留中央報告。
5. **改 #20/#22 active scope** — SKIPPED_LOCKED/ACTIVE-SCOPE：有 active PR/實作者，本輪不搶改。

## Issue Mapping

| Fingerprint | Result | Mapping |
|---|---|---|
| clear-all exclusion → local empty but backend unchanged → reload restores IDs | NEW actionable BUG | #35 created + read-back verified |
| weekly/temporary vs semester baseline exclusion scope | HOLD research candidate | central report only |
| policy authoring / validation / activation | existing | #20 / PR #27, no write |
| post-publish exception / swap / LINE request lifecycle | existing | #22 / PR #26 / PR #34, no write |
| empty slot → ranked repair | existing | #19 / PR #28, no write |

## Sources

Public-web primary sources:
- Workforce.com Rota Agent — 2026-08-17: https://help.workforce.com/en/articles/15301502-rota-agent
- Workforce.com Availability Report — 2026-07-23: https://help.workforce.com/en/articles/16053492-availability-report
- Deputy availability/unavailability — updated 2026-07-16: https://help.deputy.com/hc/en-au/articles/4614772805135-How-to-let-your-manager-know-you-re-available-or-unavailable-to-work-on-a-specific-date
- Deputy time off in schedule — updated 2026-07-16: https://help.deputy.com/hc/en-au/articles/4688865765775-Viewing-time-off-in-the-schedule

Internal evidence:
- `Reese-max/92-duty-scheduler@4d7d7d4911ffd580630661a2f71079a2c38c6ae1`
- `docs/SOP.md`
- `cf-deploy/public/app.js`
- `cf-deploy/functions/api/exclusions.js`
- `cf-deploy/functions/api/state.js`
- `cf-deploy/migrations/0001_init.sql`
- `.github/quality-audits/2026-09-10-1611-product-board-audit.md`
- `docs/audits/50-persona-round-4-2026-09-14.md`
- Issues #19/#20/#22/#35 and current all-state PR collection.

## What Changed

- Fresh external evidence：Workforce.com now places pending leave/availability review explicitly before AI rota generation and models availability with lifecycle/status distinctions.
- New repository finding：clear-all exclusions false-success / persistence divergence。
- New tracking：created and read-back verified **#35** only.
- 0 existing Issue comments/edits；0 PR comments/edits；0 implementation authorization；0 code/config/deploy changes。
- No production D1/runtime was touched; #35 remains `NEEDS_RUNTIME_VERIFICATION`.

## Completion / Gaps / Cursor

- Inventory：COMPLETE，42 owned / 41 unarchived / 1 archived；offset 100 verified empty。
- Direction / current HEAD / existing Issues / all-state PRs / historical 92-duty radar：checked。
- External research：COMPLETE for focal scan，主要 evidence 為 GitHub 之外第一方 Workforce.com / Deputy documentation。
- Runtime：not executed；未宣稱 production incident，也未把 static source 當 deployed verification。
- Writes：1 new Issue (#35) + this unique central report only。
- Next fair-rotation cursor：`Reese-max/ai-flight-radar`。
