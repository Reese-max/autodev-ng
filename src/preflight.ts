import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import type { PreflightResult } from './types.js'

interface Entry { r: PreflightResult; ts: number }

/** preflight ping 結果 cache。舊系統教訓：TTL 太短會被 cold-start 反覆拖垮，6h 起跳。 */
export class PreflightCache {
  constructor(
    private readonly file: string,
    private readonly ttlMs = 6 * 60 * 60 * 1000
  ) {}

  get(key: string): PreflightResult | null {
    const entry = this.load()[key]
    if (!entry) return null
    if (Date.now() - entry.ts > this.ttlMs) return null
    return entry.r
  }

  set(key: string, r: PreflightResult): void {
    const all = this.load()
    all[key] = { r, ts: Date.now() }
    const tmp = this.file + '.tmp'
    writeFileSync(tmp, JSON.stringify(all))
    renameSync(tmp, this.file)
  }

  private load(): Record<string, Entry> {
    if (!existsSync(this.file)) return {}
    try { return JSON.parse(readFileSync(this.file, 'utf8')) } catch { return {} }
  }
}
