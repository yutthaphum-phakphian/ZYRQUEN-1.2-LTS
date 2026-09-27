import { StateTransitionError, ValidationError } from "../errors";
import {
  WORKSPACE_STATUSES,
  type Workspace,
  type WorkspaceStatus,
} from "../types";
import { validateWorkspace } from "../workspace/domain";

const TRANSITIONS: Record<WorkspaceStatus, readonly WorkspaceStatus[]> = {
  CREATING: ["INITIALIZING", "ERROR"],
  INITIALIZING: ["READY", "ERROR"],
  READY: ["STARTING", "DESTROYING", "ERROR"],
  STARTING: ["RUNNING", "ERROR"],
  RUNNING: ["STOPPING", "RESTARTING", "DESTROYING", "ERROR"],
  STOPPING: ["STOPPED", "ERROR"],
  STOPPED: ["STARTING", "DESTROYING", "ERROR"],
  RESTARTING: ["RUNNING", "ERROR"],
  DESTROYING: ["DESTROYED", "ERROR"],
  DESTROYED: [],
  ERROR: ["DESTROYING"],
};

function isWorkspaceStatus(value: unknown): value is WorkspaceStatus {
  return (
    typeof value === "string" &&
    WORKSPACE_STATUSES.includes(value as WorkspaceStatus)
  );
}

export class WorkspaceStateMachine {
  canTransition(from: WorkspaceStatus, to: WorkspaceStatus): boolean {
    return isWorkspaceStatus(from) && isWorkspaceStatus(to)
      ? TRANSITIONS[from].includes(to)
      : false;
  }

  allowedTransitions(from: WorkspaceStatus): readonly WorkspaceStatus[] {
    if (!isWorkspaceStatus(from)) {
      throw new ValidationError(
        `Unknown Workspace lifecycle state '${String(from)}'.`
      );
    }
    return Object.freeze([...TRANSITIONS[from]]);
  }

  transition(
    workspace: Workspace,
    to: WorkspaceStatus,
    at = new Date().toISOString()
  ): Workspace {
    const current = validateWorkspace(workspace);
    if (!isWorkspaceStatus(to)) {
      throw new ValidationError(
        `Unknown Workspace lifecycle state '${String(to)}'.`
      );
    }
    if (!this.canTransition(current.status, to)) {
      throw new StateTransitionError(current.status, to);
    }
    if (typeof at !== "string" || !Number.isFinite(Date.parse(at))) {
      throw new ValidationError(
        "Lifecycle transition timestamp must be valid."
      );
    }
    const transitionTime = Date.parse(at);
    if (
      transitionTime <
      Math.max(
        Date.parse(current.updatedAt),
        Date.parse(current.lastActivityAt)
      )
    ) {
      throw new ValidationError(
        "Lifecycle transition timestamp cannot precede current Workspace activity."
      );
    }

    return validateWorkspace({
      ...current,
      status: to,
      updatedAt: at,
      lastActivityAt: at,
    });
  }
}
