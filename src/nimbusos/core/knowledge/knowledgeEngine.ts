import { ValidationError } from "../errors";
import type { AuditRepository } from "../audit/auditRepository";
import { chunkContent } from "./chunking";
import { exclusionDecision, normalizeKnowledgePath } from "./policy";
import type {
  ContextBudget,
  ContextPack,
  KnowledgeDocument,
  KnowledgeFile,
  KnowledgeIndexStats,
  KnowledgeRepository,
  KnowledgeSearchRequest,
  KnowledgeSearchResult,
  KnowledgeSource,
} from "./types";
import type { KnowledgeAuditAction, KnowledgeAuditRecord } from "../types";

export interface KnowledgeIndexResult {
  indexed: string[];
  unchanged: string[];
  excluded: string[];
  errors: Array<{ path: string; message: string }>;
  stats: KnowledgeIndexStats;
}

function hashFallback(content: string): string {
  let hash = 2166136261;
  for (let index = 0; index < content.length; index += 1) {
    hash ^= content.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

async function contentHash(content: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return hashFallback(content);
  const digest = await subtle.digest("SHA-256", new TextEncoder().encode(content));
  return `sha256-${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("")}`;
}

function tokenCount(value: string): number {
  return Math.max(1, Math.ceil(value.length / 4));
}

function nowTimestamp(now: () => string): string {
  const value = now();
  if (!Number.isFinite(Date.parse(value))) throw new ValidationError("Knowledge timestamp must be valid.");
  return value;
}

function sourceId(workspaceId: string, projectId: string, path: string): string {
  return `source:${workspaceId}:${projectId}:${path}`;
}

function documentId(workspaceId: string, projectId: string, path: string): string {
  return `document:${workspaceId}:${projectId}:${path}`;
}

function actionRecord(
  actionType: KnowledgeAuditAction,
  workspaceId: string,
  projectId: string,
  requestedAt: string,
  completedAt: string,
  result: unknown,
  auditId: string,
  error: KnowledgeAuditRecord["error"] = null
): KnowledgeAuditRecord {
  return {
    recordType: "KNOWLEDGE",
    auditId,
    actionType,
    workspaceId,
    projectId,
    requestedAt,
    completedAt,
    status: error ? "FAILED" : "SUCCEEDED",
    result,
    error,
  };
}

export class KnowledgeEngine {
  constructor(
    private readonly repository: KnowledgeRepository,
    private readonly audit: AuditRepository,
    private readonly createId: () => string = () => globalThis.crypto.randomUUID(),
    private readonly now: () => string = () => new Date().toISOString()
  ) {}

  async discoverSources(
    workspaceId: string,
    projectId: string,
    files: readonly KnowledgeFile[]
  ): Promise<KnowledgeSource[]> {
    this.validateScope(workspaceId, projectId);
    const sources: KnowledgeSource[] = [];
    for (const file of files) {
      const path = normalizeKnowledgePath(file.path);
      const decision = exclusionDecision(path);
      const existing = await this.repository.getSource(workspaceId, projectId, path);
      sources.push(existing ?? {
        id: sourceId(workspaceId, projectId, path),
        workspaceId,
        projectId,
        type: "FILE",
        path,
        status: decision.excluded ? "EXCLUDED" : "NOT_INDEXED",
        excludedReason: decision.reason,
        lastIndexedAt: null,
        error: null,
      });
    }
    return sources;
  }

  async indexFiles(
    workspaceId: string,
    projectId: string,
    files: readonly KnowledgeFile[]
  ): Promise<KnowledgeIndexResult> {
    this.validateScope(workspaceId, projectId);
    const requestedAt = nowTimestamp(this.now);
    await this.writeAudit(
      actionRecord("KNOWLEDGE_INDEX_STARTED", workspaceId, projectId, requestedAt, requestedAt, { files: files.length }, `index-start:${this.createId()}`)
    );
    const indexed: string[] = [];
    const unchanged: string[] = [];
    const excluded: string[] = [];
    const errors: Array<{ path: string; message: string }> = [];
    for (const file of files) {
      const path = normalizeKnowledgePath(file.path);
      try {
        const decision = exclusionDecision(path);
        const source = (await this.repository.getSource(workspaceId, projectId, path)) ?? {
          id: sourceId(workspaceId, projectId, path),
          workspaceId,
          projectId,
          type: "FILE" as const,
          path,
          status: "NOT_INDEXED" as const,
          excludedReason: null,
          lastIndexedAt: null,
          error: null,
        };
        if (decision.excluded) {
          source.status = "EXCLUDED";
          source.excludedReason = decision.reason;
          source.error = null;
          await this.repository.saveSource(source);
          excluded.push(path);
          await this.writeAudit(actionRecord("KNOWLEDGE_SOURCE_EXCLUDED", workspaceId, projectId, requestedAt, nowTimestamp(this.now), { path, reason: decision.reason }, `source-excluded:${source.id}`));
          continue;
        }
        const hash = await contentHash(file.content);
        const existingDocument = await this.repository.getDocumentByPath(workspaceId, projectId, path);
        if (existingDocument?.contentHash === hash) {
          source.status = "INDEXED";
          source.excludedReason = null;
          source.error = null;
          await this.repository.saveSource(source);
          unchanged.push(path);
          continue;
        }
        source.status = "INDEXING";
        source.excludedReason = null;
        source.error = null;
        await this.repository.saveSource(source);
        const id = existingDocument?.id ?? documentId(workspaceId, projectId, path);
        const chunks = chunkContent(path, file.content).map(chunk => ({
          ...chunk,
          id: `${id}:${chunk.id}`,
          documentId: id,
        }));
        const timestamp = nowTimestamp(this.now);
        const document: KnowledgeDocument = {
          id,
          sourceId: source.id,
          workspaceId,
          projectId,
          path,
          contentHash: hash,
          size: new TextEncoder().encode(file.content).byteLength,
          mtime: file.mtime ?? null,
          updatedAt: timestamp,
          indexedAt: timestamp,
          chunkIds: chunks.map(chunk => chunk.id),
        };
        await this.repository.saveDocument(document);
        await this.repository.saveChunks(document.id, chunks);
        source.status = "INDEXED";
        source.lastIndexedAt = timestamp;
        source.error = null;
        await this.repository.saveSource(source);
        indexed.push(path);
        await this.writeAudit(actionRecord("KNOWLEDGE_DOCUMENT_UPDATED", workspaceId, projectId, requestedAt, timestamp, { path, documentId: document.id, contentHash: hash, chunks: chunks.length }, `document-updated:${document.id}:${hash}`));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({ path, message });
        const source = await this.repository.getSource(workspaceId, projectId, path);
        if (source) {
          source.status = "ERROR";
          source.error = { code: "KNOWLEDGE_INDEX_ERROR", message, occurredAt: nowTimestamp(this.now) };
          await this.repository.saveSource(source);
        }
      }
    }
    const stats = await this.repository.getStats(workspaceId, projectId);
    const completedAt = nowTimestamp(this.now);
    const result = { indexed, unchanged, excluded, errors, stats };
    await this.writeAudit(
      actionRecord(
        errors.length ? "KNOWLEDGE_INDEX_FAILED" : "KNOWLEDGE_INDEX_COMPLETED",
        workspaceId,
        projectId,
        requestedAt,
        completedAt,
        result,
        `index-complete:${workspaceId}:${projectId}:${completedAt}`,
        errors.length ? { code: "KNOWLEDGE_INDEX_ERROR", message: `${errors.length} file(s) failed`, occurredAt: completedAt } : null
      )
    );
    return result;
  }

  async indexFile(workspaceId: string, projectId: string, file: KnowledgeFile): Promise<KnowledgeIndexResult> {
    return this.indexFiles(workspaceId, projectId, [file]);
  }

  async removeFile(workspaceId: string, projectId: string, pathValue: string): Promise<void> {
    const path = normalizeKnowledgePath(pathValue);
    const document = await this.repository.getDocumentByPath(workspaceId, projectId, path);
    const source = await this.repository.getSource(workspaceId, projectId, path);
    if (document) await this.repository.deleteDocument(document.id);
    if (source) await this.repository.deleteSource(source.id);
    const timestamp = nowTimestamp(this.now);
    await this.writeAudit(actionRecord("KNOWLEDGE_DOCUMENT_UPDATED", workspaceId, projectId, timestamp, timestamp, { path, operation: "DELETE" }, `document-delete:${workspaceId}:${projectId}:${path}`));
  }

  async renameFile(workspaceId: string, projectId: string, fromPath: string, file: KnowledgeFile): Promise<KnowledgeIndexResult> {
    await this.removeFile(workspaceId, projectId, fromPath);
    return this.indexFile(workspaceId, projectId, file);
  }

  async markStale(workspaceId: string, projectId: string, pathValue: string): Promise<KnowledgeSource | null> {
    const path = normalizeKnowledgePath(pathValue);
    const source = await this.repository.getSource(workspaceId, projectId, path);
    if (!source) return null;
    source.status = "STALE";
    await this.repository.saveSource(source);
    return source;
  }

  async search(request: KnowledgeSearchRequest): Promise<KnowledgeSearchResult[]> {
    this.validateScope(request.workspaceId, request.projectId ?? "workspace-root");
    const query = request.query.trim().toLowerCase();
    if (!query) throw new ValidationError("Knowledge search query is required.");
    const limit = Math.min(100, Math.max(1, request.limit ?? 20));
    const projectId = request.projectId;
    const sources = await this.repository.listSources(request.workspaceId, projectId);
    const sourceMap = new Map(sources.map(source => [source.id, source]));
    const documents = await this.repository.listDocuments(request.workspaceId, projectId);
    const results: KnowledgeSearchResult[] = [];
    const terms = query.split(/\s+/).filter(Boolean);
    for (const document of documents) {
      const source = sourceMap.get(document.sourceId);
      if (!source || (source.status === "EXCLUDED" && !request.filters?.includeExcluded)) continue;
      if (request.filters?.sourceTypes && !request.filters.sourceTypes.includes(source.type)) continue;
      if (request.filters?.paths && !request.filters.paths.some(path => document.path.startsWith(normalizeKnowledgePath(path)))) continue;
      const chunks = await this.repository.listChunks(document.id);
      for (const chunk of chunks) {
        const haystack = chunk.content.toLowerCase();
        const pathText = document.path.toLowerCase();
        let score: number;
        let scoreType: KnowledgeSearchResult["scoreType"] = "MATCH_COUNT";
        if (request.searchType === "PATH_SEARCH") {
          score = pathText.includes(query) ? 1 : 0;
          scoreType = "PATH_MATCH";
        } else if (request.searchType === "METADATA_SEARCH") {
          score = source.type.toLowerCase().includes(query) || document.projectId.toLowerCase().includes(query) ? 1 : 0;
          scoreType = "METADATA_MATCH";
        } else {
          score = terms.reduce((total, term) => total + haystack.split(term).length - 1, 0);
          if (pathText.includes(query)) score += 1;
        }
        if (score > 0) {
          results.push({
            documentId: document.id,
            path: document.path,
            chunkId: chunk.id,
            content: chunk.content,
            score,
            scoreType,
            metadata: {
              workspaceId: document.workspaceId,
              projectId: document.projectId,
              sourceId: source.id,
              sourceType: source.type,
              contentHash: document.contentHash,
              startLine: chunk.startLine,
              endLine: chunk.endLine,
            },
          });
        }
      }
    }
    const sorted = results.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path) || a.chunkId.localeCompare(b.chunkId)).slice(0, limit);
    const timestamp = nowTimestamp(this.now);
    await this.writeAudit(actionRecord("KNOWLEDGE_SEARCHED", request.workspaceId, projectId ?? null ?? "workspace-root", timestamp, timestamp, { query: request.query, searchType: request.searchType ?? "LEXICAL_SEARCH", resultCount: sorted.length, scoreType: sorted[0]?.scoreType ?? "MATCH_COUNT" }, `search:${this.createId()}`));
    return sorted;
  }

  async retrieveContext(
    request: KnowledgeSearchRequest,
    budget: ContextBudget
  ): Promise<ContextPack> {
    if (!Number.isFinite(budget.maxTokens) || budget.maxTokens < 1 || !Number.isFinite(budget.reservedTokens) || budget.reservedTokens < 0)
      throw new ValidationError("Context budget must contain finite non-negative values.");
    const available = Math.max(0, budget.maxTokens - budget.reservedTokens);
    const results = await this.search({ ...request, limit: Math.min(request.limit ?? 50, 100) });
    const selected: KnowledgeSearchResult[] = [];
    let estimatedSize = 0;
    for (const result of results) {
      const nextSize = tokenCount(result.content);
      if (estimatedSize + nextSize > available) continue;
      selected.push(result);
      estimatedSize += nextSize;
    }
    return {
      query: request.query,
      results: selected,
      sources: selected.map(result => ({
        workspaceId: result.metadata.workspaceId,
        projectId: result.metadata.projectId,
        path: result.path,
        documentId: result.documentId,
        chunkId: result.chunkId,
        contentHash: result.metadata.contentHash,
        startLine: result.metadata.startLine,
        endLine: result.metadata.endLine,
      })),
      estimatedSize,
      budget: {
        maxTokens: budget.maxTokens,
        reservedTokens: budget.reservedTokens,
        remainingTokens: Math.max(0, available - estimatedSize),
        estimation: "APPROXIMATE",
      },
      createdAt: nowTimestamp(this.now),
    };
  }

  listSources(workspaceId: string, projectId?: string): Promise<KnowledgeSource[]> {
    return this.repository.listSources(workspaceId, projectId);
  }

  listDocuments(workspaceId: string, projectId?: string): Promise<KnowledgeDocument[]> {
    return this.repository.listDocuments(workspaceId, projectId);
  }

  getDocument(documentId: string): Promise<KnowledgeDocument | null> {
    return this.repository.getDocument(documentId);
  }

  getChunks(documentId: string) {
    return this.repository.listChunks(documentId);
  }

  getStats(workspaceId: string, projectId?: string): Promise<KnowledgeIndexStats> {
    return this.repository.getStats(workspaceId, projectId);
  }

  private validateScope(workspaceId: string, projectId: string): void {
    if (!workspaceId.trim()) throw new ValidationError("Knowledge workspaceId is required.");
    if (!projectId.trim()) throw new ValidationError("Knowledge projectId is required.");
  }

  private async writeAudit(record: KnowledgeAuditRecord): Promise<void> {
    try {
      await this.audit.append(record);
    } catch {
      // Knowledge operations remain truthful even if secondary audit persistence fails.
    }
  }
}
