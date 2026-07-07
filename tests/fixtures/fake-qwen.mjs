// 假 qwen CLI：prompt 走 stdin，依 FAKE_QWEN_MODE 輸出 JSON 陣列 [init, assistant, result]。
// 供 qwen adapter 病態注入測試（毒行/exit≠0 is_error JSON/silent-fail/tokens/stats.models）。
const mode = process.env.FAKE_QWEN_MODE ?? 'ok'

if (mode === 'hang') {
  setInterval(() => {}, 1000)
} else {
  let prompt = ''
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', d => { prompt += d })
  process.stdin.on('end', () => main(prompt))
}

function main(prompt) {
  if (mode === 'empty') process.exit(0) // silent-fail 形貌 1：exit 0 零輸出
  if (mode === 'fail') {
    // 規格卡探針 1 形貌：exit 1 且錯誤走 stdout 的 result 事件（is_error＋error.message）
    process.stdout.write(JSON.stringify([{
      type: 'result', subtype: 'error_during_execution', is_error: true,
      error: { message: 'Qwen OAuth 免費額度已於 2026-04-15 停用 (simulated)' }
    }]) + '\n')
    process.exit(1)
  }
  const init = { type: 'init', session_id: 's-fake' }
  if (mode === 'no-result') { // silent-fail 形貌 2：有事件但無 result 事件
    process.stdout.write(JSON.stringify([init, { type: 'assistant', message: 'working...' }]) + '\n')
    process.exit(0)
  }
  if (mode === 'is-error-exit0') { // 防禦分支：exit 0 但 result 自報 is_error
    process.stdout.write(JSON.stringify([init, {
      type: 'result', subtype: 'error_max_turns', is_error: true, error: { message: 'max turns exceeded (simulated)' }
    }]) + '\n')
    process.exit(0)
  }
  if (mode === 'poison') { // 毒行：非 JSON/截斷殘行/空白行混雜，合法 JSON 陣列縮在其中一行
    process.stdout.write('Loaded cached credentials.\n')
    process.stdout.write('{"type":"assist\n') // 截斷殘行
    process.stdout.write('   \n')
    process.stdout.write('y'.repeat(220_000) + '\n') // 超長非 JSON 行（不應進 parse）
  }
  const isPing = /PONG/.test(prompt)
  // 回聲 prompt 長度/尾端＋argv：驗 stdin 送達與 baseUrl/apiKey/model 旗標組裝
  const echo = isPing ? 'PONG' : `done len=${prompt.length} tail=${prompt.slice(-120)} argv=${process.argv.slice(2).join(' ')}`
  const events = [init, { type: 'assistant', message: echo }, {
    type: 'result', subtype: 'success', is_error: false, duration_ms: 21000, num_turns: 2,
    result: echo,
    usage: { input_tokens: 20804, output_tokens: 39, cache_read_input_tokens: 0, total_tokens: 31000 },
    stats: {
      models: { 'gpt-5.4-mini': { api: { totalRequests: 3 }, tokens: { input: 20804, output: 39 } } }, // 真探針實測巢狀形
      tools: { totalCalls: 0 }, files: { totalLinesAdded: 1, totalLinesRemoved: 0 }
    },
    permission_denials: []
  }]
  process.stdout.write(JSON.stringify(events) + '\n')
  process.exit(0)
}
