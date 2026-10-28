'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Plus, 
  Search, 
  PhoneCall, 
  Globe, 
  MapPin, 
  User, 
  DollarSign, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Trash2,
  Edit,
  AlertCircle,
  Compass,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { api } from '@/lib/api';
import { Company } from '@/lib/types';
import CompanyModal from '@/components/CompanyModal';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const list = await api.getCompanies();
      setCompanies(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This will also delete associated call logs.`)) {
      return;
    }
    try {
      await api.deleteCompany(id);
      setCompanies(companies.filter(c => c.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const industries = Array.from(new Set(companies.map(c => c.industry).filter(Boolean))) as string[];

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch = !search || (
      c.company_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.industry && c.industry.toLowerCase().includes(search.toLowerCase())) ||
      (c.contact_name && c.contact_name.toLowerCase().includes(search.toLowerCase())) ||
      (c.location && c.location.toLowerCase().includes(search.toLowerCase()))
    );
    const matchesIndustry = industryFilter === 'all' || c.industry === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  const getCompanyInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Building2 className="w-3.5 h-3.5" />
              Prospect Accounts Directory
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Target Accounts & Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Verified prospect accounts, operational bottlenecks, and financial margins.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <Link
            href="/discovery"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-bold uppercase tracking-wider rounded-xl border border-blue-500/30 transition-all hover:scale-[1.02]"
          >
            <Compass className="w-4 h-4 text-blue-400" />
            <span>Discover with AI</span>
          </Link>

          <button
            onClick={() => {
              setEditingCompany(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 border border-blue-400/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Company</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 glass-panel rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company, contact, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs glass-input rounded-xl text-white placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 shrink-0 font-semibold">Industry:</span>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="w-full sm:w-auto text-xs glass-input rounded-xl px-3 py-2 text-white cursor-pointer"
          >
            <option value="all" className="bg-slate-950">All Sectors ({companies.length})</option>
            {industries.map(ind => (
              <option key={ind} value={ind} className="bg-slate-950">{ind}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Companies Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs glass-panel rounded-2xl">
          Loading prospect database...
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel space-y-3">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400">No company profiles match your current search.</p>
          <button
            onClick={() => {
              setSearch('');
              setIndustryFilter('all');
            }}
            className="text-xs text-blue-400 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCompanies.map((comp) => (
            <div
              key={comp.id}
              className="p-5 rounded-2xl glass-card-interactive flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3.5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/[0.08] flex items-center justify-center font-bold text-xs text-blue-400 shrink-0 shadow-inner group-hover:border-blue-500/40 group-hover:text-white transition-all">
                      {getCompanyInitials(comp.company_name)}
                    </div>
                    <div>
                      <Link
                        href={`/companies/${comp.id}`}
                        className="font-bold text-sm text-white hover:text-blue-400 transition-colors line-clamp-1"
                      >
                        {comp.company_name}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {comp.industry && (
                          <span className="px-2 py-0.2 text-[10px] font-semibold bg-white/[0.05] text-slate-300 rounded border border-white/[0.06]">
                            {comp.industry}
                          </span>
                        )}
                        {comp.company_size && (
                          <span className="px-1.5 py-0.2 text-[10px] font-medium bg-slate-800 text-slate-400 rounded">
                            {comp.company_size}
                          </span>
                        )}
                        {comp.fit_score && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                            <Sparkles className="w-2.5 h-2.5" /> Fit {comp.fit_score}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingCompany(comp);
                        setIsModalOpen(true);
                      }}
                      title="Edit Company"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(comp.id, comp.company_name)}
                      title="Delete Company"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Location if available */}
                {comp.location && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{comp.location}</span>
                  </div>
                )}

                {/* Contact person */}
                <div className="text-xs text-slate-300 flex items-center gap-2 bg-black/40 p-2.5 rounded-xl border border-white/[0.04]">
                  <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <div className="truncate">
                    <span className="font-semibold text-white">{comp.contact_name || 'No contact specified'}</span>
                    {comp.contact_designation && (
                      <span className="text-slate-400 ml-1">({comp.contact_designation})</span>
                    )}
                  </div>
                </div>

                {/* Business challenges */}
                {comp.business_challenges && (
                  <div className="text-xs text-slate-400 line-clamp-2 italic bg-black/20 p-2 rounded-lg border border-white/[0.02]">
                    "{comp.business_challenges}"
                  </div>
                )}

                {/* Financial Ledger Pill */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/50 border border-white/[0.06] text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Revenue</div>
                    <div className="font-mono font-bold text-slate-200 tabular-nums">
                      {comp.revenue > 0 ? `$${(comp.revenue / 1000000).toFixed(1)}M` : 'Unspecified'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">EBITDA Margin</div>
                    <div className="font-mono font-bold text-emerald-400 tabular-nums">
                      {comp.revenue > 0 ? `${comp.ebitda_margin_pct.toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                <Link
                  href={`/companies/${comp.id}`}
                  className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>View Dossier</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href={`/workspace?companyId=${comp.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>Call Now</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <CompanyModal
        isOpen={isModalOpen}
        initialData={editingCompany}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCompany(null);
        }}
        onSuccess={(saved) => {
          if (editingCompany) {
            setCompanies(companies.map(c => c.id === saved.id ? saved : c));
          } else {
            setCompanies([saved, ...companies]);
          }
        }}
      />
    </div>
  );
}
