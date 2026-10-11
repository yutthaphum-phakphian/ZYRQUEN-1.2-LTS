import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, AlertCircle, CheckCircle2, ShieldCheck, Eye, EyeOff, Shield, Check, Circle } from 'lucide-react';
import { sessionService, AuthenticatedSession } from '../../services/sessionService';
import { playAuditChime, playTone } from '../AudioSynthesizer';

export interface PasswordStrength {
  score: number; // 0 to 100
  level: 'empty' | 'weak' | 'medium' | 'strong' | 'very_strong';
  label: string;
  barColor: string;
  glowColor: string;
  textColor: string;
  criteria: {
    length8: boolean;
    length12: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
  passedDiversityCount: number;
}

/**
 * Calculates password strength based on length and character diversity requirements.
 * Evaluates uppercase letters, lowercase letters, numbers, and special symbols,
 * alongside minimum (8 chars) and optimal (12+ chars) length thresholds.
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password || password.length === 0) {
    return {
      score: 0,
      level: 'empty',
      label: 'ยังไม่ได้ระบุรหัสผ่าน (Enter password)',
      barColor: 'bg-zinc-700',
      glowColor: '',
      textColor: 'text-zinc-500',
      criteria: {
        length8: false,
        length12: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSpecial: false,
      },
      passedDiversityCount: 0,
    };
  }

  const length8 = password.length >= 8;
  const length12 = password.length >= 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

  const diversityTypes = [hasUpper, hasLower, hasNumber, hasSpecial];
  const passedDiversityCount = diversityTypes.filter(Boolean).length;

  // Length points (max 40)
  let lengthPoints = 0;
  if (password.length < 8) {
    lengthPoints = Math.floor((password.length / 8) * 15);
  } else if (password.length < 12) {
    lengthPoints = 25;
  } else if (password.length < 16) {
    lengthPoints = 35;
  } else {
    lengthPoints = 40;
  }

  // Diversity points (max 60: 15 points for each character category)
  const diversityPoints = passedDiversityCount * 15;

  let rawScore = lengthPoints + diversityPoints;

  // Security constraints: if minimum length of 8 is not met, cap at 35 (Weak)
  if (!length8) {
    rawScore = Math.min(rawScore, 35);
  } else if (passedDiversityCount === 1) {
    // If only one diversity type is used (e.g. all digits or all lowercase), cap at 40
    rawScore = Math.min(rawScore, 40);
  }

  const score = Math.min(100, Math.max(10, rawScore));

  let level: 'weak' | 'medium' | 'strong' | 'very_strong' = 'weak';
  let label = 'รหัสผ่านอ่อน (Weak)';
  let barColor = 'bg-gradient-to-r from-rose-600 to-rose-500';
  let glowColor = 'shadow-[0_0_12px_rgba(244,63,94,0.5)]';
  let textColor = 'text-rose-400';

  if (score >= 90) {
    level = 'very_strong';
    label = 'รหัสผ่านยอดเยี่ยม (Very Strong - Sovereign)';
    barColor = 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400';
    glowColor = 'shadow-[0_0_14px_rgba(16,185,129,0.6)]';
    textColor = 'text-emerald-400';
  } else if (score >= 70) {
    level = 'strong';
    label = 'รหัสผ่านแข็งแกร่ง (Strong)';
    barColor = 'bg-gradient-to-r from-cyan-600 to-cyan-400';
    glowColor = 'shadow-[0_0_12px_rgba(6,182,212,0.5)]';
    textColor = 'text-cyan-400';
  } else if (score >= 40) {
    level = 'medium';
    label = 'รหัสผ่านปานกลาง (Medium)';
    barColor = 'bg-gradient-to-r from-amber-600 to-amber-500';
    glowColor = 'shadow-[0_0_12px_rgba(245,158,11,0.5)]';
    textColor = 'text-amber-400';
  }

  return {
    score,
    level,
    label,
    barColor,
    glowColor,
    textColor,
    criteria: {
      length8,
      length12,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
    },
    passedDiversityCount,
  };
}

export interface LoginValidationResult {
  isValid: boolean;
  errors: {
    email?: string;
    password?: string;
  };
}

/**
 * Validates login input on client-side:
 * - Email / Username required
 * - If email format contains '@', verifies RFC-compliant structure
 * - Password required and minimum 8 characters
 */
export function validateLoginInput(email: string, password: string): LoginValidationResult {
  const errors: { email?: string; password?: string } = {};
  const cleanEmail = (email || '').trim();

  if (!cleanEmail) {
    errors.email = 'กรุณาระบุอีเมลหรือชื่อผู้ใช้ (Email or username is required)';
  } else if (cleanEmail.includes('@')) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(cleanEmail)) {
      errors.email = 'รูปแบบอีเมลไม่ถูกต้อง (Invalid email format, e.g. user@zyrquen.court)';
    }
  }

  if (!password) {
    errors.password = 'กรุณาระบุรหัสผ่าน (Password is required)';
  } else if (password.length < 8) {
    errors.password = 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร (Password must be at least 8 characters)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface LoginFormProps {
  onSuccess?: (session: AuthenticatedSession) => void;
  onSwitchToRegister?: () => void;
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
  className = '',
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientErrors, setClientErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Real-time password strength calculation
  const passwordStrength = useMemo(() => calculatePasswordStrength(password), [password]);

  // Client-side validation check
  const validateForm = (): boolean => {
    const validation = validateLoginInput(email, password);
    setClientErrors(validation.errors);
    return validation.isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      playTone(320, 0.1);
      return;
    }

    setIsSubmitting(true);
    playTone(520, 0.05);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          username: email.trim(),
          password,
          rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.session) {
        throw new Error(data.message || data.error || 'การเข้าสู่ระบบล้มเหลว (Login failed)');
      }

      playAuditChime();
      setSuccessMessage(`ยินดีต้อนรับ ${data.session.userDisplayName || data.session.username} (ระดับ: ${data.session.role.toUpperCase()})`);

      // Store in sessionService / localStorage according to rememberMe preference
      if (typeof window !== 'undefined') {
        if (rememberMe) {
          localStorage.setItem('zyrquen_remember_login', email.trim());
        } else {
          localStorage.removeItem('zyrquen_remember_login');
        }
      }

      // Notify sessionService of the newly acquired session
      sessionService.setManualSession(data.session);

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(data.session);
        }
      }, 700);
    } catch (err: any) {
      playTone(280, 0.15);
      setServerError(err.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ระบบยืนยันตัวตนได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto p-6 rounded-2xl bg-[#090d1a]/95 border border-cyan-500/30 backdrop-blur-xl text-zinc-100 shadow-[0_0_40px_rgba(6,182,212,0.15)] font-mono ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-cyan-500/20 pb-4 mb-5">
        <div className="p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-400">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-cyan-300 tracking-wider">
            ZYRQUEN Ω∞ SOVEREIGN LOGIN
          </h2>
          <p className="text-[11px] text-zinc-400">
            ระบบเข้าสู่ระบบด้วยรหัสผ่านและสิทธิ์อัตโนมัติ (RBAC)
          </p>
        </div>
      </div>

      {/* Server Alerts */}
      {serverError && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <span>{serverError}</span>
        </motion.div>
      )}

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <span>{successMessage}</span>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email / Username field */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            อีเมลหรือชื่อผู้ใช้ (Email / Username)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (clientErrors.email) setClientErrors({ ...clientErrors, email: undefined });
              }}
              placeholder="user@zyrquen.court หรือ EP-SOVEREIGN-01"
              autoComplete="username"
              className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#070a12] border text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors ${
                clientErrors.email
                  ? 'border-rose-500/80 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                  : 'border-zinc-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
              }`}
            />
          </div>
          {clientErrors.email && (
            <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {clientErrors.email}
            </p>
          )}
        </div>

        {/* Password field */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            รหัสผ่าน (Password)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (clientErrors.password) setClientErrors({ ...clientErrors, password: undefined });
              }}
              placeholder="••••••••••••"
              autoComplete="current-password"
              className={`w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#070a12] border text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors ${
                clientErrors.password
                  ? 'border-rose-500/80 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                  : 'border-zinc-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 focus:outline-none cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {clientErrors.password && (
            <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {clientErrors.password}
            </p>
          )}

          {/* Visual Password Strength Progress Bar & Criteria Breakdown */}
          <div className="mt-2.5 p-3 rounded-xl bg-[#060913] border border-cyan-500/20 space-y-2.5">
            {/* Header: Label & Live Score */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>ระดับความแข็งแกร่ง (Strength)</span>
              </span>
              <span className={`font-bold font-mono text-[11px] flex items-center gap-1.5 ${passwordStrength.textColor}`}>
                <span>{password ? `${passwordStrength.score}%` : '0%'}</span>
                <span>•</span>
                <span>{passwordStrength.label}</span>
              </span>
            </div>

            {/* Visual Progress Bar Track */}
            <div className="relative w-full h-2 rounded-full bg-zinc-900 border border-zinc-700/60 overflow-hidden p-0.5">
              <div
                role="progressbar"
                aria-valuenow={passwordStrength.score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Password Strength Progress"
                className={`h-full rounded-full transition-all duration-300 ease-out ${
                  password ? `${passwordStrength.barColor} ${passwordStrength.glowColor}` : 'bg-zinc-800'
                }`}
                style={{ width: `${password ? Math.max(passwordStrength.score, 6) : 0}%` }}
              />
              {/* Calibration Markers at 25%, 50%, 75% */}
              <div className="absolute inset-0 flex justify-between pointer-events-none px-1">
                <span className="w-0.5 h-full bg-zinc-950/40" />
                <span className="w-0.5 h-full bg-zinc-950/40" />
                <span className="w-0.5 h-full bg-zinc-950/40" />
              </div>
            </div>

            {/* Character Diversity & Length Requirements Breakdown */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {/* Length >= 8 */}
              <div
                className={`px-2 py-1 rounded-lg border text-[10px] flex items-center gap-1.5 transition-colors ${
                  passwordStrength.criteria.length8
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-500'
                }`}
              >
                {passwordStrength.criteria.length8 ? (
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-2.5 h-2.5 text-zinc-600 shrink-0" />
                )}
                <span>ความยาว ≥ 8 ตัวอักษร</span>
              </div>

              {/* Uppercase A-Z */}
              <div
                className={`px-2 py-1 rounded-lg border text-[10px] flex items-center gap-1.5 transition-colors ${
                  passwordStrength.criteria.hasUpper
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-500'
                }`}
              >
                {passwordStrength.criteria.hasUpper ? (
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-2.5 h-2.5 text-zinc-600 shrink-0" />
                )}
                <span>ตัวพิมพ์ใหญ่ (A-Z)</span>
              </div>

              {/* Lowercase a-z */}
              <div
                className={`px-2 py-1 rounded-lg border text-[10px] flex items-center gap-1.5 transition-colors ${
                  passwordStrength.criteria.hasLower
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-500'
                }`}
              >
                {passwordStrength.criteria.hasLower ? (
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-2.5 h-2.5 text-zinc-600 shrink-0" />
                )}
                <span>ตัวพิมพ์เล็ก (a-z)</span>
              </div>

              {/* Number 0-9 */}
              <div
                className={`px-2 py-1 rounded-lg border text-[10px] flex items-center gap-1.5 transition-colors ${
                  passwordStrength.criteria.hasNumber
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-500'
                }`}
              >
                {passwordStrength.criteria.hasNumber ? (
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-2.5 h-2.5 text-zinc-600 shrink-0" />
                )}
                <span>ตัวเลข (0-9)</span>
              </div>

              {/* Special Character */}
              <div
                className={`px-2 py-1 rounded-lg border text-[10px] flex items-center gap-1.5 transition-colors ${
                  passwordStrength.criteria.hasSpecial
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-500'
                }`}
              >
                {passwordStrength.criteria.hasSpecial ? (
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-2.5 h-2.5 text-zinc-600 shrink-0" />
                )}
                <span>สัญลักษณ์พิเศษ (!@#$)</span>
              </div>

              {/* Optimal Length >= 12 chars */}
              <div
                className={`px-2 py-1 rounded-lg border text-[10px] flex items-center gap-1.5 transition-colors ${
                  passwordStrength.criteria.length12
                    ? 'bg-cyan-950/50 border-cyan-500/40 text-cyan-300'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-500'
                }`}
              >
                {passwordStrength.criteria.length12 ? (
                  <Check className="w-3 h-3 text-cyan-400 shrink-0" />
                ) : (
                  <Circle className="w-2.5 h-2.5 text-zinc-600 shrink-0" />
                )}
                <span>แนะนำ ≥ 12 ตัว (Optimal)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Remember Me toggle & Forgot */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-zinc-300 select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-zinc-800 border-zinc-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-[11px]">จดจำฉันไว้ในระบบ (Remember Me)</span>
          </label>
          <span className="text-[10px] text-cyan-400/80 font-mono">
            ETDA Sec 9/26
          </span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-2.5 px-4 rounded-xl font-bold text-xs tracking-wider uppercase transition-all bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-zinc-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              <span>กำลังตรวจสอบสิทธิ์...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>เข้าสู่ระบบ (Sign In)</span>
            </>
          )}
        </button>
      </form>

      {/* Switch to Register link */}
      {onSwitchToRegister && (
        <div className="mt-5 pt-4 border-t border-zinc-800/80 text-center">
          <p className="text-xs text-zinc-400">
            ยังไม่มีบัญชีผู้ใช้งานใช่หรือไม่?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-cyan-400 hover:text-cyan-300 underline font-semibold transition-colors cursor-pointer"
            >
              สมัครสมาชิกใหม่ (Register)
            </button>
          </p>
        </div>
      )}
    </div>
  );
};
