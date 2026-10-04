const {AutonomousMissionEngine:E}=require('./out/tools/autonomousMissionEngine.js');
const project={projectName:'s',framework:'react',files:Array.from({length:300},(_,i)=>({name:`src/f${i}.ts`,content:'export const x'+i+'='+i+';\n'.repeat(50),language:'typescript'})),rules:[],knownIssues:[]};
let fail=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++;};
const rnd=(n)=>Math.floor(Math.random()*n);
(async()=>{
 // 1 fuzz planner with garbage — must never throw, never leave state broken, always READY
 const junk=[null,undefined,42,'x',{},[],[null],[{}],[{title:'a',type:'READ',dependsOn:'x'}],[{title:'a',type:'READ',dependsOn:[0]},{title:'v',type:'VALIDATE'}],[{title:'a',type:'READ',dependsOn:[-1]},{title:'v',type:'VALIDATE'}],[{title:'a',type:'READ',dependsOn:[0.5]},{title:'v',type:'VALIDATE'}],[{title:'x'.repeat(500),type:'READ'},{title:'v',type:'VALIDATE'}],[{title:'a',type:'__proto__'},{title:'v',type:'VALIDATE'}],[{title:'a',type:'validate'},{title:'v',type:'READ'}],Array(1000).fill({title:'a',type:'READ'})];
 let allOk=true; for(const j of junk){ const e=new E(project); let m=e.analyzeMission(e.createMission('Build x')); try{ m=await e.planMissionAsync(m,async()=>j); if(m.state!=='READY'||!m.tasks.length||m.tasks.at(-1).type!=='VALIDATE') allOk=false; }catch(x){allOk=false;console.log('threw',x.message)} }
 ok(allOk,`${junk.length} malformed model plans all rejected/fell back safely`);
 // 2 random valid DAGs: always complete (read-only) with deps respected
 let dagOk=true; for(let r=0;r<200;r++){ const n=3+rnd(8); const plan=Array.from({length:n},(_,i)=>({title:'t'+i,type:i===n-1?'VALIDATE':['READ','ANALYZE','SEARCH','REVIEW','SUMMARIZE','PLAN'][rnd(6)],dependsOn:Array.from({length:rnd(Math.min(i,3)+1)},()=>rnd(i||1)).filter(d=>d<i)}));
   const e=new E(project); let m=e.analyzeMission(e.createMission('inspect')); m=await e.planMissionAsync(m,async()=>plan); m=await e.executeMissionAsync(m);
   const done=new Map(); m.events.filter(x=>x.type==='TASK_COMPLETED').forEach((x,i)=>done.set(x.taskId,i));
   const order=m.tasks.every(t=>t.dependencies.every(d=>done.get(d)<done.get(t.taskId)));
   if(m.state!=='COMPLETED'||!order){dagOk=false;console.log('bad dag',m.state,order,JSON.stringify(plan));break;} }
 ok(dagOk,'200 random valid DAGs: all COMPLETED, every task ran after its dependencies');
 // 3 soak: 300 sequential missions on 300-file project
 const t0=Date.now(); const e=new E(project); let soak=true; for(let i=0;i<300;i++){ let m=e.planMission(e.analyzeMission(e.createMission('Inspect project '+i))); m=await e.executeMissionAsync(m); if(m.state!=='COMPLETED'){soak=false;break;} }
 ok(soak,`300 missions on 300 files completed in ${Date.now()-t0}ms, heap ${(process.memoryUsage().heapUsed/1e6).toFixed(0)}MB`);
 // 4 pause/cancel races: random request timing, must always end in a legal state, never throw
 let race=true; const legal=new Set(['COMPLETED','PAUSED','CANCELLED','FAILED']); const stats={};
 for(let i=0;i<200;i++){ const e=new E(project); let m=e.planMission(e.analyzeMission(e.createMission('Inspect and validate'))); const kind=['PAUSE','CANCEL','BOTH','NONE'][rnd(4)]; 
   const p=e.executeMissionAsync(m,{yieldMs:rnd(3)}); setTimeout(()=>{ try{ if(kind==='PAUSE'||kind==='BOTH')e.requestPause(m); if(kind==='CANCEL'||kind==='BOTH')e.requestCancel(m);}catch(x){race=false;console.log('req threw',x.message)} },rnd(6));
   try{ m=await p; if(m.state==='PAUSED'){ m=await e.resumeMissionAsync(m); } }catch(x){race=false;console.log('threw',x.message)}
   stats[m.state]=(stats[m.state]||0)+1; if(!legal.has(m.state)) race=false;
   if(m.state==='CANCELLED'&&m.tasks.some(t=>t.status==='RUNNING'))race=false; }
 ok(race,'200 randomized pause/cancel races -> legal end states '+JSON.stringify(stats));
 // 5 double-run / illegal calls
 { const e=new E(project); let m=e.planMission(e.analyzeMission(e.createMission('Inspect'))); m=await e.executeMissionAsync(m); let threw=false; try{await e.executeMissionAsync(m)}catch{threw=true} ok(threw,'re-executing a COMPLETED mission is refused'); try{e.requestPause(m)}catch{threw=false} ok(m.state==='COMPLETED','requestPause on finished mission is a no-op'); }
 // 6 checkpoint tampering
 { const e=new E(project); let m=e.planMission(e.analyzeMission(e.createMission('Inspect and validate'))); const p=e.executeMissionAsync(m,{yieldMs:20}); setTimeout(()=>e.requestPause(m),30); m=await p; if(m.state==='PAUSED'){ m.checkpoint={...m.checkpoint,state:'HACKED'}; m=await e.resumeMissionAsync(m); ok(m.state==='FAILED'&&m.error==='CHECKPOINT_INTEGRITY_FAILED','tampered checkpoint refused on resume'); } else ok(false,'pause did not land: '+m.state); }
 // 7 mutation safety: model plan with DELETE never mutates without approval
 { const e=new E(project); let m=e.analyzeMission(e.createMission('cleanup')); m=await e.planMissionAsync(m,async()=>[{title:'read',type:'READ'},{title:'rm',type:'DELETE'},{title:'v',type:'VALIDATE'}]); m=await e.executeMissionAsync(m); ok(m.state==='WAITING_APPROVAL'&&m.events.every(x=>x.type!=='SNAPSHOT_CREATED'),'model-planned DELETE stops at approval, no mutation'); m=e.approve(m,m.tasks[1].taskId,true); ok(m.state==='WAITING_USER','approved DELETE without file name -> WAITING_USER, nothing fabricated'); }
 console.log(fail?fail+' FAILED':'ALL PASSED'); process.exit(fail?1:0);
})();
