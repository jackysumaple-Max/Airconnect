import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { CustomerRecord } from '../types/telecom';

// Retrieve Supabase credentials supporting both standard Vite env prefix (VITE_) 
// and raw Hostinger deployment environment variables
const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  '';

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

// Fallback dummy client if credentials aren't set yet, avoiding crash on page load
const fallbackUrl = supabaseUrl || 'https://placeholder.supabase.co';
const fallbackKey = supabaseAnonKey || 'placeholder-anon-key';

export const supabase: SupabaseClient = createClient(fallbackUrl, fallbackKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

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
export async function insertLeadToSupabase(lead: CustomerRecord) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  // Construct structured payload compatible with common Supabase column naming conventions
  const leadPayload = {
    id: lead.id,
    first_name: lead.firstName,
    last_name: lead.lastName,
    full_name: lead.fullName,
    email: lead.email,
    phone: lead.phone,
    preferred_plan_id: lead.preferredPlanId,
    preferred_plan_name: lead.preferredPlanName,
    monthly_plan_price: lead.monthlyPlanPrice,
    sales_rep: lead.salesRep || 'Unassigned',
    referral_source: lead.referralSource || 'Website Lead Capture',
    callback_time_preference: lead.callbackTimePreference || 'As soon as possible',
    status: 'lead',
    lead_follow_up_status: lead.leadFollowUpStatus || 'new',
    notes: lead.notes || '',
    submitted_at: lead.submittedAt || new Date().toISOString(),
  };

  try {
    // 1. Primary insert attempt into 'leads' table
    const { data, error } = await supabase.from('leads').insert([leadPayload]).select();

    if (error) {
      console.error('Supabase insert to "leads" table failed:', error.message, {
        code: error.code,
        details: error.details,
        hint: error.hint,
      });

      // Check for Row Level Security (RLS) policy rejection (error code 42501)
      if (
        error.code === '42501' ||
        error.message.toLowerCase().includes('row-level security') ||
        error.message.toLowerCase().includes('policy')
      ) {
        console.error(
          'CRITICAL RLS POLICY ERROR ON SUPABASE "leads" TABLE:\n' +
          'Row Level Security is enabled on table "leads", but no policy allows anonymous INSERT from the public frontend.\n' +
          'To fix this, run this SQL in your Supabase SQL Editor:\n' +
          '  ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;\n' +
          '  CREATE POLICY "Allow anonymous lead insert" ON public.leads FOR INSERT WITH CHECK (true);\n' +
          '  CREATE POLICY "Allow authenticated read leads" ON public.leads FOR SELECT USING (true);'
        );
      }

      // If 'leads' table does not exist (PGRST204 or 42P01), attempt fallback to 'customers' table
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.warn('Table "leads" not found. Attempting fallback insert into "customers" table...');
        const custRes = await supabase.from('customers').insert([leadPayload]).select();
        if (custRes.error) {
          console.error('Supabase fallback insert to "customers" table also failed:', custRes.error.message, custRes.error);
          return { data: null, error: custRes.error };
        }
        return { data: custRes.data, error: null };
      }

      return { data: null, error };
    }

    console.log('Lead successfully inserted into Supabase "leads" table:', lead.id);
    return { data, error: null };
  } catch (err: any) {
    console.error('Unexpected exception during Supabase lead insertion:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch remote leads from Supabase database to populate the Leads dashboard
 */
export async function fetchLeadsFromSupabase(): Promise<{ data: CustomerRecord[] | null; error: any }> {
  if (!isSupabaseConfigured) {
    return { data: null, error: null };
  }

  try {
    // Attempt query on 'leads' table
    let { data, error } = await supabase.from('leads').select('*').order('submitted_at', { ascending: false });

    // Fallback query on 'customers' table if 'leads' table isn't present
    if (error && (error.code === '42P01' || error.message.includes('does not exist'))) {
      const custRes = await supabase.from('customers').select('*').eq('status', 'lead').order('submitted_at', { ascending: false });
      data = custRes.data;
      error = custRes.error;
    }

    if (error) {
      console.error('Supabase fetch leads error:', error.message, error);
      return { data: null, error };
    }

    if (!data) return { data: [], error: null };

    // Format raw database records into CustomerRecord structure
    const mapped: CustomerRecord[] = data.map((item: any) => ({
      id: item.id || `LEAD-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'lead',
      firstName: item.first_name || item.firstName || '',
      lastName: item.last_name || item.lastName || '',
      fullName: item.full_name || item.fullName || `${item.first_name || ''} ${item.last_name || ''}`.trim(),
      email: item.email || '',
      phone: item.phone || '',
      preferredPlanId: item.preferred_plan_id || item.preferredPlanId || '',
      preferredPlanName: item.preferred_plan_name || item.preferredPlanName || 'CTExcel Plan',
      monthlyPlanPrice: Number(item.monthly_plan_price || item.monthlyPlanPrice || 30),
      salesRep: item.sales_rep || item.salesRep || 'Unassigned',
      referralSource: item.referral_source || item.referralSource || 'Website Lead Capture',
      submittedAt: item.submitted_at || item.submittedAt || new Date().toISOString(),
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
  } catch (err: any) {
    console.error('Unexpected exception fetching leads from Supabase:', err);
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
