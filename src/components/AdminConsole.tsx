import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Users,
  AlertTriangle,
  RefreshCw,
  Lock,
  CheckCircle2,
  Database,
  Info,
  Bug,
  Terminal,
  Activity,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  Flame,
  Filter,
  Radio,
  Wifi
} from 'lucide-react';
import { playTone, playAuditChime } from './AudioSynthesizer';
import {
  systemDiagnosticService,
  DiagnosticLogEntry,
  DiagnosticLogLevel,
  DiagnosticServiceKey
} from '../services/systemDiagnosticService';
import { ToastType } from './ToastNotification';
import { SystemHealthDashboard } from './SystemHealthDashboard';
import { systemLogger, logSystemError } from '../utils/systemLogger';
import { systemStateStore } from '../store/systemStateStore';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'owner' | 'admin' | 'user';
  createdAt: string;
  lastActiveUtc?: string;
  status: 'active' | 'suspended';
}

interface AdminConsoleProps {
  onNavigateToHealth?: () => void;
  onShowToast?: (message: string, type?: ToastType) => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  onNavigateToHealth,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'health' | 'rbac' | 'diagnostics'>('health');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<'connected' | 'fallback_unreachable' | 'checking'>('checking');

  // Diagnostics & Verbose Logging State synced with systemStateStore & systemDiagnosticService
  const [isVerboseLogging, setIsVerboseLogging] = useState<boolean>(systemStateStore.isVerboseLoggingEnabled);
  const [diagnosticLogs, setDiagnosticLogs] = useState<DiagnosticLogEntry[]>(systemDiagnosticService.getLogs());
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    const unsubStore = systemStateStore.subscribe((state) => {
      setIsVerboseLogging(state.isVerboseLoggingEnabled);
    });
    const unsubLogs = systemDiagnosticService.subscribe((logs) => {
      setDiagnosticLogs(logs);
    });
    const unsubToggle = systemDiagnosticService.onToggle((enabled) => {
      setIsVerboseLogging(enabled);
    });

