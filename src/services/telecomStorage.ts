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
  MONTHLY_VOLUMES: 'ctexcel_monthly_volumes_v3',
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
    notes: 'Highest demand cross-border package with generous data.',
  },
];

export const INITIAL_CMS: CMSConfig = {
  heroTitle: 'CTExcel Mobile Plans Powered by Telus',
  heroSubtitle: 'Stay seamlessly connected across Canada, China, the US, and Mexico. Get up to 100GB of 5G data from $27/mo with free roaming, a complimentary Chinese phone number, and unlimited international calling.',
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
    'Free roaming when traveling to Canada, US, Mexico, and China. Includes a complimentary Chinese phone number and unlimited calling to 9 countries. The China-US-Canada-Mexico roaming plans feature free roaming across all 4 countries, plus unlimited calling to 9 countries.',
};

export const DEFAULT_MONTHLY_VOLUMES: Record<string, number> = {
  '2026-08': 142,
  '2026-09': 218,
  '2026-10': 185,
  '2026-11': 116,
};

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

// Initial realistic customer database with Master Unassigned Pool leads & rep attributions
export const INITIAL_CUSTOMERS: CustomerRecord[] = [
  // --- INBOUND LEADS IN MASTER UNASSIGNED POOL (Visible only to Admin initially) ---
  {
    id: 'LEAD-9011',
    status: 'lead',
    firstName: 'Wei',
    lastName: 'Zhang',
    fullName: 'Wei Zhang',
    email: 'wei.zhang@student.utoronto.ca',
    phone: '(416) 720-8819',
    preferredPlanId: 'ctexcel-27-50gb',
    preferredPlanName: '$27 / 50GB Plan (Free China-Canada Roaming)',
    monthlyPlanPrice: 27,
    salesRep: 'Unassigned', // In Master Unassigned Pool
    referralSource: 'WeChat Group Link',
    submittedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    callbackTimePreference: 'As soon as possible',
    notes: 'New lead from public website. In master unassigned pool waiting for Admin distribution.',
    leadFollowUpStatus: 'new',
    idVerification: { status: 'unverified' },
    commission: { amount: 40.5, status: 'pending', isClawbackFlagged: false, multiplierUsed: 1.5 },
  },
  {
    id: 'LEAD-9012',
    status: 'lead',
    firstName: 'Jessica',
    lastName: 'Kao',
    fullName: 'Jessica Kao',
    email: 'jess.kao@innovate.ca',
    phone: '(604) 318-9922',
    preferredPlanId: 'ctexcel-35-75gb-quad',
    preferredPlanName: '$35 / 75GB Quad-Roam (China-US-Canada-Mexico)',
    monthlyPlanPrice: 35,
    salesRep: 'Chloe Martin', // Assigned by Admin to Chloe
    referralSource: 'Instagram Promo Link',
    submittedAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    callbackTimePreference: 'Evening (5-8 PM)',
    notes: 'Consultant traveling across Vancouver, San Francisco, and Shenzhen. Assigned by Admin to Chloe Martin.',
    leadFollowUpStatus: 'callback_scheduled',
    idVerification: { status: 'pending', idType: 'Passport' },
    commission: { amount: 43.75, status: 'pending', isClawbackFlagged: false, multiplierUsed: 1.25 },
    assignedBy: 'Jacky (Master Admin)',
    assignedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'LEAD-9013',
    status: 'lead',
    firstName: 'Marcus',
    lastName: 'Liu',
    fullName: 'Marcus Liu',
    email: 'marcus.liu@techhub.co',
    phone: '(647) 801-4455',
    preferredPlanId: 'ctexcel-30-75gb',
    preferredPlanName: '$30 / 75GB Plan (Free China-Canada Roaming)',
    monthlyPlanPrice: 30,
    salesRep: 'Unassigned', // In Master Unassigned Pool
    referralSource: 'Xiaohongshu / RED',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    callbackTimePreference: 'Today Afternoon',
    notes: 'Porting from Fido. In unassigned pool.',
    leadFollowUpStatus: 'new',
    idVerification: { status: 'unverified' },
    commission: { amount: 45.0, status: 'pending', isClawbackFlagged: false, multiplierUsed: 1.5 },
  },
  {
    id: 'LEAD-9014',
    status: 'lead',
    firstName: 'David',
    lastName: 'Sun',
    fullName: 'David Sun',
    email: 'david.sun@enterprise.ca',
    phone: '(416) 991-3829',
    preferredPlanId: 'ctexcel-30-50gb-quad',
    preferredPlanName: '$30 / 50GB Quad-Roam',
    monthlyPlanPrice: 30,
    salesRep: 'Aarav Patel', // Assigned to Aarav
    referralSource: 'Direct / Referral',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    callbackTimePreference: 'Morning 10am-12pm',
    notes: 'Assigned to Aarav Patel. Contacted customer and requested ID upload.',
    leadFollowUpStatus: 'contacted',
    idVerification: { status: 'pending', idType: 'Driver License' },
    commission: { amount: 45.0, status: 'pending', isClawbackFlagged: false, multiplierUsed: 1.5 },
    assignedBy: 'Jacky (Master Admin)',
    assignedAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
  },

  // --- ACTIVE LINES WITH MULTIPLIER AND RESIDUALS ---
  // September 2026: 218 activations (Tier 2: 9%)
  {
    id: 'ACT-5101',
    status: 'active_line',
    firstName: 'Hao',
    lastName: 'Wang',
    fullName: 'Hao Wang',
    email: 'hao.wang@ontariotech.ca',
    phone: '(416) 881-2244',
    activatedPhone: '(416) 881-2244',
    preferredPlanId: 'ctexcel-27-50gb',
    preferredPlanName: '$27 / 50GB Plan',
    monthlyPlanPrice: 27,
    salesRep: 'Aarav Patel',
    referralSource: 'WeChat Promo',
    submittedAt: '2026-09-08T10:00:00Z',
    activationStartDate: '2026-09-10',
    simType: 'eSIM',
    imeiOrSimNumber: '89014103211192847291',
    notes: 'Aarav Patel 1.5x multiplier applied ($27 * 1.5 = $40.50). 9% Tier 2 residual.',
    address: { street: '180 University Ave, Unit 1204', city: 'Toronto', province: 'ON', postalCode: 'M5H 0A2' },
    idVerification: { status: 'verified', idType: 'Driver License', idNumberMasked: 'W8102-*****-1129', verifiedBy: 'Aarav Patel' },
    commission: {
      amount: 40.5, // $27 * 1.5
      status: 'paid',
      payoutDate: '2026-10-01',
      isClawbackFlagged: false,
      multiplierUsed: 1.5,
    },
    residual: {
      activationCohort: '2026-09',
      lockedResidualRate: 0.09,
      monthlyResidualAmount: 2.43,
      tierLabel: 'Tier 2 (9%)',
    },
  },
  {
    id: 'ACT-5102',
    status: 'active_line',
    firstName: 'Vivian',
    lastName: 'Zhou',
    fullName: 'Vivian Zhou',
    email: 'vivian.z@ubc.ca',
    phone: '(604) 992-3311',
    activatedPhone: '(604) 992-3311',
    preferredPlanId: 'ctexcel-35-75gb-quad',
    preferredPlanName: '$35 / 75GB Quad-Roam',
    monthlyPlanPrice: 35,
    salesRep: 'Chloe Martin',
    referralSource: 'Student Referral',
    submittedAt: '2026-09-14T11:00:00Z',
    activationStartDate: '2026-09-16',
    simType: 'eSIM',
    imeiOrSimNumber: '89014103211192848832',
    notes: 'Chloe Martin 1.25x multiplier applied ($35 * 1.25 = $43.75).',
    address: { street: '6138 Student Union Blvd', city: 'Vancouver', province: 'BC', postalCode: 'V6T 1Z1' },
    idVerification: { status: 'verified', idType: 'Passport', idNumberMasked: 'EH****39', verifiedBy: 'Chloe Martin' },
    commission: {
      amount: 43.75, // $35 * 1.25
      status: 'paid',
      payoutDate: '2026-10-01',
      isClawbackFlagged: false,
      multiplierUsed: 1.25,
    },
    residual: {
      activationCohort: '2026-09',
      lockedResidualRate: 0.09,
      monthlyResidualAmount: 3.15,
      tierLabel: 'Tier 2 (9%)',
    },
  },

  // October 2026: 185 activations (Tier 1: 7%)
  {
    id: 'ACT-5103',
    status: 'active_line',
    firstName: 'David',
    lastName: 'Song',
    fullName: 'David Song',
    email: 'david.song@nexustechnologies.ca',
    phone: '(416) 450-9901',
    activatedPhone: '(416) 450-9901',
    preferredPlanId: 'ctexcel-30-50gb-quad',
    preferredPlanName: '$30 / 50GB Quad-Roam',
    monthlyPlanPrice: 30,
    salesRep: 'Marcus Vance',
    referralSource: 'Google Ad',
    submittedAt: '2026-10-04T14:00:00Z',
    activationStartDate: '2026-10-06',
    simType: 'Physical SIM',
    imeiOrSimNumber: '89014103211192841029',
    notes: 'Marcus Vance 1.0x multiplier ($30 * 1.0 = $30.00). October Tier 1 (7%).',
    address: { street: '200 Front St W', city: 'Toronto', province: 'ON', postalCode: 'M5V 3J1' },
    idVerification: { status: 'verified', idType: 'Driver License', idNumberMasked: 'S3192-*****-8810', verifiedBy: 'Marcus Vance' },
    commission: {
      amount: 30.0, // $30 * 1.0
      status: 'paid',
      payoutDate: '2026-11-01',
      isClawbackFlagged: false,
      multiplierUsed: 1.0,
    },
    residual: {
      activationCohort: '2026-10',
      lockedResidualRate: 0.07,
      monthlyResidualAmount: 2.1,
      tierLabel: 'Tier 1 (7%)',
    },
  },
  {
    id: 'ACT-5104',
    status: 'active_line',
    firstName: 'Grace',
    lastName: 'Lin',
    fullName: 'Grace Lin',
    email: 'grace.lin@biopharma.ca',
    phone: '(647) 551-7788',
    activatedPhone: '(647) 551-7788',
    preferredPlanId: 'ctexcel-35-100gb',
    preferredPlanName: '$35 / 100GB Plan',
    monthlyPlanPrice: 35,
    salesRep: 'Aarav Patel',
    referralSource: 'Friend Referral',
    submittedAt: '2026-10-18T16:00:00Z',
    activationStartDate: '2026-10-20',
    simType: 'eSIM',
    imeiOrSimNumber: '89014103211192849921',
    notes: 'Aarav Patel 1.5x multiplier ($35 * 1.5 = $52.50). Commission pending.',
    address: { street: '55 University Ave', city: 'Toronto', province: 'ON', postalCode: 'M5J 2H7' },
    idVerification: { status: 'verified', idType: 'Driver License', idNumberMasked: 'L9921-*****-4410', verifiedBy: 'Aarav Patel' },
    commission: {
      amount: 52.5, // $35 * 1.5
      status: 'pending',
      isClawbackFlagged: false,
      multiplierUsed: 1.5,
    },
    residual: {
      activationCohort: '2026-10',
      lockedResidualRate: 0.07,
      monthlyResidualAmount: 2.45,
      tierLabel: 'Tier 1 (7%)',
    },
  },
  {
    id: 'ACT-5105',
    status: 'active_line',
    firstName: 'Kevin',
    lastName: 'Zhao',
    fullName: 'Kevin Zhao',
    email: 'k.zhao@montreallogistics.ca',
    phone: '(514) 772-9933',
    activatedPhone: '(514) 772-9933',
    preferredPlanId: 'ctexcel-30-75gb',
    preferredPlanName: '$30 / 75GB Plan',
    monthlyPlanPrice: 30,
    salesRep: 'Chloe Martin',
    referralSource: 'Walk-in',
    submittedAt: '2026-08-11T12:00:00Z',
    activationStartDate: '2026-08-14',
    simType: 'Physical SIM',
    imeiOrSimNumber: '89014103211192843312',
    notes: 'Chloe Martin 1.25x multiplier ($30 * 1.25 = $37.50). Paid.',
    address: { street: '1000 Rue De La Gauchetière O', city: 'Montreal', province: 'QC', postalCode: 'H3B 4W5' },
    idVerification: { status: 'verified', idType: 'PR Card', idNumberMasked: 'PR****88', verifiedBy: 'Chloe Martin' },
    commission: {
      amount: 37.5,
      status: 'paid',
      payoutDate: '2026-09-01',
      isClawbackFlagged: false,
      multiplierUsed: 1.25,
    },
    residual: {
      activationCohort: '2026-08',
      lockedResidualRate: 0.07,
      monthlyResidualAmount: 2.1,
      tierLabel: 'Tier 1 (7%)',
    },
  },

  // --- NON-ACTIVE LINES (CANCELED) ---
  // Line canceled at Day 48 (< 180 days) -> Automatic clawback triggered
  {
    id: 'CX-3011',
    status: 'non_active_line',
    firstName: 'Simon',
    lastName: 'Huang',
    fullName: 'Simon Huang',
    email: 'simon.h@pacific.ca',
    phone: '(604) 555-4819',
    activatedPhone: '(604) 555-4819',
    preferredPlanId: 'ctexcel-27-50gb',
    preferredPlanName: '$27 / 50GB Plan',
    monthlyPlanPrice: 27,
    salesRep: 'Chloe Martin',
    referralSource: 'WeChat Ad',
    submittedAt: '2026-08-15T09:00:00Z',
    activationStartDate: '2026-08-18',
    deactivationDate: '2026-10-05', // 48 days (< 180)
    simType: 'Physical SIM',
    notes: 'Moved back to Beijing. Canceled at 48 days. Commission clawed back from Chloe Martin.',
    address: { street: '888 Burrard St', city: 'Vancouver', province: 'BC', postalCode: 'V6Z 1X9' },
    idVerification: { status: 'verified', idType: 'Driver License', idNumberMasked: 'H1948-*****-2201', verifiedBy: 'Chloe Martin' },
    commission: {
      amount: 33.75, // $27 * 1.25 multiplier
      status: 'clawback',
      payoutDate: '2026-09-01',
      isClawbackFlagged: true,
      daysActiveBeforeCancel: 48,
      multiplierUsed: 1.25,
      clawbackReason: 'Automated 180-day chargeback: Line canceled at 48 days (under 180-day threshold). Commission clawback flagged for sales rep Chloe Martin ($33.75).',
      clawbackTriggeredAt: '2026-10-05T14:30:00Z',
    },
    residual: {
      activationCohort: '2026-08',
      lockedResidualRate: 0.07,
      monthlyResidualAmount: 0,
      tierLabel: 'Tier 1 (7%)',
    },
  },
  // Line canceled after 240 days (> 180 days) -> Upfront commission safe
  {
    id: 'CX-3012',
    status: 'non_active_line',
    firstName: 'Claire',
    lastName: 'Meng',
    fullName: 'Claire Meng',
    email: 'claire.meng@finance.ca',
    phone: '(416) 901-2244',
    activatedPhone: '(416) 901-2244',
    preferredPlanId: 'ctexcel-35-75gb-quad',
    preferredPlanName: '$35 / 75GB Quad-Roam',
    monthlyPlanPrice: 35,
    salesRep: 'Aarav Patel',
    referralSource: 'Instagram',
    submittedAt: '2025-12-01T10:00:00Z',
    activationStartDate: '2025-12-05',
    deactivationDate: '2026-08-02', // 240 days (> 180)
    simType: 'eSIM',
    notes: 'Active for 8 months. Passed 180-day guarantee period. Upfront commission of $52.50 kept by Aarav.',
    address: { street: '161 Bay St', city: 'Toronto', province: 'ON', postalCode: 'M5J 2S1' },
    idVerification: { status: 'verified', idType: 'Passport', idNumberMasked: 'PE****91', verifiedBy: 'Aarav Patel' },
    commission: {
      amount: 52.5, // $35 * 1.5
      status: 'paid',
      payoutDate: '2026-01-01',
      isClawbackFlagged: false,
      daysActiveBeforeCancel: 240,
      multiplierUsed: 1.5,
      clawbackReason: 'Line was active for 240 days (exceeds 180-day threshold). Rep keeps upfront commission.',
    },
  },
];

