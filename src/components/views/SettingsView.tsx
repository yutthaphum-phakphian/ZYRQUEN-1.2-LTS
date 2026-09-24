import { FirmwareLifecycleManager } from "../FirmwareLifecycleManager";
import { GlobalRedTeamChallenge } from '../GlobalRedTeamChallenge';
import { SovereignMasterForensicReportCard } from '../SovereignMasterForensicReportCard';
import { SovereignSelfAuditEngine } from '../audit/SovereignSelfAuditEngine';
import { DataPersistenceSettingsTab } from '../settings/DataPersistenceSettingsTab';
import { AuditChimeSettingsCard } from '../settings/AuditChimeSettingsCard';
import { offlineAuditSyncService } from '../../services/offlineAuditSyncService';
import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Key,
  Volume2,
  VolumeX,
  Globe,
  Shield,
  Award,
  Check,
  Scale,
  Search,
  ExternalLink,
  Radio,
  Sliders,
  Sparkles,
  Waves,
  Zap,
  Battery,
  BatteryCharging,
  BatteryWarning,
  Thermometer,
  Bell,
  AlertTriangle,
  RefreshCw,
  Contrast,
  Terminal,
  Eye,
  Lock,
  GitCommit,
  ShieldCheck,
  HardDrive,
  Database,
  Filter,
} from 'lucide-react';
import { THAI_CUSTODIANS, SYSTEM_METADATA } from '../../data/canonicalData';
import { ThaiLegalSovereignMapping } from '../ThaiLegalSovereignMapping';
import { CustodianQuorumRegistry } from '../CustodianQuorumRegistry';
import { EvidenceDetailModal } from '../EvidenceDetailModal';
import { SystemAuditReport } from '../SystemAuditReport';
import { PhysicalAttestation } from '../PhysicalAttestation';
import { CustodianEvidenceRecord } from '../../utils/custodianQuorumEngine';
import {
  playAuditChime,
  playTone,
  AUDIO_PROFILES,
  AudioProfileId,
  setAmbientSoundProfile,
  getActiveProfileId,
  setMasterVolume,
  getMasterVolume,
} from '../AudioSynthesizer';
import {
  getTTSConfig,
  updateTTSConfig,
  speakSystemAlert,
  toggleTTSEnabled,
  subscribeTTSConfig,
  TTSConfig,
} from '../../utils/textToSpeechService';

import { SystemEvent } from '../SystemEventsSidebar';

interface SettingsViewProps {
  onCaptureSnapshot?: () => void;
  isAudioActive: boolean;
  onToggleAudio: () => void;
  isMonochrome?: boolean;
  onToggleMonochrome?: (enabled: boolean) => void;
  onOpenLegalSearch?: () => void;
  onTriggerLoginLoader?: (mode?: 'login' | 'register' | 'switch_tenant') => void;
  onNotifyEvent?: (title: string, desc: string, type: 'HARDWARE' | 'CRYPTO' | 'LEGAL_SEARCH' | 'AUDIO') => void;
  onAddSystemEvent?: (
    type: SystemEvent['type'],
    title: string,
    description: string,
    metaHash?: string,
    severity?: SystemEvent['severity'],
    statuteRef?: string,
    targetView?: SystemEvent['targetView']
  ) => void;
}


import { fetchLatestCommit, GitHubCommitInfo } from '../../services/githubService';

