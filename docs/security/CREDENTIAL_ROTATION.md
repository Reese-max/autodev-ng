# Credential Rotation and Secret Handling Policy

## Background

In response to Issue #3 (`[P0][50-persona] Remove and rotate committed judge credential material`), tracked config files under `configs/` were found to contain a committed `judgeApiKey` token.

## Remediation Actions Taken

1. **Placeholder & Secret Reference Migration**:
   - All tracked configurations under `configs/` have been updated to replace committed keys with `{env:JUDGE_API_KEY}`.
   - `assemble.ts` now supports resolving secrets via `{env:VAR}`, `${env:VAR}`, `${VAR}`, or `{file:PATH}`.
   - `telegramBotToken` also supports the same secret resolution syntax.

2. **Secret Scanning in CI / Pre-Commit**:
   - Added `scripts/check-secrets.mjs` and hooked into `npm run typecheck` and `npm run check-secrets`.
   - Prevents unredacted tokens matching `sk-proxypilot-*`, `sk-*`, or Telegram bot token patterns from being committed.

3. **Status Payload & Logging Boundaries**:
   - `web/server.mjs` strictly allowlists exported fields; sensitive keys (`judgeApiKey`, `discordTokenFile`, etc.) are never serialized in API responses or public logs (verified by `tests/web-server.test.ts`).

4. **Git History Rewriting Decision**:
   - **Status**: The repository is private. Rewriting history with `git filter-repo` would invalidate existing commit SHAs and branches across local checkouts and active worktrees.
   - **Decision**: In accordance with industry best practice, the exposed credential was revoked and rotated at the issuing proxy service provider. Invalidation at the provider renders historical references in commits non-functional and eliminates exposure risk without requiring destructive history rewriting.
