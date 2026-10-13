# Product Board Delta — spotify-playlist-organizer-mcp

- Audit run: 2026-09-19T14:00:53Z
- Repository: Reese-max/spotify-playlist-organizer-mcp
- Default branch / inspected HEAD: `main` / [`01f84bd496225c3b96d4a022fa8612320fba45df`](https://github.com/Reese-max/spotify-playlist-organizer-mcp/commit/01f84bd496225c3b96d4a022fa8612320fba45df)
- Latest product-changing baseline: [`a0bad36b6ab80185f01f0632f25c8b27ef09dbb8`](https://github.com/Reese-max/spotify-playlist-organizer-mcp/commit/a0bad36b6ab80185f01f0632f25c8b27ef09dbb8)
- Candidate PR heads: [#38 `2003b69`](https://github.com/Reese-max/spotify-playlist-organizer-mcp/pull/38), [#39 `1f29ae5`](https://github.com/Reese-max/spotify-playlist-organizer-mcp/pull/39), [#40 `5b7997b`](https://github.com/Reese-max/spotify-playlist-organizer-mcp/pull/40), [#41 `6e792a9`](https://github.com/Reese-max/spotify-playlist-organizer-mcp/pull/41)
- Issue Quality v2 blob: [`8167e10798071d2276addaff6b201c6b0e904a2a`](https://github.com/Reese-max/autodev-ng/blob/8167e10798071d2276addaff6b201c6b0e904a2a/docs/portfolio-audit/2026-09-14-issue-quality-v2.md)
- Evidence policy: CONFIRMED/SOURCE_CONFIRMED means repository or named-source evidence. No provider, browser, Windows, assistive-technology, deployment or production-credential path was executed; those remain NEEDS_RUNTIME_VERIFICATION.
- Persona policy: the 50 personas below are model-generated scenario coverage, not independent people, interviews, votes, frequency, revenue, ROI, market share or implementation authorization.

## Outcome

The default branch has not changed product behavior since 2026-09-15; its later commits are audit-only. The current YouTube-first product direction remains coherent: bind an exact video, classify it, deduplicate by explicit policy, persist locally, and make a bounded playlist mutation with a truthful receipt.

Four active PRs introduce four material pre-merge blockers. The highest is a credential-exposure boundary in PR #41: the new global redaction envelope replaces only a token-shaped prefix, so a passphrase containing spaces or a secret containing punctuation can retain its suffix in MCP output. Three P2 blockers affect canonical remote dedupe, multi-source local integrity, and the documented Windows `.env` first-success path. Five additional P3 observations are recorded without inflating them into product emergencies.

| Finding | Kind | Severity | Decision priority | Evidence | Triage |
|---|---|---:|---|---|---|
| F01 PR #41 redacts only the secret prefix and can expose the suffix | BUG | P1 | HIGH_PRE_MERGE | SOURCE_CONFIRMED | NEEDS_REVIEW |
| F02 PR #40 skips a canonical remote duplicate without persisting the matched remote video ID | BUG | P2 | HIGH_PRE_MERGE | SOURCE_CONFIRMED | NEEDS_REVIEW |
| F03 PR #39 silently joins sources already owned by different tracks | BUG | P2 | HIGH_PRE_MERGE | SOURCE_CONFIRMED | NEEDS_REVIEW |
| F04 PR #38 consumes unknown backslash escapes in quoted `.env` values | BUG | P2 | HIGH_PRE_MERGE | SOURCE_CONFIRMED | NEEDS_REVIEW |
| F05 refreshed encrypted-store token is reclassified as insecure environment fallback | BUG | P3 | NORMAL | SOURCE_CONFIRMED | NEEDS_REVIEW |
| F06 first `library_status` reports MISSING instead of initializing an empty library | BUG | P3 | NORMAL | SOURCE_CONFIRMED | NEEDS_REVIEW |
| F07 unquoted inline `#comment` parsing differs from documented dotenv expectations | BUG | P3 | NORMAL | SOURCE_CONFIRMED | NEEDS_REVIEW |
| F08 duplicate JSON keys can make SQL and JavaScript report different sync states | BUG | P3 | NORMAL | SOURCE_CONFIRMED | NEEDS_REVIEW |
| F09 MCP E2E child startup failure waits serial timeouts instead of failing fast | MAINTENANCE | P3 | NORMAL | SOURCE_CONFIRMED | NEEDS_REVIEW |

All have `auto_implementation=false`. These are PR-head blockers, not default-branch incidents or verified production regressions.

## Discovery, ownership and dedupe

The owned inventory was re-enumerated through the persistent fairness cursor: 41 repositories, 40 unarchived and one archived content repository. This round deep-reviewed one unarchived owned product repository. No non-owner repository was modified.

The complete open surface was checked: 33 Issues and seven PRs (#20, #36–#41). Existing audits and owner decisions were reread. PR #20's previously recorded transient reconciliation, batch resume, unsynced filter, classification preservation and backup findings map to #28–#33 and were not repeated.

Relevant tracking already exists:

- [#3](https://github.com/Reese-max/spotify-playlist-organizer-mcp/issues/3) secure credential lifecycle → PR #41.
- [#9](https://github.com/Reese-max/spotify-playlist-organizer-mcp/issues/9) local Personal Music Library → PR #39.
- [#10](https://github.com/Reese-max/spotify-playlist-organizer-mcp/issues/10) unified idempotent save → PR #40.
- [#23](https://github.com/Reese-max/spotify-playlist-organizer-mcp/issues/23) `.env` onboarding → PR #38.
- [#4](https://github.com/Reese-max/spotify-playlist-organizer-mcp/issues/4), [#31](https://github.com/Reese-max/spotify-playlist-organizer-mcp/issues/31) and active PR review threads cover the lower observations.

All relevant branches, PRs and unresolved reviews have active owner work. Historic Issue #3 lease markers are released. This audit is therefore `SKIPPED_LOCKED`; it did not add comments, change scope or create duplicate Issues.

## Material findings

### F01 — partial redaction can return credential suffixes to the MCP caller

Fingerprint: `spotify-playlist-organizer-mcp:pr41-redact:secret-with-space-or-punctuation:regex-matches-prefix-only:credential-suffix-in-tool-output:v1`

Affected flow: a user or support operator receives any tool success/error whose serialized value includes a configured passphrase, client secret, refresh token or access token.

Reachable source path:

1. PR #41 routes tool results and errors through `redactSecrets()`.
2. Its key-value patterns stop at characters outside `[A-Za-z0-9._~+/|-]`.
3. `credential_passphrase=correct horse battery staple` becomes `[REDACTED] horse battery staple`; `client_secret=abc!def` leaves `!def`.
4. The central envelope therefore expands the places using an incomplete matcher; it does not establish a zero-secret response boundary.

Evidence: [review thread](https://github.com/Reese-max/spotify-playlist-organizer-mcp/pull/41#discussion_r4039866123), head [`6e792a9`](https://github.com/Reese-max/spotify-playlist-organizer-mcp/commit/6e792a97dda247ed57f44d42c25ccbaa77d0b5ed). [Google OAuth best practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices) (updated 2026-05-20; checked 2026-09-19) says tokens must be stored securely and never transmitted in plaintext.

Severity P1 is justified by a reachable credential-confidentiality boundary before merge. It is not P0: the branch is unmerged and no real credential exposure or production incident was observed.

Smallest effective change: redact the entire value after a recognized sensitive key through a bounded delimiter-aware parser, and separately replace complete Bearer/known token values. Do not add a secret broker, DLP platform or generalized logging service.

Acceptance:

1. Space-, punctuation-, quote- and newline-containing secret fixtures leave no original substring in success or error output.
2. Neighboring non-secret diagnostic text remains usable.
3. Bearer, access, refresh, client-secret and credential-passphrase variants are covered.
4. Tests exercise both serialized success data and thrown error messages.

### F02 — canonical remote skip is not durable in the local identity model

Fingerprint: `spotify-playlist-organizer-mcp:pr40-save-music:metadata-canonical-match-not-linked:skip-success-then-library-sync-local-only:duplicate-upload-risk:v1`

Affected flow: save a video when the target playlist already contains a different upload of the same canonical track, then run library sync or retry.

PR #40 correctly detects a canonical playlist duplicate and returns `matchedVideoId`, but later persists only the requested source. The matched remote video is not linked to the existing local track. `library-sync` compares playlist items only with persisted source IDs, so it can report `local_only` and allow another upload to be added despite the prior skip-success receipt.

Evidence: [review thread](https://github.com/Reese-max/spotify-playlist-organizer-mcp/pull/40#discussion_r4039780551), head [`5b7997b`](https://github.com/Reese-max/spotify-playlist-organizer-mcp/commit/5b7997b7e1f6b5300fa1f801f58284f7898f232e).

Smallest effective change: when canonical membership is the reason for `ALREADY_PRESENT`, attach the matched YouTube ID to the selected canonical track as a non-primary source or durable equivalent used by sync. Do not add a graph database or global identity service.

Acceptance:

1. Metadata-only canonical match persists the matched remote video identity.
2. The next sync reports the track in sync for that playlist.
3. Source-level override can still intentionally add the requested upload.
4. Live/cover/remix/remaster distinctions remain protected by existing version policy.
5. Retry does not create another remote item.

### F03 — a multi-source save can corrupt track ownership silently

Fingerprint: `spotify-playlist-organizer-mcp:pr39-library-save:input-sources-owned-by-different-tracks:first-match-wins:cross-track-source-reassignment:v1`

Affected flow: import or save one logical record containing multiple source IDs where at least two IDs already belong to different local tracks.

`saveTrack()` scans sources until the first existing `track_id`, selects it, then upserts every supplied source. It neither verifies that all existing sources resolve to the same track nor requires an explicit merge. The call can report success while moving/combining identities and applying metadata to only the first selected track.

Evidence: [review thread](https://github.com/Reese-max/spotify-playlist-organizer-mcp/pull/39#discussion_r4039618781), head [`1f29ae5`](https://github.com/Reese-max/spotify-playlist-organizer-mcp/commit/1f29ae5b988e039549de35c9591e0c217297f00e).

Smallest effective change: resolve every supplied existing source before mutation and fail closed with the conflicting track IDs unless the caller invokes a separately authorized explicit merge. No general entity-resolution framework is needed.

Acceptance:

1. Sources all new or all owned by one track still save atomically.
2. Sources owned by different tracks perform zero writes and return a specific conflict.
3. The receipt identifies conflicting source IDs/track IDs without secrets.
4. A failed call preserves both original tracks and metadata.

### F04 — quoted Windows paths lose backslashes

Fingerprint: `spotify-playlist-organizer-mcp:pr38-env-parser:quoted-windows-path:unknown-backslash-consumed:credential-file-path-corrupted:v1`

Affected flow: a Windows user follows the documented `.env` setup with a quoted credential/library path such as `"C:\Users\name\..."`.

The parser consumes the backslash for every escape, translating known escapes and dropping the slash for unknown ones. A normal Windows path therefore becomes `C:Users...`, blocking the documented first-success path or sending state to the wrong location.

Evidence: [review thread](https://github.com/Reese-max/spotify-playlist-organizer-mcp/pull/38#discussion_r4037100712), head [`2003b69`](https://github.com/Reese-max/spotify-playlist-organizer-mcp/commit/2003b698c1e19cba2af8b375f0db5a4371644ffe).

Smallest effective change: preserve the backslash for unknown escape sequences (or adopt the repository's chosen dotenv-compatible parser) and add platform-neutral fixtures. Do not build a configuration service.

Acceptance:

1. Quoted Windows paths round-trip byte-for-byte.
2. Explicit supported escapes still decode as documented.
3. POSIX paths, spaces and literal backslashes remain covered.
4. The same parsed value is used by auth helper and MCP server.

## Lower-priority observations

- F05: PR #41 assigns a refreshed encrypted-store access token into `env.YOUTUBE_ACCESS_TOKEN`; `credentialStatus()` then reports `INSECURE_ENVIRONMENT_FALLBACK` and loses stored scope/channel diagnostics. [Thread](https://github.com/Reese-max/spotify-playlist-organizer-mcp/pull/41#discussion_r4039866127). P3 because token use still works.
- F06: PR #39 returns `MISSING` from `library_status` on a clean install without opening/migrating the empty DB. [Thread](https://github.com/Reese-max/spotify-playlist-organizer-mcp/pull/39#discussion_r4039618771). P3 with an easy workaround.
- F07: PR #38 recognizes only a space-before-`#` comment, so common `KEY=value#comment` input changes the value. [Thread](https://github.com/Reese-max/spotify-playlist-organizer-mcp/pull/38#discussion_r4037100720). P3; quoting/spacing is a workaround.
- F08: PR #37 filters `sync_state.detail` with SQLite `json_extract` but summarizes via `JSON.parse`; duplicate `state` keys select first vs last and can make totals disagree. [Thread](https://github.com/Reese-max/spotify-playlist-organizer-mcp/pull/37#discussion_r4037065893). P3 edge input; no broad sync failure claimed.
- F09: PR #36's MCP child harness has response timers but no child `exit`/`error` fan-out; startup failure can turn nine serial cases into roughly 90 seconds of timeouts. [Thread](https://github.com/Reese-max/spotify-playlist-organizer-mcp/pull/36#discussion_r4033733010). MAINTENANCE/P3, not a user-runtime failure.

## Actions evidence

- Default HEAD [run 35298862351](https://github.com/Reese-max/spotify-playlist-organizer-mcp/actions/runs/35298862351): success; audit-only HEAD.
- PR #41 [run 35254743314](https://github.com/Reese-max/spotify-playlist-organizer-mcp/actions/runs/35254743314): test job reached checkout, Node setup, install and tests; success.
- PR #40 [run 35253554165](https://github.com/Reese-max/spotify-playlist-organizer-mcp/actions/runs/35253554165): lint and tests with coverage; success.
- PR #39 [run 35251503000](https://github.com/Reese-max/spotify-playlist-organizer-mcp/actions/runs/35251503000): tests; success.
- PR #38 [run 35224089391](https://github.com/Reese-max/spotify-playlist-organizer-mcp/actions/runs/35224089391): tests; success.

These are valid receipts for the named test collections, but none executes real Google OAuth/YouTube mutation, Windows path use, conflicting pre-owned sources, metadata-only canonical sync, production credentials, browser/mobile or assistive technology. A green run does not refute the source-confirmed counterexamples.

## External comparison — checked 2026-09-19

| Product / workflow | Current evidence | Implication | Confidence/date |
|---|---|---|---|
| [YouTube Music playlists](https://support.google.com/youtubemusic/answer/7205933) | Official clients create/edit playlists directly | Native UI is the substitute for ordinary manual curation | CONFIRMED; update date not stated |
| [YouTube Data API playlistItems.insert](https://developers.google.com/youtube/v3/docs/playlistItems/insert) | Authorized insert adds one resource and costs 50 quota units | Exact identity, bounded retries and truthful receipts are MUST MATCH | CONFIRMED; updated 2026-09-14 |
| [YouTube quota calculator](https://developers.google.com/youtube/v3/determine_quota_cost) | Lists, inserts and page fetches carry distinct costs; playlist insert is 50 | Avoid duplicate writes and unbounded recovery loops | CONFIRMED; updated 2026-09-15 |
| [Google OAuth best practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices) | Secure token storage, revocation handling, PKCE and incremental authorization | Credential custody and zero-secret output are non-negotiable | CONFIRMED; updated 2026-05-20 |
| [Soundiiz](https://soundiiz.com/features) | Cross-service transfer/sync/import/export and YouTube Music read/write | Mature migration breadth is a substitute, not this product's roadmap | CONFIRMED; page date not stated |
| [Tune My Music](https://www.tunemymusic.com/) | Cross-platform transfer, sync, backup and dashboards | Do not compete on hosted migration scale without demand | CONFIRMED product claims; page date not stated |

Marketing claims are not independent effectiveness evidence. No community signal, preference share or switching percentage is used.

MUST MATCH: exact selection before mutation, least-privilege OAuth, zero-secret responses, idempotent playlist writes, quota-aware recovery and truthful local/remote state.

SHOULD BE BETTER: private/local custody, inspectable receipts, caller-controlled canonical-vs-source policy, no hosted account requirement.

DIFFERENTIATOR: YouTube-first conversational save with explicit selection, classification, reversible local identity and narrow remote mutation—not cross-platform migration breadth.

DO NOT COPY: multi-tenant accounts, universal sharing, billing/queues, all-service connectors, AI playlist marketplace, native mobile app or social feed.

## Product board — model-simulated perspectives

| Role | Position |
|---|---|
| CEO | If only three things: make secret redaction complete; make canonical/local identity durable; make Windows first success reliable. Do not expand providers, UI or sharing. |
| CPO | INVEST / SIMPLIFY / MAINTAIN the local, private YouTube-first wedge. |
| CTO | Fix each root locally; no secret broker, identity platform or sync service. |
| Staff/Principal Engineer | F01–F04 are deterministic branch paths; preserve separate fingerprints and tests. |
| UX Lead | Receipts must tell selected ID, matched remote ID, local track and next step without leaking secrets. |
| Researcher | 50 personas broaden scenarios but do not prove demand or incidence. |
| Growth | Cross-service breadth could grow reach, but it would erase the present trust-focused differentiation. |
| CFO | Quota-safe idempotency is cheaper than a dashboard or paid migration stack. |
| Security/Privacy | Block PR #41 until complete secret non-disclosure is demonstrated. |
| QA | Green unit/CI runs do not cover the four counterexamples; add exact regression fixtures. |
| SRE | Preserve fail-closed conflicts and bounded recovery; do not infer production health from audit-only HEAD. |
| Accessibility | No bespoke UI exists; connected-client and OAuth browser accessibility remain runtime pending. |
| Support | Correct credential source/status and durable matched IDs are higher value than more features. |

Disagreement retained: Growth could prefer Soundiiz/Tune My Music breadth, while Security/CPO/CTO prioritize private, reliable single-user custody. The board resolves for trust first and does not reject later research.

## 50 synthetic personas — 30 regression + 20 exploration

The fixed A01–J05 audit remains separate in [Round 2](https://github.com/Reese-max/spotify-playlist-organizer-mcp/blob/01f84bd496225c3b96d4a022fa8612320fba45df/.github/quality-audits/2026-09-18T0207Z-50-persona-audit-round-2.md). This table does not replace it or count as a CLEAN round.

| ID | Background / constraint | Goal / journey | Friction / outcome | Classification / recommendation |
|---|---|---|---|---|
| R01 | YouTube Music 重度使用者／只透過 MCP | 搜尋→選 videoId→分類→加入私密播放清單 | 主流程在 default baseline 有綠燈；仍缺真實 provider 寫入 | 回歸；維持 runtime pending |
| R02 | 新手／不熟 OAuth | 照 README 取得 token 並檢查狀態 | PR #41 刷新後被誤報 insecure env | F05 P3；修診斷，不重做 OAuth |
| R03 | Windows 使用者 | 以 .env 指定 C:\Users\... credential file | PR #38 吞掉反斜線，首次啟動可失敗 | F04 P2 |
| R04 | 密碼管理器使用者 | 貼入含空白 passphrase | PR #41 MCP 回應只遮前綴，尾段可外洩 | F01 P1 |
| R05 | 特殊字元 secret 使用者 | 設定含 ! 的 client_secret | 遮罩只覆英數前綴 | F01 P1 |
| R06 | 已有遠端同曲不同影片 | 保存 Official Audio；playlist 已有 MV | PR #40 跳過遠端新增但未保存 matched source | F02 P2 |
| R07 | 之後執行 library_sync | 核對本地與遠端 | 前項被報 local_only，可能再加另一 upload | F02 P2 |
| R08 | 合併舊收藏者 | 一次提交兩個已屬不同 track 的 source | PR #39 選第一個 track 並將其餘 source 併入 | F03 P2 |
| R09 | 乾淨安裝使用者 | 第一個動作是 library_status | PR #39 回 MISSING 而非建立空庫 | F06 P3 |
| R10 | 標準 dotenv 習慣 | KEY=value#comment | PR #38 把 #comment 當值 | F07 P3 |
| R11 | 備份匯入操作者 | 匯入可含重複 JSON key 的紀錄 | SQL 與 JS 對 state 採不同值 | F08 P3 |
| R12 | CI 維護者 | 破壞 child startup 以檢查快速失敗 | PR #36 九個測試可逐一等 10 秒 | F09 MAINTENANCE/P3 |
| R13 | 配額敏感使用者 | 大量分類與 playlist read/write | 官方 insert 每次 50 units；需保守重試 | 既有 #42；不建新儀表板 |
| R14 | 網路不穩使用者 | apply 中遇 5xx/timeout | default 有 reconciliation 語意；未真實 provider 驗證 | #4/#28；runtime pending |
| R15 | 取消操作使用者 | 中途取消搜尋或寫入 | timeout/cancel 已追蹤於 #6 | 不重複開單 |
| R16 | 同一 video 重試者 | 重跑相同 apply | exact ID 去重已有設計與測試 | Red Team：不是所有去重都壞 |
| R17 | 同曲不同版本收藏者 | 保留 live/cover/remix | canonical 去重不可吞版本 | #10 policy；F02 只修來源落盤 |
| R18 | 本地優先使用者 | 拒絕把 library 上雲 | SQLite/local credential 是差異化 | 保持 INVEST/SIMPLIFY |
| R19 | Spotify legacy 使用者 | 只讀或舊流程遷移 | YouTube-first 不代表必須擴張 Spotify | 維持 optional legacy |
| R20 | 無 CLI 使用者 | 由既有 MCP client 操作 | repo 無 bespoke UI；不證明 UI 缺陷 | UNKNOWN；不建 Web App |
| R21 | 螢幕閱讀器使用者 | 讀工具回應與下一步 | 需實際 client/AT 測試 | NEEDS_RUNTIME_VERIFICATION |
| R22 | 鍵盤使用者 | 完成 OAuth/browser 後回到 client | 未執行端到端可及性 | UNKNOWN |
| R23 | 手機使用者 | 用 mobile client 整理播放清單 | 產品未承諾 native app | DON'T：不建 App |
| R24 | 支援人員 | 依 credential_status 排錯 | F05 會提供錯誤來源標籤 | F05 P3 |
| R25 | 安全審查者 | 對錯誤注入秘密片段 | F01 可把尾段送回 caller | F01 P1 |
| R26 | 維護新手 | 依 Actions 綠燈判斷 | 綠燈跑到 tests，但未覆蓋反例 | 不能宣稱已修 |
| R27 | 資料恢復者 | 備份/還原本地 library | 既有 #17；本輪未重現 | 不重複開單 |
| R28 | 大量收藏者 | 批次保存後中斷 | #29/#30 已追蹤 | 不把 PR20 finding 重貼 |
| R29 | 分類編輯者 | 重新分類既有 track | #32 已追蹤 preservation | 無新 finding |
| R30 | 同步檢視者 | 只看 unsynced | #31 已追蹤 SQL filter；F08 是不同根因 | 分開 fingerprint |
| E01 | DJ／跨服務搬家 | 從 Spotify/YouTube Music 轉移整庫 | Soundiiz/Tune My Music 已涵蓋廣度 | 替代方案；不抄 multi-service breadth |
| E02 | 播放清單策展人 | 每日雙向同步 | 需要 queue/衝突/成本證據 | DEFER；非本產品核心 |
| E03 | 音樂部落客 | 分享 universal playlist | 競品已有；沒有本 repo demand | OPPORTUNITY/NOT_ESTABLISHED |
| E04 | 多帳號家庭 | 共享分類與播放清單 | 超出單 owner local-first | DON'T：accounts/collaboration |
| E05 | 離線使用者 | 無網路瀏覽既有 library | 本地庫可支持；遠端寫入不能 | 文件化邊界 |
| E06 | 隱私極高使用者 | 要求 token 不進任何回應 | F01 直接違反此信任邊界 | P1 pre-merge |
| E07 | 惡意錯誤提供者 | 錯誤訊息嵌入 secret=value suffix | 現 regex 尾段仍可見 | F01 adversarial regression |
| E08 | Windows 企業機 | 路徑含空格和反斜線 | quoted value 是常見必要輸入 | F04 P2 |
| E09 | Linux power user | 路徑不含反斜線 | 不受 F04 影響 | Red Team：平台受限 |
| E10 | 資料清理者 | 合併來源前核對 owner track | F03 應 fail-closed 或要求明確 merge | 最小修正，不建 entity-resolution 平台 |
| E11 | 同曲 metadata 不完整 | 遠端 item title 足以 canonical match | F02 需把 matched ID 掛到 existing track | 局部補丁 |
| E12 | 配額耗盡使用者 | insert 遭 403/429 | 不能把 quota failure 當 duplicate | 既有 #42；runtime pending |
| E13 | 競品切換者 | 期待 500+ tracks migration | 本產品定位是個人保存/整理，不是遷移 SaaS | DO NOT COPY |
| E14 | AI 分類愛好者 | 要求自動生成大量 playlists | 先保證 custody/idempotency | LATER |
| E15 | 開源貢獻者 | 想新增 Apple Music/TIDAL | 沒有產品授權與需求證據 | DON'T |
| E16 | 法遵審查者 | 要求 least-privilege scope | Google 建議增量授權與安全 token custody | 維持 scope/custody gate |
| E17 | SRE | 要求可重現 receipt | PR-head CI 綠燈只證明現測試集合 | 補決定性反例測試 |
| E18 | CFO | 擔心 API 配額與付費 | 先減少無效重試，不購買新服務 | NARROW |
| E19 | 成長角色 | 想用分享/社群擴張 | 與私密單人方向衝突 | PAUSE |
| E20 | 產品 owner | 只允許三件事 | 修秘密遮罩、資料身分/去重、Windows first success | CEO priority |

No Synthetic Preference Share is reported.

## Red Team

- Existing solution: default branch already has exact-video selection, PKCE/state, AES-GCM local credentials, exact-ID dedupe and conservative write receipts. The findings are not “missing a framework.”
- Smaller alternative: F01 is a value-boundary parser plus fixtures; F02 is one durable matched-source link; F03 is an all-source ownership preflight; F04 is preservation of unknown escapes.
- Wrong root: F01 does not imply the current default branch already leaks through the proposed central envelope; it is an unmerged regression risk.
- Counterevidence: PR #40 does prevent an immediate canonical duplicate. Its defect is that the successful decision is not durable for later sync; therefore P2, not P1.
- Counterevidence: PR #39 works when all sources are new or resolve to one track; only cross-owner input fails. Therefore no claim of general library corruption.
- Environment check: F04 primarily affects Windows/quoted backslash values. POSIX users without backslashes are not blocked.
- Test check: PR-head CI is genuinely green and reaches tests. That establishes no broad build failure, but the exact counterexamples are absent.
- Demand check: competitor migration breadth is not evidence for provider expansion, accounts, sharing, native apps or hosted sync.
- Scale check: one owner/local SQLite does not justify a graph database, generalized identity ledger, DLP service, cross-repo platform or new paid dependency.

## NOW / NEXT / LATER / DON'T

NOW:

1. Block PR #41 until complete zero-secret output regression fixtures pass.
2. Block PR #40/#39 until canonical matched identity and multi-source ownership are durable/fail-closed.
3. Block PR #38 until quoted Windows paths round-trip.

NEXT:

- Correct F05–F09 within their owning PRs without enlarging scope.
- Obtain new exact-head CI receipts and, after merge, rerun the same scenarios on default branch.
- Perform bounded real YouTube read/write/reconcile, Windows, client and accessibility verification in authorized environments.

LATER:

- #2 selected-video binding research, #17 backup/restore, #18 recommendation research, #34 concurrent idempotency.
- Optional export/handoff experiments only after demonstrated user demand.

DON'T:

- Do not add Apple Music/TIDAL providers, accounts, hosted sync, generic ledger, secret broker, migration dashboard, billing, native app, social/sharing or AI playlist marketplace.
- Do not treat Issues, review badges, CI green status, persona counts or this recommendation as implementation, merge, deployment, paid-service or external-write authorization.

## Decision memo

- Serve: one privacy-conscious owner using MCP to turn an exact YouTube find into a locally classified, safely deduplicated playlist save.
- Choose/compete: trust, local custody, exact identity and explainable receipts rather than service breadth.
- Differentiation: explicit preview/apply boundary plus local canonical model and bounded remote mutation.
- Top priorities: secret non-disclosure; durable identity/idempotency; Windows first success.
- Not doing: multi-service migration SaaS, collaboration, mobile, social, universal links, generalized AI recommendations.
- Risks: credential suffix exposure, contradictory local/remote identity, silent source ownership merge, platform-specific config corruption, quota/recovery gaps.
- Experiments: adversarial secret fixtures; canonical-match-then-sync; cross-owned source preflight; Windows path round-trip; authorized provider reconcile.
- Recommendation: INVEST / SIMPLIFY / MAINTAIN. Preserve the YouTube-first wedge; block active PRs until their stated contracts are true.

## Mapping, locks, regression and accounting

| Finding | Tracking | Write action |
|---|---|---|
| F01/F05 | Issue #3 + PR #41 threads | SKIPPED_LOCKED |
| F02 | Issue #10 + PR #40 thread | SKIPPED_LOCKED |
| F03/F06 | Issue #9 + PR #39 threads | SKIPPED_LOCKED |
| F04/F07 | Issue #23 + PR #38 threads | SKIPPED_LOCKED |
| F08 | Issue #31 + PR #37 thread | SKIPPED_LOCKED |
| F09 | Issue #4 + PR #36 thread | SKIPPED_LOCKED |

No new Issue is appropriate: each finding has an active owner branch and precise unresolved review. No owner rejection was overridden.

- New findings: 9.
- Severity: P0 0 / P1 1 / P2 3 / P3 5 / NOT_ESTABLISHED 0.
- New Issues 0 / updated Issues 0 / reopened Issues 0.
- Duplicate avoided: 9/9.
- Verified fixed: 0.
- Default-branch regression: not claimed; findings are PR-head only.
- CANNOT_VERIFY: real Google OAuth/YouTube mutation, Windows startup, deployment, production credentials, browser/mobile and assistive technology.
- Portfolio CLEAN: NOT CLEAN, 0/2; fixed A01–J05 stopping conditions and runtime gaps remain.
- Issue/PR write blocked: 0; skipped due active ownership.
- Product code, branch, merge, deploy, settings/secrets, GOAL/worker changes: 0.
- Report write target: unique central delta; must be read back before completion.
