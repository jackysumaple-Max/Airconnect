import React, { useState, useMemo } from 'react';
import { StaffRep, CustomerRecord } from '../../types/telecom';
import { TelecomStorage } from '../../services/telecomStorage';
import {
  Sliders,
  X,
  Lock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  History,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';

interface MultiplierAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  rep: StaffRep | null;
  customers: CustomerRecord[];
  onSuccess: (updatedRep: StaffRep, updatedCustomers?: CustomerRecord[]) => void;
}

export const MultiplierAdjustmentModal: React.FC<MultiplierAdjustmentModalProps> = ({
  isOpen,
  onClose,
  rep,
  customers,
  onSuccess,
}) => {
  if (!isOpen || !rep) return null;

  // New multiplier state (bounded 0.5x to 2.0x)
  const [multiplierVal, setMultiplierVal] = useState<number>(rep.commissionMultiplier || 1.0);

  // Retroactive recalculation toggle
  const [applyRetroactively, setApplyRetroactively] = useState(false);

  // Date Range for retroactive application
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Live scan of eligible historical activations for this specific rep
  const scannedHistoricalActivations = useMemo(() => {
    if (!applyRetroactively) return [];

    const start = startDate <= endDate ? startDate : endDate;
    const end = startDate <= endDate ? endDate : startDate;

    return customers.filter((c) => {
      // Must belong to this rep
      if (c.salesRep.toLowerCase() !== rep.name.toLowerCase()) return false;

      // Must be an active or non-active line with a valid date
      const actDate = c.activationStartDate || c.commission?.payoutDate;
      if (!actDate) return false;

      const dStr = actDate.substring(0, 10);
      return dStr >= start && dStr <= end;
    });
  }, [customers, rep, applyRetroactively, startDate, endDate]);

  // Calculate financial comparison for retroactive adjustment
  const calculationSummary = useMemo(() => {
    let currentTotal = 0;
    let recalculatedTotal = 0;

    scannedHistoricalActivations.forEach((c) => {
      const planPrice = c.monthlyPlanPrice || 30;
      const currentPayout = c.commission?.amount || 0;
      const newPayout = Number((planPrice * multiplierVal).toFixed(2));

      currentTotal += currentPayout;
      recalculatedTotal += newPayout;
    });

    const diff = Number((recalculatedTotal - currentTotal).toFixed(2));

    return {
      count: scannedHistoricalActivations.length,
      currentTotal: Number(currentTotal.toFixed(2)),
      recalculatedTotal: Number(recalculatedTotal.toFixed(2)),
      diff,
    };
  }, [scannedHistoricalActivations, multiplierVal]);

  const handleSave = () => {
    const val = Math.max(0.5, Math.min(2.0, parseFloat(multiplierVal.toFixed(2))));

    if (!applyRetroactively) {
      // 1. DEFAULT BEHAVIOR: Historical Data Locking (Future-Only Application)
      // Updates rep multiplier; past commissions remain untouched.
      TelecomStorage.updateCommissionMultiplier(rep.id, val);
      const allStaff = TelecomStorage.getStaff();
      const updatedRep = allStaff.find((s) => s.id === rep.id) || {
        ...rep,
        commissionMultiplier: val,
        multiplierUpdatedAt: new Date().toISOString(),
      };
      onSuccess(updatedRep);
      onClose();
    } else {
      // 2. RETROACTIVE RECALCULATION (Master Admin Override Tool)
      const start = startDate <= endDate ? startDate : endDate;
      const end = startDate <= endDate ? endDate : startDate;

      // Update rep profile multiplier
      TelecomStorage.updateCommissionMultiplier(rep.id, val);

      // Perform selective retroactive recalculation on matched past activations
      const result = TelecomStorage.recalculateRetroactiveCommissions(
        rep.name,
        val,
        start,
        end
      );

      const allStaff = TelecomStorage.getStaff();
      const updatedRep = allStaff.find((s) => s.id === rep.id) || {
        ...rep,
        commissionMultiplier: val,
        multiplierUpdatedAt: new Date().toISOString(),
      };

      onSuccess(updatedRep, result.updatedCustomers);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-gradient-to-r from-emerald-950 via-[#0C3829] to-[#08281D] text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/20 border border-emerald-400/30 p-2 text-emerald-300">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Commission Multiplier & Historical Scope
                </h3>
                <span className="rounded bg-emerald-400/20 text-emerald-300 font-extrabold text-[9px] px-2 py-0.5 border border-emerald-400/30">
                  Master Admin
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Target Representative: <strong className="text-white">{rep.name}</strong> ({rep.email})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-emerald-200/70 hover:bg-emerald-900 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-xs text-slate-800">
          
          {/* Multiplier Slider & Value Selector */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-sm">Assign Multiplier Rate</span>
                <p className="text-slate-500 text-[11px]">Valid range: 0.5x to 2.0x base commission</p>
              </div>
              <div className="flex items-baseline gap-1 bg-white border border-slate-300 px-3 py-1.5 rounded-xl shadow-2xs">
                <span className="text-2xl font-black text-emerald-800 tabular-nums font-mono">
                  {multiplierVal.toFixed(2)}x
                </span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={multiplierVal}
              onChange={(e) => setMultiplierVal(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
            />

            {/* Quick preset buttons */}
            <div className="flex items-center gap-1.5 pt-1">
              {[0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMultiplierVal(preset)}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                    multiplierVal === preset
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset}x
                </button>
              ))}
            </div>

            {/* Calculation formula example */}
            <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Example $30/mo Plan Payout:</span>
              <span className="font-mono font-bold text-slate-800">
                $30.00 × {multiplierVal.toFixed(2)}x = ${(30 * multiplierVal).toFixed(2)} commission
              </span>
            </div>
          </div>

          {/* Section: Historical Data Locking vs Retroactive Recalculation */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-emerald-700" />
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Application Scope & Historical Immutability
              </label>
            </div>

            {/* Option A: Future-Only Application (Default) */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                !applyRetroactively
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-2xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="retroScope"
                checked={!applyRetroactively}
                onChange={() => setApplyRetroactively(false)}
                className="mt-1 h-4 w-4 text-emerald-700 focus:ring-emerald-500"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">
                    Apply to Future Activations Only (Default & Recommended)
                  </span>
                  <span className="rounded bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.2">
                    Default
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  <strong>Time-Stamped Multiplier Logs:</strong> Treats previous lines as immutable financial events.
                  All past activations and commission payments remain locked at their original dollar values.
                  The new <strong>{multiplierVal.toFixed(2)}x</strong> rate will only apply to new activations created after this change.
                </p>
              </div>
            </label>

            {/* Option B: Selective Retroactive Recalculation (Admin Override Tool) */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                applyRetroactively
                  ? 'border-amber-500 bg-amber-50/50 shadow-2xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="retroScope"
                checked={applyRetroactively}
                onChange={() => setApplyRetroactively(true)}
                className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500"
              />
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">
                    Apply this multiplier to past activations (Admin Override)
                  </span>
                  <span className="rounded bg-amber-200 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.2">
                    Override
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Select a specific date range. The system will scan <strong>{rep.name}</strong>'s history within that timeframe and recalculate past commission payouts. Activations outside the selected range remain untouched.
                </p>
              </div>
            </label>

            {/* Date Range Selector when Retroactive Override is Enabled */}
            {applyRetroactively && (
              <div className="ml-7 rounded-2xl border border-amber-300/80 bg-white p-4 space-y-4 animate-fade-in shadow-2xs">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Calendar className="h-4 w-4 text-amber-600" />
                  <span>Select Historical Recalculation Date Range:</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-900 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-900 outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Recalculation Impact Preview */}
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-950">
                      Eligible Activations in Range:
                    </span>
                    <span className="font-mono font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                      {calculationSummary.count} lines found
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="bg-white p-2 rounded-lg border border-amber-200/80">
                      <div className="text-[10px] text-slate-500">Current Payout</div>
                      <div className="font-mono font-bold text-slate-800 text-xs mt-0.5">
                        ${calculationSummary.currentTotal.toFixed(2)}
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-amber-200/80">
                      <div className="text-[10px] text-slate-500">Recalculated ({multiplierVal.toFixed(2)}x)</div>
                      <div className="font-mono font-bold text-emerald-800 text-xs mt-0.5">
                        ${calculationSummary.recalculatedTotal.toFixed(2)}
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-amber-200/80">
                      <div className="text-[10px] text-slate-500">Net Adjustment</div>
                      <div className={`font-mono font-extrabold text-xs mt-0.5 ${
                        calculationSummary.diff >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {calculationSummary.diff >= 0 ? `+$${calculationSummary.diff.toFixed(2)}` : `-$${Math.abs(calculationSummary.diff).toFixed(2)}`}
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-amber-800/80 leading-normal pt-1">
                    * Activations before {startDate} or after {endDate} will keep their original time-stamped commission rates.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-[#0F3E2E] hover:bg-[#14533D] px-5 py-2 text-xs font-bold text-white transition-all shadow-xs"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>
              {applyRetroactively
                ? `Confirm & Recalculate (${calculationSummary.count} lines)`
                : 'Apply Multiplier (Future Only)'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
