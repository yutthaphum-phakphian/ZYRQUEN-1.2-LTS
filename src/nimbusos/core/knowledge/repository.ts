import { AuditStorageError } from "../errors";
import type {
  KnowledgeChunk,
  KnowledgeDocument,
  KnowledgeIndexStats,
  KnowledgeRepository,
  KnowledgeSource,
} from "./types";
import type { StorageLike } from "../workspace/repository";

interface KnowledgeState {
  sources: KnowledgeSource[];
  documents: KnowledgeDocument[];
  chunks: KnowledgeChunk[];
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function emptyState(): KnowledgeState {
  return { sources: [], documents: [], chunks: [] };
}

function scopeMatches(
  value: { workspaceId: string; projectId: string },
  workspaceId: string,
  projectId?: string
): boolean {
  return value.workspaceId === workspaceId && (!projectId || value.projectId === projectId);
}

export class InMemoryKnowledgeRepository implements KnowledgeRepository {
  private state = emptyState();

  async listSources(workspaceId: string, projectId?: string): Promise<KnowledgeSource[]> {
    return clone(this.state.sources.filter(source => scopeMatches(source, workspaceId, projectId)));
  }

  async getSource(workspaceId: string, projectId: string, path: string): Promise<KnowledgeSource | null> {
    return clone(this.state.sources.find(source => source.workspaceId === workspaceId && source.projectId === projectId && source.path === path) ?? null);
  }

  async saveSource(source: KnowledgeSource): Promise<KnowledgeSource> {
    const index = this.state.sources.findIndex(item => item.id === source.id);
    if (index === -1) this.state.sources.push(clone(source));
    else this.state.sources[index] = clone(source);
    return clone(source);
  }

  async deleteSource(sourceId: string): Promise<void> {
    this.state.sources = this.state.sources.filter(source => source.id !== sourceId);
  }

  async listDocuments(workspaceId: string, projectId?: string): Promise<KnowledgeDocument[]> {
    return clone(this.state.documents.filter(document => scopeMatches(document, workspaceId, projectId)));
  }

  async getDocument(documentId: string): Promise<KnowledgeDocument | null> {
    return clone(this.state.documents.find(document => document.id === documentId) ?? null);
  }

  async getDocumentByPath(workspaceId: string, projectId: string, path: string): Promise<KnowledgeDocument | null> {
    return clone(this.state.documents.find(document => document.workspaceId === workspaceId && document.projectId === projectId && document.path === path) ?? null);
  }

  async saveDocument(document: KnowledgeDocument): Promise<KnowledgeDocument> {
    const index = this.state.documents.findIndex(item => item.id === document.id);
    if (index === -1) this.state.documents.push(clone(document));
    else this.state.documents[index] = clone(document);
    return clone(document);
  }

  async deleteDocument(documentId: string): Promise<void> {
    this.state.documents = this.state.documents.filter(document => document.id !== documentId);
    this.state.chunks = this.state.chunks.filter(chunk => chunk.documentId !== documentId);
  }

  async listChunks(documentId: string): Promise<KnowledgeChunk[]> {
    return clone(this.state.chunks.filter(chunk => chunk.documentId === documentId).sort((a, b) => a.sequence - b.sequence));
  }

  async saveChunks(documentId: string, chunks: KnowledgeChunk[]): Promise<void> {
    this.state.chunks = this.state.chunks.filter(chunk => chunk.documentId !== documentId);
    this.state.chunks.push(...clone(chunks.map(chunk => ({ ...chunk, documentId }))));
  }

  async getStats(workspaceId: string, projectId?: string): Promise<KnowledgeIndexStats> {
    const sources = await this.listSources(workspaceId, projectId);
    const documents = await this.listDocuments(workspaceId, projectId);
    const chunks = (await Promise.all(documents.map(document => this.listChunks(document.id)))).flat();
    const indexed = sources.map(source => source.lastIndexedAt).filter((value): value is string => Boolean(value));
    return {
      sources: sources.length,
      documents: documents.length,
      chunks: chunks.length,
      excluded: sources.filter(source => source.status === "EXCLUDED").length,
      errors: sources.filter(source => source.status === "ERROR").length,
      stale: sources.filter(source => source.status === "STALE").length,
      lastIndexedAt: indexed.sort().at(-1) ?? null,
      indexDurationMs: null,
    };
  }

  async clear(workspaceId: string, projectId?: string): Promise<void> {
    const documents = this.state.documents.filter(document => scopeMatches(document, workspaceId, projectId));
    const documentIds = new Set(documents.map(document => document.id));
    this.state.sources = this.state.sources.filter(source => !scopeMatches(source, workspaceId, projectId));
    this.state.documents = this.state.documents.filter(document => !documentIds.has(document.id));
    this.state.chunks = this.state.chunks.filter(chunk => !documentIds.has(chunk.documentId));
  }
}

export class LocalStorageKnowledgeRepository implements KnowledgeRepository {
  constructor(
    private readonly storage: StorageLike,
    private readonly key = "nimbusos.knowledge.v1"
  ) {}

