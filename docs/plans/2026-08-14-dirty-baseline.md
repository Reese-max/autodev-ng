# 2026-08-14 團隊化實作前 Dirty Baseline

狀態：已盤點、未清除、未 commit、未 push

## Git 基線

- Branch：`main`
- HEAD：`8102e848a81a047cb33a7f44fa9dfdd72b02258f`
- Upstream：`origin/main`
- Ahead／behind：`+2 / -0`
- Tracked dirty：16 個檔案，`+250 / -53`
- 原有 untracked：9 個項目
- 上一階段新增設計文件：1 個項目
- Tracked patch Git hash：`5db7258bc96f0ea0dbddd1ff5ac35013097a5278`

## 不可破壞邊界

- `configs/.adng.stop` 必須保留；SHA-256：`81633C10CDE213A5D059BCD85F3EAB838227F59EA808E6623E58C260AB301985`。
- 哨兵內容：`user pause after current attempt; do not resume without explicit authorization`。
- 本階段不啟動 daemon／Guardian／patrol，不執行 commit、push、PR 或部署。
- 下列既有變更均視為使用者成果；本次實作若需碰同檔，必須保留其語意並補回歸測試。

## Tracked dirty 清單

| 類別 | 檔案 | HEAD blob | Baseline SHA-256 前 16 碼 |
|---|---|---|---|
| 文件／Herdr | `README.md` | `11fe58fedcad` | `5220D2A3E2F3EBE8` |
| Engine route | `configs/gooaye.json` | `13d0410856e7` | `793F9CC583228D41` |
| Engine route | `configs/neciken.json` | `c53269607d5e` | `2C19BE3352D0A271` |
| Engine route | `configs/note-filler.json` | `9dc24f32a902` | `3DA3AA6D0646C16D` |
| Engine route | `configs/taiwan-intel.json` | `1119ccdc29a4` | `5F614684AAD064CA` |
| Pause／backup | `scripts/adng-daemons.cmd` | `9dd1fc059883` | `448035B5CC1DE80A` |
| Pause／backup | `scripts/backup-push.mjs` | `5babec628d6f` | `A57A72E130CCCC87` |
| Patrol | `scripts/patrol/verification-contracts.json` | `0ff31f81f2cd` | `D4E022D77BE9F72F` |
| Bot recovery | `src/bot/index.ts` | `0cd90eacaed9` | `96D67D3106F8BA70` |
| Engine adapter | `src/engines/agy.ts` | `a4beed7f9019` | `D2C44F673AA66019` |
| Engine adapter | `src/engines/opencode.ts` | `762e577b3747` | `C3D80DD6A48FE4C7` |
| Engine adapter | `src/engines/registry.ts` | `7d4d1f5bf4ed` | `5566ED8A765DB7AC` |
| Engine schema | `src/types.ts` | `d7167cfa888b` | `0B9700755C36F12A` |
| Engine test | `tests/agy.test.ts` | `7c2960245d91` | `FA2D6CCCEFF397C7` |
| Engine fixture | `tests/fixtures/fake-opencode.mjs` | `fb57cb53612e` | `35877F7DCCEFE3B2` |
| Engine test | `tests/opencode.test.ts` | `190bcb890576` | `AB573716F16F39F1` |

## Untracked 清單

| 類別 | 路徑 | Baseline 證據 |
|---|---|---|
| Retro local state | `.context/` | 1 file，975 bytes |
| Pause sentinel | `configs/.adng.stop` | `81633C10CDE213A5` |
| Team design | `docs/plans/2026-08-14-team-parallel-ownership-merge-queue-design.md` | `4D36A1984513282A` |
| Review calibration | `docs/review-calibration/2026-W33.md` | `C89B9BA90521DB25` |
| Backup test | `scripts/backup-push.test.mjs` | `2D91DB99422227B9` |
| Operations helper | `scripts/cleanup-blocked.mjs` | `BB1D28C851DBDE3B` |
| Herdr console | `scripts/herdr-fleet-console.ps1` | `75721D9F89B7FE89` |
| Patrol check | `scripts/patrol/check-phantom-completion.cjs` | `08CF573F3251853D` |
| Herdr adapter | `src/engines/herdr.ts` | `6E82DCDE51567C17` |
| Herdr test | `tests/herdr.test.ts` | `787C9AE6BDC0B4DA` |

## Baseline Gate

於任何團隊化實作前執行：

```text
npm run typecheck                                                        PASS
npm run build                                                            PASS
npx vitest run tests/agy.test.ts tests/opencode.test.ts tests/herdr.test.ts
  Test Files 3 passed (3)
  Tests 46 passed (46)
node scripts/backup-push.test.mjs
  backup-push self-check: 3 passed
```

這份 baseline 只證明目前 dirty tree 在上述範圍可建置，並保留各檔快照識別；不代表未執行的全套測試、live fleet 或遠端發布已通過。
