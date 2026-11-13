import React, { useState, useRef, useEffect } from 'react';
import { Plan, CMSConfig } from '../../types/telecom';
import {
  Sparkles,
  DollarSign,
  Image as ImageIcon,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Eye,
  BellRing,
  Upload,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Loader2,
  Check,
  AlertCircle,
  Database,
  Copy,
  ExternalLink,
  ShieldCheck,
  Layers,
  Wrench,
  CheckSquare,
} from 'lucide-react';
import {
  uploadHeroBanner,
  saveSiteSettingsToSupabase,
  updatePlanDisplayOrdersInSupabase,
  testSupabaseAnonymousInsert,
  getSupabaseDiagnostics,
  setCustomSupabaseCredentials,
  isSupabaseConfigured,
  supabaseUrl,
  supabaseAnonKey,
  getLeadsTableName,
  setLeadsTableName,
} from '../../services/supabase';

interface CmsEditorProps {
  cms: CMSConfig;
  plans: Plan[];
  onSaveCms: (updatedCms: CMSConfig) => void;
  onSavePlans: (updatedPlans: Plan[]) => void;
  onPreviewSite: () => void;
}

export const CmsEditor: React.FC<CmsEditorProps> = ({
  cms,
  plans,
  onSaveCms,
  onSavePlans,
  onPreviewSite,
}) => {
  // Main CMS state
  const [heroTitle, setHeroTitle] = useState(cms.heroTitle || 'CTExcel Mobile Plans. Powered by Telus.');
  const [heroSubtitle, setHeroSubtitle] = useState(
    cms.heroSubtitle ||
      'Get up to 100GB 5G Data. Includes Free Roaming in Canada, US, Mexico & China, plus Unlimited Calling to 9 Countries.'
  );
  const [heroBadge, setHeroBadge] = useState(cms.heroBadge || 'Exclusive Promotional Offer');
  const [heroPromoPrice, setHeroPromoPrice] = useState(cms.heroPromoPrice || '$27');
  const [heroPromoData, setHeroPromoData] = useState(cms.heroPromoData || '50GB');
  const [heroImage, setHeroImage] = useState(cms.heroImage || '/assets/aistudio/image_de9eb1a6.png');
  const [announcementBarText, setAnnouncementBarText] = useState(
    cms.announcementBarText ||
      '🇨🇦 🇨🇳 🇺🇸 🇲🇽 Special Promotion: Plans starting from $27/50GB with Free China Roaming + Telus 5G Network!'
  );
  const [announcementActive, setAnnouncementActive] = useState(cms.announcementActive ?? true);
  const [supportPhone, setSupportPhone] = useState(cms.supportPhone);
  const [businessHours, setBusinessHours] = useState(cms.businessHours);
  const [roamingFinePrint, setRoamingFinePrint] = useState(cms.roamingFinePrint || '');

  // Feature 2: Left Column (Checkmark Feature List)
  const [heroFeature1, setHeroFeature1] = useState(cms.heroFeature1 || 'Free China-Canada Roaming');
  const [heroFeature2, setHeroFeature2] = useState(cms.heroFeature2 || 'Complimentary Chinese Phone #');
  const [heroFeature3, setHeroFeature3] = useState(cms.heroFeature3 || 'Unlimited Calling to 9 Countries');
  const [heroFeature4, setHeroFeature4] = useState(cms.heroFeature4 || 'Free Instant eSIM QR Code');

  // Feature 2: Right Side Graphic Card
  const [heroCardTag, setHeroCardTag] = useState(cms.heroCardTag || 'DUAL NUMBER SERVICE');
  const [heroCardTitle, setHeroCardTitle] = useState(cms.heroCardTitle || 'Canada + China Dual Line');
  const [heroCardPrice, setHeroCardPrice] = useState(cms.heroCardPrice || '$27/mo');
  const [heroCardSubtitle, setHeroCardSubtitle] = useState(cms.heroCardSubtitle || 'Telus 5G eSIM');
  const [heroBox1Title, setHeroBox1Title] = useState(cms.heroBox1Title || '4 Countries');
  const [heroBox1Sub, setHeroBox1Sub] = useState(cms.heroBox1Sub || 'Free Roaming');
  const [heroBox2Title, setHeroBox2Title] = useState(cms.heroBox2Title || 'China #');
  const [heroBox2Sub, setHeroBox2Sub] = useState(cms.heroBox2Sub || 'Included Free');
  const [heroBox3Title, setHeroBox3Title] = useState(cms.heroBox3Title || '9 Nations');
  const [heroBox3Sub, setHeroBox3Sub] = useState(cms.heroBox3Sub || 'Unlimited Talk');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Plans state with display_order initialization
  const [editablePlans, setEditablePlans] = useState<Plan[]>(() => {
    const list = JSON.parse(JSON.stringify(plans)) as Plan[];
    return list
      .map((p, idx) => ({ ...p, display_order: p.display_order ?? idx + 1 }))
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  });

  const [draggedPlanIndex, setDraggedPlanIndex] = useState<number | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local editor fields whenever cms prop hydrates asynchronously from Supabase
  useEffect(() => {
    setHeroTitle(cms.heroTitle || 'CTExcel Mobile Plans. Powered by Telus.');
    setHeroSubtitle(
      cms.heroSubtitle ||
        'Get up to 100GB 5G Data. Includes Free Roaming in Canada, US, Mexico & China, plus Unlimited Calling to 9 Countries.'
    );
    setHeroBadge(cms.heroBadge || 'Exclusive Promotional Offer');
    setHeroPromoPrice(cms.heroPromoPrice || '$27');
    setHeroPromoData(cms.heroPromoData || '50GB');
    setHeroImage(cms.heroImage || '/assets/aistudio/image_de9eb1a6.png');
    setAnnouncementBarText(
      cms.announcementBarText ||
        '🇨🇦 🇨🇳 🇺🇸 🇲🇽 Special Promotion: Plans starting from $27/50GB with Free China Roaming + Telus 5G Network!'
    );
    setAnnouncementActive(cms.announcementActive ?? true);
    setSupportPhone(cms.supportPhone);
    setBusinessHours(cms.businessHours);
    setRoamingFinePrint(cms.roamingFinePrint || '');
    setHeroFeature1(cms.heroFeature1 || 'Free China-Canada Roaming');
    setHeroFeature2(cms.heroFeature2 || 'Complimentary Chinese Phone #');
    setHeroFeature3(cms.heroFeature3 || 'Unlimited Calling to 9 Countries');
    setHeroFeature4(cms.heroFeature4 || 'Free Instant eSIM QR Code');
    setHeroCardTag(cms.heroCardTag || 'DUAL NUMBER SERVICE');
    setHeroCardTitle(cms.heroCardTitle || 'Canada + China Dual Line');
    setHeroCardPrice(cms.heroCardPrice || '$27/mo');
    setHeroCardSubtitle(cms.heroCardSubtitle || 'Telus 5G eSIM');
    setHeroBox1Title(cms.heroBox1Title || '4 Countries');
    setHeroBox1Sub(cms.heroBox1Sub || 'Free Roaming');
    setHeroBox2Title(cms.heroBox2Title || 'China #');
    setHeroBox2Sub(cms.heroBox2Sub || 'Included Free');
    setHeroBox3Title(cms.heroBox3Title || '9 Nations');
    setHeroBox3Sub(cms.heroBox3Sub || 'Unlimited Talk');
  }, [cms]);

  // Diagnostic & Supabase Credentials state
  const [isTestingInsert, setIsTestingInsert] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showDbSettings, setShowDbSettings] = useState(false);
  const [customSupabaseUrl, setCustomSupabaseUrl] = useState(supabaseUrl);
  const [customSupabaseAnonKey, setCustomSupabaseAnonKey] = useState(supabaseAnonKey);
  const [targetTableName, setTargetTableNameState] = useState(getLeadsTableName());
  const [dbSettingsSaved, setDbSettingsSaved] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Available preset user styles
  const PRESET_IMAGES = [
    { label: 'Green Tech Mobile (Default Style #1)', path: '/assets/aistudio/image_de9eb1a6.png' },
    { label: 'Frosted Emerald Glass (Default Style #2)', path: '/assets/aistudio/image_8a94fde1.png' },
  ];

  const RLS_SQL_SNIPPET = `-- Fix Production Lead Submission: Allow public anon role to insert into "${targetTableName || 'Airwireless'}"
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public."${targetTableName || 'Airwireless'}" TO anon, authenticated, service_role;
ALTER TABLE public."${targetTableName || 'Airwireless'}" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon insert" ON public."${targetTableName || 'Airwireless'}";
CREATE POLICY "Allow anon insert" ON public."${targetTableName || 'Airwireless'}"
    FOR INSERT TO anon, authenticated, public WITH CHECK (true);

-- Optional: Allow staff to view leads
DROP POLICY IF EXISTS "Allow staff to select leads" ON public."${targetTableName || 'Airwireless'}";
CREATE POLICY "Allow staff to select leads" ON public."${targetTableName || 'Airwireless'}"
    FOR SELECT TO anon, authenticated, public USING (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(RLS_SQL_SNIPPET);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleTestProbe = async () => {
    setIsTestingInsert(true);
    setTestResult(null);
    try {
      const res = await testSupabaseAnonymousInsert();
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e?.message || 'Failed to complete insert test.',
      });
    } finally {
      setIsTestingInsert(false);
    }
  };

  const handleSaveCustomCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomSupabaseCredentials(customSupabaseUrl, customSupabaseAnonKey);
    setLeadsTableName(targetTableName);
    setDbSettingsSaved(true);
    setTimeout(() => setDbSettingsSaved(false), 3000);
  };

  /**
   * Handle File Upload & Replacement for Active Banner Asset Path
   */
  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP, or SVG).');
      return;
    }

    setIsUploading(true);
    setUploadMessage('Uploading banner to Supabase Storage bucket & removing old asset...');

    try {
      const { publicUrl } = await uploadHeroBanner(file, heroImage);
      if (publicUrl) {
        setHeroImage(publicUrl);
        setUploadMessage('Banner image successfully uploaded and updated!');
        setTimeout(() => setUploadMessage(null), 3000);
      } else {
        setUploadMessage('Upload failed. Please check network and permissions.');
      }
    } catch (err) {
      console.error('Upload exception:', err);
      setUploadMessage('Failed to upload image.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * Reorder Plans using Move Up / Move Down buttons
   */
  const handleMovePlan = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= editablePlans.length) return;
    const reordered = [...editablePlans];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    const indexed = reordered.map((plan, i) => ({
      ...plan,
      display_order: i + 1,
    }));
    setEditablePlans(indexed);
  };

  /**
   * Drag-and-Drop Handlers for Plan Reordering
   */
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedPlanIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedPlanIndex === null || draggedPlanIndex === targetIndex) return;

    const reordered = [...editablePlans];
    const [moved] = reordered.splice(draggedPlanIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    const indexed = reordered.map((plan, i) => ({
      ...plan,
      display_order: i + 1,
    }));
    setEditablePlans(indexed);
    setDraggedPlanIndex(null);
  };

  /**
   * Save All CMS updates and Plan order to local storage & Supabase
   */
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedCms: CMSConfig = {
      ...cms,
      heroTitle,
      heroSubtitle,
      heroBadge,
      heroPromoPrice,
      heroPromoData,
      heroImage,
      announcementBarText,
      announcementActive,
      supportPhone,
      businessHours,
      roamingFinePrint,
      heroFeature1,
      heroFeature2,
      heroFeature3,
      heroFeature4,
      heroCardTag,
      heroCardTitle,
      heroCardPrice,
      heroCardSubtitle,
      heroBox1Title,
      heroBox1Sub,
      heroBox2Title,
      heroBox2Sub,
      heroBox3Title,
      heroBox3Sub,
    };

    const finalizedPlans = editablePlans.map((p, i) => ({
      ...p,
      display_order: i + 1,
    }));

    onSaveCms(updatedCms);
    onSavePlans(finalizedPlans);

    setSaveWarning(null);
    const supaRes: any = await saveSiteSettingsToSupabase({
      heroTitle,
      heroSubtitle,
      heroImage,
      heroBadge,
      heroPromoPrice,
      heroPromoData,
      announcementBarText,
      announcementActive,
      heroFeature1,
      heroFeature2,
      heroFeature3,
      heroFeature4,
      heroCardTag,
      heroCardTitle,
      heroCardPrice,
      heroCardSubtitle,
      heroBox1Title,
      heroBox1Sub,
      heroBox2Title,
      heroBox2Sub,
      heroBox3Title,
      heroBox3Sub,
    });

    if (supaRes?.warning) {
      setSaveWarning(supaRes.warning);
    } else if (supaRes?.error) {
      setSaveWarning(`Saved locally, but Supabase sync reported: ${supaRes.error.message || 'Unknown error'}`);
    }

    await updatePlanDisplayOrdersInSupabase(finalizedPlans);

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleUpdatePlan = (index: number, field: keyof Plan, value: any) => {
    const updated = [...editablePlans];
    updated[index] = { ...updated[index], [field]: value };
    setEditablePlans(updated);
  };

  const handleAddNewPlan = () => {
    const newPlan: Plan = {
      id: `plan-${Date.now()}`,
      name: '5G Custom Dealer Promo',
      dataAllowance: '60GB',
      monthlyPrice: 30,
      regularPrice: 50,
      speedTier: '5G Speeds up to 250 Mbps',
      network: 'Telus 5G',
      roamingScope: 'China-Canada',
      roamingHighlight: 'Free China-Canada roaming',
      features: [
        '60GB High-Speed 5G Data on Telus Network',
        'Unlimited Canada-Wide Calling & Text',
        'Free eSIM QR Code instant delivery',
        'No lock-in contract, BYOD ready',
      ],
      badge: 'New Promo',
      popular: false,
      commissionRate: 50.0,
      active: true,
      display_order: editablePlans.length + 1,
    };
    setEditablePlans([...editablePlans, newPlan]);
  };

  const handleDeletePlan = (index: number) => {
    if (editablePlans.length <= 1) {
      alert('You must have at least one active plan.');
      return;
    }
    const filtered = editablePlans.filter((_, i) => i !== index);
    const reindexed = filtered.map((p, i) => ({ ...p, display_order: i + 1 }));
    setEditablePlans(reindexed);
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-8">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Frontend Content Management System (CMS)
          </h2>
          <p className="text-xs text-slate-500">
            Control the hero headlines, checkmarks, right-side graphic cards, pricing, and plan sequence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg animate-fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Published Live!</span>
            </span>
          )}

          <button
            type="button"
            onClick={onPreviewSite}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Preview Landing Page</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-xl bg-[#0F3E2E] hover:bg-[#14533D] px-5 py-2 text-xs font-bold text-white transition-colors shadow-xs disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-300" />
            ) : (
              <Save className="h-3.5 w-3.5 text-emerald-300" />
            )}
            <span>{isSaving ? 'Publishing...' : 'Save & Publish Live'}</span>
          </button>
        </div>
      </div>

      {saveWarning && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950 flex items-start gap-2.5 shadow-2xs">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Database Schema Note</p>
            <p className="mt-0.5 font-mono text-[11px] break-all">{saveWarning}</p>
          </div>
        </div>
      )}

      {/* SECTION 1: Dynamic Hero Banner & Content Management */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-700" />
            <h3 className="text-base font-bold text-slate-900">
              Top Promo Banner & Hero Section Copy
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            Synchronized with site_settings table
          </span>
        </div>

        {/* Top Promo Banner */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-8">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-800">
                  Top Promo Banner
                </label>
                <span className="text-[10px] text-emerald-700 font-mono font-medium">
                  site_settings.top_promo_banner_text
                </span>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-700">
                  <BellRing className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={announcementBarText}
                  onChange={(e) => setAnnouncementBarText(e.target.value)}
                  placeholder="🇨🇦 🇨🇳 🇺🇸 🇲🇽 Special Promotion: Plans starting from $27/50GB with Free China Roaming + Telus 5G Network!"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-4 flex items-center justify-between gap-3 pt-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcementActive}
                  onChange={(e) => setAnnouncementActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-3 text-xs font-semibold text-slate-700">
                  Show Top Banner
                </span>
              </label>

              <button
                type="button"
                onClick={() =>
                  setAnnouncementBarText(
                    '🇨🇦 🇨🇳 🇺🇸 🇲🇽 Special Promotion: Plans starting from $27/50GB with Free China Roaming + Telus 5G Network!'
                  )
                }
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline whitespace-nowrap cursor-pointer"
              >
                Reset Default
              </button>
            </div>
          </div>

          {/* Live Mini Preview of Top Promotional Green Bar */}
          {announcementActive && (
            <div className="rounded-lg bg-[#08281D] border border-emerald-900/50 py-1.5 px-3 text-center text-[11px] font-semibold text-emerald-200 flex items-center justify-center gap-1.5">
              <Sparkles className="h-3 w-3 text-emerald-400 shrink-0" />
              <span className="truncate">{announcementBarText || '(Empty banner text)'}</span>
            </div>
          )}
        </div>

        {/* Main Header & Promo Badge */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-800">
                Main Header (H1)
              </label>
              <span className="text-[10px] text-emerald-700 font-mono font-medium">site_settings.hero_title</span>
            </div>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="CTExcel Mobile Plans. Powered by Telus."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-emerald-500 outline-none font-medium"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Recommended: <span className="font-semibold text-slate-700">CTExcel Mobile Plans. Powered by Telus.</span>
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-800">
                Banner Promo Badge
              </label>
              <span className="text-[10px] text-emerald-700 font-mono font-medium">site_settings.hero_badge</span>
            </div>
            <input
              type="text"
              value={heroBadge}
              onChange={(e) => setHeroBadge(e.target.value)}
              placeholder="Exclusive Promotional Offer"
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Streamlined Sub-Header */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-800">
              New Sub-Header Text (Streamlined High-Conversion Copy)
            </label>
            <span className="text-[10px] text-emerald-700 font-mono font-medium">site_settings.hero_subtitle</span>
          </div>
          <textarea
            rows={2}
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            placeholder="Get up to 100GB 5G Data. Includes Free Roaming in Canada, US, Mexico & China, plus Unlimited Calling to 9 Countries."
            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-emerald-500 outline-none font-normal"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Focuses strictly on price, data amounts, and specific cross-border roaming countries.
          </p>
        </div>

        {/* Featured Price & Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
          <div>
            <label className="block text-xs font-bold text-emerald-900 mb-1">
              Featured Hero Price
            </label>
            <input
              type="text"
              value={heroPromoPrice}
              onChange={(e) => setHeroPromoPrice(e.target.value)}
              placeholder="$27"
              className="w-full rounded-lg border border-emerald-200 bg-white p-2 text-xs font-bold text-emerald-900 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-900 mb-1">
              Featured Data Allowance
            </label>
            <input
              type="text"
              value={heroPromoData}
              onChange={(e) => setHeroPromoData(e.target.value)}
              placeholder="50GB"
              className="w-full rounded-lg border border-emerald-200 bg-white p-2 text-xs font-bold text-emerald-900 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* FEATURE 2: Left Column (Checkmark Feature List) */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-emerald-700" />
            <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
              Left Column: 4 Checkmark Features (Feature 2)
            </span>
          </div>
          <p className="text-[11px] text-emerald-800">
            Edit the 4 primary checkmark value propositions displayed inside the featured offer card:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Checkmark Item #1</label>
              <input
                type="text"
                value={heroFeature1}
                onChange={(e) => setHeroFeature1(e.target.value)}
                placeholder="Free China-Canada Roaming"
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Checkmark Item #2</label>
              <input
                type="text"
                value={heroFeature2}
                onChange={(e) => setHeroFeature2(e.target.value)}
                placeholder="Complimentary Chinese Phone #"
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Checkmark Item #3</label>
              <input
                type="text"
                value={heroFeature3}
                onChange={(e) => setHeroFeature3(e.target.value)}
                placeholder="Unlimited Calling to 9 Countries"
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Checkmark Item #4</label>
              <input
                type="text"
                value={heroFeature4}
                onChange={(e) => setHeroFeature4(e.target.value)}
                placeholder="Free Instant eSIM QR Code"
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* FEATURE 2: Right Side Graphic Card & Badges */}
        <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-teal-700" />
            <span className="text-xs font-bold text-teal-950 uppercase tracking-wide">
              Right-Side Graphic Card & Bottom Badges (Feature 2)
            </span>
          </div>
          <p className="text-[11px] text-teal-800">
            Customize the floating card and three feature badges on the right-side visual banner:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Top Left Tag</label>
              <input
                type="text"
                value={heroCardTag}
                onChange={(e) => setHeroCardTag(e.target.value)}
                placeholder="DUAL NUMBER SERVICE"
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-900 outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Main Card Title</label>
              <input
                type="text"
                value={heroCardTitle}
                onChange={(e) => setHeroCardTitle(e.target.value)}
                placeholder="Canada + China Dual Line"
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-900 outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Card Price Display</label>
              <input
                type="text"
                value={heroCardPrice}
                onChange={(e) => setHeroCardPrice(e.target.value)}
                placeholder="$27/mo"
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-900 outline-none focus:border-teal-500 font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Card Price Subtitle</label>
              <input
                type="text"
                value={heroCardSubtitle}
                onChange={(e) => setHeroCardSubtitle(e.target.value)}
                placeholder="Telus 5G eSIM"
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-900 outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="border-t border-teal-200/60 pt-3">
            <span className="text-[11px] font-bold text-teal-900 block mb-2">
              Bottom 3 Graphic Feature Boxes
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Box 1</span>
                <input
                  type="text"
                  value={heroBox1Title}
                  onChange={(e) => setHeroBox1Title(e.target.value)}
                  placeholder="4 Countries"
                  className="w-full rounded border border-slate-200 p-1.5 text-xs font-bold"
                />
                <input
                  type="text"
                  value={heroBox1Sub}
                  onChange={(e) => setHeroBox1Sub(e.target.value)}
                  placeholder="Free Roaming"
                  className="w-full rounded border border-slate-200 p-1.5 text-xs text-slate-600"
                />
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Box 2</span>
                <input
                  type="text"
                  value={heroBox2Title}
                  onChange={(e) => setHeroBox2Title(e.target.value)}
                  placeholder="China #"
                  className="w-full rounded border border-slate-200 p-1.5 text-xs font-bold"
                />
                <input
                  type="text"
                  value={heroBox2Sub}
                  onChange={(e) => setHeroBox2Sub(e.target.value)}
                  placeholder="Included Free"
                  className="w-full rounded border border-slate-200 p-1.5 text-xs text-slate-600"
                />
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Box 3</span>
                <input
                  type="text"
                  value={heroBox3Title}
                  onChange={(e) => setHeroBox3Title(e.target.value)}
                  placeholder="9 Nations"
                  className="w-full rounded border border-slate-200 p-1.5 text-xs font-bold"
                />
                <input
                  type="text"
                  value={heroBox3Sub}
                  onChange={(e) => setHeroBox3Sub(e.target.value)}
                  placeholder="Unlimited Talk"
                  className="w-full rounded border border-slate-200 p-1.5 text-xs text-slate-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hero Visual Asset & Image Upload */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-emerald-700" />
                <span>Active Banner Asset Management</span>
              </span>
              <p className="text-[11px] text-slate-500">
                Upload new image to Supabase Storage bucket ('banners') or select an existing preset style.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerFileUpload}
            />

            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              <span>{isUploading ? 'Uploading Image...' : 'Upload New Banner'}</span>
            </button>
          </div>

          {uploadMessage && (
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{uploadMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="md:col-span-3 flex justify-center">
              <div className="relative h-24 w-full max-w-[180px] overflow-hidden rounded-lg border border-slate-300 bg-slate-100 shadow-xs">
                <img
                  src={heroImage}
                  alt="Active Hero Banner"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="md:col-span-9 space-y-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700">
                  Active Banner Asset Path:
                </label>
                <div className="mt-0.5 font-mono text-[11px] text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-200 break-all select-all">
                  {heroImage}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium">Quick presets:</span>
                {PRESET_IMAGES.map((preset) => (
                  <button
                    key={preset.path}
                    type="button"
                    onClick={() => setHeroImage(preset.path)}
                    className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors ${
                      heroImage === preset.path
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Roaming Fine Print */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Promotional Roaming Footer / Fine Print Text
          </label>
          <textarea
            rows={2}
            value={roamingFinePrint}
            onChange={(e) => setRoamingFinePrint(e.target.value)}
            placeholder="Free roaming when traveling to Canada, US, Mexico, and China..."
            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-emerald-500 outline-none font-medium"
          />
        </div>
      </div>

      {/* SECTION 2: Supabase Public Mobile Submission & Connection Diagnostics (Bug 1 Fix) */}
      <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-700" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Supabase Database & Public Mobile Submission Diagnostics (Bug 1 Fix)
              </h3>
              <p className="text-[11px] text-slate-500">
                Verify that public website visitors on mobile phones & external PCs can insert leads into Supabase.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isTestingInsert}
              onClick={handleTestProbe}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-bold text-white transition-colors shadow-2xs disabled:opacity-50"
            >
              {isTestingInsert ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5" />
              )}
              <span>{isTestingInsert ? 'Testing Probe...' : 'Test Public Anon Insert'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDbSettings(!showDbSettings)}
              className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>{showDbSettings ? 'Hide Config' : 'Configure Keys'}</span>
            </button>
          </div>
        </div>

        {/* Live Diagnostics Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Configuration Status</span>
            <div className="mt-1 flex items-center gap-1.5 font-bold">
              {isSupabaseConfigured ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Configured & Active
                </span>
              ) : (
                <span className="text-amber-700 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> Missing / Incomplete
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Target Leads Table</span>
            <div className="mt-1 font-mono text-[11px] text-emerald-800 font-bold truncate">
              {targetTableName || 'Airwireless'}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Supabase Endpoint URL</span>
            <div className="mt-1 font-mono text-[11px] text-slate-800 truncate" title={supabaseUrl}>
              {supabaseUrl || '(missing in build)'}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Anon Key Status</span>
            <div className="mt-1 font-mono text-[11px] text-slate-800 truncate">
              {supabaseAnonKey ? `${supabaseAnonKey.slice(0, 8)}...${supabaseAnonKey.slice(-6)}` : '(missing)'}
            </div>
          </div>
        </div>

        {/* Test Probe Result Banner */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{testResult.success ? 'Probe Succeeded' : 'Probe Rejected by Supabase'}</span>
            </div>
            <p className="text-[11px] leading-relaxed">{testResult.message}</p>
          </div>
        )}

        {/* SQL Fix Box for Supabase SQL Editor */}
        <div className="rounded-xl border border-slate-200 bg-slate-900 text-slate-100 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">
              Required RLS Policy SQL for Supabase SQL Editor (Table: {targetTableName || 'Airwireless'})
            </span>
            <button
              type="button"
              onClick={handleCopySql}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition-colors"
            >
              {copiedSql ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Run this in your Supabase SQL Editor to allow public mobile visitors to insert callback requests into <strong>{targetTableName || 'Airwireless'}</strong> without error:
          </p>
          <pre className="text-[11px] font-mono bg-black/50 p-2.5 rounded overflow-x-auto text-emerald-300">
            {RLS_SQL_SNIPPET}
          </pre>
        </div>

        {/* Optional Manual Key Configuration (For Hostinger deployments if build-time env vars were omitted) */}
        {showDbSettings && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950">
                Production Database & Table Override
              </span>
              {dbSettingsSaved && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Saved!
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Leads Table</label>
                <input
                  type="text"
                  value={targetTableName}
                  onChange={(e) => setTargetTableNameState(e.target.value)}
                  placeholder="Airwireless"
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">VITE_SUPABASE_URL</label>
                <input
                  type="text"
                  value={customSupabaseUrl}
                  onChange={(e) => setCustomSupabaseUrl(e.target.value)}
                  placeholder="https://xyz.supabase.co"
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">VITE_SUPABASE_ANON_KEY</label>
                <input
                  type="password"
                  value={customSupabaseAnonKey}
                  onChange={(e) => setCustomSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUz..."
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveCustomCredentials}
                className="rounded-lg bg-indigo-600 text-white font-bold px-4 py-1.5 text-xs hover:bg-indigo-700"
              >
                Apply Database Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: Drag-and-Drop Plan Reordering & Pricing */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-700" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Customer Mobile Plans & Pricing ({editablePlans.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Drag cards or use Move Up / Move Down arrows to adjust sequence. Automatically saves to <code className="font-mono text-emerald-700">display_order</code> column.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddNewPlan}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add New Plan</span>
          </button>
        </div>

        {/* Drag-and-drop Plan List */}
        <div className="space-y-4">
          {editablePlans.map((plan, idx) => (
            <div
              key={plan.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, idx)}
              className={`rounded-2xl border transition-all duration-150 ${
                draggedPlanIndex === idx
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-md opacity-75'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
              } p-4 sm:p-5 space-y-4`}
            >
              {/* Header row with drag handle and move controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-700 transition-colors rounded"
                    title="Drag to reorder plan sequence"
                  >
                    <GripVertical className="h-5 w-5" />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0F3E2E] text-white text-[11px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {plan.name}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                      display_order: {plan.display_order ?? idx + 1}
                    </span>
                    {plan.badge && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-xs">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMovePlan(idx, idx - 1)}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move Up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <div className="h-4 w-[1px] bg-slate-200" />
                    <button
                      type="button"
                      disabled={idx === editablePlans.length - 1}
                      onClick={() => handleMovePlan(idx, idx + 1)}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move Down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer ml-2">
                    <input
                      type="checkbox"
                      checked={plan.active}
                      onChange={(e) => handleUpdatePlan(idx, 'active', e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Active</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleDeletePlan(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors ml-1"
                    title="Delete Plan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Grid of plan fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Plan Display Name</label>
                  <input
                    type="text"
                    value={plan.name}
                    onChange={(e) => handleUpdatePlan(idx, 'name', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Monthly Price ($)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      value={plan.monthlyPrice}
                      onChange={(e) => handleUpdatePlan(idx, 'monthlyPrice', parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-200 bg-white pl-6 pr-2 py-2 font-bold font-mono text-emerald-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Regular / Strike Price ($)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      value={plan.regularPrice}
                      onChange={(e) => handleUpdatePlan(idx, 'regularPrice', parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-200 bg-white pl-6 pr-2 py-2 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Data Allowance</label>
                  <input
                    type="text"
                    value={plan.dataAllowance}
                    onChange={(e) => handleUpdatePlan(idx, 'dataAllowance', e.target.value)}
                    placeholder="e.g. 50GB"
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={plan.badge || ''}
                    onChange={(e) => handleUpdatePlan(idx, 'badge', e.target.value)}
                    placeholder="Weekly Special, Best Value"
                    className="w-full rounded-lg border border-slate-200 bg-white p-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Speed Tier</label>
                  <input
                    type="text"
                    value={plan.speedTier}
                    onChange={(e) => handleUpdatePlan(idx, 'speedTier', e.target.value)}
                    placeholder="5G Speeds up to 250 Mbps"
                    className="w-full rounded-lg border border-slate-200 bg-white p-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Rep Commission Rate ($)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      value={plan.commissionRate}
                      onChange={(e) => handleUpdatePlan(idx, 'commissionRate', parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-200 bg-white pl-6 pr-2 py-2 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold text-xs mb-1">
                  Plan Bullet Features (one feature per line)
                </label>
                <textarea
                  rows={3}
                  value={plan.features.join('\n')}
                  onChange={(e) => handleUpdatePlan(idx, 'features', e.target.value.split('\n').filter(Boolean))}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Save bar */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl bg-[#0F3E2E] hover:bg-[#14533D] px-6 py-3 text-sm font-bold text-white transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin text-emerald-300" />
          ) : (
            <Save className="h-4 w-4 text-emerald-300" />
          )}
          <span>{isSaving ? 'Publishing Updates...' : 'Save & Apply CMS Updates'}</span>
        </button>
      </div>
    </form>
  );
};
