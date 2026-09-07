@echo off
REM ============================================================
REM adng-guardian.cmd - fleet guardian launcher thin shell
REM Pure ASCII only (hard rule 7). Mirrors adng-daemons.cmd.
REM
REM Startup preprocess only: resolve ADNG_ROOT, require built
REM dist\cli.js, then delegate everything to:
REM   node dist\cli.js supervise --configs-dir <configs> --guardian only
REM
REM Meant to be launched via openab\run-hidden.vbs so no console
REM window is shown (pitfall 25). node stays attached to the
REM hidden console - no detach inside the hidden chain
REM (pitfall 20). Guardian holds its own patrol lock, so repeated
REM triggers are harmless (concurrent runs log "locked" and skip).
REM ============================================================

setlocal
for %%I in ("%~dp0..") do set "ADNG_ROOT=%%~fI"

if exist "%ADNG_ROOT%\configs\.adng.stop" exit /b 0

if not exist "%ADNG_ROOT%\dist\cli.js" (
  echo adng-guardian: missing "%ADNG_ROOT%\dist\cli.js" - run npm run build first
  exit /b 1
)

node "%ADNG_ROOT%\dist\cli.js" supervise --configs-dir "%ADNG_ROOT%\configs" --guardian only
exit /b %ERRORLEVEL%
