# 外部競品／新品／工作流靈感雷達 — 2026-09-16T08:00:50Z

## Scope / rules / evidence boundary

- Owner scope：只處理 `Reese-max` 自有且未封存 repositories；未操作第三方 repository。
- Issue Quality：`docs/portfolio-audit/2026-09-14-issue-quality-v2.md`。
- Quality-rule blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`。
- Fresh owner pagination：**42 owned repositories；39 unarchived**。archived：`gemini-deidentifier`、`obsidian-vault`、`openab`。
- Working classification 沿用最近校準：**36 product-like + 3 support/compatibility-only**；本輪沒有足夠證據改分類。
- 上一輪 cursor：`ninax-line-hermes`；本輪完成此 cold-rotation target。下一個 cursor：**`note-filler`**。
- `ninax-line-hermes` default branch HEAD：`638274194335a28d2d388bae21b20f2214039dfc`（最新 commit 為 audit docs）；最近實質 product baseline：`e2c4785fbb222ddd1a2d54b6eb5ae3058418f4e6`。
- 現有 owner/product contract：LINE 影片資訊不足時先核對來源與既有影音，再補查字幕、語音、畫面；摘要經獨立檢核後才送出。`video-loop/GOAL.md` 另明確要求來源保留、bounded recovery、長片續接、可重建驗證與真實送達證據；正式手機實收仍未完成。
- 既有活躍範圍：#1 是 LINE `messageEdited` / redelivery P1 lifecycle；PR #2、#3 尚未 merged。本輪未改 #1，也未搶其 scope。#4 是已 source-confirmed + historical executed evidence 的 P2 metered-fetch positive-authorization bug；本輪新研究不取代、不延後 #4。
- Issue/PR/歷史 radar 去重後，沒有現成 issue 覆蓋「public YouTube provider-native video understanding 是否可在 metered acquisition 前消除一個 retrieval step」的 fingerprint。
- 本輪新建 **#6** 僅為 `RESEARCH / NOT_ESTABLISHED / NEEDS_EVIDENCE / auto_implementation=false`；沒有 runtime call、沒有模型試用、沒有付費請求、沒有產品 code/CI/config/secret/權限/settings/branch/deploy/GOAL 修改。
- 本輪不宣告 portfolio CLEAN。

## Product direction re-read — ninax-line-hermes

NINAX 的北極星不是做另一個泛用 YouTube summarizer。現有產品價值是：

`LINE request -> exact source identity -> local/source evidence -> bounded recovery -> independent review -> exact LINE delivery evidence`

其中最重要的既有能力是：

1. 跨 Instagram / Facebook / YouTube / TikTok / X 的 source identity 與 bounded search/recovery；
2. 現有 local-first pipeline：`yt-dlp` / transcript / local media / Whisper / frame selection / MiniMax visual analysis；
3. 當 media evidence 不足時才逐步 search、recover original、refresh metadata；
4. 若 `full_media_missing` / `source_duration_mismatch` 仍存在，現行 cascade 可進到 `single_metered_fetch`，由 Bright Data / Apify 取得來源；
5. summary 必須經 independent review，且 delivery evidence 不得把 HTTP/API format validation 冒稱手機已收到。

因此本輪真正值得問的不是「Gemini 能不能摘要影片」，而是：

> **對 public YouTube 這個已支援來源，provider-native direct-URL video understanding 是否能在不削弱 source/reviewer 邊界的前提下，消除一次完整媒體抓取／下載，並避免不必要地進入 metered provider recovery？**

現有 #4 已證明 metered acquisition 的 positive authorization 是更高優先級的成本安全問題；#6 只能是較低優先級的「刪一步」研究。

## Executive decision

**1 new narrow RESEARCH Issue；0 existing Issues modified。**

建立：
- `Reese-max/ninax-line-hermes #6` — `[Research][RESEARCH_REQUIRED] Validate native YouTube video understanding before metered media recovery`
- URL: https://github.com/Reese-max/ninax-line-hermes/issues/6
- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=MEDIUM`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`
- `NEEDS_RUNTIME_VERIFICATION`

