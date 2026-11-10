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
} from 'lucide-react';

interface LeadsTableProps {
  leads: CustomerRecord[];
  staffMembers: StaffRep[];
  currentStaff: StaffRep;
  onOpenCustomer: (customer: CustomerRecord) => void;
  onUpdateStatus: (id: string, newStatus: LeadFollowUpStatus) => void;
  onQuickActivate: (customer: CustomerRecord) => void;
  onAssignLead: (leadId: string, repName: string) => void;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  staffMembers,
  currentStaff,
  onOpenCustomer,
  onUpdateStatus,
  onQuickActivate,
  onAssignLead,
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

      {/* ADMIN LEAD DISTRIBUTION ENGINE: Master Unassigned Pool */}
      {isAdmin && (
        <div className="rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-950 via-[#0C2E22] to-[#08241A] p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-400/20 border border-emerald-400/30 p-2.5 text-emerald-300">
                <Inbox className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">
                    Master Inbound Lead Pool (Admin Distribution)
                  </h3>
                  <span className="rounded-full bg-emerald-400 text-[#061E14] font-black text-[10px] px-2.5 py-0.5 animate-pulse-once">
                    {unassignedLeads.length} Unassigned
                  </span>
                </div>
                <p className="text-xs text-emerald-100/70 mt-0.5">
                  Public landing page leads arrive here automatically. Distribute leads to sales reps to populate their isolated portals.
                </p>
              </div>
            </div>

            <div className="text-[11px] font-mono text-emerald-300/80 bg-emerald-900/60 border border-emerald-400/20 px-3 py-1.5 rounded-xl">
              Distribution Engine: Active
            </div>
          </div>

          {unassignedLeads.length === 0 ? (
            <div className="py-6 text-center text-emerald-300/60 text-xs rounded-2xl bg-black/20 border border-emerald-500/10">
              ✓ Master lead pool is all clear! All customer callback requests have been distributed to sales reps.
            </div>
          ) : (
            <div className="space-y-3">
              {unassignedLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-2xl border border-emerald-400/20 bg-emerald-900/30 hover:bg-emerald-900/40 p-4 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  {/* Lead Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm">
                        {lead.fullName}
                      </span>
                      <span className="font-mono text-[10px] text-emerald-300/80 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/20">
                        {lead.id}
                      </span>
                      <span className="rounded bg-emerald-400/20 text-emerald-300 font-bold text-[10px] px-2 py-0.5">
                        {lead.callbackTimePreference || 'ASAP'}
                      </span>
                    </div>

                    <div className="text-xs text-emerald-100/80 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-emerald-400" />
                        <strong className="text-white font-mono">{lead.phone}</strong>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-emerald-400/70" />
                        <span>{lead.email}</span>
                      </span>
                      <span>·</span>
                      <span>Plan: <strong className="text-emerald-300">{lead.preferredPlanName}</strong></span>
                      <span>·</span>
                      <span>Source: {lead.referralSource || 'Landing Page'}</span>
                    </div>

                    {lead.notes && (
                      <p className="text-[11px] text-emerald-200/70 italic pt-0.5">
                        "{lead.notes}"
                      </p>
                    )}
                  </div>

                  {/* Distribution Dropdown Tool */}
                  <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
                    <div className="flex items-center gap-1.5 bg-[#061D13] border border-emerald-400/30 rounded-xl px-2.5 py-1.5 shadow-xs">
                      <UserPlus className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span className="text-[11px] font-bold text-emerald-200 whitespace-nowrap">
                        Assign To:
                      </span>
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            onAssignLead(lead.id, e.target.value);
                          }
                        }}
                        className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer pr-1"
                      >
                        <option value="" disabled className="text-slate-800">
                          Select Sales Rep...
                        </option>
                        {staffMembers.map((s) => (
                          <option key={s.id} value={s.name} className="text-slate-900">
                            {s.name} ({s.commissionMultiplier}x multiplier)
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenCustomer(lead)}
                      className="rounded-xl border border-emerald-400/30 bg-emerald-950/60 hover:bg-emerald-900 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ASSIGNED LEADS PIPELINE TABLE */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">
                {isAdmin ? 'Active Leads Pipeline' : `${currentStaff.name}'s Assigned Leads`}
              </h3>
              <span className="rounded-full bg-slate-200 text-slate-800 text-[10px] font-extrabold px-2 py-0.5">
                {assignedLeads.length} Leads
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAdmin
                ? 'Leads distributed to sales representatives. Monitor contact progress or reassign.'
                : 'Customer leads assigned directly to you by the Admin. Follow up and convert to active lines.'}
            </p>
          </div>
        </div>

        {assignedLeads.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-700 text-sm">No Assigned Leads Found</h4>
            <p className="text-slate-400 mt-1 max-w-sm mx-auto">
              {isAdmin
                ? 'All new inbound leads are currently in the Master Unassigned Pool above.'
                : 'No leads currently assigned to you. Leads assigned by the Admin will appear here.'}
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
                {assignedLeads.map((lead) => {
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
                            value={lead.salesRep}
                            onChange={(e) => onAssignLead(lead.id, e.target.value)}
                            className="text-xs font-bold rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-800 outline-none hover:border-emerald-500"
                          >
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
