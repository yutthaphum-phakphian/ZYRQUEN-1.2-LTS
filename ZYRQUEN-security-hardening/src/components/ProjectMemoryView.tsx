import React, { useState } from 'react';
import { 
  Brain, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  RotateCcw, 
  FileText, 
  Download, 
  Plus, 
  Trash2, 
  BookOpen, 
  Shield, 
  Check, 
  Copy,
  ToggleLeft,
  ToggleRight,
  Filter,
  Globe,
  Sliders,
  AlertTriangle,
  Info,
  CheckCheck,
  GitPullRequest,
  ListTodo,
  Clock,
  Ban,
  ArrowRight,
  Cpu,
  History,
  Share2
} from 'lucide-react';
import { 
  ProjectContext, 
  ProjectRule, 
  KnowledgeItem, 
  ProjectTask, 
  ArchitectureDecision, 
  RuleConflictRecord,
  ProjectHandoff 
} from '../types';

interface ProjectMemoryViewProps {
  projectContext: ProjectContext;
  onUpdateContext: (updated: Partial<ProjectContext>) => void;
  onResetContext: () => void;
  onAddRule?: (ruleText: string) => void;
  onToggleRule?: (ruleId: string) => void;
  onDeleteRule?: (ruleId: string) => void;
  onAddKnowledge?: (item: Omit<KnowledgeItem, 'id' | 'addedAt'>) => void;
  onDeleteKnowledge?: (knowledgeId: string) => void;
  onAddTask?: (task: Partial<ProjectTask>) => void;
  onUpdateTaskStatus?: (taskId: string, status: any) => void;
  onAddDecision?: (decision: string, reason: string, category: any) => void;
}

