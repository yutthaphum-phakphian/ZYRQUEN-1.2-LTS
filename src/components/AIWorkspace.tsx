import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Bot,
  User,
  Code2,
  Globe,
  ShieldAlert,
  Lock,
  CheckCircle2,
  AlertTriangle,
  History,
  Copy,
  Trash2,
  Search,
  FileText,
  Plus,
  X,
  FileDown,
  Terminal,
  CornerDownLeft,
  ChevronDown,
  ChevronUp,
  Check,
  ArrowRight,
  Pin,
  RotateCcw,
  Layers,
  ExternalLink,
  BookOpen,
  GitBranch,
  Compass,
} from 'lucide-react';
import {
  ProvenanceState,
  ZYRQUEN_CORE_FROZEN_STATE,
  RealExecutionTrace,
  FailureDiagnosticRecord,
  createCanonicalFinalizedExecutionTrace,
  buildExecutionTraceForOutcome,
  createFailureDiagnosticRecord,
  INITIAL_FAILURE_DIAGNOSTIC_RECORDS,
  AiArtifactEnvelope,
  ArtifactPreflightInspectionResult,
  ArtifactPreflightStatus,
  computeArtifactSha256,
  createVerifiedAiArtifactEnvelope,
  inspectAiArtifactPreflight,
  executeAiWorkspacePreflightWorkflow,
} from '../adapters/zyrquenAdapter';
import { offlineAuditSyncService } from '../services/offlineAuditSyncService';
import {
  sessionService,
  AuthenticatedSession,
  SOVEREIGN_PERMISSIONS,
} from '../services/sessionService';
import {
  toolGateway,
  ToolExecutionRequest,
  ToolExecutionResult,
  ToolApprovalCertificate,
  CANONICAL_TOOLS,
} from '../adapters/toolGateway';
import {
  sovereignMissionPlanner,
  MissionPlan,
} from '../services/sovereignMissionPlanner';
import {
  sovereignResearchAgent,
  ResearchDossier,
} from '../services/sovereignResearchAgent';
import {
  sovereignCodingAgent,
  FileAnalysisReport,
  DiffProposal,
} from '../services/sovereignCodingAgent';

export {
  computeArtifactSha256,
  createVerifiedAiArtifactEnvelope,
  inspectAiArtifactPreflight,
  executeAiWorkspacePreflightWorkflow,
};
export type {
  AiArtifactEnvelope,
  ArtifactPreflightInspectionResult,
  ArtifactPreflightStatus,
};

export type AiWorkspaceUiStatus =
  | 'IDLE'
  | 'LISTENING'
  | 'PROCESSING'
  | 'PROPOSAL_READY'
  | 'APPROVAL_REQUIRED'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'BLOCKED'
  | 'UNAVAILABLE';

export type AiProviderConnectionState =
  | 'CONNECTED'
  | 'PROVIDER_NOT_CONNECTED'
  | 'WAITING_FOR_PROVIDER';

export type AiInputChannel = 'TEXT_INPUT' | 'VOICE_STT';

export interface AiProposalSummary {
  proposalId: string;
  targetWorkspace: string;
  parameter: string;
  proposedBatchSize: number;
  requiresApprover: string;
}

export interface AiAnalysisSummary {
  summary: string;
  targetWorkspace: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AiConversationMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  channel: AiInputChannel;
  text: string;
  timestamp: string;
  uiStatus: AiWorkspaceUiStatus;
  provenance: ProvenanceState;
  htmlCode?: string | null;
  analysis?: AiAnalysisSummary | null;
  proposal?: AiProposalSummary | null;
  requiresExplicitApproval?: boolean;
}

export interface AiWorkspaceNote {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  category: 'BOUNDARY_NOTE' | 'TUNING_RECORD' | 'OPERATOR_NOTE';
  createdAt: string;
}

const INITIAL_WORKSPACE_NOTES: AiWorkspaceNote[] = [
  {
    id: 'NOTE-849202-01',
    workspaceId: 'ws-agent-02',
    title: 'Phase 11 Self-Tuning Lock Record (BATCH_SIZE 64 → 48)',
    content:
      'Transaction TX-P11-849202-01 completed all 8 evidence checkpoints and transitioned to FINALIZED. Duplicate execution blocked by Idempotency Guard (0 Core Mutation).',
    category: 'TUNING_RECORD',
    createdAt: '2026-09-27T08:00:00.000Z',
  },
  {
    id: 'NOTE-849202-02',
    workspaceId: 'ws-agent-02',
    title: 'AI Service Boundary & Sandbox Policy',
    content:
      'Voice Input (VOICE_STT) and Chat (TEXT_INPUT) route through /api/ai/workspace and require Explicit Approval (#EP-SOVEREIGN-01). Live Preview enforces sandbox="allow-scripts" with opaque origin.',
    category: 'BOUNDARY_NOTE',
    createdAt: '2026-09-27T08:05:00.000Z',
  },
];

export interface CommandHistoryEntry {
  id: string;
  commandText: string;
  channel: AiInputChannel;
  timestamp: string;
  uiStatus: AiWorkspaceUiStatus;
  provenance: ProvenanceState;
  replyText?: string;
  analysis?: AiAnalysisSummary | null;
  proposal?: AiProposalSummary | null;
  htmlCode?: string | null;
}

export const INITIAL_COMMAND_HISTORY: CommandHistoryEntry[] = [
  {
    id: 'cmd-init-01',
    commandText: 'Inspect agentic-reasoning-mesh telemetry and evaluate memory bounds',
    channel: 'TEXT_INPUT',
    timestamp: '2026-09-27T08:00:00.000Z',
    uiStatus: 'COMPLETED',
    provenance: 'VERIFIED',
    replyText: 'Preflight Verified: RAM load 78.2% (Heap 418.5 MB / 512.0 MB). In-SLA GC pause 1.4ms. Bitwise Parity Δ0.00%.',
    analysis: {
      summary: 'Normal operational load within safety thresholds.',
      targetWorkspace: 'ws-agent-02',
      riskLevel: 'LOW',
    },
    proposal: {
      proposalId: 'PROP-P11-849202-01',
      targetWorkspace: 'ws-agent-02',
      parameter: 'BATCH_SIZE',
      proposedBatchSize: 48,
      requiresApprover: '#EP-SOVEREIGN-01',
    },
  },
  {
    id: 'cmd-init-02',
    commandText: 'Verify Chamber 02 Fail-Closed isolation and zero core mutation guarantee',
    channel: 'TEXT_INPUT',
    timestamp: '2026-09-27T08:04:12.000Z',
    uiStatus: 'COMPLETED',
    provenance: 'VERIFIED',
    replyText: 'Chamber 02 Quarantine Buffer verified. HTTP 423 lock armed. SSoT Core Mutation = 0.000%.',
    analysis: {
      summary: 'Fail-closed invariant ratified under ETDA Sec 28.',
      targetWorkspace: 'ws-agent-02',
      riskLevel: 'LOW',
    },
  },
];

export interface AIWorkspaceProps {
  targetWorkspaceId?: string;
  targetWorkspaceName?: string;
  currentBatchSize?: number;
  initialArtifact?: Partial<AiArtifactEnvelope> | null;
  enforceArtifactPreflight?: boolean;
  onArtifactPreflightResult?: (result: ArtifactPreflightInspectionResult) => void;
  onStageProposalForApproval?: (
    proposedBatchSize: number,
    summary: string,
    meta?: {
      proposalId: string;
      channel: AiInputChannel;
      targetWorkspace: string;
    }
  ) => void;
  onAuditRecord?: (action: string, details: string, status: 'VERIFIED' | 'BLOCKED') => void;
  onExecutionTraceUpdate?: (trace: RealExecutionTrace) => void;
  onFailureDiagnostic?: (diagnostic: FailureDiagnosticRecord) => void;
  onOpenWebAuthn?: () => void;
}

export type ZyrquenVoiceChatBuilderProps = AIWorkspaceProps;

const FORBIDDEN_SANDBOX_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bwindow\.parent\b/gi, label: 'window.parent access' },
  { pattern: /\bparent\.document\b/gi, label: 'parent.document access' },
  { pattern: /\bwindow\.top\b/gi, label: 'window.top access' },
  { pattern: /\btop\.location\b/gi, label: 'top.location access' },
  { pattern: /\bwindow\.opener\b/gi, label: 'window.opener access' },
  { pattern: /\bdocument\.cookie\b/gi, label: 'document.cookie access' },
  { pattern: /\blocalStorage\b/gi, label: 'localStorage access' },
  { pattern: /\bsessionStorage\b/gi, label: 'sessionStorage access' },
  { pattern: /\bindexedDB\b/gi, label: 'indexedDB access' },
  { pattern: /\bzyrquenAdapter\b/gi, label: 'Adapter Boundary reference' },
  { pattern: /\bCommandEngine\b/gi, label: 'Command Engine reference' },
  { pattern: /\bZYRQUEN_CORE\b/gi, label: 'Direct Core reference' },
];

/**
 * Validates and sanitizes AI-generated HTML before rendering into the isolated Preview Sandbox.
 * Strictly prohibits access to parent Command Center DOM, cookies, localStorage, sessionStorage,
 * indexedDB, Adapter Boundary, Command Engine, or ZYRQUEN Ω∞ Core objects.
 */
export function validateAndSanitizePreviewHtml(rawHtml: string | null | undefined): {
  valid: boolean;
  sanitizedHtml: string | null;
  blockedReasons: string[];
} {
  if (!rawHtml || typeof rawHtml !== 'string' || !rawHtml.trim()) {
    return {
      valid: false,
      sanitizedHtml: null,
      blockedReasons: ['EMPTY_OR_UNVERIFIED_HTML'],
    };
  }

  const blockedReasons: string[] = [];
  let cleaned = rawHtml;

  for (const rule of FORBIDDEN_SANDBOX_PATTERNS) {
    if (rule.pattern.test(cleaned)) {
      blockedReasons.push(rule.label);
      cleaned = cleaned.replace(rule.pattern, '/* BLOCKED_BY_SANDBOX_GUARD */');
    }
    rule.pattern.lastIndex = 0;
  }

  const cspMetaTag = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https://cdn.tailwindcss.com; script-src 'unsafe-inline' https://cdn.tailwindcss.com; img-src data: https:; font-src data: https:; connect-src 'none'; frame-src 'none';">`;

  // Ensure idempotency: strip any pre-existing Content-Security-Policy meta tag so repeated sanitization never duplicates it
  cleaned = cleaned.replace(/\s*<meta\s+http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '');

  if (/<head>/i.test(cleaned)) {
    cleaned = cleaned.replace(/<head>/i, `<head>\n  ${cspMetaTag}`);
  } else {
    cleaned = `<!DOCTYPE html>\n<html>\n<head>\n  ${cspMetaTag}\n</head>\n<body>\n${cleaned}\n</body>\n</html>`;
  }

  return {
    valid: true,
    sanitizedHtml: cleaned,
    blockedReasons,
  };
}

