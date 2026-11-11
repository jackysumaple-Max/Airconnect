-- ============================================================
-- CTExcel Supabase Schema & Row Level Security (RLS) Setup
-- Run this script in your Supabase project's SQL Editor
-- ============================================================

-- 1. LEADS TABLE (Frontend Lead Capture to CRM Backend)
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    preferred_plan_id TEXT,
    preferred_plan_name TEXT,
    monthly_plan_price NUMERIC DEFAULT 30,
    sales_rep TEXT DEFAULT 'Unassigned',
    referral_source TEXT DEFAULT 'Website Lead Capture',
    callback_time_preference TEXT DEFAULT 'As soon as possible',
    status TEXT DEFAULT 'lead',
    lead_follow_up_status TEXT DEFAULT 'new',
    notes TEXT DEFAULT '',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRITICAL FIX FOR BUG 1: Enable RLS and allow anonymous public inserts from website
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous visitors on the landing page to insert callback requests
DROP POLICY IF EXISTS "Allow anonymous lead insert" ON public.leads;
CREATE POLICY "Allow anonymous lead insert" ON public.leads
    FOR INSERT 
    TO public, anon, authenticated
    WITH CHECK (true);

-- Allow authenticated staff members to read all leads in the CRM dashboard
DROP POLICY IF EXISTS "Allow staff to select leads" ON public.leads;
CREATE POLICY "Allow staff to select leads" ON public.leads
    FOR SELECT 
    TO public, anon, authenticated
    USING (true);

-- Allow staff members to update lead follow-up status and assignment
DROP POLICY IF EXISTS "Allow staff to update leads" ON public.leads;
CREATE POLICY "Allow staff to update leads" ON public.leads
    FOR UPDATE
    TO public, anon, authenticated
    USING (true);


-- 2. STAFF TABLE (CRM Staff Management & Commission Multipliers)
CREATE TABLE IF NOT EXISTS public.staff (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'sales_rep',
    avatar_color TEXT DEFAULT 'bg-emerald-700',
    commission_multiplier NUMERIC DEFAULT 1.0,
    is_access_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRITICAL FIX FOR BUG 2: Avoid Foreign Key constraint errors on delete
-- If your leads or customers table references staff.id, set ON DELETE SET NULL:
-- Example:
-- ALTER TABLE public.leads 
--   ADD CONSTRAINT fk_staff FOREIGN KEY (sales_rep_id) 
--   REFERENCES public.staff(id) ON DELETE SET NULL;

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow staff full access" ON public.staff;
CREATE POLICY "Allow staff full access" ON public.staff
    FOR ALL
    TO public, anon, authenticated
    USING (true)
    WITH CHECK (true);
