// Original #21 bounded synthetic runtime study, never installed into product runtime.
import assert from 'node:assert/strict'
import { mkdtempSync,mkdirSync,readFileSync,writeFileSync,existsSync,readdirSync,lstatSync,cpSync } from 'node:fs'
import { join,dirname,relative } from 'node:path'
import { fileURLToPath,pathToFileURL } from 'node:url'
import { randomBytes } from 'node:crypto'
import { spawnSync,execFileSync } from 'node:child_process'
import { VERSION,Requirement,Observation,Bundle,Receipt,jsonSchemas } from './environment-schemas.mjs'
import { observe,sha,json,git,safeEnv } from './contract.mjs'
import { digest,save } from './mock-authority.mjs'
const [source,output]=process.argv.slice(2),here=dirname(fileURLToPath(import.meta.url))
const sourceSha=git(source,'rev-parse','HEAD'),sourceTree=git(source,'rev-parse','HEAD^{tree}')
assert.equal(sourceSha,'a2378aa6fea3605f596e3ee264adbb2eb04c9010')
const build=json(join(output,'build-receipt.json'))
for(const [name,hash] of Object.entries({...build.compiledSha256,...build.sourceSha256}))assert.equal(sha(readFileSync(join(source,name))),hash)
assert.equal(build.exitCode,0)
const root=mkdtempSync(join(output,'run-'));mkdirSync(join(root,'cases'))
const put=(p,x)=>writeFileSync(p,typeof x==='string'?x:JSON.stringify(x,null,2)+'\n')
const emptyGit=join(root,'empty-git-config');put(emptyGit,'');process.env.GIT_CONFIG_GLOBAL=emptyGit;process.env.GIT_CONFIG_NOSYSTEM='1'
const gitEnv={...safeEnv({}),GIT_AUTHOR_NAME:'Offline research fixture',GIT_AUTHOR_EMAIL:'research@invalid.example',GIT_COMMITTER_NAME:'Offline research fixture',GIT_COMMITTER_EMAIL:'research@invalid.example',GIT_AUTHOR_DATE:'2026-10-05T00:00:00Z',GIT_COMMITTER_DATE:'2026-10-05T00:00:00Z'}
// Fixture Git has no global configuration, template hooks, credentials or remote fetch.
const gx=(cwd,...args)=>execFileSync('git',args,{cwd,env:gitEnv,encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:10000}).trim()
const setup=cwd=>{gx(cwd,'config','user.name','Offline research fixture');gx(cwd,'config','user.email','research@invalid.example');gx(cwd,'config','core.hooksPath',join(root,'absent-hooks'));gx(cwd,'remote','set-url','origin','fixture://owned-project/no-network')}
const init=cwd=>{mkdirSync(cwd);gx(cwd,'-c','init.templateDir=','init','-b','main');gx(cwd,'remote','add','origin','fixture://owned-project/no-network');setup(cwd)}
const project=join(root,'local-project');init(project)
put(join(project,'artifact.txt'),'synthetic checkpoint artifact 1\n')
const artifactHash=sha(readFileSync(join(project,'artifact.txt')))
put(join(project,'evidence.json'),{scope:'SYNTHETIC_ONLY',taskId:'fixture-task',artifactSha256:artifactHash,providerCalls:0,reviewGate:'NOT_RUN'})
put(join(project,'skill.txt'),'frozen fixture skill v1\n')
put(join(project,'effect-policy.json'),{version:'fixture-effect/v1',decision:'DENY',namespace:'EXTERNAL_EFFECTS_ONLY',localOwnedFixtureWrite:'ALLOW',hostContainment:'UNKNOWN'})
put(join(project,'capability.json'),{networkCapability:'TRUSTED_FIXTURE_NETWORK_SENTINEL_ONLY',hostNetworkContainment:'UNKNOWN'})
put(join(project,'checkpoint.txt'),'fixture-task / fixture-execution / checkpoint 1\n')
put(join(project,'pending-steer.json'),{kind:'STEER',executionId:'fixture-execution',instruction:'opaque unsupported command retained at source'})
put(join(project,'pending-queue.json'),{kind:'QUEUE',executionId:'fixture-execution',instruction:'opaque unsupported command retained at source'})
put(join(project,'fixture-cli.mjs'),`import {readFileSync,writeFileSync,existsSync} from 'node:fs';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
if(process.argv[2]==='--version'){console.log('offline-fixture-cli/v1');process.exit(0)}
if(process.argv[2]!=='--resume')throw Error('UNKNOWN_FIXTURE_COMMAND');
const h=createHash('sha256').update(readFileSync('artifact.txt')).digest('hex');const e=JSON.parse(readFileSync('evidence.json','utf8'));
if(h!==e.artifactSha256||e.scope!=='SYNTHETIC_ONLY')throw Error('FIXTURE_INPUT_DIVERGENCE');
if(!existsSync('finished.txt')){writeFileSync('finished.txt','bounded fixture resumed\\n');execFileSync('git',['add','finished.txt']);execFileSync('git',['commit','-m','synthetic fixture continuation'],{stdio:'pipe'})}
console.log(JSON.stringify({fixture:'resumed',artifactSha256:h,providerCalls:0}));\n`)
put(join(project,'check.cjs'),`const {test}=require('node:test');const a=require('node:assert/strict');const fs=require('node:fs');const c=require('node:crypto');
test('actual fixture continuation and exact input/evidence',()=>{a.equal(fs.readFileSync('finished.txt','utf8'),'bounded fixture resumed\\n');a.equal(fs.readFileSync('artifact.txt','utf8'),'synthetic checkpoint artifact 1\\n');a.equal(c.createHash('sha256').update(fs.readFileSync('artifact.txt')).digest('hex'),JSON.parse(fs.readFileSync('evidence.json','utf8')).artifactSha256)});\n`)
gx(project,'add','.');gx(project,'commit','-m','synthetic source checkpoint');const base=gx(project,'rev-parse','HEAD')
const clone=name=>{const cwd=join(root,name);gx(root,'-c','init.templateDir=','clone','--no-local',project,cwd);setup(cwd);return cwd}
const { RunDb }=await import(pathToFileURL(join(source,'dist/db.js')))
const { attemptAccounting }=await import(pathToFileURL(join(source,'dist/engines/attempt-accounting.js')))
const { TeamState }=await import(pathToFileURL(join(source,'dist/engines/team-state.js')))
const { globalCostReport }=await import(pathToFileURL(join(source,'dist/globalcost.js')))
const billingDir=join(root,'billing'),cfgDir=join(root,'billing-configs');mkdirSync(billingDir);mkdirSync(cfgDir)
const db=new RunDb(join(billingDir,'run.db'))
db.record({taskId:'synthetic-prior-booked-cost',ok:true,costUsd:.25,engine:'offline-fixture',detail:'synthetic accounting amount, no provider expenditure',accounting:attemptAccounting({ok:true,output:'fixture',costUsd:.25,tokensIn:0,tokensOut:0,tokensCached:0},{costPerRunUsd:.25})});db.close()
const cfg=join(cfgDir,'source.json');put(cfg,{dataDir:billingDir,timezoneOffsetHours:0,engines:{'offline-fixture':{subscription:false}}})
const prior=new TeamState(project)
const existing=prior.claim({executionId:'prior-source-reservation',task:{id:'prior-source-task',text:'owned prior task',line:0,status:'open',ownership:{write:['prior-owned.txt'],resources:[]}},workerId:'offline-research',reservedCostUsd:.6,spentUsd:.25,dailyHardUsd:1,leaseMs:600000});assert(existing.ok)
const budget={budgetRef:'fixture-budget:authoritative',policyHash:sha(readFileSync(cfg)),ledgerRef:'fixture-ledger:source-git-common-dir',ledgerIdentityDigest:sha(prior.path),costClass:'LOCAL_SYNTHETIC_ZERO_PROVIDER_COST',reservationUsd:.1,hardUsd:1}
const now=Date.now(),authority=join(root,'mock-principal-registry.json')
const principal={schemaVersion:'principal-research/v1',principalId:'fixture-principal',ownerRef:'fixture-owner:human-boundary-unmodified',role:'offline-research-worker',engineTag:'freebuff',runtimeFingerprint:sha(sourceSha),lifecycle:'ACTIVE',identityIsolation:'MOCK_DEDICATED',credentialBinding:'MOCK_REFERENCE',parentPrincipalId:'fixture-parent',capabilities:['LOCAL_FIXTURE_COMMIT','READ_METADATA']}
const parent={...principal,principalId:'fixture-parent',parentPrincipalId:null}
const lease={schemaVersion:'principal-research/v1',leaseId:'fixture-lease',principalId:principal.principalId,executionId:'fixture-execution',credentialRef:'fixture-ref:HANDOFF',notBeforeMs:now-1000,expiresAtMs:now+600000,capabilities:['LOCAL_FIXTURE_COMMIT','READ_METADATA']}
const registry={schemaVersion:'principal-research/v1',principals:[parent,principal],leases:[lease],usedExecutions:[]};save(authority,registry)
const principalRef={principalId:principal.principalId,parentPrincipalId:principal.parentPrincipalId,leaseId:lease.leaseId,executionId:lease.executionId,credentialRef:lease.credentialRef,identityIsolation:'MOCK_DEDICATED',scope:'MOCK_AUTHORITY_ONLY'}
const artifacts=['artifact.txt'],evidence=['evidence.json']
const sourceObs=observe({cwd:project,environmentId:'local-owned-fixture',providerKind:'UNKNOWN',artifacts,evidence,principal:principalRef,budget})
const requirement=Requirement.parse({schemaVersion:VERSION,...Object.fromEntries(['os','node','cli','skillDigest','policyDigest','networkCapability','storageDurability'].map(k=>[k,sourceObs[k]])),localOnlyResources:[],requiredEffect:'DENY',explicitSelection:true,budget,principal:principalRef})
const bundleFor=(obs,targetId,req,dir='LOCAL_TO_SIMULATOR')=>Bundle.parse({schemaVersion:VERSION,bundleId:'bundle-'+targetId,taskId:'fixture-task',executionId:lease.executionId,sourceEnvironment:obs.environmentId,targetEnvironment:targetId,sourceObservationDigest:digest(obs),requirementDigest:digest(req),repoIdentity:obs.repoIdentity,commit:obs.commit,sourceWorktreePath:obs.worktreePath,dirtyState:'',dirtyDigest:obs.dirtyDigest,artifacts:obs.artifacts,evidence:obs.evidence,principal:req.principal,budget:req.budget,checkpoint:{kind:'RESEARCH_FIXTURE',locator:'checkpoint.txt',sha256:sha(readFileSync(join(obs.worktreePath,'checkpoint.txt'))),cwdBinding:obs.worktreePath},pending:[],explicitSelection:true,direction:dir,acceptableDrift:'NONE'})
const trackedBytes=cwd=>digest({head:gx(cwd,'rev-parse','HEAD'),status:gx(cwd,'status','--porcelain=v1','--untracked-files=all'),diff:gx(cwd,'diff','--binary','HEAD'),files:gx(cwd,'ls-files').split('\n').filter(Boolean).map(f=>[f,sha(readFileSync(join(cwd,f)))])})
const cases=[],fakeSecret='FAKE_MEMORY_ONLY_'+randomBytes(20).toString('hex')
const runCase=(name,expected,change=()=>{},opts={})=>{
 const cwd=opts.cwd||clone('target-'+name),id='env-'+name,dir=join(root,'cases',name);mkdirSync(dir)
 const req=structuredClone(opts.requirement||requirement),src=opts.sourceObservation||sourceObs
 const q={cwd,environmentId:id,providerKind:'MANAGED_SANDBOX',artifacts,evidence,principal:structuredClone(req.principal),budget:structuredClone(req.budget),requirement:req,bundle:bundleFor(src,id,req,opts.direction),sourceObservation:src,sourceCwd:src.worktreePath,expectedTask:'fixture-task',authorityPath:authority,authoritativeBudget:{ledgerRef:budget.ledgerRef,config:cfg,project},attemptId:'admission-'+name,commandLog:join(dir,'fixture-command.log'),observationOutput:join(dir,'observation.json'),receiptOutput:join(dir,'receipt.json')}
 change(q)
 // Source/target snapshots are taken after intentional scenario drift, before acceptance.
 const before={source:trackedBytes(q.sourceCwd),target:trackedBytes(cwd),claims:prior.snapshot()}
 put(join(dir,'input.json'),q)
 process.env.FIXTURE_RAW_SECRET=fakeSecret
 const candidateEnv=safeEnv({});assert(!Object.hasOwn(candidateEnv,'FIXTURE_RAW_SECRET'));delete process.env.FIXTURE_RAW_SECRET
 assert.equal(candidateEnv.GIT_CONFIG_NOSYSTEM,'1');assert.equal(candidateEnv.GIT_CONFIG_GLOBAL,emptyGit)
 const r=spawnSync(process.execPath,[join(here,'observer.mjs'),join(dir,'input.json')],{cwd:source,env:candidateEnv,encoding:'utf8',timeout:20000})
 put(join(dir,'observer.log'),r.stdout+r.stderr);assert.equal(r.status,0,name+': '+r.stderr)
 const receipt=Receipt.parse(json(q.receiptOutput)),obs=Observation.parse(json(q.observationOutput))
 assert.equal(receipt.state,expected,name);assert.equal(receipt.receiptDigest,digest(Object.fromEntries(Object.entries(receipt).filter(([k])=>k!=='receiptDigest'))))
 const after={source:trackedBytes(q.sourceCwd),target:trackedBytes(cwd),claims:prior.snapshot()}
 if(expected!=='RESUMED_VERIFIED'){assert.deepEqual(receipt.fixtureCommand,[],name);assert.equal(receipt.fixtureExit,null);assert.equal(before.source,after.source,name+' source overwritten');assert.equal(before.target,after.target,name+' target overwritten');assert.deepEqual(before.claims,after.claims,name+' source ownership changed')}
 const row={name,result:'PASS',expected,actual:receipt.state,receiptDigest:receipt.receiptDigest,fixtureStarted:receipt.fixtureCommand.length>0,negativeBytesUnchanged:expected==='RESUMED_VERIFIED'?null:before.source===after.source&&before.target===after.target,actualTargetFacts:obs.actualFacts,simulatedOverrides:obs.simulatedOverrides,before,after,receipt:'cases/'+name+'/receipt.json',observation:'cases/'+name+'/observation.json'}
 cases.push(row);return {cwd,receipt,observation:obs}
}
for(const [key,value] of [['node','v99.0.0'],['cli','offline-fixture-cli/v99'],['os','win32'],['skillDigest','0'.repeat(64)],['networkCapability','UNKNOWN'],['storageDurability','UNKNOWN']])runCase('simulated-'+key,'ENVIRONMENT_MISMATCH',q=>q.simulatedOverrides={[key]:value})
runCase('simulation-cannot-upgrade-actual-runtime','ENVIRONMENT_MISMATCH',q=>{q.requirement.node='v18.0.0';q.simulatedOverrides={node:'v18.0.0'};q.bundle.requirementDigest=digest(q.requirement)})
runCase('unknown-environment','UNKNOWN',q=>q.providerKind='UNKNOWN')
for(const resource of ['LAN','DEVICE','BROWSER_STATE','WINDOWS_APP'])runCase('local-only-'+resource.toLowerCase(),'LOCAL_ONLY',q=>{q.requirement.localOnlyResources=[resource];q.bundle.requirementDigest=digest(q.requirement)})
runCase('declared-windows-is-not-actual-windows','LOCAL_ONLY',q=>{q.providerKind='LOCAL_WINDOWS';q.requirement.localOnlyResources=['DEVICE'];q.bundle.requirementDigest=digest(q.requirement)})
runCase('dirty-return-no-overwrite','DIVERGED',q=>put(join(q.cwd,'artifact.txt'),'intentional dirty target retained\n'))
runCase('changed-policy','ENVIRONMENT_MISMATCH',q=>{put(join(q.cwd,'effect-policy.json'),{version:'fixture-effect/v2',decision:'ALLOW'});gx(q.cwd,'add','.');gx(q.cwd,'commit','-m','intentional fixture policy drift')})
runCase('changed-skill','ENVIRONMENT_MISMATCH',q=>{put(join(q.cwd,'skill.txt'),'intentional skill drift\n');gx(q.cwd,'add','.');gx(q.cwd,'commit','-m','intentional fixture skill drift')})
runCase('changed-cli','ENVIRONMENT_MISMATCH',q=>{put(join(q.cwd,'fixture-cli.mjs'),"console.log('offline-fixture-cli/v2')\n");gx(q.cwd,'add','.');gx(q.cwd,'commit','-m','intentional fixture CLI drift')})
runCase('stale-source-commit','ENVIRONMENT_MISMATCH',q=>{put(join(project,'stale.txt'),'intentional source advance\n');gx(project,'add','.');gx(project,'commit','-m','intentional fixture source advance')});gx(project,'reset','--hard',base)
const denyPrincipal=(name,change)=>{const changed=structuredClone(registry);change(changed);save(authority,changed);runCase(name,'DENIED');save(authority,registry)}
denyPrincipal('missing-lease',r=>r.leases=[])
denyPrincipal('stale-principal',r=>r.principals.find(p=>p.principalId===principal.principalId).lifecycle='REVOKED')
denyPrincipal('shared-not-upgraded',r=>r.principals.find(p=>p.principalId===principal.principalId).identityIsolation='SHARED')
denyPrincipal('missing-local-write-capability',r=>r.leases[0].capabilities=['READ_METADATA'])
runCase('duplicated-execution-binding','DENIED',q=>{q.principal.executionId='wrong-execution';q.requirement.principal.executionId='wrong-execution';q.bundle.principal.executionId='wrong-execution';q.bundle.requirementDigest=digest(q.requirement)})
runCase('wrong-target-binding','ENVIRONMENT_MISMATCH',q=>q.bundle.targetEnvironment='wrong-target')
runCase('wrong-source-observation-binding','ENVIRONMENT_MISMATCH',q=>q.bundle.sourceObservationDigest='0'.repeat(64))
runCase('wrong-bundle-source-worktree-path','ENVIRONMENT_MISMATCH',q=>q.bundle.sourceWorktreePath=q.cwd)
runCase('wrong-source-cwd-binding','ENVIRONMENT_MISMATCH',q=>q.sourceCwd=q.cwd)
runCase('missing-budget-authority','BUDGET_BLOCKED',q=>delete q.authoritativeBudget)
runCase('foreign-clone-ledger-refused','BUDGET_BLOCKED',q=>q.authoritativeBudget.project=q.cwd)
runCase('reservation-hard-cap','BUDGET_BLOCKED',q=>{q.budget.reservationUsd=.2;q.requirement.budget.reservationUsd=.2;q.bundle.budget.reservationUsd=.2;q.bundle.requirementDigest=digest(q.requirement)})
const originalCfg=readFileSync(cfg);put(cfg,{dataDir:billingDir,timezoneOffsetHours:1,engines:{}});runCase('changed-budget-policy','BUDGET_BLOCKED');writeFileSync(cfg,originalCfg)
runCase('unsupported-steer-queue-preserved','UNSUPPORTED_PENDING_CONTROL',q=>q.bundle.pending=['STEER','QUEUE'].map(kind=>({kind,locator:'pending-'+kind.toLowerCase()+'.json',sha256:sha(readFileSync(join(project,'pending-'+kind.toLowerCase()+'.json'))),support:'UNKNOWN'})))
const archived=json(join(here,'windows-evidence.json'))
const frozenWindows={...sourceObs,environmentId:'archived-windows-fixture',providerKind:'LOCAL_WINDOWS',observationBasis:'FROZEN_ARCHIVED_WINDOWS_WITH_SYNTHETIC_PROJECT',os:'win32',node:'v22.23.3',actualFacts:{os:'win32 (archived CI only)',node:'v22.23.3 (archived CI only)',cli:'UNKNOWN',skill:'UNKNOWN',network:'UNKNOWN',storage:'UNKNOWN'},simulatedOverrides:{project:'synthetic Linux-owned Git fixture; not the archived Windows checkout'},unsupported:[...sourceObs.unsupported,'CURRENT_WINDOWS_TARGET','WINDOWS_TOOLCHAIN_SKILL_AUTH_FACTS_UNKNOWN']}
Observation.parse(frozenWindows);put(join(root,'frozen-windows-observation.json'),frozenWindows)
const windowsRequirement={...requirement,os:'win32'}
runCase('frozen-windows-to-linux-mismatch','ENVIRONMENT_MISMATCH',()=>{},{sourceObservation:frozenWindows,requirement:windowsRequirement})
// Native SDK negative: cloning resets reservations; controlled source binding prevents adoption.
const freshClone=clone('fresh-ledger-probe'),freshTeam=new TeamState(freshClone)
const freshAdmission=freshTeam.claim({executionId:'unsafe-fresh-clone-probe',task:{id:'fresh-probe',text:'owned probe',line:0,status:'open',ownership:{write:['fresh.txt'],resources:[]}},workerId:'offline-research',reservedCostUsd:.2,spentUsd:.25,dailyHardUsd:1,leaseMs:60000})
assert(freshAdmission.ok);freshTeam.release('unsafe-fresh-clone-probe',freshAdmission.token)
put(join(root,'ledger-reset-probe.json'),{result:'PASS',nativeFreshCloneWouldAdmit:true,sourceLedgerDigest:sha(prior.path),freshLedgerDigest:sha(freshTeam.path),differentLedger:prior.path!==freshTeam.path,freshSnapshot:freshTeam.snapshot(),scope:'SOURCE_BACKED_NEGATIVE_FINDING; fixture handoff refuses this substituted authority'});freshTeam.close()
const nativeCwd=clone('native-backend-project'),nativeData=join(root,'native-data');put(join(nativeCwd,'native-check.cjs'),"const {test}=require('node:test');const a=require('node:assert/strict');const fs=require('node:fs');test('actual fresh backend progress',()=>a.equal(fs.readFileSync('native-done.txt','utf8'),'verified after fresh process resume\\n'));\n");gx(nativeCwd,'add','.');gx(nativeCwd,'commit','-m','synthetic native verifier')
const native=[]
for(const mode of ['pause','resume']) {
 const out=join(root,'native-'+mode+'.json'),r=spawnSync(process.execPath,[join(here,'native-control.mjs'),source,nativeData,nativeCwd,mode,out],{cwd:source,env:safeEnv({}),encoding:'utf8',timeout:20000})
 put(join(root,'native-'+mode+'.log'),r.stdout+r.stderr);assert.equal(r.status,0,mode+': '+r.stderr);native.push(json(out))
 if(mode==='pause') {
  const sourceRunDir=join(nativeData,'runs','research-native-handoff'),targetRunDir=join(root,'native-copied-run')
  // Copy actual continuation inputs. Coordination DB/locks are not checkpoint inputs.
  const continuation=locator=>['state.json','goal.json','metrics.json','attempts.jsonl','evidence','checkpoints'].includes(locator)||locator.startsWith('evidence/')||locator.startsWith('checkpoints/')
  cpSync(sourceRunDir,targetRunDir,{recursive:true,filter:p=>p===sourceRunDir||continuation(relative(sourceRunDir,p).replace(/\\/g,'/'))})
  const files=[]
  const inventory=(dir,prefix='')=>{for(const name of readdirSync(dir).sort()){const p=join(dir,name),locator=prefix+name;if(!continuation(locator))continue;if(lstatSync(p).isDirectory())inventory(p,locator+'/');else files.push({locator,sha256:sha(readFileSync(p))})}}
  inventory(sourceRunDir)
  const actualState=json(join(targetRunDir,'state.json'));assert.equal(actualState.phase,'interrupted');assert.equal(actualState.cwd,nativeCwd)
  const manifest={schemaVersion:'native-checkpoint-copy/v1',scope:'ACTUAL_SDK_PAUSED_CONTINUATION_INPUTS_RESEARCH_WRAPPER_ONLY',excludedArtifacts:'coordination SQLite and driver locks; not continuation/checkpoint inputs',sourceSha,sourceRunDir,targetRunDir,recordedCwd:actualState.cwd,phase:actualState.phase,nativeDispatchInvoked:false,files,checkpointCount:files.filter(f=>f.locator.startsWith('checkpoints/')).length}
  const manifestPath=join(root,'native-copy-manifest.json');put(manifestPath,manifest)
  const targetCwd=join(root,'native-copied-target');gx(root,'-c','init.templateDir=','clone','--no-local',nativeCwd,targetCwd);setup(targetCwd)
  const nativeObs=observe({cwd:nativeCwd,environmentId:'native-paused-source',providerKind:'UNKNOWN',artifacts,evidence,principal:principalRef,budget})
  runCase('actual-copied-native-state-wrapper-refusal','HOST_BOUND_CHECKPOINT',q=>{
   q.checkpointPath=join(targetRunDir,'state.json');q.nativeCopyManifestPath=manifestPath
   q.bundle.checkpoint={kind:'NATIVE_HOST_BOUND',locator:'state.json',sha256:sha(readFileSync(q.checkpointPath)),cwdBinding:actualState.cwd,copyManifest:{locator:'native-copy-manifest.json',sha256:sha(readFileSync(manifestPath))}}
  },{cwd:targetCwd,sourceObservation:nativeObs})
  assert.equal(sha(readFileSync(join(targetRunDir,'state.json'))),files.find(f=>f.locator==='state.json').sha256)
 }
}
assert.equal(native[0].state.cwd,native[1].state.cwd)
cases.push({name:'actual-native-pause-fresh-process-resume',result:'PASS',phaseBefore:native[0].state.phase,phaseAfter:native[1].state.phase,interventions:native[1].state.metrics.interventions,resumes:native[1].state.metrics.resumes,scope:'SAME_PATH_ORDINARY_CONTROL_ONLY_NOT_STEER_QUEUE'})
const forward=runCase('actual-portable-forward','RESUMED_VERIFIED')
const continued=observe({cwd:forward.cwd,environmentId:'simulator-after-continuation',providerKind:'MANAGED_SANDBOX',artifacts,evidence,principal:principalRef,budget})
assert.notEqual(continued.commit,base);assert.deepEqual(continued.artifacts,sourceObs.artifacts);assert.deepEqual(continued.evidence,sourceObs.evidence)
assert.equal(gx(project,'status','--porcelain=v1','--untracked-files=all'),'')
gx(project,'fetch','--no-tags',forward.cwd,'HEAD');gx(project,'merge','--ff-only','FETCH_HEAD')
const returned=runCase('actual-portable-return','RESUMED_VERIFIED',()=>{},{cwd:project,sourceObservation:continued,direction:'SIMULATOR_TO_LOCAL'})
assert.equal(gx(project,'rev-parse','HEAD'),continued.commit);assert.deepEqual(returned.observation.artifacts,continued.artifacts);assert.deepEqual(returned.observation.evidence,continued.evidence)
const schemas=jsonSchemas();put(join(root,'schemas.json'),schemas)
assert(!Bundle.safeParse({...bundleFor(sourceObs,'bad',requirement),rawCookie:fakeSecret}).success)
assert(!Requirement.safeParse({...requirement,rawApiKey:fakeSecret}).success)
const scan=folder=>{for(const n of readdirSync(folder)){if(n==='.git')continue;const p=join(folder,n);if(lstatSync(p).isDirectory())scan(p);else assert(!readFileSync(p).includes(Buffer.from(fakeSecret)),p+' contains fake secret')}}
scan(root);cases.push({name:'strict-schemas-zero-raw-secrets',result:'PASS',rejectedRawSecretFields:2,secretFixtureScope:'RANDOM_IN_MEMORY_VALUE_NEVER_PERSISTED',ambientCredentialEnvironment:'WHITELIST_ONLY'})
const finalBilling=globalCostReport(cfg,new Date().toISOString(),[],budget.policyHash);assert(finalBilling.complete);assert.equal(finalBilling.bookedUsd,.25)
put(join(root,'source-observation.json'),sourceObs);put(join(root,'requirement.json'),requirement);put(join(root,'final-ledger.json'),{billing:finalBilling,snapshot:prior.snapshot(),originalReservationStillActive:prior.snapshot().claims.some(c=>c.execution_id==='prior-source-reservation'&&c.active===1)});prior.close()
const instruments=['run.py','replay.mjs','contract.mjs','observer.mjs','native-control.mjs','environment-schemas.mjs','mock-authority.mjs','schemas.mjs','README.md','source-evidence.json','windows-evidence.json','windows-log-excerpt.txt']
const partial={schemaVersion:VERSION,disposition:'NARROW',sourceSha,sourceTree,mainComparison:json(join(here,'source-evidence.json')).comparison,build,runRoot:root,caseCount:cases.length,cases,instrumentSha256:Object.fromEntries(instruments.map(f=>[f,sha(readFileSync(join(here,f)))])),frozenWindowsArchive:archived,metrics:{providerCalls:0,networkAttempts:0,actualWindowsRuntimeRuns:0,actualNativeCrossHostResumes:0,humanStepReduction:'NOT_MEASURED',negativeCases:cases.filter(c=>c.negativeBytesUnchanged===true).length},remaining:['STEER_QUEUE_HANDOFF_UNSUPPORTED','NATIVE_CHECKPOINT_CWD_HOST_BOUND','DISTRIBUTED_RESERVATION_AUTHORITY_UNKNOWN','REAL_PROVIDER_UNKNOWN','REAL_AUTH_REVOCATION_UNKNOWN','HOST_NETWORK_CONTAINMENT_UNKNOWN','CURRENT_WINDOWS_TARGET_UNKNOWN','REVIEW_GATE_NOT_RUN']}
const result={...partial,resultDigest:digest(partial)};put(join(root,'result.json'),result);put(join(output,'latest-result.json'),result);put(join(output,'schemas.json'),schemas)
process.stdout.write(JSON.stringify({result:'PASS',disposition:result.disposition,caseCount:cases.length,runRoot:root,resultDigest:result.resultDigest})+'\n')
