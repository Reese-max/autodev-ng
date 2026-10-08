[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Config,
  [ValidateSet('issues', 'reports', 'repairs')][string]$Mode = 'issues',
  [ValidateRange(1000, 60000)][int]$RestartDelayMs = 5000
)
$ErrorActionPreference = 'Stop'
$Mode = $Mode.ToLowerInvariant()
$adngRoot = Split-Path -Parent $PSScriptRoot
$adngConfig = (Resolve-Path -LiteralPath $Config).Path
$adngConfigDir = Split-Path -Parent $adngConfig
# A PATH shim can exit before the watcher it launched. Own the real process instead.
$adngShell = Join-Path ([Environment]::SystemDirectory) 'WindowsPowerShell\v1.0\powershell.exe'
if (-not (Test-Path -LiteralPath $adngShell -PathType Leaf)) { throw 'Windows PowerShell is required' }

function Read-Settings {
  $adngValue = Get-Content -LiteralPath $adngConfig -Encoding UTF8 -Raw | ConvertFrom-Json
  if (-not ($adngValue.owner -or $adngValue.repo) -or [string]::IsNullOrWhiteSpace($adngValue.dataDir)) {
    throw 'Expected owner or repository and dataDir configuration'
  }
  return $adngValue
}
function Resolve-ConfigPath([string]$Path) {
  if ([IO.Path]::IsPathRooted($Path)) { return [IO.Path]::GetFullPath($Path) }
  return [IO.Path]::GetFullPath((Join-Path $adngConfigDir $Path))
}
$adngSettings = Read-Settings
$adngData = Resolve-ConfigPath $adngSettings.dataDir
$adngModeData = if ($Mode -eq 'repairs') { Join-Path $adngData 'repairs' } else { $adngData }
$adngState = Join-Path $adngModeData "supervisor-$Mode.json"
function Test-Paused {
  $adngCurrent = Read-Settings
  # Changing ownership or data location requires a new invocation, never an implicit takeover.
  if ($adngCurrent.enabled -isnot [bool] -or -not $adngCurrent.enabled -or
      $adngCurrent.owner -ne $adngSettings.owner -or $adngCurrent.repo -ne $adngSettings.repo -or
      (Resolve-ConfigPath $adngCurrent.dataDir) -ne $adngData) { return $true }
  if ((Test-Path -LiteralPath (Join-Path $adngData '.adng.stop')) -or
      (Test-Path -LiteralPath (Join-Path $adngModeData '.adng.stop'))) { return $true }
  return ($adngCurrent.stopFile -and (Test-Path -LiteralPath (Resolve-ConfigPath $adngCurrent.stopFile)))
}
$adngHash = [Security.Cryptography.SHA256]::Create()
try {
  $adngKey = [Text.Encoding]::UTF8.GetBytes(($adngConfig.ToUpperInvariant() + '|' + $Mode))
  $adngId = [BitConverter]::ToString($adngHash.ComputeHash($adngKey)).Replace('-', '')
} finally { $adngHash.Dispose() }
$adngMutex = New-Object Threading.Mutex($false, ('Local\adng-github-supervisor-' + $adngId))
$adngAcquired = $false
$adngChild = $null
$adngJob = $null
$adngGate = $null
$adngRestartCount = 0
$adngLastExit = $null

function Write-State([string]$Status, [int]$ChildPid = 0) {
  $adngPayload = [ordered]@{
    supervisorPid = $PID; childPid = $ChildPid; status = $Status
    restartCount = $adngRestartCount; lastExitCode = $adngLastExit
    timestamp = (Get-Date).ToUniversalTime().ToString('o')
  } | ConvertTo-Json -Compress
  $adngTemp = "$adngState.$PID.tmp"
  try {
    [IO.File]::WriteAllText($adngTemp, $adngPayload, [Text.UTF8Encoding]::new($false))
    Move-Item -LiteralPath $adngTemp -Destination $adngState -Force
  } finally { if (Test-Path -LiteralPath $adngTemp) { Remove-Item -LiteralPath $adngTemp -Force } }
}

