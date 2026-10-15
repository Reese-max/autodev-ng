# External Competitive / Product / Workflow Radar — 2026-09-13 r2

> Scope: Reese-max owned、未封存、可視為產品或持續運作產品面的 repositories。主要情報來源為 GitHub 之外的公開網路；GitHub 僅用於產品用途、近期變更、既有 Issue/PR/fingerprint 與協調核對。
>
> 本輪結論：**沒有新的高價值 fingerprint 需要建立／更新 Issue，也沒有足以推翻既有方向的市場訊號。** 新找到的強訊號都已被既有 Reese-max Issue 覆蓋，且其中 `adng-memory #4` 已有 active PR #5，因此僅記錄於本中央 radar，不搶鎖、不重複立案。

## Portfolio / Market Map

| Product | Market / Job category | Recent repository truth relevant to this radar |
|---|---|---|
| 92-duty-scheduler | 排班、缺勤補位、換班、規則治理 | 已有 #20 PolicySpec / plain-language rules、#22 Duty Inbox / swap lifecycle、#19 minimal-impact vacancy repair；相關 PR 仍在推進 |
| academic-mcp | 學術搜尋、論文證據、MCP research gateway | 已有 canonical paper identity / bundle ledger 與 reliability/security research |
| ai-flight-radar | 航班／票價情報、旅遊決策 | 仍以來源新鮮度、台灣出發 evidence 與 post-booking research 為核心 |
| ai-novel-workstation | 長篇小說工作站、AI 協作 | 已有 Agent-facing Story Workspace typed contract research |
| autodev-ng | 多 Agent 軟體工程 orchestration / governance | principal、environment、external effect、browser lease、steering、review/evidence contracts 已分層立案 |
| avatar-vfo | Avatar / VFO workflow | persona continuity 與 regression 更重要於擴張模型數 |
| cf-ai-router | AI model routing / cost / reliability | 已有 task capability/reliability routing、model lifecycle、cost fail-closed |
| cf-mcp-server | MCP gateway / Cloudflare operations | 前輪已立 #15 Tool Contract Manifest + Drift Gate；另有 protocol/canary/auth work |
| chatgpt-dual-pipeline | 雙引擎 pipeline / publishing | publication/release gate 優先於增加更多 provider |
| claude-mem | Claude context / memory | memory lifecycle、supersession、deletion 與 adng-memory 方向相鄰 |
| clinical-scribe-worker | 臨床書記 / note generation | 已有 section-scoped repair / Note Revision Receipt、specialty validation、auth hardening |
| cyber-prep-coach | 資安證照備考 | exam blueprint version、dataset version、mastery migration 仍為核心 |
| exam-archive | 考古題 archive | source/payload/search/a11y truth 優先 |
| flux-image-gen | 圖像生成／編輯 | 已有 Creative Edit Session / Reference Tray、provenance、spatial edit research |
| herdr-skills | Multi-agent skills / workflow library | skill provenance、compatibility、safe handoff 優先 |
| liao-therapist-bot | 心理對話／陪伴 bot | bounded scope、memory/privacy/safety 優先，不擴張自主權 |
| lobsterpulse | Agent monitoring / attention | 已有 Decision-only Attention Queue |
| lplrs-judicial-sync | 司法資料同步 | exact-date coverage / gap accounting / receipt 優先 |
| minideck | 簡報／publish surface | auth、CI、publication reliability 優先 |
| ninax-line-hermes | LINE / agent workflow | channel-safe handoff、receipt、role boundary |
| note-filler | 表單／筆記填寫 | claim review、decision ledger、manual edit ownership |
| personal-chatgpt-bot | 個人 assistant / chat bot | safe context, memory, connector boundaries |
| police-exam-archive | 警察考試 archive | official source provenance / versioning |
| police-exam-practice | 警察考試練習 | answer/source truth、review lifecycle |
| ppt-studio | AI presentation studio | source→claim/evidence→layout，且 remote auth/CI blocker 仍優先 |
| project-doctor-web | 醫療模擬 / case tool | ground truth 與 generated explanation 分離 |
| prompt-autoresearch | Prompt / model experimentation | deterministic evidence / trial / gate；目前 reliability baseline 優先 |
| python-winget-ui | Windows package manager UI | package source/version truth、safe update/rollback |
| shaque | niche product / exploratory | 市場定位證據不足，維持 conservative research |
| skill-foundry | Skill packaging / certification | certified bundle / install receipt / runtime compatibility |
| soundbox-offline | local-first audio player | recovery/CI 優先；NAS/WebDAV 暫不擴張 |
| taichung-police-intel | 警政情報彙整 | evidence provenance、role、freshness、live-state reconciliation |
| taiwan-intel-dashboard | 台灣情報 dashboard | source truth、freshness、operating state |
| tick-stock-panel | 股票／市場 panel | source timestamp / financial data truth |
| UkePack | 教師／兒童音樂教學包 | privacy-minimal teacher-reviewed pack set；目前仍有安全/可靠性工作 |
| video-timeline-pipeline | evidence-backed video editing pipeline | NLE handoff / CutSpec / read-back 已有 active research/PR |
| voice-actress | 法律／申論／語音輔助 | citation support、exact evidence、grading provenance |

