import {
  CustomerRecord,
  Plan,
  CMSConfig,
  StaffRep,
  PeerPermission,
  MonthlyCohortSummary,
  MASTER_ADMIN_EMAIL,
} from '../types/telecom';

const STORAGE_KEYS = {
  CUSTOMERS: 'ctexcel_customers_v3',
  PLANS: 'ctexcel_plans_v3',
  CMS: 'ctexcel_cms_v3',
  STAFF: 'ctexcel_staff_v4',
  MONTHLY_VOLUMES: 'ctexcel_monthly_volumes_v4',
  AUTH_SESSION: 'ctexcel_staff_session_v3',
};

/**
 * Staff Accounts with Master Admin bound to Jackysumaple@gmail.com
 * and standard demo rep bound to rep.demo@ctexceldealer.com
 */
export const INITIAL_STAFF_REPS: StaffRep[] = [
  {
    id: 'rep-master-admin',
    username: 'jacky',
    name: 'Jacky (Master Admin)',
    role: 'super_admin',
    email: MASTER_ADMIN_EMAIL, // Jackysumaple@gmail.com
    phone: '(647) 261-8488',
    avatarColor: 'bg-emerald-950',
    commissionMultiplier: 1.5,
    isAccessRevoked: false,
    allowedViewRepNames: ['ALL'],
    peerPermissions: [],
    isMasterAdmin: true,
  },
  {
    id: 'rep-standard-demo',
    username: 'rep.demo',
    name: 'Standard Rep',
    role: 'sales_rep',
    email: 'rep.demo@ctexceldealer.com',
    phone: '(416) 555-0155',
    avatarColor: 'bg-emerald-600',
    commissionMultiplier: 1.0,
    isAccessRevoked: false,
    peerPermissions: [
      {
        peerName: 'Chloe Martin',
        viewLeads: true,
        viewActiveLines: false,
        viewNonActiveLines: false,
      },
    ],
  },
  {
    id: 'rep-aarav',
    username: 'aarav',
    name: 'Aarav Patel',
    role: 'sales_rep',
    email: 'aarav@ctexcel.ca',
    phone: '(416) 555-0142',
    avatarColor: 'bg-emerald-700',
    commissionMultiplier: 1.5, // $30 plan * 1.5 = $45 commission
    isAccessRevoked: false,
    peerPermissions: [],
  },
  {
    id: 'rep-chloe',
    username: 'chloe',
    name: 'Chloe Martin',
    role: 'sales_rep',
    email: 'chloe@ctexcel.ca',
    phone: '(416) 555-0189',
    avatarColor: 'bg-teal-600',
    commissionMultiplier: 1.25, // $30 plan * 1.25 = $37.50
    isAccessRevoked: false,
    peerPermissions: [],
  },
  {
    id: 'rep-marcus',
    username: 'marcus',
    name: 'Marcus Vance',
    role: 'sales_rep',
    email: 'marcus@ctexcel.ca',
    phone: '(604) 555-0193',
    avatarColor: 'bg-emerald-800',
    commissionMultiplier: 1.0,
    isAccessRevoked: false,
    peerPermissions: [],
  },
  {
    id: 'rep-sarah',
    username: 'sarah',
    name: 'Sarah Jenkins',
    role: 'manager',
    email: 'sarah.j@ctexcel.ca',
    phone: '(416) 555-0100',
    avatarColor: 'bg-cyan-700',
    commissionMultiplier: 1.2,
    isAccessRevoked: false,
    peerPermissions: [
      { peerName: 'Aarav Patel', viewLeads: true, viewActiveLines: true, viewNonActiveLines: true },
      { peerName: 'Chloe Martin', viewLeads: true, viewActiveLines: true, viewNonActiveLines: false },
    ],
  },
];

/**
 * Calculate Sales Rep Commission payout based on plan monthly price and rep multiplier
 * e.g., a $30 plan at a 1.5x multiplier = $45 commission (Master Admin calculation)
 */
export function calculateCommissionForPlanAndRep(
  monthlyPlanPrice: number,
  multiplier: number = 1.0
): number {
  const boundedMultiplier = Math.max(0.5, Math.min(2.0, multiplier));
  return Number((monthlyPlanPrice * boundedMultiplier).toFixed(2));
}

/**
 * RBAC Helper: Determines whether a staff member can view a specific Lead
 * - Master Admin & Super Admins can view ALL leads (including Master Unassigned pool)
 * - Sales Reps see their own leads + peers with [x] View Peer's Leads
 */
