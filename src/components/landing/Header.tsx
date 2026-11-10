import React from 'react';
import { Smartphone, ShieldCheck, ArrowRight, PhoneCall } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-950/10 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        
        {/* Zone 1: CTExcel Brand Wordmark + Powered by Telus Network Trust Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <a href="#" className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-[#0F3E2E]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F3E2E] text-white shadow-sm">
              <Smartphone className="h-5 w-5 text-emerald-400" />
            </div>
            <span>CTExcel</span>
          </a>

          {/* Prominent Telus Network Trust Badge */}
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-900/15 bg-emerald-50/90 px-3 py-1 text-xs font-bold text-emerald-900 shadow-2xs">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Powered by the Telus Network</span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <a href="#plans" className="hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0">
            5G Plans
          </a>
          <a href="#roaming" className="hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0">
            China & US Roaming
          </a>
          <a href="#network" className="hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0">
            Telus Network
          </a>
          <a href="#how-it-works" className="hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0">
            How It Works
          </a>
          <a href="#faq" className="hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0">
            FAQ
          </a>
        </nav>

        {/* Zone 3: Primary Customer Action (NO STAFF CRM LINK - COMPLETELY HIDDEN) */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#lead-form"
            className="flex items-center gap-1.5 rounded-xl bg-[#0F3E2E] px-4 py-2 text-xs font-bold text-white hover:bg-[#14533D] transition-colors shadow-xs whitespace-nowrap"
          >
            <PhoneCall className="h-3.5 w-3.5 text-emerald-300" />
            <span>Request a Callback</span>
            <ArrowRight className="h-3.5 w-3.5 text-white/70 hidden sm:inline" />
          </a>
        </div>

      </div>
    </header>
  );
};
