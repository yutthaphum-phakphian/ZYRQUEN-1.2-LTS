import React, { useEffect, useState } from 'react';
import { loginWithKey } from '../utils/authFetch';

/**
 * Shown when the URL contains ?invite=<token> (one-time invite redeem).
 * Calls POST /api/invite/redeem, displays the access key once, optional one-click login.
 */
export const InviteRedeemModal: React.FC = () => {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [userId, setUserId] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const t = (q.get('invite') || q.get('token') || '').trim();
      if (!t) return;
      setToken(t);
      setOpen(true);
      setStatus('loading');
      (async () => {
        try {
          const r = await fetch('/api/invite/redeem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: t }),
          });
          const body = await r.json().catch(() => ({}));
          if (!r.ok) {
            setStatus('err');
            setMsg(body?.error === 'INVALID_OR_EXPIRED_INVITE' ? 'ลิงก์หมดอายุหรือใช้ไปแล้ว' : (body?.error || 'Redeem ไม่สำเร็จ'));
            return;
          }
          setUserId(body.userId || '');
          setAccessKey(body.accessKey || '');
          setStatus('ok');
          setMsg('ได้ access key แล้ว — เก็บไว้หรือล็อกอินทันที');
          // Clean token from URL so refresh doesn't re-burn (already burned)
          const url = new URL(window.location.href);
          url.searchParams.delete('invite');
          url.searchParams.delete('token');
          window.history.replaceState({}, '', url.pathname + url.search);
        } catch {
          setStatus('err');
          setMsg('เครือข่ายมีปัญหา');
        }
      })();
    } catch { /* no window */ }
  }, []);

  if (!open) return null;

  const doLogin = async () => {
    if (!accessKey) return;
    try {
      const r = await loginWithKey(accessKey);
      setMsg(r.authRequired ? `ล็อกอินแล้วในชื่อ ${r.userId}` : 'เซิร์ฟเวอร์ปิด auth');
      setTimeout(() => setOpen(false), 800);
      // soft reload so mission data picks up user
      window.location.reload();
    } catch {
      setMsg('ล็อกอินไม่สำเร็จ — คัดลอก key ไปใส่เอง');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-700/80 p-6 text-stone-100 shadow-2xl shadow-black/40">
        <h2 className="text-lg font-bold mb-1">รับสิทธิ์เข้าใช้งาน</h2>
        <p className="text-xs text-stone-400 mb-4">Invite ใช้ได้ครั้งเดียว</p>
        {status === 'loading' && <p className="text-sm text-stone-300">กำลังแลก invite…</p>}
        {status === 'err' && <p className="text-sm text-rose-300">{msg}</p>}
        {status === 'ok' && (
          <div className="space-y-3 text-sm">
            <p>User: <b className="text-emerald-300">{userId}</b></p>
            <div className="p-2 rounded-lg bg-stone-950 border border-amber-500/30 break-all">
              <div className="text-[10px] text-amber-200/80 mb-1">accessKey (แสดงครั้งเดียว)</div>
              <code className="select-all text-amber-100">{accessKey}</code>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => { navigator.clipboard?.writeText(accessKey); setMsg('คัดลอกแล้ว'); }} className="px-3 py-1.5 rounded-lg bg-stone-700 text-xs">คัดลอก key</button>
              <button type="button" onClick={doLogin} className="px-3 py-1.5 rounded-lg bg-fuchsia-500 text-white text-xs font-bold">ล็อกอินทันที</button>
            </div>
            {msg && <p className="text-xs text-stone-400">{msg}</p>}
          </div>
        )}
        <button type="button" onClick={() => setOpen(false)} className="mt-4 text-xs text-stone-500 hover:text-stone-300">ปิด</button>
      </div>
    </div>
  );
};
