/**
 * ZYRQUEN Ω∞ Workspace Templates View (Phase 3)
 * Template Catalog for AI Workspace and Sovereign Automation Pipelines
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Layers,
  Code2,
  Cpu,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Copy,
  Terminal,
} from 'lucide-react';
import { playTone } from '../../components/AudioSynthesizer';

export interface WorkspaceTemplate {
  id: string;
  name: string;
  category: 'API' | 'AI_AGENT' | 'DASHBOARD' | 'SECURITY' | 'PQC';
  description: string;
  tags: string[];
  snippet: string;
}

const TEMPLATES: WorkspaceTemplate[] = [
  {
    id: 'tpl-api-gateway',
    name: 'Sovereign REST & gRPC API Service',
    category: 'API',
    description: 'โครงสร้างเบื้องต้นสำหรับสร้าง High-Throughput REST API พร้อม PQC Handshake และ Zero-Mutation Interceptor',
    tags: ['REST', 'gRPC', 'PQC', 'FIPS 140-3'],
    snippet: `// Sovereign Gateway Init
const gateway = new SovereignGateway({
  port: 8443,
  pqcScheme: 'ML-KEM-1024',
  failClosed: true
});`,
  },
  {
    id: 'tpl-ai-agent',
    name: 'Autonomous SGX Enclave AI Agent',
    category: 'AI_AGENT',
    description: 'โครงสร้างสำหรับสร้าง AI Agent ใหม่ใน Isolated Enclave พร้อม 6-Gate Approval Pipeline',
    tags: ['AI Agent', 'SGX', 'Zero-Mock', '6-Gate'],
    snippet: `// Agent Reasoning Mesh Enclave
const agent = new AutonomousAgentEnclave({
  role: 'ws-agent-02',
  quotaLimit: '85% CPU',
  auditTrail: 'WORM_LEDGER'
});`,
  },
  {
    id: 'tpl-dashboard-console',
    name: 'Executive Command Center Layout',
    category: 'DASHBOARD',
    description: 'UI Layout สำหรับ Command Center Dashboard พร้อม CSS Grid และ Max-Width Constraints',
    tags: ['CSS Grid', 'Tailwind', 'Executive', 'Responsive'],
    snippet: `// Grid Workspace Shell
<div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-6">
  <ExecutiveSummaryView />
</div>`,
  },
  {
    id: 'tpl-pqc-vault',
    name: 'Kyber-1024 / Dilithium-5 Cryptographic Vault',
    category: 'PQC',
    description: 'โครงสร้างการเข้ารหัสหลังยุคควอนตัม (Post-Quantum Cryptography) รองรับ NIST FIPS 203/204/205',
    tags: ['NIST FIPS 203', 'Kyber-1024', 'SLH-DSA', 'Cryo'],
    snippet: `// PQC Multi-Pass Hybrid Enclave
const vault = new Kyber1024Vault({
  subKelvinTemp: '14.98mK',
  quorum: '10/10_REAL_HSM'
});`,
  },
];

export const TemplatesView: React.FC<{ onUseTemplate?: (template: WorkspaceTemplate) => void }> = ({
  onUseTemplate,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const handleCopy = (id: string, code: string) => {
    playTone(660, 0.04);
    navigator.clipboard?.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApply = (tpl: WorkspaceTemplate) => {
    playTone(880, 0.06);
    setAppliedId(tpl.id);
    if (onUseTemplate) onUseTemplate(tpl);
    setTimeout(() => setAppliedId(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#080d1a] border border-cyan-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-mono font-black text-white">
              AI Workspace Templates (Phase 3)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-sans">
            โครงสร้างแม่แบบระบบพร้อมใช้งานสำหรับการสร้าง Enclave, API, และ Automation Pipelines
          </p>
        </div>
        <div className="text-[11px] font-mono px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
          {TEMPLATES.length} TEMPLATES READY
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 shadow-lg hover:shadow-cyan-500/10 transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-500/30">
                    {tpl.category}
                  </span>
                  <h3 className="text-base font-mono font-bold text-white group-hover:text-cyan-300 transition-colors mt-2">
                    {tpl.name}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {tpl.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tpl.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-black/40 text-slate-400 border border-white/5"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Code Snippet Preview */}
              <div className="p-3 rounded-xl bg-black/60 border border-white/5 font-mono text-[11px] text-cyan-300/90 relative">
                <pre className="overflow-x-auto whitespace-pre-wrap">{tpl.snippet}</pre>
                <button
                  type="button"
                  onClick={() => handleCopy(tpl.id, tpl.snippet)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy Snippet"
                >
                  {copiedId === tpl.id ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleApply(tpl)}
                className={`w-full py-2.5 px-4 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  appliedId === tpl.id
                    ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'bg-gradient-to-r from-cyan-500 to-violet-700 hover:from-cyan-400 hover:to-violet-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:scale-[1.01]'
                }`}
              >
                {appliedId === tpl.id ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Template Activated!</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Use Template 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplatesView;
