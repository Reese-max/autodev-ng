@echo off
REM adng-patrol-guard: relaunch patrol-loop.ps1 if the pwsh loop died (ASCII only).
REM Detection uses powershell.exe (guard) vs pwsh.exe (loop) so the guard never
REM self-matches. Startup vbs is the single blessed launcher (hidden window).
powershell -NoProfile -Command "if (-not (Get-CimInstance Win32_Process -Filter \"Name='pwsh.exe'\" | Where-Object { $_.CommandLine -match 'patrol-loop' })) { Start-Process wscript.exe -ArgumentList '\"C:\Users\Administrator\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\adng-patrol.vbs\"' }"
