import { ConfigurationError } from "../errors";
import type { ResourceKind, ResourceQuantities } from "../types";

export interface PlatformConfiguration {
  runtime: { mode: "local"; provider: "local" };
  workspace: { defaultName: string; resourceRequests: ResourceQuantities };
  resources: {
    limits: ResourceQuantities;
    units: Record<ResourceKind, string>;
  };
  featureFlags: {
    localRuntimeWorker: boolean;
    workspaceActions: boolean;
  };
}

export const DEFAULT_CONFIGURATION: PlatformConfiguration = {
  runtime: { mode: "local", provider: "local" },
  workspace: {
    defaultName: "New Workspace",
    resourceRequests: {
      CPU: 0.25,
      MEMORY: 256,
      STORAGE: 1,
      PROCESS: 2,
      PORT: 1,
      RUNTIME_INSTANCE: 1,
    },
  },
  resources: {
    // These are configured reservation ceilings, not detected host capacity or telemetry.
    limits: {
      CPU: 4,
      MEMORY: 4096,
      STORAGE: 40,
      PROCESS: 64,
      PORT: 32,
      RUNTIME_INSTANCE: 4,
    },
    units: {
      CPU: "core",
      MEMORY: "MiB",
      STORAGE: "GiB",
      PROCESS: "process",
      PORT: "port",
      RUNTIME_INSTANCE: "instance",
    },
  },
  featureFlags: { localRuntimeWorker: true, workspaceActions: true },
};

export function validateConfiguration(
  configuration: PlatformConfiguration
): PlatformConfiguration {
  if (
    configuration.runtime.mode !== "local" ||
    configuration.runtime.provider !== "local"
  ) {
    throw new ConfigurationError(
      "This foundation only supports the local runtime mode and provider."
    );
  }
  for (const [kind, limit] of Object.entries(configuration.resources.limits)) {
    if (!Number.isFinite(limit) || limit < 0) {
      throw new ConfigurationError(
        `Resource limit for ${kind} must be a finite non-negative number.`
      );
    }
  }
  return configuration;
}
