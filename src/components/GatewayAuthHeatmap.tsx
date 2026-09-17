import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import {
  ShieldAlert,
  Globe,
  Radio,
  Lock,
  AlertOctagon,
  Activity,
  Filter,
  RefreshCw,
  Flame,
  CheckCircle2,
  MapPin,
  Sliders,
  Download,
  Zap,
  BarChart3,
  Sparkles,
  Layers,
  Search,
} from 'lucide-react';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { SYSTEM_METADATA } from '../data/canonicalData';

// Geographic Regions Definition
export interface GeoRegion {
  id: string;
  code: string;
  name: string;
  country: string;
  flag: string;
  city: string;
  coords: string;
  asn: string;
  ipSubnet: string;
  baseLatencyMs: number;
}

export const GEO_REGIONS: GeoRegion[] = [
  { id: 'REG-01', code: 'US-EAST', name: 'North America (East)', country: 'United States', flag: '🇺🇸', city: 'Ashburn, VA', coords: '39.0438° N, 77.4874° W', asn: 'AS13335 (Cloudflare/Proxy)', ipSubnet: '198.51.100.0/24', baseLatencyMs: 184 },
  { id: 'REG-02', code: 'US-WEST', name: 'North America (West)', country: 'United States', flag: '🇺🇸', city: 'San Jose, CA', coords: '37.3382° N, 121.8863° W', asn: 'AS16509 (Amazon AWS)', ipSubnet: '203.0.113.0/24', baseLatencyMs: 198 },
  { id: 'REG-03', code: 'EU-WEST', name: 'Western Europe (FRA)', country: 'Germany', flag: '🇩🇪', city: 'Frankfurt', coords: '50.1109° N, 8.6821° E', asn: 'AS24940 (Hetzner Cloud)', ipSubnet: '185.12.64.0/22', baseLatencyMs: 162 },
  { id: 'REG-04', code: 'EU-LON', name: 'Western Europe (LON)', country: 'United Kingdom', flag: '🇬🇧', city: 'London', coords: '51.5074° N, 0.1278° W', asn: 'AS5580 (Arelion AB)', ipSubnet: '194.72.0.0/20', baseLatencyMs: 168 },
  { id: 'REG-05', code: 'EA-TYO', name: 'East Asia (TYO)', country: 'Japan', flag: '🇯🇵', city: 'Tokyo', coords: '35.6762° N, 139.6503° E', asn: 'AS2516 (KDDI Corp)', ipSubnet: '210.140.0.0/19', baseLatencyMs: 78 },
  { id: 'REG-06', code: 'EA-SEL', name: 'East Asia (SEL)', country: 'South Korea', flag: '🇰🇷', city: 'Seoul', coords: '37.5665° N, 126.9780° E', asn: 'AS4766 (Korea Telecom)', ipSubnet: '211.233.0.0/19', baseLatencyMs: 84 },
  { id: 'REG-07', code: 'SE-SIN', name: 'Southeast Asia (SIN)', country: 'Singapore', flag: '🇸🇬', city: 'Singapore', coords: '1.3521° N, 103.8198° E', asn: 'AS4657 (StarHub Ltd)', ipSubnet: '183.90.0.0/19', baseLatencyMs: 32 },
  { id: 'REG-08', code: 'SE-BKK', name: 'Southeast Asia (BKK)', country: 'Thailand', flag: '🇹🇭', city: 'Bangkok', coords: '13.7563° N, 100.5018° E', asn: 'AS23969 (TOT Public Co)', ipSubnet: '125.24.0.0/18', baseLatencyMs: 1.2 },
  { id: 'REG-09', code: 'EE-MOW', name: 'Eastern Europe (MOW)', country: 'Russia', flag: '🇷🇺', city: 'Moscow', coords: '55.7558° N, 37.6173° E', asn: 'AS12389 (Rostelecom)', ipSubnet: '178.62.0.0/19', baseLatencyMs: 195 },
  { id: 'REG-10', code: 'SA-SAO', name: 'South America (SAO)', country: 'Brazil', flag: '🇧🇷', city: 'São Paulo', coords: '23.5505° S, 46.6333° W', asn: 'AS28573 (Claro Brasil)', ipSubnet: '189.100.0.0/18', baseLatencyMs: 245 },
  { id: 'REG-11', code: 'ME-DXB', name: 'Middle East (DXB)', country: 'United Arab Emirates', flag: '🇦🇪', city: 'Dubai', coords: '25.2048° N, 55.2708° E', asn: 'AS5384 (Emirates Telecom)', ipSubnet: '195.229.0.0/19', baseLatencyMs: 112 },
  { id: 'REG-12', code: 'OC-SYD', name: 'Oceania (SYD)', country: 'Australia', flag: '🇦🇺', city: 'Sydney', coords: '33.8688° S, 151.2093° E', asn: 'AS1221 (Telstra Corp)', ipSubnet: '139.130.0.0/19', baseLatencyMs: 142 },
];

