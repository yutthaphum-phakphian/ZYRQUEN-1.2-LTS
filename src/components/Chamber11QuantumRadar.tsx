import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Cpu,
  RefreshCw,
  Download,
  Terminal,
  Activity,
  Zap,
  Lock,
  Eye,
  CheckCircle2,
  Sliders,
  Maximize2,
  QrCode,
  Copy,
  Check,
  X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { playTone, playAuditChime } from './AudioSynthesizer';
import { safeCopyToClipboard } from '../utils/clipboard';

export interface ThreatVector {
  id: string;
  name: string;
  threat_type: string;
  angle_deg: number;
  distance_pct: number;
  risk_score: number;
  status: 'CRITICAL_THREAT' | 'WARNING_THREAT' | 'HARDWARE_TAMPER' | 'NORMAL_RESOLVED' | 'MITIGATED_QUARANTINED';
  mitigation: string;
  radar_x?: number;
  radar_y?: number;
  notes?: string;
}

const INITIAL_THREAT_VECTORS: ThreatVector[] = [
  {
    id: 'VEC-101',
    name: "Shor's Algorithm Factorization Probe",
    threat_type: 'Quantum Cryptanalysis',
    angle_deg: 45,
    distance_pct: 85,
    risk_score: 0.98,
    status: 'CRITICAL_THREAT',
    mitigation: 'Enforce Fail-Closed & Switch to SPHINCS+',
    notes: 'พยายามแยกตัวประกอบกุญแจแลตทิสระยะไกล สกัดกั้นด้วยการสั่งสับเปลี่ยนโปรโตคอล FIPS 205 สำรองทันที'
  },
  {
    id: 'VEC-102',
    name: 'Lattice-Reduction (BKZ) Probe',
    threat_type: 'Quantum Lattice Attack',
    angle_deg: 135,
    distance_pct: 60,
    risk_score: 0.88,
    status: 'WARNING_THREAT',
    mitigation: 'Quarantine Probe Source & Dilithium Key Swap',
    notes: 'ตรวจพบสัญญาณคำนวณเวกเตอร์สั้นผิดปกติ กักกันไอพีต้นทางและสลับคีย์ Dilithium-5 ทันที'
  },
  {
    id: 'VEC-103',
    name: 'High-Frequency Signature Replay Flood',
    threat_type: 'Network Replay',
    angle_deg: 220,
    distance_pct: 30,
    risk_score: 0.95,
    status: 'CRITICAL_THREAT',
    mitigation: 'Block IP & Activate Chamber 02 Quarantine',
    notes: 'บุกรุกระยะประชิดแกนกลางระดับ 30% ส่งซ้ำลายเซ็นความถี่สูง ส่งเข้าห้องขัง Chamber 02 กักโรคเด็ดขาด'
  },
  {
    id: 'VEC-104',
    name: 'FIPS Tamper Foil Voltage Probe',
    threat_type: 'Physical Intercept',
    angle_deg: 290,
    distance_pct: 15,
    risk_score: 1.0,
    status: 'HARDWARE_TAMPER',
    mitigation: 'Trigger Active Zeroization on HSM TC-03',
    notes: 'ตรวจจับแรงดันไฟฟ้าผิดปกติที่แผ่นฟอยล์ตู้เซฟ HSM Rack #03 (15% สู่แกนหลัก) สั่งล้างหน่วยความจำชั่วคราวด่วน'
  },
  {
    id: 'VEC-105',
    name: 'Standard API Transaction Stream',
    threat_type: 'Normal Traffic',
    angle_deg: 80,
    distance_pct: 95,
    risk_score: 0.05,
    status: 'NORMAL_RESOLVED',
    mitigation: 'Commit to G11 Canonical Core',
    notes: 'ทราฟฟิกธุรกรรมลายเซ็นปกติ บันทึกลงบัญชี Canonical Block #849202 เรียบร้อย'
  },
  {
    id: 'VEC-106',
    name: 'Oracle Feed Coherence Checking',
    threat_type: 'Data Alignment',
    angle_deg: 340,
    distance_pct: 90,
    risk_score: 0.12,
    status: 'NORMAL_RESOLVED',
    mitigation: 'Sync with Runtime Deck Frozen (Chamber 16)',
    notes: 'สัญญาณตรวจสอบความสอดคล้องข้อมูลออราเคิล ประสานเวลาตรงกับสัญกรณ์ Chamber 16 สัมบูรณ์'
  }
];

