# Portfolio Product Board Delta — project-doctor-web

- UTC：2026-09-23T08:10Z
- rules blob：`8167e10798071d2276addaff6b201c6b0e904a2a`
- inventory：42 owned repositories / 41 unarchived；`obsidian-vault` archived exclusion
- inspected default HEAD：`Reese-max/project-doctor-web@7a9a96b1f22ce80149f23d8ee1ab8ca23b046ce6`
- last product baseline：`3a7e83ed012722f5d28b4bc7fb4bddbf98d07579`
- candidate：[PR #20](https://github.com/Reese-max/project-doctor-web/pull/20) exact head `568eab6a4e355f7af9f2cb8107ee70e69fdcc58e`
- formal audit：[audit-only draft PR #21](https://github.com/Reese-max/project-doctor-web/pull/21)，commit `f66796ef703ff1aee77fddecc4c84e91ca9e9001`

## New actionable evidence

PR #20 的 `collectPatientEvidence()` 僅保留 `role:"user"`，但產品 UI 的 `injectObjective()` 以 `role:"system"`、`操作者載入客觀資料：` 前綴保存操作者客觀資料。因此「前回合 objective=全身紅疹；本回合 user=呼吸困難」仍可能在 provider fetch 前漏過跨回合組合警訊。此項已由未解、未 outdated 的 [review thread](https://github.com/Reese-max/project-doctor-web/pull/20#discussion_r4067676534)承接。

- fingerprint：`project-doctor-web|doctor route + operator objective|previous trusted objective then current patient symptom|combination emergency missed before provider|collector retains user role only`
- classification：`BUG / P1 / HIGH_PRE_MERGE / SOURCE_CONFIRMED / NEEDS_REVIEW / auto_implementation=false`
- minimum change：在現有 12-message / 2-KiB / 8-KiB caps 內，只保留 exact trusted objective prefix 或 structured source；繼續排除 assistant 與 arbitrary system；加入 prior-objective-rash + current-user-dyspnea route regression，assert provider fetch 0。
- non-goals：資料庫、通用狀態機、訊息 registry、clinical rule platform。
- disposition：Issue #16、PR #20、branch 與 review 均活躍，`SKIPPED_LOCKED`；未重複開 Issue、未改 scope、未介入實作。

PR #20 genuinely covers patient-only split-turn cases，因此不是整體無效；本 finding 是同一 #16 根因的 partial-fix blocker，不是新 Issue fingerprint。既有 #19 emergency-stop latch 無新 default-branch 修正或 runtime evidence，維持 P2 並去重。

## Validation

PR exact head 查無 GitHub Actions workflow run：`VALIDATION_GAP / severity=NOT_ESTABLISHED / root cause UNKNOWN`。作者敘述的本機測試不能冒充 CI。未執行瀏覽器、手機、Cloudflare、真實 provider、臨床或輔助科技驗證；不宣稱 `REGRESSION` 或 `VERIFIED_FIXED`。

## Board / market summary

Formal audit contains a separate synthetic market panel of 30 regression + 20 exploration personas, distinct from fixed A01–J05, plus official-source comparisons with [Body Interact](https://bodyinteract.com/), [Oxford Medical Simulation](https://oxfordmedicalsimulation.com/), and [SimX](https://www.simxvr.com/), checked 2026-09-23. Official claims are not treated as independent outcome evidence.

Decision：`INVEST` core safety/provenance，`SIMPLIFY` trusted input sources and reset，`MAINTAIN` web-first teaching/research positioning；do not copy VR, multiplayer, marketplace, enterprise IAM/LMS, diagnosis claims, or a general clinical-policy platform.

## Accounting / cursor

- new actionable evidence：1
- validation gap：1
- new / updated / reopened Issues：0 / 0 / 0
- product implementation：0
- Verified Fixed：0
- Portfolio：`NOT CLEAN, 0/2`
- next fair cursor：`prompt-autoresearch`
