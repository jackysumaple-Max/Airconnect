import React, { useState, useEffect } from 'react';
import { ShieldCheck, Smartphone, Lock, AlertCircle, ArrowRight, RotateCw, CheckCircle2, X } from 'lucide-react';
import { MASTER_ADMIN_EMAIL, MASTER_ADMIN_MFA_PHONE } from '../../types/telecom';
import { TelecomStorage } from '../../services/telecomStorage';

interface MasterAdminMfaModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  actionTitle?: string;
}

export const MasterAdminMfaModal: React.FC<MasterAdminMfaModalProps> = ({
  isOpen,
  onSuccess,
  onCancel,
  actionTitle = 'Master Admin Security Verification',
}) => {
  if (!isOpen) return null;

  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isSimulatingSms, setIsSimulatingSms] = useState(true);

  // Generate and dispatch SMS OTP to 647-261-8488
  useEffect(() => {
    const code = TelecomStorage.generateMfaOtp();
    setGeneratedCode(code);
    setIsSimulatingSms(true);
    setCountdown(60);

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otpCode.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    const isValid = TelecomStorage.verifyMfaOtp(otpCode);
    if (!isValid) {
      setError('Invalid or expired verification code. Please check your SMS and try again.');
      return;
    }

    onSuccess();
  };

  const handleResend = () => {
    const newCode = TelecomStorage.generateMfaOtp();
    setGeneratedCode(newCode);
    setCountdown(60);
    setError('');
    setIsSimulatingSms(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-emerald-500/30 bg-[#08241B] p-6 sm:p-7 text-white shadow-2xl">
        
        {/* Close / Cancel Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 rounded-xl p-1.5 text-emerald-400/60 hover:text-white hover:bg-emerald-900/50 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-900/60 border border-emerald-400/30 text-emerald-300 mb-3 shadow-inner">
            <Smartphone className="h-7 w-7 text-emerald-400" />
          </div>

          <div className="flex items-center justify-center gap-2">
            <Lock className="h-4 w-4 text-emerald-400" />
            <h3 className="text-lg font-extrabold text-white">
              {actionTitle}
            </h3>
          </div>

          <p className="mt-1 text-xs text-emerald-200/80">
            Mandatory Two-Factor Authentication (2FA) Protocol
          </p>
        </div>

        {/* Master Admin Identity Lock Badge */}
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-950/60 p-3.5 mb-5 text-xs space-y-1">
          <div className="flex items-center justify-between text-slate-300">
            <span>Restricted Master Admin:</span>
            <span className="font-bold text-emerald-300">{MASTER_ADMIN_EMAIL}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Designated SMS Gateway:</span>
            <span className="font-mono font-extrabold text-emerald-400">
              +1 ({MASTER_ADMIN_MFA_PHONE})
            </span>
          </div>
        </div>

        {/* Simulated Real-Time SMS Dispatch Banner (For testing & review verification) */}
        {isSimulatingSms && generatedCode && (
          <div className="rounded-2xl border border-emerald-400/40 bg-emerald-900/70 p-3.5 mb-5 text-xs text-emerald-100 shadow-sm animate-pulse-once">
            <div className="flex items-start gap-2.5">
              <div className="rounded-full bg-emerald-400 p-1 text-emerald-950 mt-0.5 shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>SMS Dispatched to {MASTER_ADMIN_MFA_PHONE}</span>
                  <span className="text-[10px] text-emerald-300">Just now</span>
                </div>
                <p className="text-[11px] text-emerald-200/90 leading-relaxed font-mono">
                  "Your CTExcel Master Admin verification code is: <strong>{generatedCode}</strong>. Valid for 10 minutes."
                </p>
                <button
                  type="button"
                  onClick={() => setOtpCode(generatedCode)}
                  className="text-[10px] font-bold text-emerald-300 underline hover:text-white pt-1"
                >
                  Click to auto-fill ({generatedCode})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OTP Input Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/70 p-3 text-xs text-rose-200 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-emerald-200 mb-1.5 text-center">
              Enter 6-Digit SMS Verification Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              autoFocus
              className="w-full text-center tracking-[0.4em] font-mono font-extrabold text-2xl rounded-2xl border border-emerald-400/40 bg-emerald-950/80 p-3 text-white placeholder:text-emerald-700/50 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-400 py-3 px-4 text-xs font-bold text-[#08281D] hover:bg-emerald-300 transition-all shadow-md active:scale-[0.99]"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Verify & Authorize Master Access</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Resend & Countdown */}
        <div className="mt-4 pt-4 border-t border-emerald-500/20 flex items-center justify-between text-xs text-emerald-300/70">
          <span>Expires in {countdown}s</span>
          <button
            type="button"
            disabled={countdown > 0}
            onClick={handleResend}
            className="flex items-center gap-1 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCw className="h-3 w-3" />
            <span>Resend SMS Code</span>
          </button>
        </div>

      </div>
    </div>
  );
};
