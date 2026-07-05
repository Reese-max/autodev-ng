// 假 CLI：讀完 stdin 後依 FAKE_MODE 行動。供 proc/engine 病態注入測試。
const mode = process.env.FAKE_MODE ?? 'ok'
let input = ''
process.stdin.on('data', d => { input += d })
process.stdin.on('end', async () => {
  if (mode === 'hang') { setInterval(() => {}, 1000); return } // 永不結束
  if (mode === 'fail') { process.stderr.write('boom: simulated 429\n'); process.exit(3) }
  if (mode === 'empty') { process.exit(0) } // 零輸出但 exit 0（踩雷 §13）
  if (mode === 'slow') { await new Promise(r => setTimeout(r, 300)) }
  const isPing = /PONG/.test(input)
  process.stdout.write(JSON.stringify({
    type: 'result', subtype: 'success', is_error: false,
    result: isPing ? 'PONG' : 'done: ' + input.slice(0, 40),
    total_cost_usd: 0.123
  }) + '\n')
  process.exit(0)
})
