# Product Board Delta — taichung-police-intel

- 查閱日期：2026-09-16 UTC
- 狀態：**PARTIAL / NEW ACTIONABLE PR BLOCKER / SKIPPED_LOCKED / NOT CLEAN**
- Quality v2 規則 blob：`8167e10798071d2276addaff6b201c6b0e904a2a`
- Default branch：`main`
- 稽核 default HEAD：`e1d081bd04824c062c7ee99e7d74f9e478240743`（audit-only）
- 稽核產品基線：`0340db2`（其後無 default-branch 產品修正）
- PR #26 稽核 head：`2ac80ef6766321166d4d709566a53a72c7e7a70e`
- Inventory baseline：Reese-max 自有 42；未封存 39；封存 3
- 本輪游標：`taichung-police-intel` → 下輪 `soundbox-offline`

## Executive decision

**INVEST / SIMPLIFY**。先讓「已驗證候選 → 公開發布 → 匿名可驗證 receipt → 才推進 canonical baseline」成為不可分割的發布契約；在此之前不擴大資料源、AI 摘要、跨縣市平台或付費監測服務。

CEO 若只能做三件事：

1. 修正 #20／PR #26 的發布狀態順序，失敗時不可吞掉尚未公開的變更。
2. 以可重播的 upload／deploy／anonymous verification receipt 完成 #20 回歸。
3. 再處理 #22／PR #16 的 collector 完整性與失敗語意。

不做：增加來源數、建立新 database／workflow framework、採購大型全球情報平台、把合成 Persona 當真人需求票數。

## Discovery 與執行證據

### Default branch 仍可重現既有 #20

