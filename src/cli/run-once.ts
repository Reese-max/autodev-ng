import { finalizeRunOnceHeartbeat, runOnce, type CycleResult } from '../scheduler.js'
import { withAssembled } from './assemble.js'

export function formatCycleResult(result: CycleResult): string {
  return typeof result === 'string' ? result : `blocked（任務：${result.taskText}）`
}

export async function cmdRunOnce(cfgPath: string): Promise<void> {
  await withAssembled(cfgPath, async ({ deps }) => {
    const result = await runOnce(deps)
    finalizeRunOnceHeartbeat(deps, result)
    if (typeof result === 'object' || !['done', 'idle', 'stopped', 'deferred'].includes(result)) process.exitCode = 1
    console.log(`CycleResult: ${formatCycleResult(result)}`)
    try { await deps.lessons?.reflect(result) } catch { /* Reflection cannot replace the completed cycle outcome. */ }
  })
}