  private load(): KnowledgeState {
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return emptyState();
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") throw new Error("stored knowledge data must be an object");
      const state = parsed as Partial<KnowledgeState>;
      if (!Array.isArray(state.sources) || !Array.isArray(state.documents) || !Array.isArray(state.chunks))
        throw new Error("stored knowledge data has invalid collections");
      return clone({ sources: state.sources, documents: state.documents, chunks: state.chunks });
    } catch (error) {
      throw new AuditStorageError("Unable to read local Knowledge storage.", { cause: error });
    }
  }

  private persist(state: KnowledgeState): void {
    try {
      this.storage.setItem(this.key, JSON.stringify(state));
    } catch (error) {
      throw new AuditStorageError("Unable to write local Knowledge storage.", { cause: error });
    }
  }

  private update(mutator: (state: KnowledgeState) => void): void {
    const state = this.load();
    mutator(state);
    this.persist(state);
  }

  async listSources(workspaceId: string, projectId?: string): Promise<KnowledgeSource[]> {
    return new InMemoryKnowledgeRepositoryAdapter(this.load()).listSources(workspaceId, projectId);
  }

  async getSource(workspaceId: string, projectId: string, path: string): Promise<KnowledgeSource | null> {
    return new InMemoryKnowledgeRepositoryAdapter(this.load()).getSource(workspaceId, projectId, path);
  }

  async saveSource(source: KnowledgeSource): Promise<KnowledgeSource> {
    this.update(state => {
      const index = state.sources.findIndex(item => item.id === source.id);
      if (index === -1) state.sources.push(clone(source)); else state.sources[index] = clone(source);
    });
    return clone(source);
  }

  async deleteSource(sourceId: string): Promise<void> {
    this.update(state => { state.sources = state.sources.filter(source => source.id !== sourceId); });
  }

  async listDocuments(workspaceId: string, projectId?: string): Promise<KnowledgeDocument[]> {
    return new InMemoryKnowledgeRepositoryAdapter(this.load()).listDocuments(workspaceId, projectId);
  }

  async getDocument(documentId: string): Promise<KnowledgeDocument | null> {
    return new InMemoryKnowledgeRepositoryAdapter(this.load()).getDocument(documentId);
  }

  async getDocumentByPath(workspaceId: string, projectId: string, path: string): Promise<KnowledgeDocument | null> {
    return new InMemoryKnowledgeRepositoryAdapter(this.load()).getDocumentByPath(workspaceId, projectId, path);
  }

  async saveDocument(document: KnowledgeDocument): Promise<KnowledgeDocument> {
    this.update(state => {
      const index = state.documents.findIndex(item => item.id === document.id);
      if (index === -1) state.documents.push(clone(document)); else state.documents[index] = clone(document);
    });
    return clone(document);
  }

  async deleteDocument(documentId: string): Promise<void> {
    this.update(state => {
      state.documents = state.documents.filter(document => document.id !== documentId);
      state.chunks = state.chunks.filter(chunk => chunk.documentId !== documentId);
    });
  }

  async listChunks(documentId: string): Promise<KnowledgeChunk[]> {
    return new InMemoryKnowledgeRepositoryAdapter(this.load()).listChunks(documentId);
  }

  async saveChunks(documentId: string, chunks: KnowledgeChunk[]): Promise<void> {
    this.update(state => {
      state.chunks = state.chunks.filter(chunk => chunk.documentId !== documentId);
      state.chunks.push(...clone(chunks.map(chunk => ({ ...chunk, documentId }))));
    });
  }

  async getStats(workspaceId: string, projectId?: string): Promise<KnowledgeIndexStats> {
    return new InMemoryKnowledgeRepositoryAdapter(this.load()).getStats(workspaceId, projectId);
  }

  async clear(workspaceId: string, projectId?: string): Promise<void> {
    this.update(state => {
      const documents = state.documents.filter(document => scopeMatches(document, workspaceId, projectId));
      const ids = new Set(documents.map(document => document.id));
      state.sources = state.sources.filter(source => !scopeMatches(source, workspaceId, projectId));
      state.documents = state.documents.filter(document => !ids.has(document.id));
      state.chunks = state.chunks.filter(chunk => !ids.has(chunk.documentId));
    });
  }
}

class InMemoryKnowledgeRepositoryAdapter extends InMemoryKnowledgeRepository {
  constructor(state: KnowledgeState) {
    super();
    Object.assign(this, { state });
  }
}
