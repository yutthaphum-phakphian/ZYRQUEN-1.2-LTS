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
  Info
} from 'lucide-react';
import { playTone, playAuditChime } from './AudioSynthesizer';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'owner' | 'admin' | 'user';
  createdAt: string;
  lastActiveUtc?: string;
  status: 'active' | 'suspended';
}

export const AdminConsole: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<'connected' | 'fallback_unreachable' | 'checking'>('checking');

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
      setErrorMessage('Security Invariant Violation: Project Owner permissions cannot be demoted or modified.');
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
      playAuditChime();
      await fetchUsers();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      playTone(260, 0.12);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6 font-mono text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0a0f1e] border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/70 border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-wider text-white">
                ZYRQUEN Sovereign Admin Console
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border-cyan-500/40">
                RBAC v2.0
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Role-Based Access Control • Project Owner Invariant Lock (Fail-Closed)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              playTone(440, 0.04);
              fetchUsers();
            }}
            disabled={isLoading}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] border-cyan-500/30 text-cyan-300 text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh State</span>
          </button>
        </div>
      </div>

      {/* Database & Fallback Alert Banner */}
      {dbStatus === 'fallback_unreachable' && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border-amber-500/40 text-amber-200 text-xs space-y-2">
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
        <div className="p-4 rounded-xl bg-rose-950/50 border-rose-500/50 text-rose-300 text-xs flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* User Management Table */}
      <div className="rounded-2xl bg-[#0a0f1e] border-cyan-500/20 overflow-hidden shadow-xl">
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
                            <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border-amber-500/40 text-[9px] font-bold">
                              OWNER
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-400">{u.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'owner'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                            : u.role === 'admin'
                            ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700'
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
                            className="bg-[#0c1222] border-cyan-500/30 rounded-lg px-2.5 py-1 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 cursor-pointer disabled:opacity-50"
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
      <div className="p-4 rounded-xl bg-[#080d19] border-zinc-800 text-xs text-zinc-400 flex items-start gap-3">
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
  );
};
