import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Activity, Orbit, RefreshCw, Sparkles, Zap, Shield, Maximize2 } from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';

interface QubitNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  cluster: number; // 0: Valerie, 1: Chronos, 2: Athena, 3: Entanglement Bridge
  coherence: number;
  phase: number;
  entropy: number;
  radius: number;
  color: string;
}

interface QubitLink extends d3.SimulationLinkDatum<QubitNode> {
  source: string | QubitNode;
  target: string | QubitNode;
  strength: number;
  type: 'entanglement' | 'coupler' | 'resonance';
}

export const QuantumEntropyGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<QubitNode | null>(null);
  const [entropyFlux, setEntropyFlux] = useState({
    vonNeumannEntropy: 0.042,
    shannonEntropy: 0.984,
    phaseJitterFs: 1.2,
    activeEntanglements: 48,
    coherenceStability: 99.98,
  });
  const [isSimulating, setIsSimulating] = useState(true);

  // Periodic subtle flux in entropy values
  useEffect(() => {
    const interval = setInterval(() => {
      setEntropyFlux((prev) => ({
        vonNeumannEntropy: +(0.04 + Math.random() * 0.008).toFixed(4),
        shannonEntropy: +(0.98 + Math.random() * 0.015).toFixed(3),
        phaseJitterFs: +(1.1 + Math.random() * 0.25).toFixed(2),
        activeEntanglements: 48 + Math.floor(Math.random() * 5 - 2),
        coherenceStability: +(99.96 + Math.random() * 0.03).toFixed(3),
      }));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Initialize D3 Force Directed Simulation
  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current || !svgRef.current) return;
      const width = containerRef.current.clientWidth || 700;
      const height = 480;

      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove(); // Clear previous render
      svg.attr('viewBox', `0 0 ${width} ${height}`);

      // Create defs for glowing node gradients and arrow markers
      const defs = svg.append('defs');

      // Glow filter
      const filter = defs.append('filter').attr('id', 'glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
      filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
      const feMerge = filter.append('feMerge');
      feMerge.append('feMergeNode').attr('in', 'coloredBlur');
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

      // Generate 32 Qubit Nodes
      const nodes: QubitNode[] = [];
      const clusters = [
        { name: 'Valerie Neural Cluster', color: '#8b5cf6', base: 0 },
        { name: 'Chronos Temporal Ring', color: '#06b6d4', base: 8 },
        { name: 'Athena Gatekeeper Core', color: '#10b981', base: 16 },
        { name: 'Subzero Entanglement Bus', color: '#f59e0b', base: 24 },
      ];

      clusters.forEach((c, cIdx) => {
        for (let i = 0; i < 8; i++) {
          const id = `Q${c.base + i}`;
          nodes.push({
            id,
            name: `${c.name} |ψ${i}⟩`,
            cluster: cIdx,
            coherence: +(99.85 + Math.random() * 0.14).toFixed(3),
            phase: +(Math.random() * 2 * Math.PI).toFixed(3),
            entropy: +(0.01 + Math.random() * 0.05).toFixed(3),
            radius: i === 0 ? 14 : 8 + Math.random() * 4,
            color: c.color,
            x: width / 2 + (cIdx === 0 ? -120 : cIdx === 1 ? 120 : cIdx === 2 ? 0 : 0) + (Math.random() * 60 - 30),
            y: height / 2 + (cIdx === 2 ? -100 : cIdx === 3 ? 100 : 0) + (Math.random() * 60 - 30),
          });
        }
      });

      // Generate Links
      const links: QubitLink[] = [];
      // Intra-cluster links
      for (let c = 0; c < 4; c++) {
        const base = c * 8;
        for (let i = 0; i < 7; i++) {
          links.push({
            source: `Q${base + i}`,
            target: `Q${base + i + 1}`,
            strength: 0.8,
            type: 'coupler',
          });
        }
        links.push({ source: `Q${base + 7}`, target: `Q${base}`, strength: 0.6, type: 'coupler' });
        // Central cluster lead connections
        for (let i = 1; i < 8; i++) {
          links.push({ source: `Q${base}`, target: `Q${base + i}`, strength: 0.5, type: 'resonance' });
        }
      }

      // Inter-cluster entanglement bridges
      links.push({ source: 'Q0', target: 'Q8', strength: 0.9, type: 'entanglement' });
      links.push({ source: 'Q8', target: 'Q16', strength: 0.9, type: 'entanglement' });
      links.push({ source: 'Q16', target: 'Q24', strength: 0.9, type: 'entanglement' });
      links.push({ source: 'Q24', target: 'Q0', strength: 0.9, type: 'entanglement' });
      links.push({ source: 'Q0', target: 'Q16', strength: 0.7, type: 'entanglement' });
      links.push({ source: 'Q8', target: 'Q24', strength: 0.7, type: 'entanglement' });

      // Background Grid lines in SVG
      const bgGroup = svg.append('g').attr('class', 'bg-grid').attr('opacity', 0.15);
      for (let x = 40; x < width; x += 40) {
        bgGroup.append('line').attr('x1', x).attr('y1', 0).attr('x2', x).attr('y2', height).attr('stroke', '#06b6d4').attr('stroke-width', 0.5);
      }
      for (let y = 40; y < height; y += 40) {
        bgGroup.append('line').attr('x1', 0).attr('y1', y).attr('x2', width).attr('y2', y).attr('stroke', '#06b6d4').attr('stroke-width', 0.5);
      }

      // Simulation Setup
      const simulation = d3
        .forceSimulation<QubitNode>(nodes)
        .force(
          'link',
          d3
            .forceLink<QubitNode, QubitLink>(links)
            .id((d) => d.id)
            .distance((d) => (d.type === 'entanglement' ? 90 : 45))
        )
        .force('charge', d3.forceManyBody().strength(-120))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide<QubitNode>().radius((d) => d.radius + 6));

      // Render Links
      const linkGroup = svg.append('g').attr('class', 'links');
      const link = linkGroup
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('stroke', (d) => (d.type === 'entanglement' ? '#ec4899' : d.type === 'resonance' ? '#8b5cf6' : '#06b6d4'))
        .attr('stroke-width', (d) => (d.type === 'entanglement' ? 1.8 : 1.0))
        .attr('stroke-opacity', (d) => (d.type === 'entanglement' ? 0.8 : 0.4))
        .attr('stroke-dasharray', (d) => (d.type === 'entanglement' ? '4,4' : 'none'));

      // Render Nodes
      const nodeGroup = svg.append('g').attr('class', 'nodes');
      const node = nodeGroup
        .selectAll('g')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'qubit-node cursor-pointer')
        .call(
          d3
            .drag<SVGGElement, QubitNode>()
            .on('start', (event, d) => {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
              playTone(400 + d.cluster * 80, 0.04);
            })
            .on('drag', (event, d) => {
              d.fx = event.x;
              d.fy = event.y;
            })
            .on('end', (event, d) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            })
        )
        .on('click', (event, d) => {
          playTone(550 + d.cluster * 100, 0.06);
          setSelectedNode(d);
        });

      // Outer ripple circle for cluster heads
      node
        .filter((d) => d.radius > 10)
        .append('circle')
        .attr('r', (d) => d.radius + 6)
        .attr('fill', 'none')
        .attr('stroke', (d) => d.color)
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.5)
        .attr('class', 'animate-pulse');

      // Main Node Circle
      node
        .append('circle')
        .attr('r', (d) => d.radius)
        .attr('fill', (d) => d.color)
        .attr('fill-opacity', 0.85)
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5)
        .attr('filter', 'url(#glow)');

      // Node text label
      node
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '.3em')
        .attr('fill', '#ffffff')
        .attr('font-size', (d) => (d.radius > 10 ? '9px' : '7px'))
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('pointer-events', 'none')
        .text((d) => d.id);

      // Simulation tick handler
      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        node.attr('transform', (d) => `translate(${d.x},${d.y})`);
      });

      return simulation;
    };

    let activeSim: any = null;
    let resizeRafId: number | null = null;
    const observer = new ResizeObserver(() => {
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }
      resizeRafId = requestAnimationFrame(() => {
        if (activeSim) activeSim.stop();
        activeSim = updateDimensions();
      });
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    activeSim = updateDimensions();

    return () => {
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }
      observer.disconnect();
      if (activeSim) activeSim.stop();
    };
  }, []);

  const triggerResonancePulse = () => {
    playAuditChime();
    setEntropyFlux((prev) => ({
      ...prev,
      vonNeumannEntropy: 0.021,
      shannonEntropy: 0.999,
      coherenceStability: 100.0,
      activeEntanglements: 52,
    }));
  };

  return (
    <div className="space-y-4 font-mono select-text">
      {/* Top Controls Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#100d24]/90 via-[#0b0e1a]/85 to-[#07080F] border-violet-500/30 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border-violet-500/30 flex items-center justify-center text-violet-300 shrink-0 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            <Orbit className="w-5 h-5 animate-spin" style={{ animationDuration: '12s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                Real-Time D3 Quantum Entropy & Coherence Force Graph
              </span>
              <span className="px-2 py-0.2 rounded-full bg-violet-500/20 text-violet-300 border-violet-500/30 text-[9px] font-bold">
                PHYSICS FLUX LIVE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Force-directed 32-node topological representation • Surface-17 lattice coupling • Drag nodes to test phase elasticity
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={triggerResonancePulse}
            className="px-3 py-1.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 hover:text-violet-200 border-violet-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(139,92,246,0.2)]"
          >
            <RefreshCw className="w-3.5 h-3.5 text-violet-400" />
            <span>PULSE RESONANCE</span>
          </button>
        </div>
      </div>

      {/* Top 4 Quantum Entropy Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="p-3 rounded-2xl bg-black/40 border-white/8 space-y-1">
          <span className="text-[10px] text-zinc-400 block uppercase">Von Neumann Entropy</span>
          <span className="text-base font-bold text-violet-300 font-mono">{entropyFlux.vonNeumannEntropy} S(ρ)</span>
          <div className="text-[9px] text-emerald-400">Minimal Decoherence</div>
        </div>

        <div className="p-3 rounded-2xl bg-black/40 border-white/8 space-y-1">
          <span className="text-[10px] text-zinc-400 block uppercase">Shannon Purity</span>
          <span className="text-base font-bold text-cyan-300 font-mono">{entropyFlux.shannonEntropy}</span>
          <div className="text-[9px] text-zinc-500">99.9% Quantum Purity</div>
        </div>

        <div className="p-3 rounded-2xl bg-black/40 border-white/8 space-y-1">
          <span className="text-[10px] text-zinc-400 block uppercase">Phase Jitter</span>
          <span className="text-base font-bold text-amber-300 font-mono">{entropyFlux.phaseJitterFs} fs</span>
          <div className="text-[9px] text-zinc-500">Femtosecond Jitter</div>
        </div>

        <div className="p-3 rounded-2xl bg-black/40 border-white/8 space-y-1">
          <span className="text-[10px] text-zinc-400 block uppercase">Active Entanglements</span>
          <span className="text-base font-bold text-emerald-300 font-mono">{entropyFlux.activeEntanglements} Pairs</span>
          <div className="text-[9px] text-emerald-400">Bell States Synchronized</div>
        </div>

        <div className="p-3 rounded-2xl bg-black/40 border-white/8 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-zinc-400 block uppercase">Stability Index</span>
          <span className="text-base font-bold text-white font-mono">{entropyFlux.coherenceStability}%</span>
          <div className="text-[9px] text-violet-400">Surface-17 Locked</div>
        </div>
      </div>

      {/* Main D3 Graph Stage & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 8-9 Cols: Interactive D3 Graph Canvas */}
        <div
          ref={containerRef}
          className="lg:col-span-8 xl:col-span-9 relative rounded-[28px] bg-[#07080F] border-white/10 overflow-hidden shadow-2xl min-h-[480px] flex items-center justify-center"
        >
          <svg ref={svgRef} className="w-full h-[480px] select-none" />

          {/* Floating Graph Legend Overlay */}
          <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md border-white/10 p-2.5 rounded-xl text-[10px] space-y-1">
            <div className="text-zinc-400 font-bold uppercase text-[9px] mb-1">Topology Clusters:</div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
              <span className="text-zinc-300">Valerie (Semantic 768-D)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#06b6d4]" />
              <span className="text-zinc-300">Chronos (Temporal Sequence)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              <span className="text-zinc-300">Athena (Policy Gatekeeper)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
              <span className="text-zinc-300">Subzero Cryo Entanglement</span>
            </div>
          </div>

          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border-white/10 px-2.5 py-1 rounded-xl text-[10px] text-zinc-400">
            Interactive: Click & Drag Qubit Nodes
          </div>
        </div>

        {/* Right 3-4 Cols: Selected Qubit Inspector & State Matrices */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <div className="p-5 rounded-[28px] bg-[#0b0e1a]/85 border-white/8 backdrop-blur-xl space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-violet-400" />
                  Qubit Node Inspector
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border-violet-500/30">
                  {selectedNode ? selectedNode.id : 'READY'}
                </span>
              </div>

              {selectedNode ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-zinc-500 text-[10px] block uppercase">Qubit Name</span>
                    <span className="text-white font-bold text-sm">{selectedNode.name}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-black/40 border-white/5">
                      <span className="text-zinc-500 text-[10px] block">COHERENCE</span>
                      <span className="text-cyan-300 font-bold">{selectedNode.coherence}%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/40 border-white/5">
                      <span className="text-zinc-500 text-[10px] block">PHASE (θ)</span>
                      <span className="text-violet-300 font-bold">{selectedNode.phase} rad</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/40 border-white/5 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Local Entropy:</span>
                      <span className="text-amber-300 font-bold">{selectedNode.entropy}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Superposition Vector:</span>
                      <span className="text-emerald-400">α|0⟩ + β|1⟩ (0.707)</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Gate Fidelity:</span>
                      <span className="text-zinc-200">99.994% (CZ Gate)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-black/30 border-dashed border-white/10 text-center text-zinc-500 text-xs space-y-2">
                  <Sparkles className="w-6 h-6 text-violet-400/50 mx-auto" />
                  <p>Click any Qubit node in the force simulation to inspect instantaneous state vectors and coupling matrices.</p>
                </div>
              )}
            </div>

            <div className="p-3 rounded-2xl bg-violet-950/20 border-violet-500/20 text-[11px] text-zinc-300 space-y-1.5">
              <div className="text-violet-300 font-bold text-xs">Topological Invariant:</div>
              <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                Braided anyons in this cluster maintain fault-tolerant non-abelian geometric phase shifts immune to thermal noise.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
