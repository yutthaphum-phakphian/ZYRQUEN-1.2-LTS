import crypto from 'node:crypto';
export function createReleaseAttestation(manifestHash:string,executionKey:string,createdAt:string){return crypto.createHash('sha256').update(`${manifestHash}:${executionKey}:${createdAt}`).digest('hex');}
export function verifyReleaseAttestation(attestation:string,manifestHash:string,executionKey:string,createdAt:string){return createReleaseAttestation(manifestHash,executionKey,createdAt)===attestation;}
