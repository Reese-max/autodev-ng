import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import type { PreflightResult } from './types.js'

interface Entry { r: PreflightResult; ts: number }

/** ping 結果 cache。好結果 TTL 長（防 cold-start 連環重打）、壞結果 TTL 短（引擎復活偵測快）。 */
export class PreflightCache {
  constructor(
    private readonly file: string,
    private readonly ttlMs = 6 * 60 * 60 * 1000,
    private readonly badTtlMs = 30 * 60 * 1000
  ) {}

  get(key: string): PreflightResult | null {
    const entry = this.load()[key]
    if (!entry || typeof entry.ts !== 'number' || typeof entry.r?.ok !== 'boolean') return null
    const ttl = entry.r.ok ? this.ttlMs : this.badTtlMs
    if (Date.now() - entry.ts > ttl) return null
    return entry.r
  }

  /** 寫失敗（目錄不存在/磁碟滿）吞掉——cache 是加速器不是正確性來源（鐵律 #4）。 */
  set(key: string, r: PreflightResult): void {
    try {
      const all = this.load()
      all[key] = { r, ts: Date.now() }
      const tmp = this.file + '.tmp'
      writeFileSync(tmp, JSON.stringify(all))
      renameSync(tmp, this.file)
    } catch { /* fail-open */ }
  }

  private load(): Record<string, Entry> {
    if (!existsSync(this.file)) return {}
    try { return JSON.parse(readFileSync(this.file, 'utf8')) } catch { return {} }
  }
}
