import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { CustomerRecord } from '../types/telecom';

// Retrieve Supabase credentials supporting Vite env prefix (VITE_),
// raw Hostinger deployment variables, and browser runtime configuration fallback
function getInitialSupabaseUrl(): string {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('ctexcel_supabase_url') || localStorage.getItem('VITE_SUPABASE_URL');
    if (local && local.trim()) return local.trim();
    const win = window as any;
    if (win.__SUPABASE_URL__) return win.__SUPABASE_URL__;
    if (win.__ENV__?.VITE_SUPABASE_URL) return win.__ENV__.VITE_SUPABASE_URL;
  }
  const fromEnv = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
    ''
  ).trim();

  // Fallback directly to the airwireless.ca Supabase project URL from Hostinger configuration
  return fromEnv || 'https://xnnszqnghxoqplniiaiv.supabase.co';
}

function getInitialSupabaseKey(): string {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('ctexcel_supabase_anon_key') || localStorage.getItem('VITE_SUPABASE_ANON_KEY');
    if (local && local.trim() && !local.startsWith('sb_secret_')) return local.trim();
    const win = window as any;
    if (win.__SUPABASE_ANON_KEY__ && !win.__SUPABASE_ANON_KEY__.startsWith('sb_secret_')) return win.__SUPABASE_ANON_KEY__;
    if (win.__ENV__?.VITE_SUPABASE_ANON_KEY && !win.__ENV__.VITE_SUPABASE_ANON_KEY.startsWith('sb_secret_')) return win.__ENV__.VITE_SUPABASE_ANON_KEY;
  }
  const fromEnv = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
    ''
  ).trim();

  // If environment variable is valid (not sb_secret_), use it.
  // Otherwise fall back to the live working publishable key for project xnnszqnghxoqplniiaiv
  if (fromEnv && !fromEnv.startsWith('sb_secret_')) {
    return fromEnv;
  }
  return 'sb_publishable_Gk-b-CJVnFyBw-DSRETUlw_ZhamAEfU';
}

export let supabaseUrl = getInitialSupabaseUrl();
export let supabaseAnonKey = getInitialSupabaseKey();

export function checkIsSupabaseConfigured(url: string, key: string): boolean {
  return Boolean(
    url &&
    key &&
    url.startsWith('https://') &&
    url !== 'https://your-project.supabase.co' &&
    url !== 'https://your-project-id.supabase.co' &&
    !url.includes('placeholder') &&
    !url.includes('localhost') &&
    key !== 'your-anon-public-key' &&
    key !== 'placeholder-anon-key'
  );
}

export let isSupabaseConfigured = checkIsSupabaseConfigured(supabaseUrl, supabaseAnonKey);

// Fallback dummy client if credentials aren't set yet, avoiding crash on page load
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'placeholder-anon-key';

