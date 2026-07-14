@echo off
REM ============================================================
REM adng-web.cmd - scheduled task entry point for the autodev-ng
REM web console. Mirrors adng-bot.cmd: absolute paths, output
REM appended to a console log, pure ASCII only (hard rule 7),
REM no labels / goto, redirections at the START of the command
REM line (pitfall 24: trailing digit before a redirection gets
REM eaten as a file handle number).
REM The web server has NO lock of its own (unlike bot/daemon).
REM Under the 15-minute Repetition trigger, a second instance
REM would try to bind port 3900 and fail with EADDRINUSE, then
REM exit immediately -- effectively single-instance in practice,
REM same net effect as bot.lock (see install-web-task.ps1).
REM ============================================================

set "ADNG_ROOT=D:\Users\Administrator\Desktop\autodev-ng"
set "ADNG_LOG_DIR=%ADNG_ROOT%\data"
set "ADNG_LOG=%ADNG_LOG_DIR%\web-console.log"

if not exist "%ADNG_LOG_DIR%" mkdir "%ADNG_LOG_DIR%"

>>"%ADNG_LOG%" 2>&1 node "%ADNG_ROOT%\web\server.mjs" --configs-dir "%ADNG_ROOT%\configs"
