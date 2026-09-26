# Prompt AutoResearch — Issue #12 default-branch regression verification

- 查閱日：2026-09-26
- repo：`Reese-max/prompt-autoresearch`
- inspected default HEAD：`fca6f26d75041db68a57c653ddf7196096aefb34`
- issue-quality 規則 blob SHA：`8167e10798071d2276addaff6b201c6b0e904a2a`
- 追蹤：[Issue #12](https://github.com/Reese-max/prompt-autoresearch/issues/12)／[PR #13](https://github.com/Reese-max/prompt-autoresearch/pull/13)
- 結論：`BUG / P1 / HIGH / EXECUTED_REPRODUCTION / VERIFIED_FIXED`
- auto_implementation：`false`
- Portfolio：`NOT CLEAN, 0/2`

## 差異與原情境

Issue #12 的 fingerprint：

`prompt-autoresearch + run_app.py local UI server + wildcard interface bind + unauthenticated permissive-CORS mutation endpoints + remote peer can start evolution/final/provider-proxy work`

PR #13 於 2026-09-26 合併至 `master`。default 現在：

1. 以 `LocalHTTPServer(("127.0.0.1", port), LocalProxyHandler)` 明確綁定 IPv4 loopback。
2. GET、HEAD、OPTIONS、POST 都在 route handling 前檢查 peer IP、Host、port 與 Origin。
3. 移除 wildcard CORS。
4. 保留 provider-host allowlist。
5. 對 foreign Origin、DNS-rebinding Host 與非 loopback peer 採 fail-closed。

## Default-branch runtime 複驗

正式 push run：[CI 36234463891](https://github.com/Reese-max/prompt-autoresearch/actions/runs/36234463891)

- event：`push`
- exact head：`fca6f26d75041db68a57c653ddf7196096aefb34`
- Linux Python 3.11 job：`108383619252`
- 實際結果：`1372 passed, 8 failed, 3 subtests passed`
- 失敗清單全部屬既有 [Issue #4](https://github.com/Reese-max/prompt-autoresearch/issues/4) 的 best-version evidence contract：
  - `tests/test_best_version_report.py`
  - `tests/test_best_version_report_e2e.py`
  - `tests/test_best_version_telegram_integration.py`
- 新增的 `tests/test_local_ui_security.py` 沒有出現在 failure list，已在 exact-default full suite 中執行通過。

該測試不是只檢查字串：

- 建立真實 ephemeral `127.0.0.1` HTTP listener，核對 `server_address`。
- 對正常本機 GET 與 mutation route 發送 HTTP request。
- 對 foreign Origin、錯誤 Host、null／空 Origin 與非 loopback peer 驗證 403。
- 對 `/api/run-evolution`、`/api/run-final`、`/api/proxy` 驗證未授權情境的 `Popen=0`、provider forwarding `urlopen=0`、directory mutation `makedirs=0`。
- 對本機同源 control path 驗證 mutation route 仍可到達，且非 allowlisted provider host 仍被拒絕。

因此，原本「預設 wildcard bind＋任意網路 peer 可到達 mutation route」的因果鏈已在 default branch 被切斷，且相同安全邊界有實際 loopback HTTP runtime 證據。

## 結論

Issue #12：`VERIFIED_FIXED`。

這個結論只涵蓋 Issue #12 的 local UI trust boundary。它不把整個 repository 或 CI 宣稱為健康：

- 九格 CI 的 aggregate gate 仍因 Issue #4 的八項既有失敗而紅。
- primary／paid provider 沒有真實呼叫。
- 未從另一台 LAN 主機對 owner 電腦做網路探測；這不是必要的破壞性驗證，因 server 已明確只 listen 在 loopback，且 request boundary 以實際 socket 測試。
- 未驗證 IPv6 loopback surface；產品目前只承諾並綁定 `127.0.0.1`。
- 未做 merge／deploy／settings／secrets／CI 修改。

## Red Team

1. **「全 CI 紅，所以不能驗證安全修正」**：不成立。exact-default full suite 的唯一八項失敗已逐項列出且都屬 Issue #4；安全測試本身已通過。但 CI 紅仍阻止 repository CLEAN。
2. **「Host/Origin 檢查可取代 loopback bind」**：不成立；本修正同時做 socket bind 與 request gate。
3. **「provider allowlist 已足夠」**：不成立；allowlist 限制目的地，不限制誰能啟動有成本或會改狀態的工作。
4. **「應新增帳號、OAuth 或 API gateway」**：否。對目前單機 UI，loopback bind＋同源 gate 是較小且足夠的修正。
5. **「localhost UI 正常流程可能被安全修正破壞」**：control case 已證明同源 GET、evolution、final 與 allowlisted proxy path 仍可到達；副作用以 mock 隔離，未產生付費或正式資料寫入。

## 董事會決策（模型多視角推演）

- CEO：只做三件事——保留 loopback 預設、修復 Issue #4 紅色 evidence gate、在任何外部 bind 提案前要求明確 owner 授權。
- CTO／Security：維持雙層邊界；不新增 IAM 平台。
- QA／SRE：Issue #12 可結束，但 Issue #4 的九格 matrix 必須獨立修復並在 exact SHA 複驗。
- CPO／UX／Support：保留本機 UI 可用性，不增加登入流程。
- CFO：沒有理由為單機模式加入付費 gateway。
- 建議：`MAINTAIN / SIMPLIFY`。

## 去重、所有權與寫入

- Issue #12 已由 owner 關閉，PR #13 已合併；本輪不重開、不改 Issue、不留言。
- `fix/issue-12-local-ui-boundary` 為已合併 branch；無未解 review thread。
- 中央 [PR #87](https://github.com/Reese-max/autodev-ng/pull/87) 是較早的 no-change cursor checkpoint；本輪不修改其 scope，另以獨立 verification delta 保存新 default-branch 證據。
- 新 Issue：0；更新／重開 Issue：0；Verified Fixed：1；Regression：0。
- 產品程式、CI/config、secrets/settings、worker/GOAL、merge、deploy：0。

## Persona／競品處理

本輪是既有 P1 的 post-merge regression verification，不是新的產品方向研究。沿用 2026-09-22 已保存的 30 回歸＋20 探索 Persona 與 LangSmith／promptfoo／DSPy 競品矩陣；沒有新的市場假設足以合理重貼 50 人完整報告。此輪不計入固定 A01–J05 的 CLEAN 合格輪次。
