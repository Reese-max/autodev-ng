# 外部競品／新品／工作流靈感雷達 — 2026-09-14T18:01:12Z

> 查閱日：2026-09-15（Asia/Taipei）；檔名時間為 UTC。主要市場證據來自 GitHub 之外公開網路；Reese-max GitHub 僅用於 repo 列舉、產品範圍、default-branch 現況、Issue/PR 去重與報告落地。
>
> Issue Quality：`issue_quality_version: 2`；來源 `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`；本輪讀取 blob `8167e10798071d2276addaff6b201c6b0e904a2a`。
>
> Evidence labels：`CONFIRMED` = 第一方官方資料或可直接檢查的 repository truth；`LIKELY` = 有支持但仍需 runtime／真人證據；`COMMUNITY_SIGNAL` = 個別社群經驗；`UNKNOWN` = 資料不足。
>
> Safety：本輪沒有修改產品原始碼、CI/config、secret、權限或 repository settings；沒有建立實作 branch、merge、deploy、啟動 worker/run 或新 GOAL；沒有付費試用或變更正式資料。

---

## Executive Summary

本輪公平輪巡從上一輪 cursor `voice-actress` 開始，發現一個**新的、但只能進窄研究而不能直接實作**的產品機會：`voice-actress` 已經提供 22×25×2 頁的可列印申論稿紙並明示「列印後即可手寫練習」，而目前 grading API 的核心輸入仍是 `answerText: string`。同時，115 年（2026）警察人員考試官方試題仍明確要求申論答案以藍、黑色鋼筆或原子筆寫在申論試卷上。這形成可直接描述的人工斷點：**使用既有紙本練習路徑的考生，若要取得 AI rubric feedback，必須把已手寫一次的答案重新輸入成文字。**

這不是「缺 OCR framework」；真正的 root cause 是現有兩條已支援流程 `print/handwrite` 與 `grade(answerText)` 之間沒有低風險橋接。新的外部證據也足以避免把問題誤解成泛用 OCR：公職王／志光在 2026-08-27 起推廣警察等國考類科的 AI 申論批改，現行提交流程支援手動輸入或 Word，並提供弱點分析／PDF；相鄰產品 Examino 則在 2026-08-17 文件中把手寫稿處理拆成「掃描→逐題轉錄→轉錄信心／評分信心→人工檢查→確認」，低信心頁面與分數會被標示，人工修改另保留歷史。這提供的是 **capture/review boundary**，不是效果證明。

反方仍然很強：`voice-actress` 的已核定 Product Board 明確寫了 **DO NOT COPY generic OCR**，且當前更高優先序仍是 #1 provenance、#7 truthful product contract，以及已核定的 #6 evidence-linked legal rubric feedback。沒有真人使用資料能證明「重打手寫答案」是高頻 top friction。因此本輪不開 FEATURE；只提出一個可結束的 RESEARCH，限制在「既有稿紙→可核對逐字稿→現有 grade-v2」的最小橋接。研究若不能明確減少重打負擔，或 OCR/vision 的錯誤、隱私、成本邊界不合理，必須 NARROW/REJECT。

### Repo enumeration / scope

本輪重新使用 Reese-max owner listing：42 個 owned repositories；3 個 archived（`gemini-deidentifier`, `openab`, `obsidian-vault`）；39 個 owned + unarchived。沿用上一輪已重新校準的現行範圍：36 個 product-like + 3 個 support/compatibility-only（`adng-memory`, `internship-notes-sites-mirror`, `police-exam-practice`）。沒有操作他人 repo。

本輪 deep product：`voice-actress`。下一個 cold-rotation cursor：`minideck`。近期已深讀或有活躍 scope 的 repo 不因本輪略過而永久跳過。

---

## 1. Product truth — voice-actress

### Current revision and approved scope

- current default-branch HEAD observed：`120523b73872155457bf2251cb02b66c950ad4c2`（最新提交為 audit docs）。
- current Product Board（2026-09-10）決策：**REPOSITION + SIMPLIFY**。
- primary thesis：聚焦繁中臺灣警察／法律申論練習；moat 是可核對 rubric feedback、法源 provenance 與精簡 TTS study aid。
- explicit `DO NOT COPY`：LMS/rosters、**generic OCR**、social feed、廣泛 TTS marketplace、paywall、every integration。
- current board sequencing：先處理 #1/#2 runtime acceptance、#7 truthful contract，再驗證最小 #6；truth/recoverability before features。

### Concrete current workflow gap

**CONFIRMED — repository source**