try {
  try { $adngAcquired = $adngMutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $adngAcquired = $true }
  if (-not $adngAcquired) { return }
  New-Item -ItemType Directory -Path $adngModeData -Force | Out-Null
  if (Test-Paused) { Write-State 'paused'; return }

  # Job membership follows native descendants, even after the watcher dies. No PID-based reaping.
  # https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects
  Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;
public sealed class AdngWatcherJob : IDisposable {
  [StructLayout(LayoutKind.Sequential)] struct BasicLimits {
    public long ProcessTime, JobTime; public uint Flags;
    public UIntPtr MinimumWorkingSet, MaximumWorkingSet; public uint ActiveProcessLimit;
    public UIntPtr Affinity; public uint PriorityClass, SchedulingClass;
  }
  [StructLayout(LayoutKind.Sequential)] struct Limits {
    public BasicLimits Basic;
    public ulong ReadOperations, WriteOperations, OtherOperations, ReadBytes, WriteBytes, OtherBytes;
    public UIntPtr ProcessMemory, JobMemory, PeakProcessMemory, PeakJobMemory;
  }
  [StructLayout(LayoutKind.Sequential)] struct Accounting {
    public long UserTime, KernelTime, PeriodUserTime, PeriodKernelTime;
    public uint PageFaults, TotalProcesses, ActiveProcesses, TerminatedProcesses;
  }
  [DllImport("kernel32.dll", SetLastError=true)] static extern IntPtr CreateJobObject(IntPtr attributes, string name);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool SetInformationJobObject(IntPtr job, int kind, ref Limits limits, int size);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool TerminateJobObject(IntPtr job, uint code);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool QueryInformationJobObject(IntPtr job, int kind, out Accounting data, int size, IntPtr returned);
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);
  IntPtr handle;
  static void Check(bool success) { if (!success) throw new Win32Exception(Marshal.GetLastWin32Error()); }
  public AdngWatcherJob() {
    handle = CreateJobObject(IntPtr.Zero, null); Check(handle != IntPtr.Zero);
    var limits = new Limits(); limits.Basic.Flags = 0x2000; // JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
    try { Check(SetInformationJobObject(handle, 9, ref limits, Marshal.SizeOf(typeof(Limits)))); }
    catch { Dispose(); throw; }
  }
  public void Attach(IntPtr process) { Check(AssignProcessToJobObject(handle, process)); }
  public void Stop() {
    Check(TerminateJobObject(handle, 1));
    var clock = Stopwatch.StartNew();
    do {
      Accounting data;
      Check(QueryInformationJobObject(handle, 1, out data, Marshal.SizeOf(typeof(Accounting)), IntPtr.Zero));
      if (data.ActiveProcesses == 0) return;
      Thread.Sleep(50);
    } while (clock.ElapsedMilliseconds < 5000);
    throw new TimeoutException("Watcher job did not stop");
  }
  public void Dispose() { if (handle != IntPtr.Zero) { CloseHandle(handle); handle = IntPtr.Zero; } }
}
'@

  while ($true) {
    if (Test-Paused) { Write-State 'paused'; break }
    $adngJob = [AdngWatcherJob]::new()
    $adngGateName = 'Local\adng-watcher-start-' + [Guid]::NewGuid().ToString('N')
    $adngGate = [Threading.EventWaitHandle]::new($false, [Threading.EventResetMode]::ManualReset, $adngGateName)
    # The child cannot run the watcher until attached to our job. Timeout also covers a parent crash before attachment.
    $adngLaunch = "`$ErrorActionPreference = 'Stop'; `$gate = [Threading.EventWaitHandle]::OpenExisting('$adngGateName'); " +
      "try { if (-not `$gate.WaitOne(30000)) { exit 1 } } finally { `$gate.Dispose() }; " +
      "& '$((Join-Path $PSScriptRoot 'watch-github-owner.ps1').Replace("'", "''"))' -Config '$($adngConfig.Replace("'", "''"))' -Mode '$Mode'; if (-not `$?) { exit 1 }"
    $adngEncoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($adngLaunch))
    Write-State 'starting'
    $adngChild = Start-Process -FilePath $adngShell -ArgumentList @(
      '-NoLogo', '-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', $adngEncoded
    ) -WorkingDirectory $adngRoot -WindowStyle Hidden -PassThru
    $adngJob.Attach($adngChild.Handle)
    $adngPaused = Test-Paused
    if (-not $adngPaused) {
      $adngGate.Set() | Out-Null
      Write-State 'running' $adngChild.Id
      while (-not $adngChild.WaitForExit(250)) {
        if (Test-Paused) { $adngPaused = $true; break }
      }
    }
    if (-not $adngPaused) { $adngLastExit = $adngChild.ExitCode }
    $adngJob.Stop() # Prove zero old workers before releasing the job or starting a replacement.
    $adngJob.Dispose(); $adngJob = $null
    $adngChild.Dispose(); $adngChild = $null
    $adngGate.Dispose(); $adngGate = $null
    if ($adngPaused -or (Test-Paused)) { Write-State 'paused'; break }
    # A clean exit includes the existing watcher's mutex refusal; never fight that owner.
    if ($adngLastExit -eq 0) { Write-State 'stopped'; break }
    Write-State 'child-exited'
    $adngDelay = [Diagnostics.Stopwatch]::StartNew()
    while ($adngDelay.ElapsedMilliseconds -lt $RestartDelayMs) {
      if (Test-Paused) { break }
      Start-Sleep -Milliseconds ([Math]::Max(1, [Math]::Min(250, $RestartDelayMs - $adngDelay.ElapsedMilliseconds)))
    }
    if (Test-Paused) { Write-State 'paused'; break }
    $adngRestartCount++
  }
} catch {
  if ($adngJob) { $adngJob.Dispose(); $adngJob = $null }
  if ($adngAcquired) { Write-State 'error' }
  throw 'GitHub watcher supervision failed; no restart was attempted'
} finally {
  if ($adngJob) { $adngJob.Dispose() }
  if ($adngChild) {
    # Only an unstarted bootstrap can escape job assignment on an error.
    if (-not $adngChild.HasExited) { $adngChild.Kill(); $adngChild.WaitForExit(5000) | Out-Null }
    $adngChild.Dispose()
  }
  if ($adngGate) { $adngGate.Dispose() }
  if ($adngAcquired) { $adngMutex.ReleaseMutex() }
  $adngMutex.Dispose()
}