export const ProjectMemoryView: React.FC<ProjectMemoryViewProps> = ({
  projectContext,
  onUpdateContext,
  onResetContext,
  onAddRule,
  onToggleRule,
  onDeleteRule,
  onAddKnowledge,
  onDeleteKnowledge,
  onAddTask,
  onUpdateTaskStatus,
  onAddDecision,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'decisions' | 'rules' | 'issues' | 'knowledge'>('overview');
  const [newRuleText, setNewRuleText] = useState('');
  const [newIssueText, setNewIssueText] = useState('');
  const [isAddingIssue, setIsAddingIssue] = useState(false);
  const [newKnowledgeTitle, setNewKnowledgeTitle] = useState('');
  const [newKnowledgeContent, setNewKnowledgeContent] = useState('');
  const [newKnowledgeSource, setNewKnowledgeSource] = useState('README.md');
  const [isAddingKnowledge, setIsAddingKnowledge] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedHandoff, setCopiedHandoff] = useState(false);

  // New task inputs
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [newTaskDeps, setNewTaskDeps] = useState('');

  // New decision inputs
  const [isAddingDecision, setIsAddingDecision] = useState(false);
  const [newDecisionText, setNewDecisionText] = useState('');
  const [newDecisionReason, setNewDecisionReason] = useState('');
  const [newDecisionCat, setNewDecisionCat] = useState<'stack' | 'style' | 'state' | 'api' | 'security' | 'convention'>('convention');

  // Default project rules if empty
  const rules: ProjectRule[] = projectContext.rules && projectContext.rules.length > 0 
    ? projectContext.rules 
    : [
        { id: '1', text: 'เขียนโค้ดที่สมบูรณ์ ปลอดภัย และรันได้จริง ห้ามเขียน placeholder ว่า "... TODO ..."', active: true },
        { id: '2', text: 'ใช้โครงสร้างแบบ Modular Component และแยกไฟล์อย่างเป็นระเบียบ', active: true },
        { id: '3', text: 'รักษาฟีเจอร์เดิมของโปรเจกต์ทั้งหมดเมื่อทำการแก้ไข', active: true },
        { id: '4', text: 'ตอบสรุปเสียง (Voice) สั้นกระชับ 1-2 ประโยคเสมอ', active: true },
        { id: '5', text: 'ใช้ Tailwind CSS ในการตกแต่งและจัดวาง Responsive Layout', active: true },
      ];

  // Default tasks if empty
  const tasks: ProjectTask[] = projectContext.tasks && projectContext.tasks.length > 0
    ? projectContext.tasks
    : [
        {
          id: 'task-1',
          title: 'โครงสร้างโปรเจกต์พื้นฐาน (Project Setup)',
          description: 'กำหนดไฟล์ index.html, style.css, script.js พร้อม Tailwind CDN',
          status: 'COMPLETED',
          priority: 'CRITICAL',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          order: 1,
        },
        {
          id: 'task-2',
          title: 'หน้าหลักและรายการสินค้า (Hero & Catalog)',
          description: 'สร้าง Hero Banner, สินค้าแนะนำ และปุ่มเพิ่มลงตะกร้า',
          status: 'COMPLETED',
          priority: 'HIGH',
          dependencies: ['task-1'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          order: 2,
        },
        {
          id: 'task-3',
          title: 'ระบบตะกร้าสินค้า (Cart Drawer)',
          description: 'เพิ่มฟังก์ชัน Add to Cart, Badge นับจำนวน และ Drawer สรุปยอด',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          dependencies: ['task-2'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          order: 3,
        },
        {
          id: 'task-4',
          title: 'ระบบเช็คเอาท์และชำระเงิน (Checkout Flow)',
          description: 'ฟอร์มกรอกที่อยู่จัดส่งและชำระเงินจำลอง',
          status: 'BLOCKED',
          blockedReason: 'รอระบบตะกร้าสินค้า (task-3) เสร็จสมบูรณ์',
          priority: 'MEDIUM',
          dependencies: ['task-3'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          order: 4,
        },
        {
          id: 'task-5',
          title: 'ตรวจสอบ Responsive & การทดสอบขั้นสุดท้าย',
          description: 'ตรวจสอบบนขนาด 360px, 768px และ 1280px',
          status: 'TODO',
          priority: 'MEDIUM',
          dependencies: ['task-4'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          order: 5,
        },
      ];

  // Default decisions
  const decisions: ArchitectureDecision[] = projectContext.decisions && projectContext.decisions.length > 0
    ? projectContext.decisions
    : [
        {
          id: 'dec-1',
          decision: 'ใช้ Tailwind CSS CDN สำหรับ Styling ทั้งระบบ',
          reason: 'เพื่อความรวดเร็วและสนับสนุน Mobile-First Responsive ครบถ้วน',
          category: 'style',
          createdAt: new Date().toISOString(),
          status: 'active',
        },
        {
          id: 'dec-2',
          decision: 'แยก Script และ State เข้าสู่ script.js แบบ Modular',
          reason: 'เพื่อการดูแลรักษาที่ง่ายและสามารถรันบน Live Sandbox ได้ทันที',
          category: 'stack',
          createdAt: new Date().toISOString(),
          status: 'active',
        },
      ];

  // Default knowledge base
  const knowledgeBase: KnowledgeItem[] = projectContext.knowledgeBase && projectContext.knowledgeBase.length > 0
    ? projectContext.knowledgeBase
    : [
        {
          id: 'k1',
          title: 'Project Architecture & Specs',
          content: 'เว็บแอปพลิเคชันประกอบด้วยโครงสร้าง 4 ไฟล์หลัก (index.html, style.css, script.js, README.md) พร้อมระบบ UI Responsive และ Cart Drawer',
          type: 'readme',
          source: 'README.md',
          addedAt: new Date().toISOString(),
        },
        {
          id: 'k2',
          title: 'Tailwind CSS Guidelines',
          content: 'กำหนดสไตล์ผ่าน Tailwind CSS พร้อม Dark Theme (#0c0a09, #1c1917, #f59e0b) รองรับ Touch Targets 44px+',
          type: 'guideline',
          source: 'docs/styling.md',
          addedAt: new Date().toISOString(),
        },
      ];

  // Known issues list
  const [issuesList, setIssuesList] = useState<Array<{ id: string; text: string; status: 'active' | 'resolved'; severity: 'low' | 'medium' | 'high' }>>([
    { id: 'iss-1', text: projectContext.activeIssues || 'ตรวจสอบความเข้ากันได้ของ Responsive บนหน้าจอขนาดเล็กพิเศษ (<360px)', status: 'active', severity: 'low' },
  ]);

  const activeRulesCount = rules.filter((r) => r.active).length;
  const completedTasksCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressTasksCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const blockedTasksCount = tasks.filter((t) => t.status === 'BLOCKED').length;
  const upcomingTasksCount = tasks.filter((t) => t.status === 'TODO' || t.status === 'PLANNED').length;

  const handleToggleRule = (ruleId: string) => {
    if (onToggleRule) {
      onToggleRule(ruleId);
    } else {
      const updatedRules = rules.map((r) => (r.id === ruleId ? { ...r, active: !r.active } : r));
      onUpdateContext({ rules: updatedRules });
    }
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleText.trim()) return;

    if (onAddRule) {
      onAddRule(newRuleText.trim());
    } else {
      const newRule: ProjectRule = {
        id: `rule-${Date.now()}`,
        text: newRuleText.trim(),
        active: true,
      };
      onUpdateContext({ rules: [...rules, newRule] });
    }
    setNewRuleText('');
  };

  const handleDeleteRule = (ruleId: string) => {
    if (onDeleteRule) {
      onDeleteRule(ruleId);
    } else {
      onUpdateContext({ rules: rules.filter((r) => r.id !== ruleId) });
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const deps = newTaskDeps.split(',').map(s => s.trim()).filter(Boolean);
    const newTask: ProjectTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      status: deps.length > 0 ? 'BLOCKED' : 'TODO',
      priority: newTaskPriority,
      dependencies: deps,
      blockedReason: deps.length > 0 ? `รอ Dependency: ${deps.join(', ')}` : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: tasks.length + 1,
    };

    if (onAddTask) {
      onAddTask(newTask);
    } else {
      onUpdateContext({ tasks: [...tasks, newTask], taskQueue: [...tasks.map(t => t.id), newTask.id] });
    }

    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskDeps('');
    setIsAddingTask(false);
  };

  const handleCreateDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDecisionText.trim() || !newDecisionReason.trim()) return;

    if (onAddDecision) {
      onAddDecision(newDecisionText.trim(), newDecisionReason.trim(), newDecisionCat);
    } else {
      const newDec: ArchitectureDecision = {
        id: `dec-${Date.now()}`,
        decision: newDecisionText.trim(),
        reason: newDecisionReason.trim(),
        category: newDecisionCat,
        createdAt: new Date().toISOString(),
        status: 'active',
      };
      onUpdateContext({ decisions: [...decisions, newDec] });
    }

    setNewDecisionText('');
    setNewDecisionReason('');
    setIsAddingDecision(false);
  };

  const handleAddIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssueText.trim()) return;
    const newIssue = {
      id: `iss-${Date.now()}`,
      text: newIssueText.trim(),
      status: 'active' as const,
      severity: 'medium' as const,
    };
    setIssuesList([...issuesList, newIssue]);
    onUpdateContext({ activeIssues: [...issuesList, newIssue].filter(i => i.status === 'active').map(i => i.text).join('; ') });
    setNewIssueText('');
    setIsAddingIssue(false);
  };

  const handleToggleIssue = (issueId: string) => {
    const updated = issuesList.map((issue) =>
      issue.id === issueId ? { ...issue, status: issue.status === 'active' ? ('resolved' as const) : ('active' as const) } : issue
    );
    setIssuesList(updated);
    const activeText = updated.filter(i => i.status === 'active').map(i => i.text).join('; ');
    onUpdateContext({ activeIssues: activeText || 'ไม่มีข้อผิดพลาดคงค้าง' });
  };

  const handleCopySummary = () => {
    const text = `
=== PROJECT BRAIN SUMMARY: ${projectContext.projectName || 'Web App'} ===
• Category: ${projectContext.category || 'Web App'}
• Framework: ${projectContext.framework}
• Active Tasks: ${inProgressTasksCount} | Completed: ${completedTasksCount} | Blocked: ${blockedTasksCount}
• Active Rules (${activeRulesCount}):
${rules.filter(r => r.active).map(r => `  - ${r.text}`).join('\n')}
• Key Architecture Decisions (${decisions.length}):
${decisions.map(d => `  - [${d.category}] ${d.decision} (เหตุผล: ${d.reason})`).join('\n')}
• Known Issues: ${issuesList.filter(i => i.status === 'active').map(i => i.text).join(', ') || 'None'}
=========================================`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleCopyHandoff = () => {
    const handoffText = JSON.stringify({
      projectName: projectContext.projectName || 'Web App',
      category: projectContext.category,
      framework: projectContext.framework,
      currentGoal: projectContext.currentGoal || projectContext.currentTask,
      completedTasks: tasks.filter(t => t.status === 'COMPLETED').map(t => t.title),
      inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').map(t => t.title),
      blockedTasks: tasks.filter(t => t.status === 'BLOCKED').map(t => ({ title: t.title, reason: t.blockedReason })),
      rules: rules.filter(r => r.active).map(r => r.text),
      decisions: decisions.map(d => ({ decision: d.decision, reason: d.reason })),
      files: projectContext.files.map(f => f.name),
      timestamp: new Date().toISOString(),
    }, null, 2);

    navigator.clipboard.writeText(handoffText);
    setCopiedHandoff(true);
    setTimeout(() => setCopiedHandoff(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-stone-950 text-stone-100 overflow-y-auto">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-900/60 backdrop-blur-md sticky top-0 z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-stone-100 tracking-tight">
                  Project Brain & Long-Term Memory
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  V8
                </span>
              </div>
              <p className="text-xs text-stone-400">
                ศูนย์กลางปัญญาของโปรเจกต์ • Multi-Task Queue • Decisions & Roadmap
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyHandoff}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 transition"
              title="Copy Project Handoff JSON"
            >
              {copiedHandoff ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedHandoff ? 'Copied Handoff!' : 'Handoff JSON'}</span>
            </button>
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition"
            >
              {copiedSummary ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSummary ? 'Copied Summary!' : 'Copy Summary'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 max-w-6xl mx-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                : 'bg-stone-800/80 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>ภาพรวม (Overview)</span>
          </button>

          <button
            onClick={() => setActiveTab('roadmap')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'roadmap'
                ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                : 'bg-stone-800/80 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Task Roadmap ({tasks.length})</span>
            {blockedTasksCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/30 text-rose-300 border border-rose-500/50">
                {blockedTasksCount} Blocked
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('decisions')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'decisions'
                ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                : 'bg-stone-800/80 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>Decisions & History ({decisions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'rules'
                ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                : 'bg-stone-800/80 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Project Rules ({activeRulesCount}/{rules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('issues')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'issues'
                ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                : 'bg-stone-800/80 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Known Issues ({issuesList.filter(i => i.status === 'active').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'knowledge'
                ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                : 'bg-stone-800/80 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Knowledge Base ({knowledgeBase.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Project Brain Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Project Identity</span>
                  <Globe className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-base font-bold text-stone-100">{projectContext.projectName || 'Aroma Cafe'}</div>
                <div className="text-xs text-stone-400 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">
                    {projectContext.category || 'Web App'}
                  </span>
                  <span>{projectContext.framework || 'HTML5/Tailwind'}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Roadmap Progress</span>
                  <ListTodo className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-base font-bold text-emerald-400">
                  {completedTasksCount} / {tasks.length} Tasks เสร็จแล้ว
                </div>
                <div className="w-full bg-stone-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${tasks.length > 0 ? (completedTasksCount / tasks.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Active Rules & Safety</span>
                  <Shield className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-base font-bold text-blue-400">{activeRulesCount} กฎเปิดใช้งาน</div>
                <p className="text-xs text-stone-400">
                  ป้องกัน Placeholder • บังคับ Responsive • รองรับ Self-Healing
                </p>
              </div>
            </div>

            {/* Current Goal & Active Task */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500/10 via-stone-900 to-stone-900 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>เป้าหมายและ Task ที่กำลังทำ (Current Focus)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Live Sync
                </span>
              </div>
              <p className="text-sm text-stone-200 leading-relaxed font-medium">
                {projectContext.currentGoal || projectContext.currentTask || 'ระบบพร้อมรับคำสั่งพัฒนาและขยายโปรเจกต์'}
              </p>
              {projectContext.recentChanges && projectContext.recentChanges.length > 0 && (
                <div className="pt-2 border-t border-stone-800/80 text-xs text-stone-400 space-y-1">
                  <span className="font-semibold text-stone-300">การเปลี่ยนแปลงล่าสุด:</span>
                  <div className="line-clamp-2">{projectContext.recentChanges[0]}</div>
                </div>
              )}
            </div>

            {/* Project Handoff Summary Card */}
            <div className="p-5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-stone-200">Project Handoff State (ความจำต่อเนื่องข้าม Session)</h3>
                </div>
                <button
                  onClick={handleCopyHandoff}
                  className="text-xs text-purple-300 hover:text-purple-200 underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Handoff JSON</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-stone-950/60 border border-stone-800">
                  <span className="font-semibold text-emerald-400 block mb-1">✓ สิ่งที่ทำเสร็จแล้ว ({completedTasksCount}):</span>
                  <ul className="list-disc list-inside space-y-0.5 text-stone-300">
                    {tasks.filter(t => t.status === 'COMPLETED').map(t => (
                      <li key={t.id} className="truncate">{t.title}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded-lg bg-stone-950/60 border border-stone-800">
                  <span className="font-semibold text-amber-400 block mb-1">→ กำลังดำเนินการ / ค้างอยู่ ({inProgressTasksCount + blockedTasksCount}):</span>
                  <ul className="list-disc list-inside space-y-0.5 text-stone-300">
                    {tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'BLOCKED').map(t => (
                      <li key={t.id} className="truncate">
                        {t.title} {t.status === 'BLOCKED' ? '(ติด Dependency)' : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ROADMAP & TASK QUEUE TAB */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-amber-400" />
                  <span>Project Roadmap & Multi-Task Queue</span>
                </h3>
                <p className="text-xs text-stone-400">
                  จัดการลำดับงานอัตโนมัติ ติดตามสถานะ และตรวจเช็ค Dependencies แบบเรียลไทม์
                </p>
              </div>
              <button
                onClick={() => setIsAddingTask(!isAddingTask)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่ม Task ใหม่</span>
              </button>
            </div>

            {/* Add Task Form */}
            {isAddingTask && (
              <form onSubmit={handleCreateTask} className="p-4 rounded-xl bg-stone-900 border border-amber-500/40 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">สร้าง Task ใหม่</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="ชื่อ Task เช่น เพิ่มระบบค้นหาสินค้า"
                    className="w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                    required
                  />
                  <textarea
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    placeholder="รายละเอียดงานและไฟล์ที่เกี่ยวข้อง"
                    className="w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                    rows={2}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newTaskDeps}
                      onChange={(e) => setNewTaskDeps(e.target.value)}
                      placeholder="Dependencies (เช่น task-1, task-2)"
                      className="w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                    />
                    <select
                      value={newTaskPriority}
                      onChange={(e: any) => setNewTaskPriority(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="LOW">Priority: LOW</option>
                      <option value="MEDIUM">Priority: MEDIUM</option>
                      <option value="HIGH">Priority: HIGH</option>
                      <option value="CRITICAL">Priority: CRITICAL</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="px-3 py-1.5 rounded-lg text-xs bg-stone-800 text-stone-400 hover:text-stone-200"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs bg-amber-500 font-semibold text-stone-950 hover:bg-amber-400"
                  >
                    บันทึก Task
                  </button>
                </div>
              </form>
            )}

            {/* Task List */}
            <div className="space-y-3">
              {tasks.map((task, index) => {
                const isCompleted = task.status === 'COMPLETED';
                const isInProgress = task.status === 'IN_PROGRESS';
                const isBlocked = task.status === 'BLOCKED';

                return (
                  <div
                    key={task.id || index}
                    className={`p-4 rounded-xl border transition-all ${
                      isInProgress
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                        : isBlocked
                        ? 'bg-rose-500/5 border-rose-500/30'
                        : isCompleted
                        ? 'bg-stone-900/60 border-stone-800/80 opacity-80'
                        : 'bg-stone-900/90 border-stone-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                          {isInProgress && <Clock className="w-5 h-5 text-amber-400 animate-spin" />}
                          {isBlocked && <Ban className="w-5 h-5 text-rose-400" />}
                          {!isCompleted && !isInProgress && !isBlocked && (
                            <div className="w-5 h-5 rounded-full border-2 border-stone-600 flex items-center justify-center text-[10px] text-stone-400 font-bold">
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-stone-100">{task.title}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                isCompleted
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : isInProgress
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                  : isBlocked
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : 'bg-stone-800 text-stone-400 border border-stone-700'
                              }`}
                            >
                              {task.status}
                            </span>
                            {task.priority && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-stone-800 text-stone-400">
                                {task.priority}
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-xs text-stone-400 leading-relaxed">{task.description}</p>
                          )}
                          {isBlocked && task.blockedReason && (
                            <p className="text-xs text-rose-400 flex items-center gap-1 font-medium pt-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{task.blockedReason}</span>
                            </p>
                          )}
                          {task.dependencies && task.dependencies.length > 0 && (
                            <div className="flex items-center gap-1 text-[11px] text-stone-500 pt-1">
                              <span>Prerequisites:</span>
                              {task.dependencies.map(d => (
                                <span key={d} className="px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 border border-stone-700">
                                  {d}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Status Control */}
                      <div className="flex items-center gap-1.5">
                        {isInProgress && (
                          <button
                            onClick={() => {
                              const updated = tasks.map(t => t.id === task.id ? { ...t, status: 'COMPLETED' as const, completedAt: new Date().toISOString() } : t);
                              onUpdateContext({ tasks: updated });
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-medium transition"
                          >
                            Mark Completed
                          </button>
                        )}
                        {!isCompleted && !isInProgress && !isBlocked && (
                          <button
                            onClick={() => {
                              const updated = tasks.map(t => t.id === task.id ? { ...t, status: 'IN_PROGRESS' as const } : t);
                              onUpdateContext({ tasks: updated, activeTaskId: task.id, currentGoal: task.title });
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-medium transition"
                          >
                            Start Task
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DECISIONS & HISTORY TAB */}
        {activeTab === 'decisions' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                  <GitPullRequest className="w-5 h-5 text-amber-400" />
                  <span>Architecture Decisions & Memory Log</span>
                </h3>
                <p className="text-xs text-stone-400">
                  บันทึกการตัดสินใจสถาปัตยกรรม (Stack, Styling, State, API) และประวัติการ Override ข้อมูลเก่า
                </p>
              </div>
              <button
                onClick={() => setIsAddingDecision(!isAddingDecision)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ บันทึกการตัดสินใจใหม่</span>
              </button>
            </div>

            {/* Add Decision Form */}
            {isAddingDecision && (
              <form onSubmit={handleCreateDecision} className="p-4 rounded-xl bg-stone-900 border border-amber-500/40 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">บันทึก Architecture Decision</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newDecisionText}
                    onChange={(e) => setNewDecisionText(e.target.value)}
                    placeholder="Decision เช่น ใช้ Zustand สำหรับจัดการตะกร้าสินค้า"
                    className="w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                    required
                  />
                  <textarea
                    value={newDecisionReason}
                    onChange={(e) => setNewDecisionReason(e.target.value)}
                    placeholder="เหตุผล (Reasoning / Context)"
                    className="w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                    rows={2}
                    required
                  />
                  <select
                    value={newDecisionCat}
                    onChange={(e: any) => setNewDecisionCat(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="stack">Category: Stack / Framework</option>
                    <option value="style">Category: Style / UI</option>
                    <option value="state">Category: State Management</option>
                    <option value="api">Category: API & Backend</option>
                    <option value="security">Category: Security</option>
                    <option value="convention">Category: Convention</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingDecision(false)}
                    className="px-3 py-1.5 rounded-lg text-xs bg-stone-800 text-stone-400 hover:text-stone-200"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs bg-amber-500 font-semibold text-stone-950 hover:bg-amber-400"
                  >
                    บันทึก Decision
                  </button>
                </div>
              </form>
            )}

            {/* Decisions List */}
            <div className="space-y-3">
              {decisions.map((dec) => (
                <div
                  key={dec.id}
                  className={`p-4 rounded-xl border ${
                    dec.status === 'superseded'
                      ? 'bg-stone-900/40 border-stone-800/50 opacity-60'
                      : 'bg-stone-900/80 border-stone-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {dec.category || 'Architecture'}
                        </span>
                        <h4 className="text-sm font-bold text-stone-100">{dec.decision}</h4>
                        {dec.status === 'superseded' && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Superseded
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 leading-relaxed">
                        <strong className="text-stone-300">เหตุผล:</strong> {dec.reason}
                      </p>
                      <div className="text-[11px] text-stone-500 pt-1">
                        บันทึกเมื่อ: {new Date(dec.createdAt).toLocaleString('th-TH')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Rule Conflict History if any */}
            {projectContext.ruleConflictHistory && projectContext.ruleConflictHistory.length > 0 && (
              <div className="p-4 rounded-xl bg-stone-900/50 border border-stone-800 space-y-2">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-400" />
                  <span>ประวัติการเปลี่ยนแปลงกฎและการแก้ไขความขัดแย้ง (Conflict Resolution History)</span>
                </h4>
                <div className="space-y-2">
                  {projectContext.ruleConflictHistory.map((rec) => (
                    <div key={rec.id} className="text-xs p-2.5 rounded-lg bg-stone-950/60 border border-stone-800/80 space-y-1">
                      <div className="flex items-center justify-between text-stone-400">
                        <span className="font-semibold text-stone-300">Rule ID: {rec.ruleId}</span>
                        <span>{new Date(rec.timestamp).toLocaleTimeString('th-TH')}</span>
                      </div>
                      <div className="text-stone-400">
                        <span className="line-through text-rose-400/80 mr-2">{rec.previous}</span>
                        <ArrowRight className="inline w-3 h-3 text-stone-500 mr-2" />
                        <span className="text-emerald-400 font-medium">{rec.current}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RULES TAB */}
        {activeTab === 'rules' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <span>Project Rules (กฎเหล็กประจำโปรเจกต์)</span>
                </h3>
                <p className="text-xs text-stone-400">
                  สลับเปิด-ปิดกฎที่ Agent ต้องปฏิบัติตามอย่างเคร่งครัดในทุกขั้นตอนการเขียนโค้ด
                </p>
              </div>
            </div>

            {/* Add Rule Form */}
            <form onSubmit={handleAddRule} className="flex gap-2">
              <input
                type="text"
                value={newRuleText}
                onChange={(e) => setNewRuleText(e.target.value)}
                placeholder="เพิ่มกฎใหม่ เช่น ใช้ฟอนต์ Prompt และสี Dark Palette"
                className="flex-1 px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มกฎ</span>
              </button>
            </form>

            {/* Rules List */}
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                    rule.active
                      ? 'bg-stone-900/90 border-stone-800'
                      : 'bg-stone-900/30 border-stone-800/40 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      className="text-amber-400 hover:text-amber-300 transition"
                    >
                      {rule.active ? (
                        <ToggleRight className="w-6 h-6 text-amber-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-stone-500" />
                      )}
                    </button>
                    <span className={`text-xs ${rule.active ? 'text-stone-200 font-medium' : 'text-stone-500 line-through'}`}>
                      {rule.text}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1 text-stone-500 hover:text-rose-400 rounded transition"
                    title="ลบกฎ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ISSUES TAB */}
        {activeTab === 'issues' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span>Known Issues & Debug Tracker</span>
                </h3>
                <p className="text-xs text-stone-400">
                  ติดตามข้อผิดพลาดและสิ่งที่ต้องตรวจสอบก่อนเปิดตัวโปรเจกต์
                </p>
              </div>
              <button
                onClick={() => setIsAddingIssue(!isAddingIssue)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่ม Issue</span>
              </button>
            </div>

            {isAddingIssue && (
              <form onSubmit={handleAddIssue} className="p-4 rounded-xl bg-stone-900 border border-amber-500/40 space-y-2">
                <input
                  type="text"
                  value={newIssueText}
                  onChange={(e) => setNewIssueText(e.target.value)}
                  placeholder="ระบุข้อผิดพลาดหรือจุดที่ต้องปรับปรุง"
                  className="w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  required
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingIssue(false)}
                    className="px-3 py-1.5 rounded-lg text-xs bg-stone-800 text-stone-400"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg text-xs bg-amber-500 font-semibold text-stone-950"
                  >
                    บันทึก
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {issuesList.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                    issue.status === 'active'
                      ? 'bg-stone-900/90 border-stone-800'
                      : 'bg-stone-900/30 border-stone-800/40 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleIssue(issue.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                        issue.status === 'resolved'
                          ? 'bg-emerald-500 border-emerald-500 text-stone-950'
                          : 'border-stone-600 hover:border-amber-400'
                      }`}
                    >
                      {issue.status === 'resolved' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <span className={`text-xs ${issue.status === 'resolved' ? 'text-stone-500 line-through' : 'text-stone-200'}`}>
                      {issue.text}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                      issue.status === 'active'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-stone-800 text-stone-500'
                    }`}
                  >
                    {issue.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KNOWLEDGE BASE TAB */}
        {activeTab === 'knowledge' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <span>Knowledge Base (คลังความรู้และเอกสารอ้างอิง)</span>
                </h3>
                <p className="text-xs text-stone-400">
                  Agent จะใช้เอกสารเหล่านี้ในการอ้างอิงโค้ดและปฏิบัติตามมาตรฐาน
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {knowledgeBase.map((k) => (
                <div key={k.id} className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">{k.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-stone-800 text-stone-400 border border-stone-700">
                      {k.source || 'Doc'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">{k.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
