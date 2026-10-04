import React from 'react';
import { 
  X, 
  Sliders, 
  Volume2, 
  Cpu, 
  Languages, 
  Radio, 
  ShieldCheck, 
  Terminal,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetDefaults: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetDefaults,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">การตั้งค่า (Settings & Engine)</h3>
              <p className="text-xs text-slate-400">
                ปรับแต่งโมเดล AI, ระบบเสียง Voice, และโหมดการทำงาน
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-5 max-h-[75vh]">
          {/* AI Model Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>โมเดล AI (Active Model)</span>
            </label>
            <select
              value={settings.model}
              onChange={(e) => onUpdateSettings({ model: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="gemini-3.8-flash">Gemini 3.8 Flash (แนะนำ - เร็ว ฉลาด และเสถียร)</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (ความหน่วงต่ำพิเศษ)</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview (การใช้เหตุผลเชิงลึก)</option>
            </select>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">Creativity / Temperature</span>
              <span className="font-mono text-cyan-400 font-bold">{settings.temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.temperature}
              onChange={(e) => onUpdateSettings({ temperature: parseFloat(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0.0 (แม่นยำ ตรงไปตรงมา)</span>
              <span>1.0 (สร้างสรรค์ หลากหลาย)</span>
            </div>
          </div>

          {/* Voice Settings */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <span>การตั้งค่าเสียงสนทนา (Voice & Speech)</span>
            </h4>

            {/* Auto Speak Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">อ่านสรุปเสียงอัตโนมัติ (Auto-Speak)</div>
                <div className="text-[11px] text-slate-500">สังเคราะห์เสียงอ่านเฉพาะข้อความสรุปทันทีหลัง AI ตอบ</div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoSpeak}
                onChange={(e) => onUpdateSettings({ autoSpeak: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            {/* Continuous Voice Conversation */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <div>
                <div className="text-xs font-semibold text-slate-200">สนทนาเสียงต่อเนื่อง (Continuous Voice)</div>
                <div className="text-[11px] text-slate-500">เปิดไมค์ฟังคำสั่งใหม่โดยอัตโนมัติเมื่อ AI พูดสรุปจบ</div>
              </div>
              <input
                type="checkbox"
                checked={settings.continuousVoice}
                onChange={(e) => onUpdateSettings({ continuousVoice: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            {/* Voice Persona Selector */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <label className="text-xs font-semibold text-slate-300">น้ำเสียง AI (Voice Persona):</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Puck', 'Kore', 'Zephyr', 'Fenrir'] as const).map((persona) => (
                  <button
                    key={persona}
                    onClick={() => onUpdateSettings({ voicePersona: persona })}
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition cursor-pointer ${
                      settings.voicePersona === persona
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {persona} {persona === 'Puck' && '(ค่าเริ่มต้น)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Developer Mode Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-xs font-semibold text-slate-200">โหมดนักพัฒนา (Developer Mode)</div>
                <div className="text-[11px] text-slate-500">เปิดแผงวิเคราะห์ Telemetry, Latency, และ Logs</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.developerMode}
              onChange={(e) => onUpdateSettings({ developerMode: e.target.checked })}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* Security Notice */}
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <div>
              <span className="font-semibold text-white">ปลอดภัยและเป็นส่วนตัว:</span> API Key ถูกเข้ารหัสและจัดการผ่านระบบ Server-side Secrets โดยไม่มีการเปิดเผยต่อเบราว์เซอร์
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onResetDefaults}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนค่าเริ่มต้น</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            บันทึกและปิด
          </button>
        </div>
      </div>
    </div>
  );
};
