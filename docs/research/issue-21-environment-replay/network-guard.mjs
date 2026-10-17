// Trusted-fixture instrumentation only; this is not host/hostile-worker containment.
import { appendFileSync, existsSync, readFileSync } from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'

let attempts=0
const deny=()=>{
 attempts++
 if(process.env.RESEARCH_NETWORK_LOG)appendFileSync(process.env.RESEARCH_NETWORK_LOG,'1\n')
 process.exitCode=1
 throw Error('OFFLINE_FIXTURE_NETWORK_DENIED')
}
globalThis.fetch=deny
for(const name of ['node:http','node:https','node:net','node:tls','node:dgram']) {
 const m=await import(name)
 for(const key of ['request','get','connect','createConnection','createSocket'])if(typeof m.default[key]==='function')m.default[key]=deny
}
syncBuiltinESMExports()
export const networkAttempts=()=>process.env.RESEARCH_NETWORK_LOG
 ? (existsSync(process.env.RESEARCH_NETWORK_LOG)?readFileSync(process.env.RESEARCH_NETWORK_LOG,'utf8').match(/\n/g)?.length||0:0)
 : attempts
