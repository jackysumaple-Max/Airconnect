import React, { useState } from 'react';
import { PhoneCall, CheckCircle, Shield, Clock, User, Mail, Phone, Tag, UserCheck, ArrowRight, Sparkles } from 'lucide-react';
import { Plan, CustomerRecord } from '../../types/telecom';

interface LeadCaptureFormProps {
  plans: Plan[];
  selectedPlanId: string;
  onPlanChange: (id: string) => void;
  onSubmitLead: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    preferredPlanId: string;
    salesRep?: string;
    referralSource?: string;
    callbackTimePreference?: string;
  }) => Promise<CustomerRecord> | CustomerRecord;
  onViewInCrm: () => void;
}

export const LeadCaptureForm: React.FC<LeadCaptureFormProps> = ({
  plans,
  selectedPlanId,
  onPlanChange,
  onSubmitLead,
  onViewInCrm,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [salesRep, setSalesRep] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [callbackTime, setCallbackTime] = useState('As soon as possible');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<CustomerRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const activePlans = plans.filter((p) => p.active);
  const currentPlan = activePlans.find((p) => p.id === selectedPlanId) || activePlans[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('Please enter both your first and last name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // Basic phone validation
    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      setErrorMessage('Please provide a valid 10-digit Canadian or US phone number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const createdRecord = await onSubmitLead({
        firstName,
        lastName,
        email,
        phone,
        preferredPlanId: selectedPlanId || currentPlan?.id,
        salesRep: salesRep.trim() || 'Unassigned',
        referralSource: referralSource.trim() || 'Website Lead Capture',
        callbackTimePreference: callbackTime,
      });

      setSubmittedLead(createdRecord);
      setIsSubmitting(false);
    } catch (err: any) {
      console.error('Lead form submission failed (Frontend to Backend):', err);
      setErrorMessage(err?.message || 'An unexpected error occurred while saving your callback request. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setSalesRep('');
    setReferralSource('');
    setSubmittedLead(null);
    setErrorMessage('');
  };

  return (
    <section id="lead-form" className="py-16 sm:py-24 bg-white relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Reassurance, Speed, Why Airconnect */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-bold text-[#0F3E2E]">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Zero-Hassle Activation</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F3E2E] tracking-tight leading-tight">
              Get Your Plan in 3 Easy Minutes.
            </h2>

            <p className="text-base text-slate-600 leading-relaxed">
              No long queues, no paper forms, and no documents needed upfront. Simply submit your contact details below, and an authorized CTExcel telecom specialist will call you directly to confirm your plan and activate your line.
            </p>

            {/* Quick Benefits list */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Average Callback: Under 15 Minutes</h4>
                  <p className="text-xs text-slate-500">Our live staff members are on standby 7 days a week from 9am to 9pm EST.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Powered by Telus 5G Network</h4>
                  <p className="text-xs text-slate-500">Enjoy maximum speeds, HD calling, and Canada-wide coverage without carrier markup.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Personal Representative Assigned</h4>
                  <p className="text-xs text-slate-500">You will have a direct rep contact for future plan changes or billing inquiries.</p>
                </div>
              </div>
            </div>

            {/* Currently Selected Promo Box */}
            {currentPlan && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      Selected Plan
                    </span>
                    <div className="text-sm font-bold text-slate-900">{currentPlan.name}</div>
                    <div className="text-xs text-slate-500">{currentPlan.dataAllowance} Data · {currentPlan.speedTier}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-[#0F3E2E]">${currentPlan.monthlyPrice}<span className="text-xs font-semibold text-slate-500">/mo</span></div>
                    <span className="text-[10px] text-emerald-700 font-semibold">$0 Activation Fee</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Lead Capture Form Box */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
              
              {/* Top Decorative Subtle Green Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400" />

              {submittedLead ? (
                /* Success Confirmation State */
                <div className="py-6 text-center space-y-5">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <CheckCircle className="h-10 w-10 text-emerald-600" />
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      Lead Reference: {submittedLead.id}
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">
                      Callback Request Confirmed!
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                      Thank you, <strong className="text-slate-900">{submittedLead.firstName}</strong>. We have routed your request to our telecom team.
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 max-w-md mx-auto text-left text-xs space-y-2">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Contact Phone:</span>
                      <span className="font-semibold text-slate-900">{submittedLead.phone}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-semibold text-slate-900">{submittedLead.email}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Reserved Plan:</span>
                      <span className="font-semibold text-emerald-800">{submittedLead.preferredPlanName}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Assigned Specialist:</span>
                      <span className="font-semibold text-slate-900">{submittedLead.salesRep}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={handleReset}
                      className="w-full sm:w-auto rounded-xl bg-[#0F3E2E] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#14533D] transition-colors shadow-xs"
                    >
                      Submit Another Callback Request
                    </button>
                  </div>
                </div>
              ) : (
                /* Contact Lead Capture Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-bold text-[#0F3E2E]">
                      Request a Callback
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enter your details below to lock in promotional rates powered by Telus.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                      {errorMessage}
                    </div>
                  )}

                  {/* Name Fields (First and Last Name) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <User className="h-4 w-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="e.g. Liam"
                          className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Last Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Chen"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <Mail className="h-4 w-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="liam.chen@example.com"
                          className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Contact Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <Phone className="h-4 w-4" />
                        </div>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(416) 555-0199"
                          className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preferred Plan Dropdown (Dynamically linked to current promotions) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferred Plan <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Tag className="h-4 w-4" />
                      </div>
                      <select
                        value={selectedPlanId}
                        onChange={(e) => onPlanChange(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 pl-9 pr-8 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all bg-white font-medium"
                      >
                        {activePlans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} — ${plan.monthlyPrice}/mo ({plan.dataAllowance} Data) {plan.badge ? `[${plan.badge}]` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Dynamically linked to our live dealer promotions powered by Telus.
                    </p>
                  </div>

                  {/* Sales Rep Name / Referral Source (Optional text field) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Sales Rep Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={salesRep}
                        onChange={(e) => setSalesRep(e.target.value)}
                        placeholder="e.g. Aarav Patel, Chloe"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Referral Source (Optional)
                      </label>
                      <input
                        type="text"
                        value={referralSource}
                        onChange={(e) => setReferralSource(e.target.value)}
                        placeholder="e.g. Instagram, TikTok, Friend"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Preferred Callback Time */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Preferred Callback Window
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['As soon as possible', 'Today Afternoon', 'Evening (5-8 PM)'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setCallbackTime(opt)}
                          className={`rounded-lg py-1.5 px-2 text-[11px] font-medium border text-center transition-all ${
                            callbackTime === opt
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submission CTA: Request a Callback */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0F3E2E] py-3.5 px-6 text-sm font-bold text-white hover:bg-[#14533D] transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
                    >
                      <PhoneCall className="h-4 w-4 text-emerald-300" />
                      <span>{isSubmitting ? 'Routing to CRM...' : 'Request a Callback'}</span>
                      <ArrowRight className="h-4 w-4 text-white/70" />
                    </button>
                  </div>

                  {/* Privacy / Low Friction Notice */}
                  <p className="text-center text-[11px] text-slate-400">
                    🔒 No document uploads required. We respect your privacy. No spam guaranteed.
                  </p>
                </form>
              )}

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
