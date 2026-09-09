import type { Config, EngineConfig } from '../types.js'

export type Adapter = EngineConfig['adapter']
type Capability = { transport: 'process' | 'wsl' | 'launcher' | 'mcp' | 'test'; nativeLimit: string; events: string; unbounded: 'unverified' | 'finite' | 'test-only'; stop: string }

/** Source contracts only. Installed command/version and real-flow evidence are separate gates. */
export const ENGINE_CAPABILITIES = {
  mock: { transport: 'test', nativeLimit: 'none', events: 'fixture', unbounded: 'test-only', stop: 'fixture only' },
  'claude-cli': { transport: 'process', nativeLimit: 'native limits unverified', events: 'JSON result; live stream unverified', unbounded: 'unverified', stop: 'transport cancellation; backend confirmation pending' },
  codex: { transport: 'process', nativeLimit: 'native limits unverified', events: 'JSONL thread/item/turn', unbounded: 'unverified', stop: 'transport cancellation; backend confirmation pending; ephemeral has no resume' },
  agy: { transport: 'wsl', nativeLimit: '--print-timeout (default 5m); zero sentinel unverified', events: 'text; partial exit 0 rejected', unbounded: 'finite', stop: 'WSL marker stop requested; backend confirmation pending' },
  copilot: { transport: 'process', nativeLimit: 'native limits unverified', events: 'JSONL result with exitCode', unbounded: 'unverified', stop: 'transport cancellation; session confirmation pending' },
  qwen: { transport: 'process', nativeLimit: 'native limits unverified', events: 'JSON array/result', unbounded: 'unverified', stop: 'transport cancellation; backend confirmation pending' },
  grok: { transport: 'process', nativeLimit: 'native limits unverified', events: 'JSON result; live stream unverified', unbounded: 'unverified', stop: 'transport cancellation; backend confirmation pending' },
  opencode: { transport: 'process', nativeLimit: 'provider timeout=180s; chunkTimeout=60s', events: 'NDJSON step_finish/text', unbounded: 'unverified', stop: 'transport cancellation; session confirmation pending' },
  devin: { transport: 'process', nativeLimit: 'native limits unverified', events: 'export file; live stream unverified', unbounded: 'unverified', stop: 'transport cancellation; backend confirmation pending' },
  herdr: { transport: 'launcher', nativeLimit: 'launcher TimeoutMs + WaitTimeoutMs; MaxRounds=1', events: 'launcher output/AUTOPILOT_WAIT_OK', unbounded: 'finite', stop: 'launcher cancellation; pane/request confirmation pending' },
  freebuff: { transport: 'mcp', nativeLimit: 'MCP wall timeout; max_agent_steps=20', events: 'MCP messages/route/delegate result', unbounded: 'finite', stop: 'MCP cancellation notification; session quarantined until confirmed' },
} as const satisfies Record<Adapter, Capability>

export function assertExecutionMode(ec: EngineConfig): void {
  if (ec.executionMode === 'supervised' && ENGINE_CAPABILITIES[ec.adapter].unbounded !== 'test-only')
    throw new Error(`${ec.adapter}: supervised execution blocked; native unlimited, cancellation and real-flow acceptance remain unverified`)
}

export function capabilityReport(cfg: Config) {
  return {
    realAdapterCount: Object.keys(ENGINE_CAPABILITIES).length - 1,
    realUnboundedAccepted: 0,
    adapters: ENGINE_CAPABILITIES,
    configured: Object.entries(cfg.engines).map(([tag, ec]) => ({
      tag, adapter: ec.adapter, command: ec.command ?? '(adapter default)', version: 'unverified',
      executionMode: ec.executionMode ?? 'bounded', timeoutMs: ec.timeoutMs ?? 'adapter default',
      idleTimeoutMs: ec.idleTimeoutMs ?? 'adapter default', native: ENGINE_CAPABILITIES[ec.adapter],
    })),
  }
}
