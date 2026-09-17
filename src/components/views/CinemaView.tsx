import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Film,
  Ticket,
  Clock,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Download,
  Terminal,
  Layers,
  Cpu,
  RefreshCw,
  Coins,
  Shield,
  Coffee,
  X,
  Volume2,
} from 'lucide-react';
import { playTone, playAuditChime, playWarningTone } from '../AudioSynthesizer';

interface Movie {
  id: string;
  title: string;
  genre: string;
  duration: string;
  rating: number;
  hallName: string;
  hallType: 'IMAX Laser 70mm' | 'Dolby Atmos' | 'Sovereign 4DX' | 'VIP Lounge';
  tagline: string;
  posterBg: string;
  showtimes: string[];
}

interface Seat {
  id: string;
  row: string;
  col: number;
  tier: 'VIP' | 'PREMIUM' | 'STANDARD';
  priceThb: number;
  status: 'available' | 'occupied' | 'selected';
}

interface ConcessionItem {
  id: string;
  name: string;
  thaiName: string;
  priceThb: number;
  icon: string;
}

const MOVIES: Movie[] = [
  {
    id: 'mov-1',
    title: 'The Quantum Matrix: Block #849202',
    genre: 'Sci-Fi / Cybernetic Thriller',
    duration: '142 mins',
    rating: 9.8,
    hallName: 'Hall 1 — Quantum Prime',
    hallType: 'IMAX Laser 70mm',
    tagline: 'When the Merkle Root reveals the hidden fabric of reality.',
    posterBg: 'from-cyan-950/80 via-blue-950/70 to-zinc-950',
    showtimes: ['11:30', '14:15', '17:00', '20:15', '23:00'],
  },
  {
    id: 'mov-2',
    title: 'Interstellar Odyssey: Sub-Kelvin Horizon',
    genre: 'Space Epic / Hard Sci-Fi',
    duration: '168 mins',
    rating: 9.6,
    hallName: 'Hall 2 — Atmos Echo',
    hallType: 'Dolby Atmos',
    tagline: 'Deep space exploration at 0.015 Kelvin cryogenic equilibrium.',
    posterBg: 'from-indigo-950/80 via-purple-950/70 to-zinc-950',
    showtimes: ['12:00', '15:30', '19:00', '22:15'],
  },
  {
    id: 'mov-3',
    title: 'Cybernetic Dawn: Zero Drift Genesis',
    genre: 'Action / Technoir',
    duration: '125 mins',
    rating: 9.4,
    hallName: 'Hall 3 — Citadel Immersion',
    hallType: 'Sovereign 4DX',
    tagline: 'A civilization governed by pure immutable cryptographic truth.',
    posterBg: 'from-rose-950/80 via-orange-950/70 to-zinc-950',
    showtimes: ['13:00', '16:00', '18:45', '21:30'],
  },
  {
    id: 'mov-4',
    title: 'Thai Sovereign Chronicles: The 18 Chambers',
    genre: 'Legal Thriller / Historical Epic',
    duration: '115 mins',
    rating: 9.9,
    hallName: 'Hall 4 — Sovereign Suite',
    hallType: 'VIP Lounge',
    tagline: 'From ETDA B.E. 2544 to the post-quantum constitutional order.',
    posterBg: 'from-amber-950/80 via-yellow-950/70 to-zinc-950',
    showtimes: ['11:00', '14:00', '17:30', '20:30'],
  },
];

const CONCESSIONS: ConcessionItem[] = [
  { id: 'cnc-1', name: 'Caramel Sovereign Popcorn', thaiName: 'ป๊อปคอร์นคาราเมลพรีเมียม', priceThb: 140, icon: '🍿' },
  { id: 'cnc-2', name: 'Truffle Butter Popcorn', thaiName: 'ป๊อปคอร์นเนยทรัฟเฟิล', priceThb: 170, icon: '🧈' },
  { id: 'cnc-3', name: 'Sub-Kelvin Nitrogen Soda', thaiName: 'ไนโตรเจนไซเบอร์โซดา', priceThb: 95, icon: '🥤' },
  { id: 'cnc-4', name: 'Grand Sovereign Combo', thaiName: 'เซ็ตคอมโบป๊อปคอร์น+เครื่องดื่ม', priceThb: 220, icon: '✨' },
];

