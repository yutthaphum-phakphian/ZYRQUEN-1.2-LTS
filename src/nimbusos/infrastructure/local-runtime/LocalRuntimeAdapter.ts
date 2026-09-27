import {
  RuntimeCapabilityError,
  RuntimeOperationError,
} from "../../core/errors";
import type { RuntimeAdapter } from "../../core/runtime/runtimeAdapter";
import type {
  RuntimeCapabilities,
  RuntimeHandle,
  RuntimeInspection,
  Workspace,
} from "../../core/types";

interface WorkerRequest {
  requestId: string;
  operation: "inspect" | "start" | "stop" | "restart" | "destroy";
}

interface WorkerResponse {
  requestId: string;
  state: "READY" | "RUNNING" | "STOPPED" | "DESTROYED";
  error?: string;
}

export interface LocalWorkerLike {
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: WorkerRequest): void;
  terminate(): void;
}

export interface WorkerRuntimeInstance {
  worker: LocalWorkerLike;
  dispose(): void;
}

export interface WorkerRuntimeHost {
  readonly supported: boolean;
  create(): WorkerRuntimeInstance;
}

interface ManagedWorker {
  handle: RuntimeHandle;
  instance: WorkerRuntimeInstance;
  state: WorkerResponse["state"];
  error: string | null;
}

const WORKER_SOURCE = `
let state = "READY";
self.onmessage = event => {
  const { requestId, operation } = event.data || {};
  if (!requestId || typeof operation !== "string") return;
  if (operation === "start") state = "RUNNING";
  else if (operation === "stop") state = "STOPPED";
  else if (operation === "restart") state = "RUNNING";
  else if (operation === "destroy") state = "DESTROYED";
  self.postMessage({ requestId, state });
  if (operation === "destroy") self.close();
};
`;

/**
 * A browser-local Worker adapter, not an operating-system process runtime.
 * It executes a fixed, bundled control loop; it accepts no caller-supplied code,
 * opens no ports, accesses no filesystem, and exposes no host telemetry.
 */
export class LocalRuntimeAdapter implements RuntimeAdapter {
  readonly provider = "local";
  private readonly managedByWorkspace = new Map<string, ManagedWorker>();
  private requestCounter = 0;
  private instanceCounter = 0;

  constructor(
    private readonly enabled = true,
    private readonly host: WorkerRuntimeHost = createBrowserWorkerHost(),
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly createId: () => string = () =>
      `worker-${Date.now()}-${++this.instanceCounter}`
  ) {}

  capabilities(): RuntimeCapabilities {
    const available = this.enabled && this.host.supported;
    const availability = !this.enabled
      ? "NOT_CONFIGURED"
      : this.host.supported
        ? "AVAILABLE"
        : "UNAVAILABLE";
    return {
      provider: this.provider,
      availability,
      execution: available ? "BROWSER_WEB_WORKER" : "NONE",
      supports: {
        create: available,
        start: available,
        stop: available,
        restart: available,
        inspect: true,
        destroy: available,
      },
      hostProcess: false,
      hostFilesystem: false,
      hostTelemetry: false,
      arbitraryUserCode: false,
      message: available
        ? "รัน Fixed Worker control loop ภายใน Browser tab · ไม่ใช่ OS process และไม่มี filesystem, shell, network หรือ host telemetry"
        : !this.enabled
          ? "Local Worker runtime ถูกปิดไว้ใน configuration"
          : "Browser นี้ไม่รองรับ Web Worker หรือ Blob URL สำหรับ Local Runtime",
    };
  }

  async create(workspace: Workspace): Promise<RuntimeHandle> {
    this.assertAvailable("สร้าง Local Worker");
    if (this.managedByWorkspace.has(workspace.id))
      throw new RuntimeOperationError(
        `Workspace '${workspace.id}' already has a managed Local Worker.`
      );

    let instance: WorkerRuntimeInstance;
    try {
      instance = this.host.create();
    } catch (error) {
      throw new RuntimeOperationError(
        `Unable to create the local Browser Worker: ${messageOf(error)}`,
        { cause: error }
      );
    }

    const handle: RuntimeHandle = {
      provider: this.provider,
      instanceId: this.createId(),
    };
    const managed: ManagedWorker = {
      handle,
      instance,
      state: "READY",
      error: null,
    };
    this.managedByWorkspace.set(workspace.id, managed);

    try {
      await this.request(managed, "inspect");
      return { ...handle };
    } catch (error) {
      this.disposeWorkspace(workspace.id, managed);
      throw error;
    }
  }

  async start(workspace: Workspace): Promise<RuntimeHandle> {
    this.assertAvailable("เริ่ม Local Worker");
    const managed = this.managedByWorkspace.get(workspace.id);
    if (!managed) return this.create(workspace);
    await this.request(managed, "start");
    return { ...managed.handle };
  }

  async stop(workspace: Workspace): Promise<void> {
    this.assertAvailable("หยุด Local Worker");
    const managed = this.requireManaged(workspace);
    await this.request(managed, "stop");
  }

  async restart(workspace: Workspace): Promise<RuntimeHandle> {
    this.assertAvailable("Restart Local Worker");
    const managed = this.managedByWorkspace.get(workspace.id);
    if (!managed) return this.create(workspace);
    await this.request(managed, "restart");
    return { ...managed.handle };
  }

