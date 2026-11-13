import React from 'react';
import { Smartphone, ArrowLeft, Users, AlertTriangle, DollarSign, Activity, UserCheck } from 'lucide-react';
import { StaffRep } from '../../types/telecom';

interface CrmHeaderProps {
  onBackToLanding: () => void;
  onNavigateToPublic?: () => void;
  staffMembers: StaffRep[];
  currentStaff: StaffRep;
  onSelectStaff: (staff: StaffRep) => void;
  leadsCount: number;
  activeLinesCount: number;
  nonActiveLinesCount: number;
  clawbacksCount: number;
  totalCommissionsPaid: number;
  clawbackAlertsCount: number;
  onOpenClawbackView: () => void;
}

export const CrmHeader: React.FC<CrmHeaderProps> = ({
  onBackToLanding,
  onNavigateToPublic,
  staffMembers = [],
  currentStaff,
  onSelectStaff,
  leadsCount = 0,
  activeLinesCount = 0,
  nonActiveLinesCount = 0,
  clawbacksCount = 0,
  totalCommissionsPaid = 0,
  clawbackAlertsCount = 0,
  onOpenClawbackView,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Automated Clawback Alert Banner if any accounts flagged within 180 days */}
      {clawbackAlertsCount > 0 && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-semibold flex items-center justify-between border-b border-amber-600">
          <div className="flex items-center gap-2 max-w-5xl">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-950" />
            <span>
              <strong>Automated 180-Day Chargeback Alert:</strong> {clawbackAlertsCount} customer line(s) deactivated within 180 days of activation. Commission clawback action required from assigned sales reps.
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenClawbackView}
            className="ml-4 shrink-0 rounded bg-amber-950 px-2.5 py-1 text-[11px] font-bold text-amber-200 hover:bg-black transition-colors cursor-pointer"
          >
            Review Clawbacks
          </button>
        </div>
      )}

      {/* Top bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Brand + Back to Site */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateToPublic || onBackToLanding}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Return to customer landing page"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Customer View</span>
          </button>

          <div className="h-5 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F3E2E] text-white">
              <Smartphone className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900">CTExcel</span>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  Staff Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Telus Dealer Portal & Residual Engine</p>
            </div>
          </div>
        </div>

        {/* Right: Active Staff Selector + Logout */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-800">{currentStaff?.name || 'Staff Member'}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">
              {String(currentStaff?.role || 'sales_rep').replace('_', ' ')}
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <UserCheck className="h-3.5 w-3.5 text-slate-500 ml-1.5" />
            <select
              value={currentStaff?.id || ''}
              onChange={(e) => {
                const found = staffMembers.find((s) => s.id === e.target.value);
                if (found) onSelectStaff(found);
              }}
              className="bg-transparent text-xs font-semibold text-slate-800 outline-none pr-2 py-1 cursor-pointer"
            >
              {staffMembers.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} ({staff.role === 'admin' ? 'Admin' : staff.role === 'manager' ? 'Manager' : 'Rep'})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onBackToLanding}
            className="flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-900 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            title="Log out of Staff Portal"
          >
            <span>Log out</span>
          </button>
        </div>

      </div>

      {/* KPI Stats Strip */}
      <div className="border-t border-slate-100 bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
          
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 tabular-nums">{leadsCount}</div>
              <div className="text-[11px] text-slate-500">Inbound Leads</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-teal-100 p-2 text-teal-800">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 tabular-nums">{activeLinesCount}</div>
              <div className="text-[11px] text-slate-500">Active Lines</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-slate-200 p-2 text-slate-700">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 tabular-nums">{nonActiveLinesCount}</div>
              <div className="text-[11px] text-slate-500">Canceled Lines</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <div className="font-extrabold text-emerald-900 tabular-nums">
                ${Number(totalCommissionsPaid || 0).toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500">Commissions Paid</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
            <div className={`rounded-lg p-2 ${clawbacksCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <div className={`font-extrabold tabular-nums ${clawbacksCount > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                {clawbacksCount} Flagged
              </div>
              <div className="text-[11px] text-slate-500">180-Day Clawbacks</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
