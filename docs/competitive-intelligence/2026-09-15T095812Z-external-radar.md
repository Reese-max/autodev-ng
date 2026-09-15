# 外部競品／新品／工作流靈感雷達 — 2026-09-15T09:58:12Z

> 查閱日：2026-09-15（UTC；臺灣 2026-09-15）。
>
> Issue Quality：`issue_quality_version: 2`；規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`（`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`）。
>
> 本輪只做公開網路研究、repository / Issue / PR / audit 唯讀核對，以及新增本中央雷達報告。沒有修改產品原始碼、CI/config、secret、權限或 repository settings；沒有建立實作 branch、merge/deploy、啟動 worker/run/GOAL、付費試用或變更正式資料。

## Executive Summary

延續上一輪 `2026-09-15T080004Z-external-radar.md` 的公平輪巡，本輪深讀 `Reese-max/clinical-scribe-worker`。

重新完整分頁列舉 connected owner inventory：**42 個 Reese-max owned repositories，3 archived、39 owned + unarchived**；第二頁為空。沿用目前已核對範圍 **36 product-like + 3 support/compatibility-only**（`adng-memory`, `internship-notes-sites-mirror`, `police-exam-practice`），未操作他人 repository。

本輪找到四組有價值的外部訊號，但經 Issue Quality v2 四道 Gate 後，決策為：**0 新 Issue、0 既有 Issue 修改、0 新實作授權**。

原因不是沒有新情報，而是：

1. **Suki 2026-08-25 將 AI Dictation 與 ambient documentation 解綁**，證明成熟臨床文件市場正把「逐字控制」與「ambient 摘要」視為不同 JTBD，而不是要求每個使用者都走同一模式。`clinical-scribe-worker` 已有打字、Web Speech 逐字稿與合成測試輸入，沒有 repo 證據顯示再增加另一套 dictation engine 是目前主要摩擦。
2. **Abridge 2026-09-14 把 encounter evidence 帶到 pre-bill discrepancy review**，顯示來源證據若能沿 downstream workflow 保留，能減少「重新找原始紀錄 → 手工比對 → 再解釋差異」。但這個可移植原理與現有 `#4` validation/source-fidelity、`#7` candidate repair/revision receipt 高度重疊，而且 `#4` / `#7` 都有 active research PR（#12 / #9）；依協調規則本輪 `SKIPPED_LOCKED`，只記中央報告。
3. **MHRA / NHS England 2026-07-29 新指引明確把產品 intended purpose 當監管分界**：純 transcription / summarisation / draft letters / suggested codes for clinician review，與 diagnosis/treatment/prevention support 或未經 clinician review 的自動 action 有不同醫療器材監管後果。這是重大市場方向訊號，但 current repo 已在 UI 明確標示「僅供合成資料與非臨床研究、禁止真實病患／個資、不得用於臨床實務或提供醫療建議」，因此本輪不是新增缺陷，而是再次確認 **不要把競賽／研究原型偷偷擴成真實臨床決策系統**。
4. **Web Speech API 現在已有 experimental `SpeechRecognition.processLocally`**：設為 `true` 可要求 on-device recognition；預設 `false` 時 browser/user agent 可選 local 或 remote。現行 `public/scribe.html` 使用 Web Speech API，但沒有設定 `processLocally`。這形成一個真實技術差異，但 current supported scope 禁止 PHI／真實病患，因此尚未證明目前使用者有 privacy/compliance failure；先列 `ADJACENT IDEA / NEEDS_EVIDENCE`，不硬開 Issue。

本輪最重要的產品校準不是「再加 ambient AI 能力」，而是：

> **Input mode、evidence lineage、intended use、clinical authority 必須分開。**
>
> `speech captured` ≠ `speech processed locally` ≠ `transcript clinically valid` ≠ `note approved` ≠ `diagnosis/treatment authority`。

---

# Scope / Repository Truth

## Repository enumeration

Owned + unarchived（39）：

