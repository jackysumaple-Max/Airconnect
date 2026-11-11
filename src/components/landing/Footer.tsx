import React from 'react';
import { Smartphone, ShieldCheck, Mail, Phone, Shield, UserCheck, Lock } from 'lucide-react';
import { CMSConfig } from '../../types/telecom';

interface FooterProps {
  cms: CMSConfig;
  onNavigateToStaffPortal?: () => void;
  onNavigateToAdminPortal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  cms,
  onNavigateToStaffPortal,
  onNavigateToAdminPortal,
}) => {
  const handleStaffClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateToStaffPortal) {
      onNavigateToStaffPortal();
    } else {
      try {
        window.history.pushState({}, '', '/staff-portal');
      } catch {
        window.location.hash = '#/staff-portal';
      }
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleAdminClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateToAdminPortal) {
      onNavigateToAdminPortal();
    } else {
      try {
        window.history.pushState({}, '', '/staff-portal/admin');
      } catch {
        window.location.hash = '#/staff-portal/admin';
      }
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

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

          {/* Customer Links */}
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

        {/* Dealer Portal Gateway: Admin & Staff Login Buttons */}
        <div className="mt-10 rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/60 p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-950">
                  Dealer & Team Access
                </span>
                <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                  Internal Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-lg">
                Direct access for sales representatives and master administrators to manage customer leads, line activations, and commission payouts.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              {/* Staff Login Button */}
              <button
                type="button"
                onClick={handleStaffClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 px-4 py-2.5 text-xs font-bold text-slate-800 hover:text-emerald-950 transition-all shadow-2xs active:scale-[0.98]"
              >
                <UserCheck className="h-4 w-4 text-emerald-700" />
                <span>Staff Login</span>
                <span className="text-[10px] text-slate-400 font-normal">/staff-portal</span>
              </button>

              {/* Admin Login Button */}
              <button
                type="button"
                onClick={handleAdminClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F3E2E] hover:bg-[#14533D] px-4 py-2.5 text-xs font-bold text-white transition-all shadow-xs active:scale-[0.98]"
              >
                <Shield className="h-4 w-4 text-emerald-300" />
                <span>Admin Login</span>
                <span className="text-[10px] text-emerald-200/80 font-normal">/admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quiet disclaimer and copyright */}
        <div className="mt-8 border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-4">
          <p>
            © {new Date().getFullYear()} CTExcel Telecom Dealer. All rights reserved.
          </p>
          <p className="text-right">
            Mobile service operated on the Telus Wireless Network. Telus is a trademark of Telus Communications Inc.
          </p>
        </div>
      </div>
    </footer>
  );
};
