import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export type DurableRecordKind = 'workspace' | 'mission' | 'checkpoint' | 'event' | 'lock' | 'recovery' | 'transaction' | 'transaction-effect' | 'worker-lease' | 'transaction-commit' | 'mission-queue' | 'worker-run' | 'worker-task-run' | 'worker-consistency-run' | 'worker-consistency-supervisor' | 'repair-coordinator' | 'recovery-governance' | 'reliability-supervisor' | 'agent-coordination' | 'simulation' | 'agent-policy' | 'agent-run' | 'agent-run-execution';

export interface DurableWorkspace {
  projectId: string;
  version: number;
  updatedAt: string;
  files: Array<{ name: string; content: string; language?: string; action?: string }>;
  metadata?: Record<string, unknown>;
  integrityHash?: string;
}

export interface DurableEnvelope<T> {
  kind: DurableRecordKind;
  id: string;
  version: number;
  savedAt: string;
  payload: T;
  integrityHash: string;
}

export interface DurableEvent {
  sequence?: number;
  prevHash?: string;
  hash?: string;
  eventId: string;
  missionId: string;
  type: string;
  timestamp: string;
  status?: string;
  taskId?: string;
  summary: string;
  evidence?: string[];
  metadata?: Record<string, unknown>;
}

export interface DurableLock {
  lockId: string;
  fencingToken: string;
  resource: string;
  owner: string;
  acquiredAt: string;
  expiresAt: string;
}

const DATA_ROOT = path.resolve(process.env.CODEVOICE_DURABLE_ROOT || path.join(process.cwd(), '.codevoice-data'));
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 2000;
const MAX_EVENT_BYTES = 64 * 1024;
const MAX_EVENTS_PER_MISSION = 20000;

function safeId(value: string) {
  const id = String(value || '').trim();
  if (!id || id.length > 128 || !/^[a-zA-Z0-9._-]+$/.test(id)) throw new Error('INVALID_DURABLE_ID');
  return id;
}

function stableHash(value: unknown) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function recordPath(kind: DurableRecordKind, id: string) {
  return path.join(DATA_ROOT, kind, `${safeId(id)}.json`);
}

async function atomicWrite(filePath: string, data: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.${Date.now()}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  await fs.writeFile(tmp, data, { encoding: 'utf8', mode: 0o600 });
  await fs.rename(tmp, filePath);
}

