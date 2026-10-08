import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(process.cwd(),`.v46-test-${process.pid}-${Date.now()}`); process.env.CODEVOICE_DURABLE_ROOT=root;
const {loadDurableRecord}=await import('../server/durableStore.ts');
const {WorkerTaskConsistencySupervisor}=await import('../server/workerTaskConsistencySupervisor.ts');
await fs.rm(root,{recursive:true,force:true});
const supervisor=new WorkerTaskConsistencySupervisor({intervalMs:1000,staleMs:1000,batchLimit:10,lockTtlMs:3000,heartbeatMs:1000,orphanAfterMs:5000,failureThreshold:2,baseBackoffMs:1000,maxBackoffMs:2000,circuitOpenMs:2000});
// Force durable state machine through the explicit failure recorder without relying on a broken dependency.
await (supervisor as any).recordFailure('simulated-1');
let snap=supervisor.snapshot(); if(snap.state!=='BACKOFF'||snap.consecutiveFailures!==1) throw new Error('first failure did not enter backoff');
await (supervisor as any).recordFailure('simulated-2');
snap=supervisor.snapshot(); if(snap.state!=='CIRCUIT_OPEN'||snap.consecutiveFailures!==2) throw new Error('threshold did not open circuit');
const state=await loadDurableRecord<any>('worker-consistency-supervisor','worker-task-consistency-supervisor-state');
if(state?.payload.state!=='CIRCUIT_OPEN') throw new Error('circuit state was not durable');
const supervisor2=new WorkerTaskConsistencySupervisor({failureThreshold:2,baseBackoffMs:1000,maxBackoffMs:2000,circuitOpenMs:2000});
await (supervisor2 as any).loadPersistedState(); if(supervisor2.snapshot().state!=='CIRCUIT_OPEN') throw new Error('restart did not restore circuit state');
await fs.rm(root,{recursive:true,force:true}); console.log('V46 durable supervisor state/backoff tests: PASS');
