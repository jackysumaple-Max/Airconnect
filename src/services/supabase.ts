import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';

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
 * CRITICAL HOSTINGER FIX:
 * Updates the current authenticated user's password directly via Supabase Auth service (supabase.auth.updateUser)
 * instead of manually writing to standard database rows.
 */
export async function updateStaffPasswordInSupabase(newPassword: string) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured yet.') };
  }

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Supabase auth.updateUser password update error:', error.message);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('Unexpected error updating password with Supabase Auth:', err);
    return { data: null, error: err };
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
