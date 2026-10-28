'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Building2, 
  Calculator, 
  PhoneCall, 
  Clock, 
  Menu, 
  X, 
  Sparkles, 
  Database, 
  CheckCircle2, 
  AlertTriangle,
  ShieldAlert,
  Flame,
  Activity,
  Compass,
  Key,
  ShieldCheck,
  Check,
  Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import { HealthStatus } from '@/lib/types';

function NavbarContent() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  // Gemini API Key Modal
  const [mounted, setMounted] = useState(false);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [keySavedMessage, setKeySavedMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const h = await api.getHealth();
      setHealth(h);
    } catch {
      setHealth(null);
    }
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey(true);
    setKeySavedMessage(null);
    try {
      await api.updateGeminiKey(inputKey);
      await checkHealth();
      setKeySavedMessage('Gemini API Key activated successfully!');
      setTimeout(() => {
        setKeyModalOpen(false);
        setKeySavedMessage(null);
      }, 1500);
    } catch (err: any) {
      setKeySavedMessage(err.message || 'Failed to update key');
    } finally {
      setSavingKey(false);
    }
  };

  const navLinks = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Target Accounts', href: '/companies', icon: Building2 },
    { name: 'AI Prospect Discovery', href: '/discovery', icon: Compass },
    { name: 'EBITDA Calculator', href: '/calculator', icon: Calculator },
    { name: 'Live Workspace', href: '/workspace', icon: PhoneCall },
    { name: 'Call History', href: '/calls', icon: Clock },
  ];

  const isGeminiActive = Boolean(health?.gemini_configured);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#080C14]/90 backdrop-blur-xl border-b border-slate-800 text-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Identity */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 border border-white/20 group-hover:scale-105 transition-all duration-200">
                    <Activity className="w-5 h-5 text-blue-100 group-hover:rotate-6 transition-transform" />
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#080C14] ${isGeminiActive ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base tracking-tight text-white group-hover:text-blue-400 transition-colors">
                      EBITDA<span className="text-blue-500">.</span>COPILOT
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-300 font-semibold hidden sm:inline tracking-tight">
                    Executive Cold Call Intelligence
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold tracking-tight transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* System Status & Quick Actions */}
            <div className="hidden lg:flex items-center gap-3">
              {/* AI Key Status Button */}
              <button
                onClick={() => setKeyModalOpen(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                  isGeminiActive
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
                    : 'bg-amber-950/60 text-amber-300 border-amber-500/40 hover:bg-amber-900/50'
                }`}
                title="Configure Gemini API Key"
              >
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isGeminiActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isGeminiActive ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                </span>
                <span className="font-mono text-xs">
                  {isGeminiActive ? 'Gemini 3.8 Flash' : 'AI Key (Synthesis)'}
                </span>
                <Key className="w-3 h-3 opacity-80 ml-0.5" />
              </button>

              {/* Primary Action */}
              <Link
                href="/workspace"
                className="flex items-center gap-2 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-600/30 border border-blue-400/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Start Call</span>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-5 space-y-2 backdrop-blur-xl">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setKeyModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 rounded-xl"
              >
                <Key className="w-4 h-4" />
                {isGeminiActive ? 'Gemini AI Configured' : 'Configure Gemini API Key'}
              </button>

              <Link
                href="/workspace"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-blue-600 rounded-xl"
              >
                <PhoneCall className="w-4 h-4" />
                Launch Live Workspace
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Gemini API Key Configuration Modal - Portaled to document.body */}
      {mounted && keyModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0F172A] border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Google Gemini Configuration</h3>
                  <p className="text-xs text-slate-400 font-medium">Activate live AI models for cold call strategy</p>
                </div>
              </div>
              <button
                onClick={() => setKeyModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveKey} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 leading-relaxed font-medium">
                Enter your Google Gemini API Key below to power live <strong>gemini-3.8-flash</strong> responses across Cold Call Workspace, Follow-up Email drafting, and Company Intelligence.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 uppercase tracking-wide">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  placeholder="Paste your AIzaSy... key here"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full bg-[#0B132B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-blue-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Don't have a key? Get a free key at{' '}
                  <a
                    href="https://aistudio.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline hover:text-blue-300 font-semibold"
                  >
                    aistudio.google.com
                  </a>
                </span>
              </div>

              {keySavedMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{keySavedMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setKeyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingKey || !inputKey.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  {savingKey ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Save & Activate
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<nav className="h-16 border-b border-slate-800 bg-[#080C14]" />}>
      <NavbarContent />
    </Suspense>
  );
}
