import {
  ProvisioningCompensationError,
  ProvisioningError,
  StateTransitionError,
  ValidationError,
  WorkspaceNotFoundError,
} from "../errors";
import { LocalEventBus } from "../events/eventBus";
import { ResourceEngine } from "../resources/resourceEngine";
import { WorkspaceStateMachine } from "../lifecycle/stateMachine";
import { ZERO_RESOURCES } from "../resources/resourceEngine";
import type { RuntimeAdapter } from "../runtime/runtimeAdapter";
import type {
  ResourceQuantities,
  Workspace,
  WorkspaceError,
  WorkspaceStatus,
} from "../types";
import { createWorkspaceRecord } from "../workspace/domain";
import type { WorkspaceRepository } from "../workspace/repository";

export interface WorkspaceCreateInput {
  id: string;
  name: string;
  resources: Partial<ResourceQuantities>;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface WorkspaceInspection {
  workspace: Workspace;
  runtime: Awaited<ReturnType<RuntimeAdapter["inspect"]>>;
  resources: Awaited<ReturnType<ResourceEngine["inspect"]>>;
}

export class WorkspaceProvisioner {
  constructor(
    private readonly repository: WorkspaceRepository,
    private readonly stateMachine: WorkspaceStateMachine,
    private readonly resources: ResourceEngine,
    private readonly runtime: RuntimeAdapter,
    private readonly events: LocalEventBus,
    private readonly now: () => string = () => new Date().toISOString()
  ) {}

  async createWorkspace(
    input: WorkspaceCreateInput,
    commandId?: string
  ): Promise<Workspace> {
    const name = input.name.trim();
    if (!name || name.length > 80)
      throw new ValidationError("Workspace name must contain 1–80 characters.");
    if (!input.id.trim())
      throw new ValidationError("Workspace id is required.");
    const requested = this.resources.validate(input.resources);
    const timestamp = this.now();
    let workspace = createWorkspaceRecord({
      id: input.id,
      name,
      runtimeProvider: this.runtime.provider,
      requestedResources: requested,
      metadata: input.metadata,
      createdAt: timestamp,
    });
    workspace = await this.repository.create(workspace);
    this.events.emit("WORKSPACE_CREATED", workspace.id, {
      name: workspace.name,
    });

    let resourcesAllocated = false;
    try {
      workspace = await this.transitionAndSave(
        workspace,
        "INITIALIZING",
        commandId
      );
      const allocation = await this.resources.allocate(workspace.id, requested);
      resourcesAllocated = true;
      workspace = {
        ...workspace,
        resources: { requested, allocated: allocation },
        updatedAt: this.now(),
        lastActivityAt: this.now(),
      };
      await this.repository.save(workspace);
      this.events.emit("RESOURCE_ALLOCATED", workspace.id, {
        resources: allocation,
      });
      const handle = await this.runtime.create(workspace);
      workspace = {
        ...workspace,
        runtime: {
          provider: handle.provider,
          instanceId: handle.instanceId,
          availability: "AVAILABLE",
        },
        updatedAt: this.now(),
        lastActivityAt: this.now(),
      };
      workspace = await this.transitionAndSave(workspace, "READY", commandId);
      this.events.emit("WORKSPACE_READY", workspace.id, {
        runtimeProvider: handle.provider,
      });
      return workspace;
    } catch (error) {
      return this.compensateCreateFailure(
        workspace,
        requested,
        resourcesAllocated,
        error,
        commandId
      );
    }
  }

  async startWorkspace(
    workspaceId: string,
    commandId?: string
  ): Promise<Workspace> {
    let workspace = await this.requireWorkspace(workspaceId);
    workspace = await this.transitionAndSave(workspace, "STARTING", commandId);
    try {
      const handle = await this.runtime.start(workspace);
      workspace = {
        ...workspace,
        runtime: {
          provider: handle.provider,
          instanceId: handle.instanceId,
          availability: "AVAILABLE",
        },
        error: null,
      };
      workspace = await this.transitionAndSave(workspace, "RUNNING", commandId);
      this.events.emit("WORKSPACE_STARTED", workspaceId, {
        instanceId: handle.instanceId,
      });
      return workspace;
    } catch (error) {
      return this.persistFailure(workspace, error, commandId);
    }
  }

