import fs from 'fs';
let content = fs.readFileSync('src/components/views/SettingsView.tsx', 'utf-8');

const additionalComponent = `
import { fetchLatestCommit, GitHubCommitInfo } from '../../services/githubService';

export const GitHubDeploymentWidget: React.FC = () => {
  const [commitInfo, setCommitInfo] = React.useState<GitHubCommitInfo | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  const loadCommitData = async () => {
    setLoading(true);
    const data = await fetchLatestCommit();
    setCommitInfo(data);
    setLoading(false);
  };

  React.useEffect(() => {
    loadCommitData();
  }, []);

  return (
    <div className="mt-8 p-6 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-emerald-400">System Deployment State</h2>
          <p className="text-xs text-slate-400 font-mono">ZYRQUEN Ω∞ LOCKED_FROZEN_v1.2_LTS</p>
        </div>
        <button
          onClick={loadCommitData}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 transition text-slate-300 disabled:opacity-50"
        >
          <RefreshCw className={\`w-4 h-4 \${loading ? 'animate-spin text-emerald-400' : ''}\`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800/80">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-mono uppercase mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Genesis Verification</span>
          </div>
          <p className="text-sm font-semibold text-slate-200">Block #849202</p>
          <p className="text-xs text-slate-400 font-mono truncate mt-1">Root: 909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68</p>
          <span className="inline-block mt-3 px-2 py-0.5 text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
            14,902 Seals Verified (Δ0.00%)
          </span>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase mb-2">
            <div className="flex items-center space-x-2">
              <GitCommit className="w-4 h-4 text-cyan-400" />
              <span>Deployment Version</span>
            </div>
            {commitInfo && (
              <span className={\`text-[10px] px-1.5 py-0.5 rounded \${commitInfo.status === 'LIVE' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}\`}>
                {commitInfo.status}
              </span>
            )}
          </div>
          {loading ? (
            <div className="text-xs font-mono text-slate-500 animate-pulse">Querying GitHub API...</div>
          ) : commitInfo ? (
            <div className="space-y-1 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Commit Hash:</span>
                <a
                  href={commitInfo.commitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center space-x-1"
                >
                  <span>{commitInfo.shortHash}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-slate-300 truncate mt-1" title={commitInfo.message}>"{commitInfo.message}"</p>
              <p className="text-[11px] text-slate-500">{new Date(commitInfo.date).toLocaleString()}</p>
            </div>
          ) : (
            <div className="text-xs text-rose-400 font-mono">Failed to resolve version state.</div>
          )}
        </div>
      </div>
    </div>
  );
};
`;

if (!content.includes('System Deployment State')) {
    // Add import
    const newImports = "import { GitCommit, ShieldCheck, RefreshCw, ExternalLink } from 'lucide-react';\n";
    
    // Inject extra component before SettingsView
    content = content.replace('export const SettingsView: React.FC<SettingsViewProps> = ({', additionalComponent + '\nexport const SettingsView: React.FC<SettingsViewProps> = ({');
    content = newImports + content;

    // Inside SettingsView, append <GitHubDeploymentWidget /> to the end of the main return block.
    // Let's inject it right before the last closing div.
    const lastDivIndex = content.lastIndexOf('</div>');
    if (lastDivIndex !== -1) {
        content = content.substring(0, lastDivIndex) + '\n<GitHubDeploymentWidget />\n' + content.substring(lastDivIndex);
    }
    
    fs.writeFileSync('src/components/views/SettingsView.tsx', content);
}

