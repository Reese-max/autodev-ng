# Product Board Delta — academic-mcp

- Audit run: 2026-09-19T11:02:53Z
- Repository: Reese-max/academic-mcp
- Default branch / inspected HEAD: `main` / [`c61d6fac1ab697748ac738382665d930d5361255`](https://github.com/Reese-max/academic-mcp/commit/c61d6fac1ab697748ac738382665d930d5361255)
- Latest product-changing baseline: [`4eb25de5005d33572095ed566ccf00762011bb50`](https://github.com/Reese-max/academic-mcp/commit/4eb25de5005d33572095ed566ccf00762011bb50)
- Candidate PR inspected: [#13](https://github.com/Reese-max/academic-mcp/pull/13), head [`844f5c2ff5823808aeb1c0aa05d4b39885b1ef4d`](https://github.com/Reese-max/academic-mcp/commit/844f5c2ff5823808aeb1c0aa05d4b39885b1ef4d)
- Issue Quality v2 blob: [`8167e10798071d2276addaff6b201c6b0e904a2a`](https://github.com/Reese-max/autodev-ng/blob/8167e10798071d2276addaff6b201c6b0e904a2a/docs/portfolio-audit/2026-09-14-issue-quality-v2.md)
- Evidence policy: CONFIRMED/SOURCE_CONFIRMED is repository or named-source evidence; EXECUTED_REPRODUCTION is reserved for an actually run path; UNKNOWN and NEEDS_RUNTIME_VERIFICATION are not failure claims.
- Persona policy: the 50 personas below are model-generated scenario coverage, not independent people, interviews, telemetry, votes, market share, defect frequency, ROI, or implementation authorization.

## Outcome

PR #13 is directionally the correct smallest response to [Issue #2](https://github.com/Reese-max/academic-mcp/issues/2), but its current head cannot yet provide the claimed host-independent admission receipt. Two deterministic gate defects and one auth validation gap are source-confirmed. None is evidence that the default-branch product, production credential, or supported research workflow has already failed.

Strict calibration:

| Finding | Kind | Severity | Decision priority | Evidence | Triage |
|---|---|---:|---|---|---|
| F01 setup-python is configured with unsupported `cache: uv` | BUG | P2 | HIGH_PRE_MERGE | SOURCE_CONFIRMED | NEEDS_REVIEW |
| F02 vendored ordinary directories resolve the parent repository HEAD | BUG | P2 | HIGH_PRE_MERGE | SOURCE_CONFIRMED | NEEDS_REVIEW |
| F03 auth test bypasses the real HTTP transport/wiring | VALIDATION_GAP | NOT_ESTABLISHED | P2 | SOURCE_CONFIRMED | NEEDS_REVIEW |

All have `auto_implementation=false`. Review badges had marked F01/F02 as P1, but this board does not preserve that inflation: current evidence shows a broken pre-merge validation gate, not data loss, permission bypass, or a failed supported user research task.

## Discovery and delta

The owner inventory was re-enumerated in one complete page: 41 repositories, 40 unarchived and 1 archived (`obsidian-vault`). `academic-mcp` was selected through the persistent fairness cursor. No non-owner repository was modified.

The default branch has no product-changing commit after 2026-09-11. Current HEAD is an audit-only Round 2 commit; it does not invalidate or repair product behavior. The current product boundary remains a private, single-owner academic MCP gateway exposing three pinned upstream families, 81 tools and 7 prompts through a localhost bearer-authenticated HTTP endpoint and a secure tunnel.

All repository Issues and open PRs were rechecked. Relevant current tracking:

- [#2](https://github.com/Reese-max/academic-mcp/issues/2): host-independent integrity/admission gate; active PR #13.
- [#3](https://github.com/Reese-max/academic-mcp/issues/3): off-host restore and cold-start proof.
- [#4](https://github.com/Reese-max/academic-mcp/issues/4): service home-directory visibility.
- [#14](https://github.com/Reese-max/academic-mcp/issues/14): OpenAlex provider failure can become false-empty.
- [#15](https://github.com/Reese-max/academic-mcp/issues/15): Crossref provider failure can become false-empty.
- [#1](https://github.com/Reese-max/academic-mcp/issues/1), [#9](https://github.com/Reese-max/academic-mcp/issues/9), and [#12](https://github.com/Reese-max/academic-mcp/issues/12) remain research/opportunity scopes with severity NOT_ESTABLISHED.

PR #13 has an active owner branch and three unresolved review threads. Issue #2's historic lock markers are released/expired, but the active PR and owner work make this audit `SKIPPED_LOCKED`; no Issue or PR scope was edited.

## Findings

### F01 — unsupported setup-python cache prevents the gate from reaching verification

Fingerprint: `academic-mcp:pr13-workflow:pull-request:setup-python-cache-uv-unsupported:gate-stops-before-verify:v1`

Who/flow: maintainers and release owners relying on the supported pull-request admission workflow.

Reachable path:

1. [verify.yml](https://github.com/Reese-max/academic-mcp/blob/844f5c2ff5823808aeb1c0aa05d4b39885b1ef4d/.github/workflows/verify.yml) runs `actions/setup-python@v5`.
2. The action receives `cache: "uv"`; setup-python v5 supports its documented package-manager cache values, not uv.
3. The later `astral-sh/setup-uv` and `python scripts/verify.py` steps therefore cannot be relied on to run.
4. [Actions run 35193227322](https://github.com/Reese-max/academic-mcp/actions/runs/35193227322) concluded failure. Both jobs expose `steps=null` and no logs, so the exact remote cause remains UNKNOWN; source inspection independently establishes the invalid configuration.

Expected: the secret-free job reaches the repository verification command on every PR/push.

Actual: the workflow configuration contains an invalid setup-python cache value. This is a release-validation blocker, not proof of product runtime failure.

Review evidence: [thread](https://github.com/Reese-max/academic-mcp/pull/13#discussion_r4034149806).

Smallest effective change: remove setup-python caching or let `setup-uv` own uv caching. Do not add a new CI platform or cache service.

Acceptance:

1. The PR/push workflow reaches `python scripts/verify.py` on a clean hosted runner.
2. The run records real steps/logs rather than a zero-step receipt.
3. Cache changes do not require repository secrets or write permissions.
4. A failing verification command fails the job; a passing one produces an inspectable receipt.

### F02 — upstream-pin check compares each vendor snapshot with the parent repository HEAD

Fingerprint: `academic-mcp:pr13-verify:vendored-plain-directory:git-rev-parse-parent-head:all-upstream-pins-mismatch:v1`

Who/flow: maintainers validating a clean checkout or refreshed pinned upstream snapshot.

Reachable path:

1. `check_upstreams_lock()` changes `cwd` into `vendor/<name>`.
2. The vendored snapshots are ordinary directories, not nested Git repositories.
3. `git rev-parse HEAD` walks upward and returns the enclosing academic-mcp repository HEAD.
4. That SHA cannot equal each distinct upstream commit in `upstreams.lock.json`, so the check is structurally incapable of proving provenance and will report mismatch.

Expected: verify that each committed snapshot corresponds to its declared upstream pin.

Actual: compare unrelated parent HEAD metadata with upstream commit IDs.

Review evidence: [thread](https://github.com/Reese-max/academic-mcp/pull/13#discussion_r4034149811).

Smallest effective change: validate committed snapshot contents against a source-generated manifest or store/read explicit per-snapshot provenance metadata created during the controlled refresh. Do not convert this into a registry, database, submodule migration, or portfolio-wide supply-chain platform unless the small representation is shown insufficient.

Acceptance:

1. Untampered pinned snapshots pass from a clean checkout with no nested `.git`.
2. A changed vendored file fails with its exact path or digest mismatch.
3. A changed declared upstream pin without a matching refresh fails clearly.
4. The test does not accept the parent repository HEAD as upstream provenance.

### F03 — verifier unit-check does not exercise production HTTP auth wiring

Fingerprint: `academic-mcp:pr13-auth-check:in-process-no-http:direct-verifier-only:http-auth-wiring-uncovered:v1`

Who/flow: owner relying on the new admission gate to prevent accidental removal or miswiring of bearer protection.

Reachable path:

1. The script directly instantiates `OwnerTokenVerifier` and checks two token values.
2. It then builds `create_server(http=False)`, mounts backends in process, and invokes it with a local FastMCP client.
3. This validates verifier logic and tool/schema parity, but it does not make an unauthorized and authorized request through the actual `http=True` gateway.
4. A change that removes or misattaches `auth=auth` on the HTTP server can therefore escape this test.

Expected: the admission claim “auth rejection” covers the supported HTTP transport boundary.

Actual: the verifier object is tested separately from the production HTTP wiring.

Review evidence: [thread](https://github.com/Reese-max/academic-mcp/pull/13#discussion_r4034149817).

This is not evidence that current HTTP auth is bypassable. Severity remains NOT_ESTABLISHED; decision priority is P2 because the gate explicitly claims to cover this boundary.

Smallest effective change: start the real HTTP-mode server on loopback with an ephemeral port/non-secret fixture token and assert unauthorized rejection plus authorized success. No IAM service, OAuth, secret broker, or public deployment is required.

Acceptance:

1. A request without a bearer token is rejected through the actual HTTP transport.
2. A wrong token is rejected.
3. The fixture token can list/call a harmless deterministic tool.
4. Removing or miswiring the server auth parameter makes the test fail.

## External comparison — checked 2026-09-19

| Product / workflow | Current official evidence | Positioning implication | Status/date |
|---|---|---|---|
| [Elicit](https://elicit.com/solutions/search) / [API](https://docs.elicit.com/) | Hosted semantic search, reports, systematic-review workflows, alerts and programmatic access | Do not clone hosted review breadth; remain a private composable gateway | CONFIRMED; accessed 2026-09-19, page update date not stated |
| [Consensus](https://help.consensus.app/en/) | Question-first academic search, product feature guides and dataset/AI documentation | Managed answer UX is an alternative, not proof this repo needs synthesis | CONFIRMED; accessed 2026-09-19, update date not stated |
| [ResearchRabbit](https://www.researchrabbit.ai/features) | Collection/author/paper exploration and visual discovery | Use as a substitute for graph exploration; do not build a graph UI without demand | CONFIRMED; accessed 2026-09-19, update date not stated |
| [Zotero](https://www.zotero.org/support/) | Mature library, PDF, citation, sync, group, mobile and plugin workflows | Handoff/export can be researched later; rebuilding reference management is out of scope | CONFIRMED; official docs last updated 2026-05-14 |
| [OpenAlex](https://help.openalex.org/) / [Semantic Scholar API](https://www.semanticscholar.org/product/api) / [Crossref REST](https://www.crossref.org/documentation/retrieve-metadata/rest-api/) | Direct scholarly metadata APIs remain substitutes and dependencies | The product must preserve provider-specific failure truth; provider breadth is not the moat | CONFIRMED for product/API existence; live service health and current rate behavior UNKNOWN |

MUST MATCH: truthful source-specific errors, inspectable citations/identities, bounded provider behavior, deterministic admission, recoverable local state.

SHOULD BE BETTER: privacy/local custody, one composable MCP entry point, explicit partial failure, pinned upstreams, reproducible evidence receipts.

DIFFERENTIATOR: owner-controlled local data plus source-specific tools and deterministic provenance—not generic AI synthesis.

DO NOT COPY: multi-tenant hosted SaaS, full systematic-review UI, citation graph UI, Zotero-class sync/library, native mobile app, or opaque generated conclusions.

## Product board — model-simulated perspectives

| Role | Position |
|---|---|
| CEO | If only three things: fix #14/#15 source truth; make PR #13 produce a real receipt; prove #3/#4 recovery and isolation. Do not add providers, SaaS, or synthesis. |
| CPO | INVEST / SIMPLIFY. The private gateway thesis remains distinct; reliability proof is the product milestone. |
| CTO | Keep one small gate and real HTTP fixture; avoid a new validation platform. |
| Staff/Principal Engineer | F01/F02 are local deterministic bugs; F03 is a missing boundary test, not an auth incident. |
| UX Lead | Error language must distinguish “no papers” from “source unavailable”; no bespoke UI until client evidence demands it. |
| Researcher | Maintain source identity and partial-failure truth; do not turn synthetic personas into usage evidence. |
| Growth | Provider count is a vanity metric here; repeatable owner success matters more. |
| CFO | No paid provider, hosted monitoring, or new service is justified by the findings. |
| Security/Privacy | Real HTTP auth wiring and target-host path isolation need evidence; no breach is claimed. |
| QA | A green unit fixture cannot replace pull-request trigger, HTTP transport, provider, restore, mobile, or assistive-tech paths. |
| SRE | Zero-step failed jobs are UNKNOWN; do not diagnose billing, quota, runner, or YAML cause without logs. |
| Accessibility | The repository has no bespoke UI; connected-client accessibility stays runtime pending. |
| Support | One truthful admission receipt and source-specific error status reduce support ambiguity more than new features. |

Disagreement retained: Product/Growth could prefer progressive discovery or bundle features (#9/#1), while Security/SRE/QA insist the current gate and runtime proof come first. The board resolves this in favor of trust prerequisites without rejecting the research scopes permanently.

## 50 synthetic personas — 30 regression + 20 exploration

The fixed A01–J05 audit remains separate in [Round 2](https://github.com/Reese-max/academic-mcp/blob/c61d6fac1ab697748ac738382665d930d5361255/.github/quality-audits/2026-09-18T0758Z-50-persona-audit-round-2.md). This product-market set does not replace it or create a CLEAN round.

| ID | Background / constraint | Goal / journey | Friction / outcome | Classification / recommendation / evidence |
|---|---|---|---|---|
| R01 | 研究生／無 CLI | 用已連線 client 搜尋已知論文 | 核心入口可達假設不變；provider 失敗仍須明示 | 既有 #14/#15；P2；SOURCE_CONFIRMED |
| R02 | 研究生／趕截稿 | 多來源快速查詢 | OpenAlex/Crossref 失敗可能被誤讀為零結果 | 先修既有 P2，不新增單 |
| R03 | 助理／需來源真相 | 比較來源結果 | 部分來源成功時仍需標出失敗來源 | #14/#15；不以 fallback 掩蓋 |
| R04 | 博士生／長流程 | 搜尋→下載→索引→重啟 | 真實 off-host restore 仍未證明 | #3；NEEDS_RUNTIME_VERIFICATION |
| R05 | PI／低技術投入 | 只透過 ChatGPT 使用 | 主路徑依賴 owner-host/tunnel 健康 | 不建新 UI；runtime pending |
| R06 | 圖書館員／DOI 導向 | 用 DOI 與標題交叉查詢 | 來源識別保留；衝突整合仍屬研究 | #1；NOT_ESTABLISHED |
| R07 | 證據審查者 | 需要可追溯失敗狀態 | false-empty 破壞審查可信度 | #14/#15；P2 |
| R08 | SRE／乾淨重建 | 在中立 Linux checkout 執行 gate | PR #13 gate 先在 setup-python cache 失敗 | F01；P2 |
| R09 | 維護者／更新 vendor | 驗證 upstream pin | 普通目錄解析成父 repo HEAD，必然 mismatch | F02；P2 |
| R10 | Security reviewer | 驗證 HTTP bearer 邊界 | PR 只直接測 verifier，未測 HTTP wiring | F03；NOT_ESTABLISHED |
| R11 | Windows/WSL owner | 重啟服務與 tunnel | 真實 logout/reboot 路徑未覆蓋 | #3；runtime pending |
| R12 | 單人研究者／私密資料 | 限制服務讀取範圍 | ProtectHome=read-only 不代表 unrelated home invisible | #4；P2 |
| R13 | 資料工程師 | 重複同一查詢 | 讀路徑可重試；provider 語義須一致 | #14/#15；局部修補 |
| R14 | 高延遲網路 | 遭遇 timeout/5xx | 需要明確 degraded/error，不是空清單 | #14/#15；P2 |
| R15 | 無 API key 使用者 | 走免費 provider | 不得把授權/限流失敗報成沒有論文 | 既有追蹤；不買付費方案 |
| R16 | 成本敏感 owner | 執行大量搜尋 | 不自動升級、付費或加 provider | 維持現界線 |
| R17 | 鍵盤使用者 | 透過既有 client 完成搜尋 | repo 無 bespoke UI；client a11y 未驗證 | UNKNOWN；不硬開缺陷 |
| R18 | 螢幕閱讀器使用者 | 讀來源與錯誤 | 需 client runtime；文字輸出本身不足以證明可用 | NEEDS_RUNTIME_VERIFICATION |
| R19 | 手機使用者 | 短 session 查論文 | 手機路徑由 client 決定，未有真實收據 | UNKNOWN；不建 native app |
| R20 | 大字體使用者 | 讀長結果 | 無 repo UI；不能由 source 推論缺陷 | DEFER |
| R21 | 維護新手 | 照 README 跑 verify | PR #13 宣稱 command，但 CI 收據為失敗 | F01/F02；P2 |
| R22 | Release owner | 要求單一 admission receipt | 零步驟 jobs 無法證明任何 test 路徑 | F01/F02；NEEDS_REVIEW |
| R23 | 法遵審查者 | 要求不誤稱 current health | 歷史 smoke 不等於 current-SHA runtime | 維持限制 |
| R24 | 備份操作者 | 加密備份 roundtrip | fixture 不等於 off-host restore | #3；runtime pending |
| R25 | 失敗復原者 | 中斷後重試 | 需先查目前狀態；現文件採保守路徑 | 無新 finding |
| R26 | 多來源研究者 | Semantic Scholar 429 | 已有 bounded retry；不代表 OpenAlex/Crossref 已處理 | Red Team：不可泛化 |
| R27 | 大型 library owner | 大量索引後重建 | 容量/RTO/RPO 未實測 | #3；NEEDS_EVIDENCE |
| R28 | 服務管理員 | 檢查 systemd sandbox | 要以目標 host namespace probe 驗證 | #4；runtime pending |
| R29 | Schema consumer | 比較 81 tools/7 prompts | in-process parity 可查；HTTP auth wiring 未查 | F03；validation gap |
| R30 | 支援人員 | 根據 Actions 判斷健康 | run 35193227322 failure 且 steps/logs 空，原因 UNKNOWN | 不可猜額度或 runner |
| E01 | 藥學研究者 | 詢問高風險用藥證據 | 產品是 retrieval gateway，不是臨床決策系統 | 不擴張醫療判斷 |
| E02 | 系統綜述團隊 | 想要 screening/extraction | Elicit 已成熟；本產品未驗證此需求 | DO NOT COPY |
| E03 | 文獻探索者 | 想看 citation graph | ResearchRabbit/Connected Papers 是替代方案 | 不建圖形 UI |
| E04 | Zotero 使用者 | 要引用/同步 | 先驗證匯出/交接需求，不重做 library sync | LATER research |
| E05 | 跨機器個人使用者 | 期待無感同步 | 與單 owner local-first 範圍有張力 | NEEDS_EVIDENCE |
| E06 | 團隊主管 | 多人共享 gateway | 超出核定單 owner 範圍 | DON'T：multi-tenant |
| E07 | API 開發者 | 想直接查 Semantic Scholar | 可用上游官方 API；gateway 價值在組合/私密 | DIFFERENTIATOR |
| E08 | 離線研究者 | 網路中斷仍要讀既有內容 | 本地資料是優勢；新搜尋仍依賴 provider | 文件化邊界即可 |
| E09 | 對抗性 caller | 送錯 token | PR gate 未穿過 HTTP auth wiring | F03；P2 decision priority |
| E10 | 惡意 vendor snapshot | 竄改一檔 | manifest 可檢，但 pin provenance 檢查錯根因 | F02；最小修正 metadata/content |
| E11 | 供應鏈審查者 | 檢查 GitHub Actions | setup-python cache=uv 不受支援 | F01；局部 YAML 修正 |
| E12 | 平台工程師 | 想建通用驗證平台 | 單 repo gate 即可，平台無必要 | Red Team reject overengineering |
| E13 | 研究資料管理者 | 要求 canonical bundle ledger | 有 #1 research，尚無已證實缺陷 | NOT_ESTABLISHED |
| E14 | 學術誠信審查者 | 要求撤稿/更正提示 | 有 #12 research，需窄實驗 | NEEDS_EVIDENCE |
| E15 | 低頻 owner | 每月才啟動一次 | 冷啟動可靠性比新功能重要 | #3 priority |
| E16 | 隱私優先 owner | 拒絕雲端上傳全文 | local-first 差異化；勿抄 hosted workflow | DIFFERENTIATOR |
| E17 | 效能敏感研究者 | 要求低延遲 | 沒有長期 metrics；不編造 SLO | UNKNOWN |
| E18 | 支援工程師 | 要單一診斷收據 | 先修現 gate；不建監控平台 | NARROW |
| E19 | 機構採購者 | 要求 SLA/合規 | 目前 owner-scale，證據不足 | PAUSE expansion |
| E20 | 開源貢獻者 | 想替換/新增 provider | 先解 truth/recovery/admission；不追工具數 | DON'T |

No Synthetic Preference Share or switching percentage is reported. The scenarios are useful for coverage only.

## Red Team

- Existing functionality: the current default branch already documents auth, manifests, retry and backup fixtures; the finding is not “no framework exists.”
- Smaller alternative: F01 is one workflow-value correction; F02 is explicit provenance/content verification; F03 is one real loopback HTTP fixture.
- Wrong-root check: the failed Actions run has no steps/logs, so it cannot independently prove F01 or F02 caused the remote failure. The source defects stand separately; the remote cause stays UNKNOWN.
- Environment check: PR #13 is not merged and its base predates the current audit-only HEAD. These are pre-merge blockers, not a default-branch regression.
- Demand check: competitor breadth does not prove need for reports, graphs, mobile, team collaboration or more providers.
- Scale check: a single-owner private gateway does not justify a database, generalized ledger, IAM platform, monitoring service or cross-repository verification framework.
- Counterevidence: directly testing `OwnerTokenVerifier` does prove its local logic; it simply does not prove server wiring. Therefore F03 remains a validation gap, not a BUG/P1.
- Counterevidence: `source-manifest.json` can detect content drift, so F02 needs a corrected provenance representation, not a wholesale dependency-management rewrite.

## NOW / NEXT / LATER / DON'T

NOW:

1. Keep #14/#15 as the product P2 truth defects; preserve provider failure rather than false-empty.
2. Narrow PR #13 to a gate that can actually run and prove snapshot integrity plus real HTTP auth.
3. Obtain a new PR-head Actions receipt with non-null steps/logs before claiming acceptance.

NEXT:

- Run authorized, bounded OpenAlex and Crossref success/failure checks without substituting another provider.
- Complete #3 off-host restore/cold-start and #4 target-host namespace verification.
- Re-run the same fixed and product personas on a merged product SHA.

LATER:

- #1 canonical identity/research-bundle experiment, #9 progressive discovery, #12 post-publication status warnings.
- Optional Zotero handoff only if a real workflow shows demand.
- Mobile and assistive-technology client verification.

DON'T:

- Do not add providers, a new database/ledger, generic supply-chain platform, hosted monitoring, public SaaS, accounts, collaboration, graph UI, native app, or AI synthesis to close these findings.
- Do not treat issue numbers, review severity badges, persona counts or a future green run as implementation/deployment authorization.
- Do not mark fixed from a PR diff or merge alone; rerun the covered path on the resulting default-branch SHA.

## Decision memo

- Serve: one technically supported, privacy-conscious researcher using ChatGPT/MCP with local paper/index custody.
- Compete on: source breadth behind one private entry point, explicit provider identity, reproducibility, and recoverability.
- Do not compete on: hosted review UI, generic Q&A, visual discovery, team workspaces or citation-library sync.
- Top priorities: provider truth (#14/#15), trustworthy admission (#2/PR #13), recovery/isolation proof (#3/#4).
- Remove/simplify: consolidate to one canonical gate after it works; retire redundant candidate PRs only by owner decision. No product feature deletion is justified now.
- Risks: false-empty provider output, unverifiable release receipts, unproven restore, broad service read visibility, and scope expansion.
- Experiments: real HTTP auth fixture; clean-checkout provenance mutation; authorized bounded provider failure; off-host restore/cold start.
- Recommendation: INVEST / SIMPLIFY / MAINTAIN. Block PR #13 until the contract is true; keep all research scopes separate from implementation authorization.

## Mapping, locks, regression and limits

| Finding | Tracking | Write action |
|---|---|---|
| F01 | Issue #2 + PR #13 review thread r4034149806 | SKIPPED_LOCKED |
| F02 | Issue #2 + PR #13 review thread r4034149811 | SKIPPED_LOCKED |
| F03 | Issue #2 + PR #13 review thread r4034149817 | SKIPPED_LOCKED |

No new Issue is appropriate: all three share the existing admission-gate scope and active implementation branch. Changing solution names would not create new fingerprints. No owner rejection was overridden.

Regression state:

- VERIFIED_FIXED: 0.
- STILL_REPRODUCIBLE on default branch: not claimed for F01–F03 because they are PR-head findings.
- CANNOT_VERIFY: real provider, WSL/systemd, tunnel, ChatGPT client, off-host restore, mobile, assistive technology, and production credential paths.
- Portfolio CLEAN: NOT CLEAN, 0/2. The fixed A01–J05 Round 2 already records open P2 blockers and runtime gaps; this board simulation cannot replace those stopping conditions.

Actions evidence:

- PR head run [35193227322](https://github.com/Reese-max/academic-mcp/actions/runs/35193227322): two failed jobs, both `steps=null`, no log URL.
- No statement is made that Python tests, provider calls, auth transport or backup behavior passed or failed on GitHub-hosted infrastructure.
- No local/container execution was performed in this audit; evidence is SOURCE_CONFIRMED static inspection plus GitHub run metadata.

## Run accounting

- Inventory: 41 owned repositories / 40 unarchived / 1 archived; complete first page.
- Repository deep-reviewed: 1 (`academic-mcp`).
- New findings: 3.
- Severity: P0 0 / P1 0 / P2 2 / P3 0 / NOT_ESTABLISHED 1.
- New Issues: 0.
- Updated Issues: 0.
- Reopened Issues: 0.
- Duplicate avoided: 3/3.
- Reclassified downward from review badge: 2 P1 → P2.
- Verified fixed: 0.
- Issue write blocked: 0.
- Report write: attempted as a unique central delta.
- Active implementation conflicts: Issue #2 / PR #13 / branch `devin/issue-2`; `SKIPPED_LOCKED`.
- Product implementation, branch, merge, deploy, secret/settings, GOAL/worker changes: 0.
