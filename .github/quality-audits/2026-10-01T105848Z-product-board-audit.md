# Product Board Audit — 2026-10-01T10:58:48Z

## Executive result

Status: PARTIAL / NOT CLEAN.

This incremental round found one materially new actionable validation gap in Reese-max/ppt-studio PR #13. The proposed remote mode fails closed for anonymous requests, but the documented browser product path has no way to transport APP_TOKEN: the public SPA shell contains no token input, no Authorization/Bearer handling, and its fetch calls do not attach the header. Existing tests prove direct API clients can work with a valid Bearer token; they do not prove that a normal browser user can complete any core task.

Classification:
- kind: VALIDATION_GAP
- severity: P2
- decision_priority: NOW_BEFORE_MERGE
- triage: NEEDS_REVIEW
- auto_implementation: false
- confidence: HIGH for the static causal chain; NEEDS_RUNTIME_VERIFICATION for real browser/proxy/container behavior
- disposition: SKIPPED_LOCKED_ACTIVE_PR

No product implementation, Issue mutation, PR review, merge, deployment, worker run, secret, setting, or CI/config change was made.

## Authority, rules, and scope

- Rules document: docs/portfolio-audit/2026-09-14-issue-quality-v2.md
- Rules blob SHA: 8167e10798071d2276addaff6b201c6b0e904a2a
- Central report base: Reese-max/autodev-ng main@99eba2458a82a4fb8e70c25c5a454014b568c659
- Inventory: 45 owned repositories observed; 44 unarchived; obsidian-vault archived and excluded from product findings.
- Incremental cutoff: prior audit ended 2026-10-01T08:06:20Z.
- Changed/open candidate PRs inspected: autodev-ng#122, cf-mcp-server#26, chatgpt-dual-pipeline#7, cyber-prep-coach#23, soundbox-offline#18, academic-mcp#20/#22/#23/#24, note-filler#8, ppt-studio#13.
- Deep-review focus: control envelopes, durable OAuth accounting, production release gate, remote application authentication.
- This was not a new full-file review of all 44 unarchived repositories; portfolio status therefore remains PARTIAL and no Portfolio Ranking/CLEAN claim is made.

## Discovery and exact evidence

### F1 — remote browser workflow has no authentication transport

Repository and candidate:
- default: Reese-max/ppt-studio master@775a549664060d57cf3189daf1e407d2baee8516
- PR: https://github.com/Reese-max/ppt-studio/pull/13
- candidate head: 443c817b5ba5ca7de19de697cfa1efa9ffb9d4a0
- issue already owning the trust boundary: https://github.com/Reese-max/ppt-studio/issues/1

SOURCE_CONFIRMED causal chain:
1. NetworkAuthMiddleware leaves only / and /api/health public in remote mode; every other route requires Authorization: Bearer APP_TOKEN.
2. README and docs/DOCKER_DEPLOYMENT.md present APP_AUTH_MODE=remote as the LAN/Internet access path.
3. templates/index.html at blob ed02b4e7897ccc5ef4313121abbee604d869de4c has no Authorization or Bearer handling and no token-entry/bootstrap flow.
4. The SPA's fetch calls invoke API URLs directly without an Authorization header.
5. tests/test_network_auth.py explicitly proves an anonymous remote client gets 401 on every protected route and proves success only by constructing a direct TestClient request with the Bearer header.
6. Exact-head Actions run 36834758895 is green, but jobs are only kpi-baseline and lint; there is no browser or Docker job.

Expected: a user following the documented remote/LAN product path can authenticate once and complete first success in the normal UI, or the documentation clearly limits remote mode to API clients/proxy-authenticated deployments.

Actual: a normal browser can load the public shell, but every core data/action request lacks the required header and is rejected. Manual DevTools modification or curl is not a supported replacement for the browser product workflow.

Affected roles: LAN/mobile users, new operators, support, QA, accessibility users, and maintainers using CI as completion evidence.

Impact and severity: P2. The optional remote/LAN workflow has near-total completion failure through the advertised SPA, but current default local-only use remains intact and the candidate fails safely rather than exposing data. This is not upgraded to P1 and is not called a default-branch regression because PR #13 is unmerged.