export function canStaffViewLead(currentStaff: StaffRep, leadRepName?: string): boolean {
  if (currentStaff.role === 'admin' || currentStaff.role === 'super_admin' || currentStaff.isMasterAdmin) return true;
  if (!leadRepName || leadRepName === 'Unassigned' || leadRepName === 'Direct / Web') return false;
  if (leadRepName.toLowerCase() === currentStaff.name.toLowerCase() || leadRepName.toLowerCase() === currentStaff.username.toLowerCase()) return true;
  const peer = currentStaff.peerPermissions?.find((p) => p.peerName.toLowerCase() === leadRepName.toLowerCase());
  return Boolean(peer?.viewLeads);
}

/**
 * RBAC Helper: Determines whether a staff member can view a specific Active Line
 * - Master Admin & Super Admins can view ALL active lines
 * - Sales Reps see their own active lines + peers with [x] View Peer's Active Lines
 */
export function canStaffViewActiveLine(currentStaff: StaffRep, lineRepName?: string): boolean {
  if (currentStaff.role === 'admin' || currentStaff.role === 'super_admin' || currentStaff.isMasterAdmin) return true;
  if (!lineRepName) return false;
  if (lineRepName.toLowerCase() === currentStaff.name.toLowerCase() || lineRepName.toLowerCase() === currentStaff.username.toLowerCase()) return true;
  const peer = currentStaff.peerPermissions?.find((p) => p.peerName.toLowerCase() === lineRepName.toLowerCase());
  return Boolean(peer?.viewActiveLines);
}

/**
 * RBAC Helper: Determines whether a staff member can view a specific Non-Active Line
 * - Master Admin & Super Admins can view ALL non-active lines
 * - Sales Reps see their own non-active lines + peers with [x] View Peer's Non-Active Lines
 */
export function canStaffViewNonActiveLine(currentStaff: StaffRep, lineRepName?: string): boolean {
  if (currentStaff.role === 'admin' || currentStaff.role === 'super_admin' || currentStaff.isMasterAdmin) return true;
  if (!lineRepName) return false;
  if (lineRepName.toLowerCase() === currentStaff.name.toLowerCase() || lineRepName.toLowerCase() === currentStaff.username.toLowerCase()) return true;
  const peer = currentStaff.peerPermissions?.find((p) => p.peerName.toLowerCase() === lineRepName.toLowerCase());
  return Boolean(peer?.viewNonActiveLines);
}

/**
 * General RBAC fallback
 */
export function canStaffViewRecord(currentStaff: StaffRep, recordRepName?: string): boolean {
  if (currentStaff.role === 'admin' || currentStaff.role === 'super_admin' || currentStaff.isMasterAdmin) return true;
  if (!recordRepName || recordRepName === 'Unassigned') return false;
  if (recordRepName.toLowerCase() === currentStaff.name.toLowerCase() || recordRepName.toLowerCase() === currentStaff.username.toLowerCase()) return true;
  const peer = currentStaff.peerPermissions?.find((p) => p.peerName.toLowerCase() === recordRepName.toLowerCase());
  if (peer && (peer.viewLeads || peer.viewActiveLines || peer.viewNonActiveLines)) return true;
  if (currentStaff.allowedViewRepNames?.includes(recordRepName)) return true;
  return false;
}

/**
 * 5 Exact Plans required for CTExcel
 */
