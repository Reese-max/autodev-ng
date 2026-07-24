import { finalizeRunOnceHeartbeat, runOnce, type CycleResult } from '../scheduler.js'
import { withAssembled } from './assemble.js'

export function formatCycleResult(result: CycleResult): string {
  return typeof result === 'string' ? result : `blocked（任務：${result.taskText}）`
}

export async function cmdRunOnce(cfgPath: string): Promise<void> {
  await withAssembled(cfgPath, async ({ deps }) => {
    const result = await runOnce(deps)
    finalizeRunOnceHeartbeat(deps, result)
    console.log(`CycleResult: ${formatCycleResult(result)}`)
  })
}
