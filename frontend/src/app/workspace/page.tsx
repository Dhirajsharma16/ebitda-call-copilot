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
  Send
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
  const [editableQuestions, setEditableQuestions] = useState<string[]>([]);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Call Console States
  const [notes, setNotes] = useState<string>('');
  const [callOutcome, setCallOutcome] = useState<CallOutcome>('Interested');
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [savingCall, setSavingCall] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Timer States
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Load Companies
  useEffect(() => {
    loadCompanies();
  }, []);

  // When selected company changes
  useEffect(() => {
    if (selectedCompanyId && companies.length > 0) {
      const comp = companies.find(c => c.id === selectedCompanyId) || null;
      setActiveCompany(comp);
      if (comp) {
        generateStrategy(comp);
      }
    } else if (companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id);
      setActiveCompany(companies[0]);
      generateStrategy(companies[0]);
    }
  }, [selectedCompanyId, companies]);

  // Call timer interval
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
      setEditableQuestions([...prep.discovery_questions, ...prep.financial_efficiency_questions]);
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

  const insertQuestionToNotes = (question: string) => {
    const formatted = `\n• Q: ${question}\n  A: `;
    setNotes(prev => prev ? `${prev}${formatted}` : `• Q: ${question}\n  A: `);
  };

  const setPresetFollowUp = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setFollowUpDate(d.toISOString().split('T')[0]);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Top Workspace Header Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Company & Contact summary */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative">
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="text-sm font-bold bg-slate-950 border border-blue-500/40 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500 pr-8"
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          </div>

          {activeCompany && (
            <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-white">
                <User className="w-3.5 h-3.5 text-blue-400" />
                {activeCompany.contact_name || 'Prospect Contact'}
                {activeCompany.contact_designation && (
                  <span className="text-slate-400 font-normal">({activeCompany.contact_designation})</span>
                )}
              </span>

              {activeCompany.revenue > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                  EBITDA: {activeCompany.ebitda_margin_pct.toFixed(1)}% (${(activeCompany.ebitda / 1000000).toFixed(1)}M)
                </span>
              )}

              {activeCompany.location && (
                <span className="text-slate-400 hidden lg:inline">
                  • {activeCompany.location}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Live Call Timer */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className={`w-2.5 h-2.5 rounded-full ${isTimerRunning ? 'bg-rose-500 animate-ping' : 'bg-slate-600'}`} />
            <span className="text-xs text-slate-400">Duration:</span>
            <span className="font-mono font-bold text-white text-sm">
              {formatTimer(callDuration)}
            </span>
          </div>

          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isTimerRunning 
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
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
            title="Reset Timer"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Two-Column Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): AI Call Prep & Talking Points */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-4">
            {/* AI Header & Model Badge */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    AI Cold Call Intelligence
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Targeted framing for CEO/MD cold conversations
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {aiPrep && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    {aiPrep.is_simulated ? 'Synthesis Engine' : `Groq: ${aiPrep.model_used}`}
                  </span>
                )}
                <button
                  onClick={() => activeCompany && generateStrategy(activeCompany)}
                  disabled={generatingAI}
                  className="px-2.5 py-1 text-xs font-semibold bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className={`w-3 h-3 ${generatingAI ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>

            {/* AI Notice / Fallback indicator if any */}
            {aiPrep?.warning_or_notice && (
              <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{aiPrep.warning_or_notice}</span>
              </div>
            )}

            {/* Navigation Tabs for Strategy */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('opening')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeTab === 'opening'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                1. Opening Line
              </button>
              <button
                onClick={() => setActiveTab('discovery')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeTab === 'discovery'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                2. Discovery
              </button>
              <button
                onClick={() => setActiveTab('financial')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeTab === 'financial'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                3. Financial Framing
              </button>
              <button
                onClick={() => setActiveTab('objections')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeTab === 'objections'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                4. Objections ({aiPrep?.objections_and_rebuttals?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('ai_solution')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeTab === 'ai_solution'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                5. AI Pitch
              </button>
              <button
                onClick={() => setActiveTab('closing')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeTab === 'closing'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                6. Closing Line
              </button>
            </div>

            {/* Tab Contents */}
            {generatingAI ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <Sparkles className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
                <p>Generating executive cold call framing...</p>
              </div>
            ) : !aiPrep ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                Select a company to generate call strategy.
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                {/* 1. Opening Line */}
                {activeTab === 'opening' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Peer-to-peer opening statement (editable):</span>
                      <button
                        onClick={() => handleCopy(editableOpening, 'opening')}
                        className="flex items-center gap-1 text-blue-400 hover:underline"
                      >
                        {copiedSection === 'opening' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSection === 'opening' ? 'Copied' : 'Copy Line'}</span>
                      </button>
                    </div>

                    <textarea
                      rows={4}
                      value={editableOpening}
                      onChange={(e) => setEditableOpening(e.target.value)}
                      className="w-full p-3.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white font-medium leading-relaxed focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-[11px] text-slate-400 italic">
                      Tip: Deliver this opening with steady pacing. Pause for 2 full seconds immediately after the question mark to invite their reply.
                    </p>
                  </div>
                )}

                {/* 2. Discovery Questions */}
                {activeTab === 'discovery' && (
                  <div className="space-y-3">
                    <div className="text-xs text-slate-400 flex items-center justify-between">
                      <span>Targeted Executive Discovery Questions:</span>
                      <span className="text-[11px]">Click "+ Notes" to append into active notes</span>
                    </div>

                    <div className="space-y-2.5">
                      {aiPrep.discovery_questions.map((q, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-3 group hover:border-slate-700"
                        >
                          <div className="text-xs text-slate-200 font-medium leading-relaxed">
                            <span className="text-blue-400 font-bold mr-1.5">{idx + 1}.</span>
                            {q}
                          </div>
                          <button
                            onClick={() => insertQuestionToNotes(q)}
                            title="Insert question into call notes"
                            className="px-2 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-md shrink-0 transition-colors"
                          >
                            + Notes
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Financial & Efficiency Questions */}
                {activeTab === 'financial' && (
                  <div className="space-y-3">
                    <div className="text-xs text-slate-400 flex items-center justify-between">
                      <span>Profitability & Operating Cost Questions:</span>
                      <span className="text-[11px]">Framed around EBITDA sensitivity</span>
                    </div>

                    <div className="space-y-2.5">
                      {aiPrep.financial_efficiency_questions.map((fq, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-3 group hover:border-slate-700"
                        >
                          <div className="text-xs text-slate-200 font-medium leading-relaxed">
                            <span className="text-emerald-400 font-bold mr-1.5">{idx + 1}.</span>
                            {fq}
                          </div>
                          <button
                            onClick={() => insertQuestionToNotes(fq)}
                            title="Insert question into call notes"
                            className="px-2 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-md shrink-0 transition-colors"
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
                      Common Executive Pushbacks & Recommended Rebuttals:
                    </div>

                    <div className="space-y-3">
                      {aiPrep.objections_and_rebuttals.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                        >
                          <div className="text-xs font-bold text-rose-300 flex items-start gap-1.5">
                            <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
                              Objection:
                            </span>
                            <span>"{item.objection}"</span>
                          </div>
                          <div className="text-xs text-emerald-300 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-900/30 leading-relaxed">
                            <span className="font-semibold text-emerald-200">Suggested Rebuttal: </span>
                            {item.rebuttal}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. AI Problem Solving Pitch */}
                {activeTab === 'ai_solution' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>How AI Diagnoses & Investigates the Problem:</span>
                      <button
                        onClick={() => handleCopy(aiPrep.ai_problem_solving, 'ai_pitch')}
                        className="flex items-center gap-1 text-blue-400 hover:underline"
                      >
                        {copiedSection === 'ai_pitch' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSection === 'ai_pitch' ? 'Copied' : 'Copy Pitch'}</span>
                      </button>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {aiPrep.ai_problem_solving}
                    </div>

                    {aiPrep.missing_data_notes && aiPrep.missing_data_notes.length > 0 && (
                      <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl space-y-1">
                        <div className="text-[11px] font-bold text-amber-300">
                          Data Gaps to Verify on Call (Don't Assume):
                        </div>
                        <ul className="list-disc pl-4 text-[11px] text-amber-200/80 space-y-0.5">
                          {aiPrep.missing_data_notes.map((gap, i) => (
                            <li key={i}>{gap}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Closing Line */}
                {activeTab === 'closing' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Natural Closing Meeting Request (editable):</span>
                      <button
                        onClick={() => handleCopy(editableClosing, 'closing')}
                        className="flex items-center gap-1 text-blue-400 hover:underline"
                      >
                        {copiedSection === 'closing' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSection === 'closing' ? 'Copied' : 'Copy Close'}</span>
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={editableClosing}
                      onChange={(e) => setEditableClosing(e.target.value)}
                      className="w-full p-3.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white font-medium leading-relaxed focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-[11px] text-slate-400 italic">
                      Low friction ask: Propose a specific day and time rather than an open-ended "when are you free?".
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Live Call Console & Note-taking */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <span>Active Call Console</span>
              </h2>
              <span className="text-[10px] text-slate-400">
                Auto-saves on submit
              </span>
            </div>

            {/* Call Notes Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Call Notes & Executive Responses:</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {notes.length} characters
                </span>
              </label>
              <textarea
                rows={9}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type real-time prospect responses here... Click '+ Notes' on any discovery question to auto-insert prompts."
                className="w-full p-3 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 leading-relaxed font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Call Outcome Selector */}
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
                      className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all ${
                        isSelected
                          ? outcome === 'Interested'
                            ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500'
                            : outcome === 'Follow-up Required'
                            ? 'bg-blue-600/20 text-blue-300 border-blue-500'
                            : outcome === 'No Answer'
                            ? 'bg-amber-600/20 text-amber-300 border-amber-500'
                            : 'bg-slate-700/40 text-slate-300 border-slate-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {outcome}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next Follow-up Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Next Follow-up Date:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPresetFollowUp(1)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:bg-slate-700"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetFollowUp(3)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:bg-slate-700"
                  >
                    +3 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetFollowUp(7)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:bg-slate-700"
                  >
                    Next Week
                  </button>
                </div>
              </label>

              <div className="relative">
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Privacy & Recording Disclaimer */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Ethical Standard:</strong> No covert audio recording is performed. Notes are strictly manual and user-controlled.
              </span>
            </div>

            {/* Save Call Button */}
            <button
              type="button"
              onClick={handleSaveCall}
              disabled={savingCall || !activeCompany}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.01]"
            >
              {savingCall ? (
                <span>Saving Record...</span>
              ) : savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Call Record Saved!</span>
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
