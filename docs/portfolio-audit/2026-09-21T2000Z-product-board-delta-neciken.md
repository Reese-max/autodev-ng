# Product board delta — neciken-summer-poem pre-merge safety review

- 查閱時間：2026-09-21T20:00Z
- 範圍：`Reese-max/neciken-summer-poem` default branch、所有狀態 Issues/PR、PR #5/#6/#7/#2 與 exact-head Actions
- default HEAD：`3ded12546eef1a9f0140a0e826be9419b438f4db`（audit-only）；最近產品基線：`3572303c0ddc598a8f4c9272b884ca91d47e1480`
- PR #6 inspected head：`ab9150df0f943f42e2505808314c2649ed8b74fa`
- PR #5 inspected head：`b5c6cef08b73a29ec72bcab80b93425715371a0f`
- 規則 blob：`8167e10798071d2276addaff6b201c6b0e904a2a`
- 證據等級：`SOURCE_CONFIRMED`；沒有把 PR 說明中的本機結果當成獨立重現
- 結論：`NOT_CLEAN, 0/2`；沒有產品實作、merge、deploy、worker 或付費 provider 呼叫

## Inventory / discovery

GitHub connector 本輪分頁列出 42 個 Reese-max repositories，其中 41 個未封存、1 個封存；前一輪 41/42 的可見性缺口本輪已恢復，但單輪列舉恢復不等於完整 portfolio CLEAN。

本 repo 的三張 open Issue 仍為 #4 P1、#3 P2、#1 P2；四個 open PR 為 #2、#5、#6、#7，均未合併。default branch 自 Round 3 後無產品變更，不重貼完整 default-branch 報告、不增加 CLEAN 輪次。

Exact-head Actions：
- PR #2 run 34133831547：failure，job `steps=null`、無 logs
- PR #5 run 35083599656：failure，job `steps=null`、無 logs
- PR #6 run 35186318129：failure，job `steps=null`、無 logs
- PR #7 run 35198010683：failure，job `steps=null`、無 logs

上述只能標 `UNKNOWN` admission/runner failure；不能據此宣稱程式測試成功或失敗。

## 新 finding F1 — 舊 Rule-Drift candidate 可在來源恢復後被錯誤 promote

```yaml
fingerprint: Reese-max/neciken-summer-poem+rule-revalidation+drift-reverts-before-promote+obsolete-candidate-remains-promotable+candidate-not-bound-to-current-receipt-or-invalidated
kind: BUG
severity: P2
decision_priority: HIGH_PRE_MERGE
evidence: SOURCE_CONFIRMED
triage: NEEDS_REVIEW
auto_implementation: false
runtime: NEEDS_RUNTIME_VERIFICATION
```

### 問題與可到達因果鏈

1. PR #6 的 `revalidate_profile()` 在 `CHANGED_CRITICAL` / cross-host redirect 時寫入固定路徑 `revision_candidate.json`。
2. 後續重新驗證若來源恢復為原內容，`finish(UNCHANGED)` 會把 snapshot 標回 `current`，但不刪除、不作廢舊 candidate。
3. `promote_revision()` 只檢查 candidate 的 `brief_id`，沒有要求它的 predecessor hash/revision 仍等於當前 snapshot，也沒有綁定最新 receipt/status。
4. 使用者之後執行既有、可到達的 `contest promote-revision <id>`，仍可把較早的截止日、AI policy、格式或 eligibility candidate 寫回正式 profile。
5. 下一次正式匯出可能再依這份錯誤 profile 判斷 readiness。這不是「缺 ledger」；根因是 candidate 缺少 compare-and-apply 身分檢查且允許狀態沒有使舊 candidate 失效。

受影響者：準備正式投稿、依工具核對 AI policy／期限／格式的個人作者與維護者。替代方式是每次 promote 前人工打開 candidate 與 latest receipt 比對，但 README/CLI 沒有把這個人工步驟設為必要 gate。不處理可能使已恢復或再次變更的官方規則被舊候選覆寫。

P2 而非 P1：候選尚在未合併 PR，且真正覆寫仍需使用者明確 promote；沒有正式投稿失敗或實際不合規事故證據。但它直接破壞規則複核的恢復性與可信度，足以作為 pre-merge blocker。

### 最小有效修正

不新增資料庫、queue 或通用狀態機：

- candidate 保存 `predecessor revision + source_content_hash` 及產生它的 receipt id/hash；
- 每次 `UNCHANGED`、`CHANGED_NONCRITICAL`、`AMBIGUOUS`、`UNREACHABLE`、`EXPIRED` 重新驗證時，明確失效任何不再對應最新阻擋 receipt 的 candidate；
- `promote_revision()` 在鎖內 compare-and-apply：candidate predecessor 必須等於當前 snapshot，且 latest receipt 必須仍指向該 candidate 並為可 promote 的阻擋狀態；
- 驗收：drift→candidate→來源恢復→revalidate→promote 必須拒絕；drift A→drift B 只能 promote B；正常單一 drift 仍可 promote 一次；併發行為維持原鎖語意。