  async stopWorkspace(
    workspaceId: string,
    commandId?: string
  ): Promise<Workspace> {
    let workspace = await this.requireWorkspace(workspaceId);
    workspace = await this.transitionAndSave(workspace, "STOPPING", commandId);
    try {
      await this.runtime.stop(workspace);
      workspace = {
        ...workspace,
        runtime: { ...workspace.runtime, instanceId: null },
      };
      workspace = await this.transitionAndSave(workspace, "STOPPED", commandId);
      this.events.emit("WORKSPACE_STOPPED", workspaceId);
      return workspace;
    } catch (error) {
      return this.persistFailure(workspace, error, commandId);
    }
  }

  async restartWorkspace(
    workspaceId: string,
    commandId?: string
  ): Promise<Workspace> {
    let workspace = await this.requireWorkspace(workspaceId);
    const wasStopped = workspace.status === "STOPPED";
    workspace = await this.transitionAndSave(
      workspace,
      wasStopped ? "STARTING" : "RESTARTING",
      commandId
    );
    try {
      const handle = wasStopped
        ? await this.runtime.start(workspace)
        : await this.runtime.restart(workspace);
      workspace = {
        ...workspace,
        runtime: {
          provider: handle.provider,
          instanceId: handle.instanceId,
          availability: "AVAILABLE",
        },
        error: null,
      };
      workspace = await this.transitionAndSave(workspace, "RUNNING", commandId);
      this.events.emit("WORKSPACE_RESTARTED", workspaceId, {
        instanceId: handle.instanceId,
      });
      return workspace;
    } catch (error) {
      return this.persistFailure(workspace, error, commandId);
    }
  }

  async inspectWorkspace(workspaceId: string): Promise<WorkspaceInspection> {
    const workspace = await this.requireWorkspace(workspaceId);
    const [runtime, resources] = await Promise.all([
      this.runtime.inspect(workspace),
      this.resources.inspect(),
    ]);
    return { workspace, runtime, resources };
  }

  async destroyWorkspace(
    workspaceId: string,
    commandId?: string
  ): Promise<Workspace> {
    let workspace = await this.requireWorkspace(workspaceId);
    workspace = await this.transitionAndSave(
      workspace,
      "DESTROYING",
      commandId
    );
    try {
      if (workspace.runtime.instanceId) {
        await this.runtime.destroy(workspace);
        workspace = {
          ...workspace,
          runtime: { ...workspace.runtime, instanceId: null },
        };
      }
      const released = await this.resources.release(workspaceId, async () => {
        const releaseSnapshot: Workspace = {
          ...workspace,
          resources: {
            ...workspace.resources,
            allocated: { ...ZERO_RESOURCES },
          },
        };
        await this.repository.save(releaseSnapshot);
        workspace = releaseSnapshot;
      });
      if (Object.values(released).some(amount => amount > 0)) {
        this.events.emit("RESOURCE_RELEASED", workspaceId, {
          resources: released,
          reason: "workspace-destroyed",
        });
      }
      const destroyed = this.stateMachine.transition(
        workspace,
        "DESTROYED",
        this.now()
      );
      await this.repository.delete(workspaceId);
      this.emitTransition(workspace.status, destroyed, commandId);
      this.events.emit("WORKSPACE_DESTROYED", workspaceId, {
        name: destroyed.name,
      });
      return destroyed;
    } catch (error) {
      return this.persistFailure(workspace, error, commandId);
    }
  }

  private async transitionAndSave(
    workspace: Workspace,
    to: WorkspaceStatus,
    commandId?: string
  ): Promise<Workspace> {
    const transitioned = this.stateMachine.transition(
      workspace,
      to,
      this.now()
    );
    await this.repository.save(transitioned);
    this.emitTransition(workspace.status, transitioned, commandId);
    return transitioned;
  }

  private emitTransition(
    fromStatus: WorkspaceStatus,
    to: Workspace,
    commandId?: string
  ): void {
    this.events.emit(
      "STATE_TRANSITIONED",
      to.id,
      {
        fromStatus,
        toStatus: to.status,
        workspaceName: to.name,
        commandId: commandId ?? null,
      },
      to.updatedAt
    );
  }