`92-duty-scheduler`, `academic-mcp`, `adng-memory`, `ai-flight-radar`, `ai-novel-workstation`, `autodev-ng`, `avatar-vfo`, `cf-ai-router`, `cf-mcp-server`, `chatgpt-dual-pipeline`, `claude-mem`, `clinical-scribe-worker`, `cyber-prep-coach`, `exam-archive`, `flux-image-gen`, `google-maps-personal-mcp`, `herdr-skills`, `internship-notes-sites-mirror`, `lobsterpulse`, `lplrs-judicial-sync`, `MaterialYouNewTab`, `minideck`, `neciken-summer-poem`, `ninax-line-hermes`, `note-filler`, `police-exam-archive`, `police-exam-practice`, `ppt-studio`, `project-doctor-web`, `prompt-autoresearch`, `skill-foundry`, `soundbox-offline`, `spotify-playlist-organizer-mcp`, `taichung-police-intel`, `taiwan-intel-dashboard`, `tick-stock-panel`, `UkePack`, `video-timeline-pipeline`, `voice-actress`。

Archived / excluded：`gemini-deidentifier`, `obsidian-vault`, `openab`。

Support / compatibility-only：`adng-memory`, `internship-notes-sites-mirror`, `police-exam-practice`。

本輪 inventory 由 connected GitHub owner search 重新取得（page size 100；page 2 empty），不是沿用舊 inventory 當全集。

## Current product truth — `clinical-scribe-worker`

- Default branch：`main`。
- Current HEAD observed：`4de4e7e9976f9f17619f0b9f4caaed2d5e23b2b5`（2026-09-13，latest commit 為 audit evidence docs；主要產品／security code recent baseline 仍可追到 `88bb746...`）。
- README 定位：Cloudflare Worker 版「醫病博弈控制台」，Clinical Scribe 是其中一個入口；server-bound Gemini；已有 fail-closed auth、shared/durable rate limiting、daily budget、quota/health、kill-switch 等邊界。
- `public/scribe.html` UI 明確寫：**競賽原型僅供合成資料與非臨床研究；禁止真實病患／個資；不得用於臨床實務或提供醫療建議。**
- Current input workflow：textarea 手動逐字稿、病患回答快速輸入、Web Speech API `zh-TW` 語音逐字稿、synthetic/random test tools。
- Current output workflow：differential → SOAP；SOAP 必須人工核對後再存入病歷；可 copy / download；去識別化 checkbox 同時明示逐字稿與 SOAP 仍可能含姓名等個資，外傳前仍需人工清理。
- `src/scribe.ts` 已有 source-fidelity 與 anti-hallucination prompt boundary：未提供的病史/體徵不可補、vitals 不可改寫；SOAP Plan 禁止直接可執行的藥名／劑量／途徑／頻次醫囑。
- 實體裝置目前只允許醫師確認後控制桌面警示燈；UI 明示 AI 不直接做診斷、給藥、分流或其他醫療處置。

### Observable voice-input behavior

Current `public/scribe.html`：

```js
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const rec = new SR();
rec.lang = "zh-TW";
rec.continuous = true;
rec.interimResults = true;
```

沒有設定 `rec.processLocally = true`。

因此可靜態證明的是：**這個產品沒有要求 Web Speech 必須在本機處理。** 依目前 Web Speech API 語意，在 `processLocally=false`（預設）時，實際 recognition 可由 user agent 選擇 local 或 remote。

不能由此推論：

- 某個特定瀏覽器目前一定把音訊送到特定供應商；
- current product 正在處理真實病患 PHI；
- 已發生 privacy incident；
- 設 `processLocally=true` 就可立即安全上線臨床。

因為 current supported scope 明確禁止真實病患／PHI，所以這目前是 **future-scope design signal，不是 P0/P1/P2 defect**。

## Existing issue / PR truth and coordination

### #4 — Specialty-scoped validation packs

Existing Issue #4 已追蹤：specialty/workflow validation、omission、unsupported addition、speaker misattribution、negation / temporal flip、source fidelity、per-pack release receipt。

Active PR #12：`docs: validation packs design`
- state: OPEN
- branch: `devin/issue-4-validation-packs`
- base: current `4de4e7e...`
- research-only；1 changed file。

本輪新的 NHS/MHRA lifecycle monitoring、Abridge downstream evidence 與 Suki market evidence **不得藉換名字擴大或搶改 #4**。

### #7 — Section-scoped repair / revision receipt

Existing Issue #7 已追蹤：single-section regeneration、candidate patch、before/after diff、source-aware validation、accept/reject、undo/restore、stale input、manual-edit preservation。

