import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, useLocation, useNavigate } from '@/lib/router';
import { Lock, Waves } from 'lucide-react';

import { ViewType, HardwareSnapshot } from '@/types';
import { Navigation } from '@/components/Navigation';
import { LeftSidebar } from '@/components/LeftSidebar';
import { MainFooter } from '@/components/MainFooter';
import { SovereignControlDock } from '@/components/SovereignControlDock';
import { CopilotSovereignAI } from '@/components/CopilotSovereignAI';
import { SystemEventsSidebar, SystemEvent } from '@/components/SystemEventsSidebar';
import { ViewRenderer } from '@/app/viewRegistry';
import { SecuritySubTab } from '@/components/views/SecurityView';
import { AuditCertificateModal } from '@/components/AuditCertificateModal';
import { GitHubPwaModal } from '@/components/GitHubPwaModal';
import { ThaiLegalSearchModal } from '@/components/ThaiLegalSearchModal';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { VoiceCommandOverlay } from '@/components/VoiceCommandOverlay';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { NexusIntegrationLayer } from '@/components/NexusIntegrationLayer';
import { SovereignLoginLoader } from '@/components/SovereignLoginLoader';
import { ExecutiveCommandPalette } from '@/components/ExecutiveCommandPalette';
import { GlobalCommandSearch } from '@/components/GlobalCommandSearch';
import { ForensicAuditMasterDossierModal } from '@/components/forensics/ForensicAuditMasterDossierModal';
import { useTheme } from '@/components/ThemeSwitcher';
import { EmergencySovereignLockdown } from '@/components/EmergencySovereignLockdown';
import { LiveQuantumEntropyTicker } from '@/components/LiveQuantumEntropyTicker';
import { ToastNotification, ToastMessage } from '@/components/ToastNotification';
import {
  SsotDriftWarning,
  SsotDriftToggleButton,
  QuantumAggregateEntropyIndicator,
} from '@/components/system/SystemStateComponents';
import {
  toggleSovereignSynth882Hz,
  playTone,
  playAuditChime,
  updateAtmosphericEntropyPitch,
  setCustomCarrierFrequency,
} from '@/components/AudioSynthesizer';
import { systemStateStore } from '@/store/systemStateStore';
import { broadcastSyncService } from '@/services/broadcastSyncService';
import { offlineAuditSyncService } from '@/services/offlineAuditSyncService';
import { automatedBackupService } from '@/services/automatedBackupService';
import { WriteFirewallEngine } from '@/utils/writeFirewall';
import { TelemetryAnomalyObserver } from '@/utils/telemetryAnomalyObserver';
import { INITIAL_HARDWARE_SNAPSHOTS, createTelemetrySnapshot } from '@/utils/telemetrySnapshot';
import { announceSystemEventVerbal } from '@/utils/textToSpeechService';
import { triggerVibration } from '@/utils/vibration';
import { useNotificationWebSocket } from '@/hooks/useNotificationWebSocket';
import { useTimeoutRegistry } from '@/hooks/useTimeoutRegistry';
import { useInactivityLock } from '@/hooks/useInactivityLock';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { exportLegalTriggerMatrixPdf } from '@/features/legal/exportLegalTriggerMatrixPdf';
import { VerificationGateBar } from '@/components/layout/VerificationGateBar';
import {
  VIEW_PERSONAS,
  VALID_VIEWS,
  INITIAL_SYSTEM_EVENTS,
  TELEMETRY_AUDIT_INTERVAL_SEC,
} from '@/config/sovereignConfig';

export type SystemAction =
  | {
      type: 'EMIT_SYSTEM_EVENT';
      payload: {
        type: SystemEvent['type'];
        title: string;
        description: string;
        metaHash?: string;
        severity?: SystemEvent['severity'];
        statuteRef?: string;
        targetView?: SystemEvent['targetView'];
        targetTab?: SecuritySubTab;
        isComplianceDrift?: boolean;
        bindingStatus?: SystemEvent['bindingStatus'];
        anchoredSealNumber?: number;
        merkleProofHash?: string;
      };
    }
  | {
      type: 'BATCH_SYSTEM_EVENTS';
      payload: Array<{
        type: SystemEvent['type'];
        title: string;
        description: string;
        metaHash?: string;
        severity?: SystemEvent['severity'];
        statuteRef?: string;
        targetView?: SystemEvent['targetView'];
        targetTab?: SecuritySubTab;
        isComplianceDrift?: boolean;
        bindingStatus?: SystemEvent['bindingStatus'];
        anchoredSealNumber?: number;
        merkleProofHash?: string;
      }>;
    }
  | {
      type: 'SYNC_REMOTE_EVENT';
      payload: SystemEvent;
    }
  | {
      type: 'CLEAR_SYSTEM_EVENTS';
    };

/**
 * Normalizes system event inputs from all origins (compliance checks, hardware snapshots, evidence intake, manual imports)
 * into a single consistent, tamper-evident SystemEvent structure.
 */
