import crypto from 'node:crypto';
export function createExecutionPolicySnapshot(policy:Record<string,unknown>){const canonical=JSON.stringify(Object.fromEntries(Object.entries(policy).sort(([a],[b])=>a.localeCompare(b))));return{policy,hash:crypto.createHash('sha256').update(canonical).digest('hex')};}
export function verifyExecutionPolicySnapshot(s:{policy:Record<string,unknown>;hash:string}){return createExecutionPolicySnapshot(s.policy).hash===s.hash;}
