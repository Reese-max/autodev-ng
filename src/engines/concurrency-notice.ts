import { quiet, type EventLog } from '../events.js'

interface ConcurrencyDeps {
  cfg: { concurrency: number }
  events: EventLog
}

// 以 deps 物件代表一次 scheduler／daemon 生命周期；重啟後會有新 deps，應重新留下提示。
const notedLifecycles = new WeakSet<object>()

/** >1 尚未有併發池，明確記錄本 lifecycle 僅一次的單工降級提示。 */
export function noteSerialConcurrency(deps: ConcurrencyDeps): void {
  if (deps.cfg.concurrency <= 1 || notedLifecycles.has(deps)) return
  quiet(() => {
    deps.events.append('concurrency-serial-fallback', {
      requested: deps.cfg.concurrency,
      mode: 'serial',
      note: 'concurrency > 1 尚未實作，暫按單工執行',
    })
    notedLifecycles.add(deps)
  })
}