Fingerprint:
Reese-max/ppt-studio + APP_AUTH_MODE=remote + public SPA shell issues headerless fetch requests + protected core APIs return 401 + no browser token bootstrap/transport + remote browser workflow cannot reach first success

Smallest safe options, in order:
1. NARROW: state that remote mode is API-only / requires an authenticating reverse proxy, and do not present the raw SPA as a supported remote browser workflow.
2. If browser remote use is intended, add one minimal, reviewable authentication bootstrap and a single request wrapper that attaches credentials to protected calls; do not put the token in URLs or exported/share artifacts.
3. Add one browser-level exact-head fixture: open remote root, authenticate through the supported mechanism, list/create/read/export a synthetic deck, verify anonymous 401, verify no secret in DOM/URL/log/output.
4. Keep owner/editor token authority separate from any future public sharing capability.

Non-goals: multi-user accounts, RBAC, OAuth/OIDC, a new database, public collaboration, full IAM, token in query strings, weakening middleware, or making APIs public.

Runtime requirement: NEEDS_RUNTIME_VERIFICATION. Execute a real browser against the container/proxy topology; current evidence is source plus ASGI tests.

### Other inspected candidates

- cf-mcp-server#26 @ 2e0e6311584b6c9f971b7b7146e2a426024a1bb3: D1 fixed-window counters, fail-closed bound-store errors, registration bounds, and exact-head run 36849594538 green. Migration/reset concerns were reviewed but did not establish a distinct P0–P2 failure in a supported reachable flow.
- chatgpt-dual-pipeline#7 @ beb4ee6b8dad6855aa0ec083040d8176906e05b4: release-policy fixtures run 36849158027 green. The gate is fail closed for status/review metadata and avoids deleting images shared with eligible notes. Bulk review markers are governance evidence needing human ownership, but their presence alone did not prove a new product defect.
- soundbox-offline#18, cyber-prep-coach#23, academic-mcp#20/#22/#23/#24, note-filler#8: no new separate actionable P0–P2 root established in this incremental pass.
- autodev-ng#122: active control-envelope work already covered by its active PR context; no duplicate finding was created.

## De-duplication and mutual exclusion

- All-state keyword searches and Issue #1's full comment history were read.
- PR #13 full comments, reviews, and review threads were read; it is open, non-draft, mergeable, with active branch issue-1-docker-network-boundary.
- Issue #1 already owns the remote trust-boundary root and received a current candidate update.
- The new browser-completion gap is material new evidence under the same active goal, not authority to steal the branch or alter scope.
- Result: no Issue comment, no lock marker, no label change, no new Issue. Evidence is isolated here as SKIPPED_LOCKED_ACTIVE_PR.

## External competitor and substitute scan

Checked 2026-10-01. Product/vendor pages are SOURCE_CONFIRMED for their own features and prices, not independent proof of outcomes.

| Product / substitute | Current official signal | Relevance | Board treatment |
| --- | --- | --- | --- |
| Google Slides + Gemini | Native editable multi-slide generation, Drive grounding, style reference, outline approval; announced 2026-06-30 and product article 2026-07-22. https://workspaceupdates.googleblog.com/2026/06/create-fully-native-and-editable-presentations-with-Gemini-in-Google-Slides.html ; https://workspace.google.com/blog/product-announcements/create-on-brand-presentations-in-minutes-with-gemini-in-google-slides | Browser-first authenticated workspace and native editability | SHOULD BE BETTER on local privacy/offline; do not copy Workspace breadth |
| Microsoft PowerPoint + Copilot | Prompt/file-grounded presentation creation and editing inside authenticated PowerPoint; current help checked 2026-10-01. https://support.microsoft.com/en-us/powerpoint/copilot/create-a-new-presentation-with-copilot-in-powerpoint | Familiar editable artifact and account-integrated access | MUST MATCH first-success clarity; do not build enterprise identity here |
| Canva Presentations / AI 2.0 | Guided presentation creation, editable design objects, sharing/publishing; official pages checked 2026-10-01. https://www.canva.com/presentations/ ; https://www.canva.com/newsroom/news/canva-create-2026-ai/ | Strong web UX and broad distribution | SHOULD BE BETTER on minimal/local operation; do not copy general design suite |
| Gamma | Web presentation generation; Pro currently lists API, analytics, custom branding/domains at USD 18/seat/month annual. https://gamma.app/pricing | Direct web-first alternative and API packaging | DIFFERENTIATOR opportunity is self-hosted/local, not more SaaS surface |
| Pitch | Free unlimited presentations; paid tiers list AI credits, teamspaces, link analytics. https://pitch.com/ ; https://pitch.com/pricing | Collaborative SaaS substitute with clear access model | DO NOT COPY collaboration/credit system without demand |
| Beautiful.ai | AI generation, Smart Slides, PowerPoint import/export and sharing; official pricing/support checked 2026-10-01. https://www.beautiful.ai/pricing ; https://www.beautiful.ai/smart-slides | Automated layout and sharing substitute | MUST MATCH a coherent supported path; not its breadth |