export interface AttackVectorDef {
  id: string;
  name: string;
  shortName: string;
  port: number;
  protocol: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  defenseGate: string;
  color: string;
}

export const ATTACK_VECTORS: AttackVectorDef[] = [
  { id: 'VEC-01', name: 'ML-DSA-87 Lattice Signature Mismatch', shortName: 'ML-DSA-87 Mismatch', port: 8443, protocol: 'TLS 1.3 / PQC', severity: 'CRITICAL', defenseGate: 'Lattice Signature Verifier (Fail-Closed)', color: '#ef4444' },
  { id: 'VEC-02', name: 'Cryptographic Nonce Replay & Collision', shortName: 'Nonce Replay / Collision', port: 9443, protocol: 'HSM Enclave Sync', severity: 'HIGH', defenseGate: 'Monotonic Counter & Replay Cache', color: '#f97316' },
  { id: 'VEC-03', name: 'Forged Sovereign Passport (#EP-FAKE)', shortName: 'Forged Custodian Passport', port: 443, protocol: 'mTLS Sovereign Gateway', severity: 'CRITICAL', defenseGate: 'Thai Custodian Quorum Registry', color: '#e11d48' },
  { id: 'VEC-04', name: 'Unauthorized Root RPC Injection', shortName: 'Unauthorized Root RPC', port: 2222, protocol: 'Sovereign Control Plane', severity: 'HIGH', defenseGate: 'Executive Passport Veto Gate', color: '#f59e0b' },
  { id: 'VEC-05', name: 'Quorum Impersonation Probe (8/10)', shortName: 'Quorum Impersonation', port: 50051, protocol: 'gRPC Consensus Fabric', severity: 'HIGH', defenseGate: '10/10 REAL_HSM Attestation Ring', color: '#8b5cf6' },
  { id: 'VEC-06', name: 'Out-of-Spec Merkle Leaf Mutation', shortName: 'Merkle Leaf Mutation', port: 8080, protocol: 'Ledger Intake Pipe', severity: 'MEDIUM', defenseGate: 'Zero-Mutation SSoT Read-Only Kernel', color: '#06b6d4' },
];

// 2D Matrix Heatmap Point for Recharts ScatterChart
export interface HeatmapCellData {
  regionIndex: number;
  vectorIndex: number;
  regionId: string;
  regionCode: string;
  regionName: string;
  country: string;
  flag: string;
  city: string;
  coords: string;
  vectorId: string;
  vectorName: string;
  port: number;
  count: number;
  baseCount: number;
  primarySubnet: string;
  asn: string;
  defenseGate: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  lastAttemptTime: string;
  samplePacketHash: string;
}