- `app/components/shenlun-print-sheet.tsx` 顯示：「22 行 × 25 格 × 2 頁標準稿紙，列印後即可手寫練習。」
- `/api/shenlun/grade`、`/api/shenlun/grade-v2` 以及 session schema 都要求 `answerText: string`。
- 本輪 repository 搜尋未找到 handwriting/OCR/photo/scan ingestion 的現行 Issue；all-state PR 搜尋也未找到相同 workflow fingerprint。

Stable fingerprint：

`voice-actress + existing printable Shenlun answer sheet + user chooses supported handwrite practice path + grading accepts answerText only + learner must re-enter an already-written answer before rubric feedback`

這裡的缺口不是「沒有 OCR engine」，而是**紙本作答與現有評分入口之間存在重複輸入**。

### Current blockers / coordination

- #1：missing/legacy provenance 仍可能被升格為 live-looking AI provenance；Round 3 source evidence 仍未清除。
- #7：README/architecture 仍與 free-only + SQLite 現況矛盾；已有後續 PR 活動。
- #6：criterion→answer evidence + verified legal source，是已核定 differentiated grading direction。

因此新的 handwriting bridge **不能取得 READY_FOR_IMPLEMENTATION，也不能阻塞 #1/#7/#6**。

---

## 2. External Signals

### A. Direct competitor — 公職王／志光：警察類科 AI 申論批改已成現行產品入口

**CONFIRMED — campaign/current workflow；event window starts 2026-08-27；checked 2026-09-15**

Sources:
- https://www.cek.tw/7415/ckopsp-event-e20251017002
- https://www.cek.tw/5160/ckopsp-event-E20210207024

官方頁面目前把歷屆試題 AI 申論批改推到一般警察／警察等類科；流程是登入→選歷屆題→提交作答→取得評分、模擬詳解、核心考點／弱點分析→PDF 匯出。頁面列出的 submission 是「手動輸入」或「Word 檔案」，並明示 AI 批改是輔助性建議；會員活動另提供每日 2 題免費體驗。

**JTBD**：國考考生寫完申論後，不等人工批改排程就取得結構、關鍵字、完整度與弱點回饋。

**減少的人工步驟**：減少等待教師回件與自行整理弱點；但其公開流程仍沒有證明可直接接「紙本手寫→批改」。

**Onboarding/distribution**：直接嵌進既有歷屆考古題入口，再用每日免費題數降低首次使用門檻，而不是獨立建立新 AI app。

**Business-model signal**：AI 次數被當成可明確限制的 expensive action；免費體驗是 acquisition surface。這不是 Reese-max 的付費意願證據。

**限制／不該照抄**：官方頁面的「專業客觀」等宣稱不是獨立效果驗證；也不能因直接競品新增 AI grading 就讓 `voice-actress` 重回 generic feature race。

### A2. Direct market constraint — 人工申論批改容量仍有限

**CONFIRMED — vendor product constraint；published 2026-06-30；checked 2026-09-15**

Source:
- https://sharing.com.tw/product/index/SJ133

2027 警察特考統整模考班明示「申論批改名額有限，額滿就不接受批改」。這只支持「即時、可重複的自助 feedback 有真實替代工作流」；不能推算市場缺口比例，也不能拿來證明 AI grading 品質。

### B. Adjacent workflow — Examino：掃描、轉錄、信心與評分分層

**CONFIRMED — help docs updated 2026-08-17；checked 2026-09-15**

Sources:
- https://examino.ai/en/help/ai-grading/how-does-the-ai-grade-a-paper
- https://examino.ai/en/help/ai-grading/what-is-the-reliability-score-of-a-grading
- https://examino.ai/en/help/ai-grading/how-do-reliability-alerts-work
- https://examino.ai/en/help/ai-grading/how-do-i-edit-an-ai-generated-grade-or-comment
- https://examino.ai/en/features/ai-essay-grader
- https://examino.ai/en/pricing

Current pattern：
1. handwritten scan/photo 先被 transcribe；
2. 再依 rubric/competency grading；
3. reliability 分開包含 transcription confidence 與 grading confidence；
4. illegible page / low-confidence transcription / atypical grade 有 alert；
5. 人工可修改 grade/comment，且修改歷史與 AI 原始輸出分開保留；
6. 手機可透過 QR + native camera capture，不要求學生裝 app。

**可移植核心**：`Capture Evidence → Transcript Candidate → Human Review → Confirmed Text → Grading Candidate`。對 Reese-max 最有價值的是「未確認逐字稿不直接變成 grading truth」，而不是複製 classroom/batch SaaS。