MUST MATCH:
- a documented user can reach first success through the same interface the product advertises;
- authentication and UI request transport form one end-to-end contract;
- protected operations fail closed without turning normal success into an undocumented developer-only workflow.

SHOULD BE BETTER:
- local-first privacy, no mandatory account, predictable self-hosting, clear provider-cost boundary.

DIFFERENTIATOR:
- a small single-user AI presentation workbench that is genuinely useful on loopback and can be safely exposed only through an explicit, tested boundary.

DO NOT COPY:
- full collaboration, enterprise SSO, multi-tenant permissions, marketing-site publishing, or per-action billing as part of this fix.

## Product board simulation

These are model-simulated perspectives, not independent expert votes.

- CEO: If only three things are done: preserve safe local default; make one supported remote path actually complete or remove the promise; require real browser/container proof before closure. Do not fund multi-user SaaS.
- CPO: The first-success contract is broken in remote mode. A public shell plus universal 401 is worse than an explicit API-only statement because it creates a false affordance.
- CTO: Middleware behavior is directionally correct. The missing layer is credential transport/termination, not weaker authorization.
- Staff/Principal Engineer: Centralize protected fetch behavior; avoid sprinkling headers across many calls. Prefer a narrow proxy/session boundary if token storage would create new exposure.
- UX Lead/Researcher: New operators cannot infer that curl success differs from browser success. The error/recovery path must be observable and accessible.
- Growth: Remote access can expand usefulness, but advertising it before first success works creates support debt. No growth claim without runtime evidence.
- CFO: Do not build account infrastructure. Keep the patch bounded and preserve provider-abuse protection.
- Security/Privacy: Never place owner token in URL, share link, DOM dump, telemetry, or exported deck. Fail closed remains non-negotiable.
- QA: Add a real browser fixture; route-unit tests are necessary but insufficient.
- SRE: Exercise the actual Compose bind and one documented proxy topology; record exact image/commit and response behavior.
- Accessibility: Any auth bootstrap must be keyboard/screen-reader usable and produce actionable errors.
- Support: Distinguish 401 invalid request credential, 503 missing server token, and unsupported raw-SPA remote use.
- Dissent: API-only remote access is a valid smaller product boundary. If that is the owner's intent, documentation narrowing plus removal of misleading SPA claims may be enough; a login UI is not automatically required.

## 50 synthetic personas

About 60% are regression baselines (R01–R30) and 40% are exploratory (E31–E50). This is simulation, not user research, preference share, incidence, or revenue evidence.

