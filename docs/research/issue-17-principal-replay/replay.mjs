import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname, basename, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { VERSION, CAPABILITIES, digest, load, save, evaluate, addChild } from './mock-authority.mjs'
import { Principal, Lease, Observation, Receipt, jsonSchemas } from './schemas.mjs'

const HERE=dirname(fileURLToPath(import.meta.url))
const source=process.argv[2]||'/workspace/repos/autodev-principal-research'
const outputDirectory=resolve(process.argv[3]||join(HERE,'author-output'))
mkdirSync(outputDirectory,{recursive:true})
const expectedSha='a2378aa6fea3605f596e3ee264adbb2eb04c9010'
const allowedEnvironmentKeys=['PATH','PATHEXT','SYSTEMROOT','WINDIR','COMSPEC','TEMP','TMP']
assert.ok(Object.keys(process.env).every(key=>allowedEnvironmentKeys.includes(key)),'use run.py to supply the whitelist-only fixture environment')
const git=(args,cwd=source)=>execFileSync('git',args,{cwd,encoding:'utf8',env:{...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'}}).trim()
assert.equal(git(['rev-parse','HEAD']),expectedSha,'source must be exactly pinned')
assert.equal(git(['diff','--name-only',expectedSha]),'','tracked source must be unchanged')
const { FreebuffEngine }=await import(pathToFileURL(join(source,'dist/engines/freebuff.js')))
const { PreflightCache }=await import(pathToFileURL(join(source,'dist/preflight.js')))
const { EvidenceStore }=await import(pathToFileURL(join(source,'dist/engines/evidence-chain.js')))
const { createExecutionObservation, readExecutions, requestExecutionCancel }=await import(pathToFileURL(join(source,'dist/engines/execution-observation.js')))
const buildReceipt=JSON.parse(readFileSync(join(outputDirectory,'build-receipt.json'),'utf8'))
assert.equal(buildReceipt.source_sha,expectedSha);assert.equal(buildReceipt.node,process.version);assert.equal(buildReceipt.exit_code,0)
for(const [file,hash] of Object.entries(buildReceipt.compiled_sha256))assert.equal(createHash('sha256').update(readFileSync(join(source,file))).digest('hex'),hash,'compiled module changed after the fresh build')
const root=mkdtempSync(join(outputDirectory,'run-')),registryFile=join(root,'mock-registry.json')
const sourceFingerprint=digest({sourceSha:expectedSha,node:process.version,adapter:'FreebuffEngine/stdio-fixture'})
const registry={schemaVersion:VERSION,ownerState:'ACTIVE',principals:[],leases:[],usedExecutions:[]}
const principal=(id,identityIsolation='MOCK_DEDICATED',parentPrincipalId=null,capabilities=CAPABILITIES)=>({schemaVersion:VERSION,principalId:id,ownerRef:'fixture-owner:human-boundary-unmodified',role:'offline-research-worker',engineTag:'freebuff',runtimeFingerprint:sourceFingerprint,lifecycle:'ACTIVE',identityIsolation,credentialBinding:identityIsolation==='MOCK_DEDICATED'?'MOCK_REFERENCE':'SHARED_REFERENCE',parentPrincipalId,capabilities:[...capabilities]})
for(const id of ['A','B','D','E','EXPIRED','SHARED','EFFECT'])registry.principals.push(principal(id,id==='SHARED'?'SHARED':'MOCK_DEDICATED'))
const lease=(id,executionId)=>({schemaVersion:VERSION,leaseId:'lease-'+id+'-'+executionId,principalId:id,executionId,credentialRef:'fixture-ref:'+id,notBeforeMs:Date.now()-1000,expiresAtMs:Date.now()+120000,capabilities:[...registry.principals.find(p=>p.principalId===id).capabilities]})
const execs={A:'execution-A-first',B:'execution-B-first',C:'execution-child-C',D:'execution-cancel-D',E:'execution-continue-E',EXPIRED:'execution-expired',SHARED:'execution-shared',EFFECT:'execution-effect-denied'}
for(const [id,executionId] of Object.entries(execs))if(id!=='C')registry.leases.push(lease(id,executionId))
registry.leases.push(lease('A','execution-A-revoked'))
save(registryFile,registry)
const grantPolicy={schemaVersion:VERSION,authority:'TRUSTED_SYNTHETIC_FIXTURE_ONLY',grants:registry.leases,parentChildScopeRule:'Child scope must be a subset; changed scope requires a separate explicit fixture policy grant',approvalClaim:'NO_REAL_CREDENTIAL_OR_PROVIDER_APPROVAL'}
const grantPolicyDigest=digest(grantPolicy)
writeFileSync(join(root,'grant-policy.json'),JSON.stringify({...grantPolicy,grantPolicyDigest},null,2)+'\n')
const cases=[],receipts=[]
const note=(id,result,evidence)=>cases.push({id,result,evidence})
const admin=(op,id)=>JSON.parse(execFileSync(process.execPath,[join(HERE,'mock-authority.mjs'),'admin',registryFile,op,id,source],{encoding:'utf8'}))
const until=async(predicate,label)=>{const end=Date.now()+7000;while(!predicate()){if(Date.now()>end)throw Error('BOUND_EXCEEDED '+label);await new Promise(r=>setTimeout(r,10))}}
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)])
const rawFixtureSecret='synthetic_'+'principal_'+'secret_'+'value_for_leak_check'
assert.equal(process.env.ADNG_PRINCIPAL_FIXTURE_SECRET,undefined)
process.env.ADNG_PRINCIPAL_FIXTURE_SECRET=rawFixtureSecret

