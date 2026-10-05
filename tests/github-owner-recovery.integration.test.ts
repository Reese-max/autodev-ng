/* Peer-found safety regressions: local execution/SQLite/state failures only; no provider egress. */
import { afterEach, expect, test, vi } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OwnerConfigSchema, ownedRepos, repoConfig, runOwner } from '../src/github/owner.js';
import { runGithub, runGithubOutcome } from '../src/github/runner.js';
import { GithubConfigSchema } from '../src/github/config.js';
import { branchFor, fingerprint, saveState } from '../src/github/state.js';
import { TeamState } from '../src/engines/team-state.js';
import { recoverRetainedLock, releaseDeadLock } from '../src/lock.js';
import { assembleConfig } from '../src/cli/assemble.js';
import { executeIssue, git } from '../src/github/job.js';

const roots:string[]=[];
afterEach(()=>{vi.restoreAllMocks();for(const p of roots.splice(0))rmSync(p,{recursive:true,force:true});});
function root(){const p=mkdtempSync(join(tmpdir(),'adng36-peer-'));roots.push(p);return p;}

test('an uncertain thrown child outcome cannot authorize a second owner execution',async()=>{
 const dataDir=root();
 const cfg=OwnerConfigSchema.parse({owner:'owner',authors:['owner'],sourceConfig:'synthetic.json',dataDir,engine:'writer',enabled:true,publish:true,retryMs:60000});
 const repos=ownedRepos('owner',[[...['aaa','bbb','ccc'].map(name=>({full_name:`owner/${name}`,owner:{login:'owner'},default_branch:'main',archived:false,disabled:false,has_issues:true,permissions:{push:true}}))]]);
 const dispatched:string[]=[];
 await runOwner(cfg,false,()=>repos,async(child,options)=>{
  if(options.syncOnly)return{disposition:'synced',attempted:false};
  dispatched.push(child.repo);
  if(child.repo==='owner/aaa')throw new Error('synthetic post-dispatch state-save failure');
  return{disposition:'1: queued',attempted:true};
 });
 expect(dispatched).toEqual(['owner/aaa']);
});

function publishedFixture(){
 const dataDir=root();const sourceConfig=join(dataDir,'source.json');writeFileSync(sourceConfig,'{}');
 const cfg=GithubConfigSchema.parse({repo:'owner/project',authors:['owner'],sourceConfig,dataDir,engine:'writer',enabled:true,retryMs:60000});
 const issue=(n:number)=>({number:n,title:'Synthetic local fixture',body:'No provider request',state:'open' as const,user:{login:'owner'},labels:[{name:'autodev'}]});
 const commit=(n:number)=>n===7?'a'.repeat(40):'b'.repeat(40);
 for(const n of [7,8])saveState(cfg,{repo:cfg.repo,base:cfg.base,issue:issue(n),fingerprint:fingerprint(issue(n)),status:'published',runs:1,nextRunAt:0,commit:commit(n),pr:`https://github.com/owner/project/pull/${n}`,lastObservedAt:n===7?5000:6000});
 const observed:string[]=[];
 const client={list:async()=>[],issue:async(n:number)=>issue(n),findPr:async()=>undefined,findLinkedPr:async()=>undefined,createPr:vi.fn(),feedback:async(branch:string)=>{
  observed.push(branch);const n=branch===branchFor(7)?7:8;
  return{number:n,url:`https://github.com/owner/project/pull/${n}`,head:commit(n),base:'main',state:'open' as const,checks:'pass' as const,feedback:''};
 }};
 return{cfg,client,observed};
}

test('a rolled-back observation clock cannot starve the tail under budget one',async()=>{
 const{cfg,client,observed}=publishedFixture();vi.spyOn(Date,'now').mockReturnValue(1000);
 await runGithubOutcome(cfg,{client,syncOnly:true,observeBudget:1});
 await runGithubOutcome(cfg,{client,syncOnly:true,observeBudget:1});
 expect(observed).toEqual([branchFor(7),branchFor(8)]);
});

test('bounded observation reports incomplete PR coverage separately from intake sync',async()=>{
 const{cfg,client}=publishedFixture();
 const outcome=await runGithubOutcome(cfg,{client,syncOnly:true,observeBudget:1});
 expect(JSON.stringify(outcome)).toMatch(/partial|remaining|unobserved/i);
});