| ID | Background / constraint | Task / journey | Friction / result | Severity / recommendation | Evidence |
| --- | --- | --- | --- | --- | --- |
| R01 | 本機單人創作者；無管理背景 | 預設 Compose 啟動並建簡報 | local 模式可用；本輪無新增摩擦 | P3／維持 loopback 預設 | README、compose、PR #13 |
| R02 | Windows 使用者；PowerShell 熟悉 | 本機啟動、生成、匯出 | remote 缺口不影響本機 | P3／不擴大修正 | 同上 |
| R03 | macOS 使用者；瀏覽器操作 | 本機 UI 編輯 | local 模式可完成 | P3／維持 | 同上 |
| R04 | Linux 使用者；Docker | 本機容器啟動 | 127.0.0.1 綁定安全且可達 | P3／維持 | compose 靜態證據 |
| R05 | 無障礙鍵盤使用者 | 本機 SPA 編輯 | 本輪未做鍵盤 runtime | UNKNOWN／保留回歸 | 未執行 UI |
| R06 | 低視力使用者 | 本機 SPA 編輯 | 本輪未做視覺 runtime | UNKNOWN／保留回歸 | 未執行 UI |
| R07 | 中文簡報作者 | 生成與翻譯 | remote auth 與內容語言無直接關聯 | P3／不綁單 | PR diff |
| R08 | 英文簡報作者 | 生成與匯出 | remote auth 與內容語言無直接關聯 | P3／不綁單 | PR diff |
| R09 | 教師；無外部 provider key | fallback 生成 | 本輪未重跑 provider/fallback | UNKNOWN／保留 | CI 非 provider runtime |
| R10 | 學生；低成本 | 本機建立與下載 | local 路徑不新增成本 | P3／維持 | README |
| R11 | 顧問；敏感客戶內容 | 本機保存簡報 | loopback 預設降低暴露面 | P2 正向／維持 | #1、PR #13 |
| R12 | 品牌管理者 | 更新品牌後匯出 | remote API 受保護；本機不變 | P3／維持 | route sweep tests |
| R13 | 設計師 | 逐頁編輯 | remote 瀏覽器仍無 token transport | P2／merge 前補驗證 | template + middleware |
| R14 | 產品經理 | 由 URL/PDF 匯入 | remote SPA fetch 不帶 token，流程 401 | P2／同 F1 | template + middleware |
| R15 | 資料分析師 | 產生圖表簡報 | remote SPA 核心 API 401 | P2／同 F1 | template + middleware |
| R16 | 簡報講者 | 分享播放連結 | remote 模式刻意取消匿名分享 | P2／文件需清楚 | deployment doc |
| R17 | 支援工程師 | 診斷 401/503 | 錯誤明確但沒有 UI 登入入口 | P2／加入最小引導 | middleware/template |
| R18 | 維運人員 | health probe | /api/health 公開可用 | P3／維持窄豁免 | tests |
| R19 | 資安管理者 | 防止匿名遠端呼叫 | route sweep 確認 fail closed | P2 正向／仍需真容器 | exact-head CI |
| R20 | 隱私負責人 | 防止資料列舉 | 匿名 remote 讀取被 401 | P2 正向／維持 | tests |
| R21 | 成本負責人 | 防止濫用付費 provider | 匿名 remote AI 路由被 401 | P2 正向／維持 | tests |
| R22 | QA | 依 README 驗證遠端 UI | 能載入殼層但 API fetch 無 Bearer | P2／新增 E2E fixture | F1 |
| R23 | SRE | 反向代理部署 | 必須注入 Bearer；文件有說明 | P2／需實際代理 smoke | docs only |
| R24 | 開發者；直接 API client | 以 curl/SDK 帶 token | 可用；測試已覆蓋直接 client | P3／不誤判整體失效 | tests |
| R25 | 維護者 | 審查 PR #13 | CI 綠但只 KPI+lint，無 Docker/browser | P2／阻止過度結論 | run 36834758895 |
| R26 | 新手維護者 | 照文件開 LAN | 文件未提供瀏覽器 token 流程 | P2／同 F1 | README/docs |
| R27 | 行動裝置使用者 | LAN 手機瀏覽器開 UI | 無法將 Bearer 自動加到 SPA fetch | P2／同 F1 | web platform + source |
| R28 | 平板使用者 | LAN 編輯簡報 | 同上 | P2／同 F1 | source |
| R29 | 離線工作者 | 本機使用 | 不受 remote 缺口影響 | P3／維持 local first | README |
| R30 | 稽核者 | 核對 token 是否洩漏 | 回應不回傳 sentinel；但未跑真網路 | P2 正向／runtime pending | tests/CI |
| E31 | 家庭 LAN 單人使用 | 另一台電腦開 UI | 殼層可開、資料呼叫 401 | P2／F1 | SOURCE_CONFIRMED |
| E32 | 小型工作室；無 IdP | 共享主機 UI | 沒有登入/token 輸入 | P2／最小 session bootstrap | F1 |
| E33 | Nginx 管理者 | 代理注入固定 Bearer | API 可望可用，但瀏覽器資產/分享語意需 smoke | P2／窄代理 fixture | docs + tests |
| E34 | Cloudflare Tunnel 使用者 | 外部瀏覽器連線 | 若不注入 token，所有核心 API 401 | P2／文件與 runtime | F1 |
| E35 | API 自動化腳本 | Bearer 呼叫生成 | 直接 client 路徑可用 | P3／API-only 明確標示 | tests |
| E36 | 瀏覽器密碼管理器使用者 | 期待登入表單 | 目前不存在 | P2／不建帳號系統，只做最小入口或縮範圍 | template |
| E37 | 共享電腦使用者 | 輸入長效 token | 若用 localStorage 會增加外洩面 | P2／避免草率 localStorage | Red Team |
| E38 | 內網 kiosk | 載入只讀分享 | remote 下分享也要 owner token | P2／不要把 owner token放 URL | docs |
| E39 | 外部客戶 | 匿名查看分享 | remote 模式刻意不支援 | NOT_ESTABLISHED／勿在本單擴功能 | docs |
| E40 | 多租戶團隊 | 多人帳號權限 | 產品規模不符 | DEFERRED／不建 RBAC | Red Team |
| E41 | 公司 SSO 管理者 | OIDC/SAML | 超出單人產品最小範圍 | DEFERRED／反向代理替代 | Red Team |
| E42 | 祕密管理平台使用者 | 輪替 APP_TOKEN | 輪替流程未驗證 | P3／後續文件，不阻擋 F1 最小解 | docs |
| E43 | 慢速網路使用者 | 遠端 SPA 首載 | 殼層成功可能掩蓋 API 全失敗 | P2／E2E 要檢查首次成功 | F1 |
| E44 | 螢幕閱讀器使用者 | 遠端登入與錯誤恢復 | 目前沒有登入互動可測 | P2／最小入口需無障礙 | F1 |
| E45 | 瀏覽器 DevTools 熟手 | 手動改 fetch headers | 可繞過但非一般替代流程 | P2／不可當產品成功 | Red Team |
| E46 | curl 熟手 | 直接帶 Authorization | 成功替代證明根因是 UI transport 非 middleware | P3／保留 API path | tests |
| E47 | 維護 CI 的工程師 | 只看綠燈 | 可能誤認 remote UI 完成 | P2／新增 browser contract | CI scope |
| E48 | 事故回應者 | token 洩漏後撤銷 | 單一 token 可輪替但無使用者隔離 | P3／不擴成 IAM | docs |
| E49 | 財務審查者 | 比較 SaaS 與自架成本 | 本地免費差異化；遠端能力不應半成品宣稱 | P2／簡化定位 | 競品官方定價 |
| E50 | 產品負責人 | 決定是否合併 PR #13 | 安全修正值得保留，但遠端 UI 合約未完成 | P2／NARROW 後 merge | 全部證據 |

