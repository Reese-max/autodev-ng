@echo off
REM adng-patrol-guard: relaunch patrol-loop.ps1 if the pwsh loop died (ASCII only).
setlocal
for %%I in ("%~dp0..") do set "ADNG_ROOT=%%~fI"
set "ADNG_STOP=%ADNG_ROOT%\configs\.adng.stop"
if exist "%ADNG_STOP%" exit /b 0
powershell -NoProfile -NonInteractive -Command "if (Get-CimInstance Win32_Process -Filter \"Name='pwsh.exe'\" | Where-Object { $_.CommandLine -match 'patrol-loop' }) { exit 0 } else { exit 1 }"
if not errorlevel 1 exit /b 0
node "%ADNG_ROOT%\scripts\pause-gated-spawn.mjs" "%ADNG_STOP%" wscript.exe "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\adng-patrol.vbs"
exit /b %ERRORLEVEL%
