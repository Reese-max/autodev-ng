# adng patrol loop (ASCII only). Started at logon via Startup .vbs; runs patrol every 3h.
# Pitfall 20: inside hidden startup chain, run children synchronously (no detach).
$ErrorActionPreference = 'Continue'
Start-Sleep -Seconds 900   # let boot storm settle before first patrol
while ($true) {
  try { & (Join-Path $PSScriptRoot 'memory-sweep.ps1') } catch { }
  try { & (Join-Path $PSScriptRoot 'run-patrol.ps1') } catch { }
  Start-Sleep -Seconds 10800
}
