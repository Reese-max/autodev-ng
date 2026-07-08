// 假 copilot CLI：prompt 走 argv（-p），依 FAKE_COPILOT_MODE 輸出 JSONL 事件流。
// 供 copilot adapter 病態注入測試（毒行/巨大 blob/silent-fail/premiumRequests）。
const mode = process.env.FAKE_COPILOT_MODE ?? 'ok'
const pi = process.argv.indexOf('-p')
const prompt = pi >= 0 ? (process.argv[pi + 1] ?? '') : ''

if (mode === 'hang') { setInterval(() => {}, 1000) } else { main() }

function main() {
  if (mode === 'fail') { process.stderr.write('error: copilot quota exhausted (simulated)\n'); process.exit(1) }
  if (mode === 'empty') { process.exit(0) } // silent-fail 形貌 1：exit 0 零輸出
  const emit = obj => process.stdout.write(JSON.stringify(obj) + '\n')
  emit({ type: 'session.started', sessionId: 's-fake' })
  if (mode === 'no-result') { // silent-fail 形貌 2：有事件但無 result 尾事件
    emit({ type: 'assistant.message', text: 'working...' })
    process.exit(0)
  }
  if (mode === 'poison') { // JSONL 毒行：非 JSON、截斷殘行、空白行混雜（Task 3 審查 LOW-1 教訓）
    process.stdout.write('this line is not json at all\n')
    process.stdout.write('{"type":"assistant.mess\n') // 截斷殘行
    process.stdout.write('   \n')
  }
  if (mode === 'blob') { // encrypted blob 巨大行：合法 JSON 但單行 >200k（adapter 應跳過不 parse）
    process.stdout.write(JSON.stringify({ type: 'assistant.message', encryptedContent: 'x'.repeat(250_000) }) + '\n')
    process.stdout.write('y'.repeat(220_000) + '\n') // 巨大且非 JSON 的雙重病態
  }
  const isPing = /PONG/.test(prompt)
  // 回聲 prompt 的長度/頭/尾：供 argv 截長測試驗證（頭保任務開頭、尾保 commit 硬話）
  const echo = isPing ? 'PONG' : `done len=${prompt.length} head=${prompt.slice(0, 80)} tail=${prompt.slice(-200)}`
  emit({ type: 'assistant.message', text: echo })
  emit({
    type: 'result', sessionId: 's-fake', exitCode: mode === 'result-exit-fail' ? 3 : 0,
    usage: {
      premiumRequests: 2, totalApiDurationMs: 1234, sessionDurationMs: 5678,
      codeChanges: { linesAdded: 3, linesRemoved: 1, filesModified: ['a.ts'] }
    }
  })
  process.exit(0)
}
