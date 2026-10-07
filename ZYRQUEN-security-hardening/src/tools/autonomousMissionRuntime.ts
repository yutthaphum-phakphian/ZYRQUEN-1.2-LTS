import type { ProjectContext } from '../types/index';

export type AutonomousMissionStatus =
  | 'CREATED'
  | 'READY'
  | 'RUNNING'
  | 'PAUSED'
  | 'ANALYZING'
  | 'PLANNING'
  | 'VALIDATING'
  | 'RECOVERING'
  | 'WAITING_APPROVAL'
  | 'WAITING_USER'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type AutonomousTaskStatus =
  | 'PENDING'
  | 'READY'
  | 'RUNNING'
  | 'WAITING_APPROVAL'
  | 'WAITING_USER'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface MissionTaskFailure {
  code: string;
  message: string;
  failureClass?: string;
  recoverable?: boolean;
  evidence?: string[];
  taskId?: string;
  missionId?: string;
  recoveryAction?: string;
}

export interface MissionTaskResult {
  success: boolean;
  requiresApproval?: boolean;
  output?: Record<string, unknown>;
  error?: MissionTaskFailure | string;
  evidence?: string[];
}

export interface AutonomousTask {
  taskId: string;
  type: string;
  title: string;
  description: string;
  dependencies: string[];
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  status: AutonomousTaskStatus;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  error?: MissionTaskFailure;
  retryCount: number;
  maxRetries: number;
  affectedFiles: string[];
  validationCriteria: string[];
  parallelSafe: boolean;
  startedAt?: string;
  completedAt?: string;
}

export interface AutonomousMissionContext {
  objective: string;
  projectId?: string;
  relevantFiles: ProjectContext['files'];
  files?: ProjectContext['files'];
  budget: number;
  used: number;
  summaries: string[];
}

export interface AutonomousMissionEvent {
  id: string;
  eventId: string;
  type: string;
  timestamp: string;
  status?: AutonomousMissionStatus | string;
  taskId?: string;
  summary: string;
  evidence: string[];
}

export interface AutonomousMission {
  missionId: string;
  executionId: string;
  goal: string;
  status: AutonomousMissionStatus;
  tasks: AutonomousTask[];
  currentTaskId?: string;
  progress: number;
  context: AutonomousMissionContext;
  checkpoints: unknown[];
  snapshots: unknown[];
  errors: MissionTaskFailure[];
  recoveryAttempts: number;
  maxRecoveryAttempts: number;
  events: AutonomousMissionEvent[];
  createdAt: string;
  updatedAt: string;
  result?: unknown;
}

export interface AutonomousMissionAdapter {
  executeTask(task: AutonomousTask, mission: AutonomousMission): Promise<MissionTaskResult>;
  createSnapshot?(mission: AutonomousMission, task: AutonomousTask): Promise<unknown>;
  createCheckpoint?(mission: AutonomousMission, task: AutonomousTask): Promise<unknown>;
  observe?(mission: AutonomousMission, task: AutonomousTask, result: MissionTaskResult): Promise<MissionTaskResult | void>;
}

export interface AutonomousMissionStep {
  mission: AutonomousMission;
  executed: boolean;
  taskId?: string;
}

const iso = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

function addEvent(mission: AutonomousMission, type: string, summary: string, evidence: string[], taskId?: string) {
  const eventId = id('mission-event');
  mission.events.push({
    id: eventId,
    eventId,
    type,
    timestamp: iso(),
    status: mission.status,
    summary,
    evidence,
    ...(taskId ? { taskId } : {}),
  });
  mission.updatedAt = iso();
}

function planTasks(goal: string): AutonomousTask[] {
  const normalized = goal.toLowerCase();
  const types: Array<{ type: string; title: string; parallelSafe?: boolean }> = [
    { type: 'ANALYZE', title: 'Analyze the objective' },
    { type: 'PLAN', title: 'Prepare a dependency-aware plan' },
    { type: 'READ', title: 'Inspect project context', parallelSafe: true },
    { type: 'SEARCH', title: 'Search relevant project context', parallelSafe: true },
  ];

  if (/\b(create|build|implement|modify|update|fix)\b|созда|สร้าง|แก้/.test(normalized)) {
    types.push({ type: 'CODE', title: 'Prepare the requested change' });
  }
  if (/\btest(s|ing)?\b|ทดสอบ|รันทดสอบ/.test(normalized)) {
    types.push({ type: 'RUN_TEST', title: 'Run the requested tests' });
  }
  if (/\bbuild\b|production build|สร้าง build/.test(normalized)) {
    types.push({ type: 'RUN_BUILD', title: 'Build the project' });
  }
  if (!types.some(({ type }) => type === 'RUN_TEST' || type === 'RUN_BUILD')) {
    types.push({ type: 'VALIDATE', title: 'Validate the project state' });
  }
  types.push({ type: 'SUMMARIZE', title: 'Summarize verified results' });

  return types.map((item, index) => ({
    taskId: id('task'),
    type: item.type,
    title: item.title,
    description: `${item.title}: ${goal}`,
    dependencies: [],
    priority: 'NORMAL',
    status: index === 0 ? 'READY' : 'PENDING',
    inputs: { goal },
    retryCount: 0,
    maxRetries: 2,
    affectedFiles: [],
    validationCriteria: [],
    parallelSafe: item.parallelSafe === true,
  }));
}

