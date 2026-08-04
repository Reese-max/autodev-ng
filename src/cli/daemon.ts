import { join, resolve } from 'node:path'
import { runDaemon } from '../daemon.js'
import { withAssembled } from './assemble.js'

const IDLE_SLEEP_MS = 5 * 60 * 1000

export async function cmdDaemon(cfgPath: string): Promise<void> {
  const result = await withAssembled(cfgPath, async ({ deps, notifier }) => {
    return runDaemon({
      deps,
      notifier,
      lockDir: join(deps.cfg.dataDir, 'daemon.lock'),
      cooldownMs: deps.cfg.cooldownMs,
      idleSleepMs: IDLE_SLEEP_MS,
      cfgPath: resolve(cfgPath),
    })
  })
  console.log(`daemon result: ${result}`)
  if (result === 'restart-requested') process.exit(0)
}