**Pricing signal（checked 2026-09-15）**：官方頁現行 Discovery 10 papers/month free、Standard US$7.50/month 100 papers、Plus US$17.90/month 300 papers；官方 credit help 另說只有實際 launch AI grading 才扣 credit，import/splitting 不扣。可移植的產品訊號是把 ingestion/review 與 expensive AI act 分開，不是照抄價格。

**限制**：Examino 是通用教師 grading SaaS；其準確度、節省時間與使用量宣稱沒有被當作 Reese-max 成效證據。

### C. Emerging technology — document/vision extraction 已可作薄層實驗，不必自建 OCR

**CONFIRMED — current capability/release；checked 2026-09-15**

Sources:
- Google Document AI release notes, 2026-07-17: https://docs.cloud.google.com/document-ai/docs/release-notes
- Google Enterprise Document OCR: https://docs.cloud.google.com/document-ai/docs/enterprise-document-ocr
- Azure Content Understanding whats-new, August 2026 SDK preview: https://learn.microsoft.com/azure/ai-services/content-understanding/whats-new

Google Enterprise Document OCR 現行文件明列 handwriting detection、page/block/line/word 級結構與 image-quality score；Document AI 在 2026-07-17 又新增 Gemini 3.5 Flash-powered custom extractor preview。Azure Content Understanding 在 2026-08 提供 `2026-06-01-preview` SDK，並明示 preview 無 SLA、不建議 production workload。

**新可能性**：研究不需要先做 OCR engine；可以用一個已授權／可隔離的現成 extraction path 驗證「現有 22×25 稿紙能否轉成可核對 candidate transcript」。

**Do not copy / risk**：preview ≠ production guarantee；影像含手寫內容，涉及資料離端、provider retention、成本、語言/手寫品質、錯字對法律答案的放大效應。任何候選都必須 fail toward review，而不是低信心仍自動送 grading。

### Official exam truth — 115 年警察考試仍要求紙本手寫申論

**CONFIRMED — Ministry of Examination official question papers, 2026 exam；published ~2026-06；checked 2026-09-15**

Sources:
- 三等「中華民國憲法與警察專業英文」：https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?c=209&code=115060&q=1&s=0205&t=Q
- 三等「警察情境實務」：https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?c=202&code=115060&q=1&s=0904&t=Q
- 四等「警察情境實務概要」：https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?c=243&code=115060&q=1&s=0905&t=Q

官方 115 年試題均明示申論題要寫在申論試卷，並以藍、黑色鋼筆或原子筆作答。這證明「紙本手寫」仍是目前 police-exam task reality；它不證明考生一定想拍照 OCR，也不保證未來考試永遠不電腦化。

---

## 3. Community Pain

本輪沒有找到足夠可信、且能直接連到臺灣警察申論「手寫後必須重打」頻率的近期社群樣本，因此**不以 Reddit/論壇湊發生率**。

可保留的市場旁證只有：警察特考人工批改商品仍公開寫明名額有限；這是 vendor workflow constraint，不標為 COMMUNITY_SIGNAL。真人是否把 retyping 視為 top friction 仍是 `UNKNOWN`，也是本 Research 必須停留在 `NEEDS_EVIDENCE` 的原因。

---

## 4. Opportunity Map — voice-actress

| Bucket | Current decision | Why |
|---|---|---|
| MUST MATCH | provenance、grade→persist→review、truthful setup/storage contract | 既有 #1/#7；信任與可恢復性先於功能 |
| SHOULD BE BETTER | 警察／法律 rubric、criterion evidence、法源狀態 | 已有 #6，與產品窄定位直接一致 |
| DIFFERENTIATOR | **若證據成立：現有警察申論稿紙的 handwrite→reviewed transcript→grade bridge** | 真考試仍是手寫；競品公職王現行 submission 仍公開為手動輸入/Word；但價值尚待驗證 |
| ADJACENT IDEA | transcript confidence 與 grading confidence 分離、低信心 review queue | Examino 2026-08-17 pattern；可重用於任何未來 capture path |
| DO NOT COPY | generic OCR platform、teacher LMS、batch classroom、camera app、廣泛 document ingestion | 已核定 Product Board；會稀釋 essay-practice thesis |

### Simplify / reuse before add

