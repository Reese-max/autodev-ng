@echo off
REM ============================================================
REM adng-daemon.cmd - scheduled task entry point for autodev-ng
REM Launches the daemon with absolute paths and appends all
REM console output (stdout+stderr) to the daemon console log.
REM Pure ASCII only (hard rule 7). No labels / goto in this file.
REM Redirections are placed at the START of the command line to
REM avoid the trailing-digit handle bug (pitfall 24: a bare digit
REM at end of line right before a redirection gets eaten as a
REM file handle number).
REM ============================================================

set "ADNG_ROOT=D:\Users\Administrator\Desktop\autodev-ng"
set "ADNG_LOG_DIR=%ADNG_ROOT%\data\voice-actress"
set "ADNG_LOG=%ADNG_LOG_DIR%\daemon-console.log"

if not exist "%ADNG_LOG_DIR%" mkdir "%ADNG_LOG_DIR%"

>>"%ADNG_LOG%" 2>&1 node "%ADNG_ROOT%\dist\cli.js" daemon --config "%ADNG_ROOT%\configs\voice-actress.json"
