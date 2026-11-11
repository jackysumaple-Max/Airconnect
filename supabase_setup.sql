-- ============================================================
-- CTExcel Supabase Schema, Storage, & Realtime Setup
-- Run this script in your Supabase project's SQL Editor
-- ============================================================

-- 1. LEADS TABLE (Table: "Airwireless" and table: "leads")
-- If your Supabase database uses table "Airwireless":
CREATE TABLE IF NOT EXISTS public."Airwireless" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    name TEXT,
    email TEXT,
    phone TEXT,
    preferred_plan_id TEXT,
    preferred_plan_name TEXT,
    plan TEXT,
    monthly_plan_price NUMERIC DEFAULT 30,
    sales_rep TEXT DEFAULT 'Unassigned',
    referral_source TEXT DEFAULT 'Website Lead Capture',
    callback_time_preference TEXT DEFAULT 'As soon as possible',
    status TEXT DEFAULT 'lead',
    lead_follow_up_status TEXT DEFAULT 'new',
    notes TEXT DEFAULT '',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    deleted_by TEXT
);

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public."Airwireless" TO anon, authenticated, service_role;
ALTER TABLE public."Airwireless" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon insert" ON public."Airwireless";
DROP POLICY IF EXISTS "Allow anonymous lead insert" ON public."Airwireless";
CREATE POLICY "Allow anon insert" ON public."Airwireless"
    FOR INSERT 
    TO anon, authenticated, public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow staff to select leads" ON public."Airwireless";
CREATE POLICY "Allow staff to select leads" ON public."Airwireless"
    FOR SELECT 
    TO anon, authenticated, public
    USING (true);

-- Fallback table: public.leads
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    name TEXT,
    email TEXT,
    phone TEXT,
    preferred_plan_id TEXT,
    preferred_plan_name TEXT,
    plan TEXT,
    monthly_plan_price NUMERIC DEFAULT 30,
    sales_rep TEXT DEFAULT 'Unassigned',
    referral_source TEXT DEFAULT 'Website Lead Capture',
    callback_time_preference TEXT DEFAULT 'As soon as possible',
    status TEXT DEFAULT 'lead',
    lead_follow_up_status TEXT DEFAULT 'new',
    notes TEXT DEFAULT '',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    deleted_by TEXT
);

GRANT ALL ON TABLE public.leads TO anon, authenticated, service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous lead insert" ON public.leads;
CREATE POLICY "Allow anonymous lead insert" ON public.leads
    FOR INSERT 
    TO anon, authenticated, public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow staff to select leads" ON public.leads;
CREATE POLICY "Allow staff to select leads" ON public.leads
    FOR SELECT 
    TO anon, authenticated, public
    USING (true);

-- Allow staff members to update lead follow-up status, assignment, and soft-delete
DROP POLICY IF EXISTS "Allow staff to update leads" ON public.leads;
CREATE POLICY "Allow staff to update leads" ON public.leads
    FOR UPDATE
    TO anon, authenticated, public
    USING (true);

-- Allow Master Admin hard deletes
DROP POLICY IF EXISTS "Allow admin delete leads" ON public.leads;
CREATE POLICY "Allow admin delete leads" ON public.leads
    FOR DELETE
    TO anon, authenticated, public
    USING (true);

-- Enable Supabase Realtime publication on the leads table for instant dashboard sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;


-- 2. SITE SETTINGS TABLE (CMS Hero Banner Headline, Sub-Header, Checkmarks & Right Card)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id INT PRIMARY KEY DEFAULT 1,
    hero_title TEXT DEFAULT 'CTExcel Mobile Plans. Powered by Telus.',
    hero_subtitle TEXT DEFAULT 'Get up to 100GB 5G Data. Includes Free Roaming in Canada, US, Mexico & China, plus Unlimited Calling to 9 Countries.',
    hero_image TEXT DEFAULT '/assets/aistudio/image_de9eb1a6.png',
    hero_badge TEXT DEFAULT 'Exclusive Promotional Offer',
    hero_promo_price TEXT DEFAULT '$27',
    hero_promo_data TEXT DEFAULT '50GB',
    -- Feature 2: Left Column 4 Checkmark Features
    hero_feature_1 TEXT DEFAULT 'Free China-Canada Roaming',
    hero_feature_2 TEXT DEFAULT 'Complimentary Chinese Phone #',
    hero_feature_3 TEXT DEFAULT 'Unlimited Calling to 9 Countries',
    hero_feature_4 TEXT DEFAULT 'Free Instant eSIM QR Code',
    -- Feature 2: Right Side Graphic Card
    hero_card_tag TEXT DEFAULT 'DUAL NUMBER SERVICE',
    hero_card_title TEXT DEFAULT 'Canada + China Dual Line',
    hero_card_price TEXT DEFAULT '$27/mo',
    hero_card_subtitle TEXT DEFAULT 'Telus 5G eSIM',
    hero_box_1_title TEXT DEFAULT '4 Countries',
    hero_box_1_sub TEXT DEFAULT 'Free Roaming',
    hero_box_2_title TEXT DEFAULT 'China #',
    hero_box_2_sub TEXT DEFAULT 'Included Free',
    hero_box_3_title TEXT DEFAULT '9 Nations',
    hero_box_3_sub TEXT DEFAULT 'Unlimited Talk',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure newly added columns exist if table was already created
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_feature_1 TEXT DEFAULT 'Free China-Canada Roaming';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_feature_2 TEXT DEFAULT 'Complimentary Chinese Phone #';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_feature_3 TEXT DEFAULT 'Unlimited Calling to 9 Countries';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_feature_4 TEXT DEFAULT 'Free Instant eSIM QR Code';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_card_tag TEXT DEFAULT 'DUAL NUMBER SERVICE';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_card_title TEXT DEFAULT 'Canada + China Dual Line';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_card_price TEXT DEFAULT '$27/mo';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_card_subtitle TEXT DEFAULT 'Telus 5G eSIM';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_box_1_title TEXT DEFAULT '4 Countries';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_box_1_sub TEXT DEFAULT 'Free Roaming';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_box_2_title TEXT DEFAULT 'China #';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_box_2_sub TEXT DEFAULT 'Included Free';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_box_3_title TEXT DEFAULT '9 Nations';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_box_3_sub TEXT DEFAULT 'Unlimited Talk';