Synthetic switching test, qualitative only:
- Local/private single-user personas remain attracted to PPT Studio because the default requires no cloud account.
- Remote browser/team personas would choose an account-integrated competitor or stay with local access until the authenticated browser path is coherent.
- Direct API personas can use the candidate with Bearer credentials.
No percentages are reported and this simulation is not used as priority evidence.

## Red Team

Potential disconfirmers tested:
- Already solved? Direct API clients with a valid Bearer token do work. This narrows F1 to the browser product path; it does not erase it.
- Smaller alternative? Explicitly declare API-only/proxy-authenticated remote access and stop advertising raw SPA remote use. This may be enough.
- Wrong root cause? 401 is intended middleware behavior. The failure is missing client credential transport / ambiguous product contract, not middleware rejection.
- Audit environment artifact? The causal chain is entirely in inspected source and tests. Real network topology is still unverified, hence NEEDS_RUNTIME_VERIFICATION.
- Product scale mismatch? Yes: full IAM, RBAC, OAuth, or SaaS collaboration would be over-engineering.
- Could a proxy inject Bearer? Yes, but the docs do not prove an end-user-safe browser workflow, and injecting a single owner token into every request has consequences for static/share surfaces that need a real smoke.
- Could the root shell include everything inline? Even if static assets are inline, its API fetches still lack Authorization.
- Is this a default regression? No. PR #13 is unmerged; the report intentionally avoids that claim.

