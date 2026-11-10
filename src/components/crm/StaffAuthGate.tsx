import React, { useState, useEffect } from 'react';
import {
  StaffRep,
  MASTER_ADMIN_EMAIL,
  MASTER_ADMIN_PASSWORD,
  MASTER_ADMIN_MFA_PHONE,
  DEMO_REP_EMAIL,
  DEMO_REP_PASSWORD,
} from '../../types/telecom';
import { TelecomStorage } from '../../services/telecomStorage';
import { MasterAdminMfaModal } from './MasterAdminMfaModal';
import { Lock, User, KeyRound, ShieldCheck, ArrowRight, AlertCircle, ArrowLeft, Smartphone } from 'lucide-react';

interface StaffAuthGateProps {
  onSuccess: (staff: StaffRep) => void;
  onExitToPublic: () => void;
}

export const StaffAuthGate: React.FC<StaffAuthGateProps> = ({ onSuccess, onExitToPublic }) => {
  // Detect if user navigated specifically to /staff-portal/admin
  const checkIsAdminRoute = () => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.includes('/admin') ||
      window.location.hash.includes('admin') ||
      window.location.search.includes('portal=admin')
    );
  };

  const isAdminRoute = checkIsAdminRoute();

  const [username, setUsername] = useState(
    isAdminRoute ? MASTER_ADMIN_EMAIL : DEMO_REP_EMAIL
  );
  const [password, setPassword] = useState(
    isAdminRoute ? MASTER_ADMIN_PASSWORD : DEMO_REP_PASSWORD
  );
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [pendingMfaStaff, setPendingMfaStaff] = useState<StaffRep | null>(null);

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const staffList = TelecomStorage.getStaff();
    const matched = staffList.find(
      (s) =>
        s.username.toLowerCase() === username.trim().toLowerCase() ||
        s.email.toLowerCase() === username.trim().toLowerCase()
    );

    if (!matched) {
      setError('Staff account username or email not recognized. Please check your credentials.');
      return;
    }

    // Check account revocation
    if (matched.isAccessRevoked) {
      setError('Access Revoked: Your account access has been revoked by the system administrator.');
      return;
    }

    // Verify password against rep password or sample passwords
    const validPasswords = [
      matched.password,
      MASTER_ADMIN_PASSWORD,
      DEMO_REP_PASSWORD,
      'ctexcel2026',
    ].filter(Boolean);

    if (!validPasswords.includes(password.trim())) {
      setError('Invalid password. Please check your login credentials.');
      return;
    }

    // Mandatory MFA for Master Admin
    if (matched.isMasterAdmin || matched.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
      setPendingMfaStaff(matched);
      return;
    }

    TelecomStorage.setAuthSession(matched);
    onSuccess(matched);
  };

  const handleGoogleSso = () => {
    setIsGoogleLoading(true);
    setError('');

    setTimeout(() => {
      const staffList = TelecomStorage.getStaff();
      // Default to Master Admin for Google SSO demo
      const masterAdmin = staffList.find(
        (s) => s.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase() || s.isMasterAdmin
      ) || staffList[0];

      setIsGoogleLoading(false);

      if (masterAdmin.isAccessRevoked) {
        setError('Access Revoked: Your account access has been revoked by the administrator.');
        return;
      }

      // Mandatory 2FA for Master Admin SSO as well
      if (masterAdmin.isMasterAdmin || masterAdmin.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
        setPendingMfaStaff(masterAdmin);
      } else {
        TelecomStorage.setAuthSession(masterAdmin);
        onSuccess(masterAdmin);
      }
    }, 650);
  };

  const handleMfaSuccess = () => {
    if (pendingMfaStaff) {
      TelecomStorage.setAuthSession(pendingMfaStaff);
      onSuccess(pendingMfaStaff);
      setPendingMfaStaff(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#061B14] via-[#0A2E22] to-[#082017] flex items-center justify-center p-4 text-slate-100">
      
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-40 right-10 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 -left-20 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        
        {/* Subtle Top link to exit back to site */}
        <div className="mb-4 flex items-center justify-between text-xs text-emerald-300/70">
          <button
            onClick={onExitToPublic}
            className="flex items-center gap-1.5 hover:text-emerald-200 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Public Website</span>
          </button>
          <span className="font-mono text-[11px] text-emerald-400/50">/staff-portal</span>
        </div>

        {/* Card Container */}
        <div className="rounded-3xl border border-emerald-500/20 bg-[#0B2A20]/80 p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Logo & Lock Badge */}
          <div className="text-center mb-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-950/80 border border-emerald-400/30 text-emerald-400 mb-3 shadow-inner">
              <Lock className="h-7 w-7 text-emerald-300" />
            </div>

            <div className="flex items-center justify-center gap-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-white">
                CTExcel
              </h2>
              <span className="rounded bg-emerald-400/20 border border-emerald-400/30 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                Staff Portal
              </span>
            </div>

            <p className="mt-1.5 text-xs text-emerald-100/70">
              Dealer Management, Residual Engine & Customer CRM
            </p>
          </div>

          {/* Single Sign-On (SSO): Google */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleSso}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 px-4 py-3 text-xs font-bold text-white transition-all shadow-xs active:scale-[0.99] disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <div className="h-4 w-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isGoogleLoading ? 'Verifying Google Account...' : 'Sign in with Google'}</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-emerald-500/20" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-emerald-300/50">
                <span className="bg-[#0B2A20] px-2">or username & password</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/60 p-3 text-xs text-rose-200 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-emerald-200 mb-1">
                Username / Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-400/60">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or aarav"
                  className="w-full rounded-xl border border-emerald-500/30 bg-emerald-950/50 pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-emerald-500/40 focus:border-emerald-400 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-200 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-400/60">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-emerald-500/30 bg-emerald-950/50 pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-emerald-500/40 focus:border-emerald-400 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-xs font-bold text-[#08281D] hover:bg-emerald-300 transition-all shadow-md active:scale-[0.99] mt-2"
            >
              <span>Unlock Staff Portal</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Pre-fills for Testing */}
          <div className="mt-6 pt-4 border-t border-emerald-500/20 text-center">
            <span className="text-[11px] text-emerald-200/60 block mb-2 font-medium">
              Sample System Access Credentials (Click to load):
            </span>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setUsername(MASTER_ADMIN_EMAIL);
                  setPassword(MASTER_ADMIN_PASSWORD);
                }}
                className="w-full text-left rounded-xl bg-emerald-950/90 border border-emerald-400/40 p-2.5 hover:bg-emerald-900 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Master Admin (/staff-portal/admin)</span>
                  </div>
                  <div className="text-[10px] text-emerald-300/80 font-mono">
                    {MASTER_ADMIN_EMAIL} · PW: {MASTER_ADMIN_PASSWORD}
                  </div>
                </div>
                <span className="rounded bg-emerald-400/20 text-[10px] font-bold text-emerald-300 px-2 py-0.5">
                  Mandatory 2FA
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername(DEMO_REP_EMAIL);
                  setPassword(DEMO_REP_PASSWORD);
                }}
                className="w-full text-left rounded-xl bg-emerald-950/70 border border-emerald-500/30 p-2.5 hover:bg-emerald-900/80 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
                    <User className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Standard Sales Rep (/staff-portal)</span>
                  </div>
                  <div className="text-[10px] text-emerald-300/70 font-mono">
                    {DEMO_REP_EMAIL} · PW: {DEMO_REP_PASSWORD}
                  </div>
                </div>
                <span className="rounded bg-slate-800 text-[10px] font-medium text-slate-300 px-2 py-0.5">
                  Isolated Portal
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* Security watermark */}
        <div className="mt-4 text-center text-[11px] text-emerald-300/50 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>CTExcel Dealer Portal · Private & Confidential</span>
        </div>

      </div>

      {/* Mandatory MFA Modal for Master Admin */}
      <MasterAdminMfaModal
        isOpen={Boolean(pendingMfaStaff)}
        onSuccess={handleMfaSuccess}
        onCancel={() => setPendingMfaStaff(null)}
        actionTitle="Master Admin Login Verification"
      />
    </div>
  );
};
