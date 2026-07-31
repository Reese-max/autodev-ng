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

test('config pingTimeoutMs 透傳所有支援 adapter，Codex 未設時預設 180s', () => {
  const dataDir = mkdtempSync(join(tmpdir(), 'adng-reg-ping-'))
  const cfg = ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir, defaultEngine: 'claude',
    engines: {
      claude: { adapter: 'claude-cli', pingTimeoutMs: 101_000 },
      codex: { adapter: 'codex', costPerRunUsd: 0, pingTimeoutMs: 102_000 },
      copilot: { adapter: 'copilot', costPerRunUsd: 0, pingTimeoutMs: 103_000 },
      agy: { adapter: 'agy', costPerRunUsd: 0, pingTimeoutMs: 104_000 },
      grok: { adapter: 'grok', costPerRunUsd: 0, pingTimeoutMs: 105_000 },
      qwen: { adapter: 'qwen', costPerRunUsd: 0, pingTimeoutMs: 106_000 },
      opencode: { adapter: 'opencode', pingTimeoutMs: 107_000 },
      devin: { adapter: 'devin', costPerRunUsd: 0, pingTimeoutMs: 108_000 },
    },
  })
  const registry = makeEngineRegistry(cfg)
  for (const [tag, ec] of Object.entries(cfg.engines)) {
    const engine = registry.resolve(tag) as unknown as { pingTimeoutMs: number }
    expect(engine.pingTimeoutMs, `engines.${tag}.pingTimeoutMs 未透傳到 adapter`).toBe(ec.pingTimeoutMs)
  }

  const defaults = makeEngineRegistry(ConfigSchema.parse({
    projectPath: 'x', backlogFile: 'x', dataDir,
    engines: { codex: { adapter: 'codex', costPerRunUsd: 0 } }, defaultEngine: 'codex',
  }))
  expect((defaults.resolve('codex') as unknown as { pingTimeoutMs: number }).pingTimeoutMs).toBe(180_000)
})
