# GOAL

實作免費二審閘（review gate）：worker 引擎 commit 之後、report done 之前，
用一個 0 邊際成本的 review 引擎（Devin 的 swe-check 模型，官方 credit_multiplier=0，
2026-07-22 於 docs.devin.ai/desktop/models 查證）對本輪 diff 做對抗式審查，
抓到嚴重問題（明顯錯誤、空實作、測試造假、超出任務範圍的破壞）就拒收並走既有
rollback 路徑。現況缺口：KernelVerifier（src/verifier.ts）只有 verify（機械層）→
judge（語義層）兩層，沒有 code review 層；auto-goal 漂移期間的垃圾 commit 只要
verifyCommand 綠就能過。新邏輯必須有紅→綠測試，放在 tests/review-gate*.test.ts。

## 驗收指令

```sh
npx vitest run tests/review-gate --reporter=dot
```

## 細部要求

1. 接點：KernelVerifier.check（src/verifier.ts）在 judge 通過之後新增第三層 review。
   review 引擎由 config 新欄位 `reviewEngine`（zod optional，引擎 tag 字串）指定；
   未設定＝跳過 review 層，行為與現在完全相同（向後相容，預設關閉）。
2. review 輸入：本輪 diff（baseCommitHash..commitHash 的 `git diff` 輸出，過長截尾）
   ＋任務文字。輸出契約：要求 review 引擎回覆首行 `REVIEW: PASS` 或 `REVIEW: REJECT <一句話理由>`；
   解析不到契約字樣一律視為 pass-with-alert（不確定不擋，鐵律 #4）。
3. fail-open 鐵律：review 引擎 preflight 失敗、逾時、崩潰、輸出無法解析——一律
   pass-with-alert（alerts 記 `review-gate-skipped: <原因>`），絕不因 review 層故障
   擋住正常產出。只有明確 `REVIEW: REJECT` 才拒收。
4. 拒收路徑：沿用既有 rollback 機制（verifier.ts 現有 rollback 分支），
   reason 記 `review-reject: <理由>`；events.jsonl 有跡可查。
5. review 引擎複用既有 Engine 介面與 registry（devin adapter 已支援 config model 欄位
   直通 --model；swe-check 檔位純 config 定義，不需改 adapter）。測試用 mock engine，
   不真呼叫 devin。
6. 成本安全：review 層不記 costUsd（swe-check 為 0 ACU）；若未來指到非零成本引擎，
   照該引擎 costPerRunUsd 記帳（沿用既有記帳路徑）。
7. kernel 行數預算維持綠燈（tests/kernel-budget.test.ts）。
8. 完成後 `npm run build` 與 `npx vitest run` 全綠。

## 邊界

- 禁止修改 configs/、scripts/、data/ 目錄與任何 daemon 進程（swe-check 檔位與
  reviewEngine 設定由操作者部署時另行加入 config，不在本 GOAL 範圍）。
- 改動最小化：只動 verifier 接線與必要型別；不重構既有 verify/judge 層。
- 狀態一律放 dataDir，絕不寫回 config 檔。

連續無進展上限：3
