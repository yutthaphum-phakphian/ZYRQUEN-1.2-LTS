import React, { useState } from 'react';
import { Check, Copy, FileCode, ExternalLink, Code } from 'lucide-react';

interface CodeViewerProps {
  filename?: string;
  language?: string;
  code: string;
  maxHeight?: string;
  showLineNumbers?: boolean;
  onRunPreview?: () => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  filename,
  language = 'typescript',
  code,
  maxHeight = '420px',
  showLineNumbers = true,
  onRunPreview,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const lines = code.trim().split('\n');

  // Simple token highlight regex
  const highlightLine = (line: string) => {
    // Escape HTML first
    const escaped = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Apply syntax colors
    return escaped
      // Comments
      .replace(/(\/\/.*$|\/\*.*?\*\/|#.*$)/g, '<span class="text-slate-500 italic">$1</span>')
      // Strings
      .replace(/(['"`].*?['"`])/g, '<span class="text-emerald-400">$1</span>')
      // Keywords
      .replace(/\b(const|let|var|function|return|import|from|export|default|if|else|switch|case|break|for|while|async|await|try|catch|class|interface|type|extends|implements|new|this|throw|typeof|instanceof|void|def|return|class|def|import|from|as|in|is|lambda|pass|raise|with|yield|select|from|where|insert|into|values|update|set|delete|join|on|group|by|order|having|limit)\b/g, '<span class="text-violet-400 font-semibold">$1</span>')
      // Booleans & Null
      .replace(/\b(true|false|null|undefined|None|True|False)\b/g, '<span class="text-amber-400">$1</span>')
      // HTML/JSX tags
      .replace(/(&lt;\/?[a-zA-Z0-9\-_]+(&gt;)?)/g, '<span class="text-pink-400 font-medium">$1</span>');
  };

  const isPreviewable = ['html', 'javascript', 'js', 'css', 'react', 'jsx', 'tsx'].includes(
    (language || '').toLowerCase()
  );

  return (
    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950/90 shadow-xl my-3">
      {/* Code Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-mono">
          <FileCode className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold text-slate-200">{filename || 'untitled'}</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
            {language}
          </span>
          <span className="text-slate-500 text-[11px] font-sans">
            {lines.length} บรรทัด
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isPreviewable && onRunPreview && (
            <button
              onClick={onRunPreview}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition text-xs font-medium cursor-pointer"
              title="เปิดพรีวิวใน Live Sandbox"
            >
              <ExternalLink className="w-3 h-3" />
              <span>พรีวิวสด</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs font-medium cursor-pointer"
            title="คัดลอกโค้ดทั้งหมด"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">คัดลอกแล้ว</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>คัดลอก</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Body */}
      <div
        className="overflow-auto font-mono text-xs leading-relaxed p-3 bg-slate-950 select-text"
        style={{ maxHeight }}
      >
        <div className="table w-full">
          {lines.map((line, idx) => (
            <div key={idx} className="table-row hover:bg-slate-900/50 transition">
              {showLineNumbers && (
                <div className="table-cell pr-4 text-right select-none text-slate-600 text-[11px] w-8">
                  {idx + 1}
                </div>
              )}
              <div
                className="table-cell whitespace-pre font-mono text-slate-200"
                dangerouslySetInnerHTML={{ __html: highlightLine(line) }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
