import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  Square,
  Code2,
  Bug,
  BookOpen,
  Zap,
  FolderPlus,
  Keyboard,
  VolumeX,
  Loader2,
  Paperclip,
  X
} from 'lucide-react';
import { AssistantState } from '../types';
import { speechManager } from '../utils/speech';
import { AudioVisualizer } from './AudioVisualizer';
import { readPickedFile, PickedFile } from '../utils/readTextFile';

interface VoiceControllerProps {
  onSendMessage: (message: string, isVoice: boolean, images?: Array<{ name: string; mimeType: string; data: string }>) => void;
  isLoading: boolean;
  voiceLang: 'th-TH' | 'en-US';
  activeMode: string;
  assistantState: AssistantState;
  onInterrupt: () => void;
  focusSignal?: number;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({
  onSendMessage,
  isLoading,
  voiceLang,
  assistantState,
  onInterrupt,
  focusSignal,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<PickedFile[]>([]);
  const [attachError, setAttachError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).slice(0, 5);
    setAttachError('');
    for (const f of files) {
      try {
        const picked = await readPickedFile(f);
        setAttachments((prev) => (prev.length >= 5 ? prev : [...prev, picked].slice(0, 5)));
      } catch (err) {
        setAttachError(err instanceof Error ? err.message : 'อ่านไฟล์ไม่สำเร็จ');
      }
    }
  };
  const handleFilesPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length) await addFiles(files);
  };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) await addFiles(e.dataTransfer.files);
  };
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Set language whenever voiceLang changes
  useEffect(() => {
    speechManager.setLanguage(voiceLang);
  }, [voiceLang]);

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [inputText]);

  // Handle focusSignal from shortcut 'Ctrl+Shift+L'
  useEffect(() => {
    if (focusSignal && focusSignal > 0) {
      textareaRef.current?.focus();
    }
  }, [focusSignal]);

  // Toggle voice recognition
  const toggleListening = () => {
    // If speaking, interrupt first
    if (assistantState === 'SPEAKING') {
      onInterrupt();
    }

    if (isListening) {
      speechManager.stopListening();
      setIsListening(false);
      setAudioStream(null);
      if (transcript.trim()) {
        onSendMessage(transcript.trim(), true);
        setTranscript('');
      }
    } else {
      setSpeechError(null);
      setTranscript('');
      speechManager.startListening({
        onStart: (stream) => {
          setIsListening(true);
          setAudioStream(stream);
        },
        onResult: (text, isFinal) => {
          setTranscript(text);
          if (isFinal && text.trim().length > 0) {
            setTimeout(() => {
              setIsListening(false);
              speechManager.stopListening();
              setAudioStream(null);
              onSendMessage(text.trim(), true);
              setTranscript('');
            }, 600);
          }
        },
        onError: (err) => {
          setIsListening(false);
          setAudioStream(null);
          setSpeechError(err);
          setTimeout(() => setSpeechError(null), 5000);
        },
        onEnd: () => {
          setIsListening(false);
          setAudioStream(null);
        },
      });
    }
  };

  const handleSend = () => {
    const typed = inputText.trim() || transcript.trim();
    if ((!typed && attachments.length === 0) || isLoading) return;
    const textFiles = attachments.filter((a): a is Extract<PickedFile, { kind: 'text' }> => a.kind === 'text');
    const imageFiles = attachments.filter((a): a is Extract<PickedFile, { kind: 'image' }> => a.kind === 'image');
    const textParts = [
      typed || (imageFiles.length && !textFiles.length ? 'ช่วยดูรูปที่แนบมานี้ให้หน่อยครับ' : 'ช่วยดูไฟล์ที่แนบมานี้ให้หน่อยครับ'),
      ...textFiles.map((a) => `\n\n[ไฟล์แนบ: ${a.name}]\n\`\`\`\n${a.content}\n\`\`\``),
    ];
    if (imageFiles.length) {
      textParts.push(`\n\n[แนบรูปภาพ ${imageFiles.length} ไฟล์: ${imageFiles.map((i) => i.name).join(', ')}]`);
    }
    const text = textParts.join('');

    if (isListening) {
      speechManager.stopListening();
      setIsListening(false);
      setAudioStream(null);
    }

    const images = imageFiles.map((i) => ({ name: i.name, mimeType: i.mimeType, data: i.data }));
    onSendMessage(text, false, images.length ? images : undefined);
    setAttachments([]);
    setAttachError('');
    setInputText('');
    setTranscript('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // AI Quick Actions matching the 6 intent routers
  const aiActions = [
    {
      label: 'สร้างโค้ด',
      icon: <Code2 className="w-3.5 h-3.5 text-emerald-400" />,
      color: 'hover:border-emerald-500/50 hover:bg-emerald-950/30 text-emerald-300',
      action: () => onSendMessage('ช่วยสร้างโค้ดสำหรับโปรเจกต์นี้ให้หน่อยครับ', false),
    },
    {
      label: 'แก้บั๊ก',
      icon: <Bug className="w-3.5 h-3.5 text-rose-400" />,
      color: 'hover:border-rose-500/50 hover:bg-rose-950/30 text-rose-300',
      action: () => onSendMessage('ช่วยวิเคราะห์บั๊กและแก้ Error ในโค้ดปัจจุบันให้หน่อยครับ', false),
    },
    {
      label: 'สร้าง Prompt',
      icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
      color: 'hover:border-amber-500/50 hover:bg-amber-950/30 text-amber-300',
      action: () => onSendMessage('ทำพรอมต์สร้างเว็บร้านค้าแบบละเอียด พร้อม Role, Task, Constraints, และ Output Format', false),
    },
    {
      label: 'อธิบายโค้ด',
      icon: <BookOpen className="w-3.5 h-3.5 text-cyan-400" />,
      color: 'hover:border-cyan-500/50 hover:bg-cyan-950/30 text-cyan-300',
      action: () => onSendMessage('ช่วยอธิบายการทำงานของไฟล์และโค้ดในโปรเจกต์นี้ทีละส่วนอย่างเข้าใจง่าย', false),
    },
    {
      label: 'ปรับปรุงโค้ด',
      icon: <Zap className="w-3.5 h-3.5 text-violet-400" />,
      color: 'hover:border-violet-500/50 hover:bg-violet-950/30 text-violet-300',
      action: () => onSendMessage('ช่วยปรับปรุงโค้ด (Refactor) เพิ่มความคลีน ประสิทธิภาพ และความปลอดภัย', false),
    },
    {
      label: 'สร้างโปรเจกต์',
      icon: <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />,
      color: 'hover:border-indigo-500/50 hover:bg-indigo-950/30 text-indigo-300',
      action: () => onSendMessage('สร้างโครงสร้างโปรเจกต์เว็บร้านกาแฟ พร้อมเมนูสินค้าและตะกร้าสินค้า', false),
    },
  ];

  // Helper for Assistant State Badge color and text
  const getStateBadge = () => {
    switch (assistantState) {
      case 'LISTENING':
        return {
          bg: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
          dot: 'bg-rose-500 animate-ping',
          text: 'กำลังฟัง (LISTENING)',
        };
      case 'THINKING':
        return {
          bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          dot: 'bg-amber-500 animate-pulse',
          text: 'กำลังคิด (THINKING)',
        };
      case 'GENERATING':
        return {
          bg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
          dot: 'bg-indigo-500 animate-pulse',
          text: 'กำลังเขียนโค้ด (GENERATING)',
        };
      case 'SPEAKING':
        return {
          bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
          dot: 'bg-cyan-500 animate-ping',
          text: 'กำลังพูดสรุป (SPEAKING)',
        };
      case 'READY':
      default:
        return {
          bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400',
          text: 'พร้อมรับคำสั่ง (READY)',
        };
    }
  };

  const stateBadge = getStateBadge();

  return (
    <div className="border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-xl p-2.5 sm:p-4 max-w-full shrink-0">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Assistant State & Interrupt bar */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${stateBadge.bg}`}>
              <span className={`w-2 h-2 rounded-full ${stateBadge.dot}`}></span>
              <span>{stateBadge.text}</span>
            </div>
            <span className="text-slate-500 text-[10px] hidden sm:inline">
              {voiceLang === 'th-TH' ? 'เสียงภาษาไทย' : 'English Voice'}
            </span>
          </div>

          {/* If assistant is speaking, show instant interrupt button */}
          {assistantState === 'SPEAKING' && (
            <button
              onClick={onInterrupt}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold cursor-pointer transition animate-pulse min-h-[32px]"
              title="หยุดพูดทันที (Interrupt)"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>หยุดพูด</span>
            </button>
          )}
        </div>

        {/* AI Quick Action Buttons (Smooth scrollable on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
          <span className="text-slate-500 text-[11px] font-medium whitespace-nowrap flex items-center gap-1 mr-1 shrink-0">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            ด่วน:
          </span>
          {aiActions.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 whitespace-nowrap transition cursor-pointer text-xs disabled:opacity-50 min-h-[32px] shrink-0 active:scale-95 ${item.color}`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Listening Active Visualizer Banner with Dynamic Frequency Visualizer */}
        {isListening && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950/60 to-slate-950 border border-cyan-500/40 shadow-xl shadow-cyan-500/10 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                </span>
                <span className="text-xs font-bold text-cyan-300">
                  กำลังรับเสียงจากไมโครโฟน...
                </span>
              </div>

              <button
                onClick={toggleListening}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition shadow min-h-[32px]"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>ส่งเสียง</span>
              </button>
            </div>

            {/* Smooth Dynamic Frequency Visualizer */}
            <AudioVisualizer isListening={isListening} stream={audioStream} barCount={32} height={44} />

            <p className="text-xs text-white font-medium italic text-center truncate px-1">
              {transcript || 'กำลังฟังคำสั่งของคุณ...'}
            </p>
          </div>
        )}

        {/* Error notification if mic blocked or issue */}
        {speechError && (
          <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <span className="truncate">{speechError}</span>
            <button
              onClick={() => setSpeechError(null)}
              className="text-rose-400 hover:text-white ml-2 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Input Control Bar with Large Voice Button */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`flex items-end gap-1.5 sm:gap-2 bg-slate-900/90 rounded-2xl border p-1.5 sm:p-2 focus-within:border-indigo-500/70 focus-within:ring-2 focus-within:ring-indigo-500/20 transition shadow-inner ${
            isDragging ? 'border-cyan-400 ring-2 ring-cyan-500/30 bg-cyan-950/30' : 'border-slate-800'
          }`}
        >
          {/* Big Voice Microphone Button */}
          <button
            onClick={toggleListening}
            disabled={isLoading}
            className={`relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 ring-4 ring-rose-500/30 animate-pulse scale-105'
                : 'bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 text-white hover:brightness-110 shadow-md shadow-indigo-600/30 active:scale-95'
            }`}
            title="กดปุ่มเพื่อพูดสั่งงานด้วยเสียง"
          >
            {isListening ? (
              <MicOff className="w-5 h-5 sm:w-6 sm:h-6 animate-bounce" />
            ) : (
              <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </button>

          {/* Attach file */}
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilesPicked}
            accept="image/png,image/jpeg,image/webp,image/gif,.txt,.md,.json,.csv,.js,.jsx,.ts,.tsx,.html,.css,.py,.java,.c,.cpp,.go,.rs,.php,.sql,.yml,.yaml,.xml,.sh,.env,.log,text/*,image/*" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || attachments.length >= 5}
            className="flex items-center justify-center gap-1 w-10 h-10 sm:w-auto sm:px-2.5 sm:h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 transition cursor-pointer shrink-0 active:scale-95 border border-slate-700"
            title="แนบข้อความ/โค้ด/รูปภาพ (สูงสุด 5 ไฟล์, ไม่เกิน 1 MB ต่อไฟล์) หรือลากวางที่นี่"
          >
            <Paperclip className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px] font-medium">แนบไฟล์</span>
          </button>

          {/* Text input area */}
          <div className="flex-1 relative min-w-0">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? 'กำลังรับเสียง...'
                  : 'สั่งงานด้วยเสียง หรือพิมพ์คำสั่ง...'
              }
              disabled={isLoading || isListening}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none py-2.5 px-2 max-h-28 leading-relaxed"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={isLoading || (!inputText.trim() && !transcript.trim() && attachments.length === 0)}
            className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:hover:bg-indigo-600 transition cursor-pointer shrink-0 shadow active:scale-95"
            title="ส่งคำสั่ง"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {(attachments.length > 0 || attachError || isDragging) && (
          <div className="flex flex-wrap items-center gap-2 px-1 text-[11px]">
            {isDragging && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                วางไฟล์เพื่อแนบ (ข้อความ/โค้ด/รูป)
              </span>
            )}
            {attachments.map((a, i) => (
              <span key={a.name + i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-100 border border-indigo-500/25">
                {a.kind === 'image' ? (
                  <img src={a.previewUrl} alt="" className="w-6 h-6 rounded object-cover border border-slate-600" />
                ) : (
                  <Paperclip className="w-3 h-3 text-indigo-300" />
                )}
                <span className="max-w-[10rem] truncate font-medium">{a.name}</span>
                <span className="text-slate-500">
                  {a.kind === 'image'
                    ? `${Math.max(1, Math.round(a.data.length * 0.75 / 1024))} KB`
                    : `${Math.max(1, Math.round(a.content.length / 1024))} KB`}
                </span>
                <button type="button" onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} title="เอาออก" className="hover:text-rose-300 p-0.5"><X className="w-3 h-3" /></button>
              </span>
            ))}
            {attachError && <span className="text-rose-300">{attachError}</span>}
            {attachments.length > 0 && (
              <span className="text-slate-500">{attachments.length}/5 ไฟล์</span>
            )}
          </div>
        )}

        {/* Global Keyboard Shortcuts (Desktop/Tablet only) */}
        <div className="hidden sm:flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-1 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-400">
              <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
              <span>คีย์ลัด:</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[10px] text-amber-300">
                Ctrl+Shift+C
              </kbd>
              <span>เปิด/ปิด ตะกร้า</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[10px] text-cyan-300">
                Ctrl+Shift+L
              </kbd>
              <span>โฟกัสช่องพิมพ์/เสียง</span>
            </span>
          </div>

          <span className="text-slate-500">
            Shift+Enter ขึ้นบรรทัดใหม่ • Enter ส่ง • คลิปหรือลากวางเพื่อแนบไฟล์
          </span>
        </div>
      </div>
    </div>
  );
};