## External Signals

### 1. CONFIRMED — XShift 將「plain-English policy → 可執行規則」與缺勤補位做成同一條 workflow

**來源日期**：公開網站目前版本，另有 2026-09-04 release coverage。  
**Sources**：
- https://www.xshift.ai/autopilot
- https://www.xshift.ai/faq
- https://www.xshift.ai/features
- https://www.businesstimesjournal.com/article/939799169-xshift-ai-expands-ai-copilot-and-autopilot-for-ai-native-employee-shift-scheduling

**Job-to-be-Done**：主管不想每次都手動記住加班、休息時間、角色資格、連續上班、週末輪替等限制；人員臨時請假時也不想重新打電話逐一詢問。

**省步驟／可靠性**：XShift 把自然語言規則先做名稱／可執行性／衝突檢查，再在 schedule build、call-out coverage、manual edit 上共用。缺勤補位依截止距離切成自動指派或 qualified-pool one-tap claim；overtime swap 則保留 manager approve。這個「effect class 決定 automation level」比單純 chatbot 更有產品訊號。

**Onboarding / distribution**：可直接貼 team list / staffing plan，系統先解析成 people、roles、availability、staffing requirements、rules，再以確認畫面核准，而不是要求先完成長設定 wizard。

**Automation / integration pattern**：Rule priority、conflict warning、before/after confirmation card、autopilot log 與 qualification filtering 被綁在同一個 canonical schedule workflow。

**Pricing / business-model signal**：XShift 以低門檻 self-serve + per-agent 定價呈現，產品設計傾向把 onboarding 與日常規則編輯都留在產品內，而不是 enterprise implementation service。價格與廠商宣稱的效率數字不作效果證據。

**限制／失敗點**：供應商自己也明確區分 hard rule 與需要 manager approval 的 overtime suggestion，且 compliance 是否符合法規仍由使用者／法律顧問判斷；因此不能把「AI 可執行規則」誤寫成「AI 會自動保證法規合規」。

**Reese-max 吸收／不照抄**：`92-duty-scheduler` 應保留 `PolicySpec → deterministic check → candidate plan → preview → approve/deny → receipt`。不應照抄 full WFM / payroll / HR SaaS，也不把自然語言本身當 authoritative policy。

**Opportunity Score**：92/100，但 **DUPLICATE**：已由 `92-duty-scheduler #20`（PolicySpec）與 #22（Duty Inbox）覆蓋，且已有相關 PR。本輪不更新、不搶鎖。

---

### 2. CONFIRMED product / LIKELY market signal — Lethe Delete 把「刪除」提升為可驗證 artifact

