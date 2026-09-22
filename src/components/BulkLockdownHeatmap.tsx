import React, { useState, useMemo } from 'react';

export interface ChamberHealth {
  id: string;
  name: string;
  coherence: number;
  stability: number;
  status: 'PURE_GREEN' | 'UNSTABLE' | 'LOCKED' | 'QUARANTINE';
  history: { timestamp: string; coherence: number; event: string }[];
  locked: boolean;
  lastLockdown?: string;
}

export interface BulkLockdownPayload {
  chamberIds: string[];
  reason: string;
  adminNote: string;
  twoFactorCode: string;
  timestamp: string;
  actor: string;
}

export const BulkLockdownHeatmap: React.FC = () => {
  const [selectedChambers, setSelectedChambers] = useState<Set<string>>(new Set());
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [reason, setReason] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [chambers, setChambers] = useState<ChamberHealth[]>(() => 
    Array.from({ length: 18 }, (_, i) => {
      const id = `CH-${String(i).padStart(2, '0')}`;
      const coherence = i === 3 || i === 11 ? 93.5 : Number((96 + Math.random() * 4).toFixed(2));
      const names = [
        'Multiverse Dashboard',
        'Canonical Core G11',
        'Forensics & Quarantine',
        'Custodian Tracker',
        'Invariants 10/10',
        'Master Gates 22/22',
        'Phoenix Recovery',
        'FIOS Treasury',
        'Post-Quantum Crypto',
        'Phase Registry 01-40',
        'Thai Legal Compliance',
        '8K Quantum Radar',
        'Sovereign CLI',
        'Multiverse Nav Grid',
        'Warp Path',
        'Quantum Fuel Core',
        'Runtime Deck Frozen',
        'Audit Trail Ledger'
      ];
      return {
        id,
        name: names[i],
        coherence,
        stability: Number((98 + Math.random() * 2).toFixed(2)),
        status: coherence < 95 ? 'UNSTABLE' : 'PURE_GREEN',
        history: [
          { timestamp: new Date(Date.now() - 3600000).toISOString(), coherence: coherence - 0.5, event: 'Routine Check' },
          { timestamp: new Date().toISOString(), coherence, event: coherence < 95 ? 'SENTINEL_ANOMALY Detected' : 'SSoT Δ0 Verified' }
        ],
        locked: false
      } as ChamberHealth;
    })
  );

  const avgCoherence = useMemo(() => (chambers.reduce((a, c) => a + c.coherence, 0) / 18).toFixed(2), [chambers]);
  const avgStability = useMemo(() => (chambers.reduce((a, c) => a + c.stability, 0) / 18).toFixed(2), [chambers]);

  const toggleChamber = (id: string) => {
    const newSet = new Set(selectedChambers);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedChambers(newSet);
  };

  const handleBulkLockdown = () => {
    if (selectedChambers.size === 0) return;
    setErrorMessage(null);
    setShow2FADialog(true);
  };

  const executeBulkLockdown = () => {
    if (twoFactorCode.length !== 6) {
      setErrorMessage('2FA code must be exactly 6 digits');
      return;
    }
    const payload: BulkLockdownPayload = {
      chamberIds: Array.from(selectedChambers),
      reason: reason || 'SENTINEL_SECURITY_ANOMALY',
      adminNote: adminNote || 'Administrative lockdown initiated via Sovereign Chamber Console',
      twoFactorCode,
      timestamp: new Date().toISOString(),
      actor: '#EP-SOVEREIGN-01'
    };
    
    // Update chambers state
    setChambers(prev => prev.map(ch => 
      selectedChambers.has(ch.id) 
        ? { 
            ...ch, 
            locked: true, 
            status: 'LOCKED' as const,
            lastLockdown: new Date().toISOString(),
            history: [
              ...ch.history, 
              { 
                timestamp: new Date().toISOString(), 
                coherence: ch.coherence, 
                event: `BULK_LOCKDOWN: ${payload.reason} | Note: ${payload.adminNote}` 
              }
            ]
          }
        : ch
    ));

    // Export audit log with safe cleanup (150ms)
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-lockdown-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode && a.isConnected) {
        a.parentNode.removeChild(a);
      }
      URL.revokeObjectURL(url);
    }, 150);

    setShow2FADialog(false);
    setSelectedChambers(new Set());
    setAdminNote('');
    setReason('');
    setTwoFactorCode('');
    setErrorMessage(null);
  };

  const escapeCsv = (str: string) => {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportCSV = () => {
    const headers = ['Chamber ID', 'Name', 'Coherence', 'Stability', 'Status', 'Locked', 'History'];
    const rows = chambers.map(ch => [
      ch.id,
      escapeCsv(ch.name),
      ch.coherence,
      ch.stability,
      ch.status,
      ch.locked ? 'YES' : 'NO',
      escapeCsv(ch.history.map(h => `${h.timestamp}:${h.event}`).join('|'))
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `governance-health-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode && a.isConnected) {
        a.parentNode.removeChild(a);
      }
      URL.revokeObjectURL(url);
    }, 150);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🌌</span> Governance Health Heatmap (CH-00..CH-17) - Bulk Lockdown Ready
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Avg Coherence: <span className="text-cyan-400 font-mono">{avgCoherence}%</span> | Avg Stability: <span className="text-emerald-400 font-mono">{avgStability}%</span> | Selected: <span className="text-amber-400 font-mono font-bold">{selectedChambers.size}</span> chambers | SSoT Δ0 | Fixed: escapeCsv + safe revokeObjectURL
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={exportCSV} 
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-xl transition-colors flex items-center gap-1.5"
          >
            <span>📊</span> Export CSV
          </button>
          <button 
            type="button"
            onClick={handleBulkLockdown} 
            disabled={selectedChambers.size === 0}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-lg shadow-red-950/50"
          >
            <span>🔒</span> Bulk Lockdown ({selectedChambers.size})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {chambers.map(ch => (
          <div 
            key={ch.id} 
            onClick={() => toggleChamber(ch.id)}
            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all select-none ${
              selectedChambers.has(ch.id) 
                ? 'bg-amber-950/80 border-amber-500 ring-2 ring-amber-500/50' 
                : ch.locked 
                  ? 'bg-red-950/60 border-red-700 text-red-300'
                  : ch.coherence < 95 
                    ? 'bg-red-950/60 border-red-500 text-red-400 animate-pulse' 
                    : 'bg-cyan-950/60 border-cyan-700 text-cyan-300 hover:bg-cyan-900/60'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-gray-400">{ch.id}</span>
              {selectedChambers.has(ch.id) && <span className="text-amber-400 font-bold">✓</span>}
              {ch.locked && <span className="text-red-400">🔒</span>}
            </div>
            <div className="font-bold text-xs mt-1 truncate text-white" title={ch.name}>{ch.name}</div>
            <div className="mt-1 flex items-baseline justify-between">
              <div className="font-mono text-xs font-semibold">{ch.coherence}%</div>
              <div className="text-[10px] opacity-75">{ch.status}</div>
            </div>
            <div className="mt-2 text-[9px] opacity-60 truncate font-mono">
              {ch.history[ch.history.length - 1]?.event}
            </div>
          </div>
        ))}
      </div>

      {show2FADialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🔐</span> Confirm Bulk Lockdown - 2FA Required
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Locking {selectedChambers.size} chambers: <span className="font-mono text-amber-400">{Array.from(selectedChambers).join(', ')}</span>
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShow2FADialog(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-red-950/80 border border-red-500/50 rounded-xl text-xs text-red-300">
                {errorMessage}
              </div>
            )}
            
            <div>
              <label className="text-xs text-slate-300 font-medium">Reason (Administrative Note)</label>
              <input 
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. SENTINEL_ANOMALY detected in CH-03, CH-11"
                className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-2.5 text-sm text-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium">Detailed Admin Notes</label>
              <textarea 
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="Explain lockdown justification, reference PDPA Sec 37, ETDA Sec 26..."
                rows={3}
                className="w-full mt-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-2.5 text-sm text-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium">2FA Code (6 digits)</label>
              <input 
                type="text"
                value={twoFactorCode}
                onChange={e => {
                  setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setErrorMessage(null);
                }}
                placeholder="123456"
                maxLength={6}
                className="w-full mt-1 bg-slate-950 border border-amber-500/50 focus:border-amber-400 rounded-xl p-2.5 text-sm text-amber-300 font-mono font-bold tracking-widest text-center outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="button"
                onClick={() => setShow2FADialog(false)} 
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={executeBulkLockdown} 
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-red-900/50"
              >
                🔒 Confirm Lockdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkLockdownHeatmap;
