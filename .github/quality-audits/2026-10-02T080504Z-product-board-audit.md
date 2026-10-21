# Product Board Audit — 2026-10-02T08:05:04Z

- **狀態：PARTIAL / NOT CLEAN**
- **稽核範圍：** Reese-max 自有 repositories；45 個 inventory、44 個未封存，封存的 `obsidian-vault` 依用途排除產品稽核
- **品質規則：** `docs/portfolio-audit/2026-09-14-issue-quality-v2.md`
- **規則 blob SHA：** `8167e10798071d2276addaff6b201c6b0e904a2a`
- **本輪關鍵 inspected SHA：** `Reese-max/ppt-studio@8ca3b8ca9b32b5185c8925f3e4c9aeccb743c7f3`
- **限制：** 本輪是增量巡檢，未宣稱固定 A01–J05 兩個完整合格輪次；沒有正式環境或遠端瀏覽器登入憑證，因此遠端瀏覽器結果標示 `NEEDS_RUNTIME_VERIFICATION`。

## Executive outcome

前一輪在 `ppt-studio` PR #13 發現的遠端瀏覽器驗證缺口已隨 PR 合併進入預設分支。安全的 loopback 預設值與非 loopback 拒絕測試皆通過，但當 `APP_AUTH_MODE=remote` 時，伺服器要求 `Authorization: Bearer <APP_TOKEN>`，目前 SPA 沒有輸入、交換或注入憑證的瀏覽器路徑；因此使用者可載入公開 shell，核心 API 隨後回 401。這是同一 fingerprint 的證據版本更新，不另製造新的根因。

- **kind:** BUG
- **severity:** P2
- **decision_priority:** NOW（先作產品範圍決策，再做最小修正）
- **triage:** NEEDS_REVIEW
- **auto_implementation:** false
- **回歸分類：** `STILL_REPRODUCIBLE` on default branch；若「遠端瀏覽器使用」是受支援流程，則該流程是 `REGRESSION`
- **信心：** 高（SOURCE_CONFIRMED + 靜態可達因果鏈）；實際瀏覽器/反向代理重播仍待補

## Discovery 與增量證據

本輪比對所有未封存 repositories 的預設分支 HEAD、近期 commits、Issues/PR 與可取得的 Actions/部署紀錄。自前一游標後確認 4 個產品預設分支合併：

