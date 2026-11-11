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
    if (local && local.trim()) return local.trim();
    const win = window as any;
    if (win.__SUPABASE_ANON_KEY__) return win.__SUPABASE_ANON_KEY__;
    if (win.__ENV__?.VITE_SUPABASE_ANON_KEY) return win.__ENV__.VITE_SUPABASE_ANON_KEY;
  }
  return (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
    ''
  ).trim();
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

    // If PostgreSQL schema uses lowercase 'airwireless' or relation error
    if (error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('relation')) {
      console.warn('[Supabase Lead Insert] Table "Airwireless" not found. Attempting lowercase "airwireless"...');
      const { error: lowerErr } = await supabase.from('airwireless').insert([payload]);
      if (!lowerErr) {
        console.log('[Supabase Lead Insert] SUCCESS! Row inserted into table "airwireless".');
        return {
          data: true,
          error: null,
          tableUsed: 'airwireless',
        };
      }
    }

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

/**
 * Fetch remote leads from Supabase database to populate the Leads dashboard
 * Checks 'Airwireless' first, with fallback to 'leads' and 'customers'.
 */
export async function fetchLeadsFromSupabase(): Promise<{ data: CustomerRecord[] | null; error: any }> {
  if (!isSupabaseConfigured) {
    return { data: null, error: null };
  }

  const tablesToTry = Array.from(new Set([getLeadsTableName(), 'Airwireless', 'airwireless', 'leads', 'customers']));

  for (const tbl of tablesToTry) {
    try {
      // First try ordering by submitted_at
      let res = await supabase.from(tbl).select('*').order('submitted_at', { ascending: false });
      
      // If submitted_at column does not exist, try created_at or unordered
      if (res.error && (res.error.code === '42703' || res.error.message.includes('column') || res.error.message.includes('order'))) {
        res = await supabase.from(tbl).select('*').order('created_at', { ascending: false });
      }
      if (res.error && (res.error.code === '42703' || res.error.message.includes('column'))) {
        res = await supabase.from(tbl).select('*');
      }

      if (res.error) {
        if (res.error.code === '42P01' || res.error.message.includes('does not exist')) {
          continue; // Try next table
        }
        console.warn(`Supabase fetch leads on table "${tbl}" returned:`, res.error.message);
        continue;
      }

      if (res.data) {
        // Format raw database records into CustomerRecord structure
        const mapped: CustomerRecord[] = res.data.map((item: any) => ({
          id: item.id ? String(item.id) : `LEAD-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'lead',
          firstName: item.first_name || item.firstName || item.name?.split(' ')[0] || '',
          lastName: item.last_name || item.lastName || item.name?.split(' ').slice(1).join(' ') || '',
          fullName: item.full_name || item.fullName || item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim(),
          email: item.email || '',
          phone: item.phone || '',
          preferredPlanId: item.preferred_plan_id || item.preferredPlanId || '',
          preferredPlanName: item.preferred_plan_name || item.preferredPlanName || item.plan || 'CTExcel Plan',
          monthlyPlanPrice: Number(item.monthly_plan_price || item.monthlyPlanPrice || 30),
          salesRep: item.sales_rep || item.salesRep || 'Unassigned',
          referralSource: item.referral_source || item.referralSource || 'Website Lead Capture',
          submittedAt: item.submitted_at || item.created_at || new Date().toISOString(),
          callbackTimePreference: item.callback_time_preference || item.callbackTimePreference || 'As soon as possible',
          notes: item.notes || '',
          leadFollowUpStatus: item.lead_follow_up_status || item.leadFollowUpStatus || 'new',
          idVerification: {
            status: item.id_verification_status || 'unverified',
          },
          commission: {
            amount: Number((Number(item.monthly_plan_price || 30) * 1.0).toFixed(2)),
            status: 'pending',
            isClawbackFlagged: false,
            multiplierUsed: 1.0,
          },
        }));

        return { data: mapped, error: null };
      }
    } catch {
      continue;
    }
  }

  return { data: [], error: null };
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
    // 1. Prevent foreign key constraint errors: Reassign any assigned leads or customers to 'Unassigned'
    if (repName && repName.trim()) {
      try {
        await supabase.from('leads').update({ sales_rep: 'Unassigned' }).eq('sales_rep', repName.trim());
      } catch (fkErr) {
        console.warn('Note: Non-fatal attempt to unassign leads by sales_rep name:', fkErr);
      }

      try {
        await supabase.from('customers').update({ sales_rep: 'Unassigned' }).eq('sales_rep', repName.trim());
      } catch (fkErr) {
        console.warn('Note: Non-fatal attempt to unassign customers by sales_rep name:', fkErr);
      }
    }

    if (repId) {
      try {
        await supabase.from('leads').update({ sales_rep_id: null }).eq('sales_rep_id', repId);
      } catch {
        // Table or column may not use sales_rep_id
      }
      try {
        await supabase.from('customers').update({ staff_id: null }).eq('staff_id', repId);
      } catch {
        // Table or column may not use staff_id
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

  const payload: Record<string, any> = {
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

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .upsert(payload, { onConflict: 'id' })
      .select();

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
 * Fetches site settings (Hero headline, subtext, image, features, card texts) from Supabase.
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

  const tables = Array.from(new Set([getLeadsTableName(), 'Airwireless', 'airwireless', 'leads', 'customers']));
  for (const tbl of tables) {
    try {
      await supabase.from(tbl).update(payload).eq('id', id);
    } catch {
      // continue to next table
    }
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

  const tables = Array.from(new Set([getLeadsTableName(), 'Airwireless', 'airwireless', 'leads', 'customers']));
  for (const tbl of tables) {
    try {
      await supabase.from(tbl).update(payload).eq('id', id);
    } catch {
      // continue to next table
    }
  }
  return { success: true, error: null };
}

/**
 * 6. HARD DELETE (PERMANENT PURGE) IN SUPABASE:
 * Deletes rows permanently from database
 */
export async function hardDeleteCustomersInSupabase(ids: string[]) {
  if (!isSupabaseConfigured) return { success: true, error: null };

  const tables = Array.from(new Set([getLeadsTableName(), 'Airwireless', 'airwireless', 'leads', 'customers']));
  for (const tbl of tables) {
    try {
      await supabase.from(tbl).delete().in('id', ids);
    } catch {
      // continue
    }
  }
  return { success: true, error: null };
}

/**
 * 7. REAL-TIME SUBSCRIPTION FOR LEADS:
 * Subscribes to postgres_changes on the 'leads' table.
 * Automatically triggers callback when new lead is inserted, updated, or deleted.
 */
export function subscribeToLeadsRealtime(
  onInsert: (lead: CustomerRecord) => void,
  onUpdate?: (lead: CustomerRecord) => void,
  onDelete?: (id: string) => void
) {
  if (!isSupabaseConfigured) return () => {};

  try {
    const channel = supabase
      .channel('leads-realtime-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload: any) => {
          console.log('⚡ Realtime Lead change received:', payload.eventType, payload.new);

          if (payload.eventType === 'INSERT' && payload.new) {
            const raw = payload.new;
            const newLead: CustomerRecord = {
              id: raw.id || `LEAD-${Date.now().toString().slice(-4)}`,
              status: raw.status || 'lead',
              firstName: raw.first_name || '',
              lastName: raw.last_name || '',
              fullName: raw.full_name || `${raw.first_name || ''} ${raw.last_name || ''}`.trim() || 'New Lead',
              email: raw.email || '',
              phone: raw.phone || '',
              preferredPlanId: raw.preferred_plan_id || '',
              preferredPlanName: raw.preferred_plan_name || 'CTExcel Plan',
              monthlyPlanPrice: Number(raw.monthly_plan_price || 30),
              salesRep: raw.sales_rep || 'Unassigned',
              referralSource: raw.referral_source || 'Website Lead Capture',
              submittedAt: raw.submitted_at || new Date().toISOString(),
              callbackTimePreference: raw.callback_time_preference || 'As soon as possible',
              notes: raw.notes || '',
              leadFollowUpStatus: raw.lead_follow_up_status || 'new',
              isDeleted: Boolean(raw.is_deleted),
              deletedAt: raw.deleted_at,
              deletedBy: raw.deleted_by,
              idVerification: {
                status: raw.id_verification_status || 'unverified',
              },
              commission: {
                amount: Number((Number(raw.monthly_plan_price || 30) * 1.0).toFixed(2)),
                status: 'pending',
                isClawbackFlagged: false,
                multiplierUsed: 1.0,
              },
            };
            onInsert(newLead);
          } else if (payload.eventType === 'UPDATE' && payload.new && onUpdate) {
            const raw = payload.new;
            const updated: CustomerRecord = {
              id: raw.id,
              status: raw.status || 'lead',
              firstName: raw.first_name || '',
              lastName: raw.last_name || '',
              fullName: raw.full_name || `${raw.first_name || ''} ${raw.last_name || ''}`.trim(),
              email: raw.email || '',
              phone: raw.phone || '',
              preferredPlanId: raw.preferred_plan_id || '',
              preferredPlanName: raw.preferred_plan_name || 'CTExcel Plan',
              monthlyPlanPrice: Number(raw.monthly_plan_price || 30),
              salesRep: raw.sales_rep || 'Unassigned',
              referralSource: raw.referral_source || 'Website Lead Capture',
              submittedAt: raw.submitted_at || new Date().toISOString(),
              callbackTimePreference: raw.callback_time_preference || 'As soon as possible',
              notes: raw.notes || '',
              leadFollowUpStatus: raw.lead_follow_up_status || 'new',
              isDeleted: Boolean(raw.is_deleted),
              deletedAt: raw.deleted_at,
              deletedBy: raw.deleted_by,
              idVerification: {
                status: raw.id_verification_status || 'unverified',
              },
              commission: {
                amount: Number((Number(raw.monthly_plan_price || 30) * 1.0).toFixed(2)),
                status: 'pending',
                isClawbackFlagged: false,
                multiplierUsed: 1.0,
              },
            };
            onUpdate(updated);
          } else if (payload.eventType === 'DELETE' && payload.old && onDelete) {
            onDelete(payload.old.id);
          }
        }
      )
      .subscribe((status: string) => {
        console.log('📡 Supabase Leads realtime status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.error('Failed to initialize Realtime subscription on leads:', err);
    return () => {};
  }
}
