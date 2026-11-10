import React from 'react';
import { Smartphone, ShieldCheck, Mail, Phone } from 'lucide-react';
import { CMSConfig } from '../../types/telecom';

interface FooterProps {
  cms: CMSConfig;
}

export const Footer: React.FC<FooterProps> = ({ cms }) => {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-xl font-extrabold text-[#0F3E2E]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F3E2E] text-white">
                <Smartphone className="h-4 w-4 text-emerald-400" />
              </div>
              <span>CTExcel</span>
            </div>

            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              CTExcel is an authorized independent telecom dealer providing cross-border mobile connectivity packages powered by the nationwide Telus 5G network.
            </p>

            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>{cms.dealerLocation}</span>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Dealer Support
            </h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-emerald-700" />
                <span>{cms.supportPhone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-emerald-700" />
                <span>{cms.supportEmail}</span>
              </li>
              <li className="text-slate-400 pt-1">
                {cms.businessHours}
              </li>
            </ul>
          </div>

          {/* Customer Links (NO STAFF CRM LINK - COMPLETELY HIDDEN) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <a href="#plans" className="hover:text-emerald-800 transition-colors">
                  5G Plans & Pricing
                </a>
              </li>
              <li>
                <a href="#roaming" className="hover:text-emerald-800 transition-colors">
                  China & US Roaming Details
                </a>
              </li>
              <li>
                <a href="#network" className="hover:text-emerald-800 transition-colors">
                  Telus Network Specs
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-emerald-800 transition-colors">
                  Frequently Asked Questions
                </a>
              </li>
              <li>
                <span className="text-slate-400">Privacy Policy · Terms of Service</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Quiet disclaimer and copyright */}
        <div className="mt-10 border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-4">
          <p>
            <a
              href="/staff-portal"
              onClick={(e) => {
                e.preventDefault();
                try {
                  window.history.pushState({}, '', '/staff-portal');
                } catch {
                  window.location.hash = '#/staff-portal';
                }
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hover:text-slate-500 transition-colors"
              title="Staff Portal (/staff-portal)"
            >
              © {new Date().getFullYear()} CTExcel Telecom Dealer. All rights reserved.
            </a>
          </p>
          <p className="text-right">
            Mobile service operated on the Telus Wireless Network. Telus is a trademark of Telus Communications Inc.
          </p>
        </div>
      </div>
    </footer>
  );
};
