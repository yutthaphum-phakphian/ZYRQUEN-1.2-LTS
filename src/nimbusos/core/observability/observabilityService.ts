import type { AuditRecord, CommandRecord, RuntimeCapabilities, WorkspaceEvent } from "../types";
import type { EventStream } from "./eventStream";
import type {
  EventStreamSnapshot,
  ObservationState,
  ObservabilityInputs,
  ObservabilityMetrics,
  SystemHealthCheck,
  SystemHealthReport,
} from "./types";

function now(): string {
  return new Date().toISOString();
}

function countByType(events: WorkspaceEvent[]): Record<string, number> {
  return events.reduce<Record<string, number>>((counts, event) => {
    counts[event.eventType] = (counts[event.eventType] ?? 0) + 1;
    return counts;
  }, {});
}

function isKnowledgeRecord(record: AuditRecord): boolean {
  return "recordType" in record && record.recordType === "KNOWLEDGE";
}

function commandCounts(commands: CommandRecord[]) {
  return {
    liveTotal: commands.length,
    succeeded: commands.filter(command => command.status === "SUCCEEDED").length,
    failed: commands.filter(command => command.status === "FAILED").length,
    running: commands.filter(command => command.status === "RUNNING" || command.status === "PENDING").length,
  };
}

function check(
  id: SystemHealthCheck["id"],
  status: ObservationState,
  message: string,
  observedAt: string,
  evidence: Record<string, unknown> = {}
): SystemHealthCheck {
  return { id, status, message, observedAt, evidence };
}

function runtimeState(runtime: RuntimeCapabilities): ObservationState {
  if (runtime.availability === "AVAILABLE") return "HEALTHY";
  if (runtime.availability === "NOT_CONFIGURED") return "NOT_CONFIGURED";
  if (runtime.availability === "UNSUPPORTED") return "UNSUPPORTED";
  return "UNAVAILABLE";
}

export class ObservabilityService {
  constructor(
    private readonly inputs: ObservabilityInputs,
    private readonly eventStream: EventStream
  ) {}

  eventStreamSnapshot(query: Parameters<EventStream["query"]>[0] = {}): EventStreamSnapshot {
    return this.eventStream.query(query);
  }

  async metrics(): Promise<ObservabilityMetrics> {
    await this.inputs.ready;
    const observedAt = now();
    const [workspaces, audit, resources] = await Promise.all([
      this.inputs.listWorkspaces(),
      this.inputs.listAudit(),
      this.inputs.inspectResources(),
    ]);
    const commands = this.inputs.listCommands();
    const events = this.inputs.listEvents();
    const runtime = this.inputs.runtimeCapabilities();
    const knowledgeWorkspace = workspaces.find(workspace => workspace.status !== "DESTROYED");
    const knowledge = knowledgeWorkspace && this.inputs.knowledgeStats
      ? await this.inputs.knowledgeStats(knowledgeWorkspace.id)
      : null;
    return {
      observedAt,
      source: "LOCAL_CORE",
      workspaces: {
        total: workspaces.filter(workspace => workspace.status !== "DESTROYED").length,
        active: workspaces.filter(workspace => ["CREATING", "INITIALIZING", "READY", "STARTING", "RUNNING", "RESTARTING"].includes(workspace.status)).length,
        errors: workspaces.filter(workspace => workspace.status === "ERROR").length,
      },
      commands: commandCounts(commands),
      events: { sessionTotal: events.length, byType: countByType(events) },
      audit: {
        durableTotal: audit.length,
        commandRecords: audit.filter(record => !isKnowledgeRecord(record)).length,
        knowledgeRecords: audit.filter(isKnowledgeRecord).length,
      },
      resources: { capacities: resources, usageState: "UNAVAILABLE" },
      runtime: { provider: runtime.provider, availability: runtime.availability },
      knowledge,
      limitations: this.limitations(),
    };
  }

