# 品質排程接續契約 v2

2026-09-17（Asia/Taipei）。適用 self-review、upstream-watch、runtime-evidence、research-experiment、delivery-watch；outcome-digest 只增加唯讀健康核對。本版明確取代 v1 對游標、計數、等待、租約及保存位置的含糊處；原任務、Issue Quality v2、固定 Persona／CLEAN 規範、安全、去重與低噪音條件保持適用。不改排程頻率、不增加修復 worker、不改產品程式／CI／設定／secrets／權限、不 merge／deploy／付費。

這是既有排程的協作契約與 JSON 狀態，不是已部署的強制執行器。離線規則測試不代表真實跨輪、並行、通知或產品 runtime 已驗收。

## 1. 單一私密狀態來源與漸進遷移

五個 task 使用各自提示詞指定、已核對為私有的稽核狀態檔；完整 portfolio 的最小選取 metadata 放在這個私密協作範圍，避免公開／私有各跑一套而繞過公平配額。每個 task 一份 authoritative cursor，不共用另一 task 的計數器。原始碼、完整執行證據、使用者資料仍留來源 repo，狀態只記必要身份、時間、接續點與證據引用。

原 `docs/operations/<task>/cursor.json` 是舊公開歷史，不再由新版本排程持續寫入。不得把新的私有保存位置、私有 repo 名稱／ID／URL／分支／可識別 fingerprint／私人查詢結果總數放回公開檔，雜湊也不作公開化手段。寫前核對狀態庫仍為 private；看不到或變成 public 時 STATE_STORAGE_BLOCKED，不以公開庫作 fallback。這裡不更改任何 repo 可見性或存取權。

遷移保留舊檔 blob SHA、所有已知 work keys、active／waiting／terminal、既有完成時間、最久待審時間、next target、待結果 run ID、計數與公平欠帳。冗長 receipt 可改用 immutable 原始 blob／Issue／CI 引用，不能遺失接續條件。尚在執行的舊輪次可能於切換後寫出更新：新任務首次先核對 legacy 最新 receipt，只整合真正較新的項目證據，不能用舊快照覆蓋新隊列；計數有衝突時保留 aging_due 並記理由，不冒稱全遷移完成。設定時間不刷新 worker 成功時間或完整覆蓋。

沒有可驗證歷史的時間保留 null，首次發現與歷史上從未查過不同。repo inventory 完整不等於 PR／Issue discovery 完整，更不等於產品／情境已查完。

## 2. 可重建的 discovery checkpoint

每個 checkpoint 必須是物件，至少包含：source_tool、source_kind、repository_id／範圍、原 request 或 query、sort／direction、page_size、page／offset 或工具實際回傳 continuation、查詢時間界線（來源支援時）、last_completed_page、remaining_item_ids、last_progress_at、complete 及恢復模式。next_fair_target 只表示已知工作的下一個目標，不能代替 discovery checkpoint。

只寫「繼續分頁」或缺查詢位置的舊 cursor 標 LEGACY_CHECKPOINT_UNRESOLVABLE。從一個明確、可重建的 RECONCILE_FROM_BASELINE 查詢重新列舉該來源，保留已知 work IDs、已服務順序、年齡與 receipts；不捏造舊 page/token。初始 page=1 是待執行的新基準，不是假稱已收到 next token。

預設以已觀察 inventory 的穩定 repo ID 順序分 shard。PR 使用該 repo 的 pulls collection，state=all、sort=created、direction=asc；Issue 使用 issues collection，state=all、sort=created、direction=asc，排除回傳中有 pull_request 欄位的項目。每個來源依 schema 支援的參數、實際分頁回傳接續；不能把不同 API 的 offset／page／cursor 互換。必要的狀態、標記、近期合併、研究／runtime 適用性在取得實際項目後分類，不能只靠 open 標籤漏掉已關閉卻未驗證的修正。

若工具回傳 next link/token，原樣保存。若具體 page API 的 wrapper 不暴露 headers，可依已核對參數前往下一頁，保存 terminal 空頁或不足一頁的實際結果；不得將 wrapper 沒有 Link 解讀成 API 沒有下一頁。工具回應被截斷、incomplete_results 或搜尋上限不是完整結果；縮小到 repo／可重建時間區間再查。搜尋只作增量加速，不作唯一完整性證據。state=all／created 排序降低變動頁漂移，但不是資料庫 snapshot；保留重疊回查、穩定 ID 去重與週期性 reconciliation。

