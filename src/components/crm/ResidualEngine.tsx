import React, { useState, useMemo, useEffect } from 'react';
import { CustomerRecord, MonthlyCohortSummary } from '../../types/telecom';
import { TelecomStorage } from '../../services/telecomStorage';
import { DateRangeFilter, DateFilterMode } from './DateRangeFilter';
import {
  DollarSign,
  TrendingUp,
  Lock,
  Layers,
  Sparkles,
  ShieldCheck,
  Zap,
  Users,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface ResidualEngineProps {
  customers: CustomerRecord[];
  onRefreshData: () => void;
}

export const ResidualEngine: React.FC<ResidualEngineProps> = ({ customers, onRefreshData }) => {
  const [cohortSummaries, setCohortSummaries] = useState<MonthlyCohortSummary[]>(
    TelecomStorage.getCohortSummaries()
  );

  // Standardized Date Range Selector for Monthly Residuals Dashboard
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('all');
  const [selectedFilterMonth, setSelectedFilterMonth] = useState<string>('2026-11');
  const [customStartMonth, setCustomStartMonth] = useState<string>('2026-08');
  const [customEndMonth, setCustomEndMonth] = useState<string>('2026-11');

  const availableCohortMonths = useMemo(() => {
    return cohortSummaries.map((c) => c.cohortMonth).sort().reverse();
  }, [cohortSummaries]);

  // Filtered Cohort Summaries according to the Date Range Selector
  const filteredCohortSummaries = useMemo(() => {
    if (dateFilterMode === 'single') {
      return cohortSummaries.filter((c) => c.cohortMonth === selectedFilterMonth);
    }
    if (dateFilterMode === 'custom') {
      const start = customStartMonth <= customEndMonth ? customStartMonth : customEndMonth;
      const end = customStartMonth <= customEndMonth ? customEndMonth : customStartMonth;
      return cohortSummaries.filter((c) => c.cohortMonth >= start && c.cohortMonth <= end);
    }
    return cohortSummaries;
  }, [cohortSummaries, dateFilterMode, selectedFilterMonth, customStartMonth, customEndMonth]);

  const [selectedCohort, setSelectedCohort] = useState<string>(
    filteredCohortSummaries[0]?.cohortMonth || '2026-11'
  );

  // Ensure selectedCohort is within filtered cohort range
  useEffect(() => {
    if (filteredCohortSummaries.length > 0) {
      const found = filteredCohortSummaries.some((c) => c.cohortMonth === selectedCohort);
      if (!found) {
        setSelectedCohort(filteredCohortSummaries[0].cohortMonth);
      }
    }
  }, [filteredCohortSummaries, selectedCohort]);

  const [customVolumeInput, setCustomVolumeInput] = useState<string>('205');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Refresh summaries helper
  const reloadSummaries = () => {
    setCohortSummaries(TelecomStorage.getCohortSummaries());
    onRefreshData();
  };

  // Grand totals
  const totalMonthlyResidual = cohortSummaries.reduce((sum, c) => sum + c.monthlyResidualPayout, 0);
  const totalActiveSubscribers = cohortSummaries.reduce((sum, c) => sum + c.activeSubscribers, 0);
  const currentMonthSummary = cohortSummaries.find((c) => c.isCurrentMonth) || cohortSummaries[0];

  // Customers in selected cohort
  const cohortCustomers = customers.filter(
    (c) =>
      c.residual?.activationCohort === selectedCohort ||
      c.activationStartDate?.startsWith(selectedCohort)
  );

  // Simulation handler for testing Tier 2 (200+ activations)
  const handleBoostVolume = (targetCount: number) => {
    TelecomStorage.setMonthlyVolume(selectedCohort, targetCount);
    reloadSummaries();
    setFeedbackMsg(`✓ Cohort ${selectedCohort} volume updated to ${targetCount} activations. Locked rate updated!`);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  return (
    <div className="space-y-8">
      
      {/* Top Banner Explaining the Static Rate Rule & Tiered Logic */}
      <div className="rounded-2xl border-2 border-emerald-600/30 bg-gradient-to-r from-emerald-950 via-[#0B3527] to-[#0E4231] p-6 text-white shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-900/60 px-3 py-1 text-xs font-semibold text-emerald-300">
              <Lock className="h-3.5 w-3.5 text-emerald-400" />
              <span>Static Rate Rule: Lifetime Locked Residual Engine</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              CTExcel Monthly Residual Commission Model
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Dealer residual payout percentage is determined by the total volume of activations achieved in the customer's calendar month of activation:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-900/40 p-3">
                <div className="font-bold text-emerald-300">Tier 1 (1 to 199 lines/month)</div>
                <div className="text-white font-extrabold text-sm mt-0.5">7% Residual Locked</div>
                <p className="text-[11px] text-emerald-200/70 mt-1">
                  Permanently pays 7% of customer monthly plan price every month for life while active.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-400/40 bg-emerald-800/40 p-3">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <span>Tier 2 (200+ lines/month)</span>
                  <span className="rounded bg-emerald-400 text-emerald-950 font-extrabold text-[9px] px-1.5 py-0.2">TOP TIER</span>
                </div>
                <div className="text-white font-extrabold text-sm mt-0.5">9% Residual Locked</div>
                <p className="text-[11px] text-emerald-200/70 mt-1">
                  Hitting 200+ lines in a calendar month unlocks 9% lifetime residual for every line generated that month.
                </p>
              </div>
            </div>
          </div>

          {/* Grand Monthly Payout Widget */}
          <div className="w-full lg:w-auto shrink-0 rounded-2xl border border-emerald-400/30 bg-emerald-900/50 p-5 text-right backdrop-blur-md">
            <div className="text-xs font-semibold text-emerald-300">Total Monthly Recurring Residual</div>
            <div className="text-3xl font-extrabold text-white mt-1 tabular-nums">
              ${totalMonthlyResidual.toFixed(2)}
              <span className="text-xs font-normal text-emerald-200">/mo</span>
            </div>
            <div className="text-xs text-emerald-200/80 mt-1 flex items-center justify-end gap-1">
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              <span>{totalActiveSubscribers} Currently Active Lines</span>
            </div>
            <div className="mt-3 pt-3 border-t border-emerald-500/30 text-[10px] text-emerald-300/70">
              Paid on the 1st of every calendar month
            </div>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Date Range Selector for Monthly Residuals Dashboard (Admin Only) */}
      <DateRangeFilter
        mode={dateFilterMode}
        onModeChange={setDateFilterMode}
        selectedMonth={selectedFilterMonth}
        onSelectMonth={setSelectedFilterMonth}
        customStartMonth={customStartMonth}
        onCustomStartChange={setCustomStartMonth}
        customEndMonth={customEndMonth}
        onCustomEndChange={setCustomEndMonth}
        availableMonths={availableCohortMonths}
        totalRecordsCount={cohortSummaries.length}
        filteredCount={filteredCohortSummaries.length}
        label="Cohorts"
      />

      {/* Cohort Breakdown Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Monthly Activation Cohorts & Static Residual Rates
            </h3>
            <p className="text-xs text-slate-500">
              Select any cohort to inspect subscriber lines, volume thresholds, and locked residual rates.
            </p>
          </div>

          {/* Current Month Progress */}
          {currentMonthSummary && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="font-semibold text-slate-600">Current Month Progress:</span>
              <span className="font-extrabold text-emerald-800 tabular-nums">
                {currentMonthSummary.totalActivationsInMonth} / 200 lines
              </span>
              <span className={`rounded font-bold text-[10px] px-1.5 py-0.5 ${
                currentMonthSummary.totalActivationsInMonth >= 200
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {currentMonthSummary.tier}
              </span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Cohort Month</th>
                <th className="py-3 px-3">Monthly Activations</th>
                <th className="py-3 px-3">Volume Tier</th>
                <th className="py-3 px-3">Locked Residual Rate</th>
                <th className="py-3 px-3">Active Subscribers</th>
                <th className="py-3 px-3">Total Monthly Billing</th>
                <th className="py-3 px-3">Monthly Dealer Residual</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCohortSummaries.map((cohort) => {
                const isSelected = selectedCohort === cohort.cohortMonth;
                const isTier2 = cohort.tier === 'Tier 2 (9%)';

                return (
                  <tr
                    key={cohort.cohortMonth}
                    onClick={() => setSelectedCohort(cohort.cohortMonth)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Cohort Name */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{cohort.cohortName}</div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {cohort.cohortMonth} {cohort.isCurrentMonth && '(Active Month)'}
                      </div>
                    </td>

                    {/* Activations */}
                    <td className="py-3 px-3">
                      <span className="font-extrabold text-slate-800 text-sm tabular-nums">
                        {cohort.totalActivationsInMonth}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">lines</span>
                    </td>

                    {/* Tier */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          isTier2
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {isTier2 && <Sparkles className="h-3 w-3 text-emerald-600" />}
                        <span>{cohort.tier}</span>
                      </span>
                    </td>

                    {/* Locked Residual Rate */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <Lock className="h-3 w-3 text-emerald-700" />
                        <span className="font-extrabold text-emerald-900 text-sm tabular-nums">
                          {(cohort.lockedResidualRate * 100).toFixed(0)}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">(Locked Lifetime)</span>
                      </div>
                    </td>

                    {/* Active Subscribers */}
                    <td className="py-3 px-3 font-semibold text-slate-800 tabular-nums">
                      {cohort.activeSubscribers} lines
                    </td>

                    {/* Total Billing */}
                    <td className="py-3 px-3 font-medium text-slate-700 tabular-nums">
                      ${cohort.totalMonthlyBilling.toFixed(2)}/mo
                    </td>

                    {/* Monthly Residual */}
                    <td className="py-3 px-3 font-extrabold text-emerald-800 tabular-nums text-sm">
                      ${cohort.monthlyResidualPayout.toFixed(2)}/mo
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCohort(cohort.cohortMonth);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Volume Simulator for Testing Requirement 3 */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900">
                Cohort Volume Testing & Rate Lock Simulator
              </h4>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate dealer monthly volumes for cohort <strong>{selectedCohort}</strong> to verify the 200+ line Tier 2 (9%) trigger.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBoostVolume(165)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              Set Tier 1 (165 lines · 7%)
            </button>

            <button
              onClick={() => handleBoostVolume(225)}
              className="rounded-xl border border-emerald-400 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
            >
              Set Tier 2 (225 lines · 9% Unlock)
            </button>

            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
              <input
                type="number"
                value={customVolumeInput}
                onChange={(e) => setCustomVolumeInput(e.target.value)}
                className="w-20 rounded-lg border border-slate-300 bg-white p-1 text-xs text-center font-bold font-mono outline-none"
              />
              <button
                onClick={() => handleBoostVolume(parseInt(customVolumeInput) || 200)}
                className="rounded-lg bg-[#0F3E2E] px-3 py-1 text-xs font-bold text-white hover:bg-[#14533D]"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Line Residual Breakdown in Selected Cohort */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Subscribers in Cohort: {selectedCohort} ({cohortCustomers.length})
            </h3>
            <p className="text-xs text-slate-500">
              Each active line receives the locked cohort residual rate indefinitely until canceled.
            </p>
          </div>
        </div>

        {cohortCustomers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No sample customer records mapped specifically to cohort {selectedCohort}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Customer & Line</th>
                  <th className="py-2.5 px-3">Plan Details</th>
                  <th className="py-2.5 px-3">Plan Monthly Price</th>
                  <th className="py-2.5 px-3">Line Status</th>
                  <th className="py-2.5 px-3">Locked Residual %</th>
                  <th className="py-2.5 px-3 text-right">Monthly Residual Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cohortCustomers.map((customer) => {
                  const isActive = customer.status === 'active_line';
                  const rate = customer.residual?.lockedResidualRate || 0.07;
                  const price = customer.monthlyPlanPrice || 27;
                  const monthlyResidual = isActive ? Number((price * rate).toFixed(2)) : 0;

                  return (
                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{customer.fullName}</div>
                        <div className="font-mono text-[10px] text-slate-400">
                          {customer.id} · {customer.activatedPhone || customer.phone}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{customer.preferredPlanName}</div>
                        <div className="text-[10px] text-slate-400">Rep: {customer.salesRep}</div>
                      </td>

                      <td className="py-3 px-3 font-bold text-slate-800 tabular-nums">
                        ${price.toFixed(2)}/mo
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isActive ? 'Active Subscriber' : 'Non-Active (Canceled)'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                          {(rate * 100).toFixed(0)}% Locked
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        {isActive ? (
                          <div className="font-extrabold text-emerald-800 tabular-nums text-sm">
                            +${monthlyResidual.toFixed(2)}/mo
                          </div>
                        ) : (
                          <div className="text-slate-400 italic text-[11px]">
                            $0.00 (Line Canceled)
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
