import { CommandEngine } from "./commands/commandEngine";
import { WorkspaceLock } from "./commands/workspaceLock";
import {
  InMemoryAuditRepository,
  LocalStorageAuditRepository,
  type AuditRepository,
} from "./audit/auditRepository";
import {
  DEFAULT_CONFIGURATION,
  validateConfiguration,
  type PlatformConfiguration,
} from "./configuration/config";
import { LocalEventBus } from "./events/eventBus";
import { WorkspaceStateMachine } from "./lifecycle/stateMachine";
import { WorkspaceProvisioner } from "./provisioner/workspaceProvisioner";
import { ResourceEngine } from "./resources/resourceEngine";
import type { RuntimeAdapter } from "./runtime/runtimeAdapter";
import { LocalRuntimeAdapter } from "../infrastructure/local-runtime/LocalRuntimeAdapter";
import { WorkspaceOverviewQuery } from "./workspace/overview";
import { WorkspaceQueries } from "./workspace/queries";
import {
  LocalStorageWorkspaceRepository,
  type StorageLike,
  type WorkspaceRepository,
} from "./workspace/repository";
import type {
  AuditRecord,
  CommandRequest,
  RuntimeCapabilities,
  WorkspaceEvent,
} from "./types";
import type { WorkspaceOverview } from "./workspace/overview";
import type { Workspace } from "./types";
import { KnowledgeEngine, type KnowledgeIndexResult } from "./knowledge/knowledgeEngine";
import {
  InMemoryKnowledgeRepository,
  LocalStorageKnowledgeRepository,
} from "./knowledge/repository";
import type { KnowledgeRepository } from "./knowledge/types";
import type {
  ContextBudget,
  ContextPack,
  KnowledgeDocument,
  KnowledgeFile,
  KnowledgeIndexStats,
  KnowledgeSearchRequest,
  KnowledgeSearchResult,
  KnowledgeSource,
} from "./knowledge/types";
import { EventStream } from "./observability/eventStream";
import { ObservabilityService } from "./observability/observabilityService";
import type {
  EventStreamQuery,
  EventStreamSnapshot,
  ObservabilityEvent,
  ObservabilityMetrics,
  SystemHealthCheck,
  SystemHealthReport,
} from "./observability/types";

export interface PlatformDependencies {
  configuration?: PlatformConfiguration;
  repository?: WorkspaceRepository;
  storage?: StorageLike;
  runtime?: RuntimeAdapter;
  resourceEngine?: ResourceEngine;
  auditRepository?: AuditRepository;
  knowledgeRepository?: KnowledgeRepository;
  knowledgeEngine?: KnowledgeEngine;
  createId?: () => string;
  now?: () => string;
}

export interface WorkspacePlatform {
  readonly workspaces: {
    get(workspaceId: string): Promise<Workspace | null>;
    list(): Promise<Workspace[]>;
  };
  readonly events: {
    list(workspaceId?: string): WorkspaceEvent[];
    subscribe(listener: (event: WorkspaceEvent) => void): () => void;
  };
  readonly eventStream: {
    query(query?: EventStreamQuery): EventStreamSnapshot;
    subscribe(listener: (event: ObservabilityEvent) => void): () => void;
  };
  readonly commands: {
    execute(request: CommandRequest): ReturnType<CommandEngine["execute"]>;
    list(): ReturnType<CommandEngine["list"]>;
  };
  /**
   * Durable Command audit trail — distinct from `commands.list()`,
   * which is this session's live in-memory history. `audit.list()`
   * survives a page reload (see AuditRepository) up to its retention
   * cap; it is local, single-device durability, not a tamper-evident
   * or legal-grade ledger.
   */
  readonly audit: {
    list(workspaceId?: string): Promise<AuditRecord[]>;
  };
  readonly knowledge: {
    discoverSources(workspaceId: string, projectId: string, files: readonly KnowledgeFile[]): Promise<KnowledgeSource[]>;
    indexFiles(workspaceId: string, projectId: string, files: readonly KnowledgeFile[]): Promise<KnowledgeIndexResult>;
    removeFile(workspaceId: string, projectId: string, path: string): Promise<void>;
    renameFile(workspaceId: string, projectId: string, fromPath: string, file: KnowledgeFile): Promise<KnowledgeIndexResult>;
    markStale(workspaceId: string, projectId: string, path: string): Promise<KnowledgeSource | null>;
    search(request: KnowledgeSearchRequest): Promise<KnowledgeSearchResult[]>;
    retrieveContext(request: KnowledgeSearchRequest, budget: ContextBudget): Promise<ContextPack>;
    sources(workspaceId: string, projectId?: string): Promise<KnowledgeSource[]>;
    documents(workspaceId: string, projectId?: string): Promise<KnowledgeDocument[]>;
    document(documentId: string): Promise<KnowledgeDocument | null>;
    stats(workspaceId: string, projectId?: string): Promise<KnowledgeIndexStats>;
  };
  readonly observability: {
    metrics(): Promise<ObservabilityMetrics>;
    health(): Promise<SystemHealthReport>;
    workspaceHealth(workspaceId: string): Promise<SystemHealthCheck>;
  };
  readonly overview: {
    execute(): Promise<WorkspaceOverview>;
  };
  readonly runtimeCapabilities: () => RuntimeCapabilities;
  readonly ready: Promise<void>;
}

