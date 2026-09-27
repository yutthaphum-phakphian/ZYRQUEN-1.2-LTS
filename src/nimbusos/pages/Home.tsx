import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  ArrowUpRight,
  Bell,
  Blocks,
  BookOpen,
  Bot,
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Command,
  Cpu,
  FileClock,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  LifeBuoy,
  LockKeyhole,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RotateCcw,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  TerminalSquare,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "../lib/toast";
import {
  createWorkspacePlatform,
  type WorkspacePlatform,
} from "../core/platform";
import { workspaceNeedsCleanup } from "../core/workspace/domain";
import { WORKSPACE_STATUSES } from "../core/types";
import type { WorkspaceOverview } from "../core/workspace/overview";
import type {
  AuditRecord,
  CommandType,
  ResourceCapacity,
  ResourceKind,
  RuntimeCapabilities,
  Workspace,
  WorkspaceEvent,
  WorkspaceStatus,
} from "../core/types";
import { KnowledgePanel } from "./KnowledgePanel";
import { ObservabilityPanel } from "./ObservabilityPanel";

type NavKey =
  | "overview"
  | "observability"
  | "workspaces"
  | "templates"
  | "agents"
  | "resources"
  | "knowledge"
  | "operations"
  | "logs"
  | "audit"
  | "alerts";
type NavItem = { key: NavKey; label: string; icon: LucideIcon; count?: string };

const navItems: NavItem[] = [
  { key: "overview", label: "ภาพรวม", icon: LayoutDashboard },
  { key: "observability", label: "Observability", icon: Activity },
  { key: "workspaces", label: "พื้นที่ทำงาน", icon: FolderKanban },
  { key: "templates", label: "Templates", icon: Blocks },
  { key: "agents", label: "AI Agents", icon: Bot },
  { key: "resources", label: "Resources", icon: Cpu },
  { key: "knowledge", label: "Knowledge", icon: BookOpen },
  { key: "operations", label: "Operations", icon: Gauge },
  { key: "logs", label: "Logs", icon: TerminalSquare },
  { key: "audit", label: "Audit", icon: FileClock },
  { key: "alerts", label: "Alerts", icon: AlertTriangle },
];

const moduleCopy: Record<
  NavKey,
  { eyebrow: string; title: string; description: string; icon: LucideIcon }
> = {
  overview: {
    eyebrow: "COMMAND CENTER",
    title: "ภาพรวม",
    description: "สถานะ Workspace และ Resource reservation จากระบบ Local Core",
    icon: LayoutDashboard,
  },
  observability: {
    eyebrow: "SYSTEM OBSERVABILITY",
    title: "Observability",
    description: "System Health และ Event Stream จาก evidence ของ Local Core",
    icon: Activity,
  },
  workspaces: {
    eyebrow: "DEVELOPMENT",
    title: "พื้นที่ทำงาน",
    description: "Workspace ใน Local Development Storage",
    icon: FolderKanban,
  },
  templates: {
    eyebrow: "STARTER KITS",
    title: "Templates",
    description: "ยังไม่รวม Template catalog ใน Foundation scope",
    icon: Blocks,
  },
  agents: {
    eyebrow: "AI OPERATIONS",
    title: "AI Agents",
    description: "ยังไม่รวม AI Agent System ใน Foundation scope",
    icon: Bot,
  },
  resources: {
    eyebrow: "RESOURCE CORE",
    title: "Resources",
    description:
      "Quota reservation จาก Resource Engine · ไม่ใช่ Host telemetry",
    icon: Cpu,
  },
  knowledge: {
    eyebrow: "LOCAL KNOWLEDGE",
    title: "Knowledge",
    description: "Index และค้นหา project context จากไฟล์จริงใน Browser session",
    icon: BookOpen,
  },
  operations: {
    eyebrow: "LOCAL RUNTIME",
    title: "Operations",
    description: "Local Runtime capabilities ภายใน Browser tab",
    icon: Gauge,
  },
  logs: {
    eyebrow: "OBSERVABILITY",
    title: "Logs",
    description: "Runtime logs ยังไม่มีใน Local Worker foundation",
    icon: TerminalSquare,
  },
  audit: {
    eyebrow: "COMMAND AUDIT",
    title: "Audit",
    description: "Terminal Command history จาก Local Storage แบบ retention-capped",
    icon: FileClock,
  },
  alerts: {
    eyebrow: "INCIDENTS",
    title: "Alerts",
    description: "แสดง Error ที่บันทึกอยู่ใน Workspace Core เท่านั้น",
    icon: AlertTriangle,
  },
};

const resourceOrder: ResourceKind[] = [
  "CPU",
  "MEMORY",
  "STORAGE",
  "RUNTIME_INSTANCE",
  "PROCESS",
  "PORT",
];
const resourceLabels: Record<ResourceKind, string> = {
  CPU: "CPU",
  MEMORY: "Memory",
  STORAGE: "Storage",
  PROCESS: "Process",
  PORT: "Port",
  RUNTIME_INSTANCE: "Runtime",
};
const commandActions: Array<{
  command: CommandType;
  label: string;
  icon: LucideIcon;
}> = [
  { command: "START_WORKSPACE", label: "เริ่ม", icon: ArrowUpRight },
  { command: "STOP_WORKSPACE", label: "หยุด", icon: Check },
  { command: "RESTART_WORKSPACE", label: "Restart", icon: Activity },
  { command: "INSPECT_WORKSPACE", label: "Inspect", icon: Search },
  { command: "DESTROY_WORKSPACE", label: "ทำลาย", icon: Trash2 },
];

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function relativeTime(iso: string): string {
  const age = Math.max(0, Date.now() - new Date(iso).getTime());
  if (age < 60_000) return "เมื่อครู่นี้";
  if (age < 3_600_000) return `${Math.floor(age / 60_000)} นาทีที่แล้ว`;
  if (age < 86_400_000) return `${Math.floor(age / 3_600_000)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(age / 86_400_000)} วันที่แล้ว`;
}