test('an actual quarantined claim plus post-dispatch state and owner receipt failures retain the next owner entry',async()=>{
 const dataDir=root(),projectPath=join(dataDir,'project'),sourceConfig=join(dataDir,'source.json');
 execFileSync('git',['init','-b','main',projectPath],{stdio:'ignore'});writeFileSync(sourceConfig,'{}');
 const cfg=OwnerConfigSchema.parse({owner:'owner',authors:['owner'],sourceConfig,dataDir,engine:'writer',enabled:true,publish:false,retryMs:60000});
 const repos=ownedRepos('owner',[[...['aaa','bbb'].map(name=>({full_name:`owner/${name}`,owner:{login:'owner'},default_branch:'main',archived:false,disabled:false,has_issues:true,permissions:{push:true}}))]]);
 const issue={number:7,title:'Synthetic claim fixture',body:'No provider request',state:'open' as const,user:{login:'owner'},labels:[{name:'autodev'}]};
 const client={list:async()=>[issue],issue:async()=>issue,findPr:async()=>undefined,findLinkedPr:async()=>undefined,createPr:vi.fn()};
 const dispatched:string[]=[];const team=new TeamState(projectPath);
 try{
  const run=async(child:any,options:any)=>runGithubOutcome(child,{...options,client,execute:async()=>{
   dispatched.push(child.repo);
   const claim=team.claim({executionId:'peer-held-claim',task:{id:'peer-task',text:'local claim',line:1,status:'open',ownership:{write:['src/owned.ts'],resources:[]}},workerId:'peer-worker',reservedCostUsd:1,spentUsd:0,dailyHardUsd:10,leaseMs:60000});
   expect(claim.ok).toBe(true);if(!claim.ok)throw new Error('claim rejected');
   team.quarantine('peer-held-claim',claim.token);
   const stateFile=join(child.dataDir,'issue-7','state.json');rmSync(stateFile);mkdirSync(stateFile);
   mkdirSync(join(dataDir,'status.json'));
   return{done:false,attempted:true,recoveryRequired:true,detail:'synthetic unknown worker outcome'};
  }});
  await expect(runOwner(cfg,false,()=>repos,run)).rejects.toThrow();
  expect(dispatched).toEqual(['owner/aaa']);
  expect(team.snapshot().claims).toMatchObject([{execution_id:'peer-held-claim',active:1,state:'QUARANTINED'}]);
  const lock=join(dataDir,'owner.lock'),marker=join(lock,'recovery-required.json');
  expect(existsSync(marker)).toBe(true);
  const receipt=JSON.parse(readFileSync(marker,'utf8'));
  expect(receipt.repo).toBe('owner/aaa');
  expect(releaseDeadLock(lock,0)).toBe(false);
  expect(recoverRetainedLock(lock,'wrong-generation',{backendSafeConfirmed:true})).toBe(false);
  expect(await runOwner(cfg,false,()=>repos,run)).toEqual({status:'locked'});
  expect(dispatched).toEqual(['owner/aaa']);
  expect(team.snapshot().claims).toHaveLength(1);
 }finally{team.close();}
});

test('an existing malformed fair cursor fails closed with a reason instead of resetting progress',async()=>{
 const dataDir=root();
 const cfg=OwnerConfigSchema.parse({owner:'owner',authors:['owner'],sourceConfig:'synthetic.json',dataDir,engine:'writer',enabled:true,publish:true});
 const repos=ownedRepos('owner',[[...['aaa','bbb'].map(name=>({full_name:`owner/${name}`,owner:{login:'owner'},default_branch:'main',archived:false,disabled:false,has_issues:true,permissions:{push:true}}))]]);
 const dispatched:string[]=[];
 const run=async(child:any,options:any)=>{if(options.syncOnly)return{disposition:'synced',attempted:false};dispatched.push(child.repo);return{disposition:'1: queued',attempted:true};};
 await runOwner(cfg,false,()=>repos,run);expect(dispatched).toEqual(['owner/aaa']);
 writeFileSync(join(dataDir,'dispatch-cursor.json'),'{"version":1,"seq":"malformed","repos":{}}');
 let result:any;try{result=await runOwner(cfg,false,()=>repos,run);}catch(error){result=String(error);}
 expect(dispatched).toEqual(['owner/aaa']);
 expect(JSON.stringify(result)).toMatch(/cursor|state/i);
 expect(JSON.stringify(result)).toMatch(/invalid|corrupt|malformed|unreadable|blocked|error/i);
});

