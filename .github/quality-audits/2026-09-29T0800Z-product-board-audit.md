# 產品董事會增量稽核：taichung-police-intel 事件身分與 registry 邊界

- 查閱時間：2026-09-29 08:00–08:18 UTC
- 狀態：**PARTIAL / 2 NEW ACTIONABLE PRE-MERGE FINDINGS / SKIPPED_LOCKED_ACTIVE_PR / NOT CLEAN**
- 本輪只做稽核與分流；未改產品程式、CI、設定、權限或正式資料，未 merge、deploy、啟動 worker/GOAL，也未做正式環境失敗注入。
- Issue-quality v2：Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md
- 規則 blob SHA：8167e10798071d2276addaff6b201c6b0e904a2a
- 中央報告基線：Reese-max/autodev-ng main 99eba2458a82a4fb8e70c25c5a454014b568c659
- 產品 default HEAD：Reese-max/taichung-police-intel main 639697c815fe6fa48fca5022a0d410662d9a59c7
- 稽核中的 active PR #81 head：aabd839fc5b49ad2cc8e95bcad7fbeb782ecd269
- Inventory：Reese-max 自有 42；未封存 41；封存 1（obsidian-vault，內容庫／封存，排除產品缺陷開單）
- 完整 portfolio ranking：本輪未做；這是增量輪，不冒充已完成全量輪巡。

## 執行摘要與 Decision Memo

建議：**INVEST / SIMPLIFY**。核心使用者是需要從公開官方來源取得可稽核、可追溯、低噪音事件簡報的警政主管、情報分析員、承辦人、維運與稽核角色。產品選擇不應是「更多來源」或「更大的 AI 平台」，而應是「canonical identity、時間、registry version 與原始證據一致，且 partial/LKG 能安全持續發布」。

CEO 若只能做三件事：

1. 在 PR #81 合併前封住直接 named_event_id 與事件日期不一致的 canonical identity。
2. 讓 registry revision 遇到 incomplete snapshot 時，carried LKG 事件能被明確 revalidate/rebind，或在產出混合集合前以可恢復錯誤停止。
3. 完成 deployed shared registry、production alias/query 與 publication receipt 的 runtime 證據；CI 綠燈不能替代。

不做：新 graph database、跨 repo ontology/framework、模糊大規模 entity merge、擴大個資、購買大型情報平台、把合成 Persona 或董事會投票當真人需求或收益證據。

前三優先的原因：錯誤 canonical identity 會直接污染核心證據任務；registry/LKG 阻塞會破壞部分來源失敗時的恢復性；現有設計已足以局部修正，沒有證據支持大型重構。

## Discovery 與增量範圍

### Inventory 與近期變更

完整分頁 inventory 維持 42 owned repositories、41 unarchived、1 archived。自 2026-09-29T05:06:36Z 起的產品變更：

- taichung-police-intel main 639697c815fe6fa48fca5022a0d410662d9a59c7：合併 PR #80，為 test fixture isolation；屬測試變更，不自動算產品修復。
- taiwan-intel-dashboard main df7cee191aa5f7cb21581e9e93844f6a57e1ea3a：合併 PR #65，feed fallback；尚無本輪 production runtime receipt，僅記進度。
- 其餘新活動 PR 依 HEAD、review threads、CI 與既有 tracking 增量核對；沒有比本報告兩項更高的新 P0/P1。

PR #81 為 draft，branch feat/issue-31-entity-consumers，已對應既有 Issues #24、#27、#29，PR body 明確保留 #31 後續工作。Exact-head CI：
https://github.com/Reese-max/taichung-police-intel/actions/runs/36532128623
在 aabd839fc5b49ad2cc8e95bcad7fbeb782ecd269 成功（35 steps）。此收據只證明該 head 的既有 CI 通過，不證明 production alias、shared registry deploy、partial/LKG publication 或匿名公開查詢已通過。

