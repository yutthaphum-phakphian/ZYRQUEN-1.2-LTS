import { ValidationError } from "../errors";
import { RESOURCE_KINDS, ZERO_RESOURCES } from "../resources/resourceEngine";
import {
  WORKSPACE_STATUSES,
  type ResourceQuantities,
  type Workspace,
} from "../types";

export interface NewWorkspaceRecord {
  id: string;
  name: string;
  runtimeProvider: string;
  requestedResources: ResourceQuantities;
  metadata?: Workspace["metadata"];
  createdAt: string;
}

export function workspaceNeedsCleanup(workspace: Workspace): boolean {
  return (
    workspace.status === "ERROR" &&
    (workspace.runtime.instanceId !== null ||
      RESOURCE_KINDS.some(kind => workspace.resources.allocated[kind] > 0))
  );
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

function assertResourceQuantities(
  value: unknown,
  field: string
): asserts value is ResourceQuantities {
  if (!isPlainRecord(value))
    throw new ValidationError(`${field} must be a resource quantity object.`);
  for (const kind of RESOURCE_KINDS) {
    const amount = value[kind];
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) {
      throw new ValidationError(
        `${field}.${kind} must be a finite non-negative number.`
      );
    }
  }
}

function assertMetadata(
  value: unknown
): asserts value is Workspace["metadata"] {
  if (!isPlainRecord(value))
    throw new ValidationError("Workspace metadata must be a plain object.");
  for (const [key, item] of Object.entries(value)) {
    if (
      !key.trim() ||
      (!["string", "number", "boolean"].includes(typeof item) && item !== null)
    ) {
      throw new ValidationError(
        `Workspace metadata '${key}' must be a string, finite number, boolean, or null.`
      );
    }
    if (typeof item === "number" && !Number.isFinite(item)) {
      throw new ValidationError(`Workspace metadata '${key}' must be finite.`);
    }
  }
}

export function createWorkspaceRecord(input: NewWorkspaceRecord): Workspace {
  const id = input.id.trim();
  const name = input.name.trim();
  if (!id || id.length > 128)
    throw new ValidationError("Workspace id must contain 1–128 characters.");
  if (!name || name.length > 80)
    throw new ValidationError("Workspace name must contain 1–80 characters.");
  if (!input.runtimeProvider.trim())
    throw new ValidationError("Runtime adapter identifier is required.");
  assertResourceQuantities(input.requestedResources, "requestedResources");
  const metadata = input.metadata ?? {};
  assertMetadata(metadata);
  if (!isTimestamp(input.createdAt))
    throw new ValidationError("Workspace createdAt must be a valid timestamp.");

  return validateWorkspace({
    id,
    name,
    status: "CREATING",
    runtime: {
      provider: input.runtimeProvider.trim(),
      instanceId: null,
      availability: "NOT_CONFIGURED",
    },
    resources: {
      requested: { ...input.requestedResources },
      allocated: { ...ZERO_RESOURCES },
    },
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    lastActivityAt: input.createdAt,
    metadata: { ...metadata },
    error: null,
  });
}

export function validateWorkspace(value: unknown): Workspace {
  if (!isPlainRecord(value))
    throw new ValidationError("Workspace must be a plain record.");
  if (
    typeof value.id !== "string" ||
    !value.id.trim() ||
    value.id.length > 128
  ) {
    throw new ValidationError("Workspace id must contain 1–128 characters.");
  }
  if (
    typeof value.name !== "string" ||
    !value.name.trim() ||
    value.name.trim().length > 80
  ) {
    throw new ValidationError("Workspace name must contain 1–80 characters.");
  }
  if (
    typeof value.status !== "string" ||
    !WORKSPACE_STATUSES.includes(
      value.status as (typeof WORKSPACE_STATUSES)[number]
    )
  ) {
    throw new ValidationError(
      "Workspace status is not a supported lifecycle state."
    );
  }
  if (!isPlainRecord(value.runtime))
    throw new ValidationError("Workspace runtime reference is invalid.");
  if (
    typeof value.runtime.provider !== "string" ||
    !value.runtime.provider.trim()
  ) {
    throw new ValidationError(
      "Workspace runtime adapter identifier is required."
    );
  }
  if (
    value.runtime.instanceId !== null &&
    (typeof value.runtime.instanceId !== "string" ||
      !value.runtime.instanceId.trim())
  ) {
    throw new ValidationError(
      "Workspace runtime instanceId must be null or a non-empty string."
    );
  }
  if (
    !["AVAILABLE", "NOT_CONFIGURED", "UNAVAILABLE", "UNSUPPORTED"].includes(
      String(value.runtime.availability)
    )
  ) {
    throw new ValidationError("Workspace runtime availability is invalid.");
  }
  if (!isPlainRecord(value.resources))
    throw new ValidationError("Workspace resources are invalid.");
  assertResourceQuantities(value.resources.requested, "resources.requested");
  assertResourceQuantities(value.resources.allocated, "resources.allocated");
  if (
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.updatedAt) ||
    !isTimestamp(value.lastActivityAt)
  ) {
    throw new ValidationError("Workspace lifecycle timestamps must be valid.");
  }
  if (
    Date.parse(value.updatedAt) < Date.parse(value.createdAt) ||
    Date.parse(value.lastActivityAt) < Date.parse(value.createdAt)
  ) {
    throw new ValidationError(
      "Workspace update and activity timestamps cannot precede creation."
    );
  }
  if (!isPlainRecord(value.metadata))
    throw new ValidationError("Workspace metadata must be a plain object.");
  assertMetadata(value.metadata);
  if (value.error !== null) {
    if (
      !isPlainRecord(value.error) ||
      typeof value.error.code !== "string" ||
      !value.error.code.trim() ||
      typeof value.error.message !== "string" ||
      !value.error.message.trim() ||
      !isTimestamp(value.error.occurredAt)
    ) {
      throw new ValidationError("Workspace error details are invalid.");
    }
  }
  return structuredClone(value) as unknown as Workspace;
}
