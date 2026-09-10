# External Competitive / New Product / Workflow Inspiration Radar — 2026-09-10 r7

## Executive Summary

本輪的主要外部訊號不是「再加一個通知 Bot」，而是 **post-publish schedule exception management 正在成為排班產品的核心工作流**：排班發布後，成員確認、拒絕、Offer、Swap、Open Shift/競標、管理者核准、變更後的 canonical schedule 更新與通知，被 Deputy / When I Work 等產品做成一條有狀態、有責任歸屬、有 eligibility gate 的正式流程。

這對 `92-duty-scheduler` 形成一個新的高價值機會。現有產品在「第一次把班排好」已經很強，但 README / SOP / MCP 仍顯示最後一哩主要是：`複製 LINE 文字 → 群組協調 → 管理者人工回填 schedule`。更重要的是，`docs/ROADMAP.md` 目前把「通知系統（Email/LINE Bot）」列為刻意不做，理由是 viewer 分享連結已足夠。這個判斷對**單純查看班表**仍合理，但外部市場與目前自己的 SOP 證據顯示，它對**排班發布後的例外處理**並不足夠。

因此本輪建立：

- **`Reese-max/92-duty-scheduler #22`** — `[Competitive Inspiration][RESEARCH_REQUIRED][WORKFLOW] 建立 Duty Inbox / LINE 自助確認與調班請求，消除群組協調後人工回填`
- Opportunity Score: **92/100**
- Research-only while authorization P0 `#14` remains open/reopened.

本輪沒有修改產品原始碼、沒有建立實作分支、沒有 merge/deploy、沒有變更 secrets / repository settings。

---

# Scope / Inventory

以 r6 的 **35-product inventory** 為產品組合基線，重新檢查目前可連線的 Reese-max repositories、近期 default-branch 狀態與 Competitive Gap / Feature / Research Issues。

GitHub repository search 本輪回傳的可見集合與 r6 存在 private/alias/indexing 差異（例如 `92-duty-scheduler` 可直接存取，但 repository search 結果不一定同樣呈現），因此**不把搜尋結果缺席當成產品刪除或封存證據**；Opportunity Map 維持已確認的 35-product inventory，並對本輪有直接外部訊號的產品更新。

主要外部研究來源仍是 GitHub 之外的公開網路：官方產品 Help Center / pricing、LINE Developers 官方文件與近期 security tip、Reddit 使用者情境討論。GitHub 僅用於確認自身產品狀態、recent change、existing Issues/PR、duplicate/fingerprint/lock 與持久化本報告。

---

# External Signals

## A. Direct Competitor Recent Capability — Post-publish shift lifecycle

### A1. CONFIRMED — Deputy Shift Confirmation / Swap / Offer / Open Shift with Approval

**Source date / update:** 2026-07-16

Deputy 現在把「排完班後」明確建成 stateful lifecycle：

- `Shift confirmation`：發布班次時可要求成員在期限內 accept / decline；未確認可依 location 設定自動轉成 Open Shift。
- `Shift Offer`：不能工作的成員可以把班提供給符合資格、可能有空的同事；**在被接手前，原成員仍對該班負責**。
- `Shift Swap`：成員可和 suitably qualified coworkers 交換班次，可由設定決定是否需要 manager approval。
- `Open shifts with approval`：不是純 first-come-first-served；成員先 request，管理者再依候選條件決定誰取得班次。
- 編輯已有 request 的 Open Shift 時，舊 request/response 會被取消並重新通知，避免 stale request 默默套到新版班次。

Sources:
- https://help.deputy.com/hc/en-au/articles/4688708441487-Shift-confirmation
- https://help.deputy.com/hc/en-au/articles/4688726501135-Allow-team-members-to-swap-or-offer-shifts
- https://help.deputy.com/hc/en-au/articles/4614775254671-How-to-swap-or-offer-your-shift-to-a-co-worker
- https://help.deputy.com/hc/en-au/articles/4688725542415-Open-shifts-with-approval
- https://help.deputy.com/hc/en-au/articles/4689081125007-Can-I-automatically-turn-unconfirmed-shifts-to-open-shifts-if-they-are-not-confirmed-by-the-team-member

**JTBD:** 成員不必先找管理者/群組說「我不能上、誰可以換」，而是針對 exact shift 發起 action；管理者處理的是已被 schedule context 綁定的 request。

**為何更省步驟 / 更可靠:** 系統已知 shift、資格、時間與責任歸屬，所以 request 不需要人工重新描述；最終 schedule 在 acceptance/approval 後更新，降低聊天 side agreement 與正式班表不同步。

**Onboarding / distribution:** 成員用 web/mobile 的個人入口處理，不必進完整 scheduler。

