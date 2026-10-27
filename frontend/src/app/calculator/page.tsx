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
  Percent
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
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Interactive EBITDA & Margin Modeler
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Calculate Earnings Before Interest, Taxes, Depreciation & Amortization and run sales scenario simulations.
          </p>
        </div>

        {/* Load Company Dropdown */}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCompanyId}
            onChange={(e) => handleCompanySelect(e.target.value)}
            className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">-- Load from Saved Company --</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>
                {c.company_name} ({c.revenue > 0 ? `$${(c.revenue / 1000000).toFixed(1)}M` : 'No Rev'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Inputs vs Real-time Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (5 cols): Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Core Financial Inputs</span>
            </h2>

            {/* Revenue */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Total Revenue ($)</span>
                <span className="text-[11px] text-slate-400 font-normal">Annualized / Base</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={revenue}
                  onChange={(e) => setRevenue(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full pl-7 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Operating Expenses */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Operating Expenses ($)</span>
                <span className="text-[11px] text-slate-400 font-normal">Excl. D&A, Int., Tax</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={operatingExpenses}
                  onChange={(e) => setOperatingExpenses(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full pl-7 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Optional Reconciliation Toggle */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowReconciliation(!showReconciliation)}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center justify-between w-full font-medium"
              >
                <span>{showReconciliation ? '− Hide D&A, Interest & Taxes' : '+ Optional Reconciliation (D&A, Interest, Taxes)'}</span>
              </button>

              {showReconciliation && (
                <div className="mt-4 space-y-3 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Interest ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={interest}
                        onChange={(e) => setInterest(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Taxes ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={taxes}
                        onChange={(e) => setTaxes(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
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
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Amortization ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={amortization}
                        onChange={(e) => setAmortization(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Formula Explanation Callout */}
            <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[11px] text-blue-300 space-y-1">
              <div className="font-semibold text-blue-200">Standard EBITDA Formula:</div>
              <div>• EBITDA = Revenue − OpEx (excl. D&A, Int., Tax)</div>
              <div>• EBITDA Margin (%) = (EBITDA / Revenue) × 100</div>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Calculated Actuals & What-If Scenario */}
        <div className="lg:col-span-7 space-y-6">
          {/* Baseline EBITDA Output Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* EBITDA Card */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Current EBITDA
              </div>
              <div className="mt-2 text-3xl font-extrabold font-mono text-emerald-400">
                ${calculationResult ? calculationResult.ebitda.toLocaleString() : '0'}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Revenue: ${revenue.toLocaleString()}
              </div>
            </div>

            {/* Margin Card */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  EBITDA Margin
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${getMarginBadgeClass(calculationResult?.margin_classification)}`}>
                  {calculationResult?.margin_classification || 'Calculating...'}
                </span>
              </div>
              <div className="mt-2 text-3xl font-extrabold font-mono text-blue-400">
                {calculationResult ? calculationResult.ebitda_margin_pct.toFixed(1) : '0.0'}%
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Operating Cost: ${operatingExpenses.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Interactive What-If Scenario Modeler */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-blue-500/30 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Hypothetical Scenario Modeler ("What-If" Analysis)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                Sales Strategy Simulator
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 text-[11px]">Quick Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset(0, 5)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] transition-colors"
              >
                OpEx -5% (Automation)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(3, 4)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] transition-colors"
              >
                +3% Rev / -4% Cost
              </button>
              <button
                type="button"
                onClick={() => applyPreset(0, 8)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] transition-colors"
              >
                OpEx -8% (Deep Streamlining)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(0, 0)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-[11px]"
                title="Reset scenario sliders"
              >
                Reset
              </button>
            </div>

            {/* Sliders */}
            <div className="space-y-4 pt-2">
              {/* Slider 1: Cost Reduction */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">
                    Hypothetical Operating Cost Reduction (%):
                  </span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
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
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0% (Status Quo)</span>
                  <span>10% (Target Optimization)</span>
                  <span>25% (Major Restructure)</span>
                </div>
              </div>

              {/* Slider 2: Revenue Change */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">
                    Hypothetical Revenue Change (%):
                  </span>
                  <span className={`font-mono font-bold text-sm ${revChangePct >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
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
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>-20% (Contraction)</span>
                  <span>0% (Flat)</span>
                  <span>+30% (Growth)</span>
                </div>
              </div>
            </div>

            {/* Projected Scenario Results Grid */}
            {calculationResult?.scenario && (
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">Projected EBITDA</div>
                    <div className="mt-1 font-mono font-bold text-emerald-400 text-base">
                      ${calculationResult.scenario.projected_ebitda.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">Projected Margin</div>
                    <div className="mt-1 font-mono font-bold text-blue-400 text-base">
                      {calculationResult.scenario.projected_ebitda_margin_pct.toFixed(1)}%
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">EBITDA Delta</div>
                    <div className={`mt-1 font-mono font-bold text-base ${calculationResult.scenario.ebitda_delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {calculationResult.scenario.ebitda_delta >= 0 ? '+' : ''}${calculationResult.scenario.ebitda_delta.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">Margin Delta</div>
                    <div className={`mt-1 font-mono font-bold text-base ${calculationResult.scenario.margin_delta_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {calculationResult.scenario.margin_delta_pct >= 0 ? '+' : ''}{calculationResult.scenario.margin_delta_pct.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Important Disclaimer */}
                <div className="flex items-start gap-2 pt-2 text-[11px] text-amber-300/90 italic">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    {calculationResult.scenario.disclaimer}
                  </span>
                </div>
              </div>
            )}

            {/* Launch Call with this scenario */}
            <div className="flex justify-end pt-2">
              <Link
                href={selectedCompanyId ? `/workspace?companyId=${selectedCompanyId}` : '/workspace'}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-md transition-all"
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
