import { join } from 'node:path'
import { PreflightCache } from '../preflight.js'
import { MockEngine } from './mock.js'
import { ClaudeCliEngine } from './claude-cli.js'
import { CodexEngine } from './codex.js'
import { CopilotEngine } from './copilot.js'
import { AgyEngine } from './agy.js'
import { GrokEngine } from './grok.js'
import { QwenEngine } from './qwen.js'
import { OpencodeEngine } from './opencode.js'
import { DevinEngine } from './devin.js'
import type { Config, Engine, EngineConfig, EngineResolver } from '../types.js'

/** M5 Task 1：`{env:VAR}` 展開（assemble 層）——config 只寫變數引用，真值從進程環境取，
 * 不落 config/log/backlog 明文。變數缺失時只報「變數名」，絕不外洩值。導出供測試。 */
export function expandEnvValue(value: string): string {
  return value.replace(/\{env:([A-Za-z_][A-Za-z0-9_]*)\}/g, (_, name: string) => {
    const v = process.env[name]
    if (v === undefined) throw new Error(`環境變數未設定: ${name}（config engines 引用 {env:${name}}）`)
    return v
  })
}

function expandEnvMap(env: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!env) return undefined
  return Object.fromEntries(Object.entries(env).map(([k, v]) => [k, expandEnvValue(v)]))
}

/** M5 Task 1：引擎 registry——per-task 按需建（lazy：沒被任務 tag 到的引擎不建、
 * 其 {env:VAR} 缺失也不影響其他引擎）、建後 cache。未實作的 adapter resolve 時拋錯，
 * scheduler 歸 blocked(engine-not-allowed)。導出供測試。 */
export function makeEngineRegistry(cfg: Config): EngineResolver {
  const cache = new Map<string, Engine>()
  const build = (tag: string, ec: EngineConfig): Engine => {
    switch (ec.adapter) {
      case 'mock':
        return new MockEngine()
      case 'claude-cli':
        return new ClaudeCliEngine({
          id: tag === 'claude' ? 'claude-cli' : `claude-cli:${tag}`,
          cache: new PreflightCache(join(cfg.dataDir, tag === 'claude' ? 'preflight-cache.json' : `preflight-cache-${tag}.json`)),
          command: ec.command, env: expandEnvMap(ec.env),
          model: ec.model === undefined ? undefined : expandEnvValue(ec.model),
          timeoutMs: ec.timeoutMs
        })
      case 'codex':
        return new CodexEngine({
          id: tag === 'codex' ? 'codex' : `codex:${tag}`,
          cache: new PreflightCache(join(cfg.dataDir, `preflight-cache-${tag}.json`)),
          command: ec.command, env: expandEnvMap(ec.env),
          model: ec.model === undefined ? undefined : expandEnvValue(ec.model),
          effort: ec.effort, timeoutMs: ec.timeoutMs
        })
      case 'copilot':
        return new CopilotEngine({
          id: tag === 'copilot' ? 'copilot' : `copilot:${tag}`,
          cache: new PreflightCache(join(cfg.dataDir, `preflight-cache-${tag}.json`)),
          command: ec.command, env: expandEnvMap(ec.env),
          model: ec.model === undefined ? undefined : expandEnvValue(ec.model), // 未設鎖 gpt-5-mini（adapter 預設）
          timeoutMs: ec.timeoutMs
        })
      case 'agy':
        // M5 Task 4：WSL 內 Antigravity CLI。ec.env 不透傳（WSL 邊界，Windows env 不會自動
        // 進 Linux 側；真有需要屬 WSLENV 工程，另議）；model 同 claude-cli 支援 {env:VAR} 展開。
        return new AgyEngine({
          id: tag === 'agy' ? 'agy' : `agy:${tag}`,
          cache: new PreflightCache(join(cfg.dataDir, `preflight-cache-${tag}.json`)),
          command: ec.command,
          model: ec.model === undefined ? undefined : expandEnvValue(ec.model),
          timeoutMs: ec.timeoutMs
        })
      case 'grok':
        // M5 Task 7：xAI grok CLI（原生 .exe 直呼；prompt 走 --prompt-file tmp 檔；無 usage 欄位）。
        return new GrokEngine({
          id: tag === 'grok' ? 'grok' : `grok:${tag}`,
          cache: new PreflightCache(join(cfg.dataDir, `preflight-cache-${tag}.json`)),
          command: ec.command, env: expandEnvMap(ec.env),
          model: ec.model === undefined ? undefined : expandEnvValue(ec.model),
          timeoutMs: ec.timeoutMs
        })
      case 'qwen': {
        // M5 Task 6：qwen 殼接本機 OpenAI 相容 proxy（規格卡卡 3）。base URL／API key 沿 Task 1
        // env 機制從 ec.env 取（OPENAI_BASE_URL／OPENAI_API_KEY，值可 {env:VAR}），adapter 以
        // 規格卡實測旗標顯式帶入；env 同時透傳 runProcess（旗標與 env 同值，行為一致）。
        const qenv = expandEnvMap(ec.env)
        return new QwenEngine({
          id: tag === 'qwen' ? 'qwen' : `qwen:${tag}`,
          cache: new PreflightCache(join(cfg.dataDir, `preflight-cache-${tag}.json`)),
          command: ec.command, env: qenv,
          baseUrl: qenv?.OPENAI_BASE_URL,
          apiKey: qenv?.OPENAI_API_KEY,
          model: ec.model === undefined ? undefined : expandEnvValue(ec.model),
          timeoutMs: ec.timeoutMs
        })
      }
      case 'opencode':
        // M5 Task 8：opencode zen（規格卡 m5-opencode-research.md）。XDG 隔離 profile 落 dataDir；
        // zen apiKey 由 ec.env 的 OPENCODE_ZEN_KEY 供給（profile 內寫 {env:...} 引用，不落明文）。
        return new OpencodeEngine({
          id: tag === 'opencode' ? 'opencode' : `opencode:${tag}`,
          cache: new PreflightCache(join(cfg.dataDir, `preflight-cache-${tag}.json`)),
          command: ec.command, env: expandEnvMap(ec.env), profileDir: join(cfg.dataDir, 'opencode-profile'),
          model: ec.model === undefined ? undefined : expandEnvValue(ec.model), timeoutMs: ec.timeoutMs
        })
      case 'devin':
        // M5 Task 9：Devin CLI（原生 .exe 直呼；prompt/export 走 tmp 檔；固定鎖 swe-1.6 免費模型）。
        // devin-serena-fix：profileDir 落 dataDir（preflight ping 隔離 cwd，關全域 MCP 匯入用）。
        return new DevinEngine({
          id: tag === 'devin' ? 'devin' : `devin:${tag}`,
          cache: new PreflightCache(join(cfg.dataDir, `preflight-cache-${tag}.json`)),
          command: ec.command, env: expandEnvMap(ec.env),
          model: ec.model === undefined ? undefined : expandEnvValue(ec.model),
          timeoutMs: ec.timeoutMs, profileDir: join(cfg.dataDir, 'devin-profile')
        })
      default:
        throw new Error(`adapter ${ec.adapter} 尚未實作（M5 Task 3-8 逐一落地）`)
    }
  }
  return {
    resolve(tag: string): Engine {
      const hit = cache.get(tag)
      if (hit) return hit
      const ec = cfg.engines[tag]
      if (!ec) throw new Error(`engine tag 不在 engines 白名單: ${tag}`)
      const engine = build(tag, ec)
      cache.set(tag, engine)
      return engine
    }
  }
}
