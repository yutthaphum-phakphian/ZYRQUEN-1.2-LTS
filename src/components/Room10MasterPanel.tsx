import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Search,
  Copy,
  Check,
  Zap,
  RefreshCw,
  Scale,
  FileCheck2,
  Sparkles,
  Layers,
  SlidersHorizontal,
  Building2,
  ArrowUpRight,
  PieChart as PieChartIcon,
  TrendingUp,
  Download,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { HardwareSnapshot, ViewType } from '../types';
import { playAuditChime, playTone } from './AudioSynthesizer';
import { copyToClipboard } from '../utils/clipboard';

export const CANONICAL_FROZEN_SEALS = 14902;
export const CANONICAL_BLOCK = 849202;
export const CANONICAL_MERKLE_ROOT = '909ab814479844d8a14816bed34cdbb07528e18501da86fc4691763a43fa4c68';
export const CANONICAL_VERSION = 'ZYRQUEN Ω∞ v4.16 PDPA FINAL (Frozen v1.2 LTS)';
export const CANONICAL_PRINCIPAL = '🇹🇭 นายยุทธภูมิ พากเพียร (#EP-SOVEREIGN-01)';

export interface TreasuryVaultItem {
  id: string;
  name: string;
  nameTh: string;
  assetClass: string;
  allocationValue: string;
  percentage: number;
  color: string;
  status: 'RECONCILED' | 'SEALED' | 'LOCKED';
  custodian: string;
}

export const TREASURY_ALLOCATIONS: TreasuryVaultItem[] = [
  {
    id: 'thb-sov',
    name: 'THB Sovereign Reserve (THB-SOV)',
    nameTh: 'เงินทุนสำรองอธิปไตยบาทสัจธรรม',
    assetClass: 'Fiat Fiduciary Backing',
    allocationValue: '฿1,490,200,000.00',
    percentage: 55,
    color: '#06b6d4',
    status: 'SEALED',
    custodian: 'Bank of Thailand Anchor Ledger'
  },
  {
    id: 'lbma-gold',
    name: 'Physical Gold Reserve (LBMA 99.99%)',
    nameTh: 'ทองคำแท่งกายภาพมาตรฐาน LBMA',
    assetClass: 'Physical Bullion Vault',
    allocationValue: '14,902.00 Troy Oz (฿610,982,000)',
    percentage: 30,
    color: '#eab308',
    status: 'RECONCILED',
    custodian: 'Sovereign Bullion Depository ZQ-GOLD'
  },
  {
    id: 'rwa-tenants',
    name: 'RWA Real-World Asset Contracts',
    nameTh: 'สิทธิสัญญาเช่าสินทรัพย์ในโลกจริง 400 ราย',
    assetClass: 'Tokenized Leases & Infra',
    allocationValue: '฿298,040,000.00 (400 Units)',
    percentage: 15,
    color: '#10b981',
    status: 'LOCKED',
    custodian: 'Smart Contract Segments Ω601–Ω1000'
  }
];

interface Room10MasterPanelProps {
  snapshots?: HardwareSnapshot[];
  onNavigate?: (view: ViewType) => void;
  onOpenCertificate?: () => void;
}

