# 外部競品／新品／工作流靈感雷達 — 2026-09-17T02:00:04Z

## Scope / rules / evidence boundary

- Owner scope：只處理 `Reese-max` 自有 repository；未操作第三方 repository。
- Issue Quality：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`。
- Quality-rule blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- 本輪重新完整分頁列舉 connected owner inventory：connector 目前回傳 **39 owned repositories；38 unarchived**；第二頁為空。此結果與上一輪記錄的 42/39 不一致，因此只記為 **inventory/access drift**，不推論缺少的 repository 已刪除或不存在。本輪可見 archived 僅 `obsidian-vault`。
- 上一份中央 radar `2026-09-17T000129Z-external-radar.md` 指定下一個 fair-rotation target 為 **`ninax-line-hermes`**；本輪完成該 target。下一個 cursor：**`note-filler`**。
- `ninax-line-hermes` default branch：`main@638274194335a28d2d388bae21b20f2214039dfc`；最近實質 product baseline 仍為 `e2c4785fbb222ddd1a2d54b6eb5ae3058418f4e6`。Runtime lock pins Hermes Agent `13e72fb205b735df679e0fd5f5996a34ac4accc6`。
- Owner/product contract re-read：NINAX 的核心仍是 `LINE request -> exact source identity -> local/source evidence -> bounded recovery -> independent review -> exact LINE delivery evidence`；不做泛用影片平台、不把 provider output 直接升為 canonical evidence、不用研究 Issue 取代 #4 的 metered-fetch authorization 修復。
- Current active ownership：#1 有 PR #2/#3；#4 有 PR #7。其 scope 不搶改。本輪新 finding 與 #1 的 edit/redelivery input lifecycle、#4 的 metered acquisition authorization、#6 的 Gemini native-video research fingerprint 不同。
- 本輪沒有真實 LINE 發訊、production canary、付費 provider call、Gemini runtime comparison 或 TwelveLabs/AssemblyAI trial。未執行路徑仍標 `NEEDS_RUNTIME_VERIFICATION`。
- 本輪建立 **1 個 source-causal BUG Issue #8**；0 既有 Issue 修改、0 PR comment、0 implementation authorization。
- 未修改產品 source、CI/config、secrets、permissions/settings；未建 implementation branch、未 merge/deploy、未啟動 worker/GOAL、未新增付費承諾或正式資料寫入。
- 本輪不宣告 portfolio CLEAN。

## Product → Market Category

`ninax-line-hermes` 本輪對照市場：

1. **Messaging transport reliability / idempotency**：LINE Messaging API first-party retry semantics與最新 outage。
2. **Video understanding reliability**：TwelveLabs structured segmentation 的 truncation/fail-closed 行為。
3. **Transcript-first summarization workflow**：AssemblyAI STT + LLM Gateway 的 current workflow guidance。
4. **Provider-native public-video understanding**：Gemini direct YouTube / agentic video understanding，已由既有 #6 追蹤，不重複立案。

## Executive decision

**1 new BUG Issue；0 existing Issues modified。**

建立：
- `Reese-max/ninax-line-hermes #8` — `[BUG][P2][RELIABILITY] Preserve idempotent recovery for LINE push delivery failures`
- URL: https://github.com/Reese-max/ninax-line-hermes/issues/8
- `kind=BUG`
- `severity=P2`
- `decision_priority=HIGH`
- `triage=NEEDS_REVIEW`
- `auto_implementation=false`
- `NEEDS_RUNTIME_VERIFICATION`

核心不是「LINE 昨天壞過，所以要建 retry framework」。真正 source-causal 的 gap 是：**NINAX 長影片的已審核結果在 reply token 過期後會走 Push；目前 pinned LINE client 的 Push 沒有 `X-Line-Retry-Key`，而 NINAX 對 timeout / 5xx 只會永久記為 `delivery=unknown`，同一 turn 之後禁止再嘗試。**

LINE 第一方文件明確提供 Push idempotency primitive：第一次 Push 就帶 retry key，5xx / timeout 後可用相同 recipient、payload、key 重試；已接受的相同 key 會回 `409`，避免重複執行。這是能以**局部修改**恢復核心 completion/recoverability 的已知現成能力，不需要新 queue、DB、scheduler 或 delivery service。

### P2 rationale