**Source**：https://lethe-delete.com/ （公開頁面近期新增 Agent/MCP flow）

Lethe Delete 將 AI memory deletion 拆成 `preview → confirm token → forget → signed certificate`；confirm token 綁定預覽過的 blast radius，刪除後再驗證 configured retrieval layers 中對象已不存在，並產生 Ed25519 certificate。產品也明確承認證書只證明「已配置 retrieval layers 在簽發時 verified absent」，**不代表 backups 或 model weights 已被清除**。

**JTBD**：不只要「呼叫 delete API」，而是要能在事後回答：刪了誰、哪些 layer、依據什麼範圍、何時驗證、誰能獨立驗證。

**新工作流模式**：destructive action 的 approval 不是一個泛用 yes/no，而是由 preview 所產生的 content/blast-radius bound token；另一個 verify-only actor 可以在無 DB write 權限下驗證 receipt。

**為何值得 Reese-max 保留**：這是 `adng-memory #4` 已定義 tombstone propagation / purge receipt / lineage contract 的非常直接外部驗證，也與 `autodev-ng #12` 的 exact-effect confirmation 原則一致。

**不要照抄**：不宣稱 cryptographic receipt 等於全域消失；不可忽略 clone、backup、derived summary、模型權重與外部 writer。

**Opportunity Score**：93/100，但 **ALREADY COVERED + ACTIVE WORK**：`adng-memory #4` 已有 active PR #5 `docs(memory): define deterministic lifecycle receipt contract`，且 PR 明確處理 tombstone cascade、receipt-only restart replay、stale write rejection。依 lock/coordination 規則只寫入中央 radar，不留言、不更新 #4。

---

### 3. LIKELY / emerging — Hakuya 把 memory freshness、provenance、contradiction、erasure 做成同一個 trust layer

**Source**：https://hakuya.ai/

Hakuya 將每筆 memory 綁 source/evidence/confidence，並提供 staleness decay、contradiction handling、per-subject isolation、tamper-evident change log、verified erasure。這是供應商產品頁，任何 benchmark 數字與「比其他產品更好」比較都不作獨立效果證據；本輪只保留 architecture/product-design signal。

**JTBD**：長期 Agent 最難的不是「能不能記住」，而是「目前哪一筆還能被當成 current truth、被誰修改過、是否已被新證據推翻、刪除後衍生狀態是否仍會被讀到」。

**可移植原理**：`Memory Content ≠ Evidence ≠ Freshness ≠ Activation State ≠ Deletion State`；read path 應能回 `ACTIVE / STALE / SUPERSEDED / CONTESTED / TOMBSTONED / CANNOT_VERIFY`，而不是只依 vector similarity 排序。

**Opportunity Score**：90/100，但同樣已被 `adng-memory #4` 的 lifecycle contract 覆蓋，不另立案。

---

### 4. CONFIRMED — Moises Studio 將 AI 音樂從 prompt-to-song 轉向「可編輯的共享 session」

**Source date**：2026-09-02 launch。  
**Sources**：
- https://moises.ai/newsroom/product-announcements/moises-launches-studio-collaborative-workspace/
- https://quasa.io/insights/moises-studio-makes-ai-stems-editable-and-keeps-the-exit-to-a-daw

Moises Studio 把 multitrack recording、MIDI、AI 產生的補充 parts/stems 與多人 session 放在瀏覽器工作區，核心定位不是讓 AI 取代歌曲，而是讓 AI output 保持可編輯，並保留離開產品、繼續進 DAW 的 handoff。獨立文章也提醒 launch-period 尚不足以證明 audio quality、sync、transcription、export fidelity。

**JTBD**：創作者不想「AI 生成 → 匯出 flat result → 回另一工具重做」，而是希望生成內容繼續是可修改的 project material。

**可移植到 UkePack 的部分**：teacher-reviewed pack 中，AI 產物應是 candidate stem/exercise/material，而不是 canonical 教材；若未來加入 audio 生成，應保留 editable/exportable assets 與 teacher promotion receipt。