test('actual dispatch survives aligned three-retry ticks, clock jumps, and discovery churn',async()=>{
 const dataDir=root();
 const cfg=OwnerConfigSchema.parse({owner:'owner',authors:['owner'],sourceConfig:'synthetic.json',dataDir,engine:'writer',enabled:true,publish:true,retryMs:60000});
 const make=(names:string[])=>ownedRepos('owner',[names.map(name=>({full_name:`owner/${name}`,owner:{login:'owner'},default_branch:'main',archived:false,disabled:false,has_issues:true,permissions:{push:true}}))]);
 let discovered=make(['aaa','bbb','ccc']);const dispatched:string[]=[];
 const run=async(child:any,options:any)=>{if(options.syncOnly)return{disposition:'synced',attempted:false};dispatched.push(child.repo);return{disposition:'1: queued',attempted:true};};
 let now=5000;vi.spyOn(Date,'now').mockImplementation(()=>now);
 for(let tick=0;tick<3;tick++){now=5000+tick*3*cfg.retryMs;await runOwner(cfg,false,()=>[...discovered].reverse(),run);}
 expect(dispatched).toEqual(['owner/aaa','owner/bbb','owner/ccc']);
 now=-5000;await runOwner(cfg,false,()=>discovered,run);expect(dispatched.at(-1)).toBe('owner/aaa');
 discovered=make(['ccc','ddd','aaa','bbb']);
 for(let tick=0;tick<4;tick++)await runOwner(cfg,false,()=>discovered,run);
 expect(dispatched.slice(-4)).toEqual(['owner/ddd','owner/bbb','owner/ccc','owner/aaa']);
 discovered=make(['aaa','ddd','eee']);await runOwner(cfg,false,()=>discovered,run);
 expect(dispatched.at(-1)).toBe('owner/eee');
 const cursor=JSON.parse(readFileSync(join(dataDir,'dispatch-cursor.json'),'utf8'));
 expect(Object.keys(cursor.repos).sort()).toEqual(['owner/aaa','owner/ddd','owner/eee']);
});

test('a real runner dispatch in the first repo still observes both later sync-only repos',async()=>{
 const dataDir=root(),sourceConfig=join(dataDir,'source.json');writeFileSync(sourceConfig,'{}');
 const cfg=OwnerConfigSchema.parse({owner:'owner',authors:['owner'],sourceConfig,dataDir,engine:'writer',enabled:true,publish:false,retryMs:60000});
 const repos=ownedRepos('owner',[[...['aaa','bbb','ccc'].map(name=>({full_name:`owner/${name}`,owner:{login:'owner'},default_branch:'main',archived:false,disabled:false,has_issues:true,permissions:{push:true}}))]]);
 const issue={number:7,title:'Synthetic owner wiring',body:'No provider request',state:'open' as const,user:{login:'owner'},labels:[{name:'autodev'}]};
 const commit='a'.repeat(40),writers:string[]=[],observations:string[]=[];
 for(const repo of repos.slice(1)){const child=repoConfig(cfg,repo);saveState(child,{repo:child.repo,base:child.base,issue,fingerprint:fingerprint(issue),status:'published',runs:1,nextRunAt:0,commit,pr:`https://github.com/${child.repo}/pull/7`});}
 const run=async(child:any,options:any)=>runGithubOutcome(child,{...options,client:{list:async()=>child.repo==='owner/aaa'?[issue]:[],issue:async()=>issue,findPr:async()=>undefined,findLinkedPr:async()=>undefined,createPr:vi.fn(),feedback:async()=>{observations.push(child.repo);return{number:7,url:`https://github.com/${child.repo}/pull/7`,head:commit,base:'main',state:'open' as const,checks:'pass' as const,feedback:''};}},execute:async()=>{writers.push(child.repo);return{done:false,attempted:true,detail:'local completed attempt'};}});
 const result=await runOwner(cfg,false,()=>repos,run);
 expect(writers).toEqual(['owner/aaa']);expect(observations).toEqual(['owner/bbb','owner/ccc']);
 if(!('repositories'in result))throw new Error('owner unexpectedly locked');
 expect(result.repositories.slice(1).map(r=>r.syncOnly)).toEqual([true,true]);
 expect(result.repositories.slice(1).map(r=>r.prObservationCoverage)).toEqual([{eligible:1,attempted:1,remaining:0},{eligible:1,attempted:1,remaining:0}]);
});

