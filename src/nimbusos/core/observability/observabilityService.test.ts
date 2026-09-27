import { describe, expect, it } from "vitest";
import { LocalEventBus } from "../events/eventBus";
import type { RuntimeCapabilities } from "../types";
import { EventStream } from "./eventStream";
import { ObservabilityService } from "./observabilityService";
import type { ObservabilityInputs } from "./types";

const NOW = "2026-09-27T00:00:00.000Z";

function runtime(overrides: Partial<RuntimeCapabilities> = {}): RuntimeCapabilities {
  return {
    provider: "local-test",
    availability: "NOT_CONFIGURED",
    execution: "NONE",
    supports: {
      create: false,
      start: false,
      stop: false,
      restart: false,
      inspect: false,
      destroy: false,
    },
    hostProcess: false,
    hostFilesystem: false,
    hostTelemetry: false,
    arbitraryUserCode: false,
    message: "No local runtime configured.",
    ...overrides,
  };
}

function inputs(overrides: Partial<ObservabilityInputs> = {}): ObservabilityInputs {
  return {
    ready: Promise.resolve(),
    listWorkspaces: async () => [],
    listCommands: () => [],
    listEvents: () => [],
    listAudit: async () => [],
    inspectResources: async () => [],
    runtimeCapabilities: () => runtime(),
    knowledgeStats: async () => ({
      sources: 0,
      documents: 0,
      chunks: 0,
      excluded: 0,
      errors: 0,
      stale: 0,
      lastIndexedAt: null,
      indexDurationMs: null,
    }),
    auditStorage: "IN_MEMORY",
    ...overrides,
  };
}

describe("EventStream", () => {
  it("normalizes source/severity/correlation and redacts secret payload values", () => {
    let id = 0;
    const bus = new LocalEventBus(() => `event-${++id}`);
    bus.emit(
      "COMMAND_FAILED",
      "ws-1",
      {
        commandId: "cmd-1",
        token: "sk-super-secret-token-value",
        nested: { password: "should-not-appear" },
      },
      NOW
    );
    const stream = new EventStream(bus);
    const snapshot = stream.query({ sources: ["COMMAND"], severities: ["ERROR"] });
    expect(snapshot.retention).toBe("SESSION_ONLY");
    expect(snapshot.events[0]).toMatchObject({
      eventId: "event-1",
      source: "COMMAND",
      severity: "ERROR",
      workspaceId: "ws-1",
      commandId: "cmd-1",
      correlationId: "cmd-1",
      payload: {
        token: "[REDACTED]",
        nested: { password: "[REDACTED]" },
      },
    });
  });

  it("keeps history bounded and returns only the requested tail", () => {
    let id = 0;
    const bus = new LocalEventBus(() => `event-${++id}`, 2);
    bus.emit("COMMAND_QUEUED", "ws-1", {}, "2026-09-27T00:00:00.000Z");
    bus.emit("COMMAND_STARTED", "ws-1", {}, "2026-09-27T00:00:01.000Z");
    bus.emit("COMMAND_EXECUTED", "ws-1", {}, "2026-09-27T00:00:02.000Z");
    const snapshot = new EventStream(bus).query({ limit: 2 });
    expect(snapshot.count).toBe(2);
    expect(snapshot.events.map(event => event.eventType)).toEqual(["COMMAND_STARTED", "COMMAND_EXECUTED"]);
    expect(bus.list()).toHaveLength(2);
  });

  it("normalizes subscribed events instead of exposing the raw bus contract", () => {
    const bus = new LocalEventBus(() => "event-1");
    let received: { source: string; severity: string; correlationId?: string } | null = null;
    const unsubscribe = new EventStream(bus).subscribe(event => {
      received = event;
    });
    bus.emit("COMMAND_FAILED", "ws-1", { commandId: "cmd-1" }, NOW);
    unsubscribe();
    expect(received).toMatchObject({
      source: "COMMAND",
      severity: "ERROR",
      correlationId: "cmd-1",
    });
  });
});

describe("ObservabilityService", () => {
  it("does not report absent providers as healthy", async () => {
    const service = new ObservabilityService(inputs(), new EventStream(new LocalEventBus(() => "id")));
    const report = await service.health();
    const status = new Map(report.components.map(component => [component.id, component.status]));
    expect(status.get("CORE")).toBe("HEALTHY");
    expect(status.get("WORKSPACE")).toBe("UNKNOWN");
    expect(status.get("RUNTIME")).toBe("NOT_CONFIGURED");
    expect(status.get("AI")).toBe("NOT_CONFIGURED");
    expect(status.get("PROJECT")).toBe("NOT_CONFIGURED");
    expect(status.get("KNOWLEDGE")).toBe("NOT_CONFIGURED");
    expect(report.status).toBe("DEGRADED");
  });

  it("labels available Runtime as capability readiness, not host operational health", async () => {
    const service = new ObservabilityService(
      inputs({ runtimeCapabilities: () => runtime({ availability: "AVAILABLE", execution: "BROWSER_WEB_WORKER", message: "Fixed Worker capability is available." }) }),
      new EventStream(new LocalEventBus(() => "id"))
    );
    const report = await service.health();
    expect(report.components.find(component => component.id === "RUNTIME")?.message).toContain("Capability ready");
    expect(report.components.find(component => component.id === "RUNTIME")?.message).toContain("host operational health");
  });

  it("derives metrics from actual command, event, audit, resource and knowledge inputs", async () => {
    const bus = new LocalEventBus(() => "event-1");
    bus.emit("COMMAND_EXECUTED", "ws-1", { commandId: "cmd-1" }, NOW);
    const service = new ObservabilityService(
      inputs({
        listWorkspaces: async () => [{ id: "ws-1", status: "READY" } as never],
        listCommands: () => [
          { commandId: "cmd-1", workspaceId: "ws-1", commandType: "INSPECT_WORKSPACE", requestedAt: NOW, status: "SUCCEEDED", startedAt: NOW, completedAt: NOW, result: null, error: null },
        ],
        listEvents: () => bus.list(),
        knowledgeStats: async () => ({ sources: 2, documents: 1, chunks: 3, excluded: 1, errors: 0, stale: 0, lastIndexedAt: NOW, indexDurationMs: null }),
      }),
      new EventStream(bus)
    );
    const metrics = await service.metrics();
    expect(metrics.workspaces.total).toBe(1);
    expect(metrics.commands.succeeded).toBe(1);
    expect(metrics.events.sessionTotal).toBe(1);
    expect(metrics.knowledge?.documents).toBe(1);
  });
});