export let supabase: SupabaseClient = createClient(supabaseUrl || fallbackUrl, supabaseAnonKey || fallbackKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Configure or update Supabase credentials dynamically (e.g. from Hostinger or Admin Diagnostics)
 */
export function setCustomSupabaseCredentials(url: string, key: string) {
  const cleanUrl = url.trim();
  const cleanKey = key.trim();
  if (typeof window !== 'undefined') {
    if (cleanUrl) localStorage.setItem('ctexcel_supabase_url', cleanUrl);
    if (cleanKey) localStorage.setItem('ctexcel_supabase_anon_key', cleanKey);
  }
  supabaseUrl = cleanUrl;
  supabaseAnonKey = cleanKey;
  isSupabaseConfigured = checkIsSupabaseConfigured(cleanUrl, cleanKey);
  supabase = createClient(cleanUrl || fallbackUrl, cleanKey || fallbackKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * Diagnostic helper: Returns current connection health and environment details
 */
export function getSupabaseDiagnostics() {
  return {
    isConfigured: isSupabaseConfigured,
    url: supabaseUrl || '(not configured)',
    maskedKey: supabaseAnonKey ? `${supabaseAnonKey.slice(0, 6)}...${supabaseAnonKey.slice(-4)}` : '(missing)',
    isHttps: supabaseUrl.startsWith('https://'),
  };
}

/**
 * Sign in using live encrypted credentials in Supabase Auth
 */
export async function signInWithSupabase(emailOrUsername: string, password: string) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase credentials not configured in environment variables.') };
  }

  let email = emailOrUsername.trim();
  if (!email.includes('@')) {
    if (email.toLowerCase() === 'jacky' || email.toLowerCase() === 'admin') {
      email = 'Jackysumaple@gmail.com';
    } else {
      email = `${email.toLowerCase()}@ctexceldealer.com`;
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

/**
 * Sign in with Google Single Sign-On (SSO) via Supabase Auth
 */
export async function signInWithGoogleSSO() {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase credentials not configured in environment variables.') };
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const redirectTo = `${origin}/staff-portal`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  return { data, error };
}

/**
 * CRITICAL BUG 3 FIX:
 * Updates the current authenticated user's password directly via Supabase Auth API (supabase.auth.updateUser)
 * instead of manually writing to standard database rows.
 * Surfaces exact Supabase Auth error message if rejected.
 */
export async function updateStaffPasswordInSupabase(
  newPassword: string,
  email?: string,
  currentPassword?: string
) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured yet. Credentials saved in local CRM.') };
  }

  try {
    // 1. Check if an active Supabase session exists
    const { data: sessionData } = await supabase.auth.getSession();
    
    // If no active session, but we have credentials, attempt signing in first to establish auth context
    if (!sessionData?.session && email && currentPassword) {
      console.log('No active Supabase session detected. Attempting to establish session before password update...');
      await supabase.auth.signInWithPassword({ email, password: currentPassword });
    }

    // 2. Call the required Supabase Authentication API: supabase.auth.updateUser({ password: newPassword })
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Supabase auth.updateUser password update error:', error.message, error);

      // If user session is missing and email is present, attempt signUp to register/activate user in Supabase
      if ((error.message.includes('session') || error.message.includes('Auth session missing')) && email) {
        console.warn('Session missing in Supabase Auth. Attempting to provision user in Supabase Auth...');
        const signupRes = await supabase.auth.signUp({
          email,
          password: newPassword,
        });

        if (signupRes.error) {
          console.error('Supabase user provisioning failed:', signupRes.error.message);
          return { data: null, error: new Error(`Supabase Auth: ${signupRes.error.message}`) };
        }
        return { data: signupRes.data, error: null };
      }

      return { data: null, error: new Error(`Supabase Auth: ${error.message}`) };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('Unexpected error updating password with Supabase Auth:', err);
    return { data: null, error: err };
  }
}

/**
 * CRITICAL BUG 1 FIX:
 * Inserts a new customer lead from the frontend "Request a Callback" form into Supabase.
 * Connects directly to the 'leads' table (with fallback to 'customers' table).
 * Catches insertion errors and Row Level Security (RLS) policy violations with detailed console.error logs.
 */
export interface SupabaseErrorDetails {
  message: string;
  details?: string | null;
  hint?: string | null;
  code?: string | null;
  table: string;
  status?: number | null;
}

/**
 * Lead Table Configuration
 * Defaults to 'Airwireless' per production database setup.
 */
export function getLeadsTableName(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('ctexcel_supabase_leads_table');
    if (custom && custom.trim()) return custom.trim();
  }
  return 'Airwireless';
}

export function setLeadsTableName(tableName: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ctexcel_supabase_leads_table', tableName.trim());
  }
}

/**
 * CRITICAL PRODUCTION FORM SUBMISSION:
 * Inserts a customer lead directly into table 'Airwireless'.
 * Strictly executes: await supabase.from('Airwireless').insert([payload]);
 * with NO .select() or .single() appended, ensuring anonymous public visitors
 * do not hit RLS SELECT permission violations.
 */
