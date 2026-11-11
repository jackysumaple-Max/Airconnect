import React, { useState } from 'react';
import { ShieldAlert, Lock, AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';

interface HardDeleteConfirmModalProps {
  isOpen: boolean;
  recordCount: number;
  onClose: () => void;
  onConfirm: () => void;
  expectedPassword?: string;
}

export const HardDeleteConfirmModal: React.FC<HardDeleteConfirmModalProps> = ({
  isOpen,
  recordCount,
  onClose,
  onConfirm,
  expectedPassword = 'AdminTemp2026!',
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);

    setTimeout(() => {
      // Normalize password check (accepts current configured password or master default AdminTemp2026!)
      const valid =
        password.trim() === expectedPassword.trim() ||
        password.trim() === 'AdminTemp2026!';

      if (!valid) {
        setError('Invalid Master Admin password. Permanent database purge rejected.');
        setIsVerifying(false);
        return;
      }

      setIsVerifying(false);
      setPassword('');
      onConfirm();
    }, 400);
  };

  const handleClose = () => {
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-rose-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Warning Icon & Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Confirm Permanent Hard Delete
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              This action will <strong className="text-rose-600 font-bold">permanently destroy</strong>{' '}
              {recordCount} record{recordCount !== 1 ? 's' : ''} from the database. This operation is
              irreversible.
            </p>
          </div>
        </div>

        {/* Security Warning Box */}
        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Master Admin Authorization Required:</strong> Enter the Master Admin account
            password to authorize this hard deletion from Supabase and the CRM.
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-3 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs font-semibold text-rose-700 animate-shake">
            {error}
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Master Admin Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Master Admin Password..."
                className="w-full rounded-xl border border-slate-300 pl-9 pr-10 py-2.5 text-xs text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Default password: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">AdminTemp2026!</code>
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isVerifying}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || !password}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2 text-xs font-bold text-white transition-colors shadow-xs disabled:opacity-50"
            >
              {isVerifying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShieldAlert className="h-3.5 w-3.5" />
              )}
              <span>{isVerifying ? 'Verifying...' : 'Permanently Hard Delete'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
