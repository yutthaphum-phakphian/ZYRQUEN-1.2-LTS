import crypto from 'node:crypto';
export function replayFence(executionKey:string, nonce:string){return crypto.createHash('sha256').update(`${executionKey}:${nonce}`).digest('hex');}
export function verifyReplayFence(expected:string, executionKey:string, nonce:string){return replayFence(executionKey,nonce)===expected;}
