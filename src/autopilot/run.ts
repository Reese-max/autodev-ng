import { assemble } from '../cli.js'
import { runGoalWithDeps } from './session.js'

export { stopAlertMessage } from './session.js'

export async function main(cfgPath: string): Promise<void> {
  const { deps, notifier, cfg } = assemble(cfgPath)
  await runGoalWithDeps(deps, notifier, cfg)
}

const cfgArg = process.argv.indexOf('--config')
if (cfgArg >= 0 && cfgArg + 1 < process.argv.length) {
  main(process.argv[cfgArg + 1]!).catch((e) => { console.error(e); process.exit(1) })
}
