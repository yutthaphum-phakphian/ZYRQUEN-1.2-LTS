/**
 * Optional Redis-backed SessionStore.
 * Activated when REDIS_URL is set. Falls back to in-memory+file SessionStore otherwise.
 *
 * Requires the `redis` package:  npm i redis
 * Compatible with Redis 6+ / Valkey / Upstash (rediss://).
 */
import { createHash, randomBytes } from 'crypto';
import type { SessionStore as MemorySessionStore } from './sessions';

const keyOf = (t: string) => 'cv:sess:' + createHash('sha256').update(t).digest('hex');

interface RedisClient {
  on(event: 'error', listener: (err: Error) => void): void;
  connect(): Promise<void>;
  set(key: string, value: string, options: { EX: number }): Promise<unknown>;
  sAdd(key: string, value: string): Promise<unknown>;
  expire(key: string, seconds: number): Promise<unknown>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<number>;
  sMembers(key: string): Promise<string[]>;
}

interface RedisPackage {
  createClient(options: { url: string }): RedisClient;
}

function isRedisPackage(value: unknown): value is RedisPackage {
  return typeof value === 'object' && value !== null
    && 'createClient' in value && typeof value.createClient === 'function';
}

function isMissingRedisPackage(error: unknown): boolean {
  return error instanceof Error && 'code' in error
    && (error.code === 'ERR_MODULE_NOT_FOUND' || error.code === 'MODULE_NOT_FOUND')
    && /Cannot find (?:module|package) ['"]redis['"]/.test(error.message);
}

export interface SessionBackend {
  create(userId: string): Promise<{ token: string; expiresAt: number }>;
  verify(token: string | undefined): Promise<{ userId: string; expiresAt: number } | null>;
  revoke(token: string | undefined): Promise<boolean>;
  refresh(token: string | undefined): Promise<{ token: string; expiresAt: number; userId: string } | null>;
  revokeUser(userId: string): Promise<number>;
  size(): Promise<number>;
  flush?(): void;
}

/** Adapter that makes the existing sync SessionStore look async (for uniform call sites). */
export function asAsync(store: MemorySessionStore): SessionBackend {
  return {
    async create(userId) { return store.create(userId); },
    async verify(token) { return store.verify(token); },
    async revoke(token) { return store.revoke(token); },
    async refresh(token) {
      const r = store.refresh(token);
      return r ? { token: r.token, expiresAt: r.expiresAt, userId: r.userId } : null;
    },
    async revokeUser(userId) { return store.revokeUser(userId); },
    async size() { return store.size(); },
    flush() { store.flush?.(); },
  };
}

/**
 * Create a Redis-backed backend. Returns null if REDIS_URL is unset or the `redis` package is missing.
 */
export async function tryCreateRedisBackend(
  ttlMs: number,
  redisUrl = process.env.REDIS_URL,
): Promise<SessionBackend | null> {
  if (!redisUrl || !redisUrl.trim()) return null;
  let redisPackage: unknown;
  try {
    redisPackage = await import('redis');
  } catch (error) {
    if (!isMissingRedisPackage(error)) throw error;
    console.warn('[sessions] REDIS_URL is set but the "redis" package is not installed. Falling back to memory/file. Run: npm i redis');
    return null;
  }
  if (!isRedisPackage(redisPackage)) throw new Error('REDIS_PACKAGE_INVALID');

  const client = redisPackage.createClient({ url: redisUrl.trim() });
  client.on('error', (err: Error) => console.warn('[redis]', err.message));
  await client.connect();
  console.log('[sessions] using Redis backend');

  const ttlSec = Math.max(60, Math.floor(ttlMs / 1000));

  const create = async (userId: string) => {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = Date.now() + ttlMs;
    const k = keyOf(token);
    await client.set(k, JSON.stringify({ userId, expiresAt, createdAt: Date.now() }), { EX: ttlSec });
    // Secondary index for revokeUser (best-effort, short TTL)
    await client.sAdd(`cv:user:${userId}`, k).catch(() => {});
    await client.expire(`cv:user:${userId}`, ttlSec).catch(() => {});
    return { token, expiresAt };
  };

  const verify = async (token: string | undefined) => {
    if (!token || token.length > 128) return null;
    const raw = await client.get(keyOf(token));
    if (!raw) return null;
    try {
      const session = JSON.parse(raw);
      if (!session?.userId || typeof session.expiresAt !== 'number') return null;
      if (session.expiresAt <= Date.now()) {
        await client.del(keyOf(token));
        return null;
      }
      return { userId: session.userId, expiresAt: session.expiresAt };
    } catch {
      return null;
    }
  };

  const revoke = async (token: string | undefined) => {
    if (!token) return false;
    return (await client.del(keyOf(token))) > 0;
  };

  return {
    create,
    verify,
    revoke,
    async refresh(token: string | undefined) {
      const session = await verify(token);
      if (!session) return null;
      await revoke(token);
      return { ...(await create(session.userId)), userId: session.userId };
    },
    async revokeUser(userId: string) {
      const members: string[] = await client.sMembers(`cv:user:${userId}`).catch(() => []);
      let count = 0;
      for (const member of members) count += await client.del(member);
      await client.del(`cv:user:${userId}`).catch(() => {});
      return count;
    },
    async size() {
      return -1;
    },
  };
}
