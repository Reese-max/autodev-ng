import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { makeEngineRegistry } from '../src/engines/registry.js'
import { ConfigSchema } from '../src/types.js'

/** 回歸（2026-07-18）：registry 六個 adapter case 漏傳 ec.command，config 指定的完整路徑被
 * 靜默忽略、adapter 退回裸名預設值——grok 檔位因此在 daemon 環境 ENOENT，輪替上線 11 小時
 * 零派工才被發現。逐 adapter 驗 command 有真的進到 engine（private 欄位以結構讀取）。 */
test('config engines.<tag>.command 必須傳到 adapter（不得退回裸名預設）', () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'adng-reg-'))
  const cfg = ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir,
    engines: {
      claude: { adapter: 'claude-cli', command: 'C:/custom/claude.cmd' },
      grok: { adapter: 'grok', command: 'C:/custom/grok.exe', costPerRunUsd: 0 },
      codex: { adapter: 'codex', command: 'C:/custom/codex.exe', costPerRunUsd: 0 },
      copilot: { adapter: 'copilot', command: 'C:/custom/copilot.exe', costPerRunUsd: 0 },
      qwen: { adapter: 'qwen', command: 'C:/custom/qwen.cmd', costPerRunUsd: 0 },
      agy: { adapter: 'agy', command: 'C:/custom/wsl.exe', costPerRunUsd: 0 }
    },
    defaultEngine: 'claude'
  })
  const registry = makeEngineRegistry(cfg)
  for (const tag of Object.keys(cfg.engines)) {
    const engine = registry.resolve(tag) as unknown as { command: string }
    expect(engine.command, `engines.${tag}.command 未透傳到 adapter`).toContain('C:/custom/')
  }
})