  async health(): Promise<SystemHealthReport> {
    const observedAt = now();
    const components: SystemHealthCheck[] = [];
    try {
      await this.inputs.ready;
      components.push(check("CORE", "HEALTHY", "Platform readiness completed.", observedAt, { source: "Platform.ready" }));
    } catch (error) {
      components.push(check("CORE", "UNAVAILABLE", error instanceof Error ? error.message : String(error), observedAt));
      return this.report(components, observedAt);
    }

    try {
      const workspaces = await this.inputs.listWorkspaces();
      const visible = workspaces.filter(workspace => workspace.status !== "DESTROYED");
      const errors = visible.filter(workspace => workspace.status === "ERROR");
      components.push(check(
        "WORKSPACE",
        visible.length === 0 ? "UNKNOWN" : errors.length ? "DEGRADED" : "HEALTHY",
        visible.length === 0 ? "No Workspace evidence is available." : errors.length ? `${errors.length} Workspace(s) are in ERROR.` : "Workspace state is readable from the repository.",
        observedAt,
        { count: visible.length, errorCount: errors.length, statuses: visible.map(workspace => workspace.status) }
      ));
    } catch (error) {
      components.push(check("WORKSPACE", "UNAVAILABLE", error instanceof Error ? error.message : String(error), observedAt));
    }

    const runtime = this.inputs.runtimeCapabilities();
    components.push(check(
      "RUNTIME",
      runtimeState(runtime),
      runtime.availability === "AVAILABLE"
        ? `Capability ready: ${runtime.message} ไม่ใช่ active runtime หรือ host operational health`
        : runtime.message,
      observedAt,
      { provider: runtime.provider, availability: runtime.availability, execution: runtime.execution, supports: runtime.supports, hostProcess: runtime.hostProcess, hostFilesystem: runtime.hostFilesystem, hostTelemetry: runtime.hostTelemetry }
    ));

    const commands = this.inputs.listCommands();
    const commandSummary = commandCounts(commands);
    components.push(check(
      "EXECUTION",
      commands.length === 0 ? "UNKNOWN" : commandSummary.failed > 0 ? "DEGRADED" : "HEALTHY",
      commands.length === 0 ? "No execution evidence is available." : commandSummary.failed > 0 ? `${commandSummary.failed} execution(s) failed.` : "Execution results are available from CommandEngine.",
      observedAt,
      commandSummary
    ));

    components.push(check("PROJECT", "NOT_CONFIGURED", "No Project registry/provider exists in this foundation.", observedAt));
    components.push(check("SERVICE", "NOT_CONFIGURED", "No Service registry/provider exists in this foundation.", observedAt));
    components.push(check("PROCESS", "UNSUPPORTED", "Local Runtime does not expose host process telemetry or process execution.", observedAt, { hostProcess: runtime.hostProcess }));
    components.push(check("TASK", "NOT_CONFIGURED", "No Task registry/provider exists in this foundation.", observedAt));
    components.push(check("AI", "NOT_CONFIGURED", "No AI provider or local AI runtime exists in this foundation.", observedAt));

    if (this.inputs.knowledgeStats) {
      try {
        const workspaces = await this.inputs.listWorkspaces();
        const workspace = workspaces.find(item => item.status !== "DESTROYED");
        if (!workspace) components.push(check("KNOWLEDGE", "NOT_CONFIGURED", "No active Workspace scope is available for Knowledge health.", observedAt));
        else {
          const stats = await this.inputs.knowledgeStats(workspace.id);
          components.push(check(
            "KNOWLEDGE",
            stats.errors > 0 ? "DEGRADED" : stats.sources === 0 ? "UNKNOWN" : "HEALTHY",
            stats.errors > 0 ? "Knowledge index has source errors." : stats.sources === 0 ? "Knowledge source evidence is empty." : "Knowledge index is readable from KnowledgeRepository.",
            observedAt,
            { ...stats }
          ));
        }
      } catch (error) {
        components.push(check("KNOWLEDGE", "UNAVAILABLE", error instanceof Error ? error.message : String(error), observedAt));
      }
    } else {
      components.push(check("KNOWLEDGE", "NOT_CONFIGURED", "Knowledge health adapter is not configured.", observedAt));
    }

    try {
      const audit = await this.inputs.listAudit();
      components.push(check(
        "AUDIT",
        this.inputs.auditStorage === "LOCAL_STORAGE" ? "HEALTHY" : "DEGRADED",
        this.inputs.auditStorage === "LOCAL_STORAGE" ? "Durable local audit storage is readable." : "Audit repository is readable but in-memory in this host.",
        observedAt,
        { count: audit.length, storage: this.inputs.auditStorage }
      ));
    } catch (error) {
      components.push(check("AUDIT", "UNAVAILABLE", error instanceof Error ? error.message : String(error), observedAt));
    }
    return this.report(components, observedAt);
  }

  async workspaceHealth(workspaceId: string): Promise<SystemHealthCheck> {
    const observedAt = now();
    await this.inputs.ready;
    const workspace = (await this.inputs.listWorkspaces()).find(item => item.id === workspaceId && item.status !== "DESTROYED");
    if (!workspace)
      return check("WORKSPACE", "UNKNOWN", "No Workspace evidence exists for this id.", observedAt, { workspaceId });
    const status: ObservationState = workspace.status === "ERROR" ? "DEGRADED" : "HEALTHY";
    return check(
      "WORKSPACE",
      status,
      status === "HEALTHY" ? `Workspace lifecycle state is ${workspace.status}.` : workspace.error?.message ?? "Workspace is in ERROR.",
      observedAt,
      { workspaceId, lifecycleState: workspace.status, runtime: workspace.runtime, error: workspace.error }
    );
  }

  private report(components: SystemHealthCheck[], observedAt: string): SystemHealthReport {
    const status = components.some(component => component.status === "UNAVAILABLE")
      ? "UNAVAILABLE"
      : components.some(component => component.status !== "HEALTHY")
        ? "DEGRADED"
        : "HEALTHY";
    return {
      status,
      observedAt,
      components,
      source: "LOCAL_CORE",
      limitations: this.limitations(),
    };
  }

  private limitations(): string[] {
    return [
      "Metrics are derived from local Core state, not host telemetry.",
      "Event Stream retention is session-only and resets on page reload.",
      "Runtime hostProcess, hostFilesystem, hostTelemetry, and usage values remain honest capability boundaries.",
      "Project, Service, Process, Task, and AI providers are not configured in this foundation.",
      "Health is a derived operational read model, not a provider SLA or distributed monitor.",
    ];
  }
}
