import React, { useState } from 'react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { safeCopyToClipboard } from '../utils/clipboard';
import { CANONICAL_MERKLE_ROOT, SYSTEM_METADATA } from '../data/canonicalData';
import { useTerminalJobLifecycle } from '../hooks/useTerminalJobLifecycle';

export const SiemWebhookCenter: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState('https://siem-soc.ncsa.or.th/api/v1/sovereign-alert');
  const [selectedEventType, setSelectedEventType] = useState<'CIRCUIT_BREAKER' | 'PDPA_BREACH_SUSPECT' | 'NCSA_CII_CRITICAL' | 'REAL_HSM_QUORUM_DRIFT'>('CIRCUIT_BREAKER');
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const { executeJob, isLocked, isTerminal } = useTerminalJobLifecycle();
  const [currentIdempotencyKey, setCurrentIdempotencyKey] = useState<string>(() => `IDEMP-SIEM-${Date.now()}`);

  const [dispatchedLogs, setDispatchedLogs] = useState<Array<{
    id: string;
    time: string;
    type: string;
    payloadHash: string;
    status: string;
    latency: string;
    terminalLocked: boolean;
  }>>([
    {
      id: 'DISP-849202-01',
      time: '12:00:00 ICT',
      type: 'TRNG_RESEED_AUTHORIZED_PASS',
      payloadHash: '0x909ab814479844d8a148...',
      status: '200 OK (COMPLETED / TERMINAL LOCKED)',
      latency: '1.4ms',
      terminalLocked: true,
    },
  ]);

  const isCurrentJobTerminal = isTerminal(currentIdempotencyKey);
  const isCurrentlyInFlight = isLocked(currentIdempotencyKey);

  const handleTestDispatch = async () => {
    if (isCurrentJobTerminal) {
      setDispatchStatus('⚠️ งานนี้เสร็จสิ้นอย่างสมบูรณ์แล้ว (COMPLETED / TERMINAL) ไม่อนุญาตให้ยิงซ้ำ');
      playTone(400, 0.05);
      return;
    }

    if (isCurrentlyInFlight) {
      setDispatchStatus('⚠️ งานกำลังประมวลผลอยู่ (IN_FLIGHT_LOCKED) ป้องกันการส่งคำขอซ้ำซ้อน');
      return;
    }

    playTone(750, 0.06);
    setDispatchStatus('กำลังส่งสัญญาณแจ้งเตือนรหัสลับและล็อกสถานะ Terminal State Machine...');

    const payload = {
      event: selectedEventType,
      webhookUrl,
      canonicalBlock: SYSTEM_METADATA.sealedBlock,
      merkleRoot: CANONICAL_MERKLE_ROOT,
      timestamp: new Date().toISOString(),
    };

    const res = await executeJob(
      {
        jobType: 'SIEM_WEBHOOK_SEND',
        idempotencyKey: currentIdempotencyKey,
        payload,
        actor: 'SIEM_SOC_DISPATCHER',
      },
      async (job) => {
        // Simulated network delay
        await new Promise((resolve) => setTimeout(resolve, 350));
        return {
          statusCode: 200,
          delivered: true,
          jobId: job.jobId,
          notarized: true,
        };
      }
    );

    if (res.success) {
      const newLog = {
        id: res.job.jobId,
        time: new Date().toLocaleTimeString('th-TH') + ' ICT',
        type: selectedEventType,
        payloadHash: res.job.payloadHash.slice(0, 24) + '...',
        status: '200 OK (COMPLETED / TERMINAL LOCKED)',
        latency: (Math.random() * 1.5 + 0.5).toFixed(1) + 'ms',
        terminalLocked: true,
      };
      setDispatchedLogs((prev) => [newLog, ...prev.slice(0, 7)]);
      setDispatchStatus('✅ ส่งสัญญาณสำเร็จและเข้าสู่สถานะ TERMINAL: COMPLETED (ป้องกันการส่งซ้ำเด็ดขาด)');
      playAuditChime();
    } else {
      setDispatchStatus(`❌ การส่งถูกระงับ: ${res.error || 'Failed'}`);
    }
  };

  const handleCreateNewBatch = () => {
    const nextKey = `IDEMP-SIEM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setCurrentIdempotencyKey(nextKey);
    setDispatchStatus(null);
    playTone(550, 0.03);
  };

  return (
    <div className="p-6 rounded-[24px] bg-[#070a12] border border-cyan-500/30 font-mono space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-xl">
            📡
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>ระบบส่งสัญญาณแจ้งเตือนศูนย์ความมั่นคงปลอดภัยไซเบอร์ (SIEM / SOC Dispatcher)</span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                TERMINAL STATE MACHINE
              </span>
            </h4>
            <p className="text-xs text-zinc-400">
              ส่งสัญญาณเตือนภัยไซเบอร์ระดับชาติ ล็อกสถานะส่งเสร็จสิ้น COMPLETED ห้ามยิงซ้ำ (Zero Duplicate Invariant)
            </p>
          </div>
        </div>

        {/* Terminal Guard Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
            isCurrentJobTerminal
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
              : isCurrentlyInFlight
              ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
              : 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
          }`}>
            {isCurrentJobTerminal ? '🔒 TERMINAL: COMPLETED (LOCKED)' : isCurrentlyInFlight ? '⏳ SENDING (LOCKED)' : '🟢 READY FOR INTAKE'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="space-y-2">
          <label className="text-zinc-400 block font-bold">🎯 ปลายทาง Webhook Endpoint (SIEM / SOC / CERT):</label>
          <input
            type="text"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            disabled={isCurrentJobTerminal || isCurrentlyInFlight}
            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-zinc-200 text-xs focus:border-cyan-500/60 focus:outline-none disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-zinc-400 block font-bold">⚡ ประเภทเหตุการณ์ (Incident Type):</label>
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value as any)}
            disabled={isCurrentJobTerminal || isCurrentlyInFlight}
            className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-zinc-200 text-xs focus:border-cyan-500/60 focus:outline-none disabled:opacity-50"
          >
            <option value="CIRCUIT_BREAKER">🛡️ CH-06 Circuit Breaker Trip (&gt; 15,000 KBps)</option>
            <option value="PDPA_BREACH_SUSPECT">⚖️ PDPA Data Breach Suspect Alert (72-hr Clock)</option>
            <option value="NCSA_CII_CRITICAL">🚨 NCSA Critical Infrastructure Threat (Level 2/3)</option>
            <option value="REAL_HSM_QUORUM_DRIFT">🧊 Hardware HSM Quorum Drift Warning</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={handleTestDispatch}
            disabled={isCurrentJobTerminal || isCurrentlyInFlight}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              isCurrentJobTerminal
                ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                : isCurrentlyInFlight
                ? 'bg-amber-950 text-amber-300 border border-amber-600 animate-pulse cursor-wait'
                : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
            }`}
          >
            <span>{isCurrentJobTerminal ? '🔒' : '🚀'}</span>
            <span>
              {isCurrentJobTerminal
                ? 'งานนี้ถูกส่งเรียบร้อยแล้ว (Terminal Locked)'
                : isCurrentlyInFlight
                ? 'กำลังส่งและล็อกระบบ...'
                : 'ยิงสัญญาณทดสอบ (Dispatch Cryptographic Alert)'}
            </span>
          </button>

          {isCurrentJobTerminal && (
            <button
              onClick={handleCreateNewBatch}
              className="px-3 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-950/60 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span>✨</span>
              <span>สร้าง Dispatch Batch ใหม่ (New Idempotency Key)</span>
            </button>
          )}
        </div>

        <span className="text-[10px] text-zinc-400">
          Idempotency: <span className="text-cyan-400 font-mono">{currentIdempotencyKey.slice(0, 20)}...</span>
        </span>
      </div>

      {dispatchStatus && (
        <div className={`p-3 rounded-xl border text-xs animate-in fade-in ${
          isCurrentJobTerminal ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-black/50 border-cyan-500/30 text-cyan-200'
        }`}>
          {dispatchStatus}
        </div>
      )}

      <div className="space-y-2 pt-2">
        <div className="text-[11px] font-bold text-zinc-400">
          📋 บันทึกประวัติการส่งสัญญาณแจ้งเตือน (Dispatch Audit Trail & Terminal Ledger):
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {dispatchedLogs.map((log) => (
            <div
              key={log.id}
              className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-[11px] text-zinc-300"
            >
              <div className="flex items-center gap-2 font-mono">
                <span className="text-cyan-300 font-bold">{log.id}</span>
                <span className="text-zinc-400">[{log.time}]</span>
                <span className="text-amber-300 font-semibold">{log.type}</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[10px]">
                <span className="text-emerald-400 font-bold">{log.status}</span>
                <span className="text-cyan-400">{log.latency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
