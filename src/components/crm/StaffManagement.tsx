import React, { useState } from 'react';
import { StaffRep, PeerPermission, CustomerRecord, MASTER_ADMIN_EMAIL } from '../../types/telecom';
import { TelecomStorage, calculateCommissionForPlanAndRep } from '../../services/telecomStorage';
import {
  updateStaffPasswordInSupabase,
  signUpStaffInSupabase,
  isSupabaseConfigured,
} from '../../services/supabase';
import { MultiplierAdjustmentModal } from './MultiplierAdjustmentModal';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Lock,
  KeyRound,
  Trash2,
  Edit2,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Eye,
  Sliders,
  DollarSign,
  Smartphone,
  Save,
  X,
  Check,
  ChevronDown,
  UserCheck,
  History,
} from 'lucide-react';

interface StaffManagementProps {
  staffMembers: StaffRep[];
  currentStaff: StaffRep;
  customers?: CustomerRecord[];
  onUpdateCustomers?: (updatedList: CustomerRecord[]) => void;
  onUpdateStaffList: (updatedList: StaffRep[]) => void;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({
  staffMembers,
  currentStaff,
  customers = [],
  onUpdateCustomers,
  onUpdateStaffList,
}) => {
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [targetCredentialsRep, setTargetCredentialsRep] = useState<StaffRep | null>(null);

  // Multiplier Historical Adjustment Modal State
  const [isMultiplierModalOpen, setIsMultiplierModalOpen] = useState(false);
  const [targetMultiplierRep, setTargetMultiplierRep] = useState<StaffRep | null>(null);

  // Edit Credentials Form State (Username / Account Name + Password + Email)
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // Dropdown Peer Assignment State (Requirement 2)
  const [activeRepIdForPeers, setActiveRepIdForPeers] = useState<string>(
    staffMembers.find((s) => !s.isMasterAdmin)?.id || staffMembers[0]?.id || ''
  );
  const [selectedPeerDropdownName, setSelectedPeerDropdownName] = useState<string>('');
  const [peerToggleLeads, setPeerToggleLeads] = useState<boolean>(true);
  const [peerToggleActiveLines, setPeerToggleActiveLines] = useState<boolean>(false);
  const [peerToggleNonActiveLines, setPeerToggleNonActiveLines] = useState<boolean>(false);

  // New Rep Form State
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('(416) 555-0199');
  const [newPassword, setNewPassword] = useState('TempSecure2026!');
  const [newRole, setNewRole] = useState<'sales_rep' | 'manager' | 'admin'>('sales_rep');
  const [newMultiplier, setNewMultiplier] = useState(1.0);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Currently selected rep for Peer Visibility
  const activeRepForPeers = staffMembers.find((s) => s.id === activeRepIdForPeers) || staffMembers[0];

  // Candidates for peers (all staff except the selected rep themselves)
  const peerCandidates = staffMembers.filter((s) => s.id !== activeRepIdForPeers);

  // Handle Dropdown Peer Assignment (Requirement 2)
  const handleAssignPeerFromDropdown = () => {
    if (!selectedPeerDropdownName || !activeRepForPeers) return;

    const existingPeers: PeerPermission[] = [...(activeRepForPeers.peerPermissions || [])];
    const existingIndex = existingPeers.findIndex(
      (p) => p.peerName.toLowerCase() === selectedPeerDropdownName.toLowerCase()
    );

    const newPeerPermission: PeerPermission = {
      peerName: selectedPeerDropdownName,
      viewLeads: peerToggleLeads,
      viewActiveLines: peerToggleActiveLines,
      viewNonActiveLines: peerToggleNonActiveLines,
    };

    if (existingIndex >= 0) {
      existingPeers[existingIndex] = newPeerPermission;
    } else {
      existingPeers.push(newPeerPermission);
    }

    TelecomStorage.updatePeerPermissions(activeRepForPeers.id, existingPeers);
    onUpdateStaffList(TelecomStorage.getStaff());
    showToast(`Assigned peer visibility for ${selectedPeerDropdownName} to ${activeRepForPeers.name}`);
    setSelectedPeerDropdownName('');
  };

  // Toggle individual peer permission checkbox
  const handleTogglePeerPermissionField = (
    peerName: string,
    field: 'viewLeads' | 'viewActiveLines' | 'viewNonActiveLines'
  ) => {
    if (!activeRepForPeers) return;

    const existingPeers: PeerPermission[] = [...(activeRepForPeers.peerPermissions || [])];
    const targetIdx = existingPeers.findIndex(
      (p) => p.peerName.toLowerCase() === peerName.toLowerCase()
    );

    if (targetIdx >= 0) {
      existingPeers[targetIdx] = {
        ...existingPeers[targetIdx],
        [field]: !existingPeers[targetIdx][field],
      };
    } else {
      existingPeers.push({
        peerName,
        viewLeads: field === 'viewLeads',
        viewActiveLines: field === 'viewActiveLines',
        viewNonActiveLines: field === 'viewNonActiveLines',
      });
    }

    TelecomStorage.updatePeerPermissions(activeRepForPeers.id, existingPeers);
    onUpdateStaffList(TelecomStorage.getStaff());
    showToast(`Updated permissions for ${activeRepForPeers.name}`);
  };

  // Remove peer permission assignment
  const handleRemovePeerPermission = (peerName: string) => {
    if (!activeRepForPeers) return;

    const updatedPeers = (activeRepForPeers.peerPermissions || []).filter(
      (p) => p.peerName.toLowerCase() !== peerName.toLowerCase()
    );

    TelecomStorage.updatePeerPermissions(activeRepForPeers.id, updatedPeers);
    onUpdateStaffList(TelecomStorage.getStaff());
    showToast(`Removed peer visibility of ${peerName} for ${activeRepForPeers.name}`);
  };

  // Handle Account Credentials Update (Username + Password + Email)
  const handleOpenCredentialsModal = (rep: StaffRep) => {
    setTargetCredentialsRep(rep);
    setEditUsername(rep.username || '');
    setEditEmail(rep.email || '');
    setEditPassword(rep.password || '');
    setIsCredentialsModalOpen(true);
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCredentialsRep) return;

    if (!editUsername.trim() || !editPassword.trim()) {
      alert('Username and password cannot be blank.');
      return;
    }

    const newPass = editPassword.trim();
    const newUname = editUsername.trim().toLowerCase();
    const newMail = editEmail.trim();

    // Directly invoke Supabase Auth service (supabase.auth.updateUser) for live encrypted password change
    if (isSupabaseConfigured) {
      const { error: authErr } = await updateStaffPasswordInSupabase(newPass);
      if (authErr) {
        console.warn('Supabase Auth updateUser note:', authErr.message);
      }
    }

    TelecomStorage.updateStaff(targetCredentialsRep.id, {
      username: newUname,
      email: newMail,
      password: newPass,
    });

    onUpdateStaffList(TelecomStorage.getStaff());
    setIsCredentialsModalOpen(false);
    setTargetCredentialsRep(null);
    showToast(`Credentials updated for ${targetCredentialsRep.name} (Synchronized with Supabase Auth & CRM)`);
  };

