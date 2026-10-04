import React, { useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, Clock3, RefreshCw, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react';

type RunStatus = 'BLOCKED'|'APPROVAL_REQUIRED'|'READY'|'APPROVED'|'CANCELLED'|'COMPLETED'|'FAILED';
type ExecutionStatus = 'RUNNING'|'COMPLETED'|'BLOCKED'|'FAILED';
interface AgentRunMonitorProps { initialRunId?: string; className?: string; }

const badge = (status: string) => {
  if (status === 'COMPLETED') return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30';
  if (status === 'FAILED' || status === 'BLOCKED') return 'text-rose-300 bg-rose-500/10 border-rose-500/30';
  if (status === 'APPROVAL_REQUIRED') return 'text-amber-300 bg-amber-500/10 border-amber-500/30';
  return 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30';
};

export const AgentRunMonitor: React.FC<AgentRunMonitorProps> = ({ initialRunId = '', className = '' }) => {
  const [runId, setRunId] = useState(initialRunId || new URLSearchParams(window.location.search).get('agentRunId') || '');
  const [run, setRun] = useState<any>(null);
  const [execution, setExecution] = useState<any>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async (id = runId) => {
    const clean = id.trim();
    if (!clean) return;
    setBusy(true); setError('');
    try {
      const [runResponse, executionResponse] = await Promise.all([
        fetch(`/api/runtime/agent/run/${encodeURIComponent(clean)}`),
        fetch(`/api/runtime/agent/run/${encodeURIComponent(clean)}/execution`),
      ]);
      if (!runResponse.ok) throw new Error((await runResponse.json()).error || 'AGENT_RUN_NOT_FOUND');
      setRun(await runResponse.json());
      setExecution(executionResponse.ok ? await executionResponse.json() : null);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    if (!runId) return;
    void load(runId);
    const timer = window.setInterval(() => void load(runId), 1500);
    return () => window.clearInterval(timer);
  }, [runId]);

  const steps = execution?.steps || [];
  const progress = useMemo(() => {
    const total = run?.plan?.steps?.length || 0;
    const done = steps.filter((s: any) => s.status === 'COMPLETED').length;
    return total ? Math.round((done / total) * 100) : 0;
  }, [run, steps]);

  return <section className={`rounded-2xl border border-stone-800 bg-stone-900/80 p-4 space-y-4 ${className}`}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2"><Activity className="w-5 h-5 text-cyan-400" /><div><h3 className="font-bold">Durable Agent Run Monitor</h3><p className="text-[11px] text-stone-500">สถานะและ evidence จาก runtime จริง</p></div></div>
      <button onClick={() => void load()} disabled={busy || !runId} className="px-3 py-1.5 rounded-lg border border-stone-700 bg-stone-800 text-xs hover:bg-stone-700 disabled:opacity-40"><RefreshCw className={`w-3.5 h-3.5 inline mr-1 ${busy ? 'animate-spin' : ''}`} />รีเฟรช</button>
    </div>
    <div className="flex gap-2">
      <input value={runId} onChange={e => setRunId(e.target.value)} placeholder="ใส่ Agent Run ID" className="flex-1 min-w-0 rounded-lg bg-stone-950 border border-stone-700 px-3 py-2 text-xs outline-none focus:border-cyan-500" />
      <button onClick={() => void load()} className="px-3 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs">โหลด</button>
    </div>
    {error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300"><XCircle className="w-4 h-4 inline mr-1" />{error}</div>}
    {run && <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
        <div className="rounded-lg bg-stone-950 p-3"><div className="text-stone-500">Run</div><div className="font-mono truncate mt-1">{run.runId}</div></div>
        <div className="rounded-lg bg-stone-950 p-3"><div className="text-stone-500">สถานะ</div><span className={`inline-block mt-1 px-2 py-0.5 rounded border ${badge(run.status)}`}>{run.status}</span></div>
        <div className="rounded-lg bg-stone-950 p-3"><div className="text-stone-500">Admission</div><div className="mt-1">{run.admission?.status || '—'}</div></div>
        <div className="rounded-lg bg-stone-950 p-3"><div className="text-stone-500">Execution</div><div className="mt-1">{execution?.status || 'WAITING'}</div></div>
      </div>
      <div className="h-2 rounded-full bg-stone-800 overflow-hidden"><div className="h-full bg-cyan-500 transition-all" style={{ width: `${progress}%` }} /></div>
      <div className="space-y-2">
        {(run.plan?.steps || []).map((step: any, index: number) => {
          const result = steps.find((s: any) => s.stepId === step.stepId);
          return <div key={step.stepId} className="rounded-xl border border-stone-800 bg-stone-950/70 p-3">
            <div className="flex items-center gap-2"><span className="text-stone-600 text-xs">{index + 1}</span>{result?.status === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : result?.status === 'FAILED' ? <XCircle className="w-4 h-4 text-rose-400" /> : <Clock3 className="w-4 h-4 text-stone-500" />}<span className="font-medium text-sm">{step.capability}</span><span className={`ml-auto px-2 py-0.5 rounded border text-[10px] ${badge(result?.status || 'PENDING')}`}>{result?.status || 'PENDING'}</span></div>
            {result && <details className="mt-2"><summary className="cursor-pointer text-[11px] text-cyan-300">ดู evidence</summary><pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-black/40 p-2 text-[10px] text-stone-400">{JSON.stringify(result.evidence, null, 2)}</pre><div className="mt-2 font-mono text-[9px] text-stone-600">audit: {result.auditHash}</div></details>}
          </div>;
        })}
      </div>
      <div className="flex flex-wrap gap-2 text-[10px] text-stone-500"><ShieldCheck className="w-3.5 h-3.5" />Policy/Admission ถูกบันทึกกับ Run <span>•</span><ShieldAlert className="w-3.5 h-3.5" />Evidence มาจาก durable execution record</div>
    </>}
  </section>;
};
