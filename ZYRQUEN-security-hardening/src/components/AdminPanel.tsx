import React, { useCallback, useState } from 'react';
import {
  Shield, Users, Link2, ScrollText, KeyRound, RefreshCw,
  UserPlus, Power, Trash2, Copy, Check, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';
import { getAdminToken, setAdminToken, adminFetch } from '../utils/authFetch';

type RegUser = {
  userId: string;
  enabled: boolean;
  createdAt: number;
  rotatedAt: number;
  note?: string;
};

type AuditEv = {
  id: string;
  ts: number;
  action: string;
  actor?: string;
  target?: string;
  result?: string;
  detail?: string;
};

type Tab = 'users' | 'invites' | 'audit';

export const AdminPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('users');
  const [adminTok, setAdminTok] = useState(getAdminToken());
  const [saved, setSaved] = useState(!!getAdminToken());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState(true);

  const [users, setUsers] = useState<RegUser[]>([]);
  const [newUserId, setNewUserId] = useState('');
  const [issuedKey, setIssuedKey] = useState('');
  const [copied, setCopied] = useState(false);

  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);

  const [audit, setAudit] = useState<AuditEv[]>([]);

  const flash = (text: string, ok = true) => {
    setMsg(text);
    setMsgOk(ok);
  };

  const saveToken = () => {
    const t = adminTok.trim();
    setAdminToken(t);
    setSaved(!!t);
    flash(t ? 'บันทึก ADMIN_TOKEN แล้ว (sessionStorage)' : 'ล้าง token แล้ว', !!t);
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      flash(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด', false);
    } finally {
      setBusy(false);
    }
  };

  const loadUsers = useCallback(() => run(async () => {
    const b = await adminFetch('/api/admin/users');
    setUsers(b.users || []);
    flash(`โหลด ${(b.users || []).length} user จาก registry`);
  }), [adminTok]);

  const loadAudit = useCallback(() => run(async () => {
    const b = await adminFetch('/api/admin/audit?limit=50');
    setAudit(b.events || []);
    flash(`โหลด audit ${(b.events || []).length} รายการ`);
  }), [adminTok]);

  const createUser = () => run(async () => {
    const id = newUserId.trim();
    if (!id) return flash('กรอก userId ก่อน', false);
    const b = await adminFetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ userId: id }),
    });
    setIssuedKey(b.accessKey || '');
    setNewUserId('');
    setCopied(false);
    flash(`สร้าง ${b.userId} สำเร็จ — คัดลอก access key ด้านล่าง (ครั้งเดียว)`);
    const list = await adminFetch('/api/admin/users');
    setUsers(list.users || []);
  });

  const rotateUser = (uid: string) => {
    if (!confirm(`หมุน key ของ “${uid}”? session เก่าจะหมดทันที`)) return;
    run(async () => {
      const b = await adminFetch(`/api/admin/users/${encodeURIComponent(uid)}/rotate`, {
        method: 'POST',
        body: '{}',
      });
      setIssuedKey(b.accessKey || '');
      setCopied(false);
      flash(`หมุน key ${uid} แล้ว — คัดลอก key ใหม่ด้านล่าง`);
      const list = await adminFetch('/api/admin/users');
      setUsers(list.users || []);
    });
  };

  const toggleUser = (uid: string, enabled: boolean) => run(async () => {
    await adminFetch(`/api/admin/users/${encodeURIComponent(uid)}/enable`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
    flash(enabled ? `เปิด ${uid} แล้ว` : `ปิด ${uid} แล้ว`);
    const list = await adminFetch('/api/admin/users');
    setUsers(list.users || []);
  });

  const deleteUser = (uid: string) => {
    if (!confirm(`ลบ “${uid}” ออกจาก registry?`)) return;
    run(async () => {
      await adminFetch(`/api/admin/users/${encodeURIComponent(uid)}`, { method: 'DELETE' });
      flash(`ลบ ${uid} แล้ว`);
      const list = await adminFetch('/api/admin/users');
      setUsers(list.users || []);
    });
  };

  const createInvite = () => run(async () => {
    const uid = (inviteUserId.trim() || newUserId.trim());
    if (!uid) return flash('ใส่ userId ก่อนสร้าง invite', false);
    const b = await adminFetch('/api/admin/invites', {
      method: 'POST',
      body: JSON.stringify({ userId: uid, createUser: true, ttlHours: 48 }),
    });
    setInviteUrl(b.redeemUrl || '');
    setInviteCopied(false);
    flash(`สร้าง invite สำหรับ ${b.userId} แล้ว (TTL ตามที่ตั้ง)`);
  });

  const copyText = async (text: string, kind: 'key' | 'invite') => {
    try {
      await navigator.clipboard?.writeText(text);
      if (kind === 'key') setCopied(true);
      else setInviteCopied(true);
      flash('คัดลอกแล้ว');
    } catch {
      flash('คัดลอกไม่สำเร็จ', false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'users', label: 'Users', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'invites', label: 'Invites', icon: <Link2 className="w-3.5 h-3.5" /> },
    { id: 'audit', label: 'Audit', icon: <ScrollText className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-b from-stone-900/90 to-stone-950/90 overflow-hidden shadow-lg shadow-black/20">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-800/40 transition-colors"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30">
          <Shield className="w-4 h-4 text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-stone-100">Admin Console</div>
          <div className="text-[11px] text-stone-500 truncate">
            จัดการ user · invite · audit log
            {saved ? ' · token พร้อมใช้' : ' · ยังไม่ได้ใส่ ADMIN_TOKEN'}
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-stone-500" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
      </button>

      {open && (
        <div className="border-t border-stone-800/80 px-4 pb-4 pt-3 space-y-4">
          {/* Token bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500" />
              <input
                type="password"
                value={adminTok}
                onChange={(e) => setAdminTok(e.target.value)}
                placeholder="ADMIN_TOKEN (≥ 16 ตัวอักษร)"
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
            </div>
            <button
              type="button"
              onClick={saveToken}
              className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs text-stone-200 border border-stone-600 transition-colors"
            >
              บันทึก token
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-stone-950/80 border border-stone-800">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  if (t.id === 'users' && saved) loadUsers();
                  if (t.id === 'audit' && saved) loadAudit();
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  tab === t.id
                    ? 'bg-amber-500/20 text-amber-100 border border-amber-500/30'
                    : 'text-stone-400 hover:text-stone-200 border border-transparent'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 min-h-[1.25rem]">
            {busy && <Loader2 className="w-3.5 h-3.5 text-amber-300 animate-spin" />}
            {msg && (
              <p className={`text-[11px] ${msgOk ? 'text-stone-400' : 'text-rose-300'}`}>{msg}</p>
            )}
          </div>

          {/* USERS TAB */}
          {tab === 'users' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="userId ใหม่ (เช่น alice)"
                  className="flex-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                />
                <button
                  type="button"
                  onClick={createUser}
                  disabled={busy || !newUserId.trim()}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-200 border border-emerald-500/30 text-xs font-medium disabled:opacity-40 hover:bg-emerald-500/25 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  สร้าง user
                </button>
                <button
                  type="button"
                  onClick={loadUsers}
                  disabled={busy || !saved}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 text-stone-300 border border-stone-600 text-xs disabled:opacity-40 hover:bg-stone-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  รีเฟรช
                </button>
              </div>

              {issuedKey && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                  <div className="text-[10px] uppercase tracking-wide text-amber-200/80 font-semibold">
                    accessKey — แสดงครั้งเดียว
                  </div>
                  <code className="block text-xs text-amber-50 break-all select-all font-mono leading-relaxed">
                    {issuedKey}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyText(issuedKey, 'key')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-100 text-[11px] border border-amber-500/30 hover:bg-amber-500/30"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'คัดลอกแล้ว' : 'คัดลอก key'}
                  </button>
                </div>
              )}

              <div className="rounded-xl border border-stone-800 overflow-hidden">
                {users.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-stone-500">
                    ยังไม่มี user ใน registry — สร้างใหม่หรือกดรีเฟรช
                  </div>
                ) : (
                  <ul className="divide-y divide-stone-800/80">
                    {users.map((u) => (
                      <li
                        key={u.userId}
                        className="flex flex-wrap items-center gap-2 px-3 py-2.5 bg-stone-950/40 hover:bg-stone-900/60 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-[7rem] flex-1">
                          <span className="font-mono text-xs text-stone-100">{u.userId}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              u.enabled
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                                : 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                            }`}
                          >
                            {u.enabled ? 'เปิด' : 'ปิด'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="หมุน key"
                            onClick={() => rotateUser(u.userId)}
                            className="p-1.5 rounded-lg bg-stone-800/80 text-stone-300 hover:text-amber-200 hover:bg-stone-700 border border-stone-700"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title={u.enabled ? 'ปิด' : 'เปิด'}
                            onClick={() => toggleUser(u.userId, !u.enabled)}
                            className="p-1.5 rounded-lg bg-stone-800/80 text-stone-300 hover:text-sky-200 hover:bg-stone-700 border border-stone-700"
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="ลบ"
                            onClick={() => deleteUser(u.userId)}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* INVITES TAB */}
          {tab === 'invites' && (
            <div className="space-y-3">
              <p className="text-[11px] text-stone-500 leading-relaxed">
                สร้างลิงก์ใช้ครั้งเดียว ผู้รับเปิดแล้วได้ access key + ล็อกอินได้ทันที (TTL 48 ชม.)
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={inviteUserId}
                  onChange={(e) => setInviteUserId(e.target.value)}
                  placeholder="userId (เช่น bob)"
                  className="flex-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500/40"
                />
                <button
                  type="button"
                  onClick={createInvite}
                  disabled={busy || !saved}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-violet-500/15 text-violet-200 border border-violet-500/30 text-xs font-medium disabled:opacity-40 hover:bg-violet-500/25 transition-colors"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  สร้าง invite link
                </button>
              </div>
              {inviteUrl && (
                <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3 space-y-2">
                  <div className="text-[10px] uppercase tracking-wide text-violet-200/80 font-semibold">
                    Invite link — ใช้ครั้งเดียว
                  </div>
                  <code className="block text-xs text-violet-50 break-all select-all font-mono leading-relaxed">
                    {inviteUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyText(inviteUrl, 'invite')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-100 text-[11px] border border-violet-500/30 hover:bg-violet-500/30"
                  >
                    {inviteCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {inviteCopied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* AUDIT TAB */}
          {tab === 'audit' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={loadAudit}
                  disabled={busy || !saved}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 text-sky-200 border border-sky-500/30 text-xs disabled:opacity-40 hover:bg-sky-500/25"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  รีเฟรช audit
                </button>
              </div>
              <div className="rounded-xl border border-stone-800 max-h-52 overflow-y-auto">
                {audit.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-stone-500">
                    ยังไม่มีรายการ — กดรีเฟรชหลังมี activity
                  </div>
                ) : (
                  <ul className="divide-y divide-stone-800/80">
                    {audit.map((e) => (
                      <li key={e.id} className="px-3 py-2 text-[11px] font-mono leading-relaxed hover:bg-stone-900/50">
                        <span className="text-stone-600">{new Date(e.ts).toLocaleString()}</span>
                        <span className="ml-2 text-sky-300/90">{e.action}</span>
                        {e.target && <span className="ml-1.5 text-stone-300">→ {e.target}</span>}
                        {e.result && (
                          <span
                            className={`ml-1.5 ${
                              e.result === 'ok' ? 'text-emerald-400/80' : 'text-rose-300/80'
                            }`}
                          >
                            {e.result}
                          </span>
                        )}
                        {e.detail && <span className="ml-1.5 text-stone-500">{e.detail}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