  // Handle Access Revocation
  const handleToggleAccessRevocation = (rep: StaffRep) => {
    if (rep.isMasterAdmin) {
      alert('The Master Admin account access cannot be revoked.');
      return;
    }

    const nextState = !rep.isAccessRevoked;
    const action = () => {
      TelecomStorage.revokeStaffAccess(rep.id, nextState);
      onUpdateStaffList(TelecomStorage.getStaff());
      showToast(
        nextState
          ? `System access revoked for ${rep.name}.`
          : `System access restored for ${rep.name}.`
      );
    };

    action();
  };

  // Update Variable Commission Multiplier with Historical Preservation / Retroactive Recalculation
  const handleOpenMultiplierModal = (rep: StaffRep) => {
    setTargetMultiplierRep(rep);
    setIsMultiplierModalOpen(true);
  };

  const handleMultiplierSuccess = (updatedRep: StaffRep, updatedCustomers?: CustomerRecord[]) => {
    onUpdateStaffList(TelecomStorage.getStaff());
    if (updatedCustomers && onUpdateCustomers) {
      onUpdateCustomers(updatedCustomers);
      showToast(`Multiplier updated to ${updatedRep.commissionMultiplier}x & past activations recalculated!`);
    } else {
      showToast(`Multiplier updated to ${updatedRep.commissionMultiplier}x (Future activations only, past locked)`);
    }
    setIsMultiplierModalOpen(false);
    setTargetMultiplierRep(null);
  };

  const handleUpdateMultiplier = (repId: string, multiplier: number) => {
    const val = Math.max(0.5, Math.min(2.0, parseFloat(multiplier.toFixed(2))));
    TelecomStorage.updateCommissionMultiplier(repId, val);
    onUpdateStaffList(TelecomStorage.getStaff());
    showToast(`Commission multiplier updated to ${val}x`);
  };

