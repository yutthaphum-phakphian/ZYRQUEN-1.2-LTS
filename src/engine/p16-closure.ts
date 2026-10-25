// P16 Closure - KEYGEN->DIGEST->SIGN->TSA->VERIFY
import { generateEd25519Keypair, signWithEd25519, verifyEd25519, createTimestampToken } from './hsm-kms.js'
import crypto from 'node:crypto'
export function runP16Closure(payload: string, keyId='zyrquen-p16') {
  try { generateEd25519Keypair(keyId) } catch {}
  const digest = crypto.createHash('sha256').update(payload).digest('hex')
  const { signature } = signWithEd25519(keyId, payload)
  const tsa = createTimestampToken(digest)
  const verified = verifyEd25519(keyId, payload, signature)
  if (!verified) throw new Error('VERIFY FAIL - BLOCKED')
  return { digest, signature, tsa, verified, chain: [`P16|${digest.slice(0,8)}|${tsa.token.slice(0,8)}|PASS`] }
}
