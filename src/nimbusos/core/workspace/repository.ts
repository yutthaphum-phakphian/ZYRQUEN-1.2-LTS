import {
  WorkspaceAlreadyExistsError,
  WorkspaceNotFoundError,
  WorkspaceStorageError,
} from "../errors";
import type { Workspace } from "../types";
import { validateWorkspace } from "./domain";

export interface WorkspaceRepository {
  create(workspace: Workspace): Promise<Workspace>;
  get(workspaceId: string): Promise<Workspace | null>;
  list(): Promise<Workspace[]>;
  save(workspace: Workspace): Promise<Workspace>;
  delete(workspaceId: string): Promise<void>;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class InMemoryWorkspaceRepository implements WorkspaceRepository {
  private readonly workspaces = new Map<string, Workspace>();

  async create(workspace: Workspace): Promise<Workspace> {
    const validated = validateWorkspace(workspace);
    if (this.workspaces.has(validated.id))
      throw new WorkspaceAlreadyExistsError(validated.id);
    this.workspaces.set(validated.id, clone(validated));
    return clone(validated);
  }

  async get(workspaceId: string): Promise<Workspace | null> {
    const workspace = this.workspaces.get(workspaceId);
    return workspace ? clone(workspace) : null;
  }

  async list(): Promise<Workspace[]> {
    return Array.from(this.workspaces.values())
      .map(clone)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async save(workspace: Workspace): Promise<Workspace> {
    const validated = validateWorkspace(workspace);
    if (!this.workspaces.has(validated.id))
      throw new WorkspaceNotFoundError(validated.id);
    this.workspaces.set(validated.id, clone(validated));
    return clone(validated);
  }

  async delete(workspaceId: string): Promise<void> {
    if (!this.workspaces.delete(workspaceId))
      throw new WorkspaceNotFoundError(workspaceId);
  }
}

export class LocalStorageWorkspaceRepository implements WorkspaceRepository {
  constructor(
    private readonly storage: StorageLike,
    private readonly key = "nimbusos.workspace-core.v1"
  ) {}

  private loadMap(): Map<string, Workspace> {
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return new Map();
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed))
        throw new Error("stored Workspace data must be an array");
      const records = parsed.map(record => validateWorkspace(record));
      const entries = records.map(record => [record.id, record] as const);
      if (new Set(records.map(record => record.id)).size !== records.length)
        throw new Error("stored Workspace ids must be unique");
      return new Map(entries);
    } catch (error) {
      if (error instanceof WorkspaceStorageError) throw error;
      throw new WorkspaceStorageError(
        "Unable to read local Workspace storage.",
        { cause: error }
      );
    }
  }

  private persist(workspaces: Map<string, Workspace>): void {
    try {
      this.storage.setItem(
        this.key,
        JSON.stringify(Array.from(workspaces.values()))
      );
    } catch (error) {
      throw new WorkspaceStorageError(
        "Unable to write local Workspace storage.",
        { cause: error }
      );
    }
  }

  async create(workspace: Workspace): Promise<Workspace> {
    const validated = validateWorkspace(workspace);
    const records = this.loadMap();
    if (records.has(validated.id))
      throw new WorkspaceAlreadyExistsError(validated.id);
    records.set(validated.id, clone(validated));
    this.persist(records);
    return clone(validated);
  }

  async get(workspaceId: string): Promise<Workspace | null> {
    const workspace = this.loadMap().get(workspaceId);
    return workspace ? clone(workspace) : null;
  }

  async list(): Promise<Workspace[]> {
    return Array.from(this.loadMap().values())
      .map(clone)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async save(workspace: Workspace): Promise<Workspace> {
    const validated = validateWorkspace(workspace);
    const records = this.loadMap();
    if (!records.has(validated.id))
      throw new WorkspaceNotFoundError(validated.id);
    records.set(validated.id, clone(validated));
    this.persist(records);
    return clone(validated);
  }

  async delete(workspaceId: string): Promise<void> {
    const records = this.loadMap();
    if (!records.delete(workspaceId))
      throw new WorkspaceNotFoundError(workspaceId);
    this.persist(records);
  }
}