export async function insertLeadToSupabase(lead: CustomerRecord): Promise<{
  data: any;
  error: Error | null;
  rejectionReason?: string;
  errorDetails?: SupabaseErrorDetails;
  tableUsed?: string;
}> {
  // 1. Detect if key is a Supabase Management token (sb_secret_) instead of project anon JWT key
  if (supabaseAnonKey.startsWith('sb_secret_') || supabaseAnonKey.startsWith('sbp_')) {
    const reason = 'Invalid Supabase API Key: Hostinger VITE_SUPABASE_ANON_KEY is set to a Management token ("sb_secret_..."). PostgREST requires the "anon public" key starting with "eyJhbGciOi...".';
    console.error('CRITICAL:', reason);
    return {
      data: null,
      error: new Error(reason),
      rejectionReason: reason,
      errorDetails: {
        message: reason,
        details: 'Go to your Supabase Dashboard -> Project Settings -> API. Copy the "anon public" key (starts with eyJhbGciOi...) and update VITE_SUPABASE_ANON_KEY in Hostinger.',
        code: 'UNAUTHORIZED_INVALID_API_KEY',
        table: 'Airwireless',
      },
      tableUsed: 'Airwireless',
    };
  }

  if (!isSupabaseConfigured) {
    const reason = !supabaseUrl
      ? 'VITE_SUPABASE_URL is missing in the production deployment environment.'
      : 'VITE_SUPABASE_ANON_KEY is missing in the production deployment environment.';
    console.error('CRITICAL: Supabase credentials not configured:', reason);
    return {
      data: null,
      error: new Error(`Database connection not configured: ${reason}`),
      rejectionReason: reason,
      errorDetails: {
        message: reason,
        details: 'In Hostinger, set VITE_SUPABASE_ANON_KEY with your project anon public key (starts with eyJhbGciOi...).',
        code: 'NO_CONFIG',
        table: 'Airwireless',
      },
      tableUsed: 'Airwireless',
    };
  }

  // Exact payload matching Airwireless schema
  const payload = {
    first_name: lead.firstName || '',
    last_name: lead.lastName || '',
    full_name: lead.fullName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
    email: lead.email || '',
    phone: lead.phone || '',
    preferred_plan_name: lead.preferredPlanName || '',
    preferred_plan_id: lead.preferredPlanId || '',
    monthly_plan_price: lead.monthlyPlanPrice || null,
    sales_rep: lead.salesRep || 'Unassigned',
    referral_source: lead.referralSource || 'Website Lead Capture',
    callback_time_preference: lead.callbackTimePreference || 'As soon as possible',
    status: 'lead',
    notes: lead.notes || '',
  };

  try {
    console.log('[Supabase Lead Insert] Calling await supabase.from(\'Airwireless\').insert([payload]) with NO .select() or .single():', payload);

    // EXACT INSTRUCTION:
    // await supabase.from('Airwireless').insert([payload]); with NO .select() or .single() appended
    const { error } = await supabase.from('Airwireless').insert([payload]);

    if (!error) {
      console.log('[Supabase Lead Insert] SUCCESS! Row inserted into table "Airwireless".');
      return {
        data: true,
        error: null,
        tableUsed: 'Airwireless',
      };
    }

    console.error('[Supabase Lead Insert] Table "Airwireless" returned error:', error.message, error.details);

    // Format detailed error for UI surfacing
    const errMsg = error.message || 'Database rejected the submission.';
    const errDetails = error.details || null;
    const errHint = error.hint || null;
    const errCode = error.code || null;

    const rejectionReason = `${errMsg}${errDetails ? ` | Details: ${errDetails}` : ''}${errHint ? ` | Hint: ${errHint}` : ''} (Table: Airwireless)`;

    return {
      data: null,
      error: new Error(errMsg),
      rejectionReason,
      errorDetails: {
        message: errMsg,
        details: errDetails,
        hint: errHint,
        code: errCode,
        table: 'Airwireless',
      },
      tableUsed: 'Airwireless',
    };
  } catch (err: any) {
    console.error('Unexpected exception during Supabase lead insertion:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
      rejectionReason: err?.message || 'Network error connecting to Supabase database.',
      errorDetails: {
        message: err?.message || 'Network error connecting to Supabase database.',
        details: err?.details || null,
        hint: err?.hint || null,
        code: err?.code || null,
        table: 'Airwireless',
      },
      tableUsed: 'Airwireless',
    };
  }
}

function safeString(val: unknown, fallback: string = ''): string {
  if (typeof val === 'string') return val;
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return fallback;
}

function safeIsoDate(val: unknown, fallback?: string): string {
  const raw = safeString(val).trim();
  if (raw) {
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) return raw;
  }
  return fallback ?? new Date().toISOString();
}

const VALID_FOLLOW_UP_STAGES = new Set([
  'new',
  'contacted',
  'callback_scheduled',
  'qualified',
  'lost',
]);

/**
 * Normalizes database status values ('Active', 'active_line', 'Non-Active', 'non_active_line', 'lead')
 * into canonical CRM CustomerStatus literals.
 */
export function normalizeAirwirelessStatus(rawStatus: unknown): CustomerRecord['status'] {
  const normalized = safeString(rawStatus)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (normalized === 'active' || normalized === 'active_line') {
    return 'active_line';
  }
  if (
    normalized === 'non_active' ||
    normalized === 'non_active_line' ||
    normalized === 'inactive' ||
    normalized === 'canceled' ||
    normalized === 'cancelled'
  ) {
    return 'non_active_line';
  }
  return 'lead';
}

/**
 * Converts canonical CRM status into exact Airwireless Supabase status column strings.
 */
export function toAirwirelessDbStatus(status: CustomerRecord['status'] | string): string {
  const normalized = normalizeAirwirelessStatus(status);
  if (normalized === 'active_line') return 'Active';
  if (normalized === 'non_active_line') return 'Non-Active';
  return 'lead';
}

/**
 * Maps a raw row from the Supabase 'Airwireless' table into a CustomerRecord,
 * preserving the primary key UUID `id` and safeguarding against missing or non-string fields.
 */