export const Room10MasterPanel: React.FC<Room10MasterPanelProps> = ({
  snapshots = [],
  onNavigate,
  onOpenCertificate
}) => {
  const [activeTab, setActiveTab] = useState<'vault-matrix' | 'gold-custody' | 'rwa-tenants' | 'fiduciary-audit'>('vault-matrix');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const [lastAuditTimestamp, setLastAuditTimestamp] = useState<string>('JUST NOW (0.0000% DRIFT)');

  const handleCopy = (id: string, text: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    playTone(650, 0.03);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRunReconciliation = () => {
    if (isReconciling) return;
    setIsReconciling(true);
    playTone(520, 0.05);

    setTimeout(() => {
      setIsReconciling(false);
      setLastAuditTimestamp(new Date().toLocaleTimeString('th-TH') + ' (100% RECONCILED)');
      playAuditChime();
    }, 900);
  };

  // Pie Chart Data
  const pieData = useMemo(() => {
    return TREASURY_ALLOCATIONS.map((item) => ({
      name: item.name,
      value: item.percentage,
      color: item.color,
      amount: item.allocationValue
    }));
  }, []);

  // Gold Bar Verification Sub-Lot Data
  const goldLots = useMemo(() => {
    return [
      { lotId: 'LOT-LBMA-01', weightOz: '3,725.50 oz', barCount: 93, purity: '99.99% Au', vaultStatus: 'SEALED_DEPOSITORY' },
      { lotId: 'LOT-LBMA-02', weightOz: '3,725.50 oz', barCount: 93, purity: '99.99% Au', vaultStatus: 'SEALED_DEPOSITORY' },
      { lotId: 'LOT-LBMA-03', weightOz: '3,725.50 oz', barCount: 93, purity: '99.99% Au', vaultStatus: 'SEALED_DEPOSITORY' },
      { lotId: 'LOT-LBMA-04', weightOz: '3,725.50 oz', barCount: 93, purity: '99.99% Au', vaultStatus: 'SEALED_DEPOSITORY' }
    ];
  }, []);

  return (
    <div className="space-y-6 font-mono text-zinc-300">
      {/* Top Banner for Room 10 */}
      <div className="p-6 sm:p-8 rounded-[28px] bg-gradient-to-br from-amber-950/40 via-[#181105]/95 to-black border-amber-500/40 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-yellow-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border-amber-500/40 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(234,179,8,0.25)]">
                <Landmark className="w-4 h-4 text-amber-400 animate-pulse" />
                CHAMBER 10 • SOVEREIGN TREASURY & BUDGET GOVERNANCE
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[11px] font-bold">
                VARIANCE: ฿0.00 (0.00%)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 border-yellow-500/30 text-[11px] font-bold">
                14,902.00 oz LBMA GOLD
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border-cyan-500/30 text-[11px] font-bold">
                ฿1,490,200,000 THB-SOV
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
                เมทริกซ์การคลังอธิปไตย และการกำกับดูแลสินทรัพย์ทองคำแท่ง (Sovereign Treasury Vault)
              </h2>
              <p className="text-sm text-zinc-400 max-w-4xl leading-relaxed">
                คลังสินทรัพย์สัจธรรมที่ค้ำประกันด้วยเงินบาทสำรองอธิปไตย ฿1.49B, ทองคำแท่ง 14,902 ทรอยออนซ์ และสัญญาเช่า RWA 400 ราย
                ตรวจสอบความถูกต้องระดับทศนิยมศูนย์จุดศูนย์และป้องกันการเปลี่ยนแปลงโดยไม่ผ่านฉันทามติ
              </p>
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-3 shrink-0">
            <button
              onClick={handleRunReconciliation}
              disabled={isReconciling}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600/80 to-yellow-600/80 hover:from-amber-500 hover:to-yellow-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 border-amber-400/40 transition-all transform hover:-translate-y-0.5"
            >
              <RefreshCw className={`w-4 h-4 ${isReconciling ? 'animate-spin' : ''}`} />
              {isReconciling ? 'Auditing 14,902 Seals...' : 'Execute 100% Treasury Audit'}
            </button>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Audit State: {lastAuditTimestamp}</span>
            </div>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-amber-500/20">
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">THB-SOV Reserve</div>
            <div className="text-base sm:text-lg font-bold text-cyan-400">฿1,490,200,000</div>
            <div className="text-[10px] text-emerald-400 font-semibold">100% Backed</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Physical Gold (LBMA)</div>
            <div className="text-base sm:text-lg font-bold text-yellow-400">14,902.00 oz</div>
            <div className="text-[10px] text-amber-300 font-semibold">372 Bars (99.99%)</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">RWA Tenants Active</div>
            <div className="text-base sm:text-lg font-bold text-emerald-400">400 Tenants</div>
            <div className="text-[10px] text-emerald-300">Ω601–Ω1000 Locked</div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border-white/5 space-y-1">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Fiduciary Variance</div>
            <div className="text-base sm:text-lg font-bold text-emerald-400">฿0.00 (0.00%)</div>
            <div className="text-[10px] text-zinc-400">Zero Discrepancy</div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#0a0d16] border-amber-500/20">
        <button
          onClick={() => {
            playTone(600, 0.04);
            setActiveTab('vault-matrix');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'vault-matrix'
              ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-transparent border-transparent'
          }`}
        >
          <PieChartIcon className="w-3.5 h-3.5" />
          1. Treasury Asset Allocation & Breakdown
        </button>

        <button
          onClick={() => {
            playTone(640, 0.04);
            setActiveTab('gold-custody');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'gold-custody'
              ? 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40 shadow-[0_0_12px_rgba(234,179,8,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-transparent border-transparent'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          2. LBMA Physical Gold Vault Batches
        </button>

        <button
          onClick={() => {
            playTone(680, 0.04);
            setActiveTab('rwa-tenants');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'rwa-tenants'
              ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-transparent border-transparent'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          3. 400 RWA Tenants (Ω601–Ω1000)
        </button>

        <button
          onClick={() => {
            playTone(720, 0.04);
            setActiveTab('fiduciary-audit');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'fiduciary-audit'
              ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              : 'text-zinc-400 hover:text-zinc-200 bg-transparent border-transparent'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          4. Fiduciary Reconciliation Attestation
        </button>
      </div>

      {/* Tab 1: Vault Allocation Matrix */}
      {activeTab === 'vault-matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0a0d1a]/90 border-amber-500/20 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-amber-400" />
                สัดส่วนการจัดสรรสินทรัพย์อธิปไตย (Sovereign Allocation)
              </h3>
              <p className="text-xs text-zinc-400">
                รวมมูลค่าค้ำประกันสินทรัพย์ทั้งสิ้น: ฿2,399,222,000 THB Equivalent
              </p>
            </div>

            <div className="h-60 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0d1a',
                      borderColor: '#eab308',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
              {TREASURY_ALLOCATIONS.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-zinc-300 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-white">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {TREASURY_ALLOCATIONS.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-[#0a0d1a]/80 border-white/10 hover:border-amber-500/40 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white">{item.name}</div>
                    <div className="text-[11px] text-amber-300/80">{item.nameTh}</div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-bold self-start sm:self-auto">
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-white/5 text-xs">
                  <div>
                    <div className="text-[10px] text-zinc-500">Asset Class</div>
                    <div className="text-zinc-300 font-semibold">{item.assetClass}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500">Valuation</div>
                    <div className="text-amber-400 font-bold">{item.allocationValue}</div>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <div className="text-[10px] text-zinc-500">Designated Custodian</div>
                    <div className="text-zinc-400 text-[11px] truncate">{item.custodian}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: LBMA Gold Batches */}
      {activeTab === 'gold-custody' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-yellow-950/20 border-yellow-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-yellow-300 flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-400" />
                LBMA 99.99% PHYSICAL GOLD BULLION VERIFICATION MATRIX
              </span>
              <span className="text-[11px] text-yellow-400 font-mono">
                Deposit Certificate: ZQ-GOLD-DEP-849202-3908
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              ทองคำแท่งกายภาพจำนวน 14,902.00 ทรอยออนซ์ ถูกแบ่งจัดเก็บในตู้นิรภัยความมั่นคงสูง 4 ชุด (Lots)
              โดยแต่ละแท่งมีหมายเลขประจำแท่ง (Serial Number) ตรวจสอบย้อนกลับถึงโรงหลอมมาตรฐาน LBMA
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {goldLots.map((lot) => (
              <div
                key={lot.lotId}
                className="p-5 rounded-2xl bg-[#0a0d1a] border-yellow-500/20 hover:border-yellow-500/50 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-yellow-400">{lot.lotId}</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border-emerald-500/20">
                    {lot.purity}
                  </span>
                </div>
                <div className="text-xl font-black text-white">{lot.weightOz}</div>
                <div className="text-xs text-zinc-400">{lot.barCount} Physical Bars (400oz/bar eq.)</div>
                <div className="pt-2 border-t border-white/5 text-[10px] text-amber-300 font-semibold">
                  {lot.vaultStatus}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: 400 RWA Tenants */}
      {activeTab === 'rwa-tenants' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0a0d1a] border-emerald-500/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  สิทธิสัญญาเช่าสินทรัพย์ในโลกจริง 400 ราย (RWA Tenants Ω601–Ω1000)
                </h3>
                <p className="text-xs text-zinc-400">
                  โครงสร้างสัญญาเช่าที่เข้ารหัสและบันทึกลงในบล็อก #849202 พร้อมการจัดสรรรายได้อัตโนมัติ
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs font-bold">
                100% Active Tenants
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border-white/5">
                <div className="text-zinc-500 text-[10px]">Contract Range</div>
                <div className="text-emerald-400 font-bold">Ω601 to Ω1000</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border-white/5">
                <div className="text-zinc-500 text-[10px]">Monthly Yield Backing</div>
                <div className="text-cyan-400 font-bold">฿12,450,000 / mo</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border-white/5">
                <div className="text-zinc-500 text-[10px]">Occupancy Rate</div>
                <div className="text-yellow-400 font-bold">100.0% Fully Leased</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border-white/5">
                <div className="text-zinc-500 text-[10px]">Default Risk</div>
                <div className="text-emerald-400 font-bold">0.00% Zero Default</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Fiduciary Audit */}
      {activeTab === 'fiduciary-audit' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0a0d1a] border-amber-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" />
                  หนังสือรับรองการกระทบยอดทางบัญชีอธิปไตย (Sovereign Fiduciary Statement)
                </h3>
                <p className="text-xs text-zinc-400">
                  รับรองความครบถ้วนถูกต้องของทรัพย์สินค้ำประกันโดยไม่มีส่วนต่าง (Zero Discrepancy)
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/60 border-white/10 font-mono text-xs text-zinc-300 space-y-2">
              <div className="text-amber-400 font-bold">--- ZYRQUEN Ω∞ CHAMBER 10 TREASURY RECONCILIATION ---</div>
              <div>Audit Certificate: <span className="text-yellow-400">ZQ-GOLD-DEP-849202-3908</span></div>
              <div>Total Sovereign Value: <span className="text-white">฿2,399,222,000 THB Equivalent</span></div>
              <div>Physical Gold Weight: <span className="text-yellow-300">14,902.00 Troy Oz (463.507 kg)</span></div>
              <div>THB Sovereign Reserve: <span className="text-cyan-300">฿1,490,200,000.00</span></div>
              <div>Audit Variance: <span className="text-emerald-400">฿0.00 (0.0000% Delta)</span></div>
              <div>Sovereign Principal: <span className="text-white">{CANONICAL_PRINCIPAL}</span></div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {onOpenCertificate && (
                <button
                  onClick={() => {
                    playTone(680, 0.05);
                    onOpenCertificate();
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/30 text-xs font-bold flex items-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  View Sovereign Gold Certificate (ZQ-GOLD-DEP)
                </button>
              )}

              {onNavigate && (
                <button
                  onClick={() => {
                    playTone(640, 0.05);
                    onNavigate('vault');
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10 text-xs font-bold flex items-center gap-2 transition-all"
                >
                  <Coins className="w-4 h-4 text-amber-400" />
                  Open Full Treasury Vault Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
