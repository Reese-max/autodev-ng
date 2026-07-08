import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** devin-serena-fix：devin 全域 MCP（capcut/google-workspace/n8n/serena/playwright...）並非
 * `devin mcp add` 手動註冊，而是 `read_config_from.claude` 自動從 Claude Code 匯入——實測
 * `--config <乾淨檔>` 對此無效（mcp 匯入不吃該旗標，`devin mcp list` 仍照樣列出全部）。
 * serena 尤其會用 cwd 起 language server 建 `.serena/` 索引，隨 devin `git add -A` 污染目標
 * repo、且進程常 dangling 未被樹斬（鎖 worktree，rm 報 Device busy）。真正生效的關法：
 * devin 讀取設定的 cwd 下放一份 project-scope `.devin/config.local.json`（三層優先序最高，
 * 實測 `devin mcp list` 從此 cwd 執行變成「No MCP servers configured」）關掉三個匯入來源
 * （claude/cursor/windsurf 全關——autodev-ng 派工用不到任何一個），devin 這一輪根本不掛載
 * MCP，從源頭消除孤兒與 `.serena/` 污染。不動使用者全域 `%APPDATA%/devin/config.json`、
 * 不殺任何進程。冪等（內容相同不重寫）；per-run 呼叫失敗（權限等）不阻擋開工，讓後續
 * worktree.ts 的 `.git/info/exclude` 保底兜住萬一仍有 MCP 被掛載的殘留污染風險。 */
export function ensureNoMcpImport(cwd: string): void {
  const dir = join(cwd, '.devin')
  const file = join(dir, 'config.local.json')
  const want = JSON.stringify({ read_config_from: { claude: false, cursor: false, windsurf: false } }, null, 2) + '\n'
  let cur: string | undefined
  try { cur = readFileSync(file, 'utf8') } catch { /* 不存在＝寫入 */ }
  if (cur === want) return
  try { mkdirSync(dir, { recursive: true }); writeFileSync(file, want) } catch { /* 容忍：見上方註解 */ }
}
