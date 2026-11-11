/**
 * Supabase Connection and Database Module (db.js)
 * Provides direct connection to Supabase Auth and Database for Hostinger and production deployments.
 */
import {
  supabase,
  isSupabaseConfigured,
  signInWithSupabase,
  signInWithGoogleSSO,
  updateStaffPasswordInSupabase,
  updateStaffProfileInSupabase,
  signUpStaffInSupabase,
  getCurrentSupabaseUser,
  signOutFromSupabase,
  insertLeadToSupabase,
  fetchLeadsFromSupabase,
  deleteStaffFromSupabase,
} from './services/supabase';

export {
  supabase,
  isSupabaseConfigured,
  signInWithSupabase,
  signInWithGoogleSSO,
  updateStaffPasswordInSupabase,
  updateStaffProfileInSupabase,
  signUpStaffInSupabase,
  getCurrentSupabaseUser,
  signOutFromSupabase,
  insertLeadToSupabase,
  fetchLeadsFromSupabase,
  deleteStaffFromSupabase,
};

export default supabase;
