import fs from 'fs/promises';
import path from 'path';
import { loadDurableRecord, saveDurableRecord, verifyMissionEventJournal, appendMissionEvent, type DurableEnvelope } from './durableStore.ts';
import { replayMission, type MissionReplayState } from './missionReplay.ts';
import { reconcileMission } from './missionReconciler.ts';
import { assertMissionWorkerFence, claimMissionForRecovery, heartbeatMissionWorker, releaseMissionWorker, type MissionWorkerLease } from './missionWorkerSupervisor.ts';
import type { AutonomousMission, AutonomousTask } from '../src/tools/autonomousMissionEngine.ts';

export type RecoveryAction = 'NO_ACTION' | 'RESUME_READY' | 'WAITING_APPROVAL' | 'FAILED' | 'BLOCKED';
export interface RecoveryCandidate {
  missionId: string;
  previousStatus: string;
  action: RecoveryAction;
  reason: string;
  currentTaskId?: string;
  progress: number;
  evidence: string[];
}
export interface RecoverySweepReport {
  startedAt: string;
  completedAt: string;
  scanned: number;
  resumed: number;
  blocked: number;
  candidates: RecoveryCandidate[];
}

const DATA_ROOT = path.resolve(process.env.CODEVOICE_DURABLE_ROOT || path.join(process.cwd(), '.codevoice-data'));
const missionIdSafe = (value: string) => { const x = String(value || '').trim(); if (!x || x.length > 128 || !/^[a-zA-Z0-9._:-]+$/.test(x)) throw new Error('INVALID_MISSION_ID'); return x; };

async function listMissionIds(limit = 500) {
  const dir = path.join(DATA_ROOT, 'mission');
  try {
    const names = await fs.readdir(dir);
    return names.filter(n => n.endsWith('.json')).slice(-Math.min(Math.max(limit, 1), 500)).map(n => n.slice(0, -5));
  } catch (error: any) { if (error?.code === 'ENOENT') return []; throw error; }
}

const resumable = new Set(['RUNNING', 'RECOVERING', 'VALIDATING', 'ANALYZING', 'PLANNING']);

export async function inspectMissionRecovery(missionId: string): Promise<RecoveryCandidate> {
  const id = missionIdSafe(missionId);
  const record = await loadDurableRecord<AutonomousMission>('mission', id);
  if (!record) return { missionId: id, previousStatus: 'MISSING', action: 'BLOCKED', reason: 'MISSION_NOT_FOUND', progress: 0, evidence: [] };
  const mission = record.payload;
  const verification = await verifyMissionEventJournal(id);
  if (!verification.valid) return { missionId: id, previousStatus: mission.status, action: 'BLOCKED', reason: `JOURNAL_${verification.firstFailure?.reason || 'INTEGRITY_FAILED'}`, progress: mission.progress || 0, evidence: [`sequence:${verification.firstFailure?.sequence || 0}`] };
  if (!resumable.has(mission.status)) {
    const action: RecoveryAction = mission.status === 'WAITING_APPROVAL' ? 'WAITING_APPROVAL' : 'NO_ACTION';
    return { missionId: id, previousStatus: mission.status, action, reason: `STATUS_${mission.status}`, progress: mission.progress || 0, currentTaskId: mission.currentTaskId, evidence: [`journalEvents:${verification.count}`] };
  }
  const replay = await replayMission(id);
  const currentTask = replay.currentTaskId || mission.currentTaskId;
  return { missionId: id, previousStatus: mission.status, action: replay.blockingEvents.length ? 'BLOCKED' : 'RESUME_READY', reason: replay.blockingEvents.length ? 'REPLAY_HAS_BLOCKERS' : 'DURABLE_STATE_RECONSTRUCTED', progress: replay.progress, currentTaskId: currentTask, evidence: [`journalEvents:${replay.eventCount}`, `lastSequence:${replay.lastSequence}`, `hash:${replay.lastHash || 'none'}`] };
}

export async function resumeMissionFromDurableState(missionId: string): Promise<{ candidate: RecoveryCandidate; mission?: AutonomousMission }> {
  const candidate = await inspectMissionRecovery(missionId);
  if (candidate.action !== 'RESUME_READY') return { candidate };
  const record = await loadDurableRecord<AutonomousMission>('mission', missionIdSafe(missionId));
  if (!record) return { candidate: { ...candidate, action: 'BLOCKED', reason: 'MISSION_NOT_FOUND_AFTER_INSPECTION' } };
  const replay = await replayMission(missionId);
  const mission = record.payload;
  mission.status = 'RUNNING';
  mission.progress = replay.progress;
  mission.currentTaskId = replay.currentTaskId;
  mission.updatedAt = new Date().toISOString();
  mission.context = mission.context || { objective: mission.goal, relevantFiles: [], budget: 16000, used: 0, summaries: [] };
  mission.context.summaries = [...mission.context.summaries, `Durable recovery resumed at sequence ${replay.lastSequence}`].slice(-20);
  const updated = await saveDurableRecord('mission', mission.missionId, mission, record.version);
  await appendMissionEvent({ eventId: `recovery-resume:${mission.missionId}:${replay.lastSequence}`, missionId: mission.missionId, type: 'MISSION_RESUMED_FROM_DURABLE_STATE', timestamp: new Date().toISOString(), status: 'RUNNING', taskId: mission.currentTaskId, summary: 'Mission resumed from verified durable state', evidence: candidate.evidence });
  return { candidate: { ...candidate, previousStatus: mission.status }, mission: updated.payload as AutonomousMission };
}

