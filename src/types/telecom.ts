export type CustomerStatus = 'lead' | 'active_line' | 'non_active_line';

export type LeadFollowUpStatus = 'new' | 'contacted' | 'callback_scheduled' | 'qualified' | 'lost';

export type CommissionStatus = 'pending' | 'paid' | 'clawback';

export type IdVerificationStatus = 'unverified' | 'pending' | 'verified' | 'failed';

export type RoamingScope = 'China-Canada' | 'China-US-Canada-Mexico';

export const MASTER_ADMIN_EMAIL = 'Jackysumaple@gmail.com';

export interface PeerPermission {
  peerName: string; // Name of the peer sales rep (e.g., 'Chloe Martin')
  viewLeads: boolean;
  viewActiveLines: boolean;
  viewNonActiveLines: boolean;
}

export interface Plan {
  id: string;
  name: string;
  dataAllowance: string;
  monthlyPrice: number;
  regularPrice: number;
  speedTier: string;
  network: string;
  roamingScope: RoamingScope;
  roamingHighlight: string;
  features: string[];
  badge?: string;
  popular?: boolean;
  commissionRate: number; // Base rate or reference
  active: boolean;
  notes?: string;
  display_order?: number; // Integer sorting order for pricing grid
}

export interface CommissionRecord {
  amount: number;
  status: CommissionStatus;
  payoutDate?: string;
  isClawbackFlagged: boolean;
  clawbackReason?: string;
  clawbackTriggeredAt?: string;
  daysActiveBeforeCancel?: number;
  multiplierUsed?: number; // e.g. 1.5x
  multiplierLockedAt?: string; // ISO timestamp when multiplier was permanently locked to activation
}

export interface ResidualRecord {
  activationCohort: string; // YYYY-MM
  lockedResidualRate: number; // 0.07 (Tier 1) or 0.09 (Tier 2)
  monthlyResidualAmount: number; // monthlyPrice * lockedResidualRate while active
  tierLabel: 'Tier 1 (7%)' | 'Tier 2 (9%)';
}

export interface IdVerificationRecord {
  status: IdVerificationStatus;
  idType?: 'Driver License' | 'Passport' | 'PR Card' | 'Provincial ID' | 'Other';
  idNumberMasked?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface CustomerAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface CustomerRecord {
  id: string;
  status: CustomerStatus;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  preferredPlanId: string;
  preferredPlanName: string;
  monthlyPlanPrice: number;
  salesRep: string; // "Unassigned" for master pool, or specific rep name
  referralSource?: string;
  submittedAt: string; // ISO date
  callbackTimePreference?: string;
  notes: string;
  leadFollowUpStatus?: LeadFollowUpStatus;

  // Active / Non-active line data
  activatedPhone?: string;
  simType?: 'eSIM' | 'Physical SIM';
  activationStartDate?: string; // YYYY-MM-DD
  deactivationDate?: string; // YYYY-MM-DD
  imeiOrSimNumber?: string;
  
  // Personal & Verification
  address?: CustomerAddress;
  idVerification: IdVerificationRecord;

  // Commission & Chargeback tracking (Upfront)
  commission: CommissionRecord;

  // Residual tracking (Monthly lifetime while active)
  residual?: ResidualRecord;

  // Lead assignment history
  assignedBy?: string;
  assignedAt?: string;

  // Soft Delete & Trash / Recycle Bin tracking
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  originalStatus?: CustomerStatus;
}

export interface MonthlyCohortSummary {
  cohortMonth: string; // e.g. "2026-11"
  cohortName: string; // e.g. "November 2026"
  totalActivationsInMonth: number;
  tier: 'Tier 1 (7%)' | 'Tier 2 (9%)';
  lockedResidualRate: number; // 0.07 or 0.09
  activeSubscribers: number;
  totalMonthlyBilling: number;
  monthlyResidualPayout: number;
  isCurrentMonth: boolean;
  isOverridden?: boolean;
  updatedAt?: string;
}

export interface CMSConfig {
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  heroPromoPrice: string;
  heroPromoData: string;
  heroImage: string;
  announcementBarText: string;
  announcementActive: boolean;
  supportPhone: string;
  supportEmail: string;
  whatsappNumber: string;
  businessHours: string;
  dealerLocation: string;
  roamingFinePrint: string;

  // Feature 2: Left Column Checkmark Feature List
  heroFeature1: string; // "Free China-Canada Roaming"
  heroFeature2: string; // "Complimentary Chinese Phone #"
  heroFeature3: string; // "Unlimited Calling to 9 Countries"
  heroFeature4: string; // "Free Instant eSIM QR Code"

  // Feature 2: Right Side Graphic Card
  heroCardTag: string; // "DUAL NUMBER SERVICE"
  heroCardTitle: string; // "Canada + China Dual Line"
  heroCardPrice: string; // "$27/mo"
  heroCardSubtitle: string; // "Telus 5G eSIM"
  heroBox1Title: string; // "4 Countries"
  heroBox1Sub: string; // "Free Roaming"
  heroBox2Title: string; // "China #"
  heroBox2Sub: string; // "Included Free"
  heroBox3Title: string; // "9 Nations"
  heroBox3Sub: string; // "Unlimited Talk"
}

export interface StaffRep {
  id: string;
  name: string;
  username: string; // account login username
  role: 'super_admin' | 'admin' | 'sales_rep' | 'manager';
  email: string;
  phone: string;
  avatarColor: string;
  password?: string;
  commissionMultiplier: number; // 0.5x to 2.0x (Master Admin only)
  multiplierUpdatedAt?: string; // ISO timestamp when multiplier was last changed
  isAccessRevoked: boolean; // Instant revocation of access
  allowedViewRepNames?: string[]; // Legacy fallback
  peerPermissions?: PeerPermission[]; // Granular peer visibility toggles: [Leads, Active Lines, Non-Active Lines]
  isMasterAdmin?: boolean; // Strictly bound to Jackysumaple@gmail.com
}
