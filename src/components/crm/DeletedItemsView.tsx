import React, { useState, useMemo } from 'react';
import { CustomerRecord } from '../../types/telecom';
import {
  Trash2,
  RotateCcw,
  ShieldAlert,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  Clock,
  User,
  Phone,
  Mail,
  Shield,
} from 'lucide-react';
import { HardDeleteConfirmModal } from './HardDeleteConfirmModal';

interface DeletedItemsViewProps {
  deletedItems: CustomerRecord[];
  onRestore: (ids: string[]) => void;
  onHardDelete: (ids: string[]) => void;
  masterAdminPassword?: string;
}

export const DeletedItemsView: React.FC<DeletedItemsViewProps> = ({
  deletedItems,
  onRestore,
  onHardDelete,
  masterAdminPassword = 'AdminTemp2026!',
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHardDeleteModalOpen, setIsHardDeleteModalOpen] = useState(false);
  const [targetHardDeleteIds, setTargetHardDeleteIds] = useState<string[]>([]);

  // Filtered deleted items based on search query
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return deletedItems;
    const q = searchQuery.toLowerCase();
    return deletedItems.filter(
      (item) =>
        item.fullName?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.phone?.includes(q) ||
        item.salesRep?.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
    );
  }, [deletedItems, searchQuery]);

  // Select all logic
  const isAllSelected = filtered.length > 0 && selectedIds.length === filtered.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((item) => item.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Restore single or bulk
  const handleRestoreSelected = () => {
    if (selectedIds.length === 0) return;
    onRestore(selectedIds);
    setSelectedIds([]);
  };

  const handleRestoreSingle = (id: string) => {
    onRestore([id]);
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  // Hard delete single or bulk with password security modal
  const handleInitiateBulkHardDelete = () => {
    if (selectedIds.length === 0) return;
    setTargetHardDeleteIds(selectedIds);
    setIsHardDeleteModalOpen(true);
  };

  const handleInitiateSingleHardDelete = (id: string) => {
    setTargetHardDeleteIds([id]);
    setIsHardDeleteModalOpen(true);
  };

  const handleConfirmHardDelete = () => {
    onHardDelete(targetHardDeleteIds);
    setSelectedIds((prev) => prev.filter((id) => !targetHardDeleteIds.includes(id)));
    setTargetHardDeleteIds([]);
    setIsHardDeleteModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Alert */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-rose-950">
                Master Admin Recycle Bin & Soft-Deleted Items ({deletedItems.length})
              </h3>
              <span className="inline-flex items-center gap-1 rounded bg-rose-200/80 px-2 py-0.5 text-[10px] font-bold text-rose-900">
                <Shield className="h-3 w-3" /> Master Admin Exclusive
              </span>
            </div>
            <p className="mt-0.5 text-xs text-rose-800">
              Records deleted anywhere in the system are soft-deleted here. They can be restored with a
              single click or permanently purged with password authorization.
            </p>
          </div>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 animate-fade-in">
            <button
              type="button"
              onClick={handleRestoreSelected}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-3.5 py-2 text-xs font-bold text-white transition-colors shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restore Selected ({selectedIds.length})</span>
            </button>
            <button
              type="button"
              onClick={handleInitiateBulkHardDelete}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-3.5 py-2 text-xs font-bold text-white transition-colors shadow-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Permanently Delete ({selectedIds.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Toolbar & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deleted records by name, email, phone..."
            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:border-rose-400 outline-none"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800 font-bold">{filtered.length}</strong> deleted record{filtered.length !== 1 ? 's' : ''}
          </span>
          {selectedIds.length > 0 && (
            <span className="text-rose-600 font-bold">
              ({selectedIds.length} selected)
            </span>
          )}
        </div>
      </div>

      {/* Deleted Items Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-10">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    disabled={filtered.length === 0}
                    className="flex items-center text-slate-500 hover:text-slate-900 disabled:opacity-30"
                    title={isAllSelected ? 'Deselect All' : 'Select All'}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="h-4 w-4 text-rose-600" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Customer Record</th>
                <th className="py-3 px-4">Original Status</th>
                <th className="py-3 px-4">Plan & Value</th>
                <th className="py-3 px-4">Assigned Rep</th>
                <th className="py-3 px-4">Deleted When / By</th>
                <th className="py-3 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Trash2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">Recycle Bin is empty</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchQuery
                        ? 'No deleted records matched your search query.'
                        : 'Soft-deleted records will appear here for safe restoration or permanent hard delete.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const originalStatus = item.originalStatus || item.status;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-rose-50/30 transition-colors ${
                        isSelected ? 'bg-rose-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectOne(item.id)}
                          className="flex items-center text-slate-400 hover:text-slate-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-rose-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.fullName}</div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{item.phone || 'No phone'}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span>{item.email || 'No email'}</span>
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {originalStatus === 'lead' ? (
                          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                            Lead
                          </span>
                        ) : originalStatus === 'active_line' ? (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                            Active Line
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
                            Non-Active Line
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.preferredPlanName}</div>
                        <div className="text-[11px] font-mono text-emerald-800 font-bold">
                          ${item.monthlyPlanPrice}/mo
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{item.salesRep || 'Unassigned'}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-800">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>
                            {item.deletedAt
                              ? new Date(item.deletedAt).toLocaleDateString('en-CA', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Recently'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          By: {item.deletedBy || 'Master Admin'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRestoreSingle(item.id)}
                            className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
                            title="Restore record to original table"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Restore</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInitiateSingleHardDelete(item.id)}
                            className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition-colors shadow-2xs"
                            title="Hard delete record permanently with password verification"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Purge</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Hard Delete Confirmation Modal */}
      <HardDeleteConfirmModal
        isOpen={isHardDeleteModalOpen}
        recordCount={targetHardDeleteIds.length}
        onClose={() => setIsHardDeleteModalOpen(false)}
        onConfirm={handleConfirmHardDelete}
        expectedPassword={masterAdminPassword}
      />
    </div>
  );
};