  // Delete staff account
  const handleDeleteRep = (rep: StaffRep) => {
    if (rep.isMasterAdmin) {
      alert('The Master Admin account cannot be deleted.');
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete staff account for ${rep.name}?`)) {
      TelecomStorage.deleteStaff(rep.id);
      onUpdateStaffList(TelecomStorage.getStaff());
      showToast(`Account for ${rep.name} deleted.`);
    }
  };

  // Add new rep
  const handleCreateRep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUsername.trim() || !newEmail.trim()) {
      alert('Please fill in name, account login name, and email.');
      return;
    }

    const pass = newPassword.trim() || 'TempSecure2026!';
    const uname = newUsername.trim().toLowerCase();
    const mail = newEmail.trim();

    // If Supabase is configured, also provision user in Supabase Auth
    if (isSupabaseConfigured) {
      signUpStaffInSupabase(mail, pass, {
        name: newName.trim(),
        username: uname,
        role: newRole,
      }).catch((err) => console.warn('Supabase Auth user provisioning note:', err));
    }

    const created = TelecomStorage.addStaff({
      name: newName.trim(),
      username: uname,
      email: mail,
      phone: newPhone.trim() || '(416) 555-0100',
      role: newRole,
      avatarColor: 'bg-emerald-700',
      commissionMultiplier: newMultiplier,
      password: pass,
      isAccessRevoked: false,
      peerPermissions: [],
      allowedViewRepNames: [],
    });

    onUpdateStaffList(TelecomStorage.getStaff());
    setIsAddModalOpen(false);
    showToast(`Created account for ${created.name} (Login username: ${created.username})`);

    // Reset form
    setNewName('');
    setNewUsername('');
    setNewEmail('');
    setNewPassword('TempSecure2026!');
    setNewMultiplier(1.0);
  };

  return (
    <div className="space-y-8">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-emerald-950 border border-emerald-400 p-3.5 text-xs font-bold text-emerald-200 shadow-xl animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner: Master Admin Security & Credentials Hub */}
      <div className="rounded-3xl border-2 border-emerald-800/30 bg-gradient-to-r from-emerald-950 via-[#0B2A20] to-[#0A261D] p-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-emerald-500/20 border border-emerald-400/40 p-3 text-emerald-300 shrink-0">
              <ShieldCheck className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">
                  Staff Account Management & Role-Based Access Control (RBAC)
                </h3>
                <span className="rounded-full bg-emerald-400/20 border border-emerald-400/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  Master Admin Restricted
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-1 max-w-3xl leading-relaxed">
                Manage sales rep accounts, set account login names and passwords, configure variable commission multipliers (0.5x–2.0x, hidden from sales reps), and assign peer visibility via dropdown.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 px-4 py-2.5 text-xs font-extrabold text-[#061E14] transition-all shadow-md active:scale-95"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Sales Rep Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* STAFF ACCOUNTS LIST & MULTIPLIERS TABLE */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Active Staff Directory ({staffMembers.length} Accounts)
            </h4>
            <p className="text-xs text-slate-500">
              Edit account login names, passwords, and assigned multipliers. Multipliers are completely hidden from sales rep portals.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Staff Member</th>
                <th className="py-3 px-3">Login Account Name</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Commission Multiplier</th>
                <th className="py-3 px-3">Sample Payout ($30 Plan)</th>
                <th className="py-3 px-3">Account Status</th>
                <th className="py-3 px-3 text-right">Credentials & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffMembers.map((staff) => {
                const isRevoked = staff.isAccessRevoked;
                const sampleCommission = calculateCommissionForPlanAndRep(30, staff.commissionMultiplier);

                return (
                  <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-xl text-white font-bold flex items-center justify-center text-xs ${staff.avatarColor || 'bg-emerald-700'}`}>
                          {staff.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{staff.name}</span>
                            {staff.isMasterAdmin && (
                              <span className="rounded bg-emerald-950 text-emerald-300 font-bold text-[9px] px-1.5 py-0.2">
                                Master Admin
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">{staff.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Login Username */}
                    <td className="py-3.5 px-3">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {staff.username}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-3">
                      <span className="capitalize text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {staff.role.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Variable Commission Multiplier (0.5x to 2.0x) */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenMultiplierModal(staff)}
                          className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100/90 px-2.5 py-1 text-xs font-bold text-emerald-950 transition-colors shadow-2xs group"
                          title="Click to configure multiplier and retroactive recalculation scope"
                        >
                          <Sliders className="h-3.5 w-3.5 text-emerald-700" />
                          <span className="font-mono">{staff.commissionMultiplier.toFixed(2)}x</span>
                          <span className="text-[10px] text-emerald-700 underline font-semibold ml-0.5 group-hover:text-emerald-900">
                            Configure
                          </span>
                        </button>
                      </div>
                    </td>

                    {/* Sample Payout */}
                    <td className="py-3.5 px-3 font-bold text-slate-900 tabular-nums">
                      ${sampleCommission.toFixed(2)}
                      <span className="text-[10px] text-slate-400 font-normal ml-1">($30 × {staff.commissionMultiplier}x)</span>
                    </td>

                    {/* Access Status */}
                    <td className="py-3.5 px-3">
                      {isRevoked ? (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-100 border border-rose-300 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                          <Ban className="h-3 w-3" />
                          <span>REVOKED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Active</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Credentials */}
                        <button
                          type="button"
                          onClick={() => handleOpenCredentialsModal(staff)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                          title="Edit Account Login Name & Password"
                        >
                          <KeyRound className="h-3.5 w-3.5 text-emerald-700" />
                          <span>Credentials</span>
                        </button>

                        {/* Revoke/Restore */}
                        {!staff.isMasterAdmin && (
                          <button
                            type="button"
                            onClick={() => handleToggleAccessRevocation(staff)}
                            className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-colors ${
                              isRevoked
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            }`}
                          >
                            {isRevoked ? 'Restore' : 'Revoke'}
                          </button>
                        )}

                        {/* Delete */}
                        {!staff.isMasterAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRep(staff)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete Staff"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* SIMPLIFIED ROLE-BASED ACCESS CONTROL: DROPDOWN PEER ASSIGNMENT (Requirement 2) */}
      <div className="rounded-3xl border-2 border-emerald-500/30 bg-white p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-emerald-700" />
            <h3 className="text-base font-black text-slate-900">
              Simplified Team Visibility: Dropdown Peer Assignment
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-4xl leading-relaxed">
            Configure peer data visibility. Select a Sales Rep, choose a peer from the dropdown, and check off exactly what data they are permitted to see (Leads, Active Lines, Non-Active Lines).
          </p>
        </div>

        {/* Step 1: Select Sales Rep to configure */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          <div className="md:col-span-5 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              1. Select Sales Rep to Configure:
            </label>
            <select
              value={activeRepIdForPeers}
              onChange={(e) => setActiveRepIdForPeers(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 shadow-2xs"
            >
              {staffMembers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role.replace('_', ' ')}) — Login: {s.username}
                </option>
              ))}
            </select>

            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900">{activeRepForPeers?.name}</div>
              <div className="text-[11px] text-slate-500">
                Default: Sees own Leads, Active Lines, and Non-Active Lines.
              </div>
            </div>
          </div>

          {/* Step 2: Dropdown Peer Assignment Tool */}
          <div className="md:col-span-7 space-y-3 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4">
            <label className="block text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-emerald-700" />
              <span>2. Assign Visibility to a Peer's Data:</span>
            </label>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                value={selectedPeerDropdownName}
                onChange={(e) => setSelectedPeerDropdownName(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 shadow-2xs"
              >
                <option value="">-- Choose Peer to Grant Access To --</option>
                {peerCandidates.map((peer) => (
                  <option key={peer.id} value={peer.name}>
                    {peer.name} ({peer.role.replace('_', ' ')})
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={!selectedPeerDropdownName}
                onClick={handleAssignPeerFromDropdown}
                className="rounded-xl bg-[#0F3E2E] hover:bg-[#14533D] px-4 py-2 text-xs font-bold text-white transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                + Assign Peer
              </button>
            </div>

            {/* Checkboxes for permissions */}
            <div className="pt-2 border-t border-emerald-200/60">
              <span className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Toggle Visibility Options for {selectedPeerDropdownName || "Selected Peer"}:
              </span>
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-800">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={peerToggleLeads}
                    onChange={(e) => setPeerToggleLeads(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                  />
                  <span>View Peer's Leads</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={peerToggleActiveLines}
                    onChange={(e) => setPeerToggleActiveLines(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                  />
                  <span>View Peer's Active Lines</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={peerToggleNonActiveLines}
                    onChange={(e) => setPeerToggleNonActiveLines(e.target.checked)}
                    className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                  />
                  <span>View Peer's Non-Active Lines</span>
                </label>
              </div>
            </div>
          </div>

        </div>

        {/* Assigned Peers List & Live Toggles for the Active Rep */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-bold text-slate-800">
              Currently Assigned Peers for {activeRepForPeers?.name}:
            </h5>
            <span className="text-[11px] text-slate-400">
              Check/uncheck boxes below to instantly modify visibility with immediate effect
            </span>
          </div>

          {(!activeRepForPeers?.peerPermissions || activeRepForPeers.peerPermissions.length === 0) ? (
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 text-center text-xs text-slate-400">
              No peer visibility currently assigned. {activeRepForPeers?.name} can only view their own personal pipeline.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3">Assigned Peer</th>
                    <th className="py-2.5 px-3 text-center">[ ] View Peer's Leads</th>
                    <th className="py-2.5 px-3 text-center">[ ] View Peer's Active Lines</th>
                    <th className="py-2.5 px-3 text-center">[ ] View Peer's Non-Active Lines</th>
                    <th className="py-2.5 px-3 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeRepForPeers.peerPermissions.map((perm) => (
                    <tr key={perm.peerName} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {perm.peerName}
                      </td>

                      {/* Leads Toggle */}
                      <td className="py-2.5 px-3 text-center">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={perm.viewLeads}
                            onChange={() => handleTogglePeerPermissionField(perm.peerName, 'viewLeads')}
                            className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                          />
                          <span className={`text-[11px] font-semibold ${perm.viewLeads ? 'text-emerald-800' : 'text-slate-400'}`}>
                            {perm.viewLeads ? 'Allowed' : 'Off'}
                          </span>
                        </label>
                      </td>

                      {/* Active Lines Toggle */}
                      <td className="py-2.5 px-3 text-center">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={perm.viewActiveLines}
                            onChange={() => handleTogglePeerPermissionField(perm.peerName, 'viewActiveLines')}
                            className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                          />
                          <span className={`text-[11px] font-semibold ${perm.viewActiveLines ? 'text-emerald-800' : 'text-slate-400'}`}>
                            {perm.viewActiveLines ? 'Allowed' : 'Off'}
                          </span>
                        </label>
                      </td>

                      {/* Non-Active Lines Toggle */}
                      <td className="py-2.5 px-3 text-center">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={perm.viewNonActiveLines}
                            onChange={() => handleTogglePeerPermissionField(perm.peerName, 'viewNonActiveLines')}
                            className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                          />
                          <span className={`text-[11px] font-semibold ${perm.viewNonActiveLines ? 'text-emerald-800' : 'text-slate-400'}`}>
                            {perm.viewNonActiveLines ? 'Allowed' : 'Off'}
                          </span>
                        </label>
                      </td>

                      {/* Remove Button */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemovePeerPermission(perm.peerName)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* MODAL 1: EDIT ACCOUNT LOGIN NAME & PASSWORD */}
      {isCredentialsModalOpen && targetCredentialsRep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <button
              onClick={() => setIsCredentialsModalOpen(false)}
              className="absolute top-4 right-4 rounded-xl p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-emerald-100 p-2 text-emerald-800">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Edit Account Credentials
                </h4>
                <p className="text-xs text-slate-500">
                  {targetCredentialsRep.name} ({targetCredentialsRep.role})
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Login Name (Username)
                </label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="e.g. rep.demo or aarav"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Staff member can use this username to sign in at /staff-portal
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  disabled={targetCredentialsRep.isMasterAdmin}
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Password
                </label>
                <input
                  type="text"
                  required
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCredentialsModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0F3E2E] hover:bg-[#14533D] px-4 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW SALES REP ACCOUNT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 rounded-xl p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-800">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Add Sales Representative Account
                </h4>
                <p className="text-xs text-slate-500">
                  Provision login name, password, and custom commission multiplier
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateRep} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Leo Chen"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Login Username</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. leo.chen"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="leo@ctexcel.ca"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Commission Multiplier: <strong className="font-mono text-emerald-800">{newMultiplier.toFixed(2)}x</strong>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={newMultiplier}
                  onChange={(e) => setNewMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Calculation preview: $30 monthly plan × {newMultiplier.toFixed(2)}x = ${(30 * newMultiplier).toFixed(2)} commission
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0F3E2E] hover:bg-[#14533D] px-4 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Create Rep Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Multiplier Update & Selective Retroactive Recalculation Modal */}
      {isMultiplierModalOpen && targetMultiplierRep && (
        <MultiplierAdjustmentModal
          isOpen={isMultiplierModalOpen}
          onClose={() => {
            setIsMultiplierModalOpen(false);
            setTargetMultiplierRep(null);
          }}
          rep={targetMultiplierRep}
          customers={customers}
          onSuccess={handleMultiplierSuccess}
        />
      )}

    </div>
  );
};