export const GitHubDeploymentWidget: React.FC = () => {
  const [commitInfo, setCommitInfo] = React.useState<GitHubCommitInfo | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  const loadCommitData = async () => {
    setLoading(true);
    const data = await fetchLatestCommit();
    setCommitInfo(data);
    setLoading(false);
  };

  React.useEffect(() => {
    loadCommitData();
  }, []);

  return (
    <div className="mt-8 p-6 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-emerald-400">System Deployment State</h2>
          <p className="text-xs text-slate-400 font-mono">ZYRQUEN Ω∞ LOCKED_FROZEN_v1.2_LTS</p>
        </div>
        <button
          onClick={loadCommitData}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 transition text-slate-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800/80">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-mono uppercase mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Genesis Verification</span>
          </div>
          <p className="text-sm font-semibold text-slate-200">Block #849202</p>
          <p className="text-xs text-slate-400 font-mono truncate mt-1">Root: 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68</p>
          <span className="inline-block mt-3 px-2 py-0.5 text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
            14,902 Seals Verified (Δ0.00%)
          </span>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase mb-2">
            <div className="flex items-center space-x-2">
              <GitCommit className="w-4 h-4 text-cyan-400" />
              <span>Deployment Version</span>
            </div>
            {commitInfo && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${commitInfo.status === 'LIVE' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                {commitInfo.status}
              </span>
            )}
          </div>
          {loading ? (
            <div className="text-xs font-mono text-slate-500 animate-pulse">Querying GitHub API...</div>
          ) : commitInfo ? (
            <div className="space-y-1 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Commit Hash:</span>
                <a
                  href={commitInfo.commitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center space-x-1"
                >
                  <span>{commitInfo.shortHash}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-slate-300 truncate mt-1" title={commitInfo.message}>"{commitInfo.message}"</p>
              <p className="text-[11px] text-slate-500">{new Date(commitInfo.date).toLocaleString()}</p>
            </div>
          ) : (
            <div className="text-xs text-rose-400 font-mono">Failed to resolve version state.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export type SettingsTabId =
  | 'DATA_PERSISTENCE'
  | 'GENERAL'
  | 'AUDIT_REDTEAM'
  | 'ACOUSTICS'
  | 'HARDWARE'
  | 'ALL';

export const SettingsView: React.FC<SettingsViewProps> = ({
  onCaptureSnapshot,
  isAudioActive,
  onToggleAudio,
  isMonochrome = false,
  onToggleMonochrome,
  onOpenLegalSearch,
  onTriggerLoginLoader,
  onNotifyEvent,
  onAddSystemEvent,
}) => {
  const [lang, setLang] = useState<'th' | 'en'>('th');
  const [soundFeedback, setSoundFeedback] = useState(true);
  const [activeProfile, setActiveProfile] = useState<AudioProfileId>(getActiveProfileId());
  const [volumeLevel, setVolumeLevel] = useState<number>(Math.round(getMasterVolume() * 1000));
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTabId>(() => {
    try {
      const saved = localStorage.getItem('zyrquen_active_settings_tab');
      return (saved as SettingsTabId) || 'DATA_PERSISTENCE';
    } catch {
      return 'DATA_PERSISTENCE';
    }
  });

  const handleTabSelect = (tab: SettingsTabId) => {
    setActiveSettingsTab(tab);
    playTone(650, 0.03);
    try {
      localStorage.setItem('zyrquen_active_settings_tab', tab);
    } catch {
      // ignore
    }
  };

  // Quantum Cooling Unit Battery & Thermal Threshold Alert States
  const [batteryAlertEnabled, setBatteryAlertEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('zyrquen_cryo_battery_alert');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [batteryThresholdPct, setBatteryThresholdPct] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('zyrquen_cryo_battery_threshold');
      return saved !== null ? Number(saved) : 25;
    } catch {
      return 25;
    }
  });

  const [simulatedBattery, setSimulatedBattery] = useState<number>(78);
  const [simulatedCryoTemp, setSimulatedCryoTemp] = useState<number>(14.2);
  const [lastAlertSent, setLastAlertSent] = useState<number>(0);

  // Text-to-Speech (TTS) Sovereign Verbal Audio Warnings Configuration
  const [ttsConfig, setTtsConfig] = useState<TTSConfig>(() => getTTSConfig());

  // Offline Audit Log Synchronization State
  const [syncPendingCount, setSyncPendingCount] = useState<number>(() => offlineAuditSyncService.getQueueCount());
  const [isForceSyncing, setIsForceSyncing] = useState<boolean>(false);
  const [syncFeedbackMessage, setSyncFeedbackMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Audit Logs Status Filter State (PASS, ACTIVE_GUARD, VERIFIED, ALL)
  const [auditStatusFilter, setAuditStatusFilter] = useState<'ALL' | 'PASS' | 'ACTIVE_GUARD' | 'VERIFIED'>(() => {
    try {
      const saved = localStorage.getItem('zyrquen_audit_status_filter');
      return (saved as 'ALL' | 'PASS' | 'ACTIVE_GUARD' | 'VERIFIED') || 'ALL';
    } catch {
      return 'ALL';
    }
  });

  const handleAuditStatusFilterChange = (filter: 'ALL' | 'PASS' | 'ACTIVE_GUARD' | 'VERIFIED') => {
    setAuditStatusFilter(filter);
    playTone(600, 0.03);
    try {
      localStorage.setItem('zyrquen_audit_status_filter', filter);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const unsub = subscribeTTSConfig((cfg) => {
      setTtsConfig(cfg);
    });
    const unsubSync = offlineAuditSyncService.subscribe((count) => {
      setSyncPendingCount(count);
    });
    return () => {
      unsub();
      unsubSync();
    };
  }, []);

  const handleForceSync = async () => {
    if (isForceSyncing) return;
    setIsForceSyncing(true);
    setSyncFeedbackMessage(null);
    playTone(720, 0.05);

    try {
      const res = await offlineAuditSyncService.forceSync();
      if (res.success) {
        playAuditChime();
        const msg = res.flushedCount > 0
          ? `Force Sync: Flushed ${res.flushedCount} pending audit log${res.flushedCount > 1 ? 's' : ''} to primary ledger.`
          : (res.message || 'Force Sync: Primary ledger verified in sync.');
        setSyncFeedbackMessage({ text: msg, isError: false });

        if (onNotifyEvent) {
          onNotifyEvent(
            'Manual Audit Sync Completed',
            msg,
            'CRYPTO'
          );
        }
        if (onAddSystemEvent) {
          onAddSystemEvent(
            'COMPLIANCE',
            'Manual Force Sync Succeeded',
            msg,
            '0x909ab814',
            'success',
            'Thai ETDA Sec 26 / SSoT Merkle'
          );
        }
      } else {
        playTone(400, 0.1);
        const errMsg = `Force Sync failed: ${res.error || 'Ledger unreachable'}`;
        setSyncFeedbackMessage({ text: errMsg, isError: true });
        if (onNotifyEvent) {
          onNotifyEvent('Manual Audit Sync Failed', errMsg, 'HARDWARE');
        }
      }
    } catch (err: any) {
      playTone(400, 0.1);
      const errMsg = `Force Sync error: ${err.message || 'Internal failure'}`;
      setSyncFeedbackMessage({ text: errMsg, isError: true });
    } finally {
      setIsForceSyncing(false);
      setTimeout(() => setSyncFeedbackMessage(null), 6000);
    }
  };

  // Evidence Detail Modal State (Strict Read-Only Enforcement)
  const [selectedEvidence, setSelectedEvidence] = useState<CustodianEvidenceRecord | null>(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState<boolean>(false);

  const handleSelectEvidence = (slot: CustodianEvidenceRecord) => {
    if (slot.classification === 'REAL_HSM_SIGNED') {
      setSelectedEvidence(slot);
      setIsEvidenceModalOpen(true);
      playTone(600, 0.04, 'sine', 0.05);
    }
  };

  const handleCloseEvidenceModal = () => {
    setIsEvidenceModalOpen(false);
    setSelectedEvidence(null);
  };

  const handleToggleBatteryAlert = () => {
    const nextVal = !batteryAlertEnabled;
    setBatteryAlertEnabled(nextVal);
    playTone(nextVal ? 650 : 450, 0.05);
    try {
      localStorage.setItem('zyrquen_cryo_battery_alert', JSON.stringify(nextVal));
    } catch {
      // ignore
    }

    if (onNotifyEvent) {
      onNotifyEvent(
        `Cryo-Cooler Battery Alert ${nextVal ? 'Activated' : 'Silenced'}`,
        nextVal
          ? `Automated sidebar alert armed for battery level < ${batteryThresholdPct}%.`
          : 'Persistent battery alerts disabled in settings.',
        'HARDWARE'
      );
    }
  };

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setBatteryThresholdPct(val);
    try {
      localStorage.setItem('zyrquen_cryo_battery_threshold', String(val));
    } catch {
      // ignore
    }
  };

  const triggerSimulatedLowBattery = () => {
    setSimulatedBattery(18);
    setSimulatedCryoTemp(22.8);
    playTone(380, 0.12);
    setTimeout(() => playTone(300, 0.15), 150);

    if (onNotifyEvent && batteryAlertEnabled) {
      onNotifyEvent(
        'CRITICAL: Cryo-Cooler Battery Low (18%)',
        `Simulated quantum cooling unit backup battery fell to 18% (below user threshold of ${batteryThresholdPct}%). Dilution refrigeration compressor on auxiliary power.`,
        'HARDWARE'
      );
    }
  };

  const restoreBatteryToNominal = () => {
    setSimulatedBattery(92);
    setSimulatedCryoTemp(14.2);
    playAuditChime();

    if (onNotifyEvent) {
      onNotifyEvent(
        'Cryo-Cooler Power Restored (92%)',
        'Auxiliary battery recharged to nominal state. Sub-kelvin thermal loop operating at 14.2 mK.',
        'HARDWARE'
      );
    }
  };

  const handleSelectProfile = (profileId: AudioProfileId) => {
    setActiveProfile(profileId);
    setAmbientSoundProfile(profileId, isAudioActive);
    playTone(600, 0.05);
    const prof = AUDIO_PROFILES.find((p) => p.id === profileId);
    if (onNotifyEvent && prof) {
      onNotifyEvent(
        `Ambient Profile: ${prof.name}`,
        `Switched acoustic carrier to ${prof.subtitle} (${prof.baseFreq} Hz)`,
        'AUDIO'
      );
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolumeLevel(val);
    setMasterVolume(val / 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#181820]/90 via-[#0b0e1a]/80 to-[#07080F] border border-white/8 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-500/10 text-zinc-300 border border-zinc-500/20 text-xs font-mono">
              THAI CUSTODIANS REGISTRY
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono">
              SOVEREIGN CITIZENSHIP
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-mono font-bold text-white mt-1">
            System Configuration & Thai Custodian Passports
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Sovereign Executive Identity • Cryptographic Passport Anchors • Language & Acoustic Controls
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onCaptureSnapshot && (
            <button
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(50);
                playTone(660, 0.05);
                onCaptureSnapshot();
              }}
              className="px-3.5 py-1.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-mono text-white transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>📸</span>
              <span>Capture Snapshot</span>
            </button>
          )}

          {onOpenLegalSearch && (
            <button
              onClick={() => {
                playTone(620, 0.06);
                onOpenLegalSearch();
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-mono text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Query Thai Laws & PQC</span>
            </button>
          )}

          {/* Manual Force Sync Button */}
          <button
            id="btn-settings-force-sync"
            onClick={handleForceSync}
            disabled={isForceSyncing}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border font-mono text-xs transition-all cursor-pointer ${
              syncPendingCount > 0
                ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/50 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'bg-white/10 hover:bg-white/15 border-white/15 text-zinc-200 hover:text-white'
            } disabled:opacity-50`}
            title="Manually trigger offlineAuditSyncService to flush pending audit logs to the primary ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isForceSyncing ? 'animate-spin text-cyan-400' : 'text-cyan-400'}`} />
            <span className="font-semibold">Force Sync</span>
            {syncPendingCount > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 text-[10px] font-bold border border-amber-500/50 animate-pulse">
                {syncPendingCount} pending
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                Synced
              </span>
            )}
          </button>

          {/* Audit Logs Status Filtering Dropdown (PASS, ACTIVE_GUARD, VERIFIED) */}
          <div
            id="container-audit-status-filter"
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/50 border border-white/10 font-mono text-xs shadow-sm"
          >
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-zinc-400 text-[11px] font-bold hidden md:inline">Audit Filter:</span>
            <select
              id="select-audit-status-filter"
              value={auditStatusFilter}
              onChange={(e) => handleAuditStatusFilterChange(e.target.value as any)}
              className="bg-transparent text-cyan-300 font-bold text-xs focus:outline-none cursor-pointer pr-1"
              title="Filter audit logs and forensic modules by status (PASS, ACTIVE_GUARD, VERIFIED)"
            >
              <option value="ALL" className="bg-slate-900 text-white">ALL STATUSES (ทั้งหมด)</option>
              <option value="PASS" className="bg-slate-900 text-cyan-300">🔵 PASS (ผ่านการตรวจสอบ)</option>
              <option value="ACTIVE_GUARD" className="bg-slate-900 text-amber-300">🟡 ACTIVE_GUARD (เฝ้าระวัง)</option>
              <option value="VERIFIED" className="bg-slate-900 text-emerald-300">🟢 VERIFIED (รับรองความถูกต้อง)</option>
            </select>
            {auditStatusFilter !== 'ALL' && (
              <button
                onClick={() => handleAuditStatusFilterChange('ALL')}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1 hover:underline cursor-pointer"
                title="Clear filter"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center p-1 bg-black/40 rounded-2xl border border-white/8 text-xs font-mono">
            <button
              onClick={() => {
                playTone(550, 0.04);
                setLang('th');
              }}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                lang === 'th' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-zinc-400'
              }`}
            >
              🇹🇭 ภาษาไทย
            </button>
            <button
              onClick={() => {
                playTone(600, 0.04);
                setLang('en');
              }}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                lang === 'en' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-zinc-400'
              }`}
            >
              EN English
            </button>
          </div>
        </div>
      </div>

      {/* Force Sync Feedback Banner */}
      {syncFeedbackMessage && (
        <div
          id="banner-force-sync-feedback"
          className={`flex items-center justify-between p-3.5 rounded-2xl border font-mono text-xs animate-in fade-in slide-in-from-top-1 duration-200 ${
            syncFeedbackMessage.isError
              ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <RefreshCw className={`w-4 h-4 ${isForceSyncing ? 'animate-spin text-cyan-400' : syncFeedbackMessage.isError ? 'text-rose-400' : 'text-emerald-400'}`} />
            <span className="font-semibold">{syncFeedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setSyncFeedbackMessage(null)}
            className="text-zinc-400 hover:text-white px-2 py-0.5 rounded cursor-pointer font-bold"
            title="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sovereign Settings Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-[#0b0e1a]/85 border border-white/10 backdrop-blur-xl font-mono text-xs shadow-lg">
        <button
          onClick={() => handleTabSelect('DATA_PERSISTENCE')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all font-bold cursor-pointer ${
            activeSettingsTab === 'DATA_PERSISTENCE'
              ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              : 'text-zinc-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Data Persistence</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
            activeSettingsTab === 'DATA_PERSISTENCE'
              ? 'bg-black text-cyan-300'
              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
          }`}>
            Storage Quota &amp; Cache
          </span>
        </button>

        <button
          onClick={() => handleTabSelect('GENERAL')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all font-bold cursor-pointer ${
            activeSettingsTab === 'GENERAL'
              ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              : 'text-zinc-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>General &amp; Passports</span>
        </button>

        <button
          onClick={() => handleTabSelect('AUDIT_REDTEAM')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all font-bold cursor-pointer ${
            activeSettingsTab === 'AUDIT_REDTEAM'
              ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              : 'text-zinc-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Self-Audit &amp; Red Team</span>
        </button>

        <button
          onClick={() => handleTabSelect('ACOUSTICS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all font-bold cursor-pointer ${
            activeSettingsTab === 'ACOUSTICS'
              ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              : 'text-zinc-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Acoustics &amp; Verbal TTS</span>
        </button>

        <button
          onClick={() => handleTabSelect('HARDWARE')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all font-bold cursor-pointer ${
            activeSettingsTab === 'HARDWARE'
              ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              : 'text-zinc-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Thermometer className="w-4 h-4" />
          <span>Cryo-Cooling &amp; Thermal</span>
        </button>

        <div className="ml-auto flex items-center">
          <button
            onClick={() => handleTabSelect('ALL')}
            className={`px-3 py-2 rounded-xl text-xs transition-all font-mono ${
              activeSettingsTab === 'ALL'
                ? 'bg-white/20 text-white font-bold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            📑 View All Sections
          </button>
        </div>
      </div>

      {/* Tab: Data Persistence (Offline Cache Purge, Storage Usage Indicator, Artifact Inspector) */}
      {(activeSettingsTab === 'DATA_PERSISTENCE' || activeSettingsTab === 'ALL') && (
        <DataPersistenceSettingsTab
          onNotifyEvent={onNotifyEvent}
          onAddSystemEvent={onAddSystemEvent}
        />
      )}

      {/* Quantum Login & Warp Ingress */}
      {(activeSettingsTab === 'GENERAL' || activeSettingsTab === 'ALL') && (
        <section className="p-5 rounded-[28px] bg-black/40 border border-[#D4AF37]/30 backdrop-blur-xl">
          <h2 className="flex items-center gap-2 text-[#D4AF37] font-bold mb-2 font-mono text-sm">
            <User className="w-4 h-4" /> AUTH &amp; WARP INGRESS
          </h2>
          <p className="text-xs text-zinc-400 font-mono mb-3">Execute quantum login and trigger holographic warp loader across sovereign tenants</p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                playTone(780, 0.05);
                onTriggerLoginLoader?.('login');
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/50 text-[#D4AF37] font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] cursor-pointer"
              title="Execute Quantum Login & Holographic Warp Ingress"
            >
              <span>🌌</span>
              <span>Quantum Login / Warp</span>
            </button>
            <button
              onClick={() => {
                playTone(720, 0.05);
                onTriggerLoginLoader?.('register');
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 cursor-pointer"
            >
              Register
            </button>
            <button
              onClick={() => {
                playTone(680, 0.05);
                onTriggerLoginLoader?.('switch_tenant');
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 cursor-pointer"
            >
              Switch Tenant
            </button>
          </div>
        </section>
      )}

      {/* Sovereign Audit & Red Team Modules */}
      {(activeSettingsTab === 'AUDIT_REDTEAM' || activeSettingsTab === 'ALL') && (
        <>
          {/* ZYRQUEN Ω∞ Sovereign Self-Audit & Evidence-Bound Verification Engine */}
          <SovereignSelfAuditEngine
            statusFilter={auditStatusFilter}
            onStatusFilterChange={handleAuditStatusFilterChange}
          />

          {/* Global Red Team Challenge */}
          <GlobalRedTeamChallenge />

          {/* Sovereign Master Forensic Audit Report */}
          <SovereignMasterForensicReportCard />
        </>
      )}

      {/* Acoustics, Terminal & Verbal Loop */}
      {(activeSettingsTab === 'ACOUSTICS' || activeSettingsTab === 'ALL') && (
        <>

      {/* High-Contrast Monochrome Terminal Mode Setting */}
      <div className="p-6 rounded-[28px] bg-[#0b0e1a]/85 border border-white/10 backdrop-blur-xl space-y-5 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <Contrast className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm uppercase tracking-wide">
                  High-Contrast Monochrome Terminal Mode (โหมดความเปรียบต่างสูง)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white border border-white/30 font-bold">
                  WCAG AAA • 21:1
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Switches the entire UI color palette to a stark black-and-white terminal style for enhanced visibility, zero optical fatigue, and maximum contrast.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const next = !isMonochrome;
                playTone(next ? 750 : 450, 0.05);
                onToggleMonochrome?.(next);
                if (onAddSystemEvent) {
                  onAddSystemEvent(
                    'COMPLIANCE',
                    next ? 'High-Contrast Monochrome Terminal Activated' : 'Standard Theme Restored',
                    next
                      ? 'Switched UI palette to stark black-and-white terminal style with 21:1 WCAG AAA contrast ratio.'
                      : 'Restored standard multi-spectrum sovereign color palette.',
                    'theme:monochrome_toggle',
                    'info',
                    'WCAG AAA & Sovereign Accessibility Directive',
                    'settings'
                  );
                }
              }}
              className={`px-4 py-2.5 rounded-2xl border font-bold text-xs flex items-center gap-2 transition-all shadow-md ${
                isMonochrome
                  ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                  : 'bg-black/40 text-zinc-300 border-white/15 hover:border-white/30 hover:bg-white/5'
              }`}
              title="Toggle Stark High-Contrast Monochrome Terminal Mode"
            >
              <Terminal className={`w-4 h-4 ${isMonochrome ? 'text-black' : 'text-zinc-400'}`} />
              <span>{isMonochrome ? 'MONOCHROME: ACTIVE' : 'ENABLE MONOCHROME'}</span>
            </button>
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="p-3.5 rounded-2xl bg-black border border-white/30 space-y-1.5 text-xs text-white">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 border-b border-white/20 pb-1">
              <span>TERMINAL VIEWPORT</span>
              <span>TRUE BLACK #000000</span>
            </div>
            <div className="text-[11px] font-mono leading-tight space-y-0.5">
              <div>&gt; ZYRQUEN Ω∞ SOVEREIGN CORE</div>
              <div className="text-zinc-300">&gt; MERKLE ROOT: 909ab814...</div>
              <div>&gt; STATUS: FAIL-CLOSED ARMED</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black border border-white/30 flex flex-col justify-between text-xs text-white">
            <div className="text-[10px] text-zinc-400">CONTRAST COMPLIANCE</div>
            <div className="text-xl font-bold">21.0 : 1 Ratio</div>
            <div className="text-[10px] text-zinc-300">Passing WCAG 2.1 Level AAA</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black border border-white/30 flex flex-col justify-between text-xs text-white">
            <div className="text-[10px] text-zinc-400">SPECTRUM FILTRATION</div>
            <div className="text-xl font-bold">Stark Black & White</div>
            <div className="text-[10px] text-zinc-300">Chromatic aberration neutralized</div>
          </div>
        </div>
      </div>

      <FirmwareLifecycleManager onNotifyEvent={onNotifyEvent} onAddSystemEvent={onAddSystemEvent} />

      {/* Sovereign Audio Environment Section */}
      <div className="p-6 rounded-[28px] bg-[#0b0e1a]/75 border border-white/8 backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold font-mono text-white text-sm uppercase tracking-wide">
                  Sovereign Audio Environment & Synthesizer Profiles
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono font-semibold">
                  WEB AUDIO API
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Multi-harmonic acoustic carrier synthesis tailored for focused sovereign operations, deep space focus, and post-quantum clocks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onToggleAudio}
              className={`px-4 py-2 rounded-2xl border font-mono font-bold text-xs flex items-center gap-2 transition-all ${
                isAudioActive
                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400 border-white/10'
              }`}
            >
              {isAudioActive ? <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
              <span>{isAudioActive ? 'SYNTH ENGINE ACTIVE' : 'START AUDIO SYNTH'}</span>
            </button>
          </div>
        </div>

        {/* Master Volume & Live Visualizer */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Sliders className="w-4 h-4 text-zinc-400" />
            <span className="text-zinc-300 font-bold">Master Volume:</span>
            <input
              type="range"
              min="5"
              max="100"
              value={volumeLevel}
              onChange={handleVolumeChange}
              className="w-36 accent-amber-400 cursor-pointer"
            />
            <span className="text-amber-300 font-bold">{Math.round((volumeLevel / 100) * 100)}%</span>
          </div>

          {isAudioActive ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>CARRIER STREAMING: {AUDIO_PROFILES.find((p) => p.id === activeProfile)?.baseFreq} Hz</span>
              <div className="flex items-end gap-0.5 h-3 ml-2">
                <span className="w-1 bg-amber-400 rounded-full animate-bounce h-3" />
                <span className="w-1 bg-amber-400 rounded-full animate-bounce delay-75 h-2" />
                <span className="w-1 bg-amber-400 rounded-full animate-bounce delay-150 h-3" />
                <span className="w-1 bg-amber-400 rounded-full animate-bounce delay-100 h-1.5" />
              </div>
            </div>
          ) : (
            <span className="text-zinc-500 text-[11px]">Carrier synth idling. Toggle above to start real-time oscillator.</span>
          )}
        </div>

        {/* Profile Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {AUDIO_PROFILES.map((prof) => {
            const isSelected = activeProfile === prof.id;
            return (
              <div
                key={prof.id}
                onClick={() => handleSelectProfile(prof.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 font-mono ${
                  isSelected
                    ? `bg-gradient-to-br ${prof.color} border-current shadow-lg ring-1 ring-white/20`
                    : 'bg-black/30 hover:bg-black/50 border-white/5 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                      {prof.name}
                    </h4>
                    <span className="text-[11px] text-zinc-400 block mt-0.5">{prof.subtitle}</span>
                  </div>
                  <span
                    className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-600'
                    }`}
                  >
                    {isSelected ? '✓' : '•'}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  {prof.description}
                </p>

                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/5 text-zinc-500">
                  <span>Carrier: {prof.baseFreq} Hz</span>
                  <span>Modulation: {prof.lfoFreq ? `${prof.lfoFreq} Hz LFO` : 'Direct'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Forensic Audit Chime & Compliance Audio Feedback Controls */}
      <AuditChimeSettingsCard />

      {/* Sovereign Text-to-Speech (TTS) Verbal Feedback Loop Controls */}
      <div className="p-6 rounded-[28px] bg-[#0b0e1a]/75 border border-cyan-500/20 backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold font-mono text-white text-sm uppercase tracking-wide">
                  Text-to-Speech Verbal Alert Feedback Loop
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono font-semibold">
                  LOW-LATENCY AUDIO
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Verbal speech synthesis announcements for 'Critical' and 'Anomaly' system events with Thai and English auto-detection.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const next = toggleTTSEnabled();
                playTone(next ? 750 : 400, 0.05);
                if (onAddSystemEvent) {
                  onAddSystemEvent(
                    'AUDIO',
                    next ? 'Spoken Verbal Warnings Activated' : 'Spoken Verbal Warnings Muted',
                    next
                      ? 'Text-to-Speech verbal feedback loop enabled for Critical and Anomaly events.'
                      : 'Text-to-Speech verbal feedback loop disabled.',
                    'tts:toggle',
                    'info',
                    'Real-Time Telemetry Safety Directive',
                    'settings'
                  );
                }
              }}
              className={`px-4 py-2 rounded-2xl border font-mono font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                ttsConfig.enabled
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400 border-white/10'
              }`}
            >
              {ttsConfig.enabled ? <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
              <span>{ttsConfig.enabled ? 'VERBAL WARNINGS: ACTIVE' : 'ENABLE VERBAL WARNINGS'}</span>
            </button>
          </div>
        </div>

        {/* Severity Event Filters & Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div
            onClick={() => {
              updateTTSConfig({ announceCritical: !ttsConfig.announceCritical });
              playTone(550, 0.04);
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between font-mono ${
              ttsConfig.announceCritical
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-200 shadow-md'
                : 'bg-black/30 border-white/5 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Critical Alerts</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">High priority fail-closed events</div>
            </div>
            <span className={`text-xs font-bold ${ttsConfig.announceCritical ? 'text-rose-400' : 'text-zinc-600'}`}>
              {ttsConfig.announceCritical ? 'ON' : 'OFF'}
            </span>
          </div>

          <div
            onClick={() => {
              updateTTSConfig({ announceAnomaly: !ttsConfig.announceAnomaly });
              playTone(550, 0.04);
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between font-mono ${
              ttsConfig.announceAnomaly
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 shadow-md'
                : 'bg-black/30 border-white/5 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>System Anomalies</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Decoherence & Jitter spikes</div>
            </div>
            <span className={`text-xs font-bold ${ttsConfig.announceAnomaly ? 'text-amber-400' : 'text-zinc-600'}`}>
              {ttsConfig.announceAnomaly ? 'ON' : 'OFF'}
            </span>
          </div>

          <div
            onClick={() => {
              updateTTSConfig({ announceWarning: !ttsConfig.announceWarning });
              playTone(550, 0.04);
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between font-mono ${
              ttsConfig.announceWarning
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200 shadow-md'
                : 'bg-black/30 border-white/5 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-cyan-400" />
                <span>General Warnings</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Threshold flutters & notices</div>
            </div>
            <span className={`text-xs font-bold ${ttsConfig.announceWarning ? 'text-cyan-400' : 'text-zinc-600'}`}>
              {ttsConfig.announceWarning ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {/* Speed, Pitch & Test Triggers */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Language:</span>
              <select
                value={ttsConfig.language}
                onChange={(e) => updateTTSConfig({ language: e.target.value as any })}
                className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="auto">Auto-Detect (TH/EN)</option>
                <option value="th">Thai Only (ภาษาไทย)</option>
                <option value="en">English Only</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Speech Rate:</span>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.05"
                value={ttsConfig.rate}
                onChange={(e) => updateTTSConfig({ rate: parseFloat(e.target.value) })}
                className="w-20 accent-cyan-400 cursor-pointer"
              />
              <span className="text-cyan-300 font-bold">{ttsConfig.rate}x</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                speakSystemAlert('แจ้งเตือนฉุกเฉิน: ตรวจพบความผันผวนของควอนตัมในห้องปฏิบัติการที่เจ็ด', 'critical', 'th');
                playAuditChime();
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>🔊 TEST THAI ALERT</span>
            </button>
            <button
              onClick={() => {
                speakSystemAlert('Critical Alert: Chamber zero seven qubit decoherence detected. Quarantine engaged.', 'critical', 'en');
                playAuditChime();
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>🔊 TEST ENGLISH ALERT</span>
            </button>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Persistent System Health Audit Report (Read-Only SSoT Mutation = 0 Verification) */}
      {(activeSettingsTab === 'AUDIT_REDTEAM' || activeSettingsTab === 'ALL') && (
        <div className="space-y-4">
          <SystemAuditReport />
        </div>
      )}

      {/* Sovereign Custodians & Statutory Legal Framework */}
      {(activeSettingsTab === 'GENERAL' || activeSettingsTab === 'ALL') && (
        <>
          {/* Custodian Quorum Registry & HSM Attestation Authority (10/10 Statutory Quorum) */}
          <div className="space-y-4">
            <CustodianQuorumRegistry onSelectEvidence={handleSelectEvidence} />
          </div>

          {/* Thai Sovereign Custodian Passports */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                Registered Thai Sovereign Custodians
              </span>
              <span className="text-xs font-mono text-emerald-400">4 Active Executive Passports</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {THAI_CUSTODIANS.map((cust) => (
                <div
                  key={cust.id}
                  className="p-6 rounded-[28px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-4 hover:border-cyan-500/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                        🇹🇭
                      </div>
                      <div>
                        <h3 className="text-sm font-mono font-bold text-white">{cust.nameTh}</h3>
                        <div className="text-xs text-zinc-400 font-mono">{cust.nameEn}</div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25 text-[10px] font-mono font-bold">
                      {cust.passportNumber}
                    </span>
                  </div>

                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-xs text-zinc-300 font-mono">
                    <div className="text-cyan-300 font-medium">{cust.roleTh}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{cust.roleEn}</div>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono text-zinc-400">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">CLEARANCE:</span>
                      <span className="text-zinc-200 font-bold">{cust.clearanceLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">SIGNED DATE:</span>
                      <span className="text-zinc-300">{cust.signedDate}</span>
                    </div>
                    <div className="flex flex-col pt-1">
                      <span className="text-zinc-500 text-[10px]">KEY FINGERPRINT:</span>
                      <span className="text-cyan-400/90 text-[11px] truncate select-all">{cust.keyFingerprint}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Thai Electronic Transactions Act ↔ Sovereign Seal Chain Flow Diagram & Mapping */}
          <ThaiLegalSovereignMapping />
        </>
      )}

      {/* Cryo-Cooling, HSM Quorum & Attestation Authority */}
      {(activeSettingsTab === 'HARDWARE' || activeSettingsTab === 'ALL') && (
        <>
          {/* Physical Attestation Sub-Component: Strict Claimed vs Verified Validation for Slots #06-#08 */}
          <div className="space-y-4">
            <PhysicalAttestation />
          </div>

          {/* Firmware Lifecycle Manager */}
          <div className="space-y-4">
            <FirmwareLifecycleManager />
          </div>

          {/* Quantum Cooling Unit Battery & Thermal Threshold Alert Monitor */}
          <div className="p-6 rounded-[28px] bg-[#0b0e1a]/75 border border-white/8 backdrop-blur-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all ${
                  simulatedBattery <= batteryThresholdPct
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse'
                    : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                }`}>
                  {simulatedBattery <= batteryThresholdPct ? (
                    <BatteryWarning className="w-5 h-5 text-rose-400" />
                  ) : (
                    <BatteryCharging className="w-5 h-5 text-cyan-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-white text-sm uppercase tracking-wide">
                      Quantum Cryo-Cooling Battery & Sub-Kelvin Thermal Monitor
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold border ${
                      batteryAlertEnabled
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
                    }`}>
                      {batteryAlertEnabled ? 'SIDEBAR NOTIFICATIONS ARMED' : 'ALERTS MUTED'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-sans mt-0.5">
                    Automated background watcher triggers real-time alerts in system sidebar when dilution refrigerator backup power drops below safety threshold.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleBatteryAlert}
                  className={`px-4 py-2 rounded-2xl border font-mono font-bold text-xs flex items-center gap-2 transition-all ${
                    batteryAlertEnabled
                      ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'bg-white/5 hover:bg-white/10 text-zinc-400 border-white/10'
                  }`}
                >
                  <Bell className={`w-4 h-4 ${batteryAlertEnabled ? 'text-emerald-400 animate-bounce' : 'text-zinc-500'}`} />
                  <span>{batteryAlertEnabled ? 'ALERT DAEMON ENABLED' : 'ENABLE SIDEBAR ALERTS'}</span>
                </button>
              </div>
            </div>

            {/* Battery Health & Threshold Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              {/* Card 1: Live Battery Level & Status */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Battery className="w-4 h-4 text-cyan-400" />
                    CRYO BACKUP BATTERY
                  </span>
                  <span className={`font-bold ${simulatedBattery <= batteryThresholdPct ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                    {simulatedBattery}% HEALTH
                  </span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      simulatedBattery <= batteryThresholdPct
                        ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                        : 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                    }`}
                    style={{ width: `${simulatedBattery}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                  <span>Bus: 48.2 VDC • 1.8 A</span>
                  <span>Cell: LiFePO4 Solid-State</span>
                </div>
              </div>

              {/* Card 2: User-Defined Alert Threshold Slider */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ALERT TRIGGER THRESHOLD
                  </span>
                  <span className="text-amber-300 font-bold">{batteryThresholdPct}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={batteryThresholdPct}
                  onChange={handleThresholdChange}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                  <span>Min 10%</span>
                  <span className="text-zinc-400">Trigger Alert at &lt; {batteryThresholdPct}%</span>
                  <span>Max 50%</span>
                </div>
              </div>

              {/* Card 3: Dilution Refrigerator Thermal State */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-violet-400" />
                    DILUTION CRYO TEMP
                  </span>
                  <span className={`font-bold ${simulatedCryoTemp > 20 ? 'text-amber-400' : 'text-violet-300'}`}>
                    {simulatedCryoTemp} mK
                  </span>
                </div>
                <div className="text-[11px] text-zinc-300">
                  Helium-3/Helium-4 Phase Mixing Loop: <span className="text-emerald-400 font-semibold">100% INTACT</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                  <span>Cooling Unit Load: 34W</span>
                  <span>Turbopump: 72,000 RPM</span>
                </div>
              </div>
            </div>

            {/* Action / Simulation Test Bar */}
            <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Forensic Simulation: Test automated sidebar alert dispatch when battery drops below {batteryThresholdPct}%</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={triggerSimulatedLowBattery}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold transition-all text-xs flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Simulate Low Battery (18%)</span>
                </button>

                <button
                  onClick={restoreBatteryToNominal}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold transition-all text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Restore Nominal (92%)</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Security & System Preferences */}
      {(activeSettingsTab === 'GENERAL' || activeSettingsTab === 'ALL') && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-[28px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-4">
              <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                Security & UI Preferences
              </span>
              <div className="space-y-3 text-xs font-mono">
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-cyan-400" /> Auto-Lock Inactivity Timer
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">Require re-authentication after idle duration</div>
                  </div>
                  <select
                    value={Number(localStorage.getItem('zyrquen_inactivity_timer') || 30)}
                    onChange={(e) => {
                      const val = e.target.value;
                      localStorage.setItem('zyrquen_inactivity_timer', val);
                      window.dispatchEvent(new Event('zyrquen_inactivity_timer_updated'));
                      playAuditChime();
                    }}
                    className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 focus:outline-none"
                  >
                    <option value="5">5 Minutes</option>
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="60">1 Hour</option>
                    <option value="0">Disabled</option>
                  </select>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-zinc-200">UI Acoustic Chimes & Feedback</div>
                    <div className="text-[11px] text-zinc-500">Auditory cues for state transitions and audit seals</div>
                  </div>
                  <button
                    onClick={() => {
                      setSoundFeedback(!soundFeedback);
                      playAuditChime();
                    }}
                    className={`px-3 py-1.5 rounded-xl border font-bold text-xs ${
                      soundFeedback
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-white/5 text-zinc-400 border-white/10'
                    }`}
                  >
                    {soundFeedback ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-[28px] bg-[#0b0e1a]/70 border border-white/8 backdrop-blur-xl space-y-4">
              <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">
                Deployment & License Baseline
              </span>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-500">SYSTEM CODENAME:</span>
                  <span className="text-white font-bold">{SYSTEM_METADATA.codename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">LTS VERSION:</span>
                  <span className="text-cyan-300 font-bold">{SYSTEM_METADATA.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">LICENSE:</span>
                  <span className="text-emerald-400 font-bold">SOVEREIGN PERPETUAL FROZEN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">PLATFORM BOUNDARY:</span>
                  <span className="text-amber-300 font-bold">{SYSTEM_METADATA.platformBoundary}</span>
                </div>
              </div>
            </div>
          </div>

          <GitHubDeploymentWidget />
        </>
      )}

      {/* Read-Only Evidence Detail Modal for REAL_HSM_SIGNED Proof Packets */}
      <EvidenceDetailModal
        isOpen={isEvidenceModalOpen}
        onClose={handleCloseEvidenceModal}
        evidenceData={selectedEvidence}
      />
    </div>
  );
};

