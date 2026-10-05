import { readFileSync,writeFileSync } from 'node:fs'
import { observe,preflight } from './contract.mjs'
// Trusted-fixture instrumentation, not a host firewall or hostile-worker sandbox.
let attempts=0
const deny=()=>{attempts++;throw Error('OFFLINE_FIXTURE_NETWORK_DENIED')}
globalThis.fetch=deny
for(const name of ['node:http','node:https','node:net','node:tls','node:dgram']) {
 const m=await import(name)
 for(const key of ['request','get','connect','createConnection','createSocket'])if(typeof m.default[key]==='function')m.default[key]=deny
}
const q=JSON.parse(readFileSync(process.argv[2],'utf8'))
if(Object.hasOwn(process.env,'FIXTURE_RAW_SECRET'))throw Error('FAKE_SECRET_CROSSED_CHILD_BOUNDARY')
const observation=observe(q)
const receipt=await preflight(q,observation,process.env.RESEARCH_SOURCE)
if(attempts!==0)throw Error('NETWORK_ATTEMPT_OBSERVED')
writeFileSync(q.observationOutput,JSON.stringify(observation,null,2)+'\n')
writeFileSync(q.receiptOutput,JSON.stringify(receipt,null,2)+'\n')
process.stdout.write(JSON.stringify({state:receipt.state,receiptDigest:receipt.receiptDigest,networkAttempts:attempts,fakeSecretPresent:false,environmentKeys:Object.keys(process.env).sort()})+'\n')
