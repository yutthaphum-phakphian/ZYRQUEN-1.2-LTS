// @vitest-environment node
import { describe, expect, it } from "vitest";
import { WorkspaceLock } from "./commands/workspaceLock";
import {
  DEFAULT_CONFIGURATION,
  validateConfiguration,
} from "./configuration/config";
import {
  CommandIdConflictError,
  ConfigurationError,
  ResourceUnavailableError,
  StateTransitionError,
  ValidationError,
  WorkspaceAlreadyExistsError,
  WorkspaceNotFoundError,
  WorkspaceStorageError,
} from "./errors";
import { LocalEventBus } from "./events/eventBus";
import { WorkspaceStateMachine } from "./lifecycle/stateMachine";
import { ResourceEngine, ZERO_RESOURCES } from "./resources/resourceEngine";
import type { RuntimeAdapter } from "./runtime/runtimeAdapter";
import { LocalRuntimeAdapter } from "../infrastructure/local-runtime/LocalRuntimeAdapter";
import {
  WORKSPACE_STATUSES,
  type RuntimeCapabilities,
  type RuntimeHandle,
  type RuntimeInspection,
  type ResourceQuantities,
  type Workspace,
  type WorkspaceStatus,
} from "./types";
import { WorkspaceOverviewQuery } from "./workspace/overview";
import {
  InMemoryWorkspaceRepository,
  LocalStorageWorkspaceRepository,
  type StorageLike,
  type WorkspaceRepository,
} from "./workspace/repository";
import { createWorkspacePlatform } from "./platform";
import {
  createWorkspaceRecord,
  workspaceNeedsCleanup,
} from "./workspace/domain";

const NOW = "2026-09-27T00:00:00.000Z";
let idCounter = 0;
const nextId = () => `test-id-${++idCounter}`;
const now = () => NOW;

function createTestRuntime(
  overrides: Partial<RuntimeAdapter> = {}
): RuntimeAdapter {
  let runtimeCounter = 0;
  return {
    provider: "local-test-fixture",
    capabilities(): RuntimeCapabilities {
      return {
        provider: "local-test-fixture",
        availability: "AVAILABLE",
        execution: "NONE",
        supports: {
          create: true,
          start: true,
          stop: true,
          restart: true,
          inspect: true,
          destroy: true,
        },
        hostProcess: false,
        hostFilesystem: false,
        hostTelemetry: false,
        arbitraryUserCode: false,
        message: "Test fixture only.",
      };
    },
    async create(): Promise<RuntimeHandle> {
      return {
        provider: "local-test-fixture",
        instanceId: `runtime-${++runtimeCounter}`,
      };
    },
    async start(): Promise<RuntimeHandle> {
      return {
        provider: "local-test-fixture",
        instanceId: `runtime-${++runtimeCounter}`,
      };
    },
    async stop(): Promise<void> {},
    async restart(): Promise<RuntimeHandle> {
      return {
        provider: "local-test-fixture",
        instanceId: `runtime-${++runtimeCounter}`,
      };
    },
    async inspect(workspace): Promise<RuntimeInspection> {
      return {
        availability: "AVAILABLE",
        observedAt: NOW,
        instanceId: workspace.runtime.instanceId,
        message: "Test fixture only.",
      };
    },
    async destroy(): Promise<void> {},
    ...overrides,
  };
}

function createPlatform(
  runtime = createTestRuntime(),
  dependencies: {
    repository?: WorkspaceRepository;
    resourceEngine?: ResourceEngine;
  } = {}
) {
  idCounter = 0;
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.clear();
  }
  const repository =
    dependencies.repository ?? new InMemoryWorkspaceRepository();
  const platform = createWorkspacePlatform({
    repository,
    runtime,
    resourceEngine: dependencies.resourceEngine,
    createId: nextId,
    now,
  });
  return platform;
}

async function createReadyWorkspace(
  platform: ReturnType<typeof createPlatform>,
  id = "ws-1"
) {
  await platform.ready;
  const result = await platform.commands.execute({
    commandId: `create-${id}`,
    workspaceId: id,
    commandType: "CREATE_WORKSPACE",
    payload: { name: `Workspace ${id}`, resources: { CPU: 1, MEMORY: 512 } },
  });
  expect(result.status).toBe("SUCCEEDED");
  return platform.workspaces.get(id);
}

function workspace(
  status: Workspace["status"] = "READY",
  id = "ws-1"
): Workspace {
  return {
    id,
    name: `Workspace ${id}`,
    status,
    runtime: {
      provider: "local",
      instanceId: null,
      availability: "NOT_CONFIGURED",
    },
    resources: {
      requested: { ...ZERO_RESOURCES },
      allocated: { ...ZERO_RESOURCES },
    },
    createdAt: NOW,
    updatedAt: NOW,
    lastActivityAt: NOW,
    metadata: {},
    error: null,
  };
}

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}

class FaultInjectingWorkspaceRepository implements WorkspaceRepository {
  private failStatus: WorkspaceStatus | null = null;
  private saveFailurePredicate: ((workspace: Workspace) => boolean) | null =
    null;
  private failDeletes = 0;

  constructor(private readonly delegate: WorkspaceRepository) {}

  failNextSaveFor(status: WorkspaceStatus) {
    this.failStatus = status;
  }

  failNextSaveWhen(predicate: (workspace: Workspace) => boolean) {
    this.saveFailurePredicate = predicate;
  }

  failNextDelete() {
    this.failDeletes += 1;
  }

  create(workspace: Workspace) {
    return this.delegate.create(workspace);
  }

  get(workspaceId: string) {
    return this.delegate.get(workspaceId);
  }

  list() {
    return this.delegate.list();
  }

  save(workspace: Workspace) {
    if (
      this.failStatus === workspace.status ||
      this.saveFailurePredicate?.(workspace)
    ) {
      this.failStatus = null;
      this.saveFailurePredicate = null;
      throw new WorkspaceStorageError(
        `fixture save failed for ${workspace.status}`
      );
    }
    return this.delegate.save(workspace);
  }

  delete(workspaceId: string) {
    if (this.failDeletes > 0) {
      this.failDeletes -= 1;
      throw new WorkspaceStorageError("fixture delete failure");
    }
    return this.delegate.delete(workspaceId);
  }
}

class OrderedResourceEngine extends ResourceEngine {
  constructor(private readonly operations: string[]) {
    super(DEFAULT_CONFIGURATION);
  }

  override release(
    workspaceId: string,
    beforeCommit?: (released: ResourceQuantities) => void | Promise<void>
  ) {
    this.operations.push("quota-release");
    return super.release(workspaceId, beforeCommit);
  }
}

class DeferredListWorkspaceRepository implements WorkspaceRepository {
  private releaseGate!: () => void;
  private markStarted!: () => void;
  private readonly gate = new Promise<void>(resolve => {
    this.releaseGate = resolve;
  });
  readonly listStarted = new Promise<void>(resolve => {
    this.markStarted = resolve;
  });