這不是「新增 Gemini provider」功能單，也不是 #4 的 workaround。最小問題只有一個：**一個 direct public-YouTube request 能不能提供足以滿足 NINAX 某個明確 evidence gap 的 timestamp/source-bound candidate evidence，從而在該 case 不必抓完整影片。**

若不能證明，就 REJECT；若只能補 transcript/粗粒度 scene，就 NARROW；只有能穩定消除一個 retrieval step 且保持 evidence/reviewer boundary 時才 BUILD 下一步最小設計。

## External Signals

### A. Direct competitor / category pressure — native YouTube AI 正把「看片時問問題」變成平台能力

**CONFIRMED — YouTube official；published 2026-03-31 / 2026-05-19；checked 2026-09-16 UTC。**

Sources:
- https://blog.youtube/news-and-events/youtube-conversational-ai-tool-available-smart-tvs/
- https://blog.youtube/news-and-events/youtube-news-google-io-2026/

YouTube 的 conversational AI 已從 mobile/web 延伸到 TV；使用者可在正在看的影片上直接問問題。2026-05 的 Ask YouTube 又把 conversational search 擴到跨整個 catalogue 的 structured response。

**JTBD：** 不離開觀看 surface 就理解影片、追問內容、找相關片。

**減少的人工步驟：** 不必 `copy URL -> 開另一工具 -> 貼上 -> 再描述正在看的內容`。

**對 NINAX 的產品訊號：** generic「幫我摘要一支 YouTube」本身正在商品化。NINAX 不應用更大 summarizer UI 去對抗平台；應把差異守在跨平台來源補查、可追溯 evidence、review 與 LINE workflow。

**Do not copy：** 不做 YouTube clone、catalogue search UI、TV surface 或 social discovery。

### A2. Direct summarizer competitor — TubeOnAI 仍把 source capture / mobile share 壓到很薄

**CONFIRMED — TubeOnAI first-party help；updated 2026-09-02 / 2026-05-28；checked 2026-09-16 UTC。**

Sources:
- https://help.tubeonai.com/hc/tubeonai-help/articles/1779953378-supported-file-types-sources-limits
- https://help.tubeonai.com/hc/tubeonai-help/articles/1779953450-how-to-share-a-you_tube-video-to-tube_on_ai-for-instant-summarization

TubeOnAI current workflow accepts public/unlisted YouTube URLs, extracts audio, transcribes and summarizes; mobile app can receive a YouTube share directly so users do not manually copy/paste a URL.

**Transferable：** capture-at-discovery should be thin; domain logic remains behind the capture surface。

**Counter-evidence / no Issue：** NINAX already lives in LINE, and YouTube's normal Share flow can already send a link into LINE. Current repo evidence does not show that copy/paste is NINAX's bottleneck. Therefore no share-sheet / native mobile app Issue was created.

**Do not copy：** TubeOnAI's broad repurposing/mindmap/subscription suite is outside NINAX's narrow audited LINE workflow.

### B. Adjacent workflow — Glasp separates quick summary from durable highlight/note capture

**CONFIRMED current first-party product page；checked 2026-09-16 UTC；reliable feature publish date unavailable.**

Source:
- https://glasp.co/features/youtube-summary

Glasp places transcript, timestamped summary, model choice, highlight and notes beside the video. The relevant pattern is not another summary format; it is that **summary output and durable user evidence/highlight are distinct objects**.

NINAX already has the stronger equivalent on the reliability side: evidence items, exact source and independent review. This external pattern therefore supports keeping `provider output -> candidate evidence -> reviewer` separate, rather than treating a direct model response as canonical evidence.

No new Issue: the current product already embodies the safer separation.

