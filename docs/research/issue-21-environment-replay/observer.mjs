import { readFileSync,writeFileSync } from 'node:fs'
import { observe,preflight } from './contract.mjs'
import { networkAttempts } from './network-guard.mjs'
const q=JSON.parse(readFileSync(process.argv[2],'utf8'))
process.env.RESEARCH_NETWORK_LOG=q.commandLog+'.network-attempts'
if(Object.hasOwn(process.env,'FIXTURE_RAW_SECRET'))throw Error('FAKE_SECRET_CROSSED_CHILD_BOUNDARY')
const observation=observe(q)
if(networkAttempts()!==0)throw Error('NETWORK_ATTEMPT_OBSERVED')
const receipt=await preflight(q,observation,process.env.RESEARCH_SOURCE)
const attempts=networkAttempts()
if(attempts!==0)throw Error('NETWORK_ATTEMPT_OBSERVED')
writeFileSync(q.observationOutput,JSON.stringify(observation,null,2)+'\n')
writeFileSync(q.receiptOutput,JSON.stringify(receipt,null,2)+'\n')
process.stdout.write(JSON.stringify({state:receipt.state,receiptDigest:receipt.receiptDigest,networkAttempts:attempts,fakeSecretPresent:false,environmentKeys:Object.keys(process.env).sort()})+'\n')