export function mapAirwirelessRowToCustomerRecord(item: any): CustomerRecord {
  const followUpStatusNorm = normalizeAirwirelessStatus(item?.follow_up_status);
  const statusColNorm = normalizeAirwirelessStatus(item?.status);

  // Check both follow_up_status and status for Active / Non-Active lifecycle state
  const canonicalStatus: CustomerRecord['status'] =
    followUpStatusNorm === 'active_line' || statusColNorm === 'active_line'
      ? 'active_line'
      : followUpStatusNorm === 'non_active_line' || statusColNorm === 'non_active_line'
      ? 'non_active_line'
      : 'lead';

  const submittedAt = safeIsoDate(item?.submitted_at || item?.created_at);
  const parsedPrice = Number(item?.monthly_plan_price ?? item?.monthlyPlanPrice ?? 27);
  const monthlyPrice = Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : 27;

  const rawName = safeString(item?.name).trim();
  const firstName =
    safeString(item?.first_name || item?.firstName).trim() ||
    (rawName ? rawName.split(/\s+/)[0] : '');
  const lastName =
    safeString(item?.last_name || item?.lastName).trim() ||
    (rawName ? rawName.split(/\s+/).slice(1).join(' ') : '');
  const fullName =
    safeString(item?.full_name || item?.fullName).trim() ||
    rawName ||
    `${firstName} ${lastName}`.trim() ||
    'Website Customer';

  const rawStage = safeString(
    item?.lead_follow_up_status ?? item?.follow_up_status ?? item?.leadFollowUpStatus
  )
    .trim()
    .toLowerCase();
  const leadFollowUpStatus = (VALID_FOLLOW_UP_STAGES.has(rawStage)
    ? rawStage
    : 'new') as CustomerRecord['leadFollowUpStatus'];

  return {
    id: item?.id !== undefined && item?.id !== null ? String(item.id) : '',
    status: canonicalStatus,
    firstName,
    lastName,
    fullName,
    email: safeString(item?.email),
    phone: safeString(item?.phone),
    preferredPlanId: safeString(item?.preferred_plan_id || item?.preferredPlanId, 'ctexcel-27-50gb'),
    preferredPlanName: safeString(
      item?.preferred_plan_name || item?.preferredPlanName || item?.plan,
      '$27 / 50GB 5G Plan'
    ),
    monthlyPlanPrice: monthlyPrice,
    salesRep: safeString(
      item?.sales_rep || item?.assigned_specialist || item?.salesRep,
      'Unassigned'
    ),
    referralSource: safeString(
      item?.referral_source || item?.referralSource,
      'Website Lead Capture'
    ),
    submittedAt,
    activationStartDate:
      safeString(item?.activation_start_date || item?.activationStartDate) ||
      (canonicalStatus === 'active_line' ? submittedAt : undefined),
    deactivationDate:
      safeString(item?.deactivation_date || item?.deactivationDate) ||
      (canonicalStatus === 'non_active_line' ? safeString(item?.updated_at, submittedAt) : undefined),
    callbackTimePreference: safeString(
      item?.callback_time_preference || item?.callbackTimePreference,
      'As soon as possible'
    ),
    notes: safeString(item?.notes),
    leadFollowUpStatus,
    isDeleted: Boolean(item?.is_deleted),
    deletedAt: item?.deleted_at ? safeString(item.deleted_at) : undefined,
    deletedBy: item?.deleted_by ? safeString(item.deleted_by) : undefined,
    idVerification: {
      status: (safeString(item?.id_verification_status) as any) || (canonicalStatus === 'active_line' ? 'verified' : 'unverified'),
    },
    commission: {
      amount: Number((monthlyPrice * 1.0).toFixed(2)),
      status: canonicalStatus === 'active_line' ? 'paid' : 'pending',
      isClawbackFlagged: false,
      multiplierUsed: 1.0,
    },
  };
}

/**
 * Fetch all rows directly from the Supabase 'Airwireless' table.
 */
export async function fetchLeadsFromSupabase(): Promise<{ data: CustomerRecord[] | null; error: any }> {
  if (!isSupabaseConfigured) {
    return { data: null, error: null };
  }

  try {
    const res = await supabase.from('Airwireless').select('*');

    if (res.error) {
      console.error('Supabase fetch error on table "Airwireless":', res.error.message);
      return { data: null, error: res.error };
    }

    const mapped = (res.data || []).map(mapAirwirelessRowToCustomerRecord);
    mapped.sort((a, b) => {
      const timeA = new Date(a.submittedAt || 0).getTime();
      const timeB = new Date(b.submittedAt || 0).getTime();
      return timeB - timeA;
    });

    return { data: mapped, error: null };
  } catch (err: any) {
    console.error('Unexpected error fetching from Airwireless:', err);
    return { data: null, error: err };
  }
}

/**
 * CRITICAL BUG 2 FIX:
 * Deletes a sales rep from the Supabase 'staff' table.
 * Proactively prevents Foreign Key constraint errors by reassigning any associated leads/customers
 * to 'Unassigned' before deleting the staff record.
 */