function start(id,executionId,options={}) {
  const r=load(registryFile),grant=options.leaseId?r.leases.find(l=>l.leaseId===options.leaseId):r.leases.find(l=>l.principalId===id&&l.executionId===executionId)||r.leases.find(l=>l.principalId===id)
  const folder=join(root,options.folder||executionId);mkdirSync(folder)
  const project=join(folder,'project');mkdirSync(project);git(['init','-q'],project)
  writeFileSync(join(project,'check.cjs'),"require('node:test')('actual local result',()=>{const r=JSON.parse(require('node:fs').readFileSync('result.json','utf8'));require('node:assert/strict').ok(r.executionId&&r.principalId)})\n")
  git(['add','check.cjs'],project);git(['-c','user.name=Research Fixture','-c','user.email=research-fixture@example.invalid','commit','-qm','test: research baseline'],project)
  const task={id:'research'+String(receipts.length).padStart(4,'0'),text:'Offline principal attribution fixture',line:0,status:'open'}
  const job={task,projectPath:project,executionId,writerIdentity:'freebuff'}
  const dataDir=options.observationDataDir||join(folder,'data');mkdirSync(dataDir,{recursive:true})
  const evidenceDataDir=join(folder,'gate-data');mkdirSync(evidenceDataDir)
  const observation=createExecutionObservation({dataDir,adapter:'freebuff',job,intervalMs:1000})
  const request={schemaVersion:VERSION,principalId:id,executionId,leaseId:grant.leaseId,startedFile:join(folder,'started'),auditFile:join(folder,'transport-audit.json'),effectPolicy:options.effectPolicy||'ALLOW',releaseFile:options.wait?join(folder,'released'):null}
  const requestFile=join(folder,'request.json');writeFileSync(requestFile,JSON.stringify(request)+'\n')
  const engine=new FreebuffEngine({id:'freebuff',command:process.execPath,baseArgs:[join(HERE,'mock-mcp.mjs'),registryFile,requestFile,source],cache:new PreflightCache(join(folder,'cache.json')),lockDir:join(folder,'mock-dedicated.lock'),timeoutMs:10000})
  const promise=engine.run({...job,control:observation.control}).then(result=>{
    observation.finish(result.ok?'completed':result.recoveryRequired?'unconfirmed':'failed')
    let ci={status:'not-run',executed:false,detail:'transport did not produce an admitted candidate'}
    if(result.ok){execFileSync(process.execPath,['--test','check.cjs'],{cwd:project,stdio:'pipe'});assert.equal(JSON.parse(readFileSync(join(project,'result.json'),'utf8')).executionId,executionId);ci={status:'pass',command:'node --test check.cjs',executed:true,exitCode:0,detail:'actual synthetic local Git result checked'}}
    const existing=new EvidenceStore(evidenceDataDir).record({executionId,task,risk:'low',writerIdentity:'freebuff',verification:{candidateCommit:git(['rev-parse','HEAD'],project),ci,reviewer:{status:'not-run',detail:'independent human/model reviewer unavailable; research is not promotion'}}})
    const evidence=JSON.parse(readFileSync(existing.path,'utf8'))
    assert.equal(evidence.writer.identity,'freebuff');assert.equal(evidence.verdict,'blocked');assert.equal(evidence.gates.reviewer.status,'not-run')
    const p=load(registryFile).principals.find(p=>p.principalId===id),audit=JSON.parse(readFileSync(request.auditFile,'utf8'))
    assert.equal(audit.fixtureSecretInherited,false);assert.equal(audit.providerCalls,0);assert.equal(audit.networkAttempts,0)
    const explicitGrant=load(registryFile).grantReceipts?.find(g=>g.principalId===id)
    const receipt={schemaVersion:VERSION,principalId:id,executionId,leaseId:grant.leaseId,engineTag:'freebuff',scope:'MOCK_AUTHORITY_ONLY',identityIsolation:p.identityIsolation,credentialBinding:p.credentialBinding,parentPrincipalId:p.parentPrincipalId,sourceSha:expectedSha,runtimeFingerprint:sourceFingerprint,grantPolicyDigest:explicitGrant?.policyDigest||grantPolicyDigest,result:result.ok?'MOCK_LOCAL_FIXTURE_COMPLETED':'BLOCKED_OR_UNCONFIRMED',reason:audit.event,gateBundleHash:existing.bundleHash,originalReviewerGate:evidence.gates.reviewer.status,backendRecoveryRequired:result.recoveryRequired===true,providerCalls:0,networkAttempts:audit.networkAttempts}
    receipt.receiptDigest=digest(receipt);Receipt.parse(receipt);const receiptFile=join(folder,'principal-receipt.json');writeFileSync(receiptFile,JSON.stringify(receipt,null,2)+'\n');receipts.push(receipt)
    return{result,receipt,audit,receiptFile,observation:readExecutions(dataDir).records.find(record=>record.executionId===executionId),engineEvidence:existing.path}
  })
  return{folder,project,dataDir,observation,request,promise,release:()=>writeFileSync(request.releaseFile,'released\n')}
}