function normalizeError(error: MissionTaskResult['error']): MissionTaskFailure {
  if (typeof error === 'string') return { code: 'TASK_FAILED', message: error };
  return error || { code: 'TASK_FAILED', message: 'Task execution failed' };
}

function readyTasks(mission: AutonomousMission) {
  const completed = new Set(mission.tasks.filter((task) => task.status === 'COMPLETED').map((task) => task.taskId));
  return mission.tasks.filter((task) =>
    (task.status === 'READY' || task.status === 'PENDING')
    && task.dependencies.every((dependency) => completed.has(dependency)),
  );
}

function updateProgress(mission: AutonomousMission) {
  mission.progress = mission.tasks.length
    ? Math.round(mission.tasks.filter((task) => task.status === 'COMPLETED').length / mission.tasks.length * 100)
    : 100;
}

async function executeTasks(
  mission: AutonomousMission,
  tasks: AutonomousTask[],
  adapter: AutonomousMissionAdapter,
): Promise<void> {
  mission.status = 'RUNNING';
  const startedAt = iso();
  for (const task of tasks) {
    task.status = 'RUNNING';
    task.startedAt = startedAt;
    mission.currentTaskId = task.taskId;
  }
  addEvent(mission, 'TASKS_STARTED', `Started ${tasks.length} task(s)`, tasks.map((task) => task.type), tasks[0]?.taskId);

  const results = await Promise.all(tasks.map(async (task) => {
    const snapshot = await adapter.createSnapshot?.(mission, task);
    const checkpoint = await adapter.createCheckpoint?.(mission, task);
    if (snapshot !== undefined) mission.snapshots.push(snapshot);
    if (checkpoint !== undefined) mission.checkpoints.push(checkpoint);
    const result = await adapter.executeTask(task, mission);
    const observed = await adapter.observe?.(mission, task, result);
    return { task, result: observed || result };
  }));

  for (const { task, result } of results) {
    if (result.requiresApproval) {
      task.status = 'WAITING_APPROVAL';
      task.error = normalizeError(result.error);
      mission.status = 'WAITING_APPROVAL';
      addEvent(mission, 'TASK_WAITING_APPROVAL', 'Task is waiting for explicit approval', result.evidence || [], task.taskId);
      continue;
    }
    if (result.success) {
      task.status = 'COMPLETED';
      task.outputs = result.output;
      task.error = undefined;
      task.completedAt = iso();
      addEvent(mission, 'TASK_COMPLETED', 'Task completed with recorded evidence', result.evidence || [], task.taskId);
      continue;
    }

    const error = normalizeError(result.error);
    task.error = error;
    mission.errors.push(error);
    if (error.recoverable && task.retryCount < task.maxRetries && mission.recoveryAttempts < mission.maxRecoveryAttempts) {
      task.retryCount += 1;
      task.status = 'READY';
      mission.recoveryAttempts += 1;
      mission.status = 'RUNNING';
      addEvent(mission, 'RECOVERY_STARTED', 'Retrying a recoverable task within configured limits', result.evidence || [error.code], task.taskId);
    } else {
      task.status = 'FAILED';
      mission.status = 'FAILED';
      addEvent(mission, 'TASK_FAILED', error.message, result.evidence || [error.code], task.taskId);
    }
  }

  updateProgress(mission);
  if (mission.status !== 'FAILED' && mission.status !== 'WAITING_APPROVAL') {
    if (mission.tasks.every((task) => task.status === 'COMPLETED')) {
      mission.status = 'COMPLETED';
      mission.result = { progress: mission.progress };
      addEvent(mission, 'MISSION_COMPLETED', 'All mission tasks completed', ['progress:100']);
    } else {
      mission.status = 'RUNNING';
    }
  }
}

