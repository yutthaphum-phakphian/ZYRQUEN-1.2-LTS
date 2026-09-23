import React, { useState } from 'react';
import {
  X,
  Github,
  Smartphone,
  Copy,
  Check,
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  FileCode,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

interface GitHubPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubPwaModal: React.FC<GitHubPwaModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'github' | 'pwa' | 'responsive'>('github');
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const gitCliScript = `# 1. เริ่มต้นระบบ Git ในโฟลเดอร์โปรเจกต์
git init

# 2. เพิ่มไฟล์ทั้งหมดเข้าสเตจ
git add .

# 3. บันทึก Commit
git commit -m "feat: initial commit from AI Studio with PWA setup"

# 4. เปลี่ยนชื่อบรันช์หลักเป็น main
git branch -M main

# 5. เชื่อมไปยัง Repository บน GitHub (yutthaphum-phakphian/ZYRQUEN-1.2-LTS)
git remote add origin https://github.com/yutthaphum-phakphian/ZYRQUEN-1.2-LTS.git

# 6. อัปโหลดไฟล์ขึ้น GitHub
git push -u origin main`;

  const singleFilePushScript = `# สำหรับกรณี Single-File Deployment ไปยัง GitHub Pages
git add index.html public/
git commit -m "feat: complete mobile responsive & PWA setup"
git push origin main`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07080F]/90 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#0b0e1a] border border-cyan-500/30 shadow-2xl overflow-hidden font-sans my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                GitHub Push & PWA Mobile Setup Center
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  READY
                </span>
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                ZYRQUEN Ω∞ Sovereign System • PWA Manifest & Service Worker Configured
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-black/20 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold rounded-t-xl border-t border-x transition ${
              activeTab === 'github'
                ? 'bg-[#0b0e1a] border-cyan-500/40 text-cyan-300 border-b-transparent -mb-px'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Github className="w-4 h-4" />
            1. GitHub Push Guide
          </button>
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold rounded-t-xl border-t border-x transition ${
              activeTab === 'pwa'
                ? 'bg-[#0b0e1a] border-emerald-500/40 text-emerald-300 border-b-transparent -mb-px'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            2. PWA Specification
          </button>
          <button
            onClick={() => setActiveTab('responsive')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold rounded-t-xl border-t border-x transition ${
              activeTab === 'responsive'
                ? 'bg-[#0b0e1a] border-purple-500/40 text-purple-300 border-b-transparent -mb-px'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            3. Mobile-First Layout
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {activeTab === 'github' && (
            <div className="space-y-5">
              {/* Context Callout */}
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200 space-y-1.5 leading-relaxed">
                <p className="font-semibold flex items-center gap-1.5 text-cyan-300">
                  <Info className="w-4 h-4" />
                  คำแนะนำการนำไฟล์ขึ้น GitHub จากสภาพแวดล้อม AI Studio
                </p>
                <p>
                  เนื่องจากสภาพแวดล้อม AI Studio ทำงานบน Container แบบ Web Simulator จึงแนะนำให้ดาวน์โหลดหรือคัดลอกโฟลเดอร์โปรเจกต์ลงบนเครื่อง หรือส่งออกผ่านเมนู Settings ของ AI Studio แล้วนำขึ้น GitHub ด้วยคำสั่ง Git CLI หรือ Web Upload ดังนี้:
                </p>
              </div>

              {/* Method 1: Git CLI */}
              <div className="rounded-xl bg-black/50 border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    วิธีที่ 1: ใช้ Git CLI บนเครื่องคอมพิวเตอร์ (แนะนำ)
                  </span>
                  <button
                    onClick={() => copyToClipboard(gitCliScript, 'gitCli')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono border border-cyan-500/30 transition"
                  >
                    {copiedKey === 'gitCli' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'gitCli' ? 'Copied!' : 'Copy Commands'}
                  </button>
                </div>
                <pre className="p-3.5 rounded-lg bg-zinc-950 text-cyan-300 font-mono text-[11px] overflow-x-auto border border-white/5 leading-relaxed">
                  {gitCliScript}
                </pre>
              </div>

              {/* Method 2: Web Upload */}
              <div className="rounded-xl bg-black/50 border border-white/10 p-4 space-y-2 text-xs text-zinc-300">
                <span className="font-mono font-bold text-white flex items-center gap-2 mb-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  วิธีที่ 2: อัปโหลดผ่านหน้าเว็บ GitHub (เหมาะกับไฟล์จำนวนน้อย)
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-zinc-400 font-mono text-[11px]">
                  <li>ไปที่ GitHub.com แล้วกดสร้าง <strong>New Repository</strong></li>
                  <li>ในหน้า Repository ว่าง กดปุ่ม <strong>"uploading an existing file"</strong></li>
                  <li>ลากโฟลเดอร์หรือไฟล์ทั้งหมดที่เตรียมไว้ปล่อยลงในหน้าเว็บ</li>
                  <li>ใส่ Commit message เช่น <code className="text-cyan-300 bg-white/5 px-1 py-0.5 rounded">feat: complete mobile responsive &amp; PWA setup</code> แล้วกด <strong>Commit changes</strong></li>
                </ol>
              </div>

              {/* Vercel CI/CD Auto-Deploy (.github/workflows/deploy.yml) */}
              <div className="rounded-xl bg-black/50 border border-emerald-500/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Vercel Auto-Deploy CI/CD (.github/workflows/deploy.yml)
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `name: Deploy ZYRQUEN PWA to Vercel\n\non:\n  push:\n    branches:\n      - main\n\njobs:\n  build-and-deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - name: Checkout Code\n        uses: actions/checkout@v4\n\n      - name: Setup Node.js\n        uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: 'npm'\n\n      - name: Install Dependencies\n        run: npm ci\n\n      - name: Build PWA Bundle\n        run: npm run build\n\n      - name: Deploy to Vercel\n        uses: amondnet/vercel-action@v25\n        with:\n          vercel-token: \${{ secrets.VERCEL_TOKEN }}\n          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}\n          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}\n          vercel-args: '--prod'`,
                        'vercelYml'
                      )
                    }
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-mono border border-emerald-500/30 transition"
                  >
                    {copiedKey === 'vercelYml' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'vercelYml' ? 'Copied!' : 'Copy deploy.yml'}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-300">
                  ไฟล์ <code className="text-emerald-300 font-mono">.github/workflows/deploy.yml</code> ถูกสร้างไว้ในโปรเจกต์แล้ว พร้อมระบบ Auto-Deploy ขึ้น Vercel ทันทีเมื่อ Push บรันช์ main
                </p>
                <div className="p-3 rounded-lg bg-zinc-950/80 border border-white/5 space-y-1 text-[11px] text-zinc-400 font-mono">
                  <div>1. ล็อกอิน Vercel.com ด้วย GitHub &gt; "Add New..." &gt; "Project"</div>
                  <div>2. เลือก Repository &gt; Framework Preset: <strong>Vite</strong></div>
                  <div>3. ตั้งค่า Secrets: <span className="text-cyan-300">VERCEL_TOKEN</span>, <span className="text-cyan-300">VERCEL_ORG_ID</span>, <span className="text-cyan-300">VERCEL_PROJECT_ID</span> ใน GitHub Settings &gt; Secrets and variables &gt; Actions</div>
                </div>
              </div>

              {/* Deployment Targets */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-white block">Hosting แนะนำสำหรับ PWA (ต้องมี HTTPS):</span>
                  <span className="text-zinc-400 font-mono text-[11px]">Vercel, Netlify, Cloudflare Pages หรือ GitHub Pages</span>
                </div>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-zinc-300 font-mono text-[11px]">
                    HTTPS Automatic
                  </span>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px]">
                    PWA Certified
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-5">
              {/* PWA Verification Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-mono font-bold text-white block">public/manifest.json</span>
                    <span className="text-[11px] text-zinc-400">Short Name: ZyrquenApp • standalone • portrait • theme: #0f172a</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-mono font-bold text-white block">public/sw.js (Service Worker)</span>
                    <span className="text-[11px] text-zinc-400">Pre-caches offline assets, handles fetch fallback &amp; cache-first routing</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-mono font-bold text-white block">Icons (192px, 512px &amp; Maskable)</span>
                    <span className="text-[11px] text-zinc-400">pwa-192x192.png, pwa-512x512.png, pwa-maskable-512x512.png ready</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-mono font-bold text-white block">index.html &amp; Meta Tags</span>
                    <span className="text-[11px] text-zinc-400">Viewport-fit=cover, apple-touch-icon, mobile-web-app-capable set</span>
                  </div>
                </div>
              </div>

              {/* Install Status & In-App Prompt */}
              <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono font-bold text-white block">In-App Install Prompt Status:</span>
                  <span className="text-xs text-zinc-400">
                    {isInstalled
                      ? 'แอปพลิเคชันกำลังทำงานในโหมด Standalone PWA เรียบร้อยแล้ว'
                      : isInstallable
                      ? 'เบราว์เซอร์รองรับการติดตั้ง — พร้อมแสดงปุ่ม Install บนแถบ Navigation'
                      : isIOS
                      ? 'iOS Safari ตรวจพบ — พร้อมระบบแนะนำ Add to Home Screen อัตโนมัติ'
                      : 'โหมดเว็บพร้อมติดตั้งผ่านเบราว์เซอร์ที่รองรับ Service Worker'}
                  </span>
                </div>

                {isInstallable && (
                  <button
                    onClick={install}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    Install Now
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'responsive' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-200 leading-relaxed space-y-2">
                <p className="font-semibold text-purple-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  Mobile-First Responsive Layout Component
                </p>
                <p>
                  สร้างคอมโพเนนต์ <code className="text-purple-300 font-mono bg-black/30 px-1.5 py-0.5 rounded">src/components/ResponsiveDashboardLayout.tsx</code> ตามสเปกเรียบร้อย พร้อมใช้งานร่วมกับ Mobile Drawer, Touch Target ขนาด &ge;44px, และ Viewport Safe Area (iOS Home Indicator &amp; Notch)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-cyan-400 font-bold block mb-1">Mobile (&lt; lg)</span>
                  <p className="text-[11px] text-zinc-400">Sticky Top Header 53px, Slide-out Drawer w-72, 1-Column Auto-Stacked Cards</p>
                </div>
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-emerald-400 font-bold block mb-1">Tablet (sm-md)</span>
                  <p className="text-[11px] text-zinc-400">2-Column Metric Grid, Horizontal Scrolling Table Containers with overflow-x-auto</p>
                </div>
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-amber-400 font-bold block mb-1">Desktop (&ge; lg)</span>
                  <p className="text-[11px] text-zinc-400">Full 4-Column Metric Grid, Collapsible Multi-Plane Navigation &amp; 3D Quantum Stage</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/10 bg-black/40 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>PWA &amp; Mobile Responsive Ready (v4.16 LTS)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
