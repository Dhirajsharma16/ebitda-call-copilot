'use client';

import React, { useState, useEffect } from 'react';
import { X, Building2, Globe, MapPin, User, Briefcase, AlertCircle, DollarSign, Sparkles, ShieldCheck, Loader2, Lightbulb } from 'lucide-react';
import { Company } from '@/lib/types';
import { api } from '@/lib/api';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (company: Company) => void;
  initialData?: Company | null;
}

const COMMON_INDUSTRIES = [
  'Manufacturing',
  'Transportation & Logistics',
  'Enterprise Software / SaaS',
  'Wholesale Distribution',
  'Healthcare Services',
  'Financial Services',
  'Construction & Engineering',
  'Energy & Utilities',
  'Retail & E-Commerce',
  'Other / Specialized'
];

export default function CompanyModal({ isOpen, onClose, onSuccess, initialData }: CompanyModalProps) {
  const [formData, setFormData] = useState({
    company_name: '',
    website: '',
    industry: 'Manufacturing',
    location: '',
    contact_name: '',
    contact_designation: 'Managing Director',
    business_challenges: '',
    revenue: '',
    operating_expenses: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [researching, setResearching] = useState(false);
  const [aiBenchmark, setAiBenchmark] = useState<{ range: string; hook: string } | null>(null);

  const handleAutoResearch = async () => {
    if (!formData.company_name.trim()) {
      setError('Please provide a company name first to run AI research.');
      return;
    }
    setResearching(true);
    setError(null);
    try {
      const res = await api.researchCompany({
        company_name: formData.company_name.trim(),
        industry: formData.industry,
      });
      if (res && res.data) {
        setFormData(prev => ({
          ...prev,
          business_challenges: prev.business_challenges.trim()
            ? `${prev.business_challenges}\n\n• AI Intel: ${res.data.business_challenges}`
            : res.data.business_challenges,
        }));
        setAiBenchmark({
          range: res.data.typical_ebitda_margin_range,
          hook: res.data.executive_hook,
        });
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setResearching(false);
    }
  };

  useEffect(() => {
    setAiBenchmark(null);
    if (initialData) {
      setFormData({
        company_name: initialData.company_name || '',
        website: initialData.website || '',
        industry: initialData.industry || 'Manufacturing',
        location: initialData.location || '',
        contact_name: initialData.contact_name || '',
        contact_designation: initialData.contact_designation || 'Managing Director',
        business_challenges: initialData.business_challenges || '',
        revenue: initialData.revenue ? String(initialData.revenue) : '',
        operating_expenses: initialData.operating_expenses ? String(initialData.operating_expenses) : '',
      });
    } else {
      setFormData({
        company_name: '',
        website: '',
        industry: 'Manufacturing',
        location: '',
        contact_name: '',
        contact_designation: 'Managing Director',
        business_challenges: '',
        revenue: '',
        operating_expenses: '',
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const revNum = parseFloat(formData.revenue) || 0;
  const opexNum = parseFloat(formData.operating_expenses) || 0;
  const previewEbitda = revNum - opexNum;
  const previewMargin = revNum > 0 ? (previewEbitda / revNum) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name.trim()) {
      setError('Company name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        company_name: formData.company_name.trim(),
        website: formData.website.trim() || undefined,
        industry: formData.industry,
        location: formData.location.trim() || undefined,
        contact_name: formData.contact_name.trim() || undefined,
        contact_designation: formData.contact_designation.trim() || undefined,
        business_challenges: formData.business_challenges.trim() || undefined,
        revenue: revNum,
        operating_expenses: opexNum,
      };

      let result: Company;
      if (initialData?.id) {
        result = await api.updateCompany(initialData.id, payload);
      } else {
        result = await api.createCompany(payload);
      }

      onSuccess(result);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save company profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0B1120] border border-white/[0.1] rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                {initialData ? 'Edit Prospect Dossier' : 'Add Target Account'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Factual intelligence for AI sales preparation & EBITDA modeling
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fact check notice */}
        <div className="px-6 py-2.5 bg-blue-950/30 border-b border-blue-900/40 text-xs text-blue-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong>User-Verified Only:</strong> AI assistant uses only what is supplied here. Never invent hypothetical figures as actuals.
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Company Name & Website */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Company Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Industrial Logistics Corp"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-3.5 py-2 text-xs glass-input rounded-xl text-white placeholder-slate-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Company Website
              </label>
              <input
                type="url"
                placeholder="https://company.example.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3.5 py-2 text-xs glass-input rounded-xl text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* Industry & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Industry Sector
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-3.5 py-2 text-xs glass-input rounded-xl text-white cursor-pointer"
              >
                {COMMON_INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind} className="bg-slate-950 text-white">
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Location / Country
              </label>
              <input
                type="text"
                placeholder="e.g. Dallas, TX, USA"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3.5 py-2 text-xs glass-input rounded-xl text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* Contact Person & Designation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Contact Name
              </label>
              <input
                type="text"
                placeholder="e.g. Marcus Vance"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                className="w-full px-3.5 py-2 text-xs glass-input rounded-xl text-white placeholder-slate-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Executive Designation / Title
              </label>
              <input
                type="text"
                placeholder="e.g. Chief Executive Officer, MD"
                value={formData.contact_designation}
                onChange={(e) => setFormData({ ...formData, contact_designation: e.target.value })}
                className="w-full px-3.5 py-2 text-xs glass-input rounded-xl text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* Known Business Challenges */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                Known Business Challenges & Margin Headwinds
              </label>
              <button
                type="button"
                onClick={handleAutoResearch}
                disabled={researching || !formData.company_name}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-semibold transition-all disabled:opacity-40"
              >
                {researching ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                    <span>Researching Intel...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    <span>Auto-Research with Gemini</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="e.g. Rising fleet maintenance costs, legacy dispatch software causing route delays, margin compression before board review..."
              value={formData.business_challenges}
              onChange={(e) => setFormData({ ...formData, business_challenges: e.target.value })}
              className="w-full p-3 text-xs glass-input rounded-xl text-white placeholder-slate-500 leading-relaxed font-sans"
            />

            {aiBenchmark && (
              <div className="mt-2 p-3 rounded-xl bg-blue-950/20 border border-blue-900/40 text-xs space-y-1.5 animate-fade-in">
                <div className="flex items-center gap-2 text-blue-300 font-semibold text-[11px]">
                  <Lightbulb className="w-3.5 h-3.5 text-blue-400" />
                  <span>Sector Intelligence Benchmark</span>
                  <span className="text-slate-400 font-normal font-mono">
                    Typical Margin: <strong className="text-emerald-400">{aiBenchmark.range}</strong>
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                  "{aiBenchmark.hook}"
                </p>
              </div>
            )}
          </div>

          {/* Financial Inputs & Real-time EBITDA Preview */}
          <div className="p-4 bg-black/60 border border-white/[0.08] rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Financial Baseline (Optional)
              </span>
              <span className="text-[10px] text-slate-400">Excluding D&A, Int., Tax</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Annual Revenue ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 42500000"
                  value={formData.revenue}
                  onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs glass-input rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Operating Expenses ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 38250000"
                  value={formData.operating_expenses}
                  onChange={(e) => setFormData({ ...formData, operating_expenses: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs glass-input rounded-xl text-white font-mono"
                />
              </div>
            </div>

            {/* Calculated Preview Box */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-white/[0.06] text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Calculated EBITDA:</span>
                <span className={`font-mono font-bold ${previewEbitda >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${previewEbitda.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">EBITDA Margin:</span>
                <span className="font-mono font-bold text-blue-400">
                  {previewMargin.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors border border-white/[0.06]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-600/30 disabled:opacity-50 transition-all hover:scale-[1.02]"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{initialData ? 'Update Dossier' : 'Save Account'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
