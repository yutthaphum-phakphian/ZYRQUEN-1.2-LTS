import React from 'react';

export interface PanelProps {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  rightSlot,
  className = '',
  children,
}) => {
  return (
    <div className={`p-5 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-4 font-mono text-zinc-100 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div>
          <h3 className="text-sm font-bold tracking-wider uppercase text-zinc-200">{title}</h3>
          {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
        {rightSlot && <div className="flex items-center gap-2">{rightSlot}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
};

export default Panel;
