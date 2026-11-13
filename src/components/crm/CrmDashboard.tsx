import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { CustomerRecord, Plan, CMSConfig, StaffRep, CustomerStatus, LeadFollowUpStatus } from '../../types/telecom';
import {
  calculateDaysBetween,
  canStaffViewRecord,
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
import { ExcelExportModal } from './ExcelExportModal';
import { DeletedItemsView } from './DeletedItemsView';
import {
  supabase,
  restoreCustomerInSupabase,
  hardDeleteCustomersInSupabase,
  mapAirwirelessRowToCustomerRecord,
  toAirwirelessDbStatus,
} from '../../services/supabase';
import { CrmErrorBoundary } from './CrmErrorBoundary';
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
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';

interface CrmDashboardProps {
  customers: CustomerRecord[];
  plans: Plan[];
  cms: CMSConfig;
  staffMembers: StaffRep[];
  currentStaff: StaffRep;
  onSelectStaff: (staff: StaffRep) => void;
  onBackToLanding: () => void;
  onNavigateToPublic?: () => void;
  onSaveCustomer: (id: string, updates: Partial<CustomerRecord>) => void;
  onDeleteCustomer: (id: string) => void;
  onAddCustomer: (customer: CustomerRecord) => void;
  onSaveCms: (cms: CMSConfig) => void;
  onSavePlans: (plans: Plan[]) => void;
  onResetData: () => void;
  onUpdateStaffList?: (updatedList: StaffRep[]) => void;
  onUpdateCustomers?: (updatedList: CustomerRecord[]) => void;
  onRestoreCustomers?: (ids: string[]) => void;
  onHardDeleteCustomers?: (ids: string[]) => void;
}

export const CrmDashboard: React.FC<CrmDashboardProps> = ({
  customers,
  plans,
  cms,
  staffMembers,
  currentStaff,
  onSelectStaff,
  onBackToLanding,
  onNavigateToPublic,
  onSaveCustomer,
  onDeleteCustomer,
  onAddCustomer,
  onSaveCms,
  onSavePlans,
  onResetData,
  onUpdateStaffList,
  onUpdateCustomers,
  onRestoreCustomers,
  onHardDeleteCustomers,
}) => {
  // Master Admin status
  const isMasterAdmin = Boolean(currentStaff.isMasterAdmin || currentStaff.role === 'super_admin');

  // Main Navigation Views (including Master Admin Recycle Bin)
  const [activeTab, setActiveTab] = useState<
    'leads' | 'active_lines' | 'non_active_lines' | 'residuals' | 'commissions' | 'staff' | 'cms' | 'deleted_items'
  >('leads');
  
  // Standardized Date Range Selector State for Leads, Active Lines, Non-Active Lines
  const currentCalendarMonth = new Date().toISOString().substring(0, 7);
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentCalendarMonth);
  const [customStartMonth, setCustomStartMonth] = useState<string>(currentCalendarMonth);
  const [customEndMonth, setCustomEndMonth] = useState<string>(currentCalendarMonth);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRep, setFilterRep] = useState('all');

  // Modal states
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isExcelExportModalOpen, setIsExcelExportModalOpen] = useState(false);

  // Live Supabase Leads State (Force Live Fetch across all devices)
  const [liveDbLeads, setLiveDbLeads] = useState<CustomerRecord[] | null>(null);
  const [isRefreshingLeads, setIsRefreshingLeads] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [dbFetchError, setDbFetchError] = useState<string | null>(null);

  // Bulk Row Selection & Action State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState<boolean>(false);
  const [bulkActionNotice, setBulkActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const onUpdateCustomersRef = useRef(onUpdateCustomers);
  onUpdateCustomersRef.current = onUpdateCustomers;
  const isMountedRef = useRef(true);
  const isRefreshingInFlightRef = useRef(false);
  const airwirelessColumnsRef = useRef<Set<string>>(new Set());

  const handleTabChange = useCallback(
    (
      nextTab:
        | 'leads'
        | 'active_lines'
        | 'non_active_lines'
        | 'residuals'
        | 'commissions'
        | 'staff'
        | 'cms'
        | 'deleted_items'
    ) => {
      setActiveTab(nextTab);
      setSelectedIds([]);
      setBulkActionNotice(null);
      setDbFetchError(null);
    },
    []
  );

  // Universal Live Refresh: Fetches all rows from Supabase 'Airwireless' table (including UUID `id`),
  // updates React state cleanly, and keeps App customers in sync without triggering re-fetch loops.
  const refreshData = useCallback(async () => {
    if (isRefreshingInFlightRef.current) return;
    isRefreshingInFlightRef.current = true;
    if (isMountedRef.current) {
      setIsRefreshingLeads(true);
      setDbFetchError(null);
    }

    try {
      const { data, error } = await supabase.from('Airwireless').select('*');
      if (!isMountedRef.current) return;

      if (error) {
        console.error('Supabase live fetch error on Airwireless:', error);
        setDbFetchError(error.message || 'Error fetching records from Supabase Airwireless table');
        return;
      }

      if (Array.isArray(data) && data.length > 0 && data[0] && typeof data[0] === 'object') {
        airwirelessColumnsRef.current = new Set(Object.keys(data[0]));
      }

      const mapped: CustomerRecord[] = (Array.isArray(data) ? data : [])
        .filter((item: any) => item && item.id !== undefined && item.id !== null)
        .map(mapAirwirelessRowToCustomerRecord);

      mapped.sort((a, b) => {
        const timeA = new Date(a.submittedAt || 0).getTime() || 0;
        const timeB = new Date(b.submittedAt || 0).getTime() || 0;
        return timeB - timeA;
      });

      setLiveDbLeads([...mapped]);
      setLastRefreshedAt(new Date());
      if (onUpdateCustomersRef.current) {
        onUpdateCustomersRef.current([...mapped]);
      }
    } catch (err: any) {
      console.error('Exception fetching live records from Airwireless:', err);
      if (isMountedRef.current) {
        setDbFetchError(err?.message || 'Failed to connect to Supabase database');
        setLiveDbLeads([]);
      }
    } finally {
      isRefreshingInFlightRef.current = false;
      if (isMountedRef.current) {
        setIsRefreshingLeads(false);
      }
    }
  }, []);

  // Force global fetch immediately on component mount
  useEffect(() => {
    isMountedRef.current = true;
    refreshData();
    return () => {
      isMountedRef.current = false;
    };
  }, [refreshData]);

  // Authoritative dataset from Supabase Airwireless when loaded
  const mergedDatabaseCustomers = useMemo(() => {
    if (liveDbLeads !== null) return liveDbLeads;
    return Array.isArray(customers) ? customers : [];
  }, [customers, liveDbLeads]);

  // Available months dynamically extracted from real customer records
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    monthSet.add(new Date().toISOString().substring(0, 7));
    mergedDatabaseCustomers.forEach((c) => {
      const d = c.submittedAt || c.activationStartDate || c.deactivationDate || c.commission?.payoutDate;
      if (typeof d === 'string' && d.length >= 7) {
        monthSet.add(d.substring(0, 7));
      }
    });
    return Array.from(monthSet).sort().reverse();
  }, [mergedDatabaseCustomers]);

  // Leads tab shows un-converted leads directly from the Supabase Airwireless fetch
  const leads = useMemo(() => {
    if (!liveDbLeads) return [];
    return liveDbLeads.filter((c) => !c.isDeleted && c.status === 'lead');
  }, [liveDbLeads]);

  const activeLines = useMemo(() => {
    return mergedDatabaseCustomers.filter(
      (c) => !c.isDeleted && c.status === 'active_line' && canStaffViewActiveLine(currentStaff, c.salesRep)
    );
  }, [mergedDatabaseCustomers, currentStaff]);

  const nonActiveLines = useMemo(() => {
    return mergedDatabaseCustomers.filter(
      (c) => !c.isDeleted && c.status === 'non_active_line' && canStaffViewNonActiveLine(currentStaff, c.salesRep)
    );
  }, [mergedDatabaseCustomers, currentStaff]);

  const rbacAccessibleCustomers = useMemo(() => {
    return mergedDatabaseCustomers.filter(
      (c) => !c.isDeleted && canStaffViewRecord(currentStaff, c.salesRep)
    );
  }, [mergedDatabaseCustomers, currentStaff]);

  // Master Admin Recycle Bin (All Soft-Deleted Records)
  const deletedItems = useMemo(() => {
    return mergedDatabaseCustomers.filter((c) => Boolean(c.isDeleted));
  }, [mergedDatabaseCustomers]);

  // Restore handler
  const handleRestore = async (ids: string[]) => {
    if (onRestoreCustomers) {
      await onRestoreCustomers(ids);
    } else {
      for (const id of ids) {
        await restoreCustomerInSupabase(id);
      }
    }
    await refreshData();
  };

  // Hard delete handler with database purge
  const handleHardDelete = async (ids: string[]) => {
    if (onHardDeleteCustomers) {
      await onHardDeleteCustomers(ids);
    } else {
      await hardDeleteCustomersInSupabase(ids);
    }
    await refreshData();
    setSelectedIds([]);
  };

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

  // Filtered dataset for currently active tab
  const filteredDataset = useMemo(() => {
    const safeLower = (val: unknown) => String(val ?? '').toLowerCase();

    // For leads: Direct global fetch from Supabase. No date-range or session isolation filters.
    if (activeTab === 'leads') {
      let result = leads;
      if (filterRep !== 'all') {
        result = result.filter((item) => item.salesRep === filterRep);
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        result = result.filter((item) => {
          const matchName = safeLower(item.fullName).includes(q);
          const matchEmail = safeLower(item.email).includes(q);
          const matchPhone =
            safeLower(item.phone).includes(q) ||
            (item.activatedPhone ? safeLower(item.activatedPhone).includes(q) : false);
          const matchId = safeLower(item.id).includes(q);
          const matchPlan = safeLower(item.preferredPlanName).includes(q);
          const matchRep = safeLower(item.salesRep).includes(q);
          return matchName || matchEmail || matchPhone || matchId || matchPlan || matchRep;
        });
      }
      return result;
    }

    let source: CustomerRecord[] = [];
    if (activeTab === 'active_lines') source = activeLines;
    else if (activeTab === 'non_active_lines') source = nonActiveLines;
    else source = rbacAccessibleCustomers;

    return source.filter((item) => {
      // Rep filter
      if (filterRep !== 'all' && item.salesRep !== filterRep) {
        return false;
      }

      // Date Range Filter for Active Lines, Non-Active Lines
      if (activeTab === 'active_lines' || activeTab === 'non_active_lines') {
        const refDate =
          activeTab === 'active_lines'
            ? item.activationStartDate || item.submittedAt
            : item.deactivationDate || item.activationStartDate || item.submittedAt;

        if (typeof refDate === 'string' && refDate.length >= 7) {
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
        const matchName = safeLower(item.fullName).includes(q);
        const matchEmail = safeLower(item.email).includes(q);
        const matchPhone =
          safeLower(item.phone).includes(q) ||
          (item.activatedPhone ? safeLower(item.activatedPhone).includes(q) : false);
        const matchId = safeLower(item.id).includes(q);
        const matchPlan = safeLower(item.preferredPlanName).includes(q);
        const matchRep = safeLower(item.salesRep).includes(q);
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

  // Row Selection Helpers
  const handleToggleSelectLead = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleToggleSelectAllLeads = useCallback((visibleLeadIds: string[]) => {
    setSelectedIds((prev) => {
      const allSelected =
        visibleLeadIds.length > 0 && visibleLeadIds.every((id) => prev.includes(id));
      return allSelected ? [] : visibleLeadIds;
    });
  }, []);

  // Bulk Delete Selected Leads
  const handleBulkDeleteLeads = async () => {
    const idsToDelete = selectedIds.filter(Boolean);
    if (idsToDelete.length === 0) return;

    const count = idsToDelete.length;
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${count} record${count === 1 ? '' : 's'} from Airwireless?`
    );
    if (!confirmed) return;

    setIsBulkProcessing(true);
    setBulkActionNotice(null);
    setDbFetchError(null);

    try {
      const { error } = await supabase
        .from('Airwireless')
        .delete()
        .in('id', idsToDelete);

      if (error) {
        console.error('Supabase bulk delete error on Airwireless:', error);
        const msg = error.message || 'Failed to delete selected leads from Supabase.';
        setDbFetchError(msg);
        setBulkActionNotice({ type: 'error', message: `Delete failed: ${msg}` });
        return;
      }

      await refreshData();
      setSelectedIds([]);
      setBulkActionNotice({
        type: 'success',
        message: `Successfully deleted ${count} record${count === 1 ? '' : 's'} from Airwireless.`,
      });
    } catch (err: any) {
      console.error('Exception during bulk delete:', err);
      const msg = err?.message || 'Unexpected error deleting leads.';
      setDbFetchError(msg);
      setBulkActionNotice({ type: 'error', message: `Delete failed: ${msg}` });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Single-Row Permanent Delete (.delete().eq('id', leadId))
  const handleDeleteLead = async (record: CustomerRecord) => {
    const leadId = record?.id;
    if (!leadId) {
      setBulkActionNotice({ type: 'error', message: 'Cannot delete record: missing primary key id.' });
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${record.fullName} from Airwireless?`
    );
    if (!confirmed) return;

    setIsBulkProcessing(true);
    setBulkActionNotice(null);
    setDbFetchError(null);

    try {
      const { error } = await supabase
        .from('Airwireless')
        .delete()
        .eq('id', leadId);

      if (error) {
        console.error('Supabase single delete error on Airwireless:', error);
        const msg = error.message || 'Failed to delete record from Supabase.';
        setDbFetchError(msg);
        setBulkActionNotice({ type: 'error', message: `Delete failed: ${msg}` });
        return;
      }

      await refreshData();
      setSelectedIds([]);
      setBulkActionNotice({
        type: 'success',
        message: `Deleted ${record.fullName} from Airwireless.`,
      });
    } catch (err: any) {
      console.error('Exception during single delete:', err);
      const msg = err?.message || 'Unexpected error deleting record.';
      setDbFetchError(msg);
      setBulkActionNotice({ type: 'error', message: `Delete failed: ${msg}` });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Bulk Assign Selected Leads (.update({ sales_rep }).in('id', ids))
  const handleBulkAssignLeads = async (selectedRep: string) => {
    const idsToAssign = selectedIds.filter(Boolean);
    if (idsToAssign.length === 0 || !selectedRep) return;

    const count = idsToAssign.length;
    setIsBulkProcessing(true);
    setBulkActionNotice(null);
    setDbFetchError(null);

    try {
      const { error } = await supabase
        .from('Airwireless')
        .update({ sales_rep: selectedRep })
        .in('id', idsToAssign);

      if (error) {
        console.error('Supabase bulk assign error on Airwireless:', error);
        const msg = error.message || 'Failed to assign selected leads in Supabase.';
        setDbFetchError(msg);
        setBulkActionNotice({ type: 'error', message: `Assign failed: ${msg}` });
        return;
      }

      await refreshData();
      setSelectedIds([]);
      setBulkActionNotice({
        type: 'success',
        message: `Assigned ${count} lead${count === 1 ? '' : 's'} to ${selectedRep}.`,
      });
    } catch (err: any) {
      console.error('Exception during bulk assign:', err);
      const msg = err?.message || 'Unexpected error assigning leads.';
      setDbFetchError(msg);
      setBulkActionNotice({ type: 'error', message: `Assign failed: ${msg}` });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Single-Row Assign Staff (.update({ sales_rep: repName }).eq('id', leadId))
  const handleAssignLead = async (leadId: string, repName: string) => {
    if (!leadId || !repName) return;
    setIsBulkProcessing(true);
    setBulkActionNotice(null);
    setDbFetchError(null);

    try {
      const { error } = await supabase
        .from('Airwireless')
        .update({ sales_rep: repName })
        .eq('id', leadId);

      if (error) {
        console.error('Supabase single lead assign error on Airwireless:', error);
        const msg = error.message || 'Failed to update sales_rep in Supabase.';
        setDbFetchError(msg);
        setBulkActionNotice({ type: 'error', message: `Assign failed: ${msg}` });
        return;
      }

      await refreshData();
      setSelectedIds([]);
      setBulkActionNotice({
        type: 'success',
        message: `Assigned record to ${repName}.`,
      });
    } catch (err: any) {
      console.error('Exception during single assign:', err);
      const msg = err?.message || 'Unexpected error assigning rep.';
      setDbFetchError(msg);
      setBulkActionNotice({ type: 'error', message: `Assign failed: ${msg}` });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Column-safe status updater targeting Airwireless by primary key `id`
  const updateAirwirelessStatusColumn = async (
    leadId: string,
    targetValue: string,
    mode: 'lifecycle' | 'followup'
  ) => {
    const cols = airwirelessColumnsRef.current;
    const isColumnError = (err: any) =>
      Boolean(
        err &&
          (err.code === '42703' ||
            err.code === 'PGRST204' ||
            err.message?.toLowerCase().includes('column'))
      );

    if (mode === 'followup') {
      const preferLeadFollowUp =
        cols.has('lead_follow_up_status') && !cols.has('follow_up_status');
      const primaryCol = preferLeadFollowUp ? 'lead_follow_up_status' : 'follow_up_status';
      const fallbackCol = preferLeadFollowUp ? 'follow_up_status' : 'lead_follow_up_status';

      let res = await supabase
        .from('Airwireless')
        .update({ [primaryCol]: targetValue })
        .eq('id', leadId);

      if (isColumnError(res.error)) {
        res = await supabase
          .from('Airwireless')
          .update({ [fallbackCol]: targetValue })
          .eq('id', leadId);
      }
      return res;
    }

    // Lifecycle update ('Active' | 'Non-Active' | 'lead')
    // Primary target: follow_up_status, syncing status column if present in schema
    const payload: Record<string, any> = {};
    if (cols.size === 0 || cols.has('follow_up_status')) {
      payload.follow_up_status = targetValue;
    }
    if (cols.has('status')) {
      payload.status = targetValue;
    }
    if (Object.keys(payload).length === 0) {
      payload.follow_up_status = targetValue;
    }

    let res = await supabase
      .from('Airwireless')
      .update(payload)
      .eq('id', leadId);

    if (isColumnError(res.error)) {
      res = await supabase
        .from('Airwireless')
        .update({ follow_up_status: targetValue })
        .eq('id', leadId);

      if (isColumnError(res.error)) {
        res = await supabase
          .from('Airwireless')
          .update({ status: targetValue })
          .eq('id', leadId);
      }
    }

    return res;
  };

  // Single-Row Follow-Up Status Update (.update({ follow_up_status: newStatus }).eq('id', leadId))
  const handleUpdateLeadStatus = async (leadId: string, newStatus: LeadFollowUpStatus) => {
    if (!leadId) return;
    setIsBulkProcessing(true);
    setBulkActionNotice(null);
    setDbFetchError(null);

    try {
      const { error } = await updateAirwirelessStatusColumn(leadId, newStatus, 'followup');

      if (error) {
        console.error('Supabase lead follow-up status update error on Airwireless:', error);
        const msg = error.message || 'Failed to update follow-up status in Supabase.';
        setDbFetchError(msg);
        setBulkActionNotice({ type: 'error', message: `Status update failed: ${msg}` });
        return;
      }

      await refreshData();
      setSelectedIds([]);
    } catch (err: any) {
      console.error('Exception updating lead follow-up status:', err);
      const msg = err?.message || 'Unexpected error updating lead status.';
      setDbFetchError(msg);
      setBulkActionNotice({ type: 'error', message: `Status update failed: ${msg}` });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Activate Line (.update({ follow_up_status: 'Active' }).eq('id', leadId))
  const handleQuickActivate = async (lead: CustomerRecord) => {
    const leadId = lead?.id;
    if (!leadId) {
      setBulkActionNotice({ type: 'error', message: 'Cannot activate: missing primary key id.' });
      return;
    }

    setIsBulkProcessing(true);
    setBulkActionNotice(null);
    setDbFetchError(null);

    try {
      const { error } = await updateAirwirelessStatusColumn(leadId, 'Active', 'lifecycle');

      if (error) {
        console.error('Supabase Activate Line error on Airwireless:', error);
        const msg = error.message || 'Failed to activate line in Supabase.';
        setDbFetchError(msg);
        setBulkActionNotice({ type: 'error', message: `Activate failed: ${msg}` });
        return;
      }

      await refreshData();
      setSelectedIds([]);
      setBulkActionNotice({
        type: 'success',
        message: `${lead.fullName} activated and moved to Active Lines.`,
      });
    } catch (err: any) {
      console.error('Exception activating line:', err);
      const msg = err?.message || 'Unexpected error activating line.';
      setDbFetchError(msg);
      setBulkActionNotice({ type: 'error', message: `Activate failed: ${msg}` });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Move to Non-Active (.update({ follow_up_status: 'Non-Active' }).eq('id', leadId))
  const handleDeactivateLine = async (record: CustomerRecord) => {
    const leadId = record?.id;
    if (!leadId) {
      setBulkActionNotice({ type: 'error', message: 'Cannot move to Non-Active: missing primary key id.' });
      return;
    }

    setIsBulkProcessing(true);
    setBulkActionNotice(null);
    setDbFetchError(null);

    try {
      const { error } = await updateAirwirelessStatusColumn(leadId, 'Non-Active', 'lifecycle');

      if (error) {
        console.error('Supabase Non-Active update error on Airwireless:', error);
        const msg = error.message || 'Failed to move line to Non-Active in Supabase.';
        setDbFetchError(msg);
        setBulkActionNotice({ type: 'error', message: `Move to Non-Active failed: ${msg}` });
        return;
      }

      await refreshData();
      setSelectedIds([]);
      setBulkActionNotice({
        type: 'success',
        message: `${record.fullName} moved to Non-Active Lines.`,
      });
    } catch (err: any) {
      console.error('Exception moving line to Non-Active:', err);
      const msg = err?.message || 'Unexpected error moving line to Non-Active.';
      setDbFetchError(msg);
      setBulkActionNotice({ type: 'error', message: `Move to Non-Active failed: ${msg}` });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Wrapper for saving customer profile edits with automatic Supabase Airwireless sync & refresh
  const handleModalSaveCustomer = async (id: string, updates: Partial<CustomerRecord>) => {
    if (!id) return;
    setBulkActionNotice(null);
    setDbFetchError(null);

    const cols = airwirelessColumnsRef.current;
    const leadPayload: Record<string, any> = {};
    if (updates.firstName !== undefined) leadPayload.first_name = updates.firstName;
    if (updates.lastName !== undefined) leadPayload.last_name = updates.lastName;
    if (updates.fullName !== undefined) leadPayload.full_name = updates.fullName;
    if (updates.email !== undefined) leadPayload.email = updates.email;
    if (updates.phone !== undefined) leadPayload.phone = updates.phone;
    if (updates.preferredPlanName !== undefined) leadPayload.preferred_plan_name = updates.preferredPlanName;
    if (updates.preferredPlanId !== undefined) leadPayload.preferred_plan_id = updates.preferredPlanId;
    if (updates.notes !== undefined) leadPayload.notes = updates.notes;
    if (updates.salesRep !== undefined) leadPayload.sales_rep = updates.salesRep;
    if (updates.status !== undefined) {
      const dbStatus = toAirwirelessDbStatus(updates.status);
      if (cols.size === 0 || cols.has('follow_up_status')) {
        leadPayload.follow_up_status = dbStatus;
      }
      if (cols.has('status')) {
        leadPayload.status = dbStatus;
      }
    }

    if (Object.keys(leadPayload).length > 0) {
      let res = await supabase
        .from('Airwireless')
        .update(leadPayload)
        .eq('id', id);

      if (
        res.error &&
        (res.error.code === '42703' ||
          res.error.code === 'PGRST204' ||
          res.error.message?.toLowerCase().includes('column'))
      ) {
        const { follow_up_status: _f, ...withoutFollowUp } = leadPayload;
        if (updates.status !== undefined && withoutFollowUp.status === undefined) {
          withoutFollowUp.status = toAirwirelessDbStatus(updates.status);
        }
        res = await supabase
          .from('Airwireless')
          .update(withoutFollowUp)
          .eq('id', id);
      }

      if (res.error) {
        console.error('Supabase modal save error on Airwireless:', res.error);
        const msg = res.error.message || 'Failed to save changes to Supabase.';
        setDbFetchError(msg);
        setBulkActionNotice({ type: 'error', message: `Save failed: ${msg}` });
        return;
      }
    }

    onSaveCustomer(id, updates);
    await refreshData();
    setSelectedIds([]);
  };

  // Wrapper for deleting customer/lead from profile modal with automatic Supabase sync & refresh
  const handleModalDeleteCustomer = async (id: string) => {
    if (!id) return;
    setBulkActionNotice(null);
    setDbFetchError(null);

    const { error } = await supabase
      .from('Airwireless')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase modal delete error on Airwireless:', error);
      const msg = error.message || 'Failed to delete record from Supabase.';
      setDbFetchError(msg);
      setBulkActionNotice({ type: 'error', message: `Delete failed: ${msg}` });
      return;
    }

    onDeleteCustomer(id);
    await refreshData();
    setSelectedIds([]);
  };

  // Wrapper for adding a manual lead/line directly to Airwireless with automatic refresh
  const handleModalAddCustomer = async (customer: CustomerRecord) => {
    setBulkActionNotice(null);
    setDbFetchError(null);

    const cols = airwirelessColumnsRef.current;
    const dbStatus = toAirwirelessDbStatus(customer.status);
    const insertPayload: Record<string, any> = {
      first_name: customer.firstName,
      last_name: customer.lastName,
      full_name: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      preferred_plan_id: customer.preferredPlanId,
      preferred_plan_name: customer.preferredPlanName,
      monthly_plan_price: customer.monthlyPlanPrice,
      sales_rep: customer.salesRep || 'Unassigned',
      referral_source: customer.referralSource || 'Manual CRM Entry',
      notes: customer.notes || '',
    };

    if (cols.size === 0 || cols.has('follow_up_status')) {
      insertPayload.follow_up_status = dbStatus;
    }
    if (cols.size === 0 || cols.has('status')) {
      insertPayload.status = dbStatus;
    }

    let { error } = await supabase.from('Airwireless').insert([insertPayload]);

    if (
      error &&
      (error.code === '42703' ||
        error.code === 'PGRST204' ||
        error.message?.toLowerCase().includes('column'))
    ) {
      const { follow_up_status: _f, ...withoutFollowUp } = insertPayload;
      if (withoutFollowUp.status === undefined) {
        withoutFollowUp.status = dbStatus;
      }
      const fallbackRes = await supabase.from('Airwireless').insert([withoutFollowUp]);
      error = fallbackRes.error;
    }

    if (error) {
      console.error('Supabase add record error on Airwireless:', error);
      const msg = error.message || 'Failed to add record to Supabase.';
      setDbFetchError(msg);
      setBulkActionNotice({ type: 'error', message: `Add record failed: ${msg}` });
      return;
    }

    onAddCustomer(customer);
    await refreshData();
    setSelectedIds([]);
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
        onNavigateToPublic={onNavigateToPublic}
        staffMembers={staffMembers}
        currentStaff={currentStaff}
        onSelectStaff={onSelectStaff}
        leadsCount={leads.length}
        activeLinesCount={activeLines.length}
        nonActiveLinesCount={nonActiveLines.length}
        clawbacksCount={clawbackAccounts.length}
        totalCommissionsPaid={totalCommissionsPaid}
        clawbackAlertsCount={clawbackAccounts.length}
        onOpenClawbackView={() => handleTabChange('commissions')}
      />

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Navigation Tabs Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          
          {/* Main Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl overflow-x-auto">
            
            {/* 1. Leads View */}
            <button
              type="button"
              onClick={() => handleTabChange('leads')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
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
              type="button"
              onClick={() => handleTabChange('active_lines')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
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
              type="button"
              onClick={() => handleTabChange('non_active_lines')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
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
                type="button"
                onClick={() => handleTabChange('residuals')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
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
              type="button"
              onClick={() => handleTabChange('commissions')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
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
                type="button"
                onClick={() => handleTabChange('staff')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
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
                type="button"
                onClick={() => handleTabChange('cms')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'cms'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Settings2 className="h-4 w-4 text-emerald-700" />
                <span>CMS & Plans Editor</span>
              </button>
            )}

            {/* 8. Master Admin Recycle Bin (Deleted Items) */}
            {isMasterAdmin && (
              <button
                type="button"
                onClick={() => handleTabChange('deleted_items')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'deleted_items'
                    ? 'bg-rose-50 text-rose-950 border border-rose-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Trash2 className="h-4 w-4 text-rose-600" />
                <span>Recycle Bin</span>
                {deletedItems.length > 0 && (
                  <span className="rounded-full bg-rose-600 text-white font-extrabold text-[10px] px-1.5 py-0.2">
                    {deletedItems.length}
                  </span>
                )}
              </button>
            )}

          </div>

          {/* Quick Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Excel Export Module (Strictly Locked to Master Admin Exclusive) */}
            {isMasterAdmin && (
              <button
                type="button"
                onClick={() => setIsExcelExportModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50/90 hover:bg-emerald-100 px-3.5 py-2 text-xs font-bold text-emerald-950 transition-colors shadow-2xs cursor-pointer"
                title="Excel Export Module (.xlsx) - Master Admin Exclusive"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
                <span>Export to Excel</span>
                <span className="rounded bg-emerald-200 text-emerald-900 font-extrabold text-[9px] px-1.5 py-0.2 border border-emerald-300/80">
                  .xlsx
                </span>
              </button>
            )}

            {/* Refresh Leads Button (Direct Airwireless Supabase fetch) */}
            {(activeTab === 'leads' || activeTab === 'active_lines' || activeTab === 'non_active_lines') && (
              <button
                type="button"
                onClick={refreshData}
                disabled={isRefreshingLeads}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-60 px-3.5 py-2 text-xs font-bold text-white transition-colors shadow-2xs cursor-pointer"
                title="Fetch latest cross-device records directly from Airwireless table in Supabase"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingLeads ? 'animate-spin' : ''}`} />
                <span>{isRefreshingLeads ? 'Refreshing...' : 'Refresh Leads'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#0F3E2E] hover:bg-[#14533D] px-3.5 py-2 text-xs font-bold text-white transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Lead / Line</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset database to initial sample records (leads, active lines, and clawbacks)?')) {
                  onResetData();
                }
              }}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Reset Sample Data"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>

        {/* Global Standardized Date Range Selector for Active Lines, Non-Active Lines */}
        {(activeTab === 'active_lines' || activeTab === 'non_active_lines') && (
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
              activeTab === 'active_lines'
                ? activeLines.length
                : nonActiveLines.length
            }
            filteredCount={filteredDataset.length}
            label={
              activeTab === 'active_lines'
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

        {/* View Content based on active tab (isolated with ErrorBoundary so navigation is never blocked) */}
        <CrmErrorBoundary
          resetKey={activeTab}
          sectionLabel="Staff Portal View"
          onRetry={refreshData}
          fallbackActionLabel="Back to Leads"
          onFallbackAction={() => handleTabChange('leads')}
        >
          {activeTab === 'leads' && (
            <LeadsTable
              leads={filteredDataset}
              staffMembers={staffMembers}
              currentStaff={currentStaff}
              onOpenCustomer={(customer) => setSelectedCustomer(customer)}
              onUpdateStatus={handleUpdateLeadStatus}
              onQuickActivate={handleQuickActivate}
              onDeactivateLead={handleDeactivateLine}
              onDeleteLead={handleDeleteLead}
              onAssignLead={handleAssignLead}
              onRefreshLeads={refreshData}
              isRefreshing={isRefreshingLeads}
              lastRefreshedAt={lastRefreshedAt}
              dbFetchError={dbFetchError}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelectLead}
              onToggleSelectAll={handleToggleSelectAllLeads}
              onClearSelection={() => setSelectedIds([])}
              onBulkDelete={handleBulkDeleteLeads}
              onBulkAssign={handleBulkAssignLeads}
              isBulkProcessing={isBulkProcessing}
              bulkActionNotice={bulkActionNotice}
              onDismissNotice={() => setBulkActionNotice(null)}
            />
          )}

          {activeTab === 'active_lines' && (
            <LinesTable
              lines={filteredDataset}
              type="active"
              isMasterAdmin={isMasterAdmin}
              staffMembers={staffMembers}
              onOpenCustomer={(customer) => setSelectedCustomer(customer)}
              onActivateLine={handleQuickActivate}
              onDeactivateLine={handleDeactivateLine}
              onDeleteLine={handleDeleteLead}
              onAssignLead={handleAssignLead}
              isProcessing={isBulkProcessing}
              actionNotice={bulkActionNotice}
              onDismissNotice={() => setBulkActionNotice(null)}
            />
          )}

          {activeTab === 'non_active_lines' && (
            <LinesTable
              lines={filteredDataset}
              type="non_active"
              isMasterAdmin={isMasterAdmin}
              staffMembers={staffMembers}
              onOpenCustomer={(customer) => setSelectedCustomer(customer)}
              onActivateLine={handleQuickActivate}
              onDeactivateLine={handleDeactivateLine}
              onDeleteLine={handleDeleteLead}
              onAssignLead={handleAssignLead}
              isProcessing={isBulkProcessing}
              actionNotice={bulkActionNotice}
              onDismissNotice={() => setBulkActionNotice(null)}
            />
          )}

          {activeTab === 'residuals' && isMasterAdmin && (
            <ResidualEngine
              customers={mergedDatabaseCustomers}
              isMasterAdmin={isMasterAdmin}
              currentStaffName={currentStaff.name}
              onRefreshData={refreshData}
            />
          )}

          {activeTab === 'commissions' && (
            <ClawbackTracker
              customers={mergedDatabaseCustomers}
              staffMembers={staffMembers}
              currentStaff={currentStaff}
              onOpenCustomer={(customer) => setSelectedCustomer(customer)}
              onUpdateCommissionStatus={handleUpdateCommissionStatus}
              onUpdateCustomers={onUpdateCustomers}
              onUpdateStaffList={onUpdateStaffList}
            />
          )}

          {activeTab === 'staff' && isMasterAdmin && (
            <StaffManagement
              staffMembers={staffMembers}
              currentStaff={currentStaff}
              customers={mergedDatabaseCustomers}
              onUpdateCustomers={onUpdateCustomers}
              onUpdateStaffList={onUpdateStaffList || ((l) => TelecomStorage.saveStaff(l))}
            />
          )}

          {activeTab === 'cms' && (isMasterAdmin || currentStaff.role === 'admin') && (
            <CmsEditor
              cms={cms}
              plans={plans}
              onSaveCms={onSaveCms}
              onSavePlans={onSavePlans}
              onPreviewSite={onNavigateToPublic || onBackToLanding}
            />
          )}

          {activeTab === 'deleted_items' && isMasterAdmin && (
            <DeletedItemsView
              deletedItems={deletedItems}
              onRestore={handleRestore}
              onHardDelete={handleHardDelete}
              masterAdminPassword={currentStaff.password || 'AdminTemp2026!'}
            />
          )}
        </CrmErrorBoundary>

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
          onSave={handleModalSaveCustomer}
          onDelete={handleModalDeleteCustomer}
        />
      )}

      {/* New Customer / Lead Modal */}
      {isNewModalOpen && (
        <NewCustomerModal
          plans={plans}
          staffMembers={staffMembers}
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onAdd={handleModalAddCustomer}
        />
      )}

      {/* Excel Export Module (Admin Exclusive) */}
      <ExcelExportModal
        isOpen={isExcelExportModalOpen}
        onClose={() => setIsExcelExportModalOpen(false)}
        customers={mergedDatabaseCustomers}
        staffMembers={staffMembers}
        isMasterAdmin={isMasterAdmin}
      />

    </div>
  );
};