Active PR #9：`docs: section-scoped repair + revision receipt (schema)`
- state: OPEN
- branch: `devin/issue-7-research`
- research-only；1 changed file。

Abridge 的「final coded claim ↔ original clinical evidence ↔ discrepancy review」是新的外部證據，但 transferable principle 已落在 source-aware candidate/review lineage；依協調規則標記 **SKIPPED_LOCKED**，不留言、不改 scope。

### Higher-priority operational work

- #6：P0 Cloudflare Access JWT cryptographic verification；PR #8 OPEN。
- #10：P2 executing CI/security-test gate；PR #11 OPEN。

在這些 trust / runtime gates 尚未完成前，不應因競品有 EHR integration、coding、orders、ambient capture 就擴張 production mutation surface。

---

# Product → Market Category

`clinical-scribe-worker` 的有效比較範圍：

1. Ambient / clinical documentation：Suki、Nabla、Abridge、Microsoft Dragon Copilot。
2. Dictation / verbatim documentation：Suki Dictation 與傳統 clinical dictation workflow。
3. Evidence-backed review / clinical documentation integrity：Abridge CDI/pre-bill、clinical validation programs。
4. Browser-native speech input / on-device recognition：Web Speech API（僅作技術相鄰訊號）。
5. Regulatory / governance：MHRA / NHS England ambient voice guidance。

不把 commercial EHR integration、autonomous coding、diagnosis、orders 或 billing automation 自動視為本研究原型的 must-have。

---

# External Signals

## A. Direct competitor — Suki 把 AI Dictation 與 ambient documentation 解綁

**CONFIRMED｜2026-08-25｜checked 2026-09-15**

Source:
- https://www.suki.ai/press-releases/suki-breaks-the-ai-dictation-bundle-giving-health-systems-the-freedom-to-choose/

Suki 於 2026-08-25 發布 Suki Dictation，可獨立部署，也可與 ambient clinical documentation 一起使用，並強調某些 specialty / note type / sensitive conversation 更需要 verbatim dictation 的精確控制。

### JTBD

不是每一次 encounter 都適合「全程 ambient → AI 自動整理」。有些使用者只想：

`我說什麼 → 高品質逐字／修正文句 → 我掌握最終內容`。

### 減少的人工步驟

成熟產品正在減少「為了要 dictation，被迫啟用一整套 ambient bundle」的工具/採購摩擦。

### Onboarding / distribution / business-model signal

- 能力可單獨部署或組合，而不是全功能強綁。
- 與 Epic / MEDITECH 內嵌是 distribution strategy；不是本專案必須照抄的功能。
- 官方公告強調「只購買需要的 capabilities」，這是 packaging 訊號；本輪未取得可比較的公開 unit price，因此不虛構價格優勢。

### Limit / counterargument

Suki 是正式醫療商用產品；Reese 是 synthetic-only competition/research prototype。兩者安全、法規、integration maturity 不同。

### Transfer / Do not copy

可移植：**讓 input mode 對應真正 JTBD，不把 ambient 當唯一入口。**

不照抄：目前 Reese 已有 typed transcript + speech transcript + synthetic generator；沒有證據顯示「再做一個 proprietary dictation engine」比 #6/#10/#4/#7 更重要。

**Decision：NO ISSUE / radar-only。**

---

## A2. Direct/adjacent competitor — Abridge 把 encounter evidence 延伸到 pre-bill discrepancy review

**CONFIRMED｜2026-09-14｜checked 2026-09-15**

Source:
- https://www.abridge.com/press-release/pre-bill-review-for-cdi-and-coding-teams

Abridge 2026-09-14 宣布 pre-bill review：把 final coded diagnoses / DRG 與臨床 documentation 支持程度做比對，並把每個 discrepancy 背後的 evidence 顯示給 CDI/coding teams，在 claim 送出前處理。

### JTBD

Downstream reviewer 不想重新：

`找 encounter → 翻 note → 猜某個 code/claim 是從哪裡來 → 手動比對 → 再決定修不修`。

### 可移植原理

`Downstream derived artifact → evidence comparison → reviewer sees exact support/gap → explicit resolution`

### Evidence caveat

這是 Abridge 自己的產品公告，可以確認功能/定位，**不能拿來證明它降低 denial rate 或 Reese 產品會省多少時間**。

### Reese fit