1. **No change**：維持 typed practice；對完全數位練習者沒有新複雜度。
2. **Docs-only**：把「紙本手寫後需重打」明示；可降低 surprise，但不消除 duplicate entry。
3. **Reuse existing truth**：若研究繼續，只把確認後的 transcript 轉成現有 `answerText`，不建立第二個 grader/session model。
4. **Local thin change before module**：capture/transcription 只是一個 pre-grade candidate step；不新建 OCR registry/database/service。
5. **Only if evidence passes**：才研究 production upload/vision provider boundary。

---

## 5. Candidate quality gate

### Candidate — Validate `handwritten sheet → reviewed transcript → existing grading`

```yaml
issue_quality_version: 2
kind: RESEARCH
severity: NOT_ESTABLISHED
evidence: SOURCE_CONFIRMED + NEEDS_USER/RUNTIME_EVIDENCE
decision_priority: MEDIUM
triage: NEEDS_EVIDENCE
auto_implementation: false
```

**User / north star**：臺灣警察／法律申論考生；快速完成真實格式練習並取得可核對 feedback。

**Concrete friction**：產品已鼓勵列印稿紙手寫；grade path 只收文字。若使用者走紙本路線，需要把同一答案再打一次。

**Can existing capability solve it?** 可以完全改用 typed practice；因此這不是 BUG。對刻意練 handwriting/版面/考場節奏的人，現有替代方案就是重打。

**Impact of not doing**：沒有證據會阻止核心任務；成本是 paper-practice 與 AI feedback 之間多一個 duplicate-entry step。嚴重度不能從競品 existence 升級。

**Why not do it**：沒有真人頻率／採用證據；OCR 錯字可能污染法律論證；影像資料比純文字更敏感；provider 成本／retention 未驗；#1/#7/#6 更優先；Product Board 已拒絕 generic OCR scope。

**Smallest research**：只使用既有 22×25×2 版型的 synthetic/anonymized handwriting fixture，不碰 production/user data；選一個已授權或可隔離的 extraction path，產生 candidate transcript + low-confidence markers；使用者必須 review/confirm 後才把 confirmed text 送既有 `grade-v2`。量測重打 baseline vs candidate 的鍵入／修正負擔、transcription error location、不可辨識比例、單次成本/資料邊界；不測市場採用率、不宣稱學習成效。

**Why cannot be smaller**：只做 upload 不會消除 retyping；直接 image→grade 又會跳過 transcript correctness boundary。最小可測單位必須至少包含「capture → candidate transcript → explicit confirm」。

**Maintenance / cost / authority burden**：image upload surface、temporary storage/deletion、provider terms/cost、Chinese handwriting errors、transcript provenance。研究不得建立永久 image library、OCR platform 或自動 grading authority。

### Exit conditions

- **BUILD（只代表可做 user-testable thin slice）**：現有稿紙 fixtures 能產生可 review transcript；低信心/不可辨識位置可見；confirmed text round-trip 到既有 `answerText`；相較人工重打有可觀察的步驟/鍵入減少；資料 retention/cost boundary 可接受。
- **NARROW**：只在清晰單頁／既有稿紙／特定 capture 條件可靠，則把 scope 限定到該條件，不泛化到所有文件或手寫。
- **REJECT**：修正 OCR 所需工作接近或高於重打、低信心不能可靠暴露、provider/privacy/cost boundary 不可接受，或真人 workflow evidence 顯示紙本→AI bridge 不是值得解的摩擦。

**NEEDS_RUNTIME_VERIFICATION**：目前只有 source/external evidence；本輪沒有跑 OCR、手機拍照、provider call、production browser 或真人 usability。

---

## 6. Cross-portfolio ideas

只有一個值得保留、但**不建立 umbrella Issue** 的共用原則：

`Capture Evidence ≠ Transcript Candidate ≠ User-confirmed Text ≠ AI Evaluation ≠ Accepted Feedback`

對 `clinical-scribe-worker`、`note-filler`、`project-doctor-web` 這類會把聲音／影像／外部資料轉成後續 AI 判斷的產品，capture confidence 應與 downstream evaluation confidence 分開；但各 repo 已有自己的 provenance/candidate/review 工作，現在沒有證據需要另一套跨 portfolio framework。

---

## 7. Ideas Rejected / Deferred

- **Generic handwriting OCR platform — REJECT**：直接違反 `voice-actress` Product Board 的 DO NOT COPY，且不是根因。
- **Camera-first mobile app — DEFER**：web/native capture 是否必要尚無使用證據；QR/native-camera 是 Examino 的 distribution pattern，不是 Reese-max 必須照抄的 surface。
- **Batch class grading/LMS — REJECT**：目標使用者是個人 police/legal examinee，不是 teacher roster SaaS。
- **Auto-grade raw image without transcript review — REJECT**：會把 capture error 與 grading error 混在一起，法律/警察申論不可接受。
- **New paid tier around OCR — REJECT/OUT OF SCOPE**：產品已明確 free-only，不能因競品 credits/pricing 重新導入 paywall。

