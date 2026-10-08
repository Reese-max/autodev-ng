# Product Board Audit — 2026-10-06T04:56:38Z

## 結論與範圍

- 狀態：**PARTIAL / NOT CLEAN**。已完整分頁核對 Reese-max 自有 inventory（45；44 active、1 archived）、所有 active repo 的 default branch/HEAD、上一輪後的變更、品質規則與公平游標；本輪深讀 `police-exam-practice`，並插隊回歸剛進 default 的 `police-exam-archive` #74/#75。
- 公平游標：本輪完成 `Reese-max/police-exam-practice@7a8eb98765d3d96e77130be886be59884f57087f`；下一個為 `Reese-max/exam-archive`。
- 新 actionable finding / 新 Issue / 重開：**0 / 0 / 0**。沒有為功能數或報告配額造工作。
- 狀態轉換：`police-exam-practice#3` 與 `police-exam-archive#74/#75` 均有修正進 default 且 exact-head CI/Pages 成功，但缺部署站的原始 no-JS/offline browser 重跑，故保守分類 **PARTIALLY_FIXED / NEEDS_RUNTIME_VERIFICATION**，不宣稱 `VERIFIED_FIXED`。
- Issue 寫回：**SKIPPED_LOCKED**。`police-exam-practice#3` 仍有 open PR #4–#7；`police-exam-archive#74/#75` 仍有多張 open duplicate/overlapping PR 與 branches。依互斥規則不取得 lease、不留言、不關單、不搶 scope；證據只寫本中央唯一時間戳報告。
- 產品實作、CI/config、branch、merge、deploy、worker/GOAL：**0**。

## 依據與證據版本

