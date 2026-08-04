# GOAL

審查申辯輪（rebuttal round）——把 review gate 從「單向否決」升級為「一來一回的最小對話」
（使用者 2026-08-04 核定；設計脈絡：多 agent 討論的最小可行形式，優於平行合議——弱點在
任務太大不在腦太少，故對話只在「已有具體分歧」的拒收時刻發生，成本有界）。
背景（場外已處置，非本 GOAL 工作）：review gate 與拒收理由注入已存在；本 GOAL 驗收目前紅態。
要做的事：review-reject 發生時，同輪同 worktree 給實作引擎一次申辯機會——引擎收到
（a）拒收理由全文（b）自己的 diff，可選擇兩種回應：修正（追加 commit）或申辯（說明審查
誤判的理據文字）；審查者對「申辯＋最新 diff」重審一次。重審通過＝該輪改判 OK；仍拒＝
該輪失敗，且兩份拒收理由（原始＋重審）合併記入 run.db detail（讓下一棒靶心更完整）。

## 驗收指令

```sh
npx vitest run tests/rebuttal-round --reporter=dot
```

## 細部要求

1. config 新增 `rebuttalRound: false`（Zod 預設關閉）：關閉時所有新路徑不啟動，行為與現行
   完全一致（向後相容硬線）；每輪申辯次數硬上限 1，不可設定放寬。
2. 申辯呼叫共用該輪既有引擎與逾時預算（不另開新引擎進程層級）；申辯階段任何故障
   （逾時／解析失敗／引擎錯誤）一律 fail-open 回退為原始 reject 結果，不得讓申辯機制
   卡死或反轉既有失敗語義。
3. 觀測：events 記 `rebuttal-accepted`／`rebuttal-rejected`（含輪次、任務、兩份理由摘要）；
   digest 增申辯轉化率一行（accepted/total）。此數據是本機制存廢的裁決依據——
   轉化率 <20% 時應建議關閉。
4. 測試 tests/rebuttal-round*.test.ts 先紅後綠覆蓋：（a）flag 關閉行為不變；（b）reject→申辯
   修正→重審通過＝輪 OK 且記 rebuttal-accepted；（c）reject→申辯→仍拒＝輪敗且 detail 含
   兩份理由；（d）申辯階段逾時／崩潰＝回退原始 reject；（e）申辯只發生一次（第二次 reject
   不再觸發）。
5. 新邏輯外移 src/engines/ 或 src/autopilot/（頂層只留接線）；kernel 頂層 <2250 維持綠；
   `npm run build` 與既有測試零改動全綠。

## 邊界

- 只攔 review-reject；verify-fail（測試紅）與 judge-mismatch 不觸發申辯（那些是機械事實，
  沒有辯論空間）。
- 不改 configs/*.json（試點掛載由監督者事後執行）；不動 daemon 進程與 data/ 狀態檔。
