import React, { useState } from 'react';
import { X, UserPlus, Phone, Mail, User, Tag, Calendar, DollarSign, Zap } from 'lucide-react';
import { CustomerRecord, Plan, StaffRep, CustomerStatus } from '../../types/telecom';

interface NewCustomerModalProps {
  plans: Plan[];
  staffMembers: StaffRep[];
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newRecord: CustomerRecord) => void;
}

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  plans,
  staffMembers,
  isOpen,
  onClose,
  onAdd,
}) => {
  if (!isOpen) return null;

  const [status, setStatus] = useState<CustomerStatus>('lead');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredPlanId, setPreferredPlanId] = useState(plans[0]?.id || '');
  const [salesRep, setSalesRep] = useState(staffMembers[0]?.name || 'Aarav Patel');
  const [referralSource, setReferralSource] = useState('In-Store Walk-in / Phone Inbound');
  const [notes, setNotes] = useState('');
  const [activationStartDate, setActivationStartDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      alert('Please fill in customer name and phone number.');
      return;
    }

    const selectedPlan = plans.find((p) => p.id === preferredPlanId) || plans[0];
    const newId = status === 'lead' ? `LEAD-${Math.floor(1000 + Math.random() * 9000)}` : `ACT-${Math.floor(4000 + Math.random() * 5000)}`;

    const newRecord: CustomerRecord = {
      id: newId,
      status,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fullName: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim() || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@customer.ca`,
      phone: phone.trim(),
      activatedPhone: phone.trim(),
      preferredPlanId: selectedPlan.id,
      preferredPlanName: `${selectedPlan.name} ($${selectedPlan.monthlyPrice}/mo)`,
      monthlyPlanPrice: selectedPlan.monthlyPrice,
      salesRep,
      referralSource,
      submittedAt: new Date().toISOString(),
      activationStartDate: status === 'active_line' ? activationStartDate : undefined,
      simType: 'eSIM',
      notes: notes.trim() || 'Manual entry by staff.',
      leadFollowUpStatus: status === 'lead' ? 'new' : undefined,
      idVerification: {
        status: status === 'active_line' ? 'verified' : 'unverified',
        idType: 'Driver License',
        verifiedBy: status === 'active_line' ? salesRep : undefined,
      },
      commission: {
        amount: selectedPlan.commissionRate,
        status: status === 'active_line' ? 'paid' : 'pending',
        isClawbackFlagged: false,
        payoutDate: status === 'active_line' ? activationStartDate : undefined,
      },
      residual: status === 'active_line' ? {
        activationCohort: activationStartDate.substring(0, 7),
        lockedResidualRate: 0.07,
        monthlyResidualAmount: Number((selectedPlan.monthlyPrice * 0.07).toFixed(2)),
        tierLabel: 'Tier 1 (7%)',
      } : undefined,
    };

    onAdd(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-[#0F3E2E] p-2 text-white">
              <UserPlus className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Record New Customer or Lead
              </h3>
              <p className="text-xs text-slate-500">
                Manual entry for in-store walk-ins, phone callbacks, and dealer activations.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Status Segmented */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Entry Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('lead')}
                className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                  status === 'lead'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Inbound Lead (Pending Follow-up)
              </button>

              <button
                type="button"
                onClick={() => setStatus('active_line')}
                className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                  status === 'active_line'
                    ? 'border-teal-600 bg-teal-50 text-teal-900 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Immediate Active Line
              </button>
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Jordan"
                className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Smith"
                className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(416) 555-0199"
                className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jordan@example.com"
                className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Plan selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Selected Plan</label>
            <select
              value={preferredPlanId}
              onChange={(e) => setPreferredPlanId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 bg-white"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${p.monthlyPrice}/mo ({p.dataAllowance})
                </option>
              ))}
            </select>
          </div>

          {/* Sales rep & source */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Sales Rep</label>
              <select
                value={salesRep}
                onChange={(e) => setSalesRep(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 bg-white font-medium"
              >
                {staffMembers.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Referral Source</label>
              <input
                type="text"
                value={referralSource}
                onChange={(e) => setReferralSource(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-slate-900"
              />
            </div>
          </div>

          {/* If active line, show activation start date */}
          {status === 'active_line' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Activation Start Date</label>
              <input
                type="date"
                value={activationStartDate}
                onChange={(e) => setActivationStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-slate-900"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Initial Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. In-store visit, requested physical SIM card."
              className="w-full rounded-lg border border-slate-200 p-2 text-slate-900"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-[#0F3E2E] px-5 py-2 font-bold text-white hover:bg-[#14533D]"
            >
              <span>Create Customer Record</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
