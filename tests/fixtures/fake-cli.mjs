// 假 CLI：讀完 stdin 後依 FAKE_MODE 行動。供 proc/engine 病態注入測試。
import { spawn } from 'node:child_process'

const mode = process.env.FAKE_MODE ?? 'ok'
let input = ''
process.stdin.on('data', d => { input += d })
process.stdin.on('end', async () => {
  if (mode === 'hang') { setInterval(() => {}, 1000); return } // 永不結束
  if (mode === 'hang-tree') {
    // 孫進程也 hang，驗證雙層樹斬（taskkill /T /F）覆蓋到孫層，不是只殺子層
    const grandchild = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
      detached: false,
      stdio: ['ignore', 'ignore', 'ignore']
    })
    process.stderr.write(`CHILD_PID=${grandchild.pid}\n`)
    setInterval(() => {}, 1000) // 自己也永不結束
    return
  }
  if (mode === 'hang-worktree-lock') {
    const lockFile = process.env.FAKE_LOCK_FILE
    if (!lockFile) throw new Error('FAKE_LOCK_FILE is required')
    const lockScript = [
      "$ErrorActionPreference = 'Stop'",
      "$fs = [System.IO.File]::Open($env:FAKE_LOCK_FILE, 'Open', 'ReadWrite', 'Read')",
      "[Console]::Error.WriteLine('WORKTREE_LOCK_READY')",
      '[Console]::Error.Flush()',
      'while ($true) { Start-Sleep -Seconds 1 }',
    ].join('; ')
    const locker = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', lockScript], {
      env: process.env,
      stdio: ['ignore', 'ignore', 'pipe'],
    })
    locker.stderr.setEncoding('utf8')
    locker.stderr.on('data', chunk => {
      if (chunk.includes('WORKTREE_LOCK_READY')) {
        process.stderr.write('WORKTREE_LOCK_READY\n')
        setInterval(() => {}, 1000)
      }
    })
    return
  }
  if (mode === 'fail') { process.stderr.write('boom: simulated 429\n'); process.exit(3) }
  if (mode === 'empty') { process.exit(0) } // 零輸出但 exit 0（踩雷 §13）
  if (mode === 'slow') { await new Promise(r => setTimeout(r, 300)) }
  const isPing = /PONG/.test(input)
  process.stdout.write(JSON.stringify({
    type: 'result', subtype: 'success', is_error: false,
    // 回聲前 800 字：足以覆蓋 engine prompt 全文（含 directive 尾段），供測試驗證 prompt 組裝
    result: isPing ? 'PONG' : 'done: ' + input.slice(0, 800),
    total_cost_usd: 0.123
  }) + '\n')
  process.exit(0)
})