try {
  const first=await start('A',execs.A).promise;assert.equal(first.result.ok,true)
  const b=start('B',execs.B,{wait:true});await until(()=>existsSync(b.request.startedFile),'B actual MCP child waiting')
  const childPrincipal=principal('C','MOCK_DEDICATED','B',['LOCAL_FIXTURE_COMMIT'])
  const childLease={schemaVersion:VERSION,leaseId:'lease-C-'+execs.C,principalId:'C',executionId:execs.C,credentialRef:'fixture-ref:C',notBeforeMs:Date.now()-1000,expiresAtMs:Date.now()+120000,capabilities:['LOCAL_FIXTURE_COMMIT']}
  const childGrantFile=join(root,'explicit-child-grant.json');writeFileSync(childGrantFile,JSON.stringify({principal:childPrincipal,lease:childLease,policyGrant:'EXPLICIT_MOCK_CHILD_SUBSET'})+'\n')
  const createdChild=admin('create-child',childGrantFile);assert.equal(load(registryFile).grantReceipts[0].principalId,'C')
  const revocation=admin('revoke','A');assert.equal(load(registryFile).ownerState,'ACTIVE')
  const revoked=await start('A','execution-A-revoked').promise;assert.equal(revoked.result.ok,false);assert.equal(revoked.audit.event,'PRINCIPAL_REVOKED')
  assert.equal(existsSync(b.request.releaseFile),false);b.release();const sibling=await b.promise;assert.equal(sibling.result.ok,true)
  note('same-engine-distinct-and-revoke-A-while-B-runs','PASS',{first:first.receiptFile,revoked:revoked.receiptFile,sibling:sibling.receiptFile,freshAdminProcess:revocation})
  const replay=await start('B',execs.B,{folder:'restart-replay-B'}).promise;assert.equal(replay.result.ok,false);assert.equal(replay.audit.event,'EXECUTION_REPLAY')
  note('completed-grant-replay-after-fresh-process-restart','PASS',replay.receiptFile)
  const wrong=await start('B','execution-unbound-B').promise;assert.equal(wrong.result.ok,false);assert.equal(wrong.audit.event,'LEASE_BINDING_MISMATCH')
  note('lease-cannot-move-to-another-execution','PASS',wrong.receiptFile)
  const foreign=await start('B','execution-foreign-principal-grant',{leaseId:load(registryFile).leases.find(l=>l.principalId==='A').leaseId}).promise
  assert.equal(foreign.result.ok,false);assert.equal(foreign.audit.event,'LEASE_BINDING_MISMATCH')
  note('cross-principal-credential-reference-replay-denied','PASS',foreign.receiptFile)
  admin('expire',load(registryFile).leases.find(l=>l.principalId==='EXPIRED').leaseId)
  const expired=await start('EXPIRED',execs.EXPIRED).promise;assert.equal(expired.result.ok,false);assert.equal(expired.audit.event,'LEASE_EXPIRED')
  note('expired-lease-after-fresh-process-restart','PASS',expired.receiptFile)
  const shared=await start('SHARED',execs.SHARED).promise;assert.equal(shared.result.ok,false);assert.equal(shared.audit.event,'SHARED_IDENTITY_UNENFORCEABLE')
  note('ambient-shared-auth-not-mislabeled-revocable','PASS',shared.receiptFile)
  const r=load(registryFile),count=r.principals.length
  assert.throws(()=>addChild(r,'C',principal('ESCALATED','MOCK_DEDICATED','C',CAPABILITIES)),/CHILD_SCOPE_ESCALATION/)
  assert.equal(r.principals.length,count)
  const beforeRejectedChild=digest(load(registryFile)),badChildFile=join(root,'rejected-child-grant.json')
  writeFileSync(badChildFile,JSON.stringify({principal:principal('ESCALATED','MOCK_DEDICATED','C',CAPABILITIES),lease:{...childLease,leaseId:'lease-ESCALATED',principalId:'ESCALATED',executionId:'execution-escalated',credentialRef:'fixture-ref:ESCALATED',capabilities:CAPABILITIES},policyGrant:'EXPLICIT_MOCK_CHILD_SUBSET'})+'\n')
  assert.throws(()=>admin('create-child',badChildFile),error=>error.status===1)
  assert.equal(digest(load(registryFile)),beforeRejectedChild,'rejected actual child grant mutated durable registry')
  const child=await start('C',execs.C).promise;assert.equal(child.result.ok,true);assert.equal(child.receipt.parentPrincipalId,'B')
  note('real-controlled-child-narrow-lineage-and-no-widening','PASS',{receipt:child.receiptFile,actualFreshProcessCreation:createdChild,actualFreshProcessEscalationRefusal:true,logicalParent:'B',osSpawner:'unchanged host FreebuffEngine; logical grant lineage is not OS process ancestry'})
  const effectGrant=load(registryFile).leases.find(l=>l.principalId==='EFFECT')
  assert.equal(evaluate(load(registryFile),'EFFECT',execs.EFFECT,effectGrant.leaseId,'LOCAL_FIXTURE_COMMIT'),'ALLOW_MOCK_AUTHORITY_ONLY')
  const effectRun=start('EFFECT',execs.EFFECT,{effectPolicy:'DENY'}),effect=await effectRun.promise
  assert.equal(effect.result.ok,false);assert.equal(effect.audit.event,'EFFECT_DENIED_INDEPENDENT_OF_PRINCIPAL');assert.equal(existsSync(join(effectRun.project,'result.json')),false)
  note('valid-principal-cannot-bypass-separate-synthetic-effect-policy','PASS',effect.receiptFile)
  const sharedControlDirectory=join(root,'shared-execution-control')
  const d=start('D',execs.D,{wait:true,observationDataDir:sharedControlDirectory}),e=start('E',execs.E,{wait:true,observationDataDir:sharedControlDirectory})
  await until(()=>existsSync(d.request.startedFile)&&existsSync(e.request.startedFile),'two real controlled MCP children')
  assert.equal(d.dataDir,e.dataDir)
  assert.deepEqual(readExecutions(sharedControlDirectory).records.map(record=>record.executionId).sort(),[execs.D,execs.E].sort())
  requestExecutionCancel(sharedControlDirectory,execs.D);d.observation.sample();e.observation.sample()
  assert.equal(e.observation.snapshot().cancelRequested,false);assert.equal(e.observation.control.signal.aborted,false);e.release()
  const cancelled=await d.promise,continued=await e.promise
  assert.equal(cancelled.result.cancelled,true);assert.equal(cancelled.result.recoveryRequired,true);assert.equal(cancelled.observation.phase,'unknown');assert.equal(continued.result.ok,true)
  assert.equal(continued.observation.cancelRequested,false);assert.equal(continued.observation.phase,'terminal');assert.equal(continued.observation.outcome,'completed')
  note('exact-execution-manual-cancel-does-not-fan-out-to-sibling','PASS',{cancelled:cancelled.receiptFile,continued:continued.receiptFile,sharedControlDirectory,nativeExecutionIds:readExecutions(sharedControlDirectory).records.map(record=>record.executionId).sort(),sameActualObservationStore:true})
  assert.throws(()=>createExecutionObservation({dataDir:e.dataDir,adapter:'freebuff',job:{executionId:execs.E,task:{id:'collision',text:'collision',line:0,status:'open'},projectPath:e.project}}),/identity already exists/)
  note('existing-native-execution-identity-collision-refuses-reuse','PASS',continued.receiptFile)
  for(const file of walk(root)){if(file.includes('/.git/'))continue;const text=readFileSync(file,'utf8');assert.equal(text.includes(rawFixtureSecret),false,'fixture secret leaked at '+file)}
  note('no-raw-fixture-secret-in-requests-logs-evidence-or-receipts','PASS',{filesChecked:walk(root).filter(f=>!f.includes('/.git/')).length,fixtureParentEnvStripped:true})
  const types=readFileSync(join(source,'src/types.ts'),'utf8'),adapters=types.match(/adapter: z\.enum\(\[([^\]]+)\]/)[1].match(/'[^']+'/g).map(s=>s.slice(1,-1))
  const inventory=adapters.map(adapter=>({schemaVersion:VERSION,adapter,classification:adapter==='freebuff'?'SHARED':'UNKNOWN',credentialBinding:'UNKNOWN',perPrincipalRevocation:'UNVERIFIED',evidence:adapter==='freebuff'?'src/engines/registry.ts: per-user homedir freebuff.lock; src/engines/freebuff.ts: shared session serialization':adapter==='codex'?'src/engines/registry.ts: shared fleet codex-home; src/engines/codex-runtime.ts: file/env credential policy, no provider revocation observation':'src/types.ts + src/engines/registry.ts: adapter exists; credential ownership not read or tested',inventoryMode:'READ_ONLY_SOURCE_ONLY'}))
  assert.equal(inventory.length,11);assert.equal(inventory.some(x=>x.classification==='DEDICATED'),false)
  writeFileSync(join(root,'principal-observations.json'),JSON.stringify(inventory,null,2)+'\n')
  for(const item of inventory)Observation.parse(item)
  assert.throws(()=>Principal.parse({...load(registryFile).principals[0],rawCredential:'forbidden'}))
  assert.throws(()=>Lease.parse({...load(registryFile).leases[0],credentialRef:'raw-secret-instead-of-reference'}))
  assert.throws(()=>Receipt.parse({...receipts[0],originalReviewerGate:'pass'}))
  assert.throws(()=>Observation.parse({...inventory[0],classification:'VERIFIED'}))
  writeFileSync(join(root,'schemas.json'),JSON.stringify(jsonSchemas(),null,2)+'\n')
  writeFileSync(join(outputDirectory,'schemas.json'),JSON.stringify(jsonSchemas(),null,2)+'\n')
  note('strict-machine-schemas-reject-secret-fields-unbound-credentials-and-false-review','PASS',{schemas:join(root,'schemas.json'),principalRecords:load(registryFile).principals.length,leaseRecords:load(registryFile).leases.length,receiptRecords:receipts.length})
  note('complete-read-only-adapter-inventory-preserves-shared-or-unknown','PASS',inventory)
  const sourcePaths=['src/engines/freebuff.ts','src/preflight.ts','src/engines/evidence-chain.ts','src/engines/execution-observation.ts','src/engines/kernel-verifier.ts','src/scheduler.ts','src/engines/registry.ts','src/types.ts']
  const sourceHashes=Object.fromEntries(sourcePaths.map(file=>{const blob=git(['rev-parse',`${expectedSha}:${file}`]);assert.equal(git(['hash-object',file]),blob);return[file,{gitBlob:blob,sha256:createHash('sha256').update(readFileSync(join(source,file))).digest('hex')}]}))
  const instruments=Object.fromEntries(['replay.mjs','mock-authority.mjs','mock-mcp.mjs','schemas.mjs','run.py','README.md'].map(file=>[file,createHash('sha256').update(readFileSync(join(HERE,file))).digest('hex')]))
  const relativize=value=>typeof value==='string'&&value.startsWith(root+'/')?value.slice(root.length+1):Array.isArray(value)?value.map(relativize):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,relativize(v)])):value
  const output={schemaVersion:VERSION,decision:'NARROW',sourceSha:expectedSha,sourceTree:git(['rev-parse','HEAD^{tree}']),sourceHashes,buildReceipt,instruments,canonicalResearchPr:25,canonicalResearchHead:'7db9509a5650e12f0a1f1e243bbd2ebe758d6e97',runtime:{node:process.version,platform:process.platform,arch:process.arch,actualTransport:'unchanged FreebuffEngine NDJSON stdio + controlled local Node MCP',credentialAuthority:'MOCK_ONLY; no provider-native revocation',externalCalls:0,fixtureNetworkAttempts:0,fixtureNetworkSentinel:'trusted-fixture API instrumentation; not hard host enforcement'},startedAndFinishedAt:new Date().toISOString(),root,relativeRunDirectory:basename(root),cases:relativize(cases),receipts,limits:['No actual provider identity isolation/revocation established. Real adapters remain SHARED/UNKNOWN.','Mock authority is a trusted research fixture, not a production credential broker or hostile-worker sandbox.','Registry mutations are serialized by this deterministic fixture; atomic rename handles ordinary restart only. No adversarial concurrent-update or power-loss guarantee.','Separate PrincipalReceipt sidecar is not a product principal registry; default Job/evidence writer identity remains engineTag.','No independent reviewer was run; existing EvidenceStore correctly blocks every candidate. No merge/promotion/production claim.','Effect ALLOW/DENY is an isolated synthetic fixture, not actual cross-engine #12 hard egress containment.','Cancellation retains native recovery-required/unknown backend truth; no provider stop claim.'],nextChange:'At most an attribution-only optional receipt design using exact executionId; retain real provider revocation UNKNOWN until an explicitly isolated provider-native test.'}
  output.resultDigest=digest(output);writeFileSync(join(root,'result.json'),JSON.stringify(output,null,2)+'\n')
  writeFileSync(join(outputDirectory,'latest-result.json'),JSON.stringify(output,null,2)+'\n')
  console.log(JSON.stringify({decision:output.decision,cases:cases.length,allPassed:cases.every(c=>c.result==='PASS'),receipts:receipts.length,sourceSha:expectedSha,resultFile:join(root,'result.json'),resultDigest:output.resultDigest}))
} finally { delete process.env.ADNG_PRINCIPAL_FIXTURE_SECRET }
