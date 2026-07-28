# Round 1／2 flaky 最小重現候選（2026-07-28）

## 鎖定結果

本報告只彙整 [`flaky-runs.json`](./flaky-runs.json) 中 `runs[].round` 為 1、2 的兩輪；repo 內沒有另一組名為 round 1／2 的原始輸出。

| round | 開始時間（UTC） | 耗時 | exit code | 失敗數 |
|---:|---|---:|---:|---:|
| 1 | `2026-07-21T05:02:49.786Z` | 223,341ms（3:43.341） | 0 | 0 |
| 2 | `2026-07-21T05:06:33.131Z` | 269,917ms（4:29.917） | 1 | 1 |

兩輪切片的唯一失敗、也是最高頻候選（1／2 輪，50%）為：

`tests/worktree.test.ts > prepareWorktree：殘留目錄被鎖住(前次中斷進程未退)時上拋且不砍分支——成果分支與 HEAD 完好保留；解鎖後重試自癒成功（2a929ec9 產線事故回歸測試）`

這個「唯一」只適用於 round 1／2；完整 20 輪的最高頻候選另見 [`flaky-analysis.md`](./flaky-analysis.md)，不可混稱為同一結論。

## 失敗輪次的完整上下文

- 輪次：2。
- tracker 保存的失敗順序：第 1 個，也是該輪唯一失敗。
- 整輪耗時：269,917ms；tracker 沒有保存單一 spec 耗時。
- 測試本身的上限：40,000ms；失敗發生在等待鎖定狀態的 10,000ms 截止，而非後續 `prepareWorktree` 斷言。
- tracker 保存的完整訊息：

```text
Error: waitForWriteLockState: C:\Users\ADMINI~1\AppData\Local\Temp\adng-wt-lmvMea\worktrees\abc12345\result.txt 在 10000ms 內未達到 locked=true
```

原始 stdout／stderr 與 stack trace 未被保存，因此不能再補出行號或宣稱單一 spec 恰好耗時 10,000ms。

## 執行順序與相鄰測試組合

追蹤產物由 commit `c65f6ed` 產生。該版本 `tests/worktree.test.ts` 的宣告順序如下；候選當時是檔內第 4 個 spec：

| 位置 | spec | 下一步組合用途 |
|---:|---|---|
| 3 | `prepareWorktree：殘留（前次崩潰留下未清的 worktree 目錄+分支）重建成功` | 左鄰；同樣建立殘留 worktree，但不開檔案鎖 |
| 4 | `prepareWorktree：殘留目錄被鎖住...` | 唯一候選 |
| 5 | `assertWorktreeCheckout：正常 worktree → 不拋（prepareWorktree 內建呼叫不誤傷正常路徑）` | 右鄰；再次建立正常 worktree |

最小重現應依序嘗試：候選單跑、左鄰＋候選、候選＋右鄰、三者同跑。這能用四個最小集合區分候選自身不穩定、前置殘留與後續清理影響。

Vitest 當時為 `maxWorkers: 1`，但 dot reporter 的原始輸出沒有留存；上表是可驗證的檔內宣告順序，不宣稱是全套測試跨檔案的真實相鄰順序。

## 目前程式碼差異

原訊息中的 `waitForWriteLockState` 已由 commit `c77773d` 改成 READY／RELEASED 握手。若下一步要重現完全相同的錯誤簽章，應以產生追蹤資料時的 `c65f6ed` 測試實作為準；目前 HEAD 適合驗證的是同一候選是否仍會在新的握手機制下失敗。