export function createAutonomousMission(goal: string, context: ProjectContext): AutonomousMission {
  const objective = String(goal || '').trim();
  if (!objective || objective.length > 4000) throw new Error('INVALID_MISSION_GOAL');
  const missionId = id('mission');
  const projectFiles = Array.isArray(context?.files) ? context.files.slice(0, 200) : [];
  const now = iso();
  const tasks = planTasks(objective);
  tasks.forEach((task, index) => {
    task.dependencies = index === 0 ? [] : [tasks[index - 1].taskId];
  });
  const mission: AutonomousMission = {
    missionId,
    executionId: id('execution'),
    goal: objective,
    status: 'CREATED',
    tasks,
    progress: 0,
    context: {
      objective,
      projectId: context?.projectId || context?.id || missionId,
      relevantFiles: projectFiles,
      files: projectFiles,
      budget: 16000,
      used: 0,
      summaries: [],
    },
    checkpoints: [],
    snapshots: [],
    errors: [],
    recoveryAttempts: 0,
    maxRecoveryAttempts: 3,
    events: [],
    createdAt: now,
    updatedAt: now,
  };
  addEvent(mission, 'MISSION_CREATED', 'Mission created from the requested objective', ['objective captured']);
  return mission;
}

export async function runAutonomousMissionStep(
  mission: AutonomousMission,
  adapter: AutonomousMissionAdapter,
): Promise<AutonomousMissionStep> {
  if (['COMPLETED', 'FAILED', 'CANCELLED', 'PAUSED', 'WAITING_APPROVAL', 'WAITING_USER'].includes(mission.status)) {
    return { mission, executed: false };
  }
  const ready = readyTasks(mission);
  if (!ready.length) {
    if (mission.tasks.every((task) => task.status === 'COMPLETED')) {
      mission.status = 'COMPLETED';
      mission.progress = 100;
      addEvent(mission, 'MISSION_COMPLETED', 'All mission tasks completed', ['progress:100']);
    } else if (mission.tasks.some((task) => task.status === 'WAITING_APPROVAL')) {
      mission.status = 'WAITING_APPROVAL';
    } else {
      mission.status = 'WAITING_USER';
      addEvent(mission, 'MISSION_BLOCKED', 'No runnable task is available', ['dependency or task-state blocker']);
    }
    return { mission, executed: false };
  }

  const batch = ready[0].parallelSafe
    ? ready.filter((task) => task.parallelSafe && !['CREATE', 'UPDATE', 'DELETE', 'RENAME', 'CODE', 'FIX'].includes(task.type))
    : [ready[0]];
  const selected = batch.length ? batch : [ready[0]];
  await executeTasks(mission, selected, adapter);
  return { mission, executed: true, taskId: selected[0].taskId };
}

export async function runAutonomousMission(
  mission: AutonomousMission,
  adapter: AutonomousMissionAdapter,
  options: { maxSteps?: number } = {},
): Promise<AutonomousMission> {
  const maxSteps = Math.max(1, Math.min(1000, Math.floor(options.maxSteps || mission.tasks.length * 4 || 1)));
  for (let step = 0; step < maxSteps; step += 1) {
    if (mission.status === 'PAUSED') return mission;
    if (mission.status !== 'CREATED' && mission.status !== 'READY' && mission.status !== 'RUNNING' && mission.status !== 'RECOVERING') break;
    const result = await runAutonomousMissionStep(mission, adapter);
    if (!result.executed) break;
  }
  if (mission.status === 'RUNNING' && mission.tasks.some((task) => task.status !== 'COMPLETED')) {
    mission.status = 'FAILED';
    addEvent(mission, 'MISSION_FAILED', 'Mission exceeded its bounded execution step limit', ['execution limit reached']);
  }
  return mission;
}

export function pauseMission(mission: AutonomousMission): AutonomousMission {
  if (!['COMPLETED', 'FAILED', 'CANCELLED'].includes(mission.status)) {
    mission.status = 'PAUSED';
    addEvent(mission, 'MISSION_PAUSED', 'Mission paused by request', ['user pause']);
  }
  return mission;
}

export function resumeMission(mission: AutonomousMission): AutonomousMission {
  if (mission.status === 'PAUSED' || mission.status === 'CREATED' || mission.status === 'READY') {
    mission.status = 'RUNNING';
    addEvent(mission, 'MISSION_RESUMED', 'Mission resumed', ['resume requested']);
  }
  return mission;
}
