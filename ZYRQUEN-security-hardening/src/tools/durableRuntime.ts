import { AutonomousMission } from './autonomousMissionEngine';
import { CodeFile, ProjectContext } from '../types';

export interface DurableWorkspacePayload {
  projectId: string;
  version?: number;
  updatedAt?: string;
  files: CodeFile[];
  metadata?: Record<string, unknown>;
  integrityHash?: string;
}

const projectKey = (context: ProjectContext) => context.id || context.projectName || context.name || 'default';

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || `DURABLE_HTTP_${response.status}`);
  return body as T;
}

export async function saveDurableWorkspace(context: ProjectContext) {
  let version = 1;
  try { version = (await loadDurableWorkspace(context)).workspace.version ?? 1; } catch { /* first save */ }
  return request<{ status: string; workspace: DurableWorkspacePayload }>('/api/durable/workspace/save', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId: projectKey(context), version, updatedAt: new Date().toISOString(), files: context.files, metadata: { projectName: context.projectName || context.name, framework: context.framework } }),
  });
}

export async function loadDurableWorkspace(context: ProjectContext) {
  return request<{ status: string; workspace: DurableWorkspacePayload }>(`/api/durable/workspace/${encodeURIComponent(projectKey(context))}`);
}

export async function saveDurableMission(mission: AutonomousMission) {
  let version = 1;
  try { const existing = await loadDurableMission(mission.missionId); version = existing.record.version; } catch { /* first save */ }
  return request<{ status: string; record: unknown }>(`/api/durable/record/mission/${encodeURIComponent(mission.missionId)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version, payload: mission }),
  });
}

export async function loadDurableMission(missionId: string) {
  return request<{ status: string; record: { version: number; payload: AutonomousMission } }>(`/api/durable/record/mission/${encodeURIComponent(missionId)}`);
}


export async function syncDurableMissionEvents(mission: AutonomousMission) {
  const events = Array.isArray(mission.events) ? mission.events : [];
  for (const event of events) {
    await request('/api/durable/event', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: event.id, missionId: mission.missionId, type: event.type, timestamp: event.timestamp, taskId: event.taskId, summary: event.summary, status: event.status, evidence: event.evidence }),
    });
  }
  return { synced: events.length };
}

export async function loadDurableMissionEvents(missionId: string, limit = 500) {
  return request<{ status: string; events: Array<{ eventId: string; missionId: string; type: string; timestamp: string; taskId?: string; summary: string; status?: string; evidence?: string[] }> }>(`/api/durable/events/${encodeURIComponent(missionId)}?limit=${encodeURIComponent(String(limit))}`);
}

export async function acquireDurableResourceLock(resource: string, owner: string, ttlMs = 30000) {
  return request<{ status: string; lock: unknown }>(`/api/durable/lock/${encodeURIComponent(resource)}/acquire`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ owner, ttlMs }) });
}

export async function releaseDurableResourceLock(resource: string, owner: string) {
  return request<{ status: string }>(`/api/durable/lock/${encodeURIComponent(resource)}/release`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ owner }) });
}

export async function verifyDurableMissionEvents(missionId: string) {
  return request<{ status: string; verification: { missionId: string; valid: boolean; legacyEvents: number; count: number; firstFailure?: { sequence: number; reason: string }; lastHash?: string } }>(`/api/durable/events/${encodeURIComponent(missionId)}/verify`);
}

export async function detectDurableMissionRecovery(missionId: string) {
  return request<{ status: string; verification: unknown; record: unknown }>('/api/durable/recovery/detect', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ missionId }),
  });
}

export async function loadDurableRecoveryRecords(limit = 100) {
  return request<{ status: string; records: unknown[] }>(`/api/durable/recovery?limit=${encodeURIComponent(String(limit))}`);
}

export interface MissionTransactionClient {
  transactionId: string;
  missionId: string;
  idempotencyKey: string;
  status: 'PREPARED' | 'COMMITTED' | 'ABORTED';
  createdAt: string;
  updatedAt: string;
  operations: Array<{ id: string; type: string; target: string; expected?: string; metadata?: Record<string, unknown> }>;
  commitEvidence?: string[];
  abortReason?: string;
}

export async function prepareDurableMissionTransaction(input: {
  missionId: string;
  idempotencyKey: string;
  operations: MissionTransactionClient['operations'];
}) {
  return request<{ status: string; transaction: MissionTransactionClient; reused: boolean }>('/api/durable/transaction/prepare', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  });
}

export async function getDurableMissionTransaction(transactionId: string) {
  return request<{ status: string; record: { payload: MissionTransactionClient } }>(`/api/durable/transaction/${encodeURIComponent(transactionId)}`);
}

export async function commitDurableMissionTransaction(transactionId: string, evidence: string[] = []) {
  return request<{ status: string; transaction: MissionTransactionClient; reused: boolean }>(`/api/durable/transaction/${encodeURIComponent(transactionId)}/commit`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ evidence }),
  });
}

export async function abortDurableMissionTransaction(transactionId: string, reason: string) {
  return request<{ status: string; transaction: MissionTransactionClient; reused: boolean }>(`/api/durable/transaction/${encodeURIComponent(transactionId)}/abort`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }),
  });
}

export async function recoverDurableMissionTransaction(transactionId: string, reason = 'RECOVERY_REQUIRED') {
  return request<{ status: string; transaction: MissionTransactionClient; action: string; recovery?: unknown }>(`/api/durable/transaction/${encodeURIComponent(transactionId)}/recover`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }),
  });
}

export async function applyDurableWorkspaceTransaction(input: { transactionId: string; projectId: string; files: Array<{ id?: string; type: 'CREATE'|'UPDATE'|'DELETE'; target: string; content?: string; language?: string; expectedHash?: string }> }) {
  return request('/api/durable/transaction/' + encodeURIComponent(input.transactionId) + '/workspace/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
}

export async function recoverDurableWorkspaceTransaction(transactionId: string) {
  return request('/api/durable/transaction/' + encodeURIComponent(transactionId) + '/workspace/recover', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
}

export async function reconcileDurableMissions(limit = 500) {
  return request<{ status: string; report: unknown }>(`/api/durable/recovery/reconcile?limit=${encodeURIComponent(String(limit))}`, { method: 'POST' });
}

export async function reconcileDurableMission(missionId: string) {
  return request<{ status: string; result: unknown }>(`/api/durable/recovery/reconcile/${encodeURIComponent(missionId)}`, { method: 'POST' });
}

export async function replayDurableMission(missionId: string, limit = 2000) {
  return request<{ status: string; replay: unknown }>(`/api/durable/replay/${encodeURIComponent(missionId)}?limit=${encodeURIComponent(String(limit))}`);
}

export async function replayDurableMissionRange(missionId: string, fromSequence = 1, toSequence = 2000) {
  return request<{ status: string; events: unknown[] }>(`/api/durable/replay/${encodeURIComponent(missionId)}/range?from=${encodeURIComponent(String(fromSequence))}&to=${encodeURIComponent(String(toSequence))}`);
}

export async function inspectDurableMissionRecovery(missionId: string) {
  return request<{ status: string; candidate: unknown }>(`/api/durable/recovery/mission/${encodeURIComponent(missionId)}`);
}

export async function resumeDurableMission(missionId: string) {
  return request<{ status: string; candidate: unknown; mission?: AutonomousMission }>(`/api/durable/recovery/mission/${encodeURIComponent(missionId)}/resume`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
}

export async function restartRecoverDurableMission(missionId: string) {
  return request<{ status: string; candidate: unknown; mission?: AutonomousMission }>(`/api/durable/recovery/mission/${encodeURIComponent(missionId)}/restart`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
}

export async function autoRecoverDurableMissions(limit = 500) {
  return request<{ status: string; report: unknown }>('/api/durable/recovery/auto', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit }) });
}

export async function acquireMissionWorkerLease(missionId: string, workerId: string, ttlMs = 30000) {
  return request<{ status: string; lease: unknown }>(`/api/durable/worker/${encodeURIComponent(missionId)}/acquire`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workerId, ttlMs }) });
}
export async function heartbeatMissionWorkerLease(missionId: string, workerId: string, ttlMs = 30000) {
  return request<{ status: string; lease: unknown }>(`/api/durable/worker/${encodeURIComponent(missionId)}/heartbeat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workerId, ttlMs }) });
}
export async function releaseMissionWorkerLease(missionId: string, workerId: string) {
  return request<{ status: string; released: boolean; lease?: unknown }>(`/api/durable/worker/${encodeURIComponent(missionId)}/release`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workerId }) });
}
export async function inspectMissionWorkerLease(missionId: string) {
  return request<{ status: string; worker?: unknown; lease?: unknown }>(`/api/durable/worker/${encodeURIComponent(missionId)}`);
}
export async function claimMissionRecoveryWorker(missionId: string, workerId: string, ttlMs = 30000) {
  return request<{ status: string; claimed: boolean; lease?: unknown; recovery?: unknown }>(`/api/durable/worker/${encodeURIComponent(missionId)}/recovery-claim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workerId, ttlMs }) });
}
export async function superviseDurableMission(missionId: string) {
  return request<{ status: string; supervisor: unknown }>(`/api/durable/supervisor/${encodeURIComponent(missionId)}`);
}
