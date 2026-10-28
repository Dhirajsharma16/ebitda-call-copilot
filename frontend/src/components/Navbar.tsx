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
  ShieldAlert,
  Flame,
  Activity,
  Compass
} from 'lucide-react';
import { api } from '@/lib/api';
import { HealthStatus } from '@/lib/types';

function NavbarContent() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);

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

  const navLinks = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Target Accounts', href: '/companies', icon: Building2 },
    { name: 'AI Prospect Discovery', href: '/discovery', icon: Compass },
    { name: 'EBITDA Calculator', href: '/calculator', icon: Calculator },
    { name: 'Live Workspace', href: '/workspace', icon: PhoneCall },
    { name: 'Call History', href: '/calls', icon: Clock },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#080C14]/80 backdrop-blur-xl border-b border-white/[0.08] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 border border-white/20 group-hover:scale-105 transition-all duration-200">
                  <Activity className="w-5 h-5 text-blue-100 group-hover:rotate-6 transition-transform" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#080C14]" />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-white group-hover:text-blue-400 transition-colors">
                    EBITDA<span className="text-blue-500">.</span>COPILOT
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline tracking-tight">
                  Executive Cold Call Intelligence
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/[0.06]">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]'
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
            {/* Health pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/[0.08] text-[11px] text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${health ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${health ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </span>
              <span className="font-mono text-slate-300">
                {health ? (health.groq_configured ? 'Groq Llama 3.3' : 'Rule Synthesis') : 'Standalone Local'}
              </span>
            </div>

            {/* Primary Action */}
            <Link
              href="/workspace"
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-600/30 border border-blue-400/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Start Call</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/95 border-b border-white/[0.08] px-4 pt-2 pb-5 space-y-2 backdrop-blur-xl">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.name}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-white/[0.08] flex flex-col gap-2">
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
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<nav className="h-16 border-b border-white/[0.08] bg-[#080C14]" />}>
      <NavbarContent />
    </Suspense>
  );
}