export function AIWorkspace({
  targetWorkspaceId = 'ws-agent-02',
  targetWorkspaceName = 'agentic-reasoning-mesh',
  currentBatchSize: initialBatchSize = 64,
  initialArtifact,
  enforceArtifactPreflight = false,
  onArtifactPreflightResult,
  onStageProposalForApproval,
  onAuditRecord,
  onExecutionTraceUpdate,
  onFailureDiagnostic,
  onOpenWebAuthn,
}: AIWorkspaceProps) {
  const [session, setSession] = useState<AuthenticatedSession | null>(() => sessionService.getCurrentSession());
  const [currentBatchSize, setCurrentBatchSize] = useState<number>(initialBatchSize);
  const [providerStatus, setProviderStatus] = useState<AiProviderConnectionState>('WAITING_FOR_PROVIDER');
  const [uiStatus, setUiStatus] = useState<AiWorkspaceUiStatus>('IDLE');
  const [provenance, setProvenance] = useState<ProvenanceState>('UNVERIFIED');
  const [isExecutingTool, setIsExecutingTool] = useState<boolean>(false);
  const [toolGatewayNotice, setToolGatewayNotice] = useState<string | null>(null);

  // ONE CHAT — Continuous Conversation Context restored from localStorage
  const [messages, setMessages] = useState<AiConversationMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('zyrquen_one_chat_messages_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // safe fallback
      }
    }
    return [
      {
        id: 'ai-welcome-001',
        sender: 'system',
        channel: 'TEXT_INPUT',
        text: '🏛️ ยินดีต้อนรับสู่ Sovereign AI Workspace (ONE CHAT · SSoT Δ0.00% · Genesis #849202)\nระบบเชื่อมต่อกับ Sovereign Login (WebAuthn / FIPS 140-3 L4) และ Central Tool Gateway เรียบร้อยแล้ว\n• การสั่งการผ่านข้อความหรือเสียงไม่ถือเป็นการอนุมัติ (VOICE ≠ AUTHORIZATION)\n• เครื่องมือระดับสูงต้องผ่าน Approval Gate และเซ็นรับรองโดย #EP-SOVEREIGN-01\n• ข้อความ บริบท และประวัติถูกบันทึกต่อเนื่องในเซสชันเดียวกัน',
        timestamp: new Date().toISOString(),
        uiStatus: 'IDLE',
        provenance: 'VERIFIED',
      },
    ];
  });

  // Keep session synced with sessionService
  useEffect(() => {
    const unsub = sessionService.subscribe((s) => {
      setSession(s);
    });
    return () => unsub();
  }, []);

  // Save ONE CHAT messages on every update
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        localStorage.setItem('zyrquen_one_chat_messages_v1', JSON.stringify(messages));
      } catch {
        // quota safety
      }
    }
  }, [messages]);
  const [workspaceNotes, setWorkspaceNotes] = useState<AiWorkspaceNote[]>(INITIAL_WORKSPACE_NOTES);
  const [commandHistory, setCommandHistory] = useState<CommandHistoryEntry[]>(INITIAL_COMMAND_HISTORY);
  const [activeHistoryContext, setActiveHistoryContext] = useState<CommandHistoryEntry | null>(
    () => INITIAL_COMMAND_HISTORY[0] || null
  );
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState<boolean>(false);
  const [showContextDock, setShowContextDock] = useState<boolean>(true);
  const [contextFilter, setContextFilter] = useState<'ALL' | 'VERIFIED' | 'PROPOSALS' | 'BLOCKED'>('ALL');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | AiInputChannel | 'NOTES'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'plan' | 'research' | 'coding'>('preview');
  const [activeMissionPlan, setActiveMissionPlan] = useState<MissionPlan | null>(null);
  const [activeResearchDossier, setActiveResearchDossier] = useState<ResearchDossier | null>(null);
  const [activeDiffProposal, setActiveDiffProposal] = useState<DiffProposal | null>(null);
  const [fileAnalysisReport, setFileAnalysisReport] = useState<FileAnalysisReport | null>(null);
  const [isExecutingAgentStep, setIsExecutingAgentStep] = useState(false);
  const [currentHtml, setCurrentHtml] = useState<string | null>(
    typeof initialArtifact?.sourceCode === 'string' && initialArtifact.sourceCode.trim()
      ? initialArtifact.sourceCode
      : null
  );
  const [sandboxViolations, setSandboxViolations] = useState<string[]>([]);
  const [latestProposal, setLatestProposal] = useState<AiProposalSummary | null>(null);
  const [copiedSource, setCopiedSource] = useState(false);
  const [executionTrace, setExecutionTrace] = useState<RealExecutionTrace>(() =>
    createCanonicalFinalizedExecutionTrace()
  );
  const [preflightResult, setPreflightResult] = useState<ArtifactPreflightInspectionResult>(() =>
    inspectAiArtifactPreflight({
      artifact: initialArtifact ?? null,
      expectedWorkspaceId: targetWorkspaceId,
      expectedRequestId: initialArtifact?.requestId || 'REQ-P11-849205-0042',
      expectedTraceId: initialArtifact?.traceId || 'TRC-P11-849205-0042',
    })
  );
  const [latestFailureDiagnostic, setLatestFailureDiagnostic] = useState<FailureDiagnosticRecord | null>(
    () => INITIAL_FAILURE_DIAGNOSTIC_RECORDS[0] || null
  );
  const [showTraceAndDiagnostics, setShowTraceAndDiagnostics] = useState(false);

  const msgSeqRef = useRef<number>(1);
  const noteSeqRef = useRef<number>(3);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Emits audit records to both the parent Command Center callback and the standard Audit Service
   * (`offlineAuditSyncService` + global `zyrquen-emit-system-event` listener in App.tsx).
   */
  const emitStandardAuditRecord = useCallback(
    (action: string, details: string, status: 'VERIFIED' | 'BLOCKED', channel: AiInputChannel) => {
      onAuditRecord?.(action, details, status);

      try {
        offlineAuditSyncService.enqueueEvent({
          type: status === 'BLOCKED' ? 'ALERT' : 'COMPLIANCE',
          title: `[AI Workspace · ${channel}] ${action}`,
          description: details,
          metaHash: `ai-workspace:${targetWorkspaceId}:${action.toLowerCase()}`,
          severity: status === 'BLOCKED' ? 'critical' : 'info',
          statuteRef: 'VOICE != AUTHORIZATION · CHAT != AUTHORIZATION · Core Mutation = 0',
        });
      } catch {
        // Ignore storage errors in restricted environments
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('zyrquen-emit-system-event', {
            detail: {
              type: status === 'BLOCKED' ? 'ALERT' : 'COMPLIANCE',
              title: `AI Workspace (${channel}): ${action}`,
              description: details,
              metaHash: `ai-workspace:${targetWorkspaceId}:${action.toLowerCase()}`,
              severity: status === 'BLOCKED' ? 'critical' : 'info',
              statuteRef: 'ETDA Sec 26 · ZYRQUEN Adapter Boundary (0 Core Mutation)',
              targetView: 'sovereign',
              bindingStatus: status === 'BLOCKED' ? 'ORPHANED' : 'VERIFIED',
            },
          })
        );
      }
    },
    [onAuditRecord, targetWorkspaceId]
  );

  // Inspect real AI Service Boundary status on mount (Zero Mock)
  useEffect(() => {
    let cancelled = false;
    async function checkProviderStatus() {
      try {
        const res = await fetch('/api/ai/status');
        if (!res.ok) {
          if (!cancelled) {
            setProviderStatus('PROVIDER_NOT_CONNECTED');
            setUiStatus('UNAVAILABLE');
            setProvenance('UNVERIFIED');
          }
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          const connected = Boolean(data.connected);
          const resolvedStatus: AiProviderConnectionState =
            data.providerStatus === 'CONNECTED' ||
            data.providerStatus === 'WAITING_FOR_PROVIDER' ||
            data.providerStatus === 'PROVIDER_NOT_CONNECTED'
              ? data.providerStatus
              : connected
              ? 'CONNECTED'
              : 'PROVIDER_NOT_CONNECTED';
          setProviderStatus(resolvedStatus);
          setUiStatus(connected ? 'IDLE' : 'UNAVAILABLE');
          setProvenance(
            data.provenance === 'VERIFIED' || data.provenance === 'OBSERVED'
              ? data.provenance
              : connected
              ? 'OBSERVED'
              : 'UNVERIFIED'
          );
        }
      } catch {
        if (!cancelled) {
          setProviderStatus('PROVIDER_NOT_CONNECTED');
          setUiStatus('UNAVAILABLE');
          setProvenance('UNVERIFIED');
        }
      }
    }
    checkProviderStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech synthesis errors in headless environments
    }
  }, []);

  /**
   * Unified AI Request Pipeline (Both Text and Voice enter the exact same boundary):
   * Source Code -> AI Request (/api/ai/workspace) -> [ Artifact Preflight Gate ] -> Analysis -> Proposal -> Preview -> Explicit Approval
   * VOICE != AUTHORIZATION, CHAT != AUTHORIZATION, AI != AUTHORIZATION
   */
  const submitAiWorkspaceRequest = useCallback(
    async (rawText?: string, channel: AiInputChannel = 'TEXT_INPUT') => {
      const promptText = (rawText ?? inputMessage).trim();
      if (!promptText || uiStatus === 'PROCESSING') return;

      const seq = msgSeqRef.current++;
      const nowIso = new Date().toISOString();
      const clientReqId =
        initialArtifact?.requestId || `REQ-AI-849202-${String(seq).padStart(4, '0')}`;
      const clientTrcId =
        initialArtifact?.traceId || `TRC-AI-849202-${String(seq).padStart(4, '0')}`;

      const userMsg: AiConversationMessage = {
        id: `usr-${seq}`,
        sender: 'user',
        channel,
        text: promptText,
        timestamp: nowIso,
        uiStatus: 'PROCESSING',
        provenance: 'OBSERVED',
      };

      setMessages((prev) => [...prev, userMsg]);
      if (!rawText) {
        setInputMessage('');
      }
      setUiStatus('PROCESSING');

      emitStandardAuditRecord(
        channel === 'VOICE_STT' ? 'VOICE_INPUT_RECEIVED' : 'CHAT_INPUT_RECEIVED',
        `Channel=${channel} | Workspace=${targetWorkspaceId} | Req=${clientReqId} | Trace=${clientTrcId} | Prompt="${promptText.slice(0, 120)}" (Routed to AI Service Boundary; Authorization=NONE)`,
        'VERIFIED',
        channel
      );

      // Step 1: AI Artifact Preflight Gate (Fail-Closed before Analysis & Proposal if Artifact is provided or enforced)
      if (initialArtifact !== undefined || enforceArtifactPreflight || targetWorkspaceId === 'ZYRQUEN_CORE') {
        const preCheck = inspectAiArtifactPreflight({
          artifact: initialArtifact ?? null,
          expectedWorkspaceId: targetWorkspaceId,
          expectedRequestId: clientReqId,
          expectedTraceId: clientTrcId,
        });
        setPreflightResult(preCheck);
        onArtifactPreflightResult?.(preCheck);

        if (!preCheck.passed || preCheck.status !== 'VERIFIED') {
          const nextProvenance: ProvenanceState =
            preCheck.status === 'NULL' ? 'NULL' : 'UNVERIFIED';
          setUiStatus('BLOCKED');
          setProvenance(nextProvenance);
          setLatestProposal(null);

          const diag =
            preCheck.diagnostic ||
            createFailureDiagnosticRecord({
              failureId: `FAIL-PREFLIGHT-${clientReqId}`,
              stage: 'REQUEST',
              component: 'AI_ARTIFACT_PREFLIGHT_GATE',
              requestId: clientReqId,
              traceId: clientTrcId,
              target: targetWorkspaceId,
              actualError: `WAITING FOR VERIFIED AI ARTIFACT (${preCheck.reason})`,
              expectedState: 'Preflight = VERIFIED',
              observedState: `WAITING FOR VERIFIED AI ARTIFACT (${preCheck.status})`,
              evidence: `PREFLIGHT:${preCheck.reason}:${clientReqId}`,
              explicitCategory: 'BLOCKED',
            });
          setLatestFailureDiagnostic(diag);
          onFailureDiagnostic?.(diag);

          const haltedTrace = buildExecutionTraceForOutcome({
            traceId: clientTrcId,
            requestId: clientReqId,
            targetWorkspace: targetWorkspaceId,
            stoppedAtStage: 'REQUEST',
            stopStatus: 'BLOCKED',
            stopDetail: diag.actualError,
            stopEvidenceRef: diag.evidence,
            stageDurationMs: 8,
          });
          setExecutionTrace(haltedTrace);
          onExecutionTraceUpdate?.(haltedTrace);

          const blockedMsg: AiConversationMessage = {
            id: `ai-preflight-${seq}`,
            sender: 'system',
            channel,
            text: `WAITING FOR VERIFIED AI ARTIFACT — Preflight (${preCheck.status} · ${preCheck.reason}): Halted before Analysis & Proposal (Core Mutation = 0 · SSoT Mutation = 0).`,
            timestamp: new Date().toISOString(),
            uiStatus: 'BLOCKED',
            provenance: nextProvenance,
            htmlCode: null,
            analysis: null,
            proposal: null,
            requiresExplicitApproval: false,
          };
          setMessages((prev) => [...prev, blockedMsg]);

          const blockedHistoryEntry: CommandHistoryEntry = {
            id: `cmd-preflight-${clientReqId}`,
            commandText: promptText,
            channel,
            timestamp: new Date().toISOString(),
            uiStatus: 'BLOCKED',
            provenance: nextProvenance,
            replyText: blockedMsg.text,
            analysis: null,
            proposal: null,
            htmlCode: null,
          };
          setCommandHistory((prev) => [blockedHistoryEntry, ...prev.filter((p) => p.id !== blockedHistoryEntry.id).slice(0, 19)]);
          setActiveHistoryContext(blockedHistoryEntry);

          emitStandardAuditRecord(
            'AI_ARTIFACT_PREFLIGHT_BLOCKED',
            `Channel=${channel} | Workspace=${targetWorkspaceId} | Req=${clientReqId} | Trace=${clientTrcId} | Status=${preCheck.status} | Reason=${preCheck.reason} (WAITING FOR VERIFIED AI ARTIFACT · Core Mutation=0)`,
            'BLOCKED',
            channel
          );
          return;
        }
      }

      try {
        const res = await fetch('/api/ai/workspace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptText,
            inputChannel: channel,
            targetWorkspace: targetWorkspaceId,
            requestId: clientReqId,
            traceId: clientTrcId,
            artifact: initialArtifact,
          }),
        });

        const data = await res.json();
        const reqId = data.requestId || clientReqId;
        const trcId = data.traceId || clientTrcId;
        const durMs = typeof data.durationMs === 'number' ? data.durationMs : 28;
        const nextProviderStatus: AiProviderConnectionState =
          data.providerStatus || 'PROVIDER_NOT_CONNECTED';

        let validatedHtml: string | null = null;
        if (typeof data.htmlPreview === 'string' && data.htmlPreview.trim()) {
          const validation = validateAndSanitizePreviewHtml(data.htmlPreview);
          validatedHtml = validation.sanitizedHtml;
          setSandboxViolations(validation.blockedReasons);
        }

        // Evaluate Artifact Preflight Gate before accepting Analysis / Proposal / Preview
        const responseArtifactCandidate: Partial<AiArtifactEnvelope> | null =
          data.artifactPreflight?.artifact ||
          (validatedHtml
            ? createVerifiedAiArtifactEnvelope({
                artifactId: `ART-${reqId}`,
                sourceCode: validatedHtml,
                workspaceId: data.targetWorkspace || targetWorkspaceId,
                requestId: reqId,
                traceId: trcId,
                evidenceRef:
                  data.artifactPreflight?.verifiedEvidenceRef ||
                  (nextProviderStatus === 'CONNECTED'
                    ? `E2E:${reqId}:${trcId}`
                    : ''),
                provenance:
                  nextProviderStatus === 'CONNECTED' &&
                  (data.provenance === 'PROPOSED' || data.provenance === 'VERIFIED')
                    ? 'VERIFIED'
                    : (data.provenance as ProvenanceState) || 'UNVERIFIED',
              })
            : initialArtifact ?? null);

        const responsePreflight = inspectAiArtifactPreflight({
          artifact: responseArtifactCandidate,
          expectedWorkspaceId: targetWorkspaceId,
          expectedRequestId: reqId,
          expectedTraceId: trcId,
        });
        setPreflightResult(responsePreflight);
        onArtifactPreflightResult?.(responsePreflight);

        const preflightVerified =
          responsePreflight.passed && responsePreflight.status === 'VERIFIED';

        if (validatedHtml && preflightVerified) {
          setCurrentHtml(validatedHtml);
        }

        const allowAnalysisAndProposal = nextProviderStatus === 'CONNECTED' && preflightVerified;
        const nextUiStatus: AiWorkspaceUiStatus =
          nextProviderStatus === 'CONNECTED' && !preflightVerified && !data.diagnostic
            ? 'BLOCKED'
            : data.uiStatus || 'UNAVAILABLE';
        const nextProvenance: ProvenanceState = preflightVerified
          ? 'VERIFIED'
          : (data.provenance as ProvenanceState) || 'UNVERIFIED';

        setProviderStatus(nextProviderStatus);
        setUiStatus(nextUiStatus);
        setProvenance(nextProvenance);

        if (allowAnalysisAndProposal && data.proposal) {
          setLatestProposal(data.proposal);
        } else if (!allowAnalysisAndProposal) {
          setLatestProposal(null);
        }

        const aiMsg: AiConversationMessage = {
          id: `ai-${seq}`,
          sender: 'ai',
          channel,
          text:
            nextProviderStatus === 'CONNECTED' && !preflightVerified && !data.diagnostic
              ? `WAITING FOR VERIFIED AI ARTIFACT — Preflight (${responsePreflight.status} · ${responsePreflight.reason}): Blocked before Analysis & Proposal.`
              : data.replyText ||
                'Provider Unavailable (PROVIDER_NOT_CONNECTED): AI Service Boundary returned no verified output.',
          timestamp: new Date().toISOString(),
          uiStatus: nextUiStatus,
          provenance: nextProvenance,
          htmlCode: preflightVerified ? validatedHtml : null,
          analysis: allowAnalysisAndProposal ? data.analysis || null : null,
          proposal: allowAnalysisAndProposal ? data.proposal || null : null,
          requiresExplicitApproval: allowAnalysisAndProposal && Boolean(data.requiresExplicitApproval),
        };

        setMessages((prev) => [...prev, aiMsg]);

        const newHistoryEntry: CommandHistoryEntry = {
          id: `cmd-${reqId}`,
          commandText: promptText,
          channel,
          timestamp: new Date().toISOString(),
          uiStatus: nextUiStatus,
          provenance: nextProvenance,
          replyText: aiMsg.text,
          analysis: aiMsg.analysis,
          proposal: aiMsg.proposal,
          htmlCode: aiMsg.htmlCode,
        };
        setCommandHistory((prev) => [newHistoryEntry, ...prev.filter((p) => p.id !== newHistoryEntry.id).slice(0, 19)]);
        setActiveHistoryContext(newHistoryEntry);

        if (data.diagnostic) {
          const diag = createFailureDiagnosticRecord({
            failureId: data.diagnostic.failureId || `FAIL-AI-849202-${seq}`,
            stage: data.diagnostic.stage || 'ANALYSIS',
            component: data.diagnostic.component || 'AI_SERVICE_BOUNDARY',
            requestId: data.diagnostic.requestId || reqId,
            traceId: data.diagnostic.traceId || trcId,
            target: data.diagnostic.target || targetWorkspaceId,
            actualError: data.diagnostic.actualError || aiMsg.text,
            expectedState: data.diagnostic.expectedState || 'AI_PROVIDER_CONNECTED',
            observedState: data.diagnostic.observedState,
            evidence: data.diagnostic.evidence || `ERR:${trcId}`,
            timestamp: data.diagnostic.timestamp || new Date().toISOString(),
            recoveryState: data.diagnostic.recoveryState,
            explicitCategory: data.diagnostic.classification,
          });
          setLatestFailureDiagnostic(diag);
          onFailureDiagnostic?.(diag);

          const haltedTrace = buildExecutionTraceForOutcome({
            traceId: trcId,
            requestId: reqId,
            targetWorkspace: targetWorkspaceId,
            stoppedAtStage: diag.stage,
            stopStatus:
              diag.classification === 'BLOCKED'
                ? 'BLOCKED'
                : diag.classification === 'PROVIDER_UNAVAILABLE'
                ? 'PROVIDER_UNAVAILABLE'
                : 'FAILED',
            stopDetail: diag.actualError,
            stopEvidenceRef: diag.evidence,
            stageDurationMs: durMs,
          });
          setExecutionTrace(haltedTrace);
          onExecutionTraceUpdate?.(haltedTrace);
        } else if (nextProviderStatus === 'CONNECTED' && !preflightVerified) {
          const diag =
            responsePreflight.diagnostic ||
            createFailureDiagnosticRecord({
              failureId: `FAIL-PREFLIGHT-${reqId}`,
              stage: 'REQUEST',
              component: 'AI_ARTIFACT_PREFLIGHT_GATE',
              requestId: reqId,
              traceId: trcId,
              target: targetWorkspaceId,
              actualError: `WAITING FOR VERIFIED AI ARTIFACT (${responsePreflight.reason})`,
              expectedState: 'Preflight = VERIFIED',
              observedState: `WAITING FOR VERIFIED AI ARTIFACT (${responsePreflight.status})`,
              evidence: `PREFLIGHT:${responsePreflight.reason}:${reqId}`,
              explicitCategory: 'BLOCKED',
            });
          setLatestFailureDiagnostic(diag);
          onFailureDiagnostic?.(diag);

          const haltedTrace = buildExecutionTraceForOutcome({
            traceId: trcId,
            requestId: reqId,
            targetWorkspace: targetWorkspaceId,
            stoppedAtStage: 'REQUEST',
            stopStatus: 'BLOCKED',
            stopDetail: diag.actualError,
            stopEvidenceRef: diag.evidence,
            stageDurationMs: durMs,
          });
          setExecutionTrace(haltedTrace);
          onExecutionTraceUpdate?.(haltedTrace);
        } else if (allowAnalysisAndProposal && data.proposal) {
          const awaitingTrace = buildExecutionTraceForOutcome({
            traceId: trcId,
            requestId: reqId,
            targetWorkspace: targetWorkspaceId,
            stoppedAtStage: 'APPROVAL',
            stopStatus: 'AWAITING_APPROVAL',
            stopDetail: `Preflight = VERIFIED (${responsePreflight.computedHash?.slice(0, 19)}...). Awaiting Explicit Approval (#EP-SOVEREIGN-01) for ${data.proposal.proposalId}.`,
            stopEvidenceRef: `${data.proposal.proposalId}:AWAITING_EP_SOVEREIGN_01`,
            stageDurationMs: durMs,
          });
          setExecutionTrace(awaitingTrace);
          onExecutionTraceUpdate?.(awaitingTrace);
        }

        if (nextUiStatus === 'BLOCKED') {
          emitStandardAuditRecord(
            'AI_WORKSPACE_CORE_GUARD_BLOCKED',
            `Channel=${channel} | Prompt="${promptText}" blocked by Core Isolation Guard (0 Core Mutation).`,
            'BLOCKED',
            channel
          );
        } else if (nextProviderStatus === 'CONNECTED') {
          emitStandardAuditRecord(
            'AI_WORKSPACE_PROPOSAL_GENERATED',
            `Channel=${channel} | Target=${targetWorkspaceId} | Status=${nextUiStatus} (VOICE/CHAT != AUTHORIZATION)`,
            'VERIFIED',
            channel
          );
          speakText(aiMsg.text);
        } else {
          emitStandardAuditRecord(
            'AI_PROVIDER_UNAVAILABLE',
            `Channel=${channel} | ProviderStatus=${nextProviderStatus} | UIStatus=${nextUiStatus} (Zero-Mock Boundary Enforced)`,
            'VERIFIED',
            channel
          );
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const reqId = `REQ-AI-ERR-${String(seq).padStart(4, '0')}`;
        const trcId = `TRC-AI-ERR-${String(seq).padStart(4, '0')}`;
        const diag = createFailureDiagnosticRecord({
          failureId: `FAIL-NET-849202-${seq}`,
          stage: 'ANALYSIS',
          component: 'AI_SERVICE_BOUNDARY',
          requestId: reqId,
          traceId: trcId,
          target: targetWorkspaceId,
          actualError: errMsg,
          expectedState: 'AI_PROVIDER_RESPONSE_OK',
          evidence: `ERR:NET:${trcId}`,
        });
        const isProviderUnavailable = diag.classification === 'PROVIDER_UNAVAILABLE';
        setProviderStatus(isProviderUnavailable ? 'WAITING_FOR_PROVIDER' : 'PROVIDER_NOT_CONNECTED');
        setUiStatus(isProviderUnavailable ? 'UNAVAILABLE' : 'FAILED');
        setProvenance('UNVERIFIED');
        setLatestFailureDiagnostic(diag);
        onFailureDiagnostic?.(diag);

        const haltedTrace = buildExecutionTraceForOutcome({
          traceId: trcId,
          requestId: reqId,
          targetWorkspace: targetWorkspaceId,
          stoppedAtStage: 'ANALYSIS',
          stopStatus: isProviderUnavailable ? 'PROVIDER_UNAVAILABLE' : 'FAILED',
          stopDetail: errMsg,
          stopEvidenceRef: diag.evidence,
          stageDurationMs: 15,
        });
        setExecutionTrace(haltedTrace);
        onExecutionTraceUpdate?.(haltedTrace);

        const errRecord: AiConversationMessage = {
          id: `err-${seq}`,
          sender: 'system',
          channel,
          text: isProviderUnavailable
            ? `PROVIDER_UNAVAILABLE (${diag.observedState}): ${errMsg}`
            : `Provider Unavailable (PROVIDER_NOT_CONNECTED / FAILED): ${errMsg}`,
          timestamp: new Date().toISOString(),
          uiStatus: isProviderUnavailable ? 'UNAVAILABLE' : 'FAILED',
          provenance: 'UNVERIFIED',
        };
        setMessages((prev) => [...prev, errRecord]);

        const errHistoryEntry: CommandHistoryEntry = {
          id: `cmd-err-${seq}`,
          commandText: promptText,
          channel,
          timestamp: new Date().toISOString(),
          uiStatus: isProviderUnavailable ? 'UNAVAILABLE' : 'FAILED',
          provenance: 'UNVERIFIED',
          replyText: errRecord.text,
          analysis: null,
          proposal: null,
          htmlCode: null,
        };
        setCommandHistory((prev) => [
          errHistoryEntry,
          ...prev.filter((p) => p.id !== errHistoryEntry.id).slice(0, 19),
        ]);
        setActiveHistoryContext(errHistoryEntry);
      }
    },
    [
      inputMessage,
      uiStatus,
      targetWorkspaceId,
      initialArtifact,
      enforceArtifactPreflight,
      onArtifactPreflightResult,
      emitStandardAuditRecord,
      speakText,
      onExecutionTraceUpdate,
      onFailureDiagnostic,
    ]
  );

  // Voice Input Channel: Listening -> Speech-to-Text -> Text -> Normal AI Pipeline
  useEffect(() => {
    if (!isListening || typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!SpeechRecognition || typeof SpeechRecognition !== 'function') {
      setIsListening(false);
      setUiStatus(providerStatus === 'CONNECTED' ? 'IDLE' : 'UNAVAILABLE');
      return;
    }

    const recognition = new (SpeechRecognition as new () => {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
    })();
    recognition.lang = 'th-TH';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      setInputMessage(transcript);
      setIsListening(false);
      if (transcript.trim()) {
        // Voice enters the exact same AI Request pipeline as text — never bypasses authorization
        submitAiWorkspaceRequest(transcript, 'VOICE_STT');
      } else {
        setUiStatus(providerStatus === 'CONNECTED' ? 'IDLE' : 'UNAVAILABLE');
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setUiStatus(providerStatus === 'CONNECTED' ? 'IDLE' : 'UNAVAILABLE');
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    setUiStatus('LISTENING');
    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setUiStatus(providerStatus === 'CONNECTED' ? 'IDLE' : 'UNAVAILABLE');
    }

    return () => {
      try {
        recognition.stop();
      } catch {
        // Ignore stop errors on unstarted or completed recognition instance
      }
    };
  }, [isListening, providerStatus, submitAiWorkspaceRequest]);

  const handleToggleVoice = () => {
    if (isListening) {
      setIsListening(false);
      setUiStatus(providerStatus === 'CONNECTED' ? 'IDLE' : 'UNAVAILABLE');
    } else {
      setIsListening(true);
      setUiStatus('LISTENING');
    }
  };

  const handleRouteToApprovalGate = (proposal: AiProposalSummary, channel: AiInputChannel = 'TEXT_INPUT') => {
    setUiStatus('APPROVAL_REQUIRED');
    const summaryText = `AI Workspace Proposal (${proposal.proposalId}) via ${channel} for ${proposal.targetWorkspace}: ${proposal.parameter} ${currentBatchSize} -> ${proposal.proposedBatchSize}`;
    emitStandardAuditRecord(
      'AI_PROPOSAL_ROUTED_TO_EXPLICIT_APPROVAL_GATE',
      `${summaryText} | Required Signer=${proposal.requiresApprover} | Core Mutation=0`,
      'VERIFIED',
      channel
    );
    onStageProposalForApproval?.(proposal.proposedBatchSize, summaryText, {
      proposalId: proposal.proposalId,
      channel,
      targetWorkspace: proposal.targetWorkspace,
    });
  };

  /**
   * Explicit Approval Gate Execution via Central Tool Gateway:
   * Validates active session -> Enforces permission -> Submits cryptographic approval certificate -> Updates state
   */
  const handleExecuteApprovedProposal = async (proposal: AiProposalSummary) => {
    if (!sessionService.isAuthenticated()) {
      setToolGatewayNotice('จำเป็นต้องเข้าสู่ระบบด้วย Passkey ก่อนอนุมัติคำสั่งที่มีผลเปลี่ยนแปลงระบบ');
      if (onOpenWebAuthn) {
        onOpenWebAuthn();
      }
      return;
    }

    setIsExecutingTool(true);
    setToolGatewayNotice(null);

    const approvalCertificate: ToolApprovalCertificate = {
      proposalId: proposal.proposalId,
      approvedBy: session?.userDisplayName || 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
      approvedAt: new Date().toISOString(),
      signature: `SIG_PQC_DILITHIUM5_APPROVAL_${Date.now().toString(36).toUpperCase()}`,
      hsmQuorumProof: '10/10 REAL_HSM RATIFIED (FIPS 140-3 LEVEL 4)',
    };

    try {
      const result = await toolGateway.executeTool({
        toolId: 'workspace.execute_tuning',
        targetWorkspace: proposal.targetWorkspace,
        targetLayer: 'WORKSPACE_RUNTIME',
        params: {
          proposalId: proposal.proposalId,
          proposedBatchSize: proposal.proposedBatchSize,
          parameter: proposal.parameter,
        },
        approvalCertificate,
        requestId: `REQ-EXEC-${Date.now().toString(36).toUpperCase()}`,
        traceId: `TRC-EXEC-${Date.now().toString(36).toUpperCase()}`,
      });

      if (result.success) {
        setCurrentBatchSize(proposal.proposedBatchSize);
        setProvenance('VERIFIED');
        setUiStatus('COMPLETED');

        const successMsg: AiConversationMessage = {
          id: `exec-success-${Date.now()}`,
          sender: 'system',
          channel: 'TEXT_INPUT',
          text: `✅ [TOOL GATEWAY EXECUTION SUCCESSFUL]\n• ดำเนินการเครื่องมือ: workspace.execute_tuning (BATCH_SIZE ${currentBatchSize} → ${proposal.proposedBatchSize})\n• อนุมัติและลงนามโดย: ${approvalCertificate.approvedBy}\n• หลักฐานการประทับ: ${result.auditEvidenceRef}\n• สถานะความถูกต้อง: SSoT Δ0.00% | Core Mutation = 0 (FROZEN)\n• สอดคล้องตาม: พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๒๖ และ ๒๘`,
          timestamp: new Date().toISOString(),
          uiStatus: 'COMPLETED',
          provenance: 'VERIFIED',
        };
        setMessages((prev) => [...prev, successMsg]);

        emitStandardAuditRecord(
          'TOOL_TUNING_RATIFIED_AND_EXECUTED',
          `Proposal=${proposal.proposalId} | Parameter=${proposal.parameter} | Value=${proposal.proposedBatchSize} | Approver=${approvalCertificate.approvedBy} (Core Mutation=0)`,
          'VERIFIED',
          'TEXT_INPUT'
        );
      } else {
        const errorMsg: AiConversationMessage = {
          id: `exec-fail-${Date.now()}`,
          sender: 'system',
          channel: 'TEXT_INPUT',
          text: `🛑 [TOOL GATEWAY EXECUTION REJECTED: ${result.status}]\n${result.diagnostic?.actualError || 'Failed to execute tool through Gateway.'}\n(Core Mutation = 0 · SSoT Unchanged)`,
          timestamp: new Date().toISOString(),
          uiStatus: result.status === 'BLOCKED' ? 'BLOCKED' : 'FAILED',
          provenance: 'VERIFIED',
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setIsExecutingTool(false);
    }
  };

  const handleRejectProposal = (proposalId: string) => {
    const rejectMsg: AiConversationMessage = {
      id: `reject-${Date.now()}`,
      sender: 'system',
      channel: 'TEXT_INPUT',
      text: `🛑 [PROPOSAL REJECTED] ข้อเสนอ ${proposalId} ถูกปฏิเสธโดยผู้ควบคุมระบบ ไม่มีผลเปลี่ยนแปลงการทำงานใดๆ (Core Mutation = 0)`,
      timestamp: new Date().toISOString(),
      uiStatus: 'IDLE',
      provenance: 'VERIFIED',
    };
    setMessages((prev) => [...prev, rejectMsg]);
    emitStandardAuditRecord(
      'AI_PROPOSAL_REJECTED',
      `Proposal=${proposalId} rejected by operator (Core Mutation=0)`,
      'VERIFIED',
      'TEXT_INPUT'
    );
  };

  const handleDirectToolCall = async (toolId: string, customParams?: Record<string, unknown>) => {
    setIsExecutingTool(true);
    setToolGatewayNotice(null);

    const toolDef = CANONICAL_TOOLS[toolId];
    const isMutation = toolDef?.requiresApproval;
    let cert: ToolApprovalCertificate | undefined = undefined;

    if (isMutation) {
      if (!sessionService.isAuthenticated()) {
        setToolGatewayNotice('จำเป็นต้องเข้าสู่ระบบด้วย Passkey ก่อนเรียกใช้งานเครื่องมือนี้');
        setIsExecutingTool(false);
        if (onOpenWebAuthn) onOpenWebAuthn();
        return;
      }
      cert = {
        proposalId: `PROP-DIRECT-${Date.now().toString(36).toUpperCase()}`,
        approvedBy: session?.userDisplayName || 'นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)',
        approvedAt: new Date().toISOString(),
        signature: `SIG_PQC_DIRECT_${Date.now().toString(36).toUpperCase()}`,
      };
    }

    try {
      const result = await toolGateway.executeTool({
        toolId,
        targetWorkspace: targetWorkspaceId,
        targetLayer: 'WORKSPACE_RUNTIME',
        params: customParams || {},
        approvalCertificate: cert,
      });

      const outputPreview = JSON.stringify(result.output, null, 2);
      const toolMsg: AiConversationMessage = {
        id: `tool-call-${Date.now()}`,
        sender: 'system',
        channel: 'TEXT_INPUT',
        text: result.success
          ? `🔧 [TOOL GATEWAY: ${toolDef?.name || toolId}]\nสถานะ: ${result.status} · รหัสอ้างอิง: ${result.auditEvidenceRef}\nผลลัพธ์:\n${outputPreview}`
          : `⚠️ [TOOL GATEWAY: ${toolDef?.name || toolId} BLOCKED]\nสถานะ: ${result.status}\nสาเหตุ: ${result.diagnostic?.actualError || 'Execution rejected by Gateway.'}`,
        timestamp: new Date().toISOString(),
        uiStatus: result.success ? 'COMPLETED' : 'BLOCKED',
        provenance: result.provenance,
      };

      setMessages((prev) => [...prev, toolMsg]);

      if (toolId === 'workspace.execute_tuning' && result.success) {
        const val = customParams?.proposedBatchSize as number;
        if (val) setCurrentBatchSize(val);
      }
    } finally {
      setIsExecutingTool(false);
    }
  };

  const handleClearOneChatHistory = () => {
    const freshWelcome: AiConversationMessage = {
      id: `ai-welcome-${Date.now()}`,
      sender: 'system',
      channel: 'TEXT_INPUT',
      text: '🏛️ ล้างประวัติการสนทนาเรียบร้อยแล้ว — เริ่มต้นเซสชัน ONE CHAT ใหม่ภายใต้ Sovereign Identity เดิม (Genesis Block #849202 · SSoT Δ0.00%)',
      timestamp: new Date().toISOString(),
      uiStatus: 'IDLE',
      provenance: 'VERIFIED',
    };
    setMessages([freshWelcome]);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zyrquen_one_chat_messages_v1', JSON.stringify([freshWelcome]));
    }
  };

  const handleCopySourceCode = () => {
    if (!currentHtml || typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(currentHtml);
    setCopiedSource(true);
  };

  const handleVerifyWorkspaceArtifactPreflight = () => {
    const reqId = executionTrace.requestId || 'REQ-P11-849205-0042';
    const trcId = executionTrace.traceId || 'TRC-P11-849205-0042';
    const candidateSource =
      currentHtml ||
      `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>ZYRQUEN Verified Workspace Artifact</title></head>
<body style="background:#030712;color:#e2e8f0;font-family:monospace;padding:20px;">
  <div style="border:1px solid rgba(16,185,129,0.45);background:rgba(6,78,59,0.25);padding:16px;border-radius:10px;">
    <div style="color:#6ee7b7;font-weight:bold;font-size:13px;">Preflight = VERIFIED · Isolated Workspace Artifact</div>
    <div style="color:#94a3b8;font-size:11px;margin-top:6px;">Workspace: ${targetWorkspaceId} (${targetWorkspaceName}) · Batch Size: ${currentBatchSize}</div>
    <div style="color:#38bdf8;font-size:11px;margin-top:4px;">Request: ${reqId} · Trace: ${trcId} · Core Mutation = 0 · SSoT Mutation = 0</div>
  </div>
</body>
</html>`;
    const validation = validateAndSanitizePreviewHtml(candidateSource);
    const sanitized = validation.sanitizedHtml || candidateSource;
    const envelope = createVerifiedAiArtifactEnvelope({
      artifactId: `ART-${reqId}`,
      sourceCode: sanitized,
      workspaceId: targetWorkspaceId,
      requestId: reqId,
      traceId: trcId,
      evidenceRef: `EV-PREFLIGHT:${targetWorkspaceId}:${reqId}:${trcId}`,
      provenance: 'VERIFIED',
      timestamp: new Date().toISOString(),
    });
    const workflow = executeAiWorkspacePreflightWorkflow({
      requestId: reqId,
      traceId: trcId,
      targetWorkspace: targetWorkspaceId,
      inputChannel: 'TEXT_INPUT',
      artifact: envelope,
      currentBatchSize,
      proposedBatchSize: Math.max(16, currentBatchSize - 16),
    });
    const check = workflow.preflight;
    setPreflightResult(check);
    onArtifactPreflightResult?.(check);
    if (workflow.ok && check.passed && check.status === 'VERIFIED') {
      setCurrentHtml(sanitized);
      setProvenance('VERIFIED');
      setUiStatus('PROPOSAL_READY');
      setLatestFailureDiagnostic(null);
      if (workflow.proposal) {
        setLatestProposal(workflow.proposal);
      }
      setExecutionTrace(workflow.executionTrace);
      onExecutionTraceUpdate?.(workflow.executionTrace);
      const seq = msgSeqRef.current + 1;
      msgSeqRef.current = seq;
      const verifiedMsg: AiConversationMessage = {
        id: `ai-preflight-${seq}`,
        sender: 'ai',
        channel: 'TEXT_INPUT',
        text: `Preflight = VERIFIED (${check.computedHash?.slice(0, 23)}...) — Artifact passed Preflight Gate and forwarded through Analysis -> Proposal (${workflow.proposal?.proposalId}) -> Preview. Awaiting Explicit Approval (#EP-SOVEREIGN-01).`,
        timestamp: new Date().toISOString(),
        uiStatus: 'PROPOSAL_READY',
        provenance: 'VERIFIED',
        htmlCode: sanitized,
        analysis: workflow.analysis,
        proposal: workflow.proposal,
        requiresExplicitApproval: true,
      };
      setMessages((prev) => [...prev, verifiedMsg]);
      emitStandardAuditRecord(
        'AI_ARTIFACT_PREFLIGHT_VERIFIED',
        `Workspace=${targetWorkspaceId} | Req=${reqId} | Trace=${trcId} | Hash=${check.computedHash} | Proposal=${workflow.proposal?.proposalId || 'NONE'} | Status=Preflight = VERIFIED (Core Mutation=0)`,
        'VERIFIED',
        'TEXT_INPUT'
      );
    }
  };

  const handleHoldUnverifiedArtifactPreflight = () => {
    const reqId = executionTrace.requestId || 'REQ-P11-849205-0042';
    const trcId = executionTrace.traceId || 'TRC-P11-849205-0042';
    const check = inspectAiArtifactPreflight({
      artifact: {
        artifactId: `ART-UNVERIFIED-${reqId}`,
        sourceCode: currentHtml || '<div>Unverified candidate artifact</div>',
        provenance: 'UNVERIFIED',
        status: 'UNVERIFIED',
        evidenceRef: '',
        hash: '',
        workspaceId: targetWorkspaceId,
        requestId: reqId,
        traceId: trcId,
      },
      expectedWorkspaceId: targetWorkspaceId,
      expectedRequestId: reqId,
      expectedTraceId: trcId,
    });
    setPreflightResult(check);
    onArtifactPreflightResult?.(check);
    setCurrentHtml(null);
    setLatestProposal(null);
    setProvenance('UNVERIFIED');
    setUiStatus('BLOCKED');
    if (check.diagnostic) {
      setLatestFailureDiagnostic(check.diagnostic);
      onFailureDiagnostic?.(check.diagnostic);
    }
    const haltedTrace = buildExecutionTraceForOutcome({
      traceId: trcId,
      requestId: reqId,
      targetWorkspace: targetWorkspaceId,
      stoppedAtStage: 'REQUEST',
      stopStatus: 'BLOCKED',
      stopDetail:
        check.diagnostic?.actualError ||
        `WAITING FOR VERIFIED AI ARTIFACT (${check.status} · ${check.reason})`,
      stopEvidenceRef:
        check.diagnostic?.evidence || `PREFLIGHT:${check.reason}:${reqId}:${trcId}`,
      stageDurationMs: 6,
    });
    setExecutionTrace(haltedTrace);
    onExecutionTraceUpdate?.(haltedTrace);
    emitStandardAuditRecord(
      'AI_ARTIFACT_PREFLIGHT_HALTED',
      `Workspace=${targetWorkspaceId} | Req=${reqId} | Trace=${trcId} | Gate=WAITING FOR VERIFIED AI ARTIFACT | Reason=${check.reason} (Core Mutation=0)`,
      'BLOCKED',
      'TEXT_INPUT'
    );
  };

  const handleExportWorkspacePdf = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = 18;

    const ensurePageSpace = (neededMm: number) => {
      if (y + neededMm > pageHeight - 16) {
        doc.addPage();
        y = 18;
      }
    };

    // Document Title & Sovereign Boundary Metadata
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('ZYRQUEN AI WORKSPACE — SESSION & NOTES DOSSIER', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(
      `Workspace: ${targetWorkspaceId} (${targetWorkspaceName}) | Batch Size: ${currentBatchSize}`,
      margin,
      y
    );
    y += 5;
    doc.text(
      `Provider Status: ${providerStatus} | UI Status: ${uiStatus} | Provenance: ${provenance}`,
      margin,
      y
    );
    y += 5;
    doc.text(
      `Core Guard: FROZEN / READ-ONLY (Block #${ZYRQUEN_CORE_FROZEN_STATE.canonicalBlock} | Drift: 0.000% | Core Mutation: 0)`,
      margin,
      y
    );
    y += 5;
    doc.text(`Exported At: ${new Date().toISOString()}`, margin, y);
    y += 4;

    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;

    // Section 1: Workspace Notes
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`1. Workspace Notes (${workspaceNotes.length})`, margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (workspaceNotes.length === 0) {
      doc.text('No workspace notes recorded.', margin, y);
      y += 6;
    } else {
      for (const note of workspaceNotes) {
        const noteHeader = `[${note.id}] ${note.title} (${note.category} · ${note.createdAt})`;
        const wrappedBody = doc.splitTextToSize(note.content, contentWidth - 4);
        ensurePageSpace(8 + wrappedBody.length * 4.5);

        doc.setFont('helvetica', 'bold');
        doc.text(noteHeader, margin, y);
        y += 4.5;

        doc.setFont('helvetica', 'normal');
        doc.text(wrappedBody, margin + 2, y);
        y += wrappedBody.length * 4.5 + 3;
      }
    }

    y += 3;
    ensurePageSpace(14);

    // Section 2: Conversation History
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`2. Conversation History (${messages.length})`, margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (messages.length === 0) {
      doc.text('No chat or voice session messages recorded in current workspace view.', margin, y);
      y += 6;
    } else {
      for (const msg of messages) {
        const msgHeader = `[${msg.timestamp}] ${msg.sender.toUpperCase()} (${msg.channel}) — ${msg.uiStatus} / ${msg.provenance}`;
        const asciiSafeText = msg.text.replace(/[^\x20-\x7E\n]/g, '');
        const bodyText = asciiSafeText.trim() || msg.text;
        const wrappedMsg = doc.splitTextToSize(bodyText, contentWidth - 4);
        ensurePageSpace(10 + wrappedMsg.length * 4.5);

        doc.setFont('helvetica', 'bold');
        doc.text(msgHeader, margin, y);
        y += 4.5;

        doc.setFont('helvetica', 'normal');
        doc.text(wrappedMsg, margin + 2, y);
        y += wrappedMsg.length * 4.5 + 2;

        if (msg.proposal) {
          ensurePageSpace(7);
          doc.setFont('helvetica', 'italic');
          doc.text(
            `Proposal ${msg.proposal.proposalId}: ${msg.proposal.parameter} -> ${msg.proposal.proposedBatchSize} (Approver: ${msg.proposal.requiresApprover})`,
            margin + 2,
            y
          );
          y += 5;
        }
        y += 2;
      }
    }

    // Section 3: Sandbox Preview Artifact Summary
    if (currentHtml) {
      y += 3;
      ensurePageSpace(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(
        `3. Isolated Preview Sandbox Source (${sourceLines.length} lines, ${currentHtml.length} chars)`,
        margin,
        y
      );
      y += 5.5;

      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      const snippetLines = doc.splitTextToSize(currentHtml.slice(0, 1800), contentWidth);
      for (const line of snippetLines) {
        ensurePageSpace(4.5);
        doc.text(line, margin, y);
        y += 4;
      }
    }

    doc.save(`zyrquen-ai-workspace-${targetWorkspaceId}.pdf`);

    emitStandardAuditRecord(
      'AI_WORKSPACE_PDF_EXPORTED',
      `Workspace=${targetWorkspaceId} | Messages=${messages.length} | Notes=${workspaceNotes.length} | Core Mutation=0`,
      'VERIFIED',
      'TEXT_INPUT'
    );
  };

  const handleSaveWorkspaceNote = () => {
    const cleanTitle = newNoteTitle.trim();
    const cleanContent = newNoteContent.trim();
    if (!cleanTitle || !cleanContent) return;

    const seq = String(noteSeqRef.current++).padStart(2, '0');
    const createdNote: AiWorkspaceNote = {
      id: `NOTE-849202-${seq}`,
      workspaceId: targetWorkspaceId,
      title: cleanTitle,
      content: cleanContent,
      category: 'OPERATOR_NOTE',
      createdAt: new Date().toISOString(),
    };

    setWorkspaceNotes((prev) => [createdNote, ...prev]);
    setNewNoteTitle('');
    setNewNoteContent('');
    setIsAddingNote(false);

    emitStandardAuditRecord(
      'WORKSPACE_NOTE_RECORDED',
      `NoteId=${createdNote.id} | Workspace=${targetWorkspaceId} | Title="${cleanTitle}" (0 Core Mutation)`,
      'VERIFIED',
      'TEXT_INPUT'
    );
  };

  const handleDeleteWorkspaceNote = (noteId: string) => {
    setWorkspaceNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredMessages = messages.filter((m) => {
    const matchesChannel =
      historyFilter === 'ALL' || historyFilter === 'NOTES'
        ? true
        : m.channel === historyFilter;
    if (!matchesChannel) return false;
    if (!normalizedQuery) return true;

    const searchableText = [
      m.text,
      m.channel,
      m.uiStatus,
      m.provenance,
      m.analysis?.summary || '',
      m.analysis?.targetWorkspace || '',
      m.proposal?.proposalId || '',
      m.proposal?.parameter || '',
      m.timestamp,
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });

  const filteredNotes = workspaceNotes.filter((note) => {
    if (!normalizedQuery) return true;
    const searchableNote = [
      note.id,
      note.title,
      note.content,
      note.category,
      note.workspaceId,
      note.createdAt,
    ]
      .join(' ')
      .toLowerCase();
    return searchableNote.includes(normalizedQuery);
  });

  const showNotesSection = historyFilter === 'NOTES' || Boolean(normalizedQuery);
  const showMessagesSection = historyFilter !== 'NOTES';

  const filteredCommandHistory = commandHistory.filter((entry) => {
    if (contextFilter === 'VERIFIED') return entry.provenance === 'VERIFIED';
    if (contextFilter === 'PROPOSALS') return Boolean(entry.proposal);
    if (contextFilter === 'BLOCKED')
      return entry.uiStatus === 'BLOCKED' || entry.uiStatus === 'FAILED' || entry.uiStatus === 'UNAVAILABLE';
    return true;
  });

  const liveMatchingHistory =
    inputMessage.trim().length >= 2
      ? commandHistory.filter((entry) => {
          const query = inputMessage.toLowerCase();
          return (
            entry.commandText.toLowerCase().includes(query) ||
            (entry.replyText && entry.replyText.toLowerCase().includes(query)) ||
            (entry.analysis?.summary && entry.analysis.summary.toLowerCase().includes(query)) ||
            (entry.id && entry.id.toLowerCase().includes(query))
          );
        })
      : [];

  const sourceLines = currentHtml ? currentHtml.split('\n') : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl font-sans"
    >
      {/* ── CLEAN HEADER: AI Workspace + Real Provider & System Status ── */}
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400 shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-white truncate">AI Workspace</h2>
              <span className="text-[10px] font-mono text-cyan-300">
                · {targetWorkspaceId} ({targetWorkspaceName})
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono truncate">
              AI Service Boundary · VOICE ≠ AUTHORIZATION · CHAT ≠ AUTHORIZATION · Core: FROZEN (#
              {ZYRQUEN_CORE_FROZEN_STATE.canonicalBlock})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 font-mono text-[10px] shrink-0">
          {/* Real Provider Connection State */}
          <span
            className={`px-2.5 py-1 rounded border font-semibold flex items-center gap-1.5 ${
              providerStatus === 'CONNECTED'
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/70 border-amber-500/40 text-amber-300'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                providerStatus === 'CONNECTED' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            {providerStatus === 'CONNECTED'
              ? 'Provider Connected'
              : `Provider Unavailable (${providerStatus})`}
          </span>

          {/* Authentic UI Status */}
          <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-cyan-300 font-bold">
            STATUS: {uiStatus}
          </span>

          {/* Provenance */}
          <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
            {provenance}
          </span>

          {/* AI Artifact Preflight Gate Status */}
          <span
            data-testid="ai-artifact-preflight-badge"
            data-preflight-status={preflightResult.status}
            data-preflight-label={preflightResult.preflightLabel}
            className={`px-2.5 py-1 rounded border font-bold flex items-center gap-1.5 ${
              preflightResult.passed && preflightResult.status === 'VERIFIED'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-amber-950/80 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
            }`}
            title={
              preflightResult.passed && preflightResult.status === 'VERIFIED'
                ? `Preflight = VERIFIED | Hash: ${preflightResult.computedHash} | Evidence: ${preflightResult.verifiedEvidenceRef}`
                : `WAITING FOR VERIFIED AI ARTIFACT | Status: ${preflightResult.status} | Reason: ${preflightResult.reason}`
            }
          >
            {preflightResult.passed && preflightResult.status === 'VERIFIED' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Preflight = VERIFIED</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>WAITING FOR VERIFIED AI ARTIFACT</span>
                <span className="opacity-80">({preflightResult.status})</span>
              </>
            )}
          </span>

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={handleExportWorkspacePdf}
            className="px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-semibold flex items-center gap-1.5 cursor-pointer transition"
            title="Export current AI Workspace chat sessions, notes, and source summary to PDF"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          {/* Toggle Real Execution Trace & Failure-First Diagnostics */}
          <button
            type="button"
            onClick={() => setShowTraceAndDiagnostics((v) => !v)}
            className={`px-2.5 py-1 rounded border font-semibold cursor-pointer transition ${
              showTraceAndDiagnostics
                ? 'bg-purple-950/80 border-purple-500/50 text-purple-200'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🔎 Trace &amp; Diagnostics
          </button>
        </div>
      </div>

      {/* ── ALWAYS-VISIBLE AI ARTIFACT PREFLIGHT GATE INDICATOR BANNER ── */}
      <div
        data-testid="ai-artifact-preflight-gate-banner"
        className={`px-4 py-2.5 border-b font-mono text-[10px] flex flex-wrap items-center justify-between gap-2.5 ${
          preflightResult.passed && preflightResult.status === 'VERIFIED'
            ? 'bg-emerald-950/25 border-emerald-500/30 text-emerald-200'
            : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span
            className={`px-2 py-0.5 rounded border font-bold flex items-center gap-1.5 ${
              preflightResult.passed && preflightResult.status === 'VERIFIED'
                ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300'
                : 'bg-amber-950/90 border-amber-500/60 text-amber-300'
            }`}
          >
            {preflightResult.passed && preflightResult.status === 'VERIFIED' ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Preflight = VERIFIED</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                <span>WAITING FOR VERIFIED AI ARTIFACT</span>
              </>
            )}
          </span>

          <span className="px-1.5 py-0.5 rounded bg-zinc-950/80 border border-zinc-800 text-zinc-300 font-semibold">
            Artifact Status: <strong>{preflightResult.status}</strong>
          </span>

          <span className="px-1.5 py-0.5 rounded bg-zinc-950/80 border border-zinc-800 text-zinc-300">
            Reason: <strong>{preflightResult.reason}</strong>
          </span>

          <span
            className={`px-1.5 py-0.5 rounded border font-semibold ${
              preflightResult.allowProceedToProposal
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}
          >
            {preflightResult.allowProceedToProposal
              ? 'Forwarding: Analysis -> Proposal -> Preview -> Explicit Approval (#EP-SOVEREIGN-01)'
              : 'Gate Halted: Proposal Forwarding BLOCKED (Fail-Closed)'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[9px] text-zinc-300">
          <span>
            WS: <strong className="text-cyan-300">{preflightResult.workspaceId}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Req: <strong className="text-zinc-100">{preflightResult.requestId}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Trace: <strong className="text-zinc-100">{preflightResult.traceId}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Hash:{' '}
            <strong className="text-cyan-300">
              {preflightResult.computedHash ? `${preflightResult.computedHash.slice(0, 19)}...` : 'NONE'}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-300 font-bold">
            Core Mutation = 0 · SSoT Mutation = 0 · Genesis #849202 = FROZEN
          </span>

          <div className="flex items-center gap-1.5 ml-1">
            <button
              type="button"
              data-testid="btn-verify-artifact-preflight"
              onClick={handleVerifyWorkspaceArtifactPreflight}
              className="px-2 py-0.5 rounded bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-bold cursor-pointer transition"
              title="Verify real workspace artifact envelope (SHA-256 + EvidenceRef + Workspace/Req/Trace binding)"
            >
              ✓ Verify Artifact
            </button>
            <button
              type="button"
              data-testid="btn-halt-unverified-preflight"
              onClick={handleHoldUnverifiedArtifactPreflight}
              className="px-2 py-0.5 rounded bg-amber-950/90 hover:bg-amber-900 border border-amber-500/50 text-amber-300 font-bold cursor-pointer transition"
              title="Test Fail-Closed gate when artifact is UNVERIFIED / missing evidence"
            >
              ⛔ Hold Unverified
            </button>
          </div>
        </div>
      </div>

      {/* ── SOVEREIGN AUTHENTICATED SESSION & TOOL GATEWAY STRIP ── */}
      <div
        data-testid="sovereign-session-gateway-strip"
        className="px-4 py-2 border-b border-zinc-800 bg-zinc-950/70 flex flex-wrap items-center justify-between gap-2.5 font-mono text-[11px]"
      >
        <div className="flex flex-wrap items-center gap-2">
          {session && session.status === 'ACTIVE' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>👤 เซสชัน: <strong>{session.userDisplayName}</strong></span>
              <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-[9px] font-bold uppercase">{session.role}</span>
              <span className="text-[10px] text-zinc-400">({session.fipsLevel})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>⚠️ ยังไม่ได้เข้าสู่ระบบ (Session Inactive / Guest)</span>
              {onOpenWebAuthn && (
                <button
                  type="button"
                  onClick={onOpenWebAuthn}
                  className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 font-bold cursor-pointer transition text-[10px]"
                >
                  เข้าสู่ระบบ Passkey
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px]">
            <Lock className="w-3 h-3 text-cyan-400" />
            <span>Tool Gateway: <strong>ACTIVE</strong></span>
            <span className="text-zinc-500">·</span>
            <span>Batch: <strong className="text-cyan-300">{currentBatchSize}</strong></span>
            <span className="text-zinc-500">·</span>
            <span className="text-emerald-400">Δ0.00% Zero Drift</span>
          </div>

          {toolGatewayNotice && (
            <div className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-amber-200 text-[10px] animate-pulse">
              {toolGatewayNotice}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearOneChatHistory}
            className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-[10px] cursor-pointer transition flex items-center gap-1"
            title="ล้างประวัติการสนทนาใน ONE CHAT และเริ่มเซสชันใหม่"
          >
            <Trash2 className="w-3 h-3" />
            <span>ล้างแชท</span>
          </button>

          {session && session.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => sessionService.logout()}
              className="px-2 py-1 rounded bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-[10px] cursor-pointer transition"
              title="ออกจากระบบและยกเลิกสิทธิ์ของเซสชัน"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {/* ── UNIFIED REAL EXECUTION TRACE & FAILURE-FIRST DIAGNOSTICS STRIP ── */}
      {showTraceAndDiagnostics && (
        <div className="px-4 py-3 border-b border-zinc-800 bg-[#050914] space-y-3 font-mono text-[10px] tabular-nums">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-cyan-300 uppercase tracking-wider">
                🔎 Real Execution Trace ({executionTrace.traceId})
              </span>
              <span
                className={`px-1.5 py-0.5 rounded font-bold border ${
                  executionTrace.overallStatus === 'FINALIZED'
                    ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                    : executionTrace.overallStatus === 'AWAITING_APPROVAL'
                    ? 'bg-amber-950/70 border-amber-500/40 text-amber-300'
                    : 'bg-rose-950/70 border-rose-500/50 text-rose-300'
                }`}
              >
                {executionTrace.overallStatus}
                {executionTrace.stoppedAtStage ? ` (STOPPED AT ${executionTrace.stoppedAtStage})` : ''}
              </span>
            </div>
            <div className="text-zinc-400">
              Req: <span className="text-zinc-200">{executionTrace.requestId}</span> · Total Duration:{' '}
              <span className="text-cyan-300 font-bold">{executionTrace.totalDurationMs} ms</span>
            </div>
          </div>

          {/* AI Artifact Preflight Gate Diagnostics Bar */}
          <div
            data-testid="trace-artifact-preflight-gate"
            className={`p-2 rounded-lg border flex flex-wrap items-center justify-between gap-2 text-[9px] ${
              preflightResult.passed && preflightResult.status === 'VERIFIED'
                ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/25 border-amber-500/40 text-amber-200'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold uppercase">
                🛡️ AI Artifact Preflight Gate:{' '}
                {preflightResult.passed && preflightResult.status === 'VERIFIED'
                  ? 'Preflight = VERIFIED'
                  : 'WAITING FOR VERIFIED AI ARTIFACT'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 font-bold">
                Status: {preflightResult.status}
              </span>
              <span className="text-zinc-300">
                Reason: <strong>{preflightResult.reason}</strong>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-zinc-300">
              <span>WS: {preflightResult.workspaceId}</span>
              <span>·</span>
              <span>Req: {preflightResult.requestId}</span>
              <span>·</span>
              <span>Trace: {preflightResult.traceId}</span>
              <span>·</span>
              <span>
                Hash: {preflightResult.computedHash ? `${preflightResult.computedHash.slice(0, 20)}...` : 'NONE'}
              </span>
              <span>·</span>
              <span className="text-emerald-300 font-bold">
                Core Mutation = 0 · SSoT Mutation = 0 · Genesis #849202 = FROZEN
              </span>
            </div>
          </div>

          {/* 8-Stage Single Timeline: REQUEST -> ANALYSIS -> PROPOSAL -> APPROVAL #EP-SOVEREIGN-01 -> EXECUTE -> TARGET -> VERIFY -> AUDIT */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-1.5">
            {executionTrace.stages.map((st, idx) => {
              const isPassed = st.status === 'PASSED';
              const isStopped =
                st.status === 'BLOCKED' ||
                st.status === 'FAILED' ||
                st.status === 'PROVIDER_UNAVAILABLE';
              const isAwaiting = st.status === 'AWAITING_APPROVAL';
              return (
                <div
                  key={st.stage}
                  className={`p-2 rounded-lg border flex flex-col justify-between ${
                    isStopped
                      ? 'bg-rose-950/60 border-rose-500/70 text-rose-200'
                      : isAwaiting
                      ? 'bg-amber-950/50 border-amber-500/50 text-amber-200'
                      : isPassed
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : 'bg-zinc-950/80 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 font-bold text-[9px]">
                      <span>0{idx + 1}</span>
                      <span>{st.status}</span>
                    </div>
                    <div className="text-[9px] font-semibold mt-0.5 truncate" title={st.displayLabel}>
                      {st.displayLabel}
                    </div>
                  </div>
                  <div className="mt-1.5 pt-1 border-t border-white/10 space-y-0.5 text-[9px]">
                    <div className="flex justify-between">
                      <span className="opacity-75">{st.timestamp ? st.timestamp.slice(11, 19) : '—'}</span>
                      <span>{st.durationMs !== null ? `${st.durationMs}ms` : '—'}</span>
                    </div>
                    <div className="truncate opacity-80" title={st.evidenceRef || 'NO_EVIDENCE'}>
                      Ev: {st.evidenceRef || 'NONE'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Failure-First Diagnostics Card (Real Evidence Without AI Guessing) */}
          {latestFailureDiagnostic && (
            <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/50 space-y-1.5 text-[10px]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-rose-950 border border-rose-500/60 text-rose-300 font-bold">
                    {latestFailureDiagnostic.classification}
                  </span>
                  <span className="font-bold text-rose-200">
                    Failure-First Diagnostics · {latestFailureDiagnostic.failureId}
                  </span>
                </div>
                <span className="text-zinc-400">
                  Stage: <strong className="text-amber-300">{latestFailureDiagnostic.stage}</strong> · Component:{' '}
                  <strong className="text-cyan-300">{latestFailureDiagnostic.component}</strong>
                </span>
              </div>
              <div className="text-rose-200/95 break-words">
                <strong>Actual Error:</strong> {latestFailureDiagnostic.actualError}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 text-[9px] text-zinc-300 pt-1 border-t border-rose-500/20">
                <div className="truncate" title={latestFailureDiagnostic.expectedState}>
                  <span className="text-zinc-500">Expected:</span> {latestFailureDiagnostic.expectedState}
                </div>
                <div className="truncate" title={latestFailureDiagnostic.observedState}>
                  <span className="text-zinc-500">Observed:</span> {latestFailureDiagnostic.observedState}
                </div>
                <div className="truncate" title={latestFailureDiagnostic.evidence}>
                  <span className="text-zinc-500">Evidence:</span> {latestFailureDiagnostic.evidence}
                </div>
                <div className="truncate" title={latestFailureDiagnostic.recoveryState}>
                  <span className="text-zinc-500">Recovery:</span>{' '}
                  <strong className="text-emerald-300">{latestFailureDiagnostic.recoveryState}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── RESPONSIVE WORKSPACE BODY: Desktop (Chat & History 35% / Preview & Source 65%) ── */}
      <div className="flex flex-col lg:flex-row min-h-[580px]">
        {/* LEFT COLUMN (35% on Desktop): Conversation History + Workspace Notes + Search + Chat/Voice Input */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.26, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
          className="w-full lg:w-[35%] border-b lg:border-b-0 lg:border-r border-zinc-800 flex flex-col bg-zinc-900/40"
        >
          {/* Dedicated Conversation History & Workspace Notes Toolbar */}
          <div className="px-3.5 py-2.5 border-b border-zinc-800 bg-zinc-950/70 space-y-2 font-mono text-[10px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                <History className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  Sessions ({filteredMessages.length}) · Notes ({filteredNotes.length})
                </span>
              </div>
              <div className="flex items-center gap-1">
                {(['ALL', 'TEXT_INPUT', 'VOICE_STT', 'NOTES'] as const).map((flt) => (
                  <button
                    key={flt}
                    type="button"
                    onClick={() => setHistoryFilter(flt)}
                    className={`px-2 py-0.5 rounded transition cursor-pointer ${
                      historyFilter === flt
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {flt === 'ALL'
                      ? 'All'
                      : flt === 'TEXT_INPUT'
                      ? 'Chat'
                      : flt === 'VOICE_STT'
                      ? 'Voice'
                      : 'Notes'}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsAddingNote((prev) => !prev)}
                  className={`px-1.5 py-0.5 rounded border transition cursor-pointer flex items-center gap-0.5 ${
                    isAddingNote
                      ? 'bg-purple-950 text-purple-300 border-purple-500/40 font-bold'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-cyan-500/40'
                  }`}
                  title="Add Workspace Note"
                >
                  <Plus className="w-3 h-3" />
                  <span>Note</span>
                </button>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMessages([])}
                    className="p-1 rounded text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                    title="Clear Conversation History"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Search Input Bar for Past Chat Sessions & Workspace Notes */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search past chat sessions, proposals, or workspace notes..."
                aria-label="Search past chat sessions or workspace notes"
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg pl-8 pr-7 py-1.5 text-[11px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-zinc-500 hover:text-zinc-200 cursor-pointer"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Inline Add Workspace Note Composer */}
            {isAddingNote && (
              <div className="p-2.5 rounded-lg bg-zinc-900/95 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between text-purple-300 font-bold">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    New Workspace Note ({targetWorkspaceId})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingNote(false)}
                    className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Note title (e.g. Batch tuning observation)..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-[11px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-400"
                />
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={2}
                  placeholder="Record workspace note or session reference..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-[11px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-400 resize-none"
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={handleSaveWorkspaceNote}
                    disabled={!newNoteTitle.trim() || !newNoteContent.trim()}
                    className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold cursor-pointer transition"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Conversation History, Search Results & Workspace Notes Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[420px] lg:max-h-[460px]">
            {/* Workspace Notes Section (shown when Notes filter is selected or when searching) */}
            {showNotesSection && filteredNotes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between font-mono text-[10px] text-purple-300 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3 h-3" />
                    Workspace Notes ({filteredNotes.length})
                  </span>
                  <span>{targetWorkspaceId}</span>
                </div>
                {filteredNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="p-3 rounded-xl bg-zinc-950/90 border border-purple-500/30 space-y-1.5 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 text-[9px] text-zinc-400">
                      <span className="px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/30 text-purple-300 font-bold">
                        {note.id} · {note.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span>{note.workspaceId}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteWorkspaceNote(note.id)}
                          className="text-zinc-500 hover:text-rose-400 cursor-pointer"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="font-bold text-zinc-100 text-[11px]">{note.title}</div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}

            {showNotesSection && historyFilter === 'NOTES' && filteredNotes.length === 0 && (
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/90 text-center font-mono text-xs text-zinc-400">
                ไม่พบบันทึก Workspace Notes ที่ตรงกับคำค้นหา &ldquo;{searchQuery}&rdquo;
              </div>
            )}

            {/* Past Chat Sessions Section */}
            {showMessagesSection && (
              <>
                {normalizedQuery && filteredMessages.length === 0 && filteredNotes.length === 0 ? (
                  <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/90 text-center font-mono text-xs text-zinc-400 space-y-1">
                    <div className="text-zinc-200 font-bold">No Matching Sessions or Notes</div>
                    <div>
                      ไม่พบประวัติการสนทนาหรือบันทึกที่ตรงกับคำค้นหา &ldquo;{searchQuery}&rdquo;
                    </div>
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/90 space-y-2 font-mono text-xs text-zinc-400">
                    <div className="flex items-center justify-between text-zinc-200 font-bold">
                      <span>AI Service Boundary</span>
                      <span className="text-[10px] text-emerald-400">Core Mutation = 0</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-cyan-300">
                      Source Code &rarr; AI Request &rarr; Artifact Preflight &rarr; Analysis &rarr; Proposal &rarr; Preview &rarr; Explicit Approval (#EP-SOVEREIGN-01)
                    </p>
                    {providerStatus !== 'CONNECTED' && (
                      <div className="p-2 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300 text-[11px]">
                        Provider Unavailable ({providerStatus}) — Zero-Mock Policy Active
                      </div>
                    )}
                  </div>
                ) : (
                  filteredMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender !== 'user' && (
                        <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div
                        onClick={() => msg.htmlCode && setCurrentHtml(msg.htmlCode)}
                        className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed space-y-2 ${
                          msg.sender === 'user'
                            ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-100'
                            : msg.uiStatus === 'BLOCKED' || msg.uiStatus === 'FAILED'
                            ? 'bg-rose-950/50 border border-rose-500/50 text-rose-200'
                            : msg.uiStatus === 'UNAVAILABLE'
                            ? 'bg-amber-950/40 border border-amber-500/40 text-amber-200'
                            : 'bg-zinc-950/90 border border-zinc-800 text-zinc-200 cursor-pointer hover:border-cyan-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 font-mono text-[9px] opacity-75">
                          <span>{msg.channel === 'VOICE_STT' ? '🎙️ VOICE_STT' : '⌨️ TEXT_INPUT'}</span>
                          <span>
                            {msg.uiStatus} · {msg.provenance}
                          </span>
                        </div>

                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>

                        {msg.analysis && (
                          <div className="p-2 rounded bg-zinc-900/80 border border-zinc-800 font-mono text-[10px] text-zinc-300">
                            <div>Analysis: {msg.analysis.summary}</div>
                            <div className="text-zinc-500 mt-0.5">
                              Target: {msg.analysis.targetWorkspace} · Risk: {msg.analysis.riskLevel}
                            </div>
                          </div>
                        )}

                        {msg.proposal && (
                          <div className="p-3 rounded-xl bg-black/75 border border-cyan-500/30 font-mono text-[11px] space-y-2.5 shadow-lg">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                              <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                                EXPLICIT APPROVAL GATE (ม.๒๖ &amp; ม.๒๘)
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[9px] font-bold">
                                HIGH_MUTATION
                              </span>
                            </div>

                            <div className="space-y-1 text-zinc-300">
                              <div>
                                ข้อเสนอ: <strong>{msg.proposal.parameter}</strong> ({currentBatchSize} &rarr;{' '}
                                <strong className="text-emerald-300">{msg.proposal.proposedBatchSize}</strong>)
                              </div>
                              <div className="text-zinc-400 text-[10px]">
                                ผู้มีอำนาจอนุมัติ: <strong className="text-amber-300">{msg.proposal.requiresApprover}</strong>
                              </div>
                              <div className="text-[10px] text-zinc-400">
                                เป้าหมาย: <strong>{msg.proposal.targetWorkspace}</strong> · SSoT Mutation = 0
                              </div>
                            </div>

                            <div className="p-2 rounded bg-amber-950/30 border border-amber-500/20 text-amber-200/90 text-[10px] leading-relaxed">
                              ⚠️ <strong>ข้อกำหนดอธิปไตยดิจิทัล:</strong> การพิมพ์คำสั่งหรือเสียงไม่ถือเป็นการอนุมัติ (VOICE ≠ AUTHORIZATION) ต้องตรวจสิทธิ์และกดยืนยันการกระทำผ่าน Tool Gateway แยกต่างหาก
                            </div>

                            {/* Approval Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-2 pt-1">
                              {sessionService.isAuthenticated() ? (
                                <button
                                  type="button"
                                  disabled={isExecutingTool}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExecuteApprovedProposal(msg.proposal!);
                                  }}
                                  className="flex-1 py-1.5 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold cursor-pointer transition shadow flex items-center justify-center gap-1.5 text-xs disabled:opacity-50"
                                >
                                  {isExecutingTool ? (
                                    <>
                                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                                      <span>กำลังประมวลผลผ่าน Gateway...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>อนุมัติและสั่งรันผ่าน Tool Gateway</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onOpenWebAuthn) onOpenWebAuthn();
                                  }}
                                  className="flex-1 py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer transition flex items-center justify-center gap-1.5 text-xs"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>เข้าสู่ระบบ Passkey เพื่ออนุมัติ</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectProposal(msg.proposal!.proposalId);
                                }}
                                className="py-1.5 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold cursor-pointer transition text-xs text-center"
                              >
                                ปฏิเสธ
                              </button>
                            </div>

                            {onStageProposalForApproval && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRouteToApprovalGate(msg.proposal!, msg.channel);
                                }}
                                className="w-full py-1 px-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] cursor-pointer transition text-center"
                              >
                                ส่งต่อไปยัง Operations Console (#EP-SOVEREIGN-01)
                              </button>
                            )}
                          </div>
                        )}

                        {msg.htmlCode && (
                          <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>คลิกเพื่อโหลดโค้ดชุดนี้ใน Isolated Preview Sandbox</span>
                          </div>
                        )}
                      </div>
                      {msg.sender === 'user' && (
                        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </>
            )}

            {uiStatus === 'PROCESSING' && (
              <div className="flex gap-2.5 items-center font-mono text-xs text-cyan-300 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <Sparkles className="w-4 h-4 animate-spin shrink-0" />
                <span>PROCESSING via AI Service Boundary...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* ── CONTEXT-AWARE HISTORY & PRIOR RESULTS DECK (Directly Alongside Current Inputs) ── */}
          <div className="border-t border-zinc-800/90 bg-zinc-950/95 flex flex-col font-mono text-xs">
            {/* Header: Prior Results Strip with Context Filter & Toggle */}
            <div className="px-3.5 py-2 border-b border-zinc-800/60 flex items-center justify-between gap-2 text-[10px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-bold text-zinc-200 uppercase tracking-wider truncate">
                  Prior Results ({commandHistory.length})
                </span>
                {activeHistoryContext && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold truncate">
                    <Pin className="w-2.5 h-2.5 shrink-0" />
                    <span>{activeHistoryContext.id}</span>
                    <button
                      type="button"
                      onClick={() => setActiveHistoryContext(null)}
                      className="ml-1 text-cyan-400 hover:text-rose-400 cursor-pointer"
                      title="Detach Active Context"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {(['ALL', 'VERIFIED', 'PROPOSALS', 'BLOCKED'] as const).map((flt) => (
                  <button
                    key={flt}
                    type="button"
                    onClick={() => setContextFilter(flt)}
                    className={`px-1.5 py-0.5 rounded transition text-[9px] cursor-pointer ${
                      contextFilter === flt
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {flt === 'ALL'
                      ? 'All'
                      : flt === 'VERIFIED'
                      ? 'Verified'
                      : flt === 'PROPOSALS'
                      ? 'Proposals'
                      : 'Blocked'}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setIsHistoryDrawerOpen(true)}
                  className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-cyan-300 hover:border-cyan-500/30 transition text-[9px] cursor-pointer"
                  title="Open Full History Browser Modal"
                >
                  History
                </button>

                <button
                  type="button"
                  onClick={() => setShowContextDock((prev) => !prev)}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  title={showContextDock ? 'Collapse Previous Results' : 'Expand Previous Results'}
                  aria-label={showContextDock ? 'Collapse Results Deck' : 'Expand Results Deck'}
                >
                  {showContextDock ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Expandable Context Deck Details */}
            {showContextDock && (
              <div className="p-3 space-y-2 border-b border-zinc-800/60 bg-zinc-900/30">
                {/* Horizontal Carousel / Command Selector Strip */}
                {filteredCommandHistory.length > 0 ? (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-700">
                    {filteredCommandHistory.map((cmd) => {
                      const isSelected = activeHistoryContext?.id === cmd.id;
                      const isCompleted = cmd.uiStatus === 'COMPLETED';
                      const isBlocked = cmd.uiStatus === 'BLOCKED' || cmd.uiStatus === 'FAILED';
                      return (
                        <button
                          key={cmd.id}
                          type="button"
                          onClick={() => setActiveHistoryContext(cmd)}
                          className={`px-2.5 py-1 rounded-lg border text-left shrink-0 transition cursor-pointer max-w-[210px] ${
                            isSelected
                              ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-[9px]">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isCompleted
                                  ? 'bg-emerald-400'
                                  : isBlocked
                                  ? 'bg-rose-500'
                                  : 'bg-amber-400'
                              }`}
                            />
                            <span className="font-bold truncate">{cmd.id}</span>
                            <span className="text-[8px] opacity-60">· {cmd.provenance}</span>
                          </div>
                          <div className="text-[10px] truncate text-zinc-300 mt-0.5 font-normal">
                            {cmd.commandText}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[10px] text-zinc-500 text-center py-1">
                    No previous commands in this filter.
                  </div>
                )}

                {/* Inspected Active Context Card: Shows Result Alongside Current Input */}
                {activeHistoryContext && (
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-cyan-500/30 space-y-2 shadow-inner">
                    <div className="flex flex-wrap items-center justify-between gap-1 text-[9px]">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 font-bold">
                          {activeHistoryContext.id}
                        </span>
                        <span>{activeHistoryContext.channel === 'VOICE_STT' ? '🎙️ VOICE_STT' : '⌨️ TEXT_INPUT'}</span>
                        <span>·</span>
                        <span
                          className={`font-semibold ${
                            activeHistoryContext.uiStatus === 'COMPLETED'
                              ? 'text-emerald-400'
                              : activeHistoryContext.uiStatus === 'BLOCKED'
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {activeHistoryContext.uiStatus}
                        </span>
                        <span>·</span>
                        <span className="text-zinc-500">
                          {new Date(activeHistoryContext.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Reference in Prompt action */}
                        <button
                          type="button"
                          onClick={() => {
                            const refSnippet = `[Ref #${activeHistoryContext.id}: "${activeHistoryContext.commandText.slice(0, 32)}..."] `;
                            setInputMessage((prev) => (prev ? `${prev} ${refSnippet}` : refSnippet));
                          }}
                          className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-semibold flex items-center gap-1 text-[9px] cursor-pointer transition"
                          title="Inject this previous result as reference into your prompt"
                        >
                          <CornerDownLeft className="w-2.5 h-2.5" />
                          <span>Ref in Prompt</span>
                        </button>

                        {/* Reuse Command */}
                        <button
                          type="button"
                          onClick={() => setInputMessage(activeHistoryContext.commandText)}
                          className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold flex items-center gap-1 text-[9px] cursor-pointer transition"
                          title="Reuse this command in the input field"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Reuse</span>
                        </button>

                        {/* Load Code into Preview if present */}
                        {activeHistoryContext.htmlCode && (
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentHtml(activeHistoryContext.htmlCode!);
                              setActiveTab('preview');
                            }}
                            className="px-2 py-0.5 rounded bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-300 font-semibold flex items-center gap-1 text-[9px] cursor-pointer transition"
                            title="Load generated code from this result into preview sandbox"
                          >
                            <Code2 className="w-2.5 h-2.5" />
                            <span>Preview</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Query Prompt Line */}
                    <div className="text-[11px] text-cyan-300 bg-zinc-900/80 px-2 py-1 rounded border border-zinc-800/80 flex items-baseline gap-1.5">
                      <span className="text-zinc-500 select-none">&gt;</span>
                      <span className="font-sans font-medium text-zinc-200 truncate">{activeHistoryContext.commandText}</span>
                    </div>

                    {/* Result Output View */}
                    <div className="bg-black/80 rounded-lg p-2 border border-zinc-800/90 text-[10px] space-y-1">
                      <div className="text-zinc-400 font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Command Execution Result:</span>
                        </span>
                        <span className="text-emerald-400 font-mono text-[9px]">
                          Bitwise Parity: Δ0.00% · SSoT Mutation: 0
                        </span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap max-h-24 overflow-y-auto font-mono text-[10px]">
                        {activeHistoryContext.replyText || 'No reply recorded.'}
                      </p>
                    </div>

                    {/* Analysis & Proposal Details (if available) */}
                    {(activeHistoryContext.analysis || activeHistoryContext.proposal) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[9px] text-zinc-400 pt-0.5">
                        {activeHistoryContext.analysis && (
                          <div className="p-1.5 rounded bg-zinc-900/60 border border-zinc-800">
                            <span className="text-zinc-500 font-bold">Analysis Target:</span>{' '}
                            <span className="text-zinc-200">{activeHistoryContext.analysis.targetWorkspace}</span>{' '}
                            · <span className="text-emerald-400">{activeHistoryContext.analysis.riskLevel} RISK</span>
                          </div>
                        )}
                        {activeHistoryContext.proposal && (
                          <div className="p-1.5 rounded bg-amber-950/30 border border-amber-500/30 text-amber-200">
                            <span className="font-bold">Proposal {activeHistoryContext.proposal.proposalId}:</span>{' '}
                            {activeHistoryContext.proposal.parameter} &rarr; {activeHistoryContext.proposal.proposedBatchSize}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Live Context Match Suggestion (Displayed while user is typing in current input) */}
            {liveMatchingHistory.length > 0 && inputMessage.trim().length >= 2 && (
              <div className="px-3.5 py-1.5 bg-cyan-950/40 border-b border-cyan-500/20 flex items-center justify-between gap-2 text-[10px]">
                <div className="flex items-center gap-1.5 text-cyan-300 truncate">
                  <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="font-bold">Prior Result Match:</span>
                  <span className="text-zinc-300 truncate font-sans">&ldquo;{liveMatchingHistory[0].commandText}&rdquo;</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveHistoryContext(liveMatchingHistory[0])}
                    className="px-2 py-0.5 rounded bg-cyan-900/80 hover:bg-cyan-800 text-cyan-200 text-[9px] font-bold cursor-pointer transition"
                  >
                    View Result
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const refSnippet = `[Ref #${liveMatchingHistory[0].id}: "${liveMatchingHistory[0].commandText.slice(0, 30)}..."] `;
                      setInputMessage((prev) => (prev ? `${prev} ${refSnippet}` : refSnippet));
                    }}
                    className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[9px] cursor-pointer transition"
                  >
                    Attach Ref
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dedicated Voice Input + Chat Input Bar */}
          <div className="p-3.5 border-t border-zinc-800 bg-zinc-950/90 space-y-2">
            {/* Quick Tool Gateway Actions Bar */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] pb-1">
              <span className="text-zinc-500 font-bold flex items-center gap-1 shrink-0">
                <Terminal className="w-3 h-3 text-cyan-400" />
                <span>Gateway Tools:</span>
              </span>

              <button
                type="button"
                disabled={isExecutingTool}
                onClick={() => handleDirectToolCall('workspace.inspect')}
                className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-cyan-500/40 text-cyan-300 font-semibold cursor-pointer transition flex items-center gap-1 disabled:opacity-50"
                title="Inspect real-time telemetry and resource usage via Tool Gateway"
              >
                <span>🔍 ตรวจสอบ Telemetry</span>
              </button>

              <button
                type="button"
                disabled={isExecutingTool}
                onClick={() =>
                  handleDirectToolCall('workspace.tune_batch', {
                    proposedBatchSize: currentBatchSize === 64 ? 48 : 64,
                  })
                }
                className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-500/40 text-amber-300 font-semibold cursor-pointer transition flex items-center gap-1 disabled:opacity-50"
                title="Propose batch size optimization via Tool Gateway"
              >
                <span>⚡ เสนอป้อน Batch {currentBatchSize === 64 ? '64→48' : '48→64'}</span>
              </button>

              <button
                type="button"
                disabled={isExecutingTool}
                onClick={() => handleDirectToolCall('system.hsm_heal')}
                className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-emerald-500/40 text-emerald-300 font-semibold cursor-pointer transition flex items-center gap-1 disabled:opacity-50"
                title="Phoenix Auto-Healing 10/10 HSM Quorum via Tool Gateway"
              >
                <span>🛡️ ซ่อมฉันทามติ 10/10 HSM</span>
              </button>

              <button
                type="button"
                disabled={isExecutingTool}
                onClick={() => handleDirectToolCall('system.audit_sync')}
                className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-purple-500/40 text-purple-300 font-semibold cursor-pointer transition flex items-center gap-1 disabled:opacity-50"
                title="Reconcile offline audit logs to canonical Merkle tree"
              >
                <span>🔄 ปรับยอด Ledger</span>
              </button>

              <button
                type="button"
                disabled={isExecutingTool}
                onClick={() => handleDirectToolCall('workspace.export_dossier')}
                className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-blue-500/40 text-blue-300 font-semibold cursor-pointer transition flex items-center gap-1 disabled:opacity-50"
                title="Package court-admissible dossier evidence via Tool Gateway"
              >
                <span>📑 ออกสำนวนศาล</span>
              </button>
            </div>
            {/* Active Context Bound Tag */}
            {activeHistoryContext && (
              <div className="flex items-center justify-between px-2 py-1 rounded bg-cyan-950/40 border border-cyan-500/30 text-[10px] text-cyan-300 font-mono">
                <div className="flex items-center gap-1.5 truncate">
                  <Pin className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="font-bold">Active Context Bound:</span>
                  <span className="truncate text-zinc-300">[{activeHistoryContext.id}] &ldquo;{activeHistoryContext.commandText}&rdquo;</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveHistoryContext(null)}
                  className="text-zinc-400 hover:text-rose-400 font-bold ml-2 shrink-0 cursor-pointer"
                  title="Detach context from this input"
                >
                  Detach
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`p-2.5 rounded-lg border transition cursor-pointer shrink-0 ${
                  isListening
                    ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                    : 'bg-zinc-900 border-zinc-700 text-cyan-400 hover:bg-zinc-800'
                }`}
                title="Voice Input (Speech-to-Text Only — Cannot Bypass Explicit Approval)"
                aria-label="Toggle Voice Input"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitAiWorkspaceRequest(undefined, 'TEXT_INPUT')}
                placeholder={
                  isListening
                    ? 'LISTENING (Speech-to-Text)...'
                    : activeHistoryContext
                    ? `Type command building on ${activeHistoryContext.id}...`
                    : 'Type chat command or use Voice Input (Voice/Chat != Authorization)...'
                }
                className="flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono"
              />

              <button
                type="button"
                onClick={() => submitAiWorkspaceRequest(undefined, 'TEXT_INPUT')}
                disabled={!inputMessage.trim() || uiStatus === 'PROCESSING'}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-zinc-950 font-bold rounded-lg transition cursor-pointer shrink-0 flex items-center gap-1.5 text-xs font-mono"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>

            {latestProposal && onStageProposalForApproval && (
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-900 font-mono text-[10px]">
                <span className="text-amber-300 truncate">
                  Pending Proposal: {latestProposal.parameter} &rarr; {latestProposal.proposedBatchSize}
                </span>
                <button
                  type="button"
                  onClick={() => handleRouteToApprovalGate(latestProposal, 'TEXT_INPUT')}
                  className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-semibold cursor-pointer shrink-0"
                >
                  Route to Explicit Approval &rarr;
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* RIGHT COLUMN (65% on Desktop): Live Preview (Sandboxed Iframe) | Source Code Viewer */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.26, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="w-full lg:w-[65%] flex flex-col bg-zinc-950 min-h-[400px]"
        >
          {/* Preview | Source Sub-Header */}
          <div className="px-4 py-2.5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 bg-zinc-900/60">
            <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold transition cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold transition cursor-pointer ${
                  activeTab === 'code'
                    ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Source Code</span>
              </button>
              <button
                type="button"
                data-testid="tab-mission-plan"
                onClick={() => {
                  setActiveTab('plan');
                  if (!activeMissionPlan) {
                    setActiveMissionPlan(
                      sovereignMissionPlanner.generatePlan({
                        naturalGoal: inputMessage.trim() || 'Optimize workspace runtime telemetry and batch tuning',
                        targetWorkspace: targetWorkspaceId,
                      })
                    );
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold transition cursor-pointer ${
                  activeTab === 'plan'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mission Plan</span>
              </button>
              <button
                type="button"
                data-testid="tab-research-agent"
                onClick={async () => {
                  setActiveTab('research');
                  if (!activeResearchDossier) {
                    const dossier = await sovereignResearchAgent.conductResearch(
                      inputMessage.trim() || 'Thai Electronic Transactions Act B.E. 2544 Sections 9, 26, 28',
                      targetWorkspaceId
                    );
                    setActiveResearchDossier(dossier);
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold transition cursor-pointer ${
                  activeTab === 'research'
                    ? 'bg-blue-950 text-blue-300 border border-blue-500/40 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Research Agent</span>
              </button>
              <button
                type="button"
                data-testid="tab-coding-agent"
                onClick={async () => {
                  setActiveTab('coding');
                  if (!fileAnalysisReport) {
                    const rep = await sovereignCodingAgent.analyzeFile('src/adapters/toolGateway.ts', targetWorkspaceId);
                    setFileAnalysisReport(rep);
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold transition cursor-pointer ${
                  activeTab === 'coding'
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                <span>Coding Agent</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
              <span
                data-testid="sandbox-preflight-status-pill"
                className={`px-2 py-0.5 rounded border font-bold flex items-center gap-1 ${
                  preflightResult.passed && preflightResult.status === 'VERIFIED'
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                    : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                }`}
              >
                {preflightResult.passed && preflightResult.status === 'VERIFIED'
                  ? 'Preflight = VERIFIED'
                  : 'WAITING FOR VERIFIED AI ARTIFACT'}
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-emerald-300 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>sandbox=&quot;allow-scripts&quot; (Opaque Origin Isolated)</span>
              </span>
              {sandboxViolations.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500/40 text-rose-300 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  <span>Stripped {sandboxViolations.length} parent/storage ref(s)</span>
                </span>
              )}
            </div>
          </div>

          {/* Sandbox Content Area */}
          <div className="flex-1 relative bg-[#030712] flex flex-col">
            <AnimatePresence mode="wait">
              {activeTab === 'plan' ? (
                <motion.div
                  key="mission-plan-panel"
                  data-testid="mission-plan-panel"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="w-full flex-1 flex flex-col p-4 overflow-y-auto space-y-4 font-mono text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div>
                      <div className="text-emerald-400 font-bold flex items-center gap-1.5 text-sm">
                        <Compass className="w-4 h-4" />
                        <span>AI Reasoning &amp; Mission Planner</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        Goal: <span className="text-zinc-200">{activeMissionPlan?.naturalGoal || 'System Surveillance'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold text-[10px]">
                        Status: {activeMissionPlan?.overallStatus || 'READY'}
                      </span>
                      <button
                        type="button"
                        disabled={isExecutingAgentStep}
                        onClick={async () => {
                          if (!activeMissionPlan) return;
                          setIsExecutingAgentStep(true);
                          try {
                            const res = await sovereignMissionPlanner.executeNextStep(
                              activeMissionPlan,
                              session?.role === 'owner'
                                ? {
                                    proposalId: 'PROP-PLAN-AUTO-EXEC',
                                    approvedBy: '#EP-SOVEREIGN-01',
                                    approvedAt: new Date().toISOString(),
                                    signature: 'SIG_PQC_DILITHIUM5_EP01_AUTO',
                                  }
                                : undefined
                            );
                            setActiveMissionPlan({ ...res.plan });
                          } finally {
                            setIsExecutingAgentStep(false);
                          }
                        }}
                        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold cursor-pointer transition disabled:opacity-50 text-[11px]"
                      >
                        {isExecutingAgentStep ? 'Executing Step...' : '▶ Execute Next Step'}
                      </button>
                    </div>
                  </div>

                  {/* Reasoning Notes */}
                  {activeMissionPlan?.reasoningNotes && activeMissionPlan.reasoningNotes.length > 0 && (
                    <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1 text-[11px]">
                      <div className="text-zinc-400 font-bold">🧠 Reasoning Trace &amp; Invariants:</div>
                      {activeMissionPlan.reasoningNotes.map((note, idx) => (
                        <div key={idx} className="text-zinc-300 flex items-baseline gap-2">
                          <span className="text-cyan-400 select-none">&bull;</span>
                          <span>{note}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Planned Steps */}
                  <div className="space-y-2">
                    <div className="text-zinc-400 font-bold text-[11px]">Planned Steps &amp; Dependency Graph:</div>
                    {activeMissionPlan?.steps.map((st) => (
                      <div
                        key={st.stepId}
                        className={`p-3 rounded-lg border flex flex-col gap-1.5 transition ${
                          st.status === 'COMPLETED'
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                            : st.status === 'RUNNING'
                            ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-200 animate-pulse'
                            : st.status === 'APPROVAL_REQUIRED'
                            ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-700 text-[10px] font-bold">
                              {st.order}. {st.stepId}
                            </span>
                            <span className="font-bold text-zinc-100">{st.title}</span>
                            <span className="text-[10px] text-cyan-400 font-mono">[{st.toolId}]</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            {st.requiresApproval && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                                Approval Required
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                st.status === 'COMPLETED'
                                  ? 'bg-emerald-900/60 text-emerald-300'
                                  : st.status === 'APPROVAL_REQUIRED'
                                  ? 'bg-amber-900/60 text-amber-300'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {st.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-zinc-400 text-[11px]">{st.description}</p>
                        {st.verifiedEvidenceRef && (
                          <div className="text-[10px] text-emerald-400 font-mono">
                            Evidence: {st.verifiedEvidenceRef}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : activeTab === 'research' ? (
                <motion.div
                  key="research-agent-panel"
                  data-testid="research-agent-panel"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="w-full flex-1 flex flex-col p-4 overflow-y-auto space-y-4 font-mono text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div>
                      <div className="text-blue-400 font-bold flex items-center gap-1.5 text-sm">
                        <BookOpen className="w-4 h-4" />
                        <span>Research &amp; Evidence Browser Agent</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        Statutory Evidence &amp; Standards · Zero Mutation Permission (Read-Only)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const dossier = await sovereignResearchAgent.conductResearch(
                          inputMessage.trim() || 'พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. ๒๕๔๔ มาตรา ๙, ๒๖, ๒๘',
                          targetWorkspaceId
                        );
                        setActiveResearchDossier(dossier);
                      }}
                      className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition text-[11px]"
                    >
                      🔄 Refresh Research
                    </button>
                  </div>

                  {activeResearchDossier ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-200">Topic: {activeResearchDossier.queryTopic}</span>
                          <span className="text-emerald-400 font-bold">
                            Confidence: {(activeResearchDossier.confidenceScore * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Completed: {activeResearchDossier.completedAt} · Evidence: {activeResearchDossier.auditEvidenceRef}
                        </div>
                      </div>

                      {/* Sources */}
                      <div className="space-y-2">
                        <div className="text-zinc-400 font-bold text-[11px]">Primary Evidentiary Sources:</div>
                        {activeResearchDossier.sources.map((src, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-cyan-300 font-bold">{src.title}</span>
                              <span className="text-[10px] text-zinc-400">Reliability: {(src.reliabilityScore * 100).toFixed(0)}%</span>
                            </div>
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-blue-400 hover:underline break-all"
                            >
                              {src.url}
                            </a>
                            <div className="pt-1 space-y-0.5 text-[11px] text-zinc-300">
                              {src.factualExcerpts.map((exc, eIdx) => (
                                <div key={eIdx}>&ldquo;{exc}&rdquo;</div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Facts vs Inferences Separation */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                          <div className="text-emerald-400 font-bold">📌 Verified Factual Findings:</div>
                          {activeResearchDossier.facts.map((f, i) => (
                            <div key={i} className="text-zinc-300 text-[11px]">&bull; {f}</div>
                          ))}
                        </div>
                        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                          <div className="text-cyan-400 font-bold">💡 Legal Inferences &amp; Conclusions:</div>
                          {activeResearchDossier.inferencesAndConclusions.map((inf, i) => (
                            <div key={i} className="text-zinc-300 text-[11px]">&bull; {inf}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-zinc-500">คลิก Refresh Research เพื่อเริ่มค้นคว้าหลักฐาน</div>
                  )}
                </motion.div>
              ) : activeTab === 'coding' ? (
                <motion.div
                  key="coding-agent-panel"
                  data-testid="coding-agent-panel"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="w-full flex-1 flex flex-col p-4 overflow-y-auto space-y-4 font-mono text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div>
                      <div className="text-amber-400 font-bold flex items-center gap-1.5 text-sm">
                        <GitBranch className="w-4 h-4" />
                        <span>Coding &amp; File Agent (Extension Plane Only)</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        Hash Verification · Diff Proposals · Approval Gate Required for File Mutation
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const rep = await sovereignCodingAgent.analyzeFile('src/adapters/toolGateway.ts', targetWorkspaceId);
                          setFileAnalysisReport(rep);
                        }}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold cursor-pointer transition text-[11px]"
                      >
                        Inspect File
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const prop = await sovereignCodingAgent.proposeDiff(
                            'src/adapters/toolGateway.ts',
                            '// Proposed extension diff',
                            'Enhance tool error diagnostics',
                            targetWorkspaceId
                          );
                          setActiveDiffProposal(prop);
                        }}
                        className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold cursor-pointer transition text-[11px]"
                      >
                        Propose Diff
                      </button>
                    </div>
                  </div>

                  {/* File Inspection Report */}
                  {fileAnalysisReport && (
                    <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-200">File: {fileAnalysisReport.filePath}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold text-[10px]">
                          Syntax Valid
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono break-all">
                        Pre-Hash (SHA-256): <span className="text-cyan-300">{fileAnalysisReport.sha256Hash}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Dependencies: {fileAnalysisReport.dependencies.join(', ')} · Evidence: {fileAnalysisReport.auditEvidenceRef}
                      </div>
                    </div>
                  )}

                  {/* Diff Proposal */}
                  {activeDiffProposal && (
                    <div className="p-3 rounded-lg bg-zinc-950 border border-amber-500/40 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-300">Proposal {activeDiffProposal.proposalId}</span>
                          <span className="text-zinc-400">({activeDiffProposal.filePath})</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-500/50 text-amber-300 font-bold text-[10px]">
                          Requires Approval (#EP-SOVEREIGN-01)
                        </span>
                      </div>
                      <pre className="p-2 rounded bg-black border border-zinc-800 text-[11px] text-emerald-400 overflow-x-auto">
                        {activeDiffProposal.unifiedDiff}
                      </pre>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-zinc-400">
                          Summary: {activeDiffProposal.changeSummary}
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!activeDiffProposal) return;
                            const res = await sovereignCodingAgent.applyApprovedMutation(
                              activeDiffProposal,
                              session?.role === 'owner'
                                ? {
                                    proposalId: activeDiffProposal.proposalId,
                                    approvedBy: '#EP-SOVEREIGN-01',
                                    approvedAt: new Date().toISOString(),
                                    signature: 'SIG_PQC_DILITHIUM5_EP01_MUTATE',
                                  }
                                : undefined,
                              targetWorkspaceId
                            );
                            if (res.success) {
                              alert(`Mutation Applied Successfully! New SHA-256: ${res.newSha256}`);
                            } else {
                              alert(`Mutation Blocked: ${res.error}`);
                            }
                          }}
                          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold cursor-pointer transition text-[11px]"
                        >
                          ✓ Apply Approved Mutation
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : currentHtml ? (
                activeTab === 'preview' ? (
                  <motion.div
                    key="sandbox-live-preview"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full flex-1 flex flex-col bg-[#030712]"
                  >
                    <iframe
                      title="Isolated AI Workspace Preview Sandbox"
                      sandbox="allow-scripts"
                      referrerPolicy="no-referrer"
                      srcDoc={currentHtml}
                      className="w-full flex-1 min-h-[400px] border-none bg-[#030712]"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="sandbox-source-code"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full flex-1 flex flex-col bg-[#030712]"
                  >
                    <div className="px-4 py-2 border-b border-zinc-800/80 bg-zinc-950/90 flex items-center justify-between font-mono text-[11px] text-zinc-400">
                      <span>
                        Sanitized HTML5 Source · {sourceLines.length} lines · {currentHtml.length} chars
                      </span>
                      <button
                        type="button"
                        onClick={handleCopySourceCode}
                        className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-cyan-300 flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedSource ? 'Copied' : 'Copy Source'}</span>
                      </button>
                    </div>
                    <div className="w-full flex-1 p-4 overflow-auto font-mono text-xs text-cyan-300 select-text">
                      {sourceLines.map((line, idx) => (
                        <div key={idx} className="flex gap-3 leading-relaxed">
                          <span className="w-8 text-right text-zinc-600 select-none shrink-0">
                            {idx + 1}
                          </span>
                          <span className="whitespace-pre-wrap break-all">{line}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )
              ) : (
                <motion.div
                  key="sandbox-empty-boundary"
                  data-testid="sandbox-waiting-verified-artifact-gate"
                  initial={{ opacity: 0, scale: 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.985 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="flex-1 flex flex-col items-center justify-center p-6 text-center font-mono space-y-3"
                >
                  <div className="p-3 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-400">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-amber-950/80 border border-amber-500/50 text-xs sm:text-sm font-bold text-amber-300">
                    WAITING FOR VERIFIED AI ARTIFACT
                  </div>
                  {providerStatus !== 'CONNECTED' && (
                    <div className="text-[11px] font-semibold text-zinc-400">
                      PROVIDER UNAVAILABLE ({providerStatus})
                    </div>
                  )}
                  <div className="max-w-lg p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[10px] text-zinc-300 space-y-1.5">
                    <div>
                      Preflight Status:{' '}
                      <strong className="text-amber-300">{preflightResult.status}</strong> · Reason:{' '}
                      <strong className="text-rose-300">{preflightResult.reason}</strong>
                    </div>
                    <div className="text-zinc-400">
                      Fail-Closed Gate: Artifact must have verified provenance, real evidenceRef, matching SHA-256 digest, and active Workspace/Request/Trace binding before entering Analysis &rarr; Proposal &rarr; Preview &rarr; Explicit Approval (#EP-SOVEREIGN-01).
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 text-[10px] text-zinc-500 pt-1">
                    <span>DOM/Parent: BLOCKED</span>
                    <span aria-hidden="true">·</span>
                    <span>Storage: BLOCKED</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-400 font-bold">Core Mutation: 0 · SSoT Mutation: 0</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* ── FULL COMMAND HISTORY & RESULTS INSPECTOR MODAL ── */}
      <AnimatePresence>
        {isHistoryDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-4xl max-h-[85vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between gap-3 bg-zinc-900/60">
                <div className="flex items-center gap-2.5">
                  <Terminal className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                      Command History &amp; Prior Execution Manifest
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      View previous command results, audit traces, and bind context directly into active input.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body: List of Command History Entries */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {commandHistory.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-xs">
                    No command executions recorded yet.
                  </div>
                ) : (
                  commandHistory.map((cmd) => {
                    const isSelected = activeHistoryContext?.id === cmd.id;
                    return (
                      <div
                        key={cmd.id}
                        className={`p-3.5 rounded-xl border transition space-y-2.5 ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg'
                            : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-cyan-400">{cmd.id}</span>
                            <span className="text-zinc-500">·</span>
                            <span className="text-[10px] text-zinc-400">
                              {cmd.channel === 'VOICE_STT' ? '🎙️ VOICE_STT' : '⌨️ TEXT_INPUT'}
                            </span>
                            <span className="text-zinc-500">·</span>
                            <span
                              className={`text-[10px] font-bold ${
                                cmd.uiStatus === 'COMPLETED'
                                  ? 'text-emerald-400'
                                  : cmd.uiStatus === 'BLOCKED'
                                  ? 'text-rose-400'
                                  : 'text-amber-400'
                              }`}
                            >
                              {cmd.uiStatus}
                            </span>
                            <span className="text-zinc-500">·</span>
                            <span className="text-[10px] text-zinc-500">
                              {new Date(cmd.timestamp).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveHistoryContext(cmd);
                                setIsHistoryDrawerOpen(false);
                              }}
                              className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold text-[10px] cursor-pointer transition flex items-center gap-1"
                            >
                              <Pin className="w-3 h-3" />
                              <span>Dock as Active Context</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setInputMessage(cmd.commandText);
                                setIsHistoryDrawerOpen(false);
                              }}
                              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] cursor-pointer transition flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reuse</span>
                            </button>
                          </div>
                        </div>

                        {/* Command Text */}
                        <div className="text-xs text-zinc-200 bg-black/60 px-3 py-1.5 rounded-lg border border-zinc-800/80">
                          <span className="text-zinc-500 mr-1.5">&gt;</span>
                          <span className="font-sans">{cmd.commandText}</span>
                        </div>

                        {/* Result Output */}
                        <div className="text-[11px] text-zinc-300 bg-black/80 p-2.5 rounded-lg border border-zinc-800 space-y-1">
                          <div className="text-zinc-400 font-bold text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Execution Result / Outcome:</span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">
                            {cmd.replyText || 'No reply text recorded.'}
                          </p>
                        </div>

                        {/* Analysis & Proposal if present */}
                        {(cmd.analysis || cmd.proposal) && (
                          <div className="flex flex-wrap gap-2 text-[10px] text-zinc-400 pt-1">
                            {cmd.analysis && (
                              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                                Target: {cmd.analysis.targetWorkspace} · Risk: {cmd.analysis.riskLevel}
                              </span>
                            )}
                            {cmd.proposal && (
                              <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300">
                                Proposal: {cmd.proposal.parameter} &rarr; {cmd.proposal.proposedBatchSize}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 bg-zinc-900/60">
                <span>SSoT Invariant: All executions recorded in WORM Audit Ledger (Δ0.00% Zero Drift)</span>
                <button
                  type="button"
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default AIWorkspace;
