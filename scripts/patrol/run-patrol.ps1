# adng durable patrol runner (ASCII only). Reads UTF-8 prompt, runs headless Codex GPT.
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$stop = Join-Path $root 'configs\.adng.stop'
if (Test-Path -LiteralPath $stop) { exit 0 }
$allowedSecretEnv = @('CODEX_ACCESS_TOKEN', 'OPENAI_API_KEY')
Get-ChildItem Env: | Where-Object {
  $_.Name -match '(^|_)(api_?key|private_?key|access_?key|token|secret|password|passwd|credentials?|cookie|session|auth|connection_?string)(_|$)' -and
  $allowedSecretEnv -notcontains $_.Name.ToUpperInvariant()
} | ForEach-Object { Remove-Item -LiteralPath "Env:$($_.Name)" -ErrorAction SilentlyContinue }
Remove-Item -LiteralPath 'Env:CODEX_THREAD_ID' -ErrorAction SilentlyContinue
$env:CODEX_HOME = Join-Path $root 'data\autodev-self\codex-home'
$prompt = Get-Content -Raw -Encoding UTF8 (Join-Path $root 'scripts\patrol\patrol-prompt.txt')
$logDir = Join-Path $root 'data\patrol-runs'
$log = Join-Path $logDir ("patrol-" + (Get-Date -Format 'yyyyMMdd-HHmm') + ".log")
Set-Location $root
$gateRunner = Join-Path $root 'scripts\pause-gated-spawn.mjs'
$codexJs = Join-Path $env:APPDATA 'npm\node_modules\@openai\codex\bin\codex.js'
$prompt | & node $gateRunner $stop '--output' $log (Get-Command node.exe -ErrorAction Stop).Source $codexJs exec --model gpt-5.6-luna -c 'model_reasoning_effort=max' -c 'approval_policy=never' -c 'default_permissions="workspace-only"' -c 'permissions.workspace-only.extends=":workspace"' -c 'permissions.workspace-only.filesystem.:root="deny"' -c 'permissions.workspace-only.filesystem.:minimal="read"' -c 'permissions.workspace-only.filesystem.:tmpdir="deny"' -c 'permissions.workspace-only.filesystem.:slash_tmp="deny"' -c 'windows.sandbox="elevated"' --enable code_mode --enable code_mode_host --disable multi_agent --disable multi_agent_v2 --ephemeral --ignore-user-config --strict-config -