---

## 8. Issue Mapping

- Existing #1 — grading provenance；不同 fingerprint，不更新。
- Existing #6 — criterion→answer evidence + legal source；不同 fingerprint，不擴 scope。
- Existing #7 — truthful free-only/SQLite product contract；不同 fingerprint，已有後續 PR activity，不碰。
- OCR/handwriting/photo/scan Issue search：本輪未找到同 fingerprint。
- all-state PR search：未找到 handwriting/photo/OCR implementation；現有 PR #10 是 #7 的 Stripe-era cleanup，無關。
- branch search `ocr`：0。

**Planned write**：建立一張窄 RESEARCH Issue；建立成功後本節會更新真實 Issue number/URL；若失敗則記 `ISSUE_WRITE_BLOCKED`，不重試製造 duplicate。

---

## 9. Sources

Checked 2026-09-15 unless noted.

1. Ministry of Examination — 115 police exam paper (三等中華民國憲法與警察專業英文): https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?c=209&code=115060&q=1&s=0205&t=Q
2. Ministry of Examination — 115 police exam paper (三等警察情境實務): https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?c=202&code=115060&q=1&s=0904&t=Q
3. Ministry of Examination — 115 police exam paper (四等警察情境實務概要): https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?c=243&code=115060&q=1&s=0905&t=Q
4. 公職王／志光 AI 申論批改 current campaign/workflow: https://www.cek.tw/7415/ckopsp-event-e20251017002
5. 公職王 AI 申論批改 detailed workflow: https://www.cek.tw/5160/ckopsp-event-E20210207024
6. 讀享 2027 警察特考統整模考班（人工批改名額限制）: https://sharing.com.tw/product/index/SJ133
7. Examino essay grader: https://examino.ai/en/features/ai-essay-grader
8. Examino AI grading two-stage workflow (updated 2026-08-17): https://examino.ai/en/help/ai-grading/how-does-the-ai-grade-a-paper
9. Examino reliability score (updated 2026-08-17): https://examino.ai/en/help/ai-grading/what-is-the-reliability-score-of-a-grading
10. Examino reliability alerts (updated 2026-08-17): https://examino.ai/en/help/ai-grading/how-do-reliability-alerts-work
11. Examino grade/comment edit history (updated 2026-08-17): https://examino.ai/en/help/ai-grading/how-do-i-edit-an-ai-generated-grade-or-comment
12. Examino pricing: https://examino.ai/en/pricing
13. Google Document AI release notes (2026-07-17): https://docs.cloud.google.com/document-ai/docs/release-notes
14. Google Enterprise Document OCR: https://docs.cloud.google.com/document-ai/docs/enterprise-document-ocr
15. Azure Content Understanding whats-new (August 2026 preview SDK): https://learn.microsoft.com/azure/ai-services/content-understanding/whats-new

---

## 10. What changed since last radar

Compared with `2026-09-14T160050Z-external-radar.md`:

- cursor moved from `voice-actress` deep-read target toward next `minideck`;
- new direct Taiwan exam-prep signal: 公職王／志光 is actively marketing AI essay grading for police categories in late Aug/Sep 2026;
- new official task evidence: 115 police exam papers still require handwritten essay answers;
- new adjacent workflow evidence: Examino explicitly separates handwriting transcription confidence from grading confidence and retains human edit history;
- identified a concrete existing-product handoff: printable paper practice → typed-only grading;
- unlike the previous Google Maps round, this candidate has enough repo + external evidence for a **bounded RESEARCH decision**, but not enough user evidence for a FEATURE or READY state.

---

## 11. Calibration / incomplete / next cursor

- `voice-actress` remains **not evaluated for CLEAN in this radar**; this report makes no portfolio CLEAN claim.
- No OCR/vision runtime, mobile capture, provider retention, cost, or usability experiment was executed.
- AI grading quality claims from vendors were not used as outcome evidence.
- 真人頻率／top-friction evidence for handwritten→retype remains `UNKNOWN`.
- Current #1/#7/#6 sequencing remains more important than any new capture feature.
- Report write receipt: pending at content generation time; final run must read tool result and, after Issue creation, update this file with actual Issue mapping and final commit receipt.
- **Next cold-rotation cursor: `minideck`.**
