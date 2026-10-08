import { listMissionEvents, verifyMissionEventJournal, type DurableEvent } from './durableStore.ts';

export type ReplayTaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'WAITING_APPROVAL' | 'CANCELLED' | 'BLOCKED' | 'UNKNOWN';

export interface ReplayTaskState {
  taskId: string;
  status: ReplayTaskStatus;
  startedAt?: string;
  completedAt?: string;
  lastEventSequence: number;
  lastEventType: string;
  summaries: string[];
}

export interface MissionReplayState {
  missionId: string;
  valid: boolean;
  eventCount: number;
  lastSequence: number;
  lastHash?: string;
  missionStatus: string;
  progress: number;
  currentTaskId?: string;
  tasks: ReplayTaskState[];
  completedTasks: number;
  failedTasks: number;
  blockingEvents: string[];
  replayedAt: string;
}

const safeMissionId = (value: string) => {
  const id = String(value || '').trim();
  if (!id || id.length > 128 || !/^[a-zA-Z0-9._:-]+$/.test(id)) throw new Error('INVALID_MISSION_ID');
  return id;
};

function applyTaskEvent(tasks: Map<string, ReplayTaskState>, event: DurableEvent) {
  if (!event.taskId) return;
  const existing = tasks.get(event.taskId) || { taskId: event.taskId, status: 'PENDING' as ReplayTaskStatus, lastEventSequence: 0, lastEventType: '', summaries: [] };
  existing.lastEventSequence = Number(event.sequence || existing.lastEventSequence);
  existing.lastEventType = event.type;
  if (event.summary) existing.summaries = [...existing.summaries, event.summary].slice(-5);
  switch (event.type) {
    case 'TASK_STARTED': existing.status = 'RUNNING'; existing.startedAt = event.timestamp; break;
    case 'TASK_COMPLETED': existing.status = 'COMPLETED'; existing.completedAt = event.timestamp; break;
    case 'TASK_FAILED': existing.status = 'FAILED'; break;
    case 'APPROVAL_REQUESTED': existing.status = 'WAITING_APPROVAL'; break;
    case 'TASK_CANCELLED': existing.status = 'CANCELLED'; break;
    case 'TASK_BLOCKED': existing.status = 'BLOCKED'; break;
    case 'RECOVERY_STARTED': if (existing.status === 'FAILED') existing.status = 'RUNNING'; break;
  }
  tasks.set(event.taskId, existing);
}

export async function replayMission(missionId: string, limit = 2000): Promise<MissionReplayState> {
  const id = safeMissionId(missionId);
  const verification = await verifyMissionEventJournal(id);
  if (!verification.valid) {
    return {
      missionId: id, valid: false, eventCount: verification.count, lastSequence: Math.max(0, verification.count), lastHash: verification.lastHash,
      missionStatus: 'RECOVERY_BLOCKED', progress: 0, tasks: [], completedTasks: 0, failedTasks: 0,
      blockingEvents: [`JOURNAL_${verification.firstFailure?.reason || 'INTEGRITY_FAILED'}@${verification.firstFailure?.sequence || 0}`], replayedAt: new Date().toISOString(),
    };
  }
  const events = await listMissionEvents(id, limit);
  const tasks = new Map<string, ReplayTaskState>();
  let missionStatus = events.length ? 'UNKNOWN' : 'CREATED';
  let currentTaskId: string | undefined;
  const blockingEvents: string[] = [];
  for (const event of events) {
    if (event.taskId) applyTaskEvent(tasks, event);
    currentTaskId = event.taskId || currentTaskId;
    if (/^MISSION_/.test(event.type)) missionStatus = event.status || event.type.replace(/^MISSION_/, '');
    if (event.type === 'MISSION_COMPLETED') missionStatus = 'COMPLETED';
    if (event.type === 'MISSION_FAILED') missionStatus = 'FAILED';
    if (event.type === 'MISSION_CANCELLED') missionStatus = 'CANCELLED';
    if (event.type === 'MISSION_PAUSED') missionStatus = 'PAUSED';
    if (event.type === 'MISSION_RESUMED') missionStatus = 'RUNNING';
    if (event.type === 'APPROVAL_REQUESTED') missionStatus = 'WAITING_APPROVAL';
    if (event.status === 'BLOCKED' || event.type === 'MISSION_RECONCILIATION_BLOCKED') blockingEvents.push(`${event.type}@${event.sequence || 0}`);
  }
  const taskList = [...tasks.values()].sort((a, b) => a.lastEventSequence - b.lastEventSequence);
  const completedTasks = taskList.filter(t => t.status === 'COMPLETED').length;
  const failedTasks = taskList.filter(t => t.status === 'FAILED' || t.status === 'BLOCKED').length;
  const progress = taskList.length ? Math.round(completedTasks / taskList.length * 100) : (missionStatus === 'COMPLETED' ? 100 : 0);
  return { missionId: id, valid: true, eventCount: verification.count, lastSequence: verification.count, lastHash: verification.lastHash, missionStatus, progress, currentTaskId, tasks: taskList, completedTasks, failedTasks, blockingEvents, replayedAt: new Date().toISOString() };
}

export async function replayMissionRange(missionId: string, fromSequence = 1, toSequence = 2000) {
  const id = safeMissionId(missionId);
  const verification = await verifyMissionEventJournal(id);
  if (!verification.valid) throw new Error(`EVENT_JOURNAL_INTEGRITY_FAILED:${verification.firstFailure?.reason || 'UNKNOWN'}`);
  const events = await listMissionEvents(id, 2000);
  return events.filter(e => Number(e.sequence || 0) >= Math.max(1, fromSequence) && Number(e.sequence || 0) <= Math.max(fromSequence, toSequence));
}
