@echo off
REM ============================================================
REM adng-bot.cmd - scheduled task entry point for the autodev-ng
REM Discord bot. Mirrors adng-daemon.cmd: absolute paths, output
REM appended to a console log, pure ASCII only (hard rule 7),
REM no labels / goto, redirections at the START of the command
REM line (pitfall 24: trailing digit before a redirection gets
REM eaten as a file handle number).
REM The bot holds its own lock (bot.lock) so repeated triggers
REM are harmless and double as auto-respawn.
REM ============================================================

set "ADNG_ROOT=D:\Users\Administrator\Desktop\autodev-ng"
set "ADNG_LOG_DIR=%ADNG_ROOT%\data\voice-actress"
set "ADNG_LOG=%ADNG_LOG_DIR%\bot-console.log"

if not exist "%ADNG_LOG_DIR%" mkdir "%ADNG_LOG_DIR%"

>>"%ADNG_LOG%" 2>&1 node "%ADNG_ROOT%\dist\bot\index.js" --config "%ADNG_ROOT%\configs\voice-actress.json"
