import React from 'react';
import { ShieldCheck, Zap, CheckCircle2, ArrowRight, Sparkles, Phone, Globe, Signal } from 'lucide-react';
import { CMSConfig } from '../../types/telecom';

interface HeroSectionProps {
  cms: CMSConfig;
  onSelectPromoPlan: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ cms, onSelectPromoPlan }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#08281D] via-[#0F3E2E] to-[#0A2F22] text-white pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Subtle organic emerald gradient ambient orbs */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -left-40 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Headline, Trust Badge, Value Props */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6">
            
            {/* Trust Badge - "Powered by the Telus Network" */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-950/60 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-emerald-200 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>CTExcel Wireless · Powered by the Telus Network</span>
            </div>

            {/* Dynamic Banner Headline from CMS / site_settings */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
              {cms.heroTitle}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed max-w-2xl">
              {cms.heroSubtitle}
            </p>

            {/* Highlight Feature Card: Current Weekly Promotion */}
            <div className="w-full max-w-xl rounded-2xl border border-emerald-400/25 bg-emerald-900/40 p-4 sm:p-5 backdrop-blur-md shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-700/40 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-400/20 p-1.5 text-emerald-300">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      {cms.heroBadge}
                    </span>
                    <h3 className="text-sm font-semibold text-white">
                      {cms.heroPromoData} 5G Plan (Free China-Canada Roaming)
                    </h3>
                  </div>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">
                    {cms.heroPromoPrice}
                  </span>
                  <span className="text-xs font-medium text-emerald-200">/month</span>
                  <span className="text-xs text-emerald-400/80 line-through ml-1">$45/mo</span>
                </div>
              </div>

              {/* Quick bullet points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Free China-Canada Roaming</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Complimentary Chinese Phone #</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Unlimited Calling to 9 Countries</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Free Instant eSIM QR Code</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={onSelectPromoPlan}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-[#08281D] hover:bg-emerald-300 transition-all shadow-md active:scale-[0.99]"
                >
                  <span>Claim {cms.heroPromoPrice}/mo Plan</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <a
                  href="#lead-form"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-950/40 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-900/60 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Request Callback</span>
                </a>
              </div>
            </div>

            {/* Social Proof & Trust Badges Row */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-emerald-200/80">
              <div className="flex items-center gap-1.5">
                <Signal className="h-4 w-4 text-emerald-400" />
                <span>99% Nationwide Telus 5G Coverage</span>
              </div>
              <span className="text-emerald-500">·</span>
              <div className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-emerald-400" />
                <span>Canada, US, Mexico & China Ready</span>
              </div>
              <span className="text-emerald-500">·</span>
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-emerald-400" />
                <span>Keep Current Number 100%</span>
              </div>
            </div>

          </div>

          {/* Right Column: Visual Showcase using User Attachment Reference */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm sm:max-w-md">
              
              <div className="relative rounded-3xl border border-emerald-400/30 bg-emerald-950/60 p-4 shadow-2xl backdrop-blur-xl">
                
                {/* Floating Top Pill Badge */}
                <div className="flex items-center justify-between border-b border-emerald-800/40 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-200">CTExcel · Telus 5G Active</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-300 bg-emerald-900/80 px-2 py-0.5 rounded-md">
                    Global Roam
                  </span>
                </div>

                {/* Showcase Image from User Attachment */}
                <div className="relative overflow-hidden rounded-2xl border border-emerald-700/50 aspect-[4/4] bg-emerald-900/50">
                  <img
                    src={cms.heroImage || '/assets/aistudio/image_de9eb1a6.png'}
                    alt="CTExcel Mobile Plans on Telus Network"
                    className="h-full w-full object-cover object-center"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/aistudio/image_8a94fde1.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08281D] via-transparent to-transparent opacity-80" />
                  
                  {/* Floating Mini-card inside preview */}
                  <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-emerald-400/30 bg-[#0F3E2E]/90 p-3 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                          Dual Number Service
                        </span>
                        <div className="text-sm font-bold text-white">
                          Canada + China Dual Line
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-extrabold text-emerald-300">$27/mo</div>
                        <div className="text-[10px] text-emerald-100/70">Telus 5G eSIM</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Trust Indicators */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="rounded-xl bg-emerald-900/40 border border-emerald-800/40 p-2">
                    <div className="font-bold text-white">4 Countries</div>
                    <div className="text-emerald-300 text-[10px]">Free Roaming</div>
                  </div>
                  <div className="rounded-xl bg-emerald-900/40 border border-emerald-800/40 p-2">
                    <div className="font-bold text-white">China #</div>
                    <div className="text-emerald-300 text-[10px]">Included Free</div>
                  </div>
                  <div className="rounded-xl bg-emerald-900/40 border border-emerald-800/40 p-2">
                    <div className="font-bold text-white">9 Nations</div>
                    <div className="text-emerald-300 text-[10px]">Unlimited Talk</div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
