'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  PhoneCall, 
  Sparkles, 
  Clock, 
  Building2, 
  User, 
  Briefcase, 
  DollarSign, 
  Check, 
  Copy, 
  Edit3, 
  Save, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  HelpCircle, 
  Play, 
  Pause, 
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Send,
  MessageSquare,
  FileText,
  Tag,
  ArrowRight,
  Mail,
  X,
  Loader2,
  ExternalLink,
  ListChecks,
  Info,
  CheckSquare,
  MapPin
} from 'lucide-react';
import { api } from '@/lib/api';
import { Company, AICallPrep, CallOutcome, CallRecord } from '@/lib/types';

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCompanyId = searchParams.get('companyId') || '';

  // Data states
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(initialCompanyId);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);

  // AI Assistant States
  const [aiPrep, setAiPrep] = useState<AICallPrep | null>(null);
  const [generatingAI, setGeneratingAI] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'opening' | 'discovery' | 'financial' | 'objections' | 'ai_solution' | 'closing'>('opening');
  
  // Editable AI suggestions
  const [editableOpening, setEditableOpening] = useState<string>('');
  const [editableClosing, setEditableClosing] = useState<string>('');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [insertedQuestionIdx, setInsertedQuestionIdx] = useState<number | null>(null);

  // Call Console States
  const [notes, setNotes] = useState<string>('');
  const [callOutcome, setCallOutcome] = useState<CallOutcome>('Interested');
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [savingCall, setSavingCall] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Executive Follow-up Email Modal States
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [generatingEmail, setGeneratingEmail] = useState<boolean>(false);
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [emailModelUsed, setEmailModelUsed] = useState<string>('');
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);
  const [recipientEmail, setRecipientEmail] = useState<string>('');

  // Timer States
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Provenance Ledger
  const [showProvenanceDetails, setShowProvenanceDetails] = useState<boolean>(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    let comp: Company | null = null;
    if (selectedCompanyId && companies.length > 0) {
      comp = companies.find(c => c.id === selectedCompanyId) || null;
    } else if (companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id);
      comp = companies[0];
    }
    setActiveCompany(comp);
    if (comp) {
      generateStrategy(comp);
      const namePart = comp.contact_name?.toLowerCase().replace(/[^a-z0-9]+/g, '.') || 'executive';
      let domain = 'company.com';
      if (comp.website) {
        try {
          domain = new URL(comp.website).hostname.replace(/^www\./, '');
        } catch {
          domain = 'company.com';
        }
      }
      setRecipientEmail(`${namePart}@${domain}`);
    }
  }, [selectedCompanyId, companies]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const loadCompanies = async () => {
    try {
      const list = await api.getCompanies();
      setCompanies(list);
      if (initialCompanyId) {
        const found = list.find(c => c.id === initialCompanyId);
        if (found) {
          setSelectedCompanyId(found.id);
          setActiveCompany(found);
          generateStrategy(found);
          return;
        }
      }
      if (list.length > 0) {
        setSelectedCompanyId(list[0].id);
        setActiveCompany(list[0]);
        generateStrategy(list[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const generateStrategy = async (company: Company) => {
    setGeneratingAI(true);
    try {
      const prep = await api.prepareAICall({
        company_id: company.id,
        company_name: company.company_name,
        industry: company.industry,
        location: company.location,
        contact_name: company.contact_name,
        contact_designation: company.contact_designation,
        business_challenges: company.business_challenges,
        revenue: company.revenue,
        operating_expenses: company.operating_expenses,
        ebitda: company.ebitda,
        ebitda_margin_pct: company.ebitda_margin_pct,
      });

      setAiPrep(prep);
      setEditableOpening(prep.opening_line);
      setEditableClosing(prep.closing_line);
    } catch (e) {
      console.error('AI Prep error', e);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleCopy = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const insertQuestionToNotes = (question: string, idx: number) => {
    const formatted = `\n• Discovery: ${question}\n  Notes: `;
    setNotes(prev => prev ? `${prev}${formatted}` : `• Discovery: ${question}\n  Notes: `);
    setInsertedQuestionIdx(idx);
    setTimeout(() => setInsertedQuestionIdx(null), 2000);
  };

  const insertQuickTag = (tag: string) => {
    const timestamp = formatTimer(callDuration);
    const line = `\n[${timestamp}] ${tag}: `;
    setNotes(prev => prev ? `${prev}${line}` : `[${timestamp}] ${tag}: `);
  };

  const setPresetFollowUp = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setFollowUpDate(d.toISOString().split('T')[0]);
  };

  const handleInsertAllDiscovery = () => {
    if (!aiPrep || !aiPrep.discovery_questions || aiPrep.discovery_questions.length === 0) return;
    const checklist = aiPrep.discovery_questions.map((q, i) => `• [ ] Discovery ${i + 1}: ${q}\n  Executive Response: `).join('\n');
    const header = `\n--- DISCOVERY QUESTIONS CHECKLIST ---\n${checklist}\n`;
    setNotes(prev => prev ? `${prev}\n${header}` : header);
  };

  const handleApplyNextStep = (action: string, outcome: CallOutcome, daysAhead: number) => {
    setCallOutcome(outcome);
    setPresetFollowUp(daysAhead);
    const time = formatTimer(callDuration);
    const stamp = `\n[${time}] NEXT ACTION: ${action} (Target: +${daysAhead}d)`;
    setNotes(prev => prev ? `${prev}${stamp}` : stamp);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleOpenEmailModal = async () => {
    if (!activeCompany) return;
    setIsEmailModalOpen(true);
    setGeneratingEmail(true);
    try {
      const res = await api.generateFollowUpEmail({
        company_name: activeCompany.company_name,
        contact_name: activeCompany.contact_name,
        contact_designation: activeCompany.contact_designation,
        notes: notes.trim(),
        ebitda: activeCompany.ebitda,
        ebitda_margin_pct: activeCompany.ebitda_margin_pct,
        follow_up_date: followUpDate || undefined,
      });
      setEmailSubject(res.subject);
      setEmailBody(res.body);
      setEmailModelUsed(res.model_used);
    } catch (e) {
      console.error('Email generation failed', e);
    } finally {
      setGeneratingEmail(false);
    }
  };

  const handleCopyEmail = () => {
    const fullText = `Subject: ${emailSubject}\n\n${emailBody}`;
    navigator.clipboard.writeText(fullText);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleAppendEmailToNotes = () => {
    const appendText = `\n\n--- DRAFTED FOLLOW-UP EMAIL ---\nSubject: ${emailSubject}\n\n${emailBody}`;
    setNotes(prev => `${prev}${appendText}`);
    setIsEmailModalOpen(false);
  };

  const handleOpenInGmail = () => {
    const to = recipientEmail.trim();
    const su = encodeURIComponent(emailSubject);
    const body = encodeURIComponent(emailBody);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1${to ? `&to=${encodeURIComponent(to)}` : ''}&su=${su}&body=${body}`;
    window.open(gmailUrl, '_blank');
  };

  const handleOpenInMailApp = () => {
    const to = recipientEmail.trim();
    const su = encodeURIComponent(emailSubject);
    const body = encodeURIComponent(emailBody);
    const mailtoUrl = `mailto:${to}?subject=${su}&body=${body}`;
    window.location.href = mailtoUrl;
  };

  const handleSaveCall = async () => {
    if (!activeCompany) return;
    setSavingCall(true);

    try {
      await api.createCall({
        company_id: activeCompany.id,
        contact_name: activeCompany.contact_name,
        call_outcome: callOutcome,
        notes: notes.trim(),
        follow_up_date: followUpDate ? new Date(followUpDate).toISOString() : null,
        ai_preparation: aiPrep,
      });

      setSavedSuccess(true);
      setIsTimerRunning(false);
      setTimeout(() => {
        setSavedSuccess(false);
        router.push('/calls');
      }, 1500);
    } catch (e) {
      console.error(e);
      alert('Failed to save call record.');
    } finally {
      setSavingCall(false);
    }
  };

  const getCompanyInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* HUD Top Command Bar */}
      <div className="p-4 sm:p-5 rounded-2xl glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/[0.08]">
        {/* Left: Account Context */}
        <div className="flex items-center gap-4 flex-wrap">
          {activeCompany && (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/[0.1] flex items-center justify-center font-extrabold text-sm text-blue-400 shadow-inner shrink-0">
              {getCompanyInitials(activeCompany.company_name)}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="text-base font-extrabold bg-slate-950/80 border border-blue-500/40 rounded-xl px-3.5 py-1.5 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-950">
                    {c.company_name}
                  </option>
                ))}
              </select>

              {activeCompany?.industry && (
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-white/[0.06] text-slate-300 rounded-md border border-white/[0.08]">
                  {activeCompany.industry}
                </span>
              )}
            </div>

            {activeCompany && (
              <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 flex-wrap">
                <span className="flex items-center gap-1.5 font-semibold text-white">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  {activeCompany.contact_name || 'Prospect Lead'}
                  {activeCompany.contact_designation && (
                    <span className="text-slate-400 font-normal">({activeCompany.contact_designation})</span>
                  )}
                </span>

                {activeCompany.revenue > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold text-[11px] tabular-nums">
                    EBITDA: {activeCompany.ebitda_margin_pct.toFixed(1)}% (${(activeCompany.ebitda / 1000000).toFixed(1)}M)
                  </span>
                )}

                {activeCompany.location && (
                  <span className="text-slate-400 text-xs hidden sm:inline">
                    • {activeCompany.location}
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleOpenEmailModal}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-[11px] font-semibold transition-all shadow-sm"
                  title="Draft & send follow-up email directly via Gmail or Mail app"
                >
                  <Mail className="w-3 h-3 text-purple-400" />
                  <span>Send Mail</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Call Stopwatch */}
        <div className="flex items-center gap-3 self-end md:self-auto bg-black/40 p-2 rounded-2xl border border-white/[0.06]">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-white/[0.06]">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isTimerRunning ? 'bg-rose-400' : 'bg-slate-600'}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isTimerRunning ? 'bg-rose-500' : 'bg-slate-500'}`} />
            </span>
            <span className="text-xs text-slate-400 font-medium">Timer:</span>
            <span className="font-mono font-extrabold text-white text-sm tabular-nums">
              {formatTimer(callDuration)}
            </span>
          </div>

          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              isTimerRunning 
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
            }`}
          >
            {isTimerRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Start Call</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsTimerRunning(false);
              setCallDuration(0);
            }}
            title="Reset Stopwatch"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/[0.08]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Quick Draft CEO Email in Header - No scrolling needed */}
          <button
            type="button"
            onClick={handleOpenEmailModal}
            disabled={!activeCompany}
            className="px-3.5 py-1.5 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-950/40 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-40"
            title="Draft CEO Follow-Up Email (Gemini AI)"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-200" />
            <span className="hidden sm:inline">Draft CEO Email</span>
          </button>
        </div>
      </div>

      {/* Verified Factual Baseline & Provenance Ledger (Requirements 1, 6, 8) */}
      {activeCompany && (
        <div className="p-4 sm:p-5 rounded-2xl glass-panel border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Verified Factual Baseline & Provenance Ledger</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Source-Attributed
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Strict boundary separating user-verified data, math calculations, and AI hypotheses
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowProvenanceDetails(!showProvenanceDetails)}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <span>{showProvenanceDetails ? 'Collapse Ledger' : 'Expand Ledger'}</span>
              {showProvenanceDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showProvenanceDetails && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
              {/* Box 1: Verified Entity Facts */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06] flex flex-col justify-between space-y-2.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 font-mono">
                      1. Entity Profile
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      User CRM Entry
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{activeCompany.company_name}</span>
                    {activeCompany.website && (
                      <a
                        href={activeCompany.website.startsWith('http') ? activeCompany.website : `https://${activeCompany.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-blue-400 transition-colors"
                        title="Visit company website"
                      >
                        <ExternalLink className="w-3.5 h-3.5 inline" />
                      </a>
                    )}
                  </div>
                  <div className="text-xs text-slate-300 space-y-0.5">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <strong className="text-white">{activeCompany.contact_name || 'Prospect Lead'}</strong>
                      {activeCompany.contact_designation && (
                        <span className="text-slate-400 text-[11px]">({activeCompany.contact_designation})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{activeCompany.location || 'Location not specified'}</span>
                      {activeCompany.industry && <span>• {activeCompany.industry}</span>}
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/[0.06] text-[10px] text-slate-400">
                  Verified corporate identity provided by user.
                </div>
              </div>

              {/* Box 2: Calculated Financial Ledger */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06] flex flex-col justify-between space-y-2.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                      2. EBITDA Ledger
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      Validated Math
                    </span>
                  </div>
                  
                  {activeCompany.revenue > 0 ? (
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-400">Revenue:</span>
                        <span className="font-mono font-bold text-white">${activeCompany.revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-400">Operating Expenses:</span>
                        <span className="font-mono text-slate-300">${activeCompany.operating_expenses.toLocaleString()}</span>
                      </div>
                      <div className="flex items-baseline justify-between text-xs pt-1 border-t border-white/[0.06]">
                        <span className="text-emerald-400 font-semibold">EBITDA:</span>
                        <span className="font-mono font-extrabold text-emerald-300">
                          ${activeCompany.ebitda.toLocaleString()} ({activeCompany.ebitda_margin_pct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-center text-xs text-slate-400 space-y-1">
                      <p className="font-medium text-amber-300/90">Pending Financial Discovery</p>
                      <p className="text-[11px] text-slate-500">
                        Revenue not provided in CRM record. Explore margin baseline during call.
                      </p>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-white/[0.06] text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Formula: Revenue - OpEx = EBITDA</span>
                  <Link href="/calculator" className="text-blue-400 hover:underline">
                    Model Scenario →
                  </Link>
                </div>
              </div>

              {/* Box 3: Stated Bottleneck & AI Status */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06] flex flex-col justify-between space-y-2.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">
                      3. Stated Pain Point
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      Prospect Dossier
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed">
                    "{activeCompany.business_challenges || 'No specific operational bottlenecks recorded. Use discovery questions to uncover focus areas.'}"
                  </p>
                </div>
                <div className="pt-2 border-t border-white/[0.06] text-[10px] text-amber-300/90 flex items-start gap-1.5 leading-snug">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Rule:</strong> AI angles below are exploratory hypotheses. Confirm bottleneck before proposing any diagnosis.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): AI Strategy & Executive Prompts */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl glass-panel space-y-4">
            {/* AI Assistant Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                    Executive Strategy & Prompts
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Calculated discovery angles tailored to sector economics
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {aiPrep && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-white/[0.08]">
                    {aiPrep.is_simulated ? 'Synthesis Engine' : `Groq: ${aiPrep.model_used}`}
                  </span>
                )}
                <button
                  onClick={() => activeCompany && generateStrategy(activeCompany)}
                  disabled={generatingAI}
                  className="px-2.5 py-1 text-xs font-bold bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className={`w-3 h-3 ${generatingAI ? 'animate-spin' : ''}`} />
                  <span>Regen</span>
                </button>
              </div>
            </div>

            {/* AI Notice / Fallback warning if applicable */}
            {aiPrep?.warning_or_notice && (
              <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{aiPrep.warning_or_notice}</span>
              </div>
            )}

            {/* Navigation Strategy Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-white/[0.06] text-xs">
              <button
                onClick={() => setActiveTab('opening')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'opening'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                1. Opening Line
              </button>
              <button
                onClick={() => setActiveTab('discovery')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'discovery'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                2. Discovery Prompts
              </button>
              <button
                onClick={() => setActiveTab('financial')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'financial'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                3. Financial Framing
              </button>
              <button
                onClick={() => setActiveTab('objections')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'objections'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                4. Objections ({aiPrep?.objections_and_rebuttals?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('ai_solution')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'ai_solution'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                5. Diagnostic Strategy
              </button>
              <button
                onClick={() => setActiveTab('closing')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'closing'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                6. Meeting Close
              </button>
            </div>

            {/* Tab Body */}
            {generatingAI ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <Sparkles className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
                <p>Synthesizing executive talking points...</p>
              </div>
            ) : !aiPrep ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                Select an account to load strategy.
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                {/* 1. Opening Line (Requirement 2: ~20s Delivery Pace) */}
                {activeTab === 'opening' && (() => {
                  const words = editableOpening.trim().split(/\s+/).filter(Boolean).length;
                  const estSeconds = Math.round((words / 130) * 60);
                  const isOptimal = words >= 30 && words <= 52;

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span>Peer-to-peer opening statement (editable):</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                            isOptimal 
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}>
                            ⏱️ ~{estSeconds}s Delivery ({words} words)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {editableOpening !== aiPrep.opening_line && (
                            <button
                              type="button"
                              onClick={() => setEditableOpening(aiPrep.opening_line)}
                              className="text-[11px] text-slate-400 hover:text-slate-200 underline"
                              title="Reset back to AI generated opener"
                            >
                              Reset
                            </button>
                          )}
                          <button
                            onClick={() => handleCopy(editableOpening, 'opening')}
                            className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-semibold"
                          >
                            {copiedSection === 'opening' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedSection === 'opening' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={4}
                        value={editableOpening}
                        onChange={(e) => setEditableOpening(e.target.value)}
                        className="w-full p-4 text-sm glass-input rounded-xl text-white font-medium leading-relaxed font-sans"
                      />

                      <div className="p-3 bg-blue-950/25 border border-blue-900/40 rounded-xl text-[11px] text-blue-300 flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>20-Second Executive Cadence Rule:</strong> Speak at an unhurried, measured pace (~130 words/minute). Pause immediately after the opening question and give the executive 3 seconds of silence to answer first.
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Discovery Questions (Requirement 3: 3-5 Open-ended questions) */}
                {activeTab === 'discovery' && (
                  <div className="space-y-3">
                    <div className="text-xs text-slate-400 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span>Open-Ended Bottleneck Discovery Prompts:</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {aiPrep.discovery_questions.length} Diagnostic Prompts
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleInsertAllDiscovery}
                        className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        title="Inject full discovery checklist into notes"
                      >
                        <ListChecks className="w-3.5 h-3.5" />
                        <span>Insert All as Checklist</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {aiPrep.discovery_questions.map((q, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06] flex items-start justify-between gap-3 group hover:border-blue-500/40 transition-all"
                        >
                          <div className="text-xs text-slate-200 font-medium leading-relaxed">
                            <span className="text-blue-400 font-bold mr-2">{idx + 1}.</span>
                            {q}
                          </div>
                          <button
                            onClick={() => insertQuestionToNotes(q, idx)}
                            title="Insert question into call notes"
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg shrink-0 transition-all flex items-center gap-1 ${
                              insertedQuestionIdx === idx
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-900 hover:bg-blue-600 text-slate-300 hover:text-white border border-white/[0.08]'
                            }`}
                          >
                            {insertedQuestionIdx === idx ? <Check className="w-3 h-3" /> : null}
                            <span>{insertedQuestionIdx === idx ? 'Inserted' : '+ Notes'}</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-slate-950/70 border border-white/[0.06] rounded-xl text-[11px] text-slate-400">
                      💡 <strong>Open-Ended Discovery:</strong> Formulated with <em>"How"</em>, <em>"What"</em>, and <em>"In what ways"</em> so the prospect reveals their operational reality without feeling interrogated.
                    </div>
                  </div>
                )}

                {/* 3. Financial Framing */}
                {activeTab === 'financial' && (
                  <div className="space-y-3">
                    <div className="text-xs text-slate-400 flex items-center justify-between">
                      <span>Profitability & Cost Compression Prompts:</span>
                      <span className="text-[11px] text-emerald-400 font-mono">EBITDA Focused</span>
                    </div>

                    <div className="space-y-2.5">
                      {aiPrep.financial_efficiency_questions.map((fq, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.06] flex items-start justify-between gap-3 group hover:border-emerald-500/40 transition-all"
                        >
                          <div className="text-xs text-slate-200 font-medium leading-relaxed">
                            <span className="text-emerald-400 font-bold mr-2">{idx + 1}.</span>
                            {fq}
                          </div>
                          <button
                            onClick={() => insertQuestionToNotes(fq, 100 + idx)}
                            title="Insert into notes"
                            className="px-2.5 py-1 text-[11px] font-bold bg-slate-900 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-lg shrink-0 border border-white/[0.08] transition-all"
                          >
                            + Notes
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Objections & Rebuttals */}
                {activeTab === 'objections' && (
                  <div className="space-y-3">
                    <div className="text-xs text-slate-400">
                      Anticipated Executive Pushbacks & Field-Tested Rebuttals:
                    </div>

                    <div className="space-y-3">
                      {aiPrep.objections_and_rebuttals.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-slate-950/90 border border-white/[0.06] space-y-2"
                        >
                          <div className="text-xs font-bold text-rose-300 flex items-start gap-2">
                            <span className="uppercase text-[9px] px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono">
                              Pushback:
                            </span>
                            <span>"{item.objection}"</span>
                          </div>
                          <div className="text-xs text-emerald-300 bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/30 leading-relaxed">
                            <span className="font-bold text-emerald-200">Executive Rebuttal: </span>
                            {item.rebuttal}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Diagnostic Strategy (Requirement 7: Do NOT pitch AI upfront) */}
                {activeTab === 'ai_solution' && (
                  <div className="space-y-3">
                    {/* Discovery-First Golden Rule Banner */}
                    <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-900/50 text-xs text-amber-200 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <strong className="text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                          Golden Rule: Never Pitch AI Upfront
                        </strong>
                        <p className="text-[11px] text-amber-200/90 leading-relaxed">
                          Do not prescribe an AI solution before the prospect acknowledges and quantifies their operational bottleneck. Only introduce this diagnostic framework if the executive confirms the challenge during discovery.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Conditional Diagnostic Framework:</span>
                      <button
                        onClick={() => handleCopy(aiPrep.ai_problem_solving, 'ai_pitch')}
                        className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        {copiedSection === 'ai_pitch' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSection === 'ai_pitch' ? 'Copied' : 'Copy Strategy'}</span>
                      </button>
                    </div>

                    <div className="p-4 bg-slate-950/90 border border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                      {aiPrep.ai_problem_solving}
                    </div>

                    {aiPrep.missing_data_notes && aiPrep.missing_data_notes.length > 0 && (
                      <div className="p-3.5 bg-slate-950/80 border border-amber-500/30 rounded-xl space-y-1.5">
                        <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Factual Data Gaps (Verify directly with Executive):</span>
                        </div>
                        <ul className="list-disc pl-4 text-xs text-slate-300 space-y-1">
                          {aiPrep.missing_data_notes.map((gap, i) => (
                            <li key={i}>{gap}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Meeting Close */}
                {activeTab === 'closing' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Low-friction next step meeting request (editable):</span>
                      <button
                        onClick={() => handleCopy(editableClosing, 'closing')}
                        className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        {copiedSection === 'closing' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSection === 'closing' ? 'Copied' : 'Copy Close'}</span>
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={editableClosing}
                      onChange={(e) => setEditableClosing(e.target.value)}
                      className="w-full p-4 text-sm glass-input rounded-xl text-white font-medium leading-relaxed"
                    />
                    <div className="p-3 bg-slate-950/80 border border-white/[0.06] rounded-xl text-[11px] text-slate-400 italic">
                      Always anchor the request on a specific 15-minute timeframe (e.g. Tuesday at 10 AM) to minimize decision friction.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Live Call Terminal & Note-taking */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl glass-panel space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Active Call Console</span>
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                Tabular Log
              </span>
            </div>

            {/* Quick Pinned Actions - Always visible at top without scrolling */}
            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-950/80 rounded-xl border border-white/[0.06]">
              <button
                type="button"
                onClick={handleOpenEmailModal}
                disabled={!activeCompany}
                className="py-2 px-3 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 hover:from-purple-800/70 hover:to-indigo-800/70 border border-purple-500/40 text-purple-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-40 cursor-pointer"
                title="Draft CEO Email directly"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <span>Draft CEO Email</span>
              </button>

              <button
                type="button"
                onClick={handleSaveCall}
                disabled={savingCall || !activeCompany}
                className="py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-40 cursor-pointer"
                title="Save call outcome"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Call</span>
              </button>
            </div>

            {/* Quick Tag Injector Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-slate-400 text-[10px] font-semibold uppercase">Tags:</span>
              <button
                type="button"
                onClick={() => insertQuickTag('Pain Point')}
                className="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-[10px] font-mono transition-colors"
              >
                + Pain Point
              </button>
              <button
                type="button"
                onClick={() => insertQuickTag('Budget Note')}
                className="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-[10px] font-mono transition-colors"
              >
                + Budget
              </button>
              <button
                type="button"
                onClick={() => insertQuickTag('Decision Maker')}
                className="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-[10px] font-mono transition-colors"
              >
                + Stakeholder
              </button>
              <button
                type="button"
                onClick={() => insertQuickTag('Competitor')}
                className="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-[10px] font-mono transition-colors"
              >
                + Competitor
              </button>
              <button
                type="button"
                onClick={() => insertQuickTag('EBITDA Metric')}
                className="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-[10px] font-mono transition-colors"
              >
                + Metric
              </button>
            </div>

            {/* Notes Textarea */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-semibold">
                <span>Executive Notes & Call Takeaways:</span>
                <span className="text-[10px] text-slate-400 font-mono font-normal">
                  {notes.length} chars • {notes.trim() ? notes.trim().split(/\s+/).length : 0} words
                </span>
              </div>
              <textarea
                rows={8}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Log prospect feedback and objections here. Use '+ Notes' buttons on left to auto-inject questions..."
                className="w-full p-3.5 text-xs glass-input rounded-xl text-white placeholder-slate-500 leading-relaxed font-mono focus:border-blue-500"
              />
            </div>

            {/* Next-Step Action Tracker Deck (Requirement 4) */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.08] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                  <span>Next-Step Action Tracker:</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">1-Click Stamp</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleApplyNextStep('Book 15-min Executive Demo', 'Interested', 3)}
                  className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-left font-medium transition-all flex items-center justify-between group"
                >
                  <span>📅 15-Min Exec Demo</span>
                  <span className="text-[9px] font-mono text-emerald-400 opacity-70 group-hover:opacity-100">+3d</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyNextStep('Email EBITDA Case Study & Teardown', 'Follow-up Required', 2)}
                  className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-left font-medium transition-all flex items-center justify-between group"
                >
                  <span>✉️ Send EBITDA Case Study</span>
                  <span className="text-[9px] font-mono text-blue-400 opacity-70 group-hover:opacity-100">+2d</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyNextStep('Direct Phone Callback', 'Follow-up Required', 1)}
                  className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-left font-medium transition-all flex items-center justify-between group"
                >
                  <span>📞 Callback Direct Line</span>
                  <span className="text-[9px] font-mono text-amber-400 opacity-70 group-hover:opacity-100">+1d</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyNextStep('Follow Up with Internal Stakeholder', 'Follow-up Required', 4)}
                  className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-left font-medium transition-all flex items-center justify-between group"
                >
                  <span>👥 Referred Stakeholder</span>
                  <span className="text-[9px] font-mono text-purple-400 opacity-70 group-hover:opacity-100">+4d</span>
                </button>
              </div>

              {followUpDate && (
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Scheduled Target:</span>
                  <span className="font-mono font-bold text-blue-300">{followUpDate} ({callOutcome})</span>
                </div>
              )}
            </div>

            {/* Outcome Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Call Outcome <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Interested', 'Follow-up Required', 'Not Interested', 'No Answer'] as CallOutcome[]).map((outcome) => {
                  const isSelected = callOutcome === outcome;
                  return (
                    <button
                      key={outcome}
                      type="button"
                      onClick={() => setCallOutcome(outcome)}
                      className={`p-2.5 rounded-xl text-xs font-bold text-center border transition-all ${
                        isSelected
                          ? outcome === 'Interested'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/20'
                            : outcome === 'Follow-up Required'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500 shadow-md shadow-blue-500/20'
                            : outcome === 'No Answer'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md shadow-amber-500/20'
                            : 'bg-slate-700/50 text-slate-200 border-slate-500'
                          : 'bg-black/40 text-slate-400 border-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      {outcome}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Follow-up Date */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                <span>Follow-up Date:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPresetFollowUp(1)}
                    className="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-[10px] text-slate-300"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetFollowUp(3)}
                    className="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-[10px] text-slate-300"
                  >
                    +3d
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetFollowUp(7)}
                    className="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-[10px] text-slate-300"
                  >
                    Next Wk
                  </button>
                </div>
              </div>

              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs glass-input rounded-xl text-white font-mono"
              />
            </div>

            {/* Privacy Compliance Callout */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/40 border border-white/[0.06] text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Compliance Standard:</strong> Notes are 100% manual. No unauthorized call recording occurs.
              </span>
            </div>

            {/* Draft Follow-up Email Action */}
            <button
              type="button"
              onClick={handleOpenEmailModal}
              disabled={!activeCompany}
              className="w-full py-2.5 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 hover:from-purple-850/60 hover:to-indigo-850/60 border border-purple-500/40 hover:border-purple-400/60 text-purple-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-950/30 disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Draft CEO Follow-Up Email (Gemini AI)</span>
            </button>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSaveCall}
              disabled={savingCall || !activeCompany}
              className="w-full py-3 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.01]"
            >
              {savingCall ? (
                <span>Recording Call...</span>
              ) : savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Call Successfully Logged!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Call Record</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Executive Follow-Up Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0B1120] border border-white/[0.12] rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
            {/* Modal Header with Quick Action Buttons - Zero Scrolling Needed */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/[0.08] bg-slate-950/80 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                    <span>Executive Follow-Up Email</span>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {emailModelUsed || 'Google Gemini 3.8 Flash'}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    To {activeCompany?.contact_name || 'Executive'} ({activeCompany?.contact_designation || 'Leader'})
                  </p>
                </div>
              </div>

              {!generatingEmail && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-white/[0.1] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedEmail ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenInGmail}
                    className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 rounded-xl shadow-md shadow-rose-600/30 transition-all cursor-pointer hover:scale-[1.02]"
                    title="Opens Gmail compose with pre-filled message"
                  >
                    <Send className="w-3 h-3" />
                    <span>Open in Gmail</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {generatingEmail ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-slate-200">
                    Gemini 3.8 Flash is drafting executive email...
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Synthesizing your call notes, discussed pain points, and EBITDA metrics into an executive-level memo.
                  </p>
                </div>
              ) : (
                <>
                  {/* Recipient Email */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-300 mb-1 font-semibold">
                      <span>Recipient Email Address:</span>
                      <span className="text-[10px] text-slate-400 font-normal">Direct email for {activeCompany?.contact_name || 'Executive'}</span>
                    </div>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="e.g. executive@company.com"
                      className="w-full px-3.5 py-2 text-xs glass-input rounded-xl text-white font-mono placeholder-slate-500"
                    />
                  </div>

                  {/* Subject Line */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-300 mb-1 font-semibold">
                      <span>Subject Line:</span>
                      <span className="text-[10px] text-purple-400 font-normal">Pre-filled by Gemini</span>
                    </div>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs glass-input rounded-xl text-white font-medium"
                    />
                  </div>

                  {/* Body Text */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                      <span className="font-semibold">Message Body:</span>
                      <span className="text-[10px] text-slate-400">Pre-filled by Gemini • Fully editable</span>
                    </div>
                    <textarea
                      rows={5}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="w-full p-4 text-xs glass-input rounded-xl text-slate-200 leading-relaxed font-sans"
                    />
                  </div>

                  {/* Context chips */}
                  <div className="p-3 bg-black/40 border border-white/[0.06] rounded-xl flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
                    <span>
                      Company: <strong className="text-slate-200">{activeCompany?.company_name}</strong>
                    </span>
                    <span>
                      Baseline: <strong className="text-emerald-400">${activeCompany?.ebitda?.toLocaleString()} EBITDA</strong>
                    </span>
                    <span>
                      Next Step: <strong className="text-blue-300">{followUpDate || 'Agreed 15-min check-in'}</strong>
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!generatingEmail && (
              <div className="px-6 py-4 border-t border-white/[0.08] bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleAppendEmailToNotes}
                    className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors border border-white/[0.08]"
                  >
                    Append to Call Notes
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors border border-white/[0.08] flex items-center gap-1.5"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEmail ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {/* Open in Default Mail App (mailto) */}
                  <button
                    type="button"
                    onClick={handleOpenInMailApp}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-white/[0.1] transition-all"
                    title="Opens Outlook or default mail client with Subject and Message pre-filled"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <span>Default Mail App</span>
                  </button>

                  {/* Open in Gmail Web */}
                  <button
                    type="button"
                    onClick={handleOpenInGmail}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 rounded-xl shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02]"
                    title="Opens Gmail compose window in a new tab with Subject and Message pre-filled"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Open in Gmail</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 text-sm">Loading Live Workspace...</div>}>
      <WorkspaceContent />
    </Suspense>
  );
}