// Initial baseline distribution matrix (12 regions x 6 attack vectors = 72 cells)
const GENERATE_HEATMAP_DATA = (): HeatmapCellData[] => {
  const cells: HeatmapCellData[] = [];

  GEO_REGIONS.forEach((region, rIdx) => {
    ATTACK_VECTORS.forEach((vector, vIdx) => {
      // Deterministic pseudo-random seed distribution reflecting typical Internet telemetry
      const seed = ((rIdx + 1) * 37 + (vIdx + 1) * 19) % 100;
      let count = 0;

      // Realistic weighting: US-East, Eastern Europe, and East Asia typically see higher botnet scanning
      if (region.code === 'US-EAST' || region.code === 'EE-MOW') {
        count = Math.floor(180 + seed * 6.5);
      } else if (region.code === 'EU-WEST' || region.code === 'EA-TYO' || region.code === 'SE-SIN') {
        count = Math.floor(60 + seed * 3.2);
      } else if (region.code === 'SE-BKK') {
        // Domestic origin: primarily controlled internal tests, low failed volume
        count = Math.floor(8 + seed * 0.4);
      } else {
        count = Math.floor(25 + seed * 1.8);
      }

      // Vectors 01 (Lattice Mismatch) and 03 (Forged Passport) are heavily targeted
      if (vector.id === 'VEC-01') count = Math.round(count * 1.35);
      if (vector.id === 'VEC-03') count = Math.round(count * 1.15);

      const packetHash = `0x${((rIdx + 1) * 123456789 ^ (vIdx + 1) * 987654321).toString(16).padStart(16, '0')}`;

      cells.push({
        regionIndex: rIdx,
        vectorIndex: vIdx,
        regionId: region.id,
        regionCode: region.code,
        regionName: region.name,
        country: region.country,
        flag: region.flag,
        city: region.city,
        coords: region.coords,
        vectorId: vector.id,
        vectorName: vector.name,
        port: vector.port,
        count,
        baseCount: count,
        primarySubnet: region.ipSubnet,
        asn: region.asn,
        defenseGate: vector.defenseGate,
        severity: vector.severity,
        lastAttemptTime: `${Math.floor(Math.random() * 45 + 1)}s ago`,
        samplePacketHash: packetHash,
      });
    });
  });

  return cells;
};

// 24-Hour Timeline Dataset of Intercepted Auth Attempts Stacked by Macro-Region
export interface HourlyGeoFailureRecord {
  hour: string;
  northAmerica: number;
  westernEurope: number;
  eastAsia: number;
  southeastAsia: number;
  easternEurope: number;
  latinAmericaMiddleEast: number;
  total: number;
}

const GENERATE_24H_GEO_TREND = (): HourlyGeoFailureRecord[] => {
  const hours = [
    '00:00', '02:00', '04:00', '06:00', '08:00', '10:00',
    '12:00', '14:00', '16:00', '18:00', '20:00', '22:00',
  ];

  return hours.map((hour, idx) => {
    const diurnalFactor = Math.sin((idx / 12) * Math.PI * 2);
    const na = Math.round(180 + diurnalFactor * 60 + Math.random() * 20);
    const eu = Math.round(120 + Math.cos((idx / 12) * Math.PI * 2) * 45 + Math.random() * 15);
    const ea = Math.round(140 + Math.sin((idx / 12 + 0.3) * Math.PI * 2) * 50 + Math.random() * 18);
    const sea = Math.round(45 + Math.random() * 12);
    const ee = Math.round(160 + diurnalFactor * 40 + Math.random() * 25);
    const lame = Math.round(55 + Math.random() * 15);

    return {
      hour,
      northAmerica: na,
      westernEurope: eu,
      eastAsia: ea,
      southeastAsia: sea,
      easternEurope: ee,
      latinAmericaMiddleEast: lame,
      total: na + eu + ea + sea + ee + lame,
    };
  });
};

