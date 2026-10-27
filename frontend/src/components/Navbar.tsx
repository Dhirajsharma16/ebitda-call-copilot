'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
  RotateCcw
} from 'lucide-react';
import { api } from '@/lib/api';
import { HealthStatus } from '@/lib/types';

function NavbarContent() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loadingSeed, setLoadingSeed] = useState(false);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
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

  const handleSeed = async () => {
    setLoadingSeed(true);
    try {
      const res = await api.seedDemo();
      setSeedNotice(res.message);
      setTimeout(() => setSeedNotice(null), 4000);
      window.location.reload();
    } catch {
      setSeedNotice('Error refreshing demo data');
      setTimeout(() => setSeedNotice(null), 3000);
    } finally {
      setLoadingSeed(false);
    }
  };

  const navLinks = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Companies', href: '/companies', icon: Building2 },
    { name: 'EBITDA Calculator', href: '/calculator', icon: Calculator },
    { name: 'Live Workspace', href: '/workspace', icon: PhoneCall },
    { name: 'Call History', href: '/calls', icon: Clock },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight text-white">EBITDA Copilot</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-md">
                    AI Cold Call
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:inline">Executive Sales & Margin Strategy</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Status & Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* System Status Pill */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <div className={`w-2 h-2 rounded-full ${health ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="font-mono text-[11px]">
                {health ? (health.groq_configured ? 'Groq AI Live' : 'AI Fallback') : 'Standalone Mode'}
              </span>
            </div>

            {/* Reset / Demo seed button */}
            <button
              onClick={handleSeed}
              disabled={loadingSeed}
              title="Reset with realistic demo companies & calls"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 hover:text-white border border-slate-700/60 rounded-lg transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loadingSeed ? 'animate-spin' : ''}`} />
              <span>Demo Data</span>
            </button>

            {/* Quick Action: Start Call Session */}
            <Link
              href="/workspace"
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Start Call</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast for demo seed */}
      {seedNotice && (
        <div className="bg-blue-600 text-white text-xs font-medium text-center py-1.5 px-4 shadow-sm animate-fade-in">
          {seedNotice}
        </div>
      )}

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 text-blue-400" />
                {link.name}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleSeed();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-300 bg-slate-800 rounded-lg"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Demo Data
            </button>
            <Link
              href="/workspace"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg"
            >
              <PhoneCall className="w-4 h-4" />
              Start Live Call Session
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<nav className="h-16 border-b border-slate-800 bg-[#0B0F19]" />}>
      <NavbarContent />
    </Suspense>
  );
}
