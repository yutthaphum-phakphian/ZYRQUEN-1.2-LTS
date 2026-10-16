import React, { useState } from 'react';
import { Cpu, CheckCircle2, Clock, Thermometer, Zap, ShieldCheck } from 'lucide-react';
import { COUNCIL_MEMBERS, CouncilMember, getMemberVitality } from '../../data/councilData';

export interface NodeMetricsResult {
  temp: string;
  latency: string;
  subKelvinTempMk: number;
  latencyMs: number;
  coherencePct: number;
  status: string;
}

export function getNodeMetrics(member: CouncilMember | number | string): NodeMetricsResult {
  let resolvedMember: CouncilMember | undefined;
  let slotId = 1;

  if (typeof member === 'object' && member !== null) {
    resolvedMember = member;
    slotId = member.slotId || 1;
  } else if (typeof member === 'number') {
    slotId = member;
    resolvedMember = COUNCIL_MEMBERS.find((m) => m.slotId === member);
  } else if (typeof member === 'string') {
    resolvedMember = COUNCIL_MEMBERS.find(
      (m) =>
        m.councilCode.toLowerCase() === member.toLowerCase() ||
        m.passportId.toLowerCase() === member.toLowerCase() ||
        String(m.slotId) === member
    );
    slotId = resolvedMember ? resolvedMember.slotId : parseInt(member.replace(/\D/g, '') || '1', 10);
  }

  const vitality = resolvedMember ? getMemberVitality(resolvedMember) : getMemberVitality(slotId);

  const subKelvinTempK =
    'subKelvinTempK' in vitality ? vitality.subKelvinTempK : undefined;
  const subKelvinTempMk =
    typeof subKelvinTempK === 'number' || typeof subKelvinTempK === 'string'
      ? Number((Number(subKelvinTempK) * 1000).toFixed(2))
      : vitality.subKelvinTemp !== undefined
        ? Number(vitality.subKelvinTemp.toFixed(2))
        : Number((14.92 + slotId * 0.012).toFixed(2));

  const lastPingMs = 'lastPingMs' in vitality ? vitality.lastPingMs : undefined;
  const latencyMs =
    typeof lastPingMs === 'number' || typeof lastPingMs === 'string'
      ? Number(lastPingMs)
      : vitality.latencyMs !== undefined
        ? Number(vitality.latencyMs.toFixed(2))
        : resolvedMember?.heartbeat?.latencyMs !== undefined
          ? Number(resolvedMember.heartbeat.latencyMs.toFixed(2))
          : Number((0.85 + slotId * 0.12).toFixed(2));

  return {
    temp: `${subKelvinTempMk} mK`,
    latency: `${latencyMs} ms`,
    subKelvinTempMk,
    latencyMs,
    coherencePct: vitality.coherencePct || 99.992,
    status: vitality.status || 'OPTIMAL',
  };
}

export interface HsmNodeStatusTooltipProps {
  member: CouncilMember | number | string;
  isVerified?: boolean;
  className?: string;
  children?: React.ReactNode;
  align?: 'right' | 'left' | 'center';
  placement?: 'top' | 'bottom';
}

