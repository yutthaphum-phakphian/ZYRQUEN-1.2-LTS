import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Bot, Cpu, Gauge, HeartPulse, Radio, ShieldCheck, Timer, Workflow } from "lucide-react";
import type { WorkspacePlatform } from "../core/platform";
import type { WorkspaceOverview } from "../core/workspace/overview";
import type { ObservabilityEvent, ObservabilityMetrics, SystemHealthCheck, SystemHealthReport } from "../core/observability/types";

function stateTone(state: string): string {
  return state.toLowerCase().replaceAll("_", "-");
}

function StateBadge({ state }: { state: string }) {
  return <span className={`observability-state ${stateTone(state)}`}>{state}</span>;
}

function HealthCard({ check }: { check: SystemHealthCheck }) {
  const hasEvidence = !["UNKNOWN", "NOT_CONFIGURED"].includes(check.status) && Object.keys(check.evidence).length > 0;
  return (
    <article className="panel observability-health-card">
      <div className="observability-card-top">
        <strong>{check.id}</strong>
        <StateBadge state={check.status} />
      </div>
      <p>{check.message}</p>
      <small>{hasEvidence ? "Evidence available" : "No evidence / provider configured"}</small>
    </article>
  );
}

function MetricNumber({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div className="observability-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

export function ObservabilityPanel({
  platform,
  overview,
}: {
  platform: WorkspacePlatform | null;
  overview: WorkspaceOverview | null;
}) {
  const workspaces = overview?.workspaces.filter(workspace => workspace.status !== "DESTROYED") ?? [];
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [health, setHealth] = useState<SystemHealthReport | null>(null);
  const [metrics, setMetrics] = useState<ObservabilityMetrics | null>(null);
  const [stream, setStream] = useState<ReturnType<WorkspacePlatform["eventStream"]["query"]> | null>(null);
  const [workspaceHealth, setWorkspaceHealth] = useState<SystemHealthCheck | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedWorkspace && workspaces[0]) setSelectedWorkspace(workspaces[0].id);
    if (selectedWorkspace && !workspaces.some(workspace => workspace.id === selectedWorkspace)) setSelectedWorkspace(workspaces[0]?.id ?? "");
  }, [workspaces, selectedWorkspace]);

  useEffect(() => {
    if (!platform) return;
    let mounted = true;
    const refresh = async () => {
      try {
        const [nextHealth, nextMetrics, nextStream, nextWorkspaceHealth] = await Promise.all([
          platform.observability.health(),
          platform.observability.metrics(),
          Promise.resolve(platform.eventStream.query({ limit: 30 })),
          selectedWorkspace ? platform.observability.workspaceHealth(selectedWorkspace) : Promise.resolve(null),
        ]);
        if (!mounted) return;
        setHealth(nextHealth);
        setMetrics(nextMetrics);
        setStream(nextStream);
        setWorkspaceHealth(nextWorkspaceHealth);
        setError(null);
      } catch (cause) {
        if (mounted) setError(cause instanceof Error ? cause.message : String(cause));
      }
    };
    void refresh();
    const unsubscribe = platform.eventStream.subscribe(() => void refresh());
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [platform, selectedWorkspace]);

  if (!platform) return <section className="panel core-empty"><Activity size={22} /><strong>Observability unavailable</strong><span>Platform ยังไม่พร้อม</span></section>;

  const failures = stream?.events.filter(event => ["ERROR", "CRITICAL"].includes(event.severity)) ?? [];
  const runtimeCheck = health?.components.find(component => component.id === "RUNTIME");
  const executionCheck = health?.components.find(component => component.id === "EXECUTION");
  const knowledgeCheck = health?.components.find(component => component.id === "KNOWLEDGE");
  const aiCheck = health?.components.find(component => component.id === "AI");

  return (
    <div className="observability-layout">
      <section className="panel section-list observability-hero">
        <div className="panel-heading">
          <div>
            <div className="panel-title-row"><span className="panel-icon cyan"><HeartPulse size={16} /></span><h2>System Health</h2></div>
            <p>Derived จาก evidence ใน Local Core เท่านั้น · ไม่มี fake telemetry</p>
          </div>
          <StateBadge state={health?.status ?? "UNKNOWN"} />
        </div>
        <div className="observability-health-grid">
          {(health?.components ?? []).map(check => <HealthCard check={check} key={check.id} />)}
        </div>
        {health?.limitations.map(limitation => <div className="core-inline-note" key={limitation}><ShieldCheck size={14} />{limitation}</div>)}
        {error && <div className="core-alert-row"><AlertTriangle size={16} /><span>{error}</span></div>}
      </section>

      <section className="panel section-list">
        <div className="panel-heading"><div><h2>Observability snapshot</h2><p>ค่าจาก WorkspaceRepository, CommandEngine, EventBus, AuditRepository, ResourceEngine และ KnowledgeRepository</p></div><span className="not-configured-pill">LOCAL CORE</span></div>
        <div className="observability-metric-grid">
          <MetricNumber label="Workspaces" value={metrics?.workspaces.total ?? "—"} note={`${metrics?.workspaces.active ?? "—"} active · ${metrics?.workspaces.errors ?? "—"} errors`} />
          <MetricNumber label="Commands" value={metrics?.commands.liveTotal ?? "—"} note={`${metrics?.commands.succeeded ?? "—"} succeeded · ${metrics?.commands.failed ?? "—"} failed`} />
          <MetricNumber label="Events" value={metrics?.events.sessionTotal ?? "—"} note="session-only EventBus" />
          <MetricNumber label="Audit" value={metrics?.audit.durableTotal ?? "—"} note={`${metrics?.audit.commandRecords ?? "—"} command · ${metrics?.audit.knowledgeRecords ?? "—"} knowledge`} />
        </div>
      </section>

      <div className="observability-two-column">
        <section className="panel section-list">
          <div className="panel-heading"><div><div className="panel-title-row"><Radio size={16} /><h2>Event Stream</h2></div><p>Operational stream จาก LocalEventBus · ไม่ใช่ Audit database</p></div><span className="count-chip">{stream?.count ?? 0} events</span></div>
          <div className="observability-event-list">
            {(stream?.events ?? []).slice().reverse().map((event: ObservabilityEvent) => <div className="observability-event-row" key={event.eventId}>
              <StateBadge state={event.severity} /><span className="observability-event-source">{event.source}</span><strong>{event.eventType}</strong><small>{event.workspaceId ?? "SYSTEM"} · {event.correlationId ?? "NO_CORRELATION"}</small><time>{new Date(event.timestamp).toLocaleTimeString("th-TH")}</time>
            </div>)}
            {!stream?.events.length && <div className="core-empty"><Radio size={22} /><strong>ยังไม่มี Event evidence</strong><span>Event Stream เป็น session-only และไม่สร้าง sample event</span></div>}
          </div>
        </section>

        <section className="panel section-list">
          <div className="panel-heading"><div><h2>Recent failures</h2><p>เฉพาะ ERROR/CRITICAL จาก Event Stream จริง</p></div><span className="count-chip">{failures.length}</span></div>
          <div className="observability-failure-list">
            {failures.slice().reverse().map(event => <div className="core-alert-row" key={event.eventId}><AlertTriangle size={16} /><div><strong>{event.eventType}</strong><span>{event.source} · {event.workspaceId ?? "SYSTEM"} · {event.correlationId ?? "NO_CORRELATION"}</span></div><time>{new Date(event.timestamp).toLocaleTimeString("th-TH")}</time></div>)}
            {!failures.length && <div className="core-empty"><ShieldCheck size={22} /><strong>ยังไม่มี failure evidence</strong><span>ไม่มีการสร้าง failure เพื่อเติม dashboard</span></div>}
          </div>
        </section>
      </div>

      <div className="observability-two-column">
        <section className="panel section-list">
          <div className="panel-heading"><div><div className="panel-title-row"><Workflow size={16} /><h2>Workspace Health</h2></div><p>StateMachine / WorkspaceRepository evidence</p></div></div>
          <select className="observability-select" value={selectedWorkspace} onChange={event => setSelectedWorkspace(event.target.value)}><option value="">เลือก Workspace</option>{workspaces.map(workspace => <option key={workspace.id} value={workspace.id}>{workspace.name} · {workspace.status}</option>)}</select>
          {workspaceHealth ? <div className="observability-evidence"><StateBadge state={workspaceHealth.status} /><strong>{workspaceHealth.message}</strong><small>{JSON.stringify(workspaceHealth.evidence)}</small></div> : <div className="core-empty"><Workflow size={22} /><span>ยังไม่มี Workspace evidence</span></div>}
        </section>
        <section className="panel section-list">
          <div className="panel-heading"><div><div className="panel-title-row"><Cpu size={16} /><h2>Runtime / Execution</h2></div><p>แสดงเฉพาะ capability และผล execution ที่มี source จริง</p></div></div>
          <div className="observability-detail-row"><Gauge size={16} /><span>Runtime</span><StateBadge state={runtimeCheck?.status ?? "UNKNOWN"} /><small>{metrics?.runtime.provider ?? "—"} · {metrics?.runtime.availability ?? "UNKNOWN"}</small></div>
          <div className="observability-detail-row"><Timer size={16} /><span>Execution</span><StateBadge state={executionCheck?.status ?? "UNKNOWN"} /><small>{metrics?.commands.succeeded ?? "—"} succeeded · {metrics?.commands.failed ?? "—"} failed</small></div>
          <div className="observability-detail-row"><Bot size={16} /><span>AI</span><StateBadge state={aiCheck?.status ?? "NOT_CONFIGURED"} /><small>No AI provider/runtime configured</small></div>
          <div className="observability-detail-row"><Activity size={16} /><span>Knowledge</span><StateBadge state={knowledgeCheck?.status ?? "UNKNOWN"} /><small>{metrics?.knowledge?.documents ?? "—"} documents · lexical MATCH_COUNT only</small></div>
        </section>
      </div>
    </div>
  );
}
