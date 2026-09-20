import React, { useMemo } from 'react';

export interface ChamberSparklineProps {
  data?: number[]; // ชุดข้อมูล Coherence Trend ย้อนหลัง 24 ชั่วโมง (0 - 100%)
  color?: string;
  temperatureHistory?: number[];
  currentTemp?: number;
  unit?: string;
}

export const ChamberSparkline: React.FC<ChamberSparklineProps> = ({
  data,
  color = '#34D399',
  temperatureHistory,
}) => {
  const points = useMemo(() => {
    if (data && data.length > 0) return data;
    if (temperatureHistory && temperatureHistory.length > 0) return temperatureHistory;
    return [];
  }, [data, temperatureHistory]);

  const sparklinePath = useMemo(() => {
    if (!points || points.length === 0) return '';
    const width = 120;
    const height = 28;
    const min = Math.min(...points, 50);
    const max = Math.max(...points, 100);
    const range = max - min || 1;

    return points
      .map((val, idx) => {
        const x = (idx / (points.length - 1 || 1)) * width;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [points]);

  return (
    <svg className="w-28 h-7 overflow-visible" viewBox="0 0 120 28">
      <path
        d={sparklinePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Sparkline: React.FC<{ data: number[]; strokeColor: string }> = ({
  data,
  strokeColor
}) => {
  return <ChamberSparkline data={data} color={strokeColor} />;
};

export default ChamberSparkline;

