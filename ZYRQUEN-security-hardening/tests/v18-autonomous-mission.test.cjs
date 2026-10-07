const assert = require('node:assert/strict');
const e = require('./out/tools/autonomousMissionEngine.js');
const ctx = { id:'test', projectName:'Test', framework:'html', files:[{name:'index.html',language:'html',content:'<html></html>'}], rules:[], knowledgeBase:[] };

async function testReadOnlyCompletion(){
  const m=e.createAutonomousMission('ตรวจสอบโปรเจกต์นี้',ctx);
  const r=await e.runAutonomousMission(m,{executeTask: async t=>({success:true,evidence:[t.type]})});
  assert.equal(r.status,'COMPLETED'); assert.equal(r.progress,100); assert.ok(r.events.some(x=>x.type==='MISSION_COMPLETED'));
}
async function testApprovalGate(){
  const m=e.createAutonomousMission('สร้าง dashboard ใหม่',ctx);
  const r=await e.runAutonomousMission(m,{executeTask: async t=>t.type==='CODE'?{success:false,requiresApproval:true,evidence:['permission gate']}:{success:true,evidence:[t.type]}});
  assert.equal(r.status,'WAITING_APPROVAL'); assert.ok(r.tasks.some(t=>t.status==='WAITING_APPROVAL'));
}
async function testRecovery(){
  const m=e.createAutonomousMission('ตรวจสอบโปรเจกต์นี้',ctx); let failed=false;
  const r=await e.runAutonomousMission(m,{executeTask: async t=>{ if(t.type==='VALIDATE' && !failed){ failed=true; return {success:false,error:{code:'VALIDATION_FAILED',message:'temporary validation',failureClass:'VALIDATION',recoverable:true}}; } return {success:true,evidence:[t.type]}; }});
  assert.equal(r.status,'COMPLETED'); assert.ok(r.recoveryAttempts>0); assert.ok(r.events.some(x=>x.type==='RECOVERY_STARTED'));
}
async function testPauseResume(){
  const m=e.createAutonomousMission('ตรวจสอบโปรเจกต์นี้',ctx); e.pauseMission(m); assert.equal(m.status,'PAUSED'); e.resumeMission(m); assert.equal(m.status,'RUNNING');
}
async function testDependencyBlock(){
  const m=e.createAutonomousMission('ตรวจสอบโปรเจกต์นี้',ctx); const first=m.tasks[0];
  const r=await e.runAutonomousMission(m,{executeTask: async t=>t.taskId===first.taskId?{success:false,error:{code:'X',message:'fatal',failureClass:'DEPENDENCY',recoverable:false}}:{success:true}});
  assert.equal(r.status,'FAILED'); assert.ok(r.errors.some(x=>x.failureClass==='DEPENDENCY' || x.failureClass==='UNKNOWN'));
}
async function testParallelSafe(){
  const m=e.createAutonomousMission('ตรวจสอบโปรเจกต์นี้',ctx); const a=m.tasks.find(t=>t.type==='READ'); const s=m.tasks.find(t=>t.type==='SEARCH');
  // make two independent safe tasks to exercise scheduler deterministically
  if(a&&s){s.dependencies=[]; s.status='READY'; a.dependencies=[]; a.status='READY';}
  let active=0,max=0; const r=await e.runAutonomousMission(m,{executeTask: async t=>{active++;max=Math.max(max,active);await new Promise(x=>setTimeout(x,5));active--;return {success:true,evidence:[t.type]}}});
  assert.ok(max>=2); assert.ok(['COMPLETED','WAITING_USER'].includes(r.status));
}
(async()=>{for(const f of [testReadOnlyCompletion,testApprovalGate,testRecovery,testPauseResume,testDependencyBlock,testParallelSafe]) await f(); console.log('V18 NODE TESTS: PASS');})();
