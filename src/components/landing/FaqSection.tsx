import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'Can I keep my current phone number?',
    answer: 'Yes, 100%! You can transfer your existing phone number from any Canadian carrier (Rogers, Bell, Freedom Mobile, Fido, Virgin Plus, Koodo, Lucky, Chatr, Public Mobile, etc.) with zero downtime. Just have your current active account number or IMEI handy when our specialist calls you.',
  },
  {
    question: 'What network will my phone connect to?',
    answer: 'Your service is powered directly by the nationwide Telus 5G network. You receive full signal access, identical coverage across 99% of Canada, high-speed 5G/5G+ throughput, VoLTE calling, and Wi-Fi calling.',
  },
  {
    question: 'How fast can I get connected with an eSIM?',
    answer: 'Instant! Once our representative confirms your line on the callback, a secure eSIM QR activation code is sent directly to your email. You can scan it on your iPhone, Samsung Galaxy, or Google Pixel in under 5 minutes and connect immediately.',
  },
  {
    question: 'Are there any locked contracts or cancellation fees?',
    answer: 'No long-term contracts! All CTExcel promotional plans are monthly bring-your-own-device (BYOD) agreements. You are free to upgrade, change plans, or cancel at any time with no penalty.',
  },
  {
    question: 'Why are these dealer rates lower than retail?',
    answer: 'As an authorized independent telecom dealer network, CTExcel receives special bulk promotion allocations directly from the Telus wholesale channel that are not published in standard retail carrier stores. We pass those wholesale volume savings directly onto you.',
  },
  {
    question: 'Do you need my credit check or document uploads right now?',
    answer: 'No! Our initial callback request form requires zero document uploads and zero upfront payment. We only verify your basic details over a friendly phone call when you are ready to activate.',
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-16 sm:py-20 bg-white border-t border-slate-100">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 mb-2">
            <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F3E2E] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Everything you need to know about switching to CTExcel powered by Telus.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-sm text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-emerald-700 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
