import React, { useState } from 'react';
import { Plan, CMSConfig } from '../../types/telecom';
import {
  Sparkles,
  DollarSign,
  Image as ImageIcon,
  Save,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  Eye,
  Type,
  BellRing,
} from 'lucide-react';

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

  // Plans state
  const [editablePlans, setEditablePlans] = useState<Plan[]>(JSON.parse(JSON.stringify(plans)));
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Available user uploaded images
  const PRESET_IMAGES = [
    { label: 'Green Tech Mobile (User Style #1)', path: '/assets/aistudio/image_de9eb1a6.png' },
    { label: 'Frosted Emerald Glass (User Style #2)', path: '/assets/aistudio/image_8a94fde1.png' },
  ];

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

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

    onSaveCms(updatedCms);
    onSavePlans(editablePlans);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
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
    };
    setEditablePlans([...editablePlans, newPlan]);
  };

  const handleDeletePlan = (index: number) => {
    if (editablePlans.length <= 1) {
      alert('You must have at least one active plan.');
      return;
    }
    const updated = editablePlans.filter((_, i) => i !== index);
    setEditablePlans(updated);
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
            Modify promotional banners, weekly hero pricing, and live customer plan offerings without touching code.
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
            className="flex items-center gap-1.5 rounded-xl bg-[#0F3E2E] hover:bg-[#14533D] px-5 py-2 text-xs font-bold text-white transition-colors shadow-xs"
          >
            <Save className="h-3.5 w-3.5 text-emerald-300" />
            <span>Save & Publish Live</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Top Announcement Bar & Hero Promo */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sparkles className="h-5 w-5 text-emerald-700" />
          <h3 className="text-base font-bold text-slate-900">
            Promotional Hero Banner & Headline CMS
          </h3>
        </div>

        {/* Announcement Bar text */}
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

        {/* Hero Title & Subtitle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Hero Section Main Title
            </label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Hero Promo Badge
            </label>
            <input
              type="text"
              value={heroBadge}
              onChange={(e) => setHeroBadge(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Hero Subtitle / Description Text
          </label>
          <textarea
            rows={2}
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-emerald-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Promotional Roaming Footer / Fine Print Text (Mandatory)
          </label>
          <textarea
            rows={3}
            value={roamingFinePrint}
            onChange={(e) => setRoamingFinePrint(e.target.value)}
            placeholder="Free roaming when traveling to Canada, US, Mexico, and China. Includes a complimentary Chinese phone number..."
            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-emerald-500 outline-none font-medium"
          />
          <p className="text-[11px] text-slate-500 mt-0.5">
            Displays directly beneath the 5 plans on the public frontend.
          </p>
        </div>

        {/* Dynamic Weekly/Monthly Spotlight Price */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
          <div>
            <label className="block text-xs font-bold text-emerald-900 mb-1">
              Featured Weekly Price
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

          <div>
            <label className="block text-xs font-bold text-emerald-900 mb-1">
              Hero Visual Asset / Banner Image
            </label>
            <select
              value={heroImage}
              onChange={(e) => setHeroImage(e.target.value)}
              className="w-full rounded-lg border border-emerald-200 bg-white p-2 text-xs text-slate-900 outline-none"
            >
              {PRESET_IMAGES.map((img) => (
                <option key={img.path} value={img.path}>
                  {img.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Image preview thumbnail */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shrink-0">
            <img src={heroImage} alt="Hero Asset" className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-800">Active Banner Asset Path:</div>
            <div className="font-mono text-[11px] text-slate-500 break-all">{heroImage}</div>
          </div>
        </div>

      </div>

      {/* SECTION 2: Plan Pricing & Details Editor */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-700" />
            <h3 className="text-base font-bold text-slate-900">
              Customer Mobile Plans & Pricing ({editablePlans.length})
            </h3>
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

        <div className="space-y-4">
          {editablePlans.map((plan, idx) => (
            <div
              key={plan.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0F3E2E] text-white text-[11px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {plan.name}
                  </span>
                  {plan.badge && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      {plan.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plan.active}
                      onChange={(e) => handleUpdatePlan(idx, 'active', e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Active on Site</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleDeletePlan(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
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
          className="flex items-center gap-2 rounded-xl bg-[#0F3E2E] hover:bg-[#14533D] px-6 py-3 text-sm font-bold text-white transition-all shadow-md active:scale-[0.99]"
        >
          <Save className="h-4 w-4 text-emerald-300" />
          <span>Save & Apply CMS Updates</span>
        </button>
      </div>

    </form>
  );
};
