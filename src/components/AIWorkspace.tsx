import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'lucide-react';
import { ProvenanceState, ZYRQUEN_CORE_FROZEN_STATE } from '../adapters/zyrquenAdapter';
import { offlineAuditSyncService } from '../services/offlineAuditSyncService';

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

export interface AIWorkspaceProps {
  targetWorkspaceId?: string;
  targetWorkspaceName?: string;
  currentBatchSize?: number;
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

  if (cleaned.includes('<head>')) {
    cleaned = cleaned.replace('<head>', `<head>\n  ${cspMetaTag}`);
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
  currentBatchSize = 64,
  onStageProposalForApproval,
  onAuditRecord,
}: AIWorkspaceProps) {
  const [providerStatus, setProviderStatus] = useState<AiProviderConnectionState>('WAITING_FOR_PROVIDER');
  const [uiStatus, setUiStatus] = useState<AiWorkspaceUiStatus>('IDLE');
  const [provenance, setProvenance] = useState<ProvenanceState>('UNVERIFIED');
  const [messages, setMessages] = useState<AiConversationMessage[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'ALL' | AiInputChannel>('ALL');
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [currentHtml, setCurrentHtml] = useState<string | null>(null);
  const [sandboxViolations, setSandboxViolations] = useState<string[]>([]);
  const [latestProposal, setLatestProposal] = useState<AiProposalSummary | null>(null);
  const [copiedSource, setCopiedSource] = useState(false);

  const msgSeqRef = useRef<number>(1);
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
          setProviderStatus(connected ? 'CONNECTED' : 'PROVIDER_NOT_CONNECTED');
          setUiStatus(connected ? 'IDLE' : 'UNAVAILABLE');
          setProvenance(connected ? 'OBSERVED' : 'UNVERIFIED');
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
   * Text / Voice -> Speech-to-Text -> AI Request (/api/ai/workspace) -> Analysis -> Proposal -> Preview -> Explicit Approval
   * VOICE != AUTHORIZATION, CHAT != AUTHORIZATION, AI != AUTHORIZATION
   */
  const submitAiWorkspaceRequest = useCallback(
    async (rawText?: string, channel: AiInputChannel = 'TEXT_INPUT') => {
      const promptText = (rawText ?? inputMessage).trim();
      if (!promptText || uiStatus === 'PROCESSING') return;

      const seq = msgSeqRef.current++;
      const nowIso = new Date().toISOString();
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
        `Channel=${channel} | Workspace=${targetWorkspaceId} | Prompt="${promptText.slice(0, 120)}" (Routed to AI Service Boundary; Authorization=NONE)`,
        'VERIFIED',
        channel
      );

      try {
        const res = await fetch('/api/ai/workspace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptText,
            inputChannel: channel,
            targetWorkspace: targetWorkspaceId,
          }),
        });

        const data = await res.json();
        const nextProviderStatus: AiProviderConnectionState =
          data.providerStatus || 'PROVIDER_NOT_CONNECTED';
        const nextUiStatus: AiWorkspaceUiStatus = data.uiStatus || 'UNAVAILABLE';
        const nextProvenance: ProvenanceState = data.provenance || 'UNVERIFIED';

        setProviderStatus(nextProviderStatus);
        setUiStatus(nextUiStatus);
        setProvenance(nextProvenance);

        let validatedHtml: string | null = null;
        if (typeof data.htmlPreview === 'string' && data.htmlPreview.trim()) {
          const validation = validateAndSanitizePreviewHtml(data.htmlPreview);
          validatedHtml = validation.sanitizedHtml;
          setSandboxViolations(validation.blockedReasons);
          if (validatedHtml) {
            setCurrentHtml(validatedHtml);
          }
        }

        if (data.proposal) {
          setLatestProposal(data.proposal);
        }

        const aiMsg: AiConversationMessage = {
          id: `ai-${seq}`,
          sender: 'ai',
          channel,
          text:
            data.replyText ||
            'Provider Unavailable (PROVIDER_NOT_CONNECTED): AI Service Boundary returned no verified output.',
          timestamp: new Date().toISOString(),
          uiStatus: nextUiStatus,
          provenance: nextProvenance,
          htmlCode: validatedHtml,
          analysis: data.analysis || null,
          proposal: data.proposal || null,
          requiresExplicitApproval: Boolean(data.requiresExplicitApproval),
        };

        setMessages((prev) => [...prev, aiMsg]);

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
        setProviderStatus('PROVIDER_NOT_CONNECTED');
        setUiStatus('FAILED');
        setProvenance('UNVERIFIED');

        const errRecord: AiConversationMessage = {
          id: `err-${seq}`,
          sender: 'system',
          channel,
          text: `Provider Unavailable (PROVIDER_NOT_CONNECTED / FAILED): ${errMsg}`,
          timestamp: new Date().toISOString(),
          uiStatus: 'FAILED',
          provenance: 'UNVERIFIED',
        };
        setMessages((prev) => [...prev, errRecord]);
      }
    },
    [inputMessage, uiStatus, targetWorkspaceId, emitStandardAuditRecord, speakText]
  );

  // Voice Input Channel: Listening -> Speech-to-Text -> Text -> Normal AI Pipeline
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!SpeechRecognition || typeof SpeechRecognition !== 'function') return;

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

    if (isListening) {
      setUiStatus('LISTENING');
      recognition.start();
    } else {
      recognition.stop();
    }

    return () => recognition.stop();
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

  const handleCopySourceCode = () => {
    if (!currentHtml || typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(currentHtml);
    setCopiedSource(true);
  };

  const filteredMessages = messages.filter((m) =>
    historyFilter === 'ALL' ? true : m.channel === historyFilter
  );

  const sourceLines = currentHtml ? currentHtml.split('\n') : [];

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl font-sans">
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
        </div>
      </div>

      {/* ── RESPONSIVE WORKSPACE BODY: Desktop (Chat & History 35% / Preview & Source 65%) ── */}
      <div className="flex flex-col lg:flex-row min-h-[580px]">
        {/* LEFT COLUMN (35% on Desktop): Conversation History + Chat + Voice Input */}
        <div className="w-full lg:w-[35%] border-b lg:border-b-0 lg:border-r border-zinc-800 flex flex-col bg-zinc-900/40">
          {/* Dedicated Conversation History Toolbar */}
          <div className="px-3.5 py-2 border-b border-zinc-800 bg-zinc-950/70 flex items-center justify-between gap-2 font-mono text-[10px]">
            <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span>Conversation History ({filteredMessages.length})</span>
            </div>
            <div className="flex items-center gap-1">
              {(['ALL', 'TEXT_INPUT', 'VOICE_STT'] as const).map((flt) => (
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
                  {flt === 'ALL' ? 'All' : flt === 'TEXT_INPUT' ? 'Chat' : 'Voice'}
                </button>
              ))}
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  className="p-1 rounded text-zinc-500 hover:text-rose-400 transition cursor-pointer ml-1"
                  title="Clear Conversation History"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Conversation History & Chat Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[420px] lg:max-h-[460px]">
            {filteredMessages.length === 0 ? (
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/90 space-y-2.5 font-mono text-xs text-zinc-400">
                <div className="flex items-center justify-between text-zinc-200 font-bold">
                  <span>AI Service Boundary</span>
                  <span className="text-[10px] text-emerald-400">🔒 Core Mutation = 0</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  ส่งคำสั่งผ่าน <strong>Chat</strong> หรือ <strong>Voice Input (Speech-to-Text)</strong> เพื่อเข้าสู่ Pipeline มาตรฐาน:
                  <span className="block text-cyan-300 mt-1">
                    Text/Voice → AI Request → Analysis → Proposal → Preview → Explicit Approval → Command Engine → ZYRQUEN Adapter
                  </span>
                </p>
                {providerStatus !== 'CONNECTED' && (
                  <div className="p-2.5 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300 text-[11px]">
                    ⚠️ <strong>Provider Unavailable ({providerStatus})</strong>: ยังไม่ได้เชื่อมต่อ AI Provider จริง ระบบปฏิเสธการใช้ Mock LLM หรือ setTimeout สร้างผลลัพธ์ปลอมตามกฎ Zero-Mock Policy
                  </div>
                )}
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg.id}
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
                      <div className="p-2 rounded bg-black/50 border border-zinc-800 font-mono text-[10px] space-y-1.5">
                        <div className="text-cyan-300 font-bold">
                          Proposal: {msg.proposal.parameter} ({currentBatchSize} &rarr;{' '}
                          {msg.proposal.proposedBatchSize})
                        </div>
                        <div className="text-zinc-400">
                          Required Authority: <strong className="text-amber-300">{msg.proposal.requiresApprover}</strong>
                        </div>
                        {onStageProposalForApproval && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRouteToApprovalGate(msg.proposal!, msg.channel);
                            }}
                            className="w-full mt-1 py-1.5 px-2 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-bold cursor-pointer transition"
                          >
                            🔒 Route to Explicit Approval Gate (#EP-SOVEREIGN-01)
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
                </div>
              ))
            )}

            {uiStatus === 'PROCESSING' && (
              <div className="flex gap-2.5 items-center font-mono text-xs text-cyan-300 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <Sparkles className="w-4 h-4 animate-spin shrink-0" />
                <span>PROCESSING via AI Service Boundary...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Dedicated Voice Input + Chat Input Bar */}
          <div className="p-3.5 border-t border-zinc-800 bg-zinc-950/90 space-y-2">
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
        </div>

        {/* RIGHT COLUMN (65% on Desktop): Live Preview (Sandboxed Iframe) | Source Code Viewer */}
        <div className="w-full lg:w-[65%] flex flex-col bg-zinc-950 min-h-[400px]">
          {/* Preview | Source Sub-Header */}
          <div className="px-4 py-2.5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 bg-zinc-900/60">
            <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-semibold transition cursor-pointer ${
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
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-semibold transition cursor-pointer ${
                  activeTab === 'code'
                    ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Source Code</span>
              </button>
            </div>

            <div className="flex items-center gap-2 font-mono text-[10px]">
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
            {currentHtml ? (
              activeTab === 'preview' ? (
                <iframe
                  title="Isolated AI Workspace Preview Sandbox"
                  sandbox="allow-scripts"
                  referrerPolicy="no-referrer"
                  srcDoc={currentHtml}
                  className="w-full flex-1 min-h-[400px] border-none bg-[#030712]"
                />
              ) : (
                <div className="w-full flex-1 flex flex-col bg-[#030712]">
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
                </div>
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center font-mono space-y-3">
                <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-amber-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-zinc-200">
                  {providerStatus === 'CONNECTED'
                    ? 'WAITING FOR VERIFIED AI ARTIFACT (IDLE)'
                    : `Provider Unavailable (${providerStatus}) — NO MOCK PREVIEW`}
                </div>
                <p className="text-[11px] text-zinc-400 max-w-md leading-relaxed">
                  {providerStatus === 'CONNECTED'
                    ? 'ส่งคำสั่งผ่าน Chat หรือ Voice Input เพื่อวิเคราะห์และสร้าง Preview ภายใต้ Sandbox Isolation (sandbox="allow-scripts")'
                    : 'ยังไม่มีการเชื่อมต่อ AI Provider จริง (Provider Unavailable) ระบบไม่แสดงหน้าเว็บจำลองหรือสถานะ Sandbox Ready ปลอมตามกฎ Zero-Mock Policy'}
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-[10px] text-zinc-500 pt-1">
                  <span>DOM/Parent Access: BLOCKED</span>
                  <span aria-hidden="true">·</span>
                  <span>Cookies/localStorage: BLOCKED</span>
                  <span aria-hidden="true">·</span>
                  <span>Core Mutation: 0</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIWorkspace;
