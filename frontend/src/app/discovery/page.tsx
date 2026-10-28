'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  Search,
  Sparkles,
  ExternalLink,
  Plus,
  Check,
  AlertCircle,
  Building2,
  MapPin,
  FileText,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  X,
  PhoneCall,
  Loader2,
  Layers,
  ArrowUpDown,
  RefreshCw,
  Globe,
  DollarSign,
  Info,
  CheckCircle2,
  Eye,
  Trash2,
  BookmarkPlus
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  DiscoveredProspect,
  ProspectDiscoveryRequest,
  ProspectDiscoveryResponse,
  DiscoveryOptionsResponse
} from '@/lib/types';

export default function ProspectDiscoveryPage() {
  const router = useRouter();

  // Search filter states
  const [industry, setIndustry] = useState<string>('Textile');
  const [geography, setGeography] = useState<string>('Tamil Nadu (Coimbatore / Tirupur / Chennai)');
  const [customGeography, setCustomGeography] = useState<string>('');
  const [companySize, setCompanySize] = useState<string>('Any');
  const [limit, setLimit] = useState<number>(10);
  const [additionalRequirements, setAdditionalRequirements] = useState<string>('');

  // Options loaded from backend
  const [options, setOptions] = useState<DiscoveryOptionsResponse>({
    industries: ['Textile', 'Spinning', 'Automobile', 'Auto Components', 'Packaging', 'FMCG', 'Chemicals', 'Other Manufacturing'],
    geography_presets: [
      'India (All Regions)',
      'Tamil Nadu (Coimbatore / Tirupur / Chennai)',
      'Gujarat (Ahmedabad / Surat / Vadodara / Vapi)',
      'Maharashtra (Pune / Chakan / Aurangabad / Mumbai)',
      'Punjab & Haryana (Ludhiana / Sonipat / Panipat)',
      'Rajasthan (Bhilwara / Jaipur)'
    ],
    company_sizes: ['Small', 'Medium', 'Large', 'Any'],
    limit_options: [10, 25, 50]
  });

  // Search execution states
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchStep, setSearchStep] = useState<string>('');
  const [searchResults, setSearchResults] = useState<DiscoveredProspect[]>([]);
  const [lastSearchMeta, setLastSearchMeta] = useState<ProspectDiscoveryResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Results UI view states
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'fit_desc' | 'confidence_desc' | 'name_asc' | 'revenue_desc'>('fit_desc');
  const [filterHighFitOnly, setFilterHighFitOnly] = useState<boolean>(false);
  const [filterVerifiedFinancials, setFilterVerifiedFinancials] = useState<boolean>(false);
  const [dismissedProspects, setDismissedProspects] = useState<Set<string>>(new Set());

  // Interactive Modals / Drawers
  const [selectedProspect, setSelectedProspect] = useState<DiscoveredProspect | null>(null);
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [addingTargetId, setAddingTargetId] = useState<string | null>(null);

  // Load options & initial discovery on mount
  useEffect(() => {
    async function fetchOpts() {
      try {
        const opts = await api.getDiscoveryOptions();
        if (opts && opts.industries) {
          setOptions(opts);
        }
      } catch (err) {
        console.error('Failed to load discovery options:', err);
      }
    }
    fetchOpts();

    // Trigger initial discovery so user immediately sees rich verified prospects
    executeSearch({
      industry: 'Textile',
      geography: 'Tamil Nadu (Coimbatore / Tirupur / Chennai)',
      company_size: 'Any',
      limit: 10,
      additional_requirements: 'Vertical spinning mills with captive power or modernization investments'
    });
  }, []);

  const executeSearch = async (overrideParams?: ProspectDiscoveryRequest) => {
    setIsSearching(true);
    setSearchError(null);
    setSearchStep('Querying verified industrial registries & regional indices...');

    const timer1 = setTimeout(() => {
      setSearchStep('Grounding company disclosures, official domains & BSE/NSE filings...');
    }, 800);

    const timer2 = setTimeout(() => {
      setSearchStep('Evaluating EBITDA exposure, power tariffs & operating margins...');
    }, 1800);

    const timer3 = setTimeout(() => {
      setSearchStep('Calibrating Prospect Fit Score & generating diagnostic hypotheses...');
    }, 2800);

    try {
      const activeGeography = customGeography.trim() || geography;
      const params: ProspectDiscoveryRequest = overrideParams || {
        industry,
        geography: activeGeography,
        company_size: companySize,
        limit,
        additional_requirements: additionalRequirements.trim() || undefined
      };

      const resp = await api.discoverProspects(params);
      setSearchResults(resp.prospects || []);
      setLastSearchMeta(resp);
      setDismissedProspects(new Set());
    } catch (err: any) {
      console.error('Discovery error:', err);
      setSearchError(err.message || 'An error occurred during discovery research. Please retry.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsSearching(false);
      setSearchStep('');
    }
  };

  const handleAddToTarget = async (prospect: DiscoveredProspect, forceUpdate = false) => {
    setAddingTargetId(prospect.company_name);
    try {
      const resp = await api.addProspectToTarget({
        prospect,
        force_update: forceUpdate
      });

      // Update state to mark company as saved
      setSearchResults(prev =>
        prev.map(p =>
          p.company_name === prospect.company_name
            ? { ...p, is_saved_in_accounts: true, existing_account_id: resp.company_id }
            : p
        )
      );

      if (selectedProspect && selectedProspect.company_name === prospect.company_name) {
        setSelectedProspect(prev => prev ? { ...prev, is_saved_in_accounts: true, existing_account_id: resp.company_id } : null);
      }

      setActionNotice({
        message: resp.message,
        type: resp.already_exists ? 'info' : 'success'
      });
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      setActionNotice({
        message: err.message || 'Could not save company to target accounts.',
        type: 'error'
      });
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setAddingTargetId(null);
    }
  };

  const handleDismiss = (companyName: string) => {
    setDismissedProspects(prev => new Set(prev).add(companyName));
  };

  const handleLaunchWorkspace = async (prospect: DiscoveredProspect) => {
    // If not saved, save it first so workspace loads it cleanly
    if (!prospect.is_saved_in_accounts || !prospect.existing_account_id) {
      try {
        setAddingTargetId(prospect.company_name);
        const resp = await api.addProspectToTarget({ prospect, force_update: false });
        router.push(`/workspace?companyId=${resp.company_id}`);
      } catch (e) {
        router.push(`/workspace?companyName=${encodeURIComponent(prospect.company_name)}&industry=${encodeURIComponent(prospect.industry)}`);
      } finally {
        setAddingTargetId(null);
      }
    } else {
      router.push(`/workspace?companyId=${prospect.existing_account_id}`);
    }
  };

  // Filtered & Sorted Prospects
  const visibleProspects = useMemo(() => {
    let list = searchResults.filter(p => !dismissedProspects.has(p.company_name));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.company_name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.industry.toLowerCase().includes(q) ||
        (p.products_services && p.products_services.toLowerCase().includes(q))
      );
    }

    if (filterHighFitOnly) {
      list = list.filter(p => p.prospect_fit_score >= 85);
    }

    if (filterVerifiedFinancials) {
      list = list.filter(p => p.revenue !== null && p.revenue !== undefined && p.revenue > 0);
    }

    list.sort((a, b) => {
      if (sortBy === 'fit_desc') return b.prospect_fit_score - a.prospect_fit_score;
      if (sortBy === 'confidence_desc') {
        const confWeight = (c: string) => (c === 'High' ? 3 : c === 'Medium' ? 2 : 1);
        return confWeight(b.evidence_confidence) - confWeight(a.evidence_confidence);
      }
      if (sortBy === 'revenue_desc') {
        return (b.revenue || 0) - (a.revenue || 0);
      }
      if (sortBy === 'name_asc') {
        return a.company_name.localeCompare(b.company_name);
      }
      return 0;
    });

    return list;
  }, [searchResults, dismissedProspects, searchQuery, filterHighFitOnly, filterVerifiedFinancials, sortBy]);

  const formatCurrency = (val?: number | null) => {
    if (val === null || val === undefined) return 'Not publicly available';
    if (val >= 1000000000) {
      return `₹${(val / 10000000).toLocaleString('en-IN', { maximumFractionDigits: 1 })} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toLocaleString('en-IN', { maximumFractionDigits: 1 })} L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> High Confidence
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Info className="w-3.5 h-3.5 text-amber-400" /> Medium Confidence
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-700/50 text-slate-200 border border-slate-600">
            Low / Exploratory
          </span>
        );
    }
  };

  const getFitScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-300 border-emerald-500/50 bg-emerald-950/60';
    if (score >= 75) return 'text-blue-300 border-blue-500/50 bg-blue-950/60';
    if (score >= 60) return 'text-amber-300 border-amber-500/50 bg-amber-950/60';
    return 'text-rose-300 border-rose-500/50 bg-rose-950/60';
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 pb-24">
      {/* Action Notification Toast */}
      {actionNotice && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl backdrop-blur-xl border transition-all duration-300 ${
          actionNotice.type === 'success'
            ? 'bg-emerald-950/95 text-emerald-100 border-emerald-500/60 shadow-emerald-900/50'
            : actionNotice.type === 'info'
            ? 'bg-blue-950/95 text-blue-100 border-blue-500/60 shadow-blue-900/50'
            : 'bg-rose-950/95 text-rose-100 border-rose-500/60 shadow-rose-900/50'
        }`}>
          {actionNotice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : actionNotice.type === 'info' ? (
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          )}
          <span className="text-xs font-bold">{actionNotice.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="border-b border-slate-800 bg-[#0B1120] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 mb-3">
                <Compass className="w-4 h-4 text-blue-400" />
                Autonomous Corporate Discovery & Research
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                AI Prospect Discovery
              </h1>
              <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed font-medium">
                Discover actual operating manufacturing enterprises across India. Verifies public registries, BSE/NSE filings, official company domains, and extracts real operational parameters without fabricating facts.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/companies"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all shadow-md"
              >
                <Building2 className="w-4 h-4 text-blue-400" />
                Target Accounts ({searchResults.filter(p => p.is_saved_in_accounts).length} Synced)
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Research Filter Console */}
        <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-5">
            <SlidersHorizontal className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Discovery Scope & Targeting Filters
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Industry Selector */}
            <div>
              <label className="block text-xs font-extrabold text-slate-200 mb-1.5 uppercase tracking-wide">
                Target Industry
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                style={{ backgroundColor: '#0B132B', color: '#FFFFFF' }}
                className="w-full bg-[#0B132B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-blue-500 transition-colors cursor-pointer shadow-inner"
              >
                {options.industries.map((ind) => (
                  <option key={ind} value={ind} style={{ backgroundColor: '#0B132B', color: '#FFFFFF' }}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            {/* Geography Selector */}
            <div>
              <label className="block text-xs font-extrabold text-slate-200 mb-1.5 uppercase tracking-wide">
                Geography / Region
              </label>
              <select
                value={geography}
                onChange={(e) => {
                  setGeography(e.target.value);
                  if (e.target.value !== 'custom') setCustomGeography('');
                }}
                style={{ backgroundColor: '#0B132B', color: '#FFFFFF' }}
                className="w-full bg-[#0B132B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-blue-500 transition-colors cursor-pointer shadow-inner"
              >
                {options.geography_presets.map((geo) => (
                  <option key={geo} value={geo} style={{ backgroundColor: '#0B132B', color: '#FFFFFF' }}>
                    {geo}
                  </option>
                ))}
              </select>
            </div>

            {/* Company Scale */}
            <div>
              <label className="block text-xs font-extrabold text-slate-200 mb-1.5 uppercase tracking-wide">
                Company Scale
              </label>
              <select
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                style={{ backgroundColor: '#0B132B', color: '#FFFFFF' }}
                className="w-full bg-[#0B132B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-blue-500 transition-colors cursor-pointer shadow-inner"
              >
                {options.company_sizes.map((size) => (
                  <option key={size} value={size} style={{ backgroundColor: '#0B132B', color: '#FFFFFF' }}>
                    {size === 'Any' ? 'Any Verified Scale' : `${size} Enterprise`}
                  </option>
                ))}
              </select>
            </div>

            {/* Number of Companies */}
            <div>
              <label className="block text-xs font-extrabold text-slate-200 mb-1.5 uppercase tracking-wide">
                Discovery Limit
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                style={{ backgroundColor: '#0B132B', color: '#FFFFFF' }}
                className="w-full bg-[#0B132B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-blue-500 transition-colors cursor-pointer shadow-inner"
              >
                {options.limit_options.map((lim) => (
                  <option key={lim} value={lim} style={{ backgroundColor: '#0B132B', color: '#FFFFFF' }}>
                    {lim} Verified Companies
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Geography Custom Override */}
          <div className="mt-3">
            <input
              type="text"
              placeholder="Or enter a specific industrial cluster / city (e.g. 'Hosur', 'Pithampur', 'Vapi Industrial Area', 'Sanand Auto Hub')..."
              value={customGeography}
              onChange={(e) => setCustomGeography(e.target.value)}
              className="w-full bg-[#0B132B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium transition-colors shadow-inner"
            />
          </div>

          {/* Additional Research Focus Instructions */}
          <div className="mt-4">
            <label className="block text-xs font-extrabold text-slate-200 mb-1.5 uppercase tracking-wide">
              Additional Research Instructions (Optional)
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="e.g. 'Target Tier-1 auto component suppliers with robotic CNC lines', 'Prioritize export-oriented spinning units'..."
                value={additionalRequirements}
                onChange={(e) => setAdditionalRequirements(e.target.value)}
                className="flex-1 bg-[#0B132B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium transition-colors shadow-inner"
              />

              <button
                type="button"
                onClick={() => executeSearch()}
                disabled={isSearching}
                className="inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 transition-all flex-shrink-0 cursor-pointer"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Finding Companies...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-white" />
                    Find Companies
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Dynamic Loading Step Indicator */}
          {isSearching && (
            <div className="mt-5 p-4 rounded-xl bg-blue-950/80 border border-blue-500/50 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
              <div className="flex-1">
                <span className="text-xs font-bold text-blue-300 tracking-wide uppercase">
                  Live Public Intelligence Gathering
                </span>
                <p className="text-xs text-white font-medium mt-0.5">
                  {searchStep}
                </p>
              </div>
            </div>
          )}

          {/* Search Error State */}
          {searchError && (
            <div className="mt-5 p-4 rounded-xl bg-rose-950/80 border border-rose-500/50 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-xs font-bold text-rose-300 uppercase">Search Notice</span>
                <p className="text-xs text-rose-100 mt-0.5">{searchError}</p>
                <button
                  onClick={() => executeSearch()}
                  className="mt-2 text-xs font-bold text-rose-300 underline hover:text-white"
                >
                  Click here to retry
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Toolbar & Metadata Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              Discovered Prospects
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                {visibleProspects.length} Active
              </span>
            </h3>

            {lastSearchMeta && (
              <span className="text-xs text-slate-300 hidden sm:inline font-medium">
                Sector: <strong className="text-white font-bold">{lastSearchMeta.industry}</strong> • Region: <strong className="text-white font-bold">{lastSearchMeta.geography}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Quick Keyword Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter by name, city, product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#0B132B] border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 w-52 sm:w-60 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-1.5 bg-[#0B132B] border border-slate-700 rounded-xl px-2 py-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-400" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                style={{ backgroundColor: '#0B132B', color: '#FFFFFF' }}
                className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="fit_desc" style={{ backgroundColor: '#0B132B', color: '#FFFFFF' }}>Highest Fit Score</option>
                <option value="confidence_desc" style={{ backgroundColor: '#0B132B', color: '#FFFFFF' }}>Highest Evidence</option>
                <option value="revenue_desc" style={{ backgroundColor: '#0B132B', color: '#FFFFFF' }}>Highest Revenue</option>
                <option value="name_asc" style={{ backgroundColor: '#0B132B', color: '#FFFFFF' }}>Company Name A-Z</option>
              </select>
            </div>

            {/* Quick Filters */}
            <button
              onClick={() => setFilterHighFitOnly(!filterHighFitOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                filterHighFitOnly
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                  : 'bg-[#0B132B] text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800'
              }`}
            >
              Fit &ge; 85
            </button>

            <button
              onClick={() => setFilterVerifiedFinancials(!filterVerifiedFinancials)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                filterVerifiedFinancials
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-[#0B132B] text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800'
              }`}
            >
              Disclosed EBITDA
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#0B132B] border border-slate-700 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
                title="Grid Cards View"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
                title="Dense Data Table View"
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Area */}
        {visibleProspects.length === 0 && !isSearching ? (
          <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-12 text-center shadow-xl">
            <Building2 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white">No prospects matching current criteria</h4>
            <p className="text-xs text-slate-300 max-w-md mx-auto mt-1 font-medium">
              Try broadening your geography, resetting the custom instruction, or unchecking the high-fit filter.
            </p>
            <button
              onClick={() => {
                setFilterHighFitOnly(false);
                setFilterVerifiedFinancials(false);
                setSearchQuery('');
                executeSearch();
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-md cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Filters & Research
            </button>
          </div>
        ) : viewMode === 'cards' ? (
          /* Cards Grid Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleProspects.map((prospect) => (
              <div
                key={prospect.company_name}
                className="rounded-2xl border border-slate-800 bg-[#0F172A] hover:border-blue-500/60 transition-all duration-200 flex flex-col justify-between p-5 relative group overflow-hidden shadow-xl"
              >
                <div>
                  {/* Header: Company Name, Fit Score, Confidence */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-base font-extrabold text-white group-hover:text-blue-300 transition-colors truncate">
                          {prospect.company_name}
                        </h4>
                        {prospect.is_saved_in_accounts && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-600/30 text-blue-300 border border-blue-500/50">
                            <Check className="w-3 h-3" /> Target Account
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-300 font-medium">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                          {prospect.location}
                        </span>
                      </div>
                    </div>

                    {/* Quick Add Action & Fit Score Badge - No scrolling needed */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {prospect.is_saved_in_accounts ? (
                        <button
                          onClick={() => handleLaunchWorkspace(prospect)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-sm"
                          title="Open in Call Workspace"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span className="hidden sm:inline">Call</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddToTarget(prospect)}
                          disabled={addingTargetId === prospect.company_name}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                          title="Add to Target Accounts immediately"
                        >
                          {addingTargetId === prospect.company_name ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <BookmarkPlus className="w-3 h-3" />
                              <span>+ Add</span>
                            </>
                          )}
                        </button>
                      )}
                      <div className="flex flex-col items-end">
                        <div className={`px-2.5 py-1 rounded-xl border text-xs font-black shadow-md ${getFitScoreColor(prospect.prospect_fit_score)}`}>
                          {prospect.prospect_fit_score}/100
                        </div>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight mt-0.5">
                          Fit Score
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Industry & Scale Tags */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-white border border-slate-700">
                      {prospect.industry}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800/80 text-slate-200 border border-slate-700">
                      {prospect.company_size} Scale
                    </span>
                    {getConfidenceBadge(prospect.evidence_confidence)}
                  </div>

                  {/* Official Website */}
                  {prospect.website && (
                    <div className="mb-3">
                      <a
                        href={prospect.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-bold truncate max-w-full"
                      >
                        <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{prospect.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-80" />
                      </a>
                    </div>
                  )}

                  {/* Verified Financials Box */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 mb-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-extrabold text-slate-300 tracking-wider block mb-0.5">
                        Verified Revenue
                      </span>
                      <span className="font-bold text-sm text-white font-mono">
                        {formatCurrency(prospect.revenue)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-extrabold text-slate-300 tracking-wider block mb-0.5">
                        EBITDA / Margin
                      </span>
                      <span className="font-bold text-sm text-emerald-400 font-mono">
                        {prospect.ebitda_margin_pct !== null && prospect.ebitda_margin_pct !== undefined
                          ? `${prospect.ebitda_margin_pct.toFixed(1)}% (${formatCurrency(prospect.ebitda)})`
                          : 'Not publicly available'}
                      </span>
                    </div>
                  </div>

                  {/* Research Summary Snippet */}
                  <p className="text-xs text-slate-200 leading-relaxed mb-3 font-medium">
                    {prospect.research_summary}
                  </p>

                  {/* AI Diagnostic Hypothesis Callout */}
                  <div className="p-3.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 mb-3 shadow-inner">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-300 flex-shrink-0" />
                      <span className="text-[11px] font-extrabold text-indigo-200 uppercase tracking-wider">
                        Discovery Angle [AI Hypothesis]
                      </span>
                    </div>
                    <p className="text-xs text-white leading-relaxed font-medium">
                      {prospect.potential_discovery_angle.replace(/^\[AI Diagnostic Hypothesis\]:\s*/i, '')}
                    </p>
                  </div>

                  {/* Capex & Expansion News (if present) */}
                  {prospect.expansion_news && (
                    <div className="text-xs text-slate-200 mb-3 bg-blue-950/50 p-3 rounded-xl border border-blue-500/30 leading-relaxed">
                      <span className="font-extrabold text-blue-300 mr-1.5">Capex & Expansion:</span>
                      <span>{prospect.expansion_news}</span>
                    </div>
                  )}

                  {/* Fit Score Rationale */}
                  <div className="text-xs text-slate-200 mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
                    <span className="font-extrabold text-amber-300 mr-1.5">Why this score:</span>
                    <span>{prospect.fit_score_reason}</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedProspect(prospect)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
                      title="View complete corporate dossier and sources"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      Dossier
                    </button>

                    <button
                      onClick={() => handleDismiss(prospect.company_name)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Dismiss from current view"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {prospect.is_saved_in_accounts ? (
                      <button
                        onClick={() => handleLaunchWorkspace(prospect)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5" /> Call Workspace
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddToTarget(prospect)}
                        disabled={addingTargetId === prospect.company_name}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {addingTargetId === prospect.company_name ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <BookmarkPlus className="w-3.5 h-3.5" />
                        )}
                        + Add Target
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Dense Data Table View */
          <div className="rounded-2xl border border-slate-800 bg-[#0F172A] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-slate-950 text-slate-200 font-extrabold uppercase tracking-wider text-xs border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Company & Official Web</th>
                    <th className="px-4 py-3.5">Location & Sector</th>
                    <th className="px-4 py-3.5">Verified Revenue</th>
                    <th className="px-4 py-3.5">EBITDA / Margin</th>
                    <th className="px-4 py-3.5 text-center">Fit Score</th>
                    <th className="px-4 py-3.5">Evidence Confidence</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {visibleProspects.map((prospect) => (
                    <tr key={prospect.company_name} className="hover:bg-slate-800/60 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-white max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm">{prospect.company_name}</span>
                          {prospect.is_saved_in_accounts && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/30 text-blue-300 border border-blue-500/40">
                              Target
                            </span>
                          )}
                        </div>
                        {prospect.website && (
                          <a
                            href={prospect.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-1 font-semibold"
                          >
                            <Globe className="w-3 h-3" />
                            {prospect.website.replace(/^https?:\/\/(www\.)?/, '')}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-white font-bold">{prospect.industry}</div>
                        <div className="text-xs text-slate-300 font-medium">{prospect.location}</div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-white font-mono">
                        {formatCurrency(prospect.revenue)}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-400 font-mono">
                        {prospect.ebitda_margin_pct !== null && prospect.ebitda_margin_pct !== undefined
                          ? `${prospect.ebitda_margin_pct.toFixed(1)}%`
                          : 'Not available'}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block px-3 py-1 rounded-xl font-black border ${getFitScoreColor(prospect.prospect_fit_score)}`}>
                          {prospect.prospect_fit_score}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {getConfidenceBadge(prospect.evidence_confidence)}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedProspect(prospect)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer"
                        >
                          Dossier
                        </button>
                        {prospect.is_saved_in_accounts ? (
                          <button
                            onClick={() => handleLaunchWorkspace(prospect)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer"
                          >
                            Call
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddToTarget(prospect)}
                            disabled={addingTargetId === prospect.company_name}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 cursor-pointer disabled:opacity-50"
                          >
                            + Target
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Comprehensive Corporate Dossier Drawer / Modal */}
      {selectedProspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0F172A] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 bg-[#0B1120] flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    {selectedProspect.industry}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 text-slate-100 border border-slate-700">
                    {selectedProspect.company_size} Scale
                  </span>
                  {getConfidenceBadge(selectedProspect.evidence_confidence)}
                </div>
                <h3 className="text-xl font-black text-white">
                  {selectedProspect.company_name}
                </h3>
                <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  {selectedProspect.location}
                  {selectedProspect.website && (
                    <>
                      •
                      <a
                        href={selectedProspect.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline inline-flex items-center gap-1 font-bold"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        {selectedProspect.website}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAddToTarget(selectedProspect, true)}
                  disabled={addingTargetId === selectedProspect.company_name}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                  title="Save to Target Accounts"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>{selectedProspect.is_saved_in_accounts ? 'Synced' : '+ Save Account'}</span>
                </button>
                <button
                  onClick={() => setSelectedProspect(null)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-200">
              {/* Fit Score & Rationale */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-4 shadow-inner">
                <div className={`p-3 rounded-xl border text-center flex-shrink-0 ${getFitScoreColor(selectedProspect.prospect_fit_score)}`}>
                  <div className="text-2xl font-black">{selectedProspect.prospect_fit_score}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-300">Fit Score</div>
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-white text-sm mb-1">Target Account Qualification Analysis</h4>
                  <p className="text-slate-200 leading-relaxed font-medium">
                    {selectedProspect.fit_score_reason}
                  </p>
                </div>
              </div>

              {/* Verified Facts Breakdown */}
              <div className="space-y-4">
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Verified Corporate Disclosures (Public Domain)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] uppercase font-extrabold text-slate-300 tracking-wider block">Reported Revenue</span>
                    <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                      {formatCurrency(selectedProspect.revenue)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] uppercase font-extrabold text-slate-300 tracking-wider block">Reported Operating Expenses</span>
                    <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                      {formatCurrency(selectedProspect.operating_expenses)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] uppercase font-extrabold text-slate-300 tracking-wider block">Calculated EBITDA</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
                      {formatCurrency(selectedProspect.ebitda)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] uppercase font-extrabold text-slate-300 tracking-wider block">EBITDA Margin</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
                      {selectedProspect.ebitda_margin_pct !== null && selectedProspect.ebitda_margin_pct !== undefined
                        ? `${selectedProspect.ebitda_margin_pct.toFixed(2)}%`
                        : 'Not publicly available'}
                    </span>
                  </div>
                </div>

                {/* Products & Operations */}
                {selectedProspect.products_services && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] uppercase font-extrabold text-blue-300 tracking-wider block mb-1">
                      Verified Products & Manufacturing Activities
                    </span>
                    <p className="text-white leading-relaxed font-medium">
                      {selectedProspect.products_services}
                    </p>
                  </div>
                )}

                {/* Expansion News */}
                {selectedProspect.expansion_news && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] uppercase font-extrabold text-blue-300 tracking-wider block mb-1">
                      Publicly Documented Expansions / Plant Developments
                    </span>
                    <p className="text-white leading-relaxed font-medium">
                      {selectedProspect.expansion_news}
                    </p>
                  </div>
                )}
              </div>

              {/* AI Diagnostic Hypothesis Section */}
              <div className="p-4 rounded-xl bg-indigo-950/90 border border-indigo-500/50 space-y-2 shadow-inner">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-300" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-200">
                    Executive Discovery Angle [AI Diagnostic Hypothesis]
                  </h4>
                </div>
                <p className="text-xs text-white font-medium leading-relaxed">
                  {selectedProspect.potential_discovery_angle}
                </p>
                <div className="pt-2 text-[11px] text-indigo-200/90 border-t border-indigo-500/30">
                  <em>Notice: This angle is a conversation starter hypothesis based on sector operational patterns. Confirm actual bottleneck with executive during initial discovery call.</em>
                </div>
              </div>

              {/* Verified Sources & Citations */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  Public Citations & Verification URLs
                </h4>
                {selectedProspect.source_urls && selectedProspect.source_urls.length > 0 ? (
                  <ul className="space-y-1.5">
                    {selectedProspect.source_urls.map((url, i) => (
                      <li key={i}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline break-all font-semibold"
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 italic">No secondary source URLs logged.</p>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 border-t border-slate-800 bg-[#0B1120] flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedProspect(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close Dossier
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleAddToTarget(selectedProspect, true)}
                  disabled={addingTargetId === selectedProspect.company_name}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-emerald-400" />
                  {selectedProspect.is_saved_in_accounts ? 'Re-sync Account' : 'Save to Target Accounts'}
                </button>

                <button
                  onClick={() => {
                    const p = selectedProspect;
                    setSelectedProspect(null);
                    handleLaunchWorkspace(p);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  Launch Cold Call Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