  private async compensateCreateFailure(
    workspace: Workspace,
    requested: ResourceQuantities,
    resourcesAllocated: boolean,
    primaryError: unknown,
    commandId?: string
  ): Promise<never> {
    const previousStatus = workspace.status;
    const compensationErrors: unknown[] = [];
    let runtimeClean = workspace.runtime.instanceId === null;

    if (!runtimeClean) {
      try {
        await this.runtime.destroy(workspace);
        workspace = {
          ...workspace,
          runtime: { ...workspace.runtime, instanceId: null },
        };
        runtimeClean = true;
      } catch (error) {
        compensationErrors.push(error);
      }
    }

    let failure = compensationErrors.length
      ? new ProvisioningCompensationError(primaryError, compensationErrors)
      : primaryError;
    const canReleaseResources = resourcesAllocated && runtimeClean;
    const failedSnapshot = this.failWorkspace(
      {
        ...workspace,
        resources: canReleaseResources
          ? { requested, allocated: { ...ZERO_RESOURCES } }
          : workspace.resources,
      },
      failure
    );

    if (canReleaseResources) {
      try {
        const released = await this.resources.release(
          workspace.id,
          async () => {
            await this.repository.save(failedSnapshot);
          }
        );
        this.events.emit("RESOURCE_RELEASED", workspace.id, {
          resources: released,
          reason: "provisioning-failed",
        });
      } catch (error) {
        compensationErrors.push(error);
        failure = new ProvisioningCompensationError(
          primaryError,
          compensationErrors
        );
        const retainedSnapshot = this.failWorkspace(workspace, failure);
        try {
          await this.repository.save(retainedSnapshot);
        } catch (storageError) {
          throw new ProvisioningError(
            "Provisioning cleanup failed and its details could not be persisted; reserved resources were retained.",
            { cause: storageError }
          );
        }
        this.emitTransition(previousStatus, retainedSnapshot, commandId);
        this.emitWorkspaceError(retainedSnapshot, commandId);
        throw failure;
      }
      this.emitTransition(previousStatus, failedSnapshot, commandId);
      this.emitWorkspaceError(failedSnapshot, commandId);
      throw failure;
    }

    try {
      await this.repository.save(failedSnapshot);
    } catch (storageError) {
      throw new ProvisioningError(
        "Workspace provisioning failed and its error state could not be persisted; resource reservations were retained.",
        { cause: storageError }
      );
    }
    this.emitTransition(previousStatus, failedSnapshot, commandId);
    this.emitWorkspaceError(failedSnapshot, commandId);
    throw failure;
  }

  private emitWorkspaceError(workspace: Workspace, commandId?: string): void {
    this.events.emit("WORKSPACE_ERROR", workspace.id, {
      code: workspace.error?.code,
      message: workspace.error?.message,
      commandId: commandId ?? null,
    });
  }

  private async requireWorkspace(workspaceId: string): Promise<Workspace> {
    const workspace = await this.repository.get(workspaceId);
    if (!workspace) throw new WorkspaceNotFoundError(workspaceId);
    return workspace;
  }

  private failWorkspace(workspace: Workspace, error: unknown): Workspace {
    const cause = error instanceof Error ? error : new Error(String(error));
    let failed = workspace;
    if (failed.status !== "ERROR") {
      if (!this.stateMachine.canTransition(failed.status, "ERROR")) {
        throw new StateTransitionError(failed.status, "ERROR");
      }
      failed = this.stateMachine.transition(failed, "ERROR", this.now());
    }
    const coded = error as { code?: unknown };
    const code =
      typeof coded?.code === "string" ? coded.code : "PROVISIONING_ERROR";
    return {
      ...failed,
      error: {
        code,
        message: cause.message,
        occurredAt: this.now(),
      } satisfies WorkspaceError,
      runtime: {
        ...failed.runtime,
        availability:
          code === "NOT_CONFIGURED" ||
          code === "UNAVAILABLE" ||
          code === "UNSUPPORTED"
            ? code
            : failed.runtime.availability,
      },
    };
  }

  private async persistFailure(
    workspace: Workspace,
    error: unknown,
    commandId?: string
  ): Promise<never> {
    const previousStatus = workspace.status;
    const failed = this.failWorkspace(workspace, error);
    await this.repository.save(failed);
    this.emitTransition(previousStatus, failed, commandId);
    this.emitWorkspaceError(failed, commandId);
    throw error;
  }
}