### C. New technology — Gemini agentic video understanding + direct public YouTube URL input

**CONFIRMED — Google official docs / release notes；released 2026-09-01；checked 2026-09-16 UTC。**

Sources:
- https://ai.google.dev/gemini-api/docs/changelog
- https://ai.google.dev/gemini-api/docs/video-understanding
- https://ai.google.dev/gemini-api/docs/generate-content/video-understanding
- https://docs.cloud.google.com/vertex-ai/generative-ai/docs/samples/googlegenaisdk-textgen-with-youtube-video

Google Gemini API currently accepts **public YouTube URLs directly** as video input. Current docs state private/unlisted videos are unsupported. Free-tier docs currently state up to 8 hours/day of YouTube video; the legacy GenerateContent documentation labels direct YouTube URL input **Preview** and says it is currently available at no charge while warning that pricing/rate limits may change.

On **2026-09-01**, Gemini released agentic video understanding for 3.7 Flash / 3.6 Flash / 3.5 Flash-Lite: the model can navigate a video and request transcript / frames / audio on demand. Google's release note says this can use up to 88% fewer tokens than static processing for long-form content. This is a **vendor capability claim**, not evidence that NINAX will be faster, cheaper or more accurate.

**Concrete workflow opportunity for NINAX：**

Current public-YouTube worst path can be:

`URL -> local fetch/transcript/media -> source search/recovery -> metadata refresh -> still missing media -> metered acquisition -> local speech/vision evidence -> review`

Candidate research path is only:

`exact public YouTube URL -> one provider-native bounded evidence probe -> candidate timestamped evidence -> existing reviewer`

and only when it can actually satisfy a named gap. If it cannot, existing recovery continues.

**What should not move：** source identity, reviewer, metered authorization, delivery receipt and creator-identity semantics remain independent.

## Community Pain / caution

### YouTube clipping / usage may not behave as assumed

**COMMUNITY_SIGNAL — Google AI Developers Forum；reported 2026-08-19；checked 2026-09-16 UTC。**

Source:
- https://discuss.ai.google.dev/t/videometadata-clipping-on-youtube-urls-no-longer-clips-audio-frames-still-clipped-20x-token-inflation-on-long-videos/178970

A developer reports a regression in which `videoMetadata` clipping on YouTube URL requests appeared to clip frames but not audio, producing unexpectedly high token use on long videos. This is one report, **not prevalence and not an official incident finding**.

Product implication is narrow: #6 must record actual request usage/tokens and must not assume requested clipping bounds equal billed/processed bounds. A provider response timeout or surprising usage must not silently trigger a second metered provider path.

## New Releases / pricing / availability

| Date | Product / capability | Current evidence | NINAX implication |
|---|---|---|---|
| 2026-09-01 | Gemini agentic video understanding | Official Gemini API release note; dynamic transcript/frame/audio navigation | Test as bounded pre-metered evidence probe, not replacement pipeline |
| current; checked 2026-09-16 | Gemini direct YouTube input | Public YouTube URLs supported; private/unlisted unsupported | Exact public URL can be passed without first downloading full media |
| current; checked 2026-09-16 | YouTube URL pricing status | Legacy docs: Preview, currently no charge; pricing/rate limits may change | Treat price as temporary signal; record observed status in every experiment |
| 2026-09-02 update | TubeOnAI supported sources | Public/unlisted YouTube, ~6h max; extracts audio/transcribes/summarizes | Market baseline is low-friction URL intake, but not proof of audited evidence |
| 2026-05-19 | Ask YouTube | Conversational catalogue search / structured response | Generic YouTube explanation is increasingly native platform functionality |

No ROI, latency saving, adoption rate or expected cost saving is inferred from these sources.

## Four-gate evaluation

### 1. Problem / value

**Target user:** existing NINAX LINE user asking about a public YouTube video whose local evidence is incomplete.

