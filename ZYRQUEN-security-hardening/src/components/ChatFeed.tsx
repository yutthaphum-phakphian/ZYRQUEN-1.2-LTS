import React, { useRef, useEffect, useState } from 'react';
import { 
  Bot, 
  User, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Play, 
  RotateCcw, 
  Copy, 
  Check, 
  ExternalLink,
  Code2, 
  Bug, 
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Terminal,
  Layers,
  ArrowRight,
  RefreshCw,
  Wand2,
  Zap,
  BookOpen
} from 'lucide-react';
import { ChatMessage, CodeFile } from '../types';
import { CodeViewer } from '../utils/codeHighlighter';

interface ChatFeedProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onPlayVoiceSummary: (text: string) => void;
  isSpeaking: boolean;
  activeSpeakingText: string | null;
  onOpenFileInEditor: (file: CodeFile) => void;
  onOpenInSandbox: () => void;
  onSendQuickCommand: (cmd: string) => void;
  onRegenerateLastPrompt?: (promptText: string) => void;
  onImprovePrompt?: (promptText: string) => void;
}

export const ChatFeed: React.FC<ChatFeedProps> = ({
  messages,
  isLoading,
  onPlayVoiceSummary,
  isSpeaking,
  activeSpeakingText,
  onOpenFileInEditor,
  onOpenInSandbox,
  onSendQuickCommand,
  onRegenerateLastPrompt,
  onImprovePrompt,
}) => {
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopyPrompt = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPromptId(id);
      setTimeout(() => setCopiedPromptId(null), 2500);
    } catch (e) {
      console.error('Failed to copy prompt:', e);
    }
  };

  const getIntentBadge = (intent?: string) => {
    switch (intent) {
      case 'PROMPT':
        return { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: 'PROMPT' };
      case 'PROJECT':
        return { bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', label: 'PROJECT' };
      case 'MODIFY':
        return { bg: 'bg-violet-500/20 text-violet-300 border-violet-500/30', label: 'MODIFY' };
      case 'DEBUG':
        return { bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30', label: 'DEBUG' };
      case 'CODE':
        return { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'CODE' };
      case 'EXPLAIN':
        return { bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', label: 'EXPLAIN' };
      case 'VOICE_COMMAND':
        return { bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', label: 'VOICE' };
      case 'CHAT':
      default:
        return { bg: 'bg-slate-800 text-slate-300 border-slate-700', label: intent || 'CHAT' };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
      {/* If No Messages: Show Welcome Screen */}
      {messages.length === 0 && (
        <div className="max-w-2xl mx-auto py-8 text-center space-y-6">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-500 via-violet-600 to-cyan-400 p-1 shadow-2xl shadow-indigo-500/25">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
              <Bot className="w-10 h-10 text-indigo-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-500 rounded-full border-2 border-slate-950">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              สวัสดีครับ! ผมคือ <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">CodeVoice AI</span>
            </h2>
            <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              ผู้ช่วย AI สร้าง Prompt และพัฒนาโปรแกรมด้วยเสียงแบบ Real-time 
              รองรับ Intent Router อัจฉริยะ และรักษาบริบทโปรเจกต์อย่างต่อเนื่อง
            </p>
          </div>

          {/* Core Intent Quick Start Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
            <div 
              onClick={() => onSendQuickCommand('สร้างเว็บร้านกาแฟให้หน่อย ขอหน้าเว็บหลักพร้อมเมนูสินค้าและตะกร้าสินค้า')}
              className="p-4 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/50 transition cursor-pointer group"
            >
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
                <Code2 className="w-4 h-4" />
                <span>PROJECT: สร้างเว็บร้านกาแฟ</span>
              </div>
              <p className="text-xs text-slate-300 font-medium group-hover:text-white">
                “สร้างเว็บร้านกาแฟให้หน่อย ขอหน้าเว็บหลักพร้อมเมนูสินค้าและตะกร้าสินค้า”
              </p>
            </div>

            <div 
              onClick={() => onSendQuickCommand('ทำพรอมต์สร้างเว็บร้านค้าแบบละเอียดและพร้อมใช้งาน')}
              className="p-4 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/50 transition cursor-pointer group"
            >
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
                <Sparkles className="w-4 h-4" />
                <span>PROMPT: สร้าง Super Prompt</span>
              </div>
              <p className="text-xs text-slate-300 font-medium group-hover:text-white">
                “ทำพรอมต์สร้างเว็บร้านค้าแบบละเอียดและพร้อมใช้งาน”
              </p>
            </div>

            <div 
              onClick={() => onSendQuickCommand('แก้ปุ่มเมื่อกี้ให้เป็นสีแดงสดและเพิ่มเอฟเฟกต์เงา')}
              className="p-4 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-violet-500/50 transition cursor-pointer group"
            >
              <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold mb-1">
                <Zap className="w-4 h-4" />
                <span>MODIFY: แก้ไขโค้ดเดิมต่อเนื่อง</span>
              </div>
              <p className="text-xs text-slate-300 font-medium group-hover:text-white">
                “แก้ปุ่มเมื่อกี้ให้เป็นสีแดงสดและเพิ่มเอฟเฟกต์เงา”
              </p>
            </div>

            <div 
              onClick={() => onSendQuickCommand('ช่วยหาสาเหตุของ Error: TypeError: Cannot read properties of undefined (reading "map")')}
              className="p-4 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-rose-500/50 transition cursor-pointer group"
            >
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mb-1">
                <Bug className="w-4 h-4" />
                <span>DEBUG: วินิจฉัยและแก้บั๊ก</span>
              </div>
              <p className="text-xs text-slate-300 font-medium group-hover:text-white">
                “ช่วยหาสาเหตุของ TypeError: Cannot read properties of undefined (reading 'map')”
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Message List */}
      {messages.map((msg) => {
        const isAssistant = msg.role === 'assistant';
        const voiceText = msg.voiceResponse || msg.voiceSummary;
        const displayText = msg.displayResponse || msg.content;
        const promptObj = msg.prompt || (msg.promptData ? {
          title: msg.promptData.title || 'Prompt พร้อมใช้งาน',
          role: msg.promptData.targetRole || '',
          context: '',
          goal: '',
          requirements: [],
          constraints: [],
          expectedOutput: '',
          qualityCriteria: [],
          fullPromptText: msg.promptData.promptText,
          recommendedModels: msg.promptData.recommendedModels,
        } : null);
        const debugObj = msg.debug || (msg.debugData ? {
          rootCause: msg.debugData.rootCause,
          possibleCauses: msg.debugData.possibleCauses,
          fixExplanation: msg.debugData.fixExplanation,
          preventionTip: msg.debugData.preventionTip,
        } : null);

        const isCurrentSpeaking = isSpeaking && activeSpeakingText === voiceText;
        const badge = getIntentBadge(msg.intent || msg.type?.toUpperCase());

        return (
          <div
            key={msg.id}
            className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
          >
            {/* Header info */}
            <div className="flex items-center gap-2 mb-1.5 px-1 text-xs text-slate-400">
              {isAssistant ? (
                <>
                  <div className="w-5 h-5 rounded-md bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                    CV
                  </div>
                  <span className="font-semibold text-slate-300">CodeVoice AI</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-mono border ${badge.bg}`}>
                    {badge.label}
                  </span>
                  <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                </>
              ) : (
                <>
                  <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                  {msg.isVoiceInput && (
                    <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      <Volume2 className="w-2.5 h-2.5" />
                      สั่งงานด้วยเสียง
                    </span>
                  )}
                  <span className="font-semibold text-slate-300">คุณ</span>
                  <div className="w-5 h-5 rounded-md bg-slate-700 text-slate-300 flex items-center justify-center">
                    <User className="w-3 h-3" />
                  </div>
                </>
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-3xl w-full rounded-2xl p-4 sm:p-5 transition shadow-lg ${
                isAssistant
                  ? 'bg-slate-900/90 border border-slate-800 text-slate-100'
                  : 'bg-indigo-600 text-white ml-auto max-w-xl'
              }`}
            >
              {/* User Message Text */}
              {!isAssistant && (
                <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
              )}

              {/* Assistant Message Body */}
              {isAssistant && (
                <div className="space-y-4">
                  {/* Voice Summary Audio Card */}
                  {voiceText && (
                    <div className={`p-3.5 rounded-xl border transition ${
                      isCurrentSpeaking
                        ? 'bg-gradient-to-r from-indigo-950/90 to-cyan-950/80 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-950/70 border-indigo-500/30 hover:border-indigo-500/50'
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => onPlayVoiceSummary(voiceText)}
                            className={`p-2 rounded-xl transition cursor-pointer shrink-0 ${
                              isCurrentSpeaking
                                ? 'bg-cyan-500 text-slate-950 animate-pulse'
                                : 'bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white'
                            }`}
                            title="ฟังเสียงสรุป (Voice Response)"
                          >
                            {isCurrentSpeaking ? (
                              <Volume2 className="w-4 h-4 animate-bounce" />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                          </button>

                          <div>
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400">
                              <span>เสียงพูดสรุป (Voice Response)</span>
                              {isCurrentSpeaking && (
                                <span className="flex items-center gap-0.5 ml-1">
                                  <span className="w-1 h-2 bg-cyan-400 animate-soundwave-1 rounded-full"></span>
                                  <span className="w-1 h-3 bg-cyan-400 animate-soundwave-2 rounded-full"></span>
                                  <span className="w-1 h-2 bg-cyan-400 animate-soundwave-3 rounded-full"></span>
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-200 font-medium mt-0.5">
                              “{voiceText}”
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => onPlayVoiceSummary(voiceText)}
                          className="text-slate-500 hover:text-slate-300 p-1 rounded-md transition cursor-pointer"
                          title="เล่นเสียงสรุปซ้ำ"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Display Response Text (Markdown/Explanation) */}
                  {displayText && (
                    <div className="space-y-1.5 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                      {displayText}
                    </div>
                  )}

                  {/* Section 2: Prompt Generator Box with 3 Action Buttons */}
                  {promptObj && (
                    <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-bold text-amber-300">
                            {promptObj.title || 'Super Prompt พร้อมใช้งาน'}
                          </span>
                        </div>

                        {/* 3 Required Prompt Action Buttons: Copy Prompt, Regenerate, Improve Prompt */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleCopyPrompt(msg.id, promptObj.fullPromptText)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-medium transition cursor-pointer"
                            title="คัดลอก Prompt"
                          >
                            {copiedPromptId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">คัดลอกแล้ว!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Prompt</span>
                              </>
                            )}
                          </button>

                          {onRegenerateLastPrompt && (
                            <button
                              onClick={() => onRegenerateLastPrompt(promptObj.fullPromptText)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                              title="สร้าง Prompt ใหม่อีกครั้ง"
                            >
                              <RefreshCw className="w-3 h-3 text-cyan-400" />
                              <span>Regenerate</span>
                            </button>
                          )}

                          {onImprovePrompt && (
                            <button
                              onClick={() => onImprovePrompt(promptObj.fullPromptText)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition cursor-pointer"
                              title="ปรับปรุง Prompt ให้ละเอียดยิ่งขึ้น"
                            >
                              <Wand2 className="w-3 h-3" />
                              <span>Improve Prompt</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Prompt metadata tags */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        {promptObj.role && (
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                            Role: <strong className="text-amber-200">{promptObj.role}</strong>
                          </span>
                        )}
                        {promptObj.recommendedModels?.map((model: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                            {model}
                          </span>
                        ))}
                      </div>

                      {/* Ready prompt text */}
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/90 text-xs font-mono text-slate-200 whitespace-pre-wrap select-all leading-relaxed max-h-72 overflow-y-auto">
                        {promptObj.fullPromptText}
                      </div>
                    </div>
                  )}

                  {/* Debug Data Box */}
                  {debugObj && (
                    <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                      <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                        <Bug className="w-4 h-4" />
                        <span>การวินิจฉัยและหาสาเหตุของบั๊ก (Debug Diagnostics)</span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[11px] font-semibold text-rose-300">สาเหตุหลัก:</div>
                        <p className="text-xs text-slate-200 bg-slate-950/80 p-2.5 rounded-lg border border-rose-500/20">
                          {debugObj.rootCause}
                        </p>
                      </div>

                      {debugObj.possibleCauses && debugObj.possibleCauses.length > 0 && (
                        <div className="space-y-1 text-xs">
                          <div className="text-[11px] font-semibold text-slate-400">สาเหตุที่เป็นไปได้:</div>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-300 pl-1 text-xs">
                            {debugObj.possibleCauses.map((c: string, i: number) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="space-y-1 text-xs">
                        <div className="text-[11px] font-semibold text-emerald-400">วิธีแก้ไข:</div>
                        <p className="text-slate-300 leading-relaxed">
                          {debugObj.fixExplanation}
                        </p>
                      </div>

                      {debugObj.preventionTip && (
                        <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                          <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                          <span><strong>วิธีป้องกันในอนาคต:</strong> {debugObj.preventionTip}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Generated Code Files */}
                  {msg.files && msg.files.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                          <FileCode className="w-3.5 h-3.5" />
                          ไฟล์โค้ด ({msg.files.length} ไฟล์)
                        </span>
                        <button
                          onClick={onOpenInSandbox}
                          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs font-medium cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>เปิดดูพรีวิวสดใน Sandbox</span>
                        </button>
                      </div>

                      {msg.files.map((file, idx) => (
                        <div key={idx} className="relative">
                          <CodeViewer
                            filename={file.name}
                            language={file.language}
                            code={file.content}
                            onRunPreview={onOpenInSandbox}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Next Recommended Action */}
                  {msg.nextAction && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-indigo-500/20 text-xs text-indigo-300">
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span><strong>ขั้นตอนถัดไป:</strong> {msg.nextAction}</span>
                    </div>
                  )}

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60 text-xs">
                    {msg.files && msg.files.length > 0 && (
                      <button
                        onClick={onOpenInSandbox}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition cursor-pointer font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>รันใน Live Sandbox</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSendQuickCommand('ช่วยอธิบายการทำงานของโค้ดนี้ทีละส่วนแบบละเอียด')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    >
                      อธิบายโค้ด
                    </button>

                    <button
                      onClick={() => onSendQuickCommand('ช่วยเพิ่ม Error Handling และ Validation ให้โค้ดนี้')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    >
                      เพิ่ม Validation
                    </button>

                    <button
                      onClick={() => onSendQuickCommand('ช่วยเขียน Unit Test สำหรับทดสอบโค้ดนี้')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    >
                      เขียน Test Case
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="flex items-start gap-3 max-w-2xl">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Bot className="w-4 h-4 animate-spin" />
          </div>
          <div className="flex-1 p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-cyan-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                CodeVoice AI กำลังวิเคราะห์ Intent และประมวลผลคำสั่ง...
              </span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full w-3/4 animate-pulse"></div>
            <div className="h-3 bg-slate-800 rounded-full w-1/2 animate-pulse"></div>
          </div>
        </div>
      )}

      <div ref={scrollEndRef} />
    </div>
  );
};
