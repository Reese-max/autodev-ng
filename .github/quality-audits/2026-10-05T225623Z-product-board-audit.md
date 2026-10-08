# Product Board Audit — 2026-10-05T22:56:23Z

## 結論與範圍

- 狀態：**PARTIAL / NOT CLEAN**。本輪重新完整分頁列舉 Reese-max 自有 repositories（45 total／44 active／1 archived），核對上一份 `2026-10-05T19:58:38Z` 報告後的 default-branch commit，並深讀公平游標 `police-essay-mcp` 的 README、規格、manifest、核心 source／tests、近期 commits、全部 branches、所有狀態 Issues／PR、完整可見 comments、CI／status 與既有固定 A01–J05 報告。
- 上輪後 44 個 active repositories 的 default branch 均未前進；最近產品 commit 仍早於上一份報告。不把 audit-only branch 前進當產品變更。
- `police-essay-mcp@2cf3da1cc1d58b8dc3cfb4c29a0db98a4b914e83` 的 exact-main Actions run [37261052913](https://github.com/Reese-max/police-essay-mcp/actions/runs/37261052913) 成功：Node 20／22 均執行 checkout、`npm ci`、typecheck、tests、build；Node 20 另執行 LibreOffice／Poppler／Noto CJK render regression。
- 新 actionable finding 0；新 Issue 0；Issue 更新／重開 0；產品／CI／設定寫入 0。既有 #1 保持 runtime acceptance pending；#3 的原單一 process／獨立 HTTP client 並行覆寫情境具 exact-main regression receipt；#4 的 MCP artifact contract 與同名輸出競態具 exact-main regression receipt，但真實 ChatGPT connector handoff 仍待實測。
- 下一公平游標：`Reese-max/police-exam-archive`。

## 規則、inventory 與證據版本

- Issue Quality v2：blob `8167e10798071d2276addaff6b201c6b0e904a2a`。
- 固定 A01–J05 protocol：blob `6e3499d6ef5be7e123050e1526946f6a40f99263`。
- autodev-ng default HEAD：`69a206738e37896cdc4341e52c2905869f648985`。
- 本輪寫入前 audit branch HEAD：`886d7b5ed8b8c961f94da83586951303cb118ca1`；既有 Draft PR [#154](https://github.com/Reese-max/autodev-ng/pull/154) 無 issue/review comments，branch 精確列舉僅一筆且下一頁為空。
- police-essay-mcp default HEAD：`2cf3da1cc1d58b8dc3cfb4c29a0db98a4b914e83`。
- README `541f7f25308f93b90eff5f3feedb854e6a9e6781`；SPEC `1e4ee2026b619f61213e740bfc6427d106a2066a`；package `95537008f2cda3c8947817a5fdf007c883cd3543`；CI `400c1785d730654561005acde466310a7e0f2ec5`。
- Source：`src/index.ts` `fed5d3c584cd76a6f652b9a82c6d77d86e6e1868`；`src/server.ts` `26738a23ebed5d0ae68d4e434683abd23cd8a775`；`src/storage.ts` `482d5bf418509ae38efa16040b0a0206cae6e6bf`；`src/layout.ts` `4d6e6d0a1a68f81519eac16e0e9afdfe81e21b1d`。
- Tests：layout `d4d50410689ea1e77a7142711c1fda16680b5120`；HTTP MCP `a6e901cdc208b10ba7dfb7dce5b69406f022b82f`；HTTP security `206d43b254f3d56c70e6a7992505c57e1cb49949`。
- Evidence：SOURCE_CONFIRMED + hosted exact-main EXECUTED_REGRESSION。沒有公開 tunnel、真實 ChatGPT connector、正式答案、Windows Word、手機／screen reader、列印、長期 soak 或 production deployment 實測。

Active 44：exam-archive、police-exam-practice、police-exam-archive、92-duty-scheduler、UkePack、ppt-studio、voice-actress、taiwan-intel-dashboard、autodev-ng、flux-image-gen、claude-mem、lobsterpulse、prompt-autoresearch、neciken-summer-poem、note-filler、adng-memory、cyber-prep-coach、cf-ai-router、avatar-vfo、project-doctor-web、minideck、chatgpt-dual-pipeline、taichung-police-intel、soundbox-offline、skill-foundry、video-timeline-pipeline、ai-novel-workstation、clinical-scribe-worker、MaterialYouNewTab、cf-mcp-server、tick-stock-panel、herdr-skills、ninax-line-hermes、ai-flight-radar、academic-mcp、spotify-playlist-organizer-mcp、google-maps-personal-mcp、travel-planning-mcp、octobroker、openab、police-essay-mcp、openab-pty、travel-planning-app、studio。Archived/excluded：`obsidian-vault`（內容庫；保留 inventory，不因沒有 app/CI 硬開缺陷）。

## police-essay-mcp discovery

- 產品方向：local-first 的臺灣警察／公務申論文件引擎；authoritative 版面計算為 A4 兩頁、每頁 22 行、總容量 44 行，支援 section／paragraph 局部編修、版本守衛與 DOCX/PDF/TXT。
- HTTP 預設 owner Bearer token；無 `MCP_AUTH_TOKEN` 時拒絕啟動，只有顯式 `MCP_ALLOW_ANONYMOUS_LOOPBACK=true` 才允許純本機匿名；read token 無 create/mutate/delete/export 或 artifact-read 權限。
- 匯出現在回傳 opaque UUID `essay://exports/{handle}`、MIME、answer/version 與 24 小時 expiry；owner client 可用 `resources/read` 取得 bytes。對 malformed／unknown／expired／traversal handle fail closed。
- `FileStore` 以 answerId 串行化 mutation、在鎖內重讀與比較 `expectedVersion`；以 output path 串行化 render + immutable artifact copy，避免同檔名並行輸出交叉取錯 bytes。
- branches 完整分頁共 8：main、6 個已合併工作 branch、以及 `feat/answer-sheet-widget`。Issues：open #1/#2、closed #3/#4。PR：open Draft #5；closed merged #6–#11。沒有未釋放的 Issue lease。
- Draft PR [#5](https://github.com/Reese-max/police-essay-mcp/pull/5) 是 2026-09-21 的 interactive answer-sheet canvas WIP，沒有追蹤 Issue、沒有真實 MCP client runtime，且不是 current default。它是 owner-controlled candidate，不是本輪可接管的缺陷或實作授權。

## 既有 findings 與回歸判定

### #1 remote HTTP owner authentication — PARTIALLY_FIXED / NEEDS_RUNTIME_VERIFICATION

- Tracker：[police-essay-mcp#1](https://github.com/Reese-max/police-essay-mcp/issues/1)，`BUG / P1 / HIGH_BEFORE_REMOTE_USE / NEEDS_REVIEW / auto_implementation=false`。
- 原始 default-loopback + tunnel 無 token 路徑已由 current source fail closed；focused HTTP security tests涵蓋 no-token startup、missing/wrong bearer、owner/read scope、CORS、explicit anonymous loopback 與 stdio，且 exact-main suite成功。
- 尚缺：真實 HTTPS tunnel／ChatGPT connector 是否每次轉送 owner credential，以及 missing／invalid／read-only／owner 四種 credential 的隔離 receipt。這是 acceptance 證據缺口，不是 current source 已重現的原始越權路徑；不重貼相同 Issue comment。

### #3 expectedVersion overlap — VERIFIED_FIXED（原範圍）

- Tracker：[police-essay-mcp#3](https://github.com/Reese-max/police-essay-mcp/issues/3)（closed）。
- current tests以兩個獨立 HTTP MCP clients 競逐相同 `expectedVersion`：每輪只接受一個 writer、另一個收到 conflict，winner 保持 version 2，且第三 client 可更新不同 answer。source 另有同 answer atomicity／不同 answer isolation barrier tests。
- exact-main run 37261052913執行完整 suite成功；因此原本單一 server process 的 lost-update fingerprint為 VERIFIED_FIXED。未宣稱跨 process／distributed storage。

### #4 remote artifact retrieval — VERIFIED_FIXED（adapter contract）/ NEEDS_RUNTIME_VERIFICATION（ChatGPT client）

- Tracker：[police-essay-mcp#4](https://github.com/Reese-max/police-essay-mcp/issues/4)（closed）。
- owner HTTP SDK client可 export DOCX/PDF/TXT、read opaque resource、逐 bytes 比對 server file；tests覆蓋 MIME、answer/version、expiry、unauth/read-token denial、unknown／traversal handle。PR #11又重現並修正同檔名並行輸出交叉 bytes，current exact-main suite成功。
- 這足以驗證 MCP adapter contract與同 process並行；未曾用真實 ChatGPT connector下載，故 client acceptance保持 NEEDS_RUNTIME_VERIFICATION，尊重 owner closure且不重開。

### Evidence backlog（不開單）

- artifact manifest／bytes只有在 client讀取過期 handle時才刪除；沒有 startup／new-export sweep。這是 SOURCE_CONFIRMED 的 `MAINTENANCE / P3 candidate`，但沒有 owner export頻率、磁碟增長或支援事件證據；現有本機 export dir亦可由 operator管理。最小實驗是產生多個過期 artifact後重啟／再 export並量測清理與磁碟，不先建立 cleanup service或 quota framework。
- 真實 Word／LibreOffice／手機／screen reader／列印的 44-line等價、CJK fallback與長期 soak仍缺證據；缺證據阻止 CLEAN，但不自動等於產品壞掉。
- PR #5 widget沒有 owner核定問題陳述或 runtime；維持 NEEDS_REVIEW／不併入前三優先。

## 外部競品／替代工作流

官方頁查閱：2026-10-05 UTC（2026-10-06 Asia/Taipei）。頁面未提供明確發布／更新日者標 `UNKNOWN`；功能頁是 vendor claim，不是獨立效果證據。

| 對象 | 官方現況／日期 | 對本產品的訊號 | 判定 |
|---|---|---|---|
| ChatGPT writing blocks | editable draft、selected/full revision、full-screen、undo/redo、Library保存；頁面日期 UNKNOWN，查閱 2026-10-05 | SHOULD BE BETTER：局部修改／可逆；DIFFERENTIATOR：authoritative 44-line + export receipt | CONFIRMED — https://help.openai.com/en/articles/20001246-working-with-writing-blocks-and-code-blocks-in-chatgpt |
| Google Docs + Gemini | draft/refine、引用 Drive/Gmail/web、逐項 accept；頁面日期 UNKNOWN，查閱 2026-10-05 | MUST MATCH：review-before-apply；DO NOT COPY：workspace breadth | CONFIRMED — https://support.google.com/docs/answer/13447609 |
| Microsoft Word + Copilot | desktop/Mac/iPad內 draft、rewrite/refine、引用工作內容；頁面日期 UNKNOWN，查閱 2026-10-05 | MUST MATCH：DOCX handoff；SHOULD BE BETTER：exam-specific deterministic capacity | CONFIRMED — https://support.microsoft.com/en-us/word/welcome-to-copilot-in-word |
| Notion AI | inline improve writing、Agent page/database edits、downloadable files；頁面日期 UNKNOWN，查閱 2026-10-05 | DIFFERENTIATOR：不做 workspace/DB；只做窄 exam document truth | CONFIRMED — https://www.notion.com/help/notion-ai-faqs |
| Canva Docs + Magic Write | visual-first docs、AI writing、PDF/DOCX export；頁面日期 UNKNOWN，查閱 2026-10-05 | DO NOT COPY visual suite；MUST MATCH可靠 artifact handoff | CONFIRMED — https://www.canva.com/docs/ ; https://www.canva.com/spell-checker/ |

- MUST MATCH：清楚 review/apply、可逆局部修改、可取得的輸出、mobile/desktop handoff、權限與隱私邊界。
- SHOULD BE BETTER：固定臺灣申論答題紙、authoritative capacity、可追蹤 version/layout、無須大型 workspace。
- DIFFERENTIATOR：同一 answer snapshot綁定 layout與 artifact receipt；需真實 client runtime才能對外主張。
- DO NOT COPY：通用 team workspace、資料庫、品牌設計套件、generic LMS／grading、enterprise IAM或更多 AI provider。

## Product Board 多視角推演

- CEO：只做三件事——取得 #1/#4 真實 connector acceptance、保持 exact 44-line/render regression、確認是否真的要 PR #5 widget。不做 LMS、評分、cloud sync、generic editor。
- CPO：核心不是「更多 AI 寫作」，而是 exam-specific authoritative layout + safe handoff；未證實 widget能改善 first success。
- CTO／Staff Engineer：current lock/resource設計已是小而足夠；不引入 DB、distributed lock、artifact service。若 retention實測成立，只需 bounded sweep。
- UX Lead／Researcher：競品讓 inline review與可逆編修成為基線；但 50 persona仍是模型推演，不能取代考生觀察。
- Growth：沒有 acquisition、switching或真人偏好證據；不以 competitor feature開單。
- CFO：現有 local Node/FileStore足夠；沒有 ROI支持 hosted renderer、object storage或多租戶。
- Security／Privacy：owner/read scope與 opaque handle方向正確；public tunnel仍須真實 credential receipt。
- QA：#3/#4原情境有 exact-main receipt；必須保留 same-name artifact、44/45-line、auth negative tests。
- SRE：run 37261052913成功但不是 deployment；artifact expiry retention需量測才升級。
- Accessibility：structured text有利，但 Word/PDF/phone/screen-reader未實測，保持 UNKNOWN。
- Support：可說 current adapter能取回 artifact；不可說 ChatGPT connector已驗收或所有 viewer都兩頁。
- 分歧：UX想先試 widget；Security/SRE主張先關閉真實 connector證據。決策：先驗證既有 supported path，widget保持 Draft。

## 50 合成 Persona（30 回歸／20 探索）

這是模型多視角推演，不是真人、票數、發生率、營收或優先級證據；與固定 A01–J05 audit分開。

| ID | 背景／限制 | 目標／期待與旅程 | 摩擦／結果 | 分級／建議／證據 |
|---|---|---|---|---|
| P01 R | 警察三等考生；時間短 | 題目→分段→44行→PDF | authoritative layout可用 | MAINTAIN；SOURCE+CI |
| P02 R | 手機考生；無主機檔案 | ChatGPT→export→下載 | 真 connector未驗 | NRV；runtime |
| P03 R | Windows Word使用者 | DOCX開啟列印 | CI LibreOffice非 Word | NRV；viewer test |
| P04 R | macOS使用者 | PDF中文兩頁 | CJK viewer未實測 | NRV；renderer |
| P05 R | CLI熟悉維護者 | stdio create/edit/export | local path完整 | MAINTAIN；SOURCE |
| P06 R | 非技術考生 | 照 README首次成功 | token/tunnel設定仍技術性 | P3 UX；不開單 |
| P07 R | 低視力使用者 | 200% zoom讀成品 | 無 viewer receipt | NRV；a11y |
| P08 R | screen-reader使用者 | 讀 structured answer | API文字有利、artifact未知 | NRV；a11y |
| P09 R | 輪班使用者 | 跨裝置續寫 | server/client continuity未驗 | NRV；runtime |
| P10 R | 公務教師 | 多答案list/reopen | file persistence存在 | MAINTAIN；SOURCE |
| P11 R | 精準版本使用者 | 重送相同 edit | conflict可重讀 | VERIFIED；HTTP test |
| P12 R | 並行client使用者 | 兩個client同時改 | 一勝一 conflict | VERIFIED_FIXED #3 |
| P13 R | 不同答案編修者 | A卡住時改B | per-answer isolation | VERIFIED_FIXED #3 |
| P14 R | 同檔名輸出者 | 兩答案同時export | bytes不再交叉 | VERIFIED_FIXED #4 |
| P15 R | read-only reviewer | 只讀不可export | scope拒絕寫／artifact | VERIFIED；security test |
| P16 R | tunnel operator | owner bearer連線 | 真 tunnel未驗 | #1 NRV |
| P17 R | 錯誤token使用者 | 在tool前被拒 | focused test涵蓋 | VERIFIED adapter |
| P18 R | 離線使用者 | 無付費服務完成核心 | local core可用 | MAINTAIN；SOURCE |
| P19 R | 恢復導向使用者 | crash後reopen | restart path未執行 | NRV；bounded test |
| P20 R | 44行邊界使用者 | 44 fit／45 overflow | regression存在且CI通過 | VERIFIED |
| P21 R | 格式細修使用者 | 改單段縮排不重送全文 | format_section可用 | MAINTAIN；SOURCE |
| P22 R | 預覽導向使用者 | diff/layout後才apply | preview tools存在 | MAINTAIN；SOURCE |
| P23 R | PDF使用者 | 中文格線輸出 | Linux render通過 | VERIFIED scoped |
| P24 R | TXT使用者 | exact換頁文字 | resource bytes比對 | VERIFIED scoped |
| P25 R | 支援人員 | 解釋找不到answer | structured error存在 | MAINTAIN；SOURCE |
| P26 R | 隱私 reviewer | 無權者不得讀artifact | owner-only test通過 | VERIFIED adapter |
| P27 R | QA | current HEAD重跑全部suite | Node20/22成功 | VERIFIED CI |
| P28 R | SRE | health/ready/auth | source/tests完整 | VERIFIED scoped |
| P29 R | owner | 控制 scope與成本 | widget無需求證據 | DEFER/REVIEW |
| P30 R | auditor | 判斷CLEAN | #1/runtime/a11y未完成 | NOT CLEAN |
| P31 E | 長期高頻export | 每天多次產檔 | expired bytes無主動sweep | P3 candidate；量測 |
| P32 E | 磁碟受限主機 | 跑一月後查space | 頻率／成長未知 | NEEDS_EVIDENCE |
| P33 E | 多process部署者 | 共享FileStore | locks僅process-local | OUT OF SCOPE；勿擴建 |
| P34 E | 惡意filename輸入 | traversal／alias | allowlist + realpath | VERIFIED scoped |
| P35 E | expired-link使用者 | 24h後讀取 | generic not-found並清理該handle | VERIFIED scoped |
| P36 E | ChatGPT writing-block使用者 | inline編修後轉答題紙 | 通用draft無44行truth | DIFFERENTIATOR |
| P37 E | Google Docs使用者 | 引用資料再濃縮 | source grounding非本產品核心 | DON'T COPY |
| P38 E | Word Copilot使用者 | Word內draft/rewrite | familiar UX強，exam guard弱 | SHOULD BE BETTER |
| P39 E | Notion使用者 | page/database工作流 | breadth超出 owner規模 | DON'T COPY |
| P40 E | Canva使用者 | 視覺稿→PDF/DOCX | visual-first非考卷truth | DON'T COPY |
| P41 E | widget倡議者 | 在MCP client拖拉編修 | PR #5無runtime／issue | NEEDS_REVIEW |
| P42 E | 鍵盤-only使用者 | 不用pointer完成 | API可行、widget未知 | NRV；a11y |
| P43 E | 紙本列印者 | 真實印表機保持44行 | 未執行 | NRV；print |
| P44 E | 低頻考生 | 一次性安裝 | token setup可能阻礙 | P3 UX evidence backlog |
| P45 E | 補習班教師 | 批次多份答案 | multi-user/batch未核定 | DEFER；勿擴建 |
| P46 E | 合規管理者 | retention／刪除證據 | answer/export retention未完整定義 | P3 research |
| P47 E | 低速網路client | response loss後重試 | authoritative re-read可用；未注入失敗 | NRV |
| P48 E | 斷電情境 | render中中斷 | temp/manifest cleanup局部 | NRV；failure injection |
| P49 E | 新貢獻者 | 看Issue/PR判斷狀態 | #1/#2 + Draft #5界線清楚 | MAINTAIN |
| P50 E | Red Team challenger | 推翻前三優先 | runtime證據比新UI更小更必要 | KEEP PRIORITY |

未產生 Synthetic Preference Share；沒有用 persona數量替代證據與分級。

## 固定 A01–J05 checkpoint（不替代上表）

- protocol blob不變；既有 Round 1／Round 2完整矩陣均在舊 product SHA。current SHA已修正當時 #1/#3/#4的 source／adapter範圍，但本輪沒有真實 ChatGPT connector、Word、手機／窄螢幕、screen reader、列印與 soak。
- 依固定停止條件，current repo不能標 CLEAN：#1仍 open且缺必要 external acceptance；current SHA尚無兩個連續完整合格輪次；device／runtime證據不完整。
- 本輪只是 current evidence reconciliation，不冒充第三個完整合格 fixed-50 round。Consecutive qualifying CLEAN rounds仍 `0/2`。

## Red Team

1. 綠色 exact-main CI是否等於真實 ChatGPT流程全通？否；只證明 workflow實際執行的 source/tests/render fixture。
2. #1 source已 fail closed是否應直接關單？否；Issue成功條件要求真實 tunnel/connector credential receipt，仍未取得。
3. #4 closed是否表示所有client已驗？否；SDK adapter contract已驗，ChatGPT client仍 NRV；但沒有新反證推翻 closure，不重開。
4. expired artifact未主動掃除是否應立即開 P2？否；source路徑成立但頻率、磁碟影響、owner使用量未建立，只保留 P3 maintenance實驗。
5. 競品都有 inline AI editor是否表示缺widget？否；PR #5尚無真人需求、runtime或核定方向，且現有 structured tools可完成局部編修。
6. 44/45-line unit/integration test是否等於 Word/手機/列印等價？否；缺外部 viewer evidence。
7. 8 branches是否代表需要清理？否；多數是已合併歷史 branch，branch存在不構成使用者失敗；不大量刪除。
8. 能否宣告portfolio CLEAN？否；公平輪巡、固定兩輪、runtime與歷史 continuity均未完成。

## NOW / NEXT / LATER / DON'T

- NOW：取得 #1/#4真實 ChatGPT connector／tunnel isolation receipt；不改產品即可先驗證現行 contract。
- NOW：維持 current 44/45-line、auth、independent-client edit與same-name export tests為 regression gate。
- NEXT：owner決定 PR #5是 BUILD／NARROW／REJECT；沒有核定前不併入產品方向。
- NEXT：用 bounded fixture量測過期 artifact跨restart／new-export後的磁碟行為；只有影響成立才開 maintenance Issue。
- LATER：Word、手機、screen reader、print與soak evidence；不把缺證據升成P2。
- DON'T：不建 LMS、grading、cloud sync、generic editor、DB、distributed lock、object storage、artifact platform或enterprise IAM；不啟動 worker/GOAL、不merge/deploy、不修改產品/CI/config/settings。

## Decision Memo

- 服務誰：需要把臺灣警察／公務申論答案控制在固定兩頁並安全取得可列印檔案的單一考生／owner。
- 選擇／競爭：不與 Word/Docs/Notion/Canva比通用 breadth；選 exam-specific authoritative layout、versioned local truth與MCP artifact receipt。
- 差異化：44-line capacity與answer/version/layout/artifact可追溯；在真實 connector未驗前只作內部主張。
- 前三優先：(1) 真實 connector auth／artifact acceptance；(2) 保持已修 concurrency/layout regressions；(3) owner決定 widget，不先做。
- 不做／刪除：不新增 generic AI writer、多人 workspace、評分／題庫、cloud storage、mobile app或新服務；PR #5若無核定需求可關閉／封存，但此報告不代 owner操作。
- 風險／實驗：最大風險是把 SDK/CI外推成 client/deployment。最小實驗是隔離 temporary dirs + 真實 client四種credential與三種artifact，不用正式資料或public anonymous tunnel。
- Portfolio recommendation：`police-essay-mcp=INVEST in verification / MAINTAIN narrow product / SIMPLIFY scope`；不是 MERGE/ARCHIVE。完整 portfolio ranking等待全輪巡完成。
- 建議不是實作、merge、部署、付費或外部寫入授權。

## Findings、追蹤與 write ledger

| 類型 | 數量 | 結果 |
|---|---:|---|
| New actionable finding | 0 | artifact retention只到P3 evidence backlog；widget沒有核定問題 |
| New Issue | 0 | 無 |
| Existing Issue update/reopen | 0 | 無實質新狀態需要重複留言 |
| Deduplicated/rejected | 6 | #1/#3/#4沿用原單；widget、retention、viewer evidence不硬開 |
| Verified fixed | 1 | #3原 single-process/independent-client overlap scope |
| Scoped verified + runtime pending | 1 | #4 adapter contract verified；ChatGPT client NRV |
| Product/CI/config write | 0 | 無 |
| Issue lease | 0 | 無 Issue mutation，不取得鎖 |
| Audit report | 1 | 本檔，existing audit-only Draft PR #154 branch |
| Write blocked | 0 | 無 |

## 未完成、游標與 CLEAN

- police-essay-mcp runtime pending：真實 tunnel/ChatGPT credentials與artifact download、Word、mobile/narrow、screen reader、print、restart/soak、artifact retention量測。
- Next fair active repository：`Reese-max/police-exam-archive`。
- Portfolio ranking：未做；完整公平輪巡尚未完成。
- CLEAN：**NOT CLEAN / PARTIAL**。不停止 recurring audit。