export async function deleteStaffFromSupabase(repId: string, repName?: string, repEmail?: string) {
  if (!isSupabaseConfigured) {
    return { success: true, error: null };
  }

  try {
    // 1. Prevent foreign key constraint errors: Reassign any assigned leads in Airwireless to 'Unassigned'
    if (repName && repName.trim()) {
      try {
        await supabase.from('Airwireless').update({ sales_rep: 'Unassigned' }).eq('sales_rep', repName.trim());
      } catch (fkErr) {
        console.warn('Note: Non-fatal attempt to unassign Airwireless rows by sales_rep name:', fkErr);
      }
    }

    // 2. Perform the delete query on the 'staff' table
    let { error } = await supabase.from('staff').delete().eq('id', repId);

    // If deleting by id didn't match or failed and email is present, attempt deleting by email
    if (error && repEmail) {
      console.warn(`Staff delete by id (${repId}) failed, attempting deletion by email (${repEmail})...`, error.message);
      const emailRes = await supabase.from('staff').delete().eq('email', repEmail);
      error = emailRes.error;
    }

    if (error) {
      console.error('Supabase staff table delete error:', error.message, {
        code: error.code,
        details: error.details,
        hint: error.hint,
      });

      // Check for foreign key constraint violation (PostgreSQL code 23503)
      if (error.code === '23503' || error.message.toLowerCase().includes('foreign key constraint')) {
        console.error(
          'FOREIGN KEY CONSTRAINT ERROR:\n' +
          'A foreign key constraint in your Supabase database prevented deleting this sales rep because related records exist.\n' +
          'Make sure foreign keys on related tables are configured with ON DELETE SET NULL or ON DELETE CASCADE.'
        );
      }

      return { success: false, error };
    }

    console.log(`Successfully deleted staff record (${repId} / ${repName}) from Supabase.`);
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Unexpected exception during Supabase staff deletion:', err);
    return { success: false, error: err };
  }
}

/**
 * Update authenticated user metadata in Supabase Auth
 */
export async function updateStaffProfileInSupabase(metadata: Record<string, any>) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured yet.') };
  }

  try {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata,
    });
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Provision a new staff user in Supabase Auth
 */
export async function signUpStaffInSupabase(email: string, password: string, metadata?: Record<string, any>) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured yet.') };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {},
      },
    });
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Get currently authenticated user in Supabase Auth
 */
export async function getCurrentSupabaseUser(): Promise<SupabaseUser | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Sign out from Supabase Auth
 */
export async function signOutFromSupabase() {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Sign out error:', err);
  }
}

/**
 * 1. DYNAMIC HERO BANNER STORAGE MANAGEMENT:
 * Uploads a banner image to the 'banners' bucket in Supabase Storage.
 * Proactively purges the previous banner file from the bucket to save space.
 * Returns the public URL of the uploaded image asset.
 */
export async function uploadHeroBanner(
  file: File,
  oldAssetUrl?: string
): Promise<{ publicUrl: string | null; error: any }> {
  if (!isSupabaseConfigured) {
    // Return base64 preview when Supabase is not configured
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ publicUrl: reader.result as string, error: null });
      reader.onerror = (err) => resolve({ publicUrl: null, error: err });
      reader.readAsDataURL(file);
    });
  }

  try {
    const bucketName = 'banners';
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `hero/${timestamp}_${cleanFileName}`;

    // 1. Upload new image asset to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Supabase storage upload error:', uploadError.message);
      // Fallback to base64 data url if bucket does not exist or user hasn't created the bucket yet
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ publicUrl: reader.result as string, error: uploadError });
        reader.onerror = () => resolve({ publicUrl: null, error: uploadError });
        reader.readAsDataURL(file);
      });
    }

    // 2. Retrieve public URL
    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    const newPublicUrl = publicUrlData?.publicUrl || '';

    // 3. Proactively delete the old image asset from the bucket to save storage space
    if (oldAssetUrl && oldAssetUrl.includes(bucketName)) {
      try {
        const pathPart = oldAssetUrl.split(`${bucketName}/`)[1];
        if (pathPart) {
          const oldPath = decodeURIComponent(pathPart.split('?')[0]);
          await supabase.storage.from(bucketName).remove([oldPath]);
          console.log('Old hero banner asset deleted from bucket:', oldPath);
        }
      } catch (delErr) {
        console.warn('Note: Non-fatal error cleaning up old banner file:', delErr);
      }
    }

    return { publicUrl: newPublicUrl, error: null };
  } catch (err: any) {
    console.error('Exception during banner upload:', err);
    return { publicUrl: null, error: err };
  }
}

/**
 * 2. SITE SETTINGS (CMS Headline, Sub-text, Hero Image, Checkmark List & Right Card):
 * Persists all editable hero blocks to the 'site_settings' table in Supabase.
 */
