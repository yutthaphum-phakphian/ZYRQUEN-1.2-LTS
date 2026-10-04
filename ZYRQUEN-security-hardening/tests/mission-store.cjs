const fs=require('fs'),os=require('os'),path=require('path');
const st=require('./out/server/missionStore.js'); const {AutonomousMissionEngine:E}=require('./out/tools/autonomousMissionEngine.js');
let fail=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++;};
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ms-')); const code=f=>{try{f();return 'none'}catch(e){return e.code||e.message}};
const mission=(id,extra={})=>JSON.stringify({missionId:id,state:'READY',objective:'o',tasks:[],events:[],updatedAt:new Date().toISOString(),...extra});
(async()=>{
 // store validation
 for(const bad of ['../x','a/b','','a.b','x'.repeat(101),'..','a\0b']) if(code(()=>st.saveMission(bad,mission('x'),dir))!=='BAD_ID') ok(false,'bad id accepted: '+JSON.stringify(bad));
 ok(code(()=>st.saveMission('../etc/passwd',mission('x'),dir))==='BAD_ID' && !fs.existsSync(path.join(dir,'..','etc')),'path traversal ids rejected');
 ok(code(()=>st.saveMission('a','{bad',dir))==='INVALID_MISSION','non-JSON rejected');
 ok(code(()=>st.saveMission('a',mission('b'),dir))==='INVALID_MISSION','id mismatch rejected');
 ok(code(()=>st.saveMission('a',JSON.stringify({missionId:'a'}),dir))==='INVALID_MISSION','missing fields rejected');
 ok(code(()=>st.saveMission('a',mission('a',{pad:'x'.repeat(2.1*1024*1024)}),dir))==='TOO_LARGE','>2MB rejected');
 ok(fs.readdirSync(dir).length===0,'rejected writes leave nothing on disk');
 st.saveMission('m1',mission('m1',{updatedAt:'2026-01-01'}),dir); st.saveMission('m2',mission('m2',{updatedAt:'2026-02-01'}),dir);
 ok(JSON.parse(st.loadMission('m1',dir)).missionId==='m1','save/load roundtrip'); ok(code(()=>st.loadMission('nope',dir))==='NOT_FOUND','missing -> NOT_FOUND');
 ok(st.listMissions(dir).map(x=>x.missionId).join()==='m2,m1','list newest first');
 for(let i=0;i<200;i++) st.saveMission('m3',mission('m3',{i}),dir); ok(fs.readdirSync(dir).every(f=>!f.endsWith('.tmp')),'no tmp files left after 200 overwrites');
 fs.writeFileSync(path.join(dir,'corrupt.json'),'{{{'); ok(st.listMissions(dir).length===3,'corrupt file skipped in list');
 // engine <-> store (fake HTTP layer = store, with latency and failures)
 const project={projectName:'p',framework:'r',files:[],rules:[],knownIssues:[]};
 const mkRemote=(fn)=>({save:async(id,j)=>{await new Promise(r=>setTimeout(r,2));fn&&fn();st.saveMission(id,j,dir);},load:async id=>{try{return st.loadMission(id,dir)}catch(e){if(e.code==='NOT_FOUND')return null;throw e}}});
 let e=new E(project); e.setRemoteStore(mkRemote()); let m=e.planMission(e.analyzeMission(e.createMission('Inspect and validate'))); m=await e.executeMissionAsync(m,{yieldMs:1}); await new Promise(r=>setTimeout(r,50));
 ok(e.remoteStatus==='SYNCED'&&JSON.parse(st.loadMission(m.missionId,dir)).state==='COMPLETED','completed mission persisted on server, status SYNCED');
 // "server restart": brand-new engine, mid-run snapshot persisted as RUNNING
 e=new E(project); e.setRemoteStore(mkRemote()); m=e.planMission(e.analyzeMission(e.createMission('Inspect and validate')));
 const p=e.executeMissionAsync(m,{yieldMs:30}); await new Promise(r=>setTimeout(r,45)); await new Promise(r=>setTimeout(r,10));
 const persisted=JSON.parse(st.loadMission(m.missionId,dir)); ok(persisted.state==='RUNNING','mid-run state is on disk while running');
 const e2=new E(project); e2.setRemoteStore(mkRemote()); const r=await e2.restoreMissionRemote(m.missionId);
 ok(r&&r.state==='PAUSED'&&r.events.some(x=>x.type==='RESTORED_AFTER_RESTART')&&r.tasks.every(t=>t.status!=='RUNNING'),'RUNNING mission restored as PAUSED with honest event');
 const doneBefore=r.tasks.filter(t=>t.status==='COMPLETED').length; const fin=await e2.resumeMissionAsync(r,{yieldMs:1});
 ok(fin.state==='COMPLETED'&&doneBefore>=1,`resumed after "restart" and finished (${doneBefore} task(s) not re-run)`); await p;
 // failure + coalescing
 let calls=0,down=true; e=new E(project); e.setRemoteStore({save:async()=>{calls++;await new Promise(r=>setTimeout(r,5));if(down)throw new Error('HTTP_503');},load:async()=>null});
 m=e.planMission(e.analyzeMission(e.createMission('Inspect and validate'))); await e.executeMissionAsync(m,{yieldMs:0}); await new Promise(r=>setTimeout(r,60));
 ok(e.remoteStatus==='FAILED:HTTP_503'&&m.state==='COMPLETED','server down: mission still completes locally, status FAILED:HTTP_503 reported');
 ok(calls<=12,`writes coalesced under slow server (${calls} calls for ~${m.events.length} events)`);
 ok(await e.restoreMissionRemote('nonexistent')===undefined,'restore of unknown id -> undefined');
 e=new E(project); ok(e.remoteStatus==='OFF'&&await e.restoreMissionRemote('x')===undefined,'no remote store -> OFF, no crash');
 fs.rmSync(dir,{recursive:true}); console.log(fail?fail+' FAILED':'ALL PASSED'); process.exit(fail?1:0);
})();
