export const WORKSPACE_STATUSES = [
  "CREATING",
  "INITIALIZING",
  "READY",
  "STARTING",
  "RUNNING",
  "STOPPING",
  "STOPPED",
  "RESTARTING",
  "DESTROYING",
  "DESTROYED",
  "ERROR",
] as const;

export type WorkspaceStatus = (typeof WORKSPACE_STATUSES)[number];
export type ResourceKind =
  | "CPU"
  | "MEMORY"
  | "STORAGE"
  | "PROCESS"
  | "PORT"
  | "RUNTIME_INSTANCE";
export type RuntimeAvailability =
  | "AVAILABLE"
  | "NOT_CONFIGURED"
  | "UNAVAILABLE"
  | "UNSUPPORTED";
export type ResourceQuantities = Record<ResourceKind, number>;

export interface WorkspaceResources {
  requested: ResourceQuantities;
  allocated: ResourceQuantities;
}

export interface WorkspaceError {
  code: string;
  message: string;
  occurredAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  status: WorkspaceStatus;
  runtime: {
    /** Adapter identifier; Workspace Core does not hard-code a provider. */
    provider: string;
    instanceId: string | null;
    availability: RuntimeAvailability;
  };
  resources: WorkspaceResources;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  metadata: Record<string, string | number | boolean | null>;
  error: WorkspaceError | null;
}

export type CommandType =
  | "CREATE_WORKSPACE"
  | "START_WORKSPACE"
  | "STOP_WORKSPACE"
  | "RESTART_WORKSPACE"
  | "INSPECT_WORKSPACE"
  | "DESTROY_WORKSPACE";

export type CommandStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

export interface CommandRequest {
  commandId?: string;
  workspaceId: string;
  commandType: CommandType;
  requestedAt?: string;
  payload?: {
    name?: string;
    resources?: Partial<ResourceQuantities>;
    metadata?: Record<string, string | number | boolean | null>;
  };
}

export interface CommandRecord {
  commandId: string;
  workspaceId: string;
  commandType: CommandType;
  requestedAt: string;
  status: CommandStatus;
  startedAt: string | null;
  completedAt: string | null;
  result: unknown;
  error: WorkspaceError | null;
}

export const KNOWLEDGE_AUDIT_ACTIONS = [
  "KNOWLEDGE_INDEX_STARTED",
  "KNOWLEDGE_INDEX_COMPLETED",
  "KNOWLEDGE_INDEX_FAILED",
  "KNOWLEDGE_SEARCHED",
  "KNOWLEDGE_SOURCE_EXCLUDED",
  "KNOWLEDGE_DOCUMENT_UPDATED",
] as const;

export type KnowledgeAuditAction = (typeof KNOWLEDGE_AUDIT_ACTIONS)[number];

export interface KnowledgeAuditRecord {
  recordType: "KNOWLEDGE";
  auditId: string;
  actionType: KnowledgeAuditAction;
  workspaceId: string;
  projectId: string | null;
  requestedAt: string;
  status: "SUCCEEDED" | "FAILED";
  completedAt: string;
  result: unknown;
  error: WorkspaceError | null;
}

export type AuditRecord = CommandRecord | KnowledgeAuditRecord;

export type WorkspaceEventType =
  | "WORKSPACE_CREATED"
  | "WORKSPACE_READY"
  | "WORKSPACE_STARTED"
  | "WORKSPACE_STOPPED"
  | "WORKSPACE_RESTARTED"
  | "WORKSPACE_DESTROYED"
  | "WORKSPACE_ERROR"
  | "RESOURCE_ALLOCATED"
  | "RESOURCE_RELEASED"
  | "STATE_TRANSITIONED"
  | "COMMAND_QUEUED"
  | "COMMAND_STARTED"
  | "COMMAND_EXECUTED"
  | "COMMAND_FAILED";

export interface WorkspaceEvent {
  eventId: string;
  eventType: WorkspaceEventType;
  timestamp: string;
  workspaceId: string;
  payload: Record<string, unknown>;
}

export interface ResourceRequest {
  kind: ResourceKind;
  amount: number;
}

export interface ResourceCapacity {
  kind: ResourceKind;
  requested: number;
  allocated: number;
  used: number | null;
  available: number;
  limit: number;
  unit: string;
  quotaState: "CONFIGURED" | "NOT_CONFIGURED";
  usageState: "AVAILABLE" | "UNAVAILABLE";
}

export interface RuntimeHandle {
  provider: string;
  instanceId: string;
}

export interface RuntimeInspection {
  availability: RuntimeAvailability;
  observedAt: string;
  instanceId: string | null;
  message: string;
}

export interface RuntimeCapabilities {
  provider: string;
  availability: RuntimeAvailability;
  execution: "BROWSER_WEB_WORKER" | "NONE";
  supports: {
    create: boolean;
    start: boolean;
    stop: boolean;
    restart: boolean;
    inspect: boolean;
    destroy: boolean;
  };
  hostProcess: false;
  hostFilesystem: false;
  hostTelemetry: false;
  arbitraryUserCode: false;
  message: string;
}
