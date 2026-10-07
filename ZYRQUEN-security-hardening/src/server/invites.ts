/**
 * One-time invite links for distributing access keys without chat/email leakage.
 *
 * Flow:
 *  1. Admin creates invite for userId (or creates user + invite).
 *  2. Server returns a raw token once; only its hash is stored.
 *  3. Recipient opens /api/invite/redeem with the token → receives accessKey once,
 *     invite is burned.
 *
 * Persist: optional JSON file (atomic). In-memory if no path.
 */
import { createHash, randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';
import { USER_ID_RE } from './auth';

const hash = (t: string) => createHash('sha256').update(t).digest('hex');

export interface InviteRecord {
  id: string;          // hash of token (hex)
  userId: string;
  /** If set, redeem will return this key (already created). Otherwise rotate/create on redeem. */
  pendingKeyHash?: string;
  /** Plaintext key kept only until redeem when we generated it at invite time — actually we never store plaintext. */
  createdAt: number;
  expiresAt: number;
  note?: string;
  createdBy?: string;
}

type PersistShape = { v: 1; invites: InviteRecord[] };

export class InviteStore {
  private map = new Map<string, InviteRecord>();
  private persistPath: string | null;
  private dirty = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    persistPath?: string | null,
    private defaultTtlMs = 48 * 3600_000,
    private now: () => number = Date.now,
  ) {
    this.persistPath = persistPath && persistPath.trim() ? path.resolve(persistPath.trim()) : null;
    if (this.persistPath) this.load();
  }

  /**
   * Create an invite. Returns the one-time raw token (show once).
   * Caller is responsible for ensuring the user exists / will exist at redeem time.
   */
  create(userId: string, opts?: { ttlMs?: number; note?: string; createdBy?: string }): { token: string; expiresAt: number; userId: string } {
    if (!USER_ID_RE.test(userId)) throw Object.assign(new Error('BAD_USER_ID'), { code: 'BAD_USER_ID' });
    const token = randomBytes(32).toString('base64url');
    const t = this.now();
    const expiresAt = t + (opts?.ttlMs ?? this.defaultTtlMs);
    const rec: InviteRecord = {
      id: hash(token),
      userId,
      createdAt: t,
      expiresAt,
      note: opts?.note?.slice(0, 200),
      createdBy: opts?.createdBy,
    };
    this.map.set(rec.id, rec);
    this.schedulePersist();
    return { token, expiresAt, userId };
  }

  /** Peek without consuming. */
  peek(token: string | undefined): InviteRecord | null {
    if (!token || token.length > 128) return null;
    const rec = this.map.get(hash(token));
    if (!rec) return null;
    if (rec.expiresAt <= this.now()) {
      this.map.delete(rec.id);
      this.schedulePersist();
      return null;
    }
    return rec;
  }

  /** Consume invite (burn). Returns userId or null. */
  redeem(token: string | undefined): { userId: string; note?: string } | null {
    const rec = this.peek(token);
    if (!rec) return null;
    this.map.delete(rec.id);
    this.schedulePersist();
    return { userId: rec.userId, note: rec.note };
  }

  list(): Array<{ userId: string; createdAt: number; expiresAt: number; note?: string }> {
    this.sweep();
    return [...this.map.values()]
      .map(({ userId, createdAt, expiresAt, note }) => ({ userId, createdAt, expiresAt, note }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  revokeForUser(userId: string): number {
    let n = 0;
    for (const [id, rec] of this.map) {
      if (rec.userId === userId) {
        this.map.delete(id);
        n++;
      }
    }
    if (n) this.schedulePersist();
    return n;
  }

  size(): number {
    this.sweep();
    return this.map.size;
  }

  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.persist();
  }

  private sweep() {
    const t = this.now();
    let changed = false;
    for (const [id, rec] of this.map) {
      if (rec.expiresAt <= t) {
        this.map.delete(id);
        changed = true;
      }
    }
    if (changed) this.schedulePersist();
  }

  private schedulePersist() {
    if (!this.persistPath) return;
    this.dirty = true;
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.persist();
    }, 300);
  }

  private persist() {
    if (!this.persistPath || !this.dirty) return;
    this.dirty = false;
    try {
      fs.mkdirSync(path.dirname(this.persistPath), { recursive: true });
      const payload: PersistShape = { v: 1, invites: [...this.map.values()] };
      const tmp = `${this.persistPath}.${process.pid}.${Date.now()}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(payload), 'utf8');
      fs.renameSync(tmp, this.persistPath);
    } catch (err) {
      console.warn('[invites] persist failed:', (err as Error).message);
    }
  }

  private load() {
    if (!this.persistPath || !fs.existsSync(this.persistPath)) return;
    try {
      const data = JSON.parse(fs.readFileSync(this.persistPath, 'utf8')) as PersistShape;
      if (data?.v !== 1 || !Array.isArray(data.invites)) return;
      const t = this.now();
      for (const rec of data.invites) {
        if (rec?.id && rec.userId && rec.expiresAt > t) this.map.set(rec.id, rec);
      }
      console.log(`[invites] loaded ${this.map.size} active invite(s)`);
    } catch (err) {
      console.warn('[invites] load failed:', (err as Error).message);
    }
  }
}