## Finding 1：直接 NamedEvent ID 未校驗 occurrence date

- Tracking review：https://github.com/Reese-max/taichung-police-intel/pull/81#discussion_r4130411098
- PR：https://github.com/Reese-max/taichung-police-intel/pull/81
- Kind / Severity：**BUG / P1**
- Decision priority：**NOW / HIGH_PRE_MERGE**
- Triage：**NEEDS_REVIEW**
- auto_implementation：false
- Evidence：**SOURCE_CONFIRMED / 靜態可達因果鏈**
- Runtime：**NEEDS_RUNTIME_VERIFICATION**
- Confidence：high for source behavior；未宣稱 default branch 或 production 已受影響。

### 問題、影響與可到達流程

文件若直接提供 named_event_id、未提供 named_event_label，bind_document_entities 只確認 ID 仍在 active named_event 集合，未把 registry occurrence date 與文件 event_start_at 比較。可到達範例：

1. 輸入 named_event:forum-0920。
2. 同一文件 event_start_at 為 2026-09-21。
3. active-ID 檢查通過並蓋上 registry receipt。
4. 後續輸出使用 9/20 canonical identity，但 event_date 為 9/21；gateway 的 active-ID 檢查也會接受。

受影響：情報分析員、briefing 讀者、來源稽核者、依 canonical event ID 查詢或去重的 API/MCP/Web 使用者。現有替代只有人工同時核對 registry occurrence 與文件日期；若不處理，日期與 canonical identity 可互相矛盾，污染合併、查詢、引用與稽核。

### 固定證據

- PR head：aabd839fc5b49ad2cc8e95bcad7fbeb782ecd269
- scripts/public-event-fusion.py blob：0cf59b5851f1cb2a240e44afc88dab3852049143
- 對應區段：label 路徑會比較 named_event_date 與 observed event_start_at；direct ID 路徑僅檢查 active membership 後蓋 receipt。
- Review thread 於 2026-09-29T06:42:38Z 建立，最後讀回仍 unresolved、not outdated。

Fingerprint：

taichung-police-intel + direct named_event_id without label + event_start_at conflicts with registry occurrence date + active-ID-only validation + mismatched canonical identity accepted

### 最小有效修正與非目標

最小修正：對直接 named_event_id 解析 registry entity，使用文件 jurisdiction 與 observed date 比對 occurrence；只有一致才蓋 registry receipt。保留既有 label-resolution 路徑與 fail-closed 語意。

非目標：graph DB、通用 ontology、fuzzy match service、跨 repo identity platform、新資料來源。

驗收：

1. direct named_event_id 與 registry occurrence date、jurisdiction 一致時成功。
2. 直接 ID 日期衝突時，在 receipt 之前 fail closed。
3. direct ID jurisdiction 衝突或 registry entity inactive 時 fail closed。
4. label 路徑與合法 direct-ID 路徑保持相同 canonical output。
5. gateway/query 不可只以 active membership 重新放行矛盾事件。

## Finding 2：registry revision＋partial snapshot 產生無法建 store 的混合 receipt

- Tracking review：https://github.com/Reese-max/taichung-police-intel/pull/81#discussion_r4130411108
- PR：https://github.com/Reese-max/taichung-police-intel/pull/81
- Kind / Severity：**BUG / P2**
- Decision priority：**NOW / HIGH_PRE_MERGE**
- Triage：**NEEDS_REVIEW**
- auto_implementation：false
- Evidence：**SOURCE_CONFIRMED / 靜態可達因果鏈**
- Runtime：**NEEDS_RUNTIME_VERIFICATION**
- Confidence：high for source behavior；trigger 需要 registry revision 與 incomplete snapshot 同時發生。

### 問題、影響與可到達流程

reconcile_public_events 在 snapshot_complete=false 時會：