const INITIAL_OCCUPIED = new Set([
  'C-4', 'C-5', 'D-6', 'D-7', 'E-5', 'E-6', 'E-7', 'E-8',
  'F-5', 'F-6', 'H-3', 'H-4', 'G-8', 'G-9'
]);

export const CinemaView: React.FC = () => {
  const [selectedMovie, setSelectedMovie] = useState<Movie>(MOVIES[0]);
  const [selectedShowtime, setSelectedShowtime] = useState<string>(MOVIES[0].showtimes[1]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>(['F-7', 'F-8']);
  const [concessionCart, setConcessionCart] = useState<Record<string, number>>({ 'cnc-4': 1 });
  const [custodianDiscount, setCustodianDiscount] = useState<boolean>(true);
  const [isBookedModalOpen, setIsBookedModalOpen] = useState<boolean>(false);
  const [bookingRef, setBookingRef] = useState<string>('TKT-CPP-2026-849202-F78');
  const [cppConsoleLogs, setCppConsoleLogs] = useState<string[]>([
    '[C++20 ENGINE] CinemaHall::loadLayout("Hall 1 — Quantum Prime") initialized. Capacity: 96 seats.',
    '[C++20 ENGINE] Mutex std::mutex m_seatLock ready. Thread pool active for seat lock concurrency.',
    '[C++20 ENGINE] Deserialized binary layout cache from cinema_manifest.bin [CRC32: 0x909AB814].',
  ]);

  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const getSeatTier = (row: string): { tier: 'VIP' | 'PREMIUM' | 'STANDARD'; price: number } => {
    if (row === 'H') return { tier: 'VIP', price: 350 };
    if (row === 'F' || row === 'G') return { tier: 'PREMIUM', price: 260 };
    return { tier: 'STANDARD', price: 180 };
  };

  const handleSeatClick = (seatId: string) => {
    if (INITIAL_OCCUPIED.has(seatId)) {
      playWarningTone();
      return;
    }

    setSelectedSeats(prev => {
      const isSelected = prev.includes(seatId);
      const next = isSelected ? prev.filter(id => id !== seatId) : [...prev, seatId];
      
      playTone(isSelected ? 380 : 520, 0.05);

      const [r, c] = seatId.split('-');
      const logEntry = isSelected
        ? `[C++ ENGINE] CinemaHall::releaseSeat('${r}', ${c}) -> Memory unlocked @ 0x${(0x7fff0000 + Math.floor(Math.random() * 0xffff)).toString(16)}`
        : `[C++ ENGINE] CinemaHall::reserveSeat('${r}', ${c}) -> Mutex acquired std::unique_lock<std::mutex> lock(m_seatLock)`;
      
      setCppConsoleLogs(logs => [logEntry, ...logs.slice(0, 12)]);
      return next;
    });
  };

  const toggleConcession = (id: string, delta: number) => {
    setConcessionCart(prev => {
      const current = prev[id] || 0;
      const nextVal = Math.max(0, current + delta);
      playTone(600 + nextVal * 40, 0.04);
      return { ...prev, [id]: nextVal };
    });
  };

  const seatsCost = useMemo(() => {
    return selectedSeats.reduce((acc, seatId) => {
      const row = seatId.charAt(0);
      return acc + getSeatTier(row).price;
    }, 0);
  }, [selectedSeats]);

  const concessionsCost = useMemo(() => {
    return Object.entries(concessionCart).reduce((acc, [id, qty]) => {
      const item = CONCESSIONS.find(c => c.id === id);
      return acc + (item ? item.priceThb * qty : 0);
    }, 0);
  }, [concessionCart]);

  const discountAmount = useMemo(() => {
    if (!custodianDiscount) return 0;
    return Math.round((seatsCost + concessionsCost) * 0.15);
  }, [seatsCost, concessionsCost, custodianDiscount]);

  const vatAmount = useMemo(() => {
    const sub = seatsCost + concessionsCost - discountAmount;
    return Math.round(sub * 0.07);
  }, [seatsCost, concessionsCost, discountAmount]);

  const grandTotal = useMemo(() => {
    return seatsCost + concessionsCost - discountAmount + vatAmount;
  }, [seatsCost, concessionsCost, discountAmount, vatAmount]);

  const handleConfirmBooking = () => {
    if (selectedSeats.length === 0) {
      playWarningTone();
      return;
    }
    const newRef = `TKT-CPP-${Date.now().toString().slice(-6)}-${selectedSeats.join('')}`;
    setBookingRef(newRef);
    playAuditChime();
    
    setCppConsoleLogs(logs => [
      `[C++ ENGINE] Booking confirmed: Order ID #${newRef}`,
      `[C++ ENGINE] Generated binary ticket blob (sizeof(Ticket) = 128 bytes)`,
      `[C++ ENGINE] Written to /var/data/tickets.dat [FLUSH_SYNC OK]`,
      ...logs.slice(0, 10),
    ]);

    setIsBookedModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-pink-950/30 via-zinc-900/60 to-purple-950/30 border border-pink-500/30 rounded-2xl p-6 backdrop-blur-xl shadow-[0_0_35px_rgba(236,72,153,0.12)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-300 shadow-[0_0_20px_rgba(236,72,153,0.25)] shrink-0">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  Cinema Ticket Management System
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40">
                  C++ PORTED ENGINE
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  MUTEX LOCKS: ENGAGED
                </span>
              </div>
              <p className="text-zinc-400 text-xs sm:text-sm mt-1">
                ระบบจัดการและสำรองที่นั่งภาพยนตร์ระดับอธิปไตย ดัดแปลงจากสถาปัตยกรรม C++ OOP (Class CinemaHall, Struct Seat, Mutex Concurrency, Binary File I/O)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-right font-mono">
              <div className="text-[10px] text-zinc-400 uppercase">Engine Architecture</div>
              <div className="text-xs font-bold text-pink-300">C++20 OOP Native</div>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-right font-mono">
              <div className="text-[10px] text-zinc-400 uppercase">Concurrency State</div>
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                THREAD-SAFE
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Movie Selector Horizontal Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Film className="w-4 h-4 text-pink-400" />
            Select Feature Presentation (เลือกรอบภาพยนตร์)
          </h2>
          <span className="text-xs text-zinc-400 font-mono">4 Halls Operational</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {MOVIES.map(movie => {
            const isSelected = selectedMovie.id === movie.id;
            return (
              <button
                key={movie.id}
                onClick={() => {
                  setSelectedMovie(movie);
                  setSelectedShowtime(movie.showtimes[0]);
                  playTone(440, 0.05);
                }}
                className={`text-left rounded-2xl border transition-all p-4 relative overflow-hidden cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-br from-pink-900/40 via-zinc-900 to-black border-pink-500/80 shadow-[0_0_25px_rgba(236,72,153,0.3)] ring-1 ring-pink-400/50'
                    : 'bg-zinc-900/50 hover:bg-zinc-800/60 border-white/10 hover:border-pink-500/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    {movie.hallType}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1">
                    ★ {movie.rating}
                  </span>
                </div>

                <h3 className="font-bold text-white text-sm line-clamp-1 mb-1">{movie.title}</h3>
                <p className="text-[11px] text-zinc-400 line-clamp-2 mb-3">{movie.tagline}</p>

                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-2 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" /> {movie.duration}
                  </span>
                  <span className="text-pink-300 font-bold">{movie.hallName.split('—')[0]}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Showtime Selector */}
      <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-pink-400" />
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Showtime (เวลารอบฉาย):
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {selectedMovie.showtimes.map(st => {
            const isSelected = selectedShowtime === st;
            return (
              <button
                key={st}
                onClick={() => {
                  setSelectedShowtime(st);
                  playTone(480, 0.04);
                }}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)] scale-105'
                    : 'bg-black/40 hover:bg-zinc-800 text-zinc-300 border border-white/10'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Seating Hall & Booking Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Seating Layout (8 cols) */}
        <div className="lg:col-span-8 bg-zinc-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <div className="text-xs font-mono text-pink-400 uppercase tracking-widest">
                Interactive Seating Matrix (C++ Array Representation)
              </div>
              <div className="text-base font-bold text-white mt-0.5">
                {selectedMovie.hallName} — {selectedMovie.hallType}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-3 h-3 rounded-sm bg-zinc-700 border border-zinc-600"></span> Available
              </span>
              <span className="flex items-center gap-1.5 text-pink-300">
                <span className="w-3 h-3 rounded-sm bg-pink-500 border border-pink-400 shadow-[0_0_6px_rgba(236,72,153,0.8)]"></span> Selected
              </span>
              <span className="flex items-center gap-1.5 text-zinc-500">
                <span className="w-3 h-3 rounded-sm bg-zinc-900 border border-zinc-800"></span> Occupied
              </span>
            </div>
          </div>

          {/* Curved Screen Simulation */}
          <div className="py-2">
            <div className="w-4/5 mx-auto h-2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full shadow-[0_0_20px_rgba(6,182,212,0.8)]"></div>
            <div className="text-center font-mono text-[10px] text-cyan-300/70 tracking-widest mt-2 uppercase">
              ✦ CINEMA SCREEN / จอภาพยนตร์ ✦
            </div>
          </div>

          {/* Seat Grid */}
          <div className="space-y-2 py-2 overflow-x-auto">
            {rows.map(row => {
              const { tier, price } = getSeatTier(row);
              return (
                <div key={row} className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <span className="w-6 font-mono font-bold text-xs text-zinc-400 text-center">
                    {row}
                  </span>

                  {cols.map(col => {
                    const seatId = `${row}-${col}`;
                    const isOccupied = INITIAL_OCCUPIED.has(seatId);
                    const isSelected = selectedSeats.includes(seatId);

                    return (
                      <button
                        key={seatId}
                        onClick={() => handleSeatClick(seatId)}
                        disabled={isOccupied}
                        title={`Seat ${seatId} (${tier} - ฿${price})`}
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md text-[10px] font-mono font-bold flex items-center justify-center transition-all ${
                          isOccupied
                            ? 'bg-zinc-950/80 border border-zinc-800/80 text-zinc-700 cursor-not-allowed'
                            : isSelected
                            ? 'bg-pink-500 border border-pink-300 text-white shadow-[0_0_12px_rgba(236,72,153,0.8)] scale-110'
                            : tier === 'VIP'
                            ? 'bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-200'
                            : tier === 'PREMIUM'
                            ? 'bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200'
                            : 'bg-zinc-800/70 hover:bg-zinc-700 border border-zinc-600 text-zinc-300'
                        }`}
                      >
                        {col}
                      </button>
                    );
                  })}

                  <span className="w-12 font-mono text-[10px] text-zinc-400 text-right">
                    ฿{price}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Concessions Selection Bar */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Coffee className="w-4 h-4 text-pink-400" />
                Concessions & Snacks (อาหารและเครื่องดื่ม)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {CONCESSIONS.map(item => {
                const qty = concessionCart[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="bg-black/30 border border-white/10 rounded-xl p-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-lg mb-1">{item.icon}</div>
                      <div className="font-bold text-xs text-white">{item.name}</div>
                      <div className="text-[10px] text-zinc-400">{item.thaiName}</div>
                      <div className="font-mono text-xs font-bold text-pink-300 mt-1">฿{item.priceThb}</div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                      <button
                        onClick={() => toggleConcession(item.id, -1)}
                        className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-mono text-xs font-bold text-white">{qty}</span>
                      <button
                        onClick={() => toggleConcession(item.id, 1)}
                        className="w-6 h-6 rounded bg-pink-600/50 hover:bg-pink-500 text-white font-mono font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Checkout & C++ Memory Log (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Booking Summary Box */}
          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-xl space-y-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center justify-between">
              <span>Order Summary (สรุปรายการ)</span>
              <Ticket className="w-4 h-4 text-pink-400" />
            </h3>

            <div className="bg-black/40 rounded-xl p-3 border border-white/5 space-y-1.5 text-xs font-mono">
              <div className="text-white font-bold">{selectedMovie.title}</div>
              <div className="text-zinc-400">{selectedMovie.hallName}</div>
              <div className="text-pink-300">Showtime: Today at {selectedShowtime}</div>
            </div>

            {/* Selected Seats Chips */}
            <div>
              <div className="text-[11px] font-mono text-zinc-400 mb-1.5">Selected Seats ({selectedSeats.length}):</div>
              {selectedSeats.length === 0 ? (
                <div className="text-xs text-zinc-400 italic">No seats selected yet. Click on the hall grid.</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selectedSeats.map(s => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/40 font-mono text-xs font-bold"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 pt-3 border-t border-white/10 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Seats Subtotal:</span>
                <span>฿{seatsCost.toLocaleString()}</span>
              </div>

              {concessionsCost > 0 && (
                <div className="flex justify-between text-zinc-400">
                  <span>Concessions:</span>
                  <span>฿{concessionsCost.toLocaleString()}</span>
                </div>
              )}

              {/* Custodian Discount Toggle */}
              <div className="flex items-center justify-between py-1 text-[11px]">
                <label className="flex items-center gap-1.5 text-cyan-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={custodianDiscount}
                    onChange={e => setCustodianDiscount(e.target.checked)}
                    className="rounded border-cyan-500 bg-black text-cyan-500"
                  />
                  <span>Thai Custodian Passport (-15%)</span>
                </label>
                {custodianDiscount && <span className="text-emerald-400">-฿{discountAmount}</span>}
              </div>

              <div className="flex justify-between text-zinc-400 text-[11px]">
                <span>VAT (7%):</span>
                <span>฿{vatAmount}</span>
              </div>

              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/10">
                <span>Total Amount:</span>
                <span className="text-pink-300 font-mono">฿{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirmBooking}
              disabled={selectedSeats.length === 0}
              className={`w-full py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedSeats.length > 0
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.4)]'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
              }`}
            >
              <Ticket className="w-4 h-4" />
              Book Tickets & Generate QR Pass
            </button>
          </div>

          {/* C++ Runtime Stdout Terminal */}
          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-4 font-mono text-[11px]">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3 text-zinc-400">
              <span className="flex items-center gap-1.5 text-pink-400 font-bold">
                <Terminal className="w-3.5 h-3.5" />
                C++ Runtime Stdout
              </span>
              <span className="text-[10px] text-zinc-400">PID: 49202</span>
            </div>

            <div className="space-y-1.5 text-zinc-300 max-h-48 overflow-y-auto custom-scrollbar">
              {cppConsoleLogs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  <span className="text-zinc-400">{log.slice(0, 14)}</span>
                  <span className="text-pink-300 font-semibold">{log.slice(14)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Pass Confirmation Modal */}
      <AnimatePresence>
        {isBookedModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-zinc-900 to-black border border-pink-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_50px_rgba(236,72,153,0.3)] relative text-center space-y-5"
            >
              <button
                onClick={() => setIsBookedModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-pink-500/20 border border-pink-400 mx-auto flex items-center justify-center text-pink-300 shadow-[0_0_25px_rgba(236,72,153,0.4)]">
                <CheckCircle2 className="w-8 h-8 text-pink-400" />
              </div>

              <div>
                <h3 className="text-xl font-black text-white">Booking Confirmed!</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  บัตรชมภาพยนตร์ดิจิทัลถูกบันทึกลงสู่ระบบ C++ Binary Storage เรียบร้อยแล้ว
                </p>
              </div>

              {/* Digital Pass Ticket Stub */}
              <div className="bg-zinc-950 border border-pink-500/30 rounded-2xl p-4 text-left font-mono space-y-3 relative overflow-hidden">
                <div className="flex justify-between items-center text-[10px] text-zinc-400 pb-2 border-b border-white/10">
                  <span>SOVEREIGN CINEMA PASS</span>
                  <span className="text-pink-400 font-bold">{bookingRef}</span>
                </div>

                <div className="text-sm font-bold text-white">{selectedMovie.title}</div>
                <div className="text-xs text-zinc-400">{selectedMovie.hallName} • {selectedShowtime}</div>

                <div className="flex justify-between items-center pt-2 border-t border-white/5 text-xs">
                  <div>
                    <div className="text-[10px] text-zinc-400">SEATS</div>
                    <div className="font-bold text-pink-300">{selectedSeats.join(', ')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-zinc-400">PAID</div>
                    <div className="font-bold text-emerald-300">฿{grandTotal.toLocaleString()}</div>
                  </div>
                </div>

                {/* QR Code Graphic Placeholder */}
                <div className="pt-2 flex justify-center">
                  <div className="p-3 bg-white rounded-xl shadow-inner inline-block">
                    <QrCode className="w-24 h-24 text-black" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    playTone(880, 0.08);
                    setIsBookedModalOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl font-mono text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
