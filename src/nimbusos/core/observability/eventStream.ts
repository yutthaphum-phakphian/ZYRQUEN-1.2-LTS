import type { LocalEventBus } from "../events/eventBus";
import type { WorkspaceEvent } from "../types";
import { redactSensitive } from "../security/redaction";
import type {
  EventSeverity,
  EventSource,
  EventStreamQuery,
  EventStreamSnapshot,
  ObservabilityEvent,
} from "./types";

function isTimestamp(value: string | undefined): boolean {
  return value === undefined || Number.isFinite(Date.parse(value));
}

function sourceFor(eventType: string): EventSource {
  if (eventType.startsWith("COMMAND_")) return "COMMAND";
  if (eventType.startsWith("WORKSPACE_") || eventType === "STATE_TRANSITIONED") return "WORKSPACE";
  if (eventType.startsWith("RESOURCE_")) return "RESOURCE";
  return "CORE";
}

function severityFor(eventType: string): EventSeverity {
  if (eventType === "COMMAND_FAILED" || eventType === "WORKSPACE_ERROR") return "ERROR";
  if (eventType === "COMMAND_STARTED" || eventType === "COMMAND_EXECUTED" || eventType === "STATE_TRANSITIONED") return "NOTICE";
  if (eventType === "COMMAND_QUEUED" || eventType === "RESOURCE_ALLOCATED" || eventType === "RESOURCE_RELEASED") return "INFO";
  return "INFO";
}

function stringField(payload: Record<string, unknown>, key: string): string | undefined {
  return typeof payload[key] === "string" && payload[key] ? payload[key] : undefined;
}

function normalize(event: WorkspaceEvent): ObservabilityEvent {
  const payload = redactSensitive(event.payload) as Record<string, unknown>;
  const source = sourceFor(event.eventType);
  return {
    eventId: event.eventId,
    timestamp: event.timestamp,
    eventType: event.eventType,
    source,
    severity: severityFor(event.eventType),
    workspaceId: event.workspaceId || undefined,
    projectId: stringField(payload, "projectId"),
    commandId: stringField(payload, "commandId"),
    requestId: stringField(payload, "requestId"),
    correlationId: stringField(payload, "correlationId") ?? stringField(payload, "commandId"),
    payload,
  };
}

export class EventStream {
  constructor(private readonly events: LocalEventBus) {}

  query(query: EventStreamQuery = {}): EventStreamSnapshot {
    if (!isTimestamp(query.since) || !isTimestamp(query.until))
      throw new Error("Event Stream time filters must be valid timestamps.");
    const limit = Math.min(500, Math.max(1, query.limit ?? 100));
    const filtered = this.events
      .list(query.workspaceId)
      .map(normalize)
      .filter(event => !query.eventTypes || query.eventTypes.includes(event.eventType))
      .filter(event => !query.sources || query.sources.includes(event.source))
      .filter(event => !query.severities || query.severities.includes(event.severity))
      .filter(event => !query.since || event.timestamp >= query.since)
      .filter(event => !query.until || event.timestamp <= query.until)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.eventId.localeCompare(b.eventId));
    const events = filtered.slice(Math.max(0, filtered.length - limit)).map(event => structuredClone(event));
    return {
      events,
      source: "LOCAL_EVENT_BUS",
      retention: "SESSION_ONLY",
      count: events.length,
      oldestAt: events[0]?.timestamp ?? null,
      newestAt: events.at(-1)?.timestamp ?? null,
    };
  }

  subscribe(listener: (event: ObservabilityEvent) => void): () => void {
    return this.events.subscribe(event => listener(normalize(event)));
  }
}