1. 以新 registry receipt 處理本輪 current events。
2. 把本輪缺少的 previous events 原樣帶回，只加 source_state=PARTIAL_LKG、lkg=true，舊 registry receipt 未 rebind。
3. build_event_store 要求整個 event collection 只有一組 registry receipt。
4. 因而拒絕「新 receipt current＋舊 receipt carried LKG」這個 reconcile 的正常輸出，publication 在下一個 complete snapshot 前被阻塞。

受影響：部分來源中斷時仍依賴 LKG 的排程維運者、briefing 讀者、事件查詢消費者與事故復原人員。現有替代是等完整 snapshot 或人工重寫資料；不處理會讓設計上應可恢復的 partial/LKG 路徑，在 registry 改版時無法發布。

### 固定證據

- PR head：aabd839fc5b49ad2cc8e95bcad7fbeb782ecd269
- scripts/public-event-fusion.py blob：0cf59b5851f1cb2a240e44afc88dab3852049143；carried previous event 原樣複製，只加 LKG state。
- intel_v2/query_domain.py blob：ccc70b5ed105948d30b4a472aed84fd35c2cca91；build_event_store 拒絕混合 registry receipt。
- Review thread 於 2026-09-29T06:42:38Z 建立，最後讀回仍 unresolved、not outdated。

Fingerprint：

taichung-police-intel + registry revision + incomplete snapshot + carried prior events retain old receipt + uniformity gate rejects legitimate partial/LKG event store + publication blocked

### 最小有效修正與非目標

最小修正二擇一：

- 在 carry prior events 時，以新 registry 明確 revalidate/rebind，保留原始 provenance 與 LKG 標記；或
- 在 reconcile 產出混合集合前，以明確、可恢復、可追蹤的錯誤停止，避免下游收到必然無法 build 的集合。

優先第一種，但必須對 inactive/superseded IDs fail closed，不能只覆寫 receipt。

非目標：新 event store service、雙資料庫、跨 repo registry orchestrator、移除 uniformity gate。

驗收：

1. registry 未變且 snapshot partial：既有 LKG 路徑不回歸。
2. registry 改版＋partial：carried events 全部經 current registry revalidate/rebind，或在 reconcile 階段明確 fail。
3. inactive/superseded carried ID 不可只換 receipt 後通過。
4. build_event_store 收到的 collection 只有一致 current receipt，且保留 LKG／source provenance。
5. 下一個 complete snapshot 能移除不再需要的 LKG，不產生重複 event。

## 去重、互斥與寫入決策

Issues #24、#27、#29 仍 open；PR #81、branch feat/issue-31-entity-consumers 與 review threads 都是活躍 owner/goal。故兩項 finding 均為：

- **SKIPPED_LOCKED_ACTIVE_PR**
- 不取得 Issue lock、不改 Issue scope、不追加重複 comment、不另建 Issue。
- 由本中央獨立報告保存證據；通過門檻的 finding 已有 active tracking。
- 新 Issue 0、Issue 更新 0、重開 0。
- 若 PR head 改變，以上 exact-head 證據必須重驗；本報告不把舊 review 當新 head 的自動結論。

## PR #80：測試驗證缺口，不誤報為產品 P2

PR #80 已於 main 639697c815fe6fa48fca5022a0d410662d9a59c7 合併，exact-head CI run 36531681924 成功，但仍有兩個 unresolved P2 review thread：

1. 測試的 aggregate_last_success_at expected value 由同一 production helper 計算，可能成為 circular oracle。
2. fixture 只放 qualifying rows，未覆蓋 FAILED/nonzero 排除語意。

本輪分類：**VALIDATION_GAP / severity NOT_ESTABLISHED / NEEDS_REVIEW**。原因是缺少負例測試不等於產品已壞，也沒有獨立 EXECUTED_REPRODUCTION 證明 runtime 回歸。既有 Issue #20 的真實 S-029 failure、成功 evening publication 與 upload-failure drill 仍待必要 runtime；測試-only merge 不算 VERIFIED_FIXED。

