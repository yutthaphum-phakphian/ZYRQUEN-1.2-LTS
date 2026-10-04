import React from 'react';
import { 
  FolderCode, 
  Play, 
  Sparkles, 
  Brain, 
  Bot,
  ChevronRight,
  ChevronLeft,
  Scan,
  PackageCheck,
  Users,
  Layers3,
  PlugZap,
  BookOpen,
  Activity,
  Network
} from 'lucide-react';
import { 
  CodeFile, 
  ProjectContext, 
  AgentPlan, 
  AgentStep, 
  FileChangeDiff, 
  AgentActivityLog, 
  ValidationResult,
  TestReport,
  ToolResult,
  AgentRuntimeState
} from '../types';
import { CodeWorkspace } from './CodeWorkspace';
import { LiveSandbox } from './LiveSandbox';
import { PromptStudio } from './PromptStudio';
import { ProjectMemoryView } from './ProjectMemoryView';
import { AgentExecutionView } from './AgentExecutionView';
import { ReleasePanel } from './ReleasePanel';
import { TeamPanel } from './TeamPanel';
import { MissionControlPanel } from './MissionControlPanel';
import { IntegrationHubPanel } from './IntegrationHubPanel';
import { ResearchPanel } from './ResearchPanel';
import { ProductionControlPanel } from './ProductionControlPanel';
import { InfrastructurePanel } from './InfrastructurePanel';
import { SelfContainedRuntimePanel } from './SelfContainedRuntimePanel';
import { AutonomousMissionPanel } from './AutonomousMissionPanel';
import { Mission } from '../tools/autonomousMissionEngine';
import { InternalToolName } from '../tools/selfContainedRuntime';
import { ReleaseRun, ReleaseSnapshot, TeamRunRecord, UniversalRun, IntegrationHubState, IntegrationDiscoveryResult, ResearchTask, ProductionExecutionResult, ExecutionMode, V16InfrastructureReport } from '../types';

export type RightTabType = 'agent' | 'workspace' | 'sandbox' | 'prompt' | 'memory' | 'release' | 'team' | 'mission' | 'integration' | 'research' | 'production' | 'infrastructure' | 'runtime' | 'autonomous';

