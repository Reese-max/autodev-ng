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
| GOAL-roi.md | ProblemsLedger 加成本/結果欄,session 末結算 ROI | 🔄 執行中(已派 2026-07-23,鎖 codex-terra-xhigh) |
| GOAL-verify-tiered.md | 分層驗收:輪內先跑 GOAL 專屬指令,綠了才跑全套——砍紅→綠迭代的 14 分鐘全套稅 | 待派 |
| GOAL-kernel-slim.md | kernel 減壓:cli.ts 子指令外移 src/cli/,騰回 ≥250 行——後續 kernel 改動的前置 | 待派 |
| GOAL-visibility.md | 產出可見性:digest+立案通知經 notify 送達使用者(北極星判準 3,USER-SIGNALS 頭兩痛) | 待派 |
| GOAL-signal-quality.md | 發掘器訊號源:repo 健康指標+run.db 72h/前4日雙段+cost/observability 雙鏡頭 | 待派 |
| GOAL-verifyfail-detail.md | verify-fail detail 修繕:strip ANSI+擷取失敗區塊,失敗紀錄可診斷 | 待派 |
| GOAL-nocommit-nudge.md | phantom completion 當場補救:no-commit 先 nudge 一次再定生死 | 待派 |
| GOAL-merge-rebase.md | merge-conflict 自動 rebase onto main 重試一次再 blocked | 待派 |
| GOAL-critic-probe.md | critic 實證探針:候選宣稱機械查證(實跑測試/數事件),矛盾者重降權 | 待派 |
| GOAL-northstar.md | 北極星節流自我迭代(機器提議、人核准 APPROVED 才併) | 待派 |

依賴註記:kernel-slim 是 signal-quality(types.ts lens 一行)、verifyfail-detail、
nocommit-nudge、merge-rebase 的前置——kernel 現況 2700/2700 零餘裕,不先減壓全撞行數牆。

## devin-only 模式(免費模型模式,2026-07-24)

`configs/autodev-self.devin-only.json` 是「只用 devin 免費模型(swe-1.6,0 credit multiplier)」
的完整 config 變體:engines 白名單只留 devin、rotation=["devin"]——連 failover 補尾都不會
流向訂閱檔,額度零消耗。切換(daemon 會在 cycle 邊界優雅重啟):

```sh
cp configs/autodev-self.json configs/autodev-self.json.bak-$(date +%Y%m%d)
cp configs/autodev-self.devin-only.json configs/autodev-self.json
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
