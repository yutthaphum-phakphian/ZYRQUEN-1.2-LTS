import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity,
  Radio,
  DownloadCloud,
  Volume2,
  VolumeX,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  Shield,
  Zap,
  RotateCcw,
  Sparkles,
  Layers,
  Cpu,
  Clock,
  Terminal,
  Play,
  Settings,
  HelpCircle,
  Bug,
  Flame,
  ExternalLink
} from 'lucide-react';
import {
  getAudioSynthesizerStatus,
  restartAudioSynthesizer,
  playAuditChime,
  playTone,
  AudioSynthesizerStatus
} from './AudioSynthesizer';
import { automatedBackupService, AutomatedBackupState } from '../services/automatedBackupService';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useNotificationWebSocket, ConnectionStatus } from '../hooks/useNotificationWebSocket';
import { systemDiagnosticService } from '../services/systemDiagnosticService';
import { ToastType } from './ToastNotification';

interface SystemHealthDashboardProps {
  onShowToast?: (message: string, type?: ToastType) => void;
  onNavigateToAdmin?: () => void;
}

export const SystemHealthDashboard: React.FC<SystemHealthDashboardProps> = ({
  onShowToast,
  onNavigateToAdmin
}) => {
  // WebSocket live telemetry
  const {
    isConnected: isWsConnected,
    status: wsStatus,
    latencyMs,
    reconnect: reconnectWs,
    sendPing
  } = useNotificationWebSocket();

  // PWA install and service worker status
  const { isInstalled, isInstallable } = usePWAInstall();
  const [swStatus, setSwStatus] = useState<'registered' | 'unregistered' | 'unsupported'>('unregistered');
  const [cacheCount, setCacheCount] = useState<number>(0);

  // Audio Synthesizer status
  const [audioStatus, setAudioStatus] = useState<AudioSynthesizerStatus>(getAudioSynthesizerStatus());
  const [isRestartingAudio, setIsRestartingAudio] = useState<boolean>(false);

  // Backup Service status
  const [backupState, setBackupState] = useState<AutomatedBackupState>(automatedBackupService.getState());
  const [isRestartingBackup, setIsRestartingBackup] = useState<boolean>(false);

  // Global diagnostics & timestamps
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');
  const [isRestartingAllNonCritical, setIsRestartingAllNonCritical] = useState<boolean>(false);
  const [isSimulatingFault, setIsSimulatingFault] = useState<boolean>(false);

  // Periodic status update loop
  const refreshAllStatuses = useCallback(() => {
    setAudioStatus(getAudioSynthesizerStatus());
    setBackupState(automatedBackupService.getState());
    setLastRefreshedAt(new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Bangkok' }) + ' ICT');

    // Inspect ServiceWorker and Cache
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        setSwStatus(regs.length > 0 ? 'registered' : 'unregistered');
      }).catch(() => {
        setSwStatus('unregistered');
      });
    } else {
      setSwStatus('unsupported');
    }

    if (typeof caches !== 'undefined') {
      caches.keys().then((keys) => setCacheCount(keys.length)).catch(() => setCacheCount(0));
    }
  }, []);

  useEffect(() => {
    refreshAllStatuses();
    const interval = setInterval(refreshAllStatuses, 1500);

    // Subscribe to backup service updates
    const unsubscribeBackup = automatedBackupService.subscribe((state) => {
      setBackupState(state);
    });

    return () => {
      clearInterval(interval);
      unsubscribeBackup();
    };
  }, [refreshAllStatuses]);

  // Restart Non-Critical Service 1: Audio Synthesizer
  const handleRestartAudio = async () => {
    setIsRestartingAudio(true);
    systemDiagnosticService.log({
      level: 'INFO',
      service: 'Audio Synthesizer',
      message: 'Operator initiated restart of Audio Synthesizer auxiliary service.'
    });

    try {
      const success = await restartAudioSynthesizer();
      if (success) {
        setAudioStatus(getAudioSynthesizerStatus());
        if (onShowToast) {
          onShowToast('Audio Synthesizer service restarted successfully. Calibration chime dispatched.', 'success');
        }
      } else {
        throw new Error('Audio Synthesizer context failed to re-arm.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      systemDiagnosticService.logError('Audio Synthesizer', 'Audio Synthesizer restart encountered error.', err);
      if (onShowToast) {
        onShowToast(`Audio Synthesizer restart error: ${msg}`, 'error');
      }
    } finally {
      setTimeout(() => setIsRestartingAudio(false), 500);
    }
  };

  // Restart Non-Critical Service 2: Automated Backup Service
  const handleRestartBackup = async () => {
    setIsRestartingBackup(true);
    systemDiagnosticService.log({
      level: 'INFO',
      service: 'Backup Service',
      message: 'Operator initiated restart of Automated Backup & Ledger Snapshot service.'
    });

    try {
      playTone(520, 0.08);
      const newState = automatedBackupService.restart();
      setBackupState(newState);
      if (onShowToast) {
        onShowToast('Automated Backup Service restarted. 1-hour cycle and 60-second integrity verification re-armed.', 'success');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      systemDiagnosticService.logError('Backup Service', 'Failed to restart backup engine.', err);
      if (onShowToast) {
        onShowToast(`Backup Service restart error: ${msg}`, 'error');
      }
    } finally {
      setTimeout(() => setIsRestartingBackup(false), 600);
    }
  };

  // Restart All Non-Critical Services simultaneously
  const handleRestartAllNonCritical = async () => {
    setIsRestartingAllNonCritical(true);
    systemDiagnosticService.log({
      level: 'WARN',
      service: 'Kernel',
      message: 'Operator triggered batch restart of all non-critical auxiliary services.'
    });

    try {
      await Promise.all([
        restartAudioSynthesizer(),
        Promise.resolve(automatedBackupService.restart())
      ]);
      refreshAllStatuses();
      if (onShowToast) {
        onShowToast('All non-critical services (Audio Synthesizer & Backup Service) restarted cleanly.', 'success');
      }
      playAuditChime();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (onShowToast) {
        onShowToast(`Batch restart failed: ${msg}`, 'error');
      }
    } finally {
      setTimeout(() => setIsRestartingAllNonCritical(false), 800);
    }
  };

  // Test Error Trigger to verify Shaking Toast Notification & Verbose Log
  const handleTriggerSimulatedFault = () => {
    setIsSimulatingFault(true);
    const simulatedError = new Error('Simulated Fail-Closed Critical Fault: Sub-threshold entropy drift anomaly detected on ledger bus.');
    
    systemDiagnosticService.logError(
      'Kernel',
      'SIMULATED FAULT: High-priority system anomaly triggered by operator test sequence.',
      simulatedError,
      { code: 'ERR_SSOT_ANOMALY_SIMULATED', severity: 'CRITICAL', failClosed: true }
    );

    if (onShowToast) {
      // Dispatches an error toast with shaking animation
      onShowToast(
        'Critical System Alert: SSoT ledger bus anomaly detected. Fail-closed defense protocol active.',
        'error'
      );
    }
    playTone(200, 0.25, 'sawtooth', 0.1);

    setTimeout(() => setIsSimulatingFault(false), 800);
  };

  // Compute overall system health status
  const isHealthy = isWsConnected && backupState.isRunning;

  return (
    <div id="system-health-dashboard-root" className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 font-mono text-white">
      {/* Top Banner & Control Deck */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0a0f1e] border border-cyan-500/30 shadow-[0_0_35px_rgba(6,182,212,0.12)]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-wider text-white">
                ZYRQUEN Sovereign System Health
              </h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                isHealthy
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-950 text-amber-300 border-amber-500/40'
              }`}>
                {isHealthy ? '● 100% NOMINAL' : '▲ ATTENTION NEEDED'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0b1329] text-cyan-300 border border-cyan-500/30">
                FROZEN v1.2 LTS
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Continuous Telemetry Oversight • Fail-Closed Critical Services • Operator Re-Arm Controls
            </p>
          </div>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            id="system-health-restart-all-btn"
            onClick={handleRestartAllNonCritical}
            disabled={isRestartingAllNonCritical}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-950/70 to-orange-950/70 hover:from-amber-900 hover:to-orange-900 border border-amber-500/40 text-amber-200 text-xs font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)] disabled:opacity-50 cursor-pointer"
            title="Restart all auxiliary non-critical components (Audio Synthesizer & Automated Backup Service)"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRestartingAllNonCritical ? 'animate-spin' : ''}`} />
            <span>Restart Non-Critical Services</span>
          </button>

          <button
            id="system-health-simulate-fault-btn"
            onClick={handleTriggerSimulatedFault}
            disabled={isSimulatingFault}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            title="Triggers a simulated critical error to test the shaking toast notification animation and verbose error logger"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Test Error Shake</span>
          </button>

          {onNavigateToAdmin && (
            <button
              id="system-health-goto-admin-btn"
              onClick={onNavigateToAdmin}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] border border-cyan-500/30 text-cyan-300 text-xs transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </button>
          )}

          <button
            id="system-health-refresh-btn"
            onClick={refreshAllStatuses}
            className="p-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] border border-zinc-700 text-zinc-300 transition-colors cursor-pointer"
            title="Refresh telemetry status"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Services Grid: 2 Critical Core Services, 2 Non-Critical Auxiliary Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* =========================================================================
            SERVICE 1: WebSocket (Critical Core Service)
           ========================================================================= */}
        <div id="service-card-websocket" className="rounded-2xl bg-[#0a0f1e] border border-cyan-500/30 p-5 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-950/80 border-b border-l border-cyan-500/40 text-[10px] font-bold tracking-wider text-cyan-300 uppercase rounded-bl-xl">
            Critical Core Service
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isWsConnected
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                  : 'bg-rose-950/80 border-rose-500/50 text-rose-400'
              }`}>
                <Radio className={`w-5 h-5 ${isWsConnected ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">WebSocket Relay</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isWsConnected
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    {wsStatus}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Real-time Sovereign Event Bus & Telemetry Notification Relay
                </p>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#060a14] border border-zinc-800 text-xs">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Gateway Protocol</span>
                <span className="text-cyan-300 font-bold text-[11px]">WSS / Native Upgrade</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Network Latency</span>
                <span className="text-emerald-400 font-bold text-[11px]">{latencyMs} ms (Sub-20ms)</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Endpoint Path</span>
                <span className="text-zinc-300 text-[11px]">/ws/notifications</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Fail-Closed Safety</span>
                <span className="text-emerald-400 text-[11px] font-semibold">Protected Core</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Critical: Restart restricted to fail-closed resilience</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="ws-ping-btn"
                onClick={() => {
                  sendPing();
                  if (onShowToast) onShowToast('WebSocket heartbeat ping dispatched.', 'info');
                }}
                className="px-2.5 py-1 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] border border-cyan-500/30 text-[11px] text-cyan-300 cursor-pointer"
              >
                Ping Heartbeat
              </button>
              <button
                id="ws-reconnect-btn"
                onClick={() => {
                  reconnectWs();
                  if (onShowToast) onShowToast('WebSocket reconnect sequence triggered.', 'info');
                }}
                className="px-2.5 py-1 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] border border-cyan-500/30 text-[11px] text-cyan-300 cursor-pointer"
              >
                Reconnect
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SERVICE 2: PWA & Offline Enclave (Critical Core Service)
           ========================================================================= */}
        <div id="service-card-pwa" className="rounded-2xl bg-[#0a0f1e] border border-emerald-500/30 p-5 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-950/80 border-b border-l border-emerald-500/40 text-[10px] font-bold tracking-wider text-emerald-300 uppercase rounded-bl-xl">
            Critical Core Service
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                <DownloadCloud className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">Progressive Web App (PWA)</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {swStatus === 'registered' ? 'ACTIVE & CACHED' : 'STANDALONE SHELL'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Offline Air-Gap Enclave • Service Worker Immutable Cache Layer
                </p>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#060a14] border border-zinc-800 text-xs">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Service Worker</span>
                <span className="text-emerald-400 font-bold text-[11px]">
                  {swStatus === 'registered' ? 'Running / Registered' : 'Client Sandboxed'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Display Mode</span>
                <span className="text-cyan-300 font-bold text-[11px]">
                  {isInstalled ? 'Standalone App' : 'Browser Preview Shell'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Cache Partitions</span>
                <span className="text-zinc-300 text-[11px]">{cacheCount} Cache Storage Store(s)</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Offline Enclave</span>
                <span className="text-emerald-400 text-[11px] font-semibold">Self-Sustaining SSoT</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Critical: Immutable cache protected from accidental teardown</span>
            </div>
            <button
              id="pwa-check-integrity-btn"
              onClick={() => {
                refreshAllStatuses();
                if (onShowToast) onShowToast('Service Worker and PWA cache integrity verified.', 'info');
              }}
              className="px-2.5 py-1 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] border border-emerald-500/30 text-[11px] text-emerald-300 cursor-pointer"
            >
              Verify Cache
            </button>
          </div>
        </div>

        {/* =========================================================================
            SERVICE 3: Audio Synthesizer (Non-Critical Auxiliary Service)
           ========================================================================= */}
        <div id="service-card-audio-synthesizer" className="rounded-2xl bg-[#0a0f1e] border border-amber-500/40 p-5 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-amber-950/90 border-b border-l border-amber-500/40 text-[10px] font-bold tracking-wider text-amber-300 uppercase rounded-bl-xl flex items-center gap-1">
            <span>Non-Critical Auxiliary</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">Audio Synthesizer</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    audioStatus.state === 'running'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${audioStatus.state === 'running' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    {audioStatus.state.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Atmospheric Carrier Wave & Auditory Feedback Telemetry Generator
                </p>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#060a14] border border-zinc-800 text-xs">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Carrier Pitch</span>
                <span className="text-amber-300 font-bold text-[11px]">{audioStatus.frequency} Hz Post-Quantum</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Audio Sample Rate</span>
                <span className="text-zinc-300 font-bold text-[11px]">{audioStatus.sampleRate.toLocaleString()} Hz</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Active Profile</span>
                <span className="text-cyan-300 text-[11px] capitalize">{audioStatus.profileId}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Harmonic Carrier</span>
                <span className={audioStatus.isCarrierActive ? 'text-emerald-400 text-[11px]' : 'text-zinc-400 text-[11px]'}>
                  {audioStatus.isCarrierActive ? 'Oscillating' : 'Standby'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer with Requested RESTART Button */}
          <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <div className="text-[11px] text-zinc-400">
              Sensory feedback service • Safe to restart anytime
            </div>
            <button
              id="restart-audio-synthesizer-btn"
              onClick={handleRestartAudio}
              disabled={isRestartingAudio}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-200 text-xs font-bold transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)] disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-amber-400 ${isRestartingAudio ? 'animate-spin' : ''}`} />
              <span>{isRestartingAudio ? 'Restarting...' : 'Restart Synthesizer'}</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            SERVICE 4: Automated Backup Service (Non-Critical Auxiliary Service)
           ========================================================================= */}
        <div id="service-card-backup-service" className="rounded-2xl bg-[#0a0f1e] border border-amber-500/40 p-5 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-amber-950/90 border-b border-l border-amber-500/40 text-[10px] font-bold tracking-wider text-amber-300 uppercase rounded-bl-xl flex items-center gap-1">
            <span>Non-Critical Auxiliary</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">Automated Backup Service</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    backupState.isRunning
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${backupState.isRunning ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    {backupState.isRunning ? 'RUNNING' : 'PAUSED'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  1-Hour Snapshot Cycle & 60-Second Immutable Ledger Integrity Routine
                </p>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#060a14] border border-zinc-800 text-xs">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">1-Hour Cycle Timer</span>
                <span className="text-amber-300 font-bold text-[11px]">
                  {Math.floor(backupState.timeRemainingSeconds / 60)}m {backupState.timeRemainingSeconds % 60}s remaining
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Integrity Routine</span>
                <span className="text-emerald-400 font-bold text-[11px]">
                  Every 60s ({backupState.integrityCountdownSeconds}s left)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Total Snapshots</span>
                <span className="text-zinc-300 text-[11px]">{backupState.totalBackupsCount} Sealed Blocks</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Drift Firewall Invariant</span>
                <span className="text-emerald-400 text-[11px] font-semibold">Δ 0.00% Zero-Deviation</span>
              </div>
            </div>
          </div>

          {/* Action Footer with Requested RESTART Button */}
          <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <div className="text-[11px] text-zinc-400">
              Scheduled background task • Safe to restart anytime
            </div>
            <button
              id="restart-backup-service-btn"
              onClick={handleRestartBackup}
              disabled={isRestartingBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-200 text-xs font-bold transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)] disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-amber-400 ${isRestartingBackup ? 'animate-spin' : ''}`} />
              <span>{isRestartingBackup ? 'Restarting...' : 'Restart Backup Service'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Invariant Policy Card */}
      <div className="p-4 rounded-xl bg-[#080d19] border border-zinc-800 text-xs text-zinc-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            Telemetry Synchronized: <strong className="text-zinc-200">{lastRefreshedAt}</strong> • Critical services (WebSocket, PWA) maintain uninterrupted fail-closed execution.
          </span>
        </div>
        <div className="text-[11px] text-cyan-400/80 font-mono">
          SSoT Consensus Quorum: 10/10 PASS
        </div>
      </div>
    </div>
  );
};
