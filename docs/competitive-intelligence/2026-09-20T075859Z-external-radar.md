# External Competitive Radar — 2026-09-20T07:58:59Z

Status: **COMPLETE**

查閱日：2026-09-20。主要市場證據來自 GitHub 之外的公開第一方產品頁；GitHub 僅用於 Reese-max 自有 repository inventory、owner 方向、default-branch 現況、Issue/PR 去重與本報告寫入。

## Scope / Direction Check

- Governing rule：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`
- Fresh connected owner inventory：本輪實際完整分頁列舉 **42 個 Reese-max-owned repositories / 41 個未封存**；offset 100 回傳空集合。唯一 archived repo 為 `obsidian-vault`。
- Fair-rotation focal repository：`Reese-max/voice-actress`，承接上一輪 `2026-09-20T060155Z-external-radar.md` 的 cursor。
- Default branch：`master@b20a3f3e58b055ff27acf7cdd302d822841a119c`。最新 default commit 是 audit/docs，現行產品 baseline 仍依最新 Product Board 的 `de674011cac49d74693685381b4fae4fd9fe9826` 判讀。
- Owner direction：`INVEST / SIMPLIFY / REPOSITION`。主線是繁中警察／公職申論練習；差異化聚焦可核對採分 evidence、法源 provenance、timed practice、private recovery 與小型 TTS，不擴成通用 LMS／社群商城／enterprise IAM。
- Active coordination：#14 / PR #16 正處理 personal-session owner boundary；#15 / PR #17 處理 Next.js upstream security；#6 / PR #18 處理 criterion-linked evidence / law provenance。以上 scope 均有活躍實作者，本輪不取得鎖、不留言、不搶改。
- 本輪未修改產品原始碼、CI/config、secret、permissions/settings，未建立 implementation branch、merge/deploy、啟動 worker/GOAL、付費服務或外部資料寫入。

## Product → Market Category

`voice-actress` 的 Shenlun 主線目前屬於：

1. 台灣警察／公職考試的 **AI-assisted essay practice workspace**；
2. 歷屆題 → 作答 → rubric 批改 → dashboard / 錯題 / SRS / 模考的個人閉環；
3. 已具弱點統計與 7 天 study-plan generator，而不是只做一次性 AI 評分；
4. 合理競爭重點是「批改結果是否可核對、資料是否私密、題目與法源是否可信」，不是課程數量或社群廣度。

## External Signals

### A. CONFIRMED — WAYDA 直接進入「弱點診斷 → 優先方向 → 7 天計畫」閉環

**事件：2026-07-29；查閱：2026-09-20。**

來源：https://www.wayda.com.tw/ai-learning-diagnosis-center/

偉大公職 WAYDA 的 AI 學習診斷中心把刷題、正確率、掌握度、錯題、近期趨勢與同儕表現整合後，直接產生：整體診斷、各科雷達、3 個優先處理方向，以及「接下來 7 天怎麼讀」的每日任務。

這是**直接競品的產品策略變化**，且和 `voice-actress` 已存在的 `WeaknessDashboard + generateStudyPlan()` 高度重疊。default branch 的 `lib/shenlun-study-plan.ts` 已依 grade sessions、弱點標籤、最弱維度／科目產生 7 天計畫；歷史 engineer log 甚至曾把「批改回饋 → 弱點雷達 → 一鍵 AI 讀書計畫」描述成競品尚未形成的差異化閉環。

因此本輪的新結論不是「新增 study plan」，而是**校正定位**：截至 2026-07-29，這項能力已不能再被當作可持續的獨特差異化。競爭優勢應往 owner 已核定的可核對 rubric evidence、法源 provenance、private/local boundary 與 truthful AI mode 收斂。

外部頁面是供應商產品宣稱，不是學習成效的獨立驗證；不從 WAYDA 的 marketing 文案推算通過率、ROI 或真實使用頻率。

### B. CONFIRMED — WAYDA AI 考點雷達把「翻歷屆題找趨勢」變成可追溯的歷史資料分析

**事件：2026-07-23；查閱：2026-09-20。**

來源：
- https://www.wayda.com.tw/wayda-ai-exam-radar/
- https://www.wayda.com.tw/wayda-ai-radar/

WAYDA 以民國 110–115 年考選部、警察大學、警專等官方題目，提供高頻考點、年度變化、題型分布與近三年趨勢；可按考試／科目／題型／年度篩選，並回到官方題目來源。值得移植的不是「預測考題」，而是：

- 把歷史題目統計變成可操作的 next-practice signal；
- 每個趨勢保留官方來源；
- 明確標示「歷史趨勢不代表未來一定出題、AI 整理可能有誤，以官方公告為準」。

`voice-actress` 已有 5 科題庫、year/subject/question metadata 與模考／練習入口，但本輪沒有找到 current default-branch 的「高頻考點 / 年度趨勢」產品面。這是一個 **ADJACENT RESEARCH IDEA**，不是已證實缺陷。

### C. CONFIRMED — WaydaPro 2.0 把診斷、課程、題庫、錯題與申論健診包成完整商業工作流

**發布：2026-06-23；月費方案：2026-07-31；查閱：2026-09-20。**

來源：
- https://www.wayda.com.tw/waydapro-2-online-exam-prep-system/
- https://www.wayda.com.tw/waydapro-2-monthly-subscription-launch/

WaydaPro 2.0 面向警察特考等考生，以「檢測 → 學習 → 練習 → 修正 → 衝刺」串起 AI 診斷、課程、題庫、錯題、人工申論批閱與考前內容，7 月底並推出 NT$4,000 起的警察類單月方案。

這是 packaging / distribution 訊號，而不是 `voice-actress` 應恢復付費或擴成課程平台的理由。現行 owner 方向明確反對商城／廣泛 LMS／社群 breadth；且產品目前更需要先完成 #14 private boundary 與 #6 evidence trust，而不是追課程 catalog。

## New Releases / Market Moves

| Date | Product | Signal | Confidence | Radar consequence |
|---|---|---|---|---|
| 2026-07-29 | WAYDA AI 學習診斷中心 | 弱點／趨勢／同儕 → 3 個優先方向 → 7 天任務 | CONFIRMED | 推翻「弱點→7天計畫是獨特差異化」的舊定位；不新增功能 |
| 2026-07-23 | WAYDA AI 考點雷達 | 官方歷屆題 → 高頻／年度／題型／近3年趨勢 + source links | CONFIRMED | 保留窄 research candidate；禁止當預測保證 |
| 2026-07-31 | WaydaPro 2.0 | 警察類月費 + AI 診斷整合 | CONFIRMED | 價格／bundling signal only；不恢復 billing |
| 2026-06-23 | WaydaPro 2.0 | 一站式警界考試 prep workflow | CONFIRMED | `DO NOT COPY` course/LMS breadth；強化 narrow trust workspace 定位 |

## Community Pain

本輪**沒有把新的社群貼文提升為 COMMUNITY_SIGNAL**。WAYDA 頁面描述「做很多題卻不知道弱在哪、下一步讀什麼」屬供應商定位／行銷敘事，不當作普遍發生率或真人需求證據。

## Adjacent Ideas

### 1. Historical topic radar：先做一次性證據實驗，不先做產品功能

候選工作：從既有 1,482 題 corpus 中，選 1–2 個 owner 關注科目做一次性歷史題聚類／人工核對，輸出 `topic × year × question × official/source provenance`，看看它是否真的能減少「人工翻多年份題目決定下一題練什麼」的步驟。

更小方案先於程式修改：先產生 report/fixture，人工核對 topic labels 與來源，再找 1 個真實備考情境判斷是否有決策價值。若沒有真人／實際 workflow evidence，維持 HOLD。

不先建立 topic ontology DB、prediction engine、trend service、排行榜、課程推薦器或背景 crawler。

### 2. Study-plan differentiator 改成 trust differentiator

既有 study-plan 已存在；最小動作是**停止把它當成獨有功能賣點**。產品更值得強化的是：每個弱點從哪份作答／哪個 rubric evidence 得出、推薦法條是否有可信來源、private session 是否確實 owner-scoped，以及 live/mock/fallback 是否誠實標示。

這直接重用 #14、#6、#1，而不是另開「下一代 AI 教練」專案。

## Opportunity Map — `voice-actress`

| Bucket | Decision | Evidence / reason |
|---|---|---|
| MUST MATCH | 私人作答／歷史必須 owner-scoped；AI mode / source truth 不得誤導 | #14/#1 current blockers；直接影響核心信任 |
| MUST MATCH | 弱點／7 天計畫作為 table-stakes convenience，不再視為唯一差異化 | WAYDA 2026-07-29 已直接提供同類閉環；本 repo 已有現成能力 |
| SHOULD BE BETTER | rubric criterion → 原文 evidence → 法源 provenance 的可核對鏈 | #6 / PR #18；比 generic diagnostic 更符合 owner direction |
| DIFFERENTIATOR | 繁中警察／法律申論的 narrow, reviewable, private/local practice workspace | owner product board；不與課程平台比 breadth |
| ADJACENT IDEA | 以官方歷屆題為根的 topic-frequency / year-trend report，先研究決策價值 | WAYDA radar + repo 已有 year/subject corpus；user pain 尚未建立 |
| DO NOT COPY | 同儕 PR 排名、課程 marketplace、付費會員 breadth、命題「命中率」保證、考題預測引擎 | privacy / scope / evidence / maintenance cost 不符合目前方向 |

## Four-Gate Candidate Calibration

### Candidate: official-question historical topic trend as a next-practice aid

```yaml
issue_quality_version: 2
kind: RESEARCH
severity: NOT_ESTABLISHED
decision_priority: MEDIUM
evidence: NEEDS_EVIDENCE
triage: NEEDS_EVIDENCE
auto_implementation: false
runtime_verification: NEEDS_RUNTIME_VERIFICATION
```

**Gate 1 — Problem / value**  
Target user 是已有多年度歷屆題、需要決定下一題練什麼的警察特考考生。repo 已有 year/subject/question corpus，但本輪沒有真人行為、analytics 或 support evidence 證明「人工統計考點」是目前高頻斷點。競品存在只能提高 Strategic Fit，不能建立 User Pain。

**Gate 2 — Priority**  
不是 BUG、也沒有 P2 completion/recovery impact。故 severity `NOT_ESTABLISHED`；decision priority 僅 MEDIUM。WAYDA 的 marketing / historical trend 不得當成 future exam likelihood 或真實成效資料。

**Gate 3 — Minimum**  
先不改產品。從 1–2 科既有 corpus 做 bounded offline report：人工核對少量 topic labels、年度分布與 source traceability，再測是否能影響「下一題選擇」。只有明確減少人工翻題且不誤導為 prediction 時，才考慮 reuse existing dashboard/filters 做 thin slice。

**Gate 4 — Research / implementation separation**  
BUILD 只代表可進一步定義 user-testable thin slice；NARROW 代表只保留歷史統計／少數科目；REJECT 代表分類維護成本高、來源難核對、或沒有決策價值。任何結果都不自動授權新 dashboard/service/DB。

**Decision:** 中央報告保留，**本輪不建立 Issue**。

## Cross-portfolio Ideas

無足夠證據支持新的跨 portfolio 共用能力。歷屆題趨勢屬特定 domain product logic，不建立共用 analytics framework。

## Rejected Ideas / Reasons

1. **新增另一個 AI 7 天讀書計畫** — REJECT AS DUPLICATE。default branch 已有 `generateStudyPlan()` + weakness dashboard；競品只推翻差異化定位，不建立功能缺口。
2. **同儕 PR 百分位／排行榜擴張** — REJECT。#14 private boundary 尚未真正關閉；且沒有資料證明 peer comparison 改善核心 essay workflow。
3. **命題預測／命中率 engine** — REJECT。歷史頻率 ≠ 未來出題；WAYDA 自身也明示不保證。若研究，只能做可追溯 historical descriptive analytics。
4. **generic OCR / handwriting platform** — DUPLICATE / HOLD。#12 已是 bounded handwriting → reviewed transcript research；不重開。
5. **課程商城／大而全 LMS／恢復付費** — REJECT。WaydaPro 的商業包裝不是需求證據，且違反 owner 已核定的 simplify/reposition 邊界。

## Issue Mapping / Deduplication

- **新 Issue：0**
- **更新 Issue / comment：0**
- **PR comment / scope change：0**
- **implementation authorization：0**
- #14 / PR #16：owner/session boundary active；本輪不碰。
- #6 / PR #18：criterion evidence / law provenance active；新競品證據反而提高這條差異化的相對價值，但不更改 scope。
- #12：handwriting bridge 已覆蓋 OCR-adjacent signal；不重開。
- #15 / PR #17：upstream security；與本輪 market signal 無關。
- historical topic radar：新 research candidate，但 User Pain 未建立，留中央清單，不立案。

## Sources

| Date | Source | URL | Confidence | Use |
|---|---|---|---|---|
| 2026-07-29 | WAYDA AI 學習診斷中心 | https://www.wayda.com.tw/ai-learning-diagnosis-center/ | CONFIRMED | 直接競品：弱點 → 優先方向 → 7 天計畫 |
| 2026-07-23 | WAYDA AI 考點雷達介紹 | https://www.wayda.com.tw/wayda-ai-exam-radar/ | CONFIRMED | 官方題目歷史趨勢 / caveat / source traceability |
| observed 2026-09-20 | WAYDA AI 考點雷達產品頁 | https://www.wayda.com.tw/wayda-ai-radar/ | CONFIRMED | 實際 filter / trend / source surface |
| 2026-06-23 | WaydaPro 2.0 | https://www.wayda.com.tw/waydapro-2-online-exam-prep-system/ | CONFIRMED | 直接市場 workflow / bundling |
| 2026-07-31 | WaydaPro 2.0 月費方案 | https://www.wayda.com.tw/waydapro-2-monthly-subscription-launch/ | CONFIRMED | 當輪 pricing / packaging signal |

## What Changed

- **實質產品定位校準：** repository 歷史曾把「批改回饋 → 弱點雷達 → 一鍵 AI 7 天讀書計畫」視為競品尚未形成的閉環；WAYDA 2026-07-29 已提供高度重疊的 direct-competitor workflow，因此這項舊 differentiator claim 失效。
- **沒有因此新增功能：** `voice-actress` 已具同類 capability；正確反應是把 differentiation 收斂到 evidence / law provenance / privacy / truthful mode。
- 新的 historical topic-trend idea 通過 Strategic Fit，但沒有通過 User Pain / implementation gate；維持 bounded research candidate，不建 Issue。
- 沒有 runtime、手機、真人 usability、正式 provider 或 production evidence；本輪不宣稱產品效果、使用率或 portfolio CLEAN。

## Completion / Gaps / Cursor

- Inventory：COMPLETE，42 owned / 41 unarchived / 1 archived；offset 100 verified empty。
- Direction / default HEAD / Issues / all-state PRs / prior radar：已核對。
- External research：COMPLETE for this focal scan；主要 intelligence 為 GitHub 之外的 WAYDA 第一方公開產品頁。
- Runtime：未執行；research candidate 維持 `NEEDS_RUNTIME_VERIFICATION`。
- Writes：只新增本 research report；0 product/Issue/PR implementation write。
- Next fair-rotation cursor：`Reese-max/92-duty-scheduler`。
