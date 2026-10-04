import type { Config, EngineConfig } from '../types.js'

export type Adapter = EngineConfig['adapter']
/** Issue #11 控制面能力：inFlightSteer＝回合中可安全接收操作員指示（poll SteerPort）；
 *  nextTurnQueue＝同一 executionId 的有界 follow-up run 可攜入 QUEUE 指示
 *  （process/test 系真實支援；為新 process，session context 不延續）。
 *  permissionReply/stopTurn 目前全矩陣皆未驗證——能力表一律 fail closed，不得假裝成功。 */
type ControlCapability = { inFlightSteer: boolean; nextTurnQueue: boolean; permissionReply: boolean; stopTurn: boolean }
type Capability = { transport: 'process' | 'wsl' | 'launcher' | 'mcp' | 'test'; nativeLimit: string; events: string; unbounded: 'unverified' | 'finite' | 'test-only'; stop: string; control: ControlCapability }

const CONTROL_NONE: ControlCapability = { inFlightSteer: false, nextTurnQueue: false, permissionReply: false, stopTurn: false }
const CONTROL_NEXT_TURN: ControlCapability = { ...CONTROL_NONE, nextTurnQueue: true }

/** Source contracts only. Installed command/version and real-flow evidence are separate gates. */
export const ENGINE_CAPABILITIES = {
  mock: { transport: 'test', nativeLimit: 'none', events: 'fixture', unbounded: 'test-only', stop: 'fixture only',
    control: { ...CONTROL_NEXT_TURN, inFlightSteer: true } },
  'claude-cli': { transport: 'process', nativeLimit: 'native limits unverified', events: 'stream-json messages/tools/result; provider stream acceptance pending', unbounded: 'unverified', stop: 'transport cancellation; backend confirmation pending', control: CONTROL_NEXT_TURN },
  codex: { transport: 'process', nativeLimit: 'native limits unverified', events: 'JSONL thread/item/turn', unbounded: 'unverified', stop: 'transport cancellation; backend confirmation pending; ephemeral has no resume', control: CONTROL_NEXT_TURN },
  agy: { transport: 'wsl', nativeLimit: '--print-timeout (default 5m); zero sentinel unverified', events: 'text; partial exit 0 rejected', unbounded: 'finite', stop: 'WSL marker stop requested; backend confirmation pending', control: CONTROL_NONE },
  copilot: { transport: 'process', nativeLimit: 'native limits unverified', events: 'JSONL result with exitCode', unbounded: 'unverified', stop: 'transport cancellation; session confirmation pending', control: CONTROL_NEXT_TURN },
  qwen: { transport: 'process', nativeLimit: 'native limits unverified', events: 'stream-json messages/tools/result; legacy JSON array supported', unbounded: 'unverified', stop: 'transport cancellation; backend confirmation pending', control: CONTROL_NEXT_TURN },
  grok: { transport: 'process', nativeLimit: 'native limits unverified', events: 'NDJSON tool_call/update/text/end; legacy JSON supported', unbounded: 'unverified', stop: 'transport cancellation; backend confirmation pending', control: CONTROL_NEXT_TURN },
  opencode: { transport: 'process', nativeLimit: 'provider timeout=180s; chunkTimeout=60s', events: 'NDJSON step_finish/text', unbounded: 'unverified', stop: 'transport cancellation; session confirmation pending', control: CONTROL_NEXT_TURN },
  devin: { transport: 'process', nativeLimit: 'native limits unverified', events: 'export file; live stream unverified', unbounded: 'unverified', stop: 'transport cancellation; backend confirmation pending', control: CONTROL_NEXT_TURN },
  herdr: { transport: 'launcher', nativeLimit: 'launcher TimeoutMs + WaitTimeoutMs; MaxRounds=1', events: 'launcher output/AUTOPILOT_WAIT_OK', unbounded: 'finite', stop: 'launcher cancellation; pane/request confirmation pending', control: CONTROL_NONE },
  freebuff: { transport: 'mcp', nativeLimit: 'MCP wall timeout; max_agent_steps=20', events: 'MCP messages/route/delegate result', unbounded: 'finite', stop: 'MCP cancellation notification; session quarantined until confirmed', control: CONTROL_NONE },
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