**Automation / integration:** eligibility、approval、state transition、notification 與 canonical schedule 串在一起。

**Business-model signal:** Deputy current Lite 為 USD 5/user/month，已把 Shift Swap & Find Replacement、Leave & Availability 放進基礎產品；pricing 只能證明產品優先順序，**不作為效果證據**。

Pricing:
- https://www.deputy.com/pricing

**Limit / DO NOT COPY:** Deputy 的 `Swap` 功能依賴 coworkers 能看彼此 schedule；對警大/軍警/校務資料，這個 privacy trade-off 不應照抄。Reese-max 更適合 privacy-preserving Offer / server-side eligible shortlist / manager-mediated swap。

---

### A2. CONFIRMED — When I Work Shift Release / Drop / Swap / OpenShift Requests

**Current 2026; relevant pages updated 2026-03 to 2026-04/05 window**

When I Work 的 employee-side lifecycle同樣不是「看班表」而已：

- Shift Release / Drop / Swap 可由管理者啟用/停用。
- Swap/Drop request 在完成前，原員工仍保有該 shift responsibility。
- manager 可要求 request review，狀態從 `Pending Approval` → `Pending Acceptance` → `Accepted`。
- OpenShift Requests / shift bidding 只對符合 eligibility 的使用者呈現；approved time off、既有班次、position qualification 會影響 eligibility。
- 管理者有專用 request inbox，能過濾 Pending Approval / all requests。

Sources:
- https://help.wheniwork.com/articles/getting-your-shifts-covered/
- https://help.wheniwork.com/articles/bid-on-openshifts-openshift-requests/
- https://help.wheniwork.com/articles/process-openshift-requests-computer/
- https://help.wheniwork.com/articles/how-openshifts-work/
- https://help.wheniwork.com/articles/finding-a-replacement-for-a-shift-computer/

**Pricing signal only:** current Essentials 為 USD 2.50/user/month，OpenShifts + shift swapping 已是基本方案能力；Pro 再加入進階規則/permissions/callout。這表示「post-publish exception handling」在商用排班中屬核心價值，不證明任何宣稱的節省時數。

Source:
- https://wheniwork.com/pricing

---

## B. Adjacent Transferable Workflow — LINE MINI App as thin interaction surface

### B1. CONFIRMED — Taiwan can publish unverified LINE MINI Apps

**Source date:** 2026-03-11

LINE Developers 宣布台灣/泰國符合 Policy 的開發者可建立並發布 unverified LINE MINI Apps。對 `92-duty-scheduler` 的可移植原理不是「重做一個 LINE Bot」，而是把 **Duty Inbox / request surface 放進使用者已經在用的 LINE app container**，避免原生 App 維護。

Source:
- https://developers.line.biz/en/news/2026/03/11/line-mini-app/

### B2. CONFIRMED — Service messages are constrained, verified-only

LINE MINI App service messages 在 published production 中只可由 **verified MINI App** 使用，且內容只能是 user action 的 confirmation / response / reminder，不是任意廣播或行銷 push。台灣的 verified MINI App 申請還有 certified provider 條件。

Sources:
- https://developers.line.biz/en/docs/line-mini-app/develop/service-messages/
- https://developers.line.biz/en/docs/line-mini-app/submit/submission-guide/

**Transferable principle:** LINE 必須只是 distribution adapter，不應成為 request truth。MVP 不能依賴 verified-only service messages 才能成立；viewer / web / copy-LINE 仍要保留 fallback。

---

## C. Emerging Tool / Technical Possibility — Identity-bound LINE action without trusting client profile

### C1. CONFIRMED — LINE Developers security tip: “Send tokens, not profile data”

**Published:** 2026-08-13

LINE 官方近期安全指引直接指出：client 傳給 server 的 `userId` / profile data 可被竄改，不能作為 authentication。正確流程：

`LIFF/LINE raw ID/access token → service server → verify with LINE Platform → verified user ID → service-issued session`

同時：
- LINE token 不應當長期 service session；
- access token 可能因 LIFF 關閉而被 revoke；
- raw tokens 不應寫入 logs / analytics。

Source:
- https://developers.line.biz/en/tips/2026/08/13/send-token-to-server/

這個模式對 `92-duty-scheduler` 特別重要，因為自己的 `#14` 目前仍 open/reopened：Round 3 證據顯示 public GET 能根據 caller-supplied student ID mint 出該學生的 write credential，再拿去 POST。未來 LINE integration 不能重演「client 告訴 server 我是誰 → server 就給 write authority」。

**Emerging possibility:** 把 LINE identity 只作為**經 platform verify 的 bootstrap evidence**，再映射 internal subject + scoped service session；request 仍需 eligibility / schedule revision / manager policy gate。

---

# New Releases / Current Market Changes