function validateWorkspace(input: DurableWorkspace): DurableWorkspace {
  const projectId = safeId(input.projectId);
  if (!Array.isArray(input.files) || input.files.length > MAX_FILES) throw new Error('WORKSPACE_FILE_LIMIT');
  const files = input.files.map((file) => {
    const name = String(file.name || '').replace(/\\/g, '/').replace(/^\.\//, '');
    if (!name || name.startsWith('/') || name.split('/').includes('..') || name.includes('\0')) throw new Error('PATH_TRAVERSAL_BLOCKED');
    const content = String(file.content ?? '');
    if (Buffer.byteLength(content, 'utf8') > MAX_FILE_BYTES) throw new Error('FILE_SIZE_LIMIT');
    return { name, content, language: file.language, action: file.action };
  });
  return { projectId, version: Math.max(1, Number(input.version || 1)), updatedAt: String(input.updatedAt || new Date().toISOString()), files, metadata: input.metadata || {}, integrityHash: stableHash({ projectId, version: input.version, updatedAt: input.updatedAt, files, metadata: input.metadata || {} }) };
}

export async function saveWorkspace(input: DurableWorkspace) {
  const workspace = validateWorkspace(input);
  const filePath = recordPath('workspace', workspace.projectId);
  const existing = await loadWorkspace(workspace.projectId);
  if (existing && workspace.version < existing.version) throw new Error('STALE_WORKSPACE_VERSION');
  const next = { ...workspace, version: Math.max(workspace.version, existing?.version || 0) + 1, updatedAt: new Date().toISOString() };
  next.integrityHash = stableHash({ projectId: next.projectId, version: next.version, updatedAt: next.updatedAt, files: next.files, metadata: next.metadata });
  await atomicWrite(filePath, JSON.stringify(next));
  return next;
}

export async function loadWorkspace(projectId: string): Promise<DurableWorkspace | null> {
  try {
    const raw = await fs.readFile(recordPath('workspace', projectId), 'utf8');
    const value = JSON.parse(raw) as DurableWorkspace;
    const expected = stableHash({ projectId: value.projectId, version: value.version, updatedAt: value.updatedAt, files: value.files, metadata: value.metadata || {} });
    if (expected !== value.integrityHash) throw new Error('WORKSPACE_INTEGRITY_FAILED');
    return validateWorkspace(value);
  } catch (error: any) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

export async function saveDurableRecord<T>(kind: DurableRecordKind, id: string, payload: T, version = 1): Promise<DurableEnvelope<T>> {
  const safe = safeId(id);
  if (kind === 'lock') throw new Error('LOCK_USE_ACQUIRE_API');
  const filePath = recordPath(kind, safe);
  const existing = await loadDurableRecord<T>(kind, safe);
  if (existing && version < existing.version) throw new Error('STALE_RECORD_VERSION');
  const envelope: DurableEnvelope<T> = { kind, id: safe, version: Math.max(version, existing?.version || 0) + 1, savedAt: new Date().toISOString(), payload, integrityHash: '' };
  envelope.integrityHash = stableHash({ kind: envelope.kind, id: envelope.id, version: envelope.version, savedAt: envelope.savedAt, payload: envelope.payload });
  const encoded = JSON.stringify(envelope);
  if (Buffer.byteLength(encoded, 'utf8') > MAX_EVENT_BYTES * 16) throw new Error('RECORD_SIZE_LIMIT');
  await atomicWrite(filePath, encoded);
  return envelope;
}

export async function loadDurableRecord<T>(kind: DurableRecordKind, id: string): Promise<DurableEnvelope<T> | null> {
  try {
    const raw = await fs.readFile(recordPath(kind, id), 'utf8');
    const value = JSON.parse(raw) as DurableEnvelope<T>;
    const expected = stableHash({ kind: value.kind, id: value.id, version: value.version, savedAt: value.savedAt, payload: value.payload });
    if (expected !== value.integrityHash) throw new Error('RECORD_INTEGRITY_FAILED');
    if (value.kind !== kind || value.id !== safeId(id)) throw new Error('RECORD_ID_MISMATCH');
    return value;
  } catch (error: any) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

export async function deleteDurableRecord(kind: DurableRecordKind, id: string) {
  try { await fs.unlink(recordPath(kind, id)); } catch (error: any) { if (error?.code !== 'ENOENT') throw error; }
}

export async function listDurableRecordIds(kind: DurableRecordKind, limit = 500): Promise<string[]> {
  const dir = path.join(DATA_ROOT, kind);
  try {
    const names = await fs.readdir(dir);
    return names.filter((name) => name.endsWith('.json')).slice(-Math.min(Math.max(limit, 1), 2000)).map((name) => name.slice(0, -5));
  } catch (error: any) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

function eventsPath(missionId: string) { return path.join(DATA_ROOT, 'event', `${safeId(missionId)}.jsonl`); }

function eventHash(event: DurableEvent) {
  const canonical = {
    sequence: event.sequence,
    eventId: event.eventId,
    missionId: event.missionId,
    type: event.type,
    timestamp: event.timestamp,
    status: event.status,
    taskId: event.taskId,
    summary: event.summary,
    evidence: event.evidence || [],
    metadata: event.metadata || {},
    prevHash: event.prevHash || '',
  };
  return stableHash(canonical);
}

const journalQueues = new Map<string, Promise<unknown>>();
async function withJournalLock<T>(missionId: string, work: () => Promise<T>): Promise<T> {
  const key = safeId(missionId);
  const previous = journalQueues.get(key) || Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const queued = previous.then(() => gate);
  journalQueues.set(key, queued);
  await previous;
  try { return await work(); } finally { release(); if (journalQueues.get(key) === queued) journalQueues.delete(key); }
}

export async function appendMissionEvent(event: DurableEvent) {
  return withJournalLock(event.missionId, async () => {
    const missionId = safeId(event.missionId);
    const file = eventsPath(missionId);
    const lineBase = { ...event, missionId };
    const encodedBase = JSON.stringify(lineBase);
    if (Buffer.byteLength(encodedBase, 'utf8') > MAX_EVENT_BYTES) throw new Error('EVENT_SIZE_LIMIT');
    await fs.mkdir(path.dirname(file), { recursive: true });
    const existingRaw = await fs.readFile(file, 'utf8').catch((error: any) => error?.code === 'ENOENT' ? '' : Promise.reject(error));
    const rows = existingRaw.split('\n').filter(Boolean);
    for (const row of rows) { try { if (JSON.parse(row).eventId === event.eventId) return event; } catch { /* integrity verification handles malformed rows */ } }
    if (rows.length >= MAX_EVENTS_PER_MISSION) throw new Error('EVENT_LIMIT');
    const previous = rows.length ? JSON.parse(rows[rows.length - 1]) as DurableEvent : undefined;
    const enriched: DurableEvent = {
      ...lineBase,
      sequence: rows.length + 1,
      prevHash: previous?.hash || (previous ? eventHash({ ...previous, hash: undefined }) : ''),
    };
    enriched.hash = eventHash(enriched);
    const line = JSON.stringify(enriched);
    if (Buffer.byteLength(line, 'utf8') > MAX_EVENT_BYTES) throw new Error('EVENT_SIZE_LIMIT');
    await fs.appendFile(file, `${line}\n`, { encoding: 'utf8', mode: 0o600 });
    return enriched;
  });
}

export interface MissionJournalVerification {
  missionId: string;
  valid: boolean;
  legacyEvents: number;
  count: number;
  firstFailure?: { sequence: number; reason: string };
  lastHash?: string;
}

export async function verifyMissionEventJournal(missionId: string): Promise<MissionJournalVerification> {
  const safe = safeId(missionId);
  try {
    const raw = await fs.readFile(eventsPath(safe), 'utf8');
    const rows = raw.split('\n').filter(Boolean);
    let previousHash = '';
    let legacyEvents = 0;
    for (let index = 0; index < rows.length; index += 1) {
      let parsed: DurableEvent;
      try { parsed = JSON.parse(rows[index]) as DurableEvent; } catch { return { missionId: safe, valid: false, legacyEvents, count: rows.length, firstFailure: { sequence: index + 1, reason: 'INVALID_JSON' } }; }
      const sequence = Number(parsed.sequence || index + 1);
      if (sequence !== index + 1) return { missionId: safe, valid: false, legacyEvents, count: rows.length, firstFailure: { sequence, reason: 'SEQUENCE_MISMATCH' }, lastHash: previousHash || undefined };
      if (!parsed.hash) {
        legacyEvents += 1;
        previousHash = eventHash(parsed);
        continue;
      }
      if ((parsed.prevHash || '') !== previousHash) return { missionId: safe, valid: false, legacyEvents, count: rows.length, firstFailure: { sequence, reason: 'PREV_HASH_MISMATCH' }, lastHash: previousHash || undefined };
      const expected = eventHash(parsed);
      if (expected !== parsed.hash) return { missionId: safe, valid: false, legacyEvents, count: rows.length, firstFailure: { sequence, reason: 'HASH_MISMATCH' }, lastHash: previousHash || undefined };
      previousHash = parsed.hash;
    }
    return { missionId: safe, valid: true, legacyEvents, count: rows.length, lastHash: previousHash || undefined };
  } catch (error: any) {
    if (error?.code === 'ENOENT') return { missionId: safe, valid: true, legacyEvents: 0, count: 0 };
    throw error;
  }
}

export async function listMissionEvents(missionId: string, limit = 500): Promise<DurableEvent[]> {
  const safe = safeId(missionId);
  const verification = await verifyMissionEventJournal(safe);
  if (!verification.valid) throw new Error(`EVENT_JOURNAL_INTEGRITY_FAILED:${verification.firstFailure?.reason || 'UNKNOWN'}`);
  const max = Math.min(Math.max(Number(limit || 500), 1), 2000);
  try {
    const raw = await fs.readFile(eventsPath(safe), 'utf8');
    return raw.split('\n').filter(Boolean).slice(-max).map((line) => JSON.parse(line) as DurableEvent);
  } catch (error: any) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

export interface RecoveryRecord {
  recoveryId: string;
  missionId: string;
  detectedAt: string;
  status: 'DETECTED' | 'RESOLVED' | 'BLOCKED';
  reason: string;
  lastEventSequence: number;
  lastEventHash?: string;
  recommendedAction: 'REPLAY_FROM_JOURNAL' | 'INSPECT_WORKSPACE' | 'MANUAL_REVIEW';
}

export async function createRecoveryRecord(input: Omit<RecoveryRecord, 'recoveryId' | 'detectedAt'>) {
  const record: RecoveryRecord = { ...input, recoveryId: crypto.randomUUID(), detectedAt: new Date().toISOString() };
  return saveDurableRecord('recovery', record.recoveryId, record);
}

export async function listRecoveryRecords(limit = 100): Promise<RecoveryRecord[]> {
  const dir = path.join(DATA_ROOT, 'recovery');
  try {
    const names = await fs.readdir(dir);
    const records: RecoveryRecord[] = [];
    for (const name of names.slice(-Math.min(limit, 500))) {
      try { const value = await loadDurableRecord<RecoveryRecord>('recovery', path.basename(name, '.json')); if (value) records.push(value.payload); } catch { /* skip corrupted record */ }
    }
    return records.sort((a, b) => a.detectedAt.localeCompare(b.detectedAt));
  } catch (error: any) { if (error?.code === 'ENOENT') return []; throw error; }
}

async function countMissionEvents(missionId: string) {
  try { return (await fs.readFile(eventsPath(missionId), 'utf8')).split('\n').filter(Boolean).length; }
  catch (error: any) { if (error?.code === 'ENOENT') return 0; throw error; }
}

export async function acquireDurableLock(resource: string, owner: string, ttlMs = 30000): Promise<DurableLock> {
  const safeResource = safeId(resource);
  const safeOwner = safeId(owner);
  const ttl = Math.min(Math.max(ttlMs, 1000), 300000);
  const file = recordPath('lock', safeResource);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const nowMs = Date.now();
    const lockId = crypto.randomUUID();
    const lock: DurableLock = { lockId, fencingToken: lockId, resource: safeResource, owner: safeOwner, acquiredAt: new Date(nowMs).toISOString(), expiresAt: new Date(nowMs + ttl).toISOString() };
    await fs.mkdir(path.dirname(file), { recursive: true });
    try {
      const handle = await fs.open(file, 'wx', 0o600);
      try { await handle.writeFile(JSON.stringify(lock), { encoding: 'utf8' }); } finally { await handle.close(); }
      return lock;
    } catch (error: any) {
      if (error?.code !== 'EEXIST') throw error;
      let current: DurableLock | undefined;
      try { current = JSON.parse(await fs.readFile(file, 'utf8')) as DurableLock; } catch (readError: any) {
        if (readError?.code === 'ENOENT') continue;
        throw readError;
      }
      if (current.owner === safeOwner && Date.parse(current.expiresAt) <= nowMs) {
        await fs.unlink(file).catch((unlinkError: any) => { if (unlinkError?.code !== 'ENOENT') throw unlinkError; });
        continue;
      }
      if (Date.parse(current.expiresAt) > nowMs) throw new Error('RESOURCE_LOCKED');
      await fs.unlink(file).catch((unlinkError: any) => { if (unlinkError?.code !== 'ENOENT') throw unlinkError; });
    }
  }
  throw new Error('RESOURCE_LOCKED');
}

export async function renewDurableLock(resource: string, owner: string, lockId: string, ttlMs = 30000) {
  const safeResource = safeId(resource);
  const safeOwner = safeId(owner);
  const safeLockId = safeId(lockId);
  const file = recordPath('lock', safeResource);
  let current: DurableLock;
  try { current = JSON.parse(await fs.readFile(file, 'utf8')) as DurableLock; }
  catch (error: any) { if (error?.code === 'ENOENT') throw new Error('LOCK_NOT_FOUND'); throw error; }
  if (current.owner !== safeOwner) throw new Error('LOCK_OWNER_MISMATCH');
  if (current.lockId !== safeLockId) throw new Error('LOCK_FENCE_MISMATCH');
  if (Date.parse(current.expiresAt) <= Date.now()) throw new Error('LOCK_EXPIRED');
  const now = Date.now();
  const renewed: DurableLock = { ...current, fencingToken: current.fencingToken || current.lockId, expiresAt: new Date(now + Math.min(Math.max(ttlMs, 1000), 300000)).toISOString() };
  await atomicWrite(file, JSON.stringify(renewed));
  return renewed;
}

export async function inspectDurableLock(resource: string): Promise<DurableLock | null> {
  const safeResource = safeId(resource);
  try { return JSON.parse(await fs.readFile(recordPath('lock', safeResource), 'utf8')) as DurableLock; }
  catch (error: any) { if (error?.code === 'ENOENT') return null; throw error; }
}

export async function releaseDurableLock(resource: string, owner: string) {
  const safeResource = safeId(resource);
  try {
    const raw = await fs.readFile(recordPath('lock', safeResource), 'utf8');
    const lock = JSON.parse(raw) as DurableLock;
    if (lock.owner !== safeId(owner)) throw new Error('LOCK_OWNER_MISMATCH');
    await fs.unlink(recordPath('lock', safeResource));
  } catch (error: any) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
}

export function durableStoreInfo() {
  return {
    root: DATA_ROOT,
    persistent: true,
    atomicWrites: true,
    integrity: 'sha256' as const,
    eventJournal: true,
    resourceLocks: true,
    journalIntegrity: true,
    recoveryRecords: true,
    maxEventBytes: MAX_EVENT_BYTES,
    maxEventsPerMission: MAX_EVENTS_PER_MISSION,
  };
}
