// 假 grok CLI：prompt 走 --prompt-file（讀檔），依 FAKE_GROK_MODE 輸出單一 JSON。
// 供 grok adapter 病態注入測試（毒行/telemetry 雜訊/silent-fail/prompt-file 寫入與清理）。
import { readFileSync } from 'node:fs'

const mode = process.env.FAKE_GROK_MODE ?? 'ok'
const fi = process.argv.indexOf('--prompt-file')
const file = fi >= 0 ? (process.argv[fi + 1] ?? '') : ''
let content = ''
try { content = readFileSync(file, 'utf8') } catch { /* 缺檔時 content 留空，交給斷言抓 */ }

// 例行 telemetry 雜訊（規格卡實錄樣式）：每個 mode 都吐，成功路徑不得滲進 output
process.stderr.write('ExportError: fetch to https://cli-chat-proxy.grok.com/v1/traces timed out\n')

if (mode === 'hang') { setInterval(() => {}, 1000) } else { main() }

function main() {
  if (mode === 'fail') {
    // 真錯誤行混在 telemetry 雜訊間：adapter 應濾掉雜訊、留下真錯誤（file= 供清理斷言）
    process.stderr.write(`error: grok credit exhausted (simulated) file=${file}\n`)
    process.exit(1)
  }
  if (mode === 'empty') { process.exit(0) } // silent-fail 形貌 1：exit 0 零輸出
  if (mode === 'unparseable') { process.stdout.write('I did the thing! (not json)\n'); process.exit(0) }
  if (mode === 'poison') { // 毒行：JSON 前混雜非 JSON 行（防禦性取最後可解析行）
    process.stdout.write('warming up mcp servers...\n')
    process.stdout.write('{"truncated":\n')
  }
  const isPing = /PONG/.test(content)
  const bom = content.charCodeAt(0) === 0xfeff ? 1 : 0
  const cr = (content.match(/\r/g) ?? []).length
  // 回聲 prompt-file 路徑/長度/頭尾/編碼特徵：供「寫入與清理」「UTF-8 無 BOM、LF」斷言
  const text = isPing
    ? 'PONG'
    : `done file=${file} len=${content.length} bom=${bom} cr=${cr} head=${content.slice(0, 40)} tail=${content.slice(-60)}`
  const obj = { text, stopReason: 'EndTurn', sessionId: 's-fake', requestId: 'r-fake' }
  // 真探針實錄：真 grok 輸出 pretty-printed 多行 JSON → 預設鏡射；oneline 模式驗單行兼容
  process.stdout.write(JSON.stringify(obj, null, mode === 'oneline' ? 0 : 2) + '\n')
  process.exit(0)
}
