import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgv, runCli, type ParsedArgv } from './cli/entry.js'

export { assemble } from './cli/assemble.js'
export { formatStatus, type BacklogCounts, type HeartbeatSnapshot, type StatusInput } from './cli/status.js'
export { runNotifyTest } from './cli/notify-test.js'
export { expandEnvValue, makeEngineRegistry } from './engines/registry.js'
export { finalizeRunOnceHeartbeat } from './scheduler.js'

export { parseArgv }
export type { ParsedArgv }

async function main(): Promise<void> {
  await runCli(process.argv.slice(2), fileURLToPath(import.meta.url))
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err))
    process.exitCode = 1
  })
}
