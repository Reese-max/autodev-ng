#!/usr/bin/env node
// 巡檢合約：偵測「引擎黑洞」——某引擎族在近 24h 內大量 phantom completion 且零成功。
// 2026-08-05 立：codex 沙箱政策使 shell 全數 declined，turn.completed 照發，
// 五船 74 輪 ok=0 連燒 7 小時而無任何告警（見 PATROL-ALERTS 同日 P0）。
// 判定與成因無關，只看行為，故任何「跑得動但交不出 commit」的新成因都會被抓到。
const { execFileSync } = require('node:child_process')
const { readdirSync, existsSync } = require('node:fs')
const { join } = require('node:path')

const ROOT = join(__dirname, '..', '..')
// 窗口/門檻以 2026-08-05 實測資料校準：6h+5 抓到五船 codex（13–27 筆），
// 對 kilo/oc-mimo/oc-deepseek 等健康引擎零誤報（同窗口皆 ok>=1）。
const WINDOW_HOURS = 6
const PHANTOM_MIN = 5

const ships = readdirSync(join(ROOT, 'configs'))
  .filter(f => f.endsWith('.json'))
  .map(f => f.slice(0, -5))

const stalled = []
for (const ship of ships) {
  const db = join(ROOT, 'data', ship, 'run.db')
  if (!existsSync(db)) continue
  const sql = `SELECT engine, sum(CASE WHEN ok=0 AND detail LIKE '%phantom completion%' THEN 1 ELSE 0 END), sum(ok)
    FROM attempts WHERE ts > strftime('%Y-%m-%dT%H:%M:%SZ','now','-${WINDOW_HOURS} hours') GROUP BY engine`
  let out
  try {
    out = execFileSync('sqlite3', [db, sql], { encoding: 'utf8', timeout: 30_000 })
  } catch (err) {
    console.error(`${ship}: run.db 查詢失敗 ${err.message}`)
    process.exit(2)
  }
  for (const line of out.split('\n').filter(Boolean)) {
    const [engine, phantom, ok] = line.split('|')
    if (Number(phantom) >= PHANTOM_MIN && Number(ok) === 0) {
      stalled.push(`${ship}/${engine} phantom=${phantom} ok=${ok}`)
    }
  }
}

if (stalled.length) {
  console.error(`引擎黑洞（近 ${WINDOW_HOURS}h phantom>=${PHANTOM_MIN} 且零成功）：\n  ${stalled.join('\n  ')}`)
  process.exit(1)
}
console.log(`OK (${ships.length} ships, no engine black hole)`)
