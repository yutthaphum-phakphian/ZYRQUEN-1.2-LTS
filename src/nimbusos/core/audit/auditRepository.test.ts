import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import type { CommandRecord } from "../types";
import type { StorageLike } from "../workspace/repository";
import {
  InMemoryAuditRepository,
  LocalStorageAuditRepository,
  validateAuditRecord,
} from "./auditRepository";

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

function record(overrides: Partial<CommandRecord> = {}): CommandRecord {
  return {
    commandId: "cmd-1",
    workspaceId: "ws-1",
    commandType: "START_WORKSPACE",
    requestedAt: "2026-09-27T00:00:00.000Z",
    status: "SUCCEEDED",
    startedAt: "2026-09-27T00:00:00.100Z",
    completedAt: "2026-09-27T00:00:00.200Z",
    result: null,
    error: null,
    ...overrides,
  };
}

describe("validateAuditRecord", () => {
  it("accepts a well-formed terminal CommandRecord", () => {
    expect(validateAuditRecord(record())).toEqual(record());
  });

  it("rejects a non-terminal status", () => {
    expect(() => validateAuditRecord(record({ status: "PENDING" }))).toThrow(
      ValidationError
    );
  });

  it("rejects an unknown commandType", () => {
    expect(() =>
      // @ts-expect-error intentionally invalid for the test
      validateAuditRecord(record({ commandType: "NOT_A_COMMAND" }))
    ).toThrow(ValidationError);
  });

  it("rejects a missing workspaceId", () => {
    expect(() => validateAuditRecord(record({ workspaceId: "" }))).toThrow(
      ValidationError
    );
  });
});

describe("InMemoryAuditRepository", () => {
  it("appends and lists records, newest first", async () => {
    const repo = new InMemoryAuditRepository();
    await repo.append(record({ commandId: "cmd-1", completedAt: "2026-09-27T00:00:01.000Z" }));
    await repo.append(record({ commandId: "cmd-2", completedAt: "2026-09-27T00:00:02.000Z" }));
    const all = await repo.list();
    expect(all.map(r => ("commandId" in r ? r.commandId : r.auditId))).toEqual(["cmd-2", "cmd-1"]);
  });

  it("filters by workspaceId", async () => {
    const repo = new InMemoryAuditRepository();
    await repo.append(record({ commandId: "cmd-1", workspaceId: "ws-a" }));
    await repo.append(record({ commandId: "cmd-2", workspaceId: "ws-b" }));
    const filtered = await repo.list("ws-a");
    expect(filtered.map(r => ("commandId" in r ? r.commandId : r.auditId))).toEqual(["cmd-1"]);
  });

  it("is idempotent per commandId (append is a no-op for a duplicate id)", async () => {
    const repo = new InMemoryAuditRepository();
    await repo.append(record({ commandId: "cmd-1" }));
    await repo.append(record({ commandId: "cmd-1", result: "different" }));
    const all = await repo.list();
    expect(all).toHaveLength(1);
  });

  it("redacts sensitive result fields before persistence", async () => {
    const repo = new InMemoryAuditRepository();
    await repo.append(
      record({
        result: { token: "sk-super-secret-token-value", message: "safe" },
      })
    );
    const [stored] = await repo.list();
    expect(stored).toMatchObject({
      result: { token: "[REDACTED]", message: "safe" },
    });
  });
});

describe("LocalStorageAuditRepository", () => {
  it("persists records across repository instances (durability)", async () => {
    const storage = new MemoryStorage();
    const first = new LocalStorageAuditRepository(storage);
    await first.append(record({ commandId: "cmd-1" }));

    const second = new LocalStorageAuditRepository(storage);
    const all = await second.list();
    expect(all.map(r => ("commandId" in r ? r.commandId : r.auditId))).toEqual(["cmd-1"]);
  });

  it("caps retained records and drops the oldest first", async () => {
    const storage = new MemoryStorage();
    const repo = new LocalStorageAuditRepository(storage, "test-key", 2);
    await repo.append(
      record({ commandId: "cmd-1", completedAt: "2026-09-27T00:00:01.000Z" })
    );
    await repo.append(
      record({ commandId: "cmd-2", completedAt: "2026-09-27T00:00:02.000Z" })
    );
    await repo.append(
      record({ commandId: "cmd-3", completedAt: "2026-09-27T00:00:03.000Z" })
    );
    const all = await repo.list();
    expect(all.map(r => ("commandId" in r ? r.commandId : r.auditId)).sort()).toEqual(["cmd-2", "cmd-3"]);
  });

  it("filters by workspaceId across a persisted store", async () => {
    const storage = new MemoryStorage();
    const repo = new LocalStorageAuditRepository(storage);
    await repo.append(record({ commandId: "cmd-1", workspaceId: "ws-a" }));
    await repo.append(record({ commandId: "cmd-2", workspaceId: "ws-b" }));
    const filtered = await repo.list("ws-b");
    expect(filtered.map(r => ("commandId" in r ? r.commandId : r.auditId))).toEqual(["cmd-2"]);
  });
});