| Repo | 預設分支 SHA | 精確 HEAD 證據 | 結論 |
|---|---|---|---|
| [ppt-studio](https://github.com/Reese-max/ppt-studio/commit/8ca3b8ca9b32b5185c8925f3e4c9aeccb743c7f3) | `8ca3b8c` | [PR #13](https://github.com/Reese-max/ppt-studio/pull/13)；[Actions 36858148170](https://github.com/Reese-max/ppt-studio/actions/runs/36858148170) success | loopback 邊界有證據；遠端 SPA auth 缺口仍在 |
| [project-doctor-web](https://github.com/Reese-max/project-doctor-web/commit/9697372913e8dc62a20c62b8e10f01dd3f726fcb) | `9697372` | [PR #25](https://github.com/Reese-max/project-doctor-web/pull/25)；[Actions 36978570345](https://github.com/Reese-max/project-doctor-web/actions/runs/36978570345) success | lint/typecheck/test 通過；provider 為 mock，無部署證據 |
| [avatar-vfo](https://github.com/Reese-max/avatar-vfo/commit/8c578febb49afdf111af096c29ab9e4c59806631) | `8c578fe` | [PR #10](https://github.com/Reese-max/avatar-vfo/pull/10)；[CI 36968490343](https://github.com/Reese-max/avatar-vfo/actions/runs/36968490343) success；deploy 只執行 disabled 說明 | 無實際部署，不把綠燈冒充正式環境驗證 |
| [note-filler](https://github.com/Reese-max/note-filler/commit/1df674dd32d64c68f4e8a9bfa433665c042d0c61) | `1df674d` | [PR #8](https://github.com/Reese-max/note-filler/pull/8)；[Actions 36844944866](https://github.com/Reese-max/note-filler/actions/runs/36844944866) success | Python 3.11–3.13 通過；integration skipped，provider/shared deployment 未驗證 |

README、測試存在及單一綠燈不等同完整路徑。其餘變更未發現通過四道門檻且尚無追蹤的新 P0/P1/P2。

## Finding F-2026-10-02-01

**Fingerprint**

`Reese-max/ppt-studio + remote browser SPA + APP_AUTH_MODE=remote + public shell but no client Bearer channel + core API 401 + no authenticated browser path`

**受影響者與可到達流程**

需要從另一台裝置或經受信任反向代理操作 self-hosted UI 的管理者、編輯者與行動瀏覽器使用者。步驟：

1. 以 `APP_AUTH_MODE=remote` 與 `APP_TOKEN` 啟動服務。
2. 從非 loopback 瀏覽器開啟 `/`；公開 SPA shell 可載入。
3. SPA 對 `/api/presentations` 等核心端點發出 request。
4. middleware 要求 Bearer token；現有 SPA 沒有取得或附加 token 的通道，回應為 401。
5. 使用者不能透過產品 UI 完成列出、建立、編輯、匯入或 AI 任務。

**預期：** 若遠端瀏覽器 UI 屬支援範圍，應有不把 token 放進 URL、HTML 或 localStorage 的授權流程，所有核心 API request 一致帶上授權；若不支援，產品應明確宣告 remote mode 為 API-only，不呈現可誤解的公開 SPA shell。

**實際與來源：**

- default SHA `8ca3b8c` 的 README 明列 remote/LAN 要用 `APP_AUTH_MODE=remote`、`APP_TOKEN` 與 Bearer header。
- backend middleware 除 `/api/health` 與 `/` shell 外保護 API。
- 預設分支搜尋未找到 token 輸入、bootstrap/session exchange 或全域 Authorization 注入；share template 仍有 bare fetch。
- PR #13 changed files 未含可建立上述瀏覽器授權路徑的前端變更。
- exact-head CI 驗證 local loopback/非 loopback 邊界，沒有驗證遠端已授權 SPA journey。

證據分類：`SOURCE_CONFIRMED`、靜態因果鏈；尚非正式環境事故或 `EXECUTED_REPRODUCTION`。

**不做的後果：** remote 模式在安全上 fail-closed，但受支援 UI 會不可用，使用者容易在網路、proxy 或 token 設定上重複排錯。

**最小有效範圍（擇一，需 owner 決策）：**

1. 將 remote mode 明確收斂為 API-only，讓 UI 與文件不再暗示瀏覽器遠端工作流可用；或
2. 提供最小 same-origin bootstrap/session，讓 SPA 在記憶體內取得短期授權並對所有 API 一致附加，不把 bearer 放進 URL、HTML、log 或 localStorage。

不建立帳號資料庫、RBAC、團隊協作、雲端控制平面或行動 App。

**直接驗收：**

1. remote mode 載入 `/` 後，已授權 client 的 `GET /api/presentations` 成功，未授權仍為 401。
2. create/edit/import/AI 等核心 fetch 一致遵守同一授權機制。
3. share path 的公開/受保護邊界有明確產品決策與測試。
4. token 不出現在 URL、HTML、應用 log 或 localStorage。
5. 在隔離的瀏覽器 + Compose/受信任 proxy 上，以預設分支精確 SHA 重播成功與拒絕路徑。

**追蹤與互斥：**

[ppt-studio Issue #1](https://github.com/Reese-max/ppt-studio/issues/1) 已正確完成原始「local-only 或 remote 必須驗證」安全邊界，不能用不同根因自動重開。搜尋所有狀態 Issues/PR 未找到專門追蹤此 SPA auth gap 的 Issue；但 [PR #2](https://github.com/Reese-max/ppt-studio/pull/2) 與相關 branch 仍涵蓋同一網路/驗證區域，所有權不明。因此本輪標記 `SKIPPED_LOCKED_ACTIVE_PR`，只在獨立中央報告留證據，不留言、不加鎖、不搶改 scope。

## 外部競品與替代工作流

查閱日：2026-10-02。頁面未揭露可靠發布/更新日者標示 UNKNOWN；官方文件是功能宣稱，不是獨立效果證據。

| 產品/替代 | 使用者與首次成功 | Auth/分享/行動 | 判讀 |
|---|---|---|---|
| [Canva secure sharing](https://www.canva.com/help/secure-sharing-designs-canva/) / [permissions](https://www.canva.com/help/set-sharing-permissions-canva/) | 一般創作者與團隊；瀏覽器內選權限後分享 | 官方 UI 提供連結與權限控制；事件日期 UNKNOWN | **MUST MATCH:** 支援的瀏覽器流程必須可在 UI 完成；不複製完整協作套件 |
| [Pitch external link](https://help.pitch.com/en/articles/3748926-share-an-external-link-to-your-presentation) / [guest collaboration](https://help.pitch.com/en/articles/8575905-invite-guests-to-collaborate-on-presentations) | 團隊簡報；由分享面板產生外部 link | 分享/guest 權限在產品流程內；事件日期 UNKNOWN | **SHOULD BE BETTER:** self-hosted 部署可用更小、清楚的 trust boundary |
| [ONLYOFFICE Docker](https://helpcenter.onlyoffice.com/docs/installation/docs-community-install-docker.aspx) / [server config](https://api.onlyoffice.com/docs/docs-api/get-started/configuration/server-config/) | self-hosted 管理者；Docker 啟動後接整合層 | 官方整合說明包含 server-side auth/JWT 設定；事件日期 UNKNOWN | **DIFFERENTIATOR:** 保持單機、可稽核與低依賴；不複製大型文件平台 |
| local-only 手動工作流 | 單機 owner；瀏覽 localhost | 不需要遠端 SPA auth | **DO NOT COPY:** 不以「請關閉驗證/直接暴露 port」換取易用性 |

競品存在不能單獨證明缺陷；本 finding 的依據仍是 repo 的受支援設定與可達程式路徑。

## 模型產品董事會（多視角推演，非真人共識）

| 角色 | 觀點 |
|---|---|
| CEO | 只做三件事：守住 loopback 安全預設；決定 remote SPA 是支援或 API-only；補一個瀏覽器+proxy 驗證。其他協作功能不做。 |
| CPO | 公開 shell 加 401 容易被理解成壞掉；應消除範圍歧義。 |
| CTO | 最小 same-origin session 可行，但先確認需求；不要引入帳號系統。 |
| Staff/Principal Engineer | 先集中所有 fetch 的 auth seam；避免逐端點補 header。 |
| UX Lead/Researcher | 使用者無法分辨 network、proxy 與 token 問題；需要單一明確失敗狀態。 |
| Growth | 遠端展示可能重要，但目前沒有真人需求證據，不應用合成偏好升級。 |
| CFO | 帳號/RBAC/託管服務成本不成比例；支持文件收斂或局部修正。 |
| Security/Privacy | fail-closed 是優點；反對 URL token、localStorage 長期 bearer 與降低權限。 |
| QA | 目前 CI 未覆蓋已授權瀏覽器 journey，不能宣稱 fixed。 |
| SRE | 需要 proxy header、來源與 401/403 可觀測性，但不在本最小修正擴 scope。 |
| Accessibility | auth/error UI 必須可由鍵盤與輔助科技理解；若 API-only 則文件要直接。 |
| Support | 最小 runbook 應區分「未授權」與「連不到服務」。 |

**實質分歧：** CPO/UX 偏向補瀏覽器流程；CFO/Staff 在缺真人需求下偏向先宣告 API-only。Security 接受任一方案，但拒絕弱化驗證。董事會票數不作 PASS 或優先級證據。

## 50 合成 Persona 覆蓋

純模型情境推演，不是訪談、使用率、偏好份額或營收證據。R01–R30 為回歸基線，X31–X50 為探索；固定 A01–J05 稽核另行計算，未被本表取代。證據碼：E1=default README/auth contract、E2=backend middleware、E3=缺 client auth seam、E4=local boundary CI、E5=runtime pending。

| ID | 背景/限制 | 目標與旅程 | 摩擦/結果 | 分級、建議、證據 |
|---|---|---|---|---|
| R01 | 單機作者、localhost | 建立並編輯簡報 | local flow 不受此 finding 阻擋 | 無新增；維持預設，E4 |
| R02 | 單機教師 | 匯入教材 | local 成功假設仍待產品測試 | 無新增，E4/E5 |
| R03 | 單機研究者 | AI 生成投影片 | auth gap 不適用 | 無新增，E4 |
| R04 | 離線筆電 | 管理既有 deck | 不需 remote auth | 無新增，E4 |
| R05 | 個人 Docker 新手 | compose up 後開 localhost | 文件路徑清楚 | 無新增，E1/E4 |
| R06 | Windows Docker 使用者 | 瀏覽器本機操作 | 平台 runtime 未重播 | NEEDS_RUNTIME_VERIFICATION，E5 |
| R07 | macOS Docker 使用者 | 本機編輯 | 同上 | NEEDS_RUNTIME_VERIFICATION，E5 |
| R08 | Linux 管理者 | 本機維護 | loopback boundary 有 CI | 維持，E4 |
| R09 | 無 AI key 使用者 | 基本編輯 | 與 remote auth 無關 | 無新增 |
| R10 | 螢幕閱讀器單機用戶 | 導航與編輯 | auth 缺口不適用，a11y 未實測 | NEEDS_EVIDENCE，E5 |
| R11 | 鍵盤-only 單機用戶 | 完成 deck | 同上 | NEEDS_EVIDENCE，E5 |
| R12 | 低頻使用者 | 一鍵啟動 | safe default 有價值 | 維持，E4 |
| R13 | 家用 NAS 管理者 | LAN 瀏覽器開 UI | shell 可開、API 401 | P2；決定支援範圍，E1–E3 |
| R14 | 小型團隊 owner | 反向代理後編輯 | 無 UI token 路徑 | P2；最小 auth seam，E1–E3 |
| R15 | 校內伺服器管理者 | LAN 分享給同事 | 使用者卡在 401 | P2；明確 UI/文件，E1–E3 |
| R16 | VPN 遠端工作者 | 連 home server | token 無法從 SPA 提供 | P2，E1–E3 |
| R17 | 行動 Safari 使用者 | 手機查看 deck | shell 後核心 API 失敗 | P2；runtime replay，E3/E5 |
| R18 | Android Chrome 使用者 | 遠端修字 | 同上 | P2，E3/E5 |
| R19 | 平板簡報者 | 會前更新 | 同上 | P2，E3/E5 |
| R20 | 受限企業瀏覽器 | 不能裝 extension | 無替代 header 注入 | P2；勿要求 extension，E3 |
| R21 | CLI 熟練管理者 | curl API | 可手動帶 Bearer | workaround 存在；不代表 UI fixed，E1 |
| R22 | 非技術編輯者 | 瀏覽器遠端使用 | 不會手動 header | P2；產品內流程，E3 |
| R23 | Support 人員 | 指導 401 排錯 | 文件與 UI 範圍歧義 | P2；runbook，E1–E3 |
| R24 | QA 工程師 | 回歸 remote journey | CI 僅測 network boundary | VALIDATION_GAP；E4/E5 |
| R25 | Security reviewer | 檢查未授權拒絕 | 401 fail-closed 正常 | 不降權；E2/E4 |
| R26 | Privacy reviewer | 檢查 token 暴露 | 尚無 client 流程可驗 | NEEDS_REVIEW；E3/E5 |
| R27 | SRE | proxy 部署 | 健康檢查可公開、核心 UI 不可用 | P2；最小 runtime test，E1–E5 |
| R28 | 備援操作員 | 故障時遠端改 deck | 無 UI 授權恢復路徑 | P2，E3 |
| R29 | 公開 demo 主持人 | 只讀展示 | share 邊界未決 | NEEDS_REVIEW；E3/E5 |
| R30 | 維護者 | 驗證 PR #13 | 原安全 acceptance 通過、此流程未覆蓋 | STILL_REPRODUCIBLE，E4/E5 |
| X31 | Caddy proxy 使用者 | same-origin TLS + UI | header/bootstrap 未整合 | P2；最小 session，E3/E5 |
| X32 | Nginx proxy 使用者 | proxy auth 後開 UI | trust boundary 未定義 | NEEDS_REVIEW，E5 |
| X33 | Tailscale 使用者 | 私網遠端編輯 | 私網不會自動供 Bearer | P2，E1–E3 |
| X34 | Cloudflare Access 使用者 | identity-aware proxy | 雙重 auth contract 不清 | RESEARCH/NARROW，E5 |
| X35 | kiosk 顯示 | 自動播放 deck | 長期 bearer 不宜放 URL | Security guardrail，E1–E3 |
| X36 | 共用電腦 | 臨時登入後編輯 | localStorage bearer 風險 | 勿採長期 storage，E3 |
| X37 | 多分頁重度用戶 | 同時改多 deck | session 同步需求未知 | LATER/NEEDS_EVIDENCE |
| X38 | token 輪替管理者 | 不停機換 token | 本 finding 不要求完整輪替 | LATER；避免 scope creep |
| X39 | 反向代理維護者 | 查看 401/403 | 可觀測性不足尚未重現 | NEEDS_EVIDENCE，E5 |
| X40 | 自架社群 | 多人共用 | 可能需要帳號但無需求證據 | DON'T build accounts |
| X41 | 顧問展示者 | 客戶端臨時存取 | 外部分享權限需求未知 | RESEARCH only |
| X42 | 低頻手機查看者 | 只讀 deck | share 是否公開未決 | NEEDS_REVIEW，E3/E5 |
| X43 | 網路不穩用戶 | 401 後重試 | auth 與離線錯誤易混淆 | UX 最小錯誤狀態 |
| X44 | 色弱用戶 | 辨認 auth error | UI 尚無專用狀態 | NEEDS_EVIDENCE |
| X45 | 認知負荷高用戶 | 依指示輸入設定 | env + header 心智模型過重 | 簡化或 API-only |
| X46 | 開源貢獻者 | 增加 endpoint | 容易漏加 auth header | 集中 fetch seam |
| X47 | 測試維護者 | 補 browser test | 需隔離 proxy fixture | NOW experiment，E5 |
| X48 | 套件維護者 | 保持依賴小 | OAuth/DB 過度工程 | DON'T add platform |
| X49 | 法遵審查者 | 確認 token 不進 log | 無 runtime evidence | NEEDS_RUNTIME_VERIFICATION |
| X50 | 產品 owner | 決定支援範圍 | 兩個小方案各有代價 | NOW decision；不以模擬投票決定 |

## Red Team

- **相反證據：** PR #13 已真正修正原始 local-only 安全邊界；Compose 預設沒有被證明可由外部存取。
- **更小替代：** 若沒有遠端瀏覽器需求，將 remote mode 收斂為 API-only 比建 session 更小。
- **錯誤根因排除：** 不是缺 ledger/registry/framework，也沒有證據是 billing、proxy 或 GitHub Actions 問題。
- **環境限制：** 靜態因果鏈強，但尚未在授權遠端 browser + proxy 執行，因此不升為 P1。
- **需求不明：** repo 文件同時描述 remote Bearer 與 browser UI，卻未明說 remote UI 是否支援；owner 決策先於實作。
- **過度工程否決：** 不需要帳號資料庫、OAuth provider、RBAC、協作服務、手機 App 或跨 repo auth 平台。

## NOW / NEXT / LATER / DON'T

- **NOW:** owner 選擇「remote SPA 支援」或「remote API-only」；保留 loopback 安全預設。
- **NOW:** 依選擇採單一最小變更，不擴為身分平台。
- **NEXT:** 在隔離 browser + Compose/受信任 proxy，對 default SHA 重播授權成功、未授權拒絕與 share 邊界。
- **LATER:** 只有在真實部署需求成立後研究 rotation、revocation 與多使用者權限。
- **DON'T:** 不關閉 auth、不把 token 放 URL/localStorage、不建 accounts/RBAC/cloud control plane/mobile app。

## Decision Memo

**服務誰：** 先服務單機 self-hosted 簡報作者；只有在 repo 明確承諾時，才服務受信任網路上的遠端瀏覽器操作者。

**選擇與競爭理由：** Canva/Pitch 的成熟分享 UX 說明瀏覽器授權需是產品流程；ONLYOFFICE 則顯示 self-hosted 可把 auth 放在明確整合邊界。ppt-studio 的差異化應是小、可稽核、安全預設，而不是複製協作平台。

**前三優先：**

1. 保持 loopback safe-by-default。
2. 消除 remote browser 支援範圍歧義，採最小有效方案。
3. 補精確 HEAD 的真實 browser/proxy 成功與拒絕證據。

**不做/刪除：** 不做帳號系統、RBAC、託管服務或競品功能追趕；若 owner 選 API-only，刪除/改寫會讓人誤以為 remote SPA 可用的入口與文件。

**風險/最小實驗：** 以隔離環境在 30–60 分鐘內驗證一個受信任 proxy + browser flow；若不能安全建立 session 或沒有可追溯需求，`NARROW` 為 API-only；若成功且需求成立，`BUILD` 只授權後續最小方案評審，不自動授權實作。

**建議：** `SIMPLIFY` + `MAINTAIN`。這是產品建議，不是 merge、部署、付費或實作授權。

## Finding / Issue / write mapping

| 類別 | 數量 | 結果 |
|---|---:|---|
| 新 Issue | 0 | active overlapping PR/branch，`SKIPPED_LOCKED_ACTIVE_PR` |
| 更新/重開 Issue | 0 | #1 原根因已完成，不錯誤重開 |
| Issue comments / locks | 0 | 未取得產品項所有權，不寫 marker |
| 新中央 audit report | 1 | 本檔，唯一 round/path |
| 已驗證修復 | 0 | 原安全邊界通過，但 remote browser finding 仍待 runtime |
| regression/status change | 1 | pre-merge finding 已進 default；`STILL_REPRODUCIBLE` |
| write blocked | 1 product tracking | active PR #2/相關 branches；中央報告保存證據 |

## Portfolio / CLEAN

本輪不是完整 portfolio ranking，也不建立抽象共用 auth 框架。固定 A01–J05 停止條件、兩個完整合格輪次與必要 runtime 證據尚未完成，因此 **portfolio NOT CLEAN**。持久游標應在下一輪繼續公平掃描未覆蓋 repositories，並優先檢查本 finding 是否已有 owner 決策或 active PR 已釋放。
