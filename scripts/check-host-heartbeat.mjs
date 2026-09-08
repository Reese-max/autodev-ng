import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Run on a DIFFERENT host against a received/shared health receipt. Missing/stale is never healthy.
export function checkHeartbeat(file, expectedHost, maxAgeMs = 180000, now = Date.now()) {
  try {
    if (!expectedHost || !Number.isFinite(maxAgeMs) || maxAgeMs <= 0) throw 0
    const r = JSON.parse(readFileSync(file, 'utf8')), age = now - Date.parse(r.checkedAt)
    return { hostId: expectedHost, ok: r.hostId === expectedHost && r.ok === true && Number.isFinite(age) && age >= -5000 && age <= maxAgeMs, ageMs: Number.isFinite(age) ? age : null }
  } catch { return { hostId: expectedHost, ok: false, ageMs: null } }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { values: v } = parseArgs({ options: { file: { type: 'string' }, host: { type: 'string' }, 'max-age-ms': { type: 'string' } } })
    const r = checkHeartbeat(v.file, v.host, v['max-age-ms'] === undefined ? 180000 : Number(v['max-age-ms']))
    console.log(JSON.stringify(r)); process.exitCode = r.ok ? 0 : 2
  } catch { console.error('HEARTBEAT_CHECK_FAILED'); process.exitCode = 1 }
}
