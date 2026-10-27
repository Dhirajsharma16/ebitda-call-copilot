'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building2, 
  ArrowLeft, 
  Globe, 
  MapPin, 
  User, 
  Briefcase, 
  AlertCircle, 
  PhoneCall, 
  Calculator, 
  Clock, 
  Edit, 
  TrendingUp, 
  CheckCircle2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { api } from '@/lib/api';
import { Company, CallRecord } from '@/lib/types';
import CompanyModal from '@/components/CompanyModal';

function CompanyDetailContent() {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (companyId) {
      loadCompanyDetail();
    }
  }, [companyId]);

  const loadCompanyDetail = async () => {
    setLoading(true);
    try {
      const data = await api.getCompany(companyId);
      setCompany(data.company);
      setCalls(data.calls || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        Loading company profile...
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Company Not Found</h2>
        <p className="text-sm text-slate-400">The requested company profile could not be located.</p>
        <Link href="/companies" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold">
          Return to Companies
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/companies"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">{company.company_name}</h1>
              {company.industry && (
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-md">
                  {company.industry}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
              {company.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {company.location}
                </span>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{company.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all"
          >
            <Edit className="w-4 h-4 text-slate-400" />
            <span>Edit Profile</span>
          </button>

          <Link
            href={`/workspace?companyId=${company.id}`}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/30 transition-all"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Launch Live Call</span>
          </Link>
        </div>
      </div>

      {/* Profile Notice */}
      <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-900/40 text-xs text-blue-300 flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
        <span>
          <strong>User-Supplied Profile Data:</strong> All financial and operational details displayed here were directly provided by the sales user. No metrics are fabricated.
        </span>
      </div>

      {/* Grid: Details & Financials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Persona Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-blue-400" />
            <span>Key Executive Contact</span>
          </div>
          <div>
            <div className="text-lg font-bold text-white">
              {company.contact_name || 'No contact specified'}
            </div>
            <div className="text-xs text-blue-400 font-medium">
              {company.contact_designation || 'Title unrecorded'}
            </div>
          </div>
          <div className="text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            Target role for strategic margin framing and discovery conversation.
          </div>
        </div>

        {/* Financial Baseline Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Financial Performance</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Revenue</div>
              <div className="text-base font-bold font-mono text-white">
                {company.revenue > 0 ? `$${company.revenue.toLocaleString()}` : 'Unsupplied'}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">OpEx (excl. D&A)</div>
              <div className="text-base font-bold font-mono text-white">
                {company.operating_expenses > 0 ? `$${company.operating_expenses.toLocaleString()}` : 'Unsupplied'}
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400">EBITDA:</span>{' '}
              <span className="font-mono font-bold text-emerald-400 text-sm">
                ${company.ebitda.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400">Margin:</span>{' '}
              <span className="font-mono font-bold text-blue-400 text-sm">
                {company.revenue > 0 ? `${company.ebitda_margin_pct.toFixed(1)}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Operational Bottlenecks Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Known Business Challenges</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
            {company.business_challenges ? `"${company.business_challenges}"` : 'No specific business challenges or operational pain points recorded yet.'}
          </p>
        </div>
      </div>

      {/* Call History for this Company */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Historical Call Logs ({calls.length})</h2>
          </div>
          <Link
            href={`/workspace?companyId=${company.id}`}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline"
          >
            + Record New Call
          </Link>
        </div>

        {calls.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
            <p className="text-sm text-slate-400">No calls recorded yet for {company.company_name}.</p>
            <Link
              href={`/workspace?companyId=${company.id}`}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
            >
              Start First Call Session
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {calls.map((call) => (
              <div
                key={call.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      Call with {call.contact_name || company.contact_name || 'Prospect'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      • {new Date(call.call_date).toLocaleDateString()} at {new Date(call.call_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-md self-start sm:self-auto ${
                    call.call_outcome === 'Interested'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : call.call_outcome === 'Follow-up Required'
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {call.call_outcome}
                  </span>
                </div>

                {call.notes && (
                  <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 italic">
                    "{call.notes}"
                  </p>
                )}

                {call.follow_up_date && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Scheduled Follow-up: {new Date(call.follow_up_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <CompanyModal
        isOpen={isEditModalOpen}
        initialData={company}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={(updated) => {
          setCompany(updated);
        }}
      />
    </div>
  );
}

export default function CompanyDetailPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 text-sm">Loading company profile...</div>}>
      <CompanyDetailContent />
    </Suspense>
  );
}