**不該照抄**：`UkePack` 不是 browser DAW；目前 privacy/safety/reliability 優先，沒有足夠證據支持做多人即時音樂工作站。

**Opportunity Score**：83/100，僅研究清單，不立案。

## New Releases

1. **XShift Copilot / Autopilot（2026-09-04 coverage）**：multi-step schedule edits、plain-English enforceable rules、paste-to-onboard、single confirmation card。狀態：CONFIRMED vendor capability；效果聲稱不作證據。
2. **Moises Studio（2026-09-02）**：browser collaborative multitrack/MIDI/AI workspace；AI parts 可繼續編輯並保留 DAW handoff。狀態：CONFIRMED launch；品質/同步/匯出可靠性仍 UNKNOWN。
3. **Lethe Delete agent/MCP deletion flow（近期公開）**：preview-bound confirmation token + signed deletion certificate。狀態：CONFIRMED product behavior from vendor docs；跨 store completeness 仍需 runtime 驗證。
4. **Hakuya provable memory（近期公開）**：provenance/freshness/contradiction/erasure/audit。狀態：LIKELY product signal；廠商 benchmark 未獨立驗證。

## Community Pain Points

### COMMUNITY_SIGNAL — shift swap 消失後，使用者退回人工協調

Reddit Walmart 使用者描述 mobile scheduling system 中 shift swap 一度消失，只能先自己找交換對象，再請主管手動更新排班。來源：https://www.reddit.com/r/walmart/comments/1l5v99d/swapping_shift_on_app/

這是單一社群討論，不能推論 Walmart 全體使用者或市場失敗率；但它具體顯示「self-service swap lifecycle 中斷 → 人工找人 → 主管重新輸入」正是 `92-duty-scheduler #22 Duty Inbox` 應消除的工作流斷點。

### Vendor-declared pain, not independent statistics — persistent memory 的 stale/contradiction 問題

Hakuya/Lethe 都以 stale memory、無法證明刪除、derived store 殘留作為產品切入點。這些不能當成發生率，但與 `adng-memory #4` 既有學術研究與 synthetic fixtures 對齊，可作交叉驗證而非新增需求。

## Adjacent Ideas

1. **Preview-bound destructive token**：將 approval 綁定 exact target set / content hash / blast radius；若 source state 改變，token 失效。可重用到 memory deletion、batch schedule mutation、MCP dangerous tools、browser external effects。
2. **Verify-only actor**：允許獨立 actor 只驗 receipt、不取得 mutation authority。適合 autodev reviewer、memory purge、deployment verification。
3. **Paste-to-structured onboarding**：將現有 team list / staffing plan 解析成 candidate config，先 preview 再 canonicalize。可用於 92-duty-scheduler、note-filler、exam dataset import；不可直接自動落地。
4. **Editable AI artifact + exit path**：AI output 保持 project-native、可分支/回復/匯出；避免生成後被鎖在黑箱。適合 flux-image-gen、video-timeline-pipeline、ppt-studio、UkePack。
5. **Human ownership after edit**：一旦人類覆寫 candidate，後續 AI 不應 silent overwrite；已有 note-filler / creative session 類似原則，保持共用語義即可。

## Opportunity Map — 37 Products

