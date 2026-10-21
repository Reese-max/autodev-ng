# Product Board Audit — 2026-10-01T14:05:00Z

## Executive result

Status: PARTIAL / NOT CLEAN.

This incremental round confirmed one materially new P2 privacy defect on the default branch of `Reese-max/92-duty-scheduler`: anonymous `GET /api/state` returns the entire cross-student `studentTimetables` map. A caller can retrieve every stored student's coarse class/free-period pattern in one request rather than using the explicitly accepted individual lookup flow. The same active security PR already owns and fixes the finding at exact head `b071568765aba5e6fc6e289f3492d6fdea989629`; its exact-head CI is green, but it has not landed and neither preview nor production was deployed.

Classification:
- kind: BUG
- severity: P2
- decision_priority: NOW_BEFORE_MERGE
- triage: READY_FOR_IMPLEMENTATION (implementation is present in active PR #47; merge/deploy remain unauthorized)
- auto_implementation: false
- confidence: HIGH for source reachability and response shape; NEEDS_RUNTIME_VERIFICATION for deployed behavior
- disposition: TRACKED_IN_ACTIVE_PR_NO_DUPLICATE_ISSUE

No product code, CI/config, Issue, PR body/comment, label, secret, setting, deployment, worker, or production data was changed by this audit.

## Authority, rules, and scope

- Rules: `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- Rules blob SHA: `8167e10798071d2276addaff6b201c6b0e904a2a`
- Central report base: `Reese-max/autodev-ng` `main@99eba2458a82a4fb8e70c25c5a454014b568c659`
- Inventory: 45 owned repositories observed; 44 unarchived; `obsidian-vault` archived and excluded from product findings.
- Incremental cutoff: prior report commit `39639902ec22039b49b303c4215cb7ea6e2142b1` (2026-10-01).
- Default branches had no product commits after the cutoff in the sampled full inventory query; open/updated PRs were re-enumerated. Deep review focused on `92-duty-scheduler#47`, with new/updated candidates in `project-doctor-web#31`, `flux-image-gen#27`, `note-filler#20`, `taichung-police-intel#104`, `soundbox-offline#19`, `spotify-playlist-organizer-mcp#63`, `cf-mcp-server#27`, `clinical-scribe-worker#19`, `avatar-vfo#10`, `minideck#27`, and `academic-mcp#25` checked for distinct roots.
- This was an incremental round, not a fresh exhaustive file review of all 44 unarchived repositories. Portfolio Ranking and CLEAN are therefore not claimed.

## Discovery and exact evidence

### F1 — anonymous bulk disclosure of all stored student timetable patterns

Repository and refs:
- default: `Reese-max/92-duty-scheduler` `main@4d7d7d4911ffd580630661a2f71079a2c38c6ae1`
- default file blob: `cf-deploy/functions/api/state.js@c445113f9102ce13845832a640ccbd76362e604a`
- active draft PR: https://github.com/Reese-max/92-duty-scheduler/pull/47
- candidate head: `b071568765aba5e6fc6e289f3492d6fdea989629`
- candidate commit: https://github.com/Reese-max/92-duty-scheduler/commit/b071568765aba5e6fc6e289f3492d6fdea989629
- owning issue: https://github.com/Reese-max/92-duty-scheduler/issues/14

SOURCE_CONFIRMED causal chain:
1. Default `onRequestGet()` computes `isAuth` but queries all current-semester timetable rows regardless of auth.
2. It builds `{studentId: timetable}` for every row and includes `studentTimetables` inside `publicResponse`.
3. The unauthenticated branch returns `publicResponse` directly.
4. The response also exposes the roster used to map timetable keys to students; therefore this is not merely an opaque aggregate.
5. Individual public timetable lookup is an explicit owner decision for coarse busy/free slots. Bulk retrieval is a separate, broader exposure and is not required for the student self-service journey.
6. Default privacy documentation says roster, free-period, schedule, and cumulative data are admin-only, so the default code and policy documentation are inconsistent.

Expected: public individual lookup, if retained by owner decision, does not imply one-request access to every student's stored timetable. Aggregate progress and cross-student timetable views require administrator authorization.

Actual: an anonymous caller to `/api/state` receives the complete `studentTimetables` map for the current semester.

Affected roles: students, privacy/data controllers, administrators, support, security reviewers, and anyone whose recurring class/free-period pattern is stored.

Impact and severity: P2. The response can reveal a whole cohort's recurring availability patterns and materially enlarges confidentiality impact compared with one-at-a-time lookup. It is not P1 because this review did not inspect production personal records, did not establish exact location data or a realized incident, and the owner has explicitly accepted some coarse public-read behavior.

Fingerprint:
`Reese-max/92-duty-scheduler + GET /api/state without Authorization + publicResponse includes studentTimetables + all current-semester timetable rows returned in one response + cross-student availability disclosure`

Smallest effective correction already present in PR #47:
- remove `studentTimetables` from `publicResponse`;
- add it only to the authenticated administrator response;
- make the timetable-admin progress UI send the admin Bearer token and fail closed when `isAdmin !== true`;
- add a synthetic regression proving anonymous omission and authenticated preservation;
- correct privacy documentation without silently redefining all existing public fields.

Non-goals: account system, RBAC, SSO, new database, encrypting timetable rows, privatizing every public endpoint without an owner decision, removing student self-service, or changing scheduling algorithms.

### Candidate verification

- Candidate state blob `a9ba4444ac00b438771f844d1cbc51717016eef0` moves the aggregate map behind `verifyAuth`.
- Candidate test `scripts/test-state-timetable-privacy.mjs` asserts anonymous responses omit both the key and a sentinel slot, while an authenticated response preserves the map.
- Exact-head Actions run https://github.com/Reese-max/92-duty-scheduler/actions/runs/36868319549 succeeded: runner admission, checkout, Node 22, `npm ci`, and `npm run check` all passed.
- `deploy-preview` and `deploy-production` were skipped. No live D1 response, preview smoke, mobile browser, or production request was executed.
- Regression status: `CANNOT_VERIFY / NEEDS_RUNTIME_VERIFICATION` until the correction lands on default and the same anonymous/authenticated checks pass in an isolated deployment with synthetic rows.

## De-duplication and mutual exclusion

- All-state searches for `studentTimetables`, `/api/state`, aggregate/public timetable, and privacy mapped the root to Issue #14 and PR #47.
- Issue #14, its full comments, PR #47 comments, reviews, and review threads were read before any write decision.
- PR #47 is open, draft, mergeable, and actively updated; head `b0715687` was created 2026-10-01T13:22:59Z specifically for the aggregate privacy correction.
- The active PR explicitly records the new finding and now contains the smallest correction and tests. Creating another Issue or mutating its scope would duplicate active ownership.
- Result: no Issue lock, comment, label, reopen, or new Issue. The finding is tracked here and in #47.

## External competitors and substitute workflows

Checked 2026-10-01. Vendor pages are SOURCE_CONFIRMED for their own workflows, not independent proof of outcomes.

| Product / substitute | Current official signal | Relevance | Board treatment |
| --- | --- | --- | --- |
| Doodle Group Poll | Participants can mark Yes/If-needed/No without an account; organizer can review responses and Pro can export respondent data. https://help.doodle.com/en/articles/9457279-how-do-i-participate-in-a-group-poll ; https://help.doodle.com/en/articles/9457332-how-do-i-find-my-poll-invite-list-and-poll-responses (response article dated 2024-09-13; checked 2026-10-01) | Low-friction availability collection with organizer-scoped review | MUST MATCH clear participant vs organizer visibility; do not copy generic meeting scope |
| Deputy | Employees set recurring or one-off availability on web/mobile; managers see it while scheduling and may override with warnings. https://help.deputy.com/hc/en-au/articles/4614772805135-How-to-let-your-manager-know-you-re-available-or-unavailable-to-work-on-a-specific-date (checked 2026-10-01) | Direct workforce-availability substitute with role separation | SHOULD BE BETTER on local ownership and domain-specific duty rules; preserve admin-only cohort view |
| Sling | Official help center separates owner/manager/employee guidance and scheduling tools. https://support.getsling.com/en/ (checked 2026-10-01) | Shift-scheduling SaaS substitute | MUST MATCH role clarity; do not copy the full workforce suite |
| Spreadsheet + messaging | Existing repo import/export and roster workflow supports this no-new-service fallback | Familiar manual substitute with explicit file sharing | DIFFERENTIATOR is safe automation and repeatability; DO NOT COPY uncontrolled whole-file distribution |

MUST MATCH:
- role-scoped visibility between individual availability entry and cohort-wide scheduling views;
- a complete first-success flow without exposing everyone else's recurring availability;
- clear documentation of what is public, administrator-only, and exportable.

SHOULD BE BETTER:
- Taiwanese academy duty rules, local data ownership, deterministic conflict checks, and low setup overhead.

DIFFERENTIATOR:
- a narrow scheduling tool that turns class/free periods into auditable duty assignments without requiring a general workforce SaaS.

DO NOT COPY:
- payroll, time clocks, HR records, enterprise identity, social messaging, or broad collaboration as part of this privacy fix.

## Product board simulation

These are model-simulated perspectives, not independent expert votes.

- CEO: If only three things are done: land the aggregate privacy boundary, finish isolated write-auth verification for #14, and make documentation match real access. Do not build a workforce platform.
- CPO: Individual self-service and administrator cohort planning are distinct journeys; one public endpoint should not collapse their visibility boundaries.
- CTO: The smallest change is response partitioning plus one authenticated admin fetch. No schema or new service is justified.
- Staff/Principal Engineer: Keep `verifyAuth` as the single policy seam and test the serialized response, not only internal branches.
- UX Lead/Researcher: The admin progress page should explain that a password is needed before showing completion status; avoid an empty dashboard that looks broken.
- Growth: Privacy regressions undermine adoption in institutions. No growth claim is needed to prioritize a bounded confidentiality fix.
- CFO: Reuse the current token and D1 model; avoid paid identity infrastructure.
- Security/Privacy: Cohort-wide recurring availability is more sensitive than a single self-lookup. Do not inspect production records merely to prove impact.
- QA: Exact-head unit coverage is positive but insufficient; repeat anonymous/admin HTTP checks after landing in isolated preview.
- SRE: Preview still lacks proven isolated bindings. Do not deploy this draft merely to obtain evidence.
- Accessibility: Password prompt, error, disabled button, and progress state need keyboard/screen-reader verification.
- Support: Documentation must distinguish individual public read, administrator aggregate read, and administrator-issued write credential.
- Dissent: The owner may intentionally make more roster/schedule fields public for trial use. That does not justify expanding this finding beyond the confirmed aggregate map without a separate policy decision.

## 50 synthetic personas

R01–R30 retain about 60% regression baselines; E31–E50 are exploratory. This is simulation, not user research, incidence, preference share, or revenue evidence.

| ID | Background / constraint | Task / journey | Friction / result | Severity / recommendation | Evidence |
| --- | --- | --- | --- | --- | --- |
| R01 | 學生；手機填報 | 查自己的課表並送出 | 個人讀取是明示公開；寫入需管理員憑證 | P2／保留分離 | #14/#47 |
| R02 | 學生；連結遺失 | 補發個人授權 | 管理員可補發，不需公開整批課表 | P2／維持窄權限 | PR #47 |
| R03 | 學生；錯誤學號 | 查詢個人課表 | 404 路徑不需整批資料 | P3／維持 | timetable.js |
| R04 | 已填報學生 | 修改自己的時段 | 需綁學號/學期憑證 | P2／runtime pending | PR #47 |
| R05 | 未填報學生 | 取得個人連結 | 管理員產生，不需看他人資料 | P2／維持 | admin UI |
| R06 | 班代表 | 查看整體填報進度 | default 匿名即可取得全體 map | P2／需管理員驗證 | state.js |
| R07 | 排班管理員 | 匯整全體空堂 | 正當需要 cohort view | P2／授權後保留 | candidate test |
| R08 | 教官 | 排定勤務 | 需要跨人比較，但不應匿名公開 | P2／管理員通道 | F1 |
| R09 | 隱私承辦 | 核對資料最小化 | 一次回傳全體時段超過個人查詢需要 | P2／縮減公開回應 | F1 |
| R10 | 資安稽核員 | 無 token 呼叫 state | default 回傳 map | P2／anonymous omission | SOURCE_CONFIRMED |
| R11 | 新部署者 | 依 PRIVACY.md 理解存取 | 文件稱只有管理員、實作不符 | P2／文件同步 | blob d2f9b0c |
| R12 | 支援人員 | 診斷進度頁空白 | candidate 明示需管理員授權 | P3／保留引導 | head b0715687 |
| R13 | 鍵盤使用者 | 輸入密碼重載 | 靜態碼可達，未做鍵盤 runtime | UNKNOWN／驗證 | runtime pending |
| R14 | 螢幕閱讀器使用者 | 理解被停用按鈕 | disabled/state 文案未實測 | UNKNOWN／驗證 | runtime pending |
| R15 | 低視力使用者 | 查看填報統計 | 需登入後保留既有視圖 | P3／不重做 UI | candidate diff |
| R16 | 慢速網路學生 | 載入個人頁 | aggregate fix 不增加個人讀取 | P3／維持 | diff |
| R17 | 共用電腦管理員 | 查看進度 | token 存 sessionStorage 非長期 localStorage | P2／登出/關頁 smoke | candidate UI |
| R18 | 班級外部訪客 | 猜 API | 可一次取得全體 map | P2／F1 | default source |
| R19 | 爬蟲 | 重複抓 state | 單次即含全部時段 | P2／F1；不需推測事故 | default source |
| R20 | 事件回應者 | 判斷外洩範圍 | 無部署 log/實測，不能宣稱事故 | UNKNOWN／保守敘述 | evidence limit |
| R21 | QA | 跑 source fixture | anonymous key/sentinel 均被檢查 | P2 正向／仍需 HTTP smoke | test file |
| R22 | CI 維護者 | 看 run 36868319549 | `npm run check` 綠，deploy skipped | P2／不可當部署驗證 | Actions |
| R23 | SRE | 建隔離 preview | 現有 preview 綁定隔離未證實 | BLOCKED／勿碰正式 D1 | PR body |
| R24 | 資料控制者 | 告知資料用途 | 文件須準確列 public/admin 欄位 | P2／NOW | PRIVACY.md |
| R25 | 開源部署者 | 自架不同班級 | 同一程式會複製相同 exposure | P2／修 code 而非個案資料 | source |
| R26 | 無 ADMIN_TOKEN 部署者 | 打開管理頁 | 應 fail closed，不回整批 map | P2／runtime | auth contract |
| R27 | 管理員 token 輪替者 | 更新憑證後重載 | candidate 使用現有 Bearer | P3／不建新 IAM | diff |
| R28 | 排班演算法維護者 | 取得完整 state | 管理員回應仍保留 map | P2 正向／回歸測試 | candidate test |
| R29 | 歷史資料管理者 | 查舊週勤務 | 本 finding 不擴及歷史政策 | NOT_ESTABLISHED／不綁單 | Red Team |
| R30 | 產品負責人 | 決定 PR #47 是否可合併 | 隱私 patch最小，但整體 #14 runtime 未完成 | P2／維持 draft | PR #47 |
| E31 | 惡意同儕 | 建立全班空堂圖 | default 一請求可得 | P2／F1 | source |
| E32 | 社交工程者 | 找固定無課時段 | map 可形成規律 | P2／不需精確位置才有風險 | source inference |
| E33 | 外部家長/訪客 | 無帳號瀏覽 API | 不應取得 cohort map | P2／admin-only aggregate | F1 |
| E34 | 行動網路使用者 | 個人自查 | 保留 individual read 可避免大改 | P3／NARROW | owner decision |
| E35 | 無 JavaScript API client | 直接查個人 GET | 仍能運作 | P3／不破壞 | candidate source |
| E36 | 班代表代理人 | 管理多名學生 | 角色授權需求不明 | NEEDS_REVIEW／不建 delegated RBAC | Red Team |
| E37 | 多校部署者 | 想做多租戶 | 超出產品尺度 | DEFERRED／獨立部署 | Red Team |
| E38 | 身分平台管理員 | 要求 SSO | 非最小修正 | DEFERRED／反向代理另議 | Red Team |
| E39 | 法遵人員 | 要求所有欄位封閉 | owner 對部分公開欄位有決策 | NEEDS_REVIEW／不可自動擴權 | PR docs |
| E40 | 研究者 | 想看匿名統計 | 可另做去識別聚合，未有需求證據 | DEFERRED／不開單 | Red Team |
| E41 | 離線管理員 | 下載 spreadsheet | 手動檔案仍有分享風險 | P3／不把競品替代當修復 | substitute |
| E42 | Doodle 使用者 | 以投票收集可用時段 | 組織者查看回覆較清楚 | P3／借鏡角色邊界 | official docs |
| E43 | Deputy 使用者 | 手機設定 recurring availability | 更成熟但範圍較大 | P3／不複製 HR 套件 | official docs |
| E44 | 小型單位財務 | 比較 SaaS 成本 | 自架價值不需要犧牲隱私 | P2／維持局部 patch | board |
| E45 | 支援新手 | 只看進度頁 | candidate 提示需密碼 | P3／可理解性 smoke | diff |
| E46 | 測試工程師 | 插入合成課表 | fixture 覆蓋 public/admin serialization | P2 正向／部署重跑 | test |
| E47 | 事故演練者 | 測匿名拒絕 | 可用合成 preview，不碰正式資料 | P2／最小實驗 | decision memo |
| E48 | 維護者 | 想重構 state API | 大重構非必要 | P3／保持兩個 response object | Red Team |
| E49 | Owner | 保留 trial/public fields | 可只隱藏 aggregate map | P2／尊重範圍 | candidate |
| E50 | Portfolio 決策者 | 投資/暫停產品 | 核心價值明確，修補可小且安全 | MAINTAIN + SIMPLIFY | full evidence |

Synthetic switching test, qualitative only:
- Students value link-based self-service but do not need cohort visibility.
- Administrators need aggregate progress and scheduling data, so authenticated preservation is essential.
- Institutions with strict privacy expectations would prefer Deputy/Doodle-like role clarity or a spreadsheet kept inside an explicit access boundary until the fix lands.
No percentages are reported; this does not set severity or priority.

## Red Team

- Already solved on default? No. Default blob `c445113f` still includes the map in `publicResponse`.
- Already tracked? Yes. PR #47 now includes the fix and Issue #14 is the active root; therefore no duplicate Issue.
- Is all public timetable access a defect? Not established. Individual coarse busy/free lookup is an explicit owner decision; this finding is deliberately limited to bulk aggregation.
- Could the timetable map be empty? Possibly for a fresh deployment, but the code queries and serializes all stored rows when present. The failure path is reachable without assuming a particular production row count.
- Is this only stale documentation? No. The response code itself widens access; documentation mismatch is secondary evidence.
- Is a new auth system necessary? No. Existing `verifyAuth` and Bearer handling are sufficient.
- Could CI prove it fixed? Only at source/test level. Deployment jobs were skipped, so default/deployed status is unchanged.
- Should production be queried to prove impact? No. Reading real cohort data would add avoidable exposure; synthetic isolated runtime is the safe evidence path.
- Is the entire `/api/state` policy now correct? Unknown. Other public fields remain an owner-policy question and are not bundled into this fix.

## Decision memo

Who is served:
- Primary: administrators converting class availability into fair duty schedules.
- Secondary: students submitting and checking their own coarse availability.
- Not served by this patch: multi-tenant institutions, payroll/HR teams, or anonymous cohort analytics.

Why choose/compete:
- Choose this product for academy-specific rules, local ownership, spreadsheet interoperability, and a smaller operational surface than general workforce suites.
- Compete on trustworthy role boundaries and auditable scheduling, not breadth.

Top three priorities:
1. Keep the aggregate timetable fix in PR #47 and require exact-head review before merge.
2. After landing, run anonymous/admin HTTP smoke against an isolated D1 with synthetic rows, then classify the regression result.
3. Finish the broader #14 write-auth acceptance and make privacy documentation exactly match supported public/admin flows.

Do not do / delete:
- Do not query production personal data for proof.
- Do not privatize or expose additional fields without an owner policy decision.
- Do not add accounts, roles, SSO, a new database, or a cross-repo privacy framework.
- Remove claims that `npm run check` or a merge alone proves deployed confidentiality.

Portfolio recommendation: `MAINTAIN + SIMPLIFY` for `92-duty-scheduler`. Preserve its domain-specific core and tighten existing boundaries. Do not REPOSITION, MERGE, PAUSE, or ARCHIVE on this evidence.

Minimum experiment:
- isolated preview with synthetic roster and two synthetic timetable rows;
- anonymous `/api/state` must omit `studentTimetables` and sentinel slots;
- valid admin Bearer must receive the complete synthetic map;
- individual public GET retains the owner-approved behavior;
- admin progress page works by keyboard and does not put token in URL/logs;
- teardown and record exact SHA/run/deployment.

Exit: BUILD only this bounded correction; NARROW if owner removes the aggregate admin view; REJECT proposals requiring a general identity platform.

## NOW / NEXT / LATER / DON'T

NOW:
- Review and land the narrow aggregate privacy correction in #47 only when the existing #14 safety gates are satisfied.
- Keep #47 draft until isolated bindings and runtime acceptance are available.

NEXT:
- On default HEAD, rerun the same anonymous/admin/individual scenarios and classify `VERIFIED_FIXED`, `PARTIALLY_FIXED`, `STILL_REPRODUCIBLE`, `REGRESSION`, or `CANNOT_VERIFY`.
- Reconcile `docs/PRIVACY.md` against every intentionally public `/api/state` field through an explicit owner decision.

LATER:
- Consider a narrower, de-identified progress count only if real administrators need non-admin visibility.
- Evaluate token rotation/logout support based on actual operator demand.

DON'T:
- Do not create a duplicate privacy Issue while #47 actively owns the exact code path.
- Do not infer production exposure counts or an incident from static source.
- Do not treat synthetic personas or competitor features as authorization to expand scope.

## Accounting

- New Issues: 0
- Updated/reopened Issues: 0
- New research Issues: 0
- Duplicate/owned-root mappings: 1 (`92-duty-scheduler#14/#47`)
- New actionable findings: 1 (P2 bulk timetable confidentiality)
- Candidate implementation verified at source/CI: 1
- Verified default/deployed fixes: 0
- Scope reductions: 1 (bulk aggregate only; not all public timetable/roster policy)
- Severity corrections: held at P2, not P1
- Report writes: 1 proposed central audit report
- Runtime pending: isolated D1 anonymous/admin/individual HTTP and admin-page smoke
- Portfolio CLEAN: no

## Evidence limitations

- No production, preview, real student, provider, mobile-device, or browser execution occurred.
- Default source proves the response construction; deployed data presence and current production response were intentionally not inspected.
- Exact-head CI covered the repository checks, not deployment.
- Competitor statements are vendor documentation, not independent effectiveness evidence.
- Persona and board sections are synthetic.
- Inventory was re-enumerated, but this incremental round did not exhaustively reread every file in all 44 unarchived repositories.
