import React, { useEffect, useState } from 'react';
import { LogIn, LogOut, RefreshCw, Clock, KeyRound } from 'lucide-react';
import {
  getAuthToken,
  getSessionRemainingMs,
  loginWithKey,
  logout,
  refreshSession,
  AUTH_EXPIRED_EVENT,
} from '../utils/authFetch';

/**
 * Compact session auth bar: login / remaining time / refresh / logout.
 * Shared styling with AdminPanel (stone + fuchsia accents).
 */
export const SessionAuthBar: React.FC = () => {
  const [accessKey, setAccessKey] = useState('');
  const [loggedIn, setLoggedIn] = useState(!!getAuthToken());
  const [msg, setMsg] = useState('');
  const [remainLabel, setRemainLabel] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const h = () => {
      setLoggedIn(false);
      setMsg('เซสชันหมดอายุ — กรุณาล็อกอินใหม่');
      setRemainLabel('');
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, h);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, h);
  }, []);

  useEffect(() => {
    if (!loggedIn) {
      setRemainLabel('');
      return;
    }
    const tick = () => {
      const ms = getSessionRemainingMs();
      if (ms <= 0) {
        setRemainLabel('');
        return;
      }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRemainLabel(
        m >= 60 ? `${Math.floor(m / 60)} ชม. ${m % 60} น.` : m > 0 ? `${m} นาที` : `${s} วินาที`,
      );
    };
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, [loggedIn, msg]);

  const doLogin = async () => {
    setBusy(true);
    try {
      const r = await loginWithKey(accessKey.trim());
      setAccessKey('');
      setLoggedIn(!!r.token);
      setMsg(
        r.authRequired
          ? `ล็อกอินแล้วในชื่อ ${r.userId} ถึง ${new Date(r.expiresAt as number).toLocaleTimeString()} (รีโหลดเพื่อโหลดภารกิจ)`
          : 'เซิร์ฟเวอร์ปิด auth อยู่ (โหมดพัฒนา)',
      );
    } catch (err) {
      setMsg(
        err instanceof Error && err.message === 'TOO_MANY_FAILED_ATTEMPTS'
          ? 'ล็อกอินผิดบ่อยเกินไป — รอประมาณ 1 นาทีแล้วลองใหม่'
          : 'ล็อกอินไม่สำเร็จ',
      );
    } finally {
      setBusy(false);
    }
  };

  const doLogout = async () => {
    setBusy(true);
    try {
      await logout();
      setLoggedIn(false);
      setMsg('ออกจากระบบแล้ว');
      setRemainLabel('');
    } finally {
      setBusy(false);
    }
  };

  const doRefresh = async () => {
    setBusy(true);
    try {
      const exp = await refreshSession();
      if (exp) setMsg(`ต่ออายุเซสชันแล้ว ถึง ${new Date(exp).toLocaleTimeString()}`);
      else setMsg('ต่ออายุไม่สำเร็จ — ลองล็อกอินใหม่');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-3 sm:p-3.5 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {!loggedIn ? (
          <>
            <div className="relative flex-1 min-w-[12rem]">
              <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500 pointer-events-none" />
              <input
                type="password"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') doLogin();
                }}
                placeholder="รหัสเข้าถึง (ถ้าเซิร์ฟเวอร์ต้องการ)"
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/40"
              />
            </div>
            <button
              type="button"
              onClick={doLogin}
              disabled={busy || !accessKey.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-white text-sm font-medium disabled:opacity-40 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              ล็อกอิน
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400/90 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              {remainLabel ? `เหลือ ${remainLabel}` : 'เข้าสู่ระบบแล้ว'}
            </div>
            <button
              type="button"
              onClick={doRefresh}
              disabled={busy}
              title="ต่ออายุเซสชัน"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs border border-stone-600 transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
              ต่ออายุ
            </button>
            <button
              type="button"
              onClick={doLogout}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-100 text-sm transition-colors disabled:opacity-40"
            >
              <LogOut className="w-3.5 h-3.5" />
              ออกจากระบบ
            </button>
          </>
        )}
      </div>
      {msg && (
        <p className={`text-[11px] leading-relaxed ${msg.includes('ไม่') || msg.includes('หมดอายุ') ? 'text-rose-300/90' : 'text-stone-400'}`}>
          {msg}
        </p>
      )}
    </div>
  );
};
