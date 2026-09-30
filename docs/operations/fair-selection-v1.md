# 品質排程公平選取與持久游標 v1

適用：self-review、upstream-watch、runtime-evidence、research-experiment、delivery-watch。這是五個既有排程的選取／接續契約，不是產品執行器程式、已部署的強制排程器或完成巡檢的證據。不更改頻率，不啟動實作 worker，不修改產品原始碼／CI／部署／secrets／權限；Issue Quality v2、原任務證據標準、授權與 github-issue-lock:v1 繼續適用。

## 狀態位置與初始化

| task | 公開資料的狀態檔 |
|---|---|
| self-review | docs/operations/self-review/cursor.json |
| upstream-watch | docs/operations/upstream-watch/cursor.json |
| runtime-evidence | docs/operations/runtime-evidence/cursor.json |
| research-experiment | docs/operations/research-experiments/cursor.json |
| delivery-watch | docs/operations/delivery-health/cursor.json |

每輪先讀自己的狀態與必要既有報告。BOOTSTRAP_REQUIRED 表示只建立保存位置，尚未列舉候選或驗證輪巡；空陣列不代表沒有待辦。初次從可核對的既有報告接回進度並記來源，未知時間保留 null，不捏造歷史、不清空既有進度。沒有可恢復歷史時建立當前候選基準，但不宣稱以前未曾檢查。

中央庫只保存確認可公開的資料；私有 repo 名稱、ID、URL、分支、可識別 fingerprint 或其雜湊均不得寫入公開狀態。私有狀態沿用原私有 repo 的適用 audit 路徑或真正可跨輪讀回的私密任務狀態。若無安全持久保存能力，記 STATE_STORAGE_BLOCKED，不排除該 repo、不宣稱全 portfolio 已涵蓋。各可見範圍分開計數。

## 候選發現與公平性

將低成本 inventory／候選發現和深入檢查分開。使用當前可存取、Reese-max 自有、未封存清單及任務適用條件；完整處理必要分頁，不能只拿最近 updated 的第一頁作全部候選。保存 inventory_cursor／discovery_watermarks／coverage；未列完標 PARTIAL，不阻止對已知候選做有界工作，但須持續推進未發現範圍。時間游標只推進已完整處理的來源區間，未讀頁面／事件保留接續點，重疊回查後按穩定 ID 去重。

工作 key 用 repository_id + PR/Issue number + 穩定情境／研究 ID；repo 名称可更新，HEAD／假設版本另存，不能因 push 改 key 並重置等待年齡。公平輪次保留既有順序，新 repo／候選加入待巡部分，不每輪從熱門排序重建。關閉／封存／不適用要有證據；讀不到不能當刪除。

五項都使用 PRIORITY 與 AGING 兩條主選取 lane。存在可處理 AGING 候選時，最多連續兩次主目標選取來自 PRIORITY，下一次主目標必須來自 AGING。這是跨輪的選取份額，不是要求每輪深入三個專案，也不是時間比例。若一輪有餘力處理第二個目標，優先補另一 repo 的 aging 工作；不為配額造工作。

priority_streak 在成功保存主目標選取時增加；達 2 記 aging_due。只有對 aging 候選完成有證據的實質檢查／有界研究步驟，才清除 aging_due；單純列出候選、撞鎖、缺權限或逾時不算。AGING 候選卡住時保存原因與接續位置，選下一個可處理 aging 候選，不讓队首阻塞整輪。沒有 aging 候選可借用 priority，但保留等待狀態。工具全局失效則停止，不能忙迴圈逐項重試。

僅新確認且本輪有可行必要處置的 P0 緊急事件可插隊；記 emergency_fingerprint／新證據／被延後目標，不清除 aging_due。同一未變更事件不能每輪充當新緊急事件；緊急處置後第一個可用名額償還 aging。所有例外仍不擴大操作權限。

AGING 先照顧本公平輪次尚未服務的 repo，在其內挑最久未完成本任務檢查的適用項目；未知歷史列 NEVER_VERIFIED，以 first_seen_at／PR created_at 作排序輔助，不當成 last_checked_at。再以穩定 repo/work key 打破平手。活躍 repo 有大量 PR 不能吃光所有 aging 名額。等待年齡提高選取次序，不改 Issue severity，也不直接判工作失敗。

## 各任務的具體選取

### self-review

PR fair cursor：next_fair_target 必須能定位 repo + PR。候選涵蓋所有可讀 open PR，不因無近期更新忽略舊 PR。PRIORITY 看 review 後實質 head 變更、完成宣稱與最新 source 矛盾、新的重要 review 證據；AGING 為 oldest-unreviewed，包括從未完整核對、最新 head 未受完整核對、未解 thread 長期未確認。保存 last_reviewed_head_sha、last_complete_review_at、review_due_since、oldest_unresolved_thread_at 及 files/threads subcursor。新 push 不重置既有 review_due_since；只有實際核對完成才刷新。現行 head 已完整核對且無新事件不為 aging 重讀；必要的未到期／排除理由要保留。活躍 PR 可唯讀審查；ownership 只限制衝突寫入，不應讓所有 open PR 被排除。

### upstream-watch

每 repo 保存 last_full_dependency_check_at、dependency_signature、source_checked_through、remaining_dependencies。days_since_last_check = floor((本輪 UTC - last_full_dependency_check_at)/86400 秒)，未知為 null/NEVER_VERIFIED，不填零。AGING 依最久未完整查核選取，repo 半年無 commit 也保有資格；不得以 updated_at 代替查核時間。PRIORITY 看已對應的上游新訊號、實際受影響版本與接近的正式期限。只讀 manifest 或單一套件公告不刷新整 repo 的 full-check 時間；局部查核存子游標。Aging 不提高安全嚴重度，不因出了新版自動建單。

