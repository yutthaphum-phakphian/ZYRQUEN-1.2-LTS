import crypto from 'node:crypto';
import { loadWorkspace } from './durableStore.ts';
export type ReconciliationVerdict='ALIGNED'|'DRIFTED'|'MISSING'|'CORRUPT';
export interface ReconciliationResult { projectId:string; verdict:ReconciliationVerdict; durableVersion?:number; expectedHash?:string; actualHash?:string; differences:string[]; auditHash:string; checkedAt:string; }
const hash=(v:unknown)=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
export async function reconcileWorkspace(input:{projectId:string; actualFiles?:Array<{name:string;content:string}>}):Promise<ReconciliationResult>{
 const checkedAt=new Date().toISOString(); let ws;try{ws=await loadWorkspace(input.projectId)}catch(error){const base={projectId:input.projectId,verdict:'CORRUPT' as const,differences:[error instanceof Error?error.message:String(error)],checkedAt};return {...base,auditHash:hash(base)}}
 if(!ws){const base={projectId:input.projectId,verdict:'MISSING' as const,differences:['DURABLE_WORKSPACE_MISSING'],checkedAt};return {...base,auditHash:hash(base)}}
 const actual=input.actualFiles?new Map(input.actualFiles.map(f=>[f.name,f.content])):null; const differences:string[]=[];
 if(actual){const expected=new Map(ws.files.map(f=>[f.name,f.content])); for(const [n,c] of expected){if(!actual.has(n))differences.push(`MISSING:${n}`);else if(actual.get(n)!==c)differences.push(`CONTENT_MISMATCH:${n}`)}for(const n of actual.keys())if(!expected.has(n))differences.push(`UNEXPECTED:${n}`)}
 const base={projectId:input.projectId,verdict:(actual?(differences.length?'DRIFTED':'ALIGNED'):'ALIGNED') as ReconciliationVerdict,durableVersion:ws.version,expectedHash:ws.integrityHash,differences,checkedAt};return {...base,auditHash:hash(base)};
}