**Observable repo friction:** current `video_takeaway_cascade.py` tries `initial_local_fetch`, local enrichment, source search/recovery and metadata refresh; when full media remains missing/mismatched it can invoke `single_metered_fetch`. `enrich_cached_video.py` then performs local Whisper / Groq repair and MiniMax visual analysis over media. This is a real supported path, not a missing-framework inference.

**Existing alternatives:**
1. no change;
2. local `yt-dlp` / transcript / cached media;
3. current source search + cross-platform verification;
4. authorized Bright Data/Apify retrieval.

**Impact of doing nothing:** no correctness defect is established. The cost is that some public-YouTube failures may still require a full media retrieval before semantic evidence can be reviewed.

**Counterargument:** current local-first pipeline may already succeed for almost all YouTube videos; a new model dependency may be less predictable than the existing path. This is why the finding is RESEARCH, not FEATURE/P2.

### 2. Priority

- `kind=RESEARCH`
- `severity=NOT_ESTABLISHED`
- `decision_priority=MEDIUM`
- `triage=NEEDS_EVIDENCE`
- `auto_implementation=false`

#4 stays P2 and higher priority because it has source-confirmed authorization failure plus historical executed evidence. #6 has no runtime evidence yet.

Qualitative Opportunity ordering:
- User pain: **UNKNOWN / bounded** — only evidence-incomplete public YouTube cases.
- Strategic fit: **HIGH** — directly supports audited video recovery and cost safety without changing surface.
- Novelty: **MEDIUM-HIGH** — provider can now inspect public YouTube directly and agentically.
- Evidence strength: **MEDIUM** — strong provider + repo path evidence, but no NINAX runtime comparison.
- Reuse: **MEDIUM** — if proven, similar experiment may be relevant to `video-timeline-pipeline`; no shared framework authorized.
- Effort: **LOW for research / UNKNOWN for production** — two existing fixtures + one provider call shape.
- Security/privacy/cost: **UNKNOWN** — public sources reduce privacy concern, but provider terms/usage/pricing and preview behavior must be measured.

No numeric score is used as a gate.

### 3. Smallest solution comparison

1. **No change:** cheapest and safest; keep local-first then explicitly authorized metered fetch.
2. **Documentation only:** note that Gemini can accept public YouTube; does not tell whether it satisfies NINAX evidence gaps.
3. **Reuse existing provider/local flow:** already the baseline and should remain first choice when sufficient.
4. **Narrow isolated comparison:** two prepared public fixtures, one native URL request, compare timestamp/source/evidence fields and usage. **Chosen research minimum.**
5. New provider router/database/registry/service: rejected; not needed to answer the question.

### 4. Research / implementation separation

#6's exits:

- **BUILD:** native request consistently satisfies a named current evidence gap on prepared fixtures, preserves exact source binding/timestamps, records actual usage, and removes at least one full-media retrieval step without weakening reviewer/source gates. BUILD means only "consider a minimal adapter", not permission to implement.
- **NARROW:** only one evidence class is useful; keep provider output as candidate evidence for that class.
- **REJECT:** source/timestamp binding is not auditable, availability/usage is too brittle, cost/privacy is unsuitable, or local + authorized metered path is simpler/better.

## Opportunity Map — ninax-line-hermes