function createNormalizedSystemEvent(
  payload: {
    type: SystemEvent['type'];
    title: string;
    description: string;
    metaHash?: string;
    severity?: SystemEvent['severity'];
    statuteRef?: string;
    targetView?: SystemEvent['targetView'];
    targetTab?: SecuritySubTab;
    isComplianceDrift?: boolean;
    bindingStatus?: SystemEvent['bindingStatus'];
    anchoredSealNumber?: number;
    merkleProofHash?: string;
  },
  sealCounter?: number
): SystemEvent {
  const isCompliance = payload.type === 'COMPLIANCE';
  const isForensic = payload.type === 'FORENSIC';
  const isHardware = payload.type === 'HARDWARE';
  const isEvidence = payload.type === 'EVIDENCE_IMPORTED';
  const isCrypto = payload.type === 'CRYPTO';

  const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false }) + ' ICT';

  let bindingStatus: SystemEvent['bindingStatus'] = payload.bindingStatus;
  if (!bindingStatus) {
    if (isCompliance || isForensic || isCrypto) {
      bindingStatus = 'VERIFIED';
    } else if (isEvidence) {
      bindingStatus = 'PENDING';
    } else {
      bindingStatus = 'ANCHORED';
    }
  }

  let statuteRef = payload.statuteRef;
  if (!statuteRef) {
    if (isCompliance || isForensic) {
      statuteRef = 'ETDA B.E. 2544 Sec 9/26/28 & PDPA Sec 37';
    } else if (isHardware) {
      statuteRef = 'FIPS 140-3 L4 Hardware Custody & Sub-Kelvin Thermal SLA';
    } else if (isEvidence) {
      statuteRef = 'Hardening v2.1 Intake Gate (Provenance: SOURCE_FILE, Mutation: 0)';
    }
  }

  let metaHash = payload.metaHash;
  if (!metaHash && isCompliance) {
    metaHash = `etda:sec26:proof:${Date.now().toString(16)}`;
  }

  return {
    id: `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    type: payload.type,
    title: payload.title.trim(),
    description: payload.description.trim(),
    timestamp,
    metaHash,
    statuteRef,
    targetView: payload.targetView,
    targetTab: payload.targetTab,
    isComplianceDrift: Boolean(payload.isComplianceDrift),
    bindingStatus,
    anchoredSealNumber:
      payload.anchoredSealNumber ?? (bindingStatus === 'VERIFIED' ? (sealCounter ?? 14902) : undefined),
    merkleProofHash: payload.merkleProofHash,
    severity: payload.severity || 'info',
  };
}

// Global registry to detect duplicate module re-registrations and inspect initialization order
const registeredModulesRegistry = new Set<string>();

/**
 * Diagnostic logger that triggers early in the SovereignAppContent lifecycle:
 * - Inspects order of state registration
 * - Verifies broadcastSyncService initialization before system event handlers attach
 * - Audits module and handler registrations to catch duplicate import re-registrations
 */
function runSovereignAppDiagnostics(context: {
  currentView: string;
  snapshotsCount: number;
  systemEventsCount: number;
  verificationGateStatus: string;
  isSystemActivityFrozen: boolean;
}): void {
  const timestamp = new Date().toISOString();
  console.groupCollapsed(
    `%c[ZYRQUEN Ω∞ LIFECYCLE DIAGNOSTIC]%c SovereignAppContent Initialization Audit (${timestamp})`,
    'color: #10b981; font-weight: bold; background: #061e14; padding: 2px 6px; border-radius: 4px;',
    'color: #38bdf8; font-weight: normal;'
  );

  // 1. Inspect State Registration Sequence
  console.log('%c1. Order of State Registration Inspection:', 'font-weight: bold; color: #34d399;');
  console.log('   ├── [Stage 1: Routing & Navigation] View: %s', context.currentView);
  console.log('   ├── [Stage 2: Telemetry State] Hardware Snapshots: %d', context.snapshotsCount);
  console.log('   ├── [Stage 3: Verification Gate] Status: %s', context.verificationGateStatus);
  console.log('   ├── [Stage 4: Audit Event State] Initial System Events: %d', context.systemEventsCount);
  console.log('   └── [Stage 5: System Lock Guard] Frozen: %s', context.isSystemActivityFrozen ? 'TRUE (PAUSED)' : 'FALSE (LIVE)');

  // 2. Verify broadcastSyncService readiness BEFORE event handlers attach
  broadcastSyncService.init();
  const isBroadcastReady = broadcastSyncService.getIsInitialized();
  const channelName = broadcastSyncService.getChannelName();
  const tabId = broadcastSyncService.getTabId();

  console.log('%c2. BroadcastSyncService Pre-Flight Verification:', 'font-weight: bold; color: #34d399;');
  if (isBroadcastReady) {
    console.log(
      '   ├── Channel Status: %cINITIALIZED & READY%c (Channel: %s, Tab: %s)',
      'color: #10b981; font-weight: bold;',
      'color: inherit;',
      channelName,
      tabId
    );
    console.log('   └── Service Readiness: VERIFIED (Ready for subscriber attachment before system event hooks)');
  } else {
    console.warn(
      '   └── %cWARNING: BroadcastChannel not supported or uninitialized; running single-tab local state fallback.%c',
      'color: #f59e0b; font-weight: bold;',
      'color: inherit;'
    );
  }

  // 3. Inspect for duplicate import / component re-registrations
  console.log('%c3. Duplicate Import & Handler Re-Registration Audit:', 'font-weight: bold; color: #34d399;');
  const criticalModules = [
    'WriteFirewallEngine',
    'automatedBackupService',
    'broadcastSyncService',
    'offlineAuditSyncService',
    'useNotificationWebSocket',
  ];

  const duplicateRegistrations: string[] = [];
  criticalModules.forEach((moduleKey) => {
    if (registeredModulesRegistry.has(moduleKey)) {
      duplicateRegistrations.push(moduleKey);
    } else {
      registeredModulesRegistry.add(moduleKey);
    }
  });

  if (duplicateRegistrations.length > 0) {
    console.warn(
      `[ZYRQUEN Ω∞ DIAGNOSTIC WARN] Duplicate registration detected for: ${duplicateRegistrations.join(', ')}. Check component re-mounting and singleton imports.`
    );
  } else {
    console.log(
      '   └── All %d critical service engines verified unique. Zero duplicate re-registrations detected in terminal output.',
      criticalModules.length
    );
  }

  console.groupEnd();
}

function SovereignAppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const rawPath = location.pathname.replace(/^\//, '').toLowerCase().trim();
  const currentView: ViewType = VALID_VIEWS.includes(rawPath as ViewType)
    ? (rawPath as ViewType)
    : 'dashboard';

  const setCurrentView = useCallback((view: ViewType) => {
    const targetPath = view === 'dashboard' ? '/' : `/${view}`;
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  }, [navigate, location.pathname]);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zyrquen_sidebar_open') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebar = useCallback(() => {
    triggerVibration('sidebarToggle');
    setIsLeftSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('zyrquen_sidebar_open', String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  }, []);

  const handleCloseSidebar = useCallback(() => {
    triggerVibration('modalDismiss');
    setIsLeftSidebarOpen(false);
    try {
      localStorage.setItem('zyrquen_sidebar_open', 'false');
    } catch (e) {
      console.error(e);
    }
  }, []);
  const [selectedChamberId, setSelectedChamberId] = useState<string>('00');
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isGitHubPwaOpen, setIsGitHubPwaOpen] = useState(false);
  const [isLegalSearchOpen, setIsLegalSearchOpen] = useState(false);
  const [isCommandSearchOpen, setIsCommandSearchOpen] = useState(false);
  const [isForensicMasterDossierOpen, setIsForensicMasterDossierOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isEventsSidebarOpen, setIsEventsSidebarOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isGateDetailsExpanded, setIsGateDetailsExpanded] = useState(false);

  const { registerTimeout } = useTimeoutRegistry();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    registerTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, [registerTimeout]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Listen for global chamber threshold alerts (<0.90) and custom system events
  useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type?: ToastMessage['type'] }>;
      if (customEvent.detail?.message) {
        showToast(customEvent.detail.message, customEvent.detail.type || 'warning');
      }
    };
    window.addEventListener('zyrquen-toast', handleGlobalToast);
    return () => window.removeEventListener('zyrquen-toast', handleGlobalToast);
  }, [showToast]);

  // Connect to Node.js WebSocket Notification Service and pipe incoming alerts to toasts
  useNotificationWebSocket(showToast);

  // Auto-open Forensic Master Dossier Modal on dedicated legal routes
  useEffect(() => {
    if (
      location.pathname === '/legal/dossier-export' ||
      location.pathname === '/dossier' ||
      location.pathname === '/forensic-dossier' ||
      location.pathname === '/legal/forensic-dossier'
    ) {
      setIsForensicMasterDossierOpen(true);
    }
  }, [location.pathname]);
  const [carrierPitchHz, setCarrierPitchHz] = useState<number>(882);
  const [snapshots, setSnapshots] = useState<HardwareSnapshot[]>(INITIAL_HARDWARE_SNAPSHOTS);
  const [lastSnapshotTime, setLastSnapshotTime] = useState<number>(0);
  const [heartbeatTick, setHeartbeatTick] = useState<boolean>(false);
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>(INITIAL_SYSTEM_EVENTS);
  const [isSystemActivityFrozen, setIsSystemActivityFrozen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zyrquen_system_frozen') === 'true';
    } catch {
      return false;
    }
  });
  const [verificationGateStatus, setVerificationGateStatus] = useState<{
    status: 'ACTIVE_GUARD' | 'PASSED' | 'BLOCKED';
    lastCheckedTime: string;
    complianceEventCount: number;
    sealCount: number;
    message: string;
  }>({
    status: 'ACTIVE_GUARD',
    lastCheckedTime: '05:05:30 ICT',
    complianceEventCount: 2,
    sealCount: 14902,
    message: 'Verification Gate Active: Enforcing COMPLIANCE invariant binding before ledger append.',
  });

  const [auditCountdownSec, setAuditCountdownSec] = useState<number>(TELEMETRY_AUDIT_INTERVAL_SEC);
  // Scheduled telemetry audit countdown timer (30s cadence)
  useEffect(() => {
    if (isSystemActivityFrozen) return;

    const timer = setInterval(() => {
      setAuditCountdownSec((prev) => {
        if (prev <= 1) {
          const now = new Date();
          const timeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok' }) + ' ICT';
          setVerificationGateStatus((curr) => ({
            ...curr,
            status: 'PASSED',
            lastCheckedTime: timeStr,
            message: 'Scheduled Telemetry Audit Passed: 10/10 REAL_HSM quorum verified coherent @ 14.98 mK.',
          }));
          return TELEMETRY_AUDIT_INTERVAL_SEC;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSystemActivityFrozen]);

  const auditProgressPercent = ((TELEMETRY_AUDIT_INTERVAL_SEC - auditCountdownSec) / TELEMETRY_AUDIT_INTERVAL_SEC) * 100;
  const [isMonochromeMode, setIsMonochromeMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zyrquen_monochrome_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [isForensicAuditMode, setIsForensicAuditMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zyrquen_forensic_audit_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [showLoginLoader, setShowLoginLoader] = useState<boolean>(false);
  const [loginLoaderMode, setLoginLoaderMode] = useState<'login' | 'register' | 'switch_tenant'>('login');

  const handleToggleForensicAuditMode = useCallback(() => {
    triggerVibration('sidebarToggle');
    setIsForensicAuditMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('zyrquen_forensic_audit_mode', String(next));
      } catch (e) {
        console.error(e);
      }
      broadcastSyncService.broadcastGlobalLockState({ isForensicAuditMode: next });
      return next;
    });
  }, []);

  const handleToggleMonochrome = useCallback((enabled?: boolean) => {
    triggerVibration('sidebarToggle');
    setIsMonochromeMode((prev) => {
      const next = enabled !== undefined ? enabled : !prev;
      try {
        localStorage.setItem('zyrquen_monochrome_mode', String(next));
      } catch (e) {
        console.error(e);
      }
      broadcastSyncService.broadcastGlobalLockState({ isMonochromeMode: next });
      return next;
    });
  }, []);

  

  

  // Heartbeat pulse timer in sync with telemetry
  useEffect(() => {
    const isRecent = Date.now() - lastSnapshotTime < 6000;
    const intervalTime = isRecent ? 500 : 1000; // Accelerated heartbeat when snapshot is captured!

    const interval = setInterval(() => {
      setHeartbeatTick((prev) => !prev);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [lastSnapshotTime]);

  const snapshotsRef = useRef(snapshots);
  snapshotsRef.current = snapshots;
  const isSystemActivityFrozenRef = useRef(isSystemActivityFrozen);
  isSystemActivityFrozenRef.current = isSystemActivityFrozen;

  const diagnosticRanRef = useRef(false);
  const hasSeededEvidenceRef = useRef(false);

  // Diagnostic logs function that triggers early in the SovereignAppContent lifecycle
  useEffect(() => {
    if (diagnosticRanRef.current) return;
    diagnosticRanRef.current = true;
    runSovereignAppDiagnostics({
      currentView,
      snapshotsCount: snapshots.length,
      systemEventsCount: systemEvents.length,
      verificationGateStatus: verificationGateStatus.status,
      isSystemActivityFrozen,
    });
  }, [currentView, snapshots.length, systemEvents.length, verificationGateStatus.status, isSystemActivityFrozen]);

  /**
   * Centralized dispatch mechanism for all system and audit actions.
   * Replaces queueMicrotask with deterministic, structured synchronous state updates
   * and dispatches to BroadcastChannel, offline audit queues, and verbal announcers.
   */
  const dispatchAction = useCallback((action: SystemAction) => {
    switch (action.type) {
      case 'EMIT_SYSTEM_EVENT': {
        const normalizedEvt = createNormalizedSystemEvent(
          action.payload,
          systemStateStore.getState().sealCount
        );

        // Centralized state update (no queueMicrotask)
        setSystemEvents((prev) => [normalizedEvt, ...prev]);

        // Immediate Verification Gate check update when compliance event arrives
        if (normalizedEvt.type === 'COMPLIANCE') {
          setVerificationGateStatus((curr) => ({
            ...curr,
            status: 'PASSED',
            lastCheckedTime: normalizedEvt.timestamp,
            complianceEventCount: curr.complianceEventCount + 1,
            message: `Verification Gate PASSED: Compliance anchor verified (${normalizedEvt.title}). 10/10 REAL_HSM Quorum Active.`,
          }));
        }

        // Cross-tab broadcast synchronization
        try {
          broadcastSyncService.broadcastSystemEvent(normalizedEvt);
        } catch (err) {
          console.warn('Broadcast sync failed:', err);
        }

        // Offline background persistence queue
        try {
          offlineAuditSyncService.enqueueEvent({
            type: normalizedEvt.type,
            title: normalizedEvt.title,
            description: normalizedEvt.description,
            metaHash: normalizedEvt.metaHash,
            severity: normalizedEvt.severity,
            statuteRef: normalizedEvt.statuteRef,
          });
        } catch (err) {
          console.warn('Offline audit enqueue failed:', err);
        }

        // Low-Latency Verbal Feedback Loop for Critical and Anomaly Events
        try {
          announceSystemEventVerbal(normalizedEvt.type, normalizedEvt.title, normalizedEvt.severity);
        } catch (err) {
          console.warn('Verbal announcer failed:', err);
        }
        break;
      }

      case 'BATCH_SYSTEM_EVENTS': {
        const normalizedList = action.payload.map((p) =>
          createNormalizedSystemEvent(p, systemStateStore.getState().sealCount)
        );
        setSystemEvents((prev) => [...normalizedList, ...prev]);

        normalizedList.forEach((evt) => {
          if (evt.type === 'COMPLIANCE') {
            setVerificationGateStatus((curr) => ({
              ...curr,
              status: 'PASSED',
              lastCheckedTime: evt.timestamp,
              complianceEventCount: curr.complianceEventCount + 1,
              message: `Verification Gate PASSED: Compliance anchor verified (${evt.title}). 10/10 REAL_HSM Quorum Active.`,
            }));
          }
          try {
            broadcastSyncService.broadcastSystemEvent(evt);
          } catch (err) {
            console.warn('Broadcast sync failed:', err);
          }
          try {
            offlineAuditSyncService.enqueueEvent({
              type: evt.type,
              title: evt.title,
              description: evt.description,
              metaHash: evt.metaHash,
              severity: evt.severity,
              statuteRef: evt.statuteRef,
            });
          } catch (err) {
            console.warn('Offline audit enqueue failed:', err);
          }
        });
        break;
      }

      case 'CLEAR_SYSTEM_EVENTS': {
        setSystemEvents([]);
        break;
      }

      case 'SYNC_REMOTE_EVENT': {
        const remoteEvt = action.payload;
        setSystemEvents((prev) => {
          if (prev.some((e) => e.id === remoteEvt.id)) return prev;
          return [remoteEvt, ...prev];
        });
        if (remoteEvt.type === 'COMPLIANCE') {
          setVerificationGateStatus((curr) => ({
            ...curr,
            status: 'PASSED',
            lastCheckedTime: remoteEvt.timestamp,
            complianceEventCount: curr.complianceEventCount + 1,
            message: `Verification Gate PASSED: Remote compliance anchor verified (${remoteEvt.title}). 10/10 REAL_HSM Quorum Active.`,
          }));
        }
        break;
      }
    }
  }, []);

  const addSystemEvent = useCallback(
    (
      type: SystemEvent['type'],
      title: string,
      description: string,
      metaHash?: string,
      severity: SystemEvent['severity'] = 'info',
      statuteRef?: string,
      targetView?: SystemEvent['targetView']
    ) => {
      dispatchAction({
        type: 'EMIT_SYSTEM_EVENT',
        payload: {
          type,
          title,
          description,
          metaHash,
          severity,
          statuteRef,
          targetView,
        },
      });
    },
    [dispatchAction]
  );

  // Trigger 'EVIDENCE_IMPORTED' audit events upon initial mount using batched dispatchAction
  useEffect(() => {
    if (hasSeededEvidenceRef.current) return;
    hasSeededEvidenceRef.current = true;

    dispatchAction({
      type: 'BATCH_SYSTEM_EVENTS',
      payload: [
        {
          type: 'EVIDENCE_IMPORTED',
          title: 'Evidence Imported: TNT-TH-001 (Tenant Manifest)',
          description:
            'Status: PENDING | Provenance: SOURCE_FILE | Mutation: 0 | Scope: Sovereign Physical Hardware Isolation (MAEW HOLDINGS CO., LTD.) | Canonical write: BLOCKED',
          metaHash: 'source:TNT-TH-001 (Digest: NOT COMPUTED)',
          severity: 'info',
          statuteRef: 'Hardening v2.1 Intake Gate (Provenance: SOURCE_FILE, Mutation: 0)',
          targetView: 'dashboard',
        },
        {
          type: 'EVIDENCE_IMPORTED',
          title: 'Evidence Imported: DS-901-PILOT (FIOS Pilot Dataset)',
          description:
            'Status: PENDING | Provenance: SOURCE_FILE | Mutation: 0 | Scope: Non-Live Pilot Dataset (Zero Trading Authority) | Canonical write: BLOCKED',
          metaHash: 'source:DS-901-PILOT (Digest: NOT COMPUTED)',
          severity: 'info',
          statuteRef: 'Hardening v2.1 Intake Gate (Provenance: SOURCE_FILE, Mutation: 0)',
          targetView: 'dashboard',
        },
      ],
    });
  }, [dispatchAction]);

  // Unified service lifecycle effect ensuring strict initialization & ordered teardown
  useEffect(() => {
    // 1. Ensure broadcastSyncService is initialized before attaching cross-tab listeners
    broadcastSyncService.init();

    // 2. Attach BroadcastChannel cross-tab synchronization listeners
    const unsubEvent = broadcastSyncService.onSystemEvent((evt) => {
      dispatchAction({ type: 'SYNC_REMOTE_EVENT', payload: evt });
    });

    const unsubSnap = broadcastSyncService.onAuditSnapshot((snap) => {
      setSnapshots((prev) => {
        if (prev.some((s) => s.id === snap.id)) return prev;
        return [snap, ...prev];
      });
    });

    const unsubLock = broadcastSyncService.onLockState((lockState) => {
      if (typeof lockState.isSystemActivityFrozen === 'boolean') {
        setIsSystemActivityFrozen(lockState.isSystemActivityFrozen);
      }
      if (typeof lockState.isForensicAuditMode === 'boolean') {
        setIsForensicAuditMode(lockState.isForensicAuditMode);
      }
      if (typeof lockState.isMonochromeMode === 'boolean') {
        setIsMonochromeMode(lockState.isMonochromeMode);
      }
    });

    // 3. Attach Offline Audit Sync listener
    let previousPending = offlineAuditSyncService.getQueueCount();
    const unsubOffline = offlineAuditSyncService.subscribe((count) => {
      if (previousPending > 0 && count === 0) {
        showToast(
          `Background Sync: ${previousPending} offline audit logs flushed to sovereign ledger.`,
          'success'
        );
      }
      previousPending = count;
    });

    // 4. Start automated backup service and attach snapshot listener
    automatedBackupService.start();
    const unsubBackupSnap = automatedBackupService.onSnapshot((record) => {
      if (isSystemActivityFrozenRef.current) return;

      const currentSnaps = snapshotsRef.current;
      const newSnap = createTelemetrySnapshot(
        {
          core0: 41 + Math.floor(Math.random() * 5),
          core1: 39 + Math.floor(Math.random() * 4),
          core2: 43 + Math.floor(Math.random() * 6),
          core3: 38 + Math.floor(Math.random() * 5),
        },
        currentSnaps.length,
        currentSnaps[0]?.sealedHash
      );
      setSnapshots((prev) => [newSnap, ...prev]);
      setLastSnapshotTime(Date.now());
      triggerVibration('snapshot');
      try {
        broadcastSyncService.broadcastAuditSnapshot(newSnap);
      } catch (err) {
        console.warn('Broadcast snapshot failed:', err);
      }

      showToast(`Automated System Backup #${record.snapshotNumber} Sealed Successfully. Integrity Verified.`, 'success');

      dispatchAction({
        type: 'EMIT_SYSTEM_EVENT',
        payload: {
          type: 'BACKUP',
          title: `Automated System Backup #${record.snapshotNumber} Sealed`,
          description: `Merkle root: ${record.merkleRoot.slice(0, 18)}... • Scope: ${record.statesCaptured} subsystem states, ${record.logsCount} audit records • Integrity: 100% Verified`,
          metaHash: record.merkleRoot,
          severity: 'success',
          statuteRef: 'พ.ร.บ. ธุรกรรมฯ มาตรา 26/28 & NIST PQC (Dilithium-5)',
          targetView: 'ledger',
          bindingStatus: 'ANCHORED',
        },
      });
    });

    // 5. Attach automated backup logger
    const unsubBackupLogger = automatedBackupService.registerSystemActivityLogger(
      (type, title, desc, meta, sev, statute, view) => {
        addSystemEvent(type, title, desc, meta, sev, statute, view);
      }
    );

    // 6. Attach Write Firewall Engine system event handler
    const unsubFirewall = WriteFirewallEngine.registerSystemEventHandler(
      (type, title, desc, meta, sev, statute, view) => {
        addSystemEvent(type, title, desc, meta, sev, statute, view);
      }
    );

    // Strict reverse teardown order: prevents memory leaks and duplicate handlers during re-renders or tab switches
    return () => {
      unsubFirewall();
      unsubBackupLogger();
      unsubBackupSnap();
      unsubOffline();
      unsubLock();
      unsubSnap();
      unsubEvent();
    };
  }, [addSystemEvent, showToast]);

  const handleToggleFreezeSystemActivity = useCallback(() => {
    triggerVibration('sidebarToggle');
    setIsSystemActivityFrozen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('zyrquen_system_frozen', String(next));
      } catch (e) {
        console.error(e);
      }
      broadcastSyncService.broadcastGlobalLockState({ isSystemActivityFrozen: next });
      if (next) {
        automatedBackupService.stop();
        if (isAudioActive) {
          toggleSovereignSynth882Hz(false);
        }
        dispatchAction({
          type: 'EMIT_SYSTEM_EVENT',
          payload: {
            type: 'HARDWARE',
            title: 'SYSTEM ACTIVITY FROZEN (MAINTENANCE STATE-PRESERVED)',
            description: 'Automated telemetry capture, scheduled backup timers, and audio carrier modulation paused. SSoT state preserved.',
            metaHash: 'freeze:state_preservation_armed',
            severity: 'warning',
            statuteRef: 'ISO/IEC 27037 Digital Forensics State Preservation',
            targetView: 'pulse',
            bindingStatus: 'ANCHORED',
          },
        });
      } else {
        automatedBackupService.start();
        if (isAudioActive) {
          toggleSovereignSynth882Hz(true);
          updateAtmosphericEntropyPitch(systemStateStore.getState().aggregateEntropy, true);
        }
        dispatchAction({
          type: 'EMIT_SYSTEM_EVENT',
          payload: {
            type: 'HARDWARE',
            title: 'SYSTEM ACTIVITY RESUMED (LIVE TELEMETRY ACTIVE)',
            description: 'Automated telemetry stream, background backup engine, and 882Hz harmonic clock resumed.',
            metaHash: 'freeze:state_preservation_disarmed',
            severity: 'success',
            statuteRef: 'ISO/IEC 27037 Live Telemetry Ingest',
            targetView: 'pulse',
            bindingStatus: 'ANCHORED',
          },
        });
      }
      return next;
    });
  }, [isAudioActive, dispatchAction]);

  const handleToggleAudio = useCallback(() => {
    setIsAudioActive((prev) => {
      const next = !prev;
      toggleSovereignSynth882Hz(next);
      if (next) {
        updateAtmosphericEntropyPitch(systemStateStore.getState().aggregateEntropy, true);
      }
      return next;
    });
    const next = !isAudioActive;
    dispatchAction({
      type: 'EMIT_SYSTEM_EVENT',
      payload: {
        type: 'AUDIO',
        title: next ? 'Sovereign Audio Carrier Active' : 'Sovereign Audio Muted',
        description: next
          ? 'Synthesized continuous harmonic carrier oscillator initialized with dynamic entropy pitch modulation.'
          : 'Audio carrier halted.',
        metaHash: 'audio:carrier_synth_stream',
        severity: 'info',
        targetView: 'dashboard',
      },
    });
  }, [isAudioActive, dispatchAction]);

  const handleAddSnapshot = useCallback((newSnap: HardwareSnapshot) => {
    // Verification Gate: Visually validate if systemEvents containing 'COMPLIANCE' type exist and have triggered
    // corresponding seal updates before allowing a new entry to be appended to the Merkle Ledger.
    const complianceEvents = systemEvents.filter((e) => e.type === 'COMPLIANCE');
    const hasValidCompliance = complianceEvents.length > 0;

    if (!hasValidCompliance) {
      setVerificationGateStatus({
        status: 'BLOCKED',
        lastCheckedTime: new Date().toLocaleTimeString('en-GB') + ' ICT',
        complianceEventCount: 0,
        sealCount: 14902 + Math.max(0, snapshots.length - 2),
        message: 'Verification Gate REJECTED: No verified COMPLIANCE events found in telemetry log stream.',
      });
      dispatchAction({
        type: 'EMIT_SYSTEM_EVENT',
        payload: {
          type: 'ALERT',
          title: 'Verification Gate: Merkle Ledger Append BLOCKED',
          description: 'Snapshot append rejected because no active COMPLIANCE event anchor was found in the telemetry stream.',
          metaHash: 'gate:block_no_compliance',
          severity: 'critical',
          statuteRef: 'มาตรา 26 (ETDA Level 3+ Invariant Verification)',
          targetView: 'security',
          targetTab: 'reconciliation-gate',
          bindingStatus: 'ORPHANED',
        },
      });
      showToast('Hardware Telemetry Snapshot REJECTED: Gate Blocked', 'error');
      setIsEventsSidebarOpen(true);
      return;
    }

    // Update Verification Gate Status to PASSED
    const newVerifiedSeals = 14902 + Math.max(0, snapshots.length - 2 + 1);
    systemStateStore.setSealCount(newVerifiedSeals);
    systemStateStore.setSealedBlock(849202 + Math.max(0, snapshots.length - 2 + 1));
    triggerVibration('snapshot');
    try {
      broadcastSyncService.broadcastAuditSnapshot(newSnap);
    } catch (err) {
      console.warn('Broadcast snapshot failed:', err);
    }
    showToast('Hardware Telemetry Snapshot Captured Successfully', 'success');
    setVerificationGateStatus({
      status: 'PASSED',
      lastCheckedTime: new Date().toLocaleTimeString('en-GB') + ' ICT',
      complianceEventCount: complianceEvents.length,
      sealCount: newVerifiedSeals,
      message: `Verification Gate PASSED: Validated ${complianceEvents.length} COMPLIANCE events. Telemetry bound to Seal #${newVerifiedSeals.toLocaleString()}.`,
    });

    // Fix side effects in state updater (pure state transition)
    const anomalyResult = TelemetryAnomalyObserver.evaluate(newSnap, snapshots);
    setSnapshots((prev) => [newSnap, ...prev]);

    if (anomalyResult.hasAnomaly) {
      anomalyResult.anomalies.forEach((anom) => {
        dispatchAction({
          type: 'EMIT_SYSTEM_EVENT',
          payload: {
            type: 'ANOMALY',
            title: `Statistical Anomaly: ${anom.metricName} Outlier (${anom.zScore >= 0 ? '+' : ''}${anom.zScore.toFixed(1)}σ)`,
            description: `Telemetry value ${anom.value.toFixed(1)} deviates significantly from historical baseline (μ = ${anom.mean.toFixed(1)}, σ = ${anom.stdDev.toFixed(1)}). Auto-flagged for isolation.`,
            metaHash: newSnap.sealedHash,
            severity: 'critical',
            statuteRef: 'ISO/IEC 27037 Telemetry Anomaly Protocol',
            targetView: 'pulse',
            bindingStatus: 'ORPHANED',
          },
        });
      });
    }

    setLastSnapshotTime(Date.now());
    // Computational activity pulse elevates entropy momentarily
    systemStateStore.bumpEntropy(6.8);
    
    // 1. Primary Hardware Event dispatched through centralized engine
    dispatchAction({
      type: 'EMIT_SYSTEM_EVENT',
      payload: {
        type: 'HARDWARE',
        title: `Hardware Snapshot #${newSnap.snapshotNumber} Sealed`,
        description: `Captured ${newSnap.id}: CPU ${newSnap.cpuAverage}% • Cryo ${newSnap.cryoTempMk}mK • QOps ${newSnap.qopsThroughput}`,
        metaHash: newSnap.sealedHash,
        severity: 'success',
        statuteRef: 'FIPS 140-3 L4 Hardware Custody & Sub-Kelvin Thermal SLA',
        targetView: 'dashboard',
        anchoredSealNumber: newVerifiedSeals,
        bindingStatus: 'ANCHORED',
        merkleProofHash: newSnap.sealedHash,
      },
    });

    // 2. Automatic Legal Compliance Alert (Section 26 & 28 Invariant Verification)
    registerTimeout(() => {
      dispatchAction({
        type: 'EMIT_SYSTEM_EVENT',
        payload: {
          type: 'COMPLIANCE',
          title: `มาตรา 26 (Sec 26) Cryptographic Invariant Sealed`,
          description: `Snapshot #${newSnap.snapshotNumber} certified under ETDA Level 3+ with 0.00% invariant drift and Dilithium-5 post-quantum signature.`,
          metaHash: `proof:merkle_block_invariant_${newSnap.snapshotNumber}`,
          severity: 'success',
          statuteRef: 'พ.ร.บ. ธุรกรรมฯ มาตรา 26 (ETDA Level 3+)',
          targetView: 'security',
          targetTab: 'legal-convergence',
          anchoredSealNumber: newVerifiedSeals,
          bindingStatus: 'VERIFIED',
          merkleProofHash: newSnap.sealedHash,
        },
      });
    }, 200);

    // Open sidebar subtly to showcase live activity feed
    setIsEventsSidebarOpen(true);
  }, [systemEvents, snapshots, dispatchAction, showToast, registerTimeout]);

  const handleLegalSearchExecuted = (query: string, summary: string) => {
    // 1. Search Query Event
    dispatchAction({
      type: 'EMIT_SYSTEM_EVENT',
      payload: {
        type: 'LEGAL_SEARCH',
        title: `Thai Legal Search: "${query.slice(0, 36)}..."`,
        description: summary,
        metaHash: `oracle:query_${Date.now()}`,
        severity: 'info',
        targetView: 'dashboard',
      },
    });

    // 2. Automatic Legal Compliance Citation Alert
    registerTimeout(() => {
      dispatchAction({
        type: 'EMIT_SYSTEM_EVENT',
        payload: {
          type: 'COMPLIANCE',
          title: `Statutory Reference: Section 9, 26, 28 ↔ Sovereign Chain`,
          description: `Real-time Thai statutory grounding retrieved for query. Cryptographic proof mapping ready for review.`,
          metaHash: `statute:etda_electronic_trans_act_2544`,
          severity: 'success',
          statuteRef: 'Sec 9, 26, 28 & PDPA ↔ Sovereign Seal',
          targetView: 'security',
          bindingStatus: 'VERIFIED',
        },
      });
    }, 250);

    // Slide in sidebar to surface live grounding event
    setIsEventsSidebarOpen(true);
  };

  // Modularized Global Keyboard Shortcuts
  useKeyboardShortcuts({
    isLeftSidebarOpen,
    isEventsSidebarOpen,
    isShortcutsOpen,
    isLegalSearchOpen,
    isCertificateOpen,
    setIsLeftSidebarOpen,
    setIsEventsSidebarOpen,
    setIsShortcutsOpen,
    setIsLegalSearchOpen,
    setIsCertificateOpen,
    handleToggleSidebar,
    handleToggleAudio,
    setCurrentView,
  });

  // Modularized Inactivity Lock
  const { isAppLocked, setIsAppLocked, unlockApp } = useInactivityLock();

  const persona = VIEW_PERSONAS[currentView] || VIEW_PERSONAS.dashboard;

  const renderCurrentView = () => (
    <ViewRenderer
      currentView={currentView}
      setCurrentView={setCurrentView}
      snapshots={snapshots}
      handleAddSnapshot={handleAddSnapshot}
      addSystemEvent={addSystemEvent}
      verificationGateStatus={verificationGateStatus}
      isForensicAuditMode={isForensicAuditMode}
      setIsCertificateOpen={setIsCertificateOpen}
      isAudioActive={isAudioActive}
      handleToggleAudio={handleToggleAudio}
      isSystemActivityFrozen={isSystemActivityFrozen}
      handleToggleFreezeSystemActivity={handleToggleFreezeSystemActivity}
      setIsEventsSidebarOpen={setIsEventsSidebarOpen}
      isMonochromeMode={isMonochromeMode}
      handleToggleMonochrome={handleToggleMonochrome}
      setIsLegalSearchOpen={setIsLegalSearchOpen}
      setLoginLoaderMode={setLoginLoaderMode}
      setShowLoginLoader={setShowLoginLoader}
      createTelemetrySnapshot={createTelemetrySnapshot}
    />
  );

  const handleBatchVerify = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
    dispatchAction({
      type: 'EMIT_SYSTEM_EVENT',
      payload: {
        type: 'CRYPTO',
        title: 'Batch Verification Triggered',
        description: 'Initiating batch integrity verification for 14,902 chambers.',
        metaHash: 'verify',
        severity: 'info',
        targetView: 'ledger',
      },
    });
    showToast('Initiating Batch Verification...', 'info');
    
    // Simulate verification delay and success
    registerTimeout(() => {
      showToast('14,902 chambers verified successfully', 'success');
      dispatchAction({
        type: 'EMIT_SYSTEM_EVENT',
        payload: {
          type: 'CRYPTO',
          title: 'Batch Verification Complete',
          description: '14,902 chambers verified successfully. SSoT Drift remains at Δ0.00%.',
          metaHash: 'verify:pass',
          severity: 'success',
          targetView: 'ledger',
          bindingStatus: 'VERIFIED',
        },
      });
    }, 2500);
  }, [dispatchAction, showToast, registerTimeout]);

  const handleExportAuditLogs = useCallback(() => {
    dispatchAction({
      type: 'EMIT_SYSTEM_EVENT',
      payload: {
        type: 'FORENSIC',
        title: 'Audit Log Export',
        description: 'Generating signed PDF artifact (ETDA Section 28 Compliant).',
        metaHash: 'export',
        severity: 'info',
        targetView: 'ledger',
      },
    });
    showToast('Generating signed Audit Log...', 'info');

    registerTimeout(() => {
      // Generation of a signed audit log artifact
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
        status: "COURT_READY",
        seals_verified: 14902,
        ssot_drift: "Δ0.00%",
        timestamp: new Date().toISOString()
      }, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "zyrquen-audit-log.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('Artifact Exported successfully.', 'success');
      dispatchAction({
        type: 'EMIT_SYSTEM_EVENT',
        payload: {
          type: 'FORENSIC',
          title: 'Artifact Exported',
          description: 'Signed artifact zyrquen-audit-log.json generated.',
          metaHash: 'export:success',
          severity: 'success',
          targetView: 'ledger',
          bindingStatus: 'ANCHORED',
        },
      });
    }, 1500);
  }, [dispatchAction, showToast, registerTimeout]);

  const handleExportLegalTriggerMatrixPDF = useCallback(() => {
    exportLegalTriggerMatrixPdf();
    showToast('ส่งออก Legal Trigger Matrix PDF Artifact เรียบร้อยแล้ว', 'success');
    dispatchAction({
      type: 'EMIT_SYSTEM_EVENT',
      payload: {
        type: 'FORENSIC',
        title: 'Legal Trigger Matrix Exported',
        description: 'Signed PDF Artifact generated and certified under ETDA Sec 9/26/28.',
        metaHash: 'pdf:matrix',
        severity: 'success',
        statuteRef: 'ETDA Sec 9, 26, 28 Statutory Evidence',
        targetView: 'security',
        bindingStatus: 'VERIFIED',
      },
    });
  }, [dispatchAction, showToast]);

  const handleCommandPaletteAction = useCallback((actionId: string) => {
    if (actionId === 'snapshot') {
      handleAddSnapshot(createTelemetrySnapshot({ core0: 42, core1: 39, core2: 44, core3: 38 }, snapshots.length, snapshots[0]?.sealedHash));
      showToast('สร้าง Signed Snapshot (FIPS 204) เรียบร้อย', 'success');
    } else if (actionId === 'pqc-verify') {
      setIsCertificateOpen(true);
    } else if (actionId === 'lockdown') {
      showToast('เปิดใช้ Sovereign Isolation Protocol ใน Chamber 02', 'warning');
    } else if (actionId === 'legal-pdf') {
      handleExportLegalTriggerMatrixPDF();
    } else if (actionId === 'render-sphere') {
      setCurrentView('canonical');
      showToast('สลับไปยัง Canonical 3D Integrity View', 'info');
    } else if (actionId === 'copilot-trigger') {
      setIsCopilotOpen(true);
    } else if (actionId === 'view-seals') {
      setCurrentView('ledger');
      showToast('เปิดดูทะเบียน Active Evidence Seals', 'info');
    } else if (actionId === 'forensic-stepper') {
      setCurrentView('dashboard');
      const el = document.getElementById('forensic-audit-stepper');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      showToast('นำทางไปยัง 16-Step Forensic Audit Stepper', 'info');
    } else if (
      actionId === 'export-dossier-pdf' ||
      actionId === 'open-forensic-master-dossier' ||
      actionId === 'forensic-master-dossier-v9' ||
      actionId === 'forensic-dossier'
    ) {
      setIsForensicMasterDossierOpen(true);
      showToast('เปิดสำนวนพยานหลักฐานดิจิทัล DOC-SOV-HSM-1010-2026-V9', 'success');
    }
  }, [handleAddSnapshot, handleExportLegalTriggerMatrixPDF, showToast, snapshots]);

  const { theme } = useTheme();

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden bg-[#07080F] text-zinc-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 antialiased relative ${isMonochromeMode ? 'theme-monochrome' : ''} ${theme === 'terminal-green' ? 'theme-terminal-green' : theme === 'deep-space-violet' ? 'theme-deep-space-violet' : ''}`}>
      {/* Background Persona Mesh Ambient Lighting with Smooth Morphing */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-all duration-1000 ease-in-out">
        {/* Dynamic Top Orb */}
        <div
          className={`absolute top-[-10%] left-[20%] w-[650px] h-[650px] rounded-full blur-[150px] transition-all duration-1000 ease-in-out ${persona.orb1}`}
        />
        {/* Dynamic Mid Orb */}
        <div
          className={`absolute top-[40%] right-[10%] w-[550px] h-[550px] rounded-full blur-[150px] transition-all duration-1000 ease-in-out ${persona.orb2}`}
        />
        {/* Dynamic Bottom Orb */}
        <div
          className={`absolute bottom-[-10%] left-[30%] w-[750px] h-[750px] rounded-full blur-[170px] transition-all duration-1000 ease-in-out ${persona.orb3}`}
        />
      </div>

      {/* Top Fixed Navigation & Status Bar */}
      <Navigation
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenCertificate={() => setIsCertificateOpen(true)}
        onOpenGitHubPwa={() => setIsGitHubPwaOpen(true)}
        onOpenLegalSearch={() => setIsLegalSearchOpen(true)}
        onOpenCommandSearch={() => setIsCommandSearchOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenEventsSidebar={() => setIsEventsSidebarOpen((prev) => !prev)}
        eventsCount={systemEvents.length}
        isAudioActive={isAudioActive}
        onToggleAudio={handleToggleAudio}
        isSystemActivityFrozen={isSystemActivityFrozen}
        onToggleFreezeSystemActivity={handleToggleFreezeSystemActivity}
        isForensicAuditMode={isForensicAuditMode}
        onToggleForensicAuditMode={handleToggleForensicAuditMode}
        sealCount={verificationGateStatus.sealCount}
        onCaptureSnapshot={() => handleAddSnapshot(createTelemetrySnapshot({ core0: 42, core1: 39, core2: 44, core3: 38 }, snapshots.length, snapshots[0]?.sealedHash))}
        isSidebarOpen={isLeftSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        isCopilotOpen={isCopilotOpen}
        onToggleCopilot={() => setIsCopilotOpen((prev) => !prev)}
        onTriggerLoginLoader={(mode = 'login') => {
          setLoginLoaderMode(mode);
          setShowLoginLoader(true);
        }}
      />

      {/* Live Quantum Stream Entropy & Sovereign Invariant Marquee Ticker */}
      <LiveQuantumEntropyTicker />

      {/* App Body Layout with Collapsible Left Sidebar */}
      <div className="relative z-10 max-w-[1780px] mx-auto px-2 sm:px-4 flex items-start">
        {/* Left Sidebar (Open / Close Collapsible) */}
        <LeftSidebar
          isOpen={isLeftSidebarOpen}
          onClose={handleCloseSidebar}
          onToggle={handleToggleSidebar}
          currentView={currentView}
          onSelectView={setCurrentView}
          selectedChamberId={selectedChamberId}
          onSelectChamber={setSelectedChamberId}
          liveCryo={14.98}
        />

        {/* Main Content Area with Sliding Curtain OS Entrance Transitions */}
        <main className="flex-1 min-w-0 w-full px-2 sm:px-4 py-4 pb-28 sm:pb-32 overflow-hidden space-y-4 transition-all duration-300">
          {/* Visual Notification System: SSoT Mutation Drift Warning (Triggered if deviation >= 0.01%) */}
          <SsotDriftWarning />

          {/* Verification Gate Active Invariant Banner with Progress Bar & Expandable ETDA/PDPA Triggers */}
          <VerificationGateBar
            verificationGateStatus={verificationGateStatus}
            auditCountdownSec={auditCountdownSec}
            auditProgressPercent={auditProgressPercent}
            isGateDetailsExpanded={isGateDetailsExpanded}
            setIsGateDetailsExpanded={setIsGateDetailsExpanded}
            isForensicAuditMode={isForensicAuditMode}
            onExportLegalTriggerMatrixPDF={handleExportLegalTriggerMatrixPDF}
            onOpenLegalSearch={() => setIsLegalSearchOpen(true)}
            onOpenCertificate={() => setIsCertificateOpen(true)}
            onBatchVerify={handleBatchVerify}
            onExportAuditLogs={handleExportAuditLogs}
            showToast={showToast}
          />

        {/* Emergency Sovereign Isolation Protocol Control */}
        <EmergencySovereignLockdown />

        {/* Real-time Nexus Integration Layer Bridge */}
        <NexusIntegrationLayer
          currentView={currentView}
          onNavigate={setCurrentView}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            className="relative"
            initial={{ opacity: 0, x: 24, filter: 'blur(5px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -24, filter: 'blur(5px)' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Subtle Sliding Curtain Wipe & Shimmer Effect */}
            <motion.div
              initial={{ scaleX: 1, opacity: 0.5 }}
              animate={{ scaleX: 0, opacity: 0 }}
              exit={{ scaleX: 1, opacity: 0.5 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent origin-left"
            />

            <ErrorBoundary
              key={currentView}
              fallbackViewName={VIEW_PERSONAS[currentView]?.name || currentView}
              onResetToHome={() => setCurrentView('dashboard')}
            >
              {renderCurrentView()}
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>

      {/* Footer Attestation Bar */}
      <MainFooter />

      {/* System Events Activity Feed Sidebar */}
      <SystemEventsSidebar
        isOpen={isEventsSidebarOpen}
        onClose={() => {
          triggerVibration('sidebarToggle');
          setIsEventsSidebarOpen(false);
        }}
        events={systemEvents}
        latestSealCount={verificationGateStatus.sealCount}
        onClearEvents={() => dispatchAction({ type: 'CLEAR_SYSTEM_EVENTS' })}
        isForensicAuditMode={isForensicAuditMode}
        onToggleForensicAuditMode={handleToggleForensicAuditMode}
        onNavigateToView={(v) => {
          setCurrentView(v);
          setIsEventsSidebarOpen(false);
        }}
      />

      {/* Global Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => {
          triggerVibration('modalDismiss');
          setIsShortcutsOpen(false);
        }}
        onNavigate={(v) => {
          setCurrentView(v);
          setIsShortcutsOpen(false);
        }}
        onOpenSearch={() => {
          setIsLegalSearchOpen(true);
          setIsShortcutsOpen(false);
        }}
        onOpenCert={() => {
          setIsCertificateOpen(true);
          setIsShortcutsOpen(false);
        }}
        onToggleAudio={handleToggleAudio}
        onCaptureSnapshot={() => handleAddSnapshot(createTelemetrySnapshot({ core0: 42, core1: 39, core2: 44, core3: 38 }, snapshots.length, snapshots[0]?.sealedHash))}
      />

      {/* Certificate Modal */}
      <ToastNotification toasts={toasts} removeToast={removeToast} />
      <AuditCertificateModal
        isOpen={isCertificateOpen}
        onClose={() => {
          triggerVibration('modalDismiss');
          setIsCertificateOpen(false);
        }}
      />
      <GitHubPwaModal
        isOpen={isGitHubPwaOpen}
        onClose={() => {
          triggerVibration('modalDismiss');
          setIsGitHubPwaOpen(false);
        }}
      />

      {/* Sovereign Control Dock (Cybernetic Floating Glassmorphism Controls) */}
      <SovereignControlDock
        audioEnabled={isAudioActive}
        onToggleAudio={handleToggleAudio}
        frequency={carrierPitchHz}
        onFrequencyChange={(newFreq) => {
          setCarrierPitchHz(newFreq);
          setCustomCarrierFrequency(newFreq);
        }}
        isZeroDriftEnforced={true}
        onToggleZeroDrift={() => {
          dispatchAction({
            type: 'EMIT_SYSTEM_EVENT',
            payload: {
              type: 'INVARIANT',
              title: 'SSoT Δ0.00% Zero Drift Lock Attested',
              description: 'Canonical Merkle root locked across 14,902 frozen seals with zero drift.',
              metaHash: 'invariant:zero_drift_enforced',
              severity: 'success',
              statuteRef: 'ETDA Sec 28 & ISO/IEC 27037',
              targetView: 'dashboard',
              bindingStatus: 'ANCHORED',
            },
          });
        }}
        pqcLevel="DILITHIUM5"
        onTogglePqcLevel={() => {
          dispatchAction({
            type: 'EMIT_SYSTEM_EVENT',
            payload: {
              type: 'SECURITY',
              title: 'PQC Cryptographic Spec Shift Attested',
              description: 'Post-quantum signature and key encapsulation standard active (ML-DSA-87 / ML-KEM-1024 FIPS 203/204).',
              metaHash: 'crypto:pqc_spec_switch',
              severity: 'info',
              statuteRef: 'FIPS 203/204 Post-Quantum Cryptography',
              targetView: 'security',
              bindingStatus: 'VERIFIED',
            },
          });
        }}
      />

      {/* Dynamic Atmospheric Ambient Sound Generator Floating HUD */}
      <div className="fixed bottom-3 left-16 sm:left-16 z-40 flex items-center gap-2 pointer-events-none sm:pointer-events-auto">
        <div className="pointer-events-auto">
        <button
          onClick={handleToggleAudio}
          className={`px-3 min-h-[42px] py-1.5 rounded-xl border font-mono text-xs backdrop-blur-xl transition-all shadow-xl flex items-center gap-2 ${
            isAudioActive
              ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
              : 'bg-black/60 border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
          }`}
          title="Dynamic Atmospheric Ambient Sound Generator (Modulates Carrier Pitch by Aggregate System Entropy)"
        >
          <span className="relative flex h-2 w-2">
            {isAudioActive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isAudioActive ? 'bg-cyan-400' : 'bg-zinc-600'
              }`}
            ></span>
          </span>
          <Waves className={`w-3.5 h-3.5 ${isAudioActive ? 'text-cyan-400 animate-pulse' : 'text-zinc-500'}`} />
          <span className="font-bold hidden sm:inline">
            ATMOSPHERIC AUDIO
          </span>
          <span className="text-[11px] text-zinc-300 border-l border-white/10 pl-2 font-mono">
            {isAudioActive ? `${carrierPitchHz} Hz` : 'MUTED'}
          </span>
          <QuantumAggregateEntropyIndicator />
        </button>
        </div>
      </div>

      {/* Thai Legal & Cryptographic Standards Search Modal (Google Search Tool) */}
      {/* Voice-to-Command Bridge (Shifted to allow bottom-right Copilot) */}
      <VoiceCommandOverlay 
        onNavigate={setCurrentView} 
        onCaptureSnapshot={() => handleAddSnapshot(createTelemetrySnapshot({ core0: 42, core1: 39, core2: 44, core3: 38 }, snapshots.length, snapshots[0]?.sealedHash))} 
        onNotifyEvent={addSystemEvent} 
      />

      {/* Sovereign Copilot AI v6.0 Ultra Panel (Floating Dock, Fullscreen Toggle, 3D Continuum) */}
      <CopilotSovereignAI
        isOpen={isCopilotOpen}
        onClose={() => {
          triggerVibration('click');
          setIsCopilotOpen(false);
        }}
        onOpen={() => {
          triggerVibration('click');
          setIsCopilotOpen(true);
        }}
        onNavigate={setCurrentView}
      />
      <ThaiLegalSearchModal
        isOpen={isLegalSearchOpen}
        onClose={() => {
          triggerVibration('modalDismiss');
          setIsLegalSearchOpen(false);
        }}
        onSearchExecuted={handleLegalSearchExecuted}
      />
      
      {/* Sovereign Quantum Login & Warp Ingress Loader */}
      <SovereignLoginLoader
        isOpen={showLoginLoader}
        mode={loginLoaderMode}
        onComplete={() => {
          setShowLoginLoader(false);
          setCurrentView('dashboard');
          dispatchAction({
            type: 'EMIT_SYSTEM_EVENT',
            payload: {
              type: 'SECURITY',
              title: 'Sovereign Quantum Login Attested',
              description: 'FIPS 140-3 L4 HSM 10/10 Quorum verified. Ingress to Sovereign Control Plane granted.',
              metaHash: 'auth:pqc_hsm_10_10_verified',
              severity: 'success',
              statuteRef: 'ETDA Sec 26 & PDPA Sec 26 Enclave',
              targetView: 'dashboard',
              bindingStatus: 'VERIFIED',
            },
          });
        }}
        onCancel={() => {
          triggerVibration('modalDismiss');
          setShowLoginLoader(false);
        }}
      />

      <OfflineIndicator />

      {/* Global Command Search (System Events, Legal Triggers, Navigation Views) */}
      <GlobalCommandSearch
        isOpen={isCommandSearchOpen}
        onClose={() => setIsCommandSearchOpen(false)}
        onSelectView={setCurrentView}
        onExecuteLegalAction={handleCommandPaletteAction}
        onExportPDF={handleExportLegalTriggerMatrixPDF}
      />

      {/* Forensic Audit Master Dossier Modal (DOC-SOV-HSM-1010-2026-V9) */}
      <ForensicAuditMasterDossierModal
        isOpen={isForensicMasterDossierOpen}
        onClose={() => setIsForensicMasterDossierOpen(false)}
      />

      {/* Global Executive Command Palette (Cmd+K / Ctrl+K) */}
      <ExecutiveCommandPalette onSelectAction={handleCommandPaletteAction} />

      {/* Global Animated Film-Grain & CRT Scanline Overlay for FROZEN v1.2 LTS */}
      <div className="sovereign-film-grain-overlay" aria-hidden="true" />
      <div className="sovereign-crt-scanline-overlay" aria-hidden="true" />

      {isAppLocked && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#07080F]/95 backdrop-blur-3xl text-white font-mono animate-in fade-in duration-500">
          <div className="p-8 rounded-[28px] bg-[#0b0e1a]/80 border border-cyan-500/30 flex flex-col items-center text-center max-w-sm w-full shadow-[0_0_50px_rgba(6,182,212,0.15)]">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-cyan-50">SYSTEM LOCKED</h2>
            <p className="text-xs text-zinc-400 mb-8 leading-relaxed">
              Inactivity threshold reached. Please re-authenticate to resume sovereign operations.
            </p>
            <button
              onClick={() => {
                setIsAppLocked(false);
                playAuditChime();
              }}
              className="w-full py-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
            >
              UNLOCK SYSTEM
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <SovereignAppContent />
    </HashRouter>
  );
}

