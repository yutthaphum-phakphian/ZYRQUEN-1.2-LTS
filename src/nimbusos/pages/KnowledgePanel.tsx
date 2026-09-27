import { useEffect, useState, type ChangeEvent } from "react";
import { BookOpen, FileCode2, FolderSearch, Search, ShieldCheck } from "lucide-react";
import type { WorkspacePlatform } from "../core/platform";
import type { WorkspaceOverview } from "../core/workspace/overview";
import type {
  ContextPack,
  KnowledgeFile,
  KnowledgeIndexStats,
  KnowledgeSearchResult,
  KnowledgeSource,
} from "../core/knowledge/types";

function formatNumber(value: number): string {
  return new Intl.NumberFormat("th-TH").format(value);
}

function sourceStatusLabel(source: KnowledgeSource): string {
  return source.excludedReason ? `${source.status} · ${source.excludedReason}` : source.status;
}

export function KnowledgePanel({
  platform,
  overview,
}: {
  platform: WorkspacePlatform | null;
  overview: WorkspaceOverview | null;
}) {
  const workspace = overview?.workspaces.find(item => item.status !== "DESTROYED") ?? null;
  const workspaceId = workspace?.id ?? "";
  const [projectId, setProjectId] = useState("workspace-root");
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [stats, setStats] = useState<KnowledgeIndexStats | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KnowledgeSearchResult[]>([]);
  const [context, setContext] = useState<ContextPack | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    if (!platform || !workspaceId) return;
    const [nextSources, nextStats] = await Promise.all([
      platform.knowledge.sources(workspaceId, projectId),
      platform.knowledge.stats(workspaceId, projectId),
    ]);
    setSources(nextSources);
    setStats(nextStats);
  }

  useEffect(() => {
    void refresh().catch(error => setMessage(error instanceof Error ? error.message : String(error)));
  }, [platform, workspaceId, projectId]);

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    const loaded = await Promise.all(
      selected.map(async file => ({
        path: file.webkitRelativePath || file.name,
        content: await file.text(),
        mtime: file.lastModified ? new Date(file.lastModified).toISOString() : undefined,
      }))
    );
    setFiles(loaded);
    setMessage(`${loaded.length} file(s) loaded from the browser picker`);
  }

  async function indexSelected() {
    if (!platform || !workspaceId || !files.length) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await platform.knowledge.indexFiles(workspaceId, projectId, files);
      await refresh();
      setMessage(`Indexed ${result.indexed.length}, unchanged ${result.unchanged.length}, excluded ${result.excluded.length}, errors ${result.errors.length}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function runSearch() {
    if (!platform || !workspaceId || !query.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const nextResults = await platform.knowledge.search({
        workspaceId,
        projectId,
        query,
        limit: 20,
      });
      setResults(nextResults);
      setContext(null);
      setMessage(`${nextResults.length} traceable result(s) · lexical score`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function retrieveContext() {
    if (!platform || !workspaceId || !query.trim()) return;
    setBusy(true);
    try {
      const nextContext = await platform.knowledge.retrieveContext(
        { workspaceId, projectId, query, limit: 20 },
        { maxTokens: 1200, reservedTokens: 200, remainingTokens: 1000, estimation: "APPROXIMATE" }
      );
      setContext(nextContext);
      setMessage(`${nextContext.results.length} chunk(s) selected · approximate budget`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  if (!platform || !workspace) {
    return (
      <section className="panel core-empty">
        <BookOpen size={24} />
        <strong>สร้าง Workspace ก่อนเริ่ม Knowledge index</strong>
        <span>Knowledge scope ต้องผูกกับ Workspace จริง และไม่มีข้อมูลตัวอย่าง</span>
      </section>
    );
  }

  return (
    <div className="knowledge-layout">
      <section className="panel section-list">
        <div className="panel-heading">
          <div>
            <div className="panel-title-row">
              <span className="panel-icon cyan"><BookOpen size={16} /></span>
              <h2>Knowledge index</h2>
            </div>
            <p>{workspace.name} · local browser file picker · project scope required</p>
          </div>
          <span className="not-configured-pill">LOCAL · LEXICAL</span>
        </div>
        <div className="knowledge-controls">
          <label>
            <span>Project ID</span>
            <input value={projectId} onChange={event => setProjectId(event.target.value)} />
          </label>
          <label>
            <span>Source files</span>
            <input type="file" multiple accept=".ts,.tsx,.js,.jsx,.json,.md,.css,.html,.yaml,.yml,.txt" onChange={event => void handleFiles(event)} />
          </label>
          <div className="knowledge-action-row">
            <button className="button button-primary" disabled={busy || !files.length} onClick={() => void indexSelected()}>
              <FolderSearch size={16} />
              {busy ? "กำลังทำงาน..." : `Index ${files.length || 0} file(s)`}
            </button>
            <span className="core-inline-note"><ShieldCheck size={14} /> secret/excluded paths never enter index</span>
          </div>
        </div>
        {message && <div className="core-inline-note">{message}</div>}
      </section>

      <section className="panel section-list">
        <div className="panel-heading">
          <div>
            <h2>Actual index state</h2>
            <p>ตัวเลขจาก KnowledgeRepository จริง · ไม่มี fake counts</p>
          </div>
          <span className="count-chip">{stats ? `${formatNumber(stats.documents)} docs` : "LOADING"}</span>
        </div>
        <div className="knowledge-stat-grid">
          <span>Sources<strong>{formatNumber(stats?.sources ?? 0)}</strong></span>
          <span>Documents<strong>{formatNumber(stats?.documents ?? 0)}</strong></span>
          <span>Chunks<strong>{formatNumber(stats?.chunks ?? 0)}</strong></span>
          <span>Excluded<strong>{formatNumber(stats?.excluded ?? 0)}</strong></span>
          <span>Errors<strong>{formatNumber(stats?.errors ?? 0)}</strong></span>
          <span>Stale<strong>{formatNumber(stats?.stale ?? 0)}</strong></span>
        </div>
        <div className="knowledge-source-list">
          {sources.map(source => (
            <div className="knowledge-source-row" key={source.id}>
              <FileCode2 size={15} />
              <span><strong>{source.path}</strong><small>{sourceStatusLabel(source)}</small></span>
              <time>{source.lastIndexedAt ? new Date(source.lastIndexedAt).toLocaleTimeString("th-TH") : "—"}</time>
            </div>
          ))}
          {!sources.length && <div className="core-empty"><span>ยังไม่มี source จาก filesystem จริง</span></div>}
        </div>
      </section>

      <section className="panel section-list knowledge-search-panel">
        <div className="panel-heading">
          <div>
            <h2>Local search</h2>
            <p>LEXICAL_SEARCH · score = MATCH_COUNT ไม่ใช่ semantic similarity</p>
          </div>
          <span className="not-configured-pill">NO EMBEDDINGS</span>
        </div>
        <div className="knowledge-search-form">
          <Search size={17} />
          <input value={query} placeholder="ค้นหาใน indexed documents..." onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === "Enter") void runSearch(); }} />
          <button className="button button-primary" disabled={busy || !query.trim()} onClick={() => void runSearch()}>ค้นหา</button>
          <button className="button button-secondary" disabled={busy || !query.trim()} onClick={() => void retrieveContext()}>Retrieve context</button>
        </div>
        <div className="knowledge-results">
          {results.map(result => (
            <article className="knowledge-result-row" key={result.chunkId}>
              <div><strong>{result.path}</strong><span>{result.metadata.startLine ? `lines ${result.metadata.startLine}-${result.metadata.endLine}` : "OFFSET_ONLY"} · {result.scoreType} {result.score}</span></div>
              <p>{result.content}</p>
              <small>{result.metadata.workspaceId} / {result.metadata.projectId} · hash {result.metadata.contentHash}</small>
            </article>
          ))}
          {!results.length && <div className="core-empty"><Search size={22} /><span>ผลค้นหาจะปรากฏจาก index จริง</span></div>}
        </div>
        {context && (
          <div className="knowledge-context">
            <strong>Context pack</strong>
            <span>{context.results.length} chunks · estimated {context.estimatedSize} tokens · remaining {context.budget.remainingTokens} · {context.budget.estimation}</span>
            {context.sources.map(source => <small key={source.chunkId}>{source.path} · {source.documentId} · {source.chunkId}</small>)}
          </div>
        )}
      </section>
    </div>
  );
}
