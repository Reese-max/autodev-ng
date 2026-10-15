// Trusted synthetic transport: no provider request, auth-file read or socket.
import { createInterface } from 'node:readline'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import net from 'node:net'
import http from 'node:http'
import https from 'node:https'
import dns from 'node:dns'
import dgram from 'node:dgram'
import { VERSION, load, save, evaluate } from './mock-authority.mjs'
const [registryFile, requestFile] = process.argv.slice(2)
const q = JSON.parse(readFileSync(requestFile,'utf8'))
// Instrument the trusted fixture's transport surface; this is not a sandbox.
let networkAttempts=0
const denyNetwork=()=>{networkAttempts++;throw Error('RESEARCH_NETWORK_SENTINEL_BLOCKED')}
globalThis.fetch=denyNetwork
net.connect=denyNetwork;net.createConnection=denyNetwork;net.Socket.prototype.connect=denyNetwork
http.request=denyNetwork;http.get=denyNetwork;https.request=denyNetwork;https.get=denyNetwork
dns.lookup=denyNetwork;dns.resolve=denyNetwork;dgram.createSocket=denyNetwork
const rl=createInterface({input:process.stdin})
const send = value=>process.stdout.write(JSON.stringify(value)+'\n')
const result=(id,text,isError=false)=>send({jsonrpc:'2.0',id,result:{isError,content:[{type:'text',text}]}})
const audit=event=>writeFileSync(q.auditFile,JSON.stringify({schemaVersion:VERSION,principalId:q.principalId,executionId:q.executionId,event,fixtureSecretInherited:process.env.ADNG_PRINCIPAL_FIXTURE_SECRET!==undefined,networkAttempts,providerCalls:0})+'\n')
const decide=()=>evaluate(load(registryFile),q.principalId,q.executionId,q.leaseId,'LOCAL_FIXTURE_COMMIT')
const route={accessTier:'limited',canDelegate:true,primaryModel:'mimo/mimo-v2.5',primaryReasoning:'native',fallbackModel:'deepseek/deepseek-v4-flash',fallbackReasoning:'max',sessionConsumed:false,quota:{status:'available',canStart:true,admissionVerified:false,price:0,balance:0,resetAt:null}}
let timer
rl.on('close',()=>{if(timer)clearTimeout(timer)})
rl.on('line',line=>{
  const m=JSON.parse(line)
  if(m.method==='initialize')return send({jsonrpc:'2.0',id:m.id,result:{protocolVersion:'2025-06-18',capabilities:{tools:{}},serverInfo:{name:'mock-principal-research',version:VERSION}}})
  if(m.method==='notifications/cancelled'){audit('TRANSPORT_CANCELLED');return}
  if(m.method!=='tools/call')return
  const decision=decide()
  if(m.params.name==='get_freebuff_route'){
    audit(decision)
    return result(m.id,JSON.stringify({...route,canDelegate:decision==='ALLOW_MOCK_AUTHORITY_ONLY',blockedReason:decision}))
  }
  if(m.params.name!=='delegate_to_freebuff')return result(m.id,'UNKNOWN_TOOL',true)
  if(decision!=='ALLOW_MOCK_AUTHORITY_ONLY'){audit(decision);return result(m.id,decision,true)}
  if(q.effectPolicy==='DENY'){audit('EFFECT_DENIED_INDEPENDENT_OF_PRINCIPAL');return result(m.id,'MOCK_EFFECT_DENIED',true)}
  if(m.params.arguments.cwd!==process.cwd())return result(m.id,'CWD_SCOPE_MISMATCH',true)
  writeFileSync(q.startedFile,'started\n')
  audit('ADMITTED_WAITING_FOR_FIXTURE_RELEASE')
  const work=()=>{
    if(q.releaseFile&&!existsSync(q.releaseFile)){timer=setTimeout(work,10);return}
    // Re-read durable authority at the effect boundary, including revocation.
    const before=decide()
    if(before!=='ALLOW_MOCK_AUTHORITY_ONLY'){audit(before);return result(m.id,before,true)}
    const r=load(registryFile);r.usedExecutions.push(q.executionId);save(registryFile,r)
    writeFileSync(join(process.cwd(),'result.json'),JSON.stringify({principalId:q.principalId,executionId:q.executionId})+'\n')
    const options={cwd:process.cwd(),env:{...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'},windowsHide:true}
    execFileSync('git',['add','result.json'],options)
    execFileSync('git',['-c','user.name=Research Fixture','-c','user.email=research-fixture@example.invalid','commit','-qm','test: isolated principal fixture'],options)
    audit('LOCAL_FIXTURE_COMMITTED')
    result(m.id,'[Freebuff 路由：Limited → mimo/mimo-v2.5；推理：native]\nMock credential authority only; local Git fixture committed.')
  }
  work()
})
