import type { ResourceEngine } from "../resources/resourceEngine";
import type { WorkspaceRepository } from "./repository";
import type { ResourceCapacity, Workspace, WorkspaceStatus } from "../types";

export interface WorkspaceCounts extends Record<WorkspaceStatus, number> {
  total: number;
}

export interface WorkspaceOverview {
  workspaces: Workspace[];
  counts: WorkspaceCounts;
  resources: ResourceCapacity[];
  observedAt: string;
  storage: "LOCAL_DEVELOPMENT_STORAGE";
}

export class WorkspaceOverviewQuery {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly resourceEngine: ResourceEngine,
    private readonly now: () => string = () => new Date().toISOString()
  ) {}

  async execute(): Promise<WorkspaceOverview> {
    const [workspaces, resources] = await Promise.all([
      this.repository.list(),
      this.resourceEngine.inspect(),
    ]);
    const counts: WorkspaceCounts = {
      total: 0,
      CREATING: 0,
      INITIALIZING: 0,
      READY: 0,
      STARTING: 0,
      RUNNING: 0,
      STOPPING: 0,
      STOPPED: 0,
      RESTARTING: 0,
      DESTROYING: 0,
      DESTROYED: 0,
      ERROR: 0,
    };
    for (const workspace of workspaces) counts[workspace.status] += 1;
    counts.total = workspaces.filter(
      workspace => workspace.status !== "DESTROYED"
    ).length;
    return {
      workspaces,
      counts,
      resources,
      observedAt: this.now(),
      storage: "LOCAL_DEVELOPMENT_STORAGE",
    };
  }
}