export const GatewayAuthHeatmap: React.FC = () => {
  const [heatmapData, setHeatmapData] = useState<HeatmapCellData[]>(() => GENERATE_HEATMAP_DATA());
  const [hourlyTrend, setHourlyTrend] = useState<HourlyGeoFailureRecord[]>(() => GENERATE_24H_GEO_TREND());
  const [selectedGateway, setSelectedGateway] = useState<string>('GATEWAY-SEC-909');
  const [timeWindow, setTimeWindow] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [selectedSeverity, setSelectedSeverity] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [selectedVectorFilter, setSelectedVectorFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCell, setSelectedCell] = useState<HeatmapCellData | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'hourly' | 'regions'>('matrix');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSimulatingBurst, setIsSimulatingBurst] = useState<boolean>(false);

  // Compute aggregate metrics
  const totalBlockedAttempts = useMemo(() => {
    return heatmapData.reduce((acc, c) => acc + c.count, 0);
  }, [heatmapData]);

  const topOriginRegion = useMemo(() => {
    const regionTotals = GEO_REGIONS.map((reg) => {
      const sum = heatmapData
        .filter((c) => c.regionId === reg.id)
        .reduce((acc, c) => acc + c.count, 0);
      return { region: reg, total: sum };
    });
    regionTotals.sort((a, b) => b.total - a.total);
    return regionTotals[0];
  }, [heatmapData]);

  // Filtered heatmap dataset for Recharts ScatterChart
  const filteredData = useMemo(() => {
    return heatmapData.filter((c) => {
      if (selectedSeverity !== 'ALL' && c.severity !== selectedSeverity) return false;
      if (selectedVectorFilter !== 'ALL' && c.vectorId !== selectedVectorFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          c.regionName.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.vectorName.toLowerCase().includes(q) ||
          c.primarySubnet.toLowerCase().includes(q) ||
          c.asn.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [heatmapData, selectedSeverity, selectedVectorFilter, searchQuery]);

  // Color mapper based on failure density
  const getCellColor = (count: number): string => {
    if (count > 500) return '#ef4444'; // Red 500
    if (count > 250) return '#f97316'; // Orange 500
    if (count > 100) return '#f59e0b'; // Amber 500
    if (count > 40) return '#10b981'; // Emerald 500
    return '#06b6d4'; // Cyan 500
  };

  const getCellGlow = (count: number): string => {
    if (count > 500) return 'rgba(239, 68, 68, 0.4)';
    if (count > 250) return 'rgba(249, 115, 22, 0.3)';
    if (count > 100) return 'rgba(245, 158, 11, 0.25)';
    return 'rgba(6, 182, 212, 0.2)';
  };

  // Simulate an adversarial authentication probe burst
  const handleSimulateProbeBurst = () => {
    setIsSimulatingBurst(true);
    playTone(850, 0.08, 'sawtooth');

    // Pick random region and vector
    const randomRegionIdx = Math.floor(Math.random() * GEO_REGIONS.length);
    const randomVectorIdx = Math.floor(Math.random() * ATTACK_VECTORS.length);
    const targetRegion = GEO_REGIONS[randomRegionIdx];
    const targetVector = ATTACK_VECTORS[randomVectorIdx];
    const burstVolume = Math.floor(Math.random() * 120 + 60);

    setTimeout(() => {
      setHeatmapData((prev) =>
        prev.map((c) => {
          if (c.regionIndex === randomRegionIdx && c.vectorIndex === randomVectorIdx) {
            return {
              ...c,
              count: c.count + burstVolume,
              lastAttemptTime: 'Just now (INTERCEPTED)',
              samplePacketHash: `0xBURST_${Date.now().toString(16).toUpperCase()}`,
            };
          }
          return c;
        })
      );

      setHourlyTrend((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last) {
          next[next.length - 1] = {
            ...last,
            total: last.total + burstVolume,
          };
        }
        return next;
      });

      setIsSimulatingBurst(false);
      playAuditChime();
      setToastMessage(
        `🚨 Ingress Interception: ${burstVolume} blocked attempts from ${targetRegion.flag} ${targetRegion.name} (${targetVector.shortName}) - FAIL-CLOSED ENFORCED.`
      );
      setTimeout(() => setToastMessage(null), 5000);
    }, 450);
  };

  // Reset heatmap data back to baseline
  const handleResetBaseline = () => {
    playTone(520, 0.05);
    setHeatmapData(GENERATE_HEATMAP_DATA());
    setToastMessage('Sovereign Gateway Auth Heatmap telemetry reset to baseline.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Export JSON Telemetry for SIEM / offline analysis
  const handleExportJson = () => {
    playAuditChime();
    const exportPayload = {
      reportType: 'SOVEREIGN_GATEWAY_GEO_AUTH_HEATMAP_AUDIT',
      gatewayId: selectedGateway,
      timestampUtc: new Date().toUTCString(),
      timestampIct: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
      canonicalMerkleRoot: SYSTEM_METADATA.merkleRoot,
      sealedBlock: SYSTEM_METADATA.sealedBlock,
      totalInterceptions: totalBlockedAttempts,
      failClosedDefenseStatus: '100% BLOCKED (ZERO-BREACH GUARANTEE)',
      topOrigin: topOriginRegion.region.name,
      geoRegions: GEO_REGIONS,
      attackVectors: ATTACK_VECTORS,
      heatmapData: heatmapData,
      hourlyTrend: hourlyTrend,
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportPayload, null, 2))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `sovereign-gateway-failed-auth-heatmap-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setToastMessage('Downloaded Geo Auth Heatmap JSON Telemetry.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Custom Tooltip for the Recharts Scatter Heatmap
  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: HeatmapCellData = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="p-4 rounded-2xl bg-zinc-950/95 border border-red-500/40 backdrop-blur-xl shadow-[0_0_25px_rgba(239,68,68,0.3)] font-mono text-xs max-w-sm space-y-2.5 z-50 pointer-events-none">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{data.flag}</span>
            <div>
              <span className="text-white font-bold block">{data.country}</span>
              <span className="text-[10px] text-zinc-400">{data.city} ({data.regionCode})</span>
            </div>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              data.severity === 'CRITICAL'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : data.severity === 'HIGH'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            }`}
          >
            {data.severity}
          </span>
        </div>

        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between text-zinc-400">
            <span>Target Vector:</span>
            <span className="text-amber-300 font-bold">{data.vectorName}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Gateway Port:</span>
            <span className="text-cyan-400">Port {data.port}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Blocked Count:</span>
            <span className="text-red-400 font-bold text-sm">{data.count.toLocaleString()} attempts</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Source Subnet:</span>
            <span className="text-zinc-200">{data.primarySubnet}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Origin ASN:</span>
            <span className="text-zinc-300 truncate max-w-[180px]">{data.asn}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Coordinates:</span>
            <span className="text-zinc-400 text-[10px]">{data.coords}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Last Probe:</span>
            <span className="text-emerald-400">{data.lastAttemptTime}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
          <span className="text-zinc-400">Enforcement Gate:</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            FAIL-CLOSED BLOCKED
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-7 rounded-[28px] bg-gradient-to-br from-[#1b0a0a]/95 via-[#0f0b14]/90 to-[#07080F] border border-rose-500/30 backdrop-blur-2xl shadow-[0_0_50px_rgba(244,63,94,0.12)] relative overflow-hidden space-y-4">
        {/* Subtle Background Circuit Texture */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="px-3 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                SOVEREIGN GATEWAY INGRESS DEFENSE
              </span>
              <span className="px-3 py-0.5 rounded-full bg-amber-500/15 text-amber-200 border border-amber-500/30 text-xs font-mono font-bold">
                NIST FIPS 204 ML-DSA-87 ENFORCED
              </span>
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                100% FAIL-CLOSED • 0 BREACHES
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2.5">
              <span>Sovereign Gateway Auth Ingress Heatmap</span>
              <span className="text-xs px-2.5 py-0.5 rounded-lg bg-white/10 text-zinc-300 border border-white/10 font-normal">
                Recharts Geo-Telemetry
              </span>
            </h2>

            <p className="text-xs text-zinc-400 font-mono mt-1.5 max-w-3xl leading-relaxed">
              การกระจายเชิงภูมิศาสตร์แบบ Heatmap ของความพยายามยืนยันตัวตนที่ล้มเหลว (Failed Auth Attempts) ต่อ Sovereign Gateway เฝ้าระวังการโจมตีซ้ำ (Replay Attack), ความผิดพลาดของลายมือชื่อ ML-DSA-87, และการปลอมแปลงพาสปอร์ตผู้พิทักษ์
            </p>
          </div>

          {/* Quick Stats Grid in Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono shrink-0">
            <div className="p-3 rounded-2xl bg-black/50 border border-white/10 space-y-0.5">
              <span className="text-[11px] text-zinc-400 block">Total Interceptions</span>
              <span className="text-lg font-bold text-rose-400">{totalBlockedAttempts.toLocaleString()}</span>
              <span className="text-[10px] text-zinc-500 block">Fail-closed dropped</span>
            </div>

            <div className="p-3 rounded-2xl bg-black/50 border border-white/10 space-y-0.5">
              <span className="text-[11px] text-zinc-400 block">Top Threat Origin</span>
              <span className="text-sm font-bold text-amber-300 truncate block">
                {topOriginRegion.region.flag} {topOriginRegion.region.code}
              </span>
              <span className="text-[10px] text-zinc-500 block">{topOriginRegion.total.toLocaleString()} probes</span>
            </div>

            <div className="p-3 rounded-2xl bg-black/50 border border-white/10 space-y-0.5 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-zinc-400 block">Active CIDR Blocks</span>
              <span className="text-lg font-bold text-cyan-300">72 Subnets</span>
              <span className="text-[10px] text-emerald-400 block">Zero Pass-Through</span>
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 font-mono text-xs relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Gateway Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-zinc-300">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-zinc-500 text-[11px]">Gateway:</span>
              <select
                value={selectedGateway}
                onChange={(e) => {
                  setSelectedGateway(e.target.value);
                  playTone(600, 0.04);
                }}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="GATEWAY-SEC-909" className="bg-zinc-900">GATEWAY-SEC-909 (Sovereign Core)</option>
                <option value="BKK-CORE-01" className="bg-zinc-900">BKK-CORE-01 (Bangkok Main)</option>
                <option value="FRA-EDGE-02" className="bg-zinc-900">FRA-EDGE-02 (Frankfurt Hub)</option>
                <option value="NRT-EDGE-03" className="bg-zinc-900">NRT-EDGE-03 (Tokyo Satellite)</option>
                <option value="SIN-HUB-04" className="bg-zinc-900">SIN-HUB-04 (Singapore Relay)</option>
                <option value="IAD-RELAY-05" className="bg-zinc-900">IAD-RELAY-05 (Ashburn Edge)</option>
              </select>
            </div>

            {/* Time Window Buttons */}
            <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1">
              {(['1h', '6h', '24h', '7d'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => {
                    setTimeWindow(w);
                    playTone(560, 0.03);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    timeWindow === w ? 'bg-rose-500/20 text-rose-200 font-bold border border-rose-500/40' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {w.toUpperCase()}
                </button>
              ))}
            </div>

            {/* View Tab Switcher */}
            <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => {
                  setActiveTab('matrix');
                  playTone(600, 0.03);
                }}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'matrix' ? 'bg-white/15 text-white font-bold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Heat Matrix (Recharts)</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('hourly');
                  playTone(620, 0.03);
                }}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'hourly' ? 'bg-white/15 text-white font-bold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>24H Temporal Trend</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('regions');
                  playTone(640, 0.03);
                }}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'regions' ? 'bg-white/15 text-white font-bold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Region Registry</span>
              </button>
            </div>
          </div>

          {/* Interactive Trigger Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateProbeBurst}
              disabled={isSimulatingBurst}
              className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all ${
                isSimulatingBurst
                  ? 'bg-rose-500/30 border-rose-500/50 text-rose-200 animate-pulse'
                  : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
              }`}
              title="Simulate an adversarial attack probe against the gateway"
            >
              <Zap className={`w-3.5 h-3.5 text-rose-400 ${isSimulatingBurst ? 'animate-bounce' : ''}`} />
              <span>Simulate Attack Probe</span>
            </button>

            <button
              onClick={handleResetBaseline}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all"
              title="Reset heatmap data to baseline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all"
              title="Download full failed authentication telemetry as JSON"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-zinc-900/95 border border-rose-500/50 text-rose-200 font-mono text-xs flex items-center justify-between gap-3 shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-zinc-400 hover:text-white text-xs px-2 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Sub-bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 font-mono text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-zinc-400">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <span>Filters:</span>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1">
            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => {
                  setSelectedSeverity(sev);
                  playTone(580, 0.02);
                }}
                className={`px-2.5 py-0.5 rounded-lg transition-all ${
                  selectedSeverity === sev
                    ? 'bg-rose-500/20 text-rose-200 font-bold border border-rose-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Vector Selector */}
          <select
            value={selectedVectorFilter}
            onChange={(e) => {
              setSelectedVectorFilter(e.target.value);
              playTone(600, 0.02);
            }}
            className="px-3 py-1 rounded-xl bg-black/40 border border-white/10 text-zinc-300 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All 6 Attack Vectors</option>
            {ATTACK_VECTORS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.shortName} (Port {v.port})
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search country, IP, ASN, vector..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/40 text-xs"
          />
        </div>
      </div>

      {/* 2. Main Visualization: TAB 1 - Recharts Heat Matrix */}
      {activeTab === 'matrix' && (
        <div className="p-6 rounded-[28px] bg-zinc-950/90 border border-white/10 backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  2D Geographic Auth Ingress Heatmap Matrix (12 Regions × 6 Vectors)
                </h3>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                แกน X แทนภูมิภาคต้นทาง • แกน Y แทนประเภทการโจมตี • ขนาดและสีของเซลล์แสดงความหนาแน่นของการดักจับ
              </p>
            </div>

            {/* Heat Intensity Legend */}
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-zinc-500">Density:</span>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-cyan-500 inline-block" title="< 40 attempts" />
                <span className="text-zinc-400">&lt;40</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" title="40-100 attempts" />
                <span className="text-zinc-400">100</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block" title="100-250 attempts" />
                <span className="text-zinc-400">250</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-orange-500 inline-block" title="250-500 attempts" />
                <span className="text-zinc-400">500</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-rose-500 inline-block" title="> 500 attempts" />
                <span className="text-zinc-400">&gt;500</span>
              </div>
            </div>
          </div>

          {/* Recharts ScatterChart Heatmap */}
          <div className="w-full h-[420px] bg-black/40 rounded-2xl border border-white/5 p-2 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 160 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  type="number"
                  dataKey="regionIndex"
                  name="Region"
                  domain={[-0.5, 11.5]}
                  ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]}
                  tickFormatter={(val) => GEO_REGIONS[val]?.code || ''}
                  stroke="#71717a"
                  tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }}
                />
                <YAxis
                  type="number"
                  dataKey="vectorIndex"
                  name="Vector"
                  domain={[-0.5, 5.5]}
                  ticks={[0, 1, 2, 3, 4, 5]}
                  tickFormatter={(val) => ATTACK_VECTORS[val]?.shortName || ''}
                  stroke="#71717a"
                  tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }}
                  width={150}
                />
                <ZAxis
                  type="number"
                  dataKey="count"
                  range={[120, 680]}
                  name="Attempts"
                />
                <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#ef4444' }} />
                <Scatter
                  data={filteredData}
                  onClick={(entry: any) => {
                    if (entry && entry.payload) {
                      setSelectedCell(entry.payload as HeatmapCellData);
                    } else if (entry && (entry as HeatmapCellData).regionId) {
                      setSelectedCell(entry as HeatmapCellData);
                    }
                    playTone(700, 0.04);
                  }}
                  className="cursor-pointer"
                >
                  {filteredData.map((entry, index) => {
                    const color = getCellColor(entry.count);
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={color}
                        fillOpacity={0.88}
                        stroke={selectedCell?.regionId === entry.regionId && selectedCell?.vectorId === entry.vectorId ? '#ffffff' : color}
                        strokeWidth={selectedCell?.regionId === entry.regionId && selectedCell?.vectorId === entry.vectorId ? 3 : 1}
                      />
                    );
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Selected Cell Telemetry Inspector Drawer */}
          {selectedCell && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-zinc-950 via-black to-zinc-950 border border-rose-500/40 space-y-3 font-mono text-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedCell.flag}</span>
                  <div>
                    <span className="text-white font-bold text-sm">
                      {selectedCell.country} — {selectedCell.city} ({selectedCell.regionName})
                    </span>
                    <span className="text-zinc-400 text-[11px]">
                      Coordinates: {selectedCell.coords} • ASN: {selectedCell.asn}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCell(null)}
                  className="text-zinc-400 hover:text-white px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10"
                >
                  Close Inspector
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[10px] text-zinc-500 block">Attacking Ingress Vector</span>
                  <span className="text-amber-400 font-bold block truncate">{selectedCell.vectorName}</span>
                  <span className="text-[10px] text-cyan-400">Target Port {selectedCell.port}</span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[10px] text-zinc-500 block">Blocked Volume</span>
                  <span className="text-rose-400 font-bold text-base block">{selectedCell.count.toLocaleString()} attempts</span>
                  <span className="text-[10px] text-emerald-400">100% Intercepted</span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[10px] text-zinc-500 block">Primary Subnet & Hash</span>
                  <span className="text-zinc-200 font-mono block truncate">{selectedCell.primarySubnet}</span>
                  <span className="text-[10px] text-zinc-500 font-mono block truncate">{selectedCell.samplePacketHash}</span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[10px] text-zinc-500 block">Active Defense Enforcement</span>
                  <span className="text-emerald-300 font-bold block truncate">{selectedCell.defenseGate}</span>
                  <span className="text-[10px] text-rose-400">STATUS: FAIL_CLOSED_DROPPED</span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Footnote Matrix Guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <span className="text-white font-bold block">Fail-Closed Boundary</span>
                <span className="text-zinc-400 text-[11px]">
                  All ingress attempts lacking valid ML-DSA-87 attestation are dropped at the network interface layer before reaching the kernel.
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-white font-bold block">12 Edge Ingress Points</span>
                <span className="text-zinc-400 text-[11px]">
                  Geographic correlation maps IPs to regional ASNs across North America, Europe, Asia-Pacific, and South America.
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-white font-bold block">Continuous Nonce Verification</span>
                <span className="text-zinc-400 text-[11px]">
                  Monotonic counters guarantee zero replay tolerance; repeated packet hashes are quarantined permanently.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Visualization: TAB 2 - 24-Hour Temporal Trend (Recharts Area / Bar Chart) */}
      {activeTab === 'hourly' && (
        <div className="p-6 rounded-[28px] bg-zinc-950/90 border border-white/10 backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  24-Hour Temporal Distribution of Failed Auth Probes by Macro-Region
                </h3>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                แนวโน้มปริมาณการตรวจจับการโจมตีแบบแบ่งตามกลุ่มทวีปตลอด 24 ชั่วโมงที่ผ่านมา
              </p>
            </div>

            <span className="text-xs font-mono text-cyan-400 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              Peak: 20:00 UTC (882 Blocked/hr)
            </span>
          </div>

          <div className="w-full h-[360px] bg-black/40 rounded-2xl border border-white/5 p-3 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTrend} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="gradNA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="gradEE" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="gradEA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="gradEU" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="hour" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }} />
                <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#3f3f46', borderRadius: '12px', fontFamily: 'monospace', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px' }} />
                <Area type="monotone" dataKey="northAmerica" name="North America" stackId="1" stroke="#ef4444" fill="url(#gradNA)" />
                <Area type="monotone" dataKey="easternEurope" name="Eastern Europe" stackId="1" stroke="#f97316" fill="url(#gradEE)" />
                <Area type="monotone" dataKey="eastAsia" name="East Asia" stackId="1" stroke="#06b6d4" fill="url(#gradEA)" />
                <Area type="monotone" dataKey="westernEurope" name="Western Europe" stackId="1" stroke="#10b981" fill="url(#gradEU)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. Visualization: TAB 3 - Region Registry Table */}
      {activeTab === 'regions' && (
        <div className="p-6 rounded-[28px] bg-zinc-950/90 border border-white/10 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Geographic Origin Threat Matrix (12 Sovereign Edge Points)</span>
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                สรุปยอดสถิติความพยายามยืนยันตัวตนที่ถูกบล็อกแยกรายภูมิภาคและซับเน็ตต้นทาง
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 text-[11px]">
                  <th className="pb-3 px-3">REGION</th>
                  <th className="pb-3 px-3">COUNTRY / CITY</th>
                  <th className="pb-3 px-3">PRIMARY IP SUBNET</th>
                  <th className="pb-3 px-3">ORIGIN ASN</th>
                  <th className="pb-3 px-3">LATENCY</th>
                  <th className="pb-3 px-3 text-right">TOTAL ATTEMPTS</th>
                  <th className="pb-3 px-3 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {GEO_REGIONS.map((reg) => {
                  const regAttempts = heatmapData
                    .filter((c) => c.regionId === reg.id)
                    .reduce((sum, c) => sum + c.count, 0);

                  return (
                    <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                        <span>{reg.flag}</span>
                        <span>{reg.code}</span>
                      </td>
                      <td className="py-3 px-3 text-zinc-200">
                        {reg.name} <span className="text-zinc-500">({reg.city})</span>
                      </td>
                      <td className="py-3 px-3 text-zinc-300">{reg.ipSubnet}</td>
                      <td className="py-3 px-3 text-zinc-400 truncate max-w-[200px]">{reg.asn}</td>
                      <td className="py-3 px-3 text-cyan-400">{reg.baseLatencyMs} ms</td>
                      <td className="py-3 px-3 text-right font-bold text-rose-400">
                        {regAttempts.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          BLOCKED
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
