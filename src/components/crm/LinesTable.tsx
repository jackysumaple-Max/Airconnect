import React from 'react';
import { CustomerRecord, StaffRep } from '../../types/telecom';
import { calculateDaysBetween } from '../../services/telecomStorage';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Zap,
  UserX,
  Trash2,
  X,
} from 'lucide-react';

interface LinesTableProps {
  lines: CustomerRecord[];
  type: 'active' | 'non_active';
  isMasterAdmin?: boolean;
  staffMembers?: StaffRep[];
  onOpenCustomer: (customer: CustomerRecord) => void;
  onActivateLine?: (customer: CustomerRecord) => void;
  onDeactivateLine?: (customer: CustomerRecord) => void;
  onDeleteLine?: (customer: CustomerRecord) => void;
  onAssignLead?: (leadId: string, repName: string) => void;
  isProcessing?: boolean;
  actionNotice?: { type: 'success' | 'error'; message: string } | null;
  onDismissNotice?: () => void;
}

export const LinesTable: React.FC<LinesTableProps> = ({
  lines,
  type,
  isMasterAdmin = false,
  staffMembers = [],
  onOpenCustomer,
  onActivateLine,
  onDeactivateLine,
  onDeleteLine,
  onAssignLead,
  isProcessing = false,
  actionNotice,
  onDismissNotice,
}) => {
  const noticeBanner = actionNotice ? (
    <div
      className={`mb-4 flex items-center justify-between gap-3 rounded-2xl border p-3.5 text-xs shadow-2xs ${
        actionNotice.type === 'success'
          ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
          : 'border-rose-300 bg-rose-50 text-rose-950'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {actionNotice.type === 'success' ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
        )}
        <span className="font-semibold">{actionNotice.message}</span>
      </div>
      {onDismissNotice && (
        <button
          type="button"
          onClick={onDismissNotice}
          className="rounded-lg p-1 hover:bg-black/5 transition-colors"
          aria-label="Dismiss message"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  ) : null;

  if (lines.length === 0) {
    return (
      <div>
        {noticeBanner}
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Clock className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            No {type === 'active' ? 'Active Lines' : 'Non-Active Lines'} Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {type === 'active'
              ? 'When leads are converted into active customers, they will appear here with live tenure tracking.'
              : 'Customers who cancel service will appear here with automated 180-day chargeback tracking.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {noticeBanner}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Subscriber Name & ID</th>
                <th className="py-3 px-4">Line Phone & SIM</th>
                <th className="py-3 px-4">Plan (Telus 5G)</th>
                <th className="py-3 px-4">
                  {type === 'active' ? 'Activation Date & Tenure' : 'Active Period & Cancellation'}
                </th>
                {type === 'non_active' && (
                  <th className="py-3 px-4">180-Day Chargeback Status</th>
                )}
                <th className="py-3 px-4">ID Verification</th>
                <th className="py-3 px-4">Sales Rep</th>
                <th className="py-3 px-4">Commission</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((customer) => {
                const daysActive = customer.activationStartDate
                  ? calculateDaysBetween(
                      customer.activationStartDate,
                      type === 'non_active' ? customer.deactivationDate : undefined
                    )
                  : 0;

                const isWithin180Days = customer.activationStartDate ? daysActive <= 180 : false;
                const hasClawback =
                  customer.commission?.isClawbackFlagged || (type === 'non_active' && isWithin180Days);

                return (
                  <tr
                    key={customer.id}
                    onClick={() => onOpenCustomer(customer)}
                    className={`hover:bg-slate-50/90 transition-colors cursor-pointer group ${
                      hasClawback ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    {/* Subscriber Name & ID */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                        {customer.fullName}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                        {customer.id} · {customer.address?.city || 'Canada'}, {customer.address?.province || 'ON'}
                      </div>
                    </td>

                    {/* Phone & SIM */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 font-mono">
                        {customer.activatedPhone || customer.phone}
                      </div>
                      <span className="inline-block mt-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                        {customer.simType || 'eSIM'}
                      </span>
                    </td>

                    {/* Plan */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 max-w-[160px] truncate" title={customer.preferredPlanName}>
                        {customer.preferredPlanName}
                      </div>
                    </td>

                    {/* Dates & Tenure */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">
                        {customer.activationStartDate || 'N/A'}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span className="font-semibold text-slate-700">{daysActive} days</span>
                        {type === 'active' && (
                          <span className={`text-[10px] ${isWithin180Days ? 'text-amber-600 font-medium' : 'text-emerald-600 font-bold'}`}>
                            ({isWithin180Days ? `${180 - daysActive}d to safety` : '180d+ Protected'})
                          </span>
                        )}
                      </div>
                      {type === 'non_active' && customer.deactivationDate && (
                        <div className="text-[10px] text-rose-600 font-medium mt-0.5">
                          Ended: {customer.deactivationDate}
                        </div>
                      )}
                    </td>

                    {/* Chargeback column for non-active lines */}
                    {type === 'non_active' && (
                      <td className="py-3.5 px-4">
                        {hasClawback ? (
                          <div className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-rose-100 px-2 py-1 text-[11px] font-bold text-rose-800">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                            <span>Clawback Flagged ({daysActive}d &lt; 180d)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>Protected ({daysActive}d &gt; 180d)</span>
                          </div>
                        )}
                      </td>
                    )}

                    {/* ID Verification */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          customer.idVerification?.status === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : customer.idVerification?.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <ShieldCheck className="h-3 w-3" />
                        <span>{customer.idVerification?.status || 'unverified'}</span>
                      </span>
                      {customer.idVerification?.idType && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {customer.idVerification.idType}
                        </div>
                      )}
                    </td>

                    {/* Sales Rep */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      {isMasterAdmin && onAssignLead && staffMembers.length > 0 ? (
                        <select
                          value={customer.salesRep || 'Unassigned'}
                          disabled={isProcessing || !customer.id}
                          onChange={(e) => onAssignLead(customer.id, e.target.value)}
                          className="text-xs font-bold rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-800 outline-none hover:border-emerald-500 disabled:opacity-50 cursor-pointer"
                        >
                          <option value="Unassigned">● Unassigned</option>
                          {staffMembers.map((s) => (
                            <option key={s.id} value={s.name}>
                              {s.name} ({s.commissionMultiplier}x)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <>
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <span>{customer.salesRep}</span>
                            {isMasterAdmin && customer.commission?.multiplierUsed && (
                              <span className="rounded bg-emerald-100 text-emerald-900 font-mono font-bold text-[9px] px-1.5 py-0.2">
                                {customer.commission.multiplierUsed}x
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">{customer.referralSource || 'Direct'}</div>
                        </>
                      )}
                    </td>

                    {/* Commission & Residual */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 tabular-nums">
                        ${customer.commission?.amount?.toFixed(2) || '55.00'}
                      </div>
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                            customer.commission?.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : customer.commission?.status === 'clawback'
                              ? 'bg-rose-100 text-rose-800 font-extrabold'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {customer.commission?.status || 'pending'}
                        </span>
                        {isMasterAdmin && customer.residual && type === 'active' && (
                          <span className="text-[10px] font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-1 rounded">
                            {(customer.residual.lockedResidualRate * 100).toFixed(0)}% Res
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {type === 'active' && onDeactivateLine && (
                          <button
                            type="button"
                            disabled={isProcessing || !customer.id}
                            onClick={() => onDeactivateLine(customer)}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 px-2.5 py-1 text-[11px] font-bold text-amber-900 transition-colors cursor-pointer whitespace-nowrap"
                            title="Move line to Non-Active (status: Non-Active)"
                          >
                            <UserX className="h-3 w-3" />
                            <span>Non-Active</span>
                          </button>
                        )}

                        {type === 'non_active' && onActivateLine && (
                          <button
                            type="button"
                            disabled={isProcessing || !customer.id}
                            onClick={() => onActivateLine(customer)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-2.5 py-1 text-[11px] font-bold text-white transition-colors cursor-pointer whitespace-nowrap"
                            title="Re-activate line (status: Active)"
                          >
                            <Zap className="h-3 w-3" />
                            <span>Activate</span>
                          </button>
                        )}

                        {isMasterAdmin && onDeleteLine && (
                          <button
                            type="button"
                            disabled={isProcessing || !customer.id}
                            onClick={() => onDeleteLine(customer)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-600 hover:text-white disabled:opacity-50 px-2 py-1 text-[11px] font-bold text-rose-700 transition-colors cursor-pointer"
                            title="Delete record from Airwireless"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onOpenCustomer(customer)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <span>Profile</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