對 `clinical-scribe-worker` 真正有用的不是新增 billing，而是：

- note/derived claim 若進入 review，應能指回 source evidence；
- discrepancy 應是 reviewer-visible state，而不是 hidden AI confidence；
- downstream artifact 不應把 upstream uncertainty 洗掉。

但這已與 #4 source fidelity / evidence receipt、#7 source-aware revision review 高度重疊，且兩者都有 active PR。

**Decision：SKIPPED_LOCKED；只保留中央雷達，0 Issue comment。**

---

# Adjacent Ideas

## B. MHRA / NHS England — intended purpose 是 ambient voice 產品的重要產品邊界

**CONFIRMED｜2026-07-29｜checked 2026-09-15**

Sources:
- https://www.gov.uk/government/news/mhra-clarifies-regulatory-status-of-ambient-voice-technologies-used-in-the-nhs
- https://www.gov.uk/government/publications/ambient-voice-technology-enabled-products/ambient-voice-technology-enabled-products
- https://www.england.nhs.uk/publication/guidance-on-the-use-of-ai-enabled-ambient-scribing-products/
- https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/

MHRA 2026-07-29 的界線很值得產品設計直接吸收：

- 僅 intended for transcription、clinical-conversation summarisation、draft letters、或 suggested clinical codes **供 clinician review** 的 AVT，在目前 GB framework 下不因這些用途本身成為 medical device；
- intended to support diagnosis、treatment、prevention，或在沒有 clinician review 下採 automated actions（例如 placing orders）的 AVT，則落入醫療器材監管範圍；
- NHS England 同日更新 guidance，要求透明、traceability、human review、privacy/consent、information quality、automation-bias risk、incident handling、ongoing monitoring，並提醒功能變更可能改變監管狀態。

### Product implication

`clinical-scribe-worker` current UI 同時具有「clinical documentation assistant」與 differential / suggested workup/referral research output，但它也明確把 intended use 限在 **synthetic / non-clinical research**。

因此這不是要求現在新增「regulatory framework」的理由，而是確認一個重要 product-scope rule：

> **若 future owner 要把它從 synthetic research prototype 改成真實臨床產品，先重新核定 intended purpose / authority boundary，再談功能擴張。**

### Why not an Issue now

- current supported scope 已明確禁止真實病患、PHI、臨床實務與醫療建議；
- 未證明有真人 clinical deployment；
- UK/GB guidance 不可直接當成臺灣法律結論；
- 法規訊號可限制 scope，但不能憑空創造目前產品 defect。

**Decision：DO NOT COPY / SCOPE GUARDRAIL；NO ISSUE。**

---

# New Tools / Technology

## C. Web Speech API — `processLocally` 可要求 on-device speech recognition，但仍是 experimental

**CONFIRMED capability / UNKNOWN release date｜current MDN checked 2026-09-15**

Source:
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/processLocally

MDN current documentation：

- `SpeechRecognition.processLocally = true` 時 recognition 必須在裝置本地執行；
- 預設 `false` 時，由 user agent 決定 local 或 remote；
- 此能力標記為 **Experimental**，需檢查 browser compatibility；on-device mode 還涉及 language pack availability。

### Current repo gap

`public/scribe.html` 使用 `SpeechRecognition` / `webkitSpeechRecognition`，但未設定 `processLocally`，也沒有在麥克風控制旁揭示目前 browser recognition 是否本地處理。

### Counterargument first

目前 UI 已明示禁止真實病患／PHI。對 synthetic-only supported workflow，這不是可證實的 PHI privacy failure；而 `processLocally` 尚屬 experimental，也不適合直接把 browser-native speech 當成臨床資料安全保證。

### Smallest future research, only if scope changes

若 owner 未來真的批准 real-clinical / privacy-sensitive speech research，最小問題應是：

`在已支援 browser / language pack 組合中，是否能 deterministic 顯示 LOCAL_REQUIRED / REMOTE_POSSIBLE / UNSUPPORTED，且 unsupported 時 fail closed 或回到 explicit typed input？`

先做 capability detection / disclosure，不先建 ASR service、音訊儲存、device registry 或新 speech pipeline。

**Decision：ADJACENT IDEA / NEEDS_EVIDENCE；NO ISSUE。**

---

# Community Pain Points