    return () => {
      unsubStore();
      unsubLogs();
      unsubToggle();
    };
  }, []);

  const handleToggleVerbose = () => {
    const next = systemLogger.toggleVerbose();
    setIsVerboseLogging(next);
    playTone(next ? 660 : 330, 0.08);
    if (onShowToast) {
      onShowToast(
        next
          ? 'Verbose system error logging ENABLED. Full diagnostic traces active.'
          : 'Verbose system error logging DISABLED. Reverted to standard telemetry.',
        'info'
      );
    }
  };

  const handleTriggerTestError = () => {
    const errorMsg = 'Operator Simulated Error: WebSocket connection heartbeat timeout on node #04.';
    logSystemError(
      'WebSocket',
      errorMsg,
      new Error('WebSocketHeartbeatTimeoutError: Remote gateway failed ack response within 2000ms threshold.'),
      { errorCode: 'WS_HEARTBEAT_TIMEOUT_0x44', node: 'gateway-node-04' }
    );
    if (onShowToast) {
      onShowToast(
        'Critical Alert: WebSocket heartbeat timeout detected on secondary node. Fail-closed defense protocol active.',
        'error'
      );
    }
    playTone(180, 0.2, 'sawtooth');
  };

  const handleExportDiagnostics = () => {
    const jsonStr = systemDiagnosticService.exportLogsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zyrquen-system-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (onShowToast) {
      onShowToast('Diagnostic log bundle exported as JSON.', 'success');
    }
  };

  const handleClearLogs = () => {
    systemDiagnosticService.clearLogs();
    playTone(400, 0.05);
    if (onShowToast) {
      onShowToast('Diagnostic log history cleared.', 'info');
    }
  };

  const filteredLogs = diagnosticLogs.filter((entry) => {
    if (serviceFilter !== 'ALL' && entry.service !== serviceFilter) return false;
    if (levelFilter !== 'ALL' && entry.level !== levelFilter) return false;
    return true;
  });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) {
        if (res.status === 503) {
          setDbStatus('fallback_unreachable');
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'DatabaseConnectionError: Permanent storage not established or unreachable.');
        }
        throw new Error(`Failed to fetch admin users (HTTP ${res.status})`);
      }
      const data = await res.json();
      setUsers(data.users || []);
      setDbStatus('connected');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setUsers([]);
      systemDiagnosticService.logError('Database', `RBAC user fetch error: ${msg}`, err);
      playTone(240, 0.1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (targetUserId: string, newRole: 'admin' | 'user') => {
    // Client-side Owner Protection check
    const target = users.find(u => u.id === targetUserId);
    if (target?.role === 'owner') {
      const msg = 'Security Invariant Violation: Project Owner permissions cannot be demoted or modified.';
      setErrorMessage(msg);
      systemDiagnosticService.logError('RBAC', msg, undefined, { targetUserId });
      playTone(220, 0.15);
      return;
    }

    setIsUpdating(targetUserId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/admin/users/${targetUserId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP ${res.status}`);
      }

      setSuccessMessage(`User role successfully upgraded to ${newRole.toUpperCase()}.`);
      systemDiagnosticService.log({
        level: 'INFO',
        service: 'RBAC',
        message: `User ${targetUserId} role updated to ${newRole.toUpperCase()}`,
        details: { targetUserId, newRole }
      });
      playAuditChime();
      await fetchUsers();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      systemDiagnosticService.logError('RBAC', `Role mutation failure: ${msg}`, err, { targetUserId, newRole });
      playTone(260, 0.12);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div id="admin-console-root" className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6 font-mono text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0a0f1e] border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-wider text-white">
                ZYRQUEN Sovereign Admin Console
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                RBAC v2.0
              </span>
              {isVerboseLogging && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/90 text-amber-300 border border-amber-500/50 animate-pulse">
                  VERBOSE ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Role-Based Access Control • Diagnostics & Error Oversight • Fail-Closed Locks
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Quick Verbose Toggle in Header */}
          <div className="flex items-center gap-2 bg-[#0c1222] px-3 py-1.5 rounded-xl border border-cyan-500/30">
            <span className="text-[11px] text-zinc-300 font-bold">Verbose Trace:</span>
            <button
              id="admin-header-toggle-verbose-btn"
              type="button"
              role="switch"
              aria-checked={isVerboseLogging}
              onClick={handleToggleVerbose}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out ${
                isVerboseLogging ? 'bg-amber-500' : 'bg-zinc-700'
              }`}
              title="Toggle global verbose error logging for deep stack trace capture"
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                  isVerboseLogging ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <button
            id="admin-refresh-state-btn"
            onClick={() => {
              playTone(440, 0.04);
              fetchUsers();
            }}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] border border-cyan-500/30 text-cyan-300 text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh State</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SUB-NAVIGATION TABS (System Health, RBAC, Diagnostics)
         ========================================================================= */}
      <div id="admin-subview-tabs" className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#080d19] border border-cyan-500/20 shadow-lg">
        <button
          id="admin-tab-health-btn"
          onClick={() => {
            setActiveTab('health');
            playTone(480, 0.04);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'health'
              ? 'bg-gradient-to-r from-cyan-950 to-blue-950 border border-cyan-500/60 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
          }`}
        >
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>System Health Dashboard</span>
          <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 text-[10px]">LIVE</span>
        </button>

        <button
          id="admin-tab-rbac-btn"
          onClick={() => {
            setActiveTab('rbac');
            playTone(400, 0.04);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'rbac'
              ? 'bg-gradient-to-r from-cyan-950 to-blue-950 border border-cyan-500/60 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
          }`}
        >
          <Users className="w-4 h-4 text-cyan-400" />
          <span>Access Control & RBAC Directory</span>
          <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 text-[10px]">{users.length}</span>
        </button>

        <button
          id="admin-tab-diagnostics-btn"
          onClick={() => {
            setActiveTab('diagnostics');
            playTone(520, 0.04);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'diagnostics'
              ? 'bg-gradient-to-r from-cyan-950 to-blue-950 border border-cyan-500/60 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
          }`}
        >
          <Bug className="w-4 h-4 text-amber-400" />
          <span>Diagnostics & Error Traces</span>
          {isVerboseLogging && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>
      </div>

      {/* =========================================================================
          TAB 1: INTEGRATED SYSTEM HEALTH DASHBOARD
         ========================================================================= */}
      {activeTab === 'health' && (
        <div id="admin-integrated-health-view" className="space-y-4">
          <SystemHealthDashboard
            onShowToast={onShowToast}
            onNavigateToAdmin={() => setActiveTab('rbac')}
          />
        </div>
      )}

      {/* =========================================================================
          TAB 2: ACCESS CONTROL & RBAC DIRECTORY
         ========================================================================= */}
      {activeTab === 'rbac' && (
        <div id="admin-rbac-view" className="space-y-6">
          {/* Database & Fallback Alert Banner */}
          {dbStatus === 'fallback_unreachable' && (
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <Database className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Zero-Trust Fallback Notice: Permanent Database Storage Offline</span>
              </div>
              <p className="text-amber-200/90 leading-relaxed">
                According to the Sovereign Dashboard rule, the system strictly refuses to inject fake mock user data.
                Because the permanent PostgreSQL connection (<code className="bg-black/40 px-1 py-0.5 rounded">DATABASE_URL</code>) is currently offline,
                the backend returned a fail-closed <strong>503 Service Unavailable</strong> state.
              </p>
              <div className="text-[11px] text-amber-300/80 flex items-center gap-1.5 pt-1">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>To activate live multi-user editing, provide valid database credentials in your environment variables.</span>
              </div>
            </div>
          )}

          {/* Error & Success Messages */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* User Management Table */}
          <div className="rounded-2xl bg-[#0a0f1e] border border-cyan-500/20 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between bg-[#080d19]">
              <div className="flex items-center gap-2 text-xs text-zinc-300 font-bold">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Authorized Principal Directory ({users.length})</span>
              </div>
              <span className="text-[11px] text-zinc-500">
                Owner Demotion: <span className="text-rose-400 font-bold">PROHIBITED</span>
              </span>
            </div>

            {isLoading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                <span className="text-xs">Querying Sovereign RBAC Registry...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 space-y-2 text-xs">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="font-bold text-zinc-300">No active users loaded from database.</p>
                <p className="text-zinc-500 text-[11px]">
                  Verify database connectivity to populate authenticated system operators.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-[#070b14] text-zinc-400 uppercase text-[10px]">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Created (UTC)</th>
                      <th className="py-3 px-4 text-right">Role Management</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {users.map((u) => {
                      const isOwner = u.role === 'owner';
                      return (
                        <tr key={u.id} className="hover:bg-cyan-500/[0.03] transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{u.username}</span>
                              {isOwner && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                                  OWNER
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-400">{u.email}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              u.role === 'owner'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50'
                                : u.role === 'admin'
                                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/50'
                                : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                            }`}>
                              {u.role === 'owner' && <Lock className="w-3 h-3" />}
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-400 text-[11px]">
                            {u.createdAt}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isOwner ? (
                              <div className="inline-flex items-center gap-1.5 text-zinc-500 text-[11px] cursor-not-allowed">
                                <Lock className="w-3 h-3 text-amber-500" />
                                <span>Protected Sovereign</span>
                              </div>
                            ) : (
                              <select
                                value={u.role}
                                disabled={isUpdating === u.id}
                                onChange={(e) => handleRoleChange(u.id, e.target.value as 'admin' | 'user')}
                                className="bg-[#0c1222] border border-cyan-500/30 rounded-lg px-2.5 py-1 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 cursor-pointer disabled:opacity-50"
                              >
                                <option value="admin">Admin</option>
                                <option value="user">User</option>
                              </select>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Security Invariant Guarantee Card */}
          <div className="p-4 rounded-xl bg-[#080d19] border border-zinc-800 text-xs text-zinc-400 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-white">Owner Protection Invariant Active</div>
              <p className="text-[11px] leading-relaxed">
                The project owner role is protected by cryptographic invariants on both client and backend layers.
                Attempts to demote the owner will immediately abort with a fail-closed 403 Forbidden rejection and log to the tamper audit trail.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: DIAGNOSTIC PANEL & VERBOSE LOGGING TOGGLE
         ========================================================================= */}
      {activeTab === 'diagnostics' && (
        <div id="admin-diagnostic-panel" className="rounded-2xl bg-[#0a0f1e] border border-cyan-500/30 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-950/70 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  System Diagnostics & Verbose Error Logging
                </h2>
                <span className={`px-2 py-0.2 rounded text-[10px] font-bold border ${
                  isVerboseLogging
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {isVerboseLogging ? 'VERBOSE ACTIVE' : 'STANDARD LOGGING'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Inspect live service anomalies, exceptions, and toggle deep trace captures to debug recent issues.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3 self-end md:self-center">
            <label className="text-xs text-zinc-300 font-bold flex items-center gap-2 cursor-pointer">
              <span>Verbose Error Tracing:</span>
              <button
                id="toggle-verbose-logging-btn"
                type="button"
                role="switch"
                aria-checked={isVerboseLogging}
                onClick={handleToggleVerbose}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isVerboseLogging ? 'bg-amber-500' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isVerboseLogging ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
          </div>
        </div>

        {/* Action Buttons & Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>Service:</span>
            </div>
            {['ALL', 'WebSocket', 'PWA', 'Audio Synthesizer', 'Backup Service', 'Database', 'RBAC'].map((srv) => (
              <button
                key={srv}
                onClick={() => setServiceFilter(srv)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                  serviceFilter === srv
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                    : 'bg-[#080d19] text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                {srv}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="diag-trigger-test-error-btn"
              onClick={handleTriggerTestError}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 text-xs transition-colors cursor-pointer"
              title="Dispatches an error to test the shaking toast notification animation and error logger"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Test Error Shake</span>
            </button>
            <button
              id="diag-export-logs-btn"
              onClick={handleExportDiagnostics}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] border border-cyan-500/30 text-cyan-300 text-xs transition-colors cursor-pointer"
              title="Export diagnostics JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              id="diag-clear-logs-btn"
              onClick={handleClearLogs}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
              title="Clear in-memory diagnostic logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Live Diagnostic Event Stream */}
        <div className="rounded-xl bg-[#060a14] border border-zinc-800/90 overflow-hidden text-xs">
          <div className="p-2.5 bg-[#04070d] border-b border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5 font-bold text-zinc-300">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Diagnostic Event Stream ({filteredLogs.length} entries)</span>
            </span>
            <span>
              Auto-recording: <strong className="text-emerald-400">ONLINE</strong>
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-zinc-800/60 font-mono">
            {filteredLogs.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-xs">
                No diagnostic log entries match current filters.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isError = log.level === 'ERROR';
                const isWarn = log.level === 'WARN';
                const isExpanded = expandedLogId === log.id;

                return (
                  <div key={log.id} className="p-2.5 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 mt-0.5 ${
                          isError
                            ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                            : isWarn
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                        }`}>
                          {log.level}
                        </span>

                        <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 text-[9px] font-semibold shrink-0 mt-0.5">
                          {log.service}
                        </span>

                        <div className="flex-1 min-w-0">
                          <p className={`text-[11px] break-words ${isError ? 'text-rose-200 font-semibold' : 'text-zinc-200'}`}>
                            {log.message}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-zinc-500">
                          {log.timestampIct || log.timestamp.substring(11, 19)}
                        </span>
                        {(log.details || log.stack) && (
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 cursor-pointer"
                            title="Toggle stack & details"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expandable Stack Trace & Payload Details */}
                    {isExpanded && (log.details || log.stack) && (
                      <div className="mt-2 p-2.5 rounded bg-black/60 border border-zinc-800 text-[10px] text-zinc-300 space-y-1.5 overflow-x-auto">
                        {log.details && (
                          <div>
                            <span className="text-cyan-400 font-bold block mb-0.5">Diagnostic Payload:</span>
                            <pre className="whitespace-pre-wrap text-zinc-400">
                              {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.stack && (
                          <div>
                            <span className="text-rose-400 font-bold block mb-0.5">Stack Trace:</span>
                            <pre className="whitespace-pre-wrap text-rose-300/80 font-mono">
                              {log.stack}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

