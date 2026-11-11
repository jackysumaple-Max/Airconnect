-- ============================================================
-- CTExcel Supabase Schema, Storage, & Realtime Setup
-- Run this script in your Supabase project's SQL Editor
-- ============================================================

-- 1. LEADS TABLE (Frontend Lead Capture, Realtime Sync, Soft Delete)
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Soft-Delete & Trash Columns
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    deleted_by TEXT
);

-- Enable RLS and permissions for Leads
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

-- Allow staff members to update lead follow-up status, assignment, and soft-delete
DROP POLICY IF EXISTS "Allow staff to update leads" ON public.leads;
CREATE POLICY "Allow staff to update leads" ON public.leads
    FOR UPDATE
    TO public, anon, authenticated
    USING (true);

-- Allow Master Admin hard deletes
DROP POLICY IF EXISTS "Allow admin delete leads" ON public.leads;
CREATE POLICY "Allow admin delete leads" ON public.leads
    FOR DELETE
    TO public, anon, authenticated
    USING (true);

-- Enable Supabase Realtime publication on the leads table for instant dashboard sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;


-- 2. SITE SETTINGS TABLE (CMS Hero Banner Headline, Sub-text, Image Asset)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id INT PRIMARY KEY DEFAULT 1,
    hero_title TEXT DEFAULT 'CTExcel Mobile Plans Powered by Telus',
    hero_subtitle TEXT DEFAULT 'Stay seamlessly connected across Canada, China, the US, and Mexico. Get up to 100GB of 5G data from $27/mo with free roaming, a complimentary Chinese phone number, and unlimited international calling.',
    hero_image TEXT DEFAULT '/assets/aistudio/image_de9eb1a6.png',
    hero_badge TEXT DEFAULT 'Exclusive Promotional Offer',
    hero_promo_price TEXT DEFAULT '$27',
    hero_promo_data TEXT DEFAULT '50GB',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial singleton row
INSERT INTO public.site_settings (id, hero_title, hero_subtitle, hero_image, hero_badge, hero_promo_price, hero_promo_data)
VALUES (1, 'CTExcel Mobile Plans Powered by Telus', 'Stay seamlessly connected across Canada, China, the US, and Mexico. Get up to 100GB of 5G data from $27/mo with free roaming, a complimentary Chinese phone number, and unlimited international calling.', '/assets/aistudio/image_de9eb1a6.png', 'Exclusive Promotional Offer', '$27', '50GB')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read site_settings" ON public.site_settings;
CREATE POLICY "Allow public read site_settings" ON public.site_settings
    FOR SELECT
    TO public, anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow admin update site_settings" ON public.site_settings;
CREATE POLICY "Allow admin update site_settings" ON public.site_settings
    FOR ALL
    TO public, anon, authenticated
    USING (true)
    WITH CHECK (true);


-- 3. MOBILE PLANS TABLE (With display_order integer column for drag-and-drop reordering)
CREATE TABLE IF NOT EXISTS public.mobile_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    data_allowance TEXT NOT NULL,
    monthly_price NUMERIC NOT NULL,
    regular_price NUMERIC NOT NULL,
    speed_tier TEXT,
    network TEXT DEFAULT 'Telus 5G',
    roaming_scope TEXT DEFAULT 'China-Canada',
    roaming_highlight TEXT,
    features TEXT[] DEFAULT '{}',
    badge TEXT,
    popular BOOLEAN DEFAULT false,
    commission_rate NUMERIC DEFAULT 45,
    active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mobile_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read mobile_plans" ON public.mobile_plans;
CREATE POLICY "Allow public read mobile_plans" ON public.mobile_plans
    FOR SELECT
    TO public, anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow admin update mobile_plans" ON public.mobile_plans;
CREATE POLICY "Allow admin update mobile_plans" ON public.mobile_plans
    FOR ALL
    TO public, anon, authenticated
    USING (true)
    WITH CHECK (true);


-- 4. STAFF TABLE (CRM Staff Management & Commission Multipliers)
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

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow staff full access" ON public.staff;
CREATE POLICY "Allow staff full access" ON public.staff
    FOR ALL
    TO public, anon, authenticated
    USING (true)
    WITH CHECK (true);


-- 5. SUPABASE STORAGE BUCKET: BANNERS (For Hero Banner file uploads)
-- Note: You can also create the 'banners' bucket via the Supabase Dashboard -> Storage -> New Bucket (Public: Yes)
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies allowing public read & authenticated/anon banner upload
CREATE POLICY "Public Access Banners"
ON storage.objects FOR SELECT
TO public, anon, authenticated
USING (bucket_id = 'banners');

CREATE POLICY "Allow Banner Uploads"
ON storage.objects FOR INSERT
TO public, anon, authenticated
WITH CHECK (bucket_id = 'banners');

CREATE POLICY "Allow Banner Deletions"
ON storage.objects FOR DELETE
TO public, anon, authenticated
USING (bucket_id = 'banners');
