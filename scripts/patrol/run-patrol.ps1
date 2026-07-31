# adng durable patrol runner (ASCII only). Reads UTF-8 prompt, runs headless claude.
$ErrorActionPreference = 'Continue'
$root = 'D:\Users\Administrator\Desktop\autodev-ng'
$prompt = Get-Content -Raw -Encoding UTF8 (Join-Path $root 'scripts\patrol\patrol-prompt.txt')
$logDir = Join-Path $root 'data\patrol-runs'
New-Item -ItemType Directory -Force $logDir | Out-Null
$log = Join-Path $logDir ("patrol-" + (Get-Date -Format 'yyyyMMdd-HHmm') + ".log")
Set-Location $root
'' | & claude -p $prompt --dangerously-skip-permissions *> $log
"exit=$LASTEXITCODE" | Out-File -Append -Encoding UTF8 $log
