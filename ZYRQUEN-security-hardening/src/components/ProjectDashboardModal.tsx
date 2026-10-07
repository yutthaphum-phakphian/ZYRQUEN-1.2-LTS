import React, { useState } from 'react';
import { 
  FolderPlus, 
  Folder, 
  Copy, 
  Edit3, 
  Trash2, 
  Play, 
  Download, 
  Clock, 
  FileCode, 
  X, 
  Sparkles, 
  Search, 
  Layers, 
  Check, 
  AlertTriangle,
  Globe,
  Briefcase,
  Layout,
  BarChart,
  ShoppingBag,
  Server
} from 'lucide-react';
import { SavedProject, ProjectContext } from '../types';

interface ProjectDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedProjects: SavedProject[];
  currentProjectId?: string;
  onOpenProject: (project: SavedProject) => void;
  onCreateNewProject: (category: string, name: string, description: string) => void;
  onDuplicateProject: (project: SavedProject) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onDeleteProject: (projectId: string) => void;
  onExportProjectZip: (project: SavedProject) => void;
}

export const ProjectDashboardModal: React.FC<ProjectDashboardModalProps> = ({
  isOpen,
  onClose,
  savedProjects,
  currentProjectId,
  onOpenProject,
  onCreateNewProject,
  onDuplicateProject,
  onRenameProject,
  onDeleteProject,
  onExportProjectZip,
}) => {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Web App');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Renaming state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    { id: 'Web App', icon: <Globe className="w-4 h-4 text-indigo-400" />, desc: 'เว็บแอปพลิเคชันแบบอินเตอร์แอคทีฟ' },
    { id: 'Portfolio', icon: <Briefcase className="w-4 h-4 text-emerald-400" />, desc: 'เว็บแนะนำตัวและผลงานส่วนตัว' },
    { id: 'Landing Page', icon: <Layout className="w-4 h-4 text-cyan-400" />, desc: 'หน้าขายสินค้าหรือบริการสไตล์โมเดิร์น' },
    { id: 'E-commerce', icon: <ShoppingBag className="w-4 h-4 text-amber-400" />, desc: 'ร้านค้าออนไลน์พร้อมตะกร้าสินค้า' },
    { id: 'Dashboard', icon: <BarChart className="w-4 h-4 text-violet-400" />, desc: 'แดชบอร์ดสรุปข้อมูลและกราฟิก' },
    { id: 'API', icon: <Server className="w-4 h-4 text-rose-400" />, desc: 'โครงสร้าง Backend REST API & Specs' },
  ];

  const filteredProjects = savedProjects.filter((p) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    if (!newProjectName.trim()) return;
    onCreateNewProject(selectedCategory, newProjectName.trim(), newProjectDesc.trim());
    setIsCreatingNew(false);
    setNewProjectName('');
    setNewProjectDesc('');
  };

  const handleSaveRename = (id: string) => {
    if (renameText.trim()) {
      onRenameProject(id, renameText.trim());
    }
    setRenamingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>My Projects Dashboard</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {savedProjects.length} โปรเจกต์
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                จัดการโปรเจกต์ทั้งหมด สลับโปรเจกต์ และส่งออกโค้ด ZIP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreatingNew(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer transition shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ New Project</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* New Project Inline Creation Panel */}
        {isCreatingNew && (
          <div className="p-4 sm:p-5 bg-slate-900 border-b border-indigo-500/30 space-y-4 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>สร้างโปรเจกต์ใหม่ (Create New Project)</span>
              </span>
              <button
                onClick={() => setIsCreatingNew(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>

            {/* Category presets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {cat.icon}
                    <span className="text-xs">{cat.id}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="ชื่อโปรเจกต์ เช่น Portfolio Pro, Gym Web..."
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="คำอธิบายเป้าหมายสั้น ๆ..."
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleCreate}
                disabled={!newProjectName.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer disabled:opacity-40"
              >
                สร้างโปรเจกต์และเริ่มเขียนโค้ด
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950 flex items-center gap-2 shrink-0">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาโปรเจกต์ตามชื่อ หรือประเภท..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Projects Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Folder className="w-12 h-12 text-slate-700 mx-auto" />
              <p className="text-sm text-slate-400 font-medium">
                {searchQuery ? 'ไม่พบโปรเจกต์ที่ตรงกับคำค้นหา' : 'ยังไม่มีโปรเจกต์ที่บันทึกไว้'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredProjects.map((proj) => {
                const isCurrent = proj.id === currentProjectId;
                const isDeleting = deletingId === proj.id;
                const isRenaming = renamingId === proj.id;

                return (
                  <div
                    key={proj.id}
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-indigo-950/20 border-indigo-500/50 shadow-lg shadow-indigo-500/5'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                          {proj.category || 'Web App'}
                        </span>

                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Active Project
                          </span>
                        )}
                      </div>

                      {/* Name & Rename */}
                      {isRenaming ? (
                        <div className="flex items-center gap-1.5 mb-2">
                          <input
                            type="text"
                            value={renameText}
                            onChange={(e) => setRenameText(e.target.value)}
                            className="bg-slate-950 border border-indigo-500 rounded-lg px-2 py-1 text-xs text-white flex-1"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(proj.id)}
                            className="p-1 bg-emerald-600 text-white rounded cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setRenamingId(null)}
                            className="p-1 bg-slate-800 text-slate-400 rounded cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                          <span>{proj.name}</span>
                          <button
                            onClick={() => {
                              setRenamingId(proj.id);
                              setRenameText(proj.name);
                            }}
                            className="text-slate-500 hover:text-slate-300 p-0.5"
                            title="เปลี่ยนชื่อโปรเจกต์"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </h3>
                      )}

                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {proj.description || 'ไม่มีคำอธิบาย'}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <FileCode className="w-3 h-3 text-indigo-400" />
                          {proj.files.length} ไฟล์
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(proj.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Delete Confirmation or Normal Actions */}
                    {isDeleting ? (
                      <div className="mt-3 pt-3 border-t border-rose-500/30 flex items-center justify-between bg-rose-950/20 p-2 rounded-xl">
                        <span className="text-[11px] text-rose-300 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          ยืนยันการลบ?
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              onDeleteProject(proj.id);
                              setDeletingId(null);
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            ลบถาวร
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-2 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onExportProjectZip(proj)}
                            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 text-xs transition cursor-pointer"
                            title="Export ZIP"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDuplicateProject(proj)}
                            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 text-xs transition cursor-pointer"
                            title="Duplicate Project"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {savedProjects.length > 1 && (
                            <button
                              onClick={() => setDeletingId(proj.id)}
                              className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 text-xs transition cursor-pointer"
                              title="Delete Project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            onOpenProject(proj);
                            onClose();
                          }}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isCurrent
                              ? 'bg-slate-800 text-indigo-300'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                          }`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>{isCurrent ? 'กำลังเปิดอยู่' : 'เปิดโปรเจกต์'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
