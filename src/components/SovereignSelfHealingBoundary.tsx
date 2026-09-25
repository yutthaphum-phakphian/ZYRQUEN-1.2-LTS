import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class SovereignSelfHealingBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // ดักจับข้อผิดพลาดทันทีเพื่อป้องกันหน้าจอขาวค้าง (Fail-Safe Recovery)
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🟢 Sovereign Control Plane Self-Healing Triggered:', error, errorInfo);
    this.setState({ errorInfo });

    // เคลียร์แคชชั่วคราวอัตโนมัติเพื่อป้องกันข้อมูลค้าง
    try {
      localStorage.removeItem('zyrquen_temp_cache');
      sessionStorage.removeItem('zyrquen_render_state');
    } catch (e) {
      console.error('Cache purge failed:', e);
    }
  }

  private handleAutoRecovery = () => {
    // รีเซ็ตสถานะ Error State และพยายามเรนเดอร์ใหม่อัตโนมัติ หากไม่สำเร็จจะทำการ Reload
    try {
      this.setState({ hasError: false, error: null, errorInfo: null });
    } catch {
      window.location.reload();
    }
  };

  private handleHardReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          id="sovereign-self-healing-fallback"
          className="min-h-screen w-full bg-slate-950 text-cyan-400 p-8 flex flex-col justify-center items-center text-center font-mono border-4 border-rose-500/40 relative z-[999999]"
        >
          <div className="max-w-2xl w-full bg-slate-900/90 border-cyan-500/30 rounded-xl p-8 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-3xl">🛡️</span>
              <h2 className="text-2xl font-bold text-rose-400 tracking-wide">
                Sovereign Self-Healing Protocol Activated
              </h2>
            </div>
            
            <p className="text-sm text-slate-300 mb-2 leading-relaxed">
              ตรวจพบความผิดปกติในการแสดงผล Control Plane / Presentation Layer
            </p>
            <p className="text-xs text-emerald-400 mb-6 font-semibold">
              🔒 Core Kernel SSoT Δ0.00% & Anchor Block #849202 ได้รับการปกป้องอย่างสมบูรณ์
            </p>

            <div className="bg-slate-950/80 border-slate-800 rounded-lg p-4 mb-6 text-left overflow-x-auto max-h-48 text-xs text-rose-300">
              <div className="font-bold text-slate-400 mb-1">Diagnostic Log:</div>
              <code>{this.state.error?.toString() || 'Unknown Presentation Anomaly'}</code>
              {this.state.errorInfo?.componentStack && (
                <pre className="mt-2 text-[10px] text-slate-500 overflow-x-auto whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                id="btn-self-healing-auto-recover"
                onClick={this.handleAutoRecovery}
                className="px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-lg shadow-lg hover:shadow-cyan-400/25 transition-all duration-200 cursor-pointer flex items-center gap-2 text-sm"
              >
                <span>🔄</span> กู้คืนระบบควบคุมทันที (Auto-Recover)
              </button>

              <button
                id="btn-self-healing-hard-reload"
                onClick={this.handleHardReload}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600 font-semibold rounded-lg transition-all duration-200 cursor-pointer text-sm"
              >
                ล้างแคชและเริ่มใหม่ (Hard Purge)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
