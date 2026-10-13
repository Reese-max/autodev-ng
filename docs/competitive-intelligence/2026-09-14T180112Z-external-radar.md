# 外部競品／新品／工作流靈感雷達 — 2026-09-14T18:01:12Z

> 查閱日：2026-09-15（Asia/Taipei）；檔名時間為 UTC。主要市場資料來自 GitHub 之外公開網路；Reese-max GitHub 僅用於 repo 列舉、產品範圍、default-branch 現況、Issue/PR 去重及報告落地。
>
> Issue Quality：`issue_quality_version: 2`；讀取 `docs/portfolio-audit/2026-09-14-issue-quality-v2.md` blob `8167e10798071d2276addaff6b201c6b0e904a2a`。
>
> Evidence labels：`CONFIRMED`＝第一方官方資料或可直接檢查的 repository truth；`LIKELY`＝有支持但仍需 runtime／真人證據；`COMMUNITY_SIGNAL`＝個別社群經驗；`UNKNOWN`＝資料不足。
>
> 本輪沒有修改產品原始碼、CI/config、secret、權限或 repository settings；沒有建立實作 branch、merge、deploy、啟動 worker/run 或新 GOAL；沒有付費試用或變更正式資料。

## Executive Summary

本輪公平輪巡從上一輪 cursor `voice-actress` 開始，找到一個新的、但只能進**窄研究**而不能直接實作的產品機會。`voice-actress` 已提供 22×25×2 頁的可列印申論稿紙並明示「列印後即可手寫練習」，而現行 `/api/shenlun/grade(-v2)` 與 session truth 都以 `answerText: string` 為核心輸入。115 年（2026）警察人員考試官方試題仍明確要求申論答案以藍、黑色鋼筆或原子筆寫在申論試卷上。於是既有紙本練習路徑和 AI grading 之間存在一個具體人工斷點：**考生已手寫一次答案，若要取得 AI rubric feedback，仍需再把同一答案輸入一次。**

這不是「缺 OCR framework」。真正 root cause 是 `print/handwrite` 與 `grade(answerText)` 兩條已存在流程沒有低風險橋接。新的外部證據也足以把 scope 壓小：公職王／志光在 2026-08-27 起推廣警察等國考類科 AI 申論批改，公開流程支援手動輸入或 Word；相鄰產品 Examino 在 2026-08-17 文件中把手寫稿處理拆成「掃描→轉錄→轉錄信心／評分信心→人工檢查→確認」，低信心頁面／分數會標示，人工修改另有歷史。值得吸收的是 **capture/review boundary**，不是通用 OCR 或教師 SaaS。

反方仍很強：`voice-actress` 的已核定 Product Board 明確列 **DO NOT COPY generic OCR**，而 #1 provenance、#7 truthful product contract、#6 evidence-linked legal rubric feedback 仍更優先；沒有真人 analytics／訪談證明「重打手寫答案」是 top friction。因此本輪建立的是 `RESEARCH / NOT_ESTABLISHED / NEEDS_EVIDENCE / auto_implementation=false`，不是 FEATURE，也沒有授權任何 worker 實作。

本輪重新使用 Reese-max owner listing：42 個 owned repositories；3 個 archived（`gemini-deidentifier`, `openab`, `obsidian-vault`）；39 個 owned + unarchived。沿用上一輪重新校準的現行範圍：36 個 product-like + 3 個 support/compatibility-only（`adng-memory`, `internship-notes-sites-mirror`, `police-exam-practice`）。沒有操作他人 repo。本輪 deep product：`voice-actress`；下一個 cold-rotation cursor：`minideck`。

## Product truth — voice-actress

Current default-branch HEAD observed：`120523b73872155457bf2251cb02b66c950ad4c2`。2026-09-10 Product Board 決策是 **REPOSITION + SIMPLIFY**：聚焦繁中臺灣警察／法律申論練習，moat 為可核對 rubric feedback、法源 provenance 與精簡 TTS study aid；明確不做 LMS/rosters、generic OCR、social feed、廣泛 TTS marketplace、paywall、every integration。

**CONFIRMED repository gap**：`app/components/shenlun-print-sheet.tsx` 顯示「22 行 × 25 格 × 2 頁標準稿紙，列印後即可手寫練習」；`/api/shenlun/grade`、`/api/shenlun/grade-v2` 與 session input 均要求 `answerText: string`。建立前搜尋 open/closed Issues、all-state PR、branch 與 repository code，未找到 handwriting/OCR/photo/scan 同 fingerprint。

Stable fingerprint：

