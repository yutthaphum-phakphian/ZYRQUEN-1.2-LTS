import {
  ResourceError,
  ResourceUnavailableError,
  ValidationError,
} from "../errors";
import type { PlatformConfiguration } from "../configuration/config";
import type {
  ResourceCapacity,
  ResourceKind,
  ResourceQuantities,
} from "../types";

export const RESOURCE_KINDS: readonly ResourceKind[] = [
  "CPU",
  "MEMORY",
  "STORAGE",
  "PROCESS",
  "PORT",
  "RUNTIME_INSTANCE",
];

export const ZERO_RESOURCES: ResourceQuantities = {
  CPU: 0,
  MEMORY: 0,
  STORAGE: 0,
  PROCESS: 0,
  PORT: 0,
  RUNTIME_INSTANCE: 0,
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export class ResourceEngine {
  private readonly allocations = new Map<string, ResourceQuantities>();
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly configuration: PlatformConfiguration) {}

  validate(requested: Partial<ResourceQuantities>): ResourceQuantities {
    if (!isPlainRecord(requested))
      throw new ValidationError("Resource request must be a plain object.");
    const unknownKinds = Object.keys(requested).filter(
      kind => !RESOURCE_KINDS.includes(kind as ResourceKind)
    );
    if (unknownKinds.length)
      throw new ValidationError(
        `Unsupported resource kind '${unknownKinds[0]}'.`
      );

    const normalized: ResourceQuantities = { ...ZERO_RESOURCES };
    for (const kind of RESOURCE_KINDS) {
      const value = requested[kind] ?? 0;
      if (!Number.isFinite(value) || value < 0)
        throw new ValidationError(
          `Resource request '${kind}' must be a finite non-negative number.`
        );
      normalized[kind] = value;
      const limit = this.configuration.resources.limits[kind];
      if (limit <= 0 && value > 0)
        throw new ResourceUnavailableError(kind, value, limit);
    }
    return normalized;
  }

  async allocate(
    workspaceId: string,
    requested: Partial<ResourceQuantities>
  ): Promise<ResourceQuantities> {
    const normalized = this.validate(requested);
    return this.withQueue(() => {
      if (this.allocations.has(workspaceId))
        throw new ResourceError(
          "RESOURCE_ALREADY_ALLOCATED",
          `Resources are already allocated to '${workspaceId}'.`
        );
      const totals = this.sumAllocations();
      for (const kind of RESOURCE_KINDS) {
        const available =
          this.configuration.resources.limits[kind] - totals[kind];
        if (normalized[kind] > available)
          throw new ResourceUnavailableError(
            kind,
            normalized[kind],
            Math.max(0, available)
          );
      }
      this.allocations.set(workspaceId, normalized);
      return { ...normalized };
    });
  }

  async release(
    workspaceId: string,
    beforeCommit?: (released: ResourceQuantities) => void | Promise<void>
  ): Promise<ResourceQuantities> {
    return this.withQueue(async () => {
      const allocation = this.allocations.get(workspaceId);
      const released = allocation ? { ...allocation } : { ...ZERO_RESOURCES };
      await beforeCommit?.({ ...released });
      if (allocation) this.allocations.delete(workspaceId);
      return released;
    });
  }

  async inspect(): Promise<ResourceCapacity[]> {
    const totals = this.sumAllocations();
    return RESOURCE_KINDS.map(kind => ({
      kind,
      requested: totals[kind],
      allocated: totals[kind],
      used: null,
      available: Math.max(
        0,
        this.configuration.resources.limits[kind] - totals[kind]
      ),
      limit: this.configuration.resources.limits[kind],
      unit: this.configuration.resources.units[kind],
      quotaState: "CONFIGURED",
      usageState: "UNAVAILABLE",
    }));
  }

  async restore(
    allocations: Array<{ workspaceId: string; resources: ResourceQuantities }>
  ): Promise<void> {
    if (!Array.isArray(allocations))
      throw new ValidationError(
        "Stored resource allocations must be an array."
      );
    await this.withQueue(() => {
      const next = new Map<string, ResourceQuantities>();
      const totals = { ...ZERO_RESOURCES };
      for (const allocation of allocations) {
        if (!isPlainRecord(allocation))
          throw new ValidationError("Stored resource allocation is invalid.");
        if (
          typeof allocation.workspaceId !== "string" ||
          !allocation.workspaceId.trim() ||
          next.has(allocation.workspaceId)
        ) {
          throw new ValidationError(
            `Stored resource allocation Workspace id '${allocation.workspaceId}' is invalid or duplicated.`
          );
        }
        if (!isPlainRecord(allocation.resources))
          throw new ValidationError(
            `Stored resource allocation for '${allocation.workspaceId}' must be a plain object.`
          );
        const resourceKeys = Object.keys(allocation.resources);
        if (
          RESOURCE_KINDS.some(
            kind => !Object.hasOwn(allocation.resources, kind)
          ) ||
          resourceKeys.some(
            kind => !RESOURCE_KINDS.includes(kind as ResourceKind)
          )
        ) {
          throw new ValidationError(
            `Stored resource allocation for '${allocation.workspaceId}' is incomplete or contains unsupported kinds.`
          );
        }
        const normalized = this.validate(
          allocation.resources as Partial<ResourceQuantities>
        );
        next.set(allocation.workspaceId, normalized);
        for (const kind of RESOURCE_KINDS) totals[kind] += normalized[kind];
      }
      for (const kind of RESOURCE_KINDS) {
        if (totals[kind] > this.configuration.resources.limits[kind]) {
          throw new ResourceUnavailableError(
            kind,
            totals[kind],
            this.configuration.resources.limits[kind]
          );
        }
      }
      this.allocations.clear();
      next.forEach((resources, id) => this.allocations.set(id, resources));
    });
  }

  private sumAllocations(): ResourceQuantities {
    const totals = { ...ZERO_RESOURCES };
    for (const allocation of Array.from(this.allocations.values())) {
      for (const kind of RESOURCE_KINDS) totals[kind] += allocation[kind];
    }
    return totals;
  }

  private async withQueue<T>(operation: () => T | Promise<T>): Promise<T> {
    const previous = this.queue;
    let release!: () => void;
    this.queue = new Promise<void>(resolve => {
      release = resolve;
    });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }
}
