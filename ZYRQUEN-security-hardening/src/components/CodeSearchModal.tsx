import React, { useState, useMemo } from 'react';
import { Search, FileCode, ArrowRight, X, Sparkles, Filter } from 'lucide-react';
import { CodeFile } from '../types';

interface CodeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: CodeFile[];
  onSelectFile: (fileName: string, line?: number) => void;
}

interface SearchResult {
  fileName: string;
  language: string;
  line: number;
  snippet: string;
  matchType: 'code' | 'file';
}

export const CodeSearchModal: React.FC<CodeSearchModalProps> = ({
  isOpen,
  onClose,
  files,
  onSelectFile,
}) => {
  const [query, setQuery] = useState('');
  const [filterLang, setFilterLang] = useState('all');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const list: SearchResult[] = [];

    files.forEach((file) => {
      if (filterLang !== 'all' && file.language !== filterLang) return;

      // Check file name match
      if (file.name.toLowerCase().includes(q)) {
        list.push({
          fileName: file.name,
          language: file.language,
          line: 1,
          snippet: `[ชื่อไฟล์ตรงกับคำค้น] ${file.name}`,
          matchType: 'file',
        });
      }

      // Check file lines match
      const lines = file.content.split('\n');
      lines.forEach((lineText, idx) => {
        if (lineText.toLowerCase().includes(q)) {
          list.push({
            fileName: file.name,
            language: file.language,
            line: idx + 1,
            snippet: lineText.trim(),
            matchType: 'code',
          });
        }
      });
    });

    return list.slice(0, 50); // limit to top 50 matches
  }, [query, files, filterLang]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[85vh] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Search Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-2 shrink-0">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-indigo-400 absolute left-3 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาฟังก์ชัน ตัวแปร คอมโพเนนต์ หรือชื่อไฟล์..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Info & Count */}
        <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>พบ {results.length} ผลลัพธ์ใน {files.length} ไฟล์</span>
          <span className="font-mono text-slate-500">แตะรายการเพื่อเปิดไฟล์</span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {query.trim() === '' ? (
            <div className="text-center py-10 text-slate-600 text-xs">
              พิมพ์คำค้นหาเพื่อค้นในโปรเจกต์ทั้งหมด
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              ไม่พบบรรทัดหรือไฟล์ที่ตรงกับ "{query}"
            </div>
          ) : (
            results.map((res, i) => (
              <button
                key={i}
                onClick={() => {
                  onSelectFile(res.fileName, res.line);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition cursor-pointer group flex items-start justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-xs font-bold text-white group-hover:text-indigo-300 font-mono">
                      {res.fileName}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 font-mono">
                      Line {res.line}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-300 truncate bg-slate-950/80 p-1.5 rounded-lg border border-slate-800/60">
                    {res.snippet}
                  </p>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 shrink-0 mt-2" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