test('a legacy string adapter cannot erase a real runner recovery-required outcome',async()=>{
 const dataDir=root(),projectPath=join(dataDir,'project'),sourceConfig=join(dataDir,'source.json');
 execFileSync('git',['init','-b','main',projectPath],{stdio:'ignore'});writeFileSync(sourceConfig,'{}');
 const cfg=OwnerConfigSchema.parse({owner:'owner',authors:['owner'],sourceConfig,dataDir,engine:'writer',enabled:true,publish:false,retryMs:60000});
 const repos=ownedRepos('owner',[[...['aaa','bbb'].map(name=>({full_name:`owner/${name}`,owner:{login:'owner'},default_branch:'main',archived:false,disabled:false,has_issues:true,permissions:{push:true}}))]]);
 const issue={number:7,title:'Synthetic legacy recovery',body:'No provider request',state:'open' as const,user:{login:'owner'},labels:[{name:'autodev'}]};
 const client={list:async()=>[issue],issue:async()=>issue,findPr:async()=>undefined,findLinkedPr:async()=>undefined,createPr:vi.fn()};
 const team=new TeamState(projectPath),dispatched:string[]=[];
 try{
  const run=async(child:any,options:any)=>runGithub(child,{...options,client,execute:async()=>{
   dispatched.push(child.repo);
   const claim=team.claim({executionId:child.repo,task:{id:child.repo,text:'local claim',line:1,status:'open',ownership:{write:[`src/${child.repo.split('/')[1]}.ts`],resources:[]}},workerId:'peer-worker',reservedCostUsd:0,spentUsd:0,dailyHardUsd:0,leaseMs:60000});
   expect(claim.ok).toBe(true);if(!claim.ok)throw new Error('claim rejected');team.quarantine(child.repo,claim.token);
   return{done:false,attempted:true,recoveryRequired:true,detail:'synthetic unknown worker outcome'};
  }});
  await runOwner(cfg,false,()=>repos,run);
  expect(await runOwner(cfg,false,()=>repos,run)).toEqual({status:'locked'});
  expect(dispatched).toEqual(['owner/aaa']);
  expect(team.snapshot().claims).toHaveLength(1);
 }finally{team.close();}
});

test('actual scheduler preflight rejection reports no writer attempt',async()=>{
 const dataDir=root(),sourceConfig=join(dataDir,'source.json');
 const cfg=GithubConfigSchema.parse({repo:'owner/project',authors:['owner'],sourceConfig,dataDir,engine:'writer',enabled:true,publish:false,label:null,verifyCommand:`"${process.execPath}" check.cjs`});
 const issue={number:7,title:'Synthetic preflight fixture',body:'No provider request',state:'open' as const,user:{login:'owner'},labels:[]};
 const cwd=join(dataDir,'issue-7','repo');mkdirSync(cwd,{recursive:true});
 git(cwd,['init','-b',branchFor(7)]);git(cwd,['config','user.name','Peer']);git(cwd,['config','user.email','peer@example.invalid']);
 git(cwd,['remote','add','origin','https://github.com/owner/project.git']);writeFileSync(join(cwd,'check.cjs'),'process.exit(0)\n');
 git(cwd,['add','.']);git(cwd,['commit','-m','synthetic local base']);
 const state={repo:cfg.repo,base:cfg.base,issue,fingerprint:fingerprint(issue),status:'queued' as const,runs:0,nextRunAt:0,baseSha:git(cwd,['rev-parse','HEAD'])};saveState(cfg,state);
 writeFileSync(sourceConfig,JSON.stringify({projectPath:cwd,backlogFile:'unused',dataDir:'unused',engines:{writer:{adapter:'opencode',model:'fixture'}},defaultEngine:'writer',reviewEngine:'fixture-reviewer'}));
 const worker=vi.fn();
 const result=await executeIssue(cfg,state,(runtime,cfgPath)=>{const app=assembleConfig(runtime,cfgPath);app.deps.engines={resolve:()=>({id:'local-fixture',preflight:async()=>({ok:false,detail:'synthetic pre-dispatch unavailable'}),run:worker})};return app;});
 expect(worker).not.toHaveBeenCalled();expect(result.attempted).toBe(false);expect(result.verificationAttempted).toBe(false);
});


test.each([
 {seq:0,repos:{'owner/aaa':{attemptSeq:99999,lastAttemptedAt:0,lastScannedAt:0}}},
 {seq:Number.MAX_SAFE_INTEGER+1,repos:{}},
])('existing semantically inconsistent cursor blocks all dispatch %#',async cursor=>{
 const dataDir=root();
 const cfg=OwnerConfigSchema.parse({owner:'owner',authors:['owner'],sourceConfig:'synthetic.json',dataDir,engine:'writer',enabled:true,publish:true});
 const repos=ownedRepos('owner',[[{full_name:'owner/aaa',owner:{login:'owner'},default_branch:'main',archived:false,disabled:false,has_issues:true,permissions:{push:true}}]]);
 writeFileSync(join(dataDir,'dispatch-cursor.json'),JSON.stringify({version:1,...cursor}));
 const run=vi.fn();const result=await runOwner(cfg,false,()=>repos,run);
 expect(run).not.toHaveBeenCalled();expect(result).toMatchObject({status:'blocked',detail:expect.stringMatching(/cursor invalid/)});
});
