import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackViewName?: string;
  onResetToHome?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Sovereign Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] bg-[#070a12] text-white flex items-center justify-center p-6 font-mono rounded-2xl border-amber-500/30">
          <div className="max-w-xl w-full p-8 rounded-2xl bg-[#0a0f1e] border-amber-500/40 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border-amber-500/50 flex items-center justify-center text-amber-400 text-3xl">
              🛡️
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-amber-300">
                ZYRQUEN Ω∞ RECOVERY CONSOLE
              </h1>
              <p className="text-xs text-zinc-400">
                {this.props.fallbackViewName 
                  ? `ตรวจพบข้อผิดพลาดชั่วคราวในมุมมอง [${this.props.fallbackViewName}] ระบบเปิดใช้งาน Safe Harbor Protection เพื่อป้องกันจอขาว`
                  : 'ตรวจพบข้อยกเว้นการแสดงผล ระบบเปิดใช้งาน Safe Harbor Protection เพื่อป้องกันจอขาว'}
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 rounded-xl bg-black/60 border-white/10 text-left text-xs text-rose-300 font-mono break-all max-h-40 overflow-y-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 flex-wrap">
              {this.props.onResetToHome && (
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                    this.props.onResetToHome?.();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/50 text-xs font-bold transition-all"
                >
                  🏠 กลับหน้าหลัก (Dashboard)
                </button>
              )}
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50 text-xs font-bold transition-all"
              >
                🔄 รีโหลดระบบ (Reload)
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  } catch (e) {
                    window.location.reload();
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10 text-xs transition-all"
              >
                🧹 ล้างแคช (Reset)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
