import type { Config, EngineConfig } from '../types.js'

export type Adapter = EngineConfig['adapter']
/** Issue #11：operator 控制面能力矩陣。inFlightSteer＝turn 進行中可於 safe boundary 注入；
 * nextTurnQueue＝host 端 FIFO 續跑 turn（所有 adapter 皆由宿主排程保證）；
 * permissionReply＝可回覆引擎 permission/input 請求；stopTurn＝可要求停止當前 turn。
 * 不支援一律 fail closed（UNSUPPORTED），不以 prompt hack 假裝等價。 */
type ControlCaps = { inFlightSteer: boolean; nextTurnQueue: boolean; permissionReply: boolean; stopTurn: boolean }
type Capability = { transport: 'process' | 'wsl' | 'launcher' | 'mcp' | 'test'; nativeLimit: string; events: string; unbounded: 'unverified' | 'finite' | 'test-only'; stop: string; controls: ControlCaps }

const NO_INFLIGHT: ControlCaps = { inFlightSteer: false, nextTurnQueue: true, permissionReply: false, stopTurn: true }

/** Source contracts only. Installed command/version and real-flow evidence are separate gates. */
export const ENGINE_CAPABILITIES = {
  mock: { transport: 'test', nativeLimit: 'none', events: 'fixture', unbounded: 'test-only', stop: 'fixture only', controls: { inFlightSteer: true, nextTurnQueue: true, permissionReply: false, stopTurn: true } },
  'claude-cli': { transport: 'process', nativeLimit: 'native limits unverified', events: 'stream-json messages/tools/result; provider stream acceptance pending', unbounded: 'unverified', stop: 'transport cancellation; backend confirmation pending', controls: NO_INFLIGHT },
  codex: { transport: 'process', nativeLimit: 'native limits unverified', events: 'JSONL thread/item/turn', unbounded: 'unverified', stop: 'transport cancellation; backend confirmation pending; ephemeral has no resume', controls: NO_INFLIGHT },
  agy: { transport: 'wsl', nativeLimit: '--print-timeout (default 5m); zero sentinel unverified', events: 'text; partial exit 0 rejected', unbounded: 'finite', stop: 'WSL marker stop requested; backend confirmation pending', controls: NO_INFLIGHT },
  copilot: { transport: 'process', nativeLimit: 'native limits unverified', events: 'JSONL result with exitCode', unbounded: 'unverified', stop: 'transport cancellation; session confirmation pending', controls: NO_INFLIGHT },
  qwen: { transport: 'process', nativeLimit: 'native limits unverified', events: 'stream-json messages/tools/result; legacy JSON array supported', unbounded: 'unverified', stop: 'transport cancellation; backend confirmation pending', controls: NO_INFLIGHT },
  grok: { transport: 'process', nativeLimit: 'native limits unverified', events: 'NDJSON tool_call/update/text/end; legacy JSON supported', unbounded: 'unverified', stop: 'transport cancellation; backend confirmation pending', controls: NO_INFLIGHT },
  opencode: { transport: 'process', nativeLimit: 'provider timeout=180s; chunkTimeout=60s', events: 'NDJSON step_finish/text', unbounded: 'unverified', stop: 'transport cancellation; session confirmation pending', controls: NO_INFLIGHT },
  devin: { transport: 'process', nativeLimit: 'native limits unverified', events: 'export file; live stream unverified', unbounded: 'unverified', stop: 'transport cancellation; backend confirmation pending', controls: NO_INFLIGHT },
  herdr: { transport: 'launcher', nativeLimit: 'launcher TimeoutMs + WaitTimeoutMs; MaxRounds=1', events: 'launcher output/AUTOPILOT_WAIT_OK', unbounded: 'finite', stop: 'launcher cancellation; pane/request confirmation pending', controls: NO_INFLIGHT },
  freebuff: { transport: 'mcp', nativeLimit: 'MCP wall timeout; max_agent_steps=20', events: 'MCP messages/route/delegate result', unbounded: 'finite', stop: 'MCP cancellation notification; session quarantined until confirmed', controls: NO_INFLIGHT },
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