- NINAX 自己的驗證紀錄含 221.8 秒流程與 5m45s 長片流程，遠超約 50 秒 conservative reply-token TTL；Push 不是邊角 fallback，而是長工作正常可到達的 delivery path。
- Current wrapper 對所有 Push exception 都記 `unknown`，而 durable prior `unknown` 會讓同 turn 後續 attempt 直接 `video_delivery_already_attempted`。
- LINE 官方文件把 `5xx` / timeout 明列為可重試類型，也指出即使錯誤仍可能已送出，因此 blind retry 會重複；官方 retry key 正是為此設計。
- LINE 又在 2026-09-16 發布 Messaging API outage resolved notice，證明 transport failure 是目前真實外部條件；但本輪**不宣稱 NINAX 在該事故真的掉訊息**。
- 這會讓已完成、已審核且可能已付出大量處理成本的核心工作失去安全 delivery recovery，符合 P2 的顯著 recoverability impact；尚無實際 NINAX incident，所以不升 P1。

---

# External Signals

## A. Direct platform signal — LINE Push 有官方 idempotent retry primitive

**CONFIRMED — current LINE first-party docs；checked 2026-09-17.**

Sources:
- https://developers.line.biz/en/docs/messaging-api/retrying-api-request/
- https://developers.line.biz/en/reference/messaging-api/

LINE current contract：

- Push / multicast / narrowcast / broadcast 可在第一次 request 就帶 `X-Line-Retry-Key`；
- 5xx 與 timeout 是 retryable；
- 同 retry key 已被接受後再試會回 `409`，並帶 accepted request identity；
- retry key management period 是 24 小時；
- 相同 key 重試必須保持同一 request；
- Reply API 不在支援 retry key 的 API 清單中。

### User job / reduced manual work

目前長影片若在 Push 階段遇到 transient transport failure，使用者只能再次發訊息來取回結果。最小修正可讓系統在**不用猜測第一次是否成功、也不用要求使用者重問**的前提下安全完成同一 Push request。

### Do not over-transfer

- 不把 Reply timeout 自動改走 Push；Reply 可能已被接受，跨 API fallback 仍可能 duplicate。
- 不把 `2xx` / same-key `409` 稱為手機已收到；最多是 LINE Platform API acceptance evidence。
- 不建通用 message queue / delivery ledger framework；沿用現有 per-turn delivery receipt 即可。

Decision：**MUST MATCH / BUG P2 -> #8**。

## A2. Fresh external condition — LINE Messaging API outage

**CONFIRMED — LINE official news；published 2026-09-16；checked 2026-09-17.**

Source:
- https://developers.line.biz/en/news/2026/09/16/messaging-api-outage/

LINE 官方已標示該 Messaging API outage resolved。本輪公開頁面抓取沒有取得足以可靠逐項引用的 impact 細節，因此不把它誇張成「Push endpoint 一定回 5xx」或「NINAX 一定受影響」。它只用來證明 Messaging API transient outage 是 current external condition；#8 的因果證據仍來自 current source path + 官方 retry contract。

## B. Adjacent reliability signal — TwelveLabs 讓 truncated segmentation fail closed

**CONFIRMED — TwelveLabs first-party release notes；released 2026-09-10；checked 2026-09-17.**

Source:
- https://docs.twelvelabs.io/docs/get-started/release-notes

TwelveLabs 將 video segmentation 在 output 因 max response length / context window 截斷時，由過去 `status=ready + finish_reason=length + partial/empty segments` 改為 task failure。General analysis 仍可回 partial output + warning。

### NINAX counter-evidence

NINAX current `video_review.py` 已對 provider `finish_reason in {'length','content_filter'}` 明確 raise `incomplete_model_output`，並拒絕空輸出／非 dict JSON。這表示「structured review 被截斷卻當成功」在目前核心 reviewer 沒有新 fingerprint。

Decision：**SHOULD BE BETTER principle already matched / no Issue**。

## C. Adjacent workflow — AssemblyAI 仍把 transcript correctness 放在 summary 之前

**CONFIRMED — AssemblyAI first-party article；published 2026-09-15；checked 2026-09-17.**

Sources:
- https://www.assemblyai.com/blog/summarize-audio-with-llms-nodejs
- https://www.assemblyai.com/blog/summarize-meetings-llms-python

Current guidance 是 transcript/STT 與 LLM summary 分層；文章也直接提醒 downstream summary 無法補救 upstream transcript 中的錯字或錯誤 speaker attribution。

NINAX 已把 `speech` 當自動辨識、不是零誤差真相，且 summary 經 evidence-bound independent review；這個外部 signal 支持現有 separation，不支持新增 AssemblyAI provider。

Decision：**DIFFERENTIATOR validated / DO NOT COPY provider expansion**。

## D. Existing research signal — Gemini native YouTube understanding

2026-09-01 Gemini agentic video understanding / direct public-YouTube input 已在上一輪 NINAX radar 建立 #6：
https://github.com/Reese-max/ninax-line-hermes/issues/6

