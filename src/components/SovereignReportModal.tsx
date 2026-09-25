import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  Lock,
  Globe,
  Radio,
  ExternalLink,
  X,
  Layers,
  Sparkles,
  Terminal,
  FileCode,
  Table as TableIcon,
  CheckCircle2,
  AlertTriangle,
  Archive,
} from 'lucide-react';
import {
  SOVEREIGN_NODE_VERIFICATION_REPORT,
  generateMarkdownReport,
  generateJsonReport,
  generateCsvTable1,
  generateVerificationShellScript,
  generateYamlManifest,
} from '../data/sovereignNodeVerificationReport';
import { copyToClipboard } from '../utils/clipboard';
import { playAuditChime, playTone } from './AudioSynthesizer';

interface SovereignReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SovereignReportModal: React.FC<SovereignReportModalProps> = ({ isOpen, onClose }) => {
  const [activeFormat, setActiveFormat] = useState<'rich' | 'md' | 'json' | 'csv' | 'sh' | 'yaml'>('rich');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  const report = SOVEREIGN_NODE_VERIFICATION_REPORT;

  const markdownContent = generateMarkdownReport(report);
  const jsonContent = generateJsonReport(report);
  const csvContent = generateCsvTable1(report);
  const shContent = generateVerificationShellScript(report);
  const yamlContent = generateYamlManifest(report);

  const handleCopy = (formatName: string, text: string) => {
    copyToClipboard(text);
    setCopiedFormat(formatName);
    playAuditChime();
    setTimeout(() => setCopiedFormat(null), 2200);
  };

  const triggerDownload = (fileName: string, mimeType: string, content: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    playAuditChime();
    setDownloadSuccessMsg(`Saved: ${fileName}`);
    setTimeout(() => setDownloadSuccessMsg(null), 3000);
  };

