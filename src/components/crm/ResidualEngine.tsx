import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { CustomerRecord, MonthlyCohortSummary } from '../../types/telecom';
import { getResidualTierForCount } from '../../services/telecomStorage';
import {
  fetchMonthlyCohortsFromSupabase,
  upsertMonthlyCohortOverrideInSupabase,
  MonthlyCohortOverrideRecord,
} from '../../services/supabase';
import { DateRangeFilter, DateFilterMode } from './DateRangeFilter';
import {
  Lock,
  Sparkles,
  Users,
  CheckCircle2,
  Pencil,
  X,
  Save,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface ResidualEngineProps {
  customers: CustomerRecord[];
  isMasterAdmin: boolean;
  currentStaffName?: string;
  onRefreshData: () => void;
}

function formatCohortMonthName(yyyyMm: string): string {
  const [yearStr, monthStr] = yyyyMm.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(month)) return yyyyMm;
  const dateObj = new Date(year, month - 1, 1);
  return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getCustomerActivationCohort(c: CustomerRecord): string | null {
  if (c.residual?.activationCohort && c.residual.activationCohort.length >= 7) {
    return c.residual.activationCohort.substring(0, 7);
  }
  if (c.activationStartDate && c.activationStartDate.length >= 7) {
    return c.activationStartDate.substring(0, 7);
  }
  if ((c.status === 'active_line' || c.status === 'non_active_line') && c.submittedAt && c.submittedAt.length >= 7) {
    return c.submittedAt.substring(0, 7);
  }
  return null;
}

export const ResidualEngine: React.FC<ResidualEngineProps> = ({
  customers,
  isMasterAdmin,
  currentStaffName = 'Master Admin',
  onRefreshData,
}) => {
  const currentMonth = useMemo(() => new Date().toISOString().substring(0, 7), []);

  // Global Supabase cohort overrides state
  const [cohortOverrides, setCohortOverrides] = useState<Record<string, MonthlyCohortOverrideRecord>>({});
  const [isLoadingCohorts, setIsLoadingCohorts] = useState<boolean>(true);

  // Standardized Date Range Selector for Monthly Residuals Dashboard
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('all');
  const [selectedFilterMonth, setSelectedFilterMonth] = useState<string>(currentMonth);
  const [customStartMonth, setCustomStartMonth] = useState<string>(currentMonth);
  const [customEndMonth, setCustomEndMonth] = useState<string>(currentMonth);

  const [selectedCohort, setSelectedCohort] = useState<string>(currentMonth);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  // Edit Details Modal State (Master Admin only)
  const [editingCohort, setEditingCohort] = useState<MonthlyCohortSummary | null>(null);
  const [editActivations, setEditActivations] = useState<string>('0');
  const [editActiveSubscribers, setEditActiveSubscribers] = useState<string>('0');
  const [editTotalBilling, setEditTotalBilling] = useState<string>('0');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  const loadSupabaseCohorts = useCallback(async () => {
    setIsLoadingCohorts(true);
    try {
      const res = await fetchMonthlyCohortsFromSupabase();
      const map: Record<string, MonthlyCohortOverrideRecord> = {};
      res.data.forEach((row) => {
        if (row.cohort_month) {
          map[row.cohort_month] = row;
        }
      });
      setCohortOverrides(map);
    } finally {
      setIsLoadingCohorts(false);
    }
  }, []);

  useEffect(() => {
    loadSupabaseCohorts();
  }, [loadSupabaseCohorts]);

  // Clean real database records (exclude soft-deleted records)
  const activeOrCanceledDbRecords = useMemo(() => {
    return customers.filter(
      (c) => !c.isDeleted && (c.status === 'active_line' || c.status === 'non_active_line')
    );
  }, [customers]);

  // Build cohort summaries cleanly from real database records + Supabase overrides
  // Initializes with a clean slate (0 active lines, $0 billing) when no database records exist
  const cohortSummaries: MonthlyCohortSummary[] = useMemo(() => {
    const monthSet = new Set<string>();
    monthSet.add(currentMonth);

    activeOrCanceledDbRecords.forEach((c) => {
      const m = getCustomerActivationCohort(c);
      if (m) monthSet.add(m);
    });

    Object.keys(cohortOverrides).forEach((m) => {
      if (m && m.length >= 7) monthSet.add(m);
    });

    const sortedMonths = Array.from(monthSet).sort().reverse();

    return sortedMonths.map((cohortMonth) => {
      const realCohortAll = activeOrCanceledDbRecords.filter(
        (c) => getCustomerActivationCohort(c) === cohortMonth
      );
      const realCohortActive = realCohortAll.filter((c) => c.status === 'active_line');

      const realActivationsCount = realCohortAll.length;
      const realActiveCount = realCohortActive.length;
      const realMonthlyBilling = Number(
        realCohortActive.reduce((sum, c) => sum + (Number(c.monthlyPlanPrice) || 0), 0).toFixed(2)
      );

      const override = cohortOverrides[cohortMonth];
      const hasOverride = Boolean(override && override.is_overridden !== false);

      const totalActivationsInMonth = hasOverride
        ? Number(override.monthly_activations ?? 0)
        : realActivationsCount;

      const activeSubscribers = hasOverride
        ? Number(override.active_subscribers ?? 0)
        : realActiveCount;

      const totalMonthlyBilling = hasOverride
        ? Number(Number(override.total_monthly_billing ?? 0).toFixed(2))
        : realMonthlyBilling;

      const { tier, rate } = getResidualTierForCount(totalActivationsInMonth);
      const monthlyResidualPayout = Number((totalMonthlyBilling * rate).toFixed(2));

      return {
        cohortMonth,
        cohortName: override?.cohort_name || formatCohortMonthName(cohortMonth),
        totalActivationsInMonth,
        tier,
        lockedResidualRate: rate,
        activeSubscribers,
        totalMonthlyBilling,
        monthlyResidualPayout,
        isCurrentMonth: cohortMonth === currentMonth,
        isOverridden: hasOverride,
        updatedAt: override?.updated_at,
      };
    });
  }, [activeOrCanceledDbRecords, cohortOverrides, currentMonth]);

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

  // Keep selectedCohort valid within filtered range
  useEffect(() => {
    if (filteredCohortSummaries.length > 0) {
      const found = filteredCohortSummaries.some((c) => c.cohortMonth === selectedCohort);
      if (!found) {
        setSelectedCohort(filteredCohortSummaries[0].cohortMonth);
      }
    }
  }, [filteredCohortSummaries, selectedCohort]);

  // Grand totals
  const totalMonthlyResidual = cohortSummaries.reduce((sum, c) => sum + c.monthlyResidualPayout, 0);
  const totalActiveSubscribers = cohortSummaries.reduce((sum, c) => sum + c.activeSubscribers, 0);
  const currentMonthSummary = cohortSummaries.find((c) => c.isCurrentMonth) || cohortSummaries[0];

  // Real database customers in selected cohort
  const cohortCustomers = useMemo(() => {
    return activeOrCanceledDbRecords.filter(
      (c) => getCustomerActivationCohort(c) === selectedCohort
    );
  }, [activeOrCanceledDbRecords, selectedCohort]);

  // Open Master Admin Edit Details modal
  const handleOpenEditModal = (cohort: MonthlyCohortSummary) => {
    if (!isMasterAdmin) return;
    setEditingCohort(cohort);
    setEditActivations(String(cohort.totalActivationsInMonth));
    setEditActiveSubscribers(String(cohort.activeSubscribers));
    setEditTotalBilling(String(cohort.totalMonthlyBilling.toFixed(2)));
    setEditError(null);
  };

  const handleCloseEditModal = () => {
    if (isSavingEdit) return;
    setEditingCohort(null);
    setEditError(null);
  };

  // Live preview calculations inside modal
  const previewActivations = Math.max(0, parseInt(editActivations, 10) || 0);
  const previewActiveSubscribers = Math.max(0, parseInt(editActiveSubscribers, 10) || 0);
  const previewTotalBilling = Math.max(0, parseFloat(editTotalBilling) || 0);
  const previewTierInfo = getResidualTierForCount(previewActivations);
  const previewResidualPayout = Number((previewTotalBilling * previewTierInfo.rate).toFixed(2));

  const handleSaveCohortOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCohort || !isMasterAdmin) return;

    const activations = Math.max(0, parseInt(editActivations, 10) || 0);
    const activeSubscribers = Math.max(0, parseInt(editActiveSubscribers, 10) || 0);
    const totalBilling = Number(Math.max(0, parseFloat(editTotalBilling) || 0).toFixed(2));

    setIsSavingEdit(true);
    setEditError(null);

    try {
      const res = await upsertMonthlyCohortOverrideInSupabase({
        cohortMonth: editingCohort.cohortMonth,
        cohortName: editingCohort.cohortName,
        monthlyActivations: activations,
        activeSubscribers,
        totalMonthlyBilling: totalBilling,
        updatedBy: currentStaffName,
      });

      if (res.error) {
        setEditError(res.error.message || 'Failed to save cohort overrides to Supabase.');
        return;
      }

      if (res.data) {
        setCohortOverrides((prev) => ({
          ...prev,
          [editingCohort.cohortMonth]: res.data!,
        }));
      }

      setEditingCohort(null);
      setFeedbackMsg(
        `Cohort ${editingCohort.cohortName} (${editingCohort.cohortMonth}) updated in Supabase: ${activations} activations, ${activeSubscribers} active subscribers, $${totalBilling.toFixed(2)}/mo billing.`
      );
      setTimeout(() => setFeedbackMsg(''), 4500);
      onRefreshData();
    } catch (err: any) {
      setEditError(err?.message || 'Unexpected error saving cohort details.');
    } finally {
      setIsSavingEdit(false);
    }
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
              Dealer residual payout percentage is determined by the total volume of activations achieved in the customer&apos;s calendar month of activation:
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
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
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
              Monthly Activation Cohorts &amp; Static Residual Rates
            </h3>
            <p className="text-xs text-slate-500">
              Select any cohort to inspect subscriber lines, volume thresholds, and locked residual rates from live database records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                loadSupabaseCohorts();
                onRefreshData();
              }}
              disabled={isLoadingCohorts}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-emerald-700 ${isLoadingCohorts ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* Current Month Progress */}
            {currentMonthSummary && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                <span className="font-semibold text-slate-600">Current Month Progress:</span>
                <span className="font-extrabold text-emerald-800 tabular-nums">
                  {currentMonthSummary.totalActivationsInMonth} / 200 lines
                </span>
                <span
                  className={`rounded font-bold text-[10px] px-1.5 py-0.5 ${
                    currentMonthSummary.totalActivationsInMonth >= 200
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {currentMonthSummary.tier}
                </span>
              </div>
            )}
          </div>
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
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{cohort.cohortName}</span>
                        {cohort.isOverridden && (
                          <span className="rounded bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 text-[9px] font-bold uppercase">
                            Manual Override
                          </span>
                        )}
                      </div>
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
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCohort(cohort.cohortMonth);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-700 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Inspect'}
                        </button>

                        {isMasterAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(cohort);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            <Pencil className="h-3 w-3" />
                            <span>Edit Details</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
            No active or canceled subscriber records found in cohort {selectedCohort}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Customer &amp; Line</th>
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
                  const cohortSummary = cohortSummaries.find((s) => s.cohortMonth === selectedCohort);
                  const rate = customer.residual?.lockedResidualRate ?? cohortSummary?.lockedResidualRate ?? 0.07;
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

      {/* Master Admin: Edit Cohort Details Modal */}
      {isMasterAdmin && editingCohort && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={handleCloseEditModal}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-emerald-950 px-5 py-4 text-white">
              <div>
                <h4 className="text-sm font-bold">
                  Edit Cohort Details — {editingCohort.cohortName}
                </h4>
                <p className="text-[11px] text-emerald-200/80 font-mono">
                  Cohort: {editingCohort.cohortMonth} · Persisted in Supabase
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseEditModal}
                disabled={isSavingEdit}
                className="rounded-lg p-1 text-emerald-200 hover:bg-emerald-900 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCohortOverride} className="p-5 space-y-4">
              {editError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  <div className="flex items-start gap-2 font-semibold">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{editError}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monthly Activations (Lines)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  required
                  value={editActivations}
                  onChange={(e) => setEditActivations(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 tabular-nums focus:border-emerald-500 outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  200+ monthly activations unlocks Tier 2 (9%) lifetime residual rate.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Active Subscribers
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  required
                  value={editActiveSubscribers}
                  onChange={(e) => setEditActiveSubscribers(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 tabular-nums focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Total Monthly Billing ($ CAD)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={editTotalBilling}
                  onChange={(e) => setEditTotalBilling(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 tabular-nums focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Live Result Preview */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Calculated Tier &amp; Rate:</span>
                  <span className="font-bold text-emerald-900">
                    {previewTierInfo.tier} ({(previewTierInfo.rate * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Active Subscribers:</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {previewActiveSubscribers} lines
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-emerald-200/80 pt-1.5 font-bold text-emerald-950">
                  <span>Monthly Dealer Residual:</span>
                  <span className="text-sm tabular-nums">${previewResidualPayout.toFixed(2)}/mo</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={isSavingEdit}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F3E2E] hover:bg-[#14533D] px-5 py-2 text-xs font-bold text-white shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-300" />
                  ) : (
                    <Save className="h-3.5 w-3.5 text-emerald-300" />
                  )}
                  <span>{isSavingEdit ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