export const INITIAL_PLANS: Plan[] = [
  {
    id: 'ctexcel-27-50gb',
    name: '$27 / 50GB Plan',
    dataAllowance: '50GB',
    monthlyPrice: 27,
    regularPrice: 45,
    speedTier: '5G Speeds up to 250 Mbps',
    network: 'Telus 5G',
    roamingScope: 'China-Canada',
    roamingHighlight: 'Free China-Canada roaming',
    features: [
      '50GB High-Speed 5G Data on Telus Network',
      'Free China-Canada roaming included',
      'Complimentary virtual Chinese phone number',
      'Unlimited calling to 9 international countries',
      'Unlimited Canada-wide Talk & International SMS',
      'Free eSIM instant QR delivery or physical SIM mailout',
    ],
    badge: 'Weekly Feature Promo',
    popular: true,
    commissionRate: 40.5,
    active: true,
    display_order: 1,
    notes: 'Top conversion promo plan for students, newcomers, and frequent China travelers.',
  },
  {
    id: 'ctexcel-30-75gb',
    name: '$30 / 75GB Plan',
    dataAllowance: '75GB',
    monthlyPrice: 30,
    regularPrice: 55,
    speedTier: '5G Speeds up to 250 Mbps',
    network: 'Telus 5G',
    roamingScope: 'China-Canada',
    roamingHighlight: 'Free China-Canada roaming',
    features: [
      '75GB High-Speed 5G Data on Telus Network',
      'Free China-Canada roaming included',
      'Complimentary virtual Chinese phone number',
      'Unlimited calling to 9 international countries',
      'Hotspot & Personal Tethering enabled',
      'Keep your current number with zero downtime',
    ],
    badge: 'Best Value',
    popular: false,
    commissionRate: 45.0,
    active: true,
    display_order: 2,
    notes: 'Heavy data allowance for everyday streaming and roaming.',
  },
  {
    id: 'ctexcel-35-100gb',
    name: '$35 / 100GB Plan',
    dataAllowance: '100GB',
    monthlyPrice: 35,
    regularPrice: 65,
    speedTier: '5G+ Speeds up to 1Gbps',
    network: 'Telus 5G+',
    roamingScope: 'China-Canada',
    roamingHighlight: 'Free China-Canada roaming',
    features: [
      '100GB Ultra-Fast 5G+ High-Speed Data',
      'Free China-Canada roaming included',
      'Complimentary virtual Chinese phone number',
      'Unlimited calling to 9 international countries',
      'Unlimited throttled data after 100GB (no overages)',
      'VIP Priority dealer customer concierge',
    ],
    badge: 'Max Data',
    popular: false,
    commissionRate: 52.5,
    active: true,
    display_order: 3,
    notes: 'Premium high capacity plan for power users.',
  },
  {
    id: 'ctexcel-30-50gb-quad',
    name: '$30 / 50GB Quad-Roam',
    dataAllowance: '50GB',
    monthlyPrice: 30,
    regularPrice: 60,
    speedTier: '5G Speeds up to 250 Mbps',
    network: 'Telus 5G',
    roamingScope: 'China-US-Canada-Mexico',
    roamingHighlight: 'Free China-US-Canada-Mexico roaming',
    features: [
      '50GB High-Speed 5G Data across 4 Countries',
      'Free China-US-Canada-Mexico roaming (All 4 countries)',
      'Complimentary virtual Chinese phone number',
      'Unlimited calling to 9 international countries',
      'Zero US or Mexico roaming daily charges',
      'Seamless VoLTE and Wi-Fi Calling worldwide',
    ],
    badge: 'Cross-Border Essential',
    popular: true,
    commissionRate: 45.0,
    active: true,
    display_order: 4,
    notes: 'Ideal for frequent business and family travelers across North America and Asia.',
  },
  {
    id: 'ctexcel-35-75gb-quad',
    name: '$35 / 75GB Quad-Roam',
    dataAllowance: '75GB',
    monthlyPrice: 35,
    regularPrice: 70,
    speedTier: '5G Speeds up to 250 Mbps',
    network: 'Telus 5G',
    roamingScope: 'China-US-Canada-Mexico',
    roamingHighlight: 'Free China-US-Canada-Mexico roaming',
    features: [
      '75GB High-Speed 5G Data across 4 Countries',
      'Free China-US-Canada-Mexico roaming (All 4 countries)',
      'Complimentary virtual Chinese phone number',
      'Unlimited calling to 9 international countries',
      'Zero roaming charges in Canada, US, Mexico & China',
      'eSIM instant QR delivery within 5 minutes',
    ],
    badge: 'Ultimate Roamer',
    popular: true,
    commissionRate: 52.5,
    active: true,
    display_order: 5,
    notes: 'Highest demand cross-border package with generous data.',
  },
];

export const INITIAL_CMS: CMSConfig = {
  heroTitle: 'CTExcel Mobile Plans. Powered by Telus.',
  heroSubtitle:
    'Get up to 100GB 5G Data. Includes Free Roaming in Canada, US, Mexico & China, plus Unlimited Calling to 9 Countries.',
  heroBadge: 'Exclusive Promotional Offer',
  heroPromoPrice: '$27',
  heroPromoData: '50GB',
  heroImage: '/assets/aistudio/image_de9eb1a6.png',
  announcementBarText: '🇨🇦 🇨🇳 🇺🇸 🇲🇽 Special Promotion: Plans starting from $27/50GB with Free China Roaming + Telus 5G Network!',
  announcementActive: true,
  supportPhone: '1 (888) 555-CTEXCEL',
  supportEmail: 'support@ctexcel.ca',
  whatsappNumber: '+1 (416) 555-0142',
  businessHours: 'Mon–Sun: 9:00 AM – 9:00 PM EST',
  dealerLocation: 'Authorized CTExcel Independent Dealer Network · Powered by Telus',
  roamingFinePrint:
    'Free roaming when traveling to Canada, US, Mexico, and China. Includes a complimentary Chinese phone number and unlimited international calling to 9 countries. Zero roaming friction, powered by Telus 5G.',

  // Feature 2: Left Column (Checkmark Feature List)
  heroFeature1: 'Free China-Canada Roaming',
  heroFeature2: 'Complimentary Chinese Phone #',
  heroFeature3: 'Unlimited Calling to 9 Countries',
  heroFeature4: 'Free Instant eSIM QR Code',

  // Feature 2: Right Side Graphic Card
  heroCardTag: 'DUAL NUMBER SERVICE',
  heroCardTitle: 'Canada + China Dual Line',
  heroCardPrice: '$27/mo',
  heroCardSubtitle: 'Telus 5G eSIM',
  heroBox1Title: '4 Countries',
  heroBox1Sub: 'Free Roaming',
  heroBox2Title: 'China #',
  heroBox2Sub: 'Included Free',
  heroBox3Title: '9 Nations',
  heroBox3Sub: 'Unlimited Talk',
};

