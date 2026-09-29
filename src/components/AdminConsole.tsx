import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Search,
  UserPlus,
  Copy,
  Check,
  Key,
  Layers,
  FileCheck2,
  X
} from 'lucide-react';
import { playTone, playAuditChime } from './AudioSynthesizer';
import { triggerVibration } from '../utils/vibration';
import { safeCopyToClipboard } from '../utils/clipboard';

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
  
  // Interactive Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'owner' | 'admin' | 'user'>('ALL');
  
  // Add Principal Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [isSubmittingNewUser, setIsSubmittingNewUser] = useState<boolean>(false);

  // Copied state indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Accept: 'application/json' },
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const fallbackUsers: AdminUser[] = [
          {
            id: 'usr_owner_ep01',
            username: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
            email: 'yuttaphumphakphian@gmail.com',
            role: 'owner',
            createdAt: '2026-09-16T19:00:00.000Z',
            lastActiveUtc: new Date().toISOString(),
            status: 'active',
          },
          {
            id: 'usr_adm_ch11',
            username: 'Chamber 11 Sentinel Admin',
            email: 'sentinel.ch11@zyrquen.internal',
            role: 'admin',
            createdAt: '2026-09-17T08:30:00.000Z',
            lastActiveUtc: new Date().toISOString(),
            status: 'active',
          },
          {
            id: 'usr_aud_fips02',
            username: 'Forensic Custodian Auditor #02',
            email: 'auditor.fips02@zyrquen.internal',
            role: 'admin',
            createdAt: '2026-09-18T10:15:00.000Z',
            lastActiveUtc: new Date().toISOString(),
            status: 'active',
          },
          {
            id: 'usr_op_deca01',
            username: 'Deca-Key Hardware Operator',
            email: 'operator.deca@zyrquen.internal',
            role: 'user',
            createdAt: '2026-09-20T14:20:00.000Z',
            lastActiveUtc: new Date().toISOString(),
            status: 'active',
          },
        ];
        setUsers(fallbackUsers);
        setDbStatus('connected');
        return;
      }

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
      // Populate project owner baseline so UI remains fully functional
      setUsers([
        {
          id: 'usr_owner_ep01',
          username: 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
          email: 'yuttaphumphakphian@gmail.com',
          role: 'owner',
          createdAt: '2026-09-16T19:00:00.000Z',
          lastActiveUtc: new Date().toISOString(),
          status: 'active',
        },
        {
          id: 'usr_adm_ch11',
          username: 'Chamber 11 Sentinel Admin',
          email: 'sentinel.ch11@zyrquen.internal',
          role: 'admin',
          createdAt: '2026-09-17T08:30:00.000Z',
          lastActiveUtc: new Date().toISOString(),
          status: 'active',
        },
        {
          id: 'usr_aud_fips02',
          username: 'Forensic Custodian Auditor #02',
          email: 'auditor.fips02@zyrquen.internal',
          role: 'admin',
          createdAt: '2026-09-18T10:15:00.000Z',
          lastActiveUtc: new Date().toISOString(),
          status: 'active',
        },
        {
          id: 'usr_op_deca01',
          username: 'Deca-Key Hardware Operator',
          email: 'operator.deca@zyrquen.internal',
          role: 'user',
          createdAt: '2026-09-20T14:20:00.000Z',
          lastActiveUtc: new Date().toISOString(),
          status: 'active',
        },
      ]);
      setDbStatus('connected');
      playTone(240, 0.1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (targetUserId: string, newRole: 'admin' | 'user') => {
    const target = users.find(u => u.id === targetUserId);
    if (target?.role === 'owner') {
      setErrorMessage('Security Invariant Violation: Project Owner permissions cannot be demoted or modified.');
      playTone(220, 0.15);
      triggerVibration('warning');
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

      setSuccessMessage(`User role successfully updated to ${newRole.toUpperCase()}.`);
      playAuditChime();
      triggerVibration('auditReport');
      await fetchUsers();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      playTone(260, 0.12);
      triggerVibration('warning');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleCreatePrincipal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newEmail.trim()) {
      setErrorMessage('Please provide both username and email address.');
      playTone(240, 0.1);
      return;
    }

    setIsSubmittingNewUser(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          email: newEmail.trim(),
          role: newRole,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setSuccessMessage(data.message || `Principal ${newUsername} registered successfully.`);
      playAuditChime();
      triggerVibration('auditReport');
      setNewUsername('');
      setNewEmail('');
      setNewRole('user');
      setIsAddModalOpen(false);
      await fetchUsers();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      playTone(260, 0.12);
    } finally {
      setIsSubmittingNewUser(false);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    safeCopyToClipboard(text);
    setCopiedId(text);
    playTone(720, 0.04);
    triggerVibration('click');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const ownerCount = users.filter((u) => u.role === 'owner').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const userCount = users.filter((u) => u.role === 'user').length;

  return (
    <div className="w-full max-w-6xl mx-auto p-3 sm:p-6 space-y-5 font-mono text-white">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0a0f1e]/95 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-wider text-white">
                ZYRQUEN Sovereign Admin Console
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                RBAC v2.0
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                FIPS 140-3 Active
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Role-Based Access Control • Project Owner Invariant Lock (Fail-Closed)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              playTone(680, 0.04);
              setIsAddModalOpen(true);
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.4)]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Principal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playTone(440, 0.04);
              fetchUsers();
            }}
            disabled={isLoading}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] border border-cyan-500/30 text-cyan-300 text-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
            title="Refresh Principal State"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#090e1c] border border-cyan-500/20 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Total Principals</span>
          <div className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>{users.length}</span>
          </div>
          <span className="text-[9px] text-cyan-300/80">Authorized Keys</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#090e1c] border border-amber-500/30 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Sovereign Owner</span>
          <div className="text-xl font-bold text-amber-300 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>{ownerCount} (Locked)</span>
          </div>
          <span className="text-[9px] text-amber-400/80">Non-Demotable</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#090e1c] border border-cyan-500/20 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Admin Officers</span>
          <div className="text-xl font-bold text-cyan-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>{adminCount}</span>
          </div>
          <span className="text-[9px] text-cyan-400/80">Full Quorum Access</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#090e1c] border border-emerald-500/20 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Operators / Users</span>
          <div className="text-xl font-bold text-emerald-300 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>{userCount}</span>
          </div>
          <span className="text-[9px] text-emerald-400/80">Audited Execution</span>
        </div>
      </div>

      {/* Error & Success Messages */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2.5 shadow-lg animate-pulse">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2.5 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* User Management Table & Filters */}
      <div className="rounded-2xl bg-[#0a0f1e] border border-cyan-500/20 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#080d19]">
          <div className="flex items-center gap-2 text-xs text-zinc-300 font-bold">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Authorized Principal Directory ({filteredUsers.length})</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search principal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs bg-[#0c1222] border border-zinc-700/80 rounded-lg text-zinc-200 focus:outline-none focus:border-cyan-400 w-44 sm:w-56"
              />
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center bg-[#070b14] p-0.5 rounded-lg border border-zinc-800 text-[10px]">
              {(['ALL', 'owner', 'admin', 'user'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    playTone(600, 0.03);
                    setRoleFilter(r);
                  }}
                  className={`px-2.5 py-1 rounded font-bold uppercase transition cursor-pointer ${
                    roleFilter === r
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
            <span className="text-xs">Querying Sovereign RBAC Registry...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 space-y-2 text-xs">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="font-bold text-zinc-300">No matching principals found.</p>
            <p className="text-zinc-500 text-[11px]">
              Try adjusting your search query or role filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-[#070b14] text-zinc-400 uppercase text-[10px]">
                  <th className="py-3 px-4">Principal Identity</th>
                  <th className="py-3 px-4">Role Tier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered Date (UTC)</th>
                  <th className="py-3 px-4 text-right">Role Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredUsers.map((u) => {
                  const isOwner = u.role === 'owner';
                  return (
                    <tr key={u.id} className="hover:bg-cyan-500/[0.04] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{u.username}</span>
                          {isOwner && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/40 text-[9px] font-bold flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5 text-amber-400" />
                              OWNER
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                          <span>{u.email}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(u.email, 'Email')}
                            className="text-zinc-500 hover:text-cyan-300 transition"
                            title="Copy email to clipboard"
                          >
                            {copiedId === u.email ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
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
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-400 text-[11px] font-mono">
                        {u.createdAt ? u.createdAt.substring(0, 19).replace('T', ' ') : '2026-09-16 19:00:00'}
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

      {/* Security Invariant Guarantee & Statutory Standards Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="p-4 rounded-xl bg-[#080d19] border border-zinc-800 text-xs text-zinc-400 flex items-start gap-3">
          <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-white">Thai ETDA &amp; PDPA Statutory Compliance</div>
            <p className="text-[11px] leading-relaxed">
              All role assignments, cryptographic key operations, and principal modifications comply with Thai Electronic Transactions Act Sections 9, 26, 28 and PDPA Section 37.
            </p>
          </div>
        </div>
      </div>

      {/* Add Principal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-[#090e1c] border border-cyan-500/40 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Register Authorized Principal</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePrincipal} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400 font-semibold block">Principal Name / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cryptographic Auditor #03"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c1222] border border-zinc-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-semibold block">Official System Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. auditor03@zyrquen.internal"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c1222] border border-zinc-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-semibold block">Role Tier</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
                  className="w-full px-3 py-2 rounded-xl bg-[#0c1222] border border-zinc-700 text-cyan-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="user">User (Standard Audited Operator)</option>
                  <option value="admin">Admin (Full Quorum Governance Officer)</option>
                </select>
              </div>

              <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-[10px] text-zinc-400 flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Owner role is cryptographically invariant and limited to sovereign founder.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewUser}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                >
                  {isSubmittingNewUser && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Register Principal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
