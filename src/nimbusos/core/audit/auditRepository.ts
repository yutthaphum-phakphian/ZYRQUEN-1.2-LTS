import { AuditStorageError, ValidationError } from "../errors";
import { redactSensitive } from "../security/redaction";
import type {
  AuditRecord,
  CommandRecord,
  CommandStatus,
  CommandType,
  KnowledgeAuditRecord,
} from "../types";
import { KNOWLEDGE_AUDIT_ACTIONS } from "../types";
import type { StorageLike } from "../workspace/repository";

/** Terminal Command status retained by the existing audit contract. */
export type TerminalCommandStatus = Extract<CommandStatus, "SUCCEEDED" | "FAILED">;

export interface AuditRepository {
  /** Append-only: there is no update/delete. Idempotent per record identity. */
  append(record: AuditRecord): Promise<void>;
  list(workspaceId?: string): Promise<AuditRecord[]>;
}

const COMMAND_TYPES: readonly CommandType[] = [
  "CREATE_WORKSPACE",
  "START_WORKSPACE",
  "STOP_WORKSPACE",
  "RESTART_WORKSPACE",
  "INSPECT_WORKSPACE",
  "DESTROY_WORKSPACE",
];

const TERMINAL_STATUSES: readonly TerminalCommandStatus[] = [
  "SUCCEEDED",
  "FAILED",
];

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

function validateError(value: unknown, label: string): KnowledgeAuditRecord["error"] {
  if (value !== null && !isPlainRecord(value))
    throw new ValidationError(`${label} must be an object or null.`);
  return (value as KnowledgeAuditRecord["error"]) ?? null;
}

/** Validates a terminal CommandRecord before it is trusted as an audit entry. */
export function validateAuditRecord(value: unknown): CommandRecord {
  if (!isPlainRecord(value))
    throw new ValidationError("Audit record must be an object.");
  const {
    commandId,
    workspaceId,
    commandType,
    requestedAt,
    status,
    startedAt,
    completedAt,
    result,
    error,
  } = value;

  if (typeof commandId !== "string" || !commandId.trim())
    throw new ValidationError("Audit record.commandId must be a non-empty string.");
  if (typeof workspaceId !== "string" || !workspaceId.trim())
    throw new ValidationError("Audit record.workspaceId must be a non-empty string.");
  if (!COMMAND_TYPES.includes(commandType as CommandType))
    throw new ValidationError(`Audit record.commandType '${String(commandType)}' is unknown.`);
  if (!isTimestamp(requestedAt))
    throw new ValidationError("Audit record.requestedAt must be a valid timestamp.");
  if (!TERMINAL_STATUSES.includes(status as TerminalCommandStatus))
    throw new ValidationError(
      "Audit record.status must be a terminal status (SUCCEEDED or FAILED)."
    );
  if (!isTimestamp(startedAt))
    throw new ValidationError("Audit record.startedAt must be a valid timestamp.");
  if (!isTimestamp(completedAt))
    throw new ValidationError("Audit record.completedAt must be a valid timestamp.");

  return {
    commandId,
    workspaceId,
    commandType: commandType as CommandType,
    requestedAt,
    status: status as TerminalCommandStatus,
    startedAt,
    completedAt,
    result: result ?? null,
    error: validateError(error, "Audit record.error"),
  };
}