-- Insert or update singleton row with streamlined copy
INSERT INTO public.site_settings (
    id, hero_title, hero_subtitle, hero_image, hero_badge, hero_promo_price, hero_promo_data,
    hero_feature_1, hero_feature_2, hero_feature_3, hero_feature_4,
    hero_card_tag, hero_card_title, hero_card_price, hero_card_subtitle,
    hero_box_1_title, hero_box_1_sub, hero_box_2_title, hero_box_2_sub, hero_box_3_title, hero_box_3_sub
)
VALUES (
    1,
    'CTExcel Mobile Plans. Powered by Telus.',
    'Get up to 100GB 5G Data. Includes Free Roaming in Canada, US, Mexico & China, plus Unlimited Calling to 9 Countries.',
    '/assets/aistudio/image_de9eb1a6.png',
    'Exclusive Promotional Offer',
    '$27',
    '50GB',
    'Free China-Canada Roaming',
    'Complimentary Chinese Phone #',
    'Unlimited Calling to 9 Countries',
    'Free Instant eSIM QR Code',
    'DUAL NUMBER SERVICE',
    'Canada + China Dual Line',
    '$27/mo',
    'Telus 5G eSIM',
    '4 Countries',
    'Free Roaming',
    'China #',
    'Included Free',
    '9 Nations',
    'Unlimited Talk'
)
ON CONFLICT (id) DO UPDATE SET
    hero_title = EXCLUDED.hero_title,
    hero_subtitle = EXCLUDED.hero_subtitle;

GRANT ALL ON TABLE public.site_settings TO anon, authenticated, service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read site_settings" ON public.site_settings;
CREATE POLICY "Allow public read site_settings" ON public.site_settings
    FOR SELECT
    TO anon, authenticated, public
    USING (true);

DROP POLICY IF EXISTS "Allow admin update site_settings" ON public.site_settings;
CREATE POLICY "Allow admin update site_settings" ON public.site_settings
    FOR ALL
    TO anon, authenticated, public
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

GRANT ALL ON TABLE public.mobile_plans TO anon, authenticated, service_role;
ALTER TABLE public.mobile_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read mobile_plans" ON public.mobile_plans;
CREATE POLICY "Allow public read mobile_plans" ON public.mobile_plans
    FOR SELECT
    TO anon, authenticated, public
    USING (true);

DROP POLICY IF EXISTS "Allow admin update mobile_plans" ON public.mobile_plans;
CREATE POLICY "Allow admin update mobile_plans" ON public.mobile_plans
    FOR ALL
    TO anon, authenticated, public
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

GRANT ALL ON TABLE public.staff TO anon, authenticated, service_role;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow staff full access" ON public.staff;
CREATE POLICY "Allow staff full access" ON public.staff
    FOR ALL
    TO anon, authenticated, public
    USING (true)
    WITH CHECK (true);


-- 5. SUPABASE STORAGE BUCKET: BANNERS (For Hero Banner file uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access Banners" ON storage.objects;
CREATE POLICY "Public Access Banners"
ON storage.objects FOR SELECT
TO anon, authenticated, public
USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "Allow Banner Uploads" ON storage.objects;
CREATE POLICY "Allow Banner Uploads"
ON storage.objects FOR INSERT
TO anon, authenticated, public
WITH CHECK (bucket_id = 'banners');

DROP POLICY IF EXISTS "Allow Banner Deletions" ON storage.objects;
CREATE POLICY "Allow Banner Deletions"
ON storage.objects FOR DELETE
TO anon, authenticated, public
USING (bucket_id = 'banners');