| Date | Product / Platform | Signal | Evidence state | Reese-max implication |
|---|---|---|---|---|
| 2026-08-13 | LINE Developers | Server-side token verification guidance; profile/userId not authentication | CONFIRMED | Identity bootstrap can be strong enough for Duty Inbox only if server verifies token and issues scoped session |
| 2026-07-16 | Deputy | Shift confirmation, swap/offer, open-shift approval docs refreshed | CONFIRMED | Post-publish exceptions are first-class lifecycle, not chat support |
| current 2026 | Deputy Pricing | Lite includes swap/find replacement/availability | CONFIRMED_PRODUCT_SIGNAL | Self-service change handling is core product value; no need to copy payroll suite |
| current 2026 | When I Work Pricing | Essentials includes OpenShifts + shift swapping | CONFIRMED_PRODUCT_SIGNAL | Same market direction confirmed by second vendor |
| 2026-03-11 | LINE MINI App | Taiwan can publish unverified MINI Apps | CONFIRMED | LINE can be a low-friction mobile shell; verified-only notifications remain constrained |

---

# Community Pain Points

Community posts are **anecdotal evidence only**. No frequency or market-share inference is made.

### COMMUNITY_SIGNAL — Post-publish exceptions escape the scheduler

2026-08-11 workforce-management discussion describes availability changes、請假、callouts、skills/qualification substitutions being handled through texts/calls/group chats, leaving the schedule itself out of sync with the real negotiation.

Source:
- https://www.reddit.com/r/workforcemanagement/comments/1vlgdcc/when_does_manual_shift_scheduling_become/

### COMMUNITY_SIGNAL — Shift bidding / free swaps can be operationally useful but policy varies

2026-07-23 manager discussion around ~80 workers describes switching from manager-assigned scheduling to shift bidding during holiday periods; discussion shows that employee self-service can reduce friction, but policy/approval design is contextual, not universal.

Source:
- https://www.reddit.com/r/managers/comments/1v498fj/those_managing_workforce_scheduling_what_policies/

### COMMUNITY_SIGNAL — Notification can disagree with canonical schedule

2026-08-26 employee report describes a swapped shift disappearing from the displayed schedule while a later reminder still says the user works it. This is not evidence about Deputy/When I Work and cannot be generalized, but it is a useful failure mode: **generic notification must never outrank canonical schedule revision + receipt**.

Source:
- https://www.reddit.com/r/AmazonFC/comments/1vywx46/has_anyone_had_this_issue/

### COMMUNITY_SIGNAL — Last-minute text-only changes create confusion

2026-07-16 discussion complains about schedule changes arriving via personal text only a few hours before a shift. Again anecdotal; the transferable design implication is that a change notice should carry exact before/after shift identity and acknowledgment state, not just “schedule changed”.

Source:
- https://www.reddit.com/r/WalgreensStores/comments/1uxnqyz/question_about_same_day_schedule_changes/

---

# Repository Evidence / What the User Still Does Manually

Current `92-duty-scheduler` default branch inspected at `f9356a245b114086e8b103c7f82d587bb9b78c09`.

CONFIRMED:

1. README workflow ends with **`匯出 Excel / 複製 LINE 文字 / 儲存本週紀錄`**.
2. `docs/SOP.md` Step 1 says to ask in LINE group who has leave/business duty, then manually record names/student IDs.
3. MCP `duty_summary` produces a concise LINE-group summary string: LINE is currently a **text handoff**, not a structured request lifecycle.
4. Existing manager-side system already has auto swap, leave replacement, history, undo and eligibility logic, so this opportunity should **reuse** these rather than create a second scheduler.
5. `docs/ROADMAP.md` currently says **通知系統（Email/LINE Bot）刻意不做；viewer link 足夠**.
6. Repository search found no `shiftRequest / openShift / confirmShift / availabilityRequest` product state machine.
7. Exact Issue search for `"shift confirmation"` returned zero. `self-service` matched only the audit, not a product feature.
8. Existing relevant Issues are distinct:
   - #19: diagnosed gap → ranked minimal-impact RepairPlan.
   - #20: PolicySpec / Rule Studio authoring/validation/activation.
   - #21: semester-start weekday validation.
9. All-state PR inspection showed no same-fingerprint self-service/request implementation; the most recent visible open PR #18 is docs-only legacy-audit work.
10. `github-issue-lock:v1` repository search found no lock for this fingerprint.
11. `#14` remains OPEN / REOPENED; Round 3 found the public GET→mint victim token→POST chain still recreates unauthorized cross-student writes. This is a hard production blocker.

---

# Strategic Direction Change

## Prior direction

`docs/ROADMAP.md`:

> Notification system (Email/LINE Bot): viewer page sharing link is enough.