### 去重與互斥

Finding 位於 Issue #3 / PR #6 的活躍 implementation surface。因 owner PR/branch 活躍且 exact-head 未有可驗證 CI，標 `SKIPPED_LOCKED`；不另開重複 Issue、不改 scope、不搶鎖。F1 是新反例證據，保留在中央報告供 owner review。

## 次要觀察（未另開單）

PR #5 的 `practice=True` 只把「非投稿格式」標記加入 Markdown；PDF/DOCX 仍僅靠 `practice/` 目錄與檔名前綴區分。這是 `P3 / NEEDS_REVIEW` 的 artifact-labeling 缺口，尚不足以獨立立為 P2：檔名與路徑仍提供兩層提示。最小改善是在 PDF/DOCX 首頁／首段加入同一可見標記，不需新文件系統。

PR #7 以 repo-wide `extend-ignore` 排除整類 lint，且說明仍承認 10 個測試失敗與 1 個環境失敗；它不能單獨結束 #1。這仍屬既有 CI fingerprint，未重複開單。

## 外部競品與替代工作流（查閱 2026-09-21）

| 來源 | 日期/狀態 | 與本產品的啟示 | 決策 |
|---|---|---|---|
| [Submittable submit help](https://submittable.help/en/articles/904856-how-can-i-submit) | 官方說明，2024-07-08 | submission 後可持續查看狀態；本產品至少要讓正式/練習 artifact 與規則狀態清楚可追溯 | MUST MATCH 可追溯狀態，不複製完整主辦方平台 |
| [Duotrope](https://duotrope.com/) / [About](https://duotrope.com/about/) | 官方，查閱日 current | 市場資料、deadline calendar、submission tracker 分工清楚 | SHOULD BE BETTER：本機 profile 必須 fail-safe；不建立龐大市場資料庫 |
| [Chill Subs](https://www.chillsubs.com/) / [Tracker FAQ 2026-01-22](https://support.chillsubs.com/how-tos/how-to-use-our-submission-tracker) | 官方 | 把 Magazine/Manuscript/Contest 與 In Progress/Accepted/Rejected/Withdrawn 分開 | DIFFERENTIATOR：保留 local-first 寫作＋官方規則 receipt，不追求社群規模 |
| [Visualping](https://visualping.io/) / [How-to 2026-02-16](https://visualping.io/blog/how-to-monitor-website-changes) | 官方產品與官方文章 | URL、變更條件、頻率、通知是通用監控模式；before/after 可讀性重要 | DO NOT COPY：不做 screenshot history、通知平台或 AI change-summary SaaS |
| [Duotrope changelog 2024-05-02](https://duotrope.com/news/changelog.aspx) | 官方 changelog | fee、payment、submission method 是會變動且值得結構化的欄位 | MUST MATCH：critical field 版本化；來源不足保持 unknown |

來源僅證明競品能力，不證明本產品收益或優先級；沒有用行銷宣稱推算轉換率、營收或真人偏好。

## 合成 50 Persona 覆蓋（模型推演，不是真人研究）

### 30 個回歸基線

| ID | 背景/限制 | 任務/旅程 | 摩擦與結果 | 分級/建議/證據 |
|---|---|---|---|---|
| R01 | 首次投稿詩人 | 建 profile→生成→正式匯出 | 不知道 candidate 已過期；可能套錯規則 | P2，F1，SOURCE |
| R02 | 手機查規則、桌機投稿 | 跨裝置比對期限 | receipt 與 candidate 關係不清 | P2，F1 |
| R03 | 低技術作者 | 依 CLI 提示 promote | CLI 仍接受舊 candidate | P2，F1 |
| R04 | AI 禁止競賽作者 | 檢查政策翻轉 | 舊「禁止」/「允許」候選可能覆寫現況 | P2，F1 |
| R05 | 截止日前趕稿者 | 最後一天 revalidate | 恢復正常後舊截止日候選仍存在 | P2，F1 |
| R06 | 散文作者 | 追蹤字數格式 | 舊格式候選可能重寫 profile | P2，F1 |
| R07 | 小說作者 | 追蹤 eligibility | 舊資格候選仍可 promote | P2，F1 |
| R08 | 多競賽使用者 | 切換多個 profiles | 固定 candidate 路徑易誤認為最新 | P2，F1 |
| R09 | 離線作者 | 斷線後再驗證 | unreachable 不應留下可誤套候選 | P2，F1 |
| R10 | 使用 redirect 官方頁 | 官方頁搬回原網址 | 跨主機候選可能在恢復後殘留 | P2，F1 |
| R11 | 只輸出 Markdown | practice 匯出 | 內容有標記 | PASS，PR5 static |
| R12 | 只輸出 PDF | practice 匯出 | 內容無標記但檔名/路徑有 | P3，次要觀察 |
| R13 | 只輸出 DOCX | practice 匯出 | 內容無標記但檔名/路徑有 | P3，次要觀察 |
| R14 | 正式 AI 允許競賽 | formal export | #4 gate 尚未合併 | 既有 P1 |
| R15 | 正式 AI 禁止競賽 | formal export | #4 gate 尚未合併 | 既有 P1 |
| R16 | 政策未明示 | formal export | 應 needs-review | PR5 static，runtime pending |
| R17 | 無來源 metadata 舊作品 | 人工聲明 | 仍仰賴使用者責任聲明 | NEEDS_RUNTIME |
| R18 | 空作品選擇 | formal export | PR5 會阻擋 | PASS static |
| R19 | Studio 使用者 | UI 匯出 | purpose 欄位存在，未瀏覽器實測 | NEEDS_RUNTIME |
| R20 | phase runner 使用者 | 重跑 blocked export | exit 2 不重試，未實測 Actions | NEEDS_RUNTIME |
| R21 | Windows 維護者 | 依 README 跑測試 | exact-head Actions 零步驟失敗 | VALIDATION_GAP |
| R22 | 無 OpenCC 環境 | 跑完整 suite | PR7 自述環境失敗未被 CI 驗證 | VALIDATION_GAP |
| R23 | 只看綠燈的人 | 評估 PR readiness | 沒有 exact-head 綠燈 | BLOCK MERGE EVIDENCE |
| R24 | 螢幕閱讀器使用者 | Studio 查看 receipt | 未執行 accessibility path | UNKNOWN |
| R25 | 低頻維護者 | 一週後 promote | 最容易命中 stale candidate | P2，F1 |
| R26 | 兩程序併發 | revalidate/promote | 有鎖但缺 candidate-current identity | P2，F1 |
| R27 | 官方頁短暫 500 | revalidate | 正確 block，但舊 candidate lifecycle 不明 | P2，F1 |
| R28 | 官方頁 JS-only | revalidate | ambiguous block；candidate 應失效 | P2，F1 |
| R29 | 競賽已截止 | revalidate | expired block；candidate 應失效 | P2，F1 |
| R30 | 維護者做災難恢復 | 重建 receipt 狀態 | candidate/latest receipt 可分岔 | P2，F1 |

### 20 個探索 Persona

| ID | 背景/限制 | 任務/旅程 | 摩擦與結果 | 分級/建議/證據 |
|---|---|---|---|---|
| E01 | 文學社小編 | 分享 practice PDF | 內容沒有練習標記 | P3 |
| E02 | 比賽主辦方審查者 | 接收錯誤格式稿 | 本產品不能證明對方流程 | UNKNOWN |
| E03 | 國際競賽作者 | 跨時區截止 | date-only 語意可能不足 | RESEARCH backlog |
| E04 | PDF 簡章競賽 | 規則漂移 | extraction coverage 未實測 | NEEDS_RUNTIME |
| E05 | 需登入官方頁 | revalidate | 正確應 ambiguous，不新增登入平台 | DO NOT BUILD |
| E06 | 規則頁多語言 | AI policy extraction | 詞彙表覆蓋未知 | RESEARCH |
| E07 | 同日多次規則變更 | A→B→A | 直接觸發 F1 | P2 |
| E08 | A→B→C 漂移 | promote 最新 | 只能允許 C | P2 |
| E09 | 網站 DNS 攻擊面 | redirect | URL safety 需 runtime fixture | NEEDS_RUNTIME |
| E10 | 惡意官方頁 | 超大內容 | 資源限制未在本 finding 建立 | UNKNOWN |
| E11 | 資料最小化作者 | 查看 receipt | 不應含稿件全文 | PR5/6 static PASS |
| E12 | Git 使用者 | 追蹤 receipts | runtime files 可入版控有隱私成本 | NEEDS_REVIEW |
| E13 | 多作者共用電腦 | profile promote | 無帳號隔離，不在單人 local-first 核定範圍 | DO NOT COPY |
| E14 | 只寫自由創作 | 非 contest export | 不應被網路阻擋 | PR6 static PASS |
| E15 | 作品集作者 | practice export | 應可離線 | PR5 static PASS |
| E16 | 自架 change detector 使用者 | 外部監控規則頁 | 可作人工替代，不需整合平台 | SMALLER ALTERNATIVE |
| E17 | Duotrope 使用者 | 找市場後回本工具寫作 | 不需複製市場資料庫 | DIFFERENTIATOR |
| E18 | Chill Subs 使用者 | 外部追蹤 submission | 本產品只管作品與規則邊界 | SCOPE HOLD |
| E19 | Submittable 使用者 | 直接在主辦方平台投稿 | 不自動提交、不保存付款 | DO NOT COPY |
| E20 | 支援人員 | 解釋 blocked export | 需要 receipt/current candidate 一致 | P2，F1 |

固定 A01–J05 CLEAN 稽核與本組產品 Persona 分開；本輪沒有把此表算成新的合格 CLEAN round，也未產生 Synthetic Preference Share。

## 董事會多視角（模型推演）

- CEO：若只做三件事，(1) 合併前修 F1 的 candidate identity/invalidation，(2) 完成 #4 formal gate，(3) 取得會真正執行 Ruff+pytest 的 exact-head receipt。不做 marketplace、auto-submit、帳號協作。
- CPO：核心價值是 local-first 創作加可信的正式交付邊界；不以競品功能清單擴張。
- CTO / Staff：用現有 snapshot hash、receipt 與 file lock 完成 compare-and-apply；反對新增 DB/事件平台。
- UX / Research：`promote-revision` 必須說清楚 candidate 來源與目前狀態；PDF/DOCX practice 標記是次要但真實摩擦。
- Security / Privacy：不把稿件全文、prompt、key 放入 receipt；redirect/runtime 尚需隔離實測。
- QA：新增 A→B→A、A→B→C、candidate predecessor mismatch、併發 promote 測試；exact-head Actions 才能關驗證缺口。
- SRE：四個 PR 都是 zero-step failure，只能記 UNKNOWN，不能猜帳單、runner 或 YAML。
- Accessibility：Studio receipt/error 尚未有 keyboard/screen-reader evidence，阻止 CLEAN 但不自動建立 P1。
- Growth：Duotrope/Chill Subs 的市場資料不是本產品應複製的成長面。
- CFO：避免自建監控 SaaS與通知平台；現有 deterministic revalidation 足夠。
- Support：錯誤訊息需提供 latest receipt 與 candidate 是否仍有效。
- CPO/CTO 分歧：CPO傾向同時補 PDF/DOCX practice 標記；CTO認為先阻擋 F1 與 #4。結論是 practice 標記列 NEXT/P3，不阻塞最小安全修正。

## Red Team

- 反證：F1 需要使用者明確 promote，不是無互動遠端攻擊；因此不升 P1。
- 反證：官方頁恢復後可再次 revalidate，snapshot 會標 current；但正因 candidate 不失效，這不能推翻 finding。
- 更小替代：在 allow 狀態直接刪除 candidate 可關閉 A→B→A；仍須 predecessor compare 才涵蓋 A→B→C 與併發。
- 環境反證：所有 Actions 是零步驟失敗，不能用它們證明 F1；F1 完全來自 inspected source path。
- 規模反證：單人 local-first 不需要帳號、租戶、submission tracker 或 website-monitoring service。
- 過度工程反證：不需要通用 ledger；一個 candidate identity check 加失效規則即可。
- 已有功能反證：file lock 防同時寫入，但不驗證被寫入的 candidate 仍是 current，因此沒有解決 F1。

## Decision memo

服務對象：要在本機完成詩／散文／小說創作，並在正式投稿前得到可信規則與 provenance 邊界的個人作者。

選擇理由：相比完整 submission 平台，本產品的差異化是 local-first、作品生成/修改與正式交付 gate 同一條可追溯路徑。競爭不是複製市場規模，而是讓錯誤規則不 silent-pass。

- NOW：F1 candidate identity/invalidation；#4 formal policy gate；exact-head CI receipt。
- NEXT：PDF/DOCX practice 內容標記；瀏覽器 accessibility；少量官方頁隔離 smoke。
- LATER：多語 extraction 與 date-time timezone 的有界研究。
- DON'T：自動投稿、付款、主辦方 CRM、社群 marketplace、通用監控 SaaS、跨專案規則平台。
- 建議：`INVEST / SIMPLIFY / MAINTAIN`；PR #6 在 F1 關閉前不應合併。建議不是 merge、deploy 或實作授權。

## 寫入與追蹤統計

- 新 finding：1（P2）
- 新 Issue：0
- Issue/comment 更新：0
- 去重/鎖定：1 → Issue #3 + PR #6，`SKIPPED_LOCKED`
- P3 次要觀察：1
- Verified Fixed：0
- Runtime pending：browser/Studio、真實官方頁、PDF/DOCX inspection、exact-head CI、provider、長時間/恢復
- Portfolio：`NOT CLEAN, 0/2`
