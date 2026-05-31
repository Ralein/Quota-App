'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  Zap
} from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [menuOpen, setMenuOpen] = useState(false);

  // Sync theme with document element on mount & change
  useEffect(() => {
    const savedTheme = localStorage.getItem('nq_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('nq_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Saved Bills', path: '/saved', icon: FileText },
    { name: 'Clients', path: '/clients', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Global Header - Hidden during window.print() */}
      <header className="no-print sticky top-0 z-50 bg-card-bg/60 backdrop-blur-xl border-b border-border-main transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between relative">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl text-text-main group shrink-0">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary group-hover:bg-primary/25 transition-colors duration-300">
              <Zap size={20} strokeWidth={2.5} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="tracking-tight">Nexa</span>
              <span className="text-primary font-extrabold">Quote</span>
            </div>
          </Link>

          {/* Desktop Navigation - Centered absolutely */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => {
              const active = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-lg transition-all duration-200 ${
                    active
                      ? 'text-primary bg-primary/8 font-semibold'
                      : 'text-text-muted hover:text-text-main hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Controls bar */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted border border-border-main bg-white/[0.02] hover:text-primary hover:bg-primary/8 hover:border-primary/20 transition-all duration-200 cursor-pointer"
              aria-label="Toggle light/dark theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex md:hidden w-9 h-9 rounded-lg items-center justify-center text-text-muted border border-border-main bg-white/[0.02] hover:text-primary hover:bg-primary/8 transition-all duration-200 cursor-pointer"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {menuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-app-bg/95 backdrop-blur-xl border-b border-border-main px-6 py-4 flex flex-col gap-1.5 shadow-lg md:hidden animate-fade-in z-50">
            {navItems.map((item) => {
              const active = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    active
                      ? 'text-primary bg-primary/8 font-semibold'
                      : 'text-text-muted hover:text-text-main hover:bg-white/5'
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full max-w-6xl mx-auto p-6">
        {children}
      </main>
    </>
  );
}