export const TelecomStorage = {
  getCustomers(): CustomerRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (data) {
        return JSON.parse(data);
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
      salesRep: 'Unassigned', // Enters Master Unassigned Pool!
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

  deleteCustomer(id: string): void {
    const customers = this.getCustomers().filter((c) => c.id !== id);
    this.saveCustomers(customers);
  },

  getPlans(): Plan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLANS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to read plans', e);
    }
    this.savePlans(INITIAL_PLANS);
    return INITIAL_PLANS;
  },

  savePlans(plans: Plan[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
    } catch (e) {
      console.error('Failed to save plans', e);
    }
  },

  getCMS(): CMSConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CMS);
      if (data) {
        return JSON.parse(data);
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
    return volumes[cohort] || 45;
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
    const customers = this.getCustomers();
    const currentCohort = new Date().toISOString().substring(0, 7);
    const cohorts = Object.keys(volumes).sort().reverse();

    return cohorts.map((cohort) => {
      const count = volumes[cohort] || 0;
      const { tier, rate } = getResidualTierForCount(count);

      const cohortCustomers = customers.filter(
        (c) => c.status === 'active_line' && (c.residual?.activationCohort === cohort || c.activationStartDate?.startsWith(cohort))
      );

      const activeSubscribers = cohortCustomers.length;
      const totalMonthlyBilling = cohortCustomers.reduce((sum, c) => sum + (c.monthlyPlanPrice || 27), 0);
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