## AI notes 的 downstream readability / propagated-error 擔憂

**COMMUNITY_SIGNAL｜2026-09-11 / 2026-06-10｜checked 2026-09-15**

Sources:
- https://www.reddit.com/r/hospitalist/comments/1wdq4f7/ai_written_notes/
- https://www.reddit.com/r/medicine/comments/1u24dul/please_please_proofread_your_ai_notes/

近期 clinician/community 討論中反覆出現兩種個別經驗：

1. AI note 過長／冗餘，對下一位讀者的實用性下降；
2. 語音或 note 中的錯誤若未被 review，可能被 downstream copy/paste 放大。

這些是 **anecdotal evidence**，不能當錯誤率、採用率、節省時間或臨床傷害發生率。

對 Reese 的可用訊號只有：

- human review 不應被 UI 隱藏；
- source fidelity / repair workflow 比「更多文字」更重要；
- downstream derived note 不應失去 upstream uncertainty / evidence。

而這些都已落在 current safety boundary、#4、#7，因此不開新單。

---

# Opportunity Map — `clinical-scribe-worker`

| 類別 | 本輪結論 |
|---|---|
| **MUST MATCH** | 保持 human review、source-fidelity、synthetic/non-clinical boundary、auth/quota/kill-switch；先完成已存在的 #6/#10 trust gates，而不是增加新的 clinical action。 |
| **SHOULD BE BETTER** | 未來若 speech path 被核准進 privacy-sensitive scope，應清楚揭示 local/remote capability；目前不升級成 defect。 |
| **DIFFERENTIATOR** | 將 synthetic validation、source support、candidate repair 與 explicit human approval 做成可驗證 evidence，而不是只宣稱「AI note 很準」。此方向已由 #4/#7 研究，勿另造 framework。 |
| **ADJACENT IDEA** | Evidence lineage 可延伸到 downstream review；browser on-device speech 可作 future research；能力須按 intended use 分層。 |
| **DO NOT COPY** | 不因競品有 coding / billing / EHR push / orders / diagnosis automation 就加入；不把商用 vendor 功能公告當效果驗證；不把 experimental local speech 當 PHI 合規保證。 |

---

# Four-Gate Evaluation

## Candidate 1 — 強制 on-device Web Speech

### 1. Problem / value
- Observable: current code 未設定 `processLocally`。
- User pain: **UNKNOWN**；current supported user 只能使用 synthetic/non-PHI data。
- Existing alternative: typed transcript；也可不使用 mic。
- No-change impact: 對目前明確 scope，沒有可證明的核心任務失敗。

