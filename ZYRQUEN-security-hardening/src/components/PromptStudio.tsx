import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Send, 
  Wand2, 
  Bot, 
  Cpu, 
  FileText,
  RotateCcw
} from 'lucide-react';

interface PromptStudioProps {
  onInjectPromptToChat: (promptText: string) => void;
}

export const PromptStudio: React.FC<PromptStudioProps> = ({ onInjectPromptToChat }) => {
  const [brief, setBrief] = useState('');
  const [targetAI, setTargetAI] = useState('Claude 3.5 Sonnet / GPT-4o / Gemini');
  const [role, setRole] = useState('Senior Full-Stack Software Engineer');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const presets = [
    {
      title: '🛒 เว็บร้านค้า E-Commerce',
      brief: 'สร้างเว็บร้านค้าออนไลน์ E-Commerce มีหน้าแสดงสินค้า ตะกร้าสินค้า ระบบคำนวณราคาและส่วนลด พร้อม Checkout UI',
    },
    {
      title: '🔐 ระบบ Auth & Security',
      brief: 'ออกแบบระบบ User Authentication ด้วย JWT, Refresh Token, Password Hashing, และ Role-based Access Control (RBAC)',
    },
    {
      title: '🩺 Bug Hunter & Code Auditor',
      brief: 'ตรวจสอบและวิเคราะห์ช่องโหว่ความปลอดภัย Performance Bottlenecks และ Memory Leaks ในซอร์สโค้ด',
    },
    {
      title: '📊 REST API & Database Schema',
      brief: 'ออกแบบ RESTful API และฐานข้อมูล PostgreSQL สำหรับระบบจัดการคอร์สเรียนออนไลน์ พร้อม Endpoint Specs',
    },
  ];

  const handleGenerate = async (textToUse?: string) => {
    const inputBrief = textToUse || brief;
    if (!inputBrief.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: inputBrief,
          targetAI,
          role,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedPrompt(data.result);
      } else {
        // Fallback generator
        setGeneratedPrompt(`
# ROLE & EXPERTISE:
คุณคือ ${role} ผู้เชี่ยวชาญระดับแนวหน้า

# OBJECTIVE & CONTEXT:
${inputBrief}

# DETAILED REQUIREMENTS & TASKS:
1. วิเคราะห์ข้อกำหนดและสถาปัตยกรรมของระบบให้ครบถ้วนทุกมุมมอง
2. เขียนโค้ดที่ถูกต้อง สมบูรณ์ สะอาด และพร้อมนำไปใช้งานจริง (Production-grade)
3. แยกส่วนโครงสร้างโค้ดแบบ Modular Component และแยกไฟล์อย่างเป็นระเบียบ
4. จัดการ Error Handling, Edge cases, และ Loading states ให้ครบถ้วน

# CONSTRAINTS:
- ห้ามเขียนโค้ด placeholder หรือข้อความ "... TODO: implement here ..." ที่ไม่สมบูรณ์
- ให้โค้ดสมบูรณ์ที่สามารถรันได้ทันที
- คำนึงถึง Type Safety, Performance, และ Security เป็นสำคัญ

# OUTPUT FORMAT:
- สรุปภาพรวมของสถาปัตยกรรม
- รายชื่อไฟล์และเนื้อหาโค้ดแต่ละไฟล์
- ขั้นตอนการรันและการทดสอบ
        `.trim());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedPrompt) return;
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-y-auto p-3.5 sm:p-5 space-y-4 sm:space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Prompt Engineer Studio</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            สร้าง Super Prompt ระดับมืออาชีพสำหรับนำไปใช้กับ AI ทันที
          </p>
        </div>
        <div className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-semibold text-amber-300">
          Professional Mode
        </div>
      </div>

      {/* Preset Chips */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 block">
          เลือกเทมเพลตเริ่มต้นยอดนิยม:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {presets.map((p, i) => (
            <button
              key={i}
              onClick={() => {
                setBrief(p.brief);
                handleGenerate(p.brief);
              }}
              className="p-3 text-left rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition cursor-pointer group min-h-[48px]"
            >
              <div className="text-xs font-semibold text-amber-300 group-hover:text-amber-200">
                {p.title}
              </div>
              <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                {p.brief}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Input Form - Strict Vertical Stack for Mobile */}
      <div className="space-y-3.5 p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        {/* Step 1: Brief Idea Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>สิ่งที่ต้องการ (Input Idea):</span>
          </label>
          <textarea
            rows={3}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="ตัวอย่าง: ทำพรอมต์สร้างเว็บร้านกาแฟพร้อมเมนูสินค้าและตะกร้าสินค้า หรือ สร้างระบบ Backend Node.js..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        {/* Step 2: Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Target Model */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>AI เป้าหมาย:</span>
            </label>
            <select
              value={targetAI}
              onChange={(e) => setTargetAI(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="Claude 3.5 Sonnet / Claude 3.7">Claude 3.5 / 3.7 Sonnet</option>
              <option value="Gemini 2.5 Pro / Flash">Google Gemini</option>
              <option value="GPT-4o / OpenAI o1">OpenAI GPT-4o / o1</option>
              <option value="Cursor / Windsurf AI">Cursor / Windsurf AI</option>
              <option value="v0.dev / Bolt.new">v0.dev / Bolt.new</option>
              <option value="General AI">General Universal</option>
            </select>
          </div>

          {/* AI Role */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Bot className="w-3 h-3 text-emerald-400" />
              <span>บทบาทของ AI (Role):</span>
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Step 3: Generate Button */}
        <button
          onClick={() => handleGenerate()}
          disabled={!brief.trim() || isGenerating}
          className="w-full min-h-[44px] py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-40 active:scale-[0.99]"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" />
              <span>กำลังสร้าง Super Prompt...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              <span>สร้าง Super Prompt ทันที</span>
            </>
          )}
        </button>
      </div>

      {/* Step 4: Output Result */}
      {generatedPrompt && (
        <div className="space-y-3 p-3.5 sm:p-4 rounded-2xl bg-amber-950/20 border border-amber-500/40 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-amber-300">
                ผลลัพธ์ Super Prompt พร้อมใช้งาน:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 sm:flex-none min-h-[40px] flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs transition cursor-pointer shadow hover:bg-amber-400 active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>คัดลอกแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onInjectPromptToChat(`สร้างโปรเจกต์ตาม Prompt นี้ให้หน่อยครับ:\n\n${generatedPrompt}`)}
                className="flex-1 sm:flex-none min-h-[40px] flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition cursor-pointer active:scale-95"
                title="ส่ง Prompt นี้ให้ CodeVoice AI เริ่มเขียนโค้ดทันที"
              >
                <Send className="w-3 h-3" />
                <span>สั่ง AI เขียนโค้ด</span>
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap select-all max-h-80 sm:max-h-96 overflow-y-auto">
            {generatedPrompt}
          </div>
        </div>
      )}
    </div>
  );
};
