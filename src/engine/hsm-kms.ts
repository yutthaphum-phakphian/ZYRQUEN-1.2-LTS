// HSM/KMS + Ed25519 + TSA - Port from ZYNTHEOR P13
import crypto from 'node:crypto'
const keystore = new Map()
export function generateEd25519Keypair(keyId: string) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  })
  keystore.set(keyId, { publicKey, privateKey })
  return { keyId, publicKey }
}
export function signWithEd25519(keyId: string, payload: string) {
  const keys = keystore.get(keyId)
  if (!keys) throw new Error(`Key ${keyId} not found - BLOCKED`)
  const signature = crypto.sign(null, Buffer.from(payload), keys.privateKey).toString('base64')
  return { signature, keyId }
}
export function verifyEd25519(keyId: string, payload: string, sig: string) {
  const keys = keystore.get(keyId)
  return crypto.verify(null, Buffer.from(payload), keys.publicKey, Buffer.from(sig, 'base64'))
}
export function createTimestampToken(digest: string) {
  const ts = new Date().toISOString()
  return { digest, timestamp: ts, token: crypto.createHash('sha256').update(`TSA|${digest}|${ts}`).digest('hex'), authority: 'ZYRQUEN-LOCAL-TSA' }
  }