function eventLabel(event: WorkspaceEvent): {
  title: string;
  detail: string;
  icon: LucideIcon;
  tone: string;
} {
  const name =
    typeof event.payload.name === "string"
      ? event.payload.name
      : typeof event.payload.workspaceName === "string"
        ? event.payload.workspaceName
        : event.workspaceId;
  switch (event.eventType) {
    case "WORKSPACE_CREATED":
      return {
        title: "สร้าง Workspace record",
        detail: name,
        icon: FolderKanban,
        tone: "cyan",
      };
    case "WORKSPACE_READY":
      return {
        title: "Workspace พร้อมใช้งาน",
        detail: name,
        icon: Check,
        tone: "emerald",
      };
    case "WORKSPACE_STARTED":
      return {
        title: "เริ่ม Workspace",
        detail: name,
        icon: Server,
        tone: "emerald",
      };
    case "WORKSPACE_STOPPED":
      return {
        title: "หยุด Workspace",
        detail: name,
        icon: Check,
        tone: "amber",
      };
    case "WORKSPACE_RESTARTED":
      return {
        title: "Restart Workspace",
        detail: name,
        icon: Activity,
        tone: "violet",
      };
    case "WORKSPACE_DESTROYED":
      return {
        title: "ทำลาย Workspace",
        detail: name,
        icon: Trash2,
        tone: "amber",
      };
    case "RESOURCE_ALLOCATED":
      return {
        title: "จอง Resource quota",
        detail: event.workspaceId,
        icon: Cpu,
        tone: "cyan",
      };
    case "RESOURCE_RELEASED":
      return {
        title: "คืน Resource quota",
        detail: event.workspaceId,
        icon: Cpu,
        tone: "violet",
      };
    case "WORKSPACE_ERROR":
      return {
        title: "Workspace error",
        detail:
          typeof event.payload.message === "string"
            ? event.payload.message
            : name,
        icon: AlertTriangle,
        tone: "amber",
      };
    case "COMMAND_FAILED":
      return {
        title: "Command ล้มเหลว",
        detail:
          typeof event.payload.commandType === "string"
            ? event.payload.commandType
            : name,
        icon: AlertTriangle,
        tone: "amber",
      };
    case "STATE_TRANSITIONED":
      return {
        title: "State Machine เปลี่ยนสถานะ",
        detail: `${String(event.payload.fromStatus)} → ${String(event.payload.toStatus)} · ${name}`,
        icon: ArrowRightLeft,
        tone: event.payload.toStatus === "ERROR" ? "amber" : "violet",
      };
    case "COMMAND_QUEUED":
      return {
        title: "Command เข้าคิว",
        detail:
          typeof event.payload.commandType === "string"
            ? event.payload.commandType
            : name,
        icon: Clock3,
        tone: "violet",
      };
    case "COMMAND_STARTED":
      return {
        title: "Command กำลังทำงาน",
        detail:
          typeof event.payload.commandType === "string"
            ? event.payload.commandType
            : name,
        icon: Activity,
        tone: "cyan",
      };
    default:
      return {
        title: "Command สำเร็จ",
        detail: name,
        icon: Activity,
        tone: "cyan",
      };
  }
}