### runtime-evidence

穩定 work key = repo + Issue/finding + 情境；被測 SHA／環境另存。先把 BLOCKED_ENVIRONMENT、BLOCKED_AUTHORIZATION、WAITING_FIX、SKIPPED_LOCKED 從 active_queue 移入 waiting_queue；不關 Issue、不降 severity、不移除待驗證標記、不改外部 worker queue。保存 blocked_fingerprint、blocked_since、last_attempted_at、wake_conditions、next_probe_at、last_relevant_evidence_version、resume_subcursor。

PRIORITY 只選目前具備必要條件的已合併待驗證修正／有證據 P0/P1／核心解除阻塞；AGING 選最久未取得必要執行證據且本輪可處理的情境。部分路徑可跑、部分缺 provider 時分開記錄，不能將整 repo 永久封鎖。WAITING_RESULT 保存既有 run ID，讀回而不重複派發。PASS/FAIL/LOCAL/MOCK/CI/PROVIDER 證據界線與原任務一致。

### research-experiment

每輪最多推進一個窄研究，保存 research_id、hypothesis_version、last_attempted_at、last_progress_at、completed_steps、resume_subcursor、blocking_fingerprint、wake_conditions、next_probe_at、evidence_refs、decision。PRIORITY 看能解除既有決策且有新可用證據的研究；AGING 按公平 repo／等待最久研究接續。若有其他可處理研究，同一 research_id 最多連續兩輪主處理，之後切到另一 repo／研究；有界步驟完成須保存，不丟棄進行中實驗。INCONCLUSIVE 可帶新資料或新可執行步驟繼續，只有重述未知則移 waiting，不假造 BUILD/NARROW/REJECT。終結結論無新實質證據不重跑。

### delivery-watch

使用 priority → priority → aging 的跨輪配額。PRIORITY 看新的實質 code/review/check／依賴解除事件；AGING 看最久未完成交付診斷的既有 PR／進行中 Issue，不以 updated_at 判卡死。保存 last_delivery_check_at、last_product_progress_at、first_blocked_at、blocking_fingerprint、next_fair_target、last_reviewed_head_sha、discovery_watermarks。bot 留言、lock、audit-only commit 不刷新 last_product_progress_at。已確認未變阻塞進 waiting，仍定期輕量核對能否接續；不修改活躍 scope、不啟動修復。

## Waiting 不是遺忘

blocked_fingerprint 使用穩定阻塞原因 + 依賴／授權範圍，不包含當前時間或所有 HEAD；相同阻塞不能靠 audit commit 改名復活。環境／授權／資料／相關修復／鎖釋放等對應條件真正改變才回 active。時間到只允許輕量核對，不自動視為解除或重新執行。預設 24 小時一次無變化安全回查；暫時性 429／5xx／逾時服從 Retry-After 或已知服務限制，可在後續排程用 3/6/12/24 小時退避。不得每次看見 blocked 就把 next_probe_at 再往後推，導致永不到期。取得新有效結果可提早喚醒；授權不足不因逾時消失。

每輪先接續已到期、可安全讀回的待結果／阻塞探查，控制為輕量、有界、按最久未 probe 輪巡，不讓 waiting 吃掉所有深入名額；未 probe 部分保留 cursor。跨 repo 相同 runner 問題按依賴共因探查，不重複測每個 repo。寫入被鎖不阻止不衝突的唯讀工作與独立證據保存。

## 持久化、恢復與驗收

每輪至少保存 run_id、selection_reason、lane、priority_streak、aging_due、next_fair_target、實際完成範圍、未完成子游標及 waiting 變化。last_attempted_at 不等於 last_checked_at；PARTIAL/BLOCKED/SKIPPED_LOCKED 不刷 full-check 時間、不增加完整覆蓋數。真正完成無問題檢查可记 CHECKED_NO_FINDING，但不是產品修復或 CLEAN。

每個 task 的 selection_lease 只協調自身 cursor：先以新讀 blob SHA 寫入含 run_id、expires_at 的 90 分鐘 lease／選取意圖並讀回；他人有效 lease 存在則不覆寫，可唯讀並留独立報告。它不是 github-issue-lock 的替代品，不取得產品修改權。到期後先核對已保存 receipt／pending run／最新狀態，接續而非盲目重做；需要延長時持有者有界續租。更新同檔不可並行；衝突重讀整合或 STATE_WRITE_BLOCKED，不 force、不重設全檔。完成或已保存阻塞後釋放自己的 lease。寫入結果不明先讀回，防止重複 Issue／派發。

狀態寫不成時，保留可追溯且隱私相符的獨立 receipt／恢復點，明記不具持久輪巡保證，不能假稱 cursor 已前進。報告或狀態配置更新不算一次排程實跑。只在原通知條件或首次需 owner 介入的持久化／公平性故障時通知；相同故障不逐輪轟炸。

驗收觀察：有 aging 候選仍連續超過兩次非緊急 priority 為 FAIRNESS_VIOLATION；BLOCKED 無相關改變重回執行為 BLOCKED_RETRY_VIOLATION；只選到而未查核即刷新完成時間為 COVERAGE_VIOLATION。記證據與最小調整，不因此自動建立產品缺陷 Issue。公平性保障取決於工具可用、有限適用候選與規則实际执行；不得宣稱零飢餓已通過，須有後續多輪 receipt。