| Product | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|
| 92-duty-scheduler | 規則衝突檢查、換班／補位有 receipt | natural-language policy 只產生 typed candidate | 台灣警校/勤務情境的可解釋 minimal-impact repair | paste-to-config onboarding | 全套 HR/payroll/WFM SaaS |
| academic-mcp | canonical identity、truthful availability/rate-limit | paper entitlement / source state | local evidence replay / research bundle | verify-only evidence actor | 把找到 DOI 當成已取得全文 |
| ai-flight-radar | source/date/fare truth | post-booking candidate monitoring | Taiwan-origin evidence | editable itinerary evidence bundle | 美國票規直接外推亞洲票種 |
| ai-novel-workstation | canonical story truth | typed external-agent patch | continuity/quality gate before promotion | editable artifact lineage | raw filesystem authority |
| autodev-ng | principal/environment/effect/receipt 分層 | exact-effect, preview-bound approvals | provider-neutral governance | verify-only reviewer | blanket auto-approve / monolithic control plane |
| avatar-vfo | persona continuity | regression fixtures | identity consistency receipt | editable generated asset | 只靠 prompt 維持人格 |
| cf-ai-router | task capability + cost truth | deterministic fallback / lifecycle state | fail-closed cost/routing | policy-bound route preview | 以 model marketing ranking 取代 task evidence |
| cf-mcp-server | protocol/auth/tool contract truth | contract drift / release gate | exact effect + tool manifest | preview-bound destructive token | connected=authorized |
| chatgpt-dual-pipeline | publication receipt | rollback/replay | dual-engine evidence comparison | verify-only publication check | provider success=published |
| claude-mem | current/stale/deleted semantics | provenance/read receipt | human-readable memory governance | signed deletion proof | vector similarity=current truth |
| clinical-scribe-worker | source-grounded note / auth | section repair / revision receipt | scoped candidate patch | human-edited field ownership | AI 靜默改完整病歷 |
| cyber-prep-coach | official exam/source version | blueprint migration | mastery evidence tied to version | paste/import candidate spec | dataset version=official blueprint |
| exam-archive | source/page/file truth | resilient search/a11y | source-level traceability | structured import preview | OCR text 取代 source image |
| flux-image-gen | lineage/provenance | edit sessions / compare / branch | reference role + receipt | editable artifact exit | latest image 覆蓋 clean parent |
| herdr-skills | skill source/version | compatibility/read-back | multi-agent skill receipt | manifest drift gate | skill installed=skill usable |
| liao-therapist-bot | bounded safety / privacy | memory lifecycle | cautious escalation | provable subject erasure research | 增加無邊界自主行動 |
| lobsterpulse | actionable attention | correlation/dedupe | decision-only queue | verify-only evidence | 每個 event 都 AI summary |
| lplrs-judicial-sync | exact-date coverage | gap/backfill accounting | source coverage receipt | independent verify | schedule success=source coverage |
| minideck | auth/CI/publish truth | source→claim→layout | small deterministic deck pipeline | editable output handoff | remote AI breadth 先於安全 |
| ninax-line-hermes | channel identity/effect scope | typed handoff receipt | LINE-native bounded action | preview-bound batch action | chat message=authorization |
| note-filler | claim/source review | user-owned manual correction | decision ledger | paste-to-structured candidate | AI 覆寫人工修正值 |
| personal-chatgpt-bot | safe context/memory | explicit memory state | personal assistant with truthful receipts | provable deletion | silent persistent memory |
| police-exam-archive | official source provenance | versioned ingestion | Taiwan police exam traceability | structured import preview | OCR-only canonical data |
| police-exam-practice | answer/source integrity | review/migration | exam-mode evidence | candidate explanation review | LLM explanation=answer authority |
| ppt-studio | auth/CI/source truth | claim/evidence/layout | provenance-preserving deck | editable artifact continuation | remote feature expansion before blockers |
| project-doctor-web | medical ground truth boundary | evidence-linked explanation | simulation truth vs generated content | human-owned correction | generated diagnosis=canonical truth |
| prompt-autoresearch | deterministic trials | evidence/read-back | research gate / reproducibility | verify-only evaluator | benchmark marketing numbers as truth |
| python-winget-ui | package source/version truth | safe update/rollback | human-readable install receipt | policy preview | silent bulk update |
| shaque | 定義產品 JTBD | 先證明市場與使用流程 | 保持小範圍探索 | adjacent workflow research | 在定位未清楚前堆功能 |
| skill-foundry | bundle identity | runtime compatibility | certified skill install receipt | tool-contract manifest | catalog entry=runtime support |
| soundbox-offline | local/recovery truth | CI/recovery before network sources | offline-first ownership | editable playlist/export | 可靠性未解先做 NAS breadth |
| taichung-police-intel | source/freshness/provenance | role + operating state | public-sector intelligence receipt | verify-only source checker | 摘要=事實來源 |
| taiwan-intel-dashboard | source timestamp/availability | stale/unknown UI | evidence-first dashboard | generated task view over canonical data | AI-owned second database |
| tick-stock-panel | timestamp/source truth | market-hours/stale state | compact verified panel | independent read-back | stale quote 顯示為 live |
| UkePack | teacher review / child privacy | candidate pack-set lineage | privacy-minimal classroom bundle | editable stem/exercise asset | full browser DAW / child accounts |
| video-timeline-pipeline | evidence CutSpec | target capability/read-back | evidence-backed NLE handoff | editable AI artifact | 自建完整 NLE |
| voice-actress | exact source/citation support | claim→authority verification | legal/exam provenance | verify-only evidence actor | citation exists=supports claim |

