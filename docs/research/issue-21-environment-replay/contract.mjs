// Only trusted disposable-fixture code is executed. This is not a cloud adapter.
import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { Requirement,Observation,Bundle,Receipt,VERSION } from './environment-schemas.mjs'
import { load,evaluate,digest } from './mock-authority.mjs'
export const sha=b=>createHash('sha256').update(b).digest('hex')
export const json=p=>JSON.parse(readFileSync(p,'utf8'))
export const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8',timeout:10000,stdio:['ignore','pipe','pipe']}).trim()
export const safeEnv=extra=>({PATH:process.env.PATH||'',...(process.env.SYSTEMROOT?{SYSTEMROOT:process.env.SYSTEMROOT}:{}),RESEARCH_SOURCE:process.env.RESEARCH_SOURCE,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:process.env.GIT_CONFIG_GLOBAL,...extra})
export function observe(q) {
 const dirty=git(q.cwd,'status','--porcelain=v1','--untracked-files=all')
 const diff=git(q.cwd,'diff','--binary','HEAD')
 const cli=spawnSync(process.execPath,[join(q.cwd,'fixture-cli.mjs'),'--version'],{cwd:q.cwd,env:safeEnv({}),encoding:'utf8',timeout:10000})
 if(cli.status!==0)throw Error('FIXTURE_CLI_UNAVAILABLE')
 const probe=join(q.cwd,'.durability-probe');writeFileSync(probe,'owned disposable storage probe');const readback=readFileSync(probe,'utf8');rmSync(probe)
 const facts=json(join(q.cwd,'capability.json'))
 const files=names=>names.map(locator=>({locator,sha256:sha(readFileSync(join(q.cwd,locator)))}))
 const actual={os:process.platform,node:process.version,cli:cli.stdout.trim(),skillDigest:sha(readFileSync(join(q.cwd,'skill.txt'))),policyDigest:sha(readFileSync(join(q.cwd,'effect-policy.json'))),networkCapability:facts.networkCapability,storageDurability:readback==='owned disposable storage probe'?'SAME_PROCESS_WRITE_READ':'UNKNOWN'}
 // Variations are declared simulator inputs, never claimed actual OS/runtime.
 const overrides=q.simulatedOverrides||{}
 return Observation.parse({schemaVersion:VERSION,environmentId:q.environmentId,providerKind:q.providerKind,observationBasis:'ACTUAL_SUBPROCESS_READBACK',observedAt:new Date().toISOString(),...actual,...overrides,actualFacts:actual,repoIdentity:git(q.cwd,'remote','get-url','origin'),commit:git(q.cwd,'rev-parse','HEAD'),worktreePath:q.cwd,dirtyState:dirty,dirtyDigest:sha(dirty+'\n'+diff),artifacts:files(q.artifacts),evidence:files(q.evidence),principal:q.principal,budget:q.budget,unsupported:['REAL_PROVIDER','REAL_CREDENTIAL_REVOCATION','HOST_OS_CONTAINMENT','NATIVE_CROSS_HOST_RESUME','STEER_QUEUE_DELIVERY'],simulatedOverrides:overrides})
}
export async function preflight(q,observation,source) {
 const req=Requirement.parse(q.requirement),bundle=Bundle.parse(q.bundle),obs=Observation.parse(observation),checks=[]
 let state='RESUMED_VERIFIED',principalDecision='NOT_EVALUATED',budgetReport=null,fixtureCommand=[],fixtureExit=null
 const check=(name,expected,actual)=>{const ok=digest(expected)===digest(actual);checks.push({name,ok,expected,actual});return ok}
 const effect=json(join(q.cwd,'effect-policy.json')),declaredEffectDecision=['DENY','ALLOW'].includes(effect.decision)?effect.decision:'UNKNOWN'
 if(declaredEffectDecision!=='DENY')state='ENVIRONMENT_MISMATCH'
 // No actual LAN/device/browser/Windows-app resource adapter exists in this study.
 // Neither a logical environment class nor a simulated OS can establish availability.
 if(req.localOnlyResources.length)state='LOCAL_ONLY'
 if(obs.providerKind==='UNKNOWN'||Object.values(obs).includes('UNKNOWN'))state='UNKNOWN'
 for(const key of ['os','node','cli','skillDigest','policyDigest','networkCapability','storageDurability']) {
  if(!check(key,req[key],obs[key]))state='ENVIRONMENT_MISMATCH'
  if(!check('actualFact:'+key,req[key],obs.actualFacts[key]))state='ENVIRONMENT_MISMATCH'
 }
 if(!check('requirementDigest',digest(req),bundle.requirementDigest))state='ENVIRONMENT_MISMATCH'
 if(!check('sourceObservationDigest',bundle.sourceObservationDigest,digest(Observation.parse(q.sourceObservation)))||!check('sourceEnvironment',bundle.sourceEnvironment,q.sourceObservation.environmentId)||!check('targetEnvironment',bundle.targetEnvironment,obs.environmentId)||!check('taskIdentity',q.expectedTask,bundle.taskId))state='ENVIRONMENT_MISMATCH'
 if(!check('sourceWorktreePath',bundle.sourceWorktreePath,q.sourceCwd)||!check('sourceObservationWorktreePath',bundle.sourceWorktreePath,q.sourceObservation.worktreePath))state='ENVIRONMENT_MISMATCH'
 if(!check('sourceCommitStillCurrent',bundle.commit,git(q.sourceCwd,'rev-parse','HEAD')))state='ENVIRONMENT_MISMATCH'
 if(!check('repoIdentity',bundle.repoIdentity,obs.repoIdentity)||!check('commit',bundle.commit,obs.commit))state='ENVIRONMENT_MISMATCH'
 if(!check('dirtyState','',obs.dirtyState)||!check('dirtyDigest',bundle.dirtyDigest,obs.dirtyDigest))state='DIVERGED'
 for(const key of ['artifacts','evidence'])if(!check(key,bundle[key],obs[key]))state='DIVERGED'
 if(!check('checkpointDigest',bundle.checkpoint.sha256,sha(readFileSync(q.checkpointPath||join(q.cwd,bundle.checkpoint.locator)))))state='DIVERGED'
 if(!check('principalReferences',bundle.principal,obs.principal)||!check('requiredPrincipal',req.principal,bundle.principal))state='DENIED'
 if(!check('principalExecutionBinding',bundle.executionId,bundle.principal.executionId))state='DENIED'
 const registry=load(q.authorityPath)
 principalDecision=evaluate(registry,bundle.principal.principalId,bundle.executionId,bundle.principal.leaseId,'LOCAL_FIXTURE_COMMIT')
 const p=registry.principals.find(x=>x.principalId===bundle.principal.principalId),l=registry.leases.find(x=>x.leaseId===bundle.principal.leaseId)
 if(principalDecision!=='ALLOW_MOCK_AUTHORITY_ONLY'||!check('principalLineage',bundle.principal.parentPrincipalId,p?.parentPrincipalId)||!check('credentialReference',bundle.principal.credentialRef,l?.credentialRef)||!check('authClass',bundle.principal.identityIsolation,p?.identityIsolation))state='DENIED'
 if(!check('budgetBinding',bundle.budget,obs.budget)||!check('requiredBudget',req.budget,bundle.budget)||!q.authoritativeBudget||bundle.budget.ledgerRef!==q.authoritativeBudget.ledgerRef)state='BUDGET_BLOCKED'
 if(bundle.pending.length) {
  for(const pending of bundle.pending)check('opaquePending:'+pending.kind,pending.sha256,sha(readFileSync(join(q.sourceCwd,pending.locator))))
  state='UNSUPPORTED_PENDING_CONTROL'
 }
 if(bundle.checkpoint.kind==='NATIVE_HOST_BOUND') {
  // Actual native state copied by the research instrument, not a decorative tag.
  const { RunStateSchema }=await import(new URL('file://'+join(source,'dist/backends/types.js')))
  const nativeState=RunStateSchema.parse(json(q.checkpointPath))
  if(!check('nativeRecordedCwdBinding',bundle.checkpoint.cwdBinding,nativeState.cwd))state='ENVIRONMENT_MISMATCH'
  const manifest=json(q.nativeCopyManifestPath)
  if(!check('nativeCopyManifestDigest',bundle.checkpoint.copyManifest.sha256,sha(readFileSync(q.nativeCopyManifestPath))))state='ENVIRONMENT_MISMATCH'
  for(const file of manifest.files) {
   if(!check('nativeSourceCopy:'+file.locator,file.sha256,sha(readFileSync(join(manifest.sourceRunDir,file.locator)))))state='DIVERGED'
   if(!check('nativeTargetReadback:'+file.locator,file.sha256,sha(readFileSync(join(manifest.targetRunDir,file.locator)))))state='DIVERGED'
  }
  check('nativeTargetCwd',q.cwd,nativeState.cwd)
  // The wrapper refuses relocation. Native resume itself has no remap/check.
  if(nativeState.cwd!==q.cwd)state='HOST_BOUND_CHECKPOINT'
 }
 const { globalCostReport }=await import(new URL('file://'+join(source,'dist/globalcost.js')))
 const { TeamState }=await import(new URL('file://'+join(source,'dist/engines/team-state.js')))
 let team,claim
 if(q.authoritativeBudget) {
  budgetReport=globalCostReport(q.authoritativeBudget.config,new Date().toISOString(),[],bundle.budget.policyHash)
  if(!budgetReport.complete)state='BUDGET_BLOCKED'
  team=new TeamState(q.authoritativeBudget.project)
  const identityMatches=sha(team.path)===bundle.budget.ledgerIdentityDigest
  budgetReport={...budgetReport,authoritativeLedgerPath:team.path,identityMatches,snapshot:team.snapshot()}
  if(!identityMatches)state='BUDGET_BLOCKED'
  if(state==='RESUMED_VERIFIED') {
   claim=team.claim({executionId:q.attemptId,task:{id:q.attemptId,text:'research owned fixture',line:0,status:'open',ownership:{write:[q.attemptId+'.txt'],resources:[]}},workerId:'offline-research',reservedCostUsd:bundle.budget.reservationUsd,spentUsd:budgetReport.bookedUsd,dailyHardUsd:bundle.budget.hardUsd,leaseMs:60000})
   budgetReport={...budgetReport,admission:claim.ok?'ADMITTED':claim.reason,authoritativeLedgerPath:team.path,snapshot:team.snapshot()}
   if(!claim.ok)state='BUDGET_BLOCKED'
  }
 }
 // Policy is evaluated independently; DENY means no external effect on either side.
 if(state==='RESUMED_VERIFIED') {
  fixtureCommand=[process.execPath,'fixture-cli.mjs','--resume']
  const r=spawnSync(fixtureCommand[0],fixtureCommand.slice(1),{cwd:q.cwd,env:safeEnv({}),encoding:'utf8',timeout:10000})
  const verify=r.status===0?spawnSync(process.execPath,['--test','check.cjs'],{cwd:q.cwd,env:safeEnv({}),encoding:'utf8',timeout:10000}):null
  fixtureExit=verify?verify.status:r.status
  writeFileSync(q.commandLog,r.stdout+r.stderr+(verify?verify.stdout+verify.stderr:''))
  if(fixtureExit!==0)state='ENVIRONMENT_MISMATCH'
 }
 if(team){if(claim?.ok)team.release(q.attemptId,claim.token);team.close()}
 const partial={schemaVersion:VERSION,bundleId:bundle.bundleId,bundleDigest:digest(bundle),targetObservationDigest:digest(obs),requirementDigest:digest(req),state,checks,declaredEffectDecision,effectDecision:'DENY',effectScope:'SYNTHETIC_FAIL_CLOSED_GATE_ONLY',principalDecision,budgetReport,fixtureCommand,fixtureExit,nativeMigration:'UNKNOWN',reviewGate:'NOT_RUN',providerCalls:0,networkAttempts:0}
 return Receipt.parse({...partial,receiptDigest:digest(partial)})
}
