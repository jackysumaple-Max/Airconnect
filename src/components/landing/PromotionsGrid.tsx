import React from 'react';
import { Check, Zap, Sparkles, ArrowRight, ShieldCheck, Globe, Plane, PhoneCall } from 'lucide-react';
import { Plan } from '../../types/telecom';

interface PromotionsGridProps {
  plans: Plan[];
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
  roamingFinePrint: string;
}

export const PromotionsGrid: React.FC<PromotionsGridProps> = ({
  plans,
  selectedPlanId,
  onSelectPlan,
  roamingFinePrint,
}) => {
  const activePlans = plans.filter((p) => p.active);

  return (
    <section id="plans" className="py-16 sm:py-24 bg-slate-50/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-900 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>CTExcel Exclusive Dealer Pricing · Powered by Telus 5G</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F3E2E] tracking-tight">
            5G Mobile Plans with Seamless Global Roaming
          </h2>
          
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Enjoy blazing 5G speeds nationwide in Canada with zero roaming friction when traveling. All plans include a complimentary Chinese phone number and unlimited international calling.
          </p>
        </div>

        {/* The 5 CTExcel Specific Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 items-stretch">
          {activePlans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const isQuad = plan.roamingScope === 'China-US-Canada-Mexico';

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-2xl transition-all duration-200 ${
                  isSelected
                    ? 'ring-2 ring-emerald-600 shadow-xl bg-white border-emerald-500 scale-[1.01]'
                    : isQuad
                    ? 'bg-white border-2 border-teal-500/40 shadow-sm hover:shadow-md'
                    : 'bg-white border border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-sm'
                } p-5`}
              >
                {/* Badge if present */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#0F3E2E] px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 shadow-xs uppercase tracking-wide">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Top Section */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1 pt-1">
                    <span className="font-bold text-emerald-800">{plan.network}</span>
                    <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                      <Zap className="h-3 w-3 text-emerald-600" />
                      5G
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                    {plan.name}
                  </h3>

                  {/* Roaming Highlight Badge (Mandatory requirement) */}
                  <div className="mt-2.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                        isQuad
                          ? 'bg-teal-50 text-teal-900 border border-teal-200'
                          : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      }`}
                    >
                      <Plane className="h-3 w-3 text-emerald-700 shrink-0" />
                      <span>{plan.roamingHighlight}</span>
                    </span>
                  </div>

                  {/* Pricing Block */}
                  <div className="mt-3.5 flex items-baseline gap-1 pb-3 border-b border-slate-100">
                    <span className="text-3xl font-extrabold text-[#0F3E2E] tabular-nums">
                      ${plan.monthlyPrice}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">/mo</span>
                    {plan.regularPrice > plan.monthlyPrice && (
                      <span className="text-xs text-slate-400 line-through ml-1 tabular-nums">
                        ${plan.regularPrice}
                      </span>
                    )}
                  </div>

                  {/* Data Allowance callout */}
                  <div className="my-3 rounded-xl bg-slate-50 border border-slate-100 p-2 text-center">
                    <span className="text-[11px] font-medium text-slate-500">High-Speed Allowance:</span>
                    <div className="text-lg font-extrabold text-[#0F3E2E] tracking-tight">
                      {plan.dataAllowance} 5G Data
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-2 text-[11px] text-slate-700">
                    {plan.features.slice(0, 5).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <div className="rounded-full bg-emerald-100 p-0.5 text-emerald-700 mt-0.5 shrink-0">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                        <span className="leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card CTA: Select Plan */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onSelectPlan(plan.id)}
                    className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-[#0F3E2E] text-white hover:bg-[#14533D]'
                    }`}
                  >
                    <span>{isSelected ? '✓ Plan Selected' : 'Select This Plan'}</span>
                    {!isSelected && <ArrowRight className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* MANDATORY: Promotional Footer / Fine Print directly below the plans */}
        <div id="roaming" className="mt-12 rounded-2xl border border-emerald-900/15 bg-white p-6 sm:p-7 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <Globe className="h-5 w-5" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-[#0F3E2E] uppercase tracking-wider">
                  Promotional Roaming & Included Benefits
                </h4>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Included with Service
                </span>
              </div>

              {/* Exact user requested fine print text */}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {roamingFinePrint}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 border-t border-slate-100">
                <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Official Telus Wholesale Infrastructure
                </span>
                <span>·</span>
                <span>9 Countries: China, Hong Kong, Macau, Taiwan, USA, UK, Australia, Singapore, India</span>
                <span>·</span>
                <span>Zero Daily Roaming Day-Pass Fees</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
