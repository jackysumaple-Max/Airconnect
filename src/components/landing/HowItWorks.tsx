import React from 'react';
import { PhoneCall, QrCode, CheckCircle2, ArrowRight } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Simple 3-Step Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F3E2E] tracking-tight mt-1">
            How Switching to CTExcel Works
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            We handle the entire carrier porting process so you never lose service or miss an incoming call.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {/* Step 1 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs relative">
            <div className="flex items-center justify-between mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-sm font-extrabold text-[#0F3E2E]">
                01
              </span>
              <PhoneCall className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Request a Callback
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Choose your promotional plan (e.g., $27/50GB) and submit your contact info. Our team calls you back to confirm details.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs relative">
            <div className="flex items-center justify-between mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-sm font-extrabold text-[#0F3E2E]">
                02
              </span>
              <QrCode className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Receive Free eSIM or SIM
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Get an instant QR code sent to your email for eSIM setup in 5 minutes, or we mail a physical SIM card directly to your door for free.
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs relative">
            <div className="flex items-center justify-between mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-sm font-extrabold text-[#0F3E2E]">
                03
              </span>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Instant Activation & Porting
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your number transfers over smoothly onto the nationwide Telus 5G network. Start saving up to $400 every year on mobile bills.
            </p>
          </div>

        </div>

        {/* CTA banner below steps */}
        <div className="mt-12 text-center">
          <a
            href="#lead-form"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0F3E2E] px-6 py-3 text-xs sm:text-sm font-bold text-white hover:bg-[#14533D] transition-all shadow-md"
          >
            <span>Start Your Switch Now</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

      </div>
    </section>
  );
};
