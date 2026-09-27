import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Cpu,
  FileClock,
  FolderKanban,
  Play,
  Plus,
  RotateCcw,
  Square,
  Trash2,
} from 'lucide-react';
import { createWorkspacePlatform, type WorkspacePlatform } from './core/platform';
import type { WorkspaceOverview } from './core/workspace/overview';
import type {
  AuditRecord,
  CommandType,
  RuntimeCapabilities,
  Workspace,
} from './core/types';
import { KnowledgePanel } from './pages/KnowledgePanel';
import { ObservabilityPanel } from './pages/ObservabilityPanel';
import { toast } from './lib/toast';

type SubTab = 'WORKSPACES' | 'OBSERVABILITY' | 'KNOWLEDGE' | 'AUDIT';

export const NimbusOsCommandCenterPanel: React.FC = () => {
  const platform = useMemo<WorkspacePlatform | null>(() => {
    try {
      return createWorkspacePlatform();
    } catch {
      return null;
    }
  }, []);

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('WORKSPACES');
  const [overview, setOverview] = useState<WorkspaceOverview | null>(null);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [capabilities, setCapabilities] = useState<RuntimeCapabilities | null>(null);
  const [workspaceName, setWorkspaceName] = useState('sovereign-dev-01');
  const [cpuCores, setCpuCores] = useState(2);
  const [memoryMb, setMemoryMb] = useState(4);
  const [storageGb, setStorageGb] = useState(20);
  const [busy, setBusy] = useState(false);
  const [toastFeed, setToastFeed] = useState<
    Array<{ id: string; tone: 'success' | 'error' | 'info'; title: string; description?: string }>
  >([]);

  const refreshAll = async () => {
    if (!platform) return;
    await platform.ready;
    const [nextOverview, nextAudit] = await Promise.all([
      platform.overview.execute(),
      platform.audit.list(),
    ]);
    setOverview(nextOverview);
    setAuditRecords(nextAudit);
    setCapabilities(platform.runtimeCapabilities());
  };

  useEffect(() => {
    void refreshAll();
    if (!platform) return;
    const unsubEvents = platform.events.subscribe(() => {
      void refreshAll();
    });
    const unsubToast = toast.subscribe((item) => {
      setToastFeed((prev) => [item, ...prev.slice(0, 3)]);
    });
    return () => {
      unsubEvents();
      unsubToast();
    };
  }, [platform]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform || !workspaceName.trim()) return;
    setBusy(true);
    try {
      const workspaceId = `ws-${workspaceName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')}-${Date.now().toString(36).slice(-4)}`;
      const record = await platform.commands.execute({
        commandId: `cmd-create-${Date.now()}`,
        commandType: 'CREATE_WORKSPACE',
        workspaceId,
        payload: {
          name: workspaceName.trim(),
          resources: {
            CPU: cpuCores,
            MEMORY: memoryMb,
            STORAGE: storageGb,
          },
        },
      });
      if (record.status === 'SUCCEEDED') {
        toast.success(`สร้าง Workspace ${workspaceName.trim()} สำเร็จ`, {
          description: `ID: ${workspaceId} (${cpuCores} CPU · ${memoryMb} GB RAM · ${storageGb} GB Disk)`,
        });
      } else {
        toast.error('สร้าง Workspace ไม่สำเร็จ', {
          description: record.error?.message ?? 'Unknown command error',
        });
      }
      await refreshAll();
    } catch (err) {
      toast.error('Command Engine ปฏิเสธคำสั่ง', {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleLifecycleCommand = async (workspace: Workspace, commandType: CommandType) => {
    if (!platform) return;
    setBusy(true);
    try {
      const record = await platform.commands.execute({
        commandId: `cmd-${commandType.toLowerCase()}-${workspace.id}-${Date.now()}`,
        commandType,
        workspaceId: workspace.id,
      });
      if (record.status === 'SUCCEEDED') {
        toast.success(`ดำเนินการ ${commandType} สำเร็จ (${workspace.name})`);
      } else {
        toast.error(`คำสั่ง ${commandType} ไม่สำเร็จ`, {
          description: record.error?.message ?? 'Lifecycle transition failed',
        });
      }
      await refreshAll();
    } catch (err) {
      toast.error(`Command ${commandType} ล้มเหลว`, {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(false);
    }
  };

  const activeWorkspaces =
    overview?.workspaces.filter((ws) => ws.status !== 'DESTROYED') ?? [];

  return (
    <div className="space-y-4 font-mono text-xs text-zinc-200">
      {/* Top Architecture Banner */}
      <div className="p-4 rounded-xl bg-black/50 border border-cyan-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold text-[10px]">
              ISOLATED FOUNDATION CORE · PHASE 01–10
            </span>
            <span className="font-bold text-white text-sm">
              nimbusOS — Local Workspace Command Center
            </span>
            <span className="text-emerald-400 font-semibold text-[11px]">
              ● {capabilities?.provider ?? 'local-web-worker'} ({capabilities?.availability ?? 'AVAILABLE'})
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Command Engine (FIFO Lock + Idempotency) → Provisioner → State Machine → Resource/Quota Engine → Browser Web Worker Runtime Adapter · Durable Audit &amp; Lexical Knowledge Index
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {(
            [
              { id: 'WORKSPACES', label: 'Workspaces & Quotas', icon: FolderKanban },
              { id: 'OBSERVABILITY', label: 'Observability & Health', icon: Activity },
              { id: 'KNOWLEDGE', label: 'Knowledge Ingestion', icon: BookOpen },
              { id: 'AUDIT', label: `Audit Trail (${auditRecords.length})`, icon: FileClock },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  active
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Toast Feed */}
      {toastFeed.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {toastFeed.slice(0, 2).map((item) => (
            <div
              key={item.id}
              className={`px-3 py-2 rounded-lg border text-[11px] flex items-center justify-between ${
                item.tone === 'error'
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  : item.tone === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
              }`}
            >
              <div>
                <div className="font-bold">{item.title}</div>
                {item.description && <div className="text-[10px] opacity-80">{item.description}</div>}
              </div>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 1: WORKSPACES & QUOTAS */}
      {activeSubTab === 'WORKSPACES' && (
        <div className="space-y-4">
          {/* Resource Quota Cards */}
          {overview && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {overview.resources.slice(0, 3).map((cap) => {
                const pct =
                  cap.limit > 0
                    ? Math.min(100, Math.round((cap.allocated / cap.limit) * 100))
                    : 0;
                return (
                  <div
                    key={cap.kind}
                    className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>{cap.kind} Quota Reservation ({cap.unit})</span>
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <div className="text-sm font-bold text-white">
                      {cap.allocated} / {cap.limit} {cap.unit}{' '}
                      <span className="text-[11px] text-emerald-400 font-normal">
                        ({cap.available} {cap.unit} available)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Create Workspace Form */}
          <form
            onSubmit={handleCreateWorkspace}
            className="p-4 rounded-xl bg-black/40 border border-white/10 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
          >
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] text-zinc-400 block">Workspace Name</label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="sovereign-dev-01"
                className="w-full px-3 py-1.5 rounded-lg bg-black/70 border border-white/15 text-white text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400 block">CPU Cores (1–8)</label>
              <input
                type="number"
                min={1}
                max={8}
                value={cpuCores}
                onChange={(e) => setCpuCores(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-black/70 border border-white/15 text-white text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400 block">Memory GB (1–16)</label>
              <input
                type="number"
                min={1}
                max={16}
                value={memoryMb}
                onChange={(e) => setMemoryMb(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-black/70 border border-white/15 text-white text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Provision Workspace</span>
            </button>
          </form>

          {/* Active Workspaces Table */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/60 text-zinc-400 border-b border-white/10">
                <tr>
                  <th className="p-3">Workspace</th>
                  <th className="p-3">State Machine Status</th>
                  <th className="p-3">Allocated Quota</th>
                  <th className="p-3">Runtime Instance</th>
                  <th className="p-3">Command Engine Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {activeWorkspaces.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-zinc-400">
                      ยังไม่มี Workspace ใน Local Development Storage — กด <strong>Provision Workspace</strong> ด้านบนเพื่อสร้างผ่าน Command Engine
                    </td>
                  </tr>
                ) : (
                  activeWorkspaces.map((ws) => (
                    <tr key={ws.id} className="hover:bg-white/[0.02]">
                      <td className="p-3">
                        <div className="font-bold text-white">{ws.name}</div>
                        <div className="text-[10px] text-zinc-500">{ws.id}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ws.status === 'RUNNING'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : ws.status === 'STOPPED'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              : ws.status === 'ERROR'
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                              : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                          }`}
                        >
                          {ws.status}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-300">
                        {ws.resources.allocated.CPU} CPU · {ws.resources.allocated.MEMORY} GB ·{' '}
                        {ws.resources.allocated.STORAGE} GB
                      </td>
                      <td className="p-3 text-cyan-300">
                        {ws.runtime.instanceId ?? 'unassigned'} ({ws.runtime.provider})
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {(ws.status === 'STOPPED' || ws.status === 'READY') && (
                            <button
                              onClick={() => handleLifecycleCommand(ws, 'START_WORKSPACE')}
                              disabled={busy}
                              className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <Play className="w-3 h-3" /> Start
                            </button>
                          )}
                          {ws.status === 'RUNNING' && (
                            <>
                              <button
                                onClick={() => handleLifecycleCommand(ws, 'STOP_WORKSPACE')}
                                disabled={busy}
                                className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <Square className="w-3 h-3" /> Stop
                              </button>
                              <button
                                onClick={() => handleLifecycleCommand(ws, 'RESTART_WORKSPACE')}
                                disabled={busy}
                                className="px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" /> Restart
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleLifecycleCommand(ws, 'DESTROY_WORKSPACE')}
                            disabled={busy}
                            className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Destroy
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: OBSERVABILITY & SYSTEM HEALTH */}
      {activeSubTab === 'OBSERVABILITY' && (
        <div className="p-4 rounded-xl bg-black/40 border border-white/10">
          <ObservabilityPanel platform={platform} overview={overview} />
        </div>
      )}

      {/* SUBTAB 3: KNOWLEDGE INGESTION & SEARCH */}
      {activeSubTab === 'KNOWLEDGE' && (
        <div className="p-4 rounded-xl bg-black/40 border border-white/10">
          <KnowledgePanel platform={platform} overview={overview} />
        </div>
      )}

      {/* SUBTAB 4: DURABLE COMMAND & KNOWLEDGE AUDIT TRAIL */}
      {activeSubTab === 'AUDIT' && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/60 text-zinc-400 border-b border-white/10">
              <tr>
                <th className="p-3">Record / Command ID</th>
                <th className="p-3">Category / Action</th>
                <th className="p-3">Workspace ID</th>
                <th className="p-3">Terminal Status</th>
                <th className="p-3">Completed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {auditRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-zinc-400">
                    ยังไม่มีรายการใน Durable Audit Trail (nimbusos.command-audit.v1)
                  </td>
                </tr>
              ) : (
                auditRecords.map((rec) => {
                  const idKey = 'commandId' in rec ? rec.commandId : rec.auditId;
                  const actionLabel = 'commandType' in rec ? rec.commandType : rec.actionType;
                  return (
                    <tr key={idKey} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-bold text-cyan-300">{idKey}</td>
                      <td className="p-3 text-white">{actionLabel}</td>
                      <td className="p-3 text-zinc-300">{rec.workspaceId}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rec.status === 'SUCCEEDED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-400">{rec.completedAt ?? '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default NimbusOsCommandCenterPanel;
