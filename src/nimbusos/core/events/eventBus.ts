import type { WorkspaceEvent, WorkspaceEventType } from "../types";

type EventListener = (event: WorkspaceEvent) => void;

export class LocalEventBus {
  private readonly history: WorkspaceEvent[] = [];
  private readonly listeners = new Set<EventListener>();

  constructor(
    private readonly createId: () => string = () =>
      globalThis.crypto.randomUUID(),
    private readonly maxHistory = 500
  ) {
    if (!Number.isInteger(maxHistory) || maxHistory < 1)
      throw new Error("Event history retention must be a positive integer.");
  }

  emit(
    eventType: WorkspaceEventType,
    workspaceId: string,
    payload: Record<string, unknown> = {},
    timestamp = new Date().toISOString()
  ): WorkspaceEvent {
    const event: WorkspaceEvent = {
      eventId: this.createId(),
      eventType,
      timestamp,
      workspaceId,
      payload: structuredClone(payload),
    };
    this.history.push(structuredClone(event));
    if (this.history.length > this.maxHistory) this.history.shift();
    for (const listener of Array.from(this.listeners)) {
      try {
        listener(structuredClone(event));
      } catch {
        /* A UI subscriber cannot break a Core operation. */
      }
    }
    return structuredClone(event);
  }

  list(workspaceId?: string): WorkspaceEvent[] {
    return this.history
      .filter(event => !workspaceId || event.workspaceId === workspaceId)
      .map(event => structuredClone(event));
  }

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