處理半頁就中斷時保存尚未分類 IDs，或重讀同頁去重；沒有保存全部候選不可提前增加 last_completed_page／時間水位。未發現範圍必須有進度：有剩餘 shard 且工具可用時，每輪先完成至少一個有界 discovery 步驟，再深入主目標；來源故障則保存缺口，可做不受影響的已知工作。不得每輪只讀熱門候選而跳過 discovery。全局 429／失效時停止受影響操作，遵守 Retry-After，不逐 repo 重試同一故障。

## 3. 公平選取與明確狀態轉移

單一 task 在公開及私有範圍共用 PRIORITY／AGING 選取狀態。只要存在可處理 aging 工作，最多連續兩次 PRIORITY 主選取，下一次必須 AGING；每輪仍可只深入一兩個 repo，research 仍最多一個獨立問題。沒有 priority 可直接 aging；沒有 aging 可借用 priority，但保留欠帳。只有新確認、有本輪必要可行處置的 P0 可插隊，保存 fingerprint、新證據及延後目標；相同舊事件不永久插隊，第一個可用名額償還公平欠帳。

| 事件 | 精確變化 |
|---|---|
| 本輪主選取已在有效 lease 下成功保存 | 產生唯一 selection_id；同 selection_id 的重試／讀回不再計數 |
| 新 PRIORITY 選取 | priority_streak=min(2, priority_streak+1)；達 2 設 aging_due=true |
| AGING 完成事先界定的實質服務單位且 receipt 保存成功 | 同時 priority_streak=0、aging_due=false；last_service_at 更新；該 repo／item 在本服務週期已服務 |
| 只列舉、選到、撞鎖、缺資料、無進展逾時 | 不算 AGING 服務，不清除欠帳、不刷新完整查核時間 |
| 重試相同 selection_id 的完成寫入 | 冪等；不重複增加服務數、不清除後來選取產生的欠帳 |
| 真正完成本 task 的全部適用範圍 | 另外更新 last_full_check_at／該 task 專用完整時間及 full completion 計數 |

state 中保存 current_selection={selection_id,run_id,lane,target,accounted,service_receipt_ref}，與 monotonic selection_sequence；不從 comments 數或 updated_at 推算主選取數。老 receipt 不能重播成新服務。

實質服務單位必須先定義輸入 SHA／範圍與停止點，例如讀完一組 PR threads 及相關 source，或完成一個有界研究步驟。這可以支付本輪公平服務名額，但不等於整個 PR、依賴查核、實驗或 runtime 已完成。保留 PARTIAL 與未完成子游標；review_due_since、last_complete_review_at、last_full_dependency_check_at 不因部分服務重設。避免大 PR 因永遠未整體完成而占住每次 aging，也避免只讀 README 就算服務。

AGING 先服務本週期尚未服務的 repo，再在 repo 內輪到尚未服務且最久等待的適用工作；保留 repo／item 服務輪巡，新增候選加入待巡尾端，不每輪重建熱門排序。新 push 不改 work key、不重設待審起始時間。純 audit／lock／bot 事件不算產品進展。等待時間只影響選取與健康指標，不升 Issue severity。

Delivery 的「診斷已完成」和「產品仍 WAITING_FIX」是兩個軸：完成診斷可以更新 last_delivery_check_at，即使產品尚未修好；真正因工具失敗而未完成診斷，才不能更新。coverage 的 completed、partial、waiting 不強行相加，明列分母及是否可重疊。搜尋命中數不是已確認 runnable 數。

## 4. 探查訊號不等於重新入隊

將 legacy wake_conditions 保留於歷史，現行使用 probe_on 與 requeue_if。probe_on 包括新相關 head、review/check 更新、指定來源／環境變化或 next_probe_at 到期；它只允許輕量重新核對。requeue_if 必須指出根據哪些證據，這個工作現在有可處理的實質下一步。先核對，再設定 last_probe_at、probe_result、evidence_refs 及是否回 active，不能見到 new head 就假定修好。

環境／授權阻塞：確認必要環境可用及既有授權符合，或有新有效 receipt 可供唯讀整合，或相關變更實際移除了原依賴。WAITING_FIX：存在與根因相關的可檢查修正／新實質結果，不以 README commit 喚醒。Delivery 可因阻塞種類／解除證據實質改變而重新診斷，不必假設全部修好。WAITING_RESULT：只讀既有 run/attempt；queued 不當 PASS，不重複派發。BLOCKED 某 provider／寫入權不封鎖同 repo 其他安全可讀情境。

預設靜態阻塞 24 小時輕量 probe；暫時限流／5xx／逾時服從回傳限制並採後續輪次 3/6/12/24 小時退避。只有實際完成 probe 才重排 next_probe_at，不能每次看到記錄就往後滑動。到期不自動解除授權；有相關新證據可提早探查。waiting_probe_cursor 必須可定位實際穩定 ID，未 probe 項目保留；共用環境故障按共因核對，不吃光深入名額。

