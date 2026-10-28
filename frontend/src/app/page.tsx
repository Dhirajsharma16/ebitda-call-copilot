'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  PhoneCall, 
  Clock, 
  TrendingUp, 
  Plus, 
  ArrowUpRight, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight,
  Calculator,
  Calendar,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Filter,
  DollarSign,
  Activity,
  Layers,
  Sparkles,
  Lightbulb,
  HelpCircle,
  Flame,
  Compass
} from 'lucide-react';
import { api } from '@/lib/api';
import { Company, CallRecord, FollowUpSummary } from '@/lib/types';
import CompanyModal from '@/components/CompanyModal';

export default function DashboardPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [compList, callList, fUps] = await Promise.all([
        api.getCompanies(),
        api.getCalls(),
        api.getFollowUps(),
      ]);
      setCompanies(compList);
      setCalls(callList);
      setFollowUps(fUps);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.company_name.toLowerCase().includes(s) ||
      (c.industry && c.industry.toLowerCase().includes(s)) ||
      (c.contact_name && c.contact_name.toLowerCase().includes(s))
    );
  });

  const validMarginCompanies = companies.filter((c) => c.revenue > 0);
  const avgMargin = validMarginCompanies.length > 0
    ? validMarginCompanies.reduce((acc, c) => acc + c.ebitda_margin_pct, 0) / validMarginCompanies.length
    : 0;

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'Interested':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
      case 'Follow-up Required':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/25';
      case 'Not Interested':
        return 'bg-slate-800 text-slate-400 border border-slate-700/50';
      case 'No Answer':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/25';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  const getCompanyInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getMarginBadge = (margin: number) => {
    if (margin < 10) {
      return {
        label: `${margin.toFixed(1)}% Margin • Tight / High Need for Cost Savings`,
        color: 'bg-rose-500/15 text-rose-300 border-rose-500/30'
      };
    } else if (margin < 18) {
      return {
        label: `${margin.toFixed(1)}% Margin • Moderate / Process Optimization`,
        color: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      };
    } else if (margin <= 25) {
      return {
        label: `${margin.toFixed(1)}% Margin • Healthy / Defect Reduction`,
        color: 'bg-blue-500/15 text-blue-300 border-blue-500/30'
      };
    } else {
      return {
        label: `${margin.toFixed(1)}% Margin • High / Scalable Growth`,
        color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome & KPI Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Executive B2B Sales Cockpit
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            EBITDA & Cold Call Strategy Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Prepare tailored cold conversations, stress-test margin sensitivity, and systematically guide prospects toward executive discovery meetings.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 self-start lg:self-auto flex-wrap">
          <Link
            href="/discovery"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold uppercase tracking-wider rounded-xl border border-blue-500/30 hover:border-blue-500/50 transition-all shadow-sm"
          >
            <Compass className="w-4 h-4 text-blue-400" />
            <span>AI Discovery</span>
          </Link>

          <button
            onClick={() => setIsCompanyModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold uppercase tracking-wider rounded-xl border border-white/[0.08] hover:border-white/20 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>Add Prospect</span>
          </button>

          <Link
            href="/workspace"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 border border-blue-400/20 transition-all hover:scale-[1.02]"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Live Workspace</span>
          </Link>
        </div>
      </div>

      {/* Critical Overdue Follow-up Alert (if any) */}
      {followUps && followUps.overdue_count > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-950 to-slate-900 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-rose-950/20">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-rose-200">
                  {followUps.overdue_count} Overdue Sales Follow-up{followUps.overdue_count > 1 ? 's' : ''}
                </h4>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                  High Priority
                </span>
              </div>
              <p className="text-xs text-rose-300/80 mt-0.5">
                Past commitments require prompt outreach to preserve momentum and prevent pipeline decay.
              </p>
            </div>
          </div>
          <Link
            href="/calls?tab=followups"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shrink-0 transition-all shadow-md shadow-rose-600/30"
          >
            Review Follow-ups
          </Link>
        </div>
      )}

      {/* 4 Financial & Pipeline KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Target Accounts */}
        <div className="p-5 rounded-2xl glass-panel relative overflow-hidden group hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Accounts</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-white tracking-tight tabular-nums">
              {companies.length}
            </div>
            <span className="text-xs text-slate-400 font-medium">accounts in pipeline</span>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-blue-400">
            <Link href="/companies" className="flex items-center gap-1 hover:text-blue-300 font-semibold group/link">
              <span>View Directory</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
            </Link>
            <span className="text-[11px] text-slate-400">Active</span>
          </div>
        </div>

        {/* Card 2: Total Calls Recorded */}
        <div className="p-5 rounded-2xl glass-panel relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Calls Recorded</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-white tracking-tight tabular-nums">
              {calls.length}
            </div>
            <span className="text-xs text-slate-400 font-medium">logged conversations</span>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-indigo-400">
            <Link href="/calls" className="flex items-center gap-1 hover:text-indigo-300 font-semibold group/link">
              <span>View Call Logs</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
            </Link>
            <span className="text-[11px] text-slate-400">100% Manual</span>
          </div>
        </div>

        {/* Card 3: Pending Follow-ups */}
        <div className="p-5 rounded-2xl glass-panel relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Follow-up Queue</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-white tracking-tight tabular-nums">
              {followUps?.total_pending ?? 0}
            </div>
            {followUps && followUps.overdue_count > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full animate-pulse">
                {followUps.overdue_count} overdue
              </span>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-amber-400">
            <Link href="/calls?tab=followups" className="flex items-center gap-1 hover:text-amber-300 font-semibold group/link">
              <span>Manage Pipeline</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
            </Link>
            <span className="text-[11px] text-slate-400">Scheduled</span>
          </div>
        </div>

        {/* Card 4: Avg EBITDA Margin */}
        <div className="p-5 rounded-2xl glass-panel relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Avg EBITDA Margin</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight font-mono tabular-nums">
              {avgMargin.toFixed(1)}%
            </div>
            <span className="text-xs text-slate-400 font-medium">portfolio average</span>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-emerald-400">
            <Link href="/calculator" className="flex items-center gap-1 hover:text-emerald-300 font-semibold group/link">
              <span>Sensitivity Modeler</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
            </Link>
            <span className="text-[11px] text-slate-400">Interactive</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols): Target Accounts Directory */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Target Accounts & Operational Margins
              </h2>
            </div>
            
            {/* Search filter bar */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search account, sector..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs glass-input rounded-xl text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* Accounts Cards List */}
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs glass-panel rounded-2xl">
              Loading accounts intelligence...
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-12 text-center rounded-2xl glass-panel space-y-3">
              <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No companies found matching your query.</p>
              <button
                onClick={() => setIsCompanyModalOpen(true)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition-all"
              >
                Add Target Company
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCompanies.slice(0, 5).map((comp) => {
                const marginBadge = getMarginBadge(comp.ebitda_margin_pct);
                return (
                  <div
                    key={comp.id}
                    className="p-5 rounded-2xl glass-card-interactive space-y-3.5 group border border-white/[0.08] hover:border-blue-500/30 transition-all"
                  >
                    {/* Top Row: Account & Executive Contact + Quick Action */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/[0.08] flex items-center justify-center font-bold text-xs text-blue-400 shadow-inner shrink-0 group-hover:border-blue-500/40 group-hover:text-white transition-all">
                          {getCompanyInitials(comp.company_name)}
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/companies/${comp.id}`}
                              className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors"
                            >
                              {comp.company_name}
                            </Link>
                            {comp.industry && (
                              <span className="px-2 py-0.5 text-[10px] font-semibold bg-white/[0.05] text-slate-300 border border-white/[0.06] rounded-md">
                                {comp.industry}
                              </span>
                            )}
                            {comp.location && (
                              <span className="text-[11px] text-slate-400">
                                • {comp.location}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-300 flex items-center gap-2">
                            <span className="font-semibold text-white">{comp.contact_name || 'No contact assigned'}</span>
                            {comp.contact_designation && <span className="text-slate-400 font-normal">({comp.contact_designation})</span>}
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/workspace?companyId=${comp.id}`}
                        className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-blue-600/25 shrink-0 hover:scale-[1.02]"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Launch Call HUD</span>
                      </Link>
                    </div>

                    {/* Financial Equation Breakdown: Sales In - Bills Out = Operating Profit */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-black/50 border border-white/[0.06] text-xs">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">1. Sales In (Revenue)</div>
                        <div className="font-mono font-extrabold text-white text-sm mt-0.5">
                          ${(comp.revenue / 1000000).toFixed(1)}M
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">2. Bills Out (Costs)</div>
                        <div className="font-mono font-extrabold text-rose-300 text-sm mt-0.5">
                          - ${(comp.operating_expenses / 1000000).toFixed(1)}M
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">3. Cash Profit (EBITDA)</div>
                        <div className="font-mono font-extrabold text-emerald-400 text-sm mt-0.5">
                          = ${(comp.ebitda / 1000000).toFixed(2)}M
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Profit Margin Rate</div>
                        <div className="mt-0.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                            comp.ebitda_margin_pct < 10 
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                              : comp.ebitda_margin_pct >= 25 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {comp.ebitda_margin_pct.toFixed(1)}% Margin
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Executive Pain Point / Sales Call Hook */}
                    {comp.business_challenges && (
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.05] text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px] uppercase tracking-wider">
                          <Flame className="w-3.5 h-3.5 text-amber-400" />
                          <span>The Executive Pitch Hook (Why CEO Will Take Your Call):</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          {comp.business_challenges}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredCompanies.length > 5 && (
                <div className="text-center pt-2">
                  <Link
                    href="/companies"
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1"
                  >
                    <span>View all {filteredCompanies.length} company profiles</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Recent Call Activity */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Recent Sales Dials</h2>
            </div>
            <Link
              href="/calls"
              className="text-xs font-semibold text-slate-400 hover:text-white hover:underline"
            >
              All Calls
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs glass-panel rounded-2xl">
              Loading recent dials...
            </div>
          ) : calls.length === 0 ? (
            <div className="p-8 text-center rounded-2xl glass-panel text-xs text-slate-400 space-y-3">
              <PhoneCall className="w-8 h-8 text-slate-600 mx-auto" />
              <p>No cold calls recorded yet.</p>
              <Link
                href="/workspace"
                className="inline-block px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs uppercase"
              >
                Launch First Session
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {calls.slice(0, 4).map((call) => (
                <div
                  key={call.id}
                  className="p-4 rounded-2xl glass-panel space-y-2 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-white line-clamp-1">
                        {call.company_name || 'Prospect Company'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {call.contact_name || 'Executive Contact'}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${getOutcomeBadge(call.call_outcome)}`}>
                      {call.call_outcome}
                    </span>
                  </div>

                  {call.notes && (
                    <p className="text-xs text-slate-300 bg-black/40 p-2.5 rounded-xl border border-white/[0.04] line-clamp-2 italic font-mono text-[11px]">
                      "{call.notes}"
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-white/[0.06]">
                    <span>{new Date(call.call_date).toLocaleDateString()}</span>
                    {call.follow_up_date && (
                      <span className={call.is_overdue ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        Follow-up: {new Date(call.follow_up_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* EBITDA Simulator Teaser Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900/90 to-indigo-950/40 border border-blue-500/20 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <Calculator className="w-4 h-4" />
              <span>Interactive EBITDA Modeler</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Stress-test hypothetical revenue swings and OpEx reductions in real-time to anchor executive negotiations on margin preservation.
            </p>
            <Link
              href="/calculator"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 group pt-1"
            >
              <span>Launch Calculator</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Add / Edit Company Modal */}
      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onSuccess={(newComp) => {
          setCompanies([newComp, ...companies]);
        }}
      />
    </div>
  );
}