interface WorkspaceTabsProps {
  activeTab: RightTabType;
  onChangeTab: (tab: RightTabType) => void;
  projectContext: ProjectContext;
  onUpdateFile: (file: CodeFile) => void;
  onDeleteFile: (filename: string) => void;
  onAddFile: (file: CodeFile) => void;
  onUpdateContext: (updated: Partial<ProjectContext>) => void;
  onResetContext: () => void;
  onInjectPromptToChat: (prompt: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  // Agent props
  agentPlan?: AgentPlan;
  agentSteps?: AgentStep[];
  agentDiffs?: FileChangeDiff[];
  agentLogs?: AgentActivityLog[];
  agentValidation?: ValidationResult;
  testReport?: TestReport;
  runtimeState?: AgentRuntimeState;
  onApplyDiffs: (diffs: FileChangeDiff[]) => void;
  onRejectDiffs: () => void;
  onStartAgentExecution: () => void;
  onPauseAgentExecution: () => void;
  onResumeAgentExecution?: () => void;
  onCancelAgentExecution?: () => void;
  onCreateSnapshot?: () => void;
  onRestoreSnapshot?: () => void;
  onTriggerBrowserQA?: () => void;
  toolResults?: ToolResult[];
  isAgentExecuting?: boolean;
  releaseRun?: ReleaseRun | null;
  releaseSnapshots?: ReleaseSnapshot[];
  onPrepareRelease?: () => void;
  onCancelRelease?: () => void;
  onExportRelease?: () => void;
  onRollbackRelease?: (snapshotId?: string) => void;
  teamRecord?: TeamRunRecord | null;
  onStartTeam?: () => void;
  onPauseTeam?: () => void;
  onResumeTeam?: () => void;
  onCancelTeam?: () => void;
  universalRun?: UniversalRun | null;
  onStartMission?: () => void;
  onCancelMission?: () => void;
  onReplayMission?: () => void;
  integrationHubState?: IntegrationHubState;
  integrationDiscovery?: IntegrationDiscoveryResult;
  onRefreshIntegrationHub?: () => void;
  onDiscoverIntegration?: (query: string) => void;
  onSeedIntegrationSamples?: () => void;
  onTestIntegrationConnection?: (integrationId: string) => void;
  researchTask?: ResearchTask | null;
  onStartResearch?: (objective: string, depth: 'QUICK' | 'DEEP') => void;
  onCancelResearch?: () => void;
  onRefreshResearch?: () => void;
  productionResult?: ProductionExecutionResult | null;
  onRunProduction?: (objective: string, mode: ExecutionMode) => void;
  onCancelProduction?: () => void;
  infrastructureReport?: V16InfrastructureReport;
  onRefreshInfrastructure?: () => void;
  selfContainedState?: any;
  onRuntimeTool?: (tool: InternalToolName, input: Record<string, unknown>) => void;
  autonomousMission?: Mission;
  onStartAutonomous?: (objective: string) => void;
  onPauseAutonomous?: () => void;
  onResumeAutonomous?: () => void;
  onCancelAutonomous?: () => void;
  onApproveAutonomous?: (taskId: string, approved: boolean) => void;
  onStepAutonomous?: () => void;
  onProvideAutonomousInputs?: (taskId: string, inputs: Record<string, unknown>) => void;
}

export const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({
  activeTab,
  onChangeTab,
  projectContext,
  onUpdateFile,
  onDeleteFile,
  onAddFile,
  onUpdateContext,
  onResetContext,
  onInjectPromptToChat,
  isCollapsed,
  onToggleCollapse,
  agentPlan,
  agentSteps,
  agentDiffs,
  agentLogs,
  agentValidation,
  testReport,
  runtimeState = 'IDLE',
  onApplyDiffs,
  onRejectDiffs,
  onStartAgentExecution,
  onPauseAgentExecution,
  onResumeAgentExecution,
  onCancelAgentExecution,
  onCreateSnapshot,
  onRestoreSnapshot,
  onTriggerBrowserQA,
  toolResults = [],
  isAgentExecuting = false,
  releaseRun = null,
  releaseSnapshots = [],
  onPrepareRelease = () => undefined,
  onCancelRelease = () => undefined,
  onExportRelease = () => undefined,
  onRollbackRelease = () => undefined,
  teamRecord = null,
  onStartTeam = () => undefined,
  onPauseTeam = () => undefined,
  onResumeTeam = () => undefined,
  onCancelTeam = () => undefined,
  universalRun = null,
  onStartMission = () => undefined,
  onCancelMission = () => undefined,
  onReplayMission = () => undefined,
  integrationHubState,
  integrationDiscovery,
  onRefreshIntegrationHub = () => undefined,
  onDiscoverIntegration = () => undefined,
  onSeedIntegrationSamples = () => undefined,
  onTestIntegrationConnection = () => undefined,
  researchTask = null,
  onStartResearch = () => undefined,
  onCancelResearch = () => undefined,
  onRefreshResearch = () => undefined,
  productionResult = null,
  onRunProduction = () => undefined,
  onCancelProduction = () => undefined,
  infrastructureReport,
  onRefreshInfrastructure = () => undefined,
  selfContainedState,
  onRuntimeTool = () => undefined,
  autonomousMission,
  onStartAutonomous = () => undefined,
  onPauseAutonomous = () => undefined,
  onResumeAutonomous = () => undefined,
  onCancelAutonomous = () => undefined,
  onApproveAutonomous = () => undefined,
  onStepAutonomous = () => undefined,
  onProvideAutonomousInputs = () => undefined,
}) => {
  if (isCollapsed) {
    return (
      <div className="w-12 border-l border-stone-800 bg-stone-950 flex flex-col items-center py-4 space-y-3">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
          title="เปิดแผง Workspace"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="w-full h-px bg-stone-800 my-1" />

        <button
          onClick={() => {
            onChangeTab('agent');
            onToggleCollapse();
          }}
          className={`p-2 rounded-lg transition cursor-pointer ${
            activeTab === 'agent' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-500 hover:text-stone-300'
          }`}
          title="Agent Mode"
        >
          <Bot className="w-4 h-4 text-amber-400" />
        </button>

        <button
          onClick={() => {
            onChangeTab('sandbox');
            onToggleCollapse();
          }}
          className={`p-2 rounded-lg transition cursor-pointer ${
            activeTab === 'sandbox' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-500 hover:text-stone-300'
          }`}
          title="Live Sandbox"
        >
          <Play className="w-4 h-4 text-emerald-400" />
        </button>

        <button
          onClick={() => {
            onChangeTab('workspace');
            onToggleCollapse();
          }}
          className={`p-2 rounded-lg transition cursor-pointer ${
            activeTab === 'workspace' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-500 hover:text-stone-300'
          }`}
          title="Files Code Workspace"
        >
          <FolderCode className="w-4 h-4 text-blue-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-stone-950 border-l border-stone-800 min-h-0 overflow-hidden">
      {/* Workspace Header Tabs */}
      <div className="p-2.5 sm:p-3 border-b border-stone-800 bg-stone-900/90 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => onChangeTab('agent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'agent'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-amber-400" />
            <span>Agent Pipeline</span>
          </button>

          <button
            onClick={() => onChangeTab('sandbox')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'sandbox'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Sandbox</span>
          </button>

          <button
            onClick={() => onChangeTab('workspace')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'workspace'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <FolderCode className="w-3.5 h-3.5 text-blue-400" />
            <span>Files ({projectContext.files.length})</span>
          </button>

          <button
            onClick={() => onChangeTab('memory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'memory'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            <span>Memory Brain</span>
          </button>

          <button
            onClick={() => onChangeTab('release')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'release'
                ? 'bg-indigo-500 text-white font-bold shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5 text-indigo-300" />
            <span>Release V10</span>
          </button>

          <button
            onClick={() => onChangeTab('team')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'team' ? 'bg-cyan-500 text-stone-950 font-bold shadow-sm' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-cyan-300" />
            <span>Team V11</span>
          </button>

          <button
            onClick={() => onChangeTab('mission')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${activeTab === 'mission' ? 'bg-violet-500 text-white font-bold shadow-sm' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'}`}
          >
            <Layers3 className="w-3.5 h-3.5 text-violet-300" />
            <span>Mission V12</span>
          </button>

          <button
            onClick={() => onChangeTab('integration')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${activeTab === 'integration' ? 'bg-teal-500 text-stone-950 font-bold shadow-sm' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'}`}
          >
            <PlugZap className="w-3.5 h-3.5 text-teal-300" />
            <span>Hub V13</span>
          </button>

          <button
            onClick={() => onChangeTab('research')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${activeTab === 'research' ? 'bg-amber-500 text-stone-950 font-bold shadow-sm' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'}`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-300" />
            <span>Research V14</span>
          </button>

          <button
            onClick={() => onChangeTab('production')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${activeTab === 'production' ? 'bg-rose-500 text-white font-bold shadow-sm' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'}`}
          >
            <Activity className="w-3.5 h-3.5 text-rose-300" />
            <span>Control V15</span>
          </button>
          <button
            onClick={() => onChangeTab('infrastructure')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${activeTab === 'infrastructure' ? 'bg-cyan-500 text-stone-950 font-bold shadow-sm' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'}`}
          >
            <Network className="w-3.5 h-3.5 text-cyan-300" />
            <span>Infra V16</span>
          </button>
          <button
            onClick={() => onChangeTab('runtime')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${activeTab === 'runtime' ? 'bg-violet-500 text-white font-bold shadow-sm' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'}`}
          >
            <Brain className="w-3.5 h-3.5 text-violet-300" />
            <span>Runtime V17</span>
          </button>
          <button
            onClick={() => onChangeTab('autonomous')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${activeTab === 'autonomous' ? 'bg-fuchsia-500 text-white font-bold shadow-sm' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'}`}
          >
            <Brain className="w-3.5 h-3.5 text-fuchsia-300" />
            <span>Mission V18</span>
          </button>

          <button
            onClick={() => onChangeTab('prompt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'prompt'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Prompt Studio</span>
          </button>
        </div>

        {/* Collapse toggle button */}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer ml-2"
          title="ยุบแผง Workspace"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {activeTab === 'agent' && (
          <AgentExecutionView
            plan={agentPlan}
            steps={agentSteps}
            diffs={agentDiffs}
            activityLogs={agentLogs}
            validation={agentValidation}
            testReport={testReport}
            projectContext={projectContext}
            runtimeState={runtimeState}
            onApplyDiffs={onApplyDiffs}
            onRejectDiffs={onRejectDiffs}
            onStartExecution={onStartAgentExecution}
            onPauseExecution={onPauseAgentExecution}
            onResumeExecution={onResumeAgentExecution}
            onCancelExecution={onCancelAgentExecution}
            onCreateSnapshot={onCreateSnapshot}
            onRestoreSnapshot={onRestoreSnapshot}
            onTriggerBrowserQA={onTriggerBrowserQA}
            toolResults={toolResults}
            onOpenSandbox={() => onChangeTab('sandbox')}
            isExecuting={isAgentExecuting}
          />
        )}

        {activeTab === 'workspace' && (
          <CodeWorkspace
            projectContext={projectContext}
            onUpdateFile={onUpdateFile}
            onDeleteFile={onDeleteFile}
            onAddFile={onAddFile}
            onOpenInSandbox={() => onChangeTab('sandbox')}
          />
        )}

        {activeTab === 'sandbox' && (
          <LiveSandbox 
            projectContext={projectContext}
            onAutoFixError={(errMsg) => onInjectPromptToChat(`ช่วยแก้ไขข้อผิดพลาดใน Sandbox:\n\n${errMsg}`)}
            onRunBrowserQATest={onTriggerBrowserQA}
          />
        )}

        {activeTab === 'prompt' && (
          <PromptStudio onInjectPromptToChat={onInjectPromptToChat} />
        )}

        {activeTab === 'memory' && (
          <ProjectMemoryView
            projectContext={projectContext}
            onUpdateContext={onUpdateContext}
            onResetContext={onResetContext}
          />
        )}

        {activeTab === 'release' && (
          <ReleasePanel
            projectContext={projectContext}
            run={releaseRun}
            snapshots={releaseSnapshots}
            onPrepare={onPrepareRelease}
            onCancel={onCancelRelease}
            onExport={onExportRelease}
            onRollback={onRollbackRelease}
          />
        )}

        {activeTab === 'team' && (
          <TeamPanel
            projectContext={projectContext}
            record={teamRecord}
            onStart={onStartTeam}
            onPause={onPauseTeam}
            onResume={onResumeTeam}
            onCancel={onCancelTeam}
          />
        )}

        {activeTab === 'mission' && (
          <MissionControlPanel
            projectContext={projectContext}
            run={universalRun}
            onStart={onStartMission}
            onCancel={onCancelMission}
            onReplay={onReplayMission}
          />
        )}

        {activeTab === 'integration' && integrationHubState && (
          <IntegrationHubPanel
            state={integrationHubState}
            discovery={integrationDiscovery?.query || ''}
            onRefresh={onRefreshIntegrationHub}
            onDiscover={onDiscoverIntegration}
            onSeedSamples={onSeedIntegrationSamples}
            onTestConnection={onTestIntegrationConnection}
          />
        )}

        {activeTab === 'research' && (
          <ResearchPanel
            task={researchTask || null}
            onStart={onStartResearch}
            onCancel={onCancelResearch}
            onRefresh={onRefreshResearch}
          />
        )}

        {activeTab === 'production' && (
          <ProductionControlPanel result={productionResult || null} onRun={onRunProduction} onCancel={onCancelProduction} />
        )}
        {activeTab === 'infrastructure' && infrastructureReport && (
          <InfrastructurePanel report={infrastructureReport} onRefresh={onRefreshInfrastructure} />
        )}
        {activeTab === 'runtime' && (
          <SelfContainedRuntimePanel state={selfContainedState} onTool={onRuntimeTool} />
        )}
        {activeTab === 'autonomous' && (
          <AutonomousMissionPanel mission={autonomousMission} onStart={onStartAutonomous} onPause={onPauseAutonomous} onResume={onResumeAutonomous} onCancel={onCancelAutonomous} onApprove={onApproveAutonomous} onStep={onStepAutonomous} onProvideInputs={onProvideAutonomousInputs} />
        )}
      </div>
    </div>
  );
};