### MUST MATCH
- LINE ingress/egress correctness, webhook dedupe/edit/revision lifecycle (#1; active PR #2/#3).
- Positive one-shot authorization before any metered acquisition (#4).
- Exact source identity and no stale/ambiguous result sent as current truth.

### SHOULD BE BETTER
- Prefer existing/local source evidence before external retrieval.
- Make external usage/cost/unknown acceptance observable and bounded.
- Remove a complete retrieval step when a source-native capability can safely answer the exact evidence gap.

### DIFFERENTIATOR
- Cross-platform audited source recovery rather than generic YouTube-only summary.
- `source evidence -> candidate -> independent review -> exact delivery receipt`.
- Ability to say **unknown / partial / unverified** instead of manufacturing a complete summary.

### ADJACENT IDEA
- #6: provider-native public-YouTube probe as a **candidate evidence source before metered media acquisition**, only if isolated comparison passes.
- If proven independently in both NINAX and `video-timeline-pipeline`, then consider whether a tiny shared request/receipt shape is worth reusing. Do not start with a cross-repo framework.

### DO NOT COPY
- Generic "AI video summarizer" product breadth.
- Social feed, mindmap, repurposing suite, catalogue/search product.
- Provider-native model answer = source/media/creator proof.
- Preview/no-charge status = permanent free dependency.
- A failed native call = authorization to auto-trigger paid retrieval.

## Cross-portfolio ideas

### `video-timeline-pipeline`

Potential later reuse is **experimental method**, not code: compare provider-native direct/video input against existing source-bound local evidence with exact timestamps, usage receipt and BUILD/NARROW/REJECT. No new Issue now because `video-timeline-pipeline` has its own evidence/provenance roadmap and no NINAX result yet.

### `cf-ai-router`

No routing Issue. A provider having a new modality does not mean router capability should be promoted without a task-specific acceptance fixture. If #6 later produces evidence, it can become one capability fact; no cross-provider abstraction is needed now.

## Rejected / deferred ideas

1. **Replace NINAX video pipeline with Gemini direct YouTube. — REJECT.** Direct model output does not replace local media/source evidence, non-YouTube sources, reviewer, or delivery receipts.
2. **Make Gemini the default first step for every YouTube URL. — REJECT.** Existing local/transcript path may already be cheaper, more deterministic and sufficient; no runtime evidence supports default inversion.
3. **Use direct URL as a workaround for #4. — REJECT.** #4 is a confirmed authorization boundary defect and must be fixed independently.
4. **Build a generic model router/provider registry. — REJECT.** Not required to answer #6.
5. **Add TubeOnAI-style share-sheet/native app. — DEFER.** LINE itself already receives shared links; no current evidence shows capture friction is the bottleneck.
6. **Copy TubeOnAI repurposing/mindmap/subscription features. — REJECT.** Outside audited LINE/video job.
7. **Trust provider timestamps without local comparison. — REJECT.** #6 exists specifically to test evidence equivalence and failure semantics.
8. **Private/unlisted YouTube bypass. — REJECT.** Official direct-URL support is public-only; no bypassing platform controls.

## Issue Mapping / dedupe / coordination

| Finding | Mapping | Decision |
|---|---|---|
| LINE edit/redelivery stale result | #1 + PR #2/#3 | Existing active scope; **SKIPPED_LOCKED / no changes** |
| Metered provider positive authorization | #4 | Existing confirmed P2 bug; stays independent/higher priority; no changes |
| Portfolio fixed-persona tracking | #5 | Audit tracker only; no scope change |
| Native public-YouTube evidence before metered retrieval | **NEW #6** | Narrow RESEARCH; NEEDS_EVIDENCE; auto false |
| Share-sheet / mobile capture | none | Deferred; no repo evidence of bottleneck |
| Generic video repurposing | none | Rejected as scope creep |

Before #6 creation, open/closed Issue search and all-state PR search were repeated for Gemini / YouTube / direct URL / metered-provider fingerprints. No duplicate Issue/PR was found. Repository search found no Gemini implementation path. Existing #1 PRs were not modified. Repository search for heartbeat/owner/lease markers returned no new ownership evidence for the #6 fingerprint. New Issue creation did not seize or rewrite an existing Issue lease.

## Runtime / evidence status

Not executed this round:
- no Gemini request;
- no Bright Data/Apify request;
- no paid/free-tier consumption experiment;
- no new LINE webhook or mobile message;
- no host Hermes run;
- no phone delivery;
- no CI run;
- no production mutation.

Therefore #6 remains `NEEDS_RUNTIME_VERIFICATION`. Google docs and TubeOnAI docs prove provider/product capabilities only; they do not prove NINAX quality, savings, latency or reliability.

## Sources

### External primary / first-party
1. Google Gemini API release notes — Agentic video understanding, 2026-09-01; checked 2026-09-16. https://ai.google.dev/gemini-api/docs/changelog
2. Google Gemini API — Video understanding / direct YouTube URL; checked 2026-09-16. https://ai.google.dev/gemini-api/docs/video-understanding
3. Google Gemini GenerateContent legacy video understanding — direct YouTube URL Preview / current no-charge notice; checked 2026-09-16. https://ai.google.dev/gemini-api/docs/generate-content/video-understanding
4. Google Cloud Vertex AI sample — summarize YouTube video by URI; checked 2026-09-16. https://docs.cloud.google.com/vertex-ai/generative-ai/docs/samples/googlegenaisdk-textgen-with-youtube-video
5. YouTube Blog — conversational AI on TVs, 2026-03-31; checked 2026-09-16. https://blog.youtube/news-and-events/youtube-conversational-ai-tool-available-smart-tvs/
6. YouTube Blog — Ask YouTube / Google I/O, 2026-05-19; checked 2026-09-16. https://blog.youtube/news-and-events/youtube-news-google-io-2026/
7. TubeOnAI help — supported sources & limits, updated 2026-09-02; checked 2026-09-16. https://help.tubeonai.com/hc/tubeonai-help/articles/1779953378-supported-file-types-sources-limits
8. TubeOnAI help — mobile YouTube share workflow, updated 2026-05-28; checked 2026-09-16. https://help.tubeonai.com/hc/tubeonai-help/articles/1779953450-how-to-share-a-you_tube-video-to-tube_on_ai-for-instant-summarization
9. Glasp — YouTube Summary product page; checked 2026-09-16. https://glasp.co/features/youtube-summary

### Community signal
10. Google AI Developers Forum — YouTube clipping/audio token inflation report, 2026-08-19; checked 2026-09-16. https://discuss.ai.google.dev/t/videometadata-clipping-on-youtube-urls-no-longer-clips-audio-frames-still-clipped-20x-token-inflation-on-long-videos/178970

### Internal evidence used only for product/dedupe/scope
- `Reese-max/ninax-line-hermes@638274194335a28d2d388bae21b20f2214039dfc`
- `README.md`
- `video-loop/GOAL.md`
- `video-loop/work/profile/hooks/video_takeaway_cascade.py`
- `video-loop/work/profile/hooks/video_recovery.py`
- `video-loop/work/profile/hooks/enrich_cached_video.py`
- Issues #1, #4, #5; PR #2, #3
- historical external radars / owner scope decisions

## What Changed vs prior round

1. Fair rotation moved from `herdr-skills` to `ninax-line-hermes`; next is `note-filler`.
2. New fresh external technical signal: **Gemini agentic video understanding released 2026-09-01** and current API accepts public YouTube URLs directly.
3. This maps to a concrete existing NINAX step: after local/search/metadata recovery fails, current supported flow can progress to full-media metered acquisition.
4. Instead of proposing a new video architecture, this round opens only #6 to test whether one direct source-native request can remove exactly one retrieval step.
5. Existing P1 #1 and P2 #4 retain priority and scope; #6 does not block either.
6. No claim that Gemini is cheaper/faster/more accurate; no runtime evidence was generated.

## Completion / gaps / cursor

**Completed:** external A/B/C exploration, current repo/product evidence, issue/PR/historical-radar dedupe, narrow Issue #6 creation, report write.

**Known gaps:** no real provider-native request, no measured usage/latency/evidence equivalence, no new production LINE run, phone receipt still absent, GitHub-hosted CI history remains affected by previously documented billing/spend limitation, #1/#4 remain unresolved on current default branch.

**Next fair-rotation cursor:** `note-filler`.