## New conclusion

The narrow premise remains valid for **read-only publication**: do not build a native app or generic notification bot just to duplicate a viewer.

But the market and internal workflow evidence overturn the broader interpretation that “viewer is enough” for the full post-publish lifecycle. Viewer solves:

`What am I scheduled for?`

It does **not** solve:

`Can I work it? → I cannot → who is eligible? → peer accepts? → manager approves? → which schedule revision changed? → did all views converge?`

Therefore the product direction should be refined, not reversed into feature bloat:

**DO NOT build “notification system” as a standalone feature.**

**DO build a canonical `Duty Inbox / ShiftChangeRequest` lifecycle, with LINE optionally acting as a thin identity/distribution shell.**

---

# High-value Opportunity — `92-duty-scheduler #22`

## Job-to-be-Done

### Team member / student

After a roster is published, I want to:

1. See the exact current duty revision that applies to me.
2. Confirm or decline when required.
3. If I cannot work, submit an Offer / Swap / Cannot-work request **against that exact shift**, instead of starting a LINE side thread.
4. See whether it is waiting for peer acceptance, manager approval, denied, canceled, expired, or stale because the roster changed.
5. Know that my original responsibility is still active until the canonical roster actually changes.

### Scheduler / manager

I want all exceptions to enter one request inbox; the system should reuse the same deterministic eligibility/PolicySpec rules, then one authorized approval should update canonical schedule + history/undo and generate an exact receipt. No manual re-keying from LINE.

---

## Transferable Core Principle

`Published Schedule ≠ Chat Message`

The durable model should be:

`PublishedScheduleRevision → Identity-bound DutyInbox → ShiftChangeRequest → CandidateScheduleDelta → shared eligibility/policy validation → peer/manager decision → canonical mutation → ScheduleChangeReceipt → all views converge on new revision`

LINE is only an adapter around this lifecycle.

---

## Minimum Valuable Version

### Phase 0 — research-only while #14 is open

Define synthetic-only schemas:

- `PublishedScheduleRevision`
- `DutyInboxItem`
- `ShiftChangeRequest`
- `CandidateScheduleDelta`
- `ScheduleChangeReceipt`

Request states:

`DRAFT | SUBMITTED | PENDING_PEER | PENDING_MANAGER | APPROVED | DENIED | CANCELED | EXPIRED | STALE_SCHEDULE`

No production roster read/write expansion.

### Phase 1 — personal read-only Duty Inbox after real identity bootstrap exists

- Show only the subject’s necessary shifts by default.
- Bind each item to an exact schedule revision.
- Confirmation/decline creates a state transition/request, not an implicit roster mutation.
- A stale page cannot create an effective request against a superseded shift.

### Phase 2 — bounded change requests

- Offer: only eligible/minimally exposed candidates.
- Swap: peer acceptance can create a candidate delta, but not automatically bypass manager policy.
- Cannot-work: may invoke #19 RepairPlan for candidate replacement, but request lifecycle and solver remain separate.
- Final apply always uses existing canonical mutation + history/undo path.

### Phase 3 — optional LINE / LIFF adapter

- Web remains independent and functional.
- Raw LINE token → server-side LINE verification → service-issued scoped session.
- Client profile/userId/student ID never grants write authorization.
- No raw LINE token in durable logs/receipts.
- Unverified MINI App does not depend on production service messages.
- If verified service messages become available later, use only allowed confirmation/result/reminder semantics.

---

## Opportunity Score

| Factor | Score | Reason |
|---|---:|---|
| User Pain | 9/10 | Current SOP still pulls leave/change coordination into LINE/manual recording |
| Strategic Fit | 10/10 | Completes schedule→publish→exception→canonical-update loop without changing core product identity |
| Novelty | 8/10 | Established in commercial WFM; differentiation comes from school/police privacy + LINE thin shell + receipts |
| Evidence Strength | 10/10 | Deputy + When I Work official docs/pricing + LINE official platform/security docs + repo evidence |
| Reuse Potential | 9/10 | Identity-bound request/revision/receipt pattern can transfer to `police-duty-assistant` / `ninax-line-hermes` |
| Implementation Effort Control | 7/10 | Can stage schema/read-only first and reuse current evaluator/history/undo |
| Security / Privacy / Cost Risk Control | 6/10 | Material identity/privacy risk; #14 is a hard blocker, but architecture can fail closed |
| **Overall** | **92/100** | **CREATE research Issue; no production write until #14 verified** |

---

# Acceptance Criteria Snapshot

The canonical Issue contains the full AC. Key gates:

- No client-sent student ID / LINE userId as write authorization.
- All request/actions bind exact schedule revision + shift ref.
- Manager/peer state is explicit and replayable.
- Original shift responsibility remains until final canonical change.
- Eligibility uses shared scheduler / future PolicySpec evaluator; no LINE-only truth.
- Final apply uses existing mutation/history/undo path and exact before/after revision receipt.
- Stale schedule invalidates pending request; no silent rebase.
- Idempotent retry/approve.
- Personal inbox does not require exposing all classmates’ schedules.
- `copy LINE text` / viewer remain fallback.
- Production mutation stays disabled until #14 is truly closed with deployed E2E negative evidence.

---

# Adjacent Ideas

1. **Post-publish exception management is a product layer** — first schedule generation is not the end of scheduling.
2. **External channel action should become a typed request, not a second truth** — LINE/Slack/email can be a UI surface while canonical state stays central.
3. **Identity bootstrap must be independently verified** — profile/user ID is a display claim, not an authorization credential.
4. **Responsibility transfer needs an explicit commit point** — “request submitted” and “peer said yes” are not necessarily the same as “schedule changed”.
5. **Stale request is a first-class state** — if the underlying shift/revision changes, old request cannot silently continue.
6. **Privacy-preserving eligibility beats full coworker visibility** — server-side qualification can remove the need to expose everyone’s schedule.
7. **Notification should carry receipt semantics** — exact shift/revision/result, not generic “schedule updated”.
8. **Existing deterministic solver should be reused** — employee self-service does not justify a second eligibility engine.
9. **Fallback channel matters** — LINE outage/review limits cannot make the schedule inaccessible.
10. **Simplification opportunity:** once Duty Inbox exists, some SOP steps like “ask group → record name → manually search candidate” can be removed rather than adding more admin screens.

---

# Opportunity Map — 35 Product Repositories

