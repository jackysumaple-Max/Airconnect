import React, { useState, useMemo } from 'react';
import { CustomerRecord, Plan, CMSConfig, StaffRep, CustomerStatus, LeadFollowUpStatus } from '../../types/telecom';
import {
  calculateDaysBetween,
  canStaffViewRecord,
  canStaffViewLead,
  canStaffViewActiveLine,
  canStaffViewNonActiveLine,
  TelecomStorage,
} from '../../services/telecomStorage';
import { DateRangeFilter, DateFilterMode } from './DateRangeFilter';
import { CrmHeader } from './CrmHeader';
import { LeadsTable } from './LeadsTable';
import { LinesTable } from './LinesTable';
import { ClawbackTracker } from './ClawbackTracker';
import { ResidualEngine } from './ResidualEngine';
import { CmsEditor } from './CmsEditor';
import { StaffManagement } from './StaffManagement';
import { CustomerProfileModal } from './CustomerProfileModal';
import { NewCustomerModal } from './NewCustomerModal';
import {
  Users,
  Activity,
  UserX,
  DollarSign,
  TrendingUp,
  Settings2,
  Search,
  Filter,
  Download,
  Plus,
  RefreshCw,
  AlertTriangle,
  Shield,
} from 'lucide-react';

interface CrmDashboardProps {
  customers: CustomerRecord[];
  plans: Plan[];
  cms: CMSConfig;
  staffMembers: StaffRep[];
  currentStaff: StaffRep;
  onSelectStaff: (staff: StaffRep) => void;
  onBackToLanding: () => void;
  onSaveCustomer: (id: string, updates: Partial<CustomerRecord>) => void;
  onDeleteCustomer: (id: string) => void;
  onAddCustomer: (customer: CustomerRecord) => void;
  onSaveCms: (cms: CMSConfig) => void;
  onSavePlans: (plans: Plan[]) => void;
  onResetData: () => void;
  onUpdateStaffList?: (updatedList: StaffRep[]) => void;
}

