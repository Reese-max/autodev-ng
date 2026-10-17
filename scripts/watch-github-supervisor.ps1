param([Parameter(Mandatory = $true)][string]$Config, [ValidateSet('issues', 'reports', 'repairs')][string]$Mode = 'issues')
$ErrorActionPreference = 'Stop'
$Mode = $Mode.ToLowerInvariant()
$adngRoot = Split-Path -Parent $PSScriptRoot
$adngConfig = (Resolve-Path -LiteralPath $Config).Path
$adngConfigDir = Split-Path -Parent $adngConfig
# Never resolve a PATH shim, including when launched from Windows PowerShell 5.1.
$adngShell = Join-Path ([Environment]::SystemDirectory) 'WindowsPowerShell\v1.0\powershell.exe'
if (-not (Test-Path -LiteralPath $adngShell -PathType Leaf)) { throw 'Windows PowerShell is required' }

function Read-Settings {
    $value = Get-Content -LiteralPath $adngConfig -Encoding UTF8 -Raw | ConvertFrom-Json
    if (-not ($value.owner -or $value.repo) -or [string]::IsNullOrWhiteSpace($value.dataDir)) {
        throw 'Expected owner or repository and dataDir configuration'
    }
    return $value
}
function Resolve-ConfigPath([string]$Path) {
    if ([IO.Path]::IsPathRooted($Path)) { return [IO.Path]::GetFullPath($Path) }
    return [IO.Path]::GetFullPath((Join-Path $adngConfigDir $Path))
}
$adngSettings = Read-Settings
$adngData = Resolve-ConfigPath $adngSettings.dataDir
$adngModeData = if ($Mode -eq 'repairs') { Join-Path $adngData 'repairs' } else { $adngData }
$adngStateName = if ($Mode -eq 'reports') { 'supervisor-reports.json' } else { 'supervisor.json' }
$adngStateFile = Join-Path $adngModeData $adngStateName
$adngMaxRestarts = 3
$adngBoundedDelayMs = 5000
$adngRestartCount = 0
$adngLastExitCode = $null
$adngChild = $null
$adngJob = $null
$adngGate = $null

function Test-Paused {
    $current = Read-Settings
    # A new owner/data location requires a new invocation, never an implicit takeover.
    if ($current.enabled -isnot [bool] -or -not $current.enabled -or
        $current.owner -ne $adngSettings.owner -or $current.repo -ne $adngSettings.repo -or
        (Resolve-ConfigPath $current.dataDir) -ne $adngData) { return $true }
    if ((Test-Path -LiteralPath (Join-Path $adngData '.adng.stop')) -or
        (Test-Path -LiteralPath (Join-Path $adngModeData '.adng.stop'))) { return $true }
    return ($current.stopFile -and (Test-Path -LiteralPath (Resolve-ConfigPath $current.stopFile)))
}

function Write-State([string]$Status, [Nullable[int]]$ChildPid = $null) {
    # Bounded local state only: no prompts, Issue bodies, secrets or provider output.
    $payload = [ordered]@{
        supervisorPid = $PID; childPid = $ChildPid; status = $Status
        restartCount = $adngRestartCount; lastExitCode = $adngLastExitCode
        timestamp = (Get-Date).ToUniversalTime().ToString('o')
    } | ConvertTo-Json -Compress
    $temp = "$adngStateFile.$PID.tmp"
    try {
        [IO.File]::WriteAllText($temp, $payload, [Text.UTF8Encoding]::new($false))
        if ([IO.File]::Exists($adngStateFile)) { [IO.File]::Replace($temp, $adngStateFile, [NullString]::Value) }
        else { [IO.File]::Move($temp, $adngStateFile) }
    } finally { if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Force } }
}

# The supervisor has its own mutex; the unchanged watcher retains its ownership mutex.
$adngMutexScope = if ($Mode -eq 'reports') { 'reports-' } elseif ($Mode -eq 'repairs') { 'repairs-' } else { '' }
$adngIdentity = if ($adngSettings.repo) { $adngSettings.repo.Replace('/', '-') } else { $adngSettings.owner }
$adngMutex = New-Object Threading.Mutex($false, ('Local\adng-github-supervisor-' + $adngMutexScope + $adngIdentity))
$adngAcquired = $false
try {
    try { $adngAcquired = $adngMutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $adngAcquired = $true }
    if (-not $adngAcquired) { return }
    New-Item -ItemType Directory -Path $adngModeData -Force | Out-Null
    if (Test-Paused) { Write-State 'paused'; return }

    # Reuse main's supervise-github-owner.ps1 Job Object bootstrap (PR #108).
    # Membership follows native descendants, even when their watcher is terminated.
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
        # Attach before allowing any watcher work; a parent crash before attachment times out the bootstrap.
        $adngLaunch = "`$ErrorActionPreference = 'Stop'; `$gate = [Threading.EventWaitHandle]::OpenExisting('$adngGateName'); " +
            "try { if (-not `$gate.WaitOne(30000)) { exit 1 } } finally { `$gate.Dispose() }; " +
            "& '$((Join-Path $PSScriptRoot 'watch-github-owner.ps1').Replace("'", "''"))' -Config '$($adngConfig.Replace("'", "''"))' -Mode '$Mode'; if (-not `$?) { if (`$LASTEXITCODE) { exit `$LASTEXITCODE }; exit 1 }"
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
        if (-not $adngPaused) { $adngLastExitCode = $adngChild.ExitCode }
        $adngJob.Stop() # Prove zero old workers before starting any replacement.
        $adngJob.Dispose(); $adngJob = $null
        $adngChild.Dispose(); $adngChild = $null
        $adngGate.Dispose(); $adngGate = $null
        if ($adngPaused -or (Test-Paused)) { Write-State 'paused'; break }
        # A clean exit includes the watcher's mutex refusal; never fight its owner.
        if ($adngLastExitCode -eq 0) { Write-State 'stopped'; break }
        if ($adngRestartCount -ge $adngMaxRestarts) { Write-State 'stopped-max-restarts'; exit 1 }
        Write-State 'child-exited'
        $adngDelay = [Diagnostics.Stopwatch]::StartNew()
        while ($adngDelay.ElapsedMilliseconds -lt $adngBoundedDelayMs) {
            if (Test-Paused) { break }
            Start-Sleep -Milliseconds ([Math]::Max(1, [Math]::Min(250, $adngBoundedDelayMs - $adngDelay.ElapsedMilliseconds)))
        }
        if (Test-Paused) { Write-State 'paused'; break }
        $adngRestartCount++
    }
} catch {
    if ($adngJob) { $adngJob.Dispose(); $adngJob = $null }
    if ($adngAcquired) { try { Write-State 'error' } catch {} }
    throw 'GitHub watcher supervision failed; no restart was attempted'
} finally {
    try {
        if ($adngJob) { $adngJob.Dispose() }
    } finally {
        try {
            if ($adngChild) {
                try {
                    # Only an unstarted bootstrap can escape job assignment on error.
                    if (-not $adngChild.HasExited) { $adngChild.Kill(); $adngChild.WaitForExit(5000) | Out-Null }
                } catch [InvalidOperationException] {
                    # It may exit between HasExited and Kill; continue releasing ownership.
                } finally { $adngChild.Dispose() }
            }
        } finally {
            try { if ($adngGate) { $adngGate.Dispose() } }
            finally {
                try { if ($adngAcquired) { $adngMutex.ReleaseMutex() } }
                finally { $adngMutex.Dispose() }
            }
        }
    }
}
