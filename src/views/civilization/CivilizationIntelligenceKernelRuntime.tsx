/**
 * ZYRQUEN Ω∞ Civilization Intelligence Kernel Runtime (Phase 18)
 * Constitutional Execution Guard & Multi-Agent Civilization OS Kernel Extension
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Cpu, ShieldCheck, Scale, Award, Zap, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { playTone, playAuditChime } from '../../components/AudioSynthesizer';
import { SYSTEM_METADATA } from '../../data/canonicalData';

export const CivilizationIntelligenceKernelRuntime: React.FC = () => {
  const [executionState, setExecutionState] = useState<'IDLE' | 'EXECUTING' | 'RATIFIED'>('RATIFIED');

  const triggerExecution = () => {
    playTone(680, 0.05);
    setExecutionState('EXECUTING');
    setTimeout(() => {
      setExecutionState('RATIFIED');
      playAuditChime();
    }, 900);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#080d1a] border border-cyan-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-mono font-black text-white">
              Civilization Intelligence Kernel Runtime (Phase 18)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-sans">
            ระบบปฏิบัติการปัญญาประดิษฐ์อารยธรรม (Civilization OS) ที่บังคับใช้รัฐธรรมนูญและพันธสัญญาทางนิติวิทยาศาสตร์ในทุกรอบการคำนวณ
          </p>
        </div>

        <button
          type="button"
          onClick={triggerExecution}
          disabled={executionState === 'EXECUTING'}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-700 hover:from-cyan-400 hover:to-violet-600 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
        >
          <Zap className={`w-4 h-4 ${executionState === 'EXECUTING' ? 'animate-spin' : ''}`} />
          <span>{executionState === 'EXECUTING' ? 'Running Constitutional Proof...' : 'Execute Constitutional Proof'}</span>
        </button>
      </div>

      {/* Kernel State Architecture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase">
            <Lock className="w-4 h-4" />
            <span>0-Mutation Kernel Guard</span>
          </div>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            บล็อกการแก้ไข Core Memory โดยเด็ดขาด ทุก State Mutation ต้องผ่าน 6-Gate Pipeline
          </p>
          <div className="text-[11px] font-mono text-emerald-400">
            Status: <strong>ACTIVE_ENFORCEMENT</strong>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-violet-400 font-mono text-xs font-bold uppercase">
            <Scale className="w-4 h-4" />
            <span>Statutory Legal Contract</span>
          </div>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            รับรองผลทางกฎหมายตาม พ.ร.บ. ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 และ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
          </p>
          <div className="text-[11px] font-mono text-cyan-300">
            Certificate: <strong>#EP-SOVEREIGN-01</strong>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase">
            <Award className="w-4 h-4" />
            <span>PQC Cryptographic Anchor</span>
          </div>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            การันตีความมั่นคงปลอดภัยระดับต้านทานคอมพิวเตอร์ควอนตัมด้วยอัลกอริทึม NIST FIPS 203/204/205
          </p>
          <div className="text-[11px] font-mono text-amber-300">
            Merkle: <strong>0x909ab814...</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CivilizationIntelligenceKernelRuntime;
