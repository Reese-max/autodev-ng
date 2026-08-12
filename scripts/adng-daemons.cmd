@echo off
REM ============================================================
REM adng-daemons.cmd - multi-project daemon launcher thin shell
REM Pure ASCII only (hard rule 7).
REM
REM Startup preprocess only: resolve ADNG_ROOT, require built
REM dist\cli.js, then delegate ALL liveness / reap / launch to:
REM   node dist\cli.js supervise --configs-dir <configs> --guardian off
REM
REM Legacy batch pre-checks are intentionally removed.
REM daemon-console.log Windows file-sharing lock behavior
REM (second writer fails while a live daemon holds the log open
REM for its whole lifetime) is enforced inside TS launchDaemon
REM via openSync append + stdio inherit (src\supervisor\supervise.ts).
REM ============================================================

setlocal
set "ADNG_ROOT=D:\Users\Administrator\Desktop\autodev-ng"
set "ADNG_STOP=%ADNG_ROOT%\configs\.adng.stop"
set "ADNG_GATE=%ADNG_ROOT%\scripts\pause-gated-spawn.mjs"

if exist "%ADNG_STOP%" exit /b 0

if not exist "%ADNG_ROOT%\dist\cli.js" (
  echo adng-daemons: missing "%ADNG_ROOT%\dist\cli.js" - run npm run build first
  exit /b 1
)

node "%ADNG_ROOT%\dist\cli.js" supervise --configs-dir "%ADNG_ROOT%\configs" --guardian off

REM patrol-guard piggyback (2026-08-04): watchdog-for-the-watchdog, see adng-patrol-guard.cmd
call "%ADNG_ROOT%\scripts\adng-patrol-guard.cmd"

REM backup-push (2026-08-05): mirror fleet repos to private GitHub.
REM Paths live in backup-push.mjs (read from configs) - cmd stays pure ASCII.
node "%ADNG_GATE%" "%ADNG_STOP%" node.exe "%ADNG_ROOT%\scripts\backup-push.mjs"

REM memory-snapshot (2026-08-05): daily fleet-memory mirror (run.db/BACKLOG/signals).
node "%ADNG_GATE%" "%ADNG_STOP%" node.exe "%ADNG_ROOT%\scripts\memory-snapshot.mjs"

exit /b %ERRORLEVEL%
