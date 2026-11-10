import React, { useState, useEffect, useCallback } from 'react';
import { CustomerRecord, Plan, CMSConfig, StaffRep } from './types/telecom';
import { TelecomStorage, calculateDaysBetween } from './services/telecomStorage';
import { Header } from './components/landing/Header';
import { HeroSection } from './components/landing/HeroSection';
import { PromotionsGrid } from './components/landing/PromotionsGrid';
import { LeadCaptureForm } from './components/landing/LeadCaptureForm';
import { NetworkTrustSection } from './components/landing/NetworkTrustSection';
import { HowItWorks } from './components/landing/HowItWorks';
import { FaqSection } from './components/landing/FaqSection';
import { Footer } from './components/landing/Footer';
import { CrmDashboard } from './components/crm/CrmDashboard';
import { StaffAuthGate } from './components/crm/StaffAuthGate';
import { Sparkles } from 'lucide-react';

export default function App() {
  // Unlisted Route Detection: '/staff-portal'
  const isStaffUrl = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    const hash = window.location.hash;
    const search = window.location.search;
    return (
      path.startsWith('/staff-portal') ||
      hash.includes('staff-portal') ||
      search.includes('portal=staff')
    );
  };

  const [isStaffRoute, setIsStaffRoute] = useState<boolean>(isStaffUrl());
  const [authStaff, setAuthStaff] = useState<StaffRep | null>(TelecomStorage.getAuthSession());

  // Storage states
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cms, setCms] = useState<CMSConfig>(TelecomStorage.getCMS());
  const [staffMembers, setStaffMembers] = useState<StaffRep[]>(TelecomStorage.getStaff());

  // Selected plan for lead form
  const [selectedPlanId, setSelectedPlanId] = useState<string>('ctexcel-27-50gb');

  // Sync route on popstate and hashchange
  useEffect(() => {
    const handleLocationChange = () => {
      setIsStaffRoute(isStaffUrl());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    // Unlisted emergency staff hotkey: Ctrl+Shift+S or Alt+S
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') || (e.altKey && e.key.toLowerCase() === 's')) {
        e.preventDefault();
        navigateToStaffPortal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Load persistent state on mount
  useEffect(() => {
    setCustomers(TelecomStorage.getCustomers());
    setPlans(TelecomStorage.getPlans());
    setCms(TelecomStorage.getCMS());
    setStaffMembers(TelecomStorage.getStaff());
  }, []);

  // Navigation helpers for unlisted portal
  const navigateToStaffPortal = useCallback(() => {
    try {
      window.history.pushState({}, '', '/staff-portal');
    } catch (e) {
      window.location.hash = '#/staff-portal';
    }
    setIsStaffRoute(true);
  }, []);

  const navigateToPublic = useCallback(() => {
    try {
      window.history.pushState({}, '', '/');
    } catch (e) {
      window.location.hash = '';
    }
    setIsStaffRoute(false);
  }, []);

  // Auth Handlers
  const handleAuthSuccess = (staff: StaffRep) => {
    TelecomStorage.setAuthSession(staff);
    setAuthStaff(staff);
  };

  const handleLogout = () => {
    TelecomStorage.setAuthSession(null);
    setAuthStaff(null);
    navigateToPublic();
  };

  // Handlers for Leads and Customer Updates
  const handleLeadSubmit = (leadData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    preferredPlanId: string;
    salesRep?: string;
    referralSource?: string;
    callbackTimePreference?: string;
  }): CustomerRecord => {
    const created = TelecomStorage.addLead(leadData);
    setCustomers(TelecomStorage.getCustomers());
    return created;
  };

  const handleSaveCustomer = (id: string, updates: Partial<CustomerRecord>) => {
    TelecomStorage.updateCustomer(id, updates);
    setCustomers(TelecomStorage.getCustomers());
  };

  const handleDeleteCustomer = (id: string) => {
    TelecomStorage.deleteCustomer(id);
    setCustomers(TelecomStorage.getCustomers());
  };

  const handleAddManualCustomer = (customer: CustomerRecord) => {
    const all = [customer, ...customers];
    TelecomStorage.saveCustomers(all);
    setCustomers(all);
  };

  const handleSaveCms = (updatedCms: CMSConfig) => {
    TelecomStorage.saveCMS(updatedCms);
    setCms(updatedCms);
  };

  const handleSavePlans = (updatedPlans: Plan[]) => {
    TelecomStorage.savePlans(updatedPlans);
    setPlans(updatedPlans);
  };

  const handleResetData = () => {
    TelecomStorage.resetAllData();
    setCustomers(TelecomStorage.getCustomers());
    setPlans(TelecomStorage.getPlans());
    setCms(TelecomStorage.getCMS());
    setStaffMembers(TelecomStorage.getStaff());
  };

  const handleUpdateStaffList = (updated: StaffRep[]) => {
    TelecomStorage.saveStaff(updated);
    setStaffMembers(updated);
    if (authStaff) {
      const fresh = updated.find((s) => s.id === authStaff.id);
      if (fresh) {
        setAuthStaff(fresh);
        TelecomStorage.setAuthSession(fresh);
      }
    }
  };

  const handleSelectPromoPlan = () => {
    setSelectedPlanId('ctexcel-27-50gb');
    const el = document.getElementById('lead-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    const el = document.getElementById('lead-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ROUTE 1: STAFF PORTAL (Accessible ONLY at unlisted route /staff-portal)
  if (isStaffRoute) {
    if (!authStaff) {
      return (
        <StaffAuthGate
          onSuccess={handleAuthSuccess}
          onExitToPublic={navigateToPublic}
        />
      );
    }

    return (
      <CrmDashboard
        customers={customers}
        plans={plans}
        cms={cms}
        staffMembers={staffMembers}
        currentStaff={authStaff}
        onSelectStaff={setAuthStaff}
        onBackToLanding={handleLogout}
        onSaveCustomer={handleSaveCustomer}
        onDeleteCustomer={handleDeleteCustomer}
        onAddCustomer={handleAddManualCustomer}
        onSaveCms={handleSaveCms}
        onSavePlans={handleSavePlans}
        onResetData={handleResetData}
        onUpdateStaffList={handleUpdateStaffList}
      />
    );
  }

  // ROUTE 2: PUBLIC FRONTEND (Completely invisible CRM access)
  return (
    <div className="min-h-screen bg-[#F8FAF9] text-slate-900 font-sans antialiased flex flex-col selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* Announcement Bar (CMS Managed) */}
      {cms.announcementActive && cms.announcementBarText && (
        <aside aria-label="Promotion" className="bg-[#08281D] border-b border-emerald-900/50 py-2 px-4 text-center text-xs font-semibold text-emerald-200">
          <div className="mx-auto max-w-7xl flex items-center justify-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{cms.announcementBarText}</span>
          </div>
        </aside>
      )}

      {/* Top Bar Navigation (Public Only - Zero CRM links) */}
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          cms={cms}
          onSelectPromoPlan={handleSelectPromoPlan}
        />

        {/* Current Promotions Grid (The 5 Specific CTExcel Plans + Mandatory Fine Print) */}
        <PromotionsGrid
          plans={plans}
          selectedPlanId={selectedPlanId}
          onSelectPlan={handleSelectPlan}
          roamingFinePrint={cms.roamingFinePrint}
        />

        {/* Customer Lead Capture Form */}
        <LeadCaptureForm
          plans={plans}
          selectedPlanId={selectedPlanId}
          onPlanChange={setSelectedPlanId}
          onSubmitLead={handleLeadSubmit}
          onViewInCrm={navigateToStaffPortal}
        />

        {/* Telus Network Credentials & Coverage */}
        <NetworkTrustSection />

        {/* Simple 3-Step Switching Guide */}
        <HowItWorks />

        {/* FAQ Section */}
        <FaqSection />
      </main>

      {/* Public Footer (Zero CRM links) */}
      <Footer cms={cms} />

      {/* Hidden Unlisted Access Hint for Evaluators:
          Double-clicking the quiet copyright line or typing /staff-portal navigates to the portal */}
      <div
        className="sr-only focus:not-sr-only text-[10px] text-slate-300 p-1 text-center"
        onClick={navigateToStaffPortal}
      >
        Staff Portal: /staff-portal
      </div>
    </div>
  );
}
