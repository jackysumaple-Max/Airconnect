import React from 'react';
import { CustomerRecord, LeadFollowUpStatus, StaffRep } from '../../types/telecom';
import {
  Phone,
  Mail,
  Clock,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  ChevronRight,
  Zap,
  Inbox,
  UserPlus,
  Shield,
  Send,
  RefreshCw,
  AlertTriangle,
  Database,
} from 'lucide-react';

interface LeadsTableProps {
  leads: CustomerRecord[];
  staffMembers: StaffRep[];
  currentStaff: StaffRep;
  onOpenCustomer: (customer: CustomerRecord) => void;
  onUpdateStatus: (id: string, newStatus: LeadFollowUpStatus) => void;
  onQuickActivate: (customer: CustomerRecord) => void;
  onAssignLead: (leadId: string, repName: string) => void;
  onRefreshLeads?: () => void;
  isRefreshing?: boolean;
  lastRefreshedAt?: Date | null;
  dbFetchError?: string | null;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  staffMembers,
  currentStaff,
  onOpenCustomer,
  onUpdateStatus,
  onQuickActivate,
  onAssignLead,
  onRefreshLeads,
  isRefreshing = false,
  lastRefreshedAt,
  dbFetchError,
}) => {
  const isAdmin =
    currentStaff.role === 'admin' ||
    currentStaff.role === 'super_admin' ||
    Boolean(currentStaff.isMasterAdmin);

  // Separate Unassigned leads (Master Pool) vs Assigned leads
  const unassignedLeads = leads.filter(
    (l) => l.salesRep === 'Unassigned' || !l.salesRep || l.salesRep === 'Direct / Web'
  );

  const assignedLeads = leads.filter(
    (l) => l.salesRep !== 'Unassigned' && l.salesRep !== 'Direct / Web' && Boolean(l.salesRep)
  );

  return (
    <div className="space-y-6">

      {/* TOP REFRESH & DATABASE SYNC BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-3.5 w-3.5 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-emerald-700" />
                Live Supabase Feed (Airwireless)
              </span>
              <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 border border-emerald-200">
                {leads.length} Leads Total
              </span>
              <span className="rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 border border-amber-200">
                {unassignedLeads.length} Inbound Unassigned
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live database query runs directly without device or user isolation. All phone and PC submissions sync here.
              {lastRefreshedAt && (
                <span className="ml-1 text-slate-400 font-mono">
                  • Last refreshed: {lastRefreshedAt.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
        </div>

        {onRefreshLeads && (
          <button
            type="button"
            onClick={onRefreshLeads}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-60 px-4 py-2 text-xs font-bold text-white transition-all shadow-xs shrink-0 cursor-pointer"
            title="Fetch the full cross-device leads list directly from the Supabase Airwireless table"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing Leads...' : 'Refresh Leads'}</span>
          </button>
        )}
      </div>

      {/* Surface Database Fetch Error if present */}
      {dbFetchError && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">Database Query Alert</p>
              <p className="mt-0.5 text-amber-800">{dbFetchError}</p>
              <p className="mt-1 text-[11px] text-amber-700">
                Tip: Ensure your Supabase project table has a SELECT policy allowing authenticated or anon users to read from <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">Airwireless</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MASTER LEADS PIPELINE TABLE (ALL SUPABASE LEADS) */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">
                {isAdmin ? 'Master Leads Pipeline (Live Database)' : `${currentStaff.name}'s Leads`}
              </h3>
              <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 border border-emerald-200">
                {leads.length} Total Leads
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live master list directly from Supabase Airwireless table without local device isolation.
            </p>
          </div>

          {onRefreshLeads && (
            <button
              type="button"
              onClick={onRefreshLeads}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 px-3.5 py-1.5 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Leads'}</span>
            </button>
          )}
        </div>

        {leads.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-700 text-sm">No Leads in Airwireless Table</h4>
            <p className="text-slate-400 mt-1 max-w-sm mx-auto">
              No records returned from Supabase table "Airwireless". Click "Refresh Leads" above to query the database.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Customer Name & ID</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Requested Plan</th>
                  <th className="py-3 px-4">Callback Window</th>
                  <th className="py-3 px-4">Sales Rep</th>
                  <th className="py-3 px-4">Follow-Up Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => {
                  const followUp = lead.leadFollowUpStatus || 'new';

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => onOpenCustomer(lead)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                          {lead.fullName}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                          {lead.id} · {new Date(lead.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <Phone className="h-3 w-3 text-emerald-600" />
                          <a href={`tel:${lead.phone}`} className="hover:underline font-mono">
                            {lead.phone}
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <a href={`mailto:${lead.email}`} className="hover:underline">
                            {lead.email}
                          </a>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-emerald-950 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg text-[11px]">
                          {lead.preferredPlanName}
                        </span>
                      </td>

                      {/* Callback Window */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {lead.callbackTimePreference || 'As soon as possible'}
                        </span>
                      </td>

                      {/* Sales Rep (with Reassign dropdown for Admins) */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        {isAdmin ? (
                          <select
                            value={lead.salesRep || 'Unassigned'}
                            onChange={(e) => onAssignLead(lead.id, e.target.value)}
                            className="text-xs font-bold rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-800 outline-none hover:border-emerald-500"
                          >
                            <option value="Unassigned">● Unassigned</option>
                            {staffMembers.map((s) => (
                              <option key={s.id} value={s.name}>
                                {s.name} ({s.commissionMultiplier}x)
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-800">{lead.salesRep}</span>
                            <div className="text-[10px] text-slate-400">{lead.referralSource || 'Direct'}</div>
                          </div>
                        )}
                      </td>

                      {/* Follow-up Status */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={followUp}
                          onChange={(e) => onUpdateStatus(lead.id, e.target.value as LeadFollowUpStatus)}
                          className={`text-[11px] font-bold rounded-lg px-2 py-1 border transition-colors outline-none cursor-pointer ${
                            followUp === 'new'
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                              : followUp === 'contacted'
                              ? 'border-sky-300 bg-sky-50 text-sky-800'
                              : followUp === 'callback_scheduled'
                              ? 'border-amber-300 bg-amber-50 text-amber-800'
                              : followUp === 'qualified'
                              ? 'border-purple-300 bg-purple-50 text-purple-800'
                              : 'border-slate-300 bg-slate-100 text-slate-600'
                          }`}
                        >
                          <option value="new">● New Lead</option>
                          <option value="contacted">Contacted</option>
                          <option value="callback_scheduled">Callback Scheduled</option>
                          <option value="qualified">Qualified</option>
                          <option value="lost">Lost / No Answer</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onQuickActivate(lead)}
                            className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1 text-[11px] font-bold text-white transition-colors shadow-2xs"
                            title="Activate customer line immediately"
                          >
                            <Zap className="h-3 w-3" />
                            <span>Activate Line</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenCustomer(lead)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Open Full Profile"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
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

    </div>
  );
};
