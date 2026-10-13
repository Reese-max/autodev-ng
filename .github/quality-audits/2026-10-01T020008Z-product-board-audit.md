# 產品董事會增量稽核：autodev-ng PR #118

- 稽核時間：2026-10-01T02:00:08Z
- 狀態：PARTIAL / NOT CLEAN
- 規則檔 blob：`8167e10798071d2276addaff6b201c6b0e904a2a`
- Inventory：45 個 Reese-max 自有 repository；44 個未封存；封存排除 `Reese-max/obsidian-vault`
- 增量基線：2026-09-30T23:03:00Z
- Default branch：`Reese-max/autodev-ng@99eba2458a82a4fb8e70c25c5a454014b568c659`
- 候選：PR #118 `cbb5b64120d188bcc7af58537ee2597d8328310f`
- 寫入界線：僅新增本 audit-only 報告；未修改產品程式、Issue、PR #118 scope、CI、設定、權限或部署

## Discovery 與差異

完整 inventory 分頁結果維持 45/44；自上一核對點後沒有任何自有 repo 的新 default-branch commit。新增高影響候選為 [autodev-ng PR #118](https://github.com/Reese-max/autodev-ng/pull/118)，新增長時程 ExecutionBackend、Manager/Executor/Auditor、approval gate、持久狀態與 CLI。Issue #55 與 PR #118 均活躍，因此本 finding 記為 `SKIPPED_LOCKED_ACTIVE_PR`，不搶鎖、不開重複 Issue、不修改 scope。

## 新 finding

### P1 BUG：模型產生的 verifyCommand 可繞過 approval gate 並由 host 執行

- kind：`BUG`
- severity：`P1`
- decision_priority：`NOW`
- triage：`NEEDS_REVIEW`
- auto_implementation：`false`
- evidence：`SOURCE_CONFIRMED / 靜態因果鏈`
- fingerprint：`autodev-ng+long-horizon+manager-step.verifyCommand+host-runVerify+approval-does-not-inspect-command`

#### 問題成立

`BoundedStepSchema` 接受任意 `verifyCommand`。LLM Manager 的 JSON parser 直接用該 schema 解析模型輸出；雖然 prompt 沒有要求此欄，模型／prompt injection／自訂 Manager 仍可提供。Approval gate 的 `classifyStepRisk()` 只檢查 `step.text` 與 `step.risk`。之後 `mechanicalAuditor()` 以：

`req.step.verifyCommand ?? req.goal.verifyCommand`

選出命令並交給 host 的 `runVerify()` 執行。

因此可形成可達鏈：低風險文字與 `risk:"low"` → 不停在 `needs-approval` → Executor 返回 → Auditor 在 host 執行高風險 `verifyCommand`。命令可包裝部署、權限、credential、資料遷移或其他副作用，違反 Issue #55「不得因 long-running mode 繞過 approval gate」及 pilot「no production deployment」。

受影響者：Repo owner、release owner、secret/permission 管理者、共用 runner operator。現有替代是只允許 owner/config 預先核定的 verify command；不做的後果是模型輸出可把未授權動作移入「驗收」階段，繞過原本針對 step 的人工核可。

#### 最小有效修正

1. Manager/model 回覆不可定義可執行命令；從模型可控的 step schema 移除 `verifyCommand`，驗收命令只來自受信任設定／已核定 goal。
2. 若產品必須支援 per-step command，approval 必須綁定完整結構化 executable/argv、cwd、環境與 digest；UNKNOWN 或任何可能有副作用的 command fail closed。
3. 在任何 command 執行前加入回歸：`text="inspect status", risk="low", verifyCommand="<high-risk sentinel>"` 必須停在 `needs-approval`，且 sentinel 零執行；批准後只能執行完全相同 digest。
4. 保留既有低風險純測試、pause/resume、fingerprint、checkpoint 回歸。

非目標：不新增 policy service、資料庫、跨 repo registry、GUI 或完整 command ontology。

#### Red Team 反證

- 預設 deterministic Manager 不會自行附加 step-level command。
- LLM prompt 沒有明示 `verifyCommand` 欄位。
- Engine 本身可能另有 sandbox／approval。
- PR 尚未合併或部署。

這些反證降低已發生事故的機率，但不推翻可達性：schema 明確接受欄位、風險分類忽略欄位，而 Auditor 是獨立 host command 路徑；第一階段又明確宣稱 approval gate。基於 permissions/production boundary，維持 P1，但不宣稱已有部署、資料毀損或 credential 外洩。

## Exact-head 執行證據

- PR head：`cbb5b64120d188bcc7af58537ee2597d8328310f`
- Actions run：[36803545567](https://github.com/Reese-max/autodev-ng/actions/runs/36803545567)
- 寫報告時狀態：`in_progress`；setup、checkout、Node、`npm ci`、typecheck 已成功，`test:flaky-regression` 執行中。
- 未執行高風險 sentinel 或任何 deploy/provider/runtime；此 finding 因安全原因只做 source-level reproduction。
- 缺少：command-level approval 負例、exact-head 完整 CI 結果、CLI pilot runtime、真實中斷恢復與 contention 驗證。

## 外部競品與替代工作流（查閱 2026-10-01）

| 對象 | 類型 | 最新可確認訊號 | approval / execution boundary | 判斷 |
|---|---|---|---|---|
| [LongHorizon-Harness](https://github.com/AMAP-ML/LongHorizon-Harness/releases) | 直接參考 | CONFIRMED：v0.1.7，GitHub 顯示 2026-08-20；含 Web API boundary、timeout recovery、guard failure 修正 | 強調 verified state / recovery；不把其宣稱當本 PR 安全證據 | MUST MATCH：可恢復與獨立驗證；DO NOT COPY：不照搬未驗證 boundary |
| [OpenHands Confirmation Mode](https://github.com/OpenHands/docs/blob/main/openhands/usage/confirmation-mode.mdx) | 直接替代 | CONFIRMED：文件 rolling，查閱 2026-10-01 | 高風險 action 在 execution 前交由 analyzer / confirmation policy | MUST MATCH：以實際 action 為核可單位 |
| [OpenAI Codex safety](https://openai.com/index/running-codex-safely/) | 間接替代 | CONFIRMED：2026 年官方文章，查閱 2026-10-01 | sandbox 定義技術邊界、approval 決定何時停下；高風險動作需明示 | SHOULD BE BETTER：Audit command 也須走同一 policy |
| [SWE-ReX](https://github.com/SWE-agent/swe-rex) | execution substrate | CONFIRMED：rolling main，查閱 2026-10-01 | 將 agent command 放進 sandboxed execution environment | DIFFERENTIATOR：autodev-ng 可保留本地 pilot，但不可讓 Auditor 成為旁路 |

外部產品宣稱不是效果證據；沒有用 benchmark、star、價格或行銷文字推導本產品收益。

## 產品董事會（模型多視角推演，不是獨立專家共識）

- CEO：若只做三件事，先封住 model-controlled host command、再證明 completion 不能被 no-op 綠測誤判、最後跑一個無 provider／無 deploy 的真實 pause-resume pilot。不做 dashboard、多 repo concurrency、GUI。
- CPO：長時程恢復有價值，但 approval 文案與實際 boundary 不一致，首次成功不能建立在錯誤安全感上。
- CTO：架構分層合理；`verifyCommand` 的信任來源必須從資料模型上拆開，而不是加更多 regex。
- Staff/Principal Engineer：優先移除 model-defined executable；結構化 command 與 digest approval 是足夠的小修。
- UX Lead/Researcher：使用者需要看到「將執行的精確命令」而非僅 step 摘要。
- Growth：反對先宣傳 autonomous long-running；安全 boundary 未關閉會放大信任成本。
- CFO：未核可 provider/deploy command 可能產生費用；metrics 無法補救事前授權缺口。
- Security/Privacy：P1；approval 必須覆蓋所有 host side effect，UNKNOWN fail closed。
- QA：新增零執行 sentinel、approval digest mismatch、中文/別名包裝負例。
- SRE：Auditor 應在與 Executor 同等或更嚴格的 sandbox 中；驗收不可成為控制面旁路。
- Accessibility：approval 畫面要清楚呈現 command/cwd/risk，不只顏色。
- Support：文件要區分「驗收證據」與「可執行驗收命令」，並提供被阻擋原因。

實質分歧：CPO/CEO 願保留 pilot；Security/SRE 主張未封 boundary 前整個 adapter PAUSE。折衷：保留 PR 與離線測試，但不進 default，不啟動 pilot 執行。

## 50 合成 Persona

以下為本產品輪次專用合成人物，與固定 A01–J05 CLEAN 稽核分開；30 個回歸基線、20 個探索。不是使用者票數或發生率。

| ID | 背景／限制 | 目標 | 任務旅程 | 摩擦 | 結果／分級／建議 | 證據 |
|---|---|---|---|---|---|---|
| PB-B01 | 單人 maintainer；只用 CLI | 修一個已有測試的 Issue | Issue→run start→step→verify | 預設 auditor 可能執行 Manager 夾帶命令 | BLOCKED；P1，verifyCommand 必須是可信輸入 | PR #118 source |
| PB-B02 | Windows operator；無容器 | 可恢復長任務 | start→中斷→resume | host command 邊界不清 | BLOCKED；先鎖定 host execution | PR #118 source |
| PB-B03 | Linux operator；workspace-write | 限制寫入 repo | manager→executor→auditor | Auditor 不走 executor sandbox | BLOCKED；禁止模型定義 host command | PR #118 source |
| PB-B04 | 低權限 contributor | 從 GitHub Issue 啟動 | issue text→manager plan | Issue 內容可 prompt-inject Manager | BLOCKED；P1 permission boundary | Issue #55 + PR #118 |
| PB-B05 | 高風險 release owner | 所有 deploy 需人工核可 | plan→approval→execute | gate 只看 text/risk，不看 verifyCommand | FAIL；需 exact command approval | PR #118 source |
| PB-B06 | Secrets 管理者 | 不讓代理碰 credentials | bounded step→verify | verifyCommand 可直接觸發 secret/permission script | FAIL；移除模型命令能力 | PR #118 source |
| PB-B07 | 資料庫維運者 | 禁止未核可 migration | step→verify | 文字可低風險、命令可 migration | FAIL；P1 | PR #118 source |
| PB-B08 | 成本敏感 operator | 撞 blocker 後停止 | retry→fingerprint→block | 相同指紋有上限 | PASS（靜態） | PR #118 source |
| PB-B09 | 稽核人員 | 保留 rejected evidence | execute→audit→evidence | attempt/evidence 有落盤 | PASS（靜態） | PR #118 source |
| PB-B10 | 災難復原 operator | 重啟後續跑 | pause/crash→resume | state/checkpoint 可讀回 | LIKELY；待 runtime | PR #118 source |
| PB-B11 | CI maintainer | exact-head 測試可信 | PR→Actions | 當下 CI 尚在執行 | PENDING | run 36803545567 |
| PB-B12 | 資安工程師 | 高風險 action 必停 | manager JSON→gate | verifyCommand 不納入風險分類 | FAIL；P1 | PR #118 source |
| PB-B13 | QA | 防 false completion | no-op→goal verify | 既有綠測試可能直接 complete | NEEDS_EVIDENCE；另列 Red Team，不升級本輪 finding | PR #118 source |
| PB-B14 | SRE | driver 不重複執行 | 雙 resume→lock | drive.lock 防雙驅動 | LIKELY；待 contention runtime | PR #118 source |
| PB-B15 | Support | 狀態可解釋 | status/evidence | phase/detail/attempt 可查 | PASS（靜態） | PR #118 source |
| PB-B16 | Accessibility 使用者 | CLI 錯誤可讀 | run subcommand→exit code | 文件列出 exit code | PASS（文件） | docs/long-horizon.md |
| PB-B17 | 離線 operator | 無 LLM Manager | deterministic manager→executor | 仍使用 goal verifyCommand | PASS/風險取決可信 goal | PR #118 source |
| PB-B18 | 多模型 operator | 角色分模型 | manager/executor/auditor | 角色設定分離 | PASS（靜態） | PR #118 source |
| PB-B19 | Herdr 使用者 | 只在撞頂升級 | fail×N→escalate | 每 fingerprint 一次 | PASS（靜態） | PR #118 source |
| PB-B20 | 法遵 | 操作需可追溯 | run→attempt→checkpoint | approval 未綁 verifyCommand，追溯不足 | FAIL；P1 | PR #118 source |
| PB-B21 | Repo owner | 不允許 production side effect | CLI pilot | goal 明列 non-goal，但程式未封鎖 host verify side effect | FAIL；P1 | Issue #55 + PR #118 |
| PB-B22 | Reviewer | 只接受獨立驗證 | executor ok→auditor | mechanical verify 獨立呼叫 | PASS，但 command trust 破口 | PR #118 source |
| PB-B23 | 新手 maintainer | 安全預設 | 不設 managerModel | deterministic path較少模型注入 | PARTIAL；programmatic/LLM path仍可達 | PR #118 source |
| PB-B24 | 企業 operator | approval 與 sandbox 同時要 | agent action→policy | 只有文字 regex，未做 command-level boundary | FAIL；P1 | PR #118 + external |
| PB-B25 | 測試作者 | 驗證負例 | malicious Manager step | 現有測試未覆蓋低風險文字＋高風險 verifyCommand | FAIL；補回歸 | tests source |
| PB-B26 | Windows runner | 原生命令語意 | runVerify | 既有 #48 顯示 command contract 尚在修 | RISK；不重複開單 | Issue #48 |
| PB-B27 | 成本分析者 | metrics 可比較 | runs→summary | token/cost 欄位存在 | PASS（靜態） | PR #118 source |
| PB-B28 | 值班 operator | pause/abort | interrupt→state | 有 sentinel/lock 路徑 | LIKELY；待 race runtime | PR #118 source |
| PB-B29 | Release manager | 只批准精確動作 | approve→resume | approval 綁 step 物件但 gate 未覆蓋 command | FAIL；P1 | PR #118 source |
| PB-B30 | Portfolio owner | 不讓研究直接變平台 | Issue #55→pilot | PR 一次新增 2k+ 行 | NEEDS_REVIEW；先修邊界後 pilot | PR #118 stats |
| PB-X01 | 惡意 Issue 作者 | 誘導執行部署 | issue→LLM Manager | 輸出 low-risk text + deploy verifyCommand | FAIL；P1 | SOURCE_CONFIRMED |
| PB-X02 | 被污染 repo | package script 被改寫 | auditor→npm script | host 執行可離開預期驗證 | FAIL；command allowlist | SOURCE_CONFIRMED |
| PB-X03 | 多租戶 runner | 隔離不同 repo | 不同 cwd→host | Auditor 權限繼承宿主 | FAIL；sandbox/approval | SOURCE_CONFIRMED |
| PB-X04 | 最小權限 operator | 只允許 tests | step verifyCommand | 沒有 test-only contract | FAIL；限定可信命令 | SOURCE_CONFIRMED |
| PB-X05 | 模型供應商故障 | auditorModel error | mechanical pass→LLM error | 可 fail-open 接受 | CANDIDATE P2；需另行證據 | SOURCE_CONFIRMED |
| PB-X06 | 語言非英文 operator | 高風險中文步驟 | 中文部署詞→regex | 英文 regex 不命中 | FAIL；同根因 permission gate | SOURCE_CONFIRMED |
| PB-X07 | Shell 別名使用者 | 命令以別名包裝 | gate→verify | 文字 regex 看不到命令語意 | FAIL；同根因 | SOURCE_CONFIRMED |
| PB-X08 | 審查員 | 需要 exact approval receipt | approve step→audit | receipt 不明示 command digest | FAIL；加 command digest | SOURCE_CONFIRMED |
| PB-X09 | 稽核保存者 | 避免證據遭執行命令改寫 | verify→write evidence | 命令先於 evidence，可能破壞狀態 | FAIL；先 gate | SOURCE_CONFIRMED |
| PB-X10 | 故障注入 QA | verify command timeout | auditor→blocked | 會形成 infra fingerprint | PASS（靜態） | PR #118 source |
| PB-X11 | 重啟後審批者 | 批准不可漂移 | approve→restart→resume | step 被 state 保存 | PASS，但 command 未經 gate | PR #118 source |
| PB-X12 | 供應鏈防護者 | 不跑下載腳本 | Manager verifyCommand | 可要求 curl/npm 等 host side effect | FAIL；P1 | SOURCE_CONFIRMED |
| PB-X13 | 資料保護官 | 禁止刪檔 | low text + delete command | command 不分類 | FAIL；P1 | SOURCE_CONFIRMED |
| PB-X14 | 權限管理員 | 禁止 chmod/ACL | verify command | permissions regex只看文字 | FAIL；P1 | SOURCE_CONFIRMED |
| PB-X15 | 雲端帳務 owner | 禁止 provider call | verify script | CI/host env 可能有 credential | FAIL；P1 | SOURCE_CONFIRMED |
| PB-X16 | 安全研究者 | prompt injection | Issue body→Manager JSON | schema 接受 verifyCommand | FAIL；P1 | SOURCE_CONFIRMED |
| PB-X17 | 產品經理 | 首次成功 | 啟動 CLI pilot | 功能面清楚但安全邊界阻止 release | BLOCKED；NOW | board synthesis |
| PB-X18 | 財務 | 控制成本與事故 | run metrics | 未核可命令可能造成外部成本 | FAIL；P1 | static causal chain |
| PB-X19 | 維運新人 | 依文件操作 | README→run start | 文件宣稱 approval gate，實作不完整 | FAIL；修文不夠 | docs + source |
| PB-X20 | 未來 GUI 使用者 | dashboard approve | 同一後端 | GUI 不會修補 command-level gate | DEFER GUI；先修核心 | Red Team |

合成偏好結論：不計票、不估 ROI。共同決策訊號是「先把 approval 套在實際 host action，再驗證 long-running 價值」；沒有足夠證據支持新增 dashboard、registry、資料庫或多 repo orchestration。

## NOW / NEXT / LATER / DON'T

- NOW：封閉 model-controlled `verifyCommand` 旁路；加入零執行與 exact approval binding 負例。
- NEXT：exact-head CI 完整成功後，在隔離 repo 跑 CLI pause/resume、blocked fingerprint、no-op false-completion 測試。
- LATER：有一個完整安全 pilot 後才評估 A/B metrics、GUI、multi-repo。
- DON'T：不以 regex 擴充清單假裝解完命令授權；不把 CI 綠燈當 production/runtime；不自動 merge/deploy；不啟動 worker。

## Decision Memo

- 服務誰：需在單一 repo 長時間執行一個已核定 Issue 的 maintainer/operator。
- 為何選擇：以 durable checkpoint、fresh context、independent audit 與既有 engine matrix 差異化。
- 前三優先：command trust boundary、可信 completion evidence、isolated runtime pilot。
- 不做／刪除：暫停 model-defined verify command；不加平台矩陣、GUI、跨 repo framework。
- 風險／實驗：最小負例證明未核可 command 零執行；再做一個無網路／無部署 pilot。
- Portfolio 建議：`PAUSE` merge；`SIMPLIFY` command contract；通過後再 `INVEST` pilot。這是建議，不是操作授權。

## 寫入與追蹤結果

- 新 Issue：0
- Issue 更新／重開：0
- 產品程式、CI、設定、權限、部署：0
- 新 finding：1（P1 BUG）
- 去重／互斥：Issue #55 與 PR #118 活躍，`SKIPPED_LOCKED_ACTIVE_PR`
- 中央稽核：本檔
- CLEAN：否；缺 command boundary 修正、exact-head完整 CI、runtime pilot，且全 portfolio 兩輪條件未完成
