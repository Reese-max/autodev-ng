import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import type { Config } from '../types.js'
import { FREE_MODEL_CATALOG, freeModelId, zeroPricing } from './free-model-policy.js'
import { isSilenced } from '../bot/silence.js'

const State = z.object({ day: z.string(), failed: z.boolean(), notice: z.string().optional(), message: z.string().optional(), notified: z.boolean() })
const Snapshot = z.object({ checkedAt: z.string().datetime(), models: z.array(z.string()).min(1) })
function save(file: string, data: unknown): void {
  const tmp = `${file}.${randomUUID()}.tmp`
  writeFileSync(tmp, JSON.stringify(data, null, 2)); renameSync(tmp, file)
}

/** First active cycle each local day. The last good catalog is advisory; admission still fetches live prices. */
export async function refreshFreeModelCatalog(cfg: Pick<Config, 'tierMode' | 'dataDir' | 'timezoneOffsetHours' | 'stopFile'>,
  notifier: { send(text: string): Promise<boolean> }, fetchFn: typeof fetch = fetch): Promise<void> {
  if (cfg.tierMode !== 'free-only' || existsSync(cfg.stopFile)) return
  mkdirSync(cfg.dataDir, { recursive: true })
  const file = join(cfg.dataDir, 'free-model-catalog.json'), stateFile = join(cfg.dataDir, 'free-model-catalog-refresh.json')
  const day = new Date(Date.now() + cfg.timezoneOffsetHours * 3600_000).toISOString().slice(0, 10)
  let state = existsSync(stateFile) ? State.parse(JSON.parse(readFileSync(stateFile, 'utf8'))) : undefined
  if (state?.day !== day) {
    let notice: string | undefined, message: string | undefined, failed = false
    try {
      const previous = existsSync(file) ? Snapshot.parse(JSON.parse(readFileSync(file, 'utf8'))) : undefined
      const response = await fetchFn(FREE_MODEL_CATALOG, { redirect: 'error', signal: AbortSignal.timeout(15_000) })
      if (!response.ok) throw new Error('Catalog unavailable')
      const catalog = z.object({ data: z.array(z.object({ id: z.string(), pricing: z.unknown() })) }).parse(await response.json())
      const models = [...new Set(catalog.data.filter(entry => {
        try { return freeModelId(entry.id) === entry.id && zeroPricing(entry.pricing) } catch { return false }
      }).map(entry => entry.id))].sort()
      if (!models.length) throw new Error('No verified free models')
      const changed = JSON.stringify(previous?.models) !== JSON.stringify(models)
      save(file, Snapshot.parse({ checkedAt: new Date().toISOString(), models }))
      if (changed || state?.failed) {
        notice = `${state?.failed ? 'recovered' : 'changed'}:${createHash('sha256').update(JSON.stringify(models)).digest('hex')}`
        message = `免費模型清單${state?.failed ? '掃描已恢復' : '已更新'}：${models.length} 個符合零價格條件；審查仍只使用已設定的候補。`
      }
    } catch {
      failed = true; notice = 'failed'; message = '免費模型清單掃描失敗，保留最後成功的清單與原候補設定；實際呼叫仍須通過即時價格檢查。'
    }
    if (!notice && state?.message && !state.notified && !state.failed) { notice = state.notice; message = state.message }
    state = { day, failed, notice, message, notified: Boolean(notice && state?.notice === notice && state.notified) }
    save(stateFile, state)
  }
  if (state?.message && !state.notified && !isSilenced(cfg.dataDir)) {
    try { if (await notifier.send(state.message)) { state.notified = true; save(stateFile, state) } } catch { /* Retry the notice, never the model scan, on the next cycle. */ }
  }
}