[Scheduled run 35112683423](https://github.com/Reese-max/taichung-police-intel/actions/runs/35112683423)（2026-09-16T15:03Z）在 `e1d081b`：

- Refresh collection：成功
- V1 verify／V2 build／V2 verify／完整 static build：成功
- `Preserve V1 and V2 publication evidence as one commit`：失敗
- Pages artifact upload／deploy：跳過

這是既有 [#20](https://github.com/Reese-max/taichung-police-intel/issues/20) 的 protected-main／publication failure fingerprint；不另開重複 Issue，也不把多 repo 零步驟或跳過推測為帳務、額度或 YAML 問題。

### PR #26 新 finding：baseline 在公開發布前先前進

[PR #26](https://github.com/Reese-max/taichung-police-intel/pull/26) 的 workflow 順序為：

1. restore publication state；
2. collect／verify／build；
3. `publication-state-branch.py persist` 將六個新狀態檔 commit/push；
4. upload Pages artifact；
5. deploy；
6. `publication-outcome.py` 僅回報結果。

`persist` 已把本輪候選寫成下一輪 restore 的比較基線；若第 4 或第 5 步失敗，公開站未收到新版本，但下一輪會從「未曾公開」的新狀態開始比較，可能把該變更視為已消費而不再出現在 briefing。測試更明確固定 `persist < pages_upload`，而 outcome reporter 沒有 rollback、promotion 或獨立 published pointer。

- **Fingerprint**：`taichung-police-intel / publication-state / Pages upload or deploy fails after state persist / next run restores unpublished baseline and may omit unserved changes / state branch advances before publication receipt`
- **Kind / Severity**：`BUG / P1`
- **Decision priority**：NOW
- **Evidence**：`SOURCE_CONFIRMED`
- **Triage**：`NEEDS_REVIEW`
- **Runtime**：`NEEDS_RUNTIME_VERIFICATION`
- **auto_implementation**：`false`
- **受影響角色**：排程維運者、警政／公共服務讀者、內容 owner、稽核與事故復原人員
- **目前替代**：人工比對 state branch、Pages artifact 與公開站；無可靠自動復原
- **不處理後果**：可到達的 deploy failure 可能讓尚未公開的情報變更在後續輪次被靜默略過

未宣稱正式資料已實際遺失，也未對正式部署注入失敗。分級依據是核心定時發布的完整性因果鏈已由 source 明確成立，而不是競品差異、模型票數或缺少某種 framework。

### 最小有效修正

沿用 #20，不新增平台：

1. 將本輪輸出先保存為 staged candidate，不覆寫 canonical published baseline。
2. 僅在 Pages deploy 成功，且最好完成匿名 hash/version 驗證後，promotion 一次。
3. 失敗與重試保留 candidate／receipt，下一輪仍須重送未公開變更。
4. 決定性回歸：persist 成功後 upload/deploy 失敗 → 下一輪仍產生同一未公開變更；成功 → baseline 僅推進一次；retry idempotent。

非目標：新資料庫、通用事件溯源框架、額外來源、AI 信心系統、跨 repo publication platform。

### 互斥與映射

[#20](https://github.com/Reese-max/taichung-police-intel/issues/20) 已明列「失敗重試不得 silently swallow unpublished changes」及 publication state machine 驗收；PR #26 正在實作該範圍，且有活躍 owner、branch、review 與成功的 [CI run 35123866525](https://github.com/Reese-max/taichung-police-intel/actions/runs/35123866525)。因此本輪：

- `SKIPPED_LOCKED`：#20／PR #26
- 不加 issue lock、不改 Issue scope、不在 PR 插手、不建立重複 Issue
- finding 以本中央獨立報告映射；CI 綠燈只證明既有 tests 通過，不證明失敗語意正確

## 次要 evidence backlog

PR #26 restore 只在恢復 0 個檔案時失敗；部分缺少 1–5/6 state files 仍可繼續，而 persist 端才要求全六檔。部分檔案可能被 collect/build 重建，實際影響尚未建立，因此本輪列為 **P2 candidate / NEEDS_EVIDENCE**，不拆新單。最小實驗是 partial-state fixture 驗證 fail-closed 或完整重建，不延伸為新 registry。

## 外部競品與替代工作流

查閱日皆為 2026-09-16 UTC；以下為官方產品資料的 **CONFIRMED product claims**，不是獨立效果證據。

| 產品／替代 | 官方來源 | 對照訊號 | 判定 |
|---|---|---|---|
| FiscalNote / PolicyNote | [FiscalNote](https://fiscalnote.com/)、[PolicyNote API](https://fiscalnote.com/newsroom/policynote-api-enhancements-annoucement) | 政策監測、分析、API/MCP；平台廣度高 | 不複製全球平台廣度；本產品應以在地官方來源與可驗證發布較佳 |
| Feedly AI | [Feedly AI](https://feedly.com/ai)、[AI Actions guide（2026-04-02）](https://docs.feedly.com/article/741-guide-to-ai-actions-for-feedly-market-intelligence) | 聚合、優先化、AI actions | SHOULD BE BETTER：每個結論保留原始官方證據與 release receipt |
| Feedly Market Intelligence | [官方頁](https://feedly.com/market-intelligence) | AI Feeds、dashboard、reference links | MUST MATCH：不漏掉已偵測但尚未公開的變更 |
| Meltwater | [官方頁](https://www.meltwater.com/en) | 媒體／社群訊號、alerts、executive reports | DO NOT COPY：龐大訊號面與付費平台複雜度 |
| Dataminr First Alert | [產品頁](https://www.dataminr.com/products/first-alert/)、[public-sector insight（2026-01-14）](https://www.dataminr.com/resources/insight/the-value-of-real-time-information-for-the-public-sector/) | 公部門即時事件情報 | DIFFERENTIATOR：台中警政角色、官方來源、可稽核的低噪音 daily briefing |
| 人工瀏覽官方網站＋試算表 | 替代流程 | 可人工確認公開狀態，但耗時、不可穩定追溯 | 本產品須先做到可靠的「未公開不算完成」才值得替代人工 |

框架：

- **MUST MATCH**：候選內容不可在發布失敗時消失；明確 freshness／source／public receipt。
- **SHOULD BE BETTER**：官方證據直連、低噪音、保守 UNKNOWN、可重播復原。
- **DIFFERENTIATOR**：台中警政與公務角色導向、官方來源、GitHub/Pages 可稽核鏈。
- **DO NOT COPY**：全球來源 firehose、黑箱 AI confidence、社群監聽、昂貴 enterprise breadth。

## 模型產品董事會（非獨立專家共識）

- CEO：#20 發布完整性優先於任何新來源；只做上列三件事。
- CPO：使用者看到「無新變更」時，必須能排除「只是尚未成功發布」。
- CTO：candidate 與 published baseline 必須分離；promotion 由發布 receipt 驅動。
- Staff/Principal Engineer：重用現有 state branch；加一個 staging/promotion 邊界，不另建服務。
- UX Lead／Researcher：公開頁需能顯示 freshness 與最後成功發布，不把內部 build 成功冒充可見。
- Growth：可靠的在地簡報比更多來源更能建立信任；合成偏好不可當成成長證據。
- CFO：先修既有 GitHub/Pages 鏈，不採購大型情報平台。
- Security／Privacy：保持官方公開來源與最小資料面；不新增個資或正式失敗注入。
- QA：增加 upload/deploy failure、retry、idempotency 與 next-run replay 測試。
- SRE：只有 deploy＋匿名驗證成功才 promotion；失敗須保留可操作 receipt。
- Accessibility：本輪沒有建立新的無障礙缺陷；需另以鍵盤／讀屏 runtime 驗證。
- Support：錯誤訊息須能回答「哪一代未公開、是否會重試、公開站目前是哪一代」。

## 50 合成 Persona delta

這是模型合成推演（30 回歸＋20 探索），不是訪談、真人票數、發生率、市占或收益證據。每列的證據欄只表示本輪可用依據。

| ID | 背景／限制 | 目標與任務 | 摩擦／結果 | 分級／建議／證據 |
|---|---|---|---|---|
| R01 | 警政主管／早會前 5 分鐘 | 開啟晨報找新政策 | deploy 失敗後可能誤見無更新 | P1；未公開變更必須重送；SOURCE |
| R02 | 警政主管／手機 | 晚間確認重大變動 | 站上仍是舊代但內部 baseline 已前進 | P1；顯示 published generation；SOURCE |
| R03 | 承辦人／低頻使用 | 追一項法規來源 | 無法判斷 build 與公開狀態 | P2；receipt 連結；SOURCE |
| R04 | 情報分析員／多來源 | 比對今日 briefing | 可能漏掉失敗輪次內容 | P1；next-run replay；SOURCE |
| R05 | 稽核人員／只讀 | 追查某結論何時公開 | candidate commit 不等於公開 receipt | P2；分離 receipt；SOURCE |
| R06 | SRE／值班 | 從失敗 run 復原 | state 已前進但 deploy 未做 | P1；staged/published 分離；SOURCE |
| R07 | QA／無正式憑證 | 測 upload 失敗 | 現有測試固定 unsafe ordering | P1；決定性 failure test；SOURCE |
| R08 | 產品 owner／時間少 | 判斷本輪是否完成 | build 綠燈易被誤認發布成功 | P2；完成定義綁 receipt；SOURCE |
| R09 | 公務聯絡人／桌機 | 分享公開連結 | 連結仍舊但內部視為已消費 | P1；promotion after verify；SOURCE |
| R10 | 一般民眾／匿名 | 讀最新公開頁 | 不知道頁面是否 stale | P2；freshness header；LIKELY |
| R11 | 記者／需引用 | 找原始官方證據 | release state 不透明 | P2；來源＋版本；SOURCE |
| R12 | 法遵／保守 | 確認未發布資料不算完成 | 現況違反語意 | P1；明確 PENDING_PUBLICATION；SOURCE |
| R13 | 開發者／重試 workflow | rerun 失敗 job | 可能以新 baseline 產生空 diff | P1；idempotent replay；SOURCE |
| R14 | 維運者／只看 Actions | 判讀 skipped deploy | outcome 可回報但無 rollback/promotion | P2；actionable receipt；SOURCE |
| R15 | 主管助理／下載摘要 | 準備會議資料 | 最新變更可能缺席 | P1；未公開候選保留；SOURCE |
| R16 | 研究者／歷史比較 | 回看某日快照 | candidate/published 混在同一狀態 | P2；兩代指標；SOURCE |
| R17 | 資料工程師／批次 | 理解 generation | 六檔一次 persist 先於 deploy | P1；atomic promotion；SOURCE |
| R18 | 網路不穩使用者 | 重新載入公開站 | 客戶端重試無法修正 server 未發布 | P2；last-success metadata；LIKELY |
| R19 | 支援人員 | 回答「今天沒資料？」 | 無法區分無變更與發布失敗 | P1；狀態詞彙；SOURCE |
| R20 | 新維護者 | 閱讀 workflow | 測試將 persist-before-upload 當契約 | P1；改驗收順序；SOURCE |
| R21 | 低視力使用者 | 讀文字 briefing | 本輪未有輔助科技證據 | UNKNOWN；另排 runtime；UNKNOWN |
| R22 | 鍵盤使用者 | 導覽 evidence | 本輪未建立缺陷 | UNKNOWN；不開單；UNKNOWN |
| R23 | 行動網路使用者 | 快速查重大事件 | 新頁未 deploy 則快取不是根因 | P1；先修發布鏈；SOURCE |
| R24 | 主管／只讀 headline | 判斷是否採取行動 | 漏報比版面不美更嚴重 | P1；可靠性優先；SOURCE |
| R25 | 採購／成本敏感 | 比較大型平台 | 既有 GitHub/Pages 可更小修正 | P2；不採購；CONFIRMED |
| R26 | 隱私官 | 檢查新增資料面 | finding 不需新增個資 | 保持最小範圍；SOURCE |
| R27 | 安全工程師 | 檢查 branch trust | state push 與 public deploy 是不同信任事件 | P1；receipt gate；SOURCE |
| R28 | 法制人員 | 核對政策文字 | 未公開代不應成為下一輪基線 | P1；published pointer；SOURCE |
| R29 | 主管／週報 | 彙整一週變更 | 一輪遺漏可能持續消失 | P1；replay until published；SOURCE |
| R30 | 備援維運者 | 從 last-known-good 恢復 | outcome report 無 promotion/rollback | P1；保留 LKG；SOURCE |
| E01 | Pages upload failure | 模擬 artifact 上傳失敗 | persist 已成功 | P1；下一輪必重送；SOURCE |
| E02 | Pages deploy failure | artifact 成功、deploy 失敗 | baseline 已前進 | P1；deploy receipt gate；SOURCE |
| E03 | 匿名驗證失敗 | deploy 宣稱成功但 hash 不符 | 現流程無 public promotion gate | P1；匿名 hash；LIKELY |
| E04 | rerun 同一 generation | 避免重複公告 | 需可重播且只 promotion 一次 | P2；idempotency；SOURCE |
| E05 | schedule 下一輪 | 前輪未發布 | 可能產生空 diff | P1；carry pending candidate；SOURCE |
| E06 | partial state restore | 缺 1/6 檔 | restore 不 fail closed | NEEDS_EVIDENCE；fixture；SOURCE |
| E07 | state branch 全缺 | restore 0 檔 | 現有 fail-closed 已覆蓋 | REJECT new issue；已有能力；SOURCE |
| E08 | source partial | 官方來源少一項 | PR head 已加 source coverage fail-closed | DEFER；不重複；SOURCE |
| E09 | data unchanged | 真正無變更 | 不應誤發「失敗」 | P2；區分 no-change/publish-failed；SOURCE |
| E10 | manual dispatch | 手動重跑 | 應沿用同 candidate receipt | P2；canonical generation；SOURCE |
| E11 | concurrent schedule | 兩輪重疊 | 本輪未建立實際競態 | UNKNOWN；不升級；UNKNOWN |
| E12 | branch push transient | state persist 失敗 | deploy 不會開始，較安全 | Red-team counterexample；SOURCE |
| E13 | upload transient | 下一次成功 | 目前可能吞變更 | P1；retry replay；SOURCE |
| E14 | deploy succeeded | 公開完成 | 才允許 baseline promotion | P1 acceptance；SOURCE |
| E15 | public cache delay | deploy 成功但匿名舊版 | 需 hash/version 驗證 | P2；bounded retry；LIKELY |
| E16 | source revision during failure | 官方頁再次更新 | staged candidate 必可合併或重算 | P2；重算但不遺失；LIKELY |
| E17 | mobile supervisor | 僅讀摘要 | 需要明確最後成功時間 | P2；freshness；LIKELY |
| E18 | incident reviewer | 事後重建 | candidate、deploy、public 三 receipt | P2；鏈結；SOURCE |
| E19 | budget owner | 評估外部平台 | 大型平台不修本地 release bug | REJECT expansion；CONFIRMED |
| E20 | competitor switcher | 從 Feedly/Dataminr 切換 | 更看重在地證據與可靠發布 | RESEARCH only；不作優先級證據；SIMULATION |

## Red Team

1. **可能已有功能解決？** 有 outcome report 與 state branch，但沒有「成功發布後 promotion」；不能推翻 finding。
2. **更小替代？** 不需新服務；改 promotion 時點＋三個回歸即可。
3. **錯誤根因？** Default branch 的 GH006 是既有 #20；本 finding 是 PR #26 引入的另一個 pre-merge release-state root cause，兩者不重複。
4. **只是 CI 環境？** 即使 upload/deploy failure 尚未被本輪實際注入，workflow ordering 與 restore 語意在任何 failure 環境都成立；仍標 SOURCE_CONFIRMED、NEEDS_RUNTIME_VERIFICATION。
5. **需求不明？** #20 已明確要求失敗不得吞 unpublished changes，故不是新方向推測。
6. **過度工程？** candidate/published 分離可在既有 state branch 完成；拒絕 database、queue、event-sourcing framework。
7. **是否應降級？** 若 deploy failure 不可到達可降級；但 GitHub Pages upload/deploy 是外部步驟，既有 run 已證實發布鏈可失敗，因此保留 P1，且不宣稱正式事故。
8. **是否搶活躍 scope？** 是，PR #26 有活躍 owner；因此只留中央報告，SKIPPED_LOCKED。

## NOW / NEXT / LATER / DON'T

- **NOW**：#20／PR #26 candidate→published promotion、失敗重送、匿名 receipt；default #20 仍 `STILL_REPRODUCIBLE`。
- **NEXT**：#22／PR #16 collector 完整性；PR #26 partial restore fixture。
- **LATER**：查詢、角色化 evidence views、經真人研究證實的 UX 改進。
- **DON'T**：更多來源、全球監測平台、AI 推薦／信心分數、跨縣市 SaaS、原生 App。

## 回歸狀態與限制

- #20 default branch：**STILL_REPRODUCIBLE**（run 35112683423）。
- PR #26：**PARTIALLY_FIXED / PRE-MERGE_BLOCKED / SKIPPED_LOCKED**。
- Verified Fixed：0。
- PR head CI 成功不等於 upload/deploy failure path 正確。
- 未執行正式 Pages 失敗注入、未更動正式資料、未 merge/deploy、未啟動 worker、未做瀏覽器/讀屏測試、未完成匿名 public hash 驗證。
- 本輪非完整 portfolio CLEAN，不滿足固定 A01–J05 的兩個完整合格輪次與必要 runtime 證據。

## 強制統計

- Total Findings：1
- New Issues Created：0
- Updated Existing Issues：0
- Reopened Issues：0
- Research Issues：0
- Duplicate Avoided：2（既有 #20 GH006；#22／PR #16）
- SKIPPED_LOCKED：1（#20／PR #26）
- Rejected／Deferred：1（partial restore impact 尚未成立）
- Scope Narrowed：1
- Severity Calibration：P0 0／P1 1／P2 0／P3 0
- Verified Fixed：0
- Issue Write Blocked：0
- Finding mapping：1/1（#20＋PR #26）
- Cursor：`soundbox-offline`