`voice-actress + existing printable Shenlun answer sheet + user chooses supported handwrite practice path + grading accepts answerText only + learner must re-enter an already-written answer before rubric feedback`

Current coordination：#1 處理 grading provenance；#6 處理 criterion→answer evidence + legal source；#7 處理 truthful free-only/SQLite contract。它們都不是本 fingerprint，而且新的 handwriting bridge 不得阻塞或改寫其 scope。

## External Signals

### A. 直接競品：公職王／志光把警察類科 AI 申論批改放進歷屆題入口

**CONFIRMED；活動 2026-08-27 起；查閱 2026-09-15**

Sources:
- https://www.cek.tw/7415/ckopsp-event-e20251017002
- https://www.cek.tw/5160/ckopsp-event-E20210207024

目前流程是登入→選歷屆題→提交作答→取得評分、模擬詳解、核心考點／弱點分析→PDF 匯出；公開 submission 是「手動輸入」或「Word 檔案」，並明示 AI 批改是輔助性建議，活動另提供每日 2 題免費。

JTBD 是讓國考考生不等待人工批改排程就取得結構、關鍵字、完整度與弱點回饋；減少的是等待與自行整理弱點，但其公開流程未證明能直接接紙本手寫答案。Distribution 做法是把 AI grading 嵌回既有歷屆考古題，而不是另建一個 AI app。免費題數是 acquisition／cost-boundary 訊號，不是 Reese-max 付費意願證據。官方「專業客觀」等效果宣稱未被當成獨立驗證。

另一個直接市場限制：2027 警察特考統整模考班（2026-06-30）仍明示人工申論批改名額有限、額滿不收。Source: https://sharing.com.tw/product/index/SJ133 。這只支持「即時、可重複 feedback 有替代工作流」，不能推算需求比例或 AI 品質。

### B. 相鄰工作流：Examino 把掃描轉錄與 grading 信心拆開

**CONFIRMED；help docs updated 2026-08-17；查閱 2026-09-15**

Sources:
- https://examino.ai/en/help/ai-grading/how-does-the-ai-grade-a-paper
- https://examino.ai/en/help/ai-grading/what-is-the-reliability-score-of-a-grading
- https://examino.ai/en/help/ai-grading/how-do-reliability-alerts-work
- https://examino.ai/en/help/ai-grading/how-do-i-edit-an-ai-generated-grade-or-comment
- https://examino.ai/en/features/ai-essay-grader
- https://examino.ai/en/pricing

模式是 handwritten scan/photo 先 transcribe，再依 rubric grading；reliability 同時分辨 transcription confidence 與 grading confidence；illegible page、低信心轉錄、低信心／異常 grade 會有 alert；人工可修改 grade/comment，修改 history 與 AI 原始結果分開。手機可用 QR + native camera capture，不要求學生裝 app。

可移植核心：`Capture Evidence → Transcript Candidate → Human Review → Confirmed Text → Grading Candidate`。Reese-max 應吸收「未確認逐字稿不直接變成 grading truth」，不複製 classroom/batch SaaS。

Pricing（查閱 2026-09-15）：Discovery 10 papers/month free、Standard US$7.50/month 100 papers、Plus US$17.90/month 300 papers；官方 credit help 顯示 import/splitting 不扣 credit，只有實際 launch AI grading 扣。產品設計訊號是 ingestion/review 與 expensive AI act 可分層；不照抄價格，也不重啟 voice-actress 付費方案。

### C. 新技術：現成 document/vision extraction 足以做薄層實驗，不需自建 OCR

**CONFIRMED；查閱 2026-09-15**

Sources:
- Google Document AI release notes（2026-07-17）: https://docs.cloud.google.com/document-ai/docs/release-notes
- Google Enterprise Document OCR: https://docs.cloud.google.com/document-ai/docs/enterprise-document-ocr
- Azure Content Understanding whats-new（August 2026 SDK preview）: https://learn.microsoft.com/azure/ai-services/content-understanding/whats-new

Google Enterprise Document OCR 現行文件支援 handwriting、page/block/line/word 結構與 image-quality score；Document AI 2026-07-17 新增 Gemini 3.5 Flash-powered custom extractor preview。Azure 2026-08 提供 `2026-06-01-preview` SDK，並明示 preview 無 SLA、不建議 production workload。

因此若研究繼續，應使用一個已授權／可隔離的 extraction path 驗證既有稿紙，不能先蓋 OCR engine。Preview ≠ production guarantee；手寫影像還增加 provider retention、成本、資料離端與法律詞彙錯字風險，任何低信心結果必須導向 review，而非自動 grading。

### Official exam truth：115 年警察考試仍要求手寫申論

