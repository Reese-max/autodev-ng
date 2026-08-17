// 假 opencode CLI：讀完 stdin 後依 FAKE_OPENCODE_MODE 輸出 NDJSON 事件流。
// 事件形狀取自 2026-07-07 真探針原文（step_start/text/step_finish/error；錯誤走 stdout、stderr 全空）。
const mode = process.env.FAKE_OPENCODE_MODE ?? 'ok'
let input = ''
process.stdin.on('data', d => { input += d })
process.stdin.on('end', () => {
  const emit = o => process.stdout.write(JSON.stringify(o) + '\n')
  if (mode === 'hang') { setInterval(() => {}, 1000); return } // 永不結束
  if (mode === 'badmodel') { // 模型下架形貌：毒行 log 直印 stdout ＋ error 事件，exit 1（實測原文）
    process.stdout.write('[11:03:33.006] ERROR (#10943): failed {\n  _tag: "ProviderModelNotFoundError",\n}\n')
    emit({ type: 'error', timestamp: 1, sessionID: 'ses_x', error: { name: 'UnknownError', data: { message: 'Model not found: zen/no-such-model.' } } })
    process.exit(1)
  }
  if (mode === 'empty') process.exit(0) // exit 0 零輸出 ≠ 成功（規格卡 E11）
  if (mode === 'crash-stderr') { // bun runtime 原生崩潰形貌：stdout 全空、只有 stderr（鐵律 #7 不吞 stderr 測試）
    process.stderr.write('panic: simulated bun segfault at 0xDEADBEEF\n')
    process.exit(134)
  }
  if (mode === 'env-echo') { // 回報收到的 XDG/key env，供隔離注入斷言
    emit({ type: 'text', part: { type: 'text', text: `CFG=${process.env.XDG_CONFIG_HOME} DATA=${process.env.XDG_DATA_HOME} KEY=${process.env.OPENCODE_ZEN_KEY ?? 'none'}` } })
    emit({ type: 'step_finish', part: { type: 'step-finish', tokens: { total: 100 }, cost: 0 } })
    process.exit(0)
  }
  if (mode === 'argv-echo') {
    emit({ type: 'text', part: { type: 'text', text: `ARGS=${process.argv.slice(2).join('|')}` } })
    emit({ type: 'step_finish', part: { type: 'step-finish', tokens: { total: 100 }, cost: 0 } })
    process.exit(0)
  }
  const isPing = /PONG/.test(input)
  emit({ type: 'step_start', part: {} })
  process.stdout.write('not-json poison line {{{\n') // 毒行容錯：非 JSON 行須被靜默跳過
  if (mode === 'two-steps') { // 多步 run：tool 步 + 文字步，各自帶 cost（Σ 驗證）
    emit({ type: 'tool_use', part: { type: 'tool', tool: 'write' } })
    emit({ type: 'step_finish', part: { type: 'step-finish', reason: 'tool-calls', tokens: { total: 24897 }, cost: 0.002 } })
  }
  emit({ type: 'text', part: { type: 'text', text: isPing ? 'PONG' : 'done: ' + input.slice(0, 800) } })
  if (mode === 'no-step') process.exit(0) // 有 text 但無 step_finish：不完整流，不得判成功
  const cost = mode === 'free' ? 0 : 0.001
  emit({ type: 'step_finish', part: { type: 'step-finish', reason: 'stop', tokens: { total: 23949, input: 23925, output: 2, cache: { write: 0, read: 0 } }, cost } })
  process.exit(0)
})
