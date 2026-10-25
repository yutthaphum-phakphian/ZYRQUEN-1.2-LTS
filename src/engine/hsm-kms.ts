// ZYRQUEN-1.2-LTS/src/engine/hsm-kms.ts
// Port from ZYNTHEOR P13 - HSM/KMS Ed25519 + TSA Local-Only
import crypto from 'node:crypto';

type KeyRecord = { publicKey: string; privateKey: string };
const keystore = new Map<string, KeyRecord>();

export function generateEd25519Keypair(keyId: string) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  keystore.set(keyId, { publicKey, privateKey });
  return { keyId, publicKey, algo: 'Ed25519' };
}

export function signWithEd25519(keyId: string, payload: string) {
  const rec = keystore.get(keyId);
  if (!rec) throw new Error(`HSM_KEY_NOT_FOUND:${keyId} - BLOCKED`);
  const sig = crypto.sign(null, Buffer.from(payload, 'utf8'), rec.privateKey).toString('base64');
  return { keyId, signature: sig, algo: 'Ed25519' };
}

export function verifyEd25519(keyId: string, payload: string, signatureB64: string): boolean {
  const rec = keystore.get(keyId);
  if (!rec) return false;
  return crypto.verify(null, Buffer.from(payload, 'utf8'), rec.publicKey, Buffer.from(signatureB64, 'base64'));
}

export function createTimestampToken(digestHex: string) {
  const ts = new Date().toISOString();
  const token = crypto.createHash('sha256').update(`ZYRQUEN-TSA|${digestHex}|${ts}`).digest('hex');
  return { digest: digestHex, timestamp: ts, token, authority: 'ZYRQUEN-LOCAL-TSA', algo: 'sha256' };
}

export function listKeys() {
  return Array.from(keystore.keys());
}
