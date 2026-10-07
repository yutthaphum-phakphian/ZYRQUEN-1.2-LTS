import fs from 'fs';
import path from 'path';

export const MAX_MISSION_BYTES = 2 * 1024 * 1024;
export const MISSION_ID_RE = /^[A-Za-z0-9_-]{1,100}$/;
export const defaultMissionDir = () => process.env.MISSION_STORE_DIR || path.join(process.cwd(), '.data', 'missions');

export class MissionStoreError extends Error {
  constructor(public code: 'BAD_ID' | 'TOO_LARGE' | 'INVALID_MISSION' | 'NOT_FOUND', message?: string) { super(message || code); }
}

const fileFor = (dir: string, id: string) => {
  if (!MISSION_ID_RE.test(id)) throw new MissionStoreError('BAD_ID');
  return path.join(dir, `${id}.json`);
};

/** Single-node durable store: atomic write (tmp + rename) of validated mission JSON. Not distributed storage. */
export function saveMission(id: string, raw: string, dir = defaultMissionDir()): { bytes: number } {
  const file = fileFor(dir, id);
  const bytes = Buffer.byteLength(raw, 'utf8');
  if (bytes > MAX_MISSION_BYTES) throw new MissionStoreError('TOO_LARGE');
  let m: any;
  try { m = JSON.parse(raw); } catch { throw new MissionStoreError('INVALID_MISSION', 'not JSON'); }
  if (!m || m.missionId !== id || !Array.isArray(m.tasks) || !Array.isArray(m.events) || typeof m.state !== 'string') throw new MissionStoreError('INVALID_MISSION');
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, raw, 'utf8');
  fs.renameSync(tmp, file);
  return { bytes };
}

export function loadMission(id: string, dir = defaultMissionDir()): string {
  const file = fileFor(dir, id);
  if (!fs.existsSync(file)) throw new MissionStoreError('NOT_FOUND');
  return fs.readFileSync(file, 'utf8');
}

export function listMissions(dir = defaultMissionDir()): Array<{ missionId: string; state: string; objective: string; updatedAt: string }> {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).flatMap(f => {
    try { const m = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); return [{ missionId: m.missionId, state: m.state, objective: String(m.objective || '').slice(0, 200), updatedAt: m.updatedAt }]; } catch { return []; }
  }).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, 100);
}

export const statusFor = (e: unknown) => e instanceof MissionStoreError ? ({ BAD_ID: 400, TOO_LARGE: 413, INVALID_MISSION: 400, NOT_FOUND: 404 } as const)[e.code] : 500;