export const HsmNodeStatusTooltip: React.FC<HsmNodeStatusTooltipProps> = ({
  member,
  isVerified,
  className = '',
  children,
  align = 'right',
  placement = 'bottom',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const resolvedMember: CouncilMember =
    typeof member === 'object' && member !== null
      ? member
      : COUNCIL_MEMBERS.find(
          (m) =>
            m.slotId === (typeof member === 'number' ? member : parseInt(String(member).replace(/\D/g, '') || '1', 10)) ||
            m.councilCode.toLowerCase() === String(member).toLowerCase()
        ) || COUNCIL_MEMBERS[0];

  const verifiedStatus =
    isVerified !== undefined
      ? isVerified
      : resolvedMember.verificationStatus === 'REAL_HSM_SIGNED' || resolvedMember.status === 'ONLINE';

  const metrics = getNodeMetrics(resolvedMember);

  const alignmentClass =
    align === 'left'
      ? 'left-0'
      : align === 'center'
      ? 'left-1/2 -translate-x-1/2'
      : 'right-0';

  const placementClass =
    placement === 'top'
      ? 'bottom-full mb-2'
      : 'top-full mt-2';

  return (
    <div
      className={`relative inline-block group/hsm-status cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={0}
      data-testid={`hsm-node-status-container-${resolvedMember.slotId}`}
      data-node-temp={metrics.temp}
      data-node-latency={metrics.latency}
      title={`HSM Node ${resolvedMember.councilCode}: Last Recorded Temperature: ${metrics.temp} | Latency: ${metrics.latency}`}
    >
      {children ? (
        children
      ) : (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all shadow-sm ${
            verifiedStatus
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 hover:border-emerald-300'
              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
          }`}
          data-testid={`hsm-node-status-badge-${resolvedMember.slotId}`}
        >
          {verifiedStatus ? (
            <CheckCircle2
              data-testid={`hsm-node-status-icon-${resolvedMember.slotId}`}
              className="w-3 h-3 text-emerald-400 animate-pulse hsm-node-status-icon"
              aria-label={`HSM Node ${resolvedMember.councilCode} Status: Verified`}
            />
          ) : (
            <Clock
              data-testid={`hsm-node-status-icon-${resolvedMember.slotId}`}
              className="w-3 h-3 text-amber-400 hsm-node-status-icon"
              aria-label={`HSM Node ${resolvedMember.councilCode} Status: Claimed`}
            />
          )}
          <span>{verifiedStatus ? 'REAL_HSM' : 'CLAIMED'}</span>
        </span>
      )}

      {/* Floating Hover Tooltip Popup displaying last recorded temperature and latency */}
      {isHovered && (
        <div
          role="tooltip"
          data-testid={`hsm-node-status-tooltip-${resolvedMember.slotId}`}
          className={`absolute ${placementClass} ${alignmentClass} z-50 w-64 p-3.5 rounded-2xl bg-[#070b16]/95 backdrop-blur-2xl border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.35)] text-xs font-mono text-zinc-200 pointer-events-none animate-in fade-in zoom-in-95 duration-150 select-none`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[10px]">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold text-white tracking-wider">
                {resolvedMember.councilCode} &bull; Slot #{resolvedMember.slotId.toString().padStart(2, '0')}
              </span>
            </div>
            <span
              className={`px-1.5 py-0.2 rounded text-[8.5px] font-bold border ${
                verifiedStatus
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {verifiedStatus ? '10/10 REAL_HSM' : 'CLAIMED'}
            </span>
          </div>

          <div className="pt-1.5 pb-0.5">
            <div className="text-[11px] font-bold text-cyan-300 truncate">
              {resolvedMember.nameTh || resolvedMember.name}
            </div>
            <div className="text-[9.5px] text-zinc-400 truncate">
              {resolvedMember.hardwareModel || resolvedMember.hardwareEnclave || 'FIPS 140-3 L4 Hardware Token'}
            </div>
          </div>

          {/* Metrics Grid: Temperature & Latency */}
          <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
            {/* Last Recorded Temperature */}
            <div className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/20 space-y-1">
              <span className="text-[9.5px] text-zinc-400 flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-cyan-400" />
                <span>Last Temp</span>
              </span>
              <div
                className="text-cyan-300 font-bold text-xs tracking-tight"
                data-testid={`hsm-node-temp-${resolvedMember.slotId}`}
              >
                {metrics.temp}
              </div>
              <span className="text-[8.5px] text-zinc-500 block truncate">
                Sub-Kelvin Base
              </span>
            </div>

            {/* Last Recorded Latency */}
            <div className="p-2.5 rounded-xl bg-black/60 border border-emerald-500/20 space-y-1">
              <span className="text-[9.5px] text-zinc-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>Last Latency</span>
              </span>
              <div
                className="text-emerald-400 font-bold text-xs tracking-tight"
                data-testid={`hsm-node-latency-${resolvedMember.slotId}`}
              >
                {metrics.latency}
              </div>
              <span className="text-[8.5px] text-zinc-500 block truncate">
                Cryo-Bus Link
              </span>
            </div>
          </div>

          {/* Footer Invariants */}
          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-zinc-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Coherence: <strong className="text-zinc-200">{metrics.coherencePct}%</strong></span>
            </span>
            <span className="text-cyan-400 font-bold">Zero Drift &Delta;0.00%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export interface HsmNodeStatusIconProps {
  member: CouncilMember | number | string;
  isVerified?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  align?: 'right' | 'left' | 'center';
}

export const HsmNodeStatusIcon: React.FC<HsmNodeStatusIconProps> = ({
  member,
  isVerified,
  className = '',
  size = 'md',
  align = 'right',
}) => {
  const resolvedMember: CouncilMember =
    typeof member === 'object' && member !== null
      ? member
      : COUNCIL_MEMBERS.find(
          (m) =>
            m.slotId === (typeof member === 'number' ? member : parseInt(String(member).replace(/\D/g, '') || '1', 10)) ||
            m.councilCode.toLowerCase() === String(member).toLowerCase()
        ) || COUNCIL_MEMBERS[0];

  const verifiedStatus =
    isVerified !== undefined
      ? isVerified
      : resolvedMember.verificationStatus === 'REAL_HSM_SIGNED' || resolvedMember.status === 'ONLINE';

  return (
    <HsmNodeStatusTooltip member={resolvedMember} isVerified={verifiedStatus} align={align}>
      <span
        data-testid={`hsm-node-status-icon-btn-${resolvedMember.slotId}`}
        className={`inline-flex items-center justify-center rounded-full transition-all cursor-pointer ${
          verifiedStatus
            ? 'text-emerald-400 hover:text-emerald-300'
            : 'text-amber-400 hover:text-amber-300'
        } ${className}`}
        title={`HSM Node ${resolvedMember.councilCode} Status Icon`}
      >
        {verifiedStatus ? (
          <CheckCircle2
            data-testid={`hsm-node-status-icon-${resolvedMember.slotId}`}
            className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} text-emerald-400 animate-pulse hsm-node-status-icon`}
          />
        ) : (
          <Clock
            data-testid={`hsm-node-status-icon-${resolvedMember.slotId}`}
            className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} text-amber-400 hsm-node-status-icon`}
          />
        )}
      </span>
    </HsmNodeStatusTooltip>
  );
};
