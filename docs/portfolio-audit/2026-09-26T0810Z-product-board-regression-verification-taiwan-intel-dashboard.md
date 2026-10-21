# Taiwan Intel Dashboard — default-branch regression verification

- 查閱日：2026-09-26
- 稽核產品：`Reese-max/taiwan-intel-dashboard`
- inspected default HEAD：`095806e752384b14237c6e1abae7153872ac6a9c`
- issue-quality 規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`
- 證據等級：`CONFIRMED / EXECUTED_REPRODUCTION`
- 結論：兩項既有 P2 fingerprint 為 `VERIFIED_FIXED`；Portfolio 仍為 `NOT CLEAN, 0/2`
- 本輪產品實作：0；新 Issue：0；Issue 更新／重開：0；Verified Fixed：2
- auto_implementation：`false`

## 為何是正式複驗

這不是以 PR 合併、單元測試或單一綠燈代替驗證。兩個相鄰 default-branch run 實際走過正式 fetch、摘要、語意稽核、保存與部署路徑；第一輪完成後也確實派送第二輪。

## VF-1：AI 摘要 stall／失效輸出鏈

- fingerprint：`taiwan-intel-dashboard + update-data AI summary + provider fallback/reasoning + run stalls or reasoning text is published as a valid brief + unbounded/incorrectly bounded provider path and insufficient semantic publication gate`
- 分流：`BUG / P2 / HIGH`
- 原始失敗：
  - run [36220772911](https://github.com/Reese-max/taiwan-intel-dashboard/actions/runs/36220772911) 在摘要路徑停滯逾一小時後取消。
  - 修正鏈曾捕捉到 `degraded:false`、但內容是 3497 字元英文 reasoning 的 `summary.json`；PR #61 將其判為 `invalid-ai-brief`，避免以成功狀態發布。
- 最小修正鏈：
  - [PR #58](https://github.com/Reese-max/taiwan-intel-dashboard/pull/58)：摘要請求與整輪採有界 timeout／budget。
  - [PR #59](https://github.com/Reese-max/taiwan-intel-dashboard/pull/59)：對共用摘要 profile 關閉 reasoning。
  - [PR #60](https://github.com/Reese-max/taiwan-intel-dashboard/pull/60)：新 release 可中止舊停滯 fetch。
  - [PR #61](https://github.com/Reese-max/taiwan-intel-dashboard/pull/61)：拒絕 reasoning 洩漏與不符合摘要語意的內容。
- default-branch runtime：
  - run [36226286067](https://github.com/Reese-max/taiwan-intel-dashboard/actions/runs/36226286067)，commit `095806e752384b14237c6e1abae7153872ac6a9c`，30m05s 成功。
  - fetch job `108360874131`：primary provider 回 401 後走 Nemotron fallback；`AI 摘要：完成`，domestic／international 均為 `success`，兩者 `degraded:false`。
  - audit job `108362432790`：summary semantic audit、tests、build 與資料稽核全部成功。
  - 相鄰 run [36227808815](https://github.com/Reese-max/taiwan-intel-dashboard/actions/runs/36227808815) 的 fetch job `108365132250` 再次產生 domestic／international `success`、`degraded:false`；audit job `108366626194` 再次通過語意 gate，deploy job `108366945328` 成功。
- 驗證結果：`VERIFIED_FIXED`。相同正式路徑連續兩輪完成；不再只依賴靜態推論。

## VF-2：schedule 延遲時刷新不再靜默中止

- fingerprint：`taiwan-intel-dashboard + 30-minute refresh cadence + GitHub schedule event delayed/missing + no succeeding refresh after completion + schedule-only trigger dependency`
- 分流：`BUG / P2 / HIGH`
- 最小修正：[PR #62](https://github.com/Reese-max/taiwan-intel-dashboard/pull/62) 在一次更新完成後，若沒有已排隊的新 run，才用 job-scoped `actions:write` token 自行派送下一輪；沒有新增 scheduler 服務或狀態平台。
- default-branch runtime：
  - run `36226286067` 的 next-refresh job `108362808501` 成功，log 記錄 `NEXT_REFRESH {"action":"dispatch","waitMs":956584}`。
  - 該派送確實建立 run `36227808815`；其 operating-state、fetch、audit、save-state、deploy 都成功，不是 mock 或 YAML 靜態存在。
- 驗證結果：`VERIFIED_FIXED`。

## Red Team 與限制

1. 綠燈可能只代表降級統計摘要；本次兩輪皆為 `degraded:false` 且語意 gate 通過，排除此替代解釋。
2. 自動派送可能造成重複 run 或成本迴圈；目前只在工作完成且沒有 queued run 時派送，權限限於單一 job。本輪證明一次派送，尚不能證明長期無重複或成本偏移。
3. primary provider 仍回 401，實際成功依賴 NVIDIA fallback；「primary provider 正常」未被證明，也不是本輪結論。
4. 未做模型品質 benchmark、行動裝置或輔助科技驗證；資料長期正確率仍由既有品質監控承接。
5. 第二輪觀察時 next-refresh job 尚在執行，但第一輪已證明 dispatch，第二輪核心 fetch／audit／save／deploy 均完成。

## 董事會決策（模型多視角推演）

- CEO 若只做三件事：守住刷新完成率、拒絕不合格摘要、維持可預期的下一輪派送。
- CPO／UX／Support：需要的是準時、可讀、可追溯的情報，不是更多模型或設定面板。
- CTO／Staff／SRE：保留有界 timeout、內容 gate、run 去重；不升級成外部 scheduler、通用工作流平台或 provider 矩陣。
- Security／CFO：job-scoped 權限與有界 budget 可接受；仍應觀察自派送頻率與 provider 成本。
- 決策：`MAINTAIN / SIMPLIFY`。不新增功能、不啟動實作代理、不把本報告視為 merge／deploy／付費授權。

## Issue／PR 對應與去重

兩項 fingerprint 已由 PR #58–#62 的 owner 修正鏈承接；另開 Issue 只會重複根因。本輪不搶 scope、不留言製造通知，也不重開已結案項目。此驗證不代表 repository 或 portfolio CLEAN：其他 Issues／PR、固定 A01–J05 停止條件、兩個完整合格 CLEAN 輪次及必要 runtime 覆蓋仍須獨立滿足。

## 本輪差異

- 新 actionable finding：0
- 新建／更新／重開 Issue：0／0／0
- 去重：2 個已由修正 PR 承接的 fingerprint
- Verified Fixed：2；Regression：0；研究：0
- 產品程式／CI／設定變更：0
- 報告寫入：1（本檔）