## Top 10 Cross-Portfolio Ideas

1. **Preview-bound capability/effect token** — approval 必須綁 exact target set / content hash；state drift 後失效。
2. **Independent Verify-only Mode** — reviewer 可驗 receipt / final state，但沒有 mutation authority。
3. **Candidate Import instead of Auto-Import** — paste/file ingestion 先解析、diff、preview，再 canonicalize。
4. **User-Owned Mutation Bit** — 人工修正後該欄位／artifact 不被 AI silent overwrite。
5. **Editable AI Artifact Contract** — AI output 應保持可修改、可 branch、可 export，而非 flat final output。
6. **Truthful Scope Receipt** — receipt 要明示它證明哪些 layer、哪些時間點，也明示不涵蓋哪些 backup/model/external system。
7. **Policy Conflict as First-class State** — 不把 conflicting policies 靜默排序；要有 priority/reason/override receipt。
8. **Effect-class Automation Levels** — read、prepare、suggest、safe apply、dangerous apply 分開，不用單一 autonomy toggle。
9. **Freshness before Reuse** — memory/tool/session/evidence 重用前都先驗 predecessor/hash/freshness。
10. **Delete/Simplify before Add** — 如果外部專業工具已提供 canonical editing target，Reese-max 專注候選規格、evidence、read-back，不重做整個編輯器。

## Ideas Rejected / Deferred

1. **再開 92-duty-scheduler 自然語言規則 Issue — REJECT (duplicate)**：#20 已存在，且有實作/研究 PR。
2. **再開 Duty Swap / Call-out Inbox Issue — REJECT (duplicate)**：#22 已涵蓋。
3. **用 Lethe Delete 再開 Memory Deletion Issue — REJECT (duplicate + active PR)**：adng-memory #4 + PR #5 已覆蓋 tombstone/receipt/restart replay；本輪不搶鎖。
4. **直接採 Hakuya 作為新的 memory backend — REJECT**：目前 evidence 支持 lifecycle contract，不支持重新選 DB/framework；會形成不必要遷移。
5. **UkePack 做 browser multitrack DAW — REJECT**：Moises 的信號是「editable / collaborative / exit path」，不是要求 UkePack 複製整個 DAW；strategic fit 不足。
6. **把 vendor benchmark / productivity claims 當 Success Metric — REJECT**：缺獨立 runtime evidence。
7. **把 cryptographic deletion certificate 稱為全域刪除 — REJECT**：backup、clone、derived state、model weights 仍可能在 contract 外。

## Issue / PR Mapping

| Signal | Existing Reese-max work | Action this round |
|---|---|---|
| XShift enforceable plain-English scheduling policies | `92-duty-scheduler #20` PolicySpec + related PR | Central report only |
| XShift call-out / swap lifecycle | `92-duty-scheduler #22` Duty Inbox | Central report only |
| Lethe preview-bound deletion + receipt | `adng-memory #4` lifecycle/deletion contract; active PR #5 | **No comment / no lock / no issue update** |
| Hakuya freshness/provenance/erasure | `adng-memory #4`; claude-mem adjacent | Research reinforcement only |
| Moises editable shared creative session | `UkePack #3` pack-set workflow; flux-image-gen #22 / video timeline #11 analogous | Research list only |
| Tool-contract drift | `cf-mcp-server #15` from prior radar | No repeat notification |