| Product | Market Category | MUST MATCH | SHOULD BE BETTER | DIFFERENTIATOR | ADJACENT IDEA | DO NOT COPY |
|---|---|---|---|---|---|---|
| `cf-ai-router` | multi-provider AI gateway | truthful model/provider lifecycle + cost gate | planned-EOL canary | owner-controlled routing receipts | lifecycle registry across portfolio | enterprise breadth without user need |
| `soundbox-offline` | local-first offline music PWA | reliable local playback/import/backup | safer transfer/recovery | no-account owned-music workflow | bounded local handoff | streaming/social category creep |
| `police-exam-archive` | exam archive / practice data | complete questions/images/provenance | mobile source fidelity | traceable official corpus | capability evidence later | generic tutor before source quality |
| `skill-foundry` | Agent Skill certification / promotion | exact artifact/runtime/security evidence | risk-tiered escalation | evidence-gated promotion | receive Herdr Skill drafts | universal trust score / all-frontier evaluation |
| `prompt-autoresearch` | prompt optimization | reproducible eval + budget + holdout | variance-aware promotion | inspectable evolution | correction signals as failure taxonomy | unbounded self-evolution |
| `lobsterpulse` | multi-agent desktop monitor | truthful provider/agent state | action-type attention triage | local quota + state + replay | attention items for pending approvals | another heavy IDE |
| `tick-stock-panel` | market dashboard | source freshness + completeness | semantic alert filtering | evidence-first non-trading monitor | task-level alert/watchlist MCP | autonomous trading/spending |
| `clinical-scribe-worker` | clinical documentation | clinician review + provenance + privacy | workflow handoff | bounded documentation | destination/effect policy | autonomous clinical action |
| `adng-memory` | operational memory | origin/lifecycle/deletion | poisoning-aware retrieval | durable-state receipts | correction signals as candidate only | memory = authority |
| `avatar-vfo` | persistent AI persona | continuity + behavior regression | trajectory recall | state explainability if proven | candidate preference state | more dimensions without ablation |
| `note-filler` | structured note automation | explicit input/output provenance | reproducible template completion | bounded transform | preview/diff before write | opaque writes into unknown docs |
| `taiwan-intel-dashboard` | public intelligence dashboard | source truth/status/summary integrity | deterministic degradation | public evidence + provenance | outbound evidence interface later | more AI before reliability |
| `cyber-prep-coach` | cybersecurity exam coach | explanation calibration + exam fidelity | mastery evidence | source-grounded coaching | portable capability record | broader chat before gold-set gate |
| `UkePack` | ukulele/music utility | mobile/offline usability | fast practice workflow | focused musician toolkit | local media handoff | social/streaming suite |
| `autodev-ng` | autonomous dev orchestration | locks/receipts/external-effect truth | action-scoped containment | cross-engine effect receipts | request/inbox pattern for approvals | “network enabled” boolean |
| `ai-novel-workstation` | long-form AI writing | continuity/context/budget receipts | selective context | unattended production checkpoints | model behavior migration gates | model catalog race |
| `herdr-skills` | multi-agent supervision/reflective skills | candidate/active/conflict/stale evidence | correction recurrence + exact diff | correction→Rule/Skill candidate pipeline | handoff to Skill Foundry | auto-edit/rule bloat |
| `video-timeline-pipeline` | multimodal video intelligence | source/timeline/cost truth | NLE handoff | evidence-backed paper cut | typed cut receipt | full NLE scope |
| `chatgpt-dual-pipeline` | internship-notes site | canonical content/de-identification | safe publishing | structured learning notes | evidence navigation | AI-pipeline category confusion |
| `claude-mem` | coding-agent memory | provenance/admission/stale | origin-preserving summaries | inspectable local memory | emit sanitized correction signals | recalled memory as permission |
| `lplrs-judicial-sync` | judicial-data sync | exact authority revision/removal | source-span handoff | body-free authority receipt | legal AI consumers | good-law conclusion from identity |
| `internship-notes-sites-mirror` | generated notes mirror | mirror ownership truth | deterministic sync | low-maintenance mirror | integrity receipt | mirror as canonical editor |
| `MaterialYouNewTab` | browser workspace/new tab | privacy/local workspace | capture-preview-restore | versioned session workspace | restore diff/undo | silent tab surveillance |
| `taichung-police-intel` | public gov/police intelligence | verified public evidence + source health | profile/live navigation | official evidence lifecycle | read-only Evidence MCP | operational/private-data tooling |
| `ninax-line-hermes` | LINE AI media assistant | webhook revision/dedupe truth | stale-job suppression | evidence-checked second pass | **identity-bound LINE action/request receipt primitive** | LINE message as authoritative state |
| `voice-actress` | voice/practice learning | task-mode separation | mobile feedback | focused guided practice | competency evidence | generic tutor surface |
| `project-doctor-web` | clinical education | case truth/red flags/provenance | rubric debrief | reproducible CaseSpec simulation | competency replay | model-generated clinical truth |
| **`92-duty-scheduler`** | staff/duty scheduling | **real requester identity + deterministic rules + exact schedule revision** | **post-publish Duty Inbox / request state / stale protection** | **privacy-preserving LINE-thin-shell self-service + canonical ChangeReceipt (#22)** | #19 repair + #20 PolicySpec reused behind requests | full coworker schedule visibility, LINE-only truth, generic HR/chat/payroll suite |
| `flux-image-gen` | AI image generation/edit | output/provider/version truth | source-side provenance | derivative receipt | creative handoff | provenance as truth detector |
| `neciken-summer-poem` | creative/public poem | simple accessible presentation | mobile/share polish | focused authored experience | provenance for variants | agent/SaaS complexity |
| `minideck` | presentation generation/sharing | share/version privacy | export interoperability | narrow verified deck flow | claim/source receipts | hidden draft exposure |
| `ppt-studio` | AI presentation studio | auth/deployment boundary | source/claim traceability | editable evidence-backed slides | later mobile/Slack/Sheets | enterprise collaboration breadth |
| `police-exam-practice` | police exam practice | official mode/source fidelity | explainable mastery | exam-specific practice | verified capability profile | hint leakage into simulation |
| `exam-archive` | static exam archive | fast complete data access | chunk/lazy-load + provenance | lightweight searchable archive | canonical exam data layer | duplicate sources of truth |
| `cf-mcp-server` | Cloudflare MCP operations | OAuth/authz + exact-target confirmation | capability receipts | safe bounded operations | request/approval inbox primitive | broad destructive autonomy/token passthrough |

---

# Top 10 Cross-Portfolio Ideas

1. **Channel Action → Canonical Request — NEW #1:** LINE/email/Slack/mobile action should create a typed request against exact current state, not become a second source of truth.
2. **Identity Claim ≠ Verified Identity:** external profile/user IDs are presentation data; write authority requires server-verified bootstrap + scoped service session.
3. **Published State Needs Revision Identity:** every post-publish confirmation/change request must bind the exact revision it was based on.
4. **Responsibility Transfer Has a Commit Point:** submitted/accepted request does not automatically mean authoritative ownership changed.
5. **Stale Request Is First-Class:** if base data changed, reject or re-evaluate rather than silently rebase.
6. **Privacy-preserving Eligibility:** let the server filter eligible participants without exposing everyone’s full data.
7. **Candidate ≠ Active:** employee/agent/user proposals still need deterministic validation and policy/approval gates.
8. **Typed Handoff Receipt:** after a change, exact before/after revision + actor + evaluator version should be reusable across UI, notification, audit and downstream tools.
9. **Fallback Must Not Create Dual Truth:** optional LINE/LIFF/native surfaces can fail; canonical web/backend state remains accessible and authoritative.
10. **Simplification Is a Feature:** remove “ask in group → copy name → search candidate → re-enter change → send update” steps instead of simply adding more notifications.

---

# Ideas Rejected / Deferred

## 1. Generic LINE Bot / notification system
**Decision:** REJECT as the product idea.

The evidence supports structured post-publish request lifecycle, not a bot that sends more messages. Keep LINE as a thin shell / notification adapter.

## 2. Full coworker schedule visibility to make swap easy
**Decision:** DO NOT COPY.

Deputy explicitly needs coworker visibility for one swap mode. School/police privacy makes server-side eligibility or manager-mediated flow safer.

## 3. Employee acceptance immediately mutates roster
**Decision:** REJECT.

Some commercial workflows permit auto-swap, but Reese-max should preserve unit policy, deterministic eligibility and explicit revision/authorization gate.

## 4. Production self-service before #14 closes
**Decision:** BLOCKED.

Current identity bootstrap has a documented P0 bypass. Only synthetic schema/read-only research is allowed until deployed negative proof exists.

## 5. LINE client `userId` as student identity
**Decision:** REJECT.

LINE’s 2026-08-13 official guidance explicitly says profile/user ID from client cannot be authentication.

## 6. Depend on LINE MINI App service messages for MVP
**Decision:** REJECT.

Published service messages are verified-only; Taiwan verification has certified-provider constraints. Web/viewer must remain functional.

## 7. Copy Deputy/When I Work payroll, attendance and HR bundle
**Decision:** DO NOT COPY.

Those bundles explain pricing but do not fit this product’s core advantage.

## 8. Treat “request submitted” as “shift covered”
**Decision:** REJECT.

Keep original responsibility until final canonical assignment changes.

## 9. Hide schedule changes behind generic notifications
**Decision:** REJECT.

Notifications should resolve to exact current revision/change receipt; community anecdotes show generic or inconsistent alerts create confusion.

## 10. New scheduling solver for Duty Inbox
**Decision:** REJECT.

Reuse current deterministic eligibility/auto-swap plus #19/#20; no split-brain scheduler.

---

# Issue Mapping

| Repository | Issue | Action this round | Why |
|---|---|---|---|
| `92-duty-scheduler` | **#22 Duty Inbox / LINE self-service change requests** | **CREATED** | High-value, cross-verified, non-duplicate fingerprint; also refines/overturns prior “viewer is enough” assumption for post-publish exceptions |
| `92-duty-scheduler` | #14 Authorization P0 | NO MUTATION / dependency only | Remains open/reopened; blocks all production self-service writes |
| `92-duty-scheduler` | #19 RepairPlan | REUSE / no duplicate | Can serve cannot-work replacement planning behind request lifecycle |
| `92-duty-scheduler` | #20 PolicySpec | REUSE / no duplicate | Should become shared eligibility/policy evaluator for request candidates |
| `ninax-line-hermes` | none | RESEARCH ONLY | LINE identity-bound request/receipt primitive is reusable, but no repo-specific high-confidence gap was proven this round |
| `police-duty-assistant` | none | RESEARCH ONLY | Personal duty/inbox concept may transfer; current repository evidence insufficient for a separate Issue |

### Duplicate / coordination checks

Before creating #22:

- open/closed Issue search for `LINE`, `self-service`, `shift confirmation`, `shift swap`, `open shift` performed;
- exact `shift confirmation` issue search returned zero;
- existing #19/#20/#21 fingerprints were inspected and are distinct;
- all-state PR collection inspected; no same workflow implementation found;
- repository code search for `github-issue-lock:v1` returned no matching lock for this fingerprint;
- because #14 is currently open/reopened, #22 is explicitly research-only until its hard authorization gate is satisfied.

---

# Sources

## Direct competitors / official product docs

1. `CONFIRMED` — Deputy Shift confirmation, updated 2026-07-16  
   https://help.deputy.com/hc/en-au/articles/4688708441487-Shift-confirmation
2. `CONFIRMED` — Deputy Allow team members to swap or offer shifts, updated 2026-07-16  
   https://help.deputy.com/hc/en-au/articles/4688726501135-Allow-team-members-to-swap-or-offer-shifts
3. `CONFIRMED` — Deputy employee swap/offer workflow, updated 2026-07-16  
   https://help.deputy.com/hc/en-au/articles/4614775254671-How-to-swap-or-offer-your-shift-to-a-co-worker
4. `CONFIRMED` — Deputy Open shifts with approval, updated 2026-07-16  
   https://help.deputy.com/hc/en-au/articles/4688725542415-Open-shifts-with-approval
5. `CONFIRMED` — Deputy unconfirmed→Open Shift configuration, updated 2026-07-16  
   https://help.deputy.com/hc/en-au/articles/4689081125007-Can-I-automatically-turn-unconfirmed-shifts-to-open-shifts-if-they-are-not-confirmed-by-the-team-member
6. `CONFIRMED_PRODUCT_SIGNAL` — Deputy Pricing, checked 2026-09-10  
   https://www.deputy.com/pricing
7. `CONFIRMED` — When I Work Getting Your Shifts Covered, current 2026  
   https://help.wheniwork.com/articles/getting-your-shifts-covered/
8. `CONFIRMED` — When I Work OpenShift Requests, current 2026  
   https://help.wheniwork.com/articles/bid-on-openshifts-openshift-requests/
9. `CONFIRMED` — When I Work Process OpenShift Requests, current 2026  
   https://help.wheniwork.com/articles/process-openshift-requests-computer/
10. `CONFIRMED_PRODUCT_SIGNAL` — When I Work Pricing, checked 2026-09-10  
    https://wheniwork.com/pricing

## Adjacent platform / technical source

11. `CONFIRMED` — LINE MINI Apps can be published unverified in Taiwan/Thailand, 2026-03-11  
    https://developers.line.biz/en/news/2026/03/11/line-mini-app/
12. `CONFIRMED` — LINE MINI App service messages, checked 2026-09-10  
    https://developers.line.biz/en/docs/line-mini-app/develop/service-messages/
13. `CONFIRMED` — LINE MINI App submission / Taiwan verified review constraint, checked 2026-09-10  
    https://developers.line.biz/en/docs/line-mini-app/submit/submission-guide/
14. `CONFIRMED` — LINE Developers “Send tokens, not profile data, to your server”, 2026-08-13  
    https://developers.line.biz/en/tips/2026/08/13/send-token-to-server/

## Community / anecdotal only

15. `COMMUNITY_SIGNAL` — post-publish scheduling exceptions in texts/calls/group chat, 2026-08-11  
    https://www.reddit.com/r/workforcemanagement/comments/1vlgdcc/when_does_manual_shift_scheduling_become/
16. `COMMUNITY_SIGNAL` — shift-bidding policy discussion, 2026-07-23  
    https://www.reddit.com/r/managers/comments/1v498fj/those_managing_workforce_scheduling_what_policies/
17. `COMMUNITY_SIGNAL` — swapped shift vs reminder inconsistency anecdote, 2026-08-26  
    https://www.reddit.com/r/AmazonFC/comments/1vywx46/has_anyone_had_this_issue/
18. `COMMUNITY_SIGNAL` — last-minute schedule change via personal text, 2026-07-16  
    https://www.reddit.com/r/WalgreensStores/comments/1uxnqyz/question_about_same_day_schedule_changes/

---

# What Changed Since Last Radar

Compared with `2026-09-10-external-radar-r6.md`:

1. **NEW high-value opportunity:** `92-duty-scheduler` post-publish Duty Inbox / ShiftChangeRequest lifecycle.
2. **CREATED `92-duty-scheduler #22`** after Issue/PR/fingerprint/lock checks.
3. **Strategic assumption refined:** `viewer link is enough` remains true for read-only viewing, but is no longer accepted as sufficient for confirmation/change-request/reconciliation lifecycle.
4. **Direct competitor confirmation across two vendors:** Deputy + When I Work both treat employee-side swap/offer/open-shift/approval as core scheduling value.
5. **New adjacent distribution path:** Taiwan can publish unverified LINE MINI Apps, supporting a thin mobile entry without native App maintenance.
6. **New security constraint from LINE 2026-08-13:** client profile/userId cannot be authentication; token must be verified server-side and exchanged into a service session.
7. **Privacy direction strengthened:** do not copy coworker-full-schedule visibility just because a competitor requires it for swap.
8. **New cross-portfolio primitive:** `ChannelAction → IdentityBoundRequest → CanonicalMutation → ChangeReceipt`.
9. **#14 authorization P0 becomes a hard dependency, not a footnote:** no production self-service write is allowed until the GET→credential→POST path is demonstrably closed in runtime.
10. **No feature-count inflation:** no separate notification Bot, native app, payroll/HR module, new solver, or duplicate Issue was created.

---

# Round Conclusion

The most important insight this round is that **“schedule publication” should not be treated as the end of the scheduling product**.

`92-duty-scheduler` already reduces the work of creating a schedule. The next major friction is what happens after publication: confirmation、請假、臨時不能值勤、誰能代、同儕是否接受、管理者是否批准，以及最後到底哪一版班表才是 authoritative。

The reusable portfolio lifecycle is:

**`Canonical Published State → Verified Identity → Typed Request → Deterministic Eligibility / Policy → Explicit Commit Point → Canonical Mutation → Exact Change Receipt`**

The product should not become “more chatty.” It should make fewer things live only in chat.