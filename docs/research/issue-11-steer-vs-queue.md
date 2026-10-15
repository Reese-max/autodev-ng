# Issue #11 — 區分 in-flight Steer 與 Next-turn Queue 的控制語意

Design deliverable for `Reese-max/autodev-ng#11`（P1 FEATURE）。
Discord/CLI 目前只有 pause/resume 與「加未來 backlog」；缺對**正在跑的
exact attempt** 的有界 steer 語意。

## 1. 問題陳述

`/task` 只 append 未來 backlog；對「這次 execution 方向錯了要修正」沒有
target-bound 的 in-flight steer。operator 只能等它跑完、整個 project pause、
或加一筆 backlog。

## 2. Contract（issue 建議格式）

```
project + taskId + executionId + expected phase/turn + mode(STEER|QUEUE)
  + text hash + issuer + createdAt + TTL
  → delivery → engine acknowledgement / fallback → receipt
```

### `ControlRequest`

```jsonc
{
  "requestId": "ctl_<ulid>",
  "project": "...", "taskId": "...", "executionId": "...",
  "expectedPhase": "turn-3 | in-flight",
  "mode": "STEER | QUEUE",
  "textHash": "sha256(body)",
  "issuer": "discord:<user-id> | cli:<user>",
  "ttlSeconds": 300,
  "createdAt": "..."
}
```

### `ControlDisposition`

```jsonc
{
  "requestId": "ctl_...",
  "actual": "DELIVERED-STEER | DELIVERED-QUEUE | TOO_LATE_QUEUED | DROPPED-EXPIRED | REJECTED-INVALID",
  "engineAck": { "acknowledgedAt": "...", "engineNote": "..." },
  "fallbackUsed": false
}
```

### `ControlReceipt`

```jsonc
{ "requestId": "ctl_...", "issuer": "...", "target": "exec_...",
  "requestedMode": "STEER", "actualDisposition": "DELIVERED-STEER",
  "timestamps": { "issued": "...", "delivered": "...", "ack": "..." },
  "influencedAttempt": "exec_..." }
```

## 3. 語意規則

- **STEER**：對 in-flight attempt 的 bounded follow-up；engine 收到後把它當
  本次 turn 的追加指示，不另開 turn。
- **QUEUE**：FIFO，進下一個 turn 的 backlog（= 現有 `/task` 行為，但加上
  receipt）。
- `expectedPhase` 已過 → 明確轉 `TOO_LATE_QUEUED`，receipt 說明，
  **不 silent fallback**。
- 所有 control request 產 immutable receipt——issuer/target/hash/
  requested-mode/actual-disposition/timestamps 都可回溯。
- 100% delivered controls 可從 final evidence chain 追溯到 request receipt。

## 4. Safety

- `text` 走既有 untrusted-input 規則：長度上限、拒 control-marker
  injection、不可偽造 backlog/system receipt。
- issuer 綁既有 Discord/CLI auth（不另建身份系統）。

## 5. 與現有命令的關係

- `/task <text>` → `mode=QUEUE`（行為不變，多了 receipt）。
- 新增 `/steer <executionId> <text>` → `mode=STEER` + `expectedPhase`。
- `/steer` 的 execution 已完成 → `TOO_LATE_QUEUED`（不自動送進 backlog，
  要 issuer 明確再 QUEUE）。

## 6. 最小可交付（Phase 1）

- ControlRequest/Disposition/Receipt schema + storage。
- Discord `/steer` 指令 + receipt 查詢。
- engine adapter 至少一個支援 `deliverSteer()`；不支援的 engine 回
  `REJECTED-INVALID`（不假裝送達）。
