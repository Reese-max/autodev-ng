// 假 wsl.exe：模擬 agy adapter 眼中的 WSL 介面。每次被呼叫先把 argv 以 JSONL 追記到
// FAKE_WSL_LOG（供測試驗 args 組裝與超時補刀指令），再依 FAKE_MODE 行動。不真打 WSL。
import { appendFileSync } from 'node:fs'

const argv = process.argv.slice(2)
const log = process.env.FAKE_WSL_LOG
if (log) appendFileSync(log, JSON.stringify(argv) + '\n')

// 補刀呼叫（pkill）：只記錄、立即退出（pkill 語意：有無匹配都不干 fake 的事）
if (argv.includes('pkill')) process.exit(0)

const mode = process.env.FAKE_MODE ?? 'ok'
let input = ''
process.stdin.on('data', d => { input += d })
process.stdin.on('end', () => {
  if (mode === 'hang') { setInterval(() => {}, 1000); return } // 永不結束（驗超時補刀）
  if (mode === 'fail') { process.stderr.write('agy: quota exhausted (simulated)\n'); process.exit(3) }
  if (mode === 'empty') { process.exit(0) } // exit 0 零輸出（踩雷 §13）
  if (mode === 'partial') { process.stdout.write('partial work'); process.stderr.write('print-timeout: returning partial output\n'); process.exit(0) }
  // ok：agy 是純文字輸出（無 JSON）——回聲 -p 參數（1.1.4 契約：prompt 走 argv 不走 stdin）
  // 前 800 字供測試驗 prompt 組裝；找不到 -p 時退回 stdin 回聲（防呆）。
  const pIdx = argv.indexOf('-p')
  const prompt = pIdx >= 0 ? (argv[pIdx + 1] ?? '') : input
  if (prompt === 'Reply with exactly: PONG') { process.stdout.write('PONG\n'); process.exit(0) }
  process.stdout.write('AGY-DONE: ' + prompt.slice(0, 800) + '\n')
  process.exit(0)
})