- Issue quality v2：`Reese-max/autodev-ng/docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- 規則 blob：`8167e10798071d2276addaff6b201c6b0e904a2a`
- 中央報告 branch：`audit/product-board-20261005T081500Z`；寫入前 head `ca3ca0d7d3290cffdaa1d5bfa97188c749043aed`；Draft PR #154。
- 證據等級：repo source/metadata 與 GitHub Actions 為 `SOURCE_CONFIRMED`；確實執行的 exact-head job 為 `EXECUTED_REPRODUCTION`。公開 GitHub Pages URL 的 read-only web fetch在本環境不可達，因此 deployed no-JS/offline browser為 `UNKNOWN / NEEDS_RUNTIME_VERIFICATION`。
- 本輪沒有把 README、測試存在、單一綠燈或 deployment success冒充所有 runtime 路徑已通過。

## 完整 inventory 與增量 Discovery

Archived/excluded：`Reese-max/obsidian-vault`（archived、內容庫；保留 inventory，不操作且不因缺產品表面硬開缺陷）。其餘 44 個 active repositories 均解析 default ref：

| Repo | default HEAD | Repo | default HEAD |
|---|---|---|---|
| exam-archive | `13519bbe4e75` | police-exam-practice | `7a8eb98765d3` |
| police-exam-archive | `9c8ae4bb4f2c` | 92-duty-scheduler | `127f5e784be0` |
| UkePack | `718d021f0147` | ppt-studio | `d5e478933c4f` |
| voice-actress | `a10c97ffc4ca` | taiwan-intel-dashboard | `df7cee191aa5` |
| autodev-ng | `69a206738e37` | flux-image-gen | `dfadcf30ca1d` |
| claude-mem | `3ed5439ff683` | lobsterpulse | `41e09eb922a3` |
| prompt-autoresearch | `6527919ed725` | neciken-summer-poem | `d54daa398673` |
| note-filler | `7e29811376ec` | adng-memory | `ae7246dfc480` |
| cyber-prep-coach | `ffc7bbbb2837` | cf-ai-router | `74c52130046a` |
| avatar-vfo | `8c578febb49a` | project-doctor-web | `d70c383fbce4` |
| minideck | `31f7131ae24a` | chatgpt-dual-pipeline | `747fd8a59f78` |
| taichung-police-intel | `2c660cef6f1b` | soundbox-offline | `d58d73ad6a8e` |
| skill-foundry | `17e90d852740` | video-timeline-pipeline | `46a117d960c3` |
| ai-novel-workstation | `4ea76d73b670` | clinical-scribe-worker | `4b883036c8ec` |
| MaterialYouNewTab | `7d32f2f460cc` | cf-mcp-server | `fb1a248fb2b2` |
| tick-stock-panel | `39c8e20c8216` | herdr-skills | `e706aa28db43` |
| ninax-line-hermes | `f820dfad1d31` | ai-flight-radar | `772deb8a25d6` |
| academic-mcp | `99f66db6851d` | spotify-playlist-organizer-mcp | `47eed58f219f` |
| google-maps-personal-mcp | `2f3c45209ef7` | travel-planning-mcp | `ec3054d693bd` |
| octobroker | `b669101c0ef4` | openab | `50424ed46177` |
| police-essay-mcp | `2cf3da1cc1d5` | openab-pty | `9e1464058335` |
| travel-planning-app | `dd5081dfee74` | studio | `0f1b62d3c543` |

上一輪後兩個 default HEAD 有產品變更：

1. `police-exam-archive`：`a0b5dbb...` → `9c8ae4bb...`，PR #77 於 2026-10-06 02:39:51Z 合併。exact-head CI run 37405226132、Data Quality 37405226127、Pages 37405226137 均成功；詳見回歸章節。
2. `taichung-police-intel`：`63fce55...` → `2c660cef...`；Verify PRs 37412166541、refresh/deploy 37412166789、source egress 37410450212 均成功。沒有新 P0/P1/confirmed regression，因此只記增量，留待公平輪巡。

其他 default refs未變；audit-only提交不視為產品修正。完整 Portfolio Ranking 延後到公平 inventory輪巡完成後。

## Fair target：police-exam-practice

### 產品邊界與實際檔案

- repo是已退役練習站的 legacy URL compatibility entry，功能與資料已合併至 `police-exam-archive`；README 明示不得複製題庫或在此擴建產品。
- tree僅 16 entries。`index.html` 無外部 scripts/styles；JS以 `location.replace()` 將 query/hash原樣帶到 canonical quiz；無 `<meta refresh>`；`<noscript>` 明示不能自動保留狀態、需在 canonical quiz重新選擇。
- `fusion-manifest.json` 誠實區分 `javascript_redirect=true`、`no_javascript=false`；embedded question bank=false。
- `tests/test_fusion.py` 12項檢查涵蓋體積、無題庫、canonical一致、JS preserve、禁止 meta refresh、no-JS recovery、README scope、可見連結、noindex、允許連結、無外部依賴與 manifest/README一致。
- workflow僅在 push/PR 跑 Python 3.12 compatibility suite；exact-head run 37253807658 的 `Validate consolidated entry` 成功。Pages run 37253806848 build/deploy成功。
- all-state：Issue #3 closed/completed；PR #8 merged到 exact default。open duplicate PR #4/#5/#6/#7仍存在；branches完整10個，第二頁為空。autodev-ng查無該 Issue 的 active goal/heartbeat；但上述 active PR/branches足以觸發 `SKIPPED_LOCKED`。

### #3 回歸分類

fingerprint：`police-exam-practice + compatibility redirect + JavaScript unavailable + query/hash silently dropped + preservation implemented only in inline JS while static fallback is parameterless`。

- **CONFIRMED / SOURCE_CONFIRMED**：default已移除 parameter-dropping meta refresh，加入 truthful noscript recovery，README/manifest限定保證範圍，測試會阻止回歸。
- **EXECUTED_REPRODUCTION（鄰近）**：exact default compatibility suite與Pages deployment成功；既有 merged-candidate前的真 browser no-JS證據不能自動當本 SHA證據。
- **UNKNOWN**：本輪無法在 deployed Pages以 JavaScript-disabled browser實際確認「無 timed redirect、訊息可見、連結可操作」；公開URL lookup在此環境被拒。
- 結論：**PARTIALLY_FIXED / NEEDS_RUNTIME_VERIFICATION**。Issue保持 owner既有 completed決策，不因缺runtime自動重開；在原情境真正重跑前不計 `VERIFIED_FIXED`。

## 插隊回歸：police-exam-archive #74 / #75

- default `9c8ae4bb4f2c82617819b1842b1b7e76d224a5a1` 是 PR #77 merge commit；#74/#75仍 open。
- #74 source acceptance：Analytics只載入 SHA-256標記的單一 code/data bundle；service worker只 promotion/fallback完整bundle，舊split routes fail closed。
- #75 source acceptance：Chart.js 4.4.1改為same-origin vendored asset，納入 core precache。
- exact-default CI 37405226132：`analytics-offline-browser` job安裝 Chromium並成功執行 `Verify first offline Analytics visit`；Python 3.10/3.11/3.12各自成功執行 `Verify atomic Analytics pair failover`、generated frontend freshness與JS syntax。
- exact-default Data Quality 37405226127 success；Pages 37405226137成功重建、驗證與deploy。
- **限制**：瀏覽器job使用test origin失聯模型；沒有本輪 deployed Pages offline/upgrade sequence或OS-level offline receipt。故 #74/#75均為 **PARTIALLY_FIXED / NEEDS_RUNTIME_VERIFICATION**，不是 `VERIFIED_FIXED`。
- 互斥：#74仍有 open PR #78/#85/#91/#92等與branches；#75仍有 #76/#79/#84/#90/#93等與branches。最早有效 lock不存在，但 active ownership足以 `SKIPPED_LOCKED`；未留言、未關單、未改scope。

## 外部競品、替代工作流與遷移 benchmark

查閱日：2026-10-06。官方頁未顯示更新日者標 `UNKNOWN`；外部宣稱不作本產品效果或收益證據。

| 對象 | 類型 | 現況／日期 | 訊號 | 判定 |
|---|---|---|---|---|
| `police-exam-archive` canonical quiz | 內部替代／正式承接面 | default `9c8ae4bb`，2026-10-06 merge/deploy | legacy shell只需可靠轉接；題庫、搜尋、analytics全部留canonical | CONFIRMED |
| 考選部115年警察考試試題 | authoritative source | 官方2026考試頁與試題答案，查閱2026-10-06 | MUST MATCH provenance與答案狀態；不是UX競品 | CONFIRMED — https://wwwq.moex.gov.tw/exam/wFrmExamQandASearch.aspx?e=115060&y=2026 |
| 阿摩線上測驗 | 直接競品／社群題庫 | 公開頁已有115年警察題目；頁面更新日UNKNOWN | canonical product應比社群來源更可追溯；不在legacy shell複製功能 | COMMUNITY_SIGNAL — https://yamol.tw/latest-1783478601.htm |
| Quizlet | 通用學習替代 | Plus/Family與practice工具；TOS 2026-05-28更新 | mobile/general learning breadth存在；DO NOT COPY帳號、訂閱、generic AI到compat repo | CONFIRMED — https://quizlet.com/upgrade |
| Anki / AnkiWeb | 離線／跨裝置替代 | 官方頁查閱2026-10-06；免費AnkiWeb同步、桌面/行動client | SHOULD BE BETTER於窄題庫provenance與無帳號first success；不同產品邊界 | CONFIRMED — https://apps.ankiweb.net/ |
| Google Search Central redirects | 遷移benchmark | site-move/redirect docs查閱2026-10-06 | 永久server redirect較強；GitHub Pages靜態限制下保留JS+truthful fallback，不為此新建backend | CONFIRMED — https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes |
| MDN `<noscript>` | web platform benchmark | 查閱2026-10-06 | `<noscript>`是scripting關閉時的標準fallback；支持目前最小方案 | CONFIRMED — https://developer.mozilla.org/zh-TW/docs/Web/HTML/Reference/Elements/noscript |

競爭選擇：

- **MUST MATCH**：legacy URL仍可到canonical；JS path精確保留query/hash；no-JS不做無聲破壞性redirect；canonical來源truthful。
- **SHOULD BE BETTER**：無外部依賴、頁面小、可及性文字fallback、local-first/no-login。
- **DIFFERENTIATOR**：不是新練習產品，而是極窄、可稽核的retired-entry compatibility contract。
- **DO NOT COPY**：題庫、帳號、訂閱、同步、AI題目、spaced repetition、leaderboard、redirect service；缺真人需求與成本證據。

## Product Board 多視角推演

- CEO：只做三件事——驗證 deployed no-JS fallback、由owner收斂重複PR、保持canonical連結與noindex。**不做**任何練習功能。
- CPO：repo的唯一產品價值是舊連結誠實轉接；success不是feature parity，而是legacy entry不誤導。
- CTO／Staff Engineer：現有單頁+manifest+tests已是最小範圍；server redirect雖理想，但為靜態GitHub Pages另建服務過度工程。
- UX Lead／Researcher：normal JS與no-JS要給不同而 truthful的預期；合成persona不能估算no-JS人口。
- Growth：noindex與canonical轉接符合退役面定位；不應把此repo當acquisition surface。
- CFO：零新增infra、零付費服務；只保留靜態compatibility shell。
- Security/Privacy：不增加第三方script、analytics或跨站storage；目前最小面較安全。
- QA：CI source contract已綠，但必須補exact-default deployed no-JS browser與JS deep-link各一條。
- SRE：Pages deploy成功不等於JS-disabled runtime；需要可追溯public receipt。
- Accessibility：`noscript`訊息與keyboard link是正確方向；尚缺deployed assistive/browser實測。
- Support：對外說「JS會保留狀態；無JS需重新選擇」，不可再承諾所有情境自動保存。
- 分歧：Growth可能傾向刪repo只留canonical；Support/SRE反對，因既有legacy URL仍需恢復面。決策是 **MAINTAIN + SIMPLIFY**，而非 ARCHIVE。

## 50 合成 Persona（30回歸／20探索）

模型多視角推演，不是50名真人、票數、發生率、營收或優先級證據；與固定A01–J05分開。R=回歸，E=探索。

| ID | 背景／限制 | 任務／旅程 | 摩擦／結果 | 分級／建議／證據 |
|---|---|---|---|---|
| P01 R | JS桌機使用者 | 舊URL含query/hash→quiz | source保留狀態 | MAINTAIN；SOURCE |
| P02 R | iPhone Safari | 點舊書籤→quiz | deployed mobile未重跑 | NRV |
| P03 R | Android Chrome | deep link到指定題 | exact runtime待驗 | NRV |
| P04 R | JS停用企業瀏覽器 | 開舊URL | 無timed redirect、看到說明 | SOURCE PASS；runtime pending |
| P05 R | Script blocker | 點手動canonical link | 需重新選條件且已明示 | P3 fixed source |
| P06 R | Screen reader | 聽noscript訊息 | deployed AT未驗 | NRV |
| P07 R | keyboard-only | Tab到continue link | markup可達；runtime pending | NRV |
| P08 R | 低視力放大 | 讀fallback文字 | 靜態文字存在 | SOURCE |
| P09 R | 慢網路 | script延遲後redirect | 無外部依賴 | MAINTAIN |
| P10 R | 部分載入 | inline script未跑 | truthful manual recovery | SOURCE |
| P11 R | 隱私瀏覽器 | 阻擋部分script | 不增加tracker | MAINTAIN |
| P12 R | 舊書籤無參數 | 進canonical首頁 | 正常轉接 | SOURCE |
| P13 R | hash-only書籤 | 保留question anchor | source組合hash | SOURCE |
| P14 R | query-only書籤 | 保留subject filter | source組合query | SOURCE |
| P15 R | query+hash | 保留完整狀態 | previous runtime曾pass；current pending | NRV |
| P16 R | SEO crawler | 避免索引legacy | noindex + canonical link | SOURCE |
| P17 R | Support | 解釋無JS行為 | README/manifest一致 | MAINTAIN |
| P18 R | Maintainer | 避免題庫分叉 | embedded_question_bank=false | PASS |
| P19 R | QA | 跑12項suite | exact-head CI success | EXECUTED |
| P20 R | SRE | 確認Pages上線 | exact-head deploy success | EXECUTED deployment |
| P21 R | Security | 檢查外部runtime deps | 無外部script/style | SOURCE |
| P22 R | Portfolio owner | 判斷是否再投資 | compatibility-only | SIMPLIFY |
| P23 R | 新貢獻者 | 看repo scope | README清楚指向canonical | MAINTAIN |
| P24 R | Issue triager | 搜同root | #3精確覆蓋 | DEDUP |
| P25 R | PR reviewer | 比較#4–#8 | #8已merge，其餘重複 | OWNER REVIEW |
| P26 R | Release owner | 判斷能否關#3 | source/CI足夠，runtime缺口仍誠實 | PARTIAL |
| P27 R | CFO | 評估redirect backend | 沒規模證據 | DON'T BUILD |
| P28 R | Accessibility reviewer | 不靠顏色理解 | 全文字狀態 | PASS source |
| P29 R | Canonical product owner | 防止compat擴權 | 所有功能回canonical | MAINTAIN |
| P30 R | CLEAN auditor | 判斷2輪 | current runtime不完整 | NOT CLEAN 0/2 |
| P31 E | 無JS kiosk | 手動進quiz | 需重選但已明示 | ACCEPTABLE DEGRADE |
| P32 E | CSP封鎖inline | script不執行 | 等同no-JS fallback | NRV |
| P33 E | 記憶體壓力終止script | fallback可見 | NRV |
| P34 E | 閱讀模式瀏覽器 | 抽取主要連結 | link在main | LIKELY |
| P35 E | 自動化爬蟲 | 不執行JS | 不被meta refresh誤導 | SOURCE |
| P36 E | 搜尋引擎遷移 | 處理舊URL | JS弱於301但noindex減風險 | MAINTAIN |
| P37 E | 分享舊連結者 | 朋友打開deep link | JS path應保留 | NRV |
| P38 E | 離線打開舊頁 | 尚未快取 | 無離線承諾 | NOT_ESTABLISHED |
| P39 E | 裝置時鐘異常 | redirect timer | 不依賴server時間 | PASS source |
| P40 E | 雙擊手動連結 | 先於timer導航 | canonical仍可達 | LIKELY |
| P41 E | 惡意query | 原樣傳遞 | canonical解析安全未屬此repo | NEEDS_EVIDENCE，不開單 |
| P42 E | 非臺灣語系 | 讀中文fallback | localization未核定 | DEFER |
| P43 E | 極小螢幕 | 看說明與按鈕 | deployed visual未驗 | NRV |
| P44 E | 企業代理 | 阻擋GitHub Pages | hosting可達性非repo根因 | UNKNOWN |
| P45 E | Braille display | 讀link context | wording存在，AT未驗 | NRV |
| P46 E | JS錯誤注入 | script早期失敗 | 無meta refresh；manual link仍在 | SOURCE |
| P47 E | 舊快取使用者 | 看先前meta refresh版本 | cache upgrade未實測 | NEEDS_RUNTIME |
| P48 E | Canonical URL更名 | legacy target失效 | 目前target穩定；監控即可 | MAINTAIN |
| P49 E | Feature倡議者 | 要spaced repetition | scope明確拒絕 | DON'T COPY |
| P50 E | Red Team challenger | 推翻新Issue需求 | source已解root，剩驗證非新root | REJECT NEW ISSUE |

未產生Synthetic Preference Share或switching「票數」。

## 固定 A01–J05 checkpoint

- 本輪50 persona是產品推演，不替代固定A01–J05。
- `police-exam-practice`在修正後仍缺 deployed no-JS/assistive browser receipt；沒有兩個完整合格round。
- current qualifying CLEAN rounds：`0/2`；結論 **NOT CLEAN**。缺證據阻止CLEAN，但不證明P0/P1。

## Red Team

1. 能否因#3已closed就標VERIFIED_FIXED？不能；close/merge與source合理不等於merged-head deployed no-JS重跑。
2. 能否因CI+Pages都綠就補發CLEAN？不能；CI只測source contract，Pages只證明deploy，不含no-JS/assistive runtime。
3. 能否新建301 redirect service？可改善標準性，但沒有規模/成本證據，且擴出backend；拒絕。
4. 能否刪除compat repo？未知外部legacy links會失效；無遷移完成證據，拒絕ARCHIVE。
5. 能否把Quizlet/Anki功能加回此repo？與已核定compatibility-only scope衝突；拒絕。
6. open duplicate PR是否新缺陷？是治理成本但非使用者root cause；不另開framework Issue。
7. #74/#75 exact-default browser是否等於deployed offline？不是；test-origin與Pages deploy是兩張receipt，仍缺共同public runtime。
8. 能否更新/關閉#74/#75？active overlapping PR/branches表示ownership不清；SKIPPED_LOCKED。
9. 是否有新P0/P1？沒有資料、權限或核心任務重大事故因果鏈。
10. 是否需要通知？無新finding、無confirmed regression、高價值新方向或CLEAN；維持靜默。

## NOW / NEXT / LATER / DON'T

- **NOW**：owner對 `police-exam-practice` open duplicate PR做收斂；audit不代為關閉。
- **NOW**：在 exact default/deployed Pages執行兩條最小runtime：JS query+hash；JS disabled無timed redirect、訊息可見、link可操作。
- **NOW**：`police-exam-archive`在public Pages重跑first-offline Analytics與cache upgrade/failover；通過後才把#74/#75標VERIFIED_FIXED。
- **NEXT**：若runtime pass，依互斥規則在原Issue寫證據並釋放lease；若fail，重開/更新原fingerprint，不新造Issue。
- **LATER**：只有legacy流量與支持成本證據成立時才評估server-side redirect。
- **DON'T**：不重建題庫、帳號、sync、AI、spaced repetition、leaderboard、backend redirect service或PR-governance平台。

## Decision Memo

- **服務誰**：持有舊書籤／連結的警察考試考生，以及需要不破壞legacy入口的support/owner。
- **選擇／競爭理由**：不與練習平台比功能；以極小、無外部依賴、truthful degradation的compatibility shell保護既有路徑。
- **差異化**：scope窄且可稽核；canonical product保持單一資料/功能來源。
- **前三優先**：(1) deployed JS/no-JS runtime證據；(2) owner收斂duplicate PR；(3) canonical target與noindex持續一致。
- **不做／刪除**：不在此repo加任何學習功能、資料、帳號或後端；不刪repo直到legacy流量/連結證據允許。
- **風險／實驗**：最大風險是把source/CI當作deployed accessibility行為。最小實驗只需兩條public browser矩陣，無正式資料失敗注入。
- **Portfolio recommendation**：`police-exam-practice = MAINTAIN + SIMPLIFY + PAUSE FEATURES`；`police-exam-archive = INVEST only in existing P2 closure`。不是新平台授權。

## Findings、去重與 write ledger

| 類型 | 數量 | 結果 |
|---|---:|---|
| New actionable finding / Issue | 0 / 0 | 無 |
| Existing Issue update/reopen | 0 | active PR/branches，SKIPPED_LOCKED |
| Regression status transition | 3 | #3/#74/#75 → PARTIALLY_FIXED / NRV（audit only） |
| Verified fixed / confirmed regression | 0 / 0 | 無 |
| Deduplicated roots | 3 | 沿用#3/#74/#75 |
| Rejected large/new scope | 7 | backend redirect、題庫複製、帳號、sync、AI、spaced repetition、PR framework |
| Severity correction | 0 | P3/P2維持 |
| Product/CI/config/settings writes | 0 | 無 |
| Issue lease/comment | 0 | SKIPPED_LOCKED |
| Audit report | 1 | 本檔，central Draft PR #154 branch |
| Write blocked | 0 | 無 |

## 未完成、游標與 CLEAN

- runtime pending：practice deployed JS/no-JS/assistive；archive deployed first-offline/upgrade/failover。
- active duplicate PR需要owner決策；audit不改scope、不大量關單。
- next fair cursor：`Reese-max/exam-archive`。
- Portfolio Ranking：未做；完整公平輪巡尚未完成。
- CLEAN：**NOT CLEAN / PARTIAL**；固定A01–J05 qualifying rounds `0/2`，不停止recurring audit。