本輪沒有新的 repo/runtime evidence 改變 #6 分級，也沒有執行 provider comparison，因此不重複開單、不留言湊更新。

Decision：**DEDUPE #6 / unchanged**。

# New Releases

| Date | External change | Evidence level | NINAX decision |
|---|---|---|---|
| 2026-09-16 | LINE Messaging API outage resolved notice | CONFIRMED outage existence; detailed impact unavailable in parsed page | Raises urgency of existing transport-resilience question, not incident proof |
| current, checked 2026-09-17 | LINE Push retry key / 24h idempotency contract | CONFIRMED first-party docs | #8 P2 minimal Push-only recovery |
| 2026-09-10 | TwelveLabs segmentation now fails when truncated | CONFIRMED first-party release note | Current NINAX reviewer already fail-closed; no Issue |
| 2026-09-15 | AssemblyAI transcript → LLM summary guidance | CONFIRMED first-party article | No provider addition; reinforces evidence separation |

# Community Pain

本輪沒有新的 community-only signal 通過保留門檻。未用單一論壇抱怨推估 LINE outage prevalence，也沒有把既有 Gemini clipping 社群回報重複升級。

# Adjacent Ideas

1. **API-native idempotency before a generic retry framework**：若 provider 本身有 retry key / request identity，優先把它綁到現有 effect receipt；不要另造 queue。
2. **Structured evidence fail-closed**：外部 video infra 也在收斂「partial structured result 不應看起來 ready」；NINAX reviewer 已做到，應保持。
3. **Upstream evidence quality > downstream summarizer swap**：更換 LLM 不會自動修好 transcript/source identity；NINAX current separation 是正確 differentiator。

沒有足夠第二個 Reese-max repo evidence，故第 1 點**不升級成跨 portfolio framework**。

# Opportunity Map

| Category | Signal | Decision |
|---|---|---|
| MUST MATCH | Push transport 在 5xx/timeout 可安全 idempotent retry | **#8 BUG P2** |
| SHOULD BE BETTER | Truncated structured evidence 不可 silent success | Already matched in `video_review.py`; no Issue |
| DIFFERENTIATOR | source-bound evidence + independent review，而非 transcript/model output 直接成真值 | Preserve |
| ADJACENT IDEA | Direct public-YouTube native understanding | Existing #6; no duplicate |
| DO NOT COPY | TwelveLabs/AssemblyAI provider integration、generic video corpus/search、new delivery framework | No evidence / unnecessary scope |

# Four-gate evaluation — Issue #8

## 1. Problem / value

**Target user:** 等待已完成影片核對結果、但處理時間已超過 reply-token TTL 的 NINAX LINE user。

**Observable current path:**

`reviewed result -> reply token expired -> native Push -> exception -> delivery=unknown -> same-turn further send blocked`

Current source evidence：
- NINAX wrapper 只在 reply token 未過期時 Reply，否則 `self._client.push(...)`；
- any exception -> durable `unknown`；
- prior `sending|unknown|delivered` -> `video_delivery_already_attempted`；
- pinned Hermes `_LineClient.push()` 沒有 retry key header。

**Existing alternative:** user 可再傳「再說一次」形成新 turn；這不是安全自動 recover 同一 effect，而且把恢復負擔丟給使用者。

**Do-nothing consequence:** transient Push transport failure 可讓已完成核心工作沒有 safe same-effect recovery。

## 2. Priority

- `kind=BUG`
- `severity=P2`
- `decision_priority=HIGH`
- `triage=NEEDS_REVIEW`
- `auto_implementation=false`

P2 依據是 core completion/recoverability 的 source-causal gap；沒有 production NINAX incident / broad outage incidence evidence，所以不升 P1。

## 3. Smallest solution comparison

1. **No change**：安全但 unrecoverable；保留使用者手動重問。
2. **Docs only**：不能恢復 transport。
3. **Blind retry**：會削弱 duplicate-safety，拒絕。
4. **Push-only stable retry key + bounded retry**：直接使用 provider-native idempotency；最小有效方案。
5. **New queue / DB / scheduler / generic delivery service**：回答問題不需要，拒絕。

最小修正必須維持 Reply ambiguous failure 的現行 fail-closed，不可因 Push 支援 retry key 就擴權到 Reply。

## 4. Verification / implementation separation

#8 已建立為 BUG tracking，但 `auto_implementation=false`。下一步若另有實作授權，先用 fake transport 驗證：

