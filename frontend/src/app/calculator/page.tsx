'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Sliders, 
  AlertCircle, 
  HelpCircle, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  PhoneCall,
  Check,
  Building2,
  Percent,
  TrendingDown,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { api } from '@/lib/api';
import { Company, EBITDACalculationResponse } from '@/lib/types';

export default function CalculatorPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  // Primary Inputs
  const [revenue, setRevenue] = useState<number>(42500000);
  const [operatingExpenses, setOperatingExpenses] = useState<number>(38250000);

  // Optional Reconciliation Inputs
  const [showReconciliation, setShowReconciliation] = useState<boolean>(false);
  const [interest, setInterest] = useState<number>(0);
  const [taxes, setTaxes] = useState<number>(0);
  const [depreciation, setDepreciation] = useState<number>(0);
  const [amortization, setAmortization] = useState<number>(0);

  // Scenario Modeler Inputs
  const [revChangePct, setRevChangePct] = useState<number>(0);
  const [costReductionPct, setCostReductionPct] = useState<number>(5);

  const [calculationResult, setCalculationResult] = useState<EBITDACalculationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    runCalculation();
  }, [revenue, operatingExpenses, interest, taxes, depreciation, amortization, revChangePct, costReductionPct]);

  const loadCompanies = async () => {
    try {
      const list = await api.getCompanies();
      setCompanies(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompanySelect = (compId: string) => {
    setSelectedCompanyId(compId);
    const comp = companies.find(c => c.id === compId);
    if (comp) {
      setRevenue(comp.revenue || 0);
      setOperatingExpenses(comp.operating_expenses || 0);
      setRevChangePct(0);
      setCostReductionPct(5);
    }
  };

  const runCalculation = async () => {
    setLoading(true);
    try {
      const res = await api.calculateEBITDA({
        revenue,
        operating_expenses: operatingExpenses,
        interest,
        taxes,
        depreciation,
        amortization,
        hypothetical_revenue_change_pct: revChangePct,
        hypothetical_cost_reduction_pct: costReductionPct,
      });
      setCalculationResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (revPct: number, costPct: number) => {
    setRevChangePct(revPct);
    setCostReductionPct(costPct);
  };

  const getMarginBadgeClass = (classification?: string) => {
    if (!classification) return 'bg-slate-800 text-slate-300';
    if (classification.includes('High') || classification.includes('Healthy')) {
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    }
    if (classification.includes('Moderate')) {
      return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
    }
    if (classification.includes('Compressed')) {
      return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
    }
    return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Title & Account Picker */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Calculator className="w-3.5 h-3.5" />
              Corporate Finance Modeler
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            EBITDA & Profitability Simulator
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Accurately model Earnings Before Interest, Taxes, Depreciation & Amortization, then stress-test cost optimizations for executive calls.
          </p>
        </div>

        {/* Account Selector */}
        <div className="flex items-center gap-2 self-start lg:self-auto bg-slate-900/80 p-1.5 rounded-xl border border-white/[0.08]">
          <Building2 className="w-4 h-4 text-blue-400 ml-2" />
          <select
            value={selectedCompanyId}
            onChange={(e) => handleCompanySelect(e.target.value)}
            className="text-xs bg-transparent text-white font-semibold focus:outline-none pr-3 py-1 cursor-pointer"
          >
            <option value="" className="bg-slate-950">-- Load From Target Account --</option>
            {companies.map(c => (
              <option key={c.id} value={c.id} className="bg-slate-950">
                {c.company_name} ({c.revenue > 0 ? `$${(c.revenue / 1000000).toFixed(1)}M Rev` : 'No Rev'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Inputs vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (5 cols): Input Ledger */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl glass-panel space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Operating Financial Baseline</span>
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">USD ($)</span>
            </div>

            {/* Total Revenue */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Total Annual Revenue</span>
                <span className="text-[11px] text-slate-400 font-mono">Base</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">$</span>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={revenue}
                  onChange={(e) => setRevenue(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full pl-8 pr-4 py-2.5 text-sm glass-input rounded-xl text-white font-mono font-bold tabular-nums"
                />
              </div>
            </div>

            {/* Operating Expenses */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Operating Expenses (OpEx)</span>
                <span className="text-[10px] text-slate-400">Excl. D&A, Int., Tax</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">$</span>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={operatingExpenses}
                  onChange={(e) => setOperatingExpenses(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full pl-8 pr-4 py-2.5 text-sm glass-input rounded-xl text-white font-mono font-bold tabular-nums"
                />
              </div>
            </div>

            {/* Optional Reconciliation Toggle */}
            <div className="pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setShowReconciliation(!showReconciliation)}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center justify-between w-full py-1 transition-colors"
              >
                <span>{showReconciliation ? '− Collapse D&A, Interest & Taxes' : '+ Optional D&A, Interest & Taxes Reconciliation'}</span>
              </button>

              {showReconciliation && (
                <div className="mt-3 space-y-3 p-4 bg-black/40 rounded-xl border border-white/[0.06] animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Interest ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={interest}
                        onChange={(e) => setInterest(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 text-xs glass-input rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Taxes ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={taxes}
                        onChange={(e) => setTaxes(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 text-xs glass-input rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Depreciation ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={depreciation}
                        onChange={(e) => setDepreciation(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 text-xs glass-input rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Amortization ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={amortization}
                        onChange={(e) => setAmortization(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 text-xs glass-input rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Formula Reference Box */}
            <div className="p-3.5 bg-blue-950/20 border border-blue-900/30 rounded-xl text-xs text-blue-300/90 space-y-1.5 font-mono">
              <div className="font-bold text-blue-200 text-[11px] uppercase tracking-wider">Executive Formula:</div>
              <div className="text-[11px]">• EBITDA = Revenue − OpEx</div>
              <div className="text-[11px]">• Margin (%) = (EBITDA / Revenue) × 100</div>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Calculated Actuals & Interactive Modeler */}
        <div className="lg:col-span-7 space-y-6">
          {/* Baseline Output Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* EBITDA Card */}
            <div className="p-5 rounded-2xl glass-panel relative overflow-hidden">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Current Reported EBITDA
              </div>
              <div className="mt-2 text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
                ${calculationResult ? calculationResult.ebitda.toLocaleString() : '0'}
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-white/[0.06]">
                <span>Base Revenue:</span>
                <span className="font-mono text-white">${revenue.toLocaleString()}</span>
              </div>
            </div>

            {/* Margin Card */}
            <div className="p-5 rounded-2xl glass-panel relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  EBITDA Margin
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${getMarginBadgeClass(calculationResult?.margin_classification)}`}>
                  {calculationResult?.margin_classification || 'Calculating...'}
                </span>
              </div>
              <div className="mt-2 text-3xl font-extrabold font-mono text-blue-400 tabular-nums">
                {calculationResult ? calculationResult.ebitda_margin_pct.toFixed(1) : '0.0'}%
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-white/[0.06]">
                <span>Base OpEx:</span>
                <span className="font-mono text-white">${operatingExpenses.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Interactive What-If Modeler */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-blue-500/30 shadow-2xl space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Executive "What-If" Sensitivity Simulator
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Demonstrate bottom-line impact of operational streamlining
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 uppercase font-mono">
                Interactive Modeler
              </span>
            </div>

            {/* Quick Strategy Presets */}
            <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
              <span className="text-slate-400 text-[11px] font-semibold uppercase">Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset(0, 5)}
                className="px-2.5 py-1 bg-white/[0.06] hover:bg-blue-600 hover:text-white text-slate-300 rounded-lg text-xs font-medium transition-all"
              >
                OpEx -5% (Process AI)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(3, 4)}
                className="px-2.5 py-1 bg-white/[0.06] hover:bg-blue-600 hover:text-white text-slate-300 rounded-lg text-xs font-medium transition-all"
              >
                +3% Rev / -4% Cost
              </button>
              <button
                type="button"
                onClick={() => applyPreset(0, 8)}
                className="px-2.5 py-1 bg-white/[0.06] hover:bg-blue-600 hover:text-white text-slate-300 rounded-lg text-xs font-medium transition-all"
              >
                OpEx -8% (Deep Consolidation)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(0, 0)}
                className="px-2 py-1 bg-white/[0.04] hover:bg-slate-700 text-slate-400 rounded-lg text-xs"
                title="Reset sliders"
              >
                Reset
              </button>
            </div>

            {/* Sliders */}
            <div className="space-y-4 pt-2">
              {/* Slider 1: Cost Reduction */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">
                    Hypothetical OpEx Optimization (%):
                  </span>
                  <span className="font-mono font-bold text-emerald-400 text-sm bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {costReductionPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="0.5"
                  value={costReductionPct}
                  onChange={(e) => setCostReductionPct(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0% (Status Quo)</span>
                  <span>10% (Target Streamlining)</span>
                  <span>25% (Transformative)</span>
                </div>
              </div>

              {/* Slider 2: Revenue Change */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">
                    Hypothetical Revenue Variance (%):
                  </span>
                  <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded border ${
                    revChangePct >= 0 
                      ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' 
                      : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                  }`}>
                    {revChangePct > 0 ? `+${revChangePct}%` : `${revChangePct}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="30"
                  step="1"
                  value={revChangePct}
                  onChange={(e) => setRevChangePct(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>-20% (Contraction)</span>
                  <span>0% (Neutral)</span>
                  <span>+30% (Expansion)</span>
                </div>
              </div>
            </div>

            {/* Projected Scenario Ledger Grid */}
            {calculationResult?.scenario && (
              <div className="p-4 sm:p-5 bg-black/60 rounded-xl border border-white/[0.08] space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/[0.06]">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Projected EBITDA</div>
                    <div className="mt-1 font-mono font-extrabold text-emerald-400 text-base tabular-nums">
                      ${calculationResult.scenario.projected_ebitda.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-white/[0.06]">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Projected Margin</div>
                    <div className="mt-1 font-mono font-extrabold text-blue-400 text-base tabular-nums">
                      {calculationResult.scenario.projected_ebitda_margin_pct.toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-white/[0.06]">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">EBITDA Delta ($)</div>
                    <div className={`mt-1 font-mono font-extrabold text-base tabular-nums ${calculationResult.scenario.ebitda_delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {calculationResult.scenario.ebitda_delta >= 0 ? '+' : ''}${calculationResult.scenario.ebitda_delta.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-white/[0.06]">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Margin Delta (bps)</div>
                    <div className={`mt-1 font-mono font-extrabold text-base tabular-nums ${calculationResult.scenario.margin_delta_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {calculationResult.scenario.margin_delta_pct >= 0 ? '+' : ''}{calculationResult.scenario.margin_delta_pct.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Prominent Disclaimer */}
                <div className="flex items-start gap-2.5 pt-2 text-[11px] text-amber-300/90 italic bg-amber-950/20 p-3 rounded-lg border border-amber-900/30">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    {calculationResult.scenario.disclaimer}
                  </span>
                </div>
              </div>
            )}

            {/* Launch Call with this scenario */}
            <div className="flex justify-end pt-1">
              <Link
                href={selectedCompanyId ? `/workspace?companyId=${selectedCompanyId}` : '/workspace'}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Open in Live Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
