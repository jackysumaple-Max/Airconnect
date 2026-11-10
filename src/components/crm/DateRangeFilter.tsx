import React from 'react';
import { Calendar, Filter, RotateCcw } from 'lucide-react';

export type DateFilterMode = 'all' | 'single' | 'custom';

interface DateRangeFilterProps {
  mode: DateFilterMode;
  onModeChange: (mode: DateFilterMode) => void;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  customStartMonth: string;
  onCustomStartChange: (month: string) => void;
  customEndMonth: string;
  onCustomEndChange: (month: string) => void;
  availableMonths?: string[];
  totalRecordsCount?: number;
  filteredCount?: number;
  label?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  mode,
  onModeChange,
  selectedMonth,
  onSelectMonth,
  customStartMonth,
  onCustomStartChange,
  customEndMonth,
  onCustomEndChange,
  availableMonths = ['2026-11', '2026-10', '2026-09', '2026-08'],
  totalRecordsCount,
  filteredCount,
  label = 'Database Records',
}) => {
  const formatMonth = (yyyyMm: string) => {
    try {
      const [year, month] = yyyyMm.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return yyyyMm;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Left: Filter Mode Segmented Control */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Calendar className="h-4 w-4 text-emerald-700" />
            <span className="hidden sm:inline">Date Range:</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => onModeChange('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                mode === 'all'
                  ? 'bg-white text-emerald-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => onModeChange('single')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                mode === 'single'
                  ? 'bg-white text-emerald-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Single Month
            </button>
            <button
              type="button"
              onClick={() => onModeChange('custom')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                mode === 'custom'
                  ? 'bg-white text-emerald-950 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom Range
            </button>
          </div>
        </div>

        {/* Right: Dropdown Controls based on active mode */}
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {mode === 'single' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => onSelectMonth(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 shadow-2xs"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonth(m)} ({m})
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === 'custom' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">From:</span>
              <select
                value={customStartMonth}
                onChange={(e) => onCustomStartChange(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 shadow-2xs"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonth(m)}
                  </option>
                ))}
              </select>

              <span className="text-xs text-slate-500 font-medium">To:</span>
              <select
                value={customEndMonth}
                onChange={(e) => onCustomEndChange(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 shadow-2xs"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonth(m)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Records badge */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl font-mono">
            <span>
              {filteredCount !== undefined ? filteredCount : totalRecordsCount}{' '}
              {label}
            </span>
            {mode !== 'all' && (
              <button
                type="button"
                onClick={() => onModeChange('all')}
                className="text-[10px] text-emerald-700 font-bold hover:underline ml-1"
                title="Reset to All Time"
              >
                Reset
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