### 2. Priority
- `kind=OPPORTUNITY/RESEARCH_CANDIDATE`
- `severity=NOT_ESTABLISHED`
- `decision_priority=LOW` under current scope
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`

### 3. Smallest option
1. 不改：目前合成資料 scope 可成立。
2. 若 scope 擴張：先做 capability disclosure / detection。
3. 只有 evidence 證明 browser support / privacy JTBD 後，才研究 local-required speech。
4. 不先建 audio storage / ASR service / speech registry。

### 4. Research/implementation separation
目前甚至未到需要獨立 Issue 的門檻；留中央 radar。

**Decision：NO ISSUE。**

---

## Candidate 2 — downstream evidence-backed discrepancy review

### 1. Problem / value
Abridge external signal很強，但 Reese repo 目前沒有 billing/claims workflow；真正可移植的是 source/evidence lineage。

### 2. Priority
與 #4/#7 重疊；不是新的 severity finding。

### 3. Smallest option
重用現有 validation / candidate revision research，不新建「clinical evidence ledger」。

### 4. Coordination
#4 → active PR #12；#7 → active PR #9。

**Decision：SKIPPED_LOCKED；NO ISSUE UPDATE。**

---

## Candidate 3 — 新增專用 AI Dictation engine

### 1. Problem / value
Suki 的產品證據確認 dictation 與 ambient 是不同工作，但 current Reese 已有 typed + speech transcript；沒有 evidence 表明 accuracy/latency/control 是 current top friction。

### 2. Priority
`kind=OPPORTUNITY`
`severity=NOT_ESTABLISHED`
`triage=NEEDS_EVIDENCE`

### 3. Smallest option
先使用現有 speech / typed input；若 future usability evidence 指向 verbatim control，再做 narrow research。

### 4. Counterargument
新 ASR/provider 會增加 browser/provider support、privacy、cost、test matrix；目前不值得。

**Decision：REJECT NOW / radar-only。**

---

## Candidate 4 — 因 MHRA/NHS guidance 建立 regulatory subsystem

### 1. Problem / value
External rule clarifies intended-purpose boundary，但 current product explicitly non-clinical/synthetic-only。

### 2. Priority
沒有現行 supported-user failure，不是 BUG。

### 3. Smallest option
保留 current scope disclaimer / human-review boundary；若 owner 核定真臨床 use，再獨立做 jurisdiction-specific product/regulatory review。

### 4. Counterargument
現在建立 regulatory database / compliance engine 是明顯 scope creep，也不能用 GB guidance 冒充臺灣法律。

**Decision：DO NOT BUILD。**

---

# Cross-Portfolio Ideas

本輪只有一個值得跨產品保留、但不需新 umbrella Issue 的原則：

## Intended-use / authority split

對 `clinical-scribe-worker`, `project-doctor-web`, `voice-actress` 等高風險知識產品，產品應把下列狀態分開：

`input provenance → candidate content → validated/reviewed content → permitted action`

外部市場訊號顯示「內容生成」與「可採取的 downstream action」不是同一授權層。現有 portfolio 已大量採 candidate/review/effect boundary，因此本輪只保留為設計原則，不再造跨 repo framework。

---

# Rejected Ideas

1. **新增 EHR push / order placement / autonomous coding** — current repo non-clinical research scope不支持；又會直接擴張 security/regulatory surface。
2. **建立完整 clinical provenance database/ledger** — 問題根因未證明；#4/#7 已有較小 evidence/receipt research。
3. **把 Abridge pre-bill 功能照搬進 Reese** — 沒有 billing JTBD；只吸收 evidence-backed discrepancy review 原理。
4. **因 `processLocally` 存在就強制改 Web Speech** — current user scope不是 PHI；API experimental；缺 browser/runtime evidence。
5. **再開一張 specialty validation Issue** — duplicate #4，且 PR #12 active。
6. **再開一張 note-versioning / repair Issue** — duplicate #7，且 PR #9 active。
7. **用 Reddit error anecdote 推導 P1/P2** — 社群訊號不是發生率或本 repo reproduction。
8. **用 Suki/Abridge vendor 省時或效果文案推估 Reese ROI** — 不採用；本輪沒有獨立成效量測。

---

# Issue Mapping

| Candidate / signal | Existing tracking | Status this round | Reason |
|---|---|---|---|
| specialty/source-fidelity validation | `clinical-scribe-worker #4` / PR #12 | `SKIPPED_LOCKED` | active research PR；Abridge/NHS evidence可支持原方向，但不改 scope |
| section repair / evidence-linked revision | `clinical-scribe-worker #7` / PR #9 | `SKIPPED_LOCKED` | active research PR；Abridge downstream evidence為相鄰支持，不重開 |
| auth trust boundary | #6 / PR #8 | unchanged | security work比新 feature 更優先 |
| executing CI/security gate | #10 / PR #11 | unchanged | runtime/CI trust work比新 feature 更優先 |
| on-device Web Speech | none | radar-only | current synthetic-only scope下 user value / risk 未建立 |
| new dictation engine | none | rejected-now | current input alternatives already exist；缺需求證據 |
| regulatory subsystem | none | rejected | current product intended use明確非臨床；future scope需另核定 |

**New Issue：0**

**Existing Issue updates：0**

**Issue lock writes：0**（沒有修改 Issue，因此不需要建立 marker；active PR 已足以要求本輪退出相關 scope）。

---

# Sources

