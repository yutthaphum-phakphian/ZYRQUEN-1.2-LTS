// ZYRQUEN-1.2-LTS/src/engine/p16-closure.ts
// Port from ZYNTHEOR P16 - KEYGEN -> DIGEST -> SIGN -> TSA -> VERIFY Chain
import crypto from 'node:crypto';
import { generateEd25519Keypair, signWithEd25519, verifyEd25519, createTimestampToken } from './hsm-kms.js';

export type P16Result = {
  keyId: string;
  digest: string;
  signature: string;
  tsa: ReturnType<typeof createTimestampToken>;
  verified: boolean;
  chainLog: string[];
};

export function runP16Closure(payload: string, keyId = 'zyrquen-p16-main'): P16Result {
  const chainLog: string[] = [];
  try { generateEd25519Keypair(keyId); chainLog.push(`KEYGEN|${keyId}|OK`); } 
  catch { chainLog.push(`KEYGEN|${keyId}|EXISTS`); }
  
  const digest = crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
  chainLog.push(`DIGEST|${digest.slice(0,12)}|OK`);
  
  const { signature } = signWithEd25519(keyId, payload);
  chainLog.push(`SIGN|${signature.slice(0,12)}|OK`);
  
  const tsa = createTimestampToken(digest);
  chainLog.push(`TSA|${tsa.token.slice(0,12)}|${tsa.timestamp}`);
  
  const verified = verifyEd25519(keyId, payload, signature);
  chainLog.push(`VERIFY|${verified ? 'PASS' : 'FAIL'}`);
  
  if (!verified) throw new Error('P16_VERIFY_FAIL - BLOCKED');
  
  return { keyId, digest, signature, tsa, verified, chainLog };
}
