// 假 devin CLI：prompt 走 --prompt-file（讀檔），export 走 --export（寫 ATIF-v1.7 風 JSON），
// 依 FAKE_DEVIN_MODE 決定行為。供 devin adapter 病態注入測試（export 解析/no-commit/
// silent-fail/stderr fallback/prompt-file+export 清理）。
import { readFileSync, writeFileSync } from 'node:fs'

const mode = process.env.FAKE_DEVIN_MODE ?? 'ok'
const pi = process.argv.indexOf('--prompt-file')
const promptFile = pi >= 0 ? (process.argv[pi + 1] ?? '') : ''
const ei = process.argv.indexOf('--export')
const exportFile = ei >= 0 ? (process.argv[ei + 1] ?? '') : ''
let content = ''
try { content = readFileSync(promptFile, 'utf8') } catch { /* 缺檔時 content 留空，交給斷言抓 */ }

if (mode === 'hang') { setInterval(() => {}, 1000) } else { main() }

function writeExport(steps) {
  const exp = {
    schema_version: 'ATIF-v1.7', session_id: 's-fake',
    agent: { name: 'devin', model_name: 'swe-1.6', extra: { backend: 'Windsurf', permission_mode: 'Bypass' } },
    steps,
    final_metrics: { total_prompt_tokens: 1234, total_completion_tokens: 56, total_cached_tokens: 0, total_steps: steps.length }
  }
  try { writeFileSync(exportFile, JSON.stringify(exp)) } catch { /* export 寫入失敗場景不炸 fixture 本身 */ }
}

function main() {
  const isPing = /PONG/.test(content)
  if (mode === 'fail') {
    process.stderr.write(`error: devin credit exhausted (simulated) promptFile=${promptFile}\n`)
    process.exit(1)
  }
  if (mode === 'no-export') { // silent-fail 形貌 1：exit 0 但沒寫 export 檔
    process.stdout.write('完成。(no export written)\n')
    process.exit(0)
  }
  if (mode === 'malformed-export') { // silent-fail 形貌 2：exit 0 但 export 檔內容非 JSON
    try { writeFileSync(exportFile, 'not-json{{{') } catch { /* ignore */ }
    process.stdout.write('完成。(malformed export)\n')
    process.exit(0)
  }
  const execCommitStep = { tool_calls: [{ tool_call_id: 't2', function_name: 'exec', arguments: { command: 'git add README.md && git commit -m "devin probe commit"' } }] }
  const editOnlyStep = { tool_calls: [{ tool_call_id: 't1', function_name: 'edit', arguments: { file_path: promptFile } }] }
  const readStep = { tool_calls: [{ tool_call_id: 't0', function_name: 'read', arguments: { file_path: promptFile } }] }
  if (mode === 'no-exec-commit') { // export 有效但無 exec git commit 步驟（只有 read/edit）
    writeExport([readStep, editOnlyStep])
    process.stdout.write('完成。(no exec commit step)\n')
    process.exit(0)
  }
  // 預設 ok：正常流，含 read/edit/exec(git commit) 步驟
  writeExport([readStep, editOnlyStep, execCommitStep])
  const bom = content.charCodeAt(0) === 0xfeff ? 1 : 0
  const cr = (content.match(/\r/g) ?? []).length
  const text = isPing
    ? 'PONG'
    : `完成。promptFile=${promptFile} exportFile=${exportFile} len=${content.length} bom=${bom} cr=${cr} head=${content.slice(0, 150)} tail=${content.slice(-80)}`
  process.stdout.write(text + '\n')
  process.exit(0)
}