export function createWorkspacePlatform(
  dependencies: PlatformDependencies = {}
): WorkspacePlatform {
  const configuration = validateConfiguration(
    dependencies.configuration ?? DEFAULT_CONFIGURATION
  );
  const storage =
    dependencies.storage ??
    (typeof window !== "undefined" ? window.localStorage : undefined);
  const repository =
    dependencies.repository ??
    (storage ? new LocalStorageWorkspaceRepository(storage) : undefined);
  if (!repository)
    throw new Error(
      "A local Workspace repository is required outside a browser environment."
    );

  const eventBus = new LocalEventBus(dependencies.createId);
  const resourceEngine =
    dependencies.resourceEngine ?? new ResourceEngine(configuration);
  const runtimeAdapter =
    dependencies.runtime ??
    new LocalRuntimeAdapter(configuration.featureFlags.localRuntimeWorker);
  const auditRepository =
    dependencies.auditRepository ??
    (storage ? new LocalStorageAuditRepository(storage) : new InMemoryAuditRepository());
  const knowledgeRepository =
    dependencies.knowledgeRepository ??
    (storage
      ? new LocalStorageKnowledgeRepository(storage)
      : new InMemoryKnowledgeRepository());
  const knowledgeEngine =
    dependencies.knowledgeEngine ??
    new KnowledgeEngine(
      knowledgeRepository,
      auditRepository,
      dependencies.createId,
      dependencies.now
    );
  const stateMachine = new WorkspaceStateMachine();
  const locks = new WorkspaceLock();
  const provisioner = new WorkspaceProvisioner(
    repository,
    stateMachine,
    resourceEngine,
    runtimeAdapter,
    eventBus,
    dependencies.now
  );
  const commandEngine = new CommandEngine(
    provisioner,
    locks,
    eventBus,
    dependencies.createId,
    dependencies.now,
    auditRepository
  );
  const ready = repository.list().then(workspaces =>
    resourceEngine.restore(
      workspaces
        .filter(
          workspace =>
            workspace.status !== "DESTROYED" &&
            Object.values(workspace.resources.allocated).some(
              amount => amount > 0
            )
        )
        .map(workspace => ({
          workspaceId: workspace.id,
          resources: workspace.resources.allocated,
        }))
    )
  );
  const eventStream = new EventStream(eventBus);
  const observability = new ObservabilityService(
    {
      ready,
      listWorkspaces: () => repository.list(),
      listCommands: () => commandEngine.list(),
      listEvents: () => eventBus.list(),
      listAudit: () => auditRepository.list(),
      inspectResources: () => resourceEngine.inspect(),
      runtimeCapabilities: () => runtimeAdapter.capabilities(),
      knowledgeStats: async (workspaceId: string) => knowledgeEngine.getStats(workspaceId),
      auditStorage: storage ? "LOCAL_STORAGE" : "IN_MEMORY",
    },
    eventStream
  );
  const workspaceQueries = new WorkspaceQueries(repository);
  const overviewQuery = new WorkspaceOverviewQuery(
    repository,
    resourceEngine,
    dependencies.now
  );
  return Object.freeze({
    workspaces: Object.freeze({
      get: (workspaceId: string) => workspaceQueries.get(workspaceId),
      list: () => workspaceQueries.list(),
    }),
    events: Object.freeze({
      list: (workspaceId?: string) => eventBus.list(workspaceId),
      subscribe: (listener: (event: WorkspaceEvent) => void) =>
        eventBus.subscribe(listener),
    }),
    eventStream: Object.freeze({
      query: (query?: EventStreamQuery) => eventStream.query(query),
      subscribe: (listener: (event: ObservabilityEvent) => void) =>
        eventStream.subscribe(listener),
    }),
    commands: Object.freeze({
      execute: async (request: CommandRequest) => {
        const requestSnapshot = structuredClone(request);
        await ready;
        return commandEngine.execute(requestSnapshot);
      },
      list: () => commandEngine.list(),
    }),
    audit: Object.freeze({
      list: async (workspaceId?: string) => {
        await ready;
        return auditRepository.list(workspaceId);
      },
    }),
    knowledge: Object.freeze({
      discoverSources: (workspaceId: string, projectId: string, files: readonly KnowledgeFile[]) =>
        knowledgeEngine.discoverSources(workspaceId, projectId, files),
      indexFiles: (workspaceId: string, projectId: string, files: readonly KnowledgeFile[]) =>
        knowledgeEngine.indexFiles(workspaceId, projectId, files),
      removeFile: (workspaceId: string, projectId: string, path: string) =>
        knowledgeEngine.removeFile(workspaceId, projectId, path),
      renameFile: (workspaceId: string, projectId: string, fromPath: string, file: KnowledgeFile) =>
        knowledgeEngine.renameFile(workspaceId, projectId, fromPath, file),
      markStale: (workspaceId: string, projectId: string, path: string) =>
        knowledgeEngine.markStale(workspaceId, projectId, path),
      search: (request: KnowledgeSearchRequest) => knowledgeEngine.search(request),
      retrieveContext: (request: KnowledgeSearchRequest, budget: ContextBudget) =>
        knowledgeEngine.retrieveContext(request, budget),
      sources: (workspaceId: string, projectId?: string) =>
        knowledgeEngine.listSources(workspaceId, projectId),
      documents: (workspaceId: string, projectId?: string) =>
        knowledgeEngine.listDocuments(workspaceId, projectId),
      document: (documentId: string) => knowledgeEngine.getDocument(documentId),
      stats: (workspaceId: string, projectId?: string) => knowledgeEngine.getStats(workspaceId, projectId),
    }),
    observability: Object.freeze({
      metrics: () => observability.metrics(),
      health: () => observability.health(),
      workspaceHealth: (workspaceId: string) => observability.workspaceHealth(workspaceId),
    }),
    overview: Object.freeze({
      execute: async () => {
        await ready;
        return overviewQuery.execute();
      },
    }),
    runtimeCapabilities: () => {
      const snapshot = structuredClone(runtimeAdapter.capabilities());
      return Object.freeze({
        ...snapshot,
        supports: Object.freeze({ ...snapshot.supports }),
      });
    },
    ready,
  });
}
