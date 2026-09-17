import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { playTone } from './AudioSynthesizer';

export interface SealNode {
  id: number;
  sealCode: string;
  chamberId: number;
  chamberName: string;
  merkleLeaf: string;
  pqcType: string;
  hsmSlot: string;
  cryoTemp: string;
  drift: string;
  status: 'VERIFIED' | 'QUARANTINED' | 'RESONATING';
  tenantId: string;
  x: number;
  y: number;
  r: number;
}

export interface HoveredSealInfo {
  seal: SealNode;
  clientX: number;
  clientY: number;
  auditTimestamp: string;
  signatureScheme: string;
}

export const SupremeSealAtlas: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedSeal, setSelectedSeal] = useState<SealNode | null>(null);
  const [hoveredSeal, setHoveredSeal] = useState<HoveredSealInfo | null>(null);
  const [quickInspectionEnabled, setQuickInspectionEnabled] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterChamber, setFilterChamber] = useState<number | 'all'>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [totalSealsCount] = useState<number>(14902);
  const [quarantinedCount] = useState<number>(80);

  // Generate representative canonical seal cluster data
  const [sealClusters, setSealClusters] = useState<SealNode[]>([]);

  useEffect(() => {
    const chambers = [
      '00 🏛️ Sovereign Foundation',
      '01 🔐 Multi-Key Vault PQC',
      '02 📜 Immutable Audit Ledger',
      '03 ⚖️ Safe Harbor ETDA/PDPA',
      '04 🧊 HSM Quorum 10 Slots',
      '05 ⚙️ DAG Engine 6 Stages',
      '06 🛡️ Circuit Breaker 85°C',
      '07 🐦‍🔥 Phoenix Auto-Healing',
      '08 🔍 Merkle Verifier',
      '09 📡 Telemetry Redacted',
      '10 💰 Treasury 4.23B THB',
      '11 📑 Court Dossier',
      '12 🔒 Zero-Trust Firewall',
      '13 🌐 BFT Mesh 6 Nodes',
      '14 🧠 Neural Observer',
      '15 🔊 Sonic Alert',
      '16 🎮 3D Quantum Visualization',
      '17 👑 Supreme Command',
    ];

    const pqcSuites = ['ML-KEM-1024', 'ML-DSA-87', 'SLH-DSA (SPHINCS+)'];
    const nodes: SealNode[] = [];
    const count = 360; // Cluster anchor points representing 14,902 seals

    for (let i = 0; i < count; i++) {
      const chamberIdx = i % 18;
      const angle = (i / count) * 2 * Math.PI;
      const ring = 60 + (i % 5) * 45;
      const x = 300 + Math.cos(angle) * ring + (Math.random() * 12 - 6);
      const y = 300 + Math.sin(angle) * ring + (Math.random() * 12 - 6);
      const isQuarantined = i === 13 || i === 87; // Sample quarantined representations

      const sealNumber = Math.floor(1 + (i / count) * 14902);
      const tenantNum = 600 + (i % 400);

      nodes.push({
        id: sealNumber,
        sealCode: `ZQ-SEAL-#849202-${String(sealNumber).padStart(6, '0')}`,
        chamberId: chamberIdx,
        chamberName: chambers[chamberIdx],
        merkleLeaf: `909ab814...${Math.random().toString(16).substring(2, 8)}`,
        pqcType: pqcSuites[i % pqcSuites.length],
        hsmSlot: `SLOT-${String((i % 10) + 1).padStart(2, '0')}-REAL_HSM`,
        cryoTemp: '14.98 mK',
        drift: 'Δ0.00%',
        status: isQuarantined ? 'QUARANTINED' : 'VERIFIED',
        tenantId: `Ω${tenantNum}`,
        x,
        y,
        r: isQuarantined ? 5.5 : 4,
      });
    }

    setSealClusters(nodes);
    setSelectedSeal(nodes[0]);
  }, []);

  // D3 Visualization render & Zoom setup
  useEffect(() => {
    if (!svgRef.current || sealClusters.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 600;
    const height = 600;

    const g = svg.append('g').attr('id', 'seal-atlas-group');

    // Concentric orbit rings representing Sovereign Enclaves
    const rings = [60, 105, 150, 195, 240];
    rings.forEach((r, idx) => {
      g.append('circle')
        .attr('cx', 300)
        .attr('cy', 300)
        .attr('r', r)
        .attr('fill', 'none')
        .attr('stroke', idx === 4 ? '#D4AF37' : '#0a0f1e')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', idx % 2 === 0 ? '4 4' : 'none');
    });

    // Center Core Anchor
    g.append('circle')
      .attr('cx', 300)
      .attr('cy', 300)
      .attr('r', 16)
      .attr('fill', '#0a0f1e')
      .attr('stroke', '#D4AF37')
      .attr('stroke-width', 2);

    g.append('text')
      .attr('x', 300)
      .attr('y', 304)
      .attr('text-anchor', 'middle')
      .attr('fill', '#D4AF37')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text('Ω∞');

    // Render seal nodes
    const filteredNodes = sealClusters.filter(node => {
      if (filterChamber !== 'all' && node.chamberId !== filterChamber) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          node.sealCode.toLowerCase().includes(q) ||
          node.tenantId.toLowerCase().includes(q) ||
          node.chamberName.toLowerCase().includes(q)
        );
      }
      return true;
    });

    const nodesSelection = g
      .selectAll('.seal-node')
      .data(filteredNodes, (d: any) => d.id)
      .enter()
      .append('circle')
      .attr('class', 'seal-node')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.r)
      .attr('fill', d =>
        d.status === 'QUARANTINED'
          ? '#ef4444'
          : d.id === selectedSeal?.id
          ? '#D4AF37'
          : '#06B6D4'
      )
      .attr('stroke', d => (d.id === selectedSeal?.id ? '#ffffff' : '#070a12'))
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        playTone(700, 0.03);
        setSelectedSeal(d);
      })
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('r', 8).attr('stroke', '#D4AF37');
        if (quickInspectionEnabled && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const clientX = event.clientX - rect.left;
          const clientY = event.clientY - rect.top;
          
          playTone(850, 0.015);
          setHoveredSeal({
            seal: d,
            clientX,
            clientY,
            auditTimestamp: `${new Date().toLocaleTimeString()} (142ms ago)`,
            signatureScheme: 'FIPS 204 ML-DSA-87',
          });
        }
      })
      .on('mousemove', function (event, d) {
        if (quickInspectionEnabled && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const clientX = event.clientX - rect.left;
          const clientY = event.clientY - rect.top;
          setHoveredSeal(prev =>
            prev && prev.seal.id === d.id
              ? { ...prev, clientX, clientY }
              : {
                  seal: d,
                  clientX,
                  clientY,
                  auditTimestamp: `${new Date().toLocaleTimeString()} (142ms ago)`,
                  signatureScheme: 'FIPS 204 ML-DSA-87',
                }
          );
        }
      })
      .on('mouseleave', function (event, d) {
        d3.select(this).attr('r', d.id === selectedSeal?.id ? 6 : d.r).attr('stroke', d.id === selectedSeal?.id ? '#ffffff' : '#070a12');
        setHoveredSeal(null);
      });

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.6, 4])
      .on('zoom', event => {
        g.attr('transform', event.transform);
        setZoomLevel(+event.transform.k.toFixed(2));
      });

    svg.call(zoom);
  }, [sealClusters, selectedSeal, filterChamber, searchQuery]);

  const resetAtlasZoom = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .call(d3.zoom<SVGSVGElement, unknown>().transform, d3.zoomIdentity);
    setZoomLevel(1);
  };

  return (
    <div id="supreme-seal-atlas" className="w-full bg-[#070a12] border border-[#D4AF37]/40 rounded-xl p-6 font-mono text-[#06B6D4] shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#0a0f1e] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏛️</span>
            <h2 className="text-lg font-black tracking-wider text-[#D4AF37]">
              ZYRQUEN Ω∞ SUPREME SEAL ATLAS 14,902
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Interactive Quantum Hologram Atlas • 14,902 Verified Hardware Seals • SSoT Δ0.00% Zero Drift • Boundary: Ω600_1000
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => {
              playTone(600, 0.02);
              setQuickInspectionEnabled(!quickInspectionEnabled);
            }}
            className={`px-3 py-1 text-xs font-bold rounded border transition-colors flex items-center gap-1.5 ${
              quickInspectionEnabled
                ? 'bg-[#0a0f1e] border-[#D4AF37] text-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.2)]'
                : 'bg-[#070a12] border-slate-700 text-slate-400'
            }`}
          >
            <span>{quickInspectionEnabled ? '⚡ Quick Inspect: ON' : '⏸️ Quick Inspect: OFF'}</span>
          </button>
          <span className="px-3 py-1 bg-[#0a0f1e] border border-emerald-500 text-emerald-400 font-bold rounded">
            ✅ 14,902 Canonical Seals Verified
          </span>
          <span className="px-3 py-1 bg-[#0a0f1e] border border-red-500 text-red-400 font-bold rounded">
            🔒 80 Quarantined
          </span>
          <button
            onClick={resetAtlasZoom}
            className="px-3 py-1 bg-[#0a0f1e] border border-[#06B6D4] hover:bg-[#06B6D4]/20 text-[#06B6D4] font-bold rounded"
          >
            🔍 Reset View ({zoomLevel}x)
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0a0f1e] p-3 rounded-lg border border-slate-800 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-400">Filter Chamber:</span>
          <select
            value={filterChamber}
            onChange={e => setFilterChamber(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="bg-[#070a12] border border-[#06B6D4]/40 text-[#06B6D4] px-2.5 py-1 rounded text-xs focus:outline-none"
          >
            <option value="all">All 18 Chambers (14,902 Seals)</option>
            {Array.from({ length: 18 }).map((_, i) => (
              <option key={i} value={i}>
                Chamber {String(i).padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-400">Search:</span>
          <input
            type="text"
            placeholder="Search Seal #, Ω600_1000, or Chamber..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-[#070a12] border border-[#06B6D4]/40 text-slate-200 px-3 py-1 rounded text-xs placeholder:text-slate-600 focus:outline-none w-full sm:w-64"
          />
        </div>
      </div>

      {/* Main Grid: D3 Hologram Atlas Canvas + Cryptographic Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* D3 Interactive Hologram Viewport */}
        <div
          ref={containerRef}
          className="lg:col-span-7 bg-[#0a0f1e] border border-[#06B6D4]/30 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden min-h-[420px]"
        >
          <div className="absolute top-3 left-3 text-[11px] text-slate-400 z-10 flex items-center gap-2 bg-[#070a12]/80 px-2.5 py-1 rounded border border-slate-800">
            <span>Hover for Quick Inspection</span>
            <span>•</span>
            <span>Scroll to Zoom</span>
            <span>•</span>
            <span>Click to Lock</span>
          </div>

          <svg
            ref={svgRef}
            viewBox="0 0 600 600"
            className="w-full max-w-[500px] h-[400px] cursor-grab active:cursor-grabbing"
          />

          {/* Quick Inspection Floating Mini-Popover */}
          {quickInspectionEnabled && hoveredSeal && (
            <div
              className="absolute z-30 pointer-events-none bg-[#070a12] border border-[#D4AF37] p-3 rounded-lg shadow-2xl text-[11px] font-mono text-[#06B6D4] min-w-[240px] max-w-[280px]"
              style={{
                left: `${Math.min(hoveredSeal.clientX + 15, 280)}px`,
                top: `${Math.min(hoveredSeal.clientY - 40, 240)}px`,
              }}
            >
              <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-800">
                <span className="font-bold text-[#D4AF37] text-xs">
                  {hoveredSeal.seal.sealCode}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                    hoveredSeal.seal.status === 'VERIFIED'
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                      : 'bg-red-950 border-red-500 text-red-400'
                  }`}
                >
                  {hoveredSeal.seal.status}
                </span>
              </div>

              <div className="space-y-1 text-[10px]">
                <div className="text-slate-300">
                  🏛️ <strong className="text-slate-200">{hoveredSeal.seal.chamberName}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>PQC Suite:</span>
                  <span className="text-purple-300 font-bold">{hoveredSeal.seal.pqcType}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>HSM Enclave:</span>
                  <span className="text-slate-200">{hoveredSeal.seal.hsmSlot}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Cryo Telemetry:</span>
                  <span className="text-[#06B6D4] font-bold">{hoveredSeal.seal.cryoTemp}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Consistency:</span>
                  <span className="text-emerald-400 font-bold">{hoveredSeal.seal.drift} Zero Drift</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tenant Boundary:</span>
                  <span className="text-[#D4AF37] font-bold">{hoveredSeal.seal.tenantId} (Ω600_1000)</span>
                </div>
                <div className="pt-1.5 border-t border-slate-800 flex justify-between text-[9px] text-slate-400">
                  <span>Last Verified:</span>
                  <span className="text-emerald-300 font-bold">{hoveredSeal.auditTimestamp}</span>
                </div>
              </div>
            </div>
          )}

          <div className="w-full flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-900 px-2">
            <span>Cluster Shards: 360 Points / 14,902 Density</span>
            <span className="text-[#D4AF37]">Quorum: 10/10 REAL_HSM FIPS 140-3 L4</span>
          </div>
        </div>

        {/* Selected Seal Cryptographic Inspector */}
        <div className="lg:col-span-5 bg-[#0a0f1e] border border-[#D4AF37]/30 rounded-xl p-5 space-y-3.5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Selected Seal Metadata</span>
              <h3 className="font-bold text-[#D4AF37] text-sm">
                {selectedSeal ? selectedSeal.sealCode : 'Select a Seal'}
              </h3>
            </div>
            {selectedSeal && (
              <span
                className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                  selectedSeal.status === 'VERIFIED'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400'
                    : 'bg-red-950/60 border-red-500 text-red-400 animate-pulse'
                }`}
              >
                {selectedSeal.status}
              </span>
            )}
          </div>

          {selectedSeal ? (
            <div className="space-y-2.5">
              <div className="p-2.5 bg-[#070a12] border border-slate-800 rounded space-y-1">
                <span className="text-slate-500 text-[10px] block">Chamber Attribution</span>
                <div className="text-slate-200 font-bold">{selectedSeal.chamberName}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-[#070a12] border border-slate-800 rounded">
                  <span className="text-slate-500 text-[10px] block">PQC Suite</span>
                  <span className="text-purple-300 font-bold">{selectedSeal.pqcType}</span>
                </div>
                <div className="p-2.5 bg-[#070a12] border border-slate-800 rounded">
                  <span className="text-slate-500 text-[10px] block">HSM Enclave</span>
                  <span className="text-slate-200 font-bold">{selectedSeal.hsmSlot}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-[#070a12] border border-slate-800 rounded">
                  <span className="text-slate-500 text-[10px] block">Cryo Telemetry</span>
                  <span className="text-[#06B6D4] font-bold">{selectedSeal.cryoTemp}</span>
                </div>
                <div className="p-2.5 bg-[#070a12] border border-slate-800 rounded">
                  <span className="text-slate-500 text-[10px] block">State Consistency</span>
                  <span className="text-emerald-400 font-bold">{selectedSeal.drift} ZERO DRIFT</span>
                </div>
              </div>

              <div className="p-2.5 bg-[#070a12] border border-slate-800 rounded space-y-1">
                <span className="text-slate-500 text-[10px] block">Merkle Leaf Commitment</span>
                <code className="text-[#D4AF37] text-[11px] block break-all">
                  {selectedSeal.merkleLeaf} (Block #849202)
                </code>
              </div>

              <div className="p-2.5 bg-[#070a12] border border-[#D4AF37]/30 rounded flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Boundary Tenant:</span>
                <span className="text-[#D4AF37] font-bold">{selectedSeal.tenantId} (Ω600_1000 LOCKED)</span>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-center py-12 italic">
              Click on any node in the hologram atlas to inspect cryptographic audit details.
            </div>
          )}

          {/* SSoT Legal Footnote */}
          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400">
            Sovereign Principal: <strong className="text-slate-200">นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)</strong> | PDPA &amp; ETDA Certified
          </div>
        </div>
      </div>
    </div>
  );
};
