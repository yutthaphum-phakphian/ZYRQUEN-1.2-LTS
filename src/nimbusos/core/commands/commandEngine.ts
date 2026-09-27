import {
  CommandIdConflictError,
  InvalidCommandError,
  ValidationError,
} from "../errors";
import type { WorkspaceProvisioner } from "../provisioner/workspaceProvisioner";
import { LocalEventBus } from "../events/eventBus";
import { ZERO_RESOURCES } from "../resources/resourceEngine";
import { WorkspaceLock } from "./workspaceLock";
import {
  InMemoryAuditRepository,
  type AuditRepository,
} from "../audit/auditRepository";
import type { CommandRecord, CommandRequest, CommandType } from "../types";

const COMMAND_TYPES: readonly CommandType[] = [
  "CREATE_WORKSPACE",
  "START_WORKSPACE",
  "STOP_WORKSPACE",
  "RESTART_WORKSPACE",
  "INSPECT_WORKSPACE",
  "DESTROY_WORKSPACE",
];

interface NormalizedCommandRequest extends CommandRequest {
  commandId: string;
  requestedAt: string;
}

interface IdempotencyEntry {
  fingerprint: string;
  execution: Promise<CommandRecord>;
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortObject(nested)])
    );
  }
  return value;
}

function commandFingerprint(request: NormalizedCommandRequest): string {
  return JSON.stringify(
    sortObject({
      workspaceId: request.workspaceId.trim(),
      commandType: request.commandType,
      payload: request.payload ?? null,
    })
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class CommandEngine {
  private readonly history: CommandRecord[] = [];
  private readonly executionsById = new Map<string, IdempotencyEntry>();

  constructor(
    private readonly provisioner: WorkspaceProvisioner,
    private readonly locks: WorkspaceLock,
    private readonly events: LocalEventBus,
    private readonly createId: () => string = () =>
      globalThis.crypto.randomUUID(),
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly audit: AuditRepository = new InMemoryAuditRepository()
  ) {}

  async execute(request: CommandRequest): Promise<CommandRecord> {
    this.validate(request);
    const snapshot = structuredClone(request);
    const commandId = snapshot.commandId?.trim() ?? this.createId();
    if (!commandId || commandId.length > 128) {
      throw new ValidationError(
        "Generated commandId must contain 1–128 characters."
      );
    }
    const normalized: NormalizedCommandRequest = {
      ...snapshot,
      commandId,
      workspaceId: snapshot.workspaceId.trim(),
      requestedAt: request.requestedAt ?? this.timestamp(),
      payload:
        snapshot.commandType === "CREATE_WORKSPACE"
          ? {
              name: snapshot.payload?.name?.trim(),
              resources: snapshot.payload?.resources ?? {},
              metadata: snapshot.payload?.metadata ?? {},
            }
          : undefined,
    };
    const fingerprint = commandFingerprint(normalized);
    const existing = this.executionsById.get(normalized.commandId);
    if (existing) {
      if (existing.fingerprint !== fingerprint) {
        throw new CommandIdConflictError(normalized.commandId);
      }
      return structuredClone(await existing.execution);
    }

    const execution = this.executeOnce(normalized);
    this.executionsById.set(normalized.commandId, { fingerprint, execution });
    return structuredClone(await execution);
  }

  list(): CommandRecord[] {
    return this.history.map(record => structuredClone(record));
  }

  private async executeOnce(
    request: NormalizedCommandRequest
  ): Promise<CommandRecord> {
    const record: CommandRecord = {
      commandId: request.commandId,
      workspaceId: request.workspaceId,
      commandType: request.commandType,
      requestedAt: request.requestedAt,
      status: "PENDING",
      startedAt: null,
      completedAt: null,
      result: null,
      error: null,
    };
    this.history.push(record);
    this.events.emit("COMMAND_QUEUED", record.workspaceId, {
      commandId: record.commandId,
      commandType: record.commandType,
    });

    try {
      record.result = await this.locks.runExclusive(
        record.workspaceId,
        async () => {
          record.status = "RUNNING";
          record.startedAt = this.timestamp(record.requestedAt);
          this.events.emit("COMMAND_STARTED", record.workspaceId, {
            commandId: record.commandId,
            commandType: record.commandType,
          });
          return this.dispatch(request);
        }
      );
      record.status = "SUCCEEDED";
      record.completedAt = this.timestamp(
        record.startedAt ?? record.requestedAt
      );
      this.events.emit("COMMAND_EXECUTED", record.workspaceId, {
        commandId: record.commandId,
        commandType: record.commandType,
      });
    } catch (error) {
      const cause = error instanceof Error ? error : new Error(String(error));
      const coded = error as { code?: unknown };
      record.status = "FAILED";
      record.completedAt = this.timestamp(
        record.startedAt ?? record.requestedAt
      );
      record.error = {
        code: typeof coded?.code === "string" ? coded.code : "COMMAND_ERROR",
        message: cause.message,
        occurredAt: record.completedAt,
      };
      this.events.emit("COMMAND_FAILED", record.workspaceId, {
        commandId: record.commandId,
        commandType: record.commandType,
        code: record.error.code,
        message: record.error.message,
      });
    }
    // Durable audit write happens only once the record is terminal
    // (SUCCEEDED or FAILED) and never blocks or rewrites the in-memory
    // result: a persistence fault here is an infrastructure concern,
    // not a reason to misreport a command that already actually
    // completed against the Workspace.
    try {
      await this.audit.append(structuredClone(record));
    } catch {
      /* Audit persistence cannot rewrite a Core command result. */
    }
    return structuredClone(record);
  }

  private timestamp(fallback?: string): string {
    const value = this.now();
    if (!Number.isFinite(Date.parse(value))) {
      if (fallback) return fallback;
      throw new ValidationError("Command timestamp must be valid.");
    }
    return value;
  }

  private validate(request: CommandRequest): void {
    if (!request || typeof request !== "object" || Array.isArray(request)) {
      throw new ValidationError("Command request is required.");
    }
    const allowedRequestKeys = new Set([
      "commandId",
      "workspaceId",
      "commandType",
      "requestedAt",
      "payload",
    ]);
    if (Object.keys(request).some(key => !allowedRequestKeys.has(key))) {
      throw new ValidationError(
        "Command request contains an unsupported field."
      );
    }
    if (!COMMAND_TYPES.includes(request.commandType)) {
      throw new InvalidCommandError(
        `Unsupported command '${String(request.commandType)}'.`
      );
    }
    if (
      typeof request.workspaceId !== "string" ||
      !request.workspaceId.trim() ||
      request.workspaceId.trim().length > 128
    ) {
      throw new ValidationError("workspaceId must contain 1–128 characters.");
    }
    if (
      request.commandId !== undefined &&
      (typeof request.commandId !== "string" ||
        !request.commandId.trim() ||
        request.commandId.trim().length > 128)
    ) {
      throw new ValidationError("commandId must contain 1–128 characters.");
    }
    if (
      request.requestedAt !== undefined &&
      (typeof request.requestedAt !== "string" ||
        !Number.isFinite(Date.parse(request.requestedAt)))
    ) {
      throw new ValidationError("requestedAt must be a valid timestamp.");
    }
    if (
      request.payload !== undefined &&
      request.commandType !== "CREATE_WORKSPACE"
    ) {
      throw new ValidationError(
        `${request.commandType} does not accept a payload.`
      );
    }
    if (request.commandType !== "CREATE_WORKSPACE") return;
    if (!isRecord(request.payload)) {
      throw new ValidationError("CREATE_WORKSPACE requires a payload object.");
    }
    if (
      Object.keys(request.payload).some(
        key => !["name", "resources", "metadata"].includes(key)
      )
    ) {
      throw new ValidationError(
        "CREATE_WORKSPACE payload contains an unsupported field."
      );
    }
    const name = request.payload.name;
    if (typeof name !== "string" || !name.trim()) {
      throw new ValidationError("CREATE_WORKSPACE requires payload.name.");
    }
    if (name.trim().length > 80) {
      throw new ValidationError("Workspace name cannot exceed 80 characters.");
    }

    const resources = request.payload.resources;
    if (resources !== undefined) {
      if (!isRecord(resources)) {
        throw new ValidationError("Resource requests must be an object.");
      }
      const resourceKeys = new Set(Object.keys(ZERO_RESOURCES));
      for (const [kind, value] of Object.entries(resources)) {
        if (
          !resourceKeys.has(kind) ||
          (value !== undefined &&
            (typeof value !== "number" || !Number.isFinite(value) || value < 0))
        ) {
          throw new ValidationError(
            "Resource requests must contain known kinds and finite non-negative numbers."
          );
        }
      }
    }

    const metadata = request.payload.metadata;
    if (metadata !== undefined) {
      if (
        !isRecord(metadata) ||
        Object.values(metadata).some(
          value =>
            !(
              value === null ||
              typeof value === "string" ||
              typeof value === "boolean" ||
              (typeof value === "number" && Number.isFinite(value))
            )
        )
      ) {
        throw new ValidationError(
          "Workspace metadata must contain only strings, finite numbers, booleans, or null."
        );
      }
    }
  }

  private dispatch(request: NormalizedCommandRequest): Promise<unknown> {
    const { workspaceId, commandId } = request;
    switch (request.commandType) {
      case "CREATE_WORKSPACE":
        return this.provisioner.createWorkspace(
          {
            id: workspaceId,
            name: request.payload?.name ?? "",
            resources: request.payload?.resources ?? {},
            metadata: request.payload?.metadata,
          },
          commandId
        );
      case "START_WORKSPACE":
        return this.provisioner.startWorkspace(workspaceId, commandId);
      case "STOP_WORKSPACE":
        return this.provisioner.stopWorkspace(workspaceId, commandId);
      case "RESTART_WORKSPACE":
        return this.provisioner.restartWorkspace(workspaceId, commandId);
      case "INSPECT_WORKSPACE":
        return this.provisioner.inspectWorkspace(workspaceId);
      case "DESTROY_WORKSPACE":
        return this.provisioner.destroyWorkspace(workspaceId, commandId);
      default:
        throw new InvalidCommandError(
          `Unsupported command '${String(request.commandType)}'.`
        );
    }
  }
}
