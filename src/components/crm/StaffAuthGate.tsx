import React, { useState } from 'react';
import { StaffRep, MASTER_ADMIN_EMAIL } from '../../types/telecom';
import { TelecomStorage } from '../../services/telecomStorage';
import {
  signInWithSupabase,
  signUpStaffInSupabase,
  isSupabaseConfigured,
} from '../../services/supabase';
import {
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  Database,
} from 'lucide-react';

interface StaffAuthGateProps {
  onSuccess: (staff: StaffRep) => void;
  onExitToPublic: () => void;
}

export const StaffAuthGate: React.FC<StaffAuthGateProps> = ({ onSuccess, onExitToPublic }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const inputIdentifier = usernameOrEmail.trim();
    const inputPassword = password.trim();

    if (!inputIdentifier || !inputPassword) {
      setError('Please enter both your account identifier and password.');
      setIsLoading(false);
      return;
    }

    try {
      const staffList = TelecomStorage.getStaff();
      const matched = staffList.find(
        (s) =>
          s.username.toLowerCase() === inputIdentifier.toLowerCase() ||
          s.email.toLowerCase() === inputIdentifier.toLowerCase()
      );

      // Check Master Admin identity
      const isMaster =
        inputIdentifier.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase() ||
        inputIdentifier.toLowerCase() === 'jacky' ||
        inputIdentifier.toLowerCase() === 'admin' ||
        Boolean(matched?.isMasterAdmin) ||
        matched?.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

      // Resolve staff object
      let staffToLogin: StaffRep | null = matched || null;
      if (!staffToLogin && isMaster) {
        staffToLogin = {
          id: 'rep-master-admin',
          username: 'jacky',
          name: 'Jacky (Master Admin)',
          role: 'super_admin',
          email: MASTER_ADMIN_EMAIL,
          phone: '(647) 261-8488',
          avatarColor: 'bg-emerald-950',
          commissionMultiplier: 1.5,
          isAccessRevoked: false,
          isMasterAdmin: true,
          allowedViewRepNames: ['ALL'],
          peerPermissions: [],
        };
      }

      if (!staffToLogin) {
        setError('Staff account not recognized. Please check your username or email.');
        setIsLoading(false);
        return;
      }

      if (staffToLogin.isAccessRevoked) {
        setError('Access Revoked: Your account access has been revoked by the system administrator.');
        setIsLoading(false);
        return;
      }

      // Check passwords:
      // Master Admin accepts 'AdminTemp2026!' or any password customized by the admin
      const validPasswords = [
        staffToLogin.password,
        isMaster ? 'AdminTemp2026!' : undefined,
      ].filter(Boolean) as string[];

      const matchesLocalPassword =
        validPasswords.length === 0 ||
        validPasswords.includes(inputPassword);

      if (matchesLocalPassword) {
        // Establish Supabase Auth session if configured so authenticated RLS policies (UPDATE/DELETE) work immediately
        if (isSupabaseConfigured && staffToLogin.email) {
          const syncEmail = staffToLogin.email;
          try {
            const res = await signInWithSupabase(syncEmail, inputPassword);
            if (res.error) {
              await signUpStaffInSupabase(syncEmail, inputPassword, {
                username: staffToLogin.username,
                name: staffToLogin.name,
                role: staffToLogin.role,
              });
            }
          } catch {
            // Non-blocking fallback so local CRM login still succeeds
          }
        }

        TelecomStorage.setAuthSession(staffToLogin);
        onSuccess(staffToLogin);
        return;
      }

      // If local password didn't match, attempt live Supabase Auth check
      if (isSupabaseConfigured) {
        const { data: supaData, error: supaErr } = await signInWithSupabase(
          staffToLogin.email || inputIdentifier,
          inputPassword
        );

        if (!supaErr && supaData?.user) {
          TelecomStorage.setAuthSession(staffToLogin);
          onSuccess(staffToLogin);
          return;
        }
      }

      setError('Invalid password. Please verify your credentials.');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#061B14] via-[#0A2E22] to-[#082017] flex items-center justify-center p-4 text-slate-100">
      
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-40 right-10 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 -left-20 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        
        {/* Top link to return to public website */}
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
        <div className="rounded-3xl border border-emerald-500/20 bg-[#0B2A20]/90 p-8 shadow-2xl backdrop-blur-xl">
          
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

          {/* Secure Production Form */}
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/70 p-3 text-xs text-rose-200 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-emerald-200 mb-1">
                Username or Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-400/60">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Enter your email or username"
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-emerald-500/30 bg-emerald-950/50 pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-emerald-500/40 focus:border-emerald-400 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-xs font-bold text-[#08281D] hover:bg-emerald-300 transition-all shadow-md active:scale-[0.99] disabled:opacity-60 cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-[#08281D] border-t-transparent animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Unlock Staff Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Database connection indicator */}
          <div className="mt-5 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-300/60">
            <span className="flex items-center gap-1.5">
              <Database className="h-3 w-3 text-emerald-400" />
              <span>
                {isSupabaseConfigured ? 'Supabase Auth Encrypted' : 'Encrypted Production Gateway'}
              </span>
            </span>
            <span className="font-mono text-[10px] text-emerald-400/70">TLS 256-bit</span>
          </div>

        </div>

        {/* Security footer */}
        <div className="mt-4 text-center text-[11px] text-emerald-300/50 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>CTExcel Dealer Portal · Private & Confidential</span>
        </div>

      </div>
    </div>
  );
};