  constructor(private readonly delegate: WorkspaceRepository) {}

  releaseList() {
    this.releaseGate();
  }

  create(workspace: Workspace) {
    return this.delegate.create(workspace);
  }

  get(workspaceId: string) {
    return this.delegate.get(workspaceId);
  }

  async list() {
    this.markStarted();
    await this.gate;
    return this.delegate.list();
  }

  save(workspace: Workspace) {
    return this.delegate.save(workspace);
  }

  delete(workspaceId: string) {
    return this.delegate.delete(workspaceId);
  }
}

describe("Workspace State Machine", () => {
  const machine = new WorkspaceStateMachine();

  it("allows only declared transitions and does not mutate the input record", () => {
    const original = workspace("CREATING");
    const transitioned = machine.transition(original, "INITIALIZING", NOW);
    expect(transitioned.status).toBe("INITIALIZING");
    expect(original.status).toBe("CREATING");
    expect(transitioned.updatedAt).toBe(NOW);
    expect(machine.canTransition("READY", "STARTING")).toBe(true);
    expect(machine.canTransition("READY", "RUNNING")).toBe(false);
  });

  it("rejects invalid transitions and protects DESTROYED as a terminal state", () => {
    expect(() => machine.transition(workspace("READY"), "RUNNING")).toThrow(
      StateTransitionError
    );
    expect(machine.allowedTransitions("DESTROYED")).toEqual([]);
    expect(() => machine.transition(workspace("DESTROYED"), "READY")).toThrow(
      StateTransitionError
    );
  });

  it("allows the explicit error-to-destroy recovery path", () => {
    expect(
      machine.transition(workspace("ERROR"), "DESTROYING", NOW).status
    ).toBe("DESTROYING");
  });

  it("matches the explicit transition table for every state pair", () => {
    const expected: Record<Workspace["status"], Workspace["status"][]> = {
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

    for (const from of WORKSPACE_STATUSES) {
      const allowed = machine.allowedTransitions(from);
      expect([...allowed]).toEqual(expected[from]);
      expect(Object.isFrozen(allowed)).toBe(true);
      for (const to of WORKSPACE_STATUSES) {
        expect(machine.canTransition(from, to)).toBe(
          expected[from].includes(to)
        );
      }
    }
  });

  it("rejects malformed states, lifecycle records, and transition timestamps", () => {
    expect(() =>
      machine.allowedTransitions("UNKNOWN" as Workspace["status"])
    ).toThrow(ValidationError);
    expect(() =>
      machine.transition(
        { ...workspace(), status: "UNKNOWN" as Workspace["status"] },
        "STARTING"
      )
    ).toThrow(ValidationError);
    expect(() =>
      machine.transition(workspace("READY"), "STARTING", "not-a-date")
    ).toThrow(ValidationError);
    expect(() =>
      machine.transition(
        workspace("READY"),
        "STARTING",
        "2026-09-26T23:59:59.000Z"
      )
    ).toThrow(ValidationError);
    expect(
      machine.canTransition("UNKNOWN" as Workspace["status"], "READY")
    ).toBe(false);
    const activeAfterUpdate = {
      ...workspace("READY"),
      lastActivityAt: "2026-09-27T00:00:01.000Z",
    };
    expect(() =>
      machine.transition(activeAfterUpdate, "STARTING", NOW)
    ).toThrow(ValidationError);
  });

  it("returns a detached snapshot and advances both activity timestamps", () => {
    const original = workspace("READY");
    original.metadata.owner = "core";
    original.resources.requested.CPU = 1;
    const changed = machine.transition(original, "STARTING", NOW);

    changed.metadata.owner = "mutated";
    changed.resources.requested.CPU = 99;
    expect(original.status).toBe("READY");
    expect(original.metadata.owner).toBe("core");
    expect(original.resources.requested.CPU).toBe(1);
    expect(changed.updatedAt).toBe(NOW);
    expect(changed.lastActivityAt).toBe(NOW);
  });
});

describe("Workspace repositories", () => {
  it("supports create, retrieve, update, delete and defensive copies", async () => {
    const repository = new InMemoryWorkspaceRepository();
    const original = workspace();
    await repository.create(original);
    original.metadata.changed = true;
    expect(
      (await repository.get(original.id))?.metadata.changed
    ).toBeUndefined();
    const updated = {
      ...(await repository.get(original.id))!,
      name: "Updated",
    };
    await repository.save(updated);
    expect((await repository.list())[0].name).toBe("Updated");
    await repository.delete(original.id);
    expect(await repository.get(original.id)).toBeNull();
    await expect(repository.delete(original.id)).rejects.toThrow(
      WorkspaceNotFoundError
    );
  });

  it("rejects duplicate ids and missing updates", async () => {
    const repository = new InMemoryWorkspaceRepository();
    await repository.create(workspace());
    await expect(repository.create(workspace())).rejects.toThrow(
      WorkspaceAlreadyExistsError
    );
    await expect(
      repository.save(workspace("READY", "missing"))
    ).rejects.toThrow(WorkspaceNotFoundError);
  });

  it("persists through a local storage adapter and can be reconstructed", async () => {
    const storage = new MemoryStorage();
    const first = new LocalStorageWorkspaceRepository(
      storage,
      "test.workspaces"
    );
    await first.create(workspace());
    const second = new LocalStorageWorkspaceRepository(
      storage,
      "test.workspaces"
    );
    expect((await second.get("ws-1"))?.status).toBe("READY");
    await second.delete("ws-1");
    expect(await first.list()).toEqual([]);
  });
});

describe("Per-Workspace lock", () => {
  it("serializes operations for one Workspace but does not block another", async () => {
    const lock = new WorkspaceLock();
    let release!: () => void;
    const blocked = new Promise<void>(resolve => {
      release = resolve;
    });
    const order: string[] = [];
    const first = lock.runExclusive("a", async () => {
      order.push("a-start");
      await blocked;
      order.push("a-end");
    });
    const second = lock.runExclusive("a", () => {
      order.push("a-second");
    });
    const independent = lock.runExclusive("b", () => {
      order.push("b");
    });
    await independent;
    await Promise.resolve();
    expect(order).toEqual(["a-start", "b"]);
    expect(lock.isLocked("a")).toBe(true);
    release();
    await Promise.all([first, second]);
    expect(order).toEqual(["a-start", "b", "a-end", "a-second"]);
    expect(lock.isLocked("a")).toBe(false);
  });

  it("releases the lock after a failure", async () => {
    const lock = new WorkspaceLock();
    await expect(
      lock.runExclusive("a", () => {
        throw new Error("fixture failure");
      })
    ).rejects.toThrow("fixture failure");
    expect(lock.isLocked("a")).toBe(false);
    await expect(lock.runExclusive("a", () => "reacquired")).resolves.toBe(
      "reacquired"
    );
  });
});

describe("Resource and quota engine", () => {
  it("allocates, inspects actual reservations, and releases resources", async () => {
    const engine = new ResourceEngine(DEFAULT_CONFIGURATION);
    const allocation = await engine.allocate("ws-1", { CPU: 1, MEMORY: 512 });
    expect(allocation.CPU).toBe(1);
    const capacity = await engine.inspect();
    expect(capacity.find(resource => resource.kind === "CPU")).toMatchObject({
      requested: 1,
      allocated: 1,
      used: null,
      available: 3,
      limit: 4,
      usageState: "UNAVAILABLE",
    });
    expect(await engine.release("ws-1")).toEqual(allocation);
    expect(
      (await engine.inspect()).find(resource => resource.kind === "CPU")
        ?.allocated
    ).toBe(0);
  });

  it("rejects quota violations and malformed resource requests", async () => {
    const engine = new ResourceEngine(DEFAULT_CONFIGURATION);
    await engine.allocate("ws-1", { CPU: 3.5 });
    await expect(engine.allocate("ws-2", { CPU: 1 })).rejects.toThrow(
      ResourceUnavailableError
    );
    expect(() => engine.validate({ MEMORY: -1 })).toThrow(ValidationError);
  });

  it("serializes simultaneous allocations so the configured limit cannot be oversubscribed", async () => {
    const engine = new ResourceEngine(DEFAULT_CONFIGURATION);
    const results = await Promise.allSettled([
      engine.allocate("ws-a", { CPU: 3 }),
      engine.allocate("ws-b", { CPU: 3 }),
    ]);
    expect(
      results.filter(result => result.status === "fulfilled")
    ).toHaveLength(1);
    expect(results.filter(result => result.status === "rejected")).toHaveLength(
      1
    );
  });

  it("retains reservations if the pre-release commit fails", async () => {
    const engine = new ResourceEngine(DEFAULT_CONFIGURATION);
    await engine.allocate("ws-release-commit", { CPU: 1 });
    await expect(
      engine.release("ws-release-commit", () => {
        throw new Error("fixture commit failed");
      })
    ).rejects.toThrow("fixture commit failed");
    expect(
      (await engine.inspect()).find(resource => resource.kind === "CPU")
        ?.allocated
    ).toBe(1);
    expect(await engine.release("ws-release-commit")).toMatchObject({ CPU: 1 });
    expect(
      (await engine.inspect()).find(resource => resource.kind === "CPU")
        ?.allocated
    ).toBe(0);
  });

  it("serializes new allocations behind an asynchronous release commit", async () => {
    const engine = new ResourceEngine(DEFAULT_CONFIGURATION);
    await engine.allocate("release-first", { CPU: 3 });
    let finishCommit!: () => void;
    const commitGate = new Promise<void>(resolve => {
      finishCommit = resolve;
    });
    const release = engine.release("release-first", async () => commitGate);
    let allocationSettled = false;
    const allocation = engine
      .allocate("allocate-next", { CPU: 2 })
      .then(value => {
        allocationSettled = true;
        return value;
      });
    await Promise.resolve();
    expect(allocationSettled).toBe(false);
    expect(
      (await engine.inspect()).find(resource => resource.kind === "CPU")
        ?.allocated
    ).toBe(3);

    finishCommit();
    await expect(release).resolves.toMatchObject({ CPU: 3 });
    await expect(allocation).resolves.toMatchObject({ CPU: 2 });
    expect(
      (await engine.inspect()).find(resource => resource.kind === "CPU")
        ?.allocated
    ).toBe(2);
  });

  it("rejects malformed duplicate restores atomically and unknown quota kinds", async () => {
    const engine = new ResourceEngine(DEFAULT_CONFIGURATION);
    await engine.allocate("existing", { CPU: 1 });
    expect(() => engine.validate({ GPU: 1 } as never)).toThrow(ValidationError);

    const duplicate = [
      { workspaceId: "duplicate", resources: { ...ZERO_RESOURCES, CPU: 1 } },
      { workspaceId: "duplicate", resources: { ...ZERO_RESOURCES, CPU: 1 } },
    ];
    await expect(engine.restore(duplicate)).rejects.toThrow(ValidationError);
    await expect(
      engine.restore([
        {
          workspaceId: "missing-kind",
          resources: { CPU: 1 } as ResourceQuantities,
        },
      ])
    ).rejects.toThrow(ValidationError);
    await expect(
      engine.restore([
        {
          workspaceId: "unknown-kind",
          resources: { ...ZERO_RESOURCES, GPU: 1 } as never,
        },
      ])
    ).rejects.toThrow(ValidationError);
    expect(
      (await engine.inspect()).find(resource => resource.kind === "CPU")
        ?.allocated
    ).toBe(1);
  });
});

describe("Local Runtime Adapter boundary", () => {
  it("reports disabled configuration without inventing process or host telemetry", async () => {
    const adapter = new LocalRuntimeAdapter(false);
    expect(adapter.capabilities()).toMatchObject({
      availability: "NOT_CONFIGURED",
      execution: "NONE",
      hostProcess: false,
      hostFilesystem: false,
      hostTelemetry: false,
      arbitraryUserCode: false,
    });
    const inspection = await adapter.inspect(workspace());
    expect(inspection.availability).toBe("NOT_CONFIGURED");
    expect(inspection.message).toContain("configuration");
    await expect(adapter.create(workspace())).rejects.toMatchObject({
      code: "NOT_CONFIGURED",
    });
  });

  it("reports unsupported Browser Worker capability honestly", () => {
    const adapter = new LocalRuntimeAdapter(true, {
      supported: false,
      create: () => {
        throw new Error("should not create when unsupported");
      },
    });
    expect(adapter.capabilities()).toMatchObject({
      availability: "UNAVAILABLE",
      execution: "NONE",
      supports: { create: false, inspect: true, destroy: false },
    });
  });

  it("controls a fixed browser Worker lifecycle and disposes its object URL", async () => {
    const fakeWorker = {
      onmessage: null as ((event: MessageEvent) => void) | null,
      onerror: null as ((event: ErrorEvent) => void) | null,
      state: "READY",
      terminated: false,
      postMessage(message: { requestId: string; operation: string }) {
        if (message.operation === "start" || message.operation === "restart")
          this.state = "RUNNING";
        if (message.operation === "stop") this.state = "STOPPED";
        if (message.operation === "destroy") this.state = "DESTROYED";
        queueMicrotask(() =>
          this.onmessage?.({
            data: { requestId: message.requestId, state: this.state },
          } as MessageEvent)
        );
      },
      terminate() {
        this.terminated = true;
      },
    };
    let disposed = 0;
    const adapter = new LocalRuntimeAdapter(
      true,
      {
        supported: true,
        create: () => ({ worker: fakeWorker, dispose: () => disposed++ }),
      },
      now,
      () => "worker-test"
    );

    expect(adapter.capabilities()).toMatchObject({
      availability: "AVAILABLE",
      execution: "BROWSER_WEB_WORKER",
      supports: { create: true, inspect: true, destroy: true },
      hostProcess: false,
      hostFilesystem: false,
      hostTelemetry: false,
      arbitraryUserCode: false,
    });
    const created = await adapter.create(workspace());
    expect(created.instanceId).toBe("worker-test");
    expect((await adapter.inspect(workspace())).message).toContain("READY");
    await adapter.start(workspace());
    expect((await adapter.inspect(workspace())).message).toContain("RUNNING");
    await adapter.stop(workspace());
    expect((await adapter.inspect(workspace())).message).toContain("STOPPED");
    await adapter.restart(workspace());
    expect((await adapter.inspect(workspace())).message).toContain("RUNNING");
    await adapter.destroy(workspace());
    expect(fakeWorker.terminated).toBe(true);
    expect(disposed).toBe(1);
  });
});

describe("Command Engine and Provisioner", () => {
  it("executes create/start/stop/restart/inspect/destroy through the command boundary", async () => {
    const platform = createPlatform();
    await platform.ready;
    const created = await platform.commands.execute({
      workspaceId: "ws-flow",
      commandType: "CREATE_WORKSPACE",
      payload: { name: "Flow", resources: { CPU: 0.5 } },
    });
    expect(created.status).toBe("SUCCEEDED");
    expect((created.result as Workspace).status).toBe("READY");
    expect(
      (
        await platform.commands.execute({
          workspaceId: "ws-flow",
          commandType: "START_WORKSPACE",
        })
      ).status
    ).toBe("SUCCEEDED");
    expect((await platform.workspaces.get("ws-flow"))?.status).toBe("RUNNING");
    expect(
      (
        await platform.commands.execute({
          workspaceId: "ws-flow",
          commandType: "STOP_WORKSPACE",
        })
      ).status
    ).toBe("SUCCEEDED");
    expect((await platform.workspaces.get("ws-flow"))?.status).toBe("STOPPED");
    expect(
      (
        await platform.commands.execute({
          workspaceId: "ws-flow",
          commandType: "RESTART_WORKSPACE",
        })
      ).status
    ).toBe("SUCCEEDED");
    const inspection = await platform.commands.execute({
      workspaceId: "ws-flow",
      commandType: "INSPECT_WORKSPACE",
    });
    expect(inspection.status).toBe("SUCCEEDED");
    expect(
      (inspection.result as { workspace: Workspace }).workspace.status
    ).toBe("RUNNING");
    expect(
      (
        await platform.commands.execute({
          workspaceId: "ws-flow",
          commandType: "DESTROY_WORKSPACE",
        })
      ).status
    ).toBe("SUCCEEDED");
    expect(await platform.workspaces.get("ws-flow")).toBeNull();
    expect(
      platform.events.list("ws-flow").map(event => event.eventType)
    ).toEqual(
      expect.arrayContaining([
        "WORKSPACE_CREATED",
        "WORKSPACE_READY",
        "WORKSPACE_STARTED",
        "WORKSPACE_STOPPED",
        "WORKSPACE_RESTARTED",
        "WORKSPACE_DESTROYED",
        "COMMAND_EXECUTED",
      ])
    );
    const transitions = platform.events
      .list("ws-flow")
      .filter(event => event.eventType === "STATE_TRANSITIONED");
    expect(
      transitions.map(event => [
        event.payload.fromStatus,
        event.payload.toStatus,
      ])
    ).toEqual([
      ["CREATING", "INITIALIZING"],
      ["INITIALIZING", "READY"],
      ["READY", "STARTING"],
      ["STARTING", "RUNNING"],
      ["RUNNING", "STOPPING"],
      ["STOPPING", "STOPPED"],
      ["STOPPED", "STARTING"],
      ["STARTING", "RUNNING"],
      ["RUNNING", "DESTROYING"],
      ["DESTROYING", "DESTROYED"],
    ]);
    expect(
      transitions.every(
        event =>
          typeof event.payload.commandId === "string" && event.timestamp === NOW
      )
    ).toBe(true);
  });

  it("records runtime capability failures and never reports a failed create as READY", async () => {
    const platform = createPlatform(new LocalRuntimeAdapter(false));
    await platform.ready;
    const result = await platform.commands.execute({
      workspaceId: "ws-unavailable",
      commandType: "CREATE_WORKSPACE",
      payload: { name: "Unavailable" },
    });
    expect(result.status).toBe("FAILED");
    expect(result.error?.code).toBe("NOT_CONFIGURED");
    const stored = await platform.workspaces.get("ws-unavailable");
    expect(stored?.status).toBe("ERROR");
    expect(stored?.runtime.availability).toBe("NOT_CONFIGURED");
    expect(stored?.resources.allocated).toEqual(ZERO_RESOURCES);
    expect(
      (await platform.overview.execute()).resources.find(
        resource => resource.kind === "RUNTIME_INSTANCE"
      )?.allocated
    ).toBe(0);
  });

  it("records resource quota failure and releases partial reservations", async () => {
    const platform = createPlatform();
    await platform.ready;
    const result = await platform.commands.execute({
      workspaceId: "ws-too-large",
      commandType: "CREATE_WORKSPACE",
      payload: { name: "Too Large", resources: { CPU: 99 } },
    });
    expect(result.status).toBe("FAILED");
    expect(result.error?.code).toBe("RESOURCE_UNAVAILABLE");
    expect((await platform.workspaces.get("ws-too-large"))?.status).toBe(
      "ERROR"
    );
    expect(
      (await platform.overview.execute()).resources.find(
        resource => resource.kind === "CPU"
      )?.allocated
    ).toBe(0);
  });

  it("restores ERROR reservations from Local Storage after Platform reconstruction", async () => {
    const storage = new MemoryStorage();
    const storageKey = "phase06.workspace-core";
    const firstRepository = new LocalStorageWorkspaceRepository(
      storage,
      storageKey
    );
    const retained = workspace("ERROR", "ws-restored-error-reservation");
    retained.runtime.instanceId = "orphaned-runtime-handle";
    retained.runtime.availability = "AVAILABLE";
    retained.resources.requested.CPU = 3;
    retained.resources.allocated.CPU = 3;
    retained.error = {
      code: "RUNTIME_ERROR",
      message: "Runtime cleanup has not completed.",
      occurredAt: NOW,
    };
    await firstRepository.create(retained);

    let runtimeCreates = 0;
    const secondRepository = new LocalStorageWorkspaceRepository(
      storage,
      storageKey
    );
    const platform = createWorkspacePlatform({
      repository: secondRepository,
      runtime: createTestRuntime({
        create: async () => {
          runtimeCreates += 1;
          return { provider: "local-test-fixture", instanceId: "unexpected" };
        },
      }),
      createId: nextId,
      now,
    });
    await platform.ready;
    expect(
      (await platform.overview.execute()).resources.find(
        resource => resource.kind === "CPU"
      )?.allocated
    ).toBe(3);

    const attempted = await platform.commands.execute({
      workspaceId: "ws-over-restored-quota",
      commandType: "CREATE_WORKSPACE",
      payload: { name: "Over restored quota", resources: { CPU: 2 } },
    });
    expect(attempted.status).toBe("FAILED");
    expect(attempted.error?.code).toBe("RESOURCE_UNAVAILABLE");
    expect(runtimeCreates).toBe(0);
  });

  it("does not accept Commands or Overview reads before asynchronous quota restoration completes", async () => {
    const backing = new InMemoryWorkspaceRepository();
    const retained = workspace("ERROR", "ws-quota-restore-gate");
    retained.resources.requested.CPU = 3;
    retained.resources.allocated.CPU = 3;
    retained.error = {
      code: "RESOURCE_UNAVAILABLE",
      message: "Reservation retained for cleanup.",
      occurredAt: NOW,
    };
    await backing.create(retained);
    const repository = new DeferredListWorkspaceRepository(backing);
    let runtimeCreates = 0;
    const platform = createPlatform(
      createTestRuntime({
        create: async () => {
          runtimeCreates += 1;
          return { provider: "local-test-fixture", instanceId: "too-early" };
        },
      }),
      { repository }
    );
    await repository.listStarted;

    const attempted = platform.commands.execute({
      workspaceId: "ws-before-restore",
      commandType: "CREATE_WORKSPACE",
      payload: { name: "Before restore", resources: { CPU: 2 } },
    });
    const overview = platform.overview.execute();
    expect(platform.commands.list()).toEqual([]);
    repository.releaseList();
    await expect(attempted).resolves.toMatchObject({
      status: "FAILED",
      error: { code: "RESOURCE_UNAVAILABLE" },
    });
    expect(
      (await overview).resources.find(resource => resource.kind === "CPU")
        ?.allocated
    ).toBe(3);
    expect(runtimeCreates).toBe(0);
  });

  it("destroys a created runtime handle and releases quota after READY persistence fails", async () => {
    const repository = new FaultInjectingWorkspaceRepository(
      new InMemoryWorkspaceRepository()
    );
    repository.failNextSaveFor("READY");
    let runtimeDestroys = 0;
    const platform = createPlatform(
      createTestRuntime({
        destroy: async () => {
          runtimeDestroys += 1;
        },
      }),
      { repository }
    );
    await platform.ready;
    const failed = await platform.commands.execute({
      commandId: "create-rollback",
      workspaceId: "ws-create-rollback",
      commandType: "CREATE_WORKSPACE",
      payload: { name: "Create rollback", resources: { CPU: 1 } },
    });

    expect(failed.status).toBe("FAILED");
    expect(runtimeDestroys).toBe(1);
    expect(await platform.workspaces.get("ws-create-rollback")).toMatchObject({
      status: "ERROR",
      runtime: { instanceId: null },
      resources: { allocated: ZERO_RESOURCES },
    });
    expect(
      (await platform.overview.execute()).resources.find(
        resource => resource.kind === "CPU"
      )?.allocated
    ).toBe(0);
    expect(
      (
        await platform.commands.execute({
          workspaceId: "ws-create-rollback",
          commandType: "DESTROY_WORKSPACE",
        })
      ).status
    ).toBe("SUCCEEDED");
  });

  it("destroys the runtime before returning its quota during create compensation", async () => {
    const operations: string[] = [];
    const repository = new FaultInjectingWorkspaceRepository(
      new InMemoryWorkspaceRepository()
    );
    repository.failNextSaveFor("READY");
    const runtime = createTestRuntime({
      create: async () => {
        operations.push("runtime-create");
        return { provider: "local-test-fixture", instanceId: "ordered-handle" };
      },
      destroy: async () => {
        operations.push("runtime-destroy");
      },
    });
    const platform = createPlatform(runtime, {
      repository,
      resourceEngine: new OrderedResourceEngine(operations),
    });
    await platform.ready;
    await platform.commands.execute({
      workspaceId: "ws-order-compensation",
      commandType: "CREATE_WORKSPACE",
      payload: { name: "Order compensation", resources: { CPU: 1 } },
    });
    expect(operations).toEqual([
      "runtime-create",
      "runtime-destroy",
      "quota-release",
    ]);
  });

  it("retains and restores quota when runtime compensation fails, then allows cleanup retry", async () => {
    const repository = new FaultInjectingWorkspaceRepository(
      new InMemoryWorkspaceRepository()
    );
    repository.failNextSaveFor("READY");
    let cleanupFails = true;
    const runtime = createTestRuntime({
      destroy: async () => {
        if (cleanupFails) throw new Error("fixture runtime cleanup failure");
      },
    });
    const platform = createPlatform(runtime, { repository });
    await platform.ready;
    const failed = await platform.commands.execute({
      commandId: "create-cleanup-retry",
      workspaceId: "ws-create-cleanup-retry",
      commandType: "CREATE_WORKSPACE",
      payload: { name: "Create cleanup retry", resources: { CPU: 1 } },
    });
    expect(failed.status).toBe("FAILED");
    expect(failed.error?.code).toBe("PROVISIONING_COMPENSATION_FAILED");
    expect(
      await platform.workspaces.get("ws-create-cleanup-retry")
    ).toMatchObject({
      status: "ERROR",
      runtime: { instanceId: "runtime-1" },
      resources: { allocated: { ...ZERO_RESOURCES, CPU: 1 } },
    });
    expect(
      (await platform.overview.execute()).resources.find(
        resource => resource.kind === "CPU"
      )?.allocated
    ).toBe(1);

    const restored = createPlatform(createTestRuntime(), { repository });
    await restored.ready;
    expect(
      (await restored.overview.execute()).resources.find(
        resource => resource.kind === "CPU"
      )?.allocated
    ).toBe(1);
    cleanupFails = false;
    expect(
      (
        await platform.commands.execute({
          workspaceId: "ws-create-cleanup-retry",
          commandType: "DESTROY_WORKSPACE",
        })
      ).status
    ).toBe("SUCCEEDED");
  });

  it("retains the runtime handle and quota when destroy fails, then retries teardown", async () => {
    let destroyFails = true;
    let destroyCalls = 0;
    const runtime = createTestRuntime({
      destroy: async () => {
        destroyCalls += 1;
        if (destroyFails) throw new Error("fixture destroy failure");
      },
    });
    const repository = new FaultInjectingWorkspaceRepository(
      new InMemoryWorkspaceRepository()
    );
    const platform = createPlatform(runtime, { repository });
    await createReadyWorkspace(platform, "ws-destroy-retry");
    const failed = await platform.commands.execute({
      workspaceId: "ws-destroy-retry",
      commandType: "DESTROY_WORKSPACE",
    });
    expect(failed.status).toBe("FAILED");
    expect(await platform.workspaces.get("ws-destroy-retry")).toMatchObject({
      status: "ERROR",
      runtime: { instanceId: "runtime-1" },
      resources: { allocated: { ...ZERO_RESOURCES, CPU: 1, MEMORY: 512 } },
    });

    const restored = createPlatform(createTestRuntime(), { repository });
    await restored.ready;
    expect(
      (await restored.overview.execute()).resources.find(
        resource => resource.kind === "CPU"
      )?.allocated
    ).toBe(1);
    destroyFails = false;
    expect(
      (
        await platform.commands.execute({
          workspaceId: "ws-destroy-retry",
          commandType: "DESTROY_WORKSPACE",
        })
      ).status
    ).toBe("SUCCEEDED");
    expect(destroyCalls).toBe(2);
  });

  it("keeps quota reserved until the release snapshot is persisted during destroy", async () => {
    const repository = new FaultInjectingWorkspaceRepository(
      new InMemoryWorkspaceRepository()
    );
    const platform = createPlatform(createTestRuntime(), { repository });
    await createReadyWorkspace(platform, "ws-release-commit");
    repository.failNextSaveWhen(
      candidate =>
        candidate.status === "DESTROYING" &&
        candidate.resources.allocated.CPU === 0
    );

    const failed = await platform.commands.execute({
      workspaceId: "ws-release-commit",
      commandType: "DESTROY_WORKSPACE",
    });
    expect(failed.status).toBe("FAILED");
    expect(failed.error?.code).toBe("WORKSPACE_STORAGE_ERROR");
    expect(await platform.workspaces.get("ws-release-commit")).toMatchObject({
      status: "ERROR",
      runtime: { instanceId: null },
      resources: { allocated: { ...ZERO_RESOURCES, CPU: 1, MEMORY: 512 } },
    });
    expect(
      (await platform.overview.execute()).resources.find(
        resource => resource.kind === "CPU"
      )?.allocated
    ).toBe(1);

    expect(
      (
        await platform.commands.execute({
          workspaceId: "ws-release-commit",
          commandType: "DESTROY_WORKSPACE",
        })
      ).status
    ).toBe("SUCCEEDED");
  });

  it("keeps an ERROR cleanup record after delete failure and retries without a stale runtime handle", async () => {
    const repository = new FaultInjectingWorkspaceRepository(
      new InMemoryWorkspaceRepository()
    );
    repository.failNextDelete();
    let runtimeDestroys = 0;
    const platform = createPlatform(
      createTestRuntime({
        destroy: async () => {
          runtimeDestroys += 1;
        },
      }),
      { repository }
    );
    await createReadyWorkspace(platform, "ws-delete-retry");
    const failed = await platform.commands.execute({
      workspaceId: "ws-delete-retry",
      commandType: "DESTROY_WORKSPACE",
    });
    expect(failed.status).toBe("FAILED");
    expect(failed.error?.code).toBe("WORKSPACE_STORAGE_ERROR");
    expect(await platform.workspaces.get("ws-delete-retry")).toMatchObject({
      status: "ERROR",
      runtime: { instanceId: null },
      resources: { allocated: ZERO_RESOURCES },
    });
    expect(
      (
        await platform.commands.execute({
          workspaceId: "ws-delete-retry",
          commandType: "DESTROY_WORKSPACE",
        })
      ).status
    ).toBe("SUCCEEDED");
    expect(runtimeDestroys).toBe(1);
    expect(await platform.workspaces.get("ws-delete-retry")).toBeNull();
  });

  it("rejects invalid command input before any operation", async () => {
    const platform = createPlatform();
    await expect(
      platform.commands.execute({
        workspaceId: " ",
        commandType: "START_WORKSPACE",
      })
    ).rejects.toThrow(ValidationError);
    await expect(
      platform.commands.execute({
        workspaceId: "ws-1",
        commandType: "INVALID" as never,
      })
    ).rejects.toThrow("Unsupported command");
    expect(platform.commands.list()).toEqual([]);
  });

  it("snapshots the Command Request before callers can mutate its payload", async () => {
    const platform = createPlatform();
    const payload = { name: "Original name", resources: { CPU: 0.25 } };
    const pending = platform.commands.execute({
      commandId: "snapshot-create",
      workspaceId: "ws-snapshot",
      commandType: "CREATE_WORKSPACE",
      payload,
    });
    payload.name = "Mutated name";
    payload.resources.CPU = 99;

    const result = await pending;
    expect(result.status).toBe("SUCCEEDED");
    const stored = await platform.workspaces.get("ws-snapshot");
    expect(stored?.name).toBe("Original name");
    expect(stored?.resources.requested.CPU).toBe(0.25);
    await expect(
      platform.commands.execute({
        workspaceId: "ws-invalid-resource",
        commandType: "CREATE_WORKSPACE",
        payload: {
          name: "Invalid resource",
          resources: { GPU: 1 } as never,
        },
      })
    ).rejects.toThrow(ValidationError);
  });

  it("rejects an invalid generated acceptance timestamp before creating records", async () => {
    idCounter = 0;
    const platform = createWorkspacePlatform({
      repository: new InMemoryWorkspaceRepository(),
      runtime: createTestRuntime(),
      createId: nextId,
      now: () => "not-a-timestamp",
    });
    await platform.ready;
    await expect(
      platform.commands.execute({
        commandId: "invalid-clock",
        workspaceId: "ws-invalid-clock",
        commandType: "CREATE_WORKSPACE",
        payload: { name: "Invalid Clock Workspace" },
      })
    ).rejects.toThrow(ValidationError);
    expect(platform.commands.list()).toEqual([]);
    expect(await platform.workspaces.list()).toEqual([]);
  });

  it("deduplicates concurrent retries and rejects conflicting idempotency-key reuse", async () => {
    let releaseStart!: () => void;
    let startCalls = 0;
    const startBarrier = new Promise<void>(resolve => {
      releaseStart = resolve;
    });
    const platform = createPlatform(
      createTestRuntime({
        start: async () => {
          startCalls += 1;
          await startBarrier;
          return {
            provider: "local-test-fixture",
            instanceId: "idempotent-start",
          };
        },
      })
    );
    await createReadyWorkspace(platform, "ws-idempotent");
    const request = {
      commandId: "start-once",
      workspaceId: "ws-idempotent",
      commandType: "START_WORKSPACE" as const,
    };
    const first = platform.commands.execute(request);
    await Promise.resolve();
    await Promise.resolve();
    const duplicate = platform.commands.execute({ ...request });
    await expect(
      platform.commands.execute({
        ...request,
        commandType: "STOP_WORKSPACE",
      })
    ).rejects.toThrow(CommandIdConflictError);
    releaseStart();

    const [firstResult, duplicateResult] = await Promise.all([
      first,
      duplicate,
    ]);
    expect(firstResult.status).toBe("SUCCEEDED");
    expect(duplicateResult).toEqual(firstResult);
    expect(startCalls).toBe(1);
    expect(
      platform.commands
        .list()
        .filter(record => record.commandId === "start-once")
    ).toHaveLength(1);
  });

  it("serializes start/stop so the stop sees the committed RUNNING state", async () => {
    let releaseStart!: () => void;
    const startBarrier = new Promise<void>(resolve => {
      releaseStart = resolve;
    });
    const runtime = createTestRuntime({
      start: async () => {
        await startBarrier;
        return { provider: "local-test-fixture", instanceId: "delayed" };
      },
    });
    const platform = createPlatform(runtime);
    await createReadyWorkspace(platform, "ws-serial");
    await platform.ready;
    const start = platform.commands.execute({
      commandId: "serial-start",
      workspaceId: "ws-serial",
      commandType: "START_WORKSPACE",
    });
    for (
      let attempt = 0;
      attempt < 20 &&
      platform.commands
        .list()
        .find(record => record.commandId === "serial-start")?.status !==
        "RUNNING";
      attempt += 1
    ) {
      await Promise.resolve();
    }
    const stop = platform.commands.execute({
      commandId: "serial-stop",
      workspaceId: "ws-serial",
      commandType: "STOP_WORKSPACE",
    });
    for (
      let attempt = 0;
      attempt < 20 &&
      !platform.commands
        .list()
        .some(record => record.commandId === "serial-stop");
      attempt += 1
    ) {
      await Promise.resolve();
    }
    expect(
      platform.commands
        .list()
        .find(record => record.commandId === "serial-stop")
    ).toMatchObject({ status: "PENDING", startedAt: null, completedAt: null });
    releaseStart();
    const [startResult, stopResult] = await Promise.all([start, stop]);
    expect(startResult.status).toBe("SUCCEEDED");
    expect(stopResult.status).toBe("SUCCEEDED");
    expect(startResult.startedAt).toBe(NOW);
    expect(startResult.completedAt).toBe(NOW);
    expect(stopResult.startedAt).toBe(NOW);
    expect(stopResult.completedAt).toBe(NOW);
    expect((await platform.workspaces.get("ws-serial"))?.status).toBe(
      "STOPPED"
    );
  });

  it("moves a runtime operation failure into ERROR and keeps the command result truthful", async () => {
    const runtime = createTestRuntime({
      start: async () => {
        throw new Error("fixture runtime failure");
      },
    });
    const platform = createPlatform(runtime);
    await createReadyWorkspace(platform, "ws-fail");
    const result = await platform.commands.execute({
      workspaceId: "ws-fail",
      commandType: "START_WORKSPACE",
    });
    expect(result.status).toBe("FAILED");
    expect(result.error?.message).toBe("fixture runtime failure");
    expect((await platform.workspaces.get("ws-fail"))?.status).toBe("ERROR");
  });
});

describe("Workspace overview and configuration", () => {
  it("derives counts from repository state and labels local reservation storage", async () => {
    const repository = new InMemoryWorkspaceRepository();
    await repository.create(workspace("READY", "ready"));
    await repository.create(workspace("RUNNING", "running"));
    await repository.create(workspace("ERROR", "error"));
    const overview = await new WorkspaceOverviewQuery(
      repository,
      new ResourceEngine(DEFAULT_CONFIGURATION),
      now
    ).execute();
    expect(overview.counts).toMatchObject({
      total: 3,
      READY: 1,
      RUNNING: 1,
      ERROR: 1,
    });
    expect(overview.storage).toBe("LOCAL_DEVELOPMENT_STORAGE");
    expect(
      overview.resources.every(
        resource =>
          resource.used === null && resource.usageState === "UNAVAILABLE"
      )
    ).toBe(true);
  });

  it("rejects provider-specific runtime configuration in the local foundation", () => {
    const configuration = structuredClone(DEFAULT_CONFIGURATION);
    configuration.runtime.provider = "aws" as "local";
    expect(() => validateConfiguration(configuration)).toThrow(
      ConfigurationError
    );
  });

  it("survives an event listener failure without affecting local event history", () => {
    const bus = new LocalEventBus(nextId);
    const unsubscribe = bus.subscribe(() => {
      throw new Error("broken UI subscriber");
    });
    expect(() => bus.emit("WORKSPACE_CREATED", "ws-1")).not.toThrow();
    unsubscribe();
    expect(bus.list("ws-1")).toHaveLength(1);
  });
});

describe("Conflicting command serialization", () => {
  it("prevents a concurrent duplicate START from entering the runtime", async () => {
    let releaseStart!: () => void;
    let startCalls = 0;
    const startBarrier = new Promise<void>(resolve => {
      releaseStart = resolve;
    });
    const runtime = createTestRuntime({
      start: async () => {
        startCalls += 1;
        await startBarrier;
        return { provider: "local-test-fixture", instanceId: "single-start" };
      },
    });
    const platform = createPlatform(runtime);
    await createReadyWorkspace(platform, "ws-double-start");
    const first = platform.commands.execute({
      workspaceId: "ws-double-start",
      commandType: "START_WORKSPACE",
    });
    await Promise.resolve();
    await Promise.resolve();
    const second = platform.commands.execute({
      workspaceId: "ws-double-start",
      commandType: "START_WORKSPACE",
    });
    releaseStart();
    const [firstResult, secondResult] = await Promise.all([first, second]);
    expect(firstResult.status).toBe("SUCCEEDED");
    expect(secondResult.status).toBe("FAILED");
    expect(secondResult.error?.code).toBe("INVALID_STATE_TRANSITION");
    expect(startCalls).toBe(1);
    expect((await platform.workspaces.get("ws-double-start"))?.status).toBe(
      "RUNNING"
    );
  });
});

describe("Workspace Core domain validation", () => {
  it("identifies only ERROR records that still retain runtime or resource state for cleanup", () => {
    const cleanError = workspace("ERROR", "ws-clean-error");
    expect(workspaceNeedsCleanup(cleanError)).toBe(false);

    const runtimePending = workspace("ERROR", "ws-runtime-pending");
    runtimePending.runtime.instanceId = "runtime-pending";
    expect(workspaceNeedsCleanup(runtimePending)).toBe(true);

    const quotaPending = workspace("ERROR", "ws-quota-pending");
    quotaPending.resources.allocated.MEMORY = 256;
    expect(workspaceNeedsCleanup(quotaPending)).toBe(true);

    const nonErrorWithHandle = workspace("READY", "ws-ready-handle");
    nonErrorWithHandle.runtime.instanceId = "runtime-ready";
    expect(workspaceNeedsCleanup(nonErrorWithHandle)).toBe(false);
  });

  it("creates normalized records with an injected provider-neutral adapter id", () => {
    const record = createWorkspaceRecord({
      id: "  ws-domain  ",
      name: "  Core Workspace  ",
      runtimeProvider: "  test-adapter  ",
      requestedResources: { ...ZERO_RESOURCES },
      createdAt: NOW,
    });
    expect(record.id).toBe("ws-domain");
    expect(record.name).toBe("Core Workspace");
    expect(record.runtime.provider).toBe("test-adapter");
    expect(record.status).toBe("CREATING");
  });

  it("rejects invalid identity, lifecycle states, resource values, and timestamps", () => {
    expect(() =>
      createWorkspaceRecord({
        id: "ws-invalid",
        name: "",
        runtimeProvider: "adapter",
        requestedResources: { ...ZERO_RESOURCES },
        createdAt: NOW,
      })
    ).toThrow(ValidationError);
    expect(() =>
      createWorkspaceRecord({
        id: "ws-invalid",
        name: "Valid name",
        runtimeProvider: "adapter",
        requestedResources: { ...ZERO_RESOURCES, CPU: Number.NaN },
        createdAt: NOW,
      })
    ).toThrow(ValidationError);
    expect(() =>
      createWorkspaceRecord({
        id: "ws-invalid",
        name: "Valid name",
        runtimeProvider: "adapter",
        requestedResources: { ...ZERO_RESOURCES },
        createdAt: "not-a-date",
      })
    ).toThrow(ValidationError);
  });

  it("validates repository writes instead of accepting malformed domain objects", async () => {
    const repository = new InMemoryWorkspaceRepository();
    const invalid = workspace();
    invalid.resources.allocated.MEMORY = -1;
    await expect(repository.create(invalid)).rejects.toThrow(ValidationError);
    expect(await repository.list()).toEqual([]);
  });

  it("rejects corrupted or duplicate Workspace records during local-storage restore", async () => {
    const storage = new MemoryStorage();
    const repository = new LocalStorageWorkspaceRepository(storage, "broken");
    storage.setItem(
      "broken",
      JSON.stringify([{ id: "partial", status: "READY" }])
    );
    await expect(repository.list()).rejects.toThrow(WorkspaceStorageError);
    storage.setItem("broken", JSON.stringify([workspace(), workspace()]));
    await expect(repository.list()).rejects.toThrow(WorkspaceStorageError);
  });
});

describe("Core application boundary", () => {
  it("hides mutable implementation internals behind Commands and read-only queries", () => {
    const platform = createPlatform();
    expect(Object.keys(platform).sort()).toEqual([
      "audit",
      "commands",
      "eventStream",
      "events",
      "knowledge",
      "observability",
      "overview",
      "ready",
      "runtimeCapabilities",
      "workspaces",
    ]);
    expect(Object.isFrozen(platform)).toBe(true);
    expect(Object.isFrozen(platform.audit)).toBe(true);
    expect(platform.audit).toHaveProperty("list");
    expect(Object.isFrozen(platform.knowledge)).toBe(true);
    expect(platform.knowledge).toHaveProperty("search");
    expect(Object.isFrozen(platform.eventStream)).toBe(true);
    expect(platform.eventStream).toHaveProperty("query");
    expect(Object.isFrozen(platform.observability)).toBe(true);
    expect(platform.observability).toHaveProperty("health");
    expect(platform.commands).toHaveProperty("execute");
    expect(platform.commands).toHaveProperty("list");
    const capabilities = platform.runtimeCapabilities();
    expect(Object.isFrozen(capabilities)).toBe(true);
    expect(Object.isFrozen(capabilities.supports)).toBe(true);
    expect(capabilities.provider).toBe("local-test-fixture");
    expect(platform).not.toHaveProperty("repository");
    expect(platform).not.toHaveProperty("runtime");
    expect(platform).not.toHaveProperty("resources");
    expect(platform).not.toHaveProperty("stateMachine");
    expect(platform.events).not.toHaveProperty("emit");
  });

  it("connects Command, EventStream, Health, and Audit through one Platform composition root", async () => {
    const platform = createPlatform();
    const result = await platform.commands.execute({
      workspaceId: "ws-foundation-observability",
      commandId: "cmd-foundation-observability",
      commandType: "CREATE_WORKSPACE",
      payload: { name: "Foundation Observability" },
    });
    expect(result.status).toBe("SUCCEEDED");
    const stream = platform.eventStream.query({ workspaceId: "ws-foundation-observability" });
    expect(stream.source).toBe("LOCAL_EVENT_BUS");
    expect(stream.events.some(event => event.commandId === "cmd-foundation-observability")).toBe(true);
    expect((await platform.observability.health()).components).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "WORKSPACE", status: "HEALTHY" })])
    );
    expect(await platform.audit.list("ws-foundation-observability")).toEqual([
      expect.objectContaining({ commandId: "cmd-foundation-observability", status: "SUCCEEDED" }),
    ]);
  });

  it("exposes one terminal audit record for an idempotent command replay", async () => {
    const platform = createPlatform();
    await platform.commands.execute({
      workspaceId: "ws-audit",
      commandId: "cmd-audit",
      commandType: "CREATE_WORKSPACE",
      payload: { name: "Audit Workspace" },
    });
    await platform.commands.execute({
      workspaceId: "ws-audit",
      commandId: "cmd-audit",
      commandType: "CREATE_WORKSPACE",
      payload: { name: "Audit Workspace" },
    });

    await expect(platform.audit.list()).resolves.toEqual([
      expect.objectContaining({
        commandId: "cmd-audit",
        status: "SUCCEEDED",
      }),
    ]);
    expect(platform.commands.list()).toHaveLength(1);
  });

  it("does not let consumers mutate command history snapshots", async () => {
    const platform = createPlatform();
    const result = await platform.commands.execute({
      workspaceId: "ws-snapshot",
      commandType: "CREATE_WORKSPACE",
      payload: { name: "Snapshot Workspace" },
    });
    const resultWorkspace = result.result as Workspace;
    resultWorkspace.name = "Mutated response";
    const historyRecord = platform.commands.list()[0];
    (historyRecord.result as Workspace).name = "Mutated history";
    expect((await platform.workspaces.get("ws-snapshot"))?.name).toBe(
      "Snapshot Workspace"
    );
    expect((platform.commands.list()[0].result as Workspace).name).toBe(
      "Snapshot Workspace"
    );
  });

  it("isolates emitted, returned, and listed Event Bus payloads", () => {
    const bus = new LocalEventBus(nextId);
    const source = { nested: { count: 1 } };
    const emitted = bus.emit("WORKSPACE_CREATED", "ws-event", source);
    source.nested.count = 2;
    emitted.payload.nested = { count: 3 };
    const listed = bus.list()[0];
    listed.payload.nested = { count: 4 };
    expect(bus.list()[0].payload.nested).toEqual({ count: 1 });
  });
});
