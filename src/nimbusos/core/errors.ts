export class CoreError extends Error {
  readonly code: string;

  constructor(code: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
    this.code = code;
  }
}

export class ValidationError extends CoreError {
  constructor(message: string, options?: ErrorOptions) {
    super("VALIDATION_ERROR", message, options);
  }
}

export class WorkspaceNotFoundError extends CoreError {
  constructor(workspaceId: string) {
    super("WORKSPACE_NOT_FOUND", `Workspace '${workspaceId}' was not found.`);
  }
}

export class WorkspaceAlreadyExistsError extends CoreError {
  constructor(workspaceId: string) {
    super(
      "WORKSPACE_ALREADY_EXISTS",
      `Workspace '${workspaceId}' already exists.`
    );
  }
}

export class StateTransitionError extends CoreError {
  constructor(from: string, to: string) {
    super(
      "INVALID_STATE_TRANSITION",
      `Workspace cannot transition from ${from} to ${to}.`
    );
  }
}

export class WorkspaceLockedError extends CoreError {
  constructor(workspaceId: string) {
    super(
      "WORKSPACE_LOCKED",
      `Workspace '${workspaceId}' is locked by another operation.`
    );
  }
}

export class ResourceError extends CoreError {
  constructor(code: string, message: string, options?: ErrorOptions) {
    super(code, message, options);
  }
}

export class ResourceUnavailableError extends ResourceError {
  constructor(kind: string, requested: number, available: number) {
    super(
      "RESOURCE_UNAVAILABLE",
      `Requested ${requested} ${kind}, but only ${available} is available.`
    );
  }
}

export class RuntimeCapabilityError extends CoreError {
  constructor(
    code: "NOT_CONFIGURED" | "UNAVAILABLE" | "UNSUPPORTED",
    message: string
  ) {
    super(code, message);
  }
}

export class RuntimeOperationError extends CoreError {
  constructor(message: string, options?: ErrorOptions) {
    super("RUNTIME_ERROR", message, options);
  }
}

export class CommandError extends CoreError {
  constructor(message: string, options?: ErrorOptions) {
    super("COMMAND_ERROR", message, options);
  }
}

export class InvalidCommandError extends CoreError {
  constructor(message: string) {
    super("INVALID_COMMAND", message);
  }
}

export class CommandIdConflictError extends CoreError {
  constructor(commandId: string) {
    super(
      "COMMAND_ID_CONFLICT",
      `Command id '${commandId}' has already been used for a different request.`
    );
  }
}

export class ProvisioningError extends CoreError {
  constructor(message: string, options?: ErrorOptions) {
    super("PROVISIONING_ERROR", message, options);
  }
}

export class ProvisioningCompensationError extends CoreError {
  readonly primaryCode: string;
  readonly compensationMessages: readonly string[];

  constructor(primary: unknown, compensationErrors: readonly unknown[]) {
    const primaryError =
      primary instanceof Error ? primary : new Error(String(primary));
    const messages = compensationErrors.map(error =>
      error instanceof Error ? error.message : String(error)
    );
    super(
      "PROVISIONING_COMPENSATION_FAILED",
      `Provisioning failed (${primaryError.message}) and cleanup was incomplete: ${messages.join("; ")}`,
      { cause: primaryError }
    );
    this.primaryCode =
      typeof (primary as { code?: unknown } | null)?.code === "string"
        ? (primary as { code: string }).code
        : "PROVISIONING_ERROR";
    this.compensationMessages = messages;
  }
}

export class ConfigurationError extends CoreError {
  constructor(message: string) {
    super("CONFIGURATION_ERROR", message);
  }
}

export class WorkspaceStorageError extends CoreError {
  constructor(message: string, options?: ErrorOptions) {
    super("WORKSPACE_STORAGE_ERROR", message, options);
  }
}

export class AuditStorageError extends CoreError {
  constructor(message: string, options?: ErrorOptions) {
    super("AUDIT_STORAGE_ERROR", message, options);
  }
}