## 外部競品與替代工作流

查閱日皆為 2026-09-29 UTC。官方文件頁未穩定揭示單一發布／更新日者記 UNKNOWN，不虛構日期；下列是 **CONFIRMED product/data-model capability**，不是獨立效果、收益或優先級證據。

| 產品／替代 | 官方來源 | 日期 | 可核對能力 | 對本產品的邊界 |
|---|---|---|---|---|
| OpenSanctions | https://www.opensanctions.org/docs/identifiers/ | 頁面更新日 UNKNOWN；查閱 2026-09-29 | Canonical ID、referents/舊 ID、merge 後 stale identifier 解析 | Direct ID 不應只檢查 active；需 resolve/redirect 並重驗 occurrence context |
| OpenSanctions Statements | https://www.opensanctions.org/docs/statements/ | 頁面更新日 UNKNOWN；查閱 2026-09-29 | 欄位級 provenance 與 temporal ranges | 身分、時間與來源 receipt 應一起驗證 |
| Wikidata Data model | https://www.wikidata.org/wiki/Help:Data_model | 頁面更新日 UNKNOWN；查閱 2026-09-29 | typed values、statements、references | ID reference 不能替代事件日期語意 |
| Wikidata Qualifiers | https://www.wikidata.org/wiki/Help:Qualifier | 頁面更新日 UNKNOWN；查閱 2026-09-29 | 以 qualifiers 補充時間／上下文 | occurrence context 需可稽核地附著到 identity |
| GDELT Event Codebook v2 | https://data.gdeltproject.org/documentation/GDELT-Event_Codebook-V2.0.pdf | 文件版本 v2；本輪未確認發行日 | GlobalEventID 與事件日期欄位分離 | record ID 與 event date 必須分別驗證 |
| GDELT Cloud API | https://gdeltcloud.com/api-docs | 頁面更新日 UNKNOWN；查閱 2026-09-29 | 以 ID 查詢事件資料 | 查得到 ID 不表示日期／registry version 已相容 |
| 人工比對官方頁＋registry JSON | 替代流程 | 當前 | 可人工核對 identity/date/version | 可行但成本高且不可穩定自動重播；最小產品修正應消除這個人工步驟 |

結論：

- **MUST MATCH**：identifier 與 temporal/jurisdiction context 一起校驗；保留 source/version/provenance。
- **SHOULD BE BETTER**：registry revision 時提供 bounded LKG transition 與明確 mixed-version recovery receipt。
- **DIFFERENTIATOR**：官方政府來源、保守 canonical fusion、可公開查核的 evidence／publication chain。
- **DO NOT COPY**：廣泛 fuzzy entity merge、黑箱 confidence、全球 firehose、opaque scoring、把資料量當可信度。

## 模型產品董事會（非獨立專家共識）

- CEO：只做 direct-ID/date gate、partial/LKG rebind、live receipt；不做 graph DB 或新增來源。
- CPO：錯誤 canonical identity 比缺少新功能更傷害核心信任；對 partial 狀態要有清楚可恢復語意。
- CTO：保持 registry receipt uniformity gate；在 ingress/reconcile 修根因。
- Staff/Principal Engineer：共用既有 registry resolve/validate helper；不要平行建立第二套 identity service。
- UX Lead／Researcher：公開查詢應可看見 event date、canonical ID 與 registry receipt，不把 active ID 當完整正確。
- Growth：可信、可引用的在地證據先於來源廣度；無真人資料，不主張成長率。
- CFO：局部 validator/rebind 的成本與風險明顯低於平台重構；不給 ROI 偽精確值。
- Security／Privacy：只使用公開來源與既有 ID；不擴個資或權限面。
- QA：新增 direct-ID mismatch、registry-revision partial snapshot、inactive carried ID 負例。
- SRE：partial publication 需有可操作 receipt；CI 成功不能替代 deployed registry／production alias receipt。
- Accessibility：本輪沒有建立新的 UI/AT 缺陷；保留鍵盤、讀屏與行動 runtime pending。
- Support：錯誤需回答哪個 ID／日期／registry version 衝突，以及是否使用 LKG。