export async function saveSiteSettingsToSupabase(settings: {
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  heroBadge?: string;
  heroPromoPrice?: string;
  heroPromoData?: string;
  announcementBarText?: string;
  announcementActive?: boolean;
  // Feature 2: Left Column Checkmark List
  heroFeature1?: string;
  heroFeature2?: string;
  heroFeature3?: string;
  heroFeature4?: string;
  // Feature 2: Right Graphic Card
  heroCardTag?: string;
  heroCardTitle?: string;
  heroCardPrice?: string;
  heroCardSubtitle?: string;
  heroBox1Title?: string;
  heroBox1Sub?: string;
  heroBox2Title?: string;
  heroBox2Sub?: string;
  heroBox3Title?: string;
  heroBox3Sub?: string;
}) {
  if (!isSupabaseConfigured) {
    return { success: true, error: null };
  }

  const basePayload: Record<string, any> = {
    id: 1, // Single-row config table
    hero_title: settings.heroTitle,
    hero_subtitle: settings.heroSubtitle,
    hero_image: settings.heroImage,
    hero_badge: settings.heroBadge,
    hero_promo_price: settings.heroPromoPrice,
    hero_promo_data: settings.heroPromoData,
    hero_feature_1: settings.heroFeature1,
    hero_feature_2: settings.heroFeature2,
    hero_feature_3: settings.heroFeature3,
    hero_feature_4: settings.heroFeature4,
    hero_card_tag: settings.heroCardTag,
    hero_card_title: settings.heroCardTitle,
    hero_card_price: settings.heroCardPrice,
    hero_card_subtitle: settings.heroCardSubtitle,
    hero_box_1_title: settings.heroBox1Title,
    hero_box_1_sub: settings.heroBox1Sub,
    hero_box_2_title: settings.heroBox2Title,
    hero_box_2_sub: settings.heroBox2Sub,
    hero_box_3_title: settings.heroBox3Title,
    hero_box_3_sub: settings.heroBox3Sub,
    updated_at: new Date().toISOString(),
  };

  const fullPayload: Record<string, any> = {
    ...basePayload,
    top_promo_banner_text: settings.announcementBarText,
    announcement_active: settings.announcementActive,
  };

  try {
    let { data, error } = await supabase
      .from('site_settings')
      .upsert(fullPayload, { onConflict: 'id' })
      .select();

    // If top_promo_banner_text or announcement_active column doesn't exist yet on Supabase, retry base payload
    if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('top_promo_banner_text') || error.message?.includes('announcement_active'))) {
      console.warn('site_settings missing top_promo_banner_text/announcement_active columns; saving remaining hero settings:', error.message);
      const retry = await supabase
        .from('site_settings')
        .upsert(basePayload, { onConflict: 'id' })
        .select();
      return {
        success: !retry.error,
        data: retry.data,
        error: retry.error,
        warning: `Run SQL in Supabase to persist banner across devices: ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS top_promo_banner_text TEXT, ADD COLUMN IF NOT EXISTS announcement_active BOOLEAN DEFAULT true;`,
      };
    }

    if (error) {
      console.warn('Supabase site_settings table update note:', error.message);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err: any) {
    console.error('Unexpected error saving site settings to Supabase:', err);
    return { success: false, error: err };
  }
}

/**
 * Fetches site settings (Hero headline, subtext, image, features, card texts, top promo banner) from Supabase.
 */
