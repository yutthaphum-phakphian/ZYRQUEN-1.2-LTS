import React from 'react';
import { 
  Terminal, 
  X, 
  Activity, 
  Clock, 
  Cpu, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  RefreshCw 
} from 'lucide-react';
import { ApiLogRecord } from '../types';

interface DeveloperModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ApiLogRecord[];
  onClearLogs: () => void;
  onRetryLastRequest?: () => void;
}

export const DeveloperModeModal: React.FC<DeveloperModeModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
  onRetryLastRequest,
}) => {
  const [selectedLogId, setSelectedLogId] = React.useState<string | null>(
    logs[logs.length - 1]?.id || null
  );
  const [copied, setCopied] = React.useState(false);

  // Sync latest log
  React.useEffect(() => {
    if (logs.length > 0 && !selectedLogId) {
      setSelectedLogId(logs[logs.length - 1].id);
    }
  }, [logs]);

  if (!isOpen) return null;

  const currentLog = logs.find((l) => l.id === selectedLogId) || logs[logs.length - 1];

  const handleCopyJson = async (data: any) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Developer Mode & Telemetry</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                ตรวจสอบ API Status, Payload, Response Time, และ Error Logs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRetryLastRequest && logs.length > 0 && (
              <button
                onClick={onRetryLastRequest}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition cursor-pointer"
                title="ส่ง Request ล่าสุดอีกครั้ง"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Last</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-950/60 border-b border-slate-800 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              API Status
            </span>
            <div className="font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Healthy (200 OK)</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-violet-400" />
              Active Model
            </span>
            <div className="font-semibold text-slate-200 font-mono text-[11px] truncate">
              {currentLog?.model || 'models/gemini-3.8-flash'}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              Response Latency
            </span>
            <div className="font-semibold text-amber-300 font-mono">
              {currentLog ? `${currentLog.latencyMs} ms` : '0 ms'}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Database className="w-3 h-3 text-pink-400" />
              Logged Requests
            </span>
            <div className="font-semibold text-slate-200 flex items-center justify-between">
              <span>{logs.length} ครั้ง</span>
              {logs.length > 0 && (
                <button
                  onClick={onClearLogs}
                  className="text-[10px] text-rose-400 hover:text-rose-300 cursor-pointer"
                >
                  ล้าง Log
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col sm:flex-row min-h-0 overflow-hidden">
          {/* Logs List Sidebar */}
          <div className="w-full sm:w-60 border-r border-slate-800 bg-slate-950/40 p-2 overflow-y-auto space-y-1 shrink-0">
            <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Request History
            </div>
            {logs.length === 0 ? (
              <div className="text-xs text-slate-500 p-3 italic">
                ยังไม่มีบันทึก Request เมื่อสั่งงานด้วยเสียงหรือพิมพ์ ระบบจะบันทึก telemetry ที่นี่
              </div>
            ) : (
              logs.map((log) => {
                const isSelected = selectedLogId === log.id;
                return (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className={`w-full text-left p-2 rounded-lg text-xs font-mono transition cursor-pointer flex flex-col gap-0.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px]">{log.endpoint}</span>
                      <span
                        className={`px-1 py-0.2 rounded text-[9px] ${
                          log.status === 'success'
                            ? 'bg-emerald-950 text-emerald-300'
                            : 'bg-rose-950 text-rose-300'
                        }`}
                      >
                        {log.latencyMs}ms
                      </span>
                    </div>
                    <span className="text-[10px] opacity-75 truncate">{log.timestamp}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Log Detail Inspector */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-900/50">
            {currentLog ? (
              <>
                {/* Request Overview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">
                      Request Payload (Client → Server)
                    </span>
                    <button
                      onClick={() => handleCopyJson(currentLog.requestPayload)}
                      className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy JSON</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
                    {JSON.stringify(currentLog.requestPayload, null, 2)}
                  </pre>
                </div>

                {/* Response Overview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">
                      Response Payload (Gemini Model → Client)
                    </span>
                    <button
                      onClick={() => handleCopyJson(currentLog.responsePayload)}
                      className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy JSON</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-64 leading-relaxed">
                    {JSON.stringify(currentLog.responsePayload, null, 2)}
                  </pre>
                </div>

                {/* Error details if any */}
                {currentLog.errorDetails && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>ข้อผิดพลาด (Error Diagnostic)</span>
                    </div>
                    <div className="font-mono text-[11px]">{currentLog.errorDetails}</div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                เลือก Request จากแถบด้านซ้ายเพื่อดูรายละเอียด Payload
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
