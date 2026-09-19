import React, { useState } from 'react';

export type SealVariant = 'gold' | 'wax-red' | 'cyber-cyan';

interface OfficialSealProps {
  variant?: SealVariant;
  size?: number;
  className?: string;
  titleText?: string;
  subText?: string;
  centerCode?: string;
  interactive?: boolean;
  onStamp?: () => void;
}

export const OfficialSealLogo: React.FC<OfficialSealProps> = ({
  variant = 'gold',
  size = 220,
  className = "",
  titleText = "ZYRQUEN Ω∞ SOVEREIGN ATTESTATION",
  subText = "100% VERIFIED FORENSIC SEAL",
  centerCode = "PQC-Δ0",
  interactive = true,
  onStamp
}) => {
  const [isPressed, setIsPressed] = useState(false);

  // Variant Theme Profiles
  const theme = {
    gold: {
      grad1: '#FBBF24', grad2: '#D97706', grad3: '#78350F',
      accent: '#22D3EE',
      textTop: 'fill-amber-300',
      textBottom: 'fill-cyan-400',
      bgFill: '#020617',
      shieldFill: '#D97706',
      glow: 'drop-shadow-[0_0_25px_rgba(245,158,11,0.35)]',
      borderRing: 'stroke-amber-500'
    },
    'wax-red': {
      grad1: '#EF4444', grad2: '#B91C1C', grad3: '#450A0A',
      accent: '#FCA5A5',
      textTop: 'fill-red-200',
      textBottom: 'fill-rose-300',
      bgFill: '#1A0505',
      shieldFill: '#B91C1C',
      glow: 'drop-shadow-[0_0_25px_rgba(239,68,68,0.4)]',
      borderRing: 'stroke-red-600'
    },
    'cyber-cyan': {
      grad1: '#22D3EE', grad2: '#0891B2', grad3: '#083344',
      accent: '#A855F7',
      textTop: 'fill-cyan-300',
      textBottom: 'fill-purple-300',
      bgFill: '#020617',
      shieldFill: '#0891B2',
      glow: 'drop-shadow-[0_0_25px_rgba(34,211,238,0.35)]',
      borderRing: 'stroke-cyan-500'
    }
  }[variant];

  const handleClick = () => {
    if (!interactive) return;
    setIsPressed(true);
    if (onStamp) onStamp();
    setTimeout(() => setIsPressed(false), 400);
  };

  return (
    <div 
      onClick={handleClick}
      className={`inline-block relative cursor-pointer select-none transition-all duration-300 ${theme.glow} ${
        isPressed ? 'scale-90 rotate-2' : 'hover:scale-105'
      } ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 300 300"
        className="overflow-visible"
      >
        <defs>
          {/* Main Gradient */}
          <linearGradient id={`sealGrad_${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.grad1} />
            <stop offset="50%" stopColor={theme.grad2} />
            <stop offset="100%" stopColor={theme.grad3} />
          </linearGradient>

          {/* Inner Accent Gradient */}
          <linearGradient id={`sealAccent_${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.grad1} />
            <stop offset="100%" stopColor={theme.accent} />
          </linearGradient>

          {/* Curved Text Paths */}
          <path id={`textPathTop_${variant}`} d="M 40,150 A 110,110 0 1,1 260,150" fill="none" />
          <path id={`textPathBottom_${variant}`} d="M 260,150 A 110,110 0 0,1 40,150" fill="none" />
        </defs>

        {/* 1. Outer Sawtooth Starburst Ring (Wax / Official Stamp Teeth) */}
        <circle
          cx="150"
          cy="150"
          r="142"
          fill="none"
          stroke={`url(#sealGrad_${variant})`}
          strokeWidth="2.5"
          strokeDasharray="6 4"
        />

        {/* 2. Primary Outer Solid Ring */}
        <circle
          cx="150"
          cy="150"
          r="134"
          fill={theme.bgFill}
          stroke={`url(#sealGrad_${variant})`}
          strokeWidth="4"
        />

        {/* 3. Guilloche Dotted Inner Boundary */}
        <circle
          cx="150"
          cy="150"
          r="98"
          fill="none"
          stroke={`url(#sealGrad_${variant})`}
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />

        {/* 4. Top Curved Text */}
        <text className={`text-[11px] font-mono font-bold tracking-[0.22em] uppercase ${theme.textTop}`}>
          <textPath href={`#textPathTop_${variant}`} startOffset="50%" textAnchor="middle">
            {titleText}
          </textPath>
        </text>

        {/* 5. Bottom Curved Text */}
        <text className={`text-[9.5px] font-mono font-semibold tracking-[0.2em] uppercase ${theme.textBottom}`}>
          <textPath href={`#textPathBottom_${variant}`} startOffset="50%" textAnchor="middle">
            {subText}
          </textPath>
        </text>

        {/* 6. Side Stars */}
        <g fill={theme.grad1}>
          <polygon points="30,150 33,143 40,150 33,157" />
          <polygon points="270,150 267,143 260,150 267,157" />
        </g>

        {/* 7. Center Emblem Geometry */}
        <g transform="translate(150, 150)">
          {/* Octagon Frame */}
          <polygon
            points="0,-48 34,-34 48,0 34,34 0,48 -34,34 -48,0 -34,-34"
            fill="#0F172A"
            stroke={`url(#sealAccent_${variant})`}
            strokeWidth="2"
          />

          {/* Central Shield Crest */}
          <path
            d="M 0,-30 L 22,-18 V 6 C 22,20 0,28 0,28 C 0,28 -22,20 -22,6 V -18 Z"
            fill={`url(#sealGrad_${variant})`}
            opacity="0.95"
          />

          {/* Checkmark Core */}
          <path
            d="M -8,-1 L -2,5 L 9,-6"
            fill="none"
            stroke="#020617"
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Center Text Code */}
          <text
            y="38"
            textAnchor="middle"
            className="text-[9px] font-mono font-extrabold fill-slate-200 tracking-wider uppercase"
          >
            {centerCode}
          </text>
        </g>
      </svg>
    </div>
  );
};

export default OfficialSealLogo;
