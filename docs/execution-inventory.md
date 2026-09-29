# Execution inventory recovery

Execution receipts are split between `executions/active` and `executions/history`. The active directory is bounded and consulted for scheduler admission; history remains addressable by execution ID and is not scanned during admission.

Inventory updates use `executions/.inventory.lock`. If the lock owner is stale or cannot be verified, autodev fails closed and leaves the lock in place. It does not remove a lock by path because another process could acquire a replacement between a stale check and unlink.

To recover a stale lock, stop the scheduler first. Read the lock owner fields (`pid`, `processStartedAt`, and `acquiredAt`) and verify that the recorded process no longer owns the inventory. If the owner is malformed or its state cannot be verified, keep the scheduler stopped until an operator can establish that no writer is active. After confirming there is no live owner, remove only `executions/.inventory.lock` and restart the scheduler. Do not delete or edit files under `active`, `history`, or `quarantine` as part of lock recovery.