## Sources

### Scheduling / workforce
- XShift Autopilot — https://www.xshift.ai/autopilot — accessed 2026-09-13 — **CONFIRMED vendor docs**
- XShift FAQ — https://www.xshift.ai/faq — accessed 2026-09-13 — **CONFIRMED vendor docs**
- XShift Features — https://www.xshift.ai/features — accessed 2026-09-13 — **CONFIRMED vendor docs**
- Business Times Journal / release syndication, 2026-09-04 — https://www.businesstimesjournal.com/article/939799169-xshift-ai-expands-ai-copilot-and-autopilot-for-ai-native-employee-shift-scheduling — **LIKELY release corroboration; not independent performance evidence**
- Reddit Walmart shift swap — https://www.reddit.com/r/walmart/comments/1l5v99d/swapping_shift_on_app/ — **COMMUNITY_SIGNAL**, anecdotal only

### Agent memory / deletion
- Lethe Delete — https://lethe-delete.com/ — accessed 2026-09-13 — **CONFIRMED product design from vendor docs; completeness limited to configured layers**
- Hakuya — https://hakuya.ai/ — accessed 2026-09-13 — **LIKELY emerging product signal; benchmark/competitive claims unverified here**

### Creative workflow
- Moises Studio launch, 2026-09-02 — https://moises.ai/newsroom/product-announcements/moises-launches-studio-collaborative-workspace/ — **CONFIRMED vendor release**
- QUASA coverage, 2026-09-07 — https://quasa.io/insights/moises-studio-makes-ai-stems-editable-and-keeps-the-exit-to-a-daw — **LIKELY independent workflow summary; explicitly notes quality/export evidence gap**

## What Changed Since Last Radar

上一份 2026-09-13 radar 的最高價值新訊號是 `cf-mcp-server #15 Tool Contract Manifest + Drift Gate`。本輪沒有找到另一個能通過「高價值 + 公開證據充分 + 與現有能力不重複 + 沒有 active conflicting workflow」門檻的 fingerprint。

新增的是三組**交叉驗證**：

1. **Scheduling governance 更明確**：XShift 的最新 Autopilot/Copilot 把 natural-language policy、conflict detection、multi-step preview、call-out automation 與 effect-specific approval 綁在一起；但 Reese-max 已由 `92-duty-scheduler #20/#22` 覆蓋。
2. **Provable memory lifecycle 正在形成產品類別**：Lethe/Hakuya 都把 delete/freshness/provenance/receipt 從 storage implementation 拉升為 user-facing trust primitive；但 `adng-memory #4` 已提前建模，且 PR #5 正在工作，因此只增強證據，不搶工作。
3. **Creative AI 從 final generation 轉向 editable session**：Moises Studio 再次支持「Generated Output ≠ Canonical Artifact」；此模式與 flux-image-gen / video-timeline-pipeline / UkePack 既有方向一致，沒有足夠理由新增大功能。

因此本輪的正確產品決策是 **CONSOLIDATE / VERIFY，而不是 ADD FEATURE**。

### Round-level decision

- New high-value Issue created: **0**
- Existing Issue updated: **0**（`adng-memory #4` 有 active PR #5，依協調規則不碰）
- Product code / branch / merge / deploy / secret / permission / repository setting changes: **0**
- Notification threshold: **未達**（新訊號強，但皆為既有 fingerprint 的 reinforcement，沒有新的高價值機會或方向翻轉）

**Portfolio principle retained:** `New External Signal ≠ New Feature；Strong Evidence + Existing Fingerprint = Consolidate, not Duplicate.`