## 50 合成 Persona（模型推演；30 回歸＋20 探索）

這不是 50 位真人、票數、發生率、營收、市占或優先級證據；與固定 A01–J05 CLEAN 稽核分開。R01–R30 保留既有 public-source intelligence 回歸基線，X01–X20 是本輪探索。證據代碼：F1=direct ID/date finding，F2=registry/LKG finding，CI=exact-head run 36532128623，U=尚缺 runtime。

| ID | 背景／限制 | 目標／旅程 | 摩擦與結果 | 分級／建議／證據 |
|---|---|---|---|---|
| R01 | 警政主管／早會前 5 分鐘 | 開晨報辨識同一活動 | 錯誤 ID 可把 9/21 事件歸為 9/20 | P1；先擋矛盾；F1 |
| R02 | 警政主管／手機 | 查事件日期與單位 | active ID 看似有效但日期衝突 | P1；同時驗日期；F1 |
| R03 | 情報分析員／多來源 | 合併同一事件 | canonical ID 錯誤會污染 dedupe | P1；ingress fail closed；F1 |
| R04 | 承辦人／只讀 | 引用官方活動 | ID 與日期無法同時自證 | P1；暴露 receipt；F1 |
| R05 | 稽核人員 | 回溯事件 identity | direct-ID 路徑少一層校驗 | P1；共用 resolver；F1 |
| R06 | SRE／值班 | 部分來源失敗仍發布 | registry 改版後 LKG 形成 mixed receipt | P2；rebind/recover；F2 |
| R07 | QA／無 production 憑證 | 驗 direct ID 負例 | 現有 CI 未攔範例矛盾 | P1；加決定性測試；F1/CI |
| R08 | Data engineer | 建 event store | reconcile 正常輸出被 uniformity gate 拒絕 | P2；修 reconcile；F2 |
| R09 | 產品 owner | 判斷 PR 是否可合併 | 綠燈但兩條可達因果鏈仍在 | P1/P2；pre-merge block；CI/F1/F2 |
| R10 | 一般民眾／匿名 | 查公開活動日期 | 可能看到正確日期配錯 canonical identity | P1；一致性 gate；F1 |
| R11 | 記者／需引用 | 追官方事件 | 錯誤 ID 會誤連歷史證據 | P1；日期＋jurisdiction；F1 |
| R12 | 法遵／保守 | 確認來源與版本 | receipt 存在但未證明 occurrence 相容 | P1；驗後再蓋章；F1 |
| R13 | API 使用者 | 以 ID 查活動 | active membership 被誤當語意正確 | P1；query 二次防護；F1 |
| R14 | MCP 使用者 | 取 canonical evidence | 錯 ID 可傳到外部消費者 | P1；同一 canonical bundle；F1 |
| R15 | 維運者／夜班 | 處理 incomplete snapshot | 必須等 complete 才恢復 | P2；bounded LKG；F2 |
| R16 | 事故分析員 | 重建 partial publication | old/new receipt 混合缺明確邊界 | P2；保存 provenance；F2 |
| R17 | 新維護者 | 讀 registry contract | 兩個模組各自合理、組合不可用 | P2；整合測試；F2 |
| R18 | 支援人員 | 回答「為何沒發布」 | uniformity error 不指出 carried LKG | P2；可操作 error；F2 |
| R19 | 政策研究者 | 追事件沿革 | occurrence date 是 identity 必要部分 | P1；不可只看 ID；F1 |
| R20 | 主管助理 | 產出會議資料 | canonical link 錯誤會降低信任 | P1；block mismatch；F1 |
| R21 | 低視力使用者 | 讀 evidence table | 本輪未做讀屏 runtime | UNKNOWN；保留 pending；U |
| R22 | 鍵盤使用者 | 導覽事件詳情 | 未建立新缺陷 | NOT_ESTABLISHED；不開單；U |
| R23 | 行動網路使用者 | 快速查詢 | 不是 cache 問題而是 server identity | P1；修資料契約；F1 |
| R24 | Source auditor | 核對 registry 版本 | LKG receipt 未更新可能誤判來源 | P2；revalidate/rebind；F2 |
| R25 | 預算 owner | 比較外部平台 | 大平台不會修本地 contract | REJECT expansion；外部矩陣 |
| R26 | 隱私官 | 檢查資料邊界 | 修正不需新增個資 | 維持最小資料面；F1/F2 |
| R27 | 安全工程師 | 驗 fail-closed | 只覆寫 receipt 會掩蓋 inactive ID | P2；重驗非盲目 rebind；F2 |
| R28 | 法制人員 | 核對活動日期 | named event 日期不可與公告日期混同 | P1；typed occurrence；F1 |
| R29 | 主管／週報 | 聚合一週事件 | identity 污染可能跨報表擴散 | P1；入口阻擋；F1 |
| R30 | 備援維運者 | 從 LKG 恢復 | 正常 partial 路徑可能完全停擺 | P2；bounded recovery；F2 |
| X01 | direct ID 合法輸入 | 9/20 ID＋9/20 time | 應維持成功 | Regression acceptance；F1 |
| X02 | direct ID 日期衝突 | 9/20 ID＋9/21 time | 現況通過 | P1；必須拒絕；F1 |
| X03 | direct ID jurisdiction 衝突 | 台中 ID＋他區 context | 路徑未明確保護 | P1 candidate；納入同一驗收；F1 |
| X04 | inactive direct ID | 已退役 ID | active gate 已拒絕 | REJECT new issue；已有能力；source |
| X05 | label＋date 合法 | label/date 一致 | 既有路徑可 resolve | Preserve；source |
| X06 | label＋date 衝突 | label date 與 start 不同 | 既有路徑會拒絕 | Red-team counterexample；source |
| X07 | registry 未變＋partial | carry LKG | 不應因新修正回歸 | P2 regression；F2 |
| X08 | registry 改版＋partial | current＋carried old | 現況 mixed receipt 被拒 | P2；rebind/fail early；F2 |
| X09 | registry 改版＋complete | 全 current events | uniformity 應成功 | Regression acceptance；F2 |
| X10 | carried ID superseded | 舊 ID 有 redirect | 需 resolve 且保留 provenance | P2；bounded migration；F2 |
| X11 | carried ID deleted | 無合法 current mapping | 不可盲目換 receipt | P2；fail closed；F2 |
| X12 | 兩輪 consecutive partial | 持續 LKG | 不可無限隱性漂移 | P2；顯示 age/version；LIKELY |
| X13 | complete snapshot 恢復 | LKG 不再需要 | 應清除 carry state | P2 regression；F2 |
| X14 | CI 全綠 | exact head | 仍不能證明兩個負例 | Validation limit；CI |
| X15 | production alias 查詢 | deployed gateway | 本輪無 live receipt | NEEDS_RUNTIME_VERIFICATION；U |
| X16 | shared registry deploy | 版本切換 | 本輪無真實部署證據 | NEEDS_RUNTIME_VERIFICATION；U |
| X17 | 競品切換者 | 從 OpenSanctions 類流程來 | 預期 ID redirect＋provenance | RESEARCH only；純模擬 |
| X18 | 人工 spreadsheet 替代 | 手動核對日期 | 可行但高人工成本 | P2；小修正優先 |
| X19 | 無障礙 reviewer | 檢查 error 語意 | 未執行 AT 測試 | NEEDS_EVIDENCE；U |
| X20 | Support incident drill | registry update＋source outage | 需明確 recovery receipt | P2；最小隔離演練；F2/U |