| Date / update | Source | Confidence | What it supports |
|---|---|---|---|
| 2026-08-25 | https://www.suki.ai/press-releases/suki-breaks-the-ai-dictation-bundle-giving-health-systems-the-freedom-to-choose/ | CONFIRMED | AI dictation unbundled from ambient documentation；input JTBD segmentation |
| 2026-09-14 | https://www.abridge.com/press-release/pre-bill-review-for-cdi-and-coding-teams | CONFIRMED feature announcement | downstream clinical evidence → discrepancy review before billing |
| 2026-07-29 | https://www.gov.uk/government/news/mhra-clarifies-regulatory-status-of-ambient-voice-technologies-used-in-the-nhs | CONFIRMED | intended-purpose medical-device boundary |
| 2026-07-29 | https://www.gov.uk/government/publications/ambient-voice-technology-enabled-products/ambient-voice-technology-enabled-products | CONFIRMED | MHRA detailed AVT regulatory guidance |
| updated 2026-07-29 | https://www.england.nhs.uk/publication/guidance-on-the-use-of-ai-enabled-ambient-scribing-products/ | CONFIRMED | NHS governance / adoption guidance |
| updated 2026-07-29 | https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/ | CONFIRMED | transparency / traceability / liability context |
| update date UNKNOWN; checked 2026-09-15 | https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/processLocally | CONFIRMED capability / experimental | local-required speech recognition semantics |
| 2026-09-11 | https://www.reddit.com/r/hospitalist/comments/1wdq4f7/ai_written_notes/ | COMMUNITY_SIGNAL | readability, hallucination and review concerns; anecdotal only |
| 2026-06-10 | https://www.reddit.com/r/medicine/comments/1u24dul/please_please_proofread_your_ai_notes/ | COMMUNITY_SIGNAL | propagated-error / proofreading concern; anecdotal only |

## Internal evidence used for scope / dedupe only

- `Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md` — blob `8167e10798071d2276addaff6b201c6b0e904a2a`。
- `Reese-max/autodev-ng/docs/competitive-intelligence/2026-09-15T080004Z-external-radar.md` — prior cursor/baseline。
- `Reese-max/clinical-scribe-worker` HEAD `4de4e7e9976f9f17619f0b9f4caaed2d5e23b2b5`。
- `README.md`, `public/scribe.html`, `src/scribe.ts` current default branch。
- Existing Issues #4 / #6 / #7 / #10 and all-state PRs #8 / #9 / #11 / #12。

---

# What Changed Since Last Radar

Compared with `2026-09-15T080004Z-external-radar.md`：

1. 公平輪巡從 `ai-novel-workstation` 前進至 `clinical-scribe-worker`。
2. 重新確認 owner inventory 為 42 owned / 39 unarchived，沒有沿用舊清單代替本輪列舉。
3. 加入 2026-09-14 Abridge pre-bill evidence lineage 訊號，但因 #4/#7 都有 active PR，只進中央報告，沒有搶鎖或擴 scope。
4. 加入 Suki 2026-08-25 dictation unbundling，結論反而是**不需要為了競品而再造輸入引擎**。
5. 加入 MHRA / NHS England 2026-07-29 intended-purpose boundary，確認 current synthetic/non-clinical disclaimer 是重要產品邊界，而不是下一步要擴 clinical authority。
6. 新技術掃描發現 Web Speech `processLocally`，但在 current no-PHI scope 下只列 future `ADJACENT IDEA / NEEDS_EVIDENCE`，不把可能的 remote processing 自動誇大成 privacy defect。
7. 四道 Gate 結果：**0 新 Issue、0 Issue update、0 implementation authorization**。

---

# Completion / Gaps / Cursor

## Completed

- Re-read Issue Quality v2；blob SHA unchanged：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- Re-enumerated Reese-max repositories with pagination：42 owned，39 unarchived。
- Deep-read current `clinical-scribe-worker` product truth / input / output / safety boundary。
- Rechecked current Issues and all-state PRs for duplicate/active ownership。
- Public-web research covered：
  - A：direct competitor/product packaging（Suki；Abridge）；
  - B：adjacent governance/workflow（MHRA / NHS England）；
  - C：new browser technology（Web Speech on-device recognition）。
- Included community signals only as anecdotal evidence。

## Gaps / runtime status

- **No browser runtime test** was executed for `SpeechRecognition.processLocally`; actual supported browser/language-pack behavior remains `NEEDS_RUNTIME_VERIFICATION` if future scope ever depends on it。
- No clinical users, no real patient data, no PHI, no provider canary, no deployed Worker, no EHR, no coding/billing path was exercised。
- Vendor feature announcements confirm features, not effectiveness。
- GB regulatory guidance is not treated as Taiwan legal advice or automatic applicability。
- No portfolio CLEAN claim。

## Fair-rotation cursor

**Next cold-rotation cursor：`cyber-prep-coach`。**
