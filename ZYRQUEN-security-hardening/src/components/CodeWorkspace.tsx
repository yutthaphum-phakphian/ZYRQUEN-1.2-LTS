import React, { useState } from 'react';
import { 
  FileCode, 
  Plus, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  Play,
  FolderOpen,
  Edit3,
  Save,
  ArrowLeft,
  ChevronDown
} from 'lucide-react';
import { CodeFile, ProjectContext } from '../types';
import { CodeViewer } from '../utils/codeHighlighter';

interface CodeWorkspaceProps {
  projectContext: ProjectContext;
  onUpdateFile: (file: CodeFile) => void;
  onDeleteFile: (filename: string) => void;
  onAddFile: (file: CodeFile) => void;
  onOpenInSandbox: () => void;
  onBackToChat?: () => void;
}

export const CodeWorkspace: React.FC<CodeWorkspaceProps> = ({
  projectContext,
  onUpdateFile,
  onDeleteFile,
  onAddFile,
  onOpenInSandbox,
  onBackToChat,
}) => {
  const [selectedFileName, setSelectedFileName] = useState<string>(
    projectContext.files[0]?.name || ''
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileLang, setNewFileLang] = useState('typescript');
  const [copiedAll, setCopiedAll] = useState(false);
  const [isFileSelectorOpen, setIsFileSelectorOpen] = useState(false);

  // Sync selected file if list changes
  const activeFile = projectContext.files.find((f) => f.name === selectedFileName) || projectContext.files[0];

  const handleStartEdit = () => {
    if (activeFile) {
      setEditContent(activeFile.content);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (activeFile) {
      onUpdateFile({
        ...activeFile,
        content: editContent,
      });
      setIsEditing(false);
    }
  };

  const handleCreateNewFile = () => {
    if (!newFileName.trim()) return;
    const name = newFileName.trim();
    const ext = name.split('.').pop() || 'txt';
    const langMap: Record<string, string> = {
      html: 'html',
      css: 'css',
      js: 'javascript',
      ts: 'typescript',
      jsx: 'javascript',
      tsx: 'typescript',
      py: 'python',
      sql: 'sql',
      json: 'json',
    };

    const newFile: CodeFile = {
      name,
      language: langMap[ext] || newFileLang,
      content: `// ${name}\n// สร้างโดย CodeVoice AI\n`,
      description: 'ไฟล์ใหม่ในโปรเจกต์',
    };

    onAddFile(newFile);
    setSelectedFileName(name);
    setIsCreatingNew(false);
    setNewFileName('');
  };

  const handleDownloadProject = () => {
    const projName = projectContext.projectName || projectContext.name || 'project';
    const projectExport = {
      name: projName,
      framework: projectContext.framework,
      description: projectContext.description,
      exportedAt: new Date().toISOString(),
      files: projectContext.files,
    };

    const blob = new Blob([JSON.stringify(projectExport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projName.toLowerCase().replace(/\s+/g, '-')}-project.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSingleFile = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 max-w-full overflow-hidden">
      {/* Workspace Mobile / Top Action Bar */}
      <div className="p-2.5 sm:p-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {onBackToChat && (
            <button
              onClick={onBackToChat}
              className="md:hidden flex items-center justify-center min-w-[36px] min-h-[36px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer shrink-0"
              title="กลับไปหน้าแชต"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-1.5 min-w-0">
            <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-xs font-bold text-slate-200 truncate">
              {projectContext.projectName || 'โปรเจกต์'} ({projectContext.files.length})
            </span>
          </div>
        </div>

        {/* Action buttons: Run in sandbox, New file, Export */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={onOpenInSandbox}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer min-h-[36px] active:scale-95 shadow-sm"
            title="เปิดดูพรีวิวสด (Live Sandbox)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run / Preview</span>
          </button>

          <button
            onClick={() => setIsCreatingNew(!isCreatingNew)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition cursor-pointer min-h-[36px]"
            title="เพิ่มไฟล์ใหม่"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">สร้างไฟล์</span>
          </button>

          <button
            onClick={handleDownloadProject}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="ส่งออกโปรเจกต์ทั้งหมด"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* New File Inline Form */}
      {isCreatingNew && (
        <div className="p-2.5 bg-slate-900 border-b border-indigo-500/40 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="ชื่อไฟล์ เช่น app.js, style.css"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          <button
            onClick={handleCreateNewFile}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium cursor-pointer"
          >
            สร้าง
          </button>
          <button
            onClick={() => setIsCreatingNew(false)}
            className="px-2 py-1.5 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
          >
            ยกเลิก
          </button>
        </div>
      )}

      {/* Responsive File Tabs Bar (Horizontal scrolling with touch momentum) */}
      <div className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-950 border-b border-slate-800 overflow-x-auto scrollbar-none shrink-0">
        {projectContext.files.map((file) => {
          const isSelected = activeFile?.name === file.name;
          return (
            <button
              key={file.name}
              onClick={() => {
                setSelectedFileName(file.name);
                setIsEditing(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer whitespace-nowrap min-h-[34px] select-none ${
                isSelected
                  ? 'bg-slate-800 text-indigo-300 border border-indigo-500/40 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileCode className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span>{file.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active File Editor / Viewer */}
      {activeFile ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* File Action Toolbar */}
          <div className="px-3 py-1.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-slate-200 font-mono truncate">{activeFile.name}</span>
              <span className="text-[10px] text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-950 font-mono">
                {activeFile.language}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {isEditing ? (
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer min-h-[32px]"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึก</span>
                </button>
              ) : (
                <button
                  onClick={handleStartEdit}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer min-h-[32px]"
                  title="แก้ไขโค้ดนี้"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไข</span>
                </button>
              )}

              <button
                onClick={handleDownloadSingleFile}
                className="p-1.5 text-slate-400 hover:text-slate-200 cursor-pointer rounded-lg hover:bg-slate-800 min-h-[32px] min-w-[32px] flex items-center justify-center"
                title="ดาวน์โหลดไฟล์นี้"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              {projectContext.files.length > 1 && (
                <button
                  onClick={() => onDeleteFile(activeFile.name)}
                  className="p-1.5 text-rose-400 hover:text-rose-300 cursor-pointer rounded-lg hover:bg-rose-950/40 min-h-[32px] min-w-[32px] flex items-center justify-center"
                  title="ลบไฟล์นี้"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Editor Textarea OR Syntax Highlighted Code Viewer */}
          <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 bg-slate-950 p-2 sm:p-3">
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-full min-h-[350px] bg-slate-950 text-slate-100 font-mono text-xs p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                spellCheck={false}
              />
            ) : (
              <div className="w-full h-full min-w-0">
                <CodeViewer
                  filename={activeFile.name}
                  language={activeFile.language}
                  code={activeFile.content}
                  onRunPreview={onOpenInSandbox}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-xs p-8">
          ยังไม่มีไฟล์ในโปรเจกต์
        </div>
      )}
    </div>
  );
};
