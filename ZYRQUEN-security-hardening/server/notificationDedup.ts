import crypto from 'node:crypto';
export function notificationKey(executionKey:string,eventType:string,payloadHash:string){return crypto.createHash('sha256').update(`${executionKey}:${eventType}:${payloadHash}`).digest('hex');}
export function shouldDeliver(seen:Set<string>,key:string){if(seen.has(key))return false;seen.add(key);return true;}
