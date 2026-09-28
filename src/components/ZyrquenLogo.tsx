import React, { useId } from 'react';

export interface ZyrquenIconProps {
  size?: number;
  showText?: boolean;
  className?: string;
  subtitle?: string;
}

/**
 * Standalone ZYRQUEN Ω∞ Quantum Hexagonal Emblem & Icon
 */
export function ZyrquenIcon({
  size = 44,
  showText = false,
  className = '',
  subtitle = 'COMMAND CENTER',
}: ZyrquenIconProps) {
  const uid = useId().replace(/:/g, '');

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 120 120"
        width={size}
        height={size}
        className="shrink-0 overflow-visible"
        aria-label="ZYRQUEN Ω∞ Emblem"
      >
        <defs>
          <linearGradient id={`bg-icon-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B0F17" />
            <stop offset="100%" stopColor="#030712" />
          </linearGradient>
          <linearGradient id={`cyan-icon-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id={`violet-icon-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id={`pulse-icon-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <filter id={`glow-icon-${uid}`} x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Rounded Dark Container */}
        <rect
          x="6"
          y="6"
          width="108"
          height="108"
          rx="24"
          fill={`url(#bg-icon-${uid})`}
          stroke="#1E293B"
          strokeWidth="2"
        />

        {/* Orbital Ring */}
        <circle
          cx="60"
          cy="60"
          r="44"
          fill="none"
          stroke={`url(#pulse-icon-${uid})`}
          strokeWidth="1.5"
          strokeDasharray="6 4"
          opacity="0.75"
        />

        {/* Outer Hexagonal Shield */}
        <polygon
          points="60,18 96,39 96,81 60,102 24,81 24,39"
          fill="#070B14"
          stroke={`url(#cyan-icon-${uid})`}
          strokeWidth="2.5"
          filter={`url(#glow-icon-${uid})`}
        />

        {/* Inner Violet Hexagon */}
        <polygon
          points="60,28 87,44 87,76 60,92 33,76 33,44"
          fill="none"
          stroke={`url(#violet-icon-${uid})`}
          strokeWidth="1.2"
          opacity="0.85"
        />

        {/* Center Omega-Infinity Glyph */}
        <text
          x="60"
          y="67"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="24"
          fontWeight="900"
          fill={`url(#cyan-icon-${uid})`}
          filter={`url(#glow-icon-${uid})`}
        >
          Ω∞
        </text>

        {/* Telemetry Vertex Dots */}
        <circle cx="60" cy="18" r="3" fill="#22D3EE" />
        <circle cx="96" cy="39" r="2.5" fill="#A855F7" />
        <circle cx="96" cy="81" r="2.5" fill="#22D3EE" />
        <circle cx="60" cy="102" r="3" fill="#10B981" />
        <circle cx="24" cy="81" r="2.5" fill="#22D3EE" />
        <circle cx="24" cy="39" r="2.5" fill="#A855F7" />
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-extrabold text-sm sm:text-base tracking-wider text-white">
              ZYRQUEN
            </span>
            <span className="font-mono font-extrabold text-sm sm:text-base text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
              Ω∞
            </span>
          </div>
          <span className="text-[10px] text-cyan-400 font-mono tracking-widest mt-0.5">
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
}

export interface ZyrquenLogoProps {
  variant?: 'full' | 'compact' | 'banner' | 'icon';
  showTagline?: boolean;
  showStatus?: boolean;
  className?: string;
}

/**
 * Full ZYRQUEN Ω∞ Cloud & AI Command Center SVG Banner & Brand Component
 */
export function ZyrquenLogo({
  variant = 'full',
  showTagline = true,
  showStatus = true,
  className = '',
}: ZyrquenLogoProps) {
  const uid = useId().replace(/:/g, '');

  if (variant === 'icon') {
    return <ZyrquenIcon size={42} showText={false} className={className} />;
  }

  if (variant === 'compact') {
    return <ZyrquenIcon size={40} showText={true} className={className} />;
  }

  return (
    <div className={`w-full select-none ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 800 240"
        width="100%"
        height="100%"
        className="w-full h-auto max-h-[190px] rounded-2xl shadow-2xl"
        role="img"
        aria-label="ZYRQUEN Ω∞ Cloud & AI Command Center"
      >
        <defs>
          {/* Background Gradient */}
          <linearGradient id={`bg-grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B0F17" />
            <stop offset="100%" stopColor="#030712" />
          </linearGradient>

          {/* Glowing Cyan Gradient */}
          <linearGradient id={`cyan-glow-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>

          {/* Glowing Violet Gradient */}
          <linearGradient id={`violet-glow-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>

          {/* Neon Pulse Dual Gradient */}
          <linearGradient id={`pulse-grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>

          {/* High-Glow Filter Effect */}
          <filter id={`neon-glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur1" />
            <feGaussianBlur stdDeviation="15" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft Ambient Glow Filter */}
          <filter id={`soft-glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="24" result="blur" />
          </filter>
        </defs>

        {/* Dark Console Container Background */}
        <rect
          width="800"
          height="240"
          rx="16"
          fill={`url(#bg-grad-${uid})`}
          stroke="#1E293B"
          strokeWidth="2"
        />

        {/* Background Ambient Glow Spots */}
        <circle
          cx="120"
          cy="120"
          r="70"
          fill="#06B6D4"
          opacity="0.15"
          filter={`url(#soft-glow-${uid})`}
        />
        <circle
          cx="160"
          cy="140"
          r="60"
          fill="#7C3AED"
          opacity="0.15"
          filter={`url(#soft-glow-${uid})`}
        />

        {/* Grid Pattern Overlay (Console Aesthetic) */}
        <g opacity="0.05" stroke="#FFFFFF" strokeWidth="1">
          <line x1="0" y1="60" x2="800" y2="60" />
          <line x1="0" y1="120" x2="800" y2="120" />
          <line x1="0" y1="180" x2="800" y2="180" />
          <line x1="120" y1="0" x2="120" y2="240" />
          <line x1="240" y1="0" x2="240" y2="240" />
          <line x1="480" y1="0" x2="480" y2="240" />
          <line x1="720" y1="0" x2="720" y2="240" />
        </g>

        {/* Left Quantum Hexagonal Emblem & Omega-Infinity Core */}
        <g transform="translate(120, 120)">
          <circle
            cx="0"
            cy="0"
            r="76"
            fill="none"
            stroke={`url(#pulse-grad-${uid})`}
            strokeWidth="1.5"
            strokeDasharray="10 6"
            opacity="0.7"
          />
          <polygon
            points="0,-64 55,-32 55,32 0,64 -55,32 -55,-32"
            fill="#070B14"
            stroke={`url(#cyan-glow-${uid})`}
            strokeWidth="3"
            filter={`url(#neon-glow-${uid})`}
          />
          <polygon
            points="0,-50 43,-25 43,25 0,50 -43,25 -43,-25"
            fill="none"
            stroke={`url(#violet-glow-${uid})`}
            strokeWidth="1.5"
            opacity="0.8"
          />
          <text
            x="0"
            y="11"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="34"
            fontWeight="900"
            fill={`url(#cyan-glow-${uid})`}
            filter={`url(#neon-glow-${uid})`}
          >
            Ω∞
          </text>
          <circle cx="0" cy="-64" r="4" fill="#22D3EE" />
          <circle cx="55" cy="-32" r="3.5" fill="#A855F7" />
          <circle cx="55" cy="32" r="3.5" fill="#22D3EE" />
          <circle cx="0" cy="64" r="4" fill="#10B981" />
          <circle cx="-55" cy="32" r="3.5" fill="#22D3EE" />
          <circle cx="-55" cy="-32" r="3.5" fill="#A855F7" />
        </g>

        {/* Right Brand Typography & Sovereign Status */}
        <g transform="translate(230, 0)">
          {showStatus && (
            <g>
              <rect
                x="0"
                y="38"
                width="315"
                height="26"
                rx="13"
                fill="#082F49"
                stroke="#06B6D4"
                strokeWidth="1"
                opacity="0.85"
              />
              <circle cx="15" cy="51" r="4.5" fill="#10B981" />
              <text
                x="28"
                y="55"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fontWeight="700"
                fill="#67E8F9"
                letterSpacing="1.2"
              >
                FROZEN CORE v1.2 LTS • Δ0.00% • 14,902 SEALS
              </text>
            </g>
          )}

          {/* Main Brand Title */}
          <text
            x="0"
            y="118"
            fontFamily="Inter, Segoe UI, sans-serif"
            fontSize="48"
            fontWeight="900"
            fill="#FFFFFF"
            letterSpacing="3"
          >
            ZYRQUEN
          </text>
          <text
            x="275"
            y="118"
            fontFamily="JetBrains Mono, monospace"
            fontSize="44"
            fontWeight="900"
            fill={`url(#cyan-glow-${uid})`}
            filter={`url(#neon-glow-${uid})`}
          >
            Ω∞
          </text>

          {/* Subtitle: Cloud & AI Command Center */}
          <text
            x="2"
            y="152"
            fontFamily="JetBrains Mono, monospace"
            fontSize="17"
            fontWeight="700"
            fill={`url(#pulse-grad-${uid})`}
            letterSpacing="3.5"
          >
            CLOUD &amp; AI COMMAND CENTER
          </text>

          {showTagline && (
            <text
              x="2"
              y="184"
              fontFamily="JetBrains Mono, monospace"
              fontSize="12"
              fontWeight="600"
              fill="#94A3B8"
              letterSpacing="1.5"
            >
              AUTONOMOUS CLOUD &amp; AI ORCHESTRATION • SOVEREIGN CONTROL PLANE
            </text>
          )}
        </g>
      </svg>
    </div>
  );
}

export default ZyrquenLogo;