**CONFIRMED；考選部官方 2026 試題；查閱 2026-09-15**

Sources:
- 三等中華民國憲法與警察專業英文：https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?c=209&code=115060&q=1&s=0205&t=Q
- 三等警察情境實務：https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?c=202&code=115060&q=1&s=0904&t=Q
- 四等警察情境實務概要：https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?c=243&code=115060&q=1&s=0905&t=Q

多份 115 年試題明示申論答案須寫在申論試卷，並以藍、黑色鋼筆或原子筆作答。這證明手寫是目前 police-exam task reality；不證明考生一定需要 OCR，也不代表未來永不電腦化。

## Community Pain

本輪沒有找到足夠可信、可直接量化臺灣警察申論「手寫後重打」頻率的近期社群樣本，因此不以 Reddit／論壇湊發生率。人工批改名額有限屬 vendor workflow constraint，不標成 COMMUNITY_SIGNAL。真人是否把 retyping 視為 top friction 仍是 `UNKNOWN`。

## Opportunity Map — voice-actress

| Bucket | Decision | Why |
|---|---|---|
| MUST MATCH | provenance、grade→persist→review、truthful setup/storage | #1/#7；信任與恢復先於功能 |
| SHOULD BE BETTER | 警察／法律 rubric、criterion evidence、法源狀態 | 已有 #6，符合產品窄定位 |
| DIFFERENTIATOR | 若證據成立：既有稿紙的 handwrite→reviewed transcript→grade bridge | 真考試仍手寫，直接競品公開 submission 仍為手動輸入/Word；價值待驗證 |
| ADJACENT IDEA | transcript confidence 與 grading confidence 分離 | Examino 2026-08-17 pattern |
| DO NOT COPY | generic OCR platform、teacher LMS、batch classroom、camera app、廣泛 document ingestion | 已核定 Product Board；scope creep |

Simplify/reuse order：先允許 no-change（直接數位打字）；docs-only 可說明手寫後需重打但不能消除摩擦；若研究成立，只把**使用者確認後 transcript**轉成現有 `answerText`，不建立第二套 grader/session truth；capture/transcription 只能是 pre-grade candidate step，不新建 registry/database/service。

## Candidate Quality Gate

```yaml
issue_quality_version: 2
kind: RESEARCH
severity: NOT_ESTABLISHED
evidence: SOURCE_CONFIRMED + NEEDS_USER/RUNTIME_EVIDENCE
decision_priority: MEDIUM
triage: NEEDS_EVIDENCE
auto_implementation: false
```

**反方／Why not do it**：使用者可直接 typed practice；沒有真人頻率證據；OCR 錯字會污染法律論證；image 比純文字更敏感；provider cost/retention 未驗；#1/#7/#6 更重要；Product Board 已拒絕 generic OCR。

**最小研究**：只用現有 22×25×2 版型的 synthetic/anonymized handwriting fixtures，不碰 production/user data、不付費試用、不建立 OCR service/database。比較人工重打 baseline 與一個已授權／可隔離 extraction path：產生 candidate transcript＋低信心位置→人工 side-by-side review/correct→explicit confirm 後才成為既有 `answerText`。量測鍵入／修正負擔、錯誤位置、不可辨識區、步驟、已知成本與資料邊界；不測市場採用率、不宣稱學習成效。

只做 upload 不會消除重打；直接 image→grade 又跳過 correctness boundary，因此最小可測單位必須包含 `capture → candidate transcript → explicit confirm`。

Exit：**BUILD** 只代表可做 user-testable thin slice；若只在既有稿紙＋清晰特定條件可靠則 **NARROW**；若修正 OCR 的負擔接近／高於重打、低信心不能可靠暴露、privacy/provider/cost 不可接受或後續真人 evidence 不支持，就 **REJECT**。目前為 `NEEDS_RUNTIME_VERIFICATION`；本輪沒有跑 OCR、手機拍照、provider call、production browser 或真人 usability。

## Cross-portfolio idea

唯一值得保留、但不建 umbrella Issue 的原則：

`Capture Evidence ≠ Transcript Candidate ≠ User-confirmed Text ≠ AI Evaluation ≠ Accepted Feedback`

`clinical-scribe-worker`、`note-filler`、`project-doctor-web` 等產品也可能受益於 capture confidence 與 downstream evaluation confidence 分離，但各 repo 已有自己的 provenance/candidate/review 工作，現在沒有證據需要另一套跨 portfolio framework。

## Ideas Rejected / Deferred

