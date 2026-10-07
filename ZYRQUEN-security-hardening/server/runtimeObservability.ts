import crypto from 'node:crypto';
import { listDurableRecordIds, loadDurableRecord } from './durableStore.ts';

export interface RuntimeObservation { observationId:string; category:'supervisor'|'repair'|'recovery'|'coordination'|'simulation'|'agent-run'; subjectId:string; status:string; timestamp:string; metadata:Record<string,unknown>; hash:string; }
export interface RuntimeHealthSnapshot { status:'HEALTHY'|'DEGRADED'|'CORRUPT'; counts:Record<string,number>; latestTimestamp?:string; auditHash:string; }
const hash=(v:unknown)=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');

export async function collectRuntimeObservations(limit=100):Promise<RuntimeObservation[]> {
  const kinds:Array<[RuntimeObservation['category'],any]>=[
    ['supervisor','reliability-supervisor'],['repair','repair-coordinator'],['recovery','recovery-governance'],['coordination','agent-coordination'],['simulation','simulation'],['agent-run','agent-run']
  ];
  const out:RuntimeObservation[]=[];
  for(const [category,kind] of kinds){
    const ids=await listDurableRecordIds(kind,limit);
    for(const id of ids){
      try{
        const r=await loadDurableRecord<any>(kind,id); if(!r) continue;
        const status=String(r.payload?.state||r.payload?.status||r.payload?.outcome||'UNKNOWN');
        const base={observationId:`obs-${category}-${id}-${r.version}`,category,subjectId:id,status,timestamp:r.savedAt,metadata:{version:r.version}};
        out.push({...base,hash:hash(base)});
      }catch{
        const base={observationId:`obs-${category}-${id}-invalid`,category,subjectId:id,status:'CORRUPT',timestamp:new Date().toISOString(),metadata:{reason:'INTEGRITY_FAILURE'}};
        out.push({...base,hash:hash(base)});
      }
    }
  }
  return out.sort((a,b)=>b.timestamp.localeCompare(a.timestamp)).slice(0,Math.min(Math.max(limit,1),500));
}

export function summarizeRuntimeHealth(observations:RuntimeObservation[]):RuntimeHealthSnapshot {
  const counts:Record<string,number>={};
  for(const o of observations) counts[o.status]=(counts[o.status]||0)+1;
  const corrupt=(counts.CORRUPT||0)>0;
  const degraded=corrupt || Object.keys(counts).some(k=>['FAILED','BLOCKED','QUARANTINED','DEGRADED'].includes(k));
  const base={status:(corrupt?'CORRUPT':degraded?'DEGRADED':'HEALTHY') as RuntimeHealthSnapshot['status'],counts,latestTimestamp:observations[0]?.timestamp};
  return {...base,auditHash:hash(base)};
}

export async function collectRuntimeHealth(limit=100){
  const observations=await collectRuntimeObservations(limit);
  return {observations,health:summarizeRuntimeHealth(observations)};
}
