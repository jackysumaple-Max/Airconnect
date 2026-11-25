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
  // Sort strictly by display_order ASC set by Master Admin CMS
  const activePlans = [...plans]
    .filter((p) => p.active)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  const chinaCanadaPlans = activePlans.filter((p) => p.roamingScope === 'China-Canada');
  const quadRoamingPlans = activePlans.filter((p) => p.roamingScope === 'China-US-Canada-Mexico');

  const renderPlanCard = (plan: Plan) => {
    const isSelected = selectedPlanId === plan.id;
    const isQuad = plan.roamingScope === 'China-US-Canada-Mexico';
    const isPopularHighlight =
      plan.id === 'ctexcel-27-50gb' ||
      Boolean(plan.badge && plan.badge.toLowerCase().includes('popular'));

    return (
      <div
        key={plan.id}
        role="button"
        tabIndex={0}
        onClick={() => onSelectPlan(plan.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectPlan(plan.id);
          }
        }}
        className={`relative flex flex-col justify-between rounded-2xl transition-all duration-200 cursor-pointer text-left ${
          isSelected
            ? 'ring-2 ring-emerald-600 shadow-xl bg-white border-emerald-500 scale-[1.01]'
            : isPopularHighlight
            ? 'bg-white border-2 border-emerald-600 shadow-lg hover:shadow-xl'
            : isQuad
            ? 'bg-white border-2 border-teal-500/45 shadow-sm hover:border-teal-600 hover:shadow-md'
            : 'bg-white border border-slate-200 hover:border-emerald-400 shadow-2xs hover:shadow-md'
        } p-5`}
      >
        {/* Top Badge (Popular / Best Value or custom badge) */}
        {plan.badge && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[10px] font-extrabold shadow-xs uppercase tracking-wide ${
                isPopularHighlight
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#0F3E2E] text-emerald-300'
              }`}
            >
              {isPopularHighlight && <Sparkles className="h-2.5 w-2.5" />}
              {plan.badge}
            </span>
          </div>
        )}

        {/* Top Section */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 pt-1">
            <span className="font-bold text-emerald-800">{plan.network}</span>
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              <Zap className="h-3 w-3 text-emerald-600" />
              5G Speeds
            </span>
          </div>

          {/* Pricing Block */}
          <div className="mt-2 flex items-baseline gap-1 pb-3 border-b border-slate-100">
            <span className="text-3xl font-extrabold text-[#0F3E2E] tabular-nums">
              ${plan.monthlyPrice}
            </span>
            <span className="text-xs font-semibold text-slate-500">/ mo</span>
            {plan.regularPrice > plan.monthlyPrice && (
              <span className="text-xs text-slate-400 line-through ml-1 tabular-nums">
                ${plan.regularPrice}
              </span>
            )}
          </div>

          {/* Data Allowance Callout */}
          <div
            className={`my-3 rounded-xl border p-2.5 text-center ${
              isPopularHighlight
                ? 'bg-emerald-50/80 border-emerald-200'
                : isQuad
                ? 'bg-teal-50/70 border-teal-200/80'
                : 'bg-slate-50 border-slate-100'
            }`}
          >
            <div className="text-xl font-extrabold text-[#0F3E2E] tracking-tight">
              {plan.dataAllowance} Data
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
              5G High-Speed Network
            </div>
          </div>

          {/* Roaming Highlight Badge */}
          <div className="mb-3">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg w-full justify-center text-center ${
                isQuad
                  ? 'bg-teal-50 text-teal-900 border border-teal-200'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              }`}
            >
              <Plane className="h-3 w-3 text-emerald-700 shrink-0" />
              <span>{plan.roamingHighlight}</span>
            </span>
          </div>

          {/* Feature Checklist */}
          <ul className="space-y-2 text-[11px] text-slate-700">
            {plan.features.slice(0, 4).map((feature, idx) => (
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
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectPlan(plan.id);
            }}
            className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
              isSelected
                ? 'bg-emerald-700 text-white shadow-xs'
                : isPopularHighlight
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                : 'bg-[#0F3E2E] text-white hover:bg-[#14533D]'
            }`}
          >
            <span>{isSelected ? '✓ Plan Selected' : 'Select This Plan'}</span>
            {!isSelected && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <section id="plans" className="py-16 sm:py-24 bg-slate-50/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-900 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>China Telecom CTExcel Mobile Plans · Powered by Telus 5G</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F3E2E] tracking-tight">
            One SIM, Seamless Travel Across Canada, US & Mexico
          </h2>
          
          <p className="mt-3 text-sm sm:text-base text-slate-600 font-medium">
            5G Speeds • Unlimited International Calling to 9 Countries (including China, US & Mexico)
          </p>
        </div>

        {/* CATEGORY A: Free China–Canada Roaming */}
        {chinaCanadaPlans.length > 0 && (
          <div className="mb-14">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-7 pb-3 border-b border-emerald-900/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0F3E2E] text-emerald-300 shadow-xs">
                  <Plane className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                      Category A
                    </span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                      {chinaCanadaPlans.length} Plans
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#0F3E2E]">
                    Free China–Canada Roaming
                  </h3>
                </div>
              </div>
              <p className="text-xs font-medium text-slate-500">
                5G Speeds • Free China–Canada Roaming • Unlimited 9-Country Calling
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 items-stretch">
              {chinaCanadaPlans.map(renderPlanCard)}
            </div>
          </div>
        )}

        {/* CATEGORY B: Free China–US–Canada–Mexico Roaming */}
        {quadRoamingPlans.length > 0 && (
          <div className="mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-7 pb-3 border-b border-teal-900/15">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-800 text-teal-200 shadow-xs">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700">
                      Category B
                    </span>
                    <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-900">
                      {quadRoamingPlans.length} Cross-Border Plans
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#0F3E2E]">
                    Free China–US–Canada–Mexico Roaming
                  </h3>
                </div>
              </div>
              <p className="text-xs font-medium text-slate-500">
                5G Speeds • Free 4-Country Roaming • Unlimited 9-Country Calling
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
              {quadRoamingPlans.map(renderPlanCard)}
            </div>
          </div>
        )}

        {/* Highlight Footer Callout directly below the plans */}
        <div id="roaming" className="mt-10 rounded-2xl border border-emerald-900/15 bg-white p-6 sm:p-7 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <PhoneCall className="h-5 w-5" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-extrabold text-[#0F3E2E] uppercase tracking-wider">
                  Free Roaming in China • Optional Chinese Phone Number Available
                </h4>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  All CTExcel Plans
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {roamingFinePrint ||
                  'Free Roaming in China • Optional Chinese Phone Number Available. Enjoy 5G speeds and unlimited international calling to 9 countries (including China, US & Mexico) on the Telus network.'}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 border-t border-slate-100">
                <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Official Telus 5G Network
                </span>
                <span>·</span>
                <span>Unlimited 9-Country Calling: China, US, Mexico, Canada, Hong Kong, Taiwan, UK, Australia, Singapore</span>
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
