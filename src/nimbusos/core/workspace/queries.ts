import { validateWorkspace } from "./domain";
import type { WorkspaceRepository } from "./repository";
import type { Workspace } from "../types";

export class WorkspaceQueries {
  constructor(private readonly repository: WorkspaceRepository) {}

  async get(workspaceId: string): Promise<Workspace | null> {
    const workspace = await this.repository.get(workspaceId);
    return workspace ? validateWorkspace(workspace) : null;
  }

  async list(): Promise<Workspace[]> {
    const workspaces = await this.repository.list();
    return workspaces.map(validateWorkspace);
  }
}