- Push 500/timeout -> same persisted retry key / recipient / payload -> 2xx；
- same-key 409 -> accepted；
- 4xx -> no retry；
- Reply timeout/5xx -> 仍 unknown / no Push fallback；
- existing approval / binding / no-preview / no-duplicate gates 全部保持。

真 LINE test channel canary 仍需另行授權；沒有 production test requirement。

# Issue Mapping / dedupe / ownership

- **NEW #8**：https://github.com/Reese-max/ninax-line-hermes/issues/8 — Push retry-key recoverability；write-readback 已確認。
- #1：LINE messageEdited/redelivery input lifecycle；PR #2/#3 active。#8 不修改 input revision / stale summary scope。
- #4：metered-fetch positive one-shot authorization；PR #7 active。#8 不接觸 provider acquisition/spend gate。
- #6：Gemini direct-YouTube native video research；unchanged，沒有新 runtime evidence。
- Before #8 write：search open/closed Issues、open PRs、branches；未找到 `X-Line-Retry-Key` / Push retry / outage recovery 的同 fingerprint Issue 或 active branch。`fix/issue-4-metered-auth-gate` 與 `devin/issue-1-message-edited` 是不同根因。
- #1 full comments re-read：existing leases 已釋放；active PR scope 聚焦 versioned input lifecycle，不涵蓋 Push idempotency。

# Rejected Ideas

1. **Auto-retry Reply API / Reply failure then Push** — REJECT：LINE retry key 不支援 Reply，可能重複送達。
2. **Generic durable delivery queue** — REJECT：目前只需要一個 provider-native Push idempotency primitive。
3. **Add TwelveLabs** — REJECT：current NINAX review already fail-closed on truncation；沒有 user gap。
4. **Add AssemblyAI / LLM Gateway** — REJECT：沒有證據 current STT/provider 是主要瓶頸；會擴 provider/cost surface。
5. **Reopen/expand #6 from new Gemini marketing** — REJECT/DEDUPE：沒有新的 NINAX runtime evidence。

# Sources

## External first-party

- LINE Retry failed API requests — current, checked 2026-09-17: https://developers.line.biz/en/docs/messaging-api/retrying-api-request/
- LINE Messaging API reference — current, checked 2026-09-17: https://developers.line.biz/en/reference/messaging-api/
- LINE Messaging API outage — published 2026-09-16: https://developers.line.biz/en/news/2026/09/16/messaging-api-outage/
- LINE receiving messages / unsend & redelivery — current, checked 2026-09-17: https://developers.line.biz/en/docs/messaging-api/receiving-messages
- TwelveLabs release notes — 2026-09-10: https://docs.twelvelabs.io/docs/get-started/release-notes
- AssemblyAI summarize audio — 2026-09-15: https://www.assemblyai.com/blog/summarize-audio-with-llms-nodejs
- AssemblyAI meeting summaries — 2026-09-15: https://www.assemblyai.com/blog/summarize-meetings-llms-python

## Repository evidence

- `Reese-max/ninax-line-hermes@638274194335a28d2d388bae21b20f2214039dfc`
- `video-loop/work/profile/plugins/line-platform/__init__.py`
- `video-loop/check_delivery.py`
- `video-loop/work/profile/hooks/video_review.py`
- `video-loop/runtime-lock.json`
- `video-loop/GOAL.md`
- pinned upstream Hermes Agent `13e72fb205b735df679e0fd5f5996a34ac4accc6`, `plugins/platforms/line/adapter.py`

# What Changed

1. **New source-causal P2:** NINAX currently forfeits LINE's official safe Push retry primitive, making transient Push failure terminal for the same video turn.
2. **Fresh external trigger:** LINE reported a Messaging API outage on 2026-09-16; this raises relevance but is not used as proof that NINAX was impacted.
3. **No architecture expansion:** fix direction is Push-only stable retry key + bounded retry, not queue/framework/service.
4. **No repeated model research:** Gemini native video remains #6; no new provider trial.
5. **Inventory drift recorded:** current connector-visible owned set is 39/38, differing from prior 42/39; no deletion inference.

# Completion / gaps / cursor

- Completed: quality rules, historical NINAX radar, product goal/current SHA/runtime lock, current Issues/PRs/branches, #1 full comments, external LINE/TwelveLabs/AssemblyAI research, dedupe, #8 create + readback, central report write.
- Gaps: no live LINE Push 5xx/timeout canary; no evidence NINAX was affected by 2026-09-16 outage; detailed outage impact could not be reliably extracted from the current parsed article; no paid/runtime provider tests.
- Runtime status: **NEEDS_RUNTIME_VERIFICATION** for #8 production/test-channel incidence; source-level causal path is established.
- Next fair-rotation cursor: **`note-filler`**.
