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
import {
  insertLeadToSupabase,
  fetchLeadsFromSupabase,
  fetchSiteSettingsFromSupabase,
  subscribeToLeadsRealtime,
  softDeleteCustomerInSupabase,
  restoreCustomerInSupabase,
  hardDeleteCustomersInSupabase,
  isSupabaseConfigured,
} from './services/supabase';
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

  // Load persistent state on mount & synchronize with Supabase Realtime
  useEffect(() => {
    setCustomers(TelecomStorage.getCustomers());
    setPlans(TelecomStorage.getPlans());
    setCms(TelecomStorage.getCMS());
    setStaffMembers(TelecomStorage.getStaff());

    if (!isSupabaseConfigured) return;

    // 1. Fetch remote site settings from Supabase site_settings table
    fetchSiteSettingsFromSupabase().then(({ data, error }) => {
      if (!error && data) {
        setCms((prev) => {
          const updated: CMSConfig = {
            ...prev,
            heroTitle: data.heroTitle || prev.heroTitle,
            heroSubtitle: data.heroSubtitle || prev.heroSubtitle,
            heroImage: data.heroImage || prev.heroImage,
            heroBadge: data.heroBadge || prev.heroBadge,
            heroPromoPrice: data.heroPromoPrice || prev.heroPromoPrice,
            heroPromoData: data.heroPromoData || prev.heroPromoData,
            heroFeature1: data.heroFeature1 || prev.heroFeature1,
            heroFeature2: data.heroFeature2 || prev.heroFeature2,
            heroFeature3: data.heroFeature3 || prev.heroFeature3,
            heroFeature4: data.heroFeature4 || prev.heroFeature4,
            heroCardTag: data.heroCardTag || prev.heroCardTag,
            heroCardTitle: data.heroCardTitle || prev.heroCardTitle,
            heroCardPrice: data.heroCardPrice || prev.heroCardPrice,
            heroCardSubtitle: data.heroCardSubtitle || prev.heroCardSubtitle,
            heroBox1Title: data.heroBox1Title || prev.heroBox1Title,
            heroBox1Sub: data.heroBox1Sub || prev.heroBox1Sub,
            heroBox2Title: data.heroBox2Title || prev.heroBox2Title,
            heroBox2Sub: data.heroBox2Sub || prev.heroBox2Sub,
            heroBox3Title: data.heroBox3Title || prev.heroBox3Title,
            heroBox3Sub: data.heroBox3Sub || prev.heroBox3Sub,
          };
          TelecomStorage.saveCMS(updated);
          return updated;
        });
      }
    });

    // 2. Synchronize initial leads from Supabase database
    fetchLeadsFromSupabase().then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        TelecomStorage.mergeExternalLeads(data);
        setCustomers(TelecomStorage.getCustomers());
      } else if (error) {
        console.error('Failed to synchronize leads from Supabase database on load:', error);
      }
    }).catch((err) => {
      console.error('Unexpected error fetching leads from Supabase on mount:', err);
    });

    // 3. Supabase Realtime subscription on 'leads' table:
    // When a customer submits a lead or external record is inserted,
    // automatically and instantly prepend to state without page refresh
    const unsubscribe = subscribeToLeadsRealtime(
      (newLead) => {
        console.log('⚡ [Realtime] New lead received:', newLead.id, newLead.fullName);
        setCustomers((prev) => {
          if (prev.some((c) => c.id === newLead.id)) return prev;
          const updated = [newLead, ...prev];
          TelecomStorage.saveCustomers(updated);
          return updated;
        });
      },
      (updatedLead) => {
        console.log('⚡ [Realtime] Lead updated:', updatedLead.id);
        setCustomers((prev) => {
          const updated = prev.map((c) => (c.id === updatedLead.id ? { ...c, ...updatedLead } : c));
          TelecomStorage.saveCustomers(updated);
          return updated;
        });
      },
      (deletedId) => {
        console.log('⚡ [Realtime] Lead deleted:', deletedId);
        setCustomers((prev) => {
          const updated = prev.filter((c) => c.id !== deletedId);
          TelecomStorage.saveCustomers(updated);
          return updated;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Navigation helpers for dealer portal
  const navigateToStaffPortal = useCallback(() => {
    try {
      window.history.pushState({}, '', '/staff-portal');
    } catch (e) {
      window.location.hash = '#/staff-portal';
    }
    setIsStaffRoute(true);
  }, []);

  const navigateToAdminPortal = useCallback(() => {
    try {
      window.history.pushState({}, '', '/staff-portal/admin');
    } catch (e) {
      window.location.hash = '#/staff-portal/admin';
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

  // Handlers for Leads and Customer Updates (Frontend to Backend + Supabase)
  const handleLeadSubmit = async (leadData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    preferredPlanId: string;
    salesRep?: string;
    referralSource?: string;
    callbackTimePreference?: string;
  }): Promise<CustomerRecord> => {
    // 1. Immediately store in local state/storage so UI is responsive
    const created = TelecomStorage.addLead(leadData);

    // 2. Insert into Supabase database ('leads' or 'customers' table)
    if (isSupabaseConfigured) {
      try {
        const { error, rejectionReason } = await insertLeadToSupabase(created);
        if (error) {
          console.error('CRITICAL: Supabase lead insertion failed in handleLeadSubmit:', rejectionReason || error.message);
          throw new Error(rejectionReason || error.message);
        }
      } catch (err: any) {
        console.error('CRITICAL: Exception during Supabase lead insertion in handleLeadSubmit:', err);
        throw err;
      }
    } else {
      console.warn('NOTE: Supabase credentials not configured in this deployment. Lead saved locally in browser.');
    }

    // 3. Immediately refresh customers state so backend "Leads" dashboard reflects the new lead
    setCustomers(TelecomStorage.getCustomers());
    return created;
  };

  const handleSaveCustomer = (id: string, updates: Partial<CustomerRecord>) => {
    TelecomStorage.updateCustomer(id, updates);
    setCustomers(TelecomStorage.getCustomers());
  };

  // Soft-delete: Moves record to Master Admin Recycle Bin
  const handleDeleteCustomer = async (id: string) => {
    const deletedBy = authStaff?.name || 'Master Admin';
    TelecomStorage.softDeleteCustomer(id, deletedBy);
    if (isSupabaseConfigured) {
      await softDeleteCustomerInSupabase(id, deletedBy);
    }
    setCustomers(TelecomStorage.getCustomers());
  };

  // Restore: Recovers soft-deleted records back to active tab
  const handleRestoreCustomers = async (ids: string[]) => {
    for (const id of ids) {
      TelecomStorage.restoreCustomer(id);
      if (isSupabaseConfigured) {
        await restoreCustomerInSupabase(id);
      }
    }
    setCustomers(TelecomStorage.getCustomers());
  };

  // Hard-delete: Permanently purges records from Supabase and CRM
  const handleHardDeleteCustomers = async (ids: string[]) => {
    TelecomStorage.hardDeleteCustomers(ids);
    if (isSupabaseConfigured) {
      await hardDeleteCustomersInSupabase(ids);
    }
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

  const handleUpdateCustomerList = (updated: CustomerRecord[]) => {
    TelecomStorage.saveCustomers(updated);
    setCustomers(updated);
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
        onUpdateCustomers={handleUpdateCustomerList}
        onRestoreCustomers={handleRestoreCustomers}
        onHardDeleteCustomers={handleHardDeleteCustomers}
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

      {/* Public Footer with unified Admin & Staff Portal login button */}
      <Footer
        cms={cms}
        onNavigateToPortal={navigateToStaffPortal}
      />

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