export const DEFAULT_MONTHLY_VOLUMES: Record<string, number> = {};

export function getResidualTierForCount(count: number): {
  tier: 'Tier 1 (7%)' | 'Tier 2 (9%)';
  rate: number;
} {
  if (count >= 200) {
    return { tier: 'Tier 2 (9%)', rate: 0.09 };
  }
  return { tier: 'Tier 1 (7%)', rate: 0.07 };
}

export function calculateDaysBetween(startDateStr?: string, endDateStr?: string): number {
  if (!startDateStr) return 0;
  const start = new Date(startDateStr).getTime();
  const end = endDateStr ? new Date(endDateStr).getTime() : Date.now();
  if (isNaN(start) || isNaN(end)) return 0;
  const diffTime = end - start;
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}

export function evaluateClawbackRisk(
  activationStartDate?: string,
  deactivationDateStr: string = new Date().toISOString().split('T')[0]
): {
  isWithin180Days: boolean;
  daysActive: number;
  message: string;
} {
  if (!activationStartDate) {
    return {
      isWithin180Days: false,
      daysActive: 0,
      message: 'No activation start date on record.',
    };
  }

  const daysActive = calculateDaysBetween(activationStartDate, deactivationDateStr);
  const isWithin180Days = daysActive <= 180;

  return {
    isWithin180Days,
    daysActive,
    message: isWithin180Days
      ? `🚨 AUTOMATED CHARGEBACK ALERT: Line was active for ${daysActive} days (under 180-day threshold). Commission clawback flagged for assigned sales rep.`
      : `✅ No Chargeback: Line was active for ${daysActive} days (exceeds 180-day clawback window).`,
  };
}

// Clean production customer slate (populated from real Supabase database records)
const LEGACY_MOCK_CUSTOMER_IDS = new Set([
  'LEAD-9011',
  'LEAD-9012',
  'LEAD-9013',
  'LEAD-9014',
  'ACT-5101',
  'ACT-5102',
  'ACT-5103',
  'ACT-5104',
  'ACT-5105',
  'CX-3011',
  'CX-3012',
]);

export const INITIAL_CUSTOMERS: CustomerRecord[] = [];

