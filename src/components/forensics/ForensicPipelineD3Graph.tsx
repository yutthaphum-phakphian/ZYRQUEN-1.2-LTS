import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { playTone } from '../AudioSynthesizer';
import { Sparkles, Layers, CheckCircle2, AlertCircle, Clock, Hash, Sliders } from 'lucide-react';

interface StageNode {
  id: string;
  stageNumber: number;
  name: string;
  shortDesc: string;
  status: string;
  durationMs: number;
  parentHash: string;
  outputHash: string;
  sourceModule: string;
  actor: string;
  x?: number;
  y?: number;
}

interface ForensicPipelineD3GraphProps {
  stages: any[];
  currentStageIdx: number;
  onSelectStage: (stageIndex: number) => void;
  verificationResults?: Record<number, 'pending' | 'verifying' | 'success' | 'failed'>;
}

export const ForensicPipelineD3Graph: React.FC<ForensicPipelineD3GraphProps> = ({
  stages,
  currentStageIdx,
  onSelectStage,
  verificationResults = {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 260 });
  const [hoveredNode, setHoveredNode] = useState<StageNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Resize observer to ensure responsive D3 rendering
  useEffect(() => {
    if (!containerRef.current) return;
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth } = containerRef.current;
        const width = Math.max(640, clientWidth);
        const height = width < 768 ? 320 : 250;
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute node coordinates along a 2-tier serpentine flow or clean pipeline
  const nodes: StageNode[] = useMemo(() => {
    const { width, height } = dimensions;
    const paddingX = 55;
    const totalStages = stages.length;

    // Use a 2-row winding S-curve if width is compact, or a serpentine 2-row for 12 stages
    // Row 1: Stages 1-6 (left to right)
    // Row 2: Stages 7-12 (right to left or left to right)
    const isTwoRow = true;
    const row1Count = 6;
    const row2Count = 6;

    const row1Y = height * 0.28;
    const row2Y = height * 0.74;

    return stages.map((stg, i) => {
      let x = 0;
      let y = 0;

      if (isTwoRow) {
        if (i < row1Count) {
          const stepX = (width - paddingX * 2) / (row1Count - 1);
          x = paddingX + i * stepX;
          y = row1Y;
        } else {
          const stepX = (width - paddingX * 2) / (row2Count - 1);
          const row2Idx = i - row1Count;
          // Reverse direction (right to left) for authentic circuit trace pipeline
          x = (width - paddingX) - row2Idx * stepX;
          y = row2Y;
        }
      }

      return {
        ...stg,
        x,
        y,
      };
    });
  }, [stages, dimensions]);

  // Links connecting stage i to stage i+1
  const links = useMemo(() => {
    const linkList: Array<{ source: StageNode; target: StageNode; index: number }> = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      linkList.push({
        source: nodes[i],
        target: nodes[i + 1],
        index: i,
      });
    }
    return linkList;
  }, [nodes]);

  // Render D3 SVG elements
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'neon-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Linear gradients for links
    links.forEach((l) => {
      const grad = defs.append('linearGradient')
        .attr('id', `link-grad-${l.index}`)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', l.source.x || 0)
        .attr('y1', l.source.y || 0)
        .attr('x2', l.target.x || 0)
        .attr('y2', l.target.y || 0);

      const isPassed = l.index < currentStageIdx;
      const isActive = l.index === currentStageIdx - 1;

      if (isActive) {
        grad.append('stop').attr('offset', '0%').attr('stop-color', '#10B981');
        grad.append('stop').attr('offset', '100%').attr('stop-color', '#06B6D4');
      } else if (isPassed) {
        grad.append('stop').attr('offset', '0%').attr('stop-color', '#10B981');
        grad.append('stop').attr('offset', '100%').attr('stop-color', '#10B981');
      } else {
        grad.append('stop').attr('offset', '0%').attr('stop-color', '#334155');
        grad.append('stop').attr('offset', '100%').attr('stop-color', '#1e293b');
      }
    });

    const g = svg.append('g').attr('class', 'pipeline-root');

    // Draw connecting paths between nodes
    links.forEach((link) => {
      const isPassed = link.index < currentStageIdx;
      const isCurrentActive = link.index === currentStageIdx - 1;

      const sx = link.source.x || 0;
      const sy = link.source.y || 0;
      const tx = link.target.x || 0;
      const ty = link.target.y || 0;

      let d = '';
      if (link.index === 5) {
        // Connector between row 1 and row 2 (U-turn loop)
        const curveOffset = 35;
        d = `M ${sx} ${sy} C ${sx + curveOffset} ${sy}, ${tx + curveOffset} ${ty}, ${tx} ${ty}`;
      } else {
        // Horizontal straight/curved links
        const midX = (sx + tx) / 2;
        d = `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`;
      }

      // Background path
      g.append('path')
        .attr('d', d)
        .attr('fill', 'none')
        .attr('stroke', `url(#link-grad-${link.index})`)
        .attr('stroke-width', isCurrentActive ? 3.5 : isPassed ? 2.5 : 1.5)
        .attr('stroke-opacity', isCurrentActive ? 1 : isPassed ? 0.8 : 0.4)
        .attr('stroke-dasharray', !isPassed && !isCurrentActive ? '4,4' : 'none');

      // Animated pulse on active link
      if (isCurrentActive) {
        g.append('path')
          .attr('d', d)
          .attr('fill', 'none')
          .attr('stroke', '#06B6D4')
          .attr('stroke-width', 3)
          .attr('filter', 'url(#neon-glow)')
          .attr('opacity', 0.6);
      }
    });

    // Draw Nodes
    nodes.forEach((node, idx) => {
      const isCurrent = currentStageIdx === idx;
      const isPassed = idx < currentStageIdx;
      const vResult = verificationResults[idx];

      const nodeGroup = g.append('g')
        .attr('class', `node-stage-${idx}`)
        .attr('transform', `translate(${node.x}, ${node.y})`)
        .style('cursor', 'pointer')
        .on('click', () => {
          playTone(460 + idx * 28, 0.04);
          onSelectStage(idx);
        })
        .on('mouseenter', (event) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });
          }
          setHoveredNode(node);
        })
        .on('mouseleave', () => {
          setHoveredNode(null);
        });

      // Outer radar glow if current
      if (isCurrent) {
        nodeGroup.append('circle')
          .attr('r', 24)
          .attr('fill', 'none')
          .attr('stroke', '#06B6D4')
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.5)
          .attr('class', 'animate-ping')
          .style('transform-origin', 'center');

        nodeGroup.append('circle')
          .attr('r', 20)
          .attr('fill', 'rgba(6, 182, 212, 0.15)')
          .attr('stroke', '#06B6D4')
          .attr('stroke-width', 2)
          .attr('filter', 'url(#neon-glow)');
      }

      // Base Circle
      const baseFill = isCurrent
        ? '#06B6D4'
        : isPassed
        ? '#10B981'
        : '#1e293b';

      const baseStroke = isCurrent
        ? '#67e8f9'
        : isPassed
        ? '#34d399'
        : '#475569';

      nodeGroup.append('circle')
        .attr('r', isCurrent ? 16 : 14)
        .attr('fill', baseFill)
        .attr('stroke', baseStroke)
        .attr('stroke-width', isCurrent ? 2.5 : 1.5)
        .attr('filter', isCurrent || isPassed ? 'url(#neon-glow)' : 'none');

      // Stage Number Label inside Circle
      nodeGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('fill', isCurrent || isPassed ? '#070914' : '#94a3b8')
        .attr('font-size', isCurrent ? '11px' : '9px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'monospace')
        .text(idx + 1);

      // Label below or above node
      const isRow1 = idx < 6;
      const textY = isRow1 ? -24 : 26;

      nodeGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', textY)
        .attr('fill', isCurrent ? '#67e8f9' : isPassed ? '#e2e8f0' : '#64748b')
        .attr('font-size', '10px')
        .attr('font-weight', isCurrent ? 'bold' : '500')
        .attr('font-family', 'monospace')
        .text(node.id);

      // Latency pill under label
      const latY = isRow1 ? -36 : 38;
      nodeGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', latY)
        .attr('fill', isCurrent ? '#06B6D4' : '#64748b')
        .attr('font-size', '8px')
        .attr('font-family', 'monospace')
        .text(`${node.durationMs}ms`);

      // Parallel Verification status indicator badge
      if (vResult) {
        const badgeColor = vResult === 'success' ? '#10B981' : vResult === 'verifying' ? '#F59E0B' : '#EF4444';
        nodeGroup.append('circle')
          .attr('cx', 12)
          .attr('cy', -12)
          .attr('r', 4.5)
          .attr('fill', badgeColor)
          .attr('stroke', '#070a12')
          .attr('stroke-width', 1.5);
      }
    });

  }, [nodes, links, currentStageIdx, verificationResults, dimensions]);

  return (
    <div ref={containerRef} className="relative w-full rounded-2xl bg-[#060814]/90 border border-cyan-500/20 p-4 font-mono shadow-inner">
      {/* Header with Title & Scrubber controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Interactive D3 Forensic Pipeline (Scrubbable Node-Link Topology)
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-zinc-400 text-[11px]">
            Scrub Stage: <strong className="text-cyan-300 font-bold">#{currentStageIdx + 1}/12</strong> ({stages[currentStageIdx]?.id})
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
            Bitwise Chain Valid
          </span>
        </div>
      </div>

      {/* SVG Canvas for D3 */}
      <div className="w-full overflow-x-auto py-2 flex justify-center">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="overflow-visible select-none"
        />
      </div>

      {/* Real-time Interactive Scrubber Slider */}
      <div className="pt-2 px-2 border-t border-white/10 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-zinc-400 shrink-0">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Timeline Scrubber:</span>
        </div>

        <div className="flex-1 w-full relative flex items-center">
          <input
            type="range"
            min={0}
            max={stages.length - 1}
            value={currentStageIdx}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              playTone(480 + val * 25, 0.03);
              onSelectStage(val);
            }}
            className="w-full h-2 bg-black/60 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-white/10 hover:border-cyan-500/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-[10px] text-zinc-500 shrink-0">
          <span>Click any node to scrub</span>
        </div>
      </div>

      {/* Hover Tooltip Overlay */}
      {hoveredNode && (
        <div
          className="absolute z-50 pointer-events-none p-3 rounded-xl bg-[#090d1c] border border-cyan-400/50 shadow-2xl text-[11px] space-y-1.5 backdrop-blur-md max-w-xs animate-in fade-in duration-150"
          style={{
            left: Math.min(tooltipPos.x + 12, dimensions.width - 240),
            top: Math.max(10, tooltipPos.y - 120),
          }}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-1">
            <span className="font-bold text-white flex items-center gap-1">
              <span className="text-cyan-400">Stage #{hoveredNode.stageNumber}:</span> {hoveredNode.name}
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              {hoveredNode.status}
            </span>
          </div>
          <p className="text-[10px] text-zinc-300">{hoveredNode.shortDesc}</p>
          <div className="space-y-0.5 text-[9px] text-zinc-400 font-mono">
            <div>Parent: <span className="text-zinc-300">{hoveredNode.parentHash.slice(0, 18)}...</span></div>
            <div>Output: <span className="text-cyan-300">{hoveredNode.outputHash.slice(0, 18)}...</span></div>
            <div className="text-amber-300">Duration: {hoveredNode.durationMs} ms</div>
          </div>
        </div>
      )}
    </div>
  );
};
