# GOAL 佇列

待派給 daemon 的 GOAL 規格草稿(依序執行,每個先驗收再換下一個)。
過去放在 session scratchpad(會隨 session 蒸發),2026-07-22 搬進 repo 版控。

派工方式:把對應 `GOAL-*.md` 覆蓋到目標 daemon 的 `data/<daemon>/GOAL.md`
(先備份舊的),daemon 下個 session 會 parseGoal 讀取並執行。換前先確認 daemon 處於
session 間(idle),避免打斷進行中工作。

## 目前佇列(autodev-self,依序)

| 檔案 | 一句話 | 狀態 |
|---|---|---|
| GOAL-reap-idlechild.md | supervisor 硬化:帶閒置殘留子進程的 wedge 也能自動 reap | ✅ 2026-07-23 上線 |
| GOAL-restart.md | restart.request 哨兵,消滅 config-rename 部署稅 | ✅ 2026-07-23 手作上線(46baa5f) |
| GOAL-adaptive-rotation.md | 成功率加權輪替:輪替權重從 run.db 滾動成功率自動調 | ✅ 2026-07-23 手作上線(3f450ff) |
| GOAL-review-gate.md | 免費二審閘:swe-check(0 ACU)對 diff 對抗式審查,REJECT 走 rollback | ✅ 2026-07-23 手作上線(f12cb88,預設關閉待配 swe-check) |
| GOAL-survey.md | survey 多源化(run.db + events + USER-SIGNALS + NORTHSTAR) | ✅ 2026-07-23 上線(9ce33d3,daemon 自跑 achieved) |
| GOAL-author.md | 自動 GOAL 逐題紅→綠驗證,修「繼承全域 verifyCommand 的空驗證」 | ✅ 2026-07-23 手作上線(6827e91) |
| GOAL-roi.md | ProblemsLedger 加成本/結果欄,session 末結算 ROI | ✅ 2026-07-24 上線(ledger-roi 33/33 綠;supplement 稽核殘 5 條證據缺口,屬文書層) |
| GOAL-kernel-slim.md | kernel 減壓:cli.ts 子指令外移 src/cli/,騰回 ≥250 行——後續 kernel 改動的前置 | 🔄 執行中(已派 2026-07-24) |
| GOAL-verify-tiered.md | 分層驗收:輪內先跑 GOAL 專屬指令,綠了才跑全套——砍紅→綠迭代的 14 分鐘全套稅 | 待派(調到 kernel-slim 後:要動 verifier.ts 接線,kernel 零餘裕時必撞) |
| GOAL-visibility.md | 產出可見性:digest+立案通知經 notify 送達使用者(北極星判準 3,USER-SIGNALS 頭兩痛) | ✅ 2026-08-02 驗收綠(tests/visibility 2 files/5 tests passed;全套 149 files/1521 tests + build 皆綠;c7851f6+dc26e13) |
| GOAL-signal-quality.md | 發掘器訊號源:repo 健康指標+run.db 72h/前4日雙段+cost/observability 雙鏡頭 | 待派 |
| GOAL-verifyfail-detail.md | verify-fail detail 修繕:strip ANSI+擷取失敗區塊,失敗紀錄可診斷 | ✅ 2026-08-02 驗收綠(3 passed,0c47064) |
| GOAL-nocommit-nudge.md | phantom completion 當場補救:no-commit 先 nudge 一次再定生死 | ✅ 2026-08-02 驗收綠(6 passed,d156b84) |
| GOAL-merge-rebase.md | merge-conflict 自動 rebase onto main 重試一次再 blocked | 🔄 執行中(2026-08-02 巡檢派工;紅態 exit 1「No test files found」已確認,parseGoal 通過,已放 restart.request 哨兵。選它的實證:本輪 note-filler 1 件、neciken 2 件皆死於 merge-conflict,且 neciken commit 1026514 因此遺失) |
| GOAL-critic-probe.md | critic 實證探針:候選宣稱機械查證(實跑測試/數事件),矛盾者重降權 | 待派 |
| GOAL-northstar.md | 北極星節流自我迭代(機器提議、人核准 APPROVED 才併) | 待派 |
| （場外武裝中）純免費層 v1 | tierMode free-only＋帶資訊重試＋二敗自動拆解 | 🔄 已武裝 data/autodev-self/GOAL.md（2026-08-04），等 backlog 見底接起 |
| GOAL-herdr-probe.md | Herdr 可行性探針：無頭/全循環/熱重試/生命週期四題 Go-No-Go，一天量級只探不接線 | 待派（排純免費層 v1 之後） |
| ~~GOAL-rebuttal-round.md~~ | 審查申辯輪 | ❌ 撤案（2026-08-04 使用者裁示：走 Herdr 探針路線，不另建對話機制） |

依賴註記:kernel-slim 是 verify-tiered(verifier.ts 接線)、signal-quality(types.ts lens
一行)、verifyfail-detail、nocommit-nudge、merge-rebase 的前置——kernel 現況 2700/2700
零餘裕,不先減壓全撞行數牆。

流程雷註記(2026-07-24 實證):手派 GOAL 收案後必須人工移走/覆蓋 GOAL.md——
manualGoalDone 記錄後 daemon 對同一 GOAL.md 安靜略過,既不補課也不進 discover,
整台空轉。收案動作=備份 GOAL.md + 派下一棒(或刪除讓 perpetual 回 auto-goal 模式)。
中期修法併入 GOAL-visibility(done 通知提醒派工)。

## devin-only 模式(免費模型模式,2026-07-24)

`configs/modes/autodev-self.devin-only.json` 是「只用 devin 免費模型(swe-1.6,0 credit
multiplier)」的完整 config 變體:engines 白名單只留 devin、rotation=["devin"]——連 failover
補尾都不會流向訂閱檔,額度零消耗。
**模式檔必須放 configs/modes/ 子目錄**:supervise 會把 configs/ 頂層每個 .json 當獨立專案
拉 daemon(supervise.ts:318),變體檔放頂層會生出第二實例搶 autopilot.lock(2026-07-24
lock-busy 實證)。切換(daemon 會在 cycle 邊界優雅重啟):

```sh
cp configs/autodev-self.json configs/autodev-self.json.bak-$(date +%Y%m%d)
cp configs/modes/autodev-self.devin-only.json configs/autodev-self.json
touch data/autodev-self/restart.request
```

切回:`git -C . checkout configs/autodev-self.json` + 再放一次 restart.request 哨兵。
注意:devin swe-1.6 能力弱於 codex/grok,適合低難度 GOAL 或額度吃緊時段;maxAttempts=6
但單一引擎失敗 6 次即 blocked,難案勿用。

## 格式鐵律(parseGoal)

- 第一行 `# GOAL`(標題行本身會被 parseGoal 略過)
- objective = 標題後、第一個 `##` 前的非空行(直接寫正文,別空著)
- verifyCommand = 第一個 ```sh/```bash 圍欄(多行以 && 串接)
- `連續無進展上限：N`
- 派工前一律先 `parseGoal` 驗證(踩過 da39 evaluator 因格式錯而全盲的坑)