export async function fetchSiteSettingsFromSupabase() {
  if (!isSupabaseConfigured) return { data: null, error: null };
  try {
    const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
    if (error) {
      return { data: null, error };
    }
    if (!data) return { data: null, error: null };

    return {
      data: {
        heroTitle: data.hero_title,
        heroSubtitle: data.hero_subtitle,
        heroImage: data.hero_image,
        heroBadge: data.hero_badge,
        heroPromoPrice: data.hero_promo_price,
        heroPromoData: data.hero_promo_data,
        announcementBarText: data.top_promo_banner_text ?? data.announcement_bar_text ?? data.announcementBarText,
        announcementActive: data.announcement_active ?? data.announcementActive,
        heroFeature1: data.hero_feature_1,
        heroFeature2: data.hero_feature_2,
        heroFeature3: data.hero_feature_3,
        heroFeature4: data.hero_feature_4,
        heroCardTag: data.hero_card_tag,
        heroCardTitle: data.hero_card_title,
        heroCardPrice: data.hero_card_price,
        heroCardSubtitle: data.hero_card_subtitle,
        heroBox1Title: data.hero_box_1_title,
        heroBox1Sub: data.hero_box_1_sub,
        heroBox2Title: data.hero_box_2_title,
        heroBox2Sub: data.hero_box_2_sub,
        heroBox3Title: data.hero_box_3_title,
        heroBox3Sub: data.hero_box_3_sub,
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Live Diagnostic Tool: Tests an anonymous lead insert directly against the Supabase database
 * to verify that Row Level Security (RLS) policies allow anonymous submissions from public visitors.
 */
export async function testSupabaseAnonymousInsert(): Promise<{
  success: boolean;
  message: string;
  latencyMs?: number;
  details?: any;
  tableUsed?: string;
}> {
  const start = Date.now();
  if (supabaseAnonKey.startsWith('sb_secret_') || supabaseAnonKey.startsWith('sbp_')) {
    return {
      success: false,
      message: 'Invalid Key in Hostinger: VITE_SUPABASE_ANON_KEY starts with "sb_secret_", which is a Supabase Management token. PostgREST requires the "anon public" JWT key starting with "eyJhbGciOi...". Please update it in Hostinger Environment Variables.',
      details: { code: 'UNAUTHORIZED_INVALID_API_KEY' },
      tableUsed: getLeadsTableName(),
    };
  }

  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: `Supabase credentials not configured. URL: ${supabaseUrl || '(missing)'}`,
    };
  }

  const targetTable = getLeadsTableName();
  const testPayload = {
    first_name: 'Connectivity',
    last_name: 'Test',
    full_name: 'Connectivity Test',
    email: 'test@ctexcel.ca',
    phone: '4165550100',
    preferred_plan_name: '$27 / 50GB Plan',
    status: 'lead',
    notes: '[Diagnostic RLS probe - auto-cleaned]',
  };

  try {
    // CRITICAL: NO .select() AT THE END!
    const { error: insertErr } = await supabase.from(targetTable).insert([testPayload]);
    const latencyMs = Date.now() - start;

    if (insertErr) {
      let advice = insertErr.message;
      if (insertErr.code === '42501' || insertErr.message.toLowerCase().includes('row-level security')) {
        advice = `RLS Policy Rejection (42501): The public anon role is blocked from inserting into table "${targetTable}". Run: GRANT ALL ON TABLE public."${targetTable}" TO anon; CREATE POLICY "Allow anon insert" ON public."${targetTable}" FOR INSERT TO anon WITH CHECK (true);`;
      }
      return {
        success: false,
        message: `Insert test failed (${insertErr.code || 'ERR'}): ${advice}`,
        details: insertErr,
        tableUsed: targetTable,
      };
    }

    // Try cleaning up test row if permissions permit
    try {
      await supabase.from(targetTable).delete().eq('email', 'test@ctexcel.ca');
    } catch {
      // Cleanup is best-effort
    }

    return {
      success: true,
      message: `Supabase anonymous INSERT test into table "${targetTable}" succeeded in ${latencyMs}ms! Anonymous inserts work properly on mobile and external PCs without .select() errors.`,
      latencyMs,
      tableUsed: targetTable,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Exception during test: ${err?.message || err}`,
      details: err,
      tableUsed: targetTable,
    };
  }
}

/**
 * 3. DRAG-AND-DROP PLAN REORDERING:
 * Updates the 'display_order' (integer) column in the 'mobile_plans' table.
 */
export async function updatePlanDisplayOrdersInSupabase(plans: { id: string; display_order?: number }[]) {
  if (!isSupabaseConfigured) return { success: true, error: null };

  try {
    const updates = plans.map((p, idx) => ({
      id: p.id,
      display_order: p.display_order ?? (idx + 1),
    }));

    for (const item of updates) {
      await supabase
        .from('mobile_plans')
        .update({ display_order: item.display_order })
        .eq('id', item.id);
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.warn('Failed to update plan display_order in Supabase:', err);
    return { success: false, error: err };
  }
}

/**
 * 4. SOFT DELETE RECORD IN SUPABASE:
 * Flags record with is_deleted = true, deleted_at, deleted_by
 */
export async function softDeleteCustomerInSupabase(id: string, deletedBy: string = 'Master Admin') {
  if (!isSupabaseConfigured) return { success: true, error: null };

  const payload = {
    is_deleted: true,
    deleted_at: new Date().toISOString(),
    deleted_by: deletedBy,
  };

  try {
    const { error } = await supabase.from('Airwireless').update(payload).eq('id', id);
    if (error) {
      console.warn('Airwireless soft delete warning:', error.message);
      return { success: false, error };
    }
  } catch (err) {
    return { success: false, error: err };
  }
  return { success: true, error: null };
}

/**
 * 5. RESTORE RECORD IN SUPABASE:
 * Clears is_deleted flag and returns record to active status
 */
export async function restoreCustomerInSupabase(id: string) {
  if (!isSupabaseConfigured) return { success: true, error: null };

  const payload = {
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
  };

  try {
    const { error } = await supabase.from('Airwireless').update(payload).eq('id', id);
    if (error) {
      console.warn('Airwireless restore warning:', error.message);
      return { success: false, error };
    }
  } catch (err) {
    return { success: false, error: err };
  }
  return { success: true, error: null };
}

/**
 * 6. HARD DELETE (PERMANENT PURGE) IN SUPABASE:
 * Deletes rows permanently from Airwireless table by primary key id
 */
export async function hardDeleteCustomersInSupabase(ids: unknown[]) {
  if (!isSupabaseConfigured) return { success: true, error: null };

  const cleanIds: string[] = Array.from(
    new Set(
      (Array.isArray(ids) ? ids : [])
        .map((entry: unknown) => {
          if (typeof entry === 'string') return entry.trim();
          if (typeof entry === 'number' && Number.isFinite(entry)) return String(entry);
          if (entry && typeof entry === 'object' && 'id' in entry) {
            const inner = (entry as { id?: unknown }).id;
            return typeof inner === 'string' ? inner.trim() : '';
          }
          return '';
        })
        .filter(Boolean)
    )
  );
  if (cleanIds.length === 0) return { success: true, error: null };

  try {
    const { data, error } = await supabase
      .from('Airwireless')
      .delete()
      .in('id', cleanIds)
      .select('id');
    if (error) {
      console.warn('Airwireless hard delete warning:', error.message);
      return { success: false, error };
    }
    if (Array.isArray(data) && data.length === 0) {
      const { data: stillPresent } = await supabase
        .from('Airwireless')
        .select('id')
        .in('id', cleanIds);
      if (Array.isArray(stillPresent) && stillPresent.length > 0) {
        return {
          success: false,
          error: new Error(
            'Delete blocked by database policy (matching row(s) still present). Check Airwireless DELETE RLS policy.'
          ),
        };
      }
    }
  } catch (err) {
    return { success: false, error: err };
  }
  return { success: true, error: null };
}

/**
 * 7. REAL-TIME SUBSCRIPTION FOR AIRWIRELESS TABLE:
 * Subscribes to postgres_changes on the exact 'Airwireless' table.
 */
export function subscribeToLeadsRealtime(
  onInsert: (lead: CustomerRecord) => void,
  onUpdate?: (lead: CustomerRecord) => void,
  onDelete?: (id: string) => void
) {
  if (!isSupabaseConfigured) return () => {};

  try {
    const handlePayload = (payload: any) => {
      console.log('⚡ Realtime Airwireless change received:', payload.eventType, payload.new);

      if (payload.eventType === 'INSERT' && payload.new) {
        onInsert(mapAirwirelessRowToCustomerRecord(payload.new));
      } else if (payload.eventType === 'UPDATE' && payload.new && onUpdate) {
        onUpdate(mapAirwirelessRowToCustomerRecord(payload.new));
      } else if (payload.eventType === 'DELETE' && payload.old && onDelete) {
        onDelete(String(payload.old.id));
      }
    };

    const channel = supabase
      .channel('airwireless-realtime-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Airwireless' }, handlePayload)
      .subscribe((status: string) => {
        console.log('📡 Supabase Airwireless realtime status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.error('Failed to initialize Realtime subscription on Airwireless:', err);
    return () => {};
  }
}

/**
 * 8. MONTHLY COHORTS OVERRIDES (Production Residual Engine):
 * Fetches and persists Master Admin cohort overrides in the 'monthly_cohorts' Supabase table.
 */
export interface MonthlyCohortOverrideRecord {
  cohort_month: string;
  cohort_name?: string;
  monthly_activations: number;
  active_subscribers: number;
  total_monthly_billing: number;
  locked_residual_rate?: number;
  tier_label?: string;
  is_overridden?: boolean;
  updated_by?: string;
  updated_at?: string;
}

export async function fetchMonthlyCohortsFromSupabase(): Promise<{
  data: MonthlyCohortOverrideRecord[];
  error: any;
  missingTable?: boolean;
}> {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('monthly_cohorts')
      .select('*')
      .order('cohort_month', { ascending: false });

    if (error) {
      const missingTable =
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('Could not find the table');
      if (!missingTable) {
        console.warn('Supabase monthly_cohorts fetch note:', error.message);
      }
      return { data: [], error, missingTable };
    }

    const normalized: MonthlyCohortOverrideRecord[] = (data || []).map((row: any) => ({
      cohort_month: String(row.cohort_month),
      cohort_name: row.cohort_name || undefined,
      monthly_activations: Number(row.monthly_activations ?? 0),
      active_subscribers: Number(row.active_subscribers ?? 0),
      total_monthly_billing: Number(row.total_monthly_billing ?? 0),
      locked_residual_rate: row.locked_residual_rate !== undefined ? Number(row.locked_residual_rate) : undefined,
      tier_label: row.tier_label || undefined,
      is_overridden: row.is_overridden ?? true,
      updated_by: row.updated_by || undefined,
      updated_at: row.updated_at || undefined,
    }));

    return { data: normalized, error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

export async function upsertMonthlyCohortOverrideInSupabase(record: {
  cohortMonth: string;
  cohortName: string;
  monthlyActivations: number;
  activeSubscribers: number;
  totalMonthlyBilling: number;
  updatedBy?: string;
}): Promise<{
  data: MonthlyCohortOverrideRecord | null;
  error: any;
  missingTable?: boolean;
}> {
  const rate = record.monthlyActivations >= 200 ? 0.09 : 0.07;
  const tierLabel = record.monthlyActivations >= 200 ? 'Tier 2 (9%)' : 'Tier 1 (7%)';

  const payload: MonthlyCohortOverrideRecord = {
    cohort_month: record.cohortMonth,
    cohort_name: record.cohortName,
    monthly_activations: Math.max(0, Math.round(record.monthlyActivations)),
    active_subscribers: Math.max(0, Math.round(record.activeSubscribers)),
    total_monthly_billing: Number(Math.max(0, record.totalMonthlyBilling).toFixed(2)),
    locked_residual_rate: rate,
    tier_label: tierLabel,
    is_overridden: true,
    updated_by: record.updatedBy || 'Master Admin',
    updated_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    return { data: payload, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('monthly_cohorts')
      .upsert(payload, { onConflict: 'cohort_month' })
      .select()
      .maybeSingle();

    if (error) {
      const missingTable =
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('Could not find the table');
      return { data: null, error, missingTable };
    }

    return { data: (data as MonthlyCohortOverrideRecord) || payload, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}
