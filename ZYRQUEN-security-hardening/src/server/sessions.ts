import { createHash, randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';

const key = (t: string) => createHash('sha256').update(t).digest('hex');

export interface Session { userId: string; expiresAt: number; createdAt: number; }

/**
 * Session store: random 256-bit tokens, only their SHA-256 is kept, fixed TTL, bounded size.
 * Optional file persistence (single process) so sessions survive server restart.
 * Not distributed / multi-instance safe — use Redis (or similar) when you scale out.
 */
export class SessionStore {
  private s = new Map<string, Session>();
  private persistPath: string | null = null;
  private dirty = false;
  private writeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private ttlMs = 12 * 3600_000,
    private maxSessions = 1000,
    private now: () => number = Date.now,
    persistPath?: string | null,
  ) {
    if (persistPath && typeof persistPath === 'string' && persistPath.trim()) {
      this.persistPath = path.resolve(persistPath.trim());
      this.load();
    }
  }

  create(userId: string): { token: string; expiresAt: number } {
    this.sweep();
    if (this.s.size >= this.maxSessions) {
      // evict oldest rather than refuse a valid login
      const oldest = [...this.s.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
      if (oldest) this.s.delete(oldest[0]);
    }
    const token = randomBytes(32).toString('base64url');
    const t = this.now();
    this.s.set(key(token), { userId, createdAt: t, expiresAt: t + this.ttlMs });
    this.schedulePersist();
    return { token, expiresAt: t + this.ttlMs };
  }

  verify(token: string | undefined): { userId: string; expiresAt: number } | null {
    if (!token || token.length > 128) return null;
    const k = key(token);
    const x = this.s.get(k);
    if (!x) return null;
    if (x.expiresAt <= this.now()) {
      this.s.delete(k);
      this.schedulePersist();
      return null;
    }
    return { userId: x.userId, expiresAt: x.expiresAt };
  }

  revoke(token: string | undefined): boolean {
    if (!token) return false;
    const deleted = this.s.delete(key(token));
    if (deleted) this.schedulePersist();
    return deleted;
  }

  /** Rotation: the old token dies, a new one with a fresh TTL is issued. */
  refresh(token: string | undefined) {
    const v = this.verify(token);
    if (!v) return null;
    this.revoke(token);
    return { ...this.create(v.userId), userId: v.userId };
  }

  revokeUser(userId: string): number {
    let n = 0;
    for (const [k, v] of this.s) {
      if (v.userId === userId) {
        this.s.delete(k);
        n++;
      }
    }
    if (n) this.schedulePersist();
    return n;
  }

  size(): number {
    this.sweep();
    return this.s.size;
  }

  /** Force an immediate write (e.g. on process exit). */
  flush(): void {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    this.persist();
  }

  private sweep() {
    const t = this.now();
    let changed = false;
    for (const [k, v] of this.s) {
      if (v.expiresAt <= t) {
        this.s.delete(k);
        changed = true;
      }
    }
    if (changed) this.schedulePersist();
  }

  private schedulePersist() {
    if (!this.persistPath) return;
    this.dirty = true;
    if (this.writeTimer) return;
    // Coalesce writes: at most one disk write every 400 ms
    this.writeTimer = setTimeout(() => {
      this.writeTimer = null;
      this.persist();
    }, 400);
  }

  private persist() {
    if (!this.persistPath || !this.dirty) return;
    this.dirty = false;
    try {
      const dir = path.dirname(this.persistPath);
      fs.mkdirSync(dir, { recursive: true });
      const payload = {
        v: 1,
        savedAt: this.now(),
        sessions: Object.fromEntries(this.s.entries()),
      };
      const tmp = `${this.persistPath}.${process.pid}.${Date.now()}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(payload), 'utf8');
      fs.renameSync(tmp, this.persistPath);
    } catch (err) {
      // Persistence is best-effort; log and keep serving from memory
      console.warn('[sessions] persist failed:', (err as Error).message);
    }
  }

  private load() {
    if (!this.persistPath || !fs.existsSync(this.persistPath)) return;
    try {
      const raw = fs.readFileSync(this.persistPath, 'utf8');
      const data = JSON.parse(raw);
      if (data?.v !== 1 || typeof data.sessions !== 'object') return;
      const t = this.now();
      let loaded = 0;
      for (const [k, v] of Object.entries(data.sessions as Record<string, Session>)) {
        if (
          v &&
          typeof v.userId === 'string' &&
          typeof v.expiresAt === 'number' &&
          typeof v.createdAt === 'number' &&
          v.expiresAt > t
        ) {
          this.s.set(k, v);
          loaded++;
        }
      }
      if (loaded) console.log(`[sessions] restored ${loaded} live session(s) from ${this.persistPath}`);
    } catch (err) {
      console.warn('[sessions] load failed, starting empty:', (err as Error).message);
    }
  }
}