  async inspect(workspace: Workspace): Promise<RuntimeInspection> {
    const managed = this.managedByWorkspace.get(workspace.id);
    const observedAt = this.now();
    if (!managed) {
      const capability = this.capabilities();
      return {
        availability: capability.availability,
        observedAt,
        instanceId: null,
        message:
          capability.availability === "AVAILABLE"
            ? "Local Worker สำหรับ Workspace นี้ยังไม่มี หรือถูก Browser ปิดเมื่อจบ Session"
            : capability.message,
      };
    }

    if (managed.error) {
      return {
        availability: "UNAVAILABLE",
        observedAt,
        instanceId: managed.handle.instanceId,
        message: `Local Worker ตอบสนองผิดพลาด: ${managed.error}`,
      };
    }

    try {
      await this.request(managed, "inspect");
      return {
        availability: "AVAILABLE",
        observedAt: this.now(),
        instanceId: managed.handle.instanceId,
        message: `Browser Web Worker state: ${managed.state} · ไม่ใช่ OS process`,
      };
    } catch (error) {
      return {
        availability: "UNAVAILABLE",
        observedAt: this.now(),
        instanceId: managed.handle.instanceId,
        message: `Local Worker ตรวจสอบไม่ได้: ${messageOf(error)}`,
      };
    }
  }

  async destroy(workspace: Workspace): Promise<void> {
    this.assertAvailable("ลบ Local Worker");
    const managed = this.managedByWorkspace.get(workspace.id);
    if (!managed) {
      // Web Workers are scoped to this page and cannot survive its unload. A
      // stale persisted handle has no surviving process at this boundary.
      return;
    }

    try {
      if (!managed.error) await this.request(managed, "destroy");
    } finally {
      // terminate() is the local hard-stop fallback even if the worker failed
      // to acknowledge its cleanup request.
      this.disposeWorkspace(workspace.id, managed);
    }
  }

  private assertAvailable(operation: string): void {
    const capability = this.capabilities();
    if (capability.availability === "NOT_CONFIGURED")
      throw new RuntimeCapabilityError("NOT_CONFIGURED", capability.message);
    if (!this.host.supported)
      throw new RuntimeCapabilityError("UNAVAILABLE", capability.message);
    if (!this.enabled)
      throw new RuntimeCapabilityError(
        "NOT_CONFIGURED",
        `${operation}: ${capability.message}`
      );
  }

  private requireManaged(workspace: Workspace): ManagedWorker {
    const managed = this.managedByWorkspace.get(workspace.id);
    if (!managed)
      throw new RuntimeCapabilityError(
        "UNAVAILABLE",
        `Workspace '${workspace.id}' has no Local Worker in this Browser session.`
      );
    return managed;
  }

  private request(
    managed: ManagedWorker,
    operation: WorkerRequest["operation"]
  ): Promise<WorkerResponse["state"]> {
    if (managed.error)
      return Promise.reject(
        new RuntimeOperationError(`Local Worker failed: ${managed.error}`)
      );

    const requestId = `request-${++this.requestCounter}`;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        managed.error = `Operation '${operation}' timed out.`;
        reject(new RuntimeOperationError(managed.error));
      }, 2500);
      const previousMessage = managed.instance.worker.onmessage;
      const previousError = managed.instance.worker.onerror;
      const cleanup = () => {
        clearTimeout(timeout);
        managed.instance.worker.onmessage = previousMessage;
        managed.instance.worker.onerror = previousError;
      };
      managed.instance.worker.onmessage = event => {
        previousMessage?.call(managed.instance.worker as Worker, event);
        if (event.data?.requestId !== requestId) return;
        cleanup();
        if (event.data.error) {
          managed.error = event.data.error;
          reject(new RuntimeOperationError(event.data.error));
          return;
        }
        managed.state = event.data.state;
        managed.error = null;
        resolve(event.data.state);
      };
      managed.instance.worker.onerror = event => {
        previousError?.call(managed.instance.worker as Worker, event);
        cleanup();
        managed.error = event.message || "Worker runtime error";
        reject(new RuntimeOperationError(managed.error));
      };
      try {
        managed.instance.worker.postMessage({ requestId, operation });
      } catch (error) {
        cleanup();
        managed.error = messageOf(error);
        reject(
          new RuntimeOperationError(
            `Unable to message Local Worker: ${managed.error}`,
            { cause: error }
          )
        );
      }
    });
  }

  private disposeWorkspace(workspaceId: string, managed: ManagedWorker): void {
    managed.instance.worker.terminate();
    managed.instance.dispose();
    this.managedByWorkspace.delete(workspaceId);
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function createBrowserWorkerHost(): WorkerRuntimeHost {
  const supported =
    typeof globalThis.Worker !== "undefined" &&
    typeof globalThis.Blob !== "undefined" &&
    typeof globalThis.URL?.createObjectURL === "function" &&
    typeof globalThis.URL?.revokeObjectURL === "function";

  return {
    supported,
    create() {
      if (!supported)
        throw new RuntimeCapabilityError(
          "UNAVAILABLE",
          "This Browser does not support the required Web Worker APIs."
        );
      const blob = new Blob([WORKER_SOURCE], {
        type: "text/javascript;charset=utf-8",
      });
      const objectUrl = URL.createObjectURL(blob);
      try {
        const worker = new Worker(objectUrl);
        return {
          worker,
          dispose: () => URL.revokeObjectURL(objectUrl),
        };
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        throw error;
      }
    },
  };
}
