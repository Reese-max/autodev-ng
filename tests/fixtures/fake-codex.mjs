// 假 codex CLI：讀完 stdin 後依 FAKE_CODEX_MODE 輸出 JSONL 事件流。供 codex adapter 病態注入測試。
const mode = process.env.FAKE_CODEX_MODE ?? 'ok'
let input = ''
process.stdin.on('data', d => { input += d })
process.stdin.on('end', () => {
  if (mode === 'hang') { setInterval(() => {}, 1000); return } // 永不結束
  if (mode === 'fail') { process.stderr.write('stream error: simulated 429 Too Many Requests\n'); process.exit(1) }
  if (mode === 'empty') { process.exit(0) } // silent-fail 形貌 1：exit 0 零輸出
  const emit = obj => process.stdout.write(JSON.stringify(obj) + '\n')
  emit({ type: 'thread.started', thread_id: 't-fake' })
  emit({ type: 'turn.started' })
  if (mode === 'no-turn') { process.exit(0) } // silent-fail 形貌 2：exit 0、有事件但無 turn.completed
  if (mode === 'poison') { // 毒行混流：垃圾行＋半截 JSON 行夾在合法事件之間（M5 小修 7 專測）
    process.stdout.write('GARBAGE not-json line ###\n')
    emit({ type: 'item.completed', item: { type: 'agent_message', text: 'done: poison-mode' } })
    process.stdout.write('{"type":"item.completed","item":{"type":"agent_m\n') // 半截 JSON（截斷殘行）
    emit({ type: 'turn.completed', usage: { input_tokens: 7, cached_input_tokens: 0, output_tokens: 3 } })
    process.exit(0)
  }
  if (mode === 'env') {
    emit({ type: 'item.completed', item: { type: 'agent_message', text: JSON.stringify({
      home: process.env.CODEX_HOME,
      safe: process.env.ADNG_TEST_SAFE,
      dropped: process.env.ADNG_TEST_SECRET_TOKEN,
      allowed: process.env.ADNG_TEST_ALLOWED_TOKEN,
      thread: process.env.CODEX_THREAD_ID,
    }) } })
    emit({ type: 'turn.completed', usage: { input_tokens: 1, cached_input_tokens: 0, output_tokens: 1 } })
    process.exit(0)
  }
  const isPing = /PONG/.test(input)
  // 回聲前 800 字：足以覆蓋 engine prompt 全文（含 directive 尾段），供測試驗證 prompt 組裝
  emit({ type: 'item.completed', item: { type: 'agent_message', text: isPing ? 'PONG' : 'done: ' + input.slice(0, 800) } })
  emit({ type: 'turn.completed', usage: { input_tokens: 20804, cached_input_tokens: 0, output_tokens: 39 } })
  process.exit(mode === 'pong-fail' ? 7 : 0)
})
