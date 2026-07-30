// 一鍵查今日三艦 token 面：node scripts/tokens-today.mjs [YYYY-MM-DD]
// 資料源＝各專案 run.db 的 attempts（tokens_in/out/cached 為引擎自報 usage）。
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire(import.meta.url)
const Database = require('better-sqlite3')

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const day = process.argv[2] ?? new Date().toISOString().slice(0, 10)
const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n ?? 0)

let gIn = 0, gOut = 0
for (const p of ['autodev-self', 'note-filler', 'prompt-autoresearch']) {
  let rows
  try {
    const db = new Database(join(ROOT, 'data', p, 'run.db'), { readonly: true })
    rows = db.prepare(`SELECT engine, COUNT(*) n, SUM(ok) ok,
      COALESCE(SUM(tokens_in),0) ti, COALESCE(SUM(tokens_out),0) tout, COALESCE(SUM(tokens_cached),0) tc
      FROM attempts WHERE ts >= ? AND ts < date(?, '+1 day') GROUP BY engine ORDER BY ti DESC`).all(day, day)
    db.close()
  } catch { console.log(`== ${p}: run.db 不可讀`); continue }
  console.log(`== ${p}（${day}）`)
  if (!rows.length) console.log('   （零輪次）')
  for (const r of rows) {
    const cachePct = r.ti > 0 ? Math.round(r.tc / r.ti * 100) + '% cached' : 'usage 無'
    console.log(`   ${r.engine}: ${r.ok}/${r.n} 輪，in ${fmt(r.ti)} / out ${fmt(r.tout)}（${cachePct}）`)
    gIn += r.ti; gOut += r.tout
  }
}
console.log(`== 全艦隊合計：in ${fmt(gIn)} / out ${fmt(gOut)}`)
