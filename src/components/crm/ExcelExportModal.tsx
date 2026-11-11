import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { CustomerRecord, StaffRep } from '../../types/telecom';
import {
  FileSpreadsheet,
  X,
  Calendar,
  CheckSquare,
  Square,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: CustomerRecord[];
  staffMembers: StaffRep[];
  isMasterAdmin: boolean;
}

type TimeframeType = 'all_time' | 'single_month' | 'custom_range';

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  customers,
  staffMembers,
  isMasterAdmin,
}) => {
  if (!isOpen) return null;

  // Access Restriction: Strictly locked to Master Admin
  if (!isMasterAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-rose-200 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
          <p className="text-xs text-slate-500">
            The Excel Export Module is strictly locked to the Master Admin dashboard. Sales Reps cannot download bulk database records.
          </p>
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-white hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Dynamic Dataset Selection State
  const [includeLeads, setIncludeLeads] = useState(true);
  const [includeActiveLines, setIncludeActiveLines] = useState(true);
  const [includeNonActiveLines, setIncludeNonActiveLines] = useState(true);
  const [includeFinancials, setIncludeFinancials] = useState(true);

  // Timeframe Filter State
  const [timeframe, setTimeframe] = useState<TimeframeType>('all_time');
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [customStartDate, setCustomStartDate] = useState('2026-08-01');
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Select All handling
  const allSelected = includeLeads && includeActiveLines && includeNonActiveLines && includeFinancials;
  const toggleSelectAll = () => {
    const next = !allSelected;
    setIncludeLeads(next);
    setIncludeActiveLines(next);
    setIncludeNonActiveLines(next);
    setIncludeFinancials(next);
  };

  // Available months dynamically extracted from customer records
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add('2026-11');
    months.add('2026-10');
    months.add('2026-09');
    months.add('2026-08');
    customers.forEach((c) => {
      const d = c.activationStartDate || c.submittedAt || c.commission?.payoutDate;
      if (d && d.length >= 7) {
        months.add(d.substring(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [customers]);

  // Filter customers by selected timeframe
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (timeframe === 'all_time') return true;

      // Extract best reference date
      const refDate =
        c.activationStartDate ||
        (c.submittedAt ? c.submittedAt.split('T')[0] : '') ||
        c.commission?.payoutDate ||
        c.deactivationDate ||
        '';

      if (!refDate) return true;

      if (timeframe === 'single_month') {
        return refDate.startsWith(selectedMonth);
      }

      if (timeframe === 'custom_range') {
        const start = customStartDate <= customEndDate ? customStartDate : customEndDate;
        const end = customStartDate <= customEndDate ? customEndDate : customStartDate;
        const compDate = refDate.substring(0, 10);
        return compDate >= start && compDate <= end;
      }

      return true;
    });
  }, [customers, timeframe, selectedMonth, customStartDate, customEndDate]);

  // Records for Tab 1: Customer Master List
  const customerMasterRecords = useMemo(() => {
    return filteredCustomers.filter((c) => {
      if (c.status === 'lead' && includeLeads) return true;
      if (c.status === 'active_line' && includeActiveLines) return true;
      if (c.status === 'non_active_line' && includeNonActiveLines) return true;
      return false;
    });
  }, [filteredCustomers, includeLeads, includeActiveLines, includeNonActiveLines]);

  // Records for Tab 2: Financials & Payouts (Commissions)
  const financialRecords = useMemo(() => {
    if (!includeFinancials) return [];
    // Include active, non-active, and paid/clawback commissions
    return filteredCustomers.filter(
      (c) =>
        c.commission &&
        (c.commission.amount > 0 ||
          c.commission.status === 'paid' ||
          c.commission.status === 'clawback' ||
          c.status === 'active_line' ||
          c.status === 'non_active_line')
    );
  }, [filteredCustomers, includeFinancials]);

  // Format month name
  const formatMonthLabel = (yyyyMm: string) => {
    try {
      const [year, month] = yyyyMm.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return yyyyMm;
    }
  };

  // Helper to format date cleanly
  const formatDateClean = (isoOrDate?: string) => {
    if (!isoOrDate) return 'N/A';
    if (isoOrDate.includes('T')) {
      return isoOrDate.split('T')[0];
    }
    return isoOrDate;
  };

  // Generate Excel Workbook (.xlsx)
  const handleGenerateReport = () => {
    if (!includeLeads && !includeActiveLines && !includeNonActiveLines && !includeFinancials) {
      alert('Please select at least one dataset to include in the Excel export.');
      return;
    }

    setIsExporting(true);

    try {
      // Create new workbook
      const wb = XLSX.utils.book_new();

      // ==========================================
      // TAB 1: CUSTOMER MASTER LIST
      // ==========================================
      if (includeLeads || includeActiveLines || includeNonActiveLines) {
        const headers = [
          'Line Status',
          'Creation/Activation Date',
          'First Name',
          'Last Name',
          'Email',
          'Contact Number',
          'Activated Phone Number (Ported or New)',
          'Plan Type',
          'Assigned Sales Rep',
          'Most Recent Note',
        ];

        const rows = customerMasterRecords.map((c) => {
          let lineStatusLabel = 'Inbound Lead';
          if (c.status === 'active_line') lineStatusLabel = 'Active Line';
          else if (c.status === 'non_active_line') lineStatusLabel = 'Non-Active Line (Canceled)';

          const bestDate =
            c.status === 'active_line'
              ? c.activationStartDate || formatDateClean(c.submittedAt)
              : c.status === 'non_active_line'
              ? c.deactivationDate || c.activationStartDate || formatDateClean(c.submittedAt)
              : formatDateClean(c.submittedAt);

          return [
            lineStatusLabel,
            bestDate,
            c.firstName,
            c.lastName,
            c.email,
            c.phone,
            c.activatedPhone || c.phone,
            c.preferredPlanName,
            c.salesRep,
            c.notes || 'No recent notes logged.',
          ];
        });

        const wsCustomerData = [headers, ...rows];
        const wsCustomer = XLSX.utils.aoa_to_sheet(wsCustomerData);

        // Auto-adjust column widths
        const colWidths = headers.map((h, colIdx) => {
          let maxLen = h.length;
          rows.forEach((r) => {
            const cellVal = r[colIdx] ? String(r[colIdx]) : '';
            if (cellVal.length > maxLen) {
              maxLen = cellVal.length;
            }
          });
          return { wch: Math.min(Math.max(maxLen + 3, 14), 50) };
        });
        wsCustomer['!cols'] = colWidths;

        // Frozen panes: Freeze top header row so headers stay visible when scrolling
        wsCustomer['!views'] = [{ state: 'frozen', ySplit: 1, xSplit: 0, activeCell: 'A2' }];

        XLSX.utils.book_append_sheet(wb, wsCustomer, 'Customer Master List');
      }

      // ==========================================
      // TAB 2: FINANCIALS & PAYOUTS (COMMISSIONS)
      // ==========================================
      if (includeFinancials) {
        const financialHeaders = [
          'Activation Date',
          'Sales Rep Name',
          'Customer Name',
          'Activated Phone Number',
          'Plan Monthly Price',
          'Commission Status (Pending / Paid / Clawed Back)',
          'Total Payout Amount',
          'Applied Residual Rate (7% or 9%)',
        ];

        const financialRows = financialRecords.map((c) => {
          const actDate = c.activationStartDate || c.commission?.payoutDate || formatDateClean(c.submittedAt);
          const price = c.monthlyPlanPrice || 30;
          const commissionAmount = c.commission?.amount || 0;

          // Residual rate: check residual record or fallback based on cohort
          const rateVal = c.residual?.lockedResidualRate
            ? `${(c.residual.lockedResidualRate * 100).toFixed(0)}%`
            : '7%';

          let statusLabel = 'Pending';
          if (c.commission?.status === 'paid') statusLabel = 'Paid';
          else if (c.commission?.status === 'clawback' || c.commission?.isClawbackFlagged) statusLabel = 'Clawed Back';

          return [
            actDate,
            c.salesRep,
            c.fullName,
            c.activatedPhone || c.phone,
            `$${price.toFixed(2)}`,
            statusLabel,
            `$${commissionAmount.toFixed(2)}`,
            rateVal,
          ];
        });

        const wsFinancialData = [financialHeaders, ...financialRows];
        const wsFinancial = XLSX.utils.aoa_to_sheet(wsFinancialData);

        // Auto-adjust column widths
        const finColWidths = financialHeaders.map((h, colIdx) => {
          let maxLen = h.length;
          financialRows.forEach((r) => {
            const cellVal = r[colIdx] ? String(r[colIdx]) : '';
            if (cellVal.length > maxLen) {
              maxLen = cellVal.length;
            }
          });
          return { wch: Math.min(Math.max(maxLen + 3, 14), 45) };
        });
        wsFinancial['!cols'] = finColWidths;

        // Frozen panes: Freeze top header row so headers stay visible when scrolling
        wsFinancial['!views'] = [{ state: 'frozen', ySplit: 1, xSplit: 0, activeCell: 'A2' }];

        XLSX.utils.book_append_sheet(wb, wsFinancial, 'Financials & Payouts');
      }

      // Generate filename based on date filter
      const todayStr = new Date().toISOString().split('T')[0];
      const scopeLabel =
        timeframe === 'all_time'
          ? 'AllTime'
          : timeframe === 'single_month'
          ? selectedMonth
          : `${customStartDate}_to_${customEndDate}`;
      const fileName = `CTExcel_Master_Export_${scopeLabel}_${todayStr}.xlsx`;

      // Download .xlsx file directly in browser
      XLSX.writeFile(wb, fileName, { bookType: 'xlsx', type: 'binary' });

      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error generating Excel workbook:', err);
      alert('Failed to generate Excel export. Please check your data.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-gradient-to-r from-emerald-950 via-[#0C3829] to-[#08281D] text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/20 border border-emerald-400/30 p-2 text-emerald-300">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Excel Export Module
                </h3>
                <span className="rounded bg-emerald-400/20 text-emerald-300 font-extrabold text-[9px] px-2 py-0.5 border border-emerald-400/30">
                  Admin Exclusive
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Generate formatted multi-tab .xlsx workbooks with frozen headers and auto-adjusted widths.
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

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-slate-800 text-xs">
          
          {/* Security Notice */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 flex items-start gap-2.5 text-emerald-950">
            <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[11px] uppercase tracking-wider text-emerald-900">
                Master Admin Access Confirmed
              </div>
              <p className="text-[11px] text-emerald-800/90 leading-relaxed mt-0.5">
                Bulk export operations are strictly restricted to Jacky (Master Admin). All line records, customer contact details, and financial payout columns are decrypted for report generation.
              </p>
            </div>
          </div>

          {/* Section 1: Dynamic Data Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                1. Select Datasets to Include
              </label>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                {allSelected ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                <span>Select All Datasets</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Checkbox: Leads */}
              <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                includeLeads ? 'border-emerald-500 bg-emerald-50/50 shadow-2xs' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}>
                <input
                  type="checkbox"
                  checked={includeLeads}
                  onChange={(e) => setIncludeLeads(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-emerald-700 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-slate-900">Leads</div>
                  <div className="text-[11px] text-slate-500">
                    Inbound form submissions awaiting follow-up or callback
                  </div>
                </div>
              </label>

              {/* Checkbox: Active Lines */}
              <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                includeActiveLines ? 'border-emerald-500 bg-emerald-50/50 shadow-2xs' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}>
                <input
                  type="checkbox"
                  checked={includeActiveLines}
                  onChange={(e) => setIncludeActiveLines(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-emerald-700 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-slate-900">Active Lines</div>
                  <div className="text-[11px] text-slate-500">
                    Currently activated customers with live Telus 5G service
                  </div>
                </div>
              </label>

              {/* Checkbox: Non-Active Lines */}
              <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                includeNonActiveLines ? 'border-emerald-500 bg-emerald-50/50 shadow-2xs' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}>
                <input
                  type="checkbox"
                  checked={includeNonActiveLines}
                  onChange={(e) => setIncludeNonActiveLines(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-emerald-700 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-slate-900">Non-Active Lines</div>
                  <div className="text-[11px] text-slate-500">
                    Canceled subscribers and 180-day chargeback tracking
                  </div>
                </div>
              </label>

              {/* Checkbox: Commission & Clawback Payouts */}
              <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                includeFinancials ? 'border-emerald-500 bg-emerald-50/50 shadow-2xs' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}>
                <input
                  type="checkbox"
                  checked={includeFinancials}
                  onChange={(e) => setIncludeFinancials(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-emerald-700 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-slate-900">Commission & Clawbacks</div>
                  <div className="text-[11px] text-slate-500">
                    Generates Tab 2: Payout amounts, rep multipliers & residuals
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Date Range Filter */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              2. Select Timeframe
            </label>

            {/* Timeframe Mode Selector */}
            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTimeframe('all_time')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                  timeframe === 'all_time'
                    ? 'bg-white text-emerald-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Time (Historical)
              </button>

              <button
                type="button"
                onClick={() => setTimeframe('single_month')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                  timeframe === 'single_month'
                    ? 'bg-white text-emerald-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Calendar Month
              </button>

              <button
                type="button"
                onClick={() => setTimeframe('custom_range')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                  timeframe === 'custom_range'
                    ? 'bg-white text-emerald-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Custom Date Range
              </button>
            </div>

            {/* Sub-inputs based on timeframe mode */}
            {timeframe === 'single_month' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-700">Specific Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-900 outline-none"
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {formatMonthLabel(m)} ({m})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {timeframe === 'custom_range' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Export Preview Summary Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Workbook Structure Preview:</span>
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                {customerMasterRecords.length + financialRecords.length} Total Line Items
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-600">
              <div className="flex items-center justify-between">
                <span>Tab 1: <strong>Customer Master List</strong></span>
                <span className="font-mono">{customerMasterRecords.length} records</span>
              </div>
              {includeFinancials && (
                <div className="flex items-center justify-between">
                  <span>Tab 2: <strong>Financials & Payouts</strong></span>
                  <span className="font-mono">{financialRecords.length} commission lines</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5 text-[10px] text-slate-500">
              <Sparkles className="h-3 w-3 text-emerald-600 shrink-0" />
              <span>Includes bold headers, frozen scroll panes, and auto-fitted columns (.xlsx)</span>
            </div>
          </div>

          {downloadSuccess && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Excel workbook generated and downloaded successfully!</span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
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
            disabled={isExporting || (!includeLeads && !includeActiveLines && !includeNonActiveLines && !includeFinancials)}
            onClick={handleGenerateReport}
            className="flex items-center gap-2 rounded-xl bg-[#0F3E2E] hover:bg-[#14533D] disabled:opacity-50 px-5 py-2 text-xs font-bold text-white transition-all shadow-xs"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Building Workbook...' : 'Generate Report (.xlsx)'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
