@echo off
REM ============================================================
REM adng-daemons.cmd - multi-project daemon launcher (M10.5)
REM Loops configs\*.json and launches one daemon per config in
REM the background (start /b, no new window). Convention: config
REM basename == data dir name (log path relies on it; a config
REM with a custom dataDir still works, only its console log lands
REM elsewhere).
REM
REM Empirical finding (real testing on this machine): once a
REM daemon holds its own daemon-console.log open via the shell's
REM ">>" redirect (inherited as its stdout for the process's ENTIRE
REM lifetime), Windows blocks ANY other process from opening that
REM same file for writing again -- confirmed with both a second
REM "cmd /c >>log" attempt and a PowerShell Add-Content attempt,
REM both failed with "The process cannot access the file because
REM it is being used by another process." So a naive refire that
REM blindly retries "start /b >>log ... node ..." on a 15-minute
REM schedule would error out before node.js can even launch to
REM hit its own lock-busy path.
REM Fix: pre-check daemon liveness via daemon.lock\pid.json +
REM tasklist and skip the spawn (and the doomed redirect) entirely
REM when a live owner already holds the lock. Task 1's acquireLock
REM (dist/lock.js) remains the sole authority for actual stale-lock
REM reclaim; this pre-check only dodges the Windows file-sharing
REM conflict, it does not duplicate lock semantics (a dead/missing
REM pid always falls through to a normal start attempt, letting
REM acquireLock decide).
REM
REM Pure ASCII only (hard rule 7). Redirection is placed right
REM after "start /b", before the command, not after (pitfall 24: a
REM trailing digit right before a redirection operator can get
REM eaten as a file handle number).
REM ============================================================

setlocal enabledelayedexpansion
set "ADNG_ROOT=D:\Users\Administrator\Desktop\autodev-ng"

for %%F in ("%ADNG_ROOT%\configs\*.json") do (
  set "DATADIR=%ADNG_ROOT%\data\%%~nF"
  if not exist "!DATADIR!" mkdir "!DATADIR!"

  set "ALIVE=0"
  set "LOCKPID="
  set "PIDFILE=!DATADIR!\daemon.lock\pid.json"
  if exist "!PIDFILE!" (
    set "PJLINE="
    set /p PJLINE=<"!PIDFILE!"
    for /f "tokens=2 delims=:" %%A in ("!PJLINE!") do set "PJREST=%%A"
    for /f "delims=," %%B in ("!PJREST!") do set "LOCKPID=%%B"
    if defined LOCKPID (
      tasklist /fi "PID eq !LOCKPID!" 2>nul | find "!LOCKPID!" >nul
      if not errorlevel 1 set "ALIVE=1"
    )
  )

  if "!ALIVE!"=="1" (
    echo skip %%~nF - daemon.lock owned by live pid !LOCKPID!
  ) else (
    start "" /b >>"!DATADIR!\daemon-console.log" 2>&1 node "%ADNG_ROOT%\dist\cli.js" daemon --config "%%~fF"
  )
)
