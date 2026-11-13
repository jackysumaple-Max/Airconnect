import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  User,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Calendar,
  DollarSign,
  Tag,
  Save,
  CheckCircle,
  Clock,
  Trash2,
  Zap,
} from 'lucide-react';
import { CustomerRecord, Plan, StaffRep, CustomerStatus, CommissionStatus, IdVerificationStatus } from '../../types/telecom';
import { calculateDaysBetween, evaluateClawbackRisk, calculateCommissionForPlanAndRep } from '../../services/telecomStorage';

interface CustomerProfileModalProps {
  customer: CustomerRecord | null;
  plans: Plan[];
  staffMembers: StaffRep[];
  isOpen: boolean;
  isMasterAdmin?: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<CustomerRecord>) => void;
  onDelete: (id: string) => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  customer,
  plans,
  staffMembers,
  isOpen,
  isMasterAdmin = false,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen || !customer) return null;

  // Local form state
  const [status, setStatus] = useState<CustomerStatus>(customer.status);
  const [firstName, setFirstName] = useState(customer.firstName);
  const [lastName, setLastName] = useState(customer.lastName);
  const [email, setEmail] = useState(customer.email);
  const [phone, setPhone] = useState(customer.phone);
  const [activatedPhone, setActivatedPhone] = useState(customer.activatedPhone || customer.phone);
  const [preferredPlanId, setPreferredPlanId] = useState(customer.preferredPlanId);
  const [salesRep, setSalesRep] = useState(customer.salesRep);
  const [referralSource, setReferralSource] = useState(customer.referralSource || '');
  const [notes, setNotes] = useState(customer.notes || '');

  // Line info
  const [simType, setSimType] = useState<'eSIM' | 'Physical SIM'>(customer.simType || 'eSIM');
  const [activationStartDate, setActivationStartDate] = useState(customer.activationStartDate || '');
  const [deactivationDate, setDeactivationDate] = useState(
    customer.deactivationDate || new Date().toISOString().split('T')[0]
  );
  const [imeiOrSimNumber, setImeiOrSimNumber] = useState(customer.imeiOrSimNumber || '');

  // Address
  const [street, setStreet] = useState(customer.address?.street || '');
  const [city, setCity] = useState(customer.address?.city || '');
  const [province, setProvince] = useState(customer.address?.province || 'ON');
  const [postalCode, setPostalCode] = useState(customer.address?.postalCode || '');

  // ID Verification
  const [idStatus, setIdStatus] = useState<IdVerificationStatus>(customer.idVerification?.status || 'unverified');
  const [idType, setIdType] = useState(customer.idVerification?.idType || 'Driver License');
  const [idNumberMasked, setIdNumberMasked] = useState(customer.idVerification?.idNumberMasked || '');
  const [idNotes, setIdNotes] = useState(customer.idVerification?.notes || '');

  // Commission & Chargeback
  const [commissionAmount, setCommissionAmount] = useState<number>(customer.commission?.amount || 55);
  const [commissionStatus, setCommissionStatus] = useState<CommissionStatus>(customer.commission?.status || 'pending');
  const [payoutDate, setPayoutDate] = useState(customer.commission?.payoutDate || '');

  // Track save notifications
  const [savedNotice, setSavedNotice] = useState(false);

  // Real-time calculation of days active and clawback condition
  const daysActive = activationStartDate
    ? calculateDaysBetween(activationStartDate, status === 'non_active_line' ? deactivationDate : undefined)
    : 0;

  const isWithin180Days = activationStartDate ? daysActive <= 180 : false;
  const isChargebackTriggered = status === 'non_active_line' && isWithin180Days && Boolean(activationStartDate);

  // Auto-flag commission as clawback if status switched to non_active_line within 180 days
  useEffect(() => {
    if (status === 'non_active_line' && isWithin180Days && Boolean(activationStartDate)) {
      if (commissionStatus !== 'clawback') {
        setCommissionStatus('clawback');
      }
    }
  }, [status, isWithin180Days, activationStartDate]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedPlan = plans.find((p) => p.id === preferredPlanId);

    const updates: Partial<CustomerRecord> = {
      status,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      email,
      phone,
      activatedPhone,
      preferredPlanId,
      preferredPlanName: selectedPlan ? `${selectedPlan.name} ($${selectedPlan.monthlyPrice}/mo)` : customer.preferredPlanName,
      salesRep,
      referralSource,
      notes,
      simType,
      activationStartDate: activationStartDate || undefined,
      deactivationDate: status === 'non_active_line' ? deactivationDate : undefined,
      imeiOrSimNumber,
      address: {
        street,
        city,
        province,
        postalCode,
      },
      idVerification: {
        status: idStatus,
        idType: idType as any,
        idNumberMasked,
        verifiedBy: idStatus === 'verified' ? salesRep : undefined,
        verifiedAt: idStatus === 'verified' ? new Date().toISOString() : undefined,
        notes: idNotes,
      },
      commission: {
        amount: Number(commissionAmount) || 0,
        status: commissionStatus,
        payoutDate: payoutDate || undefined,
        isClawbackFlagged: isChargebackTriggered,
        daysActiveBeforeCancel: status === 'non_active_line' ? daysActive : undefined,
        multiplierUsed: staffMembers.find((s) => s.name === salesRep)?.commissionMultiplier || customer.commission?.multiplierUsed || 1.0,
        clawbackTriggeredAt: isChargebackTriggered ? new Date().toISOString() : undefined,
        clawbackReason: isChargebackTriggered
          ? `Automated 180-day chargeback: Line canceled at ${daysActive} days (under 180-day threshold). Commission clawback flagged for sales rep ${salesRep} ($${Number(commissionAmount).toFixed(2)}).`
          : undefined,
      },
    };

    onSave(customer.id, updates);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 700);
  };

  const handleQuickActivate = () => {
    const today = new Date().toISOString().split('T')[0];
    setStatus('active_line');
    setActivationStartDate(today);
    if (!activatedPhone) setActivatedPhone(phone);
    if (idStatus === 'unverified') setIdStatus('verified');
    if (commissionStatus === 'pending') setCommissionStatus('paid');
    setPayoutDate(today);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#0F3E2E] p-2 text-white">
              <User className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  {customer.fullName}
                </h3>
                <span className="font-mono text-xs text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                  {customer.id}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Created: {new Date(customer.submittedAt).toLocaleDateString()} · Source: {customer.referralSource || 'Direct'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedNotice && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md animate-fade-in">
                ✓ Changes Saved
              </span>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-6 flex-1">
          
          {/* Status Bar & Quick Actions */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Customer Lifecycle Status <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                {(['lead', 'active_line', 'non_active_line'] as CustomerStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setStatus(st);
                      if (st === 'active_line' && !activationStartDate) {
                        setActivationStartDate(new Date().toISOString().split('T')[0]);
                      }
                      if (st === 'non_active_line' && !customer.deactivationDate) {
                        setDeactivationDate(new Date().toISOString().split('T')[0]);
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                      status === st
                        ? st === 'active_line'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : st === 'non_active_line'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'lead' ? 'Inbound Lead' : st === 'active_line' ? 'Active Line' : 'Non-Active Line (Canceled)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick action: Convert Lead to Active Line */}
            {status === 'lead' && (
              <button
                type="button"
                onClick={handleQuickActivate}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Activate Line Now</span>
              </button>
            )}
          </div>

          {/* CRITICAL: Automated 180-Day Chargeback Alert Box */}
          {isChargebackTriggered && (
            <div className="rounded-2xl border-2 border-rose-400 bg-rose-50 p-4 text-rose-900 shadow-sm animate-pulse-once">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-extrabold text-rose-900">
                      AUTOMATED CHARGEBACK FLAGGED (Under 180 Days)
                    </h4>
                    <span className="rounded bg-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                      Day {daysActive} of 180
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    This customer line was active for only <strong>{daysActive} days</strong>, which is within the 6-month (180 days) minimum commitment period.
                    The system has automatically flagged this account for a commission clawback of <strong className="underline">${Number(commissionAmount).toFixed(2)}</strong> from sales rep <strong className="underline">{salesRep}</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* If non-active line but PAST 180 days */}
          {status === 'non_active_line' && !isWithin180Days && Boolean(activationStartDate) && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 flex items-center gap-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                <strong>No Clawback Required:</strong> Line was active for {daysActive} days (exceeds the 180-day chargeback requirement). Sales rep keeps their commission.
              </span>
            </div>
          )}

          {/* 2-Column Grid: Personal Data vs Line Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* COLUMN 1: Personal Data & ID Verification */}
            <div className="space-y-5 rounded-2xl border border-slate-200 p-5 bg-white">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="h-4 w-4 text-emerald-700" />
                <h4 className="text-sm font-bold text-slate-900">Personal Information</h4>
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Address Fields */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. 450 Bay Street, Suite 1802"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Toronto"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Province</label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 bg-white"
                  >
                    {['ON', 'BC', 'AB', 'QC', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE', 'YT', 'NT', 'NU'].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    placeholder="M5H 2Y4"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 outline-none uppercase"
                  />
                </div>
              </div>

              {/* ID Verification Section */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <ShieldCheck className="h-4 w-4 text-emerald-700" />
                    <span>ID Verification Record</span>
                  </div>
                  <select
                    value={idStatus}
                    onChange={(e) => setIdStatus(e.target.value as IdVerificationStatus)}
                    className={`text-[11px] font-bold rounded-md px-2 py-1 border ${
                      idStatus === 'verified'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : idStatus === 'pending'
                        ? 'border-amber-300 bg-amber-50 text-amber-800'
                        : idStatus === 'failed'
                        ? 'border-rose-300 bg-rose-50 text-rose-800'
                        : 'border-slate-300 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <option value="unverified">Unverified</option>
                    <option value="pending">Pending Verification</option>
                    <option value="verified">Verified (Approved)</option>
                    <option value="failed">Failed / Flagged</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">ID Document Type</label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-800 bg-white"
                    >
                      <option value="Driver License">Driver's License (G/Class 5)</option>
                      <option value="Passport">Canadian / Int'l Passport</option>
                      <option value="PR Card">Permanent Resident Card</option>
                      <option value="Provincial ID">Provincial Photo ID</option>
                      <option value="Other">Other Government ID</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Masked ID Number</label>
                    <input
                      type="text"
                      placeholder="T1948-*****-9210"
                      value={idNumberMasked}
                      onChange={(e) => setIdNumberMasked(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">ID Verification Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Ontario G verified, selfie check matched."
                    value={idNotes}
                    onChange={(e) => setIdNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-700"
                  />
                </div>
              </div>

            </div>

            {/* COLUMN 2: Line Info, Sales Attribution & Commission */}
            <div className="space-y-5 rounded-2xl border border-slate-200 p-5 bg-white">
              
              {/* Line Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Phone className="h-4 w-4 text-emerald-700" />
                  <h4 className="text-sm font-bold text-slate-900">Line Information</h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Activated Phone #
                    </label>
                    <input
                      type="text"
                      value={activatedPhone}
                      onChange={(e) => setActivatedPhone(e.target.value)}
                      placeholder="(416) 555-0199"
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      SIM Provisioning
                    </label>
                    <select
                      value={simType}
                      onChange={(e) => setSimType(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 bg-white"
                    >
                      <option value="eSIM">eSIM (Electronic QR)</option>
                      <option value="Physical SIM">Physical SIM Card</option>
                    </select>
                  </div>
                </div>

                {/* Plan Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plan Type (Telus Network)
                  </label>
                  <select
                    value={preferredPlanId}
                    onChange={(e) => {
                      setPreferredPlanId(e.target.value);
                      const p = plans.find((item) => item.id === e.target.value);
                      if (p) {
                        const rep = staffMembers.find((s) => s.name === salesRep);
                        const mult = rep?.commissionMultiplier || 1.0;
                        setCommissionAmount(calculateCommissionForPlanAndRep(p.monthlyPrice, mult));
                      }
                    }}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 bg-white font-medium"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ${p.monthlyPrice}/mo ({p.dataAllowance})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Activation Start Date & Deactivation Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Activation Start Date
                    </label>
                    <input
                      type="date"
                      value={activationStartDate}
                      onChange={(e) => setActivationStartDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900"
                    />
                  </div>

                  {status === 'non_active_line' ? (
                    <div>
                      <label className="block text-xs font-semibold text-rose-700 mb-1">
                        Deactivation Date
                      </label>
                      <input
                        type="date"
                        value={deactivationDate}
                        onChange={(e) => setDeactivationDate(e.target.value)}
                        className="w-full rounded-lg border border-rose-300 px-3 py-1.5 text-xs text-rose-900 bg-rose-50/50"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Line Tenure
                      </label>
                      <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 font-medium">
                        {activationStartDate ? `${daysActive} Days Active` : 'Not yet activated'}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SIM / IMEI Serial Number
                  </label>
                  <input
                    type="text"
                    value={imeiOrSimNumber}
                    onChange={(e) => setImeiOrSimNumber(e.target.value)}
                    placeholder="890141032111..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Sales Attribution & Rep Assignment */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-emerald-700" />
                  <h4 className="text-sm font-bold text-slate-900">Sales Attribution</h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assigned Sales Rep <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={salesRep}
                      onChange={(e) => {
                        const newRep = e.target.value;
                        setSalesRep(newRep);
                        const rep = staffMembers.find((s) => s.name === newRep);
                        const mult = rep?.commissionMultiplier || 1.0;
                        const p = plans.find((item) => item.id === preferredPlanId);
                        if (p) {
                          setCommissionAmount(calculateCommissionForPlanAndRep(p.monthlyPrice, mult));
                        }
                      }}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 bg-white font-medium"
                    >
                      {staffMembers.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name} {isMasterAdmin ? `(${s.commissionMultiplier}x)` : ''}
                        </option>
                      ))}
                      <option value="Direct / Web">Direct / Web (Unassigned)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Lead Referral Source
                    </label>
                    <input
                      type="text"
                      value={referralSource}
                      onChange={(e) => setReferralSource(e.target.value)}
                      placeholder="e.g. Instagram, TikTok"
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Commission & Payout Tracker */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-700" />
                    <h4 className="text-sm font-bold text-slate-900">Commission & Payout Tracker</h4>
                  </div>

                  <span className={`text-[11px] font-extrabold uppercase px-2 py-0.5 rounded ${
                    commissionStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : commissionStatus === 'clawback'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {commissionStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dealer Commission ($)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs text-slate-400">$</span>
                      <input
                        type="number"
                        step="0.5"
                        value={commissionAmount}
                        onChange={(e) => setCommissionAmount(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg border border-slate-200 pl-6 pr-3 py-1.5 text-xs text-slate-900 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Commission Status Toggle
                    </label>
                    <select
                      value={commissionStatus}
                      onChange={(e) => setCommissionStatus(e.target.value as CommissionStatus)}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 bg-white font-bold"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="clawback">Clawback (Chargeback)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payout / Audit Date
                  </label>
                  <input
                    type="date"
                    value={payoutDate}
                    onChange={(e) => setPayoutDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>

                {/* Lifetime Monthly Residual Status (Master Admin Only) */}
                {isMasterAdmin && customer.residual && (
                  <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 p-2.5 text-[11px] text-emerald-950 flex items-center justify-between">
                    <div>
                      <span className="font-bold">Lifetime Monthly Residual:</span>
                      <div className="text-slate-600 text-[10px]">
                        Cohort {customer.residual.activationCohort} ({customer.residual.tierLabel})
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-emerald-800 text-xs">
                        {(customer.residual.lockedResidualRate * 100).toFixed(0)}% Locked
                      </span>
                      <div className="text-[10px] font-semibold text-emerald-700">
                        {status === 'active_line' ? `+$${customer.residual.monthlyResidualAmount.toFixed(2)}/mo` : '$0.00/mo (Canceled)'}
                      </div>
                    </div>
                  </div>
                )}

                {customer.commission?.clawbackReason && (
                  <div className="rounded-lg bg-slate-100 border border-slate-200 p-2.5 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-800">Chargeback Log:</span> {customer.commission.clawbackReason}
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Notes area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Internal Staff Notes & History
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add customer interaction notes, callback logs, or special instructions..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Modal Bottom Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {isMasterAdmin ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Permanently delete ${customer.fullName} from Airwireless?`)) {
                    onDelete(customer.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 p-2 rounded-lg hover:bg-rose-50 transition-colors font-medium"
                title="Master Admin Delete: Permanently deletes record from Airwireless"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Record</span>
              </button>
            ) : (
              <div className="text-[11px] text-slate-400 italic">
                {/* Deletion privileges revoked for Sales Reps */}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-[#0F3E2E] px-5 py-2 text-xs font-bold text-white hover:bg-[#14533D] transition-colors shadow-xs"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
