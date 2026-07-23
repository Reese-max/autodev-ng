# GOAL

實作成功率加權輪替（adaptive rotation）：派工時不再均勻走靜態 engineRotation 槽位，
而是依 run.db 近 7 天（UTC 滾動窗）各引擎成功率自動調整有效權重——高成功率引擎多派、
連續低成功率引擎降權but保底。現況問題（2026-07-23 run.db 實測）：oc-deepseek 87% 只佔
1 槽，oc-north 29%／oc-nemotron 17% 卻持續均勻消耗 attempts；引擎還有專案親和性
（codex-luna 在 PA 83%、在 self 只有 25%），靜態手調槽位無法反映。把「人工調輪替比例」
這件事本身自動化。新邏輯必須有紅→綠測試，放在 tests/adaptive-rotation*.test.ts。

## 驗收指令

```sh
npx vitest run tests/adaptive-rotation --reporter=dot
```

## 細部要求

1. 接點：`candidateEngines`（src/engines/rotation.ts）目前以 task id hash + failCount 在
   engineRotation 上取起點。改為先由新純函式（建議 `weightedRotation(baseRotation, stats)`）
   從基礎 rotation ＋ 統計產生「有效 rotation 列表」（權重以複製槽位實現，總長度有上限），
   再沿用既有 hash 起點邏輯。顯式 tag 尊重不動（既有規則）。
2. 統計來源：run.db attempts 表近 7 天聚合（engine, n, ok）。樣本不足（n < 5）的引擎
   一律用基礎權重（不升不降），避免小樣本亂跳。
3. 保底鐵律：任何在 baseRotation 中的引擎至少保留 1 個有效槽——降權不得降到 0，
   否則爛引擎永遠沒有翻身樣本（探索 vs 利用）。
4. fail-open：run.db 缺失／損壞／查詢失敗 → 直接用靜態 engineRotation，行為與現在完全相同。
5. 未設 engineRotation 或只有單引擎的 config 行為不變（向後相容）。
6. 權重計算為純函式並導出，測試直接餵統計驗證槽位分布；不引入新設定欄位也能運作
   （有合理預設），若加欄位需 zod optional 且缺省＝現行為。
7. 可觀測：events.jsonl 新增一筆 `rotation-weights`（每日首輪或權重變化時），
   記錄各引擎有效槽數，digest 可見。
8. kernel 行數預算維持綠燈（tests/kernel-budget.test.ts）。
9. 完成後 `npm run build` 與 `npx vitest run` 全綠。

## 邊界

- 禁止修改 configs/、scripts/、data/ 目錄與任何 daemon 進程。
- 改動最小化；狀態一律放 dataDir，絕不寫回 config 檔。
- 不得改變顯式 tag 派工與 candidate-tail（subscription 引擎補尾）既有語義。

連續無進展上限：3
