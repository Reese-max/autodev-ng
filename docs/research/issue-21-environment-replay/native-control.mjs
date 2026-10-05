// Actual published backend; trusted local executor only, no default engine/provider.
import { mkdirSync,readFileSync,writeFileSync,existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
const [source,dataDir,cwd,mode,output]=process.argv.slice(2)
const { LongHorizonBackend,readRunState,readAttempts,readCheckpoints,runDir }=await import(pathToFileURL(join(source,'dist/backends/long-horizon.js')))
const { takeInterrupt }=await import(pathToFileURL(join(source,'dist/backends/store.js')))
const { InterruptSchema }=await import(pathToFileURL(join(source,'dist/backends/types.js')))
mkdirSync(dataDir,{recursive:true})
const runId='research-native-handoff'
let backend
const calls=[]
const executor=async req=>{
 calls.push({round:req.round,cwd:req.cwd,runId:req.runId})
 if(mode==='pause') {
  await backend.interrupt(runId,{kind:'pause',by:'offline-research-fixture',note:'pause at ordinary round boundary'})
  writeFileSync(join(dataDir,'trusted-executor-progress.txt'),'first round parked\n')
  return {ok:false,output:'intentional bounded first-round rejection; pause is pending',costUsd:0,failureReason:'goal not yet achieved'}
 }
 writeFileSync(join(req.cwd,'native-done.txt'),'verified after fresh process resume\n')
 execFileSync('git',['add','native-done.txt'],{cwd:req.cwd})
 execFileSync('git',['commit','-m','synthetic fresh-process backend progress'],{cwd:req.cwd,stdio:'pipe'})
 return {ok:true,output:'owned fixture file committed',costUsd:0,commitHash:execFileSync('git',['rev-parse','HEAD'],{cwd:req.cwd,encoding:'utf8'}).trim()}
}
backend=new LongHorizonBackend({dataDir,executor,maxRounds:4})
// SDK arrays are lists of complete command strings, not argv. PATH pins our Node.
const h=mode==='pause'?await backend.start({objective:'create the bounded fixture output',verifyCommand:'node --test native-check.cjs'},{cwd,runId}):await backend.resume(runId)
const done=await h.done,state=readRunState(dataDir,runId),dir=runDir(dataDir,runId)
const sentinelExists=existsSync(join(dir,'interrupt.json'))
const secondConsume=takeInterrupt(dir)
const rejectSteer=!InterruptSchema.safeParse({kind:'STEER',executionId:runId,text:'opaque original control'}).success
const rejectQueue=!InterruptSchema.safeParse({kind:'QUEUE',executionId:runId,text:'opaque original control'}).success
writeFileSync(output,JSON.stringify({mode,node:process.version,source,done,state,calls,sentinelExists,secondConsume:secondConsume??null,rejectSteer,rejectQueue,attempts:readAttempts(dir),checkpoints:readCheckpoints(dir),limit:'ordinary same-path pause consumption; no removal-failure/crash-safe exactly-once/STEER delivery guarantee'},null,2)+'\n')
if(sentinelExists||secondConsume!==undefined||!rejectSteer||!rejectQueue)throw Error('NATIVE_CONTROL_ASSERTION_FAILED')
if(mode==='pause'&&(state.phase!=='interrupted'||state.metrics.interventions!==1||calls.length!==1))throw Error('PAUSE_ASSERTION_FAILED')
if(mode==='resume'&&(state.phase!=='complete'||state.metrics.resumes!==1||state.metrics.interventions!==1||state.metrics.recoverySuccesses!==1||calls.length!==1))throw Error('RESUME_ASSERTION_FAILED')
process.stdout.write(JSON.stringify({mode,phase:state.phase,rounds:state.rounds,interventions:state.metrics.interventions,resumes:state.metrics.resumes})+'\n')