/** Validates the Phase 09 knowledge action shape without creating another store. */
export function validateKnowledgeAuditRecord(value: unknown): KnowledgeAuditRecord {
  if (!isPlainRecord(value))
    throw new ValidationError("Knowledge audit record must be an object.");
  const {
    recordType,
    auditId,
    actionType,
    workspaceId,
    projectId,
    requestedAt,
    status,
    completedAt,
    result,
    error,
  } = value;
  if (recordType !== "KNOWLEDGE")
    throw new ValidationError("Knowledge audit record.recordType must be KNOWLEDGE.");
  if (typeof auditId !== "string" || !auditId.trim())
    throw new ValidationError("Knowledge audit record.auditId must be non-empty.");
  if (!KNOWLEDGE_AUDIT_ACTIONS.includes(actionType as KnowledgeAuditRecord["actionType"]))
    throw new ValidationError(`Knowledge audit action '${String(actionType)}' is unknown.`);
  if (typeof workspaceId !== "string" || !workspaceId.trim())
    throw new ValidationError("Knowledge audit record.workspaceId must be non-empty.");
  if (projectId !== null && typeof projectId !== "string")
    throw new ValidationError("Knowledge audit record.projectId must be a string or null.");
  if (!isTimestamp(requestedAt) || !isTimestamp(completedAt))
    throw new ValidationError("Knowledge audit timestamps must be valid.");
  if (!TERMINAL_STATUSES.includes(status as TerminalCommandStatus))
    throw new ValidationError("Knowledge audit record.status must be terminal.");
  return {
    recordType: "KNOWLEDGE",
    auditId,
    actionType: actionType as KnowledgeAuditRecord["actionType"],
    workspaceId,
    projectId: (projectId as string | null) ?? null,
    requestedAt,
    status: status as TerminalCommandStatus,
    completedAt,
    result: result ?? null,
    error: validateError(error, "Knowledge audit record.error"),
  };
}

export function validateStoredAuditRecord(value: unknown): AuditRecord {
  return isPlainRecord(value) && value.recordType === "KNOWLEDGE"
    ? validateKnowledgeAuditRecord(value)
    : validateAuditRecord(value);
}

function isKnowledgeRecord(record: AuditRecord): record is KnowledgeAuditRecord {
  return "recordType" in record && record.recordType === "KNOWLEDGE";
}

function recordIdentity(record: AuditRecord): string {
  return isKnowledgeRecord(record)
    ? `knowledge:${record.auditId}`
    : `command:${record.commandId}`;
}

function completedAt(record: AuditRecord): string {
  return record.completedAt ?? record.requestedAt;
}

/** LOCAL DEVELOPMENT / SESSION STORAGE — resets on process restart. */
export class InMemoryAuditRepository implements AuditRepository {
  private readonly records: AuditRecord[] = [];

  async append(record: AuditRecord): Promise<void> {
    const validated = validateStoredAuditRecord(redactSensitive(record));
    if (this.records.some(existing => recordIdentity(existing) === recordIdentity(validated))) return;
    this.records.push(structuredClone(validated));
  }

  async list(workspaceId?: string): Promise<AuditRecord[]> {
    return this.records
      .filter(record => !workspaceId || record.workspaceId === workspaceId)
      .map(record => structuredClone(record))
      .sort((a, b) => completedAt(b).localeCompare(completedAt(a)));
  }
}

/** Durable local audit trail shared by Command and Knowledge actions. */
export class LocalStorageAuditRepository implements AuditRepository {
  constructor(
    private readonly storage: StorageLike,
    private readonly key = "nimbusos.command-audit.v1",
    private readonly maxRecords = 500
  ) {}

  private load(): AuditRecord[] {
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed))
        throw new Error("stored audit data must be an array");
      return parsed.map(record => validateStoredAuditRecord(record));
    } catch (error) {
      if (error instanceof AuditStorageError) throw error;
      throw new AuditStorageError("Unable to read local Command audit storage.", {
        cause: error,
      });
    }
  }

  private persist(records: AuditRecord[]): void {
    try {
      this.storage.setItem(this.key, JSON.stringify(records));
    } catch (error) {
      throw new AuditStorageError("Unable to write local Command audit storage.", {
        cause: error,
      });
    }
  }

  async append(record: AuditRecord): Promise<void> {
    const validated = validateStoredAuditRecord(redactSensitive(record));
    const records = this.load();
    if (records.some(existing => recordIdentity(existing) === recordIdentity(validated))) return;
    records.push(validated);
    records.sort((a, b) => completedAt(a).localeCompare(completedAt(b)));
    this.persist(records.slice(Math.max(0, records.length - this.maxRecords)));
  }

  async list(workspaceId?: string): Promise<AuditRecord[]> {
    return this.load()
      .filter(record => !workspaceId || record.workspaceId === workspaceId)
      .map(record => structuredClone(record))
      .sort((a, b) => completedAt(b).localeCompare(completedAt(a)));
  }
}