Synthetic Preference Share：**未計算**。沒有真人樣本，亦不把上述模型推演用作發生率、營收、優先級或董事會 PASS。

## Red Team

1. **已有功能是否已解決 F1？** label 路徑已校驗日期，但 direct-ID 路徑繞過；不能推翻 finding。
2. **direct ID 是否不可達？** PR #81 明確接受文件 supplied named_event_id，gateway 亦檢查 active ID，故 source path 可達。若 owner 改契約禁止外部/direct ID，則可降級並移除該路徑；目前沒有這個契約。
3. **F2 是否只是理論？** 需 registry revision＋partial 同時發生；嚴重度因此為 P2，不升 P1。PR 同時引入 versioned registry 與 partial/LKG contract，組合路徑具產品意義。
4. **可否移除 uniformity gate？** 不建議；會允許查詢在不透明 mixed version 上運作。應修 ingress/reconcile 根因。
5. **可否只覆寫 carried receipt？** 不可；若 ID inactive/superseded，盲目換 receipt 會偽造已驗證狀態。
6. **是否需要新服務？** 不需要；重用 registry resolve/receipt helper 與現有 reconcile。
7. **CI 是否證明無問題？** 否；CI success 只證明現有測試，兩個 review 負例未被覆蓋。
8. **是否搶活躍 scope？** PR #81 有 owner、branch、reviews 與 linked Issues；故 SKIPPED_LOCKED_ACTIVE_PR，不修改 tracking。

