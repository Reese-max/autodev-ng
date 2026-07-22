# GOAL

auto-goal 立案品質閘——每案專屬紅→綠驗收：authorGoal（src/autopilot/author.ts）目前把 config
的全域 verifyCommand 抄給每個自動立案的 GOAL 當驗收，立案當下即為綠燈，goal 淪為「套件保持綠
就算達成」的空洞驗收。改為：（1）立案 LLM 必須為每個 goal 產出專屬驗收指令（優先形式：指向
一個尚不存在的測試檔的紅→綠測試指令，如 `npx vitest run tests/<專屬名> --reporter=dot` 或
pytest 等價物，由專案既有 verifyCommand 的工具鏈推導）；（2）紅燈檢查——立案時實際執行候選
驗收指令，若已經 exit 0（綠），判定驗收空洞：改走 failing-test-first 協議（objective 首任務
強制「先寫可重現問題的 failing test」）或棄案；（3）立案 lint——組裝完的 GOAL.md 必須通過
parseGoal 往返檢查（objective 非空、verifyCommand 存在、無進展上限存在），任一缺失即棄案並
記事件。全程 fail-open：lint/紅燈檢查本身故障時保留現行為（沿用全域 verifyCommand），不得
讓立案管線停擺。新邏輯必須有紅→綠測試，放在 tests/author-gate*.test.ts。

## 驗收指令

```sh
npx vitest run tests/author-gate --reporter=dot
```

## 細部要求

1. 紅燈檢查的執行帶 timeout（沿用/新增合理上限），逾時視同檢查故障走 fail-open 路徑。
2. 專屬驗收指令的測試檔名須含 problem fingerprint 前綴避免撞名。
3. 向後相容：既有已立案的 GOAL.md 不受影響；isAutoGoal 標記格式不變。
4. 測試覆蓋：專屬驗收生成、已綠判空洞轉 failing-test-first、lint 三缺失各自棄案、檢查故障 fail-open。
5. kernel 行數預算維持綠燈；`npm run build` 與 `npx vitest run` 全綠。

## 邊界

- 禁止修改 configs/、scripts/、data/ 目錄與任何 daemon 進程。
- 改動最小化：只動達成目標所需的檔案。

連續無進展上限：3
