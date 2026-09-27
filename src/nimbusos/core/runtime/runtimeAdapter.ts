import type {
  RuntimeCapabilities,
  RuntimeHandle,
  RuntimeInspection,
  Workspace,
} from "../types";

export interface RuntimeAdapter {
  readonly provider: string;
  capabilities(): RuntimeCapabilities;
  create(workspace: Workspace): Promise<RuntimeHandle>;
  start(workspace: Workspace): Promise<RuntimeHandle>;
  stop(workspace: Workspace): Promise<void>;
  restart(workspace: Workspace): Promise<RuntimeHandle>;
  inspect(workspace: Workspace): Promise<RuntimeInspection>;
  destroy(workspace: Workspace): Promise<void>;
}
