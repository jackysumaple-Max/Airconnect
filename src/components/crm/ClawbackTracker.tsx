import React, { useState, useMemo } from 'react';
import { CustomerRecord, StaffRep, CommissionStatus } from '../../types/telecom';
import { calculateDaysBetween } from '../../services/telecomStorage';
import {
  AlertTriangle,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  CheckCircle,
  Clock,
  RotateCcw,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  Search,
  ExternalLink,
  Layers,
  Sparkles,
  User,
} from 'lucide-react';

interface ClawbackTrackerProps {
  customers: CustomerRecord[];
  staffMembers: StaffRep[];
  currentStaff: StaffRep;
  onOpenCustomer: (customer: CustomerRecord) => void;
  onUpdateCommissionStatus: (id: string, status: CommissionStatus) => void;
}

export const ClawbackTracker: React.FC<ClawbackTrackerProps> = ({
  customers,
  staffMembers,
  currentStaff,
  onOpenCustomer,
  onUpdateCommissionStatus,
}) => {
  const isMasterAdmin = Boolean(currentStaff.isMasterAdmin || currentStaff.role === 'super_admin');

  // --- 1. DYNAMIC FILTERING SYSTEM ---
  // Date Range Selector: 'all' | 'single' | 'custom'
  const [dateFilterMode, setDateFilterMode] = useState<'all' | 'single' | 'custom'>('all');
  const [selectedSingleMonth, setSelectedSingleMonth] = useState<string>('2026-10');
  const [customRangeStart, setCustomRangeStart] = useState<string>('2026-08');
  const [customRangeEnd, setCustomRangeEnd] = useState<string>('2026-11');

  // Sales Rep Selector: Multi-select group, single rep, or all reps simultaneously
  // Set of rep names that are selected. Empty set = all reps selected
  const [selectedRepNames, setSelectedRepNames] = useState<string[]>([]);

  // Expanded rep rows for Ledger Drill-Down Capability
  const [expandedRepNames, setExpandedRepNames] = useState<string[]>([]);

  // Search inside ledger drill-down
  const [drillSearch, setDrillSearch] = useState('');

  // Available months dynamically extracted from customer records
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    // Add default fallbacks
    monthSet.add('2026-11');
    monthSet.add('2026-10');
    monthSet.add('2026-09');
    monthSet.add('2026-08');

    customers.forEach((c) => {
      if (c.activationStartDate) {
        monthSet.add(c.activationStartDate.substring(0, 7));
      }
      if (c.commission?.payoutDate) {
        monthSet.add(c.commission.payoutDate.substring(0, 7));
      }
      if (c.submittedAt) {
        monthSet.add(c.submittedAt.substring(0, 7));
      }
    });

    return Array.from(monthSet).sort().reverse();
  }, [customers]);

  // Helper to format "2026-10" to "October 2026"
  const formatMonthLabel = (yyyyMm: string) => {
    try {
      const [year, month] = yyyyMm.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return yyyyMm;
    }
  };

  // Toggle Rep in multi-select
  const toggleRepSelection = (repName: string) => {
    if (selectedRepNames.includes(repName)) {
      setSelectedRepNames(selectedRepNames.filter((n) => n !== repName));
    } else {
      setSelectedRepNames([...selectedRepNames, repName]);
    }
  };

  const selectAllReps = () => setSelectedRepNames([]);
  const selectOnlyRep = (repName: string) => setSelectedRepNames([repName]);

  // Toggle accordion drill-down
  const toggleRepExpansion = (repName: string) => {
    if (expandedRepNames.includes(repName)) {
      setExpandedRepNames(expandedRepNames.filter((n) => n !== repName));
    } else {
      setExpandedRepNames([...expandedRepNames, repName]);
    }
  };

  // Filter customers by selected Date Range
  const dateFilteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Determine the reference date: payout date, activation start date, or submitted at
      const refDate = c.commission?.payoutDate || c.activationStartDate || c.submittedAt?.split('T')[0];
      if (!refDate) return true;

      const refMonth = refDate.substring(0, 7);

      if (dateFilterMode === 'single') {
        return refMonth === selectedSingleMonth;
      }

      if (dateFilterMode === 'custom') {
        return refMonth >= customRangeStart && refMonth <= customRangeEnd;
      }

      return true; // 'all'
    });
  }, [customers, dateFilterMode, selectedSingleMonth, customRangeStart, customRangeEnd]);

  // Filter staff to include based on Sales Rep Selector & Privacy
  const visibleStaff = useMemo(() => {
    // Commission Isolation: Sales Reps can only view their own personal commission payouts.
    // They cannot view the commission ledger or payout amounts of any other staff member under any circumstances.
    if (!isMasterAdmin) {
      const self =
        staffMembers.find(
          (s) =>
            s.name.toLowerCase() === currentStaff.name.toLowerCase() ||
            s.username.toLowerCase() === currentStaff.username.toLowerCase()
        ) || currentStaff;
      return [self];
    }

    if (selectedRepNames.length === 0) {
      return staffMembers; // all reps for Master Admin
    }
    return staffMembers.filter((s) => selectedRepNames.includes(s.name));
  }, [staffMembers, selectedRepNames, isMasterAdmin, currentStaff]);

  // Calculate Ledger Data for Visible Reps
  const ledgerRows = useMemo(() => {
    return visibleStaff.map((rep) => {
      // All lines attributed to this rep within the filtered date range
      const repLines = dateFilteredCustomers.filter((c) => c.salesRep === rep.name);

      const activeLinesCount = repLines.filter((c) => c.status === 'active_line').length;

      const paidLines = repLines.filter((c) => c.commission?.status === 'paid');
      const paidAmount = paidLines.reduce((sum, c) => sum + (c.commission?.amount || 0), 0);

      const pendingLines = repLines.filter((c) => c.commission?.status === 'pending');
      const pendingAmount = pendingLines.reduce((sum, c) => sum + (c.commission?.amount || 0), 0);

      // Clawback conditions: status 'clawback', flagged, or canceled within 180 days
      const clawbackLines = repLines.filter(
        (c) =>
          c.commission?.status === 'clawback' ||
          c.commission?.isClawbackFlagged ||
          (c.status === 'non_active_line' &&
            c.activationStartDate &&
            calculateDaysBetween(c.activationStartDate, c.deactivationDate) <= 180)
      );
      const clawbackAmount = clawbackLines.reduce((sum, c) => sum + (c.commission?.amount || 0), 0);

      const netPayable = paidAmount + pendingAmount - clawbackAmount;

      return {
        rep,
        allLines: repLines,
        totalLinesCount: repLines.length,
        activeLinesCount,
        paidCount: paidLines.length,
        paidAmount,
        pendingCount: pendingLines.length,
        pendingAmount,
        clawbackCount: clawbackLines.length,
        clawbackAmount,
        netPayable,
      };
    });
  }, [visibleStaff, dateFilteredCustomers]);

  // Aggregate KPI summary for currently filtered view
  const overallKpi = useMemo(() => {
    const totalLines = ledgerRows.reduce((sum, r) => sum + r.totalLinesCount, 0);
    const totalPaid = ledgerRows.reduce((sum, r) => sum + r.paidAmount, 0);
    const totalPending = ledgerRows.reduce((sum, r) => sum + r.pendingAmount, 0);
    const totalClawback = ledgerRows.reduce((sum, r) => sum + r.clawbackAmount, 0);
    const totalClawbackCount = ledgerRows.reduce((sum, r) => sum + r.clawbackCount, 0);
    const netPayout = totalPaid + totalPending - totalClawback;

    return {
      totalLines,
      totalPaid,
      totalPending,
      totalClawback,
      totalClawbackCount,
      netPayout,
    };
  }, [ledgerRows]);

  // Flagged accounts for quick audit section
  const flaggedAuditAccounts = useMemo(() => {
    return dateFilteredCustomers.filter((c) => {
      if (selectedRepNames.length > 0 && !selectedRepNames.includes(c.salesRep)) {
        return false;
      }
      return (
        c.commission?.status === 'clawback' ||
        c.commission?.isClawbackFlagged ||
        (c.status === 'non_active_line' &&
          c.activationStartDate &&
          calculateDaysBetween(c.activationStartDate, c.deactivationDate) <= 180)
      );
    });
  }, [dateFilteredCustomers, selectedRepNames]);

  return (
    <div className="space-y-6">

      {/* Top Banner: 180-Day Automated Policy Explainer */}
      <div className="rounded-3xl border-2 border-emerald-800/30 bg-gradient-to-r from-emerald-950/90 via-[#0B2A20] to-[#0A261D] p-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-emerald-500/20 border border-emerald-400/40 p-3 text-emerald-300 shrink-0">
              <ShieldAlert className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">
                  Commission Payout & Automated 180-Day Clawback Engine
                </h3>
                <span className="rounded-full bg-emerald-400/20 border border-emerald-400/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  Telus Dealer Agreement
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-1 max-w-3xl leading-relaxed">
                Wholesale dealer policy enforces a minimum active commitment of <strong>6 months (180 days)</strong>.
                If any customer line cancels or transfers before 180 days elapsed from the <em>Activation Start Date</em>, the system automatically marks the account as <strong>Clawed Back</strong> and reverses the payout from the assigned Sales Representative.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-right">
              <div className="text-[10px] font-semibold text-emerald-200/70 uppercase tracking-wider">
                Active Clawback Deductions
              </div>
              <div className="text-2xl font-black text-rose-400 tabular-nums">
                -${overallKpi.totalClawback.toFixed(2)}
              </div>
              <div className="text-[10px] text-rose-300 font-bold">
                {overallKpi.totalClawbackCount} Accounts Flagged
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-400/10 border border-emerald-400/30 px-4 py-3 text-right">
              <div className="text-[10px] font-semibold text-emerald-200 uppercase tracking-wider">
                Net Dealer Balance
              </div>
              <div className="text-2xl font-black text-emerald-300 tabular-nums">
                ${overallKpi.netPayout.toFixed(2)}
              </div>
              <div className="text-[10px] text-emerald-400 font-bold">
                {overallKpi.totalLines} Lines Tracked
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ADVANCED FILTERING TOOLBAR */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-emerald-800" />
            <h4 className="text-sm font-bold text-slate-900">
              Dynamic Financial Filters & Reporting Controls
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Affects summary totals and ledger drill-down lines
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* 1. Date Range Selector */}
          <div className={`${isMasterAdmin ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-2`}>
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-emerald-700" />
              <span>Date Range Selector:</span>
            </label>

            {/* Mode Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setDateFilterMode('all')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  dateFilterMode === 'all'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => setDateFilterMode('single')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  dateFilterMode === 'single'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Single Month
              </button>
              <button
                type="button"
                onClick={() => setDateFilterMode('custom')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  dateFilterMode === 'custom'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Custom Multi-Month Range
              </button>
            </div>

            {/* Sub-selectors depending on mode */}
            {dateFilterMode === 'single' && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-500 whitespace-nowrap">Select Month:</span>
                <select
                  value={selectedSingleMonth}
                  onChange={(e) => setSelectedSingleMonth(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {formatMonthLabel(m)} ({m})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {dateFilterMode === 'custom' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="block text-[11px] text-slate-500 mb-0.5">From Month:</span>
                  <select
                    value={customRangeStart}
                    onChange={(e) => setCustomRangeStart(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                  >
                    {availableMonths.map((m) => (
                      <option key={m} value={m}>
                        {formatMonthLabel(m)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-500 mb-0.5">To Month:</span>
                  <select
                    value={customRangeEnd}
                    onChange={(e) => setCustomRangeEnd(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                  >
                    {availableMonths.map((m) => (
                      <option key={m} value={m}>
                        {formatMonthLabel(m)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 2. Sales Rep Selector (Master Admin Only) */}
          {isMasterAdmin && (
            <div className="lg:col-span-6 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Sales Rep Selector:</span>
                </label>

                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={selectAllReps}
                    className={`font-semibold hover:underline ${
                      selectedRepNames.length === 0 ? 'text-emerald-800 font-bold' : 'text-slate-500'
                    }`}
                  >
                    All Reps ({staffMembers.length})
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedRepNames([staffMembers[0].name])}
                    className="text-slate-500 hover:underline"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Rep Chips / Checkboxes */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={selectAllReps}
                  className={`rounded-xl px-2.5 py-1 text-xs font-bold transition-all border ${
                    selectedRepNames.length === 0
                      ? 'bg-emerald-900 text-white border-emerald-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ✓ All Staff
                </button>

                {staffMembers.map((rep) => {
                  const isSelected =
                    selectedRepNames.length === 0 || selectedRepNames.includes(rep.name);

                  return (
                    <button
                      key={rep.id}
                      type="button"
                      onClick={() => toggleRepSelection(rep.name)}
                      className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all border ${
                        isSelected && selectedRepNames.length > 0
                          ? 'bg-emerald-100 text-emerald-950 border-emerald-400 shadow-2xs'
                          : selectedRepNames.length === 0
                          ? 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          : 'bg-slate-50 text-slate-400 border-slate-200/60 opacity-60'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      <span>{rep.name}</span>
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400">
                {selectedRepNames.length === 0
                  ? 'Showing all active sales reps simultaneously.'
                  : `Filtered to ${selectedRepNames.length} selected rep(s): ${selectedRepNames.join(', ')}`}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* KPI METRICS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Paid Commissions</div>
          <div className="text-2xl font-black text-emerald-700 tabular-nums mt-0.5">
            ${overallKpi.totalPaid.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Settled to staff balances</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Pending Commissions</div>
          <div className="text-2xl font-black text-amber-600 tabular-nums mt-0.5">
            ${overallKpi.totalPending.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Awaiting payout cycle</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">180d Clawbacks Flagged</div>
          <div className="text-2xl font-black text-rose-700 tabular-nums mt-0.5">
            -${overallKpi.totalClawback.toFixed(2)}
          </div>
          <div className="text-[10px] text-rose-600 font-bold mt-0.5">
            {overallKpi.totalClawbackCount} Lines early-deactivated
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-4 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase">Net Payable Balance</div>
          <div className="text-2xl font-black text-emerald-950 tabular-nums mt-0.5">
            ${overallKpi.netPayout.toFixed(2)}
          </div>
          <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
            Paid + Pending - Clawbacks
          </div>
        </div>
      </div>

      {/* INTERACTIVE SALES REPRESENTATIVE COMMISSION & CLAWBACK LEDGER */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        
        {/* Ledger Header */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">
                Sales Representative Commission & Clawback Ledger
              </h3>
              <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5">
                Interactive Drill-Down
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click on any sales rep row to expand full line-item details with individual phone lines, multipliers, and clawback status.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                // Expand all or collapse all
                if (expandedRepNames.length === visibleStaff.length) {
                  setExpandedRepNames([]);
                } else {
                  setExpandedRepNames(visibleStaff.map((s) => s.name));
                }
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              {expandedRepNames.length === visibleStaff.length ? 'Collapse All' : 'Expand All Drill-Downs'}
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4">Sales Representative</th>
                <th className="py-3 px-4">Multiplier</th>
                <th className="py-3 px-4">Active Lines</th>
                <th className="py-3 px-4">Paid Commission</th>
                <th className="py-3 px-4">Pending Commission</th>
                <th className="py-3 px-4">180d Clawbacks</th>
                <th className="py-3 px-4 text-right">Net Payable Balance</th>
                <th className="py-3 px-4 text-center">Drill-Down</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledgerRows.map((row) => {
                const isExpanded = expandedRepNames.includes(row.rep.name);

                return (
                  <React.Fragment key={row.rep.id}>
                    {/* Summary Row (Clickable) */}
                    <tr
                      onClick={() => toggleRepExpansion(row.rep.name)}
                      className={`cursor-pointer transition-all ${
                        isExpanded
                          ? 'bg-emerald-50/50 hover:bg-emerald-50/70 border-l-4 border-l-emerald-600'
                          : 'hover:bg-slate-50/90'
                      }`}
                    >
                      <td className="py-3.5 px-4 text-slate-400 text-center">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-emerald-700 inline" />
                        ) : (
                          <ChevronDown className="h-4 w-4 inline" />
                        )}
                      </td>

                      {/* Rep Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-7 w-7 rounded-lg text-white font-bold flex items-center justify-center text-xs ${
                              row.rep.avatarColor || 'bg-emerald-700'
                            }`}
                          >
                            {row.rep.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{row.rep.name}</span>
                              {row.rep.isMasterAdmin && (
                                <span className="rounded bg-emerald-950 text-emerald-300 font-bold text-[9px] px-1.5 py-0.2">
                                  Master Admin
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {row.rep.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Multiplier */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-emerald-900 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded text-[11px]">
                          {row.rep.commissionMultiplier}x
                        </span>
                      </td>

                      {/* Active Lines */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800 tabular-nums">
                        {row.activeLinesCount} active ({row.totalLinesCount} total)
                      </td>

                      {/* Paid Commission */}
                      <td className="py-3.5 px-4 font-semibold text-emerald-700 tabular-nums">
                        ${row.paidAmount.toFixed(2)}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          ({row.paidCount})
                        </span>
                      </td>

                      {/* Pending Commission */}
                      <td className="py-3.5 px-4 font-semibold text-amber-700 tabular-nums">
                        ${row.pendingAmount.toFixed(2)}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          ({row.pendingCount})
                        </span>
                      </td>

                      {/* 180d Clawbacks */}
                      <td className="py-3.5 px-4">
                        {row.clawbackCount > 0 ? (
                          <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg text-[11px] tabular-nums inline-flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-rose-600" />
                            <span>-${row.clawbackAmount.toFixed(2)} ({row.clawbackCount} lines)</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">$0.00</span>
                        )}
                      </td>

                      {/* Net Payable */}
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 tabular-nums text-sm">
                        ${row.netPayable.toFixed(2)}
                      </td>

                      {/* Action Pill */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950">
                          {isExpanded ? 'Hide Lines' : 'View Lines'}
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </span>
                      </td>
                    </tr>

                    {/* EXPANDED ACCORDION: Line-Item Drill-Down Subtable */}
                    {isExpanded && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={9} className="p-4 sm:p-5">
                          <div className="rounded-2xl border border-emerald-500/20 bg-white p-4 shadow-inner space-y-3">
                            
                            {/* Drill-down Header with line count & multiplier note */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-600" />
                                <h5 className="font-bold text-xs text-slate-900">
                                  {row.rep.name} · Individual Phone Lines & Commission Audit ({row.allLines.length} lines)
                                </h5>
                                <span className="rounded bg-emerald-100 text-emerald-900 text-[10px] font-semibold px-2 py-0.5">
                                  Formula: Plan Price × {row.rep.commissionMultiplier}x
                                </span>
                              </div>

                              <span className="text-[11px] text-slate-500">
                                Showing Paid, Pending, and Clawed Back statuses
                              </span>
                            </div>

                            {/* Subtable Rows */}
                            {row.allLines.length === 0 ? (
                              <div className="py-4 text-center text-xs text-slate-400">
                                No customer lines attributed to this rep within the selected date filter.
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                                      <th className="py-2 px-3">Subscriber</th>
                                      <th className="py-2 px-3">Line Phone</th>
                                      <th className="py-2 px-3">Plan & Monthly Price</th>
                                      <th className="py-2 px-3">Multiplier</th>
                                      <th className="py-2 px-3">Commission ($)</th>
                                      <th className="py-2 px-3">Tenure / Cancellation</th>
                                      <th className="py-2 px-3">Commission Status</th>
                                      <th className="py-2 px-3 text-right">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {row.allLines.map((line) => {
                                      const daysActive = line.activationStartDate
                                        ? calculateDaysBetween(
                                            line.activationStartDate,
                                            line.status === 'non_active_line' ? line.deactivationDate : undefined
                                          )
                                        : 0;

                                      const isEarlyCanceled =
                                        line.status === 'non_active_line' &&
                                        Boolean(line.activationStartDate) &&
                                        daysActive <= 180;

                                      const statusClass =
                                        line.commission?.status === 'paid'
                                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                          : line.commission?.status === 'clawback' || isEarlyCanceled
                                          ? 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold'
                                          : 'bg-amber-100 text-amber-800 border-amber-300';

                                      const statusLabel =
                                        line.commission?.status === 'clawback' || isEarlyCanceled
                                          ? 'Clawed Back'
                                          : line.commission?.status === 'paid'
                                          ? 'Paid'
                                          : 'Pending';

                                      return (
                                        <tr key={line.id} className="hover:bg-slate-50/60 transition-colors">
                                          {/* Name & ID */}
                                          <td className="py-2 px-3">
                                            <div className="font-bold text-slate-900">{line.fullName}</div>
                                            <div className="text-[10px] font-mono text-slate-400">{line.id}</div>
                                          </td>

                                          {/* Phone */}
                                          <td className="py-2 px-3 font-mono text-slate-800">
                                            {line.activatedPhone || line.phone}
                                          </td>

                                          {/* Plan */}
                                          <td className="py-2 px-3">
                                            <div className="font-semibold text-slate-800">
                                              {line.preferredPlanName}
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                              ${line.monthlyPlanPrice}/mo
                                            </div>
                                          </td>

                                          {/* Multiplier Used */}
                                          <td className="py-2 px-3 font-mono font-bold text-emerald-900">
                                            {line.commission?.multiplierUsed || row.rep.commissionMultiplier}x
                                          </td>

                                          {/* Commission Amount */}
                                          <td className="py-2 px-3 font-mono font-black text-slate-900 tabular-nums">
                                            ${line.commission?.amount?.toFixed(2) || '0.00'}
                                          </td>

                                          {/* Tenure / Cancellation */}
                                          <td className="py-2 px-3">
                                            {line.status === 'lead' ? (
                                              <span className="text-slate-400 text-[11px]">Unactivated Lead</span>
                                            ) : (
                                              <div>
                                                <span className="font-medium text-slate-700">
                                                  {daysActive} Days Active
                                                </span>
                                                {line.status === 'non_active_line' ? (
                                                  <div className="text-[10px] text-rose-600 font-bold">
                                                    Canceled (Day {daysActive})
                                                  </div>
                                                ) : (
                                                  <div className="text-[10px] text-emerald-600 font-semibold">
                                                    {daysActive <= 180 ? `${180 - daysActive}d to safety` : 'Safe (>180d)'}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </td>

                                          {/* Status Badge */}
                                          <td className="py-2 px-3">
                                            <span
                                              className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${statusClass}`}
                                            >
                                              {statusLabel === 'Paid' && <CheckCircle className="h-3 w-3" />}
                                              {statusLabel === 'Pending' && <Clock className="h-3 w-3" />}
                                              {statusLabel === 'Clawed Back' && <AlertTriangle className="h-3 w-3" />}
                                              <span>{statusLabel}</span>
                                            </span>
                                          </td>

                                          {/* Actions */}
                                          <td className="py-2 px-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                              <button
                                                type="button"
                                                onClick={() => onOpenCustomer(line)}
                                                className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                              >
                                                Profile
                                              </button>

                                              {/* Quick Toggle Status */}
                                              <select
                                                value={line.commission?.status || 'pending'}
                                                onChange={(e) =>
                                                  onUpdateCommissionStatus(
                                                    line.id,
                                                    e.target.value as CommissionStatus
                                                  )
                                                }
                                                className="text-[10px] font-bold rounded border border-slate-200 bg-white px-1.5 py-1 text-slate-800 outline-none"
                                              >
                                                <option value="pending">Pending</option>
                                                <option value="paid">Paid</option>
                                                <option value="clawback">Clawback</option>
                                              </select>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SPECIFIC FLAGGED 180-DAY CLAWBACK AUDIT LIST */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-rose-100 p-2 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Flagged Clawback Accounts Audit ({flaggedAuditAccounts.length})
              </h3>
              <p className="text-xs text-slate-500">
                All accounts canceled under the 180-day dealer threshold. Review profile and adjust recovery status.
              </p>
            </div>
          </div>
        </div>

        {flaggedAuditAccounts.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs rounded-2xl bg-slate-50 border border-slate-100">
            ✓ Excellent! No accounts currently flagged for commission clawback under the active filters.
          </div>
        ) : (
          <div className="space-y-3">
            {flaggedAuditAccounts.map((customer) => {
              const daysActive = customer.activationStartDate
                ? calculateDaysBetween(customer.activationStartDate, customer.deactivationDate)
                : customer.commission?.daysActiveBeforeCancel || 0;

              return (
                <div
                  key={customer.id}
                  className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {customer.fullName}
                      </span>
                      <span className="font-mono text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {customer.id}
                      </span>
                      <span className="rounded bg-rose-200 text-rose-900 font-extrabold text-[10px] px-2 py-0.5">
                        Canceled on Day {daysActive} of 180
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                      <span>Line: <strong className="text-slate-900">{customer.activatedPhone || customer.phone}</strong></span>
                      <span>·</span>
                      <span>Plan: {customer.preferredPlanName}</span>
                      <span>·</span>
                      <span>Sales Rep: <strong className="text-slate-900">{customer.salesRep}</strong> ({customer.commission?.multiplierUsed || 1.0}x)</span>
                    </div>

                    <p className="text-[11px] text-rose-800 italic pt-0.5">
                      {customer.commission?.clawbackReason ||
                        `Line canceled before 180 days elapsed. Reverse $${customer.commission.amount} from rep ${customer.salesRep}.`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right mr-2">
                      <div className="text-xs text-slate-500">Clawback Due</div>
                      <div className="text-lg font-black text-rose-700 tabular-nums">
                        ${customer.commission.amount.toFixed(2)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenCustomer(customer)}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      View Profile
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const newStatus =
                          customer.commission.status === 'clawback' ? 'paid' : 'clawback';
                        onUpdateCommissionStatus(customer.id, newStatus);
                      }}
                      className="rounded-xl bg-rose-700 hover:bg-rose-800 text-white px-3.5 py-1.5 text-xs font-bold transition-colors"
                    >
                      {customer.commission.status === 'clawback' ? 'Clawback Enforced' : 'Enforce Clawback'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
