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
  Flame,
  ShieldAlert
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
  const [selectedCompanyForCall, setSelectedCompanyForCall] = useState<string>('');

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

  // Calculate average EBITDA margin
  const validMarginCompanies = companies.filter((c) => c.revenue > 0);
  const avgMargin = validMarginCompanies.length > 0
    ? validMarginCompanies.reduce((acc, c) => acc + c.ebitda_margin_pct, 0) / validMarginCompanies.length
    : 0;

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'Interested':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'Follow-up Required':
        return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
      case 'Not Interested':
        return 'bg-slate-700/40 text-slate-400 border border-slate-600/30';
      case 'No Answer':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome / Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Cold Call Strategy & EBITDA Copilot
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Empower enterprise sales calls with executive EBITDA framing, real-time AI prep, and structured notes.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCompanyModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold uppercase tracking-wider rounded-xl border border-slate-700 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>Add Company</span>
          </button>

          <Link
            href="/workspace"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02]"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Start Call Session</span>
          </Link>
        </div>
      </div>

      {/* Urgent Overdue Follow-up Alert if present */}
      {followUps && followUps.overdue_count > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 to-slate-900 border border-rose-600/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-200">
                Action Required: {followUps.overdue_count} Overdue Sales Follow-up{followUps.overdue_count > 1 ? 's' : ''}
              </h4>
              <p className="text-xs text-rose-300/80">
                You have prospect follow-ups that passed their scheduled date. Re-engage promptly to prevent deal decay.
              </p>
            </div>
          </div>
          <Link
            href="/calls?tab=followups"
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
          >
            Review Follow-ups
          </Link>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saved Companies */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Companies</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {companies.length}
            </span>
            <span className="text-xs text-slate-400 ml-2">in database</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-blue-400">
            <Link href="/companies" className="flex items-center gap-1 hover:underline">
              <span>View full directory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 2: Total Calls Recorded */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Calls Recorded</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {calls.length}
            </span>
            <span className="text-xs text-slate-400 ml-2">logged sessions</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-indigo-400">
            <Link href="/calls" className="flex items-center gap-1 hover:underline">
              <span>View call logs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 3: Pending Follow-ups */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Follow-ups Pending</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {followUps?.total_pending ?? 0}
            </span>
            {followUps && followUps.overdue_count > 0 && (
              <span className="px-2 py-0.5 text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full">
                {followUps.overdue_count} overdue
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center text-xs text-amber-400">
            <Link href="/calls?tab=followups" className="flex items-center gap-1 hover:underline">
              <span>Manage scheduled</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 4: Avg EBITDA Margin */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg EBITDA Margin</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {avgMargin.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 ml-2">across pipeline</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-emerald-400">
            <Link href="/calculator" className="flex items-center gap-1 hover:underline">
              <span>Financial Scenario Modeler</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols wide): Saved Companies Overview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Prospect Accounts & EBITDA Margins</h2>
            </div>
            
            {/* Search box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search company, industry..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Companies List Cards */}
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm bg-slate-900/50 rounded-2xl border border-slate-800">
              Loading saved companies...
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
              <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No companies found matching your search.</p>
              <button
                onClick={() => setIsCompanyModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Add Your First Company
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCompanies.slice(0, 5).map((comp) => (
                <div
                  key={comp.id}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Link
                        href={`/companies/${comp.id}`}
                        className="font-bold text-white hover:text-blue-400 transition-colors"
                      >
                        {comp.company_name}
                      </Link>
                      {comp.industry && (
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded-md">
                          {comp.industry}
                        </span>
                      )}
                      {comp.location && (
                        <span className="text-[11px] text-slate-400">
                          • {comp.location}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{comp.contact_name || 'No contact named'}</span>
                      {comp.contact_designation && <span>({comp.contact_designation})</span>}
                    </div>

                    {comp.business_challenges && (
                      <p className="text-xs text-slate-400/90 line-clamp-1 italic">
                        "{comp.business_challenges}"
                      </p>
                    )}
                  </div>

                  {/* Financials & Quick Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">EBITDA Margin</div>
                      <div className="font-mono font-bold text-sm text-emerald-400">
                        {comp.revenue > 0 ? `${comp.ebitda_margin_pct.toFixed(1)}%` : 'N/A'}
                      </div>
                    </div>

                    <Link
                      href={`/workspace?companyId=${comp.id}`}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded-lg text-xs font-semibold transition-all"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call Workspace</span>
                    </Link>
                  </div>
                </div>
              ))}

              {filteredCompanies.length > 5 && (
                <div className="text-center pt-2">
                  <Link
                    href="/companies"
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    View all {filteredCompanies.length} companies →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (1 Col wide): Recent Call Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Recent Call Activity</h2>
            </div>
            <Link
              href="/calls"
              className="text-xs text-slate-400 hover:text-white hover:underline"
            >
              All Calls
            </Link>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-500 text-xs bg-slate-900/50 rounded-2xl border border-slate-800">
              Loading recent activity...
            </div>
          ) : calls.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 space-y-2">
              <PhoneCall className="w-6 h-6 text-slate-600 mx-auto" />
              <p>No sales calls logged yet.</p>
              <Link
                href="/workspace"
                className="inline-block mt-2 px-3 py-1.5 bg-blue-600 text-white font-medium rounded-lg"
              >
                Start First Call
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {calls.slice(0, 5).map((call) => (
                <div
                  key={call.id}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 hover:border-slate-700 transition-all"
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
                    <p className="text-xs text-slate-300 bg-slate-950/40 p-2 rounded-lg line-clamp-2 italic">
                      "{call.notes}"
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
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

          {/* Quick Calculator Teaser Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-900/20 via-slate-900 to-indigo-900/20 border border-blue-500/20 space-y-2.5">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <Calculator className="w-4 h-4" />
              <span>Executive EBITDA Modeler</span>
            </div>
            <p className="text-xs text-slate-300">
              Run real-time scenario tests on revenue sensitivity and OpEx reduction for live executive discussions.
            </p>
            <Link
              href="/calculator"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 group"
            >
              <span>Launch Calculator</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
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
