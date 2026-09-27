import type {
  AuditRecord,
  CommandRecord,
  ResourceCapacity,
  RuntimeCapabilities,
  Workspace,
  WorkspaceEvent,
  WorkspaceEventType,
} from "../types";
import type { KnowledgeIndexStats } from "../knowledge/types";

export type ObservationState =
  | "HEALTHY"
  | "DEGRADED"
  | "UNAVAILABLE"
  | "UNKNOWN"
  | "NOT_CONFIGURED"
  | "UNSUPPORTED";

export type EventSeverity =
  | "DEBUG"
  | "INFO"
  | "NOTICE"
  | "WARNING"
  | "ERROR"
  | "CRITICAL";

export type EventSource =
  | "WORKSPACE"
  | "COMMAND"
  | "RUNTIME"
  | "EXECUTION"
  | "PROJECT"
  | "SERVICE"
  | "PROCESS"
  | "TASK"
  | "AI"
  | "KNOWLEDGE"
  | "AUDIT"
  | "SYSTEM"
  | "RESOURCE"
  | "CORE";

export interface EventStreamQuery {
  workspaceId?: string;
  eventTypes?: WorkspaceEventType[];
  sources?: EventSource[];
  severities?: EventSeverity[];
  since?: string;
  until?: string;
  limit?: number;
}

export interface ObservabilityEvent {
  eventId: string;
  timestamp: string;
  eventType: WorkspaceEventType;
  source: EventSource;
  severity: EventSeverity;
  workspaceId?: string;
  projectId?: string;
  commandId?: string;
  requestId?: string;
  correlationId?: string;
  payload: Record<string, unknown>;
}

export interface EventStreamSnapshot {
  events: ObservabilityEvent[];
  source: "LOCAL_EVENT_BUS";
  retention: "SESSION_ONLY";
  count: number;
  oldestAt: string | null;
  newestAt: string | null;
}

export interface SystemHealthCheck {
  id:
    | "CORE"
    | "WORKSPACE"
    | "RUNTIME"
    | "EXECUTION"
    | "PROJECT"
    | "SERVICE"
    | "PROCESS"
    | "TASK"
    | "AI"
    | "KNOWLEDGE"
    | "AUDIT";
  status: ObservationState;
  message: string;
  observedAt: string;
  evidence: Record<string, unknown>;
}

export interface SystemHealthReport {
  status: ObservationState;
  observedAt: string;
  components: SystemHealthCheck[];
  source: "LOCAL_CORE";
  limitations: string[];
}

export interface ObservabilityMetrics {
  observedAt: string;
  source: "LOCAL_CORE";
  workspaces: {
    total: number;
    active: number;
    errors: number;
  };
  commands: {
    liveTotal: number;
    succeeded: number;
    failed: number;
    running: number;
  };
  events: {
    sessionTotal: number;
    byType: Record<string, number>;
  };
  audit: {
    durableTotal: number;
    commandRecords: number;
    knowledgeRecords: number;
  };
  resources: {
    capacities: ResourceCapacity[];
    usageState: "UNAVAILABLE";
  };
  runtime: {
    provider: string;
    availability: RuntimeCapabilities["availability"];
  };
  knowledge: KnowledgeIndexStats | null;
  limitations: string[];
}

export interface ObservabilityInputs {
  ready: Promise<void>;
  listWorkspaces(): Promise<Workspace[]>;
  listCommands(): CommandRecord[];
  listEvents(): WorkspaceEvent[];
  listAudit(): Promise<AuditRecord[]>;
  inspectResources(): Promise<ResourceCapacity[]>;
  runtimeCapabilities(): RuntimeCapabilities;
  knowledgeStats?: (workspaceId: string) => Promise<KnowledgeIndexStats>;
  auditStorage: "LOCAL_STORAGE" | "IN_MEMORY";
}
