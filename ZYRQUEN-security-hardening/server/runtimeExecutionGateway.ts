import { appendMissionEvent, loadDurableRecord, saveDurableRecord } from './durableStore.ts';
import { enqueueMission, type MissionQueuePriority } from './missionQueueScheduler.ts';
import { createAutonomousMission, type AutonomousMission } from '../src/tools/autonomousMissionEngine.ts';
import type { ProjectContext } from '../src/types/index.ts';
import { runtimeControlPlane } from './runtimeControlPlane.ts';

export interface RuntimeDispatchRequest {
  goal: string;
  context?: ProjectContext;
  priority?: MissionQueuePriority;
  maxAttempts?: number;
  autoStart?: boolean;
}

export interface RuntimeDispatchResult {
  mission: AutonomousMission;
  queue: Awaited<ReturnType<typeof enqueueMission>>;
  runtime: Awaited<ReturnType<typeof runtimeControlPlane.snapshot>>;
}

function normalizeContext(context?: ProjectContext): ProjectContext {
  const files = Array.isArray(context?.files) ? context!.files : [];
  return {
    files: files.slice(0, 200).map((file) => ({
      name: String(file.name || '').replace(/\\/g, '/'),
      content: String(file.content ?? '').slice(0, 5 * 1024 * 1024),
      language: file.language,
    })),
    id: String(context?.projectId || context?.id || 'runtime-dispatch').slice(0, 128),
    description: context?.description || '',
    framework: context?.framework || 'unknown',
  };
}

export class RuntimeExecutionGateway {
  async dispatch(request: RuntimeDispatchRequest): Promise<RuntimeDispatchResult> {
    const goal = String(request.goal || '').trim();
    if (!goal || goal.length > 4000) throw new Error('INVALID_RUNTIME_GOAL');
    const mission = createAutonomousMission(goal, normalizeContext(request.context));
    await saveDurableRecord('mission', mission.missionId, mission);
    await appendMissionEvent({
      eventId: `runtime-dispatch:${mission.missionId}`,
      missionId: mission.missionId,
      type: 'RUNTIME_DISPATCH_ACCEPTED',
      timestamp: new Date().toISOString(),
      status: mission.status,
      summary: 'Runtime execution gateway accepted a mission and persisted it durably',
      evidence: ['runtime-execution-gateway', `tasks:${mission.tasks.length}`],
    });
    const queue = await enqueueMission(mission.missionId, request.priority || 'NORMAL', request.maxAttempts || 3);
    if (request.autoStart !== false) await runtimeControlPlane.start();
    const runtime = await runtimeControlPlane.tick();
    return { mission, queue, runtime };
  }

  async inspect(missionId: string) {
    const id = String(missionId || '').trim();
    if (!id) throw new Error('INVALID_MISSION_ID');
    const mission = await loadDurableRecord<AutonomousMission>('mission', id);
    if (!mission) throw new Error('MISSION_NOT_FOUND');
    return { mission: mission.payload, runtime: await runtimeControlPlane.snapshot() };
  }

  async tick() {
    return runtimeControlPlane.tick();
  }

  async stop() {
    return runtimeControlPlane.stop();
  }
}

export const runtimeExecutionGateway = new RuntimeExecutionGateway();