export const Chamber11QuantumRadar: React.FC = () => {
  const [threats, setThreats] = useState<ThreatVector[]>(INITIAL_THREAT_VECTORS);
  const [selectedThreat, setSelectedThreat] = useState<ThreatVector | null>(INITIAL_THREAT_VECTORS[3]); // Default to VEC-104
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [sweepAngle, setSweepAngle] = useState<number>(0);
  const [scanSpeed, setScanSpeed] = useState<number>(1.5); // degrees per frame
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'NORMAL'>('ALL');
  const [isSimulatingThreat, setIsSimulatingThreat] = useState<boolean>(false);
  const [baselineDrift, setBaselineDrift] = useState<number>(0);
  const [isGlitching, setIsGlitching] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([
    '[INIT] Chamber 11: 8K Quantum Radar Threat Detection Core armed.',
    '[SCANNER] 360° Post-Quantum Doppler sweep active at 1.5°/frame.',
    '[SENTINEL] Fail-Closed automatic trigger primed at 85.0°C / SSoT Zero Drift.',
    '[CRYPTO] NIST FIPS 204 ML-DSA-87 signature integrity 100% verified.'
  ]);

  // Trigger 8K Threat-Vector Simulator Injection
  const handleTriggerThreatSimulator = () => {
    setIsSimulatingThreat(true);
    playTone(480, 0.1, 'sawtooth');
    
    setTimeout(() => {
      playTone(880, 0.08, 'sine');
    }, 200);

    setBaselineDrift(0.12);
    setIsGlitching(true);
    setTimeout(() => {
      setIsGlitching(false);
      setBaselineDrift(0);
    }, 2500);

    const newSimulatedVector: ThreatVector = {
      id: `VEC-${Math.floor(100 + Math.random() * 900)}`,
      name: 'Dynamic Quantum Coherence Distortion Probe',
      threat_type: 'Quantum Side-Channel Attack',
      angle_deg: Math.floor(Math.random() * 360),
      distance_pct: Math.floor(25 + Math.random() * 45),
      risk_score: 0.96,
      status: 'CRITICAL_THREAT',
      mitigation: 'Engage 10/10 HSM Deca-Quorum Shield & Fail-Closed',
      notes: 'ตรวจพบสัญญาณรบกวนความเร็วสูงจากภายนอก จำลองการเจาะเกราะคริปโต NIST PQC ระบบเปิดมาตรการกักโรคทันที'
    };

    setThreats((prev) => [newSimulatedVector, ...prev]);
    setSelectedThreat(newSimulatedVector);
    setLogs((prev) => [
      `[SIMULATOR] ⚠️ Injected Threat Vector ${newSimulatedVector.id} (${newSimulatedVector.name}) at ${newSimulatedVector.angle_deg}° range ${newSimulatedVector.distance_pct}%.`,
      `[SENTINEL] Fail-Closed automatic trigger primed at 85.0°C / SSoT Zero Drift.`,
      ...prev.slice(0, 7)
    ]);

    setTimeout(() => {
      setIsSimulatingThreat(false);
      playAuditChime();
    }, 600);
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Sweep rotation animation loop
  useEffect(() => {
    let currentAngle = 0;

    const render = () => {
      if (isScanning) {
        currentAngle = (currentAngle + scanSpeed) % 360;
        setSweepAngle(currentAngle);
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isScanning, scanSpeed]);

  // Render polar radar onto HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(centerX, centerY) - 30;

    // Clear background
    ctx.fillStyle = '#030d03';
    ctx.fillRect(0, 0, width, height);

        // Animated Grid Pattern Overlay for 8K Radar Fidelity
    const timeSec = Date.now() / 1000;
    const gridOffset = (timeSec * 15) % 20;
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let x = gridOffset; x < width; x += 20) {
      ctx.moveTo(x, 0); ctx.lineTo(x, height);
    }
    for(let y = gridOffset; y < height; y += 20) {
      ctx.moveTo(0, y); ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Radial gradient glow from center
    const radialGlow = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, maxRadius);
    radialGlow.addColorStop(0, 'rgba(0, 255, 65, 0.08)');
    radialGlow.addColorStop(0.7, 'rgba(0, 60, 20, 0.03)');
    radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = radialGlow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, 2 * Math.PI);
    ctx.fill();

    // Concentric Range Circles (25%, 50%, 75%, 100%)
    const rings = [0.25, 0.5, 0.75, 1.0];
    rings.forEach((rRatio, idx) => {
      const r = maxRadius * rRatio;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
      ctx.strokeStyle = idx === 3 ? '#00ff41' : 'rgba(0, 255, 65, 0.25)';
      ctx.lineWidth = idx === 3 ? 1.8 : 1.0;
      ctx.setLineDash(idx === 3 ? [] : [4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Distance labels
      ctx.fillStyle = 'rgba(0, 255, 65, 0.6)';
      ctx.font = '10px monospace';
      ctx.fillText(`${Math.round(rRatio * 100)}% (${Math.round(100 - rRatio * 100)}% DIST)`, centerX + 6, centerY - r + 12);
    });

    // Crosshairs & Diagonal Spokes
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    for (let deg = 0; deg < 360; deg += 45) {
      const rad = (deg * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + maxRadius * Math.cos(rad), centerY + maxRadius * Math.sin(rad));
      ctx.stroke();

      // Degree labels at boundary
      const labelX = centerX + (maxRadius + 14) * Math.cos(rad);
      const labelY = centerY + (maxRadius + 14) * Math.sin(rad);
      ctx.fillStyle = 'rgba(0, 255, 65, 0.7)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${deg}°`, labelX, labelY);
    }
    ctx.setLineDash([]);

    // Rotating Sweep Beam with Fading Sector
    const sweepRad = (sweepAngle * Math.PI) / 180;
    const sweepLength = maxRadius;

    // Draw sweep trail (fan gradient)
    const trailAngles = 45; // degrees of trail
    for (let i = 0; i < trailAngles; i += 2) {
      const a1 = sweepRad - ((i + 2) * Math.PI) / 180;
      const a2 = sweepRad - (i * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, sweepLength, a1, a2);
      ctx.closePath();
      const alpha = (1 - i / trailAngles) * 0.14;
      ctx.fillStyle = `rgba(0, 255, 65, ${alpha})`;
      ctx.fill();
    }

    // Leading sweep line
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + sweepLength * Math.cos(sweepRad), centerY + sweepLength * Math.sin(sweepRad));
    ctx.strokeStyle = '#50ff70';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ff41';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Central Core G11 Marker
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CORE G11', centerX, centerY + 18);

    // Plot Threat Vectors
    threats.forEach((vec) => {
      // In the radar mapping: distance_pct (100% boundary, 0% core)
      // Radius from center: distance_pct / 100 * maxRadius
      const rad = (vec.angle_deg * Math.PI) / 180;
      const r = (vec.distance_pct / 100) * maxRadius;
      const x = centerX + r * Math.cos(rad);
      const y = centerY + r * Math.sin(rad);

      const isSelected = selectedThreat?.id === vec.id;

      // Check if sweep is close to this target to trigger a ping effect
      const angleDiff = Math.abs(((sweepAngle - vec.angle_deg + 540) % 360) - 180);
      const isPinged = angleDiff < 15;

      // Color coding
      let color = '#33cc33'; // normal
      let pulseColor = 'rgba(51, 204, 51, 0.4)';
      if (vec.status === 'CRITICAL_THREAT' || vec.status === 'HARDWARE_TAMPER') {
        color = '#ff3333';
        pulseColor = 'rgba(255, 51, 51, 0.4)';
      } else if (vec.status === 'WARNING_THREAT') {
        color = '#ffaa00';
        pulseColor = 'rgba(255, 170, 0, 0.4)';
      } else if (vec.status === 'MITIGATED_QUARANTINED') {
        color = '#00e5ff';
        pulseColor = 'rgba(0, 229, 255, 0.4)';
      }

      // Outer Danger / Ping Ring
      if (isPinged || isSelected || vec.status === 'CRITICAL_THREAT' || vec.status === 'HARDWARE_TAMPER') {
        ctx.beginPath();
        ctx.arc(x, y, isSelected ? 18 : 14, 0, 2 * Math.PI);
        ctx.strokeStyle = pulseColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Main Node Marker
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 7 : 5, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Threat Label Box
      const label = `${vec.id}: ${vec.threat_type}`;
      ctx.font = 'bold 9px monospace';
      const textWidth = ctx.measureText(label).width;
      const boxPadding = 3;
      const boxX = x - textWidth / 2 - boxPadding;
      const boxY = y - 18;

      ctx.fillStyle = 'rgba(2, 11, 2, 0.85)';
      ctx.fillRect(boxX, boxY, textWidth + boxPadding * 2, 14);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX, boxY, textWidth + boxPadding * 2, 14);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, boxY + 10);
    });
  }, [sweepAngle, threats, selectedThreat, isScanning]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 30;

    // Find closest vector
    let closest: ThreatVector | null = null;
    let minDistance = 30; // click tolerance in px

    threats.forEach((vec) => {
      const rad = (vec.angle_deg * Math.PI) / 180;
      const r = (vec.distance_pct / 100) * maxRadius;
      const vx = centerX + r * Math.cos(rad);
      const vy = centerY + r * Math.sin(rad);

      const dist = Math.hypot(clickX - vx, clickY - vy);
      if (dist < minDistance) {
        minDistance = dist;
        closest = vec;
      }
    });

    if (closest) {
      playTone(720, 0.05);
      setSelectedThreat(closest);
    }
  };

  const handleMitigateThreat = (threatId: string) => {
    playTone(520, 0.1, 'sawtooth');
    setTimeout(() => playAuditChime(), 200);

    setThreats((prev) =>
      prev.map((t) => {
        if (t.id === threatId) {
          return {
            ...t,
            status: 'MITIGATED_QUARANTINED',
            risk_score: 0.01
          };
        }
        return t;
      })
    );

    if (selectedThreat?.id === threatId) {
      setSelectedThreat((prev) =>
        prev
          ? {
              ...prev,
              status: 'MITIGATED_QUARANTINED',
              risk_score: 0.01
            }
          : null
      );
    }

    setLogs((prev) => [
      `[ACTION] Vector ${threatId} neutralized via Fail-Closed protocol.`,
      `[ISOLATION] Evidence artifact transferred to Module 17 Isolation Buffer.`,
      ...prev.slice(0, 8)
    ]);
  };

  const handleExportJson = () => {
    playAuditChime();
    const results = {
      radar_system: 'Chamber 11: 8K Quantum Radar Threat Detection Core',
      target_system: 'ZYRQUEN Ω∞ (LOCKED_FROZEN_v1.2_LTS)',
      block_height: 849202,
      coherence_pct: 99.992,
      cryo_temp_mk: 14.98,
      total_active_vectors_detected: threats.length,
      threat_vectors: threats,
      radar_verdict: {
        status: 'COMPROMISE_PREVENTED_FAIL_CLOSED_ACTIVE',
        remediation_status: 'FIPS_Level_4_Shields_Armed',
        thai_law_admissibility: 'FORENSIC_READY_SEC_9_26_28_OK'
      },
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zyrquen-quantum-radar-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredThreats = threats.filter((t) => {
    if (filter === 'CRITICAL') return t.status === 'CRITICAL_THREAT' || t.status === 'HARDWARE_TAMPER';
    if (filter === 'WARNING') return t.status === 'WARNING_THREAT';
    if (filter === 'NORMAL') return t.status === 'NORMAL_RESOLVED' || t.status === 'MITIGATED_QUARANTINED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Band */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-black to-zinc-950 border border-emerald-500/40 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="w-full">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400 shrink-0" />
              <span>CHAMBER 11 • 8K QUANTUM RADAR</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono">
              COHERENCE 99.992%
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-mono">
              14.98 mK CRYO
            </span>
          </div>
          <h2 className="text-xl font-bold font-serif text-white flex items-center gap-2">
            <span>เรดาร์ควอนตัม 8K ตรวจจับภัยคุกคามและการแทรกซึมรอบแกนหลัก G11</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            ระบบจำลองและตรวจจับเวกเตอร์ภัยคุกคามรอบแนวพรมแดนอธิปไตย SSoT Δ0 พร้อมสวิตช์มาตรการสยบภัยคุกคามฉุกเฉิน (Fail-Closed Enforcement)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full md:w-auto">
          {/* Threat Simulator Trigger */}
          <button
            onClick={handleTriggerThreatSimulator}
            disabled={isSimulatingThreat}
            className="px-3.5 min-h-[44px] py-2 rounded-xl text-xs font-mono font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 flex justify-center items-center gap-2 transition shadow-[0_0_15px_rgba(244,63,94,0.2)] cursor-pointer"
            title="จำลองการส่งเวกเตอร์ภัยคุกคามควอนตัม 8K สู่แนวรับ SSoT เพื่อทดสอบระบบ Fail-Closed"
          >
            <ShieldAlert className={`w-3.5 h-3.5 text-rose-400 ${isSimulatingThreat ? 'animate-bounce' : ''}`} />
            <span>{isSimulatingThreat ? 'กำลังจำลองภัยคุกคาม...' : 'จำลองภัยคุกคาม (Trigger Threat Vector)'}</span>
          </button>

          <button
            onClick={() => setIsScanning(!isScanning)}
            className={`px-3.5 min-h-[44px] py-2 rounded-xl text-xs font-mono font-bold flex justify-center items-center gap-2 border transition ${
              isScanning
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'กำลังกวาดสัญญาณ (Scanning)' : 'หยุดการกวาดสัญญาณ (Paused)'}</span>
          </button>

          <button
            onClick={handleExportJson}
            className="px-3.5 min-h-[44px] py-2 rounded-xl text-xs font-mono font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 flex justify-center items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>ส่งออก JSON ผลการวิเคราะห์</span>
          </button>

          {/* Generate QR for Chamber Audit Button */}
          <button
            id="btn-generate-chamber-audit-qr"
            onClick={() => {
              playAuditChime();
              setIsQrModalOpen(true);
            }}
            className="px-3.5 min-h-[44px] py-2 rounded-xl text-xs font-mono font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex justify-center items-center gap-2 transition shadow-[0_0_15px_rgba(6,182,212,0.25)] cursor-pointer"
            title="สร้าง QR Code ของ Merkle Proof Hash จากค่า Telemetry Snapshot ล่าสุดสำหรับตรวจประเมิน"
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Generate QR for Chamber Audit</span>
          </button>
        </div>
      </div>

      {/* Main Radar Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Radar Screen Canvas (7 cols on large) */}
        <div className="lg:col-span-7 bg-[#020b02] border border-emerald-500/30 rounded-2xl p-4 flex flex-col items-center relative overflow-hidden shadow-[0_0_30px_rgba(0,255,65,0.08)]">
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-2.5 mb-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
              <span className="truncate leading-tight">POLAR THREAT INTERCEPT DISPLAY (360° SWEEP)</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="shrink-0">ความเร็ว:</span>
              <div className="flex bg-black/40 rounded-lg p-0.5 border border-emerald-500/20">
                <button
                  onClick={() => setScanSpeed(0.8)}
                  className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md transition-colors ${scanSpeed === 0.8 ? 'bg-emerald-500/30 text-emerald-300 font-bold' : 'hover:bg-white/5 hover:text-zinc-200'}`}
                >
                  1x
                </button>
                <button
                  onClick={() => setScanSpeed(1.5)}
                  className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md transition-colors ${scanSpeed === 1.5 ? 'bg-emerald-500/30 text-emerald-300 font-bold' : 'hover:bg-white/5 hover:text-zinc-200'}`}
                >
                  2x
                </button>
                <button
                  onClick={() => setScanSpeed(3.0)}
                  className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md transition-colors ${scanSpeed === 3.0 ? 'bg-emerald-500/30 text-emerald-300 font-bold' : 'hover:bg-white/5 hover:text-zinc-200'}`}
                >
                  4x
                </button>
              </div>
            </div>
          </div>

          {/* HTML5 Canvas */}
          <div className={`relative cursor-crosshair transition-all duration-75 ${isGlitching ? 'translate-x-1 -translate-y-1 skew-x-2 brightness-150 contrast-125 sepia-[0.3] hue-rotate-[320deg]' : ''}`}>
            <canvas
              ref={canvasRef}
              width={520}
              height={520}
              onClick={handleCanvasClick}
              className="max-w-full h-auto rounded-xl border border-emerald-500/20"
            />
            {/* Export Waveform Telemetry Button */}
            <button
              onClick={() => {
                playAuditChime();
                const telemetryBlob = new Blob([JSON.stringify({
                  artifact: "MerkleWave_Telemetry",
                  timestamp: new Date().toISOString(),
                  baseline_drift: baselineDrift,
                  signature: "SHA3-512-R-FIPS",
                  genesis_block: 849202,
                  coherence_pct: 99.992,
                  active_vectors: threats.length,
                  vectors: threats
                }, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(telemetryBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `merklewave-telemetry-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="absolute bottom-3 right-3 z-10 px-2.5 py-1.5 bg-black/80 hover:bg-emerald-950/90 border border-emerald-500/50 rounded-lg flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 shadow-lg backdrop-blur-md transition-all cursor-pointer hover:border-emerald-400 active:scale-95"
              title="ส่งออกชุดข้อมูลเวฟฟอร์มและเวกเตอร์โทรมาตรเพื่อการตรวจพิสูจน์พยานหลักฐาน"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>Export Waveform Telemetry</span>
            </button>
          </div>

          {/* Radar Bottom Telemetry Strip */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-emerald-500/20 text-center font-mono">
            <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/20 flex flex-col items-center justify-center min-h-[44px]">
              <span className="text-zinc-500 block text-[9px] sm:text-[10px]">เป้าหมายที่ตรวจพบ</span>
              <span className="text-emerald-400 font-bold text-xs sm:text-sm">{threats.length} เวกเตอร์</span>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/20 flex flex-col items-center justify-center min-h-[44px]">
              <span className="text-zinc-500 block text-[9px] sm:text-[10px]">ระดับเสี่ยงสูงสุด</span>
              <span className="text-rose-400 font-bold text-xs sm:text-sm">1.00 (VEC-104)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/20 flex flex-col items-center justify-center min-h-[44px]">
              <span className="text-zinc-500 block text-[9px] sm:text-[10px]">สถานะเกราะกำบัง</span>
              <span className="text-cyan-300 font-bold text-xs sm:text-sm">FIPS L4 ARMED</span>
            </div>
          </div>
        </div>

        {/* Threat Vectors List & Detail Inspector (5 cols on large) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Filter Pills */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 bg-black/50 p-1.5 rounded-xl border border-white/10 text-xs font-mono">
            {(['ALL', 'CRITICAL', 'WARNING', 'NORMAL'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  playTone(600, 0.02);
                  setFilter(mode);
                }}
                className={`flex-1 min-h-[44px] px-2 rounded-lg text-center font-bold transition whitespace-nowrap flex items-center justify-center ${
                  filter === mode
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                {mode === 'ALL' && `ทั้งหมด (${threats.length})`}
                {mode === 'CRITICAL' && `วิกฤต (3)`}
                {mode === 'WARNING' && `เตือน (1)`}
                {mode === 'NORMAL' && `ปกติ (2)`}
              </button>
            ))}
          </div>

          {/* Vectors List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {filteredThreats.map((t) => {
              const isSelected = selectedThreat?.id === t.id;
              let badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
              if (t.status === 'CRITICAL_THREAT' || t.status === 'HARDWARE_TAMPER') {
                badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
              } else if (t.status === 'WARNING_THREAT') {
                badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
              } else if (t.status === 'MITIGATED_QUARANTINED') {
                badgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
              }

              return (
                <div
                  key={t.id}
                  onClick={() => {
                    playTone(640, 0.03);
                    setSelectedThreat(t);
                  }}
                  className={`p-3 min-h-[60px] rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-emerald-950/50 border-emerald-400 shadow-[0_0_15px_rgba(0,255,65,0.2)]'
                      : 'bg-black/50 border-white/10 hover:border-emerald-500/40 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-white">{t.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono border font-bold ${badgeColor}`}>
                          {t.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-zinc-200 mt-1">{t.name}</h4>
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        มุม: {t.angle_deg}° • ระยะประชิด: {t.distance_pct}% • ความเสี่ยง: {(t.risk_score * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Threat Inspector Box */}
          {selectedThreat && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-950 via-black to-zinc-900 border border-emerald-500/40 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-mono font-bold text-amber-300">
                    FORENSIC TELEMETRY: {selectedThreat.id}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-zinc-400">
                  Risk: {(selectedThreat.risk_score * 100).toFixed(0)}%
                </span>
              </div>

              <div>
                <h5 className="text-sm font-bold text-white font-serif">{selectedThreat.name}</h5>
                <span className="text-xs text-cyan-400 font-mono block mt-0.5">
                  ประเภทภัย: {selectedThreat.threat_type}
                </span>
                <p className="text-xs text-zinc-300 mt-2 leading-relaxed font-sans bg-black/40 p-2.5 rounded-xl border border-white/5">
                  {selectedThreat.notes}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                <span className="text-[11px] font-bold text-amber-300 block">
                  มาตรการสยบภัยคุกคาม (Remediation Directive):
                </span>
                <p className="text-xs text-zinc-200 font-mono font-semibold">
                  &bull; {selectedThreat.mitigation}
                </p>
              </div>

              {selectedThreat.status !== 'MITIGATED_QUARANTINED' && selectedThreat.status !== 'NORMAL_RESOLVED' && (
                <button
                  onClick={() => handleMitigateThreat(selectedThreat.id)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-mono font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition"
                >
                  <Flame className="w-4 h-4" />
                  <span>บังคับใช้มาตรการ Fail-Closed &amp; กักโรคทันที</span>
                </button>
              )}

              {selectedThreat.status === 'MITIGATED_QUARANTINED' && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>เวกเตอร์นี้ถูกระงับสิทธิ์และกักโรคไว้ใน Module 17 เรียบร้อยแล้ว</span>
                </div>
              )}
            </div>
          )}

          {/* Audit Terminal Log */}
          <div className="p-3 rounded-xl bg-black/80 border border-emerald-500/20 font-mono text-[10px] space-y-1 text-emerald-400/90">
            <div className="flex items-center justify-between text-zinc-500 border-b border-white/5 pb-1 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-emerald-400" />
                <span>CHAMBER 11 TELEMETRY BUS</span>
              </span>
              <span>BLOCK #849202</span>
            </div>
            {logs.slice(0, 4).map((log, idx) => (
              <div key={idx} className="truncate">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chamber Audit Merkle Proof QR Overlay Modal */}
      {isQrModalOpen && (
        <div
          id="chamber-audit-qr-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsQrModalOpen(false)}
        >
          <div
            className="bg-zinc-950 border border-cyan-500/50 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(6,182,212,0.25)] font-mono text-zinc-200 relative space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    CHAMBER AUDIT MERKLE PROOF
                  </h3>
                  <p className="text-[10px] text-cyan-400">
                    Chamber 11 • SSoT Δ0 Telemetry Snapshot
                  </p>
                </div>
              </div>
              <button
                id="btn-close-chamber-qr-modal"
                onClick={() => setIsQrModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="ปิดหน้าต่าง QR Code"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scannable QR Code Canvas */}
            <div className="flex flex-col items-center justify-center p-5 bg-white rounded-xl shadow-inner mx-auto w-fit">
              <QRCodeSVG
                value={JSON.stringify({
                  protocol: 'ZYRQUEN-CHAMBER-AUDIT-v1.2',
                  chamber: 'Chamber 11: 8K Quantum Radar',
                  genesis_block: 849202,
                  merkle_proof_hash: '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68',
                  telemetry_snapshot: {
                    coherence_pct: 99.992,
                    cryo_temp_mk: 14.98,
                    active_vectors: threats.length,
                    threat_status: threats.some((t) => t.status === 'CRITICAL_THREAT') ? 'DEFENSE_ARMED' : 'NOMINAL_STABLE',
                    fail_closed_status: 'ACTIVE_FAIL_CLOSED_GATE'
                  },
                  pqc_algorithm: 'NIST FIPS 204 ML-DSA-87 (Dilithium-5)',
                  hsm_council: '10/10 REAL_HSM Council (Utimaco FIPS 140-3 Level 4)',
                  ssot_drift: '0.00%',
                  timestamp: new Date().toISOString()
                })}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Telemetry Snapshot Details */}
            <div className="bg-black/60 border border-zinc-800 rounded-xl p-3 space-y-2 text-[11px]">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Genesis Merkle Root:</span>
                <span className="text-emerald-400 font-bold">Block #849202</span>
              </div>
              <div className="p-2 rounded bg-zinc-900/80 border border-zinc-800 text-[10px] text-zinc-300 break-all font-mono">
                909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                <div className="p-2 rounded bg-zinc-900 border border-zinc-800 flex flex-col">
                  <span className="text-zinc-500">Coherence / Cryo:</span>
                  <span className="text-cyan-300 font-bold">99.992% • 14.98 mK</span>
                </div>
                <div className="p-2 rounded bg-zinc-900 border border-zinc-800 flex flex-col">
                  <span className="text-zinc-500">Active Vectors:</span>
                  <span className="text-amber-300 font-bold">{threats.length} Tracked</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                id="btn-copy-merkle-proof-hash"
                onClick={() => {
                  safeCopyToClipboard('909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68').then(() => {
                    setIsCopied(true);
                    playTone(880, 0.08);
                    setTimeout(() => setIsCopied(false), 2000);
                  });
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied Hash!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Merkle Hash</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsQrModalOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
