import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import {
  uploadHeroBanner,
  saveSiteSettingsToSupabase,
  updatePlanDisplayOrdersInSupabase,
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
  // CMS state
  const [heroTitle, setHeroTitle] = useState(cms.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(cms.heroSubtitle);
  const [heroBadge, setHeroBadge] = useState(cms.heroBadge);
  const [heroPromoPrice, setHeroPromoPrice] = useState(cms.heroPromoPrice);
  const [heroPromoData, setHeroPromoData] = useState(cms.heroPromoData);
  const [heroImage, setHeroImage] = useState(cms.heroImage);
  const [announcementBarText, setAnnouncementBarText] = useState(cms.announcementBarText);
  const [announcementActive, setAnnouncementActive] = useState(cms.announcementActive);
  const [supportPhone, setSupportPhone] = useState(cms.supportPhone);
  const [businessHours, setBusinessHours] = useState(cms.businessHours);
  const [roamingFinePrint, setRoamingFinePrint] = useState(cms.roamingFinePrint || '');

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
  const [isSaving, setIsSaving] = useState(false);

  // Available preset user styles
  const PRESET_IMAGES = [
    { label: 'Green Tech Mobile (Default Style #1)', path: '/assets/aistudio/image_de9eb1a6.png' },
    { label: 'Frosted Emerald Glass (Default Style #2)', path: '/assets/aistudio/image_8a94fde1.png' },
  ];

  /**
   * Handle File Upload & Replacement for Active Banner Asset Path
   * Uploads to Supabase Storage bucket 'banners' and deletes previous asset to save space
   */
  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP, or SVG).');
      return;
    }

    setIsUploading(true);
    setUploadMessage('Uploading banner to Supabase Storage bucket & removing old asset...');

    try {
      const { publicUrl, error } = await uploadHeroBanner(file, heroImage);
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

    // Re-assign display_order (1, 2, 3...)
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

    // Re-assign display_order (1, 2, 3...)
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
    };

    // Ensure display_order is 1-indexed
    const finalizedPlans = editablePlans.map((p, i) => ({
      ...p,
      display_order: i + 1,
    }));

    // 1. Notify parent component to update frontend state & localStorage
    onSaveCms(updatedCms);
    onSavePlans(finalizedPlans);

    // 2. Persist to Supabase site_settings and mobile_plans
    await saveSiteSettingsToSupabase({
      heroTitle,
      heroSubtitle,
      heroImage,
      heroBadge,
      heroPromoPrice,
      heroPromoData,
    });

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
            Control the public hero banner, headlines, and drag-and-drop plan order in real-time.
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

      {/* SECTION 1: Dynamic Hero Banner Management (Image & Text) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-700" />
            <h3 className="text-base font-bold text-slate-900">
              Dynamic Hero Banner Management (Image & Text)
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            Synchronized with site_settings table
          </span>
        </div>

        {/* Top Announcement Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-8">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Top Announcement Ticker Banner
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <BellRing className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={announcementBarText}
                onChange={(e) => setAnnouncementBarText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="md:col-span-4 flex items-center gap-3 pt-5">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={announcementActive}
                onChange={(e) => setAnnouncementActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-3 text-xs font-semibold text-slate-700">
                Show Announcement Bar
              </span>
            </label>
          </div>
        </div>

        {/* Editable Banner Text: Headline & Sub-text */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-800">
                Banner Headline
              </label>
              <span className="text-[10px] text-emerald-700 font-mono font-medium">site_settings.hero_title</span>
            </div>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="e.g. CTExcel Mobile Plans Powered by Telus"
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-emerald-500 outline-none font-medium"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Main H1 display text appearing at the top of the frontend homepage.
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
            <p className="text-[11px] text-slate-500 mt-1">
              Accent pill badge rendered directly above the headline.
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-800">
              Banner Sub-text
            </label>
            <span className="text-[10px] text-emerald-700 font-mono font-medium">site_settings.hero_subtitle</span>
          </div>
          <textarea
            rows={2}
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            placeholder="Stay seamlessly connected across Canada, China, the US, and Mexico..."
            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-emerald-500 outline-none font-normal"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Replaces any hardcoded sub-text on the frontend hero section dynamically.
          </p>
        </div>

        {/* Dynamic Weekly/Monthly Spotlight Price */}
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

            {/* Hidden file input */}
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

          {/* Active Banner Asset Path & Preview */}
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
                <span className="text-[11px] text-slate-500 font-medium">Or choose quick preset:</span>
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
          <p className="text-[11px] text-slate-500 mt-0.5">
            Displays directly beneath the plans grid on the public frontend.
          </p>
        </div>
      </div>

      {/* SECTION 2: Drag-and-Drop Plan Reordering & Pricing */}
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
                  {/* Grip Handle for Drag and Drop */}
                  <div
                    className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-700 transition-colors rounded"
                    title="Drag to reorder plan sequence"
                  >
                    <GripVertical className="h-5 w-5" />
                  </div>

                  {/* Position Badge & display_order */}
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
                  {/* Move Up / Move Down buttons */}
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

              {/* Features list text area (one per line) */}
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
