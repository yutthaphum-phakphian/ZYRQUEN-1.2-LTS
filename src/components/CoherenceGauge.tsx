import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface CoherenceGaugeProps {
  score: number; // Percentage (0 - 100)
  size?: number;
}

export const CoherenceGauge: React.FC<CoherenceGaugeProps> = ({
  score,
  size = 72
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous renders
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = 6;
    const radius = size / 2 - margin;
    const startAngle = -Math.PI * 0.75;
    const endAngle = Math.PI * 0.75;

    // Color interpolation according to score threshold
    const gaugeColor =
      score >= 90 ? '#34D399' : score >= 75 ? '#F59E0B' : '#F87171';

    const svg = d3
      .select(svgRef.current)
      .attr('width', size)
      .attr('height', size)
      .append('g')
      .attr('transform', `translate(${size / 2}, ${size / 2})`);

    // Background track arc
    const backgroundArc = d3
      .arc()
      .innerRadius(radius - 6)
      .outerRadius(radius)
      .startAngle(startAngle)
      .endAngle(endAngle)
      .cornerRadius(3);

    svg
      .append('path')
      .attr('d', backgroundArc as any)
      .attr('fill', '#1F2937');

    // Score foreground arc
    const scoreAngle = startAngle + (score / 100) * (endAngle - startAngle);
    const foregroundArc = d3
      .arc()
      .innerRadius(radius - 6)
      .outerRadius(radius)
      .startAngle(startAngle)
      .endAngle(scoreAngle)
      .cornerRadius(3);

    svg
      .append('path')
      .attr('d', foregroundArc as any)
      .attr('fill', gaugeColor);

    // Center text score percentage
    svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#F3F4F6')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text(`${score.toFixed(0)}%`);
  }, [score, size]);

  return <svg ref={svgRef} className="overflow-visible" />;
};

export default CoherenceGauge;