## NOW / NEXT / LATER / DON'T

- **NOW**：F1 direct-ID/date/jurisdiction gate；F2 current-registry revalidation/rebind 或 reconcile 前 fail early；保留 review threads 作 merge blocker。
- **NEXT**：exact-head tests 加入兩個負例；完成 deployed shared registry、production alias/query、partial/LKG publication receipt。
- **LATER**：基於真人任務研究的查詢 UX、角色化 view、accessibility runtime。
- **DON'T**：新 graph DB、通用 entity platform、fuzzy auto-merge、更多來源、opaque score、跨縣市平台、付費承諾。

## 回歸與 runtime 狀態

- F1：**PRE_MERGE_REPRODUCIBLE_FROM_SOURCE / NEEDS_RUNTIME_VERIFICATION**
- F2：**PRE_MERGE_REPRODUCIBLE_FROM_SOURCE / NEEDS_RUNTIME_VERIFICATION**
- PR #80 兩項：**VALIDATION_GAP / NOT_ESTABLISHED**
- Verified Fixed：0
- Confirmed regression on default branch：0
- PR #81 exact-head CI：success，但不是 product/live verification。
- 寫結論前需再次核對 PR #81 HEAD 與 thread state；若 head 改變，應以新 head 重驗，不沿用本輪結論。
- Portfolio：**NOT CLEAN**。本輪不是固定 A01–J05 完整輪，也沒有兩個完整合格輪次與必要 runtime 證據。

## 強制統計與游標

- New actionable findings：2
- New Issues：0
- Updated Issues：0
- Reopened Issues：0
- Research Issues：0
- Duplicate avoided：2（映射既有 #24/#27/#29＋PR #81）
- SKIPPED_LOCKED_ACTIVE_PR：2
- Validation gaps：2（PR #80；severity NOT_ESTABLISHED）
- Scope narrowed：2
- Severity：P0 0／P1 1／P2 1／P3 0
- Verified fixed：0
- Confirmed default-branch regression：0
- Issue write blocked：0
- Report write：本檔案以獨立 audit branch/PR 寫入，待 read-back 驗證
- Remaining：PR #81 新 head 回歸、production alias/shared registry runtime、PR #80 Issue #20 runtime、全量 portfolio continuation
- Fair-rotation cursor：本輪優先 taichung-police-intel active P1；下一輪從未完成長尾游標續行，不把本輪當完整 inventory CLEAN round。