function ResourceBar({ resource }: { resource: ResourceCapacity }) {
  const percent =
    resource.limit > 0
      ? Math.min(100, (resource.allocated / resource.limit) * 100)
      : 0;
  const tone =
    percent >= 85
      ? "amber"
      : resource.kind === "MEMORY" || resource.kind === "RUNTIME_INSTANCE"
        ? "violet"
        : "cyan";
  const allocated = `${resource.allocated} / ${resource.limit} ${resource.unit}`;
  return (
    <div className="quota-resource-row">
      <div className="quota-resource-meta">
        <strong>{resourceLabels[resource.kind]}</strong>
        <span>{allocated}</span>
      </div>
      <div
        className="quota-track"
        role="img"
        aria-label={`${resourceLabels[resource.kind]} จองแล้ว ${allocated}`}
      >
        <span
          className={`quota-fill ${tone}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="quota-resource-foot">
        <span>
          {resource.quotaState === "CONFIGURED"
            ? "Configured local quota"
            : "NOT_CONFIGURED"}
        </span>
        <span>
          {resource.usageState === "AVAILABLE" && resource.used !== null
            ? `ใช้จริง ${resource.used} ${resource.unit}`
            : "Host usage UNAVAILABLE"}
        </span>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Workspace["status"] }) {
  const tone =
    status === "RUNNING"
      ? "healthy"
      : status === "ERROR"
        ? "error"
        : status === "READY"
          ? "ready"
          : status === "STOPPED" || status === "DESTROYED"
            ? "stopped"
            : "configuring";
  const label: Record<Workspace["status"], string> = {
    CREATING: "กำลังสร้าง",
    INITIALIZING: "กำลังเตรียม",
    READY: "พร้อมเริ่ม",
    STARTING: "กำลังเริ่ม",
    RUNNING: "กำลังทำงาน",
    STOPPING: "กำลังหยุด",
    STOPPED: "หยุดอยู่",
    RESTARTING: "กำลัง Restart",
    DESTROYING: "กำลังทำลาย",
    DESTROYED: "ถูกทำลาย",
    ERROR: "เกิดข้อผิดพลาด",
  };
  return (
    <span className={`health-tag ${tone}`}>
      <i />
      {label[status]}
    </span>
  );
}

function formatAmount(amount: number, unit: string): string {
  return `${amount} ${unit}`;
}

function WorkspaceRow({
  workspace,
  onAction,
  busy,
}: {
  workspace: Workspace;
  onAction: (workspace: Workspace, command: CommandType) => void;
  busy: boolean;
}) {
  const allowed: Record<Workspace["status"], CommandType[]> = {
    CREATING: ["INSPECT_WORKSPACE"],
    INITIALIZING: ["INSPECT_WORKSPACE"],
    READY: ["START_WORKSPACE", "INSPECT_WORKSPACE", "DESTROY_WORKSPACE"],
    STARTING: ["INSPECT_WORKSPACE"],
    RUNNING: [
      "STOP_WORKSPACE",
      "RESTART_WORKSPACE",
      "INSPECT_WORKSPACE",
      "DESTROY_WORKSPACE",
    ],
    STOPPING: ["INSPECT_WORKSPACE"],
    STOPPED: ["START_WORKSPACE", "INSPECT_WORKSPACE", "DESTROY_WORKSPACE"],
    RESTARTING: ["INSPECT_WORKSPACE"],
    DESTROYING: ["INSPECT_WORKSPACE"],
    DESTROYED: [],
    ERROR: ["INSPECT_WORKSPACE", "DESTROY_WORKSPACE"],
  };
  const isBusy =
    busy ||
    [
      "CREATING",
      "INITIALIZING",
      "STARTING",
      "STOPPING",
      "RESTARTING",
      "DESTROYING",
    ].includes(workspace.status);
  return (
    <div className="core-workspace-row">
      <span
        className={`workspace-mark ${workspace.status === "ERROR" ? "amber" : workspace.status === "RUNNING" ? "cyan" : "violet"}`}
      >
        <Box size={16} />
      </span>
      <div className="core-workspace-name">
        <strong>{workspace.name}</strong>
        <small>
          {workspace.id} · {workspace.runtime.provider} runtime
        </small>
      </div>
      <StatusPill status={workspace.status} />
      <div className="core-resource-cell">
        <span>CPU</span>
        <strong>
          {formatAmount(workspace.resources.allocated.CPU, "core")}
        </strong>
      </div>
      <div className="core-resource-cell">
        <span>Memory</span>
        <strong>
          {formatAmount(workspace.resources.allocated.MEMORY, "MiB")}
        </strong>
      </div>
      <div className="core-resource-cell">
        <span>Storage</span>
        <strong>
          {formatAmount(workspace.resources.allocated.STORAGE, "GiB")}
        </strong>
      </div>
      <div className="core-workspace-runtime">
        <span>{workspace.runtime.availability}</span>
        <small>{relativeTime(workspace.lastActivityAt)}</small>
      </div>
      <div className="core-workspace-actions">
        {commandActions
          .filter(action => allowed[workspace.status].includes(action.command))
          .map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.command}
                className={`core-action ${action.command === "DESTROY_WORKSPACE" ? "danger" : ""}`}
                disabled={isBusy}
                title={action.label}
                aria-label={`${action.label} ${workspace.name}`}
                onClick={() => onAction(workspace, action.command)}
              >
                <Icon size={14} />
              </button>
            );
          })}
      </div>
    </div>
  );
}

function NewWorkspaceDialog({
  onClose,
  onCreate,
  busy,
}: {
  onClose: () => void;
  onCreate: (name: string) => void;
  busy: boolean;
}) {
  const [name, setName] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim()) onCreate(name.trim());
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-title"
      >
        <div className="modal-top">
          <span className="icon-well cyan">
            <Plus size={18} />
          </span>
          <button
            className="quiet-icon"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            disabled={busy}
          >
            <X size={18} />
          </button>
        </div>
        <p className="eyebrow">LOCAL WORKSPACE CORE</p>
        <h2 id="create-title">สร้าง Workspace</h2>
        <p className="modal-description">
          ส่งคำสั่งผ่าน Command Engine และ Local Provisioner จะไม่สร้าง Runtime
          ปลอม
        </p>
        <form onSubmit={submit}>
          <label className="form-label" htmlFor="workspace-name">
            ชื่อ Workspace
          </label>
          <input
            autoFocus
            id="workspace-name"
            className="text-input"
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="เช่น Phoenix Service"
            maxLength={80}
            required
            disabled={busy}
          />
          <div className="modal-note">
            <LockKeyhole size={14} />
            บันทึกใน Local Development Storage · Worker ผูกกับ Browser tab
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
              disabled={busy}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={busy}
            >
              <Plus size={15} />
              {busy ? "กำลังส่ง Command..." : "สร้าง Workspace"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function SearchDialog({
  query,
  setQuery,
  onClose,
  onNavigate,
  workspaces,
}: {
  query: string;
  setQuery: (value: string) => void;
  onClose: () => void;
  onNavigate: (key: NavKey) => void;
  workspaces: Workspace[];
}) {
  const matches = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    const menu = navItems
      .filter(
        item =>
          !needle ||
          `${item.label} ${item.key}`.toLocaleLowerCase().includes(needle)
      )
      .map(item => ({
        kind: "เมนู",
        label: item.label,
        detail: item.key === "overview" ? "Command Center" : "เปิดส่วนงาน",
        key: item.key,
      }));
    const entries = workspaces
      .filter(
        item =>
          !needle ||
          `${item.name} ${item.id} ${item.status}`
            .toLocaleLowerCase()
            .includes(needle)
      )
      .map(item => ({
        kind: "Workspace",
        label: item.name,
        detail: `${item.id} · ${item.status}`,
        key: "workspaces" as NavKey,
      }));
    return [...menu, ...entries].slice(0, 7);
  }, [query, workspaces]);
  return (
    <div
      className="modal-backdrop search-backdrop"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="search-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="ค้นหา Workspace และเมนู"
      >
        <div className="search-dialog-input">
          <Search size={19} />
          <input
            autoFocus
            placeholder="ค้นหาเมนูหรือ Workspace..."
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
          <kbd>ESC</kbd>
        </div>
        <div className="search-results">
          {matches.length ? (
            matches.map((match, index) => (
              <button
                key={`${match.kind}-${match.label}`}
                className="search-result"
                onClick={() => {
                  onNavigate(match.key);
                  onClose();
                }}
              >
                <span className="search-result-icon">
                  {match.kind === "Workspace" ? (
                    <Box size={16} />
                  ) : (
                    <Command size={16} />
                  )}
                </span>
                <span className="search-result-text">
                  <strong>{match.label}</strong>
                  <small>{match.detail}</small>
                </span>
                <span className="search-result-kind">{match.kind}</span>
                <span className="search-result-hint">
                  {index === 0 ? "↵" : ""}
                </span>
              </button>
            ))
          ) : (
            <div className="search-empty">ไม่พบเมนูหรือ Workspace</div>
          )}
        </div>
        <div className="search-footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> เลือกรายการ
          </span>
          <span>
            <kbd>↵</kbd> เปิด
          </span>
        </div>
      </section>
    </div>
  );
}

function SectionView({
  active,
  overview,
  onCreate,
  onAction,
  busy,
  events,
  auditRecords,
  platform,
  runtimeCapabilities,
}: {
  active: NavKey;
  overview: WorkspaceOverview | null;
  onCreate: () => void;
  onAction: (workspace: Workspace, command: CommandType) => void;
  busy: boolean;
  events: WorkspaceEvent[];
  auditRecords: AuditRecord[];
  platform: WorkspacePlatform | null;
  runtimeCapabilities: RuntimeCapabilities | null;
}) {
  const info = moduleCopy[active];
  const Icon = info.icon;
  const rows =
    overview?.workspaces.filter(item => item.status !== "DESTROYED") ?? [];
  const recentEvents = events.slice(-8).reverse();
  return (
    <div className="section-view">
      <div className="page-heading compact-heading">
        <div>
          <span className="eyebrow">{info.eyebrow}</span>
          <h1>{info.title}</h1>
          <p>{info.description}</p>
        </div>
        {active === "workspaces" && (
          <button className="button button-primary" onClick={onCreate}>
            <Plus size={16} />
            สร้าง Workspace
          </button>
        )}
      </div>
      {active === "observability" ? (
        <ObservabilityPanel platform={platform} overview={overview} />
      ) : active === "workspaces" ? (
        <section className="panel section-list">
          <div className="panel-heading">
            <div>
              <h2>Workspace ใน Local Core</h2>
              <p>
                {overview?.storage ?? "LOADING"} · อ่านจาก Workspace Repository
                จริง
              </p>
            </div>
            <span className="count-chip">{rows.length} รายการ</span>
          </div>
          {rows.length ? (
            <div className="core-workspace-list">
              {rows.map(workspace => (
                <WorkspaceRow
                  key={workspace.id}
                  workspace={workspace}
                  busy={busy}
                  onAction={onAction}
                />
              ))}
            </div>
          ) : (
            <div className="core-empty">
              <Box size={22} />
              <strong>ยังไม่มี Workspace</strong>
              <span>
                สร้างรายการผ่าน Command Engine เพื่อเริ่มต้น Local Core
              </span>
            </div>
          )}
        </section>
      ) : active === "resources" ? (
        <section className="panel core-resource-panel">
          <div className="panel-heading">
            <div>
              <div className="panel-title-row">
                <span className="panel-icon cyan">
                  <Cpu size={16} />
                </span>
                <h2>Quota reservations</h2>
              </div>
              <p>จำนวนที่จองจาก Workspace Core เทียบกับ configured quota</p>
            </div>
            <span className="not-configured-pill">USAGE UNAVAILABLE</span>
          </div>
          <div className="quota-grid">
            {(overview?.resources ?? [])
              .sort(
                (a, b) =>
                  resourceOrder.indexOf(a.kind) - resourceOrder.indexOf(b.kind)
              )
              .map(resource => (
                <ResourceBar key={resource.kind} resource={resource} />
              ))}
          </div>
          <div className="core-inline-note">
            <ShieldCheck size={15} />
            Limit เป็น Local Configuration ไม่ใช่การตรวจจับ Hardware · ไม่แสดง
            fake telemetry
          </div>
        </section>
      ) : active === "knowledge" ? (
        <KnowledgePanel platform={platform} overview={overview} />
      ) : active === "alerts" ? (
        <section className="panel section-list">
          <div className="panel-heading">
            <div>
              <h2>Workspace errors</h2>
              <p>รายการจาก Local Workspace Repository</p>
            </div>
            <span className="count-chip">
              {rows.filter(item => item.status === "ERROR").length} รายการ
            </span>
          </div>
          {rows
            .filter(item => item.status === "ERROR")
            .map(workspace => (
              <div className="core-alert-row" key={workspace.id}>
                <AlertTriangle size={17} />
                <div>
                  <strong>{workspace.name}</strong>
                  <span>
                    {workspace.error?.code}: {workspace.error?.message}
                  </span>
                </div>
                <time>
                  {formatTime(
                    workspace.error?.occurredAt ?? workspace.updatedAt
                  )}
                </time>
              </div>
            ))}
          {!rows.some(item => item.status === "ERROR") && (
            <div className="core-empty">
              <ShieldCheck size={22} />
              <strong>ไม่มี Error ที่บันทึกอยู่</strong>
              <span>สถานะนี้คำนวณจาก Workspace Core ไม่ใช่ Alert service</span>
            </div>
          )}
        </section>
      ) : active === "audit" ? (
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <div className="panel-title-row">
                <span className="panel-icon cyan">
                  <FileClock size={16} />
                </span>
                <h2>Command audit trail</h2>
              </div>
              <p>เฉพาะ Command ที่จบแล้ว · อ่านจาก Local Storage</p>
            </div>
            <span className="not-configured-pill">LOCAL · DURABLE</span>
          </div>
          <AuditList records={auditRecords} />
        </section>
      ) : active === "logs" ? (
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <div className="panel-title-row">
                <span className="panel-icon cyan">
                  <Activity size={16} />
                </span>
                <h2>Local command events</h2>
              </div>
              <p>Event bus ภายใน Memory ของ Session นี้</p>
            </div>
            <span className="not-configured-pill">LOCAL · VOLATILE</span>
          </div>
          <EventList events={recentEvents} />
        </section>
      ) : active === "operations" ? (
        <RuntimeCapabilitiesPanel capabilities={runtimeCapabilities} />
      ) : (
        <div className="empty-state panel">
          <span className="empty-illustration">
            <Icon size={27} />
          </span>
          <span className="not-configured-pill">NOT_IMPLEMENTED</span>
          <h2>{info.title} ยังไม่อยู่ใน Foundation scope</h2>
          <p>
            เก็บไว้ใน phase ถัดไปตามลำดับ Foundation โดยไม่มี External
            Integration
          </p>
        </div>
      )}
      <div className="foundation-note">
        <ShieldCheck size={16} />
        <span>
          ทุก Workspace action ผ่าน Command Engine · UI ไม่มีทางเรียก Local
          Runtime Adapter โดยตรง
        </span>
      </div>
    </div>
  );
}

function RuntimeCapabilitiesPanel({
  capabilities,
}: {
  capabilities: RuntimeCapabilities | null;
}) {
  if (!capabilities)
    return (
      <div className="panel runtime-capabilities">
        กำลังอ่าน Runtime capabilities จาก Core…
      </div>
    );

  const operations = [
    ["สร้าง Worker", capabilities.supports.create],
    ["Start", capabilities.supports.start],
    ["Stop", capabilities.supports.stop],
    ["Restart", capabilities.supports.restart],
    ["Inspect", capabilities.supports.inspect],
    ["Destroy", capabilities.supports.destroy],
  ] as const;
  const statusLabel = {
    AVAILABLE: "พร้อมใช้งานใน Browser",
    NOT_CONFIGURED: "ยังไม่เปิดใน Configuration",
    UNAVAILABLE: "Browser ไม่รองรับ",
    UNSUPPORTED: "ไม่รองรับ",
  }[capabilities.availability];

  return (
    <div className="runtime-capabilities-layout">
      <section className="panel runtime-capabilities">
        <div className="panel-heading">
          <div>
            <div className="panel-title-row">
              <span className="panel-icon cyan">
                <Cpu size={16} />
              </span>
              <h2>Local Runtime · Browser Web Worker</h2>
            </div>
            <p>Capability จริงจาก RuntimeAdapter · อ่านผ่าน Core facade</p>
          </div>
          <span
            className={`runtime-status ${capabilities.availability.toLowerCase()}`}
          >
            {statusLabel}
          </span>
        </div>
        <p className="runtime-capability-message">{capabilities.message}</p>
        <div className="runtime-operation-grid">
          {operations.map(([label, supported]) => (
            <div className="runtime-operation" key={label}>
              <span
                className={supported ? "runtime-check" : "runtime-disabled"}
              >
                {supported ? "รองรับ" : "ไม่รองรับ"}
              </span>
              <strong>{label}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="panel runtime-boundary">
        <div className="panel-heading">
          <div>
            <h2>ขอบเขตความสามารถ</h2>
            <p>ข้อจำกัดด้าน Security และ execution scope</p>
          </div>
          <LockKeyhole size={17} />
        </div>
        <ul>
          <li>
            <Check size={14} /> ทำงานใน Browser tab และสิ้นสุดเมื่อปิด tab
          </li>
          <li>
            <Check size={14} /> รับเฉพาะคำสั่ง lifecycle แบบจำกัด
          </li>
          <li>
            <X size={14} /> ไม่มี OS process, Shell หรือรัน User code
          </li>
          <li>
            <X size={14} /> ไม่มี Filesystem, Network หรือ host telemetry
          </li>
          <li>
            <X size={14} /> ไม่รับประกัน persistence ข้าม Browser session
          </li>
        </ul>
      </section>
    </div>
  );
}

function EventList({ events }: { events: WorkspaceEvent[] }) {
  return events.length ? (
    <div className="activity-list core-event-list">
      {events.map(event => {
        const detail = eventLabel(event);
        const Icon = detail.icon;
        return (
          <div className="activity-row" key={event.eventId}>
            <span className={`activity-icon ${detail.tone}`}>
              <Icon size={15} />
            </span>
            <div className="activity-info">
              <strong>{detail.title}</strong>
              <span>{detail.detail}</span>
            </div>
            <time>{relativeTime(event.timestamp)}</time>
          </div>
        );
      })}
    </div>
  ) : (
    <div className="core-empty">
      <Activity size={22} />
      <strong>ยังไม่มี Internal Event</strong>
      <span>Event จะเกิดเมื่อมี Command ผ่าน Core</span>
    </div>
  );
}

function AuditList({ records }: { records: AuditRecord[] }) {
  return records.length ? (
    <div className="activity-list core-event-list">
      {records.map(record => {
        const succeeded = record.status === "SUCCEEDED";
        const Icon = succeeded ? Check : AlertTriangle;
        const timestamp = record.completedAt ?? record.requestedAt;
        const title = "recordType" in record
          ? `${record.actionType.replaceAll("_", " ")} · ${record.status}`
          : `${record.commandType.replaceAll("_", " ")} · ${record.status}`;
        const identity = "recordType" in record ? record.auditId : record.commandId;
        return (
          <div className="activity-row" key={identity}>
            <span className={`activity-icon ${succeeded ? "emerald" : "amber"}`}>
              <Icon size={15} />
            </span>
            <div className="activity-info">
              <strong>
                {title}
              </strong>
              <span>
                {record.workspaceId} · {record.error?.code ?? identity}
                {record.error ? ` · ${record.error.message}` : ""}
              </span>
            </div>
            <time title={formatTime(timestamp)}>{relativeTime(timestamp)}</time>
          </div>
        );
      })}
    </div>
  ) : (
    <div className="core-empty">
      <FileClock size={22} />
      <strong>ยังไม่มี Command หรือ Knowledge audit</strong>
      <span>เมื่อ action จบแล้ว จะถูกบันทึกไว้ใน Local Storage เดิม</span>
    </div>
  );
}

export default function Home() {
  const [active, setActive] = useState<NavKey>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [environment, setEnvironment] = useState("Development");
  const [platform, setPlatform] = useState<WorkspacePlatform | null>(null);
  const [overview, setOverview] = useState<WorkspaceOverview | null>(null);
  const [events, setEvents] = useState<WorkspaceEvent[]>([]);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [runtimeCapabilities, setRuntimeCapabilities] =
    useState<RuntimeCapabilities | null>(null);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [busyWorkspace, setBusyWorkspace] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function refresh(current: WorkspacePlatform) {
    const [snapshot, auditSnapshot] = await Promise.all([
      current.overview.execute(),
      current.audit.list(),
    ]);
    setOverview(snapshot);
    setEvents(current.events.list());
    setAuditRecords(auditSnapshot);
  }

  useEffect(() => {
    let mounted = true;
    try {
      const current = createWorkspacePlatform();
      setPlatform(current);
      setRuntimeCapabilities(current.runtimeCapabilities());
      const unsubscribe = current.events.subscribe(() => {
        if (mounted)
          void refresh(current).catch((error: unknown) =>
            setStartupError(
              error instanceof Error ? error.message : String(error)
            )
          );
      });
      void current.ready
        .then(() => (mounted ? refresh(current) : undefined))
        .catch((error: unknown) => {
          if (mounted)
            setStartupError(
              error instanceof Error ? error.message : String(error)
            );
        });
      return () => {
        mounted = false;
        unsubscribe();
      };
    } catch (error) {
      setStartupError(error instanceof Error ? error.message : String(error));
    }
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      } else if (event.key === "/" && !editing) {
        event.preventDefault();
        setSearchOpen(true);
      } else if (event.key === "Escape") {
        setSearchOpen(false);
        setCreateOpen(false);
        setNotificationsOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function navigate(key: NavKey) {
    setActive(key);
    setMobileOpen(false);
    setNotificationsOpen(false);
  }

  async function executeAction(workspace: Workspace, commandType: CommandType) {
    if (!platform) return;
    if (
      commandType === "DESTROY_WORKSPACE" &&
      !window.confirm(
        `ทำลาย Workspace "${workspace.name}" และลบ Local record นี้หรือไม่?`
      )
    )
      return;
    setBusyWorkspace(workspace.id);
    try {
      const result = await platform.commands.execute({
        workspaceId: workspace.id,
        commandType,
      });
      await refresh(platform);
      if (result.status === "FAILED")
        toast.error("Command ไม่สำเร็จ", {
          description: `${result.error?.code}: ${result.error?.message}`,
        });
      else if (commandType === "INSPECT_WORKSPACE") {
        const inspection = result.result as {
          runtime: { availability: string; message: string };
        };
        toast.info(`Runtime: ${inspection.runtime.availability}`, {
          description: inspection.runtime.message,
        });
      } else toast.success(`Command ${commandType} สำเร็จ`);
    } catch (error) {
      toast.error("Command Engine error", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setBusyWorkspace(null);
    }
  }

  async function createWorkspace(name: string) {
    if (!platform) return;
    setCreating(true);
    const id = `ws-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
    try {
      const result = await platform.commands.execute({
        workspaceId: id,
        commandType: "CREATE_WORKSPACE",
        payload: { name },
      });
      await refresh(platform);
      setCreateOpen(false);
      if (result.status === "FAILED")
        toast.error("Workspace ถูกบันทึกแต่ Runtime ยังไม่พร้อม", {
          description: `${result.error?.code}: ${result.error?.message}`,
        });
      else
        toast.success("สร้าง Workspace แล้ว", {
          description: `สถานะ ${(result.result as Workspace).status} · ผ่าน Command Engine`,
        });
    } catch (error) {
      toast.error("สร้าง Workspace ไม่สำเร็จ", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setCreating(false);
    }
  }

  const activeItem = navItems.find(item => item.key === active) ?? navItems[0];
  const counts = overview?.counts;
  const rows =
    overview?.workspaces.filter(
      workspace => workspace.status !== "DESTROYED"
    ) ?? [];
  const cleanupRows = rows.filter(workspaceNeedsCleanup);
  const notifications = events
    .filter(
      event =>
        event.eventType === "WORKSPACE_ERROR" ||
        event.eventType === "COMMAND_FAILED"
    )
    .slice(-5)
    .reverse();

  return (
    <div className={`app-shell ${collapsed ? "has-collapsed" : ""}`}>
      {mobileOpen && (
        <button
          className="mobile-scrim"
          aria-label="ปิดเมนู"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`sidebar ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "is-mobile-open" : ""}`}
      >
        <div className="brand-row">
          <span className="brand-symbol">
            <span />
            <span />
            <span />
            <span />
          </span>
          <div className="brand-copy">
            <strong>
              nimbus<span>OS</span>
            </strong>
            <small>DEVELOPER PLATFORM</small>
          </div>
          <button
            className="sidebar-close mobile-only"
            aria-label="ปิดเมนู"
            onClick={() => setMobileOpen(false)}
          >
            <X size={19} />
          </button>
        </div>
        <button
          className="project-switcher"
          onClick={() => {
            setEnvironment(value =>
              value === "Development"
                ? "Local Runtime (Unavailable)"
                : "Development"
            );
            toast.info("สภาพแวดล้อม UI เท่านั้น · ไม่มี Environment ภายนอก");
          }}
        >
          <span className="project-avatar">N</span>
          <span className="project-copy">
            <strong>Nimbus Workspace</strong>
            <small>
              <i /> {environment}
            </small>
          </span>
          <ChevronDown className="switcher-chevron" size={15} />
        </button>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="nav-list" aria-label="เมนูหลัก">
          {navItems.map(item => {
            const Icon = item.icon;
            const count =
              item.key === "workspaces"
                ? (counts?.total ?? 0).toString().padStart(2, "0")
                : item.key === "alerts"
                  ? notifications.length.toString().padStart(2, "0")
                  : item.key === "agents"
                    ? "—"
                    : undefined;
            return (
              <button
                key={item.key}
                className={`nav-item ${active === item.key ? "active" : ""}`}
                onClick={() => navigate(item.key)}
                title={collapsed ? item.label : undefined}
                aria-current={active === item.key ? "page" : undefined}
              >
                <Icon size={18} strokeWidth={active === item.key ? 2 : 1.75} />
                <span className="nav-label">{item.label}</span>
                {count && <span className="nav-count">{count}</span>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-section-label tools-label">SYSTEM</div>
        <button
          className="nav-item"
          onClick={() =>
            toast.info("การตั้งค่า Core อ่านจาก centralized configuration")
          }
        >
          <Settings2 size={18} />
          <span className="nav-label">ตั้งค่าระบบ</span>
        </button>
        <div className="sidebar-spacer" />
        <div className="sidebar-status">
          <span className="status-orbit">
            <Activity size={15} />
          </span>
          <div className="status-copy">
            <strong>
              {startupError ? "Core มีข้อผิดพลาด" : "Local Core พร้อม"}
            </strong>
            <span>
              <i /> LOCAL DEVELOPMENT
            </span>
          </div>
        </div>
        <div className="sidebar-footer">
          <button
            className="profile-button"
            onClick={() =>
              toast.info("Authentication ยังไม่อยู่ใน Foundation scope")
            }
          >
            <span className="profile-avatar">LC</span>
            <span className="profile-copy">
              <strong>Local Core</strong>
              <small>Development · Local</small>
            </span>
            <MoreHorizontal size={16} />
          </button>
          <button
            className="collapse-button desktop-only"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "ขยาย Sidebar" : "ย่อ Sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen size={17} />
            ) : (
              <>
                <PanelLeftClose size={17} />
                <span>ย่อเมนู</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="เปิดเมนู"
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{activeItem.label}</strong>
          </div>
          <button
            className="global-search"
            onClick={() => {
              setSearchQuery("");
              setSearchOpen(true);
            }}
            aria-label="ค้นหา Workspace และเมนู"
          >
            <Search size={16} />
            <span>ค้นหา Workspace, เมนู...</span>
            <kbd>
              <Command size={11} /> K
            </kbd>
          </button>
          <div className="topbar-actions">
            <span className="topbar-env">
              <i />
              LOCAL
            </span>
            <div className="notification-wrap">
              <button
                className={`icon-button notification-button ${notificationsOpen ? "selected" : ""}`}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="การแจ้งเตือน"
              >
                <Bell size={18} />
                {notifications.length > 0 && <i className="notification-dot" />}
              </button>
              {notificationsOpen && (
                <div className="notification-popover">
                  <div className="popover-heading">
                    <div>
                      <strong>Core errors</strong>
                      <small>จาก Internal Event Bus</small>
                    </div>
                    <span className="count-chip">{notifications.length}</span>
                  </div>
                  {notifications.length ? (
                    notifications.map(event => {
                      const detail = eventLabel(event);
                      return (
                        <button
                          key={event.eventId}
                          className="notice-row"
                          onClick={() => navigate("alerts")}
                        >
                          <span className="notice-icon amber">
                            <AlertTriangle size={15} />
                          </span>
                          <span>
                            <strong>{detail.title}</strong>
                            <small>{detail.detail}</small>
                          </span>
                          <time>{relativeTime(event.timestamp)}</time>
                        </button>
                      );
                    })
                  ) : (
                    <div className="popover-footer">
                      ไม่มี Error event · ไม่มีข้อมูลแจ้งเตือนตัวอย่าง
                    </div>
                  )}
                </div>
              )}
            </div>
            <span className="topbar-divider" />
            <button
              className="help-button"
              onClick={() =>
                toast.info("ดู docs/architecture.md ใน Project files")
              }
            >
              <LifeBuoy size={17} />
              <span>ช่วยเหลือ</span>
            </button>
          </div>
        </header>

        <main className="content-area">
          {active === "overview" ? (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow-row">
                    <span className="eyebrow">COMMAND CENTER · PHASE 10</span>
                    <span className="demo-pill local-state-pill">
                      <i />
                      LOCAL CORE DATA
                    </span>
                  </div>
                  <h1>
                    ภาพรวม Workspace <span className="wave">/</span>
                  </h1>
                  <p>
                    สถานะจริงจาก Local Repository และ Resource Quota Engine ·
                    ไม่มี Fake Telemetry
                  </p>
                </div>
                <div className="heading-actions">
                  <div className="date-chip">
                    <Clock3 size={15} />
                    <span>
                      {overview
                        ? formatTime(overview.observedAt)
                        : "กำลังอ่าน Local Core..."}
                    </span>
                  </div>
                  <button
                    className="button button-primary"
                    onClick={() => setCreateOpen(true)}
                    disabled={!platform || !!startupError}
                  >
                    <Plus size={16} />
                    สร้าง Workspace
                  </button>
                </div>
              </div>
              {startupError && (
                <div className="core-error-banner">
                  <AlertTriangle size={16} />
                  <span>อ่าน Local Core ไม่สำเร็จ: {startupError}</span>
                </div>
              )}
              <section
                className="metrics-grid core-metrics-grid"
                aria-label="จำนวน Workspace ตาม Lifecycle State"
              >
                <MetricCard
                  icon={FolderKanban}
                  label="Workspace ทั้งหมด"
                  value={counts?.total.toString().padStart(2, "0") ?? "—"}
                  delta="Local records"
                  tone="cyan"
                  footnote="ไม่รวมสถานะ DESTROYED"
                />
                <MetricCard
                  icon={Server}
                  label="กำลังทำงาน"
                  value={counts?.RUNNING.toString().padStart(2, "0") ?? "—"}
                  delta="RUNNING"
                  tone="emerald"
                  footnote="เฉพาะ state จาก Core"
                />
                <MetricCard
                  icon={Check}
                  label="พร้อมเริ่ม"
                  value={counts?.READY.toString().padStart(2, "0") ?? "—"}
                  delta="READY"
                  tone="violet"
                  footnote="Runtime ยังอาจไม่พร้อม"
                />
                <MetricCard
                  icon={AlertTriangle}
                  label="ข้อผิดพลาด"
                  value={counts?.ERROR.toString().padStart(2, "0") ?? "—"}
                  delta="ERROR"
                  tone="amber"
                  footnote="ดู error code ในรายการ"
                />
              </section>

              <div className="dashboard-grid core-dashboard-grid">
                <section className="panel core-resource-panel">
                  <div className="panel-heading">
                    <div>
                      <div className="panel-title-row">
                        <span className="panel-icon cyan">
                          <Cpu size={16} />
                        </span>
                        <h2>Resource quota</h2>
                        <span className="demo-mini">LOCAL CONFIG</span>
                      </div>
                      <p>Allocated reservations เทียบกับ configured limit</p>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => navigate("resources")}
                    >
                      ดูทั้งหมด
                      <ChevronRight size={15} />
                    </button>
                  </div>
                  <div className="quota-grid overview-quota-grid">
                    {(overview?.resources ?? [])
                      .filter(resource =>
                        [
                          "CPU",
                          "MEMORY",
                          "STORAGE",
                          "RUNTIME_INSTANCE",
                        ].includes(resource.kind)
                      )
                      .sort(
                        (a, b) =>
                          resourceOrder.indexOf(a.kind) -
                          resourceOrder.indexOf(b.kind)
                      )
                      .map(resource => (
                        <ResourceBar key={resource.kind} resource={resource} />
                      ))}
                  </div>
                  <div className="core-inline-note">
                    <ShieldCheck size={15} />
                    <span>
                      กราฟแสดง reservation จากคำสั่งจริง · Host usage เป็น
                      UNAVAILABLE
                    </span>
                  </div>
                </section>
                <section className="panel core-agent-panel">
                  <div className="panel-heading">
                    <div>
                      <div className="panel-title-row">
                        <span className="panel-icon violet">
                          <Gauge size={16} />
                        </span>
                        <h2>Local Runtime</h2>
                      </div>
                      <p>ขอบเขต Runtime Adapter</p>
                    </div>
                    <button
                      className="quiet-icon"
                      aria-label="ดู Operations"
                      onClick={() => navigate("operations")}
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="runtime-state-block">
                    <span className="runtime-state-symbol">
                      <Server size={19} />
                    </span>
                    <div>
                      <strong>
                        {runtimeCapabilities?.availability ?? "CHECKING"}
                      </strong>
                      <span>
                        Browser Worker ทำงานได้เฉพาะใน tab นี้ · ไม่ใช่ OS
                        process
                      </span>
                    </div>
                  </div>
                  <div className="runtime-fact-list">
                    <div>
                      <span>Provider boundary</span>
                      <strong>local</strong>
                    </div>
                    <div>
                      <span>Host telemetry</span>
                      <strong className="unavailable-text">UNAVAILABLE</strong>
                    </div>
                    <div>
                      <span>Workspace records</span>
                      <strong>{counts?.total ?? "—"}</strong>
                    </div>
                  </div>
                  <button
                    className="runtime-action-button"
                    onClick={() => navigate("operations")}
                  >
                    <LockKeyhole size={14} />
                    ดู Capability และข้อจำกัด
                    <ArrowRight size={14} />
                  </button>
                </section>
              </div>

              {cleanupRows.length > 0 && (
                <section
                  className="panel cleanup-panel"
                  aria-labelledby="cleanup-title"
                >
                  <div className="panel-heading">
                    <div>
                      <div className="panel-title-row">
                        <span className="panel-icon amber">
                          <AlertTriangle size={16} />
                        </span>
                        <h2 id="cleanup-title">Workspace รอ Cleanup</h2>
                      </div>
                      <p>
                        Runtime handle หรือ Resource reservation ยังคงอยู่ ·
                        ลองทำลายผ่าน Command Engine อีกครั้ง
                      </p>
                    </div>
                    <span className="cleanup-count">
                      {cleanupRows.length} รายการ
                    </span>
                  </div>
                  <div className="cleanup-list">
                    {cleanupRows.map(workspace => {
                      const retainedResources = (
                        Object.entries(workspace.resources.allocated) as Array<
                          [ResourceKind, number]
                        >
                      )
                        .filter(([, amount]) => amount > 0)
                        .map(([kind, amount]) =>
                          `${resourceLabels[kind]} ${amount} ${overview?.resources.find(resource => resource.kind === kind)?.unit ?? ""}`.trim()
                        );
                      const busy = busyWorkspace === workspace.id;
                      return (
                        <article className="cleanup-row" key={workspace.id}>
                          <span className="cleanup-status">
                            <i />
                            CLEANUP REQUIRED
                          </span>
                          <div className="cleanup-info">
                            <strong>{workspace.name}</strong>
                            <span>
                              {workspace.error?.code ?? "ERROR"}:{" "}
                              {workspace.error?.message ??
                                "Workspace ต้องตรวจสอบ cleanup"}
                            </span>
                            <small>
                              {workspace.runtime.instanceId
                                ? "Runtime handle ยังคงอยู่"
                                : "ไม่พบ Runtime handle"}
                              {retainedResources.length
                                ? ` · Reserved: ${retainedResources.join(" · ")}`
                                : " · ไม่มี Resource reservation ค้างอยู่"}
                            </small>
                          </div>
                          <button
                            className="cleanup-retry"
                            type="button"
                            disabled={busy}
                            aria-label={`ลอง Cleanup อีกครั้ง ${workspace.name}`}
                            onClick={() =>
                              void executeAction(workspace, "DESTROY_WORKSPACE")
                            }
                          >
                            <RotateCcw size={14} />
                            {busy ? "กำลังลองใหม่" : "ลอง Cleanup อีกครั้ง"}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                  <div className="cleanup-footnote">
                    การ Retry จะไม่คืน quota ก่อน persist สถานะการ Cleanup
                    สำเร็จ
                  </div>
                </section>
              )}

              <div className="lower-grid core-lower-grid">
                <section className="panel workspace-panel core-workspace-panel">
                  <div className="panel-heading">
                    <div>
                      <div className="panel-title-row">
                        <span className="panel-icon cyan">
                          <FolderKanban size={16} />
                        </span>
                        <h2>Workspace ที่มีอยู่จริง</h2>
                      </div>
                      <p>
                        รายการจาก Workspace Repository · Local Development
                        Storage
                      </p>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => navigate("workspaces")}
                    >
                      ดูทั้งหมด
                      <ChevronRight size={15} />
                    </button>
                  </div>
                  {rows.length ? (
                    <div className="core-workspace-list">
                      {rows.slice(0, 8).map(workspace => (
                        <WorkspaceRow
                          key={workspace.id}
                          workspace={workspace}
                          busy={busyWorkspace === workspace.id}
                          onAction={executeAction}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="core-empty">
                      <Box size={22} />
                      <strong>
                        {overview
                          ? "ยังไม่มี Workspace"
                          : "กำลังอ่าน Repository..."}
                      </strong>
                      <span>
                        {overview
                          ? "สร้าง Workspace ผ่าน Command Engine เพื่อเริ่มต้น · ไม่มีข้อมูลตัวอย่าง"
                          : "Local Development Storage"}
                      </span>
                    </div>
                  )}
                </section>
                <section className="panel activity-panel core-activity-panel transition-panel">
                  <div className="panel-heading">
                    <div>
                      <div className="panel-title-row">
                        <span className="panel-icon violet">
                          <ArrowRightLeft size={16} />
                        </span>
                        <h2>State Transition History</h2>
                        <span
                          className="transition-count"
                          aria-label={`${events.filter(event => event.eventType === "STATE_TRANSITIONED").length} State Transitions in this session`}
                        >
                          {
                            events.filter(
                              event => event.eventType === "STATE_TRANSITIONED"
                            ).length
                          }
                        </span>
                      </div>
                      <p>สถานะก่อน → หลัง · WorkspaceStateMachine</p>
                    </div>
                    <button
                      className="quiet-icon"
                      aria-label="เปิด Audit Events"
                      onClick={() => navigate("audit")}
                    >
                      <ArrowRight size={15} />
                    </button>
                  </div>
                  <TransitionHistory events={events} />
                  <div className="activity-footer">
                    <span>
                      <i />
                      LOCAL · SESSION
                    </span>
                    <button onClick={() => navigate("audit")}>
                      ดู Events
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </section>
              </div>
              <div className="foundation-banner">
                <span className="banner-icon">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <strong>
                    UI → Command Engine → State Machine → Provisioner → Runtime
                    Adapter
                  </strong>
                  <p>UI ไม่แก้สถานะโดยตรง · Browser Worker scope แสดงตามจริง</p>
                </div>
                <button
                  onClick={() =>
                    toast.info(
                      "Architecture, Lifecycle, Runtime docs อยู่ใน docs/"
                    )
                  }
                  aria-label="ข้อมูล Foundation"
                >
                  <ArrowRight size={17} />
                </button>
              </div>
            </>
          ) : (
            <SectionView
              active={active}
              overview={overview}
              onCreate={() => setCreateOpen(true)}
              onAction={executeAction}
              busy={!!busyWorkspace}
              events={events}
              auditRecords={auditRecords}
              platform={platform}
              runtimeCapabilities={runtimeCapabilities}
            />
          )}
          <footer className="app-footer">
            <span>
              nimbusOS <i /> Foundation v0.1.0
            </span>
            <span>
              <span className="footer-status">
                <i /> LOCAL DEVELOPMENT
              </span>
              <span className="footer-separator">·</span>{" "}
              {overview?.storage ?? "LOCAL CORE"}
            </span>
          </footer>
        </main>
      </div>

      {searchOpen && (
        <SearchDialog
          query={searchQuery}
          setQuery={setSearchQuery}
          onClose={() => setSearchOpen(false)}
          onNavigate={navigate}
          workspaces={rows}
        />
      )}
      {createOpen && (
        <NewWorkspaceDialog
          onClose={() => setCreateOpen(false)}
          onCreate={name => void createWorkspace(name)}
          busy={creating}
        />
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  delta,
  tone,
  footnote,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  delta: string;
  tone: string;
  footnote: string;
}) {
  return (
    <article className="metric-card panel">
      <div className="metric-top">
        <span className={`icon-well ${tone}`}>
          <Icon size={17} strokeWidth={1.8} />
        </span>
        <span className="metric-label">{label}</span>
        <span className="metric-label-note">{delta}</span>
      </div>
      <div className="metric-main">
        <strong>{value}</strong>
      </div>
      <div className="metric-bottom">
        <span>{footnote}</span>
        <span className={`metric-state-chip ${tone}`}>{delta}</span>
      </div>
    </article>
  );
}
function isWorkspaceStatus(value: unknown): value is WorkspaceStatus {
  return (
    typeof value === "string" &&
    WORKSPACE_STATUSES.includes(value as WorkspaceStatus)
  );
}

function TransitionHistory({ events }: { events: WorkspaceEvent[] }) {
  const transitions = events
    .filter(event => event.eventType === "STATE_TRANSITIONED")
    .slice(-8)
    .reverse();

  if (!transitions.length) {
    return (
      <div className="transition-empty">
        <ArrowRightLeft size={19} />
        <strong>ยังไม่มี State Transition</strong>
        <span>
          ประวัติจะบันทึกเมื่อ Workspace เปลี่ยนสถานะผ่าน Command Engine
        </span>
      </div>
    );
  }

  return (
    <div className="transition-list" aria-label="ประวัติการเปลี่ยนสถานะ">
      {transitions.map(event => {
        const from = event.payload.fromStatus;
        const to = event.payload.toStatus;
        const fromValid = isWorkspaceStatus(from);
        const toValid = isWorkspaceStatus(to);
        const workspaceName =
          typeof event.payload.workspaceName === "string"
            ? event.payload.workspaceName
            : event.workspaceId;
        const commandId =
          typeof event.payload.commandId === "string"
            ? event.payload.commandId
            : null;
        const tone =
          to === "ERROR"
            ? "amber"
            : to === "RUNNING" || to === "READY" || to === "STOPPED"
              ? "emerald"
              : "cyan";
        return (
          <article className="transition-row" key={event.eventId}>
            <span className={`transition-marker ${tone}`}>
              <ArrowRightLeft size={13} />
            </span>
            <div className="transition-details">
              <div className="transition-flow">
                <code className={from === "ERROR" ? "amber" : ""}>
                  {fromValid ? from : "UNKNOWN"}
                </code>
                <ArrowRight size={12} aria-hidden="true" />
                <code
                  className={
                    to === "ERROR" ? "amber" : to === "RUNNING" ? "emerald" : ""
                  }
                >
                  {toValid ? to : "UNKNOWN"}
                </code>
              </div>
              <strong title={workspaceName}>{workspaceName}</strong>
              <small title={commandId ?? undefined}>
                {event.workspaceId}
                {commandId ? ` · CMD ${commandId}` : " · Core"}
              </small>
            </div>
            <time
              dateTime={event.timestamp}
              title={formatTime(event.timestamp)}
            >
              {relativeTime(event.timestamp)}
            </time>
          </article>
        );
      })}
    </div>
  );
}
