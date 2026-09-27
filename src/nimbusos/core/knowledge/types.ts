import type { AuditRecord, WorkspaceError } from "../types";

export const KNOWLEDGE_SOURCE_TYPES = [
  "FILE",
  "DIRECTORY",
  "PROJECT_METADATA",
  "TEST_RESULT",
  "BUILD_RESULT",
  "DEVELOPMENT_ARTIFACT",
  "AUDIT_REFERENCE",
] as const;
export type KnowledgeSourceType = (typeof KNOWLEDGE_SOURCE_TYPES)[number];

export const KNOWLEDGE_INDEX_STATUSES = [
  "NOT_INDEXED",
  "INDEXING",
  "INDEXED",
  "STALE",
  "ERROR",
  "EXCLUDED",
] as const;
export type KnowledgeIndexStatus = (typeof KNOWLEDGE_INDEX_STATUSES)[number];

export interface KnowledgeSource {
  id: string;
  workspaceId: string;
  projectId: string;
  type: KnowledgeSourceType;
  path: string;
  status: KnowledgeIndexStatus;
  excludedReason: string | null;
  lastIndexedAt: string | null;
  error: WorkspaceError | null;
}

export interface KnowledgeDocument {
  id: string;
  sourceId: string;
  workspaceId: string;
  projectId: string;
  path: string;
  contentHash: string;
  size: number;
  mtime: string | null;
  updatedAt: string;
  indexedAt: string;
  chunkIds: string[];
}

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  sequence: number;
  content: string;
  startOffset: number;
  endOffset: number;
  startLine: number | null;
  endLine: number | null;
}

export interface KnowledgeFile {
  path: string;
  content: string;
  mtime?: string;
}

export interface KnowledgeIndexStats {
  sources: number;
  documents: number;
  chunks: number;
  excluded: number;
  errors: number;
  stale: number;
  lastIndexedAt: string | null;
  indexDurationMs: number | null;
}

export type KnowledgeSearchType =
  | "LEXICAL_SEARCH"
  | "PATH_SEARCH"
  | "METADATA_SEARCH";
export type KnowledgeScoreType = "MATCH_COUNT" | "PATH_MATCH" | "METADATA_MATCH";

export interface KnowledgeSearchFilters {
  sourceTypes?: KnowledgeSourceType[];
  paths?: string[];
  includeExcluded?: boolean;
}

export interface KnowledgeSearchRequest {
  workspaceId: string;
  projectId?: string;
  query: string;
  limit?: number;
  searchType?: KnowledgeSearchType;
  filters?: KnowledgeSearchFilters;
}

export interface KnowledgeSearchResult {
  documentId: string;
  path: string;
  chunkId: string;
  content: string;
  score: number;
  scoreType: KnowledgeScoreType;
  metadata: {
    workspaceId: string;
    projectId: string;
    sourceId: string;
    sourceType: KnowledgeSourceType;
    contentHash: string;
    startLine: number | null;
    endLine: number | null;
  };
}

export interface ContextBudget {
  maxTokens: number;
  reservedTokens: number;
  remainingTokens: number;
  estimation: "APPROXIMATE";
}

export interface ContextPack {
  query: string;
  results: KnowledgeSearchResult[];
  sources: Array<{
    workspaceId: string;
    projectId: string;
    path: string;
    documentId: string;
    chunkId: string;
    contentHash: string;
    startLine: number | null;
    endLine: number | null;
  }>;
  estimatedSize: number;
  budget: ContextBudget;
  createdAt: string;
}

export interface KnowledgeRepository {
  listSources(workspaceId: string, projectId?: string): Promise<KnowledgeSource[]>;
  getSource(workspaceId: string, projectId: string, path: string): Promise<KnowledgeSource | null>;
  saveSource(source: KnowledgeSource): Promise<KnowledgeSource>;
  deleteSource(sourceId: string): Promise<void>;
  listDocuments(workspaceId: string, projectId?: string): Promise<KnowledgeDocument[]>;
  getDocument(documentId: string): Promise<KnowledgeDocument | null>;
  getDocumentByPath(workspaceId: string, projectId: string, path: string): Promise<KnowledgeDocument | null>;
  saveDocument(document: KnowledgeDocument): Promise<KnowledgeDocument>;
  deleteDocument(documentId: string): Promise<void>;
  listChunks(documentId: string): Promise<KnowledgeChunk[]>;
  saveChunks(documentId: string, chunks: KnowledgeChunk[]): Promise<void>;
  getStats(workspaceId: string, projectId?: string): Promise<KnowledgeIndexStats>;
  clear(workspaceId: string, projectId?: string): Promise<void>;
}

export interface KnowledgeAuditWriter {
  append(record: AuditRecord): Promise<void>;
}