export const CrmDashboard: React.FC<CrmDashboardProps> = ({
  customers,
  plans,
  cms,
  staffMembers,
  currentStaff,
  onSelectStaff,
  onBackToLanding,
  onSaveCustomer,
  onDeleteCustomer,
  onAddCustomer,
  onSaveCms,
  onSavePlans,
  onResetData,
  onUpdateStaffList,
}) => {
  // Master Admin status
  const isMasterAdmin = Boolean(currentStaff.isMasterAdmin || currentStaff.role === 'super_admin');

  // Main Navigation Views
  // Non-admins start on 'leads' and cannot access residuals or staff
  const [activeTab, setActiveTab] = useState<'leads' | 'active_lines' | 'non_active_lines' | 'residuals' | 'commissions' | 'staff' | 'cms'>('leads');
  
  // Standardized Date Range Selector State for Leads, Active Lines, Non-Active Lines
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [customStartMonth, setCustomStartMonth] = useState<string>('2026-08');
  const [customEndMonth, setCustomEndMonth] = useState<string>('2026-11');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRep, setFilterRep] = useState('all');

  // Modal states
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Available months dynamically extracted from customer records
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    monthSet.add('2026-11');
    monthSet.add('2026-10');
    monthSet.add('2026-09');
    monthSet.add('2026-08');
    customers.forEach((c) => {
      const d = c.submittedAt || c.activationStartDate || c.deactivationDate || c.commission?.payoutDate;
      if (d && d.length >= 7) {
        monthSet.add(d.substring(0, 7));
      }
    });
    return Array.from(monthSet).sort().reverse();
  }, [customers]);

  // RBAC Permission-Filtered Records with Dropdown Peer Assignment:
  // - Master Admin sees ALL records
  // - Sales Reps see own records + peers with explicit view permissions
  const leads = useMemo(() => {
    return customers.filter((c) => c.status === 'lead' && canStaffViewLead(currentStaff, c.salesRep));
  }, [customers, currentStaff]);

  const activeLines = useMemo(() => {
    return customers.filter((c) => c.status === 'active_line' && canStaffViewActiveLine(currentStaff, c.salesRep));
  }, [customers, currentStaff]);

  const nonActiveLines = useMemo(() => {
    return customers.filter((c) => c.status === 'non_active_line' && canStaffViewNonActiveLine(currentStaff, c.salesRep));
  }, [customers, currentStaff]);

  const rbacAccessibleCustomers = useMemo(() => {
    return customers.filter((c) => canStaffViewRecord(currentStaff, c.salesRep));
  }, [customers, currentStaff]);

  // Automated 180-day clawback counts
  const clawbackAccounts = useMemo(() => {
    return rbacAccessibleCustomers.filter(
      (c) =>
        c.commission?.status === 'clawback' ||
        c.commission?.isClawbackFlagged ||
        (c.status === 'non_active_line' &&
          c.activationStartDate &&
          calculateDaysBetween(c.activationStartDate, c.deactivationDate) <= 180)
    );
  }, [rbacAccessibleCustomers]);

  const totalCommissionsPaid = useMemo(() => {
    return rbacAccessibleCustomers
      .filter((c) => c.commission?.status === 'paid')
      .reduce((sum, c) => sum + (c.commission?.amount || 0), 0);
  }, [rbacAccessibleCustomers]);

  // Filtered dataset for currently active tab (including Date Range Selector)
  const filteredDataset = useMemo(() => {
    let source: CustomerRecord[] = [];
    if (activeTab === 'leads') source = leads;
    else if (activeTab === 'active_lines') source = activeLines;
    else if (activeTab === 'non_active_lines') source = nonActiveLines;
    else source = rbacAccessibleCustomers;

    return source.filter((item) => {
      // Rep filter
      if (filterRep !== 'all' && item.salesRep !== filterRep) {
        return false;
      }

      // Date Range Filter for Leads, Active Lines, Non-Active Lines
      if (activeTab === 'leads' || activeTab === 'active_lines' || activeTab === 'non_active_lines') {
        const refDate =
          activeTab === 'leads'
            ? item.submittedAt || item.activationStartDate
            : activeTab === 'active_lines'
            ? item.activationStartDate || item.submittedAt
            : item.deactivationDate || item.activationStartDate || item.submittedAt;

        if (refDate && refDate.length >= 7) {
          const itemMonth = refDate.substring(0, 7);
          if (dateFilterMode === 'single') {
            if (itemMonth !== selectedMonth) return false;
          } else if (dateFilterMode === 'custom') {
            const start = customStartMonth <= customEndMonth ? customStartMonth : customEndMonth;
            const end = customStartMonth <= customEndMonth ? customEndMonth : customStartMonth;
            if (itemMonth < start || itemMonth > end) return false;
          }
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.fullName.toLowerCase().includes(q);
        const matchEmail = item.email.toLowerCase().includes(q);
        const matchPhone = item.phone.toLowerCase().includes(q) || (item.activatedPhone && item.activatedPhone.toLowerCase().includes(q));
        const matchId = item.id.toLowerCase().includes(q);
        const matchPlan = item.preferredPlanName.toLowerCase().includes(q);
        const matchRep = item.salesRep.toLowerCase().includes(q);
        return matchName || matchEmail || matchPhone || matchId || matchPlan || matchRep;
      }

      return true;
    });
  }, [
    activeTab,
    leads,
    activeLines,
    nonActiveLines,
    rbacAccessibleCustomers,
    filterRep,
    dateFilterMode,
    selectedMonth,
    customStartMonth,
    customEndMonth,
    searchQuery,
  ]);

  // Handle Lead Assignment by Admin from Master Unassigned Pool
  const handleAssignLead = (leadId: string, repName: string) => {
    const updated = TelecomStorage.assignLead(leadId, repName, currentStaff.name);
    if (updated) {
      onSaveCustomer(leadId, updated);
    }
  };

  // Handle Quick Status Update for Leads
  const handleUpdateLeadStatus = (id: string, newStatus: LeadFollowUpStatus) => {
    onSaveCustomer(id, { leadFollowUpStatus: newStatus });
  };

  // Handle Quick Activate from Lead to Active Line
  const handleQuickActivate = (lead: CustomerRecord) => {
    const today = new Date().toISOString().split('T')[0];
    const rep = staffMembers.find((s) => s.name === lead.salesRep);
    const multiplier = rep ? rep.commissionMultiplier : (lead.commission?.multiplierUsed || 1.0);
    const commissionVal = Number(((lead.monthlyPlanPrice || 30) * multiplier).toFixed(2));

    const updates: Partial<CustomerRecord> = {
      status: 'active_line',
      activationStartDate: today,
      activatedPhone: lead.activatedPhone || lead.phone,
      idVerification: {
        ...lead.idVerification,
        status: 'verified',
        verifiedBy: currentStaff.name,
        verifiedAt: new Date().toISOString(),
      },
      commission: {
        ...lead.commission,
        amount: commissionVal,
        multiplierUsed: multiplier,
        status: 'paid',
        payoutDate: today,
        isClawbackFlagged: false,
      },
      notes: `${lead.notes || ''}\n[Activated on ${today} by ${currentStaff.name} with ${multiplier}x multiplier]`,
    };
    onSaveCustomer(lead.id, updates);
  };

  // Handle Commission toggle from Clawback Tracker
  const handleUpdateCommissionStatus = (id: string, newStatus: 'pending' | 'paid' | 'clawback') => {
    const target = customers.find((c) => c.id === id);
    if (!target) return;
    onSaveCustomer(id, {
      commission: {
        ...target.commission,
        status: newStatus,
        isClawbackFlagged: newStatus === 'clawback',
      },
    });
  };

  // Export CSV helper
  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Status',
      'Full Name',
      'Email',
      'Phone',
      'Activated Phone',
      'Plan Name',
      'Sales Rep',
      'Referral Source',
      'Activation Start Date',
      'Deactivation Date',
      'Commission Status',
      'Commission Amount',
      'Clawback Flagged',
      'ID Verified',
    ];

    const rows = filteredDataset.map((c) => [
      c.id,
      c.status,
      `"${c.fullName}"`,
      c.email,
      c.phone,
      c.activatedPhone || '',
      `"${c.preferredPlanName}"`,
      `"${c.salesRep}"`,
      `"${c.referralSource || ''}"`,
      c.activationStartDate || '',
      c.deactivationDate || '',
      c.commission?.status || 'pending',
      c.commission?.amount || 0,
      c.commission?.isClawbackFlagged ? 'YES' : 'NO',
      c.idVerification?.status || 'unverified',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `airconnect_${activeTab}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F5] text-slate-900 pb-16">
      
      {/* Top Header with Stats and Staff selector */}
      <CrmHeader
        onBackToLanding={onBackToLanding}
        staffMembers={staffMembers}
        currentStaff={currentStaff}
        onSelectStaff={onSelectStaff}
        leadsCount={leads.length}
        activeLinesCount={activeLines.length}
        nonActiveLinesCount={nonActiveLines.length}
        clawbacksCount={clawbackAccounts.length}
        totalCommissionsPaid={totalCommissionsPaid}
        clawbackAlertsCount={clawbackAccounts.length}
        onOpenClawbackView={() => setActiveTab('commissions')}
      />

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Navigation Tabs Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          
          {/* Main 5 Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl overflow-x-auto">
            
            {/* 1. Leads View */}
            <button
              onClick={() => setActiveTab('leads')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'leads'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="h-4 w-4 text-emerald-700" />
              <span>Leads</span>
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[10px] font-extrabold">
                {leads.length}
              </span>
            </button>

            {/* 2. Active Lines View */}
            <button
              onClick={() => setActiveTab('active_lines')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'active_lines'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="h-4 w-4 text-teal-700" />
              <span>Active Lines</span>
              <span className="rounded-full bg-teal-100 text-teal-800 px-1.5 py-0.2 text-[10px] font-extrabold">
                {activeLines.length}
              </span>
            </button>

            {/* 3. Non-Active Lines View */}
            <button
              onClick={() => setActiveTab('non_active_lines')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'non_active_lines'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserX className="h-4 w-4 text-slate-700" />
              <span>Non-Active Lines</span>
              <span className="rounded-full bg-slate-200 text-slate-800 px-1.5 py-0.2 text-[10px] font-extrabold">
                {nonActiveLines.length}
              </span>
              {clawbackAccounts.length > 0 && (
                <span className="rounded-full bg-rose-600 text-white px-1.5 py-0.2 text-[9px] font-extrabold" title="Clawbacks Flagged">
                  {clawbackAccounts.length}!
                </span>
              )}
            </button>

            {/* 4. Monthly Residuals Engine View (7% / 9% Volume Logic) - STRICTLY Master Admin Only */}
            {isMasterAdmin && (
              <button
                onClick={() => setActiveTab('residuals')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  activeTab === 'residuals'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="h-4 w-4 text-emerald-700" />
                <span>Monthly Residuals</span>
                <span className="rounded bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-1.5 py-0.2">
                  7% / 9% Tiers
                </span>
              </button>
            )}

            {/* 5. Upfront Commission & Clawbacks View (Personal for Reps, Master Ledger for Admin) */}
            <button
              onClick={() => setActiveTab('commissions')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'commissions'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign className="h-4 w-4 text-emerald-700" />
              <span>{isMasterAdmin ? 'Commission & Clawback Ledger' : 'My Commissions'}</span>
              {isMasterAdmin && clawbackAccounts.length > 0 && (
                <span className="rounded bg-rose-100 text-rose-800 font-extrabold text-[10px] px-1.5 py-0.2">
                  {clawbackAccounts.length} Flagged
                </span>
              )}
            </button>

            {/* 6. Staff & Variable Commission Multipliers (Master Admin Only) */}
            {isMasterAdmin && (
              <button
                onClick={() => setActiveTab('staff')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  activeTab === 'staff'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="h-4 w-4 text-emerald-700" />
                <span>Staff & Multipliers</span>
                <span className="rounded bg-emerald-950 text-emerald-300 font-extrabold text-[9px] px-1.5 py-0.2">
                  Master
                </span>
              </button>
            )}

            {/* 7. CMS Editor View (Admin Only) */}
            {(isMasterAdmin || currentStaff.role === 'admin') && (
              <button
                onClick={() => setActiveTab('cms')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  activeTab === 'cms'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Settings2 className="h-4 w-4 text-emerald-700" />
                <span>CMS & Plans Editor</span>
              </button>
            )}

          </div>

          {/* Quick Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Download CSV"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#0F3E2E] hover:bg-[#14533D] px-3.5 py-2 text-xs font-bold text-white transition-colors shadow-2xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add Lead / Line</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Reset database to initial sample records (leads, active lines, and clawbacks)?')) {
                  onResetData();
                }
              }}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              title="Reset Sample Data"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>

        {/* Global Standardized Date Range Selector for Leads, Active Lines, Non-Active Lines */}
        {(activeTab === 'leads' || activeTab === 'active_lines' || activeTab === 'non_active_lines') && (
          <DateRangeFilter
            mode={dateFilterMode}
            onModeChange={setDateFilterMode}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            customStartMonth={customStartMonth}
            onCustomStartChange={setCustomStartMonth}
            customEndMonth={customEndMonth}
            onCustomEndChange={setCustomEndMonth}
            availableMonths={availableMonths}
            totalRecordsCount={
              activeTab === 'leads'
                ? leads.length
                : activeTab === 'active_lines'
                ? activeLines.length
                : nonActiveLines.length
            }
            filteredCount={filteredDataset.length}
            label={
              activeTab === 'leads'
                ? 'Leads'
                : activeTab === 'active_lines'
                ? 'Active Lines'
                : 'Non-Active Lines'
            }
          />
        )}

        {/* Search & Filtering Strip (shown for Leads, Active Lines, Non-Active Lines) */}
        {activeTab !== 'cms' && activeTab !== 'commissions' && activeTab !== 'staff' && activeTab !== 'residuals' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-96">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer, phone, email, plan, or rep..."
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Rep Filter Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="h-3.5 w-3.5" />
                <span>Filter Rep:</span>
              </div>
              <select
                value={filterRep}
                onChange={(e) => setFilterRep(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none"
              >
                <option value="all">All Sales Representatives</option>
                {staffMembers.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
                <option value="Direct / Web">Direct / Web</option>
              </select>

              <span className="text-xs text-slate-400 font-mono ml-2">
                {filteredDataset.length} records
              </span>
            </div>

          </div>
        )}

        {/* View Content based on active tab */}
        {activeTab === 'leads' && (
          <LeadsTable
            leads={filteredDataset}
            staffMembers={staffMembers}
            currentStaff={currentStaff}
            onOpenCustomer={(customer) => setSelectedCustomer(customer)}
            onUpdateStatus={handleUpdateLeadStatus}
            onQuickActivate={handleQuickActivate}
            onAssignLead={handleAssignLead}
          />
        )}

        {activeTab === 'active_lines' && (
          <LinesTable
            lines={filteredDataset}
            type="active"
            isMasterAdmin={isMasterAdmin}
            onOpenCustomer={(customer) => setSelectedCustomer(customer)}
          />
        )}

        {activeTab === 'non_active_lines' && (
          <LinesTable
            lines={filteredDataset}
            type="non_active"
            isMasterAdmin={isMasterAdmin}
            onOpenCustomer={(customer) => setSelectedCustomer(customer)}
          />
        )}

        {activeTab === 'residuals' && isMasterAdmin && (
          <ResidualEngine
            customers={customers}
            onRefreshData={() => {}}
          />
        )}

        {activeTab === 'commissions' && (
          <ClawbackTracker
            customers={customers}
            staffMembers={staffMembers}
            currentStaff={currentStaff}
            onOpenCustomer={(customer) => setSelectedCustomer(customer)}
            onUpdateCommissionStatus={handleUpdateCommissionStatus}
          />
        )}

        {activeTab === 'staff' && isMasterAdmin && (
          <StaffManagement
            staffMembers={staffMembers}
            currentStaff={currentStaff}
            onUpdateStaffList={onUpdateStaffList || ((l) => TelecomStorage.saveStaff(l))}
          />
        )}

        {activeTab === 'cms' && (isMasterAdmin || currentStaff.role === 'admin') && (
          <CmsEditor
            cms={cms}
            plans={plans}
            onSaveCms={onSaveCms}
            onSavePlans={onSavePlans}
            onPreviewSite={onBackToLanding}
          />
        )}

      </div>

      {/* Customer Profile Modal / Slide-over */}
      {selectedCustomer && (
        <CustomerProfileModal
          customer={selectedCustomer}
          plans={plans}
          staffMembers={staffMembers}
          isOpen={Boolean(selectedCustomer)}
          isMasterAdmin={isMasterAdmin}
          onClose={() => setSelectedCustomer(null)}
          onSave={onSaveCustomer}
          onDelete={onDeleteCustomer}
        />
      )}

      {/* New Customer / Lead Modal */}
      {isNewModalOpen && (
        <NewCustomerModal
          plans={plans}
          staffMembers={staffMembers}
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onAdd={onAddCustomer}
        />
      )}

    </div>
  );
};
