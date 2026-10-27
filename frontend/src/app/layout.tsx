import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'AI EBITDA Cold Call Copilot | Executive Sales & Margin Strategy',
  description: 'AI-powered Cold Call Copilot helping business development executives discuss EBITDA, prepare intelligent discovery questions, and conduct strategic sales conversations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>

        <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">AI EBITDA Cold Call Copilot</span>
              <span>•</span>
              <span>Executive Sales Intelligence Platform</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>Next.js • FastAPI • Supabase • Groq LLM</span>
              <span>•</span>
              <span className="text-blue-400">Production Ready</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