## 5. 租約世代、寫入條件與失敗恢復

cursor 保留 lease_generation（釋放後不歸零）。新持有者在新讀 blob SHA 下，以條件更新增加 generation 並寫 selection_lease={run_id,generation,expires_at}，讀回確認；有別人有效 lease 不搶。每次更新 cursor、完成計數或釋放前，重新讀並同時確認 run_id、generation 與未到期，再使用同次讀取的 blob SHA 作條件寫入。不能只因拿到最新 SHA 就視為仍持有租約。

租約到期後原 run 不可續寫；若需要繼續，必須重新核對新狀態並取得新世代，不可延長過期舊 lease。別人已接手時舊 run 僅保存独立歷史 receipt，不推進隊列、不釋放新持有者、不把舊 outcome 再計一次。衝突重讀且重新檢查所有權，最多有界恢復，不 force／清空。unknown write 結果先讀回 current_selection／receipt，不能盲目再派發或重開 Issue。

這不是伺服器驗證 lease_generation 的新功能；GitHub 的條件檔案寫入與 task 的持有者檢查共同構成協作協議，不能宣稱可阻止未遵守規則的外部 writer。github-issue-lock:v1 繼續獨立適用於 Issue/comment 協作，selection lease 不提供產品操作權。失去 task lease 的 run 也不再執行衝突的追蹤寫入。

## 6. 原任務特有要求仍保留

Self-review 保留 latest head／review SHA／PR claims／unresolved threads／source contracts 的核對；已完整審且無新相關事件不為配額重讀。Upstream 以真正完整依賴查核算 days_since_last_check，未知 null，不以 repo 活躍性取代。Runtime 保留 SOURCE／MOCK／LOCAL／CI／PROVIDER 不同證據層及精確情境；缺憑證不以 mock 冒充。Research 保持單一窄問題、原 hypothesis 版本／步驟／反例／BUILD-NARROW-REJECT-INCONCLUSIVE，其他可處理研究存在時同題最多連續兩輪。Delivery 不將正常草稿或 idle 時間當卡死、不改活躍 scope。

## 7. 既有成果摘要兼做輕量健康核對

不新增排程。outcome-digest 唯讀五個 task 的 canonical cursor、必要前後 receipt 及實際排程狀態；不接手 task lease、不幫 task 刷新時間、不修產品。自己的去重／觀察結果保存在私密 health 狀態。

last_worker_receipt_at、last_discovery_progress_at、oldest_runnable_since、oldest_probe_due_at 分開。配置／遷移 commit、automation updated_at、bot 留言不是 worker 成功。沒有歷史先建立 OBSERVING 基準，不立即宣稱失敗。任務啟用且至少三個應到期週期沒有新有效 worker receipt 才列 WORKER_RECEIPT_STALE 候選，仍核對工具故障／排程暫停／是否只是觀測不到；不能把 last_run_time 當成功證據。discovery 有剩餘、工具可用、連續三次已確認 worker run 卻 checkpoint 不前進時列 DISCOVERY_STALLED。有可處理 aging 工作卻超出兩次非緊急 priority、或 waiting 到期反覆未 probe，分別保留具體違反證據。

同時觀察最久可處理工作等待時間及服務週期進度，2:1 配額不宣稱等待時間上限。資訊不足標 UNKNOWN／PARTIAL，不猜全 portfolio 總數。首次需要 owner 行動或狀態惡化／恢復才輸出；相同 fingerprint+證據版本不每輪重發。通知設定 false 不等於任務未執行；本契約不啟用 push/email，不能宣稱通知管道已驗收。摘要不得把健康修正當產品交付成果。

## 8. 驗收與官方介面邊界

至少核對：selection 重試只計一次；aging 服務同時重設兩欄；partial 不刷 full 時間；相同 probe 訊號未滿 requeue_if 不執行；next_probe 不因無探查而滑動；過期／不同世代 writer 被協作檢查拒絕；分頁中斷不提前推水位；舊 prose checkpoint 只重建 discovery 不清既有工作；private 存取失敗不落回公開；配置更新不刷新 worker 健康。需用真實後續多輪 receipts 才驗收實際遵循，不能只靠文件存在或離線測試。

介面依據：GitHub 官方 REST pagination、repository contents、search 文件。https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api ; https://docs.github.com/en/rest/repos/contents ; https://docs.github.com/en/rest/search/search 。实际工具 schema 若不支援某參數／header，不自行捏造能力，使用受支援的有界查詢並保存限制。