- Generic handwriting OCR platform — **REJECT**：違反 voice-actress Product Board，且不是根因。
- Camera-first mobile app — **DEFER**：surface 尚無 user evidence；Examino 的 QR/native-camera 只是可參考 distribution pattern。
- Batch class grading/LMS — **REJECT**：目標是個人警察／法律考生。
- Raw image→auto grade — **REJECT**：會把 capture error 與 grading error 混在一起。
- OCR paid tier — **REJECT/OUT OF SCOPE**：產品已 free-only，不因 competitor pricing 重啟 Stripe。

## Issue Mapping

建立前再次去重：open/closed Issues 未見同 fingerprint；all-state PR 未見 handwriting/photo/OCR implementation；branch search `ocr` = 0。現有 #1/#6/#7 均為不同 root cause。

**Created successfully**：`Reese-max/voice-actress #12` — `[Competitive Inspiration][Research][RESEARCH_REQUIRED] 驗證手寫稿紙→可核對逐字稿→申論批改的最小橋接`

- URL: https://github.com/Reese-max/voice-actress/issues/12
- created_at: `2026-09-14T18:09:24Z`
- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=MEDIUM`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`
- `runtime_verification=NEEDS_RUNTIME_VERIFICATION`

這張 Issue 沒有啟動實作、新 GOAL 或 worker，也沒有重新定義 #1/#6/#7 priority。新 Issue creation 不需要搶既有 Issue lease；沒有更新既有 Issue，因此本輪沒有對別人的 active scope 取鎖。

## Sources

Checked 2026-09-15 unless noted.

1. 考選部 115 警察三等中華民國憲法與警察專業英文：https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?c=209&code=115060&q=1&s=0205&t=Q
2. 考選部 115 警察三等警察情境實務：https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?c=202&code=115060&q=1&s=0904&t=Q
3. 考選部 115 警察四等警察情境實務概要：https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?c=243&code=115060&q=1&s=0905&t=Q
4. 公職王／志光 AI 申論批改：https://www.cek.tw/7415/ckopsp-event-e20251017002
5. 公職王 AI 申論詳細流程：https://www.cek.tw/5160/ckopsp-event-E20210207024
6. 讀享 2027 警察特考統整模考班：https://sharing.com.tw/product/index/SJ133
7. Examino essay grader：https://examino.ai/en/features/ai-essay-grader
8. Examino two-stage grading（2026-08-17）：https://examino.ai/en/help/ai-grading/how-does-the-ai-grade-a-paper
9. Examino reliability score（2026-08-17）：https://examino.ai/en/help/ai-grading/what-is-the-reliability-score-of-a-grading
10. Examino reliability alerts（2026-08-17）：https://examino.ai/en/help/ai-grading/how-do-reliability-alerts-work
11. Examino edit history（2026-08-17）：https://examino.ai/en/help/ai-grading/how-do-i-edit-an-ai-generated-grade-or-comment
12. Examino pricing：https://examino.ai/en/pricing
13. Google Document AI release notes（2026-07-17）：https://docs.cloud.google.com/document-ai/docs/release-notes
14. Google Enterprise Document OCR：https://docs.cloud.google.com/document-ai/docs/enterprise-document-ocr
15. Azure Content Understanding whats-new（August 2026）：https://learn.microsoft.com/azure/ai-services/content-understanding/whats-new

## What Changed Since Last Radar

Compared with `2026-09-14T160050Z-external-radar.md`：
- 新直接競品訊號：公職王／志光正在 late Aug/Sep 2026 推警察類科 AI 申論批改；
- 新官方 task evidence：115 警察考試仍要求紙本手寫申論；
- 新相鄰 workflow：Examino 明確拆 transcription confidence 與 grading confidence，且保留人工修改歷史；
- 由 repo 現況確認一個新人工 handoff：printable paper practice → typed-only grading；
- 這次不是建立 FEATURE，而是建立可結束的 `#12 RESEARCH / NEEDS_EVIDENCE`；
- fair-rotation cursor 由 `voice-actress` 推進到 `minideck`。

## Calibration / Unfinished / Cursor

- 本雷達不宣告 `voice-actress` 或 portfolio CLEAN。
- 沒有 OCR/vision runtime、mobile capture、provider retention/cost 或真人 usability evidence。
- 廠商 accuracy／省時／使用量宣稱未當效果證據。
- 真人是否把 handwritten→retype 視為 top friction 仍 `UNKNOWN`。
- #1/#7/#6 sequencing 仍比新 capture research 優先。
- Initial report commit：`4c9277d75e56b0674ed4f56dc8a9ed8e37d61955`；本次 finalize commit 以 GitHub write receipt 為準。
- **Next cold-rotation cursor: `minideck`.**
