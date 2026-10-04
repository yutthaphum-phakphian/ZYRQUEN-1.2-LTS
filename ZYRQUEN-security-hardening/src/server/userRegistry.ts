/**
 * Dynamic user registry — access keys that can be created/rotated at runtime
 * without restarting the process or editing AUTH_TOKENS.
 *
 * Storage: optional JSON file (atomic write). Keys are stored as SHA-256 only.
 * AUTH_TOKENS from env still work and take precedence as "bootstrap" users.
 */
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import fs from 'fs';
import path from 'path';
import { USER_ID_RE } from './auth';

const sha = (s: string) => createHash('sha256').update(s).digest();

export interface RegistryUser {
  userId: string;
  /** SHA-256 of the current access key (hex). */
  keyHash: string;
  enabled: boolean;
  createdAt: number;
  rotatedAt: number;
  note?: string;
}

export interface IssuedKey {
  userId: string;
  accessKey: string; // shown once to the admin
  createdAt: number;
}

type PersistShape = { v: 1; users: RegistryUser[] };

export class UserRegistry {
  private users = new Map<string, RegistryUser>(); // key = userId
  private persistPath: string | null;
  private dirty = false;
  private writeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(persistPath?: string | null) {
    this.persistPath = persistPath && persistPath.trim() ? path.resolve(persistPath.trim()) : null;
    if (this.persistPath) this.load();
  }

  /** Constant-time lookup: accessKey → userId or null (only enabled users). */
  resolve(accessKey: string | undefined | null): string | null {
    if (!accessKey || typeof accessKey !== 'string' || accessKey.length < 16 || accessKey.length > 512) {
      return null;
    }
    const given = sha(accessKey);
    let found: string | null = null;
    for (const u of this.users.values()) {
      if (!u.enabled) continue;
      const stored = Buffer.from(u.keyHash, 'hex');
      if (stored.length === given.length && timingSafeEqual(stored, given) && found === null) {
        found = u.userId;
      }
    }
    return found;
  }

  list(): Array<{ userId: string; enabled: boolean; createdAt: number; rotatedAt: number; note?: string }> {
    return [...this.users.values()]
      .map(({ userId, enabled, createdAt, rotatedAt, note }) => ({ userId, enabled, createdAt, rotatedAt, note }))
      .sort((a, b) => a.userId.localeCompare(b.userId));
  }

  get(userId: string): RegistryUser | undefined {
    return this.users.get(userId);
  }

  /**
   * Create a new user with a fresh random access key (32 bytes base64url ≥ 43 chars).
   * Fails if userId already exists or is invalid.
   */
  create(userId: string, note?: string): IssuedKey {
    if (!USER_ID_RE.test(userId)) throw Object.assign(new Error('BAD_USER_ID'), { code: 'BAD_USER_ID' });
    if (this.users.has(userId)) throw Object.assign(new Error('USER_EXISTS'), { code: 'USER_EXISTS' });
    const accessKey = randomBytes(32).toString('base64url');
    const t = Date.now();
    this.users.set(userId, {
      userId,
      keyHash: sha(accessKey).toString('hex'),
      enabled: true,
      createdAt: t,
      rotatedAt: t,
      note: note?.slice(0, 200),
    });
    this.schedulePersist();
    return { userId, accessKey, createdAt: t };
  }

  /** Issue a new access key; old key stops working immediately. */
  rotate(userId: string): IssuedKey {
    const u = this.users.get(userId);
    if (!u) throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' });
    const accessKey = randomBytes(32).toString('base64url');
    u.keyHash = sha(accessKey).toString('hex');
    u.rotatedAt = Date.now();
    this.schedulePersist();
    return { userId, accessKey, createdAt: u.rotatedAt };
  }

  setEnabled(userId: string, enabled: boolean): boolean {
    const u = this.users.get(userId);
    if (!u) return false;
    u.enabled = enabled;
    this.schedulePersist();
    return true;
  }

  remove(userId: string): boolean {
    const ok = this.users.delete(userId);
    if (ok) this.schedulePersist();
    return ok;
  }

  size(): number {
    return this.users.size;
  }

  flush(): void {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    this.persist();
  }

  private schedulePersist() {
    if (!this.persistPath) return;
    this.dirty = true;
    if (this.writeTimer) return;
    this.writeTimer = setTimeout(() => {
      this.writeTimer = null;
      this.persist();
    }, 300);
  }

  private persist() {
    if (!this.persistPath || !this.dirty) return;
    this.dirty = false;
    try {
      fs.mkdirSync(path.dirname(this.persistPath), { recursive: true });
      const payload: PersistShape = { v: 1, users: [...this.users.values()] };
      const tmp = `${this.persistPath}.${process.pid}.${Date.now()}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(payload, null, 0), 'utf8');
      fs.renameSync(tmp, this.persistPath);
    } catch (err) {
      console.warn('[userRegistry] persist failed:', (err as Error).message);
    }
  }

  private load() {
    if (!this.persistPath || !fs.existsSync(this.persistPath)) return;
    try {
      const raw = fs.readFileSync(this.persistPath, 'utf8');
      const data = JSON.parse(raw) as PersistShape;
      if (data?.v !== 1 || !Array.isArray(data.users)) return;
      for (const u of data.users) {
        if (
          u &&
          USER_ID_RE.test(u.userId) &&
          typeof u.keyHash === 'string' &&
          u.keyHash.length === 64 &&
          typeof u.enabled === 'boolean'
        ) {
          this.users.set(u.userId, {
            userId: u.userId,
            keyHash: u.keyHash,
            enabled: u.enabled,
            createdAt: u.createdAt || 0,
            rotatedAt: u.rotatedAt || 0,
            note: u.note,
          });
        }
      }
      console.log(`[userRegistry] loaded ${this.users.size} user(s) from ${this.persistPath}`);
    } catch (err) {
      console.warn('[userRegistry] load failed:', (err as Error).message);
    }
  }
}
