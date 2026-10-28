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

  // Load options on mount
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
      industry: 'Spinning',
      geography: 'Coimbatore',
      company_size: 'Any',
      limit: 10,
      additional_requirements: 'Vertical spinning mills with captive power or modernization investments'
    });
  }, []);

  const executeSearch = async (overrideParams?: ProspectDiscoveryRequest) => {
    setIsSearching(true);
    setSearchError(null);
    setSearchStep('Querying verified registries & regional manufacturing indices...');

    const timer1 = setTimeout(() => {
      setSearchStep('Grounding company disclosures, official domains & BSE/NSE filings...');
    }, 1200);

    const timer2 = setTimeout(() => {
      setSearchStep('Evaluating EBITDA exposure, power tariffs & operating margins...');
    }, 2800);

    const timer3 = setTimeout(() => {
      setSearchStep('Calibrating Prospect Fit Score & generating diagnostic hypotheses...');
    }, 4200);

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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" /> High Confidence
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Info className="w-3 h-3" /> Medium Confidence
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Low / Exploratory
          </span>
        );
    }
  };

  const getFitScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 75) return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 pb-24">
      {/* Action Notification Toast */}
      {actionNotice && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl backdrop-blur-xl border transition-all duration-300 ${
          actionNotice.type === 'success'
            ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
            : actionNotice.type === 'info'
            ? 'bg-blue-950/90 text-blue-200 border-blue-500/40'
            : 'bg-rose-950/90 text-rose-200 border-rose-500/40'
        }`}>
          {actionNotice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : actionNotice.type === 'info' ? (
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          )}
          <span className="text-xs font-semibold">{actionNotice.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="border-b border-white/[0.08] bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
                <Compass className="w-3.5 h-3.5 animate-spin-slow" />
                Autonomous Corporate Discovery & Research
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                AI Prospect Discovery
              </h1>
              <p className="mt-1.5 text-sm text-slate-400 max-w-2xl leading-relaxed">
                Discover actual operating manufacturing enterprises across India. Verifies public registries, BSE/NSE filings, official company domains, and extracts real operational parameters without fabricating facts.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/companies"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-900/80 border border-white/10 hover:bg-slate-800 transition-all"
              >
                <Building2 className="w-4 h-4 text-slate-400" />
                Target Accounts ({searchResults.filter(p => p.is_saved_in_accounts).length} Synced)
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Research Filter Console */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0E1526]/80 backdrop-blur-xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-2 mb-5">
            <SlidersHorizontal className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Discovery Scope & Targeting Filters
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Industry Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Industry
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                {options.industries.map((ind) => (
                  <option key={ind} value={ind} className="bg-slate-900 text-white">
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            {/* Geography Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Geography / Region
              </label>
              <select
                value={geography}
                onChange={(e) => {
                  setGeography(e.target.value);
                  if (e.target.value !== 'custom') setCustomGeography('');
                }}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                {options.geography_presets.map((geo) => (
                  <option key={geo} value={geo} className="bg-slate-900 text-white">
                    {geo}
                  </option>
                ))}
              </select>
            </div>

            {/* Company Scale */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Company Scale
              </label>
              <select
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                {options.company_sizes.map((size) => (
                  <option key={size} value={size} className="bg-slate-900 text-white">
                    {size === 'Any' ? 'Any Verified Scale' : `${size} Enterprise`}
                  </option>
                ))}
              </select>
            </div>

            {/* Number of Companies */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Discovery Limit
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                {options.limit_options.map((lim) => (
                  <option key={lim} value={lim} className="bg-slate-900 text-white">
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
              className="w-full bg-slate-900/50 border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Additional Research Focus Instructions */}
          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Additional Research Instructions (Optional)
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="e.g. 'Target Tier-1 auto component suppliers with robotic CNC lines', 'Prioritize export-oriented spinning units'..."
                value={additionalRequirements}
                onChange={(e) => setAdditionalRequirements(e.target.value)}
                className="flex-1 bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />

              <button
                type="button"
                onClick={() => executeSearch()}
                disabled={isSearching}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 transition-all flex-shrink-0"
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
            <div className="mt-5 p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center gap-3 animate-pulse">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
              <div className="flex-1">
                <span className="text-xs font-bold text-blue-300 tracking-wide uppercase">
                  Live Public Intelligence Gathering
                </span>
                <p className="text-xs text-blue-100 font-medium mt-0.5">
                  {searchStep}
                </p>
              </div>
            </div>
          )}

          {/* Search Error State */}
          {searchError && (
            <div className="mt-5 p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-xs font-bold text-rose-300 uppercase">Search Error</span>
                <p className="text-xs text-rose-200 mt-0.5">{searchError}</p>
                <button
                  onClick={() => executeSearch()}
                  className="mt-2 text-xs font-semibold text-rose-300 underline hover:text-white"
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
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Discovered Prospects
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {visibleProspects.length} Active
              </span>
            </h3>

            {lastSearchMeta && (
              <span className="text-xs text-slate-400 hidden sm:inline">
                Sector: <strong className="text-slate-200">{lastSearchMeta.industry}</strong> • Region: <strong className="text-slate-200">{lastSearchMeta.geography}</strong>
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
                className="bg-slate-900/90 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-52 sm:w-60"
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
            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-white/10 rounded-xl px-2 py-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="fit_desc" className="bg-slate-900">Highest Fit Score</option>
                <option value="confidence_desc" className="bg-slate-900">Highest Evidence</option>
                <option value="revenue_desc" className="bg-slate-900">Highest Revenue</option>
                <option value="name_asc" className="bg-slate-900">Company Name A-Z</option>
              </select>
            </div>

            {/* Quick Filters */}
            <button
              onClick={() => setFilterHighFitOnly(!filterHighFitOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filterHighFitOnly
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                  : 'bg-slate-900/80 text-slate-400 border-white/10 hover:text-slate-200'
              }`}
            >
              Fit &ge; 85
            </button>

            <button
              onClick={() => setFilterVerifiedFinancials(!filterVerifiedFinancials)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filterVerifiedFinancials
                  ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-900/80 text-slate-400 border-white/10 hover:text-slate-200'
              }`}
            >
              Disclosed EBITDA
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900/80 border border-white/10 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid Cards View"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
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
          <div className="rounded-2xl border border-white/[0.08] bg-[#0E1526]/50 p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white">No prospects matching current criteria</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Try broadening your geography, resetting the custom instruction, or unchecking the high-fit filter.
            </p>
            <button
              onClick={() => {
                setFilterHighFitOnly(false);
                setFilterVerifiedFinancials(false);
                setSearchQuery('');
                executeSearch();
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
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
                className="rounded-2xl border border-white/[0.08] bg-[#0D1424]/90 hover:border-blue-500/40 transition-all duration-200 flex flex-col justify-between p-5 relative group overflow-hidden shadow-lg hover:shadow-blue-500/5"
              >
                <div>
                  {/* Header: Company Name, Fit Score, Confidence */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                          {prospect.company_name}
                        </h4>
                        {prospect.is_saved_in_accounts && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            <Check className="w-2.5 h-2.5" /> Target Account
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                          {prospect.location}
                        </span>
                      </div>
                    </div>

                    {/* Prospect Fit Score Badge */}
                    <div className="flex flex-col items-end flex-shrink-0">
                      <div className={`px-2.5 py-1 rounded-xl border text-xs font-black ${getFitScoreColor(prospect.prospect_fit_score)}`}>
                        {prospect.prospect_fit_score}/100
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight mt-0.5">
                        Fit Score
                      </span>
                    </div>
                  </div>

                  {/* Industry & Scale Tags */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-800 text-slate-300 border border-white/5">
                      {prospect.industry}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-800/60 text-slate-400 border border-white/5">
                      {prospect.company_size} Enterprise
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
                        className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium truncate max-w-full"
                      >
                        <Globe className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{prospect.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                        <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 opacity-70" />
                      </a>
                    </div>
                  )}

                  {/* Verified Financials Box */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] mb-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Verified Revenue</span>
                      <span className="font-semibold text-slate-200">
                        {formatCurrency(prospect.revenue)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">EBITDA / Margin</span>
                      <span className="font-semibold text-emerald-400">
                        {prospect.ebitda_margin_pct !== null && prospect.ebitda_margin_pct !== undefined
                          ? `${prospect.ebitda_margin_pct.toFixed(1)}% (${formatCurrency(prospect.ebitda)})`
                          : 'Not publicly available'}
                      </span>
                    </div>
                  </div>

                  {/* Research Summary Snippet */}
                  <p className="text-xs text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                    {prospect.research_summary}
                  </p>

                  {/* AI Diagnostic Hypothesis Callout */}
                  <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 mb-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider">
                        Discovery Angle [AI Hypothesis]
                      </span>
                    </div>
                    <p className="text-xs text-indigo-100/90 leading-relaxed italic line-clamp-2">
                      {prospect.potential_discovery_angle.replace(/^\[AI Diagnostic Hypothesis\]:\s*/i, '')}
                    </p>
                  </div>

                  {/* Fit Score Rationale */}
                  <div className="text-[11px] text-slate-400 mb-4 bg-slate-900/40 p-2.5 rounded-lg border border-white/[0.04]">
                    <strong className="text-slate-300">Why this score:</strong> {prospect.fit_score_reason}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedProspect(prospect)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors"
                      title="View complete corporate dossier and sources"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      Dossier
                    </button>

                    <button
                      onClick={() => handleDismiss(prospect.company_name)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                      title="Dismiss from current view"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {prospect.is_saved_in_accounts ? (
                      <button
                        onClick={() => handleLaunchWorkspace(prospect)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 transition-all"
                      >
                        <PhoneCall className="w-3.5 h-3.5" /> Call Workspace
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddToTarget(prospect)}
                        disabled={addingTargetId === prospect.company_name}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all"
                      >
                        {addingTargetId === prospect.company_name ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <BookmarkPlus className="w-3.5 h-3.5" />
                        )}
                        Add Target
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Dense Data Table View */
          <div className="rounded-2xl border border-white/[0.08] bg-[#0D1424]/90 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-white/[0.08]">
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
                <tbody className="divide-y divide-white/[0.06]">
                  {visibleProspects.map((prospect) => (
                    <tr key={prospect.company_name} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-white max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{prospect.company_name}</span>
                          {prospect.is_saved_in_accounts && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              Target
                            </span>
                          )}
                        </div>
                        {prospect.website && (
                          <a
                            href={prospect.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Globe className="w-2.5 h-2.5" />
                            {prospect.website.replace(/^https?:\/\/(www\.)?/, '')}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-slate-200">{prospect.industry}</div>
                        <div className="text-[11px] text-slate-400">{prospect.location}</div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-200">
                        {formatCurrency(prospect.revenue)}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-emerald-400">
                        {prospect.ebitda_margin_pct !== null && prospect.ebitda_margin_pct !== undefined
                          ? `${prospect.ebitda_margin_pct.toFixed(1)}%`
                          : 'Not available'}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg font-black border ${getFitScoreColor(prospect.prospect_fit_score)}`}>
                          {prospect.prospect_fit_score}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {getConfidenceBadge(prospect.evidence_confidence)}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedProspect(prospect)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
                        >
                          Dossier
                        </button>
                        {prospect.is_saved_in_accounts ? (
                          <button
                            onClick={() => handleLaunchWorkspace(prospect)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500"
                          >
                            Call
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddToTarget(prospect)}
                            disabled={addingTargetId === prospect.company_name}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0B1220] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/[0.08] bg-slate-900/60 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {selectedProspect.industry}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300">
                    {selectedProspect.company_size} Scale
                  </span>
                  {getConfidenceBadge(selectedProspect.evidence_confidence)}
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  {selectedProspect.company_name}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {selectedProspect.location}
                  {selectedProspect.website && (
                    <>
                      •
                      <a
                        href={selectedProspect.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        <Globe className="w-3 h-3" />
                        {selectedProspect.website}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </>
                  )}
                </p>
              </div>

              <button
                onClick={() => setSelectedProspect(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
              {/* Fit Score & Rationale */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-white/[0.08] flex items-start gap-4">
                <div className={`p-3 rounded-xl border text-center flex-shrink-0 ${getFitScoreColor(selectedProspect.prospect_fit_score)}`}>
                  <div className="text-xl font-black">{selectedProspect.prospect_fit_score}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Fit Score</div>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white text-sm mb-1">Target Account Qualification Analysis</h4>
                  <p className="text-slate-300 leading-relaxed">
                    {selectedProspect.fit_score_reason}
                  </p>
                </div>
              </div>

              {/* Verified Facts vs AI Hypothesis Breakdown */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Verified Corporate Disclosures (Public Domain)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/[0.06]">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Reported Revenue</span>
                    <span className="text-sm font-bold text-white mt-0.5 block">
                      {formatCurrency(selectedProspect.revenue)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/[0.06]">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Reported Operating Expenses</span>
                    <span className="text-sm font-bold text-white mt-0.5 block">
                      {formatCurrency(selectedProspect.operating_expenses)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/[0.06]">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Calculated EBITDA</span>
                    <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                      {formatCurrency(selectedProspect.ebitda)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/[0.06]">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">EBITDA Margin</span>
                    <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                      {selectedProspect.ebitda_margin_pct !== null && selectedProspect.ebitda_margin_pct !== undefined
                        ? `${selectedProspect.ebitda_margin_pct.toFixed(2)}%`
                        : 'Not publicly available'}
                    </span>
                  </div>
                </div>

                {/* Products & Operations */}
                {selectedProspect.products_services && (
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-white/[0.06]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Verified Products & Manufacturing Activities
                    </span>
                    <p className="text-slate-200 leading-relaxed font-medium">
                      {selectedProspect.products_services}
                    </p>
                  </div>
                )}

                {/* Expansion News */}
                {selectedProspect.expansion_news && (
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-white/[0.06]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Publicly Documented Expansions / Plant Developments
                    </span>
                    <p className="text-slate-200 leading-relaxed">
                      {selectedProspect.expansion_news}
                    </p>
                  </div>
                )}
              </div>

              {/* AI Diagnostic Hypothesis Section */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 to-blue-950/20 border border-indigo-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
                    Executive Discovery Angle [AI Diagnostic Hypothesis]
                  </h4>
                </div>
                <p className="text-xs text-indigo-100 font-medium leading-relaxed italic">
                  {selectedProspect.potential_discovery_angle}
                </p>
                <div className="pt-2 text-[11px] text-indigo-300/80 border-t border-indigo-500/20">
                  <em>Notice: This angle is a conversation starter hypothesis based on sector operational patterns. Confirm actual bottleneck with executive during initial discovery call.</em>
                </div>
              </div>

              {/* Verified Sources & Citations */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
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
                          className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline break-all"
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 italic">No secondary source URLs logged.</p>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 border-t border-white/[0.08] bg-slate-900/60 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedProspect(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Close Dossier
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleAddToTarget(selectedProspect, true)}
                  disabled={addingTargetId === selectedProspect.company_name}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-white/10 transition-colors"
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
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all"
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