export interface FencedRecoveryResult {
  candidate: RecoveryCandidate;
  mission?: AutonomousMission;
  lease?: MissionWorkerLease;
  released: boolean;
}

/**
 * Resume a durable mission only while an exclusive, currently valid worker fence is held.
 * This is the server-side handoff point between recovery orchestration and an actual worker.
 */
export async function resumeMissionWithWorkerLease(missionId: string, workerId: string, leaseId: string): Promise<FencedRecoveryResult> {
  const id = missionIdSafe(missionId);
  await assertMissionWorkerFence(id, workerId, leaseId);
  const candidate = await inspectMissionRecovery(id);
  if (candidate.action !== 'RESUME_READY') return { candidate, released: false };

  await heartbeatMissionWorker(id, workerId, 30000, leaseId);
  await assertMissionWorkerFence(id, workerId, leaseId);

  const record = await loadDurableRecord<AutonomousMission>('mission', id);
  if (!record) return { candidate: { ...candidate, action: 'BLOCKED', reason: 'MISSION_NOT_FOUND_AFTER_FENCE' }, released: false };
  const replay = await replayMission(id);
  const mission = record.payload;
  mission.status = 'RUNNING';
  mission.progress = replay.progress;
  mission.currentTaskId = replay.currentTaskId;
  mission.updatedAt = new Date().toISOString();
  mission.context = mission.context || { objective: mission.goal, relevantFiles: [], budget: 16000, used: 0, summaries: [] };
  mission.context.summaries = [...mission.context.summaries, `Fenced recovery resumed at sequence ${replay.lastSequence}`].slice(-20);

  // Fence immediately before the durable mutation. A stale worker must not commit recovery state.
  await assertMissionWorkerFence(id, workerId, leaseId);
  const updated = await saveDurableRecord('mission', id, mission, record.version);
  await appendMissionEvent({
    eventId: `fenced-recovery-resume:${id}:${replay.lastSequence}:${leaseId}`,
    missionId: id,
    type: 'MISSION_RESUMED_FROM_DURABLE_STATE',
    timestamp: new Date().toISOString(),
    status: 'RUNNING',
    taskId: mission.currentTaskId,
    summary: 'Mission resumed under an exclusive worker fence',
    evidence: [...candidate.evidence, `worker:${workerId}`, `lease:${leaseId}`],
  });
  return { candidate: { ...candidate, previousStatus: mission.status }, mission: updated.payload as AutonomousMission, released: false };
}

/**
 * Acquire an exclusive recovery worker, perform the fenced durable handoff, and release it.
 * The lease is never released before the mission state transition has been durably recorded.
 */
export async function recoverMissionWithWorker(missionId: string, workerId: string, ttlMs = 30000): Promise<FencedRecoveryResult> {
  const claim = await claimMissionForRecovery(missionId, workerId, ttlMs);
  if (!claim.claimed || !claim.lease) {
    return { candidate: claim.recovery || await inspectMissionRecovery(missionId), released: false };
  }
  const lease = claim.lease;
  try {
    return { ...(await resumeMissionWithWorkerLease(missionId, workerId, lease.leaseId)), lease };
  } finally {
    await releaseMissionWorker(missionId, workerId).catch(() => undefined);
  }
}

export async function recoverMissionAfterRestart(missionId: string) {
  const candidate = await inspectMissionRecovery(missionId);
  if (candidate.action === 'RESUME_READY') return resumeMissionFromDurableState(missionId);
  return { candidate };
}

export async function recoverAllMissions(limit = 500): Promise<RecoverySweepReport> {
  const startedAt = new Date().toISOString();
  const ids = await listMissionIds(limit);
  const candidates: RecoveryCandidate[] = [];
  for (const id of ids) {
    try {
      const candidate = await inspectMissionRecovery(id);
      if (candidate.action === 'RESUME_READY') {
        const reconciled = await reconcileMission(id).catch(() => undefined);
        const resumed = await resumeMissionFromDurableState(id);
        candidates.push({ ...resumed.candidate, evidence: [...resumed.candidate.evidence, ...(reconciled ? ['reconciliation:completed'] : ['reconciliation:unavailable'])] });
      } else candidates.push(candidate);
    } catch (error) {
      candidates.push({ missionId: id, previousStatus: 'UNKNOWN', action: 'FAILED', reason: error instanceof Error ? error.message : String(error), progress: 0, evidence: [] });
    }
  }
  return { startedAt, completedAt: new Date().toISOString(), scanned: ids.length, resumed: candidates.filter(c => c.action === 'RESUME_READY').length, blocked: candidates.filter(c => c.action === 'BLOCKED').length, candidates };
}
