import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// Issue 入口動態帳務 scope：dir 下的 issue-N/run.db、issue-N/revisions/R/run.db、
// repo-X/issue-N/…（owner 子 repo 佈局）全部計入。offset/subscriptions 取執行中的
// runtime cfg（與產生這些帳務的設定同源）。
export interface ExtraBillingScope { dir: string; offset: number; subscriptions: string[] }

/** 由執行中 cfg 推導額外 scope 的計帳政策——scheduler 與 perpetual 閘門共用，避免兩道閘鬆緊不一。 */
export function extraBillingScopes(cfg: { timezoneOffsetHours: number; engines: Record<string, { subscription?: boolean }> }, dirs: string[] = []): ExtraBillingScope[] {
  const subscriptions = Object.entries(cfg.engines).filter(([, e]) => e.subscription).map(([tag]) => tag).sort()
  return dirs.map(dir => ({ dir, offset: cfg.timezoneOffsetHours, subscriptions }))
}

/** 盤點 dir 下所有 issue/revision run.db——只認既知結構位置，不遞迴 checkout 內容。 */
export function issueBillingDbs(dir: string): string[] {
  const out: string[] = []
  const issueDb = (issueDir: string) => {
    const direct = join(issueDir, 'run.db')
    if (existsSync(direct)) out.push(direct)
    const revs = join(issueDir, 'revisions')
    if (existsSync(revs)) {
      for (const r of readdirSync(revs, { withFileTypes: true })) {
        if (!r.isDirectory()) continue
        const f = join(revs, r.name, 'run.db')
        if (existsSync(f)) out.push(f)
      }
    }
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    if (entry.name.startsWith('issue-')) issueDb(join(dir, entry.name))
    else if (entry.name.startsWith('repo-')) {
      for (const sub of readdirSync(join(dir, entry.name), { withFileTypes: true })) {
        if (sub.isDirectory() && sub.name.startsWith('issue-')) issueDb(join(dir, entry.name, sub.name))
      }
    }
  }
  return out
}
