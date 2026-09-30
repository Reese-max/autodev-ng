# Portfolio Product Board Delta — cf-ai-router

- Run: `2026-09-20T02:10:26Z`
- Scope: `Reese-max/cf-ai-router`（private、未封存、default branch `main`）
- Portfolio inventory: 42 repositories；41 未封存、1 已封存（`obsidian-vault`）
- Quality rules: `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Default HEAD inspected: `74c52130046a9f3e654fae3fe42f9bbc2224baeb`（audit-only；沒有新產品修正）
- Candidate inspected: PR #11 head `282b68d59ba0daee82fc5cf4bafe352518ebf61e`
- Result: **PARTIAL / NOT CLEAN / fixed audit 0 of 2**
- Authorization: audit/triage only；未修改產品程式、CI、設定、secret、權限，未 merge/deploy，未啟動實作 worker。

## Executive decision

**MAINTAIN / SIMPLIFY / BLOCK PR #11 UNTIL COST AUTHORITY IS NON-STALE.**

服務對象是需要在 Cloudflare Worker 上，以明確 provider chain、免費模型優先與成本上限處理 OpenAI-compatible chat 請求的小型單人／團隊部署者。合理差異化不是複製 Cloudflare AI Gateway、OpenRouter 或 LiteLLM 的廣度，而是請求送出前可解釋、可失敗關閉的成本邊界。

若只能做三件事：

1. 關閉 Issue #5 根因：Free plan 的允許證據不能是會跨帳號複製、跨升級永久存活的靜態字串。
2. 修正 provider health probe，讓它檢查實際可選的安全 chain entry，而不是只看該 provider 第一次出現的位置。
3. 取得 PR #11 exact head 的可讀執行收據；兩個零步驟失敗只能記 `UNKNOWN`，不能推定為測試、設定、政策、額度或帳務原因。

不做：不建立通用 billing control plane、動態全球路由器、新資料庫、帳號平台或自動付費升級；不因競品功能廣度擴張 Responses API 或多雲矩陣。

## Discovery and change surface

### Repository evidence

- Default HEAD `74c5213...` 只包含既有 audit 狀態，沒有產品修正；本輪未把 audit-only commit 當回歸或修復。
- README blob `432d58b19e64ea731f956d4c592340d8b55f9b03`；manifest blob `70b12c21ec22df422a5a71782e388cf4cda30e46`。
- Manifest current surface: `hono@4.12.33`、`zod@4.4.3`、`wrangler@4.118.0`、`typescript@7.0.2`、`vitest@4.1.10`。
- [Issue #5](https://github.com/Reese-max/cf-ai-router/issues/5) 已追蹤：缺省 `WORKERS_AI_ENABLED` 會啟用，且帳號 Free→Paid 後靜態設定不會失效，可能在免費額度後產生計費。
- [PR #11](https://github.com/Reese-max/cf-ai-router/pull/11) 改以 `WORKERS_AI_BILLING_MODE=free-plan-asserted|metered-opt-in|disabled`；但 checked-in `wrangler.toml` 仍含 `free-plan-asserted`，沒有可驗證的新鮮度或 account binding。
- 所有狀態 Issues、open PR、Issue comments、review threads、branches、recent commits、Actions 與 commit statuses 已核對。#5/PR #11 有活躍 owner、branch 與 unresolved reviews，故 `SKIPPED_LOCKED`。

### Exact-head execution evidence

- [Deploy run 35176503988](https://github.com/Reese-max/cf-ai-router/actions/runs/35176503988)：failure；唯一 `check` job 為 failure、`steps=null`，deploy jobs skipped。
- [CI run 35176504055](https://github.com/Reese-max/cf-ai-router/actions/runs/35176504055)：failure；唯一 `check` job 為 failure、`steps=null`。
- Candidate head combined commit statuses 為空。PR 文字宣稱 143 tests 通過，但沒有本輪可讀的 durable receipt。
- 因 jobs 沒有 step/log，直接原因保持 `UNKNOWN`；不得歸因為程式測試、runner、GitHub 政策、額度、帳務或 YAML。

## Findings and tracking

| ID | Finding / reachable impact | Classification | Evidence | Minimum effective change | Tracking / state |
|---|---|---|---|---|---|
| CFAR-11-1 | `free-plan-asserted` 只是靜態設定；帳號由 Free 升級 Paid 後仍成立，且 checked-in config 可複製到不同帳號。原 Issue #5 的「外部 billing 狀態變更後仍啟用」根因沒有關閉，請求可能在每日免費額度後計費。 | Existing `BUG / P2 / HIGH_PRE_MERGE / NEEDS_REVIEW`; `auto_implementation=false` | `SOURCE_CONFIRMED` at `282b68d...`; [review](https://github.com/Reese-max/cf-ai-router/pull/11#discussion_r4032705642) | 移除可攜、永久的 checked-in Free assertion；若無可靠 plan API，就只允許部署環境中具 account scope、到期／重驗條件的 owner attestation，否則 disabled；`metered-opt-in` 保持明確付費同意。 | Same fingerprint as [#5](https://github.com/Reese-max/cf-ai-router/issues/5); `SKIPPED_LOCKED` |
| CFAR-11-2 | `probeProviders` 先取 provider 在 chain 的第一個 entry，再套 cost gate。自訂 chain 若第一個 OpenRouter model 可計費、後面另有 `:free` model，probe 會回 `skipped: cost-gated`，即使正式 router 可使用後一個安全 entry；operator health path 因此 false-negative。 | `BUG / P2 / HIGH_PRE_MERGE / NEEDS_REVIEW`; `auto_implementation=false` | `SOURCE_CONFIRMED` at `282b68d...`; [review](https://github.com/Reese-max/cf-ai-router/pull/11#discussion_r4032705648) | 以正式 selector 的相同 eligibility/cost 規則挑選 probe entry；沒有安全 entry 才標 cost-gated，加入 billable-first/free-later regression。 | #5/PR #11 active review; `SKIPPED_LOCKED` |
| CFAR-11-3 | PR exact head 的 CI/Deploy 都在零步驟 `check` 失敗，且沒有 commit status；目前無法證明 candidate tests、build、deploy admission 或任何 runtime 路徑成功。 | `VALIDATION_GAP / severity=NOT_ESTABLISHED / decision_priority=P2 / NEEDS_REVIEW`; `auto_implementation=false` | GitHub Actions runs above; `SOURCE_CONFIRMED`, cause `UNKNOWN` | 先取得可讀失敗原因；修復後保存 exact-head test/build receipt，若要部署再另保存隔離環境 probe，不以空 job 猜根因。 | PR #11 active owner/branch; report-only, `SKIPPED_LOCKED` |

### Severity calibration

- CFAR-11-1 維持 P2：成本風險與核心 fail-closed promise 已有可達因果鏈，但未見正式超額計費、資料／權限損害或大規模事故，不升 P1。
- CFAR-11-2 影響支援的 custom chain 與 operator 恢復判斷，可能阻止可用 provider 上線或誤導故障排查，符合 P2；未證明所有部署受影響。
- CFAR-11-3 缺證據可阻止合併與 CLEAN，但不證明產品壞掉，severity 保持 `NOT_ESTABLISHED`。

### Deduplication and mutex

- Fingerprints 已對照所有狀態 Issues、open PR、review threads、comments、branches 與 prior audits。
- CFAR-11-1 與 CFAR-11-2 已由 #5、PR #11 與 unresolved review threads 追蹤；CFAR-11-3 隨相同 active candidate 保留在本報告，不另造重複單。
- Issue #5/PR #6/#10/#11 均有 owner/branch 活動；未取得 lease、未留言、未改 scope。新 Issue 0、更新 Issue/comment 0、重開 0。

## Competitor and substitute check

查閱日均為 **2026-09-20**。頁面未顯示更新日者記 `UNKNOWN`；產品文件只證明能力存在，不是獨立成效或本產品收益證據。

| Source | Current signal | Date/status | Product implication |
|---|---|---|---|
| [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) | Analytics/logging、cache、rate limit、retry/model fallback、BYOK、spend limits beta、dynamic routing beta、authenticated gateway；AI Gateway 對各方案可用。 | Updated `2026-04-20`; `CONFIRMED` | `DO NOT COPY` 廣泛 gateway；`DIFFERENTIATOR` 是窄而 deterministic 的 pre-dispatch cost authority。 |
| [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) | Free/Paid 均含每日 10,000 neurons；Paid 超額後為 `$0.011/1,000 neurons`，Free 不升級則不可超額。 | Updated `2026-09-17`; `CONFIRMED` | 方案狀態是外部可變成本條件；靜態 Free assertion 不能證明未來仍免費。 |
| [OpenRouter provider routing](https://openrouter.ai/docs/guides/routing/provider-selection) / [model fallbacks](https://openrouter.ai/docs/guides/routing/model-fallbacks) | 支援 provider sorting/filtering 與 model fallback。 | Date `UNKNOWN`; `CONFIRMED` | `MUST MATCH` selector/probe 契約一致；不因其 provider 廣度擴張本產品。 |
| [LiteLLM reliability](https://docs.litellm.ai/docs/proxy/reliability) | Proxy 提供 model/provider fallback、retry/cooldown 等可靠性能力。 | Date `UNKNOWN`; `CONFIRMED` | `SHOULD BE BETTER` 是小規模設定可解釋性；`DO NOT COPY` proxy 平台矩陣。 |
| [Portkey AI Gateway](https://portkey.ai/docs/product/ai-gateway) | 提供 gateway、routing、guardrails、observability 等整合能力。 | Date `UNKNOWN`; `CONFIRMED` | 替代工作流存在；不證明 cf-ai-router 應建立 enterprise control plane。 |

### Positioning

- **MUST MATCH:** provider/key auth、rate limit、可預測 fallback、健康檢查與實際 selector 一致、明確 cost gate。
- **SHOULD BE BETTER:** 單一 config 即可理解的 fail-closed 行為、免費模型／付費同意可追溯、不以 probe false-negative 誤導 operator。
- **DIFFERENTIATOR:** 小型 Cloudflare 部署中的 deterministic cost boundary，而不是最多 provider 或最完整 observability。
- **DO NOT COPY:** 動態全球 routing、enterprise dashboard、通用 billing/IAM、無界 provider registry、行銷式 AI optimization。

## Synthetic 50-persona exercise

純模型多視角推演，**30 回歸基線 + 20 探索**；不是 50 位真人、票數、發生率、營收或優先級證據。固定 A01–J05 稽核另計，不能由本表替代。

| ID | Background / constraint | Goal & journey | Friction / outcome | Triage recommendation / evidence |
|---|---|---|---|---|
| R01 | Free plan 個人開發者 | 部署後只用每日免費額度 | checked-in Free assertion 可用；當下 PASS、未證明新鮮度 | #5 remains; source |
| R02 | Free→Paid 升級者 | 保持不付費的舊路由 | assertion 不失效；FAIL | P2; source |
| R03 | 複製 repo 到 Paid account | 快速部署 | copied assertion 誤啟用；FAIL | P2; source |
| R04 | 明確願意付費者 | 設 `metered-opt-in` | explicit consent 路徑合理；CANNOT VERIFY | Exact-head receipt |
| R05 | 明確禁用 Workers AI | 只用外部 provider | disabled/legacy false 應 veto；CANNOT VERIFY | Regression receipt |
| R06 | 無任何 billing env | fail closed | candidate 理論 disabled；CANNOT VERIFY | Exact-head test |
| R07 | legacy `WORKERS_AI_ENABLED=true` | 升級不意外付費 | candidate 不再把 true 視為同意；PASS static | Keep compatibility message |
| R08 | legacy false 使用者 | 繼續禁用 | false 應保持 veto；PASS static | Exact-head receipt |
| R09 | 單一 Workers AI chain | 正常 probe | plan authority stale；BLOCKED | CFAR-11-1 |
| R10 | OpenRouter `:free` 單一 entry | probe 可用性 | safe entry 可選；CANNOT VERIFY | Receipt |
| R11 | billable OpenRouter first、`:free` second | probe 真實安全 entry | first-match false-negative；FAIL | CFAR-11-2 |
| R12 | free first、billable second | probe | likely selects free；CANNOT VERIFY | Selector parity test |
| R13 | 混合 provider chain | fallback | probe/dispatch 契約可能分歧；FAIL for known case | Reuse selector |
| R14 | 自訂 JSON 失敗 | 恢復預設 chain | 未在本輪重現 | Evidence backlog |
| R15 | 無 provider key | 查看 health | 需 typed missing-key；未新證實 | Regression |
| R16 | key 輪替後失效 | 診斷 401 | 真實 provider 未實測 | Runtime pending |
| R17 | 高頻 chat 使用者 | 避免超額 | 靜態 plan assertion 不夠；FAIL | P2 |
| R18 | 低流量 hobbyist | 免費使用 | 小工具價值成立；PARTIAL | Maintain narrow scope |
| R19 | 需要審計的 operator | 解釋選擇原因 | static mode 可讀但不可信新鮮度；FAIL | Scoped attestation |
| R20 | CI maintainer | 判斷可合併 | zero-step failures 無原因；CANNOT VERIFY | Validation gap |
| R21 | deploy maintainer | 判斷 production job | deploy skipped；CANNOT VERIFY | Exact-head run |
| R22 | SRE | `probe=1` 判斷復原 | false-negative；FAIL | P2 |
| R23 | on-call 新手 | 依 health UI 操作 | `cost-gated` 誤導；FAIL | Typed selected entry |
| R24 | API consumer | 發 Chat Completions | default runtime 無新產品變更 | Prior evidence only |
| R25 | rate-limit 使用者 | 收到 predictable error | 未本輪重現 | Runtime pending |
| R26 | Workers AI 暫時故障 | fallback 外部 provider | candidate exact path 未驗證 | Runtime pending |
| R27 | OpenRouter 暫時故障 | fallback Workers AI | cost authority 先阻擋 | P2 prerequisite |
| R28 | 只有 billable models | 不要暗中付費 | cost-gated 預期；CANNOT VERIFY | Regression |
| R29 | operator 手動驗證方案 | 部署 Free | attestation 如何過期不明；NEEDS_REVIEW | Narrow design |
| R30 | repo maintainer | 更新文件與 config | checked-in assertion 污染新 install；FAIL | Remove portable assertion |
| E01 | 多 account 顧問 | 用同模板部署客戶 | assertion 跨 account；FAIL | Account-scoped authority |
| E02 | staging Free／prod Paid | 共用 config | prod 誤啟用；FAIL | Env-specific attestation |
| E03 | 方案在部署後變更 | 不重 deploy | stale consent；FAIL | Expiry/revalidation |
| E04 | Cloudflare plan API 不可用 | 保持安全 | live verification 可能不可行 | Prefer disabled/owner renewal |
| E05 | 離線開發者 | 不連 provider 測試 | unit 可做、不能冒充 plan proof | Separate static/runtime |
| E06 | 惡意 config contributor | 提交 Free assertion | reviewer 可能誤接受 | No checked-in authority |
| E07 | fork 使用者 | 一鍵部署 | fork 繼承 assertion；FAIL | P2 |
| E08 | secrets manager 使用者 | 注入 metered consent | explicit path可行；CANNOT VERIFY | Receipt |
| E09 | 財務敏感小團隊 | 月底避免意外成本 | daily quota＋Paid overage 重要 | P2 |
| E10 | CFO | 限制維運成本 | 不建 billing platform | Minimum attestation |
| E11 | Accessibility operator | screen reader 讀 health | typed status/selected model 未實測 | AT runtime |
| E12 | 行動裝置 operator | 緊急查看 health | false-negative 影響復原 | P2 |
| E13 | 高延遲地區 | 選可用 provider | 不需 global optimizer | Do not expand |
| E14 | 合規環境 | 只允許特定 provider | selector/probe 必須一致 | P2 |
| E15 | data residency 使用者 | 固定 provider | 本輪無 residency contract | NEEDS_EVIDENCE, no issue |
| E16 | Responses API 使用者 | 想用新 endpoint | 方向未核定 | DEFER |
| E17 | enterprise buyer | 要完整 dashboard | 已有替代 gateway | DO NOT COPY |
| E18 | 新 contributor | 理解三種 mode | naming 可懂，authority boundary 不足 | Docs after root fix |
| E19 | support agent | 回答「為何 skipped」 | first-match 訊息錯誤 | P2 |
| E20 | security reviewer | 防止外部設定擴權 | repo 內容不可證明帳務狀態 | Fail closed |

## Product board review (model-simulated perspectives)

- **CEO:** 只做 non-stale cost authority、probe/selector parity、exact-head receipt；不追求 gateway 廣度。
- **CPO:** 產品承諾是「成本邊界可預期」，Free assertion 若會失效，功能名稱再清楚也不能發布。
- **CTO:** 若 Cloudflare 沒有可靠 plan-state API，不應虛構即時驗證；採 scoped、可到期 owner attestation 或直接 disabled。
- **Staff/Principal Engineer:** probe 必須重用正式 selector，避免第二套 first-match 邏輯；一個根因、一個最小 patch。
- **UX Lead:** `cost-gated` 應顯示實際被評估 entry 與原因；不可把有安全候選的 provider 標成不可用。
- **UX Researcher:** 先觀察三條真實 journey：新 account、Free→Paid、staging→production config 移轉；persona 不是發生率。
- **Growth:** 想增加 provider/Responses API，但同意 cost trust 未成立前不擴張。
- **CFO:** 明確 `metered-opt-in` 可接受；隱含、可攜的 Free assertion 不可接受，也不核准自建 billing 平台。
- **Security/Privacy:** repo-controlled文字不能授予外部 account billing 權限；fail closed 是信任邊界。
- **QA:** 至少覆蓋 Free→Paid stale assertion、fork/copy、billable-first/free-later、zero safe entry 四個反例。
- **SRE:** zero-step failures 只證明 workflow 沒有可讀執行；先查原因，不猜額度或 YAML。
- **Accessibility:** health 結果需文字化選定 entry/原因，手機與 screen reader 尚需 runtime。
- **Support:** false-negative probe 會製造「provider 明明可用卻被跳過」案件；重用 selector 可降低診斷分歧。

### Material disagreement

- CTO 希望 live plan verification；Staff 與 Red Team 指出官方文件確認價格，但未證明存在安全、免費且可用的 plan-state API。結論是不把未知 API 變成 blocker，先採最小 fail-closed authority。
- Growth 希望新增 routing breadth；CEO/CFO 認為 Cloudflare AI Gateway、OpenRouter、LiteLLM 已覆蓋廣度，本產品應維持小型可解釋邊界。
- QA 希望完整 provider matrix；CFO/Staff 建議先用四個可推翻候選的反例，通過後才擴必要 runtime。

## Red Team

1. **已有修復可能足夠？** 三態 enum 比舊 boolean 清楚，但無法推翻「Free assertion 會跨 plan/account 持續」的反例，故 #5 未修復。
2. **更小替代：** 不建 billing database/API。移除 checked-in assertion；無可驗證狀態時預設 disabled，owner 需在部署環境明確且可更新地 attest，付費則走 `metered-opt-in`。
3. **錯誤根因：** health false-negative 不是 provider 故障，而是 probe 與正式 selector 使用不同 entry 選擇規則。
4. **環境問題可能性：** 兩個 Actions 零步驟 failure 可能是平台、政策、帳務、設定或其他原因；沒有 logs 不能歸因，因此只列 validation gap。
5. **需求不明：** 是否必須支援部署後自動感知 plan 變更未核定；不能把完整 billing service 包裝為修 #5 的必要條件。
6. **產品規模：** 小型 router 不需要複製 enterprise gateway；官方/競品廣度是替代方案，不是新增功能證據。
7. **嚴重度反證：** 尚無實際帳單、事故或全體請求中斷，因此兩個程式 finding 保持 P2，不升 P1。
8. **CLEAN 反證：** PR 文字的 143 tests 不是 durable exact-head receipt；即使 source patch 合理也不能標 `VERIFIED_FIXED`。

## NOW / NEXT / LATER / DON'T

- **NOW:** 阻止 checked-in/permanent `free-plan-asserted` 被當成 account truth；使 probe 重用安全 selector；診斷零步驟 Actions failure。
- **NEXT:** 保存 exact-head unit/build receipt，並在隔離 account/config 驗證 Free、Paid metered opt-in、disabled、billable-first/free-later 四條路徑。
- **LATER:** 只有在 owner 核定自動 plan detection 且官方提供安全介面後，做有界驗證實驗，定義 BUILD/NARROW/REJECT。
- **DON'T:** 不建 billing control plane、資料庫、動態全球 router、Responses API 擴張、enterprise dashboard、auto-upgrade 或付費承諾。

## Verification and CLEAN state

- `SOURCE_CONFIRMED`: 本輪兩個 candidate code findings與兩個 zero-step Actions receipts。
- `EXECUTED_REPRODUCTION`: 本輪沒有；未執行真實 Cloudflare account、Workers AI quota/billing、OpenRouter、deployment 或 browser/AT 路徑。
- `NEEDS_RUNTIME_VERIFICATION`: exact-head tests/build、Cloudflare plan/account transition、provider calls、deploy、mobile/browser/AT。
- Default branch沒有產品變更；PR、diff、文字宣稱或空 job 均不構成 `VERIFIED_FIXED`。
- 固定 A01–J05 audit 尚未完成全部停止條件的兩個合格輪次及必要 runtime，因此 **Portfolio NOT CLEAN, 0/2**。

## Round accounting

- New actionable evidence findings: 3（P2 BUG 2；VALIDATION_GAP / NOT_ESTABLISHED 1）
- Existing issue whose remediation remains blocked: #5
- New issues: 0
- Updated issues/comments: 0
- Reopened issues: 0
- Deduplicated/mapped: 3/3
- `SKIPPED_LOCKED`: Issue #5, PR #11 and active duplicate/candidate branches #6/#10
- Verified fixed: 0
- Product implementation changes: 0
- Report write: pending at authoring time
- Remaining cursor: continue fair rotation after `cf-ai-router`; do not treat this audit-only report as product change.