  const handleDownloadAll = () => {
    // Sequentially download all formats
    playAuditChime();
    triggerDownload('ZYRQUEN_FROZEN_v1.2_LTS_Technical_Verification_Report.md', 'text/markdown;charset=utf-8;', markdownContent);
    setTimeout(() => {
      triggerDownload('zyrquen_frozen_v1.2_lts_verification_report.json', 'application/json;charset=utf-8;', jsonContent);
    }, 200);
    setTimeout(() => {
      triggerDownload('zyrquen_frozen_v1.2_lts_telemetry_table1.csv', 'text/csv;charset=utf-8;', csvContent);
    }, 400);
    setTimeout(() => {
      triggerDownload('verify_sovereign_node_v1.2_lts.sh', 'application/x-sh;charset=utf-8;', shContent);
    }, 600);
    setTimeout(() => {
      triggerDownload('sovereign_node_v1.2_lts_manifest.yaml', 'text/yaml;charset=utf-8;', yamlContent);
    }, 800);

    setDownloadSuccessMsg('Initiated download of all 5 format artifacts (.md, .json, .csv, .sh, .yaml)');
    setTimeout(() => setDownloadSuccessMsg(null), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-6xl max-h-[92vh] bg-[#070b14] border-cyan-500/40 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-slate-100"
        >
          {/* Header Bar */}
          <div className="p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold uppercase tracking-wider">
                  {report.classification}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold">
                  {report.status}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-black/50 text-zinc-400 border-white/10">
                  {report.date}
                </span>
              </div>

              <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>{report.title}</span>
              </h3>

              <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                <span>Author: <strong className="text-cyan-300">{report.author}</strong></span>
                <span>•</span>
                <span>Custodian: <strong className="text-amber-300">{report.custodian}</strong></span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDownloadAll}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
                title="Download all formats (.md, .json, .csv, .sh, .yaml)"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Download All Formats</span>
              </button>

              <button
                onClick={handlePrint}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10 transition-all cursor-pointer"
                title="Print or Save as PDF"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Download Toast Notification */}
          {downloadSuccessMsg && (
            <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-4 py-2 text-xs font-mono text-emerald-200 flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{downloadSuccessMsg}</span>
            </div>
          )}

          {/* Format Selector Bar */}
          <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-2.5 bg-black/40 border-b border-white/10 overflow-x-auto text-xs font-mono">
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => { setActiveFormat('rich'); playTone(540, 0.04); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-semibold ${
                  activeFormat === 'rich'
                    ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Executive Report</span>
              </button>

              <button
                onClick={() => { setActiveFormat('md'); playTone(580, 0.04); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-semibold ${
                  activeFormat === 'md'
                    ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-sky-400" />
                <span>Markdown (.MD)</span>
              </button>

              <button
                onClick={() => { setActiveFormat('json'); playTone(620, 0.04); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-semibold ${
                  activeFormat === 'json'
                    ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>JSON (.JSON)</span>
              </button>

              <button
                onClick={() => { setActiveFormat('csv'); playTone(660, 0.04); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-semibold ${
                  activeFormat === 'csv'
                    ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Table 1 CSV (.CSV)</span>
              </button>

              <button
                onClick={() => { setActiveFormat('sh'); playTone(700, 0.04); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-semibold ${
                  activeFormat === 'sh'
                    ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                <span>Shell CLI (.SH)</span>
              </button>

              <button
                onClick={() => { setActiveFormat('yaml'); playTone(740, 0.04); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-semibold ${
                  activeFormat === 'yaml'
                    ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>YAML Manifest (.YAML)</span>
              </button>
            </div>

            {/* Quick Copy / Download for Current Active Format */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  const contentMap = {
                    rich: markdownContent,
                    md: markdownContent,
                    json: jsonContent,
                    csv: csvContent,
                    sh: shContent,
                    yaml: yamlContent,
                  };
                  handleCopy(activeFormat, contentMap[activeFormat]);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10 transition-all font-mono text-xs cursor-pointer"
              >
                {copiedFormat === activeFormat ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-300 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-zinc-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  if (activeFormat === 'rich' || activeFormat === 'md') {
                    triggerDownload('ZYRQUEN_FROZEN_v1.2_LTS_Technical_Verification_Report.md', 'text/markdown;charset=utf-8;', markdownContent);
                  } else if (activeFormat === 'json') {
                    triggerDownload('zyrquen_frozen_v1.2_lts_verification_report.json', 'application/json;charset=utf-8;', jsonContent);
                  } else if (activeFormat === 'csv') {
                    triggerDownload('zyrquen_frozen_v1.2_lts_telemetry_table1.csv', 'text/csv;charset=utf-8;', csvContent);
                  } else if (activeFormat === 'sh') {
                    triggerDownload('verify_sovereign_node_v1.2_lts.sh', 'application/x-sh;charset=utf-8;', shContent);
                  } else if (activeFormat === 'yaml') {
                    triggerDownload('sovereign_node_v1.2_lts_manifest.yaml', 'text/yaml;charset=utf-8;', yamlContent);
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border-cyan-500/40 transition-all font-mono text-xs cursor-pointer font-bold"
              >
                <Download className="w-3 h-3 text-cyan-300" />
                <span>Download .{activeFormat === 'rich' ? 'md' : activeFormat}</span>
              </button>
            </div>
          </div>

          {/* Modal Main Content Body */}
          <div className="p-4 sm:p-7 overflow-y-auto flex-1 space-y-6">
            {/* 1. RICH FORMATTED EXECUTIVE REPORT VIEW */}
            {activeFormat === 'rich' && (
              <div className="space-y-6">
                {/* Executive Summary Callout */}
                <div className="p-5 rounded-2xl bg-cyan-950/30 border-cyan-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Executive Summary</span>
                  </div>
                  <p className="text-sm sm:text-base text-zinc-200 leading-relaxed font-sans">
                    {report.executiveSummary}
                  </p>
                </div>

                {/* 1. System Identity and Core Parameters */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white font-mono flex items-center gap-2 border-b border-white/10 pb-2">
                    <span className="text-cyan-400">1.</span> System Identity and Core Parameters
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-4 rounded-xl bg-black/40 border-white/10 space-y-1.5">
                      <div className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
                        Definition: ZYRQUEN FROZEN
                      </div>
                      <p className="text-zinc-200 leading-relaxed">
                        {report.systemIdentity.zyrquenFrozenDefinition}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-black/40 border-white/10 space-y-1.5">
                      <div className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
                        Definition: Sovereign Node
                      </div>
                      <p className="text-zinc-200 leading-relaxed">
                        {report.systemIdentity.sovereignNodeDefinition}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Table 1: System Core Parameters & Telemetry */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h5 className="text-base font-bold text-white font-mono flex items-center gap-2">
                      <TableIcon className="w-4 h-4 text-cyan-400" />
                      <span>Table 1: System Core Parameters & Telemetry</span>
                    </h5>
                    <span className="text-[11px] font-mono text-zinc-400">
                      12 Verified Sovereign Parameters
                    </span>
                  </div>

                  <div className="rounded-2xl border-white/10 overflow-hidden bg-black/40 shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-white/5 border-b border-white/10 text-zinc-300 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="p-3">ID</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Parameter & Thai Specification</th>
                            <th className="p-3">Specification Value</th>
                            <th className="p-3">Verified Telemetry Value</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3">Statutory Legal Reference</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-zinc-300">
                          {report.table1Parameters.map((param) => (
                            <tr key={param.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-3 font-bold text-cyan-400">{param.id}</td>
                              <td className="p-3 text-zinc-400">{param.category}</td>
                              <td className="p-3">
                                <div className="font-bold text-white">{param.parameter}</div>
                                <div className="text-[10px] text-zinc-400">{param.parameterTh}</div>
                              </td>
                              <td className="p-3 font-mono text-zinc-200">{param.specificationValue}</td>
                              <td className="p-3 font-mono text-cyan-300 font-bold">{param.verifiedTelemetryValue}</td>
                              <td className="p-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    param.status === 'LOCKED'
                                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                      : param.status === 'AIR-GAPPED'
                                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  }`}
                                >
                                  {param.status}
                                </span>
                              </td>
                              <td className="p-3 text-[11px] text-zinc-400">{param.statuteReference}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 2. 6-Node BFT Mesh Network Topology */}
                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-white font-mono flex items-center gap-2 border-b border-white/10 pb-2">
                    <span className="text-cyan-400">2.</span> 6-Node Byzantine Fault Tolerant (BFT) Mesh Topology
                  </h4>
                  <p className="text-xs text-zinc-300 font-mono">
                    Model: {report.bftMeshTopology.consensusModel} ({report.bftMeshTopology.byzantineTolerance})
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
                    {report.bftMeshTopology.nodes.map((node) => (
                      <div
                        key={node.id}
                        className={`p-3.5 rounded-xl border ${
                          node.role.includes('Leader')
                            ? 'bg-cyan-950/40 border-cyan-400 shadow-md'
                            : 'bg-black/40 border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <span>{node.id}</span>
                          <span className="text-emerald-400 font-bold">{node.parityStatus}</span>
                        </div>
                        <div className="text-sm font-bold text-white mt-1">{node.region}</div>
                        <div className="text-xs text-cyan-300 mt-0.5">{node.role}</div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5 text-[11px] text-zinc-400">
                          <span>Replication Lag: <strong className="text-white">{node.lagMs} ms</strong></span>
                          <span>Drift: <strong className="text-emerald-300">{node.driftDelta}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Security & Air-Gap Compliance */}
                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-white font-mono flex items-center gap-2 border-b border-white/10 pb-2">
                    <span className="text-cyan-400">3.</span> Air-Gapped Sovereign Security & Compliance Boundary
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-4 rounded-xl bg-black/40 border-white/10 space-y-2">
                      <div className="text-cyan-400 font-bold uppercase text-[10px]">
                        Post-Quantum & FIPS Cryptographic Standards
                      </div>
                      <ul className="space-y-1.5 text-zinc-300">
                        {report.securityAndAirGap.fipsCompliance.map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-black/40 border-white/10 space-y-2">
                      <div className="text-amber-400 font-bold uppercase text-[10px]">
                        Thai Sovereign Statutory Frameworks
                      </div>
                      <ul className="space-y-1.5 text-zinc-300">
                        {report.securityAndAirGap.thaiStatutes.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 4. References & Artifacts */}
                <div className="p-4 rounded-xl bg-white/5 border-white/10 space-y-2 text-xs font-mono">
                  <div className="text-zinc-400 font-bold uppercase text-[10px]">
                    Forensic References & Verification Artifacts
                  </div>
                  {report.references.map((r) => (
                    <div key={r.refId} className="flex items-center gap-2 text-zinc-300">
                      <span className="text-cyan-400 font-bold">{r.refId}</span>
                      <span>{r.title}:</span>
                      <code className="text-cyan-300 bg-black/50 px-1.5 py-0.5 rounded">{r.uriOrCitation}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. RAW CODE VIEWER FOR OTHER FORMATS (.MD, .JSON, .CSV, .SH, .YAML) */}
            {activeFormat !== 'rich' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pb-1">
                  <span>
                    Format: <strong className="text-cyan-300 uppercase">.{activeFormat}</strong>
                  </span>
                  <span>Ready for offline execution / ingestion</span>
                </div>

                <div className="relative rounded-2xl bg-black/80 border-white/10 p-4 font-mono text-xs text-zinc-200 overflow-x-auto max-h-[60vh] select-text">
                  <pre className="whitespace-pre">
                    {activeFormat === 'md' && markdownContent}
                    {activeFormat === 'json' && jsonContent}
                    {activeFormat === 'csv' && csvContent}
                    {activeFormat === 'sh' && shContent}
                    {activeFormat === 'yaml' && yamlContent}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-4 border-t border-white/10 bg-black/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Certified by Manus AI on 2026-05-13</span>
              <span>•</span>
              <span>Custodian: YUTTAPHUM PHAKPHIAN EP-SOVEREIGN-01</span>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-all cursor-pointer text-center"
            >
              Close Viewer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
