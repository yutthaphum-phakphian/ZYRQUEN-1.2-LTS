/**
 * Web Crypto API Wrapper for Sovereign Cipher Vault
 * Implements AES-GCM (256-bit) with PBKDF2 (SHA-256, 100,000 iterations)
 * Zero-leakage: Salt & IV stored with ciphertext, key derived in memory only.
 */

export interface EncryptedPayload {
  id: string;
  title: string;
  category: 'CONFIG' | 'CREDENTIAL' | 'LEGAL_NOTE' | 'KEY_BACKUP';
  ciphertext: string; // Base64
  iv: string; // Base64
  salt: string; // Base64
  createdAt: string;
  digest: string; // SHA-256 fingerprint of the payload
}

export interface DecryptedSnippet {
  id: string;
  title: string;
  category: 'CONFIG' | 'CREDENTIAL' | 'LEGAL_NOTE' | 'KEY_BACKUP';
  plaintext: string;
  createdAt: string;
  digest: string;
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive a CryptoKey from a session password using PBKDF2 (100,000 rounds)
export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Compute SHA-256 hex digest
export async function computeDigest(text: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', enc.encode(text));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return 'SHA256:' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Encrypt plaintext snippet using AES-GCM-256
export async function encryptSnippet(
  title: string,
  plaintext: string,
  category: 'CONFIG' | 'CREDENTIAL' | 'LEGAL_NOTE' | 'KEY_BACKUP',
  passphrase: string
): Promise<EncryptedPayload> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();

  const key = await deriveKeyFromPassphrase(passphrase, salt);
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    enc.encode(plaintext)
  );

  const digest = await computeDigest(plaintext);

  return {
    id: 'CIPHER-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
    title,
    category,
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer),
    salt: arrayBufferToBase64(salt.buffer),
    createdAt: new Date().toISOString(),
    digest,
  };
}

// Decrypt ciphertext snippet using AES-GCM-256 and session key
export async function decryptSnippet(
  payload: EncryptedPayload,
  passphrase: string
): Promise<string> {
  const salt = new Uint8Array(base64ToArrayBuffer(payload.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));
  const ciphertextBuffer = base64ToArrayBuffer(payload.ciphertext);

  const key = await deriveKeyFromPassphrase(passphrase, salt);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      ciphertextBuffer
    );
    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch {
    throw new Error('DECRYPTION_FAILED: Invalid session passphrase or corrupted ciphertext payload.');
  }
}