export const TelecomStorage = {
  getCustomers(): CustomerRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (data) {
        const parsed: CustomerRecord[] = JSON.parse(data);
        const cleaned = parsed.filter((c) => !LEGACY_MOCK_CUSTOMER_IDS.has(c.id));
        if (cleaned.length !== parsed.length) {
          this.saveCustomers(cleaned);
        }
        return cleaned;
      }
    } catch (e) {
      console.error('Failed to read customers', e);
    }
    this.saveCustomers(INITIAL_CUSTOMERS);
    return INITIAL_CUSTOMERS;
  },

  saveCustomers(customers: CustomerRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.error('Failed to save customers', e);
    }
  },

  /**
   * New Inbound Lead arrives from Public Form:
   * Placed into Master Unassigned Pool ("Unassigned") visible ONLY to Admin
   */
  addLead(lead: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    preferredPlanId: string;
    salesRep?: string;
    referralSource?: string;
    notes?: string;
    callbackTimePreference?: string;
  }): CustomerRecord {
    const customers = this.getCustomers();
    const plans = this.getPlans();
    const plan = plans.find((p) => p.id === lead.preferredPlanId) || plans[0];

    const newRecord: CustomerRecord = {
      id: `LEAD-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'lead',
      firstName: lead.firstName.trim(),
      lastName: lead.lastName.trim(),
      fullName: `${lead.firstName.trim()} ${lead.lastName.trim()}`,
      email: lead.email.trim(),
      phone: lead.phone.trim(),
      preferredPlanId: plan.id,
      preferredPlanName: `${plan.name} (${plan.roamingHighlight})`,
      monthlyPlanPrice: plan.monthlyPrice,
      salesRep: lead.salesRep?.trim() || 'Unassigned',
      referralSource: lead.referralSource?.trim() || 'CTExcel Lead Form',
      submittedAt: new Date().toISOString(),
      callbackTimePreference: lead.callbackTimePreference || 'As soon as possible',
      notes: lead.notes?.trim() || 'Online callback request from landing page.',
      leadFollowUpStatus: 'new',
      idVerification: {
        status: 'unverified',
      },
      commission: {
        amount: Number((plan.monthlyPrice * 1.0).toFixed(2)),
        status: 'pending',
        isClawbackFlagged: false,
        multiplierUsed: 1.0,
      },
    };

    customers.unshift(newRecord);
    this.saveCustomers(customers);
    return newRecord;
  },

  /**
   * Synchronize / merge leads fetched from Supabase database into local customer store
   */
  mergeExternalLeads(externalLeads: CustomerRecord[]): CustomerRecord[] {
    const local = this.getCustomers();
    const localIds = new Set(local.map((c) => c.id));
    const toAdd: CustomerRecord[] = [];

    for (const ext of externalLeads) {
      if (!localIds.has(ext.id)) {
        toAdd.push(ext);
        localIds.add(ext.id);
      }
    }

    if (toAdd.length > 0) {
      const merged = [...toAdd, ...local];
      this.saveCustomers(merged);
      return merged;
    }

    return local;
  },

  /**
   * Admin assigns a lead from master pool to a specific rep
   */
  assignLead(leadId: string, repName: string, assignedBy: string): CustomerRecord | null {
    const customers = this.getCustomers();
    const staff = this.getStaff();
    const rep = staff.find((s) => s.name === repName);
    const multiplier = rep ? rep.commissionMultiplier : 1.0;

    const index = customers.findIndex((c) => c.id === leadId);
    if (index === -1) return null;

    const existing = customers[index];
    const newCommissionAmount = calculateCommissionForPlanAndRep(
      existing.monthlyPlanPrice || 27,
      multiplier
    );

    const updated: CustomerRecord = {
      ...existing,
      salesRep: repName,
      assignedBy,
      assignedAt: new Date().toISOString(),
      commission: {
        ...existing.commission,
        amount: newCommissionAmount,
        multiplierUsed: multiplier,
      },
      notes: `${existing.notes || ''}\n[Assigned to ${repName} by ${assignedBy} on ${new Date().toLocaleDateString()}]`,
    };

    customers[index] = updated;
    this.saveCustomers(customers);
    return updated;
  },

  updateCustomer(id: string, updates: Partial<CustomerRecord>): CustomerRecord | null {
    const customers = this.getCustomers();
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const existing = customers[index];
    const updated: CustomerRecord = { ...existing, ...updates };

    // When status changes to active_line and no activationCohort exists, attach cohort & locked residual rate
    if (updates.status === 'active_line' && existing.status !== 'active_line') {
      const actDate = updates.activationStartDate || new Date().toISOString().split('T')[0];
      const cohort = actDate.substring(0, 7);
      const monthlyCount = this.getMonthlyVolume(cohort);
      const { tier, rate } = getResidualTierForCount(monthlyCount);
      const price = updated.monthlyPlanPrice || 27;

      updated.residual = {
        activationCohort: cohort,
        lockedResidualRate: rate,
        monthlyResidualAmount: Number((price * rate).toFixed(2)),
        tierLabel: tier,
      };
    }

    // Check if status is transitioning to non_active_line
    if (updates.status === 'non_active_line' && existing.status !== 'non_active_line') {
      const deactivationDate = updates.deactivationDate || new Date().toISOString().split('T')[0];
      updated.deactivationDate = deactivationDate;

      if (updated.residual) {
        updated.residual = {
          ...updated.residual,
          monthlyResidualAmount: 0,
        };
      }

      if (updated.activationStartDate) {
        const { isWithin180Days, daysActive } = evaluateClawbackRisk(
          updated.activationStartDate,
          deactivationDate
        );

        if (isWithin180Days) {
          updated.commission = {
            ...updated.commission,
            status: 'clawback',
            isClawbackFlagged: true,
            daysActiveBeforeCancel: daysActive,
            clawbackTriggeredAt: new Date().toISOString(),
            clawbackReason: `Automated 180-day chargeback: Line canceled at ${daysActive} days (under 180-day threshold). Commission clawback flagged for sales rep ${updated.salesRep} ($${updated.commission.amount.toFixed(2)}).`,
          };
        } else {
          updated.commission = {
            ...updated.commission,
            daysActiveBeforeCancel: daysActive,
            isClawbackFlagged: false,
            clawbackReason: `Line was active for ${daysActive} days (exceeds 180-day dealer clawback window). Rep keeps commission.`,
          };
        }
      }
    }

    if (updates.firstName || updates.lastName) {
      updated.fullName = `${updated.firstName} ${updated.lastName}`.trim();
    }

    customers[index] = updated;
    this.saveCustomers(customers);
    return updated;
  },

  /**
   * Soft Delete: Marks record as deleted, stores timestamp and deleting admin
   * Moves record to the Master Admin Recycle Bin without destroying data
   */
  softDeleteCustomer(id: string, deletedBy: string = 'Master Admin'): CustomerRecord | null {
    const customers = this.getCustomers();
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const existing = customers[index];
    const updated: CustomerRecord = {
      ...existing,
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy,
      originalStatus: existing.originalStatus || existing.status,
    };
    customers[index] = updated;
    this.saveCustomers(customers);
    return updated;
  },

  /**
   * Restore Customer: Recovers soft-deleted record back to its active tab
   */
  restoreCustomer(id: string): CustomerRecord | null {
    const customers = this.getCustomers();
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const existing = customers[index];
    const updated: CustomerRecord = {
      ...existing,
      isDeleted: false,
      status: existing.originalStatus || existing.status,
    };
    delete updated.deletedAt;
    delete updated.deletedBy;
    customers[index] = updated;
    this.saveCustomers(customers);
    return updated;
  },

  /**
   * Hard Delete: Permanently purges records from database after password verification
   */
  hardDeleteCustomers(ids: string[]): void {
    const idSet = new Set(ids);
    const customers = this.getCustomers().filter((c) => !idSet.has(c.id));
    this.saveCustomers(customers);
  },

  deleteCustomer(id: string): void {
    // Legacy fallback defaults to soft delete
    this.softDeleteCustomer(id, 'Master Admin');
  },

  getPlans(): Plan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLANS);
      if (data) {
        const parsed: Plan[] = JSON.parse(data);
        // Ensure each plan has display_order
        const withOrder = parsed.map((p, idx) => ({
          ...p,
          display_order: p.display_order ?? (idx + 1),
        }));
        // Sort strictly by display_order ASC
        return withOrder.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      }
    } catch (e) {
      console.error('Failed to read plans', e);
    }
    const initialWithOrder = INITIAL_PLANS.map((p, idx) => ({
      ...p,
      display_order: p.display_order ?? (idx + 1),
    }));
    this.savePlans(initialWithOrder);
    return initialWithOrder;
  },

  savePlans(plans: Plan[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
    } catch (e) {
      console.error('Failed to save plans', e);
    }
  },

  savePlanOrders(orderedPlans: Plan[]): Plan[] {
    const reindexed = orderedPlans.map((plan, index) => ({
      ...plan,
      display_order: index + 1,
    }));
    this.savePlans(reindexed);
    return reindexed;
  },

  getCMS(): CMSConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CMS);
      if (data) {
        const parsed = JSON.parse(data);
        return { ...INITIAL_CMS, ...parsed };
      }
    } catch (e) {
      console.error('Failed to read CMS', e);
    }
    this.saveCMS(INITIAL_CMS);
    return INITIAL_CMS;
  },

  saveCMS(cms: CMSConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CMS, JSON.stringify(cms));
    } catch (e) {
      console.error('Failed to save CMS', e);
    }
  },

  // --- STAFF & SALES REP MANAGEMENT (CRUD) ---
  getStaff(): StaffRep[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STAFF);
      if (data) {
        const parsed: StaffRep[] = JSON.parse(data);
        const masterIdx = parsed.findIndex(
          (s) => s.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase() || s.isMasterAdmin
        );
        if (masterIdx === -1) {
          parsed.unshift(INITIAL_STAFF_REPS[0]);
        } else {
          parsed[masterIdx].isMasterAdmin = true;
          parsed[masterIdx].email = MASTER_ADMIN_EMAIL;
        }

        this.saveStaff(parsed);
        return parsed;
      }
    } catch (e) {
      console.error('Failed to read staff', e);
    }
    this.saveStaff(INITIAL_STAFF_REPS);
    return INITIAL_STAFF_REPS;
  },

  saveStaff(staff: StaffRep[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
    } catch (e) {
      console.error('Failed to save staff', e);
    }
  },

  addStaff(newRep: Omit<StaffRep, 'id'>): StaffRep {
    const staff = this.getStaff();
    const id = `rep-${Date.now()}`;
    const rep: StaffRep = {
      ...newRep,
      id,
      username: newRep.username.trim().toLowerCase(),
      commissionMultiplier: Math.max(0.5, Math.min(2.0, newRep.commissionMultiplier || 1.0)),
      isAccessRevoked: false,
      peerPermissions: newRep.peerPermissions || [],
      allowedViewRepNames: newRep.allowedViewRepNames || [],
    };
    staff.push(rep);
    this.saveStaff(staff);
    return rep;
  },

  updatePeerPermissions(id: string, peerPermissions: PeerPermission[]): StaffRep | null {
    return this.updateStaff(id, { peerPermissions });
  },

  updateStaff(id: string, updates: Partial<StaffRep>): StaffRep | null {
    const staff = this.getStaff();
    const index = staff.findIndex((s) => s.id === id);
    if (index === -1) return null;

    // Protection rule: Master Admin email Jackysumaple@gmail.com cannot be overwritten or changed to non-master
    const existing = staff[index];
    if (existing.isMasterAdmin && updates.email && updates.email.toLowerCase() !== MASTER_ADMIN_EMAIL.toLowerCase()) {
      throw new Error(`Master Admin email is strictly bound to ${MASTER_ADMIN_EMAIL}.`);
    }

    if (updates.commissionMultiplier !== undefined) {
      updates.commissionMultiplier = Math.max(0.5, Math.min(2.0, updates.commissionMultiplier));
    }

    staff[index] = { ...existing, ...updates };
    this.saveStaff(staff);
    return staff[index];
  },

  deleteStaff(id: string): boolean {
    const staff = this.getStaff();
    const target = staff.find((s) => s.id === id);
    if (target?.isMasterAdmin) {
      alert('The Master Admin account cannot be deleted.');
      return false;
    }
    const filtered = staff.filter((s) => s.id !== id);
    this.saveStaff(filtered);
    return true;
  },

  revokeStaffAccess(id: string, revoked: boolean): StaffRep | null {
    return this.updateStaff(id, { isAccessRevoked: revoked });
  },

  resetStaffPassword(id: string, newPass: string): StaffRep | null {
    return this.updateStaff(id, { password: newPass });
  },

  updatePermissionsMatrix(id: string, allowedViewRepNames: string[]): StaffRep | null {
    return this.updateStaff(id, { allowedViewRepNames });
  },

  updateCommissionMultiplier(id: string, multiplier: number): StaffRep | null {
    return this.updateStaff(id, { commissionMultiplier: multiplier });
  },

  // Monthly Volume Management
  getMonthlyVolumes(): Record<string, number> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MONTHLY_VOLUMES);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to read monthly volumes', e);
    }
    return DEFAULT_MONTHLY_VOLUMES;
  },

  saveMonthlyVolumes(volumes: Record<string, number>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MONTHLY_VOLUMES, JSON.stringify(volumes));
    } catch (e) {
      console.error('Failed to save monthly volumes', e);
    }
  },

  getMonthlyVolume(cohort: string): number {
    const volumes = this.getMonthlyVolumes();
    if (volumes[cohort] !== undefined) {
      return volumes[cohort];
    }
    const customers = this.getCustomers();
    return customers.filter(
      (c) =>
        !c.isDeleted &&
        (c.status === 'active_line' || c.status === 'non_active_line') &&
        (c.residual?.activationCohort === cohort || c.activationStartDate?.startsWith(cohort))
    ).length;
  },

  setMonthlyVolume(cohort: string, count: number): void {
    const volumes = this.getMonthlyVolumes();
    volumes[cohort] = count;
    this.saveMonthlyVolumes(volumes);

    const customers = this.getCustomers();
    const { tier, rate } = getResidualTierForCount(count);

    let changed = false;
    customers.forEach((c) => {
      if (c.status === 'active_line' && c.residual && c.residual.activationCohort === cohort) {
        c.residual.lockedResidualRate = rate;
        c.residual.tierLabel = tier;
        c.residual.monthlyResidualAmount = Number(((c.monthlyPlanPrice || 27) * rate).toFixed(2));
        changed = true;
      }
    });

    if (changed) {
      this.saveCustomers(customers);
    }
  },

  getCohortSummaries(): MonthlyCohortSummary[] {
    const volumes = this.getMonthlyVolumes();
    const customers = this.getCustomers().filter((c) => !c.isDeleted);
    const currentCohort = new Date().toISOString().substring(0, 7);

    const cohortSet = new Set<string>();
    cohortSet.add(currentCohort);
    Object.keys(volumes).forEach((m) => cohortSet.add(m));
    customers.forEach((c) => {
      if (c.status === 'active_line' || c.status === 'non_active_line') {
        const m =
          c.residual?.activationCohort ||
          (c.activationStartDate && c.activationStartDate.length >= 7
            ? c.activationStartDate.substring(0, 7)
            : c.submittedAt?.substring(0, 7));
        if (m && m.length === 7) cohortSet.add(m);
      }
    });

    const cohorts = Array.from(cohortSet).sort().reverse();

    return cohorts.map((cohort) => {
      const cohortActiveCustomers = customers.filter(
        (c) =>
          c.status === 'active_line' &&
          (c.residual?.activationCohort === cohort ||
            c.activationStartDate?.startsWith(cohort) ||
            (!c.activationStartDate && c.submittedAt?.startsWith(cohort)))
      );

      const cohortAllActivations = customers.filter(
        (c) =>
          (c.status === 'active_line' || c.status === 'non_active_line') &&
          (c.residual?.activationCohort === cohort ||
            c.activationStartDate?.startsWith(cohort) ||
            (!c.activationStartDate && c.submittedAt?.startsWith(cohort)))
      );

      const count = volumes[cohort] ?? cohortAllActivations.length;
      const { tier, rate } = getResidualTierForCount(count);

      const activeSubscribers = cohortActiveCustomers.length;
      const totalMonthlyBilling = cohortActiveCustomers.reduce((sum, c) => sum + (c.monthlyPlanPrice || 0), 0);
      const monthlyResidualPayout = Number((totalMonthlyBilling * rate).toFixed(2));

      const [year, month] = cohort.split('-');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
      const cohortName = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      return {
        cohortMonth: cohort,
        cohortName,
        totalActivationsInMonth: count,
        tier,
        lockedResidualRate: rate,
        activeSubscribers,
        totalMonthlyBilling,
        monthlyResidualPayout,
        isCurrentMonth: cohort === currentCohort,
      };
    });
  },

  /**
   * Selective Retroactive Recalculation (Master Admin Override Tool)
   * Scans a specific sales rep's activations within [startDate, endDate]
   * and recalculates past commission values using the newly assigned multiplier.
   * Activations outside of that selected date range remain completely untouched.
   */
  recalculateRetroactiveCommissions(
    repName: string,
    newMultiplier: number,
    startDate: string,
    endDate: string
  ): {
    updatedCount: number;
    previousTotal: number;
    newTotal: number;
    updatedCustomers: CustomerRecord[];
  } {
    const customers = this.getCustomers();
    let updatedCount = 0;
    let previousTotal = 0;
    let newTotal = 0;
    const nowIso = new Date().toISOString();

    const updatedCustomers = customers.map((c) => {
      // Must match the rep
      if (c.salesRep.toLowerCase() !== repName.toLowerCase()) {
        return c;
      }
      // Must have an activation date
      const actDate = c.activationStartDate || c.commission?.payoutDate;
      if (!actDate) {
        return c;
      }

      // Check date bounds (YYYY-MM-DD)
      const dateStr = actDate.substring(0, 10);
      const isAfterOrEqualStart = !startDate || dateStr >= startDate;
      const isBeforeOrEqualEnd = !endDate || dateStr <= endDate;

      if (isAfterOrEqualStart && isBeforeOrEqualEnd) {
        const oldAmount = c.commission?.amount || 0;
        const planPrice = c.monthlyPlanPrice || 30;
        const calculatedAmount = Number((planPrice * newMultiplier).toFixed(2));

        previousTotal += oldAmount;
        newTotal += calculatedAmount;
        updatedCount += 1;

        return {
          ...c,
          commission: {
            ...c.commission,
            amount: calculatedAmount,
            multiplierUsed: newMultiplier,
            multiplierLockedAt: nowIso,
          },
          notes: `${c.notes || ''}\n[Retroactive recalculation: Multiplier adjusted from ${c.commission?.multiplierUsed ?? 1.0}x to ${newMultiplier}x by Master Admin on ${nowIso.split('T')[0]}]`,
        };
      }

      return c;
    });

    if (updatedCount > 0) {
      this.saveCustomers(updatedCustomers);
    }

    return {
      updatedCount,
      previousTotal: Number(previousTotal.toFixed(2)),
      newTotal: Number(newTotal.toFixed(2)),
      updatedCustomers,
    };
  },

  // Auth Session
  getAuthSession(): StaffRep | null {
    try {
      const data = sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      // ignore
    }
    return null;
  },

  setAuthSession(staff: StaffRep | null): void {
    try {
      if (staff) {
        sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(staff));
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      }
    } catch (e) {
      // ignore
    }
  },

  resetAllData(): void {
    this.saveCustomers(INITIAL_CUSTOMERS);
    this.savePlans(INITIAL_PLANS);
    this.saveCMS(INITIAL_CMS);
    this.saveStaff(INITIAL_STAFF_REPS);
    this.saveMonthlyVolumes(DEFAULT_MONTHLY_VOLUMES);
  },
};