## Decision memo

Who is served:
- Primary: a single user creating and editing AI-assisted presentations locally.
- Secondary: a technically capable operator who intentionally exposes the service behind a controlled boundary.
- Not currently served: multi-tenant teams or anonymous public sharing in remote mode.

Why choose/compete:
- Choose PPT Studio for local ownership, low setup, editable/exportable decks, and no mandatory SaaS account.
- Compete on a smaller trustworthy path, not on feature count.

Top three priorities:
1. Decide and state whether remote mode is API-only/proxy-terminated or a supported browser UI.
2. Implement the smallest corresponding contract and browser/container verification before merging/closing #1.
3. Preserve loopback-by-default and the existing fail-closed middleware.

Do not do / delete:
- Do not weaken auth to make the SPA appear to work.
- Do not add account tables, roles, SSO, collaboration, or public sharing to this patch.
- Delete or narrow any documentation sentence that implies a remote browser success path until it is demonstrably true.

Portfolio recommendation for ppt-studio: MAINTAIN + SIMPLIFY. Keep investing in the local core; narrow the remote promise to one evidence-backed path. Not REPOSITION, MERGE, PAUSE, or ARCHIVE.

Risk and experiment:
- Risk: token handling added hastily may leak through URLs/storage/logs/share pages.
- Minimum experiment: one synthetic deck in an isolated container, one real browser, one documented proxy topology, anonymous denial, authenticated create/read/export, secret non-exposure, then teardown.
- Exit: BUILD only for a bounded transport/bootstrap; NARROW if API-only is enough; REJECT any proposal that requires a general identity platform.

## NOW / NEXT / LATER / DON'T

NOW:
- Resolve F1 in #1/#13 before merge or narrow remote scope.
- Add exact-head browser/container evidence.

NEXT:
- After merge, rerun the same anonymous/authenticated browser scenario on default HEAD and classify VERIFIED_FIXED, PARTIALLY_FIXED, STILL_REPRODUCIBLE, or REGRESSION.
- Keep provider/live external calls out of the smoke; use demo/fallback synthetic data.

LATER:
- Token rotation guidance and proxy examples if real operators need them.
- Separate capability design for public read-only sharing only with explicit product authorization.

DON'T:
- Do not equate run 36834758895 with remote UI verification.
- Do not close #1 on diff/merge alone.
- Do not build enterprise identity or collaboration from synthetic personas.

## Accounting

- New Issues: 0
- Updated/reopened Issues: 0
- New research Issues: 0
- Duplicate/owned-root mappings: 1 (#1/#13)
- Rejected candidate findings: 3 classes (migration speculation without failure chain; governance marker concern without product failure; dependency-only updates)
- Scope reductions: 1 (remote browser completion gap, not broad auth platform)
- Severity corrections: 1 candidate held at P2, not P1
- Verified fixes: 0
- Report writes: 1 proposed central audit report
- Issue writes blocked/skipped: 1 SKIPPED_LOCKED_ACTIVE_PR
- Runtime pending: real browser + Compose/proxy path
- Portfolio CLEAN: no

## Evidence limitations

- No production, provider, mobile-device, real Docker host-interface, or reverse-proxy execution occurred.
- GitHub Actions run 36834758895 covered KPI baseline and Ruff, not a full browser/container path.
- Competitor capabilities/prices are vendor claims/current pages, not independent outcome evidence.
- Persona and board sections are synthetic.
- Inventory was re-enumerated, but this round was incremental and did not exhaustively re-read every file in all 44 unarchived repositories.
